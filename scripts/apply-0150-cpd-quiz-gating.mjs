import "dotenv/config";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const connection = await mysql.createConnection(databaseUrl);
try {
  console.log("[0150] Applying CPD quiz-gating tables...");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`cpdEventQuizzes\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`cpdEventId\` INT NOT NULL,
      \`passingScore\` INT NOT NULL DEFAULT 80,
      \`isRequired\` BOOLEAN NOT NULL DEFAULT TRUE,
      \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`cpd_event_quizzes_event_uq\` (\`cpdEventId\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`cpdEventQuizQuestions\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`cpdEventQuizId\` INT NOT NULL,
      \`question\` TEXT NOT NULL,
      \`questionType\` ENUM('multiple_choice','true_false') NOT NULL DEFAULT 'multiple_choice',
      \`options\` TEXT NULL,
      \`correctAnswer\` TEXT NOT NULL,
      \`order\` INT NOT NULL DEFAULT 0,
      \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`cpd_event_quiz_questions_order_idx\` (\`cpdEventQuizId\`, \`order\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`cpdAttendeeQuizAttempts\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`cpdAttendeeId\` INT NOT NULL,
      \`cpdEventQuizId\` INT NOT NULL,
      \`score\` INT NOT NULL,
      \`passed\` BOOLEAN NOT NULL,
      \`answers\` TEXT NOT NULL,
      \`submittedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`cpd_attendee_quiz_attempts_attendee_quiz_idx\` (\`cpdAttendeeId\`, \`cpdEventQuizId\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("[0150] CPD quiz-gating tables are ready.");
} finally {
  await connection.end();
}
