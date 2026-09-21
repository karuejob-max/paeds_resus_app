import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const connection = await createMysqlConnection(databaseUrl, mysql);
try {
  const [columns] = await connection.query(
    "SHOW COLUMNS FROM facility_departments LIKE 'parent_department_id'",
  );
  if (!Array.isArray(columns) || columns.length === 0) {
    await connection.query(
      "ALTER TABLE facility_departments ADD COLUMN parent_department_id INT NULL AFTER department_name",
    );
    console.log("[0161] Added facility_departments.parent_department_id");
  } else {
    console.log("[0161] facility_departments.parent_department_id already exists");
  }
  console.log("[0161] Canonical department hierarchy migration applied successfully.");
} finally {
  await connection.end();
}
