/**
 * Seed fellowship micro-course: "The systematic approach to a seriously ill child"
 * Run: pnpm run seed:seriously-ill-child-course
 */
import * as dotenv from "dotenv";
dotenv.config();

import { getDb } from "./db";
import { fellowshipSimulations } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { FELLOWSHIP_SIMULATIONS } from "./lib/fellowship-simulations-data";
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
  const simData = FELLOWSHIP_SIMULATIONS.find(
    (s) => s.courseId === SERIOUSLY_ILL_CHILD_MICRO_COURSE_ID && s.level === "foundational"
  );
  if (simData) {
    const [existingSim] = await db
      .select()
      .from(fellowshipSimulations)
      .where(
        and(
          eq(fellowshipSimulations.courseId, SERIOUSLY_ILL_CHILD_MICRO_COURSE_ID),
          eq(fellowshipSimulations.level, "foundational")
        )
      )
      .limit(1);
    const simValues = {
      courseId: SERIOUSLY_ILL_CHILD_MICRO_COURSE_ID,
      level: "foundational" as const,
      title: simData.title,
      description: simData.description,
      scenarioData: simData.pages,
    };
    if (existingSim) {
      await db.update(fellowshipSimulations).set(simValues).where(eq(fellowshipSimulations.id, existingSim.id));
    } else {
      await db.insert(fellowshipSimulations).values(simValues);
    }
  }

  console.log(
    `Done. Enroll via Fellowship dashboard (${SERIOUSLY_ILL_CHILD_MICRO_COURSE_ID}), pay, then open /micro-course/${SERIOUSLY_ILL_CHILD_MICRO_COURSE_ID}.`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

