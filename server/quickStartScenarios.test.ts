import { describe, it, expect } from 'vitest';
import {
  QUICK_START_SCENARIOS,
  getScenarioById,
  getScenarioDrugDose,
  getScenariosByUrgency,
} from '../shared/quickStartScenarios';

describe('Quick Start Scenarios', () => {
  describe('QUICK_START_SCENARIOS', () => {
    it('should have 8 emergency scenarios', () => {
      expect(QUICK_START_SCENARIOS).toHaveLength(8);
    });

    it('should have all required scenario IDs', () => {
      const ids = QUICK_START_SCENARIOS.map((s) => s.id);
      expect(ids).toContain('cardiac_arrest');
      expect(ids).toContain('anaphylaxis');
      expect(ids).toContain('status_epilepticus');
      expect(ids).toContain('septic_shock');
      expect(ids).toContain('respiratory_failure');
      expect(ids).toContain('dka');
      expect(ids).toContain('trauma');
      expect(ids).toContain('neonatal');
    });

    it('should have valid routes for all scenarios', () => {
      QUICK_START_SCENARIOS.forEach((scenario) => {
        expect(scenario.route).toBeDefined();
        expect(scenario.route.startsWith('/')).toBe(true);
      });
    });

    it('should have immediate actions for all scenarios', () => {
      QUICK_START_SCENARIOS.forEach((scenario) => {
        expect(scenario.immediateActions).toBeDefined();
        expect(scenario.immediateActions.length).toBeGreaterThan(0);
      });
    });

    it('should have key drugs for all scenarios', () => {
      QUICK_START_SCENARIOS.forEach((scenario) => {
        expect(scenario.keyDrugs).toBeDefined();
        expect(scenario.keyDrugs.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getScenarioById', () => {
    it('should return cardiac arrest scenario', () => {
      const scenario = getScenarioById('cardiac_arrest');
      expect(scenario).toBeDefined();
      expect(scenario?.name).toBe('Cardiac Arrest');
      expect(scenario?.color).toBe('red');
    });

    it('should return anaphylaxis scenario', () => {
      const scenario = getScenarioById('anaphylaxis');
      expect(scenario).toBeDefined();
      expect(scenario?.name).toBe('Anaphylaxis');
    });

    it('should return undefined for invalid ID', () => {
      const scenario = getScenarioById('invalid' as any);
      expect(scenario).toBeUndefined();
    });
  });

  describe('getScenarioDrugDose', () => {
    it('should calculate epinephrine dose for cardiac arrest', () => {
      const result = getScenarioDrugDose('cardiac_arrest', 'epinephrine', 10);
      expect(result).toBeDefined();
      expect(result?.calculated).toContain('0.1'); // 0.01 mg/kg * 10 kg
    });

    it('should calculate epinephrine IM dose for anaphylaxis', () => {
      const result = getScenarioDrugDose('anaphylaxis', 'epinephrine im', 20);
      expect(result).toBeDefined();
      expect(result?.calculated).toContain('0.2'); // 0.01 mg/kg * 20 kg
    });

    it('should respect max dose limits', () => {
      const result = getScenarioDrugDose('anaphylaxis', 'epinephrine im', 100);
      expect(result).toBeDefined();
      expect(result?.calculated).toContain('0.5'); // max 0.5 mg
    });

    it('should calculate midazolam dose for status epilepticus', () => {
      const result = getScenarioDrugDose('status_epilepticus', 'midazolam', 15);
      expect(result).toBeDefined();
      expect(result?.calculated).toContain('3.0'); // 0.2 mg/kg * 15 kg
    });

    it('should return null for invalid scenario', () => {
      const result = getScenarioDrugDose('invalid' as any, 'epinephrine', 10);
      expect(result).toBeNull();
    });

    it('should return null for invalid drug', () => {
      const result = getScenarioDrugDose('cardiac_arrest', 'invalid_drug', 10);
      expect(result).toBeNull();
    });
  });

  describe('getScenariosByUrgency', () => {
    it('should categorize scenarios by urgency', () => {
      const { critical, urgent, specialized } = getScenariosByUrgency();
      
      expect(critical.length).toBeGreaterThan(0);
      expect(urgent.length).toBeGreaterThan(0);
      expect(specialized.length).toBeGreaterThan(0);
    });

    it('should have cardiac arrest and anaphylaxis as critical', () => {
      const { critical } = getScenariosByUrgency();
      const criticalIds = critical.map((s) => s.id);
      
      expect(criticalIds).toContain('cardiac_arrest');
      expect(criticalIds).toContain('anaphylaxis');
    });

    it('should have trauma and neonatal as specialized', () => {
      const { specialized } = getScenariosByUrgency();
      const specializedIds = specialized.map((s) => s.id);
      
      expect(specializedIds).toContain('trauma');
      expect(specializedIds).toContain('neonatal');
    });
  });

  describe('Scenario Content Validation', () => {
    it('cardiac arrest should have CPR instructions', () => {
      const scenario = getScenarioById('cardiac_arrest');
      expect(scenario?.immediateActions.some((a) => a.toLowerCase().includes('cpr'))).toBe(true);
    });

    it('anaphylaxis should have epinephrine as first drug', () => {
      const scenario = getScenarioById('anaphylaxis');
      expect(scenario?.keyDrugs[0].name.toLowerCase()).toContain('epinephrine');
    });

    it('status epilepticus should have benzodiazepine instructions', () => {
      const scenario = getScenarioById('status_epilepticus');
      expect(scenario?.immediateActions.some((a) => a.toLowerCase().includes('benzodiazepine'))).toBe(true);
    });

    it('septic shock should have antibiotic instructions', () => {
      const scenario = getScenarioById('septic_shock');
      expect(scenario?.immediateActions.some((a) => a.toLowerCase().includes('antibiotic'))).toBe(true);
    });

    it('trauma should have c-spine instructions', () => {
      const scenario = getScenarioById('trauma');
      expect(scenario?.immediateActions.some((a) => a.toLowerCase().includes('c-spine') || a.toLowerCase().includes('spine'))).toBe(true);
    });

    it('neonatal should have PPV instructions', () => {
      const scenario = getScenarioById('neonatal');
      expect(scenario?.immediateActions.some((a) => a.toLowerCase().includes('ppv'))).toBe(true);
    });
  });

  describe('Critical Time Windows', () => {
    it('should have critical time windows for time-sensitive scenarios', () => {
      const timeSensitiveScenarios = ['cardiac_arrest', 'anaphylaxis', 'status_epilepticus', 'septic_shock'];
      
      timeSensitiveScenarios.forEach((id) => {
        const scenario = getScenarioById(id as any);
        expect(scenario?.criticalTimeWindow).toBeDefined();
      });
    });
  });
});
