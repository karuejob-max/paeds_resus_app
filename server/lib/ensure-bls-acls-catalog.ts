/**
 * Idempotent: ensures BLS and ACLS course catalogs exist with full cognitive modules
 * and knowledge-check quizzes aligned to AHA 2020 guidelines.
 *
 * Called by:
 *   - seed-bls-acls-courses.ts (manual seed script)
 *   - learning.getCourses when the BLS/ACLS catalog is empty
 *   - isAhaCognitiveComplete (before checking module completion)
 */
import { asc, desc, eq, and, gt } from "drizzle-orm";
import { courses, modules, moduleSections, quizzes, quizQuestions } from "../../drizzle/schema";

// ─────────────────────────────────────────────────────────────────────────────
// BLS CATALOG
// AHA BLS Provider curriculum (2020 guidelines):
//   Module 1: Adult BLS — Recognition & CPR
//   Module 2: Infant & Child BLS
//   Module 3: AED Use & Team Dynamics
//   Module 4: Opioid-Associated Emergencies
// ─────────────────────────────────────────────────────────────────────────────

import { BLS_MODULES } from "./bls-modules-data";

// ─────────────────────────────────────────────────────────────────────────────
// ACLS CATALOG
// AHA ACLS Provider curriculum (2020 guidelines):
//   Module 1: Systematic Approach & BLS Foundation
//   Module 2: Cardiac Arrest Algorithms (VF/pVT, Asystole/PEA)
//   Module 3: Pharmacology in Cardiac Arrest
//   Module 4: Post-Cardiac Arrest Care (ROSC)
//   Module 5: Acute Coronary Syndromes
//   Module 6: Stroke Recognition & Initial Management
//   Module 7: Bradycardia & Tachycardia Algorithms
// ─────────────────────────────────────────────────────────────────────────────

export const ACLS_MODULES = [
  {
    title: "Module 1: Unified Chain of Survival & Systematic Approach",
    description: "Overview of the 2025 Unified Chain of Survival and the ACLS Systematic Approach.",
    content: `
      <h2>The Unified 2025 Chain of Survival</h2>
      <p>The AHA 2025 Guidelines unify the Chain of Survival into a single framework for all ages and settings (Adult, Pediatric, IHCA, and OHCA).</p>
      <ol>
        <li>Activation of Emergency Response</li>
        <li>High-Quality CPR</li>
        <li>Rapid Defibrillation</li>
        <li>Advanced Resuscitation</li>
        <li>Post-Cardiac Arrest Care</li>
        <li>Recovery</li>
      </ol>
      <h2>The BLS Survey (ACLS Context)</h2>
      <p>Before any ACLS intervention, confirm the BLS survey is complete:</p>
      <ul>
        <li>Scene safety, responsiveness, activation of EMS/code team.</li>
        <li>No pulse + no normal breathing → start CPR, attach AED/monitor.</li>
        <li>High-quality CPR: 100–120/min, ≥2 inches depth, full recoil, CCF &gt;80%.</li>
      </ul>
      <h2>The ACLS Primary Survey (H-A-B-C-D)</h2>
      <ul>
        <li><strong>H — History:</strong> Brief history, last known well, medications, allergies.</li>
        <li><strong>A — Airway:</strong> Open and maintain airway. Consider advanced airway (ETT, LMA) if BVM ineffective.</li>
        <li><strong>B — Breathing:</strong> Confirm bilateral breath sounds. Waveform capnography (ETCO₂) target: 10–20 mmHg during CPR; ≥35–40 mmHg suggests ROSC.</li>
        <li><strong>C — Circulation:</strong> IV/IO access, cardiac monitoring, rhythm analysis, defibrillation if indicated.</li>
        <li><strong>D — Differential Diagnosis:</strong> Identify and treat reversible causes (H's and T's).</li>
      </ul>
      <h2>H's and T's (Reversible Causes)</h2>
      <p>Hypovolemia, Hypoxia, Hydrogen ion (acidosis), Hypo/Hyperkalemia, Hypothermia | Tension pneumothorax, Tamponade (cardiac), Toxins, Thrombosis (pulmonary/coronary).</p>
    `,
    duration: 40,
    order: 1,
    sections: [],
    quiz: {
      title: "Knowledge Check: Systematic Approach",
      passingScore: 84,
      questions: [
        {
          question: "During CPR, an ETCO₂ reading of ≥35–40 mmHg most likely indicates:",
          options: ["Inadequate compressions", "Return of spontaneous circulation (ROSC)", "Hyperventilation", "Correct ETT placement only"],
          correctAnswer: "Return of spontaneous circulation (ROSC)",
          explanation: "A sudden increase in ETCO₂ to ≥35–40 mmHg during CPR is a strong indicator of ROSC.",
        },
        {
          question: "Which of the following is NOT one of the H's in the H's and T's of reversible causes?",
          options: ["Hypovolemia", "Hypoxia", "Hypertension", "Hypothermia"],
          correctAnswer: "Hypertension",
          explanation: "The H's are: Hypovolemia, Hypoxia, Hydrogen ion (acidosis), Hypo/Hyperkalemia, Hypothermia. Hypertension is not included.",
        },
      ],
    },
  },
  {
    title: "Module 2: Cardiac Arrest Algorithms — Shockable & Non-Shockable",
    description: "Apply the VF/pVT and Asystole/PEA algorithms with correct timing and interventions.",
    content: `
      <h2>Shockable Rhythms: VF / Pulseless VT (pVT)</h2>
      <ol>
        <li>Confirm pulseless VF/pVT on monitor.</li>
        <li>Deliver <strong>unsynchronized shock</strong>: Biphasic 120–200 J (device-specific); Monophasic 360 J.</li>
        <li>Immediately resume CPR for <strong>2 minutes</strong> — do not check pulse immediately after shock.</li>
        <li>After 2 minutes: rhythm check. If VF/pVT persists: shock again.</li>
        <li>After the 2nd shock: establish IV/IO, give <strong>Epinephrine 1 mg IV/IO every 3–5 minutes</strong>.</li>
        <li>After the 3rd shock: give <strong>Amiodarone 300 mg IV/IO</strong> (or Lidocaine 1–1.5 mg/kg). Second dose amiodarone: 150 mg.</li>
      </ol>
      <h2>Non-Shockable Rhythms: Asystole / PEA</h2>
      <ol>
        <li>Confirm asystole or PEA (organized rhythm, no pulse).</li>
        <li>Resume CPR immediately.</li>
        <li>Establish IV/IO access.</li>
        <li>Give <strong>Epinephrine 1 mg IV/IO every 3–5 minutes</strong> as soon as possible.</li>
        <li>Identify and treat reversible causes (H's and T's).</li>
        <li>Rhythm check every 2 minutes.</li>
      </ol>
      <h2>Timing Discipline</h2>
      <p>Each CPR cycle is exactly <strong>2 minutes</strong>. Rhythm checks and pulse checks must be brief (&lt;10 seconds). Drug delivery should not interrupt compressions.</p>
    `,
    duration: 50,
    order: 2,
    sections: [],
    quiz: {
      title: "Knowledge Check: Cardiac Arrest Algorithms",
      passingScore: 84,
      questions: [
        {
          question: "After delivering the first shock for VF, what is the immediate next step?",
          options: [
            "Check the pulse",
            "Give Epinephrine 1 mg IV",
            "Immediately resume CPR for 2 minutes",
            "Reanalyze the rhythm",
          ],
          correctAnswer: "Immediately resume CPR for 2 minutes",
          explanation: "After a shock, immediately resume CPR for 2 minutes before the next rhythm check. Do not check the pulse immediately after a shock.",
        },
        {
          question: "When is the first dose of Epinephrine given in the VF/pVT algorithm?",
          options: [
            "Before the first shock",
            "After the first shock, before the second shock",
            "After the second shock",
            "Only if VF persists after 3 shocks",
          ],
          correctAnswer: "After the second shock",
          explanation: "In the VF/pVT algorithm, Epinephrine 1 mg IV/IO is first given after the second shock (during the 2-minute CPR cycle).",
        },
        {
          question: "What is the first antiarrhythmic drug given for refractory VF/pVT (after the 3rd shock)?",
          options: ["Lidocaine 1 mg/kg", "Amiodarone 300 mg", "Magnesium sulfate 2 g", "Procainamide 30 mg/min"],
          correctAnswer: "Amiodarone 300 mg",
          explanation: "Amiodarone 300 mg IV/IO is the first-line antiarrhythmic for VF/pVT refractory to 3 shocks. Lidocaine is an alternative.",
        },
        {
          question: "For a patient in PEA, what is the most important intervention alongside CPR?",
          options: [
            "Immediate defibrillation",
            "Synchronized cardioversion",
            "Identify and treat reversible causes (H's and T's)",
            "Administer Amiodarone",
          ],
          correctAnswer: "Identify and treat reversible causes (H's and T's)",
          explanation: "PEA is almost always caused by a reversible condition. Identifying and treating the underlying cause is the key intervention.",
        },
      ],
    },
  },
  {
    title: "Module 3: ACLS Pharmacology",
    description: "Know the indications, doses, and mechanisms of key ACLS medications.",
    content: `
      <h2>Epinephrine (Adrenaline)</h2>
      <ul>
        <li><strong>Indication:</strong> All cardiac arrest rhythms (VF, pVT, Asystole, PEA).</li>
        <li><strong>Dose:</strong> 1 mg IV/IO every 3–5 minutes.</li>
        <li><strong>Mechanism:</strong> Alpha-1 agonist — increases coronary and cerebral perfusion pressure during CPR.</li>
      </ul>
      <h2>Amiodarone</h2>
      <ul>
        <li><strong>Indication:</strong> VF/pVT refractory to 3 shocks.</li>
        <li><strong>Dose:</strong> 300 mg IV/IO bolus; second dose 150 mg if needed.</li>
        <li><strong>Note:</strong> Prolongs QT interval. Monitor for hypotension post-ROSC.</li>
      </ul>
      <h2>Lidocaine (Alternative to Amiodarone)</h2>
      <ul>
        <li><strong>Indication:</strong> VF/pVT if amiodarone unavailable.</li>
        <li><strong>Dose:</strong> 1–1.5 mg/kg IV/IO; second dose 0.5–0.75 mg/kg. Maximum cumulative: 3 mg/kg.</li>
      </ul>
      <h2>Adenosine</h2>
      <ul>
        <li><strong>Indication:</strong> Stable regular narrow-complex SVT.</li>
        <li><strong>Dose:</strong> 6 mg rapid IV push; if no conversion: 12 mg (may repeat 12 mg once).</li>
        <li><strong>Technique:</strong> Rapid IV push followed immediately by 20 mL saline flush.</li>
      </ul>
      <h2>Atropine</h2>
      <ul>
        <li><strong>Indication:</strong> Symptomatic bradycardia (not for asystole or PEA).</li>
        <li><strong>Dose:</strong> 0.5 mg IV every 3–5 minutes; maximum 3 mg.</li>
      </ul>
      <h2>Magnesium Sulfate</h2>
      <ul>
        <li><strong>Indication:</strong> Torsades de Pointes (polymorphic VT with prolonged QT).</li>
        <li><strong>Dose:</strong> 1–2 g IV/IO over 15 minutes (diluted in 10 mL D5W).</li>
      </ul>
    `,
    duration: 45,
    order: 3,
    sections: [],
    quiz: {
      title: "Knowledge Check: ACLS Pharmacology",
      passingScore: 84,
      questions: [
        {
          question: "What is the correct dose and frequency of Epinephrine during cardiac arrest?",
          options: ["0.5 mg IV every 5 minutes", "1 mg IV/IO every 3–5 minutes", "2 mg IV every 10 minutes", "1 mg IV once only"],
          correctAnswer: "1 mg IV/IO every 3–5 minutes",
          explanation: "Epinephrine 1 mg IV/IO is given every 3–5 minutes throughout cardiac arrest for all rhythms.",
        },
        {
          question: "What is the maximum cumulative dose of Lidocaine in cardiac arrest?",
          options: ["1 mg/kg", "2 mg/kg", "3 mg/kg", "5 mg/kg"],
          correctAnswer: "3 mg/kg",
          explanation: "The maximum cumulative dose of Lidocaine in cardiac arrest is 3 mg/kg.",
        },
        {
          question: "Which drug is indicated for Torsades de Pointes?",
          options: ["Amiodarone 300 mg", "Adenosine 6 mg", "Magnesium Sulfate 1–2 g", "Atropine 0.5 mg"],
          correctAnswer: "Magnesium Sulfate 1–2 g",
          explanation: "Magnesium Sulfate 1–2 g IV/IO is the drug of choice for Torsades de Pointes (polymorphic VT with prolonged QT).",
        },
        {
          question: "For stable SVT, what is the correct technique for Adenosine administration?",
          options: [
            "Slow IV infusion over 5 minutes",
            "Rapid IV push followed immediately by 20 mL saline flush",
            "IM injection into the deltoid",
            "Sublingual tablet",
          ],
          correctAnswer: "Rapid IV push followed immediately by 20 mL saline flush",
          explanation: "Adenosine has a very short half-life (~10 seconds). It must be given as a rapid IV push immediately followed by a 20 mL saline flush.",
        },
      ],
    },
  },
  {
    title: "Module 4: Post-Cardiac Arrest Care (Post-ROSC)",
    description: "Manage the post-ROSC patient to optimize survival and neurological outcomes.",
    content: `
      <h2>Immediate Post-ROSC Priorities</h2>
      <ol>
        <li><strong>Airway:</strong> If not already intubated, consider advanced airway. Confirm placement with waveform capnography.</li>
        <li><strong>Breathing:</strong> Titrate FiO₂ to SpO₂ 94–98%. Avoid hyperoxia (SpO₂ &gt;98%). Ventilate to ETCO₂ 35–45 mmHg (PaCO₂ 35–45 mmHg). Avoid hyperventilation.</li>
        <li><strong>Circulation:</strong> Target MAP ≥65 mmHg. IV fluid bolus if hypotensive. Vasopressors (Norepinephrine/Dopamine) if needed. 12-lead ECG immediately — activate cath lab if STEMI.</li>
        <li><strong>Disability:</strong> Assess neurological status (GCS). Treat seizures aggressively.</li>
        <li><strong>Temperature:</strong> Targeted Temperature Management (TTM): maintain 32–36°C for at least 24 hours in comatose survivors. Actively prevent fever (T &gt;37.5°C).</li>
      </ol>
      <h2>Coronary Angiography</h2>
      <p>Emergent coronary angiography is recommended for ROSC patients with STEMI. For non-STEMI patients, angiography may be performed but timing is individualized.</p>
      <h2>Prognostication</h2>
      <p>Do not make prognostication decisions within the first 72 hours post-arrest. Allow time for neurological recovery and TTM effects to resolve.</p>
    `,
    duration: 40,
    order: 4,
    sections: [],
    quiz: {
      title: "Knowledge Check: Post-ROSC Care",
      passingScore: 84,
      questions: [
        {
          question: "What is the target SpO₂ range in the immediate post-ROSC period?",
          options: ["88–92%", "94–98%", "99–100%", "Any SpO₂ above 90%"],
          correctAnswer: "94–98%",
          explanation: "Target SpO₂ 94–98% post-ROSC. Hyperoxia (SpO₂ >98%) is harmful and should be avoided.",
        },
        {
          question: "What is the target temperature range for Targeted Temperature Management (TTM)?",
          options: ["28–32°C", "32–36°C", "36–38°C", "37–38°C"],
          correctAnswer: "32–36°C",
          explanation: "TTM targets a constant temperature between 32°C and 36°C for at least 24 hours in comatose post-arrest survivors.",
        },
        {
          question: "When should prognostication decisions be made after cardiac arrest?",
          options: [
            "Within 24 hours of ROSC",
            "Within 48 hours of ROSC",
            "Not before 72 hours post-arrest",
            "Immediately if GCS is 3",
          ],
          correctAnswer: "Not before 72 hours post-arrest",
          explanation: "Prognostication should not be made within the first 72 hours to allow for neurological recovery and TTM effects to resolve.",
        },
      ],
    },
  },
  {
    title: "Module 5: Acute Coronary Syndromes (ACS)",
    description: "Recognize and initiate management of STEMI and NSTEMI/UA.",
    content: `
      <h2>ACS Recognition</h2>
      <p>ACS includes: STEMI, NSTEMI, and Unstable Angina (UA). Classic presentation: chest pain/pressure, diaphoresis, nausea, radiation to arm/jaw. Atypical presentations (especially in women, elderly, diabetics): dyspnea, fatigue, epigastric pain.</p>
      <h2>Initial Management (MONA-B)</h2>
      <ul>
        <li><strong>M — Monitor:</strong> 12-lead ECG within 10 minutes of first medical contact. Continuous cardiac monitoring.</li>
        <li><strong>O — Oxygen:</strong> Only if SpO₂ &lt;90%. Avoid routine oxygen in normoxic patients.</li>
        <li><strong>N — Nitrates:</strong> Sublingual nitroglycerin 0.4 mg every 5 minutes (max 3 doses) for ongoing pain. Contraindicated if SBP &lt;90 mmHg, recent PDE5 inhibitor use, or RV infarction.</li>
        <li><strong>A — Aspirin:</strong> 162–325 mg chewed immediately.</li>
        <li><strong>B — Beta-blocker:</strong> Oral beta-blocker within 24 hours if no contraindications (HF, low output, bradycardia, reactive airway disease).</li>
      </ul>
      <h2>STEMI Reperfusion</h2>
      <p>Goal: Primary PCI within 90 minutes of first medical contact (door-to-balloon). If PCI not available within 120 minutes: fibrinolysis within 30 minutes (door-to-needle).</p>
    `,
    duration: 40,
    order: 5,
    sections: [],
    quiz: {
      title: "Knowledge Check: ACS",
      passingScore: 84,
      questions: [
        {
          question: "What is the target door-to-balloon time for primary PCI in STEMI?",
          options: ["60 minutes", "90 minutes", "120 minutes", "30 minutes"],
          correctAnswer: "90 minutes",
          explanation: "The AHA target for primary PCI in STEMI is ≤90 minutes from first medical contact.",
        },
        {
          question: "Routine supplemental oxygen in a normoxic ACS patient (SpO₂ ≥90%) is:",
          options: [
            "Recommended to protect the myocardium",
            "Not recommended — may be harmful",
            "Required for all ACS patients",
            "Only given if the patient is in pain",
          ],
          correctAnswer: "Not recommended — may be harmful",
          explanation: "Routine oxygen in normoxic ACS patients is not recommended and may increase infarct size. Give O₂ only if SpO₂ <90%.",
        },
      ],
    },
  },
  {
    title: "Module 6: Stroke Recognition & Initial Management",
    description: "Apply the Cincinnati Prehospital Stroke Scale and initiate the stroke chain of survival.",
    content: `
      <h2>Stroke Recognition: BE-FAST</h2>
      <ul>
        <li><strong>B — Balance:</strong> Sudden loss of balance or coordination.</li>
        <li><strong>E — Eyes:</strong> Sudden vision changes.</li>
        <li><strong>F — Face:</strong> Facial drooping (ask patient to smile).</li>
        <li><strong>A — Arm:</strong> Arm weakness (ask patient to raise both arms).</li>
        <li><strong>S — Speech:</strong> Speech difficulty (ask patient to repeat a phrase).</li>
        <li><strong>T — Time:</strong> Time of symptom onset. Call EMS immediately.</li>
      </ul>
      <h2>Stroke Chain of Survival</h2>
      <ol>
        <li>Recognition and activation of EMS.</li>
        <li>Dispatch and rapid EMS response.</li>
        <li>Rapid transport to stroke center.</li>
        <li>Rapid hospital diagnosis (CT scan within 25 minutes of arrival).</li>
        <li>Fibrinolysis (tPA) within 60 minutes of arrival (door-to-needle) if eligible.</li>
        <li>Post-stroke management and rehabilitation.</li>
      </ol>
      <h2>tPA Eligibility</h2>
      <p>tPA (Alteplase) is indicated for ischemic stroke within <strong>3–4.5 hours</strong> of symptom onset in eligible patients. Contraindications include hemorrhagic stroke, recent surgery, active bleeding, and BP &gt;185/110 mmHg (not controlled).</p>
    `,
    duration: 35,
    order: 6,
    sections: [],
    quiz: {
      title: "Knowledge Check: Stroke",
      passingScore: 84,
      questions: [
        {
          question: "What does the 'T' in BE-FAST stand for?",
          options: ["Temperature", "Time of symptom onset", "Tongue deviation", "Tremor"],
          correctAnswer: "Time of symptom onset",
          explanation: "T = Time. Documenting the exact time of symptom onset is critical for determining tPA eligibility.",
        },
        {
          question: "What is the maximum time window for tPA administration in eligible ischemic stroke patients?",
          options: ["1 hour", "2 hours", "3–4.5 hours", "6 hours"],
          correctAnswer: "3–4.5 hours",
          explanation: "tPA (Alteplase) can be given up to 3–4.5 hours from symptom onset in eligible ischemic stroke patients.",
        },
      ],
    },
  },
  {
    title: "Module 7: Bradycardia & Tachycardia Algorithms",
    description: "Manage symptomatic bradycardia and stable/unstable tachycardia using the correct algorithm.",
    content: `
      <h2>Symptomatic Bradycardia (HR &lt;60 bpm with symptoms)</h2>
      <p>Symptoms: hypotension, altered consciousness, signs of shock, ischemic chest discomfort, acute HF.</p>
      <ol>
        <li>Maintain patent airway, give O₂ if SpO₂ &lt;94%.</li>
        <li>IV access, 12-lead ECG, identify cause.</li>
        <li><strong>Atropine 0.5 mg IV</strong> (first-line). Repeat every 3–5 min to max 3 mg.</li>
        <li>If atropine ineffective: <strong>Transcutaneous pacing</strong> (TCP) or <strong>Dopamine 2–20 mcg/kg/min</strong> or <strong>Epinephrine 2–10 mcg/min</strong> infusion.</li>
        <li>Consider transvenous pacing for high-degree AV block.</li>
      </ol>
      <h2>Tachycardia with Pulse</h2>
      <p><strong>Unstable (hypotension, altered consciousness, signs of shock):</strong> Synchronized cardioversion immediately.</p>
      <p><strong>Stable:</strong> Assess QRS width.</p>
      <ul>
        <li><strong>Narrow QRS (&lt;0.12 s) — Regular:</strong> Vagal maneuvers → Adenosine 6 mg IV → 12 mg → rate control (beta-blocker/CCB).</li>
        <li><strong>Narrow QRS — Irregular:</strong> AF/flutter → rate control (beta-blocker/CCB/digoxin) → anticoagulation.</li>
        <li><strong>Wide QRS (&gt;0.12 s) — Regular:</strong> Assume VT → Amiodarone 150 mg IV over 10 min → synchronized cardioversion if unstable.</li>
        <li><strong>Wide QRS — Irregular:</strong> Possible AF with aberrancy or pre-excitation → expert consultation.</li>
      </ul>
    `,
    duration: 45,
    order: 7,
    sections: [],
    quiz: {
      title: "Knowledge Check: Bradycardia & Tachycardia",
      passingScore: 84,
      questions: [
        {
          question: "What is the first-line drug for symptomatic bradycardia?",
          options: ["Epinephrine 1 mg IV", "Dopamine 5 mcg/kg/min", "Atropine 0.5 mg IV", "Amiodarone 150 mg IV"],
          correctAnswer: "Atropine 0.5 mg IV",
          explanation: "Atropine 0.5 mg IV is the first-line drug for symptomatic bradycardia. Maximum total dose is 3 mg.",
        },
        {
          question: "A patient with stable, regular narrow-complex tachycardia (SVT) does not respond to vagal maneuvers. What is the next step?",
          options: [
            "Synchronized cardioversion at 50 J",
            "Adenosine 6 mg rapid IV push",
            "Amiodarone 150 mg IV over 10 minutes",
            "Defibrillation at 200 J",
          ],
          correctAnswer: "Adenosine 6 mg rapid IV push",
          explanation: "For stable SVT unresponsive to vagal maneuvers, Adenosine 6 mg rapid IV push is the next step.",
        },
        {
          question: "An unstable patient with a wide-complex tachycardia and a pulse should receive:",
          options: [
            "Amiodarone 300 mg IV bolus",
            "Unsynchronized defibrillation",
            "Synchronized cardioversion",
            "Adenosine 12 mg IV",
          ],
          correctAnswer: "Synchronized cardioversion",
          explanation: "Any unstable tachycardia with a pulse (regardless of QRS width) should be treated with synchronized cardioversion.",
        },
      ],
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Ensure a single course catalog (BLS or ACLS)
// ─────────────────────────────────────────────────────────────────────────────
async function ensureCatalog(
  db: any,
  programType: "bls" | "acls",
  courseTitle: string,
  courseDescription: string,
  courseDuration: number,
  courseLevel: "beginner" | "intermediate" | "advanced",
  moduleDefinitions: typeof BLS_MODULES
): Promise<void> {
  // Prefer an existing row that already has modules (ignore empty duplicate test rows).
  const existing = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.programType, programType))
    .orderBy(asc(courses.id));

  let courseId: number | undefined;
  for (const row of existing) {
    const mod = await db
      .select({ id: modules.id })
      .from(modules)
      .where(eq(modules.courseId, row.id))
      .limit(1);
    if (mod.length > 0) {
      courseId = row.id;
      break;
    }
  }
  if (courseId == null && existing.length > 0) {
    courseId = existing[0].id;
  }

  if (courseId == null) {
    await db.insert(courses).values({
      title: courseTitle,
      description: courseDescription,
      programType,
      duration: courseDuration,
      level: courseLevel,
      order: programType === "bls" ? 1 : 2,
    });
    const row = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.programType, programType))
      .orderBy(desc(courses.id))
      .limit(1);
    courseId = row[0]!.id;
    console.log(`[Catalog] Created ${programType.toUpperCase()} course (id=${courseId})`);
  }

  if (courseId == null) {
    throw new Error(`Failed to resolve ${programType.toUpperCase()} course catalog row`);
  }

  // Delete modules that are no longer in the definition
  const maxOrder = Math.max(...moduleDefinitions.map(m => m.order));
  await db.delete(modules).where(and(eq(modules.courseId, courseId), gt(modules.order, maxOrder)));

  // Ensure each module
  for (const modDef of moduleDefinitions) {
    const modExisting = await db
      .select({ id: modules.id })
      .from(modules)
      .where(and(eq(modules.courseId, courseId), eq(modules.order, modDef.order)))
      .limit(1);

    let moduleId: number;
    if (modExisting.length > 0) {
      moduleId = modExisting[0].id;
      // Update existing module to ensure latest content/description
      await db.update(modules)
        .set({
          title: modDef.title,
          description: modDef.description,
          content: modDef.content || "",
          duration: modDef.duration,
        })
        .where(eq(modules.id, moduleId));
    } else {
      await db.insert(modules).values({
        courseId,
        title: modDef.title,
        description: modDef.description,
        content: modDef.content || "",
        duration: modDef.duration,
        order: modDef.order,
      });
      const m = await db
        .select({ id: modules.id })
        .from(modules)
        .where(and(eq(modules.courseId, courseId), eq(modules.order, modDef.order)))
        .orderBy(desc(modules.id))
        .limit(1);
      moduleId = m[0]!.id;
      console.log(`[Catalog] Created module: ${modDef.title} (id=${moduleId})`);
    }

	    // Ensure sections if present
	    if (modDef.sections && modDef.sections.length > 0) {
	      for (const section of modDef.sections) {
	        const existing = await db
	          .select({ id: moduleSections.id })
	          .from(moduleSections)
	          .where(and(eq(moduleSections.moduleId, moduleId), eq(moduleSections.order, section.order)))
	          .limit(1);

	        if (existing.length > 0) {
	          await db.update(moduleSections)
	            .set({
	              title: section.title,
	              content: section.content,
	            })
	            .where(eq(moduleSections.id, existing[0].id));
	        } else {
	          await db.insert(moduleSections).values({
	            moduleId,
	            title: section.title,
	            content: section.content,
	            order: section.order,
	          });
	        }
	      }
	      console.log(`[Catalog] Synchronized ${modDef.sections.length} sections for module: ${modDef.title}`);
	    }

    // Ensure the quiz for this module
    const quizExisting = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.moduleId, moduleId))
      .limit(1);

    let quizId: number;
    if (quizExisting.length > 0) {
      quizId = quizExisting[0].id;
      await db.update(quizzes)
        .set({
          title: modDef.quiz.title,
          description: `Knowledge check for ${modDef.title}`,
          passingScore: modDef.quiz.passingScore,
        })
        .where(eq(quizzes.id, quizId));
    } else {
      await db.insert(quizzes).values({
        moduleId,
        title: modDef.quiz.title,
        description: `Knowledge check for ${modDef.title}`,
        passingScore: modDef.quiz.passingScore,
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

	    // Ensure questions
	    const qCount = await db
	      .select({ id: quizQuestions.id })
	      .from(quizQuestions)
	      .where(eq(quizQuestions.quizId, quizId))
	      .limit(1);

	    for (let i = 0; i < modDef.quiz.questions.length; i++) {
	      const q = modDef.quiz.questions[i];
	      const qOrder = (q as any).order || i + 1;
	      const existingQ = await db
	        .select({ id: quizQuestions.id })
	        .from(quizQuestions)
	        .where(and(eq(quizQuestions.quizId, quizId), eq(quizQuestions.order, qOrder)))
	        .limit(1);

	      const values = {
	        quizId,
	        question: q.question || (q as any).questionText,
	        questionType: "multiple_choice",
	        options: typeof q.options === "string" ? q.options : JSON.stringify(q.options),
	        correctAnswer: typeof q.correctAnswer === "string" ? q.correctAnswer : JSON.stringify(q.correctAnswer),
	        explanation: q.explanation,
	        order: qOrder,
	      };

	      if (existingQ.length > 0) {
	        await db.update(quizQuestions).set(values).where(eq(quizQuestions.id, existingQ[0].id));
	      } else {
	        await db.insert(quizQuestions).values(values);
	      }
	    }
	    console.log(`[Catalog] Synchronized ${modDef.quiz.questions.length} questions for quiz: ${modDef.quiz.title}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

export async function ensureBlsCatalog(db: any): Promise<void> {
  await ensureCatalog(
    db,
    "bls",
    "BLS Provider Course — AHA 2025 Guidelines",
    "American Heart Association Basic Life Support (BLS) Provider Course. Deeply enriched with 2025 Unified Chain of Survival, Heartsaver-level accessibility, healthcare-provider depth, and advanced life-saving skills.",
    350,
    "intermediate",
    BLS_MODULES
  );
}

export async function ensureAclsCatalog(db: any): Promise<void> {
  await ensureCatalog(
    db,
    "acls",
    "ACLS Provider Course — AHA 2025 Guidelines",
    "American Heart Association Advanced Cardiovascular Life Support (ACLS) Provider Course. Fully updated to 2025 guidelines including the Unified Chain of Survival and Post-Cardiac Arrest Care neuro-protection protocols.",
    480,
    "advanced",
    ACLS_MODULES
  );
}
