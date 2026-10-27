import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const CURRENT_ACLS_VERSION = "phase2-v6-acls-case-definitions-2026-10-27";
const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  const [tables] = await connection.query("SHOW TABLES LIKE ?", ["phase2MasteryCompletions"]);
  if (tables.length === 0) {
    console.log("[0186] phase2MasteryCompletions is not present; nothing to sweep.");
  } else {
    const [result] = await connection.query(
      `UPDATE phase2MasteryCompletions
       SET revokedAt = CURRENT_TIMESTAMP,
           revokedReason = ?,
           updatedAt = CURRENT_TIMESTAMP
       WHERE revokedAt IS NULL
         AND (programType <> 'acls' OR requirementSetVersion <> ?)`,
      [`Gate-integrity sweep: only current ACLS automated mastery is eligible for Phase 3 booking (${CURRENT_ACLS_VERSION}).`, CURRENT_ACLS_VERSION],
    );
    console.log(`[0186] Revoked ${result.affectedRows} stale or unsupported Phase 2 completion row(s).`);
  }
} finally {
  await connection.end();
}
