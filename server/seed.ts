/**
 * PALS AHA catalog seed — courses/modules for BLS/ACLS/PALS scheduling.
 * Fellowship content uses separate scripts (seed:fellowship-content:*).
 *
 *   pnpm run seed:pals
 */
import { ensurePalsAhaCatalog } from "./lib/ensure-pals-aha-catalog";
import { getDb } from "./db";

const MAX_ATTEMPTS = Math.max(1, parseInt(process.env.SEED_MAX_RETRIES || "3", 10));
const RETRY_BASE_MS = Math.max(1000, parseInt(process.env.SEED_RETRY_BASE_MS || "5000", 10));

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function connectionTarget(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return "(DATABASE_URL missing)";
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port || 3306}`;
  } catch {
    return "(invalid DATABASE_URL)";
  }
}

async function connectWithRetry() {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(
      `[seed] Connecting (${attempt}/${MAX_ATTEMPTS}) to ${connectionTarget()} via server/db pool (IPv4 + SSL)...`
    );
    try {
      const db = await getDb();
      if (db) return db;
      lastErr = new Error("getDb() returned null — pool not initialized");
    } catch (err) {
      lastErr = err;
    }
    if (attempt < MAX_ATTEMPTS) {
      const delay = RETRY_BASE_MS * attempt;
      const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
      console.warn(`[seed] Attempt ${attempt} failed (${msg}); retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function main() {
  console.log("Starting PALS AHA catalog seed...");

  if (!process.env.DATABASE_URL) {
    console.error("CRITICAL: DATABASE_URL is not defined in the environment variables.");
    process.exit(1);
  }

  const db = await connectWithRetry();
  console.log("[seed] Connection established (pool ready).");

  console.log("Seeding PALS AHA Catalog...");
  await ensurePalsAhaCatalog(db);
  console.log("PALS AHA Catalog seeded successfully.");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("[seed] Failed:", err);
    console.error(
      "\nIf ETIMEDOUT persists from this machine, run on Render Shell (production DATABASE_URL already set):\n" +
        "  pnpm run seed:pals\n"
    );
    process.exit(1);
  });
