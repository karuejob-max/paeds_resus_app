/**
 * Migration 0124 — explicit provider-to-institution facility-link requests.
 *
 * Run: pnpm run db:apply-0124
 *
 * A request is separate from providerProfiles.facilityId: a care-delivery
 * facility selection does not itself grant institutional access.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0124] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0124] Preparing facility membership request schema...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS facilityMembershipRequests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institutionalAccountId INT NOT NULL,
        careFacilityId INT NOT NULL,
        userId INT NOT NULL,
        requesterEmail VARCHAR(320) NOT NULL,
        requesterName VARCHAR(255) NULL,
        relationshipType ENUM('permanent_staff','locum_outreach') NOT NULL DEFAULT 'permanent_staff',
        pendingRequestKey VARCHAR(128) NULL,
        department VARCHAR(255) NULL,
        facilityDepartmentId INT NULL,
        status ENUM('pending','approved','rejected','withdrawn') NOT NULL DEFAULT 'pending',
        staffMemberId INT NULL,
        membershipId INT NULL,
        reviewedByUserId INT NULL,
        reviewedAt TIMESTAMP NULL,
        reviewReason TEXT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY facilityMembershipRequests_pending_request_key_unique (pendingRequestKey),
        KEY facilityMembershipRequests_institution_status_idx (institutionalAccountId, status, createdAt),
        KEY facilityMembershipRequests_user_status_idx (userId, status, createdAt),
        KEY facilityMembershipRequests_facility_idx (careFacilityId, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("[0124] Facility membership request schema is ready.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0124] Fatal error:", error);
  process.exit(1);
});
