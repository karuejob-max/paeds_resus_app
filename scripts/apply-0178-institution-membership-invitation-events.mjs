import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const db = await createMysqlConnection(databaseUrl, mysql);

try {
  console.log("[0178] Extending institution membership state and audit events...");
  await db.query(`
    ALTER TABLE institutionMemberships
    MODIFY membershipStatus ENUM('invited','active','suspended','ended','declined') NOT NULL DEFAULT 'invited'
  `);
  await db.query(`
    ALTER TABLE institution_membership_events
    MODIFY event_type ENUM('invited','reinvited','accepted','declined','cancelled','removed','restored','suspended','reactivated') NOT NULL
  `);
  console.log("[0178] Institution invitation state and audit events are ready.");
} finally {
  await db.end();
}
