#!/usr/bin/env node

const cases = [
  ["institution-admin-directory", "institution_admin", "institution-wide", "allow"],
  ["department-head-own-department", "department_head", "own-department-and-descendants", "allow"],
  ["department-head-other-department", "department_head", "other-department", "deny"],
  ["deputy-head-own-department", "deputy_department_head", "own-department-and-descendants", "allow"],
  ["deputy-head-institution-admin", "deputy_department_head", "institution-wide-admin", "deny"],
  ["erco-iers-governance", "erco", "iers-governance", "allow"],
  ["erco-account-administration", "erco", "account-administration", "deny"],
  ["cpd-coordinator-cpd-scope", "cpd_coordinator", "cpd-department-scope", "allow"],
  ["ordinary-staff-people-admin", "ordinary_staff", "people-and-access-admin", "deny"],
  ["cross-tenant-selected-institution", "cross_tenant", "another-institution", "deny"],
  ["removed-membership", "previous_member", "institution-directory", "deny"],
  ["revoked-product-role", "revoked_role", "protected-procedure", "deny"],
  ["ended-duty", "ended_duty", "active-duty-surface", "deny"],
  ["inactive-department-target", "institution_admin", "inactive-department-reallocation", "deny"],
];

const required = new Set([
  "institution-admin-directory",
  "department-head-own-department",
  "department-head-other-department",
  "deputy-head-own-department",
  "deputy-head-institution-admin",
  "erco-iers-governance",
  "erco-account-administration",
  "cpd-coordinator-cpd-scope",
  "ordinary-staff-people-admin",
  "cross-tenant-selected-institution",
  "removed-membership",
  "revoked-product-role",
  "ended-duty",
  "inactive-department-target",
]);

const ids = new Set(cases.map(([id]) => id));
const missing = [...required].filter(id => !ids.has(id));
if (missing.length) {
  console.error(`Role-matrix manifest is incomplete: ${missing.join(", ")}`);
  process.exit(1);
}

const manifest = {
  mode: process.argv.includes("--json") ? "dry-run-json" : "dry-run",
  databaseTouched: false,
  productionSafe: true,
  liveEvidence: false,
  cases: cases.map(([id, persona, scope, expected]) => ({ id, persona, scope, expected })),
  nextAction: "Run protected tRPC calls against a disposable local staging database and replace expected-only rows with observed outcomes.",
};

if (manifest.mode === "dry-run-json") {
  console.log(JSON.stringify(manifest, null, 2));
} else {
  console.log(`People & Access role matrix: ${cases.length} cases declared`);
  console.log("Mode: dry-run; database touched: no; production-safe: yes");
  for (const [id, persona, scope, expected] of cases) console.log(`- ${id}: ${persona} / ${scope} => ${expected}`);
  console.log(manifest.nextAction);
}
