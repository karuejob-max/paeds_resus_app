/**
 * Definitive Care completion — fellowship Pillar B credit gates on this, not primary diagnosis alone.
 * Shared between client (ResusGPS UI) and tests; server trusts saved session metadata.
 */

export type DefinitiveCareStepStatus = "pending" | "done" | "skipped";

export interface DefinitiveCareProgress {
  fellowshipId: string;
  stepStatuses: Record<string, DefinitiveCareStepStatus>;
  /** Set when learner completes all required definitive-care steps */
  completedAt?: number;
}

export interface DefinitiveCareStepLike {
  id: string;
  isReassessment?: boolean;
}

/** Steps that count toward completion (reassessment checkpoints are optional). */
export function requiredDefinitiveCareStepIds(steps: DefinitiveCareStepLike[]): string[] {
  return steps.filter((s) => !s.isReassessment).map((s) => s.id);
}

export function computeDefinitiveCareStepProgress(
  steps: DefinitiveCareStepLike[],
  stepStatuses: Record<string, DefinitiveCareStepStatus>
): { completed: number; total: number; percent: number; isComplete: boolean } {
  const required = requiredDefinitiveCareStepIds(steps);
  const total = required.length;
  if (total === 0) {
    return { completed: 0, total: 0, percent: 100, isComplete: true };
  }
  const completed = required.filter(
    (id) => stepStatuses[id] === "done" || stepStatuses[id] === "skipped"
  ).length;
  const percent = Math.round((completed / total) * 100);
  return { completed, total, percent, isComplete: completed >= total };
}

export function isDefinitiveCareProgressComplete(
  steps: DefinitiveCareStepLike[],
  progress: DefinitiveCareProgress | null | undefined
): boolean {
  if (!progress) return false;
  if (progress.completedAt) return true;
  return computeDefinitiveCareStepProgress(steps, progress.stepStatuses).isComplete;
}
