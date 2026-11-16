import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  const [columns] = await connection.query("SHOW COLUMNS FROM institutionalQiReports LIKE 'failureModeCodes'");
  if (Array.isArray(columns) && columns.length === 0) {
    await connection.execute("ALTER TABLE institutionalQiReports ADD COLUMN failureModeCodes TEXT NULL AFTER targetMeasure");
    console.log("[0192] Added institutionalQiReports.failureModeCodes.");
  } else {
    console.log("[0192] institutionalQiReports.failureModeCodes already exists; no change needed.");
  }

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS institutionalQiCpdLinks (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      institutionalAccountId INT NOT NULL,
      reportId INT NOT NULL,
      cpdEventId INT NOT NULL,
      relationshipType ENUM('discussion','improvement_response','follow_up') NOT NULL DEFAULT 'discussion',
      createdByUserId INT NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY institutionalQiCpdLinks_unique_uq (institutionalAccountId, reportId, cpdEventId),
      KEY institutionalQiCpdLinks_report_idx (institutionalAccountId, reportId),
      KEY institutionalQiCpdLinks_event_idx (institutionalAccountId, cpdEventId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("[0192] institutionalQiCpdLinks exists and is ready.");
} finally {
  await connection.end();
}
