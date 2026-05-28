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

  const moduleBlueprint = [
    {
      order: 1,
      title: "Module 1: PALS systematic approach and initial stabilization",
      description: "Primary survey (ABCDE), shock recognition, and immediate interventions.",
      content: "<h2>PALS systematic approach</h2><p>Use initial impression, ABCDE, and rapid reassessment to identify and treat life threats.</p>",
      quizTitle: "Check: PALS systematic approach",
      question: "In PALS, the primary assessment follows which sequence?",
      options: ["Airway → Breathing → Circulation → Disability → Exposure", "Exposure → Disability → Circulation → Breathing → Airway", "Labs before stabilization", "Disposition first"],
      answer: "Airway → Breathing → Circulation → Disability → Exposure",
      explanation: "Life-threatening problems are addressed in ABCDE order.",
    },
    {
      order: 2,
      title: "Module 2: Respiratory failure and airway management",
      description: "Recognize impending respiratory failure and escalate oxygen/ventilation support.",
      content: "<h2>Respiratory emergencies</h2><p>Identify respiratory distress, failure, and indications for advanced airway support.</p>",
      quizTitle: "Check: Respiratory management",
      question: "Which sign suggests impending respiratory failure?",
      options: ["Normal mental status with mild tachypnea", "Decreasing respiratory effort with altered consciousness", "Isolated fever", "Mild cough only"],
      answer: "Decreasing respiratory effort with altered consciousness",
      explanation: "Fatigue with altered mental status indicates failure and need for urgent support.",
    },
    {
      order: 3,
      title: "Module 3: Shock and fluid-resuscitation pathways",
      description: "Differentiate hypovolemic, distributive, cardiogenic, and obstructive shock in children.",
      content: "<h2>Pediatric shock</h2><p>Apply shock classification, tailored fluids, vasoactive support, and frequent reassessment.</p>",
      quizTitle: "Check: Shock pathways",
      question: "What is the key first treatment goal in pediatric shock?",
      options: ["Delay intervention until labs return", "Restore perfusion and oxygen delivery", "Only treat blood pressure", "Avoid reassessment"],
      answer: "Restore perfusion and oxygen delivery",
      explanation: "Early restoration of perfusion is the central target in shock management.",
    },
    {
      order: 4,
      title: "Module 4: Bradycardia and tachycardia algorithms",
      description: "Use PALS rhythm algorithms to manage unstable bradycardia and tachycardia.",
      content: "<h2>Rhythm management</h2><p>Follow pediatric bradycardia and tachycardia algorithms with synchronized cardioversion when indicated.</p>",
      quizTitle: "Check: Rhythm algorithms",
      question: "Unstable supraventricular tachycardia should be managed with:",
      options: ["Observation only", "Synchronized cardioversion", "Routine discharge", "Antibiotics"],
      answer: "Synchronized cardioversion",
      explanation: "Unstable tachyarrhythmias require immediate synchronized cardioversion.",
    },
    {
      order: 5,
      title: "Module 5: Cardiac arrest and post-ROSC care",
      description: "Apply pediatric cardiac arrest sequence and optimize post-resuscitation stabilization.",
      content: "<h2>Cardiac arrest and ROSC</h2><p>Deliver high-quality CPR, timely defibrillation, and post-ROSC hemodynamic and neurologic care.</p>",
      quizTitle: "Check: Arrest and ROSC",
      question: "After ROSC, which is a priority?",
      options: ["Ignore blood pressure", "Optimize oxygenation, ventilation, and perfusion", "Stop monitoring", "Delay reassessment"],
      answer: "Optimize oxygenation, ventilation, and perfusion",
      explanation: "Post-ROSC care focuses on physiologic stabilization and preventing secondary injury.",
    },
    {
      order: 6,
      title: "Module 6: Team dynamics, communication, and special circumstances",
      description: "Crisis resource management, role clarity, debriefing, and pediatric special situations.",
      content: "<h2>Team performance</h2><p>Use closed-loop communication, role delegation, and post-event debriefs to improve outcomes.</p>",
      quizTitle: "Check: Team dynamics",
      question: "Closed-loop communication means:",
      options: ["No verbal confirmation", "Orders are repeated back and confirmed", "Only leader speaks", "Debriefs are skipped"],
      answer: "Orders are repeated back and confirmed",
      explanation: "Closed-loop communication reduces errors during high-acuity resuscitation.",
    },
  ] as const;

  for (const mod of moduleBlueprint) {
    const modRow = await db
      .select({ id: modules.id })
      .from(modules)
      .where(and(eq(modules.courseId, courseId), eq(modules.order, mod.order)))
      .orderBy(desc(modules.id))
      .limit(1);
    let moduleId = modRow[0]?.id;
    if (!moduleId) {
      await db.insert(modules).values({
        courseId,
        title: mod.title,
        description: mod.description,
        content: mod.content,
        duration: 60,
        order: mod.order,
      });
      const insertedRow = await db
        .select({ id: modules.id })
        .from(modules)
        .where(and(eq(modules.courseId, courseId), eq(modules.order, mod.order)))
        .orderBy(desc(modules.id))
        .limit(1);
      moduleId = insertedRow[0]!.id;
    }

    const quizRow = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.moduleId, moduleId))
      .orderBy(desc(quizzes.id))
      .limit(1);
    let quizId = quizRow[0]?.id;
    if (!quizId) {
      await db.insert(quizzes).values({
        moduleId,
        title: mod.quizTitle,
        description: "Knowledge check",
        passingScore: 80,
        order: 1,
      });
      const insertedQuiz = await db
        .select({ id: quizzes.id })
        .from(quizzes)
        .where(eq(quizzes.moduleId, moduleId))
        .orderBy(desc(quizzes.id))
        .limit(1);
      quizId = insertedQuiz[0]!.id;
    }
    const qExisting = await db
      .select({ id: quizQuestions.id })
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .limit(1);
    if (qExisting.length > 0) continue;

    await db.insert(quizQuestions).values({
      quizId,
      question: mod.question,
      questionType: "multiple_choice",
      options: JSON.stringify(mod.options),
      correctAnswer: JSON.stringify(mod.answer),
      explanation: mod.explanation,
      order: 1,
    });
  }
}
