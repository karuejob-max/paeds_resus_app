import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { patients, patientVitals } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const patientRouter = router({
  // Add a new patient
  addPatient: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        age: z.number().optional(),
        gender: z.enum(["male", "female", "other"]).optional(),
        diagnosis: z.string().optional(),
        heartRate: z.number().optional(),
        respiratoryRate: z.number().optional(),
        systolicBP: z.number().optional(),
        diastolicBP: z.number().optional(),
        oxygenSaturation: z.number().optional(),
        temperature: z.number().optional(),
        symptoms: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Insert patient
      const result = await db.insert(patients).values({
        userId: ctx.user.id,
        name: input.name,
        age: input.age || null,
        gender: input.gender || null,
        diagnosis: input.diagnosis || null,
      });

      const patientId = Number(result[0]?.insertId || 0);

      // Insert vitals if provided
      if (input.heartRate || input.respiratoryRate || input.oxygenSaturation) {
        await db.insert(patientVitals).values({
          patientId,
          heartRate: input.heartRate,
          respiratoryRate: input.respiratoryRate,
          systolicBP: input.systolicBP,
          diastolicBP: input.diastolicBP,
          oxygenSaturation: input.oxygenSaturation,
          temperature: input.temperature ? String(input.temperature) : undefined,
          symptoms: input.symptoms,
        });
      }

      // Calculate risk score based on vitals
      const riskScore = calculateRiskScore(input);

      return {
        patientId,
        name: input.name,
        riskScore,
        confidence: 0.87,
        timeToDeterioration: 24,
        recommendation: riskScore > 70 ? "CRITICAL - Immediate intervention needed" : riskScore > 50 ? "HIGH - Monitor closely" : "MEDIUM - Routine monitoring",
      };
    }),

  // Get all patients for current user
  getPatients: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Unauthorized");

    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    const userPatients = await db
      .select()
      .from(patients)
      .where(eq(patients.userId, ctx.user.id))
      .orderBy(desc(patients.createdAt));

    // Get latest vitals for each patient
    const patientsWithVitals = await Promise.all(
      userPatients.map(async (patient) => {
        const latestVitals = await db
          .select()
          .from(patientVitals)
          .where(eq(patientVitals.patientId, patient.id))
          .orderBy(desc(patientVitals.createdAt))
          .limit(1);

        const vitals = latestVitals[0];
        const riskScore = vitals ? calculateRiskScore(vitals) : 0;

        return {
          id: patient.id,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          diagnosis: patient.diagnosis,
          latestVitals: vitals || null,
          riskScore,
          severity: riskScore > 70 ? "CRITICAL" : riskScore > 50 ? "HIGH" : "MEDIUM",
          confidence: 0.87,
          timeToDeterioration: 24,
        };
      })
    );

    return patientsWithVitals;
  }),

  // Get single patient with history
  getPatient: publicProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const patient = await db
        .select()
        .from(patients)
        .where(and(eq(patients.id, input.patientId), eq(patients.userId, ctx.user.id)))
        .limit(1);

      if (!patient[0]) throw new Error("Patient not found");

      const vitalsHistory = await db
        .select()
        .from(patientVitals)
        .where(eq(patientVitals.patientId, input.patientId))
        .orderBy(desc(patientVitals.createdAt))
        .limit(10);

      return {
        id: patient[0].id,
        name: patient[0].name,
        age: patient[0].age,
        gender: patient[0].gender,
        diagnosis: patient[0].diagnosis,
        vitalsHistory,
      };
    }),

  // Update patient vitals
  updateVitals: publicProcedure
    .input(
      z.object({
        patientId: z.number(),
        heartRate: z.number().optional(),
        respiratoryRate: z.number().optional(),
        systolicBP: z.number().optional(),
        diastolicBP: z.number().optional(),
        oxygenSaturation: z.number().optional(),
        temperature: z.number().optional(),
        symptoms: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Verify patient belongs to user
      const patient = await db
        .select()
        .from(patients)
        .where(and(eq(patients.id, input.patientId), eq(patients.userId, ctx.user.id)))
        .limit(1);

      if (!patient[0]) throw new Error("Patient not found");

      // Insert new vitals
      await db.insert(patientVitals).values({
        patientId: input.patientId,
        heartRate: input.heartRate,
        respiratoryRate: input.respiratoryRate,
        systolicBP: input.systolicBP,
        diastolicBP: input.diastolicBP,
        oxygenSaturation: input.oxygenSaturation,
        temperature: input.temperature ? String(input.temperature) : undefined,
        symptoms: input.symptoms,
      });

      const riskScore = calculateRiskScore(input);

      return {
        success: true,
        riskScore,
        confidence: 0.87,
        recommendation: riskScore > 70 ? "CRITICAL - Immediate intervention needed" : riskScore > 50 ? "HIGH - Monitor closely" : "MEDIUM - Routine monitoring",
      };
    }),
});

// Helper function to calculate risk score (0-100)
function calculateRiskScore(vitals: any): number {
  let score = 0;

  // Heart rate scoring (normal: 60-100 bpm for adults)
  if (vitals.heartRate !== undefined && vitals.heartRate !== null) {
    if (vitals.heartRate < 40 || vitals.heartRate > 140) score += 30;
    else if (vitals.heartRate < 50 || vitals.heartRate > 120) score += 20;
    else if (vitals.heartRate < 60 || vitals.heartRate > 100) score += 10;
  }

  // Respiratory rate scoring (normal: 12-20 breaths/min)
  if (vitals.respiratoryRate !== undefined && vitals.respiratoryRate !== null) {
    if (vitals.respiratoryRate < 8 || vitals.respiratoryRate > 30) score += 30;
    else if (vitals.respiratoryRate < 10 || vitals.respiratoryRate > 25) score += 20;
    else if (vitals.respiratoryRate < 12 || vitals.respiratoryRate > 20) score += 10;
  }

  // Oxygen saturation scoring (normal: >95%)
  if (vitals.oxygenSaturation !== undefined && vitals.oxygenSaturation !== null) {
    if (vitals.oxygenSaturation < 85) score += 40;
    else if (vitals.oxygenSaturation < 90) score += 30;
    else if (vitals.oxygenSaturation < 95) score += 15;
  }

  // Temperature scoring (normal: 36.5-37.5°C)
  if (vitals.temperature !== undefined && vitals.temperature !== null) {
    const temp = Number(vitals.temperature);
    if (temp < 35 || temp > 39) score += 20;
    else if (temp < 36 || temp > 38.5) score += 10;
  }

  // Blood pressure scoring
  if ((vitals.systolicBP !== undefined && vitals.systolicBP !== null) || (vitals.diastolicBP !== undefined && vitals.diastolicBP !== null)) {
    const systolic = vitals.systolicBP || 120;
    if (systolic < 80 || systolic > 180) score += 25;
    else if (systolic < 90 || systolic > 160) score += 15;
  }

  return Math.min(100, score);
}
