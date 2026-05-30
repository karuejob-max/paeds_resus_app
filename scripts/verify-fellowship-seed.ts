/** Spot-check fellowship seed on production — run: pnpm exec tsx --import dotenv/config scripts/verify-fellowship-seed.ts */
import { getDb } from "../server/db";
import { microCourses, courses, modules, quizzes } from "../drizzle/schema";
import { eq, like, and } from "drizzle-orm";
import {
  MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE,
  MICROCOURSE_SUMMATIVE_QUIZ_TITLE,
} from "../shared/microcourse-exam-policy";

const SPOT_SLUGS = ["dka-i", "status-epilepticus-i", "septic-shock-ii", "pneumonia-i"];

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("No DB");
    process.exit(1);
  }

  const catalog = await db.select({ courseId: microCourses.courseId, title: microCourses.title }).from(microCourses);
  console.log(`Catalog rows: ${catalog.length}`);

  for (const slug of SPOT_SLUGS) {
    const [row] = await db.select().from(microCourses).where(eq(microCourses.courseId, slug)).limit(1);
    if (!row) {
      console.log(`[MISS] ${slug} not in catalog`);
      continue;
    }

    const [course] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.programType, "fellowship"), like(courses.title, `%${row.title.split(":")[0]}%`)))
      .limit(1);

    if (!course) {
      console.log(`[MISS] ${slug} — no courses row`);
      continue;
    }

    const mods = await db.select({ id: modules.id, order: modules.order, content: modules.content }).from(modules).where(eq(modules.courseId, course.id));
    const hasFooter = mods.some((m) => m.content?.includes("Educational use only"));
    const hasMmol = slug.startsWith("dka") ? mods.some((m) => m.content?.includes("mmol/L")) : true;

    let diagnostic = 0;
    let summative = 0;
    for (const mod of mods) {
      const qs = await db.select({ title: quizzes.title }).from(quizzes).where(eq(quizzes.moduleId, mod.id));
      for (const q of qs) {
        if (q.title === MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE) diagnostic++;
        if (q.title === MICROCOURSE_SUMMATIVE_QUIZ_TITLE) summative++;
      }
    }

    console.log(
      `[OK] ${slug} — modules=${mods.length} footer=${hasFooter} mmol=${hasMmol} diagnostic=${diagnostic} summative=${summative}`
    );
  }
}

main().catch(console.error);
