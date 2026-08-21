/**
 * Migration 0094 — provider–institution IERS memberships.
 *
 * Adds an explicit identity/permission contract for providers participating in
 * institutional readiness. Existing institutionalStaffMembers rows remain the
 * operational roster; this table records invitation, acceptance, role, and
 * membership lifecycle separately.
 *
 * Run: pnpm run db:apply-0094
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0094] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0094] Creating provider–institution membership table...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS institutionMemberships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institutionalAccountId INT NOT NULL,
        userId INT NULL,
        invitedEmail VARCHAR(320) NOT NULL,
        staffMemberId INT NULL,
        membershipStatus ENUM('invited', 'active', 'suspended', 'ended') NOT NULL DEFAULT 'invited',
        responsibilityRole ENUM(
          'executive',
          'erc_chair',
          'erc_member',
          'er_coordinator',
          'unit_team_leader',
          'ert_leader',
          'ert_responder',
          'general_staff'
        ) NOT NULL DEFAULT 'general_staff',
        invitedByUserId INT NULL,
        invitedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        acceptedAt TIMESTAMP NULL,
        suspendedAt TIMESTAMP NULL,
        endedAt TIMESTAMP NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY institutionMemberships_institution_email_unique (institutionalAccountId, invitedEmail),
        KEY institutionMemberships_institution_user_idx (institutionalAccountId, userId),
        KEY institutionMemberships_institution_status_idx (institutionalAccountId, membershipStatus)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await conn.query(`
      INSERT IGNORE INTO institutionMemberships
        (institutionalAccountId, userId, invitedEmail, staffMemberId, membershipStatus, responsibilityRole, acceptedAt)
      SELECT
        s.institutionalAccountId,
        s.userId,
        LOWER(s.staffEmail),
        s.id,
        'active',
        COALESCE(s.governanceRole, 'general_staff'),
        CURRENT_TIMESTAMP
      FROM institutionalStaffMembers s
      WHERE s.institutionalAccountId IS NOT NULL
        AND s.userId IS NOT NULL
        AND s.facilityLinkStatus = 'linked';
    `);
    console.log("[0094] Existing linked staff rows were backfilled into active memberships.");
    console.log("[0094] Provider–institution membership table is ready.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0094] Fatal error:", error);
  process.exit(1);
});
