/**
 * Sprint 1 verification: list analyticsEvents counts by eventType for the same rolling window
 * as adminStats.getReport (PLATFORM: last N days = rolling N×24h).
 *
 * Usage: DATABASE_URL=... pnpm run verify:analytics
 * Optional: VERIFY_LAST_DAYS=14
 */
import "dotenv/config";
import { desc, gte, sql } from "drizzle-orm";
import { getDb } from "../server/db";
import { analyticsEvents } from "../drizzle/schema";
import { rollingHoursAgo } from "../server/lib/report-time-windows";
import {
  resolveAnalyticsEventBucket,
} from "../server/lib/analytics-report-buckets";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("DATABASE_URL missing or database unavailable.");
    process.exit(1);
  }

  const lastDays = Math.min(90, Math.max(1, parseInt(process.env.VERIFY_LAST_DAYS || "7", 10)));
  const since = rollingHoursAgo(lastDays);
  console.log(`Rolling window: events with createdAt >= ${since.toISOString()} (${lastDays}×24h)\n`);

  const grouped = await db
    .select({
      eventType: analyticsEvents.eventType,
      eventName: analyticsEvents.eventName,
      n: sql<number>`count(*)`.mapWith(Number),
    })
    .from(analyticsEvents)
    .where(gte(analyticsEvents.createdAt, since))
    .groupBy(analyticsEvents.eventType, analyticsEvents.eventName)
    .orderBy(desc(sql`count(*)`));

  const total = grouped.reduce((sum, row) => sum + row.n, 0);
  const eventCounts: Record<string, number> = {};
  const resusCounts: Record<string, number> = {};
  let resusTotal = 0;
  for (const row of grouped) {
    const bucket = resolveAnalyticsEventBucket(row);
    eventCounts[bucket] = (eventCounts[bucket] ?? 0) + row.n;
    if (bucket.startsWith("resus_")) {
      resusCounts[bucket] = (resusCounts[bucket] ?? 0) + row.n;
      resusTotal += row.n;
    }
  }
  const sorted = Object.entries(eventCounts).sort((a, b) => b[1] - a[1]);
  console.log(`Total rows: ${total}\nBy admin-report bucket (eventType fallback eventName):`);
  for (const [bucket, count] of sorted) {
    console.log(`  ${bucket}: ${count}`);
  }

  const resusTop = Object.entries(resusCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
  console.log(
    `\nResusGPS slice (bucket starts with resus_): ${resusTotal} events`
  );
  if (resusTop.length > 0) {
    for (const [bucket, count] of resusTop) {
      console.log(`  ${bucket}: ${count}`);
    }
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
