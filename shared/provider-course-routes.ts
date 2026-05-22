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

export type AhaProgramType = "bls" | "acls" | "pals" | "heartsaver";

export const AHA_PROGRAM_TYPES: readonly AhaProgramType[] = ["bls", "acls", "pals", "heartsaver"];

export type ContinueRouteConfig = {
  destination: string;
  ctaLabel: "Start course" | "Open learner dashboard";
};

export function isAhaProgramSlug(courseId: string): courseId is AhaProgramType {
  return (AHA_PROGRAM_TYPES as readonly string[]).includes(courseId);
}

function buildMicroCourseDestination(
  pathSegment: string,
  programType: string,
  enrollmentId?: number
): string {
  const qs = new URLSearchParams({ programType });
  if (enrollmentId != null) qs.set("enrollmentId", String(enrollmentId));
  return `/micro-course/${pathSegment}?${qs.toString()}`;
}

/**
 * Maps course IDs to their learning destinations.
 * AHA courses use the DB `courses.id` when known (pass `courseDbId`); otherwise the program slug
 * so the player can resolve the catalog row. Fellowship micro-courses use the string courseId.
 */
export function getProviderCourseDestination(
  courseId: string | null | undefined,
  enrollmentId?: number,
  fallback = "/learner-dashboard",
  courseDbId?: number
): string {
  if (!courseId) return fallback;

  if (courseId === "pals_septic") {
    const segment = courseDbId != null ? String(courseDbId) : "pals_septic";
    return buildMicroCourseDestination(segment, "pals", enrollmentId);
  }

  if (isAhaProgramSlug(courseId)) {
    const segment = courseDbId != null ? String(courseDbId) : courseId;
    return buildMicroCourseDestination(segment, courseId, enrollmentId);
  }

  if (courseId === "instructor") {
    return enrollmentId ? `/course/instructor?enrollmentId=${enrollmentId}` : "/course/instructor";
  }

  if (courseId === "intubation-essentials") {
    return enrollmentId
      ? `/course/intubation-essentials?enrollmentId=${enrollmentId}`
      : "/course/intubation-essentials";
  }

  if (courseId === "seriously-ill-child-i" || courseId === "seriously-ill-child") {
    return enrollmentId
      ? `/micro-course/seriously-ill-child-i?enrollmentId=${enrollmentId}`
      : "/micro-course/seriously-ill-child-i";
  }

  return enrollmentId
    ? `/micro-course/${courseId}?enrollmentId=${enrollmentId}`
    : `/micro-course/${courseId}`;
}

export function getAhaContinueRoute(
  programType: AhaProgramType,
  enrollmentId: number,
  courseDbId: number
): ContinueRouteConfig {
  return {
    destination: getProviderCourseDestination(programType, enrollmentId, "/learner-dashboard", courseDbId),
    ctaLabel: "Start course",
  };
}
