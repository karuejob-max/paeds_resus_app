
import { getDb } from "../server/db";
import { courses, modules, quizzes, quizQuestions, microCourses } from "../drizzle/schema";
import { eq, and, desc, like } from "drizzle-orm";

// Import all batches
import { microCoursesBatch1To5 } from "../server/data/micro-courses-batch-1-5";
import { microCoursesBatch3To5 } from "../server/data/micro-courses-batch-3-5";
import { microCoursesFinalBatch } from "../server/data/micro-courses-final-batch";
import { microCoursesBurns } from "../server/data/micro-courses-burns";

async function seed() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  // Combine all content
  const allContent = [
    ...microCoursesBatch1To5,
    ...microCoursesBatch3To5,
    ...microCoursesFinalBatch,
    ...microCoursesBurns,
  ];

  console.log(`Starting seeding for ${allContent.length} potential courses...`);

  for (const courseData of allContent) {
    // 1. Find the micro-course catalog row
    const [courseRow] = await db
      .select()
      .from(microCourses)
      .where(eq(microCourses.courseId, courseData.id))
      .limit(1);

    if (!courseRow) {
      console.warn(`[SKIP] Course ID "${courseData.id}" not found in catalog.`);
      continue;
    }

    console.log(`Processing: ${courseRow.title} (ID: ${courseRow.id})`);

    // 2. Ensure a matching row exists in the 'courses' table for the player
    let targetCourseId: number;
    
    // Check for existing course by title or specific ID if known
    // For Septic Shock I, it might be under 'pals' or 'fellowship'
    const [existingCourse] = await db
      .select()
      .from(courses)
      .where(like(courses.title, `%${courseRow.title.split(':')[0]}%`))
      .limit(1);

    if (existingCourse) {
      targetCourseId = existingCourse.id;
      const mappedLevel = courseData.level === 'foundational' ? 'beginner' : courseData.level;
      await db.update(courses).set({
        title: courseRow.title, // sync title
        description: courseData.description,
        duration: courseData.duration,
        level: mappedLevel as any,
        order: courseRow.order,
        programType: 'fellowship', // ensure it's fellowship for the player
      }).where(eq(courses.id, targetCourseId));
    } else {
      const mappedLevel = courseData.level === 'foundational' ? 'beginner' : courseData.level;
      await db.insert(courses).values({
        title: courseRow.title,
        description: courseData.description,
        programType: 'fellowship',
        duration: courseData.duration,
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

    // 3. Seed Modules
    for (let i = 0; i < courseData.modules.length; i++) {
      const modData = courseData.modules[i];
      const order = i + 1;

      const [existingMod] = await db
        .select()
        .from(modules)
        .where(and(eq(modules.courseId, targetCourseId), eq(modules.order, order)))
        .limit(1);

      let moduleId: number;
      if (existingMod) {
        moduleId = existingMod.id;
        await db.update(modules).set({
          title: modData.title,
          description: modData.title,
          content: modData.content,
          duration: modData.duration,
        }).where(eq(modules.id, moduleId));
      } else {
        await db.insert(modules).values({
          courseId: targetCourseId,
          title: modData.title,
          description: modData.title,
          content: modData.content,
          duration: modData.duration,
          order: order,
        });
        const [newMod] = await db
          .select({ id: modules.id })
          .from(modules)
          .where(and(eq(modules.courseId, targetCourseId), eq(modules.order, order)))
          .orderBy(desc(modules.id))
          .limit(1);
        moduleId = newMod.id;
      }

      // 4. Seed Quiz
      if (i === courseData.modules.length - 1 && courseData.quiz) {
        const quizData = courseData.quiz;
        
        const [existingQuiz] = await db
          .select()
          .from(quizzes)
          .where(eq(quizzes.moduleId, moduleId))
          .limit(1);

        let quizId: number;
        if (existingQuiz) {
          quizId = existingQuiz.id;
          await db.update(quizzes).set({
            title: quizData.title,
            passingScore: quizData.passingScore,
          }).where(eq(quizzes.id, quizId));
        } else {
          await db.insert(quizzes).values({
            moduleId: moduleId,
            title: quizData.title,
            description: quizData.title,
            passingScore: quizData.passingScore,
            order: 1,
          });
          const [newQuiz] = await db
            .select({ id: quizzes.id })
            .from(quizzes)
            .where(eq(quizzes.moduleId, moduleId))
            .orderBy(desc(quizzes.id))
            .limit(1);
          quizId = newQuiz.id;
        }

        // 5. Seed Quiz Questions
        await db.delete(quizQuestions).where(eq(quizQuestions.quizId, quizId));

        for (let qIdx = 0; qIdx < quizData.questions.length; qIdx++) {
          const qData = quizData.questions[qIdx];
          const correctOption = typeof qData.correct === 'number' 
            ? qData.options[qData.correct] 
            : qData.correct;

          await db.insert(quizQuestions).values({
            quizId: quizId,
            question: qData.question,
            questionType: 'multiple_choice',
            options: JSON.stringify(qData.options),
            correctAnswer: JSON.stringify(correctOption),
            explanation: qData.explanation,
            order: qIdx + 1,
          });
        }
      }
    }
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
