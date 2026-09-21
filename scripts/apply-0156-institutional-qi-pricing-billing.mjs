import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0156] DATABASE_URL is required.");
  process.exit(1);
}

const connection = await createMysqlConnection(databaseUrl, mysql);
const columns = [
  ["facilityLevel", "ALTER TABLE institutionProductSubscriptions ADD COLUMN facilityLevel enum('level_4','level_5','level_6') NULL"],
  ["verifiedStaffCount", "ALTER TABLE institutionProductSubscriptions ADD COLUMN verifiedStaffCount int NULL"],
  ["pricingTier", "ALTER TABLE institutionProductSubscriptions ADD COLUMN pricingTier enum('founding_partner','standard') NOT NULL DEFAULT 'standard'"],
  ["dataSharingStatus", "ALTER TABLE institutionProductSubscriptions ADD COLUMN dataSharingStatus enum('consented','consented_anonymous','private_mode','lapsed') NOT NULL DEFAULT 'private_mode'"],
  ["dataSharingConsentedAt", "ALTER TABLE institutionProductSubscriptions ADD COLUMN dataSharingConsentedAt timestamp NULL"],
  ["dataSharingLapsedAt", "ALTER TABLE institutionProductSubscriptions ADD COLUMN dataSharingLapsedAt timestamp NULL"],
  ["foundingPartnerStartedAt", "ALTER TABLE institutionProductSubscriptions ADD COLUMN foundingPartnerStartedAt timestamp NULL"],
  ["foundingPartnerEndsAt", "ALTER TABLE institutionProductSubscriptions ADD COLUMN foundingPartnerEndsAt timestamp NULL"],
  ["commitmentTermYears", "ALTER TABLE institutionProductSubscriptions ADD COLUMN commitmentTermYears int NOT NULL DEFAULT 1"],
  ["lastStaffCountAttestationAt", "ALTER TABLE institutionProductSubscriptions ADD COLUMN lastStaffCountAttestationAt timestamp NULL"],
  ["autoRenewEnabled", "ALTER TABLE institutionProductSubscriptions ADD COLUMN autoRenewEnabled boolean NOT NULL DEFAULT false"],
  ["renewalApprovalRequired", "ALTER TABLE institutionProductSubscriptions ADD COLUMN renewalApprovalRequired boolean NOT NULL DEFAULT true"],
  ["participationCureEndsAt", "ALTER TABLE institutionProductSubscriptions ADD COLUMN participationCureEndsAt timestamp NULL"],
  ["participationLastEvaluatedAt", "ALTER TABLE institutionProductSubscriptions ADD COLUMN participationLastEvaluatedAt timestamp NULL"],
  ["participationLastStatus", "ALTER TABLE institutionProductSubscriptions ADD COLUMN participationLastStatus enum('met','not_met','exempt','pending_review') NULL"],
];

async function ensureColumn(table, name, sql) {
  const [rows] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [name]);
  if (!rows.length) {
    await connection.query(sql);
    console.log(`[0156] Added ${table}.${name}`);
  }
}

async function ensureTable(name, sql) {
  const [rows] = await connection.query("SHOW TABLES LIKE ?", [name]);
  if (!rows.length) {
    await connection.query(sql);
    console.log(`[0156] Created ${name}`);
  }
}

try {
  for (const [name, sql] of columns) await ensureColumn("institutionProductSubscriptions", name, sql);

  await ensureTable("institutionalQiReports", `CREATE TABLE institutionalQiReports (
    id int NOT NULL AUTO_INCREMENT,
    institutionalAccountId int NOT NULL,
    facilityDepartmentId int NULL,
    reportType enum('safety_event','improvement_project') NOT NULL,
    sourceType enum('manual','care_signal','code_signal') NOT NULL DEFAULT 'manual',
    sourceId int NULL,
    title varchar(255) NOT NULL,
    eventDate timestamp NULL,
    careArea varchar(128) NULL,
    ageGroup varchar(64) NULL,
    harmOccurred boolean NOT NULL DEFAULT false,
    severity enum('low','moderate','severe','critical') NOT NULL DEFAULT 'low',
    problemStatement text NOT NULL,
    expectedProcess text NULL,
    observedGap text NULL,
    contributingFactors json NULL,
    baselineMeasure decimal(12,4) NULL,
    numerator int NULL,
    denominator int NULL,
    dataSource varchar(255) NULL,
    targetMeasure decimal(12,4) NULL,
    confidentialityLevel enum('institution_only','aggregate_only','restricted') NOT NULL DEFAULT 'institution_only',
    status enum('draft','submitted','triaged','action_planned','in_progress','effectiveness_review','closed','reopened') NOT NULL DEFAULT 'draft',
    reporterUserId int NULL,
    reviewerUserId int NULL,
    submittedAt timestamp NULL,
    closedAt timestamp NULL,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY qi_reports_institution_status_idx (institutionalAccountId, status),
    KEY qi_reports_source_idx (sourceType, sourceId),
    KEY qi_reports_closed_idx (institutionalAccountId, closedAt)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await ensureTable("institutionalQiActions", `CREATE TABLE institutionalQiActions (
    id int NOT NULL AUTO_INCREMENT,
    reportId int NOT NULL,
    institutionalAccountId int NOT NULL,
    actionText text NOT NULL,
    ownerUserId int NULL,
    dueAt timestamp NULL,
    priority enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
    status enum('open','in_progress','completed','cancelled') NOT NULL DEFAULT 'open',
    evidenceUrl text NULL,
    completedAt timestamp NULL,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY qi_actions_report_idx (reportId),
    KEY qi_actions_institution_status_idx (institutionalAccountId, status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await ensureTable("institutionalQiEffectivenessReviews", `CREATE TABLE institutionalQiEffectivenessReviews (
    id int NOT NULL AUTO_INCREMENT,
    reportId int NOT NULL,
    institutionalAccountId int NOT NULL,
    reviewerUserId int NOT NULL,
    reviewDate timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    outcome enum('effective','partially_effective','not_effective','insufficient_evidence') NOT NULL,
    followUpRequired boolean NOT NULL DEFAULT false,
    evidenceSummary text NOT NULL,
    measureValue decimal(12,4) NULL,
    notes text NULL,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY qi_reviews_report_idx (reportId),
    KEY qi_reviews_institution_date_idx (institutionalAccountId, reviewDate)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await ensureTable("institutionalQiParticipationSnapshots", `CREATE TABLE institutionalQiParticipationSnapshots (
    id int NOT NULL AUTO_INCREMENT,
    institutionalAccountId int NOT NULL,
    quarterStart timestamp NOT NULL,
    quarterEnd timestamp NOT NULL,
    facilityLevel varchar(32) NULL,
    requiredClosedEffectiveReports int NOT NULL DEFAULT 1,
    closedEffectiveReports int NOT NULL DEFAULT 0,
    careSignalReports int NOT NULL DEFAULT 0,
    codeSignalReports int NOT NULL DEFAULT 0,
    participationStatus enum('met','not_met','exempt','pending_review') NOT NULL DEFAULT 'pending_review',
    calculatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY qi_participation_institution_quarter_uq (institutionalAccountId, quarterStart)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await ensureTable("institutionalExchangeRates", `CREATE TABLE institutionalExchangeRates (
    id int NOT NULL AUTO_INCREMENT,
    currencyCode varchar(3) NOT NULL,
    kesPerUsd decimal(14,6) NOT NULL,
    effectiveFrom timestamp NOT NULL,
    effectiveTo timestamp NULL,
    source varchar(255) NOT NULL,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY exchange_rates_currency_effective_idx (currencyCode, effectiveFrom)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await ensureTable("institutionalSubscriptionInvoices", `CREATE TABLE institutionalSubscriptionInvoices (
    id int NOT NULL AUTO_INCREMENT,
    institutionalAccountId int NOT NULL,
    productId int NOT NULL,
    subscriptionId int NULL,
    invoiceNumber varchar(64) NOT NULL,
    baseAmountUsdCents int NOT NULL,
    amountCents int NOT NULL,
    currency varchar(3) NOT NULL DEFAULT 'KES',
    fxRateKesPerUsd decimal(14,6) NULL,
    status enum('draft','issued','payment_pending','paid','void','overdue','cancelled') NOT NULL DEFAULT 'draft',
    issuedAt timestamp NULL,
    dueAt timestamp NULL,
    paidAt timestamp NULL,
    renewalForSubscriptionId int NULL,
    metadata json NULL,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY invoices_number_uq (invoiceNumber),
    KEY invoices_institution_status_idx (institutionalAccountId, status),
    KEY invoices_due_idx (status, dueAt)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await ensureTable("institutionalPaymentProviderEvents", `CREATE TABLE institutionalPaymentProviderEvents (
    id int NOT NULL AUTO_INCREMENT,
    provider varchar(64) NOT NULL,
    providerEventId varchar(255) NOT NULL,
    eventType varchar(128) NOT NULL,
    invoiceId int NULL,
    paymentId int NULL,
    status enum('received','processed','ignored','failed') NOT NULL DEFAULT 'received',
    payload json NOT NULL,
    receivedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processedAt timestamp NULL,
    errorMessage text NULL,
    PRIMARY KEY (id),
    UNIQUE KEY provider_events_provider_event_uq (provider, providerEventId),
    KEY provider_events_invoice_idx (invoiceId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await ensureTable("institutionalPricingAuditEvents", `CREATE TABLE institutionalPricingAuditEvents (
    id int NOT NULL AUTO_INCREMENT,
    institutionalAccountId int NOT NULL,
    subscriptionId int NULL,
    eventType varchar(64) NOT NULL,
    actorUserId int NULL,
    previousValue json NULL,
    currentValue json NOT NULL,
    reason text NOT NULL,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY pricing_audit_institution_created_idx (institutionalAccountId, createdAt)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  console.log("[0156] Institutional QI, pricing, invoice, and payment-event schema is ready.");
} finally {
  await connection.end();
}

export {};
