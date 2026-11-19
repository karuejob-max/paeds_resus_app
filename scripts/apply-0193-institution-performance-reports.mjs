import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const conn = await createMysqlConnection(url, mysql);

try {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS institutionalPerformanceReports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      institutionalAccountId INT NOT NULL,
      periodType ENUM('monthly', 'quarterly') NOT NULL,
      periodStart DATE NOT NULL,
      periodEnd DATE NOT NULL,
      timezone VARCHAR(64) NOT NULL DEFAULT 'Africa/Nairobi',
      reportVersion VARCHAR(32) NOT NULL DEFAULT 'v1',
      status ENUM('final') NOT NULL DEFAULT 'final',
      generatedByUserId INT NOT NULL,
      generatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      snapshotJson TEXT NOT NULL,
      sourceSummaryJson TEXT NOT NULL,
      limitationsJson TEXT NOT NULL,
      UNIQUE KEY institutional_performance_reports_period_uq (institutionalAccountId, periodType, periodStart),
      KEY institutional_performance_reports_institution_period_idx (institutionalAccountId, periodType, periodStart)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("[0193] Institutional performance report snapshots are ready.");
} finally {
  await conn.end();
}
