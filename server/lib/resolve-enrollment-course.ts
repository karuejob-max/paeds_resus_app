/**
 * Resolve the BLS course row an enrollment actually belongs to.
 *
 * Enrollments already store `courseId` at creation, but readers used the
 * program-wide "anchor" row instead. Now that BLS has two curriculum versions,
 * every reader must honour the enrollment's own course so learners who started
 * on the original curriculum keep their modules, progress, exam and completion
 * rules. Returns null when there is nothing to pin (callers fall back to the
 * current anchor, which is correct for brand-new learners).
 */
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { courses, enrollments, modules, userProgress } from "../../drizzle/schema";
import { getBlsV2Audience } from "./bls-course-versions";
import { resolveAhaCourseAnchor } from "./resolve-aha-course-anchor";

type CourseRow = typeof courses.$inferSelect;

async function courseHasModules(db: any, courseId: number): Promise<boolean> {
  const rows = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(modules)
    .where(eq(modules.courseId, courseId));
  return (rows[0]?.n ?? 0) > 0;
}

async function usableBlsCourse(db: any, courseId: number | null | undefined): Promise<CourseRow | null> {
  if (courseId == null) return null;
  const rows = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
  const row = rows[0] as CourseRow | undefined;
  if (!row || row.programType !== "bls" || !row.isActive) return null;
  return (await courseHasModules(db, row.id)) ? row : null;
}

export async function resolvePinnedBlsCourse(
  db: any,
  params: { userId?: number | null; enrollmentId?: number | null }
): Promise<CourseRow | null> {
  const { userId, enrollmentId } = params;
  if (!userId && !enrollmentId) return null;

  const conditions = [eq(enrollments.programType, "bls"), ne(enrollments.enrollmentStatus, "cancelled")];
  if (userId) conditions.push(eq(enrollments.userId, userId));
  if (enrollmentId) conditions.push(eq(enrollments.id, enrollmentId));
  const enrolRows = await db
    .select({
      id: enrollments.id,
      courseId: enrollments.courseId,
      cognitiveModulesComplete: enrollments.cognitiveModulesComplete,
    })
    .from(enrollments)
    .where(and(...conditions))
    .orderBy(desc(enrollments.updatedAt))
    .limit(1);
  const enrol = enrolRows[0] as
    | { id: number; courseId: number | null; cognitiveModulesComplete: boolean | null }
    | undefined;
  if (!enrol) return null;

  // Audience "everyone": a learner who has not completed BLS studies the current
  // course, so completion and exam state must follow it. A completed learner keeps
  // their own record (certificate eligibility re-checks module progress).
  if (getBlsV2Audience() === "everyone" && !enrol.cognitiveModulesComplete) return null;

  // 1. The course the enrollment was created against.
  const pinned = await usableBlsCourse(db, enrol.courseId);
  if (pinned) return pinned;

  // 2. Legacy/unset pin: infer from the modules the learner already has progress on.
  const progressRows = await db
    .select({ courseId: modules.courseId })
    .from(userProgress)
    .innerJoin(modules, eq(modules.id, userProgress.moduleId))
    .where(eq(userProgress.enrollmentId, enrol.id));
  if (progressRows.length > 0) {
    const tally = new Map<number, number>();
    for (const r of progressRows as { courseId: number }[]) {
      tally.set(r.courseId, (tally.get(r.courseId) ?? 0) + 1);
    }
    const ordered = [...tally.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
    for (const id of ordered) {
      const row = await usableBlsCourse(db, id);
      if (row) return row;
    }
  }

  // 3. Already started or finished but the stored course is unusable: stay on the
  //    original (non-v2) curriculum rather than moving the learner to new content.
  if (progressRows.length > 0 || enrol.cognitiveModulesComplete) {
    return resolveAhaCourseAnchor(db, "bls", { skipEnsure: true, preferVersion: "legacy" });
  }

  return null;
}

