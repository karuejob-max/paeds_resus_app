import { describe, expect, it } from "vitest";
import { getNerpNextStep, NERP_PATHWAY_ENTRY_PATH } from "./nerp-pathway";

describe("NERP pathway progression", () => {
  it("uses the canonical campaign entry path", () => {
    expect(NERP_PATHWAY_ENTRY_PATH).toBe("/programs/nerp-acls/start");
  });

  it("requires payment before learning", () => {
    expect(
      getNerpNextStep({ paymentComplete: false, blsCognitiveComplete: false })
    ).toBe("payment");
  });

  it("starts BLS cognitive when payment is complete but BLS is incomplete", () => {
    expect(
      getNerpNextStep({ paymentComplete: true, blsCognitiveComplete: false })
    ).toBe("bls_cognitive");
  });

  it("allows ACLS cognitive only after BLS cognitive completion", () => {
    expect(
      getNerpNextStep({ paymentComplete: true, blsCognitiveComplete: true })
    ).toBe("acls_cognitive");
  });
});
