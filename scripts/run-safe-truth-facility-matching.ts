/**
 * Safe-Truth v1 Phase C — facility fuzzy-matching + Care Signal event-code
 * linkage (gap-analysis queue item #11). Dry-run by default, mirrors
 * run-pattern-detection.ts.
 *
 *   pnpm run safe-truth:match-facilities              # dry-run (default)
 *   pnpm run safe-truth:match-facilities -- --execute # apply matches
 */
import { getDb } from "../server/db";
import { runSafeTruthFacilityMatching, runSafeTruthEventCodeLinkage } from "../server/lib/safe-truth-facility-matcher";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("DATABASE_URL / database connection required.");
    process.exit(1);
  }

  const execute = process.argv.includes("--execute");
  console.log(`Safe-Truth Phase C — mode: ${execute ? "EXECUTE" : "DRY-RUN"}\n`);

  const facilityResult = await runSafeTruthFacilityMatching(db, { dryRun: !execute });
  console.log(`--- Facility matching ---`);
  console.log(`Submissions scanned (facilityIdMatched still NULL): ${facilityResult.submissionsScanned}`);
  console.log(`Submissions ${execute ? "matched" : "would match"}: ${facilityResult.submissionsMatched}`);
  console.log(`Facility visits scanned: ${facilityResult.visitsScanned}`);
  console.log(`Facility visits ${execute ? "matched" : "would match"}: ${facilityResult.visitsMatched}`);

  const linkageResult = await runSafeTruthEventCodeLinkage(db, { dryRun: !execute });
  console.log(`\n--- Event-code linkage to Care Signal ---`);
  console.log(`Entered codes scanned (unresolved): ${linkageResult.codesScanned}`);
  console.log(`Codes ${execute ? "resolved" : "would resolve"}: ${linkageResult.codesResolved}`);

  console.log(`\n${execute ? "Applied." : "Dry-run only. Pass --execute to apply."}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
