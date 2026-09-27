import { and, count, desc, eq, gt, isNull, or } from "drizzle-orm";
import { getDb } from "../db";
import { inAppNotifications } from "../../drizzle/schema";

export type NotificationDomain = "clinical" | "role" | "learning" | "finance" | "system";
export type NotificationSeverity = "info" | "action_required" | "urgent";

export type CreateNotificationInput = {
  userId: number;
  type: string;
  domain: NotificationDomain;
  severity?: NotificationSeverity;
  requiresAction?: boolean;
  title: string;
  body: string;
  actionUrl?: string | null;
  relatedId?: number | null;
  data?: Record<string, unknown>;
  dedupeKey?: string | null;
  expiresAt?: Date | null;
};

export type CanonicalNotification = typeof inAppNotifications.$inferSelect & {
  data: Record<string, unknown> | null;
};

function parseData(dataJson: string | null): Record<string, unknown> | null {
  if (!dataJson) return null;
  try {
    const parsed = JSON.parse(dataJson);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function toCanonicalNotification(
  row: typeof inAppNotifications.$inferSelect,
): CanonicalNotification {
  const domain = row.domain ?? (row.type.includes("role") || row.type.includes("institution") ? "role" : row.type.includes("course") || row.type.includes("certificate") || row.type.includes("quiz") ? "learning" : row.type.includes("payment") || row.type.includes("renewal") ? "finance" : row.type.startsWith("iers_") || row.type.includes("care_signal") ? "clinical" : "system");
  const severity = row.severity ?? (row.type.startsWith("iers_") ? "urgent" : row.requiresAction || row.type.includes("role") || row.type.includes("deadline") || row.type.includes("renewal") ? "action_required" : "info");
  return { ...row, domain, severity, requiresAction: row.requiresAction || severity !== "info", data: parseData(row.dataJson ?? null) };
}

export async function createCanonicalNotification(input: CreateNotificationInput) {
  const db = await getDb();
  if (!db) return { created: false, reason: "database_unavailable" as const };

  const dedupeKey = input.dedupeKey ?? null;
  if (dedupeKey) {
    const [existing] = await db
      .select()
      .from(inAppNotifications)
      .where(and(eq(inAppNotifications.userId, input.userId), eq(inAppNotifications.dedupeKey, dedupeKey)))
      .orderBy(desc(inAppNotifications.createdAt))
      .limit(1);
    if (existing) return { created: false, duplicate: true as const, notification: toCanonicalNotification(existing) };
  }

  const [inserted] = await db.insert(inAppNotifications).values({
    userId: input.userId,
    type: input.type,
    domain: input.domain,
    severity: input.severity ?? "info",
    requiresAction: input.requiresAction ?? false,
    title: input.title,
    body: input.body,
    actionUrl: input.actionUrl ?? null,
    relatedId: input.relatedId ?? null,
    dataJson: input.data ? JSON.stringify(input.data) : null,
    dedupeKey,
    expiresAt: input.expiresAt ?? null,
    read: false,
  });

  const id = Number((inserted as unknown as { insertId?: number }).insertId ?? 0);
  const [notification] = id
    ? await db.select().from(inAppNotifications).where(eq(inAppNotifications.id, id)).limit(1)
    : [];
  return { created: true as const, notification: notification ? toCanonicalNotification(notification) : null };
}

export async function listCanonicalNotifications(input: {
  userId: number;
  limit: number;
  unreadOnly?: boolean;
  domain?: NotificationDomain;
  actionRequiredOnly?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const conditions = [
    eq(inAppNotifications.userId, input.userId),
    isNull(inAppNotifications.dismissedAt),
    or(isNull(inAppNotifications.expiresAt), gt(inAppNotifications.expiresAt, now)),
  ];
  if (input.unreadOnly) conditions.push(eq(inAppNotifications.read, false));
  if (input.domain) conditions.push(eq(inAppNotifications.domain, input.domain));
  if (input.actionRequiredOnly) conditions.push(eq(inAppNotifications.requiresAction, true));
  const rows = await db
    .select()
    .from(inAppNotifications)
    .where(and(...conditions))
    .orderBy(desc(inAppNotifications.createdAt))
    .limit(input.limit);
  return rows.map(toCanonicalNotification);
}

export async function countCanonicalUnread(userId: number) {
  const db = await getDb();
  if (!db) return { unreadCount: 0, urgentCount: 0, actionRequiredCount: 0 };
  const base = [
    eq(inAppNotifications.userId, userId),
    eq(inAppNotifications.read, false),
    isNull(inAppNotifications.dismissedAt),
    or(isNull(inAppNotifications.expiresAt), gt(inAppNotifications.expiresAt, new Date())),
  ];
  const [unread] = await db.select({ value: count() }).from(inAppNotifications).where(and(...base));
  const [urgent] = await db.select({ value: count() }).from(inAppNotifications).where(and(...base, eq(inAppNotifications.severity, "urgent")));
  const [actionRequired] = await db.select({ value: count() }).from(inAppNotifications).where(and(...base, eq(inAppNotifications.requiresAction, true)));
  return {
    unreadCount: Number(unread?.value ?? 0),
    urgentCount: Number(urgent?.value ?? 0),
    actionRequiredCount: Number(actionRequired?.value ?? 0),
  };
}
