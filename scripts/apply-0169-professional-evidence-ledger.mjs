import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0169] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0169] Preparing canonical professional evidence ledger...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS professionalEvidenceLedger (
        id INT NOT NULL AUTO_INCREMENT,
        userId INT NOT NULL,
        sourceKey VARCHAR(255) NOT NULL,
        evidenceType VARCHAR(48) NOT NULL,
        title VARCHAR(255) NOT NULL,
        programme VARCHAR(64) NULL,
        competencyDomain VARCHAR(128) NULL,
        sourceSystem VARCHAR(64) NOT NULL,
        sourceRecordType VARCHAR(96) NOT NULL,
        sourceRecordId VARCHAR(96) NOT NULL,
        status VARCHAR(32) NOT NULL,
        evidenceStrength VARCHAR(32) NOT NULL DEFAULT 'recorded',
        verificationMethod VARCHAR(64) NULL,
        verifiedByUserId INT NULL,
        verifiedAt TIMESTAMP NULL,
        startedAt TIMESTAMP NULL,
        completedAt TIMESTAMP NULL,
        issuedAt TIMESTAMP NULL,
        expiresAt TIMESTAMP NULL,
        evidenceReference TEXT NULL,
        visibility VARCHAR(24) NOT NULL DEFAULT 'private',
        supersedesEvidenceId INT NULL,
        correctionCaseId INT NULL,
        metadataJson TEXT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY professional_evidence_source_key_uq (sourceKey),
        KEY professional_evidence_user_status_idx (userId, status),
        KEY professional_evidence_user_type_idx (userId, evidenceType)
      )
    `);
    console.log("[0169] Canonical professional evidence ledger is ready.");
  } finally {
    await conn.end();
  }
}
main().catch(error => {
  console.error("[0169] Fatal error:", error);
  process.exit(1);
});
