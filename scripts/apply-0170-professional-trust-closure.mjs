import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const db = await createMysqlConnection(databaseUrl, mysql);
try {
  console.log("[0170] Preparing professional trust-closure schema...");
  await db.query(`ALTER TABLE professionalProgressReports ADD COLUMN IF NOT EXISTS invalidatedAt TIMESTAMP NULL, ADD COLUMN IF NOT EXISTS invalidationReason TEXT NULL`);
  await db.query(`CREATE TABLE IF NOT EXISTS professionalCompetenceEvidence (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    competencyDomain VARCHAR(128) NOT NULL,
    assessmentType VARCHAR(64) NOT NULL,
    assessorUserId INT NOT NULL,
    assessmentDate DATE NOT NULL,
    assessmentMethod VARCHAR(64) NOT NULL,
    result VARCHAR(32) NOT NULL,
    validityMonths INT NULL,
    validUntil DATE NULL,
    evidenceReference VARCHAR(512) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'current',
    notes TEXT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX professional_competence_user_status_idx (userId, status),
    INDEX professional_competence_domain_date_idx (competencyDomain, assessmentDate)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  console.log("[0170] Professional trust-closure schema is ready.");
} finally {
  await db.end();
}
