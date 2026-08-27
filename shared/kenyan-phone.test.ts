import { describe, expect, it } from "vitest";
import {
  formatKenyanPhoneForDisplay,
  isValidKenyanPhoneNumber,
  normalizeKenyanPhoneNumber,
} from "./kenyan-phone";

describe("Kenyan phone normalization", () => {
  it.each([
    ["254712345678", "254712345678"],
    ["+254712345678", "254712345678"],
    ["0712345678", "254712345678"],
    ["712345678", "254712345678"],
    ["00 254 712 345 678", "254712345678"],
    ["+254 712 345 678", "254712345678"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeKenyanPhoneNumber(input)).toBe(expected);
    expect(formatKenyanPhoneForDisplay(input)).toBe(expected);
    expect(isValidKenyanPhoneNumber(input)).toBe(true);
  });

  it.each([
    "",
    "071234567",
    "0612345678",
    "254612345678",
    "25471234567",
    "not a phone",
  ])("rejects invalid Kenyan mobile input %s", input => {
    expect(normalizeKenyanPhoneNumber(input)).toBeNull();
    expect(isValidKenyanPhoneNumber(input)).toBe(false);
  });
});
