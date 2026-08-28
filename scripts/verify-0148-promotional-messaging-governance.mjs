/**
 * Read-only verifier for migration 0148.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0148-verify] DATABASE_URL is required.");
  process.exit(1);
}

const requiredColumns = {
  promotional_message_preferences: [
    "user_id",
    "consent_status",
    "consent_source",
    "consented_at",
    "opted_out_at",
  ],
  promotional_message_suppressions: [
    "email",
    "reason",
    "is_active",
    "deactivated_at",
  ],
  promotional_campaigns: [
    "campaign_key",
    "audience_filter_json",
    "consent_policy",
    "status",
    "approved_at",
  ],
  promotional_campaign_recipients: [
    "campaign_id",
    "user_id",
    "email",
    "cadre",
    "consent_status",
    "status",
  ],
  promotional_campaign_audit_events: [
    "campaign_id",
    "recipient_id",
    "action",
    "actor_user_id",
  ],
  promotional_preference_audit_events: [
    "user_id",
    "previous_status",
    "next_status",
    "source",
    "actor_user_id",
  ],
};

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    const tables = Object.keys(requiredColumns);
    const [tableRows] = await conn.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN (${tables.map(() => "?").join(",")})`,
      tables
    );
    const presentTables = new Set(
      tableRows.map(row => row.TABLE_NAME ?? row.table_name)
    );
    for (const table of tables) {
      if (!presentTables.has(table))
        throw new Error(`Missing required table: ${table}`);
      const [columnRows] = await conn.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?`,
        [table]
      );
      const presentColumns = new Set(
        columnRows.map(row => row.COLUMN_NAME ?? row.column_name)
      );
      for (const column of requiredColumns[table]) {
        if (!presentColumns.has(column))
          throw new Error(`Missing ${table}.${column}`);
      }
    }
    const [reasonRows] = await conn.query(
      `SHOW COLUMNS FROM promotional_message_suppressions LIKE 'reason'`
    );
    const reasonType = String(reasonRows[0]?.Type ?? reasonRows[0]?.type ?? "");
    for (const reason of ["unsubscribe", "hard_bounce", "manual"]) {
      if (!reasonType.includes(reason))
        throw new Error(`Suppression reason ${reason} is not available.`);
    }
    console.log(
      "[0148-verify] PASS: promotional consent, global opt-out, cross-cadre campaign snapshot, delivery, and audit schema is present."
    );
    console.log(
      "[0148-verify] PASS: verifier performed read-only checks only; no preference, campaign, recipient, email, clinical, IERS, or IERP mutation is implemented here."
    );
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error(
    "[0148-verify] FAIL:",
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
