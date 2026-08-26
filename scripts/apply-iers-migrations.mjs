#!/usr/bin/env node
/**
 * Apply the IERS production schema in one guarded command.
 *
 * Usage:
 *   pnpm run db:apply-iers
 *
 * The runner intentionally delegates each step to the repository's existing
 * scripts so their idempotency, SSL configuration, and error handling remain
 * the source of truth. It stops immediately on any failed step, including the department governance and deterministic pole-order migration 0116,
 * plus member-removal audit and multi-pole ordering migration 0117, exact UTL shift-time migration 0118, versioned shift-team role migration 0119, governed UTL readiness checklist migration 0120, targeted ERT role-report migration 0121, activation case-link migration 0122, notification persistence migration 0123, and explicit facility-membership request migration 0124.

 */
import { spawn } from "node:child_process";

const steps = [
  "db:test-connection",
  "db:apply-0094",
  "db:apply-0095",
  "db:apply-0096",
  "db:apply-0097",
  "db:apply-0098",
  "db:apply-0099",
  "db:apply-0100",
  "db:apply-0101",
  "db:apply-0102",
  "db:apply-0103",
  "db:apply-0104",
  "db:apply-0105",
  "db:apply-0106",
  "db:apply-0107",
  "db:apply-0108",
  "db:apply-0109",
  "db:apply-0110",
  "db:apply-0111",
  "db:apply-0112",
  "db:apply-0113",
  "db:apply-0114",
  "db:apply-0115",
  "db:apply-0116",
  "db:apply-0117",
  "db:apply-0118",
  "db:apply-0119",
  "db:apply-0120",
  "db:apply-0121",
  "db:apply-0122",
  "db:apply-0123",
  "db:apply-0124",
  "db:verify-iers",
];

if (!process.env.DATABASE_URL?.trim()) {
  console.error("[IERS] DATABASE_URL is not set. No migration was started.");
  process.exit(1);
}

function runPnpmScript(scriptName) {
  return new Promise((resolve, reject) => {
    const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
    const child = spawn(command, ["run", scriptName], {
      stdio: "inherit",
      env: process.env,
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${scriptName} stopped by signal ${signal}`));
        return;
      }
      if (code !== 0) {
        reject(new Error(`${scriptName} exited with code ${code ?? "unknown"}`));
        return;
      }
      resolve();
    });
  });
}

async function main() {
  console.log("[IERS] Starting guarded production migration sequence.");
  console.log("[IERS] The sequence stops at the first failed step; no later migration will run.");

  for (const [index, step] of steps.entries()) {
    console.log(`\n[IERS] Step ${index + 1}/${steps.length}: ${step}`);
    await runPnpmScript(step);
    console.log(`[IERS] PASSED: ${step}`);
  }

  console.log("\n[IERS] All migrations applied and the production schema verification passed.");
}

main().catch((error) => {
  console.error(`\n[IERS] STOPPED: ${error?.message || error}`);
  console.error("[IERS] Do not continue manually. Send this error to the engineering agent with secrets removed.");
  process.exit(1);
});
