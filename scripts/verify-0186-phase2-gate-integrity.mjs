import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const CURRENT_ACLS_VERSION = "phase2-v6-acls-case-definitions-2026-10-27";
const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  const [tables] = await connection.query("SHOW TABLES LIKE ?", ["phase2MasteryCompletions"]);
  if (tables.length === 0) {
    console.log("[0186] OK — no Phase 2 completion table exists, so no stale rows can unlock booking.");
  } else {
    const [rows] = await connection.query(
      `SELECT COUNT(*) AS count
       FROM phase2MasteryCompletions
       WHERE revokedAt IS NULL
         AND (programType <> 'acls' OR requirementSetVersion <> ?)`,
      [CURRENT_ACLS_VERSION],
    );
    const count = Number(rows[0]?.count ?? 0);
    if (count !== 0) throw new Error(`[0186] Found ${count} active unsupported or stale Phase 2 completion row(s).`);
    console.log(`[0186] OK — no active unsupported/stale Phase 2 completion rows; current ACLS version is ${CURRENT_ACLS_VERSION}.`);
  }
} finally {
  await connection.end();
}
