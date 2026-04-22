export type ProviderCourseProgram =
  | "bls"
  | "acls"
  | "pals"
  | "pals_septic"
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
 * Maps course IDs to their learning destinations
 * Dedicated pages for established courses, generic player for micro-courses
 */
export function getProviderCourseDestination(
  courseId: string | null | undefined,
  enrollmentId?: number,
  fallback = "/learner-dashboard"
): string {
  if (!courseId) return fallback;

  // Dedicated course pages (AHA + established courses)
  if (courseId === "bls") {
    return enrollmentId ? `/course/bls?enrollmentId=${enrollmentId}` : "/course/bls";
  }
  if (courseId === "acls") {
    return enrollmentId ? `/course/acls?enrollmentId=${enrollmentId}` : "/course/acls";
  }
  if (courseId === "pals") {
    return enrollmentId
      ? `/course/seriously-ill-child?enrollmentId=${enrollmentId}`
      : "/course/seriously-ill-child";
  }
  if (courseId === "pals_septic") {
    return enrollmentId
      ? `/course/paediatric-septic-shock?enrollmentId=${enrollmentId}`
      : "/course/paediatric-septic-shock";
  }
  if (courseId === "instructor") {
    return enrollmentId ? `/course/instructor?enrollmentId=${enrollmentId}` : "/course/instructor";
  }
  if (courseId === "intubation-essentials") {
    return enrollmentId
      ? `/course/intubation-essentials?enrollmentId=${enrollmentId}`
      : "/course/intubation-essentials";
  }

  // Generic micro-course player for all other courses
  // Maps all 18+ micro-courses to the generic player
  const microCourseIds = [
    "asthma-ii",
    "status-epilepticus-ii",
    "anaphylaxis-i",
    "anaphylaxis-ii",
    "dka-i",
    "dka-ii",
    "severe-pneumonia-ards-i",
    "severe-pneumonia-ards-ii",
    "hypovolemic-shock-i",
    "hypovolemic-shock-ii",
    "cardiogenic-shock-i",
    "cardiogenic-shock-ii",
    "meningitis-i",
    "meningitis-ii",
    "severe-malaria-i",
    "severe-malaria-ii",
    "acute-kidney-injury-i",
    "severe-anaemia-i",
    "burns-i",
    "burns-ii",
  ];

  if (microCourseIds.includes(courseId)) {
    return enrollmentId
      ? `/micro-course/${courseId}?enrollmentId=${enrollmentId}`
      : `/micro-course/${courseId}`;
  }

  return fallback;
}

export function getAhaContinueRoute(programType: "bls" | "acls" | "pals", enrollmentId: number): ContinueRouteConfig {
  return {
    destination: getProviderCourseDestination(programType, enrollmentId),
    ctaLabel: "Start course",
  };
}
