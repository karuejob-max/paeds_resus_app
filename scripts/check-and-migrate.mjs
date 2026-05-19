/**
 * check-and-migrate.mjs
 * Checks which Care Signal columns are missing and applies migration 0038 if needed.
 * Also checks for any other pending apply-XXXX scripts not yet applied.
 */
import mysql from "mysql2/promise";
import { readFileSync } from "fs";

// Load .env manually
try {
  const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

function getConfig(databaseUrl) {
  const u = new URL(databaseUrl);
  const needsSsl = /ssl-mode=REQUIRED|ssl=true/i.test(databaseUrl) || u.hostname.endsWith(".aivencloud.com");
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
console.log("✓ Connected to live database\n");

// 1. Check careSignalEvents columns
const [cols] = await conn.execute("DESCRIBE careSignalEvents");
const existingCols = cols.map(r => r.Field);
console.log("Current careSignalEvents columns:", existingCols.join(", "), "\n");

// 2. Check enrollments for AHA columns (migration 0037)
const [enrollCols] = await conn.execute("DESCRIBE enrollments");
const enrollColNames = enrollCols.map(r => r.Field);
console.log("Current enrollments columns (relevant):", enrollColNames.filter(c => c.includes("cognitive") || c.includes("practical") || c.includes("signedOff")).join(", ") || "none of the 0037 columns found", "\n");

// 3. Run migration 0038 steps
const migration0038 = [
  { name: "facilityId", sql: "ALTER TABLE `careSignalEvents` ADD COLUMN `facilityId` int NULL AFTER `userId`" },
  { name: "reviewerId", sql: "ALTER TABLE `careSignalEvents` ADD COLUMN `reviewerId` int NULL AFTER `status`" },
  { name: "eligibleForFellowship", sql: "ALTER TABLE `careSignalEvents` ADD COLUMN `eligibleForFellowship` boolean NOT NULL DEFAULT true AFTER `reviewerId`" },
  { name: "submissionVersion", sql: "ALTER TABLE `careSignalEvents` ADD COLUMN `submissionVersion` varchar(16) NOT NULL DEFAULT 'v1' AFTER `eligibleForFellowship`" },
  { name: "idx_care_signal_facility", sql: "CREATE INDEX `idx_care_signal_facility` ON `careSignalEvents` (`facilityId`)" },
  { name: "idx_care_signal_status", sql: "CREATE INDEX `idx_care_signal_status` ON `careSignalEvents` (`status`)" },
  { name: "idx_care_signal_user_created", sql: "CREATE INDEX `idx_care_signal_user_created` ON `careSignalEvents` (`userId`, `createdAt`)" },
];

console.log("--- Running Migration 0038: Care Signal facility/review columns ---");
let passed = 0, skipped = 0;
for (const step of migration0038) {
  try {
    await conn.execute(step.sql);
    console.log(`  ✓ ${step.name} — applied`);
    passed++;
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME" || err.code === "ER_DUP_KEYNAME" ||
        (err.message && (err.message.includes("Duplicate column") || err.message.includes("Duplicate key")))) {
      console.log(`  ↷ ${step.name} — already exists, skipped`);
      skipped++;
    } else {
      console.error(`  ✗ ${step.name} — FAILED: ${err.message}`);
      await conn.end();
      process.exit(1);
    }
  }
}
console.log(`\nMigration 0038: ${passed} applied, ${skipped} skipped.\n`);

// 4. Run migration 0037 (AHA completion gates) if not already applied
const migration0037 = [
  { name: "cognitiveModulesComplete", sql: "ALTER TABLE `enrollments` ADD COLUMN `cognitiveModulesComplete` boolean NOT NULL DEFAULT false" },
  { name: "practicalSkillsSignedOff", sql: "ALTER TABLE `enrollments` ADD COLUMN `practicalSkillsSignedOff` boolean NOT NULL DEFAULT false" },
  { name: "practicalSignedOffAt", sql: "ALTER TABLE `enrollments` ADD COLUMN `practicalSignedOffAt` timestamp NULL" },
  { name: "practicalSignedOffByUserId", sql: "ALTER TABLE `enrollments` ADD COLUMN `practicalSignedOffByUserId` int NULL" },
  { name: "practicalSignedOffByName", sql: "ALTER TABLE `enrollments` ADD COLUMN `practicalSignedOffByName` varchar(255) NULL" },
];

console.log("--- Running Migration 0037: AHA Completion Gates ---");
let p37 = 0, s37 = 0;
for (const step of migration0037) {
  try {
    await conn.execute(step.sql);
    console.log(`  ✓ ${step.name} — applied`);
    p37++;
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME" || err.code === "ER_DUP_KEYNAME" ||
        (err.message && (err.message.includes("Duplicate column") || err.message.includes("Duplicate key")))) {
      console.log(`  ↷ ${step.name} — already exists, skipped`);
      s37++;
    } else {
      console.error(`  ✗ ${step.name} — FAILED: ${err.message}`);
      await conn.end();
      process.exit(1);
    }
  }
}
console.log(`\nMigration 0037: ${p37} applied, ${s37} skipped.\n`);

// 5. Final state check
const [finalCols] = await conn.execute("DESCRIBE careSignalEvents");
console.log("Final careSignalEvents columns:", finalCols.map(r => r.Field).join(", "));

await conn.end();
console.log("\n✓ All migrations complete.");
