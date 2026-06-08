/**
 * Clean PALS Capstone Implementation
 * 
 * This module provides a simplified capstone system that:
 * - Gates certificate issuance (not module access)
 * - Allows full navigation to previous modules
 * - Persists resume state without blocking
 * - Uses priority-based intervention ordering
 */

export type ClinicalPhase = 
  | "pat" 
  | "airway" 
  | "breathing" 
  | "circulation" 
  | "disability" 
  | "exposure" 
  | "sample" 
  | "cardiac_arrest" 
  | "post_rosc";

export interface PriorityIntervention {
  id: string;
  description: string;
  priority: number; // 1 = highest priority
  critical: boolean; // true if must be selected to pass
}

export interface ClinicalScenario {
  phase: ClinicalPhase;
  description: string;
  correctOrder: string[]; // intervention IDs in correct order
  shuffledOrder: string[]; // randomized for display
  interventions: Record<string, PriorityIntervention>;
  feedback: Record<string, string>; // per intervention
}

export const PALS_CAPSTONE_SCENARIOS: Record<ClinicalPhase, ClinicalScenario> = {
  pat: {
    phase: "pat",
    description: "2-year-old presenting with rapid breathing and pale appearance. Respiratory rate 60/min, HR 160/min, BP 90/60.",
    correctOrder: ["assess-airway", "assess-breathing", "assess-circulation", "assess-mental-status", "assess-skin"],
    shuffledOrder: ["assess-circulation", "assess-airway", "assess-skin", "assess-breathing", "assess-mental-status"],
    interventions: {
      "assess-airway": { id: "assess-airway", description: "Assess airway patency", priority: 1, critical: true },
      "assess-breathing": { id: "assess-breathing", description: "Assess breathing adequacy", priority: 2, critical: true },
      "assess-circulation": { id: "assess-circulation", description: "Assess circulation/perfusion", priority: 3, critical: true },
      "assess-mental-status": { id: "assess-mental-status", description: "Assess mental status (AVPU)", priority: 4, critical: false },
      "assess-skin": { id: "assess-skin", description: "Assess skin color and temperature", priority: 5, critical: false },
    },
    feedback: {
      "assess-airway": "Airway is patent, no stridor or obstruction.",
      "assess-breathing": "Tachypnea with increased work of breathing, possible pneumonia.",
      "assess-circulation": "Tachycardia, delayed capillary refill (>2 sec), poor perfusion.",
      "assess-mental-status": "Alert but anxious.",
      "assess-skin": "Pale, cool extremities suggesting shock.",
    },
  },
  airway: {
    phase: "airway",
    description: "Child remains tachypneic with stridor. Oxygen saturation 88% on room air.",
    correctOrder: ["apply-oxygen", "position-airway", "prepare-equipment", "monitor-airway"],
    shuffledOrder: ["prepare-equipment", "apply-oxygen", "monitor-airway", "position-airway"],
    interventions: {
      "apply-oxygen": { id: "apply-oxygen", description: "Apply high-flow oxygen (10-15 L/min)", priority: 1, critical: true },
      "position-airway": { id: "position-airway", description: "Position airway (sniffing position)", priority: 2, critical: true },
      "prepare-equipment": { id: "prepare-equipment", description: "Prepare airway equipment", priority: 3, critical: false },
      "monitor-airway": { id: "monitor-airway", description: "Monitor for airway compromise", priority: 4, critical: false },
    },
    feedback: {
      "apply-oxygen": "SpO2 improves to 94% with high-flow oxygen.",
      "position-airway": "Airway positioned, stridor slightly improved.",
      "prepare-equipment": "Equipment ready for potential intubation.",
      "monitor-airway": "Continuous monitoring for deterioration.",
    },
  },
  breathing: {
    phase: "breathing",
    description: "Oxygen saturation now 94%, but respiratory rate remains 55/min with retractions.",
    correctOrder: ["assess-breath-sounds", "check-chest-movement", "assess-work-of-breathing", "consider-support"],
    shuffledOrder: ["consider-support", "assess-breath-sounds", "assess-work-of-breathing", "check-chest-movement"],
    interventions: {
      "assess-breath-sounds": { id: "assess-breath-sounds", description: "Auscultate breath sounds bilaterally", priority: 1, critical: true },
      "check-chest-movement": { id: "check-chest-movement", description: "Check chest wall movement symmetry", priority: 2, critical: true },
      "assess-work-of-breathing": { id: "assess-work-of-breathing", description: "Assess work of breathing (retractions, nasal flare)", priority: 3, critical: true },
      "consider-support": { id: "consider-support", description: "Consider respiratory support if needed", priority: 4, critical: false },
    },
    feedback: {
      "assess-breath-sounds": "Bilateral crackles throughout, consistent with pneumonia.",
      "check-chest-movement": "Symmetric chest movement, no unilateral findings.",
      "assess-work-of-breathing": "Significant intercostal and subcostal retractions.",
      "consider-support": "May need assisted ventilation if deteriorates.",
    },
  },
  circulation: {
    phase: "circulation",
    description: "Child remains pale with delayed capillary refill. HR 160/min, BP 88/55. Urine output decreased.",
    correctOrder: ["establish-iv-access", "fluid-bolus", "assess-perfusion", "monitor-vitals"],
    shuffledOrder: ["monitor-vitals", "establish-iv-access", "assess-perfusion", "fluid-bolus"],
    interventions: {
      "establish-iv-access": { id: "establish-iv-access", description: "Establish IV access (2 large-bore lines)", priority: 1, critical: true },
      "fluid-bolus": { id: "fluid-bolus", description: "Administer 20 mL/kg normal saline bolus", priority: 2, critical: true },
      "assess-perfusion": { id: "assess-perfusion", description: "Reassess perfusion after bolus", priority: 3, critical: true },
      "monitor-vitals": { id: "monitor-vitals", description: "Continuous vital sign monitoring", priority: 4, critical: false },
    },
    feedback: {
      "establish-iv-access": "Two 20-gauge IVs established successfully.",
      "fluid-bolus": "20 mL/kg (400 mL) normal saline infused over 15 minutes.",
      "assess-perfusion": "Perfusion improves slightly; HR now 145/min, CRT 2 sec.",
      "monitor-vitals": "Continuous monitoring shows persistent tachycardia and borderline BP.",
    },
  },
  disability: {
    phase: "disability",
    description: "Child remains alert but increasingly irritable. Pupils equal and reactive. No focal neurologic deficits.",
    correctOrder: ["assess-consciousness", "check-pupils", "assess-motor", "assess-sensory"],
    shuffledOrder: ["assess-sensory", "assess-consciousness", "check-pupils", "assess-motor"],
    interventions: {
      "assess-consciousness": { id: "assess-consciousness", description: "Assess level of consciousness (AVPU/GCS)", priority: 1, critical: true },
      "check-pupils": { id: "check-pupils", description: "Check pupil size and reactivity", priority: 2, critical: true },
      "assess-motor": { id: "assess-motor", description: "Assess motor response and tone", priority: 3, critical: false },
      "assess-sensory": { id: "assess-sensory", description: "Assess sensory response", priority: 4, critical: false },
    },
    feedback: {
      "assess-consciousness": "Alert but increasingly irritable, GCS 14/15.",
      "check-pupils": "Pupils 3mm, equal, round, reactive to light.",
      "assess-motor": "Normal motor tone, moves all extremities.",
      "assess-sensory": "Responds to voice and touch appropriately.",
    },
  },
  exposure: {
    phase: "exposure",
    description: "Full body examination reveals petechial rash on trunk and extremities, not blanching with pressure.",
    correctOrder: ["inspect-skin", "check-rash-characteristics", "assess-lymph-nodes", "note-findings"],
    shuffledOrder: ["note-findings", "check-rash-characteristics", "inspect-skin", "assess-lymph-nodes"],
    interventions: {
      "inspect-skin": { id: "inspect-skin", description: "Inspect entire skin surface", priority: 1, critical: true },
      "check-rash-characteristics": { id: "check-rash-characteristics", description: "Assess rash (blanching vs non-blanching)", priority: 2, critical: true },
      "assess-lymph-nodes": { id: "assess-lymph-nodes", description: "Palpate lymph nodes", priority: 3, critical: false },
      "note-findings": { id: "note-findings", description: "Document all findings", priority: 4, critical: false },
    },
    feedback: {
      "inspect-skin": "Petechial rash visible on trunk and extremities.",
      "check-rash-characteristics": "Non-blanching petechiae—concerning for meningococcal disease.",
      "assess-lymph-nodes": "Cervical lymphadenopathy present.",
      "note-findings": "Findings suggest meningococcal sepsis; escalate care immediately.",
    },
  },
  sample: {
    phase: "sample",
    description: "Obtaining SAMPLE history from parents.",
    correctOrder: ["signs-symptoms", "allergies", "medications", "last-meal", "events"],
    shuffledOrder: ["events", "medications", "signs-symptoms", "last-meal", "allergies"],
    interventions: {
      "signs-symptoms": { id: "signs-symptoms", description: "Obtain signs and symptoms", priority: 1, critical: true },
      "allergies": { id: "allergies", description: "Ask about allergies", priority: 2, critical: true },
      "medications": { id: "medications", description: "List current medications", priority: 3, critical: true },
      "last-meal": { id: "last-meal", description: "Determine last meal/drink", priority: 4, critical: false },
      "events": { id: "events", description: "Clarify events leading to presentation", priority: 5, critical: false },
    },
    feedback: {
      "signs-symptoms": "Fever (39.5°C) for 2 days, rapid breathing, decreased activity.",
      "allergies": "NKDA (no known drug allergies).",
      "medications": "No chronic medications.",
      "last-meal": "Ate breakfast 3 hours ago.",
      "events": "Fever started 2 days ago; rapid deterioration in last 4 hours.",
    },
  },
  cardiac_arrest: {
    phase: "cardiac_arrest",
    description: "Child suddenly becomes unresponsive. No pulse palpable. Gasping respirations. ACTIVATE ERT IMMEDIATELY.",
    correctOrder: ["shout-for-help", "check-pulse", "start-cpr", "attach-defib", "charge-defib"],
    shuffledOrder: ["charge-defib", "start-cpr", "attach-defib", "shout-for-help", "check-pulse"],
    interventions: {
      "shout-for-help": { id: "shout-for-help", description: "Shout for help and activate ERT", priority: 1, critical: true },
      "check-pulse": { id: "check-pulse", description: "Check pulse and breathing (<10 seconds)", priority: 2, critical: true },
      "start-cpr": { id: "start-cpr", description: "Start CPR: 30 compressions, 2 ventilations", priority: 3, critical: true },
      "attach-defib": { id: "attach-defib", description: "Attach defibrillator pads", priority: 4, critical: true },
      "charge-defib": { id: "charge-defib", description: "Charge defibrillator (2 J/kg)", priority: 5, critical: true },
    },
    feedback: {
      "shout-for-help": "ERT activated; team arriving.",
      "check-pulse": "No pulse, no breathing—confirm cardiac arrest.",
      "start-cpr": "CPR started at 100-120 compressions/min.",
      "attach-defib": "Defibrillator pads applied to chest.",
      "charge-defib": "Defibrillator charged to 20 J (2 J/kg for 10 kg child).",
    },
  },
  post_rosc: {
    phase: "post_rosc",
    description: "After 2 minutes of CPR and one shock, child has return of spontaneous circulation (ROSC). HR 110/min, BP 95/60, SpO2 95%.",
    correctOrder: ["secure-airway", "optimize-ventilation", "establish-access", "give-epinephrine", "therapeutic-hypothermia"],
    shuffledOrder: ["therapeutic-hypothermia", "establish-access", "secure-airway", "give-epinephrine", "optimize-ventilation"],
    interventions: {
      "secure-airway": { id: "secure-airway", description: "Secure airway (intubate if trained)", priority: 1, critical: true },
      "optimize-ventilation": { id: "optimize-ventilation", description: "Optimize ventilation (ETCO2 35-45 mmHg)", priority: 2, critical: true },
      "establish-access": { id: "establish-access", description: "Establish central line if not done", priority: 3, critical: true },
      "give-epinephrine": { id: "give-epinephrine", description: "Give epinephrine 0.01 mg/kg IV", priority: 4, critical: true },
      "therapeutic-hypothermia": { id: "therapeutic-hypothermia", description: "Initiate therapeutic hypothermia (32-34°C)", priority: 5, critical: false },
    },
    feedback: {
      "secure-airway": "Endotracheal tube placed; breath sounds confirmed bilaterally.",
      "optimize-ventilation": "Ventilation optimized; ETCO2 40 mmHg.",
      "establish-access": "Central line established.",
      "give-epinephrine": "Epinephrine 0.1 mg (0.01 mg/kg) given IV.",
      "therapeutic-hypothermia": "Cooling protocol initiated; target 33°C over 6 hours.",
    },
  },
};

export function calculatePriorityScore(
  phase: ClinicalPhase,
  userOrder: string[]
): { score: number; passed: boolean; feedback: string[] } {
  const scenario = PALS_CAPSTONE_SCENARIOS[phase];
  const correctOrder = scenario.correctOrder;
  
  // More forgiving scoring:
  // 1. Critical interventions are required but missing them gives partial feedback instead of zero.
  // 2. Score is based on "Priority proximity" - being close to the correct position still earns points.
  
  const criticalIds = Object.entries(scenario.interventions)
    .filter(([, intervention]) => intervention.critical)
    .map(([id]) => id);
  
  const missingCritical = criticalIds.filter((id) => !userOrder.includes(id));
  
  // Base score on correct positions
  let positionalPoints = 0;
  userOrder.forEach((id, index) => {
    const correctIdx = correctOrder.indexOf(id);
    if (correctIdx === index) {
      positionalPoints += 1.0; // Perfect match
    } else if (Math.abs(correctIdx - index) <= 1) {
      positionalPoints += 0.5; // Off by one - partial credit for systematic approach
    }
  });
  
  const baseScore = (positionalPoints / correctOrder.length) * 100;
  
  // Penalize missing critical items but don't zero the score unless major items are missing
  const criticalPenalty = (missingCritical.length / criticalIds.length) * 40;
  const finalScore = Math.max(0, Math.round(baseScore - criticalPenalty));
  
  // Passing threshold is 50% for a more supportive experience
  const passed = finalScore >= 50 && missingCritical.length === 0;
  
  const feedbackMessages = [];
  if (missingCritical.length > 0) {
    feedbackMessages.push(`Missing critical steps: ${missingCritical.map(id => scenario.interventions[id].description).join(", ")}.`);
  } else if (finalScore < 50) {
    feedbackMessages.push("Systematic approach (ABCDE) is key. Ensure your order follows the priority of life-saving interventions.");
  } else {
    feedbackMessages.push("Excellent prioritization! You are following the systematic approach correctly.");
  }
  
  return {
    score: finalScore,
    passed,
    feedback: feedbackMessages,
  };
}
