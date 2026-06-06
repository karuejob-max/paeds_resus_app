import { getProviderCourseDestination } from "./provider-course-routes";

/**
 * Course-progress bell alerts prefer **actionable, course-specific** copy (Coursera/Duolingo
 * pattern) over aggregate counts — one notification per enrollment up to the display cap.
 */
export const MAX_COURSE_PROGRESS_ALERTS = 5;

export type CourseProgressAlertSource = "micro" | "aha";

export type CourseProgressEnrollmentInput = {
  id: number;
  source: CourseProgressAlertSource;
  title: string;
  /** Micro: microCourses.courseId slug; AHA: programType slug (bls, pals, …). */
  courseSlug: string;
  /** AHA enrollments.courseId (courses.id) when known. */
  courseDbId?: number | null;
  progressPercentage: number;
  /** Micro only — skip when "completed". */
  enrollmentStatus?: string | null;
  /** AHA only — skip when cognitive modules are finished. */
  cognitiveModulesComplete?: boolean | null;
};

export type CourseProgressAlert = {
  id: string;
  type: "course_resume" | "course_start" | "course_overflow";
  title: string;
  body: string;
  actionUrl: string;
};

function isIncompleteEnrollment(row: CourseProgressEnrollmentInput): boolean {
  if (row.source === "micro") {
    if (row.enrollmentStatus === "completed") return false;
    if (row.enrollmentStatus != null && row.enrollmentStatus !== "active") return false;
    return Number(row.progressPercentage ?? 0) < 100;
  }
  if (row.cognitiveModulesComplete) return false;
  return Number(row.progressPercentage ?? 0) < 100;
}

function alertDestination(row: CourseProgressEnrollmentInput): string {
  if (row.source === "aha") {
    return getProviderCourseDestination(
      row.courseSlug,
      row.id,
      "/learner-dashboard",
      row.courseDbId ?? undefined
    );
  }
  return getProviderCourseDestination(row.courseSlug, row.id, "/fellowship");
}

function buildSpecificAlert(row: CourseProgressEnrollmentInput): CourseProgressAlert {
  const progress = Number(row.progressPercentage ?? 0);
  const inProgress = progress > 0;
  const actionUrl = alertDestination(row);
  const courseTitle = row.title.trim() || "Course";

  if (inProgress) {
    return {
      id: `${row.source}-resume-${row.id}`,
      type: "course_resume",
      title: `${courseTitle}: continue learning`,
      body: `${progress}% complete — pick up where you left off`,
      actionUrl,
    };
  }

  return {
    id: `${row.source}-start-${row.id}`,
    type: "course_start",
    title: `Start ${courseTitle}`,
    body: "Begin the course to earn your certificate",
    actionUrl,
  };
}

/**
 * Build bell notifications for incomplete micro-course and AHA enrollments.
 * Returns up to {@link MAX_COURSE_PROGRESS_ALERTS} specific items; when more remain,
 * appends a single overflow row ("and N more").
 */
export function buildCourseProgressAlerts(
  enrollments: CourseProgressEnrollmentInput[],
  options?: { overflowDestination?: string }
): CourseProgressAlert[] {
  const overflowDestination = options?.overflowDestination ?? "/learner-dashboard";

  const incomplete = enrollments
    .filter(isIncompleteEnrollment)
    .sort((a, b) => {
      const aProgress = Number(a.progressPercentage ?? 0);
      const bProgress = Number(b.progressPercentage ?? 0);
      if (aProgress > 0 && bProgress === 0) return -1;
      if (aProgress === 0 && bProgress > 0) return 1;
      if (aProgress !== bProgress) return bProgress - aProgress;
      return a.title.localeCompare(b.title);
    });

  const specific = incomplete.slice(0, MAX_COURSE_PROGRESS_ALERTS).map(buildSpecificAlert);
  const overflow = incomplete.length - specific.length;

  if (overflow <= 0) {
    return specific;
  }

  return [
    ...specific,
    {
      id: "course-progress-overflow",
      type: "course_overflow",
      title: `and ${overflow} more`,
      body: `${overflow} enrolled course${overflow === 1 ? "" : "s"} waiting for you`,
      actionUrl: overflowDestination,
    },
  ];
}
