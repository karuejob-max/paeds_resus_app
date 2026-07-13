/**
 * Idempotent: migration 0062 — corrective fix for migration 0061's trigger.
 *
 * 0061's SIGNAL MESSAGE_TEXT was 174 characters; MySQL hard-caps
 * MESSAGE_TEXT at 128. The trigger still correctly BLOCKED the update (the
 * immutability constraint itself worked) — but the SIGNAL statement itself
 * then failed with "Data too long for condition item 'MESSAGE_TEXT'"
 * instead of raising the intended, readable error. Caught by
 * verify-0061-raw-narrative-immutable.mjs actually exercising the trigger
 * rather than just checking it exists.
 *
 * This drops and recreates the same trigger with a message text that fits
 * (98 chars). Logic is otherwise identical to 0061 — this is a message-text
 * fix only, not a behavior change. Safe to re-run.
 *
 * Run: pnpm run db:apply-0062
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const TRIGGER_NAME = "trg_care_signal_raw_narrative_immutable";
const FIXED_MESSAGE =
  "raw_narrative is immutable after submission. Set @RAW_NARRATIVE_LEGAL_OVERRIDE_REASON to override.";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0062] DATABASE_URL is required.");
    process.exit(1);
  }
  if (FIXED_MESSAGE.length > 128) {
    console.error(`[0062] Refusing to apply — fixed message is ${FIXED_MESSAGE.length} chars, still over MySQL's 128 limit.`);
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    await conn.query(`DROP TRIGGER IF EXISTS \`${TRIGGER_NAME}\``);
    console.log(`[0062]   - Dropped existing ${TRIGGER_NAME} (if present).`);

    await conn.query(`
      CREATE TRIGGER \`${TRIGGER_NAME}\`
      BEFORE UPDATE ON \`careSignalEvents\`
      FOR EACH ROW
      BEGIN
        IF (OLD.raw_narrative IS NOT NULL)
           AND (NEW.raw_narrative IS NULL OR NEW.raw_narrative <> OLD.raw_narrative)
           AND (@RAW_NARRATIVE_LEGAL_OVERRIDE_REASON IS NULL OR @RAW_NARRATIVE_LEGAL_OVERRIDE_REASON = '')
        THEN
          SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = '${FIXED_MESSAGE}';
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
    console.log(`[0062]   + Recreated ${TRIGGER_NAME} with a message text that fits MySQL's 128-char limit.`);
    console.log("[0062] Done. Re-run verify-0061-raw-narrative-immutable.mjs to confirm.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0062] Fatal error:", err);
  process.exit(1);
});
