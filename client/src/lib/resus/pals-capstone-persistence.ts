/**
 * PALS Capstone Persistence
 * 
 * Handles saving and resuming capstone progress without blocking module access.
 * - Stores progress in localStorage
 * - Allows users to navigate modules freely
 * - Only gates certificate issuance
 */

const CAPSTONE_STORAGE_KEY = "pals_capstone_progress";

export interface CapstoneProgress {
  enrollmentId: number;
  courseId: string;
  currentPhaseIndex: number;
  phaseScores: Record<string, number>;
  completedAt?: number;
  score?: number;
  passed?: boolean;
}

export function saveCapstoneProgress(progress: CapstoneProgress): void {
  try {
    localStorage.setItem(CAPSTONE_STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error("Failed to save capstone progress:", error);
  }
}

export function loadCapstoneProgress(enrollmentId: number, courseId: string): CapstoneProgress | null {
  try {
    const stored = localStorage.getItem(CAPSTONE_STORAGE_KEY);
    if (!stored) return null;

    const progress = JSON.parse(stored) as CapstoneProgress;

    // Only return if it matches the current enrollment and course
    if (progress.enrollmentId === enrollmentId && progress.courseId === courseId) {
      return progress;
    }

    return null;
  } catch (error) {
    console.error("Failed to load capstone progress:", error);
    return null;
  }
}

export function clearCapstoneProgress(): void {
  try {
    localStorage.removeItem(CAPSTONE_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear capstone progress:", error);
  }
}

export function isCapstoneInProgress(enrollmentId: number, courseId: string): boolean {
  const progress = loadCapstoneProgress(enrollmentId, courseId);
  return progress !== null && !progress.passed;
}

export function isCapstoneCompleted(enrollmentId: number, courseId: string): boolean {
  const progress = loadCapstoneProgress(enrollmentId, courseId);
  return progress !== null && progress.passed === true;
}

export function getCapstoneResumePhase(enrollmentId: number, courseId: string): number | null {
  const progress = loadCapstoneProgress(enrollmentId, courseId);
  return progress?.currentPhaseIndex ?? null;
}
