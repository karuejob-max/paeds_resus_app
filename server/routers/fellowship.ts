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
import { eq, and, inArray } from "drizzle-orm";
import {
  fellowshipProgress,
  fellowshipGraceUsage,
  fellowshipStreakResets,
  resusGPSSessions,
  resusGPSCases,
  careSignalEvents,
  microCourseEnrollments,
  certificates,
  users,
} from "../../drizzle/schema";
import {
  computeCareSignalStreak,
  enumerateMonthsEndingAt,
} from "./fellowship-care-signal-streak";
import { getResusGpsAccessForClient } from "../lib/resusgps-access";

/**
 * Calculate courses completion percentage (Pillar 1)
 * Returns: { completed, required, percentage }
 */
async function calculateCoursesPillar(userId: number) {
  const db = await getDb();
  if (!db) {
    return {
      completed: 0,
      required: 27,
      percentage: 0,
      legacyCourses: 0,
    };
  }

  try {
    // Get all completed certificates for this user
    const completedCerts = await db.query.certificates.findMany({
      where: (certs) => eq(certs.userId, userId),
    });

    // Get all completed micro-course enrollments
    const completedMicroCourses = await db.query.microCourseEnrollments.findMany({
      where: (enrollments) =>
        and(
          eq(enrollments.userId, userId),
          eq(enrollments.enrollmentStatus, "completed")
        ),
    });

    // Count legacy courses (BLS, ACLS, PALS, Instructor)
    const legacyCourses = completedCerts.filter((c) =>
      ["bls", "acls", "pals", "instructor"].includes(c.programType)
    ).length;

    // Count micro-courses (should be 27 for fellowship)
    const microCourses = completedMicroCourses.length;

    // Total required: 27 micro-courses (legacy courses are bonus)
    const totalRequired = 27;
    const completed = microCourses;
    const percentage = Math.min(100, Math.round((completed / totalRequired) * 100));

    return {
      completed,
      required: totalRequired,
      percentage,
      legacyCourses,
    };
  } catch (error) {
    console.error("[Fellowship] Error calculating courses pillar:", error);
    return {
      completed: 0,
      required: 27,
      percentage: 0,
      legacyCourses: 0,
    };
  }
}

/**
 * Calculate ResusGPS pillar (Pillar 2)
 * Returns: { casesCompleted, conditionsWithThreshold, totalConditionsTaught, percentage }
 */
async function calculateResusGPSPillar(userId: number) {
  const db = await getDb();
  if (!db) {
    return {
      casesCompleted: 0,
      conditionsWithThreshold: 0,
      totalConditionsTaught: 0,
      percentage: 0,
    };
  }

  try {
    // Get all ResusGPS sessions for this user
    const sessions = await db.query.resusGPSSessions.findMany({
      where: (sessions) =>
        and(
          eq(sessions.userId, userId),
          eq(sessions.status, "completed")
        ),
    });

    // Get all cases for these sessions by matching sessionId (string UUID)
    const sessionIds = sessions.map((s) => s.sessionId);
    const allCases = await db.query.resusGPSCases.findMany({
      where: (cases) =>
        sessionIds.length > 0
          ? and(eq(cases.userId, userId), inArray(cases.sessionId, sessionIds))
          : undefined,
    });

    // Count cases per condition
    const casesByCondition: Record<string, number> = {};
    allCases.forEach((c) => {
      const condition = c.diagnosis || "unknown";
      casesByCondition[condition] = (casesByCondition[condition] || 0) + 1;
    });

    // Count conditions with ≥3 cases
    const conditionsWithThreshold = Object.values(casesByCondition).filter(
      (count) => count >= 3
    ).length;

    // Assume 10 taught conditions for now (can be configured)
    const totalConditionsTaught = 10;
    const percentage = Math.min(
      100,
      Math.round((conditionsWithThreshold / totalConditionsTaught) * 100)
    );

    return {
      casesCompleted: allCases.length,
      conditionsWithThreshold,
      totalConditionsTaught,
      percentage,
    };
  } catch (error) {
    console.error("[Fellowship] Error calculating ResusGPS pillar:", error);
    return {
      casesCompleted: 0,
      conditionsWithThreshold: 0,
      totalConditionsTaught: 0,
      percentage: 0,
    };
  }
}

/**
 * Calculate Care Signal pillar (Pillar 3)
 * 
 * Rules per PSoT §17.3 and FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md §7:
 * - Normal month: ≥1 eligible event (ensures engagement)
 * - After grace: ≥3 events required in catch-up month (ensures accountability)
 * - Grace: ≤2 per calendar year
 * - Third failure: streak resets to 0
 * 
 * Returns: { streak, eventsSubmitted, percentage }
 */
async function calculateCareSignalPillar(userId: number) {
  const db = await getDb();
  if (!db) {
    return {
      streak: 0,
      eventsSubmitted: 0,
      percentage: 0,
    };
  }

  try {
    // Get all Care Signal events for this user
    const allEvents = await db.query.careSignalEvents.findMany({
      where: (events) => eq(events.userId, userId),
    });

    // Group events by month using EAT (UTC+3) per PSOT §8.
    // BUG FIX: Previously used getUTCFullYear/getUTCMonth which placed events
    // in the wrong EAT month for submissions made between 21:00-23:59 UTC
    // (i.e., 00:00-02:59 EAT next day). This caused incorrect streak calculations
    // for Kenyan providers.
    const eventsByMonth: Record<string, number> = {};
    const currentDate = new Date();
    const eatNow = new Date(currentDate.getTime() + 3 * 60 * 60 * 1000);
    const currentYear = eatNow.getUTCFullYear();
    const currentMonth = eatNow.getUTCMonth() + 1;

    allEvents.forEach((event) => {
      const eventDate = new Date(event.createdAt);
      // Shift to EAT before extracting year/month
      const eatEvent = new Date(eventDate.getTime() + 3 * 60 * 60 * 1000);
      const year = eatEvent.getUTCFullYear();
      const month = eatEvent.getUTCMonth() + 1;
      const key = `${year}-${String(month).padStart(2, "0")}`;
      eventsByMonth[key] = (eventsByMonth[key] || 0) + 1;
    });

    const windowKeys = enumerateMonthsEndingAt(currentYear, currentMonth, 24);
    const windowYears = [
      ...new Set(windowKeys.map((k) => Number(k.slice(0, 4)))),
    ];

    const graceUsage = await db.query.fellowshipGraceUsage.findMany({
      where: (grace) =>
        and(eq(grace.userId, userId), inArray(grace.year, windowYears)),
    });

    const streak = computeCareSignalStreak({
      eventsByMonth,
      graceUsage: graceUsage.map((g) => ({ year: g.year, month: g.month })),
      anchorYear: currentYear,
      anchorMonth: currentMonth,
      windowMonths: 24,
    });

    // Cap streak at 24 (fellowship requirement)
    const percentage = Math.min(100, Math.round((streak / 24) * 100));

    return {
      streak,
      eventsSubmitted: allEvents.length,
      percentage,
    };
  } catch (error) {
    console.error("[Fellowship] Error calculating Care Signal pillar:", error);
    return {
      streak: 0,
      eventsSubmitted: 0,
      percentage: 0,
    };
  }
}

/**
 * Calculate overall fellowship qualification status
 * All 3 pillars must be at 100% for qualification
 */
async function calculateFellowshipStatus(userId: number) {
  const coursesPillar = await calculateCoursesPillar(userId);
  const resusGPSPillar = await calculateResusGPSPillar(userId);
  const careSignalPillar = await calculateCareSignalPillar(userId);

  const isQualified =
    coursesPillar.percentage === 100 &&
    resusGPSPillar.percentage === 100 &&
    careSignalPillar.percentage === 100;

  const overallPercentage = Math.round(
    (coursesPillar.percentage +
      resusGPSPillar.percentage +
      careSignalPillar.percentage) /
      3
  );

  return {
    coursesPillar,
    resusGPSPillar,
    careSignalPillar,
    isQualified,
    overallPercentage,
  };
}

export const fellowshipRouter = router({
  /**
   * Get fellowship progress for current user
   */
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    try {
      const status = await calculateFellowshipStatus(ctx.user.id);
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

      // Return calculated status directly (no database upsert for now)
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

      return { success: true, caseId: result[0].insertId };
    }),
});
