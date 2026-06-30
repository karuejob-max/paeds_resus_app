/**
 * Migration 0055 — Expand cneAttendees.cadre enum with additional values.
 *
 * Adds: MSN, KRNM, ERN, HND, Student Nurse
 * MySQL ENUM columns require ALTER TABLE MODIFY to add new values.
 * This is idempotent: MySQL silently accepts the same definition.
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[0055] DATABASE_URL not set. Aborting.");
  process.exit(1);
}

const url = new URL(DATABASE_URL);
const conn = await mysql.createConnection({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: url.username,
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

try {
  await conn.execute(`
    ALTER TABLE cneAttendees
    MODIFY COLUMN cadre ENUM('BSN', 'MSN', 'KRCHN', 'KRN', 'KRNM', 'ERN', 'HND', 'Student Nurse', 'Other') NOT NULL
  `);
  console.log("[0055] Updated cneAttendees.cadre enum: added MSN, KRNM, ERN, HND, Student Nurse.");
} catch (err) {
  if (err.code === "ER_DUP_ENTRY" || err.message?.includes("already exists")) {
    console.log("[0055] cadre enum already up to date (idempotent).");
  } else {
    throw err;
  }
} finally {
  await conn.end();
  console.log("[0055] CNE cadre enum migration complete.");
}
