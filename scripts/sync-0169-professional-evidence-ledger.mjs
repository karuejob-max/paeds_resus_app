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
      'private', JSON_OBJECT('paymentStatus', e.paymentStatus, 'courseId', e.courseId, 'practicalSkillsSignedOff', e.practicalSkillsSignedOff), JSON_OBJECT('enrollmentStatus', e.enrollmentStatus, 'cognitiveModulesComplete', e.cognitiveModulesComplete, 'practicalSkillsSignedOff', e.practicalSkillsSignedOff, 'updatedAt', e.updatedAt), 'learning_status', '0173-v1'
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
      c.issueDate, c.issueDate, c.expiryDate, c.verificationCode, 'shareable', JSON_OBJECT('certificateNumber', c.certificateNumber), JSON_OBJECT('certificateNumber', c.certificateNumber, 'issueDate', c.issueDate, 'expiryDate', c.expiryDate, 'verificationCodePresent', c.verificationCode IS NOT NULL), 'credential_issued', '0173-v1'
    FROM certificates c
    ON DUPLICATE KEY UPDATE status = VALUES(status), issuedAt = VALUES(issuedAt), expiresAt = VALUES(expiresAt), evidenceReference = VALUES(evidenceReference), metadataJson = VALUES(metadataJson), sourceFactJson = VALUES(sourceFactJson), interpretation = VALUES(interpretation), interpretationVersion = VALUES(interpretationVersion), updatedAt = CURRENT_TIMESTAMP
  `);
  await conn.query(`
    INSERT INTO professionalEvidenceLedger
      (userId, sourceKey, evidenceType, title, programme, sourceSystem, sourceRecordType, sourceRecordId, status, evidenceStrength, verificationMethod, completedAt, visibility, metadataJson, sourceFactJson, interpretation, interpretationVersion)
    SELECT m.userId, CONCAT('user:', m.userId, ':micro-course:', m.id), 'learning',
      COALESCE(c.title, CONCAT('Fellowship micro-course #', m.microCourseId)), 'Paeds Resus Fellowship', 'fellowship', 'microCourseEnrollments', CAST(m.id AS CHAR),
      CASE WHEN m.enrollmentStatus = 'completed' THEN 'learning_complete' WHEN COALESCE(m.progressPercentage, 0) > 0 THEN 'learning_in_progress' ELSE 'enrolled_not_started' END,
      CASE WHEN m.enrollmentStatus = 'completed' THEN 'recorded' ELSE 'developing' END, NULL, m.completedAt, 'private', JSON_OBJECT('progressPercentage', m.progressPercentage, 'microCourseId', m.microCourseId), JSON_OBJECT('enrollmentStatus', m.enrollmentStatus, 'progressPercentage', m.progressPercentage, 'completedAt', m.completedAt), 'learning_status', '0173-v1'
    FROM microCourseEnrollments m LEFT JOIN microCourses c ON c.id = m.microCourseId
    ON DUPLICATE KEY UPDATE status = VALUES(status), completedAt = VALUES(completedAt), metadataJson = VALUES(metadataJson), sourceFactJson = VALUES(sourceFactJson), interpretation = VALUES(interpretation), interpretationVersion = VALUES(interpretationVersion), updatedAt = CURRENT_TIMESTAMP
  `);
  await conn.query(`
    INSERT INTO professionalEvidenceLedger
      (userId, sourceKey, evidenceType, title, programme, sourceSystem, sourceRecordType, sourceRecordId, status, evidenceStrength, verificationMethod, completedAt, expiresAt, evidenceReference, visibility, metadataJson, sourceFactJson, interpretation, interpretationVersion)
    SELECT e.userId, CONCAT('user:', e.userId, ':external-completion:', e.id, ':phase2'), 'credential',
      CONCAT(UPPER(e.courseProgramType), ' external Phase 2 evidence'), e.courseProgramType, 'external_completion', 'externalTrainingCompletions.phase2', CONCAT(e.id, ':phase2'),
      CASE WHEN e.revokedAt IS NOT NULL THEN 'revoked' WHEN e.phase2Completed = 1 THEN 'verified' ELSE 'recorded' END,
      CASE WHEN e.phase2Completed = 1 THEN 'verified_external' ELSE 'recorded' END, 'admin_review', e.phase2CompletedAt, NULL, e.evidenceReference, 'private',
      JSON_OBJECT('pathway', e.pathway, 'phase2Completed', e.phase2Completed, 'recordedByUserId', e.recordedByUserId),
      JSON_OBJECT('recordKey', e.recordKey, 'revokedAt', e.revokedAt, 'recordedAt', e.recordedAt), 'external_completion', '0173-v1'
    FROM externalTrainingCompletions e
    ON DUPLICATE KEY UPDATE status = VALUES(status), completedAt = VALUES(completedAt), evidenceReference = VALUES(evidenceReference), sourceFactJson = VALUES(sourceFactJson), interpretationVersion = VALUES(interpretationVersion), updatedAt = CURRENT_TIMESTAMP
  `);
  await conn.query(`
    INSERT INTO professionalEvidenceLedger
      (userId, sourceKey, evidenceType, title, programme, sourceSystem, sourceRecordType, sourceRecordId, status, evidenceStrength, verificationMethod, completedAt, visibility, metadataJson, sourceFactJson, interpretation, interpretationVersion)
    SELECT e.userId, CONCAT('user:', e.userId, ':ierp-enrollment:', e.id), 'pathway',
      CONCAT('IERP pathway — ', e.phaseStatus), 'IERP', 'ierp', 'ierpProgramEnrollments', CAST(e.id AS CHAR),
      e.lifecycleStatus, 'recorded', 'platform_verification', e.phase3CompletedAt, 'private',
      JSON_OBJECT('phaseStatus', e.phaseStatus, 'phase1Status', e.phase1Status, 'paymentStatus', e.paymentStatus),
      JSON_OBJECT('lifecycleStatus', e.lifecycleStatus, 'phaseStatus', e.phaseStatus, 'updatedAt', e.updatedAt), 'pathway_status', '0173-v1'
    FROM ierpProgramEnrollments e
    ON DUPLICATE KEY UPDATE status = VALUES(status), completedAt = VALUES(completedAt), metadataJson = VALUES(metadataJson), sourceFactJson = VALUES(sourceFactJson), interpretationVersion = VALUES(interpretationVersion), updatedAt = CURRENT_TIMESTAMP
  `);
  await conn.query(`
    INSERT INTO professionalEvidenceLedger
      (userId, sourceKey, evidenceType, title, programme, sourceSystem, sourceRecordType, sourceRecordId, status, evidenceStrength, verificationMethod, completedAt, visibility, metadataJson, sourceFactJson, interpretation, interpretationVersion)
    SELECT e.user_id, CONCAT('user:', e.user_id, ':nerp-enrollment:', e.id), 'pathway',
      CONCAT('NERP pathway — ', e.status), 'NERP ACLS', 'nerp', 'nerp_offer_enrollments', CAST(e.id AS CHAR),
      e.status, 'recorded', 'platform_verification', e.completed_at, 'private',
      JSON_OBJECT('offerKey', e.offer_key, 'amountPaidKes', e.amount_paid_kes, 'installmentCount', e.installment_count),
      JSON_OBJECT('status', e.status, 'offerKey', e.offer_key, 'updatedAt', e.updated_at), 'pathway_status', '0173-v1'
    FROM nerp_offer_enrollments e
    ON DUPLICATE KEY UPDATE status = VALUES(status), completedAt = VALUES(completedAt), metadataJson = VALUES(metadataJson), sourceFactJson = VALUES(sourceFactJson), interpretationVersion = VALUES(interpretationVersion), updatedAt = CURRENT_TIMESTAMP
  `);
  await conn.query(`
    INSERT INTO professionalEvidenceLedger
      (userId, sourceKey, evidenceType, title, programme, sourceSystem, sourceRecordType, sourceRecordId, status, evidenceStrength, verificationMethod, completedAt, visibility, metadataJson, sourceFactJson, interpretation, interpretationVersion)
    SELECT a.userId, CONCAT('user:', a.userId, ':cpd-attendance:', a.id), 'cpd',
      CONCAT('CPD attendance #', a.cpdEventId), 'CPD', 'cpd_portal', 'cpdAttendees', CAST(a.id AS CHAR),
      CASE WHEN a.attendanceStatus = 'attendance_verified' THEN 'verified_attendance' ELSE a.attendanceStatus END,
      CASE WHEN a.attendanceStatus = 'attendance_verified' THEN 'verified_attendance' ELSE 'recorded' END,
      CASE WHEN a.attendanceStatus = 'attendance_verified' THEN 'cpd_attendance' ELSE NULL END,
      a.attendanceVerifiedAt, 'private', JSON_OBJECT('cpdEventId', a.cpdEventId, 'attendanceStatus', a.attendanceStatus, 'attendanceType', a.attendanceType),
      JSON_OBJECT('submittedAt', a.submittedAt, 'attendanceVerifiedAt', a.attendanceVerifiedAt, 'userIdPresent', a.userId IS NOT NULL), 'cpd_attendance', '0173-v1'
    FROM cpdAttendees a
    WHERE a.userId IS NOT NULL
    ON DUPLICATE KEY UPDATE status = VALUES(status), evidenceStrength = VALUES(evidenceStrength), verificationMethod = VALUES(verificationMethod), completedAt = VALUES(completedAt), metadataJson = VALUES(metadataJson), sourceFactJson = VALUES(sourceFactJson), interpretationVersion = VALUES(interpretationVersion), updatedAt = CURRENT_TIMESTAMP
  `);
  console.log("[0169-sync] PASS: existing source records were projected idempotently; source tables were not modified.");
} finally {
  await conn.end();
}
