import { describe, expect, it } from "vitest";
import { deriveUtlReadinessStatus, isCriticalReadinessGap } from "./iers-readiness-state";

describe("UTL readiness state", () => {
  it("requires critical items to be present and functional", () => {
    expect(isCriticalReadinessGap({ isCritical: true }, { itemStatus: "missing" })).toBe(true);
    expect(isCriticalReadinessGap({ isCritical: true }, { itemStatus: "present_and_functional" })).toBe(false);
  });

  it("returns ready only when every observed item passes", () => {
    expect(deriveUtlReadinessStatus([{ isCritical: true }, { isCritical: false }], [{ itemStatus: "present_and_functional" }, { itemStatus: "present_and_functional" }])).toBe("ready");
  });

  it("distinguishes non-critical gaps from critical blockers", () => {
    expect(deriveUtlReadinessStatus([{ isCritical: true }, { isCritical: false }], [{ itemStatus: "present_and_functional" }, { itemStatus: "missing" }])).toBe("ready_with_gaps");
    expect(deriveUtlReadinessStatus([{ isCritical: true }, { isCritical: false }], [{ itemStatus: "expired" }, { itemStatus: "present_and_functional" }])).toBe("not_ready");
  });
});
