/**
 * Idempotent: migration 0064 — Fellowship pseudonymous token model
 * (Observation Architecture v1.1 §5.5, gap-analysis queue item #10).
 *
 * Two things, both purely additive:
 *
 * 1. New table `fellowshipTokens` — the credit ledger for Layer 2
 *    (pseudonymous) Care Signal submissions. See drizzle/schema.ts for the
 *    full field-by-field rationale.
 *
 * 2. Two new columns on `careSignalEvents`:
 *      - `submissionMode` ENUM('named','pseudonymous','anonymous') NOT NULL
 *        DEFAULT 'named' — supersedes `isAnonymous` as the source of truth
 *        for identity storage / Fellowship eligibility (isAnonymous is kept
 *        and still governs facility-view visibility per PSOT §20.3 rule 4,
 *        a separate concern).
 *      - `fellowshipTokenId` VARCHAR(36) NULL — set only when
 *        submissionMode = 'pseudonymous'.
 *
 * BACKFILL, and why it's intentionally narrow: existing rows are backfilled
 * to submissionMode = 'anonymous' if isAnonymous = 1, else 'named'. This is
 * a LABEL for historical data, not a behavior change — per CEO decision
 * (2026-07-15), the new stricter Layer 1/Layer 2 split is forward-looking
 * only. Historical rows where isAnonymous = 1 already have a real `userId`
 * stored (the pre-existing behavior this migration replaces going forward)
 * and this migration does NOT null those out — that would silently discard
 * data under an "anonymize" migration, which is exactly the kind of quiet
 * workaround these scripts are supposed to avoid. If a retroactive cleanup
 * of historical userId-on-anonymous rows is wanted, it should be its own
 * explicit, reviewed migration — flagged here, not decided here.
 *
 * Run: pnpm run db:apply-0064
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) as c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`,
    [table]
  );
  return rows[0].c > 0;
}

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) as c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  return rows[0].c > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0064] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    // ── 1. fellowshipTokens table ──────────────────────────────────────────
    if (await tableExists(conn, "fellowshipTokens")) {
      console.log("[0064]   ✓ fellowshipTokens already exists — skipping.");
    } else {
      await conn.query(`
        CREATE TABLE \`fellowshipTokens\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`tokenId\` VARCHAR(36) NOT NULL,
          \`recoveryCodeHash\` VARCHAR(128) NOT NULL,
          \`careSignalStreak\` INT DEFAULT 0,
          \`careSignalEventsSubmitted\` INT DEFAULT 0,
          \`careSignalPercentage\` INT DEFAULT 0,
          \`linkedUserId\` INT NULL,
          \`linkedAt\` TIMESTAMP NULL,
          \`titleDisplayRevokedAt\` TIMESTAMP NULL,
          \`lastSubmissionAt\` TIMESTAMP NULL,
          \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY \`fellowshipTokens_tokenId_unique\` (\`tokenId\`),
          KEY \`fellowshipTokens_linkedUserId_idx\` (\`linkedUserId\`)
        )
      `);
      console.log("[0064]   + Created fellowshipTokens.");
    }

    // ── 2. careSignalEvents.submissionMode ─────────────────────────────────
    // NOTE: careSignalEvents.eventId is a Drizzle field name whose actual
    // DB column is `event_id` (snake_case) — schema.ts: eventId: varchar("event_id", ...).
    // Anchoring AFTER `eventId` (camelCase) fails with ER_BAD_FIELD_ERROR;
    // always check schema.ts's literal column-name string, not the JS
    // property name, before writing raw SQL against an existing column.
    if (await columnExists(conn, "careSignalEvents", "submissionMode")) {
      console.log("[0064]   ✓ careSignalEvents.submissionMode already exists — skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`careSignalEvents\` ADD COLUMN \`submissionMode\` ENUM('named','pseudonymous','anonymous') NOT NULL DEFAULT 'named' AFTER \`event_id\``
      );
      console.log("[0064]   + Added careSignalEvents.submissionMode.");

      const [{ affectedRows: backfilledAnon }] = await conn.query(
        `UPDATE \`careSignalEvents\` SET \`submissionMode\` = 'anonymous' WHERE \`isAnonymous\` = 1`
      );
      console.log(
        `[0064]   ~ Backfilled ${backfilledAnon} existing isAnonymous=1 rows to submissionMode='anonymous' (label only — userId left untouched, see script header).`
      );
    }

    // ── 3. careSignalEvents.fellowshipTokenId ──────────────────────────────
    if (await columnExists(conn, "careSignalEvents", "fellowshipTokenId")) {
      console.log("[0064]   ✓ careSignalEvents.fellowshipTokenId already exists — skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`careSignalEvents\` ADD COLUMN \`fellowshipTokenId\` VARCHAR(36) NULL AFTER \`submissionMode\``
      );
      console.log("[0064]   + Added careSignalEvents.fellowshipTokenId.");
    }

    console.log("[0064] Done.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0064] Fatal error:", err);
  process.exit(1);
});
