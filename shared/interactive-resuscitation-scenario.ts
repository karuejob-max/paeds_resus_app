export type InteractiveChoiceKind = "assessment" | "interpretation" | "action" | "reassessment";

export type InteractiveScenarioChoice = {
  id: string;
  label: string;
  kind: InteractiveChoiceKind;
};

export type InteractiveScenarioEvent = {
  timestamp: number;
  type: "scene" | "assessment" | "finding" | "interpretation" | "action" | "reassessment" | "coaching" | "complete";
  description: string;
  choiceId?: string;
  correct?: boolean;
};

export type InteractiveScenarioNode = {
  id: string;
  phase: string;
  prompt: string;
  instructorPrompt: string;
  choices: readonly InteractiveScenarioChoice[];
  correctChoiceId: string;
  finding: string;
  nextNodeId?: string;
  completion?: {
    summary: string;
    nextClinicalFocus: string;
  };
};

export type InteractiveScenarioState = {
  scenarioId: string;
  nodeId: string;
  elapsedSeconds: number;
  events: readonly InteractiveScenarioEvent[];
  completed: boolean;
};

export type InteractiveScenarioResult = {
  state: InteractiveScenarioState;
  accepted: boolean;
  completed: boolean;
  feedback: string;
  finding?: string;
  nextPrompt?: string;
  nextInstructorPrompt?: string;
  choices: readonly InteractiveScenarioChoice[];
};

const NODES: readonly InteractiveScenarioNode[] = [
  {
    id: "first-contact",
    phase: "Scene and first contact",
    prompt: "A patient is lying on the emergency department floor. What do you do first?",
    instructorPrompt: "Start with a safe approach and establish whether the patient responds.",
    choices: [
      { id: "approach-check-response", label: "Approach, introduce yourself, tap the patient, and shout their name", kind: "assessment" },
      { id: "start-compressions", label: "Start chest compressions immediately without checking responsiveness", kind: "action" },
      { id: "give-oxygen", label: "Apply oxygen and wait for a response", kind: "action" },
    ],
    correctChoiceId: "approach-check-response",
    finding: "The patient does not respond to your voice or a firm shoulder tap.",
    nextNodeId: "activate-help",
  },
  {
    id: "activate-help",
    phase: "Recognition and team activation",
    prompt: "The patient is unresponsive. What is your next priority?",
    instructorPrompt: "Recognition must lead to help, equipment, and a coordinated response—not a silent solo assessment.",
    choices: [
      { id: "activate-response", label: "Shout for help, activate the emergency response team, and request the crash cart, AED, and BVM", kind: "action" },
      { id: "continue-solo-assessment", label: "Continue a full history before calling for help", kind: "assessment" },
      { id: "move-patient", label: "Move the patient to another room before activating help", kind: "action" },
    ],
    correctChoiceId: "activate-response",
    finding: "Help is activated. The crash cart, AED, and BVM are being brought while you continue the primary assessment.",
    nextNodeId: "ask-airway",
  },
  {
    id: "ask-airway",
    phase: "Airway assessment",
    prompt: "Which focused question do you ask the instructor now?",
    instructorPrompt: "Ask for the finding you need. The instructor will not volunteer every detail unless you assess it.",
    choices: [
      { id: "ask-airway", label: "How is the airway?", kind: "assessment" },
      { id: "ask-glucose", label: "What is the blood glucose?", kind: "assessment" },
      { id: "give-epinephrine", label: "Give epinephrine now", kind: "action" },
    ],
    correctChoiceId: "ask-airway",
    finding: "You open the airway and see vomitus in the mouth. The airway is contaminated and partially obstructed.",
    nextNodeId: "clear-airway",
  },
  {
    id: "clear-airway",
    phase: "Airway intervention",
    prompt: "What is the best immediate response to the airway finding?",
    instructorPrompt: "Treat the immediate threat you identified, then reassess what changed.",
    choices: [
      { id: "clear-and-reposition", label: "Suction or clear the vomitus, reposition the airway, and reassess", kind: "action" },
      { id: "oxygen-only", label: "Apply oxygen without clearing the obstruction", kind: "action" },
      { id: "wait-for-team", label: "Wait for the response team before touching the airway", kind: "action" },
    ],
    correctChoiceId: "clear-and-reposition",
    finding: "The mouth is clear and the airway is repositioned. The patient remains unresponsive, so breathing must be assessed next.",
    nextNodeId: "ask-breathing",
  },
  {
    id: "ask-breathing",
    phase: "Breathing assessment",
    prompt: "What do you ask the instructor to assess next?",
    instructorPrompt: "Make the next question specific: oxygenation and adequacy of breathing are different findings.",
    choices: [
      { id: "ask-breathing-and-spo2", label: "Is breathing adequate, and what is the SpO₂?", kind: "assessment" },
      { id: "ask-temperature", label: "What is the temperature?", kind: "assessment" },
      { id: "start-compressions-now", label: "Start compressions without assessing breathing", kind: "action" },
    ],
    correctChoiceId: "ask-breathing-and-spo2",
    finding: "Breathing is shallow and irregular. SpO₂ is 84% with poor chest rise and no effective ventilation.",
    nextNodeId: "support-ventilation",
  },
  {
    id: "support-ventilation",
    phase: "Ventilation support",
    prompt: "What action matches the breathing finding?",
    instructorPrompt: "Use the BVM and oxygen to provide effective ventilation, then reassess chest rise and oxygenation.",
    choices: [
      { id: "bvm-oxygen", label: "Apply the BVM with oxygen, obtain a seal, and provide effective ventilations", kind: "action" },
      { id: "nasal-oxygen", label: "Use nasal oxygen only and continue observing", kind: "action" },
      { id: "leave-for-aed", label: "Leave the patient to retrieve the AED yourself", kind: "action" },
    ],
    correctChoiceId: "bvm-oxygen",
    finding: "The BVM seal is effective with visible chest rise. SpO₂ improves to 92%, but the patient remains unresponsive.",
    nextNodeId: "reassess-and-handoff",
  },
  {
    id: "reassess-and-handoff",
    phase: "Reassessment and handoff",
    prompt: "What do you do before the next team member takes over?",
    instructorPrompt: "Close this first loop with a focused reassessment and a closed-loop handoff.",
    choices: [
      { id: "reassess-handoff", label: "Reassess responsiveness, breathing, and oxygenation; then give a concise closed-loop handoff", kind: "reassessment" },
      { id: "stop-and-wait", label: "Stop all support and wait for the instructor", kind: "action" },
      { id: "repeat-oxygen", label: "Give more oxygen without reassessing the patient", kind: "action" },
    ],
    correctChoiceId: "reassess-handoff",
    finding: "The reassessment confirms persistent unresponsiveness, supported ventilation, and improving oxygenation. The response team is ready for the next algorithm step.",
    completion: {
      summary: "You completed the first assessment loop: recognition, help activation, airway finding, targeted intervention, breathing finding, ventilation support, and reassessment.",
      nextClinicalFocus: "Continue with pulse and circulation assessment, CPR decision-making, and rhythm/AED management with the response team.",
    },
  },
];

function getNode(nodeId: string): InteractiveScenarioNode {
  const node = NODES.find((item) => item.id === nodeId);
  if (!node) throw new Error(`Unknown interactive scenario node: ${nodeId}`);
  return node;
}

export function getInteractiveScenarioNodes(): readonly InteractiveScenarioNode[] {
  return NODES;
}

export function startInteractiveScenario(scenarioId = "first-minutes-instructor-loop"): InteractiveScenarioState {
  const first = NODES[0];
  return {
    scenarioId,
    nodeId: first.id,
    elapsedSeconds: 0,
    events: [{ timestamp: 0, type: "scene", description: "Scene: a patient is lying on the emergency department floor." }],
    completed: false,
  };
}

export function getInteractiveScenarioNode(state: InteractiveScenarioState): InteractiveScenarioNode {
  return getNode(state.nodeId);
}

export function submitInteractiveScenarioChoice(
  state: InteractiveScenarioState,
  choiceId: string,
): InteractiveScenarioResult {
  if (state.completed) throw new Error("This interactive scenario is already complete.");
  const node = getNode(state.nodeId);
  const choice = node.choices.find((item) => item.id === choiceId);
  if (!choice) throw new Error(`Choice ${choiceId} is not available at node ${node.id}`);

  const timestamp = state.elapsedSeconds + 5;
  if (choice.id !== node.correctChoiceId) {
    const nextState = {
      ...state,
      elapsedSeconds: timestamp,
      events: [...state.events, {
        timestamp,
        type: "coaching" as const,
        description: `You chose: ${choice.label}. ${node.instructorPrompt}`,
        choiceId,
        correct: false,
      }],
    };
    return {
      state: nextState,
      accepted: false,
      completed: false,
      feedback: `The instructor pauses you: ${node.instructorPrompt}`,
      choices: node.choices,
    };
  }

  const baseEvents: InteractiveScenarioEvent[] = [
    ...state.events,
    { timestamp, type: choice.kind, description: `You chose: ${choice.label}.`, choiceId, correct: true },
    { timestamp, type: "finding", description: node.finding, correct: true },
  ];
  if (node.completion) {
    const completeState: InteractiveScenarioState = {
      ...state,
      elapsedSeconds: timestamp,
      events: [...baseEvents, { timestamp, type: "complete", description: node.completion.summary, correct: true }],
      completed: true,
    };
    return {
      state: completeState,
      accepted: true,
      completed: true,
      feedback: node.completion.summary,
      finding: node.finding,
      choices: [],
    };
  }

  const nextNode = getNode(node.nextNodeId!);
  const nextState: InteractiveScenarioState = {
    ...state,
    nodeId: nextNode.id,
    elapsedSeconds: timestamp,
    events: baseEvents,
    completed: false,
  };
  return {
    state: nextState,
    accepted: true,
    completed: false,
    feedback: "The instructor gives you the finding and waits for your next focused question or action.",
    finding: node.finding,
    nextPrompt: nextNode.prompt,
    nextInstructorPrompt: nextNode.instructorPrompt,
    choices: nextNode.choices,
  };
}
