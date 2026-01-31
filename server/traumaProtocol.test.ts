import { describe, it, expect } from 'vitest';
import {
  calculateParklandFormula,
  calculateTXADose,
  calculateGCS,
  classifyHemorrhage,
  needsBurnResuscitation,
  meetsBurnTransferCriteria,
  calculateTraumaDrugDose,
  TRAUMA_PRIMARY_SURVEY,
  HEMORRHAGE_CLASSES,
  HEMORRHAGE_INTERVENTIONS,
} from '../shared/traumaProtocol';

describe('Trauma Protocol', () => {
  describe('Parkland Formula', () => {
    it('should calculate correct fluid for 20kg child with 30% TBSA burn', () => {
      const result = calculateParklandFormula(20, 30, 0);
      // 4 × 20 × 30 = 2400 mL total
      expect(result.totalFluid24hr).toBe(2400);
      // First half (1200 mL) over 8 hours = 150 mL/hr
      expect(result.firstHalfRate).toBe(150);
      // Second half (1200 mL) over 16 hours = 75 mL/hr
      expect(result.secondHalfRate).toBe(75);
    });

    it('should adjust rate if burn occurred hours ago', () => {
      const result = calculateParklandFormula(20, 30, 4);
      // First half (1200 mL) over remaining 4 hours = 300 mL/hr
      expect(result.firstHalfRate).toBe(300);
    });

    it('should handle edge case of burn > 8 hours ago', () => {
      const result = calculateParklandFormula(20, 30, 10);
      // First period has passed
      expect(result.firstHalfRate).toBe(0);
    });

    it('should include monitoring targets', () => {
      const result = calculateParklandFormula(20, 30, 0);
      expect(result.monitoringTargets.length).toBeGreaterThan(0);
      expect(result.fluidType).toContain('Lactated Ringer');
    });
  });

  describe('TXA Dosing', () => {
    it('should calculate correct TXA dose for 30kg child', () => {
      const result = calculateTXADose(30);
      // 15 mg/kg = 450 mg loading
      expect(result.loadingDose.mg).toBe(450);
      expect(result.loadingDose.mL).toBe(4.5);
      // 2 mg/kg/hr = 60 mg/hr
      expect(result.maintenanceRate.mgPerHour).toBe(60);
    });

    it('should cap loading dose at 1g', () => {
      const result = calculateTXADose(80);
      expect(result.loadingDose.mg).toBe(1000);
      expect(result.loadingDose.mL).toBe(10);
    });
  });

  describe('GCS Calculation', () => {
    it('should calculate total GCS correctly', () => {
      const result = calculateGCS(4, 5, 6);
      expect(result.total).toBe(15);
      expect(result.interpretation).toContain('Mild');
      expect(result.airwayNeeded).toBe(false);
    });

    it('should identify severe brain injury', () => {
      const result = calculateGCS(1, 2, 4);
      expect(result.total).toBe(7);
      expect(result.interpretation).toContain('Severe');
      expect(result.airwayNeeded).toBe(true);
    });

    it('should identify moderate brain injury', () => {
      const result = calculateGCS(3, 4, 5);
      expect(result.total).toBe(12);
      expect(result.interpretation).toContain('Moderate');
    });

    it('should require airway for GCS ≤ 8', () => {
      expect(calculateGCS(2, 2, 4).airwayNeeded).toBe(true);
      expect(calculateGCS(2, 3, 4).airwayNeeded).toBe(false);
    });
  });

  describe('Hemorrhage Classification', () => {
    it('should classify Class I hemorrhage', () => {
      const result = classifyHemorrhage(10, 90, 1.5, 'normal', 5);
      expect(result.class).toBe('I');
    });

    it('should classify Class II hemorrhage', () => {
      const result = classifyHemorrhage(35, 85, 2.5, 'confused', 5);
      expect(result.class).toBe('II');
    });

    it('should classify Class III hemorrhage', () => {
      const result = classifyHemorrhage(50, 60, 4, 'lethargic', 5);
      expect(result.class).toBe('III');
    });

    it('should classify Class IV hemorrhage', () => {
      const result = classifyHemorrhage(60, 40, 6, 'unresponsive', 5);
      expect(result.class).toBe('IV');
    });
  });

  describe('Burn Resuscitation Thresholds', () => {
    it('should require resuscitation for child < 10 with > 10% TBSA', () => {
      expect(needsBurnResuscitation(15, 5)).toBe(true);
      expect(needsBurnResuscitation(8, 5)).toBe(false);
    });

    it('should require resuscitation for child ≥ 10 with > 15% TBSA', () => {
      expect(needsBurnResuscitation(20, 12)).toBe(true);
      expect(needsBurnResuscitation(12, 12)).toBe(false);
    });
  });

  describe('Burn Transfer Criteria', () => {
    it('should recommend transfer for partial thickness > 10%', () => {
      const result = meetsBurnTransferCriteria(15, 'partial_thickness', [], false, false, 'thermal');
      expect(result.shouldTransfer).toBe(true);
      expect(result.reasons).toContain('Partial thickness burns > 10% TBSA');
    });

    it('should recommend transfer for full thickness burns', () => {
      const result = meetsBurnTransferCriteria(5, 'full_thickness', [], false, false, 'thermal');
      expect(result.shouldTransfer).toBe(true);
      expect(result.reasons).toContain('Full thickness burns present');
    });

    it('should recommend transfer for critical locations', () => {
      const result = meetsBurnTransferCriteria(5, 'partial_thickness', ['face', 'hands'], false, false, 'thermal');
      expect(result.shouldTransfer).toBe(true);
      expect(result.reasons.some((r) => r.includes('critical areas'))).toBe(true);
    });

    it('should recommend transfer for inhalation injury', () => {
      const result = meetsBurnTransferCriteria(5, 'superficial', [], true, false, 'thermal');
      expect(result.shouldTransfer).toBe(true);
      expect(result.reasons).toContain('Inhalation injury present');
    });

    it('should recommend transfer for electrical burns', () => {
      const result = meetsBurnTransferCriteria(5, 'superficial', [], false, false, 'electrical');
      expect(result.shouldTransfer).toBe(true);
      expect(result.reasons).toContain('Electrical burn mechanism');
    });

    it('should not recommend transfer for minor burns', () => {
      const result = meetsBurnTransferCriteria(5, 'superficial', ['arm'], false, false, 'thermal');
      expect(result.shouldTransfer).toBe(false);
    });
  });

  describe('Trauma Drug Dosing', () => {
    it('should calculate TXA dose correctly', () => {
      const result = calculateTraumaDrugDose('TXA', 30);
      expect(result).not.toBeNull();
      expect(result!.dose).toBe(450); // 15 mg/kg
      expect(result!.maxDose).toBe(1000);
    });

    it('should cap TXA at max dose', () => {
      const result = calculateTraumaDrugDose('TXA', 80);
      expect(result!.dose).toBe(1000);
    });

    it('should calculate morphine dose correctly', () => {
      const result = calculateTraumaDrugDose('MORPHINE', 30);
      expect(result!.dose).toBe(3); // 0.1 mg/kg
      expect(result!.maxDose).toBe(10);
    });

    it('should calculate fentanyl dose correctly', () => {
      const result = calculateTraumaDrugDose('FENTANYL', 30);
      expect(result!.dose).toBe(30); // 1 mcg/kg
      expect(result!.unit).toBe('mcg');
    });

    it('should calculate ketamine dose correctly', () => {
      const result = calculateTraumaDrugDose('KETAMINE', 30);
      expect(result!.dose).toBe(45); // 1.5 mg/kg
    });

    it('should calculate mannitol dose correctly', () => {
      const result = calculateTraumaDrugDose('MANNITOL', 30);
      expect(result!.dose).toBe(15); // 0.5 g/kg
      expect(result!.unit).toBe('g');
    });

    it('should return null for unknown drug', () => {
      const result = calculateTraumaDrugDose('UNKNOWN', 30);
      expect(result).toBeNull();
    });
  });

  describe('Primary Survey Structure', () => {
    it('should have all 5 ABCDE steps', () => {
      expect(TRAUMA_PRIMARY_SURVEY.length).toBe(5);
      expect(TRAUMA_PRIMARY_SURVEY.map((s) => s.letter)).toEqual(['A', 'B', 'C', 'D', 'E']);
    });

    it('should have C-spine consideration in Airway step', () => {
      const airwayStep = TRAUMA_PRIMARY_SURVEY.find((s) => s.letter === 'A');
      expect(airwayStep?.cSpineConsideration).toBeDefined();
      expect(airwayStep?.cSpineConsideration).toContain('in-line stabilization');
    });

    it('should have assessments and interventions for each step', () => {
      for (const step of TRAUMA_PRIMARY_SURVEY) {
        expect(step.assessments.length).toBeGreaterThan(0);
        expect(step.immediateInterventions.length).toBeGreaterThan(0);
        expect(step.criticalFindings.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Hemorrhage Interventions', () => {
    it('should have all hemorrhage control methods', () => {
      const interventionIds = HEMORRHAGE_INTERVENTIONS.map((i) => i.id);
      expect(interventionIds).toContain('DIRECT-PRESSURE');
      expect(interventionIds).toContain('TOURNIQUET');
      expect(interventionIds).toContain('PELVIC-BINDER');
    });

    it('should have technique steps for each intervention', () => {
      for (const intervention of HEMORRHAGE_INTERVENTIONS) {
        expect(intervention.technique.length).toBeGreaterThan(0);
        expect(intervention.warnings.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Hemorrhage Classes', () => {
    it('should have all 4 hemorrhage classes', () => {
      expect(HEMORRHAGE_CLASSES.length).toBe(4);
      expect(HEMORRHAGE_CLASSES.map((c) => c.class)).toEqual(['I', 'II', 'III', 'IV']);
    });

    it('should have increasing blood loss percentages', () => {
      expect(HEMORRHAGE_CLASSES[0].bloodLossPercent).toContain('< 15%');
      expect(HEMORRHAGE_CLASSES[3].bloodLossPercent).toContain('> 40%');
    });
  });
});
