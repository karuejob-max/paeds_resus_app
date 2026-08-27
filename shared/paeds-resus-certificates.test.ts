import { describe, expect, it } from "vitest";
import {
  CERTIFICATE_DISPLAY_LABELS,
  getCertificateDisplayLabel,
  READINESS_PATHWAY_LABELS,
} from "./paeds-resus-certificates";

describe("Paeds Resus universal certificate labels", () => {
  it("labels the Phase 2 certificate as an online simulation completion proof", () => {
    expect(getCertificateDisplayLabel("paeds_resus_phase2")).toBe(
      "Paeds Resus Phase 2 — Online Simulations"
    );
  });

  it.each([
    ["bls", "Paeds Resus Certified BLS Provider"],
    ["acls", "Paeds Resus Certified ACLS Provider"],
    ["pals", "Paeds Resus Certified PALS Provider"],
    ["nrp", "Paeds Resus Certified NRP Provider"],
  ])("keeps %s provider wording distinct from the internal certificate key", (programType, expected) => {
    const key = `paeds_resus_${programType}_provider`;
    expect(getCertificateDisplayLabel(key)).toBe(expected);
    expect(CERTIFICATE_DISPLAY_LABELS[key]).toBe(expected);
  });

  it("names all three entry paths without conflating them", () => {
    expect(READINESS_PATHWAY_LABELS.ierp).toContain("Intern Emergency Readiness Program");
    expect(READINESS_PATHWAY_LABELS.nerp).toContain("Nurses Emergency Readiness Program");
    expect(READINESS_PATHWAY_LABELS.open_enrolment).toBe(
      "Paeds Resus Open Enrolment Pathway"
    );
  });
});
