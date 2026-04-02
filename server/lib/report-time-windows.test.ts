import { describe, it, expect } from "vitest";
import { rollingHoursAgo } from "./report-time-windows";

describe("rollingHoursAgo", () => {
  it("returns a timestamp approximately lastDays * 24h before now", () => {
    const lastDays = 7;
    const d = rollingHoursAgo(lastDays);
    const diffMs = Date.now() - d.getTime();
    const expected = lastDays * 24 * 60 * 60 * 1000;
    expect(Math.abs(diffMs - expected)).toBeLessThan(2000);
  });
});
