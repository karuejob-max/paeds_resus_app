import { describe, expect, it } from "vitest";
import {
  applyVitalsAutofillToEvidence,
  clinicalEvidenceProgress,
  isClinicalEvidenceComplete,
  setClinicalEvidenceEntry,
} from "./clinical-evidence";
import {
  FLUID_OVERLOAD_EVIDENCE,
  getFellowshipClinicalRigorPack,
} from "./fellowship-clinical-rigor";
import {
  canShowDiagnosisSelection,
  getSampleStepFields,
  getSecondarySurveyFields,
  isSampleStepComplete,
  resolveRigorConditionCandidates,
} from "./secondary-survey-gating";

describe("clinical-evidence", () => {
  it("requires each field to have value or not_available", () => {
    const fields = getFellowshipClinicalRigorPack("dka").symptoms;
    expect(isClinicalEvidenceComplete(fields, {})).toBe(false);
    const partial = setClinicalEvidenceEntry({}, fields[0].id, { status: "present" });
    expect(isClinicalEvidenceComplete(fields, partial)).toBe(false);
  });

  it("tracks progress per field", () => {
    const fields = FLUID_OVERLOAD_EVIDENCE.slice(0, 2);
    const rec = {
      [fields[0].id]: { status: "absent" as const },
    };
    const p = clinicalEvidenceProgress(fields, rec);
    expect(p.completed).toBe(1);
    expect(p.total).toBe(2);
  });

  it("autofills glucose evidence from primary survey vitals", () => {
    const fields = getFellowshipClinicalRigorPack("dka").diagnosticEvidence;
    const glucoseField = fields.find((f) => f.id === "dka_ev_glucose")!;
    const next = applyVitalsAutofillToEvidence(fields, {}, { glucose: 28 });
    expect(next[glucoseField.id]).toEqual({ status: "value", value: "28" });
  });

  it("does not overwrite existing glucose evidence on autofill", () => {
    const fields = getFellowshipClinicalRigorPack("dka").diagnosticEvidence;
    const existing = setClinicalEvidenceEntry({}, "dka_ev_glucose", {
      status: "not_available",
    });
    const next = applyVitalsAutofillToEvidence(fields, existing, { glucose: 28 });
    expect(next.dka_ev_glucose).toEqual({ status: "not_available" });
  });
});

describe("secondary-survey-gating", () => {
  it("blocks diagnosis until sample and evidence complete", () => {
    expect(
      canShowDiagnosisSelection({
        secondarySurveyStep: "sample",
        rigorConditionCandidates: ["dka"],
      })
    ).toBe(false);
  });

  it("resolves DKA from hyperglycaemia threat", () => {
    const ids = resolveRigorConditionCandidates({
      threats: [{ id: "hyperglycaemia", name: "Hyperglycaemia" }],
    });
    expect(ids).toContain("dka");
  });

  it("uses primary pack only for SAMPLE fields (no duplicate allergies from merge)", () => {
    const merged = getSecondarySurveyFields({
      rigorConditionCandidates: ["dka", "seriously_ill_child"],
    });
    const dkaOnly = getFellowshipClinicalRigorPack("dka");
    expect(merged.sampleFields.map((f) => f.id)).toEqual(dkaOnly.sampleFields.map((f) => f.id));
    expect(merged.symptoms.map((f) => f.id)).toEqual(dkaOnly.symptoms.map((f) => f.id));
  });

  it("unifies SAMPLE step into one ordered field list", () => {
    const fields = getSampleStepFields({ rigorConditionCandidates: ["dka"] });
    const pack = getFellowshipClinicalRigorPack("dka");
    expect(fields.length).toBe(pack.symptoms.length + pack.sampleFields.length);
    expect(fields[0].phase).toMatch(/Symptoms/i);
  });

  it("completes sample step when all DKA symptoms and SAMPLE fields resolved", () => {
    const pack = getFellowshipClinicalRigorPack("dka");
    let symptoms: Record<string, { status: "present" }> = {};
    let sample: Record<string, { status: "value"; value: string }> = {};
    for (const f of pack.symptoms) symptoms[f.id] = { status: "present" };
    for (const f of pack.sampleFields) sample[f.id] = { status: "value", value: "documented" };
    expect(
      isSampleStepComplete({
        rigorConditionCandidates: ["dka"],
        structuredSymptoms: symptoms,
        structuredSample: sample,
      })
    ).toBe(true);
  });
});
