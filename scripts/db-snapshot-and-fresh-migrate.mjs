/**
 * 1) Writes a read-only schema snapshot (no credentials) to docs/DB_SNAPSHOT_AUTOGEN.md
 * 2) Drops all tables in the target database (DESTRUCTIVE)
 * 3) Runs `drizzle-kit migrate` to rebuild from drizzle/meta journal
 *
 * Requires DATABASE_URL in .env (same pattern as db:apply-* scripts).
 *
 *   pnpm run db:fresh-migrate
 */
import "dotenv/config";
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import mysql from "mysql2/promise";

function getConnectionConfig(databaseUrl) {
  const url = new URL(databaseUrl);
  const needsSsl =
    /ssl-mode=REQUIRED|ssl=true/i.test(databaseUrl) ||
    url.hostname.endsWith(".aivencloud.com");
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

async function snapshot(conn, dbName, label) {
  let out = `# Database snapshot (${label})\n\n`;
  out += `Generated locally (no credentials stored here).\n\n`;
  out += `Database name: \`${dbName}\`\n\n`;

  const [tables] = await conn.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`,
    [dbName]
  );
  out += `## Tables (${tables.length})\n\n`;
  for (const row of tables) {
    out += `- \`${row.TABLE_NAME}\`\n`;
  }
  out += `\n`;

  const migTable = "__drizzle_migrations";
  const [migExists] = await conn.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [dbName, migTable]
  );
  if (migExists.length) {
    const [migs] = await conn.query(`SELECT * FROM \`${migTable}\` ORDER BY id`);
    out += `## ${migTable}\n\n\`\`\`json\n${JSON.stringify(migs, null, 2)}\n\`\`\`\n\n`;
  } else {
    out += `## ${migTable}\n\n(not present)\n\n`;
  }

  for (const name of ["microCourseEnrollments", "certificates", "enrollments"]) {
    const [exists] = await conn.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [dbName, name]
    );
    if (!exists.length) {
      out += `## ${name}\n\n(table missing)\n\n`;
      continue;
    }
    const [cols] = await conn.query(`DESCRIBE \`${name}\``);
    out += `## ${name}\n\n`;
    out += "| Field | Type | Null | Key | Default | Extra |\n| --- | --- | --- | --- | --- | --- |\n";
    for (const c of cols) {
      out += `| ${c.Field} | ${c.Type} | ${c.Null} | ${c.Key} | ${c.Default ?? ""} | ${c.Extra ?? ""} |\n`;
    }
    out += `\n`;
  }

  return out;
}

async function dropAllTables(conn, dbName) {
  await conn.query("SET FOREIGN_KEY_CHECKS = 0");
  const [tables] = await conn.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
    [dbName]
  );
  for (const row of tables) {
    await conn.query(`DROP TABLE IF EXISTS \`${row.TABLE_NAME}\``);
  }
  await conn.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log(`Dropped ${tables.length} tables.`);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Add it to .env");
    process.exit(1);
  }

  const conn = await mysql.createConnection(getConnectionConfig(url));
  const dbName = conn.config.database;
  if (!dbName) {
    console.error("DATABASE_URL must include a database name in the path.");
    await conn.end();
    process.exit(1);
  }

  const here = dirname(fileURLToPath(import.meta.url));
  const root = join(here, "..");
  const snapshotPath = join(root, "docs", "DB_SNAPSHOT_AUTOGEN.md");

  try {
    const before = await snapshot(conn, dbName, "before reset");
    writeFileSync(snapshotPath, before, "utf8");
    console.log(`Wrote ${snapshotPath}`);

    await dropAllTables(conn, dbName);
    await conn.end();

    console.log("Running drizzle-kit migrate...");
    execSync("npx drizzle-kit migrate", {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: url },
    });

    const conn2 = await mysql.createConnection(getConnectionConfig(url));
    const after = await snapshot(conn2, dbName, "after migrate");
    await conn2.end();

    writeFileSync(
      snapshotPath,
      before + "\n\n---\n\n" + after,
      "utf8"
    );
    console.log(`Appended after-migrate snapshot to ${snapshotPath}`);
    console.log("Done. Verify Render/production DATABASE_URL matches this .env before deploy.");
  } catch (e) {
    if (e?.code === "ER_ACCESS_DENIED_ERROR") {
      console.error(
        "\nAccess denied: check DATABASE_URL in .env matches Aiven (copy Connection URI after any password reset).\n"
      );
    }
    console.error(e);
    await conn.end().catch(() => {});
    process.exit(1);
  }
}

main();
