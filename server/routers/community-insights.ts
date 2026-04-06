/**
 * Community Insights Router
 * 
 * Integrates Safe-Truth parent/guardian feedback into institutional analytics.
 * Distinct from Care Signal (staff reporting) - focuses on parent voice.
 * 
 * Strategic alignment: Pillar 5 (community voice) + institutional partnership
 */

import { protectedProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { db } from '../db';
import { analyticsEvents, usersTable } from '../../drizzle/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';

export const communityInsightsRouter = router({
  /**
   * Get community insights for an institution
   * Shows care gaps reported by parents/guardians
   */
  getInsights: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        timeRange: z.enum(['week', 'month', 'quarter']),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify user has access to this institution
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.user.id),
      });

      if (!user || user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can view community insights',
        });
      }

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      if (input.timeRange === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (input.timeRange === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else {
        startDate.setMonth(now.getMonth() - 3);
      }

      // Fetch care gap reports from parent Safe-Truth submissions
      const gapReports = await db.query.analyticsEvents.findMany({
        where: and(
          eq(analyticsEvents.eventName, 'parent_care_gap_reported'),
          gte(analyticsEvents.createdAt, startDate),
          lte(analyticsEvents.createdAt, now),
        ),
        orderBy: desc(analyticsEvents.createdAt),
        limit: 100,
      });

      // Aggregate by category
      const categoryCounts: Record<string, any> = {};
      gapReports.forEach((report: any) => {
        const data = report.data || {};
        const category = data.gapCategory || 'Other';
        const severity = data.severity || 'medium';
        
        if (!categoryCounts[category]) {
          categoryCounts[category] = {
            category,
            severity,
            reports: [],
            totalReports: 0,
            childrenAffected: new Set(),
          };
        }
        
        categoryCounts[category].reports.push(data);
        categoryCounts[category].totalReports += 1;
        if (data.childId) {
          categoryCounts[category].childrenAffected.add(data.childId);
        }
      });

      // Format care gap reports
      const formattedGaps = Object.values(categoryCounts).map((gap: any) => ({
        id: Math.random(),
        category: gap.category,
        severity: gap.severity,
        description: gap.reports[0]?.description || 'Care gap reported by parents',
        reportCount: gap.totalReports,
        affectedChildren: gap.childrenAffected.size,
        lastReported: gap.reports[0]?.createdAt || new Date().toISOString(),
        recommendedAction: getRecommendedAction(gap.category),
      }));

      // Calculate summary metrics
      const criticalGaps = formattedGaps.filter((g: any) => g.severity === 'critical').length;
      const totalReports = gapReports.length;
      const childrenAffected = new Set(
        gapReports.map((r: any) => r.data?.childId).filter(Boolean)
      ).size;

      // Calculate resolution rate (gaps that have been addressed)
      const resolvedGaps = await db.query.analyticsEvents.findMany({
        where: and(
          eq(analyticsEvents.eventName, 'care_gap_addressed'),
          gte(analyticsEvents.createdAt, startDate),
          lte(analyticsEvents.createdAt, now),
        ),
      });

      const resolutionRate = totalReports > 0 
        ? Math.round((resolvedGaps.length / totalReports) * 100)
        : 0;

      // Get trends
      const trends = calculateTrends(formattedGaps);

      // Get recommended actions
      const recommendedActions = generateRecommendedActions(formattedGaps);

      return {
        totalReports,
        criticalGaps,
        childrenAffected,
        resolutionRate,
        gapReports: formattedGaps.sort((a: any, b: any) => {
          const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return severityOrder[a.severity as keyof typeof severityOrder] - 
                 severityOrder[b.severity as keyof typeof severityOrder];
        }),
        trends,
        recommendedActions,
      };
    }),

  /**
   * Submit a care gap report from parent/guardian
   */
  submitCareGapReport: protectedProcedure
    .input(
      z.object({
        gapCategory: z.string(),
        description: z.string(),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        childId: z.number().optional(),
        institutionId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Record the care gap report in analytics
      await db.insert(analyticsEvents).values({
        userId: ctx.user.id,
        eventName: 'parent_care_gap_reported',
        data: {
          gapCategory: input.gapCategory,
          description: input.description,
          severity: input.severity,
          childId: input.childId,
          institutionId: input.institutionId,
        },
        createdAt: new Date(),
      });

      return { success: true };
    }),

  /**
   * Mark a care gap as addressed
   */
  markGapAddressed: protectedProcedure
    .input(
      z.object({
        gapCategory: z.string(),
        institutionId: z.number(),
        action: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user is admin
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.user.id),
      });

      if (!user || user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can mark gaps as addressed',
        });
      }

      // Record the action
      await db.insert(analyticsEvents).values({
        userId: ctx.user.id,
        eventName: 'care_gap_addressed',
        data: {
          gapCategory: input.gapCategory,
          institutionId: input.institutionId,
          action: input.action,
        },
        createdAt: new Date(),
      });

      return { success: true };
    }),
});

/**
 * Get recommended action for a care gap category
 */
function getRecommendedAction(category: string): string {
  const recommendations: Record<string, string> = {
    'medication_availability': 'Audit medication stock levels and implement procurement system',
    'staff_training': 'Schedule emergency protocol training for all clinical staff',
    'equipment_maintenance': 'Conduct equipment inventory and maintenance audit',
    'communication_delays': 'Implement communication protocol and staff briefing',
    'referral_barriers': 'Review referral pathways and establish partnerships',
    'long_wait_times': 'Analyze patient flow and optimize triage process',
    'lack_of_supplies': 'Establish supply chain and emergency stock protocols',
    'staff_knowledge_gaps': 'Provide targeted clinical education and mentoring',
    'default': 'Investigate root cause and develop improvement plan',
  };

  return recommendations[category] || recommendations['default'];
}

/**
 * Calculate trend data for visualization
 */
function calculateTrends(gaps: any[]): any[] {
  const categoryTotals: Record<string, number> = {};
  const total = gaps.length;

  gaps.forEach((gap: any) => {
    categoryTotals[gap.category] = (categoryTotals[gap.category] || 0) + gap.reportCount;
  });

  return Object.entries(categoryTotals)
    .map(([category, count]) => ({
      category,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      count,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);
}

/**
 * Generate recommended actions based on gaps
 */
function generateRecommendedActions(gaps: any[]): any[] {
  const criticalGaps = gaps
    .filter((g: any) => g.severity === 'critical' || g.severity === 'high')
    .sort((a: any, b: any) => b.reportCount - a.reportCount)
    .slice(0, 5);

  return criticalGaps.map((gap: any, idx: number) => ({
    title: `Address: ${gap.category}`,
    description: gap.description,
    impact: gap.severity === 'critical' ? 'High' : 'Medium',
    timeline: idx === 0 ? 'Immediate' : idx === 1 ? 'This week' : 'This month',
    action: getRecommendedAction(gap.category),
  }));
}
