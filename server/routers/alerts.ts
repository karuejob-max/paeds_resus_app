import { z } from "zod";
import { publicProcedure, router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  alerts,
  alertConfigurations,
  alertDeliveryLog,
  alertSubscriptions,
  alertHistory,
  alertStatistics,
  patientVitals,
  patients,
} from "../../drizzle/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export const alertsRouter = router({
  // Get alert configuration for a provider
  getConfiguration: protectedProcedure.query(async ({ ctx }: any) => {
    const config = await (getDb() as any)
      .select()
      .from(alertConfigurations)
      .where(eq(alertConfigurations.providerId, ctx.user.openId))
      .limit(1);

    if (config.length === 0) {
      // Create default configuration
      const newConfig = await (getDb() as any)
        .insert(alertConfigurations)
        .values({
          providerId: ctx.user.openId,
          alertType: "critical_risk_score",
          riskScoreThreshold: 70,
          enabled: true,
          soundEnabled: true,
          vibrationEnabled: true,
          pushNotificationEnabled: true,
        });

      return newConfig[0];
    }

    return config[0];
  }),

  // Update alert configuration
  updateConfiguration: protectedProcedure
    .input(
      z.object({
        riskScoreThreshold: z.number().min(0).max(100).optional(),
        soundEnabled: z.boolean().optional(),
        vibrationEnabled: z.boolean().optional(),
        pushNotificationEnabled: z.boolean().optional(),
        emailNotificationEnabled: z.boolean().optional(),
        quietHoursStart: z.string().optional(),
        quietHoursEnd: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      await (getDb() as any)
        .update(alertConfigurations)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(alertConfigurations.providerId, ctx.user.openId));

      return { success: true };
    }),

  // Create alert for patient
  createAlert: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        alertType: z.enum([
          "critical_risk_score",
          "vital_sign_change",
          "patient_deterioration",
          "intervention_reminder",
          "protocol_recommendation",
          "peer_comparison",
          "learning_milestone",
        ]),
        severity: z.enum(["critical", "high", "medium", "low"]),
        title: z.string(),
        message: z.string(),
        data: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const alert = await (getDb() as any)
        .insert(alerts)
        .values({
          patientId: input.patientId,
          providerId: ctx.user.openId,
          alertType: input.alertType,
          severity: input.severity,
          title: input.title,
          message: input.message,
          data: input.data ? JSON.stringify(input.data) : null,
          status: "pending",
        });

      // Log delivery attempt
      await (getDb() as any)
        .insert(alertDeliveryLog)
        .values({
          alertId: (alert as any)[0],
          deliveryMethod: "push_notification",
          status: "sent",
          sentAt: new Date(),
        });

      return { alertId: alert[0], success: true };
    }),

  // Get alerts for provider
  getAlerts: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        unreadOnly: z.boolean().default(false),
        severity: z.enum(["critical", "high", "medium", "low"]).optional(),
      })
    )
    .query(async ({ ctx, input }: any) => {
      let query = (getDb() as any)
        .select()
        .from(alerts)
        .where(eq(alerts.providerId, ctx.user.openId));

      if (input.unreadOnly) {
        query = query.where(eq(alerts.isRead, false));
      }

      if (input.severity) {
        query = query.where(eq(alerts.severity, input.severity));
      }

      const result = await query
        .orderBy(desc(alerts.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return result;
    }),

  // Mark alert as read
  markAsRead: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ ctx, input }: any) => {
      await (getDb() as any)
        .update(alerts)
        .set({ isRead: true })
        .where(
          and(
            eq(alerts.id, input.alertId),
            eq(alerts.providerId, ctx.user.openId)
          )
        );

      return { success: true };
    }),

  // Acknowledge alert and log action
  acknowledgeAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.number(),
        actionTaken: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      await (getDb() as any)
        .update(alerts)
        .set({
          isAcknowledged: true,
          acknowledgedAt: new Date(),
          actionTaken: input.actionTaken || "acknowledged",
          status: "acknowledged",
        })
        .where(
          and(
            eq(alerts.id, input.alertId),
            eq(alerts.providerId, ctx.user.openId)
          )
        );

      return { success: true };
    }),

  // Subscribe to patient alerts
  subscribeToPatient: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        subscriptionType: z
          .enum(["all_alerts", "critical_only", "vital_signs_only", "protocol_only"])
          .default("all_alerts"),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const existing = await (getDb() as any)
        .select()
        .from(alertSubscriptions)
        .where(
          and(
            eq(alertSubscriptions.providerId, ctx.user.openId),
            eq(alertSubscriptions.patientId, input.patientId)
          )
        );

      if (existing.length > 0) {
        await (getDb() as any)
          .update(alertSubscriptions)
          .set({
            subscriptionType: input.subscriptionType,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(alertSubscriptions.id, existing[0].id));
      } else {
        await (getDb() as any)
          .insert(alertSubscriptions)
          .values({
            providerId: ctx.user.openId,
            patientId: input.patientId,
            subscriptionType: input.subscriptionType,
            isActive: true,
          });
      }

      return { success: true };
    }),

  // Unsubscribe from patient alerts
  unsubscribeFromPatient: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .mutation(async ({ ctx, input }: any) => {
      await (getDb() as any)
        .update(alertSubscriptions)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(alertSubscriptions.providerId, ctx.user.openId),
            eq(alertSubscriptions.patientId, input.patientId)
          )
        );

      return { success: true };
    }),

  // Get subscribed patients
  getSubscribedPatients: protectedProcedure.query(async ({ ctx }: any) => {
    const subscriptions = await (getDb() as any)
      .select()
      .from(alertSubscriptions)
      .where(
        and(
          eq(alertSubscriptions.providerId, ctx.user.openId),
          eq(alertSubscriptions.isActive, true)
        )
      );

    return subscriptions;
  }),

  // Get alert statistics for provider
  getStatistics: protectedProcedure
    .input(
      z.object({
        period: z.enum(["daily", "weekly", "monthly"]).default("daily"),
      })
    )
    .query(async ({ ctx, input }: any) => {
      const stats = await (getDb() as any)
        .select()
        .from(alertStatistics)
        .where(
          and(
            eq(alertStatistics.providerId, ctx.user.openId),
            eq(alertStatistics.period, input.period)
          )
        )
        .orderBy(desc(alertStatistics.dateField))
        .limit(30);

      return stats;
    }),

  // Get alert history for today
  getTodayHistory: protectedProcedure.query(async ({ ctx }: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const history = await (getDb() as any)
      .select()
      .from(alertHistory)
      .where(
        and(
          eq(alertHistory.providerId, ctx.user.openId),
          eq(alertHistory.dateField, today)
        )
      );

    if (history.length === 0) {
      // Create new history record
      await (getDb() as any)
        .insert(alertHistory)
        .values({
          providerId: ctx.user.openId,
          dateField: today,
          alertsReceivedToday: 0,
          alertsAcknowledgedToday: 0,
          criticalAlertsToday: 0,
        });

      return { alertsReceivedToday: 0, alertsAcknowledgedToday: 0, criticalAlertsToday: 0 };
    }

    return history[0];
  }),

  // Check for critical risk scores and trigger alerts
  checkCriticalRiskScores: publicProcedure.query(async (): Promise<any> => {
    // Get all patients with critical risk scores
    const criticalPatients = await (getDb() as any)
      .select()
      .from(patientVitals);

    const alertsCreated = [];

    for (const vital of criticalPatients) {
      // Check if alert already exists
      const existingAlert = await (getDb() as any)
        .select()
        .from(alerts)
        .where(
          and(
            eq(alerts.patientId, vital.patientId),
            eq(alerts.alertType, "critical_risk_score"),
            eq(alerts.status, "pending")
          )
        );

      if (existingAlert.length === 0) {
        // Create new alert
        const alert = await (getDb() as any)
          .insert(alerts)
          .values({
            patientId: vital.patientId,
            providerId: vital.providerId,
            alertType: "critical_risk_score",
            severity: vital.riskScore >= 80 ? "critical" : "high",
            title: `Critical Risk Score: ${vital.riskScore}`,
            message: `Patient risk score has reached ${vital.riskScore}. Immediate intervention may be required.`,
            data: JSON.stringify({
              riskScore: vital.riskScore,
              heartRate: vital.heartRate,
              temperature: vital.temperature,
              respiratoryRate: vital.respiratoryRate,
              oxygenSaturation: vital.oxygenSaturation,
            }),
            status: "pending",
          });

        alertsCreated.push(alert[0]);
      }
    }

    return { alertsCreated: alertsCreated.length, totalCritical: criticalPatients.length };
  }),

  // Get alert delivery status
  getDeliveryStatus: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      const deliveryLogs = await (getDb() as any)
        .select()
        .from(alertDeliveryLog)
        .where(eq(alertDeliveryLog.alertId, input.alertId));

      return deliveryLogs;
    }),

  // Dismiss alert
  dismissAlert: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ ctx, input }: any) => {
      await (getDb() as any)
        .update(alerts)
        .set({ status: "dismissed" })
        .where(
          and(
            eq(alerts.id, input.alertId),
            eq(alerts.providerId, ctx.user.openId)
          )
        );

      return { success: true };
    }),

  // Get critical alerts count
  getCriticalAlertsCount: protectedProcedure.query(async ({ ctx }: any) => {
    const result = await (getDb() as any)
      .select({ count: sql`COUNT(*)` })
      .from(alerts)
      .where(
        and(
          eq(alerts.providerId, ctx.user.openId),
          eq(alerts.severity, "critical"),
          eq(alerts.status, "pending")
        )
      );

    return { count: result[0]?.count || 0 };
  }),
});
