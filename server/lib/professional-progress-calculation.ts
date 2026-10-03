export type LifeSupportEnrollmentLike = {
  id?: number;
  programType: string;
  enrollmentStatus?: string | null;
  progressPercentage?: number | null;
  certificateVerified?: boolean | null;
  practicalSkillsSignedOff?: boolean | null;
  cognitiveModulesComplete?: boolean | null;
  ahaPrecourseCompleted?: boolean | null;
  elearningProofVerifiedAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export function progressForEnrollment(row: LifeSupportEnrollmentLike): number {
  const trackedPercentage = Number(row.progressPercentage ?? 0);
  if (trackedPercentage > 0) return Math.min(100, trackedPercentage);
  if (row.certificateVerified || row.practicalSkillsSignedOff) return 100;
  if (row.cognitiveModulesComplete) return 50;
  if (row.ahaPrecourseCompleted || row.elearningProofVerifiedAt) return 25;
  return 0;
}

export function phaseForEnrollment(row: LifeSupportEnrollmentLike, percentage = progressForEnrollment(row)): string {
  if (percentage >= 100) return "Provider / Phase 3 · completed";
  if (percentage >= 75) return "Phase 3 preparation";
  if (percentage >= 50) return "Cognitive / Phase 2";
  if (percentage >= 25) return "Pre-course / Phase 1 evidence";
  return "Started · next learning step pending";
}

/** Keep one authoritative current record per course, preferring active and most-progressed records. */
export function selectBestCurrentEnrollments(rows: LifeSupportEnrollmentLike[]): LifeSupportEnrollmentLike[] {
  const best = new Map<string, LifeSupportEnrollmentLike>();
  for (const row of rows) {
    if (row.enrollmentStatus === "cancelled") continue;
    const current = best.get(row.programType);
    if (!current) {
      best.set(row.programType, row);
      continue;
    }
    const rowScore = [progressForEnrollment(row), row.enrollmentStatus === "active" ? 1 : 0, new Date(row.updatedAt ?? 0).getTime()];
    const currentScore = [progressForEnrollment(current), current.enrollmentStatus === "active" ? 1 : 0, new Date(current.updatedAt ?? 0).getTime()];
    if (rowScore[0] > currentScore[0] || (rowScore[0] === currentScore[0] && (rowScore[1] > currentScore[1] || (rowScore[1] === currentScore[1] && rowScore[2] > currentScore[2])))) {
      best.set(row.programType, row);
    }
  }
  return [...best.values()].sort((a, b) => a.programType.localeCompare(b.programType));
}
