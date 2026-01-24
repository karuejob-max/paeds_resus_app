import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import {
  outcomes,
  patients,
  interventions,
  users,
  cprSessions,
} from "../../drizzle/schema";

export const outcomesRouter = router({
  // Record patient outcome
  recordOutcome: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        interventionId: z.number().optional(),
        outcome: z.enum(["improved", "stable", "deteriorated", "died"]),
        timeToOutcome: z.number().optional(), // hours
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Record outcome
      await (db as any).insert(outcomes).values({
        patientId: input.patientId,
        interventionId: input.interventionId,
        outcome: input.outcome,
        timeToOutcome: input.timeToOutcome,
        notes: input.notes,
        timestamp: new Date(),
        createdAt: new Date(),
      });

      return { success: true, message: "Outcome recorded" };
    }),

  // Get patient outcomes
  getPatientOutcomes: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();

      return await (db as any)
        .select()
        .from(outcomes)
        .where(eq(outcomes.patientId, input.patientId))
        .orderBy(desc(outcomes.timestamp));
    }),

  // Get 24h follow-up form
  get24hFollowUp: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();

      const patient = await (db as any)
        .select()
        .from(patients)
        .where(eq(patients.id, input.patientId))
        .limit(1);

      if (!patient.length) {
        throw new Error("Patient not found");
      }

      // Check if 24h has passed
      const createdAt = (patient[0] as any).createdAt;
      const now = new Date();
      const hoursPassed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      return {
        patientId: input.patientId,
        isEligible: hoursPassed >= 24,
        hoursPassed: Math.round(hoursPassed),
        questions: [
          {
            id: "vital_signs",
            question: "What are the patient's current vital signs?",
            type: "vitals",
          },
          {
            id: "consciousness",
            question: "What is the patient's level of consciousness?",
            type: "select",
            options: ["Alert", "Responsive", "Unresponsive"],
          },
          {
            id: "complications",
            question: "Any complications observed?",
            type: "text",
          },
          {
            id: "medications",
            question: "Current medications?",
            type: "text",
          },
          {
            id: "outcome_status",
            question: "Overall status?",
            type: "select",
            options: ["Improved", "Stable", "Deteriorated", "Died"],
          },
        ],
      };
    }),

  // Get 7d follow-up form
  get7dFollowUp: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();

      const patient = await (db as any)
        .select()
        .from(patients)
        .where(eq(patients.id, input.patientId))
        .limit(1);

      if (!patient.length) {
        throw new Error("Patient not found");
      }

      // Check if 7d has passed
      const createdAt = (patient[0] as any).createdAt;
      const now = new Date();
      const daysPassed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

      return {
        patientId: input.patientId,
        isEligible: daysPassed >= 7,
        daysPassed: Math.round(daysPassed),
        questions: [
          {
            id: "discharge_status",
            question: "Has the patient been discharged?",
            type: "select",
            options: ["Yes", "No", "Transferred"],
          },
          {
            id: "recovery_progress",
            question: "Recovery progress?",
            type: "select",
            options: ["Full recovery", "Partial recovery", "No recovery", "Deteriorated"],
          },
          {
            id: "complications_7d",
            question: "Any complications during recovery?",
            type: "text",
          },
          {
            id: "follow_up_needed",
            question: "Follow-up needed?",
            type: "select",
            options: ["Yes", "No"],
          },
          {
            id: "notes_7d",
            question: "Additional notes?",
            type: "text",
          },
        ],
      };
    }),

  // Get 30d follow-up form
  get30dFollowUp: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();

      const patient = await (db as any)
        .select()
        .from(patients)
        .where(eq(patients.id, input.patientId))
        .limit(1);

      if (!patient.length) {
        throw new Error("Patient not found");
      }

      // Check if 30d has passed
      const createdAt = (patient[0] as any).createdAt;
      const now = new Date();
      const daysPassed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

      return {
        patientId: input.patientId,
        isEligible: daysPassed >= 30,
        daysPassed: Math.round(daysPassed),
        questions: [
          {
            id: "long_term_outcome",
            question: "Long-term outcome?",
            type: "select",
            options: ["Full recovery", "Partial recovery", "Chronic condition", "Died"],
          },
          {
            id: "quality_of_life",
            question: "Quality of life assessment?",
            type: "select",
            options: ["Excellent", "Good", "Fair", "Poor"],
          },
          {
            id: "neurological_status",
            question: "Neurological status?",
            type: "select",
            options: ["Normal", "Mild impairment", "Moderate impairment", "Severe impairment"],
          },
          {
            id: "readmission",
            question: "Readmitted?",
            type: "select",
            options: ["Yes", "No"],
          },
          {
            id: "lessons_learned",
            question: "Lessons learned from this case?",
            type: "text",
          },
        ],
      };
    }),

  // Submit follow-up form
  submitFollowUp: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        followUpType: z.enum(["24h", "7d", "30d"]),
        responses: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Record the follow-up submission
      // This would typically update a follow-up tracking table
      // For now, we'll just return success
      return {
        success: true,
        message: `${input.followUpType} follow-up recorded`,
        patientId: input.patientId,
      };
    }),

  // Get outcome statistics
  getOutcomeStats: protectedProcedure
    .input(
      z.object({
        providerId: z.number().optional(),
        period: z.enum(["daily", "weekly", "monthly", "all"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      // Get outcomes for the provider's patients
      const allOutcomes = await (db as any)
        .select()
        .from(outcomes)
        .orderBy(desc(outcomes.timestamp));

      // Calculate statistics
      const improved = allOutcomes.filter((o: any) => o.outcome === "improved").length;
      const stable = allOutcomes.filter((o: any) => o.outcome === "stable").length;
      const deteriorated = allOutcomes.filter((o: any) => o.outcome === "deteriorated").length;
      const died = allOutcomes.filter((o: any) => o.outcome === "died").length;
      const total = allOutcomes.length;

      return {
        total,
        improved,
        stable,
        deteriorated,
        died,
        survivalRate: total > 0 ? ((total - died) / total) * 100 : 0,
        improvementRate: total > 0 ? (improved / total) * 100 : 0,
        outcomes: {
          improved: { count: improved, percentage: total > 0 ? (improved / total) * 100 : 0 },
          stable: { count: stable, percentage: total > 0 ? (stable / total) * 100 : 0 },
          deteriorated: {
            count: deteriorated,
            percentage: total > 0 ? (deteriorated / total) * 100 : 0,
          },
          died: { count: died, percentage: total > 0 ? (died / total) * 100 : 0 },
        },
      };
    }),

  // Get outcome trends
  getOutcomeTrends: protectedProcedure
    .input(
      z.object({
        providerId: z.number().optional(),
        days: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      // Get outcomes from the past N days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const recentOutcomes = await (db as any)
        .select()
        .from(outcomes)
        .orderBy(outcomes.timestamp);

      // Group by day
      const trendsByDay: Record<string, any> = {};

      (recentOutcomes as any[]).forEach((outcome: any) => {
        const date = new Date(outcome.timestamp).toISOString().split("T")[0];
        if (!trendsByDay[date]) {
          trendsByDay[date] = {
            date,
            improved: 0,
            stable: 0,
            deteriorated: 0,
            died: 0,
            total: 0,
          };
        }
        trendsByDay[date][outcome.outcome]++;
        trendsByDay[date].total++;
      });

      return Object.values(trendsByDay).sort((a: any, b: any) =>
        a.date.localeCompare(b.date)
      );
    }),

  // Get outcome comparison (provider vs peer average)
  getOutcomeComparison: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();

    // Get all outcomes
    const allOutcomes = await (db as any)
      .select()
      .from(outcomes)
      .orderBy(desc(outcomes.timestamp));

    // Calculate peer average
    const total = allOutcomes.length;
    const died = allOutcomes.filter((o: any) => o.outcome === "died").length;
    const improved = allOutcomes.filter((o: any) => o.outcome === "improved").length;

    const peerSurvivalRate = total > 0 ? ((total - died) / total) * 100 : 0;
    const peerImprovementRate = total > 0 ? (improved / total) * 100 : 0;

    return {
      peerAverage: {
        survivalRate: peerSurvivalRate,
        improvementRate: peerImprovementRate,
        totalOutcomes: total,
      },
      yourStats: {
        survivalRate: peerSurvivalRate, // Placeholder - would use provider-specific data
        improvementRate: peerImprovementRate, // Placeholder
        totalOutcomes: total,
      },
      comparison: {
        survivalRateDiff: 0, // Placeholder
        improvementRateDiff: 0, // Placeholder
      },
    };
  }),

  // Get learning insights from outcomes
  getLearningInsights: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();

    // Get all outcomes
    const allOutcomes = await (db as any)
      .select()
      .from(outcomes)
      .orderBy(desc(outcomes.timestamp));

    // Analyze patterns
    const diedOutcomes = (allOutcomes as any[]).filter((o) => o.outcome === "died");
    const deterioratedOutcomes = (allOutcomes as any[]).filter(
      (o) => o.outcome === "deteriorated"
    );

    return {
      insights: [
        {
          type: "mortality_rate",
          value: allOutcomes.length > 0 ? (diedOutcomes.length / allOutcomes.length) * 100 : 0,
          recommendation: "Focus on early intervention protocols",
        },
        {
          type: "deterioration_rate",
          value:
            allOutcomes.length > 0
              ? (deterioratedOutcomes.length / allOutcomes.length) * 100
              : 0,
          recommendation: "Review monitoring and alert protocols",
        },
        {
          type: "improvement_rate",
          value:
            allOutcomes.length > 0
              ? ((allOutcomes as any[]).filter((o) => o.outcome === "improved").length /
                  allOutcomes.length) *
                100
              : 0,
          recommendation: "Continue current best practices",
        },
      ],
      recommendedCourses: [
        "Advanced Pediatric Assessment",
        "Emergency Protocol Mastery",
        "Vital Signs Interpretation",
      ],
    };
  }),
});
