import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  const [existing] = await connection.query("SHOW COLUMNS FROM institutionalAccounts LIKE 'licenceDeadlineAt'");
  if (Array.isArray(existing) && existing.length > 0) {
    console.log("[0205] licenceDeadlineAt already exists; nothing to do.");
  } else {
    await connection.execute(`
      ALTER TABLE institutionalAccounts
        ADD COLUMN licenceDeadlineAt TIMESTAMP NULL,
        ADD COLUMN licenceDeadlineSetByUserId INT NULL
    `);
    console.log("[0205] Added licenceDeadlineAt and licenceDeadlineSetByUserId to institutionalAccounts.");
  }
} finally {
  await connection.end();
}
