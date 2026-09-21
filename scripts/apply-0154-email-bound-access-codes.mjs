import mysql from "mysql2/promise";
import { resolveDbConfig } from "./db-connection-config.mjs";

const config = await resolveDbConfig();
const connection = await mysql.createConnection(config);
try {
  const [columns] = await connection.query("SHOW COLUMNS FROM globalEntitlements LIKE 'recipientEmailHash'");
  if (!columns.length) {
    await connection.query("ALTER TABLE globalEntitlements ADD COLUMN recipientEmailHash varchar(64) NULL AFTER accessCodePrefix");
    console.log("[0154] Added globalEntitlements.recipientEmailHash");
  } else {
    console.log("[0154] globalEntitlements.recipientEmailHash already exists");
  }
  console.log("[0154] Email-bound access-code migration applied successfully.");
} finally {
  await connection.end();
}

export {};
