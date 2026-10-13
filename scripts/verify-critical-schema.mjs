#!/usr/bin/env node
import "dotenv/config";
import mysql from "mysql2/promise";

const requiredTables = [
  "users",
  "certificates",
  "microCourses",
  "enrollments",
  "payments",
  "institutionalAccounts",
  "institutionMemberships",
  "institutionProductEntitlements",
  "inAppNotifications",
  "userNotificationPreferences",
  "mpesaWebhookLog",
];

if (!process.env.DATABASE_URL?.trim()) {
  console.error("[critical-schema] DATABASE_URL is required");
  process.exit(1);
}

const url = new URL(process.env.DATABASE_URL);
const connection = await mysql.createConnection({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
  ssl:
    process.env.DATABASE_SSL === "false"
      ? undefined
      : { rejectUnauthorized: false },
});
try {
  const [rows] = await connection.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (${requiredTables.map(() => "?").join(",")})`,
    requiredTables
  );
  const present = new Set(rows.map(row => row.TABLE_NAME));
  const missing = requiredTables.filter(table => !present.has(table));
  const result = {
    database: url.pathname.replace(/^\//, ""),
    requiredTables,
    present: [...present].sort(),
    missing,
    ready: missing.length === 0,
  };
  console.log(JSON.stringify(result, null, 2));
  if (missing.length) process.exitCode = 1;
} finally {
  await connection.end();
}
