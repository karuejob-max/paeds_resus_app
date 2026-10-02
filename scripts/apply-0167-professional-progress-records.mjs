import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0167] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0167] Preparing professional progress records schema...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS professionalProgressGoals (
        id INT NOT NULL AUTO_INCREMENT,
        userId INT NOT NULL,
        metricKey VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        targetValue DECIMAL(10,2) NOT NULL,
        unit VARCHAR(32) NOT NULL,
        periodType ENUM('monthly','quarterly','annual') NOT NULL,
        periodStart DATE NOT NULL,
        periodEnd DATE NOT NULL,
        status ENUM('active','achieved','archived') NOT NULL DEFAULT 'active',
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY professional_progress_goals_user_period_idx (userId, periodType, periodStart)
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS professionalProgressReports (
        id INT NOT NULL AUTO_INCREMENT,
        userId INT NOT NULL,
        reportType ENUM('monthly','quarterly','annual','custom') NOT NULL,
        periodStart DATE NOT NULL,
        periodEnd DATE NOT NULL,
        snapshotJson TEXT NOT NULL,
        snapshotHash VARCHAR(64) NOT NULL,
        verificationCode VARCHAR(64) NOT NULL,
        generatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY professional_progress_reports_verification_uq (verificationCode),
        KEY professional_progress_reports_user_period_idx (userId, reportType, periodStart)
      )
    `);
    console.log("[0167] Professional progress records schema is ready.");
  } finally {
    await conn.end();
  }
}
main().catch(error => {
  console.error("[0167] Fatal error:", error);
  process.exit(1);
});
