/**
 * Idempotent: migration 0084 -- Phase 2 role-based booking schema
 * (docs/IERP_NERP_PROGRAM_V2_SPEC.md §4, CEO 2026-07-31 respec).
 *
 * Three changes:
 * 1. `trainingSchedules.institutionalAccountId` -> nullable (self-service,
 *    cross-program Phase 2 sessions aren't tied to one institution).
 * 2. `trainingAttendance.simulationRole` enum widened -- additive, keeps
 *    the existing "team_member"/"team_leader" values (still used by the
 *    Fellowship program and the existing Phase 3 hands-on/hybrid booking
 *    flow) and adds the six named Phase 2 roles plus "observer".
 * 3. New table `retrospectiveRoleClaims`.
 *
 * NOTE ON COLUMN/ENUM VALUES: copied directly from drizzle/schema.ts's
 * literal strings, not inferred from JS property names -- per the
 * migration-0064 lesson in AGENTS.md.
 *
 * Run: pnpm run db:apply-0084
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

async function getColumnType(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COLUMN_TYPE, IS_NULLABLE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  return rows[0] ?? null;
}

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    [table]
  );
  return rows.length > 0;
}

const NEW_SIMULATION_ROLE_ENUM =
  "ENUM('team_member','team_leader','team_member_airway_ventilation','team_member_compressor_1','team_member_compressor_2','team_member_monitor_defib_cpr_coach','team_member_iv_io_meds','team_member_scribe','observer')";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0084] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0084] Running Phase 2 role-based booking schema migration...");

    // 1. institutionalAccountId -> nullable
    const col = await getColumnType(conn, "trainingSchedules", "institutionalAccountId");
    if (!col) {
      console.error("[0084] trainingSchedules.institutionalAccountId not found -- aborting, schema drift suspected.");
      process.exit(1);
    }
    if (col.IS_NULLABLE === "YES") {
      console.log("[0084]   \u2713 trainingSchedules.institutionalAccountId already nullable -- skipping.");
    } else {
      await conn.query("ALTER TABLE `trainingSchedules` MODIFY COLUMN `institutionalAccountId` INT NULL");
      console.log("[0084]   + trainingSchedules.institutionalAccountId is now nullable.");
    }

    // 2. Widen simulationRole enum (additive)
    const roleCol = await getColumnType(conn, "trainingAttendance", "simulationRole");
    if (!roleCol) {
      console.error("[0084] trainingAttendance.simulationRole not found -- aborting, schema drift suspected.");
      process.exit(1);
    }
    if (roleCol.COLUMN_TYPE.includes("team_member_airway_ventilation")) {
      console.log("[0084]   \u2713 trainingAttendance.simulationRole already widened -- skipping.");
    } else {
      await conn.query(`ALTER TABLE \`trainingAttendance\` MODIFY COLUMN \`simulationRole\` ${NEW_SIMULATION_ROLE_ENUM} NULL`);
      console.log("[0084]   + trainingAttendance.simulationRole widened to include the 6 named Phase 2 roles + observer.");
    }

    // 3. New table: retrospectiveRoleClaims
    if (await tableExists(conn, "retrospectiveRoleClaims")) {
      console.log("[0084]   \u2713 retrospectiveRoleClaims already exists -- skipping.");
    } else {
      await conn.query(`
        CREATE TABLE \`retrospectiveRoleClaims\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`trainingScheduleId\` INT NOT NULL,
          \`claimantUserId\` INT NOT NULL,
          \`role\` ${NEW_SIMULATION_ROLE_ENUM} NOT NULL,
          \`notes\` TEXT NULL,
          \`status\` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
          \`reviewedByUserId\` INT NULL,
          \`reviewedAt\` TIMESTAMP NULL,
          \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX \`idx_retrospective_claims_schedule\` (\`trainingScheduleId\`),
          INDEX \`idx_retrospective_claims_claimant\` (\`claimantUserId\`),
          INDEX \`idx_retrospective_claims_status\` (\`status\`)
        )
      `);
      console.log("[0084]   + Created retrospectiveRoleClaims.");
    }

    console.log(
      "[0084] Done. All three changes are additive/nullable -- existing rows and existing callers of simulationRole (Fellowship, Phase 3 hands-on) are unaffected."
    );
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0084] Fatal error:", err);
  process.exit(1);
});
