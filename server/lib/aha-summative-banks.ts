/**
 * AHA course-level summative banks — getter registry.
 * PALS uses pals-2025-summative-bank.ts (preserved post #158/#160).
 */
import type { AhaAnchorProgramType } from "./resolve-aha-course-anchor";
import type { AhaSummativeQuestionSeed } from "./aha-summative-types";
import { ahaSummativeQuizTitle } from "./aha-summative-types";
import { BLS_SUMMATIVE_QUESTIONS } from "./bls-summative-bank";
import { ACLS_SUMMATIVE_QUESTIONS } from "./acls-summative-bank";
import { HEARTSAVER_SUMMATIVE_QUESTIONS } from "./heartsaver-summative-bank";
import { NRP_SUMMATIVE_QUESTIONS } from "./nrp-summative-bank";
import {
  PALS_2025_SUMMATIVE_QUESTIONS,
  PALS_2025_SUMMATIVE_QUIZ_TITLE,
} from "./pals-2025-summative-bank";

const BANKS: Record<AhaAnchorProgramType, AhaSummativeQuestionSeed[]> = {
  bls: BLS_SUMMATIVE_QUESTIONS,
  acls: ACLS_SUMMATIVE_QUESTIONS,
  pals: PALS_2025_SUMMATIVE_QUESTIONS,
  nrp: NRP_SUMMATIVE_QUESTIONS,
  heartsaver: HEARTSAVER_SUMMATIVE_QUESTIONS,
};

export function getAhaSummativeBank(programType: AhaAnchorProgramType): AhaSummativeQuestionSeed[] {
  return BANKS[programType] ?? [];
}

export function getAhaSummativeQuizTitle(programType: AhaAnchorProgramType): string {
  if (programType === "pals") return PALS_2025_SUMMATIVE_QUIZ_TITLE;
  return ahaSummativeQuizTitle(programType);
}

export { AHA_TARGET_SUMMATIVE_SIZE, AHA_MIN_SUMMATIVE_SIZE } from "./aha-summative-types";
