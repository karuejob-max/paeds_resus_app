import "dotenv/config";
import fs from "node:fs";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

/**
 * Load the official Kenya Master Health Facility List from a CSV export.
 * Usage: node scripts/import-kmhfl-csv.mjs <file.csv> [--dry-run] [--retire-samples]
 *
 * --retire-samples: after loading, hide any remaining sample rows (placeholder codes such as CHM-001) that no
 * institution is linked to, so they stop appearing in searches. Nothing is deleted.
 *
 * Column names are matched loosely (case and spaces ignored): name / facility name, code / mfl code,
 * county, type / facility type, status / operation status. Rows without a numeric code or a name are skipped.
 * A row whose code is already loaded is updated. A sample row (placeholder code such as CHM-001) with the
 * same name and county is converted to the official code, so existing links keep working.
 */
const file = process.argv[2];
const dryRun = process.argv.includes("--dry-run");
const retireSamples = process.argv.includes("--retire-samples");
if (!file) {
  console.error("Usage: node scripts/import-kmhfl-csv.mjs <file.csv> [--dry-run]");
  process.exit(1);
}

function detectDelimiter(text) {
  const first = text.split(/\r?\n/, 1)[0] ?? "";
  const counts = { ",": 0, ";": 0, "\t": 0 };
  for (const ch of first) if (ch in counts) counts[ch] += 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function parseCsv(text, delimiter = ",") {
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
    else if (ch === delimiter) { row.push(cell); cell = ""; }
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

const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
const rows = parseCsv(text, detectDelimiter(text));
const header = rows.shift() ?? [];
const col = {
  name: pick(header, ["name", "facilityname", "officialname", "facility", "nameoffacility"]),
  code: pick(header, ["code", "mflcode", "facilitycode", "mfl", "mflno", "mflnumber", "facilityid"]),
  county: pick(header, ["county", "countyname"]),
  type: pick(header, ["type", "facilitytype", "facilitytypename", "facilitytypedetails", "category"]),
  status: pick(header, ["status", "operationstatus", "operationalstatus", "operationstatusname"]),
};
if (col.name < 0 || col.code < 0) {
  console.error("Could not find a name column and a code column. Headers found:", header.join(" | "));
  process.exit(1);
}

console.log("[kmhfl] Columns found:", header.join(" | "));
console.log("[kmhfl] Using: name =", header[col.name], "| code =", header[col.code], "| county =", header[col.county] ?? "(none)", "| type =", header[col.type] ?? "(none)", "| status =", header[col.status] ?? "(none)");
console.log("[kmhfl] First rows:");
console.table(rows.slice(0, 3).map((r) => ({ name: r[col.name], code: r[col.code], county: col.county >= 0 ? r[col.county] : "", type: col.type >= 0 ? r[col.type] : "" })));
console.log(`[kmhfl] ${rows.length} data rows read.`);

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
  if (retireSamples) {
    const [[pending]] = await connection.query(`
      SELECT COUNT(*) AS n FROM kmhflFacilities f
      WHERE (f.code IS NULL OR f.code NOT REGEXP '^[0-9]{4,6}$')
        AND f.operationalStatus <> 'non_operational'
        AND NOT EXISTS (SELECT 1 FROM institutionalAccounts a WHERE a.kmhflFacilityId = f.id)
    `);
    if (!dryRun) {
      await connection.execute(`
        UPDATE kmhflFacilities f SET f.operationalStatus = 'non_operational'
        WHERE (f.code IS NULL OR f.code NOT REGEXP '^[0-9]{4,6}$')
          AND f.operationalStatus <> 'non_operational'
          AND NOT EXISTS (SELECT 1 FROM institutionalAccounts a WHERE a.kmhflFacilityId = f.id)
      `);
    }
    console.log(`[kmhfl] ${dryRun ? "DRY RUN. Would hide" : "Hid"} ${pending.n} leftover sample row(s).`);
  }
  console.log(`[kmhfl] ${dryRun ? "DRY RUN. " : ""}inserted ${inserted}, updated ${updated}, converted sample rows ${converted}, skipped ${skipped}.`);
} finally {
  await connection.end();
}
