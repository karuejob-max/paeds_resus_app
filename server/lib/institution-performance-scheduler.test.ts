import { describe, expect, it } from "vitest";
import { scheduledInstitutionalPeriods } from "./institution-performance-scheduler";

describe("institutional performance scheduler periods", () => {
  it("targets the previous month, previous quarter, and previous calendar year in EAT", () => {
    expect(scheduledInstitutionalPeriods(new Date("2026-11-20T10:00:00.000Z"))).toEqual([
      { periodType: "monthly", periodStart: "2026-10-01" },
      { periodType: "quarterly", periodStart: "2026-07-01" },
      { periodType: "annual", periodStart: "2025-01-01" },
    ]);
  });

  it("rolls January back to the prior year without targeting an open period", () => {
    expect(scheduledInstitutionalPeriods(new Date("2026-01-01T01:00:00.000Z"))).toEqual([
      { periodType: "monthly", periodStart: "2025-12-01" },
      { periodType: "quarterly", periodStart: "2025-10-01" },
      { periodType: "annual", periodStart: "2025-01-01" },
    ]);
  });
});
