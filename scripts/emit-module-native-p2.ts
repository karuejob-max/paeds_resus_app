/**
 * Emit fellowship-summative-expansions-p2.ts — module-native REPHRASED stems (disjoint from formatives).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getAllFellowshipSeedContent, resolveCatalogSlug } from "./fellowship-seed-lib";
import {
  MICROCOURSE_FULL_QUESTION_BANK_SIZE,
  rephraseFormativeStemForSummative,
  uniqueFormativeQuestions,
  type FormativeQuestion,
} from "../shared/microcourse-exam-policy";
import { FELLOWSHIP_SUMMATIVE_EXPANSIONS } from "../server/data/fellowship-summative-expansions";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../server/data/fellowship-summative-expansions-p2.ts");

const SKIP_REGEN = new Set(["seriously-ill-child-i"]);

function norm(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

function escapeStr(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function fmtQuestion(q: FormativeQuestion): string {
  const opts = q.options.map((o) => `'${escapeStr(o)}'`).join(", ");
  return `{ question: '${escapeStr(q.question)}', options: [${opts}], correct: ${q.correct}, explanation: '${escapeStr(q.explanation ?? "")}' }`;
}

/** Rephrase formative stem so summative bank stays disjoint but tests same module teaching. */
function rephraseForSummative(q: FormativeQuestion, _modNum: number): FormativeQuestion {
  return { ...q, question: rephraseFormativeStemForSummative(q.question) };
}

function buildP2(
  modules: { questions?: FormativeQuestion[] }[],
  authored: FormativeQuestion[],
  keepP2: FormativeQuestion[]
): FormativeQuestion[] {
  const authoredStems = new Set(authored.map((q) => norm(q.question)));
  const formativeStems = new Set(
    modules.flatMap((m) => (m.questions ?? []).map((q) => norm(q.question)))
  );
  const fromModules: FormativeQuestion[] = [];
  modules.forEach((m, i) => {
    for (const q of m.questions ?? []) {
      const rephrased = rephraseForSummative(q, i + 1);
      if (authoredStems.has(norm(rephrased.question))) continue;
      if (formativeStems.has(norm(rephrased.question))) continue;
      fromModules.push(rephrased);
    }
  });
  const unique = uniqueFormativeQuestions(fromModules);
  const out = unique.slice(0, 10);
  if (out.length < 10) {
    for (const q of keepP2) {
      if (out.length >= 10) break;
      if (!out.some((u) => norm(u.question) === norm(q.question))) {
        if (!formativeStems.has(norm(q.question))) out.push(q);
      }
    }
  }
  return out.slice(0, 10);
}

const bySlug = new Map(
  getAllFellowshipSeedContent().map((c) => [resolveCatalogSlug(c.id), c])
);

const { FELLOWSHIP_SUMMATIVE_EXPANSIONS_P2: existingP2 } = await import(
  "../server/data/fellowship-summative-expansions-p2"
);

const generated: Record<string, FormativeQuestion[]> = {};

for (const [slug, course] of bySlug) {
  if (SKIP_REGEN.has(slug)) continue;
  if (slug === "asthma-i" || slug === "asthma-ii") {
    generated[slug] = existingP2[slug] ?? [];
    continue;
  }
  generated[slug] = buildP2(
    course.modules,
    course.quiz?.questions ?? [],
    existingP2[slug] ?? []
  );
}

let thin = 0;
let summFormOverlap = 0;
for (const [slug, course] of bySlug) {
  if (slug === "seriously-ill-child-i") continue;
  const bank = uniqueFormativeQuestions([
    ...(course.quiz?.questions ?? []),
    ...(FELLOWSHIP_SUMMATIVE_EXPANSIONS[slug] ?? []),
    ...(generated[slug] ?? []),
  ]);
  if (bank.length < MICROCOURSE_FULL_QUESTION_BANK_SIZE) {
    console.error(`THIN ${slug}: ${bank.length}`);
    thin++;
  }
  const allFormative = course.modules.flatMap((m) => m.questions ?? []);
  const { summative } = await import("../shared/microcourse-exam-policy").then((m) =>
    m.resolveExamQuestionBanks(bank)
  );
  const formSet = new Set(allFormative.map((q) => norm(q.question)));
  const overlap = summative.filter((q) => formSet.has(norm(q.question))).length;
  summFormOverlap += overlap;
  if (overlap > 0) console.error(`OVERLAP ${slug}: ${overlap}`);
}

const slugs = Object.keys(generated).sort();
const body = slugs
  .map((slug) => {
    const qs = generated[slug]!;
    const lines = qs.map((q) => `    ${fmtQuestion(q)},`).join("\n");
    return `  "${slug}": [\n${lines}\n  ],`;
  })
  .join("\n");

const file = `import type { FormativeQuestion } from "../../shared/microcourse-exam-policy";

/** Module-native summative expansion stems (10 per course) — rephrased disjoint from formatives. */
export const FELLOWSHIP_SUMMATIVE_EXPANSIONS_P2: Record<string, FormativeQuestion[]> = {
${body}
};
`;

fs.writeFileSync(OUT, file);
console.log(`Wrote ${OUT} (${slugs.length} courses, thin=${thin}, summFormOverlap=${summFormOverlap})`);
if (thin > 0 || summFormOverlap > 0) process.exit(1);
