/**
 * Fellowship simulation content audit — step count, choices, level keywords.
 * Writes docs/FELLOWSHIP_SIMULATION_AUDIT.md
 * Optional: --strict exits 1 if any course fails gates.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { FELLOWSHIP_ID_MAPPING } from "./fellowship-seed-lib";
import { FELLOWSHIP_SIMULATIONS } from "../server/lib/fellowship-simulations-data";
import {
  FELLOWSHIP_SIM_MIN_STEPS,
  fellowshipSimHasLevelKeywords,
  fellowshipSimStepText,
  type FellowshipSimStep,
} from "../shared/fellowship-simulation-types";
import {
  FELLOWSHIP_PILLAR_MICRO_COURSE_IDS,
  MICRO_COURSE_CATALOG,
} from "../shared/micro-course-catalog";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const OUT = path.join(root, "docs/FELLOWSHIP_SIMULATION_AUDIT.md");

const strict = process.argv.includes("--strict");

function catalogSlug(courseId: string): string {
  return FELLOWSHIP_ID_MAPPING[courseId] ?? courseId;
}

type AuditRow = {
  slug: string;
  level: "foundational" | "advanced";
  steps: number;
  choiceSteps: number;
  hasDebrief: boolean;
  levelKeywords: boolean;
  shallow: boolean;
  reasons: string[];
};

function auditSim(slug: string): AuditRow {
  const catalog = MICRO_COURSE_CATALOG.find((c) => c.courseId === slug);
  const level = (catalog?.level ?? "foundational") as "foundational" | "advanced";
  const sim = FELLOWSHIP_SIMULATIONS.find((s) => catalogSlug(s.courseId) === slug && s.level === level);
  const reasons: string[] = [];

  if (!sim) {
    return {
      slug,
      level,
      steps: 0,
      choiceSteps: 0,
      hasDebrief: false,
      levelKeywords: false,
      shallow: true,
      reasons: ["missing simulation data"],
    };
  }

  const ordered = sim.stepOrder.map((k) => sim.pages[k]).filter(Boolean) as FellowshipSimStep[];
  const steps = ordered.length;
  const choiceSteps = ordered.filter((s) => (s.choices?.length ?? 0) >= 2).length;
  const hasDebrief = ordered.some((s) => (s.debriefPoints?.length ?? 0) > 0);
  const fullText = ordered.map(fellowshipSimStepText).join(" ");
  const levelKeywords = fellowshipSimHasLevelKeywords(fullText, level);

  if (steps < FELLOWSHIP_SIM_MIN_STEPS) reasons.push(`steps ${steps} < min ${FELLOWSHIP_SIM_MIN_STEPS}`);
  if (choiceSteps < 3) reasons.push(`choice steps ${choiceSteps} < 3`);
  if (!hasDebrief) reasons.push("no debrief step");
  if (!levelKeywords) reasons.push(`missing ${level} level keywords`);

  const genericOnly = ordered.every(
    (s) =>
      !s.choices?.length &&
      (s.expectedActions?.every((a) => a.startsWith("assess_")) ?? true)
  );
  if (genericOnly) reasons.push("PAT-only / generic actions");

  return {
    slug,
    level,
    steps,
    choiceSteps,
    hasDebrief,
    levelKeywords,
    shallow: reasons.length > 0,
    reasons,
  };
}

function main() {
  const rows = FELLOWSHIP_PILLAR_MICRO_COURSE_IDS.map(auditSim);
  const failures = rows.filter((r) => r.shallow);

  const lines = [
    "# Fellowship simulation content audit",
    "",
    `**Generated:** ${new Date().toISOString().slice(0, 10)} · **Scope:** ${rows.length} fellowship pillar micro-courses`,
    "",
    "## Summary",
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Courses audited | ${rows.length} |`,
    `| Passing | ${rows.length - failures.length} |`,
    `| Failing | ${failures.length} |`,
    `| Min steps gate | ${FELLOWSHIP_SIM_MIN_STEPS} |`,
    "",
    "## Per-course",
    "",
    "| Slug | Level | Steps | Choice steps | Debrief | Level keywords | Status | Gap |",
    "|------|-------|-------|--------------|---------|----------------|--------|-----|",
  ];

  for (const r of rows) {
    lines.push(
      `| ${r.slug} | ${r.level} | ${r.steps} | ${r.choiceSteps} | ${r.hasDebrief ? "✓" : "—"} | ${r.levelKeywords ? "✓" : "—"} | ${r.shallow ? "FAIL" : "OK"} | ${r.reasons.join("; ") || "—"} |`
    );
  }

  lines.push("");
  fs.writeFileSync(OUT, lines.join("\n"), "utf8");
  console.log(`Wrote ${OUT}`);
  console.log(`Pass: ${rows.length - failures.length}/${rows.length}`);

  if (strict && failures.length > 0) {
    console.error(`Strict audit failed: ${failures.map((f) => f.slug).join(", ")}`);
    process.exit(1);
  }
}

main();
