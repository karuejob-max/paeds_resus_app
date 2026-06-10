/**
 * Zero-ambiguity clinical evidence capture — shared ResusGPS / fellowship rigor standard.
 * Each field: specific value OR individual "Not available" (LMIC policy data).
 */

export type ClinicalEvidenceFieldType =
  | "numeric"
  | "text"
  | "presence"
  | "ketones"
  | "numeric_with_units"
  | "glucose_vitals";

export interface ClinicalEvidenceFieldDef {
  id: string;
  label: string;
  type: ClinicalEvidenceFieldType;
  unit?: string;
  /** Selectable units for numeric_with_units (LMIC labs vary). */
  unitOptions?: string[];
  placeholder?: string;
  phase?: string;
  presenceOptions?: boolean;
  /** Pre-fill from primary survey vitals when entering evidence step. */
  autofillFromVital?: "glucose";
}

export type ClinicalEvidenceEntry =
  | { status: "value"; value: string }
  | { status: "not_available" }
  | { status: "present" }
  | { status: "absent" };

export type ClinicalEvidenceRecord = Record<string, ClinicalEvidenceEntry>;

export const URINE_KETONE_SEMIQUANT = ["3+", "2+", "1+", "trace", "negative"] as const;

export function isClinicalEvidenceFieldResolved(entry: ClinicalEvidenceEntry | undefined): boolean {
  if (!entry) return false;
  return (
    entry.status === "value" ||
    entry.status === "not_available" ||
    entry.status === "present" ||
    entry.status === "absent"
  );
}

export function isClinicalEvidenceComplete(
  fields: ClinicalEvidenceFieldDef[],
  record: ClinicalEvidenceRecord | undefined
): boolean {
  if (fields.length === 0) return true;
  const rec = record ?? {};
  return fields.every((f) => isClinicalEvidenceFieldResolved(rec[f.id]));
}

export function clinicalEvidenceProgress(
  fields: ClinicalEvidenceFieldDef[],
  record: ClinicalEvidenceRecord | undefined
): { completed: number; total: number; percent: number } {
  const total = fields.length;
  if (total === 0) return { completed: 0, total: 0, percent: 100 };
  const completed = fields.filter((f) => isClinicalEvidenceFieldResolved(record?.[f.id])).length;
  return { completed, total, percent: Math.round((completed / total) * 100) };
}

export function setClinicalEvidenceEntry(
  record: ClinicalEvidenceRecord,
  fieldId: string,
  entry: ClinicalEvidenceEntry
): ClinicalEvidenceRecord {
  return { ...record, [fieldId]: entry };
}

/** Apply vitals autofill for evidence fields not yet resolved. */
export function applyVitalsAutofillToEvidence(
  fields: ClinicalEvidenceFieldDef[],
  record: ClinicalEvidenceRecord,
  vitals: { glucose?: number }
): ClinicalEvidenceRecord {
  let next = { ...record };
  for (const field of fields) {
    if (field.autofillFromVital === "glucose" && vitals.glucose !== undefined) {
      if (!isClinicalEvidenceFieldResolved(next[field.id])) {
        next = setClinicalEvidenceEntry(next, field.id, {
          status: "value",
          value: String(vitals.glucose),
        });
      }
    }
  }
  return next;
}
