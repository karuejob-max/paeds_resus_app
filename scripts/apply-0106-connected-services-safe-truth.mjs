#!/usr/bin/env node
/**
 * Migration 0106 — persisted Connected Services and Safe Truth governance.
 * Registry data is intentionally global to the product, while institution access
 * remains governed by the existing product-role and entitlement contracts.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0106] DATABASE_URL is required.");
  process.exit(1);
}

const SERVICES = [
  ["safe_truth", "Safe Truth", "Accountless public safety reporting remains separate from institutional analytics while its product home is governed.", "Paeds Resus clinical governance", "transitional", "accountless_public", null, "/parent-safe-truth", "Review product home before pilot expansion"],
  ["care_code_signal", "Care Signal & Code Signal", "Clinical learning signals may feed institutional quality improvement without copying patient identifiers into IERS evidence.", "IERS quality improvement", "connected", "institutional_aggregate", "iers", "/care-signal", "Connected to IERS QI"],
  ["training_certification", "Training & certification", "AHA courses and individual learning remain separate from IERS and CPD Portal subscriptions.", "Training operations", "connected", "individual_learning", null, "/aha-courses", "Separate learner product"],
  ["legacy_dashboard", "Legacy institutional dashboard", "The former all-in-one portal remains available only as a compatibility surface while mature workflows are migrated.", "Platform migration", "compatibility", "mixed_review_required", null, "/hospital-admin-dashboard", "Compatibility route — migrate deliberately"],
];

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0106] Creating Connected Services and Safe Truth governance tables...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS institutionConnectedServices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        serviceKey VARCHAR(64) NOT NULL,
        displayName VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        owner VARCHAR(255) NOT NULL,
        lifecycleStatus ENUM('connected', 'transitional', 'compatibility', 'pilot', 'retired') NOT NULL DEFAULT 'transitional',
        privacyClass ENUM('institutional_aggregate', 'provider_workflow', 'accountless_public', 'individual_learning', 'mixed_review_required') NOT NULL DEFAULT 'mixed_review_required',
        entitlementProductKey VARCHAR(64) NULL,
        routeKey VARCHAR(255) NULL,
        reviewLabel VARCHAR(255) NULL,
        lastReviewedAt TIMESTAMP NULL,
        nextReviewAt TIMESTAMP NULL,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY inst_conn_services_key_uq (serviceKey),
        KEY inst_conn_services_lifecycle_idx (lifecycleStatus, enabled)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS institutionConnectedServiceEvents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        serviceId INT NOT NULL,
        eventType ENUM('created', 'reviewed', 'status_changed', 'updated') NOT NULL,
        previousStatus VARCHAR(64) NULL,
        currentStatus VARCHAR(64) NULL,
        actorUserId INT NULL,
        reason TEXT NULL,
        occurredAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY inst_conn_service_events_service_idx (serviceId, occurredAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS safeTruthGovernancePolicies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        policyKey VARCHAR(64) NOT NULL,
        boundaryStatus ENUM('accountless_public', 'provider_workflow', 'institutional_aggregate', 'mixed_review_required') NOT NULL,
        allowedRoute VARCHAR(255) NOT NULL,
        institutionalAnalyticsAllowed BOOLEAN NOT NULL DEFAULT FALSE,
        patientIdentifiersAllowed BOOLEAN NOT NULL DEFAULT FALSE,
        providerLinkageAllowed BOOLEAN NOT NULL DEFAULT FALSE,
        retentionDays INT NULL,
        policyVersion VARCHAR(32) NOT NULL,
        approvedByUserId INT NULL,
        approvedAt TIMESTAMP NULL,
        notes TEXT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY safe_truth_governance_policy_key_uq (policyKey)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS safeTruthGovernancePolicyEvents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        policyId INT NOT NULL,
        eventType ENUM('created', 'reviewed', 'updated') NOT NULL,
        previousVersion VARCHAR(32) NULL,
        currentVersion VARCHAR(32) NOT NULL,
        actorUserId INT NULL,
        reason TEXT NULL,
        occurredAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY safe_truth_policy_events_policy_idx (policyId, occurredAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    for (const service of SERVICES) {
      await conn.query(
        `INSERT INTO institutionConnectedServices
          (serviceKey, displayName, description, owner, lifecycleStatus, privacyClass, entitlementProductKey, routeKey, reviewLabel, enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE
          displayName = VALUES(displayName), description = VALUES(description), owner = VALUES(owner),
          lifecycleStatus = VALUES(lifecycleStatus), privacyClass = VALUES(privacyClass),
          entitlementProductKey = VALUES(entitlementProductKey), routeKey = VALUES(routeKey), reviewLabel = VALUES(reviewLabel),
          updatedAt = CURRENT_TIMESTAMP`,
        service,
      );
    }

    await conn.query(`
      INSERT INTO safeTruthGovernancePolicies
        (policyKey, boundaryStatus, allowedRoute, institutionalAnalyticsAllowed, patientIdentifiersAllowed, providerLinkageAllowed, retentionDays, policyVersion, notes)
      VALUES ('safe_truth_public_submission', 'accountless_public', '/parent-safe-truth', FALSE, FALSE, FALSE, NULL, '1.0',
        'Accountless public safety reporting. Do not use this route for emergency dispatch, institutional roster access, or patient-identifying analytics.')
      ON DUPLICATE KEY UPDATE
        boundaryStatus = VALUES(boundaryStatus), allowedRoute = VALUES(allowedRoute),
        institutionalAnalyticsAllowed = VALUES(institutionalAnalyticsAllowed), patientIdentifiersAllowed = VALUES(patientIdentifiersAllowed),
        providerLinkageAllowed = VALUES(providerLinkageAllowed), policyVersion = VALUES(policyVersion), notes = VALUES(notes),
        updatedAt = CURRENT_TIMESTAMP;
    `);
    const [services] = await conn.query("SELECT COUNT(*) AS serviceCount FROM institutionConnectedServices WHERE enabled = TRUE");
    const [policies] = await conn.query("SELECT COUNT(*) AS policyCount FROM safeTruthGovernancePolicies");
    console.log(`[0106] Ready. Enabled services: ${services[0]?.serviceCount ?? 0}; Safe Truth policies: ${policies[0]?.policyCount ?? 0}.`);
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0106] Fatal error:", error);
  process.exit(1);
});
