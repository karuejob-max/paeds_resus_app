import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const db = await createMysqlConnection(databaseUrl, mysql);

try {
  const [tables] = await db.query("SHOW TABLES LIKE 'professionalCpdIdentityResolutionCases'");
  if (!tables.length) throw new Error("[0177-verify] FAIL: queue table is missing");
  const [columns] = await db.query("SHOW COLUMNS FROM professionalCpdIdentityResolutionCases");
  const names = new Set(columns.map((row) => row.Field));
  for (const required of ["cpdAttendeeId", "proposedUserId", "status", "reviewerUserId", "reviewerNote", "resolvedAt"]) {
    if (!names.has(required)) throw new Error(`[0177-verify] FAIL: missing column ${required}`);
  }
  const [indexes] = await db.query("SHOW INDEX FROM professionalCpdIdentityResolutionCases");
  const uniqueAttendee = indexes.some((row) => row.Non_unique === 0 && row.Column_name === "cpdAttendeeId");
  if (!uniqueAttendee) throw new Error("[0177-verify] FAIL: cpdAttendeeId is not uniquely constrained");
  console.log("[0177-verify] PASS: CPD identity-resolution queue, review fields, and one-case-per-attendee uniqueness are present.");
  console.log("[0177-verify] PASS: verifier is read-only; no CPD linkage was changed.");
} finally {
  await db.end();
}
