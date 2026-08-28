import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0147-verify] DATABASE_URL is required.");
  process.exit(1);
}

const requiredTables = ["globalEntitlements", "globalEntitlementRedemptions"];
const requiredColumns = {
  globalEntitlements: [
    "grantReference",
    "targetUserId",
    "targetInstitutionalAccountId",
    "programType",
    "benefitType",
    "discountPercent",
    "maxRedemptions",
    "redemptionCount",
    "status",
    "expiresAt",
    "createdByUserId",
  ],
  globalEntitlementRedemptions: [
    "entitlementId",
    "targetUserId",
    "targetInstitutionalAccountId",
    "programType",
    "resourceReference",
    "originalAmountKes",
    "discountAmountKes",
    "effectiveAmountKes",
    "redeemedByUserId",
    "redeemedAt",
  ],
};
const linkageColumns = {
  ierpProgramEnrollments: ["entitlementId", "effectiveFeeKes"],
  nerp_offer_enrollments: ["entitlement_id", "original_total_amount_kes"],
  microCourseEnrollments: ["entitlementId"],
  institutionalTrainingOrders: ["entitlementId", "originalTotalAmountKes"],
};

async function getColumns(conn, tableName) {
  const [rows] = await conn.query(
    `SELECT column_name, column_type FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?`,
    [tableName]
  );
  return new Map(
    rows.map(row => [
      row.COLUMN_NAME ?? row.column_name,
      row.COLUMN_TYPE ?? row.column_type,
    ])
  );
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    const [tableRows] = await conn.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN (?, ?)`,
      requiredTables
    );
    const presentTables = new Set(
      tableRows.map(row => row.TABLE_NAME ?? row.table_name)
    );
    for (const tableName of requiredTables) {
      if (!presentTables.has(tableName))
        throw new Error(`Missing required table: ${tableName}`);
      console.log(`[0147 verify] PASS — ${tableName} table`);
    }
    for (const [tableName, columns] of Object.entries(requiredColumns)) {
      const present = await getColumns(conn, tableName);
      for (const column of columns) {
        if (!present.has(column))
          throw new Error(`Missing ${tableName}.${column}`);
      }
      console.log(`[0147 verify] PASS — ${tableName} entitlement columns`);
    }
    for (const [tableName, columns] of Object.entries(linkageColumns)) {
      const present = await getColumns(conn, tableName);
      for (const column of columns) {
        if (!present.has(column))
          throw new Error(`Missing ${tableName}.${column}`);
      }
      console.log(`[0147 verify] PASS — ${tableName} linkage columns`);
    }
    const entitlementTypes = await getColumns(conn, "globalEntitlements");
    for (const expected of ["ierp", "nerp", "paeds_resus_ils", "self_pay"]) {
      if (!String(entitlementTypes.get("programType") ?? "").includes(expected))
        throw new Error(`Missing programme scope ${expected}`);
    }
    for (const expected of ["free", "percentage_discount"]) {
      if (!String(entitlementTypes.get("benefitType") ?? "").includes(expected))
        throw new Error(`Missing benefit type ${expected}`);
    }
    console.log("[0147 verify] PASS — programme and benefit enums");
    console.log(
      "[0147 verify] PASS — named account/institution scope, redemption limits, price linkage, and audit schema are present; no write was performed."
    );
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error(
    "[0147 verify] FAIL:",
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
