export type ReadinessItemDefinition = { isCritical: boolean };
export type ReadinessItemObservation = { itemStatus: string };
export type UtlReadinessStatus = "ready" | "ready_with_gaps" | "not_ready";

export function isCriticalReadinessGap(definition: ReadinessItemDefinition, observation: ReadinessItemObservation) {
  return definition.isCritical && observation.itemStatus !== "present_and_functional";
}

export function deriveUtlReadinessStatus(definitions: ReadinessItemDefinition[], observations: ReadinessItemObservation[]): UtlReadinessStatus {
  const criticalGaps = definitions.reduce((count, definition, index) => count + (isCriticalReadinessGap(definition, observations[index] ?? { itemStatus: "not_observed" }) ? 1 : 0), 0);
  if (criticalGaps > 0) return "not_ready";
  const hasNonCriticalGap = definitions.some((definition, index) => {
    const status = observations[index]?.itemStatus ?? "not_observed";
    return !definition.isCritical && !["present_and_functional", "not_applicable"].includes(status);
  });
  return hasNonCriticalGap ? "ready_with_gaps" : "ready";
}
