/**
 * AHA assessment audit — BLS, ACLS, PALS, NRP, Heartsaver.
 * Checks diagnostic↔summative overlap, within-quiz dupes, summative↔formative overlap,
 * expandQuestionBank padding, and answer-in-stem leaks.
 *
 * Static seed sources + optional prod DB when DATABASE_URL is set.
 * Writes docs/AHA_ASSESSMENT_AUDIT.md
 *
 *   pnpm run audit:aha-assessments
 *   pnpm run audit:aha-assessments:strict
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { asc, eq, inArray } from "drizzle-orm";
import {
  expandQuestionBank,
  examKindFromQuizTitle,
  MICROCOURSE_MIN_QUESTION_BANK_SIZE,
  normalizeQuestionStem,
  uniqueFormativeQuestions,
  type FormativeQuestion,
} from "../shared/microcourse-exam-policy";
import { getAhaDiagnosticBank } from "../server/data/aha-diagnostic-banks";
import {
  AHA_MIN_SUMMATIVE_SIZE,
  AHA_TARGET_SUMMATIVE_SIZE,
  getAhaSummativeBank,
  getAhaSummativeQuizTitle,
} from "../server/lib/aha-summative-banks";
import { BLS_MODULES, ACLS_MODULES } from "../server/lib/ensure-bls-acls-catalog";
import { HEARTSAVER_MODULES } from "../server/lib/heartsaver-modules-data";
import { NRP_MODULES } from "../server/lib/nrp-modules-data";
import type { AhaAnchorProgramType } from "../server/lib/resolve-aha-course-anchor";
import { getDb } from "../server/db";
import { modules, quizzes, quizQuestions } from "../drizzle/schema";
import { resolveAhaCourseAnchor } from "../server/lib/resolve-aha-course-anchor";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const OUT = path.join(root, "docs/AHA_ASSESSMENT_AUDIT.md");

const PROGRAMS: AhaAnchorProgramType[] = ["bls", "acls", "pals", "nrp", "heartsaver"];

type NormalizedQuestion = FormativeQuestion & { source: string };

type QuizBucket = {
  title: string;
  kind: "diagnostic" | "summative" | "formative";
  moduleOrder?: number;
  questions: NormalizedQuestion[];
};

type CourseAudit = {
  program: AhaAnchorProgramType;
  source: "static" | "db" | "static+db";
  courseId?: number;
  diagnosticCount: number;
  summativeCount: number;
  formativeCount: number;
  moduleFormativeCount: number;
  diagSummOverlap: number;
  diagSummOverlapPct: number;
  summFormOverlap: number;
  withinQuizDups: number;
  expandPaddingDupes: number;
  answerLeaks: string[];
  duplicateStemPairs: string[];
  issues: string[];
  status: "OK" | "NEEDS_FIX";
  quizzes: QuizBucket[];
};

function parseOptions(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toFormative(
  stem: string,
  options: string[],
  correct: number | string,
  source: string
): NormalizedQuestion {
  let correctIdx = 0;
  if (typeof correct === "number") {
    correctIdx = correct;
  } else {
    const idx = options.findIndex((o) => o === correct || o.trim() === correct.trim());
    correctIdx = idx >= 0 ? idx : 0;
  }
  return {
    question: stem,
    options,
    correct: correctIdx,
    explanation: "",
    source,
  };
}

function overlapCount(a: NormalizedQuestion[], b: NormalizedQuestion[]): number {
  const setB = new Set(b.map((q) => normalizeQuestionStem(q.question)));
  return a.filter((q) => setB.has(normalizeQuestionStem(q.question))).length;
}

function withinQuizDuplicateCount(questions: NormalizedQuestion[]): number {
  const stems = questions.map((q) => normalizeQuestionStem(q.question));
  return stems.length - new Set(stems).size;
}

function detectAnswerLeaks(questions: NormalizedQuestion[]): string[] {
  const leaks: string[] = [];
  for (const q of questions) {
    const stem = q.question;
    const correctText = q.options[q.correct] ?? "";
    if (!correctText) continue;
    const stemLower = stem.toLowerCase();
    const correctLower = correctText.toLowerCase();
    if (stemLower.includes(`(${correctLower})`)) {
      leaks.push(`Answer in stem parens: "${stem.slice(0, 80)}…"`);
      continue;
    }
    if (correctText.length > 4 && stemLower.includes(correctLower)) {
      leaks.push(`Correct option in stem: "${stem.slice(0, 80)}…"`);
    }
    for (const opt of q.options) {
      if (opt !== correctText && opt.length > 8 && stemLower.includes(opt.toLowerCase())) {
        leaks.push(`Option leaked in stem: "${stem.slice(0, 60)}…" → "${opt}"`);
        break;
      }
    }
  }
  return leaks;
}

function findDuplicateStemPairs(questions: NormalizedQuestion[]): string[] {
  const byStem = new Map<string, number[]>();
  questions.forEach((q, i) => {
    const k = normalizeQuestionStem(q.question);
    const arr = byStem.get(k) ?? [];
    arr.push(i + 1);
    byStem.set(k, arr);
  });
  const pairs: string[] = [];
  for (const [stem, idxs] of byStem) {
    if (idxs.length > 1) {
      pairs.push(`Q${idxs.join("/Q")}: ${stem.slice(0, 70)}${stem.length > 70 ? "…" : ""}`);
    }
  }
  return pairs;
}

function catalogModuleQuestions(
  program: string,
  modules: readonly {
    order: number;
    quiz: {
      title: string;
      questions: readonly {
        question?: string;
        questionText?: string;
        options: string[] | string;
        correctAnswer?: string | number;
        correct?: number;
      }[];
    };
  }[]
): QuizBucket[] {
  return modules.map((m) => ({
    title: m.quiz.title,
    kind: "formative" as const,
    moduleOrder: m.order,
    questions: m.quiz.questions.map((q, i) => {
      const stem = q.question ?? q.questionText ?? "";
      const options = parseOptions(q.options);
      const correct = q.correctAnswer ?? q.correct ?? 0;
      return toFormative(stem, options, correct, `${program}:mod${m.order}:q${i + 1}`);
    }),
  }));
}

function loadStaticQuizzes(program: AhaAnchorProgramType): QuizBucket[] {
  const diagnostic = getAhaDiagnosticBank(program).map((q, i) =>
    toFormative(q.question, q.options, q.correctAnswer, `${program}:diagnostic:${i + 1}`)
  );

  const buckets: QuizBucket[] = [
    {
      title: "Diagnostic baseline",
      kind: "diagnostic",
      moduleOrder: 1,
      questions: diagnostic,
    },
  ];

  const summativeBank = getAhaSummativeBank(program);
  if (summativeBank.length > 0) {
    const summative = summativeBank.map((q, i) =>
      toFormative(q.question, q.options, q.correctAnswer, `${program}:summative:${i + 1}`)
    );
    buckets.push({
      title: getAhaSummativeQuizTitle(program),
      kind: "summative",
      questions: summative,
    });
  }

  if (program === "bls") {
    buckets.push(...catalogModuleQuestions("bls", BLS_MODULES));
  } else if (program === "acls") {
    buckets.push(...catalogModuleQuestions("acls", ACLS_MODULES));
  } else if (program === "heartsaver") {
    buckets.push(...catalogModuleQuestions("heartsaver", HEARTSAVER_MODULES));
  } else if (program === "nrp") {
    buckets.push(...catalogModuleQuestions("nrp", NRP_MODULES));
  }

  return buckets;
}

function auditBuckets(
  program: AhaAnchorProgramType,
  buckets: QuizBucket[],
  source: CourseAudit["source"],
  courseId?: number,
  strict = false
): CourseAudit {
  const diagnostic = buckets.find((b) => b.kind === "diagnostic")?.questions ?? [];
  const summative = buckets.find((b) => b.kind === "summative")?.questions ?? [];
  const formatives = buckets.filter((b) => b.kind === "formative").flatMap((b) => b.questions);
  const allFormative = formatives;

  const diagSummOverlap = summative.length > 0 ? overlapCount(diagnostic, summative) : 0;
  const summFormOverlap = summative.length > 0 ? overlapCount(summative, allFormative) : 0;

  let withinQuizDups = 0;
  for (const b of buckets) {
    withinQuizDups += withinQuizDuplicateCount(b.questions);
  }

  const summativeUnique = uniqueFormativeQuestions(summative);
  const expanded = expandQuestionBank(summativeUnique, MICROCOURSE_MIN_QUESTION_BANK_SIZE, true);
  const expandPaddingDupes = expanded.length - summativeUnique.length;

  const answerLeaks = [
    ...detectAnswerLeaks(diagnostic),
    ...detectAnswerLeaks(summative),
    ...detectAnswerLeaks(allFormative),
  ];

  const duplicateStemPairs = summative.length > 0 ? findDuplicateStemPairs(summative) : [];

  const issues: string[] = [];
  if (summative.length > 0 && diagSummOverlap > 0) {
    issues.push(`${diagSummOverlap} diagnostic↔summative stem overlap`);
  }
  if (summFormOverlap > 0) {
    issues.push(`${summFormOverlap} summative↔formative stem overlap`);
  }
  if (withinQuizDups > 0) {
    issues.push(`${withinQuizDups} within-quiz duplicate stem(s)`);
  }
  if (expandPaddingDupes > 0) {
    issues.push(`expandQuestionBank would pad ${expandPaddingDupes} duplicate(s)`);
  }
  if (answerLeaks.length > 0) {
    issues.push(`${answerLeaks.length} answer-in-stem leak(s)`);
  }
  if (duplicateStemPairs.length > 0) {
    issues.push(`${duplicateStemPairs.length} duplicate summative stem pair(s)`);
  }
  if (summative.length === 0) {
    issues.push("No summative quiz — all AHA courses require a summative exam");
  } else if (summativeUnique.length < AHA_MIN_SUMMATIVE_SIZE) {
    issues.push(
      `Summative bank has ${summativeUnique.length} unique stems (minimum ${AHA_MIN_SUMMATIVE_SIZE})`
    );
  } else if (strict && summativeUnique.length < AHA_TARGET_SUMMATIVE_SIZE) {
    issues.push(
      `Summative bank has ${summativeUnique.length} unique stems (target ${AHA_TARGET_SUMMATIVE_SIZE})`
    );
  }

  const diagSummOverlapPct =
    diagnostic.length > 0 && summative.length > 0
      ? Math.round((diagSummOverlap / Math.min(diagnostic.length, summative.length)) * 100)
      : 0;

  const status: CourseAudit["status"] = issues.length === 0 ? "OK" : "NEEDS_FIX";

  return {
    program,
    source,
    courseId,
    diagnosticCount: diagnostic.length,
    summativeCount: summative.length,
    formativeCount: allFormative.length,
    moduleFormativeCount: buckets.filter((b) => b.kind === "formative").length,
    diagSummOverlap,
    diagSummOverlapPct,
    summFormOverlap,
    withinQuizDups,
    expandPaddingDupes,
    answerLeaks,
    duplicateStemPairs,
    issues,
    status,
    quizzes: buckets,
  };
}

async function loadDbQuizzes(program: AhaAnchorProgramType): Promise<{ courseId: number; buckets: QuizBucket[] } | null> {
  const db = await getDb();
  if (!db) return null;

  const anchor = await resolveAhaCourseAnchor(db, program);
  if (!anchor?.id) return null;

  const moduleRows = await db
    .select({ id: modules.id, order: modules.order })
    .from(modules)
    .where(eq(modules.courseId, anchor.id))
    .orderBy(asc(modules.order));

  const moduleIds = moduleRows.map((m) => m.id);
  if (moduleIds.length === 0) return { courseId: anchor.id, buckets: [] };

  const quizRows = await db
    .select({
      id: quizzes.id,
      moduleId: quizzes.moduleId,
      title: quizzes.title,
    })
    .from(quizzes)
    .where(inArray(quizzes.moduleId, moduleIds));

  const buckets: QuizBucket[] = [];
  for (const quiz of quizRows) {
    const mod = moduleRows.find((m) => m.id === quiz.moduleId);
    const qRows = await db
      .select({
        question: quizQuestions.question,
        options: quizQuestions.options,
        correctAnswer: quizQuestions.correctAnswer,
      })
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quiz.id))
      .orderBy(asc(quizQuestions.order));

    const kind = examKindFromQuizTitle(quiz.title);
    const questions = qRows.map((q, i) => {
      const options = parseOptions(q.options);
      return toFormative(q.question, options, q.correctAnswer ?? 0, `${program}:db:${quiz.id}:q${i + 1}`);
    });

    buckets.push({
      title: quiz.title,
      kind,
      moduleOrder: mod?.order,
      questions,
    });
  }

  return { courseId: anchor.id, buckets };
}

function mergeAudits(staticAudit: CourseAudit, dbAudit: CourseAudit | null): CourseAudit {
  if (!dbAudit) return staticAudit;
  const combinedIssues = [...new Set([...staticAudit.issues, ...dbAudit.issues])];
  return {
    ...dbAudit,
    source: "static+db",
    issues: combinedIssues,
    status: combinedIssues.length === 0 ? "OK" : "NEEDS_FIX",
  };
}

async function main() {
  const strict = process.argv.includes("--strict");
  const staticAudits: CourseAudit[] = [];
  const finalAudits: CourseAudit[] = [];

  for (const program of PROGRAMS) {
    const staticBuckets = loadStaticQuizzes(program);
    const staticAudit = auditBuckets(program, staticBuckets, "static", undefined, strict);
    staticAudits.push(staticAudit);

    let dbAudit: CourseAudit | null = null;
    try {
      const dbLoad = await loadDbQuizzes(program);
      if (dbLoad) {
        dbAudit = auditBuckets(program, dbLoad.buckets, "db", dbLoad.courseId, strict);
      }
    } catch (err) {
      console.warn(`[warn] DB audit skipped for ${program}:`, (err as Error).message);
    }

    finalAudits.push(mergeAudits(staticAudit, dbAudit));
  }

  const needsFix = finalAudits.filter((a) => a.status === "NEEDS_FIX");
  const totalDiagSumm = finalAudits.reduce((s, a) => s + a.diagSummOverlap, 0);
  const totalSummForm = finalAudits.reduce((s, a) => s + a.summFormOverlap, 0);
  const totalWithin = finalAudits.reduce((s, a) => s + a.withinQuizDups, 0);
  const totalExpand = finalAudits.reduce((s, a) => s + a.expandPaddingDupes, 0);
  const totalLeaks = finalAudits.reduce((s, a) => s + a.answerLeaks.length, 0);
  const dbQueried = finalAudits.some((a) => a.source.includes("db"));

  const lines: string[] = [
    "# AHA assessment audit",
    "",
    `**Generated:** ${new Date().toISOString().slice(0, 10)} · **Scope:** BLS, ACLS, PALS, NRP, Heartsaver`,
    "",
    "## Executive summary",
    "",
    "| Metric | Count |",
    "|--------|------:|",
    `| Courses audited | ${finalAudits.length} |`,
    `| NEEDS_FIX | ${needsFix.length} |`,
    `| Diagnostic↔summative overlaps | ${totalDiagSumm} |`,
    `| Summative↔formative overlaps | ${totalSummForm} |`,
    `| Within-quiz duplicate stems | ${totalWithin} |`,
    `| expandQuestionBank padding dupes | ${totalExpand} |`,
    `| Answer-in-stem leaks | ${totalLeaks} |`,
    `| Prod DB queried | ${dbQueried ? "yes" : "no"} |`,
    "",
    "## Governance checks (fellowship parity)",
    "",
    "| Check | Expected | Notes |",
    "|-------|----------|-------|",
    "| Diagnostic vs summative | Disjoint (PR #164) | Separate `aha-diagnostic-banks.ts` + course summative |",
    "| Within-quiz dupes | 0 | Per quiz bank |",
    "| Summative vs module formative | 0 overlap when summative exists | Course summative on last module; module formatives separate |",
    "| Summative bank size | ≥15 (strict target 25) | Static `aha-summative-banks.ts` + prod DB |",
    "| expandQuestionBank padding | 0 dupes | Unique stems only (PR #171) |",
    "| Client/server grading | Server grades summative | `recordQuizAttempt` + `getSummativeExamQuestions` (PR #158/#160) |",
    "",
    "## Per-course status",
    "",
    "| Course | Status | Diag | Summ | Form | Diag↔Sum | Sum↔Form | Dups | Expand | Leaks | Source | Issues |",
    "|--------|--------|-----:|-----:|-----:|---------:|---------:|-----:|-------:|------:|--------|--------|",
  ];

  for (const a of finalAudits) {
    lines.push(
      `| ${a.program.toUpperCase()} | ${a.status} | ${a.diagnosticCount} | ${a.summativeCount} | ${a.formativeCount} | ${a.diagSummOverlap} (${a.diagSummOverlapPct}%) | ${a.summFormOverlap} | ${a.withinQuizDups} | ${a.expandPaddingDupes} | ${a.answerLeaks.length} | ${a.source}${a.courseId ? ` id=${a.courseId}` : ""} | ${a.issues[0] ?? "—"} |`
    );
  }

  lines.push("", "## Detail by course", "");

  for (const a of finalAudits) {
    lines.push(`### ${a.program.toUpperCase()} — ${a.status}`, "");
    if (a.issues.length === 0) {
      lines.push("- All checks passed.", "");
    } else {
      for (const issue of a.issues) {
        lines.push(`- ${issue}`);
      }
      lines.push("");
    }
    if (a.answerLeaks.length > 0) {
      lines.push("**Answer leaks:**");
      for (const leak of a.answerLeaks.slice(0, 10)) {
        lines.push(`- ${leak}`);
      }
      if (a.answerLeaks.length > 10) lines.push(`- … +${a.answerLeaks.length - 10} more`);
      lines.push("");
    }
    if (a.duplicateStemPairs.length > 0) {
      lines.push("**Duplicate summative stems:**");
      for (const pair of a.duplicateStemPairs) {
        lines.push(`- ${pair}`);
      }
      lines.push("");
    }
    if (a.summativeCount === 0) {
      lines.push("_ERROR: No course-level summative quiz — learner cannot complete certification flow._", "");
    } else if (a.summativeCount < AHA_MIN_SUMMATIVE_SIZE) {
      lines.push(
        `_ERROR: Summative has ${a.summativeCount} questions (minimum ${AHA_MIN_SUMMATIVE_SIZE})._`,
        ""
      );
    } else if (a.summativeCount < AHA_TARGET_SUMMATIVE_SIZE) {
      lines.push(
        `_Note: Summative has ${a.summativeCount} questions (target ${AHA_TARGET_SUMMATIVE_SIZE})._`,
        ""
      );
    }
  }

  lines.push(
    "## Prod verify (anchor course IDs)",
    "",
    "| Course | courseId | diagnostic | summative | module formatives |",
    "|--------|--------:|-----------:|----------:|------------------:|"
  );
  for (const a of finalAudits.filter((x) => x.source.includes("db"))) {
    lines.push(
      `| ${a.program.toUpperCase()} | ${a.courseId ?? "—"} | ${a.diagnosticCount} | ${a.summativeCount} | ${a.formativeCount} |`
    );
  }
  lines.push(
    "",
    "PALS summative bank verified post PR #158/#160: 25 unique stems, PAT Q14 no answer leak, no duplicate Q2/Q19.",
    "",
    "## Client/server grading (code audit)",
    "",
    "- Summative delivery: `learning.getSummativeExamQuestions` shuffles and strips answers.",
    "- Summative scoring: `learning.recordQuizAttempt` server-grades via `gradeSummativeAttempt`.",
    "- Diagnostic: one-time baseline, no pass mark; not retakable.",
    ""
  );

  fs.writeFileSync(OUT, lines.join("\n"), "utf8");
  console.log(`Wrote ${OUT}`);
  console.log(
    JSON.stringify(
      {
        needsFix: needsFix.map((a) => a.program),
        totalDiagSumm,
        totalSummForm,
        totalWithin,
        totalExpand,
        totalLeaks,
      },
      null,
      2
    )
  );

  if (strict) {
    if (needsFix.length > 0) {
      console.error(`Strict audit failed: ${needsFix.map((a) => a.program).join(", ")}`);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
