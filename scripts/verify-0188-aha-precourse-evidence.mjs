import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const conn = await createMysqlConnection(url, mysql);
try {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enrollments' AND COLUMN_NAME IN ('precourseAssessmentScore','precourseAssessmentScreenshotUrl')`,
  );
  const found = new Map(rows.map((row) => [row.COLUMN_NAME, row.DATA_TYPE]));
  for (const [name, type] of [["precourseAssessmentScore", "int"], ["precourseAssessmentScreenshotUrl", "text"]]) {
    if (found.get(name) !== type) throw new Error(`[0188] Missing or incorrect ${name}: ${found.get(name) ?? "absent"}`);
    console.log(`[0188-verify] PASS: enrollments.${name} (${type})`);
  }
  console.log("[0188-verify] PASS: read-only verification complete.");
} finally { await conn.end(); }
