import { isFormativePracticeLabTrack, type PracticeLabProgramType, type PracticeLabTrackId } from "./practice-lab-types";

export type SimulationMissionId = "simulation-world" | "first-minutes" | "deteriorating-child" | "rhythm-decisions" | "pals-capstone" | "resus-room" | "adult-acls-world" | "nrp-newborn-not-breathing";

export type SimulationMission = {
  id: SimulationMissionId;
  title: string;
  subtitle: string;
  trackId: PracticeLabTrackId;
  difficulty: "Foundation" | "Applied" | "Pressure";
  estimatedMinutes: number;
  masteryThreshold: number;
  objective: string;
  realism: string;
  unlocksAfter?: SimulationMissionId;
  supportedPrograms: readonly PracticeLabProgramType[];
  isFormative?: boolean;
};

export const SIMULATION_MISSIONS: readonly SimulationMission[] = [
  {
    id: "adult-acls-world",
    title: "Adult ACLS command room",
    subtitle: "Rehearse adult rhythm recognition, resuscitation, and post-ROSC reassessment in a synthetic environment.",
    trackId: "adult_acls_world",
    difficulty: "Applied",
    estimatedMinutes: 12,
    masteryThreshold: 0,
    objective: "Observe, prioritise, act, and reassess across adult ACLS deterioration and arrest states.",
    realism: "The engine is deterministic and consequence-based; completion records simulation performance only.",
    supportedPrograms: ["acls"],
    isFormative: true,
  },
  {
    id: "nrp-newborn-not-breathing",
    title: "Newborn not breathing after birth",
    subtitle: "Complete initial newborn steps, provide effective ventilation, and reassess the heart rate.",
    trackId: "nrp_world",
    difficulty: "Foundation",
    estimatedMinutes: 10,
    masteryThreshold: 0,
    objective: "Recognise inadequate transition, provide effective ventilation, escalate only when indicated, and protect the post-resuscitation period.",
    realism: "The newborn responds to ventilation and reassessment; this is a scripted learning simulation, not a credential assessment.",
    supportedPrograms: ["nrp"],
    isFormative: true,
  },
  {
    id: "simulation-world",
    title: "The resuscitation room",
    subtitle: "Choose a role, lead a living team, and respond to deterministic patient deterioration.",
    trackId: "simulation_world",
    difficulty: "Applied",
    estimatedMinutes: 12,
    masteryThreshold: 70,
    objective: "Demonstrate recognition, delegation, closed-loop communication, safe action, and reassessment in a team simulation.",
    realism: "The team is imperfect, information is incomplete, and the patient changes after your actions.",
    supportedPrograms: ["pals"],
  },
  {
    id: "first-minutes",
    title: "The first minutes",
    subtitle: "Meet an unresponsive patient one finding at a time. Ask, assess, act, and reassess.",
    trackId: "cardiac_arrest",
    difficulty: "Foundation",
    estimatedMinutes: 8,
    masteryThreshold: 70,
    objective: "Complete the first assessment loop: approach, activate help, identify airway and breathing threats, support ventilation, and reassess.",
    realism: "The instructor gives only the finding you request; safe decisions unlock the next piece of the scene.",
    supportedPrograms: ["bls", "pals", "heartsaver"],
    isFormative: true,
  },
  {
    id: "deteriorating-child",
    title: "Deteriorating child",
    subtitle: "The numbers are changing. Decide what matters before the patient crosses a line.",
    trackId: "abcde",
    difficulty: "Applied",
    estimatedMinutes: 6,
    masteryThreshold: 70,
    objective: "Use ABCDE, treat the immediate threat, and reassess instead of waiting for certainty.",
    realism: "The patient responds to your decisions, including delayed or unsafe priorities.",
    supportedPrograms: ["pals"],
  },
  {
    id: "rhythm-decisions",
    title: "Rhythm under uncertainty",
    subtitle: "You have a rhythm strip, a story, and a team waiting for a decision.",
    trackId: "rhythm_recognition",
    difficulty: "Applied",
    estimatedMinutes: 5,
    masteryThreshold: 70,
    objective: "Identify the rhythm and choose the first action that matches the patient, not just the strip.",
    realism: "Context can change the correct response; pattern recognition alone is not enough.",
    supportedPrograms: ["acls", "pals"],
  },
  {
    id: "resus-room",
    title: "Resus room",
    subtitle: "Lead the room, communicate clearly, and adapt as new information arrives.",
    trackId: "ai_interactive_roleplay",
    difficulty: "Pressure",
    estimatedMinutes: 10,
    masteryThreshold: 70,
    objective: "Make an actionable plan, delegate, reassess, and close the loop with your team.",
    realism: "The room is intentionally imperfect: interruptions, ambiguity, and competing priorities are part of the work.",
    unlocksAfter: "first-minutes",
    supportedPrograms: ["acls", "pals"],
    isFormative: true,
  },
  {
    id: "pals-capstone",
    title: "The full deterioration arc",
    subtitle: "Assess, stabilise, recognise shock, respond to deterioration, resuscitate, and protect the post-ROSC patient.",
    trackId: "pals_capstone",
    difficulty: "Pressure",
    estimatedMinutes: 15,
    masteryThreshold: 80,
    objective: "Connect ABCDE, shock recognition, CPR execution, ROSC, and post-resuscitation care into one coherent response.",
    realism: "The patient worsens when priorities are missed; the debrief focuses on the sequence, not a single lucky click.",
    unlocksAfter: "deteriorating-child",
    supportedPrograms: ["pals"],
  },
];

export function getSimulationMission(id: string): SimulationMission | undefined {
  return SIMULATION_MISSIONS.find((mission) => mission.id === id);
}

/**
 * Simulation access follows the learner's course enrollment, not the commercial
 * route used to create it (IERP, NERP, ILSP, self-pay, or an administrator grant).
 */
export function getEligibleSimulationMissions(programTypes: readonly PracticeLabProgramType[]): SimulationMission[] {
  return SIMULATION_MISSIONS.filter((mission) => mission.supportedPrograms.some((program) => programTypes.includes(program)));
}

export function isFormativeSimulationMission(mission: SimulationMission): boolean {
  return mission.isFormative ?? isFormativePracticeLabTrack(mission.trackId);
}

export function isSimulationMissionUnlocked(
  mission: SimulationMission,
  completedMissionIds: readonly string[],
): boolean {
  return !mission.unlocksAfter || completedMissionIds.includes(mission.unlocksAfter);
}

export function getSimulationMasteryLabel(attempts: number, bestScore: number): string {
  if (attempts === 0) return "Not started";
  if (bestScore >= 90) return "Reliable under pressure";
  if (bestScore >= 70) return "Safe with coaching";
  return "Needs another rehearsal";
}
