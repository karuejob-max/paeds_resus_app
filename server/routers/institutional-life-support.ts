import { z } from "zod";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
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
  payments,
  users,
} from "../../drizzle/schema";
import {
  ensureInstitutionalLifeSupportCatalog,
  getInstitutionalLifeSupportCourseId,
} from "../lib/ensure-institutional-life-support-catalog";
import { assertTrainingWorkspaceOrAdmin } from "../lib/training-workspace-guard";
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
  getCertificateByEnrollmentId,
  issueCertificateForEnrollmentIfEligible,
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
              input.reason || "Cancelled by provider before payment or course access.",
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

  createInstitutionOrder: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        staffMemberIds: z.array(z.number().int().positive()).min(1).max(200),
        trainingDate: z.coerce.date(),
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
      const totalAmountKes = providerCount * PAEDS_RESUS_ILS_BASE_PRICE_KES;
      await db.insert(institutionalTrainingOrders).values({
        institutionalAccountId: input.institutionId,
        programType: PAEDS_RESUS_ILS_PROGRAM_TYPE,
        providerCount,
        amountPerProviderKes: PAEDS_RESUS_ILS_BASE_PRICE_KES,
        totalAmountKes,
        trainingDate: input.trainingDate,
        paymentStatus: "pending",
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
          await db
            .insert(enrollments)
            .values({
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
        await db
          .insert(institutionalTrainingOrderProviders)
          .values({
            orderId,
            institutionalAccountId: input.institutionId,
            staffMemberId: staff.id,
            userId: staff.userId!,
            enrollmentId,
          });
      }
      const firstEnrollmentId = enrollmentIds[0];
      await db
        .insert(payments)
        .values({
          enrollmentId: firstEnrollmentId,
          userId: ctx.user.id,
          amount: centsFromKes(totalAmountKes),
          paymentMethod: "mpesa",
          institutionalTrainingOrderId: orderId,
          status: "pending",
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
      const response = await initiateStkPush({
        phoneNumber: input.phoneNumber,
        amount: totalAmountKes,
        accountReference: `PAEDSILS-ORDER-${orderId}`,
        transactionDesc: `Paeds Resus ILS ${providerCount} provider(s)`,
        orderId: `ils-order-${orderId}`,
      });
      if (!response.success || !response.checkoutRequestID) {
        await db
          .update(payments)
          .set({ status: "failed", updatedAt: new Date() })
          .where(eq(payments.id, paymentId));
        await db
          .update(institutionalTrainingOrders)
          .set({ paymentStatus: "failed", updatedAt: new Date() })
          .where(eq(institutionalTrainingOrders.id, orderId));
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
      };
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
      await db
        .insert(ilsCredentialRequests)
        .values({
          enrollmentId: enrollment.id,
          userId: ctx.user.id,
          credentialType: input.credentialType,
          amountKes: price,
          credentialingDeadline: getCredentialingDeadline(
            certificate.issueDate
          ),
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
      await db
        .insert(payments)
        .values({
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
      await db
        .update(ilsCredentialRequests)
        .set({
          status: input.decision,
          reviewedAt: new Date(),
          reviewedByUserId: ctx.user.id,
          reviewNotes: input.notes || null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(ilsCredentialRequests.id, request.id),
            eq(ilsCredentialRequests.status, "paid_pending_review")
          )
        );
      return { success: true, requestId: request.id, status: input.decision };
    }),
});

export type InstitutionalLifeSupportRouter =
  typeof institutionalLifeSupportRouter;
