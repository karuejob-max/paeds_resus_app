import { describe, expect, it } from "vitest";
import {
  EAC_EMERGENCY_NUMBERS,
  formatEacEmergencyInline,
  formatKenyaEmergencyShort,
} from "./emergency-numbers";

describe("EAC_EMERGENCY_NUMBERS", () => {
  it("includes Kenya baseline and EAC expansion countries", () => {
    const codes = EAC_EMERGENCY_NUMBERS.map((e) => e.country);
    expect(codes).toContain("kenya");
    expect(codes).toContain("uganda");
    expect(codes).toContain("tanzania");
    expect(codes).toContain("rwanda");
    expect(codes).toContain("drc");
  });

  it("lists Kenya 999/112", () => {
    const kenya = EAC_EMERGENCY_NUMBERS.find((e) => e.country === "kenya");
    expect(kenya?.primary).toEqual(["999", "112"]);
  });
});

describe("formatEacEmergencyInline", () => {
  it("includes country labels and numbers", () => {
    const text = formatEacEmergencyInline();
    expect(text).toMatch(/Kenya 999 or 112/);
    expect(text).toMatch(/Rwanda 912/);
    expect(text).toMatch(/Tanzania 114 or 112/);
  });
});

describe("formatKenyaEmergencyShort", () => {
  it("returns Kenya short form", () => {
    expect(formatKenyaEmergencyShort()).toBe("999 or 112 in Kenya");
  });
});
