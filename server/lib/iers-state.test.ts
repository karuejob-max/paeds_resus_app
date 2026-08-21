import { describe, expect, it } from "vitest";
import { activationStateLabel, canAdvanceIersActivation, isActiveIersActivationState } from "./iers-state";

describe("IERS activation state policy", () => {
  it("requires notification before acknowledgement and response before arrival", () => {
    expect(canAdvanceIersActivation("draft", "triggered")).toBe(true);
    expect(canAdvanceIersActivation("triggered", "notifying")).toBe(true);
    expect(canAdvanceIersActivation("notifying", "acknowledged")).toBe(true);
    expect(canAdvanceIersActivation("acknowledged", "responding")).toBe(true);
    expect(canAdvanceIersActivation("responding", "at_scene")).toBe(true);
    expect(canAdvanceIersActivation("notifying", "at_scene")).toBe(false);
  });

  it("requires debrief before closure", () => {
    expect(canAdvanceIersActivation("stabilized", "debrief_pending")).toBe(true);
    expect(canAdvanceIersActivation("debrief_pending", "closed")).toBe(true);
    expect(canAdvanceIersActivation("stabilized", "closed")).toBe(false);
  });

  it("protects terminal states from reopening", () => {
    expect(canAdvanceIersActivation("closed", "notifying")).toBe(false);
    expect(canAdvanceIersActivation("cancelled", "triggered")).toBe(false);
    expect(isActiveIersActivationState("responding")).toBe(true);
    expect(isActiveIersActivationState("closed")).toBe(false);
  });

  it("formats state labels for providers", () => {
    expect(activationStateLabel("debrief_pending")).toBe("Debrief Pending");
  });
});
