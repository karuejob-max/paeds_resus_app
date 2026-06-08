/**
 * Idempotent: ensures Heartsaver course catalog exists with modules, sections,
 * and knowledge-check quizzes aligned to AHA Heartsaver CPR AED 2025 guideline updates.
 */
import { asc, desc, eq, and, gt } from "drizzle-orm";
import { courses, modules, moduleSections, quizzes, quizQuestions } from "../../drizzle/schema";
import { HEARTSAVER_MODULES, type HeartsaverModuleDef } from "./heartsaver-modules-data";

async function ensureHeartsaverCatalogInner(db: any): Promise<void> {
  const programType = "heartsaver" as const;
  const courseTitle = "Heartsaver CPR AED — AHA 2025 Guidelines";
  const courseDescription =
    "American Heart Association Heartsaver CPR AED course for lay rescuers and non-clinical healthcare workers. Covers adult, child, and infant CPR, AED use, and choking relief.";

  const existing = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.programType, programType))
    .orderBy(asc(courses.id));

  let courseId: number | undefined;
  for (const row of existing) {
    const mod = await db
      .select({ id: modules.id })
      .from(modules)
      .where(eq(modules.courseId, row.id))
      .limit(1);
    if (mod.length > 0) {
      courseId = row.id;
      break;
    }
  }
  if (courseId == null && existing.length > 0) {
    courseId = existing[0].id;
  }

  if (courseId == null) {
    await db.insert(courses).values({
      title: courseTitle,
      description: courseDescription,
      programType,
      duration: 60,
      level: "beginner",
      order: 4,
    });
    const row = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.programType, programType))
      .orderBy(desc(courses.id))
      .limit(1);
    courseId = row[0]!.id;
    console.log(`[Catalog] Created Heartsaver course (id=${courseId})`);
  }

  if (courseId == null) {
    throw new Error("Failed to resolve Heartsaver course catalog row");
  }

  // Delete modules that are no longer in the definition
  const maxOrder = Math.max(...HEARTSAVER_MODULES.map(m => m.order));
  await db.delete(modules).where(and(eq(modules.courseId, courseId), gt(modules.order, maxOrder)));

  for (const modDef of HEARTSAVER_MODULES as readonly HeartsaverModuleDef[]) {
    const modExisting = await db
      .select({ id: modules.id })
      .from(modules)
      .where(and(eq(modules.courseId, courseId), eq(modules.order, modDef.order)))
      .limit(1);

    let moduleId: number;
    if (modExisting.length > 0) {
      moduleId = modExisting[0].id;
      await db.update(modules).set({
        title: modDef.title,
        description: modDef.description,
        content: modDef.content,
        duration: modDef.duration,
      }).where(eq(modules.id, moduleId));
    } else {
      await db.insert(modules).values({
        courseId,
        title: modDef.title,
        description: modDef.description,
        content: modDef.content,
        duration: modDef.duration,
        order: modDef.order,
      });
      const m = await db
        .select({ id: modules.id })
        .from(modules)
        .where(and(eq(modules.courseId, courseId), eq(modules.order, modDef.order)))
        .orderBy(desc(modules.id))
        .limit(1);
      moduleId = m[0]!.id;
      console.log(`[Catalog] Created Heartsaver module: ${modDef.title} (id=${moduleId})`);
    }

    // Always refresh sections to ensure they match the definition
    await db.delete(moduleSections).where(eq(moduleSections.moduleId, moduleId));
    if (modDef.sections.length > 0) {
      for (const section of modDef.sections) {
        await db.insert(moduleSections).values({
          moduleId,
          title: section.title,
          content: section.content,
          order: section.order,
        });
      }
      console.log(`[Catalog] Updated ${modDef.sections.length} sections for ${modDef.title}`);
    }

    const quizExisting = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.moduleId, moduleId))
      .limit(1);

    let quizId: number;
    if (quizExisting.length > 0) {
      quizId = quizExisting[0].id;
      await db.update(quizzes).set({
        title: modDef.quiz.title,
        description: modDef.quiz.title,
        passingScore: modDef.quiz.passingScore,
      }).where(eq(quizzes.id, quizId));
    } else {
      await db.insert(quizzes).values({
        moduleId,
        title: modDef.quiz.title,
        description: modDef.quiz.title,
        passingScore: modDef.quiz.passingScore,
        order: 1,
      });
      const q = await db
        .select({ id: quizzes.id })
        .from(quizzes)
        .where(eq(quizzes.moduleId, moduleId))
        .orderBy(desc(quizzes.id))
        .limit(1);
      quizId = q[0]!.id;
    }

    // Always refresh quiz questions
    await db.delete(quizQuestions).where(eq(quizQuestions.quizId, quizId));
    for (const q of modDef.quiz.questions) {
      const options =
        typeof q.options === "string" && q.options.startsWith("[")
          ? q.options
          : JSON.stringify(q.options);
      await db.insert(quizQuestions).values({
        quizId,
        question: q.questionText,
        questionType: "multiple_choice",
        options,
        correctAnswer: JSON.stringify(q.correctAnswer),
        explanation: q.explanation,
        order: q.order,
      });
    }
    console.log(`[Catalog] Updated ${modDef.quiz.questions.length} questions for ${modDef.quiz.title}`);
  }
}

export async function ensureHeartsaverCatalog(db: any): Promise<void> {
  await ensureHeartsaverCatalogInner(db);
}
