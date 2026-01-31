import { describe, it, expect } from 'vitest';
import {
  calculateEpinephrineCardiacArrest,
  calculateEpinephrineAnaphylaxis,
  calculateAmiodaroneCardiacArrest,
  calculateAdenosine,
  calculateAtropine,
  calculateFluidBolus,
  calculateDextrose10,
  calculateSalbutamol,
  calculateHydrocortisone,
  calculateDiazepam,
  getDrugDose,
  getAllDrugs,
} from '../shared/drugCalculations';

describe('Drug Calculations', () => {
  describe('Epinephrine - Cardiac Arrest', () => {
    it('should calculate correct dose for 10 kg child', () => {
      const result = calculateEpinephrineCardiacArrest(10);
      expect(result.dose).toBe(0.1); // 0.01 mg/kg × 10 kg
      expect(result.volume).toBe(1); // 0.1 mg / 0.1 mg/mL
      expect(result.concentration).toBe('0.1 mg/mL (1:10,000)');
      expect(result.route).toBe('IV/IO');
    });

    it('should cap at max dose of 1 mg', () => {
      const result = calculateEpinephrineCardiacArrest(150);
      expect(result.dose).toBe(1);
      expect(result.volume).toBe(10);
    });

    it('should include reconstitution steps', () => {
      const result = calculateEpinephrineCardiacArrest(10);
      expect(result.reconstitution).toBeDefined();
      expect(result.reconstitution?.length).toBeGreaterThan(0);
    });
  });

  describe('Epinephrine - Anaphylaxis', () => {
    it('should calculate correct dose for 20 kg child', () => {
      const result = calculateEpinephrineAnaphylaxis(20);
      expect(result.dose).toBe(0.2); // 0.01 mg/kg × 20 kg
      expect(result.volume).toBe(0.2); // 0.2 mg / 1 mg/mL
      expect(result.concentration).toBe('1 mg/mL (1:1000)');
      expect(result.route).toContain('IM');
    });

    it('should cap at max dose of 0.5 mg', () => {
      const result = calculateEpinephrineAnaphylaxis(60);
      expect(result.dose).toBe(0.5);
      expect(result.volume).toBe(0.5);
    });
  });

  describe('Amiodarone - Cardiac Arrest', () => {
    it('should calculate correct dose for 15 kg child', () => {
      const result = calculateAmiodaroneCardiacArrest(15);
      expect(result.dose).toBe(75); // 5 mg/kg × 15 kg
      expect(result.volume).toBe(1.5); // 75 mg / 50 mg/mL
    });

    it('should cap at max dose of 300 mg', () => {
      const result = calculateAmiodaroneCardiacArrest(70);
      expect(result.dose).toBe(300);
      expect(result.volume).toBe(6);
    });
  });

  describe('Adenosine - SVT', () => {
    it('should calculate first dose correctly', () => {
      const result = calculateAdenosine(20, true);
      expect(result.dose).toBe(2); // 0.1 mg/kg × 20 kg
      expect(result.volume).toBeCloseTo(0.7, 1); // 2 mg / 3 mg/mL
      expect(result.maxDose).toBe('6 mg');
    });

    it('should calculate second dose correctly', () => {
      const result = calculateAdenosine(20, false);
      expect(result.dose).toBe(4); // 0.2 mg/kg × 20 kg
      expect(result.volume).toBeCloseTo(1.3, 1); // 4 mg / 3 mg/mL
      expect(result.maxDose).toBe('12 mg');
    });

    it('should cap first dose at 6 mg', () => {
      const result = calculateAdenosine(70, true);
      expect(result.dose).toBe(6);
    });

    it('should cap second dose at 12 mg', () => {
      const result = calculateAdenosine(70, false);
      expect(result.dose).toBe(12);
    });
  });

  describe('Atropine - Bradycardia', () => {
    it('should calculate correct dose for 25 kg child', () => {
      const result = calculateAtropine(25);
      expect(result.dose).toBe(0.5); // 0.02 mg/kg × 25 kg
      expect(result.volume).toBe(5); // 0.5 mg / 0.1 mg/mL
    });

    it('should enforce minimum dose of 0.1 mg', () => {
      const result = calculateAtropine(3);
      expect(result.dose).toBe(0.1);
    });

    it('should cap at max dose of 0.5 mg', () => {
      const result = calculateAtropine(30);
      expect(result.dose).toBe(0.5);
    });
  });

  describe('Fluid Bolus - Normal Saline', () => {
    it('should calculate correct volume for 10 kg child', () => {
      const result = calculateFluidBolus(10);
      expect(result.volume).toBe(200); // 20 mL/kg × 10 kg
    });

    it('should cap at max volume of 1000 mL', () => {
      const result = calculateFluidBolus(60);
      expect(result.volume).toBe(1000);
    });

    it('should include monitoring requirements', () => {
      const result = calculateFluidBolus(15);
      expect(result.monitoring).toBeDefined();
      expect(result.monitoring?.some((m) => m.includes('fluid overload'))).toBe(true);
    });
  });

  describe('Dextrose 10% - Hypoglycemia', () => {
    it('should calculate correct volume for 12 kg child', () => {
      const result = calculateDextrose10(12);
      expect(result.volume).toBe(24); // 2 mL/kg × 12 kg
    });

    it('should cap at max volume of 100 mL', () => {
      const result = calculateDextrose10(60);
      expect(result.volume).toBe(100);
    });

    it('should include reconstitution alternatives', () => {
      const result = calculateDextrose10(10);
      expect(result.reconstitution).toBeDefined();
      expect(result.reconstitution?.some((r) => r.includes('D50%'))).toBe(true);
    });
  });

  describe('Salbutamol - Bronchospasm', () => {
    it('should give 2.5 mg for child <20 kg', () => {
      const result = calculateSalbutamol(15);
      expect(result.dose).toBe(2.5);
      expect(result.volume).toBe(2.5);
    });

    it('should give 5 mg for child ≥20 kg', () => {
      const result = calculateSalbutamol(25);
      expect(result.dose).toBe(5);
      expect(result.volume).toBe(5);
    });

    it('should specify nebulized route', () => {
      const result = calculateSalbutamol(10);
      expect(result.route).toContain('Nebulized');
    });
  });

  describe('Hydrocortisone', () => {
    it('should calculate correct dose for 18 kg child', () => {
      const result = calculateHydrocortisone(18);
      expect(result.dose).toBe(72); // 4 mg/kg × 18 kg
      expect(result.volume).toBeCloseTo(1.4, 1); // 72 mg / 50 mg/mL
    });

    it('should cap at max dose of 100 mg', () => {
      const result = calculateHydrocortisone(30);
      expect(result.dose).toBe(100);
      expect(result.volume).toBe(2);
    });
  });

  describe('Diazepam - Seizures', () => {
    it('should calculate IV dose correctly', () => {
      const result = calculateDiazepam(20, 'IV');
      expect(result.dose).toBe(6); // 0.3 mg/kg × 20 kg
      expect(result.volume).toBeCloseTo(1.2, 1); // 6 mg / 5 mg/mL
      expect(result.maxDose).toBe('10 mg');
    });

    it('should calculate rectal dose correctly', () => {
      const result = calculateDiazepam(20, 'rectal');
      expect(result.dose).toBe(10); // 0.5 mg/kg × 20 kg
      expect(result.volume).toBe(2); // 10 mg / 5 mg/mL
      expect(result.maxDose).toBe('20 mg');
    });

    it('should cap IV dose at 10 mg', () => {
      const result = calculateDiazepam(40, 'IV');
      expect(result.dose).toBe(10);
    });

    it('should cap rectal dose at 20 mg', () => {
      const result = calculateDiazepam(50, 'rectal');
      expect(result.dose).toBe(20);
    });
  });

  describe('getDrugDose', () => {
    it('should return correct drug by ID', () => {
      const result = getDrugDose('PR-DC-EPI-CA-v1.0', 10);
      expect(result).toBeTruthy();
      expect(result?.drugName).toContain('Epinephrine');
      expect(result?.indication).toBe('Cardiac Arrest');
    });

    it('should handle options for adenosine', () => {
      const firstDose = getDrugDose('PR-DC-ADEN-SVT-v1.0', 20, { isFirstDose: true });
      const secondDose = getDrugDose('PR-DC-ADEN-SVT-v1.0', 20, { isFirstDose: false });

      expect(firstDose?.dose).toBe(2);
      expect(secondDose?.dose).toBe(4);
    });

    it('should handle options for diazepam', () => {
      const ivDose = getDrugDose('PR-DC-DIAZ-SEIZ-v1.0', 20, { route: 'IV' });
      const rectalDose = getDrugDose('PR-DC-DIAZ-SEIZ-v1.0', 20, { route: 'rectal' });

      expect(ivDose?.dose).toBe(6);
      expect(rectalDose?.dose).toBe(10);
    });

    it('should return null for unknown drug ID', () => {
      const result = getDrugDose('UNKNOWN-DRUG', 10);
      expect(result).toBeNull();
    });
  });

  describe('getAllDrugs', () => {
    it('should return list of all available drugs', () => {
      const drugs = getAllDrugs();
      expect(drugs.length).toBeGreaterThan(0);
      expect(drugs[0]).toHaveProperty('id');
      expect(drugs[0]).toHaveProperty('name');
      expect(drugs[0]).toHaveProperty('indications');
    });

    it('should include epinephrine for cardiac arrest', () => {
      const drugs = getAllDrugs();
      const epi = drugs.find((d) => d.id === 'PR-DC-EPI-CA-v1.0');
      expect(epi).toBeDefined();
      expect(epi?.indications).toContain('Cardiac Arrest');
    });
  });

  describe('Safety Checks', () => {
    it('should never return negative doses', () => {
      const drugs = [
        calculateEpinephrineCardiacArrest(3), // 3 kg minimum (newborn)
        calculateFluidBolus(3),
        calculateDextrose10(3),
      ];

      drugs.forEach((drug) => {
        expect(drug.dose).toBeGreaterThan(0);
        expect(drug.volume).toBeGreaterThan(0);
      });
    });

    it('should always include monitoring requirements', () => {
      const drugs = [
        calculateEpinephrineCardiacArrest(10),
        calculateFluidBolus(10),
        calculateSalbutamol(10),
      ];

      drugs.forEach((drug) => {
        expect(drug.monitoring).toBeDefined();
        expect(drug.monitoring?.length).toBeGreaterThan(0);
      });
    });

    it('should always include reassessment timer', () => {
      const drugs = [
        calculateEpinephrineCardiacArrest(10),
        calculateAdenosine(10),
        calculateAtropine(10),
      ];

      drugs.forEach((drug) => {
        expect(drug.reassessmentTimer).toBeDefined();
        expect(drug.reassessmentTimer).not.toBe('');
      });
    });
  });
});
