import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  nerpCampaignSuppressions,
  nerpPromotionAuditEvents,
  nerpPromotionCampaigns,
  nerpPromotionRecipients,
} from "../../drizzle/schema";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { getRawEmailProviderStatus, sendRawEmail } from "../email-service";
import { loadNerpPromotionAudience } from "../lib/nerp-campaign-audience";
import { NERP_PATHWAY_ENTRY_PATH } from "../../shared/nerp-pathway";
import {
  createNerpCampaignMessage,
  createUnsubscribeToken,
  NERP_CAMPAIGN_KEY,
  NERP_CAMPAIGN_SUBJECT,
  NERP_CAMPAIGN_TEMPLATE_VERSION,
} from "../lib/nerp-campaign-email";

const INSTITUTION_ID = 3;
const APPROVAL_PHRASE = "APPROVE NERP RECIPIENT SNAPSHOT";
const SEND_PHRASE = "SEND NERP CAMPAIGN TO APPROVED RECIPIENTS";

function requireDb() {
  return getDb().then(db => {
    if (!db) throw new Error("Database unavailable.");
    return db;
  });
}

function appBaseUrl() {
  return (process.env.APP_BASE_URL || "https://www.paedsresus.com").replace(
    /\/$/,
    ""
  );
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
  await db.insert(nerpPromotionAuditEvents).values({
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
    .from(nerpPromotionCampaigns)
    .where(eq(nerpPromotionCampaigns.id, campaignId))
    .limit(1);
  return rows[0] ?? null;
}

async function getCampaignSnapshot(db: any, campaignId: number) {
  return db
    .select()
    .from(nerpPromotionRecipients)
    .where(eq(nerpPromotionRecipients.campaignId, campaignId))
    .orderBy(nerpPromotionRecipients.displayName);
}

async function countCampaignRecipients(db: any, campaignId: number) {
  const rows = await getCampaignSnapshot(db, campaignId);
  return {
    audienceCount: rows.length,
    sentCount: rows.filter((row: any) => row.status === "sent").length,
    failedCount: rows.filter((row: any) => row.status === "failed").length,
    pendingCount: rows.filter((row: any) => row.status === "pending").length,
    skippedCount: rows.filter((row: any) => row.status === "skipped").length,
  };
}

export const nerpCampaignsRouter = router({
  getStatus: adminProcedure.query(() => ({
    provider: getRawEmailProviderStatus(),
    approvalPhrase: APPROVAL_PHRASE,
    sendPhrase: SEND_PHRASE,
    automaticSending: false as const,
    campaignKey: NERP_CAMPAIGN_KEY,
    templateVersion: NERP_CAMPAIGN_TEMPLATE_VERSION,
  })),

  previewAudience: adminProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive().default(INSTITUTION_ID),
        limit: z.number().int().min(1).max(500).default(200),
      })
    )
    .query(async ({ input, ctx }) => {
      if (input.institutionId !== INSTITUTION_ID)
        throw new Error(
          "This NERP campaign is not available for the requested institution."
        );
      const db = await requireDb();
      const audience = await loadNerpPromotionAudience(
        db,
        input.institutionId,
        input.limit
      );
      await audit(db, {
        actorUserId: ctx.user.id,
        action: "audience_previewed",
        details: {
          institutionId: input.institutionId,
          counts: audience.counts,
        },
      });
      return {
        offerKey: NERP_CAMPAIGN_KEY,
        subject: NERP_CAMPAIGN_SUBJECT,
        templateVersion: NERP_CAMPAIGN_TEMPLATE_VERSION,
        generatedAt: new Date().toISOString(),
        provider: getRawEmailProviderStatus(),
        ...audience,
      };
    }),

  list: adminProcedure.query(async () => {
    const db = await requireDb();
    return db
      .select()
      .from(nerpPromotionCampaigns)
      .where(eq(nerpPromotionCampaigns.institutionalAccountId, INSTITUTION_ID))
      .orderBy(desc(nerpPromotionCampaigns.createdAt))
      .limit(20);
  }),

  createDraft: adminProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive().default(INSTITUTION_ID),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.institutionId !== INSTITUTION_ID)
        throw new Error(
          "This NERP campaign is not available for the requested institution."
        );
      const db = await requireDb();
      const existing = await db
        .select()
        .from(nerpPromotionCampaigns)
        .where(
          and(
            eq(
              nerpPromotionCampaigns.institutionalAccountId,
              input.institutionId
            ),
            inArray(nerpPromotionCampaigns.status, [
              "draft",
              "approved",
              "sending",
            ]),
            eq(
              nerpPromotionCampaigns.templateVersion,
              NERP_CAMPAIGN_TEMPLATE_VERSION
            )
          )
        )
        .orderBy(desc(nerpPromotionCampaigns.createdAt))
        .limit(1);
      if (existing[0]) return { campaign: existing[0], reused: true as const };

      const campaignKey = `${NERP_CAMPAIGN_KEY}-${Date.now()}-${randomUUID().slice(0, 8)}`;
      const message = createNerpCampaignMessage({
        displayName: "[First Name]",
        campaignKey,
        enrollmentUrl: `${appBaseUrl()}${NERP_PATHWAY_ENTRY_PATH}`,
        unsubscribeUrl: `${appBaseUrl()}/api/nerp/campaign/unsubscribe?token=[recipient-specific-token]`,
      });
      const inserted = await db
        .insert(nerpPromotionCampaigns)
        .values({
          institutionalAccountId: input.institutionId,
          campaignKey,
          subject: message.subject,
          bodyText: message.text,
          templateVersion: NERP_CAMPAIGN_TEMPLATE_VERSION,
          status: "draft",
          createdByUserId: ctx.user.id,
        })
        .$returningId();
      const campaignId = (inserted as { id?: number }[])[0]?.id ?? 0;
      const campaign = await getCampaign(db, campaignId);
      await audit(db, {
        campaignId,
        actorUserId: ctx.user.id,
        action: "draft_created",
        details: { campaignKey },
      });
      return { campaign, reused: false as const };
    }),

  approveSnapshot: adminProcedure
    .input(
      z.object({
        campaignId: z.number().int().positive(),
        confirmation: z.string().trim().min(1).max(128),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.confirmation !== APPROVAL_PHRASE)
        throw new Error("Approval phrase does not match.");
      const db = await requireDb();
      const campaign = await getCampaign(db, input.campaignId);
      if (!campaign) throw new Error("NERP campaign not found.");
      if (campaign.templateVersion !== NERP_CAMPAIGN_TEMPLATE_VERSION)
        throw new Error(
          "This campaign draft uses an outdated learner destination. Create a new draft."
        );
      if (campaign.status !== "draft")
        throw new Error("Only a draft campaign can be approved.");
      const audience = await loadNerpPromotionAudience(
        db,
        campaign.institutionalAccountId,
        500
      );
      const sendableByEmail = new Map<
        string,
        (typeof audience.recipients)[number]
      >();
      for (const row of audience.recipients) {
        if (row.sendable && row.email)
          sendableByEmail.set(row.email.trim().toLowerCase(), row);
      }
      const sendable = [...sendableByEmail.values()];
      if (!sendable.length)
        throw new Error(
          "No eligible recipients remain after suppression checks."
        );
      if (
        !process.env.NERP_CAMPAIGN_TOKEN_SECRET?.trim() &&
        !process.env.JWT_SECRET?.trim()
      ) {
        throw new Error(
          "Campaign unsubscribe signing secret is not configured on the server."
        );
      }
      await db.insert(nerpPromotionRecipients).values(
        sendable.map(row => ({
          campaignId: campaign.id,
          staffId: row.staffId,
          userId: row.userId,
          email: row.email.trim().toLowerCase(),
          displayName: row.name,
          department: row.department,
          status: "pending" as const,
        }))
      );
      await db
        .update(nerpPromotionCampaigns)
        .set({
          status: "approved",
          audienceCount: sendable.length,
          approvedByUserId: ctx.user.id,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(nerpPromotionCampaigns.id, campaign.id));
      await audit(db, {
        campaignId: campaign.id,
        actorUserId: ctx.user.id,
        action: "recipient_snapshot_approved",
        details: {
          sourceEligibleCount: audience.counts.sendable,
          audienceCount: sendable.length,
          deduplicated: audience.counts.sendable !== sendable.length,
          previewCounts: audience.counts,
        },
      });
      return {
        success: true as const,
        campaign: await getCampaign(db, campaign.id),
        counts: await countCampaignRecipients(db, campaign.id),
      };
    }),

  getCampaign: adminProcedure
    .input(z.object({ campaignId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const campaign = await getCampaign(db, input.campaignId);
      if (!campaign) throw new Error("NERP campaign not found.");
      return {
        campaign,
        recipients: await getCampaignSnapshot(db, campaign.id),
        counts: await countCampaignRecipients(db, campaign.id),
        provider: getRawEmailProviderStatus(),
      };
    }),

  sendApproved: adminProcedure
    .input(
      z.object({
        campaignId: z.number().int().positive(),
        confirmation: z.string().trim().min(1).max(128),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.confirmation !== SEND_PHRASE)
        throw new Error("Send phrase does not match.");
      const db = await requireDb();
      const campaign = await getCampaign(db, input.campaignId);
      if (!campaign) throw new Error("NERP campaign not found.");
      if (campaign.templateVersion !== NERP_CAMPAIGN_TEMPLATE_VERSION)
        throw new Error(
          "This campaign draft uses an outdated learner destination. Create a new draft."
        );
      if (campaign.status !== "approved" && campaign.status !== "failed")
        throw new Error("Only an approved or failed campaign can be sent.");
      const provider = getRawEmailProviderStatus();
      if (!provider.ready)
        throw new Error("No email provider is configured on the server.");

      await db
        .update(nerpPromotionCampaigns)
        .set({
          status: "sending",
          startedAt: campaign.startedAt ?? new Date(),
          updatedAt: new Date(),
        })
        .where(eq(nerpPromotionCampaigns.id, campaign.id));
      await audit(db, {
        campaignId: campaign.id,
        actorUserId: ctx.user.id,
        action: "delivery_started",
        details: { provider: provider.provider },
      });

      const recipients = await db
        .select()
        .from(nerpPromotionRecipients)
        .where(
          and(
            eq(nerpPromotionRecipients.campaignId, campaign.id),
            inArray(nerpPromotionRecipients.status, ["pending", "failed"])
          )
        );
      for (const recipient of recipients) {
        const [suppression] = await db
          .select({
            id: nerpCampaignSuppressions.id,
            reasonCode: nerpCampaignSuppressions.reasonCode,
          })
          .from(nerpCampaignSuppressions)
          .where(
            and(
              eq(
                nerpCampaignSuppressions.institutionalAccountId,
                campaign.institutionalAccountId
              ),
              eq(nerpCampaignSuppressions.matchType, "email"),
              eq(
                nerpCampaignSuppressions.matchValue,
                recipient.email.trim().toLowerCase()
              ),
              eq(nerpCampaignSuppressions.isActive, true)
            )
          )
          .limit(1);
        if (suppression) {
          await db
            .update(nerpPromotionRecipients)
            .set({
              status: "skipped",
              skipReason: `suppressed:${suppression.reasonCode}`,
              attemptedAt: new Date(),
            })
            .where(eq(nerpPromotionRecipients.id, recipient.id));
          await audit(db, {
            campaignId: campaign.id,
            recipientId: recipient.id,
            actorUserId: ctx.user.id,
            action: "recipient_skipped_suppressed",
            details: {
              suppressionId: suppression.id,
              reasonCode: suppression.reasonCode,
            },
          });
          continue;
        }

        const token = createUnsubscribeToken(
          campaign.campaignKey,
          recipient.id
        );
        const message = createNerpCampaignMessage({
          displayName: recipient.displayName,
          campaignKey: campaign.campaignKey,
          enrollmentUrl: `${appBaseUrl()}${NERP_PATHWAY_ENTRY_PATH}`,
          unsubscribeUrl: `${appBaseUrl()}/api/nerp/campaign/unsubscribe?token=${encodeURIComponent(token)}`,
        });
        const attemptedAt = new Date();
        await db
          .update(nerpPromotionRecipients)
          .set({ status: "pending", attemptedAt, providerError: null })
          .where(eq(nerpPromotionRecipients.id, recipient.id));
        try {
          const result = await sendRawEmail({
            to: recipient.email,
            subject: message.subject,
            html: message.html,
            text: message.text,
            replyTo:
              process.env.SES_REPLY_TO_EMAIL?.trim() ||
              "paedsresus254@gmail.com",
            configurationSetName:
              process.env.SES_NERP_CONFIGURATION_SET?.trim() || undefined,
            tags: {
              campaign_key: campaign.campaignKey,
              recipient_id: String(recipient.id),
            },
          });
          if (result.success) {
            await db
              .update(nerpPromotionRecipients)
              .set({
                status: "sent",
                providerMessageId: result.messageId ?? null,
                sentAt: new Date(),
                providerError: null,
              })
              .where(eq(nerpPromotionRecipients.id, recipient.id));
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
              .update(nerpPromotionRecipients)
              .set({
                status: "failed",
                providerError: result.error ?? "Email provider failed",
              })
              .where(eq(nerpPromotionRecipients.id, recipient.id));
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
          const messageText =
            error instanceof Error ? error.message : "Email provider failed";
          await db
            .update(nerpPromotionRecipients)
            .set({ status: "failed", providerError: messageText })
            .where(eq(nerpPromotionRecipients.id, recipient.id));
          await audit(db, {
            campaignId: campaign.id,
            recipientId: recipient.id,
            actorUserId: ctx.user.id,
            action: "recipient_failed",
            details: { provider: provider.provider, error: messageText },
          });
        }
      }

      const counts = await countCampaignRecipients(db, campaign.id);
      const status =
        counts.pendingCount === 0 && counts.failedCount === 0
          ? "sent"
          : "failed";
      await db
        .update(nerpPromotionCampaigns)
        .set({
          status,
          audienceCount: counts.audienceCount,
          sentCount: counts.sentCount,
          failedCount: counts.failedCount,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(nerpPromotionCampaigns.id, campaign.id));
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
