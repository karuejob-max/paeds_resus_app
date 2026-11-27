import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  // 1. Audit table for verification decisions.
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS institutionVerificationEvents (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      institutionalAccountId INT NOT NULL,
      eventType ENUM('submitted','verified','rejected','revoked','grandfathered') NOT NULL,
      actorUserId INT NULL,
      method VARCHAR(32) NULL,
      note VARCHAR(1000) NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY institutionVerificationEvents_account_idx (institutionalAccountId, createdAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("[0199] institutionVerificationEvents exists and is ready.");

  // 2. Verification columns on institutionalAccounts (added only if missing).
  const [existing] = await connection.query("SHOW COLUMNS FROM institutionalAccounts LIKE 'verificationStatus'");
  const alreadyMigrated = Array.isArray(existing) && existing.length > 0;
  if (alreadyMigrated) {
    console.log("[0199] institutionalAccounts verification columns already exist; skipping ALTER and backfill.");
  } else {
    await connection.execute(`
      ALTER TABLE institutionalAccounts
        ADD COLUMN verificationStatus ENUM('unverified','pending_review','verified','rejected') NOT NULL DEFAULT 'unverified',
        ADD COLUMN verificationMethod VARCHAR(32) NULL,
        ADD COLUMN verificationEvidenceUrl VARCHAR(1000) NULL,
        ADD COLUMN verificationEvidenceNote TEXT NULL,
        ADD COLUMN verificationSubmittedAt TIMESTAMP NULL,
        ADD COLUMN verifiedAt TIMESTAMP NULL,
        ADD COLUMN verifiedByUserId INT NULL,
        ADD COLUMN verificationReviewNote TEXT NULL
    `);
    console.log("[0199] Added verification columns to institutionalAccounts.");

    // 3. Grandfather every institution that is already active so nothing stops working on
    //    deploy. They stay flagged (method = 'grandfathered') for platform-admin review.
    const [grandfathered] = await connection.execute(`
      UPDATE institutionalAccounts
      SET verificationStatus = 'verified', verificationMethod = 'grandfathered', verifiedAt = NOW(),
          verificationReviewNote = 'Active before verification existed; pending review.'
      WHERE status = 'active'
    `);
    await connection.execute(`
      INSERT INTO institutionVerificationEvents (institutionalAccountId, eventType, method, note)
      SELECT id, 'grandfathered', 'grandfathered', 'Active before verification existed; pending review.'
      FROM institutionalAccounts WHERE verificationMethod = 'grandfathered'
    `);
    console.log(`[0199] Grandfathered ${grandfathered.affectedRows ?? 0} active institution(s) as verified (flagged for review).`);
  }

  // 4. Report (do not change) institutions claiming the same KMHFL facility.
  const [dupes] = await connection.query(`
    SELECT kmhflFacilityId, COUNT(*) AS institutions, GROUP_CONCAT(id ORDER BY id) AS institutionIds
    FROM institutionalAccounts WHERE kmhflFacilityId IS NOT NULL
    GROUP BY kmhflFacilityId HAVING COUNT(*) > 1
  `);
  if (Array.isArray(dupes) && dupes.length > 0) {
    console.log("[0199] KMHFL facilities claimed by more than one institution (review these):");
    console.table(dupes);
  } else {
    console.log("[0199] No KMHFL facility is claimed by more than one institution.");
  }
} finally {
  await connection.end();
}
