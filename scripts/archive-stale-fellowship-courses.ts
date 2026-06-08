/**
 * Archive or delete stale duplicate fellowship `courses` rows (e.g. asthma order=1 id=66 vs id=6).
 *
 * Safe default: dry-run. Pass `--execute` to apply.
 * Pass `--ids=66,47` to override the default stale ids.
 *
 * When userProgress exists on any module of a stale course, the row is **archived**
 * (title prefixed, order moved out of catalog range) instead of deleted.
 *
 * Prod cleanup (manual SQL alternative):
 *   SELECT id, title, `order`, programType FROM courses
 *   WHERE programType = 'fellowship' AND `order` = 1 AND title LIKE '%Asthma%';
 *   -- Confirm canonical id=6 has 3 modules / 10 diagnostic Q; stale id=66 has 2/2.
 *   UPDATE courses SET title = CONCAT('[ARCHIVED duplicate] ', title), `order` = 90066
 *   WHERE id = 66 AND programType = 'fellowship';
 *
 *   pnpm run archive:stale-fellowship-courses -- --execute
 */
import "dotenv/config";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../server/db";
import {
  courses,
  moduleSections,
  modules,
  quizQuestions,
  quizzes,
  userProgress,
} from "../drizzle/schema";

const DEFAULT_STALE_IDS = [66, 47];
const ARCHIVED_ORDER_BASE = 90_000;

function parseArgs(argv: string[]): { execute: boolean; ids: number[] } {
  let execute = false;
  let ids = DEFAULT_STALE_IDS;

  for (const arg of argv) {
    if (arg === "--execute") execute = true;
    else if (arg.startsWith("--ids=")) {
      ids = arg
        .slice("--ids=".length)
        .split(",")
        .map((s) => Number.parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n));
    }
  }

  return { execute, ids };
}

async function countProgressForCourse(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  courseId: number
): Promise<number> {
  const moduleRows = await db
    .select({ id: modules.id })
    .from(modules)
    .where(eq(modules.courseId, courseId));

  if (moduleRows.length === 0) return 0;

  const moduleIds = moduleRows.map((m) => m.id);
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(userProgress)
    .where(inArray(userProgress.moduleId, moduleIds));

  return Number(row?.count ?? 0);
}

async function deleteCourseTree(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  courseId: number
): Promise<void> {
  const moduleRows = await db
    .select({ id: modules.id })
    .from(modules)
    .where(eq(modules.courseId, courseId));

  const moduleIds = moduleRows.map((m) => m.id);
  if (moduleIds.length > 0) {
    const quizRows = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(inArray(quizzes.moduleId, moduleIds));
    const quizIds = quizRows.map((q) => q.id);

    if (quizIds.length > 0) {
      await db.delete(quizQuestions).where(inArray(quizQuestions.quizId, quizIds));
      await db.delete(quizzes).where(inArray(quizzes.id, quizIds));
    }

    await db.delete(moduleSections).where(inArray(moduleSections.moduleId, moduleIds));
    await db.delete(modules).where(inArray(modules.id, moduleIds));
  }

  await db.delete(courses).where(eq(courses.id, courseId));
}

async function archiveCourseRow(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  course: { id: number; title: string }
): Promise<void> {
  const archivedTitle = course.title.startsWith("[ARCHIVED")
    ? course.title
    : `[ARCHIVED duplicate] ${course.title}`;

  await db
    .update(courses)
    .set({
      title: archivedTitle,
      order: ARCHIVED_ORDER_BASE + course.id,
    })
    .where(eq(courses.id, course.id));
}

async function main(): Promise<void> {
  const { execute, ids } = parseArgs(process.argv.slice(2));
  const db = await getDb();
  if (!db) {
    console.error("Database not available (DATABASE_URL unset?).");
    process.exitCode = 1;
    return;
  }

  console.log(
    `${execute ? "EXECUTE" : "DRY-RUN"}: stale fellowship courses ids=${ids.join(",")}`
  );

  for (const courseId of ids) {
    const [course] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.programType, "fellowship")))
      .limit(1);

    if (!course) {
      console.log(`[skip] id=${courseId} — not found or not fellowship`);
      continue;
    }

    const moduleCount = await db
      .select({ id: modules.id })
      .from(modules)
      .where(eq(modules.courseId, courseId));
    const progressCount = await countProgressForCourse(db, courseId);

    console.log(
      `[inspect] id=${courseId} title="${course.title}" order=${course.order} modules=${moduleCount.length} userProgress=${progressCount}`
    );

    if (!execute) continue;

    if (progressCount > 0) {
      await archiveCourseRow(db, course);
      console.log(`[archived] id=${courseId} (progress preserved)`);
    } else {
      await deleteCourseTree(db, courseId);
      console.log(`[deleted] id=${courseId} (no userProgress)`);
    }
  }

  if (!execute) {
    console.log("Re-run with --execute to apply changes.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
