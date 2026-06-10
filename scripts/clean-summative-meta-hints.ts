/**
 * Remove "Course synthesis" prefixes and similar meta hints from summative expansion stems.
 * Rephrases module-derived stems so summative banks stay disjoint from formatives.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  rephraseFormativeStemForSummative,
  stripExamMetaHints,
} from "../shared/microcourse-exam-policy";
import { FELLOWSHIP_SUMMATIVE_EXPANSIONS_P2 } from "../server/data/fellowship-summative-expansions-p2";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../server/data/fellowship-summative-expansions-p2.ts");

function escapeStr(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function fmtQuestion(q: {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}): string {
  const opts = q.options.map((o) => `'${escapeStr(o)}'`).join(", ");
  return `{ question: '${escapeStr(q.question)}', options: [${opts}], correct: ${q.correct}, explanation: '${escapeStr(q.explanation)}' }`;
}

let cleaned = 0;
const updated: typeof FELLOWSHIP_SUMMATIVE_EXPANSIONS_P2 = {};

for (const [slug, questions] of Object.entries(FELLOWSHIP_SUMMATIVE_EXPANSIONS_P2)) {
  updated[slug] = questions.map((q) => {
    const before = q.question;
    const stripped = stripExamMetaHints(before);
    const rephrased = rephraseFormativeStemForSummative(stripped);
    if (before !== rephrased) cleaned++;
    return { ...q, question: rephrased };
  });
}

const slugs = Object.keys(updated).sort();
const body = slugs
  .map((slug) => {
    const lines = updated[slug]!.map((q) => `    ${fmtQuestion(q)},`).join("\n");
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
console.log(`Wrote ${OUT} — ${cleaned} stems cleaned/rephrased across ${slugs.length} courses`);
