import { LEGAL_CONTACT, LEGAL_DOCUMENT_VERSIONS, LEGAL_LAST_UPDATED } from "@shared/legal-versions";
import { isTermsConsentStale } from "@shared/legal-versions";
import { z } from "zod";
import { protectedProcedure, publicProcedure, adminProcedure, router } from "../_core/trpc";
import * as legalDb from "../lib/legal-consent";
import { sendEmail } from "../email";
import { getDb, insertAdminAuditLog } from "../db";
import { eq, desc } from "drizzle-orm";
import { legalDataRequests } from "../../drizzle/schema";
import {
  buildDsarDeletionPlan,
  executeDsarAccountDeletion,
} from "../lib/dsar-deletion";
import { buildRetentionCleanupPlan } from "../lib/retention-cleanup";
import { TRPCError } from "@trpc/server";

function requestMeta(ctx: { req: { ip?: string; headers?: Record<string, string | string[] | undefined> } }) {
  const ua = ctx.req.headers?.["user-agent"];
  return {
    ipAddress: ctx.req.ip,
    userAgent: typeof ua === "string" ? ua : undefined,
  };
}

export const legalRouter = router({
  getDocumentVersions: publicProcedure.query(() => ({
    versions: LEGAL_DOCUMENT_VERSIONS,
    lastUpdated: LEGAL_LAST_UPDATED,
    contact: LEGAL_CONTACT,
  })),

  getMyConsentStatus: protectedProcedure.query(async ({ ctx }) => {
    const status = await legalDb.getUserConsentStatus(ctx.user.id);
    return {
      ...status,
      termsStale: isTermsConsentStale(status ?? {}),
      requiredTermsVersion: LEGAL_DOCUMENT_VERSIONS.termsOfUse,
      requiredPrivacyVersion: LEGAL_DOCUMENT_VERSIONS.privacyPolicy,
    };
  }),

  acceptTermsAndPrivacy: protectedProcedure.mutation(async ({ ctx }) => {
    const meta = requestMeta(ctx);
    await legalDb.recordTermsReconsent(ctx.user.id, {
      termsVersion: LEGAL_DOCUMENT_VERSIONS.termsOfUse,
      privacyVersion: LEGAL_DOCUMENT_VERSIONS.privacyPolicy,
      ...meta,
    });
    return { success: true as const };
  }),

  acceptCareSignalConsent: protectedProcedure.mutation(async ({ ctx }) => {
    const meta = requestMeta(ctx);
    await legalDb.recordCareSignalConsent(ctx.user.id, LEGAL_DOCUMENT_VERSIONS.careSignalNotice, meta);
    return { success: true as const };
  }),

  acceptResusGpsDisclaimer: protectedProcedure.mutation(async ({ ctx }) => {
    const meta = requestMeta(ctx);
    await legalDb.recordResusGpsAck(ctx.user.id, LEGAL_DOCUMENT_VERSIONS.resusGpsDisclaimer, meta);
    return { success: true as const };
  }),

  acceptInstitutionalB2b: protectedProcedure.mutation(async ({ ctx }) => {
    const meta = requestMeta(ctx);
    await legalDb.recordInstitutionalB2bConsent(
      ctx.user.id,
      LEGAL_DOCUMENT_VERSIONS.institutionalB2bAddendum,
      meta
    );
    return { success: true as const };
  }),

  acceptSafeTruthGuardian: protectedProcedure.mutation(async ({ ctx }) => {
    const meta = requestMeta(ctx);
    await legalDb.recordSafeTruthGuardianAck(
      ctx.user.id,
      LEGAL_DOCUMENT_VERSIONS.safeTruthGuardian,
      meta
    );
    return { success: true as const };
  }),

  submitDataRequest: publicProcedure
    .input(
      z.object({
        requesterEmail: z.string().email(),
        requesterName: z.string().max(255).optional(),
        requestType: z.enum(["access", "correction", "deletion", "objection", "portability"]),
        details: z.string().max(5000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id ?? null;
      const { id } = await legalDb.createLegalDataRequest({
        userId,
        requesterEmail: input.requesterEmail.trim().toLowerCase(),
        requesterName: input.requesterName?.trim() ?? null,
        requestType: input.requestType,
        details: input.details?.trim() ?? null,
      });

      const subject = `[DSAR] ${input.requestType} request #${id}`;
      const body = [
        `New data subject request received.`,
        ``,
        `ID: ${id}`,
        `Type: ${input.requestType}`,
        `Email: ${input.requesterEmail}`,
        `Name: ${input.requesterName ?? "—"}`,
        `User ID: ${userId ?? "anonymous"}`,
        ``,
        `Details:`,
        input.details ?? "(none)",
        ``,
        `SLA: respond within 30 days per Privacy Policy.`,
      ].join("\n");

      await sendEmail({
        to: LEGAL_CONTACT.dataRequestsEmail,
        subject,
        htmlBody: body.replace(/\n/g, "<br>"),
        textBody: body,
      }).catch(() => {
        console.warn("[Legal] DSAR email dispatch failed; request stored as id", id);
      });

      return { success: true as const, requestId: id };
    }),

  /** Admin: list DSAR tickets for privacy ops workflow. */
  listDataRequests: adminProcedure
    .input(
      z
        .object({
          status: z.enum(["received", "in_progress", "completed", "rejected"]).optional(),
          limit: z.number().int().min(1).max(200).default(50),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const limit = input?.limit ?? 50;
      const rows = input?.status
        ? await db
            .select()
            .from(legalDataRequests)
            .where(eq(legalDataRequests.status, input.status))
            .orderBy(desc(legalDataRequests.createdAt))
            .limit(limit)
        : await db
            .select()
            .from(legalDataRequests)
            .orderBy(desc(legalDataRequests.createdAt))
            .limit(limit);

      await insertAdminAuditLog({
        adminUserId: ctx.user.id,
        procedurePath: "legal.listDataRequests",
        inputSummary: JSON.stringify({ status: input?.status ?? "all", limit }),
      });

      return { requests: rows };
    }),

  /** Admin: preview DSAR deletion checklist (dry-run). */
  previewDeletion: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const plan = await buildDsarDeletionPlan(db, input.userId);
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      await insertAdminAuditLog({
        adminUserId: ctx.user.id,
        procedurePath: "legal.previewDeletion",
        inputSummary: JSON.stringify({ userId: input.userId }),
      });

      return plan;
    }),

  /** Admin: execute approved account deletion for a DSAR ticket. */
  processDeletionRequest: adminProcedure
    .input(
      z.object({
        requestId: z.number().int().positive(),
        confirm: z.literal(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [request] = await db
        .select()
        .from(legalDataRequests)
        .where(eq(legalDataRequests.id, input.requestId))
        .limit(1);

      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "DSAR request not found" });
      if (request.requestType !== "deletion") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Request is not a deletion type" });
      }
      if (!request.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No linked userId — complete identity verification first",
        });
      }

      const result = await executeDsarAccountDeletion(db, {
        userId: request.userId,
        requestId: input.requestId,
        dryRun: false,
        adminUserId: ctx.user.id,
      });

      await insertAdminAuditLog({
        adminUserId: ctx.user.id,
        procedurePath: "legal.processDeletionRequest",
        inputSummary: JSON.stringify({ requestId: input.requestId, userId: request.userId }),
      });

      return result;
    }),

  /** Admin: retention cleanup dry-run summary. */
  previewRetentionCleanup: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const plan = await buildRetentionCleanupPlan(db);

    await insertAdminAuditLog({
      adminUserId: ctx.user.id,
      procedurePath: "legal.previewRetentionCleanup",
      inputSummary: JSON.stringify({ totalEligible: plan.totalEligible }),
    });

    return plan;
  }),
});
