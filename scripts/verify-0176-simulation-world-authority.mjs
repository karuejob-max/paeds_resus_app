import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  for (const [table, columns] of Object.entries({
    simulationWorldSessions: ["authorityState", "authoritativeStateJson"],
    simulationWorldCommandReceipts: ["canonicalEventsJson", "authoritativeStateJson"],
  })) {
    for (const column of columns) {
      const [rows] = await connection.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
      if (rows.length !== 1) throw new Error(`[0176] Missing ${table}.${column}`);
      console.log(`[0176] OK ${table}.${column}`);
    }
  }
} finally {
  await connection.end();
}
