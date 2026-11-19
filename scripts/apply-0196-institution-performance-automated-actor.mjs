import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const conn = await createMysqlConnection(url, mysql);
try {
  const [columns] = await conn.query(
    `SELECT IS_NULLABLE FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'institutionalPerformanceReports' AND column_name = 'generatedByUserId' LIMIT 1`,
  );
  if (!columns.length) throw new Error("institutionalPerformanceReports.generatedByUserId does not exist");
  if (columns[0].IS_NULLABLE !== "YES") {
    await conn.query(`ALTER TABLE institutionalPerformanceReports MODIFY COLUMN generatedByUserId INT NULL`);
  }
  console.log("[0196] Automated institutional report actor handling is ready.");
} finally {
  await conn.end();
}
