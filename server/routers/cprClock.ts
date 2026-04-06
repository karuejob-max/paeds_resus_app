import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import {
  cprSessions,
  cprEvents,
  medicationLog,
  defibrillatorEvents,
  emergencyMedications,
  cprProtocols,
  patients,
} from "../../drizzle/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export const cprClockRouter = router({
  // Start a new CPR session
  startSession: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        ageMonths: z.number().optional(),
        weightKg: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const result = await (db as any).insert(cprSessions).values({
        patientId: input.patientId,
        providerId: ctx.user.id,
        status: "active",
        outcome: "ongoing",
      });

      return {
        sessionId: Number(result[0]?.insertId || 0),
        startTime: new Date(),
        status: "active",
      };
    }),

  // End a CPR session
  endSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        outcome: z.enum(["ROSC", "pCOSCA", "mortality", "ongoing"]),
        cprQuality: z.enum(["excellent", "good", "adequate", "poor"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const session = await (db as any)
        .select()
        .from(cprSessions)
        .where(eq(cprSessions.id, input.sessionId))
        .limit(1);

      if (!session || session.length === 0) throw new Error("Session not found");

      const endTime = new Date();
      const duration = Math.floor(
        (endTime.getTime() - session[0].startTime.getTime()) / 1000
      );

      await (db as any)
        .update(cprSessions)
        .set({
          status: "completed",
          outcome: input.outcome,
          cprQuality: input.cprQuality,
          notes: input.notes,
          endTime: endTime,
          totalDuration: duration,
        })
        .where(eq(cprSessions.id, input.sessionId));

      return {
        sessionId: input.sessionId,
        status: "completed",
        outcome: input.outcome,
        totalDuration: duration,
      };
    }),

  // Log a CPR event (compression, medication, defibrillation, etc.)
  logEvent: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        eventType: z.enum([
          "compression_cycle",
          "medication",
          "defibrillation",
          "airway",
          "note",
          "outcome",
        ]),
        eventTime: z.number(), // seconds from start
        description: z.string().optional(),
        value: z.string().optional(),
        metadata: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const result = await (db as any).insert(cprEvents).values({
        cprSessionId: input.sessionId,
        eventType: input.eventType,
        eventTime: input.eventTime,
        description: input.description,
        value: input.value,
        metadata: input.metadata,
      });

      return {
        eventId: Number(result[0]?.insertId || 0),
        timestamp: new Date(),
      };
    }),

  // Calculate medication dose based on weight
  calculateMedicationDose: publicProcedure
    .input(
      z.object({
        medicationId: z.number(),
        weightKg: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const med = await (db as any)
        .select()
        .from(emergencyMedications)
        .where(eq(emergencyMedications.id, input.medicationId))
        .limit(1);

      if (!med || med.length === 0) throw new Error("Medication not found");

      const medication = med[0];
      const dosagePerKg = parseFloat(medication.dosagePerKg || "0");
      const maxDose = parseFloat(medication.maxDose || "0");

      const calculatedDose = Math.min(
        dosagePerKg * input.weightKg,
        maxDose
      );

      return {
        medicationId: input.medicationId,
        medicationName: medication.name,
        weightKg: input.weightKg,
        dosagePerKg: dosagePerKg,
        calculatedDose: calculatedDose,
        maxDose: maxDose,
        route: medication.route,
        concentration: medication.concentration,
        interval: medication.interval,
      };
    }),

  // Log medication administration
  logMedication: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        medicationId: z.number(),
        administeredAt: z.number(), // seconds from start
        dose: z.number(),
        dosePerKg: z.number(),
        route: z.enum(["IV", "IO", "IM", "ET", "IN"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const result = await (db as any).insert(medicationLog).values({
        cprSessionId: input.sessionId,
        medicationId: input.medicationId,
        administeredAt: input.administeredAt,
        dose: input.dose,
        dosePerKg: input.dosePerKg,
        route: input.route,
        administeredBy: ctx.user.id,
        notes: input.notes,
      });

      return {
        logId: Number(result[0]?.insertId || 0),
        timestamp: new Date(),
      };
    }),

  // Calculate defibrillator energy level
  calculateDefibrillatorEnergy: publicProcedure
    .input(
      z.object({
        weightKg: z.number(),
        ageMonths: z.number().optional(),
        initialShock: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      // Pediatric defibrillation energy guidelines
      // Initial: 2 J/kg, subsequent: 4 J/kg, max 200 J initially, 360 J subsequently

      const initialEnergy = Math.min(2 * input.weightKg, 200);
      const subsequentEnergy = Math.min(4 * input.weightKg, 360);

      return {
        weightKg: input.weightKg,
        ageMonths: input.ageMonths,
        initialEnergy: Math.round(initialEnergy),
        subsequentEnergy: Math.round(subsequentEnergy),
        energyPerKg: input.initialShock ? 2 : 4,
        recommendation: `${Math.round(initialEnergy)} J for initial shock, ${Math.round(subsequentEnergy)} J for subsequent shocks`,
      };
    }),

  // Log defibrillator event
  logDefibrillation: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        eventTime: z.number(),
        rhythm: z.enum(["VF", "pulseless_VT", "asystole", "PEA", "sinus", "unknown"]),
        shockDelivered: z.boolean(),
        energyLevel: z.number(),
        energyPerKg: z.number(),
        outcome: z.enum(["ROSC", "no_change", "deterioration"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const result = await (db as any).insert(defibrillatorEvents).values({
        cprSessionId: input.sessionId,
        eventTime: input.eventTime,
        rhythm: input.rhythm,
        shockDelivered: input.shockDelivered,
        energyLevel: input.energyLevel,
        energyPerKg: input.energyPerKg,
        outcome: input.outcome,
        notes: input.notes,
      });

      return {
        eventId: Number(result[0]?.insertId || 0),
        timestamp: new Date(),
      };
    }),

  // Get CPR protocol for age/weight
  getProtocol: publicProcedure
    .input(
      z.object({
        ageMonths: z.number().optional(),
        weightKg: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      let query = (db as any).select().from(cprProtocols);

      if (input.ageMonths) {
        query = query.where(
          and(
            lte(cprProtocols.ageMin, input.ageMonths),
            gte(cprProtocols.ageMax, input.ageMonths)
          )
        );
      }

      const protocols = await query.limit(1);

      if (!protocols || protocols.length === 0) {
        return {
          protocol: null,
          message: "No protocol found for this age/weight",
        };
      }

      return {
        protocol: protocols[0],
      };
    }),

  // Get session details
  getSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const session = await (db as any)
        .select()
        .from(cprSessions)
        .where(eq(cprSessions.id, input.sessionId))
        .limit(1);

      if (!session || session.length === 0) throw new Error("Session not found");

      const events = await (db as any)
        .select()
        .from(cprEvents)
        .where(eq(cprEvents.cprSessionId, input.sessionId))
        .orderBy(cprEvents.eventTime);

      const medications = await (db as any)
        .select()
        .from(medicationLog)
        .where(eq(medicationLog.cprSessionId, input.sessionId));

      const defibrillations = await (db as any)
        .select()
        .from(defibrillatorEvents)
        .where(eq(defibrillatorEvents.cprSessionId, input.sessionId));

      return {
        session: session[0],
        events: events,
        medications: medications,
        defibrillations: defibrillations,
      };
    }),

  // Get all emergency medications
  getMedications: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const medications = await (db as any)
      .select()
      .from(emergencyMedications)
      .orderBy(emergencyMedications.category);

    return {
      medications: medications,
    };
  }),

  // Get provider's CPR sessions
  getProviderSessions: protectedProcedure
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

      const sessions = await (db as any)
        .select()
        .from(cprSessions)
        .where(eq(cprSessions.providerId, ctx.user.id))
        .orderBy(desc(cprSessions.startTime))
        .limit(input.limit)
        .offset(input.offset);

      return {
        sessions: sessions,
      };
    }),

  // Get CPR statistics for provider
  getProviderStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Unauthorized");

    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const sessions = await (db as any)
      .select()
      .from(cprSessions)
      .where(eq(cprSessions.providerId, ctx.user.id));

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(
      (s: any) => s.status === "completed"
    ).length;
    const roscCount = sessions.filter((s: any) => s.outcome === "ROSC").length;
    const mortalityCount = sessions.filter(
      (s: any) => s.outcome === "mortality"
    ).length;

    const avgDuration =
      sessions.length > 0
        ? sessions.reduce((sum: number, s: any) => sum + (s.totalDuration || 0), 0) /
          sessions.length
        : 0;

    const roscRate =
      completedSessions > 0 ? (roscCount / completedSessions) * 100 : 0;

    return {
      totalSessions,
      completedSessions,
      roscCount,
      mortalityCount,
      avgDuration: Math.round(avgDuration),
      roscRate: Math.round(roscRate * 10) / 10,
    };
  }),
});
