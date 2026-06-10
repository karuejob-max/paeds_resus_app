/**
 * Secondary survey phase gating — SAMPLE → diagnostic evidence → diagnosis.
 * Zero ambiguity: each step must be complete before advancing.
 */

import {
  isClinicalEvidenceComplete,
  type ClinicalEvidenceFieldDef,
  type ClinicalEvidenceRecord,
} from "./clinical-evidence";
import {
  getFellowshipClinicalRigorPack,
  mergeClinicalRigorPacks,
  type SecondarySurveyStep,
} from "./fellowship-clinical-rigor";
import { normalizeToFellowshipResusConditionId } from "./fellowship-microcourse-resus-conditions";

export type { SecondarySurveyStep };

export interface SecondarySurveySessionSlice {
  secondarySurveyStep?: SecondarySurveyStep;
  structuredSymptoms?: ClinicalEvidenceRecord;
  structuredSample?: ClinicalEvidenceRecord;
  diagnosticEvidence?: ClinicalEvidenceRecord;
  /** Threat / finding ids used to resolve rigor fields */
  rigorConditionCandidates?: string[];
}

export function resolveRigorConditionCandidates(input: {
  threats: Array<{ id?: string; name?: string }>;
  suggestedDiagnoses?: string[];
}): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (raw: string | null | undefined) => {
    if (!raw?.trim()) return;
    const id = normalizeToFellowshipResusConditionId(raw);
    if (id === "unknown" || seen.has(id)) return;
    seen.add(id);
    out.push(id);
  };
  for (const t of input.threats) {
    add(t.id);
    add(t.name);
  }
  for (const d of input.suggestedDiagnoses ?? []) add(d);
  return out.length > 0 ? out : ["seriously_ill_child"];
}

export function getSecondarySurveyFields(session: SecondarySurveySessionSlice) {
  const candidates = session.rigorConditionCandidates?.length
    ? session.rigorConditionCandidates
    : ["seriously_ill_child"];
  const primaryPack = getFellowshipClinicalRigorPack(candidates[0]);
  const mergedEvidence = mergeClinicalRigorPacks(candidates).diagnosticEvidence;
  return {
    symptoms: primaryPack.symptoms,
    sampleFields: primaryPack.sampleFields,
    diagnosticEvidence: mergedEvidence,
  };
}

/** Unified SAMPLE step fields (S signs + AMPL E) — single panel, no duplicate headings. */
export function getSampleStepFields(session: SecondarySurveySessionSlice): ClinicalEvidenceFieldDef[] {
  const { symptoms, sampleFields } = getSecondarySurveyFields(session);
  return [...symptoms, ...sampleFields];
}

export function isSampleStepComplete(session: SecondarySurveySessionSlice): boolean {
  const fields = getSecondarySurveyFields(session);
  return (
    isClinicalEvidenceComplete(fields.symptoms, session.structuredSymptoms) &&
    isClinicalEvidenceComplete(fields.sampleFields, session.structuredSample)
  );
}

export function isEvidenceStepComplete(session: SecondarySurveySessionSlice): boolean {
  const fields = getSecondarySurveyFields(session);
  return isClinicalEvidenceComplete(fields.diagnosticEvidence, session.diagnosticEvidence);
}

export function canAccessSecondaryStep(
  session: SecondarySurveySessionSlice,
  step: SecondarySurveyStep
): boolean {
  const current = session.secondarySurveyStep ?? "sample";
  if (step === "sample") return true;
  if (step === "evidence") return isSampleStepComplete(session);
  if (step === "diagnosis") return isSampleStepComplete(session) && isEvidenceStepComplete(session);
  return current === step;
}

export function canShowDiagnosisSelection(session: SecondarySurveySessionSlice): boolean {
  return canAccessSecondaryStep(session, "diagnosis");
}

export function nextSecondarySurveyStep(session: SecondarySurveySessionSlice): SecondarySurveyStep | null {
  const current = session.secondarySurveyStep ?? "sample";
  if (current === "sample" && isSampleStepComplete(session)) return "evidence";
  if (current === "evidence" && isEvidenceStepComplete(session)) return "diagnosis";
  return null;
}
