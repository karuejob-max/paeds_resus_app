/**
 * FB-MAP-1: Fellowship Pathways tRPC Router
 *
 * Provides queries and mutations for ResusGPS pathway ↔ condition mapping.
 * Used by:
 * - Fellowship progress tracking (pillar B: ResusGPS cases per condition)
 * - Analytics (attributing ResusGPS sessions to conditions)
 * - Learner dashboard (showing which conditions have been practiced)
 */

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import {
  FellowshipCondition,
  ResusGPSPathway,
  getConditionsForPathway,
  getPathwaysForCondition,
  getConditionLabel,
  getPathwayLabel,
  isPathwaySessionValid,
  PATHWAY_DEPTH_THRESHOLDS,
} from '../lib/pathway-condition-mapping';

export const fellowshipPathwaysRouter = router({
  /**
   * Get all conditions that can be attributed to a pathway
   * Public: used in ResusGPS UI to show which conditions are being practiced
   */
  getConditionsForPathway: publicProcedure
    .input(
      z.object({
        pathway: z.nativeEnum(ResusGPSPathway),
      })
    )
    .query(({ input }) => {
      const conditions = getConditionsForPathway(input.pathway);
      return {
        pathway: input.pathway,
        pathwayLabel: getPathwayLabel(input.pathway),
        conditions: conditions.map((c) => ({
          condition: c,
          label: getConditionLabel(c),
        })),
      };
    }),

  /**
   * Get all pathways that contribute to a condition
   * Public: used in fellowship progress UI
   */
  getPathwaysForCondition: publicProcedure
    .input(
      z.object({
        condition: z.nativeEnum(FellowshipCondition),
      })
    )
    .query(({ input }) => {
      const pathways = getPathwaysForCondition(input.condition);
      return {
        condition: input.condition,
        conditionLabel: getConditionLabel(input.condition),
        pathways: pathways.map((p) => ({
          pathway: p,
          label: getPathwayLabel(p),
          depthThreshold: PATHWAY_DEPTH_THRESHOLDS[p],
        })),
      };
    }),

  /**
   * Get complete mapping (all conditions and their pathways)
   * Public: used for documentation and admin dashboards
   */
  getCompleteMapping: publicProcedure.query(() => {
    const allConditions = Object.values(FellowshipCondition);
    const mapping = allConditions.map((condition) => ({
      condition,
      label: getConditionLabel(condition),
      pathways: getPathwaysForCondition(condition).map((p) => ({
        pathway: p,
        label: getPathwayLabel(p),
      })),
    }));

    return {
      conditions: allConditions.length,
      pathways: Object.values(ResusGPSPathway).length,
      mapping,
    };
  }),

  /**
   * Validate if a pathway session meets depth requirements
   * Protected: used by analytics to validate ResusGPS sessions for fellowship credit
   */
  validatePathwaySession: protectedProcedure
    .input(
      z.object({
        pathway: z.nativeEnum(ResusGPSPathway),
        durationSeconds: z.number().int().min(0),
        interactionsCount: z.number().int().min(0),
      })
    )
    .query(({ input }) => {
      const isValid = isPathwaySessionValid(
        input.pathway,
        input.durationSeconds,
        input.interactionsCount
      );

      const threshold = PATHWAY_DEPTH_THRESHOLDS[input.pathway];

      return {
        pathway: input.pathway,
        pathwayLabel: getPathwayLabel(input.pathway),
        isValid,
        session: {
          durationSeconds: input.durationSeconds,
          interactionsCount: input.interactionsCount,
        },
        requirements: threshold
          ? {
              minDurationSeconds: threshold.minDurationSeconds,
              minInteractionsCount: threshold.minInteractionsCount,
              description: threshold.description,
            }
          : null,
        gaps: threshold
          ? {
              durationGap: Math.max(
                0,
                threshold.minDurationSeconds - input.durationSeconds
              ),
              interactionsGap: Math.max(
                0,
                threshold.minInteractionsCount - input.interactionsCount
              ),
            }
          : null,
      };
    }),

  /**
   * Get depth thresholds for a pathway
   * Public: used in ResusGPS UI to show engagement requirements
   */
  getPathwayDepthThreshold: publicProcedure
    .input(
      z.object({
        pathway: z.nativeEnum(ResusGPSPathway),
      })
    )
    .query(({ input }) => {
      const threshold = PATHWAY_DEPTH_THRESHOLDS[input.pathway];
      return {
        pathway: input.pathway,
        pathwayLabel: getPathwayLabel(input.pathway),
        threshold: threshold || null,
      };
    }),

  /**
   * Get all conditions and their labels
   * Public: used in UI dropdowns and dashboards
   */
  getAllConditions: publicProcedure.query(() => {
    return Object.values(FellowshipCondition).map((condition) => ({
      value: condition,
      label: getConditionLabel(condition),
    }));
  }),

  /**
   * Get all pathways and their labels
   * Public: used in UI dropdowns and dashboards
   */
  getAllPathways: publicProcedure.query(() => {
    return Object.values(ResusGPSPathway).map((pathway) => ({
      value: pathway,
      label: getPathwayLabel(pathway),
    }));
  }),

  /**
   * Get condition statistics (how many pathways contribute to each)
   * Public: used in admin dashboards
   */
  getConditionStatistics: publicProcedure.query(() => {
    const stats = Object.values(FellowshipCondition).map((condition) => {
      const pathways = getPathwaysForCondition(condition);
      return {
        condition,
        label: getConditionLabel(condition),
        pathwayCount: pathways.length,
        pathways: pathways.map((p) => getPathwayLabel(p)),
      };
    });

    return {
      totalConditions: stats.length,
      averagePathwaysPerCondition:
        stats.reduce((sum, s) => sum + s.pathwayCount, 0) / stats.length,
      stats,
    };
  }),
});
