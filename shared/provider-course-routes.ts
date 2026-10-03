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

export type AhaProgramType = "bls" | "acls" | "pals" | "heartsaver" | "nrp" | "instructor";
export type ProviderProgramType = AhaProgramType | "paeds_resus_ils";

export const AHA_PROGRAM_TYPES: readonly AhaProgramType[] = ["bls", "acls", "pals", "heartsaver", "nrp", "instructor"];
export const PROVIDER_PROGRAM_TYPES: readonly ProviderProgramType[] = [...AHA_PROGRAM_TYPES, "paeds_resus_ils"];

export type ContinueRouteConfig = {
  destination: string;
  ctaLabel: "Start course" | "Open learner dashboard";
};

export type AhaNextPhase = "cognitive" | "practical" | "completed" | "review";

export type AhaNextPhaseAction = {
  phase: AhaNextPhase;
  destination: string;
  label: "Continue cognitive modules" | "Book hands-on session" | "View course certificates" | "Review enrollment";
};

export type AhaPathway = "ierp" | "nerp" | "ilsp" | "independent" | "admin_grant";

/** Pathway learners must return to their owning programme portal. */
export function getAhaPathwayPortalRoute(pathway: string | null | undefined): string | null {
  switch (pathway) {
    case "ierp":
      return "/programs/ierp";
    case "nerp":
      return "/programs/nerp-acls";
    case "ilsp":
      return "/training/institutional-life-support";
    default:
      return null;
  }
}

export function isAhaProgramSlug(courseId: string): courseId is AhaProgramType {
  return (AHA_PROGRAM_TYPES as readonly string[]).includes(courseId);
}

export function isProviderProgramSlug(courseId: string): courseId is ProviderProgramType {
  return (PROVIDER_PROGRAM_TYPES as readonly string[]).includes(courseId);
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

  if (courseId === "instructor") {
    return enrollmentId ? `/course/instructor?enrollmentId=${enrollmentId}` : "/course/instructor";
  }

  if (courseId === "paeds_resus_ils") {
    return buildMicroCourseDestination(courseDbId != null ? String(courseDbId) : "paeds-resus-competency", courseId, enrollmentId);
  }

  if (courseId === "pals_septic") {
    const segment = courseDbId != null ? String(courseDbId) : "pals_septic";
    return buildMicroCourseDestination(segment, "pals", enrollmentId);
  }

  if (isAhaProgramSlug(courseId)) {
    const segment = courseDbId != null ? String(courseDbId) : courseId;
    return buildMicroCourseDestination(segment, courseId, enrollmentId);
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

/**
 * Resolve the next unfinished action for an enrolled AHA course.
 * Cognitive learning is handled by the course player, practical completion is
 * instructor-led, and certificates are the terminal destination.
 */
export function getAhaNextPhaseAction(
  programType: AhaProgramType,
  enrollmentId: number,
  courseDbId: number | undefined,
  cognitiveModulesComplete: boolean,
  practicalSkillsSignedOff: boolean,
  enrollmentStatus: string | null | undefined,
): AhaNextPhaseAction {
  if (enrollmentStatus === "cancelled") {
    return { phase: "review", destination: "/aha-courses", label: "Review enrollment" };
  }
  if (!cognitiveModulesComplete) {
    return {
      phase: "cognitive",
      destination: getProviderCourseDestination(programType, enrollmentId, "/aha-courses", courseDbId),
      label: "Continue cognitive modules",
    };
  }
  if (!practicalSkillsSignedOff) {
    const query = new URLSearchParams({ programType, enrollmentId: String(enrollmentId) });
    return { phase: "practical", destination: `/aha-book-session?${query.toString()}`, label: "Book hands-on session" };
  }
  return { phase: "completed", destination: "/certificates", label: "View course certificates" };
}
