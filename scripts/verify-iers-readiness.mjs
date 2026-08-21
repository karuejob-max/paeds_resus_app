/**
 * Verify the production IERS schema and essential operational columns.
 *
 * Run after applying migrations 0094–0099:
 *   pnpm run db:verify-iers
 *
 * The first IERS migrations use the repository's existing camelCase table
 * naming convention, while migrations 0097–0099 use snake_case names. The
 * verifier accepts both forms so it checks the deployed contract rather than
 * assuming one naming style.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function exists(conn, dbName, table, column = null) {
  const [rows] = await conn.query(
    column
      ? `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`
      : `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    column ? [dbName, table, column] : [dbName, table],
  );
  return Array.isArray(rows) && rows.length > 0;
}

export function firstAvailableName(availableNames, candidates) {
  return candidates.find((candidate) => availableNames.has(candidate)) ?? null;
}

async function resolveTable(conn, dbName, names) {
  for (const name of names) {
    if (await exists(conn, dbName, name)) return name;
  }
  return null;
}

export const REQUIRED_TABLES = [
  { key: "memberships", label: "provider memberships", names: ["institutionMemberships", "institution_memberships"] },
  { key: "activationEvents", label: "activation events", names: ["iersActivationEvents", "iers_activation_events"] },
  { key: "activationResponders", label: "activation responders", names: ["iersActivationResponders", "iers_activation_responders"] },
  { key: "activationTimeline", label: "activation timeline", names: ["iersActivationTimeline", "iers_activation_timeline"] },
  { key: "evidence", label: "evidence records", names: ["iers_evidence_records", "iersEvidenceRecords"] },
  { key: "actions", label: "action items", names: ["iers_action_items", "iersActionItems"] },
  { key: "drills", label: "drills", names: ["iers_drills", "iersDrills"] },
  { key: "drillParticipants", label: "drill participants", names: ["iers_drill_participants", "iersDrillParticipants"] },
  { key: "milestones", label: "implementation milestones", names: ["iers_implementation_milestones", "iersImplementationMilestones"] },
];

export const REQUIRED_COLUMNS = [
  { tableKey: "memberships", label: "provider memberships responsibility role", names: ["responsibilityRole", "responsibility_role"] },
  { tableKey: "memberships", label: "provider memberships status", names: ["membershipStatus", "membership_status"] },
  { tableKey: "activationEvents", label: "activation event status", names: ["status"] },
  { tableKey: "activationEvents", label: "activation event triggered time", names: ["triggeredAt", "triggered_at"] },
  { tableKey: "activationResponders", label: "activation responder notification status", names: ["notificationStatus", "notification_status"] },
  { tableKey: "activationTimeline", label: "activation timeline event type", names: ["eventType", "event_type"] },
  { tableKey: "evidence", label: "evidence criterion code", names: ["criterion_code", "criterionCode"] },
  { tableKey: "evidence", label: "evidence reviewer", names: ["reviewed_by_user_id", "reviewedByUserId"] },
  { tableKey: "actions", label: "action owner", names: ["owner_user_id", "ownerUserId"] },
  { tableKey: "actions", label: "action closure evidence", names: ["closure_evidence_id", "closureEvidenceId"] },
  { tableKey: "drills", label: "drill debrief note", names: ["debrief_note", "debriefNote"] },
  { tableKey: "milestones", label: "milestone evidence", names: ["evidence_id", "evidenceId"] },
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const dbName = new URL(databaseUrl).pathname.replace(/^\//, "");
  const conn = await createMysqlConnection(databaseUrl, mysql);
  let missing = 0;
  try {
    const resolvedTables = new Map();
    for (const requirement of REQUIRED_TABLES) {
      const actualName = await resolveTable(conn, dbName, requirement.names);
      resolvedTables.set(requirement.key, actualName);
      console.log(
        `${actualName ? "[ok]" : "[MISSING]"} table ${requirement.label}${actualName ? ` (${actualName})` : ` [expected ${requirement.names.join(" or ")}]`}`,
      );
      if (!actualName) missing += 1;
    }

    for (const requirement of REQUIRED_COLUMNS) {
      const table = resolvedTables.get(requirement.tableKey);
      let actualColumn = null;
      if (table) {
        for (const column of requirement.names) {
          if (await exists(conn, dbName, table, column)) {
            actualColumn = column;
            break;
          }
        }
      }
      console.log(
        `${actualColumn ? "[ok]" : "[MISSING]"} ${requirement.label}${actualColumn ? ` (${table}.${actualColumn})` : ` [expected ${requirement.names.join(" or ")}]`}`,
      );
      if (!actualColumn) missing += 1;
    }
  } finally {
    await conn.end();
  }
  if (missing) {
    console.error(`\nIERS verification FAILED — ${missing} missing object(s). Do not rerun migrations automatically; investigate the specific missing object(s).`);
    process.exit(1);
  }
  console.log("\nIERS verification PASSED — provider memberships, activation, evidence, action, drill, and implementation objects are present.");
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error?.message || error);
    process.exit(1);
  });
}
