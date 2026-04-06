/**
 * Seed one PALS catalog course: "The systematic approach to a seriously ill child"
 * with a single module + quiz so /course/seriously-ill-child (LearningPath) works.
 *
 * Run: pnpm exec tsx server/seed-pals-seriously-ill-course.ts
 * Requires DATABASE_URL / DB access (same as app).
 *
 * Note: `learning.getCourses` also calls `ensurePalsSeriouslyIllCatalog` when the pals catalog is empty.
 */
import { getDb } from "./db";
import { ensurePalsSeriouslyIllCatalog } from "./lib/ensure-pals-seriously-ill-catalog";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("Database unavailable (check env / connection).");
    process.exit(1);
  }

  await ensurePalsSeriouslyIllCatalog(db);
  console.log("Done. Enroll as PALS (KES 100), pay, then open /course/seriously-ill-child?enrollmentId=<id>.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
