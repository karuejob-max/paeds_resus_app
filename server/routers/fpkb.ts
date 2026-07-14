/**
 * Failure Pattern Knowledge Base (FPKB) router.
 *
 * Gap-analysis fix (2026-07-12): migrations 0057/0058 created and seeded 11
 * `kb_` tables (28 failure modes, 10 success factors) on production, but no
 * router, Drizzle binding, or UI ever read them. This file is the first real
 * "system intelligence" surface per North Star v2.0 Stage 6 of the holistic
 * loop and FPKB_SCHEMA_V1.md.
 *
 * Scope (updated 2026-07-12, gap #3 — Knowledge Stewardship approval gate):
 *   - Read endpoints for failure modes, success factors, and patterns
 *     (public-readable: this is shared clinical knowledge, not PII).
 *   - Admin-only pattern/recommendation creation (`createPattern`,
 *     `createRecommendation`) — deliberately manual-curation-only for now.
 *     There is no automated pattern-detection algorithm yet (gap #9,
 *     depends on real Care Signal observation volume), so every pattern
 *     created through this router today is expert/adaptive-evidence based,
 *     not observational — `confidenceDimensions` and `evidenceBasis` should
 *     say so explicitly rather than imply observational support that
 *     doesn't exist yet.
 *   - Admin-only recommendation governance actions (approve/reject), which
 *     write to kb_governance_audit — the append-only table the schema
 *     requires for every governance decision. This is the gate North Star
 *     names as non-negotiable: nothing here is auto-approved, ever.
 *   - Pattern detail (with its linked modes + supporting observation count).
 *
 * Deliberately NOT in this cut (needs its own scoped PR + your sign-off):
 *   - Automated pattern-detection algorithm that mines careSignalEvents and
 *     writes kb_pattern_observations / promotes patterns across confidence
 *     thresholds. That's real analytics work, not plumbing, and the seeded
 *     28/10 taxonomy rows currently have zero linked observations — there is
 *     nothing for a detector to detect yet until Care Signal v3 has run long
 *     enough to accumulate volume.
 *   - Intervention/Implementation write path (separate gap-list item).
 *   - Knowledge Stewardship approval *workflow* (this router exposes the
 *     primitive; the workflow/UI is a separate item).
 */
import { protectedProcedure, adminProcedure, router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { reEvaluateAfterImplementationOutcome } from "../lib/fpkb-pattern-detector";
import {
  kbFailureModes,
  kbSuccessFactors,
  kbPatterns,
  kbPatternModes,
  kbPatternObservations,
  kbRecommendations,
  kbGovernanceAudit,
  kbInterventions,
  kbImplementations,
} from "../../drizzle/schema";

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function logGovernanceAudit(params: {
  actorUserId: string;
  actionType:
    | "PATTERN_CREATED"
    | "RECOMMENDATION_APPROVED"
    | "RECOMMENDATION_REJECTED"
    | "RECOMMENDATION_SUPERSEDED"
    | "PATTERN_RETIRED"
    | "PATTERN_REINSTATED"
    | "IMPLEMENTATION_OUTCOME_LABELLED"
    | "OTHER";
  entityType: "RECOMMENDATION" | "PATTERN" | "FAILURE_MODE" | "SUCCESS_FACTOR" | "INTERVENTION" | "IMPLEMENTATION";
  entityId: string;
  previousState?: unknown;
  newState?: unknown;
  reasoning?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(kbGovernanceAudit).values({
    id: newId(),
    actorUserId: params.actorUserId,
    actionType: params.actionType,
    entityType: params.entityType,
    entityId: params.entityId,
    previousState: params.previousState ? JSON.stringify(params.previousState) : null,
    newState: params.newState ? JSON.stringify(params.newState) : null,
    reasoning: params.reasoning ?? null,
  });
}

export const fpkbRouter = router({
  /** All active failure modes in the taxonomy (28 seeded). Shared clinical knowledge — public-readable. */
  listFailureModes: publicProcedure
    .input(z.object({ includeRetired: z.boolean().default(false) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(kbFailureModes);
      return input?.includeRetired ? rows : rows.filter((r) => r.isActive);
    }),

  /** All active success factors in the taxonomy (10 seeded). */
  listSuccessFactors: publicProcedure
    .input(z.object({ includeRetired: z.boolean().default(false) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(kbSuccessFactors);
      return input?.includeRetired ? rows : rows.filter((r) => r.isActive);
    }),

  /**
   * Confirmed/emerging patterns — the actual "learning" surface. Filterable by
   * track and domain so the Atlas UI can show Failure vs Success separately
   * (North Star: the loop is bidirectional, not only failure-eliminating).
   */
  listPatterns: publicProcedure
    .input(
      z.object({
        track: z.enum(["FAILURE", "SUCCESS"]).optional(),
        knowledgeStatus: z.enum(["ACTIVE", "UNDER_REVIEW", "RETIRED"]).default("ACTIVE"),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(kbPatterns.knowledgeStatus, input?.knowledgeStatus ?? "ACTIVE")];
      if (input?.track) conditions.push(eq(kbPatterns.patternTrack, input.track));
      return db
        .select()
        .from(kbPatterns)
        .where(and(...conditions))
        .orderBy(desc(kbPatterns.supportingObservationCount));
    }),

  /** Single pattern with its linked failure modes / success factors and observation count. */
  getPatternDetail: publicProcedure
    .input(z.object({ patternId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database unavailable" });
      }
      const [pattern] = await db.select().from(kbPatterns).where(eq(kbPatterns.id, input.patternId));
      if (!pattern) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pattern not found" });
      }
      const modeLinks = await db
        .select()
        .from(kbPatternModes)
        .where(eq(kbPatternModes.patternId, input.patternId));

      const observationCount = await db
        .select()
        .from(kbPatternObservations)
        .where(eq(kbPatternObservations.patternId, input.patternId));

      return { pattern, modeLinks, observationCount: observationCount.length };
    }),

  /**
   * Manually curate a new candidate pattern. Since there is no automated
   * detector yet (gap #9), this is how a Knowledge Steward records something
   * clinically well-established (e.g. "delayed septic shock recognition is a
   * known recurring problem") as a first-class taxonomy entry, so it can
   * carry recommendations through the same governance gate as anything the
   * detector will eventually produce. `confidenceLevel` defaults to SIGNAL —
   * deliberately the lowest rung; upgrading it is a separate, later review
   * action (kb_review_schedule / kb_governance_audit), not something this
   * mutation does itself.
   */
  createPattern: adminProcedure
    .input(
      z.object({
        patternTrack: z.enum(["FAILURE", "SUCCESS"]),
        patternCode: z.string().min(3).max(64),
        patternName: z.string().min(3).max(512),
        primaryDomain: z.enum([
          "RECOGNITION", "ESCALATION", "VASCULAR_ACCESS", "TREATMENT",
          "REFERRAL", "MONITORING", "COMMUNICATION", "RESOURCE_AVAILABILITY",
        ]),
        description: z.string().min(10).max(4000),
        /** Free text explaining WHY this pattern is being recorded without
         *  observational data yet — required, since that's the honest state. */
        curationRationale: z.string().min(10).max(2000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database unavailable" });
      }
      const id = newId();
      const confidenceDimensions = JSON.stringify({
        clinical: "expert_curated",
        statistical: "none_yet",
        external_evidence: "unspecified",
        platform_replication: "none_yet",
        geographic_diversity: "none_yet",
        recency: new Date().toISOString(),
        curation_rationale: input.curationRationale,
      });

      await db.insert(kbPatterns).values({
        id,
        patternTrack: input.patternTrack,
        patternCode: input.patternCode,
        patternName: input.patternName,
        primaryDomain: input.primaryDomain,
        description: input.description,
        confidenceLevel: input.patternTrack === "FAILURE" ? "SIGNAL" : "CANDIDATE_SUCCESS",
        confidenceDimensions,
        supportingObservationCount: 0,
        knowledgeStatus: "ACTIVE",
        createdBy: String(ctx.user.id),
      });

      await logGovernanceAudit({
        actorUserId: String(ctx.user.id),
        actionType: "PATTERN_CREATED",
        entityType: "PATTERN",
        entityId: id,
        newState: { patternCode: input.patternCode, patternName: input.patternName },
        reasoning: input.curationRationale,
      });

      return { id };
    }),

  /**
   * Draft a recommendation against an existing pattern. Always created as
   * PENDING — it only becomes visible/actionable elsewhere in the platform
   * once a separate admin calls `decideRecommendation` with APPROVED. This
   * separation (draft vs. decide, by design allowed to be the same admin for
   * now since there's only one engineering decision-maker, but modeled as
   * two distinct actions so a real second-approver workflow can be added
   * later without a schema change) is the actual "gate."
   */
  createRecommendation: adminProcedure
    .input(
      z.object({
        sourcePatternId: z.string(),
        recommendationCode: z.string().min(3).max(64),
        recommendationType: z.enum([
          "TRAINING", "PROCUREMENT", "PROTOCOL", "STAFFING",
          "RESUSGPS_UPDATE", "CURRICULUM_UPDATE", "CARE_SIGNAL_RULE", "INSTITUTIONAL_PROCESS", "OTHER",
        ]),
        recommendationText: z.string().min(10).max(4000),
        targetAudience: z.enum([
          "INDIVIDUAL_PROVIDER", "FACILITY", "NETWORK", "MINISTRY", "CURRICULUM_TEAM", "RESUSGPS_TEAM",
        ]),
        evidenceBasisNotes: z.string().min(10).max(2000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database unavailable" });
      }
      const [pattern] = await db.select().from(kbPatterns).where(eq(kbPatterns.id, input.sourcePatternId));
      if (!pattern) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Source pattern not found" });
      }

      const id = newId();
      await db.insert(kbRecommendations).values({
        id,
        sourcePatternId: input.sourcePatternId,
        recommendationCode: input.recommendationCode,
        recommendationType: input.recommendationType,
        recommendationText: input.recommendationText,
        targetAudience: input.targetAudience,
        confidenceLevelAtGeneration: pattern.confidenceLevel,
        evidenceBasis: JSON.stringify({
          observational_count: pattern.supportingObservationCount,
          notes: input.evidenceBasisNotes,
        }),
        governanceStatus: "PENDING",
        createdBy: String(ctx.user.id),
      });

      return { id };
    }),

  /** Recommendations pending Knowledge Stewardship sign-off. Admin-only (governance role). */
  listPendingRecommendations: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(kbRecommendations)
      .where(eq(kbRecommendations.governanceStatus, "PENDING"))
      .orderBy(desc(kbRecommendations.createdAt));
  }),

  /** Approved recommendations — the only ones interventions can be committed against. */
  listApprovedRecommendations: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(kbRecommendations)
      .where(eq(kbRecommendations.governanceStatus, "APPROVED"))
      .orderBy(desc(kbRecommendations.createdAt));
  }),

  /**
   * Knowledge Stewardship sign-off primitive. This is the write path North
   * Star names as non-negotiable ("no ... recommendation change ships
   * without its sign-off") — every call is recorded to the append-only
   * kb_governance_audit table, never just updated silently.
   */
  decideRecommendation: adminProcedure
    .input(
      z.object({
        recommendationId: z.string(),
        decision: z.enum(["APPROVED", "REJECTED"]),
        notes: z.string().max(4000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database unavailable" });
      }
      const [existing] = await db
        .select()
        .from(kbRecommendations)
        .where(eq(kbRecommendations.id, input.recommendationId));
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recommendation not found" });
      }

      await db
        .update(kbRecommendations)
        .set({
          governanceStatus: input.decision,
          governanceApprovedBy: String(ctx.user.id),
          governanceApprovedAt: new Date(),
          governanceNotes: input.notes ?? null,
        })
        .where(eq(kbRecommendations.id, input.recommendationId));

      await logGovernanceAudit({
        actorUserId: String(ctx.user.id),
        actionType: input.decision === "APPROVED" ? "RECOMMENDATION_APPROVED" : "RECOMMENDATION_REJECTED",
        entityType: "RECOMMENDATION",
        entityId: input.recommendationId,
        previousState: { governanceStatus: existing.governanceStatus },
        newState: { governanceStatus: input.decision },
        reasoning: input.notes,
      });

      return { success: true };
    }),

  /** Recent governance actions, for transparency in the Atlas UI (append-only audit trail). */
  listGovernanceAudit: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(kbGovernanceAudit)
        .orderBy(desc(kbGovernanceAudit.createdAt))
        .limit(input.limit);
    }),

  // ── Intervention / Implementation write path (gap-analysis #6) ──────────
  // Until now kb_interventions/kb_implementations existed only as schema —
  // nothing wrote to them. This is the mechanism North Star ties to the
  // Book of the Unforgotten: a recommendation isn't just approved, it's
  // tracked through to whether it actually changed anything.

  /** Interventions committed against a recommendation (or all, admin overview). */
  listInterventions: adminProcedure
    .input(z.object({ recommendationId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(kbInterventions).orderBy(desc(kbInterventions.createdAt));
      return input?.recommendationId
        ? rows.filter((r) => r.recommendationId === input.recommendationId)
        : rows;
    }),

  /** Implementations (actual outcomes) — optionally filtered by intervention. */
  listImplementations: adminProcedure
    .input(z.object({ interventionId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(kbImplementations).orderBy(desc(kbImplementations.createdAt));
      return input?.interventionId
        ? rows.filter((r) => r.interventionId === input.interventionId)
        : rows;
    }),

  /**
   * Record a facility/network/ministry's commitment to act on a
   * recommendation. Gated on governanceStatus === "APPROVED" — you cannot
   * commit an intervention against something Knowledge Stewardship hasn't
   * signed off on yet (the gap #3 gate applies here too, not just at
   * recommendation-drafting time).
   */
  createIntervention: adminProcedure
    .input(
      z.object({
        recommendationId: z.string(),
        committingEntityType: z.enum(["FACILITY", "NETWORK", "MINISTRY", "TRAINING_INSTITUTION", "OTHER"]),
        /** careFacilities.id (as a string) when committingEntityType is FACILITY — never a facility name. */
        committingEntityId: z.string().min(1).max(36),
        interventionScope: z.enum(["ED_ONLY", "WARD", "HOSPITAL_WIDE", "NETWORK", "NATIONAL"]),
        interventionDescription: z.string().min(10).max(4000),
        plannedImplementationDate: z.string().optional(),
        definedOutcomeMeasure: z.string().min(5).max(2000),
        evaluationWindowMonths: z.number().min(1).max(60).default(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database unavailable" });
      }

      const [rec] = await db.select().from(kbRecommendations).where(eq(kbRecommendations.id, input.recommendationId));
      if (!rec) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recommendation not found" });
      }
      if (rec.governanceStatus !== "APPROVED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only APPROVED recommendations can have interventions committed against them.",
        });
      }

      const id = newId();
      await db.insert(kbInterventions).values({
        id,
        recommendationId: input.recommendationId,
        committingEntityType: input.committingEntityType,
        committingEntityId: input.committingEntityId,
        interventionScope: input.interventionScope,
        interventionDescription: input.interventionDescription,
        plannedImplementationDate: input.plannedImplementationDate ? new Date(input.plannedImplementationDate) : null,
        definedOutcomeMeasure: input.definedOutcomeMeasure,
        evaluationWindowMonths: input.evaluationWindowMonths,
        interventionStatus: "PLANNED",
        createdBy: String(ctx.user.id),
      });

      return { id };
    }),

  /**
   * Transition an intervention's status. Deliberately does NOT accept
   * "COMPLETED" here — completion only happens via recordImplementationOutcome,
   * so a status can never flip to done without an outcome record attached
   * (even if that record just says EVALUATION_PENDING).
   */
  updateInterventionStatus: adminProcedure
    .input(
      z.object({
        interventionId: z.string(),
        status: z.enum(["IN_PROGRESS", "ABANDONED"]),
        abandonmentReason: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database unavailable" });
      }

      const [existing] = await db.select().from(kbInterventions).where(eq(kbInterventions.id, input.interventionId));
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Intervention not found" });
      }
      if (input.status === "ABANDONED" && !input.abandonmentReason?.trim()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Abandoning an intervention requires a reason." });
      }

      await db
        .update(kbInterventions)
        .set({
          interventionStatus: input.status,
          statusUpdatedAt: new Date(),
          ...(input.status === "ABANDONED" ? { abandonmentReason: input.abandonmentReason } : {}),
        })
        .where(eq(kbInterventions.id, input.interventionId));

      return { success: true };
    }),

  /**
   * Record what actually happened once an intervention was carried out.
   * outcomeLabel is NEVER auto-assigned (per FPKB_SCHEMA_V1.md) — a human
   * reviewer sets it explicitly here, with evidence notes, and the action
   * is written to the append-only governance audit trail. Deliberately does
   * NOT auto-adjust the source pattern's confidenceLevel — that's a
   * separate, later review action (kb_review_schedule, gap #9 territory),
   * not something a single outcome record should trigger on its own.
   */
  recordImplementationOutcome: adminProcedure
    .input(
      z.object({
        interventionId: z.string(),
        actualImplementationDate: z.string().optional(),
        actualScope: z.enum(["ED_ONLY", "WARD", "HOSPITAL_WIDE", "NETWORK", "NATIONAL"]).optional(),
        modificationsFromPlan: z.string().max(2000).optional(),
        implementationFidelity: z.enum(["HIGH", "PARTIAL", "LOW", "NOT_IMPLEMENTED"]),
        outcomeLabel: z.enum(["IMPROVED", "NO_IMPROVEMENT", "WORSENED", "EVALUATION_PENDING"]),
        outcomeEvidenceNotes: z.string().min(10).max(4000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database unavailable" });
      }

      const [intervention] = await db.select().from(kbInterventions).where(eq(kbInterventions.id, input.interventionId));
      if (!intervention) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Intervention not found" });
      }

      const [existing] = await db
        .select()
        .from(kbImplementations)
        .where(eq(kbImplementations.interventionId, input.interventionId));

      const sharedValues = {
        actualImplementationDate: input.actualImplementationDate ? new Date(input.actualImplementationDate) : null,
        actualScope: input.actualScope ?? null,
        modificationsFromPlan: input.modificationsFromPlan ?? null,
        implementationFidelity: input.implementationFidelity,
        outcomeLabel: input.outcomeLabel,
        outcomeEvidenceNotes: input.outcomeEvidenceNotes,
        outcomeRecordedAt: new Date(),
        outcomeRecordedBy: String(ctx.user.id),
      };

      let id: string;
      if (existing) {
        id = existing.id;
        await db.update(kbImplementations).set(sharedValues).where(eq(kbImplementations.id, id));
      } else {
        id = newId();
        await db.insert(kbImplementations).values({
          id,
          interventionId: input.interventionId,
          createdBy: String(ctx.user.id),
          ...sharedValues,
        });
      }

      if (intervention.interventionStatus !== "COMPLETED") {
        await db
          .update(kbInterventions)
          .set({ interventionStatus: "COMPLETED", statusUpdatedAt: new Date() })
          .where(eq(kbInterventions.id, input.interventionId));
      }

      await logGovernanceAudit({
        actorUserId: String(ctx.user.id),
        actionType: "IMPLEMENTATION_OUTCOME_LABELLED",
        entityType: "IMPLEMENTATION",
        entityId: id,
        newState: { outcomeLabel: input.outcomeLabel, implementationFidelity: input.implementationFidelity },
        reasoning: input.outcomeEvidenceNotes,
      });

      // Stage 8 self-evaluation (Observation Architecture §6.8) — the
      // system evaluates its own recommendation against what actually
      // happened, not just what was drafted.
      const [interventionForRec] = await db
        .select()
        .from(kbInterventions)
        .where(eq(kbInterventions.id, input.interventionId));
      if (interventionForRec) {
        await reEvaluateAfterImplementationOutcome(db, {
          recommendationId: interventionForRec.recommendationId,
          outcomeLabel: input.outcomeLabel,
        });
      }

      return { id };
    }),
});
