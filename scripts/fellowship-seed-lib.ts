import { assertQuizCorrectAnswerValid, encodeQuizCorrectAnswerForStorage } from "../shared/quiz-answer-contract";
import {
  MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE,
  MICROCOURSE_FORMATIVE_QUIZ_TITLE,
  MICROCOURSE_SUMMATIVE_QUIZ_TITLE,
  materializeModuleNativeFormatives,
  uniqueFormativeQuestions,
  type FormativeQuestion,
} from "../shared/microcourse-exam-policy";
import { enhanceFellowshipModuleContent } from "../server/data/clinical-content-helpers";
import { getDb } from "../server/db";
import { courses, modules, quizzes, quizQuestions, microCourses } from "../drizzle/schema";
import { eq, and, desc, like, or } from "drizzle-orm";

import { microCoursesBatch1To5 } from "../server/data/micro-courses-batch-1-5";
import { microCoursesBatch3To5 } from "../server/data/micro-courses-batch-3-5";
import { microCoursesFinalBatch } from "../server/data/micro-courses-final-batch";
import { microCoursesBurns } from "../server/data/micro-courses-burns";
import { microCoursesMissingFellowship } from "../server/data/micro-courses-missing-fellowship";
import { microCoursesSepticShock } from "../server/data/micro-courses-septic-shock";
import { microCoursesMetabolicIi } from "../server/data/micro-courses-metabolic-ii";
import { ensureMicroCoursesCatalog } from "../server/lib/micro-course-catalog";

export type FellowshipCourseSeed = {
  id: string;
  title: string;
  level: string;
  duration: number;
  price: number;
  description: string;
  modules: { title: string; duration: number; content: string; questions?: FormativeQuestion[] }[];
  quiz: {
    title: string;
    passingScore: number;
    questions: { question: string; options: string[]; correct: number; explanation: string }[];
  };
};

/** Authored ID → catalog slug */
export const FELLOWSHIP_ID_MAPPING: Record<string, string> = {
  "acute-kidney-injury-i": "aki-i",
  "acute-kidney-injury-ii": "aki-ii",
  "severe-anaemia-i": "anaemia-i",
  "severe-anaemia-ii": "anaemia-ii",
  "severe-malaria-i": "malaria-i",
  "severe-malaria-ii": "malaria-ii",
  "severe-pneumonia-ards-i": "pneumonia-i",
  "severe-pneumonia-ards-ii": "pneumonia-ii",
  "septic-shock-i": "septic-shock-i",
  "septic-shock-ii": "septic-shock-ii",
  "trauma-i": "trauma-i",
  "trauma-ii": "trauma-ii",
  "paediatric-trauma-i": "trauma-i",
  "paediatric-trauma-ii": "trauma-ii",
  "paediatric-septic-shock-i": "septic-shock-i",
};

/** Chunked batches to avoid ETIMEDOUT on long prod seed runs */
export const FELLOWSHIP_SEED_BATCHES: Record<string, string[]> = {
  p0: [
    "dka-i",
    "dka-ii",
    "status-epilepticus-i",
    "status-epilepticus-ii",
    "asthma-i",
    "asthma-ii",
  ],
  respiratory: ["pneumonia-i", "pneumonia-ii"],
  shock: [
    "septic-shock-i",
    "septic-shock-ii",
    "hypovolemic-shock-i",
    "hypovolemic-shock-ii",
    "cardiogenic-shock-i",
    "cardiogenic-shock-ii",
    "anaphylaxis-i",
    "anaphylaxis-ii",
  ],
  infectious: ["meningitis-i", "meningitis-ii", "malaria-i", "malaria-ii"],
  trauma: ["trauma-i", "trauma-ii", "burns-i", "burns-ii"],
  metabolic: ["aki-i", "aki-ii", "anaemia-i", "anaemia-ii"],
};

export function getAllFellowshipSeedContent(): FellowshipCourseSeed[] {
  const raw = [
    ...microCoursesBatch1To5,
    ...microCoursesBatch3To5,
    ...microCoursesFinalBatch,
    ...microCoursesBurns,
    ...microCoursesMissingFellowship,
    ...microCoursesSepticShock,
    ...microCoursesMetabolicIi,
  ] as FellowshipCourseSeed[];
  return raw.map((c) => materializeModuleNativeFormatives(c));
}

export function resolveCatalogSlug(courseId: string): string {
  return FELLOWSHIP_ID_MAPPING[courseId] || courseId;
}

export function filterSeedContent(options: {
  onlySlugs?: Set<string>;
  batch?: string;
}): FellowshipCourseSeed[] {
  const all = getAllFellowshipSeedContent();
  let slugs = options.onlySlugs;

  if (options.batch) {
    const batchSlugs = FELLOWSHIP_SEED_BATCHES[options.batch];
    if (!batchSlugs) {
      throw new Error(
        `Unknown batch "${options.batch}". Valid: ${Object.keys(FELLOWSHIP_SEED_BATCHES).join(", ")}`
      );
    }
    slugs = new Set(batchSlugs);
  }

  if (!slugs) return all;

  return all.filter((course) => slugs!.has(resolveCatalogSlug(course.id)));
}

export function parseSeedCliArgs(argv: string[]): { onlySlugs?: Set<string>; batch?: string } {
  let onlySlugs: Set<string> | undefined;
  let batch: string | undefined;

  for (const arg of argv) {
    if (arg.startsWith("--only=")) {
      onlySlugs = new Set(
        arg
          .slice("--only=".length)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      );
    } else if (arg.startsWith("--batch=")) {
      batch = arg.slice("--batch=".length).trim();
    }
  }

  return { onlySlugs, batch };
}

export async function seedFellowshipContent(options: {
  onlySlugs?: Set<string>;
  batch?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exitCode = 1;
    return;
  }

  const filteredContent = filterSeedContent(options);
  const label = options.batch
    ? `batch "${options.batch}"`
    : options.onlySlugs
      ? `${options.onlySlugs.size} slug(s)`
      : "all courses";

  console.log(`Starting fellowship seed for ${label} (${filteredContent.length} course(s))...`);

  await ensureMicroCoursesCatalog();

  for (const courseData of filteredContent) {
    const catalogSlug = resolveCatalogSlug(courseData.id);

    const [courseRow] = await db
      .select()
      .from(microCourses)
      .where(eq(microCourses.courseId, catalogSlug))
      .limit(1);

    if (!courseRow) {
      console.warn(`[SKIP] Course ID "${courseData.id}" (Slug: ${catalogSlug}) not found in catalog.`);
      continue;
    }

    console.log(`Processing: ${courseRow.title} (Slug: ${catalogSlug})`);

    let targetCourseId: number;

    const titlePrefix = courseRow.title.split(":")[0]!.trim();
    const [existingCourse] = await db
      .select()
      .from(courses)
      .where(
        and(
          eq(courses.programType, "fellowship"),
          or(like(courses.title, `%${titlePrefix}%`), eq(courses.order, courseRow.order))
        )
      )
      .limit(1);

    const mappedLevel = courseData.level === "foundational" ? "beginner" : courseData.level;

    if (existingCourse) {
      targetCourseId = existingCourse.id;
      await db
        .update(courses)
        .set({
          title: courseRow.title,
          description: courseData.description,
          duration: courseData.duration.toString(),
          level: mappedLevel as "beginner" | "intermediate" | "advanced",
          order: courseRow.order,
          programType: "fellowship",
        })
        .where(eq(courses.id, targetCourseId));
    } else {
      await db.insert(courses).values({
        title: courseRow.title,
        description: courseData.description,
        programType: "fellowship",
        duration: courseData.duration.toString(),
        level: mappedLevel as "beginner" | "intermediate" | "advanced",
        order: courseRow.order,
      });
      const [newCourse] = await db
        .select({ id: courses.id })
        .from(courses)
        .where(and(eq(courses.programType, "fellowship"), eq(courses.title, courseRow.title)))
        .orderBy(desc(courses.id))
        .limit(1);
      targetCourseId = newCourse!.id;
    }

    const upsertQuizQuestions = async (
      quizId: number,
      questions: FellowshipCourseSeed["quiz"]["questions"]
    ) => {
      await db.delete(quizQuestions).where(eq(quizQuestions.quizId, quizId));
      for (let qIdx = 0; qIdx < questions.length; qIdx++) {
        const qData = questions[qIdx];
        assertQuizCorrectAnswerValid(qData.correct, qData.options);
        await db.insert(quizQuestions).values({
          quizId,
          question: qData.question,
          questionType: "multiple_choice",
          options: JSON.stringify(qData.options),
          correctAnswer: encodeQuizCorrectAnswerForStorage(qData.correct, qData.options),
          explanation: qData.explanation,
          order: qIdx + 1,
        });
      }
    };

    const ensureQuizOnModule = async (
      moduleId: number,
      title: string,
      passingScore: number
    ): Promise<number> => {
      const [existingQuiz] = await db
        .select()
        .from(quizzes)
        .where(and(eq(quizzes.moduleId, moduleId), eq(quizzes.title, title)))
        .limit(1);
      if (existingQuiz) {
        await db
          .update(quizzes)
          .set({ passingScore, description: title })
          .where(eq(quizzes.id, existingQuiz.id));
        return existingQuiz.id;
      }
      await db.insert(quizzes).values({
        moduleId,
        title,
        description: title,
        passingScore,
        order: 1,
      });
      const [newQuiz] = await db
        .select({ id: quizzes.id })
        .from(quizzes)
        .where(and(eq(quizzes.moduleId, moduleId), eq(quizzes.title, title)))
        .orderBy(desc(quizzes.id))
        .limit(1);
      return newQuiz!.id;
    };

    const moduleIds: number[] = [];

    for (let i = 0; i < courseData.modules.length; i++) {
      const modData = courseData.modules[i];
      const order = i + 1;
      const content = enhanceFellowshipModuleContent(
        catalogSlug,
        i,
        courseData.modules.length,
        modData.content
      );

      const [existingMod] = await db
        .select()
        .from(modules)
        .where(and(eq(modules.courseId, targetCourseId), eq(modules.order, order)))
        .limit(1);

      let moduleId: number;
      if (existingMod) {
        moduleId = existingMod.id;
        await db
          .update(modules)
          .set({
            title: modData.title,
            description: modData.title,
            content,
            duration: modData.duration,
          })
          .where(eq(modules.id, moduleId));
      } else {
        await db.insert(modules).values({
          courseId: targetCourseId,
          title: modData.title,
          description: modData.title,
          content,
          duration: modData.duration,
          order,
        });
        const [newMod] = await db
          .select({ id: modules.id })
          .from(modules)
          .where(and(eq(modules.courseId, targetCourseId), eq(modules.order, order)))
          .orderBy(desc(modules.id))
          .limit(1);
        moduleId = newMod!.id;
      }
      moduleIds.push(moduleId);
    }

    if (courseData.quiz && courseData.quiz.questions.length > 0) {
      const lastModuleId = moduleIds[moduleIds.length - 1]!;
      const firstModuleId = moduleIds[0]!;
      // Module-native formatives only — never pull stems from summative bank (governance §3.3).
      const formativeByModule = courseData.modules.map((mod) => mod.questions ?? []);
      const bankQuestions = uniqueFormativeQuestions(courseData.quiz.questions);

      for (let i = 0; i < moduleIds.length; i++) {
        const moduleFormative = formativeByModule[i] ?? [];
        if (moduleFormative.length === 0) continue;
        const formativeTitle =
          moduleIds.length > 1
            ? `${MICROCOURSE_FORMATIVE_QUIZ_TITLE}: Module ${i + 1}`
            : MICROCOURSE_FORMATIVE_QUIZ_TITLE;
        const formativeQuizId = await ensureQuizOnModule(moduleIds[i]!, formativeTitle, 70);
        await upsertQuizQuestions(formativeQuizId, moduleFormative);
      }

      const summativeQuizId = await ensureQuizOnModule(
        lastModuleId,
        MICROCOURSE_SUMMATIVE_QUIZ_TITLE,
        80
      );
      await upsertQuizQuestions(summativeQuizId, bankQuestions);

      const diagnosticQuizId = await ensureQuizOnModule(
        firstModuleId,
        MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE,
        0
      );
      await upsertQuizQuestions(diagnosticQuizId, bankQuestions);
    }
  }

  console.log("Seeding complete!");
}
