import type { PracticeLabEvent, PracticeLabProgramType } from "@shared/practice-lab-types";

export type ShockAction = "shock" | "cardiovert" | "treat" | "observe" | "cpr";

export type ShockNoShockScenario = {
  id: string;
  name: string;
  rhythm: string;
  rhythmLabel: string;
  context: string;
  patientAge: string;
  patientWeight: number;
  isPediatric: boolean;
  correctAction: ShockAction;
  shockEnergyJoules?: number;
  feedback: {
    correct: string;
    incorrect: Record<ShockAction, string>;
  };
  learningObjective: string;
};

/** AHA 2025 pediatric shock energy: 2 J/kg first, 4 J/kg second, max 10 J/kg or 360 J */
export function getPediatricShockEnergy(shockNumber: 1 | 2 | 3, weightKg: number): number {
  if (shockNumber === 1) return Math.min(weightKg * 2, 360);
  return Math.min(weightKg * 4, 360);
}

/** AHA 2025 adult ACLS: 120-200 J biphasic first, escalate per manufacturer */
export function getAdultShockEnergy(shockNumber: 1 | 2 | 3): number {
  if (shockNumber === 1) return 200;
  if (shockNumber === 2) return 300;
  return 360;
}

export const SHOCK_NO_SHOCK_SCENARIOS: ShockNoShockScenario[] = [
  {
    id: "vf_witnessed_peds",
    name: "Witnessed VF — Pediatric",
    rhythm: "vf",
    rhythmLabel: "Ventricular Fibrillation",
    context: "7-year-old collapses during soccer. No pulse. Monitor shows chaotic VF.",
    patientAge: "7 years",
    patientWeight: 25,
    isPediatric: true,
    correctAction: "shock",
    shockEnergyJoules: 50,
    feedback: {
      correct: "Correct — VF is shockable. Deliver 2 J/kg (50 J) immediately, then resume CPR.",
      incorrect: {
        shock: "",
        cardiovert: "VF requires defibrillation (unsynchronized shock), not synchronized cardioversion.",
        treat: "VF is a shockable rhythm — shock first, then CPR. Do not delay for medications.",
        observe: "This is cardiac arrest with VF — immediate defibrillation is required.",
        cpr: "Start CPR while pads are applied, but deliver shock as soon as possible for VF.",
      },
    },
    learningObjective: "Recognize shockable VF and deliver prompt defibrillation per PALS.",
  },
  {
    id: "pulseless_vt_peds",
    name: "Pulseless VT — Pediatric",
    rhythm: "pulseless_vt",
    rhythmLabel: "Pulseless Ventricular Tachycardia",
    context: "Wide-complex tachycardia at 220 bpm. No palpable pulse in a 12 kg toddler.",
    patientAge: "2 years",
    patientWeight: 12,
    isPediatric: true,
    correctAction: "shock",
    shockEnergyJoules: 24,
    feedback: {
      correct: "Correct — pulseless VT is treated like VF: defibrillate 2 J/kg.",
      incorrect: {
        shock: "",
        cardiovert: "No pulse = defibrillation, not synchronized cardioversion.",
        treat: "Pulseless VT requires immediate defibrillation before antiarrhythmics.",
        observe: "Pulseless VT is an arrest rhythm — shock immediately.",
        cpr: "CPR while preparing to shock, but do not delay defibrillation.",
      },
    },
    learningObjective: "Pulseless wide-complex tachycardia = shockable arrest rhythm.",
  },
  {
    id: "svt_unstable_peds",
    name: "Unstable SVT — Pediatric",
    rhythm: "svt",
    rhythmLabel: "Supraventricular Tachycardia",
    context: "Infant, HR 280, lethargic, poor perfusion. Narrow-complex regular tachycardia.",
    patientAge: "6 months",
    patientWeight: 8,
    isPediatric: true,
    correctAction: "cardiovert",
    shockEnergyJoules: 4,
    feedback: {
      correct: "Correct — unstable SVT with poor perfusion: synchronized cardioversion 0.5-1 J/kg.",
      incorrect: {
        shock: "Unstable SVT with a pulse requires synchronized cardioversion, not defibrillation.",
        cardiovert: "",
        treat: "If unstable, do not delay cardioversion for adenosine trials.",
        observe: "Unstable tachycardia with poor perfusion requires immediate cardioversion.",
        cpr: "Patient has a pulse — cardiovert, do not start CPR.",
      },
    },
    learningObjective: "Unstable tachycardia with pulse → synchronized cardioversion.",
  },
  {
    id: "pea_hypovolemia",
    name: "PEA — Non-Shockable",
    rhythm: "pea",
    rhythmLabel: "Pulseless Electrical Activity",
    context: "Organized rhythm on monitor but no pulse. 3-year-old with severe dehydration.",
    patientAge: "3 years",
    patientWeight: 14,
    isPediatric: true,
    correctAction: "cpr",
    feedback: {
      correct: "Correct — PEA is non-shockable. High-quality CPR and treat reversible causes (hypovolemia).",
      incorrect: {
        shock: "PEA is NOT shockable — defibrillation will not help. Focus on CPR and 4H/4Ts.",
        cardiovert: "PEA has no pulse but is non-shockable — do not cardiovert.",
        treat: "Treat hypovolemia with fluid bolus during CPR, but start CPR first.",
        observe: "This is cardiac arrest — immediate CPR required.",
        cpr: "",
      },
    },
    learningObjective: "PEA is non-shockable — CPR and reversible cause treatment.",
  },
  {
    id: "asystole_confirm",
    name: "Asystole — Non-Shockable",
    rhythm: "asystole",
    rhythmLabel: "Asystole",
    context: "Flat line confirmed in two leads. No pulse after prolonged hypoxia.",
    patientAge: "18 months",
    patientWeight: 11,
    isPediatric: true,
    correctAction: "cpr",
    feedback: {
      correct: "Correct — asystole is non-shockable. CPR, epinephrine, and treat reversible causes.",
      incorrect: {
        shock: "Never defibrillate asystole — it will not convert and wastes CPR time.",
        cardiovert: "Asystole has no organized rhythm to cardiovert.",
        treat: "Treat reversible causes during CPR, but start CPR and give epinephrine immediately.",
        observe: "Cardiac arrest — start CPR now.",
        cpr: "",
      },
    },
    learningObjective: "Asystole = CPR + epinephrine, NOT defibrillation.",
  },
  {
    id: "afib_stable_adult",
    name: "Stable AF — Adult ACLS",
    rhythm: "afib",
    rhythmLabel: "Atrial Fibrillation",
    context: "Adult with new-onset AF, HR 130, BP 118/72, no chest pain. Hemodynamically stable.",
    patientAge: "58 years",
    patientWeight: 80,
    isPediatric: false,
    correctAction: "treat",
    feedback: {
      correct: "Correct — stable AF: rate control and anticoagulation evaluation. No immediate cardioversion.",
      incorrect: {
        shock: "Stable AF with pulse does not require defibrillation.",
        cardiovert: "Cardioversion is for unstable patients — this patient is stable.",
        treat: "",
        observe: "Monitor, but active rate control is appropriate for symptomatic stable AF.",
        cpr: "Patient has a pulse and is stable — CPR is not indicated.",
      },
    },
    learningObjective: "Stable vs unstable tachycardia algorithm (ACLS).",
  },
  {
    id: "vt_unstable_adult",
    name: "Unstable VT — Adult ACLS",
    rhythm: "vt_pulse",
    rhythmLabel: "Ventricular Tachycardia (with pulse)",
    context: "Adult wide-complex tachycardia, HR 180, BP 78/40, altered mental status.",
    patientAge: "45 years",
    patientWeight: 75,
    isPediatric: false,
    correctAction: "cardiovert",
    shockEnergyJoules: 100,
    feedback: {
      correct: "Correct — unstable VT with pulse: synchronized cardioversion 100 J (biphasic).",
      incorrect: {
        shock: "VT with pulse requires synchronized cardioversion, not unsynchronized shock.",
        cardiovert: "",
        treat: "Unstable VT — do not delay cardioversion for amiodarone loading.",
        observe: "Hypotension and altered mental status = unstable — cardiovert now.",
        cpr: "Patient has a pulse — cardiovert, not CPR.",
      },
    },
    learningObjective: "Unstable wide-complex tachycardia with pulse → synchronized cardioversion.",
  },
];

/** Map shock scenario rhythm id → ECGVisuals rhythm key */
export function shockRhythmToEcgKey(rhythm: string): string {
  const map: Record<string, string> = {
    vf: "vfib",
    pulseless_vt: "vtach",
    vt_pulse: "vtach",
    svt: "svt",
    pea: "pea",
    asystole: "asystole",
    afib: "sinus_tach",
  };
  return map[rhythm] ?? "normal_sinus";
}

export function filterScenariosForProgram(
  scenarios: ShockNoShockScenario[],
  programType: PracticeLabProgramType
): ShockNoShockScenario[] {
  if (programType === "acls" || programType === "bls") {
    return scenarios.filter((s) => !s.isPediatric || programType === "bls");
  }
  return scenarios.filter((s) => s.isPediatric || programType === "pals");
}

export function scoreShockNoShockAttempt(
  scenario: ShockNoShockScenario,
  selectedAction: ShockAction,
  startTime: number
): { score: number; passed: boolean; events: PracticeLabEvent[] } {
  const correct = selectedAction === scenario.correctAction;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  let score = correct ? 85 : 40;
  if (correct && elapsed <= 30) score += 15;
  else if (correct && elapsed <= 60) score += 10;

  const events: PracticeLabEvent[] = [
    {
      timestamp: elapsed,
      type: "action",
      description: `Selected: ${selectedAction}`,
      correct,
    },
    {
      timestamp: elapsed,
      type: "feedback",
      description: correct
        ? scenario.feedback.correct
        : scenario.feedback.incorrect[selectedAction],
      correct,
    },
  ];

  return { score: Math.min(100, score), passed: correct && score >= 70, events };
}
