import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ilsAccessCodeAttemptWindows (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      fingerprintHash VARCHAR(64) NOT NULL,
      programType ENUM('bls','acls','pals','nrp') NOT NULL,
      windowStartedAt TIMESTAMP NOT NULL,
      attemptCount INT NOT NULL DEFAULT 0,
      blockedUntil TIMESTAMP NULL,
      lastAttemptAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY ils_access_code_attempt_identity_uq (userId, fingerprintHash, programType),
      KEY ils_access_code_attempt_blocked_idx (blockedUntil, lastAttemptAt)
    ) ENGINE=InnoDB;
  `);
  console.log("[0187] ILSP access-code attempt ledger is ready.");
} finally {
  await connection.end();
}
