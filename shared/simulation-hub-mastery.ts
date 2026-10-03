import type { PracticeLabEvent } from "./practice-lab-types";

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
