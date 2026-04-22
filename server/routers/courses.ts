/**
 * Course Management Router
 * Handles micro-course catalog, enrollment, M-Pesa payments, and admin access
 */

import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from "@trpc/server";
import { getDb } from '../db';
import { ensureMicroCoursesCatalog, loadMicroCoursesFromDb } from '../lib/micro-course-catalog';
import { extendResusGpsAccessAfterMicroCourseCompletion } from '../lib/resusgps-access';
import { ensureCourseCatalogForSchedule } from '../lib/ensure-course-catalog-for-schedule';
import { microCourses, microCourseEnrollments, payments, courses, enrollments, userProgress } from '../../drizzle/schema';
import { eq, and, asc, inArray, desc } from 'drizzle-orm';
import { initiateSTKPush, validatePhoneNumber, isMpesaConfigured } from '../_core/mpesa';

function assertProviderOrAdmin(user: { role?: string | null; userType?: string | null }) {
  const isAdmin = user.role === "admin";
  const isProvider = user.userType === "individual";
  if (!isAdmin && !isProvider) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This action is available to provider accounts only.",
    });
  }
}

async function fetchMicroCourseEnrollmentsWithCourses(userId: number) {
  const database = await getDb();
  if (!database) {
    return [];
  }
  await ensureMicroCoursesCatalog();
  const enrollments = await database.query.microCourseEnrollments.findMany({
    where: (enrollments) => eq(enrollments.userId, userId),
  });
  const enriched = await Promise.all(
    enrollments.map(async (enrollment) => {
      const course = await database.query.microCourses.findFirst({
        where: (courses) => eq(courses.id, enrollment.microCourseId),
      });
      return { ...enrollment, course };
    })
  );
  return enriched;
}

export const coursesRouter = router({
  /**
   * List all fellowship micro-courses (DB-backed; catalog ensured on read).
   */
  listAll: publicProcedure.query(async () => {
    try {
      return await loadMicroCoursesFromDb();
    } catch (error) {
      console.error('Error fetching micro-courses:', error);
      return [];
    }
  }),

  /**
   * AHA-style certification programs (BLS, ACLS, PALS) from `courses` — not fellowship micro-courses.
   */
  listAhaPrograms: publicProcedure.query(async () => {
    try {
      const database = await getDb();
      if (!database) return [];
      await ensureCourseCatalogForSchedule(database, 'bls');
      await ensureCourseCatalogForSchedule(database, 'acls');
      await ensureCourseCatalogForSchedule(database, 'pals');
      return await database
        .select()
        .from(courses)
        .where(inArray(courses.programType, ['bls', 'acls', 'pals']))
        .orderBy(asc(courses.programType), asc(courses.order));
    } catch (error) {
      console.error('[courses.listAhaPrograms]', error);
      return [];
    }
  }),

  /**
   * One anchor row per BLS / ACLS / PALS for provider hub (avoids duplicate PALS catalog rows).
   */
  listAhaHubPrograms: publicProcedure.query(async () => {
    try {
      const database = await getDb();
      if (!database) return [];
      await ensureCourseCatalogForSchedule(database, 'bls');
      await ensureCourseCatalogForSchedule(database, 'acls');
      await ensureCourseCatalogForSchedule(database, 'pals');
      const rows = await database
        .select()
        .from(courses)
        .where(inArray(courses.programType, ['bls', 'acls', 'pals']))
        .orderBy(asc(courses.programType), asc(courses.id));
      const seen = new Set<string>();
      const distinct: (typeof rows)[number][] = [];
      for (const r of rows) {
        if (seen.has(r.programType)) continue;
        seen.add(r.programType);
        distinct.push(r);
      }
      const order = ['bls', 'acls', 'pals'] as const;
      return order.map((pt) => distinct.find((r) => r.programType === pt)).filter(Boolean) as (typeof rows)[number][];
    } catch (error) {
      console.error('[courses.listAhaHubPrograms]', error);
      return [];
    }
  }),

  /** User rows in `enrollments` for BLS / ACLS / PALS (AHA path — not micro-courses). */
  getMyAhaEnrollments: protectedProcedure.query(async ({ ctx }) => {
    assertProviderOrAdmin(ctx.user);
    try {
      const database = await getDb();
      if (!database) return [];
      return await database
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.userId, ctx.user.id), inArray(enrollments.programType, ['bls', 'acls', 'pals'])))
        .orderBy(desc(enrollments.createdAt));
    } catch (error) {
      console.error('[courses.getMyAhaEnrollments]', error);
      return [];
    }
  }),

  /**
   * Get user's micro-course enrollments with course details
   */
  getEnrollments: protectedProcedure.query(async ({ ctx }) => {
    assertProviderOrAdmin(ctx.user);
    try {
      return await fetchMicroCourseEnrollmentsWithCourses(ctx.user.id);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      return [];
    }
  }),

  /** Alias for clients that invalidate `courses.getUserEnrollments` (same payload as getEnrollments). */
  getUserEnrollments: protectedProcedure.query(async ({ ctx }) => {
    assertProviderOrAdmin(ctx.user);
    try {
      return await fetchMicroCourseEnrollmentsWithCourses(ctx.user.id);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      return [];
    }
  }),

  /**
   * Enroll user in a course
   */
  enroll: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertProviderOrAdmin(ctx.user);
      try {
        const database = await getDb();
        if (!database) {
          throw new Error('Database unavailable');
        }
        await ensureMicroCoursesCatalog();

        // Look up course by courseId to get database id
        const course = await database.query.microCourses.findFirst({
          where: (courses) => eq(courses.courseId, input.courseId),
        });

        if (!course) {
          return { success: false, message: 'Course not found', enrolled: false };
        }

        // Check if already enrolled
        const existing = await database.query.microCourseEnrollments.findFirst({
          where: (enrollments) =>
            and(
              eq(enrollments.userId, ctx.user.id),
              eq(enrollments.microCourseId, course.id)
            ),
        });

        if (existing) {
          return { success: false, message: 'Already enrolled in this course', enrolled: true };
        }

        // Create enrollment using microCourseId (database id)
        await database.insert(microCourseEnrollments).values({
          userId: ctx.user.id,
          microCourseId: course.id,
          enrollmentStatus: 'active',
          paymentStatus: 'free',
          progressPercentage: 0,
          createdAt: new Date(),
        });

        return { success: true, message: 'Successfully enrolled in course', enrolled: true };
      } catch (error) {
        console.error('Error enrolling in course:', error);
        return { success: false, message: 'Failed to enroll in course', enrolled: false };
      }
    }),

  /**
   * Mark course as completed
   */
  complete: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertProviderOrAdmin(ctx.user);
      try {
        const database = await getDb();
        if (!database) {
          throw new Error('Database unavailable');
        }
        await ensureMicroCoursesCatalog();

        // Look up course by courseId to get database id
        const course = await database.query.microCourses.findFirst({
          where: (c) => eq(c.courseId, input.courseId),
        });

        if (!course) {
          return { success: false, message: 'Course not found' };
        }

        // Update enrollment status
        await database
          .update(microCourseEnrollments)
          .set({
            enrollmentStatus: 'completed',
            progressPercentage: 100,
            completedAt: new Date(),
          })
          .where(
            and(
              eq(microCourseEnrollments.userId, ctx.user.id),
              eq(microCourseEnrollments.microCourseId, course.id)
            )
          );

        await extendResusGpsAccessAfterMicroCourseCompletion(ctx.user.id);

        return { success: true, message: 'Course marked as completed' };
      } catch (error) {
        console.error('Error completing course:', error);
        return { success: false, message: 'Failed to complete course' };
      }
    }),

  /**
   * Initiate M-Pesa payment for course enrollment
   */
  initiateMpesaPayment: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        phoneNumber: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertProviderOrAdmin(ctx.user);
      try {
        if (!isMpesaConfigured()) {
          return { success: false, message: 'M-Pesa not configured' };
        }

        // Find course to get price
        const database = await getDb();
        if (!database) {
          return { success: false, message: 'Database unavailable' };
        }
        await ensureMicroCoursesCatalog();
        const course = await database.query.microCourses.findFirst({
          where: (courses) => eq(courses.courseId, input.courseId),
        });
        if (!course) {
          return { success: false, message: 'Course not found' };
        }

        // Validate phone number
        if (!validatePhoneNumber(input.phoneNumber)) {
          return { success: false, message: 'Invalid phone number' };
        }

        // Initiate STK push
        const result = await initiateSTKPush(
          input.phoneNumber,
          Math.round(course.price / 100),
          input.courseId,
          course.title,
          0
        );

        if (result.success) {
          // Save payment record
          if (database) {
            await database.insert(payments).values({
              enrollmentId: 0,
              userId: ctx.user.id,
              amount: course.price,
              paymentMethod: 'mpesa',
              status: 'pending',
              transactionId: result.checkoutRequestId || '',
              idempotencyKey: result.checkoutRequestId || undefined,
            });
          }
        }

        return result;
      } catch (error) {
        console.error('Error initiating M-Pesa payment:', error);
        return { success: false, message: 'Failed to initiate payment' };
      }
    }),

  /**
   * Submit module quiz and save score
   */
  submitModuleQuiz: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.number(),
        moduleId: z.number(),
        quizId: z.number().optional(),
        score: z.number().min(0).max(100),
        answers: z.record(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const database = await getDb();
        if (!database) {
          return { success: false, message: 'Database unavailable' };
        }

        // Check if user is enrolled in this course
        const enrollment = await database.query.microCourseEnrollments.findFirst({
          where: (e) => eq(e.id, input.enrollmentId),
        });

        if (!enrollment || enrollment.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not enrolled in this course',
          });
        }

        // Save or update user progress
        const existingProgress = await database.query.userProgress.findFirst({
          where: (p) =>
            and(
              eq(p.userId, ctx.user.id),
              eq(p.enrollmentId, input.enrollmentId),
              eq(p.moduleId, input.moduleId)
            ),
        });

        if (existingProgress) {
          // Update existing progress
          await database
            .update(userProgress)
            .set({
              score: input.score,
              status: input.score >= 80 ? 'completed' : 'in_progress',
              attempts: (existingProgress.attempts || 0) + 1,
              completedAt: input.score >= 80 ? new Date() : null,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(userProgress.userId, ctx.user.id),
                eq(userProgress.enrollmentId, input.enrollmentId),
                eq(userProgress.moduleId, input.moduleId)
              )
            );
        } else {
          // Create new progress record
          await database.insert(userProgress).values({
            userId: ctx.user.id,
            enrollmentId: input.enrollmentId,
            moduleId: input.moduleId,
            quizId: input.quizId,
            score: input.score,
            status: input.score >= 80 ? 'completed' : 'in_progress',
            attempts: 1,
            completedAt: input.score >= 80 ? new Date() : null,
          });
        }

        return {
          success: true,
          message: input.score >= 80 ? 'Quiz passed!' : 'Quiz submitted. Score below 80%. Please try again.',
          score: input.score,
          passed: input.score >= 80,
        };
      } catch (error) {
        console.error('Error submitting quiz:', error);
        if (error instanceof TRPCError) throw error;
        return { success: false, message: 'Failed to submit quiz' };
      }
    }),
});
