/**
 * NRP Capstone Simulation Implementation (2025 Guidelines)
 * 
 * Focus:
 * - Initial Stabilization
 * - Positive Pressure Ventilation (PPV)
 * - Chest Compressions
 * - Medications (Epinephrine)
 */

export type NRPPhase = 
  | "initial_steps"
  | "ppv_ventilation"
  | "mr_sopa"
  | "compressions"
  | "medications";

export interface PriorityIntervention {
  id: string;
  description: string;
  priority: number;
  critical: boolean;
}

export interface NRPScenario {
  phase: NRPPhase;
  description: string;
  correctOrder: string[];
  shuffledOrder: string[];
  interventions: Record<string, PriorityIntervention>;
  feedback: Record<string, string>;
}

export const NRP_CAPSTONE_SCENARIOS: Record<NRPPhase, NRPScenario> = {
  initial_steps: {
    phase: "initial_steps",
    description: "Term infant born via vaginal delivery. Limp, not crying, poor muscle tone.",
    correctOrder: ["warm-dry-stimulate", "position-airway-suction", "evaluate-hr-breathing", "check-spo2-monitor"],
    shuffledOrder: ["check-spo2-monitor", "warm-dry-stimulate", "evaluate-hr-breathing", "position-airway-suction"],
    interventions: {
      "warm-dry-stimulate": { id: "warm-dry-stimulate", description: "Warm, dry, and stimulate the infant", priority: 1, critical: true },
      "position-airway-suction": { id: "position-airway-suction", description: "Position airway and suction (if needed)", priority: 2, critical: true },
      "evaluate-hr-breathing": { id: "evaluate-hr-breathing", description: "Evaluate heart rate and breathing", priority: 3, critical: true },
      "check-spo2-monitor": { id: "check-spo2-monitor", description: "Apply pulse oximeter and consider ECG", priority: 4, critical: true },
    },
    feedback: {
      "warm-dry-stimulate": "Infant dried and stimulated; remains apneic.",
      "position-airway-suction": "Airway positioned in sniffing position.",
      "evaluate-hr-breathing": "HR is 80/min, gasping respirations.",
      "check-spo2-monitor": "SpO2 65% (pre-ductal).",
    },
  },
  ppv_ventilation: {
    phase: "ppv_ventilation",
    description: "Heart rate is < 100/min and infant is gasping. Start PPV.",
    correctOrder: ["start-ppv-21-percent", "check-hr-after-15s", "evaluate-chest-movement"],
    shuffledOrder: ["evaluate-chest-movement", "start-ppv-21-percent", "check-hr-after-15s"],
    interventions: {
      "start-ppv-21-percent": { id: "start-ppv-21-percent", description: "Start PPV (21% O2 for term) at 40-60 breaths/min", priority: 1, critical: true },
      "check-hr-after-15s": { id: "check-hr-after-15s", description: "Check heart rate after 15 seconds of PPV", priority: 2, critical: true },
      "evaluate-chest-movement": { id: "evaluate-chest-movement", description: "Evaluate for chest movement with PPV", priority: 3, critical: true },
    },
    feedback: {
      "start-ppv-21-percent": "PPV started. 'Breathe, two, three...'",
      "check-hr-after-15s": "HR is not increasing, chest is not moving.",
      "evaluate-chest-movement": "No chest rise seen with PPV.",
    },
  },
  mr_sopa: {
    phase: "mr_sopa",
    description: "PPV is not effective (no chest rise). Perform ventilation corrective steps.",
    correctOrder: ["mask-adjustment", "reposition-airway", "suction-mouth-nose", "open-mouth", "pressure-increase", "alternative-airway"],
    shuffledOrder: ["alternative-airway", "reposition-airway", "pressure-increase", "mask-adjustment", "suction-mouth-nose", "open-mouth"],
    interventions: {
      "mask-adjustment": { id: "mask-adjustment", description: "M: Mask adjustment", priority: 1, critical: true },
      "reposition-airway": { id: "reposition-airway", description: "R: Reposition airway", priority: 2, critical: true },
      "suction-mouth-nose": { id: "suction-mouth-nose", description: "S: Suction mouth and nose", priority: 3, critical: true },
      "open-mouth": { id: "open-mouth", description: "O: Open mouth", priority: 4, critical: true },
      "pressure-increase": { id: "pressure-increase", description: "P: Pressure increase (max 40 cmH2O)", priority: 5, critical: true },
      "alternative-airway": { id: "alternative-airway", description: "A: Alternative airway (ET tube or LMA)", priority: 6, critical: true },
    },
    feedback: {
      "mask-adjustment": "Mask seal improved.",
      "reposition-airway": "Airway repositioned.",
      "suction-mouth-nose": "Secretions cleared.",
      "open-mouth": "Mouth opened.",
      "pressure-increase": "Pressure increased; still no chest rise.",
      "alternative-airway": "Intubation successful. Bilateral chest rise confirmed.",
    },
  },
  compressions: {
    phase: "compressions",
    description: "After 30 seconds of effective PPV (chest rise), HR is < 60/min.",
    correctOrder: ["increase-o2-100-percent", "start-compressions-3-1", "coordinate-with-ppv", "check-hr-after-60s"],
    shuffledOrder: ["coordinate-with-ppv", "increase-o2-100-percent", "check-hr-after-60s", "start-compressions-3-1"],
    interventions: {
      "increase-o2-100-percent": { id: "increase-o2-100-percent", description: "Increase O2 to 100% for compressions", priority: 1, critical: true },
      "start-compressions-3-1": { id: "start-compressions-3-1", description: "Start chest compressions (3:1 ratio)", priority: 2, critical: true },
      "coordinate-with-ppv": { id: "coordinate-with-ppv", description: "Coordinate 'One-and-two-and-three-and-breathe'", priority: 3, critical: true },
      "check-hr-after-60s": { id: "check-hr-after-60s", description: "Check heart rate after 60 seconds of compressions", priority: 4, critical: true },
    },
    feedback: {
      "increase-o2-100-percent": "O2 blender set to 100%.",
      "start-compressions-3-1": "Two-thumb technique used on lower third of sternum.",
      "coordinate-with-ppv": "Compressions and ventilation coordinated.",
      "check-hr-after-60s": "HR remains < 60/min.",
    },
  },
  medications: {
    phase: "medications",
    description: "HR remains < 60/min despite 60s of compressions with 100% O2.",
    correctOrder: ["establish-uac-uvc", "give-epinephrine-iv", "consider-volume-expander", "evaluate-for-pneumothorax"],
    shuffledOrder: ["give-epinephrine-iv", "consider-volume-expander", "establish-uac-uvc", "evaluate-for-pneumothorax"],
    interventions: {
      "establish-uac-uvc": { id: "establish-uac-uvc", description: "Establish Umbilical Venous Catheter (UVC)", priority: 1, critical: true },
      "give-epinephrine-iv": { id: "give-epinephrine-iv", description: "Give Epinephrine 0.01-0.03 mg/kg IV", priority: 2, critical: true },
      "consider-volume-expander": { id: "consider-volume-expander", description: "Consider Normal Saline bolus (10 mL/kg)", priority: 3, critical: false },
      "evaluate-for-pneumothorax": { id: "evaluate-for-pneumothorax", description: "Evaluate for pneumothorax/hypovolemia", priority: 4, critical: false },
    },
    feedback: {
      "establish-uac-uvc": "UVC established.",
      "give-epinephrine-iv": "Epinephrine given. HR increasing to 110/min.",
      "consider-volume-expander": "Volume expander ready if needed.",
      "evaluate-for-pneumothorax": "Breath sounds are equal; no pneumothorax.",
    },
  },
};

export function calculateNRPScore(
  phase: NRPPhase,
  userOrder: string[]
): { score: number; passed: boolean; feedback: string[] } {
  const scenario = NRP_CAPSTONE_SCENARIOS[phase];
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
    feedbackMessages.push("NRP is a highly sequential process. Follow the 'Golden Minute' and corrective steps carefully.");
  } else {
    feedbackMessages.push("Excellent work! You followed the NRP algorithm correctly.");
  }
  
  return {
    score: finalScore,
    passed,
    feedback: feedbackMessages,
  };
}
