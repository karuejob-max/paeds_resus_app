/**
 * Canonical ACLS summative question bank (25 unique stems).
 * AHA ACLS Provider — disjoint from diagnostic baseline and module formatives.
 */
import type { AhaSummativeQuestionSeed } from "./aha-summative-types";

export const ACLS_SUMMATIVE_QUESTIONS: AhaSummativeQuestionSeed[] = [
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
    question: "The first treatment for witnessed ventricular fibrillation is:",
    options: [
      "Amiodarone 300 mg IV",
      "Defibrillation",
      "Atropine 1 mg IV",
      "Synchronized cardioversion",
    ],
    correctAnswer: 1,
    explanation:
      "VF/pVT are shockable rhythms; defibrillation is the priority intervention along with immediate CPR.",
  },
  {
    question: "Adult epinephrine during cardiac arrest is given:",
    options: [
      "0.1 mg IV once only",
      "1 mg IV/IO every 3–5 minutes",
      "2 mg IV every cycle",
      "1 mg IM only",
    ],
    correctAnswer: 1,
    explanation:
      "Epinephrine 1 mg IV/IO every 3–5 minutes is standard in adult cardiac arrest.",
  },
  {
    question: "Amiodarone 300 mg IV is indicated for:",
    options: [
      "First shock in VF",
      "Refractory VF/pVT after multiple shocks",
      "Stable SVT first-line",
      "Symptomatic bradycardia",
    ],
    correctAnswer: 1,
    explanation:
      "Amiodarone 300 mg is given for refractory VF/pVT; a second 150 mg dose may follow.",
  },
  {
    question: "Pulseless electrical activity management emphasizes:",
    options: [
      "Immediate defibrillation",
      "CPR, epinephrine, and treat reversible causes",
      "Adenosine 6 mg push",
      "Atropine as sole therapy",
    ],
    correctAnswer: 1,
    explanation:
      "PEA is non-shockable; focus on CPR, epinephrine, and identifying H's and T's.",
  },
  {
    question: "Reversible causes of cardiac arrest (T's) include:",
    options: [
      "Tension pneumothorax and pulmonary thrombosis",
      "Hyperthermia only",
      "Hypertension",
      "Happiness and hydration",
    ],
    correctAnswer: 0,
    explanation:
      "T's include tension pneumothorax, tamponade, toxins, thrombosis (pulmonary and coronary).",
  },
  {
    question: "First-line drug for symptomatic bradycardia with hypotension is:",
    options: ["Amiodarone", "Atropine 0.5 mg IV", "Adenosine", "Lidocaine"],
    correctAnswer: 1,
    explanation:
      "Atropine 0.5 mg IV is first-line; repeat to maximum 3 mg total.",
  },
  {
    question: "Stable narrow-complex SVT unresponsive to vagal maneuvers receives:",
    options: [
      "Adenosine 6 mg rapid IV push",
      "Defibrillation 200 J",
      "Atropine 1 mg",
      "Magnesium 2 g",
    ],
    correctAnswer: 0,
    explanation:
      "Adenosine 6 mg rapid IV push with flush is first pharmacologic therapy for stable SVT.",
  },
  {
    question: "Unstable tachycardia with a pulse requires:",
    options: [
      "Observation only",
      "Synchronized cardioversion",
      "Adenosine before any shock",
      "Atropine 0.5 mg",
    ],
    correctAnswer: 1,
    explanation:
      "Hemodynamically unstable tachyarrhythmias with pulse need immediate synchronized cardioversion.",
  },
  {
    question: "Synchronized cardioversion for unstable SVT typically starts at:",
    options: ["10 J", "50–100 J biphasic", "360 J monophasic only", "2 J/kg"],
    correctAnswer: 1,
    explanation:
      "Synchronized cardioversion for unstable SVT often begins at 50–100 J biphasic.",
  },
  {
    question: "Post-cardiac arrest oxygenation target SpO₂ is:",
    options: ["88–92% only", "94–99%", "100% always", "No monitoring required"],
    correctAnswer: 1,
    explanation:
      "Avoid hypoxia and hyperoxia; target SpO₂ 94–99% after ROSC.",
  },
  {
    question: "Post-cardiac arrest ventilation targets include PaCO₂:",
    options: ["25–30 mmHg", "35–45 mmHg (normocapnia)", ">50 mmHg", "No target"],
    correctAnswer: 1,
    explanation:
      "Normocapnia (35–45 mmHg) avoids cerebral harm from hypocapnia or hypercapnia.",
  },
  {
    question: "STEMI reperfusion goal with primary PCI is within:",
    options: ["30 minutes", "90 minutes of first medical contact", "24 hours", "2 hours from symptom onset only"],
    correctAnswer: 1,
    explanation:
      "Primary PCI should occur within 90 minutes of first medical contact when available.",
  },
  {
    question: "The Cincinnati Prehospital Stroke Scale assesses:",
    options: [
      "GCS and glucose only",
      "Facial droop, arm drift, and speech",
      "Blood pressure and heart rate",
      "Pupil size exclusively",
    ],
    correctAnswer: 1,
    explanation:
      "CPSS evaluates facial droop, arm drift, and speech abnormality for stroke recognition.",
  },
  {
    question: "Ischemic stroke IV alteplase is generally considered within:",
    options: ["1 hour of arrival", "3–4.5 hours of symptom onset when eligible", "24 hours always", "Only after MRI day 2"],
    correctAnswer: 1,
    explanation:
      "tPA eligibility depends on time from onset and contraindications; typical window is up to 3–4.5 hours.",
  },
  {
    question: "Targeted temperature management after cardiac arrest may include:",
    options: [
      "32–34°C or strict normothermia 36–37.5°C",
      "40°C for 24 hours",
      "No temperature control ever",
      "Immediate hyperthermia",
    ],
    correctAnswer: 0,
    explanation:
      "Prevent fever; TTM at 32–34°C or strict normothermia per protocol for comatose survivors.",
  },
  {
    question: "ETCO₂ during CPR above 10 mmHg suggests:",
    options: [
      "Effective compressions generating perfusion",
      "Esophageal intubation always",
      "Need to stop CPR",
      "ROSC has not occurred and never will",
    ],
    correctAnswer: 0,
    explanation:
      "ETCO₂ >10 mmHg indicates reasonable perfusion during compressions; sudden rise may signal ROSC.",
  },
  {
    question: "Maximum total atropine dose for symptomatic bradycardia is:",
    options: ["0.5 mg", "1 mg", "3 mg", "10 mg"],
    correctAnswer: 2,
    explanation:
      "Atropine may be repeated to a maximum total dose of 3 mg.",
  },
  {
    question: "Torsades de pointes with pulse is treated with:",
    options: [
      "Amiodarone bolus",
      "Magnesium sulfate 1–2 g IV",
      "Adenosine 12 mg",
      "Calcium chloride first-line",
    ],
    correctAnswer: 1,
    explanation:
      "Magnesium is first-line for TdP; correct electrolytes and avoid QT-prolonging drugs.",
  },
  {
    question: "Second dose of adenosine for SVT is typically:",
    options: ["3 mg", "6 mg again only", "12 mg rapid IV push", "50 mg over 10 minutes"],
    correctAnswer: 2,
    explanation:
      "If 6 mg adenosine fails, give 12 mg rapid IV push (may repeat 12 mg once).",
  },
  {
    question: "Post-ROSC blood glucose should generally be maintained:",
    options: ["Below 2 mmol/L", "4–10 mmol/L", "Above 15 mmol/L always", "Not measured"],
    correctAnswer: 1,
    explanation:
      "Avoid hypoglycemia and severe hyperglycemia after ROSC; target moderate glycemic control.",
  },
  {
    question: "Wide-complex tachycardia of unknown type should be treated as:",
    options: [
      "SVT with aberrancy — adenosine only",
      "Ventricular tachycardia until proven otherwise",
      "Sinus tachycardia — fluids only",
      "Atrial fibrillation — rate control only",
    ],
    correctAnswer: 1,
    explanation:
      "Assume VT when uncertain; unstable VT requires synchronized cardioversion or amiodarone if stable.",
  },
  {
    question: "First-line vasopressor for adult septic shock is:",
    options: ["Dopamine", "Norepinephrine", "Isoproterenol", "Atropine"],
    correctAnswer: 1,
    explanation:
      "Norepinephrine is first-line for septic shock per Surviving Sepsis guidance.",
  },
  {
    question: "Aspirin dose for suspected ACS is:",
    options: ["81 mg daily only", "162–325 mg chewed immediately", "650 mg rectal only", "No aspirin if hypertensive"],
    correctAnswer: 1,
    explanation:
      "Give non-enteric aspirin 162–325 mg chewed as early as possible in suspected ACS.",
  },
  {
    question: "If primary PCI is unavailable within 120 minutes for STEMI, consider:",
    options: [
      "Fibrinolysis within 30 minutes of presentation when eligible",
      "Discharge home",
      "Wait 24 hours for transfer",
      "Only heparin without reperfusion",
    ],
    correctAnswer: 0,
    explanation:
      "Fibrinolysis within 30 minutes (door-to-needle) when PCI cannot occur within 120 minutes.",
  },
];
