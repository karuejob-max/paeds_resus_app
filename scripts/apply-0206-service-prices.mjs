import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS servicePrices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      programType VARCHAR(32) NOT NULL,
      kind ENUM('standard','offer') NOT NULL,
      priceKes INT NOT NULL,
      label VARCHAR(120) NULL,
      startsAt TIMESTAMP NOT NULL,
      endsAt TIMESTAMP NULL,
      cancelledAt TIMESTAMP NULL,
      createdByUserId INT NOT NULL,
      endedByUserId INT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_servicePrices_program (programType, startsAt)
    )
  `);
  console.log("[0206] servicePrices table is ready.");
} finally {
  await connection.end();
}
