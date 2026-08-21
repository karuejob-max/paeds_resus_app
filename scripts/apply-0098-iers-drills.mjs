/**
 * Migration 0098 — IERS drills and debrief evidence.
 *
 * Run: pnpm run db:apply-0098
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0098] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS iers_drills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institution_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        scenario_type ENUM('code_blue', 'code_yellow', 'neonatal', 'sepsis', 'anaphylaxis', 'trauma', 'other') NOT NULL,
        scheduled_at TIMESTAMP NOT NULL,
        status ENUM('planned', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'planned',
        facilitator_user_id INT NOT NULL,
        target_response_seconds INT NOT NULL DEFAULT 180,
        started_at TIMESTAMP NULL,
        ended_at TIMESTAMP NULL,
        debrief_note TEXT NULL,
        lessons_learned TEXT NULL,
        created_by_user_id INT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY iersDrills_institution_status_idx (institution_id, status),
        KEY iersDrills_institution_schedule_idx (institution_id, scheduled_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS iers_drill_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        drill_id INT NOT NULL,
        institution_id INT NOT NULL,
        user_id INT NOT NULL,
        role VARCHAR(128) NOT NULL,
        joined_at TIMESTAMP NULL,
        assessed BOOLEAN NOT NULL DEFAULT FALSE,
        assessment_note TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY iersDrillParticipants_drill_user_unique (drill_id, user_id),
        KEY iersDrillParticipants_institution_user_idx (institution_id, user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log("[0098] IERS drill and debrief tables are ready.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0098] Fatal error:", error);
  process.exit(1);
});
