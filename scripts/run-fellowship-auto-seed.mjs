/**
 * Fellowship content auto-seed — single implementation for:
 *   - `pnpm run deploy:seed-fellowship` (production deploy via `pnpm start`, env-gated)
 *   - `pnpm run seed:fellowship-content:all` (this file with `--force`, manual/any env)
 * Runs all six `seed:fellowship-content:*` batches + seriously-ill-child + verify.
 * Idempotent — safe on every deploy. Exits non-zero if verify fails after retries.
 */
import "dotenv/config";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAX_RETRIES = Math.max(1, parseInt(process.env.FELLOWSHIP_SEED_MAX_RETRIES || "3", 10));
const STEP_TIMEOUT_MS = Math.max(
  60_000,
  parseInt(process.env.FELLOWSHIP_SEED_STEP_TIMEOUT_MS || "600000", 10)
);

const SEED_STEPS = [
  { label: "batch p0", npmScript: "seed:fellowship-content:p0" },
  { label: "batch respiratory", npmScript: "seed:fellowship-content:respiratory" },
  { label: "batch shock", npmScript: "seed:fellowship-content:shock" },
  { label: "batch infectious", npmScript: "seed:fellowship-content:infectious" },
  { label: "batch trauma", npmScript: "seed:fellowship-content:trauma" },
  { label: "batch metabolic", npmScript: "seed:fellowship-content:metabolic" },
  { label: "seriously-ill-child", npmScript: "seed:seriously-ill-child-course" },
  { label: "aha-courses", npmScript: "seed:aha-courses" },
];

const VERIFY_STEP = {
  label: "verify fellowship seed",
  cmd: "pnpm",
  args: ["exec", "tsx", "--import", "dotenv/config", "scripts/verify-fellowship-seed.ts"],
};

/** @returns {boolean} */
export function shouldRunFellowshipAutoSeed() {
  if (process.env.AUTO_SEED_FELLOWSHIP_ON_START === "false") return false;
  if (process.env.AUTO_SEED_FELLOWSHIP_ON_START === "true") return true;
  const onRender = process.env.RENDER === "true";
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd && !onRender) return false;
  const base = (process.env.APP_BASE_URL || "").toLowerCase();
  if (base.includes("staging")) return false;
  return true;
}

/**
 * @param {{ label: string, npmScript?: string, cmd?: string, args?: string[] }} step
 */
function runStepOnce(step) {
  const cmd = step.cmd ?? "pnpm";
  const args = step.args ?? ["run", step.npmScript];
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: ROOT,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
    });
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${step.label}: timed out after ${STEP_TIMEOUT_MS}ms`));
    }, STEP_TIMEOUT_MS);
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("exit", (code, signal) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`${step.label}: exit ${code ?? "null"} signal=${signal ?? "none"}`));
    });
  });
}

/**
 * @param {{ label: string, npmScript?: string, cmd?: string, args?: string[] }} step
 */
async function runStepWithRetries(step) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[Fellowship auto-seed] ${step.label} (attempt ${attempt}/${MAX_RETRIES})`);
      await runStepOnce(step);
      return;
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const retryable =
        /timed out|ETIMEDOUT|ECONNRESET|ECONNREFUSED|EHOSTUNREACH|ENOTFOUND/i.test(msg);
      if (attempt < MAX_RETRIES && retryable) {
        const delayMs = 5000 * attempt;
        console.warn(`[Fellowship auto-seed] ${step.label} failed (${msg}); retry in ${delayMs}ms`);
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      if (attempt < MAX_RETRIES) {
        const delayMs = 5000 * attempt;
        console.warn(`[Fellowship auto-seed] ${step.label} failed (${msg}); retry in ${delayMs}ms`);
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
    }
  }
  throw lastErr;
}

export async function runFellowshipAutoSeed() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is required for fellowship auto-seed");
  }
  console.log("[Fellowship auto-seed] Starting all batches (idempotent)...");
  for (const step of SEED_STEPS) {
    await runStepWithRetries(step);
  }
  await runStepWithRetries(VERIFY_STEP);
  console.log("[Fellowship auto-seed] Fellowship auto-seed complete — verify passed");
}

async function main() {
  const force = process.argv.includes("--force");
  if (!force && !shouldRunFellowshipAutoSeed()) {
    console.log(
      "[Fellowship auto-seed] Skipped (not production/Render, or AUTO_SEED_FELLOWSHIP_ON_START=false). Use --force for manual run."
    );
    return;
  }
  try {
    await runFellowshipAutoSeed();
  } catch (err) {
    console.error("[Fellowship auto-seed] FAILED:", err);
    process.exit(1);
  }
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  main();
}
