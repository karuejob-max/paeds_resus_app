/**
 * Idempotent: canonical NRP (Neonatal Resuscitation Program) catalog — AHA/AAP 2025 Guidelines.
 */
import { asc, desc, eq, and } from "drizzle-orm";
import { courses, modules, moduleSections, quizzes, quizQuestions } from "../../drizzle/schema";
import { NRP_COURSE_TITLE, NRP_MODULES, type NrpModuleDef } from "./nrp-modules-data";

export async function ensureNrpCatalog(db: any): Promise<void> {
  const programType = "nrp" as const;
  const courseDescription =
    "American Heart Association and American Academy of Pediatrics aligned Neonatal Resuscitation Program — anticipation, initial steps, ventilation, compressions, medications, and post-resuscitation care per 2025 Guidelines.";

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
      title: NRP_COURSE_TITLE,
      description: courseDescription,
      programType,
      duration: 360,
      level: "advanced",
      order: 5,
    });
    const row = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.programType, programType))
      .orderBy(desc(courses.id))
      .limit(1);
    courseId = row[0]!.id;
    console.log(`[Catalog] Created NRP course (id=${courseId})`);
  } else {
    await db
      .update(courses)
      .set({
        title: NRP_COURSE_TITLE,
        description: courseDescription,
        duration: 360,
        level: "advanced",
        order: 5,
      })
      .where(eq(courses.id, courseId));
  }

  if (courseId == null) {
    throw new Error("Failed to resolve NRP course catalog row");
  }

  for (const modDef of NRP_MODULES as readonly NrpModuleDef[]) {
    const modExisting = await db
      .select({ id: modules.id })
      .from(modules)
      .where(and(eq(modules.courseId, courseId), eq(modules.order, modDef.order)))
      .limit(1);

    let moduleId: number;
    if (modExisting.length > 0) {
      moduleId = modExisting[0].id;
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
      console.log(`[Catalog] Created NRP module: ${modDef.title} (id=${moduleId})`);
    }

    const sectionCount = await db
      .select({ id: moduleSections.id })
      .from(moduleSections)
      .where(eq(moduleSections.moduleId, moduleId))
      .limit(1);

    if (sectionCount.length === 0 && modDef.sections.length > 0) {
      for (const section of modDef.sections) {
        await db.insert(moduleSections).values({
          moduleId,
          title: section.title,
          content: section.content,
          order: section.order,
        });
      }
    }

    const quizExisting = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.moduleId, moduleId))
      .limit(1);

    let quizId: number;
    if (quizExisting.length > 0) {
      quizId = quizExisting[0].id;
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

    const qCount = await db
      .select({ id: quizQuestions.id })
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .limit(1);

    if (qCount.length === 0) {
      for (const q of modDef.quiz.questions) {
        await db.insert(quizQuestions).values({
          quizId,
          question: q.questionText,
          questionType: "multiple_choice",
          options: q.options,
          correctAnswer: JSON.stringify(q.correctAnswer),
          explanation: q.explanation,
          order: q.order,
        });
      }
    }
  }
}
