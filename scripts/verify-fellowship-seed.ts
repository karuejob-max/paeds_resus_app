/** Verify fellowship seed â€” all catalog courses (excl. sample intubation).
 * Includes `seriously-ill-child-i` (seed via `pnpm run seed:seriously-ill-child-course`).
 * Fails on thinFormative (>0 modules with <3 unique formative stems).
 */
import { getDb } from "../server/db";
import { microCourses, courses, modules, moduleSections, quizzes, quizQuestions, fellowshipSimulations } from "../drizzle/schema";
import { eq, like, and, or, sql } from "drizzle-orm";
import { moduleSectionsStale } from "../shared/split-module-html-sections";
import {
  MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE,
  MICROCOURSE_SUMMATIVE_QUIZ_TITLE,
  MICROCOURSE_MIN_QUESTION_BANK_SIZE,
  MIN_FORMATIVE_QUESTIONS_PER_MODULE,
  examKindFromQuizTitle,
  normalizeQuestionStem,
} from "../shared/microcourse-exam-policy";
import {
  isFellowshipPillarMicroCourse,
  MICRO_COURSE_CATALOG,
} from "../server/lib/micro-course-catalog";
import { hasLegacyCourseNumberTitle } from "../shared/micro-course-display";

const FELLOWSHIP_SLUGS = MICRO_COURSE_CATALOG.filter(isFellowshipPillarMicroCourse).map(
  (c) => c.courseId
);

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("No DB");
    process.exit(1);
  }


  const [colRow] = await db.execute(
    sql`SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'userProgress' AND COLUMN_NAME = 'fellowshipSimulationId'`
  );
  const colCount = Number((colRow as { c: number }[])[0]?.c ?? 0);
  if (colCount < 1) {
    console.error("[FAIL] userProgress.fellowshipSimulationId column missing — run pnpm run db:apply-0050");
    process.exit(1);
  }
  console.log("[OK] userProgress.fellowshipSimulationId column present");

  const [simCountRow] = await db.select({ c: sql<number>`count(*)` }).from(fellowshipSimulations);
  const simRowCount = Number(simCountRow?.c ?? 0);
  const minSimRows = FELLOWSHIP_SLUGS.length;
  if (simRowCount < minSimRows) {
    console.error(
      `[FAIL] fellowshipSimulations row count ${simRowCount} < expected ${minSimRows} — run pnpm run seed:fellowship-content:all`
    );
    process.exit(1);
  }
  console.log(`[OK] fellowshipSimulations rows=${simRowCount} (expected >= ${minSimRows})`);
  let failures = 0;
  const rows: string[] = [];

  for (const slug of FELLOWSHIP_SLUGS) {
    const [row] = await db.select().from(microCourses).where(eq(microCourses.courseId, slug)).limit(1);
    if (!row) {
      console.log(`[FAIL] ${slug} â€” not in microCourses catalog`);
      failures++;
      continue;
    }

    const titlePrefix = row.title.split(":")[0]!.trim();
    const [course] = await db
      .select()
      .from(courses)
      .where(
        and(
          eq(courses.programType, "fellowship"),
          or(like(courses.title, `%${titlePrefix}%`), eq(courses.order, row.order))
        )
      )
      .limit(1);

    if (!course) {
      console.log(`[FAIL] ${slug} â€” no fellowship courses row (title prefix: ${titlePrefix})`);
      failures++;
      continue;
    }

    const mods = await db
      .select({ id: modules.id, order: modules.order, content: modules.content })
      .from(modules)
      .where(eq(modules.courseId, course.id));

    let staleSectionModules = 0;
    for (const mod of mods) {
      const secs = await db
        .select({ content: moduleSections.content })
        .from(moduleSections)
        .where(eq(moduleSections.moduleId, mod.id));
      if (moduleSectionsStale(mod.content ?? "", secs)) staleSectionModules++;
    }

    const hasFooter = mods.some((m) => m.content?.includes("Educational use only"));
    const hasLevelInTitle = hasLegacyCourseNumberTitle(row.title);

    let diagnostic = 0;
    let summative = 0;
    let formativeModules = 0;
    let summativeQuestionCount = 0;
    let thinFormativeModules = 0;
    let withinQuizDuplicateStems = 0;
    let diagnosticSummativeOverlap = 0;
    let summFormOverlap = 0;
    const missingFormative: number[] = [];
    const diagnosticStems = new Set<string>();
    const summativeStems = new Set<string>();
    const formativeStems = new Set<string>();

    for (const mod of mods) {
      const qs = await db.select({ id: quizzes.id, title: quizzes.title }).from(quizzes).where(eq(quizzes.moduleId, mod.id));
      let modFormative = 0;
      const moduleFormativeStems = new Set<string>();
      for (const q of qs) {
        const kind = examKindFromQuizTitle(q.title);
        const fq = await db
          .select({ question: quizQuestions.question })
          .from(quizQuestions)
          .where(eq(quizQuestions.quizId, q.id));
        const stems = fq.map((row) => row.question?.trim()).filter(Boolean) as string[];
        const stemSet = new Set(stems.map(normalizeQuestionStem));
        if (stems.length !== stemSet.size) withinQuizDuplicateStems++;

        if (kind === "diagnostic") {
          diagnostic++;
          for (const s of stemSet) diagnosticStems.add(s);
        } else if (kind === "summative") {
          summative++;
          const qCount = stems.length;
          summativeQuestionCount = Math.max(summativeQuestionCount, qCount);
          for (const s of stemSet) summativeStems.add(s);
        } else if (kind === "formative") {
          modFormative++;
          for (const s of stemSet) {
            moduleFormativeStems.add(s);
            formativeStems.add(s);
          }
        }
      }
      if (modFormative > 0) {
        formativeModules++;
        if (moduleFormativeStems.size < MIN_FORMATIVE_QUESTIONS_PER_MODULE) thinFormativeModules++;
      } else missingFormative.push(mod.order ?? 0);
    }

    for (const s of diagnosticStems) {
      if (summativeStems.has(s)) diagnosticSummativeOverlap++;
    }
    for (const s of summativeStems) {
      if (formativeStems.has(s)) summFormOverlap++;
    }

    const summativeBankOk = summativeQuestionCount >= MICROCOURSE_MIN_QUESTION_BANK_SIZE;
    const formativeDepthOk = thinFormativeModules === 0;
    const noWithinQuizDups = withinQuizDuplicateStems === 0;
    const noSummFormOverlap = summFormOverlap === 0;
    const summativeOk = summative >= 1;
    const examOk =
      diagnostic >= 1 &&
      summativeOk &&
      formativeModules === mods.length &&
      summativeBankOk &&
      formativeDepthOk &&
      noWithinQuizDups &&
      noSummFormOverlap;
    const titleOk = !hasLevelInTitle;
    const sectionsOk = staleSectionModules === 0;
    const ok = hasFooter && examOk && titleOk && sectionsOk;

    if (!ok) failures++;

    rows.push(
      `${ok ? "[OK]" : "[FAIL]"} ${slug} | mods=${mods.length} | diag=${diagnostic} summ=${summative} summQs=${summativeQuestionCount} formativeMods=${formativeModules}/${mods.length} thinFormative=${thinFormativeModules} withinQuizDups=${withinQuizDuplicateStems} diagSummOverlap=${diagnosticSummativeOverlap} summFormOverlap=${summFormOverlap} | footer=${hasFooter} | levelTitle=${hasLevelInTitle} | staleSections=${staleSectionModules}${missingFormative.length ? ` | missingFormativeOrders=${missingFormative.join(",")}` : ""}${!summativeBankOk ? " | summBank<15" : ""}${!formativeDepthOk ? " | thinFormative" : ""}${!noWithinQuizDups ? " | withinQuizDups" : ""}${!noSummFormOverlap ? " | summFormOverlap" : ""}${!sectionsOk ? " | staleSections" : ""}`
    );
  }

  console.log(`Fellowship verify: ${FELLOWSHIP_SLUGS.length} courses, ${failures} failure(s)\n`);
  for (const r of rows) console.log(r);
  if (failures > 0) process.exit(1);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

