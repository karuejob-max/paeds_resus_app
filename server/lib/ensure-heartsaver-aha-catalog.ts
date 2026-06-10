import { and, desc, eq, not, like } from "drizzle-orm";
import { courses, modules, quizzes, quizQuestions } from "../../drizzle/schema";
import { HEARTSAVER_MODULES } from "./heartsaver-modules-data";

export const HEARTSAVER_AHA_COURSE_TITLE = "Heartsaver CPR AED";

export async function getHeartsaverAhaCourseId(db: any): Promise<number | null> {
  await ensureHeartsaverAhaCatalog(db);
  const anchor = await db
    .select({ id: courses.id })
    .from(courses)
    .where(
      and(
        eq(courses.programType, "heartsaver"),
        eq(courses.title, HEARTSAVER_AHA_COURSE_TITLE)
      )
    )
    .orderBy(courses.order)
    .limit(1);
  return anchor[0]?.id ?? null;
}

export async function ensureHeartsaverAhaCatalog(db: any): Promise<void> {
  let courseId: number;

  const existingCourse = await db
    .select({ id: courses.id })
    .from(courses)
    .where(
      and(
        eq(courses.programType, "heartsaver"),
        eq(courses.title, HEARTSAVER_AHA_COURSE_TITLE)
      )
    )
    .limit(1);

  if (existingCourse.length > 0) {
    courseId = existingCourse[0].id;
    await db
      .update(courses)
      .set({
        description: "AHA-aligned Heartsaver CPR AED with 2025 guideline updates, including First Aid, Epi-pen, and Bleeding Control.",
        duration: HEARTSAVER_MODULES.reduce((sum, mod) => sum + mod.duration, 0),
        level: "beginner",
        order: 1,
      })
      .where(eq(courses.id, courseId));
  } else {
    const insertedCourse = await db.insert(courses).values({
      title: HEARTSAVER_AHA_COURSE_TITLE,
      description: "AHA-aligned Heartsaver CPR AED with 2025 guideline updates, including First Aid, Epi-pen, and Bleeding Control.",
      programType: "heartsaver",
      duration: HEARTSAVER_MODULES.reduce((sum, mod) => sum + mod.duration, 0),
      level: "beginner",
      order: 1,
    });
    courseId = insertedCourse[0].insertId;
  }

  for (const mod of HEARTSAVER_MODULES) {
    const existingModule = await db
      .select({ id: modules.id })
      .from(modules)
      .where(and(eq(modules.courseId, courseId), eq(modules.order, mod.order)))
      .limit(1);

    let moduleId: number;

    if (existingModule.length > 0) {
      moduleId = existingModule[0].id;
      await db
        .update(modules)
        .set({
          title: mod.title,
          description: mod.description,
          content: mod.content,
          duration: mod.duration,
        })
        .where(eq(modules.id, moduleId));
    } else {
      const insertedModule = await db.insert(modules).values({
        courseId,
        title: mod.title,
        description: mod.description,
        content: mod.content,
        duration: mod.duration,
        order: mod.order,
      });
      moduleId = insertedModule[0].insertId;
    }

    const existingQuiz = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.moduleId, moduleId))
      .limit(1);

    let quizId: number;

    if (existingQuiz.length > 0) {
      quizId = existingQuiz[0].id;
      await db
        .update(quizzes)
        .set({
          title: mod.quiz.title,
          passingScore: mod.quiz.passingScore,
        })
        .where(eq(quizzes.id, quizId));
    } else {
      const insertedQuiz = await db.insert(quizzes).values({
        moduleId,
        title: mod.quiz.title,
        description: "Knowledge check",
        passingScore: mod.quiz.passingScore,
        order: 1,
      });
      quizId = insertedQuiz[0].insertId;
    }

    // Clear existing questions for this quiz to ensure idempotency and prevent duplicates
    await db.delete(quizQuestions).where(eq(quizQuestions.quizId, quizId));

    for (const question of mod.quiz.questions) {
      await db.insert(quizQuestions).values({
        quizId,
        question: question.questionText,
        questionType: "multiple_choice",
        options: JSON.stringify(question.options),
        correctAnswer: JSON.stringify(question.correctAnswer),
        explanation: question.explanation,
        order: question.order,
      });
    }
  }
}
