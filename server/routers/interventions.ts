import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { interventions, outcomes, impactMetrics } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const interventionRouter = router({
  // Log an intervention
  logIntervention: publicProcedure
    .input(
      z.object({
        patientId: z.number(),
        interventionType: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Insert intervention
      const result = await db.insert(interventions).values({
        patientId: input.patientId,
        userId: ctx.user.id,
        interventionType: input.interventionType,
        description: input.description,
      });

      return {
        success: true,
        interventionId: Number(result[0]?.insertId || 0),
        timestamp: new Date(),
      };
    }),

  // Log an outcome for an intervention
  logOutcome: publicProcedure
    .input(
      z.object({
        interventionId: z.number(),
        patientId: z.number(),
        outcome: z.enum(["improved", "stable", "deteriorated", "died"]),
        timeToOutcome: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Insert outcome
      const result = await db.insert(outcomes).values({
        interventionId: input.interventionId,
        patientId: input.patientId,
        outcome: input.outcome,
        timeToOutcome: input.timeToOutcome,
        notes: input.notes,
      });

      // Update impact metrics
      const livesSaved = input.outcome === "improved" ? 1 : 0;
      await updateImpactMetrics(db, ctx.user.id, livesSaved);

      return {
        success: true,
        outcomeId: Number(result[0]?.insertId || 0),
        livesSaved,
      };
    }),

  // Get interventions for a patient
  getPatientInterventions: publicProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const patientInterventions = await db
        .select()
        .from(interventions)
        .where(and(eq(interventions.patientId, input.patientId), eq(interventions.userId, ctx.user.id)))
        .orderBy(desc(interventions.createdAt));

      // Get outcomes for each intervention
      const interventionsWithOutcomes = await Promise.all(
        patientInterventions.map(async (intervention) => {
          const outcomeRecords = await db
            .select()
            .from(outcomes)
            .where(eq(outcomes.interventionId, intervention.id))
            .limit(1);

          return {
            id: intervention.id,
            interventionType: intervention.interventionType,
            description: intervention.description,
            timestamp: intervention.timestamp,
            outcome: outcomeRecords[0]?.outcome || null,
            timeToOutcome: outcomeRecords[0]?.timeToOutcome || null,
          };
        })
      );

      return interventionsWithOutcomes;
    }),

  // Get user's intervention statistics
  getInterventionStats: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Unauthorized");

    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const userInterventions = await db
      .select()
      .from(interventions)
      .where(eq(interventions.userId, ctx.user.id));

    // Get user's interventions first
    const userInterventionIds = userInterventions.map((i) => i.id);

    const userOutcomes = userInterventionIds.length > 0
      ? await db
          .select()
          .from(outcomes)
          .where(eq(outcomes.interventionId, userInterventionIds[0]))
      : [];

    // Recalculate userOutcomes properly
    let allUserOutcomes: any[] = [];
    for (const intervention of userInterventions) {
      const outcomeRecords = await db
        .select()
        .from(outcomes)
        .where(eq(outcomes.interventionId, intervention.id));
      allUserOutcomes = [...allUserOutcomes, ...outcomeRecords];
    }

    const improvedCount = allUserOutcomes.filter((o) => o.outcome === "improved").length;
    const stableCount = allUserOutcomes.filter((o) => o.outcome === "stable").length;
    const deterioratedCount = allUserOutcomes.filter((o) => o.outcome === "deteriorated").length;
    const diedCount = allUserOutcomes.filter((o) => o.outcome === "died").length;

    return {
      totalInterventions: userInterventions.length,
      totalOutcomes: allUserOutcomes.length,
      improved: improvedCount,
      stable: stableCount,
      deteriorated: deterioratedCount,
      died: diedCount,
      successRate: userOutcomes.length > 0 ? Math.round((improvedCount / userOutcomes.length) * 100) : 0,
      livesSaved: improvedCount,
    };
  }),
});

// Helper function to update impact metrics
async function updateImpactMetrics(db: any, userId: number, livesSaved: number) {
  // Get today's metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayMetrics = await db
    .select()
    .from(impactMetrics)
    .where(
      and(
        eq(impactMetrics.userId, userId),
        eq(impactMetrics.period, "daily")
      )
    )
    .orderBy(desc(impactMetrics.createdAt))
    .limit(1);

  if (todayMetrics[0]) {
    // Update existing metric
    const updated = await db
      .update(impactMetrics)
      .set({
        livesSaved: (todayMetrics[0].livesSaved || 0) + livesSaved,
        interventionsLogged: (todayMetrics[0].interventionsLogged || 0) + 1,
      })
      .where(eq(impactMetrics.id, todayMetrics[0].id));
  } else {
    // Create new metric
    await db.insert(impactMetrics).values({
      userId,
      period: "daily",
      interventionsLogged: 1,
      livesSaved,
    });
  }
}
