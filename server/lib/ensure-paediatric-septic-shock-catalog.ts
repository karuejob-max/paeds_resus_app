/**
 * Idempotent: PALS micro-course "Paediatric septic shock" + modules + quizzes.
 * Educational content aligns with general international sepsis care principles; always follow local protocols.
 * References (frameworks, not reproduced text): Surviving Sepsis Campaign children/adult 2026 updates;
 * "Ten Steps to Improve Sepsis Care in Low-Resource Settings" (resource-aware care).
 */
import { desc, eq, and, like } from "drizzle-orm";
import { courses, modules, quizzes, quizQuestions } from "../../drizzle/schema";

export const PAEDIATRIC_SEPTIC_SHOCK_TITLE = "Paediatric Septic Shock I — recognition and first-hour care";

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
    await db
      .update(courses)
      .set({
        title: PAEDIATRIC_SEPTIC_SHOCK_TITLE,
        description:
          "Tier I — for recognition and first-hour care in any size facility (including small clinics where one clinician wears many hats). Aligns with international sepsis principles; always follow your facility protocol. Use alongside ResusGPS during real cases. A future optional Tier II course will cover advanced management (e.g. refractory shock) for those who complete Tier I.",
      })
      .where(eq(courses.id, courseId));
  } else {
    await db.insert(courses).values({
      title: PAEDIATRIC_SEPTIC_SHOCK_TITLE,
      description:
        "Tier I — for recognition and first-hour care in any size facility (including small clinics where one clinician wears many hats). Aligns with international sepsis principles; always follow your facility protocol. Use alongside ResusGPS during real cases. A future optional Tier II course will cover advanced management (e.g. refractory shock) for those who complete Tier I.",
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
<h2>Who this module is for</h2>
<p>Many readers work in <strong>small facilities</strong> (dispensary, clinic, or health centre) where <strong>one clinician</strong> may need to think like triage nurse, doctor, and team leader at once. This module stays practical for that reality—while still telling you to use your facility&apos;s protocol and call senior help when available.</p>
<h2>Why speed matters</h2>
<p>Paediatric septic shock is time-critical. International sepsis programmes (e.g. <strong>Surviving Sepsis Campaign</strong> paediatric/adult updates) stress timely recognition, source-control thinking, and structured resuscitation <strong>within your local framework</strong>.</p>
<h2>What is &quot;shock&quot; in plain language?</h2>
<p><strong>Shock</strong> means the body is not delivering enough oxygen and nutrients to the tissues—often because circulation is impaired in the setting of serious infection. You do not need a blood pressure machine to suspect it.</p>
<p><strong>Watch for:</strong> a child who is <strong>much more unwell than &quot;just a fever&quot;</strong>—very sleepy or irritable, mottled or grey, cool hands/feet, weak pulses, capillary refill longer than your protocol&apos;s cut-off, fast breathing for age, or a fast heart rate that does not improve as you treat the basics. In children, <strong>blood pressure can fall late</strong>; waiting for hypotension alone can delay care.</p>
<h2>What to look for</h2>
<ul>
<li><strong>Behaviour:</strong> irritability, lethargy, poor feeding or interaction (age-dependent).</li>
<li><strong>Perfusion:</strong> delayed capillary refill, cool extremities, mottled skin, weak pulses.</li>
<li><strong>Respiratory:</strong> tachypnoea, increased work of breathing; may precede hypotension in children.</li>
<li><strong>Circulation:</strong> tachycardia; hypotension may be a late sign—do not wait for a low BP reading if perfusion is poor.</li>
</ul>
<h2>Think in parallel</h2>
<p>Use a structured primary survey (airway, breathing, circulation, disability, exposure) while considering sepsis as a cause of shock. Identify life threats first; obtain senior help early.</p>
<p>In <strong>low-resource settings</strong>, themes from &quot;Ten Steps to Improve Sepsis Care&quot; (timely recognition, oxygen, antibiotics when indicated, fluids where appropriate, safe referral) stay highly relevant—adapt to what your facility can safely provide and measure.</p>
<h2>ResusGPS and this course</h2>
<p><strong>ResusGPS</strong> is Paeds Resus&apos;s bedside guidance tool (structured flows, doses, reassessment prompts)—<strong>not a substitute</strong> for your protocol or senior review. After this course, use ResusGPS to walk the <strong>same mental model</strong> you practise here: primary survey first, treat life threats, reassess often, escalate early when the child is not improving. Open the shock / sepsis pathway that matches your scenario and work step by step; if your facility uses a different first-line approach, follow policy and use ResusGPS as a cross-check for doses and missed steps.</p>`,
    25
  );

  const m2 = await ensureModule(
    2,
    "Module 2: First-hour stabilisation",
    "Fluids, antibiotics, monitoring—aligned with principles; volumes and choices follow local protocol.",
    `${DISCLAIMER}
<h2>Principles (not a prescription)</h2>
<p>International guidance stresses <strong>early appropriate antibiotics</strong> when cultures are feasible without unsafe delay, <strong>haemodynamic resuscitation</strong> guided by reassessment, and <strong>escalation</strong> when response is inadequate. <strong>Your facility protocol</strong> defines exact drug choices, bolus sizes, and when to start vasoactive drugs—this module orients you to common themes.</p>
<h2>Fluids: crystalloids, evidence, and pragmatism</h2>
<p>Many international statements <strong>lean toward balanced crystalloids</strong> (e.g. Ringer&apos;s lactate or balanced solutions) rather than <strong>normal saline alone</strong> for resuscitation—yet <strong>saline remains an acceptable alternative</strong> when that is what you have. Brand names and stock vary; <strong>Ringer&apos;s lactate</strong> is often widely available and affordable compared with some balanced brands. <strong>Colloids</strong> are not emphasised as routine first-line plasma expanders in most paediatric sepsis pathways—defer to policy.</p>
<p>Large trials in African children with febrile illness (e.g. <strong>FEAST</strong>) informed cautious fluid strategies in certain populations and presentations. In teaching terms: prefer <strong>small boluses with frequent reassessment</strong> rather than &quot;pouring in fluid&quot; without looking at the child again. If you see <strong>fluid overload</strong> (e.g. gallop, hepatomegaly, crackles, rising work of breathing), <strong>stop bolusing</strong> and escalate per protocol—do not give another bolus just to complete a number.</p>
<h2>A bedside pattern many protocols use (example only)</h2>
<p><strong>Example only—follow your local guideline.</strong> Some teams use a sequence such as: give a crystalloid bolus (often discussed in the range of ~10–20 mL/kg depending on context), <strong>reassess perfusion and breathing</strong>; if shock persists and there is <strong>no sign of fluid overload</strong>, repeat; if still in shock without overload, consider further boluses up to a <strong>cumulative ceiling</strong> your policy sets, then move to second-line therapy if shock continues. If the child is in shock but <strong>shows fluid overload</strong>, <strong>stop boluses</strong> and escalate immediately (referral / inotropic support per protocol).</p>
<h2>Antibiotics</h2>
<p>When sepsis is suspected, <strong>do not delay antibiotics</strong> solely to finish tests. Choose empiric therapy per local guideline and likely source.</p>
<h2>Monitoring &amp; reassessment</h2>
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
