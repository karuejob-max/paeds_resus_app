import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  const [columns] = await connection.query("SHOW COLUMNS FROM simulationWorldEvidence LIKE 'evidenceStatus'");
  if (columns.length !== 1) throw new Error("simulationWorldEvidence.evidenceStatus is missing");
  const type = String(columns[0].Type).toLowerCase();
  if (!type.includes("formative_only")) throw new Error(`formative_only is missing from evidenceStatus: ${type}`);
  const [counts] = await connection.query("SELECT evidenceStatus, COUNT(*) AS count FROM simulationWorldEvidence GROUP BY evidenceStatus ORDER BY evidenceStatus");
  console.log("[0190] OK — formative_only is available in simulationWorldEvidence.evidenceStatus.");
  console.log(JSON.stringify(counts, null, 2));
} finally {
  await connection.end();
}
