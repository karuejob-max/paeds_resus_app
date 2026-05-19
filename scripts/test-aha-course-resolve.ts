import "dotenv/config";
import { getDb } from "../server/db";
import { resolveAhaCourseAnchor } from "../server/lib/resolve-aha-course-anchor";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("No DB");
    process.exit(1);
  }
  const bls = await resolveAhaCourseAnchor(db, "bls");
  console.log("BLS anchor:", bls ? { id: bls.id, title: bls.title } : null);
  if (!bls) process.exit(1);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
