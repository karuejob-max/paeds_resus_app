/**
 * show-2020-context.ts
 * Print the exact text around each "2020" occurrence in the DB
 */
import * as mysql from 'mysql2/promise';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const conn = await mysql.createConnection(url);

  // Sections
  const [sections] = await conn.execute<any[]>(
    `SELECT ms.id, SUBSTRING(ms.content, 1, 2000) as snippet FROM moduleSections ms
     INNER JOIN modules m ON ms.moduleId = m.id
     INNER JOIN courses c ON m.courseId = c.id
     WHERE c.programType IN ('bls','acls','pals','heartsaver')
       AND ms.content LIKE '%2020%'`
  );
  console.log(`\n=== SECTIONS (${sections.length}) ===`);
  for (const s of sections) {
    const idx = s.snippet.indexOf('2020');
    const ctx = s.snippet.substring(Math.max(0, idx - 80), idx + 120);
    console.log(`\nSection id=${s.id}:`);
    console.log(ctx);
  }

  // Quiz questions
  const [qqs] = await conn.execute<any[]>(
    `SELECT qq.id, qq.question, qq.explanation, qq.correctAnswer
     FROM quizQuestions qq
     INNER JOIN quizzes q ON qq.quizId = q.id
     INNER JOIN modules m ON q.moduleId = m.id
     INNER JOIN courses c ON m.courseId = c.id
     WHERE c.programType IN ('bls','acls','pals','heartsaver')
       AND (qq.question LIKE '%2020%' OR qq.explanation LIKE '%2020%' OR qq.correctAnswer LIKE '%2020%')`
  );
  console.log(`\n=== QUIZ QUESTIONS (${qqs.length}) ===`);
  for (const q of qqs) {
    console.log(`\nQuestion id=${q.id}:`);
    if (q.question?.includes('2020')) console.log('  Q:', q.question);
    if (q.explanation?.includes('2020')) console.log('  E:', q.explanation);
    if (q.correctAnswer?.includes('2020')) console.log('  A:', q.correctAnswer);
  }

  await conn.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
