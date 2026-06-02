/** Static audit: catalog vs seed TS + module-native formative coverage (no DB). */
import { getAllFellowshipSeedContent, resolveCatalogSlug } from "./fellowship-seed-lib";
import { resolveModuleFormativeQuestions, MIN_FORMATIVE_QUESTIONS_PER_MODULE } from "../shared/microcourse-exam-policy";
import {
  isFellowshipPillarMicroCourse,
  MICRO_COURSE_CATALOG,
} from "../server/lib/micro-course-catalog";

const catalogSlugs = MICRO_COURSE_CATALOG.filter(isFellowshipPillarMicroCourse).map(
  (c) => c.courseId
);

/** Seeded via ensure-seriously-ill-child-fellowship-catalog, not fellowship batch TS. */
const SEPARATE_SEED_SLUGS = new Set(["seriously-ill-child-i"]);

const bySlug = new Map<string, ReturnType<typeof getAllFellowshipSeedContent>[number]>();
for (const c of getAllFellowshipSeedContent()) {
  bySlug.set(resolveCatalogSlug(c.id), c);
}

const missingSeed = catalogSlugs.filter((s) => !bySlug.has(s) && !SEPARATE_SEED_SLUGS.has(s));
const orphanSeed = [...bySlug.keys()].filter((s) => !catalogSlugs.includes(s));

console.log(`Catalog fellowship courses: ${catalogSlugs.length}`);
console.log(`Seed courses: ${bySlug.size}`);
console.log(`Missing seed: ${missingSeed.join(", ") || "none"}`);
console.log(`Orphan seed slugs: ${orphanSeed.join(", ") || "none"}\n`);

let nativeThin = 0;
for (const slug of catalogSlugs.sort()) {
  const c = bySlug.get(slug);
  if (!c) {
    if (SEPARATE_SEED_SLUGS.has(slug)) {
      console.log(`[SEPARATE SEED] ${slug} — ensure-seriously-ill-child-fellowship-catalog`);
      continue;
    }
    console.log(`[NO SEED] ${slug}`);
    continue;
  }
  const nativeCount = c.modules.filter((m) => (m.questions?.length ?? 0) > 0).length;
  const bank = resolveModuleFormativeQuestions(c.modules, c.quiz?.questions ?? []);
  const thinModules = bank.filter(
    (qs) => qs.length > 0 && new Set(qs.map((x) => x.question)).size < MIN_FORMATIVE_QUESTIONS_PER_MODULE
  ).length;
  const summativeQs = c.quiz?.questions?.length ?? 0;
  const flag =
    nativeCount < c.modules.length
      ? "BANK_FALLBACK"
      : thinModules > 0
        ? "NATIVE_THIN"
        : "OK";
  if (flag !== "OK") nativeThin++;
  console.log(
    `${flag.padEnd(14)} ${slug} | mods=${c.modules.length} native=${nativeCount}/${c.modules.length} summativeQs=${summativeQs}${thinModules ? ` thinFormativeMods=${thinModules}` : ""}`
  );
}

console.log(`\nCourses needing formative depth work: ${nativeThin}/${catalogSlugs.length}`);
if (missingSeed.length > 0) process.exit(1);
if (nativeThin > 0) process.exit(1);
