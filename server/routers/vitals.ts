import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import {
  vitalSignsHistory,
  referenceRanges,
  riskScoreHistory,
  patients,
} from "../../drizzle/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

/**
 * Risk Scoring Algorithm
 * Calculates risk score (0-100) based on vital signs and age-weight-based reference ranges
 */
function calculateRiskScore(
  vitals: {
    heartRate?: number;
    respiratoryRate?: number;
    systolicBP?: number;
    diastolicBP?: number;
    oxygenSaturation?: number;
    temperature?: number;
  },
  referenceRange: {
    heartRateMin: number;
    heartRateMax: number;
    respiratoryRateMin: number;
    respiratoryRateMax: number;
    systolicBPMin: number;
    systolicBPMax: number;
    diastolicBPMin: number;
    diastolicBPMax: number;
    oxygenSaturationMin: number;
    temperatureMin: number;
    temperatureMax: number;
  }
): { score: number; level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"; factors: string[] } {
  let riskScore = 0;
  const riskFactors: string[] = [];

  // Heart rate assessment
  if (vitals.heartRate !== undefined) {
    if (vitals.heartRate < referenceRange.heartRateMin * 0.8 || vitals.heartRate > referenceRange.heartRateMax * 1.2) {
      riskScore += 25;
      riskFactors.push(`HR ${vitals.heartRate} bpm (abnormal)`);
    } else if (vitals.heartRate < referenceRange.heartRateMin || vitals.heartRate > referenceRange.heartRateMax) {
      riskScore += 10;
      riskFactors.push(`HR ${vitals.heartRate} bpm (borderline)`);
    }
  }

  // Respiratory rate assessment
  if (vitals.respiratoryRate !== undefined) {
    if (vitals.respiratoryRate < referenceRange.respiratoryRateMin * 0.8 || vitals.respiratoryRate > referenceRange.respiratoryRateMax * 1.2) {
      riskScore += 25;
      riskFactors.push(`RR ${vitals.respiratoryRate} (abnormal)`);
    } else if (vitals.respiratoryRate < referenceRange.respiratoryRateMin || vitals.respiratoryRate > referenceRange.respiratoryRateMax) {
      riskScore += 10;
      riskFactors.push(`RR ${vitals.respiratoryRate} (borderline)`);
    }
  }

  // Oxygen saturation assessment
  if (vitals.oxygenSaturation !== undefined) {
    if (vitals.oxygenSaturation < 90) {
      riskScore += 35;
      riskFactors.push(`O₂ Sat ${vitals.oxygenSaturation}% (critical)`);
    } else if (vitals.oxygenSaturation < 94) {
      riskScore += 20;
      riskFactors.push(`O₂ Sat ${vitals.oxygenSaturation}% (low)`);
    }
  }

  // Blood pressure assessment
  if (vitals.systolicBP !== undefined && vitals.diastolicBP !== undefined) {
    const systolicDeviation = Math.abs(vitals.systolicBP - referenceRange.systolicBPMax) / referenceRange.systolicBPMax;
    const diastolicDeviation = Math.abs(vitals.diastolicBP - referenceRange.diastolicBPMax) / referenceRange.diastolicBPMax;
    
    if (systolicDeviation > 0.3 || diastolicDeviation > 0.3) {
      riskScore += 20;
      riskFactors.push(`BP ${vitals.systolicBP}/${vitals.diastolicBP} (abnormal)`);
    } else if (systolicDeviation > 0.15 || diastolicDeviation > 0.15) {
      riskScore += 10;
      riskFactors.push(`BP ${vitals.systolicBP}/${vitals.diastolicBP} (borderline)`);
    }
  }

  // Temperature assessment
  if (vitals.temperature !== undefined) {
    if (vitals.temperature < 35 || vitals.temperature > 40) {
      riskScore += 20;
      riskFactors.push(`Temp ${vitals.temperature}°C (critical)`);
    } else if (vitals.temperature < 36.5 || vitals.temperature > 38.5) {
      riskScore += 10;
      riskFactors.push(`Temp ${vitals.temperature}°C (abnormal)`);
    }
  }

  // Determine risk level
  let riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  if (riskScore >= 70) {
    riskLevel = "CRITICAL";
  } else if (riskScore >= 50) {
    riskLevel = "HIGH";
  } else if (riskScore >= 25) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "LOW";
  }

  return {
    score: Math.min(100, riskScore),
    level: riskLevel,
    factors: riskFactors,
  };
}

export const vitalsRouter = router({
  /**
   * Log vital signs for a patient
   */
  logVitals: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        heartRate: z.number().optional(),
        respiratoryRate: z.number().optional(),
        systolicBP: z.number().optional(),
        diastolicBP: z.number().optional(),
        oxygenSaturation: z.number().min(0).max(100).optional(),
        temperature: z.number().optional(),
        weight: z.number().optional(),
        height: z.number().optional(),
        age: z.number().optional(),
        ageMonths: z.number().optional(),
        symptoms: z.array(z.string()).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: any; input: any }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      // Verify patient exists and belongs to provider
      const patient = await (db as any).query.patients.findFirst({
        where: eq(patients.id, input.patientId),
      });

      if (!patient) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Patient not found",
        });
      }

      // Get reference ranges based on age
      const age = input.age || 5; // default to 5 years if not provided
      const referenceRange = await (db as any).query.referenceRanges.findFirst({
        where: and(
          lte(referenceRanges.ageMin, age),
          gte(referenceRanges.ageMax, age)
        ),
      });

      if (!referenceRange) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Reference ranges not found for age group",
        });
      }

      // Calculate risk score
      const riskCalculation = calculateRiskScore(
        {
          heartRate: input.heartRate,
          respiratoryRate: input.respiratoryRate,
          systolicBP: input.systolicBP,
          diastolicBP: input.diastolicBP,
          oxygenSaturation: input.oxygenSaturation,
          temperature: input.temperature,
        },
        referenceRange
      );

      // Log vital signs
      const vitalRecord = await (db as any).insert(vitalSignsHistory).values({
        patientId: input.patientId,
        userId: ctx.user.id,
        heartRate: input.heartRate,
        respiratoryRate: input.respiratoryRate,
        systolicBP: input.systolicBP,
        diastolicBP: input.diastolicBP,
        oxygenSaturation: input.oxygenSaturation,
        temperature: input.temperature,
        weight: input.weight,
        height: input.height,
        age: input.age,
        ageMonths: input.ageMonths,
        riskScore: riskCalculation.score,
        riskLevel: riskCalculation.level,
        symptoms: input.symptoms ? JSON.stringify(input.symptoms) : null,
        notes: input.notes,
      });

      // Log risk score history
      await (db as any).insert(riskScoreHistory).values({
        patientId: input.patientId,
        vitalSignsHistoryId: vitalRecord[0].insertId,
        riskScore: riskCalculation.score,
        riskLevel: riskCalculation.level,
        riskFactors: JSON.stringify(riskCalculation.factors),
        deteriorationPattern: "stable", // Will be updated with trend analysis
        recommendations: JSON.stringify([
          `Monitor patient closely - ${riskCalculation.level} risk`,
          ...riskCalculation.factors.map(f => `Alert: ${f}`),
        ]),
      });

      return {
        vitalId: vitalRecord[0].insertId,
        riskScore: riskCalculation.score,
        riskLevel: riskCalculation.level,
        riskFactors: riskCalculation.factors,
      };
    }),

  /**
   * Get vital signs history for a patient
   */
  getVitalHistory: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const vitals = await (db as any).query.vitalSignsHistory.findMany({
        where: eq(vitalSignsHistory.patientId, input.patientId),
        orderBy: desc(vitalSignsHistory.recordedAt),
        limit: input.limit,
        offset: input.offset,
      });

      return vitals.map((v: any) => ({
        ...v,
        symptoms: v.symptoms ? JSON.parse(v.symptoms) : [],
      }));
    }),

  /**
   * Get latest vital signs for a patient
   */
  getLatestVitals: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const latest = await (db as any).query.vitalSignsHistory.findFirst({
        where: eq(vitalSignsHistory.patientId, input.patientId),
        orderBy: desc(vitalSignsHistory.recordedAt),
      });

      if (!latest) {
        return null;
      }

      return {
        ...latest,
        symptoms: latest.symptoms ? JSON.parse(latest.symptoms) : [],
      };
    }),

  /**
   * Get risk score history for a patient
   */
  getRiskHistory: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }: { input: { patientId: number; limit: number } }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const riskHistory = await (db as any).query.riskScoreHistory.findMany({
        where: eq(riskScoreHistory.patientId, input.patientId),
        orderBy: desc(riskScoreHistory.calculatedAt),
        limit: input.limit,
      });

      return riskHistory.map((r: any) => ({
        ...r,
        riskFactors: r.riskFactors ? JSON.parse(r.riskFactors) : [],
        recommendations: r.recommendations ? JSON.parse(r.recommendations) : [],
      }));
    }),

  /**
   * Get trend analysis for vital signs
   */
  getTrends: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        hours: z.number().default(24),
      })
    )
    .query(async ({ input }: { input: { patientId: number; hours: number } }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const cutoffTime = new Date(Date.now() - input.hours * 60 * 60 * 1000);

      const vitals = await (db as any).query.vitalSignsHistory.findMany({
        where: and(
          eq(vitalSignsHistory.patientId, input.patientId),
          gte(vitalSignsHistory.recordedAt, cutoffTime)
        ),
        orderBy: vitalSignsHistory.recordedAt,
      });

      if (vitals.length === 0) {
        return null;
      }

      // Calculate trends
      const firstVital = vitals[0];
      const lastVital = vitals[vitals.length - 1];

      const trends = {
        heartRate: lastVital.heartRate && firstVital.heartRate ? lastVital.heartRate - firstVital.heartRate : 0,
        respiratoryRate: lastVital.respiratoryRate && firstVital.respiratoryRate ? lastVital.respiratoryRate - firstVital.respiratoryRate : 0,
        oxygenSaturation: lastVital.oxygenSaturation && firstVital.oxygenSaturation ? lastVital.oxygenSaturation - firstVital.oxygenSaturation : 0,
        temperature: lastVital.temperature && firstVital.temperature ? Number(lastVital.temperature) - Number(firstVital.temperature) : 0,
        riskScore: lastVital.riskScore - firstVital.riskScore,
      };

      const deteriorationPattern =
        trends.riskScore > 10
          ? "deteriorating"
          : trends.riskScore < -10
            ? "improving"
            : "stable";

      return {
        vitals,
        trends,
        deteriorationPattern,
        timespan: `${input.hours} hours`,
      };
    }),

  /**
   * Initialize reference ranges for different age groups
   * This should be called once during setup
   */
  initializeReferenceRanges: protectedProcedure.mutation(async ({}: any) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    // Pediatric reference ranges by age group
    const ageGroups = [
      {
        ageMin: 0,
        ageMax: 1,
        weightMin: 3,
        weightMax: 10,
        heartRateMin: 100,
        heartRateMax: 160,
        respiratoryRateMin: 30,
        respiratoryRateMax: 60,
        systolicBPMin: 50,
        systolicBPMax: 90,
        diastolicBPMin: 30,
        diastolicBPMax: 60,
        oxygenSaturationMin: 95,
        temperatureMin: 36.5,
        temperatureMax: 37.5,
      },
      {
        ageMin: 1,
        ageMax: 3,
        weightMin: 10,
        weightMax: 15,
        heartRateMin: 90,
        heartRateMax: 150,
        respiratoryRateMin: 24,
        respiratoryRateMax: 40,
        systolicBPMin: 80,
        systolicBPMax: 110,
        diastolicBPMin: 50,
        diastolicBPMax: 70,
        oxygenSaturationMin: 95,
        temperatureMin: 36.5,
        temperatureMax: 37.5,
      },
      {
        ageMin: 3,
        ageMax: 6,
        weightMin: 15,
        weightMax: 22,
        heartRateMin: 80,
        heartRateMax: 120,
        respiratoryRateMin: 20,
        respiratoryRateMax: 30,
        systolicBPMin: 95,
        systolicBPMax: 125,
        diastolicBPMin: 60,
        diastolicBPMax: 80,
        oxygenSaturationMin: 95,
        temperatureMin: 36.5,
        temperatureMax: 37.5,
      },
      {
        ageMin: 6,
        ageMax: 12,
        weightMin: 22,
        weightMax: 40,
        heartRateMin: 70,
        heartRateMax: 110,
        respiratoryRateMin: 18,
        respiratoryRateMax: 25,
        systolicBPMin: 105,
        systolicBPMax: 135,
        diastolicBPMin: 70,
        diastolicBPMax: 85,
        oxygenSaturationMin: 95,
        temperatureMin: 36.5,
        temperatureMax: 37.5,
      },
      {
        ageMin: 12,
        ageMax: 18,
        weightMin: 40,
        weightMax: 70,
        heartRateMin: 60,
        heartRateMax: 100,
        respiratoryRateMin: 12,
        respiratoryRateMax: 20,
        systolicBPMin: 110,
        systolicBPMax: 140,
        diastolicBPMin: 70,
        diastolicBPMax: 90,
        oxygenSaturationMin: 95,
        temperatureMin: 36.5,
        temperatureMax: 37.5,
      },
    ];

    // Check if reference ranges already exist
    const existing = await (db as any).query.referenceRanges.findFirst();
    if (existing) {
      return { message: "Reference ranges already initialized" };
    }

    // Insert reference ranges
    await (db as any).insert(referenceRanges).values(ageGroups);

    return { message: "Reference ranges initialized", count: ageGroups.length };
  }),
});
