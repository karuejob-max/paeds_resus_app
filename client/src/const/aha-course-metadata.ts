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
 * CEO-standard contact hours for AHA offerings (single source of truth for UI).
 * PSOT / legacy catalog rows may differ (e.g. BLS listed as 6 hours in training copy).
 * Always use these values for hub cards, enroll, and marketing duration lines.
 */
export const AHA_COURSE_HOURS: Record<AhaProgramType, number> = {
  bls: 1,
  acls: 4,
  pals: 16,
  heartsaver: 2,
  nrp: 6,
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
      "Pediatric emergency assessment and stabilization for critically ill children — systematic ABCDE, algorithms, and team response.",
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

export function getAhaCourseHours(programType: AhaProgramType): number {
  return AHA_COURSE_HOURS[programType];
}

/** e.g. "1 hour" or "16 hours" */
export function formatAhaDuration(programType: AhaProgramType): string {
  const hours = AHA_COURSE_HOURS[programType];
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

/** e.g. "Duration: 16 hours" */
export function formatAhaDurationLabel(programType: AhaProgramType): string {
  return `Duration: ${formatAhaDuration(programType)}`;
}

/** ISO-8601 duration for schema.org (PT{n}H). */
export function ahaDurationIsoHours(programType: AhaProgramType): string {
  return `PT${AHA_COURSE_HOURS[programType]}H`;
}
