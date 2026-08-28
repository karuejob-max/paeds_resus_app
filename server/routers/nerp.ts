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
  professionalCredentials,
  users,
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
import {
  findCampaignSuppression,
  normalizedEmail,
  normalizedName,
  normalizedSuppressionValue,
  validEmail,
} from "../lib/nerp-campaign-controls";
import {
  canEnterNerpNurseCampaign,
  requiresExternalCandidateCadre,
  type ExternalNerpCandidateType,
} from "../lib/nerp-external-candidate";
import {
  canStartNerpWithCredential,
  getNerpCredentialState,
} from "../lib/aha-access";
import { consumeGlobalEntitlement, findActiveGlobalEntitlement } from "../lib/global-entitlements";

const PHASES = ["phase_2", "phase_3"] as const;
const DECISIONS = ["verified", "rejected", "revoked"] as const;
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

async function getLatestNerpCredentialForUser(db: any, userId: number) {
  const rows = await db
    .select({
      issuer: professionalCredentials.issuer,
      jurisdiction: professionalCredentials.jurisdiction,
      credentialNumber: professionalCredentials.credentialNumber,
      expiresAt: professionalCredentials.expiresAt,
      evidenceKey: professionalCredentials.evidenceKey,
      status: professionalCredentials.status,
      reviewReason: professionalCredentials.reviewReason,
    })
    .from(professionalCredentials)
    .where(
      and(
        eq(professionalCredentials.userId, userId),
        eq(professionalCredentials.credentialType, "regulatory_license"),
      ),
    )
    .orderBy(desc(professionalCredentials.updatedAt))
    .limit(1);
  return rows[0] ?? null;
}

function nerpCredentialBlockMessage(
  state: ReturnType<typeof getNerpCredentialState>,
  reviewReason?: string | null,
) {
  if (state === "rejected") {
    return `Your Nursing Council of Kenya licence submission was rejected.${reviewReason ? ` Review reason: ${reviewReason}` : " Review Professional Credentials for the correction required."}`;
  }
  if (state === "revoked") {
    return `Your Nursing Council of Kenya licence is revoked.${reviewReason ? ` Review reason: ${reviewReason}` : " Review Professional Credentials before continuing."}`;
  }
  if (state === "expired") {
    return "Your Nursing Council of Kenya licence is expired. Update Professional Credentials before continuing.";
  }
  if (state === "pending_review") {
    return "Your Nursing Council of Kenya licence is submitted and under review. You may begin the NERP payment and coursework while review is pending; access will stop if the submission is rejected or revoked.";
  }
  return "Submit Nursing Council of Kenya licence evidence and a licence number in Professional Credentials before starting NERP.";
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
  if (!offer.entitlementId && offer.status === "active") {
    const entitlement = await findActiveGlobalEntitlement(db, { programType: "nerp", userId });
    if (entitlement) {
      const originalTotalAmountKes = NERP_ACLS_OFFER.totalAmountKes;
      const applied = await consumeGlobalEntitlement(db, {
        entitlementId: entitlement.id,
        targetUserId: userId,
        programType: "nerp",
        resourceReference: `nerp-offer-${offer.id}`,
        originalAmountKes: originalTotalAmountKes,
        redeemedByUserId: userId,
      });
      if (applied) {
        const amountAlreadyPaid = Number(offer.amountPaidKes ?? 0);
        const effectiveTotal = Math.max(amountAlreadyPaid, applied.effectiveAmountKes);
        const installment = effectiveTotal === 0 ? 0 : Math.ceil(effectiveTotal / NERP_ACLS_OFFER.installmentCount);
        await db.update(nerpOfferEnrollments).set({
          entitlementId: entitlement.id,
          originalTotalAmountKes: originalTotalAmountKes.toFixed(2),
          totalAmountKes: effectiveTotal.toFixed(2),
          monthlyInstallmentKes: installment.toFixed(2),
          status: effectiveTotal === 0 ? "completed" : "active",
          nextInstallmentNumber: effectiveTotal === 0 ? NERP_ACLS_OFFER.installmentCount + 1 : offer.nextInstallmentNumber,
          completedAt: effectiveTotal === 0 ? new Date() : null,
          updatedAt: new Date(),
        }).where(eq(nerpOfferEnrollments.id, offer.id));
        if (effectiveTotal === 0) {
          await db.update(enrollments).set({ paymentStatus: "completed", updatedAt: new Date() }).where(and(eq(enrollments.userId, userId), or(eq(enrollments.programType, "bls"), eq(enrollments.programType, "acls"))));
        }
        offer = (await db.select().from(nerpOfferEnrollments).where(eq(nerpOfferEnrollments.id, offer.id)).limit(1))[0] ?? offer;
      }
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
    const latestCredential = await getLatestNerpCredentialForUser(db, ctx.user.id);
    const credentialState = getNerpCredentialState(latestCredential);
    const eligible = canStartNerpWithCredential(credentialState);
    return {
      eligible,
      verificationState: credentialState,
      state: credentialState,
      reviewReason: latestCredential?.reviewReason ?? null,
      message: nerpCredentialBlockMessage(credentialState, latestCredential?.reviewReason),
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
    const credential = await getLatestNerpCredentialForUser(db, ctx.user.id);
    const credentialState = getNerpCredentialState(credential);
    if (!canStartNerpWithCredential(credentialState)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: nerpCredentialBlockMessage(credentialState, credential?.reviewReason),
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

  getPathwayEntry: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const credential = await getLatestNerpCredentialForUser(db, ctx.user.id);
    const credentialState = getNerpCredentialState(credential);
    if (!canStartNerpWithCredential(credentialState)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: nerpCredentialBlockMessage(credentialState, credential?.reviewReason),
      });
    }
    const { offer, children } = await ensureOfferForUser(db, ctx.user.id);
    // A fully paid offer still needs the learning pathway for coursework,
    // practical requirements, and certification progress. Only checkout should
    // stop once the financial obligation is complete.
    const paymentState = calculateNerpPaymentState({
      amountPaidKes: Number(offer.amountPaidKes),
      totalAmountKes: Number(offer.totalAmountKes),
      monthlyInstallmentKes: Number(offer.monthlyInstallmentKes),
      installmentCount: offer.installmentCount,
    });
    return {
      offer,
      paymentState,
      bls: {
        enrollmentId: children.bls.id,
        cognitiveModulesComplete: children.bls.cognitiveModulesComplete,
        practicalSkillsSignedOff: children.bls.practicalSkillsSignedOff,
      },
      acls: {
        enrollmentId: children.acls.id,
        cognitiveModulesComplete: children.acls.cognitiveModulesComplete,
        practicalSkillsSignedOff: children.acls.practicalSkillsSignedOff,
      },
    };
  }),

  getCheckoutContext: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const credential = await getLatestNerpCredentialForUser(db, ctx.user.id);
    const credentialState = getNerpCredentialState(credential);
    if (!canStartNerpWithCredential(credentialState)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: nerpCredentialBlockMessage(credentialState, credential?.reviewReason),
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
      bls: {
        enrollmentId: children.bls.id,
        cognitiveModulesComplete: children.bls.cognitiveModulesComplete,
      },
      acls: {
        enrollmentId: children.acls.id,
        cognitiveModulesComplete: children.acls.cognitiveModulesComplete,
      },
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
