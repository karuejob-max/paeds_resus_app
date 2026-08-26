import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    [table]
  );
  return rows.length > 0;
}

async function addColumn(conn, table, column, definition) {
  if (!(await columnExists(conn, table, column))) {
    console.log(`[0126] Adding ${table}.${column}...`);
    await conn.query(
      `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`
    );
  } else {
    console.log(`[0126]   ✓ ${table}.${column} already exists.`);
  }
}

async function createTable(conn, table, ddl) {
  if (!(await tableExists(conn, table))) {
    console.log(`[0126] Creating ${table}...`);
    await conn.query(ddl);
  } else {
    console.log(`[0126]   ✓ ${table} already exists.`);
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0126] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0126] Applying institutional learning operations schema...");

    // Existing CPD rows remain valid; new classifications are additive.
    await conn.query(
      "ALTER TABLE `cpdEvents` MODIFY COLUMN `eventType` ENUM('cne','cme','cpd_general','grand_rounds','journal_club','workshop','m_and_m','other_cadre') DEFAULT 'cpd_general' NOT NULL"
    );
    await addColumn(
      conn,
      "cpdEvents",
      "audienceScope",
      "ENUM('facility_wide','nursing_wide','clinical','m_and_m','other_cadre') DEFAULT 'facility_wide' NOT NULL AFTER `eventType`"
    );
    await addColumn(
      conn,
      "cpdEvents",
      "audienceLabel",
      "VARCHAR(128) NULL AFTER `audienceScope`"
    );
    await addColumn(
      conn,
      "cpdEvents",
      "facilityDepartmentId",
      "INT NULL AFTER `audienceLabel`"
    );
    await addColumn(
      conn,
      "cpdEvents",
      "eventDateAt",
      "DATE NULL AFTER `facilityDepartmentId`"
    );

    await createTable(
      conn,
      "cpdEventCoPresenters",
      `CREATE TABLE \`cpdEventCoPresenters\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`cpdEventId\` INT NOT NULL,
        \`institutionalAccountId\` INT NOT NULL,
        \`userId\` INT NULL,
        \`fullName\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(320) NULL,
        \`cadre\` VARCHAR(128) NULL,
        \`department\` VARCHAR(128) NULL,
        \`addedByUserId\` INT NOT NULL,
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`cpd_co_presenters_event_idx\` (\`cpdEventId\`),
        INDEX \`cpd_co_presenters_institution_idx\` (\`institutionalAccountId\`),
        INDEX \`cpd_co_presenters_userIdx\` (\`userId\`)
      )`
    );

    await createTable(
      conn,
      "institutionEducationCoordinators",
      `CREATE TABLE \`institutionEducationCoordinators\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`institutionalAccountId\` INT NOT NULL,
        \`departmentId\` INT NOT NULL,
        \`userId\` INT NOT NULL,
        \`assignmentStatus\` ENUM('active','ended') NOT NULL DEFAULT 'active',
        \`assignedByUserId\` INT NOT NULL,
        \`assignedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`endedAt\` TIMESTAMP NULL,
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY \`institution_education_coord_inst_dept_user_uq\` (\`institutionalAccountId\`, \`departmentId\`, \`userId\`),
        INDEX \`institution_education_coord_active_idx\` (\`institutionalAccountId\`, \`departmentId\`, \`assignmentStatus\`)
      )`
    );

    await createTable(
      conn,
      "institutionLearningTargets",
      `CREATE TABLE \`institutionLearningTargets\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`institutionalAccountId\` INT NOT NULL,
        \`targetScope\` ENUM('facility','department','individual') NOT NULL,
        \`departmentId\` INT NULL,
        \`userId\` INT NULL,
        \`metricKey\` ENUM('cpd_sessions','cpd_attendance_rate','cne_sessions','clinical_cpd_sessions','m_and_m_sessions','life_support_completed','course_phase_completion') NOT NULL,
        \`periodType\` ENUM('monthly','quarterly','annual') NOT NULL,
        \`periodStart\` DATE NOT NULL,
        \`periodEnd\` DATE NOT NULL,
        \`targetValue\` DECIMAL(10,2) NOT NULL,
        \`courseProgramType\` ENUM('bls','acls','pals','nrp','heartsaver','instructor') NULL,
        \`coursePhase\` ENUM('cognitive','phase_2','phase_3','completed') NULL,
        \`status\` ENUM('active','archived') NOT NULL DEFAULT 'active',
        \`createdByUserId\` INT NOT NULL,
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`institution_learning_targets_inst_period_idx\` (\`institutionalAccountId\`, \`periodStart\`, \`periodEnd\`, \`status\`),
        INDEX \`institution_learning_targets_departmentIdx\` (\`institutionalAccountId\`, \`departmentId\`, \`status\`),
        INDEX \`institution_learning_targets_userIdx\` (\`institutionalAccountId\`, \`userId\`, \`status\`)
      )`
    );

    console.log("[0126] Institutional learning operations schema ready.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0126] Migration failed:", error);
  process.exit(1);
});
