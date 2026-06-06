/**
 * Idempotent: summative knowledge checks for BLS, ACLS, PALS, NRP, Heartsaver.
 *   pnpm run seed:aha-summative
 * Does not modify diagnostic baseline or module formative content (except legacy Final KC → Summative rename).
 */
import { getDb } from "../server/db";
import { ensureAllAhaSummativeQuizzes } from "../server/lib/ensure-aha-summative-quiz";
import {
  ensureAhaProgramCatalog,
  resolveAhaCourseAnchor,
  type AhaAnchorProgramType,
} from "../server/lib/resolve-aha-course-anchor";
import { getAhaSummativeBank } from "../server/lib/aha-summative-banks";

const PROGRAMS: AhaAnchorProgramType[] = ["bls", "acls", "pals", "nrp", "heartsaver"];

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("Database unavailable");
    process.exit(1);
  }

  const courseIds: Partial<Record<AhaAnchorProgramType, number>> = {};

  for (const programType of PROGRAMS) {
    await ensureAhaProgramCatalog(db, programType);
    const anchor = await resolveAhaCourseAnchor(db, programType);
    if (!anchor?.id) {
      console.warn(`[skip] No catalog anchor for ${programType}`);
      continue;
    }
    courseIds[programType] = anchor.id;
    const bankSize = getAhaSummativeBank(programType).length;
    console.log(`[prep] ${programType} courseId=${anchor.id} staticBank=${bankSize}`);
  }

  const results = await ensureAllAhaSummativeQuizzes(db, courseIds);

  for (const programType of PROGRAMS) {
    const courseId = courseIds[programType];
    const quizId = results[programType];
    console.log(
      `[ok] ${programType} courseId=${courseId ?? "—"} summativeQuizId=${quizId ?? "none"} bank=${getAhaSummativeBank(programType).length}`
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
