import type { PracticeLabProgramType } from "./practice-lab-types";

export type Phase2Attempt = {
  trackId: string;
  scenarioId: string;
  score: number;
  passed: boolean;
};

export type Phase2Requirement = {
  id: string;
  label: string;
  scenarioIds?: readonly string[];
  trackIds?: readonly string[];
  minimumScore: number;
  requiredAttempts: number;
};

export type Phase2AutomationStatus = {
  programType: PracticeLabProgramType;
  phase2Ready: boolean;
  authority: "automated_simulation_mastery";
  attempts: number;
  passedAttempts: number;
  bestScore: number;
  completedRequirements: number;
  totalRequirements: number;
  requirements: Array<Phase2Requirement & { attempts: number; bestScore: number; complete: boolean }>;
  nextAction: string;
  governanceBoundary: "does_not_issue_credential";
};

const COMMON_REQUIREMENTS: Record<string, Phase2Requirement[]> = {
  bls: [
    { id: "first-minutes", label: "First-minutes assessment loop", trackIds: ["cardiac_arrest"], scenarioIds: ["first-minutes-instructor-loop"], minimumScore: 70, requiredAttempts: 1 },
    { id: "arrest-sequence", label: "Arrest recognition and first actions", trackIds: ["cardiac_arrest"], minimumScore: 70, requiredAttempts: 2 },
  ],
  heartsaver: [
    { id: "first-minutes", label: "First-minutes assessment loop", trackIds: ["cardiac_arrest"], scenarioIds: ["first-minutes-instructor-loop"], minimumScore: 70, requiredAttempts: 1 },
    { id: "arrest-sequence", label: "Arrest recognition and first actions", trackIds: ["cardiac_arrest"], minimumScore: 70, requiredAttempts: 1 },
  ],
  pals: [
    { id: "assessment", label: "Paediatric assessment and deterioration", trackIds: ["abcde"], minimumScore: 70, requiredAttempts: 1 },
    { id: "rhythm-action", label: "Rhythm and shock decision-making", trackIds: ["shock_no_shock", "rhythm_recognition"], minimumScore: 70, requiredAttempts: 1 },
    { id: "arrest-sequence", label: "Paediatric arrest sequence", trackIds: ["cardiac_arrest"], minimumScore: 70, requiredAttempts: 1 },
  ],
  acls: [
    { id: "rhythm-action", label: "Adult rhythm and stability decisions", trackIds: ["adult_acls_world", "rhythm_recognition"], minimumScore: 70, requiredAttempts: 2 },
    { id: "arrest-sequence", label: "Adult arrest and reversible-cause management", trackIds: ["adult_acls_world"], scenarioIds: ["vf-pulseless-vt", "pea", "asystole", "reversible-cause-arrest"], minimumScore: 70, requiredAttempts: 2 },
    { id: "post-rosc", label: "ROSC and post-arrest reassessment", trackIds: ["adult_acls_world"], scenarioIds: ["rosc-post-arrest"], minimumScore: 70, requiredAttempts: 1 },
  ],
  nrp: [
    { id: "initial-steps", label: "Initial newborn steps and ventilation", trackIds: ["nrp_world"], minimumScore: 70, requiredAttempts: 2 },
    { id: "bradycardia", label: "Persistent newborn bradycardia escalation", trackIds: ["nrp_world"], scenarioIds: ["newborn-persistent-bradycardia"], minimumScore: 70, requiredAttempts: 1 },
  ],
};

export function getPhase2Requirements(programType: PracticeLabProgramType): Phase2Requirement[] {
  return (COMMON_REQUIREMENTS[programType] ?? []).map((requirement) => ({ ...requirement }));
}

export function calculatePhase2AutomationStatus(programType: PracticeLabProgramType, attempts: readonly Phase2Attempt[]): Phase2AutomationStatus {
  const requirements = getPhase2Requirements(programType).map((requirement) => {
    const matching = attempts.filter((attempt) =>
      (!requirement.trackIds || requirement.trackIds.includes(attempt.trackId)) &&
      (!requirement.scenarioIds || requirement.scenarioIds.includes(attempt.scenarioId)) &&
      attempt.passed && attempt.score >= requirement.minimumScore,
    );
    const bestScore = matching.reduce((best, attempt) => Math.max(best, attempt.score), 0);
    return { ...requirement, attempts: matching.length, bestScore, complete: matching.length >= requirement.requiredAttempts };
  });
  const completeCount = requirements.filter((requirement) => requirement.complete).length;
  const bestScore = attempts.reduce((best, attempt) => Math.max(best, attempt.score), 0);
  const next = requirements.find((requirement) => !requirement.complete);
  return {
    programType,
    phase2Ready: requirements.length > 0 && completeCount === requirements.length,
    authority: "automated_simulation_mastery",
    attempts: attempts.length,
    passedAttempts: attempts.filter((attempt) => attempt.passed).length,
    bestScore,
    completedRequirements: completeCount,
    totalRequirements: requirements.length,
    requirements,
    nextAction: next ? `Complete ${next.label} (${next.attempts}/${next.requiredAttempts} qualifying rehearsal${next.requiredAttempts === 1 ? "" : "s"}).` : "Phase 2 simulation mastery requirements met. Proceed to the governed Phase 3 pathway.",
    governanceBoundary: "does_not_issue_credential",
  };
}

/** Dedicated-world evidence has no client-provided score; derive a conservative formative score. */
export function scoreDedicatedSimulation(competencies: Record<string, number>, criticalFailures: number): number {
  const values = Object.values(competencies).filter((value) => Number.isFinite(value));
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  return Math.max(0, Math.min(100, Math.round(average - criticalFailures * 10)));
}

/** Score formative event-log tracks without trusting client-supplied score fields. */
export function scoreFormativeEventLog(eventLog: readonly unknown[]): { score: number; passed: boolean } {
  const decisions = eventLog.filter((event): event is { correct?: boolean } => Boolean(event && typeof event === "object" && "correct" in event));
  if (!decisions.length) return { score: 0, passed: false };
  const correct = decisions.filter((event) => event.correct === true).length;
  const score = Math.round((correct / decisions.length) * 100);
  return { score, passed: score >= 70 };
}

/**
 * CPR-GPS emits clinical action events rather than quiz-style correct flags.
 * Keep the rehearsal formative, but derive a conservative server score from
 * the observable terminal sequence when the course policy uses arrest evidence.
 */
export function scoreCardiacArrestEventLog(eventLog: readonly unknown[]): { score: number; passed: boolean } {
  const descriptions = eventLog
    .filter((event): event is { description?: unknown } => Boolean(event && typeof event === "object"))
    .map((event) => String(event.description ?? "").toLowerCase());
  const has = (pattern: RegExp) => descriptions.some((description) => pattern.test(description));
  const evidence = [
    has(/cardiac arrest recognized|cpr started/),
    has(/vf|pvt|pea|asystole/),
    has(/shock delivered|defibrillator charged|compressions/),
    has(/rosc achieved|code complete|outcome/),
  ];
  const score = Math.round((evidence.filter(Boolean).length / evidence.length) * 100);
  return { score, passed: score >= 70 };
}
