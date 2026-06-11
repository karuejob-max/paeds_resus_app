/**
 * Fellowship micro-course simulation step schema — decision-focused formative practice.
 * Seed stores `{ pages, stepOrder }`; UI reads via parseFellowshipScenarioData.
 */

export type FellowshipSimChoice = {
  id: string;
  label: string;
  correct: boolean;
  feedback: string;
  hint?: string;
};

export type FellowshipSimStep = {
  page: string;
  title: string;
  description: string;
  vitals?: Record<string, string>;
  instruction: string;
  /** Preferred: learner-facing decision options with feedback */
  choices?: FellowshipSimChoice[];
  /** Legacy / fallback — converted to choices in UI when no choices array */
  expectedActions?: string[];
  clinicalContext?: string;
  /** Shown on debrief step only */
  debriefPoints?: string[];
};

export type FellowshipSimulationPages = Record<string, FellowshipSimStep>;

export type FellowshipSimulationScenarioPayload = {
  pages: FellowshipSimulationPages;
  stepOrder?: string[];
};

export const FELLOWSHIP_SIM_MIN_STEPS = 5;
export const FELLOWSHIP_SIM_MAX_STEPS = 10;

/** Level-appropriate keyword hints for audit (foundational vs advanced). */
export const FELLOWSHIP_SIM_FOUNDATIONAL_KEYWORDS = [
  "recogni",
  "first",
  "initial",
  "escalat",
  "senior",
  "transfer",
  "red flag",
  "call for",
];

export const FELLOWSHIP_SIM_ADVANCED_KEYWORDS = [
  "refractory",
  "second-line",
  "second line",
  "icu",
  "intubat",
  "vasopress",
  "complication",
  "noradrenaline",
  "exchange",
  "rrt",
  "team",
];

export function fellowshipSimStepText(step: FellowshipSimStep): string {
  const parts = [
    step.title,
    step.description,
    step.instruction,
    step.clinicalContext ?? "",
    ...(step.debriefPoints ?? []),
    ...(step.choices?.map((c) => c.label + c.feedback) ?? []),
    ...(step.expectedActions ?? []),
  ];
  return parts.join(" ").toLowerCase();
}

export function fellowshipSimHasLevelKeywords(
  text: string,
  level: "foundational" | "advanced"
): boolean {
  const keywords =
    level === "foundational"
      ? FELLOWSHIP_SIM_FOUNDATIONAL_KEYWORDS
      : FELLOWSHIP_SIM_ADVANCED_KEYWORDS;
  return keywords.some((k) => text.includes(k));
}
