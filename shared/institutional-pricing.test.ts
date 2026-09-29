import { describe, expect, it } from "vitest";
import {
  FOUNDING_PARTNER_TERM_YEARS,
  calculateInstitutionalPrice,
  foundingPartnerIersKes,
  participationRequirement,
  privateModeKes,
  standardIersKes,
} from "./institutional-pricing";

describe("institutional pricing policy", () => {
  it("uses the approved five-year Founding Partner term", () => {
    expect(FOUNDING_PARTNER_TERM_YEARS).toBe(5);
    expect(foundingPartnerIersKes("level_4")).toBe(100_000);
    expect(foundingPartnerIersKes("level_5")).toBe(175_000);
    expect(foundingPartnerIersKes("level_6")).toBe(300_000);
  });

  it("keeps standard tiers explicit", () => {
    expect(standardIersKes("level_4")).toBe(200_000);
    expect(standardIersKes("level_5")).toBe(350_000);
    expect(standardIersKes("level_6")).toBe(600_000);
  });

  it("applies the private-mode premium without changing the standard source price", () => {
    expect(privateModeKes(200_000)).toBe(260_000);
    expect(calculateInstitutionalPrice({ product: "iers", facilityLevel: "level_4", pricingTier: "standard", dataSharingStatus: "private_mode" }).amountKes).toBe(260_000);
  });

  it("scales participation quality thresholds by facility level", () => {
    expect(participationRequirement("level_4")).toBe(1);
    expect(participationRequirement("level_5")).toBe(2);
    expect(participationRequirement("level_6")).toBe(3);
  });
});
