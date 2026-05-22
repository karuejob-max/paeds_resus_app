/**
 * Idempotent: fellowship micro-course "The systematic approach to a seriously ill child"
 * (M1 cross-cutting ADF catalog). Content lives on `courses` with programType fellowship;
 * enrollment/payment uses `microCourses.courseId` = seriously-ill-child-i.
 */
import { and, desc, eq, like } from "drizzle-orm";
import { courses, modules, quizQuestions, quizzes } from "../../drizzle/schema";

export const SERIOUSLY_ILL_CHILD_MICRO_COURSE_ID = "seriously-ill-child-i";
export const SERIOUSLY_ILL_CHILD_COURSE_TITLE =
  "The systematic approach to a seriously ill child";

const DISCLAIMER = `<p class="text-sm border-l-4 border-amber-500 pl-3 py-1 my-4 bg-amber-50 dark:bg-amber-950/30"><strong>Educational use only.</strong> Apply your facility protocol and senior review. This module supports structured assessment training—not bedside decision-making alone.</p>`;

export async function getSeriouslyIllChildFellowshipCourseId(db: any): Promise<number | null> {
  await ensureSeriouslyIllChildFellowshipCatalog(db);
  const row = await db
    .select({ id: courses.id })
    .from(courses)
    .where(
      and(eq(courses.programType, "fellowship"), like(courses.title, "%seriously ill%"))
    )
    .limit(1);
  return row[0]?.id ?? null;
}

/** Reassign legacy PALS rows that used this title to fellowship (one-time idempotent migration). */
async function migrateLegacyPalsSeriouslyIllRow(db: any): Promise<number | null> {
  const legacy = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.programType, "pals"), like(courses.title, "%seriously ill%")))
    .limit(1);
  if (!legacy.length) return null;

  await db
    .update(courses)
    .set({
      programType: "fellowship",
      title: SERIOUSLY_ILL_CHILD_COURSE_TITLE,
      description:
        "Structured assessment, stabilisation, and escalation for the critically unwell child — cross-cutting fellowship foundation (ABCDE in practice).",
      level: "foundational",
      order: 0,
    })
    .where(eq(courses.id, legacy[0].id));

  return legacy[0].id;
}

export async function ensureSeriouslyIllChildFellowshipCatalog(db: any): Promise<void> {
  await migrateLegacyPalsSeriouslyIllRow(db);

  const existing = await db
    .select({ id: courses.id })
    .from(courses)
    .where(
      and(eq(courses.programType, "fellowship"), like(courses.title, "%seriously ill%"))
    )
    .limit(1);

  let courseId: number;

  if (existing.length > 0) {
    courseId = existing[0].id;
    await db
      .update(courses)
      .set({
        title: SERIOUSLY_ILL_CHILD_COURSE_TITLE,
        description:
          "Structured assessment, stabilisation, and escalation for the critically unwell child — cross-cutting fellowship foundation (ABCDE in practice).",
        level: "foundational",
        order: 0,
      })
      .where(eq(courses.id, courseId));
  } else {
    await db.insert(courses).values({
      title: SERIOUSLY_ILL_CHILD_COURSE_TITLE,
      description:
        "Structured assessment, stabilisation, and escalation for the critically unwell child — cross-cutting fellowship foundation (ABCDE in practice).",
      programType: "fellowship",
      duration: 45,
      level: "foundational",
      order: 0,
    });
    const row = await db
      .select({ id: courses.id })
      .from(courses)
      .where(
        and(eq(courses.programType, "fellowship"), like(courses.title, "%seriously ill%"))
      )
      .orderBy(desc(courses.id))
      .limit(1);
    courseId = row[0]!.id;
  }

  const modExisting = await db
    .select({ id: modules.id })
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .limit(1);

  let moduleId: number;
  if (modExisting.length > 0) {
    moduleId = modExisting[0].id;
    await db
      .update(modules)
      .set({
        title: "Module 1: Primary assessment & stabilisation",
        description: "Airway, breathing, circulation, disability, exposure — paediatric priorities.",
        content: `${DISCLAIMER}
        <h2>Systematic approach</h2>
        <p>Use a structured primary survey adapted for children: identify and treat life threats in order.</p>
        <ul>
          <li>Assess airway patency and work of breathing.</li>
          <li>Evaluate perfusion, pulses, and end-organ perfusion.</li>
          <li>Consider immediate reversible causes and escalate early.</li>
        </ul>
        <p><strong>Local protocols</strong> and senior review take precedence when they conflict with training examples.</p>
      `,
        duration: 45,
      })
      .where(eq(modules.id, moduleId));
  } else {
    await db.insert(modules).values({
      courseId,
      title: "Module 1: Primary assessment & stabilisation",
      description: "Airway, breathing, circulation, disability, exposure — paediatric priorities.",
      content: `${DISCLAIMER}
        <h2>Systematic approach</h2>
        <p>Use a structured primary survey adapted for children: identify and treat life threats in order.</p>
        <ul>
          <li>Assess airway patency and work of breathing.</li>
          <li>Evaluate perfusion, pulses, and end-organ perfusion.</li>
          <li>Consider immediate reversible causes and escalate early.</li>
        </ul>
        <p><strong>Local protocols</strong> and senior review take precedence when they conflict with training examples.</p>
      `,
      duration: 45,
      order: 1,
    });
    const m = await db
      .select({ id: modules.id })
      .from(modules)
      .where(eq(modules.courseId, courseId))
      .orderBy(desc(modules.id))
      .limit(1);
    moduleId = m[0]!.id;
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
      title: "Check: primary survey priorities",
      description: "Quick knowledge check",
      passingScore: 70,
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
    await db.insert(quizQuestions).values({
      quizId,
      question:
        "In the initial assessment of a seriously ill child, which sequence best reflects a systematic primary survey?",
      questionType: "multiple_choice",
      options: JSON.stringify([
        "Airway → Breathing → Circulation → Disability → Exposure",
        "Labs → Imaging → Fluids → Antibiotics",
        "Disposition before stabilization",
        "Exposure before airway",
      ]),
      correctAnswer: JSON.stringify("Airway → Breathing → Circulation → Disability → Exposure"),
      explanation:
        "Stabilize life threats in order; exposure may be part of evaluation but does not come before airway/breathing/circulation.",
      order: 1,
    });
  }
}
