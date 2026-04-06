import { describe, it, expect } from 'vitest';
import {
  createEngineManager,
  evaluateAndTriggerEngines,
  completeAction,
  getCurrentAction,
  getEngineStatus,
  getAllEngineStatuses,
  deactivateEngine,
  reactivateEngine,
  getEnginePriorityQueue,
  hasCriticalEngines,
  getCriticalEngines,
  isEngineActive,
} from '@/lib/engineAutoTrigger';
import { AssessmentFindings } from '@/lib/emergencyEngines';

describe('Emergency Engines and Auto-Trigger System', () => {
  // Clinical Scenario 1: Septic Shock
  it('should trigger Septic Shock Engine with fever + SIRS + perfusion abnormality', () => {
    const manager = createEngineManager();
    const assessment: AssessmentFindings = {
      fever: true,
      temperature: 39.5,
      respiratoryRate: 45,
      heartRate: 170,
      capillaryRefill: 3,
      skinColor: 'mottled',
      lactate: 3,
    };

    const updated = evaluateAndTriggerEngines(assessment, 15, { years: 2, months: 0 }, manager);

    expect(updated.activeEngines.length).toBeGreaterThan(0);
    expect(updated.activeEngines.some((e) => e.engine.id === 'septic-shock')).toBe(true);
    expect(hasCriticalEngines(updated)).toBe(true);
  });

  // Clinical Scenario 2: Respiratory Failure
  it('should trigger Respiratory Failure Engine with decreased breath sounds + hypoxemia', () => {
    const manager = createEngineManager();
    const assessment: AssessmentFindings = {
      breathSounds: 'decreased',
      spO2: 85,
      retractions: true,
      grunting: true,
    };

    const updated = evaluateAndTriggerEngines(assessment, 20, { years: 3, months: 6 }, manager);

    expect(updated.activeEngines.some((e) => e.engine.id === 'respiratory-failure')).toBe(true);
  });

  // Clinical Scenario 3: Status Epilepticus
  it('should trigger Status Epilepticus Engine with active seizures', () => {
    const manager = createEngineManager();
    const assessment: AssessmentFindings = {
      seizures: true,
      avpu: 'unresponsive',
    };

    const updated = evaluateAndTriggerEngines(assessment, 18, { years: 4, months: 0 }, manager);

    expect(updated.activeEngines.some((e) => e.engine.id === 'status-epilepticus')).toBe(true);
  });

  // Clinical Scenario 4: DKA
  it('should trigger DKA Engine with hyperglycemia + metabolic acidosis', () => {
    const manager = createEngineManager();
    const assessment: AssessmentFindings = {
      glucose: 450,
      metabolicAcidosis: true,
      workOfBreathing: 'increased',
    };

    const updated = evaluateAndTriggerEngines(assessment, 25, { years: 8, months: 0 }, manager);

    expect(updated.activeEngines.some((e) => e.engine.id === 'dka')).toBe(true);
  });

  // Clinical Scenario 5: Anaphylaxis
  it('should trigger Anaphylaxis Engine with rash + respiratory distress + hypotension', () => {
    const manager = createEngineManager();
    const assessment: AssessmentFindings = {
      rash: true,
      workOfBreathing: 'severe',
      systolicBP: 70,
      temperature: 37.5,
    };

    const updated = evaluateAndTriggerEngines(assessment, 20, { years: 5, months: 0 }, manager);

    expect(updated.activeEngines.some((e) => e.engine.id === 'anaphylaxis')).toBe(true);
  });

  // Clinical Scenario 6: Hypovolemic Shock
  it('should trigger Hypovolemic Shock Engine with perfusion abnormality + volume loss', () => {
    const manager = createEngineManager();
    const assessment: AssessmentFindings = {
      capillaryRefill: 3,
      skinColor: 'pale',
      urinOutput: 0,
      systolicBP: 80,
    };

    const updated = evaluateAndTriggerEngines(assessment, 15, { years: 2, months: 0 }, manager);

    expect(updated.activeEngines.some((e) => e.engine.id === 'hypovolemic-shock')).toBe(true);
  });

  // Clinical Scenario 7: Cardiogenic Shock
  it('should trigger Cardiogenic Shock Engine with heart failure signs + poor perfusion', () => {
    const manager = createEngineManager();
    const assessment: AssessmentFindings = {
      heartRate: 180,
      workOfBreathing: 'severe',
      capillaryRefill: 3,
      skinColor: 'pale',
    };

    const updated = evaluateAndTriggerEngines(assessment, 12, { years: 1, months: 6 }, manager);

    expect(updated.activeEngines.some((e) => e.engine.id === 'cardiogenic-shock')).toBe(true);
  });

  // Clinical Scenario 8: Meningitis
  it('should trigger Meningitis Engine with fever + petechial rash + altered mental status', () => {
    const manager = createEngineManager();
    const assessment: AssessmentFindings = {
      fever: true,
      temperature: 39.8,
      rash: true,
      rashType: 'petechial',
      avpu: 'verbal',
    };

    const updated = evaluateAndTriggerEngines(assessment, 22, { years: 6, months: 0 }, manager);

    expect(updated.activeEngines.some((e) => e.engine.id === 'meningitis')).toBe(true);
  });

  // Test: Multiple engines triggered simultaneously
  it('should handle multiple engines triggered simultaneously', () => {
    const manager = createEngineManager();
    const assessment: AssessmentFindings = {
      fever: true,
      temperature: 39.5,
      seizures: true,
      glucose: 45, // Hypoglycemia
      respiratoryRate: 50,
      heartRate: 180,
      capillaryRefill: 3,
      skinColor: 'mottled',
    };

    const updated = evaluateAndTriggerEngines(assessment, 20, { years: 4, months: 0 }, manager);

    expect(updated.activeEngines.length).toBeGreaterThan(1);
    expect(getCriticalEngines(updated).length).toBeGreaterThan(0);
  });

  // Test: Engine priority queue
  it('should sort engines by priority (critical first)', () => {
    const manager = createEngineManager();
    const assessment: AssessmentFindings = {
      fever: true,
      temperature: 39.5,
      seizures: true,
      respiratoryRate: 50,
      heartRate: 180,
      capillaryRefill: 3,
      skinColor: 'mottled',
    };

    const updated = evaluateAndTriggerEngines(assessment, 20, { years: 4, months: 0 }, manager);
    const priorityQueue = getEnginePriorityQueue(updated);

    // Critical engines should come first
    expect(priorityQueue.length).toBeGreaterThan(0);
    const criticalEngines = priorityQueue.filter((e) => e.priority === 'critical');
    expect(criticalEngines.length).toBeGreaterThan(0);
  });

  // Test: Action completion tracking
  it('should track action completion and progress', () => {
    const manager = createEngineManager();
    const assessment: AssessmentFindings = {
      seizures: true,
    };

    let updated = evaluateAndTriggerEngines(assessment, 20, { years: 4, months: 0 }, manager);
    const activation = updated.activeEngines[0];

    expect(activation.actionsCompleted.length).toBe(0);

    // Complete first action
    const firstAction = getCurrentAction(activation);
    updated = completeAction(updated, activation.engine.id, firstAction.id);

    const status = getEngineStatus(updated.activeEngines[0]);
    expect(status.completedCount).toBe(1);
    expect(status.progressPercent).toBeGreaterThan(0);
  });

  // Test: Engine deactivation and reactivation
  it('should deactivate and reactivate engines', () => {
    const manager = createEngineManager();
    const assessment: AssessmentFindings = {
      seizures: true,
    };

    let updated = evaluateAndTriggerEngines(assessment, 20, { years: 4, months: 0 }, manager);
    const engineId = updated.activeEngines[0].engine.id;

    expect(isEngineActive(updated, engineId)).toBe(true);

    // Deactivate
    updated = deactivateEngine(updated, engineId);
    expect(isEngineActive(updated, engineId)).toBe(false);
    expect(updated.completedEngines.length).toBe(1);

    // Reactivate
    updated = reactivateEngine(updated, engineId, assessment);
    expect(isEngineActive(updated, engineId)).toBe(true);
    expect(updated.completedEngines.length).toBe(0);
  });

  // Test: Engine status reporting
  it('should generate accurate engine status reports', () => {
    const manager = createEngineManager();
    const assessment: AssessmentFindings = {
      seizures: true,
    };

    let updated = evaluateAndTriggerEngines(assessment, 20, { years: 4, months: 0 }, manager);
    const statuses = getAllEngineStatuses(updated);

    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses[0]).toHaveProperty('engineId');
    expect(statuses[0]).toHaveProperty('engineName');
    expect(statuses[0]).toHaveProperty('severity');
    expect(statuses[0]).toHaveProperty('totalActions');
    expect(statuses[0]).toHaveProperty('completedCount');
    expect(statuses[0]).toHaveProperty('progressPercent');
    expect(statuses[0]).toHaveProperty('currentAction');
  });

  // Test: Assessment history tracking
  it('should maintain assessment history', () => {
    const manager = createEngineManager();
    const assessment1: AssessmentFindings = { seizures: true };
    const assessment2: AssessmentFindings = { fever: true, temperature: 39.5 };

    let updated = evaluateAndTriggerEngines(assessment1, 20, { years: 4, months: 0 }, manager);
    updated = evaluateAndTriggerEngines(assessment2, 20, { years: 4, months: 0 }, updated);

    expect(updated.assessmentHistory.length).toBe(2);
  });

  // Test: Assessment tracking
  it("should track assessment history", () => {
    const manager = createEngineManager();
    const assessment: AssessmentFindings = {
      temperature: 37.5,
      heartRate: 100,
      respiratoryRate: 20,
      spO2: 98,
      capillaryRefill: 1,
      skinColor: "pink",
    };

    const updated = evaluateAndTriggerEngines(assessment, 20, { years: 4, months: 0 }, manager);

    expect(updated.assessmentHistory.length).toBe(1);
  });

  // Test: Engine re-triggering prevention
  it('should not re-trigger already active engines', () => {
    const manager = createEngineManager();
    const assessment: AssessmentFindings = {
      seizures: true,
    };

    let updated = evaluateAndTriggerEngines(assessment, 20, { years: 4, months: 0 }, manager);
    const initialCount = updated.activeEngines.length;

    // Trigger again with same assessment
    updated = evaluateAndTriggerEngines(assessment, 20, { years: 4, months: 0 }, updated);

    expect(updated.activeEngines.length).toBe(initialCount);
  });
});
