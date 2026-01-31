import { describe, it, expect } from 'vitest';
import {
  validateNeonatalWeight,
  checkNRPDrugSafety,
  checkNRPContraindications,
  validateETTSize,
  validateETTDepth,
  validateHeartRateIntervention,
  checkPretermSafety,
} from '../shared/nrpSafetyGuardrails';

describe('NRP Safety Guardrails', () => {
  describe('Weight Validation', () => {
    it('should block weight below viable limit', () => {
      const result = validateNeonatalWeight(0.2, 24);
      expect(result.level).toBe('blocked');
      expect(result.message).toContain('below viable limit');
    });

    it('should block weight above neonatal range', () => {
      const result = validateNeonatalWeight(7, 40);
      expect(result.level).toBe('blocked');
      expect(result.message).toContain('exceeds neonatal range');
    });

    it('should warn for weight below expected for GA', () => {
      const result = validateNeonatalWeight(0.5, 32);
      expect(result.level).toBe('warning');
      expect(result.message).toContain('below expected minimum');
    });

    it('should warn for weight above expected for GA', () => {
      const result = validateNeonatalWeight(4.5, 32);
      expect(result.level).toBe('warning');
      expect(result.message).toContain('exceeds expected maximum');
    });

    it('should accept normal weight for term infant', () => {
      const result = validateNeonatalWeight(3.5, 40);
      expect(result.level).toBe('safe');
    });

    it('should accept normal weight for preterm infant', () => {
      const result = validateNeonatalWeight(1.0, 28);
      expect(result.level).toBe('safe');
    });
  });

  describe('Drug Safety Checks', () => {
    it('should block dose exceeding max per kg', () => {
      const result = checkNRPDrugSafety('NRP-EPI-IV-v1.0', 3, 0.15); // 0.05 mg/kg > 0.03 max
      expect(result.level).toBe('blocked');
      expect(result.message).toContain('exceeds maximum');
    });

    it('should warn when max doses reached', () => {
      const previousDoses = [
        { time: new Date(Date.now() - 600000), dose: 0.03 },
        { time: new Date(Date.now() - 480000), dose: 0.03 },
        { time: new Date(Date.now() - 360000), dose: 0.03 },
        { time: new Date(Date.now() - 240000), dose: 0.03 },
        { time: new Date(Date.now() - 180000), dose: 0.03 },
      ];
      const result = checkNRPDrugSafety('NRP-EPI-IV-v1.0', 3, 0.03, previousDoses);
      expect(result.level).toBe('warning');
      expect(result.message).toContain('Maximum doses');
    });

    it('should warn when dose interval too short', () => {
      const previousDoses = [
        { time: new Date(Date.now() - 60000), dose: 0.03 }, // 1 minute ago
      ];
      const result = checkNRPDrugSafety('NRP-EPI-IV-v1.0', 3, 0.03, previousDoses);
      expect(result.level).toBe('warning');
      expect(result.message).toContain('Too soon');
    });

    it('should allow safe dose with proper interval', () => {
      const previousDoses = [
        { time: new Date(Date.now() - 300000), dose: 0.03 }, // 5 minutes ago
      ];
      const result = checkNRPDrugSafety('NRP-EPI-IV-v1.0', 3, 0.03, previousDoses);
      expect(result.level).toBe('caution'); // Has warnings but dose is safe
    });

    it('should return caution for unknown drug', () => {
      const result = checkNRPDrugSafety('UNKNOWN-DRUG', 3, 1);
      expect(result.level).toBe('caution');
      expect(result.message).toContain('No safety rules');
    });
  });

  describe('Contraindication Checks', () => {
    it('should block naloxone for opioid-dependent mother', () => {
      const result = checkNRPContraindications('NRP-NALOX-v1.0', ['Mother is opioid-dependent']);
      expect(result.level).toBe('blocked');
      expect(result.message).toContain('Contraindicated');
    });

    it('should allow drug without matching contraindications', () => {
      const result = checkNRPContraindications('NRP-EPI-IV-v1.0', ['prematurity']);
      expect(result.level).toBe('safe');
    });

    it('should block bicarb for inadequate ventilation', () => {
      const result = checkNRPContraindications('NRP-BICARB-v1.0', ['inadequate ventilation']);
      expect(result.level).toBe('blocked');
    });
  });

  describe('ETT Size Validation', () => {
    it('should accept correct size for weight', () => {
      expect(validateETTSize(0.8, 2.5).level).toBe('safe');
      expect(validateETTSize(1.5, 3.0).level).toBe('safe');
      expect(validateETTSize(2.5, 3.5).level).toBe('safe');
    });

    it('should warn for oversized ETT', () => {
      const result = validateETTSize(0.8, 3.5);
      expect(result.level).toBe('warning');
      expect(result.message).toContain('too large');
    });

    it('should warn for undersized ETT', () => {
      const result = validateETTSize(3.5, 2.5);
      expect(result.level).toBe('warning');
      expect(result.message).toContain('too small');
    });
  });

  describe('ETT Depth Validation', () => {
    it('should accept correct depth for weight', () => {
      // 6 + weight = expected depth
      expect(validateETTDepth(1, 7).level).toBe('safe');
      expect(validateETTDepth(2, 8).level).toBe('safe');
      expect(validateETTDepth(3, 9).level).toBe('safe');
    });

    it('should warn for too shallow depth', () => {
      const result = validateETTDepth(3, 7);
      expect(result.level).toBe('warning');
      expect(result.message).toContain('too shallow');
    });

    it('should warn for too deep depth', () => {
      const result = validateETTDepth(2, 10);
      expect(result.level).toBe('warning');
      expect(result.message).toContain('too deep');
    });
  });

  describe('Heart Rate Intervention Validation', () => {
    it('should indicate safe for HR >= 100', () => {
      const result = validateHeartRateIntervention(120, 'none');
      expect(result.level).toBe('safe');
    });

    it('should warn to start PPV for HR 60-99 with no intervention', () => {
      const result = validateHeartRateIntervention(80, 'none');
      expect(result.level).toBe('warning');
      expect(result.recommendation).toContain('Start PPV');
    });

    it('should block and recommend compressions for HR < 60 on PPV', () => {
      const result = validateHeartRateIntervention(50, 'ppv');
      expect(result.level).toBe('blocked');
      expect(result.recommendation).toContain('CHEST COMPRESSIONS');
    });

    it('should recommend epinephrine for HR < 60 on compressions', () => {
      const result = validateHeartRateIntervention(40, 'compressions');
      expect(result.level).toBe('warning');
      expect(result.recommendation).toContain('EPINEPHRINE');
    });

    it('should suggest stopping compressions when HR improves', () => {
      const result = validateHeartRateIntervention(110, 'compressions');
      expect(result.level).toBe('caution');
      expect(result.recommendation).toContain('stopping compressions');
    });
  });

  describe('Preterm Safety Checks', () => {
    it('should warn about oxygen for extremely preterm', () => {
      const result = checkPretermSafety(25, 'oxygen');
      expect(result.level).toBe('caution');
      expect(result.message).toContain('hyperoxia');
    });

    it('should warn about fluid bolus for very preterm', () => {
      const result = checkPretermSafety(28, 'fluid_bolus');
      expect(result.level).toBe('caution');
      expect(result.message).toContain('IVH');
    });

    it('should warn about chlorhexidine for extremely preterm', () => {
      const result = checkPretermSafety(26, 'chlorhexidine');
      expect(result.level).toBe('caution');
      expect(result.recommendation).toContain('povidone-iodine');
    });

    it('should suggest surfactant for preterm', () => {
      const result = checkPretermSafety(30, 'surfactant');
      expect(result.level).toBe('caution');
      expect(result.message).toContain('surfactant');
    });

    it('should return safe for term infant', () => {
      const result = checkPretermSafety(40, 'oxygen');
      expect(result.level).toBe('safe');
    });
  });
});
