#!/usr/bin/env node
/**
 * Migration 0166 — deputy institutional roles.
 *
 * Additive and idempotent. Existing primary assignments remain unchanged;
 * deputy fields start NULL and are populated only by explicit assignment.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column],
  );
  return rows.length > 0;
}

async function addColumn(conn, table, column, sql) {
  if (await columnExists(conn, table, column)) {
    console.log(`[0166] ${table}.${column} already exists`);
    return;
  }
  await conn.query(`ALTER TABLE ${table} ADD COLUMN ${sql}`);
  console.log(`[0166] Added ${table}.${column}`);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    await addColumn(conn, "institutionDepartmentHeads", "deputyUserId", "deputyUserId INT NULL AFTER userId");
    await addColumn(conn, "institutionDepartmentHeads", "deputyAssignmentStatus", "deputyAssignmentStatus ENUM('pending_acceptance','active','declined','ended') NULL AFTER assignmentStatus");
    await addColumn(conn, "institutionDepartmentHeads", "deputyAssignedByUserId", "deputyAssignedByUserId INT NULL AFTER assignedByUserId");
    await addColumn(conn, "institutionDepartmentHeads", "deputyAssignedAt", "deputyAssignedAt TIMESTAMP NULL AFTER assignedAt");
    await addColumn(conn, "institutionDepartmentHeads", "deputyAcceptedAt", "deputyAcceptedAt TIMESTAMP NULL AFTER acceptedAt");
    await addColumn(conn, "institutionDepartmentHeads", "deputyDeclinedAt", "deputyDeclinedAt TIMESTAMP NULL AFTER declinedAt");
    await addColumn(conn, "institutionDepartmentHeads", "deputyDeclineReason", "deputyDeclineReason VARCHAR(500) NULL AFTER declineReason");

    await addColumn(conn, "institutionEducationCoordinators", "deputyUserId", "deputyUserId INT NULL AFTER userId");
    await addColumn(conn, "institutionEducationCoordinators", "deputyAssignmentStatus", "deputyAssignmentStatus ENUM('pending_acceptance','active','declined','ended') NULL AFTER assignmentStatus");
    await addColumn(conn, "institutionEducationCoordinators", "deputyAssignedByUserId", "deputyAssignedByUserId INT NULL AFTER assignedByUserId");
    await addColumn(conn, "institutionEducationCoordinators", "deputyAssignedAt", "deputyAssignedAt TIMESTAMP NULL AFTER assignedAt");
    await addColumn(conn, "institutionEducationCoordinators", "deputyAcceptedAt", "deputyAcceptedAt TIMESTAMP NULL AFTER acceptedAt");
    await addColumn(conn, "institutionEducationCoordinators", "deputyDeclinedAt", "deputyDeclinedAt TIMESTAMP NULL AFTER declinedAt");
    await addColumn(conn, "institutionEducationCoordinators", "deputyDeclineReason", "deputyDeclineReason VARCHAR(500) NULL AFTER declineReason");

    await addColumn(conn, "institution_department_response_coordinators", "deputy_user_id", "deputy_user_id INT NULL AFTER coordinator_user_id");
    await addColumn(conn, "institution_department_response_coordinators", "deputy_assignment_status", "deputy_assignment_status ENUM('pending_acceptance','active','declined','ended') NULL AFTER assignment_status");
    await addColumn(conn, "institution_department_response_coordinators", "deputy_accepted_at", "deputy_accepted_at TIMESTAMP NULL AFTER accepted_at");
    await addColumn(conn, "institution_department_response_coordinators", "deputy_declined_at", "deputy_declined_at TIMESTAMP NULL AFTER declined_at");
    await addColumn(conn, "institution_department_response_coordinators", "deputy_decline_reason", "deputy_decline_reason VARCHAR(500) NULL AFTER decline_reason");

    console.log("[0166] Deputy institutional role migration applied successfully.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0166] Fatal error:", error);
  process.exit(1);
});
