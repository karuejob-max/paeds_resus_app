/**
 * Migration 0141 — ILS end-to-end operational controls.
 * Reservation: migration-reserved-0141
 *
 * Additive and idempotent. Separates delivery capacity, practical evidence,
 * reminders, support cases, and pilot governance from IERS readiness and CPD
 * records. No clinical pass standard is invented here; clinical evidence is
 * stored for an approved checklist and assessor workflow.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0141] DATABASE_URL is required.");
  process.exit(1);
}

async function tableExists(conn, tableName) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
    [tableName]
  );
  return Number(rows?.[0]?.c ?? 0) > 0;
}

async function columnExists(conn, tableName, columnName) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
    [tableName, columnName]
  );
  return Number(rows?.[0]?.c ?? 0) > 0;
}

async function addColumnIfMissing(conn, tableName, columnName, definition) {
  if (!(await columnExists(conn, tableName, columnName))) {
    await conn.query(
      `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`
    );
  }
}

async function createOperationalTables(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`ilsDeliverySessions\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`institutionalAccountId\` INT NOT NULL,
      \`orderId\` INT NULL,
      \`sessionStatus\` ENUM('proposed','confirmed','in_progress','completed','cancelled') NOT NULL DEFAULT 'proposed',
      \`scheduledDate\` DATETIME NOT NULL,
      \`endDate\` DATETIME NULL,
      \`startTime\` VARCHAR(10) NULL,
      \`endTime\` VARCHAR(10) NULL,
      \`location\` VARCHAR(255) NULL,
      \`instructorId\` INT NULL,
      \`instructorName\` VARCHAR(255) NULL,
      \`maxCapacity\` INT NOT NULL,
      \`reservedCount\` INT NOT NULL DEFAULT 0,
      \`venueConfirmed\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`equipmentConfirmed\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`instructorConfirmed\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`practicalDateConfirmed\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`readinessNotes\` TEXT NULL,
      \`confirmedAt\` DATETIME NULL,
      \`confirmedByUserId\` INT NULL,
      \`createdByUserId\` INT NOT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`ils_delivery_sessions_institution_status_idx\` (\`institutionalAccountId\`, \`sessionStatus\`),
      KEY \`ils_delivery_sessions_scheduled_date_idx\` (\`scheduledDate\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`ilsPracticalAssessments\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`enrollmentId\` INT NOT NULL,
      \`deliverySessionId\` INT NOT NULL,
      \`assessorUserId\` INT NOT NULL,
      \`checklistVersion\` VARCHAR(64) NOT NULL DEFAULT 'ils-v1',
      \`assessorCalibrationConfirmed\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`secondAssessorUserId\` INT NULL,
      \`assessedAt\` DATETIME NULL,
      \`result\` ENUM('pending','pass','remediation_required','fail','no_show','cancelled') NOT NULL DEFAULT 'pending',
      \`score\` INT NULL,
      \`evidenceJson\` JSON NULL,
      \`remediationDueAt\` DATETIME NULL,
      \`remediationCompletedAt\` DATETIME NULL,
      \`notes\` TEXT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`ils_practical_assessments_enrollment_idx\` (\`enrollmentId\`),
      KEY \`ils_practical_assessments_session_result_idx\` (\`deliverySessionId\`, \`result\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`ilsReminderEvents\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`enrollmentId\` INT NULL,
      \`orderId\` INT NULL,
      \`userId\` INT NOT NULL,
      \`reminderType\` ENUM('activation','payment','practical','remediation','credentialing') NOT NULL,
      \`channel\` ENUM('email','sms','in_app') NOT NULL DEFAULT 'email',
      \`dueAt\` DATETIME NOT NULL,
      \`sentAt\` DATETIME NULL,
      \`status\` ENUM('queued','sending','sent','failed','cancelled') NOT NULL DEFAULT 'queued',
      \`errorMessage\` TEXT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`ils_reminder_events_dedup_idx\` (\`enrollmentId\`, \`orderId\`, \`userId\`, \`reminderType\`, \`channel\`),
      KEY \`ils_reminder_events_due_status_idx\` (\`dueAt\`, \`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`ilsOperationalCases\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`institutionalAccountId\` INT NULL,
      \`orderId\` INT NULL,
      \`enrollmentId\` INT NULL,
      \`category\` ENUM('payment','roster','access','delivery','assessment','certificate','aha_credentialing','support') NOT NULL,
      \`status\` ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
      \`priority\` ENUM('low','normal','high','critical') NOT NULL DEFAULT 'normal',
      \`summary\` VARCHAR(255) NOT NULL,
      \`details\` TEXT NULL,
      \`ownerUserId\` INT NULL,
      \`slaDueAt\` DATETIME NULL,
      \`firstResponseAt\` DATETIME NULL,
      \`resolutionNotes\` TEXT NULL,
      \`resolvedAt\` DATETIME NULL,
      \`createdByUserId\` INT NOT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`ils_operational_cases_status_priority_idx\` (\`status\`, \`priority\`),
      KEY \`ils_operational_cases_institution_idx\` (\`institutionalAccountId\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`ilsPilotCohorts\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`institutionalAccountId\` INT NOT NULL,
      \`segment\` ENUM('training_provider','faith_based_hospital') NOT NULL,
      \`name\` VARCHAR(255) NOT NULL,
      \`targetProviderCount\` INT NOT NULL,
      \`minimumProviderCount\` INT NOT NULL DEFAULT 1,
      \`status\` ENUM('planned','active','completed','paused','cancelled') NOT NULL DEFAULT 'planned',
      \`targetStartDate\` DATETIME NULL,
      \`clinicalOwnerUserId\` INT NULL,
      \`operationalOwnerUserId\` INT NULL,
      \`coordinatorUserId\` INT NULL,
      \`venueConfirmed\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`equipmentConfirmed\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`practicalDateConfirmed\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`claimsAcknowledged\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`successReviewAt\` DATETIME NULL,
      \`notes\` TEXT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`ils_pilot_cohorts_institution_status_idx\` (\`institutionalAccountId\`, \`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`ilsPilotMetrics\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`pilotCohortId\` INT NOT NULL,
      \`orderId\` INT NULL,
      \`measuredAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`paymentToAccessSuccessPercent\` DECIMAL(5,2) NOT NULL,
      \`activationWithin7dPercent\` DECIMAL(5,2) NOT NULL,
      \`cognitiveWithin30dPercent\` DECIMAL(5,2) NOT NULL,
      \`practicalOpportunityWithin14dPercent\` DECIMAL(5,2) NOT NULL,
      \`practicalPassPercent\` DECIMAL(5,2) NOT NULL,
      \`supportMinutesPerProvider\` INT NULL,
      \`costPerProviderKes\` INT NULL,
      \`marginPerProviderKes\` INT NULL,
      \`coordinatorSatisfactionScore\` INT NULL,
      \`notes\` TEXT NULL,
      \`recordedByUserId\` INT NOT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`ils_pilot_metrics_pilot_date_idx\` (\`pilotCohortId\`, \`measuredAt\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0141] Applying ILS operational controls...");
    // Create the operational tables before altering their columns. This keeps
    // the migration safe when 0141 is the first ILS operational schema change
    // present in a production database.
    await createOperationalTables(conn);

    await addColumnIfMissing(
      conn,
      "enrollments",
      "activatedAt",
      "DATETIME NULL"
    );
    await addColumnIfMissing(
      conn,
      "enrollments",
      "lastActivityAt",
      "DATETIME NULL"
    );
    await addColumnIfMissing(
      conn,
      "enrollments",
      "cognitiveModulesCompletedAt",
      "DATETIME NULL"
    );
    await addColumnIfMissing(
      conn,
      "ilsPracticalAssessments",
      "checklistVersion",
      "VARCHAR(64) NOT NULL DEFAULT 'ils-v1'"
    );
    await addColumnIfMissing(
      conn,
      "ilsPracticalAssessments",
      "assessorCalibrationConfirmed",
      "BOOLEAN NOT NULL DEFAULT FALSE"
    );
    await addColumnIfMissing(
      conn,
      "ilsPracticalAssessments",
      "secondAssessorUserId",
      "INT NULL"
    );

    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrders",
      "orderStatus",
      "ENUM('draft','ready_for_payment','payment_pending','paid','in_delivery','completed','blocked','cancelled') NOT NULL DEFAULT 'draft'"
    );
    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrders",
      "coordinatorUserId",
      "INT NULL"
    );
    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrders",
      "deliverySessionId",
      "INT NULL"
    );
    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrders",
      "capacityConfirmed",
      "BOOLEAN NOT NULL DEFAULT FALSE"
    );
    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrders",
      "instructorConfirmed",
      "BOOLEAN NOT NULL DEFAULT FALSE"
    );
    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrders",
      "venueConfirmed",
      "BOOLEAN NOT NULL DEFAULT FALSE"
    );
    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrders",
      "equipmentConfirmed",
      "BOOLEAN NOT NULL DEFAULT FALSE"
    );
    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrders",
      "practicalDateConfirmed",
      "BOOLEAN NOT NULL DEFAULT FALSE"
    );
    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrders",
      "claimsAcknowledged",
      "BOOLEAN NOT NULL DEFAULT FALSE"
    );
    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrders",
      "rosterConfirmed",
      "BOOLEAN NOT NULL DEFAULT FALSE"
    );
    if (await tableExists(conn, "ilsReminderEvents")) {
      await conn.query(
        "ALTER TABLE `ilsReminderEvents` MODIFY COLUMN `status` ENUM('queued','sending','sent','failed','cancelled') NOT NULL DEFAULT 'queued'"
      );
    }
    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrders",
      "readinessConfirmedAt",
      "DATETIME NULL"
    );
    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrders",
      "readinessConfirmedByUserId",
      "INT NULL"
    );
    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrders",
      "blockedReason",
      "TEXT NULL"
    );
    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrders",
      "paymentConfirmedAt",
      "DATETIME NULL"
    );
    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrders",
      "paymentReceiptReference",
      "VARCHAR(128) NULL"
    );
    await addColumnIfMissing(
      conn,
      "ilsOperationalCases",
      "slaDueAt",
      "DATETIME NULL"
    );
    await addColumnIfMissing(
      conn,
      "ilsOperationalCases",
      "firstResponseAt",
      "DATETIME NULL"
    );
    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrderProviders",
      "assignmentStatus",
      "ENUM('active','replaced','removed') NOT NULL DEFAULT 'active'"
    );
    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrderProviders",
      "replacedAt",
      "DATETIME NULL"
    );
    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrderProviders",
      "replacedByUserId",
      "INT NULL"
    );
    await addColumnIfMissing(
      conn,
      "institutionalTrainingOrderProviders",
      "replacementReason",
      "VARCHAR(255) NULL"
    );

    if (
      (await tableExists(conn, "institutionLearningTargets")) &&
      (await columnExists(
        conn,
        "institutionLearningTargets",
        "courseProgramType"
      ))
    ) {
      await conn.query(
        "ALTER TABLE `institutionLearningTargets` MODIFY COLUMN `courseProgramType` ENUM('bls','acls','pals','nrp','heartsaver','instructor','paeds_resus_ils') NULL"
      );
      console.log(
        "[0141] institutionLearningTargets.courseProgramType includes paeds_resus_ils."
      );
    }

    console.log("[0141] ILS operational controls ready.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0141] Fatal error:", error);
  process.exit(1);
});
