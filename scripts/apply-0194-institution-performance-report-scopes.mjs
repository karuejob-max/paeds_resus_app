import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const conn = await createMysqlConnection(url, mysql);

async function hasColumn(name) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'institutionalPerformanceReports' AND column_name = ? LIMIT 1`,
    [name],
  );
  return rows.length > 0;
}

async function hasIndex(name) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'institutionalPerformanceReports' AND index_name = ? LIMIT 1`,
    [name],
  );
  return rows.length > 0;
}

try {
  if (!(await hasColumn("scopeKey"))) {
    await conn.query(`ALTER TABLE institutionalPerformanceReports ADD COLUMN scopeKey VARCHAR(64) NOT NULL DEFAULT 'institution' AFTER institutionalAccountId`);
  }
  if (!(await hasColumn("scopeDepartmentId"))) {
    await conn.query(`ALTER TABLE institutionalPerformanceReports ADD COLUMN scopeDepartmentId INT NULL AFTER scopeKey`);
  }
  if (await hasIndex("institutional_performance_reports_period_uq")) {
    await conn.query(`ALTER TABLE institutionalPerformanceReports DROP INDEX institutional_performance_reports_period_uq`);
  }
  if (!(await hasIndex("institutional_performance_reports_scope_period_uq"))) {
    await conn.query(`ALTER TABLE institutionalPerformanceReports ADD UNIQUE KEY institutional_performance_reports_scope_period_uq (institutionalAccountId, scopeKey, periodType, periodStart)`);
  }
  console.log("[0194] Institutional performance report scopes are ready.");
} finally {
  await conn.end();
}
