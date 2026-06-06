import type { PracticeLabEvent } from "@shared/practice-lab-types";

export type RhythmStrip = {
  id: string;
  name: string;
  category: "bradycardia" | "tachycardia" | "arrest" | "normal";
  description: string;
  ecgFeatures: string[];
  correctRhythm: string;
  correctFirstAction?: string;
  urgency: "immediate" | "urgent" | "monitor";
};

/** Extended rhythm library (10+ strips) for Practice Lab — supplements ArrhythmiaRecognition */
export const RHYTHM_STRIPS: RhythmStrip[] = [
  {
    id: "sinus_bradycardia",
    name: "Sinus Bradycardia",
    category: "bradycardia",
    description: "Slow rate with normal P waves before each QRS",
    ecgFeatures: ["Regular", "Normal P before QRS", "Rate below age norm", "Narrow QRS"],
    correctRhythm: "Sinus Bradycardia",
    correctFirstAction: "Ensure oxygenation; epinephrine if HR <60 with poor perfusion",
    urgency: "urgent",
  },
  {
    id: "heart_block_complete",
    name: "Complete Heart Block",
    category: "bradycardia",
    description: "P waves and QRS completely independent",
    ecgFeatures: ["AV dissociation", "Regular P-P and R-R", "Wide QRS if ventricular escape"],
    correctRhythm: "Complete Heart Block (3rd Degree AV Block)",
    correctFirstAction: "Transcutaneous pacing; epinephrine infusion",
    urgency: "immediate",
  },
  {
    id: "junctional_brady",
    name: "Junctional Bradycardia",
    category: "bradycardia",
    description: "Narrow QRS, inverted or absent P waves, rate 40-60",
    ecgFeatures: ["Narrow QRS", "P waves inverted/absent", "Regular", "Rate 40-60"],
    correctRhythm: "Junctional Bradycardia",
    correctFirstAction: "Treat underlying cause; atropine or pacing if symptomatic",
    urgency: "urgent",
  },
  {
    id: "svt",
    name: "Supraventricular Tachycardia",
    category: "tachycardia",
    description: "Regular narrow-complex tachycardia, often >220 in infants",
    ecgFeatures: ["Very regular", "Narrow QRS", "P waves often hidden", "Abrupt onset"],
    correctRhythm: "Supraventricular Tachycardia (SVT)",
    correctFirstAction: "Vagal maneuvers if stable; adenosine or cardioversion if unstable",
    urgency: "urgent",
  },
  {
    id: "sinus_tachycardia",
    name: "Sinus Tachycardia",
    category: "tachycardia",
    description: "Elevated rate with normal P waves — usually compensatory",
    ecgFeatures: ["Normal P waves", "Beat-to-beat variability", "Gradual onset", "Rate varies with activity"],
    correctRhythm: "Sinus Tachycardia",
    correctFirstAction: "Identify and treat underlying cause — do NOT cardiovert",
    urgency: "monitor",
  },
  {
    id: "vt_with_pulse",
    name: "Ventricular Tachycardia (with pulse)",
    category: "tachycardia",
    description: "Wide-complex tachycardia with palpable pulse",
    ecgFeatures: ["Wide QRS", "Regular", "AV dissociation possible", "Rate 150-250"],
    correctRhythm: "Ventricular Tachycardia (with pulse)",
    correctFirstAction: "Amiodarone if stable; synchronized cardioversion if unstable",
    urgency: "immediate",
  },
  {
    id: "atrial_flutter",
    name: "Atrial Flutter",
    category: "tachycardia",
    description: "Sawtooth flutter waves, often 2:1 conduction",
    ecgFeatures: ["Sawtooth F waves", "Regular ventricular response", "Narrow QRS", "Rate ~150 with 2:1"],
    correctRhythm: "Atrial Flutter",
    correctFirstAction: "Rate control if stable; cardioversion if unstable",
    urgency: "urgent",
  },
  {
    id: "vf",
    name: "Ventricular Fibrillation",
    category: "arrest",
    description: "Chaotic ventricular activity — no cardiac output",
    ecgFeatures: ["Chaotic waveform", "No organized QRS", "Varying amplitude"],
    correctRhythm: "Ventricular Fibrillation (VF)",
    correctFirstAction: "CPR + defibrillate 2 J/kg (peds) or 120-200 J (adult)",
    urgency: "immediate",
  },
  {
    id: "pulseless_vt",
    name: "Pulseless Ventricular Tachycardia",
    category: "arrest",
    description: "Wide-complex tachycardia without pulse",
    ecgFeatures: ["Wide QRS", "Regular", "No palpable pulse"],
    correctRhythm: "Pulseless Ventricular Tachycardia",
    correctFirstAction: "CPR + defibrillate",
    urgency: "immediate",
  },
  {
    id: "asystole",
    name: "Asystole",
    category: "arrest",
    description: "Flat line — confirm in two leads",
    ecgFeatures: ["Isoelectric line", "Confirm in 2 leads", "Check connections"],
    correctRhythm: "Asystole",
    correctFirstAction: "CPR + epinephrine — do NOT defibrillate",
    urgency: "immediate",
  },
  {
    id: "pea",
    name: "Pulseless Electrical Activity",
    category: "arrest",
    description: "Organized rhythm but no pulse",
    ecgFeatures: ["Organized activity", "No pulse", "Often slow wide complexes"],
    correctRhythm: "Pulseless Electrical Activity (PEA)",
    correctFirstAction: "CPR + epinephrine + treat reversible causes",
    urgency: "immediate",
  },
  {
    id: "torsades",
    name: "Torsades de Pointes",
    category: "tachycardia",
    description: "Polymorphic VT with twisting QRS around baseline",
    ecgFeatures: ["Polymorphic VT", "Twisting QRS", "Long QT often present", "May be pulseless"],
    correctRhythm: "Torsades de Pointes",
    correctFirstAction: "Magnesium sulfate 25-50 mg/kg; defibrillate if pulseless",
    urgency: "immediate",
  },
];

export const RHYTHM_NAME_OPTIONS = [
  ...new Set(RHYTHM_STRIPS.map((s) => s.correctRhythm)),
  "Normal Sinus Rhythm",
  "Atrial Fibrillation",
];

export function scoreRhythmIdentify(
  strip: RhythmStrip,
  selectedRhythm: string,
  startTime: number
): { score: number; passed: boolean; events: PracticeLabEvent[] } {
  const correct = selectedRhythm === strip.correctRhythm;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  let score = correct ? 80 : 30;
  if (correct && elapsed <= 20) score += 20;

  return {
    score: Math.min(100, score),
    passed: correct && score >= 70,
    events: [
      { timestamp: elapsed, type: "identify", description: `Identified: ${selectedRhythm}`, correct },
      {
        timestamp: elapsed,
        type: "feedback",
        description: correct
          ? `Correct — ${strip.description}`
          : `Incorrect. This is ${strip.correctRhythm}. Key features: ${strip.ecgFeatures.slice(0, 2).join("; ")}`,
        correct,
      },
    ],
  };
}

export function scoreRhythmIdentifyAndAction(
  strip: RhythmStrip,
  selectedRhythm: string,
  selectedAction: string,
  startTime: number
): { score: number; passed: boolean; events: PracticeLabEvent[] } {
  const rhythmCorrect = selectedRhythm === strip.correctRhythm;
  const actionOk =
    strip.correctFirstAction != null && selectedAction === strip.correctFirstAction;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  let score = 0;
  if (rhythmCorrect) score += 50;
  if (actionOk) score += 50;
  if (rhythmCorrect && actionOk && elapsed <= 30) score = Math.min(100, score + 10);

  return {
    score: Math.min(100, score),
    passed: rhythmCorrect && actionOk && score >= 70,
    events: [
      { timestamp: elapsed, type: "identify", description: `Rhythm: ${selectedRhythm}`, correct: rhythmCorrect },
      {
        timestamp: elapsed,
        type: "action",
        description: `Action: ${selectedAction}`,
        correct: actionOk,
      },
    ],
  };
}

export const FIRST_ACTION_OPTIONS = [
  "Ensure oxygenation; epinephrine if HR <60 with poor perfusion",
  "Transcutaneous pacing; epinephrine infusion",
  "Vagal maneuvers if stable; adenosine or cardioversion if unstable",
  "Identify and treat underlying cause — do NOT cardiovert",
  "Amiodarone if stable; synchronized cardioversion if unstable",
  "CPR + defibrillate 2 J/kg (peds) or 120-200 J (adult)",
  "CPR + epinephrine — do NOT defibrillate",
  "CPR + epinephrine + treat reversible causes",
  "Magnesium sulfate 25-50 mg/kg; defibrillate if pulseless",
  "Rate control if stable; cardioversion if unstable",
];
