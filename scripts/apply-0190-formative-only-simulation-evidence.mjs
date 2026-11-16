import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  const [columns] = await connection.query("SHOW COLUMNS FROM simulationWorldEvidence LIKE 'evidenceStatus'");
  if (columns.length === 0) throw new Error("simulationWorldEvidence.evidenceStatus is missing; apply 0174 first");

  const column = columns[0];
  const expected = "enum('review_required','accepted','rejected','formative_only')";
  if (String(column.Type).toLowerCase() !== expected) {
    await connection.execute(
      "ALTER TABLE simulationWorldEvidence MODIFY COLUMN evidenceStatus ENUM('review_required','accepted','rejected','formative_only') NOT NULL DEFAULT 'review_required'",
    );
    console.log("[0190] Added formative_only to simulationWorldEvidence.evidenceStatus.");
  } else {
    console.log("[0190] formative_only already exists; no change needed.");
  }
} finally {
  await connection.end();
}
