/**
 * ResusGPS Auto-Launch Router
 * 
 * Handles seamless pathway auto-launch with recommendation AI integration.
 * Ensures every ResusGPS session is tracked for fellowship analytics.
 * 
 * Strategic alignment: Pillar B mastery through personalized, frictionless learning paths
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { analyticsEvents, InsertAnalyticsEvent } from '../../drizzle/schema';
import { eq, and, gte } from 'drizzle-orm';

export const resusAutoLaunch = router({
  /**
   * Get recommended pathway for auto-launch
   * Returns pathway ID, condition, and learner context
   */
  getRecommendedPathway: protectedProcedure
    .input(z.object({
      institutionId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      // Get learner's recent sessions (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentSessions = await db
        .select()
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.userId, ctx.user.id),
            eq(analyticsEvents.eventType, 'resusGps_session_completed'),
            gte(analyticsEvents.createdAt, thirtyDaysAgo)
          )
        );

      // Parse conditions from recent sessions
      const practiceCount = new Map<string, number>();
      for (const session of recentSessions) {
        try {
          const data = typeof session.eventData === 'string'
            ? JSON.parse(session.eventData)
            : session.eventData;
          if (data.attributedConditions) {
            for (const condition of data.attributedConditions) {
              practiceCount.set(condition, (practiceCount.get(condition) || 0) + 1);
            }
          }
        } catch (e) {
          console.error('Error parsing session:', e);
        }
      }

      // Find condition with fewest sessions (prioritize variety)
      let recommendedCondition = 'septic_shock'; // Default
      let minCount = Infinity;

      practiceCount.forEach((count, condition) => {
        if (count < minCount) {
          minCount = count;
          recommendedCondition = condition;
        }
      });

      // If no recent practice, recommend highest-priority condition
      if (practiceCount.size === 0) {
        recommendedCondition = 'cardiac_arrest'; // Highest priority
      }

      // Map condition to pathway
      const pathwayMap: Record<string, string> = {
        'cardiac_arrest': 'cardiac_arrest_protocol',
        'septic_shock': 'septic_shock_protocol',
        'respiratory_failure': 'respiratory_failure_protocol',
        'status_epilepticus': 'seizure_protocol',
        'severe_malaria': 'malaria_protocol',
        'anaphylaxis': 'anaphylaxis_protocol',
        'dka': 'dka_protocol',
        'meningitis': 'meningitis_protocol',
        'pneumonia': 'pneumonia_protocol',
        'gastroenteritis': 'gastroenteritis_protocol',
        'dehydration': 'dehydration_protocol',
        'hypoglycemia': 'hypoglycemia_protocol',
        'airway_obstruction': 'airway_protocol',
      };

      const pathway = pathwayMap[recommendedCondition] || 'general_resus';

      return {
        pathway,
        condition: recommendedCondition,
        sessionCount: practiceCount.get(recommendedCondition) || 0,
        totalSessions: recentSessions.length,
        message: `Recommended: ${recommendedCondition}. Practice this condition to complete your fellowship.`,
      };
    }),

  /**
   * Get specific pathway configuration for auto-launch
   */
  getPathwayConfig: protectedProcedure
    .input(z.object({
      pathway: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Pathway configurations
      const pathwayConfigs: Record<string, any> = {
        'cardiac_arrest_protocol': {
          name: 'Cardiac Arrest',
          phase: 'cardiac-arrest',
          initialThreat: 'cardiac_arrest',
          priority: 'critical',
          estimatedDuration: 15,
          keyInterventions: ['CPR', 'Defibrillation', 'Epinephrine'],
        },
        'septic_shock_protocol': {
          name: 'Septic Shock',
          phase: 'shock',
          initialThreat: 'septic_shock',
          priority: 'critical',
          estimatedDuration: 20,
          keyInterventions: ['IV Access', 'Fluid Bolus', 'Antibiotics'],
        },
        'respiratory_failure_protocol': {
          name: 'Respiratory Failure',
          phase: 'breathing',
          initialThreat: 'respiratory_failure',
          priority: 'critical',
          estimatedDuration: 15,
          keyInterventions: ['Airway Assessment', 'Oxygen', 'Intubation'],
        },
        'seizure_protocol': {
          name: 'Status Epilepticus',
          phase: 'seizure',
          initialThreat: 'status_epilepticus',
          priority: 'high',
          estimatedDuration: 20,
          keyInterventions: ['Benzodiazepine', 'Phenytoin', 'Airway'],
        },
        'anaphylaxis_protocol': {
          name: 'Anaphylaxis',
          phase: 'anaphylaxis',
          initialThreat: 'anaphylaxis',
          priority: 'critical',
          estimatedDuration: 10,
          keyInterventions: ['Epinephrine IM', 'IV Access', 'Antihistamine'],
        },
        'dka_protocol': {
          name: 'Diabetic Ketoacidosis',
          phase: 'metabolic',
          initialThreat: 'dka',
          priority: 'high',
          estimatedDuration: 25,
          keyInterventions: ['IV Access', 'Fluid Bolus', 'Insulin', 'Potassium'],
        },
        'meningitis_protocol': {
          name: 'Meningitis',
          phase: 'infection',
          initialThreat: 'meningitis',
          priority: 'high',
          estimatedDuration: 20,
          keyInterventions: ['IV Access', 'Antibiotics', 'Supportive Care'],
        },
        'malaria_protocol': {
          name: 'Severe Malaria',
          phase: 'infection',
          initialThreat: 'severe_malaria',
          priority: 'high',
          estimatedDuration: 20,
          keyInterventions: ['IV Access', 'Antimalarials', 'Supportive Care'],
        },
        'general_resus': {
          name: 'General Resuscitation',
          phase: 'primary-survey',
          initialThreat: null,
          priority: 'medium',
          estimatedDuration: 15,
          keyInterventions: ['Assessment', 'Stabilization'],
        },
      };

      const config = pathwayConfigs[input.pathway];
      if (!config) {
        throw new Error(`Unknown pathway: ${input.pathway}`);
      }

      return config;
    }),

  /**
   * Log auto-launch event
   * Track when user launches via recommendation
   */
  logAutoLaunch: protectedProcedure
    .input(z.object({
      pathway: z.string(),
      condition: z.string(),
      source: z.enum(['recommendation', 'manual', 'quick-launch']),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      await db.insert(analyticsEvents).values({
        userId: ctx.user.id,
        eventType: 'resusGps_auto_launch',
        eventName: `Auto-launch: ${input.condition}`,
        eventData: JSON.stringify({
          pathway: input.pathway,
          condition: input.condition,
          source: input.source,
          timestamp: new Date().toISOString(),
        }),
        createdAt: new Date(),
      });

      return { success: true };
    }),

  /**
   * Get learner profile for auto-population
   * Returns demographics and preferences
   */
  getLearnerProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      // Get learner's last session to infer demographics
      const lastSession = await db
        .select()
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.userId, ctx.user.id),
            eq(analyticsEvents.eventType, 'resusGps_session_completed')
          )
        )
        .orderBy((col) => col.createdAt)
        .limit(1);

      let demographics = {
        defaultAge: 5,
        defaultWeight: 18,
        defaultAgeUnit: 'years' as const,
        defaultWeightUnit: 'kg' as const,
      };

      if (lastSession && lastSession.length > 0) {
        try {
          const data = typeof lastSession[0].eventData === 'string'
            ? JSON.parse(lastSession[0].eventData)
            : lastSession[0].eventData;

          if (data.patientAge) demographics.defaultAge = data.patientAge;
          if (data.patientWeight) demographics.defaultWeight = data.patientWeight;
        } catch (e) {
          console.error('Error parsing last session:', e);
        }
      }

      return demographics;
    }),
});
