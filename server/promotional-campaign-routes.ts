import type { Express } from "express";
import { and, eq } from "drizzle-orm";
import {
  promotionalCampaignAuditEvents,
  promotionalCampaignRecipients,
  promotionalCampaigns,
  promotionalMessageSuppressions,
} from "../drizzle/schema";
import { getDb } from "./db";
import {
  setPromotionalPreference,
  verifyPromotionalUnsubscribeToken,
} from "./lib/promotional-messaging";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function registerPromotionalCampaignRoutes(app: Express) {
  app.get("/api/promotional/unsubscribe", async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    const verified = verifyPromotionalUnsubscribeToken(token);
    if (!verified) {
      return res
        .status(400)
        .type("html")
        .send(
          "<h1>Unsubscribe link unavailable</h1><p>This link is invalid. Please contact Paeds Resus if you need help.</p>"
        );
    }
    const db = await getDb();
    if (!db) {
      return res
        .status(503)
        .type("html")
        .send("<h1>Temporarily unavailable</h1><p>Please try again later.</p>");
    }
    const [campaign] = await db
      .select({ id: promotionalCampaigns.id })
      .from(promotionalCampaigns)
      .where(eq(promotionalCampaigns.campaignKey, verified.campaignKey))
      .limit(1);
    const [recipient] = campaign
      ? await db
          .select({
            id: promotionalCampaignRecipients.id,
            userId: promotionalCampaignRecipients.userId,
            email: promotionalCampaignRecipients.email,
          })
          .from(promotionalCampaignRecipients)
          .where(
            and(
              eq(promotionalCampaignRecipients.id, verified.recipientId),
              eq(promotionalCampaignRecipients.campaignId, campaign.id)
            )
          )
          .limit(1)
      : [];
    if (!campaign || !recipient) {
      return res
        .status(400)
        .type("html")
        .send(
          "<h1>Unsubscribe link unavailable</h1><p>This link is not valid for an active Paeds Resus campaign recipient.</p>"
        );
    }

    const email = normalizeEmail(recipient.email);
    const [existing] = await db
      .select({
        id: promotionalMessageSuppressions.id,
        reason: promotionalMessageSuppressions.reason,
      })
      .from(promotionalMessageSuppressions)
      .where(eq(promotionalMessageSuppressions.email, email))
      .limit(1);
    let suppressionId: number;
    if (existing) {
      suppressionId = existing.id;
      await db
        .update(promotionalMessageSuppressions)
        .set({
          reason:
            existing.reason === "hard_bounce" ? "hard_bounce" : "unsubscribe",
          note: "Recipient opted out through a signed Paeds Resus promotional link.",
          isActive: true,
          deactivatedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(promotionalMessageSuppressions.id, existing.id));
    } else {
      const inserted = await db
        .insert(promotionalMessageSuppressions)
        .values({
          email,
          reason: "unsubscribe",
          note: "Recipient opted out through a signed Paeds Resus promotional link.",
          isActive: true,
        })
        .$returningId();
      suppressionId = (inserted as { id?: number }[])[0]?.id ?? 0;
      if (!suppressionId)
        return res
          .status(500)
          .type("html")
          .send(
            "<h1>Temporarily unavailable</h1><p>Please try again later.</p>"
          );
    }
    await setPromotionalPreference(db, {
      userId: recipient.userId,
      status: "opted_out",
      source: "unsubscribe_link",
      actorUserId: null,
    });
    await db.insert(promotionalCampaignAuditEvents).values({
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
        "<h1>You are unsubscribed</h1><p>You will not receive further optional Paeds Resus programme messages at this email address.</p>"
      );
  });
}
