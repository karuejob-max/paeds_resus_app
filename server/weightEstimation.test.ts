import { describe, it, expect } from 'vitest';
import {
  getBroselowZone,
  estimateWeightByLength,
  estimateWeightByAgeAPLS,
  estimateWeightByAgeLuscombe,
  estimateWeightByMUAC,
  getBestWeightEstimate,
  getAllWeightEstimates,
  validateWeightForAge,
  BROSELOW_ZONES,
} from '../shared/weightEstimation';

describe('Weight Estimation', () => {
  describe('Broselow Tape', () => {
    it('should return correct zone for valid length', () => {
      const zone = getBroselowZone(70);
      expect(zone).toBeTruthy();
      expect(zone?.color).toBe('Purple');
      expect(zone?.weight).toBe(7);
    });

    it('should return null for length below minimum', () => {
      const zone = getBroselowZone(40);
      expect(zone).toBeNull();
    });

    it('should return null for length above maximum', () => {
      const zone = getBroselowZone(150);
      expect(zone).toBeNull();
    });

    it('should estimate weight correctly for each Broselow zone', () => {
      const testCases = [
        { length: 50, expectedColor: 'Grey', expectedWeight: 3 },
        { length: 58, expectedColor: 'Pink', expectedWeight: 4 },
        { length: 65, expectedColor: 'Red', expectedWeight: 5 },
        { length: 72, expectedColor: 'Purple', expectedWeight: 7 },
        { length: 80, expectedColor: 'Yellow', expectedWeight: 9 },
        { length: 90, expectedColor: 'White', expectedWeight: 11 },
        { length: 100, expectedColor: 'Blue', expectedWeight: 14 },
        { length: 115, expectedColor: 'Orange', expectedWeight: 18 },
        { length: 130, expectedColor: 'Green', expectedWeight: 24 },
      ];

      testCases.forEach(({ length, expectedColor, expectedWeight }) => {
        const estimate = estimateWeightByLength(length);
        expect(estimate).toBeTruthy();
        expect(estimate?.weight).toBe(expectedWeight);
        expect(estimate?.method).toBe('broselow');
        expect(estimate?.confidence).toBe('high');
        expect(estimate?.source).toContain(expectedColor);
      });
    });

    it('should include equipment sizing in Broselow zones', () => {
      const zone = getBroselowZone(100);
      expect(zone?.ettSize).toBe(5.5);
      expect(zone?.ettDepth).toBe(16.5);
      expect(zone?.defibDose).toBe(28);
      expect(zone?.epiDose).toBe(0.14);
      expect(zone?.fluidBolus).toBe(280);
    });
  });

  describe('APLS Age-Based Formula', () => {
    it('should estimate weight for infants <1 year', () => {
      const estimate = estimateWeightByAgeAPLS(0, 6);
      expect(estimate).toBeTruthy();
      expect(estimate?.weight).toBeCloseTo(7.7, 1);
      expect(estimate?.method).toBe('age-apls');
      expect(estimate?.confidence).toBe('medium');
    });

    it('should estimate weight for children 1-10 years using (age + 4) × 2', () => {
      const testCases = [
        { age: 2, expected: 12 }, // (2 + 4) × 2 = 12
        { age: 5, expected: 18 }, // (5 + 4) × 2 = 18
        { age: 10, expected: 28 }, // (10 + 4) × 2 = 28
      ];

      testCases.forEach(({ age, expected }) => {
        const estimate = estimateWeightByAgeAPLS(age);
        expect(estimate?.weight).toBe(expected);
      });
    });

    it('should estimate weight for adolescents >10 years using age × 3', () => {
      const estimate = estimateWeightByAgeAPLS(12);
      expect(estimate?.weight).toBe(36);
      expect(estimate?.confidence).toBe('low');
    });

    it('should return null for age >14 years', () => {
      const estimate = estimateWeightByAgeAPLS(15);
      expect(estimate).toBeNull();
    });
  });

  describe('Luscombe-Owens Formula', () => {
    it('should estimate weight for children 1-10 years using 3 × age + 7', () => {
      const testCases = [
        { age: 2, expected: 13 }, // 3 × 2 + 7 = 13
        { age: 5, expected: 22 }, // 3 × 5 + 7 = 22
        { age: 10, expected: 37 }, // 3 × 10 + 7 = 37
      ];

      testCases.forEach(({ age, expected }) => {
        const estimate = estimateWeightByAgeLuscombe(age);
        expect(estimate?.weight).toBe(expected);
      });
    });

    it('should handle fractional ages', () => {
      const estimate = estimateWeightByAgeLuscombe(2, 6); // 2.5 years
      expect(estimate?.weight).toBeCloseTo(14.5, 1);
    });
  });

  describe('MUAC-Based Estimation', () => {
    it('should estimate weight using MUAC formula', () => {
      const estimate = estimateWeightByMUAC(15, 100); // 15 cm MUAC, 100 cm length
      expect(estimate.weight).toBe(22.5); // (15^2 × 100) / 1000 = 22.5
      expect(estimate.method).toBe('muac');
    });

    it('should flag low confidence for severe malnutrition (MUAC <11.5)', () => {
      const estimate = estimateWeightByMUAC(10, 80);
      expect(estimate.confidence).toBe('low');
    });

    it('should have medium confidence for normal MUAC', () => {
      const estimate = estimateWeightByMUAC(15, 100);
      expect(estimate.confidence).toBe('medium');
    });
  });

  describe('Best Weight Estimate Selection', () => {
    it('should prioritize actual weight', () => {
      const estimate = getBestWeightEstimate({
        actualWeight: 15,
        lengthCm: 100,
        ageYears: 5,
      });
      expect(estimate.weight).toBe(15);
      expect(estimate.method).toBe('actual');
      expect(estimate.confidence).toBe('high');
    });

    it('should use Broselow if no actual weight', () => {
      const estimate = getBestWeightEstimate({
        lengthCm: 100,
        ageYears: 5,
      });
      expect(estimate.method).toBe('broselow');
      expect(estimate.weight).toBe(14);
    });

    it('should use age-based if no length', () => {
      const estimate = getBestWeightEstimate({
        ageYears: 5,
      });
      expect(estimate.method).toBe('age-apls');
      expect(estimate.weight).toBe(18);
    });

    it('should use Broselow when length is provided (even with MUAC)', () => {
      const estimate = getBestWeightEstimate({
        muacCm: 15,
        lengthCm: 100,
      });
      // Broselow has priority over MUAC because it's more accurate
      expect(estimate.method).toBe('broselow');
      expect(estimate.weight).toBe(14);
    });

    it('should use MUAC when length is outside Broselow range', () => {
      const estimate = getBestWeightEstimate({
        muacCm: 15,
        lengthCm: 150, // Outside Broselow range
      });
      expect(estimate.method).toBe('muac');
    });

    it('should use parent estimate as last resort', () => {
      const estimate = getBestWeightEstimate({
        parentEstimate: 12,
      });
      expect(estimate.weight).toBe(12);
      expect(estimate.method).toBe('parent-estimate');
      expect(estimate.confidence).toBe('low');
    });

    it('should provide default if no data', () => {
      const estimate = getBestWeightEstimate({});
      expect(estimate.weight).toBe(10);
      expect(estimate.confidence).toBe('low');
    });
  });

  describe('Get All Weight Estimates', () => {
    it('should return multiple estimates for comparison', () => {
      const estimates = getAllWeightEstimates({
        lengthCm: 100,
        ageYears: 5,
        ageMonths: 0,
      });

      expect(estimates.length).toBeGreaterThan(1);
      expect(estimates.some((e) => e.method === 'broselow')).toBe(true);
      expect(estimates.some((e) => e.method === 'age-apls')).toBe(true);
      expect(estimates.some((e) => e.method === 'age-luscombe')).toBe(true);
    });

    it('should include MUAC if provided', () => {
      const estimates = getAllWeightEstimates({
        lengthCm: 100,
        ageYears: 5,
        muacCm: 15,
      });

      expect(estimates.some((e) => e.method === 'muac')).toBe(true);
    });
  });

  describe('Weight Validation for Age', () => {
    it('should validate normal weight for age', () => {
      const result = validateWeightForAge(10, 2);
      expect(result.valid).toBe(true);
      expect(result.warning).toBeUndefined();
    });

    it('should warn if weight too low for age', () => {
      const result = validateWeightForAge(5, 5);
      expect(result.valid).toBe(false);
      expect(result.warning).toContain('unusually low');
    });

    it('should warn if weight too high for age', () => {
      const result = validateWeightForAge(60, 5);
      expect(result.valid).toBe(false);
      expect(result.warning).toContain('unusually high');
    });

    it('should validate infant weights', () => {
      const result = validateWeightForAge(8, 0, 6);
      expect(result.valid).toBe(true);
    });

    it('should validate adolescent weights', () => {
      const result = validateWeightForAge(50, 13);
      expect(result.valid).toBe(true);
    });
  });

  describe('Broselow Zone Coverage', () => {
    it('should have 9 zones', () => {
      expect(BROSELOW_ZONES.length).toBe(9);
    });

    it('should have continuous length coverage', () => {
      for (let i = 0; i < BROSELOW_ZONES.length - 1; i++) {
        const currentMax = BROSELOW_ZONES[i].lengthMax;
        const nextMin = BROSELOW_ZONES[i + 1].lengthMin;
        expect(nextMin).toBe(currentMax + 1);
      }
    });

    it('should have increasing weights', () => {
      for (let i = 0; i < BROSELOW_ZONES.length - 1; i++) {
        expect(BROSELOW_ZONES[i + 1].weight).toBeGreaterThan(BROSELOW_ZONES[i].weight);
      }
    });
  });
});
