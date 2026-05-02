/**
 * fix-2020-refs.ts
 * Replace all "2020" AHA guideline references with "2025" in:
 *   - moduleSections.content
 *   - quizQuestions.question, explanation, correctAnswer
 *
 * Run: npx tsx fix-2020-refs.ts
 */
import * as mysql from 'mysql2/promise';

// Ordered from most specific to least specific to avoid double-replacement
const REPLACEMENTS: [RegExp, string][] = [
  // "AHA 2020 guidelines" variants (most common in DB)
  [/AHA 2020 guidelines/gi, 'AHA 2025 guidelines'],
  [/AHA 2020 Guidelines/g, 'AHA 2025 Guidelines'],
  // "the 2020 guideline" / "2020 guideline"
  [/the 2020 guideline/gi, 'the 2025 guideline'],
  [/\b2020 guideline/gi, '2025 guideline'],
  // "AHA 2020:" shorthand (used in explanations)
  [/AHA 2020:/g, 'AHA 2025:'],
  // "the 2020 AHA" / "2020 AHA"
  [/the 2020 AHA/gi, 'the 2025 AHA'],
  [/\b2020 AHA\b/gi, '2025 AHA'],
  // "2020 American Heart Association"
  [/2020 American Heart Association/gi, '2025 American Heart Association'],
  // Parenthetical year
  [/\(2020\)/g, '(2025)'],
  // "updated in 2020" / "based on 2020" / "per 2020"
  [/updated in 2020/gi, 'updated in 2025'],
  [/based on 2020/gi, 'based on 2025'],
  [/per 2020/gi, 'per 2025'],
  [/per the 2020/gi, 'per the 2025'],
  [/according to 2020/gi, 'according to 2025'],
  [/reflect 2020/gi, 'reflect 2025'],
  [/reflects 2020/gi, 'reflects 2025'],
  [/2020 update/gi, '2025 update'],
  [/2020 revision/gi, '2025 revision'],
];

function applyReplacements(text: string): { result: string; changed: boolean } {
  if (!text) return { result: text, changed: false };
  let result = text;
  for (const [pattern, replacement] of REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return { result, changed: result !== text };
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');

  const conn = await mysql.createConnection(url);
  console.log('Connected to database');

  let totalUpdates = 0;

  // ── 1. moduleSections.content ──────────────────────────────────────────────
  console.log('\n--- Scanning moduleSections.content ---');
  const [sections] = await conn.execute<any[]>(
    `SELECT ms.id, ms.content FROM moduleSections ms
     INNER JOIN modules m ON ms.moduleId = m.id
     INNER JOIN courses c ON m.courseId = c.id
     WHERE c.programType IN ('bls','acls','pals','heartsaver')
       AND ms.content LIKE '%2020%'`
  );
  console.log(`Found ${sections.length} sections with "2020"`);
  for (const row of sections) {
    const { result, changed } = applyReplacements(row.content ?? '');
    if (changed) {
      await conn.execute('UPDATE moduleSections SET content = ? WHERE id = ?', [result, row.id]);
      console.log(`  ✓ Updated section id=${row.id}`);
      totalUpdates++;
    } else {
      console.log(`  ~ Section id=${row.id}: no pattern matched (check manually)`);
    }
  }

  // ── 2. quizQuestions ──────────────────────────────────────────────────────
  console.log('\n--- Scanning quizQuestions ---');
  const [qqs] = await conn.execute<any[]>(
    `SELECT qq.id, qq.question, qq.explanation, qq.correctAnswer
     FROM quizQuestions qq
     INNER JOIN quizzes q ON qq.quizId = q.id
     INNER JOIN modules m ON q.moduleId = m.id
     INNER JOIN courses c ON m.courseId = c.id
     WHERE c.programType IN ('bls','acls','pals','heartsaver')
       AND (qq.question LIKE '%2020%' OR qq.explanation LIKE '%2020%' OR qq.correctAnswer LIKE '%2020%')`
  );
  console.log(`Found ${qqs.length} quiz questions with "2020"`);
  for (const row of qqs) {
    const qRes = applyReplacements(row.question ?? '');
    const eRes = applyReplacements(row.explanation ?? '');
    const cRes = applyReplacements(row.correctAnswer ?? '');
    if (qRes.changed || eRes.changed || cRes.changed) {
      await conn.execute(
        'UPDATE quizQuestions SET question = ?, explanation = ?, correctAnswer = ? WHERE id = ?',
        [qRes.result, eRes.result, cRes.result, row.id]
      );
      console.log(`  ✓ Updated quizQuestion id=${row.id}`);
      totalUpdates++;
    } else {
      console.log(`  ~ QuizQuestion id=${row.id}: no pattern matched`);
      // Print what the 2020 context is for manual review
      const fields = [row.question, row.explanation, row.correctAnswer].filter(f => f?.includes('2020'));
      for (const f of fields) {
        const idx = f.indexOf('2020');
        console.log('    Context:', f.substring(Math.max(0, idx - 40), idx + 60));
      }
    }
  }

  await conn.end();
  console.log(`\nDone. Total rows updated: ${totalUpdates}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
