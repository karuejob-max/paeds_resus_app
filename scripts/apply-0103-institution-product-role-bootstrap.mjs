#!/usr/bin/env node
/**
 * Migration 0103 — bootstrap explicit product roles for existing institution
 * members. Existing institutional admins remain governed by the shared admin
 * permission; provider members receive least-privilege product roles so the
 * role ledger can be enforced without silently removing operational access.
 *
 * Run: pnpm run db:apply-0103
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0103] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0103] Bootstrapping explicit product roles for active institution members...");
    const [products] = await conn.query(`SELECT id, productKey FROM institutionalProducts WHERE productKey IN ('iers', 'cpd_portal')`);
    const productIds = new Map(products.map((row) => [row.productKey, row.id]));
    const iersProductId = productIds.get("iers");
    const cpdProductId = productIds.get("cpd_portal");
    if (!iersProductId || !cpdProductId) throw new Error("IERS or CPD product registry entry is missing.");

    await conn.query(`
      INSERT IGNORE INTO institutionProductRoles
        (institutionalAccountId, productId, userId, invitedEmail, roleKey, roleStatus, grantedAt)
      SELECT
        m.institutionalAccountId,
        ?,
        m.userId,
        LOWER(m.invitedEmail),
        CASE
          WHEN m.responsibilityRole IN ('executive', 'erc_chair', 'erc_member', 'er_coordinator', 'unit_team_leader', 'ert_leader') THEN 'iers_coordinator'
          WHEN m.responsibilityRole = 'ert_responder' THEN 'iers_responder'
          ELSE 'iers_viewer'
        END,
        'active',
        CURRENT_TIMESTAMP
      FROM institutionMemberships m
      WHERE m.membershipStatus = 'active'
        AND m.invitedEmail IS NOT NULL
        AND m.invitedEmail <> '';
    `, [iersProductId]);

    await conn.query(`
      INSERT IGNORE INTO institutionProductRoles
        (institutionalAccountId, productId, userId, invitedEmail, roleKey, roleStatus, grantedAt)
      SELECT
        m.institutionalAccountId,
        ?,
        m.userId,
        LOWER(m.invitedEmail),
        CASE
          WHEN m.responsibilityRole IN ('executive', 'erc_chair', 'er_coordinator') THEN 'cpd_coordinator'
          WHEN m.responsibilityRole IN ('erc_member', 'unit_team_leader', 'ert_leader') THEN 'cpd_reviewer'
          ELSE 'cpd_viewer'
        END,
        'active',
        CURRENT_TIMESTAMP
      FROM institutionMemberships m
      WHERE m.membershipStatus = 'active'
        AND m.invitedEmail IS NOT NULL
        AND m.invitedEmail <> '';
    `, [cpdProductId]);

    const [rows] = await conn.query(`
      SELECT productId, COUNT(*) AS roleCount
      FROM institutionProductRoles
      WHERE roleStatus = 'active'
      GROUP BY productId
      ORDER BY productId;
    `);
    console.log(`[0103] Ready. Active product-role counts: ${rows.map((row) => `${row.productId}=${row.roleCount}`).join(", ") || "none"}`);
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0103] Fatal error:", error);
  process.exit(1);
});
