import { LEGAL_CONTACT, LEGAL_DOCUMENT_VERSIONS, LEGAL_LAST_UPDATED } from "@shared/legal-versions";
import { isTermsConsentStale } from "@shared/legal-versions";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as legalDb from "../lib/legal-consent";
import { sendEmail } from "../email";

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
});
