import { describe, expect, it } from "vitest";
import {
  buildSummativeRetryBlockedCopy,
  formatRetryAtEat,
  formatSummativeForbiddenMessage,
} from "./summative-retry-display";

describe("summative-retry-display", () => {
  it("formats retry time in EAT", () => {
    const s = formatRetryAtEat("2026-06-03T07:00:00.000Z");
    expect(s).toMatch(/2026/);
    expect(s.length).toBeGreaterThan(10);
  });

  it("builds max-attempts copy with used count", () => {
    const copy = buildSummativeRetryBlockedCopy({
      attempts: 3,
      blockKind: "max_attempts",
      retryAvailableAt: null,
    });
    expect(copy?.lines[0]).toBe("Attempts used: 3 of 3.");
  });

  it("builds cooldown copy with EAT timestamp", () => {
    const copy = buildSummativeRetryBlockedCopy({
      attempts: 1,
      blockKind: "cooldown",
      retryAvailableAt: "2026-06-04T07:00:00.000Z",
    });
    expect(copy?.lines.some((l) => l.includes("You can retry after"))).toBe(true);
  });

  it("formats forbidden server message", () => {
    const msg = formatSummativeForbiddenMessage({
      attempts: 2,
      blockKind: "cooldown",
      retryAvailableAt: new Date("2026-06-04T07:00:00.000Z"),
    });
    expect(msg).toContain("Attempts used: 2 of 3");
  });
});
