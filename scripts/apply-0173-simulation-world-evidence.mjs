import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(getConnectionConfig());
try {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS simulationWorldSessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      enrollmentId INT NOT NULL,
      programType ENUM('bls','acls','pals','heartsaver','nrp') NOT NULL,
      scenarioId VARCHAR(64) NOT NULL,
      role VARCHAR(64) NOT NULL,
      sessionNonce VARCHAR(128) NOT NULL UNIQUE,
      engineVersion VARCHAR(32) NOT NULL,
      scenarioVersion VARCHAR(32) NOT NULL,
      assessmentVersion VARCHAR(32) NOT NULL,
      status ENUM('active','completed','expired','abandoned') NOT NULL DEFAULT 'active',
      startedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      lastReceiptAt TIMESTAMP NULL,
      completedAt TIMESTAMP NULL,
      INDEX simulationWorldSessions_user_lookup (userId, startedAt),
      INDEX simulationWorldSessions_enrollment_lookup (enrollmentId, startedAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS simulationWorldCommandReceipts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sessionId INT NOT NULL,
      sequence INT NOT NULL,
      commandType VARCHAR(64) NOT NULL,
      commandJson JSON NOT NULL,
      receivedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      serverElapsedMs INT NOT NULL,
      receiptHash VARCHAR(32) NOT NULL,
      UNIQUE KEY simulationWorldCommandReceipts_session_sequence (sessionId, sequence),
      INDEX simulationWorldCommandReceipts_session_lookup (sessionId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS simulationWorldEvidence (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sessionId INT NOT NULL,
      userId INT NOT NULL,
      enrollmentId INT NOT NULL,
      role VARCHAR(64) NOT NULL,
      scenarioId VARCHAR(64) NOT NULL,
      evidenceStatus ENUM('review_required','accepted','rejected') NOT NULL DEFAULT 'review_required',
      assessmentJson JSON NULL,
      reviewerId INT NULL,
      reviewerReason TEXT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reviewedAt TIMESTAMP NULL,
      UNIQUE KEY simulationWorldEvidence_session_unique (sessionId),
      INDEX simulationWorldEvidence_user_lookup (userId, createdAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("[0173] Simulation World evidence tables are ready.");
} finally {
  await connection.end();
}
