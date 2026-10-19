import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  const [rows] = await connection.query("SHOW COLUMNS FROM `ahaPracticeLabAttempts` LIKE ?", ["criticalFailure"]);
  if (rows.length !== 1) throw new Error("[0182] Missing ahaPracticeLabAttempts.criticalFailure");
  console.log("[0182] OK ahaPracticeLabAttempts.criticalFailure");
} finally {
  await connection.end();
}
