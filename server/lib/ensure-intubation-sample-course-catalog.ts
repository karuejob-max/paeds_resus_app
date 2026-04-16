import { and, desc, eq, like } from "drizzle-orm";
import { courses, modules, quizQuestions, quizzes } from "../../drizzle/schema";

export const INTUBATION_SAMPLE_MICRO_COURSE_ID = "intubation-essentials";
export const INTUBATION_SAMPLE_COURSE_TITLE =
  "Paediatric Intubation Essentials: Preparation, Procedure, and Post-Intubation Safety";

const DISCLAIMER =
  `<p class="text-sm border-l-4 border-amber-500 pl-3 py-1 my-4 bg-amber-50 dark:bg-amber-950/30"><strong>Educational use only.</strong> Follow your facility protocol, scope of practice, and senior supervision requirements for paediatric airway management.</p>`;

export async function ensureIntubationSampleCourseCatalog(db: any): Promise<void> {
  const existing = await db
    .select({ id: courses.id })
    .from(courses)
    .where(
      and(
        eq(courses.programType, "fellowship"),
        like(courses.title, "%Paediatric Intubation Essentials%")
      )
    )
    .limit(1);

  let courseId: number;
  if (existing.length > 0) {
    courseId = existing[0].id;
    await db
      .update(courses)
      .set({
        title: INTUBATION_SAMPLE_COURSE_TITLE,
        description:
          "Sample fellowship micro-course: prepare for paediatric intubation, perform a safe first-pass attempt, and stabilise after tube placement.",
        duration: 60,
        level: "advanced",
      })
      .where(eq(courses.id, courseId));
  } else {
    await db.insert(courses).values({
      title: INTUBATION_SAMPLE_COURSE_TITLE,
      description:
        "Sample fellowship micro-course: prepare for paediatric intubation, perform a safe first-pass attempt, and stabilise after tube placement.",
      programType: "fellowship",
      duration: 60,
      level: "advanced",
      order: 99,
    });
    const row = await db
      .select({ id: courses.id })
      .from(courses)
      .where(
        and(
          eq(courses.programType, "fellowship"),
          like(courses.title, "%Paediatric Intubation Essentials%")
        )
      )
      .orderBy(desc(courses.id))
      .limit(1);
    courseId = row[0]!.id;
  }

  const existingModules = await db
    .select({ id: modules.id, order: modules.order })
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(modules.order);

  const ensureModule = async (
    order: number,
    title: string,
    description: string,
    html: string,
    duration: number
  ) => {
    const found = existingModules.find((m: { order: number }) => m.order === order);
    if (found) {
      await db
        .update(modules)
        .set({ title, description, content: html, duration })
        .where(eq(modules.id, found.id));
      return found.id;
    }
    await db.insert(modules).values({
      courseId,
      title,
      description,
      content: html,
      duration,
      order,
    });
    const row = await db
      .select({ id: modules.id })
      .from(modules)
      .where(eq(modules.courseId, courseId))
      .orderBy(desc(modules.id))
      .limit(1);
    return row[0]!.id;
  };

  const moduleId = await ensureModule(
    1,
    "Module 1: Intubation preparation, attempt, and immediate aftercare",
    "Preparation checklist, role assignment, first-pass safety steps, and confirmation plus ventilation strategy.",
    `${DISCLAIMER}
<h2>Preparation before laryngoscopy</h2>
<ul>
<li>Assign roles (airway operator, drug nurse, monitor/recorder, backup airway).</li>
<li>Prepare suction, oxygen source, bag-mask, appropriately sized ET tubes, stylet, and backup airway adjuncts.</li>
<li>Pre-oxygenate and optimize positioning before attempt.</li>
</ul>
<h2>First-pass safety priorities</h2>
<ul>
<li>Use your local RSI/sedation protocol and pediatric dosing safeguards.</li>
<li>Limit attempt time; oxygenate between attempts.</li>
<li>Escalate early to backup plan when first-pass conditions are poor.</li>
</ul>
<h2>After tube placement</h2>
<ul>
<li>Confirm with capnography where available and bilateral chest movement/air entry.</li>
<li>Secure the tube and record depth at teeth/lip.</li>
<li>Start post-intubation sedation/analgesia and reassess circulation and oxygenation.</li>
</ul>`,
    35
  );

  const qExisting = await db
    .select({ id: quizzes.id })
    .from(quizzes)
    .where(eq(quizzes.moduleId, moduleId))
    .limit(1);

  let quizId: number;
  if (qExisting.length > 0) {
    quizId = qExisting[0].id;
  } else {
    await db.insert(quizzes).values({
      moduleId,
      title: "Intubation essentials check",
      description: "Short readiness check",
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

  const existingQuestions = await db
    .select({ id: quizQuestions.id })
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId));
  if (existingQuestions.length > 0) return;

  const questions = [
    {
      question:
        "Before paediatric intubation, which action is most important for reducing first-pass failure risk?",
      options: [
        "Assign team roles and prepare all airway equipment in advance",
        "Wait to gather equipment after induction starts",
        "Attempt intubation without backup plan",
        "Skip oxygen preloading to save time",
      ],
      correct: "Assign team roles and prepare all airway equipment in advance",
      explanation: "Structured preparation and role clarity improves safety and first-pass success.",
    },
    {
      question: "Which finding best supports successful ET tube placement?",
      options: [
        "Capnography waveform with bilateral chest rise and air entry",
        "Only seeing the tube pass cords once",
        "No chest movement but rising heart rate",
        "Abdominal distension with ventilation",
      ],
      correct: "Capnography waveform with bilateral chest rise and air entry",
      explanation: "Use multiple confirmation signs, with capnography where available.",
    },
  ];

  let order = 1;
  for (const q of questions) {
    await db.insert(quizQuestions).values({
      quizId,
      question: q.question,
      questionType: "multiple_choice",
      options: JSON.stringify(q.options),
      correctAnswer: JSON.stringify(q.correct),
      explanation: q.explanation,
      order: order++,
    });
  }
}

export async function getIntubationSampleCourseId(db: any): Promise<number | null> {
  await ensureIntubationSampleCourseCatalog(db);
  const row = await db
    .select({ id: courses.id })
    .from(courses)
    .where(
      and(
        eq(courses.programType, "fellowship"),
        like(courses.title, "%Paediatric Intubation Essentials%")
      )
    )
    .limit(1);
  return row[0]?.id ?? null;
}
