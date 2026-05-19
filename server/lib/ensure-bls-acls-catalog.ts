/**
 * Idempotent: ensures BLS and ACLS course catalogs exist with full cognitive modules
 * and knowledge-check quizzes aligned to AHA 2020 guidelines.
 *
 * Called by:
 *   - seed-bls-acls-courses.ts (manual seed script)
 *   - learning.getCourses when the BLS/ACLS catalog is empty
 *   - isAhaCognitiveComplete (before checking module completion)
 */
import { desc, eq, and } from "drizzle-orm";
import { courses, modules, quizzes, quizQuestions } from "../../drizzle/schema";

// ─────────────────────────────────────────────────────────────────────────────
// BLS CATALOG
// AHA BLS Provider curriculum (2020 guidelines):
//   Module 1: Adult BLS — Recognition & CPR
//   Module 2: Infant & Child BLS
//   Module 3: AED Use & Team Dynamics
//   Module 4: Opioid-Associated Emergencies
// ─────────────────────────────────────────────────────────────────────────────

const BLS_MODULES = [
  {
    title: "Module 1: Adult BLS — Recognition & High-Quality CPR",
    description: "Recognize cardiac arrest, activate EMS, and deliver high-quality CPR for adults.",
    content: `
      <h2>Recognizing Cardiac Arrest</h2>
      <p>Cardiac arrest is identified by the absence of a normal pulse and absence of normal breathing (no breathing or only gasping). Immediately activate your emergency response system and retrieve an AED.</p>
      <h2>High-Quality CPR — Adult</h2>
      <ul>
        <li><strong>Rate:</strong> 100–120 compressions per minute.</li>
        <li><strong>Depth:</strong> At least 2 inches (5 cm), not exceeding 2.4 inches (6 cm).</li>
        <li><strong>Recoil:</strong> Allow full chest recoil between compressions. Do not lean on the chest.</li>
        <li><strong>Interruptions:</strong> Minimize interruptions. Target a chest compression fraction (CCF) &gt;80%.</li>
        <li><strong>Ventilation:</strong> Avoid excessive ventilation. 30 compressions : 2 breaths (1-rescuer or 2-rescuer without advanced airway). With advanced airway: 1 breath every 6 seconds (10 breaths/min) asynchronously.</li>
      </ul>
      <h2>Compression-Only CPR</h2>
      <p>Untrained bystanders should perform compression-only CPR. Trained rescuers should provide both compressions and ventilations.</p>
      <h2>Switching Roles</h2>
      <p>Switch compressor every 2 minutes (or sooner if fatigued) to maintain compression quality. Minimize the pause during the switch to &lt;10 seconds.</p>
    `,
    duration: 45,
    order: 1,
    quiz: {
      title: "Knowledge Check: Adult BLS",
      passingScore: 84,
      questions: [
        {
          question: "What is the recommended compression rate for adult BLS?",
          options: ["60–80 per minute", "80–100 per minute", "100–120 per minute", "120–140 per minute"],
          correctAnswer: "100–120 per minute",
          explanation: "AHA 2020 guidelines specify 100–120 compressions per minute for all ages.",
        },
        {
          question: "What is the recommended compression depth for an adult?",
          options: ["At least 1 inch", "At least 1.5 inches", "At least 2 inches (5 cm)", "At least 3 inches"],
          correctAnswer: "At least 2 inches (5 cm)",
          explanation: "Adult compression depth should be at least 2 inches (5 cm) but not more than 2.4 inches (6 cm).",
        },
        {
          question: "With an advanced airway in place, what is the correct ventilation rate during CPR?",
          options: ["1 breath every 2 seconds", "1 breath every 6 seconds", "2 breaths every 30 compressions", "1 breath every 10 seconds"],
          correctAnswer: "1 breath every 6 seconds",
          explanation: "With an advanced airway, deliver 1 breath every 6 seconds (10 breaths/min) asynchronously with compressions.",
        },
        {
          question: "What is the recommended compression-to-ventilation ratio for 2-rescuer adult BLS WITHOUT an advanced airway?",
          options: ["15:2", "30:2", "30:1", "15:1"],
          correctAnswer: "30:2",
          explanation: "For adult BLS without an advanced airway, the ratio is 30:2 regardless of the number of rescuers.",
        },
        {
          question: "How often should compressors switch roles during prolonged CPR?",
          options: ["Every 5 minutes", "Every 2 minutes", "Every 10 compressions", "Only when fatigued"],
          correctAnswer: "Every 2 minutes",
          explanation: "Switch compressors every 2 minutes (or every 5 cycles) to prevent fatigue and maintain compression quality.",
        },
      ],
    },
  },
  {
    title: "Module 2: Infant & Child BLS",
    description: "Recognize and manage cardiac arrest in infants (< 1 year) and children (1 year to puberty).",
    content: `
      <h2>Key Differences: Pediatric vs. Adult BLS</h2>
      <p>Pediatric cardiac arrests are most commonly caused by respiratory failure, not primary cardiac events. Early, high-quality ventilation is therefore critical.</p>
      <h2>Compression Technique</h2>
      <ul>
        <li><strong>Infant (< 1 year):</strong> 2-finger technique (1 rescuer) or 2-thumb encircling hands technique (2 rescuers). Depth: at least 1.5 inches (4 cm).</li>
        <li><strong>Child (1 year to puberty):</strong> 1 or 2 hands on the lower half of the sternum. Depth: at least 2 inches (5 cm).</li>
      </ul>
      <h2>Compression-to-Ventilation Ratio</h2>
      <ul>
        <li><strong>1 rescuer (any age):</strong> 30:2</li>
        <li><strong>2 rescuers (infant/child):</strong> 15:2</li>
        <li><strong>With advanced airway:</strong> 1 breath every 2–3 seconds (20–30 breaths/min) asynchronously.</li>
      </ul>
      <h2>Activation Sequence</h2>
      <p>For a witnessed collapse in a child: activate EMS first, then begin CPR. For an unwitnessed collapse or respiratory arrest: provide 2 minutes of CPR first, then activate EMS (if alone).</p>
      <h2>Pulse Check</h2>
      <p>Infant: brachial artery. Child: carotid or femoral artery. Spend no more than 10 seconds on a pulse check.</p>
    `,
    duration: 45,
    order: 2,
    quiz: {
      title: "Knowledge Check: Infant & Child BLS",
      passingScore: 84,
      questions: [
        {
          question: "What is the correct compression-to-ventilation ratio for 2-rescuer infant/child CPR WITHOUT an advanced airway?",
          options: ["30:2", "15:2", "15:1", "30:1"],
          correctAnswer: "15:2",
          explanation: "2-rescuer pediatric CPR uses a 15:2 ratio. 1-rescuer uses 30:2.",
        },
        {
          question: "Where is the pulse checked in an infant?",
          options: ["Carotid artery", "Radial artery", "Brachial artery", "Femoral artery"],
          correctAnswer: "Brachial artery",
          explanation: "In infants, the brachial artery (inner upper arm) is used for pulse checks.",
        },
        {
          question: "What is the recommended compression depth for a child (1 year to puberty)?",
          options: ["At least 1 inch", "At least 1.5 inches", "At least 2 inches (5 cm)", "At least 2.5 inches"],
          correctAnswer: "At least 2 inches (5 cm)",
          explanation: "Child compression depth should be at least 2 inches (5 cm), approximately one-third the depth of the chest.",
        },
        {
          question: "For an unwitnessed cardiac arrest in a child when you are alone, what is the correct sequence?",
          options: [
            "Call EMS first, then start CPR",
            "Start CPR for 2 minutes, then call EMS",
            "Start CPR and call EMS simultaneously",
            "Give 5 rescue breaths, then call EMS",
          ],
          correctAnswer: "Start CPR for 2 minutes, then call EMS",
          explanation: "For unwitnessed pediatric arrest when alone, provide 2 minutes of CPR before leaving to activate EMS.",
        },
        {
          question: "With an advanced airway in a child, what is the correct ventilation rate?",
          options: ["1 breath every 6 seconds (10/min)", "1 breath every 2–3 seconds (20–30/min)", "2 breaths every 30 compressions", "1 breath every 5 seconds (12/min)"],
          correctAnswer: "1 breath every 2–3 seconds (20–30/min)",
          explanation: "Pediatric ventilation with an advanced airway: 1 breath every 2–3 seconds (20–30/min), asynchronous with compressions.",
        },
      ],
    },
  },
  {
    title: "Module 3: AED Use & Team Dynamics",
    description: "Operate an AED safely and effectively, and understand high-performance team roles.",
    content: `
      <h2>AED Operation</h2>
      <ol>
        <li>Power on the AED.</li>
        <li>Attach pads to the patient's bare, dry chest (right clavicle / left axilla).</li>
        <li>Clear the patient and allow the AED to analyze the rhythm.</li>
        <li>If shock advised: clear all rescuers and deliver the shock.</li>
        <li>Immediately resume CPR starting with compressions after the shock.</li>
      </ol>
      <h2>Pediatric AED Use</h2>
      <ul>
        <li>Use pediatric pads or a pediatric dose attenuator for children &lt; 8 years / &lt; 25 kg if available.</li>
        <li>If pediatric pads are unavailable, use adult pads — ensure pads do not touch each other.</li>
        <li>AED may be used for infants if no manual defibrillator is available.</li>
      </ul>
      <h2>High-Performance Team Roles</h2>
      <ul>
        <li><strong>Team Leader:</strong> Assigns roles, monitors quality, makes decisions.</li>
        <li><strong>Compressor:</strong> Delivers high-quality compressions, switches every 2 minutes.</li>
        <li><strong>Airway Manager:</strong> Maintains airway, delivers ventilations.</li>
        <li><strong>IV/IO Access:</strong> Establishes access, prepares and administers medications.</li>
        <li><strong>Recorder:</strong> Documents interventions, times, medications.</li>
      </ul>
      <h2>Closed-Loop Communication</h2>
      <p>All orders should be acknowledged verbally by the recipient. The recorder reads back drug doses and times. The team leader summarizes the situation at each rhythm check.</p>
    `,
    duration: 40,
    order: 3,
    quiz: {
      title: "Knowledge Check: AED & Team Dynamics",
      passingScore: 84,
      questions: [
        {
          question: "Immediately after delivering an AED shock, what should the team do?",
          options: [
            "Check the pulse for 10 seconds",
            "Wait for the AED to reanalyze",
            "Immediately resume CPR starting with compressions",
            "Check the rhythm on a monitor",
          ],
          correctAnswer: "Immediately resume CPR starting with compressions",
          explanation: "After a shock, immediately resume CPR — do not wait for a pulse check. The next rhythm check is after 2 minutes of CPR.",
        },
        {
          question: "For a child under 8 years, which AED pads should be used if available?",
          options: ["Adult pads only", "Pediatric pads or a dose attenuator", "No pads — manual defibrillation only", "Either adult or pediatric pads — no difference"],
          correctAnswer: "Pediatric pads or a dose attenuator",
          explanation: "Pediatric pads or a dose attenuator reduce energy delivery for children under 8 years / under 25 kg.",
        },
        {
          question: "In a resuscitation team, who is responsible for documenting drug doses and times?",
          options: ["Team Leader", "Compressor", "Airway Manager", "Recorder"],
          correctAnswer: "Recorder",
          explanation: "The Recorder documents all interventions, drug doses, and times during the resuscitation.",
        },
      ],
    },
  },
  {
    title: "Module 4: Opioid-Associated Emergencies & Special Situations",
    description: "Manage opioid-associated respiratory arrest and understand BLS in special circumstances.",
    content: `
      <h2>Opioid-Associated Respiratory Arrest</h2>
      <p>Opioid overdose typically causes respiratory depression before cardiac arrest. The priority is ventilation and naloxone administration.</p>
      <ol>
        <li>Stimulate the patient and shout for help.</li>
        <li>If unresponsive and not breathing normally: activate EMS.</li>
        <li>Administer naloxone if available (intranasal or IM) while providing rescue breaths.</li>
        <li>If no pulse: begin CPR and use AED as soon as available.</li>
      </ol>
      <h2>Naloxone Dosing</h2>
      <ul>
        <li><strong>Adult:</strong> 0.4–2 mg IV/IM/IN. May repeat every 2–3 minutes.</li>
        <li><strong>Pediatric:</strong> 0.01 mg/kg IV/IO/IM (max 0.4 mg per dose). Intranasal: 0.1 mg/kg (max 2 mg).</li>
      </ul>
      <h2>Drowning</h2>
      <p>Drowning victims often have respiratory arrest before cardiac arrest. Begin with 5 rescue breaths before starting standard CPR. Activate EMS immediately.</p>
      <h2>Pregnancy</h2>
      <p>Perform CPR with the patient supine. Use manual left uterine displacement (LUD) to relieve aortocaval compression. Standard compression depth and rate apply. Early obstetric team involvement is critical.</p>
    `,
    duration: 35,
    order: 4,
    quiz: {
      title: "Knowledge Check: Special Situations",
      passingScore: 84,
      questions: [
        {
          question: "In a suspected opioid overdose with respiratory arrest but a palpable pulse, what is the priority intervention?",
          options: [
            "Start chest compressions immediately",
            "Administer naloxone and provide rescue breaths",
            "Apply AED pads",
            "Place in recovery position",
          ],
          correctAnswer: "Administer naloxone and provide rescue breaths",
          explanation: "Opioid overdose with a pulse requires rescue breathing and naloxone. Compressions are only started if there is no pulse.",
        },
        {
          question: "For a drowning victim, what modification is made to the standard BLS sequence?",
          options: [
            "No modifications — follow standard BLS",
            "Begin with 5 rescue breaths before compressions",
            "Use compression-only CPR",
            "Begin with 30 compressions before any breaths",
          ],
          correctAnswer: "Begin with 5 rescue breaths before compressions",
          explanation: "Drowning victims typically have respiratory arrest first. Begin with 5 rescue breaths before starting the standard CPR cycle.",
        },
        {
          question: "During CPR in a pregnant patient, what maneuver helps relieve aortocaval compression?",
          options: [
            "Tilt the patient to the left at 30 degrees",
            "Manual left uterine displacement (LUD) with the patient supine",
            "Elevate the patient's legs",
            "Place a wedge under the right hip",
          ],
          correctAnswer: "Manual left uterine displacement (LUD) with the patient supine",
          explanation: "Manual LUD is performed with the patient supine to maintain effective compressions while relieving aortocaval compression.",
        },
      ],
    },
  },
];

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

const ACLS_MODULES = [
  {
    title: "Module 1: Systematic Approach & BLS Foundation for ACLS",
    description: "Apply the BLS survey and ACLS primary survey to any critically ill patient.",
    content: `
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
  // Find or create the course
  const existing = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.programType, programType))
    .limit(1);

  let courseId: number;
  if (existing.length > 0) {
    courseId = existing[0].id;
  } else {
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
    } else {
      await db.insert(modules).values({
        courseId,
        title: modDef.title,
        description: modDef.description,
        content: modDef.content,
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

    // Ensure the quiz for this module
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

    if (qCount.length === 0) {
      for (let i = 0; i < modDef.quiz.questions.length; i++) {
        const q = modDef.quiz.questions[i];
        await db.insert(quizQuestions).values({
          quizId,
          question: q.question,
          questionType: "multiple_choice",
          options: JSON.stringify(q.options),
          correctAnswer: JSON.stringify(q.correctAnswer),
          explanation: q.explanation,
          order: i + 1,
        });
      }
      console.log(`[Catalog] Seeded ${modDef.quiz.questions.length} questions for quiz: ${modDef.quiz.title}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

export async function ensureBlsCatalog(db: any): Promise<void> {
  await ensureCatalog(
    db,
    "bls",
    "BLS Provider Course — AHA 2020 Guidelines",
    "American Heart Association Basic Life Support (BLS) Provider Course. Covers high-quality CPR for adults, children, and infants, AED use, and relief of foreign-body airway obstruction.",
    180,
    "beginner",
    BLS_MODULES
  );
}

export async function ensureAclsCatalog(db: any): Promise<void> {
  await ensureCatalog(
    db,
    "acls",
    "ACLS Provider Course — AHA 2020 Guidelines",
    "American Heart Association Advanced Cardiovascular Life Support (ACLS) Provider Course. Covers cardiac arrest algorithms, pharmacology, post-ROSC care, ACS, stroke, and arrhythmia management.",
    480,
    "advanced",
    ACLS_MODULES
  );
}
