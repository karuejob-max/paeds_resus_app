import { describe, expect, it } from "vitest";
import { getNextRehearsal, summarizeSimulationDomains } from "./simulation-hub-mastery";

describe("Simulation Hub adaptive mastery", () => {
  it("turns event evidence into domain scores", () => {
    const summary = summarizeSimulationDomains([
      { timestamp: 1, type: "rhythm", description: "Recognised VF rhythm", correct: true },
      { timestamp: 2, type: "action", description: "CPR compressions", correct: false },
      { timestamp: 3, type: "team", description: "Closed-loop team order", correct: true },
    ]);
    expect(summary.find((domain) => domain.id === "recognition")?.score).toBe(100);
    expect(summary.find((domain) => domain.id === "technical-action")?.score).toBe(0);
  });

  it("selects the weakest evidenced domain for the next rehearsal", () => {
    const summary = summarizeSimulationDomains([
      { timestamp: 1, type: "rhythm", description: "Recognised rhythm", correct: true },
      { timestamp: 2, type: "cpr", description: "CPR action", correct: false },
    ]);
    expect(getNextRehearsal(summary)?.id).toBe("technical-action");
  });
});
