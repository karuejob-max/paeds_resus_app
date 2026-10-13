import { describe, expect, it } from "vitest";
import { decideAdultAclsResume } from "./adult-acls-session-policy";

describe("Adult ACLS session resume policy", () => {
  it("waits for the authoritative refetch before restoring cached session data", () => {
    expect(decideAdultAclsResume({ isFetching: true, activeScenarioId: "unstable-bradycardia", selectedScenarioId: "unstable-bradycardia" })).toBe("wait");
  });

  it("resumes only when the active session matches the selected scenario", () => {
    expect(decideAdultAclsResume({ isFetching: false, activeScenarioId: "stable-narrow-tachycardia", selectedScenarioId: "stable-narrow-tachycardia" })).toBe("resume");
    expect(decideAdultAclsResume({ isFetching: false, activeScenarioId: "unstable-bradycardia", selectedScenarioId: "stable-narrow-tachycardia" })).toBe("start_selected");
  });

  it("starts the selected scenario when no active session remains", () => {
    expect(decideAdultAclsResume({ isFetching: false, activeScenarioId: null, selectedScenarioId: "pea" })).toBe("start_selected");
  });
});
