import type { PracticeLabEvent } from "./practice-lab-types";
import type { SimulationMission } from "./simulation-hub";

export type SimulationDomainId = "recognition" | "prioritisation" | "technical-action" | "communication" | "reassessment";

export type SimulationDomainSummary = {
  id: SimulationDomainId;
  label: string;
  score: number | null;
  evidenceCount: number;
  coaching: string;
};

const DOMAIN_META: Record<SimulationDomainId, { label: string; coaching: string }> = {
  recognition: { label: "Recognition", coaching: "Practise identifying the patient state and rhythm before choosing an intervention." },
  prioritisation: { label: "Prioritisation", coaching: "Rehearse the first safe action and protect time-critical steps from distraction." },
  "technical-action": { label: "Technical action", coaching: "Repeat the procedure sequence slowly, then increase pressure only after it is reliable." },
  communication: { label: "Communication", coaching: "Use clear orders, names, closed-loop confirmation, and explicit escalation." },
  reassessment: { label: "Reassessment", coaching: "After each intervention, state what changed and what you will do if it did not." },
};

function domainForEvent(event: PracticeLabEvent): SimulationDomainId {
  const text = `${event.type} ${event.description}`.toLowerCase();
  if (/rhythm|recogn|assessment|strip|shockable|pea|vf|asystole/.test(text)) return "recognition";
  if (/priority|first|delay|urgent|escalat|delegate|call/.test(text)) return "prioritisation";
  if (/cpr|compress|shock|epinephrine|medication|airway|oxygen|fluid|intubat|defib/.test(text)) return "technical-action";
  if (/team|communicat|order|closed loop|role|handover/.test(text)) return "communication";
  if (/reassess|response|rosc|vital|repeat|post-arrest/.test(text)) return "reassessment";
  return "prioritisation";
}

export function summarizeSimulationDomains(events: readonly PracticeLabEvent[]): SimulationDomainSummary[] {
  return (Object.keys(DOMAIN_META) as SimulationDomainId[]).map((id) => {
    const domainEvents = events.filter((event) => domainForEvent(event) === id && typeof event.correct === "boolean");
    const correct = domainEvents.filter((event) => event.correct).length;
    const score = domainEvents.length ? Math.round((correct / domainEvents.length) * 100) : null;
    return { id, ...DOMAIN_META[id], score, evidenceCount: domainEvents.length };
  });
}

export function getNextRehearsal(summary: readonly SimulationDomainSummary[]): SimulationDomainSummary | null {
  return summary
    .filter((domain) => domain.score !== null)
    .sort((a, b) => (a.score ?? 100) - (b.score ?? 100))[0] ?? null;
}

/**
 * Derived, non-competitive practice points. These are intentionally calculated
 * from existing attempt records: no new entitlement, credential, or ranking is
 * created, and a learner cannot buy or lose access through this value.
 */
export function getSimulationPracticePoints(attempts: number, bestScore: number, isFormative: boolean): number {
  const rehearsalPoints = Math.max(0, attempts) * (isFormative ? 25 : 40);
  const qualityPoints = Math.max(0, Math.min(100, bestScore)) === 0 ? 0 : Math.floor(Math.max(0, Math.min(100, bestScore)) / 10) * 5;
  return rehearsalPoints + qualityPoints;
}

export function getSimulationPracticeRank(points: number): { title: string; nextThreshold: number | null } {
  if (points >= 500) return { title: "Calm under pressure", nextThreshold: null };
  if (points >= 250) return { title: "Reliable responder", nextThreshold: 500 };
  if (points >= 100) return { title: "Building fluency", nextThreshold: 250 };
  return { title: "First responder in training", nextThreshold: 100 };
}

export function getMissionJourneyStep(stage: "map" | "briefing" | "playing"): { label: string; index: number } {
  if (stage === "briefing") return { label: "Brief", index: 2 };
  if (stage === "playing") return { label: "Act and reassess", index: 3 };
  return { label: "Choose mission", index: 1 };
}

export function getRecommendedSimulationMission(
  missions: readonly SimulationMission[],
  completedMissionIds: readonly string[],
  attemptsByMission: Readonly<Record<string, number>>,
): SimulationMission | null {
  const available = missions.filter((mission) => !completedMissionIds.includes(mission.id));
  return available.sort((a, b) => {
    const aAttempts = attemptsByMission[a.id] ?? 0;
    const bAttempts = attemptsByMission[b.id] ?? 0;
    if (aAttempts !== bAttempts) return aAttempts - bAttempts;
    if (a.difficulty !== b.difficulty) return a.difficulty === "Foundation" ? -1 : 1;
    return a.estimatedMinutes - b.estimatedMinutes;
  })[0] ?? missions[0] ?? null;
}
