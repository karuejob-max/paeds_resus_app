import { createHash } from "node:crypto";
import webpush from "web-push";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { ENV } from "../_core/env";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { isMissingTableError } from "../lib/is-missing-db-table";
import {
  iersPushDeliveryLog,
  iersPushSubscriptions,
} from "../../drizzle/schema";

const endpointSchema = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine(
    value => new URL(value).protocol === "https:",
    "Push endpoints must use HTTPS."
  );

export const iersPushSubscriptionInput = z.object({
  endpoint: endpointSchema,
  keys: z.object({
    p256dh: z.string().trim().min(16).max(512),
    auth: z.string().trim().min(8).max(256),
  }),
  userAgent: z.string().trim().max(512).optional(),
});

export function endpointHash(endpoint: string): string {
  return createHash("sha256").update(endpoint).digest("hex");
}

export function isIersWebPushConfigured(): boolean {
  return Boolean(
    ENV.iersVapidSubject && ENV.iersVapidPublicKey && ENV.iersVapidPrivateKey
  );
}

function configureWebPush(): void {
  if (!isIersWebPushConfigured()) return;
  webpush.setVapidDetails(
    ENV.iersVapidSubject,
    ENV.iersVapidPublicKey,
    ENV.iersVapidPrivateKey
  );
}

export type IersActivationPushPayload = {
  activationEventId: number;
  title: string;
  body: string;
  url: string;
  tag: string;
};

export type IersPushDispatchResult = {
  configured: boolean;
  attempted: number;
  sent: number;
  failed: number;
  expired: number;
};

function safePushError(error: unknown): string {
  const statusCode =
    typeof error === "object" && error !== null && "statusCode" in error
      ? String((error as { statusCode?: unknown }).statusCode ?? "")
      : "";
  const message =
    error instanceof Error ? error.message : "Push delivery failed";
  return `${statusCode ? `HTTP ${statusCode}: ` : ""}${message}`.slice(0, 500);
}

/**
 * Best-effort background delivery for one activation fan-out. The in-app alert
 * and foreground polling remain the clinical fallback; a push-service error
 * must never abort activation creation or response acknowledgement.
 */
export async function dispatchIersActivationPush(
  db: Awaited<ReturnType<typeof getDb>>,
  payload: IersActivationPushPayload,
  userIds: number[]
): Promise<IersPushDispatchResult> {
  const result: IersPushDispatchResult = {
    configured: isIersWebPushConfigured(),
    attempted: 0,
    sent: 0,
    failed: 0,
    expired: 0,
  };
  if (!db || !userIds.length || !isIersWebPushConfigured()) return result;

  configureWebPush();
  const subscriptions = await db
    .select()
    .from(iersPushSubscriptions)
    .where(
      and(
        inArray(iersPushSubscriptions.userId, [...new Set(userIds)]),
        eq(iersPushSubscriptions.isActive, true)
      )
    );

  for (const subscription of subscriptions) {
    result.attempted += 1;
    const deliveryKey = `${payload.activationEventId}:${subscription.userId}:${subscription.id}`;
    const [existing] = await db
      .select({
        id: iersPushDeliveryLog.id,
        status: iersPushDeliveryLog.status,
      })
      .from(iersPushDeliveryLog)
      .where(eq(iersPushDeliveryLog.deliveryKey, deliveryKey))
      .limit(1);
    if (existing?.status === "sent") {
      result.sent += 1;
      continue;
    }
    if (!existing) {
      await db.insert(iersPushDeliveryLog).values({
        deliveryKey,
        activationEventId: payload.activationEventId,
        userId: subscription.userId,
        subscriptionId: subscription.id,
        status: "pending",
      });
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify({
          type: "iers_activation",
          activationEventId: payload.activationEventId,
          title: payload.title,
          body: payload.body,
          tag: payload.tag,
          url: payload.url,
          requireInteraction: true,
        }),
        { TTL: 60, urgency: "high", topic: payload.tag.slice(0, 32) }
      );
      await db
        .update(iersPushDeliveryLog)
        .set({ status: "sent", sentAt: new Date(), errorMessage: null })
        .where(eq(iersPushDeliveryLog.deliveryKey, deliveryKey));
      await db
        .update(iersPushSubscriptions)
        .set({ lastUsedAt: new Date(), updatedAt: new Date() })
        .where(eq(iersPushSubscriptions.id, subscription.id));
      result.sent += 1;
    } catch (error) {
      const errorMessage = safePushError(error);
      const statusCode =
        typeof error === "object" && error !== null && "statusCode" in error
          ? Number((error as { statusCode?: unknown }).statusCode)
          : 0;
      const expired = statusCode === 404 || statusCode === 410;
      await db
        .update(iersPushDeliveryLog)
        .set({ status: expired ? "expired" : "failed", errorMessage })
        .where(eq(iersPushDeliveryLog.deliveryKey, deliveryKey));
      if (expired) {
        await db
          .update(iersPushSubscriptions)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(iersPushSubscriptions.id, subscription.id));
        result.expired += 1;
      } else {
        result.failed += 1;
      }
    }
  }

  return result;
}

export type IersActivationClosurePushPayload = {
  activationEventId: number;
  status: "closed" | "cancelled" | "false_alarm";
  tag: string;
};

/**
 * Best-effort closure delivery. The service worker uses this message to close
 * any persistent notification with the activation tag. Timeline and status in
 * the database remain authoritative if this push is unavailable.
 */
export async function dispatchIersActivationClosurePush(
  db: Awaited<ReturnType<typeof getDb>>,
  payload: IersActivationClosurePushPayload,
  userIds: number[]
): Promise<IersPushDispatchResult> {
  const result: IersPushDispatchResult = {
    configured: isIersWebPushConfigured(),
    attempted: 0,
    sent: 0,
    failed: 0,
    expired: 0,
  };
  if (!db || !userIds.length || !isIersWebPushConfigured()) return result;

  configureWebPush();
  const subscriptions = await db
    .select()
    .from(iersPushSubscriptions)
    .where(
      and(
        inArray(iersPushSubscriptions.userId, [...new Set(userIds)]),
        eq(iersPushSubscriptions.isActive, true)
      )
    );

  for (const subscription of subscriptions) {
    result.attempted += 1;
    const deliveryKey = `${payload.activationEventId}:closure:${payload.status}:${subscription.userId}:${subscription.id}`;
    const [existing] = await db
      .select({
        id: iersPushDeliveryLog.id,
        status: iersPushDeliveryLog.status,
      })
      .from(iersPushDeliveryLog)
      .where(eq(iersPushDeliveryLog.deliveryKey, deliveryKey))
      .limit(1);
    if (existing?.status === "sent") {
      result.sent += 1;
      continue;
    }
    if (!existing) {
      await db.insert(iersPushDeliveryLog).values({
        deliveryKey,
        activationEventId: payload.activationEventId,
        userId: subscription.userId,
        subscriptionId: subscription.id,
        status: "pending",
      });
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify({
          type: "iers_activation_closed",
          activationEventId: payload.activationEventId,
          status: payload.status,
          tag: payload.tag,
        }),
        { TTL: 60, urgency: "high", topic: `${payload.tag}-close`.slice(0, 32) }
      );
      await db
        .update(iersPushDeliveryLog)
        .set({ status: "sent", sentAt: new Date(), errorMessage: null })
        .where(eq(iersPushDeliveryLog.deliveryKey, deliveryKey));
      await db
        .update(iersPushSubscriptions)
        .set({ lastUsedAt: new Date(), updatedAt: new Date() })
        .where(eq(iersPushSubscriptions.id, subscription.id));
      result.sent += 1;
    } catch (error) {
      const errorMessage = safePushError(error);
      const statusCode =
        typeof error === "object" && error !== null && "statusCode" in error
          ? Number((error as { statusCode?: unknown }).statusCode)
          : 0;
      const expired = statusCode === 404 || statusCode === 410;
      await db
        .update(iersPushDeliveryLog)
        .set({ status: expired ? "expired" : "failed", errorMessage })
        .where(eq(iersPushDeliveryLog.deliveryKey, deliveryKey));
      if (expired) {
        await db
          .update(iersPushSubscriptions)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(iersPushSubscriptions.id, subscription.id));
        result.expired += 1;
      } else {
        result.failed += 1;
      }
    }
  }

  return result;
}

const subscriptionInput = iersPushSubscriptionInput;

export const iersNotificationsRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const configured = isIersWebPushConfigured();
    const db = await getDb();
    if (!db) {
      return {
        configured,
        migrationReady: false,
        active: false,
        publicKey: configured ? ENV.iersVapidPublicKey : null,
      };
    }
    try {
      const [subscription] = await db
        .select({ id: iersPushSubscriptions.id })
        .from(iersPushSubscriptions)
        .where(
          and(
            eq(iersPushSubscriptions.userId, ctx.user.id),
            eq(iersPushSubscriptions.isActive, true)
          )
        )
        .orderBy(desc(iersPushSubscriptions.lastSeenAt))
        .limit(1);
      return {
        configured,
        migrationReady: true,
        active: Boolean(subscription),
        publicKey: configured ? ENV.iersVapidPublicKey : null,
      };
    } catch (error) {
      if (isMissingTableError(error, "iers_push_subscriptions")) {
        return {
          configured,
          migrationReady: false,
          active: false,
          publicKey: configured ? ENV.iersVapidPublicKey : null,
        };
      }
      throw error;
    }
  }),

  subscribe: protectedProcedure
    .input(subscriptionInput)
    .mutation(async ({ ctx, input }) => {
      if (!isIersWebPushConfigured()) {
        return { success: false as const, reason: "not_configured" as const };
      }
      const db = await getDb();
      if (!db)
        return {
          success: false as const,
          reason: "database_unavailable" as const,
        };
      const hash = endpointHash(input.endpoint);
      const now = new Date();
      try {
        const [existing] = await db
          .select({ id: iersPushSubscriptions.id })
          .from(iersPushSubscriptions)
          .where(eq(iersPushSubscriptions.endpointHash, hash))
          .limit(1);
        if (existing) {
          await db
            .update(iersPushSubscriptions)
            .set({
              userId: ctx.user.id,
              endpoint: input.endpoint,
              p256dh: input.keys.p256dh,
              auth: input.keys.auth,
              userAgent: input.userAgent ?? null,
              isActive: true,
              lastSeenAt: now,
              updatedAt: now,
            })
            .where(eq(iersPushSubscriptions.id, existing.id));
        } else {
          await db.insert(iersPushSubscriptions).values({
            userId: ctx.user.id,
            endpointHash: hash,
            endpoint: input.endpoint,
            p256dh: input.keys.p256dh,
            auth: input.keys.auth,
            userAgent: input.userAgent ?? null,
            isActive: true,
            lastSeenAt: now,
            createdAt: now,
            updatedAt: now,
          });
        }
        return { success: true as const, active: true };
      } catch (error) {
        if (isMissingTableError(error, "iers_push_subscriptions")) {
          return {
            success: false as const,
            reason: "migration_required" as const,
          };
        }
        throw error;
      }
    }),

  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: endpointSchema }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        return {
          success: false as const,
          reason: "database_unavailable" as const,
        };
      try {
        await db
          .update(iersPushSubscriptions)
          .set({ isActive: false, updatedAt: new Date() })
          .where(
            and(
              eq(iersPushSubscriptions.userId, ctx.user.id),
              eq(
                iersPushSubscriptions.endpointHash,
                endpointHash(input.endpoint)
              )
            )
          );
        return { success: true as const };
      } catch (error) {
        if (isMissingTableError(error, "iers_push_subscriptions")) {
          return { success: true as const };
        }
        throw error;
      }
    }),
});
