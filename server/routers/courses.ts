/**
 * Course Management Router
 * Handles micro-course catalog, enrollment, M-Pesa payments, and admin access
 */

import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from "@trpc/server";
import { getDb } from '../db';
import {
  CLINICAL_CONTENT_VERSION,
  ensureMicroCoursesCatalog,
  loadMicroCoursesFromDb,
} from '../lib/micro-course-catalog';
import { extendResusGpsAccessAfterMicroCourseCompletion } from '../lib/resusgps-access';
import { saveMicroCourseCertificate, saveAhaCognitiveCertificate } from '../certificates';
import { ensureCourseCatalogForSchedule } from '../lib/ensure-course-catalog-for-schedule';
import { resolveAhaCourseAnchor } from '../lib/resolve-aha-course-anchor';
import { microCourses, microCourseEnrollments, payments, courses, enrollments, userProgress, capstoneSubmissions, users, trainingSchedules, trainingAttendance, modules, institutionalStaffMembers, phase3CrossFacilityApprovals } from '../../drizzle/schema';
import { eq, and, asc, inArray, desc, sum } from 'drizzle-orm';
import { initiateSTKPush, validatePhoneNumber, isMpesaConfigured } from '../_core/mpesa';
import { assertTrainingWorkspaceOrAdmin } from "../lib/training-workspace-guard";
import { syncFellowshipProgressForUser } from "../services/fellowship-progress.service";
import { computeMicroCourseEnrollmentProgress } from "../lib/sync-micro-course-enrollment-progress";
import { assertMicrocourseCompletionAllowed } from "../lib/microcourse-exam-gate";
import { fetchAhaHubPrograms } from "../lib/aha-hub-programs";
import { enrichAhaEnrollmentsWithProgress } from "../lib/compute-aha-enrollment-progress";

const AHA_PROGRAM_TYPES = ['bls', 'acls', 'pals', 'heartsaver', 'nrp'] as const;

async function fetchMyAhaEnrollments(userId: number) {
  const database = await getDb();
  if (!database) return [];
  const rows = await database
    .select({
      id: enrollments.id,
      userId: enrollments.userId,
      programType: enrollments.programType,
      courseId: enrollments.courseId,
      trainingDate: enrollments.trainingDate,
      paymentStatus: enrollments.paymentStatus,
      cognitiveModulesComplete: enrollments.cognitiveModulesComplete,
      practicalSkillsSignedOff: enrollments.practicalSkillsSignedOff,
      createdAt: enrollments.createdAt,
      updatedAt: enrollments.updatedAt,
      courseTitle: courses.title,
    })
    .from(enrollments)
    .leftJoin(courses, eq(enrollments.courseId, courses.id))
    .where(
      and(
        eq(enrollments.userId, userId),
        inArray(enrollments.programType, [...AHA_PROGRAM_TYPES])
      )
    )
    .orderBy(desc(enrollments.createdAt));
  return enrichAhaEnrollmentsWithProgress(database, userId, rows);
}

async function fetchMicroCourseEnrollmentsWithCourses(userId: number) {
  const database = await getDb();
  if (!database) {
    return [];
  }
  await ensureMicroCoursesCatalog();
  const enrollments = await database.query.microCourseEnrollments.findMany({
    where: (enrollments) => eq(enrollments.userId, userId),
    orderBy: (e, { desc }) => [
      // Completed enrollments first so MicroCoursePlayer picks up the right row
      desc(e.completedAt),
      desc(e.createdAt),
    ],
  });
  const enriched = await Promise.all(
    enrollments.map(async (enrollment) => {
      const course = await database.query.microCourses.findFirst({
        where: (courses) => eq(courses.id, enrollment.microCourseId),
      });
      let progressPercentage = enrollment.progressPercentage ?? 0;
      if (enrollment.enrollmentStatus !== "completed") {
        progressPercentage = await computeMicroCourseEnrollmentProgress(
          database,
          userId,
          enrollment.id
        );
      }
      return { ...enrollment, progressPercentage, course };
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

  /** Clinical content version string for fellowship player footer (B1). */
  getClinicalContentVersion: publicProcedure.query(() => ({
    version: CLINICAL_CONTENT_VERSION,
  })),

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
        .where(inArray(courses.programType, ['bls', 'acls', 'pals', 'heartsaver', 'nrp']))
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
      return await fetchAhaHubPrograms(database);
    } catch (error) {
      console.error('[courses.listAhaHubPrograms]', error);
      return [];
    }
  }),

  /**
   * Provider AHA hub — programs + enrollments in one round trip (prefetch-friendly).
   */
  getAhaHubDashboard: protectedProcedure.query(async ({ ctx }) => {
    assertTrainingWorkspaceOrAdmin(ctx.user);
    try {
      const database = await getDb();
      if (!database) return { programs: [], enrollments: [] };
      const [programs, enrollments] = await Promise.all([
        fetchAhaHubPrograms(database),
        fetchMyAhaEnrollments(ctx.user.id),
      ]);
      return { programs, enrollments };
    } catch (error) {
      console.error('[courses.getAhaHubDashboard]', error);
      return { programs: [], enrollments: [] };
    }
  }),

  /** User rows in `enrollments` for BLS / ACLS / PALS (AHA path — not micro-courses). */
  getMyAhaEnrollments: protectedProcedure.query(async ({ ctx }) => {
    assertTrainingWorkspaceOrAdmin(ctx.user);
    try {
      return await fetchMyAhaEnrollments(ctx.user.id);
    } catch (error) {
      console.error('[courses.getMyAhaEnrollments]', error);
      return [];
    }
  }),

  /**
   * Get user's micro-course enrollments with course details
   */
  getEnrollments: protectedProcedure.query(async ({ ctx }) => {
    assertTrainingWorkspaceOrAdmin(ctx.user);
    try {
      return await fetchMicroCourseEnrollmentsWithCourses(ctx.user.id);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      return [];
    }
  }),

  /** Alias for clients that invalidate `courses.getUserEnrollments` (same payload as getEnrollments). */
  getUserEnrollments: protectedProcedure.query(async ({ ctx }) => {
    assertTrainingWorkspaceOrAdmin(ctx.user);
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
      assertTrainingWorkspaceOrAdmin(ctx.user);
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
   * Idempotent: ensure a micro-course enrollment row exists (mirrors AHA ensureAhaEnrollment).
   */
  ensureMicroCourseEnrollment: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      try {
        const database = await getDb();
        if (!database) throw new Error('Database unavailable');
        await ensureMicroCoursesCatalog();

        const course = await database.query.microCourses.findFirst({
          where: (c) => eq(c.courseId, input.courseId),
        });
        if (!course) {
          return { success: false, enrollmentId: 0, error: 'Course not found' };
        }

        const existing = await database.query.microCourseEnrollments.findFirst({
          where: and(
            eq(microCourseEnrollments.userId, ctx.user.id),
            eq(microCourseEnrollments.microCourseId, course.id)
          ),
        });
        if (existing) {
          return { success: true, enrollmentId: existing.id, created: false };
        }

        const inserted = await database
          .insert(microCourseEnrollments)
          .values({
            userId: ctx.user.id,
            microCourseId: course.id,
            enrollmentStatus: 'active',
            paymentStatus: 'free',
            progressPercentage: 0,
            createdAt: new Date(),
          })
          .$returningId();
        const newId = (inserted as { id?: number }[])[0]?.id ?? 0;
        return { success: true, enrollmentId: newId, created: true };
      } catch (err) {
        console.error('[courses.ensureMicroCourseEnrollment]', err);
        return {
          success: false,
          enrollmentId: 0,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
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
      assertTrainingWorkspaceOrAdmin(ctx.user);
      try {
        const database = await getDb();
        if (!database) {
          throw new Error('Database unavailable');
        }
        await ensureMicroCoursesCatalog();

        // Look up course by catalog slug (e.g. asthma-i); tolerate legacy numeric ids from older clients
        let course = await database.query.microCourses.findFirst({
          where: (c) => eq(c.courseId, input.courseId),
        });
        if (!course && /^\d+$/.test(input.courseId)) {
          course = await database.query.microCourses.findFirst({
            where: (c) => eq(c.id, Number(input.courseId)),
          });
        }

        if (!course) {
          return { success: false, message: 'Course not found' };
        }

        const enrollmentRow = await database.query.microCourseEnrollments.findFirst({
          where: and(
            eq(microCourseEnrollments.userId, ctx.user.id),
            eq(microCourseEnrollments.microCourseId, course.id)
          ),
        });
        if (enrollmentRow) {
          const examGate = await assertMicrocourseCompletionAllowed(
            database as any,
            ctx.user.id,
            enrollmentRow.id
          );
          if (!examGate.ok) {
            return { success: false, message: examGate.message };
          }
        }

        // Update enrollment status
        await database
          .update(microCourseEnrollments)
          .set({
            enrollmentStatus: 'completed',
            progressPercentage: 100,
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(microCourseEnrollments.userId, ctx.user.id),
              eq(microCourseEnrollments.microCourseId, course.id)
            )
          );

        await extendResusGpsAccessAfterMicroCourseCompletion(ctx.user.id);

        // Issue certificate for this micro-course completion (idempotent)
        const enrollment = await database.query.microCourseEnrollments.findFirst({
          where: and(
            eq(microCourseEnrollments.userId, ctx.user.id),
            eq(microCourseEnrollments.microCourseId, course.id)
          ),
        });
        let certificateNumber: string | undefined;
        if (enrollment) {
          const userRows = await database
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, ctx.user.id))
            .limit(1);
          const recipientName = userRows[0]?.name ?? 'Participant';
          const track =
            course.level === "foundational" || course.level === "advanced" ? course.level : undefined;
          const certResult = await saveMicroCourseCertificate(
            enrollment.id,
            ctx.user.id,
            recipientName,
            course.title ?? input.courseId,
            track
          );
          if (certResult.success) {
            certificateNumber = certResult.certificateNumber;
          } else {
            throw new Error(`CERT_FAIL: ${certResult.error ?? 'unknown'}`);
          }
        } else {
          return {
            success: false,
            message: 'No enrollment found for this course. Please enroll first from the Fellowship page.',
          };
        }

        void syncFellowshipProgressForUser(ctx.user.id).catch((e) =>
          console.warn("[Fellowship] sync after micro-course complete failed:", e)
        );

        return { success: true, message: 'Course marked as completed', certificateNumber };
      } catch (error) {
        console.error('Error completing course:', error);
        const msg = error instanceof Error ? error.message : 'Failed to complete course';
        if (msg.startsWith('CERT_FAIL:')) {
          return {
            success: false,
            message: `Certificate could not be issued: ${msg.replace(/^CERT_FAIL:\s*/, '')}`,
          };
        }
        return { success: false, message: msg };
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
      assertTrainingWorkspaceOrAdmin(ctx.user);
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
        answers: z.record(z.string(), z.string()),
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
          where: eq(microCourseEnrollments.id, input.enrollmentId),
        });

        if (!enrollment || enrollment.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not enrolled in this course',
          });
        }

        // Save or update user progress
        const existingProgress = await database.query.userProgress.findFirst({
          where: and(
            eq(userProgress.userId, ctx.user.id),
            eq(userProgress.enrollmentId, input.enrollmentId),
            eq(userProgress.moduleId, input.moduleId)
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

  /** Submit capstone project for instructor grading */
  submitCapstone: protectedProcedure
    .input(z.object({
      enrollmentId: z.number(),
      courseId: z.string(),
      caseResponse: z.string().min(100, 'Response must be at least 100 characters'),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const database = await getDb();
        if (!database) return { success: false, message: 'Database unavailable' };
        const enrollment = await database.query.microCourseEnrollments.findFirst({
          where: and(eq(microCourseEnrollments.userId, ctx.user.id), eq(microCourseEnrollments.id, input.enrollmentId)),
        });
        if (!enrollment) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not enrolled in this course' });
        const existing = await database.query.capstoneSubmissions.findFirst({
          where: and(eq(capstoneSubmissions.userId, ctx.user.id), eq(capstoneSubmissions.enrollmentId, input.enrollmentId)),
        });
        if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Capstone already submitted. Awaiting grading.' });
        await database.insert(capstoneSubmissions).values({
          userId: ctx.user.id,
          enrollmentId: input.enrollmentId,
          courseId: input.courseId,
          caseResponse: input.caseResponse,
          status: 'pending',
        });
        return { success: true, message: 'Capstone submitted. An instructor will review it within 48 hours.' };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Error submitting capstone:', error);
        return { success: false, message: 'Failed to submit capstone' };
      }
    }),

  /** Get my capstone submission status for an enrollment */
  getMyCapstoneStatus: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const database = await getDb();
        if (!database) return null;
        return await database.query.capstoneSubmissions.findFirst({
          where: and(eq(capstoneSubmissions.userId, ctx.user.id), eq(capstoneSubmissions.enrollmentId, input.enrollmentId)),
        }) ?? null;
      } catch { return null; }
    }),

  /** Admin: list all pending capstone submissions */
  listPendingCapstones: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      try {
        const database = await getDb();
        if (!database) return [];
        return await database.query.capstoneSubmissions.findMany({
          where: eq(capstoneSubmissions.status, 'pending'),
          orderBy: [asc(capstoneSubmissions.submittedAt)],
        });
      } catch { return []; }
    }),

  /** Admin: grade a capstone submission */
  gradeCapstone: protectedProcedure
    .input(z.object({
      submissionId: z.number(),
      score: z.number().min(0).max(100),
      feedback: z.string().min(20, 'Feedback must be at least 20 characters'),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      try {
        const database = await getDb();
        if (!database) return { success: false, message: 'Database unavailable' };
        const passed = input.score >= 80;
        await database.update(capstoneSubmissions).set({
          score: input.score,
          instructorId: ctx.user.id,
          instructorFeedback: input.feedback,
          status: passed ? 'passed' : 'failed',
          gradedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(capstoneSubmissions.id, input.submissionId));
        return { success: true, passed, message: passed ? 'Capstone passed. Certificate will be issued.' : 'Capstone failed. Learner may resubmit.' };
      } catch (error) {
        console.error('Error grading capstone:', error);
        return { success: false, message: 'Failed to grade capstone' };
      }
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // AHA-CERT-2: Mark AHA cognitive modules complete and issue gatepass certificate.
  // Called from the AHA course player when the learner passes the final knowledge check.
  // ─────────────────────────────────────────────────────────────────────────
  markAhaCognitiveComplete: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.number(),
        programType: z.enum(['bls', 'acls', 'pals', 'heartsaver', 'nrp']),
        courseId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      try {
        const database = await getDb();
        if (!database) throw new Error('Database unavailable');

        // Find or auto-create enrollment
        let enrolRow: { id: number; cognitiveModulesComplete: boolean | null } | null = null;

        // Try by enrollmentId first
        if (input.enrollmentId > 0) {
          const rows = await database
            .select({ id: enrollments.id, cognitiveModulesComplete: enrollments.cognitiveModulesComplete })
            .from(enrollments)
            .where(and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, ctx.user.id)))
            .limit(1);
          if (rows.length > 0) enrolRow = rows[0];
        }

        // Fall back: find by userId + programType
        if (!enrolRow) {
          const existing = await database
            .select({ id: enrollments.id, cognitiveModulesComplete: enrollments.cognitiveModulesComplete })
            .from(enrollments)
            .where(and(eq(enrollments.userId, ctx.user.id), eq(enrollments.programType, input.programType)))
            .limit(1);
          if (existing.length > 0) enrolRow = existing[0];
        }

        // Auto-create enrollment if still not found
        if (!enrolRow) {
          const inserted = await database
            .insert(enrollments)
            .values({
              userId: ctx.user.id,
              programType: input.programType,
              trainingDate: new Date(), // required NOT NULL
              paymentStatus: 'completed',
              cognitiveModulesComplete: false,
            })
            .$returningId();
          const newId = (inserted as any)[0]?.id ?? 0;
          enrolRow = { id: newId, cognitiveModulesComplete: false };
        }

        // Verify all cognitive modules for this program are complete in this enrollment.
        const anchor = await resolveAhaCourseAnchor(database, input.programType);
        if (!anchor?.id) {
          return { success: false, error: "Course catalog is not ready. Please refresh and try again." };
        }
        const moduleRows = await database
          .select({ id: modules.id })
          .from(modules)
          .where(eq(modules.courseId, anchor.id));
        const moduleIds = moduleRows.map((m) => m.id);
        if (moduleIds.length === 0) {
          return { success: false, error: "Course modules are not available yet. Please try again shortly." };
        }
        const progressRows = await database
          .select({ moduleId: userProgress.moduleId })
          .from(userProgress)
          .where(
            and(
              eq(userProgress.enrollmentId, enrolRow.id),
              eq(userProgress.status, "completed"),
              inArray(userProgress.moduleId, moduleIds)
            )
          );
        const done = new Set(progressRows.map((r) => r.moduleId));
        const allComplete = moduleIds.every((id) => done.has(id));
        if (!allComplete) {
          return {
            success: false,
            cognitiveComplete: false,
            error: `Complete all modules before final submission (${done.size}/${moduleIds.length} complete).`,
          };
        }

        // Mark cognitive modules complete (idempotent)
        if (!enrolRow.cognitiveModulesComplete) {
          await database
            .update(enrollments)
            .set({ cognitiveModulesComplete: true })
            .where(eq(enrollments.id, enrolRow.id));
        }

        // Issue cognitive gatepass certificate (idempotent)
        const userRows = await database
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);
        const recipientName = userRows[0]?.name ?? 'Participant';

        const certResult = await saveAhaCognitiveCertificate(
          enrolRow.id,
          ctx.user.id,
          recipientName,
          input.programType
        );

        return {
          success: true,
          cognitiveComplete: true,
          certificateNumber: certResult.certificateNumber,
        };
      } catch (err) {
        console.error('[courses.markAhaCognitiveComplete]', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
      }
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // AHA-SCHED-1: List upcoming public hands-on sessions available for booking.
  // ─────────────────────────────────────────────────────────────────────────
  listUpcomingHandsOnSessions: protectedProcedure
    .input(z.object({ programType: z.enum(["bls", "acls", "pals", "heartsaver", "nrp"]).optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const now = new Date();
      const rows = await db
        .select({
          id: trainingSchedules.id,
          scheduledDate: trainingSchedules.scheduledDate,
          startTime: trainingSchedules.startTime,
          endTime: trainingSchedules.endTime,
          location: trainingSchedules.location,
          trainingType: trainingSchedules.trainingType,
          status: trainingSchedules.status,
          maxCapacity: trainingSchedules.maxCapacity,
          enrolledCount: trainingSchedules.enrolledCount,
          instructorName: trainingSchedules.instructorName,
          programType: courses.programType,
          courseTitle: courses.title,
        })
        .from(trainingSchedules)
        .innerJoin(courses, eq(trainingSchedules.courseId, courses.id))
        .where(eq(trainingSchedules.status, "scheduled"))
        .orderBy(asc(trainingSchedules.scheduledDate));
      return rows.filter(
        (r) =>
          r.scheduledDate &&
          new Date(r.scheduledDate) > now &&
          (r.trainingType === "hands_on" || r.trainingType === "hybrid" || r.trainingType === "online") &&
          (r.enrolledCount ?? 0) < (r.maxCapacity ?? 999) &&
          (!input.programType || r.programType === input.programType)
      );
    }),

  bookHandsOnSession: protectedProcedure
    .input(z.object({
      scheduleId: z.number().int().positive(),
      simulationRole: z.enum(["team_member", "team_leader"]).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [session] = await db
        .select({
          id: trainingSchedules.id,
          maxCapacity: trainingSchedules.maxCapacity,
          enrolledCount: trainingSchedules.enrolledCount,
          status: trainingSchedules.status,
          scheduledDate: trainingSchedules.scheduledDate,
          trainingType: trainingSchedules.trainingType,
          institutionalAccountId: trainingSchedules.institutionalAccountId,
        })
        .from(trainingSchedules)
        .where(eq(trainingSchedules.id, input.scheduleId))
        .limit(1);
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      if (session.status === "cancelled") throw new TRPCError({ code: "BAD_REQUEST", message: "This session has been cancelled" });
      if (session.scheduledDate && new Date(session.scheduledDate) < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This session has already passed" });
      }

      // ── Phase Gate: enforce cohort program rules ──────────────────────────
      const staffRow = await db
        .select({
          id: institutionalStaffMembers.id,
          phaseStatus: institutionalStaffMembers.phaseStatus,
          totalPaidAmount: institutionalStaffMembers.totalPaidAmount,
          facilityLinkStatus: institutionalStaffMembers.facilityLinkStatus,
          designation: institutionalStaffMembers.designation,
          enrollmentDate: institutionalStaffMembers.enrollmentDate,
          createdAt: institutionalStaffMembers.createdAt,
          institutionalAccountId: institutionalStaffMembers.institutionalAccountId,
        })
        .from(institutionalStaffMembers)
        .where(and(
          eq(institutionalStaffMembers.userId, ctx.user.id),
          eq(institutionalStaffMembers.facilityLinkStatus, "linked")
        ))
        .limit(1);

      if (staffRow.length > 0) {
        const { phaseStatus, totalPaidAmount, designation, enrollmentDate, createdAt, institutionalAccountId } = staffRow[0];
        const isOnlineSession = session.trainingType === "online";
        const isHandsOnSession = session.trainingType === "hands_on" || session.trainingType === "hybrid";
        const isSameFacility = institutionalAccountId === session.institutionalAccountId;

        // Facility-matching (CEO decision, 2026-07-19): cohort training is
        // same-facility by design — Phase 2's clinical value (shared mental
        // models, team roles, closed-loop communication with people who'll
        // actually work together) depends on it, so it's a hard block, no
        // override. Phase 3 is closer to individual competency assessment;
        // a small facility that can't reach 8 Phase-3-ready learners can
        // bottleneck them, so a platform admin may explicitly approve a
        // named learner into a named out-of-facility session — see
        // approvePhase3CrossFacilityOverflow. No such override exists for
        // Phase 2, deliberately.
        if (!isSameFacility) {
          if (isOnlineSession) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "This simulation session belongs to a different institution. Phase 2 team simulations are always trained with your own facility's cohort.",
            });
          }
          if (isHandsOnSession) {
            const approval = await db
              .select({ id: phase3CrossFacilityApprovals.id })
              .from(phase3CrossFacilityApprovals)
              .where(and(
                eq(phase3CrossFacilityApprovals.staffMemberId, staffRow[0].id),
                eq(phase3CrossFacilityApprovals.scheduleId, input.scheduleId)
              ))
              .limit(1);
            if (approval.length === 0) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "This session belongs to a different institution. Booking across facilities for Phase 3 requires prior approval from Paeds Resus — contact your institutional coordinator to request it.",
              });
            }
          }
        }

        // Online simulation (Phase 2): learner must have been advanced to phase_2 or beyond
        if (isOnlineSession && phaseStatus === "phase_1") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You must complete Phase 1 (upload and have your AHA elearning proof approved) before booking a simulation session.",
          });
        }

        // Deferred-payment lockout (CEO decision, 2026-07-19): interns (designation
        // bsn_intern / coi_bsc / coi_diploma / moi) are allowed to defer payment while
        // in Phase 1-2, but if FOUR MONTHS have passed since they joined the program
        // and they still have not made ANY payment, they lose the ability to book
        // further online simulation sessions until they pay something. This is
        // deliberately a zero-paid check, not a "not fully paid" check — nurses and
        // interns who have started an installment plan are not touched by this gate;
        // Phase 3's existing full-payment gate (>= KES 15,000) already handles the
        // "not fully paid yet" case for everyone. Money already paid is non-refundable
        // per Terms of Use §6.5 — this gate is what gives that term teeth for learners
        // who never start paying at all.
        const INTERN_DESIGNATIONS = ["bsn_intern", "coi_bsc", "coi_diploma", "moi"] as const;
        const FOUR_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 4;
        if (isOnlineSession && designation && (INTERN_DESIGNATIONS as readonly string[]).includes(designation)) {
          const joinedAt = enrollmentDate ?? createdAt;
          const paid = Number(totalPaidAmount ?? 0);
          if (joinedAt && paid <= 0 && Date.now() - new Date(joinedAt).getTime() > FOUR_MONTHS_MS) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "It has been more than 4 months since you joined this program with no payment recorded. Please make a payment (in full or as an installment) to regain access to simulation session booking — contact your institutional coordinator if you need to arrange this.",
            });
          }
        }

        // Nurse instalment-pace gate (CEO decision, 2026-07-19): unlike interns,
        // nurses don't get a deferral window — they must keep pace with KES
        // 2,500/month from enrollment to keep Phase 2 booking access. Deliberate
        // interpretation, flagged not assumed: "required by now" is computed as
        // full elapsed months since enrollment × 2,500 (floor, so there's a grace
        // period within the current month before that month's instalment is
        // actually due) — a nurse who's paid at least that much stays unblocked
        // even if they're ahead or behind on which specific month they're "on."
        const ONE_MONTH_MS = 1000 * 60 * 60 * 24 * 30;
        const MONTHLY_INSTALMENT_KES = 2500;
        if (isOnlineSession && designation === "permanent_nurse") {
          const joinedAt = enrollmentDate ?? createdAt;
          const paid = Number(totalPaidAmount ?? 0);
          if (joinedAt) {
            const monthsElapsed = Math.floor((Date.now() - new Date(joinedAt).getTime()) / ONE_MONTH_MS);
            const requiredByNow = Math.max(0, monthsElapsed) * MONTHLY_INSTALMENT_KES;
            if (paid < requiredByNow) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: `Your instalment payments are behind schedule (KES ${paid} paid of KES ${requiredByNow} expected at KES 2,500/month). Please make a payment to regain access to simulation session booking.`,
              });
            }
          }
        }

        // Hands-on Megacode (Phase 3): must be at phase_3 AND paid in full (≥ 15,000 KES)
        if (isHandsOnSession) {
          if (phaseStatus !== "phase_3" && phaseStatus !== "completed") {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You must complete all Phase 2 simulations before booking a hands-on Megacode session.",
            });
          }
          const paid = Number(totalPaidAmount ?? 0);
          if (paid < 15000) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: `Your balance must be fully settled (KES 15,000) before booking a physical Megacode. Current paid: KES ${paid.toLocaleString()}.`,
            });
          }
        }
      }
      // ─────────────────────────────────────────────────────────────────────

      const existing = await db
        .select({ id: trainingAttendance.id })
        .from(trainingAttendance)
        .where(and(eq(trainingAttendance.trainingScheduleId, input.scheduleId), eq(trainingAttendance.staffMemberId, ctx.user.id)))
        .limit(1);
      if (existing.length > 0) {
        return { success: true, alreadyRegistered: true, message: "You are already registered for this session" };
      }

      const isFullyBooked = (session.enrolledCount ?? 0) >= (session.maxCapacity ?? 0);
      if (isFullyBooked) {
        if (session.trainingType === "online") {
          await db.insert(trainingAttendance).values({
            trainingScheduleId: input.scheduleId,
            staffMemberId: ctx.user.id,
            attendanceStatus: "waitlisted",
            simulationRole: input.simulationRole,
          });
          return { success: true, alreadyRegistered: false, waitlisted: true, message: "This session is fully booked. You have been placed on the waitlist." };
        } else {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This session is fully booked" });
        }
      }

      await db.insert(trainingAttendance).values({
        trainingScheduleId: input.scheduleId,
        staffMemberId: ctx.user.id,
        attendanceStatus: "registered",
        simulationRole: input.simulationRole,
      });

      await db
        .update(trainingSchedules)
        .set({ enrolledCount: (session.enrolledCount ?? 0) + 1 })
        .where(eq(trainingSchedules.id, input.scheduleId));

      return { success: true, alreadyRegistered: false, waitlisted: false, message: "Successfully registered for the session" };
    }),

  getMyHandsOnBookings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select({
        attendanceId: trainingAttendance.id,
        scheduleId: trainingAttendance.trainingScheduleId,
        attendanceStatus: trainingAttendance.attendanceStatus,
        simulationRole: trainingAttendance.simulationRole,
        skillsAssessmentScore: trainingAttendance.skillsAssessmentScore,
        certificateIssued: trainingAttendance.certificateIssued,
        scheduledDate: trainingSchedules.scheduledDate,
        startTime: trainingSchedules.startTime,
        endTime: trainingSchedules.endTime,
        location: trainingSchedules.location,
        trainingType: trainingSchedules.trainingType,
        status: trainingSchedules.status,
        instructorName: trainingSchedules.instructorName,
        programType: courses.programType,
        courseTitle: courses.title,
      })
      .from(trainingAttendance)
      .innerJoin(trainingSchedules, eq(trainingAttendance.trainingScheduleId, trainingSchedules.id))
      .innerJoin(courses, eq(trainingSchedules.courseId, courses.id))
      .where(eq(trainingAttendance.staffMemberId, ctx.user.id))
      .orderBy(desc(trainingSchedules.scheduledDate));
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // COHORT-PHASE3-OVERFLOW: Platform-admin-only. Grants one named learner
  // explicit permission to book one named out-of-facility Phase 3 (hands-on)
  // session — the overflow valve for facilities that haven't reached 8
  // Phase-3-ready learners (CEO decision, 2026-07-19). No equivalent exists
  // for Phase 2 — that stays strictly same-facility, by design.
  // ─────────────────────────────────────────────────────────────────────────
  approvePhase3CrossFacilityOverflow: protectedProcedure
    .input(z.object({
      staffMemberId: z.number().int().positive(),
      scheduleId: z.number().int().positive(),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only Paeds Resus platform admins can approve cross-facility Phase 3 overflow bookings." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [session] = await db
        .select({ id: trainingSchedules.id, trainingType: trainingSchedules.trainingType })
        .from(trainingSchedules)
        .where(eq(trainingSchedules.id, input.scheduleId))
        .limit(1);
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      if (session.trainingType !== "hands_on" && session.trainingType !== "hybrid") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cross-facility overflow approval only applies to Phase 3 (hands-on) sessions." });
      }

      const existing = await db
        .select({ id: phase3CrossFacilityApprovals.id })
        .from(phase3CrossFacilityApprovals)
        .where(and(
          eq(phase3CrossFacilityApprovals.staffMemberId, input.staffMemberId),
          eq(phase3CrossFacilityApprovals.scheduleId, input.scheduleId)
        ))
        .limit(1);
      if (existing.length > 0) {
        return { success: true, alreadyApproved: true };
      }

      await db.insert(phase3CrossFacilityApprovals).values({
        staffMemberId: input.staffMemberId,
        scheduleId: input.scheduleId,
        approvedByUserId: ctx.user.id,
        notes: input.notes,
      });
      return { success: true, alreadyApproved: false };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // AHA-ENROLL-1: Upsert an AHA enrollment row and return its id.
  // Called by the course player on first quiz submit so recordQuizAttempt
  // always has a valid enrollmentId even on a first visit.
  // ─────────────────────────────────────────────────────────────────────────
  ensureAhaEnrollment: protectedProcedure
    .input(z.object({ programType: z.enum(['bls', 'acls', 'pals', 'heartsaver', 'nrp']) }))
    .mutation(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      try {
        const database = await getDb();
        if (!database) throw new Error('Database unavailable');

        // BLS prerequisite (CEO decision, 2026-07-19): "One must complete BLS to
        // start ACLS or PALS" — applies platform-wide, not just to the subsidised
        // cohort program. Deliberate interpretation, flagged not assumed: "complete"
        // is read as full BLS certification (practicalSkillsSignedOff), not just the
        // cognitive/online modules — ACLS and PALS both build on hands-on BLS skill,
        // not just BLS theory. If the intent was cognitive-modules-only, this is a
        // one-field change (practicalSkillsSignedOff -> cognitiveModulesComplete).
        if (input.programType === 'acls' || input.programType === 'pals') {
          const blsEnrollment = await database
            .select({ id: enrollments.id, signedOff: enrollments.practicalSkillsSignedOff })
            .from(enrollments)
            .where(and(eq(enrollments.userId, ctx.user.id), eq(enrollments.programType, 'bls')))
            .limit(1);
          if (blsEnrollment.length === 0 || !blsEnrollment[0].signedOff) {
            return {
              success: false,
              enrollmentId: 0,
              error: `You must complete BLS before starting ${input.programType.toUpperCase()}.`,
            };
          }
        }

        // Return existing enrollment id if present
        const existing = await database
          .select({ id: enrollments.id })
          .from(enrollments)
          .where(and(eq(enrollments.userId, ctx.user.id), eq(enrollments.programType, input.programType)))
          .limit(1);
        if (existing.length > 0) {
          return { success: true, enrollmentId: existing[0].id };
        }
        // Create new enrollment row (trainingDate required NOT NULL — default to now)
        const inserted = await database
          .insert(enrollments)
          .values({
            userId: ctx.user.id,
            programType: input.programType,
            trainingDate: new Date(),
            paymentStatus: 'completed',
            cognitiveModulesComplete: false,
          })
          .$returningId();
        const newId = (inserted as any)[0]?.id ?? 0;
        return { success: true, enrollmentId: newId };
      } catch (err) {
        console.error('[courses.ensureAhaEnrollment]', err);
        return { success: false, enrollmentId: 0, error: err instanceof Error ? err.message : 'Unknown error' };
      }
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // COHORT-PHASE-1: Return the current learner's cohort phase summary so the
  // frontend can display gates accurately and explain what is blocking them.
  // ─────────────────────────────────────────────────────────────────────────
  getPhaseSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const staffRows = await db
      .select({
        id: institutionalStaffMembers.id,
        phaseStatus: institutionalStaffMembers.phaseStatus,
        totalPaidAmount: institutionalStaffMembers.totalPaidAmount,
        facilityLinkStatus: institutionalStaffMembers.facilityLinkStatus,
        phase1ProofUrl: institutionalStaffMembers.phase1ProofUrl,
        phase1ProofApprovedAt: institutionalStaffMembers.phase1ProofApprovedAt,
        designation: institutionalStaffMembers.designation,
        enrollmentDate: institutionalStaffMembers.enrollmentDate,
        createdAt: institutionalStaffMembers.createdAt,
      })
      .from(institutionalStaffMembers)
      .where(and(
        eq(institutionalStaffMembers.userId, ctx.user.id),
        eq(institutionalStaffMembers.facilityLinkStatus, "linked")
      ))
      .limit(1);

    if (staffRows.length === 0) return null;

    const s = staffRows[0];
    const paid = Number(s.totalPaidAmount ?? 0);
    const subsidisedFee = 15000;

    // Count simulation sessions attended as team_member / team_leader
    const simRows = await db
      .select({
        role: trainingAttendance.simulationRole,
        passed: trainingAttendance.simulationCompetencyPassed,
      })
      .from(trainingAttendance)
      .where(and(
        eq(trainingAttendance.staffMemberId, ctx.user.id),
        eq(trainingAttendance.attendanceStatus, "attended")
      ));

    const memberSessions = simRows.filter((r) => r.role === "team_member").length;
    const leaderSessions = simRows.filter((r) => r.role === "team_leader").length;
    const phase2Complete = memberSessions >= 3 && leaderSessions >= 3;

    // Deferred-payment lockout status (see bookHandsOnSession for the enforced gate).
    // Surfaced here so the dashboard can warn a learner as the 4-month deadline
    // approaches, not just block them silently once it's already passed.
    const INTERN_DESIGNATIONS = ["bsn_intern", "coi_bsc", "coi_diploma", "moi"];
    const FOUR_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 4;
    const isIntern = !!s.designation && INTERN_DESIGNATIONS.includes(s.designation);
    const joinedAt = s.enrollmentDate ?? s.createdAt;
    const paymentDeadline = isIntern && joinedAt ? new Date(new Date(joinedAt).getTime() + FOUR_MONTHS_MS) : null;
    const paymentLockoutActive = !!paymentDeadline && paid <= 0 && Date.now() > paymentDeadline.getTime();

    // Nurse instalment-pace status (see bookHandsOnSession for the enforced gate).
    const ONE_MONTH_MS = 1000 * 60 * 60 * 24 * 30;
    const MONTHLY_INSTALMENT_KES = 2500;
    const isNurse = s.designation === "permanent_nurse";
    let nursePaceRequiredByNow: number | null = null;
    let nursePaceLockoutActive = false;
    if (isNurse && joinedAt) {
      const monthsElapsed = Math.floor((Date.now() - new Date(joinedAt).getTime()) / ONE_MONTH_MS);
      nursePaceRequiredByNow = Math.max(0, monthsElapsed) * MONTHLY_INSTALMENT_KES;
      nursePaceLockoutActive = paid < nursePaceRequiredByNow;
    }

    return {
      staffMemberId: s.id,
      phaseStatus: s.phaseStatus,
      designation: s.designation,
      phase1ProofUploaded: !!s.phase1ProofUrl,
      phase1ProofApproved: !!s.phase1ProofApprovedAt,
      memberSessions,
      leaderSessions,
      phase2Complete,
      totalPaid: paid,
      nursePaceRequiredByNow,
      nursePaceLockoutActive,
      balance: Math.max(0, subsidisedFee - paid),
      isPaidInFull: paid >= subsidisedFee,
      paymentDeadline: paymentDeadline ? paymentDeadline.toISOString() : null,
      paymentLockoutActive,
    };
  }),
});
