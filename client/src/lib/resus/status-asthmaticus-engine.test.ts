/**
 * Test suite for status-asthmaticus-engine.ts
 * Validates clinical decision logic for severe asthma exacerbation management
 */

import { describe, it, expect } from 'vitest';
import {
  assessSeverity,
  calculateSalbutamolDose,
  calculateIpratropiumDose,
  calculateCorticosteroidDose,
  calculateMagnesiumDose,
  evaluateMedicationEligibility,
  evaluateIcuAdmissionCriteria,
  assessTherapyResponse,
  generateRecommendation,
  type AsthmaticEngineState,
} from './status-asthmaticus-engine';

describe('Status Asthmaticus Engine - Severity Assessment', () => {
  it('should classify life-threatening asthma with altered consciousness', () => {
    const severity = assessSeverity({
      respiratoryRate: 50,
      oxygenSaturation: 85,
      accessoryMusclUse: true,
      speakingAbility: 'unable',
      alertness: 'drowsy',
      patientAgeMonths: 60,
    });
    expect(severity).toBe('life_threatening');
  });

  it('should classify life-threatening asthma with severe hypoxemia', () => {
    const severity = assessSeverity({
      respiratoryRate: 45,
      oxygenSaturation: 88,
      accessoryMusclUse: true,
      speakingAbility: 'words',
      alertness: 'alert',
      patientAgeMonths: 60,
    });
    expect(severity).toBe('life_threatening');
  });

  it('should classify severe asthma with accessory muscle use', () => {
    const severity = assessSeverity({
      respiratoryRate: 40,
      oxygenSaturation: 91,
      accessoryMusclUse: true,
      speakingAbility: 'words',
      alertness: 'alert',
      patientAgeMonths: 60,
      peakFlowPercent: 40,
    });
    expect(severity).toBe('severe');
  });

  it('should classify moderate asthma with partial obstruction', () => {
    const severity = assessSeverity({
      respiratoryRate: 35,
      oxygenSaturation: 94,
      accessoryMusclUse: true,
      speakingAbility: 'phrases',
      alertness: 'alert',
      patientAgeMonths: 60,
      peakFlowPercent: 60,
    });
    expect(severity).toBe('moderate');
  });

  it('should classify mild asthma with minimal obstruction', () => {
    const severity = assessSeverity({
      respiratoryRate: 28,
      oxygenSaturation: 96,
      accessoryMusclUse: false,
      speakingAbility: 'full_sentences',
      alertness: 'alert',
      patientAgeMonths: 60,
      peakFlowPercent: 85,
    });
    expect(severity).toBe('mild');
  });
});

describe('Status Asthmaticus Engine - Medication Dosing', () => {
  it('should calculate correct salbutamol dose for 20 kg child', () => {
    const dose = calculateSalbutamolDose(20);
    expect(dose.dose).toBe(3.0); // 0.15 mg/kg * 20 = 3 mg
    expect(dose.unit).toBe('mg');
    expect(dose.route).toBe('Nebulized');
  });

  it('should cap salbutamol at 5 mg maximum', () => {
    const dose = calculateSalbutamolDose(50);
    expect(dose.dose).toBe(5.0); // Should cap at 5 mg, not 7.5 mg
  });

  it('should calculate ipratropium dose', () => {
    const dose = calculateIpratropiumDose(20);
    expect(dose.dose).toBe(0.25);
    expect(dose.unit).toBe('mg');
  });

  it('should calculate prednisolone dose correctly', () => {
    const dose = calculateCorticosteroidDose(20, 'prednisolone');
    expect(dose.dose).toBe(30); // 1.5 mg/kg * 20 = 30 mg
    expect(dose.unit).toBe('mg');
  });

  it('should cap prednisolone at 50 mg', () => {
    const dose = calculateCorticosteroidDose(40, 'prednisolone');
    expect(dose.dose).toBe(50); // Should cap at 50 mg, not 60 mg
  });

  it('should calculate dexamethasone dose correctly', () => {
    const dose = calculateCorticosteroidDose(20, 'dexamethasone');
    expect(dose.dose).toBe(10); // 0.6 mg/kg * 20 = 12 mg, but capped at 10 mg
  });

  it('should cap dexamethasone at 10 mg', () => {
    const dose = calculateCorticosteroidDose(20, 'dexamethasone');
    expect(dose.dose).toBe(10); // Should cap at 10 mg, not 12 mg
  });

  it('should calculate magnesium sulfate dose for severe asthma', () => {
    const dose = calculateMagnesiumDose(20);
    expect(dose.dose).toBe(800); // 40 mg/kg * 20 = 800 mg
    expect(dose.unit).toBe('mg');
    expect(dose.route).toBe('IV');
  });

  it('should cap magnesium at 2000 mg', () => {
    const dose = calculateMagnesiumDose(60);
    expect(dose.dose).toBe(2000); // Should cap at 2000 mg, not 2400 mg
  });
});

describe('Status Asthmaticus Engine - Medication Eligibility', () => {
  it('should allow salbutamol for first dose', () => {
    const state: Partial<AsthmaticEngineState> = {
      severity: 'moderate',
      salbutamolDoses: 0,
      lastBronchodilatorTime: undefined,
      symptomOnsetTime: 300,
    };

    const eligibility = evaluateMedicationEligibility(state as AsthmaticEngineState);
    expect(eligibility.salbutamolEligible).toBe(true);
  });

  it('should allow repeat salbutamol after 15 minutes', () => {
    const state: Partial<AsthmaticEngineState> = {
      severity: 'moderate',
      salbutamolDoses: 1,
      lastBronchodilatorTime: 0,
      symptomOnsetTime: 1000, // 1000 seconds later
    };

    const eligibility = evaluateMedicationEligibility(state as AsthmaticEngineState);
    expect(eligibility.salbutamolEligible).toBe(true);
  });

  it('should not allow repeat salbutamol within 15 minutes', () => {
    const state: Partial<AsthmaticEngineState> = {
      severity: 'moderate',
      salbutamolDoses: 1,
      lastBronchodilatorTime: 600,
      symptomOnsetTime: 700, // Only 100 seconds later
    };

    const eligibility = evaluateMedicationEligibility(state as AsthmaticEngineState);
    expect(eligibility.salbutamolEligible).toBe(false);
  });

  it('should recommend ipratropium for severe asthma', () => {
    const state: Partial<AsthmaticEngineState> = {
      severity: 'severe',
      ipratropiumDoses: 0,
      salbutamolDoses: 1,
    };

    const eligibility = evaluateMedicationEligibility(state as AsthmaticEngineState);
    expect(eligibility.ipratropiumEligible).toBe(true);
  });

  it('should allow corticosteroid once per admission', () => {
    const state: Partial<AsthmaticEngineState> = {
      severity: 'moderate',
      corticosteroidDoses: 0,
    };

    const eligibility = evaluateMedicationEligibility(state as AsthmaticEngineState);
    expect(eligibility.corticosteroidEligible).toBe(true);
  });

  it('should recommend magnesium for severe asthma with poor response', () => {
    const state: Partial<AsthmaticEngineState> = {
      severity: 'severe',
      magnesiumDoses: 0,
      responseToInitialTherapy: 'poor',
    };

    const eligibility = evaluateMedicationEligibility(state as AsthmaticEngineState);
    expect(eligibility.magnesiumEligible).toBe(true);
  });
});

describe('Status Asthmaticus Engine - ICU Admission Criteria', () => {
  it('should flag ICU admission for altered consciousness', () => {
    const state: Partial<AsthmaticEngineState> = {
      severity: 'life_threatening',
      alertness: 'drowsy',
      oxygenSaturation: 92,
      speakingAbility: 'phrases',
      responseToInitialTherapy: 'unknown',
      salbutamolDoses: 0,
    };

    const icu = evaluateIcuAdmissionCriteria(state as AsthmaticEngineState);
    expect(icu.requiresIcu).toBe(true);
    expect(icu.criteria).toContain('Altered consciousness (drowsy or unresponsive)');
  });

  it('should flag ICU admission for severe hypoxemia', () => {
    const state: Partial<AsthmaticEngineState> = {
      severity: 'life_threatening',
      alertness: 'alert',
      oxygenSaturation: 88,
      speakingAbility: 'phrases',
      responseToInitialTherapy: 'unknown',
      salbutamolDoses: 0,
    };

    const icu = evaluateIcuAdmissionCriteria(state as AsthmaticEngineState);
    expect(icu.requiresIcu).toBe(true);
    expect(icu.criteria).toContain('Severe hypoxemia (SpO2 < 90%)');
  });

  it('should flag ICU admission for poor response to therapy', () => {
    const state: Partial<AsthmaticEngineState> = {
      severity: 'severe',
      alertness: 'alert',
      oxygenSaturation: 92,
      speakingAbility: 'phrases',
      responseToInitialTherapy: 'poor',
      salbutamolDoses: 3,
    };

    const icu = evaluateIcuAdmissionCriteria(state as AsthmaticEngineState);
    expect(icu.requiresIcu).toBe(true);
  });

  it('should not flag ICU admission for mild asthma with good response', () => {
    const state: Partial<AsthmaticEngineState> = {
      severity: 'mild',
      alertness: 'alert',
      oxygenSaturation: 96,
      speakingAbility: 'full_sentences',
      responseToInitialTherapy: 'good',
      salbutamolDoses: 1,
    };

    const icu = evaluateIcuAdmissionCriteria(state as AsthmaticEngineState);
    expect(icu.requiresIcu).toBe(false);
  });
});

describe('Status Asthmaticus Engine - Therapy Response Assessment', () => {
  it('should assess good response with improved oxygenation and reduced RR', () => {
    const initialState: Partial<AsthmaticEngineState> = {
      oxygenSaturation: 92,
      respiratoryRate: 40,
      accessoryMusclUse: true,
    };

    const currentState: Partial<AsthmaticEngineState> = {
      oxygenSaturation: 96,
      respiratoryRate: 32,
      accessoryMusclUse: false,
    };

    const response = assessTherapyResponse(
      initialState as AsthmaticEngineState,
      currentState as AsthmaticEngineState
    );
    expect(response).toBe('good');
  });

  it('should assess poor response with no improvement', () => {
    const initialState: Partial<AsthmaticEngineState> = {
      oxygenSaturation: 92,
      respiratoryRate: 40,
      severity: 'moderate',
    };

    const currentState: Partial<AsthmaticEngineState> = {
      oxygenSaturation: 91,
      respiratoryRate: 42,
      severity: 'severe',
    };

    const response = assessTherapyResponse(
      initialState as AsthmaticEngineState,
      currentState as AsthmaticEngineState
    );
    expect(response).toBe('poor');
  });

  it('should assess partial response with some improvement', () => {
    const initialState: Partial<AsthmaticEngineState> = {
      oxygenSaturation: 92,
      respiratoryRate: 40,
      accessoryMusclUse: true,
    };

    const currentState: Partial<AsthmaticEngineState> = {
      oxygenSaturation: 94,
      respiratoryRate: 38,
      accessoryMusclUse: true,
    };

    const response = assessTherapyResponse(
      initialState as AsthmaticEngineState,
      currentState as AsthmaticEngineState
    );
    expect(response).toBe('partial');
  });
});

describe('Status Asthmaticus Engine - Clinical Recommendations', () => {
  it('should recommend emergency management for altered consciousness', () => {
    const state: Partial<AsthmaticEngineState> = {
      severity: 'life_threatening',
      alertness: 'drowsy',
    };

    const rec = generateRecommendation(state as AsthmaticEngineState);
    expect(rec).toContain('EMERGENCY');
    expect(rec).toContain('intubation');
  });

  it('should recommend aggressive treatment for life-threatening asthma', () => {
    const state: Partial<AsthmaticEngineState> = {
      severity: 'life_threatening',
      alertness: 'alert',
      responseToInitialTherapy: 'unknown',
    };

    const rec = generateRecommendation(state as AsthmaticEngineState);
    expect(rec).toContain('LIFE-THREATENING');
  });

  it('should recommend escalation for poor response', () => {
    const state: Partial<AsthmaticEngineState> = {
      severity: 'moderate',
      alertness: 'alert',
      responseToInitialTherapy: 'poor',
    };

    const rec = generateRecommendation(state as AsthmaticEngineState);
    expect(rec).toContain('POOR RESPONSE');
  });

  it('should recommend discharge planning for good response', () => {
    const state: Partial<AsthmaticEngineState> = {
      severity: 'mild',
      alertness: 'alert',
      responseToInitialTherapy: 'good',
    };

    const rec = generateRecommendation(state as AsthmaticEngineState);
    expect(rec).toContain('GOOD RESPONSE');
    expect(rec).toContain('discharge');
  });
});
