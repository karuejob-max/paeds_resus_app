/**
 * Idempotent: Add redacted_narrative column to careSignalEvents.
 *
 *   node scripts/apply-0076-care-signal-redacted-narrative.mjs
 */

import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[Migration] DATABASE_URL environment variable is missing.");
    process.exit(1);
  }
  console.log("[Migration] Attempting to connect to database...");
  const connection = await createMysqlConnection(databaseUrl, mysql);
  console.log("[Migration] Connected.");

  try {
    // Check if column already exists
    const [columns] = await connection.query(
      `SHOW COLUMNS FROM careSignalEvents LIKE 'redacted_narrative'`
    );

    if (Array.isArray(columns) && columns.length > 0) {
      console.log("[Migration] Column 'redacted_narrative' already exists. Skipping.");
    } else {
      console.log("[Migration] Adding redacted_narrative column to careSignalEvents...");
      await connection.query(
        `ALTER TABLE careSignalEvents ADD COLUMN redacted_narrative text NULL`
      );
      console.log("[Migration] Successfully added redacted_narrative column.");
    }
  } catch (error) {
    console.error("[Migration] Error during migration:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
