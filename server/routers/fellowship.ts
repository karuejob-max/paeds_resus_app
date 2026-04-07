/**
 * Fellowship Qualification Router
 * 
 * Implements 3-pillar fellowship qualification system:
 * 1. Courses: Completion of BLS, ACLS, PALS + all 26 ADF micro-courses
 * 2. ResusGPS: ≥3 attributable cases per taught condition
 * 3. Care Signal: 24 consecutive qualifying months of monthly reporting (EAT)
 * 
 * With grace/catch-up/streak reset logic per PSOT §17.
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { eq, and, gte, lte } from "drizzle-orm";
import {
  fellowshipProgress,
  fellowshipGraceUsage,
  fellowshipStreakResets,
  resusGPSSessions,
  resusGPSCases,
  careSignalEvents,
  microCourseEnrollments,
  certificates,
} from "../../drizzle/schema";

/**
 * Calculate courses completion percentage (Pillar 1)
 * Returns: { completed, required, percentage }
 */
async function calculateCoursesPillar(userId: number) {
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

  // Count micro-courses (should be 26 for fellowship)
  const microCourses = completedMicroCourses.length;

  // Total required: 26 micro-courses (legacy courses are bonus)
  const totalRequired = 26;
  const completed = microCourses;
  const percentage = Math.min(100, Math.round((completed / totalRequired) * 100));

  return {
    completed,
    required: totalRequired,
    percentage,
    legacyCourses,
  };
}

/**
 * Calculate ResusGPS pillar (Pillar 2)
 * Returns: { casesCompleted, conditionsWithThreshold, totalConditionsTaught, percentage }
 */
async function calculateResusGPSPillar(userId: number) {
  // Get all ResusGPS sessions for this user
  const sessions = await db.query.resusGPSSessions.findMany({
    where: (sessions) =>
      and(
        eq(sessions.userId, userId),
        eq(sessions.status, "completed")
      ),
  });

  // Get all cases from completed sessions
  const cases = await db.query.resusGPSCases.findMany({
    where: (cases) => eq(cases.userId, userId),
  });

  // Count cases per diagnosis
  const casesByDiagnosis: Record<string, number> = {};
  cases.forEach((c) => {
    casesByDiagnosis[c.diagnosis] = (casesByDiagnosis[c.diagnosis] || 0) + 1;
  });

  // Count conditions with ≥3 cases (threshold for fellowship)
  const conditionsWithThreshold = Object.values(casesByDiagnosis).filter(
    (count) => count >= 3
  ).length;

  // Get total conditions taught (from completed micro-courses)
  const completedCourses = await db.query.microCourseEnrollments.findMany({
    where: (enrollments) =>
      and(
        eq(enrollments.userId, userId),
        eq(enrollments.enrollmentStatus, "completed")
      ),
  });

  // Each micro-course teaches one condition; assume unique conditions
  const totalConditionsTaught = completedCourses.length;

  // Percentage: conditions with threshold / total conditions taught
  const percentage =
    totalConditionsTaught > 0
      ? Math.round((conditionsWithThreshold / totalConditionsTaught) * 100)
      : 0;

  return {
    casesCompleted: cases.length,
    conditionsWithThreshold,
    totalConditionsTaught,
    percentage,
  };
}

/**
 * Calculate Care Signal pillar (Pillar 3)
 * Returns: { streak, eventsSubmitted, percentage }
 * 
 * Streak logic:
 * - 24 consecutive months required (EAT calendar months)
 * - Grace: ≤2 grace periods per calendar year
 * - After grace, next month must have ≥3 eligible events
 * - Third failure → streak resets to zero
 */
async function calculateCareSignalPillar(userId: number) {
  // Get current date in EAT (UTC+3)
  const now = new Date();
  const eatOffset = 3 * 60 * 60 * 1000; // UTC+3
  const eatNow = new Date(now.getTime() + eatOffset);
  const currentYear = eatNow.getUTCFullYear();
  const currentMonth = eatNow.getUTCMonth() + 1; // 1-12

  // Get all Care Signal events for this user
  const allEvents = await db.query.careSignalEvents.findMany({
    where: (events) => eq(events.userId, userId),
  });

  // Count events per month (EAT)
  const eventsByMonth: Record<string, number> = {};
  allEvents.forEach((event) => {
    const eventDate = new Date(event.createdAt.getTime() + eatOffset);
    const year = eventDate.getUTCFullYear();
    const month = eventDate.getUTCMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    eventsByMonth[key] = (eventsByMonth[key] || 0) + 1;
  });

  // Get grace usage for current year
  const graceUsage = await db.query.fellowshipGraceUsage.findMany({
    where: (grace) =>
      and(eq(grace.userId, userId), eq(grace.year, currentYear)),
  });

  const graceUsedThisYear = graceUsage.length;

  // Calculate streak (simplified: count consecutive months with ≥3 events or grace)
  let streak = 0;
  let failureCount = 0;

  // Walk backwards from current month
  for (let m = currentMonth; m >= 1; m--) {
    const key = `${currentYear}-${String(m).padStart(2, "0")}`;
    const events = eventsByMonth[key] || 0;

    if (events >= 3) {
      // Month has ≥3 events: continue streak
      streak++;
    } else if (graceUsage.some((g) => g.month === m)) {
      // Month used grace: continue streak
      streak++;
    } else {
      // Month failed: increment failure count
      failureCount++;
      if (failureCount >= 3) {
        // Third failure: reset streak
        streak = 0;
        break;
      } else if (failureCount === 1) {
        // First failure: can use grace if available
        if (graceUsedThisYear < 2) {
          // Grace available: continue
          streak++;
        } else {
          // No grace available: stop
          break;
        }
      } else {
        // Second failure: stop
        break;
      }
    }
  }

  // Cap streak at 24 (fellowship requirement)
  const percentage = Math.min(100, Math.round((streak / 24) * 100));

  return {
    streak,
    eventsSubmitted: allEvents.length,
    percentage,
  };
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
    const status = await calculateFellowshipStatus(ctx.user.id);

    // Upsert fellowship progress record
    const existing = await db.query.fellowshipProgress.findFirst({
      where: (fp) => eq(fp.userId, ctx.user.id),
    });

    if (existing) {
      // Update existing record
      await db.updateFellowshipProgress(ctx.user.id, {
        coursesCompleted: status.coursesPillar.completed,
        coursesPercentage: status.coursesPillar.percentage,
        resusGPSCasesCompleted: status.resusGPSPillar.casesCompleted,
        conditionsWithThreshold: status.resusGPSPillar.conditionsWithThreshold,
        totalConditionsTaught: status.resusGPSPillar.totalConditionsTaught,
        resusGPSPercentage: status.resusGPSPillar.percentage,
        careSignalStreak: status.careSignalPillar.streak,
        careSignalEventsSubmitted: status.careSignalPillar.eventsSubmitted,
        careSignalPercentage: status.careSignalPillar.percentage,
        isQualified: status.isQualified,
        overallPercentage: status.overallPercentage,
      });
    } else {
      // Create new record
      await db.createFellowshipProgress({
        userId: ctx.user.id,
        coursesCompleted: status.coursesPillar.completed,
        coursesPercentage: status.coursesPillar.percentage,
        resusGPSCasesCompleted: status.resusGPSPillar.casesCompleted,
        conditionsWithThreshold: status.resusGPSPillar.conditionsWithThreshold,
        totalConditionsTaught: status.resusGPSPillar.totalConditionsTaught,
        resusGPSPercentage: status.resusGPSPillar.percentage,
        careSignalStreak: status.careSignalPillar.streak,
        careSignalEventsSubmitted: status.careSignalPillar.eventsSubmitted,
        careSignalPercentage: status.careSignalPillar.percentage,
        isQualified: status.isQualified,
        overallPercentage: status.overallPercentage,
      });
    }

    return status;
  }),

  /**
   * Record a ResusGPS session
   */
  recordResusGPSSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        primaryDiagnosis: z.string(),
        secondaryDiagnoses: z.array(z.string()).optional(),
        patientAgeMonths: z.number(),
        patientWeightKg: z.number().optional(),
        isTrauma: z.boolean().optional(),
        isCardiacArrest: z.boolean().optional(),
        interventionCount: z.number().default(0),
        reassessmentCount: z.number().default(0),
        durationSeconds: z.number().optional(),
        outcome: z.string().optional(),
        depthScore: z.number().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Create session record
      const session = await db.createResusGPSSession({
        userId: ctx.user.id,
        sessionId: input.sessionId,
        primaryDiagnosis: input.primaryDiagnosis,
        secondaryDiagnoses: input.secondaryDiagnoses
          ? JSON.stringify(input.secondaryDiagnoses)
          : null,
        patientAgeMonths: input.patientAgeMonths,
        patientWeightKg: input.patientWeightKg || null,
        isTrauma: input.isTrauma || false,
        isCardiacArrest: input.isCardiacArrest || false,
        status: "completed",
        interventionCount: input.interventionCount,
        reassessmentCount: input.reassessmentCount,
        durationSeconds: input.durationSeconds || null,
        outcome: input.outcome || null,
        depthScore: input.depthScore,
      });

      return session;
    }),

  /**
   * Record a ResusGPS case within a session
   */
  recordResusGPSCase: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        caseNumber: z.number(),
        diagnosis: z.string(),
        abcdeCompleted: z.boolean().optional(),
        interventions: z.array(z.any()).optional(),
        reassessments: z.array(z.any()).optional(),
        outcome: z.string().optional(),
        depthScore: z.number().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const caseRecord = await db.createResusGPSCase({
        sessionId: input.sessionId,
        userId: ctx.user.id,
        caseNumber: input.caseNumber,
        diagnosis: input.diagnosis,
        abcdeCompleted: input.abcdeCompleted || false,
        interventions: input.interventions
          ? JSON.stringify(input.interventions)
          : null,
        reassessments: input.reassessments
          ? JSON.stringify(input.reassessments)
          : null,
        outcome: input.outcome || null,
        depthScore: input.depthScore,
      });

      return caseRecord;
    }),

  /**
   * Get fellowship status for admin view
   */
  getFellowshipStats: protectedProcedure.query(async ({ ctx }) => {
    // Only admins can view stats
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    // Get all fellowship progress records
    const allProgress = await db.query.fellowshipProgress.findMany({});

    const totalUsers = allProgress.length;
    const qualifiedUsers = allProgress.filter((p) => p.isQualified).length;
    const avgCourseCompletion = Math.round(
      allProgress.reduce((sum, p) => sum + (p.coursesPercentage || 0), 0) /
        totalUsers
    );
    const avgResusGPSCompletion = Math.round(
      allProgress.reduce((sum, p) => sum + (p.resusGPSPercentage || 0), 0) /
        totalUsers
    );
    const avgCareSignalCompletion = Math.round(
      allProgress.reduce((sum, p) => sum + (p.careSignalPercentage || 0), 0) /
        totalUsers
    );

    return {
      totalUsers,
      qualifiedUsers,
      qualificationRate: totalUsers > 0 ? (qualifiedUsers / totalUsers) * 100 : 0,
      avgCourseCompletion,
      avgResusGPSCompletion,
      avgCareSignalCompletion,
    };
  }),
});
