/**
 * Migration 0095 — IERS activation and response evidence spine.
 *
 * Run: pnpm run db:apply-0095
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0095] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0095] Creating IERS activation spine...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS iersActivationEvents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institutionalAccountId INT NOT NULL,
        activatedByUserId INT NOT NULL,
        activationType ENUM('code_blue', 'code_yellow', 'neonatal', 'sepsis', 'anaphylaxis', 'trauma', 'other') NOT NULL,
        priority ENUM('critical', 'high', 'routine') NOT NULL DEFAULT 'critical',
        location VARCHAR(255) NOT NULL,
        department VARCHAR(255) NULL,
        source ENUM('provider', 'unit_team_leader', 'ert_leader', 'institution_admin', 'downtime_reconciliation') NOT NULL DEFAULT 'provider',
        status ENUM('draft', 'triggered', 'notifying', 'acknowledged', 'responding', 'at_scene', 'stabilized', 'recovered', 'debrief_pending', 'closed', 'cancelled', 'false_alarm', 'downtime_pending_sync', 'failed_escalation') NOT NULL DEFAULT 'triggered',
        triggeredAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        firstAcknowledgedAt TIMESTAMP NULL,
        firstResponderAt TIMESTAMP NULL,
        atSceneAt TIMESTAMP NULL,
        stabilizedAt TIMESTAMP NULL,
        closedAt TIMESTAMP NULL,
        closedByUserId INT NULL,
        cancellationReason TEXT NULL,
        notes TEXT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY iersActivationEvents_institution_status_idx (institutionalAccountId, status),
        KEY iersActivationEvents_institution_triggered_idx (institutionalAccountId, triggeredAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS iersActivationResponders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        activationEventId INT NOT NULL,
        institutionalAccountId INT NOT NULL,
        membershipId INT NULL,
        userId INT NOT NULL,
        assignmentType ENUM('primary', 'backup', 'observer') NOT NULL DEFAULT 'primary',
        responsibilityRole ENUM('ert_leader', 'ert_responder', 'unit_team_leader', 'er_coordinator', 'erc_member', 'general_staff') NOT NULL DEFAULT 'ert_responder',
        notificationStatus ENUM('pending', 'sent', 'delivered', 'failed', 'acknowledged', 'declined', 'timed_out') NOT NULL DEFAULT 'pending',
        notifiedAt TIMESTAMP NULL,
        acknowledgedAt TIMESTAMP NULL,
        declinedAt TIMESTAMP NULL,
        declineReason VARCHAR(500) NULL,
        responseAt TIMESTAMP NULL,
        atSceneAt TIMESTAMP NULL,
        handoffAt TIMESTAMP NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY iersActivationResponders_activation_user_unique (activationEventId, userId),
        KEY iersActivationResponders_institution_user_idx (institutionalAccountId, userId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS iersActivationTimeline (
        id INT AUTO_INCREMENT PRIMARY KEY,
        activationEventId INT NOT NULL,
        institutionalAccountId INT NOT NULL,
        actorUserId INT NULL,
        eventType VARCHAR(64) NOT NULL,
        fromStatus VARCHAR(64) NULL,
        toStatus VARCHAR(64) NULL,
        note TEXT NULL,
        metadata TEXT NULL,
        occurredAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY iersActivationTimeline_activation_time_idx (activationEventId, occurredAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log("[0095] IERS activation spine is ready.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0095] Fatal error:", error);
  process.exit(1);
});
