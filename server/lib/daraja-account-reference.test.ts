import { describe, it, expect } from "vitest";
import {
  buildStkAccountReference,
  normalizeDarajaAccountReference,
  DARAJA_ACCOUNT_REFERENCE_MAX_LEN,
} from "./daraja-account-reference";

describe("buildStkAccountReference", () => {
  it("uses first name word and enrollment id", () => {
    expect(buildStkAccountReference({ enrollmentId: 42, learnerName: "Mary Wanjiku", userId: 1 })).toBe(
      "MARYE42"
    );
  });

  it("falls back to user id when name missing", () => {
    expect(buildStkAccountReference({ enrollmentId: 7, learnerName: null, userId: 99 })).toBe("U99E7");
  });

  it("respects max length", () => {
    expect(
      buildStkAccountReference({ enrollmentId: 1, learnerName: "A".repeat(20), userId: 1 }).length
    ).toBeLessThanOrEqual(DARAJA_ACCOUNT_REFERENCE_MAX_LEN);
  });
});

describe("normalizeDarajaAccountReference", () => {
  it("strips non-alphanumeric", () => {
    expect(normalizeDarajaAccountReference("ab-cd_12")).toBe("ABCD12");
  });
});
