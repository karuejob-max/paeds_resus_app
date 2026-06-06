import type { PracticeLabEvent } from "@shared/practice-lab-types";
import type { PerformanceMetrics } from "@/lib/simulationEngine";

/** Template-based narrative debrief from event log — no novel clinical advice */
export function buildScriptedDebrief(params: {
  trackName: string;
  scenarioName: string;
  score: number;
  passed: boolean;
  events: PracticeLabEvent[];
}): string[] {
  const lines: string[] = [];
  lines.push(`Scenario: ${params.scenarioName} (${params.trackName})`);
  lines.push(`Score: ${params.score}/100 — ${params.passed ? "Pass" : "Needs improvement"}`);

  const correctActions = params.events.filter((e) => e.correct === true);
  const incorrectActions = params.events.filter((e) => e.correct === false);

  if (correctActions.length > 0) {
    lines.push("What went well:");
    for (const e of correctActions.slice(0, 3)) {
      lines.push(`• ${e.description}`);
    }
  }

  if (incorrectActions.length > 0) {
    lines.push("Areas to review:");
    for (const e of incorrectActions.slice(0, 3)) {
      lines.push(`• ${e.description}`);
    }
  }

  lines.push(
    "Remember: This is supplemental practice for your AHA course — not certification and not for live patient care."
  );

  return lines;
}

/** Optional AI-style narrative from event log only (template-based, guardrailed) */
export function buildNarrativeDebrief(params: {
  trackName: string;
  scenarioName: string;
  score: number;
  passed: boolean;
  events: PracticeLabEvent[];
}): string {
  const actionEvents = params.events.filter((e) => e.type === "action" || e.type === "abcde_action");
  const feedbackEvents = params.events.filter((e) => e.type === "feedback");

  const summary = actionEvents.map((e) => e.description).join("; ") || "No actions recorded";
  const feedback = feedbackEvents.map((e) => e.description).join(" ") || "";

  return [
    `In this ${params.trackName} scenario ("${params.scenarioName}"), your recorded actions were: ${summary}.`,
    feedback ? `Guideline feedback: ${feedback}` : "",
    params.passed
      ? "Your performance met the practice threshold. Consider repeating this scenario as a booster in a few days."
      : "Review the AHA algorithm for this presentation and retry when ready.",
    "This debrief is generated only from your simulation event log — not individualized clinical advice.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildCardiacArrestDebrief(
  metrics: PerformanceMetrics,
  scenarioName: string,
  events: PracticeLabEvent[]
): string[] {
  const base = buildScriptedDebrief({
    trackName: "Cardiac Arrest",
    scenarioName,
    score: metrics.overallScore,
    passed: metrics.overallScore >= 70,
    events,
  });
  return [...metrics.feedback, ...base];
}
