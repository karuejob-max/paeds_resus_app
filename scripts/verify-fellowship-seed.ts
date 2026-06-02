/** Verify fellowship seed — all catalog courses (excl. sample intubation).
 * Includes `seriously-ill-child-i` (seed via `pnpm run seed:seriously-ill-child-course`).
 * Fails on thinFormative (>0 modules with <3 unique formative stems).
 */
import { getDb } from "../server/db";
import { microCourses, courses, modules, quizzes, quizQuestions } from "../drizzle/schema";
import { eq, like, and, or } from "drizzle-orm";
import {
  MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE,
  MICROCOURSE_SUMMATIVE_QUIZ_TITLE,
  MICROCOURSE_MIN_QUESTION_BANK_SIZE,
  MIN_FORMATIVE_QUESTIONS_PER_MODULE,
  examKindFromQuizTitle,
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

  let failures = 0;
  const rows: string[] = [];

  for (const slug of FELLOWSHIP_SLUGS) {
    const [row] = await db.select().from(microCourses).where(eq(microCourses.courseId, slug)).limit(1);
    if (!row) {
      console.log(`[FAIL] ${slug} — not in microCourses catalog`);
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
      console.log(`[FAIL] ${slug} — no fellowship courses row (title prefix: ${titlePrefix})`);
      failures++;
      continue;
    }

    const mods = await db
      .select({ id: modules.id, order: modules.order, content: modules.content })
      .from(modules)
      .where(eq(modules.courseId, course.id));

    const hasFooter = mods.some((m) => m.content?.includes("Educational use only"));
    const hasLevelInTitle = hasLegacyCourseNumberTitle(row.title);

    let diagnostic = 0;
    let summative = 0;
    let formativeModules = 0;
    let summativeQuestionCount = 0;
    let thinFormativeModules = 0;
    const missingFormative: number[] = [];

    for (const mod of mods) {
      const qs = await db.select({ id: quizzes.id, title: quizzes.title }).from(quizzes).where(eq(quizzes.moduleId, mod.id));
      let modFormative = 0;
      const moduleFormativeStems = new Set<string>();
      for (const q of qs) {
        const kind = examKindFromQuizTitle(q.title);
        if (kind === "diagnostic") {
          diagnostic++;
        } else if (kind === "summative") {
          summative++;
          const qCount = await db
            .select({ id: quizQuestions.id })
            .from(quizQuestions)
            .where(eq(quizQuestions.quizId, q.id));
          summativeQuestionCount = Math.max(summativeQuestionCount, qCount.length);
        } else if (kind === "formative") {
          modFormative++;
          const fq = await db
            .select({ question: quizQuestions.question })
            .from(quizQuestions)
            .where(eq(quizQuestions.quizId, q.id));
          for (const row of fq) {
            const stem = row.question?.trim();
            if (stem) moduleFormativeStems.add(stem);
          }
        }
      }
      if (modFormative > 0) {
        formativeModules++;
        if (moduleFormativeStems.size < MIN_FORMATIVE_QUESTIONS_PER_MODULE) thinFormativeModules++;
      } else missingFormative.push(mod.order ?? 0);
    }

    const summativeBankOk = summativeQuestionCount >= MICROCOURSE_MIN_QUESTION_BANK_SIZE;
    const formativeDepthOk = thinFormativeModules === 0;
    const summativeOk = summative >= 1;
    const examOk =
      diagnostic >= 1 &&
      summativeOk &&
      formativeModules === mods.length &&
      summativeBankOk &&
      formativeDepthOk;
    const titleOk = !hasLevelInTitle;
    const ok = hasFooter && examOk && titleOk;

    if (!ok) failures++;

    rows.push(
      `${ok ? "[OK]" : "[FAIL]"} ${slug} | mods=${mods.length} | diag=${diagnostic} summ=${summative} summQs=${summativeQuestionCount} formativeMods=${formativeModules}/${mods.length} thinFormative=${thinFormativeModules} | footer=${hasFooter} | levelTitle=${hasLevelInTitle}${missingFormative.length ? ` | missingFormativeOrders=${missingFormative.join(",")}` : ""}${!summativeBankOk ? " | summBank<15" : ""}${!formativeDepthOk ? " | thinFormative" : ""}`
    );
  }

  console.log(`Fellowship verify: ${FELLOWSHIP_SLUGS.length} courses, ${failures} failure(s)\n`);
  for (const r of rows) console.log(r);
  if (failures > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
