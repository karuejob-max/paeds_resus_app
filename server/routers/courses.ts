/**
 * Course Management Router
 * Handles micro-course catalog, enrollment, M-Pesa payments, and admin access
 */

import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { getDb } from '../db';
import { storageGet, storagePut } from "../storage";
import {
  CLINICAL_CONTENT_VERSION,
  ensureMicroCoursesCatalog,
  loadMicroCoursesFromDb,
} from '../lib/micro-course-catalog';
import { extendResusGpsAccessAfterMicroCourseCompletion } from '../lib/resusgps-access';
import { selectFromWaitlist, type WaitlistCandidate } from '../../shared/waitlist';
import { getProgramIdentity } from '../../shared/program-identity';
import { notifyBookingWaitlistPromoted, notifyPhase2RoleConfirmed, notifyRetrospectiveClaimReviewed } from '../lib/cohort-program-notifications';
import { saveMicroCourseCertificate, saveAhaCognitiveCertificate, markIlsCognitiveComplete } from '../certificates';
import { ensureCourseCatalogForSchedule } from '../lib/ensure-course-catalog-for-schedule';
import { resolveAhaCourseAnchor } from '../lib/resolve-aha-course-anchor';
import { microCourses, microCourseEnrollments, payments, courses, enrollments, userProgress, capstoneSubmissions, users, trainingSchedules, trainingAttendance, modules, institutionalStaffMembers, phase3CrossFacilityApprovals, retrospectiveRoleClaims } from '../../drizzle/schema';
import { assertNoInstructorDoubleBooking } from '../lib/instructor-double-booking-guard';
import { eq, and, asc, inArray, desc, sum, gte, sql, ne, or, like } from 'drizzle-orm';
import { initiateSTKPush, validatePhoneNumber, isMpesaConfigured } from '../_core/mpesa';
import { assertTrainingWorkspaceOrAdmin } from "../lib/training-workspace-guard";
import { syncFellowshipProgressForUser } from "../services/fellowship-progress.service";
import { computeMicroCourseEnrollmentProgress } from "../lib/sync-micro-course-enrollment-progress";
import { assertMicrocourseCompletionAllowed } from "../lib/microcourse-exam-gate";
import { fetchAhaHubPrograms } from "../lib/aha-hub-programs";
import { enrichAhaEnrollmentsWithProgress } from "../lib/compute-aha-enrollment-progress";
import {
  getAuthoritativePhase2CompletionStatus,
  getIerpEnrollment,
  getIerpInternProfile,
  getIerpPaymentAccessForUser,
  isIerpCognitiveProgram,
  isIerpInternProfileReady,
  IERP_TOTAL_FEE_KES,
  refreshIerpPhase2Status,
} from "../lib/ierp-program-state";
import { getAhaAccessDecision } from "../lib/aha-access";
import { ensurePhase2CompletionCertificateForUser } from "../lib/paeds-resus-certificate-issuance";

const AHA_PROGRAM_TYPES = ['bls', 'acls', 'pals', 'heartsaver', 'nrp', 'instructor'] as const;

const MAX_AHA_PROOF_BYTES = 10 * 1024 * 1024;

async function getAclsElearningProof(db: any, userId: number) {
  const [row] = await db
    .select({
      id: enrollments.id,
      cognitiveModulesComplete: enrollments.cognitiveModulesComplete,
      videoPreworkCertificateUrl: enrollments.videoPreworkCertificateUrl,
      precourseAssessmentCertificateUrl: enrollments.precourseAssessmentCertificateUrl,
      precourseAssessmentPassed: enrollments.precourseAssessmentPassed,
      elearningProofSubmittedAt: enrollments.elearningProofSubmittedAt,
      elearningProofVerifiedAt: enrollments.elearningProofVerifiedAt,
      elearningProofRejectedAt: enrollments.elearningProofRejectedAt,
      elearningProofRejectionReason: enrollments.elearningProofRejectionReason,
    })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.programType, "acls"), eq(enrollments.enrollmentStatus, "active")))
    .orderBy(desc(enrollments.createdAt))
    .limit(1);
  const [bls] = await db
    .select({ cognitiveModulesComplete: enrollments.cognitiveModulesComplete })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.programType, "bls"), eq(enrollments.enrollmentStatus, "active")))
    .orderBy(desc(enrollments.createdAt))
    .limit(1);
  const blsCognitiveComplete = !!bls?.cognitiveModulesComplete;
  const courseCognitiveComplete = !!row?.cognitiveModulesComplete;
  const proofSubmitted = !!row?.elearningProofSubmittedAt;
  const proofComplete = !!row?.videoPreworkCertificateUrl && !!row?.precourseAssessmentCertificateUrl && row?.precourseAssessmentPassed === true && !!row?.elearningProofVerifiedAt;
  return { row, blsCognitiveComplete, courseCognitiveComplete, proofSubmitted, proofComplete };
}

async function assertAclsElearningProof(db: any, userId: number) {
  const proof = await getAclsElearningProof(db, userId);
  if (!proof.blsCognitiveComplete) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Complete the BLS cognitive refresh on this platform before starting the ACLS prerequisite step." });
  }
  if (!proof.courseCognitiveComplete) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Complete the ACLS cognitive modules before uploading the AHA Video Prework and Precourse Self-Assessment certificates." });
  }
  if (!proof.proofComplete) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Upload both the AHA Video Prework Completion Certificate and the Passed Precourse Self-Assessment Certificate from elearning.heart.org before booking Phase 2." });
  }
  return proof;
}

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

// Phase 2 role-based booking (docs/IERP_NERP_PROGRAM_V2_SPEC.md §4.2, CEO
// 2026-07-31 respec). Per-role capacity for a Phase 2 session: team_leader
// and each named team_member_* role max 1, observer up to 7 (1 + 6 + 7 = 14
// total, hence maxCapacity 14 when declaring availability below).
const PHASE2_NAMED_TEAM_MEMBER_ROLES = [
  "team_member_airway_ventilation",
  "team_member_compressor_1",
  "team_member_compressor_2",
  "team_member_monitor_defib_cpr_coach",
  "team_member_iv_io_meds",
  "team_member_scribe",
] as const;
const PHASE2_ROLE_CAPACITY: Record<string, number> = {
  team_leader: 1,
  ...Object.fromEntries(PHASE2_NAMED_TEAM_MEMBER_ROLES.map((r) => [r, 1])),
  observer: 7,
};
const PHASE2_BOOKABLE_ROLES = ["team_leader", ...PHASE2_NAMED_TEAM_MEMBER_ROLES, "observer"] as const;
const PHASE2_SESSION_CAPACITY = Object.values(PHASE2_ROLE_CAPACITY).reduce((a, b) => a + b, 0);

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
        .where(inArray(courses.programType, ['bls', 'acls', 'pals', 'heartsaver', 'nrp', 'instructor']))
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

  getAhaAccessStatus: protectedProcedure
    .input(z.object({ programType: z.enum(["bls", "acls", "pals", "heartsaver", "nrp", "instructor"]) }))
    .query(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      return getAhaAccessDecision(database, ctx.user.id, input.programType);
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
        programType: z.enum(['bls', 'acls', 'pals', 'heartsaver', 'nrp', 'instructor']),
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

  markIlsCognitiveComplete: protectedProcedure
    .input(z.object({ enrollmentId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const rows = await database
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, ctx.user.id), eq(enrollments.programType, "paeds_resus_ils"), eq(enrollments.enrollmentStatus, "active")))
        .limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Institutional Life Support enrollment not found." });
      const result = await markIlsCognitiveComplete(input.enrollmentId);
      if (!result.cognitiveComplete) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete payment and all Institutional Life Support modules before submitting the final knowledge check." });
      }
      return { success: true, enrollmentId: input.enrollmentId, ...result };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // AHA-SCHED-1: List upcoming public hands-on sessions available for booking.
  // ─────────────────────────────────────────────────────────────────────────
  listUpcomingHandsOnSessions: protectedProcedure
    .input(z.object({ programType: z.enum(["bls", "acls", "pals", "heartsaver", "nrp", "instructor"]).optional() }))
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
          programType: courses.programType,
          maxCapacity: trainingSchedules.maxCapacity,
          enrolledCount: trainingSchedules.enrolledCount,
          status: trainingSchedules.status,
          scheduledDate: trainingSchedules.scheduledDate,
          trainingType: trainingSchedules.trainingType,
          institutionalAccountId: trainingSchedules.institutionalAccountId,
        })
        .from(trainingSchedules)
        .innerJoin(courses, eq(trainingSchedules.courseId, courses.id))
        .where(eq(trainingSchedules.id, input.scheduleId))
        .limit(1);
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      const ierpEnrollment = await getIerpEnrollment(db, ctx.user.id);
      if (session.programType === "acls" && !ierpEnrollment) await assertAclsElearningProof(db, ctx.user.id);
      if (session.status === "cancelled") throw new TRPCError({ code: "BAD_REQUEST", message: "This session has been cancelled" });
      if (session.scheduledDate && new Date(session.scheduledDate) < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This session has already passed" });
      }

      // ── Phase Gate: enforce cohort program rules ──────────────────────────
      // IERP training participation is independent of an institutional roster
      // row. Its Phase 3 gate is therefore evaluated from the user-owned IERP
      // record and the authoritative named-role completion source.
      if (ierpEnrollment && (session.trainingType === "hands_on" || session.trainingType === "hybrid")) {
        const internProfile = await getIerpInternProfile(db, ctx.user.id);
        if (!isIerpInternProfileReady(internProfile)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Complete your Intern profile and submit your MoH deployment/posting letter before booking an IERP hands-on assessment.",
          });
        }
        const phase2 = await getAuthoritativePhase2CompletionStatus(db, ctx.user.id);
        if (ierpEnrollment.phase1Status !== "verified" || !phase2.phase2Complete) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Complete and verify Phase 1, then complete the required confirmed Phase 2 roles before booking a hands-on assessment.",
          });
        }
        const payment = await getIerpPaymentAccessForUser(db, ctx.user.id);
        if (!payment) throw new TRPCError({ code: "FORBIDDEN", message: "Complete your Intern profile before booking an IERP hands-on assessment." });
        if (!payment.isPaidInFull) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Your IERP balance must be fully settled (KES ${IERP_TOTAL_FEE_KES.toLocaleString()}) before booking a physical Megacode. Current paid: KES ${payment.paid.toLocaleString()}.`,
          });
        }
      }

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

      if (!ierpEnrollment && staffRow.length > 0) {
        const { phaseStatus, totalPaidAmount, designation, enrollmentDate, createdAt, institutionalAccountId } = staffRow[0];
        const isOnlineSession = session.trainingType === "online";
        const isHandsOnSession = session.trainingType === "hands_on" || session.trainingType === "hybrid";
        // institutionalAccountId can now be null on self-service staff rows
        // (2026-08-04, §2). Currently safe: this whole legacy gate only
        // ever runs against coordinator-created sessions, which always have
        // a real institutionalAccountId (assertInstitutionAccess requires
        // one), so null-staffRow vs. real-session-id correctly evaluates
        // false. Self-service Phase 2 booking goes through bookPhase2Role
        // instead, which has no facility check at all (§4.1, cross-program
        // by design). Would need real null-handling here if a self-service
        // hands_on/Phase 3 path is ever added.
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

        // IERP timing rule: August-November starters may use Phase 2 before
        // payment until 1 December EAT. From December onward, the full
        // programme fee is required before further Phase 2 access.
        const INTERN_DESIGNATIONS = ["noi", "coi_bsc", "coi_diploma", "moi"] as const;
        if (isOnlineSession && designation && (INTERN_DESIGNATIONS as readonly string[]).includes(designation)) {
          const payment = await getIerpPaymentAccessForUser(db, ctx.user.id);
          if (!payment) throw new TRPCError({ code: "FORBIDDEN", message: "Complete your Intern profile before booking a Phase 2 simulation." });
          if (payment.phase2BookingLocked) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: `IERP Phase 2 access requires the full KES ${IERP_TOTAL_FEE_KES.toLocaleString()} programme fee. Complete payment before continuing.`,
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
          if (paid < IERP_TOTAL_FEE_KES) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: `Your balance must be fully settled (KES ${IERP_TOTAL_FEE_KES.toLocaleString()}) before booking a physical Megacode. Current paid: KES ${paid.toLocaleString()}.`,
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

  // ─────────────────────────────────────────────────────────────────────────
  // CANCEL-AND-PROMOTE: previously there was no cancellation path at all —
  // enrolledCount only ever incremented, so a session's waitlist could never
  // actually be promoted no matter how the priority algorithm sorted it
  // (INST-21 follow-up, 2026-07-20). This is the first real caller of
  // `selectFromWaitlist` (shared/waitlist.ts) anywhere in the codebase.
  // ─────────────────────────────────────────────────────────────────────────
  cancelHandsOnSession: protectedProcedure
    .input(z.object({ scheduleId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [myAttendance] = await db
        .select({ id: trainingAttendance.id, attendanceStatus: trainingAttendance.attendanceStatus })
        .from(trainingAttendance)
        .where(and(
          eq(trainingAttendance.trainingScheduleId, input.scheduleId),
          eq(trainingAttendance.staffMemberId, ctx.user.id)
        ))
        .limit(1);

      if (!myAttendance) {
        throw new TRPCError({ code: "NOT_FOUND", message: "You are not registered for this session" });
      }
      if (myAttendance.attendanceStatus === "cancelled") {
        return { success: true, alreadyCancelled: true, promoted: null as number | null };
      }

      const wasRegistered = myAttendance.attendanceStatus === "registered";

      await db
        .update(trainingAttendance)
        .set({ attendanceStatus: "cancelled", updatedAt: new Date() })
        .where(eq(trainingAttendance.id, myAttendance.id));

      let promotedStaffMemberId: number | null = null;

      if (wasRegistered) {
        const [session] = await db
          .select({ id: trainingSchedules.id, enrolledCount: trainingSchedules.enrolledCount })
          .from(trainingSchedules)
          .where(eq(trainingSchedules.id, input.scheduleId))
          .limit(1);

        if (session) {
          await db
            .update(trainingSchedules)
            .set({ enrolledCount: Math.max(0, (session.enrolledCount ?? 1) - 1) })
            .where(eq(trainingSchedules.id, input.scheduleId));

          // A slot just freed up — check the waitlist and promote the top
          // candidate per selectFromWaitlist's payment-percentage-then-FIFO rule.
          const waitlisted = await db
            .select({
              attendanceId: trainingAttendance.id,
              staffMemberId: trainingAttendance.staffMemberId,
              waitlistedAt: trainingAttendance.createdAt,
              totalPaidAmount: institutionalStaffMembers.totalPaidAmount,
            })
            .from(trainingAttendance)
            .innerJoin(institutionalStaffMembers, eq(institutionalStaffMembers.userId, trainingAttendance.staffMemberId))
            .where(and(
              eq(trainingAttendance.trainingScheduleId, input.scheduleId),
              eq(trainingAttendance.attendanceStatus, "waitlisted")
            ));

          if (waitlisted.length > 0) {
            const candidates: WaitlistCandidate[] = waitlisted.map((w) => ({
              staffMemberId: w.staffMemberId,
              totalPaidAmount: Number(w.totalPaidAmount ?? 0),
              subsidisedFee: 15000,
              waitlistedAt: w.waitlistedAt ?? new Date(),
            }));
            const [winner] = selectFromWaitlist(candidates, 1);

            if (winner) {
              const winnerAttendance = waitlisted.find((w) => w.staffMemberId === winner.staffMemberId);
              if (winnerAttendance) {
                await db
                  .update(trainingAttendance)
                  .set({ attendanceStatus: "registered", updatedAt: new Date() })
                  .where(eq(trainingAttendance.id, winnerAttendance.attendanceId));
                await db
                  .update(trainingSchedules)
                  .set({ enrolledCount: Math.max(0, (session.enrolledCount ?? 1) - 1) + 1 })
                  .where(eq(trainingSchedules.id, input.scheduleId));
                promotedStaffMemberId = winner.staffMemberId;
                void notifyBookingWaitlistPromoted(db, input.scheduleId, winner.staffMemberId);
              }
            }
          }
        }
      }

      return { success: true, alreadyCancelled: false, promoted: promotedStaffMemberId };
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
    .input(z.object({ programType: z.enum(['bls', 'acls', 'pals', 'heartsaver', 'nrp', 'instructor']) }))
    .mutation(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      try {
        const database = await getDb();
        if (!database) throw new Error('Database unavailable');

        // Platform-wide sequencing: ACLS begins only after the learner has
        // completed the platform BLS cognitive refresh. A prior BLS certificate
        // does not bypass this refresh; practical sign-off is a later requirement.
        if (input.programType === 'acls' || input.programType === 'pals') {
          const blsEnrollment = await database
            .select({ id: enrollments.id, cognitiveComplete: enrollments.cognitiveModulesComplete })
            .from(enrollments)
            .where(and(eq(enrollments.userId, ctx.user.id), eq(enrollments.programType, 'bls')))
            .limit(1);
          if (blsEnrollment.length === 0 || !blsEnrollment[0].cognitiveComplete) {
            return {
              success: false,
              enrollmentId: 0,
              error: `You must complete BLS before starting ${input.programType.toUpperCase()}.`,
            };
          }
        }

        const ahaAccess = await getAhaAccessDecision(database, ctx.user.id, input.programType);
        if (!ahaAccess.allowed) {
          return {
            success: false,
            enrollmentId: 0,
            error: ahaAccess.message,
          };
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
  // NERP/IERP v2 respec (docs/IERP_NERP_PROGRAM_V2_SPEC.md §3, CEO 2026-07-31):
  // gates elearning.heart.org proof upload behind platform cognitive-module
  // completion, both directions. Deliberately self-service -- keyed only on
  // ctx.user.id + enrollments, no institutionalStaffMembers/facility-link
  // dependency, per the same respec's §2 (no coordinator gate, any phase).
  // BLS has no elearning.heart.org step of its own (Paeds-Resus-certified,
  // not AHA); this only applies to acls/pals/nrp.
  // ─────────────────────────────────────────────────────────────────────────
  getElearningProofReviewQueue: protectedProcedure
    .input(z.object({
      programType: z.enum(["acls", "pals", "nrp"]).optional(),
      search: z.string().trim().max(120).optional(),
      limit: z.number().int().min(1).max(200).default(100),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only a platform reviewer can access AHA eLearning proof review." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const search = input.search ? `%${input.search}%` : undefined;
      const rows = await db
        .select({
          enrollmentId: enrollments.id,
          userId: enrollments.userId,
          userName: users.name,
          userEmail: users.email,
          programType: enrollments.programType,
          cognitiveModulesComplete: enrollments.cognitiveModulesComplete,
          videoPreworkCertificateUrl: enrollments.videoPreworkCertificateUrl,
          precourseAssessmentCertificateUrl: enrollments.precourseAssessmentCertificateUrl,
          precourseAssessmentPassed: enrollments.precourseAssessmentPassed,
          submittedAt: enrollments.elearningProofSubmittedAt,
          verifiedAt: enrollments.elearningProofVerifiedAt,
          rejectedAt: enrollments.elearningProofRejectedAt,
          rejectionReason: enrollments.elearningProofRejectionReason,
        })
        .from(enrollments)
        .leftJoin(users, eq(users.id, enrollments.userId))
        .where(and(
          sql`${enrollments.elearningProofSubmittedAt} IS NOT NULL`,
          input.programType ? eq(enrollments.programType, input.programType) : inArray(enrollments.programType, ["acls", "pals", "nrp"]),
          search ? or(like(users.name, search), like(users.email, search)) : undefined,
        ))
        .orderBy(desc(enrollments.elearningProofSubmittedAt))
        .limit(input.limit);
      return rows;
    }),

  getElearningProofDownloadUrl: protectedProcedure
    .input(z.object({ enrollmentId: z.number().int().positive(), documentType: z.enum(["video_prework", "precourse_assessment"]) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [row] = await db
        .select({ userId: enrollments.userId, videoKey: enrollments.videoPreworkCertificateUrl, assessmentKey: enrollments.precourseAssessmentCertificateUrl })
        .from(enrollments)
        .where(eq(enrollments.id, input.enrollmentId))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Enrollment not found" });
      if (ctx.user.role !== "admin" && row.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You may only access your own AHA eLearning proof." });
      }
      const key = input.documentType === "video_prework" ? row.videoKey : row.assessmentKey;
      if (!key) throw new TRPCError({ code: "NOT_FOUND", message: "Requested certificate has not been submitted" });
      if (/^https?:\/\//i.test(key)) return { key, url: key };
      return storageGet(key);
    }),

  reviewElearningProof: protectedProcedure
    .input(z.object({
      enrollmentId: z.number().int().positive(),
      decision: z.enum(["verified", "rejected"]),
      reason: z.string().trim().max(1000),
    }).superRefine((value, refinement) => {
      if (value.decision === "rejected" && !value.reason) {
        refinement.addIssue({ code: "custom", path: ["reason"], message: "A rejection reason is required." });
      }
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only a platform reviewer can review AHA eLearning proof." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [row] = await db
        .select({
          id: enrollments.id,
          cognitiveModulesComplete: enrollments.cognitiveModulesComplete,
          videoPreworkCertificateUrl: enrollments.videoPreworkCertificateUrl,
          precourseAssessmentCertificateUrl: enrollments.precourseAssessmentCertificateUrl,
          precourseAssessmentPassed: enrollments.precourseAssessmentPassed,
          elearningProofSubmittedAt: enrollments.elearningProofSubmittedAt,
        })
        .from(enrollments)
        .where(eq(enrollments.id, input.enrollmentId))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Enrollment not found" });
      if (!row.elearningProofSubmittedAt) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Learner must submit both certificates before review." });
      if (input.decision === "verified" && (!row.cognitiveModulesComplete || !row.videoPreworkCertificateUrl || !row.precourseAssessmentCertificateUrl || row.precourseAssessmentPassed !== true)) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Both certificates and the required cognitive completion must be present before verification." });
      }
      const reviewedAt = new Date();
      await db.update(enrollments).set({
        elearningProofVerifiedAt: input.decision === "verified" ? reviewedAt : null,
        elearningProofRejectedAt: input.decision === "rejected" ? reviewedAt : null,
        elearningProofRejectionReason: input.decision === "rejected" ? input.reason : null,
        updatedAt: reviewedAt,
      }).where(eq(enrollments.id, row.id));
      return { success: true as const, decision: input.decision };
    }),

  getElearningProofStatus: protectedProcedure
    .input(z.object({ programType: z.enum(['acls', 'pals', 'nrp']) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [blsRow] = await db
        .select({ cognitiveModulesComplete: enrollments.cognitiveModulesComplete })
        .from(enrollments)
        .where(and(eq(enrollments.userId, ctx.user.id), eq(enrollments.programType, 'bls')))
        .limit(1);
      const [courseRow] = await db
        .select({
          id: enrollments.id,
          cognitiveModulesComplete: enrollments.cognitiveModulesComplete,
          videoPreworkCertificateUrl: enrollments.videoPreworkCertificateUrl,
          precourseAssessmentCertificateUrl: enrollments.precourseAssessmentCertificateUrl,
          precourseAssessmentPassed: enrollments.precourseAssessmentPassed,
          elearningProofSubmittedAt: enrollments.elearningProofSubmittedAt,
          elearningProofVerifiedAt: enrollments.elearningProofVerifiedAt,
          elearningProofRejectedAt: enrollments.elearningProofRejectedAt,
          elearningProofRejectionReason: enrollments.elearningProofRejectionReason,
        })
        .from(enrollments)
        .where(and(eq(enrollments.userId, ctx.user.id), eq(enrollments.programType, input.programType)))
        .limit(1);

      const blsCognitiveComplete = !!blsRow?.cognitiveModulesComplete;
      const courseCognitiveComplete = !!courseRow?.cognitiveModulesComplete;
      const eligibleToUpload = blsCognitiveComplete && courseCognitiveComplete;
      const alreadySubmitted = !!courseRow?.elearningProofSubmittedAt;
      const verified = !!courseRow?.elearningProofVerifiedAt;
      const rejected = !!courseRow?.elearningProofRejectedAt;

      let guidance: string;
      if (verified) {
        guidance = "Verified. You're clear to move on to Phase 2 booking once it's available for this course.";
      } else if (rejected) {
        guidance = `Rejected. ${courseRow?.elearningProofRejectionReason || "Review the certificates and submit corrected documents."}`;
      } else if (alreadySubmitted) {
        guidance = "Submitted and waiting for platform review. Phase 2 booking opens after the reviewer verifies both certificates.";
      } else if (!blsCognitiveComplete) {
        guidance = "Finish the BLS cognitive modules on this platform first — that's a prerequisite before elearning.heart.org proof can be uploaded for any other course.";
      } else if (!courseCognitiveComplete) {
        guidance = `Finish the ${input.programType.toUpperCase()} cognitive modules on this platform first, then come back here to upload your elearning.heart.org proof.`;
      } else {
        guidance = `You're ready. Go to elearning.heart.org, sign in (or create an account), and complete the ${input.programType.toUpperCase()} Video Prework and Precourse Self-Assessment — then upload both certificates here.`;
      }

      return {
        blsCognitiveComplete,
        courseCognitiveComplete,
        eligibleToUpload,
        alreadySubmitted,
        verified,
        rejected,
        rejectionReason: courseRow?.elearningProofRejectionReason ?? null,
        videoPreworkCertificateUrl: courseRow?.videoPreworkCertificateUrl ?? null,
        precourseAssessmentCertificateUrl: courseRow?.precourseAssessmentCertificateUrl ?? null,
        precourseAssessmentPassed: courseRow?.precourseAssessmentPassed ?? null,
        guidance,
      };
    }),

  submitElearningProof: protectedProcedure
    .input(
      z.object({
        programType: z.enum(['acls', 'pals', 'nrp']),
        videoPreworkCertificateUrl: z.string().url("Must be a valid URL"),
        precourseAssessmentCertificateUrl: z.string().url("Must be a valid URL"),
        precourseAssessmentPassed: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [blsRow] = await db
        .select({ cognitiveModulesComplete: enrollments.cognitiveModulesComplete })
        .from(enrollments)
        .where(and(eq(enrollments.userId, ctx.user.id), eq(enrollments.programType, 'bls')))
        .limit(1);
      if (!blsRow?.cognitiveModulesComplete) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Finish the BLS cognitive modules on this platform before uploading elearning.heart.org proof for any other course.",
        });
      }

      const [courseRow] = await db
        .select({ id: enrollments.id, cognitiveModulesComplete: enrollments.cognitiveModulesComplete })
        .from(enrollments)
        .where(and(eq(enrollments.userId, ctx.user.id), eq(enrollments.programType, input.programType)))
        .limit(1);
      if (!courseRow || !courseRow.cognitiveModulesComplete) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Finish the ${input.programType.toUpperCase()} cognitive modules on this platform before uploading elearning.heart.org proof for this course.`,
        });
      }

      if (!input.precourseAssessmentPassed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The Precourse Self-Assessment must show a passed score. If you haven't passed yet, retake it on elearning.heart.org before uploading.",
        });
      }

      await db
        .update(enrollments)
        .set({
          videoPreworkCertificateUrl: input.videoPreworkCertificateUrl,
          precourseAssessmentCertificateUrl: input.precourseAssessmentCertificateUrl,
          precourseAssessmentPassed: input.precourseAssessmentPassed,
          elearningProofSubmittedAt: new Date(),
          elearningProofVerifiedAt: null,
          elearningProofRejectedAt: null,
          elearningProofRejectionReason: null,
        })
        .where(eq(enrollments.id, courseRow.id));

      return { success: true };
    }),

  /** Private upload path for the two ACLS elearning.heart.org certificates. */
  submitElearningProofFiles: protectedProcedure
    .input(z.object({
      documents: z.array(z.object({
        documentType: z.enum(["video_prework", "precourse_assessment"]),
        fileName: z.string().trim().min(1).max(255),
        contentType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
        dataBase64: z.string().min(1).max(20_000_000),
      })).length(2),
    }).superRefine((value, ctx) => {
      if (new Set(value.documents.map((document) => document.documentType)).size !== 2) {
        ctx.addIssue({ code: "custom", message: "Submit exactly one Video Prework document and one Precourse Self-Assessment document." });
      }
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const proof = await getAclsElearningProof(db, ctx.user.id);
      if (!proof.blsCognitiveComplete || !proof.courseCognitiveComplete || !proof.row) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Complete the BLS refresh and ACLS cognitive modules before uploading the two AHA eLearning certificates." });
      }
      const updates: Record<string, unknown> = {
        elearningProofSubmittedAt: new Date(),
        elearningProofVerifiedAt: null,
        elearningProofRejectedAt: null,
        elearningProofRejectionReason: null,
        precourseAssessmentPassed: true,
      };
      for (const document of input.documents) {
        const raw = document.dataBase64.replace(/^data:[^;]+;base64,/, "");
        const bytes = Buffer.from(raw, "base64");
        if (bytes.length === 0 || bytes.length > MAX_AHA_PROOF_BYTES) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Each certificate must be between 1 byte and 10 MB." });
        }
        const safeName = document.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const key = `aha/${ctx.user.id}/${proof.row.id}/acls/${document.documentType}/${randomUUID()}-${safeName}`;
        const stored = await storagePut(key, bytes, document.contentType);
        if (document.documentType === "video_prework") updates.videoPreworkCertificateUrl = stored.key;
        else updates.precourseAssessmentCertificateUrl = stored.key;
      }
      await db.update(enrollments).set(updates).where(eq(enrollments.id, proof.row.id));
      return { success: true as const, message: "Both certificates were submitted privately. Phase 2 booking is now available." };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 2 role-based booking (docs/IERP_NERP_PROGRAM_V2_SPEC.md §4). Self-
  // service throughout, no coordinator involved: an approved instructor
  // declares their own availability, which directly creates a bookable
  // session (institutionalAccountId left null -- cross-program, not tied
  // to one institution, per §4.1). A role only counts toward completion
  // once the instructor who ran the session confirms it (§4.5).
  // ─────────────────────────────────────────────────────────────────────────

  declareInstructorAvailability: protectedProcedure
    .input(
      z.object({
        courseId: z.number().int().positive(),
        scheduledDate: z.coerce.date(),
        startTime: z.string().min(1),
        endTime: z.string().min(1),
        location: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [u] = await db
        .select({ name: users.name, instructorApprovedAt: users.instructorApprovedAt, role: users.role })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      if (!u?.instructorApprovedAt && u?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only approved instructors can declare Phase 2 availability." });
      }

      await assertNoInstructorDoubleBooking(db, {
        instructorId: ctx.user.id,
        scheduledDate: input.scheduledDate,
        startTime: input.startTime,
        endTime: input.endTime,
      });

      const [inserted] = await db.insert(trainingSchedules).values({
        institutionalAccountId: null,
        courseId: input.courseId,
        trainingType: "online",
        scheduledDate: input.scheduledDate,
        startTime: input.startTime,
        endTime: input.endTime,
        location: input.location ?? null,
        instructorId: ctx.user.id,
        instructorName: u?.name ?? undefined,
        maxCapacity: PHASE2_SESSION_CAPACITY,
        enrolledCount: 0,
        status: "scheduled",
      });

      return { success: true, scheduleId: (inserted as { insertId: number }).insertId };
    }),

  // Calendar listing for learners choosing a session. Sorted oldest-
  // declared-first (§4.4's "first-declared-first-open" -- a display/sort
  // order, not a hard lock; every non-full session stays bookable, per the
  // CEO's own clarification that a learner can pick any open session).
  listPhase2Sessions: protectedProcedure
    .input(z.object({ courseId: z.number().int().positive().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const conditions = [eq(trainingSchedules.trainingType, "online"), ne(trainingSchedules.status, "cancelled")];
      if (input.courseId) conditions.push(eq(trainingSchedules.courseId, input.courseId));

      const sessions = await db
        .select({
          id: trainingSchedules.id,
          courseId: trainingSchedules.courseId,
          courseTitle: courses.title,
          scheduledDate: trainingSchedules.scheduledDate,
          startTime: trainingSchedules.startTime,
          endTime: trainingSchedules.endTime,
          location: trainingSchedules.location,
          instructorId: trainingSchedules.instructorId,
          instructorName: trainingSchedules.instructorName,
          createdAt: trainingSchedules.createdAt,
        })
        .from(trainingSchedules)
        .innerJoin(courses, eq(trainingSchedules.courseId, courses.id))
        .where(and(...conditions))
        .orderBy(asc(trainingSchedules.createdAt));

      if (sessions.length === 0) return [];

      const scheduleIds = sessions.map((s) => s.id);
      const bookings = await db
        .select({
          trainingScheduleId: trainingAttendance.trainingScheduleId,
          simulationRole: trainingAttendance.simulationRole,
        })
        .from(trainingAttendance)
        .where(
          and(
            inArray(trainingAttendance.trainingScheduleId, scheduleIds),
            ne(trainingAttendance.attendanceStatus, "cancelled")
          )
        );

      return sessions.map((s) => {
        const taken = bookings.filter((b) => b.trainingScheduleId === s.id);
        const roleAvailability = Object.fromEntries(
          PHASE2_BOOKABLE_ROLES.map((role) => {
            const takenCount = taken.filter((b) => b.simulationRole === role).length;
            return [role, { capacity: PHASE2_ROLE_CAPACITY[role], taken: takenCount, available: PHASE2_ROLE_CAPACITY[role] - takenCount }];
          })
        );
        return { ...s, roleAvailability };
      });
    }),

  bookPhase2Role: protectedProcedure
    .input(z.object({ scheduleId: z.number().int().positive(), role: z.enum(PHASE2_BOOKABLE_ROLES) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [session] = await db
        .select({ id: trainingSchedules.id, status: trainingSchedules.status, trainingType: trainingSchedules.trainingType, programType: courses.programType })
        .from(trainingSchedules)
        .innerJoin(courses, eq(trainingSchedules.courseId, courses.id))
        .where(eq(trainingSchedules.id, input.scheduleId))
        .limit(1);
      if (!session || session.trainingType !== "online" || session.status === "cancelled") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found or no longer available." });
      }
      // IERP stores the same two certificates in its private Phase 1 table;
      // NERP and self-pay store them on the shared ACLS enrollment row.

      // Phase/payment gate (docs/IERP_NERP_PROGRAM_V2_SPEC.md §6.3). Phase 2
      // is cross-program by design. IERP uses its user-owned programme row;
      // NERP and legacy learners retain the existing staff-row branch.
      const ierpEnrollment = await getIerpEnrollment(db, ctx.user.id);
      if (session.programType === "acls" && !ierpEnrollment) await assertAclsElearningProof(db, ctx.user.id);
      if (ierpEnrollment) {
        const internProfile = await getIerpInternProfile(db, ctx.user.id);
        if (!isIerpInternProfileReady(internProfile)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Complete your Intern profile and submit your MoH deployment/posting letter before booking a Phase 2 simulation.",
          });
        }
        if (! ["submitted", "verified"].includes(ierpEnrollment.phase1Status)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Upload both Phase 1 certificates before booking a Phase 2 simulation.",
          });
        }
        const payment = await getIerpPaymentAccessForUser(db, ctx.user.id);
        if (!payment) throw new TRPCError({ code: "FORBIDDEN", message: "Complete your Intern profile before booking a Phase 2 simulation." });
        if (payment.phase2BookingLocked) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "IERP Phase 2 access now requires the full KES 15,000 programme fee. Complete payment before continuing.",
          });
        }
      }

      const [staffRow] = await db
        .select({
          phaseStatus: institutionalStaffMembers.phaseStatus,
          totalPaidAmount: institutionalStaffMembers.totalPaidAmount,
          designation: institutionalStaffMembers.designation,
          enrollmentDate: institutionalStaffMembers.enrollmentDate,
          createdAt: institutionalStaffMembers.createdAt,
        })
        .from(institutionalStaffMembers)
        .where(and(eq(institutionalStaffMembers.userId, ctx.user.id), eq(institutionalStaffMembers.facilityLinkStatus, "linked")))
        .limit(1);

      if (!ierpEnrollment && staffRow) {
        const { phaseStatus, totalPaidAmount, designation, enrollmentDate, createdAt } = staffRow;
        if (phaseStatus === "phase_1") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Complete Phase 1 (cognitive modules + elearning.heart.org proof) before booking a Phase 2 simulation.",
          });
        }

        const INTERN_DESIGNATIONS = ["noi", "coi_bsc", "coi_diploma", "moi"] as const;
        const joinedAt = enrollmentDate ?? createdAt;
        const paid = Number(totalPaidAmount ?? 0);

        if (designation && (INTERN_DESIGNATIONS as readonly string[]).includes(designation)) {
          const payment = await getIerpPaymentAccessForUser(db, ctx.user.id);
          if (!payment) throw new TRPCError({ code: "FORBIDDEN", message: "Complete your Intern profile before booking a Phase 2 simulation." });
          if (payment.phase2BookingLocked) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: `IERP Phase 2 access requires the full KES ${IERP_TOTAL_FEE_KES.toLocaleString()} programme fee. Complete payment before continuing.`,
            });
          }
        } else if (designation === "permanent_nurse") {
          // BLS is free (§6.3) -- this gate only fires once a nurse is
          // actually booking a Phase 2 session, which per the platform-wide
          // BLS-before-ACLS/PALS rule can't happen on the BLS course itself.
          const ONE_MONTH_MS = 1000 * 60 * 60 * 24 * 30;
          const MONTHLY_INSTALMENT_KES = 2500;
          if (joinedAt) {
            const monthsElapsed = Math.floor((Date.now() - new Date(joinedAt).getTime()) / ONE_MONTH_MS);
            const requiredByNow = Math.max(0, monthsElapsed) * MONTHLY_INSTALMENT_KES;
            if (paid < requiredByNow) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: `Your instalment payments are behind schedule (KES ${paid} paid of KES ${requiredByNow} expected at KES 2,500/month). Make a payment to regain Phase 2 booking access.`,
              });
            }
          }
        }
      }

      const [existing] = await db
        .select({ id: trainingAttendance.id })
        .from(trainingAttendance)
        .where(
          and(
            eq(trainingAttendance.trainingScheduleId, input.scheduleId),
            eq(trainingAttendance.staffMemberId, ctx.user.id),
            ne(trainingAttendance.attendanceStatus, "cancelled")
          )
        )
        .limit(1);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "You already have a booking for this session. Cancel it first if you want a different role." });
      }

      const takenCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(trainingAttendance)
        .where(
          and(
            eq(trainingAttendance.trainingScheduleId, input.scheduleId),
            eq(trainingAttendance.simulationRole, input.role),
            ne(trainingAttendance.attendanceStatus, "cancelled")
          )
        );
      const capacity = PHASE2_ROLE_CAPACITY[input.role];
      if (Number(takenCount[0]?.count ?? 0) >= capacity) {
        throw new TRPCError({ code: "CONFLICT", message: `That role is already fully booked for this session. Pick a different role or session.` });
      }

      await db.insert(trainingAttendance).values({
        trainingScheduleId: input.scheduleId,
        staffMemberId: ctx.user.id,
        attendanceStatus: "registered",
        simulationRole: input.role,
      });

      return { success: true };
    }),

  // A role only counts toward Phase 2 completion once the instructor who
  // ran the session confirms it (§4.5) -- admin can confirm on any
  // instructor's behalf (§4.5's "admin override on all of it").
  confirmPhase2Role: protectedProcedure
    .input(z.object({ attendanceId: z.number().int().positive(), passed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [row] = await db
        .select({ scheduleInstructorId: trainingSchedules.instructorId, scheduleId: trainingAttendance.trainingScheduleId })
        .from(trainingAttendance)
        .innerJoin(trainingSchedules, eq(trainingAttendance.trainingScheduleId, trainingSchedules.id))
        .where(eq(trainingAttendance.id, input.attendanceId))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });

      const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (row.scheduleInstructorId !== ctx.user.id && u?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the instructor who ran this session (or an admin) can confirm a role." });
      }

      await db
        .update(trainingAttendance)
        .set({
          simulationCompetencyPassed: input.passed,
          attendanceStatus: input.passed ? "attended" : "absent",
        })
        .where(eq(trainingAttendance.id, input.attendanceId));

      const confirmedUserId = (await db
        .select({ userId: trainingAttendance.staffMemberId })
        .from(trainingAttendance)
        .where(eq(trainingAttendance.id, input.attendanceId))
        .limit(1))[0]?.userId ?? 0;
      void notifyPhase2RoleConfirmed(db, input.attendanceId, input.passed);
      void refreshIerpPhase2Status(db, confirmedUserId);
      if (input.passed && confirmedUserId) {
        void ensurePhase2CompletionCertificateForUser(db, confirmedUserId).catch((error) => {
          console.error("[courses.confirmPhase2Role] Universal Phase 2 certificate projection failed:", error);
        });
      }

      return { success: true };
    }),

  // Someone (often an observer) who filled a no-show's role can claim it
  // after the fact; the session's instructor must approve before it counts
  // (§4.5). Deliberately doesn't require the claimant to have had any
  // existing booking for this session.
  submitRetrospectiveRoleClaim: protectedProcedure
    .input(z.object({ scheduleId: z.number().int().positive(), role: z.enum(PHASE2_BOOKABLE_ROLES), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [session] = await db
        .select({ id: trainingSchedules.id })
        .from(trainingSchedules)
        .where(eq(trainingSchedules.id, input.scheduleId))
        .limit(1);
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found." });

      await db.insert(retrospectiveRoleClaims).values({
        trainingScheduleId: input.scheduleId,
        claimantUserId: ctx.user.id,
        role: input.role,
        notes: input.notes ?? null,
        status: "pending",
      });

      return { success: true };
    }),

  reviewRetrospectiveRoleClaim: protectedProcedure
    .input(z.object({ claimId: z.number().int().positive(), approve: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [claim] = await db
        .select({
          id: retrospectiveRoleClaims.id,
          status: retrospectiveRoleClaims.status,
          scheduleInstructorId: trainingSchedules.instructorId,
        })
        .from(retrospectiveRoleClaims)
        .innerJoin(trainingSchedules, eq(retrospectiveRoleClaims.trainingScheduleId, trainingSchedules.id))
        .where(eq(retrospectiveRoleClaims.id, input.claimId))
        .limit(1);
      if (!claim) throw new TRPCError({ code: "NOT_FOUND", message: "Claim not found." });
      if (claim.status !== "pending") {
        throw new TRPCError({ code: "CONFLICT", message: `This claim was already ${claim.status}.` });
      }

      const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (claim.scheduleInstructorId !== ctx.user.id && u?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the instructor who ran this session (or an admin) can review this claim." });
      }

      await db
        .update(retrospectiveRoleClaims)
        .set({
          status: input.approve ? "approved" : "rejected",
          reviewedByUserId: ctx.user.id,
          reviewedAt: new Date(),
        })
        .where(eq(retrospectiveRoleClaims.id, input.claimId));

      const claimantUserId = (await db
        .select({ userId: retrospectiveRoleClaims.claimantUserId })
        .from(retrospectiveRoleClaims)
        .where(eq(retrospectiveRoleClaims.id, input.claimId))
        .limit(1))[0]?.userId ?? 0;
      void notifyRetrospectiveClaimReviewed(db, input.claimId, input.approve);
      void refreshIerpPhase2Status(db, claimantUserId);
      if (input.approve && claimantUserId) {
        void ensurePhase2CompletionCertificateForUser(db, claimantUserId).catch((error) => {
          console.error("[courses.reviewRetrospectiveRoleClaim] Universal Phase 2 certificate projection failed:", error);
        });
      }

      return { success: true };
    }),

  // Completion status: 3 team-leader + 6 team-member (1 per named role),
  // counting both instructor-confirmed bookings and approved retrospective
  // claims -- either path counts equally toward completion (§4.5).
  getPhase2CompletionStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return getAuthoritativePhase2CompletionStatus(db, ctx.user.id);
  }),

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
    const subsidisedFee = IERP_TOTAL_FEE_KES;

    // Use the same confirmed named-role source as bookPhase2Role and the
    // dedicated completion procedure. Legacy generic team_member rows do not
    // satisfy the current Phase 2 requirement.
    const phase2 = await getAuthoritativePhase2CompletionStatus(db, ctx.user.id);
    const memberSessions = phase2.teamMemberSessionsTotal;
    const leaderSessions = phase2.teamLeaderCount;
    const phase2Complete = phase2.phase2Complete;

    // Surface the same IERP payment timing used by the booking gate, so the
    // dashboard explains the actual December boundary instead of warning only
    // after an obsolete four-month zero-payment lock.
    const INTERN_DESIGNATIONS = ["noi", "coi_bsc", "coi_diploma", "moi"];
    const isIntern = !!s.designation && INTERN_DESIGNATIONS.includes(s.designation);
    const joinedAt = s.enrollmentDate ?? s.createdAt;
    const paymentAccess = isIntern
      ? await getIerpPaymentAccessForUser(db, ctx.user.id)
      : null;
    const paymentDeadline = paymentAccess?.paymentDeadline ?? null;
    const paymentLockoutActive = paymentAccess?.phase2BookingLocked ?? false;

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
      programIdentity: getProgramIdentity(s.designation),
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
      deferredStartWindow: paymentAccess?.deferredStartWindow ?? false,
      cognitiveAccessLocked: paymentAccess?.cognitiveAccessLocked ?? false,
      phase2BookingLocked: paymentAccess?.phase2BookingLocked ?? false,
      paymentLockoutActive,
    };
  }),
});
