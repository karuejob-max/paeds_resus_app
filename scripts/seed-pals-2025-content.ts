/**
 * Idempotent PALS 2025 content hotfix (Module 6 §2 + summative bank).
 *   pnpm run seed:pals-2025-content
 */
import { getDb } from "../server/db";
import { ensurePals2025Content } from "../server/lib/ensure-pals-2025-content";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("Database unavailable");
    process.exit(1);
  }
  const result = await ensurePals2025Content(db);
  console.log("PALS 2025 content ensure complete:", result);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
