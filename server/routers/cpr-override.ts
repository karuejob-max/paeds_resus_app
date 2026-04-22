/**
 * Phase 4: CPR Override Router
 * 
 * Handles logging, retrieval, and analysis of clinician overrides.
 * Provides accountability for deviations from standard protocols.
 */

import { z } from 'zod';
import { router, protectedProcedure } from '@/server/trpc';
import { db } from '@/server/db';
import { cprOverrideLogs, overrideStatistics, overrideJustificationTemplates } from '@/drizzle/schema-override';
import { cprSessions } from '@/drizzle/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

/**
 * Override type enum matching schema
 */
const OverrideTypeEnum = z.enum([
  'skip_rhythm_check',
  'medication_timing',
  'shock_energy',
  'antiarrhythmic_selection',
  'skip_medication',
  'continue_cpr_beyond_protocol',
  'other',
]);

/**
 * Input schema for logging an override
 */
const LogOverrideInput = z.object({
  cprSessionId: z.number(),
  overrideType: OverrideTypeEnum,
  arrestDurationSeconds: z.number().optional(),
  rhythmType: z.string().optional(),
  shockCount: z.number().optional(),
  epiDoseCount: z.number().optional(),
  recommendedAction: z.string(),
  actualAction: z.string(),
  justification: z.string().min(10, 'Justification must be at least 10 characters'),
});

/**
 * Input schema for retrieving overrides
 */
const GetOverridesInput = z.object({
  cprSessionId: z.number().optional(),
  overriddenBy: z.number().optional(),
  overrideType: OverrideTypeEnum.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().default(50),
  offset: z.number().default(0),
});

/**
 * Input schema for admin review
 */
const ReviewOverrideInput = z.object({
  overrideLogId: z.number(),
  reviewNotes: z.string(),
  isHighRisk: z.boolean().optional(),
});

/**
 * Input schema for retrieving justification templates
 */
const GetTemplatesInput = z.object({
  overrideType: OverrideTypeEnum.optional(),
  isActive: z.boolean().default(true),
});

export const cprOverrideRouter = router({
  /**
   * Log a clinician override
   * Called when a provider deviates from system recommendation
   */
  logOverride: protectedProcedure
    .input(LogOverrideInput)
    .mutation(async ({ ctx, input }) => {
      const { cprSessionId, overrideType, justification, ...rest } = input;

      // Verify session exists
      const session = await db
        .select()
        .from(cprSessions)
        .where(eq(cprSessions.id, cprSessionId))
        .limit(1);

      if (!session || session.length === 0) {
        throw new Error('CPR session not found');
      }

      // Determine if high-risk override
      const highRiskTypes = ['skip_rhythm_check', 'continue_cpr_beyond_protocol'];
      const isHighRisk = highRiskTypes.includes(overrideType);

      // Log the override
      const result = await db.insert(cprOverrideLogs).values({
        cprSessionId,
        overrideType,
        overriddenBy: ctx.user.id,
        justification,
        isHighRisk,
        ...rest,
      });

      return {
        success: true,
        overrideLogId: result.insertId,
        isHighRisk,
      };
    }),

  /**
   * Get overrides with optional filtering
   */
  getOverrides: protectedProcedure
    .input(GetOverridesInput)
    .query(async ({ input }) => {
      const { cprSessionId, overriddenBy, overrideType, startDate, endDate, limit, offset } = input;

      const conditions = [];

      if (cprSessionId) {
        conditions.push(eq(cprOverrideLogs.cprSessionId, cprSessionId));
      }

      if (overriddenBy) {
        conditions.push(eq(cprOverrideLogs.overriddenBy, overriddenBy));
      }

      if (overrideType) {
        conditions.push(eq(cprOverrideLogs.overrideType, overrideType));
      }

      if (startDate) {
        conditions.push(gte(cprOverrideLogs.createdAt, startDate));
      }

      if (endDate) {
        conditions.push(lte(cprOverrideLogs.createdAt, endDate));
      }

      const overrides = await db
        .select()
        .from(cprOverrideLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(cprOverrideLogs.createdAt))
        .limit(limit)
        .offset(offset);

      return overrides;
    }),

  /**
   * Get a specific override with full details
   */
  getOverrideDetail: protectedProcedure
    .input(z.object({ overrideLogId: z.number() }))
    .query(async ({ input }) => {
      const override = await db
        .select()
        .from(cprOverrideLogs)
        .where(eq(cprOverrideLogs.id, input.overrideLogId))
        .limit(1);

      if (!override || override.length === 0) {
        throw new Error('Override log not found');
      }

      return override[0];
    }),

  /**
   * Admin review of an override
   * Records admin feedback and flags high-risk overrides
   */
  reviewOverride: protectedProcedure
    .input(ReviewOverrideInput)
    .mutation(async ({ ctx, input }) => {
      // Verify user is admin
      if (ctx.user.role !== 'admin') {
        throw new Error('Only admins can review overrides');
      }

      const { overrideLogId, reviewNotes, isHighRisk } = input;

      // Update override with review
      await db
        .update(cprOverrideLogs)
        .set({
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          reviewNotes,
          isHighRisk: isHighRisk ?? undefined,
        })
        .where(eq(cprOverrideLogs.id, overrideLogId));

      return { success: true };
    }),

  /**
   * Get override statistics for admin dashboard
   */
  getStatistics: protectedProcedure
    .input(z.object({
      periodStart: z.date(),
      periodEnd: z.date(),
    }))
    .query(async ({ input }) => {
      const { periodStart, periodEnd } = input;

      // Get all overrides in period
      const overrides = await db
        .select()
        .from(cprOverrideLogs)
        .where(
          and(
            gte(cprOverrideLogs.createdAt, periodStart),
            lte(cprOverrideLogs.createdAt, periodEnd)
          )
        );

      // Calculate statistics
      const stats = {
        totalOverrides: overrides.length,
        byType: {
          skipRhythmCheck: overrides.filter(o => o.overrideType === 'skip_rhythm_check').length,
          medicationTiming: overrides.filter(o => o.overrideType === 'medication_timing').length,
          shockEnergy: overrides.filter(o => o.overrideType === 'shock_energy').length,
          antiarrhythmicSelection: overrides.filter(o => o.overrideType === 'antiarrhythmic_selection').length,
          skipMedication: overrides.filter(o => o.overrideType === 'skip_medication').length,
          continueCprBeyondProtocol: overrides.filter(o => o.overrideType === 'continue_cpr_beyond_protocol').length,
          other: overrides.filter(o => o.overrideType === 'other').length,
        },
        highRiskCount: overrides.filter(o => o.isHighRisk).length,
        uniqueProviders: new Set(overrides.map(o => o.overriddenBy)).size,
        topOverridingProviders: this.getTopOverridingProviders(overrides, 5),
      };

      return stats;
    }),

  /**
   * Get justification templates for override UI
   */
  getJustificationTemplates: protectedProcedure
    .input(GetTemplatesInput)
    .query(async ({ input }) => {
      const { overrideType, isActive } = input;

      const conditions = [];

      if (overrideType) {
        conditions.push(eq(overrideJustificationTemplates.overrideType, overrideType));
      }

      if (isActive) {
        conditions.push(eq(overrideJustificationTemplates.isActive, true));
      }

      const templates = await db
        .select()
        .from(overrideJustificationTemplates)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return templates;
    }),

  /**
   * Create a new justification template (admin only)
   */
  createTemplate: protectedProcedure
    .input(z.object({
      overrideType: OverrideTypeEnum,
      templateText: z.string(),
      category: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Only admins can create templates');
      }

      const result = await db.insert(overrideJustificationTemplates).values({
        ...input,
        createdBy: ctx.user.id,
      });

      return { success: true, templateId: result.insertId };
    }),

  /**
   * Helper: Get top overriding providers
   */
  getTopOverridingProviders: (overrides: any[], limit: number) => {
    const providerCounts = new Map();
    
    overrides.forEach(override => {
      const count = providerCounts.get(override.overriddenBy) || 0;
      providerCounts.set(override.overriddenBy, count + 1);
    });

    return Array.from(providerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([providerId, count]) => ({ providerId, count }));
  },
});
