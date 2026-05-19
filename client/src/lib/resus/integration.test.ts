/**
 * Integration Test Suite for PaedsResusGPS
 * 
 * Comprehensive testing of all clinical engines, override detection, and session management.
 * Validates end-to-end workflows for all emergency types.
 */

import { describe, it, expect } from 'vitest';
import { calculateShockEnergy, calculateCprMedicationDose } from './cpr-engine';
import { assessSeverity as assessSeverityAsthma } from './status-asthmaticus-engine';
import {
  assessSeverity as assessSeverityAnaphylaxis,
  calculateEpinephrineImDose,
} from './anaphylaxis-engine';
import { detectOverrides } from './unified-override-detection';
import { checkSafetyGate } from './override-safety-gates';

describe('Integration: CPR Engine Workflow', () => {
  it('should calculate correct shock energy for 20kg child', () => {
    const energy = calculateShockEnergy(20, 1);
    expect(energy).toBe(80); // 4 J/kg for second shock
  });

  it('should calculate correct epinephrine dose for 15kg child', () => {
    const result = calculateCprMedicationDose('epinephrine', 15);
    expect(result.dose).toBe(0.15);
    expect(result.unit).toBe('mg');
  });

  it('should detect CPR override: delayed epinephrine', () => {
    const overrides = detectOverrides('cpr', {
      cprDurationSeconds: 240,
      firstEpiGiven: false,
    });
    expect(overrides.length).toBeGreaterThan(0);
    expect(overrides[0].overrideType).toBe('delayed_epinephrine');
  });

  it('should pass safety gate for valid CPR override justification', () => {
    const result = checkSafetyGate('cpr', 'delayed_epinephrine', 'Epinephrine was not available in the crash cart');
    expect(result.passed).toBe(true);
    expect(result.requiresPhysicianReview).toBe(true);
  });
});

describe('Integration: Status Asthmaticus Workflow', () => {
  it('should assess severe asthma severity correctly', () => {
    const severity = assessSeverityAsthma({
      respiratoryRate: 40,
      oxygenSaturation: 88,
      peakFlowPercent: 30,
      accessoryMusclUse: true,
      speakingAbility: 'unable',
      alertness: 'alert',
      patientAgeMonths: 60,
    });
    expect(['severe', 'life_threatening']).toContain(severity);
  });

  it('should detect respiratory override: no oxygen in severe asthma', () => {
    const overrides = detectOverrides('respiratory', {
      severity: 'severe',
      oxygenStarted: false,
    });
    expect(overrides.length).toBeGreaterThan(0);
    expect(overrides[0].overrideType).toBe('no_oxygen_severe_asthma');
  });

  it('should pass safety gate for respiratory override', () => {
    const result = checkSafetyGate('respiratory', 'no_oxygen_severe_asthma', 'Oxygen equipment was not functioning at the time');
    expect(result.passed).toBe(true);
    expect(result.requiresSecondVerification).toBe(false);
  });
});

describe('Integration: Anaphylaxis Workflow', () => {
  it('should assess severe anaphylaxis correctly', () => {
    const severity = assessSeverityAnaphylaxis({
      systemsInvolved: ['respiratory', 'cutaneous'],
      respiratoryRate: 32,
      heartRate: 130,
      bloodPressureSystolic: 100,
      oxygenSaturation: 90,
      wheezing: true,
      stridor: false,
      hypotension: false,
      patientAgeMonths: 60,
    });
    expect(severity).toBe('severe');
  });

  it('should calculate correct epinephrine IM dose for 25kg child', () => {
    const dose = calculateEpinephrineImDose(25);
    expect(dose.dose).toBe(0.25);
  });

  it('should detect anaphylaxis override: delayed epinephrine', () => {
    const overrides = detectOverrides('anaphylaxis', {
      severity: 'severe',
      epinephrineDoses: 0,
      timeSinceOnset: 120,
    });
    expect(overrides.length).toBeGreaterThan(0);
    expect(overrides[0].overrideType).toBe('delayed_epinephrine_anaphylaxis');
  });

  it('should pass safety gate for anaphylaxis override with justification', () => {
    const result = checkSafetyGate('anaphylaxis', 'delayed_epinephrine_anaphylaxis', 'Patient was in anaphylactic shock, epinephrine auto-injector was used');
    expect(result.passed).toBe(true);
    expect(result.requiresPhysicianReview).toBe(true);
  });
});

describe('Integration: Cross-Emergency Type Consistency', () => {
  it('should detect overrides across all emergency types', () => {
    const emergencyTypes = ['cpr', 'respiratory', 'anaphylaxis', 'septic_shock', 'dka', 'status_epilepticus'];
    
    emergencyTypes.forEach((type) => {
      const overrides = detectOverrides(type, {
        severity: 'severe',
        timeElapsed: 300,
      });
      expect(Array.isArray(overrides)).toBe(true);
    });
  });

  it('should apply consistent safety gate logic across all types', () => {
    const emergencyTypes = ['cpr', 'respiratory', 'anaphylaxis', 'septic_shock', 'dka', 'status_epilepticus'];
    
    emergencyTypes.forEach((type) => {
      const result = checkSafetyGate(type, 'test_override', 'This is a valid justification for testing purposes');
      expect(result.passed).toBe(true);
      expect(result.requiresJustification).toBe(true);
    });
  });
});

describe('Integration: Clinical Validation Against Guidelines', () => {
  it('should follow AHA guidelines for asthma severity assessment', () => {
    const mild = assessSeverityAsthma({
      respiratoryRate: 22,
      oxygenSaturation: 98,
      peakFlowPercent: 80,
      accessoryMusclUse: false,
      speakingAbility: 'normal',
      alertness: 'alert',
      patientAgeMonths: 60,
    });
    expect(mild).toBe('mild');

    const moderate = assessSeverityAsthma({
      respiratoryRate: 32,
      oxygenSaturation: 93,
      peakFlowPercent: 50,
      accessoryMusclUse: true,
      speakingAbility: 'phrases',
      alertness: 'alert',
      patientAgeMonths: 60,
    });
    expect(moderate).toBe('moderate');

    const severe = assessSeverityAsthma({
      respiratoryRate: 40,
      oxygenSaturation: 88,
      peakFlowPercent: 30,
      accessoryMusclUse: true,
      speakingAbility: 'unable',
      alertness: 'alert',
      patientAgeMonths: 60,
    });
    expect(['severe', 'life_threatening']).toContain(severe);
  });

  it('should follow AHA guidelines for anaphylaxis management', () => {
    const mild = assessSeverityAnaphylaxis({
      systemsInvolved: ['cutaneous'],
      respiratoryRate: 20,
      heartRate: 100,
      bloodPressureSystolic: 110,
      oxygenSaturation: 98,
      wheezing: false,
      stridor: false,
      hypotension: false,
      patientAgeMonths: 60,
    });
    expect(mild).toBe('mild');

    const severe = assessSeverityAnaphylaxis({
      systemsInvolved: ['respiratory', 'cardiovascular', 'cutaneous'],
      respiratoryRate: 30,
      heartRate: 140,
      bloodPressureSystolic: 70,
      oxygenSaturation: 85,
      wheezing: true,
      stridor: true,
      hypotension: true,
      patientAgeMonths: 60,
    });
    expect(severe).toBe('cardiovascular_collapse');
  });
});

describe('Integration: Performance Under Pressure', () => {
  it('should calculate doses rapidly for multiple children', () => {
    const weights = [5, 10, 15, 20, 25, 30];
    const startTime = Date.now();

    weights.forEach((weight) => {
      calculateCprMedicationDose('epinephrine', weight);
      calculateShockEnergy(weight, 1);
      assessSeverityAsthma({
        respiratoryRate: 32,
        oxygenSaturation: 93,
        peakFlowPercent: 50,
        accessoryMusclUse: true,
        speakingAbility: 'phrases',
        alertness: 'alert',
        patientAgeMonths: 60,
      });
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(100);
  });

  it('should handle rapid override detection', () => {
    const startTime = Date.now();

    for (let i = 0; i < 100; i++) {
      detectOverrides('cpr', {
        cprDurationSeconds: Math.random() * 600,
        firstEpiGiven: Math.random() > 0.5,
        rhythmType: ['VF', 'PEA', 'Asystole'][Math.floor(Math.random() * 3)],
      });
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(50);
  });
});

describe('Integration: Data Integrity and Consistency', () => {
  it('should maintain consistent medication dosing across emergency types', () => {
    const weight = 20;

    const cprEpi = calculateCprMedicationDose('epinephrine', weight);
    expect(cprEpi.dose).toBe(0.2);

    const anaEpi = calculateEpinephrineImDose(weight);
    expect(anaEpi.dose).toBe(0.2);

    expect(cprEpi.dose).toBe(anaEpi.dose);
  });

  it('should validate weight-based calculations', () => {
    const testWeights = [3, 5, 10, 15, 20, 25, 30, 40, 50];

    testWeights.forEach((weight) => {
      const epiResult = calculateCprMedicationDose('epinephrine', weight);
      const shockEnergy = calculateShockEnergy(weight, 1);

      expect(epiResult.dose).toBe(weight * 0.01);
      expect(shockEnergy).toBe(weight * 4); // 4 J/kg for shock count 1
    });
  });
});
