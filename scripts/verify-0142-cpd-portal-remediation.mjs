/* Read-only verifier for migration 0142. */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0142-verify] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    const requiredColumns = {
      cpdEvents: ["lifecycleStatus"],
      cpdEventCoPresenters: ["participantType"],
      cpdAttendees: ["userId", "attendanceStatus", "checkedInAt", "attendanceVerifiedAt", "attendanceVerifiedByUserId", "attendanceReviewReason"],
      institutionLearningTargets: ["revisionNumber", "supersedesTargetId", "revisionReason", "archivedAt", "archivedByUserId"],
    };
    const requiredTables = ["cpdAttendanceAuditEvents", "cpdEventAuditEvents", "cpdExportAuditLogs", "institutionLearningTargetEvents"];
    const missing = [];
    for (const [table, columns] of Object.entries(requiredColumns)) {
      for (const column of columns) {
        const [rows] = await conn.query(
          "SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
          [table, column]
        );
        if (Number(rows?.[0]?.c ?? 0) !== 1) missing.push(`${table}.${column}`);
      }
    }
    for (const table of requiredTables) {
      const [rows] = await conn.query(
        "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
        [table]
      );
      if (Number(rows?.[0]?.c ?? 0) !== 1) missing.push(table);
    }
    if (missing.length) {
      console.error(`[0142-verify] Missing: ${missing.join(", ")}`);
      process.exit(1);
    }

    const [statusRows] = await conn.query(
      "SELECT COLUMN_TYPE AS columnType FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'cpdAttendees' AND column_name = 'attendanceStatus' LIMIT 1"
    );
    const attendanceType = String(statusRows?.[0]?.columnType ?? "");
    for (const status of ["registered", "checked_in", "attendance_verified", "excused", "cancelled"]) {
      if (!attendanceType.includes(`'${status}'`)) throw new Error(`[0142-verify] attendanceStatus is missing ${status}`);
    }

    const [lifecycleRows] = await conn.query(
      "SELECT COLUMN_TYPE AS columnType FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'cpdEvents' AND column_name = 'lifecycleStatus' LIMIT 1"
    );
    const lifecycleType = String(lifecycleRows?.[0]?.columnType ?? "");
    for (const status of ["draft", "scheduled", "open", "attendance_review", "closed", "certificates_issued", "archived", "cancelled", "voided"]) {
      if (!lifecycleType.includes(`'${status}'`)) throw new Error(`[0142-verify] lifecycleStatus is missing ${status}`);
    }

    console.log("[0142-verify] PASS: CPD lifecycle, stable attendee identity, verified-attendance, audit, export, and target-revision schema is present.");
    console.log("[0142-verify] PASS: verifier performed read-only checks only; no email delivery or IERS mutation is implemented here.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0142-verify] FAIL:", error);
  process.exit(1);
});
