import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const conn = await createMysqlConnection(url, mysql);

const indexes = [
  [
    "cpdEvents",
    "cpd_events_institution_event_date_idx",
    "(institutionalAccountId, eventDateAt, facilityDepartmentId)",
  ],
  [
    "cpdEvents",
    "cpd_events_institution_created_idx",
    "(institutionalAccountId, createdAt, facilityDepartmentId)",
  ],
  [
    "cpdEventCoPresenters",
    "cpd_event_co_presenters_institution_event_idx",
    "(institutionalAccountId, cpdEventId)",
  ],
  [
    "cpdAttendees",
    "cpd_attendees_institution_event_dept_idx",
    "(institutionalAccountId, cpdEventId, facilityDepartmentId)",
  ],
  [
    "institutionalStaffMembers",
    "institutional_staff_institution_scope_idx",
    "(institutionalAccountId, removedAt, facilityDepartmentId, userId)",
  ],
];

try {
  console.log("[0189] Preparing institutional Accountability performance indexes...");
  for (const [table, name, columns] of indexes) {
    const [rows] = await conn.query(
      "SHOW INDEX FROM `" + table + "` WHERE Key_name = ?",
      [name],
    );
    if (!rows.length) {
      await conn.query(`CREATE INDEX \`${name}\` ON \`${table}\` ${columns}`);
      console.log(`[0189] ✓ created ${table}.${name}`);
    } else {
      console.log(`[0189] ✓ ${table}.${name} exists`);
    }
  }
  console.log("[0189] Institutional Accountability performance indexes are ready.");
} finally {
  await conn.end();
}
