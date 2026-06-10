import { describe, expect, it } from "vitest";
import {
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
