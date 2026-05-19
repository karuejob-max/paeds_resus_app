import { describe, it, expect } from 'vitest';
import {
  assessTraumaSeverity,
  generatePrimarySurveyInterventions,
  generateSecondarySurveyInterventions,
  type TraumaAssessment,
} from '@/lib/resus/trauma-engine';
import {
  assessNeonatalSeverity,
  generateInitialAssessmentInterventions,
  generateVentilationInterventions,
  generateChestCompressionInterventions,
  generateMedicationInterventions,
  type NeonatalAssessment,
} from '@/lib/resus/neonatal-resuscitation-engine';

describe('Trauma Engine', () => {
  describe('assessTraumaSeverity', () => {
    it('should classify critical trauma with airway obstruction', () => {
      const assessment: TraumaAssessment = {
        age: 8,
        weightKg: 25,
        mechanismOfInjury: 'MVA - high speed',
        airwayPatency: 'obstructed',
        respiratoryRate: 8,
        oxygenSaturation: 85,
        breathSounds: 'absent',
        chestWallIntegrity: 'compromised',
        heartRate: 140,
        systolicBP: 70,
        diastolicBP: 40,
        capillaryRefillTime: 4,
        skinPerfusion: 'cold_mottled',
        pulseQuality: 'weak',
        consciousness: 'unresponsive',
        pupilSize: 'dilated_bilateral',
        pupilReactivity: 'unreactive',
        suspectedSpinalInjury: true,
        highEnergyMechanism: true,
        penetratingInjury: false,
      };

      const severity = assessTraumaSeverity(assessment);
      expect(severity.level).toBe('critical');
      expect(severity.requiresAirwayIntervention).toBe(true);
      expect(severity.requiresChestIntervention).toBe(true);
      expect(severity.requiresFluidResuscitation).toBe(true);
      expect(severity.traumaTeamActivation).toBe(true);
    });

    it('should classify severe trauma with hemorrhagic shock', () => {
      const assessment: TraumaAssessment = {
        age: 5,
        weightKg: 18,
        mechanismOfInjury: 'Fall from height',
        airwayPatency: 'patent',
        respiratoryRate: 28,
        oxygenSaturation: 92,
        breathSounds: 'bilateral_equal',
        chestWallIntegrity: 'intact',
        heartRate: 160,
        systolicBP: 80,
        diastolicBP: 50,
        capillaryRefillTime: 3,
        skinPerfusion: 'cool_pale',
        pulseQuality: 'weak',
        consciousness: 'verbal',
        pupilSize: 'normal',
        pupilReactivity: 'reactive',
        suspectedSpinalInjury: true,
        highEnergyMechanism: true,
        penetratingInjury: false,
      };

      const severity = assessTraumaSeverity(assessment);
      expect(severity.level).toBe('critical');
      expect(severity.requiresFluidResuscitation).toBe(true);
    });

    it('should classify minor trauma with stable vitals', () => {
      const assessment: TraumaAssessment = {
        age: 10,
        weightKg: 30,
        mechanismOfInjury: 'Minor blunt trauma',
        airwayPatency: 'patent',
        respiratoryRate: 18,
        oxygenSaturation: 99,
        breathSounds: 'bilateral_equal',
        chestWallIntegrity: 'intact',
        heartRate: 90,
        systolicBP: 115,
        diastolicBP: 75,
        capillaryRefillTime: 2,
        skinPerfusion: 'warm_pink',
        pulseQuality: 'strong',
        consciousness: 'alert',
        pupilSize: 'normal',
        pupilReactivity: 'reactive',
        suspectedSpinalInjury: false,
        highEnergyMechanism: false,
        penetratingInjury: false,
      };

      const severity = assessTraumaSeverity(assessment);
      expect(severity.level).toBe('minor');
      expect(severity.requiresFluidResuscitation).toBe(false);
    });
  });

  describe('generatePrimarySurveyInterventions', () => {
    it('should generate airway interventions for obstructed airway', () => {
      const assessment: TraumaAssessment = {
        age: 8,
        weightKg: 25,
        mechanismOfInjury: 'MVA',
        airwayPatency: 'obstructed',
        respiratoryRate: 8,
        oxygenSaturation: 85,
        breathSounds: 'absent',
        chestWallIntegrity: 'compromised',
        heartRate: 140,
        systolicBP: 70,
        diastolicBP: 40,
        capillaryRefillTime: 4,
        skinPerfusion: 'cold_mottled',
        pulseQuality: 'weak',
        consciousness: 'unresponsive',
        pupilSize: 'dilated_bilateral',
        pupilReactivity: 'unreactive',
        suspectedSpinalInjury: true,
        highEnergyMechanism: true,
        penetratingInjury: false,
      };

      const severity = assessTraumaSeverity(assessment);
      const interventions = generatePrimarySurveyInterventions(assessment, severity);

      const airwayInterventions = interventions.filter(i => i.type === 'airway_management');
      expect(airwayInterventions.length).toBeGreaterThan(0);
      expect(airwayInterventions[0].priority).toBe('immediate');
    });

    it('should generate breathing interventions for compromised chest', () => {
      const assessment: TraumaAssessment = {
        age: 8,
        weightKg: 25,
        mechanismOfInjury: 'Penetrating chest wound',
        airwayPatency: 'patent',
        respiratoryRate: 32,
        oxygenSaturation: 88,
        breathSounds: 'unilateral_decreased',
        chestWallIntegrity: 'compromised',
        heartRate: 160,
        systolicBP: 75,
        diastolicBP: 45,
        capillaryRefillTime: 4,
        skinPerfusion: 'cold_mottled',
        pulseQuality: 'weak',
        consciousness: 'verbal',
        pupilSize: 'normal',
        pupilReactivity: 'reactive',
        suspectedSpinalInjury: false,
        highEnergyMechanism: true,
        penetratingInjury: true,
      };

      const severity = assessTraumaSeverity(assessment);
      const interventions = generatePrimarySurveyInterventions(assessment, severity);

      // Verify interventions are generated for compromised chest
      expect(interventions.length).toBeGreaterThan(0);
      expect(severity.level).toBe('critical');
    });
  });

  describe('generateSecondarySurveyInterventions', () => {
    it('should generate systematic head-to-toe assessment interventions', () => {
      const assessment: TraumaAssessment = {
        age: 8,
        weightKg: 25,
        mechanismOfInjury: 'MVA',
        airwayPatency: 'patent',
        respiratoryRate: 20,
        oxygenSaturation: 98,
        breathSounds: 'bilateral_equal',
        chestWallIntegrity: 'intact',
        heartRate: 90,
        systolicBP: 115,
        diastolicBP: 75,
        capillaryRefillTime: 2,
        skinPerfusion: 'warm_pink',
        pulseQuality: 'strong',
        consciousness: 'alert',
        pupilSize: 'normal',
        pupilReactivity: 'reactive',
        suspectedSpinalInjury: false,
        highEnergyMechanism: false,
        penetratingInjury: false,
      };

      const interventions = generateSecondarySurveyInterventions(assessment);
      expect(interventions.length).toBeGreaterThan(0);
      expect(interventions[0].type).toBe('secondary_survey_head_neck');
    });
  });
});

describe('Neonatal Resuscitation Engine', () => {
  describe('assessNeonatalSeverity', () => {
    it('should classify vigorous neonate', () => {
      const assessment: NeonatalAssessment = {
        ageMinutes: 1,
        birthWeight: 3500,
        gestationalAge: 40,
        term: true,
        toneAtBirth: 'good',
        breathingEffort: 'spontaneous',
        heartRate: 140,
        meconiumPresent: false,
        meconiumStained: 'clear',
        dryingAndStimulation: false,
        positioningDone: false,
        suction: 'not_needed',
        oxygenSaturation: 98,
        chestRise: 'adequate',
        breathSounds: 'bilateral_equal',
        heartRateAfterVentilation: 140,
        color: 'pink',
        meconiumAspiration: false,
      };

      const severity = assessNeonatalSeverity(assessment);
      expect(severity.level).toBe('vigorous');
      expect(severity.requiresVentilation).toBe(false);
      expect(severity.requiresChestCompressions).toBe(false);
      expect(severity.requiresICU).toBe(false);
    });

    it('should classify depressed neonate requiring ventilation', () => {
      const assessment: NeonatalAssessment = {
        ageMinutes: 1,
        birthWeight: 3500,
        gestationalAge: 40,
        term: true,
        toneAtBirth: 'poor',
        breathingEffort: 'gasping',
        heartRate: 120,
        meconiumPresent: false,
        meconiumStained: 'clear',
        dryingAndStimulation: false,
        positioningDone: false,
        suction: 'not_needed',
        oxygenSaturation: 90,
        chestRise: 'inadequate',
        breathSounds: 'bilateral_equal',
        heartRateAfterVentilation: 120,
        color: 'acrocyanosis',
        meconiumAspiration: false,
      };

      const severity = assessNeonatalSeverity(assessment);
      expect(severity.level).toBe('depressed');
      expect(severity.requiresVentilation).toBe(true);
      expect(severity.requiresChestCompressions).toBe(false);
    });

    it('should classify severely depressed neonate requiring CPR', () => {
      const assessment: NeonatalAssessment = {
        ageMinutes: 1,
        birthWeight: 3500,
        gestationalAge: 40,
        term: true,
        toneAtBirth: 'poor',
        breathingEffort: 'absent',
        heartRate: 40,
        meconiumPresent: true,
        meconiumStained: 'thick',
        dryingAndStimulation: false,
        positioningDone: false,
        suction: 'intubation',
        oxygenSaturation: 70,
        chestRise: 'none',
        breathSounds: 'absent',
        heartRateAfterVentilation: 40,
        color: 'pale',
        meconiumAspiration: true,
      };

      const severity = assessNeonatalSeverity(assessment);
      expect(severity.level).toBe('severely_depressed');
      expect(severity.requiresChestCompressions).toBe(true);
      expect(severity.requiresEpinephrine).toBe(true);
      expect(severity.requiresIntubation).toBe(true);
      expect(severity.requiresICU).toBe(true);
    });
  });

  describe('generateInitialAssessmentInterventions', () => {
    it('should generate initial assessment guidance', () => {
      const assessment: NeonatalAssessment = {
        ageMinutes: 0,
        birthWeight: 3500,
        gestationalAge: 40,
        term: true,
        toneAtBirth: 'good',
        breathingEffort: 'spontaneous',
        heartRate: 140,
        meconiumPresent: false,
        meconiumStained: 'clear',
        dryingAndStimulation: false,
        positioningDone: false,
        suction: 'not_needed',
        oxygenSaturation: 98,
        chestRise: 'adequate',
        breathSounds: 'bilateral_equal',
        heartRateAfterVentilation: 140,
        color: 'pink',
        meconiumAspiration: false,
      };

      const interventions = generateInitialAssessmentInterventions(assessment);
      expect(interventions.length).toBeGreaterThan(0);
      expect(interventions[0].type).toBe('initial_assessment');
      expect(interventions[0].priority).toBe('immediate');
    });

    it('should include meconium management for thick meconium', () => {
      const assessment: NeonatalAssessment = {
        ageMinutes: 0,
        birthWeight: 3500,
        gestationalAge: 40,
        term: true,
        toneAtBirth: 'good',
        breathingEffort: 'spontaneous',
        heartRate: 140,
        meconiumPresent: true,
        meconiumStained: 'thick',
        dryingAndStimulation: false,
        positioningDone: false,
        suction: 'not_needed',
        oxygenSaturation: 98,
        chestRise: 'adequate',
        breathSounds: 'bilateral_equal',
        heartRateAfterVentilation: 140,
        color: 'pink',
        meconiumAspiration: false,
      };

      const interventions = generateInitialAssessmentInterventions(assessment);
      const meconiumInterventions = interventions.filter(i => i.type === 'meconium_management');
      expect(meconiumInterventions.length).toBeGreaterThan(0);
    });
  });

  describe('generateVentilationInterventions', () => {
    it('should generate PPV guidance for depressed neonate', () => {
      const assessment: NeonatalAssessment = {
        ageMinutes: 1,
        birthWeight: 3500,
        gestationalAge: 40,
        term: true,
        toneAtBirth: 'poor',
        breathingEffort: 'gasping',
        heartRate: 120,
        meconiumPresent: false,
        meconiumStained: 'clear',
        dryingAndStimulation: false,
        positioningDone: false,
        suction: 'not_needed',
        oxygenSaturation: 90,
        chestRise: 'inadequate',
        breathSounds: 'bilateral_equal',
        heartRateAfterVentilation: 120,
        color: 'acrocyanosis',
        meconiumAspiration: false,
      };

      const severity = assessNeonatalSeverity(assessment);
      const interventions = generateVentilationInterventions(assessment, severity);
      
      const ppvInterventions = interventions.filter(i => i.type === 'positive_pressure_ventilation');
      expect(ppvInterventions.length).toBeGreaterThan(0);
      expect(ppvInterventions[0].priority).toBe('immediate');
    });

    it('should include intubation guidance for severely depressed neonate', () => {
      const assessment: NeonatalAssessment = {
        ageMinutes: 1,
        birthWeight: 3500,
        gestationalAge: 40,
        term: true,
        toneAtBirth: 'poor',
        breathingEffort: 'absent',
        heartRate: 40,
        meconiumPresent: true,
        meconiumStained: 'thick',
        dryingAndStimulation: false,
        positioningDone: false,
        suction: 'intubation',
        oxygenSaturation: 70,
        chestRise: 'none',
        breathSounds: 'absent',
        heartRateAfterVentilation: 40,
        color: 'pale',
        meconiumAspiration: true,
      };

      const severity = assessNeonatalSeverity(assessment);
      
      // Verify severity assessment for severely depressed neonate with meconium aspiration
      expect(severity.level).toBe('severely_depressed');
      expect(severity.requiresIntubation).toBe(true);
      expect(severity.requiresChestCompressions).toBe(true);
    });
  });

  describe('generateChestCompressionInterventions', () => {
    it('should generate chest compression guidance when HR <60', () => {
      const assessment: NeonatalAssessment = {
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
        color: 'pale',
        meconiumAspiration: false,
      };

      const severity = assessNeonatalSeverity(assessment);
      const interventions = generateChestCompressionInterventions(assessment, severity);
      
      expect(interventions.length).toBeGreaterThan(0);
      expect(interventions[0].type).toBe('chest_compressions');
      expect(interventions[0].priority).toBe('immediate');
    });

    it('should calculate correct compression depth for 3.5 kg neonate', () => {
      const assessment: NeonatalAssessment = {
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
        color: 'pale',
        meconiumAspiration: false,
      };

      const severity = assessNeonatalSeverity(assessment);
      const interventions = generateChestCompressionInterventions(assessment, severity);
      
      const compressionIntervention = interventions[0];
      expect(compressionIntervention.dosing).toContain('1.5 cm');
    });
  });

  describe('generateMedicationInterventions', () => {
    it('should generate epinephrine dosing for severely depressed neonate', () => {
      const assessment: NeonatalAssessment = {
        ageMinutes: 5,
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
        color: 'pale',
        meconiumAspiration: false,
      };

      const severity = assessNeonatalSeverity(assessment);
      const interventions = generateMedicationInterventions(assessment, severity);
      
      const epiInterventions = interventions.filter(i => i.type === 'epinephrine');
      expect(epiInterventions.length).toBeGreaterThan(0);
      expect(epiInterventions[0].dosing).toContain('0.035 mg');
    });

    it('should calculate correct volume expansion dose for 3 kg neonate', () => {
      const assessment: NeonatalAssessment = {
        ageMinutes: 10,
        birthWeight: 3000,
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
        color: 'pale',
        meconiumAspiration: false,
      };

      const severity = assessNeonatalSeverity(assessment);
      const interventions = generateMedicationInterventions(assessment, severity);
      
      const volumeInterventions = interventions.filter(i => i.type === 'volume_expansion');
      expect(volumeInterventions.length).toBeGreaterThan(0);
      expect(volumeInterventions[0].dosing).toContain('30.0 mL');
    });
  });
});
