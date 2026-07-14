import { describe, expect, it } from "vitest";
import { computeTrend } from "./fpkb-pattern-detector";

describe("computeTrend", () => {
  it("returns INSUFFICIENT_DATA with fewer than 4 distinct periods", () => {
    expect(computeTrend(["2026-01", "2026-02", "2026-03"])).toBe("INSUFFICIENT_DATA");
  });

  it("detects an increasing trend", () => {
    const periods = [
      "2026-01",
      "2026-02",
      "2026-03", "2026-03", "2026-03",
      "2026-04", "2026-04", "2026-04", "2026-04",
    ];
    expect(computeTrend(periods)).toBe("INCREASING");
  });

  it("detects a decreasing trend", () => {
    const periods = [
      "2026-01", "2026-01", "2026-01", "2026-01",
      "2026-02", "2026-02", "2026-02",
      "2026-03",
      "2026-04",
    ];
    expect(computeTrend(periods)).toBe("DECREASING");
  });

  it("detects a stable trend", () => {
    const periods = [
      "2026-01", "2026-01",
      "2026-02", "2026-02",
      "2026-03", "2026-03",
      "2026-04", "2026-04",
    ];
    expect(computeTrend(periods)).toBe("STABLE");
  });
});
