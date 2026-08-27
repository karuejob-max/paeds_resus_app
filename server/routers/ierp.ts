import { and, desc, eq, inArray, sum } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { ierpPhase1Evidence, ierpPayments, ierpProgramEnrollments, enrollments } from "../../drizzle/schema";
import { storageGet, storagePut } from "../storage";
import { getMpesaService } from "../services/mpesa";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getAuthoritativePhase2CompletionStatus,
  getIerpEnrollment,
  getIerpPaymentLockout,
  IERP_DESIGNATIONS,
} from "../lib/ierp-program-state";

const IERP_AHA_PROGRAMS = ["bls", "acls", "pals", "nrp"] as const;

export const ierpRouter = router({
  /** Return the user's IERP enrolment, without exposing institutional records. */
  getMyEnrollment: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return getIerpEnrollment(db, ctx.user.id);
  }),

  /**
   * Start the Intern Emergency Readiness Program without a facility or staff
   * record. This writes only the user-owned IERP table and is idempotent.
   */
  start: protectedProcedure
    .input(z.object({ designation: z.enum(IERP_DESIGNATIONS) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const existing = await getIerpEnrollment(db, ctx.user.id);
      if (existing) {
        if (existing.lifecycleStatus === "withdrawn") {
          throw new TRPCError({ code: "CONFLICT", message: "This IERP enrolment was withdrawn. Contact the programme team before restarting." });
        }
        return { success: true, created: false, enrollmentId: existing.id, designation: existing.designation };
      }

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
          enrolledAt: new Date(),
        })
        .$returningId();
      const enrollmentId = (inserted as { id?: number }[])[0]?.id ?? 0;
      if (!enrollmentId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "IERP enrolment could not be created" });
      return { success: true, created: true, enrollmentId, designation: input.designation };
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

      const ahaRows = await db
        .select({ programType: enrollments.programType, cognitiveModulesComplete: enrollments.cognitiveModulesComplete })
        .from(enrollments)
        .where(and(eq(enrollments.userId, ctx.user.id), inArray(enrollments.programType, ["bls", "acls", "pals", "nrp"])));
      const cognitive = new Map(ahaRows.map((row) => [row.programType, !!row.cognitiveModulesComplete]));
      if (!cognitive.get("bls")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Complete the platform BLS cognitive modules before uploading Phase 1 evidence." });
      }
      const hasAdvancedCognitive = (["acls", "pals", "nrp"] as const).some((programType) => cognitive.get(programType));
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
      feeKsh: 15000,
      totalPaidKsh: totalPaid,
      balanceKsh: Math.max(0, 15000 - totalPaid),
      isPaidInFull: totalPaid >= 15000,
      status: program.paymentStatus,
      entries: rows,
    };
  }),

  /** Start an IERP payment intent; the callback later finalises this row. */
  initiatePayment: protectedProcedure
    .input(z.object({ amountKsh: z.number().int().min(1).max(15000), phase: z.enum(["phase_1", "phase_2", "phase_3", "general"]), phoneNumber: z.string().regex(/^254\\d{9}$/, "Invalid phone number") }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const program = await getIerpEnrollment(db, ctx.user.id);
      if (!program) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Start IERP before making a programme payment." });
      const paidRows = await db.select({ total: sum(ierpPayments.amountKsh) }).from(ierpPayments).where(and(eq(ierpPayments.programEnrollmentId, program.id), eq(ierpPayments.status, "completed")));
      const totalPaid = Number(paidRows[0]?.total ?? 0);
      if (totalPaid + input.amountKsh > 15000) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `The maximum remaining IERP balance is KES ${Math.max(0, 15000 - totalPaid).toLocaleString()}.` });
      }
      const reference = `IERP-${program.id}-${ctx.user.id}-${Date.now()}`;
      const response = await getMpesaService().initiateSTKPush(input.phoneNumber, input.amountKsh, reference, "IERP programme payment");
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
        phoneNumber: input.phoneNumber,
        status: "pending",
      });
      return { success: true as const, checkoutRequestId, message: response.CustomerMessage ?? "Confirm the M-Pesa prompt on your phone." };
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

    const ahaRows = await db
      .select({
        id: enrollments.id,
        programType: enrollments.programType,
        cognitiveModulesComplete: enrollments.cognitiveModulesComplete,
        practicalSkillsSignedOff: enrollments.practicalSkillsSignedOff,
        paymentStatus: enrollments.paymentStatus,
      })
      .from(enrollments)
      .where(and(eq(enrollments.userId, ctx.user.id), inArray(enrollments.programType, [...IERP_AHA_PROGRAMS])))
      .orderBy(desc(enrollments.createdAt));

    const evidence = await db
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
      .orderBy(desc(ierpPhase1Evidence.updatedAt));

    const phase2 = await getAuthoritativePhase2CompletionStatus(db, ctx.user.id);
    const payment = getIerpPaymentLockout({ enrolledAt: program.enrolledAt, totalPaidAmount: program.totalPaidAmount });
    const phase1EvidenceVerified =
      evidence.some((row) => row.documentType === "video_prework" && row.status === "verified") &&
      evidence.some((row) => row.documentType === "precourse_assessment" && row.status === "verified");
    const phase1Complete = program.phase1Status === "verified" || phase1EvidenceVerified;
    const phase3GateUnlocked = phase1Complete && phase2.phase2Complete && payment.paid >= 15000;

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
      phase3GateUnlocked,
      payment: {
        status: program.paymentStatus,
        totalPaid: payment.paid,
        paymentDeadline: payment.paymentDeadline?.toISOString() ?? null,
        paymentLockoutActive: payment.paymentLockoutActive,
      },
      aha: ahaRows,
    };
  }),
});
