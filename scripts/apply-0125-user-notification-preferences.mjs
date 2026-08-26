/**
 * Migration 0125 — durable user notification preferences.
 *
 * Run: pnpm run db:apply-0125
 *
 * Preferences are account-owned. Operational IERS alert delivery remains
 * governed by its separate safety and fallback policy.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0125] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log(
      "[0125] Preparing durable user notification preferences schema..."
    );
    await conn.query(`
      CREATE TABLE IF NOT EXISTS userNotificationPreferences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        emailNotifications BOOLEAN NOT NULL DEFAULT TRUE,
        smsNotifications BOOLEAN NOT NULL DEFAULT TRUE,
        pushNotifications BOOLEAN NOT NULL DEFAULT TRUE,
        enrollmentAlerts BOOLEAN NOT NULL DEFAULT TRUE,
        paymentAlerts BOOLEAN NOT NULL DEFAULT TRUE,
        certificateAlerts BOOLEAN NOT NULL DEFAULT TRUE,
        courseUpdates BOOLEAN NOT NULL DEFAULT TRUE,
        quizReminders BOOLEAN NOT NULL DEFAULT TRUE,
        achievementNotifications BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY userNotificationPreferences_userId_unique (userId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log(
      "[0125] Durable user notification preferences schema is ready."
    );
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0125] Fatal error:", error);
  process.exit(1);
});
