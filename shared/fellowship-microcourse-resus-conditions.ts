/**
 * Fellowship Pillar B — ResusGPS conditions aligned to published micro-course topics.
 * Each foundational micro-course topic requires ≥3 attributable ResusGPS cases.
 */

export type FellowshipMicrocourseResusCondition = {
  id: string;
  label: string;
  microCourseIds: string[];
  /** Threat ids, protocol slugs, and display aliases (normalized to snake_case). */
  aliases: string[];
};

/** Foundational fellowship micro-course topics (excludes intubation sample / procedural-only). */
export const FELLOWSHIP_MICROCOURSE_RESUS_CONDITIONS: FellowshipMicrocourseResusCondition[] = [
  {
    id: "severe_asthma",
    label: "Severe Asthma / Status Asthmaticus",
    microCourseIds: ["asthma-i", "asthma-ii"],
    aliases: ["severe_asthma", "status_asthmaticus", "asthma", "bronchospasm", "status_asthmaticus"],
  },
  {
    id: "severe_pneumonia",
    label: "Severe Pneumonia / ARDS",
    microCourseIds: ["pneumonia-i", "pneumonia-ii"],
    aliases: ["severe_pneumonia", "pneumonia", "ards", "severe_pneumonia_ards"],
  },
  {
    id: "septic_shock",
    label: "Septic Shock",
    microCourseIds: ["septic-shock-i", "septic-shock-ii"],
    aliases: ["septic_shock", "sepsis", "warm_shock", "cold_shock"],
  },
  {
    id: "hypovolemic_shock",
    label: "Hypovolemic Shock",
    microCourseIds: ["hypovolemic-shock-i", "hypovolemic-shock-ii"],
    aliases: ["hypovolemic_shock", "dehydration", "hemorrhage", "haemorrhage"],
  },
  {
    id: "cardiogenic_shock",
    label: "Cardiogenic Shock",
    microCourseIds: ["cardiogenic-shock-i", "cardiogenic-shock-ii"],
    aliases: ["cardiogenic_shock", "heart_failure"],
  },
  {
    id: "status_epilepticus",
    label: "Status Epilepticus",
    microCourseIds: ["status-epilepticus-i", "status-epilepticus-ii"],
    aliases: ["status_epilepticus", "seizure", "convulsion"],
  },
  {
    id: "dka",
    label: "Diabetic Ketoacidosis (DKA)",
    microCourseIds: ["dka-i", "dka-ii"],
    aliases: ["dka", "diabetic_ketoacidosis", "ketoacidosis"],
  },
  {
    id: "anaphylaxis",
    label: "Anaphylaxis",
    microCourseIds: ["anaphylaxis-i", "anaphylaxis-ii"],
    aliases: ["anaphylaxis", "anaphylactic_shock"],
  },
  {
    id: "meningitis",
    label: "Meningitis",
    microCourseIds: ["meningitis-i", "meningitis-ii"],
    aliases: ["meningitis", "meningococcal"],
  },
  {
    id: "severe_malaria",
    label: "Severe Malaria",
    microCourseIds: ["malaria-i", "malaria-ii"],
    aliases: ["severe_malaria", "malaria", "cerebral_malaria"],
  },
  {
    id: "burns",
    label: "Burns",
    microCourseIds: ["burns-i", "burns-ii"],
    aliases: ["burns", "inhalation_injury"],
  },
  {
    id: "trauma",
    label: "Trauma",
    microCourseIds: ["trauma-i", "trauma-ii"],
    aliases: ["trauma", "major_trauma"],
  },
  {
    id: "acute_kidney_injury",
    label: "Acute Kidney Injury",
    microCourseIds: ["aki-i"],
    aliases: ["acute_kidney_injury", "aki", "renal_failure"],
  },
  {
    id: "severe_anaemia",
    label: "Severe Anaemia",
    microCourseIds: ["anaemia-i"],
    aliases: ["severe_anaemia", "anaemia", "anemia"],
  },
];

export function getFellowshipMicrocourseResusConditionCount(): number {
  return FELLOWSHIP_MICROCOURSE_RESUS_CONDITIONS.length;
}

export function getFellowshipMicrocourseResusConditionLabel(id: string): string {
  return (
    FELLOWSHIP_MICROCOURSE_RESUS_CONDITIONS.find((c) => c.id === id)?.label ??
    id.replace(/_/g, " ")
  );
}

function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

/** Map a ResusGPS diagnosis / threat / protocol id to a fellowship micro-course condition id. */
export function normalizeToFellowshipResusConditionId(raw: string | null | undefined): string {
  if (!raw?.trim()) return "unknown";
  const key = normalizeKey(raw);

  for (const cond of FELLOWSHIP_MICROCOURSE_RESUS_CONDITIONS) {
    if (cond.id === key) return cond.id;
    if (cond.microCourseIds.some((id) => normalizeKey(id) === key)) return cond.id;
    if (cond.aliases.some((a) => normalizeKey(a) === key)) return cond.id;
  }

  for (const cond of FELLOWSHIP_MICROCOURSE_RESUS_CONDITIONS) {
    if (cond.aliases.some((a) => key.includes(normalizeKey(a)) || normalizeKey(a).includes(key))) {
      return cond.id;
    }
  }

  return key;
}

export function isFellowshipMicrocourseResusCondition(id: string): boolean {
  return FELLOWSHIP_MICROCOURSE_RESUS_CONDITIONS.some((c) => c.id === id);
}

/** Best fellowship condition slug for Pillar B credit from session working diagnoses. */
export function resolveFellowshipDiagnosisFromSession(session: {
  definitiveDiagnosis: string | null;
  concurrentDiagnoses?: string[];
  phase: string;
  activeThreat?: { id?: string } | null;
}): string {
  const candidates = [
    session.definitiveDiagnosis,
    ...(session.concurrentDiagnoses ?? []),
    session.phase === "CARDIAC_ARREST" ? "cardiac_arrest" : null,
    session.activeThreat?.id ?? null,
  ].filter(Boolean) as string[];

  for (const c of candidates) {
    const norm = normalizeToFellowshipResusConditionId(c);
    if (isFellowshipMicrocourseResusCondition(norm)) return norm;
  }

  if (candidates[0]) return normalizeToFellowshipResusConditionId(candidates[0]);
  return "unknown";
}
