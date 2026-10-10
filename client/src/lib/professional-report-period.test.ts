import { describe, expect, it } from "vitest";
import {
  getAutomaticProfessionalReportPeriod,
  getDefaultProfessionalReportPeriod,
} from "./professional-report-period";

describe("professional report periods", () => {
  const now = new Date(2026, 9, 10, 12, 0, 0);

  it("uses the current month through today for a monthly report", () => {
    expect(getDefaultProfessionalReportPeriod(now)).toEqual({
      start: "2026-10-01",
      end: "2026-10-10",
    });
  });

  it("uses the current quarter through today", () => {
    expect(getAutomaticProfessionalReportPeriod("quarterly", now)).toEqual({
      start: "2026-10-01",
      end: "2026-10-10",
    });
  });

  it("uses the current calendar year through today", () => {
    expect(getAutomaticProfessionalReportPeriod("annual", now)).toEqual({
      start: "2026-01-01",
      end: "2026-10-10",
    });
  });

  it("handles the first quarter and year boundary", () => {
    const january = new Date(2027, 0, 3, 12, 0, 0);
    expect(getAutomaticProfessionalReportPeriod("quarterly", january)).toEqual({
      start: "2027-01-01",
      end: "2027-01-03",
    });
    expect(getAutomaticProfessionalReportPeriod("annual", january)).toEqual({
      start: "2027-01-01",
      end: "2027-01-03",
    });
  });
});
