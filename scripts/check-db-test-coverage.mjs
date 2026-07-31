#!/usr/bin/env node
/**
 * Makes DB-dependent test skips visible instead of silent.
 *
 * `vitest.unit.config.ts` is deliberately "DB-optional" -- it's meant to run
 * with DATABASE_URL unset in CI (see the config's own header comment). But
 * several test files under its include globs (server/lib/**\/*.test.ts etc.)
 * contain a `describe.skipIf(!hasDatabase)(...)` block, meaning their real
 * assertions never execute in CI at all -- and vitest reports this as a
 * clean pass with zero failures, identical to a genuinely-passing run.
 *
 * This script doesn't try to stand up a database in CI (that's a separate,
 * larger follow-up -- see WORK_STATUS.md). It just makes today's blind spot
 * loud: it greps for the skip pattern, and if DATABASE_URL isn't set, prints
 * an explicit list of every suite that did not run, so a green CI check
 * can't be mistaken for "these are covered."
 *
 * Run after `pnpm run test:unit` in CI. Never fails the build -- this is a
 * visibility fix, not a new gate.
 */
import { execSync } from "node:child_process";

const SKIP_PATTERNS = [/skipIf\(!hasDatabase\)/, /skipIf\(!process\.env\.DATABASE_URL\)/];

function findSkippableSuites() {
  const grepOutput = execSync(
    `grep -rln "skipIf(!hasDatabase)\\|skipIf(!process.env.DATABASE_URL)" server --include="*.test.ts" || true`,
    { encoding: "utf-8" }
  ).trim();
  return grepOutput ? grepOutput.split("\n").filter(Boolean) : [];
}

const files = findSkippableSuites();
const hasDatabase = Boolean(process.env.DATABASE_URL);

if (files.length === 0) {
  console.log("[db-test-coverage] No skipIf(!hasDatabase) suites found.");
  process.exit(0);
}

if (hasDatabase) {
  console.log(
    `[db-test-coverage] DATABASE_URL is set -- the ${files.length} DB-dependent suite(s) below ran for real this pass.`
  );
  files.forEach((f) => console.log(`  - ${f}`));
  process.exit(0);
}

console.log("");
console.log("=============================================================");
console.log(" DB-DEPENDENT TEST SUITES DID NOT RUN THIS PASS");
console.log("=============================================================");
console.log(
  ` DATABASE_URL is not set. The ${files.length} file(s) below contain a`
);
console.log(" describe.skipIf(!hasDatabase) block whose assertions were");
console.log(" skipped entirely -- vitest reports this the same as a clean");
console.log(" pass, so a green CI check here does NOT mean these are");
console.log(" covered:");
console.log("");
files.forEach((f) => console.log(`   - ${f}`));
console.log("");
console.log(
  " Run locally with a real DATABASE_URL (see pnpm run test:db /"
);
console.log(
  " test:db:integration) to actually exercise these before trusting them."
);
console.log("=============================================================");
console.log("");
