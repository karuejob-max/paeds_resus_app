/**
 * Additive, idempotent migration for institutional role acceptance.
 * Existing active appointments remain active; new and reassigned appointments
 * can require explicit acceptance or decline with a reason.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0163] DATABASE_URL is required.");
  process.exit(1);
}

async function columnExists(conn, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName],
  );
  return rows.length > 0;
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    for (const table of ["institutionDepartmentHeads", "institutionEducationCoordinators"]) {
      const statusColumn = table === "institutionDepartmentHeads" ? "assignmentStatus" : "assignmentStatus";
      await conn.query(
        `ALTER TABLE \`${table}\` MODIFY COLUMN \`${statusColumn}\` ENUM('pending_acceptance','active','declined','ended') NOT NULL DEFAULT 'active'`,
      );
      for (const [column, definition] of [
        ["acceptedAt", "TIMESTAMP NULL"],
        ["declinedAt", "TIMESTAMP NULL"],
        ["declineReason", "VARCHAR(500) NULL"],
      ]) {
        if (!(await columnExists(conn, table, column))) {
          await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        }
      }
    }
    console.log("[0163] Institutional role acceptance migration applied successfully.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0163] Fatal error:", error);
  process.exit(1);
});
