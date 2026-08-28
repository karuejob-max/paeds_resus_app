import { describe, expect, it } from 'vitest';
import {
  calcDose,
  getForeignBodyAirwayGuidance,
  resolveBlsAssessment,
  type DoseInfo,
} from './abcdeEngine';
import { assessSeverity, calculateEpinephrineIvDose, generateRecommendation } from './anaphylaxis-engine';
import { generateInsulinProtocol, type DKAAssessment } from './dka-engine';
import {
  assessNeonatalSeverity,
  generateChestCompressionInterventions,
  generateMedicationInterventions,
  type NeonatalAssessment,
} from './neonatal-resuscitation-engine';
import { resolveLifeSupportPack } from './cpr-pack-resolver';
import { generateTraumaSummary, type TraumaAssessment } from './trauma-engine';
import { getScenarioDrugDose } from '@shared/quickStartScenarios';
import { generateBreathingActions } from '../actionSequencing';

const neonatalAssessment: NeonatalAssessment = {
  ageMinutes: 1,
  birthWeight: 3500,
  gestationalAge: 40,
  term: true,
  toneAtBirth: 'poor',
  breathingEffort: 'absent',
  heartRate: 40,
  meconiumPresent: false,
  meconiumStained: 'clear',
  dryingAndStimulation: false,
  positioningDone: false,
  suction: 'not_needed',
  oxygenSaturation: 70,
  chestRise: 'none',
  breathSounds: 'absent',
  heartRateAfterVentilation: 40,
  heartRateAfterCompressions: 40,
  color: 'pale',
  meconiumAspiration: false,
};

const adultDkaAssessment: DKAAssessment = {
  age: 35,
  weightKg: 70,
  bloodGlucose: 450,
  glucoseUnit: 'mg/dL',
  pH: 7.1,
  bicarbonate: 8,
  anionGap: 24,
  ketonemia: 'large',
  ketonuria: 'large',
  respiratoryRate: 30,
  breathPattern: 'kussmaul',
  mentalStatus: 'alert',
  vomiting: false,
  abdominalPain: false,
  fluidDeficit: 8,
  potassium: 4.2,
  sodium: 132,
  chloride: 96,
};

const traumaAssessment: TraumaAssessment = {
  age: 2,
  weightKg: 12,
  mechanismOfInjury: 'fall',
  airwayPatency: 'patent',
  respiratoryRate: 24,
  oxygenSaturation: 96,
  breathSounds: 'bilateral_equal',
  chestWallIntegrity: 'intact',
  heartRate: 120,
  systolicBP: 72,
  diastolicBP: 45,
  capillaryRefillTime: 2,
  skinPerfusion: 'warm_pink',
  pulseQuality: 'strong',
  consciousness: 'alert',
  pupilSize: 'normal',
  pupilReactivity: 'reactive',
  highEnergyMechanism: false,
  penetratingInjury: false,
  suspectedSpinalInjury: false,
};

describe('all-age clinical content safety matrix', () => {
  it('keeps NRP limited to an explicitly confirmed delivery-room newborn', () => {
    expect(resolveLifeSupportPack(0, false, 'delivery_room').pack).toBe('NRP');
    expect(() => resolveLifeSupportPack(12, false, 'delivery_room')).toThrow(/delivery-room NRP/i);
    expect(resolveLifeSupportPack(12, false, 'hospital').pack).toBe('PALS');
    expect(resolveLifeSupportPack(216, false, 'hospital').pack).toBe('ACLS');
  });

  it('routes confirmed absent pulse to the arrest branch before generic XABCDE', () => {
    expect(resolveBlsAssessment('unresponsive', 'absent', 'unknown')).toBe('cardiac_arrest');
    expect(resolveBlsAssessment('responsive', 'normal', 'present')).toBe('no_cardiac_arrest');
  });

  it('uses fixed-band semantics without multiplying a fixed dose by weight', () => {
    const salbutamol: DoseInfo = {
      drug: 'Salbutamol',
      dosePerKg: 0,
      unit: 'mg',
      route: 'nebulized',
      doseModel: 'fixed_band',
      doseBands: [
        { maxWeightKg: 20, dose: 2.5 },
        { minWeightKg: 20, dose: 5 },
      ],
    };
    expect(calcDose(salbutamol, 10)).toContain('2.5 mg');
    expect(calcDose(salbutamol, 40)).toContain('5.0 mg');
    expect(calcDose(salbutamol, 40)).not.toContain('200');
  });

  it('uses infant choking manoeuvres for neonates/infants and abdominal thrusts for older patients', () => {
    expect(getForeignBodyAirwayGuidance('2 months').title).toMatch(/chest thrusts/i);
    expect(getForeignBodyAirwayGuidance('2 years').title).toMatch(/abdominal thrusts/i);
    expect(getForeignBodyAirwayGuidance('adult').title).toMatch(/abdominal thrusts/i);
  });

  it('does not expose routine IV epinephrine bolus for anaphylaxis', () => {
    expect(calculateEpinephrineIvDose(20).bolus).toBeNull();
    const severity = assessSeverity({
      systemsInvolved: ['cardiovascular', 'respiratory'],
      respiratoryRate: 30,
      heartRate: 140,
      bloodPressureSystolic: 70,
      oxygenSaturation: 92,
      wheezing: true,
      stridor: false,
      hypotension: true,
      patientAgeMonths: 24,
    });
    const recommendation = generateRecommendation({
      patientWeight: 12,
      patientAgeMonths: 24,
      severity,
      phase: 'epinephrine_given',
      systemsInvolved: ['cardiovascular', 'respiratory'],
      respiratoryRate: 30,
      heartRate: 140,
      bloodPressureSystolic: 70,
      bloodPressureDiastolic: 40,
      oxygenSaturation: 92,
      skinFindings: 'urticaria',
      wheezing: true,
      stridor: false,
      hypotension: true,
      epinephrineDoses: 1,
      ivAccessEstablished: false,
      antihistamineDoses: 0,
      corticosteroidDoses: 0,
      symptomOnsetTime: 600,
      recognitionTime: 60,
    });
    expect(recommendation).toMatch(/expert-led epinephrine infusion/i);
    expect(recommendation).toMatch(/not give IV epinephrine as a routine bolus/i);
  });

  it('does not apply the paediatric no-bolus insulin language to adult DKA', () => {
    const severity = { level: 'severe', classification: 'Severe DKA', score: 8, description: 'Severe DKA', requiresICU: true, riskOfCerebralEdema: false } as const;
    const interventions = generateInsulinProtocol(adultDkaAssessment, severity);
    expect(interventions).toHaveLength(1);
    expect(interventions[0].type).toBe('adult_dka_protocol_gate');
    expect(interventions[0].dosing).toMatch(/adult DKA/i);
  });

  it('requires an explicit post-compressions checkpoint before neonatal epinephrine', () => {
    const withoutCompressionCheckpoint = assessNeonatalSeverity({ ...neonatalAssessment, heartRateAfterCompressions: undefined });
    expect(withoutCompressionCheckpoint.requiresVentilation).toBe(true);
    expect(withoutCompressionCheckpoint.requiresChestCompressions).toBe(true);
    expect(withoutCompressionCheckpoint.requiresEpinephrine).toBe(false);

    const withCompressionCheckpoint = assessNeonatalSeverity(neonatalAssessment);
    expect(withCompressionCheckpoint.requiresEpinephrine).toBe(true);
    expect(generateChestCompressionInterventions(neonatalAssessment, withCompressionCheckpoint)[0].dosing).toMatch(/90 compressions.*30 breaths/i);
    expect(generateMedicationInterventions(neonatalAssessment, withCompressionCheckpoint)[0].indication).toMatch(/60 seconds/i);
  });

  it('does not fabricate a GCS score or universal adult hypotension threshold in paediatric trauma', () => {
    const summary = generateTraumaSummary(traumaAssessment, {
      level: 'minor',
      classification: 'Minor Trauma',
      description: 'Stable minor trauma',
      requiresICU: false,
      requiresOperatingRoom: false,
      requiresAirwayManagement: false,
      requiresFluidResuscitation: false,
      requiresBloodProducts: false,
      requiresSpinalPrecautions: false,
      traumaTeamActivation: false,
    });
    expect(summary).toContain('Not calculated here');
    expect(summary).not.toContain('/15');
  });

  it('refuses to calculate ambiguous Quick Start ranges from the first number', () => {
    const result = getScenarioDrugDose('septic_shock', 'Ceftriaxone', 20);
    expect(result?.calculated).toMatch(/no automatic Quick Start calculation/i);
  });

  it('does not issue a generic oxygen action without an explicitly selected target', () => {
    const withoutTarget = generateBreathingActions({
      phase: 'breathing',
      findings: { spO2: 89, oxygenApplied: false },
      weight: 12,
      age: { years: 2, months: 24 },
    });
    expect(withoutTarget).toHaveLength(0);

    const withTarget = generateBreathingActions({
      phase: 'breathing',
      findings: { spO2: 89, oxygenApplied: false, oxygenTarget: 94 },
      weight: 12,
      age: { years: 2, months: 24 },
    });
    expect(withTarget[0].description).toMatch(/age-.*diagnosis-appropriate/i);
    expect(withTarget[0].description).not.toMatch(/10-15 L\/min|non-rebreather/i);
  });
});

void adultDkaAssessment;
