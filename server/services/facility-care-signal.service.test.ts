import { describe, expect, it } from "vitest";
import { calculateFacilityReportingRate } from "./facility-care-signal.service";

describe("calculateFacilityReportingRate", () => {
  it("counts only reporters registered at the facility", () => {
    expect(calculateFacilityReportingRate([1, 2, 3], [1, 2, 88])).toBe(67);
  });

  it("returns zero when no providers are registered", () => {
    expect(calculateFacilityReportingRate([], [1, 2])).toBe(0);
  });

  it("never exceeds 100 percent even with duplicate or unrelated reporter ids", () => {
    expect(calculateFacilityReportingRate([1, 2], [1, 1, 2, 999, 1000])).toBe(100);
  });
});
