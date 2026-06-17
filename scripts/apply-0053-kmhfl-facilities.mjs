/**
 * Idempotent: KMHFL (Kenya Master Health Facility List) facilities table (migration 0053).
 *
 * Adds:
 *   - kmhflFacilities table (facility autocomplete for institutional onboarding)
 *
 *   pnpm run db:apply-0053
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    [table]
  );
  return rows.length > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0053] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);

  try {
    // Create kmhflFacilities table
    if (await tableExists(conn, "kmhflFacilities")) {
      console.log("[0053] table kmhflFacilities already exists — skipping.");
    } else {
      await conn.query(`
        CREATE TABLE kmhflFacilities (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          code VARCHAR(64),
          county VARCHAR(100),
          facilityType VARCHAR(100),
          operationalStatus VARCHAR(50),
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log("[0053] created table kmhflFacilities.");
    }

    // Add index on name for search performance
    const [indexes] = await conn.query(
      `SHOW INDEX FROM kmhflFacilities WHERE Key_name = 'idx_kmhfl_name'`
    );
    if (indexes.length === 0) {
      await conn.query(`CREATE INDEX idx_kmhfl_name ON kmhflFacilities (name)`);
      console.log("[0053] created index idx_kmhfl_name.");
    }

    console.log("[0053] KMHFL facilities schema ready.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0053] FATAL:", err);
  process.exit(1);
});
