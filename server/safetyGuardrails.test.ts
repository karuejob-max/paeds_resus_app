import { describe, it, expect } from 'vitest';
import {
  checkDrugSafety,
  checkFluidBolusCount,
  checkEpinephrineInterval,
  checkDefibrillationEnergy,
  type PatientState,
} from '../shared/safetyGuardrails';

describe('Safety Guardrails', () => {
  const basePatient: PatientState = {
    age: 5,
    weight: 20,
    allergies: [],
    currentMedications: [],
    conditions: [],
  };

  describe('Allergy Checks', () => {
    it('should block drug if patient has allergy', () => {
      const patient: PatientState = {
        ...basePatient,
        allergies: ['penicillin', 'amiodarone'],
      };

      const result = checkDrugSafety('PR-DC-AMIO-CA-v1.0', patient);
      expect(result.allowed).toBe(false);
      expect(result.severity).toBe('hard-block');
      expect(result.message).toContain('ALLERGY ALERT');
    });

    it('should allow epinephrine in anaphylaxis even with epinephrine allergy', () => {
      const patient: PatientState = {
        ...basePatient,
        allergies: ['epinephrine'],
      };

      const result = checkDrugSafety('PR-DC-EPI-ANA-v1.0', patient);
      expect(result.allowed).toBe(true);
      expect(result.severity).toBe('warning');
      expect(result.rationale).toContain('life-saving');
    });

    it('should pass if no allergies match', () => {
      const patient: PatientState = {
        ...basePatient,
        allergies: ['penicillin', 'latex'],
      };

      const result = checkDrugSafety('PR-DC-EPI-CA-v1.0', patient);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Contraindication Checks', () => {
    it('should block adenosine if patient has AV block', () => {
      const patient: PatientState = {
        ...basePatient,
        conditions: ['2nd-degree AV block'],
      };

      const result = checkDrugSafety('PR-DC-ADEN-SVT-v1.0', patient);
      expect(result.allowed).toBe(false);
      expect(result.severity).toBe('hard-block');
      expect(result.message).toContain('AV block');
    });

    it('should block fluid bolus if patient has heart failure', () => {
      const patient: PatientState = {
        ...basePatient,
        conditions: ['heart failure'],
      };

      const result = checkDrugSafety('PR-DC-NS-BOLUS-v1.0', patient);
      expect(result.allowed).toBe(false);
      expect(result.severity).toBe('hard-block');
      expect(result.message).toContain('fluid overload');
    });

    it('should warn about atropine in hypothermia', () => {
      const patient: PatientState = {
        ...basePatient,
        vitalSigns: {
          temperature: 34,
        },
      };

      const result = checkDrugSafety('PR-DC-ATRO-BRADY-v1.0', patient);
      expect(result.allowed).toBe(true);
      expect(result.severity).toBe('warning');
      expect(result.message).toContain('hypothermic');
    });

    it('should warn about diazepam with respiratory depression', () => {
      const patient: PatientState = {
        ...basePatient,
        vitalSigns: {
          respiratoryRate: 8,
        },
      };

      const result = checkDrugSafety('PR-DC-DIAZ-SEIZ-v1.0', patient);
      expect(result.allowed).toBe(true);
      expect(result.severity).toBe('warning');
      expect(result.message).toContain('respiratory depression');
    });
  });

  describe('Drug Interaction Checks', () => {
    it('should warn about amiodarone + other antiarrhythmics', () => {
      const patient: PatientState = {
        ...basePatient,
        currentMedications: ['procainamide'],
      };

      const result = checkDrugSafety('PR-DC-AMIO-CA-v1.0', patient);
      expect(result.allowed).toBe(true);
      expect(result.severity).toBe('warning');
      expect(result.message).toContain('INTERACTION');
    });

    it('should warn about adenosine + theophylline', () => {
      const patient: PatientState = {
        ...basePatient,
        currentMedications: ['theophylline'],
      };

      const result = checkDrugSafety('PR-DC-ADEN-SVT-v1.0', patient);
      expect(result.allowed).toBe(true);
      expect(result.severity).toBe('warning');
      expect(result.message).toContain('theophylline');
    });

    it('should pass if no interactions', () => {
      const patient: PatientState = {
        ...basePatient,
        currentMedications: ['acetaminophen'],
      };

      const result = checkDrugSafety('PR-DC-EPI-CA-v1.0', patient);
      expect(result.allowed).toBe(true);
      expect(result.severity).toBe('safe');
    });
  });

  describe('Age Appropriateness Checks', () => {
    it('should warn about drugs in neonates', () => {
      const patient: PatientState = {
        ...basePatient,
        age: 0.05, // ~2 weeks old
      };

      const result = checkDrugSafety('PR-DC-AMIO-CA-v1.0', patient);
      expect(result.allowed).toBe(true);
      expect(result.severity).toBe('warning');
      expect(result.message).toContain('Neonate');
    });

    it('should pass for appropriate age', () => {
      const patient: PatientState = {
        ...basePatient,
        age: 5,
      };

      const result = checkDrugSafety('PR-DC-EPI-CA-v1.0', patient);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Dose Limit Checks', () => {
    it('should caution for high weight patients', () => {
      const patient: PatientState = {
        ...basePatient,
        weight: 110, // Exceeds 100 kg limit for epinephrine
      };

      const result = checkDrugSafety('PR-DC-EPI-CA-v1.0', patient);
      expect(result.allowed).toBe(true);
      expect(result.severity).toBe('caution');
      expect(result.message).toContain('exceeds typical pediatric range');
    });

    it('should pass for normal weight', () => {
      const patient: PatientState = {
        ...basePatient,
        weight: 20,
      };

      const result = checkDrugSafety('PR-DC-EPI-CA-v1.0', patient);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Fluid Bolus Count Checks', () => {
    it('should block 3rd fluid bolus', () => {
      const result = checkFluidBolusCount(3, basePatient);
      expect(result.allowed).toBe(false);
      expect(result.severity).toBe('hard-block');
      expect(result.message).toContain('3 fluid boluses');
    });

    it('should warn on 2nd fluid bolus', () => {
      const result = checkFluidBolusCount(2, basePatient);
      expect(result.allowed).toBe(true);
      expect(result.severity).toBe('warning');
      expect(result.message).toContain('2 fluid boluses');
    });

    it('should allow 1st fluid bolus', () => {
      const result = checkFluidBolusCount(1, basePatient);
      expect(result.allowed).toBe(true);
      expect(result.severity).toBe('safe');
    });
  });

  describe('Epinephrine Interval Checks', () => {
    it('should block if less than 3 minutes since last dose', () => {
      const lastDoseTime = Date.now() - 2 * 60 * 1000; // 2 minutes ago
      const result = checkEpinephrineInterval(lastDoseTime);
      expect(result.allowed).toBe(false);
      expect(result.severity).toBe('hard-block');
      expect(result.message).toContain('2 minutes');
    });

    it('should caution if more than 5 minutes since last dose', () => {
      const lastDoseTime = Date.now() - 6 * 60 * 1000; // 6 minutes ago
      const result = checkEpinephrineInterval(lastDoseTime);
      expect(result.allowed).toBe(true);
      expect(result.severity).toBe('caution');
      expect(result.message).toContain('6 minutes');
    });

    it('should allow if 3-5 minutes since last dose', () => {
      const lastDoseTime = Date.now() - 4 * 60 * 1000; // 4 minutes ago
      const result = checkEpinephrineInterval(lastDoseTime);
      expect(result.allowed).toBe(true);
      expect(result.severity).toBe('safe');
    });
  });

  describe('Defibrillation Energy Checks', () => {
    it('should block if energy exceeds absolute max', () => {
      const result = checkDefibrillationEnergy(250, 20);
      expect(result.allowed).toBe(false);
      expect(result.severity).toBe('hard-block');
      expect(result.message).toContain('exceeds maximum');
    });

    it('should block if energy exceeds 4 J/kg', () => {
      const result = checkDefibrillationEnergy(100, 20); // 5 J/kg
      expect(result.allowed).toBe(false);
      expect(result.severity).toBe('hard-block');
      expect(result.message).toContain('exceeds');
    });

    it('should warn if energy is too low', () => {
      const result = checkDefibrillationEnergy(10, 20); // 0.5 J/kg (recommended is 2 J/kg = 40 J)
      expect(result.allowed).toBe(true);
      expect(result.severity).toBe('warning');
      expect(result.message).toContain('low');
    });

    it('should allow appropriate energy', () => {
      const result = checkDefibrillationEnergy(40, 20); // 2 J/kg
      expect(result.allowed).toBe(true);
      expect(result.severity).toBe('safe');
    });
  });

  describe('Override Mechanism', () => {
    it('should provide override option for warnings', () => {
      const patient: PatientState = {
        ...basePatient,
        currentMedications: ['theophylline'],
      };

      const result = checkDrugSafety('PR-DC-ADEN-SVT-v1.0', patient);
      expect(result.override).toBeDefined();
      expect(result.override?.allowed).toBe(true);
      expect(result.override?.requiresJustification).toBe(true);
    });

    it('should not provide override for hard blocks', () => {
      const patient: PatientState = {
        ...basePatient,
        allergies: ['amiodarone'],
      };

      const result = checkDrugSafety('PR-DC-AMIO-CA-v1.0', patient);
      expect(result.override).toBeUndefined();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple safety issues', () => {
      const patient: PatientState = {
        age: 0.05, // Neonate
        weight: 3,
        allergies: ['iodine'],
        currentMedications: ['procainamide'],
        conditions: [],
      };

      const result = checkDrugSafety('PR-DC-AMIO-CA-v1.0', patient);
      // Should catch allergy first (most severe)
      expect(result.allowed).toBe(false);
      expect(result.severity).toBe('hard-block');
    });

    it('should pass completely safe scenario', () => {
      const patient: PatientState = {
        age: 5,
        weight: 20,
        allergies: [],
        currentMedications: [],
        conditions: [],
      };

      const result = checkDrugSafety('PR-DC-EPI-CA-v1.0', patient);
      expect(result.allowed).toBe(true);
      expect(result.severity).toBe('safe');
    });
  });
});
