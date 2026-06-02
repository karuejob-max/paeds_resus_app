import { describe, expect, it } from "vitest";
import { isEligibleForFellowshipAutoCredit } from "./fellowship-resus-auto-credit";

describe("fellowship-resus-auto-credit", () => {
  it("allows auto-credit when primary maps to a fellowship condition with clinical activity", () => {
    expect(
      isEligibleForFellowshipAutoCredit({
        definitiveDiagnosis: "septic_shock",
        concurrentDiagnoses: [],
        phase: "DEFINITIVE_CARE",
        activeThreat: null,
        events: [{ type: "intervention_completed" }],
      })
    ).toBe(true);
  });

  it("rejects auto-credit without a fellowship-mappable primary diagnosis", () => {
    expect(
      isEligibleForFellowshipAutoCredit({
        definitiveDiagnosis: "general_resus",
        concurrentDiagnoses: [],
        phase: "DEFINITIVE_CARE",
        activeThreat: null,
        events: [{ type: "intervention_completed" }],
      })
    ).toBe(false);
  });

  it("allows auto-credit for DKA primary on definitive care without intervention events", () => {
    expect(
      isEligibleForFellowshipAutoCredit({
        definitiveDiagnosis: "dka",
        concurrentDiagnoses: ["septic_shock"],
        phase: "DEFINITIVE_CARE",
        activeThreat: null,
        events: [{ type: "phase_change" }],
      })
    ).toBe(true);
  });

  it("rejects auto-credit before post-primary phase even with a fellowship primary", () => {
    expect(
      isEligibleForFellowshipAutoCredit({
        definitiveDiagnosis: "dka",
        concurrentDiagnoses: [],
        phase: "INTERVENE",
        activeThreat: null,
        events: [{ type: "phase_change" }],
      })
    ).toBe(false);
  });

  it("does not treat co-diagnosis alone as auto-credit eligible", () => {
    expect(
      isEligibleForFellowshipAutoCredit({
        definitiveDiagnosis: null,
        concurrentDiagnoses: ["septic_shock"],
        phase: "SECONDARY_SURVEY",
        activeThreat: null,
        events: [{ type: "intervention_completed" }],
      })
    ).toBe(false);
  });
});
