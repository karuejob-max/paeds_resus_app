import { and, desc, eq } from "drizzle-orm";
import { courses, modules, quizQuestions, quizzes } from "../../drizzle/schema";
import {
  PAEDS_RESUS_ILS_PROGRAM_TYPE,
  PAEDS_RESUS_ILS_COURSE_SLUG,
} from "@shared/institutional-life-support";

const ILS_MODULES = [
  {
    title: "Module 1: Paeds Resus Competency and Team Response",
    description:
      "Set expectations for Paeds Resus certification, role clarity, escalation, and safe team performance.",
    duration: 35,
    content: `
      <h2>What this programme certifies</h2>
      <p>The Institutional Life Support Training Program is a Paeds Resus competency-based training programme for healthcare providers and response teams. It leads to a Paeds Resus certificate after the required learning, assessment, and practical competency steps are completed.</p>
      <p>This programme is not an American Heart Association course and does not issue an AHA certificate. A learner may request a separate AHA BLS or ACLS credentialing pathway after Paeds Resus completion, subject to the published time window, payment, and credentialing review.</p>
      <h2>Team response principles</h2>
      <ul><li>Recognise deterioration early and call for help.</li><li>Assign clear roles and use closed-loop communication.</li><li>Use local protocols, available equipment, and senior clinical support.</li><li>Reassess after every major intervention and document the response.</li></ul>
    `,
    quiz: {
      title: "Knowledge Check: Competency and Team Response",
      questions: [
        {
          question:
            "What certificate is issued on successful completion of the Institutional Life Support Training Program?",
          options: [
            "An automatic AHA certificate",
            "A Paeds Resus certificate",
            "A government licence",
            "No completion record",
          ],
          correctAnswer: "A Paeds Resus certificate",
          explanation:
            "The programme issues a Paeds Resus certificate. AHA credentialing is a separate request and review pathway.",
        },
      ],
    },
  },
  {
    title: "Module 2: Recognition, First Actions, and Escalation",
    description:
      "Use a structured first assessment, identify immediate threats, and escalate without delay.",
    duration: 45,
    content: `
      <h2>Recognise the child at risk</h2>
      <p>Start with a rapid, structured assessment and identify airway, breathing, circulation, disability, and exposure concerns. Treat immediate threats while the team gathers a focused history and activates the appropriate response.</p>
      <h2>Escalation is a clinical action</h2>
      <p>Call for help early when the child is deteriorating, the available team is not sufficient, or the response is not working. State what you see, what has been done, and what support is needed.</p>
      <p>Follow current local paediatric emergency protocols and use weight-based calculations or reference tools where indicated. This learning content does not replace bedside clinical judgement.</p>
    `,
    quiz: {
      title: "Knowledge Check: Recognition and Escalation",
      questions: [
        {
          question: "When should a team escalate a deteriorating child?",
          options: [
            "Only after all local staff have tried every intervention",
            "Early, when deterioration or inadequate response is recognised",
            "Only after a written report is completed",
            "Only when the child loses consciousness",
          ],
          correctAnswer:
            "Early, when deterioration or inadequate response is recognised",
          explanation:
            "Early escalation is a core safety behaviour when deterioration is recognised or the team needs more capability.",
        },
      ],
    },
  },
  {
    title: "Module 3: Airway, Breathing, and Ventilation",
    description:
      "Build a reliable approach to paediatric airway and breathing emergencies using available resources.",
    duration: 50,
    content: `
      <h2>Airway and breathing priorities</h2>
      <p>Position the child, assess airway patency and breathing effort, provide oxygen and ventilation support according to local protocol, and monitor response. Select equipment that fits the child and confirm effectiveness clinically.</p>
      <h2>Resource-aware practice</h2>
      <p>When equipment or personnel are unavailable, communicate the limitation, use the safest available alternative, and escalate or refer early. Record missing resources so the institution can act on recurring gaps.</p>
    `,
    quiz: {
      title: "Knowledge Check: Airway and Breathing",
      questions: [
        {
          question:
            "What should the team do when an essential airway resource is unavailable?",
          options: [
            "Continue silently without documenting it",
            "Use the safest available alternative and escalate the limitation",
            "Wait until the resource arrives before reassessing",
            "Discharge the child",
          ],
          correctAnswer:
            "Use the safest available alternative and escalate the limitation",
          explanation:
            "Resource limitations should trigger a safe alternative, clear escalation, and documentation for system improvement.",
        },
      ],
    },
  },
  {
    title: "Module 4: Circulation, Shock, and Reassessment",
    description:
      "Recognise poor perfusion, support circulation, and make reassessment visible after each intervention.",
    duration: 50,
    content: `
      <h2>Circulation and shock</h2>
      <p>Assess perfusion, mental status, pulse quality, blood pressure where available, urine output, and other local indicators. Identify likely causes and follow the current paediatric shock protocol used by your service.</p>
      <h2>Reassessment loop</h2>
      <p>After an intervention, deliberately reassess the child and state whether the response is improving, unchanged, or worsening. If the child is not responding as expected, escalate and revisit the working diagnosis.</p>
    `,
    quiz: {
      title: "Knowledge Check: Circulation and Reassessment",
      questions: [
        {
          question: "What completes a safe intervention cycle?",
          options: [
            "Moving to the next task without checking the child",
            "Reassessing response and escalating if the child is not improving",
            "Waiting for the shift handover",
            "Documenting only the final outcome",
          ],
          correctAnswer:
            "Reassessing response and escalating if the child is not improving",
          explanation:
            "Reassessment closes the loop and identifies when the response needs to change.",
        },
      ],
    },
  },
  {
    title: "Module 5: Cardiac Arrest, CPR, and Team Coordination",
    description:
      "Apply the current local paediatric resuscitation algorithm with high-quality CPR and coordinated roles.",
    duration: 60,
    content: `
      <h2>Organised cardiac arrest response</h2>
      <p>Activate the emergency response, begin high-quality CPR, attach monitoring and defibrillation equipment when available, and follow the current paediatric algorithm. Use a team leader, compressor, airway/ventilation lead, medication/access lead, and recorder as appropriate to the team size.</p>
      <h2>Communication under pressure</h2>
      <p>Use short commands, repeat-back, time calls, and explicit rhythm or pulse-check decisions. The team leader should maintain situational awareness and invite concerns from any team member.</p>
    `,
    quiz: {
      title: "Knowledge Check: CPR and Coordination",
      questions: [
        {
          question:
            "Which behaviour best supports a coordinated resuscitation team?",
          options: [
            "Unassigned tasks and silent interventions",
            "Clear roles, closed-loop communication, and time calls",
            "Only the most senior person speaking",
            "Changing roles without announcing it",
          ],
          correctAnswer:
            "Clear roles, closed-loop communication, and time calls",
          explanation:
            "Clear roles and closed-loop communication reduce omissions and help the team maintain timing and situational awareness.",
        },
      ],
    },
  },
  {
    title: "Module 6: Simulation, Debriefing, and Safer Systems",
    description:
      "Translate learning into team performance, practical assessment, debriefing, and institutional improvement.",
    duration: 45,
    content: `
      <h2>From knowledge to performance</h2>
      <p>Certification requires more than reading. Learners should demonstrate the expected response in an instructor-led practical assessment or simulation, using the equipment and escalation pathways available in their setting.</p>
      <h2>Debrief for improvement</h2>
      <p>A useful debrief identifies what went well, what created delay or risk, and one specific change to test. Capture missing resources and process barriers through the institution's improvement and readiness workflows.</p>
      <p>Once the Paeds Resus practical requirements are verified, the Paeds Resus certificate can be issued. An AHA credentialing request, if made within three months, is reviewed as a separate credentialing decision.</p>
    `,
    quiz: {
      title: "Knowledge Check: Simulation and Safer Systems",
      questions: [
        {
          question:
            "What is the purpose of a structured debrief after a simulation or response?",
          options: [
            "To assign blame",
            "To identify one or more actionable changes for safer future performance",
            "To replace the practical assessment",
            "To issue an automatic AHA certificate",
          ],
          correctAnswer:
            "To identify one or more actionable changes for safer future performance",
          explanation:
            "Debriefing converts performance observations into specific improvements and does not replace competency verification or AHA credentialing review.",
        },
      ],
    },
  },
] as const;

async function getOrCreateCourse(db: any) {
  const existing = await db
    .select()
    .from(courses)
    .where(eq(courses.programType, PAEDS_RESUS_ILS_PROGRAM_TYPE))
    .orderBy(desc(courses.id))
    .limit(1);
  if (existing[0]) {
    await db
      .update(courses)
      .set({
        title:
          "Institutional Life Support Training Program — Paeds Resus Competency",
        description:
          "A Paeds Resus competency-based training programme for institutional providers. Completion issues a Paeds Resus certificate; it does not issue an AHA certificate.",
        duration: ILS_MODULES.reduce((sum, module) => sum + module.duration, 0),
        level: "advanced",
        order: 0,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, existing[0].id));
    return existing[0].id;
  }
  await db.insert(courses).values({
    title:
      "Institutional Life Support Training Program — Paeds Resus Competency",
    description:
      "A Paeds Resus competency-based training programme for institutional providers. Completion issues a Paeds Resus certificate; it does not issue an AHA certificate.",
    programType: PAEDS_RESUS_ILS_PROGRAM_TYPE,
    duration: ILS_MODULES.reduce((sum, module) => sum + module.duration, 0),
    level: "advanced",
    order: 0,
  });
  const created = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.programType, PAEDS_RESUS_ILS_PROGRAM_TYPE))
    .orderBy(desc(courses.id))
    .limit(1);
  if (!created[0])
    throw new Error(
      "Institutional Life Support course catalog could not be created"
    );
  return created[0].id;
}

export async function ensureInstitutionalLifeSupportCatalog(
  db: any
): Promise<void> {
  const courseId = await getOrCreateCourse(db);
  for (const definition of ILS_MODULES) {
    const moduleRows = await db
      .select({ id: modules.id })
      .from(modules)
      .where(
        and(
          eq(modules.courseId, courseId),
          eq(modules.order, ILS_MODULES.indexOf(definition) + 1)
        )
      )
      .limit(1);
    let moduleId = moduleRows[0]?.id;
    const moduleValues = {
      courseId,
      title: definition.title,
      description: definition.description,
      content: definition.content,
      duration: definition.duration,
      order: ILS_MODULES.indexOf(definition) + 1,
      updatedAt: new Date(),
    };
    if (moduleId) {
      await db
        .update(modules)
        .set(moduleValues)
        .where(eq(modules.id, moduleId));
    } else {
      await db.insert(modules).values(moduleValues);
      const created = await db
        .select({ id: modules.id })
        .from(modules)
        .where(
          and(
            eq(modules.courseId, courseId),
            eq(modules.order, moduleValues.order)
          )
        )
        .orderBy(desc(modules.id))
        .limit(1);
      moduleId = created[0]?.id;
    }
    if (!moduleId)
      throw new Error(
        `Institutional Life Support module could not be created: ${definition.title}`
      );

    const quizRows = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.moduleId, moduleId))
      .orderBy(desc(quizzes.id))
      .limit(1);
    let quizId = quizRows[0]?.id;
    const quizValues = {
      moduleId,
      title: definition.quiz.title,
      description: `Knowledge check for ${definition.title}`,
      passingScore: 80,
      order: 1,
      updatedAt: new Date(),
    };
    if (quizId) {
      await db.update(quizzes).set(quizValues).where(eq(quizzes.id, quizId));
    } else {
      await db.insert(quizzes).values(quizValues);
      const created = await db
        .select({ id: quizzes.id })
        .from(quizzes)
        .where(eq(quizzes.moduleId, moduleId))
        .orderBy(desc(quizzes.id))
        .limit(1);
      quizId = created[0]?.id;
    }
    if (!quizId)
      throw new Error(
        `Institutional Life Support quiz could not be created: ${definition.quiz.title}`
      );

    for (let index = 0; index < definition.quiz.questions.length; index += 1) {
      const question = definition.quiz.questions[index];
      const questionOrder = index + 1;
      const existingQuestion = await db
        .select({ id: quizQuestions.id })
        .from(quizQuestions)
        .where(
          and(
            eq(quizQuestions.quizId, quizId),
            eq(quizQuestions.order, questionOrder)
          )
        )
        .limit(1);
      const questionValues = {
        quizId,
        question: question.question,
        questionType: "multiple_choice" as const,
        options: JSON.stringify(question.options),
        correctAnswer: JSON.stringify(question.correctAnswer),
        explanation: question.explanation,
        order: questionOrder,
        updatedAt: new Date(),
      };
      if (existingQuestion[0]) {
        await db
          .update(quizQuestions)
          .set(questionValues)
          .where(eq(quizQuestions.id, existingQuestion[0].id));
      } else {
        await db.insert(quizQuestions).values(questionValues);
      }
    }
  }
}

export async function getInstitutionalLifeSupportCourseId(
  db: any
): Promise<number | null> {
  const rows = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.programType, PAEDS_RESUS_ILS_PROGRAM_TYPE))
    .orderBy(desc(courses.id))
    .limit(1);
  return rows[0]?.id ?? null;
}

export { ILS_MODULES, PAEDS_RESUS_ILS_COURSE_SLUG };
