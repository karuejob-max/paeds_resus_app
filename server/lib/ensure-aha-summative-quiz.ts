/**
 * Idempotent: course-level summative exam on the last module for each AHA program.
 * PALS delegates to ensurePals2025Content to preserve #158/#160 fixes.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import { modules, quizQuestions, quizzes } from "../../drizzle/schema";
import { encodeQuizCorrectAnswerForStorage } from "../../shared/quiz-answer-contract";
import { MICROCOURSE_SUMMATIVE_QUIZ_TITLE } from "../../shared/microcourse-exam-policy";
import {
  getAhaSummativeBank,
  getAhaSummativeQuizTitle,
} from "./aha-summative-banks";
import { ensurePals2025Content } from "./ensure-pals-2025-content";
import type { AhaAnchorProgramType } from "./resolve-aha-course-anchor";

function isLegacyFinalQuizTitle(title: string): boolean {
  const t = title.toLowerCase();
  return t.includes("final") && t.includes("knowledge");
}

async function resolveLastModuleId(db: any, courseId: number): Promise<number | null> {
  const moduleRows = await db
    .select({ id: modules.id })
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(desc(modules.order))
    .limit(1);
  return moduleRows[0]?.id ?? null;
}

async function upsertSummativeOnModule(
  db: any,
  lastModuleId: number,
  programType: AhaAnchorProgramType
): Promise<number | null> {
  const bank = getAhaSummativeBank(programType);
  const title = getAhaSummativeQuizTitle(programType);
  if (bank.length === 0) return null;

  const moduleQuizzes = await db
    .select({ id: quizzes.id, title: quizzes.title, order: quizzes.order })
    .from(quizzes)
    .where(eq(quizzes.moduleId, lastModuleId));

  let summativeQuizId = moduleQuizzes.find(
    (q: { title: string }) =>
      q.title === title ||
      q.title === MICROCOURSE_SUMMATIVE_QUIZ_TITLE ||
      q.title.toLowerCase().includes("summative")
  )?.id;

  const legacyFinalId = moduleQuizzes.find((q: { title: string }) =>
    isLegacyFinalQuizTitle(q.title)
  )?.id;

  if (!summativeQuizId && legacyFinalId) {
    summativeQuizId = legacyFinalId;
  }

  if (summativeQuizId) {
    await db
      .update(quizzes)
      .set({
        title,
        description: `Final comprehensive assessment — 80% required to pass`,
        passingScore: 80,
        updatedAt: new Date(),
      })
      .where(eq(quizzes.id, summativeQuizId));
    await db.delete(quizQuestions).where(eq(quizQuestions.quizId, summativeQuizId));
  } else {
    const maxOrder = moduleQuizzes.reduce(
      (max: number, q: { order: number | null }) => Math.max(max, q.order ?? 0),
      0
    );
    await db.insert(quizzes).values({
      moduleId: lastModuleId,
      title,
      description: `Final comprehensive assessment — 80% required to pass`,
      passingScore: 80,
      order: maxOrder + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const inserted = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(and(eq(quizzes.moduleId, lastModuleId), eq(quizzes.title, title)))
      .orderBy(desc(quizzes.id))
      .limit(1);
    summativeQuizId = inserted[0]?.id;
  }

  if (!summativeQuizId) return null;

  let order = 1;
  for (const q of bank) {
    await db.insert(quizQuestions).values({
      quizId: summativeQuizId,
      question: q.question,
      questionType: "multiple_choice",
      options: JSON.stringify(q.options),
      correctAnswer: encodeQuizCorrectAnswerForStorage(q.correctAnswer, q.options),
      explanation: q.explanation,
      order,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    order++;
  }

  // Remove duplicate legacy final quizzes on the same module (keep summative only).
  const duplicateIds = moduleQuizzes
    .filter(
      (q: { id: number; title: string }) =>
        q.id !== summativeQuizId &&
        (isLegacyFinalQuizTitle(q.title) || q.title === MICROCOURSE_SUMMATIVE_QUIZ_TITLE)
    )
    .map((q: { id: number }) => q.id);

  if (duplicateIds.length > 0) {
    await db.delete(quizQuestions).where(inArray(quizQuestions.quizId, duplicateIds));
    await db.delete(quizzes).where(inArray(quizzes.id, duplicateIds));
  }

  return summativeQuizId;
}

/** Idempotent summative bank for one AHA program. */
export async function ensureAhaSummativeQuiz(
  db: any,
  courseId: number,
  programType: AhaAnchorProgramType
): Promise<number | null> {
  if (programType === "pals") {
    const result = await ensurePals2025Content(db);
    return result.summativeQuizId;
  }

  const lastModuleId = await resolveLastModuleId(db, courseId);
  if (!lastModuleId) return null;

  return upsertSummativeOnModule(db, lastModuleId, programType);
}

/** Seed summative exams for all AHA anchor courses. */
export async function ensureAllAhaSummativeQuizzes(
  db: any,
  courseIds: Partial<Record<AhaAnchorProgramType, number>>
): Promise<Record<string, number | null>> {
  const out: Record<string, number | null> = {};
  for (const [programType, courseId] of Object.entries(courseIds) as [
    AhaAnchorProgramType,
    number | undefined,
  ][]) {
    if (courseId == null) {
      out[programType] = null;
      continue;
    }
    out[programType] = await ensureAhaSummativeQuiz(db, courseId, programType);
  }
  return out;
}
