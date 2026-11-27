import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

// Official MFL codes are numeric (for example 12345). The old sample seed used placeholders like "CHM-001".
const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  const [[totals]] = await connection.query(`
    SELECT COUNT(*) AS total,
           SUM(code REGEXP '^[0-9]{4,6}$') AS officialCodes,
           SUM(code IS NULL OR code = '') AS noCode,
           SUM(code IS NOT NULL AND code <> '' AND code NOT REGEXP '^[0-9]{4,6}$') AS placeholderCodes
    FROM kmhflFacilities
  `);
  console.log("[registry] kmhflFacilities:", totals);
  const [consolata] = await connection.query(
    "SELECT id, name, code, county, facilityType FROM kmhflFacilities WHERE LOWER(name) LIKE '%consolata%'",
  );
  console.log("[registry] Rows matching 'consolata':");
  console.table(consolata);
  const [linked] = await connection.query(`
    SELECT a.id AS institutionId, a.companyName, f.name AS registryName, f.code
    FROM institutionalAccounts a JOIN kmhflFacilities f ON f.id = a.kmhflFacilityId
    WHERE f.code IS NULL OR f.code NOT REGEXP '^[0-9]{4,6}$'
  `);
  console.log("[registry] Institutions linked to a placeholder or missing code:");
  console.table(linked);
  if (Number(totals.total) < 1000) {
    console.log("[registry] The list looks like a small sample. Load the official list: see docs/INSTITUTION_ONBOARDING_HARDENING.md (PR P).");
  }
} finally {
  await connection.end();
}
