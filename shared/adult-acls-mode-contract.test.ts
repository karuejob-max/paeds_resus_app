import { describe, expect, it } from "vitest";
import { getAdultAclsModeLabel, isAdultAclsModeCompatible } from "./adult-acls-mode-contract";

describe("Adult ACLS presentation mode contract", () => {
  it("accepts only an authoritative mode that exactly matches the requested mode", () => {
    expect(isAdultAclsModeCompatible("standard", "standard")).toBe(true);
    expect(isAdultAclsModeCompatible("guided", "guided")).toBe(true);
    expect(isAdultAclsModeCompatible("standard", "guided")).toBe(false);
    expect(isAdultAclsModeCompatible("guided", "standard")).toBe(false);
    expect(isAdultAclsModeCompatible("standard", undefined)).toBe(false);
  });

  it("keeps mode labels explicit for learner-facing failure messages", () => {
    expect(getAdultAclsModeLabel("standard")).toBe("Standard assessment");
    expect(getAdultAclsModeLabel("guided")).toBe("Guided practice");
  });
});
