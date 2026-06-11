import type {
  FellowshipSimChoice,
  FellowshipSimStep,
  FellowshipSimulationPages,
} from "../../../shared/fellowship-simulation-types";

export type BuiltFellowshipSimulation = {
  courseId: string;
  level: "foundational" | "advanced";
  title: string;
  description: string;
  pages: FellowshipSimulationPages;
  stepOrder: string[];
};

export function simChoice(
  label: string,
  correct: boolean,
  feedback: string,
  hint?: string
): FellowshipSimChoice {
  const id = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 48);
  return { id, label, correct, feedback, hint };
}

export function simStep(
  page: string,
  title: string,
  description: string,
  instruction: string,
  choices: FellowshipSimChoice[],
  extras?: {
    vitals?: Record<string, string>;
    clinicalContext?: string;
    debriefPoints?: string[];
  }
): FellowshipSimStep {
  return {
    page,
    title,
    description,
    instruction,
    choices,
    vitals: extras?.vitals,
    clinicalContext: extras?.clinicalContext,
    debriefPoints: extras?.debriefPoints,
  };
}

export function buildSimulation(opts: {
  courseId: string;
  level: "foundational" | "advanced";
  title: string;
  description: string;
  steps: FellowshipSimStep[];
}): BuiltFellowshipSimulation {
  const pages: FellowshipSimulationPages = {};
  const stepOrder: string[] = [];
  for (const step of opts.steps) {
    pages[step.page] = step;
    stepOrder.push(step.page);
  }
  return {
    courseId: opts.courseId,
    level: opts.level,
    title: opts.title,
    description: opts.description,
    pages,
    stepOrder,
  };
}

export function debriefStep(
  page: string,
  title: string,
  points: string[]
): FellowshipSimStep {
  return {
    page,
    title,
    description: "Review the key learning points from this scenario before the summative exam.",
    instruction: "Select Continue when you have reviewed these takeaways.",
    debriefPoints: points,
    choices: [
      simChoice(
        "Continue to summative exam",
        true,
        "Well done — apply these principles at the bedside and in ResusGPS."
      ),
    ],
  };
}
