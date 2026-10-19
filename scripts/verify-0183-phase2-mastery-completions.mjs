import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  const [tables] = await connection.query("SHOW TABLES LIKE ?", ["phase2MasteryCompletions"]);
  if (tables.length !== 1) throw new Error("[0183] Missing phase2MasteryCompletions");
  const [columns] = await connection.query("SHOW COLUMNS FROM phase2MasteryCompletions");
  const names = new Set(columns.map((column) => column.Field));
  for (const required of ["userId", "enrollmentId", "programType", "requirementSetVersion", "completedAt", "evidenceSnapshotJson", "revokedAt"]) {
    if (!names.has(required)) throw new Error(`[0183] Missing phase2MasteryCompletions.${required}`);
  }
  console.log("[0183] OK phase2MasteryCompletions schema");
} finally {
  await connection.end();
}
