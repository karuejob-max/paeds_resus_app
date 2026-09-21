import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0157 verify] DATABASE_URL is required.");
  process.exit(1);
}

const connection = await createMysqlConnection(databaseUrl, mysql);

async function assertTable(name) {
  const [rows] = await connection.query("SHOW TABLES LIKE ?", [name]);
  if (!rows.length) throw new Error(`[0157 verify] Missing table ${name}`);
  console.log(`[0157 verify] PASS — ${name}`);
}

async function assertColumn(table, name) {
  const [rows] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [name]);
  if (!rows.length) throw new Error(`[0157 verify] Missing column ${table}.${name}`);
  console.log(`[0157 verify] PASS — ${table}.${name}`);
}

try {
  await assertTable("institutionalPaymentAttempts");
  await assertTable("institutionalQiExportRequests");
  await assertTable("institutionalQiRetentionPolicies");
  for (const name of ["provider", "providerPaymentReference", "paymentMethod", "paymentAttemptCount", "reconciliationStatus", "refundedAmountCents", "voidedAt"]) await assertColumn("institutionalSubscriptionInvoices", name);
  for (const name of ["signatureVerified", "signatureAlgorithm", "processingAttempts", "lastAttemptAt"]) await assertColumn("institutionalPaymentProviderEvents", name);
  console.log("[0157 verify] All institutional payment-operations checks passed; no write was performed.");
} finally {
  await connection.end();
}
