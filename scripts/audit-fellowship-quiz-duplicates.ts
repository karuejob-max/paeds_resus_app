/**
 * Compare seed source vs production DB for duplicate question stems.
 * Fails on within-quiz duplicate stems (same quiz row, identical stem twice).
 */
import { getDb } from "../server/db";
import { microCourses, courses, modules, quizzes, quizQuestions } from "../drizzle/schema";
import { eq, like, and, or } from "drizzle-orm";
import {
  examKindFromQuizTitle,
  MIN_FORMATIVE_QUESTIONS_PER_MODULE,
} from "../shared/microcourse-exam-policy";
import {
  isFellowshipPillarMicroCourse,
  MICRO_COURSE_CATALOG,
} from "../server/lib/micro-course-catalog";
import {
  getAllFellowshipSeedContent,
  resolveCatalogSlug,
} from "./fellowship-seed-lib";

const FELLOWSHIP_SLUGS = MICRO_COURSE_CATALOG.filter(isFellowshipPillarMicroCourse).map(
  (c) => c.courseId
);

function normStem(q: string): string {
  return q.trim().replace(/\s+/g, " ").toLowerCase();
}

type WithinQuizDup = {
  slug: string;
  quizTitle: string;
  quizId: number;
  moduleOrder: number;
  duplicateStems: string[];
};

type CrossQuizOverlap = {
  slug: string;
  kindA: string;
  kindB: string;
  overlapCount: number;
};

function findWithinQuizDuplicates(
  slug: string,
  quizTitle: string,
  quizId: number,
  moduleOrder: number,
  stems: string[]
): WithinQuizDup | null {
  const seen = new Map<string, number>();
  const dups: string[] = [];
  for (const s of stems) {
    const k = normStem(s);
    seen.set(k, (seen.get(k) ?? 0) + 1);
    if (seen.get(k)! === 2) dups.push(s);
  }
  if (dups.length === 0) return null;
  return { slug, quizTitle, quizId, moduleOrder, duplicateStems: dups };
}

function seedWithinQuizDuplicates(): WithinQuizDup[] {
  const out: WithinQuizDup[] = [];
  for (const c of getAllFellowshipSeedContent()) {
    const slug = resolveCatalogSlug(c.id);
    const bank = c.quiz?.questions ?? [];
    const bankDup = findWithinQuizDuplicates(slug, "summative-seed", 0, 0, bank.map((q) => q.question));
    if (bankDup) out.push(bankDup);

    for (let i = 0; i < c.modules.length; i++) {
      const qs = c.modules[i]?.questions ?? [];
      const dup = findWithinQuizDuplicates(
        slug,
        `formative-module-${i + 1}-seed`,
        0,
        i + 1,
        qs.map((q) => q.question)
      );
      if (dup) out.push(dup);
    }
  }
  return out;
}

async function dbWithinQuizDuplicates(slugs?: string[]): Promise<{
  withinQuiz: WithinQuizDup[];
  crossQuiz: CrossQuizOverlap[];
  spotCheck: Record<string, { diagnostic: number; summative: number; overlap: number; withinFormative: number }>;
}> {
  const db = await getDb();
  if (!db) throw new Error("No DB");

  const targetSlugs = slugs ?? FELLOWSHIP_SLUGS;
  const withinQuiz: WithinQuizDup[] = [];
  const crossQuiz: CrossQuizOverlap[] = [];
  const spotCheck: Record<
    string,
    { diagnostic: number; summative: number; overlap: number; withinFormative: number }
  > = {};

  for (const slug of targetSlugs) {
    const [row] = await db.select().from(microCourses).where(eq(microCourses.courseId, slug)).limit(1);
    if (!row) continue;

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
    if (!course) continue;

    const mods = await db
      .select({ id: modules.id, order: modules.order })
      .from(modules)
      .where(eq(modules.courseId, course.id));

    const stemsByKind = new Map<string, Set<string>>();
    let withinFormative = 0;

    for (const mod of mods) {
      const modQuizzes = await db
        .select({ id: quizzes.id, title: quizzes.title })
        .from(quizzes)
        .where(eq(quizzes.moduleId, mod.id));

      for (const qz of modQuizzes) {
        const rows = await db
          .select({ question: quizQuestions.question })
          .from(quizQuestions)
          .where(eq(quizQuestions.quizId, qz.id))
          .orderBy(quizQuestions.order);

        const stems = rows.map((r) => r.question ?? "").filter(Boolean);
        const kind = examKindFromQuizTitle(qz.title);
        const dup = findWithinQuizDuplicates(slug, qz.title ?? "", qz.id, mod.order ?? 0, stems);
        if (dup) {
          withinQuiz.push(dup);
          if (kind === "formative") withinFormative++;
        }

        const kindKey = kind === "formative" ? `formative-m${mod.order}` : kind;
        const set = stemsByKind.get(kindKey) ?? new Set<string>();
        for (const s of stems) set.add(normStem(s));
        stemsByKind.set(kindKey, set);
      }
    }

    const diag = stemsByKind.get("diagnostic") ?? new Set<string>();
    const summ = stemsByKind.get("summative") ?? new Set<string>();
    let diagSummOverlap = 0;
    for (const s of diag) if (summ.has(s)) diagSummOverlap++;

    if (diagSummOverlap > 0) {
      crossQuiz.push({
        slug,
        kindA: "diagnostic",
        kindB: "summative",
        overlapCount: diagSummOverlap,
      });
    }

    if (["dka-i", "pneumonia-i", "asthma-i"].includes(slug)) {
      spotCheck[slug] = {
        diagnostic: diag.size,
        summative: summ.size,
        overlap: diagSummOverlap,
        withinFormative,
      };
    }
  }

  return { withinQuiz, crossQuiz, spotCheck };
}

async function main() {
  const seedOnly = process.argv.includes("--seed-only");

  const seedDups = seedWithinQuizDuplicates();
  console.log("=== SEED SOURCE within-quiz duplicate stems ===");
  console.log(`Count: ${seedDups.length}`);
  for (const d of seedDups) {
    console.log(`  ${d.slug} | ${d.quizTitle} | dups=${d.duplicateStems.length}`);
  }

  if (seedOnly) {
    if (process.argv.includes("--strict") && seedDups.length > 0) process.exit(1);
    return;
  }

  const onlySlugs = process.argv
    .find((a) => a.startsWith("--only="))
    ?.slice("--only=".length)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { withinQuiz, crossQuiz, spotCheck } = await dbWithinQuizDuplicates(onlySlugs);

  console.log("\n=== PRODUCTION DB within-quiz duplicate stems ===");
  console.log(`Count: ${withinQuiz.length}`);
  for (const d of withinQuiz) {
    console.log(`  ${d.slug} | quizId=${d.quizId} | ${d.quizTitle} | dups=${d.duplicateStems.length}`);
  }

  console.log("\n=== PRODUCTION diagnostic↔summative stem overlap ===");
  console.log(`Courses with overlap: ${crossQuiz.length}/${onlySlugs?.length ?? FELLOWSHIP_SLUGS.length}`);
  const totalOverlap = crossQuiz.reduce((s, c) => s + c.overlapCount, 0);
  console.log(`Total overlapping stems: ${totalOverlap}`);

  console.log("\n=== Spot-check (dka-i, pneumonia-i, asthma-i) ===");
  console.log(JSON.stringify(spotCheck, null, 2));

  const strict = process.argv.includes("--strict");
  if (strict && (seedDups.length > 0 || withinQuiz.length > 0)) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
