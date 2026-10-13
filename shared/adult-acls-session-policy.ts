export type AdultAclsResumeDecision = "wait" | "resume" | "start_selected";

export function decideAdultAclsResume(input: {
  isFetching: boolean;
  activeScenarioId: string | null;
  selectedScenarioId: string;
}): AdultAclsResumeDecision {
  if (input.isFetching) return "wait";
  if (!input.activeScenarioId) return "start_selected";
  return input.activeScenarioId === input.selectedScenarioId ? "resume" : "start_selected";
}
