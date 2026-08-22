/**
 * Preview or remove labelled IERS smoke-test records for one institution.
 *
 * Safe default: dry-run. Applying requires both:
 *   --apply --confirm DELETE_SMOKE_TEST_RECORDS
 *
 * The command never deletes an institution, provider, membership, product role,
 * subscription, entitlement, CPD record, or any department whose name does not
 * begin with the exact smoke-test prefix.
 *
 * Targeting accepts either:
 *   --institution-id <id> --institution-name "<exact name>"
 * or, for phone-only operators who do not know the ID:
 *   --institution-name "<exact unique name>"
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (arg === "--apply") {
    args.set("apply", "true");
  } else if (arg.startsWith("--") && process.argv[index + 1] && !process.argv[index + 1].startsWith("--")) {
    args.set(arg.slice(2), process.argv[++index]);
  }
}

if (!databaseUrl) {
  console.error("[smoke-cleanup] DATABASE_URL is required.");
  process.exit(1);
}

const institutionIdArg = String(args.get("institution-id") || "").trim();
const institutionId = institutionIdArg ? Number(institutionIdArg) : null;
const expectedInstitutionName = String(args.get("institution-name") || "").trim();
const confirmation = String(args.get("confirm") || "").trim();
const prefix = "SMOKE TEST - ";

if (institutionIdArg && (!Number.isInteger(institutionId) || institutionId <= 0)) {
  console.error("[smoke-cleanup] --institution-id must be a positive integer when supplied.");
  process.exit(1);
}
if (!expectedInstitutionName) {
  console.error("[smoke-cleanup] Supply the exact --institution-name as a safety check.");
  process.exit(1);
}
if (args.get("apply") === "true" && confirmation !== "DELETE_SMOKE_TEST_RECORDS") {
  console.error("[smoke-cleanup] Refusing to apply without --confirm DELETE_SMOKE_TEST_RECORDS.");
  process.exit(1);
}

const conn = await createMysqlConnection(databaseUrl, mysql);
try {
  const [institutions] = institutionId
    ? await conn.query(
      "SELECT id, companyName FROM institutionalAccounts WHERE id = ? LIMIT 1",
      [institutionId],
    )
    : await conn.query(
      "SELECT id, companyName FROM institutionalAccounts WHERE companyName = ? LIMIT 2",
      [expectedInstitutionName],
    );

  if (institutions.length !== 1) {
    console.error(
      institutionId
        ? "[smoke-cleanup] Institution not found. No records changed."
        : "[smoke-cleanup] Exact institution name was not unique. Supply --institution-id as a second safety check. No records changed.",
    );
    process.exitCode = 1;
  } else {
    const institution = institutions[0];
    if (institution.companyName !== expectedInstitutionName) {
      console.error("[smoke-cleanup] Institution name did not match exactly. No records changed.");
      process.exitCode = 1;
    } else {
      const resolvedInstitutionId = Number(institution.id);
      const [departments] = await conn.query(
        `SELECT id, department_name AS departmentName
         FROM facility_departments
         WHERE institution_id = ? AND department_name LIKE ?
         ORDER BY id`,
        [resolvedInstitutionId, `${prefix}%`],
      );
      const departmentIds = departments.map((department) => department.id);
      const summary = {
        institutionId: resolvedInstitutionId,
        institutionName: institution.companyName,
        departmentIds,
        departmentNames: departments.map((department) => department.departmentName),
        ercoAssignments: 0,
        ercoEvents: 0,
        weeklyRotations: 0,
        shiftRosters: 0,
        readinessEvidence: 0,
      };

      if (departmentIds.length > 0) {
        const [erco] = await conn.query(
          "SELECT COUNT(*) AS count FROM institution_department_response_coordinators WHERE institution_id = ? AND department_id IN (?)",
          [resolvedInstitutionId, departmentIds],
        );
        const [events] = await conn.query(
          "SELECT COUNT(*) AS count FROM institution_department_response_coordinator_events WHERE institution_id = ? AND department_id IN (?)",
          [resolvedInstitutionId, departmentIds],
        );
        const [rotations] = await conn.query(
          "SELECT COUNT(*) AS count FROM ertl_weekly_rotations WHERE institution_id = ? AND department_id IN (?)",
          [resolvedInstitutionId, departmentIds],
        );
        const [rosters] = await conn.query(
          "SELECT id FROM shift_utl_rosters WHERE institution_id = ? AND department_id IN (?)",
          [resolvedInstitutionId, departmentIds],
        );
        const rosterIds = rosters.map((roster) => roster.id);
        let evidenceCount = 0;
        if (rosterIds.length > 0) {
          const [evidence] = await conn.query(
            `SELECT COUNT(*) AS count
             FROM iers_evidence_records
             WHERE institution_id = ? AND criterion_code = 'WF-02'
               AND title IN (?)`,
            [resolvedInstitutionId, rosterIds.map((id) => `Shift readiness sign-off #${id}`)],
          );
          evidenceCount = Number(evidence[0]?.count || 0);
        }
        summary.ercoAssignments = Number(erco[0]?.count || 0);
        summary.ercoEvents = Number(events[0]?.count || 0);
        summary.weeklyRotations = Number(rotations[0]?.count || 0);
        summary.shiftRosters = rosterIds.length;
        summary.readinessEvidence = evidenceCount;
      }

      console.log(JSON.stringify({ mode: args.get("apply") === "true" ? "apply" : "dry-run", summary }, null, 2));

      if (args.get("apply") !== "true" || departmentIds.length === 0) {
        if (departmentIds.length === 0) console.log("[smoke-cleanup] No labelled smoke-test departments found. No records changed.");
        else console.log("[smoke-cleanup] Dry-run only. Re-run with both --apply and the exact confirmation phrase to delete these labelled records.");
      } else {
        const [rosters] = await conn.query(
          "SELECT id FROM shift_utl_rosters WHERE institution_id = ? AND department_id IN (?)",
          [resolvedInstitutionId, departmentIds],
        );
        const rosterIds = rosters.map((roster) => roster.id);
        if (rosterIds.length > 0) {
          await conn.query(
            `DELETE FROM iers_evidence_records
             WHERE institution_id = ? AND criterion_code = 'WF-02' AND title IN (?)`,
            [resolvedInstitutionId, rosterIds.map((id) => `Shift readiness sign-off #${id}`)],
          );
        }
        await conn.query(
          "DELETE FROM shift_utl_rosters WHERE institution_id = ? AND department_id IN (?)",
          [resolvedInstitutionId, departmentIds],
        );
        await conn.query(
          "DELETE FROM ertl_weekly_rotations WHERE institution_id = ? AND department_id IN (?)",
          [resolvedInstitutionId, departmentIds],
        );
        await conn.query(
          "DELETE FROM institution_department_response_coordinator_events WHERE institution_id = ? AND department_id IN (?)",
          [resolvedInstitutionId, departmentIds],
        );
        await conn.query(
          "DELETE FROM institution_department_response_coordinators WHERE institution_id = ? AND department_id IN (?)",
          [resolvedInstitutionId, departmentIds],
        );
        await conn.query(
          "DELETE FROM facility_departments WHERE institution_id = ? AND id IN (?) AND department_name LIKE ?",
          [resolvedInstitutionId, departmentIds, `${prefix}%`],
        );
        console.log("[smoke-cleanup] Applied labelled-record cleanup. Institution, users, memberships, roles, subscriptions, entitlements, and CPD data were not touched.");
      }
    }
  }
} finally {
  await conn.end();
}
