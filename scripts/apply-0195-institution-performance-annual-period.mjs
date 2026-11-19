import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const conn = await createMysqlConnection(url, mysql);

try {
  const [columns] = await conn.query(
    `SELECT COLUMN_TYPE FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'institutionalPerformanceReports' AND column_name = 'periodType' LIMIT 1`,
  );
  if (columns.length === 0) throw new Error("institutionalPerformanceReports.periodType does not exist");
  const columnType = columns[0].COLUMN_TYPE ?? columns[0].columnType ?? "";
  if (!String(columnType).includes("'annual'")) {
    await conn.query(`ALTER TABLE institutionalPerformanceReports MODIFY COLUMN periodType ENUM('monthly', 'quarterly', 'annual') NOT NULL`);
  }
  console.log("[0195] Institutional annual performance report periods are ready.");
} finally {
  await conn.end();
}
