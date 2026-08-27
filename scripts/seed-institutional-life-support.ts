/**
 * Seed the Institutional Life Support Training Program catalog.
 *
 * Run: pnpm run seed:institutional-life-support
 * Requires DATABASE_URL in .env or the environment.
 * This is idempotent and safe to run more than once.
 */
import "dotenv/config";
import { getDb } from "../server/db";
import {
  ensureInstitutionalLifeSupportCatalog,
  getInstitutionalLifeSupportCourseId,
} from "../server/lib/ensure-institutional-life-support-catalog";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error(
      "[ILS seed] Database unavailable (check DATABASE_URL and connection)."
    );
    process.exit(1);
  }

  await ensureInstitutionalLifeSupportCatalog(db);
  const courseId = await getInstitutionalLifeSupportCourseId(db);
  if (!courseId) {
    console.error("[ILS seed] Catalog seeding completed without a course row.");
    process.exit(1);
  }

  console.log(
    `[ILS seed] PASS — Institutional Life Support catalog ready (course ${courseId}).`
  );
  console.log(
    "[ILS seed] Paeds Resus competency certificate path is separate from official AHA certification."
  );
}

main().catch(error => {
  console.error("[ILS seed] Fatal error:", error);
  process.exit(1);
});
