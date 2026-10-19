import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  const [tables] = await connection.query("SHOW TABLES LIKE ?", ["phase2MasteryCompletions"]);
  if (tables.length === 0) {
    await connection.query(`CREATE TABLE phase2MasteryCompletions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      enrollmentId INT NOT NULL,
      programType ENUM('acls','pals','nrp','heartsaver') NOT NULL,
      requirementSetVersion VARCHAR(64) NOT NULL,
      completedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      evidenceSnapshotJson JSON NOT NULL,
      revokedAt TIMESTAMP NULL,
      revokedReason TEXT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY phase2_mastery_completions_enrollment_program_uq (enrollmentId, programType),
      KEY phase2_mastery_completions_user_idx (userId)
    )`);
  }
  console.log("[0183] Phase 2 mastery completion records are ready.");
} finally {
  await connection.end();
}
