import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function exists(conn, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enrollments' AND COLUMN_NAME = ? LIMIT 1`,
    [column],
  );
  return rows.length > 0;
}
async function add(conn, column, ddl) {
  if (await exists(conn, column)) { console.log(`[0188] ✓ enrollments.${column} exists`); return; }
  await conn.query(ddl);
  console.log(`[0188] + enrollments.${column}`);
}
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const conn = await createMysqlConnection(url, mysql);
try {
  await add(conn, "precourseAssessmentScore", "ALTER TABLE enrollments ADD COLUMN precourseAssessmentScore INT NULL AFTER precourseAssessmentCertificateUrl");
  await add(conn, "precourseAssessmentScreenshotUrl", "ALTER TABLE enrollments ADD COLUMN precourseAssessmentScreenshotUrl TEXT NULL AFTER precourseAssessmentScore");
  console.log("[0188] AHA precourse score and screenshot evidence ready.");
} finally { await conn.end(); }
