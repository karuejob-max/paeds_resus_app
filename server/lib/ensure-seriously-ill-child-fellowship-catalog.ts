/**
 * Idempotent: fellowship micro-course "The systematic approach to a seriously ill child"
 * (M1 cross-cutting ADF catalog). Content lives on `courses` with programType fellowship;
 * enrollment/payment uses `microCourses.courseId` = seriously-ill-child-i.
 */
import { and, desc, eq, like } from "drizzle-orm";
import { courses, modules, quizQuestions, quizzes } from "../../drizzle/schema";
import {
  MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE,
  MICROCOURSE_FORMATIVE_QUIZ_TITLE,
  MICROCOURSE_SUMMATIVE_QUIZ_TITLE,
  expandQuestionBank,
} from "../../shared/microcourse-exam-policy";
import { encodeQuizCorrectAnswerForStorage } from "../../shared/quiz-answer-contract";

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
      level: "beginner",
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
        level: "beginner",
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
      level: "beginner",
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

  const BANK = expandQuestionBank([
    {
      question:
        "In the initial assessment of a seriously ill child, which sequence best reflects a systematic primary survey?",
      options: [
        "Airway → Breathing → Circulation → Disability → Exposure",
        "Labs → Imaging → Fluids → Antibiotics",
        "Disposition before stabilization",
        "Exposure before airway",
      ],
      correct: 0,
      explanation:
        "Stabilize life threats in order; exposure may be part of evaluation but does not come before airway/breathing/circulation.",
    },
    {
      question: "Which finding most urgently requires immediate airway intervention?",
      options: ["Mild wheeze", "Stridor with fatigue", "Normal SpO₂", "Clear breath sounds"],
      correct: 1,
      explanation: "Stridor with fatigue signals impending airway failure — treat before completing full survey.",
    },
    {
      question: "Cool extremities alone indicate shock:",
      options: ["Always — start 40 mL/kg bolus", "Never relevant", "Only with other perfusion deficits — reassess", "Only in adults"],
      correct: 2,
      explanation: "Perfusion, CRT, mental status, and pulse quality matter — cool skin is not sufficient alone (CST §4).",
    },
  ]);

  const upsertQuiz = async (title: string, passingScore: number): Promise<number> => {
    const existing = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(and(eq(quizzes.moduleId, moduleId), eq(quizzes.title, title)))
      .limit(1);
    if (existing.length > 0) {
      await db.update(quizzes).set({ passingScore, description: title }).where(eq(quizzes.id, existing[0]!.id));
      return existing[0]!.id;
    }
    await db.insert(quizzes).values({
      moduleId,
      title,
      description: title,
      passingScore,
      order: 1,
    });
    const row = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(and(eq(quizzes.moduleId, moduleId), eq(quizzes.title, title)))
      .orderBy(desc(quizzes.id))
      .limit(1);
    return row[0]!.id;
  };

  const upsertQuestions = async (quizId: number, questions: typeof BANK) => {
    await db.delete(quizQuestions).where(eq(quizQuestions.quizId, quizId));
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!;
      await db.insert(quizQuestions).values({
        quizId,
        question: q.question,
        questionType: "multiple_choice",
        options: JSON.stringify(q.options),
        correctAnswer: encodeQuizCorrectAnswerForStorage(q.correct, q.options),
        explanation: q.explanation,
        order: i + 1,
      });
    }
  };

  const formativeId = await upsertQuiz(MICROCOURSE_FORMATIVE_QUIZ_TITLE, 70);
  await upsertQuestions(formativeId, [BANK[0]!]);

  const diagnosticId = await upsertQuiz(MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE, 0);
  await upsertQuestions(diagnosticId, BANK);

  const summativeId = await upsertQuiz(MICROCOURSE_SUMMATIVE_QUIZ_TITLE, 80);
  await upsertQuestions(summativeId, BANK);
}
