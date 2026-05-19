/**
 * Test suite for anaphylaxis-engine.ts
 * Validates clinical decision logic for anaphylactic shock management
 */

import { describe, it, expect } from 'vitest';
import {
  assessSeverity,
  calculateEpinephrineImDose,
  calculateEpinephrineIvDose,
  calculateAntihistamineDose,
  calculateCorticosteroidDose,
  evaluateEpinephrineEligibility,
  evaluateIcuAdmissionCriteria,
  identifyTrigger,
  generateRecommendation,
  type AnaphylaxisEngineState,
} from './anaphylaxis-engine';

describe('Anaphylaxis Engine - Severity Assessment', () => {
  it('should classify cardiovascular collapse with hypotension', () => {
    const severity = assessSeverity({
      systemsInvolved: ['respiratory', 'cardiovascular'],
      respiratoryRate: 35,
      heartRate: 140,
      bloodPressureSystolic: 65,
      bloodPressureDiastolic: 40,
      oxygenSaturation: 92,
      wheezing: true,
      stridor: false,
      hypotension: true,
      patientAgeMonths: 60,
    });
    expect(severity).toBe('cardiovascular_collapse');
  });

  it('should classify severe anaphylaxis with respiratory compromise', () => {
    const severity = assessSeverity({
      systemsInvolved: ['respiratory', 'cutaneous'],
      respiratoryRate: 40,
      heartRate: 130,
      bloodPressureSystolic: 95,
      bloodPressureDiastolic: 60,
      oxygenSaturation: 90,
      wheezing: true,
      stridor: false,
      hypotension: false,
      patientAgeMonths: 60,
    });
    expect(severity).toBe('severe');
  });

  it('should classify severe anaphylaxis with stridor', () => {
    const severity = assessSeverity({
      systemsInvolved: ['respiratory', 'cutaneous'],
      respiratoryRate: 38,
      heartRate: 125,
      bloodPressureSystolic: 100,
      bloodPressureDiastolic: 65,
      oxygenSaturation: 93,
      wheezing: false,
      stridor: true,
      hypotension: false,
      patientAgeMonths: 60,
    });
    expect(severity).toBe('severe');
  });

  it('should classify moderate anaphylaxis with respiratory signs', () => {
    const severity = assessSeverity({
      systemsInvolved: ['respiratory'],
      respiratoryRate: 32,
      heartRate: 115,
      bloodPressureSystolic: 105,
      bloodPressureDiastolic: 70,
      oxygenSaturation: 95,
      wheezing: true,
      stridor: false,
      hypotension: false,
      patientAgeMonths: 60,
    });
    expect(severity).toBe('moderate');
  });

  it('should classify mild anaphylaxis with cutaneous symptoms only', () => {
    const severity = assessSeverity({
      systemsInvolved: ['cutaneous'],
      respiratoryRate: 28,
      heartRate: 105,
      bloodPressureSystolic: 110,
      bloodPressureDiastolic: 72,
      oxygenSaturation: 98,
      wheezing: false,
      stridor: false,
      hypotension: false,
      patientAgeMonths: 60,
    });
    expect(severity).toBe('mild');
  });
});

describe('Anaphylaxis Engine - Epinephrine IM Dosing', () => {
  it('should calculate correct epinephrine IM dose for 20 kg child', () => {
    const dose = calculateEpinephrineImDose(20);
    expect(dose.dose).toBe(0.2); // 0.01 mg/kg * 20 = 0.2 mg
    expect(dose.unit).toBe('mg');
    expect(dose.concentration).toBe('1:1000 (1 mg/mL)');
    expect(dose.volume).toBe(0.2); // 1 mg/mL, so 0.2 mL for 0.2 mg
    expect(dose.route).toBe('IM (intramuscular)');
    expect(dose.site).toBe('Anterolateral thigh (preferred)');
  });

  it('should cap epinephrine IM at 0.5 mg', () => {
    const dose = calculateEpinephrineImDose(60);
    expect(dose.dose).toBe(0.5); // Should cap at 0.5 mg, not 0.6 mg
  });

  it('should calculate small dose for young child', () => {
    const dose = calculateEpinephrineImDose(10);
    expect(dose.dose).toBe(0.1); // 0.01 mg/kg * 10 = 0.1 mg
    expect(dose.volume).toBe(0.1);
  });
});

describe('Anaphylaxis Engine - Epinephrine IV Dosing', () => {
  it('should calculate correct epinephrine IV bolus for 20 kg child', () => {
    const dose = calculateEpinephrineIvDose(20);
    expect(dose.bolus.dose).toBe(0.2); // 0.01 mg/kg * 20 = 0.2 mg
    expect(dose.bolus.concentration).toBe('1:10,000 (0.1 mg/mL)');
    expect(dose.bolus.volume).toBeCloseTo(2, 1); // 0.2 mg / 0.1 mg/mL = 2 mL
  });

  it('should cap epinephrine IV bolus at 0.5 mg', () => {
    const dose = calculateEpinephrineIvDose(60);
    expect(dose.bolus.dose).toBe(0.5);
  });

  it('should provide infusion guidance', () => {
    const dose = calculateEpinephrineIvDose(20);
    expect(dose.infusion.concentration).toBe('1:10,000 (0.1 mg/mL)');
    expect(dose.infusion.initialRate).toBe(0.1);
    expect(dose.infusion.rateUnit).toBe('mL/kg/min');
  });
});

describe('Anaphylaxis Engine - Antihistamine Dosing', () => {
  it('should calculate correct diphenhydramine dose for 20 kg child', () => {
    const dose = calculateAntihistamineDose(20);
    expect(dose.dose).toBe(25); // 1.25 mg/kg * 20 = 25 mg
    expect(dose.unit).toBe('mg');
    expect(dose.agent).toBe('Diphenhydramine');
  });

  it('should cap diphenhydramine at 50 mg', () => {
    const dose = calculateAntihistamineDose(50);
    expect(dose.dose).toBe(50); // Should cap at 50 mg, not 62.5 mg
  });
});

describe('Anaphylaxis Engine - Corticosteroid Dosing', () => {
  it('should calculate correct methylprednisolone dose for 20 kg child', () => {
    const dose = calculateCorticosteroidDose(20);
    expect(dose.dose).toBe(30); // 1.5 mg/kg * 20 = 30 mg
    expect(dose.unit).toBe('mg');
    expect(dose.agent).toBe('Methylprednisolone');
  });

  it('should cap methylprednisolone at 125 mg', () => {
    const dose = calculateCorticosteroidDose(100);
    expect(dose.dose).toBe(125); // Should cap at 125 mg, not 150 mg
  });
});

describe('Anaphylaxis Engine - Epinephrine Eligibility', () => {
  it('should mark first epinephrine dose as urgent and eligible', () => {
    const state: Partial<AnaphylaxisEngineState> = {
      epinephrineDoses: 0,
      lastEpinephrineTime: undefined,
      symptomOnsetTime: 60,
    };

    const eligibility = evaluateEpinephrineEligibility(state as AnaphylaxisEngineState);
    expect(eligibility.eligible).toBe(true);
    expect(eligibility.urgent).toBe(true);
    expect(eligibility.recommendation).toContain('IMMEDIATELY');
  });

  it('should allow repeat epinephrine after 5 minutes', () => {
    const state: Partial<AnaphylaxisEngineState> = {
      epinephrineDoses: 1,
      lastEpinephrineTime: 0,
      symptomOnsetTime: 350, // 350 seconds later (>5 minutes)
      severity: 'moderate',
    };

    const eligibility = evaluateEpinephrineEligibility(state as AnaphylaxisEngineState);
    expect(eligibility.eligible).toBe(true);
  });

  it('should not allow repeat epinephrine within 5 minutes', () => {
    const state: Partial<AnaphylaxisEngineState> = {
      epinephrineDoses: 1,
      lastEpinephrineTime: 100,
      symptomOnsetTime: 200, // Only 100 seconds later
      severity: 'moderate',
    };

    const eligibility = evaluateEpinephrineEligibility(state as AnaphylaxisEngineState);
    expect(eligibility.eligible).toBe(false);
  });

  it('should mark repeat epinephrine as urgent for severe anaphylaxis', () => {
    const state: Partial<AnaphylaxisEngineState> = {
      epinephrineDoses: 1,
      lastEpinephrineTime: 0,
      symptomOnsetTime: 350,
      severity: 'severe',
    };

    const eligibility = evaluateEpinephrineEligibility(state as AnaphylaxisEngineState);
    expect(eligibility.urgent).toBe(true);
  });
});

describe('Anaphylaxis Engine - ICU Admission Criteria', () => {
  it('should flag ICU admission for cardiovascular collapse', () => {
    const state: Partial<AnaphylaxisEngineState> = {
      severity: 'cardiovascular_collapse',
      hypotension: true,
      oxygenSaturation: 92,
      wheezing: false,
      stridor: false,
      epinephrineDoses: 1,
    };

    const icu = evaluateIcuAdmissionCriteria(state as AnaphylaxisEngineState);
    expect(icu.requiresIcu).toBe(true);
    expect(icu.criteria).toContain('Cardiovascular collapse (hypotension, shock)');
  });

  it('should flag ICU admission for severe bronchospasm with hypoxemia', () => {
    const state: Partial<AnaphylaxisEngineState> = {
      severity: 'severe',
      hypotension: false,
      oxygenSaturation: 91,
      wheezing: true,
      stridor: false,
      epinephrineDoses: 1,
    };

    const icu = evaluateIcuAdmissionCriteria(state as AnaphylaxisEngineState);
    expect(icu.requiresIcu).toBe(true);
  });

  it('should flag ICU admission for laryngeal edema', () => {
    const state: Partial<AnaphylaxisEngineState> = {
      severity: 'severe',
      hypotension: false,
      oxygenSaturation: 94,
      wheezing: false,
      stridor: true,
      epinephrineDoses: 1,
    };

    const icu = evaluateIcuAdmissionCriteria(state as AnaphylaxisEngineState);
    expect(icu.requiresIcu).toBe(true);
    expect(icu.criteria).toContain('Laryngeal edema (stridor)');
  });

  it('should flag ICU admission for multiple epinephrine doses', () => {
    const state: Partial<AnaphylaxisEngineState> = {
      severity: 'moderate',
      hypotension: false,
      oxygenSaturation: 95,
      wheezing: false,
      stridor: false,
      epinephrineDoses: 3,
    };

    const icu = evaluateIcuAdmissionCriteria(state as AnaphylaxisEngineState);
    expect(icu.requiresIcu).toBe(true);
  });

  it('should not flag ICU admission for mild anaphylaxis', () => {
    const state: Partial<AnaphylaxisEngineState> = {
      severity: 'mild',
      hypotension: false,
      oxygenSaturation: 98,
      wheezing: false,
      stridor: false,
      epinephrineDoses: 1,
    };

    const icu = evaluateIcuAdmissionCriteria(state as AnaphylaxisEngineState);
    expect(icu.requiresIcu).toBe(false);
  });
});

describe('Anaphylaxis Engine - Trigger Identification', () => {
  it('should identify food trigger', () => {
    const triggers = identifyTrigger({ recentFoodIntake: 'peanuts' });
    expect(triggers).toContain('Food: peanuts');
  });

  it('should identify medication trigger', () => {
    const triggers = identifyTrigger({ recentMedicationExposure: 'Penicillin' });
    expect(triggers).toContain('Medication: Penicillin');
  });

  it('should identify insect sting trigger', () => {
    const triggers = identifyTrigger({ insectStingHistory: true });
    expect(triggers).toContain('Insect sting');
  });

  it('should identify multiple triggers', () => {
    const triggers = identifyTrigger({
      recentFoodIntake: 'shellfish',
      insectStingHistory: true,
    });
    expect(triggers).toContain('Food: shellfish');
    expect(triggers).toContain('Insect sting');
  });

  it('should return unknown trigger if no context provided', () => {
    const triggers = identifyTrigger({});
    expect(triggers).toContain('Unknown trigger');
  });
});

describe('Anaphylaxis Engine - Clinical Recommendations', () => {
  it('should recommend immediate epinephrine for unrecognized anaphylaxis', () => {
    const state: Partial<AnaphylaxisEngineState> = {
      severity: 'severe',
      epinephrineDoses: 0,
      antihistamineDoses: 0,
    };

    const rec = generateRecommendation(state as AnaphylaxisEngineState);
    expect(rec).toContain('ANAPHYLAXIS RECOGNIZED');
    expect(rec).toContain('IMMEDIATELY');
  });

  it('should recommend shock management for cardiovascular collapse', () => {
    const state: Partial<AnaphylaxisEngineState> = {
      severity: 'cardiovascular_collapse',
      epinephrineDoses: 1,
      antihistamineDoses: 0,
    };

    const rec = generateRecommendation(state as AnaphylaxisEngineState);
    expect(rec).toContain('ANAPHYLACTIC SHOCK');
    expect(rec).toContain('infusion');
  });

  it('should recommend supportive care after epinephrine', () => {
    const state: Partial<AnaphylaxisEngineState> = {
      severity: 'moderate',
      epinephrineDoses: 1,
      antihistamineDoses: 0,
      ivAccessEstablished: false,
    };

    const rec = generateRecommendation(state as AnaphylaxisEngineState);
    expect(rec).toContain('IV access');
    expect(rec).toContain('antihistamine');
  });

  it('should recommend biphasic reaction monitoring', () => {
    const state: Partial<AnaphylaxisEngineState> = {
      severity: 'severe',
      epinephrineDoses: 1,
      antihistamineDoses: 1,
    };

    const rec = generateRecommendation(state as AnaphylaxisEngineState);
    expect(rec).toContain('4-8 hours');
    expect(rec).toContain('biphasic');
  });

  it('should recommend allergy specialist referral for resolved anaphylaxis', () => {
    const state: Partial<AnaphylaxisEngineState> = {
      severity: 'mild',
      epinephrineDoses: 1,
      antihistamineDoses: 1,
    };

    const rec = generateRecommendation(state as AnaphylaxisEngineState);
    expect(rec).toContain('allergy specialist');
  });
});
