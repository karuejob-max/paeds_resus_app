import { describe, it, expect } from 'vitest';
import {
  validateAirwayPhase,
  validateBreathingPhase,
  validateCirculationPhase,
  validateDisabilityPhase,
  validateExposurePhase,
  getPhaseValidation,
} from './phaseValidation';

const createEmptyAssessment = () => ({
  responsiveness: null,
  airwayPatency: null,
  auscultationFindings: [],
  breathingAdequate: null,
  respiratoryRate: null,
  spO2: null,
  breathingAuscultation: [],
  pulsePresent: null,
  heartRate: null,
  systolicBP: null,
  pulseCharacter: null,
  skinPerfusion: null,
  capillaryRefill: null,
  circulationAuscultation: [],
  consciousness: null,
  pupils: null,
  glucose: null,
  seizureActivity: null,
  temperature: null,
  rash: null,
  rashType: null,
});

describe('Phase Validation System', () => {
  describe('Airway Phase Validation', () => {
    it('should fail when responsiveness is not assessed', () => {
      const assessment = createEmptyAssessment();
      const result = validateAirwayPhase(assessment);
      
      expect(result.isComplete).toBe(false);
      expect(result.canAdvance).toBe(false);
      expect(result.errors).toContain('Responsiveness must be assessed (AVPU)');
    });

    it('should fail when airway patency is not assessed', () => {
      const assessment = createEmptyAssessment();
      assessment.responsiveness = 'alert';
      const result = validateAirwayPhase(assessment);
      
      expect(result.isComplete).toBe(false);
      expect(result.canAdvance).toBe(false);
      expect(result.errors).toContain('Airway patency must be assessed');
    });

    it('should detect unresponsive child as critical finding', () => {
      const assessment = createEmptyAssessment();
      assessment.responsiveness = 'unresponsive';
      assessment.airwayPatency = 'patent';
      const result = validateAirwayPhase(assessment);
      
      expect(result.isComplete).toBe(true);
      expect(result.canAdvance).toBe(false);
      expect(result.criticalFindingsUnresolved).toContain('Child is unresponsive - airway protection required');
    });

    it('should detect obstructed airway as critical finding', () => {
      const assessment = createEmptyAssessment();
      assessment.responsiveness = 'alert';
      assessment.airwayPatency = 'obstructed';
      const result = validateAirwayPhase(assessment);
      
      expect(result.isComplete).toBe(true);
      expect(result.canAdvance).toBe(false);
      expect(result.criticalFindingsUnresolved).toContain('Airway is obstructed - immediate intervention required');
    });

    it('should allow advancement when airway is patent and child is alert', () => {
      const assessment = createEmptyAssessment();
      assessment.responsiveness = 'alert';
      assessment.airwayPatency = 'patent';
      const result = validateAirwayPhase(assessment);
      
      expect(result.isComplete).toBe(true);
      expect(result.canAdvance).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.criticalFindingsUnresolved.length).toBe(0);
    });
  });

  describe('Breathing Phase Validation', () => {
    it('should fail when breathing adequacy is not assessed', () => {
      const assessment = createEmptyAssessment();
      assessment.respiratoryRate = 25;
      assessment.spO2 = 95;
      const result = validateBreathingPhase(assessment);
      
      expect(result.isComplete).toBe(false);
      expect(result.canAdvance).toBe(false);
      expect(result.errors).toContain('Breathing adequacy must be assessed');
    });

    it('should detect inadequate breathing as critical finding', () => {
      const assessment = createEmptyAssessment();
      assessment.breathingAdequate = false;
      assessment.respiratoryRate = 10;
      assessment.spO2 = 95;
      const result = validateBreathingPhase(assessment);
      
      expect(result.isComplete).toBe(true);
      expect(result.canAdvance).toBe(false);
      expect(result.criticalFindingsUnresolved).toContain('Breathing is inadequate - high-flow oxygen and airway assessment required');
    });

    it('should detect low SpO2 as critical finding', () => {
      const assessment = createEmptyAssessment();
      assessment.breathingAdequate = true;
      assessment.respiratoryRate = 25;
      assessment.spO2 = 85;
      const result = validateBreathingPhase(assessment);
      
      expect(result.isComplete).toBe(true);
      expect(result.canAdvance).toBe(false);
      expect(result.criticalFindingsUnresolved.some((f) => f.includes('SpO2 critically low'))).toBe(true);
    });

    it('should allow advancement with adequate breathing and normal SpO2', () => {
      const assessment = createEmptyAssessment();
      assessment.breathingAdequate = true;
      assessment.respiratoryRate = 25;
      assessment.spO2 = 97;
      const result = validateBreathingPhase(assessment);
      
      expect(result.isComplete).toBe(true);
      expect(result.canAdvance).toBe(true);
    });
  });

  describe('Circulation Phase Validation', () => {
    it('should fail when pulse is not assessed', () => {
      const assessment = createEmptyAssessment();
      assessment.heartRate = 100;
      assessment.systolicBP = 95;
      assessment.skinPerfusion = 'warm';
      assessment.capillaryRefill = 1;
      const result = validateCirculationPhase(assessment);
      
      expect(result.isComplete).toBe(false);
      expect(result.errors).toContain('Pulse presence must be assessed');
    });

    it('should detect no pulse as critical finding', () => {
      const assessment = createEmptyAssessment();
      assessment.pulsePresent = false;
      assessment.heartRate = 0;
      assessment.systolicBP = 0;
      assessment.skinPerfusion = 'cold';
      assessment.capillaryRefill = 3;
      const result = validateCirculationPhase(assessment);
      
      expect(result.isComplete).toBe(true);
      expect(result.canAdvance).toBe(false);
      expect(result.criticalFindingsUnresolved).toContain('NO PULSE DETECTED - START CPR IMMEDIATELY');
    });

    it('should detect shock from cold extremities', () => {
      const assessment = createEmptyAssessment();
      assessment.pulsePresent = true;
      assessment.heartRate = 140;
      assessment.systolicBP = 70;
      assessment.skinPerfusion = 'cold';
      assessment.capillaryRefill = 3;
      const result = validateCirculationPhase(assessment);
      
      expect(result.isComplete).toBe(true);
      expect(result.canAdvance).toBe(false);
      expect(result.criticalFindingsUnresolved.some((f) => f.includes('shock'))).toBe(true);
    });

    it('should allow advancement with normal perfusion', () => {
      const assessment = createEmptyAssessment();
      assessment.pulsePresent = true;
      assessment.heartRate = 100;
      assessment.systolicBP = 100;
      assessment.skinPerfusion = 'warm';
      assessment.capillaryRefill = 1;
      const result = validateCirculationPhase(assessment);
      
      expect(result.isComplete).toBe(true);
      expect(result.canAdvance).toBe(true);
    });
  });

  describe('Disability Phase Validation', () => {
    it('should fail when consciousness is not assessed', () => {
      const assessment = createEmptyAssessment();
      assessment.pupils = 'normal';
      assessment.glucose = 100;
      assessment.seizureActivity = false;
      const result = validateDisabilityPhase(assessment);
      
      expect(result.isComplete).toBe(false);
      expect(result.errors).toContain('Consciousness level must be assessed (AVPU)');
    });

    it('should detect hypoglycemia as critical finding', () => {
      const assessment = createEmptyAssessment();
      assessment.consciousness = 'alert';
      assessment.pupils = 'normal';
      assessment.glucose = 60;
      assessment.seizureActivity = false;
      const result = validateDisabilityPhase(assessment);
      
      expect(result.isComplete).toBe(true);
      expect(result.canAdvance).toBe(false);
      expect(result.criticalFindingsUnresolved.some((f) => f.includes('Hypoglycemia'))).toBe(true);
    });

    it('should detect active seizure as critical finding', () => {
      const assessment = createEmptyAssessment();
      assessment.consciousness = 'pain';
      assessment.pupils = 'normal';
      assessment.glucose = 100;
      assessment.seizureActivity = true;
      const result = validateDisabilityPhase(assessment);
      
      expect(result.isComplete).toBe(true);
      expect(result.canAdvance).toBe(false);
      expect(result.criticalFindingsUnresolved).toContain('Active seizure detected - give benzodiazepine and secure airway');
    });

    it('should allow advancement with normal disability assessment', () => {
      const assessment = createEmptyAssessment();
      assessment.consciousness = 'alert';
      assessment.pupils = 'normal';
      assessment.glucose = 100;
      assessment.seizureActivity = false;
      const result = validateDisabilityPhase(assessment);
      
      expect(result.isComplete).toBe(true);
      expect(result.canAdvance).toBe(true);
    });
  });

  describe('Exposure Phase Validation', () => {
    it('should fail when temperature is not recorded', () => {
      const assessment = createEmptyAssessment();
      assessment.rash = false;
      const result = validateExposurePhase(assessment);
      
      expect(result.isComplete).toBe(false);
      expect(result.errors).toContain('Temperature must be recorded');
    });

    it('should detect fever as critical finding', () => {
      const assessment = createEmptyAssessment();
      assessment.temperature = 39;
      assessment.rash = false;
      const result = validateExposurePhase(assessment);
      
      expect(result.isComplete).toBe(true);
      expect(result.canAdvance).toBe(false);
      expect(result.criticalFindingsUnresolved.some((f) => f.includes('High fever'))).toBe(true);
    });

    it('should detect rash and require description', () => {
      const assessment = createEmptyAssessment();
      assessment.temperature = 37;
      assessment.rash = true;
      assessment.rashType = null;
      const result = validateExposurePhase(assessment);
      
      expect(result.isComplete).toBe(false);
      expect(result.errors).toContain('Rash type must be described');
    });

    it('should allow advancement with normal exposure assessment', () => {
      const assessment = createEmptyAssessment();
      assessment.temperature = 37;
      assessment.rash = false;
      const result = validateExposurePhase(assessment);
      
      expect(result.isComplete).toBe(true);
      expect(result.canAdvance).toBe(true);
    });
  });

  describe('getPhaseValidation function', () => {
    it('should return correct validation for each phase', () => {
      const assessment = createEmptyAssessment();
      
      const airwayResult = getPhaseValidation('airway', assessment);
      expect(airwayResult.isComplete).toBe(false);
      
      const breathingResult = getPhaseValidation('breathing', assessment);
      expect(breathingResult.isComplete).toBe(false);
      
      const circulationResult = getPhaseValidation('circulation', assessment);
      expect(circulationResult.isComplete).toBe(false);
      
      const disabilityResult = getPhaseValidation('disability', assessment);
      expect(disabilityResult.isComplete).toBe(false);
      
      const exposureResult = getPhaseValidation('exposure', assessment);
      expect(exposureResult.isComplete).toBe(false);
    });
  });
});
