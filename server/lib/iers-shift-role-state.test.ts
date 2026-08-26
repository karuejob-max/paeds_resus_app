import { describe, expect, it } from "vitest";
import {
  assertShiftRoleTransition,
  canTransitionShiftRole,
  decisionNeedsReason,
  normalizeShiftRoleKey,
} from "./iers-shift-role-state";

describe("IERS shift-role state machine", () => {
  it("permits explicit acceptance and decline from pending acceptance", () => {
    expect(canTransitionShiftRole("pending_acceptance", "accepted")).toBe(true);
    expect(canTransitionShiftRole("pending_acceptance", "declined")).toBe(true);
    expect(() => assertShiftRoleTransition("pending_acceptance", "accepted")).not.toThrow();
  });

  it("permits an approved UTL to be explicitly accepted", () => {
    expect(canTransitionShiftRole("approved", "accepted")).toBe(true);
    expect(() => assertShiftRoleTransition("approved", "accepted")).not.toThrow();
  });

  it("allows accepted roles to reset for explicit reassignment", () => {
    expect(canTransitionShiftRole("accepted", "pending_acceptance")).toBe(true);
    expect(() => assertShiftRoleTransition("accepted", "pending_acceptance")).not.toThrow();
  });

  it("rejects a direct jump from proposed to accepted", () => {
    expect(canTransitionShiftRole("proposed", "accepted")).toBe(false);
    expect(() => assertShiftRoleTransition("proposed", "accepted")).toThrow("Invalid shift-role transition");
  });

  it("keeps superseded and ended assignments historical", () => {
    expect(canTransitionShiftRole("accepted", "superseded")).toBe(true);
    expect(canTransitionShiftRole("accepted", "ended")).toBe(true);
    expect(canTransitionShiftRole("superseded", "pending_acceptance")).toBe(false);
    expect(canTransitionShiftRole("ended", "accepted")).toBe(false);
  });

  it("requires a reason for decline and supersession", () => {
    expect(decisionNeedsReason("declined")).toBe(true);
    expect(decisionNeedsReason("superseded")).toBe(true);
  });

  it("normalizes role keys for stable reporting", () => {
    expect(normalizeShiftRoleKey(" Airway / Breathing Lead ")).toBe("airway_breathing_lead");
  });
});
