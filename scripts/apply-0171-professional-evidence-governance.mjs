import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const db = await createMysqlConnection(databaseUrl, mysql);

async function addColumnIfMissing(table, column, definition) {
  const [rows] = await db.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
  if (!rows.length) await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
}

try {
  console.log("[0171] Preparing professional evidence governance schema...");
  await addColumnIfMissing("professionalProgressGoals", "actualValue", "DECIMAL(10,2) NOT NULL DEFAULT 0");
  await addColumnIfMissing("professionalProgressGoals", "progressValue", "DECIMAL(6,2) NOT NULL DEFAULT 0");
  await addColumnIfMissing("professionalProgressGoals", "computedStatus", "VARCHAR(24) NOT NULL DEFAULT 'active'");
  await addColumnIfMissing("professionalEvidenceLedger", "sourceFactJson", "TEXT NULL");
  await addColumnIfMissing("professionalEvidenceLedger", "interpretation", "VARCHAR(64) NULL");
  await addColumnIfMissing("professionalEvidenceLedger", "interpretationVersion", "VARCHAR(24) NULL");
  await db.query(`CREATE TABLE IF NOT EXISTS professionalAssessorAuthorities (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    assessorUserId INT NOT NULL,
    competencyDomain VARCHAR(128) NOT NULL,
    assessmentMethods TEXT NOT NULL,
    approvedByUserId INT NOT NULL,
    approvedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiresAt TIMESTAMP NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'active',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX professional_assessor_authority_idx (assessorUserId, competencyDomain, status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await db.query(`CREATE TABLE IF NOT EXISTS professionalPathwayCourseAttributions (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    pathwayType VARCHAR(16) NOT NULL,
    pathwayEnrollmentId INT NOT NULL,
    courseEnrollmentId INT NOT NULL,
    attributionType VARCHAR(32) NOT NULL DEFAULT 'pathway_component',
    createdByUserId INT NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY professional_pathway_course_uq (pathwayType, pathwayEnrollmentId, courseEnrollmentId),
    INDEX professional_pathway_course_course_idx (courseEnrollmentId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  console.log("[0171] Professional evidence governance schema is ready.");
} finally {
  await db.end();
}
