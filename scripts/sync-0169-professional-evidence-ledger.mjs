import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const conn = await createMysqlConnection(databaseUrl, mysql);
try {
  console.log("[0169-sync] Backfilling canonical evidence identities (no source rows are modified)...");
  await conn.query(`
    INSERT INTO professionalEvidenceLedger
      (userId, sourceKey, evidenceType, title, programme, sourceSystem, sourceRecordType, sourceRecordId, status, evidenceStrength, verificationMethod, startedAt, completedAt, visibility, metadataJson, sourceFactJson, interpretation, interpretationVersion)
    SELECT e.userId, CONCAT('user:', e.userId, ':aha-enrollment:', e.id), 'learning',
      CONCAT(UPPER(e.programType), ' Life Support learning'), UPPER(e.programType), 'aha_learning', 'enrollments', CAST(e.id AS CHAR),
      CASE WHEN e.enrollmentStatus = 'cancelled' THEN 'cancelled' WHEN e.cognitiveModulesComplete = 1 AND e.practicalSkillsSignedOff = 1 THEN 'credential_ready' WHEN e.cognitiveModulesComplete = 1 THEN 'learning_complete' WHEN e.lastActivityAt IS NOT NULL THEN 'learning_in_progress' ELSE 'enrolled_not_started' END,
      CASE WHEN e.practicalSkillsSignedOff = 1 THEN 'assessed' WHEN e.cognitiveModulesComplete = 1 THEN 'recorded' ELSE 'developing' END,
      CASE WHEN e.practicalSkillsSignedOff = 1 THEN 'approved_instructor' ELSE NULL END,
      e.trainingDate, CASE WHEN e.cognitiveModulesComplete = 1 THEN COALESCE(e.cognitiveModulesCompletedAt, e.updatedAt) ELSE NULL END,
      'private', JSON_OBJECT('paymentStatus', e.paymentStatus, 'courseId', e.courseId, 'practicalSkillsSignedOff', e.practicalSkillsSignedOff), JSON_OBJECT('enrollmentStatus', e.enrollmentStatus, 'cognitiveModulesComplete', e.cognitiveModulesComplete, 'practicalSkillsSignedOff', e.practicalSkillsSignedOff, 'updatedAt', e.updatedAt), 'learning_status', '0172-v1'
    FROM enrollments e
    WHERE e.programType IN ('bls','acls','pals','nrp')
    ON DUPLICATE KEY UPDATE status = VALUES(status), evidenceStrength = VALUES(evidenceStrength), completedAt = VALUES(completedAt), metadataJson = VALUES(metadataJson), sourceFactJson = VALUES(sourceFactJson), interpretation = VALUES(interpretation), interpretationVersion = VALUES(interpretationVersion), updatedAt = CURRENT_TIMESTAMP
  `);
  await conn.query(`
    INSERT INTO professionalEvidenceLedger
      (userId, sourceKey, evidenceType, title, programme, sourceSystem, sourceRecordType, sourceRecordId, status, evidenceStrength, verificationMethod, completedAt, issuedAt, expiresAt, evidenceReference, visibility, metadataJson, sourceFactJson, interpretation, interpretationVersion)
    SELECT c.userId, CONCAT('user:', c.userId, ':certificate:', c.id), 'credential',
      CONCAT(UPPER(c.programType), ' certificate'), c.programType, 'certificates', 'certificates', CAST(c.id AS CHAR), 'issued', 'credential',
      CASE WHEN c.verificationCode IS NULL THEN NULL ELSE 'platform_verification' END,
      c.issueDate, c.issueDate, c.expiryDate, c.verificationCode, 'shareable', JSON_OBJECT('certificateNumber', c.certificateNumber), JSON_OBJECT('issueDate', c.issueDate, 'expiryDate', c.expiryDate, 'verificationCodePresent', c.verificationCode IS NOT NULL), 'credential_issued', '0172-v1'
    FROM certificates c
    ON DUPLICATE KEY UPDATE status = VALUES(status), issuedAt = VALUES(issuedAt), expiresAt = VALUES(expiresAt), evidenceReference = VALUES(evidenceReference), metadataJson = VALUES(metadataJson), sourceFactJson = VALUES(sourceFactJson), interpretation = VALUES(interpretation), interpretationVersion = VALUES(interpretationVersion), updatedAt = CURRENT_TIMESTAMP
  `);
  await conn.query(`
    INSERT INTO professionalEvidenceLedger
      (userId, sourceKey, evidenceType, title, programme, sourceSystem, sourceRecordType, sourceRecordId, status, evidenceStrength, verificationMethod, completedAt, visibility, metadataJson, sourceFactJson, interpretation, interpretationVersion)
    SELECT m.userId, CONCAT('user:', m.userId, ':micro-course:', m.id), 'learning',
      COALESCE(c.title, CONCAT('Fellowship micro-course #', m.microCourseId)), 'Paeds Resus Fellowship', 'fellowship', 'microCourseEnrollments', CAST(m.id AS CHAR),
      CASE WHEN m.enrollmentStatus = 'completed' THEN 'learning_complete' WHEN COALESCE(m.progressPercentage, 0) > 0 THEN 'learning_in_progress' ELSE 'enrolled_not_started' END,
      CASE WHEN m.enrollmentStatus = 'completed' THEN 'recorded' ELSE 'developing' END, NULL, m.completedAt, 'private', JSON_OBJECT('progressPercentage', m.progressPercentage, 'microCourseId', m.microCourseId), JSON_OBJECT('enrollmentStatus', m.enrollmentStatus, 'progressPercentage', m.progressPercentage, 'completedAt', m.completedAt), 'learning_status', '0172-v1'
    FROM microCourseEnrollments m LEFT JOIN microCourses c ON c.id = m.microCourseId
    ON DUPLICATE KEY UPDATE status = VALUES(status), completedAt = VALUES(completedAt), metadataJson = VALUES(metadataJson), sourceFactJson = VALUES(sourceFactJson), interpretation = VALUES(interpretation), interpretationVersion = VALUES(interpretationVersion), updatedAt = CURRENT_TIMESTAMP
  `);
  console.log("[0169-sync] PASS: existing source records were projected idempotently; source tables were not modified.");
} finally {
  await conn.end();
}
