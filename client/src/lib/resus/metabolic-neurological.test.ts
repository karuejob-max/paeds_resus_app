/**
 * Comprehensive Test Suite for Metabolic and Neurological Modules
 * 
 * Tests clinical accuracy, dosing calculations, and integration
 * for Septic Shock, DKA, and Status Epilepticus modules
 */

import { describe, it, expect } from 'vitest';
import {
  assessSepticShockSeverity,
  calculateFluidResuscitation,
  generateAntibioticRegimen,
  type SepticShockAssessment,
} from './septic-shock-engine';
import {
  assessDKASeverity,
  calculateDKAFluidResuscitation,
  generateInsulinProtocol,
  type DKAAssessment,
} from './dka-engine';
import {
  assessStatusEpilepticusSeverity,
  generateFirstLineTherapy,
  generateSecondLineTherapy,
  generateThirdLineTherapy,
  type StatusEpilepticusAssessment,
} from './status-epilepticus-engine';

// ============================================================================
// SEPTIC SHOCK TESTS
// ============================================================================

describe('Septic Shock Engine', () => {
  describe('Severity Assessment', () => {
    it('should classify compensated shock correctly', () => {
      const assessment: SepticShockAssessment = {
        age: 5,
        weightKg: 18,
        temperature: 39.5,
        heartRate: 130,
        respiratoryRate: 32,
        systolicBP: 95,
        diastolicBP: 60,
        capillaryRefillTime: 2,
        skinPerfusion: 'warm',
        lactate: 2.0,
        mentalStatus: 'alert',
        suspectedSource: 'pneumonia',
      };

      const severity = assessSepticShockSeverity(assessment);
      expect(severity.level).toBe('compensated');
      expect(severity.requiresICU).toBe(false);
    });

    it('should classify uncompensated shock correctly', () => {
      const assessment: SepticShockAssessment = {
        age: 3,
        weightKg: 14,
        temperature: 38.2,
        heartRate: 160,
        respiratoryRate: 40,
        systolicBP: 70,
        diastolicBP: 45,
        capillaryRefillTime: 3.5,
        skinPerfusion: 'cool',
        lactate: 4.5,
        mentalStatus: 'lethargic',
        suspectedSource: 'meningitis',
      };

      const severity = assessSepticShockSeverity(assessment);
      expect(severity.level).toBe('uncompensated');
      expect(severity.requiresICU).toBe(true);
      expect(severity.requiresVasopressors).toBe(true);
    });

    it('should classify refractory shock correctly', () => {
      const assessment: SepticShockAssessment = {
        age: 7,
        weightKg: 22,
        temperature: 37.1,
        heartRate: 180,
        respiratoryRate: 45,
        systolicBP: 65,
        diastolicBP: 40,
        capillaryRefillTime: 4.5,
        skinPerfusion: 'mottled',
        lactate: 8.0,
        mentalStatus: 'unresponsive',
        suspectedSource: 'sepsis',
      };

      const severity = assessSepticShockSeverity(assessment);
      expect(severity.level).toBe('refractory');
      expect(severity.requiresICU).toBe(true);
      expect(severity.requiresVasopressors).toBe(true);
    });
  });

  describe('Fluid Resuscitation', () => {
    it('should calculate correct fluid bolus for 18kg child', () => {
      const assessment: SepticShockAssessment = {
        age: 5,
        weightKg: 18,
        temperature: 39.5,
        heartRate: 130,
        respiratoryRate: 32,
        systolicBP: 95,
        diastolicBP: 60,
        capillaryRefillTime: 2,
        skinPerfusion: 'warm',
        lactate: 2.0,
        mentalStatus: 'alert',
        suspectedSource: 'pneumonia',
      };

      const severity = assessSepticShockSeverity(assessment);
      const fluidInterventions = calculateFluidResuscitation(assessment, severity);

      expect(fluidInterventions.length).toBeGreaterThan(0);
      const firstBolus = fluidInterventions[0];
      expect(firstBolus.dosing).toContain('360'); // 20 mL/kg * 18kg
    });

    it('should recommend multiple boluses for uncompensated shock', () => {
      const assessment: SepticShockAssessment = {
        age: 3,
        weightKg: 14,
        temperature: 38.2,
        heartRate: 160,
        respiratoryRate: 40,
        systolicBP: 70,
        diastolicBP: 45,
        capillaryRefillTime: 3.5,
        skinPerfusion: 'cool',
        lactate: 4.5,
        mentalStatus: 'lethargic',
        suspectedSource: 'meningitis',
      };

      const severity = assessSepticShockSeverity(assessment);
      const fluidInterventions = calculateFluidResuscitation(assessment, severity);

      expect(fluidInterventions.length).toBeGreaterThan(1);
    });
  });

  describe('Antibiotic Regimen', () => {
    it('should generate appropriate antibiotic regimen for pneumonia', () => {
      const assessment: SepticShockAssessment = {
        age: 5,
        weightKg: 18,
        temperature: 39.5,
        heartRate: 130,
        respiratoryRate: 32,
        systolicBP: 95,
        diastolicBP: 60,
        capillaryRefillTime: 2,
        skinPerfusion: 'warm',
        lactate: 2.0,
        mentalStatus: 'alert',
        suspectedSource: 'pneumonia',
      };

      const antibiotics = generateAntibioticRegimen(assessment);
      expect(antibiotics.length).toBeGreaterThan(0);
      expect(antibiotics[0].description).toContain('Ceftriaxone');
    });

    it('should include gentamicin for gram-negative coverage', () => {
      const assessment: SepticShockAssessment = {
        age: 3,
        weightKg: 14,
        temperature: 38.2,
        heartRate: 160,
        respiratoryRate: 40,
        systolicBP: 70,
        diastolicBP: 45,
        capillaryRefillTime: 3.5,
        skinPerfusion: 'cool',
        lactate: 4.5,
        mentalStatus: 'lethargic',
        suspectedSource: 'meningitis',
      };

      const antibiotics = generateAntibioticRegimen(assessment);
      const hasGentamicin = antibiotics.some(a => a.description.includes('Gentamicin'));
      expect(hasGentamicin).toBe(true);
    });
  });
});

// ============================================================================
// DKA TESTS
// ============================================================================

describe('DKA Engine', () => {
  describe('Severity Assessment', () => {
    it('should classify mild DKA correctly', () => {
      const assessment: DKAAssessment = {
        age: 10,
        weightKg: 32,
        bloodGlucose: 350,
        glucoseUnit: 'mg/dL',
        pH: 7.25,
        bicarbonate: 18,
        anionGap: 14,
        potassium: 5.0,
        sodium: 135,
        chloride: 102,
        fluidDeficit: 5,
        ketonemia: 'small',
        ketonuria: 'small',
        breathPattern: 'normal',
        mentalStatus: 'alert',
        vomiting: false,
        abdominalPain: false,
        priorInsulin: true,
      };

      const severity = assessDKASeverity(assessment);
      expect(severity.level).toBe('mild');
      expect(severity.requiresICU).toBe(false);
    });

    it('should classify moderate DKA correctly', () => {
      const assessment: DKAAssessment = {
        age: 12,
        weightKg: 40,
        bloodGlucose: 450,
        glucoseUnit: 'mg/dL',
        pH: 7.15,
        bicarbonate: 12,
        anionGap: 18,
        potassium: 5.2,
        sodium: 133,
        chloride: 100,
        fluidDeficit: 8,
        ketonemia: 'moderate',
        ketonuria: 'moderate',
        breathPattern: 'kussmaul',
        mentalStatus: 'lethargic',
        vomiting: true,
        abdominalPain: true,
        priorInsulin: true,
      };

      const severity = assessDKASeverity(assessment);
      expect(severity.level).toBe('moderate');
      expect(severity.requiresICU).toBe(true);
    });

    it('should classify severe DKA correctly', () => {
      const assessment: DKAAssessment = {
        age: 14,
        weightKg: 45,
        bloodGlucose: 600,
        glucoseUnit: 'mg/dL',
        pH: 6.95,
        bicarbonate: 8,
        anionGap: 22,
        potassium: 6.0,
        sodium: 130,
        chloride: 98,
        fluidDeficit: 12,
        ketonemia: 'large',
        ketonuria: 'large',
        breathPattern: 'kussmaul',
        mentalStatus: 'unresponsive',
        vomiting: true,
        abdominalPain: true,
        priorInsulin: true,
      };

      const severity = assessDKASeverity(assessment);
      expect(severity.level).toBe('severe');
      expect(severity.requiresICU).toBe(true);
      expect(severity.riskOfCerebralEdema).toBe(true);
    });
  });

  describe('Fluid Resuscitation', () => {
    it('should calculate correct fluid replacement for 32kg child with 5% deficit', () => {
      const assessment: DKAAssessment = {
        age: 10,
        weightKg: 32,
        bloodGlucose: 350,
        glucoseUnit: 'mg/dL',
        pH: 7.25,
        bicarbonate: 18,
        anionGap: 14,
        potassium: 5.0,
        sodium: 135,
        chloride: 102,
        fluidDeficit: 5,
        ketonemia: 'small',
        ketonuria: 'small',
        breathPattern: 'normal',
        mentalStatus: 'alert',
        vomiting: false,
        abdominalPain: false,
        priorInsulin: true,
      };

      const severity = assessDKASeverity(assessment);
      const fluidInterventions = calculateDKAFluidResuscitation(assessment, severity);

      expect(fluidInterventions.length).toBeGreaterThan(0);
      // 5% of 32kg = 1.6L deficit
      expect(fluidInterventions[0].dosing).toContain('1600');
    });
  });

  describe('Insulin Protocol', () => {
    it('should generate appropriate insulin protocol for mild DKA', () => {
      const assessment: DKAAssessment = {
        age: 10,
        weightKg: 32,
        bloodGlucose: 350,
        glucoseUnit: 'mg/dL',
        pH: 7.25,
        bicarbonate: 18,
        anionGap: 14,
        potassium: 5.0,
        sodium: 135,
        chloride: 102,
        fluidDeficit: 5,
        ketonemia: 'small',
        ketonuria: 'small',
        breathPattern: 'normal',
        mentalStatus: 'alert',
        vomiting: false,
        abdominalPain: false,
        priorInsulin: true,
      };

      const severity = assessDKASeverity(assessment);
      const insulinInterventions = generateInsulinProtocol(assessment, severity);

      expect(insulinInterventions.length).toBeGreaterThan(0);
      expect(insulinInterventions[0].description).toContain('Insulin');
    });

    it('should include bolus for severe DKA', () => {
      const assessment: DKAAssessment = {
        age: 14,
        weightKg: 45,
        bloodGlucose: 600,
        glucoseUnit: 'mg/dL',
        pH: 6.95,
        bicarbonate: 8,
        anionGap: 22,
        potassium: 6.0,
        sodium: 130,
        chloride: 98,
        fluidDeficit: 12,
        ketonemia: 'large',
        ketonuria: 'large',
        breathPattern: 'kussmaul',
        mentalStatus: 'unresponsive',
        vomiting: true,
        abdominalPain: true,
        priorInsulin: true,
      };

      const severity = assessDKASeverity(assessment);
      const insulinInterventions = generateInsulinProtocol(assessment, severity);

      const hasBolus = insulinInterventions.some(i => i.description.includes('bolus'));
      expect(hasBolus).toBe(true);
    });
  });
});

// ============================================================================
// STATUS EPILEPTICUS TESTS
// ============================================================================

describe('Status Epilepticus Engine', () => {
  describe('Severity Assessment', () => {
    it('should classify early SE correctly', () => {
      const assessment: StatusEpilepticusAssessment = {
        age: 5,
        weightKg: 18,
        seizureDuration: 3,
        seizureType: 'generalized_tonic_clonic',
        consciousness: 'drowsy',
        airwayPatency: 'patent',
        oxygenSaturation: 95,
        heartRate: 120,
        respiratoryRate: 28,
        bloodPressure: { systolic: 110, diastolic: 70 },
        temperature: 37.5,
        priorSeizures: false,
        priorAntiepileptics: [],
        knownEtiology: 'idiopathic',
        bloodGlucose: 100,
      };

      const severity = assessStatusEpilepticusSeverity(assessment);
      expect(severity.level).toBe('early_se');
      expect(severity.requiresICU).toBe(false);
      expect(severity.requiresIntubation).toBe(false);
    });

    it('should classify established SE correctly', () => {
      const assessment: StatusEpilepticusAssessment = {
        age: 7,
        weightKg: 22,
        seizureDuration: 15,
        seizureType: 'generalized_tonic_clonic',
        consciousness: 'unresponsive',
        airwayPatency: 'compromised',
        oxygenSaturation: 88,
        heartRate: 150,
        respiratoryRate: 35,
        bloodPressure: { systolic: 100, diastolic: 65 },
        temperature: 38.0,
        priorSeizures: true,
        priorAntiepileptics: ['levetiracetam'],
        knownEtiology: 'infection',
        bloodGlucose: 95,
      };

      const severity = assessStatusEpilepticusSeverity(assessment);
      expect(severity.level).toBe('established_se');
      expect(severity.requiresICU).toBe(true);
      expect(severity.requiresIntubation).toBe(true);
    });

    it('should classify refractory SE correctly', () => {
      const assessment: StatusEpilepticusAssessment = {
        age: 10,
        weightKg: 30,
        seizureDuration: 45,
        seizureType: 'generalized_tonic_clonic',
        consciousness: 'unresponsive',
        airwayPatency: 'obstructed',
        oxygenSaturation: 80,
        heartRate: 170,
        respiratoryRate: 40,
        bloodPressure: { systolic: 90, diastolic: 55 },
        temperature: 38.5,
        priorSeizures: true,
        priorAntiepileptics: ['phenytoin', 'levetiracetam'],
        knownEtiology: 'trauma',
        bloodGlucose: 85,
      };

      const severity = assessStatusEpilepticusSeverity(assessment);
      expect(severity.level).toBe('refractory_se');
      expect(severity.requiresICU).toBe(true);
      expect(severity.requiresIntubation).toBe(true);
      expect(severity.requiresAnesthesia).toBe(true);
    });

    it('should classify super-refractory SE correctly', () => {
      const assessment: StatusEpilepticusAssessment = {
        age: 12,
        weightKg: 40,
        seizureDuration: 90,
        seizureType: 'generalized_tonic_clonic',
        consciousness: 'unresponsive',
        airwayPatency: 'obstructed',
        oxygenSaturation: 75,
        heartRate: 180,
        respiratoryRate: 42,
        bloodPressure: { systolic: 85, diastolic: 50 },
        temperature: 39.0,
        priorSeizures: true,
        priorAntiepileptics: ['phenytoin', 'levetiracetam', 'valproic_acid'],
        knownEtiology: 'metabolic',
        bloodGlucose: 80,
      };

      const severity = assessStatusEpilepticusSeverity(assessment);
      expect(severity.level).toBe('super_refractory_se');
      expect(severity.requiresICU).toBe(true);
      expect(severity.requiresIntubation).toBe(true);
      expect(severity.requiresAnesthesia).toBe(true);
    });
  });

  describe('First-Line Therapy', () => {
    it('should generate lorazepam dosing for 18kg child', () => {
      const assessment: StatusEpilepticusAssessment = {
        age: 5,
        weightKg: 18,
        seizureDuration: 3,
        seizureType: 'generalized_tonic_clonic',
        consciousness: 'drowsy',
        airwayPatency: 'patent',
        oxygenSaturation: 95,
        heartRate: 120,
        respiratoryRate: 28,
        bloodPressure: { systolic: 110, diastolic: 70 },
        temperature: 37.5,
        priorSeizures: false,
        priorAntiepileptics: [],
        knownEtiology: 'idiopathic',
        bloodGlucose: 100,
      };

      const firstLine = generateFirstLineTherapy(assessment);
      const lorazepam = firstLine.find(i => i.description.includes('Lorazepam'));

      expect(lorazepam).toBeDefined();
      expect(lorazepam?.dosing).toContain('1.8'); // 0.1 mg/kg * 18kg
    });

    it('should include supportive care in first-line therapy', () => {
      const assessment: StatusEpilepticusAssessment = {
        age: 5,
        weightKg: 18,
        seizureDuration: 3,
        seizureType: 'generalized_tonic_clonic',
        consciousness: 'drowsy',
        airwayPatency: 'patent',
        oxygenSaturation: 95,
        heartRate: 120,
        respiratoryRate: 28,
        bloodPressure: { systolic: 110, diastolic: 70 },
        temperature: 37.5,
        priorSeizures: false,
        priorAntiepileptics: [],
        knownEtiology: 'idiopathic',
        bloodGlucose: 100,
      };

      const firstLine = generateFirstLineTherapy(assessment);
      const supportiveCare = firstLine.find(i => i.type === 'supportive_care_initial');

      expect(supportiveCare).toBeDefined();
    });
  });

  describe('Second-Line Therapy', () => {
    it('should generate phenytoin dosing for 22kg child', () => {
      const assessment: StatusEpilepticusAssessment = {
        age: 7,
        weightKg: 22,
        seizureDuration: 15,
        seizureType: 'generalized_tonic_clonic',
        consciousness: 'unresponsive',
        airwayPatency: 'compromised',
        oxygenSaturation: 88,
        heartRate: 150,
        respiratoryRate: 35,
        bloodPressure: { systolic: 100, diastolic: 65 },
        temperature: 38.0,
        priorSeizures: true,
        priorAntiepileptics: ['levetiracetam'],
        knownEtiology: 'infection',
        bloodGlucose: 95,
      };

      const secondLine = generateSecondLineTherapy(assessment);
      const phenytoin = secondLine.find(i => i.description.includes('Phenytoin'));

      expect(phenytoin).toBeDefined();
      expect(phenytoin?.dosing).toContain('440'); // 20 mg/kg * 22kg
    });

    it('should include alternative agents in second-line therapy', () => {
      const assessment: StatusEpilepticusAssessment = {
        age: 7,
        weightKg: 22,
        seizureDuration: 15,
        seizureType: 'generalized_tonic_clonic',
        consciousness: 'unresponsive',
        airwayPatency: 'compromised',
        oxygenSaturation: 88,
        heartRate: 150,
        respiratoryRate: 35,
        bloodPressure: { systolic: 100, diastolic: 65 },
        temperature: 38.0,
        priorSeizures: true,
        priorAntiepileptics: ['levetiracetam'],
        knownEtiology: 'infection',
        bloodGlucose: 95,
      };

      const secondLine = generateSecondLineTherapy(assessment);
      expect(secondLine.length).toBeGreaterThan(1);
    });
  });

  describe('Third-Line Therapy', () => {
    it('should include anesthesia induction for refractory SE', () => {
      const assessment: StatusEpilepticusAssessment = {
        age: 10,
        weightKg: 30,
        seizureDuration: 45,
        seizureType: 'generalized_tonic_clonic',
        consciousness: 'unresponsive',
        airwayPatency: 'obstructed',
        oxygenSaturation: 80,
        heartRate: 170,
        respiratoryRate: 40,
        bloodPressure: { systolic: 90, diastolic: 55 },
        temperature: 38.5,
        priorSeizures: true,
        priorAntiepileptics: ['phenytoin', 'levetiracetam'],
        knownEtiology: 'trauma',
        bloodGlucose: 85,
      };

      const thirdLine = generateThirdLineTherapy(assessment);
      const anesthesia = thirdLine.find(i => i.type === 'anesthesia_induction');

      expect(anesthesia).toBeDefined();
      expect(anesthesia?.description).toContain('Anesthetic');
    });

    it('should include intubation in third-line therapy', () => {
      const assessment: StatusEpilepticusAssessment = {
        age: 10,
        weightKg: 30,
        seizureDuration: 45,
        seizureType: 'generalized_tonic_clonic',
        consciousness: 'unresponsive',
        airwayPatency: 'obstructed',
        oxygenSaturation: 80,
        heartRate: 170,
        respiratoryRate: 40,
        bloodPressure: { systolic: 90, diastolic: 55 },
        temperature: 38.5,
        priorSeizures: true,
        priorAntiepileptics: ['phenytoin', 'levetiracetam'],
        knownEtiology: 'trauma',
        bloodGlucose: 85,
      };

      const thirdLine = generateThirdLineTherapy(assessment);
      const intubation = thirdLine.find(i => i.type === 'airway_management_intubation');

      expect(intubation).toBeDefined();
    });
  });
});
