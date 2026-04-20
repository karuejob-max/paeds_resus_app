export type ProviderCourseProgram =
  | "bls"
  | "acls"
  | "pals"
  | "pals_septic"
  | "instructor"
  | "intubation-essentials";

export type ContinueRouteConfig = {
  destination: string;
  ctaLabel: "Start course" | "Open learner dashboard";
};

export function getProviderCourseDestination(
  courseId: string | null | undefined,
  enrollmentId?: number,
  fallback = "/learner-dashboard"
): string {
  if (!courseId) return fallback;

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

  // For fellowship micro-courses that don't have a dedicated page yet,
  // we route them to the generic course player.
  // Note: we only do this for IDs that look like fellowship courses (e.g. contain hyphens or are in the catalog).
  // For truly unknown IDs, we still want to return the fallback.
  const isFellowshipCourse = courseId.includes("-") || 
    ["asthma", "pneumonia", "septic-shock", "hypovolemic-shock", "cardiogenic-shock", "status-epilepticus", "dka", "anaphylaxis", "meningitis", "malaria", "burns", "trauma", "aki", "anaemia"].some(p => courseId.startsWith(p));

  if (isFellowshipCourse) {
    return enrollmentId ? `/course/${courseId}?enrollmentId=${enrollmentId}` : `/course/${courseId}`;
  }

  return fallback;
}

export function getAhaContinueRoute(programType: "bls" | "acls" | "pals", enrollmentId: number): ContinueRouteConfig {
  return {
    destination: getProviderCourseDestination(programType, enrollmentId),
    ctaLabel: "Start course",
  };
}
