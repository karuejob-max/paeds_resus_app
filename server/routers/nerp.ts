import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull, like, or } from "drizzle-orm";
import { z } from "zod";
import {
  enrollments,
  institutionalStaffMembers,
  nerpOfferAuditEvents,
  nerpOfferCourses,
  nerpOfferEnrollments,
  nerpOfferExternalVerifications,
  professionalCredentials,
} from "../../drizzle/schema";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  calculateNerpPaymentState,
  deriveNerpPromotionStatus,
  NERP_ACLS_OFFER,
  NERP_ACLS_OFFER_KEY,
} from "../lib/nerp-offer";
import { ensurePaedsResusCertificatesForUser } from "../lib/paeds-resus-certificate-issuance";

const PHASES = ["phase_2", "phase_3"] as const;
const DECISIONS = ["verified", "rejected", "revoked"] as const;
const NURSING_ADMIN_NAMES = new Set([
  "theresa mwaniki",
  "esther mwangi",
  "annet",
  "emma",
]);

function requireDb() {
  return getDb().then(db => {
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed.",
      });
    }
    return db;
  });
}

function normalizedName(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function validEmail(value: string | null | undefined) {
  return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()));
}

async function getOfferForUser(db: any, userId: number) {
  const rows = await db
    .select()
    .from(nerpOfferEnrollments)
    .where(
      and(
        eq(nerpOfferEnrollments.userId, userId),
        eq(nerpOfferEnrollments.offerKey, NERP_ACLS_OFFER_KEY)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

async function ensureChildEnrollment(
  db: any,
  userId: number,
  programType: "bls" | "acls"
) {
  const existing = await db
    .select()
    .from(enrollments)
    .where(
      and(
        eq(enrollments.userId, userId),
        eq(enrollments.programType, programType)
      )
    )
    .orderBy(desc(enrollments.id))
    .limit(1);
  if (existing[0]) return existing[0];

  const inserted = await db.insert(enrollments).values({
    userId,
    programType,
    trainingDate: new Date(),
    paymentStatus: "pending",
    amountPaid: 0,
  } as any);
  const insertId = Number(
    (inserted as any)[0]?.id ?? (inserted as any).insertId ?? 0
  );
  if (insertId) {
    const rows = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, insertId))
      .limit(1);
    if (rows[0]) return rows[0];
  }
  const fallback = await db
    .select()
    .from(enrollments)
    .where(
      and(
        eq(enrollments.userId, userId),
        eq(enrollments.programType, programType)
      )
    )
    .orderBy(desc(enrollments.id))
    .limit(1);
  if (!fallback[0])
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Could not create ${programType.toUpperCase()} enrollment.`,
    });
  return fallback[0];
}

async function ensureOfferForUser(db: any, userId: number) {
  let offer = await getOfferForUser(db, userId);
  let created = false;
  if (!offer) {
    const result = await db.insert(nerpOfferEnrollments).values({
      userId,
      offerKey: NERP_ACLS_OFFER_KEY,
      status: "active",
      totalAmountKes: NERP_ACLS_OFFER.totalAmountKes.toFixed(2),
      monthlyInstallmentKes: NERP_ACLS_OFFER.monthlyInstallmentKes.toFixed(2),
      installmentCount: NERP_ACLS_OFFER.installmentCount,
      amountPaidKes: "0.00",
      nextInstallmentNumber: 1,
    });
    const insertId = Number(
      (result as any)[0]?.id ?? (result as any).insertId ?? 0
    );
    offer = insertId
      ? (
          await db
            .select()
            .from(nerpOfferEnrollments)
            .where(eq(nerpOfferEnrollments.id, insertId))
            .limit(1)
        )[0]
      : await getOfferForUser(db, userId);
    created = true;
  }
  if (!offer)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not create the NERP offer enrollment.",
    });

  const children = {
    bls: await ensureChildEnrollment(db, userId, "bls"),
    acls: await ensureChildEnrollment(db, userId, "acls"),
  };
  for (const programType of ["bls", "acls"] as const) {
    const linked = await db
      .select({ id: nerpOfferCourses.id })
      .from(nerpOfferCourses)
      .where(
        and(
          eq(nerpOfferCourses.nerpOfferEnrollmentId, offer.id),
          eq(nerpOfferCourses.programType, programType)
        )
      )
      .limit(1);
    if (!linked[0]) {
      await db.insert(nerpOfferCourses).values({
        nerpOfferEnrollmentId: offer.id,
        enrollmentId: children[programType].id,
        programType,
      });
    }
  }
  if (created) {
    await db.insert(nerpOfferAuditEvents).values({
      nerpOfferEnrollmentId: offer.id,
      action: "offer_created",
      actorUserId: userId,
      details: JSON.stringify({
        offerKey: NERP_ACLS_OFFER_KEY,
        linkedPrograms: ["bls", "acls"],
      }),
    });
  }
  return { offer, children };
}

async function getVerificationState(db: any, offerId: number) {
  const rows = await db
    .select()
    .from(nerpOfferExternalVerifications)
    .where(eq(nerpOfferExternalVerifications.nerpOfferEnrollmentId, offerId));
  return {
    phase2: rows.find((row: any) => row.phase === "phase_2") ?? null,
    phase3: rows.find((row: any) => row.phase === "phase_3") ?? null,
    rows,
  };
}

async function syncExternalPhaseToStaff(
  db: any,
  userId: number,
  phase2Verified: boolean,
  phase3Verified: boolean
) {
  const nextStatus =
    phase2Verified && phase3Verified
      ? "completed"
      : phase2Verified
        ? "phase_3"
        : "phase_1";
  await db
    .update(institutionalStaffMembers)
    .set({
      phaseStatus: nextStatus,
      enrollmentStatus: nextStatus === "completed" ? "completed" : nextStatus === "phase_3" ? "in_progress" : "pending",
      ...(nextStatus === "completed" ? { completionDate: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(institutionalStaffMembers.userId, userId),
        isNull(institutionalStaffMembers.removedAt)
      )
    );
}

export const nerpRouter = router({
  getOffer: protectedProcedure.query(() => ({
    ...NERP_ACLS_OFFER,
    currency: "KES",
    certificationNote:
      "Certification remains subject to completion of the programme’s required learning, assessment, and skills requirements.",
  })),

  getMyEnrollment: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const current = await getOfferForUser(db, ctx.user.id);
    if (!current)
      return {
        offer: null,
        courses: [],
        verifications: [],
        paymentState: null,
      };
    const courses = await db
      .select()
      .from(nerpOfferCourses)
      .where(eq(nerpOfferCourses.nerpOfferEnrollmentId, current.id));
    const verification = await getVerificationState(db, current.id);
    return {
      offer: current,
      courses,
      verifications: verification.rows,
      paymentState: calculateNerpPaymentState({
        amountPaidKes: Number(current.amountPaidKes),
        totalAmountKes: Number(current.totalAmountKes),
        monthlyInstallmentKes: Number(current.monthlyInstallmentKes),
        installmentCount: current.installmentCount,
      }),
    };
  }),

  createOrResumeEnrollment: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await requireDb();
    const { offer, children } = await ensureOfferForUser(db, ctx.user.id);
    return {
      offer,
      childEnrollments: {
        blsEnrollmentId: children.bls.id,
        aclsEnrollmentId: children.acls.id,
      },
      paymentState: calculateNerpPaymentState({
        amountPaidKes: Number(offer.amountPaidKes),
        totalAmountKes: Number(offer.totalAmountKes),
        monthlyInstallmentKes: Number(offer.monthlyInstallmentKes),
        installmentCount: offer.installmentCount,
      }),
    };
  }),

  getCheckoutContext: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const { offer, children } = await ensureOfferForUser(db, ctx.user.id);
    if (offer.status === "completed") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This NERP pathway is already complete.",
      });
    }
    const state = calculateNerpPaymentState({
      amountPaidKes: Number(offer.amountPaidKes),
      totalAmountKes: Number(offer.totalAmountKes),
      monthlyInstallmentKes: Number(offer.monthlyInstallmentKes),
      installmentCount: offer.installmentCount,
    });
    return {
      offer,
      enrollmentId: children.acls.id,
      amount: state.nextInstallmentAmountKes,
      installmentNumber: state.nextInstallmentNumber,
      paymentState: state,
    };
  }),

  createVerificationLedger: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const staffRows = await db
        .select({ id: institutionalStaffMembers.id })
        .from(institutionalStaffMembers)
        .where(
          and(
            eq(institutionalStaffMembers.userId, input.userId),
            isNull(institutionalStaffMembers.removedAt)
          )
        )
        .limit(1);
      if (!staffRows[0])
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Active institutional staff record not found.",
        });
      const { offer } = await ensureOfferForUser(db, input.userId);
      await db
        .insert(nerpOfferAuditEvents)
        .values({
          nerpOfferEnrollmentId: offer.id,
          action: "admin_verification_ledger_created",
          actorUserId: ctx.user.id,
          details: JSON.stringify({ userId: input.userId }),
        });
      return { success: true as const, offerEnrollmentId: offer.id };
    }),

  getAdminVerificationQueue: adminProcedure
    .input(
      z.object({
        search: z.string().trim().max(120).optional(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await requireDb();
      const search = input.search?.trim();
      const conditions = [isNull(institutionalStaffMembers.removedAt)];
      if (search) {
        conditions.push(
          or(
            like(institutionalStaffMembers.staffName, `%${search}%`),
            like(institutionalStaffMembers.staffEmail, `%${search}%`)
          ) as any
        );
      }
      const staffRows = await db
        .select()
        .from(institutionalStaffMembers)
        .where(and(...conditions))
        .orderBy(desc(institutionalStaffMembers.updatedAt))
        .limit(input.limit);
      const records = [];
      for (const staff of staffRows) {
        if (!staff.userId) continue;
        const offer = await getOfferForUser(db, staff.userId);
        const assignedCourses = String(
          staff.assignedCourses ?? ""
        ).toLowerCase();
        const hasNerpSignals =
          staff.phaseStatus !== "phase_1" ||
          assignedCourses.includes("acls") ||
          assignedCourses.includes("bls") ||
          staff.enrollmentStatus !== "pending";
        if (!offer && !hasNerpSignals) continue;
        const verification = offer
          ? await getVerificationState(db, offer.id)
          : { phase2: null, phase3: null, rows: [] };
        records.push({
          staff,
          offer,
          verifications: verification.rows,
          pathwayComplete:
            verification.phase2?.status === "verified" &&
            verification.phase3?.status === "verified",
        });
      }
      return records;
    }),

  reviewExternalPhase: adminProcedure
    .input(
      z.object({
        offerEnrollmentId: z.number().int().positive(),
        phase: z.enum(PHASES),
        decision: z.enum(DECISIONS),
        completedAt: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        evidenceNote: z.string().trim().min(3).max(1000).optional(),
        evidenceReference: z.string().trim().max(512).optional(),
        reason: z.string().trim().min(3).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const offerRows = await db
        .select()
        .from(nerpOfferEnrollments)
        .where(eq(nerpOfferEnrollments.id, input.offerEnrollmentId))
        .limit(1);
      const offer = offerRows[0];
      if (!offer)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "NERP offer enrollment not found.",
        });
      if (
        input.decision === "verified" &&
        (!input.completedAt || !input.evidenceNote)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Verified external phases require a completion date and evidence note.",
        });
      }
      const completedAt = input.completedAt
        ? new Date(`${input.completedAt}T00:00:00.000Z`)
        : null;
      const existingRows = await db
        .select()
        .from(nerpOfferExternalVerifications)
        .where(
          and(
            eq(nerpOfferExternalVerifications.nerpOfferEnrollmentId, offer.id),
            eq(nerpOfferExternalVerifications.phase, input.phase)
          )
        )
        .limit(1);
      const values = {
        status: input.decision,
        completedAt,
        evidenceNote: input.evidenceNote ?? null,
        evidenceReference: input.evidenceReference ?? null,
        verifiedByUserId: ctx.user.id,
        verifiedAt: new Date(),
        reviewReason: input.reason,
        updatedAt: new Date(),
      };
      if (existingRows[0]) {
        await db
          .update(nerpOfferExternalVerifications)
          .set(values)
          .where(eq(nerpOfferExternalVerifications.id, existingRows[0].id));
      } else {
        await db.insert(nerpOfferExternalVerifications).values({
          nerpOfferEnrollmentId: offer.id,
          phase: input.phase,
          ...values,
        });
      }
      const next = await getVerificationState(db, offer.id);
      const phase2Verified = next.phase2?.status === "verified";
      const phase3Verified = next.phase3?.status === "verified";
      await syncExternalPhaseToStaff(
        db,
        offer.userId,
        phase2Verified,
        phase3Verified
      );
      await db.insert(nerpOfferAuditEvents).values({
        nerpOfferEnrollmentId: offer.id,
        action: `external_${input.phase}_${input.decision}`,
        actorUserId: ctx.user.id,
        details: JSON.stringify({
          reason: input.reason,
          evidenceReference: input.evidenceReference ?? null,
        }),
      });

      let certificateProjection = null;
      if (input.decision === "verified") {
        try {
          certificateProjection = await ensurePaedsResusCertificatesForUser(db, offer.userId);
        } catch (error) {
          // NERP verification is authoritative and must remain usable even if
          // the additive certificate migration is still propagating.
          console.error("[nerp.reviewExternalPhase] Universal certificate projection failed:", error);
        }
      }
      return {
        success: true as const,
        phase2Verified,
        phase3Verified,
        pathwayComplete: phase2Verified && phase3Verified,
        certificates: certificateProjection,
      };
    }),

  getPromotionPreview: adminProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive().default(3),
        limit: z.number().int().min(1).max(500).default(200),
      })
    )
    .query(async ({ input }) => {
      const db = await requireDb();
      const staffRows = await db
        .select()
        .from(institutionalStaffMembers)
        .where(
          and(
            eq(
              institutionalStaffMembers.institutionalAccountId,
              input.institutionId
            ),
            eq(institutionalStaffMembers.staffRole, "nurse"),
            isNull(institutionalStaffMembers.removedAt)
          )
        )
        .orderBy(institutionalStaffMembers.staffName)
        .limit(input.limit);
      const recipients = [];
      for (const staff of staffRows) {
        const excluded = NURSING_ADMIN_NAMES.has(
          normalizedName(staff.staffName)
        );
        const offer = staff.userId
          ? await getOfferForUser(db, staff.userId)
          : null;
        const verification = offer
          ? await getVerificationState(db, offer.id)
          : { phase2: null, phase3: null, rows: [] };
        const credentials = staff.userId
          ? await db
              .select({
                credentialType: professionalCredentials.credentialType,
                status: professionalCredentials.status,
              })
              .from(professionalCredentials)
              .where(
                and(
                  eq(professionalCredentials.userId, staff.userId),
                  or(
                    eq(
                      professionalCredentials.credentialType,
                      "external_aha_bls"
                    ),
                    eq(
                      professionalCredentials.credentialType,
                      "external_aha_acls"
                    )
                  )
                )
              )
          : [];
        const hasVerifiedBlsAndAcls =
          credentials.some(
            (row: (typeof credentials)[number]) =>
              row.credentialType === "external_aha_bls" &&
              row.status === "verified"
          ) &&
          credentials.some(
            (row: (typeof credentials)[number]) =>
              row.credentialType === "external_aha_acls" &&
              row.status === "verified"
          );
        const status = deriveNerpPromotionStatus({
          hasValidEmail: validEmail(staff.staffEmail),
          hasCompletedOffer: offer?.status === "completed",
          phase2Verified: verification.phase2?.status === "verified",
          phase3Verified: verification.phase3?.status === "verified",
          hasVerifiedBlsAndAcls,
          explicitlyExcluded: excluded,
        });
        recipients.push({
          staffId: staff.id,
          userId: staff.userId,
          name: staff.staffName,
          email: staff.staffEmail,
          department: staff.department,
          excluded,
          promotionStatus: status.status,
          suppressionReason: status.reason,
          sendable: status.status === "eligible",
          offerStatus: offer?.status ?? null,
          phase2Verified: verification.phase2?.status === "verified",
          phase3Verified: verification.phase3?.status === "verified",
          hasVerifiedBlsAndAcls,
        });
      }
      return {
        institutionId: input.institutionId,
        offerKey: NERP_ACLS_OFFER_KEY,
        generatedAt: new Date().toISOString(),
        counts: {
          totalNurses: recipients.length,
          sendable: recipients.filter(row => row.sendable).length,
          suppressed: recipients.filter(
            row => row.promotionStatus === "suppressed"
          ).length,
          needsReview: recipients.filter(
            row => row.promotionStatus === "needs_review"
          ).length,
          excludedByName: recipients.filter(row => row.excluded).length,
        },
        recipients,
        emailSending: false as const,
      };
    }),

  getAuditHistory: adminProcedure
    .input(z.object({ offerEnrollmentId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      return db
        .select()
        .from(nerpOfferAuditEvents)
        .where(
          eq(
            nerpOfferAuditEvents.nerpOfferEnrollmentId,
            input.offerEnrollmentId
          )
        )
        .orderBy(desc(nerpOfferAuditEvents.createdAt));
    }),
});
