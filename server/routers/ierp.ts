import { and, desc, eq, inArray, sum, like, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { ierpInternProfiles, ierpPhase1Evidence, ierpPayments, ierpProgramEnrollments, enrollments, users } from "../../drizzle/schema";
import { storageGet, storagePut } from "../storage";
import { getMpesaService } from "../services/mpesa";
import { getDb } from "../db";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { normalizeKenyanPhoneNumber } from "../../shared/kenyan-phone";
import {
  getAuthoritativePhase2CompletionStatus,
  getIerpEnrollment,
  getIerpInternProfileAccessMessage,
  getIerpInternProfile,
  getIerpPaymentAccess,
  getIerpPaymentAccessForUser,
  isIerpInternProfileReady,
  IERP_DESIGNATIONS,
  IERP_COGNITIVE_PROGRAMS,
  IERP_TOTAL_FEE_KES,
} from "../lib/ierp-program-state";
import { getPaedsResusCertificateStatusForUser } from "../lib/paeds-resus-certificate-issuance";
import { isMissingTableError } from "../lib/is-missing-db-table";
import { notifyIerpInternProfileDecision, notifyIerpPhase1Decision } from "../lib/cohort-program-notifications";
import { consumeGlobalEntitlement, findActiveGlobalEntitlement } from "../lib/global-entitlements";

function parseDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function cadreForIerpDesignation(designation: (typeof IERP_DESIGNATIONS)[number]) {
  if (designation === "noi") return { cadre: "NOI", cadreOther: null };
  if (designation === "moi") return { cadre: "MOI", cadreOther: null };
  return {
    cadre: "COI",
    cadreOther: designation === "coi_bsc" ? "BSc Clinical Officer Intern" : "Diploma Clinical Officer Intern",
  };
}

function internProfileProjection(profile: typeof ierpInternProfiles.$inferSelect) {
  return {
    id: profile.id,
    designation: profile.designation,
    officialLetterReferenceNumber: profile.officialLetterReferenceNumber,
    effectiveCommencementDate: profile.effectiveCommencementDate,
    deploymentLetterFileName: profile.deploymentLetterFileName,
    deploymentLetterContentType: profile.deploymentLetterContentType,
    deploymentLetterSizeBytes: profile.deploymentLetterSizeBytes,
    status: profile.status,
    verifiedAt: profile.verifiedAt,
    reviewReason: profile.reviewReason,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export const ierpRouter = router({
  /** Return the user's current intern registration without exposing storage keys. */
  getMyInternProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const profile = await getIerpInternProfile(db, ctx.user.id);
    return profile ? internProfileProjection(profile) : null;
  }),

  /** Submit or replace the private MoH deployment/posting evidence for the profile. */
  submitInternProfile: protectedProcedure
    .input(z.object({
      designation: z.enum(IERP_DESIGNATIONS),
      officialLetterReferenceNumber: z.string().trim().min(2).max(255),
      effectiveCommencementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      deploymentLetterFileName: z.string().trim().min(1).max(255),
      deploymentLetterContentType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
      deploymentLetterDataBase64: z.string().min(1).max(20_000_000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const effectiveCommencementDate = parseDateOnly(input.effectiveCommencementDate);
      if (!effectiveCommencementDate) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Effective commencement date must be a valid YYYY-MM-DD date." });
      }
      const encoded = input.deploymentLetterDataBase64.replace(/^data:[^;]+;base64,/, "");
      const bytes = Buffer.from(encoded, "base64");
      if (bytes.length === 0 || bytes.length > 10 * 1024 * 1024) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The MoH deployment/posting letter must be between 1 byte and 10 MB." });
      }
      const stored = await storagePut(
        `ierp/${ctx.user.id}/intern-profile/${randomUUID()}-${input.deploymentLetterFileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
        bytes,
        input.deploymentLetterContentType,
      );
      const current = await getIerpInternProfile(db, ctx.user.id);
      const cadre = cadreForIerpDesignation(input.designation);
      const values = {
        userId: ctx.user.id,
        designation: input.designation,
        officialLetterReferenceNumber: input.officialLetterReferenceNumber.trim(),
        effectiveCommencementDate,
        deploymentLetterKey: stored.key,
        deploymentLetterFileName: input.deploymentLetterFileName.trim(),
        deploymentLetterContentType: input.deploymentLetterContentType,
        deploymentLetterSizeBytes: bytes.length,
        status: "pending" as const,
        verifiedByUserId: null,
        verifiedAt: null,
        reviewReason: null,
        updatedAt: new Date(),
      };
      if (current) {
        await db.update(ierpInternProfiles).set(values).where(eq(ierpInternProfiles.id, current.id));
      } else {
        await db.insert(ierpInternProfiles).values(values);
      }
      await db.update(users).set({ cadre: cadre.cadre, cadreOther: cadre.cadreOther, updatedAt: new Date() }).where(eq(users.id, ctx.user.id));
      const saved = await getIerpInternProfile(db, ctx.user.id);
      if (!saved) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Intern profile could not be saved." });
      return { success: true as const, profile: internProfileProjection(saved) };
    }),

  /** Provider-owned short-lived URL for the submitted deployment/posting letter. */
  getMyInternProfileEvidenceUrl: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const profile = await getIerpInternProfile(db, ctx.user.id);
    if (!profile?.deploymentLetterKey) throw new TRPCError({ code: "NOT_FOUND", message: "Intern profile evidence not found." });
    return storageGet(profile.deploymentLetterKey);
  }),

  /** Platform-admin list for reviewing intern eligibility evidence. */
  listInternProfiles: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    let rows: Array<{ profile: typeof ierpInternProfiles.$inferSelect; userName: string | null; userEmail: string | null }> = [];
    try {
      rows = await db
        .select({
          profile: ierpInternProfiles,
          userName: users.name,
          userEmail: users.email,
        })
        .from(ierpInternProfiles)
        .innerJoin(users, eq(users.id, ierpInternProfiles.userId))
        .orderBy(desc(ierpInternProfiles.updatedAt));
    } catch (error) {
      if (!isMissingTableError(error, "ierpInternProfiles")) throw error;
    }
    return rows.map(({ profile, userName, userEmail }) => ({
      ...internProfileProjection(profile),
      userId: profile.userId,
      userName,
      userEmail,
      evidenceAvailable: Boolean(profile.deploymentLetterKey),
    }));
  }),

  listPhase1EvidenceForReview: adminProcedure
    .input(z.object({ search: z.string().trim().max(120).optional(), limit: z.number().int().min(1).max(200).default(100) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const search = input.search ? `%${input.search}%` : undefined;
      const rows = await db
        .select({
          programEnrollmentId: ierpPhase1Evidence.programEnrollmentId,
          evidenceId: ierpPhase1Evidence.id,
          documentType: ierpPhase1Evidence.documentType,
          fileName: ierpPhase1Evidence.fileName,
          status: ierpPhase1Evidence.status,
          submittedAt: ierpPhase1Evidence.submittedAt,
          reviewedAt: ierpPhase1Evidence.reviewedAt,
          reviewReason: ierpPhase1Evidence.reviewReason,
          userId: ierpPhase1Evidence.userId,
          userName: users.name,
          userEmail: users.email,
          phase1Status: ierpProgramEnrollments.phase1Status,
        })
        .from(ierpPhase1Evidence)
        .innerJoin(ierpProgramEnrollments, eq(ierpProgramEnrollments.id, ierpPhase1Evidence.programEnrollmentId))
        .innerJoin(users, eq(users.id, ierpPhase1Evidence.userId))
        .where(and(
          sql`${ierpPhase1Evidence.status} IN ('submitted', 'rejected')`,
          search ? or(like(users.name, search), like(users.email, search)) : undefined,
        ))
        .orderBy(desc(ierpPhase1Evidence.submittedAt))
        .limit(input.limit);
      return rows;
    }),

  getInternProfileEvidenceUrl: adminProcedure
    .input(z.object({ profileId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [profile] = await db.select({ deploymentLetterKey: ierpInternProfiles.deploymentLetterKey }).from(ierpInternProfiles).where(eq(ierpInternProfiles.id, input.profileId)).limit(1);
      if (!profile?.deploymentLetterKey) throw new TRPCError({ code: "NOT_FOUND", message: "Intern profile evidence not found." });
      return storageGet(profile.deploymentLetterKey);
    }),

  reviewInternProfile: adminProcedure
    .input(z.object({ profileId: z.number().int().positive(), decision: z.enum(["verified", "rejected", "revoked"]), reason: z.string().trim().min(3).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [profile] = await db.select({ id: ierpInternProfiles.id }).from(ierpInternProfiles).where(eq(ierpInternProfiles.id, input.profileId)).limit(1);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Intern profile not found." });
      await db.update(ierpInternProfiles).set({ status: input.decision, verifiedByUserId: ctx.user.id, verifiedAt: new Date(), reviewReason: input.reason, updatedAt: new Date() }).where(eq(ierpInternProfiles.id, input.profileId));
      void notifyIerpInternProfileDecision(db, input.profileId, input.decision, input.reason);
      return { success: true as const, decision: input.decision };
    }),

  /** Return the user's IERP enrolment, without exposing institutional records. */
  getMyEnrollment: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return getIerpEnrollment(db, ctx.user.id);
  }),

  /**
   * Start the Intern Emergency Readiness Program after the individual intern
   * profile has been submitted. This writes only the user-owned IERP table and
   * is idempotent; it does not create an institutional staff record.
   */
  start: protectedProcedure
    .input(z.object({ designation: z.enum(IERP_DESIGNATIONS) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const internProfile = await getIerpInternProfile(db, ctx.user.id);
      const profileAccessMessage = getIerpInternProfileAccessMessage(internProfile);
      if (profileAccessMessage) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: profileAccessMessage });
      }
      if (!isIerpInternProfileReady(internProfile)) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete your Intern profile and submit your MoH deployment/posting letter before starting IERP." });
      }
      if (internProfile.designation !== input.designation) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your IERP designation must match the designation on your Intern profile.",
        });
      }

      const existing = await getIerpEnrollment(db, ctx.user.id);
      if (existing) {
        if (existing.lifecycleStatus === "withdrawn") {
          throw new TRPCError({ code: "CONFLICT", message: "This IERP enrolment was withdrawn. Contact the programme team before restarting." });
        }
        let current = existing;
        if (!current.entitlementId && current.paymentStatus !== "not_required" && Number(current.totalPaidAmount ?? 0) === 0) {
          const entitlement = await findActiveGlobalEntitlement(db, { programType: "ierp", userId: ctx.user.id });
          if (entitlement) {
            const applied = await consumeGlobalEntitlement(db, {
              entitlementId: entitlement.id,
              targetUserId: ctx.user.id,
              programType: "ierp",
              resourceReference: `ierp-enrollment-${current.id}`,
              originalAmountKes: IERP_TOTAL_FEE_KES,
              redeemedByUserId: ctx.user.id,
            });
            if (applied) {
              await db.update(ierpProgramEnrollments).set({ entitlementId: entitlement.id, effectiveFeeKes: applied.effectiveAmountKes, paymentStatus: applied.effectiveAmountKes === 0 ? "not_required" : "pending", updatedAt: new Date() }).where(eq(ierpProgramEnrollments.id, current.id));
              current = (await getIerpEnrollment(db, ctx.user.id)) ?? current;
            }
          }
        }
        const payment = getIerpPaymentAccess({
          ...current,
          effectiveCommencementDate: internProfile.effectiveCommencementDate,
        });
        return { success: true, created: false, enrollmentId: current.id, designation: current.designation, cognitiveAccessLocked: payment.cognitiveAccessLocked, paymentDeadline: payment.paymentDeadline?.toISOString() ?? null, effectiveFeeKes: payment.requiredFeeKes };
      }

      const enrolledAt = new Date();
      const entitlement = await findActiveGlobalEntitlement(db, { programType: "ierp", userId: ctx.user.id });
      const inserted = await db
        .insert(ierpProgramEnrollments)
        .values({
          userId: ctx.user.id,
          programKey: "ierp",
          designation: input.designation,
          lifecycleStatus: "active",
          phaseStatus: "phase_1",
          phase1Status: "not_started",
          paymentStatus: "pending",
          enrolledAt,
        })
        .$returningId();
      const enrollmentId = (inserted as { id?: number }[])[0]?.id ?? 0;
      if (!enrollmentId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "IERP enrolment could not be created" });
      let appliedEntitlement = null;
      if (entitlement) {
        appliedEntitlement = await consumeGlobalEntitlement(db, {
          entitlementId: entitlement.id,
          targetUserId: ctx.user.id,
          programType: "ierp",
          resourceReference: `ierp-enrollment-${enrollmentId}`,
          originalAmountKes: IERP_TOTAL_FEE_KES,
          redeemedByUserId: ctx.user.id,
        });
        if (appliedEntitlement) {
          await db.update(ierpProgramEnrollments).set({
            entitlementId: entitlement.id,
            effectiveFeeKes: appliedEntitlement.effectiveAmountKes,
            paymentStatus: appliedEntitlement.effectiveAmountKes === 0 ? "not_required" : "pending",
            updatedAt: new Date(),
          }).where(eq(ierpProgramEnrollments.id, enrollmentId));
        }
      }
      const payment = getIerpPaymentAccess({ enrolledAt, totalPaidAmount: "0.00", effectiveFeeKes: appliedEntitlement?.effectiveAmountKes ?? null, paymentStatus: appliedEntitlement?.effectiveAmountKes === 0 ? "not_required" : "pending" });
      return { success: true, created: true, enrollmentId, designation: input.designation, cognitiveAccessLocked: payment.cognitiveAccessLocked, paymentDeadline: payment.paymentDeadline?.toISOString() ?? null, effectiveFeeKes: payment.requiredFeeKes };
    }),

  /**
   * Submit both required Phase 1 documents. The content is uploaded to
   * private storage and only object metadata is retained in the database.
   */
  submitPhase1Evidence: protectedProcedure
    .input(z.object({
      documents: z.array(z.object({
        documentType: z.enum(["video_prework", "precourse_assessment"]),
        fileName: z.string().trim().min(1).max(255),
        contentType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
        dataBase64: z.string().min(1).max(20_000_000),
      })).length(2),
    }).superRefine((value, ctx) => {
      const types = value.documents.map((document) => document.documentType);
      if (new Set(types).size !== 2) {
        ctx.addIssue({ code: "custom", message: "Submit exactly one Video Prework document and one Precourse Self-Assessment document." });
      }
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const program = await getIerpEnrollment(db, ctx.user.id);
      if (!program) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Start IERP before submitting Phase 1 evidence." });
      const internProfile = await getIerpInternProfile(db, ctx.user.id);
      const profileAccessMessage = getIerpInternProfileAccessMessage(internProfile);
      if (profileAccessMessage) {
        throw new TRPCError({ code: "FORBIDDEN", message: profileAccessMessage });
      }
      if (!isIerpInternProfileReady(internProfile)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Complete your Intern profile and submit your MoH deployment/posting letter before accessing IERP coursework." });
      }
      const payment = getIerpPaymentAccess({
        ...program,
        effectiveCommencementDate: internProfile.effectiveCommencementDate,
      });
      if (payment.cognitiveAccessLocked) {
        throw new TRPCError({ code: "FORBIDDEN", message: `Complete the IERP programme payment of KES ${payment.requiredFeeKes.toLocaleString()} before accessing or submitting Phase 1 coursework.` });
      }

      const ahaRows = await db
        .select({ programType: enrollments.programType, cognitiveModulesComplete: enrollments.cognitiveModulesComplete })
        .from(enrollments)
        .where(and(eq(enrollments.userId, ctx.user.id), inArray(enrollments.programType, [...IERP_COGNITIVE_PROGRAMS])));
      const cognitive = new Map(ahaRows.map((row) => [row.programType, !!row.cognitiveModulesComplete]));
      if (!cognitive.get("bls")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Complete the platform BLS cognitive modules before uploading Phase 1 evidence." });
      }
      const hasAdvancedCognitive = IERP_COGNITIVE_PROGRAMS.filter((programType) => programType !== "bls").some((programType) => cognitive.get(programType));
      if (!hasAdvancedCognitive) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Complete the platform ACLS, PALS, or NRP cognitive modules before uploading Phase 1 evidence." });
      }

      for (const document of input.documents) {
        const raw = document.dataBase64.replace(/^data:[^;]+;base64,/, "");
        const bytes = Buffer.from(raw, "base64");
        if (bytes.length === 0 || bytes.length > 10 * 1024 * 1024) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Each Phase 1 document must be between 1 byte and 10 MB." });
        }
        const key = `ierp/${ctx.user.id}/${program.id}/phase1/${document.documentType}/${randomUUID()}-${document.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const stored = await storagePut(key, bytes, document.contentType);
        const existing = await db
          .select({ id: ierpPhase1Evidence.id })
          .from(ierpPhase1Evidence)
          .where(and(eq(ierpPhase1Evidence.programEnrollmentId, program.id), eq(ierpPhase1Evidence.documentType, document.documentType)))
          .limit(1);
        const values = {
          programEnrollmentId: program.id,
          userId: ctx.user.id,
          documentType: document.documentType,
          storageKey: stored.key,
          fileName: document.fileName,
          contentType: document.contentType,
          fileSizeBytes: bytes.length,
          status: "submitted" as const,
          submittedAt: new Date(),
          reviewedByUserId: null,
          reviewedAt: null,
          reviewReason: null,
          updatedAt: new Date(),
        };
        if (existing[0]) {
          await db.update(ierpPhase1Evidence).set(values).where(eq(ierpPhase1Evidence.id, existing[0].id));
        } else {
          await db.insert(ierpPhase1Evidence).values(values);
        }
      }
      await db.update(ierpProgramEnrollments).set({ phase1Status: "submitted", updatedAt: new Date() }).where(eq(ierpProgramEnrollments.id, program.id));
      return { success: true as const, status: "submitted" as const };
    }),

  /** Owner or platform admin may request a signed/private download URL. */
  getPhase1EvidenceDownloadUrl: protectedProcedure
    .input(z.object({ evidenceId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [evidence] = await db.select().from(ierpPhase1Evidence).where(eq(ierpPhase1Evidence.id, input.evidenceId)).limit(1);
      if (!evidence) throw new TRPCError({ code: "NOT_FOUND", message: "Evidence not found" });
      if (evidence.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You may only access your own IERP evidence." });
      }
      return storageGet(evidence.storageKey);
    }),

  /** Admin review is programme-scoped and never grants IERS membership. */
  reviewPhase1Evidence: protectedProcedure
    .input(z.object({ programEnrollmentId: z.number().int().positive(), approve: z.boolean(), reviewReason: z.string().trim().max(1000).optional() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only a platform reviewer can review IERP Phase 1 evidence." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [program] = await db.select({ id: ierpProgramEnrollments.id }).from(ierpProgramEnrollments).where(eq(ierpProgramEnrollments.id, input.programEnrollmentId)).limit(1);
      if (!program) throw new TRPCError({ code: "NOT_FOUND", message: "IERP enrolment not found" });
      const evidence = await db.select({ id: ierpPhase1Evidence.id, documentType: ierpPhase1Evidence.documentType }).from(ierpPhase1Evidence).where(eq(ierpPhase1Evidence.programEnrollmentId, input.programEnrollmentId));
      if (input.approve && new Set(evidence.map((row) => row.documentType)).size !== 2) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Both IERP Phase 1 evidence documents are required before approval." });
      }
      await db.update(ierpPhase1Evidence).set({ status: input.approve ? "verified" : "rejected", reviewedByUserId: ctx.user.id, reviewedAt: new Date(), reviewReason: input.reviewReason ?? null, updatedAt: new Date() }).where(eq(ierpPhase1Evidence.programEnrollmentId, input.programEnrollmentId));
      await db.update(ierpProgramEnrollments).set({ phase1Status: input.approve ? "verified" : "rejected", phaseStatus: input.approve ? "phase_2" : "phase_1", phase1VerifiedAt: input.approve ? new Date() : null, updatedAt: new Date() }).where(eq(ierpProgramEnrollments.id, input.programEnrollmentId));
      void notifyIerpPhase1Decision(db, input.programEnrollmentId, input.approve ? "verified" : "rejected", input.reviewReason);
      return { success: true as const, approved: input.approve };
    }),

  /** Return only the IERP ledger; NERP and IERS payments are separate. */
  getPaymentLedger: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const program = await getIerpEnrollment(db, ctx.user.id);
    if (!program) return null;
    const rows = await db.select().from(ierpPayments).where(eq(ierpPayments.programEnrollmentId, program.id)).orderBy(desc(ierpPayments.createdAt));
    const totalPaid = rows.filter((row) => row.status === "completed").reduce((total, row) => total + row.amountKsh, 0);
      return {
      programEnrollmentId: program.id,
      feeKsh: program.effectiveFeeKes ?? IERP_TOTAL_FEE_KES,
      totalPaidKsh: totalPaid,
      balanceKsh: Math.max(0, (program.effectiveFeeKes ?? IERP_TOTAL_FEE_KES) - totalPaid),
      isPaidInFull: program.paymentStatus === "not_required" || totalPaid >= (program.effectiveFeeKes ?? IERP_TOTAL_FEE_KES),
      status: program.paymentStatus,
      entries: rows,
    };
  }),

  /** Start an IERP payment intent; the callback later finalises this row. */
  initiatePayment: protectedProcedure
    .input(z.object({ amountKsh: z.number().int().min(1).max(IERP_TOTAL_FEE_KES), phase: z.enum(["phase_1", "phase_2", "phase_3", "general"]), phoneNumber: z.string().trim().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const program = await getIerpEnrollment(db, ctx.user.id);
      if (!program) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Start IERP before making a programme payment." });
      const internProfile = await getIerpInternProfile(db, ctx.user.id);
      const profileAccessMessage = getIerpInternProfileAccessMessage(internProfile);
      if (profileAccessMessage) {
        throw new TRPCError({ code: "FORBIDDEN", message: profileAccessMessage });
      }
      if (!isIerpInternProfileReady(internProfile)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Complete your Intern profile and submit your MoH deployment/posting letter before making an IERP payment." });
      }
      const paidRows = await db.select({ total: sum(ierpPayments.amountKsh) }).from(ierpPayments).where(and(eq(ierpPayments.programEnrollmentId, program.id), eq(ierpPayments.status, "completed")));
      const totalPaid = Number(paidRows[0]?.total ?? 0);
      const effectiveFeeKes = program.effectiveFeeKes ?? IERP_TOTAL_FEE_KES;
      const remaining = Math.max(0, effectiveFeeKes - totalPaid);
      const paymentAccess = getIerpPaymentAccess({
        ...program,
        effectiveCommencementDate: internProfile.effectiveCommencementDate,
      });
      if (remaining <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The IERP programme is already fully paid." });
      }
      const [pendingPayment] = await db
        .select({ id: ierpPayments.id })
        .from(ierpPayments)
        .where(and(eq(ierpPayments.programEnrollmentId, program.id), eq(ierpPayments.status, "pending")))
        .limit(1);
      if (pendingPayment) {
        throw new TRPCError({ code: "CONFLICT", message: "An IERP payment is already awaiting M-Pesa confirmation. Wait for the result before trying again." });
      }
      if (input.amountKsh !== remaining) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `IERP requires one full payment of the remaining KES ${remaining.toLocaleString()} balance. Instalment amounts are not accepted.` });
      }
      const phoneNumber = normalizeKenyanPhoneNumber(input.phoneNumber);
      if (!phoneNumber) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a valid Kenyan mobile number, for example 254712345678, +254712345678, or 0712345678." });
      }
      const reference = `IERP-${program.id}-${ctx.user.id}-${Date.now()}`;
      const response = await getMpesaService().initiateSTKPush(phoneNumber, input.amountKsh, reference, "IERP programme payment");
      const checkoutRequestId = response.CheckoutRequestID;
      if (!checkoutRequestId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "M-Pesa did not return a checkout request ID." });
      await db.insert(ierpPayments).values({
        programEnrollmentId: program.id,
        userId: ctx.user.id,
        amountKsh: input.amountKsh,
        phase: input.phase,
        paymentMethod: "mpesa",
        checkoutRequestId,
        providerReference: response.MerchantRequestID ?? null,
        idempotencyKey: checkoutRequestId,
        phoneNumber,
        status: "pending",
      });
      return { success: true as const, checkoutRequestId, message: response.CustomerMessage ?? "Confirm the M-Pesa prompt on your phone." };
    }),

  /** Lightweight dashboard CTA state; avoids loading Phase 2 and certificate data. */
  getDashboardAccess: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const program = await getIerpEnrollment(db, ctx.user.id);
    if (!program) return null;
    const [ahaRows, payment] = await Promise.all([
      db
        .select({ id: enrollments.id, courseId: enrollments.courseId, programType: enrollments.programType, cognitiveModulesComplete: enrollments.cognitiveModulesComplete })
        .from(enrollments)
        .where(and(eq(enrollments.userId, ctx.user.id), eq(enrollments.programType, "bls")))
        .orderBy(desc(enrollments.createdAt))
        .limit(1),
      getIerpPaymentAccessForUser(db, ctx.user.id),
    ]);
    return {
      enrollmentId: program.id,
      lifecycleStatus: program.lifecycleStatus,
      payment: payment ?? getIerpPaymentAccess({ ...program, effectiveCommencementDate: null }),
      bls: ahaRows[0] ?? null,
    };
  }),

  /**
   * Authoritative IERP learner summary. Phase 2 is calculated from confirmed
   * named roles and approved claims; it never uses the legacy generic counts.
   */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const program = await getIerpEnrollment(db, ctx.user.id);
    if (!program) return null;

    const [ahaRows, evidence, phase2, payment, universalCertificates] = await Promise.all([
      db
        .select({
          id: enrollments.id,
          courseId: enrollments.courseId,
          programType: enrollments.programType,
          cognitiveModulesComplete: enrollments.cognitiveModulesComplete,
          practicalSkillsSignedOff: enrollments.practicalSkillsSignedOff,
          paymentStatus: enrollments.paymentStatus,
        })
        .from(enrollments)
        .where(and(eq(enrollments.userId, ctx.user.id), inArray(enrollments.programType, [...IERP_COGNITIVE_PROGRAMS])))
        .orderBy(desc(enrollments.createdAt)),
      db
        .select({
          id: ierpPhase1Evidence.id,
          documentType: ierpPhase1Evidence.documentType,
          fileName: ierpPhase1Evidence.fileName,
          contentType: ierpPhase1Evidence.contentType,
          fileSizeBytes: ierpPhase1Evidence.fileSizeBytes,
          status: ierpPhase1Evidence.status,
          submittedAt: ierpPhase1Evidence.submittedAt,
          reviewedAt: ierpPhase1Evidence.reviewedAt,
          reviewReason: ierpPhase1Evidence.reviewReason,
        })
        .from(ierpPhase1Evidence)
        .where(eq(ierpPhase1Evidence.programEnrollmentId, program.id))
        .orderBy(desc(ierpPhase1Evidence.updatedAt)),
      getAuthoritativePhase2CompletionStatus(db, ctx.user.id),
      getIerpPaymentAccessForUser(db, ctx.user.id).then(
        (payment) => payment ?? getIerpPaymentAccess({ ...program, effectiveCommencementDate: null }),
      ),
      getPaedsResusCertificateStatusForUser(db, ctx.user.id).catch((error) => {
        // Certificate schema rollout must not hide the underlying authoritative
        // IERP progression state while the additive migration is propagating.
        console.error("[ierp.getSummary] Universal certificate status unavailable:", error);
        return [] as Awaited<ReturnType<typeof getPaedsResusCertificateStatusForUser>>;
      }),
    ]);
    const phase1EvidenceVerified =
      evidence.some((row) => row.documentType === "video_prework" && row.status === "verified") &&
      evidence.some((row) => row.documentType === "precourse_assessment" && row.status === "verified");
    const phase1Complete = program.phase1Status === "verified" || phase1EvidenceVerified;
    const phase3GateUnlocked = phase1Complete && phase2.phase2Complete && payment.isPaidInFull;
    const phase2Certificate = universalCertificates.find((certificate) => certificate.programType === "paeds_resus_phase2") ?? null;
    const providerCertificates = universalCertificates.filter((certificate) => certificate.programType !== "paeds_resus_phase2");

    return {
      programName: "Intern Emergency Readiness Program",
      programKey: "ierp" as const,
      enrollmentId: program.id,
      designation: program.designation,
      lifecycleStatus: program.lifecycleStatus,
      phaseStatus: program.phaseStatus,
      phase1Status: program.phase1Status,
      phase1Complete,
      phase1Evidence: evidence,
      phase2,
      phase2Certificate,
      providerCertificates,
      phase3GateUnlocked,
      payment: {
        status: program.paymentStatus,
        totalPaid: payment.paid,
        paymentDeadline: payment.paymentDeadline?.toISOString() ?? null,
        deferredStartWindow: payment.deferredStartWindow,
        cognitiveAccessLocked: payment.cognitiveAccessLocked,
        phase2BookingLocked: payment.phase2BookingLocked,
        paymentLockoutActive: payment.paymentLockoutActive,
      },
      aha: ahaRows,
    };
  }),
});
