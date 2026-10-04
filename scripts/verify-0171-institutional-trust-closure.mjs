import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const db = await createMysqlConnection(databaseUrl, mysql);
try {
  const [events] = await db.query(`SHOW TABLES LIKE 'institutionalQiReportEvents'`);
  if (events.length !== 1) throw new Error("QI report event ledger is missing");
  const [contracts] = await db.query(`SHOW TABLES LIKE 'institutionalCommercialContracts'`);
  if (contracts.length !== 1) throw new Error("Commercial contract table is missing");
  const [invoiceContractColumns] = await db.query(`SHOW COLUMNS FROM institutionalSubscriptionInvoices WHERE Field = 'commercialContractId'`);
  if (invoiceContractColumns.length !== 1) throw new Error("Invoice contract linkage is missing");
  const [invoiceColumns] = await db.query(`SHOW COLUMNS FROM institutionalSubscriptionInvoices WHERE Field = 'status'`);
  const [attemptColumns] = await db.query(`SHOW COLUMNS FROM institutionalPaymentAttempts WHERE Field = 'status'`);
  const invoiceStatus = String(invoiceColumns[0]?.Type ?? "");
  const attemptStatus = String(attemptColumns[0]?.Type ?? "");
  for (const required of ["payment_received", "settlement_confirmed", "reconciled", "disputed", "refunded"]) {
    if (!invoiceStatus.includes(required)) throw new Error(`Invoice status ${required} is missing`);
  }
  if (!attemptStatus.includes("settled")) throw new Error("Payment attempt settled state is missing");
  console.log("[0171 verify] PASS — QI transition ledger and finance-grade payment states are present; no write was performed.");
} finally {
  await db.end();
}
