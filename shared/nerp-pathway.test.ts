import { describe, expect, it } from "vitest";
import { getNerpNextStep, NERP_PATHWAY_ENTRY_PATH } from "./nerp-pathway";

describe("NERP pathway progression", () => {
  it("uses the canonical campaign entry path", () => {
    expect(NERP_PATHWAY_ENTRY_PATH).toBe("/programs/nerp-acls/start");
  });

  it("requires payment before learning", () => {
    expect(
      getNerpNextStep({ paymentConfirmed: false, blsCognitiveComplete: false })
    ).toBe("payment");
  });

  it("starts BLS cognitive after the first confirmed payment even when the pathway is not fully paid", () => {
    expect(
      getNerpNextStep({ paymentConfirmed: true, blsCognitiveComplete: false })
    ).toBe("bls_cognitive");
  });

  it("allows ACLS cognitive only after BLS cognitive completion", () => {
    expect(
      getNerpNextStep({ paymentConfirmed: true, blsCognitiveComplete: true })
    ).toBe("acls_cognitive");
  });
});
