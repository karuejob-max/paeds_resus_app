import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import {
  emergencyProtocols,
  protocolSteps,
  protocolAdherenceLog,
  protocolDecisionPoints,
  protocolRecommendations,
  patientVitals,
} from "../../drizzle/schema";
import { eq, and, desc, gte, lte, inArray } from "drizzle-orm";

export const emergencyProtocolsRouter = router({
  // Get all protocols
  getAllProtocols: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const protocols = await (db as any)
      .select()
      .from(emergencyProtocols)
      .orderBy(emergencyProtocols.category);

    return { protocols };
  }),

  // Get protocol by ID with all steps
  getProtocol: publicProcedure
    .input(z.object({ protocolId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const protocol = await (db as any)
        .select()
        .from(emergencyProtocols)
        .where(eq(emergencyProtocols.id, input.protocolId))
        .limit(1);

      if (!protocol || protocol.length === 0) throw new Error("Protocol not found");

      const steps = await (db as any)
        .select()
        .from(protocolSteps)
        .where(eq(protocolSteps.protocolId, input.protocolId))
        .orderBy(protocolSteps.stepNumber);

      const decisionPoints = await (db as any)
        .select()
        .from(protocolDecisionPoints)
        .where(eq(protocolDecisionPoints.protocolId, input.protocolId));

      return {
        protocol: protocol[0],
        steps,
        decisionPoints,
      };
    }),

  // Get protocol by category
  getProtocolByCategory: publicProcedure
    .input(z.object({ category: z.enum(["diarrhea", "pneumonia", "malaria", "meningitis", "shock"]) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const protocol = await (db as any)
        .select()
        .from(emergencyProtocols)
        .where(eq(emergencyProtocols.category, input.category))
        .limit(1);

      if (!protocol || protocol.length === 0) {
        return { protocol: null, steps: [], decisionPoints: [] };
      }

      const steps = await (db as any)
        .select()
        .from(protocolSteps)
        .where(eq(protocolSteps.protocolId, protocol[0].id))
        .orderBy(protocolSteps.stepNumber);

      const decisionPoints = await (db as any)
        .select()
        .from(protocolDecisionPoints)
        .where(eq(protocolDecisionPoints.protocolId, protocol[0].id));

      return {
        protocol: protocol[0],
        steps,
        decisionPoints,
      };
    }),

  // Start protocol adherence tracking
  startProtocol: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        protocolId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const result = await (db as any).insert(protocolAdherenceLog).values({
        patientId: input.patientId,
        providerId: ctx.user.id,
        protocolId: input.protocolId,
        status: "started",
        stepsCompleted: 0,
      });

      return {
        adherenceLogId: Number(result[0]?.insertId || 0),
        startTime: new Date(),
      };
    }),

  // Update protocol step completion
  completeStep: protectedProcedure
    .input(
      z.object({
        adherenceLogId: z.number(),
        stepId: z.number(),
        stepNumber: z.number(),
        outcome: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const log = await (db as any)
        .select()
        .from(protocolAdherenceLog)
        .where(eq(protocolAdherenceLog.id, input.adherenceLogId))
        .limit(1);

      if (!log || log.length === 0) throw new Error("Adherence log not found");

      const stepsCompleted = input.stepNumber;
      const adherenceScore = log[0].totalSteps
        ? (stepsCompleted / log[0].totalSteps) * 100
        : 0;

      await (db as any)
        .update(protocolAdherenceLog)
        .set({
          stepsCompleted,
          adherenceScore: adherenceScore,
          status: "in_progress",
        })
        .where(eq(protocolAdherenceLog.id, input.adherenceLogId));

      return {
        stepCompleted: input.stepNumber,
        adherenceScore: Math.round(adherenceScore),
      };
    }),

  // End protocol adherence tracking
  endProtocol: protectedProcedure
    .input(
      z.object({
        adherenceLogId: z.number(),
        outcome: z.enum(["improved", "stable", "deteriorated", "transferred", "unknown"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      await (db as any)
        .update(protocolAdherenceLog)
        .set({
          status: "completed",
          outcome: input.outcome,
          notes: input.notes,
          endTime: new Date(),
        })
        .where(eq(protocolAdherenceLog.id, input.adherenceLogId));

      return {
        adherenceLogId: input.adherenceLogId,
        status: "completed",
        outcome: input.outcome,
      };
    }),

  // Get protocol recommendations for a patient based on vital signs and symptoms
  getRecommendations: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        symptoms: z.array(z.string()).optional(),
        vitalSigns: z.object({
          temperature: z.number().optional(),
          respiratoryRate: z.number().optional(),
          heartRate: z.number().optional(),
          bloodPressure: z.string().optional(),
          oxygenSaturation: z.number().optional(),
        }).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get all protocols
      const allProtocols = await (db as any)
        .select()
        .from(emergencyProtocols);

      // Score protocols based on symptom and vital sign matching
      const recommendations = allProtocols
        .map((protocol: any) => {
          let score = 0;
          const matchingSymptoms: string[] = [];
          const matchingVitalSigns: string[] = [];

          // Parse protocol symptoms
          const protocolSymptoms = protocol.keySymptoms
            ? JSON.parse(protocol.keySymptoms)
            : [];

          // Match symptoms
          if (input.symptoms) {
            input.symptoms.forEach((symptom: string) => {
              if (
                protocolSymptoms.some((ps: string) =>
                  ps.toLowerCase().includes(symptom.toLowerCase())
                )
              ) {
                matchingSymptoms.push(symptom);
                score += 20;
              }
            });
          }

          // Match vital signs (simplified scoring)
          if (input.vitalSigns) {
            if (input.vitalSigns.temperature && input.vitalSigns.temperature > 38.5) {
              if (["malaria", "pneumonia", "meningitis"].includes(protocol.category)) {
                matchingVitalSigns.push("High fever");
                score += 15;
              }
            }

            if (input.vitalSigns.respiratoryRate && input.vitalSigns.respiratoryRate > 40) {
              if (["pneumonia", "diarrhea", "shock"].includes(protocol.category)) {
                matchingVitalSigns.push("Tachypnea");
                score += 15;
              }
            }

            if (input.vitalSigns.heartRate && input.vitalSigns.heartRate > 120) {
              if (["shock", "malaria", "pneumonia"].includes(protocol.category)) {
                matchingVitalSigns.push("Tachycardia");
                score += 15;
              }
            }

            if (input.vitalSigns.oxygenSaturation && input.vitalSigns.oxygenSaturation < 92) {
              if (["pneumonia", "shock"].includes(protocol.category)) {
                matchingVitalSigns.push("Hypoxemia");
                score += 20;
              }
            }
          }

          const confidence = Math.min(score, 100);

          return {
            protocolId: protocol.id,
            protocolName: protocol.name,
            category: protocol.category,
            confidence,
            matchingSymptoms,
            matchingVitalSigns,
            priority: confidence > 70 ? "critical" : confidence > 40 ? "high" : "medium",
          };
        })
        .filter((rec: any) => rec.confidence > 0)
        .sort((a: any, b: any) => b.confidence - a.confidence);

      // Save top recommendation to database
      if (recommendations.length > 0) {
        const topRec = recommendations[0];
        await (db as any).insert(protocolRecommendations).values({
          patientId: input.patientId,
          providerId: ctx.user.id,
          protocolId: topRec.protocolId,
          confidence: topRec.confidence,
          matchingSymptoms: JSON.stringify(topRec.matchingSymptoms),
          matchingVitalSigns: JSON.stringify(topRec.matchingVitalSigns),
          reasoning: `Matched ${topRec.matchingSymptoms.length} symptoms and ${topRec.matchingVitalSigns.length} vital sign abnormalities`,
          priority: topRec.priority,
        });
      }

      return { recommendations };
    }),

  // Get protocol adherence history for provider
  getAdherenceHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const logs = await (db as any)
        .select()
        .from(protocolAdherenceLog)
        .where(eq(protocolAdherenceLog.providerId, ctx.user.id))
        .orderBy(desc(protocolAdherenceLog.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return { logs };
    }),

  // Get protocol adherence statistics
  getAdherenceStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Unauthorized");

    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const logs = await (db as any)
      .select()
      .from(protocolAdherenceLog)
      .where(eq(protocolAdherenceLog.providerId, ctx.user.id));

    const completedLogs = logs.filter((l: any) => l.status === "completed");
    const avgAdherence =
      completedLogs.length > 0
        ? completedLogs.reduce((sum: number, l: any) => sum + (l.adherenceScore || 0), 0) /
          completedLogs.length
        : 0;

    const outcomeStats = {
      improved: completedLogs.filter((l: any) => l.outcome === "improved").length,
      stable: completedLogs.filter((l: any) => l.outcome === "stable").length,
      deteriorated: completedLogs.filter((l: any) => l.outcome === "deteriorated").length,
      transferred: completedLogs.filter((l: any) => l.outcome === "transferred").length,
    };

    return {
      totalProtocolsUsed: logs.length,
      completedProtocols: completedLogs.length,
      avgAdherence: Math.round(avgAdherence * 10) / 10,
      outcomeStats,
    };
  }),

  // Get decision point for protocol step
  getDecisionPoint: publicProcedure
    .input(
      z.object({
        stepId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const decisionPoint = await (db as any)
        .select()
        .from(protocolDecisionPoints)
        .where(eq(protocolDecisionPoints.stepId, input.stepId))
        .limit(1);

      if (!decisionPoint || decisionPoint.length === 0) {
        return { decisionPoint: null };
      }

      return { decisionPoint: decisionPoint[0] };
    }),

  // Get next step based on decision
  getNextStep: publicProcedure
    .input(
      z.object({
        stepId: z.number(),
        decision: z.enum(["yes", "no"]),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const decisionPoint = await (db as any)
        .select()
        .from(protocolDecisionPoints)
        .where(eq(protocolDecisionPoints.stepId, input.stepId))
        .limit(1);

      if (!decisionPoint || decisionPoint.length === 0) {
        return { nextStepId: null };
      }

      const dp = decisionPoint[0];
      const nextStepId = input.decision === "yes" ? dp.yesNextStep : dp.noNextStep;

      if (!nextStepId) {
        return { nextStepId: null, message: "Protocol complete" };
      }

      const nextStep = await (db as any)
        .select()
        .from(protocolSteps)
        .where(eq(protocolSteps.id, nextStepId))
        .limit(1);

      return {
        nextStepId,
        nextStep: nextStep[0] || null,
      };
    }),
});
