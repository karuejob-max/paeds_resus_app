import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  await connection.execute(`
    ALTER TABLE institutionVerificationEvents
      MODIFY COLUMN eventType ENUM('submitted','verified','rejected','revoked','grandfathered','archived','restored','facility_linked') NOT NULL
  `);
  console.log("[0203] institutionVerificationEvents now records 'facility_linked'.");
} finally {
  await connection.end();
}
