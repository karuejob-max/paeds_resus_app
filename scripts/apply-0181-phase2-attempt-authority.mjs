import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));

async function addColumn(column, definition) {
  const [rows] = await connection.query("SHOW COLUMNS FROM `ahaPracticeLabAttempts` LIKE ?", [column]);
  if (rows.length === 0) {
    await connection.query(`ALTER TABLE \`ahaPracticeLabAttempts\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`[0181] Added ahaPracticeLabAttempts.${column}`);
  } else {
    console.log(`[0181] ahaPracticeLabAttempts.${column} already exists`);
  }
}

try {
  await addColumn("evidenceStatus", "ENUM('review_required','accepted','rejected') NOT NULL DEFAULT 'review_required'");
  await addColumn("scenarioVersion", "VARCHAR(32) NOT NULL DEFAULT 'legacy-v1'");
  console.log("[0181] Phase 2 attempt authority metadata is ready.");
} finally {
  await connection.end();
}
