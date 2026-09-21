/**
 * Migration 0153 — canonical AHA catalogue cleanup.
 * Adds reversible course retirement and allows NRP/Instructor access codes.
 * Existing courses and enrollments are preserved; duplicate BLS rows are marked inactive.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0153] DATABASE_URL is required.");
  process.exit(1);
}

const entitlementEnum = "ENUM('ierp','nerp','paeds_resus_ils','self_pay','bls','acls','pals','heartsaver','nrp','instructor') NOT NULL";

async function hasColumn(conn, tableName, columnName) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
    [tableName, columnName]
  );
  return Number(rows?.[0]?.c ?? 0) > 0;
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    if (!(await hasColumn(conn, "courses", "isActive"))) {
      await conn.query("ALTER TABLE `courses` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT TRUE");
      console.log("[0153] Added courses.isActive");
    }

    await conn.query(`ALTER TABLE \`globalEntitlements\` MODIFY COLUMN \`programType\` ${entitlementEnum}`);
    await conn.query(`ALTER TABLE \`globalEntitlementRedemptions\` MODIFY COLUMN \`programType\` ${entitlementEnum}`);

    const [canonicalRows] = await conn.query(
      "SELECT c.id FROM courses c LEFT JOIN modules m ON m.courseId = c.id WHERE c.programType = 'bls' AND c.isActive = TRUE GROUP BY c.id ORDER BY (c.title = 'BLS Provider Course — AHA 2025 Guidelines') DESC, COUNT(m.id) DESC, c.id ASC LIMIT 1"
    );
    const canonicalId = canonicalRows?.[0]?.id;
    if (canonicalId != null) {
      await conn.query("UPDATE courses SET isActive = FALSE WHERE programType = 'bls' AND id <> ?", [canonicalId]);
      console.log(`[0153] Retained canonical BLS course id=${canonicalId}; marked other BLS rows inactive.`);
    } else {
      console.log("[0153] No BLS course found; no BLS rows retired.");
    }

    console.log("[0153] AHA catalogue cleanup applied successfully.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0153] Fatal error:", error);
  process.exit(1);
});
