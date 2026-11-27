import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  const [existing] = await connection.query("SHOW COLUMNS FROM institutionalAccounts LIKE 'archivedAt'");
  if (Array.isArray(existing) && existing.length > 0) {
    console.log("[0201] institutionalAccounts archive columns already exist; skipping ALTER.");
  } else {
    await connection.execute(`
      ALTER TABLE institutionalAccounts
        ADD COLUMN archivedAt TIMESTAMP NULL,
        ADD COLUMN archivedByUserId INT NULL,
        ADD COLUMN archiveReason VARCHAR(500) NULL
    `);
    console.log("[0201] Added archive columns to institutionalAccounts.");
  }

  // Widen the audit enum so archive / restore decisions are recorded. Re-running is harmless.
  await connection.execute(`
    ALTER TABLE institutionVerificationEvents
      MODIFY COLUMN eventType ENUM('submitted','verified','rejected','revoked','grandfathered','archived','restored') NOT NULL
  `);
  console.log("[0201] institutionVerificationEvents now records 'archived' and 'restored'.");
} finally {
  await connection.end();
}
