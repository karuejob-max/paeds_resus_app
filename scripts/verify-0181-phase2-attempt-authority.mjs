import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  for (const column of ["evidenceStatus", "scenarioVersion"]) {
    const [rows] = await connection.query("SHOW COLUMNS FROM `ahaPracticeLabAttempts` LIKE ?", [column]);
    if (rows.length !== 1) throw new Error(`[0181] Missing ahaPracticeLabAttempts.${column}`);
    console.log(`[0181] OK ahaPracticeLabAttempts.${column}`);
  }
} finally {
  await connection.end();
}
