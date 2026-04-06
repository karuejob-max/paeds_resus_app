/**
 * ResusGPS Session Analytics Router
 *
 * Handles recording and validating ResusGPS sessions for fellowship pillar B tracking.
 * Integrates with pathway-condition-mapping to attribute sessions to conditions.
 *
 * Flow:
 * 1. Client completes ResusGPS session (records pathway, duration, interactions)
 * 2. Client calls recordResusSession with session data
 * 3. Server validates session meets depth thresholds
 * 4. Server emits resusGps_session_completed event with attributed conditions
 * 5. Analytics aggregates valid sessions per condition per provider
 */

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import * as db from '../db';
import {
  ResusGPSPathway,
  isPathwaySessionValid,
  getConditionsForPathway,
  getPathwayLabel,
  getConditionLabel,
} from '../lib/pathway-condition-mapping';
import { trackAnalyticsEvent } from '../services/analytics.service';

export const resusSessionAnalyticsRouter = router({
  /**
   * Record a completed ResusGPS session
   * Server-side validates depth, attributes to conditions, emits analytics event
   */
  recordSession: protectedProcedure
    .input(
      z.object({
        pathway: z.nativeEnum(ResusGPSPathway),
        durationSeconds: z.number().int().min(0),
        interactionsCount: z.number().int().min(0),
        patientAge: z.string().optional(),
        patientWeight: z.number().optional(),
        sessionId: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validate session meets depth requirements
      const isValid = isPathwaySessionValid(
        input.pathway,
        input.durationSeconds,
        input.interactionsCount
      );

      // Get attributed conditions
      const attributedConditions = getConditionsForPathway(input.pathway);

      // Emit analytics event
      await trackAnalyticsEvent({
        eventType: 'resusGps_session_completed',
        eventName: `ResusGPS Session: ${getPathwayLabel(input.pathway)}`,
        userId: ctx.user.id,
        sessionId: input.sessionId,
        eventData: {
          pathway: input.pathway,
          pathwayLabel: getPathwayLabel(input.pathway),
          durationSeconds: input.durationSeconds,
          interactionsCount: input.interactionsCount,
          isValid,
          attributedConditions: attributedConditions.map((c) => ({
            condition: c,
            label: getConditionLabel(c),
          })),
          patientAge: input.patientAge,
          patientWeight: input.patientWeight,
          notes: input.notes,
          timestamp: new Date().toISOString(),
        },
      });

      return {
        success: true,
        session: {
          pathway: input.pathway,
          pathwayLabel: getPathwayLabel(input.pathway),
          durationSeconds: input.durationSeconds,
          interactionsCount: input.interactionsCount,
          isValid,
          attributedConditions: attributedConditions.map((c) => ({
            condition: c,
            label: getConditionLabel(c),
          })),
        },
      };
    }),

  /**
   * Get session statistics for current user
   * Shows how many valid sessions per condition
   */
  getUserSessionStats: protectedProcedure.query(async ({ ctx }) => {
    // Query analytics events for this user
    const events = await db.getAnalyticsEventsByUser(ctx.user.id, 'resusGps_session_completed', 90);

    // Parse and aggregate by condition
    const sessionsByCondition: Record<
      string,
      {
        count: number;
        lastSession: string;
        totalDuration: number;
      }
    > = {};

    events.forEach((event: any) => {
      try {
        const data = typeof event.eventData === 'string' 
          ? JSON.parse(event.eventData) 
          : event.eventData;

        if (data.isValid && data.attributedConditions) {
          data.attributedConditions.forEach(
            (cond: { condition: string; label: string }) => {
              if (!sessionsByCondition[cond.condition]) {
                sessionsByCondition[cond.condition] = {
                  count: 0,
                  lastSession: event.createdAt,
                  totalDuration: 0,
                };
              }
              sessionsByCondition[cond.condition].count += 1;
              sessionsByCondition[cond.condition].lastSession = event.createdAt;
              sessionsByCondition[cond.condition].totalDuration +=
                data.durationSeconds || 0;
            }
          );
        }
      } catch (e) {
        // Skip malformed events
      }
    });

    return {
      userId: ctx.user.id,
      totalValidSessions: Object.values(sessionsByCondition).reduce(
        (sum, s) => sum + s.count,
        0
      ),
      conditionsWithMinimumCases: Object.entries(sessionsByCondition)
        .filter(([_, stats]) => stats.count >= 3)
        .map(([condition, stats]) => ({
          condition,
          count: stats.count,
          lastSession: stats.lastSession,
          totalDuration: stats.totalDuration,
        })),
      conditionsInProgress: Object.entries(sessionsByCondition)
        .filter(([_, stats]) => stats.count < 3 && stats.count > 0)
        .map(([condition, stats]) => ({
          condition,
          count: stats.count,
          needed: 3 - stats.count,
          lastSession: stats.lastSession,
          totalDuration: stats.totalDuration,
        })),
      allConditionStats: sessionsByCondition,
    };
  }),

  /**
   * Get facility-level condition heatmap
   * Admin only: shows which conditions are being practiced most
   */
  getFacilityConditionHeatmap: protectedProcedure
    .input(
      z.object({
        institutionId: z.string(),
        daysBack: z.number().int().min(1).max(90).default(30),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify user has access to this institution
      const institution = await db.getInstitutionById(input.institutionId);
      if (!institution) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Institution not found',
        });
      }

      // Check if user is admin or staff of this institution
      const userRole = await db.getUserInstitutionRole(
        ctx.user.id,
        input.institutionId
      );
      if (!userRole || !['admin', 'instructor'].includes(userRole)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No access to this institution',
        });
      }

      // Query ResusGPS sessions for all staff at this institution
      const events = await db.getInstitutionAnalyticsEvents(
        input.institutionId,
        'resusGps_session_completed',
        input.daysBack
      );

      // Aggregate by condition
      const conditionStats: Record<
        string,
        {
          label: string;
          validSessions: number;
          totalDuration: number;
          providers: Set<string>;
          lastSession: string;
        }
      > = {};

      events.forEach((event: any) => {
        try {
          const data = typeof event.eventData === 'string'
            ? JSON.parse(event.eventData)
            : event.eventData;

          if (data.isValid && data.attributedConditions) {
            data.attributedConditions.forEach(
              (cond: { condition: string; label: string }) => {
                if (!conditionStats[cond.condition]) {
                  conditionStats[cond.condition] = {
                    label: cond.label,
                    validSessions: 0,
                    totalDuration: 0,
                    providers: new Set(),
                    lastSession: event.createdAt,
                  };
                }
                conditionStats[cond.condition].validSessions += 1;
                conditionStats[cond.condition].totalDuration +=
                  data.durationSeconds || 0;
                conditionStats[cond.condition].providers.add(event.userId);
                conditionStats[cond.condition].lastSession = event.createdAt;
              }
            );
          }
        } catch (e) {
          // Skip malformed events
        }
      });

      // Convert to sortable array
      const heatmap = Object.entries(conditionStats)
        .map(([condition, stats]) => ({
          condition,
          label: stats.label,
          validSessions: stats.validSessions,
          totalDuration: stats.totalDuration,
          averageDuration:
            stats.validSessions > 0
              ? Math.round(stats.totalDuration / stats.validSessions)
              : 0,
          providersCount: stats.providers.size,
          lastSession: stats.lastSession,
        }))
        .sort((a, b) => b.validSessions - a.validSessions);

      return {
        institutionId: input.institutionId,
        institutionName: institution.name,
        daysBack: input.daysBack,
        totalSessions: events.length,
        totalValidSessions: heatmap.reduce((sum, c) => sum + c.validSessions, 0),
        conditionsTracked: heatmap.length,
        heatmap,
      };
    }),

  /**
   * Get provider progress toward fellowship
   * Shows distance to Fellow for each condition
   */
  getProviderFellowshipProgress: protectedProcedure
    .input(
      z.object({
        providerId: z.string().optional(), // If not provided, use current user
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = input.providerId || ctx.user.id;

      // Verify access
      if (input.providerId && input.providerId !== ctx.user.id) {
        // Only admins can view other providers' progress
        const user = await db.getUserById(ctx.user.id);
        if (user?.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot view other providers progress',
          });
        }
      }

      // Get user stats
      // Get user stats (reuse logic from getUserSessionStats)
      const userEvents = await db.getAnalyticsEventsByUser(userId, 'resusGps_session_completed', 90);
      const sessionsByCondition: Record<string, { count: number; lastSession: string; totalDuration: number }> = {};
      
      userEvents.forEach((event: any) => {
        try {
          const data = typeof event.eventData === 'string' 
            ? JSON.parse(event.eventData) 
            : event.eventData;
          if (data.isValid && data.attributedConditions) {
            data.attributedConditions.forEach(
              (cond: { condition: string; label: string }) => {
                if (!sessionsByCondition[cond.condition]) {
                  sessionsByCondition[cond.condition] = {
                    count: 0,
                    lastSession: event.createdAt,
                    totalDuration: 0,
                  };
                }
                sessionsByCondition[cond.condition].count += 1;
                sessionsByCondition[cond.condition].lastSession = event.createdAt;
                sessionsByCondition[cond.condition].totalDuration += data.durationSeconds || 0;
              }
            );
          }
        } catch (e) {
          // Skip malformed events
        }
      });
      
      const conditionsWithMinimumCases = Object.entries(sessionsByCondition)
        .filter(([_, stats]) => stats.count >= 3)
        .map(([condition, stats]) => ({
          condition,
          count: stats.count,
          lastSession: stats.lastSession,
          totalDuration: stats.totalDuration,
        }));
      
      const conditionsInProgress = Object.entries(sessionsByCondition)
        .filter(([_, stats]) => stats.count < 3 && stats.count > 0)
        .map(([condition, stats]) => ({
          condition,
          count: stats.count,
          needed: 3 - stats.count,
          lastSession: stats.lastSession,
          totalDuration: stats.totalDuration,
        }));

      const provider = await db.getUserById(userId);

      return {
        providerId: userId,
        providerName: provider?.name,
        totalConditionsAtMinimum: conditionsWithMinimumCases.length,
        conditionsInProgress: conditionsInProgress.length,
        fellowshipReadiness: {
          pillarB: {
            required: 27, // 27 conditions
            achieved: conditionsWithMinimumCases.length,
            percentage: Math.round(
              (conditionsWithMinimumCases.length / 27) * 100
            ),
          },
        },
        details: {
          minimum: conditionsWithMinimumCases,
          inProgress: conditionsInProgress,
        },
      };
    }),
});
