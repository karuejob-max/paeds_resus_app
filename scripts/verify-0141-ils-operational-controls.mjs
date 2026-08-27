/**
 * Read-only verifier for migration 0141.
 * Confirms the ILS operational spine exists before pilots are accepted.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0141 verify] DATABASE_URL is required.");
  process.exit(1);
}

async function columnExists(conn, tableName, columnName) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
    [tableName, columnName]
  );
  return Number(rows?.[0]?.c ?? 0) > 0;
}

async function tableExists(conn, tableName) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
    [tableName]
  );
  return Number(rows?.[0]?.c ?? 0) > 0;
}

async function enumIncludes(conn, tableName, columnName, value) {
  const [rows] = await conn.query(
    "SELECT COLUMN_TYPE AS columnType FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
    [tableName, columnName]
  );
  return String(rows?.[0]?.columnType ?? "").includes(`'${value}'`);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  const checks = [
    [
      "enrollments.activatedAt",
      () => columnExists(conn, "enrollments", "activatedAt"),
    ],
    [
      "enrollments.lastActivityAt",
      () => columnExists(conn, "enrollments", "lastActivityAt"),
    ],
    [
      "enrollments.cognitiveModulesCompletedAt",
      () => columnExists(conn, "enrollments", "cognitiveModulesCompletedAt"),
    ],
    [
      "institutionalTrainingOrders.orderStatus",
      () => columnExists(conn, "institutionalTrainingOrders", "orderStatus"),
    ],
    [
      "institutionalTrainingOrders.deliverySessionId",
      () =>
        columnExists(conn, "institutionalTrainingOrders", "deliverySessionId"),
    ],
    [
      "institutionalTrainingOrders.capacityConfirmed",
      () =>
        columnExists(conn, "institutionalTrainingOrders", "capacityConfirmed"),
    ],
    [
      "institutionalTrainingOrders.practicalDateConfirmed",
      () =>
        columnExists(
          conn,
          "institutionalTrainingOrders",
          "practicalDateConfirmed"
        ),
    ],
    [
      "institutionalTrainingOrders.paymentReceiptReference",
      () =>
        columnExists(
          conn,
          "institutionalTrainingOrders",
          "paymentReceiptReference"
        ),
    ],
    [
      "institutionalTrainingOrders.rosterConfirmed",
      () =>
        columnExists(conn, "institutionalTrainingOrders", "rosterConfirmed"),
    ],
    [
      "ilsReminderEvents.status includes sending",
      () => enumIncludes(conn, "ilsReminderEvents", "status", "sending"),
    ],
    [
      "institutionalTrainingOrderProviders.assignmentStatus",
      () =>
        columnExists(
          conn,
          "institutionalTrainingOrderProviders",
          "assignmentStatus"
        ),
    ],
    [
      "institutionalTrainingOrderProviders.replacedAt",
      () =>
        columnExists(conn, "institutionalTrainingOrderProviders", "replacedAt"),
    ],
    [
      "institutionLearningTargets.courseProgramType includes paeds_resus_ils",
      () =>
        enumIncludes(
          conn,
          "institutionLearningTargets",
          "courseProgramType",
          "paeds_resus_ils"
        ),
    ],
    [
      "ilsOperationalCases.slaDueAt",
      () => columnExists(conn, "ilsOperationalCases", "slaDueAt"),
    ],
    [
      "ilsOperationalCases.firstResponseAt",
      () => columnExists(conn, "ilsOperationalCases", "firstResponseAt"),
    ],
    [
      "ilsPracticalAssessments.checklistVersion",
      () => columnExists(conn, "ilsPracticalAssessments", "checklistVersion"),
    ],
    [
      "ilsPracticalAssessments.assessorCalibrationConfirmed",
      () =>
        columnExists(
          conn,
          "ilsPracticalAssessments",
          "assessorCalibrationConfirmed"
        ),
    ],
    [
      "ilsPracticalAssessments.secondAssessorUserId",
      () =>
        columnExists(conn, "ilsPracticalAssessments", "secondAssessorUserId"),
    ],
    [
      "ilsDeliverySessions table",
      () => tableExists(conn, "ilsDeliverySessions"),
    ],
    [
      "ilsPracticalAssessments table",
      () => tableExists(conn, "ilsPracticalAssessments"),
    ],
    ["ilsReminderEvents table", () => tableExists(conn, "ilsReminderEvents")],
    [
      "ilsOperationalCases table",
      () => tableExists(conn, "ilsOperationalCases"),
    ],
    ["ilsPilotCohorts table", () => tableExists(conn, "ilsPilotCohorts")],
    ["ilsPilotMetrics table", () => tableExists(conn, "ilsPilotMetrics")],
  ];

  try {
    let failed = 0;
    for (const [label, check] of checks) {
      const passed = await check();
      console.log(`[0141 verify] ${passed ? "PASS" : "FAIL"} — ${label}`);
      if (!passed) failed += 1;
    }
    if (failed > 0) {
      console.error(`[0141 verify] ${failed} check(s) failed.`);
      process.exitCode = 1;
      return;
    }
    console.log(
      `[0141 verify] All operational-schema checks passed; ${checks.length} checks; no write was performed.`
    );
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0141 verify] Fatal error:", error);
  process.exit(1);
});
