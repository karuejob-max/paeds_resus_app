import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");
const env = readFileSync(envPath, "utf8");
const match = env.match(/^DATABASE_URL=(.+)$/m);
if (!match) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}
const url = match[1].trim();

const conn = await mysql.createConnection(url);
const [tables] = await conn.query("SHOW TABLES LIKE 'passwordResetTokens'");
console.log("passwordResetTokens table:", tables.length ? "exists" : "MISSING");

const [users] = await conn.query(
  "SELECT id, email, (passwordHash IS NOT NULL) AS hasPwd, loginMethod FROM users WHERE email IS NOT NULL ORDER BY id LIMIT 15"
);
console.log("\nUsers with email:");
for (const u of users) {
  console.log(`  id=${u.id} email=${u.email} hasPwd=${u.hasPwd} login=${u.loginMethod}`);
}

try {
  const [tokens] = await conn.query(
    "SELECT id, userId, LEFT(token, 8) AS tokenPrefix, expiresAt, createdAt FROM passwordResetTokens ORDER BY id DESC LIMIT 5"
  );
  console.log("\nRecent password reset tokens:", tokens.length ? "" : "(none)");
  for (const t of tokens) console.log(" ", t);
} catch (e) {
  console.log("\nToken query error:", e.message);
}

await conn.end();
