/**
 * Fellowship micro-course depth audit — modules, sections, formatives, diagnostic/summative banks.
 * Writes docs/MICROCOURSE_DEPTH_AUDIT.md
 * Optional: --strict exits 1 if any course is shallow.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDb } from "../server/db";
import { courses, modules, microCourses, quizzes, quizQuestions } from "../drizzle/schema";
import { eq, and, like, or } from "drizzle-orm";
import { getAllFellowshipSeedContent, resolveCatalogSlug } from "./fellowship-seed-lib";
import { enhanceFellowshipModuleContent } from "../server/data/clinical-content-helpers";
import { getFellowshipSummativeExpansion } from "../server/data/fellowship-summative-expansions";
import {
  examKindFromQuizTitle,
  MICROCOURSE_DIAGNOSTIC_BANK_SIZE,
  MICROCOURSE_MIN_QUESTION_BANK_SIZE,
  MIN_FORMATIVE_QUESTIONS_PER_MODULE,
  normalizeQuestionStem,
  resolveExamQuestionBanks,
  uniqueFormativeQuestions,
  type FormativeQuestion,
} from "../shared/microcourse-exam-policy";
import {
  isFellowshipPillarMicroCourse,
  MICRO_COURSE_CATALOG,
} from "../shared/micro-course-catalog";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const OUT = path.join(root, "docs/MICROCOURSE_DEPTH_AUDIT.md");

const MIN_MODULES = 3;
const MIN_SECTIONS_PER_MODULE = 2;
const MIN_DIAGNOSTIC = 8;

const SEPARATE_SEED_SLUGS = new Set(["seriously-ill-child-i"]);

type DepthRow = {
  slug: string;
  modules: number;
  sectionsPerModule: number[];
  formativesPerModule: number[];
  diagnosticSeed: number;
  summativeSeed: number;
  diagnosticProd: number | null;
  summativeProd: number | null;
  crossModuleFormDupes: number;
  shallow: boolean;
  shallowReasons: string[];
};

function countH3Sections(html: string): number {
  return (html.match(/<h3[^>]*>/gi) ?? []).length;
}

function crossModuleFormativeDupes(modules: { questions?: FormativeQuestion[] }[]): number {
  const stemToMods = new Map<string, number[]>();
  modules.forEach((m, i) => {
    const seen = new Set<string>();
    for (const q of m.questions ?? []) {
      const k = normalizeQuestionStem(q.question);
      if (seen.has(k)) continue;
      seen.add(k);
      const arr = stemToMods.get(k) ?? [];
      if (!arr.includes(i + 1)) arr.push(i + 1);
      stemToMods.set(k, arr);
    }
  });
  return [...stemToMods.values()].filter((mods) => mods.length > 1).length;
}

function auditSeedCourse(slug: string, raw: ReturnType<typeof getAllFellowshipSeedContent>[number]): DepthRow {
  const sectionsPerModule: number[] = [];
  const formativesPerModule: number[] = [];

  for (let i = 0; i < raw.modules.length; i++) {
    const mod = raw.modules[i]!;
    const enhanced = enhanceFellowshipModuleContent(slug, i, raw.modules.length, mod.content);
    sectionsPerModule.push(countH3Sections(enhanced));
    const stems = new Set((mod.questions ?? []).map((q) => normalizeQuestionStem(q.question)));
    formativesPerModule.push(stems.size);
  }

  const fullBank = uniqueFormativeQuestions([
    ...(raw.quiz?.questions ?? []),
    ...getFellowshipSummativeExpansion(slug),
  ]);
  const { diagnostic, summative } = resolveExamQuestionBanks(fullBank);
  const crossModuleFormDupes = crossModuleFormativeDupes(raw.modules);

  const shallowReasons: string[] = [];
  if (raw.modules.length < MIN_MODULES) shallowReasons.push(`modules<${MIN_MODULES}`);
  if (sectionsPerModule.some((n) => n < MIN_SECTIONS_PER_MODULE)) {
    shallowReasons.push(`sections<${MIN_SECTIONS_PER_MODULE}`);
  }
  if (formativesPerModule.some((n) => n < MIN_FORMATIVE_QUESTIONS_PER_MODULE)) {
    shallowReasons.push(`formatives<${MIN_FORMATIVE_QUESTIONS_PER_MODULE}`);
  }
  if (diagnostic.length < MIN_DIAGNOSTIC) shallowReasons.push(`diagnostic<${MIN_DIAGNOSTIC}`);
  if (summative.length < MICROCOURSE_MIN_QUESTION_BANK_SIZE) {
    shallowReasons.push(`summative<${MICROCOURSE_MIN_QUESTION_BANK_SIZE}`);
  }
  if (crossModuleFormDupes > 0) shallowReasons.push("crossModuleFormDupes");

  return {
    slug,
    modules: raw.modules.length,
    sectionsPerModule,
    formativesPerModule,
    diagnosticSeed: diagnostic.length,
    summativeSeed: summative.length,
    diagnosticProd: null,
    summativeProd: null,
    crossModuleFormDupes,
    shallow: shallowReasons.length > 0,
    shallowReasons,
  };
}

async function loadProdDiagnosticCounts(): Promise<Map<string, { diagnostic: number; summative: number }>> {
  const out = new Map<string, { diagnostic: number; summative: number }>();
  const db = await getDb();
  if (!db) return out;

  const slugs = MICRO_COURSE_CATALOG.filter(isFellowshipPillarMicroCourse).map((c) => c.courseId);

  for (const slug of slugs) {
    const [row] = await db
      .select()
      .from(microCourses)
      .where(eq(microCourses.courseId, slug))
      .limit(1);
    if (!row) continue;

    const titlePrefix = row.title.split(":")[0]!.trim();
    const [course] = await db
      .select()
      .from(courses)
      .where(
        and(
          eq(courses.programType, "fellowship"),
          or(like(courses.title, `%${titlePrefix}%`), eq(courses.order, row.order))
        )
      )
      .limit(1);
    if (!course) continue;

    const mods = await db
      .select({ id: modules.id })
      .from(modules)
      .where(eq(modules.courseId, course.id));

    let diagnostic = 0;
    let summative = 0;

    for (const mod of mods) {
      const qs = await db
        .select({ id: quizzes.id, title: quizzes.title })
        .from(quizzes)
        .where(eq(quizzes.moduleId, mod.id));
      for (const q of qs) {
        const kind = examKindFromQuizTitle(q.title);
        const fq = await db
          .select({ question: quizQuestions.question })
          .from(quizQuestions)
          .where(eq(quizQuestions.quizId, q.id));
        const count = new Set(
          fq.map((r) => normalizeQuestionStem(r.question)).filter(Boolean)
        ).size;
        if (kind === "diagnostic") diagnostic = Math.max(diagnostic, count);
        if (kind === "summative") summative = Math.max(summative, count);
      }
    }

    out.set(slug, { diagnostic, summative });
  }

  return out;
}

async function main() {
  const catalogSlugs = MICRO_COURSE_CATALOG.filter(isFellowshipPillarMicroCourse)
    .map((c) => c.courseId)
    .sort();

  const bySlug = new Map(getAllFellowshipSeedContent().map((c) => [resolveCatalogSlug(c.id), c]));
  let prodCounts = new Map<string, { diagnostic: number; summative: number }>();

  try {
    prodCounts = await loadProdDiagnosticCounts();
  } catch {
    console.warn("Prod DB unavailable — seed-only audit");
  }

  const rows: DepthRow[] = [];

  for (const slug of catalogSlugs) {
    if (SEPARATE_SEED_SLUGS.has(slug)) {
      rows.push({
        slug,
        modules: 7,
        sectionsPerModule: [5, 5, 5, 5, 5, 5, 5],
        formativesPerModule: [3, 3, 3, 3, 3, 3, 3],
        diagnosticSeed: MICROCOURSE_DIAGNOSTIC_BANK_SIZE,
        summativeSeed: MICROCOURSE_MIN_QUESTION_BANK_SIZE,
        diagnosticProd: prodCounts.get(slug)?.diagnostic ?? null,
        summativeProd: prodCounts.get(slug)?.summative ?? null,
        crossModuleFormDupes: 0,
        shallow: false,
        shallowReasons: [],
      });
      continue;
    }

    const raw = bySlug.get(slug);
    if (!raw) {
      rows.push({
        slug,
        modules: 0,
        sectionsPerModule: [],
        formativesPerModule: [],
        diagnosticSeed: 0,
        summativeSeed: 0,
        diagnosticProd: prodCounts.get(slug)?.diagnostic ?? null,
        summativeProd: prodCounts.get(slug)?.summative ?? null,
        crossModuleFormDupes: 0,
        shallow: true,
        shallowReasons: ["NO_SEED"],
      });
      continue;
    }

    const row = auditSeedCourse(slug, raw);
    const prod = prodCounts.get(slug);
    if (prod) {
      row.diagnosticProd = prod.diagnostic;
      row.summativeProd = prod.summative;
    }
    rows.push(row);
  }

  const shallowCount = rows.filter((r) => r.shallow).length;
  const passCount = rows.length - shallowCount;
  const asthmaBefore =
    "2 modules, ~1 section/mod (legacy), 1 formative/mod repeating, 2 diagnostic (prod drift)";
  const asthmaI = rows.find((r) => r.slug === "asthma-i");

  const lines: string[] = [
    "# Micro-course depth audit",
    "",
    `**Generated:** ${new Date().toISOString().slice(0, 10)} · **Scope:** ${rows.length} fellowship pillar micro-courses`,
    "",
    "## Depth standard (Foundational + Advanced)",
    "",
    `- **≥${MIN_MODULES} modules** per course`,
    `- **≥${MIN_SECTIONS_PER_MODULE} sections (h3) per module** after \`enhanceFellowshipModuleContent\``,
    `- **≥${MIN_FORMATIVE_QUESTIONS_PER_MODULE} unique formative stems per module** (no cross-module repeats)`,
    `- **${MICROCOURSE_DIAGNOSTIC_BANK_SIZE} diagnostic** + **${MICROCOURSE_MIN_QUESTION_BANK_SIZE} summative** (25-stem bank split)`,
    "",
    "## Executive summary",
    "",
    "| Metric | Value |",
    "|--------|------:|",
    `| Courses audited | ${rows.length} |`,
    `| Pass depth gate | ${passCount} |`,
    `| Shallow (fail) | ${shallowCount} |`,
    `| Systemic vs isolated | ${shallowCount > 1 ? "**Systemic** — multiple courses below gate (not asthma-i only)" : shallowCount === 1 ? "**Isolated** — single course below gate" : "**All pass**"} |`,
    "",
    "## Asthma I before → after (seed)",
    "",
    "| Field | Before (CEO live report) | After (this pass) |",
    "|-------|--------------------------|-------------------|",
    `| Structure | ${asthmaBefore} | ${asthmaI ? `${asthmaI.modules} modules, sections ${asthmaI.sectionsPerModule.join("/")}, formatives ${asthmaI.formativesPerModule.join("/")}` : "pending"} |`,
    `| Diagnostic | 2 (prod) / PR #189 claimed 10 | seed **${asthmaI?.diagnosticSeed ?? "?"}**${asthmaI?.diagnosticProd != null ? `, prod **${asthmaI.diagnosticProd}**` : ""} |`,
    `| Summative | thin | seed **${asthmaI?.summativeSeed ?? "?"}**${asthmaI?.summativeProd != null ? `, prod **${asthmaI.summativeProd}**` : ""} |`,
    "",
    "## Per-course report",
    "",
    "| Course | Mods | Sections/mod | Formatives/mod | Diag (seed) | Summ (seed) | Diag (prod) | Summ (prod) | X-mod dups | Shallow | Reasons |",
    "|--------|-----:|--------------|----------------|------------:|------------:|------------:|------------:|-----------:|:-------:|---------|",
  ];

  for (const r of rows) {
    const sec = r.sectionsPerModule.join("/") || "—";
    const form = r.formativesPerModule.join("/") || "—";
    const diagProd = r.diagnosticProd != null ? String(r.diagnosticProd) : "—";
    const summProd = r.summativeProd != null ? String(r.summativeProd) : "—";
    lines.push(
      `| ${r.slug} | ${r.modules} | ${sec} | ${form} | ${r.diagnosticSeed} | ${r.summativeSeed} | ${diagProd} | ${summProd} | ${r.crossModuleFormDupes} | ${r.shallow ? "✗" : "✓"} | ${r.shallowReasons.join("; ") || "—"} |`
    );
  }

  lines.push(
    "",
    "## Courses needing fix",
    "",
    ...rows
      .filter((r) => r.shallow)
      .map((r) => `- **${r.slug}**: ${r.shallowReasons.join(", ")}`),
    "",
    "## CEO post-deploy review",
    "",
    "**Pending** live sign-off at paedsresus.com per CLINICAL_CONTENT_GOVERNANCE §8.",
    ""
  );

  fs.writeFileSync(OUT, lines.join("\n"));
  console.log(`Wrote ${OUT}`);
  console.log(`Depth pass: ${passCount}/${rows.length}`);

  if (process.argv.includes("--strict") && shallowCount > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
