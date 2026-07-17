/**
 * Idempotent: migration 0066 — Cohort Phase Gates & Proof Upload (ACLS/BLS program).
 *
 * New columns on `institutionalStaffMembers`:
 *   - designation         ENUM — learner's clinical cadre (bsn_intern, coi_bsc, …)
 *   - phaseStatus         ENUM — which phase the learner is currently in (phase_1 … completed)
 *   - facilityLinkStatus  ENUM — self-link approval state (pending | linked | rejected)
 *   - totalPaidAmount     DECIMAL(10,2) — running M-Pesa installment total in KES
 *   - phase1ProofUrl      TEXT — URL of the learner's AHA elearning completion screenshot
 *   - phase1ProofApprovedAt TIMESTAMP — when coordinator approved the proof
 *
 * New column on `trainingAttendance`:
 *   - simulationRole             ENUM — team_member | team_leader
 *   - simulationCompetencyPassed BOOLEAN — whether the instructor marked competency
 *   - attendanceStatus           now includes 'waitlisted' in the ENUM
 *
 * New table:
 *   - individualInstallmentPayments — records each M-Pesa installment payment
 *     linked to an institutionalStaffMember row.
 *
 * Run: pnpm run db:apply-0066
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) as c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`,
    [table]
  );
  return rows[0].c > 0;
}

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) as c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  return rows[0].c > 0;
}

async function enumHasValue(conn, table, column, value) {
  const [rows] = await conn.query(
    `SELECT COLUMN_TYPE FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  if (rows.length === 0) return false;
  return rows[0].COLUMN_TYPE.includes(`'${value}'`);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0066] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0066] Running cohort phase gates migration…");

    // ── 1. institutionalStaffMembers.designation ──────────────────────────────
    if (await columnExists(conn, "institutionalStaffMembers", "designation")) {
      console.log("[0066]   ✓ institutionalStaffMembers.designation already exists — skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`institutionalStaffMembers\` ADD COLUMN \`designation\`
         ENUM('bsn_intern','coi_bsc','coi_diploma','moi','permanent_nurse','permanent_doctor','other')
         DEFAULT 'other' AFTER \`staffRole\``
      );
      console.log("[0066]   + Added institutionalStaffMembers.designation.");
    }

    // ── 2. institutionalStaffMembers.phaseStatus ──────────────────────────────
    if (await columnExists(conn, "institutionalStaffMembers", "phaseStatus")) {
      console.log("[0066]   ✓ institutionalStaffMembers.phaseStatus already exists — skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`institutionalStaffMembers\` ADD COLUMN \`phaseStatus\`
         ENUM('phase_1','phase_2','phase_3','completed')
         DEFAULT 'phase_1' AFTER \`designation\``
      );
      console.log("[0066]   + Added institutionalStaffMembers.phaseStatus.");
    }

    // ── 3. institutionalStaffMembers.facilityLinkStatus ───────────────────────
    if (await columnExists(conn, "institutionalStaffMembers", "facilityLinkStatus")) {
      console.log("[0066]   ✓ institutionalStaffMembers.facilityLinkStatus already exists — skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`institutionalStaffMembers\` ADD COLUMN \`facilityLinkStatus\`
         ENUM('pending','linked','rejected')
         DEFAULT 'pending' AFTER \`phaseStatus\``
      );
      console.log("[0066]   + Added institutionalStaffMembers.facilityLinkStatus.");
    }

    // ── 4. institutionalStaffMembers.totalPaidAmount ──────────────────────────
    if (await columnExists(conn, "institutionalStaffMembers", "totalPaidAmount")) {
      console.log("[0066]   ✓ institutionalStaffMembers.totalPaidAmount already exists — skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`institutionalStaffMembers\` ADD COLUMN \`totalPaidAmount\`
         DECIMAL(10,2) DEFAULT '0.00' AFTER \`facilityLinkStatus\``
      );
      console.log("[0066]   + Added institutionalStaffMembers.totalPaidAmount.");
    }

    // ── 5. institutionalStaffMembers.phase1ProofUrl ───────────────────────────
    if (await columnExists(conn, "institutionalStaffMembers", "phase1ProofUrl")) {
      console.log("[0066]   ✓ institutionalStaffMembers.phase1ProofUrl already exists — skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`institutionalStaffMembers\` ADD COLUMN \`phase1ProofUrl\`
         TEXT NULL AFTER \`totalPaidAmount\``
      );
      console.log("[0066]   + Added institutionalStaffMembers.phase1ProofUrl.");
    }

    // ── 6. institutionalStaffMembers.phase1ProofApprovedAt ────────────────────
    if (await columnExists(conn, "institutionalStaffMembers", "phase1ProofApprovedAt")) {
      console.log("[0066]   ✓ institutionalStaffMembers.phase1ProofApprovedAt already exists — skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`institutionalStaffMembers\` ADD COLUMN \`phase1ProofApprovedAt\`
         TIMESTAMP NULL AFTER \`phase1ProofUrl\``
      );
      console.log("[0066]   + Added institutionalStaffMembers.phase1ProofApprovedAt.");
    }

    // ── 7. trainingAttendance.simulationRole ──────────────────────────────────
    if (await columnExists(conn, "trainingAttendance", "simulationRole")) {
      console.log("[0066]   ✓ trainingAttendance.simulationRole already exists — skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`trainingAttendance\` ADD COLUMN \`simulationRole\`
         ENUM('team_member','team_leader') NULL AFTER \`attendanceStatus\``
      );
      console.log("[0066]   + Added trainingAttendance.simulationRole.");
    }

    // ── 8. trainingAttendance.simulationCompetencyPassed ─────────────────────
    if (await columnExists(conn, "trainingAttendance", "simulationCompetencyPassed")) {
      console.log("[0066]   ✓ trainingAttendance.simulationCompetencyPassed already exists — skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`trainingAttendance\` ADD COLUMN \`simulationCompetencyPassed\`
         BOOLEAN DEFAULT FALSE AFTER \`simulationRole\``
      );
      console.log("[0066]   + Added trainingAttendance.simulationCompetencyPassed.");
    }

    // ── 9. trainingAttendance.attendanceStatus — add 'waitlisted' to ENUM ────
    if (await enumHasValue(conn, "trainingAttendance", "attendanceStatus", "waitlisted")) {
      console.log("[0066]   ✓ trainingAttendance.attendanceStatus already has 'waitlisted' — skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`trainingAttendance\` MODIFY COLUMN \`attendanceStatus\`
         ENUM('registered','attended','absent','cancelled','waitlisted') DEFAULT 'registered'`
      );
      console.log("[0066]   + Extended trainingAttendance.attendanceStatus with 'waitlisted'.");
    }

    // ── 10. individualInstallmentPayments table ───────────────────────────────
    if (await tableExists(conn, "individualInstallmentPayments")) {
      console.log("[0066]   ✓ individualInstallmentPayments already exists — skipping.");
    } else {
      await conn.query(`
        CREATE TABLE \`individualInstallmentPayments\` (
          \`id\` INT AUTO_INCREMENT NOT NULL,
          \`staffMemberId\` INT NOT NULL,
          \`amount\` DECIMAL(10,2) NOT NULL,
          \`mpesaRef\` VARCHAR(64) NULL,
          \`paidAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT \`individualInstallmentPayments_id\` PRIMARY KEY(\`id\`),
          KEY \`individualInstallmentPayments_staffMemberId_idx\` (\`staffMemberId\`)
        )
      `);
      console.log("[0066]   + Created individualInstallmentPayments.");
    }

    console.log("[0066] Done. All cohort phase gate columns and tables are present.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0066] Fatal error:", err);
  process.exit(1);
});
