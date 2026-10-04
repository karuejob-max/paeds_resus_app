import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  for (const table of ["simulationWorldSessions", "simulationWorldCommandReceipts", "simulationWorldEvidence"]) {
    const [rows] = await connection.query(`SHOW TABLES LIKE ?`, [table]);
    if (!rows.length) throw new Error(`Missing ${table}`);
    console.log(`[0174] OK ${table}`);
  }
  const [[sessionCount]] = await connection.query("SELECT COUNT(*) AS count FROM simulationWorldSessions");
  const [[receiptCount]] = await connection.query("SELECT COUNT(*) AS count FROM simulationWorldCommandReceipts");
  const [[evidenceCount]] = await connection.query("SELECT COUNT(*) AS count FROM simulationWorldEvidence");
  console.log(`[0174] Counts sessions=${sessionCount.count} receipts=${receiptCount.count} evidence=${evidenceCount.count}`);
} finally {
  await connection.end();
}

