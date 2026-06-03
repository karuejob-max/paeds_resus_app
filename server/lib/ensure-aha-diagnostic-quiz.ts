/**
 * Idempotent: adds "Diagnostic baseline" quiz on module 1 for AHA courses.
 * Does not modify existing modules, formatives, or summative banks.
 */
import { and, asc, eq } from "drizzle-orm";
import { modules, quizQuestions, quizzes } from "../../drizzle/schema";
import { encodeQuizCorrectAnswerForStorage } from "../../shared/quiz-answer-contract";
import { MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE } from "../../shared/microcourse-exam-policy";
import {
  AHA_DIAGNOSTIC_MIN_QUESTIONS,
  getAhaDiagnosticBank,
} from "../data/aha-diagnostic-banks";
import type { AhaAnchorProgramType } from "./resolve-aha-course-anchor";

export async function ensureAhaDiagnosticQuiz(
  db: any,
  courseId: number,
  programType: AhaAnchorProgramType
): Promise<number | null> {
  const moduleRows = await db
    .select({ id: modules.id })
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(asc(modules.order))
    .limit(1);

  const firstModuleId = moduleRows[0]?.id;
  if (!firstModuleId) return null;

  const existingQuizzes = await db
    .select({ id: quizzes.id, title: quizzes.title })
    .from(quizzes)
    .where(eq(quizzes.moduleId, firstModuleId));

  let diagnosticQuizId = existingQuizzes.find(
    (q: { title: string }) => q.title === MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE
  )?.id;

  if (!diagnosticQuizId) {
    await db.insert(quizzes).values({
      moduleId: firstModuleId,
      title: MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE,
      description: "One-time baseline — no pass mark; not retakable.",
      passingScore: 0,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const inserted = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(
        and(eq(quizzes.moduleId, firstModuleId), eq(quizzes.title, MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE))
      )
      .limit(1);
    diagnosticQuizId = inserted[0]?.id;
  }

  if (!diagnosticQuizId) return null;

  const qCountRows = await db
    .select({ id: quizQuestions.id })
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, diagnosticQuizId));

  if (qCountRows.length >= AHA_DIAGNOSTIC_MIN_QUESTIONS) {
    return diagnosticQuizId;
  }

  const bank = getAhaDiagnosticBank(programType);
  if (qCountRows.length > 0) {
    // Partial seed — do not delete; only append missing up to bank size
    let order = qCountRows.length + 1;
    for (let i = qCountRows.length; i < bank.length; i++) {
      const q = bank[i]!;
      await db.insert(quizQuestions).values({
        quizId: diagnosticQuizId,
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
    return diagnosticQuizId;
  }

  let order = 1;
  for (const q of bank) {
    await db.insert(quizQuestions).values({
      quizId: diagnosticQuizId,
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

  return diagnosticQuizId;
}
