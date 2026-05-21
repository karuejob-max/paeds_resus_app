/**
 * Keeps microCourseEnrollments.progressPercentage in sync with userProgress rows
 * (fellowship learning modules keyed by microCourseEnrollment.id).
 */
import { and, eq, inArray } from "drizzle-orm";
import {
  courses,
  microCourseEnrollments,
  microCourses,
  modules,
  userProgress,
} from "../../drizzle/schema";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/** Published fellowship micro-courses in the MECE catalog (dynamic count). */
export async function computeMicroCourseEnrollmentProgress(
  db: Db,
  userId: number,
  microCourseEnrollmentId: number
): Promise<number> {
  const enrollment = await db.query.microCourseEnrollments.findFirst({
    where: eq(microCourseEnrollments.id, microCourseEnrollmentId),
  });
  if (!enrollment || enrollment.userId !== userId) {
    return 0;
  }
  if (enrollment.enrollmentStatus === "completed") {
    return 100;
  }

  const microCourse = await db.query.microCourses.findFirst({
    where: eq(microCourses.id, enrollment.microCourseId),
  });
  if (!microCourse?.title) {
    return Number(enrollment.progressPercentage ?? 0);
  }

  const fellowshipCourse = await db.query.courses.findFirst({
    where: and(eq(courses.title, microCourse.title), eq(courses.programType, "fellowship")),
  });

  let pct: number;
  if (!fellowshipCourse) {
    const progressRows = await db
      .select({ status: userProgress.status })
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.enrollmentId, microCourseEnrollmentId)
        )
      );
    pct = progressRows.some((r) => r.status === "completed" || r.status === "in_progress") ? 5 : 0;
  } else {
    const moduleRows = await db
      .select({ id: modules.id })
      .from(modules)
      .where(eq(modules.courseId, fellowshipCourse.id));
    if (moduleRows.length === 0) {
      return Number(enrollment.progressPercentage ?? 0);
    }
    const moduleIds = moduleRows.map((m) => m.id);
    const completedRows = await db
      .select({ moduleId: userProgress.moduleId })
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.enrollmentId, microCourseEnrollmentId),
          eq(userProgress.status, "completed"),
          inArray(userProgress.moduleId, moduleIds)
        )
      );
    const completedCount = new Set(completedRows.map((r) => r.moduleId)).size;
    pct = Math.round((completedCount / moduleIds.length) * 100);
  }

  const clamped = Math.min(Math.max(pct, 0), 99);
  if (Number(enrollment.progressPercentage ?? 0) !== clamped) {
    await db
      .update(microCourseEnrollments)
      .set({ progressPercentage: clamped, updatedAt: new Date() })
      .where(eq(microCourseEnrollments.id, microCourseEnrollmentId));
  }
  return clamped;
}

export async function syncMicroCourseEnrollmentProgress(
  db: Db,
  userId: number,
  microCourseEnrollmentId: number
): Promise<number> {
  return computeMicroCourseEnrollmentProgress(db, userId, microCourseEnrollmentId);
}

/** True when enrollmentId belongs to microCourseEnrollments (not AHA enrollments). */
export async function isMicroCourseEnrollmentId(db: Db, enrollmentId: number): Promise<boolean> {
  const row = await db.query.microCourseEnrollments.findFirst({
    where: eq(microCourseEnrollments.id, enrollmentId),
    columns: { id: true },
  });
  return !!row;
}
