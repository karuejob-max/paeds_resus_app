#!/usr/bin/env node
/**
 * Migration 0108 — shared institutional account scopes.
 * Product roles remain product-specific; shared finance, QI, accreditation,
 * reporting, and account-administration scopes are stored separately.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0108] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0108] Creating shared institutional account-scope table...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS institutionAccountScopes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institutionalAccountId INT NOT NULL,
        userId INT NULL,
        invitedEmail VARCHAR(320) NOT NULL,
        scopeKey VARCHAR(64) NOT NULL,
        scopeStatus ENUM('invited', 'active', 'suspended', 'ended') NOT NULL DEFAULT 'invited',
        grantedByUserId INT NULL,
        grantedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        endedAt TIMESTAMP NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY institutionAccountScopes_inst_email_scope_uq (institutionalAccountId, invitedEmail, scopeKey),
        KEY institutionAccountScopes_inst_user_idx (institutionalAccountId, userId),
        KEY institutionAccountScopes_inst_status_idx (institutionalAccountId, scopeStatus)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS institutionAccountScopeEvents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institutionalAccountId INT NOT NULL,
        scopeId INT NOT NULL,
        eventType VARCHAR(32) NOT NULL,
        previousStatus VARCHAR(32) NULL,
        currentStatus VARCHAR(32) NULL,
        actorUserId INT NULL,
        reason TEXT NULL,
        occurredAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY institutionAccountScopeEvents_inst_scope_idx (institutionalAccountId, scopeId),
        KEY institutionAccountScopeEvents_occurred_idx (occurredAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log("[0108] Seeding account-administrator scopes from accepted institution admins...");
    await conn.query(`
      INSERT IGNORE INTO institutionAccountScopes
        (institutionalAccountId, userId, invitedEmail, scopeKey, scopeStatus, grantedByUserId, grantedAt)
      SELECT
        a.institutionalAccountId,
        a.userId,
        LOWER(u.email),
        'account_admin',
        'active',
        a.addedByUserId,
        COALESCE(a.createdAt, CURRENT_TIMESTAMP)
      FROM institutionalAccountAdmins a
      INNER JOIN users u ON u.id = a.userId
      WHERE u.email IS NOT NULL;
    `);

    console.log("[0108] Ensuring legacy institution owners retain account-administrator scope...");
    await conn.query(`
      INSERT IGNORE INTO institutionAccountScopes
        (institutionalAccountId, userId, invitedEmail, scopeKey, scopeStatus, grantedByUserId, grantedAt)
      SELECT
        ia.id,
        ia.userId,
        LOWER(u.email),
        'account_admin',
        'active',
        ia.userId,
        COALESCE(ia.createdAt, CURRENT_TIMESTAMP)
      FROM institutionalAccounts ia
      INNER JOIN users u ON u.id = ia.userId
      WHERE ia.userId IS NOT NULL
        AND u.email IS NOT NULL;
    `);

    const [rows] = await conn.query(
      `SELECT COUNT(*) AS activeAccountAdminScopes FROM institutionAccountScopes WHERE scopeKey = 'account_admin' AND scopeStatus = 'active'`,
    );
    console.log(`[0108] Ready. Active account-administrator scopes: ${rows[0]?.activeAccountAdminScopes ?? 0}.`);
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0108] Fatal error:", error);
  process.exit(1);
});
