/**
 * Heartsaver Capstone Simulation Implementation (2025 Guidelines)
 * 
 * Focus:
 * - Bystander CPR (Hands-Only and 30:2)
 * - AED Use for non-healthcare providers
 * - First Aid (Bleeding, Choking, Epi-pen)
 */

export type HeartsaverPhase = 
  | "bystander_cpr"
  | "bystander_aed"
  | "choking_victim"
  | "bleeding_control"
  | "epipen_use";

export interface PriorityIntervention {
  id: string;
  description: string;
  priority: number;
  critical: boolean;
}

export interface HeartsaverScenario {
  phase: HeartsaverPhase;
  description: string;
  correctOrder: string[];
  shuffledOrder: string[];
  interventions: Record<string, PriorityIntervention>;
  feedback: Record<string, string>;
}

export const HEARTSAVER_CAPSTONE_SCENARIOS: Record<HeartsaverPhase, HeartsaverScenario> = {
  bystander_cpr: {
    phase: "bystander_cpr",
    description: "You see someone collapse in a shopping mall. They are not moving.",
    correctOrder: ["check-scene-safe", "tap-and-shout", "call-911-get-aed", "check-breathing", "push-hard-push-fast"],
    shuffledOrder: ["check-breathing", "tap-and-shout", "push-hard-push-fast", "check-scene-safe", "call-911-get-aed"],
    interventions: {
      "check-scene-safe": { id: "check-scene-safe", description: "Make sure the scene is safe for you and the victim", priority: 1, critical: true },
      "tap-and-shout": { id: "tap-and-shout", description: "Tap the victim and shout 'Are you OK?'", priority: 2, critical: true },
      "call-911-get-aed": { id: "call-911-get-aed", description: "Shout for help, call 911, and get an AED", priority: 3, critical: true },
      "check-breathing": { id: "check-breathing", description: "Check for breathing (at least 5 but no more than 10 seconds)", priority: 4, critical: true },
      "push-hard-push-fast": { id: "push-hard-push-fast", description: "Start chest compressions (push hard and fast)", priority: 5, critical: true },
    },
    feedback: {
      "check-scene-safe": "Scene is safe.",
      "tap-and-shout": "Victim is unresponsive.",
      "call-911-get-aed": "Help is on the way; AED is coming.",
      "check-breathing": "Victim is not breathing normally.",
      "push-hard-push-fast": "Hands-only CPR started. Rate 100-120/min.",
    },
  },
  bystander_aed: {
    phase: "bystander_aed",
    description: "Someone brings you an AED while you are doing compressions.",
    correctOrder: ["turn-on-aed", "follow-prompts", "attach-pads", "let-aed-analyze", "push-shock-button"],
    shuffledOrder: ["attach-pads", "push-shock-button", "turn-on-aed", "let-aed-analyze", "follow-prompts"],
    interventions: {
      "turn-on-aed": { id: "turn-on-aed", description: "Turn on the AED and follow the voice prompts", priority: 1, critical: true },
      "follow-prompts": { id: "follow-prompts", description: "Follow the AED voice prompts", priority: 2, critical: true },
      "attach-pads": { id: "attach-pads", description: "Attach the pads to the victim's bare chest", priority: 3, critical: true },
      "let-aed-analyze": { id: "let-aed-analyze", description: "Let the AED analyze the heart rhythm", priority: 4, critical: true },
      "push-shock-button": { id: "push-shock-button", description: "Push the shock button if the AED tells you to", priority: 5, critical: true },
    },
    feedback: {
      "turn-on-aed": "AED is on.",
      "follow-prompts": "Listening to prompts.",
      "attach-pads": "Pads applied correctly.",
      "let-aed-analyze": "Analyzing... Do not touch the victim.",
      "push-shock-button": "Shock delivered! Resume compressions.",
    },
  },
  choking_victim: {
    phase: "choking_victim",
    description: "A friend at lunch is choking and cannot breathe or cough.",
    correctOrder: ["ask-if-choking", "get-consent", "give-back-blows", "give-thrusts", "repeat-5-and-5"],
    shuffledOrder: ["give-thrusts", "ask-if-choking", "repeat-5-and-5", "get-consent", "give-back-blows"],
    interventions: {
      "ask-if-choking": { id: "ask-if-choking", description: "Ask 'Are you choking? Can I help you?'", priority: 1, critical: true },
      "get-consent": { id: "get-consent", description: "Tell them you are going to help", priority: 2, critical: true },
      "give-back-blows": { id: "give-back-blows", description: "Give 5 back blows between the shoulder blades", priority: 3, critical: true },
      "give-thrusts": { id: "give-thrusts", description: "Give 5 abdominal thrusts (Heimlich maneuver)", priority: 4, critical: true },
      "repeat-5-and-5": { id: "repeat-5-and-5", description: "Repeat 5 back blows and 5 thrusts until the object comes out or they pass out", priority: 5, critical: true },
    },
    feedback: {
      "ask-if-choking": "Victim nods 'yes'.",
      "get-consent": "You are helping.",
      "give-back-blows": "5 firm back blows delivered.",
      "give-thrusts": "5 abdominal thrusts delivered.",
      "repeat-5-and-5": "Object expelled! Victim is breathing.",
    },
  },
  bleeding_control: {
    phase: "bleeding_control",
    description: "A coworker has a deep cut on their arm and is bleeding heavily.",
    correctOrder: ["check-scene-safety", "wear-gloves", "apply-direct-pressure", "apply-bandage"],
    shuffledOrder: ["apply-direct-pressure", "check-scene-safety", "apply-bandage", "wear-gloves"],
    interventions: {
      "check-scene-safety": { id: "check-scene-safety", description: "Check if the scene is safe", priority: 1, critical: true },
      "wear-gloves": { id: "wear-gloves", description: "Put on personal protective equipment (gloves)", priority: 2, critical: true },
      "apply-direct-pressure": { id: "apply-direct-pressure", description: "Apply direct pressure with a clean dressing", priority: 3, critical: true },
      "apply-bandage": { id: "apply-bandage", description: "Apply a firm bandage over the dressing", priority: 4, critical: true },
    },
    feedback: {
      "check-scene-safety": "Scene is safe.",
      "wear-gloves": "Gloves are on.",
      "apply-direct-pressure": "Pressure applied; bleeding slows.",
      "apply-bandage": "Bandage secured.",
    },
  },
  epipen_use: {
    phase: "epipen_use",
    description: "Someone is having a severe allergic reaction and has an epinephrine pen.",
    correctOrder: ["call-911", "remove-safety-cap", "press-against-thigh", "hold-for-10-seconds"],
    shuffledOrder: ["hold-for-10-seconds", "press-against-thigh", "call-911", "remove-safety-cap"],
    interventions: {
      "call-911": { id: "call-911", description: "Call 911 or have someone else call", priority: 1, critical: true },
      "remove-safety-cap": { id: "remove-safety-cap", description: "Take off the safety cap from the epinephrine pen", priority: 2, critical: true },
      "press-against-thigh": { id: "press-against-thigh", description: "Press the pen firmly against the side of the thigh", priority: 3, critical: true },
      "hold-for-10-seconds": { id: "hold-for-10-seconds", description: "Hold it in place for 10 seconds", priority: 4, critical: true },
    },
    feedback: {
      "call-911": "911 called.",
      "remove-safety-cap": "Cap removed.",
      "press-against-thigh": "Pen clicked against thigh.",
      "hold-for-10-seconds": "Medication delivered. Patient's breathing improves.",
    },
  },
};

export function calculateHeartsaverScore(
  phase: HeartsaverPhase,
  userOrder: string[]
): { score: number; passed: boolean; feedback: string[] } {
  const scenario = HEARTSAVER_CAPSTONE_SCENARIOS[phase];
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
    feedbackMessages.push("Heartsaver response requires simple but correct steps. Focus on safety and speed.");
  } else {
    feedbackMessages.push("Well done! You responded correctly to the emergency.");
  }
  
  return {
    score: finalScore,
    passed,
    feedback: feedbackMessages,
  };
}
