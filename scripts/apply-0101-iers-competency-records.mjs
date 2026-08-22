#!/usr/bin/env node
/**
 * Migration 0101 — per-program IERS competency records.
 *
 * Raw trainingAttendance remains the session-management source record. This
 * projection gives IERS a separate, tenant-scoped readiness record so generic
 * institutional staff enrollment fields are not treated as competency proof.
 *
 * Run: pnpm run db:apply-0101
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0101] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0101] Creating IERS competency record projection...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS iersCompetencyRecords (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institutionalAccountId INT NOT NULL,
        staffMemberId INT NOT NULL,
        trainingScheduleId INT NOT NULL,
        trainingAttendanceId INT NOT NULL UNIQUE,
        programType ENUM('bls', 'acls', 'pals', 'fellowship') NOT NULL,
        competencyStatus ENUM('pending', 'attended', 'absent', 'cancelled', 'verified') NOT NULL DEFAULT 'pending',
        verifiedByUserId INT NULL,
        verifiedAt TIMESTAMP NULL,
        verificationNotes TEXT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY iersCompetencyRecords_institution_status_idx (institutionalAccountId, competencyStatus),
        KEY iersCompetencyRecords_institution_program_idx (institutionalAccountId, programType),
        KEY iersCompetencyRecords_staff_program_idx (staffMemberId, programType)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      INSERT IGNORE INTO iersCompetencyRecords
        (institutionalAccountId, staffMemberId, trainingScheduleId, trainingAttendanceId, programType, competencyStatus)
      SELECT
        s.institutionalAccountId,
        a.staffMemberId,
        a.trainingScheduleId,
        a.id,
        c.programType,
        CASE
          WHEN a.attendanceStatus = 'attended' THEN 'attended'
          WHEN a.attendanceStatus = 'absent' THEN 'absent'
          WHEN a.attendanceStatus = 'cancelled' THEN 'cancelled'
          ELSE 'pending'
        END
      FROM trainingAttendance a
      INNER JOIN trainingSchedules s ON s.id = a.trainingScheduleId
      INNER JOIN courses c ON c.id = s.courseId
      WHERE s.institutionalAccountId IS NOT NULL
        AND c.programType IN ('bls', 'acls', 'pals', 'fellowship');
    `);

    const [rows] = await conn.query("SELECT COUNT(*) AS competencyRecordCount FROM iersCompetencyRecords");
    console.log(`[0101] Ready. Competency records present: ${rows[0]?.competencyRecordCount ?? 0}`);
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0101] Fatal error:", error);
  process.exit(1);
});
