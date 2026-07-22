/**
 * Idempotent: migration 0073 — fellowshipTokens.recoveryCodeLookupHash
 * + its index. Closes the O(n) recovery-code scaling limit documented
 * since item #10 shipped (2026-07-15), fixed 2026-07-20.
 *
 * WHY A NEW NULLABLE COLUMN, NOT A BACKFILL: recovery codes are bcrypt-
 * hashed in recoveryCodeHash, which is one-way by design — there is no
 * way to recompute a deterministic lookup hash for a token created before
 * this column existed, because the plaintext code was never stored
 * anywhere to recompute it from. Those existing rows get
 * recoveryCodeLookupHash = NULL permanently and keep falling back to the
 * original O(n) scan (see server/db.ts's findFellowshipTokenByRecoveryCode)
 * — safe, just slower, and that fallback set only shrinks over time as
 * old tokens are recovered or retired. Every token created AFTER this
 * migration ships gets the column populated at creation time
 * (server/routers/fellowship.ts's createPseudonymousToken), so the O(n)
 * fallback path never grows again.
 *
 * NOTE ON COLUMN NAME: copied directly from drizzle/schema.ts's literal
 * string inside the column builder call ("recoveryCodeLookupHash"), not
 * inferred — this table's other columns are already camelCase in the DB
 * (confirmed by reading recoveryCodeHash/linkedUserId/titleDisplayRevokedAt
 * directly above it), so no snake_case surprise expected here, but still
 * checked per the migration-0064 lesson in AGENTS.md.
 *
 * Run: pnpm run db:apply-0073
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function indexExists(conn, table, indexName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [table, indexName]
  );
  return rows.length > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0073] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0073] Running fellowship recovery-code lookup-hash migration...");

    if (await columnExists(conn, "fellowshipTokens", "recoveryCodeLookupHash")) {
      console.log("[0073]   ✓ fellowshipTokens.recoveryCodeLookupHash already exists — skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`fellowshipTokens\` ADD COLUMN \`recoveryCodeLookupHash\` VARCHAR(64) NULL AFTER \`recoveryCodeHash\``
      );
      console.log("[0073]   + Added fellowshipTokens.recoveryCodeLookupHash.");
    }

    if (await indexExists(conn, "fellowshipTokens", "idx_fellowship_tokens_recovery_lookup")) {
      console.log("[0073]   ✓ idx_fellowship_tokens_recovery_lookup already exists — skipping.");
    } else {
      await conn.query(
        `CREATE INDEX \`idx_fellowship_tokens_recovery_lookup\` ON \`fellowshipTokens\` (\`recoveryCodeLookupHash\`)`
      );
      console.log("[0073]   + Created idx_fellowship_tokens_recovery_lookup.");
    }

    console.log(
      "[0073] Done. Existing tokens keep recoveryCodeLookupHash = NULL (cannot be backfilled from a one-way bcrypt hash) and fall back to the O(n) scan; new tokens created from this deploy onward get the column populated and use the O(1) indexed path."
    );
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0073] Fatal error:", err);
  process.exit(1);
});
