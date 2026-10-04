import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const db = await createMysqlConnection(databaseUrl, mysql);
try {
  console.log("[0173] Preparing professional evidence integrity schema...");
  await db.query(`CREATE TABLE IF NOT EXISTS professionalEvidenceReconciliationRuns (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    runKey VARCHAR(96) NOT NULL UNIQUE,
    triggeredByUserId INT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'completed',
    summaryJson TEXT NOT NULL,
    startedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completedAt TIMESTAMP NULL,
    INDEX professional_evidence_reconciliation_status_idx (status, completedAt)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await db.query(`CREATE TABLE IF NOT EXISTS professionalEvidenceConflicts (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    conflictKey VARCHAR(255) NOT NULL UNIQUE,
    userId INT NOT NULL,
    evidenceType VARCHAR(48) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    state VARCHAR(32) NOT NULL DEFAULT 'open',
    reason TEXT NOT NULL,
    sourceRowsJson TEXT NOT NULL,
    resolvedByUserId INT NULL,
    resolvedAt TIMESTAMP NULL,
    resolutionNote TEXT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX professional_evidence_conflict_user_state_idx (userId, state),
    INDEX professional_evidence_conflict_type_idx (evidenceType, state)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  console.log("[0173] Professional evidence integrity schema is ready.");
} finally { await db.end(); }
