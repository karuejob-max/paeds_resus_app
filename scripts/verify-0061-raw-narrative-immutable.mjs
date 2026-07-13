/**
 * Verify migration 0061 — actually exercises the trigger rather than just
 * checking it exists: confirms a plain UPDATE to raw_narrative is rejected,
 * and that the legal-override session variable path works and is audited.
 *
 * Uses a transaction rolled back at the end — never leaves test data behind,
 * and never permanently alters a real event's raw_narrative.
 *
 * Run: pnpm run verify:raw-narrative-immutable
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[verify-0061] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  let failures = 0;

  try {
    const [sample] = await conn.query(
      `SELECT id, raw_narrative FROM careSignalEvents WHERE raw_narrative IS NOT NULL LIMIT 1`
    );
    if (sample.length === 0) {
      console.log("[verify-0061] No events with raw_narrative set yet — nothing to test against. " +
        "This is expected on a fresh install; the trigger is still active for future rows.");
      return;
    }

    const { id, raw_narrative: original } = sample[0];
    await conn.beginTransaction();

    console.log(`[verify-0061] Testing against careSignalEvents.id = ${id}...`);

    // 1. Plain UPDATE should be rejected.
    try {
      await conn.query(`UPDATE careSignalEvents SET raw_narrative = ? WHERE id = ?`, ["tampered", id]);
      console.error("[verify-0061] FAIL: an un-overridden UPDATE to raw_narrative was NOT rejected.");
      failures++;
    } catch (err) {
      if (String(err.message).includes("immutable after submission")) {
        console.log("[verify-0061] PASS: un-overridden UPDATE correctly rejected.");
      } else {
        console.error("[verify-0061] FAIL: UPDATE was rejected but with an unexpected error:", err.message);
        failures++;
      }
    }

    // 2. Override path should succeed and write an audit row.
    await conn.query(`SET @RAW_NARRATIVE_LEGAL_OVERRIDE_REASON = 'verify-0061 test — rolled back'`);
    await conn.query(`UPDATE careSignalEvents SET raw_narrative = ? WHERE id = ?`, ["tampered-with-override", id]);
    const [auditRows] = await conn.query(
      `SELECT * FROM care_signal_raw_narrative_audit WHERE care_signal_event_id = ? ORDER BY id DESC LIMIT 1`,
      [id]
    );
    if (auditRows.length > 0 && auditRows[0].reason.includes("verify-0061")) {
      console.log("[verify-0061] PASS: override path succeeded and wrote an audit row.");
    } else {
      console.error("[verify-0061] FAIL: override path did not produce an audit row.");
      failures++;
    }

    await conn.rollback();
    console.log(`[verify-0061] Rolled back — ${id}'s raw_narrative is unchanged: "${original?.slice(0, 40)}..."`);

    if (failures > 0) process.exit(1);
    console.log("[verify-0061] All checks passed.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[verify-0061] Fatal error:", err);
  process.exit(1);
});
