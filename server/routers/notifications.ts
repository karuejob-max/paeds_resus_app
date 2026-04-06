import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { notificationService } from "../notifications";
import { sendRecommendationNotification } from "../services/notification.service";

export const notificationsRouter = router({
  /**
   * Get all notifications for the current user
   */
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
      })
    )
    .query(({ input, ctx }) => {
      const notifications = notificationService.getNotifications(ctx.user.id, input.limit);
      return {
        success: true,
        notifications,
        unreadCount: notificationService.getUnreadCount(ctx.user.id),
      };
    }),

  /**
   * Get unread notification count
   */
  getUnreadCount: protectedProcedure.query(({ ctx }) => {
    return {
      unreadCount: notificationService.getUnreadCount(ctx.user.id),
    };
  }),

  /**
   * Mark a notification as read
   */
  markAsRead: protectedProcedure
    .input(
      z.object({
        notificationId: z.string(),
      })
    )
    .mutation(({ input, ctx }) => {
      const success = notificationService.markAsRead(ctx.user.id, input.notificationId);
      return {
        success,
        message: success ? "Notification marked as read" : "Notification not found",
      };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(({ ctx }) => {
    const count = notificationService.markAllAsRead(ctx.user.id);
    return {
      success: true,
      message: `${count} notifications marked as read`,
      count,
    };
  }),

  /**
   * Delete a notification
   */
  deleteNotification: protectedProcedure
    .input(
      z.object({
        notificationId: z.string(),
      })
    )
    .mutation(({ input, ctx }) => {
      const success = notificationService.deleteNotification(ctx.user.id, input.notificationId);
      return {
        success,
        message: success ? "Notification deleted" : "Notification not found",
      };
    }),

  /**
   * Clear all notifications
   */
  clearAll: protectedProcedure.mutation(({ ctx }) => {
    const count = notificationService.clearNotifications(ctx.user.id);
    return {
      success: true,
      message: `${count} notifications cleared`,
      count,
    };
  }),

  /**
   * Get notification preferences
   */
  getPreferences: protectedProcedure.query(({ ctx }) => {
    const preferences = notificationService.getPreferences(ctx.user.id);
    return {
      success: true,
      preferences,
    };
  }),

  /**
   * Send recommendation notification
   */
  sendRecommendations: protectedProcedure
    .input(
      z.object({
        recommendations: z.array(
          z.object({
            title: z.string(),
            content: z.string(),
            priority: z.enum(["low", "medium", "high"]),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const success = await sendRecommendationNotification(ctx.user.id, input.recommendations);
        return {
          success,
          message: success ? "Recommendations sent" : "Failed to send recommendations",
        };
      } catch (error) {
        console.error("Error sending recommendation notification:", error);
        return {
          success: false,
          message: "Error sending recommendations",
        };
      }
    }),

  /**
   * Update notification preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean().optional(),
        smsNotifications: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
        enrollmentAlerts: z.boolean().optional(),
        paymentAlerts: z.boolean().optional(),
        certificateAlerts: z.boolean().optional(),
        courseUpdates: z.boolean().optional(),
        quizReminders: z.boolean().optional(),
        achievementNotifications: z.boolean().optional(),
      })
    )
    .mutation(({ input, ctx }) => {
      notificationService.setPreferences(ctx.user.id, input);
      return {
        success: true,
        message: "Preferences updated successfully",
        preferences: notificationService.getPreferences(ctx.user.id),
      };
    }),
});
