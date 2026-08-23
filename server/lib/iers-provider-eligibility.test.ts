import { describe, expect, it } from "vitest";
import { displayStaffRole, isRegisteredRnProfile } from "./iers-provider-eligibility";

describe("IERS registered Staff/RN eligibility", () => {
  it("accepts the authoritative nurse role fields", () => {
    expect(isRegisteredRnProfile({ staffRole: "nurse" })).toBe(true);
    expect(isRegisteredRnProfile({ providerType: "nurse" })).toBe(true);
  });

  it("accepts non-student Staff/RN cadre values", () => {
    for (const cadre of ["MSN", "BSN", "KRN", "Other RN", "Registered Nurse", "Staff, RN"]) {
      expect(isRegisteredRnProfile({ cadre })).toBe(true);
    }
  });

  it("accepts RN recorded in an older free-text Other Staff field", () => {
    expect(isRegisteredRnProfile({ cadre: "Other Staff", cadreOther: "RN" })).toBe(true);
  });

  it("excludes nursing students and non-RN staff", () => {
    expect(isRegisteredRnProfile({ cadre: "BSN Student" })).toBe(false);
    expect(isRegisteredRnProfile({ providerType: "nurse", cadre: "BSN Student" })).toBe(false);
    expect(isRegisteredRnProfile({ cadre: "Other Staff", cadreOther: "Receptionist" })).toBe(false);
    expect(isRegisteredRnProfile({ staffRole: "doctor", providerType: "doctor", cadre: "MO" })).toBe(false);
  });

  it("normalizes registered RN providers as nurses for downstream pickers", () => {
    expect(displayStaffRole({ staffRole: "other", cadre: "KRN" })).toBe("nurse");
    expect(displayStaffRole({ staffRole: "doctor", cadre: "MO" })).toBe("doctor");
  });
});
