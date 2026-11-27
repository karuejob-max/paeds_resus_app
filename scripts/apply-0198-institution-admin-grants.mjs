import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  // 1. Audit table for administrator grants.
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS institutionalAdminEvents (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      institutionalAccountId INT NOT NULL,
      eventType ENUM('invited','accepted','declined','revoked','removed','owner_transferred') NOT NULL,
      subjectUserId INT NULL,
      subjectEmail VARCHAR(320) NULL,
      actorUserId INT NULL,
      inviteId INT NULL,
      note VARCHAR(500) NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY institutionalAdminEvents_account_idx (institutionalAccountId, createdAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("[0198] institutionalAdminEvents exists and is ready.");

  // 2. Allow invitees to decline (additive enum change; existing values keep their meaning).
  const [columns] = await connection.query("SHOW COLUMNS FROM institutionalAdminInvites LIKE 'status'");
  const type = Array.isArray(columns) && columns[0] ? String(columns[0].Type) : "";
  if (!type) {
    throw new Error("[0198] institutionalAdminInvites.status not found; is the schema up to date?");
  }
  if (type.includes("'declined'")) {
    console.log("[0198] institutionalAdminInvites.status already allows 'declined'; no change needed.");
  } else {
    await connection.execute(
      "ALTER TABLE institutionalAdminInvites MODIFY COLUMN status ENUM('pending','accepted','revoked','declined') NULL DEFAULT 'pending'"
    );
    console.log("[0198] institutionalAdminInvites.status now allows 'declined'.");
  }

  // 3. Backfill one audit row per existing administrator so history is not empty.
  //    Read-only on access: no admin is added, removed or changed.
  const [result] = await connection.execute(`
    INSERT INTO institutionalAdminEvents (institutionalAccountId, eventType, subjectUserId, actorUserId, note, createdAt)
    SELECT a.institutionalAccountId, 'accepted', a.userId, a.addedByUserId,
           'Backfilled from institutionalAccountAdmins (grant predates the audit table).', a.createdAt
    FROM institutionalAccountAdmins a
    WHERE NOT EXISTS (
      SELECT 1 FROM institutionalAdminEvents e
      WHERE e.institutionalAccountId = a.institutionalAccountId AND e.subjectUserId = a.userId
    )
  `);
  console.log(`[0198] Backfilled ${result.affectedRows ?? 0} existing administrator grant(s) into the audit table.`);
} finally {
  await connection.end();
}
