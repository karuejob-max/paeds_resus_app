/**
 * Quick audit: BLS/ACLS catalog rows, modules, and IDs used by the player.
 * Run: pnpm exec tsx scripts/audit-aha-bls.ts
 */
import { getDb } from "../server/db";
import { courses, modules } from "../drizzle/schema";
import { eq, inArray, asc } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("No DB connection");
    process.exit(1);
  }

  const ahaRows = await db
    .select({ id: courses.id, title: courses.title, programType: courses.programType })
    .from(courses)
    .where(inArray(courses.programType, ["bls", "acls", "pals", "heartsaver"]))
    .orderBy(asc(courses.programType), asc(courses.id));

  console.log("\n=== AHA courses in DB ===");
  for (const row of ahaRows) {
    const modRows = await db
      .select({ id: modules.id, title: modules.title, order: modules.order })
      .from(modules)
      .where(eq(modules.courseId, row.id))
      .orderBy(asc(modules.order));
    console.log(
      `  id=${row.id} programType=${row.programType} modules=${modRows.length} title=${JSON.stringify(row.title)}`
    );
    for (const m of modRows.slice(0, 3)) {
      console.log(`    - module ${m.order}: ${m.title}`);
    }
    if (modRows.length > 3) console.log(`    ... +${modRows.length - 3} more`);
  }

  const bls = ahaRows.filter((r) => r.programType === "bls");
  if (bls.length === 0) {
    console.log("\n⚠️  No BLS row in courses table.");
  } else {
    const anchor = bls.reduce((a, b) => (a.id < b.id ? a : b));
    console.log(`\n✅ BLS anchor for player: id=${anchor.id}`);
    console.log(`   Expected player URL: /micro-course/${anchor.id}?programType=bls`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
