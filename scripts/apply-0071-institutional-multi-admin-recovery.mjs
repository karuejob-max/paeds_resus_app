/**
 * Idempotent: migration 0071 — institutional multi-admin schema + recovery
 * flow (North Star v2.0 §6.1: "the Organisation Actor account belongs to
 * the institution, not the person who created it. A minimum of two named
 * admin contacts must always be registered. Account recovery requires
 * institutional identity verification — facility letterhead, MoH
 * registration number — not personal credential reset.").
 *
 * Fixes a structural single-person lock: institutionalAccounts.userId was
 * the ONLY column any access check (assertInstitutionAccess and several
 * direct call sites) ever consulted — one FK to one user, no path to
 * recovery if that user became unreachable.
 *
 * New columns:
 *   - institutionalAccounts.registrationNumber — promoted from opaque JSON
 *     inside institutionalInquiries.specificNeeds to a real, queryable
 *     column, so recovery requests can be matched against it directly.
 *
 * New tables:
 *   - institutionalAccountAdmins — grants admin access to more than one
 *     user per institution. Existing accounts backfilled with their current
 *     owner as the first row.
 *   - institutionalAdminInvites — pending grants for an email that doesn't
 *     have a platform account yet (or hasn't accepted), used by both the
 *     registration second-admin field and approved recovery requests.
 *   - institutionalRecoveryRequests — public, no-auth submission (the
 *     scenario is "nobody can log in"); reviewed and matched to a real
 *     institution manually by a platform admin.
 *
 * Run: pnpm run db:apply-0071
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
    console.error("[0071] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0071] Running institutional multi-admin + recovery migration…");

    // --- institutionalAccounts.registrationNumber ---
    if (await columnExists(conn, "institutionalAccounts", "registrationNumber")) {
      console.log("[0071]   ✓ institutionalAccounts.registrationNumber already exists — skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`institutionalAccounts\` ADD COLUMN \`registrationNumber\` VARCHAR(255) NULL`
      );
      console.log("[0071]   + institutionalAccounts.registrationNumber added.");
    }

    // --- institutionalAccountAdmins ---
    if (await tableExists(conn, "institutionalAccountAdmins")) {
      console.log("[0071]   ✓ institutionalAccountAdmins already exists — skipping create.");
    } else {
      await conn.query(`
        CREATE TABLE \`institutionalAccountAdmins\` (
          \`id\` INT AUTO_INCREMENT NOT NULL,
          \`institutionalAccountId\` INT NOT NULL,
          \`userId\` INT NOT NULL,
          \`addedByUserId\` INT NULL,
          \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT \`institutionalAccountAdmins_id\` PRIMARY KEY(\`id\`),
          KEY \`institutionalAccountAdmins_account_idx\` (\`institutionalAccountId\`),
          KEY \`institutionalAccountAdmins_user_idx\` (\`userId\`)
        )
      `);
      console.log("[0071]   + institutionalAccountAdmins created.");
    }

    // Backfill: every existing institutionalAccounts row gets its current
    // owner as the first admin row, if not already present.
    const [toBackfill] = await conn.query(`
      SELECT ia.id AS institutionalAccountId, ia.userId, ia.createdAt
      FROM \`institutionalAccounts\` ia
      LEFT JOIN \`institutionalAccountAdmins\` iaa
        ON iaa.institutionalAccountId = ia.id AND iaa.userId = ia.userId
      WHERE iaa.id IS NULL
    `);
    if (toBackfill.length === 0) {
      console.log("[0071]   ✓ institutionalAccountAdmins backfill already complete — skipping.");
    } else {
      for (const row of toBackfill) {
        await conn.query(
          `INSERT INTO \`institutionalAccountAdmins\` (\`institutionalAccountId\`, \`userId\`, \`addedByUserId\`, \`createdAt\`) VALUES (?, ?, NULL, ?)`,
          [row.institutionalAccountId, row.userId, row.createdAt]
        );
      }
      console.log(`[0071]   + backfilled ${toBackfill.length} owner row(s) into institutionalAccountAdmins.`);
    }

    // --- institutionalAdminInvites ---
    if (await tableExists(conn, "institutionalAdminInvites")) {
      console.log("[0071]   ✓ institutionalAdminInvites already exists — skipping.");
    } else {
      await conn.query(`
        CREATE TABLE \`institutionalAdminInvites\` (
          \`id\` INT AUTO_INCREMENT NOT NULL,
          \`institutionalAccountId\` INT NOT NULL,
          \`invitedEmail\` VARCHAR(320) NOT NULL,
          \`invitedName\` VARCHAR(255) NULL,
          \`invitedPhone\` VARCHAR(20) NULL,
          \`invitedByUserId\` INT NULL,
          \`source\` ENUM('registration','admin_invite','recovery_approval') NOT NULL,
          \`status\` ENUM('pending','accepted','revoked') NULL DEFAULT 'pending',
          \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`acceptedAt\` TIMESTAMP NULL,
          CONSTRAINT \`institutionalAdminInvites_id\` PRIMARY KEY(\`id\`),
          KEY \`institutionalAdminInvites_account_idx\` (\`institutionalAccountId\`),
          KEY \`institutionalAdminInvites_email_idx\` (\`invitedEmail\`)
        )
      `);
      console.log("[0071]   + institutionalAdminInvites created.");
    }

    // --- institutionalRecoveryRequests ---
    if (await tableExists(conn, "institutionalRecoveryRequests")) {
      console.log("[0071]   ✓ institutionalRecoveryRequests already exists — skipping.");
    } else {
      await conn.query(`
        CREATE TABLE \`institutionalRecoveryRequests\` (
          \`id\` INT AUTO_INCREMENT NOT NULL,
          \`companyNameClaimed\` VARCHAR(255) NOT NULL,
          \`claimedRegistrationNumber\` VARCHAR(255) NULL,
          \`requesterName\` VARCHAR(255) NOT NULL,
          \`requesterEmail\` VARCHAR(320) NOT NULL,
          \`requesterPhone\` VARCHAR(20) NULL,
          \`requesterRoleClaim\` VARCHAR(255) NULL,
          \`letterheadUrl\` TEXT NOT NULL,
          \`notes\` TEXT NULL,
          \`status\` ENUM('pending','approved','rejected') NULL DEFAULT 'pending',
          \`matchedInstitutionalAccountId\` INT NULL,
          \`reviewedByUserId\` INT NULL,
          \`reviewedAt\` TIMESTAMP NULL,
          \`reviewNotes\` TEXT NULL,
          \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT \`institutionalRecoveryRequests_id\` PRIMARY KEY(\`id\`),
          KEY \`institutionalRecoveryRequests_status_idx\` (\`status\`)
        )
      `);
      console.log("[0071]   + institutionalRecoveryRequests created.");
    }

    console.log("[0071] Done.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0071] Fatal error:", err);
  process.exit(1);
});
