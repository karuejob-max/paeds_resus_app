/**
 * Fixed diagnostic baseline banks for AHA cognitive courses (BLS / ACLS / PALS / NRP).
 * AHA 2025-aligned content only — not fellowship clinical modules (DKA/ISPAD, etc.).
 */
import type { AhaAnchorProgramType } from "../lib/resolve-aha-course-anchor";

export type AhaDiagnosticQuestionSeed = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

export const AHA_DIAGNOSTIC_MIN_QUESTIONS = 10;

const blsBank: AhaDiagnosticQuestionSeed[] = [
  {
    question: "What compression rate is recommended for adult high-quality CPR?",
    options: ["60–80/min", "80–100/min", "100–120/min", "120–140/min"],
    correctAnswer: "100–120/min",
    explanation: "AHA guidelines specify 100–120 compressions per minute for all ages.",
  },
  {
    question: "What is the minimum recommended compression depth for an adult?",
    options: ["At least 1 inch", "At least 1.5 inches", "At least 2 inches (5 cm)", "At least 3 inches"],
    correctAnswer: "At least 2 inches (5 cm)",
    explanation: "Adult depth is at least 2 inches (5 cm), not exceeding 2.4 inches (6 cm).",
  },
  {
    question: "For adult BLS without an advanced airway, what compression-to-ventilation ratio is used?",
    options: ["15:2", "30:2", "30:1", "Continuous compressions only"],
    correctAnswer: "30:2",
    explanation: "30:2 applies for 1- and 2-rescuer adult BLS when no advanced airway is in place.",
  },
  {
    question: "When should compressors switch during prolonged CPR?",
    options: ["Every 10 minutes", "Every 2 minutes", "Only when fatigued", "Every 5 cycles only"],
    correctAnswer: "Every 2 minutes",
    explanation: "Switch every 2 minutes to limit fatigue and maintain compression quality.",
  },
  {
    question: "Untrained bystanders should generally perform:",
    options: ["Compression-only CPR", "Rescue breaths only", "No CPR until EMS arrives", "AED first, no compressions"],
    correctAnswer: "Compression-only CPR",
    explanation: "Compression-only CPR is recommended for untrained bystanders.",
  },
  {
    question: "Infant compression depth should be approximately:",
    options: ["1 inch (2.5 cm)", "1.5 inches (4 cm)", "2 inches (5 cm)", "2.4 inches (6 cm)"],
    correctAnswer: "1.5 inches (4 cm)",
    explanation: "Infant depth is about one-third AP diameter, roughly 1.5 inches (4 cm).",
  },
  {
    question: "For 2-rescuer infant/child CPR without an advanced airway, the ratio is:",
    options: ["30:2", "15:2", "10:1", "5:1"],
    correctAnswer: "15:2",
    explanation: "15:2 is used for 2-rescuer infant and child CPR without an advanced airway.",
  },
  {
    question: "After AED pad placement, the rescuer should:",
    options: ["Touch the victim during analysis", "Clear the victim before shock delivery", "Remove pads before CPR", "Wait 5 minutes before CPR"],
    correctAnswer: "Clear the victim before shock delivery",
    explanation: "No one should touch the victim during rhythm analysis or shock delivery.",
  },
  {
    question: "High-quality CPR emphasizes:",
    options: ["Slow deep compressions with long pauses", "Full chest recoil and minimal interruptions", "Ventilation over compressions", "Leaning on the chest between compressions"],
    correctAnswer: "Full chest recoil and minimal interruptions",
    explanation: "Allow full recoil and keep interruptions brief to maximize perfusion.",
  },
  {
    question: "Cardiac arrest in an adult is best recognized by:",
    options: ["Normal breathing only", "Unresponsiveness and absent or abnormal breathing", "Mild chest pain", "Weak radial pulse only"],
    correctAnswer: "Unresponsiveness and absent or abnormal breathing",
    explanation: "Check responsiveness and breathing; gasping is not normal breathing.",
  },
  {
    question: "When an advanced airway is in place during adult CPR, ventilations are given:",
    options: ["1 breath every 6 seconds", "2 breaths every 30 compressions", "1 breath every 2 seconds", "Only after ROSC"],
    correctAnswer: "1 breath every 6 seconds",
    explanation: "With an advanced airway: 1 breath every 6 seconds (10/min), asynchronous with compressions.",
  },
  {
    question: "Relief of choking in a responsive adult begins with:",
    options: ["Blind finger sweeps", "Abdominal thrusts (Heimlich)", "Immediate CPR", "Back blows only in all cases"],
    correctAnswer: "Abdominal thrusts (Heimlich)",
    explanation: "For responsive adults with severe airway obstruction, abdominal thrusts are recommended.",
  },
];

const aclsBank: AhaDiagnosticQuestionSeed[] = [
  {
    question: "The first step in the ACLS cardiac arrest algorithm is:",
    options: ["Defibrillation", "Start CPR and attach monitor/defibrillator", "Give amiodarone", "Intubate immediately"],
    correctAnswer: "Start CPR and attach monitor/defibrillator",
    explanation: "Begin CPR immediately while applying pads and identifying rhythm.",
  },
  {
    question: "For shockable rhythms (VF/pVT), the initial biphasic shock energy for adults is typically:",
    options: ["50 J", "120–200 J (device-specific)", "360 J monophasic only", "10 J"],
    correctAnswer: "120–200 J (device-specific)",
    explanation: "Use manufacturer-recommended energy for biphasic defibrillators.",
  },
  {
    question: "Epinephrine 1 mg IV/IO during adult cardiac arrest is given:",
    options: ["Only after ROSC", "Every 3–5 minutes", "Once only", "Every 10 minutes"],
    correctAnswer: "Every 3–5 minutes",
    explanation: "Epinephrine 1 mg is repeated every 3–5 minutes during arrest.",
  },
  {
    question: "Asystole or PEA should be treated with:",
    options: ["Immediate defibrillation", "CPR, epinephrine, and treat reversible causes", "Synchronized cardioversion", "Adenosine 6 mg rapid push"],
    correctAnswer: "CPR, epinephrine, and treat reversible causes",
    explanation: "Non-shockable rhythms require CPR, drugs, and H's/T's evaluation.",
  },
  {
    question: "A key post-ROSC priority is:",
    options: ["Hyperventilation to 100% SpO2 always", "Optimize oxygenation, ventilation, and blood pressure", "Stop all monitoring", "Discharge when pulse returns"],
    correctAnswer: "Optimize oxygenation, ventilation, and blood pressure",
    explanation: "Post-ROSC care targets perfusion and prevents secondary injury.",
  },
  {
    question: "Tachycardia with pulses and instability may require:",
    options: ["Observation only", "Synchronized cardioversion", "Routine oral fluids", "Delayed treatment for 24 h"],
    correctAnswer: "Synchronized cardioversion",
    explanation: "Unstable tachycardia with a pulse is treated with synchronized cardioversion when indicated.",
  },
  {
    question: "Bradycardia with poor perfusion despite atropine may require:",
    options: ["Transcutaneous pacing", "Defibrillation", "Magnesium only", "No treatment"],
    correctAnswer: "Transcutaneous pacing",
    explanation: "Symptomatic bradycardia unresponsive to atropine may need pacing.",
  },
  {
    question: "Amiodarone 300 mg IV push is used in:",
    options: ["Stable narrow-complex tachycardia", "Refractory VF/pVT", "Asystole first line", "Routine hypertension"],
    correctAnswer: "Refractory VF/pVT",
    explanation: "Amiodarone is given for refractory shockable rhythms during arrest.",
  },
  {
    question: "During CPR, capnography (ETCO2) can help by:",
    options: ["Replacing pulse checks entirely", "Confirming airway placement and CPR quality", "Measuring potassium", "Diagnosing stroke"],
    correctAnswer: "Confirming airway placement and CPR quality",
    explanation: "Sudden rise in ETCO2 may indicate ROSC; low values suggest poor perfusion.",
  },
  {
    question: "Reversible causes of arrest (H's and T's) include:",
    options: ["Hypovolemia and tension pneumothorax", "Hypertension only", "Happiness and hunger", "Hypothermia excluded"],
    correctAnswer: "Hypovolemia and tension pneumothorax",
    explanation: "Treat hypoxia, hypovolemia, tension pneumothorax, tamponade, toxins, thrombosis, etc.",
  },
  {
    question: "For suspected stroke, time-critical actions include:",
    options: ["Delay imaging for 24 h", "Rapid assessment and CT when indicated", "Routine discharge", "Only give aspirin to all patients immediately"],
    correctAnswer: "Rapid assessment and CT when indicated",
    explanation: "Stroke pathways emphasize rapid neuro assessment and imaging per protocol.",
  },
  {
    question: "Team leadership during ACLS should use:",
    options: ["Silent orders", "Clear roles and closed-loop communication", "Single rescuer only", "No debrief"],
    correctAnswer: "Clear roles and closed-loop communication",
    explanation: "Closed-loop communication reduces errors during resuscitation.",
  },
];

const palsBank: AhaDiagnosticQuestionSeed[] = [
  {
    question: "The Pediatric Assessment Triangle (PAT) includes:",
    options: ["Appearance, Work of Breathing, Circulation to Skin", "Labs, Imaging, Disposition", "Airway only", "BP, HR, RR only"],
    correctAnswer: "Appearance, Work of Breathing, Circulation to Skin",
    explanation: "PAT is a rapid visual assessment before hands-on evaluation.",
  },
  {
    question: "The primary hands-on assessment sequence in PALS is:",
    options: ["Exposure → Disability → Airway", "Airway → Breathing → Circulation → Disability → Exposure", "Circulation first always", "Disposition before treatment"],
    correctAnswer: "Airway → Breathing → Circulation → Disability → Exposure",
    explanation: "ABCDE addresses life threats in order.",
  },
  {
    question: "For 2-rescuer child CPR without an advanced airway, the compression-to-ventilation ratio is:",
    options: ["30:2", "15:2", "5:1", "Continuous compressions with 1 breath every 6 s"],
    correctAnswer: "15:2",
    explanation: "15:2 for 2-rescuer infant/child BLS without advanced airway.",
  },
  {
    question: "Compensated shock in children may present with:",
    options: ["Normal blood pressure and tachycardia", "Immediate hypotension only", "Bradycardia always", "Isolated fever"],
    correctAnswer: "Normal blood pressure and tachycardia",
    explanation: "Children maintain BP until late decompensation; tachycardia and poor perfusion are early signs.",
  },
  {
    question: "Impending respiratory failure may include:",
    options: ["Mild cough only", "Altered mental status and worsening work of breathing", "Normal SpO2 always", "Isolated rash"],
    correctAnswer: "Altered mental status and worsening work of breathing",
    explanation: "Fatigue and altered consciousness signal need for advanced support.",
  },
  {
    question: "Unstable supraventricular tachycardia in a child is treated with:",
    options: ["Observation", "Synchronized cardioversion", "Routine antibiotics", "Oral fluids only"],
    correctAnswer: "Synchronized cardioversion",
    explanation: "Unstable tachyarrhythmias require immediate synchronized cardioversion.",
  },
  {
    question: "For pediatric cardiac arrest with a non-shockable rhythm, epinephrine should be given:",
    options: ["Only after 10 minutes of CPR", "As soon as IV/IO access is available", "Never in children", "Only if hypotensive after ROSC"],
    correctAnswer: "As soon as IV/IO access is available",
    explanation: "Early epinephrine is emphasized for asystole/PEA in pediatric arrest.",
  },
  {
    question: "The first shock dose for pediatric VF/pVT is typically:",
    options: ["2 J/kg", "10 J/kg", "50 J fixed", "200 J adult dose"],
    correctAnswer: "2 J/kg",
    explanation: "Initial defibrillation is 2 J/kg; escalate per protocol.",
  },
  {
    question: "Post-ROSC care in children prioritizes:",
    options: ["Avoiding all monitoring", "Oxygenation, ventilation, and perfusion", "Immediate discharge", "Hypothermia induction in all cases"],
    correctAnswer: "Oxygenation, ventilation, and perfusion",
    explanation: "Stabilize oxygenation, ventilation, and hemodynamics after ROSC.",
  },
  {
    question: "Closed-loop communication means:",
    options: ["Orders are repeated back and confirmed", "Only the leader speaks", "No verbal confirmation", "Skip debrief"],
    correctAnswer: "Orders are repeated back and confirmed",
    explanation: "Repeat-back reduces errors during emergencies.",
  },
  {
    question: "A reversible cause of pediatric arrest (H's) includes:",
    options: ["Hypoglycemia", "Hyperthermia only", "Happiness", "Hypertension only"],
    correctAnswer: "Hypoglycemia",
    explanation: "Hypoglycemia is a treatable H-factor in infants and children.",
  },
  {
    question: "High-quality pediatric CPR emphasizes:",
    options: ["Slow compressions with leaning", "Rate 100–120/min and full chest recoil", "Ventilation without compressions", "Pauses after every compression"],
    correctAnswer: "Rate 100–120/min and full chest recoil",
    explanation: "Compress at least one-third AP diameter with full recoil.",
  },
];

const nrpBank: AhaDiagnosticQuestionSeed[] = [
  {
    question: "The first step when a baby is born and needs resuscitation is:",
    options: ["Intubate immediately", "Warm, dry, stimulate, and position the airway", "Chest compressions first", "Umbilical vein epinephrine"],
    correctAnswer: "Warm, dry, stimulate, and position the airway",
    explanation: "Initial steps: warmth, drying, stimulation, and airway positioning.",
  },
  {
    question: "Heart rate is the primary determinant to escalate NRP interventions because:",
    options: ["It reflects effective ventilation and perfusion", "It is hard to measure", "Color alone is sufficient", "BP cuff is always accurate in neonates"],
    correctAnswer: "It reflects effective ventilation and perfusion",
    explanation: "HR guides need for ventilation, compressions, and medications.",
  },
  {
    question: "If HR remains below 100 despite adequate ventilation, the next step is:",
    options: ["Stop all support", "Improve ventilation and consider compressions if HR < 60", "Defibrillate immediately", "Discharge to mother"],
    correctAnswer: "Improve ventilation and consider compressions if HR < 60",
    explanation: "Correct ventilation is priority; compressions if HR < 60 despite effective ventilation.",
  },
  {
    question: "Positive-pressure ventilation in NRP is typically initiated with:",
    options: ["Room air or blended oxygen per protocol", "100% oxygen always", "No ventilation until intubation", "Nasal cannula only"],
    correctAnswer: "Room air or blended oxygen per protocol",
    explanation: "Use oxygen appropriately; titrate per current NRP guidance.",
  },
  {
    question: "Chest compressions in neonatal resuscitation use a ratio of:",
    options: ["3:1 compressions to ventilations", "30:2", "15:2 only", "Continuous compressions without breaths"],
    correctAnswer: "3:1 compressions to ventilations",
    explanation: "Neonatal resuscitation uses 3:1 when compressions are required.",
  },
  {
    question: "The preferred route for emergency medications in NRP is:",
    options: ["Umbilical vein IV", "IM deltoid", "Oral", "Subcutaneous thigh"],
    correctAnswer: "Umbilical vein IV",
    explanation: "UVC provides rapid access during neonatal resuscitation.",
  },
  {
    question: "Meconium-stained amniotic fluid management emphasizes:",
    options: ["Routine intubation for all", "Warmth and ventilation; intubation if airway obstructed", "No stimulation", "Delay drying for 10 minutes"],
    correctAnswer: "Warmth and ventilation; intubation if airway obstructed",
    explanation: "Focus on ventilation; suction trachea if airway blocked and equipment/skills available.",
  },
  {
    question: "Epinephrine in neonatal resuscitation is indicated when:",
    options: ["HR remains < 60 despite adequate ventilation and compressions", "Baby is crying vigorously", "HR is 120", "Only for term infants > 4 kg"],
    correctAnswer: "HR remains < 60 despite adequate ventilation and compressions",
    explanation: "Epinephrine when HR stays < 60 after ventilation and compressions.",
  },
  {
    question: "Preventing hypothermia in newborns is important because:",
    options: ["It worsens oxygen consumption and resuscitation outcomes", "It has no effect", "It increases HR always", "It replaces ventilation"],
    correctAnswer: "It worsens oxygen consumption and resuscitation outcomes",
    explanation: "Heat loss increases metabolic demand; maintain temperature.",
  },
  {
    question: "Effective bag-mask ventilation requires:",
    options: ["Proper mask seal and chest rise with each breath", "Fast breaths without watching chest", "Compression of abdomen", "Only nasal pressure"],
    correctAnswer: "Proper mask seal and chest rise with each breath",
    explanation: "Reposition airway and seal if chest does not rise.",
  },
  {
    question: "After resuscitation, post-stabilization care includes:",
    options: ["Monitoring, glucose check, and safe transfer", "Immediate discharge", "No family communication", "Stop all vitals"],
    correctAnswer: "Monitoring, glucose check, and safe transfer",
    explanation: "Post-resuscitation care includes monitoring and glucose assessment.",
  },
  {
    question: "Anticipation and preparation for resuscitation should occur:",
    options: ["Before delivery when risk factors are present", "Only after 10 minutes of life", "Never in low-risk births", "Only in NICU"],
    correctAnswer: "Before delivery when risk factors are present",
    explanation: "Team briefing and equipment checks reduce delays at birth.",
  },
];

const BANKS: Record<AhaAnchorProgramType, AhaDiagnosticQuestionSeed[]> = {
  bls: blsBank,
  acls: aclsBank,
  pals: palsBank,
  nrp: nrpBank,
  heartsaver: blsBank.slice(0, 12),
};

export function getAhaDiagnosticBank(programType: AhaAnchorProgramType): AhaDiagnosticQuestionSeed[] {
  return BANKS[programType] ?? blsBank;
}
