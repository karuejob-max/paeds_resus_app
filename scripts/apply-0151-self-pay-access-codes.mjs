import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0151] DATABASE_URL is required.");
  process.exit(1);
}

async function columnExists(conn, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [tableName, columnName]
  );
  return rows.length > 0;
}

async function addColumnIfMissing(conn, columnName, definition) {
  if (await columnExists(conn, "globalEntitlements", columnName)) return;
  await conn.query(
    `ALTER TABLE \`globalEntitlements\` ADD COLUMN \`${columnName}\` ${definition}`
  );
  console.log(`[0151] Added globalEntitlements.${columnName}`);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    await addColumnIfMissing(conn, "accessCodeHash", "VARCHAR(64) NULL");
    await addColumnIfMissing(conn, "accessCodePrefix", "VARCHAR(12) NULL");
    try {
      await conn.query(
        "ALTER TABLE `globalEntitlements` ADD UNIQUE KEY `global_entitlements_access_code_hash_uq` (`accessCodeHash`)"
      );
    } catch (error) {
      if (!/duplicate|already exists/i.test(String(error?.message ?? error))) throw error;
    }
    console.log("[0151] Self-pay access-code migration applied successfully.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0151] Migration failed:", error);
  process.exit(1);
});

