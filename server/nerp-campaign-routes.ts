import express, { type Express, Request, Response } from "express";
import { createRequire } from "node:module";
import { and, eq } from "drizzle-orm";

const require = createRequire(import.meta.url);
const MessageValidator = require("sns-validator") as new () => {
  validate(message: Record<string, any>, callback: (error: Error | null, message?: Record<string, any>) => void): void;
};
import {
  nerpCampaignSuppressionAuditEvents,
  nerpCampaignSuppressions,
  nerpPromotionAuditEvents,
  nerpPromotionCampaigns,
  nerpPromotionDeliveryEvents,
  nerpPromotionRecipients,
} from "../drizzle/schema";
import { getDb } from "./db";
import { normalizedEmail } from "./lib/nerp-campaign-controls";
import { verifyUnsubscribeToken } from "./lib/nerp-campaign-email";
import { normalizeSesNotification } from "./lib/ses-feedback";

export function registerNerpCampaignRoutes(app: Express) {
  app.post(
    "/api/webhooks/aws/ses",
    express.text({ type: ["text/plain", "application/json"], limit: "1mb" }),
    async (req: Request, res: Response) => {
      const expectedTopic = process.env.SES_FEEDBACK_SNS_TOPIC_ARN?.trim();
      const topicArn = String(req.header("x-amz-sns-topic-arn") || "").trim();
      if (!expectedTopic || topicArn !== expectedTopic) {
        return res.status(403).json({ error: "SNS topic is not authorized." });
      }
      let body: Record<string, any> | null = null;
      try {
        body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      } catch {
        return res.status(400).json({ error: "Invalid SNS payload." });
      }
      if (!body || typeof body !== "object") return res.status(400).json({ error: "Invalid SNS payload." });
      const validator = new MessageValidator();
      const validated = await new Promise<Record<string, any>>((resolve, reject) => {
        validator.validate(body, (error, message) =>
          error || !message ? reject(error || new Error("Invalid SNS signature.")) : resolve(message)
        );
      }).catch(() => null);
      if (!validated) return res.status(400).json({ error: "Invalid SNS signature." });
      if (validated.Type === "SubscriptionConfirmation") {
        return res.status(200).json({ accepted: true, action: "confirm-subscription-out-of-band" });
      }
      if (validated.Type !== "Notification" || typeof validated.Message !== "string") {
        return res.status(202).json({ accepted: true, ignored: true });
      }
      let payload: Record<string, any>;
      try {
        payload = JSON.parse(validated.Message);
      } catch {
        return res.status(400).json({ error: "Invalid SES notification body." });
      }
      const events = normalizeSesNotification(String(validated.MessageId || ""), payload);
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "Database unavailable." });
      let recorded = 0;
      for (const event of events) {
        const [existing] = await db
          .select({ id: nerpPromotionDeliveryEvents.id })
          .from(nerpPromotionDeliveryEvents)
          .where(eq(nerpPromotionDeliveryEvents.providerEventId, event.providerEventId))
          .limit(1);
        if (existing) continue;
        await db.insert(nerpPromotionDeliveryEvents).values(event);
        recorded += 1;
        const recipient = await db
          .select({ id: nerpPromotionRecipients.id, campaignId: nerpPromotionRecipients.campaignId })
          .from(nerpPromotionRecipients)
          .where(
            event.recipientEmail
              ? and(
                  eq(nerpPromotionRecipients.providerMessageId, event.providerMessageId),
                  eq(nerpPromotionRecipients.email, event.recipientEmail)
                )
              : eq(nerpPromotionRecipients.providerMessageId, event.providerMessageId)
          )
          .limit(1);
        if (recipient[0]) {
          await db
            .update(nerpPromotionRecipients)
            .set({
              deliveryStatus: event.outcome,
              deliveryEventAt: event.eventAt,
              deliveryEventType: event.eventType,
            })
            .where(eq(nerpPromotionRecipients.id, recipient[0].id));
          await db.insert(nerpPromotionAuditEvents).values({
            campaignId: recipient[0].campaignId,
            recipientId: recipient[0].id,
            action: "ses_feedback_received",
            actorUserId: null,
            details: JSON.stringify({ providerEventId: event.providerEventId, eventType: event.eventType, outcome: event.outcome }),
          });
        }
      }
      return res.status(200).json({ accepted: true, recorded });
    }
  );

  app.get(
    "/api/nerp/campaign/unsubscribe",
    async (req: Request, res: Response) => {
      const token = typeof req.query.token === "string" ? req.query.token : "";
      const verified = verifyUnsubscribeToken(token);
      if (!verified) {
        return res
          .status(400)
          .type("html")
          .send(
            "<h1>Unsubscribe link unavailable</h1><p>This link is invalid. Please contact Paeds Resus if you need help.</p>"
          );
      }
      const db = await getDb();
      if (!db)
        return res
          .status(503)
          .type("html")
          .send(
            "<h1>Temporarily unavailable</h1><p>Please try again later.</p>"
          );
      const [campaign] = await db
        .select({
          id: nerpPromotionCampaigns.id,
          institutionalAccountId: nerpPromotionCampaigns.institutionalAccountId,
        })
        .from(nerpPromotionCampaigns)
        .where(eq(nerpPromotionCampaigns.campaignKey, verified.campaignKey))
        .limit(1);
      const [recipient] = campaign
        ? await db
            .select({
              id: nerpPromotionRecipients.id,
              email: nerpPromotionRecipients.email,
            })
            .from(nerpPromotionRecipients)
            .where(
              and(
                eq(nerpPromotionRecipients.id, verified.recipientId),
                eq(nerpPromotionRecipients.campaignId, campaign.id)
              )
            )
            .limit(1)
        : [];
      if (!campaign || !recipient) {
        return res
          .status(400)
          .type("html")
          .send(
            "<h1>Unsubscribe link unavailable</h1><p>This link is not valid for an active campaign recipient.</p>"
          );
      }

      const email = normalizedEmail(recipient.email);
      const [existing] = await db
        .select({ id: nerpCampaignSuppressions.id })
        .from(nerpCampaignSuppressions)
        .where(
          and(
            eq(
              nerpCampaignSuppressions.institutionalAccountId,
              campaign.institutionalAccountId
            ),
            eq(nerpCampaignSuppressions.matchType, "email"),
            eq(nerpCampaignSuppressions.matchValue, email)
          )
        )
        .limit(1);
      let suppressionId: number;
      if (existing) {
        suppressionId = existing.id;
        await db
          .update(nerpCampaignSuppressions)
          .set({
            reasonCode: "unsubscribe",
            note: "Recipient opted out through a signed NERP campaign link.",
            isActive: true,
            updatedByUserId: null,
            deactivatedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(nerpCampaignSuppressions.id, existing.id));
      } else {
        const inserted = await db
          .insert(nerpCampaignSuppressions)
          .values({
            institutionalAccountId: campaign.institutionalAccountId,
            matchType: "email",
            matchValue: email,
            reasonCode: "unsubscribe",
            note: "Recipient opted out through a signed NERP campaign link.",
            isActive: true,
            createdByUserId: null,
          })
          .$returningId();
        const insertedId = (inserted as { id?: number }[])[0]?.id;
        if (!insertedId)
          return res
            .status(500)
            .type("html")
            .send(
              "<h1>Temporarily unavailable</h1><p>Please try again later.</p>"
            );
        suppressionId = insertedId;
      }
      {
        await db.insert(nerpCampaignSuppressionAuditEvents).values({
          suppressionId,
          action: "unsubscribe_link_clicked",
          actorUserId: null,
          details: JSON.stringify({
            campaignKey: verified.campaignKey,
            recipientId: recipient.id,
          }),
        });
      }
      await db.insert(nerpPromotionAuditEvents).values({
        campaignId: campaign.id,
        recipientId: recipient.id,
        action: "recipient_unsubscribed",
        actorUserId: null,
        details: JSON.stringify({ suppressionId }),
      });
      return res
        .status(200)
        .type("html")
        .send(
          "<h1>You are unsubscribed</h1><p>You will not receive further NERP programme updates from Paeds Resus.</p>"
        );
    }
  );
}
