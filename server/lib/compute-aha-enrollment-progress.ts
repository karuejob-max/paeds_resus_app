import { and, eq, inArray } from "drizzle-orm";
import { enrollments, modules, userProgress } from "../../drizzle/schema";
import type { getDb } from "../db";
import { resolveAhaCourseAnchor, type AhaAnchorProgramType } from "./resolve-aha-course-anchor";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

type AhaEnrollmentRow = {
  id: number;
  userId: number;
  programType: string;
  courseId: number | null;
  cognitiveModulesComplete: boolean | null;
};

/**
 * Percent of cognitive modules completed for an AHA enrollment (BLS/ACLS/PALS/NRP/Heartsaver).
 */
export async function computeAhaEnrollmentProgress(
  db: Db,
  userId: number,
  enrollment: AhaEnrollmentRow
): Promise<number> {
  if (enrollment.cognitiveModulesComplete) {
    return 100;
  }

  let catalogCourseId = enrollment.courseId;
  if (catalogCourseId == null) {
    const anchor = await resolveAhaCourseAnchor(
      db,
      enrollment.programType as AhaAnchorProgramType
    );
    catalogCourseId = anchor?.id ?? null;
  }
  if (catalogCourseId == null) {
    return 0;
  }

  const moduleRows = await db
    .select({ id: modules.id })
    .from(modules)
    .where(eq(modules.courseId, catalogCourseId));

  if (moduleRows.length === 0) {
    const progressRows = await db
      .select({ status: userProgress.status })
      .from(userProgress)
      .where(
        and(eq(userProgress.userId, userId), eq(userProgress.enrollmentId, enrollment.id))
      );
    return progressRows.some((r) => r.status === "completed" || r.status === "in_progress")
      ? 5
      : 0;
  }

  const moduleIds = moduleRows.map((m) => m.id);
  const completedRows = await db
    .select({ moduleId: userProgress.moduleId })
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.enrollmentId, enrollment.id),
        eq(userProgress.status, "completed"),
        inArray(userProgress.moduleId, moduleIds)
      )
    );

  const completedCount = new Set(completedRows.map((r) => r.moduleId)).size;
  return Math.min(Math.round((completedCount / moduleIds.length) * 100), 99);
}

export async function enrichAhaEnrollmentsWithProgress<
  T extends AhaEnrollmentRow,
>(db: Db, userId: number, rows: T[]): Promise<Array<T & { progressPercentage: number }>> {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      progressPercentage: await computeAhaEnrollmentProgress(db, userId, row),
    }))
  );
}
