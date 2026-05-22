import { describe, expect, it } from "vitest";
import {
  childAgeMonthsForSafeTruth,
  formatChildAgeFromInput,
  formatChildAgeMonths,
  validatePatientAgeInput,
} from "./safetruth-age";

describe("childAgeMonthsForSafeTruth", () => {
  it("converts neonate days to approximate months", () => {
    expect(childAgeMonthsForSafeTruth({ ageBand: "neonate", neonateDays: "14" })).toBe(0);
    expect(childAgeMonthsForSafeTruth({ ageBand: "neonate", neonateDays: "28" })).toBe(1);
  });

  it("uses exact infant months", () => {
    expect(childAgeMonthsForSafeTruth({ ageBand: "infant", infantMonths: "6" })).toBe(6);
  });

  it("uses child years and optional extra months", () => {
    expect(
      childAgeMonthsForSafeTruth({
        ageBand: "child",
        childYears: "5",
        childExtraMonths: "3",
      })
    ).toBe(63);
    expect(childAgeMonthsForSafeTruth({ ageBand: "child", childYears: "5" })).toBe(60);
  });
});

describe("validatePatientAgeInput", () => {
  it("requires neonate days in range", () => {
    expect(validatePatientAgeInput({ ageBand: "neonate", neonateDays: "7" })).toBeNull();
    expect(validatePatientAgeInput({ ageBand: "neonate", neonateDays: "" })).toMatch(/days/);
  });

  it("requires infant months in range", () => {
    expect(validatePatientAgeInput({ ageBand: "infant", infantMonths: "4" })).toBeNull();
    expect(validatePatientAgeInput({ ageBand: "infant", infantMonths: "13" })).toMatch(/months/);
  });

  it("requires child years and validates extra months", () => {
    expect(
      validatePatientAgeInput({ ageBand: "child", childYears: "8", childExtraMonths: "2" })
    ).toBeNull();
    expect(
      validatePatientAgeInput({ ageBand: "child", childYears: "8", childExtraMonths: "12" })
    ).toMatch(/0 and 11/);
  });
});

describe("formatChildAgeFromInput", () => {
  it("formats each age band", () => {
    expect(formatChildAgeFromInput({ ageBand: "neonate", neonateDays: "3" })).toBe("3 days old");
    expect(formatChildAgeFromInput({ ageBand: "infant", infantMonths: "9" })).toBe("9 months old");
    expect(
      formatChildAgeFromInput({ ageBand: "child", childYears: "4", childExtraMonths: "2" })
    ).toBe("4 years 2 months old");
  });
});

describe("formatChildAgeMonths", () => {
  it("formats stored month totals", () => {
    expect(formatChildAgeMonths(63)).toBe("5 years 3 months old");
    expect(formatChildAgeMonths(60)).toBe("5 years old");
    expect(formatChildAgeMonths(6)).toBe("6 months old");
  });
});
