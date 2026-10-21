import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(
  await getConnectionConfig(process.env.DATABASE_URL),
);
try {
  const [columns] = await connection.query(
    "SHOW COLUMNS FROM globalEntitlements LIKE 'targetDepartmentId'",
  );
  if (!columns.length) {
    await connection.query(
      "ALTER TABLE globalEntitlements ADD COLUMN targetDepartmentId INT NULL AFTER targetInstitutionalAccountId",
    );
  }
  const [indexes] = await connection.query(
    "SHOW INDEX FROM globalEntitlements WHERE Key_name = 'global_entitlements_target_department_idx'",
  );
  if (!indexes.length) {
    await connection.query(
      "CREATE INDEX global_entitlements_target_department_idx ON globalEntitlements (targetInstitutionalAccountId, targetDepartmentId, programType, status)",
    );
  }
  console.log("[0185] ILSP access-code department scope is ready.");
} finally {
  await connection.end();
}
