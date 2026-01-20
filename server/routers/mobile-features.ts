import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { mobileAppService } from "../mobile-features";

export const mobileRouter = router({
  /**
   * Register device for push notifications
   */
  registerDevice: protectedProcedure
    .input(
      z.object({
        deviceId: z.string(),
        deviceType: z.enum(["ios", "android", "web"]),
        pushToken: z.string(),
        deviceInfo: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(({ ctx, input }) => {
      const registration = mobileAppService.registerDevice(ctx.user.id, input.deviceId, input.deviceType, input.pushToken, input.deviceInfo);

      return {
        success: true,
        registration,
      };
    }),

  /**
   * Send push notification
   */
  sendPushNotification: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        title: z.string(),
        body: z.string(),
        type: z.enum(["enrollment", "payment", "training", "achievement", "reminder", "announcement"]),
        data: z.record(z.string(), z.unknown()),
        actionUrl: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const notification = mobileAppService.sendPushNotification(input.userId, {
        title: input.title,
        body: input.body,
        type: input.type,
        data: input.data,
        actionUrl: input.actionUrl,
        userId: input.userId,
      });

      return {
        success: true,
        notification,
      };
    }),

  /**
   * Get user notifications
   */
  getUserNotifications: protectedProcedure.query(({ ctx }) => {
    const notifications = mobileAppService.getUserNotifications(ctx.user.id);

    return {
      success: true,
      notifications,
      total: notifications.length,
    };
  }),

  /**
   * Mark notification as read
   */
  markNotificationAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(({ input }) => {
      const success = mobileAppService.markNotificationAsRead(input.notificationId);

      return {
        success,
        message: success ? "Notification marked as read" : "Failed to mark notification",
      };
    }),

  /**
   * Download course for offline access
   */
  downloadCourseForOffline: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        lessons: z.array(
          z.object({
            lessonId: z.string(),
            title: z.string(),
            content: z.string(),
            videoUrl: z.string().optional(),
            videoSize: z.number().optional(),
          })
        ),
      })
    )
    .mutation(({ ctx, input }) => {
      const offlineCourse = mobileAppService.downloadCourseForOffline(
        ctx.user.id,
        input.courseId,
        input.lessons.map((l) => ({
          id: `lesson-${l.lessonId}`,
          lessonId: l.lessonId,
          title: l.title,
          content: l.content,
          videoUrl: l.videoUrl,
          videoSize: l.videoSize,
          isDownloaded: true,
        }))
      );

      return {
        success: true,
        offlineCourse,
      };
    }),

  /**
   * Get offline courses
   */
  getUserOfflineCourses: protectedProcedure.query(({ ctx }) => {
    const courses = mobileAppService.getUserOfflineCourses(ctx.user.id);

    return {
      success: true,
      courses,
      total: courses.length,
    };
  }),

  /**
   * Sync offline course
   */
  syncOfflineCourse: protectedProcedure
    .input(z.object({ offlineCourseId: z.string() }))
    .mutation(({ input }) => {
      const success = mobileAppService.syncOfflineCourse(input.offlineCourseId);

      return {
        success,
        message: success ? "Course synced" : "Failed to sync course",
      };
    }),

  /**
   * Request native feature permission
   */
  requestNativeFeature: protectedProcedure
    .input(
      z.object({
        featureName: z.string(),
        featureType: z.enum(["camera", "microphone", "location", "contacts", "calendar", "files"]),
      })
    )
    .mutation(({ input }) => {
      const feature = mobileAppService.requestNativeFeature(input.featureName, input.featureType);

      return {
        success: true,
        feature,
      };
    }),

  /**
   * Grant native feature permission
   */
  grantNativeFeaturePermission: protectedProcedure
    .input(z.object({ featureId: z.string() }))
    .mutation(({ input }) => {
      const success = mobileAppService.grantNativeFeaturePermission(input.featureId);

      return {
        success,
        message: success ? "Permission granted" : "Failed to grant permission",
      };
    }),

  /**
   * Log mobile analytics
   */
  logMobileAnalytics: protectedProcedure
    .input(
      z.object({
        deviceId: z.string(),
        sessionId: z.string(),
        appVersion: z.string(),
        osVersion: z.string(),
        deviceType: z.enum(["ios", "android", "web"]),
        sessionStart: z.number(),
        screenViews: z.array(
          z.object({
            screen: z.string(),
            timestamp: z.number(),
            duration: z.number(),
            interactions: z.number(),
          })
        ),
      })
    )
    .mutation(({ ctx, input }) => {
      const analytics = mobileAppService.logMobileAnalytics(ctx.user.id, input.deviceId, {
        sessionId: input.sessionId,
        appVersion: input.appVersion,
        osVersion: input.osVersion,
        deviceType: input.deviceType,
        sessionStart: input.sessionStart,
        screenViews: input.screenViews,
        crashes: [],
        performance: {
          appStartTime: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          networkLatency: 0,
          frameRate: 0,
          batteryUsage: 0,
        },
      });

      return {
        success: true,
        analytics,
      };
    }),

  /**
   * Get user devices
   */
  getUserDevices: protectedProcedure.query(({ ctx }) => {
    const devices = mobileAppService.getUserDevices(ctx.user.id);

    return {
      success: true,
      devices,
      total: devices.length,
    };
  }),

  /**
   * Deregister device
   */
  deregisterDevice: protectedProcedure
    .input(z.object({ deviceId: z.string() }))
    .mutation(({ input }) => {
      const success = mobileAppService.deregisterDevice(input.deviceId);

      return {
        success,
        message: success ? "Device deregistered" : "Failed to deregister device",
      };
    }),

  /**
   * Get mobile statistics
   */
  getMobileStatistics: protectedProcedure.query(() => {
    const stats = mobileAppService.getMobileStatistics();

    return {
      success: true,
      ...stats,
    };
  }),
});
