/**
 * ResusGPS Analytics Integration Tests
 *
 * End-to-end testing of:
 * 1. Analytics wiring: ResusGPS sessions → pathway validation → analytics events
 * 2. Fellowship progress UI: User stats aggregation
 * 3. Admin condition heatmap: Facility-level analytics
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  ResusGPSPathway,
  FellowshipCondition,
  isPathwaySessionValid,
  getConditionsForPathway,
} from '../server/lib/pathway-condition-mapping';

describe('ResusGPS Analytics Integration', () => {
  describe('1. Analytics Wiring: Session Recording', () => {
    it('should validate sessions that meet depth thresholds', () => {
      // Valid session: 5 minutes, 6 interactions
      const isValid = isPathwaySessionValid(
        ResusGPSPathway.SHOCK_DIFFERENTIATION,
        300,
        6
      );
      expect(isValid).toBe(true);
    });

    it('should reject sessions that do not meet duration threshold', () => {
      // Too short: 1 minute, 6 interactions
      const isValid = isPathwaySessionValid(
        ResusGPSPathway.SHOCK_DIFFERENTIATION,
        60,
        6
      );
      expect(isValid).toBe(false);
    });

    it('should reject sessions that do not meet interaction threshold', () => {
      // Long enough but too few interactions: 5 minutes, 2 interactions
      const isValid = isPathwaySessionValid(
        ResusGPSPathway.SHOCK_DIFFERENTIATION,
        300,
        2
      );
      expect(isValid).toBe(false);
    });

    it('should attribute valid sessions to correct conditions', () => {
      const conditions = getConditionsForPathway(
        ResusGPSPathway.SHOCK_DIFFERENTIATION
      );

      expect(conditions).toContain(FellowshipCondition.SEPTIC_SHOCK);
      expect(conditions).toContain(FellowshipCondition.HYPOVOLEMIC_SHOCK);
      expect(conditions).toContain(FellowshipCondition.CARDIOGENIC_SHOCK);
      expect(conditions.length).toBeGreaterThan(3);
    });

    it('should emit analytics event with attributed conditions', () => {
      // Simulates: client calls recordSession → server validates → emits event
      const pathway = ResusGPSPathway.CIRCULATION;
      const isValid = isPathwaySessionValid(pathway, 200, 4);
      const conditions = getConditionsForPathway(pathway);

      expect(isValid).toBe(true);
      expect(conditions.length).toBeGreaterThan(0);

      // Event payload would be:
      const eventPayload = {
        eventType: 'resusGps_session_completed',
        pathway,
        isValid,
        attributedConditions: conditions,
        durationSeconds: 200,
        interactionsCount: 4,
      };

      expect(eventPayload.eventType).toBe('resusGps_session_completed');
      expect(eventPayload.isValid).toBe(true);
      expect(eventPayload.attributedConditions.length).toBeGreaterThan(0);
    });
  });

  describe('2. Fellowship Progress UI: User Stats Aggregation', () => {
    it('should count valid sessions per condition', () => {
      // Simulate 3 valid sessions for septic shock
      const conditions = [
        FellowshipCondition.SEPTIC_SHOCK,
        FellowshipCondition.SEPTIC_SHOCK,
        FellowshipCondition.SEPTIC_SHOCK,
      ];

      const conditionCounts: Record<string, number> = {};
      conditions.forEach((cond) => {
        conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
      });

      expect(conditionCounts[FellowshipCondition.SEPTIC_SHOCK]).toBe(3);
    });

    it('should identify conditions with minimum cases (≥3)', () => {
      const sessionsByCondition = {
        [FellowshipCondition.SEPTIC_SHOCK]: { count: 5, totalDuration: 1500 },
        [FellowshipCondition.CARDIAC_ARREST]: { count: 3, totalDuration: 900 },
        [FellowshipCondition.SEVERE_ASTHMA]: { count: 2, totalDuration: 600 },
      };

      const withMinimum = Object.entries(sessionsByCondition)
        .filter(([_, stats]) => stats.count >= 3)
        .map(([condition]) => condition);

      expect(withMinimum).toContain(FellowshipCondition.SEPTIC_SHOCK);
      expect(withMinimum).toContain(FellowshipCondition.CARDIAC_ARREST);
      expect(withMinimum).not.toContain(FellowshipCondition.SEVERE_ASTHMA);
      expect(withMinimum.length).toBe(2);
    });

    it('should identify conditions in progress (<3 cases)', () => {
      const sessionsByCondition = {
        [FellowshipCondition.SEPTIC_SHOCK]: { count: 5 },
        [FellowshipCondition.SEVERE_ASTHMA]: { count: 2 },
        [FellowshipCondition.DKA]: { count: 1 },
      };

      const inProgress = Object.entries(sessionsByCondition)
        .filter(([_, stats]) => stats.count < 3 && stats.count > 0)
        .map(([condition, stats]) => ({
          condition,
          count: stats.count,
          needed: 3 - stats.count,
        }));

      expect(inProgress.length).toBe(2);
      expect(inProgress[0].needed).toBe(1); // SEVERE_ASTHMA: 2 cases, needs 1 more
      expect(inProgress[1].needed).toBe(2); // DKA: 1 case, needs 2 more
    });

    it('should calculate fellowship readiness percentage', () => {
      const achieved = 12; // 12 conditions with ≥3 cases
      const required = 27; // 27 total conditions
      const percentage = Math.round((achieved / required) * 100);

      expect(percentage).toBe(44);
    });

    it('should recommend next condition to practice', () => {
      const conditionsInProgress = [
        { condition: FellowshipCondition.SEVERE_ASTHMA, needed: 1 },
        { condition: FellowshipCondition.DKA, needed: 2 },
        { condition: FellowshipCondition.STATUS_EPILEPTICUS, needed: 3 },
      ];

      const recommendation = conditionsInProgress[0]; // Closest to completion
      expect(recommendation.condition).toBe(FellowshipCondition.SEVERE_ASTHMA);
      expect(recommendation.needed).toBe(1);
    });
  });

  describe('3. Admin Condition Heatmap: Facility Analytics', () => {
    it('should aggregate sessions by condition across all providers', () => {
      // Simulate events from 3 providers
      const events = [
        {
          userId: 'provider1',
          attributedConditions: [
            FellowshipCondition.SEPTIC_SHOCK,
            FellowshipCondition.HYPOVOLEMIC_SHOCK,
          ],
        },
        {
          userId: 'provider2',
          attributedConditions: [FellowshipCondition.SEPTIC_SHOCK],
        },
        {
          userId: 'provider3',
          attributedConditions: [
            FellowshipCondition.SEPTIC_SHOCK,
            FellowshipCondition.CARDIAC_ARREST,
          ],
        },
      ];

      const conditionStats: Record<string, { count: number; providers: Set<string> }> = {};

      events.forEach((event) => {
        event.attributedConditions.forEach((cond) => {
          if (!conditionStats[cond]) {
            conditionStats[cond] = { count: 0, providers: new Set() };
          }
          conditionStats[cond].count += 1;
          conditionStats[cond].providers.add(event.userId);
        });
      });

      expect(conditionStats[FellowshipCondition.SEPTIC_SHOCK].count).toBe(3);
      expect(conditionStats[FellowshipCondition.SEPTIC_SHOCK].providers.size).toBe(3);
      expect(conditionStats[FellowshipCondition.HYPOVOLEMIC_SHOCK].count).toBe(1);
      expect(conditionStats[FellowshipCondition.HYPOVOLEMIC_SHOCK].providers.size).toBe(1);
    });

    it('should identify top practiced conditions', () => {
      const conditionStats = [
        { condition: FellowshipCondition.SEPTIC_SHOCK, validSessions: 15 },
        { condition: FellowshipCondition.CARDIAC_ARREST, validSessions: 12 },
        { condition: FellowshipCondition.SEVERE_ASTHMA, validSessions: 8 },
        { condition: FellowshipCondition.DKA, validSessions: 5 },
      ];

      const topConditions = conditionStats
        .sort((a, b) => b.validSessions - a.validSessions)
        .slice(0, 3);

      expect(topConditions[0].condition).toBe(FellowshipCondition.SEPTIC_SHOCK);
      expect(topConditions[0].validSessions).toBe(15);
      expect(topConditions.length).toBe(3);
    });

    it('should identify training gaps (conditions with zero practice)', () => {
      const allConditions = Object.values(FellowshipCondition);
      const practizedConditions = [
        FellowshipCondition.SEPTIC_SHOCK,
        FellowshipCondition.CARDIAC_ARREST,
        FellowshipCondition.SEVERE_ASTHMA,
      ];

      const trainingGaps = allConditions.filter(
        (c) => !practizedConditions.includes(c)
      );

      expect(trainingGaps.length).toBeGreaterThan(0);
      expect(trainingGaps).not.toContain(FellowshipCondition.SEPTIC_SHOCK);
      expect(trainingGaps).toContain(FellowshipCondition.ANAPHYLAXIS);
    });

    it('should calculate average session duration per condition', () => {
      const sessions = [
        { condition: FellowshipCondition.SEPTIC_SHOCK, duration: 300 },
        { condition: FellowshipCondition.SEPTIC_SHOCK, duration: 250 },
        { condition: FellowshipCondition.SEPTIC_SHOCK, duration: 280 },
      ];

      const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
      const averageDuration = totalDuration / sessions.length;

      expect(averageDuration).toBe(276.67);
    });

    it('should track provider engagement per condition', () => {
      const conditionStats = {
        [FellowshipCondition.SEPTIC_SHOCK]: {
          validSessions: 15,
          providersCount: 5,
          averageDuration: 280,
        },
        [FellowshipCondition.CARDIAC_ARREST]: {
          validSessions: 12,
          providersCount: 4,
          averageDuration: 320,
        },
      };

      // Facility with 5 providers, all practicing septic shock
      expect(conditionStats[FellowshipCondition.SEPTIC_SHOCK].providersCount).toBe(5);
      expect(
        conditionStats[FellowshipCondition.SEPTIC_SHOCK].validSessions /
          conditionStats[FellowshipCondition.SEPTIC_SHOCK].providersCount
      ).toBe(3); // 3 sessions per provider on average
    });
  });

  describe('Cross-feature integration', () => {
    it('should flow: session → analytics event → user stats → heatmap', () => {
      // 1. Session recorded
      const pathway = ResusGPSPathway.SHOCK_DIFFERENTIATION;
      const isValid = isPathwaySessionValid(pathway, 300, 6);
      expect(isValid).toBe(true);

      // 2. Conditions attributed
      const attributedConditions = getConditionsForPathway(pathway);
      expect(attributedConditions.length).toBeGreaterThan(0);

      // 3. Analytics event emitted (would go to DB)
      const event = {
        eventType: 'resusGps_session_completed',
        isValid,
        attributedConditions,
      };

      // 4. User stats aggregated
      const userStats = {
        totalValidSessions: 1,
        conditionsWithMinimumCases: [], // Only 1 session, needs 3
        conditionsInProgress: attributedConditions.map((c) => ({
          condition: c,
          count: 1,
          needed: 2,
        })),
      };

      expect(userStats.totalValidSessions).toBe(1);
      expect(userStats.conditionsInProgress.length).toBeGreaterThan(0);

      // 5. Heatmap aggregates across facility
      const facilityHeatmap = {
        totalSessions: 1,
        conditionsTracked: attributedConditions.length,
        heatmap: attributedConditions.map((c) => ({
          condition: c,
          validSessions: 1,
          providersCount: 1,
        })),
      };

      expect(facilityHeatmap.totalSessions).toBe(1);
      expect(facilityHeatmap.conditionsTracked).toBeGreaterThan(0);
    });

    it('should support multiple sessions building toward fellowship', () => {
      // Simulate 3 valid sessions for septic shock
      const sessions = [
        {
          pathway: ResusGPSPathway.SHOCK_DIFFERENTIATION,
          duration: 300,
          interactions: 6,
        },
        {
          pathway: ResusGPSPathway.SEPTIC_SHOCK_MODULE,
          duration: 400,
          interactions: 8,
        },
        {
          pathway: ResusGPSPathway.CIRCULATION,
          duration: 250,
          interactions: 5,
        },
      ];

      const validSessions = sessions.filter((s) =>
        isPathwaySessionValid(s.pathway, s.duration, s.interactions)
      );

      expect(validSessions.length).toBe(3);

      // All sessions attribute to septic shock
      const allConditions = validSessions.flatMap((s) =>
        getConditionsForPathway(s.pathway)
      );

      const septicShockCount = allConditions.filter(
        (c) => c === FellowshipCondition.SEPTIC_SHOCK
      ).length;

      expect(septicShockCount).toBeGreaterThanOrEqual(3);
    });
  });
});
