/**
 * Fellowship Qualification Router
 * 
 * Implements 3-pillar fellowship qualification system:
 * 1. Courses: Completion of all 27 ADF micro-courses (BLS, ACLS, PALS are optional, standalone)
 * 2. ResusGPS: ≥3 attributable cases per taught condition
 * 3. Care Signal: 24 consecutive qualifying months of monthly reporting (EAT)
 * 
 * With grace/catch-up/streak reset logic per PSOT §17.
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, and } from "drizzle-orm";
import { resusGPSSessions, resusGPSCases, certificates, users } from "../../drizzle/schema";
import { getResusGpsAccessForClient } from "../lib/resusgps-access";
import {
  calculateFellowshipStatus,
  syncFellowshipProgressForUser,
} from "../services/fellowship-progress.service";

export const fellowshipRouter = router({
  /**
   * Get fellowship progress for current user
   */
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { status } = await syncFellowshipProgressForUser(ctx.user.id);
      const db = await getDb();
      let resusGpsAccessExpiresAt: Date | null = null;
      if (db) {
        const u = await db
          .select({ exp: users.resusGpsAccessExpiresAt })
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);
        resusGpsAccessExpiresAt = u[0]?.exp ?? null;
      }

      return {
        coursesPillar: status.coursesPillar,
        resusGPSPillar: status.resusGPSPillar,
        careSignalPillar: status.careSignalPillar,
        isQualified: status.isQualified,
        overallPercentage: status.overallPercentage,
        resusGpsAccessExpiresAt,
      };
    } catch (error) {
      console.error("[Fellowship] Error in getProgress:", error);
      // Return default 0% progress on error
      return {
        coursesPillar: { completed: 0, required: 27, percentage: 0, legacyCourses: 0 },
        resusGPSPillar: { casesCompleted: 0, conditionsWithThreshold: 0, totalConditionsTaught: 0, percentage: 0 },
        careSignalPillar: { streak: 0, eventsSubmitted: 0, percentage: 0 },
        isQualified: false,
        overallPercentage: 0,
        resusGpsAccessExpiresAt: null as Date | null,
      };
    }
  }),

  /** ResusGPS access for fellowship-linked 30-day windows (see resusgps-access.ts). */
  getResusGpsAccessStatus: protectedProcedure.query(async ({ ctx }) => {
    return getResusGpsAccessForClient(ctx.user.id);
  }),

  /**
   * Record a ResusGPS session
   */
  recordResusGPSSession: protectedProcedure
    .input(
      z.object({
        primaryDiagnosis: z.string(),
        patientAgeMonths: z.number(),
        patientWeightKg: z.number(),
        isTrauma: z.boolean().optional(),
        isCardiacArrest: z.boolean().optional(),
        interventionCount: z.number().optional(),
        reassessmentCount: z.number().optional(),
        durationSeconds: z.number().optional(),
        depthScore: z.number().min(0).max(100).optional(),
        sessionId: z.string().optional(), // Client-side generated UUID for idempotency
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database connection failed");
      }

      // Allow client to provide sessionId for idempotency (e.g. on retry)
      // If not provided, generate a new one.
      const sessionId = input.sessionId || `session-${ctx.user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Check for existing session with this sessionId to ensure idempotency
      const existingSession = await db.select().from(resusGPSSessions).where(eq(resusGPSSessions.sessionId, sessionId)).limit(1);
      if (existingSession.length > 0) {
        return { success: true, sessionId: sessionId, alreadyExists: true };
      }

      // Create session with all required fields
      await db.insert(resusGPSSessions).values({
        userId: ctx.user.id,
        sessionId: sessionId,
        primaryDiagnosis: input.primaryDiagnosis,
        patientAgeMonths: input.patientAgeMonths,
        patientWeightKg: input.patientWeightKg.toString(),
        isTrauma: input.isTrauma || false,
        isCardiacArrest: input.isCardiacArrest || false,
        status: "completed",
        interventionCount: input.interventionCount || 0,
        reassessmentCount: input.reassessmentCount || 0,
        durationSeconds: input.durationSeconds,
        depthScore: input.depthScore || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { success: true, sessionId: sessionId };
    }),

  /**
   * Record a ResusGPS case
   */
  recordResusGPSCase: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(), // UUID string from recordResusGPSSession
        caseNumber: z.number().min(1),
        diagnosis: z.string(),
        abcdeCompleted: z.boolean().optional(),
        interventions: z.array(z.string()).optional(),
        reassessments: z.array(z.string()).optional(),
        outcome: z.string().optional(),
        depthScore: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database connection failed");
      }

      // Check for existing case with this sessionId and caseNumber to ensure idempotency
      const existingCase = await db
        .select()
        .from(resusGPSCases)
        .where(and(eq(resusGPSCases.sessionId, input.sessionId), eq(resusGPSCases.caseNumber, input.caseNumber)))
        .limit(1);

      if (existingCase.length > 0) {
        return { success: true, caseId: existingCase[0].id, alreadyExists: true };
      }

      // Create case with all required fields
      const result = await db.insert(resusGPSCases).values({
        sessionId: input.sessionId, // String UUID
        userId: ctx.user.id,
        caseNumber: input.caseNumber,
        diagnosis: input.diagnosis,
        abcdeCompleted: input.abcdeCompleted || false,
        interventions: input.interventions ? JSON.stringify(input.interventions) : null,
        reassessments: input.reassessments ? JSON.stringify(input.reassessments) : null,
        outcome: input.outcome,
        depthScore: input.depthScore || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      void syncFellowshipProgressForUser(ctx.user.id).catch((e) =>
        console.warn("[Fellowship] sync after case record failed:", e)
      );

      return { success: true, caseId: result[0].insertId };
    }),

  /**
   * Final Graduation Orchestration
   * Checks if user is qualified and issues the Fellowship Diploma
   */
  claimGraduation: protectedProcedure.mutation(async ({ ctx }) => {
    const { status } = await syncFellowshipProgressForUser(ctx.user.id);

    if (!status.isQualified) {
      throw new Error("You have not yet met all the requirements for Fellowship graduation.");
    }

    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Check if certificate already exists
    const [existingCert] = await db
      .select()
      .from(certificates)
      .where(and(
        eq(certificates.userId, ctx.user.id),
        eq(certificates.programType, 'fellowship_diploma')
      ))
      .limit(1);

    if (existingCert) {
      return { success: true, certificateId: existingCert.id, alreadyIssued: true };
    }

    // Issue Fellowship Diploma
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    const recipientName = user?.name || 'Fellow Candidate';
    
    // Use the central certificate issuance logic
    const { saveCertificate } = await import("../certificates");
    const result = await saveCertificate(
      0, // enrollmentId 0 for graduation
      recipientName,
      'fellowship_diploma',
      new Date(),
      'PaedsResus Global Board',
      ctx.user.id
    );

    if (!result.success) {
      throw new Error(`Graduation failed: ${result.error}`);
    }

    return { success: true, certificateNumber: result.certificateNumber };
  }),
});
