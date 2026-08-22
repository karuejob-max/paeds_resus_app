import { and, eq, inArray, isNotNull } from "drizzle-orm";
import {
  inAppNotifications,
  institutionProductSubscriptions,
  institutionRenewalNotificationPreferences,
  institutionRenewalNotifications,
  institutionalAccountAdmins,
  institutionalAccounts,
  institutionalProducts,
} from "../../drizzle/schema";
import type { AppDb } from "./institution-access";

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

async function institutionAdminUserIds(db: AppDb, institutionId: number): Promise<number[]> {
  const [owner] = await db
    .select({ userId: institutionalAccounts.userId })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, institutionId))
    .limit(1);
  const admins = await db
    .select({ userId: institutionalAccountAdmins.userId })
    .from(institutionalAccountAdmins)
    .where(eq(institutionalAccountAdmins.institutionalAccountId, institutionId));
  return Array.from(new Set([owner?.userId, ...admins.map((admin) => admin.userId)].filter((id): id is number => Boolean(id))));
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
    if (preference?.inAppEnabled === false) {
      result.skipped += 1;
      continue;
    }
    const configuredDays = (preference?.reminderDays ?? "30,14,7,0").split(",").map(Number).filter((day) => Number.isInteger(day));
    if (!configuredDays.includes(reminderDayForType(notificationType))) {
      result.skipped += 1;
      continue;
    }
    const recipients = await institutionAdminUserIds(db, subscription.institutionId);
    const copy = notificationCopy(notificationType, subscription.displayName, subscription.renewsAt);
    const renewalKey = subscription.renewsAt?.toISOString().slice(0, 10) ?? subscription.subscriptionStatus;

    for (const recipientUserId of recipients) {
      const dedupeKey = `${subscription.institutionId}:${subscription.productId}:${subscription.subscriptionId}:${recipientUserId}:${notificationType}:${renewalKey}`;
      const [existing] = await db.select({ id: institutionRenewalNotifications.id }).from(institutionRenewalNotifications).where(eq(institutionRenewalNotifications.dedupeKey, dedupeKey)).limit(1);
      if (existing) {
        result.skipped += 1;
        continue;
      }

      try {
        const inserted = await db.insert(institutionRenewalNotifications).values({
          institutionalAccountId: subscription.institutionId,
          productId: subscription.productId,
          subscriptionId: subscription.subscriptionId,
          recipientUserId,
          notificationType,
          channel: "in_app",
          status: "queued",
          dedupeKey,
          title: copy.title,
          body: copy.body,
          actionUrl: "/institution#billing",
          scheduledFor: now,
          attempts: 0,
        });
        const notificationId = (inserted as unknown as { insertId: number }).insertId;
        await db.insert(inAppNotifications).values({
          userId: recipientUserId,
          type: "institutional_renewal",
          title: copy.title,
          body: copy.body,
          actionUrl: "/institution#billing",
          relatedId: notificationId || null,
          read: false,
        });
        await db.update(institutionRenewalNotifications).set({ status: "sent", sentAt: now, attempts: 1, updatedAt: now }).where(eq(institutionRenewalNotifications.dedupeKey, dedupeKey));
        result.sent += 1;
      } catch (error) {
        result.failed += 1;
        await db.update(institutionRenewalNotifications).set({ status: "failed", failureReason: error instanceof Error ? error.message : "Unknown delivery failure", attempts: 1, updatedAt: now }).where(eq(institutionRenewalNotifications.dedupeKey, dedupeKey));
      }
    }
  }
  return result;
}
