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
import { resolveFellowshipCourseId } from "./microcourse-exam-gate";

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

  const fellowshipCourseId = await resolveFellowshipCourseId(db as never, {
    title: microCourse.title,
    order: microCourse.order,
    courseId: microCourse.courseId,
  });
  const fellowshipCourse = fellowshipCourseId
    ? await db.query.courses.findFirst({
        where: eq(courses.id, fellowshipCourseId),
      })
    : undefined;

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
export async function isMicroCourseEnrollmentId(db: Db, enrollmentId: number, userId: number): Promise<boolean> {
  // IMPORTANT: `enrollments` (AHA courses) and `microCourseEnrollments` (micro-courses)
  // are two separate tables that both auto-increment their `id` from 1. At scale,
  // the same numeric id WILL exist in both tables for different users — e.g. AHA
  // enrollment id=17 (Winjoy's ACLS enrollment) collided with a microCourseEnrollment
  // id=17 belonging to a completely different user. Checking `id` alone, without also
  // scoping to the current user, silently misroutes the quiz submission to the wrong
  // table and produces a misleading "Enrollment not found" error. Scoping by userId
  // here fixes the cross-user case, which was the overwhelming majority of real-world
  // failures (see docs/WORK_STATUS.md for the investigation). A same-user collision
  // (this learner has both an AHA enrollment and a micro-course enrollment sharing the
  // same numeric id) is a rarer, separate edge case — the real long-term fix is for the
  // client to send an explicit enrollment type alongside the id rather than relying on
  // an id lookup to disambiguate at all.
  const row = await db.query.microCourseEnrollments.findFirst({
    where: and(eq(microCourseEnrollments.id, enrollmentId), eq(microCourseEnrollments.userId, userId)),
    columns: { id: true },
  });
  return !!row;
}
