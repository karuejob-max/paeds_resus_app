import { describe, it, expect } from 'vitest';
import {
  createSession,
  transition,
  getCurrentStep,
  getCurrentSteps,
  getTriageQuestion,
  calculateDose,
} from './stateMachine';
import { pathwayRegistry } from './pathways';
import { estimateWeightFromAge, parseAge } from './weightEstimation';

// Helper: run a sequence of inputs through the state machine
function runSequence(inputs: { type: string; value: string }[], weight?: number, age?: string) {
  let session = createSession(weight, age);
  for (const input of inputs) {
    session = transition(session, input, pathwayRegistry);
  }
  return session;
}

describe('ResusGPS State Machine', () => {
  // ─── SCENARIO 1: Cardiac Arrest (No Breathing) ──────────
  describe('Scenario 1: Cardiac Arrest - Not Breathing', () => {
    it('should reach INTERVENE with cardiac_arrest pathway in 1 answer', () => {
      const session = runSequence([
        { type: 'breathing', value: 'no' },
      ]);
      expect(session.state).toBe('INTERVENE');
      expect(session.pathwayId).toBe('cardiac_arrest');
    });

    it('should have CPR-related first step', () => {
      const session = runSequence([
        { type: 'breathing', value: 'no' },
      ]);
      const step = getCurrentStep(session, pathwayRegistry);
      expect(step).not.toBeNull();
      expect(step!.action.toLowerCase()).toMatch(/airway|breath|rescue|cpr/);
      expect(step!.critical).toBe(true);
    });
  });

  // ─── SCENARIO 2: Cardiac Arrest (No Pulse) ──────────────
  describe('Scenario 2: Cardiac Arrest - No Pulse', () => {
    it('should reach INTERVENE with cardiac_arrest pathway in 2 answers', () => {
      const session = runSequence([
        { type: 'breathing', value: 'yes' },
        { type: 'pulse', value: 'no' },
      ]);
      expect(session.state).toBe('INTERVENE');
      expect(session.pathwayId).toBe('cardiac_arrest');
    });

    it('should have CPR-related first step', () => {
      const session = runSequence([
        { type: 'breathing', value: 'yes' },
        { type: 'pulse', value: 'no' },
      ]);
      const step = getCurrentStep(session, pathwayRegistry);
      expect(step).not.toBeNull();
      expect(step!.action.toLowerCase()).toMatch(/cpr|compress|chest/);
    });
  });

  // ─── SCENARIO 3: Severe Asthma (Bronchospasm) ──────────
  describe('Scenario 3: Severe Asthma - Wheezing', () => {
    it('should reach breathing pathway and ask clarifying questions', () => {
      const session = runSequence([
        { type: 'breathing', value: 'yes' },
        { type: 'pulse', value: 'yes' },
        { type: 'consciousness', value: 'alert' },
        { type: 'pathway', value: 'breathing' },
      ]);
      expect(session.state).toBe('CLARIFY');
      expect(session.pathwayId).toBe('breathing');
    });

    it('should reach INTERVENE with bronchospasm sub-pathway after clarifying', () => {
      const session = runSequence([
        { type: 'breathing', value: 'yes' },
        { type: 'pulse', value: 'yes' },
        { type: 'consciousness', value: 'alert' },
        { type: 'pathway', value: 'breathing' },
        { type: 'wheezing', value: 'yes' },
        { type: 'stridor', value: 'no' },
      ]);
      expect(session.state).toBe('INTERVENE');
      expect(session.subPathwayId).toBe('bronchospasm');
    });

    it('should have oxygen as first intervention for bronchospasm', () => {
      const session = runSequence([
        { type: 'breathing', value: 'yes' },
        { type: 'pulse', value: 'yes' },
        { type: 'consciousness', value: 'alert' },
        { type: 'pathway', value: 'breathing' },
        { type: 'wheezing', value: 'yes' },
        { type: 'stridor', value: 'no' },
      ], 15); // 15kg child
      const step = getCurrentStep(session, pathwayRegistry);
      expect(step).not.toBeNull();
      expect(step!.action.toLowerCase()).toMatch(/oxygen/);
      expect(step!.critical).toBe(true);
    });
  });

  // ─── SCENARIO 4: Septic Shock ──────────────────────────
  describe('Scenario 4: Septic Shock', () => {
    it('should reach shock pathway and ask clarifying questions', () => {
      const session = runSequence([
        { type: 'breathing', value: 'yes' },
        { type: 'pulse', value: 'yes' },
        { type: 'consciousness', value: 'voice' },
        { type: 'pathway', value: 'shock' },
      ]);
      expect(session.state).toBe('CLARIFY');
      expect(session.pathwayId).toBe('shock');
    });

    it('should reach INTERVENE with septic_shock sub-pathway when fever present', () => {
      const session = runSequence([
        { type: 'breathing', value: 'yes' },
        { type: 'pulse', value: 'yes' },
        { type: 'consciousness', value: 'voice' },
        { type: 'pathway', value: 'shock' },
        { type: 'fever', value: 'yes' },
        { type: 'bleeding', value: 'no' },
      ]);
      expect(session.state).toBe('INTERVENE');
      expect(session.subPathwayId).toBe('septic_shock');
    });

    it('should have oxygen as first intervention for septic shock', () => {
      const session = runSequence([
        { type: 'breathing', value: 'yes' },
        { type: 'pulse', value: 'yes' },
        { type: 'consciousness', value: 'voice' },
        { type: 'pathway', value: 'shock' },
        { type: 'fever', value: 'yes' },
        { type: 'bleeding', value: 'no' },
      ], 20);
      const step = getCurrentStep(session, pathwayRegistry);
      expect(step).not.toBeNull();
      expect(step!.action.toLowerCase()).toMatch(/oxygen/);
      expect(step!.critical).toBe(true);
    });
  });

  // ─── SCENARIO 5: DKA ──────────────────────────────────
  describe('Scenario 5: DKA', () => {
    it('should reach metabolic pathway and ask for glucose', () => {
      const session = runSequence([
        { type: 'breathing', value: 'yes' },
        { type: 'pulse', value: 'yes' },
        { type: 'consciousness', value: 'alert' },
        { type: 'pathway', value: 'metabolic' },
      ]);
      expect(session.state).toBe('CLARIFY');
      expect(session.pathwayId).toBe('metabolic');
    });

    it('should reach INTERVENE with DKA sub-pathway when glucose high', () => {
      const session = runSequence([
        { type: 'breathing', value: 'yes' },
        { type: 'pulse', value: 'yes' },
        { type: 'consciousness', value: 'alert' },
        { type: 'pathway', value: 'metabolic' },
        { type: 'glucose_level', value: 'high' },
      ]);
      expect(session.state).toBe('INTERVENE');
      expect(session.subPathwayId).toBe('dka');
    });
  });

  // ─── SCENARIO 6: Anaphylaxis ──────────────────────────
  describe('Scenario 6: Anaphylaxis', () => {
    it('should go directly to INTERVENE (no clarifying questions)', () => {
      const session = runSequence([
        { type: 'breathing', value: 'yes' },
        { type: 'pulse', value: 'yes' },
        { type: 'consciousness', value: 'alert' },
        { type: 'pathway', value: 'allergic' },
      ]);
      expect(session.state).toBe('INTERVENE');
      expect(session.pathwayId).toBe('allergic');
    });

    it('should have epinephrine as first intervention', () => {
      const session = runSequence([
        { type: 'breathing', value: 'yes' },
        { type: 'pulse', value: 'yes' },
        { type: 'consciousness', value: 'alert' },
        { type: 'pathway', value: 'allergic' },
      ], 25);
      const step = getCurrentStep(session, pathwayRegistry);
      expect(step).not.toBeNull();
      expect(step!.dose?.drug.toLowerCase()).toMatch(/epinephrine|adrenaline/);
      expect(step!.critical).toBe(true);
    });
  });

  // ─── SCENARIO 7: Status Epilepticus ────────────────────
  describe('Scenario 7: Status Epilepticus', () => {
    it('should reach seizure pathway and ask if actively seizing', () => {
      const session = runSequence([
        { type: 'breathing', value: 'yes' },
        { type: 'pulse', value: 'yes' },
        { type: 'consciousness', value: 'unresponsive' },
        { type: 'pathway', value: 'seizure' },
      ]);
      expect(session.state).toBe('CLARIFY');
      expect(session.pathwayId).toBe('seizure');
    });

    it('should reach INTERVENE with active_seizure sub-pathway', () => {
      const session = runSequence([
        { type: 'breathing', value: 'yes' },
        { type: 'pulse', value: 'yes' },
        { type: 'consciousness', value: 'unresponsive' },
        { type: 'pathway', value: 'seizure' },
        { type: 'actively_seizing', value: 'yes' },
      ]);
      expect(session.state).toBe('INTERVENE');
      expect(session.subPathwayId).toBe('active_seizure');
    });

    it('should have protect patient as first intervention for seizure', () => {
      const session = runSequence([
        { type: 'breathing', value: 'yes' },
        { type: 'pulse', value: 'yes' },
        { type: 'consciousness', value: 'unresponsive' },
        { type: 'pathway', value: 'seizure' },
        { type: 'actively_seizing', value: 'yes' },
      ], 20);
      const step = getCurrentStep(session, pathwayRegistry);
      expect(step).not.toBeNull();
      expect(step!.action.toLowerCase()).toMatch(/protect/);
      expect(step!.critical).toBe(true);
    });
  });

  // ─── STEP PROGRESSION ──────────────────────────────────
  describe('Step Progression', () => {
    it('should advance to next step when step_done dispatched', () => {
      let session = runSequence([
        { type: 'breathing', value: 'yes' },
        { type: 'pulse', value: 'yes' },
        { type: 'consciousness', value: 'alert' },
        { type: 'pathway', value: 'allergic' },
      ], 25);
      
      const step1 = getCurrentStep(session, pathwayRegistry);
      expect(step1).not.toBeNull();
      
      session = transition(session, { type: 'step_done', value: step1!.id }, pathwayRegistry);
      
      // Should either be on next step (INTERVENE) or REASSESS
      expect(['INTERVENE', 'REASSESS']).toContain(session.state);
      expect(session.completedSteps).toContain(step1!.id);
    });

    it('should reach STABILIZED after completing all steps', () => {
      let session = runSequence([
        { type: 'breathing', value: 'yes' },
        { type: 'pulse', value: 'yes' },
        { type: 'consciousness', value: 'alert' },
        { type: 'pathway', value: 'allergic' },
      ], 25);
      
      const steps = getCurrentSteps(session, pathwayRegistry);
      
      // Complete all steps
      for (const step of steps) {
        if (session.state === 'REASSESS') {
          session = transition(session, { type: 'improving', value: 'yes' }, pathwayRegistry);
        }
        if (session.state === 'INTERVENE') {
          session = transition(session, { type: 'step_done', value: step.id }, pathwayRegistry);
        }
      }
      
      expect(session.state).toBe('STABILIZED');
    });
  });

  // ─── REASSESS FLOW ─────────────────────────────────────
  describe('Reassess Flow', () => {
    it('should escalate when not improving', () => {
      let session = runSequence([
        { type: 'breathing', value: 'yes' },
        { type: 'pulse', value: 'yes' },
        { type: 'consciousness', value: 'alert' },
        { type: 'pathway', value: 'breathing' },
        { type: 'wheezing', value: 'yes' },
        { type: 'stridor', value: 'no' },
      ], 15);
      
      const step1 = getCurrentStep(session, pathwayRegistry);
      session = transition(session, { type: 'step_done', value: step1!.id }, pathwayRegistry);
      
      if (session.state === 'REASSESS') {
        session = transition(session, { type: 'improving', value: 'no' }, pathwayRegistry);
        expect(session.state).toBe('INTERVENE');
        // Should be on next (escalated) step
        expect(session.currentStepIndex).toBeGreaterThan(0);
      }
    });
  });

  // ─── QUICK LAUNCH ──────────────────────────────────────
  describe('Quick Launch (Skip Triage)', () => {
    it('should allow direct pathway selection from IDENTIFY state', () => {
      const session = createSession(20, '5 years');
      session.state = 'IDENTIFY';
      const next = transition(session, { type: 'pathway', value: 'cardiac_arrest' }, pathwayRegistry);
      
      expect(next.pathwayId).toBe('cardiac_arrest');
      // Should be INTERVENE or CLARIFY depending on pathway
      expect(['INTERVENE', 'CLARIFY']).toContain(next.state);
    });
  });
});

// ─── WEIGHT ESTIMATION ───────────────────────────────────
describe('Weight Estimation', () => {
  it('should estimate neonate weight', () => {
    expect(estimateWeightFromAge('1 day')).toBeCloseTo(3.5, 0);
  });

  it('should estimate infant weight (6 months)', () => {
    const w = estimateWeightFromAge('6 months');
    expect(w).not.toBeNull();
    expect(w!).toBeGreaterThan(5);
    expect(w!).toBeLessThan(10);
  });

  it('should estimate toddler weight (3 years)', () => {
    const w = estimateWeightFromAge('3 years');
    expect(w).not.toBeNull();
    expect(w!).toBeGreaterThan(12);
    expect(w!).toBeLessThan(18);
  });

  it('should estimate school-age weight (8 years)', () => {
    const w = estimateWeightFromAge('8 years');
    expect(w).not.toBeNull();
    expect(w!).toBeGreaterThan(20);
    expect(w!).toBeLessThan(35);
  });

  it('should parse various age formats', () => {
    expect(parseAge('3 years')).not.toBeNull();
    expect(parseAge('6 months')).not.toBeNull();
    expect(parseAge('3y')).not.toBeNull();
    expect(parseAge('6m')).not.toBeNull();
    expect(parseAge('2 weeks')).not.toBeNull();
    expect(parseAge('5')).not.toBeNull(); // bare number = years
  });
});

// ─── DOSE CALCULATION ────────────────────────────────────
describe('Dose Calculation', () => {
  it('should calculate weight-based dose', () => {
    const result = calculateDose({
      drug: 'Epinephrine',
      dosePerKg: 0.01,
      unit: 'mg',
      maxDose: 0.5,
      route: 'IM',
    }, 25);
    expect(result.calculatedDose).toContain('0.3'); // 0.01 * 25 = 0.25, rounded
  });

  it('should cap at max dose', () => {
    const result = calculateDose({
      drug: 'Epinephrine',
      dosePerKg: 0.01,
      unit: 'mg',
      maxDose: 0.5,
      route: 'IM',
    }, 100);
    expect(result.calculatedDose).toContain('0.5'); // capped at max
  });

  it('should show per-kg dose when no weight', () => {
    const result = calculateDose({
      drug: 'Epinephrine',
      dosePerKg: 0.01,
      unit: 'mg',
      route: 'IM',
    }, null);
    expect(result.calculatedDose).toContain('/kg');
  });
});

// ─── PATHWAY REGISTRY ────────────────────────────────────
describe('Pathway Registry', () => {
  it('should have all 8 pathways registered', () => {
    expect(pathwayRegistry.size).toBe(8);
    expect(pathwayRegistry.has('cardiac_arrest')).toBe(true);
    expect(pathwayRegistry.has('breathing')).toBe(true);
    expect(pathwayRegistry.has('shock')).toBe(true);
    expect(pathwayRegistry.has('seizure')).toBe(true);
    expect(pathwayRegistry.has('allergic')).toBe(true);
    expect(pathwayRegistry.has('metabolic')).toBe(true);
    expect(pathwayRegistry.has('trauma')).toBe(true);
    expect(pathwayRegistry.has('newborn')).toBe(true);
  });

  it('every pathway should have at least one sub-pathway or default steps', () => {
    for (const [id, pathway] of pathwayRegistry) {
      const hasSteps = pathway.subPathways.length > 0 || pathway.defaultSteps.length > 0;
      expect(hasSteps).toBe(true);
    }
  });

  it('every step should have an id and action', () => {
    for (const [id, pathway] of pathwayRegistry) {
      for (const sub of pathway.subPathways) {
        for (const step of sub.steps) {
          expect(step.id).toBeTruthy();
          expect(step.action).toBeTruthy();
        }
      }
      for (const step of pathway.defaultSteps) {
        expect(step.id).toBeTruthy();
        expect(step.action).toBeTruthy();
      }
    }
  });
});
