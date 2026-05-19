#!/usr/bin/env node
/**
 * Guard against CI setup drift (e.g. pnpm/action-setup version vs packageManager).
 * Run locally and in GitHub Actions before install.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const ciYml = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");

let failed = false;

const packageManager = pkg.packageManager ?? "";
const pmMatch = packageManager.match(/^pnpm@([^+]+)/);
if (!pmMatch) {
  console.error("verify-ci-workflow: package.json must set packageManager to pnpm@<version>");
  process.exit(1);
}
const expectedMajor = pmMatch[1].split(".")[0];

// pnpm/action-setup must not pin a different major when packageManager is set.
const pinsPnpmVersion =
  /pnpm\/action-setup@v\d+[\s\S]*?^\s+version:\s*["']?(\d+)/m.test(ciYml) ||
  /uses:\s*pnpm\/action-setup@v\d+\s*\n\s+with:\s*\n\s+version:/m.test(ciYml);

if (pinsPnpmVersion) {
  const pinned = ciYml.match(/pnpm\/action-setup@v\d+[\s\S]*?version:\s*["']?(\d+)/)?.[1];
  if (pinned && pinned !== expectedMajor) {
    console.error(
      `verify-ci-workflow: .github/workflows/ci.yml pins pnpm v${pinned} but packageManager is ${packageManager}.\n` +
        "Remove `version:` from pnpm/action-setup so Corepack uses packageManager."
    );
    failed = true;
  }
}

if (!ciYml.includes("pnpm install --frozen-lockfile")) {
  console.error("verify-ci-workflow: CI must run `pnpm install --frozen-lockfile`.");
  failed = true;
}

if (!ciYml.includes("pnpm run check")) {
  console.error("verify-ci-workflow: CI must run `pnpm run check`.");
  failed = true;
}

if (failed) process.exit(1);

console.log(`verify-ci-workflow: OK (pnpm major ${expectedMajor}, packageManager drives action-setup)`);
