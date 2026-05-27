/**
 * Idempotent E2E provider account for Playwright holistic-loop tests.
 *
 *   E2E_PROVIDER_EMAIL=... E2E_PROVIDER_PASSWORD=... pnpm run e2e:ensure-provider
 *
 * Requires DATABASE_URL. Prefer staging DB — do not run against production with weak passwords.
 * Uses scripts/db-connection-config.mjs (IPv4 + SSL) for Aiven from Windows dev machines.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const email = process.env.E2E_PROVIDER_EMAIL?.trim().toLowerCase();
  const password = process.env.E2E_PROVIDER_PASSWORD;

  if (!databaseUrl) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }
  if (!email || !password) {
    console.error("E2E_PROVIDER_EMAIL and E2E_PROVIDER_PASSWORD are required.");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("E2E_PROVIDER_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  const openId = `email:${email}`;
  const passwordHash = await bcrypt.hash(password, 10);
  let conn;

  try {
    conn = await createMysqlConnection(databaseUrl, mysql);
    const [existing] = await conn.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);

    if (Array.isArray(existing) && existing.length > 0) {
      const userId = existing[0].id;
      await conn.query(
        `UPDATE users SET passwordHash = ?, loginMethod = 'email', userType = 'individual', openId = ?, updatedAt = NOW() WHERE id = ?`,
        [passwordHash, openId, userId]
      );
      console.log(`Updated E2E provider user id=${userId} (${email}).`);
    } else {
      const [result] = await conn.query(
        `INSERT INTO users (openId, email, name, loginMethod, passwordHash, userType, role, createdAt, updatedAt, lastSignedIn)
         VALUES (?, ?, ?, 'email', ?, 'individual', 'user', NOW(), NOW(), NOW())`,
        [openId, email, "E2E Test Provider", passwordHash]
      );
      console.log(`Created E2E provider user id=${result.insertId} (${email}).`);
    }

    await conn.query("UPDATE users SET resusGpsAccessExpiresAt = NULL WHERE email = ?", [email]);
    console.log("OK — E2E provider ready (ResusGPS access unrestricted).");
  } catch (e) {
    console.error(e.message || e);
    console.error(
      "Hint: verify DATABASE_URL and network reachability to Aiven (IPv4). Run: pnpm run db:test-connection"
    );
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
