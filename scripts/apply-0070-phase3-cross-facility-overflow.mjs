/**
 * Idempotent: migration 0070 — Phase 3 cross-facility overflow valve
 * (Subsidised ACLS/BLS Cohort Program, CEO decision 2026-07-19).
 *
 * Renumbered from 0069 to 0070 (2026-07-19): a parallel PR
 * (`scripts/apply-0069-retire-parent-usertype.mjs`) claimed migration 0069
 * first and merged to main ahead of this one, producing a real
 * migration-number collision — exactly the failure mode
 * AGENTS.md's "check the highest apply-00NN number right before naming"
 * convention exists to prevent. Both scripts existed under "0069" briefly;
 * this one is renumbered to resolve it cleanly rather than leave two files
 * claiming the same number.
 *
 * New table:
 *   - phase3CrossFacilityApprovals — one row per (staffMemberId, scheduleId)
 *     granting a specific learner explicit, platform-admin-approved
 *     permission to book a specific Phase 3 (hands-on) session belonging to
 *     an institution other than their own. Phase 2 (online team simulation)
 *     has no equivalent override — it is always same-facility.
 *
 * Run: pnpm run db:apply-0070
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

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0070] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0070] Running Phase 3 cross-facility overflow migration…");

    if (await tableExists(conn, "phase3CrossFacilityApprovals")) {
      console.log("[0070]   ✓ phase3CrossFacilityApprovals already exists — skipping.");
    } else {
      await conn.query(`
        CREATE TABLE \`phase3CrossFacilityApprovals\` (
          \`id\` INT AUTO_INCREMENT NOT NULL,
          \`staffMemberId\` INT NOT NULL,
          \`scheduleId\` INT NOT NULL,
          \`approvedByUserId\` INT NOT NULL,
          \`notes\` VARCHAR(500) NULL,
          \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT \`phase3CrossFacilityApprovals_id\` PRIMARY KEY(\`id\`),
          KEY \`phase3CrossFacilityApprovals_staff_schedule_idx\` (\`staffMemberId\`, \`scheduleId\`)
        )
      `);
      console.log("[0070]   + Created phase3CrossFacilityApprovals.");
    }

    console.log("[0070] Done. Phase 3 cross-facility overflow table is present.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0070] Fatal error:", err);
  process.exit(1);
});
