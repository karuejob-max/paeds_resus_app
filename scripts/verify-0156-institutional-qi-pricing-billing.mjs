import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0156 verify] DATABASE_URL is required.");
  process.exit(1);
}

const connection = await createMysqlConnection(databaseUrl, mysql);
const requiredTables = [
  "institutionalQiReports",
  "institutionalQiActions",
  "institutionalQiEffectivenessReviews",
  "institutionalQiParticipationSnapshots",
  "institutionalExchangeRates",
  "institutionalSubscriptionInvoices",
  "institutionalPaymentProviderEvents",
  "institutionalPricingAuditEvents",
];
const requiredColumns = [
  ["institutionProductSubscriptions", "facilityLevel"],
  ["institutionProductSubscriptions", "pricingTier"],
  ["institutionProductSubscriptions", "dataSharingStatus"],
  ["institutionProductSubscriptions", "foundingPartnerEndsAt"],
  ["institutionProductSubscriptions", "autoRenewEnabled"],
];

try {
  for (const table of requiredTables) {
    const [rows] = await connection.query("SHOW TABLES LIKE ?", [table]);
    if (!rows.length) throw new Error(`Missing table ${table}`);
    console.log(`[0156 verify] PASS — ${table}`);
  }
  for (const [table, column] of requiredColumns) {
    const [rows] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
    if (!rows.length) throw new Error(`Missing column ${table}.${column}`);
    console.log(`[0156 verify] PASS — ${table}.${column}`);
  }
  console.log("[0156 verify] All institutional QI, pricing, invoice, and provider-event checks passed; no write was performed.");
} finally {
  await connection.end();
}

export {};
