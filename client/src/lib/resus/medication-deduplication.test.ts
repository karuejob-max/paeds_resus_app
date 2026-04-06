/**
 * Tests for Medication Deduplication Engine
 * 
 * Validates duplicate detection logic, exceptions, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
  checkMedicationDuplicate,
  getActiveDrugs,
  getDrugHistory,
} from './medication-deduplication';
import { createSession, Intervention, Threat } from './abcdeEngine';

describe('Medication Deduplication', () => {
  describe('checkMedicationDuplicate', () => {
    it('should detect duplicate drug in progress', () => {
      const session = createSession();
      
      // Add epinephrine in progress
      const epiIntervention: Intervention = {
        id: 'epi-1',
        action: 'Give epinephrine IV',
        dose: { drug: 'Epinephrine', dosePerKg: 0.01, unit: 'mL/kg', route: 'IV' },
        status: 'in_progress',
        startedAt: Date.now(),
      };
      
      const threat: Threat = {
        id: 'shock-1',
        letter: 'C',
        name: 'Shock',
        severity: 'critical',
        interventions: [epiIntervention],
        resolved: false,
        findings: [],
      };
      
      session.threats.push(threat);
      
      // Try to add another epinephrine
      const newEpi: Intervention = {
        id: 'epi-2',
        action: 'Give epinephrine IV',
        dose: { drug: 'Epinephrine', dosePerKg: 0.01, unit: 'mL/kg', route: 'IV' },
        status: 'pending',
      };
      
      const result = checkMedicationDuplicate(newEpi, session);
      
      expect(result.isDuplicate).toBe(true);
      expect(result.severity).toBe('danger');
      expect(result.message).toContain('Epinephrine');
      expect(result.message).toContain('in progress');
    });

    it('should allow different routes of same drug', () => {
      const session = createSession();
      
      // Add diazepam IV
      const diazepamIV: Intervention = {
        id: 'diaz-1',
        action: 'Give diazepam IV',
        dose: { drug: 'Diazepam', dosePerKg: 0.1, unit: 'mg/kg', route: 'IV' },
        status: 'in_progress',
        startedAt: Date.now(),
      };
      
      const threat: Threat = {
        id: 'seizure-1',
        letter: 'D',
        name: 'Seizure',
        severity: 'critical',
        interventions: [diazepamIV],
        resolved: false,
        findings: [],
      };
      
      session.threats.push(threat);
      
      // Try to add diazepam PR (rectal) - should be allowed
      const diazepamPR: Intervention = {
        id: 'diaz-2',
        action: 'Give diazepam PR',
        dose: { drug: 'Diazepam', dosePerKg: 0.5, unit: 'mg/kg', route: 'PR' },
        status: 'pending',
      };
      
      const result = checkMedicationDuplicate(diazepamPR, session);
      
      expect(result.isDuplicate).toBe(false);
    });

    it('should allow multiple boluses', () => {
      const session = createSession();
      
      // Add first fluid bolus
      const bolus1: Intervention = {
        id: 'bolus-1',
        action: 'Give 20 mL/kg crystalloid bolus',
        dose: { drug: 'Ringer\'s Lactate', dosePerKg: 20, unit: 'mL/kg', route: 'IV' },
        status: 'completed',
        completedAt: Date.now() - 60000, // 1 minute ago
      };
      
      const threat: Threat = {
        id: 'shock-1',
        letter: 'C',
        name: 'Shock',
        severity: 'critical',
        interventions: [bolus1],
        resolved: false,
        findings: [],
      };
      
      session.threats.push(threat);
      
      // Try to add second bolus - should be allowed (shock escalation)
      const bolus2: Intervention = {
        id: 'bolus-2',
        action: 'Give 20 mL/kg crystalloid bolus',
        dose: { drug: 'Ringer\'s Lactate', dosePerKg: 20, unit: 'mL/kg', route: 'IV' },
        status: 'pending',
      };
      
      const result = checkMedicationDuplicate(bolus2, session);
      
      expect(result.isDuplicate).toBe(false);
    });

    it('should allow continuous infusion restart after 5+ minutes', () => {
      const session = createSession();
      
      // Add epinephrine infusion completed 6 minutes ago
      const epiInfusion: Intervention = {
        id: 'epi-infusion-1',
        action: 'Start epinephrine infusion',
        dose: { drug: 'Epinephrine', dosePerKg: 0.1, unit: 'mcg/kg/min', route: 'IV' },
        status: 'completed',
        completedAt: Date.now() - 6 * 60 * 1000, // 6 minutes ago
      };
      
      const threat: Threat = {
        id: 'shock-1',
        letter: 'C',
        name: 'Shock',
        severity: 'critical',
        interventions: [epiInfusion],
        resolved: false,
        findings: [],
      };
      
      session.threats.push(threat);
      
      // Try to restart epinephrine infusion - should be allowed
      const newInfusion: Intervention = {
        id: 'epi-infusion-2',
        action: 'Restart epinephrine infusion',
        dose: { drug: 'Epinephrine', dosePerKg: 0.1, unit: 'mcg/kg/min', route: 'IV' },
        status: 'pending',
      };
      
      const result = checkMedicationDuplicate(newInfusion, session);
      
      expect(result.isDuplicate).toBe(false);
    });

    it('should prevent continuous infusion restart within 5 minutes', () => {
      const session = createSession();
      
      // Add epinephrine infusion completed 2 minutes ago
      const epiInfusion: Intervention = {
        id: 'epi-infusion-1',
        action: 'Start epinephrine infusion',
        dose: { drug: 'Epinephrine', dosePerKg: 0.1, unit: 'mcg/kg/min', route: 'IV' },
        status: 'completed',
        completedAt: Date.now() - 2 * 60 * 1000, // 2 minutes ago
      };
      
      const threat: Threat = {
        id: 'shock-1',
        letter: 'C',
        name: 'Shock',
        severity: 'critical',
        interventions: [epiInfusion],
        resolved: false,
        findings: [],
      };
      
      session.threats.push(threat);
      
      // Try to restart epinephrine infusion - should be blocked
      const newInfusion: Intervention = {
        id: 'epi-infusion-2',
        action: 'Restart epinephrine infusion',
        dose: { drug: 'Epinephrine', dosePerKg: 0.1, unit: 'mcg/kg/min', route: 'IV' },
        status: 'pending',
      };
      
      const result = checkMedicationDuplicate(newInfusion, session);
      
      expect(result.isDuplicate).toBe(true);
      expect(result.severity).toBe('warning');
    });

    it('should not check duplicates for interventions without drugs', () => {
      const session = createSession();
      
      const intervention: Intervention = {
        id: 'action-1',
        action: 'Position airway',
        status: 'pending',
      };
      
      const result = checkMedicationDuplicate(intervention, session);
      
      expect(result.isDuplicate).toBe(false);
    });

    it('should allow override on duplicate detection', () => {
      const session = createSession();
      
      const epiIntervention: Intervention = {
        id: 'epi-1',
        action: 'Give epinephrine IV',
        dose: { drug: 'Epinephrine', dosePerKg: 0.01, unit: 'mL/kg', route: 'IV' },
        status: 'in_progress',
        startedAt: Date.now(),
      };
      
      const threat: Threat = {
        id: 'shock-1',
        letter: 'C',
        name: 'Shock',
        severity: 'critical',
        interventions: [epiIntervention],
        resolved: false,
        findings: [],
      };
      
      session.threats.push(threat);
      
      const newEpi: Intervention = {
        id: 'epi-2',
        action: 'Give epinephrine IV',
        dose: { drug: 'Epinephrine', dosePerKg: 0.01, unit: 'mL/kg', route: 'IV' },
        status: 'pending',
      };
      
      const result = checkMedicationDuplicate(newEpi, session);
      
      expect(result.isDuplicate).toBe(true);
      expect(result.allowOverride).toBe(true); // Provider can force if needed
    });
  });

  describe('getActiveDrugs', () => {
    it('should return list of drugs in progress', () => {
      const session = createSession();
      
      const interventions: Intervention[] = [
        {
          id: 'epi-1',
          action: 'Give epinephrine',
          dose: { drug: 'Epinephrine', dosePerKg: 0.01, unit: 'mL/kg', route: 'IV' },
          status: 'in_progress',
        },
        {
          id: 'fluid-1',
          action: 'Give fluid bolus',
          dose: { drug: 'Ringer\'s Lactate', dosePerKg: 20, unit: 'mL/kg', route: 'IV' },
          status: 'in_progress',
        },
        {
          id: 'diaz-1',
          action: 'Give diazepam',
          dose: { drug: 'Diazepam', dosePerKg: 0.1, unit: 'mg/kg', route: 'IV' },
          status: 'completed', // Completed, should not be included
        },
      ];
      
      const threat: Threat = {
        id: 'threat-1',
        letter: 'C',
        name: 'Shock',
        severity: 'critical',
        interventions,
        resolved: false,
        findings: [],
      };
      
      session.threats.push(threat);
      
      const drugs = getActiveDrugs(session);
      
      expect(drugs).toContain('Epinephrine');
      expect(drugs).toContain('Ringer\'s Lactate');
      expect(drugs).not.toContain('Diazepam'); // Completed, not active
      expect(drugs.length).toBe(2);
    });
  });

  describe('getDrugHistory', () => {
    it('should return drug history sorted by most recent', () => {
      const session = createSession();
      
      const now = Date.now();
      const interventions: Intervention[] = [
        {
          id: 'epi-1',
          action: 'Give epinephrine',
          dose: { drug: 'Epinephrine', dosePerKg: 0.01, unit: 'mL/kg', route: 'IV' },
          status: 'in_progress',
          startedAt: now - 60000, // 1 min ago
        },
        {
          id: 'fluid-1',
          action: 'Give fluid bolus',
          dose: { drug: 'Ringer\'s Lactate', dosePerKg: 20, unit: 'mL/kg', route: 'IV' },
          status: 'completed',
          completedAt: now - 120000, // 2 min ago
        },
      ];
      
      const threat: Threat = {
        id: 'threat-1',
        letter: 'C',
        name: 'Shock',
        severity: 'critical',
        interventions,
        resolved: false,
        findings: [],
      };
      
      session.threats.push(threat);
      
      const history = getDrugHistory(session);
      
      expect(history.length).toBe(2);
      expect(history[0].drug).toBe('Epinephrine'); // Most recent first
      expect(history[1].drug).toBe('Ringer\'s Lactate');
      expect(history[0].timeAgo).toContain('1 min');
      expect(history[1].timeAgo).toContain('2 min');
    });
  });
});
