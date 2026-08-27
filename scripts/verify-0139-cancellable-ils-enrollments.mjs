/*
 * Read-only verification for migration 0139.
 * Confirms the reversible enrollment cancellation columns and terminal
 * cancelled payment state exist in the connected database.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0139 verify] DATABASE_URL is required.");
  process.exit(1);
}

async function column(conn, tableName, columnName) {
  const [rows] = await conn.query(
    "SELECT COLUMN_TYPE AS columnType, IS_NULLABLE AS isNullable, COLUMN_DEFAULT AS columnDefault FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1",
    [tableName, columnName]
  );
  return rows?.[0] ?? null;
}

function assertPresent(label, value) {
  if (!value) throw new Error(`${label} is missing`);
  console.log(`[0139 verify] PASS — ${label}`);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    const enrollmentStatus = await column(
      conn,
      "enrollments",
      "enrollmentStatus"
    );
    assertPresent("enrollments.enrollmentStatus", enrollmentStatus);
    if (!String(enrollmentStatus.columnType).includes("'cancelled'")) {
      throw new Error(
        "enrollments.enrollmentStatus does not include cancelled"
      );
    }

    for (const name of [
      "cancelledAt",
      "cancelledByUserId",
      "cancellationReason",
    ]) {
      assertPresent(
        `enrollments.${name}`,
        await column(conn, "enrollments", name)
      );
    }

    const paymentStatus = await column(conn, "payments", "status");
    assertPresent("payments.status", paymentStatus);
    if (!String(paymentStatus.columnType).includes("'cancelled'")) {
      throw new Error("payments.status does not include cancelled");
    }
    console.log(
      "[0139 verify] All reversible cancellation schema checks passed; no write was performed."
    );
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0139 verify] Fatal error:", error);
  process.exit(1);
});
