/**
 * Idempotent: migration 0075 — instructor per-course competency &
 * mentorship pathway (CEO decision, 2026-07-21).
 *
 * New column:
 *   - users.instructorTier ENUM('provisional','qualified','lead_instructor')
 *
 * New tables:
 *   - instructorQualifications — (userId, programType) pairs an instructor
 *     is qualified to teach, since instructorApprovedAt/instructorCertifiedAt
 *     alone no longer imply competency in every course.
 *   - instructorMentorships — one named mentor per mentee for their whole
 *     provisional period.
 *   - instructorMentorshipGroups — one row per group a mentor has manually
 *     confirmed their mentee led independently, end-to-end.
 *
 * NOTE ON COLUMN NAMES: copied directly from schema.ts's literal
 * column-builder strings (lesson from migration 0064's bug).
 *
 * Run: pnpm run db:apply-0075
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) as c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  return rows[0].c > 0;
}

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) as c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`,
    [table]
  );
  return rows[0].c > 0;
}

const PROGRAM_TYPE_ENUM = `ENUM('bls','acls','pals','fellowship','instructor','fellowship_diploma','heartsaver','nrp')`;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0075] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0075] Running instructor competency & mentorship migration...");

    if (await columnExists(conn, "users", "instructorTier")) {
      console.log("[0075]   OK users.instructorTier already exists - skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`users\` ADD COLUMN \`instructorTier\` ENUM('provisional','qualified','lead_instructor') NULL`
      );
      console.log("[0075]   + Added users.instructorTier.");
    }

    if (await tableExists(conn, "instructorQualifications")) {
      console.log("[0075]   OK instructorQualifications already exists - skipping.");
    } else {
      await conn.query(`
        CREATE TABLE \`instructorQualifications\` (
          \`id\` INT AUTO_INCREMENT NOT NULL,
          \`userId\` INT NOT NULL,
          \`programType\` ${PROGRAM_TYPE_ENUM} NOT NULL,
          \`qualifiedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT \`instructorQualifications_id\` PRIMARY KEY(\`id\`),
          KEY \`instructorQualifications_user_program_idx\` (\`userId\`, \`programType\`)
        )
      `);
      console.log("[0075]   + Created instructorQualifications.");
    }

    if (await tableExists(conn, "instructorMentorships")) {
      console.log("[0075]   OK instructorMentorships already exists - skipping.");
    } else {
      await conn.query(`
        CREATE TABLE \`instructorMentorships\` (
          \`id\` INT AUTO_INCREMENT NOT NULL,
          \`menteeUserId\` INT NOT NULL,
          \`mentorUserId\` INT NOT NULL,
          \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT \`instructorMentorships_id\` PRIMARY KEY(\`id\`),
          CONSTRAINT \`instructorMentorships_menteeUserId_unique\` UNIQUE(\`menteeUserId\`)
        )
      `);
      console.log("[0075]   + Created instructorMentorships.");
    }

    if (await tableExists(conn, "instructorMentorshipGroups")) {
      console.log("[0075]   OK instructorMentorshipGroups already exists - skipping.");
    } else {
      await conn.query(`
        CREATE TABLE \`instructorMentorshipGroups\` (
          \`id\` INT AUTO_INCREMENT NOT NULL,
          \`mentorshipId\` INT NOT NULL,
          \`institutionalAccountId\` INT NULL,
          \`programType\` ${PROGRAM_TYPE_ENUM} NOT NULL,
          \`confirmedByUserId\` INT NOT NULL,
          \`notes\` VARCHAR(500) NULL,
          \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT \`instructorMentorshipGroups_id\` PRIMARY KEY(\`id\`),
          KEY \`instructorMentorshipGroups_mentorshipId_idx\` (\`mentorshipId\`)
        )
      `);
      console.log("[0075]   + Created instructorMentorshipGroups.");
    }

    console.log("[0075] Done.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0075] Fatal error:", err);
  process.exit(1);
});
