/**
 * Idempotent: adds enrollments.courseId (nullable FK to courses.id).
 *
 *   pnpm run db:apply-0029
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

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const conn = await mysql.createConnection(getConnectionConfig(url));
  const dbName = conn.config.database;
  try {
    if (!(await columnExists(conn, dbName, "enrollments", "courseId"))) {
      await conn.query(
        `ALTER TABLE enrollments ADD COLUMN courseId int NULL, ALGORITHM=INPLACE, LOCK=NONE`
      );
      console.log("Added enrollments.courseId");
    } else {
      console.log("enrollments.courseId already exists — skip");
    }
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
