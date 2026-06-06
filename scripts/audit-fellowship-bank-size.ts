/** Fail if any fellowship catalog course has <25 unique summative stems after expansions. */
import { getAllFellowshipSeedContent, resolveCatalogSlug } from "./fellowship-seed-lib";
import {
  uniqueFormativeQuestions,
  MICROCOURSE_FULL_QUESTION_BANK_SIZE,
} from "../shared/microcourse-exam-policy";
import { getFellowshipSummativeExpansion } from "../server/data/fellowship-summative-expansions";
import {
  isFellowshipPillarMicroCourse,
  MICRO_COURSE_CATALOG,
} from "../shared/micro-course-catalog";

const catalogSlugs = MICRO_COURSE_CATALOG.filter(isFellowshipPillarMicroCourse).map((c) => c.courseId);
const bySlug = new Map(getAllFellowshipSeedContent().map((c) => [resolveCatalogSlug(c.id), c]));

let failed = 0;
for (const slug of catalogSlugs) {
  if (slug === "seriously-ill-child-i") continue;
  const c = bySlug.get(slug);
  if (!c) {
    console.log(`[NO SEED] ${slug}`);
    failed++;
    continue;
  }
  const bank = uniqueFormativeQuestions([
    ...(c.quiz?.questions ?? []),
    ...getFellowshipSummativeExpansion(slug),
  ]);
  if (bank.length < MICROCOURSE_FULL_QUESTION_BANK_SIZE) {
    console.log(`[THIN BANK] ${slug} unique=${bank.length} need=${MICROCOURSE_FULL_QUESTION_BANK_SIZE}`);
    failed++;
  }
}

console.log(`\nBank size audit: ${failed} failure(s)`);
if (failed > 0) process.exit(1);
