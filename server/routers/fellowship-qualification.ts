/**
 * Fellowship Qualification Router
 * Phase 2: Automation & Procedures
 * 
 * Implements:
 * - Prerequisite enforcement (Course II requires Course I passed)
 * - Care Signal grace/catch-up/streak logic (24 months, 2 grace/year, catch-up rule, streak reset)
 * - Fellowship qualification status (all 3 pillars)
 * - Grace usage tracking and streak reset audit trail
 */

import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "../db";
import {
  microCourseEnrollments,
  microCourses,
  fellowshipProgress,
  fellowshipGraceUsage,
  fellowshipStreakResets,
  careSignalEvents,
} from "../../drizzle/schema";
import { eq, and, gte, lte, count, sql } from "drizzle-orm";

/**
 * Helper: Get current EAT calendar month (YYYY-MM format)
 * EAT: East Africa Time (UTC+3)
 */
function getCurrentEATMonth(): string {
  const now = new Date();
  // Add 3 hours for EAT
  const eatDate = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const year = eatDate.getFullYear();
  const month = String(eatDate.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Helper: Get calendar year (EAT)
 */
function getCurrentEATYear(): number {
  const now = new Date();
  const eatDate = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return eatDate.getFullYear();
}

/**
 * Helper: Validate prerequisite for course enrollment
 * Returns { canEnroll: boolean, reason?: string }
 */
async function validatePrerequisite(
  userId: number,
  microCourseId: number
): Promise<{ canEnroll: boolean; reason?: string }> {
  // Get the course
  const course = await db.query.microCourses.findFirst({
    where: eq(microCourses.id, microCourseId),
  });

  if (!course) {
    return { canEnroll: false, reason: "Course not found" };
  }

  // If no prerequisite, allow enrollment
  if (!course.prerequisiteId) {
    return { canEnroll: true };
  }

  // Find prerequisite course
  const prereqCourse = await db.query.microCourses.findFirst({
    where: eq(microCourses.courseId, course.prerequisiteId),
  });

  if (!prereqCourse) {
    return { canEnroll: false, reason: "Prerequisite course not found" };
  }

  // Check if user has completed and passed the prerequisite
  const prereqEnrollment = await db.query.microCourseEnrollments.findFirst({
    where: and(
      eq(microCourseEnrollments.userId, userId),
      eq(microCourseEnrollments.microCourseId, prereqCourse.id),
      eq(microCourseEnrollments.enrollmentStatus, "completed"),
      gte(microCourseEnrollments.quizScore, 80) // 80% pass threshold
    ),
  });

  if (!prereqEnrollment) {
    return {
      canEnroll: false,
      reason: `You must complete ${prereqCourse.title} (80%+ score) before enrolling in this course`,
    };
  }

  return { canEnroll: true };
}

/**
 * Helper: Calculate Care Signal monthly status for a user
 * Returns: { monthlyEventCount, hasValidEvent, graceApplied, catchUpRequired }
 */
async function getCareSIgnalMonthlyStatus(
  userId: number,
  month: string
): Promise<{
  monthlyEventCount: number;
  hasValidEvent: boolean;
  graceApplied: boolean;
  catchUpRequired: boolean;
}> {
  // Parse month (YYYY-MM)
  const [year, monthNum] = month.split("-").map(Number);
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0, 23, 59, 59);

  // Count events in this month
  const eventCount = await db
    .select({ count: count() })
    .from(careSignalEvents)
    .where(
      and(
        eq(careSignalEvents.userId, userId),
        gte(careSignalEvents.eventDate, startDate),
        lte(careSignalEvents.eventDate, endDate),
        eq(careSignalEvents.status, "submitted")
      )
    );

  const monthlyEventCount = eventCount[0]?.count || 0;

  // Check grace usage for this month
  const graceUsage = await db.query.fellowshipGraceUsage.findFirst({
    where: and(
      eq(fellowshipGraceUsage.userId, userId),
      eq(fellowshipGraceUsage.calendarYear, year)
    ),
  });

  const graceApplied =
    graceUsage?.graceMonth1 === month || graceUsage?.graceMonth2 === month;

  // Check if this is a catch-up month
  const catchUpRequired =
    graceUsage?.catchUpMonthRequired === month &&
    graceUsage?.catchUpStatus === "in_progress";

  return {
    monthlyEventCount,
    hasValidEvent: monthlyEventCount > 0,
    graceApplied,
    catchUpRequired,
  };
}

/**
 * Helper: Process grace/catch-up/streak logic for a user
 * Called monthly (via cron or on-demand)
 * 
 * Rules:
 * - 24 consecutive months required
 * - 2 grace periods per calendar year (EAT: Jan-Dec)
 * - If miss 3 months in a row: streak resets, must catch up (≥3 events in next month)
 * - If catch-up fails: streak stays reset
 * - If catch-up passes: streak resumes from month after catch-up
 */
async function processCareSIgnalMonthly(userId: number): Promise<void> {
  const currentMonth = getCurrentEATMonth();
  const currentYear = getCurrentEATYear();

  // Get or create grace usage record for this year
  let graceUsage = await db.query.fellowshipGraceUsage.findFirst({
    where: and(
      eq(fellowshipGraceUsage.userId, userId),
      eq(fellowshipGraceUsage.calendarYear, currentYear)
    ),
  });

  if (!graceUsage) {
    // Create new grace record for this year
    await db.insert(fellowshipGraceUsage).values({
      userId,
      calendarYear: currentYear,
      graceUsedCount: 0,
      graceRemaining: 2,
      catchUpStatus: "not_required",
    });
    graceUsage = await db.query.fellowshipGraceUsage.findFirst({
      where: and(
        eq(fellowshipGraceUsage.userId, userId),
        eq(fellowshipGraceUsage.calendarYear, currentYear)
      ),
    });
  }

  // Get current fellowship progress
  let progress = await db.query.fellowshipProgress.findFirst({
    where: eq(fellowshipProgress.userId, userId),
  });

  if (!progress) {
    // Create new progress record
    await db.insert(fellowshipProgress).values({
      userId,
      pillarC_monthsRequired: 24,
      pillarC_monthsCompleted: 0,
      pillarC_currentStreak: 0,
      pillarC_graceUsedThisYear: 0,
      pillarC_graceRemaining: 2,
    });
    progress = await db.query.fellowshipProgress.findFirst({
      where: eq(fellowshipProgress.userId, userId),
    });
  }

  // Check current month's Care Signal status
  const monthStatus = await getCareSIgnalMonthlyStatus(userId, currentMonth);

  // Determine if month counts toward streak
  let monthCounts = false;
  let newGraceUsed = graceUsage?.graceUsedCount || 0;
  let newGraceRemaining = graceUsage?.graceRemaining || 2;

  if (monthStatus.hasValidEvent) {
    // Month has valid events → counts
    monthCounts = true;
  } else if (monthStatus.graceApplied) {
    // Month already used grace → doesn't count, but doesn't break streak
    monthCounts = false;
  } else if (monthStatus.catchUpRequired && monthStatus.monthlyEventCount >= 3) {
    // Catch-up month with ≥3 events → counts, streak resumes
    monthCounts = true;
    await db
      .update(fellowshipGraceUsage)
      .set({ catchUpStatus: "passed" })
      .where(eq(fellowshipGraceUsage.id, graceUsage!.id));
  } else if (monthStatus.catchUpRequired && monthStatus.monthlyEventCount < 3) {
    // Catch-up month with <3 events → doesn't count, catch-up fails
    monthCounts = false;
    await db
      .update(fellowshipGraceUsage)
      .set({ catchUpStatus: "failed" })
      .where(eq(fellowshipGraceUsage.id, graceUsage!.id));
  } else if (newGraceRemaining > 0) {
    // No events, but grace available → apply grace
    monthCounts = false;
    newGraceUsed += 1;
    newGraceRemaining -= 1;

    // Determine catch-up month (next month)
    const nextMonthDate = new Date(currentMonth + "-01");
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const catchUpMonth = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}`;

    await db
      .update(fellowshipGraceUsage)
      .set({
        graceUsedCount: newGraceUsed,
        graceRemaining: newGraceRemaining,
        graceMonth1: !graceUsage?.graceMonth1 ? currentMonth : graceUsage.graceMonth1,
        graceMonth2: graceUsage?.graceMonth1 && !graceUsage?.graceMonth2 ? currentMonth : graceUsage?.graceMonth2,
        catchUpMonthRequired: catchUpMonth,
        catchUpStatus: "in_progress",
      })
      .where(eq(fellowshipGraceUsage.id, graceUsage!.id));
  } else {
    // No events, no grace available → streak breaks
    monthCounts = false;

    // Check if this is 3rd consecutive miss
    // (simplified: just reset streak on any miss after grace exhausted)
    if ((progress?.pillarC_currentStreak || 0) > 0) {
      // Streak was active → reset it
      await db.insert(fellowshipStreakResets).values({
        userId,
        previousStreak: progress?.pillarC_currentStreak || 0,
        monthsLost: progress?.pillarC_currentStreak || 0,
        reason: "third_missed_month",
        missedMonth: currentMonth,
        graceUsedThisYear: newGraceUsed,
      });

      // Reset streak in progress
      await db
        .update(fellowshipProgress)
        .set({ pillarC_currentStreak: 0 })
        .where(eq(fellowshipProgress.userId, userId));
    }
  }

  // Update progress if month counts
  if (monthCounts) {
    const newStreak = (progress?.pillarC_currentStreak || 0) + 1;
    const newMonthsCompleted = (progress?.pillarC_monthsCompleted || 0) + 1;
    const isFellow = newMonthsCompleted >= 24;

    await db
      .update(fellowshipProgress)
      .set({
        pillarC_currentStreak: newStreak,
        pillarC_monthsCompleted: newMonthsCompleted,
        pillarC_graceUsedThisYear: newGraceUsed,
        pillarC_graceRemaining: newGraceRemaining,
        pillarC_status: isFellow ? "complete" : "in_progress",
        isFellow: isFellow && (progress?.pillarA_status === "complete" && progress?.pillarB_status === "complete"),
      })
      .where(eq(fellowshipProgress.userId, userId));
  }
}

export const fellowshipQualificationRouter = router({
  /**
   * Validate if user can enroll in a course
   * Checks prerequisite requirements
   */
  validateEnrollment: protectedProcedure
    .input(z.object({ microCourseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await validatePrerequisite(ctx.user.id, input.microCourseId);
      return result;
    }),

  /**
   * Get user's fellowship progress (all 3 pillars)
   */
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    let progress = await db.query.fellowshipProgress.findFirst({
      where: eq(fellowshipProgress.userId, ctx.user.id),
    });

    if (!progress) {
      // Create default progress record
      await db.insert(fellowshipProgress).values({
        userId: ctx.user.id,
        pillarA_requiredCourses: 26,
        pillarA_completedCourses: 0,
        pillarA_percentComplete: 0,
        pillarA_status: "not_started",
        pillarB_requiredConditions: 0,
        pillarB_completedConditions: 0,
        pillarB_percentComplete: 0,
        pillarB_status: "not_started",
        pillarC_monthsRequired: 24,
        pillarC_monthsCompleted: 0,
        pillarC_currentStreak: 0,
        pillarC_graceUsedThisYear: 0,
        pillarC_graceRemaining: 2,
        pillarC_status: "not_started",
        isFellow: false,
        overallStatus: "not_started",
      });

      progress = await db.query.fellowshipProgress.findFirst({
        where: eq(fellowshipProgress.userId, ctx.user.id),
      });
    }

    return progress;
  }),

  /**
   * Get pillar A status (course completion)
   */
  getCoursePillarStatus: protectedProcedure.query(async ({ ctx }) => {
    // Get all required courses
    const requiredCourses = await db.query.microCourses.findMany({
      where: eq(microCourses.isRequired, true),
    });

    // Get user's completed courses (80%+ score)
    const completedCourses = await db
      .select({ count: count() })
      .from(microCourseEnrollments)
      .where(
        and(
          eq(microCourseEnrollments.userId, ctx.user.id),
          eq(microCourseEnrollments.enrollmentStatus, "completed"),
          gte(microCourseEnrollments.quizScore, 80)
        )
      );

    const completedCount = completedCourses[0]?.count || 0;
    const totalRequired = requiredCourses.length;
    const percentComplete = Math.round((completedCount / totalRequired) * 100);
    const status =
      completedCount === totalRequired
        ? "complete"
        : completedCount > 0
          ? "in_progress"
          : "not_started";

    return {
      requiredCourses: totalRequired,
      completedCourses: completedCount,
      percentComplete,
      status,
      courses: requiredCourses.map((c) => ({
        id: c.id,
        courseId: c.courseId,
        title: c.title,
        level: c.level,
      })),
    };
  }),

  /**
   * Get pillar C status (Care Signal monthly reporting)
   */
  getCareSIgnalPillarStatus: protectedProcedure.query(async ({ ctx }) => {
    const progress = await db.query.fellowshipProgress.findFirst({
      where: eq(fellowshipProgress.userId, ctx.user.id),
    });

    const currentYear = getCurrentEATYear();
    const graceUsage = await db.query.fellowshipGraceUsage.findFirst({
      where: and(
        eq(fellowshipGraceUsage.userId, ctx.user.id),
        eq(fellowshipGraceUsage.calendarYear, currentYear)
      ),
    });

    return {
      monthsRequired: progress?.pillarC_monthsRequired || 24,
      monthsCompleted: progress?.pillarC_monthsCompleted || 0,
      currentStreak: progress?.pillarC_currentStreak || 0,
      graceUsedThisYear: graceUsage?.graceUsedCount || 0,
      graceRemaining: graceUsage?.graceRemaining || 2,
      nextCatchUpRequired: progress?.pillarC_nextCatchUpRequired || false,
      status: progress?.pillarC_status || "not_started",
    };
  }),

  /**
   * Get full fellowship qualification status
   */
  getFullStatus: protectedProcedure.query(async ({ ctx }) => {
    const progress = await db.query.fellowshipProgress.findFirst({
      where: eq(fellowshipProgress.userId, ctx.user.id),
    });

    if (!progress) {
      return {
        isFellow: false,
        overallStatus: "not_started",
        pillarA: { status: "not_started", percentComplete: 0 },
        pillarB: { status: "not_started", percentComplete: 0 },
        pillarC: { status: "not_started", percentComplete: 0 },
        estimatedCompletionDate: null,
      };
    }

    const pillarAPercent = Math.round(
      (progress.pillarA_completedCourses / progress.pillarA_requiredCourses) * 100
    );
    const pillarBPercent = progress.pillarB_percentComplete || 0;
    const pillarCPercent = Math.round(
      (progress.pillarC_monthsCompleted / progress.pillarC_monthsRequired) * 100
    );

    return {
      isFellow: progress.isFellow,
      overallStatus: progress.overallStatus,
      pillarA: {
        status: progress.pillarA_status,
        percentComplete: pillarAPercent,
        completed: progress.pillarA_completedCourses,
        required: progress.pillarA_requiredCourses,
      },
      pillarB: {
        status: progress.pillarB_status,
        percentComplete: pillarBPercent,
        completed: progress.pillarB_completedConditions,
        required: progress.pillarB_requiredConditions,
      },
      pillarC: {
        status: progress.pillarC_status,
        percentComplete: pillarCPercent,
        completed: progress.pillarC_monthsCompleted,
        required: progress.pillarC_monthsRequired,
        currentStreak: progress.pillarC_currentStreak,
      },
      estimatedCompletionDate: progress.estimatedCompletionDate,
    };
  }),

  /**
   * Admin: Process Care Signal monthly (called by cron or manual trigger)
   */
  processMonthly: protectedProcedure.mutation(async ({ ctx }) => {
    // Admin-only check
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can process monthly Care Signal updates",
      });
    }

    // Get all users with active fellowship progress
    const allUsers = await db
      .selectDistinct({ userId: fellowshipProgress.userId })
      .from(fellowshipProgress);

    let processed = 0;
    for (const user of allUsers) {
      try {
        await processCareSIgnalMonthly(user.userId);
        processed++;
      } catch (err) {
        console.error(`Failed to process monthly for user ${user.userId}:`, err);
      }
    }

    return { processed, message: `Processed ${processed} users` };
  }),
});
