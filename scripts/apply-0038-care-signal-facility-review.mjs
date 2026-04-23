/**
 * Migration 0038: Care Signal — Facility Tracking, Review Workflow, Fellowship Eligibility
 *
 * Adds four columns to careSignalEvents:
 *   - facilityId: links event to a facility for institutional reporting
 *   - reviewerId: records which admin/coordinator reviewed the event
 *   - eligibleForFellowship: marks whether this event counts toward Pillar C
 *   - submissionVersion: tracks which form version was used (for audit trail)
 *
 * Also adds three indexes for the hot query paths:
 *   - idx_care_signal_facility (facilityId)
 *   - idx_care_signal_status (status)
 *   - idx_care_signal_user_created (userId, createdAt)
 *
 * Run: node scripts/apply-0038-care-signal-facility-review.mjs
 */
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

function getConfig(databaseUrl) {
  const u = new URL(databaseUrl);
  const needsSsl =
    /ssl-mode=REQUIRED|ssl=true/i.test(databaseUrl) ||
    u.hostname.endsWith(".aivencloud.com");
  const config = {
    host: u.hostname,
    port: u.port ? parseInt(u.port, 10) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, "") || undefined,
  };
  if (needsSsl) config.ssl = { rejectUnauthorized: false };
  return config;
}

const conn = await mysql.createConnection(getConfig(url));

const steps = [
  {
    name: "facilityId",
    sql: "ALTER TABLE `careSignalEvents` ADD COLUMN `facilityId` int NULL AFTER `userId`",
  },
  {
    name: "reviewerId",
    sql: "ALTER TABLE `careSignalEvents` ADD COLUMN `reviewerId` int NULL AFTER `status`",
  },
  {
    name: "eligibleForFellowship",
    sql: "ALTER TABLE `careSignalEvents` ADD COLUMN `eligibleForFellowship` boolean NOT NULL DEFAULT true AFTER `reviewerId`",
  },
  {
    name: "submissionVersion",
    sql: "ALTER TABLE `careSignalEvents` ADD COLUMN `submissionVersion` varchar(16) NOT NULL DEFAULT 'v1' AFTER `eligibleForFellowship`",
  },
  {
    name: "idx_care_signal_facility",
    sql: "CREATE INDEX `idx_care_signal_facility` ON `careSignalEvents` (`facilityId`)",
  },
  {
    name: "idx_care_signal_status",
    sql: "CREATE INDEX `idx_care_signal_status` ON `careSignalEvents` (`status`)",
  },
  {
    name: "idx_care_signal_user_created",
    sql: "CREATE INDEX `idx_care_signal_user_created` ON `careSignalEvents` (`userId`, `createdAt`)",
  },
];

let passed = 0;
let skipped = 0;

for (const step of steps) {
  try {
    await conn.execute(step.sql);
    console.log(`  ✓ ${step.name}`);
    passed++;
  } catch (err) {
    if (
      err.code === "ER_DUP_FIELDNAME" ||
      err.code === "ER_DUP_KEYNAME" ||
      (err.message && err.message.includes("Duplicate column name")) ||
      (err.message && err.message.includes("Duplicate key name"))
    ) {
      console.log(`  ↷ ${step.name} — already exists, skipping`);
      skipped++;
    } else {
      console.error(`  ✗ ${step.name} — FAILED: ${err.message}`);
      await conn.end();
      process.exit(1);
    }
  }
}

await conn.end();
console.log(`\nMigration 0038 complete: ${passed} applied, ${skipped} skipped.`);
