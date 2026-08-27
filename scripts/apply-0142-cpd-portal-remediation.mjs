/*
 * Migration 0142 — CPD Portal remediation.
 * Reservation: migration-reserved-0142
 *
 * Additive and idempotent. It creates explicit CPD lifecycle/attendance states,
 * append-only audit trails, export governance, presenter type metadata, and
 * target revision fields. It does not send email or modify IERS records.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0142] DATABASE_URL is required.");
  process.exit(1);
}

async function columnExists(conn, tableName, columnName) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
    [tableName, columnName]
  );
  return Number(rows?.[0]?.c ?? 0) > 0;
}

async function tableExists(conn, tableName) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
    [tableName]
  );
  return Number(rows?.[0]?.c ?? 0) > 0;
}

async function addColumn(conn, tableName, columnName, definition) {
  if (!(await columnExists(conn, tableName, columnName))) {
    await conn.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
  }
}

async function createTable(conn, tableName, ddl) {
  if (!(await tableExists(conn, tableName))) {
    await conn.query(ddl);
  }
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0142] Preparing CPD Portal remediation...");

    await addColumn(
      conn,
      "cpdEvents",
      "lifecycleStatus",
      "ENUM('draft','scheduled','open','attendance_review','closed','certificates_issued','archived','cancelled','voided') NOT NULL DEFAULT 'open'"
    );
    await conn.query("UPDATE `cpdEvents` SET `lifecycleStatus` = CASE WHEN `isOpen` = 1 THEN 'open' ELSE 'closed' END");

    await addColumn(
      conn,
      "cpdEventCoPresenters",
      "participantType",
      "ENUM('institution_member','guest') NOT NULL DEFAULT 'institution_member'"
    );

    await addColumn(conn, "cpdAttendees", "userId", "INT NULL");
    await addColumn(
      conn,
      "cpdAttendees",
      "attendanceStatus",
      "ENUM('registered','checked_in','attendance_verified','excused','cancelled') NOT NULL DEFAULT 'registered'"
    );
    await addColumn(conn, "cpdAttendees", "checkedInAt", "DATETIME NULL");
    await addColumn(conn, "cpdAttendees", "attendanceVerifiedAt", "DATETIME NULL");
    await addColumn(conn, "cpdAttendees", "attendanceVerifiedByUserId", "INT NULL");
    await addColumn(conn, "cpdAttendees", "attendanceReviewReason", "TEXT NULL");
    // Preserve historical certificate/report behaviour while making new registrations explicit.
    // Existing rows are marked with a review reason so they remain distinguishable from new,
    // not-yet-reviewed registrations.
    await conn.query(`
      UPDATE \`cpdAttendees\` a
      INNER JOIN \`cpdEvents\` e ON e.\`id\` = a.\`cpdEventId\`
      SET a.\`attendanceStatus\` = 'attendance_verified',
          a.\`attendanceVerifiedAt\` = COALESCE(a.\`submittedAt\`, e.\`closedAt\`, e.\`createdAt\`),
          a.\`attendanceReviewReason\` = COALESCE(a.\`attendanceReviewReason\`, 'Legacy CPD attendance migrated from registration-based workflow')
      WHERE a.\`attendanceStatus\` = 'registered'
        AND e.\`createdAt\` < CURRENT_TIMESTAMP()
    `);

    await addColumn(
      conn,
      "institutionLearningTargets",
      "revisionNumber",
      "INT NOT NULL DEFAULT 1"
    );
    await addColumn(conn, "institutionLearningTargets", "supersedesTargetId", "INT NULL");
    await addColumn(conn, "institutionLearningTargets", "revisionReason", "TEXT NULL");
    await addColumn(conn, "institutionLearningTargets", "archivedAt", "DATETIME NULL");
    await addColumn(conn, "institutionLearningTargets", "archivedByUserId", "INT NULL");
    const [targetStatusColumns] = await conn.query(
      "SELECT COLUMN_TYPE AS columnType FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'institutionLearningTargets' AND column_name = 'status' LIMIT 1"
    );
    const targetStatusType = String(targetStatusColumns?.[0]?.columnType ?? "");
    if (targetStatusType && !targetStatusType.includes("'superseded'")) {
      await conn.query("ALTER TABLE `institutionLearningTargets` MODIFY COLUMN `status` ENUM('active','archived','superseded') NOT NULL DEFAULT 'active'");
    }

    await createTable(
      conn,
      "cpdAttendanceAuditEvents",
      `CREATE TABLE IF NOT EXISTS \`cpdAttendanceAuditEvents\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`institutionalAccountId\` INT NOT NULL,
        \`cpdEventId\` INT NOT NULL,
        \`cpdAttendeeId\` INT NOT NULL,
        \`previousStatus\` VARCHAR(32) NULL,
        \`nextStatus\` VARCHAR(32) NOT NULL,
        \`reason\` TEXT NOT NULL,
        \`actorUserId\` INT NOT NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`cpd_attendance_audit_attendee_idx\` (\`cpdAttendeeId\`, \`createdAt\`),
        KEY \`cpd_attendance_audit_institution_idx\` (\`institutionalAccountId\`, \`createdAt\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    );

    await createTable(
      conn,
      "cpdEventAuditEvents",
      `CREATE TABLE IF NOT EXISTS \`cpdEventAuditEvents\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`institutionalAccountId\` INT NOT NULL,
        \`cpdEventId\` INT NOT NULL,
        \`action\` ENUM('created','opened','scheduled','closed','attendance_review','certificates_issued','archived','cancelled','voided','updated','presenter_changed','audience_changed') NOT NULL,
        \`previousStatus\` VARCHAR(32) NULL,
        \`nextStatus\` VARCHAR(32) NULL,
        \`reason\` TEXT NULL,
        \`changedFields\` TEXT NULL,
        \`actorUserId\` INT NOT NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`cpd_event_audit_event_idx\` (\`cpdEventId\`, \`createdAt\`),
        KEY \`cpd_event_audit_institution_idx\` (\`institutionalAccountId\`, \`createdAt\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    );

    await createTable(
      conn,
      "institutionLearningTargetEvents",
      `CREATE TABLE IF NOT EXISTS \`institutionLearningTargetEvents\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`institutionalAccountId\` INT NOT NULL,
        \`targetId\` INT NOT NULL,
        \`action\` ENUM('created','revised','superseded','archived') NOT NULL,
        \`previousStatus\` VARCHAR(32) NULL,
        \`nextStatus\` VARCHAR(32) NULL,
        \`reason\` TEXT NOT NULL,
        \`actorUserId\` INT NOT NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`institution_learning_target_events_target_idx\` (\`targetId\`, \`createdAt\`),
        KEY \`institution_learning_target_events_institution_idx\` (\`institutionalAccountId\`, \`createdAt\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    );

    await createTable(
      conn,
      "cpdExportAuditLogs",
      `CREATE TABLE IF NOT EXISTS \`cpdExportAuditLogs\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`institutionalAccountId\` INT NOT NULL,
        \`eventId\` INT NULL,
        \`exportType\` ENUM('attendance_csv','certificates_zip') NOT NULL,
        \`includesContactData\` TINYINT(1) NOT NULL DEFAULT 0,
        \`rowCount\` INT NOT NULL DEFAULT 0,
        \`periodStart\` DATE NULL,
        \`periodEnd\` DATE NULL,
        \`actorUserId\` INT NOT NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`cpd_export_audit_institution_idx\` (\`institutionalAccountId\`, \`createdAt\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    );

    console.log("[0142] CPD Portal remediation is ready.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0142] Fatal error:", error);
  process.exit(1);
});
