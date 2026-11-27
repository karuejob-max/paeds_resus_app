import "dotenv/config";
import fs from "node:fs";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

/**
 * Load the official Kenya Master Health Facility List from a CSV export.
 * Usage: node scripts/import-kmhfl-csv.mjs <file.csv> [--dry-run]
 *
 * Column names are matched loosely (case and spaces ignored): name / facility name, code / mfl code,
 * county, type / facility type, status / operation status. Rows without a numeric code or a name are skipped.
 * A row whose code is already loaded is updated. A sample row (placeholder code such as CHM-001) with the
 * same name and county is converted to the official code, so existing links keep working.
 */
const file = process.argv[2];
const dryRun = process.argv.includes("--dry-run");
if (!file) {
  console.error("Usage: node scripts/import-kmhfl-csv.mjs <file.csv> [--dry-run]");
  process.exit(1);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell); cell = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

const norm = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const pick = (header, names) => header.findIndex((h) => names.includes(norm(h)));

const rows = parseCsv(fs.readFileSync(file, "utf8").replace(/^﻿/, ""));
const header = rows.shift() ?? [];
const col = {
  name: pick(header, ["name", "facilityname", "officialname"]),
  code: pick(header, ["code", "mflcode", "facilitycode", "mfl"]),
  county: pick(header, ["county", "countyname"]),
  type: pick(header, ["type", "facilitytype", "facilitytypename"]),
  status: pick(header, ["status", "operationstatus", "operationalstatus"]),
};
if (col.name < 0 || col.code < 0) {
  console.error("Could not find a name column and a code column. Headers found:", header.join(" | "));
  process.exit(1);
}

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
let inserted = 0, updated = 0, converted = 0, skipped = 0;
try {
  for (const row of rows) {
    const name = (row[col.name] ?? "").trim();
    const code = (row[col.code] ?? "").trim();
    const county = col.county >= 0 ? (row[col.county] ?? "").trim() || null : null;
    const facilityType = col.type >= 0 ? (row[col.type] ?? "").trim() || null : null;
    const rawStatus = col.status >= 0 ? (row[col.status] ?? "").trim().toLowerCase() : "";
    const operationalStatus = rawStatus ? (/non|not|closed|inactive/.test(rawStatus) ? "non_operational" : "operational") : "operational";
    if (!name || !/^[0-9]{4,6}$/.test(code)) { skipped += 1; continue; }

    const [byCode] = await connection.query("SELECT id FROM kmhflFacilities WHERE code = ? LIMIT 1", [code]);
    if (byCode.length > 0) {
      if (!dryRun) await connection.execute("UPDATE kmhflFacilities SET name=?, county=?, facilityType=?, operationalStatus=?, sourceSystem='KMHFL' WHERE id=?", [name, county, facilityType, operationalStatus, byCode[0].id]);
      updated += 1;
      continue;
    }
    const [sample] = await connection.query(
      "SELECT id FROM kmhflFacilities WHERE LOWER(name) = LOWER(?) AND (code IS NULL OR code NOT REGEXP '^[0-9]{4,6}$') AND (county <=> ? OR ? IS NULL) LIMIT 1",
      [name, county, county],
    );
    if (sample.length > 0) {
      if (!dryRun) await connection.execute("UPDATE kmhflFacilities SET code=?, county=?, facilityType=?, operationalStatus=?, sourceSystem='KMHFL' WHERE id=?", [code, county, facilityType, operationalStatus, sample[0].id]);
      converted += 1;
      continue;
    }
    if (!dryRun) await connection.execute("INSERT INTO kmhflFacilities (name, code, county, facilityType, operationalStatus, sourceSystem) VALUES (?,?,?,?,?, 'KMHFL')", [name, code, county, facilityType, operationalStatus]);
    inserted += 1;
  }
  console.log(`[kmhfl] ${dryRun ? "DRY RUN. " : ""}inserted ${inserted}, updated ${updated}, converted sample rows ${converted}, skipped ${skipped}.`);
} finally {
  await connection.end();
}
