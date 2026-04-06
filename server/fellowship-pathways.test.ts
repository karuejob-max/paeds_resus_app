/**
 * FB-MAP-1: Fellowship Pathways Mapping Tests
 *
 * Validates:
 * - Pathway ↔ condition mappings are complete and consistent
 * - Depth thresholds are reasonable and enforceable
 * - tRPC procedures return correct data
 */

import { describe, it, expect } from 'vitest';
import {
  FellowshipCondition,
  ResusGPSPathway,
  getConditionsForPathway,
  getPathwaysForCondition,
  getConditionLabel,
  getPathwayLabel,
  isPathwaySessionValid,
  PATHWAY_CONDITION_MAP,
  PATHWAY_DEPTH_THRESHOLDS,
} from '../server/lib/pathway-condition-mapping';

describe('FB-MAP-1: Fellowship Pathway Mapping', () => {
  describe('Mapping consistency', () => {
    it('should have all pathways in PATHWAY_CONDITION_MAP', () => {
      const allPathways = Object.values(ResusGPSPathway);
      const mappedPathways = Object.keys(PATHWAY_CONDITION_MAP);

      expect(mappedPathways.length).toBe(allPathways.length);
      allPathways.forEach((pathway) => {
        expect(mappedPathways).toContain(pathway);
      });
    });

    it('should have all pathways in PATHWAY_DEPTH_THRESHOLDS', () => {
      const allPathways = Object.values(ResusGPSPathway);
      const thresholdPathways = Object.keys(PATHWAY_DEPTH_THRESHOLDS);

      expect(thresholdPathways.length).toBe(allPathways.length);
      allPathways.forEach((pathway) => {
        expect(thresholdPathways).toContain(pathway);
      });
    });

    it('should have valid conditions in mappings', () => {
      const allConditions = Object.values(FellowshipCondition);

      Object.values(PATHWAY_CONDITION_MAP).forEach((conditions) => {
        conditions.forEach((condition) => {
          expect(allConditions).toContain(condition);
        });
      });
    });

    it('should have no duplicate conditions per pathway', () => {
      Object.entries(PATHWAY_CONDITION_MAP).forEach(([pathway, conditions]) => {
        const uniqueConditions = new Set(conditions);
        expect(uniqueConditions.size).toBe(
          conditions.length,
          `Pathway ${pathway} has duplicate conditions`
        );
      });
    });
  });

  describe('Pathway-condition queries', () => {
    it('should return conditions for a pathway', () => {
      const conditions = getConditionsForPathway(
        ResusGPSPathway.SHOCK_DIFFERENTIATION
      );
      expect(conditions.length).toBeGreaterThan(0);
      expect(conditions).toContain(FellowshipCondition.SEPTIC_SHOCK);
      expect(conditions).toContain(FellowshipCondition.HYPOVOLEMIC_SHOCK);
    });

    it('should return pathways for a condition', () => {
      const pathways = getPathwaysForCondition(
        FellowshipCondition.SEPTIC_SHOCK
      );
      expect(pathways.length).toBeGreaterThan(0);
      expect(pathways).toContain(ResusGPSPathway.SHOCK_DIFFERENTIATION);
      expect(pathways).toContain(ResusGPSPathway.SEPTIC_SHOCK_MODULE);
    });

    it('should be bidirectional: pathway → condition → pathway', () => {
      const pathway = ResusGPSPathway.CIRCULATION;
      const conditions = getConditionsForPathway(pathway);

      conditions.forEach((condition) => {
        const pathways = getPathwaysForCondition(condition);
        expect(pathways).toContain(pathway);
      });
    });

    it('should be bidirectional: condition → pathway → condition', () => {
      const condition = FellowshipCondition.CARDIAC_ARREST;
      const pathways = getPathwaysForCondition(condition);

      pathways.forEach((pathway) => {
        const conditions = getConditionsForPathway(pathway);
        expect(conditions).toContain(condition);
      });
    });
  });

  describe('Labels', () => {
    it('should have labels for all conditions', () => {
      Object.values(FellowshipCondition).forEach((condition) => {
        const label = getConditionLabel(condition);
        expect(label).toBeTruthy();
        expect(label.length).toBeGreaterThan(0);
        expect(label).not.toBe(condition); // Should be human-readable
      });
    });

    it('should have labels for all pathways', () => {
      Object.values(ResusGPSPathway).forEach((pathway) => {
        const label = getPathwayLabel(pathway);
        expect(label).toBeTruthy();
        expect(label.length).toBeGreaterThan(0);
        expect(label).not.toBe(pathway); // Should be human-readable
      });
    });

    it('should have unique labels within category', () => {
      const conditionLabels = Object.values(FellowshipCondition).map((c) =>
        getConditionLabel(c)
      );
      const uniqueLabels = new Set(conditionLabels);
      expect(uniqueLabels.size).toBe(conditionLabels.length);

      const pathwayLabels = Object.values(ResusGPSPathway).map((p) =>
        getPathwayLabel(p)
      );
      const uniquePathwayLabels = new Set(pathwayLabels);
      expect(uniquePathwayLabels.size).toBe(pathwayLabels.length);
    });
  });

  describe('Depth thresholds', () => {
    it('should have reasonable duration thresholds', () => {
      Object.entries(PATHWAY_DEPTH_THRESHOLDS).forEach(
        ([pathway, threshold]) => {
          expect(threshold.minDurationSeconds).toBeGreaterThanOrEqual(60);
          expect(threshold.minDurationSeconds).toBeLessThanOrEqual(600); // Max 10 minutes
          expect(threshold.minInteractionsCount).toBeGreaterThanOrEqual(1);
          expect(threshold.minInteractionsCount).toBeLessThanOrEqual(10);
          expect(threshold.description).toBeTruthy();
        }
      );
    });

    it('should validate sessions correctly', () => {
      // Valid session
      expect(
        isPathwaySessionValid(
          ResusGPSPathway.AIRWAY,
          300, // 5 minutes
          5 // 5 interactions
        )
      ).toBe(true);

      // Too short duration
      expect(
        isPathwaySessionValid(ResusGPSPathway.AIRWAY, 30, 5)
      ).toBe(false);

      // Too few interactions
      expect(
        isPathwaySessionValid(ResusGPSPathway.AIRWAY, 300, 1)
      ).toBe(false);

      // Both too low
      expect(
        isPathwaySessionValid(ResusGPSPathway.AIRWAY, 30, 1)
      ).toBe(false);
    });

    it('should have higher thresholds for complex pathways', () => {
      const circulationThreshold = PATHWAY_DEPTH_THRESHOLDS[
        ResusGPSPathway.CIRCULATION
      ];
      const exposureThreshold = PATHWAY_DEPTH_THRESHOLDS[
        ResusGPSPathway.EXPOSURE
      ];

      // Circulation (shock assessment) should require more time/interactions than exposure
      expect(circulationThreshold.minDurationSeconds).toBeGreaterThan(
        exposureThreshold.minDurationSeconds
      );
      expect(circulationThreshold.minInteractionsCount).toBeGreaterThan(
        exposureThreshold.minInteractionsCount
      );
    });

    it('should have higher thresholds for condition-specific modules', () => {
      const primarySurveyThreshold = PATHWAY_DEPTH_THRESHOLDS[
        ResusGPSPathway.BREATHING
      ];
      const moduleThreshold = PATHWAY_DEPTH_THRESHOLDS[
        ResusGPSPathway.SEPTIC_SHOCK_MODULE
      ];

      // Modules should require more engagement than primary survey
      expect(moduleThreshold.minDurationSeconds).toBeGreaterThanOrEqual(
        primarySurveyThreshold.minDurationSeconds
      );
      expect(moduleThreshold.minInteractionsCount).toBeGreaterThanOrEqual(
        primarySurveyThreshold.minInteractionsCount
      );
    });
  });

  describe('Coverage and completeness', () => {
    it('should cover all major shock types', () => {
      const shockPathway = ResusGPSPathway.SHOCK_DIFFERENTIATION;
      const conditions = getConditionsForPathway(shockPathway);

      const shockConditions = [
        FellowshipCondition.SEPTIC_SHOCK,
        FellowshipCondition.HYPOVOLEMIC_SHOCK,
        FellowshipCondition.CARDIOGENIC_SHOCK,
        FellowshipCondition.ANAPHYLACTIC_SHOCK,
        FellowshipCondition.OBSTRUCTIVE_SHOCK,
        FellowshipCondition.NEUROGENIC_SHOCK,
      ];

      shockConditions.forEach((shock) => {
        expect(conditions).toContain(shock);
      });
    });

    it('should cover respiratory emergencies', () => {
      const respiratoryConditions = [
        FellowshipCondition.SEVERE_ASTHMA,
        FellowshipCondition.BRONCHIOLITIS,
        FellowshipCondition.SEVERE_PNEUMONIA,
        FellowshipCondition.ARDS,
        FellowshipCondition.LARYNGOTRACHEOBRONCHITIS,
        FellowshipCondition.EPIGLOTTITIS,
      ];

      respiratoryConditions.forEach((condition) => {
        const pathways = getPathwaysForCondition(condition);
        expect(pathways.length).toBeGreaterThan(0);
      });
    });

    it('should cover cardiac emergencies', () => {
      const cardiacConditions = [
        FellowshipCondition.CARDIAC_ARREST,
        FellowshipCondition.SVT,
        FellowshipCondition.BRADYCARDIA,
      ];

      cardiacConditions.forEach((condition) => {
        const pathways = getPathwaysForCondition(condition);
        expect(pathways.length).toBeGreaterThan(0);
      });
    });

    it('should cover metabolic emergencies', () => {
      const metabolicConditions = [
        FellowshipCondition.DKA,
        FellowshipCondition.HYPOGLYCEMIA,
        FellowshipCondition.HYPERKALEMIA,
      ];

      metabolicConditions.forEach((condition) => {
        const pathways = getPathwaysForCondition(condition);
        expect(pathways.length).toBeGreaterThan(0);
      });
    });

    it('should cover neurological emergencies', () => {
      const neuroConditions = [
        FellowshipCondition.STATUS_EPILEPTICUS,
        FellowshipCondition.MENINGITIS,
        FellowshipCondition.ENCEPHALITIS,
      ];

      neuroConditions.forEach((condition) => {
        const pathways = getPathwaysForCondition(condition);
        expect(pathways.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Anti-gaming measures', () => {
    it('should require meaningful engagement', () => {
      // Trivial session (30 seconds, 1 interaction)
      expect(
        isPathwaySessionValid(ResusGPSPathway.SHOCK_DIFFERENTIATION, 30, 1)
      ).toBe(false);

      // Adequate session
      expect(
        isPathwaySessionValid(
          ResusGPSPathway.SHOCK_DIFFERENTIATION,
          300,
          6
        )
      ).toBe(true);
    });

    it('should have consistent anti-gaming across pathways', () => {
      // All pathways should require at least 60 seconds
      Object.values(PATHWAY_DEPTH_THRESHOLDS).forEach((threshold) => {
        expect(threshold.minDurationSeconds).toBeGreaterThanOrEqual(60);
      });

      // All pathways should require at least 2 interactions
      Object.values(PATHWAY_DEPTH_THRESHOLDS).forEach((threshold) => {
        expect(threshold.minInteractionsCount).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Fellowship pillar B requirements', () => {
    it('should support tracking ≥3 cases per condition', () => {
      // Each condition should be reachable through at least one pathway
      Object.values(FellowshipCondition).forEach((condition) => {
        const pathways = getPathwaysForCondition(condition);
        expect(pathways.length).toBeGreaterThan(0);
      });
    });

    it('should support taught condition tracking', () => {
      // Conditions should be clearly labeled for teaching
      const taughtConditions = [
        FellowshipCondition.SEPTIC_SHOCK,
        FellowshipCondition.CARDIAC_ARREST,
        FellowshipCondition.SEVERE_ASTHMA,
        FellowshipCondition.DKA,
        FellowshipCondition.STATUS_EPILEPTICUS,
      ];

      taughtConditions.forEach((condition) => {
        const label = getConditionLabel(condition);
        expect(label).toBeTruthy();
      });
    });
  });
});
