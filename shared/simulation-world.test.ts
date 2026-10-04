import { describe, expect, it } from "vitest";
import { calculateSimulationWorldAssessment, createSimulationWorld, parseSimulationWorldCommand, reduceSimulationWorld } from "./simulation-world";

describe("simulation world", () => {
  it("keeps physiology deterministic and exposes hidden observations through actions", () => {
    const start = createSimulationWorld("septic-shock-arrest", "team_leader");
    const assessed = reduceSimulationWorld(start, { type: "assess", target: "spo2" });
    expect(assessed.patient.spo2).toBe(86);
    expect(assessed.events.at(-1)?.description).toContain("SpO₂ 86%");
    expect(assessed.elapsedSeconds).toBe(1);
  });

  it("records delegation and closed-loop communication as separate observable behaviours", () => {
    const start = createSimulationWorld("septic-shock-arrest", "team_leader");
    const delegated = reduceSimulationWorld(start, { type: "delegate", target: "airway_ventilation", task: "Assess and support breathing" });
    const closed = reduceSimulationWorld(delegated, { type: "acknowledge", target: "airway_ventilation" });
    expect(closed.npcs[0].status).toBe("acknowledged");
    expect(closed.competencies.delegation).toBeGreaterThan(0);
    expect(closed.competencies.closedLoop).toBeGreaterThan(0);
  });

  it("creates a critical safety failure for shocking a non-shockable rhythm", () => {
    const start = createSimulationWorld("septic-shock-arrest", "team_leader");
    const next = reduceSimulationWorld(start, { type: "shock" });
    expect(next.criticalFailures).toHaveLength(1);
    expect(next.competencies.safety).toBeLessThan(60);
    expect(calculateSimulationWorldAssessment(next).evidenceEligible).toBe(false);
  });

  it("parses natural language into structured commands without letting language change physiology", () => {
    expect(parseSimulationWorldCommand("Mary, airway")).toEqual({ type: "delegate", target: "airway_ventilation", task: "Mary, airway" });
    expect(parseSimulationWorldCommand("start compressions")).toEqual({ type: "start_cpr" });
    expect(parseSimulationWorldCommand("check sats")).toEqual({ type: "assess", target: "spo2" });
  });
});
