import { describe, expect, it } from "vitest";
import { looksLikeBedsideClinicalRequest } from "./gemini-user-assist";

describe("gemini-user-assist safety", () => {
  it("flags dosing and live-patient requests", () => {
    expect(looksLikeBedsideClinicalRequest("What adrenaline dose for 12 kg now?")).toBe(true);
    expect(looksLikeBedsideClinicalRequest("My patient is crashing fluid bolus?")).toBe(true);
  });

  it("allows platform and learning questions", () => {
    expect(looksLikeBedsideClinicalRequest("How do I enroll in the DKA micro-course?")).toBe(false);
    expect(looksLikeBedsideClinicalRequest("Why did I fail the formative quiz?")).toBe(false);
  });
});
