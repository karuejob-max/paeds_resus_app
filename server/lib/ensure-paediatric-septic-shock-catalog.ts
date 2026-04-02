/**
 * Idempotent: PALS micro-course "Paediatric septic shock" + modules + quizzes.
 * Educational content aligns with general international sepsis care principles; always follow local protocols.
 * References (frameworks, not reproduced text): Surviving Sepsis Campaign children/adult 2026 updates;
 * "Ten Steps to Improve Sepsis Care in Low-Resource Settings" (resource-aware care).
 */
import { desc, eq, and, like } from "drizzle-orm";
import { courses, modules, quizzes, quizQuestions } from "../../drizzle/schema";

export const PAEDIATRIC_SEPTIC_SHOCK_TITLE = "Paediatric septic shock — recognition and first-hour care";

const DISCLAIMER = `<p class="text-sm border-l-4 border-amber-500 pl-3 py-1 my-4 bg-amber-50 dark:bg-amber-950/30"><strong>Educational use only.</strong> This module supports training—not bedside decision-making. Apply your facility&apos;s protocols, senior review, and local formularies. Paeds Resus does not replace professional judgment or licensing requirements.</p>`;

export async function getPaediatricSepticShockCourseId(db: any): Promise<number | null> {
  await ensurePaediatricSepticShockCatalog(db);
  const row = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.programType, "pals"), like(courses.title, "%Paediatric septic shock%")))
    .limit(1);
  return row[0]?.id ?? null;
}

export async function ensurePaediatricSepticShockCatalog(db: any): Promise<void> {
  const existing = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.programType, "pals"), like(courses.title, "%Paediatric septic shock%")))
    .limit(1);

  let courseId: number;

  if (existing.length > 0) {
    courseId = existing[0].id;
  } else {
    await db.insert(courses).values({
      title: PAEDIATRIC_SEPTIC_SHOCK_TITLE,
      description:
        "Evidence-informed micro-course: recognise paediatric septic shock early, start time-sensitive care, escalate safely. Pair with ResusGPS at the bedside.",
      programType: "pals",
      duration: 90,
      level: "advanced",
      order: 1,
    });
    const row = await db
      .select({ id: courses.id })
      .from(courses)
      .where(and(eq(courses.programType, "pals"), like(courses.title, "%Paediatric septic shock%")))
      .orderBy(desc(courses.id))
      .limit(1);
    courseId = row[0]!.id;
  }

  const modRows = await db
    .select({ id: modules.id, order: modules.order })
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(modules.order);

  const ensureModule = async (
    order: number,
    title: string,
    description: string,
    html: string,
    durationMin: number
  ) => {
    let mid: number;
    const found = modRows.find((m: { order: number }) => m.order === order);
    if (found) {
      mid = found.id;
      await db
        .update(modules)
        .set({ title, description, content: html, duration: durationMin })
        .where(eq(modules.id, mid));
    } else {
      await db.insert(modules).values({
        courseId,
        title,
        description,
        content: html,
        duration: durationMin,
        order,
      });
      const m = await db
        .select({ id: modules.id })
        .from(modules)
        .where(eq(modules.courseId, courseId))
        .orderBy(desc(modules.id))
        .limit(1);
      mid = m[0]!.id;
    }
    return mid;
  };

  const m1 = await ensureModule(
    1,
    "Module 1: Recognise shock early",
    "Clinical patterns, sepsis suspicion, first actions in parallel with ABCDE.",
    `${DISCLAIMER}
<h2>Why speed matters</h2>
<p>Paediatric septic shock is a time-critical condition. Early recognition and coordinated treatment are associated with better outcomes in international sepsis programmes. The <strong>Surviving Sepsis Campaign</strong> (children and adult guidelines, including 2026 updates) emphasise timely recognition, source control thinking, and structured resuscitation within your local framework.</p>
<h2>What to look for</h2>
<ul>
<li><strong>Behaviour:</strong> irritability, lethargy, poor feeding or interaction (age-dependent).</li>
<li><strong>Perfusion:</strong> delayed capillary refill, cool extremities, mottled skin, weak pulses.</li>
<li><strong>Respiratory:</strong> tachypnoea, increased work of breathing; may precede hypotension in children.</li>
<li><strong>Circulation:</strong> tachycardia; hypotension may be a late sign—do not wait for a “low BP” to act if perfusion is poor.</li>
</ul>
<h2>Think in parallel</h2>
<p>Use a structured primary survey (airway, breathing, circulation, disability, exposure) while considering sepsis as a cause of shock. Identify life threats first; obtain senior help early.</p>
<p>In <strong>low-resource settings</strong>, the &quot;Ten Steps to Improve Sepsis Care&quot; themes (timely recognition, oxygen, antibiotics when indicated, fluids where appropriate, safe referral pathways) remain highly relevant—adapt delivery to what your facility can safely provide and measure.</p>`,
    25
  );

  const m2 = await ensureModule(
    2,
    "Module 2: First-hour stabilisation",
    "Fluids, antibiotics, monitoring—aligned with principles; volumes and choices follow local protocol.",
    `${DISCLAIMER}
<h2>Principles (not a prescription)</h2>
<p>International guidelines stress <strong>early appropriate antibiotics</strong> after cultures when feasible, <strong>haemodynamic resuscitation</strong> guided by reassessment, and <strong>escalation</strong> when response is inadequate. Exact fluid types, bolus sizes, and inotrope thresholds differ by age, weight, and national policy—follow your hospital.</p>
<h2>Fluids</h2>
<p>Give fluid boluses <strong>with close monitoring</strong> of perfusion, breathing, and heart rate. In some presentations (e.g. concern for myocardial dysfunction or fluid overload), smaller aliquots and earlier escalation may be safer—your protocol should say how.</p>
<h2>Antibiotics</h2>
<p>When sepsis is suspected, <strong>do not delay antibiotics</strong> to complete investigations. Choose empiric therapy per local guideline and likely source.</p>
<h2>Monitoring & reassessment</h2>
<p>Reassess after each intervention. Poor response triggers escalation (senior review, second-line therapy, critical care referral)—document clearly.</p>`,
    30
  );

  const m3 = await ensureModule(
    3,
    "Module 3: Escalation, systems & low-resource care",
    "When to call for help, handover, gaps you can fix tomorrow, and dignity in teamwork.",
    `${DISCLAIMER}
<h2>Escalation</h2>
<p>Define clear triggers with your team: worsening perfusion, rising oxygen need, altered consciousness, or failure to improve after initial resuscitation. Use structured communication (situation–background–assessment–recommendation).</p>
<h2>Low-resource realities</h2>
<p>If blood pressure monitoring, labs, or second-line drugs are unavailable, document what you did, what was missing, and what would have changed care—this feeds quality improvement and advocacy.</p>
<h2>After the event</h2>
<p>Debrief when possible. Use ResusGPS and Safe-Truth-style reflection (where appropriate) to surface system gaps (e.g. stock-outs, delayed labs)—without blaming individuals.</p>
<h2>Closing</h2>
<p>You are part of a chain that stretches from triage to ICU. Small, reliable steps—recognition, antibiotics, fluids with monitoring, escalation—save lives when applied consistently.</p>`,
    25
  );

  const moduleIds = [m1, m2, m3];
  const quizSpecs: {
    moduleOrder: number;
    title: string;
    questions: {
      question: string;
      options: string[];
      correct: string;
      explanation: string;
    }[];
  }[] = [
    {
      moduleOrder: 1,
      title: "Check: early recognition",
      questions: [
        {
          question:
            "In a febrile child with poor perfusion (e.g. prolonged capillary refill), which mindset best matches international sepsis programmes?",
          options: [
            "Treat shock and sepsis early; do not wait for hypotension alone in children",
            "Wait for blood pressure to drop before giving fluids",
            "Delay antibiotics until all cultures and imaging are finished",
            "Avoid involving senior help until the patient codes",
          ],
          correct: "Treat shock and sepsis early; do not wait for hypotension alone in children",
          explanation:
            "Children may compensate with tachycardia and vasoconstriction; hypotension can be late. Early recognition and treatment are central to sepsis care.",
        },
        {
          question: "Which initial approach is most appropriate while you assess and treat?",
          options: [
            "A structured primary survey (e.g. ABCDE) in parallel with sepsis thinking",
            "Order imaging before any stabilisation",
            "Focus only on fever without assessing circulation",
            "Send the patient home with antipyretics",
          ],
          correct: "A structured primary survey (e.g. ABCDE) in parallel with sepsis thinking",
          explanation: "Stabilise life threats in a structured way; sepsis is one important cause of shock.",
        },
      ],
    },
    {
      moduleOrder: 2,
      title: "Check: first-hour principles",
      questions: [
        {
          question:
            "When bacterial sepsis is suspected and there are no contraindications per local protocol, what is the priority regarding antibiotics?",
          options: [
            "Start empiric antibiotics promptly—do not postpone solely to complete tests",
            "Always wait 24 hours for culture results",
            "Give antibiotics only if blood pressure is low",
            "Avoid antibiotics if the child is still alert",
          ],
          correct: "Start empiric antibiotics promptly—do not postpone solely to complete tests",
          explanation:
            "Guidelines stress timely antibiotics in sepsis/septic shock alongside source control thinking and resuscitation.",
        },
        {
          question: "Fluid boluses during resuscitation should be given:",
          options: [
            "With frequent reassessment of perfusion, breathing, and response",
            "As a single large dose without reassessment",
            "Only after CT imaging",
            "Only if sodium is known",
          ],
          correct: "With frequent reassessment of perfusion, breathing, and response",
          explanation: "Reassessment guides further boluses versus escalation; fluid tolerance varies by cause and cardiac function.",
        },
      ],
    },
    {
      moduleOrder: 3,
      title: "Check: escalation & systems",
      questions: [
        {
          question: "If the child is not improving after initial resuscitation, the best next step is usually to:",
          options: [
            "Escalate care (senior review / critical care referral) per protocol",
            "Discharge with oral antibiotics",
            "Stop all fluids in every case",
            "Ignore tachycardia if blood pressure is normal",
          ],
          correct: "Escalate care (senior review / critical care referral) per protocol",
          explanation: "Persistent shock despite initial therapy requires escalation and broader support.",
        },
        {
          question: "In low-resource settings, documenting stock-outs or delays is important because:",
          options: [
            "It supports quality improvement and safer systems—not individual blame",
            "It replaces the need for treatment",
            "It is only for research",
            "It should never be shared",
          ],
          correct: "It supports quality improvement and safer systems—not individual blame",
          explanation: "Systems gaps (e.g. missing drugs or monitors) require visibility to be fixed.",
        },
      ],
    },
  ];

  for (const spec of quizSpecs) {
    const mid = moduleIds[spec.moduleOrder - 1];
    const qzExisting = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.moduleId, mid))
      .limit(1);
    let quizId: number;
    if (qzExisting.length > 0) {
      quizId = qzExisting[0].id;
    } else {
      await db.insert(quizzes).values({
        moduleId: mid,
        title: spec.title,
        description: "Knowledge check",
        passingScore: 70,
        order: 1,
      });
      const q = await db
        .select({ id: quizzes.id })
        .from(quizzes)
        .where(eq(quizzes.moduleId, mid))
        .orderBy(desc(quizzes.id))
        .limit(1);
      quizId = q[0]!.id;
    }

    const existingQs = await db
      .select({ id: quizQuestions.id })
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId));
    if (existingQs.length > 0) continue;

    let ord = 1;
    for (const q of spec.questions) {
      await db.insert(quizQuestions).values({
        quizId,
        question: q.question,
        questionType: "multiple_choice",
        options: JSON.stringify(q.options),
        correctAnswer: JSON.stringify(q.correct),
        explanation: q.explanation,
        order: ord++,
      });
    }
  }
}
