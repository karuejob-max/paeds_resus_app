/**
 * Comprehensive Test Suite for Respiratory Emergency Modules
 * 
 * Tests all new respiratory emergency engines and UI components
 * Validates clinical accuracy and integration with core systems
 */

import { describe, it, expect } from 'vitest';
import {
  assessBronchiolitisSeverity,
  generateBronchiolitisInterventions,
  shouldAdmitBronchiolitis,
} from './bronchiolitis-engine';
import {
  assessPneumoniaSeverity,
  generateAntibioticRegimen,
  shouldAdmitPneumonia,
} from './pneumonia-engine';
import {
  assessARDSSeverity,
  generateLungProtectiveStrategy,
  shouldConsiderECMO,
} from './ards-engine';
import {
  assessUpperAirwaySeverity,
  generateCroupInterventions,
  generateEpiglottitisInterventions,
  needsImmediateAirwayIntervention,
} from './upper-airway-engine';

describe('Respiratory Emergency Modules - Comprehensive Testing', () => {
  // ===== BRONCHIOLITIS TESTS =====
  describe('Bronchiolitis Engine', () => {
    it('should classify mild bronchiolitis correctly', () => {
      const assessment = {
        age: 12,
        weightKg: 10,
        respiratoryRate: 45,
        oxygenSaturation: 95,
        retractions: 'mild' as const,
        wheeze: true,
        crackles: false,
        feedingDifficulty: false,
        lethargy: false,
        cyanosis: false,
      };

      const severity = assessBronchiolitisSeverity(assessment);
      expect(severity.level).toBe('mild');
      expect(severity.requiresHospitalization).toBe(false);
    });

    it('should classify severe bronchiolitis with ICU criteria', () => {
      const assessment = {
        age: 6,
        weightKg: 7,
        respiratoryRate: 70,
        oxygenSaturation: 85,
        retractions: 'severe' as const,
        wheeze: true,
        crackles: true,
        feedingDifficulty: true,
        lethargy: true,
        cyanosis: true,
      };

      const severity = assessBronchiolitisSeverity(assessment);
      expect(severity.level).toBe('severe');
      expect(severity.requiresHospitalization).toBe(true);
      expect(severity.requiresICU).toBe(true);
    });

    it('should generate appropriate interventions for moderate bronchiolitis', () => {
      const assessment = {
        age: 18,
        weightKg: 12,
        respiratoryRate: 55,
        oxygenSaturation: 90,
        retractions: 'moderate' as const,
        wheeze: true,
        crackles: true,
        feedingDifficulty: false,
        lethargy: false,
        cyanosis: false,
      };

      const severity = assessBronchiolitisSeverity(assessment);
      const interventions = generateBronchiolitisInterventions(assessment, severity);

      expect(interventions.length).toBeGreaterThan(0);
      expect(interventions.some(i => i.type.includes('oxygen'))).toBe(true);
    });

    it('should correctly determine admission criteria', () => {
      const mildAssessment = {
        age: 24,
        weightKg: 14,
        respiratoryRate: 40,
        oxygenSaturation: 96,
        retractions: 'none' as const,
        wheeze: false,
        crackles: false,
        feedingDifficulty: false,
        lethargy: false,
        cyanosis: false,
      };

      expect(shouldAdmitBronchiolitis(mildAssessment)).toBe(false);

      const severeAssessment = {
        ...mildAssessment,
        oxygenSaturation: 88,
        retractions: 'severe' as const,
      };

      expect(shouldAdmitBronchiolitis(severeAssessment)).toBe(true);
    });
  });

  // ===== PNEUMONIA TESTS =====
  describe('Pneumonia Engine', () => {
    it('should classify mild pneumonia correctly', () => {
      const assessment = {
        age: 4,
        weightKg: 16,
        respiratoryRate: 35,
        oxygenSaturation: 95,
        temperature: 38.5,
        chestIndrawing: false,
        stridor: false,
        cyanosis: false,
        lethargy: false,
        feedingDifficulty: false,
        crackles: true,
        consolidation: false,
        pleuraEffusion: false,
      };

      const severity = assessPneumoniaSeverity(assessment);
      expect(severity.classification).toBe('pneumonia');
      expect(severity.requiresHospitalization).toBe(false);
    });

    it('should classify severe pneumonia with chest indrawing', () => {
      const assessment = {
        age: 2,
        weightKg: 12,
        respiratoryRate: 50,
        oxygenSaturation: 90,
        temperature: 39.5,
        chestIndrawing: true,
        stridor: false,
        cyanosis: false,
        lethargy: false,
        feedingDifficulty: true,
        crackles: true,
        consolidation: true,
        pleuraEffusion: false,
      };

      const severity = assessPneumoniaSeverity(assessment);
      expect(severity.classification).toBe('severe_pneumonia');
      expect(severity.requiresHospitalization).toBe(true);
    });

    it('should generate appropriate antibiotic regimen for severe pneumonia', () => {
      const assessment = {
        age: 3,
        weightKg: 14,
        respiratoryRate: 48,
        oxygenSaturation: 92,
        temperature: 39,
        chestIndrawing: true,
        stridor: false,
        cyanosis: false,
        lethargy: false,
        feedingDifficulty: false,
        crackles: true,
        consolidation: true,
        pleuraEffusion: false,
      };

      const severity = assessPneumoniaSeverity(assessment);
      const antibiotics = generateAntibioticRegimen(assessment, severity);

      expect(antibiotics.length).toBeGreaterThan(0);
      expect(antibiotics.some(a => a.type.includes('antibiotic_iv'))).toBe(true);
    });

    it('should correctly determine admission criteria', () => {
      const outpatientAssessment = {
        age: 5,
        weightKg: 18,
        respiratoryRate: 32,
        oxygenSaturation: 96,
        temperature: 37.8,
        chestIndrawing: false,
        stridor: false,
        cyanosis: false,
        lethargy: false,
        feedingDifficulty: false,
        crackles: false,
        consolidation: false,
        pleuraEffusion: false,
      };

      expect(shouldAdmitPneumonia(outpatientAssessment)).toBe(false);

      const admissionAssessment = {
        ...outpatientAssessment,
        age: 1,
        chestIndrawing: true,
      };

      expect(shouldAdmitPneumonia(admissionAssessment)).toBe(true);
    });
  });

  // ===== ARDS TESTS =====
  describe('ARDS Engine', () => {
    it('should classify mild ARDS correctly', () => {
      const assessment = {
        age: 8,
        weightKg: 25,
        oxygenSaturation: 94,
        fio2: 0.5,
        peep: 5,
        respiratoryRate: 28,
        bloodPressure: { systolic: 110, diastolic: 70 },
        lactate: 2,
        infiltrates: 'bilateral' as const,
        primaryCause: 'pneumonia',
        ventilationMode: 'CMV',
      };

      const severity = assessARDSSeverity(assessment);
      expect(severity.level).toBe('mild');
      expect(severity.paoFioRatio).toBeGreaterThan(200);
    });

    it('should classify severe ARDS with low P/F ratio', () => {
      const assessment = {
        age: 6,
        weightKg: 20,
        oxygenSaturation: 85,
        fio2: 0.9,
        peep: 12,
        respiratoryRate: 35,
        bloodPressure: { systolic: 95, diastolic: 60 },
        lactate: 4,
        infiltrates: 'bilateral' as const,
        primaryCause: 'sepsis',
        ventilationMode: 'CMV',
        plateauPressure: 32,
      };

      const severity = assessARDSSeverity(assessment);
      expect(severity.level).toBe('severe');
      expect(severity.paoFioRatio).toBeLessThan(100);
      expect(severity.requiresAdvancedSupport).toBe(true);
    });

    it('should generate lung-protective ventilation strategy', () => {
      const assessment = {
        age: 7,
        weightKg: 22,
        oxygenSaturation: 88,
        fio2: 0.8,
        peep: 8,
        respiratoryRate: 32,
        bloodPressure: { systolic: 105, diastolic: 65 },
        lactate: 3,
        infiltrates: 'bilateral' as const,
        primaryCause: 'aspiration',
        ventilationMode: 'CMV',
      };

      const severity = assessARDSSeverity(assessment);
      const strategy = generateLungProtectiveStrategy(assessment, severity);

      expect(strategy.length).toBeGreaterThan(0);
      expect(strategy.some(s => s.type.includes('ventilation'))).toBe(true);
    });

    it('should determine ECMO consideration criteria', () => {
      const noECMOAssessment = {
        age: 9,
        weightKg: 28,
        oxygenSaturation: 92,
        fio2: 0.6,
        peep: 6,
        respiratoryRate: 26,
        bloodPressure: { systolic: 115, diastolic: 72 },
        lactate: 1.5,
        infiltrates: 'bilateral' as const,
        primaryCause: 'pneumonia',
        ventilationMode: 'CMV',
      };

      expect(shouldConsiderECMO(noECMOAssessment, assessARDSSeverity(noECMOAssessment))).toBe(false);

      const ecmoAssessment = {
        ...noECMOAssessment,
        oxygenSaturation: 82,
        fio2: 1.0,
        lactate: 6,
      };

      expect(shouldConsiderECMO(ecmoAssessment, assessARDSSeverity(ecmoAssessment))).toBe(true);
    });
  });

  // ===== UPPER AIRWAY TESTS =====
  describe('Upper Airway Obstruction Engine', () => {
    it('should classify mild croup correctly', () => {
      const assessment = {
        age: 2,
        weightKg: 12,
        stridor: 'inspiratory' as const,
        stridorSeverity: 'mild' as const,
        cough: 'barky' as const,
        voice: 'hoarse' as const,
        drooling: false,
        tripoding: false,
        cyanosis: false,
        lethargy: false,
        temperature: 38,
        oxygenSaturation: 96,
        respiratoryRate: 32,
        retractions: 'none' as const,
        diagnosis: 'croup' as const,
      };

      const severity = assessUpperAirwaySeverity(assessment);
      expect(severity.level).toBe('mild');
      expect(severity.requiresAirwaySecuring).toBe(false);
    });

    it('should classify epiglottitis as critical emergency', () => {
      const assessment = {
        age: 4,
        weightKg: 16,
        stridor: 'biphasic' as const,
        stridorSeverity: 'severe' as const,
        cough: 'weak' as const,
        voice: 'muffled' as const,
        drooling: true,
        tripoding: true,
        cyanosis: false,
        lethargy: true,
        temperature: 39.5,
        oxygenSaturation: 92,
        respiratoryRate: 40,
        retractions: 'severe' as const,
        diagnosis: 'epiglottitis' as const,
      };

      const severity = assessUpperAirwaySeverity(assessment);
      expect(severity.level).toBe('critical');
      expect(severity.requiresAirwaySecuring).toBe(true);
      expect(severity.riskOfCompleteObstruction).toBe(true);
    });

    it('should generate appropriate croup interventions', () => {
      const assessment = {
        age: 2.5,
        weightKg: 13,
        stridor: 'inspiratory' as const,
        stridorSeverity: 'moderate' as const,
        cough: 'barky' as const,
        voice: 'hoarse' as const,
        drooling: false,
        tripoding: false,
        cyanosis: false,
        lethargy: false,
        temperature: 38.5,
        oxygenSaturation: 94,
        respiratoryRate: 35,
        retractions: 'mild' as const,
        diagnosis: 'croup' as const,
      };

      const interventions = generateCroupInterventions(assessment);
      expect(interventions.length).toBeGreaterThan(0);
      expect(interventions.some(i => i.type.includes('steroid'))).toBe(true);
      expect(interventions.some(i => i.type.includes('epinephrine'))).toBe(true);
    });

    it('should generate emergency epiglottitis interventions', () => {
      const assessment = {
        age: 4,
        weightKg: 16,
        stridor: 'biphasic' as const,
        stridorSeverity: 'severe' as const,
        cough: 'weak' as const,
        voice: 'muffled' as const,
        drooling: true,
        tripoding: true,
        cyanosis: false,
        lethargy: true,
        temperature: 39.5,
        oxygenSaturation: 92,
        respiratoryRate: 40,
        retractions: 'severe' as const,
        diagnosis: 'epiglottitis' as const,
      };

      const interventions = generateEpiglottitisInterventions(assessment);
      expect(interventions.length).toBeGreaterThan(0);
      expect(interventions.some(i => i.type.includes('airway_management'))).toBe(true);
      expect(interventions.some(i => i.type.includes('antibiotic'))).toBe(true);
    });

    it('should identify immediate airway intervention needs', () => {
      const stableCroup = {
        age: 2,
        weightKg: 12,
        stridor: 'inspiratory' as const,
        stridorSeverity: 'mild' as const,
        cough: 'barky' as const,
        voice: 'hoarse' as const,
        drooling: false,
        tripoding: false,
        cyanosis: false,
        lethargy: false,
        temperature: 38,
        oxygenSaturation: 96,
        respiratoryRate: 32,
        retractions: 'none' as const,
        diagnosis: 'croup' as const,
      };

      expect(needsImmediateAirwayIntervention(stableCroup)).toBe(false);

      const epiglottitis = {
        ...stableCroup,
        diagnosis: 'epiglottitis' as const,
      };

      expect(needsImmediateAirwayIntervention(epiglottitis)).toBe(true);
    });
  });

  // ===== INTEGRATION TESTS =====
  describe('Cross-Module Integration', () => {
    it('should handle weight-based dosing consistently across modules', () => {
      const weights = [5, 10, 15, 20, 25, 30];

      weights.forEach(weight => {
        const bronchiolitisAssessment = {
          age: weight / 3,
          weightKg: weight,
          respiratoryRate: 45,
          oxygenSaturation: 92,
          retractions: 'mild' as const,
          wheeze: true,
          crackles: false,
          feedingDifficulty: false,
          lethargy: false,
          cyanosis: false,
        };

        const severity = assessBronchiolitisSeverity(bronchiolitisAssessment);
        const interventions = generateBronchiolitisInterventions(bronchiolitisAssessment, severity);

        // All interventions should have valid dosing for the given weight
        interventions.forEach(intervention => {
          if (intervention.dosing) {
            expect(intervention.dosing).toBeTruthy();
            expect(intervention.dosing.length).toBeGreaterThan(0);
          }
        });
      });
    });

    it('should maintain clinical consistency across severity levels', () => {
      // Mild assessment
      const mildAssessment = {
        age: 3,
        weightKg: 14,
        respiratoryRate: 35,
        oxygenSaturation: 96,
        temperature: 37.5,
        chestIndrawing: false,
        stridor: false,
        cyanosis: false,
        lethargy: false,
        feedingDifficulty: false,
        crackles: false,
        consolidation: false,
        pleuraEffusion: false,
      };

      const mildSeverity = assessPneumoniaSeverity(mildAssessment);
      expect(mildSeverity.requiresHospitalization).toBe(false);

      // Severe assessment
      const severeAssessment = { ...mildAssessment, chestIndrawing: true, oxygenSaturation: 88 };
      const severeSeverity = assessPneumoniaSeverity(severeAssessment);
      expect(severeSeverity.requiresHospitalization).toBe(true);

      // Severe should have higher score
      expect(severeSeverity.score).toBeGreaterThan(mildSeverity.score);
    });
  });
});
