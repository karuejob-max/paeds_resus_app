/**
 * Fellowship micro-course display naming (Foundational / Advanced tracks).
 * Slugs (e.g. dka-i) remain stable; catalog titles use "{Condition}: {Track}".
 */

export type MicroCourseTier = "foundational" | "advanced";

/** Default clinical content semver/date; server may override via `CLINICAL_CONTENT_VERSION` env. */
export const CLINICAL_CONTENT_VERSION = "2026.05.31";

/** Human-readable track label for badges and certificates. */
export function microCourseTrackLabel(tier: MicroCourseTier): "Foundational" | "Advanced" {
  return tier === "foundational" ? "Foundational" : "Advanced";
}

/** Catalog / player display title: e.g. "DKA: Foundational". */
export function formatMicroCourseCatalogTitle(conditionLabel: string, tier: MicroCourseTier): string {
  return `${conditionLabel}: ${microCourseTrackLabel(tier)}`;
}

/** Prerequisite enrollment hint: "Complete DKA: Foundational first". */
export function formatPrerequisiteHint(prerequisiteCourseId: string, catalogTitleBySlug: Record<string, string>): string {
  const title = catalogTitleBySlug[prerequisiteCourseId]?.trim();
  return title ? `Complete ${title} first` : "Complete the foundational course first";
}

/** Condition display names keyed by stable catalog slug. */
export const MICRO_COURSE_CONDITION_LABELS: Record<string, string> = {
  "seriously-ill-child-i": "Seriously Ill Child",
  "asthma-i": "Paediatric Asthma",
  "asthma-ii": "Paediatric Asthma",
  "pneumonia-i": "Paediatric Pneumonia",
  "pneumonia-ii": "Paediatric Pneumonia",
  "septic-shock-i": "Septic Shock",
  "septic-shock-ii": "Septic Shock",
  "hypovolemic-shock-i": "Hypovolemic Shock",
  "hypovolemic-shock-ii": "Hypovolemic Shock",
  "cardiogenic-shock-i": "Cardiogenic Shock",
  "cardiogenic-shock-ii": "Cardiogenic Shock",
  "status-epilepticus-i": "Status Epilepticus",
  "status-epilepticus-ii": "Status Epilepticus",
  "dka-i": "DKA",
  "dka-ii": "DKA",
  "anaphylaxis-i": "Anaphylaxis",
  "anaphylaxis-ii": "Anaphylaxis",
  "meningitis-i": "Meningitis",
  "meningitis-ii": "Meningitis",
  "malaria-i": "Severe Malaria",
  "malaria-ii": "Severe Malaria",
  "burns-i": "Burns",
  "burns-ii": "Burns",
  "trauma-i": "Trauma",
  "trauma-ii": "Trauma",
  "aki-i": "AKI",
  "aki-ii": "AKI",
  "anaemia-i": "Anaemia",
  "anaemia-ii": "Anaemia",
  "intubation-essentials": "Intubation Essentials (Sample)",
};

export function conditionLabelForSlug(courseId: string): string {
  return MICRO_COURSE_CONDITION_LABELS[courseId] ?? courseId.replace(/-i+$/, "").replace(/-/g, " ");
}

/** True when title still uses legacy "Course 1/2" or "Level 1" only labelling. */
export function hasLegacyCourseNumberTitle(title: string): boolean {
  return /\b[12]:\s/.test(title) || /\b(?:Paediatric\s+)?\w+\s+[12]:/i.test(title) || /Level\s+[12]/i.test(title);
}
