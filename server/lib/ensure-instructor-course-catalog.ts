/**
 * Idempotent: Paeds Resus Instructor Course — catalog row + one module + quiz (MVP).
 * Called from learning.getCourses(programType=instructor) and certificate gating.
 */
import { desc, eq, and, like } from "drizzle-orm";
import { courses, modules, quizzes, quizQuestions } from "../../drizzle/schema";

export async function ensureInstructorCourseCatalog(db: any): Promise<void> {
  const existing = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.programType, "instructor"), like(courses.title, "%Instructor Course%")))
    .limit(1);

  let courseId: number;

  if (existing.length > 0) {
    courseId = existing[0].id;
  } else {
    await db.insert(courses).values({
      title: "Paeds Resus Instructor Course",
      description:
        "Train-the-trainer foundations: facilitation, assessment, and institutional delivery expectations for Paeds Resus.",
      programType: "instructor",
      duration: 360,
      level: "advanced",
      order: 10,
    });
    const row = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.programType, "instructor"))
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
  } else {
    await db.insert(modules).values({
      courseId,
      title: "Module 1: Instructor role & delivery standards",
      description: "Expectations for Paeds Resus instructors and session quality.",
      content: `
        <h2>Your role</h2>
        <p>Paeds Resus instructors model safe, respectful, protocol-aware teaching in resource-limited settings.</p>
        <ul>
          <li>Prepare sessions using institutional schedules and cohort needs.</li>
          <li>Maintain professional boundaries and local clinical governance.</li>
          <li>Escalate concerns through hospital and platform channels when appropriate.</li>
        </ul>
      `,
      duration: 60,
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
      title: "Check: instructor foundations",
      description: "Pass at 70% to complete the module.",
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
    const optB = "Support local clinical governance and senior review where applicable";
    await db.insert(quizQuestions).values({
      quizId,
      question: "What is the primary expectation of a Paeds Resus instructor regarding local protocols?",
      questionType: "multiple_choice",
      options: JSON.stringify([
        "Ignore local rules if they differ from training slides",
        optB,
        "Replace hospital policy with platform content",
      ]),
      correctAnswer: JSON.stringify(optB),
      explanation: "Training supports professional judgment and local governance.",
      order: 1,
    });
  }
}
