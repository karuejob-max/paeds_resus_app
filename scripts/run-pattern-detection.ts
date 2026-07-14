/**
 * FPKB pattern detection — dry-run by default, mirrors run-retention-cleanup.ts.
 *
 *   pnpm run fpkb:detect-patterns              # dry-run (default)
 *   pnpm run fpkb:detect-patterns -- --execute # apply linking + promotions
 */
import { getDb } from "../server/db";
import { runPatternDetection } from "../server/lib/fpkb-pattern-detector";

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

  if (!execute) {
    console.log("\nDry-run only. Pass --execute to apply linking and confidence promotion.");
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
