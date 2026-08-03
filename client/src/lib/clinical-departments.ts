/**
 * Canonical Clinical Department Directory & Helpers.
 * Used across CPD registration, institutional dashboards, and staff management.
 */

export interface ClinicalDepartmentOption {
  id: string;
  name: string;
  category: "clinical" | "diagnostic" | "support" | "other";
}

export const CANONICAL_CLINICAL_DEPARTMENTS: ClinicalDepartmentOption[] = [
  { id: "paediatrics", name: "Paediatrics & Child Health", category: "clinical" },
  { id: "casualty", name: "Accident & Emergency (A&E / Casualty)", category: "clinical" },
  { id: "icu_hdu", name: "Intensive Care Unit (ICU / HDU / PICU / NICU)", category: "clinical" },
  { id: "maternity", name: "Obstetrics & Gynaecology / Maternity", category: "clinical" },
  { id: "medical_ward", name: "Internal Medicine / Medical Ward", category: "clinical" },
  { id: "surgical_ward", name: "Surgery / Surgical Ward", category: "clinical" },
  { id: "opd", name: "Outpatient Department (OPD / GOPD)", category: "clinical" },
  { id: "pharmacy", name: "Pharmacy & Pharmacology", category: "diagnostic" },
  { id: "laboratory", name: "Laboratory & Pathology", category: "diagnostic" },
  { id: "theatre", name: "Anaesthesia & Operating Theatre", category: "clinical" },
  { id: "nursing_admin", name: "Nursing Services / Nursing Administration", category: "support" },
  { id: "other", name: "Other (Please specify)", category: "other" },
];

/** Standard list of department names for simple dropdowns */
export const CLINICAL_DEPARTMENT_NAMES = CANONICAL_CLINICAL_DEPARTMENTS.map((d) => d.name);

export function isCanonicalDepartment(dept: string): boolean {
  return CANONICAL_CLINICAL_DEPARTMENTS.some(
    (d) => d.name.toLowerCase() === dept.toLowerCase() && d.id !== "other"
  );
}
