/**
 * Idempotent: enhance platformFeedbackTickets (migration 0051).
 *
 *   pnpm run db:apply-0051
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function indexExists(conn, table, indexName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [table, indexName]
  );
  return rows.length > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  const table = "platformFeedbackTickets";

  const [tables] = await conn.query(
    `SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    [table]
  );
  if (!tables.length) {
    console.error("[0051] platformFeedbackTickets missing — run db:apply-0048 first.");
    process.exit(1);
  }

  await conn.query(
    `ALTER TABLE \`${table}\`
     MODIFY \`status\` enum('open','in_progress','resolved','wont_fix','duplicate') NOT NULL DEFAULT 'open'`
  );
  console.log("[0051] status enum includes duplicate.");

  const columns = [
    {
      name: "severity",
      sql: `ADD COLUMN \`severity\` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium' AFTER \`priority\``,
    },
    {
      name: "issueType",
      sql: `ADD COLUMN \`issueType\` enum('bug','content','ux','billing','clinical','other') NULL AFTER \`category\``,
    },
    {
      name: "assignedAgent",
      sql: `ADD COLUMN \`assignedAgent\` varchar(64) NULL AFTER \`respondedBy\``,
    },
    { name: "agentTags", sql: `ADD COLUMN \`agentTags\` json NULL AFTER \`assignedAgent\`` },
    { name: "statusHistoryJson", sql: `ADD COLUMN \`statusHistoryJson\` json NULL AFTER \`agentTags\`` },
    {
      name: "duplicateOfTicketId",
      sql: `ADD COLUMN \`duplicateOfTicketId\` int NULL AFTER \`statusHistoryJson\``,
    },
  ];

  for (const col of columns) {
    if (await columnExists(conn, table, col.name)) {
      console.log(`[0051] column ${col.name} already exists — skip.`);
    } else {
      await conn.query(`ALTER TABLE \`${table}\` ${col.sql}`);
      console.log(`[0051] added column ${col.name}.`);
    }
  }

  for (const [indexName, cols] of [
    ["platformFeedbackTickets_severity_status", "(`severity`, `status`)"],
    ["platformFeedbackTickets_issueType", "(`issueType`)"],
  ]) {
    if (await indexExists(conn, table, indexName)) {
      console.log(`[0051] index ${indexName} already exists — skip.`);
    } else {
      await conn.query(`CREATE INDEX \`${indexName}\` ON \`${table}\` ${cols}`);
      console.log(`[0051] created index ${indexName}.`);
    }
  }

  console.log("[0051] platformFeedbackTickets enhancements ready.");
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
