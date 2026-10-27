import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const conn = await createMysqlConnection(url, mysql);

const expected = [
  ["cpdEvents", "cpd_events_institution_event_date_idx"],
  ["cpdEvents", "cpd_events_institution_created_idx"],
  ["cpdEventCoPresenters", "cpd_event_co_presenters_institution_event_idx"],
  ["cpdAttendees", "cpd_attendees_institution_event_dept_idx"],
  ["institutionalStaffMembers", "institutional_staff_institution_scope_idx"],
];

try {
  for (const [table, name] of expected) {
    const [rows] = await conn.query(
      `SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
      [table, name],
    );
    if (!rows.length) throw new Error(`[0189] Missing index ${table}.${name}`);
    console.log(`[0189-verify] PASS: ${table}.${name}`);
  }
  console.log("[0189-verify] PASS: read-only verification complete.");
} finally {
  await conn.end();
}
