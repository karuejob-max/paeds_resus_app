import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { generateDifferentials } from '../differential-engine';
import { recommendInterventions } from '../intervention-recommender';
import { detectOverlappingConditions, generateIntegratedProtocol, prioritizeInterventions } from '../multi-system-scoring';
import type { PrimarySurveyData } from '../../shared/clinical-types';

export const clinicalReasoningRouter = router({
  /**
   * Analyze primary survey data and generate clinical reasoning results
   */
  analyze: publicProcedure
    .input(
      z.object({
        patientType: z.enum(['neonate', 'child', 'pregnant_postpartum', 'adult']),
        physiologicState: z.enum([
          'cardiac_arrest',
          'respiratory_arrest',
          'severe_bleeding',
          'unresponsive',
          'seizure',
          'shock',
          'severe_respiratory_distress',
          'stroke_symptoms',
          'sepsis_suspected',
          'poisoning',
          'severe_pain',
          'other_emergency',
        ]),
        airway: z.object({
          status: z.enum(['patent', 'obstructed', 'secured']),
          observations: z.record(z.string(), z.boolean()).optional(),
          interventions: z.record(z.string(), z.boolean()).optional(),
          notes: z.string().optional(),
        }),
        breathing: z.object({
          rate: z.number(),
          pattern: z.enum(['normal', 'deep_kussmaul', 'shallow', 'irregular', 'apneic']),
          effort: z.enum(['normal', 'increased', 'minimal']),
          effortSigns: z.record(z.string(), z.boolean()).optional(),
          spO2: z.number(),
          auscultation: z
            .object({
              wheezing: z.boolean().optional(),
              stridor: z.boolean().optional(),
              silent_chest: z.boolean().optional(),
            })
            .optional(),
        }),
        circulation: z.object({
          heartRate: z.number(),
          bloodPressure: z
            .object({
              systolic: z.number(),
              diastolic: z.number(),
            })
            .optional(),
          perfusion: z.object({
            capillary_refill: z.enum(['normal', 'delayed', 'very_delayed']),
            peripheral_pulses: z.enum(['strong', 'weak', 'absent']),
            central_pulses: z.enum(['strong', 'weak', 'absent']),
            skin_temperature: z.enum(['warm', 'cool', 'cold']),
            skin_color: z.enum(['pink', 'pale', 'mottled', 'cyanotic']),
          }),
          rhythm: z.enum(['regular', 'irregular', 'bradycardia', 'tachycardia']).optional(),
          history: z.record(z.string(), z.boolean()).optional(),
        }),
        disability: z.object({
          avpu: z.enum(['alert', 'voice', 'pain', 'unresponsive']),
          pupils: z.object({
            size_left: z.number(),
            size_right: z.number(),
            reactive_left: z.boolean(),
            reactive_right: z.boolean(),
          }),
          blood_glucose: z.number().optional(),
          seizure: z
            .object({
              active: z.boolean().optional(),
              just_stopped: z.boolean().optional(),
              duration_minutes: z.number().optional(),
            })
            .optional(),
          posturing: z.enum(['none', 'decorticate', 'decerebrate']).optional(),
          notes: z.string().optional(),
        }),
        exposure: z.object({
          temperature: z.number(),
          weight: z.number(),
          age_years: z.number().optional(),
          visible_injuries: z.record(z.string(), z.boolean()).optional(),
          pregnancy_related: z
            .object({
              currently_pregnant: z.boolean().optional(),
              gestational_age_weeks: z.number().optional(),
              postpartum: z.boolean().optional(),
              days_postpartum: z.number().optional(),
            })
            .optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      // Convert input to PrimarySurveyData format
      const surveyData = {
        ...input,
        timestamp: new Date(),
      } as PrimarySurveyData;

      // Generate differential diagnoses
      const differentials = generateDifferentials(surveyData);

      if (differentials.length === 0) {
        throw new Error('Unable to generate differential diagnoses from provided data');
      }

      // Get top differential
      const topDifferential = differentials[0];

      // Detect overlapping conditions (multi-system scoring)
      const { overlapping, dangerousOverlaps, systemsInvolved } = detectOverlappingConditions(differentials);

      // Recommend interventions based on top differential
      let { immediate, urgent, confirmatory, requiredTests } = recommendInterventions(
        topDifferential,
        surveyData
      );

      // If multiple conditions detected, generate integrated protocol
      let systemInteractionWarnings: string[] = [];
      let prioritySequence: string[] = [];
      let conflictResolutions: string[] = [];

      if (overlapping.length >= 2) {
        const integratedProtocol = generateIntegratedProtocol(
          overlapping,
          dangerousOverlaps,
          surveyData
        );

        // Merge integrated protocol interventions with single-condition interventions
        immediate = [...integratedProtocol.immediateInterventions, ...immediate];
        systemInteractionWarnings = integratedProtocol.systemInteractionWarnings;
        prioritySequence = integratedProtocol.prioritySequence;
        conflictResolutions = integratedProtocol.conflictResolutions;

        // Prioritize interventions (ABC threats first)
        immediate = prioritizeInterventions(immediate, surveyData);
      }

      return {
        surveyData,
        differentials,
        immediateInterventions: immediate,
        urgentInterventions: urgent,
        confirmatoryInterventions: confirmatory,
        requiredTests,
        // Multi-system scoring results
        overlappingConditions: overlapping,
        dangerousOverlaps,
        systemsInvolved,
        systemInteractionWarnings,
        prioritySequence,
        conflictResolutions,
      };
    }),
});
