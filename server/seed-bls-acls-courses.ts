/**
 * Seed BLS and ACLS course catalogs with full AHA 2020-aligned cognitive content.
 *
 * Run: pnpm exec tsx server/seed-bls-acls-courses.ts
 * Requires DATABASE_URL / DB access (same as app).
 *
 * This is idempotent — safe to run multiple times.
 */
import { getDb } from "./db";
import { ensureBlsCatalog, ensureAclsCatalog } from "./lib/ensure-bls-acls-catalog";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("Database unavailable (check DATABASE_URL and connection).");
    process.exit(1);
  }

  console.log("Seeding BLS catalog...");
  await ensureBlsCatalog(db);
  console.log("✅ BLS catalog seeded.");

  console.log("Seeding ACLS catalog...");
  await ensureAclsCatalog(db);
  console.log("✅ ACLS catalog seeded.");

  console.log("\nDone. BLS and ACLS courses are now available in the database.");
  console.log("Enroll a user in BLS or ACLS, complete all modules, then have an instructor sign off practical skills to receive the certificate.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
