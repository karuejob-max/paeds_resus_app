/**
 * Migration 0099 — IERS implementation milestones and governance.
 *
 * Run: pnpm run db:apply-0099
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0099] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS iers_implementation_milestones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institution_id INT NOT NULL,
        phase_order INT NOT NULL,
        phase_name VARCHAR(128) NOT NULL,
        objective TEXT NOT NULL,
        target_date DATE NULL,
        owner_user_id INT NULL,
        status ENUM('not_started', 'in_progress', 'at_risk', 'complete') NOT NULL DEFAULT 'not_started',
        risk_note TEXT NULL,
        evidence_id INT NULL,
        completed_at TIMESTAMP NULL,
        created_by_user_id INT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY iersImplementationMilestones_institution_phase_unique (institution_id, phase_order),
        KEY iersImplementationMilestones_institution_status_idx (institution_id, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log("[0099] IERS implementation milestone table is ready.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0099] Fatal error:", error);
  process.exit(1);
});
