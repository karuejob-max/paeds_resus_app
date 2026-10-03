import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0168] DATABASE_URL is required.");
  process.exit(1);
}

async function columnExists(conn, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1`,
    [tableName, columnName],
  );
  return rows.length > 0;
}

async function addColumnIfMissing(conn, tableName, columnName, definition) {
  if (!(await columnExists(conn, tableName, columnName))) {
    await conn.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
  }
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0168] Preparing professional record trust schema...");
    await addColumnIfMissing(conn, "professionalProgressReports", "reportScope", "ENUM('activity','current_status') NOT NULL DEFAULT 'activity'");
    await addColumnIfMissing(conn, "professionalProgressReports", "status", "ENUM('active','revoked','superseded') NOT NULL DEFAULT 'active'");
    await addColumnIfMissing(conn, "professionalProgressReports", "supersededByReportId", "INT NULL");
    await addColumnIfMissing(conn, "professionalProgressReports", "publicExpiresAt", "TIMESTAMP NULL");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS professionalProgressCorrectionCases (
        id INT NOT NULL AUTO_INCREMENT,
        userId INT NOT NULL,
        category ENUM('missing_record','duplicate_record','wrong_identity','wrong_certificate','wrong_status','wrong_date','other') NOT NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        evidenceReference VARCHAR(512) NULL,
        status ENUM('open','under_review','resolved','rejected') NOT NULL DEFAULT 'open',
        resolutionNote TEXT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY professional_progress_corrections_user_status_idx (userId, status)
      )
    `);
    await addColumnIfMissing(conn, "professionalProgressCorrectionCases", "resolvedByUserId", "INT NULL");
    await addColumnIfMissing(conn, "professionalProgressCorrectionCases", "resolvedAt", "TIMESTAMP NULL");
    console.log("[0168] Professional record trust schema is ready.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0168] Fatal error:", error);
  process.exit(1);
});
