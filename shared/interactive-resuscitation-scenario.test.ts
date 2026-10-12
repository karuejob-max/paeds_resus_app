import { describe, expect, it } from "vitest";
import {
  getInteractiveScenarioNode,
  startInteractiveScenario,
  submitInteractiveScenarioChoice,
} from "./interactive-resuscitation-scenario";

describe("interactive instructor-mediated resuscitation scenario", () => {
  it("starts with a scene and a focused first assessment", () => {
    const state = startInteractiveScenario();
    const node = getInteractiveScenarioNode(state);

    expect(state.completed).toBe(false);
    expect(node.id).toBe("first-contact");
    expect(node.prompt).toContain("What do you do first?");
    expect(node.choices.some((choice) => choice.kind === "assessment")).toBe(true);
  });

  it("pauses on an unsafe choice instead of silently advancing the patient", () => {
    const state = startInteractiveScenario();
    const result = submitInteractiveScenarioChoice(state, "start-compressions");

    expect(result.accepted).toBe(false);
    expect(result.completed).toBe(false);
    expect(result.state.nodeId).toBe("first-contact");
    expect(result.state.events.at(-1)?.type).toBe("coaching");
    expect(result.feedback).toContain("safe approach");
  });

  it("reveals only the requested finding after a correct assessment or action", () => {
    let state = startInteractiveScenario();
    const result = submitInteractiveScenarioChoice(state, "approach-check-response");

    expect(result.accepted).toBe(true);
    expect(result.finding).toContain("does not respond");
    expect(result.nextPrompt).toContain("next priority");
    expect(result.state.nodeId).toBe("activate-help");
    expect(result.state.events.map((event) => event.type)).toEqual(["scene", "assessment", "finding"]);

    state = result.state;
    const activation = submitInteractiveScenarioChoice(state, "activate-response");
    expect(activation.finding).toContain("crash cart");
    expect(activation.state.nodeId).toBe("ask-airway");
  });

  it("completes the first assessment loop with a truthful next focus", () => {
    let state = startInteractiveScenario();
    const choices = [
      "approach-check-response",
      "activate-response",
      "ask-airway",
      "clear-and-reposition",
      "ask-breathing-and-spo2",
      "bvm-oxygen",
      "reassess-handoff",
    ];

    for (const choice of choices) {
      const result = submitInteractiveScenarioChoice(state, choice);
      expect(result.accepted).toBe(true);
      state = result.state;
    }

    expect(state.completed).toBe(true);
    expect(state.events.at(-1)?.type).toBe("complete");
    expect(state.events.at(-1)?.description).toContain("first assessment loop");
  });
});
