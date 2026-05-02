import mysql from "mysql2/promise";

async function main() {
  const pool = mysql.createPool(process.env.DATABASE_URL!);

  // Find all sections in AHA courses with 2020 references
  const [sections] = await pool.query(`
    SELECT ms.id, ms.title, m.courseId, c.title as courseTitle
    FROM moduleSections ms
    JOIN modules m ON ms.moduleId = m.id
    JOIN courses c ON m.courseId = c.id
    WHERE m.courseId IN (1,2,3,30)
    AND ms.content LIKE '%2020%'
    ORDER BY m.courseId, m.\`order\`, ms.\`order\`
  `) as any[];

  console.log(`\nSections with 2020 references: ${sections.length}`);
  sections.forEach((r: any) => console.log(`  [${r.courseTitle}] Section ${r.id}: ${r.title}`));

  // Also check quiz questions
  const [questions] = await pool.query(`
    SELECT qq.id, qq.question, m.courseId, c.title as courseTitle
    FROM quizQuestions qq
    JOIN quizzes qz ON qq.quizId = qz.id
    JOIN modules m ON qz.moduleId = m.id
    JOIN courses c ON m.courseId = c.id
    WHERE m.courseId IN (1,2,3,30)
    AND (qq.question LIKE '%2020%' OR qq.explanation LIKE '%2020%' OR qq.correctAnswer LIKE '%2020%')
    ORDER BY m.courseId
  `) as any[];

  console.log(`\nQuiz questions with 2020 references: ${questions.length}`);
  questions.forEach((r: any) => console.log(`  [${r.courseTitle}] Q${r.id}: ${r.question.substring(0, 80)}`));

  // Get full content of sections with 2020 refs to understand context
  if (sections.length > 0) {
    console.log("\n--- Section content previews ---");
    for (const sec of sections) {
      const [content] = await pool.query(
        "SELECT content FROM moduleSections WHERE id = ?", [sec.id]
      ) as any[];
      const raw = content[0]?.content ?? "";
      // Extract all occurrences of "2020" with surrounding context
      const matches = [...raw.matchAll(/(.{0,60})2020(.{0,60})/g)];
      console.log(`\nSection ${sec.id} (${sec.title}):`);
      matches.forEach(m => console.log(`  ...${m[1]}2020${m[2]}...`));
    }
  }

  await pool.end();
}

main().catch(console.error);
