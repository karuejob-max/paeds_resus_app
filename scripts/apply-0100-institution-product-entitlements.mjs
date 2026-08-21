/**
 * Migration 0100 — institutional product architecture and entitlement control plane.
 *
 * Run: pnpm run db:apply-0100
 *
 * The migration is intentionally additive and idempotent. Existing institutional
 * accounts receive temporary legacy-continuity subscriptions so the new product
 * boundary can be introduced without silently removing current access. Those
 * rows must be commercially reviewed and moved to an explicit product status.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0100] DATABASE_URL is required.");
  process.exit(1);
}

const products = [
  {
    productKey: "iers",
    displayName: "Institutional Emergency Readiness System",
    description: "Adaptive emergency readiness for practical competency, team response, institutional learning, evidence, and improvement.",
    productKind: "core",
    lifecycleStatus: "active",
    ownerTeam: "Paeds Resus Clinical Readiness",
    privacyClass: "institutional_clinical_operations",
    routeKey: "/institution/iers",
  },
  {
    productKey: "cpd_portal",
    displayName: "CPD Portal",
    description: "Professional-development activity, staff performance, certificates, points, and decision intelligence.",
    productKind: "core",
    lifecycleStatus: "active",
    ownerTeam: "Paeds Resus Professional Development",
    privacyClass: "institutional_staff_development",
    routeKey: "/institution/cpd",
  },
  {
    productKey: "connected_services",
    displayName: "Connected Services",
    description: "Managed access to adjacent, transitional, pilot, or not-yet-classified Paeds Resus services.",
    productKind: "transitional",
    lifecycleStatus: "pilot",
    ownerTeam: "Paeds Resus Product",
    privacyClass: "service_specific",
    routeKey: "/institution/connected",
  },
];

const capabilities = {
  iers: [
    ["iers.workspace.read", "read", "operational_continuity", "View the IERS institutional workspace."],
    ["iers.activation.operate", "operate", "operational_continuity", "Trigger and monitor IERS activations."],
    ["iers.activation.respond", "operate", "operational_continuity", "Acknowledge, respond to, and record arrival for activations."],
    ["iers.team_readiness.operate", "operate", "operational_continuity", "Manage ERT, shift, and provider readiness."],
    ["iers.competency_training.operate", "operate", "read_only", "Manage institutional emergency competency programmes."],
    ["iers.physical_readiness.operate", "operate", "read_only", "Record equipment and physical-readiness checks."],
    ["iers.drills.operate", "operate", "read_only", "Run drills, participation, and debriefs."],
    ["iers.evidence.submit", "operate", "read_only", "Submit criterion-level IERS evidence."],
    ["iers.evidence.review", "review", "read_only", "Review and accept or reject IERS evidence."],
    ["iers.actions.operate", "operate", "read_only", "Create, progress, and verify IERS improvement actions."],
    ["iers.governance.review", "review", "read_only", "Review IERS governance, incidents, guidelines, and AI-assisted patterns."],
    ["iers.implementation.govern", "govern", "read_only", "Own IERS implementation milestones and institutional rollout governance."],
    ["iers.reports.read", "read", "read_only", "View and export IERS readiness reports."],
  ],
  cpd_portal: [
    ["cpd.workspace.read", "read", "read_only", "View the CPD Portal workspace."],
    ["cpd.sessions.operate", "operate", "read_only", "Create and manage CPD sessions."],
    ["cpd.attendance.operate", "operate", "read_only", "Manage CPD registration, attendance, and verification."],
    ["cpd.staff_development.read", "read", "read_only", "View staff professional-development performance."],
    ["cpd.certificates.operate", "operate", "read_only", "Issue, verify, and export CPD certificates."],
    ["cpd.reports.read", "read", "read_only", "View and export CPD reports."],
    ["cpd.settings.govern", "govern", "read_only", "Manage CPD coordinator, signature, and institutional settings."],
  ],
  connected_services: [
    ["connected_services.read", "read", "read_only", "View the Connected Services portfolio."],
    ["connected_services.safe_truth.read", "read", "read_only", "Access the Safe Truth connected service when explicitly enabled."],
  ],
};

const plans = {
  iers: [
    ["iers_pilot", "IERS Pilot", "custom", "institution", null],
    ["iers_annual", "IERS Annual Partnership", "annual", "institution", null],
  ],
  cpd_portal: [
    ["cpd_1_100", "CPD Portal — 1–100 staff", "annual", "per_staff", 1000],
    ["cpd_101_300", "CPD Portal — 101–300 staff", "annual", "per_staff", 900],
    ["cpd_301_500", "CPD Portal — 301–500 staff", "annual", "per_staff", 800],
    ["cpd_501_plus", "CPD Portal — 501+ staff", "custom", "custom", null],
  ],
  connected_services: [
    ["connected_services_managed", "Managed Connected Service", "custom", "custom", null],
  ],
};

async function createTables(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS institutionalProducts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      productKey VARCHAR(64) NOT NULL UNIQUE,
      displayName VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      productKind ENUM('core', 'transitional') NOT NULL DEFAULT 'core',
      lifecycleStatus ENUM('active', 'pilot', 'preview', 'coming_soon', 'deprecated') NOT NULL DEFAULT 'active',
      ownerTeam VARCHAR(255) NOT NULL,
      privacyClass VARCHAR(64) NOT NULL DEFAULT 'institutional',
      routeKey VARCHAR(128) NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS institutionalProductCapabilities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      productId INT NOT NULL,
      capabilityKey VARCHAR(128) NOT NULL,
      capabilityClass ENUM('read', 'operate', 'review', 'govern', 'commercial') NOT NULL DEFAULT 'read',
      renewalPolicy ENUM('full', 'read_only', 'operational_continuity', 'blocked') NOT NULL DEFAULT 'full',
      description TEXT NOT NULL,
      status ENUM('active', 'retired') NOT NULL DEFAULT 'active',
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY institutionalProductCapabilities_product_capability_unique (productId, capabilityKey),
      KEY institutionalProductCapabilities_product_status_idx (productId, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS institutionalProductPlans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      productId INT NOT NULL,
      planKey VARCHAR(64) NOT NULL,
      displayName VARCHAR(255) NOT NULL,
      billingInterval ENUM('monthly', 'annual', 'custom') NOT NULL DEFAULT 'custom',
      billingModel ENUM('institution', 'per_staff', 'per_seat', 'custom') NOT NULL DEFAULT 'institution',
      currency VARCHAR(3) NOT NULL DEFAULT 'KES',
      priceAmount INT NULL,
      status ENUM('active', 'retired') NOT NULL DEFAULT 'active',
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY institutionalProductPlans_product_plan_unique (productId, planKey),
      KEY institutionalProductPlans_product_status_idx (productId, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS institutionProductSubscriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      institutionalAccountId INT NOT NULL,
      productId INT NOT NULL,
      planId INT NULL,
      subscriptionStatus ENUM('trial', 'active', 'grace', 'past_due', 'expired', 'suspended', 'cancelled', 'legacy_unclassified', 'not_subscribed') NOT NULL DEFAULT 'legacy_unclassified',
      startsAt TIMESTAMP NULL,
      renewsAt TIMESTAMP NULL,
      expiresAt TIMESTAMP NULL,
      graceEndsAt TIMESTAMP NULL,
      cancelledAt TIMESTAMP NULL,
      source ENUM('contract', 'quotation', 'payment', 'pilot', 'manual_override', 'legacy_migration') NOT NULL DEFAULT 'legacy_migration',
      contractId INT NULL,
      quotationId INT NULL,
      externalReference VARCHAR(255) NULL,
      notes TEXT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY institutionProductSubscriptions_institution_product_unique (institutionalAccountId, productId),
      KEY institutionProductSubscriptions_institution_status_idx (institutionalAccountId, subscriptionStatus),
      KEY institutionProductSubscriptions_renewal_idx (subscriptionStatus, renewsAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS institutionProductEntitlements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      institutionalAccountId INT NOT NULL,
      productId INT NOT NULL,
      subscriptionId INT NULL,
      capabilityKey VARCHAR(128) NOT NULL,
      entitlementStatus ENUM('active', 'grace', 'read_only', 'blocked', 'revoked') NOT NULL DEFAULT 'active',
      limitValue INT NULL,
      startsAt TIMESTAMP NULL,
      endsAt TIMESTAMP NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY institutionProductEntitlements_institution_capability_unique (institutionalAccountId, productId, capabilityKey),
      KEY institutionProductEntitlements_institution_status_idx (institutionalAccountId, entitlementStatus)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS institutionProductRoles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      institutionalAccountId INT NOT NULL,
      productId INT NOT NULL,
      userId INT NULL,
      invitedEmail VARCHAR(320) NOT NULL,
      roleKey VARCHAR(128) NOT NULL,
      roleStatus ENUM('invited', 'active', 'suspended', 'ended') NOT NULL DEFAULT 'invited',
      grantedByUserId INT NULL,
      grantedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      endedAt TIMESTAMP NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY institutionProductRoles_institution_product_email_role_unique (institutionalAccountId, productId, invitedEmail, roleKey),
      KEY institutionProductRoles_institution_user_idx (institutionalAccountId, userId),
      KEY institutionProductRoles_product_status_idx (productId, roleStatus)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS institutionSubscriptionEvents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      institutionalAccountId INT NOT NULL,
      productId INT NOT NULL,
      subscriptionId INT NULL,
      eventType ENUM('created', 'activated', 'renewed', 'payment_succeeded', 'payment_failed', 'grace_started', 'past_due', 'expired', 'suspended', 'resumed', 'cancelled', 'manual_override', 'legacy_migrated') NOT NULL,
      previousStatus VARCHAR(64) NULL,
      currentStatus VARCHAR(64) NULL,
      actorUserId INT NULL,
      reason TEXT NULL,
      reference VARCHAR(255) NULL,
      occurredAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS institutionEntitlementAuditLog (
      id INT AUTO_INCREMENT PRIMARY KEY,
      institutionalAccountId INT NOT NULL,
      productId INT NOT NULL,
      capabilityKey VARCHAR(128) NOT NULL,
      decision ENUM('allowed', 'denied', 'read_only', 'override') NOT NULL,
      userId INT NULL,
      reason VARCHAR(512) NULL,
      metadata JSON NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY institutionEntitlementAuditLog_institution_decision_idx (institutionalAccountId, decision),
      KEY institutionEntitlementAuditLog_product_created_idx (productId, createdAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

async function seedProducts(conn) {
  const productIds = new Map();
  for (const product of products) {
    await conn.query(
      `INSERT INTO institutionalProducts
        (productKey, displayName, description, productKind, lifecycleStatus, ownerTeam, privacyClass, routeKey)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         displayName = VALUES(displayName),
         description = VALUES(description),
         lifecycleStatus = VALUES(lifecycleStatus),
         ownerTeam = VALUES(ownerTeam),
         privacyClass = VALUES(privacyClass),
         routeKey = VALUES(routeKey),
         updatedAt = CURRENT_TIMESTAMP`,
      [product.productKey, product.displayName, product.description, product.productKind, product.lifecycleStatus, product.ownerTeam, product.privacyClass, product.routeKey]
    );
    const [rows] = await conn.query(`SELECT id FROM institutionalProducts WHERE productKey = ? LIMIT 1`, [product.productKey]);
    productIds.set(product.productKey, rows[0].id);
  }
  return productIds;
}

async function seedCapabilitiesAndPlans(conn, productIds) {
  for (const [productKey, rows] of Object.entries(capabilities)) {
    const productId = productIds.get(productKey);
    for (const [capabilityKey, capabilityClass, renewalPolicy, description] of rows) {
      await conn.query(
        `INSERT INTO institutionalProductCapabilities
          (productId, capabilityKey, capabilityClass, renewalPolicy, description)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           capabilityClass = VALUES(capabilityClass),
           renewalPolicy = VALUES(renewalPolicy),
           description = VALUES(description),
           status = 'active',
           updatedAt = CURRENT_TIMESTAMP`,
        [productId, capabilityKey, capabilityClass, renewalPolicy, description]
      );
    }
  }

  const planIds = new Map();
  for (const [productKey, rows] of Object.entries(plans)) {
    const productId = productIds.get(productKey);
    for (const [planKey, displayName, billingInterval, billingModel, priceAmount] of rows) {
      await conn.query(
        `INSERT INTO institutionalProductPlans
          (productId, planKey, displayName, billingInterval, billingModel, currency, priceAmount)
         VALUES (?, ?, ?, ?, ?, 'KES', ?)
         ON DUPLICATE KEY UPDATE
           displayName = VALUES(displayName),
           billingInterval = VALUES(billingInterval),
           billingModel = VALUES(billingModel),
           currency = 'KES',
           priceAmount = VALUES(priceAmount),
           status = 'active',
           updatedAt = CURRENT_TIMESTAMP`,
        [productId, planKey, displayName, billingInterval, billingModel, priceAmount]
      );
      const [planRows] = await conn.query(`SELECT id FROM institutionalProductPlans WHERE productId = ? AND planKey = ? LIMIT 1`, [productId, planKey]);
      planIds.set(`${productKey}:${planKey}`, planRows[0].id);
    }
  }
  return planIds;
}

async function seedLegacyContinuity(conn, productIds) {
  const [accounts] = await conn.query(`SELECT id FROM institutionalAccounts`);
  let subscriptionCount = 0;
  let entitlementCount = 0;

  for (const account of accounts) {
    for (const productKey of ["iers", "cpd_portal"]) {
      const productId = productIds.get(productKey);
      await conn.query(
        `INSERT INTO institutionProductSubscriptions
          (institutionalAccountId, productId, subscriptionStatus, source, notes)
         VALUES (?, ?, 'legacy_unclassified', 'legacy_migration', 'Temporary continuity grant. Commercial/product review required before renewal.')
         ON DUPLICATE KEY UPDATE updatedAt = CURRENT_TIMESTAMP`,
        [account.id, productId]
      );
      const [subscriptionRows] = await conn.query(
        `SELECT id FROM institutionProductSubscriptions WHERE institutionalAccountId = ? AND productId = ? LIMIT 1`,
        [account.id, productId]
      );
      const subscriptionId = subscriptionRows[0].id;
      subscriptionCount += 1;

      const [capabilityRows] = await conn.query(
        `SELECT capabilityKey FROM institutionalProductCapabilities WHERE productId = ? AND status = 'active'`,
        [productId]
      );
      for (const capability of capabilityRows) {
        await conn.query(
          `INSERT INTO institutionProductEntitlements
            (institutionalAccountId, productId, subscriptionId, capabilityKey, entitlementStatus)
           VALUES (?, ?, ?, ?, 'active')
           ON DUPLICATE KEY UPDATE
             subscriptionId = VALUES(subscriptionId),
             updatedAt = CURRENT_TIMESTAMP`,
          [account.id, productId, subscriptionId, capability.capabilityKey]
        );
        entitlementCount += 1;
      }

      await conn.query(
        `INSERT INTO institutionSubscriptionEvents
          (institutionalAccountId, productId, subscriptionId, eventType, previousStatus, currentStatus, reason)
         SELECT ?, ?, ?, 'legacy_migrated', NULL, 'legacy_unclassified', 'Created temporary continuity subscription during product architecture migration.'
         WHERE NOT EXISTS (
           SELECT 1 FROM institutionSubscriptionEvents
           WHERE institutionalAccountId = ? AND productId = ? AND eventType = 'legacy_migrated'
         )`,
        [account.id, productId, subscriptionId, account.id, productId]
      );
    }
  }

  console.log(`[0100] Legacy continuity seeded for ${accounts.length} institution(s): ${subscriptionCount} subscription row(s), ${entitlementCount} entitlement insert attempt(s).`);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0100] Creating institutional product architecture tables...");
    await createTables(conn);
    const productIds = await seedProducts(conn);
    await seedCapabilitiesAndPlans(conn, productIds);
    await seedLegacyContinuity(conn, productIds);
    console.log("[0100] Institutional product architecture and entitlement control plane are ready.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0100] Fatal error:", error);
  process.exit(1);
});
