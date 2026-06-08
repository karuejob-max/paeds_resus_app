/**
 * BLS Capstone Simulation Implementation (2025 Guidelines)
 * 
 * Focus:
 * - Adult, Child, and Infant CPR
 * - AED Use
 * - Choking
 * - Opioid-associated emergency
 */

export type BLSPhase = 
  | "adult_rescue"
  | "adult_aed"
  | "child_rescue"
  | "infant_rescue"
  | "choking_adult"
  | "opioid_emergency";

export interface PriorityIntervention {
  id: string;
  description: string;
  priority: number;
  critical: boolean;
}

export interface BLSScenario {
  phase: BLSPhase;
  description: string;
  correctOrder: string[];
  shuffledOrder: string[];
  interventions: Record<string, PriorityIntervention>;
  feedback: Record<string, string>;
}

export const BLS_CAPSTONE_SCENARIOS: Record<BLSPhase, BLSScenario> = {
  adult_rescue: {
    phase: "adult_rescue",
    description: "You find an adult collapsed on the sidewalk. No one else is around.",
    correctOrder: ["check-scene-safety", "check-responsiveness", "shout-for-help", "check-breathing-pulse", "start-cpr"],
    shuffledOrder: ["start-cpr", "check-responsiveness", "check-scene-safety", "check-breathing-pulse", "shout-for-help"],
    interventions: {
      "check-scene-safety": { id: "check-scene-safety", description: "Verify scene safety", priority: 1, critical: true },
      "check-responsiveness": { id: "check-responsiveness", description: "Check responsiveness (Tap and shout)", priority: 2, critical: true },
      "shout-for-help": { id: "shout-for-help", description: "Shout for nearby help / Activate EMS", priority: 3, critical: true },
      "check-breathing-pulse": { id: "check-breathing-pulse", description: "Check breathing and carotid pulse (5-10s)", priority: 4, critical: true },
      "start-cpr": { id: "start-cpr", description: "Start high-quality CPR (30:2)", priority: 5, critical: true },
    },
    feedback: {
      "check-scene-safety": "Scene is safe.",
      "check-responsiveness": "Patient is unresponsive.",
      "shout-for-help": "You've shouted for help; someone is calling 911.",
      "check-breathing-pulse": "No breathing, no pulse detected.",
      "start-cpr": "CPR started. Depth 2-2.4 inches, rate 100-120/min.",
    },
  },
  adult_aed: {
    phase: "adult_aed",
    description: "A bystander arrives with an AED while you are performing CPR.",
    correctOrder: ["power-on-aed", "attach-pads", "clear-for-analysis", "deliver-shock-if-advised", "resume-cpr-immediately"],
    shuffledOrder: ["attach-pads", "clear-for-analysis", "resume-cpr-immediately", "power-on-aed", "deliver-shock-if-advised"],
    interventions: {
      "power-on-aed": { id: "power-on-aed", description: "Power on the AED immediately", priority: 1, critical: true },
      "attach-pads": { id: "attach-pads", description: "Attach pads to bare chest", priority: 2, critical: true },
      "clear-for-analysis": { id: "clear-for-analysis", description: "Clear patient for rhythm analysis", priority: 3, critical: true },
      "deliver-shock-if-advised": { id: "deliver-shock-if-advised", description: "Deliver shock if advised", priority: 4, critical: true },
      "resume-cpr-immediately": { id: "resume-cpr-immediately", description: "Resume CPR immediately after shock", priority: 5, critical: true },
    },
    feedback: {
      "power-on-aed": "AED is on and prompting.",
      "attach-pads": "Pads attached correctly.",
      "clear-for-analysis": "Analyzing rhythm... Shock advised.",
      "deliver-shock-if-advised": "Shock delivered. Patient's body moved.",
      "resume-cpr-immediately": "CPR resumed. AED will re-analyze in 2 minutes.",
    },
  },
  child_rescue: {
    phase: "child_rescue",
    description: "A 7-year-old child collapses in a park. You are alone with a cell phone.",
    correctOrder: ["check-responsiveness", "activate-ems-speakerphone", "check-pulse-breathing", "start-cpr-15-2", "use-aed-pediatric"],
    shuffledOrder: ["check-pulse-breathing", "activate-ems-speakerphone", "use-aed-pediatric", "check-responsiveness", "start-cpr-15-2"],
    interventions: {
      "check-responsiveness": { id: "check-responsiveness", description: "Check responsiveness", priority: 1, critical: true },
      "activate-ems-speakerphone": { id: "activate-ems-speakerphone", description: "Activate EMS via speakerphone", priority: 2, critical: true },
      "check-pulse-breathing": { id: "check-pulse-breathing", description: "Check pulse (Carotid/Femoral) and breathing", priority: 3, critical: true },
      "start-cpr-15-2": { id: "start-cpr-15-2", description: "Start CPR (15:2 for 2 rescuers, 30:2 if alone)", priority: 4, critical: true },
      "use-aed-pediatric": { id: "use-aed-pediatric", description: "Use AED with pediatric pads/attenuator", priority: 5, critical: true },
    },
    feedback: {
      "check-responsiveness": "Child is unresponsive.",
      "activate-ems-speakerphone": "911 is on the line via speakerphone.",
      "check-pulse-breathing": "No pulse, no breathing.",
      "start-cpr-15-2": "CPR started. Depth ~2 inches (1/3 chest depth).",
      "use-aed-pediatric": "AED applied with pediatric dose attenuator.",
    },
  },
  infant_rescue: {
    phase: "infant_rescue",
    description: "An infant is found blue and not breathing in a crib.",
    correctOrder: ["check-responsiveness-flick-foot", "shout-for-help", "check-brachial-pulse", "start-cpr-two-fingers", "activate-ems-after-2-min"],
    shuffledOrder: ["check-brachial-pulse", "shout-for-help", "check-responsiveness-flick-foot", "activate-ems-after-2-min", "start-cpr-two-fingers"],
    interventions: {
      "check-responsiveness-flick-foot": { id: "check-responsiveness-flick-foot", description: "Check responsiveness (Flick sole of foot)", priority: 1, critical: true },
      "shout-for-help": { id: "shout-for-help", description: "Shout for nearby help", priority: 2, critical: true },
      "check-brachial-pulse": { id: "check-brachial-pulse", description: "Check brachial pulse (5-10s)", priority: 3, critical: true },
      "start-cpr-two-fingers": { id: "start-cpr-two-fingers", description: "Start CPR (Two-finger or two-thumb technique)", priority: 4, critical: true },
      "activate-ems-after-2-min": { id: "activate-ems-after-2-min", description: "Activate EMS after 2 minutes of CPR (if alone)", priority: 5, critical: true },
    },
    feedback: {
      "check-responsiveness-flick-foot": "Infant does not respond.",
      "shout-for-help": "No one responds to your shout.",
      "check-brachial-pulse": "No brachial pulse felt.",
      "start-cpr-two-fingers": "CPR started. Depth ~1.5 inches (1/3 chest depth).",
      "activate-ems-after-2-min": "You've completed 5 cycles; now calling 911.",
    },
  },
  choking_adult: {
    phase: "choking_adult",
    description: "A person at a restaurant is clutching their throat and cannot speak.",
    correctOrder: ["ask-are-you-choking", "stand-behind-patient", "perform-abdominal-thrusts", "repeat-until-object-out", "start-cpr-if-unconscious"],
    shuffledOrder: ["perform-abdominal-thrusts", "ask-are-you-choking", "start-cpr-if-unconscious", "stand-behind-patient", "repeat-until-object-out"],
    interventions: {
      "ask-are-you-choking": { id: "ask-are-you-choking", description: "Ask 'Are you choking?'", priority: 1, critical: true },
      "stand-behind-patient": { id: "stand-behind-patient", description: "Stand behind and wrap arms around waist", priority: 2, critical: true },
      "perform-abdominal-thrusts": { id: "perform-abdominal-thrusts", description: "Perform quick, upward abdominal thrusts (Heimlich)", priority: 3, critical: true },
      "repeat-until-object-out": { id: "repeat-until-object-out", description: "Repeat thrusts until object is expelled", priority: 4, critical: true },
      "start-cpr-if-unconscious": { id: "start-cpr-if-unconscious", description: "If patient becomes unconscious, start CPR", priority: 5, critical: true },
    },
    feedback: {
      "ask-are-you-choking": "Patient nods yes, unable to cough or speak.",
      "stand-behind-patient": "Positioned correctly.",
      "perform-abdominal-thrusts": "Thrusts delivered forcefully.",
      "repeat-until-object-out": "Object is expelled! Patient is breathing and coughing.",
      "start-cpr-if-unconscious": "Patient remained conscious; CPR not needed.",
    },
  },
  opioid_emergency: {
    phase: "opioid_emergency",
    description: "You find a person unresponsive with pinpoint pupils and suspected opioid overdose.",
    correctOrder: ["check-responsiveness", "activate-ems-get-naloxone", "check-breathing-pulse", "give-naloxone", "start-cpr-if-no-pulse"],
    shuffledOrder: ["check-breathing-pulse", "give-naloxone", "check-responsiveness", "start-cpr-if-no-pulse", "activate-ems-get-naloxone"],
    interventions: {
      "check-responsiveness": { id: "check-responsiveness", description: "Check responsiveness", priority: 1, critical: true },
      "activate-ems-get-naloxone": { id: "activate-ems-get-naloxone", description: "Activate EMS and get Naloxone/AED", priority: 2, critical: true },
      "check-breathing-pulse": { id: "check-breathing-pulse", description: "Check breathing and pulse", priority: 3, critical: true },
      "give-naloxone": { id: "give-naloxone", description: "Administer Naloxone (Intranasal/IM)", priority: 4, critical: true },
      "start-cpr-if-no-pulse": { id: "start-cpr-if-no-pulse", description: "Start CPR if pulse is absent", priority: 5, critical: true },
    },
    feedback: {
      "check-responsiveness": "Patient is unresponsive.",
      "activate-ems-get-naloxone": "EMS called; Naloxone kit retrieved.",
      "check-breathing-pulse": "No breathing, weak pulse present.",
      "give-naloxone": "Naloxone 4mg administered intranasally.",
      "start-cpr-if-no-pulse": "Pulse is present; rescue breathing provided until patient wakes up.",
    },
  },
};

export function calculateBLSScore(
  phase: BLSPhase,
  userOrder: string[]
): { score: number; passed: boolean; feedback: string[] } {
  const scenario = BLS_CAPSTONE_SCENARIOS[phase];
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
    feedbackMessages.push("BLS requires strict adherence to the life-saving sequence. Review the algorithm.");
  } else {
    feedbackMessages.push("Great job! You followed the BLS sequence correctly.");
  }
  
  return {
    score: finalScore,
    passed,
    feedback: feedbackMessages,
  };
}
