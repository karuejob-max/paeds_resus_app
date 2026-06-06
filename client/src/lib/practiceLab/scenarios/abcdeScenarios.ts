import type { PracticeLabEvent, PracticeLabProgramType } from "@shared/practice-lab-types";

export type AbcdePhase =
  | "presentation"
  | "abcde_assess"
  | "intervention"
  | "deterioration"
  | "arrest"
  | "rosc"
  | "post_arrest";

export type AbcdeAction =
  | "oxygen"
  | "atropine"
  | "epinephrine"
  | "pacing"
  | "adenosine"
  | "cardiovert"
  | "fluid_bolus"
  | "start_cpr"
  | "defibrillate"
  | "post_rosc_checklist"
  | "observe";

export type AbcdeScenario = {
  id: string;
  name: string;
  category: "unstable_brady" | "unstable_tachy_narrow" | "unstable_tachy_wide";
  isPediatric: boolean;
  presentation: string;
  vitals: { hr: number; bp: string; spo2: number; rhythm: string };
  correctFirstAction: AbcdeAction;
  arrestTrigger?: AbcdeAction[];
  roscPath: AbcdeAction[];
  steps: { phase: AbcdePhase; prompt: string; options: { action: AbcdeAction; label: string }[] }[];
  feedback: Record<AbcdeAction, string>;
};

export const ABCDE_SCENARIOS: AbcdeScenario[] = [
  {
    id: "unstable_brady_infant",
    name: "Unstable Bradycardia — Infant",
    category: "unstable_brady",
    isPediatric: true,
    presentation:
      "6-month-old with bronchiolitis. HR 45, poor perfusion, mottled, lethargic despite supplemental O2.",
    vitals: { hr: 45, bp: "60/35", spo2: 88, rhythm: "Sinus bradycardia" },
    correctFirstAction: "epinephrine",
    arrestTrigger: ["observe"],
    roscPath: ["post_rosc_checklist"],
    steps: [
      {
        phase: "abcde_assess",
        prompt: "C — Circulation: HR 45 with poor perfusion despite oxygenation. First action?",
        options: [
          { action: "oxygen", label: "Increase oxygen (already on O2)" },
          { action: "atropine", label: "Atropine 0.02 mg/kg" },
          { action: "epinephrine", label: "Epinephrine 0.01 mg/kg IV/IO" },
          { action: "pacing", label: "Transcutaneous pacing" },
          { action: "observe", label: "Continue monitoring" },
        ],
      },
    ],
    feedback: {
      oxygen: "Oxygen alone will not fix bradycardia with poor perfusion — escalate.",
      atropine: "Atropine may help vagal bradycardia, but poor perfusion with HR <60 needs epinephrine per PALS.",
      epinephrine: "Correct — PALS: HR <60 with poor perfusion despite oxygenation → epinephrine.",
      pacing: "Pacing is an option if drugs fail, but epinephrine is first-line for poor perfusion.",
      observe: "Delay risks progression to cardiac arrest.",
      adenosine: "Adenosine is for SVT, not bradycardia.",
      cardiovert: "Not indicated for bradycardia.",
      fluid_bolus: "Consider if hypovolemia suspected, but epinephrine is priority for bradycardia with poor perfusion.",
      start_cpr: "CPR if HR <60 with poor perfusion after epinephrine — not first step if still has pulse.",
      defibrillate: "Bradycardia is not shockable.",
      post_rosc_checklist: "After ROSC: ABCDE reassessment, target SpO2, avoid hyperoxia, consider cause.",
    },
  },
  {
    id: "complete_heart_block",
    name: "Complete Heart Block — Deterioration",
    category: "unstable_brady",
    isPediatric: true,
    presentation: "4-year-old post-cardiac surgery. HR 38, AV dissociation on monitor, cold extremities.",
    vitals: { hr: 38, bp: "55/30", spo2: 92, rhythm: "Complete heart block" },
    correctFirstAction: "pacing",
    arrestTrigger: ["observe", "oxygen"],
    roscPath: ["post_rosc_checklist"],
    steps: [
      {
        phase: "abcde_assess",
        prompt: "Complete heart block with poor perfusion. Most appropriate immediate action?",
        options: [
          { action: "pacing", label: "Transcutaneous pacing" },
          { action: "epinephrine", label: "Epinephrine bolus" },
          { action: "atropine", label: "Atropine" },
          { action: "observe", label: "Wait for cardiology" },
        ],
      },
    ],
    feedback: {
      pacing: "Correct — complete heart block with poor perfusion: pace immediately while preparing epinephrine infusion.",
      epinephrine: "Epinephrine is appropriate but pacing is preferred for complete heart block.",
      atropine: "Atropine is unlikely to work in complete heart block.",
      observe: "Waiting risks asystolic arrest.",
      oxygen: "Already oxygenated — address the bradycardia.",
      adenosine: "Not for bradycardia.",
      cardiovert: "Not for bradycardia.",
      fluid_bolus: "Not the primary treatment.",
      start_cpr: "If arrest occurs — start CPR.",
      defibrillate: "Not shockable.",
      post_rosc_checklist: "Post-ROSC: maintain pacing, cardiology consult, monitor electrolytes.",
    },
  },
  {
    id: "svt_unstable_narrow",
    name: "Unstable Narrow-Complex Tachycardia",
    category: "unstable_tachy_narrow",
    isPediatric: true,
    presentation: "2-year-old, HR 260, narrow QRS, pale, cap refill 4 sec, BP unobtainable.",
    vitals: { hr: 260, bp: "—", spo2: 94, rhythm: "SVT" },
    correctFirstAction: "cardiovert",
    arrestTrigger: ["adenosine", "observe"],
    roscPath: ["post_rosc_checklist"],
    steps: [
      {
        phase: "abcde_assess",
        prompt: "Unstable SVT with signs of shock. First action?",
        options: [
          { action: "adenosine", label: "Adenosine 0.1 mg/kg rapid push" },
          { action: "cardiovert", label: "Synchronized cardioversion 0.5-1 J/kg" },
          { action: "fluid_bolus", label: "20 mL/kg fluid bolus" },
          { action: "observe", label: "Vagal maneuvers only" },
        ],
      },
    ],
    feedback: {
      adenosine: "Adenosine is for stable SVT — this patient is unstable with shock.",
      cardiovert: "Correct — unstable SVT: synchronized cardioversion without delay.",
      fluid_bolus: "Will not terminate SVT — cardiovert first.",
      observe: "Unstable = immediate cardioversion per PALS.",
      oxygen: "Supportive but does not fix unstable SVT.",
      atropine: "Not for tachycardia.",
      epinephrine: "Not for SVT.",
      pacing: "Not indicated.",
      start_cpr: "If pulseless — CPR and defibrillate if VF/pVT.",
      defibrillate: "SVT with pulse needs synchronized cardioversion.",
      post_rosc_checklist: "After cardioversion: monitor for recurrence, consider amiodarone.",
    },
  },
  {
    id: "vt_unstable_wide",
    name: "Unstable Wide-Complex Tachycardia",
    category: "unstable_tachy_wide",
    isPediatric: true,
    presentation: "10-year-old, wide QRS tachycardia 200 bpm, chest pain, BP 70/40.",
    vitals: { hr: 200, bp: "70/40", spo2: 96, rhythm: "Wide-complex VT" },
    correctFirstAction: "cardiovert",
    arrestTrigger: ["adenosine", "observe"],
    roscPath: ["post_rosc_checklist"],
    steps: [
      {
        phase: "abcde_assess",
        prompt: "Wide-complex tachycardia with hypotension. Treat as?",
        options: [
          { action: "cardiovert", label: "Synchronized cardioversion 0.5-1 J/kg" },
          { action: "adenosine", label: "Adenosine (assume SVT with aberrancy)" },
          { action: "observe", label: "Amiodarone load first" },
          { action: "fluid_bolus", label: "Fluid bolus only" },
        ],
      },
    ],
    feedback: {
      cardiovert: "Correct — unstable wide-complex tachycardia: treat as VT, synchronized cardioversion.",
      adenosine: "Adenosine is dangerous in VT — may cause VF.",
      observe: "Unstable VT requires immediate cardioversion, not delayed drug therapy.",
      fluid_bolus: "Will not terminate VT.",
      oxygen: "Supportive only.",
      atropine: "Not indicated.",
      epinephrine: "Not first-line for VT with pulse.",
      pacing: "Not indicated.",
      start_cpr: "If pulse lost — CPR and defibrillate.",
      defibrillate: "VT with pulse = synchronized cardioversion.",
      post_rosc_checklist: "Post-conversion: 12-lead ECG, electrolytes, cardiology consult.",
    },
  },
  {
    id: "adult_unstable_afib",
    name: "Unstable AF — Adult ACLS",
    category: "unstable_tachy_narrow",
    isPediatric: false,
    presentation: "Adult with rapid AF, HR 170, BP 82/50, acute pulmonary edema.",
    vitals: { hr: 170, bp: "82/50", spo2: 90, rhythm: "Atrial fibrillation" },
    correctFirstAction: "cardiovert",
    arrestTrigger: ["observe", "adenosine"],
    roscPath: ["post_rosc_checklist"],
    steps: [
      {
        phase: "abcde_assess",
        prompt: "Unstable atrial fibrillation with pulmonary edema. First action?",
        options: [
          { action: "cardiovert", label: "Synchronized cardioversion" },
          { action: "adenosine", label: "Adenosine" },
          { action: "observe", label: "Rate control with diltiazem" },
          { action: "fluid_bolus", label: "Fluid bolus" },
        ],
      },
    ],
    feedback: {
      cardiovert: "Correct — unstable AF: immediate synchronized cardioversion (ACLS).",
      adenosine: "Adenosine is not for AF.",
      observe: "Rate control is for stable patients — this patient is unstable.",
      fluid_bolus: "Contraindicated with pulmonary edema.",
      oxygen: "Supplement O2 but cardiovert is priority.",
      atropine: "Not indicated.",
      epinephrine: "Not indicated.",
      pacing: "Not indicated.",
      start_cpr: "If pulseless — follow cardiac arrest algorithm.",
      defibrillate: "AF with pulse requires synchronized cardioversion.",
      post_rosc_checklist: "Post-cardioversion: anticoagulation decision, treat pulmonary edema.",
    },
  },
];

export function filterAbcdeForProgram(
  scenarios: AbcdeScenario[],
  programType: PracticeLabProgramType
): AbcdeScenario[] {
  if (programType === "acls") return scenarios.filter((s) => !s.isPediatric);
  if (programType === "pals" || programType === "nrp") return scenarios.filter((s) => s.isPediatric);
  return scenarios;
}

export function scoreAbcdeAttempt(
  scenario: AbcdeScenario,
  selectedAction: AbcdeAction,
  startTime: number
): {
  score: number;
  passed: boolean;
  events: PracticeLabEvent[];
  progressedToArrest: boolean;
  achievedRosc: boolean;
} {
  const correct = selectedAction === scenario.correctFirstAction;
  const progressedToArrest =
    !correct && (scenario.arrestTrigger?.includes(selectedAction) ?? false);
  const achievedRosc = correct;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);

  let score = correct ? 90 : progressedToArrest ? 25 : 50;
  if (correct && elapsed <= 45) score += 10;

  const events: PracticeLabEvent[] = [
    {
      timestamp: elapsed,
      type: "abcde_action",
      description: `Action: ${selectedAction}`,
      correct,
    },
    {
      timestamp: elapsed,
      type: "feedback",
      description: scenario.feedback[selectedAction] ?? "",
      correct,
    },
  ];

  if (progressedToArrest) {
    events.push({
      timestamp: elapsed + 1,
      type: "deterioration",
      description: "Patient deteriorated to cardiac arrest due to delayed intervention.",
      correct: false,
    });
  }
  if (achievedRosc) {
    events.push({
      timestamp: elapsed + 2,
      type: "rosc",
      description: "Intervention successful — patient stabilized. Proceed to post-arrest ABCDE checklist.",
      correct: true,
    });
  }

  return {
    score: Math.min(100, score),
    passed: correct && score >= 70,
    events,
    progressedToArrest,
    achievedRosc,
  };
}
