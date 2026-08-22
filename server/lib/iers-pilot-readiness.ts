export type IersPilotReadinessInput = {
  activeProviderCount: number;
  activeProviderRoleCount: number;
  independentReviewerCount: number;
  completedDrillWithProviderCount: number;
  acceptedEvidenceCount: number;
  verifiedActionCount: number;
  simulationSafetyEnforced: boolean;
};

export type IersPilotReadinessGate = {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
};

export function evaluateIersPilotReadiness(input: IersPilotReadinessInput) {
  const gates: IersPilotReadinessGate[] = [
    {
      key: "linked_provider",
      label: "Linked provider with responsibility",
      passed: input.activeProviderCount > 0 && input.activeProviderRoleCount > 0,
      detail: input.activeProviderCount > 0 && input.activeProviderRoleCount > 0
        ? "At least one active provider has an institutional responsibility and an IERS product role."
        : "Link an active provider and assign an explicit IERS product role before starting a pilot.",
    },
    {
      key: "independent_reviewer",
      label: "Independent reviewer available",
      passed: input.independentReviewerCount > 0,
      detail: input.independentReviewerCount > 0
        ? "A reviewer identity distinct from the active provider set is available."
        : "Add a separate institution leader or IERS reviewer; the submitter must not verify their own closure.",
    },
    {
      key: "simulation_safety",
      label: "Non-emergency drill label enforced",
      passed: input.simulationSafetyEnforced,
      detail: input.simulationSafetyEnforced
        ? "New drills require the explicit NOT A REAL EMERGENCY acknowledgement."
        : "The drill safety migration is not available yet; do not start a pilot.",
    },
    {
      key: "provider_participation",
      label: "Provider-driven drill evidence",
      passed: input.completedDrillWithProviderCount > 0,
      detail: input.completedDrillWithProviderCount > 0
        ? "At least one completed drill includes a linked provider participant."
        : "No completed provider-participated drill is recorded yet.",
    },
    {
      key: "accepted_evidence",
      label: "Accepted criterion evidence",
      passed: input.acceptedEvidenceCount > 0,
      detail: input.acceptedEvidenceCount > 0
        ? "At least one criterion evidence record has been accepted by a reviewer."
        : "Submit and accept criterion evidence before claiming readiness.",
    },
    {
      key: "verified_action",
      label: "Independently verified action closure",
      passed: input.verifiedActionCount > 0,
      detail: input.verifiedActionCount > 0
        ? "At least one action has closure evidence and an accountable verifier."
        : "Create an owned action and verify its closure separately from submission.",
    },
  ];

  return {
    readyForPilotAcceptance: gates.every((gate) => gate.passed),
    gates,
  };
}
