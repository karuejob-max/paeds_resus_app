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
  MIN_FORMATIVE_QUESTIONS_PER_MODULE,
  MICROCOURSE_FULL_QUESTION_BANK_SIZE,
  expandQuestionBank,
  resolveExamQuestionBanks,
  uniqueFormativeQuestions,
  type FormativeQuestion,
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

  const allModules = await db
    .select({ id: modules.id, order: modules.order })
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(modules.order);

  const moduleRows =
    allModules.length > 0
      ? allModules
      : [{ id: moduleId, order: 1 }];

  const rawBank: FormativeQuestion[] = [
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
      options: [
        "Always — start 40 mL/kg bolus",
        "Never relevant",
        "Only with other perfusion deficits — reassess",
        "Only in adults",
      ],
      correct: 2,
      explanation:
        "Perfusion, CRT, mental status, and pulse quality matter — cool skin is not sufficient alone (CST §4).",
    },
    {
      question: "Tachypnoea with poor feeding in an infant should prompt:",
      options: [
        "Structured ABCDE assessment and early escalation",
        "Discharge without observation",
        "Antibiotics only without exam",
        "Ignore if afebrile",
      ],
      correct: 0,
      explanation: "Respiratory and perfusion compromise can evolve quickly — assess systematically.",
    },
    {
      question: "Capillary refill time >3 seconds with lethargy suggests:",
      options: [
        "Perfusion failure — treat circulation while reassessing",
        "Normal variant only",
        "Hypervolaemia",
        "No urgency",
      ],
      correct: 0,
      explanation: "Prolonged CRT with altered status is a perfusion warning sign.",
    },
    {
      question: "Exposure in the primary survey is used to:",
      options: [
        "Identify hidden injuries, rashes, and bleeding after ABC stabilisation",
        "Replace airway assessment",
        "Delay treatment until full imaging",
        "Skip in all children",
      ],
      correct: 0,
      explanation: "Exposure completes the survey once immediate threats are addressed.",
    },
    {
      question: "When to call senior help during initial stabilisation:",
      options: [
        "Early when airway, breathing, or circulation remain unstable",
        "Only after 24 hours",
        "Never in district hospitals",
        "After discharge planning",
      ],
      correct: 0,
      explanation: "Escalate early for persistent instability or unclear diagnosis.",
    },
    {
      question: "Bedside glucose in an unwell child is important because:",
      options: [
        "Hypoglycaemia is a reversible cause of altered mental status",
        "It replaces blood pressure",
        "Only adults need glucose checks",
        "Hyperglycaemia rules out sepsis",
      ],
      correct: 0,
      explanation: "Treat hypoglycaemia while continuing ABCDE stabilisation.",
    },
    {
      question: "High-flow oxygen is indicated when:",
      options: [
        "SpO₂ remains below target despite standard oxygen",
        "Child is comfortable on room air",
        "Only for adults",
        "Never in asthma",
      ],
      correct: 0,
      explanation: "Escalate oxygen delivery when hypoxia persists.",
    },
    {
      question: "Disability (neurological) assessment includes:",
      options: [
        "AVPU/GCS, pupils, and glucose",
        "Only CT scan",
        "Skipping in infants",
        "Pain score only",
      ],
      correct: 0,
      explanation: "Rapid neuro check guides urgency for airway protection and imaging.",
    },
    {
      question: "Primary survey differs from secondary survey because:",
      options: [
        "Primary treats life threats immediately; secondary is detailed head-to-toe",
        "They are identical",
        "Secondary comes first always",
        "Primary is only for trauma",
      ],
      correct: 0,
      explanation: "Stabilise ABC first, then complete a fuller evaluation.",
    },
    {
      question: "A structured handover after stabilisation should include:",
      options: [
        "Age, weight, interventions, response, and outstanding concerns (SBAR)",
        "Only diagnosis name",
        "No vital signs",
        "Verbal only without documentation",
      ],
      correct: 0,
      explanation: "SBAR-style handover supports safe escalation and referral.",
    },
    {
      question: "Weak femoral pulse compared with brachial pulse suggests:",
      options: [
        "Possible shock — assess perfusion and treat circulation",
        "Normal in all children",
        "Hypervolaemia",
        "No clinical relevance",
      ],
      correct: 0,
      explanation: "Central vs peripheral pulse quality helps detect compensated shock.",
    },
    {
      question: "Stridor at rest requires:",
      options: [
        "Urgent airway assessment and senior help",
        "Outpatient review in 2 weeks",
        "Antibiotics only",
        "No action if SpO₂ is normal",
      ],
      correct: 0,
      explanation: "Stridor at rest is a potential airway emergency.",
    },
    {
      question: "Urine output monitoring in critical illness helps assess:",
      options: [
        "Perfusion and renal perfusion",
        "Only hydration unrelated to shock",
        "Nothing useful",
        "Only adults",
      ],
      correct: 0,
      explanation: "Oliguria can signal hypoperfusion or AKI.",
    },
    {
      question: "Fever with petechiae mandates:",
      options: [
        "Immediate assessment for meningococcal disease",
        "Observation at home only",
        "Antipyretics alone",
        "Defer antibiotics until rash fades",
      ],
      correct: 0,
      explanation: "Non-blanching rash with fever is a medical emergency.",
    },
    {
      question: "After initial stabilisation, the secondary survey is:",
      options: [
        "A detailed head-to-toe evaluation when safe",
        "Always before any treatment",
        "Optional in all emergencies",
        "Only imaging",
      ],
      correct: 0,
      explanation: "Complete secondary survey after ABC threats are addressed.",
    },
    {
      question: "Pain assessment in a seriously ill child should:",
      options: [
        "Use age-appropriate pain scales and treat severe pain",
        "Be ignored in infants",
        "Delay all analgesia",
        "Replace vital signs",
      ],
      correct: 0,
      explanation: "Pain increases distress and complicates assessment — treat when safe.",
    },
    {
      question: "Family presence during resuscitation:",
      options: [
        "May be supported per facility policy when safe",
        "Is always forbidden",
        "Replaces clinical team",
        "Delays all treatment",
      ],
      correct: 0,
      explanation: "Follow local policy; communication with caregivers remains essential.",
    },
    {
      question: "Referral to higher-level care is indicated when:",
      options: [
        "Required interventions exceed local capability",
        "Child is fully stable",
        "Only for adults",
        "Never from district hospitals",
      ],
      correct: 0,
      explanation: "Escalate early when specialised care is needed.",
    },
    {
      question: "Documentation during stabilisation should capture:",
      options: [
        "Times, vital trends, fluids, drugs, and clinical response",
        "Only final diagnosis",
        "Nothing until discharge",
        "Verbal handover only",
      ],
      correct: 0,
      explanation: "Contemporaneous notes support continuity and medicolegal safety.",
    },
    {
      question: "Modified early warning score (MEWS/PEWS) in paediatrics helps:",
      options: [
        "Trigger escalation when vital trends worsen",
        "Replace clinical assessment entirely",
        "Delay senior review until arrest",
        "Only apply in adults",
      ],
      correct: 0,
      explanation: "Early warning scores support timely escalation in deteriorating children.",
    },
    {
      question: "Bronchodilator trial in wheezy infant with distress should:",
      options: [
        "Be given while monitoring response — wheeze is not always asthma",
        "Never be used under 12 months",
        "Replace ABCDE assessment",
        "Delay until ICU admission always",
      ],
      correct: 0,
      explanation: "Trial bronchodilator with reassessment while completing systematic assessment.",
    },
    {
      question: "Sepsis screening in febrile unwell child includes:",
      options: [
        "Perfusion assessment, rash check, and source evaluation",
        "Temperature alone",
        "Antibiotics only after culture returns",
        "Discharge if playful momentarily",
      ],
      correct: 0,
      explanation: "Combine clinical perfusion and danger signs with appropriate cultures and antibiotics when indicated.",
    },
    {
      question: "Inter-facility transport of critically ill child requires:",
      options: [
        "Stabilised ABC, documented handover, and appropriate escort/equipment",
        "Transport without IV access always",
        "Parent alone without clinical escort in all cases",
        "No monitoring during transfer",
      ],
      correct: 0,
      explanation: "Safe transfer needs stabilisation, SBAR handover, and trained escort per referral protocol.",
    },
  ];

  const BANK = uniqueFormativeQuestions(
    expandQuestionBank(
      rawBank,
      Math.max(MICROCOURSE_FULL_QUESTION_BANK_SIZE, moduleRows.length * MIN_FORMATIVE_QUESTIONS_PER_MODULE)
    )
  );

  const upsertQuizOnModule = async (
    modId: number,
    title: string,
    passingScore: number
  ): Promise<number> => {
    const existing = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(and(eq(quizzes.moduleId, modId), eq(quizzes.title, title)))
      .limit(1);
    if (existing.length > 0) {
      await db.update(quizzes).set({ passingScore, description: title }).where(eq(quizzes.id, existing[0]!.id));
      return existing[0]!.id;
    }
    await db.insert(quizzes).values({
      moduleId: modId,
      title,
      description: title,
      passingScore,
      order: 1,
    });
    const row = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(and(eq(quizzes.moduleId, modId), eq(quizzes.title, title)))
      .orderBy(desc(quizzes.id))
      .limit(1);
    return row[0]!.id;
  };

  const upsertQuestions = async (quizId: number, questions: FormativeQuestion[]) => {
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

  for (let m = 0; m < moduleRows.length; m++) {
    const modId = moduleRows[m]!.id;
    const slice: FormativeQuestion[] = [];
    let cursor = m * MIN_FORMATIVE_QUESTIONS_PER_MODULE;
    while (slice.length < MIN_FORMATIVE_QUESTIONS_PER_MODULE && BANK.length > 0) {
      const candidate = BANK[cursor % BANK.length]!;
      cursor++;
      if (!slice.some((q) => q.question.trim() === candidate.question.trim())) {
        slice.push(candidate);
      }
      if (cursor > BANK.length * moduleRows.length * MIN_FORMATIVE_QUESTIONS_PER_MODULE) break;
    }
    const formativeTitle =
      moduleRows.length > 1
        ? `${MICROCOURSE_FORMATIVE_QUIZ_TITLE}: Module ${m + 1}`
        : MICROCOURSE_FORMATIVE_QUIZ_TITLE;
    const formativeId = await upsertQuizOnModule(modId, formativeTitle, 70);
    await upsertQuestions(formativeId, slice);
  }

  const firstModId = moduleRows[0]!.id;
  const lastModId = moduleRows[moduleRows.length - 1]!.id;

  const diagnosticId = await upsertQuizOnModule(firstModId, MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE, 0);
  const { diagnostic: diagnosticBank, summative: summativeBank } = resolveExamQuestionBanks(BANK);
  await upsertQuestions(diagnosticId, diagnosticBank);

  const summativeId = await upsertQuizOnModule(lastModId, MICROCOURSE_SUMMATIVE_QUIZ_TITLE, 80);
  await upsertQuestions(summativeId, summativeBank);
}
