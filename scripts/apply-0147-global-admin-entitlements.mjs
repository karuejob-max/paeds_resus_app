import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0147] DATABASE_URL is required.");
  process.exit(1);
}

async function tableExists(conn, tableName) {
  const [rows] = await conn.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`,
    [tableName]
  );
  return rows.length > 0;
}

async function columnExists(conn, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [tableName, columnName]
  );
  return rows.length > 0;
}

async function addColumnIfMissing(conn, tableName, columnName, definition) {
  if (await columnExists(conn, tableName, columnName)) return;
  await conn.query(
    `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`
  );
  console.log(`[0147] Added ${tableName}.${columnName}`);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0147] Applying Global Admin entitlement controls...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`globalEntitlements\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`grantReference\` VARCHAR(64) NOT NULL,
        \`targetUserId\` INT NULL,
        \`targetInstitutionalAccountId\` INT NULL,
        \`programType\` ENUM('ierp','nerp','paeds_resus_ils','self_pay') NOT NULL,
        \`selfPayCourseId\` VARCHAR(128) NULL,
        \`benefitType\` ENUM('free','percentage_discount') NOT NULL,
        \`discountPercent\` INT NULL,
        \`reason\` VARCHAR(500) NOT NULL,
        \`maxRedemptions\` INT NOT NULL DEFAULT 1,
        \`redemptionCount\` INT NOT NULL DEFAULT 0,
        \`status\` ENUM('active','revoked','exhausted') NOT NULL DEFAULT 'active',
        \`expiresAt\` TIMESTAMP NOT NULL,
        \`createdByUserId\` INT NOT NULL,
        \`revokedAt\` TIMESTAMP NULL,
        \`revokedByUserId\` INT NULL,
        \`revokeReason\` VARCHAR(500) NULL,
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`global_entitlements_reference_uq\` (\`grantReference\`),
        KEY \`global_entitlements_target_status_idx\` (\`targetUserId\`, \`targetInstitutionalAccountId\`, \`status\`),
        KEY \`global_entitlements_programme_idx\` (\`programType\`, \`status\`, \`expiresAt\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`globalEntitlementRedemptions\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`entitlementId\` INT NOT NULL,
        \`targetUserId\` INT NULL,
        \`targetInstitutionalAccountId\` INT NULL,
        \`programType\` ENUM('ierp','nerp','paeds_resus_ils','self_pay') NOT NULL,
        \`resourceReference\` VARCHAR(128) NOT NULL,
        \`originalAmountKes\` INT NOT NULL,
        \`discountAmountKes\` INT NOT NULL,
        \`effectiveAmountKes\` INT NOT NULL,
        \`redeemedByUserId\` INT NOT NULL,
        \`redeemedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`global_entitlement_redemptions_entitlement_idx\` (\`entitlementId\`, \`redeemedAt\`),
        KEY \`global_entitlement_redemptions_resource_idx\` (\`programType\`, \`resourceReference\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await addColumnIfMissing(
      conn,
      "ierpProgramEnrollments",
      "entitlementId",
      "INT NULL"
    );
    await addColumnIfMissing(
      conn,
      "ierpProgramEnrollments",
      "effectiveFeeKes",
      "INT NULL"
    );
    await addColumnIfMissing(
      conn,
      "nerp_offer_enrollments",
      "entitlement_id",
      "INT NULL"
    );
    await addColumnIfMissing(
      conn,
      "nerp_offer_enrollments",
      "original_total_amount_kes",
      "DECIMAL(10,2) NULL"
    );
    await addColumnIfMissing(
      conn,
      "microCourseEnrollments",
      "entitlementId",
      "INT NULL"
    );
    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrders",
      "entitlementId",
      "INT NULL"
    );
    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrders",
      "originalTotalAmountKes",
      "INT NULL"
    );
    const [paymentRows] = await conn.query(
      `SHOW COLUMNS FROM \`payments\` LIKE 'paymentMethod'`
    );
    const paymentType = String(
      paymentRows[0]?.Type ?? paymentRows[0]?.type ?? ""
    );
    if (paymentType && !paymentType.includes("entitlement")) {
      await conn.query(
        `ALTER TABLE \`payments\` MODIFY COLUMN \`paymentMethod\` ENUM('mpesa','bank_transfer','card','entitlement') NOT NULL`
      );
      console.log("[0147] Added payments.paymentMethod entitlement value");
    }
    console.log("[0147] Global Admin entitlement schema is ready.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0147] Fatal error:", error);
  process.exit(1);
});
