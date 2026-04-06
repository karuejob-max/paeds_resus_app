/**
 * Admin Notification Dashboard Router
 * 
 * Real-time alerts for facility leaders: streak milestones, training gaps, engagement drops.
 * Drives institutional intelligence and Pillar C engagement.
 * 
 * Strategic alignment: Pillar C institutional intelligence through actionable alerts
 */

import { router, adminProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { analyticsEvents, adminAuditLog } from '../../drizzle/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

interface NotificationAlert {
  id: string;
  type: 'streak_milestone' | 'training_gap' | 'engagement_drop' | 'critical_gap';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  staffName?: string;
  condition?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  read: boolean;
}

export const adminNotifications = router({
  /**
   * Get real-time alerts for facility
   */
  getAlerts: adminProcedure
    .input(z.object({
      institutionId: z.number(),
      limit: z.number().default(20),
      filter: z.enum(['all', 'unread', 'critical']).default('all'),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      const alerts: NotificationAlert[] = [];

      // Get recent analytics events for the facility
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentEvents = await db
        .select()
        .from(analyticsEvents)
        .where(gte(analyticsEvents.createdAt, sevenDaysAgo))
        .orderBy(desc(analyticsEvents.createdAt))
        .limit(1000);

      // Parse events and generate alerts
      const streakMilestones = new Map<number, { condition: string; streak: number }>();
      const engagementByUser = new Map<number, number>();
      const conditionsByUser = new Map<number, Set<string>>();

      for (const event of recentEvents) {
        if (!event.userId) continue;

        // Track engagement
        engagementByUser.set(event.userId, (engagementByUser.get(event.userId) || 0) + 1);

        // Track conditions practiced
        if (event.eventType === 'resusGps_session_completed') {
          try {
            const data = typeof event.eventData === 'string'
              ? JSON.parse(event.eventData)
              : event.eventData;

            if (data.attributedConditions) {
              if (!conditionsByUser.has(event.userId)) {
                conditionsByUser.set(event.userId, new Set());
              }
              for (const condition of data.attributedConditions) {
                conditionsByUser.get(event.userId)!.add(condition);
              }
            }
          } catch (e) {
            console.error('Error parsing event:', e);
          }
        }

        // Track streak milestones
        if (event.eventType === 'streak_milestone_reached') {
          try {
            const data = typeof event.eventData === 'string'
              ? JSON.parse(event.eventData)
              : event.eventData;

            if (data.streak === 7 || data.streak === 14 || data.streak === 30) {
              streakMilestones.set(event.userId, {
                condition: data.condition,
                streak: data.streak,
              });
            }
          } catch (e) {
            console.error('Error parsing streak event:', e);
          }
        }
      }

      // Generate streak milestone alerts
      for (const [userId, { condition, streak }] of streakMilestones.entries()) {
        alerts.push({
          id: `streak-${userId}-${condition}-${streak}`,
          type: 'streak_milestone',
          title: `🔥 ${streak}-Day Streak!`,
          message: `Staff member reached ${streak}-day streak on ${condition}. Great engagement!`,
          severity: 'info',
          condition,
          metadata: { userId, streak },
          createdAt: new Date(),
          read: false,
        });
      }

      // Generate engagement drop alerts
      const avgEngagement = Array.from(engagementByUser.values()).reduce((a, b) => a + b, 0) / engagementByUser.size || 0;
      for (const [userId, count] of engagementByUser.entries()) {
        if (count < avgEngagement * 0.5) {
          alerts.push({
            id: `engagement-drop-${userId}`,
            type: 'engagement_drop',
            title: '⚠️ Engagement Drop',
            message: `Staff member has ${count} sessions this week (below average). Consider follow-up.`,
            severity: 'warning',
            metadata: { userId, sessionsThisWeek: count, avgEngagement: Math.round(avgEngagement) },
            createdAt: new Date(),
            read: false,
          });
        }
      }

      // Generate training gap alerts
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const thirtyDayEvents = await db
        .select()
        .from(analyticsEvents)
        .where(gte(analyticsEvents.createdAt, thirtyDaysAgo));

      const conditionsPracticedInMonth = new Set<string>();
      for (const event of thirtyDayEvents) {
        if (event.eventType === 'resusGps_session_completed') {
          try {
            const data = typeof event.eventData === 'string'
              ? JSON.parse(event.eventData)
              : event.eventData;

            if (data.attributedConditions) {
              for (const condition of data.attributedConditions) {
                conditionsPracticedInMonth.add(condition);
              }
            }
          } catch (e) {
            console.error('Error parsing event:', e);
          }
        }
      }

      // Critical conditions that should be practiced regularly
      const criticalConditions = [
        'cardiac_arrest',
        'septic_shock',
        'respiratory_failure',
        'status_epilepticus',
        'anaphylaxis',
      ];

      for (const condition of criticalConditions) {
        if (!conditionsPracticedInMonth.has(condition)) {
          alerts.push({
            id: `critical-gap-${condition}`,
            type: 'critical_gap',
            title: `🚨 Critical Training Gap`,
            message: `${condition} has not been practiced in 30+ days. Schedule training immediately.`,
            severity: 'critical',
            condition,
            metadata: { condition, daysSinceLastPractice: 30 },
            createdAt: new Date(),
            read: false,
          });
        }
      }

      // Filter alerts
      let filtered = alerts;
      if (input.filter === 'unread') {
        filtered = alerts.filter(a => !a.read);
      } else if (input.filter === 'critical') {
        filtered = alerts.filter(a => a.severity === 'critical');
      }

      // Sort by severity and date
      filtered.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      return {
        alerts: filtered.slice(0, input.limit),
        total: alerts.length,
        unreadCount: alerts.filter(a => !a.read).length,
        criticalCount: alerts.filter(a => a.severity === 'critical').length,
      };
    }),

  /**
   * Get facility-level aggregation
   */
  getFacilityAggregation: adminProcedure
    .input(z.object({
      institutionId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentEvents = await db
        .select()
        .from(analyticsEvents)
        .where(gte(analyticsEvents.createdAt, sevenDaysAgo));

      const stats = {
        totalSessions: 0,
        activeStaff: new Set<number>(),
        topPerformers: [] as Array<{ userId: number; sessions: number }>,
        criticalGaps: [] as string[],
      };

      const staffSessions = new Map<number, number>();

      for (const event of recentEvents) {
        if (event.eventType === 'resusGps_session_completed' && event.userId) {
          stats.totalSessions++;
          stats.activeStaff.add(event.userId);
          staffSessions.set(event.userId, (staffSessions.get(event.userId) || 0) + 1);
        }
      }

      // Top performers
      stats.topPerformers = Array.from(staffSessions.entries())
        .map(([userId, sessions]) => ({ userId, sessions }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 5);

      return {
        totalSessions: stats.totalSessions,
        activeStaff: stats.activeStaff.size,
        avgSessionsPerStaff: stats.activeStaff.size > 0 ? Math.round(stats.totalSessions / stats.activeStaff.size) : 0,
        topPerformers: stats.topPerformers,
        engagementTrend: 'stable', // TODO: Calculate trend
      };
    }),

  /**
   * Mark alert as read
   */
  markAsRead: adminProcedure
    .input(z.object({
      alertId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // In production, store alert read state in database
      // For now, return success
      return { success: true };
    }),

  /**
   * Dismiss alert
   */
  dismissAlert: adminProcedure
    .input(z.object({
      alertId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // In production, store dismissal in database
      return { success: true };
    }),
});
