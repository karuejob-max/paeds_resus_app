import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { createAuditLog, getDb } from "../db";
import { assertTrainingWorkspaceOrAdmin } from "../lib/training-workspace-guard";
import {
  ahaPracticeLabAttempts,
  enrollments,
  userProgress,
  quizQuestions,
  simulationWorldCommandReceipts,
  simulationWorldEvidence,
  simulationWorldSessions,
  users,
} from "../../drizzle/schema";
import {
  PRACTICE_LAB_TRACKS,
  FORMATIVE_PRACTICE_LAB_TRACKS,
  isFormativePracticeLabTrack,
  WEAK_DOMAIN_TO_TRACK,
  type PracticeLabTrackId,
} from "../../shared/practice-lab-types";
import { advanceSimulationWorld, createSimulationWorld, isSimulationWorldCommandAllowed, isSimulationWorldScenarioCompatible, reduceSimulationWorld, replaySimulationWorldAttempt, SIMULATION_WORLD_ROLES, SIMULATION_WORLD_SCENARIOS, type SimulationWorldEvent, type SimulationWorldRole, type SimulationWorldScenarioId, type SimulationWorldState, type SimulationWorldCommand } from "../../shared/simulation-world";
import { ADULT_ACLS_SCENARIOS, ADULT_ACLS_SCENARIO_VERSION, ADULT_ACLS_WORLD_VERSION, advanceAdultAclsSimulation, calculateAdultAclsTrainingEvidence, createAdultAclsSimulation, reduceAdultAclsSimulation, type AdultAclsCommand, type AdultAclsScenarioId, type AdultAclsState } from "../../shared/adult-acls-simulation-world";

const AHA_PROGRAM_TYPES = ["bls", "acls", "pals", "heartsaver", "nrp"] as const;

const BOOSTER_INTERVALS_DAYS = [1, 3, 7, 14, 30];

async function requireAdultAclsReviewer(ctx: { user: { id: number } }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const [reviewer] = await db.select({ role: users.role, instructorApprovedAt: users.instructorApprovedAt })
    .from(users).where(eq(users.id, ctx.user.id)).limit(1);
  if (!reviewer || (reviewer.role !== "admin" && !reviewer.instructorApprovedAt)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only platform administrators or approved instructors can review Adult ACLS simulation evidence." });
  }
  return db;
}

async function fetchEligibleEnrollments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: enrollments.id,
      programType: enrollments.programType,
      cognitiveModulesComplete: enrollments.cognitiveModulesComplete,
      paymentStatus: enrollments.paymentStatus,
    })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.userId, userId),
        sql`${enrollments.programType} IN ('bls', 'acls', 'pals', 'heartsaver', 'nrp')`
      )
    );
  return rows.filter(
    (r) =>
      r.paymentStatus === "completed" ||
      r.paymentStatus === "partial" ||
      r.cognitiveModulesComplete
  );
}

export const practiceLabRouter = router({
  getAccess: protectedProcedure.query(async ({ ctx }) => {
    assertTrainingWorkspaceOrAdmin(ctx.user);
    const eligible = await fetchEligibleEnrollments(ctx.user.id);
    return {
      hasAccess: eligible.length > 0,
      enrollments: eligible.map((e) => ({
        id: e.id,
        programType: e.programType,
        cognitiveModulesComplete: e.cognitiveModulesComplete,
      })),
    };
  }),

  startSimulationWorldSession: protectedProcedure
    .input(z.object({
      enrollmentId: z.number(),
      programType: z.enum(AHA_PROGRAM_TYPES),
      scenarioId: z.enum(SIMULATION_WORLD_SCENARIOS.map((item) => item.id) as [SimulationWorldScenarioId, ...SimulationWorldScenarioId[]]),
      role: z.enum(SIMULATION_WORLD_ROLES),
      engineVersion: z.string().max(32),
      scenarioVersion: z.string().max(32),
      assessmentVersion: z.string().max(32),
    }))
    .mutation(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [enrollment] = await db.select({ id: enrollments.id, userId: enrollments.userId, programType: enrollments.programType })
        .from(enrollments).where(and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, ctx.user.id))).limit(1);
      if (!enrollment || enrollment.programType !== input.programType) throw new TRPCError({ code: "FORBIDDEN", message: "Enrollment not found for this simulation" });
      if (!isSimulationWorldScenarioCompatible(input.scenarioId, input.programType as "acls" | "pals" | "nrp")) throw new TRPCError({ code: "BAD_REQUEST", message: "This scenario belongs to a different clinical pathway" });
      const sessionNonce = randomBytes(32).toString("hex");
      const authoritativeState = createSimulationWorld(input.scenarioId, input.role);
      const [created] = await db.insert(simulationWorldSessions).values({ ...input, userId: ctx.user.id, sessionNonce, authorityState: "connected", authoritativeStateJson: authoritativeState }).$returningId();
      return { sessionId: created.id, sessionNonce, authorityState: "connected" as const, authoritativeState };
    }),

  receiveSimulationWorldCommand: protectedProcedure
    .input(z.object({ sessionId: z.number(), sessionNonce: z.string().length(64), sequence: z.number().int().nonnegative(), commandType: z.string().min(1).max(64), commandJson: z.record(z.string(), z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [session] = await db.select().from(simulationWorldSessions).where(and(eq(simulationWorldSessions.id, input.sessionId), eq(simulationWorldSessions.userId, ctx.user.id), eq(simulationWorldSessions.sessionNonce, input.sessionNonce))).limit(1);
      if (!session || session.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "Simulation session is not active" });
      const elapsedMs = Math.max(0, Math.min(30 * 60 * 1000, Date.now() - session.startedAt.getTime()));
      if (elapsedMs >= 30 * 60 * 1000) throw new TRPCError({ code: "BAD_REQUEST", message: "Simulation session expired" });
      const [previous] = await db.select({ sequence: simulationWorldCommandReceipts.sequence }).from(simulationWorldCommandReceipts).where(eq(simulationWorldCommandReceipts.sessionId, session.id)).orderBy(desc(simulationWorldCommandReceipts.sequence)).limit(1);
      const expectedSequence = previous ? previous.sequence + 1 : 0;
      if (input.sequence !== expectedSequence) throw new TRPCError({ code: "CONFLICT", message: `Expected command sequence ${expectedSequence}` });
      const stored = (session.authoritativeStateJson ?? createSimulationWorld(session.scenarioId as SimulationWorldScenarioId, session.role as SimulationWorldRole)) as unknown as SimulationWorldState;
      const command = input.commandJson as unknown as SimulationWorldCommand;
      if (command.type !== input.commandType || !isSimulationWorldCommandAllowed(session.role as SimulationWorldRole, command)) throw new TRPCError({ code: "BAD_REQUEST", message: "Command is not permitted for this simulation role" });
      const advanced = advanceSimulationWorld(stored, Math.max(0, elapsedMs / 1000 - stored.elapsedSeconds));
      const nextState = reduceSimulationWorld(advanced, command);
      const canonicalEvents = nextState.events.slice(stored.events.length);
      const receiptHash = createHash("sha256").update(`${session.sessionNonce}|${input.sequence}|${input.commandType}|${JSON.stringify(input.commandJson)}|${elapsedMs}|${JSON.stringify(canonicalEvents)}`).digest("hex").slice(0, 32);
      await db.insert(simulationWorldCommandReceipts).values({ sessionId: session.id, sequence: input.sequence, commandType: input.commandType, commandJson: input.commandJson, serverElapsedMs: elapsedMs, receiptHash, canonicalEventsJson: canonicalEvents, authoritativeStateJson: nextState });
      await db.update(simulationWorldSessions).set({ lastReceiptAt: new Date(), authoritativeStateJson: nextState, authorityState: "connected" }).where(eq(simulationWorldSessions.id, session.id));
      return { accepted: true, sequence: input.sequence, serverElapsedMs: elapsedMs, receiptHash, authorityState: "connected" as const, authoritativeState: nextState };
    }),

  startAdultAclsSession: protectedProcedure
    .input(z.object({
      enrollmentId: z.number(),
      scenarioId: z.enum(ADULT_ACLS_SCENARIOS.map((item) => item.id) as [AdultAclsScenarioId, ...AdultAclsScenarioId[]]),
      role: z.enum(SIMULATION_WORLD_ROLES),
    }))
    .mutation(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [enrollment] = await db.select({ id: enrollments.id, userId: enrollments.userId, programType: enrollments.programType })
        .from(enrollments).where(and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, ctx.user.id))).limit(1);
      if (!enrollment || enrollment.programType !== "acls") throw new TRPCError({ code: "FORBIDDEN", message: "An Adult ACLS enrollment is required for this simulation" });
      const sessionNonce = randomBytes(32).toString("hex");
      const authoritativeState = createAdultAclsSimulation(input.scenarioId, input.role);
      const [created] = await db.insert(simulationWorldSessions).values({
        userId: ctx.user.id,
        enrollmentId: input.enrollmentId,
        programType: "acls",
        scenarioId: input.scenarioId,
        role: input.role,
        sessionNonce,
        engineVersion: ADULT_ACLS_WORLD_VERSION,
        scenarioVersion: ADULT_ACLS_SCENARIO_VERSION,
        assessmentVersion: "training-only",
        authorityState: "connected",
        authoritativeStateJson: authoritativeState,
      }).$returningId();
      return { sessionId: created.id, sessionNonce, authorityState: "connected" as const, authoritativeState, syntheticTrainingOnly: true };
    }),

  receiveAdultAclsCommand: protectedProcedure
    .input(z.object({ sessionId: z.number(), sessionNonce: z.string().length(64), sequence: z.number().int().nonnegative(), commandJson: z.record(z.string(), z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [session] = await db.select().from(simulationWorldSessions).where(and(eq(simulationWorldSessions.id, input.sessionId), eq(simulationWorldSessions.userId, ctx.user.id), eq(simulationWorldSessions.sessionNonce, input.sessionNonce), eq(simulationWorldSessions.programType, "acls"))).limit(1);
      if (!session || session.status !== "active" || session.engineVersion !== ADULT_ACLS_WORLD_VERSION) throw new TRPCError({ code: "BAD_REQUEST", message: "Adult ACLS simulation session is not active" });
      const [previous] = await db.select({ sequence: simulationWorldCommandReceipts.sequence }).from(simulationWorldCommandReceipts).where(eq(simulationWorldCommandReceipts.sessionId, session.id)).orderBy(desc(simulationWorldCommandReceipts.sequence)).limit(1);
      const expectedSequence = previous ? previous.sequence + 1 : 0;
      if (input.sequence !== expectedSequence) throw new TRPCError({ code: "CONFLICT", message: `Expected command sequence ${expectedSequence}` });
      const stored = (session.authoritativeStateJson ?? createAdultAclsSimulation(session.scenarioId as AdultAclsScenarioId, session.role as SimulationWorldRole)) as unknown as AdultAclsState;
      const command = input.commandJson as unknown as AdultAclsCommand;
      const elapsedMs = Math.max(0, Math.min(30 * 60 * 1000, Date.now() - session.startedAt.getTime()));
      const advanced = advanceAdultAclsSimulation(stored, Math.max(0, elapsedMs / 1000 - stored.elapsedSeconds));
      const nextState = reduceAdultAclsSimulation(advanced, command);
      const canonicalEvents = nextState.events.slice(stored.events.length);
      const receiptHash = createHash("sha256").update(`${session.sessionNonce}|${input.sequence}|adult_acls|${JSON.stringify(input.commandJson)}|${elapsedMs}|${JSON.stringify(canonicalEvents)}`).digest("hex").slice(0, 32);
      await db.insert(simulationWorldCommandReceipts).values({ sessionId: session.id, sequence: input.sequence, commandType: String(command.type ?? "unknown"), commandJson: input.commandJson, serverElapsedMs: elapsedMs, receiptHash, canonicalEventsJson: canonicalEvents, authoritativeStateJson: nextState });
      await db.update(simulationWorldSessions).set({ lastReceiptAt: new Date(), authoritativeStateJson: nextState, authorityState: "connected" }).where(eq(simulationWorldSessions.id, session.id));
      return { accepted: true, sequence: input.sequence, serverElapsedMs: elapsedMs, receiptHash, authorityState: "connected" as const, authoritativeState: nextState, syntheticTrainingOnly: true };
    }),

  completeAdultAclsSession: protectedProcedure
    .input(z.object({ sessionId: z.number(), sessionNonce: z.string().length(64) }))
    .mutation(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [session] = await db.select().from(simulationWorldSessions).where(and(eq(simulationWorldSessions.id, input.sessionId), eq(simulationWorldSessions.userId, ctx.user.id), eq(simulationWorldSessions.sessionNonce, input.sessionNonce), eq(simulationWorldSessions.programType, "acls"))).limit(1);
      if (!session || session.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "Adult ACLS simulation session is not active" });
      const state = session.authoritativeStateJson as unknown as AdultAclsState;
      const evidence = calculateAdultAclsTrainingEvidence(state);
      await db.insert(ahaPracticeLabAttempts).values({ userId: ctx.user.id, enrollmentId: session.enrollmentId, programType: "acls", trackId: "adult_acls_world", scenarioId: session.scenarioId, score: 0, passed: false, eventLog: state.events, durationSeconds: Math.round(state.elapsedSeconds) });
      await db.insert(simulationWorldEvidence).values({ sessionId: session.id, userId: ctx.user.id, enrollmentId: session.enrollmentId, role: session.role, scenarioId: session.scenarioId, evidenceStatus: "review_required", assessmentJson: evidence });
      await db.update(simulationWorldSessions).set({ status: "completed", completedAt: new Date() }).where(eq(simulationWorldSessions.id, session.id));
      return { success: true, evidenceStatus: "review_required" as const, evidence, syntheticTrainingOnly: true };
    }),

  listAdultAclsEvidence: protectedProcedure
    .input(z.object({ status: z.enum(["review_required", "accepted", "rejected"]).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await requireAdultAclsReviewer(ctx);
      return db.select({
        id: simulationWorldEvidence.id,
        userId: simulationWorldEvidence.userId,
        learnerName: users.name,
        enrollmentId: simulationWorldEvidence.enrollmentId,
        sessionId: simulationWorldEvidence.sessionId,
        role: simulationWorldEvidence.role,
        scenarioId: simulationWorldEvidence.scenarioId,
        evidenceStatus: simulationWorldEvidence.evidenceStatus,
        assessmentJson: simulationWorldEvidence.assessmentJson,
        reviewerId: simulationWorldEvidence.reviewerId,
        reviewerReason: simulationWorldEvidence.reviewerReason,
        createdAt: simulationWorldEvidence.createdAt,
        reviewedAt: simulationWorldEvidence.reviewedAt,
      })
        .from(simulationWorldEvidence)
        .leftJoin(users, eq(users.id, simulationWorldEvidence.userId))
        .where(input?.status ? eq(simulationWorldEvidence.evidenceStatus, input.status) : undefined)
        .orderBy(desc(simulationWorldEvidence.createdAt));
    }),

  reviewAdultAclsEvidence: protectedProcedure
    .input(z.object({
      evidenceId: z.number().int().positive(),
      decision: z.enum(["accepted", "rejected"]),
      reason: z.string().trim().min(10).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireAdultAclsReviewer(ctx);
      const [evidence] = await db.select({ id: simulationWorldEvidence.id, evidenceStatus: simulationWorldEvidence.evidenceStatus, userId: simulationWorldEvidence.userId })
        .from(simulationWorldEvidence).where(eq(simulationWorldEvidence.id, input.evidenceId)).limit(1);
      if (!evidence) throw new TRPCError({ code: "NOT_FOUND", message: "Adult ACLS simulation evidence not found" });
      await db.update(simulationWorldEvidence).set({ evidenceStatus: input.decision, reviewerId: ctx.user.id, reviewerReason: input.reason, reviewedAt: new Date() }).where(eq(simulationWorldEvidence.id, input.evidenceId));
      await createAuditLog({ userId: ctx.user.id, action: "practiceLab.reviewAdultAclsEvidence", details: { evidenceId: input.evidenceId, learnerUserId: evidence.userId, previousStatus: evidence.evidenceStatus, decision: input.decision, reason: input.reason, doesNotGrantCredential: true } });
      return { success: true, evidenceId: input.evidenceId, evidenceStatus: input.decision, doesNotGrantCredential: true, doesNotCompletePhase: true };
    }),

  recordAttempt: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.number(),
        programType: z.enum(AHA_PROGRAM_TYPES),
        trackId: z.enum(PRACTICE_LAB_TRACKS),
        scenarioId: z.string().min(1).max(64),
        score: z.number().min(0).max(100),
        passed: z.boolean(),
        eventLog: z.array(
          z.object({
            timestamp: z.number(),
            type: z.string(),
            description: z.string(),
            correct: z.boolean().optional(),
          }).passthrough()
        ),
        isBooster: z.boolean().optional(),
        durationSeconds: z.number().optional(),
        sessionId: z.number().optional(),
        sessionNonce: z.string().length(64).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const [enrollment] = await db
        .select({ id: enrollments.id, userId: enrollments.userId, programType: enrollments.programType })
        .from(enrollments)
        .where(
          and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, ctx.user.id))
        )
        .limit(1);

      if (!enrollment) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Enrollment not found" });
      }
      if (enrollment.programType !== input.programType) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Simulation program does not match this enrollment" });
      }

      let session: typeof simulationWorldSessions.$inferSelect | undefined;
      let authoritativeEventLog = input.eventLog as SimulationWorldEvent[];
      if (input.trackId === "simulation_world") {
        if (!input.sessionId || !input.sessionNonce) throw new TRPCError({ code: "BAD_REQUEST", message: "Simulation session is required" });
        [session] = await db.select().from(simulationWorldSessions).where(and(eq(simulationWorldSessions.id, input.sessionId), eq(simulationWorldSessions.userId, ctx.user.id), eq(simulationWorldSessions.enrollmentId, input.enrollmentId), eq(simulationWorldSessions.sessionNonce, input.sessionNonce), eq(simulationWorldSessions.status, "active"))).limit(1);
        if (!session || session.scenarioId !== input.scenarioId || session.programType !== input.programType) throw new TRPCError({ code: "BAD_REQUEST", message: "Simulation session does not match attempt" });
        const receipts = await db.select({ sequence: simulationWorldCommandReceipts.sequence, canonicalEventsJson: simulationWorldCommandReceipts.canonicalEventsJson }).from(simulationWorldCommandReceipts).where(eq(simulationWorldCommandReceipts.sessionId, session.id)).orderBy(simulationWorldCommandReceipts.sequence);
        const commandEvents = input.eventLog.filter((item) => item.type === "command");
        if (receipts.length !== commandEvents.length || receipts.some((receipt, index) => receipt.sequence !== index)) throw new TRPCError({ code: "BAD_REQUEST", message: "Simulation evidence is missing server command receipts" });
        const canonicalEvents = receipts.flatMap((receipt) => Array.isArray(receipt.canonicalEventsJson) ? receipt.canonicalEventsJson as SimulationWorldEvent[] : []);
        authoritativeEventLog = [{ timestamp: 0, type: "simulation_world_meta", description: JSON.stringify({ role: session.role, scenarioId: session.scenarioId, engineVersion: session.engineVersion, scenarioVersion: session.scenarioVersion, assessmentVersion: session.assessmentVersion }) }, ...canonicalEvents];
      }

      let authoritativeScore = input.score;
      let authoritativePassed = input.passed;
      if (input.trackId === "simulation_world") {
        const metaEvent = authoritativeEventLog.find((item) => item.type === "simulation_world_meta");
        let role: SimulationWorldRole | undefined;
        try { role = metaEvent?.description ? JSON.parse(metaEvent.description).role as SimulationWorldRole : undefined; } catch { role = undefined; }
        const replay = replaySimulationWorldAttempt({
          scenarioId: input.scenarioId as SimulationWorldScenarioId,
          role: role as SimulationWorldRole,
          eventLog: authoritativeEventLog,
        });
        if (!replay.valid || !replay.assessment) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Simulation replay rejected: ${replay.reason ?? "invalid evidence"}` });
        }
        authoritativeScore = replay.assessment.overall;
        authoritativePassed = replay.assessment.evidenceEligible;
      }

      const [attempt] = await db.insert(ahaPracticeLabAttempts).values({
        userId: ctx.user.id,
        enrollmentId: input.enrollmentId,
        programType: input.programType,
        trackId: input.trackId,
        scenarioId: input.scenarioId,
        score: isFormativePracticeLabTrack(input.trackId) ? 0 : authoritativeScore,
        passed: isFormativePracticeLabTrack(input.trackId) ? false : authoritativePassed,
        eventLog: authoritativeEventLog,
        isBooster: input.isBooster ?? false,
        durationSeconds: input.durationSeconds ?? null,
      }).$returningId();
      if (session) {
        await db.insert(simulationWorldEvidence).values({
          sessionId: session.id,
          userId: ctx.user.id,
          enrollmentId: input.enrollmentId,
          role: session.role,
          scenarioId: session.scenarioId,
          evidenceStatus: "review_required",
          assessmentJson: replaySimulationWorldAttempt({ scenarioId: session.scenarioId as SimulationWorldScenarioId, role: session.role as SimulationWorldRole, eventLog: authoritativeEventLog }).assessment ?? null,
        });
        await db.update(simulationWorldSessions).set({ status: "completed", completedAt: new Date() }).where(eq(simulationWorldSessions.id, session.id));
      }

      return { success: true, attemptId: attempt.id, evidenceStatus: session ? "review_required" as const : null };
    }),

  getMyAttempts: protectedProcedure
    .input(z.object({ enrollmentId: z.number().optional(), limit: z.number().max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(ahaPracticeLabAttempts.userId, ctx.user.id)];
      if (input.enrollmentId) {
        conditions.push(eq(ahaPracticeLabAttempts.enrollmentId, input.enrollmentId));
      }

      return db
        .select()
        .from(ahaPracticeLabAttempts)
        .where(and(...conditions))
        .orderBy(desc(ahaPracticeLabAttempts.createdAt))
        .limit(input.limit);
    }),

  getDueBoosters: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      const db = await getDb();
      if (!db) return { due: [] as { trackId: string; scenarioId: string; dueAt: string }[] };

      const attempts = await db
        .select()
        .from(ahaPracticeLabAttempts)
        .where(
          and(
            eq(ahaPracticeLabAttempts.userId, ctx.user.id),
            eq(ahaPracticeLabAttempts.enrollmentId, input.enrollmentId),
            eq(ahaPracticeLabAttempts.passed, true)
          )
        )
        .orderBy(desc(ahaPracticeLabAttempts.createdAt));

      const seen = new Map<string, (typeof attempts)[0]>();
      for (const a of attempts) {
        const key = `${a.trackId}:${a.scenarioId}`;
        if (!seen.has(key)) seen.set(key, a);
      }

      const now = Date.now();
      const due: { trackId: string; scenarioId: string; dueAt: string; reason: string }[] = [];

      for (const [, attempt] of seen) {
        const passCount = attempts.filter(
          (a) => a.trackId === attempt.trackId && a.scenarioId === attempt.scenarioId && a.passed
        ).length;
        const intervalIdx = Math.min(passCount - 1, BOOSTER_INTERVALS_DAYS.length - 1);
        const intervalDays = BOOSTER_INTERVALS_DAYS[Math.max(0, intervalIdx)];
        const lastAt = attempt.createdAt?.getTime() ?? now;
        const dueAt = lastAt + intervalDays * 24 * 60 * 60 * 1000;
        if (dueAt <= now) {
          due.push({
            trackId: attempt.trackId,
            scenarioId: attempt.scenarioId,
            dueAt: new Date(dueAt).toISOString(),
            reason: `Spaced repetition booster (${intervalDays}d interval)`,
          });
        }
      }

      return { due };
    }),

  getWeakDomainSuggestions: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      const db = await getDb();
      if (!db) return { suggestedTracks: [] as PracticeLabTrackId[] };

      const failedProgress = await db
        .select({ quizId: userProgress.quizId, score: userProgress.score })
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, ctx.user.id),
            eq(userProgress.enrollmentId, input.enrollmentId),
            sql`${userProgress.score} < 70`
          )
        )
        .limit(10);

      const suggested = new Set<PracticeLabTrackId>();
      for (const row of failedProgress) {
        if (!row.quizId) continue;
        const questions = await db
          .select({ questionText: quizQuestions.question })
          .from(quizQuestions)
          .where(eq(quizQuestions.quizId, row.quizId))
          .limit(20);
        for (const q of questions) {
          const text = (q.questionText ?? "").toLowerCase();
          for (const [keyword, track] of Object.entries(WEAK_DOMAIN_TO_TRACK)) {
            if (text.includes(keyword)) suggested.add(track);
          }
        }
      }

      return { suggestedTracks: [...suggested] };
    }),

  getAdminSimAttemptsByProgram: adminProcedure
    .input(
      z.object({
        year: z.number().optional(),
        month: z.number().min(1).max(12).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { byProgram: [], byTrack: [], total: 0 };

      const conditions = [];
      if (input.year && input.month) {
        const start = new Date(Date.UTC(input.year, input.month - 1, 1, -3, 0, 0, 0));
        const end = new Date(Date.UTC(input.year, input.month, 0, 20, 59, 59, 999));
        conditions.push(gte(ahaPracticeLabAttempts.createdAt, start));
        conditions.push(lte(ahaPracticeLabAttempts.createdAt, end));
      }

      conditions.push(sql`${ahaPracticeLabAttempts.trackId} NOT IN (${sql.join(FORMATIVE_PRACTICE_LAB_TRACKS.map((track) => sql`${track}`), sql`, `)})`);
      const whereClause = and(...conditions);

      const [byProgram, byTrack, totalRow] = await Promise.all([
        db
          .select({
            programType: ahaPracticeLabAttempts.programType,
            count: sql<number>`count(*)`.mapWith(Number),
            avgScore: sql<number>`avg(${ahaPracticeLabAttempts.score})`.mapWith(Number),
          })
          .from(ahaPracticeLabAttempts)
          .where(whereClause)
          .groupBy(ahaPracticeLabAttempts.programType),
        db
          .select({
            trackId: ahaPracticeLabAttempts.trackId,
            count: sql<number>`count(*)`.mapWith(Number),
          })
          .from(ahaPracticeLabAttempts)
          .where(whereClause)
          .groupBy(ahaPracticeLabAttempts.trackId),
        db
          .select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(ahaPracticeLabAttempts)
          .where(whereClause),
      ]);

      return {
        byProgram,
        byTrack,
        total: totalRow[0]?.count ?? 0,
      };
    }),

  sendAiRoleplayMessage: protectedProcedure
    .input(
      z.object({
        scenarioName: z.string(),
        scenarioDescription: z.string(),
        vitals: z.object({
          heartRate: z.number(),
          respiratoryRate: z.number(),
          bloodPressure: z.string(),
          spo2: z.number(),
          temperature: z.number(),
        }),
        chatHistory: z.array(
          z.object({
            role: z.enum(["system", "user", "assistant"]),
            content: z.string(),
          })
        ),
        userMessage: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const systemPrompt = `You are a professional nurse assistant and parent roleplayer inside a pediatric resuscitation bay.
You are assisting the user (the team leader/clinician) in managing a pediatric patient.

Scenario context:
Case Name: ${input.scenarioName}
Details: ${input.scenarioDescription}

Current Patient Vitals:
Heart Rate: ${input.vitals.heartRate} bpm
Respiratory Rate: ${input.vitals.respiratoryRate} /min
Blood Pressure: ${input.vitals.bloodPressure} mmHg
SpO2: ${input.vitals.spo2} %
Temperature: ${input.vitals.temperature} C

Your role:
1. Actively roleplay as the nurse. Acknowledge or clarify the clinician's orders realistically.
2. Do not invent, update, or estimate physiology. The deterministic Simulation World owns patient state and consequences.
3. Keep your dialog concise, medical, and realistic. Speak as a nurse in an emergency. E.g., "Yes, doctor, drawing up the ordered fluid now." or "IV access is established."
4. If the clinician overrides protocols or gives wrong dosages, ask a clarifying question politely as a nurse would.

Respond ONLY with a JSON object matching this schema:
{
  "dialog": "Nurse/parent response speech text",
  "dialog": "Nurse/parent response speech text"
}`;

      const messagesPayload = [
        { role: "system" as const, content: systemPrompt },
        ...input.chatHistory.map(h => ({ role: h.role as "system" | "user" | "assistant", content: h.content })),
        { role: "user" as const, content: input.userMessage },
      ];

      const response = await invokeLLM({
        messages: messagesPayload,
        responseFormat: { type: "json_object" },
      });

      const rawContent = response.choices[0]?.message?.content || "{}";
      const contentStr = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
      const parsed = JSON.parse(contentStr.trim().replace(/^```json\s*/i, "").replace(/```$/i, ""));

      return {
        success: true,
        dialog: parsed.dialog || "Nurse acknowledges order.",
        // Backward-compatible response shape: physiology remains authoritative in the
        // deterministic engine, so this endpoint always echoes the input snapshot.
        vitals: input.vitals,
      };
    }),

  evaluateAiRoleplaySession: protectedProcedure
    .input(
      z.object({
        scenarioName: z.string(),
        scenarioDescription: z.string(),
        chatHistory: z.array(
          z.object({
            role: z.enum(["system", "user", "assistant"]),
            content: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const formattedChat = input.chatHistory
        .map((h) => `${h.role === "user" ? "Clinician" : "Nurse"}: ${h.content}`)
        .join("\n\n");

      const systemPrompt = `You are an expert clinical quality auditor.
Analyze the following resuscitation chat log between a clinician (user) and a nurse assistant.

Scenario:
${input.scenarioName} - ${input.scenarioDescription}

Chat Log:
${formattedChat}

Your task:
1. Review their clinical decisions, speed, and protocol compliance (PALS/NRP/ACLS) for coaching.
2. Generate a list of key events for their timeline.
3. Create a structured formative debriefing summary with strengths and gaps. Do not assign a score or pass/fail result.

Respond ONLY with a JSON object matching this schema:
{
  "debrief": "Detailed markdown debriefing showing strengths, delays, and critical protocol compliance issues; no score or pass/fail result",
  "events": [
    {
      "timestamp": number,
      "type": "info" | "action" | "error" | "reassessment",
      "description": "Short description of event",
      "correct": boolean
    }
  ]
}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Please audit this session." },
        ],
        responseFormat: { type: "json_object" },
      });

      const rawContent = response.choices[0]?.message?.content || "{}";
      const contentStr = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
      const parsed = JSON.parse(contentStr.trim().replace(/^```json\s*/i, "").replace(/```$/i, ""));

      return {
        success: true,
        debrief: parsed.debrief || "No debrief generated.",
        events: parsed.events || [],
      };
    }),
});
