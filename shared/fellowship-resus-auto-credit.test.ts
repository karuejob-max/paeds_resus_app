import { describe, expect, it } from "vitest";
import { isEligibleForFellowshipAutoCredit } from "./fellowship-resus-auto-credit";

const dkaSteps = [
  { id: "dka_01_confirm" },
  { id: "dka_02_severity" },
];

describe("fellowship-resus-auto-credit", () => {
  it("rejects credit when primary set but definitive care not complete", () => {
    expect(
      isEligibleForFellowshipAutoCredit({
        definitiveDiagnosis: "septic_shock",
        concurrentDiagnoses: [],
        phase: "SECONDARY_SURVEY",
        activeThreat: null,
        events: [{ type: "intervention_completed" }],
        definitiveCareProgress: null,
      })
    ).toBe(false);
  });

  it("rejects credit in DEFINITIVE_CARE without completed steps", () => {
    expect(
      isEligibleForFellowshipAutoCredit({
        definitiveDiagnosis: "dka",
        concurrentDiagnoses: [],
        phase: "DEFINITIVE_CARE",
        activeThreat: null,
        events: [{ type: "phase_change" }],
        definitiveCareProgress: { fellowshipId: "dka", stepStatuses: {} },
        definitiveCareSteps: dkaSteps,
      })
    ).toBe(false);
  });

  it("allows credit after definitive care complete with all steps done", () => {
    expect(
      isEligibleForFellowshipAutoCredit({
        definitiveDiagnosis: "dka",
        concurrentDiagnoses: ["septic_shock"],
        phase: "ONGOING",
        activeThreat: null,
        events: [{ type: "phase_change" }],
        definitiveCareProgress: {
          fellowshipId: "dka",
          stepStatuses: { dka_01_confirm: "done", dka_02_severity: "done" },
          completedAt: Date.now(),
        },
        definitiveCareSteps: dkaSteps,
      })
    ).toBe(true);
  });

  it("allows credit when all required steps done/skipped without explicit completedAt", () => {
    expect(
      isEligibleForFellowshipAutoCredit({
        definitiveDiagnosis: "dka",
        concurrentDiagnoses: [],
        phase: "DEFINITIVE_CARE",
        activeThreat: null,
        events: [],
        definitiveCareProgress: {
          fellowshipId: "dka",
          stepStatuses: { dka_01_confirm: "done", dka_02_severity: "skipped" },
        },
        definitiveCareSteps: dkaSteps,
      })
    ).toBe(true);
  });

  it("rejects auto-credit without a fellowship-mappable primary diagnosis", () => {
    expect(
      isEligibleForFellowshipAutoCredit({
        definitiveDiagnosis: "general_resus",
        concurrentDiagnoses: [],
        phase: "ONGOING",
        activeThreat: null,
        events: [{ type: "intervention_completed" }],
        definitiveCareProgress: {
          fellowshipId: "general_resus",
          stepStatuses: {},
          completedAt: Date.now(),
        },
      })
    ).toBe(false);
  });

  it("rejects auto-credit before definitive care phase even with fellowship primary", () => {
    expect(
      isEligibleForFellowshipAutoCredit({
        definitiveDiagnosis: "dka",
        concurrentDiagnoses: [],
        phase: "INTERVENE",
        activeThreat: null,
        events: [{ type: "phase_change" }],
        definitiveCareProgress: {
          fellowshipId: "dka",
          stepStatuses: {},
          completedAt: Date.now(),
        },
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

  it("rejects credit when progress fellowshipId mismatches primary", () => {
    expect(
      isEligibleForFellowshipAutoCredit({
        definitiveDiagnosis: "dka",
        concurrentDiagnoses: [],
        phase: "ONGOING",
        activeThreat: null,
        events: [],
        definitiveCareProgress: {
          fellowshipId: "septic_shock",
          stepStatuses: {},
          completedAt: Date.now(),
        },
      })
    ).toBe(false);
  });
});
