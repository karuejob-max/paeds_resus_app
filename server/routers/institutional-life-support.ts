import { z } from "zod";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  isNotNull,
  lte,
  sql,
} from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { adminProcedure, router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  courses,
  enrollments,
  ilsCredentialRequests,
  institutionalAccounts,
  institutionalStaffMembers,
  institutionalTrainingOrderProviders,
  institutionalTrainingOrders,
  ilsDeliverySessions,
  ilsPracticalAssessments,
  ilsReminderEvents,
  ilsOperationalCases,
  ilsPilotCohorts,
  ilsPilotMetrics,
  payments,
  certificates,
  users,
} from "../../drizzle/schema";
import {
  ensureInstitutionalLifeSupportCatalog,
  getInstitutionalLifeSupportCourseId,
} from "../lib/ensure-institutional-life-support-catalog";
import { assertTrainingWorkspaceOrAdmin } from "../lib/training-workspace-guard";
import { applyInstitutionalLifeSupportPaymentCompletion, applyInstitutionalLifeSupportPaymentFailure } from "../lib/institutional-life-support-payments";
import { calculateEntitlementPrice, consumeGlobalEntitlement, findActiveGlobalEntitlement } from "../lib/global-entitlements";
import { assertInstitutionAccess } from "../lib/institution-access";
import { initiateStkPush, validatePhoneNumber } from "../mpesa";
import { isMpesaConfigured } from "../_core/mpesa";
import {
  getAhaCredentialingPriceKes,
  getAhaFullTrainingPriceKes,
  getCredentialingDeadline,
  PAEDS_RESUS_ILS_AHA_ADD_ON_PRICES_KES,
  PAEDS_RESUS_ILS_AHA_FULL_TRAINING_PRICES_KES,
  PAEDS_RESUS_ILS_BASE_PRICE_KES,
  PAEDS_RESUS_ILS_CREDENTIALING_WINDOW_DAYS,
  PAEDS_RESUS_ILS_DELIVERY_MODEL,
  PAEDS_RESUS_ILS_PROGRAM_TYPE,
  canCancelPendingIlsEnrollment,
  type PaedsResusIlsAhaCredential,
} from "@shared/institutional-life-support";
import {
  canReplaceIlsProvider,
  getIlsAssessmentGovernanceGaps,
  getIlsDeliveryReadinessGaps,
  getIlsSupportSlaHours,
} from "@shared/ils-operations";
import { runScheduledIlsReminders } from "../lib/ils-reminders";

import {
  getCertificateByEnrollmentId,
  issueCertificateForEnrollmentIfEligible,
  signOffPracticalSkills,
} from "../certificates";

const credentialTypeSchema = z.enum(["bls", "acls"]);
const credentialingDeadlineMs =
  PAEDS_RESUS_ILS_CREDENTIALING_WINDOW_DAYS * 24 * 60 * 60 * 1000;

function asCredential(value: string): PaedsResusIlsAhaCredential {
  return value as PaedsResusIlsAhaCredential;
}

function centsFromKes(amountKes: number): number {
  return amountKes * 100;
}

async function getIlsCourse(db: any) {
  await ensureInstitutionalLifeSupportCatalog(db);
  const courseId = await getInstitutionalLifeSupportCourseId(db);
  if (!courseId)
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Institutional Life Support course catalog is not ready.",
    });
  const rows = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  if (!rows[0])
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Institutional Life Support course catalog is not ready.",
    });
  return rows[0];
}

async function getOwnIlsEnrollment(
  db: any,
  userId: number,
  enrollmentId: number
) {
  const rows = await db
    .select()
    .from(enrollments)
    .where(
      and(
        eq(enrollments.id, enrollmentId),
        eq(enrollments.userId, userId),
        eq(enrollments.programType, PAEDS_RESUS_ILS_PROGRAM_TYPE),
        eq(enrollments.enrollmentStatus, "active")
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

async function assertExistingAccount(db: any, userId: number) {
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const user = rows[0];
  if (!user || !user.email || !user.name?.trim()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Every provider must have a saved Paeds Resus account name and email before enrollment.",
    });
  }
  return user;
}

async function getEnrollmentCertificate(db: any, enrollmentId: number) {
  const certificate = await getCertificateByEnrollmentId(enrollmentId);
  if (!certificate?.issueDate) return null;
  return certificate;
}

export const institutionalLifeSupportRouter = router({
  getCatalog: protectedProcedure.query(async ({ ctx }) => {
    assertTrainingWorkspaceOrAdmin(ctx.user);
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });
    const course = await getIlsCourse(db);
    return {
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        duration: course.duration,
        programType: course.programType,
      },
      deliveryModel: PAEDS_RESUS_ILS_DELIVERY_MODEL,
      pricing: {
        providerPriceKes: PAEDS_RESUS_ILS_BASE_PRICE_KES,
        credentialingWindowDays: PAEDS_RESUS_ILS_CREDENTIALING_WINDOW_DAYS,
        ahaAddOnPricesKes: PAEDS_RESUS_ILS_AHA_ADD_ON_PRICES_KES,
        ahaFullTrainingPricesKes: PAEDS_RESUS_ILS_AHA_FULL_TRAINING_PRICES_KES,
        certificateBoundary:
          "Paeds Resus certificate; no AHA certificate is issued by this programme.",
      },
      mpesaConfigured: isMpesaConfigured(),
    };
  }),

  getMyEnrollment: protectedProcedure.query(async ({ ctx }) => {
    assertTrainingWorkspaceOrAdmin(ctx.user);
    const db = await getDb();
    if (!db) return null;
    const course = await getIlsCourse(db);
    const rows = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, ctx.user.id),
          eq(enrollments.programType, PAEDS_RESUS_ILS_PROGRAM_TYPE),
          eq(enrollments.enrollmentStatus, "active")
        )
      )
      .orderBy(desc(enrollments.createdAt))
      .limit(1);
    const enrollment = rows[0];
    if (!enrollment) return null;
    const certificate = await getEnrollmentCertificate(db, enrollment.id);
    const credentialingDeadline = certificate?.issueDate
      ? getCredentialingDeadline(certificate.issueDate)
      : null;
    return {
      ...enrollment,
      courseId: course.id,
      courseTitle: course.title,
      certificateNumber: certificate?.certificateNumber ?? null,
      certificateIssueDate: certificate?.issueDate ?? null,
      credentialingDeadline,
      credentialingWindowOpen:
        !!certificate?.issueDate &&
        Date.now() < credentialingDeadline!.getTime(),
    };
  }),

  getMyCredentialRequests: protectedProcedure.query(async ({ ctx }) => {
    assertTrainingWorkspaceOrAdmin(ctx.user);
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select()
      .from(ilsCredentialRequests)
      .where(eq(ilsCredentialRequests.userId, ctx.user.id))
      .orderBy(desc(ilsCredentialRequests.createdAt));
    return rows.map((row: typeof ilsCredentialRequests.$inferSelect) => ({
      ...row,
      windowOpen: Date.now() < row.credentialingDeadline.getTime(),
    }));
  }),

  cancelPendingEnrollment: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.number().int().positive(),
        reason: z.string().trim().max(255).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const rows = await db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.id, input.enrollmentId),
            eq(enrollments.userId, ctx.user.id),
            eq(enrollments.programType, PAEDS_RESUS_ILS_PROGRAM_TYPE)
          )
        )
        .limit(1);
      const enrollment = rows[0];
      if (!enrollment)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Institutional Life Support enrollment not found.",
        });
      if (enrollment.enrollmentStatus === "cancelled")
        return {
          cancelled: true,
          alreadyCancelled: true,
          enrollmentId: enrollment.id,
        };
      if (
        !canCancelPendingIlsEnrollment({
          enrollmentStatus: enrollment.enrollmentStatus,
          paymentStatus: enrollment.paymentStatus,
          amountPaid: enrollment.amountPaid,
          cognitiveModulesComplete: enrollment.cognitiveModulesComplete,
          practicalSkillsSignedOff: enrollment.practicalSkillsSignedOff,
        })
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Only an unpaid, unstarted Institutional Life Support enrollment can be cancelled here. Contact Paeds Resus support for a paid or started enrollment.",
        });

      await db.transaction(async tx => {
        await tx
          .update(payments)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(
            and(
              eq(payments.enrollmentId, enrollment.id),
              eq(payments.status, "pending")
            )
          );
        await tx
          .update(enrollments)
          .set({
            enrollmentStatus: "cancelled",
            cancelledAt: new Date(),
            cancelledByUserId: ctx.user.id,
            cancellationReason:
              input.reason ||
              "Cancelled by provider before payment or course access.",
            updatedAt: new Date(),
          })
          .where(eq(enrollments.id, enrollment.id));
      });
      return {
        cancelled: true,
        alreadyCancelled: false,
        enrollmentId: enrollment.id,
      };
    }),

  getInstitutionRoster: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const rows = await db
        .select({
          staffMemberId: institutionalStaffMembers.id,
          userId: institutionalStaffMembers.userId,
          staffName: institutionalStaffMembers.staffName,
          staffEmail: institutionalStaffMembers.staffEmail,
          staffRole: institutionalStaffMembers.staffRole,
          enrollmentStatus: institutionalStaffMembers.enrollmentStatus,
        })
        .from(institutionalStaffMembers)
        .where(
          and(
            eq(
              institutionalStaffMembers.institutionalAccountId,
              input.institutionId
            ),
            isNull(institutionalStaffMembers.removedAt)
          )
        );
      const linked = rows.filter(
        (row: (typeof rows)[number]) => row.userId != null
      );
      if (!linked.length) return [];
      const accountRows = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(
          inArray(
            users.id,
            linked.map((row: (typeof linked)[number]) => row.userId!)
          )
        );
      const accounts = new Map(
        accountRows.map((row: (typeof accountRows)[number]) => [row.id, row])
      );
      return linked
        .map((row: (typeof linked)[number]) => ({
          ...row,
          account: accounts.get(row.userId!) ?? null,
        }))
        .filter(
          (row: {
            account: {
              id: number;
              name: string | null;
              email: string | null;
            } | null;
          }) => !!row.account?.name && !!row.account?.email
        );
    }),

  getInstitutionProviderRegister: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      return db
        .select({
          orderId: institutionalTrainingOrders.id,
          orderStatus: institutionalTrainingOrders.orderStatus,
          paymentStatus: institutionalTrainingOrders.paymentStatus,
          paymentReceiptReference:
            institutionalTrainingOrders.paymentReceiptReference,
          trainingDate: institutionalTrainingOrders.trainingDate,
          providerAssignmentId: institutionalTrainingOrderProviders.id,
          assignmentStatus:
            institutionalTrainingOrderProviders.assignmentStatus,
          userId: institutionalTrainingOrderProviders.userId,
          providerName: users.name,
          providerEmail: users.email,
          enrollmentId: institutionalTrainingOrderProviders.enrollmentId,
          activatedAt: enrollments.activatedAt,
          lastActivityAt: enrollments.lastActivityAt,
          cognitiveModulesComplete: enrollments.cognitiveModulesComplete,
          cognitiveModulesCompletedAt: enrollments.cognitiveModulesCompletedAt,
          practicalSkillsSignedOff: enrollments.practicalSkillsSignedOff,
          certificateNumber: certificates.certificateNumber,
          certificateIssueDate: certificates.issueDate,
          certificateExpiryDate: certificates.expiryDate,
        })
        .from(institutionalTrainingOrderProviders)
        .innerJoin(
          institutionalTrainingOrders,
          eq(
            institutionalTrainingOrderProviders.orderId,
            institutionalTrainingOrders.id
          )
        )
        .leftJoin(
          users,
          eq(institutionalTrainingOrderProviders.userId, users.id)
        )
        .leftJoin(
          enrollments,
          eq(institutionalTrainingOrderProviders.enrollmentId, enrollments.id)
        )
        .leftJoin(
          certificates,
          and(
            eq(
              certificates.enrollmentId,
              institutionalTrainingOrderProviders.enrollmentId
            ),
            eq(certificates.programType, "paeds_resus_ils")
          )
        )
        .where(
          eq(
            institutionalTrainingOrders.institutionalAccountId,
            input.institutionId
          )
        )
        .orderBy(desc(institutionalTrainingOrders.id), asc(users.name));
    }),

  getInstitutionOrders: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const orders = await db
        .select()
        .from(institutionalTrainingOrders)
        .where(
          eq(
            institutionalTrainingOrders.institutionalAccountId,
            input.institutionId
          )
        )
        .orderBy(desc(institutionalTrainingOrders.createdAt));
      if (!orders.length) return [];
      const providers = await db
        .select()
        .from(institutionalTrainingOrderProviders)
        .where(
          inArray(
            institutionalTrainingOrderProviders.orderId,
            orders.map((order: (typeof orders)[number]) => order.id)
          )
        );
      return orders.map((order: (typeof orders)[number]) => ({
        ...order,
        providers: providers.filter(
          (provider: (typeof providers)[number]) =>
            provider.orderId === order.id
        ),
      }));
    }),

  replaceInstitutionProvider: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        orderId: z.number().int().positive(),
        providerAssignmentId: z.number().int().positive(),
        replacementStaffMemberId: z.number().int().positive(),
        reason: z.string().trim().min(1).max(255),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const [order] = await db
        .select()
        .from(institutionalTrainingOrders)
        .where(
          and(
            eq(institutionalTrainingOrders.id, input.orderId),
            eq(
              institutionalTrainingOrders.institutionalAccountId,
              input.institutionId
            )
          )
        )
        .limit(1);
      const [session] = await db
        .select()
        .from(ilsDeliverySessions)
        .where(
          and(
            eq(ilsDeliverySessions.id, order?.deliverySessionId ?? 0),
            eq(ilsDeliverySessions.institutionalAccountId, input.institutionId)
          )
        )
        .limit(1);
      const [assignment] = await db
        .select()
        .from(institutionalTrainingOrderProviders)
        .where(
          and(
            eq(
              institutionalTrainingOrderProviders.id,
              input.providerAssignmentId
            ),
            eq(institutionalTrainingOrderProviders.orderId, input.orderId),
            eq(
              institutionalTrainingOrderProviders.institutionalAccountId,
              input.institutionId
            ),
            eq(institutionalTrainingOrderProviders.assignmentStatus, "active")
          )
        )
        .limit(1);
      if (!order || !session || !assignment?.enrollmentId)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Active ILS provider assignment not found.",
        });
      const [oldEnrollment] = await db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.id, assignment.enrollmentId),
            eq(enrollments.programType, PAEDS_RESUS_ILS_PROGRAM_TYPE),
            eq(enrollments.enrollmentStatus, "active")
          )
        )
        .limit(1);
      if (!oldEnrollment)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "The provider enrollment is no longer active.",
        });
      if (
        !canReplaceIlsProvider({
          orderStatus: order.orderStatus,
          sessionStatus: session.sessionStatus,
          cognitiveModulesComplete: oldEnrollment.cognitiveModulesComplete,
          practicalSkillsSignedOff: oldEnrollment.practicalSkillsSignedOff,
          activatedAt: oldEnrollment.activatedAt,
          lastActivityAt: oldEnrollment.lastActivityAt,
        })
      ) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "This provider cannot be replaced after learning or practical delivery has started.",
        });
      }
      const [replacementStaff] = await db
        .select()
        .from(institutionalStaffMembers)
        .where(
          and(
            eq(institutionalStaffMembers.id, input.replacementStaffMemberId),
            eq(
              institutionalStaffMembers.institutionalAccountId,
              input.institutionId
            ),
            isNull(institutionalStaffMembers.removedAt)
          )
        )
        .limit(1);
      if (!replacementStaff?.userId)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Select an active replacement provider with an existing Paeds Resus account.",
        });
      if (replacementStaff.userId === assignment.userId)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "The replacement provider must be different from the provider being replaced.",
        });
      await assertExistingAccount(db, replacementStaff.userId);
      const duplicate = await db
        .select({ id: institutionalTrainingOrderProviders.id })
        .from(institutionalTrainingOrderProviders)
        .where(
          and(
            eq(institutionalTrainingOrderProviders.orderId, input.orderId),
            eq(
              institutionalTrainingOrderProviders.userId,
              replacementStaff.userId
            ),
            eq(institutionalTrainingOrderProviders.assignmentStatus, "active")
          )
        )
        .limit(1);
      if (duplicate[0])
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That provider is already active on this ILS order.",
        });
      const [existingReplacementEnrollment] = await db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.userId, replacementStaff.userId),
            eq(enrollments.programType, PAEDS_RESUS_ILS_PROGRAM_TYPE),
            eq(enrollments.enrollmentStatus, "active")
          )
        )
        .orderBy(desc(enrollments.id))
        .limit(1);
      if (existingReplacementEnrollment)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "That provider already has an active Institutional Life Support enrollment.",
        });
      const course = await getIlsCourse(db);
      const now = new Date();
      await db.transaction(async (tx: any) => {
        await tx
          .update(institutionalTrainingOrderProviders)
          .set({
            assignmentStatus: "replaced",
            replacedAt: now,
            replacedByUserId: ctx.user.id,
            replacementReason: input.reason,
          })
          .where(eq(institutionalTrainingOrderProviders.id, assignment.id));
        await tx
          .update(enrollments)
          .set({
            enrollmentStatus: "cancelled",
            cancelledAt: now,
            cancelledByUserId: ctx.user.id,
            cancellationReason: `Replaced in institution order #${order.id}: ${input.reason}`,
            updatedAt: now,
          })
          .where(eq(enrollments.id, oldEnrollment.id));
        await tx
          .insert(enrollments)
          .values({
            userId: replacementStaff.userId!,
            courseId: course.id,
            programType: PAEDS_RESUS_ILS_PROGRAM_TYPE,
            trainingDate: order.trainingDate,
            paymentStatus:
              order.paymentStatus === "completed" ? "completed" : "pending",
            amountPaid:
              order.paymentStatus === "completed"
                ? PAEDS_RESUS_ILS_BASE_PRICE_KES * 100
                : 0,
            activatedAt: order.paymentStatus === "completed" ? now : null,
            lastActivityAt: order.paymentStatus === "completed" ? now : null,
            cognitiveModulesComplete: false,
            practicalSkillsSignedOff: false,
          });
        const [newEnrollment] = await tx
          .select({ id: enrollments.id })
          .from(enrollments)
          .where(
            and(
              eq(enrollments.userId, replacementStaff.userId!),
              eq(enrollments.programType, PAEDS_RESUS_ILS_PROGRAM_TYPE),
              eq(enrollments.enrollmentStatus, "active")
            )
          )
          .orderBy(desc(enrollments.id))
          .limit(1);
        if (!newEnrollment)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not create the replacement provider enrollment.",
          });
        await tx
          .insert(institutionalTrainingOrderProviders)
          .values({
            orderId: order.id,
            institutionalAccountId: input.institutionId,
            staffMemberId: replacementStaff.id,
            userId: replacementStaff.userId!,
            enrollmentId: newEnrollment.id,
            assignmentStatus: "active",
          });
        await tx
          .insert(ilsOperationalCases)
          .values({
            institutionalAccountId: input.institutionId,
            orderId: order.id,
            enrollmentId: newEnrollment.id,
            category: "roster",
            priority: "high",
            summary: "ILS provider replaced on cohort order",
            details: input.reason,
            slaDueAt: new Date(
              now.getTime() + getIlsSupportSlaHours("high") * 60 * 60 * 1000
            ),
            createdByUserId: ctx.user.id,
          });
      });
      return {
        success: true,
        orderId: order.id,
        replacedAssignmentId: assignment.id,
        replacementStaffMemberId: replacementStaff.id,
      };
    }),

  listAssignableInstructors: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      return db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          instructorNumber: users.instructorNumber,
          instructorTier: users.instructorTier,
        })
        .from(users)
        .where(
          and(
            isNotNull(users.instructorApprovedAt),
            isNotNull(users.instructorCertifiedAt),
            isNotNull(users.instructorNumber)
          )
        )
        .orderBy(asc(users.name));
    }),

  getMyAssessmentRoster: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    assertTrainingWorkspaceOrAdmin(ctx.user);
    const instructorRows = await db
      .select({
        approvedAt: users.instructorApprovedAt,
        certifiedAt: users.instructorCertifiedAt,
        number: users.instructorNumber,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    const instructor = instructorRows[0];
    if (
      !instructor?.approvedAt ||
      !instructor.certifiedAt ||
      !instructor.number
    )
      return [];
    const sessions = await db
      .select()
      .from(ilsDeliverySessions)
      .where(
        and(
          eq(ilsDeliverySessions.instructorId, ctx.user.id),
          inArray(ilsDeliverySessions.sessionStatus, [
            "confirmed",
            "in_progress",
            "completed",
          ])
        )
      )
      .orderBy(asc(ilsDeliverySessions.scheduledDate));
    if (!sessions.length) return [];
    const orders = await db
      .select()
      .from(institutionalTrainingOrders)
      .where(
        inArray(
          institutionalTrainingOrders.deliverySessionId,
          sessions.map(session => session.id)
        )
      );
    const orderIds = orders.map(order => order.id);
    const providers = orderIds.length
      ? await db
          .select()
          .from(institutionalTrainingOrderProviders)
          .where(inArray(institutionalTrainingOrderProviders.orderId, orderIds))
      : [];
    const enrollmentIds = providers
      .map(provider => provider.enrollmentId)
      .filter((id: number | null): id is number => id != null);
    const learnerRows = enrollmentIds.length
      ? await db
          .select()
          .from(enrollments)
          .where(inArray(enrollments.id, enrollmentIds))
      : [];
    const learnerIds = learnerRows.map(row => row.userId);
    const learnerUsers = learnerIds.length
      ? await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(inArray(users.id, learnerIds))
      : [];
    const assessments = enrollmentIds.length
      ? await db
          .select()
          .from(ilsPracticalAssessments)
          .where(inArray(ilsPracticalAssessments.enrollmentId, enrollmentIds))
          .orderBy(desc(ilsPracticalAssessments.createdAt))
      : [];
    return sessions.map(session => {
      const order = orders.find(
        candidate => candidate.deliverySessionId === session.id
      );
      const participantRows = providers
        .filter(provider => provider.orderId === order?.id)
        .map(provider => {
          const learner = learnerRows.find(
            row => row.id === provider.enrollmentId
          );
          const account = learnerUsers.find(
            user => user.id === learner?.userId
          );
          const latestAssessment = assessments.find(
            assessment => assessment.enrollmentId === provider.enrollmentId
          );
          return {
            enrollmentId: provider.enrollmentId,
            staffMemberId: provider.staffMemberId,
            userId: provider.userId,
            name: account?.name ?? null,
            email: account?.email ?? null,
            paymentStatus: learner?.paymentStatus ?? null,
            cognitiveModulesComplete:
              learner?.cognitiveModulesComplete ?? false,
            latestAssessment: latestAssessment ?? null,
          };
        });
      return {
        ...session,
        orderId: order?.id ?? null,
        participants: participantRows,
      };
    });
  }),

  listDeliverySessions: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      return db
        .select()
        .from(ilsDeliverySessions)
        .where(
          eq(ilsDeliverySessions.institutionalAccountId, input.institutionId)
        )
        .orderBy(asc(ilsDeliverySessions.scheduledDate));
    }),

  createDeliverySession: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        scheduledDate: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        startTime: z.string().trim().max(10).optional(),
        endTime: z.string().trim().max(10).optional(),
        location: z
          .string()
          .trim()
          .min(1, "Enter the practical venue or location.")
          .max(255),
        instructorUserId: z.number().int().positive(),
        maxCapacity: z.number().int().min(1).max(200),
        readinessNotes: z.string().trim().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      if (input.scheduledDate.getTime() < Date.now())
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Choose a future practical-assessment date.",
        });
      if (input.endDate && input.endDate < input.scheduledDate)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The session end date must be on or after the start date.",
        });

      let instructorName: string | null = null;
      let instructorConfirmed = false;
      if (input.instructorUserId != null) {
        const rows = await db
          .select({
            id: users.id,
            name: users.name,
            instructorApprovedAt: users.instructorApprovedAt,
            instructorCertifiedAt: users.instructorCertifiedAt,
            instructorNumber: users.instructorNumber,
          })
          .from(users)
          .where(eq(users.id, input.instructorUserId))
          .limit(1);
        const instructor = rows[0];
        if (
          !instructor ||
          !instructor.instructorApprovedAt ||
          !instructor.instructorCertifiedAt ||
          !instructor.instructorNumber
        )
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Select an approved and certified Paeds Resus instructor.",
          });
        instructorName = instructor.name?.trim() || null;
        instructorConfirmed = true;
      }

      await db.insert(ilsDeliverySessions).values({
        institutionalAccountId: input.institutionId,
        sessionStatus: "proposed",
        scheduledDate: input.scheduledDate,
        endDate: input.endDate ?? null,
        startTime: input.startTime || null,
        endTime: input.endTime || null,
        location: input.location || null,
        instructorId: input.instructorUserId ?? null,
        instructorName,
        maxCapacity: input.maxCapacity,
        reservedCount: 0,
        venueConfirmed: false,
        equipmentConfirmed: false,
        instructorConfirmed,
        practicalDateConfirmed: true,
        readinessNotes: input.readinessNotes || null,
        createdByUserId: ctx.user.id,
      });
      const rows = await db
        .select()
        .from(ilsDeliverySessions)
        .where(
          eq(ilsDeliverySessions.institutionalAccountId, input.institutionId)
        )
        .orderBy(desc(ilsDeliverySessions.id))
        .limit(1);
      return rows[0] ?? null;
    }),

  confirmDeliverySession: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        sessionId: z.number().int().positive(),
        venueConfirmed: z.boolean(),
        equipmentConfirmed: z.boolean(),
        practicalDateConfirmed: z.boolean(),
        readinessNotes: z.string().trim().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const rows = await db
        .select()
        .from(ilsDeliverySessions)
        .where(
          and(
            eq(ilsDeliverySessions.id, input.sessionId),
            eq(ilsDeliverySessions.institutionalAccountId, input.institutionId)
          )
        )
        .limit(1);
      const session = rows[0];
      if (!session)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ILS delivery session not found.",
        });
      if (session.sessionStatus === "cancelled")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cancelled delivery sessions cannot be confirmed.",
        });
      const ready =
        session.instructorConfirmed &&
        input.venueConfirmed &&
        input.equipmentConfirmed &&
        input.practicalDateConfirmed;
      await db
        .update(ilsDeliverySessions)
        .set({
          venueConfirmed: input.venueConfirmed,
          equipmentConfirmed: input.equipmentConfirmed,
          practicalDateConfirmed: input.practicalDateConfirmed,
          sessionStatus: ready ? "confirmed" : "proposed",
          readinessNotes: input.readinessNotes || session.readinessNotes,
          confirmedAt: ready ? new Date() : null,
          confirmedByUserId: ready ? ctx.user.id : null,
          updatedAt: new Date(),
        })
        .where(eq(ilsDeliverySessions.id, session.id));
      return {
        sessionId: session.id,
        ready,
        message: ready
          ? "Delivery session confirmed."
          : "Delivery session remains incomplete until all delivery requirements are confirmed.",
      };
    }),

  confirmInstitutionOrderReadiness: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        orderId: z.number().int().positive(),
        sessionId: z.number().int().positive(),
        claimsAcknowledged: z.literal(true),
        rosterConfirmed: z.literal(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const [order] = await db
        .select()
        .from(institutionalTrainingOrders)
        .where(
          and(
            eq(institutionalTrainingOrders.id, input.orderId),
            eq(
              institutionalTrainingOrders.institutionalAccountId,
              input.institutionId
            )
          )
        )
        .limit(1);
      const [session] = await db
        .select()
        .from(ilsDeliverySessions)
        .where(
          and(
            eq(ilsDeliverySessions.id, input.sessionId),
            eq(ilsDeliverySessions.institutionalAccountId, input.institutionId)
          )
        )
        .limit(1);
      if (!order || !session)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ILS order or delivery session not found.",
        });
      const capacityConfirmed =
        session.reservedCount + order.providerCount <= session.maxCapacity;
      const gaps = getIlsDeliveryReadinessGaps({
        providerCount: order.providerCount,
        paymentStatus: order.paymentStatus,
        deliverySessionStatus: session.sessionStatus,
        capacityConfirmed,
        instructorConfirmed: session.instructorConfirmed,
        venueConfirmed: session.venueConfirmed,
        equipmentConfirmed: session.equipmentConfirmed,
        claimsAcknowledged: input.claimsAcknowledged,
        rosterConfirmed: input.rosterConfirmed,
        practicalDateConfirmed: session.practicalDateConfirmed,
      });
      const paymentOnly = gaps.filter(gap => gap !== "payment confirmation");
      if (paymentOnly.length) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `The cohort is not ready for payment. Confirm: ${paymentOnly.join(", ")}.`,
        });
      }
      await db
        .update(institutionalTrainingOrders)
        .set({
          orderStatus:
            order.paymentStatus === "completed" ? "paid" : "ready_for_payment",
          coordinatorUserId: ctx.user.id,
          deliverySessionId: session.id,
          capacityConfirmed,
          instructorConfirmed: session.instructorConfirmed,
          venueConfirmed: session.venueConfirmed,
          equipmentConfirmed: session.equipmentConfirmed,
          practicalDateConfirmed: session.practicalDateConfirmed,
          claimsAcknowledged: true,
          rosterConfirmed: true,
          readinessConfirmedAt: new Date(),
          readinessConfirmedByUserId: ctx.user.id,
          updatedAt: new Date(),
        })
        .where(eq(institutionalTrainingOrders.id, order.id));
      await db
        .update(ilsDeliverySessions)
        .set({
          orderId: order.id,
          reservedCount: order.providerCount,
          updatedAt: new Date(),
        })
        .where(eq(ilsDeliverySessions.id, session.id));
      return {
        orderId: order.id,
        sessionId: session.id,
        readyForPayment: order.paymentStatus !== "completed",
        gaps: [] as string[],
      };
    }),

  recordPracticalAssessment: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        enrollmentId: z.number().int().positive(),
        deliverySessionId: z.number().int().positive(),
        result: z.enum([
          "pending",
          "pass",
          "remediation_required",
          "fail",
          "no_show",
          "cancelled",
        ]),
        score: z.number().int().min(0).max(100).optional(),
        evidence: z.record(z.string(), z.string()).optional(),
        checklistVersion: z.string().trim().min(1).max(64).default("ils-v1"),
        assessorCalibrationConfirmed: z.boolean(),
        secondAssessorUserId: z.number().int().positive().optional(),
        remediationDueAt: z.coerce.date().optional(),
        notes: z.string().trim().max(4000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const [session] = await db
        .select()
        .from(ilsDeliverySessions)
        .where(
          and(
            eq(ilsDeliverySessions.id, input.deliverySessionId),
            eq(ilsDeliverySessions.institutionalAccountId, input.institutionId)
          )
        )
        .limit(1);
      if (!session)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ILS delivery session not found.",
        });
      const governanceGaps = getIlsAssessmentGovernanceGaps({
        result: input.result,
        checklistVersion: input.checklistVersion,
        assessorCalibrationConfirmed: input.assessorCalibrationConfirmed,
        hasSecondAssessor: input.secondAssessorUserId != null,
      });
      if (governanceGaps.length)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Assessment governance incomplete. Confirm: ${governanceGaps.join(", ")}.`,
        });
      if (input.secondAssessorUserId === ctx.user.id)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The second assessor must be a different approved assessor.",
        });
      if (session.instructorId !== ctx.user.id && ctx.user.role !== "admin")
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Only the assigned ILS instructor or a platform admin can record this assessment.",
        });
      const [assessor] = await db
        .select({
          name: users.name,
          instructorApprovedAt: users.instructorApprovedAt,
          instructorCertifiedAt: users.instructorCertifiedAt,
          instructorNumber: users.instructorNumber,
        })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      if (
        ctx.user.role !== "admin" &&
        (!assessor?.instructorApprovedAt ||
          !assessor.instructorCertifiedAt ||
          !assessor.instructorNumber)
      )
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Only an approved and certified Paeds Resus instructor can record an ILS practical assessment.",
        });
      if (input.secondAssessorUserId) {
        const [secondAssessor] = await db
          .select({
            instructorApprovedAt: users.instructorApprovedAt,
            instructorCertifiedAt: users.instructorCertifiedAt,
            instructorNumber: users.instructorNumber,
          })
          .from(users)
          .where(eq(users.id, input.secondAssessorUserId))
          .limit(1);
        if (
          !secondAssessor?.instructorApprovedAt ||
          !secondAssessor.instructorCertifiedAt ||
          !secondAssessor.instructorNumber
        )
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "The second assessor must be an approved and certified Paeds Resus instructor.",
          });
      }
      const [enrollment] = await db
        .select()
        .from(enrollments)
        .innerJoin(
          institutionalTrainingOrderProviders,
          eq(institutionalTrainingOrderProviders.enrollmentId, enrollments.id)
        )
        .where(
          and(
            eq(enrollments.id, input.enrollmentId),
            eq(enrollments.programType, PAEDS_RESUS_ILS_PROGRAM_TYPE),
            eq(
              institutionalTrainingOrderProviders.institutionalAccountId,
              input.institutionId
            ),
            eq(enrollments.enrollmentStatus, "active")
          )
        )
        .limit(1);
      if (!enrollment)
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Active ILS provider enrollment not found for this institution.",
        });
      const enrollmentRow = enrollment.enrollments;
      await db.insert(ilsPracticalAssessments).values({
        enrollmentId: enrollmentRow.id,
        deliverySessionId: input.deliverySessionId,
        assessorUserId: ctx.user.id,
        checklistVersion: input.checklistVersion,
        assessorCalibrationConfirmed: input.assessorCalibrationConfirmed,
        secondAssessorUserId: input.secondAssessorUserId ?? null,
        assessedAt: input.result === "pending" ? null : new Date(),
        result: input.result,
        score: input.score ?? null,
        evidenceJson: input.evidence ?? null,
        remediationDueAt: input.remediationDueAt ?? null,
        notes: input.notes || null,
      });
      const assessmentNow = new Date();
      await db
        .update(enrollments)
        .set({ lastActivityAt: assessmentNow, updatedAt: assessmentNow })
        .where(eq(enrollments.id, enrollmentRow.id));
      if (input.result === "remediation_required") {
        const reminderRows = await db
          .select({ id: ilsReminderEvents.id })
          .from(ilsReminderEvents)
          .where(
            and(
              eq(ilsReminderEvents.enrollmentId, enrollmentRow.id),
              eq(ilsReminderEvents.userId, enrollmentRow.userId),
              eq(ilsReminderEvents.reminderType, "remediation"),
              eq(ilsReminderEvents.channel, "email")
            )
          )
          .limit(1);
        if (!reminderRows[0]) {
          await db
            .insert(ilsReminderEvents)
            .values({
              enrollmentId: enrollmentRow.id,
              userId: enrollmentRow.userId,
              reminderType: "remediation",
              channel: "email",
              dueAt: input.remediationDueAt ?? assessmentNow,
              status: "queued",
            });
        }
        await db
          .insert(ilsOperationalCases)
          .values({
            institutionalAccountId: input.institutionId,
            enrollmentId: enrollmentRow.id,
            category: "assessment",
            priority: "high",
            summary: "ILS practical remediation required",
            details:
              input.notes ||
              "The assessor recorded a remediation-required result.",
            createdByUserId: ctx.user.id,
          });
      } else if (["fail", "no_show"].includes(input.result)) {
        await db
          .insert(ilsOperationalCases)
          .values({
            institutionalAccountId: input.institutionId,
            enrollmentId: enrollmentRow.id,
            category: "assessment",
            priority: "normal",
            summary: `ILS practical assessment ${input.result.replace("_", " ")}`,
            details:
              input.notes || "Follow up with the institution coordinator.",
            createdByUserId: ctx.user.id,
          });
      }
      let certificateIssued = false;
      if (input.result === "pass") {
        const signoff = await signOffPracticalSkills(
          enrollmentRow.id,
          ctx.user.id,
          assessor?.name || "ILS instructor"
        );
        if (!signoff.success)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              signoff.error || "The practical sign-off could not be recorded.",
          });
        certificateIssued = Boolean(signoff.certificateIssued);
      }
      if (input.result !== "pending") {
        await db
          .update(ilsDeliverySessions)
          .set({ sessionStatus: "in_progress", updatedAt: assessmentNow })
          .where(
            and(
              eq(ilsDeliverySessions.id, session.id),
              eq(ilsDeliverySessions.sessionStatus, "confirmed")
            )
          );
        await db
          .update(institutionalTrainingOrders)
          .set({ orderStatus: "in_delivery", updatedAt: assessmentNow })
          .where(
            and(
              eq(institutionalTrainingOrders.deliverySessionId, session.id),
              inArray(institutionalTrainingOrders.orderStatus, [
                "paid",
                "ready_for_payment",
              ])
            )
          );
        const [orderForSession] = await db
          .select({ id: institutionalTrainingOrders.id })
          .from(institutionalTrainingOrders)
          .where(eq(institutionalTrainingOrders.deliverySessionId, session.id))
          .limit(1);
        if (orderForSession) {
          const orderAssignments = await db
            .select({
              enrollmentId: institutionalTrainingOrderProviders.enrollmentId,
            })
            .from(institutionalTrainingOrderProviders)
            .where(
              and(
                eq(
                  institutionalTrainingOrderProviders.orderId,
                  orderForSession.id
                ),
                eq(
                  institutionalTrainingOrderProviders.assignmentStatus,
                  "active"
                )
              )
            );
          const orderEnrollmentIds = orderAssignments
            .map(row => row.enrollmentId)
            .filter((id: number | null): id is number => id != null);
          const orderEnrollments = orderEnrollmentIds.length
            ? await db
                .select({
                  cognitiveModulesComplete:
                    enrollments.cognitiveModulesComplete,
                  practicalSkillsSignedOff:
                    enrollments.practicalSkillsSignedOff,
                })
                .from(enrollments)
                .where(inArray(enrollments.id, orderEnrollmentIds))
            : [];
          if (
            orderEnrollmentIds.length > 0 &&
            orderEnrollments.length === orderEnrollmentIds.length &&
            orderEnrollments.every(
              row =>
                row.cognitiveModulesComplete && row.practicalSkillsSignedOff
            )
          ) {
            await db
              .update(institutionalTrainingOrders)
              .set({ orderStatus: "completed", updatedAt: assessmentNow })
              .where(eq(institutionalTrainingOrders.id, orderForSession.id));
            await db
              .update(ilsDeliverySessions)
              .set({ sessionStatus: "completed", updatedAt: assessmentNow })
              .where(eq(ilsDeliverySessions.id, session.id));
          }
        }
      }
      return {
        success: true,
        result: input.result,
        enrollmentId: enrollmentRow.id,
        certificateIssued,
      };
    }),

  getInstitutionIlsMetrics: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const orders = await db
        .select()
        .from(institutionalTrainingOrders)
        .where(
          eq(
            institutionalTrainingOrders.institutionalAccountId,
            input.institutionId
          )
        );
      const orderIds = orders.map(order => order.id);
      const providers = orderIds.length
        ? await db
            .select()
            .from(institutionalTrainingOrderProviders)
            .where(
              and(
                inArray(institutionalTrainingOrderProviders.orderId, orderIds),
                eq(
                  institutionalTrainingOrderProviders.assignmentStatus,
                  "active"
                )
              )
            )
        : [];
      const enrollmentIds = Array.from(
        new Set(
          providers
            .map(provider => provider.enrollmentId)
            .filter((id): id is number => id != null)
        )
      );
      const learnerRows = enrollmentIds.length
        ? await db
            .select()
            .from(enrollments)
            .where(inArray(enrollments.id, enrollmentIds))
        : [];
      const assessments = enrollmentIds.length
        ? await db
            .select()
            .from(ilsPracticalAssessments)
            .where(inArray(ilsPracticalAssessments.enrollmentId, enrollmentIds))
            .orderBy(desc(ilsPracticalAssessments.createdAt))
        : [];
      const latestAssessmentByEnrollment = new Map<
        number,
        (typeof assessments)[number]
      >();
      for (const assessment of assessments) {
        if (!latestAssessmentByEnrollment.has(assessment.enrollmentId))
          latestAssessmentByEnrollment.set(assessment.enrollmentId, assessment);
      }
      const latestAssessments = Array.from(
        latestAssessmentByEnrollment.values()
      );
      const firstAssessmentByEnrollment = new Map<
        number,
        (typeof assessments)[number]
      >();
      for (const assessment of [...assessments].reverse()) {
        if (!firstAssessmentByEnrollment.has(assessment.enrollmentId))
          firstAssessmentByEnrollment.set(assessment.enrollmentId, assessment);
      }
      const orderById = new Map(orders.map(order => [order.id, order]));
      const paymentConfirmedAtByEnrollment = new Map<number, Date>();
      for (const provider of providers) {
        const order = orderById.get(provider.orderId);
        if (
          provider.assignmentStatus === "active" &&
          provider.enrollmentId &&
          order?.paymentStatus === "completed"
        ) {
          paymentConfirmedAtByEnrollment.set(
            provider.enrollmentId,
            order.paymentConfirmedAt ?? order.createdAt
          );
        }
      }
      const percent = (count: number, total: number) =>
        total ? Math.round((count / total) * 10000) / 100 : 0;
      const paidLearners = learnerRows.filter(row =>
        paymentConfirmedAtByEnrollment.has(row.id)
      );
      const withinDays = (
        from: Date | null | undefined,
        to: Date | null | undefined,
        days: number
      ) =>
        Boolean(
          from &&
            to &&
            to.getTime() - from.getTime() <= days * 24 * 60 * 60 * 1000 &&
            to.getTime() >= from.getTime()
        );
      const activatedPaidCount = paidLearners.filter(
        row => row.activatedAt != null
      ).length;
      const activationWithin7dCount = paidLearners.filter(row =>
        withinDays(
          paymentConfirmedAtByEnrollment.get(row.id),
          row.activatedAt,
          7
        )
      ).length;
      const cognitiveWithin30dCount = paidLearners.filter(row =>
        withinDays(
          paymentConfirmedAtByEnrollment.get(row.id),
          row.cognitiveModulesCompletedAt,
          30
        )
      ).length;
      const assessmentByEnrollment = new Map(
        latestAssessments.map(assessment => [
          assessment.enrollmentId,
          assessment,
        ])
      );
      const practicalOpportunityWithin14dCount = paidLearners.filter(row =>
        withinDays(
          paymentConfirmedAtByEnrollment.get(row.id),
          firstAssessmentByEnrollment.get(row.id)?.createdAt,
          14
        )
      ).length;
      const assessedLearners = paidLearners.filter(row =>
        assessmentByEnrollment.has(row.id)
      );
      const practicalPassCount = assessedLearners.filter(
        row => assessmentByEnrollment.get(row.id)?.result === "pass"
      ).length;
      const certificateRows = enrollmentIds.length
        ? await db
            .select({ enrollmentId: certificates.enrollmentId })
            .from(certificates)
            .where(
              and(
                inArray(certificates.enrollmentId, enrollmentIds),
                eq(certificates.programType, "paeds_resus_ils")
              )
            )
        : [];
      const certificateEnrollmentIds = new Set(
        certificateRows.map(row => row.enrollmentId)
      );
      const sessions = await db
        .select()
        .from(ilsDeliverySessions)
        .where(
          eq(ilsDeliverySessions.institutionalAccountId, input.institutionId)
        );
      const openCases = await db
        .select()
        .from(ilsOperationalCases)
        .where(
          and(
            eq(ilsOperationalCases.institutionalAccountId, input.institutionId),
            inArray(ilsOperationalCases.status, ["open", "in_progress"])
          )
        );
      const now = new Date();
      return {
        orderCount: orders.length,
        paidOrderCount: orders.filter(
          order => order.paymentStatus === "completed"
        ).length,
        providerCount: enrollmentIds.length,
        paidProviderCount: paidLearners.length,
        paymentToAccessSuccessPercent: percent(
          activatedPaidCount,
          paidLearners.length
        ),
        activatedProviderCount: activatedPaidCount,
        activationWithin7dPercent: percent(
          activationWithin7dCount,
          paidLearners.length
        ),
        cognitiveCompletedCount: paidLearners.filter(
          row => row.cognitiveModulesComplete
        ).length,
        cognitiveWithin30dPercent: percent(
          cognitiveWithin30dCount,
          paidLearners.length
        ),
        practicalOpportunityWithin14dPercent: percent(
          practicalOpportunityWithin14dCount,
          paidLearners.length
        ),
        practicalPassedCount: practicalPassCount,
        practicalPassPercent: percent(
          practicalPassCount,
          assessedLearners.length
        ),
        remediationCount: latestAssessments.filter(
          row => row.result === "remediation_required"
        ).length,
        certificateCount: paidLearners.filter(row =>
          certificateEnrollmentIds.has(row.id)
        ).length,
        confirmedSessionCount: sessions.filter(
          session => session.sessionStatus === "confirmed"
        ).length,
        openCaseCount: openCases.length,
        overdueCaseCount: openCases.filter(
          item => item.slaDueAt && item.slaDueAt.getTime() < now.getTime()
        ).length,
      };
    }),

  createOperationalCase: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        orderId: z.number().int().positive().optional(),
        enrollmentId: z.number().int().positive().optional(),
        category: z.enum([
          "payment",
          "roster",
          "access",
          "delivery",
          "assessment",
          "certificate",
          "aha_credentialing",
          "support",
        ]),
        priority: z
          .enum(["low", "normal", "high", "critical"])
          .default("normal"),
        summary: z.string().trim().min(1).max(255),
        details: z.string().trim().max(4000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const slaDueAt = new Date(
        Date.now() + getIlsSupportSlaHours(input.priority) * 60 * 60 * 1000
      );
      await db
        .insert(ilsOperationalCases)
        .values({
          institutionalAccountId: input.institutionId,
          orderId: input.orderId ?? null,
          enrollmentId: input.enrollmentId ?? null,
          category: input.category,
          priority: input.priority,
          summary: input.summary,
          details: input.details || null,
          slaDueAt,
          createdByUserId: ctx.user.id,
        });
      const rows = await db
        .select()
        .from(ilsOperationalCases)
        .where(
          eq(ilsOperationalCases.institutionalAccountId, input.institutionId)
        )
        .orderBy(desc(ilsOperationalCases.id))
        .limit(1);
      return rows[0] ?? null;
    }),

  listOperationalCases: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        status: z
          .enum(["open", "in_progress", "resolved", "closed"])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      return db
        .select()
        .from(ilsOperationalCases)
        .where(
          and(
            eq(ilsOperationalCases.institutionalAccountId, input.institutionId),
            input.status
              ? eq(ilsOperationalCases.status, input.status)
              : undefined
          )
        )
        .orderBy(desc(ilsOperationalCases.createdAt));
    }),

  createPilotCohort: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        segment: z.enum(["training_provider", "faith_based_hospital"]),
        name: z.string().trim().min(1).max(255),
        targetProviderCount: z.number().int().min(1).max(200),
        minimumProviderCount: z.number().int().min(1).max(200).default(1),
        targetStartDate: z.coerce.date(),
        clinicalOwnerUserId: z.number().int().positive(),
        notes: z.string().trim().max(4000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      if (input.minimumProviderCount > input.targetProviderCount)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The minimum pilot cohort cannot exceed the target cohort.",
        });
      const [clinicalOwner] = await db
        .select({
          instructorApprovedAt: users.instructorApprovedAt,
          instructorCertifiedAt: users.instructorCertifiedAt,
          instructorNumber: users.instructorNumber,
        })
        .from(users)
        .where(eq(users.id, input.clinicalOwnerUserId))
        .limit(1);
      if (
        !clinicalOwner?.instructorApprovedAt ||
        !clinicalOwner.instructorCertifiedAt ||
        !clinicalOwner.instructorNumber
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Select an approved and certified Paeds Resus instructor as the clinical owner.",
        });
      await db
        .insert(ilsPilotCohorts)
        .values({
          institutionalAccountId: input.institutionId,
          segment: input.segment,
          name: input.name,
          targetProviderCount: input.targetProviderCount,
          minimumProviderCount: input.minimumProviderCount,
          targetStartDate: input.targetStartDate,
          clinicalOwnerUserId: input.clinicalOwnerUserId,
          operationalOwnerUserId: ctx.user.id,
          coordinatorUserId: ctx.user.id,
          notes: input.notes || null,
        });
      const rows = await db
        .select()
        .from(ilsPilotCohorts)
        .where(eq(ilsPilotCohorts.institutionalAccountId, input.institutionId))
        .orderBy(desc(ilsPilotCohorts.id))
        .limit(1);
      return rows[0] ?? null;
    }),

  listPilotCohorts: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      return db
        .select()
        .from(ilsPilotCohorts)
        .where(eq(ilsPilotCohorts.institutionalAccountId, input.institutionId))
        .orderBy(desc(ilsPilotCohorts.createdAt));
    }),

  createInstitutionOrder: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        staffMemberIds: z.array(z.number().int().positive()).min(1).max(200),
        trainingDate: z.coerce.date(),
        deliverySessionId: z.number().int().positive(),
        claimsAcknowledged: z.literal(true),
        rosterConfirmed: z.literal(true),
        phoneNumber: z.string().min(1).max(32),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      if (!validatePhoneNumber(input.phoneNumber))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Enter a valid M-Pesa phone number for the institution training payment.",
        });
      if (input.trainingDate.getTime() < Date.now())
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Choose a future ILS training date.",
        });
      const [deliverySession] = await db
        .select()
        .from(ilsDeliverySessions)
        .where(
          and(
            eq(ilsDeliverySessions.id, input.deliverySessionId),
            eq(ilsDeliverySessions.institutionalAccountId, input.institutionId)
          )
        )
        .limit(1);
      if (!deliverySession)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Select a valid ILS delivery session.",
        });
      if (deliverySession.sessionStatus !== "confirmed")
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "The delivery session must be confirmed before the institution can pay.",
        });
      const course = await getIlsCourse(db);
      const staffRows = await db
        .select()
        .from(institutionalStaffMembers)
        .where(
          and(
            eq(
              institutionalStaffMembers.institutionalAccountId,
              input.institutionId
            ),
            inArray(institutionalStaffMembers.id, input.staffMemberIds),
            isNull(institutionalStaffMembers.removedAt)
          )
        );
      if (staffRows.length !== input.staffMemberIds.length)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "One or more selected providers are not active members of this institution.",
        });
      const selected = staffRows.filter(
        (staff: (typeof staffRows)[number]) => staff.userId != null
      );
      if (selected.length !== staffRows.length)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Every selected provider must be linked to an existing Paeds Resus account before enrollment.",
        });
      const userIds = selected.map(
        (staff: (typeof selected)[number]) => staff.userId!
      );
      if (new Set(userIds).size !== userIds.length)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Each selected provider must be a distinct Paeds Resus account.",
        });
      for (const userId of userIds) await assertExistingAccount(db, userId);
      const providerCount = selected.length;
      const originalTotalAmountKes = providerCount * PAEDS_RESUS_ILS_BASE_PRICE_KES;
      const institutionEntitlement = await findActiveGlobalEntitlement(db, { programType: "paeds_resus_ils", institutionalAccountId: input.institutionId });
      const entitlementPrice = institutionEntitlement ? calculateEntitlementPrice(originalTotalAmountKes, institutionEntitlement.benefitType, institutionEntitlement.discountPercent) : null;
      const totalAmountKes = entitlementPrice?.effectiveAmountKes ?? originalTotalAmountKes;
      const reservation = await db
        .update(ilsDeliverySessions)
        .set({
          reservedCount: sql`${ilsDeliverySessions.reservedCount} + ${providerCount}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(ilsDeliverySessions.id, deliverySession.id),
            eq(ilsDeliverySessions.sessionStatus, "confirmed"),
            sql`${ilsDeliverySessions.reservedCount} + ${providerCount} <= ${ilsDeliverySessions.maxCapacity}`
          )
        );
      if (
        !Number(
          (reservation as any)?.[0]?.affectedRows ??
            (reservation as any)?.affectedRows ??
            0
        )
      )
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "The selected delivery session does not have enough confirmed capacity for this roster.",
        });
      await db.insert(institutionalTrainingOrders).values({
        institutionalAccountId: input.institutionId,
        programType: PAEDS_RESUS_ILS_PROGRAM_TYPE,
        providerCount,
        amountPerProviderKes: totalAmountKes === 0 ? 0 : Math.ceil(totalAmountKes / providerCount),
        totalAmountKes,
        originalTotalAmountKes,
        entitlementId: institutionEntitlement?.id ?? null,
        trainingDate: input.trainingDate,
        paymentStatus: "pending",
        orderStatus: "payment_pending",
        coordinatorUserId: ctx.user.id,
        deliverySessionId: deliverySession.id,
        capacityConfirmed: true,
        instructorConfirmed: deliverySession.instructorConfirmed,
        venueConfirmed: deliverySession.venueConfirmed,
        equipmentConfirmed: deliverySession.equipmentConfirmed,
        practicalDateConfirmed: deliverySession.practicalDateConfirmed,
        claimsAcknowledged: input.claimsAcknowledged,
        rosterConfirmed: input.rosterConfirmed,
        readinessConfirmedAt: new Date(),
        readinessConfirmedByUserId: ctx.user.id,
        createdByUserId: ctx.user.id,
      });
      const orderRows = await db
        .select({ id: institutionalTrainingOrders.id })
        .from(institutionalTrainingOrders)
        .where(
          and(
            eq(
              institutionalTrainingOrders.institutionalAccountId,
              input.institutionId
            ),
            eq(institutionalTrainingOrders.createdByUserId, ctx.user.id)
          )
        )
        .orderBy(desc(institutionalTrainingOrders.id))
        .limit(1);
      const orderId = orderRows[0]?.id;
      if (!orderId)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create institutional training order.",
        });
      const enrollmentIds: number[] = [];
      for (const staff of selected) {
        const existing = await db
          .select({
            id: enrollments.id,
            paymentStatus: enrollments.paymentStatus,
          })
          .from(enrollments)
          .where(
            and(
              eq(enrollments.userId, staff.userId!),
              eq(enrollments.programType, PAEDS_RESUS_ILS_PROGRAM_TYPE)
            )
          )
          .orderBy(desc(enrollments.id))
          .limit(1);
        let enrollmentId = existing[0]?.id;
        if (!enrollmentId || existing[0]?.paymentStatus === "completed") {
          await db.insert(enrollments).values({
            userId: staff.userId!,
            courseId: course.id,
            programType: PAEDS_RESUS_ILS_PROGRAM_TYPE,
            trainingDate: input.trainingDate,
            paymentStatus: "pending",
            amountPaid: 0,
            cognitiveModulesComplete: false,
            practicalSkillsSignedOff: false,
          });
          const created = await db
            .select({ id: enrollments.id })
            .from(enrollments)
            .where(
              and(
                eq(enrollments.userId, staff.userId!),
                eq(enrollments.programType, PAEDS_RESUS_ILS_PROGRAM_TYPE)
              )
            )
            .orderBy(desc(enrollments.id))
            .limit(1);
          enrollmentId = created[0]?.id;
        }
        if (!enrollmentId)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not create a provider enrollment.",
          });
        enrollmentIds.push(enrollmentId);
        await db.insert(institutionalTrainingOrderProviders).values({
          orderId,
          institutionalAccountId: input.institutionId,
          staffMemberId: staff.id,
          userId: staff.userId!,
          enrollmentId,
        });
      }
      const firstEnrollmentId = enrollmentIds[0];
      if (institutionEntitlement && entitlementPrice) {
        const applied = await consumeGlobalEntitlement(db, {
          entitlementId: institutionEntitlement.id,
          targetInstitutionalAccountId: input.institutionId,
          programType: "paeds_resus_ils",
          resourceReference: `ils-order-${orderId}`,
          originalAmountKes: originalTotalAmountKes,
          redeemedByUserId: ctx.user.id,
        });
        if (!applied) throw new TRPCError({ code: "CONFLICT", message: "The institution entitlement is no longer available. Refresh and try again." });
      }
      await db.insert(payments).values({
        enrollmentId: firstEnrollmentId,
        userId: ctx.user.id,
        amount: centsFromKes(totalAmountKes),
        paymentMethod: totalAmountKes === 0 ? "entitlement" : "mpesa",
        transactionId: totalAmountKes === 0 && institutionEntitlement ? `ENTITLEMENT-${institutionEntitlement.grantReference}` : null,
        institutionalTrainingOrderId: orderId,
        status: totalAmountKes === 0 ? "completed" : "pending",
      });
      const paymentRows = await db
        .select({ id: payments.id })
        .from(payments)
        .where(
          and(
            eq(payments.enrollmentId, firstEnrollmentId),
            eq(payments.userId, ctx.user.id),
            eq(payments.institutionalTrainingOrderId, orderId)
          )
        )
        .orderBy(desc(payments.id))
        .limit(1);
      const paymentId = paymentRows[0]?.id;
      if (!paymentId)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create order payment record.",
        });
      if (totalAmountKes === 0) {
        await applyInstitutionalLifeSupportPaymentCompletion(db, paymentId);
        return { success: true, orderId, paymentId, providerCount, totalAmountKes, originalTotalAmountKes, sponsored: true };
      }
      await db.insert(ilsReminderEvents).values({
        enrollmentId: firstEnrollmentId,
        orderId,
        userId: ctx.user.id,
        reminderType: "payment",
        channel: "email",
        dueAt: new Date(Date.now() + 30 * 60 * 1000),
        status: "queued",
      });
      const response = await initiateStkPush({
        phoneNumber: input.phoneNumber,
        amount: totalAmountKes,
        accountReference: `PAEDSILS-ORDER-${orderId}`,
        transactionDesc: `Paeds Resus ILS ${providerCount} provider(s)`,
        orderId: `ils-order-${orderId}`,
      });
      if (!response.success || !response.checkoutRequestID) {
        const failedAt = new Date();
        await db
          .update(payments)
          .set({ status: "failed", updatedAt: failedAt })
          .where(eq(payments.id, paymentId));
        await applyInstitutionalLifeSupportPaymentFailure(
          db,
          paymentId,
          response.error || "M-Pesa payment could not be started."
        );
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: response.error || "M-Pesa payment could not be started.",
        });
      }
      await db
        .update(payments)
        .set({
          transactionId: response.checkoutRequestID,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentId));
      await db
        .update(institutionalTrainingOrders)
        .set({ paymentId, updatedAt: new Date() })
        .where(eq(institutionalTrainingOrders.id, orderId));
      return {
        success: true,
        orderId,
        paymentId,
        checkoutRequestId: response.checkoutRequestID,
        providerCount,
        totalAmountKes,
        originalTotalAmountKes,
        discounted: Boolean(institutionEntitlement),
      };
    }),

  cancelInstitutionOrder: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        orderId: z.number().int().positive(),
        reason: z.string().trim().min(1).max(255),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const [order] = await db
        .select()
        .from(institutionalTrainingOrders)
        .where(
          and(
            eq(institutionalTrainingOrders.id, input.orderId),
            eq(
              institutionalTrainingOrders.institutionalAccountId,
              input.institutionId
            )
          )
        )
        .limit(1);
      if (!order)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ILS order not found.",
        });
      if (
        order.paymentStatus === "completed" ||
        !["draft", "ready_for_payment", "payment_pending"].includes(
          order.orderStatus
        )
      )
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Only an unpaid, not-yet-delivered ILS order can be cancelled.",
        });
      const now = new Date();
      await db.transaction(async (tx: any) => {
        await tx
          .update(payments)
          .set({ status: "cancelled", updatedAt: now })
          .where(
            and(
              eq(payments.institutionalTrainingOrderId, order.id),
              eq(payments.status, "pending")
            )
          );
        await tx
          .update(institutionalTrainingOrderProviders)
          .set({
            assignmentStatus: "removed",
            replacedAt: now,
            replacedByUserId: ctx.user.id,
            replacementReason: input.reason,
          })
          .where(
            and(
              eq(institutionalTrainingOrderProviders.orderId, order.id),
              eq(institutionalTrainingOrderProviders.assignmentStatus, "active")
            )
          );
        const assignmentRows = await tx
          .select({
            enrollmentId: institutionalTrainingOrderProviders.enrollmentId,
          })
          .from(institutionalTrainingOrderProviders)
          .where(eq(institutionalTrainingOrderProviders.orderId, order.id));
        const enrollmentIds = assignmentRows
          .map((row: { enrollmentId: number | null }) => row.enrollmentId)
          .filter((id: number | null): id is number => id != null);
        if (enrollmentIds.length)
          await tx
            .update(enrollments)
            .set({
              enrollmentStatus: "cancelled",
              cancelledAt: now,
              cancelledByUserId: ctx.user.id,
              cancellationReason: `Institution order #${order.id} cancelled: ${input.reason}`,
              updatedAt: now,
            })
            .where(
              and(
                inArray(enrollments.id, enrollmentIds),
                eq(enrollments.enrollmentStatus, "active")
              )
            );
        if (order.deliverySessionId)
          await tx
            .update(ilsDeliverySessions)
            .set({
              reservedCount: sql`${ilsDeliverySessions.reservedCount} - ${order.providerCount}`,
              updatedAt: now,
            })
            .where(
              and(
                eq(ilsDeliverySessions.id, order.deliverySessionId),
                gte(ilsDeliverySessions.reservedCount, order.providerCount)
              )
            );
        await tx
          .update(institutionalTrainingOrders)
          .set({
            paymentStatus: "failed",
            orderStatus: "cancelled",
            blockedReason: input.reason,
            updatedAt: now,
          })
          .where(eq(institutionalTrainingOrders.id, order.id));
      });
      return { success: true, orderId: order.id, status: "cancelled" as const };
    }),

  requestAhaCredential: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.number().int().positive(),
        credentialType: credentialTypeSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      const enrollment = await getOwnIlsEnrollment(
        db,
        ctx.user.id,
        input.enrollmentId
      );
      if (!enrollment)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Institutional Life Support enrollment not found.",
        });
      const certificate = await getEnrollmentCertificate(db, enrollment.id);
      if (!certificate?.issueDate)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Complete the Paeds Resus programme and receive the Paeds Resus certificate before requesting AHA credentialing.",
        });
      const price = getAhaCredentialingPriceKes(
        input.credentialType,
        certificate.issueDate
      );
      if (price == null)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `The three-month credentialing window has closed. A new ${input.credentialType.toUpperCase()} training enrolment is required at KES ${getAhaFullTrainingPriceKes(input.credentialType).toLocaleString()}.`,
        });
      const existing = await db
        .select()
        .from(ilsCredentialRequests)
        .where(
          and(
            eq(ilsCredentialRequests.enrollmentId, enrollment.id),
            eq(ilsCredentialRequests.credentialType, input.credentialType)
          )
        )
        .orderBy(desc(ilsCredentialRequests.id))
        .limit(1);
      if (
        existing[0] &&
        ["payment_pending", "paid_pending_review", "approved"].includes(
          existing[0].status
        )
      )
        return existing[0];
      await db.insert(ilsCredentialRequests).values({
        enrollmentId: enrollment.id,
        userId: ctx.user.id,
        credentialType: input.credentialType,
        amountKes: price,
        credentialingDeadline: getCredentialingDeadline(certificate.issueDate),
        status: "payment_pending",
      });
      const created = await db
        .select()
        .from(ilsCredentialRequests)
        .where(
          and(
            eq(ilsCredentialRequests.enrollmentId, enrollment.id),
            eq(ilsCredentialRequests.credentialType, input.credentialType)
          )
        )
        .orderBy(desc(ilsCredentialRequests.id))
        .limit(1);
      if (!created[0])
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create AHA credentialing request.",
        });
      const credentialingReminderDueAt = new Date(
        created[0].credentialingDeadline.getTime() - 7 * 24 * 60 * 60 * 1000
      );
      const existingReminder = await db
        .select({ id: ilsReminderEvents.id })
        .from(ilsReminderEvents)
        .where(
          and(
            eq(ilsReminderEvents.enrollmentId, enrollment.id),
            eq(ilsReminderEvents.userId, ctx.user.id),
            eq(ilsReminderEvents.reminderType, "credentialing"),
            eq(ilsReminderEvents.channel, "email")
          )
        )
        .limit(1);
      if (!existingReminder[0]) {
        await db
          .insert(ilsReminderEvents)
          .values({
            enrollmentId: enrollment.id,
            userId: ctx.user.id,
            reminderType: "credentialing",
            channel: "email",
            dueAt:
              credentialingReminderDueAt > new Date()
                ? credentialingReminderDueAt
                : new Date(),
            status: "queued",
          });
      }
      return created[0];
    }),

  initiateAhaCredentialPayment: protectedProcedure
    .input(
      z.object({
        requestId: z.number().int().positive(),
        phoneNumber: z.string().min(1).max(32),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      const rows = await db
        .select()
        .from(ilsCredentialRequests)
        .where(
          and(
            eq(ilsCredentialRequests.id, input.requestId),
            eq(ilsCredentialRequests.userId, ctx.user.id)
          )
        )
        .limit(1);
      const request = rows[0];
      if (!request)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "AHA credentialing request not found.",
        });
      if (Date.now() >= request.credentialingDeadline.getTime())
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `The three-month credentialing window has closed. A new ${request.credentialType.toUpperCase()} training enrolment is required at KES ${getAhaFullTrainingPriceKes(asCredential(request.credentialType)).toLocaleString()}.`,
        });
      if (request.status !== "payment_pending")
        return { success: true, alreadyStarted: true, status: request.status };
      if (!validatePhoneNumber(input.phoneNumber))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Enter a valid M-Pesa phone number.",
        });
      await db.insert(payments).values({
        enrollmentId: request.enrollmentId,
        userId: ctx.user.id,
        amount: centsFromKes(request.amountKes),
        paymentMethod: "mpesa",
        ilsCredentialRequestId: request.id,
        status: "pending",
      });
      const paymentRows = await db
        .select({ id: payments.id })
        .from(payments)
        .where(
          and(
            eq(payments.enrollmentId, request.enrollmentId),
            eq(payments.userId, ctx.user.id),
            eq(payments.ilsCredentialRequestId, request.id)
          )
        )
        .orderBy(desc(payments.id))
        .limit(1);
      const paymentId = paymentRows[0]?.id;
      if (!paymentId)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create credentialing payment record.",
        });
      const response = await initiateStkPush({
        phoneNumber: input.phoneNumber,
        amount: request.amountKes,
        accountReference: `PAEDSILS-AHA-${request.id}`,
        transactionDesc: `Paeds Resus AHA ${request.credentialType.toUpperCase()} credentialing request`,
        orderId: `ils-aha-${request.id}`,
      });
      if (!response.success || !response.checkoutRequestID) {
        await db
          .update(payments)
          .set({ status: "failed", updatedAt: new Date() })
          .where(eq(payments.id, paymentId));
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: response.error || "M-Pesa payment could not be started.",
        });
      }
      await db
        .update(payments)
        .set({
          transactionId: response.checkoutRequestID,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentId));
      await db
        .update(ilsCredentialRequests)
        .set({ paymentId, updatedAt: new Date() })
        .where(eq(ilsCredentialRequests.id, request.id));
      return {
        success: true,
        paymentId,
        checkoutRequestId: response.checkoutRequestID,
        amountKes: request.amountKes,
      };
    }),

  recordPilotMetrics: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        pilotCohortId: z.number().int().positive(),
        orderId: z.number().int().positive().optional(),
        paymentToAccessSuccessPercent: z.number().min(0).max(100),
        activationWithin7dPercent: z.number().min(0).max(100),
        cognitiveWithin30dPercent: z.number().min(0).max(100),
        practicalOpportunityWithin14dPercent: z.number().min(0).max(100),
        practicalPassPercent: z.number().min(0).max(100),
        supportMinutesPerProvider: z.number().int().min(0).optional(),
        costPerProviderKes: z.number().int().min(0).optional(),
        marginPerProviderKes: z.number().int().optional(),
        coordinatorSatisfactionScore: z.number().int().min(1).max(5).optional(),
        notes: z.string().trim().max(4000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const pilotRows = await db
        .select({ id: ilsPilotCohorts.id })
        .from(ilsPilotCohorts)
        .where(
          and(
            eq(ilsPilotCohorts.id, input.pilotCohortId),
            eq(ilsPilotCohorts.institutionalAccountId, input.institutionId)
          )
        )
        .limit(1);
      if (!pilotRows[0])
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pilot cohort not found for this institution.",
        });
      await db.insert(ilsPilotMetrics).values({
        pilotCohortId: input.pilotCohortId,
        orderId: input.orderId ?? null,
        paymentToAccessSuccessPercent:
          input.paymentToAccessSuccessPercent.toFixed(2),
        activationWithin7dPercent: input.activationWithin7dPercent.toFixed(2),
        cognitiveWithin30dPercent: input.cognitiveWithin30dPercent.toFixed(2),
        practicalOpportunityWithin14dPercent:
          input.practicalOpportunityWithin14dPercent.toFixed(2),
        practicalPassPercent: input.practicalPassPercent.toFixed(2),
        supportMinutesPerProvider: input.supportMinutesPerProvider ?? null,
        costPerProviderKes: input.costPerProviderKes ?? null,
        marginPerProviderKes: input.marginPerProviderKes ?? null,
        coordinatorSatisfactionScore:
          input.coordinatorSatisfactionScore ?? null,
        notes: input.notes || null,
        recordedByUserId: ctx.user.id,
      });
      const rows = await db
        .select()
        .from(ilsPilotMetrics)
        .where(eq(ilsPilotMetrics.pilotCohortId, input.pilotCohortId))
        .orderBy(desc(ilsPilotMetrics.id))
        .limit(1);
      return rows[0] ?? null;
    }),

  listPilotMetrics: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        pilotCohortId: z.number().int().positive(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const pilotRows = await db
        .select({ id: ilsPilotCohorts.id })
        .from(ilsPilotCohorts)
        .where(
          and(
            eq(ilsPilotCohorts.id, input.pilotCohortId),
            eq(ilsPilotCohorts.institutionalAccountId, input.institutionId)
          )
        )
        .limit(1);
      if (!pilotRows[0])
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pilot cohort not found for this institution.",
        });
      return db
        .select()
        .from(ilsPilotMetrics)
        .where(eq(ilsPilotMetrics.pilotCohortId, input.pilotCohortId))
        .orderBy(desc(ilsPilotMetrics.measuredAt));
    }),

  listAllOperationalCases: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(ilsOperationalCases)
      .where(inArray(ilsOperationalCases.status, ["open", "in_progress"]))
      .orderBy(desc(ilsOperationalCases.createdAt))
      .limit(200);
  }),

  updateOperationalCase: adminProcedure
    .input(
      z.object({
        caseId: z.number().int().positive(),
        status: z.enum(["open", "in_progress", "resolved", "closed"]),
        priority: z.enum(["low", "normal", "high", "critical"]).optional(),
        ownerUserId: z.number().int().positive().nullable().optional(),
        resolutionNotes: z.string().trim().max(4000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      const now = new Date();
      const currentRows = await db
        .select({
          ownerUserId: ilsOperationalCases.ownerUserId,
          firstResponseAt: ilsOperationalCases.firstResponseAt,
        })
        .from(ilsOperationalCases)
        .where(eq(ilsOperationalCases.id, input.caseId))
        .limit(1);
      if (!currentRows[0])
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ILS operational case not found.",
        });
      await db
        .update(ilsOperationalCases)
        .set({
          status: input.status,
          priority: input.priority,
          ownerUserId:
            input.ownerUserId ??
            currentRows[0].ownerUserId ??
            (input.status === "in_progress"
              ? ctx.user.id
              : currentRows[0].ownerUserId),
          firstResponseAt:
            input.status === "in_progress"
              ? (currentRows[0].firstResponseAt ?? now)
              : currentRows[0].firstResponseAt,
          resolutionNotes: input.resolutionNotes || null,
          resolvedAt: ["resolved", "closed"].includes(input.status)
            ? now
            : null,
          updatedAt: now,
        })
        .where(eq(ilsOperationalCases.id, input.caseId));
      const rows = await db
        .select()
        .from(ilsOperationalCases)
        .where(eq(ilsOperationalCases.id, input.caseId))
        .limit(1);
      return rows[0] ?? null;
    }),

  listDueReminders: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const now = new Date();
    return db
      .select({
        id: ilsReminderEvents.id,
        enrollmentId: ilsReminderEvents.enrollmentId,
        orderId: ilsReminderEvents.orderId,
        userId: ilsReminderEvents.userId,
        reminderType: ilsReminderEvents.reminderType,
        dueAt: ilsReminderEvents.dueAt,
        status: ilsReminderEvents.status,
        userName: users.name,
        userEmail: users.email,
      })
      .from(ilsReminderEvents)
      .leftJoin(users, eq(ilsReminderEvents.userId, users.id))
      .where(
        and(
          eq(ilsReminderEvents.status, "queued"),
          lte(ilsReminderEvents.dueAt, now)
        )
      )
      .orderBy(asc(ilsReminderEvents.dueAt))
      .limit(100);
  }),

  dispatchDueReminders: adminProcedure.mutation(async () => {
    const result = await runScheduledIlsReminders();
    return {
      attempted: result.evaluated,
      sent: result.sent,
      failed: result.failed,
    };
  }),

  listAhaCredentialRequests: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });
    const rows = await db
      .select({
        id: ilsCredentialRequests.id,
        enrollmentId: ilsCredentialRequests.enrollmentId,
        userId: ilsCredentialRequests.userId,
        credentialType: ilsCredentialRequests.credentialType,
        amountKes: ilsCredentialRequests.amountKes,
        credentialingDeadline: ilsCredentialRequests.credentialingDeadline,
        status: ilsCredentialRequests.status,
        paymentId: ilsCredentialRequests.paymentId,
        requestedAt: ilsCredentialRequests.requestedAt,
        paidAt: ilsCredentialRequests.paidAt,
        reviewedAt: ilsCredentialRequests.reviewedAt,
        reviewNotes: ilsCredentialRequests.reviewNotes,
        userName: users.name,
        userEmail: users.email,
      })
      .from(ilsCredentialRequests)
      .leftJoin(users, eq(ilsCredentialRequests.userId, users.id))
      .orderBy(desc(ilsCredentialRequests.createdAt))
      .limit(100);
    return rows;
  }),

  reviewAhaCredentialRequest: adminProcedure
    .input(
      z.object({
        requestId: z.number().int().positive(),
        decision: z.enum(["approved", "rejected", "expired"]),
        notes: z.string().trim().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      const rows = await db
        .select()
        .from(ilsCredentialRequests)
        .where(eq(ilsCredentialRequests.id, input.requestId))
        .limit(1);
      const request = rows[0];
      if (!request)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "AHA credentialing request not found.",
        });
      if (request.status !== "paid_pending_review") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Only payment-confirmed credentialing requests can be reviewed.",
        });
      }
      if (
        input.decision === "approved" &&
        Date.now() >= request.credentialingDeadline.getTime()
      ) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "The credentialing window has closed; review it as expired instead.",
        });
      }
      const reviewedAt = new Date();
      await db
        .update(ilsCredentialRequests)
        .set({
          status: input.decision,
          reviewedAt,
          reviewedByUserId: ctx.user.id,
          reviewNotes: input.notes || null,
          updatedAt: reviewedAt,
        })
        .where(
          and(
            eq(ilsCredentialRequests.id, request.id),
            eq(ilsCredentialRequests.status, "paid_pending_review")
          )
        );
      await db
        .update(ilsOperationalCases)
        .set({
          status: "resolved",
          resolutionNotes:
            input.notes || `AHA credentialing request ${input.decision}.`,
          resolvedAt: reviewedAt,
          updatedAt: reviewedAt,
        })
        .where(
          and(
            eq(ilsOperationalCases.enrollmentId, request.enrollmentId),
            eq(ilsOperationalCases.category, "aha_credentialing"),
            inArray(ilsOperationalCases.status, ["open", "in_progress"])
          )
        );
      return { success: true, requestId: request.id, status: input.decision };
    }),
});

export type InstitutionalLifeSupportRouter =
  typeof institutionalLifeSupportRouter;
