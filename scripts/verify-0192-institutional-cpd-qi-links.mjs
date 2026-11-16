import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  const [columns] = await connection.query("SHOW COLUMNS FROM institutionalQiReports LIKE 'failureModeCodes'");
  if (!Array.isArray(columns) || columns.length !== 1) throw new Error("institutionalQiReports.failureModeCodes is missing");
  const [tables] = await connection.query("SHOW TABLES LIKE 'institutionalQiCpdLinks'");
  if (!Array.isArray(tables) || tables.length !== 1) throw new Error("institutionalQiCpdLinks is missing");
  const [linkColumns] = await connection.query("SHOW COLUMNS FROM institutionalQiCpdLinks LIKE 'relationshipType'");
  if (!Array.isArray(linkColumns) || linkColumns.length !== 1 || !String(linkColumns[0].Type).includes("improvement_response")) {
    throw new Error("institutionalQiCpdLinks.relationshipType is incomplete");
  }
  const [counts] = await connection.query("SELECT COUNT(*) AS cpdQiLinks FROM institutionalQiCpdLinks");
  console.log("[0192] OK — failure-mode tags and CPD-to-QI links are available.");
  console.log(JSON.stringify(counts, null, 2));
} finally {
  await connection.end();
}
