import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  const [columns] = await connection.query(
    "SHOW COLUMNS FROM retrospectiveRoleClaims LIKE 'simulationRole'",
  );
  if (!Array.isArray(columns) || columns.length === 0) {
    throw new Error("retrospectiveRoleClaims.simulationRole is missing");
  }
  console.log("[0191] PASS — retrospectiveRoleClaims.simulationRole is present.");
} finally {
  await connection.end();
}
