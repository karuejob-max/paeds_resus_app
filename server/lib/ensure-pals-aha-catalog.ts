/**
 * Idempotent: canonical AHA PALS catalog anchor (not fellowship micro-courses).
 */
import { and, desc, eq, like, not } from "drizzle-orm";
import { courses, modules, quizzes, quizQuestions } from "../../drizzle/schema";

export const PALS_AHA_COURSE_TITLE = "Paediatric Advanced Life Support (PALS)";

export async function getPalsAhaCourseId(db: any): Promise<number | null> {
  await ensurePalsAhaCatalog(db);
  const anchor = await db
    .select({ id: courses.id })
    .from(courses)
    .where(
      and(
        eq(courses.programType, "pals"),
        not(like(courses.title, "%seriously ill%")),
        not(like(courses.title, "%Paediatric septic shock%"))
      )
    )
    .orderBy(courses.order)
    .limit(1);
  return anchor[0]?.id ?? null;
}

export async function ensurePalsAhaCatalog(db: any): Promise<void> {
  const existing = await db
    .select({ id: courses.id })
    .from(courses)
    .where(
      and(
        eq(courses.programType, "pals"),
        not(like(courses.title, "%seriously ill%")),
        not(like(courses.title, "%Paediatric septic shock%"))
      )
    )
    .limit(1);

  let courseId: number;

  if (existing.length > 0) {
    courseId = existing[0].id;
    await db
      .update(courses)
      .set({
        title: PALS_AHA_COURSE_TITLE,
        description:
          "AHA-aligned Pediatric Advanced Life Support — structured assessment, algorithms, and team response for paediatric emergencies.",
        duration: 960,
        level: "advanced",
        order: 1,
      })
      .where(eq(courses.id, courseId));
  } else {
    await db.insert(courses).values({
      title: PALS_AHA_COURSE_TITLE,
      description:
        "AHA-aligned Pediatric Advanced Life Support — structured assessment, algorithms, and team response for paediatric emergencies.",
      programType: "pals",
      duration: 960,
      level: "advanced",
      order: 1,
    });
    const row = await db
      .select({ id: courses.id })
      .from(courses)
      .where(
        and(
          eq(courses.programType, "pals"),
          not(like(courses.title, "%seriously ill%")),
          not(like(courses.title, "%Paediatric septic shock%"))
        )
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

  if (modExisting.length > 0) return;

  await db.insert(modules).values({
    courseId,
    title: "Module 1: PALS systematic approach overview",
    description: "Apply the PALS systematic approach to rapidly identify and manage paediatric emergencies.",
    content: `<h2>PALS systematic approach</h2>
<p>The PALS systematic approach provides a structured framework for evaluating and managing seriously ill children in any clinical setting.</p>
<ul>
  <li>Initial impression and primary assessment (ABCDE).</li>
  <li>Secondary assessment and targeted interventions.</li>
  <li>Team communication and escalation when the child is not improving.</li>
</ul>`,
    duration: 45,
    order: 1,
  });

  const modRow = await db
    .select({ id: modules.id })
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(desc(modules.id))
    .limit(1);
  const moduleId = modRow[0]!.id;

  await db.insert(quizzes).values({
    moduleId,
    title: "Check: PALS systematic approach",
    description: "Knowledge check",
    passingScore: 70,
    order: 1,
  });

  const quizRow = await db
    .select({ id: quizzes.id })
    .from(quizzes)
    .where(eq(quizzes.moduleId, moduleId))
    .orderBy(desc(quizzes.id))
    .limit(1);

  await db.insert(quizQuestions).values({
    quizId: quizRow[0]!.id,
    question: "In PALS, the primary assessment follows which sequence?",
    questionType: "multiple_choice",
    options: JSON.stringify([
      "Airway → Breathing → Circulation → Disability → Exposure",
      "Exposure → Disability → Circulation → Breathing → Airway",
      "Labs before any stabilisation",
      "Disposition before treatment",
    ]),
    correctAnswer: JSON.stringify("Airway → Breathing → Circulation → Disability → Exposure"),
    explanation: "Treat life-threatening problems in ABCDE order before moving on.",
    order: 1,
  });
}
