/**
 * Idempotent: migration 0061 — raw narrative immutability constraint
 * (gap-analysis #8, Observation Architecture v1.1 Principle 2).
 *
 * "Raw narrative fields (TEXT) are immutable after submission — never
 * truncated, overwritten, or deleted except by legal requirement with
 * explicit audit trail." Until now this was a discipline convention only —
 * no application code happened to update raw_narrative, but nothing
 * prevented it either. This migration enforces it at the database level,
 * which holds regardless of which application code path (or future bug,
 * or ad-hoc script) attempts the update.
 *
 * What this creates:
 *   1. `care_signal_raw_narrative_audit` — append-only log of every
 *      permitted change to raw_narrative (should almost never have rows).
 *   2. A BEFORE UPDATE trigger on careSignalEvents that:
 *      - Allows the update through unchanged if raw_narrative isn't being
 *        changed (including NULL → NULL, or setting it for the first time
 *        from NULL, which nothing in the app currently does but isn't the
 *        immutability violation this guards against).
 *      - Blocks the update with a SQL error otherwise, UNLESS a session
 *        variable @RAW_NARRATIVE_LEGAL_OVERRIDE_REASON is set to a
 *        non-empty string for that session — this can only be set by
 *        someone with direct database access (deliberately not exposed
 *        through the application), matching the "except by legal
 *        requirement" carve-out. When used, the trigger itself writes the
 *        audit row — the trail cannot be skipped even via raw SQL, as long
 *        as the override path is used rather than disabling the trigger.
 *
 * This does NOT change server/lib/dsar-deletion.ts or
 * server/lib/retention-cleanup.ts, both of which currently hard-DELETE
 * careSignalEvents rows (including raw_narrative) rather than the
 * anonymise-and-retain pattern Observation Architecture's Layer 0 table
 * describes ("On account deletion: userId set null, narrative retained").
 * That's a real discrepancy between the current DSAR/retention
 * implementation and the documented architecture, but it's a privacy/legal
 * compliance question (GDPR/Kenya DPA right-to-erasure vs. permanent
 * research retention), not a database-constraint question — it needs your
 * decision, not a unilateral code change bundled into this migration. See
 * docs/WORK_STATUS.md.
 *
 * Run: pnpm run db:apply-0061
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function tableExists(conn, name) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) as c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`,
    [name]
  );
  return rows[0].c > 0;
}

async function triggerExists(conn, name) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) as c FROM information_schema.triggers WHERE trigger_schema = DATABASE() AND trigger_name = ?`,
    [name]
  );
  return rows[0].c > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0061] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);

  try {
    const auditTable = "care_signal_raw_narrative_audit";
    if (await tableExists(conn, auditTable)) {
      console.log(`[0061]   ✓ ${auditTable} already exists — skipping.`);
    } else {
      await conn.query(`
        CREATE TABLE \`${auditTable}\` (
          \`id\`               INT           NOT NULL AUTO_INCREMENT,
          \`care_signal_event_id\` INT       NOT NULL,
          \`old_value\`        TEXT          NULL,
          \`new_value\`        TEXT          NULL,
          \`reason\`           TEXT          NOT NULL,
          \`changed_at\`       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log(`[0061]   + Created ${auditTable}.`);
    }

    const triggerName = "trg_care_signal_raw_narrative_immutable";
    if (await triggerExists(conn, triggerName)) {
      console.log(`[0061]   ✓ Trigger ${triggerName} already exists — skipping.`);
    } else {
      // No DELIMITER needed — mysql2 sends this whole CREATE TRIGGER
      // statement as a single protocol-level query, so the semicolons
      // inside the BEGIN...END body don't need escaping the way they would
      // in the `mysql` CLI client.
      await conn.query(`
        CREATE TRIGGER \`${triggerName}\`
        BEFORE UPDATE ON \`careSignalEvents\`
        FOR EACH ROW
        BEGIN
          IF (OLD.raw_narrative IS NOT NULL)
             AND (NEW.raw_narrative IS NULL OR NEW.raw_narrative <> OLD.raw_narrative)
             AND (@RAW_NARRATIVE_LEGAL_OVERRIDE_REASON IS NULL OR @RAW_NARRATIVE_LEGAL_OVERRIDE_REASON = '')
          THEN
            SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'raw_narrative is immutable after submission (Observation Architecture Principle 2). Set @RAW_NARRATIVE_LEGAL_OVERRIDE_REASON if this is a genuine legal-requirement exception.';
          END IF;

          IF (OLD.raw_narrative IS NOT NULL)
             AND (NEW.raw_narrative IS NULL OR NEW.raw_narrative <> OLD.raw_narrative)
             AND (@RAW_NARRATIVE_LEGAL_OVERRIDE_REASON IS NOT NULL AND @RAW_NARRATIVE_LEGAL_OVERRIDE_REASON <> '')
          THEN
            INSERT INTO care_signal_raw_narrative_audit (care_signal_event_id, old_value, new_value, reason)
            VALUES (OLD.id, OLD.raw_narrative, NEW.raw_narrative, @RAW_NARRATIVE_LEGAL_OVERRIDE_REASON);
          END IF;
        END
      `);
      console.log(`[0061]   + Created trigger ${triggerName}.`);
    }

    console.log("[0061] Done. Verify with scripts/verify-0061-raw-narrative-immutable.mjs.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0061] Fatal error:", err);
  process.exit(1);
});
