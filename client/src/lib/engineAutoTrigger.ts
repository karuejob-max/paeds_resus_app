/**
 * Emergency Engine Auto-Trigger System
 * Automatically detects and activates applicable emergency engines based on assessment findings
 */

import { EmergencyEngine, getApplicableEngines, AssessmentFindings } from './emergencyEngines';
import { getAllAdditionalEngines } from './additionalEngines';

export interface EngineActivation {
  engine: EmergencyEngine;
  triggeredAt: Date;
  assessmentFindings: AssessmentFindings;
  priority: 'critical' | 'urgent';
  actionsCompleted: string[];
  currentActionIndex: number;
}

export interface EngineManager {
  activeEngines: EngineActivation[];
  completedEngines: EngineActivation[];
  assessmentHistory: AssessmentFindings[];
}

/**
 * Initialize engine manager
 */
export const createEngineManager = (): EngineManager => {
  return {
    activeEngines: [],
    completedEngines: [],
    assessmentHistory: [],
  };
};

/**
 * Evaluate assessment and trigger applicable engines
 */
export const evaluateAndTriggerEngines = (
  assessment: AssessmentFindings,
  weight: number,
  age: { years: number; months: number },
  manager: EngineManager
): EngineManager => {
  // Get all applicable engines
  const applicableEngines = [
    ...getApplicableEngines(assessment, weight, age),
    ...getAllAdditionalEngines(weight, age),
  ];

  // Check which engines are already active
  const activeEngineIds = manager.activeEngines.map((e) => e.engine.id);

  // Trigger new engines
  for (const engine of applicableEngines) {
    if (!activeEngineIds.includes(engine.id)) {
      const activation: EngineActivation = {
        engine,
        triggeredAt: new Date(),
        assessmentFindings: assessment,
        priority: engine.severity,
        actionsCompleted: [],
        currentActionIndex: 0,
      };

      manager.activeEngines.push(activation);
    }
  }

  // Update assessment history
  manager.assessmentHistory.push(assessment);

  return manager;
};

/**
 * Mark action as completed in an engine
 */
export const completeAction = (
  manager: EngineManager,
  engineId: string,
  actionId: string
): EngineManager => {
  const activation = manager.activeEngines.find((e) => e.engine.id === engineId);

  if (activation) {
    if (!activation.actionsCompleted.includes(actionId)) {
      activation.actionsCompleted.push(actionId);
    }

    // Move to next action
    activation.currentActionIndex = Math.min(
      activation.currentActionIndex + 1,
      activation.engine.actions.length - 1
    );

    // Check if all actions completed
    if (activation.actionsCompleted.length === activation.engine.actions.length) {
      // Move engine to completed
      manager.completedEngines.push(activation);
      manager.activeEngines = manager.activeEngines.filter((e) => e.engine.id !== engineId);
    }
  }

  return manager;
};

/**
 * Get current action for an engine
 */
export const getCurrentAction = (activation: EngineActivation) => {
  return activation.engine.actions[activation.currentActionIndex];
};

/**
 * Get next action for an engine
 */
export const getNextAction = (activation: EngineActivation) => {
  const nextIndex = activation.currentActionIndex + 1;
  if (nextIndex < activation.engine.actions.length) {
    return activation.engine.actions[nextIndex];
  }
  return null;
};

/**
 * Get engine status
 */
export const getEngineStatus = (activation: EngineActivation) => {
  const totalActions = activation.engine.actions.length;
  const completedCount = activation.actionsCompleted.length;
  const progressPercent = Math.round((completedCount / totalActions) * 100);

  return {
    engineId: activation.engine.id,
    engineName: activation.engine.name,
    severity: activation.engine.severity,
    totalActions,
    completedCount,
    progressPercent,
    currentAction: getCurrentAction(activation),
    nextAction: getNextAction(activation),
    isComplete: completedCount === totalActions,
  };
};

/**
 * Get all active engine statuses
 */
export const getAllEngineStatuses = (manager: EngineManager) => {
  return manager.activeEngines.map((activation) => getEngineStatus(activation));
};

/**
 * Deactivate an engine (e.g., if condition resolves)
 */
export const deactivateEngine = (manager: EngineManager, engineId: string): EngineManager => {
  const activation = manager.activeEngines.find((e) => e.engine.id === engineId);

  if (activation) {
    manager.completedEngines.push(activation);
    manager.activeEngines = manager.activeEngines.filter((e) => e.engine.id !== engineId);
  }

  return manager;
};

/**
 * Reactivate an engine (e.g., if condition recurs)
 */
export const reactivateEngine = (
  manager: EngineManager,
  engineId: string,
  assessment: AssessmentFindings
): EngineManager => {
  const completedActivation = manager.completedEngines.find((e) => e.engine.id === engineId);

  if (completedActivation) {
    // Reset the activation
    const reactivation: EngineActivation = {
      engine: completedActivation.engine,
      triggeredAt: new Date(),
      assessmentFindings: assessment,
      priority: completedActivation.engine.severity,
      actionsCompleted: [],
      currentActionIndex: 0,
    };

    manager.activeEngines.push(reactivation);
    manager.completedEngines = manager.completedEngines.filter((e) => e.engine.id !== engineId);
  }

  return manager;
};

/**
 * Get engine priority queue (sorted by severity and trigger time)
 */
export const getEnginePriorityQueue = (manager: EngineManager) => {
  return manager.activeEngines.sort((a, b) => {
    // Critical engines first
    if (a.priority === 'critical' && b.priority !== 'critical') return -1;
    if (a.priority !== 'critical' && b.priority === 'critical') return 1;

    // Then by trigger time (earliest first)
    return a.triggeredAt.getTime() - b.triggeredAt.getTime();
  });
};

/**
 * Generate engine summary for handover
 */
export const generateEngineSummary = (manager: EngineManager) => {
  const summary = {
    activeEngines: manager.activeEngines.map((a) => ({
      name: a.engine.name,
      severity: a.engine.severity,
      progress: `${a.actionsCompleted.length}/${a.engine.actions.length} actions`,
      currentAction: getCurrentAction(a)?.title,
    })),
    completedEngines: manager.completedEngines.map((c) => ({
      name: c.engine.name,
      completedAt: c.triggeredAt,
      totalActions: c.engine.actions.length,
    })),
    totalAssessments: manager.assessmentHistory.length,
  };

  return summary;
};

/**
 * Check if any critical engines are active
 */
export const hasCriticalEngines = (manager: EngineManager): boolean => {
  return manager.activeEngines.some((e) => e.priority === 'critical');
};

/**
 * Get all critical engines
 */
export const getCriticalEngines = (manager: EngineManager): EngineActivation[] => {
  return manager.activeEngines.filter((e) => e.priority === 'critical');
};

/**
 * Get engine by ID
 */
export const getEngineById = (manager: EngineManager, engineId: string): EngineActivation | undefined => {
  return manager.activeEngines.find((e) => e.engine.id === engineId);
};

/**
 * Check if specific engine is active
 */
export const isEngineActive = (manager: EngineManager, engineId: string): boolean => {
  return manager.activeEngines.some((e) => e.engine.id === engineId);
};

/**
 * Get engine completion percentage
 */
export const getEngineCompletionPercent = (activation: EngineActivation): number => {
  const total = activation.engine.actions.length;
  const completed = activation.actionsCompleted.length;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};

/**
 * Get time elapsed since engine activation
 */
export const getEngineElapsedTime = (activation: EngineActivation): number => {
  const now = new Date();
  return Math.round((now.getTime() - activation.triggeredAt.getTime()) / 1000); // seconds
};

/**
 * Export engine manager state for persistence
 */
export const exportManagerState = (manager: EngineManager): string => {
  return JSON.stringify({
    activeEngineIds: manager.activeEngines.map((e) => e.engine.id),
    completedEngineIds: manager.completedEngines.map((e) => e.engine.id),
    assessmentCount: manager.assessmentHistory.length,
  });
};
