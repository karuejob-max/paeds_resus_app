import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const db = await createMysqlConnection(databaseUrl, mysql);

try {
  const [membershipColumns] = await db.query("SHOW COLUMNS FROM institutionMemberships LIKE 'membershipStatus'");
  const membershipType = membershipColumns[0]?.Type || "";
  if (!membershipType.includes("declined")) throw new Error("[0178-verify] FAIL: institutionMemberships.membershipStatus does not include declined");

  const [eventColumns] = await db.query("SHOW COLUMNS FROM institution_membership_events LIKE 'event_type'");
  const eventType = eventColumns[0]?.Type || "";
  for (const required of ["invited", "reinvited", "accepted", "declined", "cancelled"]) {
    if (!eventType.includes(required)) throw new Error(`[0178-verify] FAIL: event_type does not include ${required}`);
  }
  console.log("[0178-verify] PASS: invitation decline state and append-only invitation lifecycle events are present.");
} finally {
  await db.end();
}
