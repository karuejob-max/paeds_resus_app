/**
 * Idempotent: extends programType enum with `instructor`; adds users.instructorNumber, users.instructorCertifiedAt.
 *
 *   pnpm run db:apply-0028
 */
import "dotenv/config";
import mysql from "mysql2/promise";

function getConnectionConfig(databaseUrl) {
  const url = new URL(databaseUrl);
  const needsSsl =
    /ssl-mode=REQUIRED|ssl=true/i.test(databaseUrl) || url.hostname.endsWith(".aivencloud.com");
  const database = url.pathname.replace(/^\//, "") || undefined;
  const config = {
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: database || undefined,
  };
  if (needsSsl) {
    config.ssl = { rejectUnauthorized: false };
  }
  return config;
}

async function columnExists(conn, dbName, table, column) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbName, table, column]
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function enumHasInstructor(conn, dbName, table, column) {
  const [rows] = await conn.query(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbName, table, column]
  );
  const ct = rows?.[0]?.COLUMN_TYPE;
  return typeof ct === "string" && ct.includes("instructor");
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  let conn;
  try {
    conn = await mysql.createConnection(getConnectionConfig(databaseUrl));
    const dbName = conn.config.database;

    if (!(await columnExists(conn, dbName, "users", "instructorNumber"))) {
      await conn.query(
        "ALTER TABLE `users` ADD COLUMN `instructorNumber` varchar(32) NULL, ADD UNIQUE KEY `users_instructorNumber_unique` (`instructorNumber`)"
      );
      console.log("Added users.instructorNumber (unique).");
    } else {
      console.log("users.instructorNumber already exists.");
    }

    if (!(await columnExists(conn, dbName, "users", "instructorCertifiedAt"))) {
      await conn.query(
        "ALTER TABLE `users` ADD COLUMN `instructorCertifiedAt` timestamp NULL DEFAULT NULL"
      );
      console.log("Added users.instructorCertifiedAt.");
    } else {
      console.log("users.instructorCertifiedAt already exists.");
    }

    const tables = ["enrollments", "certificates", "courses"];
    for (const t of tables) {
      if (await enumHasInstructor(conn, dbName, t, "programType")) {
        console.log(`${t}.programType already includes instructor.`);
        continue;
      }
      await conn.query(
        `ALTER TABLE \`${t}\` MODIFY COLUMN \`programType\` ENUM('bls','acls','pals','fellowship','instructor') NOT NULL`
      );
      console.log(`Extended ${t}.programType with instructor.`);
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
