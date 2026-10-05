import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const db = await createMysqlConnection(databaseUrl, mysql);

async function hasColumn(table, column) {
  const [rows] = await db.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
  return rows.length > 0;
}
async function hasIndex(table, indexName) {
  const [rows] = await db.query(`SHOW INDEX FROM \`${table}\` WHERE Key_name = ?`, [indexName]);
  return rows.length > 0;
}

try {
  console.log("[0175] Preparing persisted professional evidence-instance identity...");
  if (!(await hasColumn("professionalEvidenceLedger", "evidenceInstanceKey"))) {
    await db.query("ALTER TABLE professionalEvidenceLedger ADD COLUMN evidenceInstanceKey VARCHAR(192) NULL AFTER sourceRecordId");
  }
  await db.query(`
    UPDATE professionalEvidenceLedger
    SET evidenceInstanceKey = CASE
      WHEN sourceSystem = 'certificates' THEN CONCAT('certificate:', COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sourceFactJson, '$.certificateNumber')), ''), sourceRecordId))
      WHEN sourceSystem = 'aha_learning' THEN CONCAT('aha:enrollment:', sourceRecordId)
      WHEN sourceSystem = 'fellowship' THEN CONCAT('fellowship:microcourse:', sourceRecordId)
      WHEN sourceSystem = 'external_completion' THEN CONCAT('external:completion:', sourceRecordId)
      WHEN sourceSystem = 'ierp' THEN CONCAT('ierp:enrollment:', sourceRecordId)
      WHEN sourceSystem = 'nerp' THEN CONCAT('nerp:enrollment:', sourceRecordId)
      WHEN sourceSystem = 'cpd_portal' THEN CONCAT('cpd:attendee:', sourceRecordId)
      WHEN sourceSystem = 'competence_assessment' THEN CONCAT('competence:assessment:', sourceRecordId)
      ELSE CONCAT(LOWER(sourceSystem), ':', LOWER(sourceRecordType), ':', sourceRecordId)
    END
    WHERE evidenceInstanceKey IS NULL OR evidenceInstanceKey = ''
  `);
  await db.query("ALTER TABLE professionalEvidenceLedger MODIFY COLUMN evidenceInstanceKey VARCHAR(192) NOT NULL");
  if (!(await hasIndex("professionalEvidenceLedger", "professional_evidence_ledger_user_instance_idx"))) {
    await db.query("ALTER TABLE professionalEvidenceLedger ADD INDEX professional_evidence_ledger_user_instance_idx (userId, evidenceType, evidenceInstanceKey)");
  }
  console.log("[0175] Persisted evidence-instance identity is ready.");
} finally {
  await db.end();
}
