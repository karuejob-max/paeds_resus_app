/**
 * One-time fix for a real sequencing mistake in how the BLS First Aid
 * module removal was rolled out (2026-08-11): the CEO was instructed to run
 * apply-XXXX-bls-first-aid-progress-reset.mjs BEFORE applying the code
 * change that adds the `blsCourseContentUpdated` email template it needs --
 * backwards. The progress reset itself succeeded correctly (25 rows, 5
 * learners, confirmed from the real run's output) and must NOT be re-run.
 * Only the notification step failed ("Template 'blsCourseContentUpdated'
 * not found"), because the template didn't exist yet at that point.
 *
 * This script does nothing except look up the 5 known-affected users (by
 * the exact user IDs from that run's output) and send them the
 * notification now that the template exists. No progress is touched, no
 * schema change, not part of the numbered apply-* migration series --
 * doesn't need a reserved number.
 *
 * Run AFTER the Step 2 code (server/email-service.ts with the
 * blsCourseContentUpdated template) has been applied, or this will fail
 * with the exact same "Template not found" error again.
 *
 * Run: npx tsx scripts/resend-bls-content-update-notifications.mjs
 */
import "dotenv/config";
import { getDb } from "../server/db";
import { sendEmail } from "../server/email-service";
import { users } from "../drizzle/schema";
import { inArray } from "drizzle-orm";

const APP_BASE = process.env.APP_BASE_URL?.replace(/\/$/, "") || "https://www.paedsresus.com";

// Exact user IDs from the 2026-08-11 run's output -- "Total distinct
// learners affected: 5", one per "Failed to notify user <id> (<email>)" line.
const AFFECTED_USER_IDS = [45611, 62363, 68389, 109802, 125816];

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("[BLS resend] Database unavailable.");
    process.exit(1);
  }

  const rows = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, AFFECTED_USER_IDS));
  const found = new Set(rows.map((r) => r.id));
  const missing = AFFECTED_USER_IDS.filter((id) => !found.has(id));
  if (missing.length > 0) {
    console.warn(`[BLS resend] WARNING: ${missing.length} expected user id(s) not found in users table: ${missing.join(", ")}`);
  }

  console.log(`[BLS resend] Sending notification to ${rows.length} learner(s)...`);
  let sent = 0;
  let failed = 0;
  for (const u of rows) {
    if (!u.email) {
      console.warn(`[BLS resend] User ${u.id} has no email on file -- skipped.`);
      continue;
    }
    const result = await sendEmail(u.email, "blsCourseContentUpdated", {
      learnerName: u.name?.trim() || "there",
      courseUrl: `${APP_BASE}/course/bls`,
    });
    if (result.success) {
      sent++;
      console.log(`[BLS resend] Sent to user ${u.id} (${u.email}).`);
    } else {
      failed++;
      console.error(`[BLS resend] FAILED for user ${u.id} (${u.email}): ${result.error}`);
    }
  }
  console.log(`[BLS resend] Done. ${sent} sent, ${failed} failed.`);
}

main().catch((err) => {
  console.error("[BLS resend] Fatal error:", err);
  process.exit(1);
});
