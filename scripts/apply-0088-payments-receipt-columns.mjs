/**
 * Idempotent: migration 0088 -- CEO decision 2026-08-05 on the dormant
 * `individualInstallmentPayments` table (flagged 2026-07-31, never had a
 * writer anywhere in the codebase): retire it, and give `payments` the two
 * extra columns it had (`phoneNumber`, a typed `mpesaReceiptNumber`) so
 * every payment -- installment or not -- lives in one ledger.
 *
 * 1. ALTER `payments` ADD COLUMN `mpesaReceiptNumber` (unique, nullable --
 *    only mpesa payments populate it, and only once the receipt is known)
 *    and `phoneNumber` (nullable).
 * 2. DROP TABLE `individualInstallmentPayments` -- but only after confirming
 *    it is actually empty. A table with no code path writing to it should
 *    have zero rows, but "should" isn't "verified"; this migration checks
 *    live data before dropping anything, and refuses to proceed (leaving
 *    the table in place for a human to look at) if it finds any.
 *
 * Run: pnpm run db:apply-0088
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return (rows[0]?.c ?? 0) > 0;
}

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return (rows[0]?.c ?? 0) > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0088] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0088] Running payments receipt-columns migration...");

    // --- Step 1: add the two columns to `payments` ---------------------
    if (!(await tableExists(conn, "payments"))) {
      console.error("[0088] `payments` table not found -- aborting, schema drift suspected.");
      process.exit(1);
    }

    if (await columnExists(conn, "payments", "mpesaReceiptNumber")) {
      console.log("[0088]   \u2713 payments.mpesaReceiptNumber already exists -- skipping.");
    } else {
      await conn.query(
        "ALTER TABLE `payments` ADD COLUMN `mpesaReceiptNumber` VARCHAR(50) NULL UNIQUE"
      );
      console.log("[0088]   + payments.mpesaReceiptNumber added (nullable, unique).");
    }

    if (await columnExists(conn, "payments", "phoneNumber")) {
      console.log("[0088]   \u2713 payments.phoneNumber already exists -- skipping.");
    } else {
      await conn.query("ALTER TABLE `payments` ADD COLUMN `phoneNumber` VARCHAR(20) NULL");
      console.log("[0088]   + payments.phoneNumber added (nullable).");
    }

    // --- Step 2: drop `individualInstallmentPayments`, but only if empty ---
    if (!(await tableExists(conn, "individualInstallmentPayments"))) {
      console.log("[0088]   \u2713 individualInstallmentPayments already gone -- skipping drop.");
    } else {
      const [rows] = await conn.query(
        "SELECT COUNT(*) AS c FROM `individualInstallmentPayments`"
      );
      const rowCount = rows[0]?.c ?? 0;
      if (rowCount > 0) {
        console.error(
          `[0088] individualInstallmentPayments has ${rowCount} row(s) -- refusing to drop a non-empty table automatically. ` +
            "This contradicts the \"no writer anywhere in the codebase\" finding this decision was based on -- stop and investigate " +
            "where these rows came from (a script, a manual insert, an old deployed version) before deciding whether to migrate them " +
            "into `payments` first or proceed with a manual, deliberate drop."
        );
        process.exit(1);
      }
      console.log("[0088]   \u2713 individualInstallmentPayments confirmed empty (0 rows).");
      await conn.query("DROP TABLE `individualInstallmentPayments`");
      console.log("[0088]   + individualInstallmentPayments dropped.");
    }

    console.log("[0088] Done.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0088] Fatal error:", err);
  process.exit(1);
});
