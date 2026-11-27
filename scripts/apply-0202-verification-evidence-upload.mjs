import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  const [existing] = await connection.query("SHOW COLUMNS FROM institutionalAccounts LIKE 'verificationEvidenceKey'");
  if (Array.isArray(existing) && existing.length > 0) {
    console.log("[0202] Verification evidence columns already exist; nothing to do.");
  } else {
    await connection.execute(`
      ALTER TABLE institutionalAccounts
        ADD COLUMN verificationEvidenceKey VARCHAR(500) NULL,
        ADD COLUMN verificationEvidenceFileName VARCHAR(255) NULL,
        ADD COLUMN verificationEvidenceContentType VARCHAR(100) NULL,
        ADD COLUMN verificationLicenceNumber VARCHAR(100) NULL,
        ADD COLUMN verificationFacilityNotListed TINYINT(1) NOT NULL DEFAULT 0
    `);
    console.log("[0202] Added evidence upload columns to institutionalAccounts.");
  }
} finally {
  await connection.end();
}
