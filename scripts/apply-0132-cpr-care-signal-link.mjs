/**
 * Migration 0132 — CPR-GPS to Care Signal provenance bridge.
 *
 * Run: pnpm run db:apply-0132
 *
 * This creates no events or reports. It only adds the optional bridge table.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0132] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS cprCareSignalLinks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cprSessionId INT NOT NULL,
        careSignalEventId INT NOT NULL,
        activationEventId INT NULL,
        institutionalAccountId INT NULL,
        linkedByUserId INT NOT NULL,
        relationship ENUM('post_event_prompt','manual') NOT NULL DEFAULT 'post_event_prompt',
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY cprCareSignalLinks_care_signal_unique (careSignalEventId),
        KEY cprCareSignalLinks_cpr_session_idx (cprSessionId),
        KEY cprCareSignalLinks_activation_idx (activationEventId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("[0132] cprCareSignalLinks is ready.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0132] Fatal error:", error);
  process.exit(1);
});
