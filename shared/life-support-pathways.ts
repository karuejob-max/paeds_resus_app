export type LifeSupportCourseKey =
  | "bls"
  | "acls"
  | "pals"
  | "nrp"
  | "heartsaver"
  | "instructor";

export type LifeSupportPhaseKey = "phase1" | "phase2" | "phase3" | "final";

export type LifeSupportPhaseDefinition = {
  key: LifeSupportPhaseKey;
  label: string;
  shortLabel: string;
  description: string;
  applicable: boolean;
  recordKind: "progress" | "gatepass" | "completion" | "credential";
};

export type LifeSupportPathway = {
  key: LifeSupportCourseKey;
  label: string;
  subtitle: string;
  phases: readonly LifeSupportPhaseDefinition[];
};

const phase1 = (courseLabel: string): LifeSupportPhaseDefinition => ({
  key: "phase1",
  label: "Phase 1 · Cognitive",
  shortLabel: "Cognitive",
  description: `AHA ${courseLabel} cognitive coursework and assessment.`,
  applicable: true,
  recordKind: "gatepass",
});

const phase2 = (courseLabel: string): LifeSupportPhaseDefinition => ({
  key: "phase2",
  label: "Phase 2 · Simulation training and evaluation",
  shortLabel: "Simulation",
  description: `${courseLabel} simulation training and evaluation required before the practical skills assessment.`,
  applicable: true,
  recordKind: "gatepass",
});

const phase3 = (courseLabel: string): LifeSupportPhaseDefinition => ({
  key: "phase3",
  label: "Phase 3 · Practical skills evaluation",
  shortLabel: "Practical skills",
  description: `${courseLabel} practical skills evaluation completed by an approved instructor or authorized reviewer.`,
  applicable: true,
  recordKind: "completion",
});

const final = (courseLabel: string): LifeSupportPhaseDefinition => ({
  key: "final",
  label: `Final ${courseLabel} provider certificate`,
  shortLabel: "Final provider certificate",
  description: `Primary credential issued after every required ${courseLabel} pathway phase is complete.`,
  applicable: true,
  recordKind: "credential",
});

const noPhase2 = (courseLabel: string) => [
  phase1(courseLabel),
  { ...phase2(courseLabel), applicable: false },
  phase3(courseLabel),
  final(courseLabel),
] as const;

const withPhase2 = (courseLabel: string) => [
  phase1(courseLabel),
  phase2(courseLabel),
  phase3(courseLabel),
  final(courseLabel),
] as const;

export const LIFE_SUPPORT_PATHWAYS: Record<LifeSupportCourseKey, LifeSupportPathway> = {
  bls: { key: "bls", label: "BLS", subtitle: "Basic Life Support", phases: noPhase2("BLS") },
  acls: { key: "acls", label: "ACLS", subtitle: "Advanced Cardiovascular Life Support", phases: withPhase2("ACLS") },
  pals: { key: "pals", label: "PALS", subtitle: "Pediatric Advanced Life Support", phases: withPhase2("PALS") },
  nrp: { key: "nrp", label: "NRP", subtitle: "Neonatal Resuscitation", phases: withPhase2("NRP") },
  heartsaver: { key: "heartsaver", label: "Heartsaver", subtitle: "Heartsaver pathway", phases: noPhase2("Heartsaver") },
  instructor: { key: "instructor", label: "Instructor", subtitle: "Instructor development", phases: withPhase2("Instructor") },
};

export const LIFE_SUPPORT_COURSES = Object.values(LIFE_SUPPORT_PATHWAYS);

export function getLifeSupportPathway(course: string): LifeSupportPathway | null {
  return LIFE_SUPPORT_PATHWAYS[course as LifeSupportCourseKey] ?? null;
}

export function requiresLifeSupportPhase(course: string, phase: LifeSupportPhaseKey): boolean {
  return Boolean(getLifeSupportPathway(course)?.phases.find((item) => item.key === phase)?.applicable);
}

export function getLifeSupportPhase(course: string, phase: LifeSupportPhaseKey): LifeSupportPhaseDefinition | null {
  return getLifeSupportPathway(course)?.phases.find((item) => item.key === phase) ?? null;
}

export function getLifeSupportRequiredPhases(course: string): LifeSupportPhaseKey[] {
  return (getLifeSupportPathway(course)?.phases ?? [])
    .filter((phase) => phase.applicable)
    .map((phase) => phase.key);
}

export function getLifeSupportProgressRecordLabel(course: string, phase: LifeSupportPhaseKey): string {
  const definition = getLifeSupportPhase(course, phase);
  if (!definition) return "Progress record";
  if (phase === "final") return definition.label;
  return `${definition.label} · Progress record — not a final provider certificate`;
}

export function getLifeSupportCourseLabel(course: string): string {
  return getLifeSupportPathway(course)?.label ?? course.toUpperCase();
}
