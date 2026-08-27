import fs from "node:fs";
import path from "node:path";

const migrationPath = path.resolve(new URL("../scripts/apply-0131-ierp-program.mjs", import.meta.url).pathname);
const source = fs.readFileSync(migrationPath, "utf8");
const requiredTables = [
  "ierpProgramEnrollments",
  "ierpPhase1Evidence",
  "ierpPayments",
  "ierpEmailCampaigns",
  "ierpEmailPreferences",
  "ierpEmailSuppressions",
  "ierpEmailAttributions",
  "ierpEmailAuditLog",
];

for (const table of requiredTables) {
  if (!source.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
    throw new Error(`0131 is missing an idempotent CREATE TABLE guard for ${table}`);
  }
}
for (const forbidden of ["DROP TABLE", "TRUNCATE TABLE", "DELETE FROM", "sendEmail", "sendPromotionalEmail"]) {
  if (source.toUpperCase().includes(forbidden.toUpperCase())) {
    throw new Error(`0131 contains a forbidden destructive/send operation: ${forbidden}`);
  }
}
if (!source.includes("migration-reserved-0131")) {
  throw new Error("0131 reservation reference is missing");
}
console.log(`[0131] verified ${requiredTables.length} idempotent IERP tables; no destructive or promotional-send operation found.`);
