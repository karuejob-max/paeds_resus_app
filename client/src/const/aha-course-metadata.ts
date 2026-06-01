import type { AhaProgramType } from "@/lib/providerCourseRoutes";

/** Display order for AHA hub, enroll, and public course grids. */
export const AHA_COURSE_ORDER: readonly AhaProgramType[] = [
  "bls",
  "acls",
  "pals",
  "heartsaver",
  "nrp",
] as const;

/**
 * CEO-standard total contact hours for AHA offerings (single source of truth for UI).
 * PSOT / legacy catalog rows may differ (e.g. BLS listed as 6 hours in training copy).
 * Always use these values for "Total time (AHA recommendation)" lines on hub cards,
 * enroll, and marketing duration copy.
 */
export const AHA_RECOMMENDED_TOTAL_HOURS: Record<AhaProgramType, number> = {
  bls: 1,
  acls: 4,
  pals: 16,
  heartsaver: 2,
  nrp: 6,
};

/** @deprecated Use AHA_RECOMMENDED_TOTAL_HOURS */
export const AHA_COURSE_HOURS = AHA_RECOMMENDED_TOTAL_HOURS;

/**
 * Realistic online-only cognitive workload (self-paced modules, quizzes, reading).
 * Sources (module duration sums from seed scripts; rounded up for quiz/review time):
 * - BLS: seed-bls.ts — 5 modules, 110 min + formative quizzes → ~1.5 h online
 *   (PSOT historically listed BLS as 6 h total; CEO label is 1 h AHA recommendation.)
 * - ACLS: seed-acls.ts — 6 modules, 135 min + quizzes → ~3.5 h online (remainder ≈ practical)
 * - PALS: seed-pals.ts — 6 modules; AHA 16 h total with ~10 h typical online cognitive
 *   portion (module seeds undercount full case/quiz workload vs contact-hour split)
 * - Heartsaver: heartsaver-modules-data.ts — 4 modules, 70 min → ~1 h online
 * - NRP: nrp-modules-data.ts — 6 modules, 235 min + quizzes → ~3 h online (6 h AHA total)
 */
export const AHA_COGNITIVE_COURSEWORK_HOURS: Record<AhaProgramType, number> = {
  bls: 1.5,
  acls: 3.5,
  pals: 10,
  heartsaver: 1,
  nrp: 3,
};

export type AhaCourseMetadata = {
  programType: AhaProgramType;
  badge: string;
  title: string;
  shortDescription: string;
};

const AHA_COURSE_METADATA: Record<AhaProgramType, AhaCourseMetadata> = {
  bls: {
    programType: "bls",
    badge: "BLS",
    title: "BLS (Basic Life Support)",
    shortDescription: "Core life support skills for rapid recognition, CPR, and team response.",
  },
  acls: {
    programType: "acls",
    badge: "ACLS",
    title: "ACLS (Advanced Cardiovascular Life Support)",
    shortDescription: "Advanced cardiac emergency assessment, algorithms, and post-event management.",
  },
  pals: {
    programType: "pals",
    badge: "PALS",
    title: "PALS (Pediatric Advanced Life Support)",
shortDescription:
      "2025 AHA PALS Update — Pediatric emergency assessment, systematic ABCDE, physiology-directed algorithms, and recovery.",
  },
  heartsaver: {
    programType: "heartsaver",
    badge: "HS",
    title: "Heartsaver CPR AED",
    shortDescription:
      "CPR and AED skills for lay rescuers and non-clinical healthcare workers. Covers adult, child, and infant CPR.",
  },
  nrp: {
    programType: "nrp",
    badge: "NRP",
    title: "NRP (Neonatal Resuscitation Program)",
    shortDescription:
      "2025 AHA/AAP neonatal resuscitation — anticipation, initial steps, PPV, chest compressions, medications, and post-resuscitation care.",
  },
};

export function getAhaCourseMetadata(programType: AhaProgramType): AhaCourseMetadata {
  return AHA_COURSE_METADATA[programType];
}

export function getAhaRecommendedTotalHours(programType: AhaProgramType): number {
  return AHA_RECOMMENDED_TOTAL_HOURS[programType];
}

/** @deprecated Use getAhaRecommendedTotalHours */
export function getAhaCourseHours(programType: AhaProgramType): number {
  return AHA_RECOMMENDED_TOTAL_HOURS[programType];
}

export function getAhaCognitiveCourseworkHours(programType: AhaProgramType): number {
  return AHA_COGNITIVE_COURSEWORK_HOURS[programType];
}

function formatHourCount(hours: number): string {
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

/** e.g. "1 hour" or "16 hours" — AHA recommended total */
export function formatAhaRecommendedDuration(programType: AhaProgramType): string {
  return formatHourCount(AHA_RECOMMENDED_TOTAL_HOURS[programType]);
}

/** e.g. "~3.5 hours online" — realistic online cognitive workload */
export function formatCognitiveCourseworkDuration(programType: AhaProgramType): string {
  const hours = AHA_COGNITIVE_COURSEWORK_HOURS[programType];
  return `~${formatHourCount(hours)} online`;
}

/** e.g. "Total time (AHA recommendation): 16 hours" */
export function formatAhaRecommendedDurationLabel(programType: AhaProgramType): string {
  return `Total time (AHA recommendation): ${formatAhaRecommendedDuration(programType)}`;
}

/** e.g. "Cognitive coursework: ~10 hours online" */
export function formatCognitiveCourseworkDurationLabel(programType: AhaProgramType): string {
  return `Cognitive coursework: ${formatCognitiveCourseworkDuration(programType)}`;
}

/** @deprecated Use formatAhaRecommendedDuration — kept for schema.org and legacy copy */
export function formatAhaDuration(programType: AhaProgramType): string {
  return formatAhaRecommendedDuration(programType);
}

/** @deprecated Use formatAhaRecommendedDurationLabel + formatCognitiveCourseworkDurationLabel */
export function formatAhaDurationLabel(programType: AhaProgramType): string {
  return formatAhaRecommendedDurationLabel(programType);
}

/** ISO-8601 duration for schema.org (PT{n}H) — uses AHA recommended total. */
export function ahaDurationIsoHours(programType: AhaProgramType): string {
  return `PT${AHA_RECOMMENDED_TOTAL_HOURS[programType]}H`;
}
