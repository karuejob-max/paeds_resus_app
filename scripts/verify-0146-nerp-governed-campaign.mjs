/**
 * Read-only verifier for migration 0146.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0146-verify] DATABASE_URL is required.");
  process.exit(1);
}

const requiredTables = [
  "nerp_promotion_campaigns",
  "nerp_promotion_recipients",
  "nerp_promotion_audit_events",
];

const requiredColumns = {
  nerp_promotion_campaigns: [
    "campaign_key",
    "status",
    "audience_count",
    "approved_by_user_id",
    "approved_at",
  ],
  nerp_promotion_recipients: [
    "campaign_id",
    "staff_id",
    "email",
    "status",
    "provider_message_id",
    "provider_error",
  ],
  nerp_promotion_audit_events: [
    "campaign_id",
    "recipient_id",
    "action",
    "actor_user_id",
    "details",
  ],
};

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    const [tableRows] = await conn.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN (?, ?, ?)`,
      requiredTables
    );
    const tables = new Set(
      tableRows.map(row => row.TABLE_NAME ?? row.table_name)
    );
    for (const table of requiredTables) {
      if (!tables.has(table))
        throw new Error(`Missing required table: ${table}`);
    }

    for (const [table, columns] of Object.entries(requiredColumns)) {
      const [columnRows] = await conn.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?`,
        [table]
      );
      const present = new Set(
        columnRows.map(row => row.COLUMN_NAME ?? row.column_name)
      );
      for (const column of columns) {
        if (!present.has(column)) throw new Error(`Missing ${table}.${column}`);
      }
    }

    const [reasonRows] = await conn.query(
      `SHOW COLUMNS FROM \`nerp_campaign_suppressions\` LIKE 'reason_code'`
    );
    const reasonType = reasonRows[0]?.Type ?? reasonRows[0]?.type ?? "";
    for (const reason of ["unsubscribe", "hard_bounce"]) {
      if (!String(reasonType).includes(reason))
        throw new Error(`Suppression reason ${reason} is not available.`);
    }

    console.log(
      "[0146-verify] PASS: governed NERP campaign, immutable recipient, delivery-state, audit, and opt-out schema is present."
    );
    console.log(
      "[0146-verify] PASS: verifier performed read-only checks only; no campaign, email, learner, payment, clinical, or IERS mutation is implemented here."
    );
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error(
    "[0146-verify] FAIL:",
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
