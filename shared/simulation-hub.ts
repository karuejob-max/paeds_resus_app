import { isFormativePracticeLabTrack, type PracticeLabProgramType, type PracticeLabTrackId } from "./practice-lab-types";

export type SimulationMissionId = "first-minutes" | "deteriorating-child" | "rhythm-decisions" | "pals-capstone" | "resus-room";

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
    id: "first-minutes",
    title: "The first minutes",
    subtitle: "A child is unresponsive. Your team is looking to you for the first safe priorities.",
    trackId: "cardiac_arrest",
    difficulty: "Foundation",
    estimatedMinutes: 8,
    masteryThreshold: 70,
    objective: "Recognise arrest, lead high-quality CPR, and keep the algorithm moving.",
    realism: "Time pressure is visible, but speed never overrides a safe, deliberate action.",
    supportedPrograms: ["bls", "acls", "pals", "heartsaver", "nrp"],
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
    supportedPrograms: ["acls", "pals", "nrp"],
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
