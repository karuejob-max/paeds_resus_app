import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  const [rows] = await connection.query("SHOW COLUMNS FROM `ahaPracticeLabAttempts` LIKE ?", ["criticalFailure"]);
  if (rows.length === 0) await connection.query("ALTER TABLE `ahaPracticeLabAttempts` ADD COLUMN `criticalFailure` BOOLEAN NOT NULL DEFAULT FALSE");
  console.log("[0182] Phase 2 critical-failure metadata is ready.");
} finally {
  await connection.end();
}
