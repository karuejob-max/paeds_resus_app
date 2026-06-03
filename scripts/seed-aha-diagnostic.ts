/**
 * Idempotent: diagnostic baseline quizzes for BLS, ACLS, PALS, NRP (and Heartsaver).
 *   pnpm run seed:aha-diagnostic
 * Does not modify summative banks or module content.
 */
import { getDb } from "../server/db";
import { ensureAhaDiagnosticQuiz } from "../server/lib/ensure-aha-diagnostic-quiz";
import {
  ensureAhaProgramCatalog,
  resolveAhaCourseAnchor,
  type AhaAnchorProgramType,
} from "../server/lib/resolve-aha-course-anchor";

const PROGRAMS: AhaAnchorProgramType[] = ["bls", "acls", "pals", "nrp", "heartsaver"];

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("Database unavailable");
    process.exit(1);
  }

  for (const programType of PROGRAMS) {
    await ensureAhaProgramCatalog(db, programType);
    const anchor = await resolveAhaCourseAnchor(db, programType);
    if (!anchor?.id) {
      console.warn(`[skip] No catalog anchor for ${programType}`);
      continue;
    }
    const quizId = await ensureAhaDiagnosticQuiz(db, anchor.id, programType);
    console.log(`[ok] ${programType} courseId=${anchor.id} diagnosticQuizId=${quizId ?? "none"}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
