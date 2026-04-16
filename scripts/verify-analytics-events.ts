/**
 * Sprint 1 verification: analyticsEvents in the rolling window used by adminStats.getReport.
 * Uses the same aggregation as Admin → Reports (see server/lib/admin-analytics-rollup.ts).
 *
 * Usage: pnpm run verify:analytics
 * Requires DATABASE_URL (e.g. from .env at repo root).
 * Optional: VERIFY_LAST_DAYS=14 (default 7, max 90)
 */
import "dotenv/config";
import { gte } from "drizzle-orm";
import { getDb } from "../server/db";
import { analyticsEvents } from "../drizzle/schema";
import { rollingHoursAgo } from "../server/lib/report-time-windows";
import { rollupAnalyticsLastDays, rollupResusGpsLastDays } from "../server/lib/admin-analytics-rollup";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("DATABASE_URL missing or database unavailable.");
    process.exit(1);
  }

  const lastDays = Math.min(90, Math.max(1, parseInt(process.env.VERIFY_LAST_DAYS || "7", 10)));
  const since = rollingHoursAgo(lastDays);
  console.log(
    `Rolling window: createdAt >= ${since.toISOString()} (${lastDays}×24h from now)\n` +
      `(Matches adminStats.getReport default lastDays=${lastDays}.)\n`
  );

  const analyticsInPeriod = await db
    .select({
      eventType: analyticsEvents.eventType,
      eventName: analyticsEvents.eventName,
    })
    .from(analyticsEvents)
    .where(gte(analyticsEvents.createdAt, since));

  const all = rollupAnalyticsLastDays(analyticsInPeriod);
  const resus = rollupResusGpsLastDays(analyticsInPeriod);

  console.log(`Total events (App & Paeds Resus activity): ${all.count}`);
  console.log("\nTop types (same buckets as Admin Reports — eventType || eventName || other):\n");
  for (const row of all.eventTypes) {
    console.log(`  ${row.eventType}: ${row.count}`);
  }

  console.log(`\nResusGPS slice (eventType starts with resus_): ${resus.totalEvents} events`);
  for (const row of resus.eventTypes) {
    console.log(`  ${row.eventType}: ${row.count}`);
  }

  if (all.count === 0) {
    console.log(
      "\n(No rows in window — trigger instrumented journeys or widen VERIFY_LAST_DAYS to confirm pipeline.)"
    );
  } else {
    console.log(
      "\nOK — compare totals above with Admin → Reports for the same rolling period (lastDays=" +
        lastDays +
        ")."
    );
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
