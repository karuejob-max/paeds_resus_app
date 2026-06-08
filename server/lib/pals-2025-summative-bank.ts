/**
 * Canonical PALS 2025 summative question bank (course-level exam).
 * correctAnswer values are option *indices* at authoring time; seed encodes to option text.
 */
export const PALS_2025_SUMMATIVE_QUIZ_TITLE = "PALS Summative Exam";

export type PalsSummativeQuestionSeed = {
  question: string;
  options: string[];
  correctAnswer: number | string;
  explanation: string;
};

/** Module 6 §2 — PEA/Asystole H's and T's (PALS 2020/2025). */
export const PALS_MODULE6_PEA_SECTION2_HTML = `<h2>Asystole and Pulseless Electrical Activity (PEA)</h2>
<p>These rhythms are not amenable to defibrillation. The priority is high-quality CPR and early administration of Epinephrine.</p>
<div class="clinical-note">
  <strong>2025 Mandate:</strong> Administer Epinephrine 0.01 mg/kg IV/IO as soon as possible after starting CPR for non-shockable rhythms. Repeat every 3-5 minutes.
</div>
<p>Simultaneously, actively search for and treat reversible causes (H's and T's).</p>
<ul>
  <li><strong>H's:</strong> Hypovolemia, Hypoxia, Hydrogen ion (acidosis), Hypo-/Hyperkalemia, Hypothermia, <strong>Hypoglycemia</strong>.</li>
  <li><strong>T's:</strong> Tension pneumothorax, Tamponade (cardiac), Toxins, Thrombosis (coronary or pulmonary).</li>
</ul>`;

export const PALS_2025_SUMMATIVE_QUESTIONS: PalsSummativeQuestionSeed[] = [
  {
    question:
      "Which component of the Pediatric Assessment Triangle (PAT) evaluates the child's neurological status?",
    options: ["Appearance", "Work of Breathing", "Circulation to the Skin", "Disability"],
    correctAnswer: 0,
    explanation:
      "Appearance (TICLS) reflects mental status, muscle tone, and interactiveness — the neurological/perfusion impression on first look.",
  },
  {
    question:
      "What is the correct compression-to-ventilation ratio for 2-rescuer pediatric CPR when an advanced airway is NOT in place?",
    options: ["30:2", "15:2", "10:1", "Continuous compressions with 1 breath every 6 seconds"],
    correctAnswer: 1,
    explanation: "For infants and children, the 2-rescuer ratio is 15:2. The 30:2 ratio is for single rescuers.",
  },
  {
    question:
      "In the 2025 PALS guidelines, what is the target Diastolic Blood Pressure (DBP) during CPR for an infant?",
    options: ["At least 20 mmHg", "At least 25 mmHg", "At least 30 mmHg", "At least 40 mmHg"],
    correctAnswer: 1,
    explanation:
      "2025 guidelines recommend targeting a DBP of at least 25 mmHg in infants and 30 mmHg in children to ensure adequate coronary perfusion.",
  },
  {
    question:
      "Which of the following is a preferred method for airway management in pediatric resuscitation according to 2025 updates?",
    options: [
      "Uncuffed endotracheal tubes",
      "Cuffed endotracheal tubes",
      "Laryngeal Mask Airway (LMA) as first-line",
      "Esophageal-tracheal Combitube",
    ],
    correctAnswer: 1,
    explanation:
      "Cuffed ET tubes are preferred in the 2025 updates as they allow for better titration of PEEP and more accurate tidal volume delivery.",
  },
  {
    question:
      "What is the first-line medication for a child in fluid-refractory septic shock according to 2025 guidelines?",
    options: ["Dopamine", "Epinephrine or Norepinephrine", "Milrinone", "Vasopressin"],
    correctAnswer: 1,
    explanation:
      "2025 guidelines prioritize Epinephrine or Norepinephrine over Dopamine for fluid-refractory septic shock.",
  },
  {
    question: "For a non-shockable rhythm (Asystole/PEA), when should Epinephrine be administered?",
    options: [
      "After 2 minutes of CPR",
      "As soon as IV/IO access is obtained",
      "Only after the first rhythm check",
      "After 3 cycles of CPR",
    ],
    correctAnswer: 1,
    explanation: "Early administration of Epinephrine (ASAP) is a key 2025 update for non-shockable rhythms.",
  },
  {
    question: "What is the recommended energy dose for the second shock in pediatric VF/pVT?",
    options: ["2 J/kg", "4 J/kg", "6 J/kg", "10 J/kg"],
    correctAnswer: 1,
    explanation:
      "The initial shock is 2 J/kg, and the second shock is 4 J/kg. Subsequent shocks should be at least 4 J/kg.",
  },
  {
    question:
      "Which medication can be repeated up to 3 times for refractory VF/pVT in the 2025 guidelines?",
    options: ["Epinephrine", "Amiodarone", "Lidocaine", "Magnesium Sulfate"],
    correctAnswer: 1,
    explanation: "Amiodarone 5 mg/kg can be repeated up to 3 doses for refractory shockable rhythms.",
  },
  {
    question: "What is the 'Rule of 60' in pediatric bradycardia?",
    options: [
      "Start CPR if HR < 60 with poor perfusion despite oxygenation",
      "Give Epinephrine if HR < 60 regardless of symptoms",
      "HR < 60 is normal in athletic teenagers",
      "Synchronized cardioversion for HR < 60",
    ],
    correctAnswer: 0,
    explanation:
      "CPR should be initiated if the HR is < 60 bpm with signs of poor perfusion despite adequate ventilation and oxygenation.",
  },
  {
    question: "What is the primary goal of temperature management after ROSC in the 2025 guidelines?",
    options: [
      "Induce deep hypothermia (30°C)",
      "Prevent fever (> 37.5°C)",
      "Maintain temperature at exactly 37.0°C",
      "Allow permissive hyperthermia",
    ],
    correctAnswer: 1,
    explanation: "Preventing fever (> 37.5°C) is critical for neurological recovery after cardiac arrest.",
  },
  {
    question: "Which statement best describes the 2025 AHA Chain of Survival?",
    options: [
      "There are separate chains for IHCA and OHCA",
      "Adult and Pediatric chains remain distinct",
      "A single, unified chain applies to all ages and settings",
      "The chain no longer includes the Recovery link"
    ],
    correctAnswer: 2,
    explanation: "The 2025 guidelines unified the chain to simplify the framework and emphasize consistent high-quality care across all scenarios.",
  },
  {
    question:
      "Which role is responsible for monitoring CPR quality and providing real-time feedback on compression depth and rate?",
    options: ["Team Leader", "CPR Coach", "Timer/Recorder", "Airway Manager"],
    correctAnswer: 1,
    explanation:
      "The CPR Coach (often combined with the Monitor/Defibrillator role) is a 2025 addition focused on ensuring high-quality CPR.",
  },
  {
    question: "What is the correct depth of chest compressions for an infant?",
    options: [
      "At least 1 inch",
      "At least 1.5 inches (4 cm)",
      "At least 2 inches (5 cm)",
      "At least 2.4 inches (6 cm)",
    ],
    correctAnswer: 1,
    explanation:
      "Compression depth for infants should be at least one-third of the AP diameter of the chest, which is approximately 1.5 inches.",
  },
  {
    question:
      "In a child with a pulse but inadequate breathing, what is the correct rescue breathing rate?",
    options: ["10-12 breaths/min", "12-20 breaths/min", "20-30 breaths/min", "30-40 breaths/min"],
    correctAnswer: 2,
    explanation:
      "2025 guidelines recommend 1 breath every 2-3 seconds (20-30 breaths/min) for pediatric rescue breathing.",
  },
  {
    question: "What is the maximum single dose of Amiodarone for a pediatric patient?",
    options: ["150 mg", "300 mg", "450 mg", "600 mg"],
    correctAnswer: 1,
    explanation: "The initial bolus of Amiodarone is 5 mg/kg, up to a maximum of 300 mg.",
  },
  {
    question: "Which medication is used first for stable SVT that does not respond to vagal maneuvers?",
    options: ["Adenosine", "Amiodarone", "Procainamide", "Verapamil"],
    correctAnswer: 0,
    explanation: "Adenosine is the first-line medication for stable SVT in children.",
  },
  {
    question: "What is the initial energy dose for synchronized cardioversion in unstable SVT?",
    options: ["0.1 to 0.5 J/kg", "0.5 to 1 J/kg", "2 J/kg", "4 J/kg"],
    correctAnswer: 1,
    explanation: "Synchronized cardioversion starts at 0.5 to 1 J/kg.",
  },
  {
    question: "During post-arrest care, what is the target oxygen saturation (SpO2) range?",
    options: ["90-94%", "94-99%", "100%", "88-92%"],
    correctAnswer: 1,
    explanation: "Oxygen should be titrated to maintain SpO2 between 94% and 99% to avoid hyperoxia.",
  },
  {
    question:
      "A 5-year-old child is unresponsive and not breathing. You cannot feel a pulse. What is your first action?",
    options: [
      "Give 2 rescue breaths",
      "Start chest compressions",
      "Call for help/AED",
      "Check for a pulse again",
    ],
    correctAnswer: 1,
    explanation:
      "If a child is unresponsive and has no pulse (or you are unsure), start CPR immediately beginning with compressions.",
  },
  {
    question: "Which of the following is a sign of 'upper airway obstruction' in a child?",
    options: ["Wheezing", "Stridor", "Crackles", "Grunting"],
    correctAnswer: 1,
    explanation:
      "Stridor is a high-pitched sound heard on inspiration, typical of upper airway obstruction (e.g., croup, foreign body).",
  },
  {
    question: "What is the recommended fluid bolus volume for a child in hypovolemic shock?",
    options: ["5 mL/kg", "10 mL/kg", "20 mL/kg", "50 mL/kg"],
    correctAnswer: 2,
    explanation:
      "The standard fluid bolus for hypovolemic or distributive shock is 20 mL/kg of isotonic crystalloid.",
  },
  {
    question: "In the 2025 guidelines, which medication is newly highlighted for refractory SVT?",
    options: ["IV Sotalol", "Oral Digoxin", "IV Metoprolol", "IV Diltiazem"],
    correctAnswer: 0,
    explanation: "IV Sotalol is mentioned in the 2025 updates as an option for refractory SVT.",
  },
  {
    question:
      "Which 'H' refers to a low blood sugar level that must be checked during pediatric arrest?",
    options: ["Hypovolemia", "Hypoxia", "Hypoglycemia", "Hydrogen ion (acidosis)"],
    correctAnswer: 2,
    explanation: "Hypoglycemia is a critical reversible cause of arrest in infants and children.",
  },
  {
    question: "What does 'Closed-Loop Communication' mean?",
    options: [
      "Talking only to the Team Leader",
      "Confirming that an order was received and completed",
      "Using hand signals instead of speaking",
      "Keeping the room quiet",
    ],
    correctAnswer: 1,
    explanation:
      "Closed-loop communication involves repeating an order back to the leader and confirming when the task is done.",
  },
  {
    question:
      "In the 2025 PALS guidelines, what is the preferred method for confirming and monitoring endotracheal tube placement?",
    options: [
      "Clinical assessment only",
      "Chest X-ray",
      "Continuous waveform capnography",
      "Pulse oximetry alone",
    ],
    correctAnswer: 2,
    explanation:
      "Continuous waveform capnography is the gold standard for confirming and monitoring ETT placement during resuscitation.",
  },
];
