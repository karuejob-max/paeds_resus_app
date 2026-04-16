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

  return fallback;
}

export function getAhaContinueRoute(programType: "bls" | "acls" | "pals", enrollmentId: number): ContinueRouteConfig {
  return {
    destination: getProviderCourseDestination(programType, enrollmentId),
    ctaLabel: "Start course",
  };
}
