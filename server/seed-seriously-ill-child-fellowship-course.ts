/**
 * Seed fellowship micro-course: "The systematic approach to a seriously ill child"
 * Run: pnpm run seed:seriously-ill-child-course
 */
import * as dotenv from "dotenv";
dotenv.config();

import { getDb } from "./db";
import { ensureMicroCoursesCatalog } from "./lib/micro-course-catalog";
import {
  ensureSeriouslyIllChildFellowshipCatalog,
  SERIOUSLY_ILL_CHILD_MICRO_COURSE_ID,
} from "./lib/ensure-seriously-ill-child-fellowship-catalog";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }
  await ensureMicroCoursesCatalog();
  await ensureSeriouslyIllChildFellowshipCatalog(db);
  console.log(
    `Done. Enroll via Fellowship dashboard (${SERIOUSLY_ILL_CHILD_MICRO_COURSE_ID}), pay, then open /micro-course/${SERIOUSLY_ILL_CHILD_MICRO_COURSE_ID}.`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
