/**
 * One-time script: add any missing columns to the `users` table so it matches the app schema.
 * Run from project root: node server/fix-users-columns.mjs
 * Ignores "duplicate column" errors (column already exists).
 */
import "dotenv/config";
import mysql from "mysql2/promise";

function getConnectionConfig(databaseUrl) {
  const url = new URL(databaseUrl);
  const needsSsl = /ssl-mode=REQUIRED|ssl=true/i.test(databaseUrl) || url.hostname.endsWith(".aivencloud.com");
  const database = url.pathname.replace(/^\//, "") || undefined;
  const config = {
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: database || undefined,
  };
  if (needsSsl) {
    // Aiven/cloud often use certs Node doesn't trust by default; still use SSL but allow connection
    config.ssl = { rejectUnauthorized: false };
  }
  return config;
}

const ALTERS = [
  "ALTER TABLE `users` ADD COLUMN `phone` varchar(20)",
  "ALTER TABLE `users` ADD COLUMN `providerType` enum('nurse','doctor','pharmacist','paramedic','lab_tech','respiratory_therapist','midwife','other')",
  "ALTER TABLE `users` ADD COLUMN `userType` enum('individual','institutional','parent') DEFAULT 'individual'",
  "ALTER TABLE `users` ADD COLUMN `passwordHash` varchar(255)",
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Create a .env file with DATABASE_URL.");
    process.exit(1);
  }
  const config = getConnectionConfig(url);
  const conn = await mysql.createConnection(config);
  console.log("[fix-users-columns] Connected. Adding any missing columns to `users`...");
  for (const sql of ALTERS) {
    try {
      await conn.execute(sql);
      console.log("[fix-users-columns] Added column:", sql.match(/ADD COLUMN `(\w+)`/)?.[1] ?? sql.slice(0, 50));
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME" || err.errno === 1060) {
        console.log("[fix-users-columns] Column already exists, skipping:", err.sqlMessage?.split("'")?.[1] ?? "");
      } else {
        console.error("[fix-users-columns] Error:", err.message);
        await conn.end();
        process.exit(1);
      }
    }
  }
  await conn.end();
  console.log("[fix-users-columns] Done. Try Create account again.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
