/**
 * Idempotent: migration 0085 -- CPD/CNE/CME Intelligence Engine Schema Expansion.
 * Adds event classification (CNE vs CME vs Workshop), presenter/speaker metadata,
 * presenting department tracking, attendance type (locum/outreach), and punctuality metrics.
 *
 * Run: pnpm run db:apply-0085
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0085] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0085] Running CPD Intelligence Engine Migration...");

    // --- cpdEvents table expansion ---
    if (!(await columnExists(conn, "cpdEvents", "eventType"))) {
      console.log("[0085] Adding eventType to cpdEvents...");
      await conn.query(
        `ALTER TABLE cpdEvents ADD COLUMN eventType ENUM('cne', 'cme', 'cpd_general', 'grand_rounds', 'journal_club', 'workshop') DEFAULT 'cpd_general' NOT NULL`
      );
    } else {
      console.log("[0085]   ✓ cpdEvents.eventType already exists.");
    }

    if (!(await columnExists(conn, "cpdEvents", "presenterUserId"))) {
      console.log("[0085] Adding presenterUserId to cpdEvents...");
      await conn.query(`ALTER TABLE cpdEvents ADD COLUMN presenterUserId INT NULL`);
    }

    if (!(await columnExists(conn, "cpdEvents", "presenterName"))) {
      console.log("[0085] Adding presenterName to cpdEvents...");
      await conn.query(`ALTER TABLE cpdEvents ADD COLUMN presenterName VARCHAR(255) NULL`);
    }

    if (!(await columnExists(conn, "cpdEvents", "presenterCadre"))) {
      console.log("[0085] Adding presenterCadre to cpdEvents...");
      await conn.query(`ALTER TABLE cpdEvents ADD COLUMN presenterCadre VARCHAR(128) NULL`);
    }

    if (!(await columnExists(conn, "cpdEvents", "presenterDepartment"))) {
      console.log("[0085] Adding presenterDepartment to cpdEvents...");
      await conn.query(`ALTER TABLE cpdEvents ADD COLUMN presenterDepartment VARCHAR(128) NULL`);
    }

    if (!(await columnExists(conn, "cpdEvents", "scheduledStartTime"))) {
      console.log("[0085] Adding scheduledStartTime to cpdEvents...");
      await conn.query(`ALTER TABLE cpdEvents ADD COLUMN scheduledStartTime VARCHAR(10) NULL`);
    }

    if (!(await columnExists(conn, "cpdEvents", "scheduledEndTime"))) {
      console.log("[0085] Adding scheduledEndTime to cpdEvents...");
      await conn.query(`ALTER TABLE cpdEvents ADD COLUMN scheduledEndTime VARCHAR(10) NULL`);
    }

    // --- cpdAttendees table expansion ---
    if (!(await columnExists(conn, "cpdAttendees", "attendanceType"))) {
      console.log("[0085] Adding attendanceType to cpdAttendees...");
      await conn.query(
        `ALTER TABLE cpdAttendees ADD COLUMN attendanceType ENUM('primary_facility', 'locum_outreach', 'guest_external') DEFAULT 'primary_facility' NOT NULL`
      );
    }

    if (!(await columnExists(conn, "cpdAttendees", "roleInEvent"))) {
      console.log("[0085] Adding roleInEvent to cpdAttendees...");
      await conn.query(
        `ALTER TABLE cpdAttendees ADD COLUMN roleInEvent ENUM('attendee', 'presenter', 'co_presenter', 'moderator') DEFAULT 'attendee' NOT NULL`
      );
    }

    if (!(await columnExists(conn, "cpdAttendees", "checkInPunctuality"))) {
      console.log("[0085] Adding checkInPunctuality to cpdAttendees...");
      await conn.query(
        `ALTER TABLE cpdAttendees ADD COLUMN checkInPunctuality ENUM('on_time', 'late_15m', 'late_30m+') DEFAULT 'on_time' NOT NULL`
      );
    }

    if (!(await columnExists(conn, "cpdAttendees", "clinicalTakeaway"))) {
      console.log("[0085] Adding clinicalTakeaway to cpdAttendees...");
      await conn.query(`ALTER TABLE cpdAttendees ADD COLUMN clinicalTakeaway TEXT NULL`);
    }

    console.log("[0085] Migration completed successfully!");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0085] Migration failed:", err);
  process.exit(1);
});
