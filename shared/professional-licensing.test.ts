import { describe, expect, it } from "vitest";
import {
  getDefaultLicensingBody,
  getCountryName,
  PROFESSIONAL_COUNTRIES,
} from "./professional-licensing";

describe("professional licensing taxonomy", () => {
  it("contains the complete ISO country set with stable unique codes", () => {
    expect(PROFESSIONAL_COUNTRIES.length).toBe(249);
    expect(new Set(PROFESSIONAL_COUNTRIES.map(country => country.code)).size).toBe(249);
    expect(getCountryName("KE")).toBe("Kenya");
  });

  it("defaults Kenyan nurses to NCK", () => {
    expect(
      getDefaultLicensingBody({ countryCode: "KE", countryName: "Kenya", isNurse: true }),
    ).toBe("Nursing Council of Kenya (NCK)");
  });

  it("defaults other nurses to their country nursing regulator wording", () => {
    expect(
      getDefaultLicensingBody({ countryCode: "UG", countryName: "Uganda", isNurse: true }),
    ).toBe("Uganda Nurses and Midwives Council (UNMC)");
    expect(
      getDefaultLicensingBody({ countryCode: "XX", countryName: "Exampleland", isNurse: true }),
    ).toBe("Exampleland nursing council / licensing body");
  });
});

describe("Kenya regulator defaults", () => {
  it("suggests the regulator that matches the professional identity", () => {
    expect(getDefaultLicensingBody({ countryCode: "KE", isNurse: true, providerType: "nurse" })).toContain("Nursing Council of Kenya");
    expect(getDefaultLicensingBody({ countryCode: "KE", isNurse: false, providerType: "doctor" })).toContain("KMPDC");
    expect(getDefaultLicensingBody({ countryCode: "KE", isNurse: false, providerType: "pharmacist" })).toContain("Pharmacy and Poisons Board");
    expect(getDefaultLicensingBody({ countryCode: "UG", isNurse: false, providerType: "doctor" })).toContain("professional licensing body");
  });
});
