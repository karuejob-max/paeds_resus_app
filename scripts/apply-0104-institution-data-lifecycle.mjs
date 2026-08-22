#!/usr/bin/env node
/**
 * Migration 0104 — product-filtered data lifecycle control plane.
 *
 * Raw IERS and CPD records are never deleted by this migration. It adds
 * product-scoped retention policies and auditable lifecycle requests so export,
 * recovery, legal hold, and offboarding can be handled deliberately.
 *
 * Run: pnpm run db:apply-0104
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0104] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0104] Creating institutional data lifecycle control tables...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS institutionDataLifecyclePolicies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institutionalAccountId INT NOT NULL,
        productKey VARCHAR(64) NOT NULL,
        retentionDays INT NOT NULL DEFAULT 3650,
        legalHold BOOLEAN NOT NULL DEFAULT FALSE,
        updatedByUserId INT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY institutionDataLifecyclePolicies_institution_product_unique (institutionalAccountId, productKey)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS institutionDataLifecycleRequests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institutionalAccountId INT NOT NULL,
        productKey VARCHAR(64) NOT NULL,
        requestType ENUM('export', 'retention_change', 'recovery', 'offboarding') NOT NULL,
        status ENUM('requested', 'approved', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'requested',
        requestedByUserId INT NOT NULL,
        reviewedByUserId INT NULL,
        reason TEXT NOT NULL,
        format VARCHAR(32) NULL,
        metadata JSON NULL,
        exportedAt TIMESTAMP NULL,
        completedAt TIMESTAMP NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY institutionDataLifecycleRequests_institution_status_idx (institutionalAccountId, status),
        KEY institutionDataLifecycleRequests_institution_product_idx (institutionalAccountId, productKey)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      INSERT IGNORE INTO institutionDataLifecyclePolicies (institutionalAccountId, productKey, retentionDays, legalHold)
      SELECT id, productKey, 3650, FALSE
      FROM institutionalAccounts
      CROSS JOIN (SELECT 'iers' AS productKey UNION ALL SELECT 'cpd_portal' AS productKey) products;
    `);

    const [policies] = await conn.query("SELECT COUNT(*) AS policyCount FROM institutionDataLifecyclePolicies");
    const [requests] = await conn.query("SELECT COUNT(*) AS requestCount FROM institutionDataLifecycleRequests");
    console.log(`[0104] Ready. Policies: ${policies[0]?.policyCount ?? 0}; lifecycle requests: ${requests[0]?.requestCount ?? 0}.`);
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0104] Fatal error:", error);
  process.exit(1);
});
