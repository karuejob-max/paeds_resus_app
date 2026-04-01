/**
 * Seed one PALS catalog course: "The systematic approach to a seriously ill child"
 * with a single module + quiz so /course/seriously-ill-child (LearningPath) works.
 *
 * Run: pnpm exec tsx server/seed-pals-seriously-ill-course.ts
 * Requires DATABASE_URL / DB access (same as app).
 */
import { desc, eq, like, and } from "drizzle-orm";
import { getDb } from "./db";
import { courses, modules, quizzes, quizQuestions } from "../drizzle/schema";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("Database unavailable (check env / connection).");
    process.exit(1);
  }

  const existing = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.programType, "pals"), like(courses.title, "%seriously ill%")))
    .limit(1);

  let courseId: number;

  if (existing.length > 0) {
    courseId = existing[0].id;
    console.log(`Course already present (id=${courseId}), ensuring module/quiz…`);
  } else {
    await db.insert(courses).values({
      title: "The systematic approach to a seriously ill child",
      description:
        "Structured assessment, stabilization, and escalation for the critically unwell child (PALS-level).",
      programType: "pals",
      duration: 180,
      level: "advanced",
      order: 2,
    });
    const row = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.programType, "pals"))
      .orderBy(desc(courses.id))
      .limit(1);
    courseId = row[0]!.id;
    console.log(`Created course id=${courseId}`);
  }

  const modExisting = await db
    .select({ id: modules.id })
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .limit(1);

  let moduleId: number;
  if (modExisting.length > 0) {
    moduleId = modExisting[0].id;
    console.log(`Module already present (id=${moduleId})`);
  } else {
    await db.insert(modules).values({
      courseId,
      title: "Module 1: Primary assessment & stabilization",
      description: "Airway, breathing, circulation, disability, exposure — pediatric priorities.",
      content: `
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
    console.log(`Created module id=${moduleId}`);
  }

  const quizExisting = await db
    .select({ id: quizzes.id })
    .from(quizzes)
    .where(eq(quizzes.moduleId, moduleId))
    .limit(1);

  let quizId: number;
  if (quizExisting.length > 0) {
    quizId = quizExisting[0].id;
    console.log(`Quiz already present (id=${quizId})`);
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
    console.log(`Created quiz id=${quizId}`);
  }

  const qCount = await db
    .select({ id: quizQuestions.id })
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .limit(1);

  if (qCount.length === 0) {
    await db.insert(quizQuestions).values({
      quizId,
      question: "In the initial assessment of a seriously ill child, which sequence best reflects a systematic primary survey?",
      questionType: "multiple_choice",
      options: JSON.stringify([
        "Airway → Breathing → Circulation → Disability → Exposure",
        "Labs → Imaging → Fluids → Antibiotics",
        "Disposition before stabilization",
        "Exposure before airway",
      ]),
      correctAnswer: JSON.stringify("Airway → Breathing → Circulation → Disability → Exposure"),
      explanation: "Stabilize life threats in order; exposure may be part of evaluation but does not come before airway/breathing/circulation.",
      order: 1,
    });
    console.log("Inserted quiz question.");
  } else {
    console.log("Quiz questions already present.");
  }

  console.log("Done. Enroll as PALS (KES 100), pay, then open /course/seriously-ill-child?enrollmentId=<id>.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
