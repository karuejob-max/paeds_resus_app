/**
 * care-signal-review.ts
 *
 * Phase 7.4 — Push Notifications for Care Signal Review Responses
 *
 * Endpoints:
 *   submitReview        — Admin/MOH submits a response to a resource gap event
 *   getMyNotifications  — Provider fetches their unread in-app notifications
 *   markRead            — Provider marks a notification as read
 *   markAllRead         — Provider marks all notifications as read
 *   getUnreadCount      — Provider fetches unread notification count (for bell badge)
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { careSignalReviews, inAppNotifications, analyticsEvents } from '../../drizzle/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { isMissingTableError } from '../lib/is-missing-db-table';

export const careSignalReviewRouter = router({
  /**
   * Admin submits a review response to a resource gap event.
   * Creates a careSignalReview row and an inAppNotification for the reporter.
   */
  submitReview: protectedProcedure
    .input(
      z.object({
        analyticsEventId: z.number().int().positive(),
        reporterUserId: z.number().int().positive(),
        interventionName: z.string().min(1).max(128),
        responseText: z.string().min(1).max(2000),
        actionTaken: z.enum(['acknowledged', 'procurement_initiated', 'resolved', 'escalated']).default('acknowledged'),
        expectedResolutionDate: z.string().max(32).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      }
      const reviewerId = ctx.user.id;

      try {
        const [review] = await db
          .insert(careSignalReviews)
          .values({
            analyticsEventId: input.analyticsEventId,
            reporterUserId: input.reporterUserId,
            reviewerUserId: reviewerId,
            interventionName: input.interventionName,
            responseText: input.responseText,
            actionTaken: input.actionTaken,
            expectedResolutionDate: input.expectedResolutionDate,
          })
          .$returningId();

        const actionLabels: Record<string, string> = {
          acknowledged: 'acknowledged',
          procurement_initiated: 'initiated procurement for',
          resolved: 'resolved',
          escalated: 'escalated',
        };
        const actionLabel = actionLabels[input.actionTaken] ?? 'reviewed';

        await db.insert(inAppNotifications).values({
          userId: input.reporterUserId,
          type: 'care_signal_review',
          title: `Care Signal Response: ${input.interventionName}`,
          body: `Your resource gap report for "${input.interventionName}" has been ${actionLabel}. ${input.responseText.slice(0, 200)}${input.responseText.length > 200 ? '…' : ''}`,
          actionUrl: '/care-signal',
          relatedId: review.id,
          read: false,
        });

        return { success: true, reviewId: review.id };
      } catch (error) {
        if (isMissingTableError(error, 'careSignalReviews') || isMissingTableError(error, 'inAppNotifications')) {
          console.error('[careSignalReview.submitReview] missing table — run pnpm run db:apply-0042', error);
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Care Signal notifications are not configured on this server. Contact support.',
          });
        }
        throw error;
      }
    }),

  /**
   * Provider fetches their in-app notifications (newest first).
   */
  getMyNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(20),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const userId = ctx.user.id;

      try {
        const rows = await db
          .select()
          .from(inAppNotifications)
          .where(
            input.unreadOnly
              ? and(eq(inAppNotifications.userId, userId), eq(inAppNotifications.read, false))
              : eq(inAppNotifications.userId, userId)
          )
          .orderBy(desc(inAppNotifications.createdAt))
          .limit(input.limit);

        return rows;
      } catch (error) {
        if (isMissingTableError(error, 'inAppNotifications')) {
          console.warn('[careSignalReview.getMyNotifications] inAppNotifications missing — run db:apply-0042');
          return [];
        }
        throw error;
      }
    }),

  /**
   * Provider fetches unread notification count (for bell badge).
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { count: 0 };
    const userId = ctx.user.id;

    try {
      const [result] = await db
        .select({ count: count() })
        .from(inAppNotifications)
        .where(and(eq(inAppNotifications.userId, userId), eq(inAppNotifications.read, false)));

      return { count: result?.count ?? 0 };
    } catch (error) {
      if (isMissingTableError(error, 'inAppNotifications')) {
        console.warn('[careSignalReview.getUnreadCount] inAppNotifications missing — run db:apply-0042');
        return { count: 0 };
      }
      throw error;
    }
  }),

  /**
   * Provider marks a single notification as read.
   */
  markRead: protectedProcedure
    .input(z.object({ notificationId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      }
      try {
        await db
          .update(inAppNotifications)
          .set({ read: true })
          .where(
            and(
              eq(inAppNotifications.id, input.notificationId),
              eq(inAppNotifications.userId, ctx.user.id)
            )
          );
        return { success: true };
      } catch (error) {
        if (isMissingTableError(error, 'inAppNotifications')) {
          return { success: false };
        }
        throw error;
      }
    }),

  /**
   * Provider marks all notifications as read.
   */
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
    }
    try {
      await db
        .update(inAppNotifications)
        .set({ read: true })
        .where(eq(inAppNotifications.userId, ctx.user.id));
      return { success: true };
    } catch (error) {
      if (isMissingTableError(error, 'inAppNotifications')) {
        return { success: false };
      }
      throw error;
    }
  }),
});
