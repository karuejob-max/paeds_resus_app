/**
 * Read-only Phase 0 schema inspection for the identity/entitlement master plan.
 * Run with: node scripts/inspect-identity-schema.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is missing");

const conn = await createMysqlConnection(url, mysql);
try {
  for (const sql of [
    "SHOW COLUMNS FROM `globalEntitlements`",
    "SHOW CREATE TABLE `globalEntitlements`",
    "SHOW TABLES LIKE 'providerProfessionalRoles'",
  ]) {
    console.log(`\\n>>> ${sql}`);
    const [rows] = await conn.query(sql);
    console.log(JSON.stringify(rows, null, 2));
  }
} finally {
  await conn.end();
}
console.log("\\nRead-only schema inspection complete.");
