/*
 * Migration 0144 — audited named-user AHA access grants.
 * Reservation: migration-reserved-0144
 *
 * Additive and idempotent. Grants are explicit, scoped, expirable, and
 * revocable. They never alter existing enrollment or progress records.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0144] DATABASE_URL is required.");
  process.exit(1);
}

async function tableExists(conn, tableName) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
    [tableName]
  );
  return Number(rows?.[0]?.c ?? 0) > 0;
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    if (!(await tableExists(conn, "ahaAccessGrants"))) {
      await conn.query(`
        CREATE TABLE \`ahaAccessGrants\` (
          \`id\` INT NOT NULL AUTO_INCREMENT,
          \`userId\` INT NOT NULL,
          \`programType\` ENUM('bls','acls','pals','heartsaver','nrp','instructor') NULL,
          \`reason\` VARCHAR(500) NOT NULL,
          \`grantedByUserId\` INT NOT NULL,
          \`expiresAt\` DATETIME NULL,
          \`revokedAt\` DATETIME NULL,
          \`revokedByUserId\` INT NULL,
          \`revokeReason\` VARCHAR(500) NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          KEY \`aha_access_grants_user_status_idx\` (\`userId\`, \`revokedAt\`, \`expiresAt\`),
          KEY \`aha_access_grants_user_program_idx\` (\`userId\`, \`programType\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
    console.log("[0144] Audited AHA access grants are ready.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0144] Fatal error:", error);
  process.exit(1);
});
