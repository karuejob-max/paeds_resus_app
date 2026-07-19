/**
 * FPKB pattern detection — dry-run by default, mirrors run-retention-cleanup.ts.
 *
 *   pnpm run fpkb:detect-patterns              # dry-run (default)
 *   pnpm run fpkb:detect-patterns -- --execute # apply linking + promotions
 */
import { getDb } from "../server/db";
import { runPatternDetection, runConfidenceDowngrade } from "../server/lib/fpkb-pattern-detector";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("DATABASE_URL / database connection required.");
    process.exit(1);
  }

  const execute = process.argv.includes("--execute");
  console.log(`FPKB pattern detection — mode: ${execute ? "EXECUTE" : "DRY-RUN"}\n`);

  const result = await runPatternDetection(db, { dryRun: !execute });

  console.log(`Events with coded failure modes / success factors scanned: ${result.eventsScanned}`);
  console.log(`${execute ? "New observations linked" : "Would link"}: ${result.newObservationsLinked}`);
  if (execute) {
    console.log(`Patterns created: ${result.patternsCreated}`);
    if (result.patternsPromoted.length > 0) {
      console.log(`Patterns promoted:`);
      for (const p of result.patternsPromoted) {
        console.log(`  - ${p.patternCode}: ${p.from} → ${p.to}`);
      }
    } else {
      console.log(`Patterns promoted: none this run.`);
    }
  }
  if (result.skippedUnknownCodes.length > 0) {
    console.log(
      `\nWARNING — codes selected in submissions but not found in the kb_ taxonomy (possible taxonomy drift): ${result.skippedUnknownCodes.join(", ")}`
    );
  }

  console.log("\n--- Concept drift: review-task creation + confidence downgrade (§7.2/§7.3, gap-analysis #12) ---");
  const downgrade = await runConfidenceDowngrade(db, { dryRun: !execute });
  if (downgrade.reviewTasksCreated.length === 0) {
    console.log("No new review tasks this run.");
  } else {
    for (const t of downgrade.reviewTasksCreated) {
      console.log(`  ${execute ? "Created" : "Would create"} review task: ${t.patternCode}`);
    }
  }
  if (downgrade.downgraded.length === 0 && downgrade.movedToUnderReview.length === 0 && downgrade.retired.length === 0) {
    console.log("No automated downgrades this run (fallback threshold not yet reached for any pattern).");
  } else {
    for (const d of downgrade.downgraded) {
      console.log(`  ${execute ? "Downgraded" : "Would downgrade"}: ${d.patternCode} ${d.from} → ${d.to}`);
    }
    for (const u of downgrade.movedToUnderReview) {
      console.log(`  ${execute ? "Moved" : "Would move"} to UNDER_REVIEW: ${u.patternCode}`);
    }
    for (const r of downgrade.retired) {
      console.log(`  ${execute ? "Retired" : "Would retire"}: ${r.patternCode}`);
    }
  }

  if (!execute) {
    console.log("\nDry-run only. Pass --execute to apply linking, promotion, and downgrade.");
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
