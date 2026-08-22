import { and, eq, inArray } from "drizzle-orm";
import {
  inAppNotifications,
  institutionProductSubscriptions,
  institutionRenewalNotificationPreferences,
  institutionRenewalNotifications,
  institutionalAccountAdmins,
  institutionalAccounts,
  institutionalProducts,
  users,
} from "../../drizzle/schema";
import type { AppDb } from "./institution-access";
import type { InstitutionRenewalNotificationPreference } from "../../drizzle/schema";
import { sendEmail } from "../email-service";

export type RenewalNotificationType =
  | "renewal_30d"
  | "renewal_14d"
  | "renewal_7d"
  | "renewal_due"
  | "past_due"
  | "expired";

type SubscriptionForNotification = {
  subscriptionId: number;
  institutionId: number;
  productId: number;
  productKey: string;
  displayName: string;
  subscriptionStatus: string;
  renewsAt: Date | null;
  expiresAt: Date | null;
};

type RenewalRecipient = {
  userId: number;
  email: string | null;
  phone: string | null;
  name: string | null;
};

export type DeliveryChannel = "in_app" | "email" | "sms";

export function getRenewalDeliveryChannels(
  preference: Pick<InstitutionRenewalNotificationPreference, "inAppEnabled" | "emailEnabled" | "smsEnabled"> | undefined,
  capabilities: { emailConfigured: boolean; smsConfigured: boolean },
): DeliveryChannel[] {
  const channels: DeliveryChannel[] = [];
  if (preference?.inAppEnabled !== false) channels.push("in_app");
  if (preference?.emailEnabled === true && capabilities.emailConfigured) channels.push("email");
  if (preference?.smsEnabled === true && capabilities.smsConfigured) channels.push("sms");
  return channels;
}

export function determineRenewalNotificationType(
  subscription: Pick<SubscriptionForNotification, "subscriptionStatus" | "renewsAt">,
  now = new Date(),
): RenewalNotificationType | null {
  if (subscription.subscriptionStatus === "past_due") return "past_due";
  if (subscription.subscriptionStatus === "expired") return "expired";
  if (!["trial", "active", "grace"].includes(subscription.subscriptionStatus) || !subscription.renewsAt) return null;

  const daysRemaining = Math.ceil((subscription.renewsAt.getTime() - now.getTime()) / 86_400_000);
  if (daysRemaining <= 0) return "renewal_due";
  if (daysRemaining <= 7) return "renewal_7d";
  if (daysRemaining <= 14) return "renewal_14d";
  if (daysRemaining <= 30) return "renewal_30d";
  return null;
}

function reminderDayForType(type: RenewalNotificationType): number {
  if (type === "renewal_30d") return 30;
  if (type === "renewal_14d") return 14;
  if (type === "renewal_7d") return 7;
  return 0;
}

function notificationCopy(
  type: RenewalNotificationType,
  productName: string,
  renewsAt: Date | null,
): { title: string; body: string } {
  const date = renewsAt ? renewsAt.toISOString().slice(0, 10) : "the recorded renewal date";
  switch (type) {
    case "renewal_30d": return { title: `${productName} renewal in 30 days`, body: `${productName} is scheduled for renewal on ${date}. Review the institution’s plan and payment steps in Administration → Billing & renewal.` };
    case "renewal_14d": return { title: `${productName} renewal in 14 days`, body: `${productName} renews on ${date}. Confirm the approved quotation, contract, or payment reference before access changes.` };
    case "renewal_7d": return { title: `${productName} renewal in 7 days`, body: `${productName} renews on ${date}. Resolve any commercial or support issue now; IERS emergency continuity remains protected.` };
    case "renewal_due": return { title: `${productName} renewal is due`, body: `${productName} has reached its recorded renewal date. Review payment confirmation and renewal state in Administration → Billing & renewal.` };
    case "past_due": return { title: `${productName} payment is past due`, body: `${productName} payment is past due. Contact Paeds Resus support with the approved payment reference; active IERS events are not interrupted.` };
    case "expired": return { title: `${productName} subscription expired`, body: `${productName} is expired. Institutional history is preserved; request renewal or recovery review before changing access.` };
  }
}

async function institutionAdminRecipients(db: AppDb, institutionId: number): Promise<RenewalRecipient[]> {
  const [owner] = await db
    .select({ userId: institutionalAccounts.userId })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, institutionId))
    .limit(1);
  const admins = await db
    .select({ userId: institutionalAccountAdmins.userId })
    .from(institutionalAccountAdmins)
    .where(eq(institutionalAccountAdmins.institutionalAccountId, institutionId));
  const userIds = Array.from(new Set([owner?.userId, ...admins.map((admin) => admin.userId)].filter((id): id is number => Boolean(id))));
  if (userIds.length === 0) return [];
  return db.select({ userId: users.id, email: users.email, phone: users.phone, name: users.name }).from(users).where(inArray(users.id, userIds));
}

function appUrl(): string {
  return `${process.env.PUBLIC_APP_URL?.trim() || "https://www.paedsresus.com"}/institution?section=administration`;
}

async function deliverEmail(recipient: RenewalRecipient, copy: { title: string; body: string }): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!recipient.email?.trim()) return { success: false, error: "Recipient has no email address." };
  return sendEmail(recipient.email.trim(), "institutionalBatchNotice", {
    subjectLine: copy.title,
    bodyMessage: copy.body,
    appLink: appUrl(),
  });
}

async function deliverSms(recipient: RenewalRecipient, copy: { title: string; body: string }): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = process.env.INSTITUTION_SMS_WEBHOOK_URL?.trim();
  const webhookToken = process.env.INSTITUTION_SMS_WEBHOOK_TOKEN?.trim();
  if (!webhookUrl || !webhookToken) return { success: false, error: "Institution SMS delivery is not configured." };
  if (!recipient.phone?.trim()) return { success: false, error: "Recipient has no phone number." };
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${webhookToken}` },
      body: JSON.stringify({ to: recipient.phone.trim(), message: `${copy.title}: ${copy.body}` }),
    });
    if (!response.ok) return { success: false, error: `SMS provider returned HTTP ${response.status}.` };
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "SMS delivery failed." };
  }
}

async function deliverChannel(channel: DeliveryChannel, recipient: RenewalRecipient, copy: { title: string; body: string }) {
  if (channel === "in_app") return { success: true as const };
  if (channel === "email") return deliverEmail(recipient, copy);
  return deliverSms(recipient, copy);
}

export async function queueRenewalNotifications(db: AppDb, now = new Date()): Promise<{ processed: number; sent: number; skipped: number; failed: number }> {
  const subscriptions = await db
    .select({
      subscriptionId: institutionProductSubscriptions.id,
      institutionId: institutionProductSubscriptions.institutionalAccountId,
      productId: institutionProductSubscriptions.productId,
      productKey: institutionalProducts.productKey,
      displayName: institutionalProducts.displayName,
      subscriptionStatus: institutionProductSubscriptions.subscriptionStatus,
      renewsAt: institutionProductSubscriptions.renewsAt,
      expiresAt: institutionProductSubscriptions.expiresAt,
    })
    .from(institutionProductSubscriptions)
    .innerJoin(institutionalProducts, eq(institutionalProducts.id, institutionProductSubscriptions.productId))
    .where(inArray(institutionProductSubscriptions.subscriptionStatus, ["trial", "active", "grace", "past_due", "expired"]));

  const preferences = await db.select().from(institutionRenewalNotificationPreferences);
  const preferenceMap = new Map(preferences.map((preference) => [`${preference.institutionalAccountId}:${preference.productKey}`, preference]));
  const result = { processed: 0, sent: 0, skipped: 0, failed: 0 };

  for (const subscription of subscriptions as SubscriptionForNotification[]) {
    const notificationType = determineRenewalNotificationType(subscription, now);
    if (!notificationType) continue;
    result.processed += 1;
    const preference = preferenceMap.get(`${subscription.institutionId}:${subscription.productKey}`);
    const configuredDays = (preference?.reminderDays ?? "30,14,7,0").split(",").map(Number).filter((day) => Number.isInteger(day));
    if (!configuredDays.includes(reminderDayForType(notificationType))) {
      result.skipped += 1;
      continue;
    }
    const channels = getRenewalDeliveryChannels(preference, {
      emailConfigured: Boolean(process.env.SENDGRID_API_KEY?.trim() || process.env.MAILGUN_API_KEY?.trim() || (process.env.AWS_ACCESS_KEY_ID?.trim() && process.env.AWS_SECRET_ACCESS_KEY?.trim())),
      smsConfigured: Boolean(process.env.INSTITUTION_SMS_WEBHOOK_URL?.trim() && process.env.INSTITUTION_SMS_WEBHOOK_TOKEN?.trim()),
    });
    if (channels.length === 0) {
      result.skipped += 1;
      continue;
    }
    const recipients = await institutionAdminRecipients(db, subscription.institutionId);
    const copy = notificationCopy(notificationType, subscription.displayName, subscription.renewsAt);
    const renewalKey = subscription.renewsAt?.toISOString().slice(0, 10) ?? subscription.subscriptionStatus;

    for (const recipient of recipients) {
      for (const channel of channels) {
        const dedupeKey = `${subscription.institutionId}:${subscription.productId}:${subscription.subscriptionId}:${recipient.userId}:${channel}:${notificationType}:${renewalKey}`;
        const [existing] = await db.select({ id: institutionRenewalNotifications.id }).from(institutionRenewalNotifications).where(eq(institutionRenewalNotifications.dedupeKey, dedupeKey)).limit(1);
        if (existing) {
          result.skipped += 1;
          continue;
        }

        let notificationId: number | undefined;
        try {
          const inserted = await db.insert(institutionRenewalNotifications).values({
            institutionalAccountId: subscription.institutionId,
            productId: subscription.productId,
            subscriptionId: subscription.subscriptionId,
            recipientUserId: recipient.userId,
            notificationType,
            channel,
            status: "queued",
            dedupeKey,
            title: copy.title,
            body: copy.body,
            actionUrl: appUrl(),
            scheduledFor: now,
            attempts: 0,
          });
          notificationId = (inserted as unknown as { insertId: number }).insertId;
          const delivery = await deliverChannel(channel, recipient, copy);
          if (delivery.success) {
            if (channel === "in_app") {
              await db.insert(inAppNotifications).values({
                userId: recipient.userId,
                type: "institutional_renewal",
                title: copy.title,
                body: copy.body,
                actionUrl: appUrl(),
                relatedId: notificationId || null,
                read: false,
              });
            }
            await db.update(institutionRenewalNotifications).set({ status: "sent", sentAt: now, attempts: 1, updatedAt: now }).where(eq(institutionRenewalNotifications.dedupeKey, dedupeKey));
            result.sent += 1;
          } else {
            await db.update(institutionRenewalNotifications).set({ status: "failed", failureReason: delivery.error || "Delivery failed", attempts: 1, updatedAt: now }).where(eq(institutionRenewalNotifications.dedupeKey, dedupeKey));
            result.failed += 1;
          }
        } catch (error) {
          result.failed += 1;
          if (notificationId) {
            await db.update(institutionRenewalNotifications).set({ status: "failed", failureReason: error instanceof Error ? error.message : "Delivery failed", attempts: 1, updatedAt: now }).where(eq(institutionRenewalNotifications.dedupeKey, dedupeKey));
          }
        }
      }
    }
  }
  return result;
}
