import "dotenv/config";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const connection = await mysql.createConnection(databaseUrl);
const expected = [
  "cpdEventQuizzes",
  "cpdEventQuizQuestions",
  "cpdAttendeeQuizAttempts",
];
try {
  for (const tableName of expected) {
    const [rows] = await connection.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
      [tableName],
    );
    if (!rows.length) throw new Error(`[0150 verify] FAIL — missing ${tableName}`);
    console.log(`[0150 verify] PASS — ${tableName}`);
  }
  console.log("[0150 verify] All CPD quiz-gating tables are present; no write was performed.");
} finally {
  await connection.end();
}
