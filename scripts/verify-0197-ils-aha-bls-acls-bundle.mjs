import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const connection = await createMysqlConnection(databaseUrl, mysql);
try {
  const [columns] = await connection.query(
    `SELECT COLUMN_TYPE AS columnType FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1`,
    ["ilsCredentialRequests", "credentialType"]
  );
  if (!Array.isArray(columns) || columns.length !== 1) {
    throw new Error("ilsCredentialRequests.credentialType does not exist");
  }

  const columnType = String(columns[0].columnType ?? "");
  const values = [...columnType.matchAll(/'((?:''|[^'])*)'/g)].map(match =>
    match[1].replaceAll("''", "'")
  );
  const missing = ["bls", "acls", "bls_acls"].filter(
    value => !values.includes(value)
  );
  if (missing.length) {
    throw new Error(
      `credentialType enum is missing expected values ${missing.join(", ")}: ${columnType}`
    );
  }

  console.log(
    "[0197] OK — legacy BLS/ACLS and combined BLS+ACLS request values are present."
  );
  console.log(JSON.stringify({ credentialType: columnType, values }, null, 2));
} finally {
  await connection.end();
}
