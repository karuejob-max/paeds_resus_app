/**
 * Migration 0137 — IERP intern-profile eligibility evidence.
 * Reservation: migration-reserved-0137
 *
 * Run: pnpm run db:apply-0137
 *
 * Additive and idempotent. Stores the structured intern identity fields and
 * private MoH deployment/posting-letter metadata required before IERP access.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0137] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0137] Preparing IERP intern-profile evidence schema...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS ierpInternProfiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        designation ENUM('noi', 'coi_bsc', 'coi_diploma', 'moi') NOT NULL,
        officialLetterReferenceNumber VARCHAR(255) NOT NULL,
        effectiveCommencementDate TIMESTAMP NOT NULL,
        deploymentLetterKey VARCHAR(512) NOT NULL,
        deploymentLetterFileName VARCHAR(255) NOT NULL,
        deploymentLetterContentType VARCHAR(128) NOT NULL,
        deploymentLetterSizeBytes INT NOT NULL,
        status ENUM('pending', 'verified', 'rejected', 'revoked') NOT NULL DEFAULT 'pending',
        verifiedByUserId INT NULL,
        verifiedAt TIMESTAMP NULL,
        reviewReason TEXT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY ierp_intern_profiles_user_uq (userId),
        KEY ierp_intern_profiles_status_idx (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("[0137] IERP intern-profile evidence schema is ready.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0137] Fatal error:", error);
  process.exit(1);
});
