import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
async function addColumn(table, column, definition) {
  const [rows] = await connection.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
  if (rows.length === 0) await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
}
try {
  await addColumn("simulationWorldSessions", "authorityState", "ENUM('connected','degraded','offline','recovering','invalidated') NOT NULL DEFAULT 'connected'");
  await addColumn("simulationWorldSessions", "authoritativeStateJson", "JSON NULL");
  await addColumn("simulationWorldCommandReceipts", "canonicalEventsJson", "JSON NULL");
  await addColumn("simulationWorldCommandReceipts", "authoritativeStateJson", "JSON NULL");
  console.log("[0176] Simulation World authoritative execution fields are ready.");
} finally {
  await connection.end();
}
