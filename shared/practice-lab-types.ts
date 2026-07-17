/** AHA Practice Lab — shared track and scenario identifiers */

export const PRACTICE_LAB_TRACKS = [
  "shock_no_shock",
  "abcde",
  "cardiac_arrest",
  "rhythm_recognition",
  "ai_interactive_roleplay",
] as const;

export type PracticeLabTrackId = (typeof PRACTICE_LAB_TRACKS)[number];

export type PracticeLabProgramType = "bls" | "acls" | "pals" | "heartsaver" | "nrp";

export type PracticeLabEvent = {
  timestamp: number;
  type: string;
  description: string;
  correct?: boolean;
};

export type PracticeLabAttemptPayload = {
  enrollmentId: number;
  programType: PracticeLabProgramType;
  trackId: PracticeLabTrackId;
  scenarioId: string;
  score: number;
  passed: boolean;
  eventLog: PracticeLabEvent[];
  isBooster?: boolean;
  durationSeconds?: number;
};

/** Maps summative quiz topic keywords → practice lab track suggestions */
export const WEAK_DOMAIN_TO_TRACK: Record<string, PracticeLabTrackId> = {
  rhythm: "rhythm_recognition",
  arrhythmia: "rhythm_recognition",
  shock: "shock_no_shock",
  defibrillation: "shock_no_shock",
  bradycardia: "abcde",
  tachycardia: "abcde",
  abcde: "abcde",
  assessment: "abcde",
  arrest: "cardiac_arrest",
  cpr: "cardiac_arrest",
  pals: "cardiac_arrest",
  acls: "cardiac_arrest",
};
