import { ADULT_ACLS_SCENARIO_VERSION } from "./adult-acls-simulation-world";
import type { PracticeLabProgramType } from "./practice-lab-types";

export type Phase2Attempt = {
  trackId: string;
  scenarioId: string;
  score: number;
  passed: boolean;
  scenarioVersion?: string;
  evidenceStatus?: "review_required" | "accepted" | "rejected";
  criticalFailure?: boolean;
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
  requirementSetVersion: string;
  phase2Ready: boolean;
  phase3Eligible: boolean;
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

export const PHASE2_REQUIREMENT_SET_VERSION = "phase2-v5-acls-order-2026-10-26";
export const PHASE2_SCENARIO_VERSIONS: Record<string, string> = {
  // Derived from the engine so the two can never drift (a drift silently rejects every new attempt).
  adult_acls_world: ADULT_ACLS_SCENARIO_VERSION,
};

/**
 * Automated Phase 2 evidence is deliberately narrower than the set of lanes
 * that can display a mastery card. Until NRP/PALS replay authority is signed
 * off, their saved practice evidence must not unlock a hands-on booking.
 */
export const AUTOMATED_PHASE3_PROGRAM_TYPES = ["acls"] as const;

export type AutomatedPhase3ProgramType = (typeof AUTOMATED_PHASE3_PROGRAM_TYPES)[number];

export function supportsAutomatedPhase3Gate(programType: string): programType is AutomatedPhase3ProgramType {
  return (AUTOMATED_PHASE3_PROGRAM_TYPES as readonly string[]).includes(programType);
}

const COMMON_REQUIREMENTS: Record<string, Phase2Requirement[]> = {
  // BLS simulations remain available as formative practice, but BLS has no
  // Phase 2 gate in the canonical Life Support pathway.
  bls: [],
  // CPR-GPS currently submits a client event log without server receipts. Keep
  // Heartsaver closed rather than allow that log to satisfy an automated gate.
  heartsaver: [],
  pals: [
    { id: "assessment", label: "Paediatric assessment and deterioration", trackIds: ["abcde"], minimumScore: 70, requiredAttempts: 1 },
    { id: "rhythm-action", label: "Rhythm and shock decision-making", trackIds: ["shock_no_shock", "rhythm_recognition"], minimumScore: 70, requiredAttempts: 1 },
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
      attempt.evidenceStatus !== "rejected" &&
      !attempt.criticalFailure &&
      (!PHASE2_SCENARIO_VERSIONS[attempt.trackId] || attempt.scenarioVersion === PHASE2_SCENARIO_VERSIONS[attempt.trackId]) &&
      (!requirement.trackIds || requirement.trackIds.includes(attempt.trackId)) &&
      (!requirement.scenarioIds || requirement.scenarioIds.includes(attempt.scenarioId)) &&
      attempt.passed && attempt.score >= requirement.minimumScore,
    );
    const distinctScenarioIds = new Set(matching.map((attempt) => attempt.scenarioId));
    const bestScore = matching.reduce((best, attempt) => Math.max(best, attempt.score), 0);
    return { ...requirement, attempts: distinctScenarioIds.size, bestScore, complete: distinctScenarioIds.size >= requirement.requiredAttempts };
  });
  const completeCount = requirements.filter((requirement) => requirement.complete).length;
  const bestScore = attempts.reduce((best, attempt) => Math.max(best, attempt.score), 0);
  const next = requirements.find((requirement) => !requirement.complete);
  return {
    programType,
    requirementSetVersion: PHASE2_REQUIREMENT_SET_VERSION,
    phase2Ready: requirements.length > 0 && completeCount === requirements.length,
    phase3Eligible: supportsAutomatedPhase3Gate(programType) && requirements.length > 0 && completeCount === requirements.length,
    authority: "automated_simulation_mastery",
    attempts: attempts.length,
    passedAttempts: attempts.filter((attempt) => attempt.passed).length,
    bestScore,
    completedRequirements: completeCount,
    totalRequirements: requirements.length,
    requirements,
    nextAction: requirements.length === 0
      ? "Automated Phase 2 is not available for this pathway until an authoritative counted scenario is published."
      : next ? `Complete ${next.label} (${next.attempts}/${next.requiredAttempts} qualifying rehearsal${next.requiredAttempts === 1 ? "" : "s"}).`
        : supportsAutomatedPhase3Gate(programType)
          ? "Phase 2 simulation mastery requirements met. Proceed to the governed Phase 3 pathway."
          : "Phase 2 evidence is recorded, but this pathway is not yet eligible for automated Phase 3 booking.",
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

const ABCDE_CORRECT_ACTIONS: Record<string, string> = {
  unstable_brady_infant: "epinephrine",
  complete_heart_block: "pacing",
  svt_unstable_narrow: "cardiovert",
  vt_unstable_wide: "cardiovert",
  adult_unstable_afib: "cardiovert",
};

const SHOCK_CORRECT_ACTIONS: Record<string, string> = {
  vf_witnessed_peds: "shock",
  pulseless_vt_peds: "shock",
  svt_unstable_peds: "cardiovert",
  pea_hypovolemia: "cpr",
  asystole_confirm: "cpr",
  afib_stable_adult: "treat",
  vt_unstable_adult: "cardiovert",
};

const RHYTHM_CORRECT_ANSWERS: Record<string, { rhythm: string; action?: string }> = {
  sinus_bradycardia: { rhythm: "Sinus Bradycardia", action: "Ensure oxygenation; epinephrine if HR <60 with poor perfusion" },
  heart_block_complete: { rhythm: "Complete Heart Block (3rd Degree AV Block)", action: "Transcutaneous pacing; epinephrine infusion" },
  junctional_brady: { rhythm: "Junctional Bradycardia", action: "Treat underlying cause; atropine or pacing if symptomatic" },
  svt: { rhythm: "Supraventricular Tachycardia (SVT)", action: "Vagal maneuvers if stable; adenosine or cardioversion if unstable" },
  sinus_tachycardia: { rhythm: "Sinus Tachycardia", action: "Identify and treat underlying cause — do NOT cardiovert" },
  vt_with_pulse: { rhythm: "Ventricular Tachycardia (with pulse)", action: "Amiodarone if stable; synchronized cardioversion if unstable" },
  atrial_flutter: { rhythm: "Atrial Flutter", action: "Rate control if stable; cardioversion if unstable" },
  vf: { rhythm: "Ventricular Fibrillation (VF)", action: "CPR + defibrillate 2 J/kg (peds) or 120-200 J (adult)" },
  pulseless_vt: { rhythm: "Pulseless Ventricular Tachycardia", action: "CPR + defibrillate" },
  asystole: { rhythm: "Asystole", action: "CPR + epinephrine — do NOT defibrillate" },
  pea: { rhythm: "Pulseless Electrical Activity (PEA)", action: "CPR + epinephrine + treat reversible causes" },
  torsades: { rhythm: "Torsades de Pointes", action: "Magnesium sulfate 25-50 mg/kg; defibrillate if pulseless" },
};

/** Score choice-based tracks from selected answers, never from client `correct` flags. */
export function scoreAuthoritativeChoiceAttempt(
  trackId: string,
  scenarioId: string,
  eventLog: readonly unknown[],
): { score: number; passed: boolean } {
  const descriptions = eventLog
    .filter((event): event is { type?: unknown; description?: unknown } => Boolean(event && typeof event === "object"))
    .map((event) => ({ type: String(event.type ?? ""), description: String(event.description ?? "") }));

  if (trackId === "abcde") {
    const selected = descriptions.find((event) => event.type === "abcde_action")?.description.match(/^Action:\s*(.+)$/)?.[1];
    const score = selected && ABCDE_CORRECT_ACTIONS[scenarioId] === selected ? 100 : 0;
    return { score, passed: score >= 70 };
  }

  if (trackId === "shock_no_shock") {
    const selected = descriptions.find((event) => event.type === "action")?.description.match(/^Selected:\s*(.+)$/)?.[1];
    const score = selected && SHOCK_CORRECT_ACTIONS[scenarioId] === selected ? 100 : 0;
    return { score, passed: score >= 70 };
  }

  if (trackId === "rhythm_recognition") {
    const baseScenarioId = scenarioId.replace(/_(identify_action|identify)$/, "");
    const expected = RHYTHM_CORRECT_ANSWERS[baseScenarioId];
    if (!expected) return { score: 0, passed: false };
    const selectedRhythm = descriptions.find((event) => event.type === "identify")?.description.match(/^(?:Identified|Rhythm):\s*(.+)$/)?.[1];
    const selectedAction = descriptions.find((event) => event.type === "action")?.description.match(/^Action:\s*(.+)$/)?.[1];
    const rhythmCorrect = selectedRhythm === expected.rhythm;
    const actionCorrect = scenarioId.endsWith("_identify_action") ? selectedAction === expected.action : true;
    const score = scenarioId.endsWith("_identify_action")
      ? (rhythmCorrect ? 50 : 0) + (actionCorrect ? 50 : 0)
      : rhythmCorrect ? 100 : 0;
    return { score, passed: score >= 70 };
  }

  return { score: 0, passed: false };
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
