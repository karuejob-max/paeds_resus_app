import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  promotionalCampaignAuditEvents,
  promotionalCampaignRecipients,
  promotionalCampaigns,
  promotionalMessageSuppressions,
} from "../../drizzle/schema";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { getRawEmailProviderStatus, sendRawEmail } from "../email-service";
import {
  getActivePromotionalSuppressions,
  getPromotionalPreference,
  loadPromotionalAudience,
  PROMOTIONAL_CADRES,
  PROMOTIONAL_TEMPLATE_VERSION,
  renderPromotionalMessage,
  setPromotionalPreference,
  createPromotionalUnsubscribeToken,
} from "../lib/promotional-messaging";

const audienceFilterSchema = z.object({
  cadres: z
    .array(z.enum(PROMOTIONAL_CADRES))
    .min(1)
    .max(PROMOTIONAL_CADRES.length),
  includeUsersWithoutInstitutionStaffRow: z.boolean().default(true),
});
const consentPolicySchema = z.enum(["opt_in", "opt_out"]);
const APPROVAL_PHRASE = "APPROVE PROMOTIONAL RECIPIENT SNAPSHOT";
const SEND_PHRASE = "SEND APPROVED PROMOTIONAL CAMPAIGN";

function requireGlobalAdmin(role: string) {
  if (role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Global Admin access required.",
    });
  }
}

function appBaseUrl() {
  return (process.env.APP_BASE_URL || "https://www.paedsresus.com").replace(
    /\/$/,
    ""
  );
}

function requireDb() {
  return getDb().then(db => {
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable.",
      });
    return db;
  });
}

async function audit(
  db: any,
  input: {
    campaignId?: number | null;
    recipientId?: number | null;
    action: string;
    actorUserId?: number | null;
    details?: unknown;
  }
) {
  await db.insert(promotionalCampaignAuditEvents).values({
    campaignId: input.campaignId ?? null,
    recipientId: input.recipientId ?? null,
    action: input.action,
    actorUserId: input.actorUserId ?? null,
    details: input.details ? JSON.stringify(input.details) : null,
  });
}

async function getCampaign(db: any, campaignId: number) {
  const rows = await db
    .select()
    .from(promotionalCampaigns)
    .where(eq(promotionalCampaigns.id, campaignId))
    .limit(1);
  return rows[0] ?? null;
}

async function getSnapshot(db: any, campaignId: number) {
  return db
    .select()
    .from(promotionalCampaignRecipients)
    .where(eq(promotionalCampaignRecipients.campaignId, campaignId))
    .orderBy(promotionalCampaignRecipients.displayName);
}

async function snapshotCounts(db: any, campaignId: number) {
  const rows = await getSnapshot(db, campaignId);
  return {
    audienceCount: rows.length,
    sentCount: rows.filter((row: any) => row.status === "sent").length,
    failedCount: rows.filter((row: any) => row.status === "failed").length,
    pendingCount: rows.filter((row: any) => row.status === "pending").length,
    skippedCount: rows.filter((row: any) => row.status === "skipped").length,
  };
}

function parseFilter(campaign: any) {
  const parsed = audienceFilterSchema.safeParse(
    JSON.parse(campaign.audienceFilterJson)
  );
  if (!parsed.success)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Campaign audience filter is invalid.",
    });
  return parsed.data;
}

export const promotionalCampaignsRouter = router({
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return getPromotionalPreference(db, ctx.user.id);
  }),

  updatePreference: protectedProcedure
    .input(
      z.object({
        status: z.enum(["opted_in", "opted_out"]),
        source: z.string().trim().max(128).default("account_settings"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const result = await setPromotionalPreference(db, {
        userId: ctx.user.id,
        status: input.status,
        source: input.source,
        actorUserId: ctx.user.id,
      });
      return { success: true as const, ...result };
    }),

  getStatus: adminProcedure.query(({ ctx }) => {
    requireGlobalAdmin(ctx.user.role);
    return {
      provider: getRawEmailProviderStatus(),
      approvalPhrase: APPROVAL_PHRASE,
      sendPhrase: SEND_PHRASE,
      templateVersion: PROMOTIONAL_TEMPLATE_VERSION,
      automaticSending: false as const,
    };
  }),

  previewAudience: adminProcedure
    .input(
      z.object({
        filter: audienceFilterSchema,
        consentPolicy: consentPolicySchema.default("opt_in"),
        limit: z.number().int().min(1).max(5000).default(5000),
      })
    )
    .query(async ({ ctx, input }) => {
      requireGlobalAdmin(ctx.user.role);
      const db = await requireDb();
      const audience = await loadPromotionalAudience(
        db,
        input.filter,
        input.limit,
        input.consentPolicy
      );
      await audit(db, {
        actorUserId: ctx.user.id,
        action: "audience_previewed",
        details: {
          filter: input.filter,
          consentPolicy: input.consentPolicy,
          counts: audience.counts,
        },
      });
      return {
        ...audience,
        filter: input.filter,
        consentPolicy: input.consentPolicy,
        provider: getRawEmailProviderStatus(),
      };
    }),

  list: adminProcedure.query(async ({ ctx }) => {
    requireGlobalAdmin(ctx.user.role);
    const db = await requireDb();
    return db
      .select()
      .from(promotionalCampaigns)
      .orderBy(desc(promotionalCampaigns.updatedAt))
      .limit(50);
  }),

  createDraft: adminProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(255),
        subject: z.string().trim().min(1).max(255),
        bodyText: z.string().trim().min(1).max(100_000),
        filter: audienceFilterSchema,
        consentPolicy: consentPolicySchema.default("opt_in"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireGlobalAdmin(ctx.user.role);
      const db = await requireDb();
      const campaignKey = `promo-${Date.now()}-${randomUUID().slice(0, 8)}`;
      const inserted = await db
        .insert(promotionalCampaigns)
        .values({
          campaignKey,
          name: input.name,
          subject: input.subject,
          bodyText: input.bodyText,
          audienceFilterJson: JSON.stringify(input.filter),
          consentPolicy: input.consentPolicy,
          templateVersion: PROMOTIONAL_TEMPLATE_VERSION,
          status: "draft",
          createdByUserId: ctx.user.id,
        })
        .$returningId();
      const campaignId = (inserted as { id?: number }[])[0]?.id;
      if (!campaignId)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Campaign draft could not be created.",
        });
      await audit(db, {
        campaignId,
        actorUserId: ctx.user.id,
        action: "draft_created",
        details: { filter: input.filter, consentPolicy: input.consentPolicy },
      });
      return { campaign: await getCampaign(db, campaignId) };
    }),

  getCampaign: adminProcedure
    .input(z.object({ campaignId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      requireGlobalAdmin(ctx.user.role);
      const db = await requireDb();
      const campaign = await getCampaign(db, input.campaignId);
      if (!campaign)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Promotional campaign not found.",
        });
      return {
        campaign,
        recipients: await getSnapshot(db, campaign.id),
        counts: await snapshotCounts(db, campaign.id),
        provider: getRawEmailProviderStatus(),
      };
    }),

  approveSnapshot: adminProcedure
    .input(
      z.object({
        campaignId: z.number().int().positive(),
        confirmation: z.string().trim().min(1).max(128),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireGlobalAdmin(ctx.user.role);
      if (input.confirmation !== APPROVAL_PHRASE)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Approval phrase does not match.",
        });
      const db = await requireDb();
      const campaign = await getCampaign(db, input.campaignId);
      if (!campaign)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Promotional campaign not found.",
        });
      if (campaign.templateVersion !== PROMOTIONAL_TEMPLATE_VERSION)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "This campaign uses an outdated messaging template. Create a new draft.",
        });
      if (campaign.status !== "draft")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only a draft campaign can be approved.",
        });
      if (!getRawEmailProviderStatus().ready)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The configured email provider is not ready.",
        });
      if (
        !process.env.NERP_CAMPAIGN_TOKEN_SECRET?.trim() &&
        !process.env.JWT_SECRET?.trim()
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Promotional unsubscribe signing is not configured.",
        });
      const filter = parseFilter(campaign);
      const audience = await loadPromotionalAudience(
        db,
        filter,
        5000,
        campaign.consentPolicy
      );
      const eligible = audience.candidates.filter((row: any) => row.eligible);
      if (!eligible.length)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No recipients remain after consent and suppression checks.",
        });
      const existing = await getSnapshot(db, campaign.id);
      if (existing.length)
        throw new TRPCError({
          code: "CONFLICT",
          message: "This campaign already has a recipient snapshot.",
        });
      await db.insert(promotionalCampaignRecipients).values(
        eligible.map((row: any) => ({
          campaignId: campaign.id,
          userId: row.userId,
          email: row.email,
          displayName: row.displayName,
          cadre: row.cadre,
          department: row.department,
          consentStatus: row.consentStatus,
          status: "pending" as const,
        }))
      );
      await db
        .update(promotionalCampaigns)
        .set({
          status: "approved",
          audienceCount: eligible.length,
          approvedByUserId: ctx.user.id,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(promotionalCampaigns.id, campaign.id));
      await audit(db, {
        campaignId: campaign.id,
        actorUserId: ctx.user.id,
        action: "recipient_snapshot_approved",
        details: {
          counts: audience.counts,
          audienceCount: eligible.length,
          consentPolicy: campaign.consentPolicy,
        },
      });
      return {
        success: true as const,
        campaign: await getCampaign(db, campaign.id),
        counts: await snapshotCounts(db, campaign.id),
      };
    }),

  sendApproved: adminProcedure
    .input(
      z.object({
        campaignId: z.number().int().positive(),
        confirmation: z.string().trim().min(1).max(128),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireGlobalAdmin(ctx.user.role);
      if (input.confirmation !== SEND_PHRASE)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Send phrase does not match.",
        });
      const db = await requireDb();
      const campaign = await getCampaign(db, input.campaignId);
      if (!campaign)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Promotional campaign not found.",
        });
      if (campaign.templateVersion !== PROMOTIONAL_TEMPLATE_VERSION)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "This campaign uses an outdated messaging template. Create a new draft.",
        });
      if (campaign.status !== "approved" && campaign.status !== "failed")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only an approved or failed campaign can be sent.",
        });
      const provider = getRawEmailProviderStatus();
      if (!provider.ready)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The configured email provider is not ready.",
        });
      const transition = await db
        .update(promotionalCampaigns)
        .set({
          status: "sending",
          startedAt: campaign.startedAt ?? new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(promotionalCampaigns.id, campaign.id),
            inArray(promotionalCampaigns.status, ["approved", "failed"])
          )
        );
      if (
        !Number(
          (transition as any)?.[0]?.affectedRows ??
            (transition as any)?.affectedRows ??
            0
        )
      )
        throw new TRPCError({
          code: "CONFLICT",
          message: "This campaign is already being sent or has changed state.",
        });
      await audit(db, {
        campaignId: campaign.id,
        actorUserId: ctx.user.id,
        action: "delivery_started",
        details: { provider: provider.provider },
      });
      const recipients = await db
        .select()
        .from(promotionalCampaignRecipients)
        .where(
          and(
            eq(promotionalCampaignRecipients.campaignId, campaign.id),
            inArray(promotionalCampaignRecipients.status, ["pending", "failed"])
          )
        );
      for (const recipient of recipients) {
        const preference = await getPromotionalPreference(db, recipient.userId);
        const [suppression] = await db
          .select({
            id: promotionalMessageSuppressions.id,
            reason: promotionalMessageSuppressions.reason,
          })
          .from(promotionalMessageSuppressions)
          .where(
            and(
              eq(promotionalMessageSuppressions.email, recipient.email),
              eq(promotionalMessageSuppressions.isActive, true)
            )
          )
          .limit(1);
        const blockedByConsent =
          campaign.consentPolicy === "opt_in"
            ? preference.consentStatus !== "opted_in"
            : preference.consentStatus === "opted_out";
        if (suppression || blockedByConsent) {
          const skipReason = suppression
            ? `suppressed:${suppression.reason}`
            : "promotional_consent_changed";
          await db
            .update(promotionalCampaignRecipients)
            .set({ status: "skipped", skipReason, attemptedAt: new Date() })
            .where(eq(promotionalCampaignRecipients.id, recipient.id));
          await audit(db, {
            campaignId: campaign.id,
            recipientId: recipient.id,
            actorUserId: ctx.user.id,
            action: "recipient_skipped",
            details: { skipReason, suppressionId: suppression?.id ?? null },
          });
          continue;
        }
        const token = createPromotionalUnsubscribeToken(
          campaign.campaignKey,
          recipient.id
        );
        const message = renderPromotionalMessage({
          subject: campaign.subject,
          displayName: recipient.displayName,
          bodyText: campaign.bodyText,
          unsubscribeUrl: `${appBaseUrl()}/api/promotional/unsubscribe?token=${encodeURIComponent(token)}`,
        });
        const attemptedAt = new Date();
        try {
          const result = await sendRawEmail({
            to: recipient.email,
            subject: message.subject,
            html: message.html,
            text: message.text,
            replyTo:
              process.env.SES_REPLY_TO_EMAIL?.trim() ||
              "paedsresus254@gmail.com",
          });
          if (result.success) {
            await db
              .update(promotionalCampaignRecipients)
              .set({
                status: "sent",
                providerMessageId: result.messageId ?? null,
                attemptedAt,
                sentAt: new Date(),
                providerError: null,
              })
              .where(eq(promotionalCampaignRecipients.id, recipient.id));
            await audit(db, {
              campaignId: campaign.id,
              recipientId: recipient.id,
              actorUserId: ctx.user.id,
              action: "recipient_sent",
              details: {
                provider: result.provider ?? provider.provider,
                providerMessageId: result.messageId ?? null,
              },
            });
          } else {
            await db
              .update(promotionalCampaignRecipients)
              .set({
                status: "failed",
                attemptedAt,
                providerError: result.error ?? "Email provider failed",
              })
              .where(eq(promotionalCampaignRecipients.id, recipient.id));
            await audit(db, {
              campaignId: campaign.id,
              recipientId: recipient.id,
              actorUserId: ctx.user.id,
              action: "recipient_failed",
              details: {
                provider: result.provider ?? provider.provider,
                error: result.error ?? "Email provider failed",
              },
            });
          }
        } catch (error) {
          const providerError =
            error instanceof Error ? error.message : "Email provider failed";
          await db
            .update(promotionalCampaignRecipients)
            .set({ status: "failed", attemptedAt, providerError })
            .where(eq(promotionalCampaignRecipients.id, recipient.id));
          await audit(db, {
            campaignId: campaign.id,
            recipientId: recipient.id,
            actorUserId: ctx.user.id,
            action: "recipient_failed",
            details: { provider: provider.provider, error: providerError },
          });
        }
      }
      const counts = await snapshotCounts(db, campaign.id);
      const status =
        counts.pendingCount === 0 && counts.failedCount === 0
          ? "sent"
          : "failed";
      await db
        .update(promotionalCampaigns)
        .set({
          status,
          sentCount: counts.sentCount,
          failedCount: counts.failedCount,
          skippedCount: counts.skippedCount,
          audienceCount: counts.audienceCount,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(promotionalCampaigns.id, campaign.id));
      await audit(db, {
        campaignId: campaign.id,
        actorUserId: ctx.user.id,
        action: "delivery_completed",
        details: { status, counts, provider: provider.provider },
      });
      return {
        success: status === "sent",
        status,
        counts,
        provider: provider.provider,
      };
    }),
});
