/**
 * Production start wrapper: fellowship auto-seed (when enabled) then node server.
 * Render uses `pnpm start` → this script. Verify failure blocks server start (deploy fails safe).
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { shouldRunFellowshipAutoSeed } from "./run-fellowship-auto-seed.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Same pipeline as `pnpm run seed:fellowship-content:all` (via deploy:seed-fellowship, env-gated). */
function runPnpmScript(script) {
  return new Promise((resolve, reject) => {
    const child = spawn("pnpm", ["run", script], {
      cwd: ROOT,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${script}: exit ${code ?? "null"} signal=${signal ?? "none"}`));
    });
  });
}

async function main() {
  if (shouldRunFellowshipAutoSeed()) {
    try {
      await runPnpmScript("deploy:seed-fellowship");
    } catch (err) {
      console.error("[Start] Fellowship auto-seed failed — not starting server:", err);
      process.exit(1);
    }
  } else {
    console.log("[Start] Fellowship auto-seed skipped (dev/staging or disabled)");
  }

  const serverEntry = path.join(ROOT, "dist", "index.js");
  const child = spawn(process.execPath, [serverEntry], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV || "production" },
  });
  child.on("exit", (code, signal) => {
    process.exit(code ?? (signal ? 1 : 0));
  });
  child.on("error", (err) => {
    console.error("[Start] Failed to launch server:", err);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error("[Start] Fatal:", err);
  process.exit(1);
});
