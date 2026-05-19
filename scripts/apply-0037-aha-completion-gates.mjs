/**
 * Migration 0037: AHA Completion Gates
 *
 * Adds two-part completion tracking to the enrollments table:
 *   - cognitiveModulesComplete: all online modules finished
 *   - practicalSkillsSignedOff: instructor has signed off hands-on skills
 *   - practicalSignedOffAt: timestamp of sign-off
 *   - practicalSignedOffByUserId: instructor user ID
 *   - practicalSignedOffByName: instructor display name
 *
 * Run: node scripts/apply-0037-aha-completion-gates.mjs
 */
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

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

const steps = [
  {
    name: "cognitiveModulesComplete",
    sql: "ALTER TABLE `enrollments` ADD COLUMN `cognitiveModulesComplete` boolean NOT NULL DEFAULT false",
  },
  {
    name: "practicalSkillsSignedOff",
    sql: "ALTER TABLE `enrollments` ADD COLUMN `practicalSkillsSignedOff` boolean NOT NULL DEFAULT false",
  },
  {
    name: "practicalSignedOffAt",
    sql: "ALTER TABLE `enrollments` ADD COLUMN `practicalSignedOffAt` timestamp NULL",
  },
  {
    name: "practicalSignedOffByUserId",
    sql: "ALTER TABLE `enrollments` ADD COLUMN `practicalSignedOffByUserId` int NULL",
  },
  {
    name: "practicalSignedOffByName",
    sql: "ALTER TABLE `enrollments` ADD COLUMN `practicalSignedOffByName` varchar(255) NULL",
  },
];

for (const step of steps) {
  try {
    await conn.execute(step.sql);
    console.log(`✅ Added column: ${step.name}`);
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME") {
      console.log(`⏭️  Column already exists: ${step.name}`);
    } else {
      console.error(`❌ Failed on ${step.name}:`, err.message);
      await conn.end();
      process.exit(1);
    }
  }
}

await conn.end();
console.log("✅ Migration 0037 complete.");
