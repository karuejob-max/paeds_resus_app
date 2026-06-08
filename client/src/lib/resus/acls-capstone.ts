/**
 * ACLS Megacode Simulation Implementation (2025 Guidelines)
 * 
 * Includes:
 * - Systematic Approach (BLS/Primary/Secondary)
 * - Symptomatic/Unstable Bradycardia
 * - Tachyarrhythmia with a pulse (Stable/Unstable)
 * - Full Shockable rhythm (VF/pVT)
 * - PCAC (Post-Cardiac Arrest Care) with fever prevention focus
 */

export type ACLSPhase = 
  | "initial_assessment"
  | "bradycardia"
  | "tachycardia"
  | "cardiac_arrest_vf"
  | "cardiac_arrest_shock"
  | "post_rosc_pcac";

export interface PriorityIntervention {
  id: string;
  description: string;
  priority: number;
  critical: boolean;
}

export interface ACLSScenario {
  phase: ACLSPhase;
  description: string;
  correctOrder: string[];
  shuffledOrder: string[];
  interventions: Record<string, PriorityIntervention>;
  feedback: Record<string, string>;
}

export const ACLS_CAPSTONE_SCENARIOS: Record<ACLSPhase, ACLSScenario> = {
  initial_assessment: {
    phase: "initial_assessment",
    description: "65-year-old male found slumped in chair. Appears pale and diaphoretic. Initial BLS/Primary Survey needed.",
    correctOrder: ["check-responsiveness", "activate-emergency-response", "check-pulse-breathing", "start-cpr-if-needed", "attach-monitor-o2"],
    shuffledOrder: ["attach-monitor-o2", "check-pulse-breathing", "check-responsiveness", "start-cpr-if-needed", "activate-emergency-response"],
    interventions: {
      "check-responsiveness": { id: "check-responsiveness", description: "Check responsiveness (Tap and shout)", priority: 1, critical: true },
      "activate-emergency-response": { id: "activate-emergency-response", description: "Activate emergency response system/Get AED", priority: 2, critical: true },
      "check-pulse-breathing": { id: "check-pulse-breathing", description: "Check carotid pulse and breathing (5-10 sec)", priority: 3, critical: true },
      "start-cpr-if-needed": { id: "start-cpr-if-needed", description: "Start high-quality CPR if no pulse", priority: 4, critical: true },
      "attach-monitor-o2": { id: "attach-monitor-o2", description: "Attach monitor/defibrillator and apply O2", priority: 5, critical: true },
    },
    feedback: {
      "check-responsiveness": "Patient is unresponsive.",
      "activate-emergency-response": "Code Blue activated; crash cart arriving.",
      "check-pulse-breathing": "Weak pulse detected (~40/min), gasping respirations.",
      "start-cpr-if-needed": "Pulse present, but slow. Provide rescue breathing (1 breath every 6 sec).",
      "attach-monitor-o2": "Monitor shows sinus bradycardia at 38/min. SpO2 88%.",
    },
  },
  bradycardia: {
    phase: "bradycardia",
    description: "Patient is symptomatic: BP 80/40, diaphoretic, altered mental status. HR 38/min.",
    correctOrder: ["atropine-0-5mg", "transcutaneous-pacing", "dopamine-infusion", "epinephrine-infusion"],
    shuffledOrder: ["epinephrine-infusion", "transcutaneous-pacing", "atropine-0-5mg", "dopamine-infusion"],
    interventions: {
      "atropine-0-5mg": { id: "atropine-0-5mg", description: "Give Atropine 1 mg IV (Repeat every 3-5 min)", priority: 1, critical: true },
      "transcutaneous-pacing": { id: "transcutaneous-pacing", description: "Initiate Transcutaneous Pacing (TCP)", priority: 2, critical: true },
      "dopamine-infusion": { id: "dopamine-infusion", description: "Dopamine infusion (5-20 mcg/kg/min)", priority: 3, critical: false },
      "epinephrine-infusion": { id: "epinephrine-infusion", description: "Epinephrine infusion (2-10 mcg/min)", priority: 4, critical: false },
    },
    feedback: {
      "atropine-0-5mg": "Atropine 1 mg given. No significant change in HR.",
      "transcutaneous-pacing": "TCP initiated at 60/min. Electrical and mechanical capture confirmed.",
      "dopamine-infusion": "Dopamine prepared as alternative.",
      "epinephrine-infusion": "Epinephrine prepared as alternative.",
    },
  },
  tachycardia: {
    phase: "tachycardia",
    description: "Patient suddenly develops wide-complex tachycardia. HR 170/min, BP 75/40, chest pain present.",
    correctOrder: ["synchronized-cardioversion", "adenosine-if-regular", "antiarrhythmic-infusion", "expert-consultation"],
    shuffledOrder: ["expert-consultation", "adenosine-if-regular", "synchronized-cardioversion", "antiarrhythmic-infusion"],
    interventions: {
      "synchronized-cardioversion": { id: "synchronized-cardioversion", description: "Synchronized Cardioversion (100J wide/regular)", priority: 1, critical: true },
      "adenosine-if-regular": { id: "adenosine-if-regular", description: "Adenosine 6mg (only if regular and monomorphic)", priority: 2, critical: false },
      "antiarrhythmic-infusion": { id: "antiarrhythmic-infusion", description: "Amiodarone or Procainamide infusion", priority: 3, critical: false },
      "expert-consultation": { id: "expert-consultation", description: "Consult Cardiology", priority: 4, critical: false },
    },
    feedback: {
      "synchronized-cardioversion": "Cardioversion performed. Rhythm converts to Sinus Tachycardia.",
      "adenosine-if-regular": "Adenosine considered but cardioversion is priority for unstable patient.",
      "antiarrhythmic-infusion": "Infusion considered for maintenance.",
      "expert-consultation": "Cardiology notified.",
    },
  },
  cardiac_arrest_vf: {
    phase: "cardiac_arrest_vf",
    description: "Patient loses pulse. Monitor shows Ventricular Fibrillation (VF).",
    correctOrder: ["start-cpr", "shock-200j", "resume-cpr-immediately", "epinephrine-1mg", "amiodarone-300mg"],
    shuffledOrder: ["epinephrine-1mg", "resume-cpr-immediately", "start-cpr", "amiodarone-300mg", "shock-200j"],
    interventions: {
      "start-cpr": { id: "start-cpr", description: "Start high-quality CPR", priority: 1, critical: true },
      "shock-200j": { id: "shock-200j", description: "Deliver shock (Biphasic 200J)", priority: 2, critical: true },
      "resume-cpr-immediately": { id: "resume-cpr-immediately", description: "Resume CPR immediately for 2 minutes", priority: 3, critical: true },
      "epinephrine-1mg": { id: "epinephrine-1mg", description: "Epinephrine 1mg IV (every 3-5 min)", priority: 4, critical: true },
      "amiodarone-300mg": { id: "amiodarone-300mg", description: "Amiodarone 300mg IV (after 3rd shock)", priority: 5, critical: true },
    },
    feedback: {
      "start-cpr": "CPR in progress. Minimizing interruptions.",
      "shock-200j": "Shock delivered at 200J.",
      "resume-cpr-immediately": "CPR resumed for 2 minutes cycle.",
      "epinephrine-1mg": "Epinephrine 1mg given.",
      "amiodarone-300mg": "Amiodarone 300mg given for refractory VF.",
    },
  },
  cardiac_arrest_shock: {
    phase: "cardiac_arrest_shock",
    description: "After 2nd shock, rhythm remains VF. Continue ACLS Cardiac Arrest Algorithm.",
    correctOrder: ["cpr-cycle", "shock-200j-again", "epinephrine-again", "advanced-airway", "capnography"],
    shuffledOrder: ["capnography", "epinephrine-again", "shock-200j-again", "advanced-airway", "cpr-cycle"],
    interventions: {
      "cpr-cycle": { id: "cpr-cycle", description: "Continue CPR (100-120/min, 2-2.4 inches)", priority: 1, critical: true },
      "shock-200j-again": { id: "shock-200j-again", description: "Deliver 2nd shock (200J)", priority: 2, critical: true },
      "epinephrine-again": { id: "epinephrine-again", description: "Give 2nd dose of Epinephrine 1mg", priority: 3, critical: true },
      "advanced-airway": { id: "advanced-airway", description: "Consider Advanced Airway (ET tube or SGA)", priority: 4, critical: false },
      "capnography": { id: "capnography", description: "Quantitative Waveform Capnography", priority: 5, critical: true },
    },
    feedback: {
      "cpr-cycle": "High-quality CPR maintained.",
      "shock-200j-again": "2nd shock delivered.",
      "epinephrine-again": "Epinephrine 1mg repeated.",
      "advanced-airway": "ET tube placed and confirmed.",
      "capnography": "ETCO2 reading 15 mmHg, indicating adequate CPR.",
    },
  },
  post_rosc_pcac: {
    phase: "post_rosc_pcac",
    description: "ROSC achieved! Patient has a pulse. BP 90/60, SpO2 94%. Need Post-Cardiac Arrest Care.",
    correctOrder: ["optimize-ventilation", "treat-hypotension", "12-lead-ekg", "prevent-fever-pca", "neuro-prognostication"],
    shuffledOrder: ["prevent-fever-pca", "12-lead-ekg", "treat-hypotension", "neuro-prognostication", "optimize-ventilation"],
    interventions: {
      "optimize-ventilation": { id: "optimize-ventilation", description: "Optimize ventilation (SpO2 92-98%, ETCO2 35-45)", priority: 1, critical: true },
      "treat-hypotension": { id: "treat-hypotension", description: "Treat hypotension (IV bolus, vasopressors)", priority: 2, critical: true },
      "12-lead-ekg": { id: "12-lead-ekg", description: "Obtain 12-lead EKG (Check for STEMI)", priority: 3, critical: true },
      "prevent-fever-pca": { id: "prevent-fever-pca", description: "Prevent fever (>37.5°C) for 36-72 hours PCA", priority: 4, critical: true },
      "neuro-prognostication": { id: "neuro-prognostication", description: "Delay neuro-prognostication for 72 hours", priority: 5, critical: false },
    },
    feedback: {
      "optimize-ventilation": "Ventilation optimized. ETCO2 40 mmHg.",
      "treat-hypotension": "BP stable at 100/70 after 1L NS bolus.",
      "12-lead-ekg": "EKG shows no STEMI.",
      "prevent-fever-pca": "Active temperature management initiated per 2025 guidelines.",
      "neuro-prognostication": "Neurology consult scheduled for 72h post-ROSC.",
    },
  },
};

export function calculateACLSScore(
  phase: ACLSPhase,
  userOrder: string[]
): { score: number; passed: boolean; feedback: string[] } {
  const scenario = ACLS_CAPSTONE_SCENARIOS[phase];
  const correctOrder = scenario.correctOrder;
  
  const criticalIds = Object.entries(scenario.interventions)
    .filter(([, intervention]) => intervention.critical)
    .map(([id]) => id);
  
  const missingCritical = criticalIds.filter((id) => !userOrder.includes(id));
  
  let positionalPoints = 0;
  userOrder.forEach((id, index) => {
    const correctIdx = correctOrder.indexOf(id);
    if (correctIdx === index) {
      positionalPoints += 1.0;
    } else if (Math.abs(correctIdx - index) <= 1) {
      positionalPoints += 0.5;
    }
  });
  
  const baseScore = (positionalPoints / correctOrder.length) * 100;
  const criticalPenalty = (missingCritical.length / criticalIds.length) * 40;
  const finalScore = Math.max(0, Math.round(baseScore - criticalPenalty));
  
  const passed = finalScore >= 50 && missingCritical.length === 0;
  
  const feedbackMessages = [];
  if (missingCritical.length > 0) {
    feedbackMessages.push(`Missing critical steps: ${missingCritical.map(id => scenario.interventions[id].description).join(", ")}.`);
  } else if (finalScore < 50) {
    feedbackMessages.push("ACLS Systematic Approach is vital. Ensure your order follows the priority of life-saving interventions.");
  } else {
    feedbackMessages.push("Excellent prioritization! You are following the ACLS Megacode algorithm correctly.");
  }
  
  return {
    score: finalScore,
    passed,
    feedback: feedbackMessages,
  };
}
