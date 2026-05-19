/**
 * Pick the canonical `courses` row for an AHA program (BLS / ACLS / PALS / Heartsaver).
 * Prefers the row with the most modules so empty test duplicates are ignored.
 */
import { asc, eq, inArray, sql } from "drizzle-orm";
import { courses, modules } from "../../drizzle/schema";
import { ensureBlsCatalog, ensureAclsCatalog } from "./ensure-bls-acls-catalog";
import { ensureCourseCatalogForSchedule } from "./ensure-course-catalog-for-schedule";

export type AhaAnchorProgramType = "bls" | "acls" | "pals" | "heartsaver";

export async function ensureAhaProgramCatalog(
  db: any,
  programType: AhaAnchorProgramType
): Promise<void> {
  if (programType === "bls") {
    await ensureBlsCatalog(db);
  } else if (programType === "acls") {
    await ensureAclsCatalog(db);
  } else if (programType === "pals") {
    await ensureCourseCatalogForSchedule(db, "pals");
  }
}

export async function resolveAhaCourseAnchor(
  db: any,
  programType: AhaAnchorProgramType
): Promise<(typeof courses.$inferSelect) | null> {
  await ensureAhaProgramCatalog(db, programType);

  const rows = await db
    .select()
    .from(courses)
    .where(eq(courses.programType, programType))
    .orderBy(asc(courses.id));

  if (!rows.length) return null;

  const counts = await db
    .select({
      courseId: modules.courseId,
      moduleCount: sql<number>`count(*)`.mapWith(Number),
    })
    .from(modules)
    .where(
      inArray(
        modules.courseId,
        rows.map((r: { id: number }) => r.id)
      )
    )
    .groupBy(modules.courseId);

  const countByCourse = new Map(counts.map((c: { courseId: number; moduleCount: number }) => [c.courseId, c.moduleCount]));

  let best = rows[0] as (typeof courses.$inferSelect);
  let bestCount = countByCourse.get(best.id) ?? 0;
  for (const row of rows as (typeof courses.$inferSelect)[]) {
    const n = countByCourse.get(row.id) ?? 0;
    if (n > bestCount) {
      best = row;
      bestCount = n;
    }
  }

  return best;
}
