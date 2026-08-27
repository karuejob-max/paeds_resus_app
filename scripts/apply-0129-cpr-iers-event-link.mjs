/**
 * Migration 0129 — canonical IERS activation to CPR-GPS event link.
 *
 * Run: pnpm run db:apply-0129
 *
 * This creates only an operational bridge. It does not create an activation,
 * CPR session, patient record, or test data.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0129] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS cprEventLinks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        activationEventId INT NOT NULL,
        cprSessionId INT NOT NULL,
        institutionalAccountId INT NOT NULL,
        linkedByUserId INT NOT NULL,
        resusGpsSessionKey VARCHAR(64) NULL,
        pathwayKey VARCHAR(32) NULL,
        contentVersion VARCHAR(32) NULL,
        linkStatus ENUM('active','outcome_recorded','debrief_pending','closed') NOT NULL DEFAULT 'active',
        terminalOutcome VARCHAR(32) NULL,
        outcomeRecordedAt TIMESTAMP NULL,
        debriefSubmittedAt TIMESTAMP NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY cprEventLinks_activation_unique (activationEventId),
        UNIQUE KEY cprEventLinks_cpr_session_unique (cprSessionId),
        KEY cprEventLinks_institution_status_idx (institutionalAccountId, linkStatus)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("[0129] cprEventLinks is ready.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0129] Fatal error:", error);
  process.exit(1);
});
