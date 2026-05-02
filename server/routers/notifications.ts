import { adminProcedure, router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { notificationService } from "../notifications";
import { getDb } from "../db";
import { analyticsEvents, microCourseEnrollments, microCourses, users } from "../../drizzle/schema";
import { and, desc, eq, gte, inArray, isNotNull, ne } from "drizzle-orm";
import { trackEvent } from "../services/analytics.service";
import { sendRecommendationNotification } from "../services/notification.service";
import { sendSMS } from "../sms";
import { sendEmail } from "../email-service";
import { ENV } from "../_core/env";

type LifecycleNudge = {
  enrollmentId: number;
  courseId: string | null;
  courseTitle: string;
  nudgeType: "paid_not_started" | "started_not_completed";
  cadenceHours: number;
  dueSinceHours: number;
};

type LifecycleDispatchResult = {
  sent: number;
  skipped: number;
  processed: number;
  dryRun: boolean;
  items: Array<LifecycleNudge & { status: "sent" | "skipped" }>;
};

const CHANNEL_RETRY_MAX_ATTEMPTS = 2;
const CHANNEL_RETRY_BACKOFF_SECONDS = [60];
const CHANNEL_DEGRADATION_WINDOW_HOURS = 24;
const CHANNEL_DEGRADATION_MIN_ATTEMPTS = 20;
const CHANNEL_DEGRADATION_RATE_THRESHOLD_PERCENT = 60;

type ExternalChannel = "sms" | "email";
type ChannelDegradationState = Record<ExternalChannel, boolean>;

async function getDegradedExternalChannels(): Promise<ChannelDegradationState> {
  const db = await getDb();
  if (!db) return { sms: false, email: false };

  const since = new Date(Date.now() - CHANNEL_DEGRADATION_WINDOW_HOURS * 60 * 60 * 1000);
  const rows = await db
    .select({
      eventData: analyticsEvents.eventData,
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, "provider_conversion"),
        eq(analyticsEvents.eventName, "lifecycle_timed_nudge_sent"),
        gte(analyticsEvents.createdAt, since)
      )
    )
    .limit(10_000);

  const totals: Record<ExternalChannel, { sent: number; failed: number }> = {
    sms: { sent: 0, failed: 0 },
    email: { sent: 0, failed: 0 },
  };

  for (const row of rows) {
    if (!row.eventData) continue;
    try {
      const parsed = JSON.parse(row.eventData) as {
        channels?: {
          sms?: "sent" | "failed" | "skipped";
          email?: "sent" | "failed" | "skipped";
        };
      };
      const smsStatus = parsed.channels?.sms;
      const emailStatus = parsed.channels?.email;
      if (smsStatus === "sent") totals.sms.sent += 1;
      if (smsStatus === "failed") totals.sms.failed += 1;
      if (emailStatus === "sent") totals.email.sent += 1;
      if (emailStatus === "failed") totals.email.failed += 1;
    } catch {
      // Ignore malformed rows.
    }
  }

  const isDegraded = (channel: ExternalChannel): boolean => {
    const attempted = totals[channel].sent + totals[channel].failed;
    if (attempted < CHANNEL_DEGRADATION_MIN_ATTEMPTS) return false;
    const deliveryRate = Math.round((totals[channel].sent / attempted) * 100);
    return deliveryRate < CHANNEL_DEGRADATION_RATE_THRESHOLD_PERCENT;
  };

  return {
    sms: isDegraded("sms"),
    email: isDegraded("email"),
  };
}

async function computeLifecycleNudgesForUser(userId: number): Promise<LifecycleNudge[]> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: microCourseEnrollments.id,
      userId: microCourseEnrollments.userId,
      microCourseId: microCourseEnrollments.microCourseId,
      paymentStatus: microCourseEnrollments.paymentStatus,
      enrollmentStatus: microCourseEnrollments.enrollmentStatus,
      progressPercentage: microCourseEnrollments.progressPercentage,
      createdAt: microCourseEnrollments.createdAt,
      updatedAt: microCourseEnrollments.updatedAt,
      courseId: microCourses.courseId,
      courseTitle: microCourses.title,
    })
    .from(microCourseEnrollments)
    .leftJoin(microCourses, eq(microCourses.id, microCourseEnrollments.microCourseId))
    .where(
      and(
        eq(microCourseEnrollments.userId, userId),
        // Payment gate removed: show nudges for all enrolled users regardless of payment status
        isNotNull(microCourseEnrollments.id)
      )
    )
    .orderBy(desc(microCourseEnrollments.updatedAt));

  const now = Date.now();
  const nudges: LifecycleNudge[] = [];

  for (const row of rows) {
    if (row.enrollmentStatus === "completed") continue;
    const progress = Number(row.progressPercentage ?? 0);
    const nudgeType =
      progress > 0 ? ("started_not_completed" as const) : ("paid_not_started" as const);
    const anchor = nudgeType === "paid_not_started" ? row.createdAt : row.updatedAt;
    if (!anchor) continue;
    const elapsedHours = Math.floor((now - new Date(anchor).getTime()) / 3_600_000);
    if (elapsedHours < 24) continue;
    const cadence = elapsedHours >= 72 ? 72 : 24;

    nudges.push({
      enrollmentId: row.id,
      courseId: row.courseId ?? null,
      courseTitle: row.courseTitle ?? "your course",
      nudgeType,
      cadenceHours: cadence,
      dueSinceHours: elapsedHours,
    });
  }

  return nudges;
}

function lifecycleDestination(courseId: string | null, enrollmentId: number): string {
  if (courseId === "bls") return `/course/bls?enrollmentId=${enrollmentId}`;
  if (courseId === "pals") return `/course/seriously-ill-child?enrollmentId=${enrollmentId}`;
  if (courseId === "pals_septic") return `/course/paediatric-septic-shock?enrollmentId=${enrollmentId}`;
  if (courseId === "instructor") return `/course/instructor?enrollmentId=${enrollmentId}`;
  return "/fellowship";
}

async function getLifecycleSentKeys(userId: number): Promise<Set<string>> {
  const db = await getDb();
  if (!db) return new Set();

  const lookback = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);
  const recentRows = await db
    .select({
      eventData: analyticsEvents.eventData,
      createdAt: analyticsEvents.createdAt,
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.userId, userId),
        eq(analyticsEvents.eventType, "provider_conversion"),
        eq(analyticsEvents.eventName, "lifecycle_timed_nudge_sent"),
        gte(analyticsEvents.createdAt, lookback)
      )
    )
    .orderBy(desc(analyticsEvents.createdAt))
    .limit(500);

  const sentKeys = new Set<string>();
  for (const row of recentRows) {
    if (!row.eventData) continue;
    try {
      const payload = JSON.parse(row.eventData) as {
        enrollmentId?: number;
        nudgeType?: string;
        cadenceHours?: number;
      };
      if (!payload.enrollmentId || !payload.nudgeType || !payload.cadenceHours) continue;
      sentKeys.add(`${payload.enrollmentId}:${payload.nudgeType}:${payload.cadenceHours}`);
    } catch {
      // Ignore malformed historical payload rows.
    }
  }
  return sentKeys;
}

async function dispatchLifecycleNudgesForUser(input: {
  userId: number;
  dryRun: boolean;
  limit: number;
  triggeredByAdminId?: number;
  degradedChannels?: ChannelDegradationState;
}): Promise<LifecycleDispatchResult> {
  const db = await getDb();
  const recipient = db
    ? (
        await db
          .select({
            phone: users.phone,
            email: users.email,
            name: users.name,
          })
          .from(users)
          .where(eq(users.id, input.userId))
          .limit(1)
      )[0]
    : null;
  const preferences = notificationService.getPreferences(input.userId);

  const nudges = (await computeLifecycleNudgesForUser(input.userId)).slice(0, input.limit);
  if (!nudges.length) {
    return { sent: 0, skipped: 0, processed: 0, dryRun: input.dryRun, items: [] };
  }

  const sentKeys = await getLifecycleSentKeys(input.userId);
  const items: Array<LifecycleNudge & { status: "sent" | "skipped" }> = [];
  let sent = 0;
  let skipped = 0;

  for (const nudge of nudges) {
    const dedupeKey = `${nudge.enrollmentId}:${nudge.nudgeType}:${nudge.cadenceHours}`;
    if (sentKeys.has(dedupeKey)) {
      skipped += 1;
      items.push({ ...nudge, status: "skipped" });
      continue;
    }

    const actionUrl = lifecycleDestination(nudge.courseId, nudge.enrollmentId);
    const title = `${nudge.cadenceHours}h reminder: ${
      nudge.nudgeType === "paid_not_started" ? "start your course" : "resume your course"
    }`;
    const body =
      nudge.nudgeType === "paid_not_started"
        ? `You paid for ${nudge.courseTitle}. Start now to activate value from your purchase.`
        : `You started ${nudge.courseTitle}. Resume now to finish and keep momentum.`;

    if (!input.dryRun) {
      notificationService.createNotification(
        input.userId,
        "course_update",
        title,
        body,
        {
          enrollmentId: nudge.enrollmentId,
          courseId: nudge.courseId,
          nudgeType: nudge.nudgeType,
          cadenceHours: nudge.cadenceHours,
        },
        actionUrl,
        nudge.nudgeType === "paid_not_started" ? "Start now" : "Resume now"
      );

      let smsStatus: "sent" | "skipped" | "failed" = "skipped";
      let smsAttempts = 0;
      let smsLastError: string | null = null;
      if (input.degradedChannels?.sms) {
        smsLastError = "sms_channel_degraded_fallback";
      } else if (preferences.smsNotifications && recipient?.phone) {
        const smsText = `${title}. ${body} Continue: ${actionUrl}`;
        for (let attempt = 1; attempt <= CHANNEL_RETRY_MAX_ATTEMPTS; attempt += 1) {
          smsAttempts = attempt;
          const smsResult = await sendSMS({
            phoneNumber: recipient.phone,
            message: smsText,
            messageType: "lifecycle_nudge",
          });
          if (smsResult.success) {
            smsStatus = "sent";
            smsLastError = null;
            break;
          }
          smsStatus = "failed";
          smsLastError = smsResult.error ?? "unknown_sms_error";
        }
      } else {
        smsLastError = !preferences.smsNotifications
          ? "sms_notifications_disabled"
          : "missing_phone";
      }

      let emailStatus: "sent" | "skipped" | "failed" = "skipped";
      let emailAttempts = 0;
      let emailLastError: string | null = null;
      if (input.degradedChannels?.email) {
        emailLastError = "email_channel_degraded_fallback";
      } else if (preferences.emailNotifications && recipient?.email) {
        const baseUrl = ENV.appBaseUrl?.trim() || "https://www.paedsresus.com";
        const absoluteActionUrl = `${baseUrl.replace(/\/$/, "")}${actionUrl}`;
        for (let attempt = 1; attempt <= CHANNEL_RETRY_MAX_ATTEMPTS; attempt += 1) {
          emailAttempts = attempt;
          const emailResult = await sendEmail(
            recipient.email,
            "providerLifecycleNudge",
            {
              userName: recipient.name?.trim() || "Provider",
              reminderTitle: title,
              reminderBody: body,
              actionLink: absoluteActionUrl,
              actionLabel: nudge.nudgeType === "paid_not_started" ? "Start now" : "Resume now",
            }
          );
          if (emailResult.success) {
            emailStatus = "sent";
            emailLastError = null;
            break;
          }
          emailStatus = "failed";
          emailLastError = emailResult.error ?? "unknown_email_error";
        }
      } else {
        emailLastError = !preferences.emailNotifications
          ? "email_notifications_disabled"
          : "missing_email";
      }

      await trackEvent({
        userId: input.userId,
        eventType: "provider_conversion",
        eventName: "lifecycle_timed_nudge_sent",
        pageUrl: "/learner-dashboard",
        eventData: {
          enrollmentId: nudge.enrollmentId,
          courseId: nudge.courseId,
          nudgeType: nudge.nudgeType,
          cadenceHours: nudge.cadenceHours,
          destination: actionUrl,
          channels: {
            inApp: "sent",
            sms: smsStatus,
            email: emailStatus,
          },
          channelReliability: {
            retryPolicy: {
              maxAttempts: CHANNEL_RETRY_MAX_ATTEMPTS,
              backoffSeconds: CHANNEL_RETRY_BACKOFF_SECONDS,
            },
            fallbackPolicy: {
              windowHours: CHANNEL_DEGRADATION_WINDOW_HOURS,
              minAttempts: CHANNEL_DEGRADATION_MIN_ATTEMPTS,
              deliveryRateThresholdPercent: CHANNEL_DEGRADATION_RATE_THRESHOLD_PERCENT,
              degradedChannels: input.degradedChannels ?? { sms: false, email: false },
            },
            inApp: {
              attempts: 1,
              lastError: null,
            },
            sms: {
              attempts: smsAttempts,
              lastError: smsLastError,
            },
            email: {
              attempts: emailAttempts,
              lastError: emailLastError,
            },
          },
          triggeredByAdminId: input.triggeredByAdminId ?? null,
        },
        sessionId: `lifecycle_nudge_${nudge.enrollmentId}`,
      });
    }
    sentKeys.add(dedupeKey);
    sent += 1;
    items.push({ ...nudge, status: "sent" });
  }

  return { sent, skipped, processed: nudges.length, dryRun: input.dryRun, items };
}

export const notificationsRouter = router({
  /**
   * Lifecycle automation (in-app) — due nudges for paid-not-started and started-not-completed.
   * Cadence is currently 24h and 72h; this query is read-only and can back UI prompts and future comms jobs.
   */
  getLifecycleNudges: protectedProcedure.query(async ({ ctx }) => {
    const nudges = await computeLifecycleNudgesForUser(ctx.user.id);
    return { nudges };
  }),

  /**
   * Lifecycle automation executor (current user): sends due 24h/72h in-app nudges with idempotency.
   */
  dispatchLifecycleNudges: protectedProcedure
    .input(
      z
        .object({
          dryRun: z.boolean().optional().default(false),
          limit: z.number().min(1).max(20).optional().default(5),
        })
        .optional()
    )
    .mutation(async ({ ctx, input }) => {
      const degradedChannels = await getDegradedExternalChannels();
      return dispatchLifecycleNudgesForUser({
        userId: ctx.user.id,
        dryRun: input?.dryRun ?? false,
        limit: input?.limit ?? 5,
        degradedChannels,
      });
    }),

  /**
   * Admin batch executor for lifecycle nudges across users (ops runbook support).
   */
  dispatchLifecycleNudgesBatch: adminProcedure
    .input(
      z
        .object({
          dryRun: z.boolean().optional().default(true),
          limitUsers: z.number().min(1).max(500).optional().default(100),
          limitPerUser: z.number().min(1).max(20).optional().default(5),
        })
        .optional()
    )
    .mutation(async ({ ctx, input }) => {
      const dryRun = input?.dryRun ?? true;
      const limitUsers = input?.limitUsers ?? 100;
      const limitPerUser = input?.limitPerUser ?? 5;
      const db = await getDb();
      if (!db) {
        return { dryRun, processedUsers: 0, sent: 0, skipped: 0, userReports: [] as Array<Record<string, unknown>> };
      }

      const candidateUsers = await db
        .select({ userId: microCourseEnrollments.userId })
        .from(microCourseEnrollments)
        .where(
          and(
            // Payment gate removed: show nudges for all enrolled users regardless of payment status
        isNotNull(microCourseEnrollments.id),
            ne(microCourseEnrollments.enrollmentStatus, "completed")
          )
        )
        .groupBy(microCourseEnrollments.userId)
        .orderBy(desc(microCourseEnrollments.updatedAt))
        .limit(limitUsers);

      const userReports: Array<{
        userId: number;
        sent: number;
        skipped: number;
        processed: number;
      }> = [];
      let totalSent = 0;
      let totalSkipped = 0;
      const degradedChannels = await getDegradedExternalChannels();

      for (const candidate of candidateUsers) {
        const report = await dispatchLifecycleNudgesForUser({
          userId: candidate.userId,
          dryRun,
          limit: limitPerUser,
          triggeredByAdminId: ctx.user.id,
          degradedChannels,
        });
        if (report.processed === 0) continue;
        totalSent += report.sent;
        totalSkipped += report.skipped;
        userReports.push({
          userId: candidate.userId,
          sent: report.sent,
          skipped: report.skipped,
          processed: report.processed,
        });
      }

      await trackEvent({
        userId: ctx.user.id,
        eventType: "admin_ops",
        eventName: "lifecycle_batch_dispatch_run",
        pageUrl: "/admin/reports",
        eventData: {
          dryRun,
          limitUsers,
          limitPerUser,
          degradedChannels,
          candidateUsers: candidateUsers.length,
          processedUsers: userReports.length,
          sent: totalSent,
          skipped: totalSkipped,
        },
        sessionId: `admin_lifecycle_batch_${Date.now()}`,
      });

      return {
        dryRun,
        processedUsers: userReports.length,
        sent: totalSent,
        skipped: totalSkipped,
        userReports,
      };
    }),

  /**
   * Admin summary of lifecycle batch dispatch runs.
   */
  getLifecycleDispatchSummary: adminProcedure
    .input(z.object({ lastDays: z.number().min(1).max(90).optional().default(7) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return {
          lastDays: input?.lastDays ?? 7,
          totalRuns: 0,
          dryRuns: 0,
          liveRuns: 0,
          totalSent: 0,
          totalSkipped: 0,
          totalProcessedUsers: 0,
          totalTimedNudges: 0,
          channelTotals: {
            inApp: { sent: 0, failed: 0, skipped: 0 },
            sms: { sent: 0, failed: 0, skipped: 0 },
            email: { sent: 0, failed: 0, skipped: 0 },
          },
          channelFailureTop: {
            inApp: [] as Array<{ reason: string; count: number }>,
            sms: [] as Array<{ reason: string; count: number }>,
            email: [] as Array<{ reason: string; count: number }>,
          },
          channelHealthAlerts: [] as Array<{
            channel: "inApp" | "sms" | "email";
            severity: "warning" | "critical";
            deliveryRatePercent: number;
            attempted: number;
            sent: number;
            failed: number;
            message: string;
          }>,
          channelFallbackActivations: {
            sms: 0,
            email: 0,
          },
          recentRuns: [] as Array<Record<string, unknown>>,
        };
      }
      const days = input?.lastDays ?? 7;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const rows = await db
        .select({
          userId: analyticsEvents.userId,
          createdAt: analyticsEvents.createdAt,
          eventData: analyticsEvents.eventData,
        })
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.eventType, "admin_ops"),
            eq(analyticsEvents.eventName, "lifecycle_batch_dispatch_run"),
            gte(analyticsEvents.createdAt, since)
          )
        )
        .orderBy(desc(analyticsEvents.createdAt))
        .limit(200);
      const lifecycleChannelRows = await db
        .select({
          eventData: analyticsEvents.eventData,
        })
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.eventType, "provider_conversion"),
            eq(analyticsEvents.eventName, "lifecycle_timed_nudge_sent"),
            gte(analyticsEvents.createdAt, since)
          )
        )
        .limit(10_000);

      const recentRuns = rows.map((row) => {
        let data: Record<string, unknown> = {};
        try {
          data = row.eventData ? (JSON.parse(row.eventData) as Record<string, unknown>) : {};
        } catch {
          data = {};
        }
        return {
          adminUserId: row.userId,
          createdAt: row.createdAt,
          dryRun: Boolean(data.dryRun),
          limitUsers: Number(data.limitUsers ?? 0),
          limitPerUser: Number(data.limitPerUser ?? 0),
          candidateUsers: Number(data.candidateUsers ?? 0),
          processedUsers: Number(data.processedUsers ?? 0),
          sent: Number(data.sent ?? 0),
          skipped: Number(data.skipped ?? 0),
        };
      });

      const totalRuns = recentRuns.length;
      const dryRuns = recentRuns.filter((r) => r.dryRun).length;
      const liveRuns = totalRuns - dryRuns;
      const totalSent = recentRuns.reduce((sum, r) => sum + Number(r.sent ?? 0), 0);
      const totalSkipped = recentRuns.reduce((sum, r) => sum + Number(r.skipped ?? 0), 0);
      const totalProcessedUsers = recentRuns.reduce((sum, r) => sum + Number(r.processedUsers ?? 0), 0);
      const channelTotals = {
        inApp: { sent: 0, failed: 0, skipped: 0 },
        sms: { sent: 0, failed: 0, skipped: 0 },
        email: { sent: 0, failed: 0, skipped: 0 },
      };
      const channelFailureCounts = {
        inApp: new Map<string, number>(),
        sms: new Map<string, number>(),
        email: new Map<string, number>(),
      };
      const channelFallbackActivations = {
        sms: 0,
        email: 0,
      };

      for (const row of lifecycleChannelRows) {
        if (!row.eventData) continue;
        try {
          const parsed = JSON.parse(row.eventData) as {
            channels?: {
              inApp?: "sent" | "failed" | "skipped";
              sms?: "sent" | "failed" | "skipped";
              email?: "sent" | "failed" | "skipped";
            };
            channelReliability?: {
              inApp?: { lastError?: string | null };
              sms?: { lastError?: string | null };
              email?: { lastError?: string | null };
            };
          };
          const inAppStatus = parsed.channels?.inApp ?? "skipped";
          const smsStatus = parsed.channels?.sms ?? "skipped";
          const emailStatus = parsed.channels?.email ?? "skipped";
          channelTotals.inApp[inAppStatus] += 1;
          channelTotals.sms[smsStatus] += 1;
          channelTotals.email[emailStatus] += 1;

          if (inAppStatus === "failed") {
            const reason = parsed.channelReliability?.inApp?.lastError || "unknown_in_app_error";
            channelFailureCounts.inApp.set(reason, (channelFailureCounts.inApp.get(reason) ?? 0) + 1);
          }
          if (smsStatus === "failed") {
            const reason = parsed.channelReliability?.sms?.lastError || "unknown_sms_error";
            channelFailureCounts.sms.set(reason, (channelFailureCounts.sms.get(reason) ?? 0) + 1);
          }
          if (emailStatus === "failed") {
            const reason = parsed.channelReliability?.email?.lastError || "unknown_email_error";
            channelFailureCounts.email.set(reason, (channelFailureCounts.email.get(reason) ?? 0) + 1);
          }
          if (parsed.channelReliability?.sms?.lastError === "sms_channel_degraded_fallback") {
            channelFallbackActivations.sms += 1;
          }
          if (parsed.channelReliability?.email?.lastError === "email_channel_degraded_fallback") {
            channelFallbackActivations.email += 1;
          }
        } catch {
          // Ignore malformed event payload rows.
        }
      }

      const toTopFailures = (source: Map<string, number>) =>
        Array.from(source.entries())
          .map(([reason, count]) => ({ reason, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      const channelHealthAlerts: Array<{
        channel: "inApp" | "sms" | "email";
        severity: "warning" | "critical";
        deliveryRatePercent: number;
        attempted: number;
        sent: number;
        failed: number;
        message: string;
      }> = [];
      const channels: Array<"inApp" | "sms" | "email"> = ["inApp", "sms", "email"];
      for (const channel of channels) {
        const sent = channelTotals[channel].sent;
        const failed = channelTotals[channel].failed;
        const attempted = sent + failed;
        if (attempted === 0) continue;
        const deliveryRatePercent = Math.round((sent / attempted) * 100);
        if (deliveryRatePercent < 70) {
          channelHealthAlerts.push({
            channel,
            severity: "critical",
            deliveryRatePercent,
            attempted,
            sent,
            failed,
            message: `${channel} delivery rate is critically low at ${deliveryRatePercent}% (${failed} failed of ${attempted} attempts).`,
          });
        } else if (deliveryRatePercent < 85) {
          channelHealthAlerts.push({
            channel,
            severity: "warning",
            deliveryRatePercent,
            attempted,
            sent,
            failed,
            message: `${channel} delivery rate is below target at ${deliveryRatePercent}% (${failed} failed of ${attempted} attempts).`,
          });
        }
      }

      return {
        lastDays: days,
        totalRuns,
        dryRuns,
        liveRuns,
        totalSent,
        totalSkipped,
        totalProcessedUsers,
        totalTimedNudges: lifecycleChannelRows.length,
        channelTotals,
        channelFailureTop: {
          inApp: toTopFailures(channelFailureCounts.inApp),
          sms: toTopFailures(channelFailureCounts.sms),
          email: toTopFailures(channelFailureCounts.email),
        },
        channelHealthAlerts,
        channelFallbackActivations,
        recentRuns: recentRuns.slice(0, 30),
      };
    }),

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
