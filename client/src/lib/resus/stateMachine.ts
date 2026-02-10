/**
 * ResusGPS State Machine
 * 
 * The entire clinical decision support system is a finite state machine.
 * Given a state and an input, the next state is DETERMINISTIC.
 * No ambiguity. No jumping. No confusion.
 */

export type ResusState = 
  | 'IDLE'        // Provider opens app
  | 'TRIAGE'      // Is this patient alive?
  | 'IDENTIFY'    // What's killing them?
  | 'CLARIFY'     // 1-2 targeted questions to narrow diagnosis
  | 'INTERVENE'   // Do THIS now
  | 'REASSESS'    // Did it work?
  | 'STABILIZED'; // Patient stable

export type TriageAnswer = {
  breathing: 'yes' | 'no' | null;
  pulse: 'yes' | 'no' | null;
  consciousness: 'alert' | 'voice' | 'pain' | 'unresponsive' | null;
};

export type PathwayId = 
  | 'cardiac_arrest'
  | 'breathing'
  | 'shock'
  | 'seizure'
  | 'allergic'
  | 'metabolic'
  | 'trauma'
  | 'newborn';

export type SubPathwayId = string; // e.g., 'bronchospasm', 'croup', 'septic_shock', etc.

export interface ClarifyingQuestion {
  id: string;
  text: string;
  options: { label: string; value: string }[];
}

export interface DoseCalc {
  drug: string;
  dosePerKg: number;
  unit: string;
  maxDose?: number;
  route: string;
  concentration?: string;
  preparation?: string;
  frequency?: string;
}

export interface Step {
  id: string;
  action: string;
  detail?: string;
  dose?: DoseCalc;
  timer?: number;          // seconds to wait before reassess
  reassess?: string;       // what to check
  escalateIf?: string;     // when to move to next step
  critical?: boolean;
}

export interface Pathway {
  id: PathwayId;
  name: string;
  icon: string;
  description: string;
  clarifyingQuestions?: ClarifyingQuestion[];
  subPathways: {
    id: SubPathwayId;
    name: string;
    matchCondition: (answers: Record<string, string>) => boolean;
    steps: Step[];
  }[];
  defaultSteps: Step[]; // fallback if no subpathway matches
}

export interface ResusSession {
  state: ResusState;
  triage: TriageAnswer;
  pathwayId: PathwayId | null;
  subPathwayId: SubPathwayId | null;
  clarifyAnswers: Record<string, string>;
  currentStepIndex: number;
  completedSteps: string[];
  patientWeight: number | null;  // kg
  patientAge: string | null;     // e.g., "3 years", "6 months"
  startTime: number;             // timestamp
  events: SessionEvent[];        // audit trail
}

export interface SessionEvent {
  timestamp: number;
  type: 'state_change' | 'answer' | 'step_complete' | 'escalation';
  detail: string;
}

// Initial session
export function createSession(weight?: number | null, age?: string | null): ResusSession {
  return {
    state: 'TRIAGE',
    triage: { breathing: null, pulse: null, consciousness: null },
    pathwayId: null,
    subPathwayId: null,
    clarifyAnswers: {},
    currentStepIndex: 0,
    completedSteps: [],
    patientWeight: weight ?? null,
    patientAge: age ?? null,
    startTime: Date.now(),
    events: [{
      timestamp: Date.now(),
      type: 'state_change',
      detail: 'Session started → TRIAGE'
    }]
  };
}

// State transition logic
export function transition(
  session: ResusSession,
  input: { type: string; value: string },
  pathwayRegistry: Map<PathwayId, Pathway>
): ResusSession {
  const next = { ...session, events: [...session.events] };

  const log = (type: SessionEvent['type'], detail: string) => {
    next.events.push({ timestamp: Date.now(), type, detail });
  };

  switch (session.state) {
    case 'TRIAGE': {
      // Handle triage answers
      if (input.type === 'breathing') {
        next.triage = { ...next.triage, breathing: input.value as 'yes' | 'no' };
        if (input.value === 'no') {
          // Not breathing → cardiac arrest pathway, skip to INTERVENE
          next.state = 'INTERVENE';
          next.pathwayId = 'cardiac_arrest';
          next.subPathwayId = 'no_breathing';
          next.currentStepIndex = 0;
          log('state_change', 'Not breathing → INTERVENE (cardiac arrest)');
          return next;
        }
        log('answer', `Breathing: ${input.value}`);
      }
      else if (input.type === 'pulse') {
        next.triage = { ...next.triage, pulse: input.value as 'yes' | 'no' };
        if (input.value === 'no') {
          // No pulse → cardiac arrest pathway
          next.state = 'INTERVENE';
          next.pathwayId = 'cardiac_arrest';
          next.subPathwayId = 'no_pulse';
          next.currentStepIndex = 0;
          log('state_change', 'No pulse → INTERVENE (cardiac arrest)');
          return next;
        }
        log('answer', `Pulse: ${input.value}`);
      }
      else if (input.type === 'consciousness') {
        next.triage = { ...next.triage, consciousness: input.value as TriageAnswer['consciousness'] };
        log('answer', `Consciousness: ${input.value}`);
        // Triage complete → move to IDENTIFY
        next.state = 'IDENTIFY';
        log('state_change', 'Triage complete → IDENTIFY');
      }
      return next;
    }

    case 'IDENTIFY': {
      // Provider selected what they see
      const pathwayId = input.value as PathwayId;
      const pathway = pathwayRegistry.get(pathwayId);
      if (!pathway) return next;

      next.pathwayId = pathwayId;
      log('answer', `Identified: ${pathway.name}`);

      if (pathway.clarifyingQuestions && pathway.clarifyingQuestions.length > 0) {
        next.state = 'CLARIFY';
        log('state_change', `→ CLARIFY (${pathway.clarifyingQuestions.length} questions)`);
      } else {
        // No clarifying questions, go straight to intervention
        next.state = 'INTERVENE';
        next.subPathwayId = resolveSubPathway(pathway, {});
        next.currentStepIndex = 0;
        log('state_change', `→ INTERVENE (${next.subPathwayId || 'default'})`);
      }
      return next;
    }

    case 'CLARIFY': {
      // Store clarifying answer
      next.clarifyAnswers = { ...next.clarifyAnswers, [input.type]: input.value };
      log('answer', `${input.type}: ${input.value}`);

      // Check if all clarifying questions answered
      const pathway = pathwayRegistry.get(next.pathwayId!);
      if (!pathway?.clarifyingQuestions) return next;

      const allAnswered = pathway.clarifyingQuestions.every(
        q => next.clarifyAnswers[q.id] !== undefined
      );

      if (allAnswered) {
        next.state = 'INTERVENE';
        next.subPathwayId = resolveSubPathway(pathway, next.clarifyAnswers);
        next.currentStepIndex = 0;
        log('state_change', `→ INTERVENE (${next.subPathwayId || 'default'})`);
      }
      return next;
    }

    case 'INTERVENE': {
      if (input.type === 'step_done') {
        next.completedSteps = [...next.completedSteps, input.value];
        log('step_complete', `Completed: ${input.value}`);

        // Get current steps
        const steps = getCurrentSteps(next, pathwayRegistry);
        const nextIndex = next.currentStepIndex + 1;

        if (nextIndex >= steps.length) {
          // All steps done
          next.state = 'STABILIZED';
          log('state_change', '→ STABILIZED');
        } else {
          // Check if next step has a reassess trigger
          const currentStep = steps[next.currentStepIndex];
          if (currentStep?.reassess) {
            next.state = 'REASSESS';
            log('state_change', `→ REASSESS (${currentStep.reassess})`);
          } else {
            next.currentStepIndex = nextIndex;
          }
        }
      }
      return next;
    }

    case 'REASSESS': {
      if (input.type === 'improving') {
        if (input.value === 'yes') {
          // Move to next step
          next.currentStepIndex += 1;
          next.state = 'INTERVENE';
          log('state_change', 'Improving → next step');
        } else {
          // Escalate - skip to next step (which is the escalation)
          next.currentStepIndex += 1;
          next.state = 'INTERVENE';
          log('escalation', 'Not improving → escalating');
        }
      }
      return next;
    }

    default:
      return next;
  }
}

// Resolve which sub-pathway to use based on clarifying answers
function resolveSubPathway(
  pathway: Pathway,
  answers: Record<string, string>
): SubPathwayId | null {
  for (const sub of pathway.subPathways) {
    if (sub.matchCondition(answers)) {
      return sub.id;
    }
  }
  return null; // use defaultSteps
}

// Get the current step array for the session
export function getCurrentSteps(
  session: ResusSession,
  pathwayRegistry: Map<PathwayId, Pathway>
): Step[] {
  if (!session.pathwayId) return [];
  const pathway = pathwayRegistry.get(session.pathwayId);
  if (!pathway) return [];

  if (session.subPathwayId) {
    const sub = pathway.subPathways.find(s => s.id === session.subPathwayId);
    if (sub) return sub.steps;
  }
  return pathway.defaultSteps;
}

// Get current step
export function getCurrentStep(
  session: ResusSession,
  pathwayRegistry: Map<PathwayId, Pathway>
): Step | null {
  const steps = getCurrentSteps(session, pathwayRegistry);
  if (session.currentStepIndex >= steps.length) return null;
  return steps[session.currentStepIndex];
}

// Get the current triage question to show
export function getTriageQuestion(session: ResusSession): {
  id: string;
  text: string;
  options: { label: string; value: string; color?: string }[];
} | null {
  if (session.state !== 'TRIAGE') return null;

  if (session.triage.breathing === null) {
    return {
      id: 'breathing',
      text: 'Is the patient breathing?',
      options: [
        { label: 'YES', value: 'yes', color: 'green' },
        { label: 'NO', value: 'no', color: 'red' }
      ]
    };
  }
  if (session.triage.pulse === null) {
    return {
      id: 'pulse',
      text: 'Can you feel a pulse?',
      options: [
        { label: 'YES', value: 'yes', color: 'green' },
        { label: 'NO', value: 'no', color: 'red' }
      ]
    };
  }
  if (session.triage.consciousness === null) {
    return {
      id: 'consciousness',
      text: 'Level of consciousness?',
      options: [
        { label: 'ALERT', value: 'alert', color: 'green' },
        { label: 'RESPONDS TO VOICE', value: 'voice', color: 'yellow' },
        { label: 'RESPONDS TO PAIN', value: 'pain', color: 'orange' },
        { label: 'UNRESPONSIVE', value: 'unresponsive', color: 'red' }
      ]
    };
  }
  return null;
}

// Calculate dose based on weight
export function calculateDose(dose: DoseCalc, weightKg: number | null): {
  calculatedDose: string;
  preparation: string;
} {
  if (!weightKg) {
    return {
      calculatedDose: `${dose.dosePerKg} ${dose.unit}/kg ${dose.route}`,
      preparation: dose.preparation || ''
    };
  }

  let amount = dose.dosePerKg * weightKg;
  if (dose.maxDose && amount > dose.maxDose) {
    amount = dose.maxDose;
  }

  return {
    calculatedDose: `${amount.toFixed(1)} ${dose.unit} ${dose.route}`,
    preparation: dose.preparation || ''
  };
}
