import { assertQuizCorrectAnswerValid, encodeQuizCorrectAnswerForStorage } from "../shared/quiz-answer-contract";
import {
  MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE,
  MICROCOURSE_SUMMATIVE_QUIZ_TITLE,
} from "../shared/microcourse-exam-policy";
import { appendClinicalFooter } from "../server/data/clinical-content-helpers";
import { getDb } from "../server/db";
import { courses, modules, quizzes, quizQuestions, microCourses } from "../drizzle/schema";
import { eq, and, desc, like } from "drizzle-orm";

// Import all batches
import { microCoursesBatch1To5 } from "../server/data/micro-courses-batch-1-5";
import { microCoursesBatch3To5 } from "../server/data/micro-courses-batch-3-5";
import { microCoursesFinalBatch } from "../server/data/micro-courses-final-batch";
import { microCoursesBurns } from "../server/data/micro-courses-burns";
import { microCoursesMissingFellowship } from "../server/data/micro-courses-missing-fellowship";
import { SEPTIC_SHOCK_I_COURSE, SEPTIC_SHOCK_I_MODULES, SEPTIC_SHOCK_I_QUIZ_QUESTIONS } from "../server/lib/micro-course-schema";

async function seed() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  // 1. Prepare Septic Shock I in the same format
  const septicShockI = {
    id: SEPTIC_SHOCK_I_COURSE.id,
    title: SEPTIC_SHOCK_I_COURSE.courseDisplayName,
    level: SEPTIC_SHOCK_I_COURSE.level,
    duration: SEPTIC_SHOCK_I_COURSE.duration,
    price: SEPTIC_SHOCK_I_COURSE.price,
    description: SEPTIC_SHOCK_I_COURSE.description,
    modules: SEPTIC_SHOCK_I_MODULES.map(m => ({
      title: m.title,
      duration: m.duration,
      content: `<h3>Learning Objectives:</h3><ul>${m.learningObjectives.map(obj => `<li>${obj}</li>`).join('')}</ul><p>Detailed module content is available in the training manual.</p>`
    })),
    quiz: {
      title: 'Septic Shock I Quiz',
      passingScore: 80,
      questions: SEPTIC_SHOCK_I_QUIZ_QUESTIONS.map(q => ({
        question: q.questionText,
        options: q.options || [],
        correct: q.options ? q.options.findIndex(opt => opt.startsWith(q.correctAnswer)) : 0,
        explanation: q.explanation
      }))
    }
  };

  // Combine all content
  const allContent = [
    ...microCoursesBatch1To5,
    ...microCoursesBatch3To5,
    ...microCoursesFinalBatch,
    ...microCoursesBurns,
    ...microCoursesMissingFellowship,
    septicShockI
  ];

  // Mapping for ID mismatches: Authored ID -> Catalog Slug
  const idMapping: Record<string, string> = {
    'acute-kidney-injury-i': 'aki-i',
    'acute-kidney-injury-ii': 'aki-ii',
    'severe-anaemia-i': 'anaemia-i',
    'severe-anaemia-ii': 'anaemia-ii',
    'severe-malaria-i': 'malaria-i',
    'severe-malaria-ii': 'malaria-ii',
    'severe-pneumonia-ards-i': 'pneumonia-i',
    'severe-pneumonia-ards-ii': 'pneumonia-ii',
    'septic-shock-i': 'septic-shock-i',
    'septic-shock-ii': 'septic-shock-ii',
    'trauma-i': 'trauma-i',
    'trauma-ii': 'trauma-ii',
    'paediatric-trauma-i': 'trauma-i',
    'paediatric-trauma-ii': 'trauma-ii',
    'paediatric-septic-shock-i': 'septic-shock-i'
  };

  console.log(`Starting seeding for ${allContent.length} potential courses...`);

  for (const courseData of allContent) {
    // Resolve the catalog slug
    const catalogSlug = idMapping[courseData.id] || courseData.id;

    // 1. Find the micro-course catalog row
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

    // 2. Ensure a matching row exists in the 'courses' table for the player
    let targetCourseId: number;
    
    // Check for existing course by title or specific ID if known
    const [existingCourse] = await db
      .select()
      .from(courses)
      .where(like(courses.title, `%${courseRow.title.split(':')[0]}%`))
      .limit(1);

    const mappedLevel = courseData.level === 'foundational' ? 'beginner' : courseData.level;

    if (existingCourse) {
      targetCourseId = existingCourse.id;
      await db.update(courses).set({
        title: courseRow.title, // sync title
        description: courseData.description,
        duration: courseData.duration.toString(),
        level: mappedLevel as any,
        order: courseRow.order,
        programType: 'fellowship', // ensure it's fellowship for the player
      }).where(eq(courses.id, targetCourseId));
    } else {
      await db.insert(courses).values({
        title: courseRow.title,
        description: courseData.description,
        programType: 'fellowship',
        duration: courseData.duration.toString(),
        level: mappedLevel as any,
        order: courseRow.order,
      });
      const [newCourse] = await db
        .select({ id: courses.id })
        .from(courses)
        .where(and(eq(courses.programType, 'fellowship'), eq(courses.title, courseRow.title)))
        .orderBy(desc(courses.id))
        .limit(1);
      targetCourseId = newCourse.id;
    }

    const upsertQuizQuestions = async (
      quizId: number,
      questions: (typeof courseData.quiz)["questions"]
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

    // 3. Seed Modules
    for (let i = 0; i < courseData.modules.length; i++) {
      const modData = courseData.modules[i];
      const order = i + 1;
      const content = appendClinicalFooter(modData.content);

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

    // 4. Summative + diagnostic exams (same question bank)
    if (courseData.quiz && courseData.quiz.questions.length > 0) {
      const lastModuleId = moduleIds[moduleIds.length - 1]!;
      const firstModuleId = moduleIds[0]!;

      const summativeQuizId = await ensureQuizOnModule(
        lastModuleId,
        MICROCOURSE_SUMMATIVE_QUIZ_TITLE,
        80
      );
      await upsertQuizQuestions(summativeQuizId, courseData.quiz.questions);

      const diagnosticQuizId = await ensureQuizOnModule(
        firstModuleId,
        MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE,
        0
      );
      await upsertQuizQuestions(diagnosticQuizId, courseData.quiz.questions);
    }
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
