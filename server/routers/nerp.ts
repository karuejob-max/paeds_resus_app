import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  enrollments,
  institutionalStaffMembers,
  nerpOfferAuditEvents,
  nerpOfferCourses,
  nerpOfferEnrollments,
  nerpOfferExternalVerifications,
  nerpExternalVerificationCases,
  nerpExternalVerificationPhases,
  nerpExternalVerificationAuditEvents,
  nerpCampaignSuppressions,
  nerpCampaignSuppressionAuditEvents,
  nerpCampaignDeliveries,
  users,
} from "../../drizzle/schema";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  calculateNerpPaymentState,
  NERP_ACLS_OFFER,
  NERP_ACLS_OFFER_KEY,
} from "../lib/nerp-offer";
import { ensurePaedsResusCertificatesForUser } from "../lib/paeds-resus-certificate-issuance";
import {
  normalizedEmail,
  normalizedName,
  normalizedSuppressionValue,
  validEmail,
} from "../lib/nerp-campaign-controls";
import { loadNerpPromotionAudience } from "../lib/nerp-campaign-audience";
import {
  canEnterNerpNurseCampaign,
  requiresExternalCandidateCadre,
  type ExternalNerpCandidateType,
} from "../lib/nerp-external-candidate";
import { hasVerifiedNckLicence } from "../lib/aha-access";
import { sendEmail } from "../email";
import { isMissingTableError } from "../lib/is-missing-db-table";

const NERP_PROMOTION_CAMPAIGN_KEY = "nerp-acls-inst3-2026-08";
const NERP_PROMOTION_SUBJECT = "A flexible six-month path to AHA ACLS certification";
const NERP_PROMOTION_LINK = "https://www.paedsresus.com/programs/nerp-acls";
const NERP_SUPPORT_PHONE = "0706781260";
const NERP_SUPPORT_EMAIL = "paedsresus254@gmail.com";

function escapeHtml(value: string) {
  return value.replace(/[&<>\"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '\"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function buildNerpPromotionEmail(recipientName: string) {
  const safeName = escapeHtml(recipientName.trim() || "colleague");
  const html = `<!doctype html>
<html><body style="font-family:Arial,sans-serif;color:#1f2937;line-height:1.55;">
  <div style="max-width:620px;margin:0 auto;padding:24px;">
    <h1 style="color:#164e63;">A flexible path to AHA ACLS certification</h1>
    <p>Hello ${safeName},</p>
    <p>If AHA ACLS is part of your professional development plan, Paeds Resus has introduced the <strong>Nurses Emergency Readiness Program (NERP)</strong>.</p>
    <p>With <strong>Lipa Mdogo Mdogo</strong>, you can pay <strong>KES 2,500 per month for six months</strong> (KES 15,000 total). The programme includes the AHA ACLS pathway and a Paeds Resus BLS certificate.</p>
    <p style="text-align:center;margin:28px 0;"><a href="${NERP_PROMOTION_LINK}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:700;">View the NERP programme</a></p>
    <p>This opportunity is optional and is not an institutional performance assessment. Please review the programme details, eligibility requirements, payment terms, and pathway before enrolling.</p>
    <p>Questions or need clarification? Call <strong>${NERP_SUPPORT_PHONE}</strong> or email <a href="mailto:${NERP_SUPPORT_EMAIL}">${NERP_SUPPORT_EMAIL}</a>.</p>
    <p style="font-size:12px;color:#6b7280;">If you would prefer not to receive programme updates, reply to this email or contact us using the details above.</p>
    <p>Regards,<br />Paeds Resus</p>
  </div>
</body></html>`;
  const text = `Hello ${recipientName.trim() || "colleague"},

If AHA ACLS is part of your professional development plan, Paeds Resus has introduced the Nurses Emergency Readiness Program (NERP).

With Lipa Mdogo Mdogo, you can pay KES 2,500 per month for six months (KES 15,000 total). The programme includes the AHA ACLS pathway and a Paeds Resus BLS certificate.

View the NERP programme: ${NERP_PROMOTION_LINK}

This opportunity is optional and is not an institutional performance assessment. Please review the programme details, eligibility requirements, payment terms, and pathway before enrolling.

Questions or need clarification? Call ${NERP_SUPPORT_PHONE} or email ${NERP_SUPPORT_EMAIL}.

If you would prefer not to receive programme updates, reply to this email or contact us using the details above.

Regards,
Paeds Resus`;
  return { html, text };
}

const PHASES = ["phase_2", "phase_3"] as const;
const DECISIONS = ["verified", "rejected", "revoked"] as const;
async function getNerpCampaignSendCandidates(db: any, institutionalAccountId: number) {
  const staffRows = await db
    .select()
    .from(institutionalStaffMembers)
    .where(
      and(
        eq(institutionalStaffMembers.institutionalAccountId, institutionalAccountId),
        eq(institutionalStaffMembers.staffRole, "nurse"),
        isNull(institutionalStaffMembers.removedAt),
      ),
    )
    .orderBy(institutionalStaffMembers.staffName)
    .limit(500);
  const suppressionRows = await getActiveCampaignSuppressions(db, institutionalAccountId);
  const candidates: Array<{
    staffId: number;
    userId: number | null;
    name: string;
    email: string;
  }> = [];

  for (const staff of staffRows) {
    const suppression = findCampaignSuppression(suppressionRows, staff.staffEmail, staff.staffName);
    if (suppression || !validEmail(staff.staffEmail)) continue;
    const offer = staff.userId ? await getOfferForUser(db, staff.userId) : null;
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
                eq(professionalCredentials.credentialType, "external_aha_bls"),
                eq(professionalCredentials.credentialType, "external_aha_acls"),
              ),
            ),
          )
      : [];
    const hasVerifiedBlsAndAcls =
      credentials.some(
        (row: (typeof credentials)[number]) =>
          row.credentialType === "external_aha_bls" && row.status === "verified",
      ) &&
      credentials.some(
        (row: (typeof credentials)[number]) =>
          row.credentialType === "external_aha_acls" && row.status === "verified",
      );
    const status = deriveNerpPromotionStatus({
      hasValidEmail: validEmail(staff.staffEmail),
      hasCompletedOffer: offer?.status === "completed",
      phase2Verified: verification.phase2?.status === "verified",
      phase3Verified: verification.phase3?.status === "verified",
      hasVerifiedBlsAndAcls,
      explicitlyExcluded: false,
    });
    if (status.status !== "eligible") continue;
    candidates.push({
      staffId: staff.id,
      userId: staff.userId,
      name: staff.staffName,
      email: staff.staffEmail.trim(),
    });
  }
  return candidates;
}

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

async function getActiveCampaignSuppressions(db: any, institutionalAccountId: number) {
  const rows = await db
    .select({
      id: nerpCampaignSuppressions.id,
      matchType: nerpCampaignSuppressions.matchType,
      matchValue: nerpCampaignSuppressions.matchValue,
      reasonCode: nerpCampaignSuppressions.reasonCode,
      note: nerpCampaignSuppressions.note,
    })
    .from(nerpCampaignSuppressions)
    .where(
      and(
        eq(nerpCampaignSuppressions.institutionalAccountId, institutionalAccountId),
        eq(nerpCampaignSuppressions.isActive, true)
      )
    );
  return rows;
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

  getEligibility: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const eligible = await hasVerifiedNckLicence(db, ctx.user.id);
    return {
      eligible,
      message: eligible
        ? "Your verified Nursing Council of Kenya licence is ready for NERP."
        : "Complete your provider profile and submit a Nursing Council of Kenya licence with the licence number for verification before joining NERP.",
    };
  }),

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
    if (!(await hasVerifiedNckLicence(db, ctx.user.id))) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Complete your provider profile and submit a Nursing Council of Kenya licence with the licence number for verification before joining NERP.",
      });
    }
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
    if (!(await hasVerifiedNckLicence(db, ctx.user.id))) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "A verified Nursing Council of Kenya licence and licence number are required before NERP checkout.",
      });
    }
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

  createExternalVerificationCase: adminProcedure
    .input(
      z.object({
        institutionalAccountId: z.number().int().positive().default(3),
        candidateType: z.enum(["nerp_nurse", "non_nurse_external"]).default("nerp_nurse"),
        candidateCadre: z.string().trim().max(128).optional(),
        candidateName: z.string().trim().min(2).max(255),
        candidateEmail: z.string().trim().email().max(320).optional(),
        userId: z.number().int().positive().optional(),
        providerName: z.string().trim().max(255).optional(),
        certificateReference: z.string().trim().max(512).optional(),
        sourceType: z.enum(["external_provider_certificate", "employer_record", "manual_admin_attestation", "other"]).default("external_provider_certificate"),
        caseNote: z.string().trim().max(4000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const candidateEmail = input.candidateEmail ? normalizedEmail(input.candidateEmail) : null;
      const candidateCadre = input.candidateCadre?.trim() || null;
      if (requiresExternalCandidateCadre(input.candidateType as ExternalNerpCandidateType) && !candidateCadre) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Enter the non-nurse candidate's cadre for external review.",
        });
      }
      let resolvedUserId = input.userId ?? null;
      if (!resolvedUserId && candidateEmail) {
        const [matchingUser] = await db
          .select({ id: users.id })
          .from(users)
          .where(sql`LOWER(TRIM(${users.email})) = ${candidateEmail}`)
          .limit(1);
        resolvedUserId = matchingUser?.id ?? null;
      }
      const caseKey = `nerp-ext-${randomUUID()}`;
      const result = await db.insert(nerpExternalVerificationCases).values({
        caseKey,
        institutionalAccountId: input.institutionalAccountId,
        userId: resolvedUserId,
        candidateType: input.candidateType,
        candidateCadre,
        candidateName: input.candidateName.trim().replace(/\s+/g, " "),
        candidateEmail,
        providerName: input.providerName?.trim() || null,
        certificateReference: input.certificateReference?.trim() || null,
        sourceType: input.sourceType,
        caseNote: input.caseNote?.trim() || null,
        createdByUserId: ctx.user.id,
      });
      const caseId = Number((result as any)[0]?.id ?? (result as any).insertId ?? 0);
      if (!caseId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create external verification case." });
      await db.insert(nerpExternalVerificationAuditEvents).values({
        caseId,
        action: "case_created",
        actorUserId: ctx.user.id,
        details: JSON.stringify({ candidateEmail, candidateType: input.candidateType, candidateCadre, sourceType: input.sourceType }),
      });
      return { success: true as const, caseId, caseKey, linkedUserId: resolvedUserId };
    }),

  getExternalVerificationQueue: adminProcedure
    .input(
      z.object({
        institutionalAccountId: z.number().int().positive().default(3),
        search: z.string().trim().max(120).optional(),
        limit: z.number().int().min(1).max(100).default(100),
      })
    )
    .query(async ({ input }) => {
      const db = await requireDb();
      const conditions = [eq(nerpExternalVerificationCases.institutionalAccountId, input.institutionalAccountId)];
      if (input.search) {
        const search = `%${input.search.trim()}%`;
        conditions.push(
          or(
            like(nerpExternalVerificationCases.candidateName, search),
            like(nerpExternalVerificationCases.candidateEmail, search),
            like(nerpExternalVerificationCases.caseKey, search)
          ) as any
        );
      }
      const cases = await db
        .select()
        .from(nerpExternalVerificationCases)
        .where(and(...conditions))
        .orderBy(desc(nerpExternalVerificationCases.updatedAt))
        .limit(input.limit);
      const result = [];
      for (const externalCase of cases) {
        const phases = await db
          .select()
          .from(nerpExternalVerificationPhases)
          .where(eq(nerpExternalVerificationPhases.caseId, externalCase.id));
        result.push({
          ...externalCase,
          phases,
          phase2Verified: phases.some(row => row.phase === "phase_2" && row.status === "verified"),
          phase3Verified: phases.some(row => row.phase === "phase_3" && row.status === "verified"),
        });
      }
      return result;
    }),

  reviewExternalCasePhase: adminProcedure
    .input(
      z.object({
        caseId: z.number().int().positive(),
        phase: z.enum(PHASES),
        decision: z.enum(DECISIONS),
        completedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        evidenceNote: z.string().trim().min(3).max(2000).optional(),
        evidenceReference: z.string().trim().max(512).optional(),
        reason: z.string().trim().min(3).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [externalCase] = await db
        .select()
        .from(nerpExternalVerificationCases)
        .where(eq(nerpExternalVerificationCases.id, input.caseId))
        .limit(1);
      if (!externalCase) throw new TRPCError({ code: "NOT_FOUND", message: "External NERP verification case not found." });
      if (input.decision === "verified" && (!input.completedAt || !input.evidenceNote)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Verified external phases require a completion date and evidence note." });
      }
      const completedAt = input.completedAt ? new Date(`${input.completedAt}T00:00:00.000Z`) : null;
      const values = {
        status: input.decision,
        completedAt,
        evidenceNote: input.evidenceNote?.trim() ?? null,
        evidenceReference: input.evidenceReference?.trim() || null,
        verifiedByUserId: ctx.user.id,
        verifiedAt: new Date(),
        reviewReason: input.reason.trim(),
        updatedAt: new Date(),
      };
      const [existing] = await db
        .select({ id: nerpExternalVerificationPhases.id })
        .from(nerpExternalVerificationPhases)
        .where(and(eq(nerpExternalVerificationPhases.caseId, externalCase.id), eq(nerpExternalVerificationPhases.phase, input.phase)))
        .limit(1);
      if (existing) {
        await db.update(nerpExternalVerificationPhases).set(values).where(eq(nerpExternalVerificationPhases.id, existing.id));
      } else {
        await db.insert(nerpExternalVerificationPhases).values({ caseId: externalCase.id, phase: input.phase, ...values });
      }
      const phaseRows = await db.select().from(nerpExternalVerificationPhases).where(eq(nerpExternalVerificationPhases.caseId, externalCase.id));
      const phase2Verified = phaseRows.some(row => row.phase === "phase_2" && row.status === "verified");
      const phase3Verified = phaseRows.some(row => row.phase === "phase_3" && row.status === "verified");
      const nextStatus = phase2Verified && phase3Verified
        ? "complete"
        : phase2Verified || phase3Verified
          ? "partially_verified"
          : input.decision === "rejected" ? "rejected" : input.decision === "revoked" ? "revoked" : "open";
      await db.update(nerpExternalVerificationCases).set({ status: nextStatus, updatedByUserId: ctx.user.id, updatedAt: new Date() }).where(eq(nerpExternalVerificationCases.id, externalCase.id));
      await db.insert(nerpExternalVerificationAuditEvents).values({
        caseId: externalCase.id,
        action: `phase_${input.phase}_${input.decision}`,
        actorUserId: ctx.user.id,
        details: JSON.stringify({ reason: input.reason, evidenceReference: input.evidenceReference ?? null }),
      });

      let suppressionId: number | null = null;
      if (
        canEnterNerpNurseCampaign(externalCase.candidateType as ExternalNerpCandidateType) &&
        phase2Verified &&
        phase3Verified &&
        externalCase.institutionalAccountId
      ) {
        const matchType = externalCase.candidateEmail ? "email" : "exact_name";
        const matchValue = externalCase.candidateEmail ? normalizedEmail(externalCase.candidateEmail) : normalizedName(externalCase.candidateName);
        const [suppression] = await db
          .select({ id: nerpCampaignSuppressions.id })
          .from(nerpCampaignSuppressions)
          .where(and(
            eq(nerpCampaignSuppressions.institutionalAccountId, externalCase.institutionalAccountId),
            eq(nerpCampaignSuppressions.matchType, matchType),
            eq(nerpCampaignSuppressions.matchValue, matchValue)
          ))
          .limit(1);
        if (suppression) {
          suppressionId = suppression.id;
          await db.update(nerpCampaignSuppressions).set({ isActive: true, reasonCode: "external_completion", note: "Automatically suppressed after both external NERP phases were verified.", updatedByUserId: ctx.user.id, deactivatedAt: null, updatedAt: new Date() }).where(eq(nerpCampaignSuppressions.id, suppression.id));
        } else {
          const inserted = await db.insert(nerpCampaignSuppressions).values({ institutionalAccountId: externalCase.institutionalAccountId, matchType, matchValue, reasonCode: "external_completion", note: "Automatically suppressed after both external NERP phases were verified.", isActive: true, createdByUserId: ctx.user.id });
          suppressionId = Number((inserted as any)[0]?.id ?? (inserted as any).insertId ?? 0) || null;
        }
        if (suppressionId) {
          await db.insert(nerpCampaignSuppressionAuditEvents).values({ suppressionId, action: "external_completion_suppression", actorUserId: ctx.user.id, details: JSON.stringify({ caseId: externalCase.id }) });
        }
      }
      return {
        success: true as const,
        phase2Verified,
        phase3Verified,
        status: nextStatus,
        suppressionId,
        campaignEligible: canEnterNerpNurseCampaign(externalCase.candidateType as ExternalNerpCandidateType),
      };
    }),

  listCampaignSuppressions: adminProcedure
    .input(z.object({ institutionalAccountId: z.number().int().positive().default(3), includeInactive: z.boolean().default(false) }))
    .query(async ({ input }) => {
      const db = await requireDb();
      return db
        .select()
        .from(nerpCampaignSuppressions)
        .where(and(
          eq(nerpCampaignSuppressions.institutionalAccountId, input.institutionalAccountId),
          input.includeInactive ? sql`1=1` : eq(nerpCampaignSuppressions.isActive, true)
        ))
        .orderBy(desc(nerpCampaignSuppressions.updatedAt));
    }),

  upsertCampaignSuppression: adminProcedure
    .input(z.object({
      institutionalAccountId: z.number().int().positive().default(3),
      matchType: z.enum(["email", "exact_name"]),
      matchValue: z.string().trim().min(2).max(320),
      reasonCode: z.enum(["admin_nurse", "external_completion", "manual", "not_registered", "identity_correction", "unsubscribe", "hard_bounce"]),
      note: z.string().trim().max(2000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const matchValue = normalizedSuppressionValue(input.matchType, input.matchValue);
      if (input.matchType === "email" && !validEmail(matchValue)) throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a valid email address for an email suppression." });
      if (input.matchType === "exact_name" && normalizedName(matchValue).split(" ").length < 2) throw new TRPCError({ code: "BAD_REQUEST", message: "Use the person’s exact full name for a name suppression." });
      const [existing] = await db.select({ id: nerpCampaignSuppressions.id }).from(nerpCampaignSuppressions).where(and(eq(nerpCampaignSuppressions.institutionalAccountId, input.institutionalAccountId), eq(nerpCampaignSuppressions.matchType, input.matchType), eq(nerpCampaignSuppressions.matchValue, matchValue))).limit(1);
      let suppressionId: number;
      if (existing) {
        suppressionId = existing.id;
        await db.update(nerpCampaignSuppressions).set({ reasonCode: input.reasonCode, note: input.note?.trim() || null, isActive: true, updatedByUserId: ctx.user.id, deactivatedAt: null, updatedAt: new Date() }).where(eq(nerpCampaignSuppressions.id, existing.id));
      } else {
        const inserted = await db.insert(nerpCampaignSuppressions).values({ institutionalAccountId: input.institutionalAccountId, matchType: input.matchType, matchValue, reasonCode: input.reasonCode, note: input.note?.trim() || null, isActive: true, createdByUserId: ctx.user.id });
        suppressionId = Number((inserted as any)[0]?.id ?? (inserted as any).insertId ?? 0);
        if (!suppressionId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not save suppression." });
      }
      await db.insert(nerpCampaignSuppressionAuditEvents).values({ suppressionId, action: existing ? "suppression_reactivated" : "suppression_created", actorUserId: ctx.user.id, details: JSON.stringify({ matchType: input.matchType, matchValue, reasonCode: input.reasonCode }) });
      return { success: true as const, suppressionId, matchType: input.matchType, matchValue };
    }),

  deactivateCampaignSuppression: adminProcedure
    .input(z.object({ institutionalAccountId: z.number().int().positive().default(3), suppressionId: z.number().int().positive(), reason: z.string().trim().min(3).max(1000) }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const [row] = await db.select({ id: nerpCampaignSuppressions.id }).from(nerpCampaignSuppressions).where(and(eq(nerpCampaignSuppressions.id, input.suppressionId), eq(nerpCampaignSuppressions.institutionalAccountId, input.institutionalAccountId))).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Suppression record not found." });
      await db.update(nerpCampaignSuppressions).set({ isActive: false, updatedByUserId: ctx.user.id, deactivatedAt: new Date(), updatedAt: new Date() }).where(eq(nerpCampaignSuppressions.id, input.suppressionId));
      await db.insert(nerpCampaignSuppressionAuditEvents).values({ suppressionId: input.suppressionId, action: "suppression_deactivated", actorUserId: ctx.user.id, details: JSON.stringify({ reason: input.reason }) });
      return { success: true as const };
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
      const audience = await loadNerpPromotionAudience(db, input.institutionId, input.limit);
      return {
        offerKey: NERP_ACLS_OFFER_KEY,
        generatedAt: new Date().toISOString(),
        ...audience,
        emailSending: false as const,
      };
    }),

  sendPromotionCampaign: adminProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive().default(3),
        campaignKey: z.string().trim().min(1).max(128).default(NERP_PROMOTION_CAMPAIGN_KEY),
        confirmSend: z.literal(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.institutionId !== 3 || input.campaignKey !== NERP_PROMOTION_CAMPAIGN_KEY) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This controlled campaign is limited to the Institution 3 NERP audience.",
        });
      }
      const db = await requireDb();
      try {
        const candidates = await getNerpCampaignSendCandidates(db, input.institutionId);
        const processedEmails = new Set<string>();
        const failures: Array<{ email: string; error: string }> = [];
        let sent = 0;
        let skipped = 0;

        for (const candidate of candidates) {
          const emailKey = normalizedEmail(candidate.email) ?? candidate.email.trim().toLowerCase();
          if (processedEmails.has(emailKey)) {
            skipped += 1;
            continue;
          }
          processedEmails.add(emailKey);
          const existingRows = await db
            .select({ status: nerpCampaignDeliveries.status, createdAt: nerpCampaignDeliveries.createdAt })
            .from(nerpCampaignDeliveries)
            .where(
              and(
                eq(nerpCampaignDeliveries.campaignKey, input.campaignKey),
                eq(nerpCampaignDeliveries.recipientEmail, candidate.email),
              ),
            )
            .limit(1);
          const existing = existingRows[0];
          const sendingIsRecent =
            existing?.status === "sending" &&
            existing.createdAt &&
            Date.now() - existing.createdAt.getTime() < 30 * 60 * 1000;
          if (existing?.status === "sent" || sendingIsRecent) {
            skipped += 1;
            continue;
          }

          const deliveryValues = {
            campaignKey: input.campaignKey,
            institutionalAccountId: input.institutionId,
            staffId: candidate.staffId,
            userId: candidate.userId,
            recipientName: candidate.name,
            recipientEmail: candidate.email,
            subject: NERP_PROMOTION_SUBJECT,
            status: "sending" as const,
            messageId: null,
            errorMessage: null,
            sentByUserId: ctx.user.id,
            sentAt: null,
          };
          if (existing) {
            await db
              .update(nerpCampaignDeliveries)
              .set(deliveryValues)
              .where(
                and(
                  eq(nerpCampaignDeliveries.campaignKey, input.campaignKey),
                  eq(nerpCampaignDeliveries.recipientEmail, candidate.email),
                ),
              );
          } else {
            await db.insert(nerpCampaignDeliveries).values(deliveryValues);
          }

          const email = buildNerpPromotionEmail(candidate.name);
          const result = await sendEmail({
            to: candidate.email,
            subject: NERP_PROMOTION_SUBJECT,
            htmlBody: email.html,
            textBody: email.text,
          });
          if (result.success) {
            await db
              .update(nerpCampaignDeliveries)
              .set({ status: "sent", messageId: result.messageId, errorMessage: null, sentAt: new Date() })
              .where(
                and(
                  eq(nerpCampaignDeliveries.campaignKey, input.campaignKey),
                  eq(nerpCampaignDeliveries.recipientEmail, candidate.email),
                ),
              );
            sent += 1;
          } else {
            await db
              .update(nerpCampaignDeliveries)
              .set({ status: "failed", errorMessage: result.error.slice(0, 1000), sentAt: null })
              .where(
                and(
                  eq(nerpCampaignDeliveries.campaignKey, input.campaignKey),
                  eq(nerpCampaignDeliveries.recipientEmail, candidate.email),
                ),
              );
            failures.push({ email: candidate.email, error: result.error });
          }
        }

        return {
          campaignKey: input.campaignKey,
          candidateCount: candidates.length,
          sent,
          failed: failures.length,
          skipped,
          failures: failures.slice(0, 25),
        };
      } catch (error) {
        if (isMissingTableError(error, "nerpCampaignDeliveries")) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Campaign delivery audit is not ready. Apply migration 0145 before sending.",
          });
        }
        throw error;
      }
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
