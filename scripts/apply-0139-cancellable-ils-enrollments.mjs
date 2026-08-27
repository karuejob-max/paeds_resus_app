/*
 * Migration 0139 — reversible cancellation for pending ILS enrollments.
 * Reservation: migration-reserved-0139
 *
 * Additive and idempotent. It preserves enrollment/payment rows and adds
 * explicit cancellation state so a pending start can be undone without a
 * hard delete or a delayed M-Pesa callback resurrecting access.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0139] DATABASE_URL is required.");
  process.exit(1);
}

async function columnExists(conn, tableName, columnName) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
    [tableName, columnName]
  );
  return Number(rows?.[0]?.c ?? 0) > 0;
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0139] Preparing reversible ILS enrollment cancellation...");

    if (!(await columnExists(conn, "enrollments", "enrollmentStatus"))) {
      await conn.query(`
        ALTER TABLE \`enrollments\`
        ADD COLUMN \`enrollmentStatus\` ENUM('active','cancelled') NOT NULL DEFAULT 'active'
        AFTER \`paymentStatus\`
      `);
    }

    if (!(await columnExists(conn, "enrollments", "cancelledAt"))) {
      await conn.query(`
        ALTER TABLE \`enrollments\`
        ADD COLUMN \`cancelledAt\` DATETIME NULL
        AFTER \`enrollmentStatus\`
      `);
    }

    if (!(await columnExists(conn, "enrollments", "cancelledByUserId"))) {
      await conn.query(`
        ALTER TABLE \`enrollments\`
        ADD COLUMN \`cancelledByUserId\` INT NULL
        AFTER \`cancelledAt\`
      `);
    }

    if (!(await columnExists(conn, "enrollments", "cancellationReason"))) {
      await conn.query(`
        ALTER TABLE \`enrollments\`
        ADD COLUMN \`cancellationReason\` VARCHAR(255) NULL
        AFTER \`cancelledByUserId\`
      `);
    }

    const [paymentColumns] = await conn.query(
      "SELECT COLUMN_TYPE AS columnType FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'payments' AND column_name = 'status' LIMIT 1"
    );
    const currentPaymentType = String(paymentColumns?.[0]?.columnType ?? "");
    if (currentPaymentType && !currentPaymentType.includes("'cancelled'")) {
      await conn.query(`
        ALTER TABLE \`payments\`
        MODIFY COLUMN \`status\` ENUM('pending','completed','failed','cancelled') DEFAULT 'pending'
      `);
    }

    console.log("[0139] Reversible ILS enrollment cancellation is ready.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0139] Fatal error:", error);
  process.exit(1);
});
