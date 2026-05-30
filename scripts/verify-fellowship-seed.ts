/** Verify fellowship seed — all catalog courses (excl. sample intubation). */
import { getDb } from "../server/db";
import { microCourses, courses, modules, quizzes } from "../drizzle/schema";
import { eq, like, and } from "drizzle-orm";
import {
  MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE,
  MICROCOURSE_SUMMATIVE_QUIZ_TITLE,
  examKindFromQuizTitle,
} from "../shared/microcourse-exam-policy";
import { MICRO_COURSE_CATALOG } from "../server/lib/micro-course-catalog";

const FELLOWSHIP_SLUGS = MICRO_COURSE_CATALOG.filter(
  (c) => c.isPublished && c.courseId !== "intubation-essentials"
).map((c) => c.courseId);

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
      .where(and(eq(courses.programType, "fellowship"), like(courses.title, `%${titlePrefix}%`)))
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
    const hasLevelInTitle = /Level\s+[12]/i.test(row.title);

    let diagnostic = 0;
    let summative = 0;
    let formativeModules = 0;
    const missingFormative: number[] = [];

    for (const mod of mods) {
      const qs = await db.select({ title: quizzes.title }).from(quizzes).where(eq(quizzes.moduleId, mod.id));
      let modDiagnostic = 0;
      let modSummative = 0;
      let modFormative = 0;
      for (const q of qs) {
        const kind = examKindFromQuizTitle(q.title);
        if (kind === "diagnostic") {
          diagnostic++;
          modDiagnostic++;
        } else if (kind === "summative") {
          summative++;
          modSummative++;
        if (kind === "formative") {
          modFormative++;
        }
      }
      if (modFormative > 0) formativeModules++;
      else missingFormative.push(mod.order ?? 0);
    }

    const examOk = diagnostic >= 1 && summative >= 1 && formativeModules === mods.length;
    const titleOk = !hasLevelInTitle;
    const ok = hasFooter && examOk && titleOk;

    if (!ok) failures++;

    rows.push(
      `${ok ? "[OK]" : "[FAIL]"} ${slug} | mods=${mods.length} | diag=${diagnostic} summ=${summative} formativeMods=${formativeModules}/${mods.length} | footer=${hasFooter} | levelTitle=${hasLevelInTitle}${missingFormative.length ? ` | missingFormativeOrders=${missingFormative.join(",")}` : ""}`
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
