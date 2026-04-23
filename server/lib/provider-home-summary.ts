import { and, desc, eq, inArray } from "drizzle-orm";

import { enrollments, microCourseEnrollments, microCourses } from "../../drizzle/schema";
import { getProviderCourseDestination } from "../../shared/provider-course-routes";
import { getDb } from "../db";
import { getResusGpsAccessForClient, type ResusGpsClientAccess } from "./resusgps-access";

type AhaEnrollmentRow = {
  id: number;
  programType: "bls" | "acls" | "pals" | "fellowship" | "instructor";
  paymentStatus: "pending" | "partial" | "completed" | null;
  createdAt: Date;
};

type MicroEnrollmentRow = {
  id: number;
  enrollmentStatus: "pending" | "active" | "completed" | "expired" | null;
  paymentStatus: "pending" | "completed" | "free" | null;
  progressPercentage: number | null;
  createdAt: Date;
  course: {
    courseId: string | null;
    title: string | null;
  } | null;
};

export type ProviderHomeActionKey =
  | "resume_payment"
  | "start_course"
  | "continue_learning"
  | "renew_resusgps"
  | "open_resusgps";

export type ProviderHomeAction = {
  key: ProviderHomeActionKey;
  title: string;
  description: string;
  cta: string;
  destination: string;
  enrollmentId?: number;
  programType?: string;
  courseId?: string | null;
};

export type ProviderHomeSecondaryAction = {
  key: "open_fellowship" | "open_aha_hub";
  label: string;
  description: string;
  destination: string;
};

export type ProviderHomeSummary = {
  primaryAction: ProviderHomeAction;
  secondaryActions: ProviderHomeSecondaryAction[];
  stats: {
    unpaidAhaCount: number;
    paidNotStartedCount: number;
    inProgressCount: number;
    hasResusGpsAccess: boolean;
    resusAccessMode: ResusGpsClientAccess["mode"];
  };
  resusAccess: ResusGpsClientAccess;
  generatedAt: string;
};

function isPaidMicroEnrollment(enrollment: MicroEnrollmentRow) {
  // Payment gate removed — all enrollments are active regardless of paymentStatus.
  return true;
}

export function selectProviderHomePrimaryAction(args: {
  ahaEnrollments: AhaEnrollmentRow[];
  microEnrollments: MicroEnrollmentRow[];
  resusAccess: ResusGpsClientAccess;
}): ProviderHomeAction {
  // Payment gate removed — all AHA enrollments are immediately active.
  // resume_payment action is intentionally disabled.

  const paidNotStarted = args.microEnrollments.find(
    (enrollment) =>
      isPaidMicroEnrollment(enrollment) &&
      enrollment.enrollmentStatus !== "completed" &&
      Number(enrollment.progressPercentage ?? 0) <= 0
  );
  if (paidNotStarted) {
    return {
      key: "start_course",
      title: "Start your paid course",
      description: `Begin ${paidNotStarted.course?.title ?? "your course"} now.`,
      cta: "Start course",
      destination: getProviderCourseDestination(paidNotStarted.course?.courseId, paidNotStarted.id),
      enrollmentId: paidNotStarted.id,
      courseId: paidNotStarted.course?.courseId,
    };
  }

  const startedNotCompleted = args.microEnrollments.find(
    (enrollment) =>
      isPaidMicroEnrollment(enrollment) &&
      enrollment.enrollmentStatus !== "completed" &&
      Number(enrollment.progressPercentage ?? 0) > 0 &&
      Number(enrollment.progressPercentage ?? 0) < 100
  );
  if (startedNotCompleted) {
    return {
      key: "continue_learning",
      title: "Continue learning",
      description: `Resume ${startedNotCompleted.course?.title ?? "your current course"}.`,
      cta: "Continue course",
      destination: getProviderCourseDestination(startedNotCompleted.course?.courseId, startedNotCompleted.id),
      enrollmentId: startedNotCompleted.id,
      courseId: startedNotCompleted.course?.courseId,
    };
  }

  if (!args.resusAccess.canUse) {
    return {
      key: "renew_resusgps",
      title: "Renew ResusGPS access",
      description: "Complete a fellowship micro-course to extend access.",
      cta: "Open fellowship",
      destination: "/fellowship",
    };
  }

  return {
    key: "open_resusgps",
    title: "Open ResusGPS",
    description: "Launch bedside emergency guidance.",
    cta: "Open ResusGPS",
    destination: "/resus",
  };
}

export async function buildProviderHomeSummary(userId: number): Promise<ProviderHomeSummary> {
  const database = await getDb();
  if (!database) {
    throw new Error("Provider home is temporarily unavailable. Please try again.");
  }

  const [ahaEnrollments, microEnrollmentsRaw, resusAccess] = await Promise.all([
    database
      .select({
        id: enrollments.id,
        programType: enrollments.programType,
        paymentStatus: enrollments.paymentStatus,
        createdAt: enrollments.createdAt,
      })
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), inArray(enrollments.programType, ["bls", "acls", "pals"])))
      .orderBy(desc(enrollments.createdAt)),
    database
      .select({
        id: microCourseEnrollments.id,
        enrollmentStatus: microCourseEnrollments.enrollmentStatus,
        paymentStatus: microCourseEnrollments.paymentStatus,
        progressPercentage: microCourseEnrollments.progressPercentage,
        createdAt: microCourseEnrollments.createdAt,
        courseId: microCourses.courseId,
        courseTitle: microCourses.title,
      })
      .from(microCourseEnrollments)
      .leftJoin(microCourses, eq(microCourseEnrollments.microCourseId, microCourses.id))
      .where(eq(microCourseEnrollments.userId, userId))
      .orderBy(desc(microCourseEnrollments.createdAt)),
    getResusGpsAccessForClient(userId),
  ]);

  const microEnrollments: MicroEnrollmentRow[] = microEnrollmentsRaw.map((enrollment) => ({
    id: enrollment.id,
    enrollmentStatus: enrollment.enrollmentStatus,
    paymentStatus: enrollment.paymentStatus,
    progressPercentage: enrollment.progressPercentage,
    createdAt: enrollment.createdAt,
    course:
      enrollment.courseId || enrollment.courseTitle
        ? {
            courseId: enrollment.courseId,
            title: enrollment.courseTitle,
          }
        : null,
  }));

  const primaryAction = selectProviderHomePrimaryAction({
    ahaEnrollments,
    microEnrollments,
    resusAccess,
  });

  return {
    primaryAction,
    secondaryActions: [
      {
        key: "open_fellowship",
        label: "Paeds Resus Fellowship",
        description: "Browse fellowship micro-courses and your learning pathway.",
        destination: "/fellowship",
      },
      {
        key: "open_aha_hub",
        label: "AHA Courses",
        description: "Open BLS, ACLS, and PALS certification options.",
        destination: "/aha-courses",
      },
    ],
    stats: {
      unpaidAhaCount: 0, // Payment gate removed — all enrollments are immediately active.
      paidNotStartedCount: microEnrollments.filter(
        (enrollment) =>
          isPaidMicroEnrollment(enrollment) &&
          enrollment.enrollmentStatus !== "completed" &&
          Number(enrollment.progressPercentage ?? 0) <= 0
      ).length,
      inProgressCount: microEnrollments.filter(
        (enrollment) =>
          isPaidMicroEnrollment(enrollment) &&
          enrollment.enrollmentStatus !== "completed" &&
          Number(enrollment.progressPercentage ?? 0) > 0 &&
          Number(enrollment.progressPercentage ?? 0) < 100
      ).length,
      hasResusGpsAccess: resusAccess.canUse,
      resusAccessMode: resusAccess.mode,
    },
    resusAccess,
    generatedAt: new Date().toISOString(),
  };
}
