import { describe, it, expect } from 'vitest';
import {
  NRP_DRUGS,
  calculateNRPDrugDose,
  getNRPDrugsByIndication,
  getLMICAvailableDrugs,
  estimateNeonatalWeight,
  getETTSize,
  getTargetSpO2,
} from '../shared/nrpDrugCompendium';

describe('NRP Drug Compendium', () => {
  describe('Drug Database', () => {
    it('should have all essential NRP drugs', () => {
      const drugIds = NRP_DRUGS.map((d) => d.id);
      expect(drugIds).toContain('NRP-EPI-IV-v1.0');
      expect(drugIds).toContain('NRP-EPI-ETT-v1.0');
      expect(drugIds).toContain('NRP-NS-VOLUME-v1.0');
      expect(drugIds).toContain('NRP-D10-HYPO-v1.0');
      expect(drugIds).toContain('NRP-SURF-v1.0');
    });

    it('should have correct epinephrine IV/UVC concentration', () => {
      const epiIV = NRP_DRUGS.find((d) => d.id === 'NRP-EPI-IV-v1.0');
      expect(epiIV?.concentration).toBe('1:10,000 (0.1 mg/mL)');
    });

    it('should have higher ETT epinephrine dose than IV', () => {
      const epiIV = NRP_DRUGS.find((d) => d.id === 'NRP-EPI-IV-v1.0');
      const epiETT = NRP_DRUGS.find((d) => d.id === 'NRP-EPI-ETT-v1.0');
      expect(epiETT!.dosePerKg).toBeGreaterThan(epiIV!.dosePerKg);
    });
  });

  describe('Epinephrine Calculations', () => {
    it('should calculate correct IV epinephrine dose for 3 kg neonate', () => {
      const result = calculateNRPDrugDose('NRP-EPI-IV-v1.0', 3);
      expect(result).not.toBeNull();
      // Max dose is 0.03 mg, so 3 kg × 0.02 mg/kg = 0.06 mg is capped to 0.03 mg
      expect(result!.calculatedDose).toBeCloseTo(0.03, 3);
      expect(result!.calculatedVolume).toBeCloseTo(0.3, 2);
    });

    it('should calculate correct ETT epinephrine dose for 3 kg neonate', () => {
      const result = calculateNRPDrugDose('NRP-EPI-ETT-v1.0', 3);
      expect(result).not.toBeNull();
      expect(result!.calculatedDose).toBeCloseTo(0.1, 2); // Capped at max 0.1 mg
    });

    it('should calculate correct dose for preterm 1 kg neonate', () => {
      const result = calculateNRPDrugDose('NRP-EPI-IV-v1.0', 1);
      expect(result).not.toBeNull();
      expect(result!.calculatedDose).toBeCloseTo(0.02, 3); // 0.02 mg/kg × 1 kg
      expect(result!.calculatedVolume).toBeCloseTo(0.2, 2); // 0.2 mL/kg × 1 kg
    });

    it('should apply minimum dose for very small neonates', () => {
      const result = calculateNRPDrugDose('NRP-EPI-IV-v1.0', 0.5);
      expect(result).not.toBeNull();
      // 0.02 × 0.5 = 0.01 which equals minDose, so should be 0.01
      expect(result!.calculatedDose).toBeGreaterThanOrEqual(0.01);
    });
  });

  describe('Volume Expansion Calculations', () => {
    it('should calculate correct NS bolus for 3 kg neonate', () => {
      const result = calculateNRPDrugDose('NRP-NS-VOLUME-v1.0', 3);
      expect(result).not.toBeNull();
      // Max dose is 10 mL, so capped at 10 mL regardless of weight
      expect(result!.calculatedVolume).toBe(10);
    });

    it('should calculate correct NS bolus for 1 kg preterm', () => {
      const result = calculateNRPDrugDose('NRP-NS-VOLUME-v1.0', 1);
      expect(result).not.toBeNull();
      expect(result!.calculatedVolume).toBe(10); // 10 mL/kg × 1 kg
    });
  });

  describe('Dextrose Calculations', () => {
    it('should calculate correct D10 dose for 3 kg neonate', () => {
      const result = calculateNRPDrugDose('NRP-D10-HYPO-v1.0', 3);
      expect(result).not.toBeNull();
      // Max dose is 5 mL, so 3 kg × 2 mL/kg = 6 mL is capped to 5 mL
      expect(result!.calculatedVolume).toBe(5);
    });

    it('should apply max dose limit for larger neonates', () => {
      const result = calculateNRPDrugDose('NRP-D10-HYPO-v1.0', 4);
      expect(result).not.toBeNull();
      // Max is 5 mL, so 4 kg × 2 mL/kg = 8 mL should be capped
      expect(result!.calculatedDose).toBeLessThanOrEqual(5);
    });
  });

  describe('Drug Filtering', () => {
    it('should find drugs by indication', () => {
      const heartRateDrugs = getNRPDrugsByIndication('heart rate');
      expect(heartRateDrugs.length).toBeGreaterThan(0);
      expect(heartRateDrugs.some((d) => d.id.includes('EPI'))).toBe(true);
    });

    it('should find hypoglycemia drugs', () => {
      const hypoDrugs = getNRPDrugsByIndication('hypoglycemia');
      expect(hypoDrugs.length).toBeGreaterThan(0);
      expect(hypoDrugs.some((d) => d.id.includes('D10'))).toBe(true);
    });

    it('should return LMIC available drugs', () => {
      const lmicDrugs = getLMICAvailableDrugs();
      expect(lmicDrugs.length).toBeGreaterThan(0);
      // Epinephrine should be high availability
      expect(lmicDrugs.some((d) => d.id.includes('EPI'))).toBe(true);
      // Surfactant should NOT be in high availability
      expect(lmicDrugs.some((d) => d.id.includes('SURF'))).toBe(false);
    });
  });

  describe('Weight Estimation', () => {
    it('should estimate weight for term neonate (40 weeks)', () => {
      const weight = estimateNeonatalWeight(40);
      expect(weight).toBeCloseTo(3.5, 1);
    });

    it('should estimate weight for preterm neonate (28 weeks)', () => {
      const weight = estimateNeonatalWeight(28);
      expect(weight).toBeCloseTo(1.0, 1);
    });

    it('should estimate weight for very preterm neonate (24 weeks)', () => {
      const weight = estimateNeonatalWeight(24);
      expect(weight).toBeCloseTo(0.6, 1);
    });

    it('should handle extreme gestational ages', () => {
      expect(estimateNeonatalWeight(22)).toBe(0.5);
      expect(estimateNeonatalWeight(44)).toBe(3.8);
    });
  });

  describe('ETT Size Recommendations', () => {
    it('should recommend 2.5 ETT for <1 kg neonate', () => {
      const { size, depth } = getETTSize(0.8);
      expect(size).toBe(2.5);
      expect(depth).toBeCloseTo(6.8, 1);
    });

    it('should recommend 3.0 ETT for 1-2 kg neonate', () => {
      const { size, depth } = getETTSize(1.5);
      expect(size).toBe(3.0);
      expect(depth).toBeCloseTo(7.5, 1);
    });

    it('should recommend 3.5 ETT for 2-3 kg neonate', () => {
      const { size, depth } = getETTSize(2.5);
      expect(size).toBe(3.5);
      expect(depth).toBeCloseTo(8.5, 1);
    });

    it('should recommend 3.5 ETT for >3 kg neonate', () => {
      const { size, depth } = getETTSize(3.5);
      expect(size).toBe(3.5);
      expect(depth).toBeCloseTo(9.5, 1);
    });
  });

  describe('Target SpO2 by Time', () => {
    it('should return correct targets for 1 minute', () => {
      const target = getTargetSpO2(1);
      expect(target.min).toBe(60);
      expect(target.max).toBe(65);
    });

    it('should return correct targets for 3 minutes', () => {
      const target = getTargetSpO2(3);
      expect(target.min).toBe(70);
      expect(target.max).toBe(75);
    });

    it('should return correct targets for 5 minutes', () => {
      const target = getTargetSpO2(5);
      expect(target.min).toBe(80);
      expect(target.max).toBe(85);
    });

    it('should return correct targets for 10 minutes', () => {
      const target = getTargetSpO2(10);
      expect(target.min).toBe(85);
      expect(target.max).toBe(95);
    });
  });

  describe('Administration Instructions', () => {
    it('should include flush instructions for IV epinephrine', () => {
      const result = calculateNRPDrugDose('NRP-EPI-IV-v1.0', 3);
      expect(result).not.toBeNull();
      expect(result!.administrationInstructions.some((i) => i.includes('Flush'))).toBe(true);
    });

    it('should include route in instructions', () => {
      const result = calculateNRPDrugDose('NRP-EPI-IV-v1.0', 3);
      expect(result).not.toBeNull();
      expect(result!.administrationInstructions.some((i) => i.includes('UVC'))).toBe(true);
    });
  });

  describe('Safety Warnings', () => {
    it('should have warnings for epinephrine', () => {
      const epiIV = NRP_DRUGS.find((d) => d.id === 'NRP-EPI-IV-v1.0');
      expect(epiIV?.warnings.length).toBeGreaterThan(0);
      expect(epiIV?.warnings.some((w) => w.includes('1:10,000'))).toBe(true);
    });

    it('should have warnings for sodium bicarbonate', () => {
      const bicarb = NRP_DRUGS.find((d) => d.id === 'NRP-BICARB-v1.0');
      expect(bicarb?.warnings.length).toBeGreaterThan(0);
      expect(bicarb?.warnings.some((w) => w.includes('NOT recommended'))).toBe(true);
    });

    it('should have monitoring requirements for all drugs', () => {
      NRP_DRUGS.forEach((drug) => {
        expect(drug.monitoring.length).toBeGreaterThan(0);
      });
    });
  });
});
