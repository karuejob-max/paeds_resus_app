import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  const [existing] = await connection.query("SHOW COLUMNS FROM careFacilities LIKE 'mflCode'");
  if (Array.isArray(existing) && existing.length > 0) {
    console.log("[0204] careFacilities already has mflCode; nothing to do.");
  } else {
    await connection.execute(`
      ALTER TABLE careFacilities
        ADD COLUMN mflCode VARCHAR(10) NULL,
        ADD COLUMN needsReview TINYINT(1) NOT NULL DEFAULT 0,
        ADD COLUMN createdByUserId INT NULL,
        ADD INDEX idx_careFacilities_mflCode (mflCode)
    `);
    console.log("[0204] Added mflCode, needsReview and createdByUserId to careFacilities.");
  }
} finally {
  await connection.end();
}
