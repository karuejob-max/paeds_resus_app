export type ProviderCourseProgram =
  | "bls"
  | "acls"
  | "pals"
  | "pals_septic"
  | "heartsaver"
  | "instructor"
  | "intubation-essentials"
  | "asthma-ii"
  | "status-epilepticus-ii"
  | "anaphylaxis-i"
  | "anaphylaxis-ii"
  | "dka-i"
  | "dka-ii"
  | "severe-pneumonia-ards-i"
  | "severe-pneumonia-ards-ii"
  | "hypovolemic-shock-i"
  | "hypovolemic-shock-ii"
  | "cardiogenic-shock-i"
  | "cardiogenic-shock-ii"
  | "meningitis-i"
  | "meningitis-ii"
  | "severe-malaria-i"
  | "severe-malaria-ii"
  | "acute-kidney-injury-i"
  | "severe-anaemia-i"
  | "burns-i"
  | "burns-ii";

export type ContinueRouteConfig = {
  destination: string;
  ctaLabel: "Start course" | "Open learner dashboard";
};

/**
 * AHA courses are stored in the `courses` table with these numeric IDs.
 * All AHA courses are routed through the unified DB-backed micro-course player.
 */
const AHA_COURSE_DB_IDS: Record<string, number> = {
  bls: 1,
  acls: 2,
  pals: 3,
  pals_septic: 3,
  heartsaver: 30,
};

/**
 * Maps course IDs to their learning destinations.
 * AHA courses use the numeric DB ID with the unified player.
 * Fellowship micro-courses use the string courseId with the same player.
 */
export function getProviderCourseDestination(
  courseId: string | null | undefined,
  enrollmentId?: number,
  fallback = "/learner-dashboard"
): string {
  if (!courseId) return fallback;

  // AHA courses — route to the unified DB-backed player using numeric course IDs
  if (AHA_COURSE_DB_IDS[courseId] !== undefined) {
    const numId = AHA_COURSE_DB_IDS[courseId];
    return enrollmentId
      ? `/micro-course/${numId}?enrollmentId=${enrollmentId}&programType=${courseId}`
      : `/micro-course/${numId}?programType=${courseId}`;
  }

  // Instructor course — dedicated page
  if (courseId === "instructor") {
    return enrollmentId ? `/course/instructor?enrollmentId=${enrollmentId}` : "/course/instructor";
  }

  // Intubation Essentials — dedicated page
  if (courseId === "intubation-essentials") {
    return enrollmentId
      ? `/course/intubation-essentials?enrollmentId=${enrollmentId}`
      : "/course/intubation-essentials";
  }

  // Fellowship micro-courses — use the string courseId with the unified player
  return enrollmentId
    ? `/micro-course/${courseId}?enrollmentId=${enrollmentId}`
    : `/micro-course/${courseId}`;
}

export function getAhaContinueRoute(
  programType: "bls" | "acls" | "pals" | "heartsaver",
  enrollmentId: number
): ContinueRouteConfig {
  return {
    destination: getProviderCourseDestination(programType, enrollmentId),
    ctaLabel: "Start course",
  };
}
