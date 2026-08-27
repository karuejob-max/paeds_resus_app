/*
 * Read-only verification for migration 0136.
 * Run: pnpm run db:verify-0136
 * This script never writes, creates review cases, or sends email.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0136 verify] DATABASE_URL is required.");
  process.exit(1);
}

const expectedTables = [
  "nerp_external_verification_cases",
  "nerp_external_verification_phases",
  "nerp_external_verification_audit_events",
  "nerp_campaign_suppressions",
  "nerp_campaign_suppression_audit_events",
];
const expectedSuppressions = [
  ["email", "thrsmwaniki@yahoo.co.uk"],
  ["exact_name", "esther wairimu mwangi"],
  ["exact_name", "annet muthoni kingori"],
  ["exact_name", "emma githaka"],
];

async function hasTable(conn, tableName) {
  const [rows] = await conn.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    const tableChecks = [];
    for (const table of expectedTables) tableChecks.push([`table ${table}`, await hasTable(conn, table)]);

    const [suppressions] = await conn.query(
      `SELECT match_type, match_value FROM nerp_campaign_suppressions WHERE institutional_account_id = 3 AND is_active = 1`
    );
    const suppressionSet = new Set((Array.isArray(suppressions) ? suppressions : []).map(row => `${row.match_type}:${row.match_value}`));
    const seedChecks = expectedSuppressions.map(([type, value]) => [`suppression ${type}:${value}`, suppressionSet.has(`${type}:${value}`)]);

    const source = await (await import("node:fs/promises")).readFile(new URL("./apply-0136-nerp-cpd-controls.mjs", import.meta.url), "utf8");
    const safetyChecks = [
      ["migration has no email send call", !/sendEmail|sendMail|deliverEmail|emailService\.send/i.test(source)],
      ["migration is idempotent", source.includes("CREATE TABLE IF NOT EXISTS") && source.includes("ON DUPLICATE KEY UPDATE")],
    ];
    const checks = [...tableChecks, ...seedChecks, ...safetyChecks];
    for (const [label, passed] of checks) console.log(`[0136 verify] ${passed ? "PASS" : "FAIL"} — ${label}`);
    if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
    else console.log("[0136 verify] All NERP external-verification and suppression checks passed; no write was performed.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0136 verify] Fatal error:", error);
  process.exit(1);
});
