import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const db = await createMysqlConnection(databaseUrl, mysql);

async function hasTable(table) {
  const [rows] = await db.query("SHOW TABLES LIKE ?", [table]);
  return rows.length > 0;
}

try {
  console.log("[0177] Preparing CPD identity-resolution queue...");
  if (!(await hasTable("professionalCpdIdentityResolutionCases"))) {
    await db.query(`
      CREATE TABLE professionalCpdIdentityResolutionCases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cpdAttendeeId INT NOT NULL UNIQUE,
        proposedUserId INT NULL,
        status ENUM('open','approved','rejected') NOT NULL DEFAULT 'open',
        reviewerUserId INT NULL,
        reviewerNote TEXT NULL,
        resolvedAt TIMESTAMP NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX professional_cpd_identity_cases_status_idx (status, updatedAt),
        INDEX professional_cpd_identity_cases_proposed_user_idx (proposedUserId, status)
      ) ENGINE=InnoDB
    `);
  }
  console.log("[0177] CPD identity-resolution queue is ready.");
} finally {
  await db.end();
}
