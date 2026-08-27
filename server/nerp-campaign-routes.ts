import type { Express, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import {
  nerpCampaignSuppressionAuditEvents,
  nerpCampaignSuppressions,
  nerpPromotionAuditEvents,
  nerpPromotionCampaigns,
  nerpPromotionRecipients,
} from "../drizzle/schema";
import { getDb } from "./db";
import { normalizedEmail } from "./lib/nerp-campaign-controls";
import { verifyUnsubscribeToken } from "./lib/nerp-campaign-email";

export function registerNerpCampaignRoutes(app: Express) {
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
