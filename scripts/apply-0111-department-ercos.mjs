import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("[0111] DATABASE_URL is required");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0111] Creating one-ERCo-per-department assignment table...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS institution_department_response_coordinators (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institution_id INT NOT NULL,
        department_id INT NOT NULL,
        coordinator_user_id INT NOT NULL,
        backup_user_id INT NULL,
        assignment_status ENUM('pending_acceptance', 'active', 'declined', 'ended') DEFAULT 'pending_acceptance' NOT NULL,
        effective_from DATE NOT NULL,
        effective_until DATE NULL,
        assigned_by_user_id INT NOT NULL,
        accepted_at TIMESTAMP NULL,
        declined_at TIMESTAMP NULL,
        decline_reason VARCHAR(500) NULL,
        backup_accepted_at TIMESTAMP NULL,
        backup_declined_at TIMESTAMP NULL,
        backup_decline_reason VARCHAR(500) NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        UNIQUE KEY institution_department_erc_unique (institution_id, department_id),
        KEY institution_erc_coordinator_idx (institution_id, coordinator_user_id),
        KEY institution_erc_backup_idx (institution_id, backup_user_id),
        KEY institution_erc_status_idx (institution_id, assignment_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS institution_department_response_coordinator_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institution_id INT NOT NULL,
        department_id INT NOT NULL,
        assignment_id INT NOT NULL,
        event_type ENUM('assigned', 'reassigned', 'accepted', 'declined', 'backup_accepted', 'backup_declined', 'ended') NOT NULL,
        actor_user_id INT NOT NULL,
        note VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        KEY institution_erc_event_assignment_idx (assignment_id, created_at),
        KEY institution_erc_event_institution_idx (institution_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("[0111] One-ERCo-per-department assignment and event tables ready.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0111] Fatal error:", error);
  process.exit(1);
});
