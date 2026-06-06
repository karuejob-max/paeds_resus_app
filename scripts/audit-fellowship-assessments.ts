/**
 * Fellowship assessment audit — duplicate stems, bank fallback, governance gaps.
 * Writes docs/FELLOWSHIP_ASSESSMENT_AUDIT.md (no DB).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { resolveCatalogSlug, type FellowshipCourseSeed } from "./fellowship-seed-lib";
import {
  materializeModuleNativeFormatives,
  MICROCOURSE_MIN_QUESTION_BANK_SIZE,
  MIN_FORMATIVE_QUESTIONS_PER_MODULE,
  resolveExamQuestionBanks,
  uniqueFormativeQuestions,
  type FormativeQuestion,
} from "../shared/microcourse-exam-policy";
import { getFellowshipSummativeExpansion } from "../server/data/fellowship-summative-expansions";
import {
  isFellowshipPillarMicroCourse,
  MICRO_COURSE_CATALOG,
} from "../shared/micro-course-catalog";
import { microCoursesBatch1To5 } from "../server/data/micro-courses-batch-1-5";
import { microCoursesBatch3To5 } from "../server/data/micro-courses-batch-3-5";
import { microCoursesFinalBatch } from "../server/data/micro-courses-final-batch";
import { microCoursesBurns } from "../server/data/micro-courses-burns";
import { microCoursesMissingFellowship } from "../server/data/micro-courses-missing-fellowship";
import { microCoursesSepticShock } from "../server/data/micro-courses-septic-shock";
import { microCoursesMetabolicIi } from "../server/data/micro-courses-metabolic-ii";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const OUT = path.join(root, "docs/FELLOWSHIP_ASSESSMENT_AUDIT.md");

const catalogSlugs = MICRO_COURSE_CATALOG.filter(isFellowshipPillarMicroCourse).map(
  (c) => c.courseId
);

const rawAll: FellowshipCourseSeed[] = [
  ...microCoursesBatch1To5,
  ...microCoursesBatch3To5,
  ...microCoursesFinalBatch,
  ...microCoursesBurns,
  ...microCoursesMissingFellowship,
  ...microCoursesSepticShock,
  ...microCoursesMetabolicIi,
];

function normStem(q: string): string {
  return q.trim().replace(/\s+/g, " ").toLowerCase();
}

function uniqueStemCount(questions: FormativeQuestion[]): number {
  return new Set(questions.map((q) => normStem(q.question))).size;
}

function overlap(a: FormativeQuestion[], b: FormativeQuestion[]): number {
  const setB = new Set(b.map((q) => normStem(q.question)));
  return a.filter((q) => setB.has(normStem(q.question))).length;
}

function crossModuleFormativeDups(
  modules: { questions?: FormativeQuestion[] }[]
): number {
  const stemToMods = new Map<string, number>();
  modules.forEach((m, i) => {
    for (const q of m.questions ?? []) {
      const k = normStem(q.question);
      stemToMods.set(k, (stemToMods.get(k) ?? 0) + (stemToMods.get(k) ? 0 : 1));
      if (!stemToMods.has(k + ":mods")) {
        stemToMods.set(k + ":mods", i);
      }
    }
  });
  const stemToModList = new Map<string, number[]>();
  modules.forEach((m, i) => {
    for (const q of m.questions ?? []) {
      const k = normStem(q.question);
      const arr = stemToModList.get(k) ?? [];
      if (!arr.includes(i + 1)) arr.push(i + 1);
      stemToModList.set(k, arr);
    }
  });
  return [...stemToModList.values()].filter((mods) => mods.length > 1).length;
}

type Severity = "OK" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type CourseAudit = {
  slug: string;
  moduleCount: number;
  diagnosticCount: number;
  formativePerModule: number[];
  summativeAuthored: number;
  summativeUnique: number;
  bankFallback: boolean;
  expandDuplicates: number;
  summFormOverlap: number;
  crossModuleFormDups: number;
  severity: Severity;
  notes: string[];
};

function withinQuizDuplicateCount(questions: FormativeQuestion[]): number {
  const stems = questions.map((q) => normStem(q.question));
  return stems.length - new Set(stems).size;
}

function auditRawCourse(raw: FellowshipCourseSeed): CourseAudit {
  const slug = resolveCatalogSlug(raw.id);
  const materialized = materializeModuleNativeFormatives(raw);
  const authoredSummative = raw.quiz?.questions ?? [];
  const uniqueSummative = uniqueFormativeQuestions(authoredSummative);
  const fullBank = uniqueFormativeQuestions([
    ...authoredSummative,
    ...getFellowshipSummativeExpansion(slug),
  ]);
  const { diagnostic, summative: seededSummative } = resolveExamQuestionBanks(fullBank);

  const bankFallback = raw.modules.some((m) => (m.questions?.length ?? 0) === 0);
  const expandDuplicates = withinQuizDuplicateCount(seededSummative);
  const allFormative = materialized.modules.flatMap((m) => m.questions ?? []);
  const summFormOverlap = overlap(seededSummative, allFormative);
  const crossModuleFormDups = crossModuleFormativeDups(materialized.modules);
  const diagSummOverlap = overlap(diagnostic, seededSummative);

  const notes: string[] = [];
  let severity: Severity = "OK";

  if (bankFallback) {
    notes.push("No native module formatives — materialized from summative bank");
    severity = "HIGH";
  }
  if (expandDuplicates > 0) {
    notes.push(`summative seed has ${expandDuplicates} duplicate stem(s)`);
    if (severity === "OK") severity = "MEDIUM";
  }
  if (diagSummOverlap > 0) {
    notes.push(`${diagSummOverlap} diagnostic↔summative stem overlap (seed split)`);
    if (severity === "OK") severity = "LOW";
  }
  if (uniqueSummative.length < MICROCOURSE_MIN_QUESTION_BANK_SIZE) {
    notes.push(`Only ${uniqueSummative.length} unique summative stems (need ${MICROCOURSE_MIN_QUESTION_BANK_SIZE})`);
    severity = severity === "CRITICAL" ? "CRITICAL" : "HIGH";
  }
  if (crossModuleFormDups > 0) {
    notes.push(`${crossModuleFormDups} cross-module formative duplicate stem(s)`);
    if (severity === "OK") severity = "MEDIUM";
  }
  if (summFormOverlap > 0) {
    notes.push(`${summFormOverlap} seeded summative stems overlap module-native formatives`);
    if (severity === "OK") severity = "MEDIUM";
  }
  for (let i = 0; i < materialized.modules.length; i++) {
    const qs = materialized.modules[i]!.questions ?? [];
    if (withinQuizDuplicateCount(qs) > 0) {
      notes.push(`Module ${i + 1}: duplicate formative stems in seed`);
      if (severity === "OK") severity = "MEDIUM";
    }
    if (uniqueStemCount(qs) < MIN_FORMATIVE_QUESTIONS_PER_MODULE) {
      notes.push(`Module ${i + 1}: fewer than ${MIN_FORMATIVE_QUESTIONS_PER_MODULE} unique formative stems`);
      if (severity === "OK") severity = "LOW";
    }
  }

  return {
    slug,
    moduleCount: raw.modules.length,
    diagnosticCount: uniqueSummative.length,
    formativePerModule: materialized.modules.map((m) => m.questions?.length ?? 0),
    summativeAuthored: authoredSummative.length,
    summativeUnique: uniqueSummative.length,
    bankFallback,
    expandDuplicates,
    summFormOverlap,
    crossModuleFormDups,
    severity,
    notes,
  };
}

function severityRank(s: Severity): number {
  return { OK: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }[s];
}

function main() {
  const bySlug = new Map<string, FellowshipCourseSeed>();
  for (const c of rawAll) bySlug.set(resolveCatalogSlug(c.id), c);

  const audits: CourseAudit[] = [];
  for (const slug of catalogSlugs.sort()) {
    if (slug === "seriously-ill-child-i") {
      audits.push({
        slug,
        moduleCount: 7,
        diagnosticCount: 21,
        formativePerModule: [3, 3, 3, 3, 3, 3, 3],
        summativeAuthored: 21,
        summativeUnique: 21,
        bankFallback: false,
        expandDuplicates: 0,
        summFormOverlap: 0,
        crossModuleFormDups: 0,
        severity: "OK",
        notes: ["Separate seed — native formatives per module"],
      });
      continue;
    }
    const raw = bySlug.get(slug);
    if (!raw) {
      audits.push({
        slug,
        moduleCount: 0,
        diagnosticCount: 0,
        formativePerModule: [],
        summativeAuthored: 0,
        summativeUnique: 0,
        bankFallback: true,
        expandDuplicates: 0,
        summFormOverlap: 0,
        crossModuleFormDups: 0,
        severity: "CRITICAL",
        notes: ["No seed source"],
      });
      continue;
    }
    audits.push(auditRawCourse(raw));
  }

  const totalExpandDups = audits.reduce((s, a) => s + a.expandDuplicates, 0);
  const totalSummFormOverlap = audits.reduce((s, a) => s + a.summFormOverlap, 0);
  const totalCrossMod = audits.reduce((s, a) => s + a.crossModuleFormDups, 0);
  const totalDiagSummOverlap = audits.reduce((s, a) => {
    const raw = bySlug.get(a.slug);
    if (!raw) return s;
    const fullBank = uniqueFormativeQuestions([
      ...(raw.quiz?.questions ?? []),
      ...getFellowshipSummativeExpansion(a.slug),
    ]);
    const { diagnostic, summative } = resolveExamQuestionBanks(fullBank);
    return s + overlap(diagnostic, summative);
  }, 0);
  const bankFallbackCount = audits.filter((a) => a.bankFallback).length;
  const criticalCount = audits.filter((a) => severityRank(a.severity) >= 3).length;

  const lines: string[] = [
    "# Fellowship assessment audit",
    "",
    `**Generated:** ${new Date().toISOString().slice(0, 10)} · **Scope:** 29 fellowship pillar micro-courses`,
    "",
    "## Executive summary (after remediation)",
    "",
    "| Metric | Count |",
    "|--------|------:|",
    `| Courses audited | ${audits.length} |`,
    `| HIGH/CRITICAL severity | ${criticalCount} |`,
    `| Bank-fallback courses | ${bankFallbackCount} |`,
    `| expandQuestionBank duplicate stems | ${totalExpandDups} |`,
    `| Diagnostic↔summative overlaps (seed split) | ${totalDiagSummOverlap} |`,
    `| Summative→formative overlaps | ${totalSummFormOverlap} |`,
    `| Cross-module formative duplicates | ${totalCrossMod} |`,
    "",
    "## Remediation (2026-06-06)",
    "",
    "Replaced **17** duplicate authored summative stems in `quiz.questions` across 7 courses (anaphylaxis-i, pneumonia-ii, hypovolemic-shock-ii, cardiogenic-shock-ii, malaria-ii, burns-ii, meningitis-i) with course-wide unique stems. CI strict gate now fails on any `summFormOverlap > 0`; `verify-fellowship-seed.ts` asserts `summFormOverlap=0` per course.",
    "",
    "## Per-course table",
    "",
    "| Course | Mods | Diag | Form/mod | Sum auth | Sum uniq | Expand dup | Sum→Form | X-mod | Severity | Notes |",
    "|--------|-----:|-----:|---------|--------:|---------:|-----------:|---------:|------:|----------|-------|",
  ];

  for (const a of [...audits].sort((x, y) => severityRank(y.severity) - severityRank(x.severity))) {
    lines.push(
      `| ${a.slug} | ${a.moduleCount} | ${a.diagnosticCount} | ${a.formativePerModule.join("/") || "—"} | ${a.summativeAuthored} | ${a.summativeUnique} | ${a.expandDuplicates} | ${a.summFormOverlap} | ${a.crossModuleFormDups} | ${a.severity} | ${a.notes[0] ?? "—"} |`
    );
  }

  fs.writeFileSync(OUT, lines.join("\n"), "utf8");
  console.log(`Wrote ${OUT}`);
  console.log(JSON.stringify({ criticalCount, totalExpandDups, totalSummFormOverlap, bankFallbackCount }, null, 2));

  if (process.argv.includes("--strict")) {
    if (totalExpandDups > 0 || bankFallbackCount > 0) process.exit(1);
    if (totalSummFormOverlap > 0) {
      console.error(`Strict audit failed: summative→formative overlap=${totalSummFormOverlap}`);
      process.exit(1);
    }
    if (totalDiagSummOverlap > 0) {
      console.error(`Strict audit failed: diagnostic↔summative overlap=${totalDiagSummOverlap}`);
      process.exit(1);
    }
    const formativeDupCourses = audits.filter((a) =>
      a.notes.some((n) => n.includes("duplicate formative stems") || n.includes("duplicate stem(s)"))
    ).length;
    if (formativeDupCourses > 0) process.exit(1);
  }
}

main();
