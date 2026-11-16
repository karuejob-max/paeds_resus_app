import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const TABLE = "retrospectiveRoleClaims";
const COLUMN = "simulationRole";
const ENUM = "ENUM('team_member','team_leader','team_member_airway_ventilation','team_member_compressor_1','team_member_compressor_2','team_member_monitor_defib_cpr_coach','team_member_iv_io_meds','team_member_scribe','observer')";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  const [tables] = await connection.query(
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
    [TABLE],
  );
  if (!Array.isArray(tables) || tables.length === 0) {
    throw new Error(`${TABLE} is missing; apply migration 0084 first`);
  }

  const [columns] = await connection.query(
    "SHOW COLUMNS FROM retrospectiveRoleClaims LIKE 'simulationRole'",
  );
  if (Array.isArray(columns) && columns.length === 0) {
    await connection.execute(
      `ALTER TABLE \`${TABLE}\` ADD COLUMN \`${COLUMN}\` ${ENUM} NULL AFTER \`claimantUserId\``,
    );
    console.log("[0191] Added retrospectiveRoleClaims.simulationRole.");
  } else {
    console.log("[0191] retrospectiveRoleClaims.simulationRole already exists; no change needed.");
  }
} finally {
  await connection.end();
}
