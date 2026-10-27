import { describe, expect, it } from "vitest";
import {
  ADULT_ACLS_SCENARIOS,
  canEndAdultAclsSimulation,
  createAdultAclsSimulation,
  getAdultAclsScoreBreakdown,
  reduceAdultAclsSimulation,
  type AdultAclsCommand,
  type AdultAclsScenarioId,
} from "./adult-acls-simulation-world";
import { ADULT_ACLS_CASE_DEFINITIONS, type AdultAclsCaseDefinition } from "./adult-acls-case-definitions";

/** Plays a command list; ends the rehearsal ONLY if the sequence itself contains end_rehearsal. */
function play(id: AdultAclsScenarioId, commands: readonly AdultAclsCommand[]) {
  let state = createAdultAclsSimulation(id);
  for (const command of commands) {
    state = reduceAdultAclsSimulation(state, command);
    if (state.patient.phase === "failed") break;
  }
  return { state, breakdown: getAdultAclsScoreBreakdown(state) };
}
const passes = (id: AdultAclsScenarioId, commands: readonly AdultAclsCommand[]) => {
  const { state, breakdown } = play(id, commands);
  return state.patient.phase === "ended" && breakdown.score >= 70;
};
const END: AdultAclsCommand = { type: "end_rehearsal" };
const ALL_COMMAND_VARIANTS: AdultAclsCommand[] = [
  ...(["rhythm", "pulse", "blood_pressure", "breathing", "mental_status", "spo2", "heart_rate"] as const).map((target) => ({ type: "assess", target }) as AdultAclsCommand),
  { type: "reassess" }, { type: "start_cpr" }, { type: "give_oxygen" }, { type: "assist_ventilation" }, { type: "support_perfusion" },
  { type: "defibrillate" }, { type: "synchronized_cardioversion" }, { type: "prepare_synchronized_cardioversion" }, { type: "pace" },
  { type: "give_epinephrine" }, { type: "give_antiarrhythmic" }, { type: "give_adenosine" }, { type: "give_atropine" },
  { type: "obtain_ecg" }, { type: "give_aspirin" }, { type: "activate_reperfusion" },
  { type: "treat_reversible_cause", cause: "hypovolaemia" }, { type: "treat_reversible_cause", cause: "prolonged_hypoxia" }, { type: "treat_reversible_cause", cause: "tension_pneumothorax" },
];
/** Groups consecutive identical commands so "oxygen x6" is one run for drop-one tests. */
function runs(path: readonly AdultAclsCommand[]) {
  const out: AdultAclsCommand[][] = [];
  for (const command of path) {
    const last = out[out.length - 1];
    if (last && JSON.stringify(last[0]) === JSON.stringify(command)) last.push(command); else out.push([command]);
  }
  return out;
}

describe("ACLS case definition harness", () => {
  it("has exactly one definition for every scenario, each with 2025 guideline references", () => {
    expect(ADULT_ACLS_CASE_DEFINITIONS.map((d) => d.id).sort()).toEqual(ADULT_ACLS_SCENARIOS.map((s) => s.id).sort());
    for (const definition of ADULT_ACLS_CASE_DEFINITIONS) expect(definition.guidelines.length, definition.id).toBeGreaterThan(0);
  });

  describe.each(ADULT_ACLS_CASE_DEFINITIONS.map((d) => [d.id, d] as [AdultAclsScenarioId, AdultAclsCaseDefinition]))("%s", (id, definition) => {
    it("can be won honestly with a safe end state, no critical failure, and no poor choice", () => {
      const { state, breakdown } = play(id, definition.honestPath);
      expect(state.patient.phase).toBe("ended");
      expect(breakdown.criticalFailures, breakdown.reasons.join(" | ")).toBe(true);
      expect(breakdown.poorChoices).toEqual([]);
      expect(breakdown.score, breakdown.reasons.join(" | ")).toBeGreaterThanOrEqual(70);
    });

    it("fails when any required step (run of identical commands) is dropped", () => {
      const groups = runs(definition.honestPath);
      groups.forEach((group, index) => {
        if (group[0].type === "end_rehearsal") return;
        const without = groups.filter((_, i) => i !== index).flat();
        expect(passes(id, without), `dropping ${JSON.stringify(group[0])} x${group.length} still passes`).toBe(false);
      });
    });

    it("cannot be passed by doing nothing or by assess/reassess only", () => {
      expect(passes(id, [END])).toBe(false);
      expect(passes(id, [{ type: "assess", target: "rhythm" }, { type: "reassess" }, END])).toBe(false);
    });

    it("cannot be passed by spamming any single command", () => {
      for (const command of ALL_COMMAND_VARIANTS) {
        const spam = Array.from({ length: 25 }, () => command);
        expect(passes(id, [...spam, END]), `spamming ${JSON.stringify(command)}`).toBe(false);
      }
    });

    it("cannot be passed in reverse order", () => {
      const body = definition.honestPath.filter((c) => c.type !== "end_rehearsal");
      expect(passes(id, [...body].reverse().concat(END))).toBe(false);
    });

    it("does not pass any declared poor-choice path", () => {
      for (const bad of definition.mustNotPassPaths ?? []) expect(passes(id, bad.path), bad.label).toBe(false);
    });
  });
});
