/**
 * Idempotent PALS 2025 learner content: Module 6 §2 H's/T's + course-level summative bank.
 * Targets the canonical AHA PALS row with the richest module set (typically course id 40).
 */
import { and, asc, desc, eq, like, not, sql } from "drizzle-orm";
import {
  courses,
  modules,
  moduleSections,
  quizzes,
  quizQuestions,
} from "../../drizzle/schema";
import { encodeQuizCorrectAnswerForStorage } from "../../shared/quiz-answer-contract";
import { resolveAhaCourseAnchor } from "./resolve-aha-course-anchor";
import {
  PALS_2025_SUMMATIVE_QUESTIONS,
  PALS_2025_SUMMATIVE_QUIZ_TITLE,
  PALS_MODULE6_PEA_SECTION2_HTML,
} from "./pals-2025-summative-bank";

const MODULE6_ORDER = 6;
const MODULE6_SECTION2_ORDER = 2;

export async function resolvePals2025CourseId(db: any): Promise<number | null> {
  const anchor = await resolveAhaCourseAnchor(db, "pals");
  if (!anchor) return null;

  const counts = await db
    .select({
      courseId: modules.courseId,
      moduleCount: sql<number>`count(*)`.mapWith(Number),
    })
    .from(modules)
    .where(eq(modules.courseId, anchor.id))
    .groupBy(modules.courseId);

  const anchorCount = counts[0]?.moduleCount ?? 0;
  if (anchorCount >= 6) return anchor.id;

  const palsRows = await db
    .select({ id: courses.id })
    .from(courses)
    .where(
      and(
        eq(courses.programType, "pals"),
        not(like(courses.title, "%seriously ill%")),
        not(like(courses.title, "%Paediatric septic shock%"))
      )
    )
    .orderBy(desc(courses.id));

  let bestId: number | null = null;
  let bestCount = 0;
  for (const row of palsRows as { id: number }[]) {
    const c = await db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(modules)
      .where(eq(modules.courseId, row.id));
    const n = c[0]?.n ?? 0;
    if (n > bestCount) {
      bestCount = n;
      bestId = row.id;
    }
  }
  return bestId;
}

async function patchModule6PeaSection(db: any, courseId: number): Promise<void> {
  const modRows = await db
    .select({ id: modules.id })
    .from(modules)
    .where(and(eq(modules.courseId, courseId), eq(modules.order, MODULE6_ORDER)))
    .limit(1);
  const moduleId = modRows[0]?.id;
  if (!moduleId) return;

  await db
    .update(moduleSections)
    .set({ content: PALS_MODULE6_PEA_SECTION2_HTML })
    .where(
      and(eq(moduleSections.moduleId, moduleId), eq(moduleSections.order, MODULE6_SECTION2_ORDER))
    );
}

async function removeRedundantSummativeModule(db: any, courseId: number): Promise<void> {
  const mod10 = await db
    .select({ id: modules.id })
    .from(modules)
    .where(
      and(
        eq(modules.courseId, courseId),
        like(modules.title, "%Summative%")
      )
    );
  for (const m of mod10 as { id: number }[]) {
    const modQuizzes = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.moduleId, m.id));
    for (const q of modQuizzes as { id: number }[]) {
      await db.delete(quizQuestions).where(eq(quizQuestions.quizId, q.id));
      await db.delete(quizzes).where(eq(quizzes.id, q.id));
    }
    await db.delete(moduleSections).where(eq(moduleSections.moduleId, m.id));
    await db.delete(modules).where(eq(modules.id, m.id));
  }
}

async function upsertLastModuleSummativeQuiz(db: any, courseId: number): Promise<number | null> {
  const moduleRows = await db
    .select({ id: modules.id })
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(desc(modules.order))
    .limit(1);
  const lastModuleId = moduleRows[0]?.id;
  if (!lastModuleId) return null;

  const existing = await db
    .select()
    .from(quizzes)
    .where(and(eq(quizzes.moduleId, lastModuleId), like(quizzes.title, "%Summative%")))
    .limit(1);

  let quizId: number;
  if (existing.length > 0) {
    quizId = existing[0].id;
    await db
      .update(quizzes)
      .set({
        title: PALS_2025_SUMMATIVE_QUIZ_TITLE,
        passingScore: 80,
        updatedAt: new Date(),
      })
      .where(eq(quizzes.id, quizId));
    await db.delete(quizQuestions).where(eq(quizQuestions.quizId, quizId));
  } else {
    await db.insert(quizzes).values({
      moduleId: lastModuleId,
      title: PALS_2025_SUMMATIVE_QUIZ_TITLE,
      description: "Final comprehensive assessment for PALS 2025 certification.",
      passingScore: 80,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const inserted = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(and(eq(quizzes.moduleId, lastModuleId), like(quizzes.title, "%Summative%")))
      .orderBy(desc(quizzes.id))
      .limit(1);
    quizId = inserted[0]!.id;
  }

  let order = 1;
  for (const q of PALS_2025_SUMMATIVE_QUESTIONS) {
    await db.insert(quizQuestions).values({
      quizId,
      question: q.question,
      options: JSON.stringify(q.options),
      correctAnswer: encodeQuizCorrectAnswerForStorage(q.correctAnswer, q.options),
      explanation: q.explanation,
      order,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    order++;
  }

  return quizId;
}

/** Idempotent: PALS 2025 module content + global summative exam bank. */
export async function ensurePals2025Content(db: any): Promise<{ courseId: number | null; summativeQuizId: number | null }> {
  const courseId = await resolvePals2025CourseId(db);
  if (!courseId) return { courseId: null, summativeQuizId: null };

  await patchModule6PeaSection(db, courseId);
  await removeRedundantSummativeModule(db, courseId);
  const summativeQuizId = await upsertLastModuleSummativeQuiz(db, courseId);

  return { courseId, summativeQuizId };
}
