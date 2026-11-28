import "dotenv/config";
import fs from "node:fs";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

/**
 * Read-only. Where does an institution stand on staff licences?
 * Usage: node scripts/report-institution-licences.mjs <institutionId> [--csv out.csv]
 * Counts every active, linked staff member by the state of their latest regulatory licence, and
 * separates people whose professional identity is a licensed cadre (who should hold one) from others.
 */
const institutionId = Number(process.argv[2]);
const csvIndex = process.argv.indexOf("--csv");
const csvPath = csvIndex > -1 ? process.argv[csvIndex + 1] : null;
if (!Number.isInteger(institutionId) || institutionId <= 0) {
  console.error("Usage: node scripts/report-institution-licences.mjs <institutionId> [--csv out.csv]");
  process.exit(1);
}
const LICENSED = new Set(["nurse", "doctor", "pharmacist", "paramedic", "lab_tech", "respiratory_therapist", "midwife"]);
const SOON_DAYS = 93;

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  const [[inst]] = await connection.query("SELECT id, companyName FROM institutionalAccounts WHERE id = ?", [institutionId]);
  if (!inst) { console.error("No such institution."); process.exit(1); }

  const [staff] = await connection.query(
    `SELECT s.id AS staffId, s.userId, s.staffName, s.staffEmail, s.staffRole, s.department, s.createdAt AS joinedAt,
            u.providerType, u.cadre
       FROM institutionalStaffMembers s
       LEFT JOIN users u ON u.id = s.userId
      WHERE s.institutionalAccountId = ? AND s.removedAt IS NULL AND s.facilityLinkStatus = 'linked'`,
    [institutionId],
  );
  const userIds = staff.map((s) => s.userId).filter(Boolean);
  const [creds] = userIds.length
    ? await connection.query(
        `SELECT userId, status, expiresAt, evidenceKey, credentialNumber, updatedAt
           FROM professionalCredentials
          WHERE credentialType = 'regulatory_license' AND status <> 'superseded' AND userId IN (?)
          ORDER BY updatedAt DESC`,
        [userIds],
      )
    : [[]];
  const latest = new Map();
  for (const row of creds) if (!latest.has(row.userId)) latest.set(row.userId, row);

  const now = Date.now();
  const stateOf = (row) => {
    if (!row) return "no_licence_submitted";
    if (row.status === "pending") return "pending_review";
    if (row.status === "rejected") return "rejected";
    if (row.status === "revoked") return "revoked";
    if (row.status === "verified") {
      if (!row.expiresAt) return "verified_no_expiry_date";
      const days = (new Date(row.expiresAt).getTime() - now) / 86400000;
      if (days <= 0) return "expired";
      if (days <= SOON_DAYS) return "expiring_within_93_days";
      return "verified_current";
    }
    return row.status;
  };

  const rows = staff.map((s) => {
    const licensedIdentity = LICENSED.has(s.providerType ?? "") || s.staffRole === "nurse";
    return { ...s, licensedIdentity, state: stateOf(latest.get(s.userId)) };
  });

  console.log(`\n${inst.companyName} (#${inst.id}): ${rows.length} active linked staff.\n`);
  const tally = (list) => {
    const out = {};
    for (const r of list) out[r.state] = (out[r.state] ?? 0) + 1;
    return out;
  };
  console.log("== Licensed cadres (should hold a verified licence)");
  console.table(tally(rows.filter((r) => r.licensedIdentity)));
  console.log("== Everyone else (identity not set, intern, other)");
  console.table(tally(rows.filter((r) => !r.licensedIdentity)));
  console.log("== Staff with no user account linked:", rows.filter((r) => !r.userId).length);
  console.log("== Joined by month (all active staff)");
  const byMonth = {};
  for (const r of rows) {
    const key = new Date(r.joinedAt).toISOString().slice(0, 7);
    byMonth[key] = (byMonth[key] ?? 0) + 1;
  }
  console.table(byMonth);

  if (csvPath) {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["staffId", "name", "email", "role", "department", "licensedIdentity", "licenceState"];
    const lines = [header.join(",")].concat(
      rows
        .filter((r) => r.state !== "verified_current")
        .map((r) => [r.staffId, r.staffName, r.staffEmail, r.staffRole, r.department, r.licensedIdentity, r.state].map(esc).join(",")),
    );
    fs.writeFileSync(csvPath, lines.join("\n"));
    console.log(`Wrote ${lines.length - 1} staff needing follow-up to ${csvPath}`);
  }
} finally {
  await connection.end();
}
