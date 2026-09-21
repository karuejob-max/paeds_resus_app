/**
 * Migration 0152 — allow shareable full-waiver codes for AHA self-pay courses.
 * Additive and idempotent: existing entitlement values and rows are preserved.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0152] DATABASE_URL is required.");
  process.exit(1);
}

const entitlementEnum = "ENUM('ierp','nerp','paeds_resus_ils','self_pay','bls','acls','pals','heartsaver') NOT NULL";

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    await conn.query(`ALTER TABLE \`globalEntitlements\` MODIFY COLUMN \`programType\` ${entitlementEnum}`);
    await conn.query(`ALTER TABLE \`globalEntitlementRedemptions\` MODIFY COLUMN \`programType\` ${entitlementEnum}`);
    console.log("[0152] AHA self-pay entitlement program types are ready.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0152] Fatal error:", error);
  process.exit(1);
});

// Migration command is intentionally idempotent; re-running the ALTER is safe.
