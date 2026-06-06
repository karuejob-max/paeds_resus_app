/** Shared AHA course-level summative question seed shape. */
export type AhaSummativeQuestionSeed = {
  question: string;
  options: string[];
  correctAnswer: number | string;
  explanation: string;
};

export const AHA_TARGET_SUMMATIVE_SIZE = 25;
export const AHA_MIN_SUMMATIVE_SIZE = 15;

export function ahaSummativeQuizTitle(program: string): string {
  const labels: Record<string, string> = {
    bls: "BLS Summative Exam",
    acls: "ACLS Summative Exam",
    pals: "PALS Summative Exam",
    nrp: "NRP Summative Exam",
    heartsaver: "Heartsaver Summative Exam",
  };
  return labels[program] ?? `${program.toUpperCase()} Summative Exam`;
}
