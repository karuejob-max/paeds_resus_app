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
      n: sql<number>`count(*)`.mapWith(Number),
    })
    .from(analyticsEvents)
    .where(gte(analyticsEvents.createdAt, since))
    .groupBy(analyticsEvents.eventType)
    .orderBy(desc(sql`count(*)`));

  let total = 0;
  for (const row of grouped) {
    total += row.n;
  }
  console.log(`Total rows: ${total}\nBy eventType:`);
  for (const row of grouped) {
    console.log(`  ${row.eventType ?? "(null)"}: ${row.n}`);
  }

  const resus = grouped.filter((r) => (r.eventType ?? "").startsWith("resus_"));
  const resusSum = resus.reduce((a, r) => a + r.n, 0);
  console.log(`\nResusGPS slice (eventType starts with resus_): ${resusSum} events`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
