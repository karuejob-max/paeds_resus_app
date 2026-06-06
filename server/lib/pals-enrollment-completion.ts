import { and, eq } from "drizzle-orm";
import { enrollments, modules, userProgress } from "../../drizzle/schema";
import { getPalsAhaCourseId } from "./ensure-pals-aha-catalog";

/**
 * True when every module in the enrollment's PALS course (AHA anchor or legacy septic E2E) is marked completed.
 */
export async function isPalsEnrollmentModulesComplete(db: any, enrollmentId: number, userId: number): Promise<boolean> {
  const enr = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);
  if (!enr[0] || enr[0].programType !== "pals") return true;

  let courseId: number | null = enr[0].courseId ?? null;
  if (courseId == null) {
    courseId = await getPalsAhaCourseId(db);
  }

  if (courseId == null) return false;

  const mods = await db.select({ id: modules.id }).from(modules).where(eq(modules.courseId, courseId));
  if (mods.length === 0) return false;

  for (const m of mods) {
    const rows = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.enrollmentId, enrollmentId),
          eq(userProgress.userId, userId),
          eq(userProgress.moduleId, m.id),
          eq(userProgress.status, "completed")
        )
      )
      .limit(1);
    if (rows.length === 0) return false;
  }

  // Capstone Check: Virtual moduleId -1
  const capstoneRows = await db
    .select()
    .from(userProgress)
    .where(
      and(
        eq(userProgress.enrollmentId, enrollmentId),
        eq(userProgress.userId, userId),
        eq(userProgress.moduleId, -1),
        eq(userProgress.status, "completed")
      )
    )
    .limit(1);

  if (capstoneRows.length === 0) return false;
  if ((capstoneRows[0].score ?? 0) < 80) return false;

  return true;
}
