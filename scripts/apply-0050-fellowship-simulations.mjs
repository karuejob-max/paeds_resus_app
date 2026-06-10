/**
 * Idempotent: fellowshipSimulations table + userProgress.fellowshipSimulationId (migration 0050).
 *
 *   pnpm run db:apply-0050
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function tableExists(conn, dbName, tableName) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [dbName, tableName]
  );
  return (rows[0]?.c ?? 0) > 0;
}

async function columnExists(conn, dbName, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbName, tableName, columnName]
  );
  return (rows[0]?.c ?? 0) > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  const dbName = conn.config.database;

  if (!(await tableExists(conn, dbName, "fellowshipSimulations"))) {
    const sqlPath = path.join(__dirname, "../drizzle/0050_fellowship_simulations.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    const createStmt = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)[0];
    try {
      await conn.query(createStmt);
      console.log("[0050] Created fellowshipSimulations table.");
    } catch (err) {
      if (err.code === "ER_TABLE_EXISTS_ERROR") {
        console.log("[0050] fellowshipSimulations table already exists.");
      } else {
        throw err;
      }
    }
  } else {
    console.log("[0050] fellowshipSimulations table already exists.");
  }

  if (!(await columnExists(conn, dbName, "userProgress", "fellowshipSimulationId"))) {
    try {
      await conn.query("ALTER TABLE `userProgress` ADD `fellowshipSimulationId` int");
      console.log("[0050] Added userProgress.fellowshipSimulationId.");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("[0050] userProgress.fellowshipSimulationId already exists.");
      } else {
        throw err;
      }
    }
  } else {
    console.log("[0050] userProgress.fellowshipSimulationId already exists.");
  }

  console.log("[0050] Fellowship simulations schema ready.");
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
