/**
 * Retention cleanup per DATA_RETENTION_SCHEDULE.md — default dry-run.
 *
 *   pnpm run retention:cleanup              # dry-run (default)
 *   pnpm run retention:cleanup -- --execute # apply deletions (ops only)
 */
import { getDb } from "../server/db";
import { buildRetentionCleanupPlan, runRetentionCleanup } from "../server/lib/retention-cleanup";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("DATABASE_URL / database connection required.");
    process.exit(1);
  }

  const execute = process.argv.includes("--execute");
  const plan = await buildRetentionCleanupPlan(db);

  console.log(`Retention cleanup plan (${plan.generatedAt})`);
  console.log(`Mode: ${execute ? "EXECUTE" : "DRY-RUN"}\n`);

  for (const cat of plan.categories) {
    console.log(
      `- ${cat.category} (${cat.table}): ${cat.eligibleCount} rows — ${cat.action} (cutoff ${cat.cutoff.toISOString()})`
    );
  }
  console.log(`\nTotal eligible: ${plan.totalEligible}`);

  if (!execute) {
    console.log("\nDry-run only. Pass --execute to apply deletions.");
    process.exit(0);
  }

  const result = await runRetentionCleanup(db, { dryRun: false });
  console.log("\nDeleted:", result.deleted);
  console.log("Retention cleanup complete.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
