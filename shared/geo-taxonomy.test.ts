/**
 * Tests for the shared country geo-taxonomy config, used by BOTH Care
 * Signal and Safe-Truth (gap-analysis queue item #11, "global from day 1").
 */
import { describe, it, expect } from "vitest";
import { getCountryGeoConfig, countryNameToIso2, COUNTRY_GEO_CONFIG } from "./geo-taxonomy";

describe("getCountryGeoConfig", () => {
  it("returns Kenya's config with a populated admin_level_1 options list", () => {
    const config = getCountryGeoConfig("Kenya");
    expect(config.isoCode).toBe("KE");
    expect(config.adminLevel1Label).toBe("County");
    expect(config.adminLevel1Options).not.toBeNull();
    expect(config.adminLevel1Options!.length).toBeGreaterThan(0);
  });

  it("returns Uganda's correct label ('District'), per the doc's own example", () => {
    expect(getCountryGeoConfig("Uganda").adminLevel1Label).toBe("District");
  });

  it("falls back to a generic config for an unlisted country, not an error", () => {
    const config = getCountryGeoConfig("Wakanda");
    expect(config.isoCode).toBe("OT");
    expect(config.adminLevel1Label).toBeTruthy();
    expect(config.adminLevel1Options).toBeNull();
  });

  it("every configured country has both admin-level labels set", () => {
    for (const [name, config] of Object.entries(COUNTRY_GEO_CONFIG)) {
      expect(config.adminLevel1Label, `${name} adminLevel1Label`).toBeTruthy();
      expect(config.adminLevel2Label, `${name} adminLevel2Label`).toBeTruthy();
    }
  });
});

describe("countryNameToIso2", () => {
  it("resolves known country names to their ISO2 code", () => {
    expect(countryNameToIso2("Kenya")).toBe("KE");
    expect(countryNameToIso2("Rwanda")).toBe("RW");
  });

  it("passes through an already-ISO2-looking code unchanged (uppercased)", () => {
    expect(countryNameToIso2("ke")).toBe("KE");
  });

  it("falls back to the generic code for an unrecognized, non-ISO2 name", () => {
    expect(countryNameToIso2("Wakanda")).toBe("OT");
  });
});
