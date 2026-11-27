import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const connection = await createMysqlConnection(databaseUrl, mysql);

function parseEnumValues(columnType) {
  if (!/^enum\(/i.test(columnType)) {
    throw new Error(
      `Expected ilsCredentialRequests.credentialType to be ENUM, got: ${columnType}`
    );
  }
  return [...columnType.matchAll(/'((?:''|[^'])*)'/g)].map(match =>
    match[1].replaceAll("''", "'")
  );
}

function quoteIdentifier(value) {
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    throw new Error(`Unexpected database identifier: ${value}`);
  }
  return `\`${value}\``;
}

try {
  const [columns] = await connection.query(
    `SELECT COLUMN_TYPE AS columnType, IS_NULLABLE AS isNullable, COLUMN_DEFAULT AS columnDefault, COLUMN_COMMENT AS columnComment, CHARACTER_SET_NAME AS characterSetName, COLLATION_NAME AS collationName FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1`,
    ["ilsCredentialRequests", "credentialType"]
  );
  if (!Array.isArray(columns) || columns.length !== 1) {
    throw new Error("ilsCredentialRequests.credentialType does not exist");
  }

  const column = columns[0];
  const columnType = String(column.columnType ?? "");
  const enumValues = parseEnumValues(columnType);
  if (!enumValues.includes("bls") || !enumValues.includes("acls")) {
    throw new Error(
      `Existing credentialType enum is missing a legacy value: ${columnType}`
    );
  }

  if (!enumValues.includes("bls_acls")) {
    enumValues.push("bls_acls");
    const enumDefinition = `ENUM(${enumValues
      .map(value => `'${value.replaceAll("'", "''")}'`)
      .join(", ")})`;
    const characterSet = column.characterSetName
      ? ` CHARACTER SET ${quoteIdentifier(String(column.characterSetName))}`
      : "";
    const collation = column.collationName
      ? ` COLLATE ${quoteIdentifier(String(column.collationName))}`
      : "";
    const nullable = column.isNullable === "YES" ? " NULL" : " NOT NULL";
    const defaultValue =
      column.columnDefault === null || column.columnDefault === undefined
        ? ""
        : ` DEFAULT ${connection.escape(column.columnDefault)}`;
    const comment = column.columnComment
      ? ` COMMENT ${connection.escape(column.columnComment)}`
      : "";

    await connection.query(
      `ALTER TABLE ${quoteIdentifier("ilsCredentialRequests")} MODIFY COLUMN ${quoteIdentifier("credentialType")} ${enumDefinition}${characterSet}${collation}${nullable}${defaultValue}${comment}`
    );
  }

  console.log(
    "[0197] ILSP AHA BLS+ACLS credential request type is ready; legacy values are preserved."
  );
} finally {
  await connection.end();
}
