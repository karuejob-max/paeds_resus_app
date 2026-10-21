import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(
  await getConnectionConfig(process.env.DATABASE_URL)
);
try {
  const [columns] = await connection.query(
    "SHOW COLUMNS FROM institutionalTrainingOrders LIKE 'departmentId'"
  );
  if (!columns.length) {
    await connection.query(
      "ALTER TABLE institutionalTrainingOrders ADD COLUMN departmentId INT NULL AFTER programType"
    );
  }
  const [indexes] = await connection.query(
    "SHOW INDEX FROM institutionalTrainingOrders WHERE Key_name = 'ils_orders_department_idx'"
  );
  if (!indexes.length) {
    await connection.query(
      "CREATE INDEX ils_orders_department_idx ON institutionalTrainingOrders (institutionalAccountId, departmentId, createdAt)"
    );
  }
  console.log("[0184] ILSP department scope is ready.");
} finally {
  await connection.end();
}
