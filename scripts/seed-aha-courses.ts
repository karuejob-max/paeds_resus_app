import "dotenv/config";
import { getDb } from "../server/db";
import { ensureBlsCatalog, ensureAclsCatalog } from "../server/lib/ensure-bls-acls-catalog";
import { ensureHeartsaverCatalog } from "../server/lib/ensure-heartsaver-catalog";
import { ensurePalsAhaCatalog } from "../server/lib/ensure-pals-aha-catalog";
import { ensureNrpCatalog } from "../server/lib/ensure-nrp-catalog";
import { resolveAhaCourseAnchor } from "../server/lib/resolve-aha-course-anchor";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("Failed to connect to database");
    process.exit(1);
  }

  console.log("[Seed] Ensuring all AHA course catalogs...");
  
  const programs = ["bls", "acls", "pals", "heartsaver", "nrp"] as const;
  for (const program of programs) {
    console.log(`[Seed] Processing ${program.toUpperCase()}...`);
    if (program === "bls") await ensureBlsCatalog(db);
    else if (program === "acls") await ensureAclsCatalog(db);
    else if (program === "pals") await ensurePalsAhaCatalog(db);
    else if (program === "heartsaver") await ensureHeartsaverCatalog(db);
    else if (program === "nrp") await ensureNrpCatalog(db);
    
    // This also ensures quizzes
    await resolveAhaCourseAnchor(db, program);
    console.log(`[Seed] ${program.toUpperCase()} complete.`);
  }

  console.log("[Seed] All AHA courses seeded successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[Seed] Fatal error:", err);
  process.exit(1);
});
