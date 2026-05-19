import mysql from "mysql2/promise";

async function main() {
  const pool = mysql.createPool(process.env.DATABASE_URL!);

  // 1. Check correctAnswer format for BLS module 1
  const [blsMod1] = await pool.query(
    "SELECT id FROM modules WHERE courseId = 1 ORDER BY `order` LIMIT 1"
  ) as any[];
  const blsMod1Id = blsMod1[0]?.id;
  console.log("BLS Module 1 ID:", blsMod1Id);

  const [blsQuizzes] = await pool.query(
    "SELECT id, passingScore FROM quizzes WHERE moduleId = ?", [blsMod1Id]
  ) as any[];
  console.log("BLS Module 1 quizzes:", blsQuizzes);

  if (blsQuizzes.length > 0) {
    const [qs] = await pool.query(
      "SELECT id, question, correctAnswer, LEFT(options, 100) as opts FROM quizQuestions WHERE quizId = ? LIMIT 3",
      [blsQuizzes[0].id]
    ) as any[];
    qs.forEach((q: any) => {
      console.log(`  Q${q.id}: correctAnswer type=${typeof q.correctAnswer}, value=${JSON.stringify(q.correctAnswer)}`);
      console.log(`         opts preview: ${q.opts}`);
    });
  }

  // 2. Check ACLS module 1 quiz
  const [aclsMod1] = await pool.query(
    "SELECT id FROM modules WHERE courseId = 2 ORDER BY `order` LIMIT 1"
  ) as any[];
  const aclsMod1Id = aclsMod1[0]?.id;
  console.log("\nACLS Module 1 ID:", aclsMod1Id);

  const [aclsQuizzes] = await pool.query(
    "SELECT id, passingScore FROM quizzes WHERE moduleId = ?", [aclsMod1Id]
  ) as any[];
  console.log("ACLS Module 1 quizzes:", aclsQuizzes);

  if (aclsQuizzes.length > 0) {
    const [qs] = await pool.query(
      "SELECT id, question, correctAnswer, LEFT(options, 100) as opts FROM quizQuestions WHERE quizId = ? LIMIT 3",
      [aclsQuizzes[0].id]
    ) as any[];
    qs.forEach((q: any) => {
      console.log(`  Q${q.id}: correctAnswer type=${typeof q.correctAnswer}, value=${JSON.stringify(q.correctAnswer)}`);
    });
  }

  // 3. Check if there are ANY quizzes for BLS modules (maybe module 1 has no quiz?)
  const [allBlsQuizzes] = await pool.query(`
    SELECT q.id, q.moduleId, q.passingScore, m.title as moduleTitle, COUNT(qq.id) as questionCount
    FROM quizzes q
    JOIN modules m ON q.moduleId = m.id
    LEFT JOIN quizQuestions qq ON qq.quizId = q.id
    WHERE m.courseId = 1
    GROUP BY q.id, q.moduleId, q.passingScore, m.title
    ORDER BY m.\`order\`
  `) as any[];
  console.log("\nAll BLS quizzes:");
  allBlsQuizzes.forEach((q: any) => console.log(`  Quiz ${q.id} | Module ${q.moduleId} (${q.moduleTitle}) | ${q.questionCount} questions | passing: ${q.passingScore}%`));

  // 4. Check ACLS quizzes
  const [allAclsQuizzes] = await pool.query(`
    SELECT q.id, q.moduleId, q.passingScore, m.title as moduleTitle, COUNT(qq.id) as questionCount
    FROM quizzes q
    JOIN modules m ON q.moduleId = m.id
    LEFT JOIN quizQuestions qq ON qq.quizId = q.id
    WHERE m.courseId = 2
    GROUP BY q.id, q.moduleId, q.passingScore, m.title
    ORDER BY m.\`order\`
  `) as any[];
  console.log("\nAll ACLS quizzes:");
  allAclsQuizzes.forEach((q: any) => console.log(`  Quiz ${q.id} | Module ${q.moduleId} (${q.moduleTitle}) | ${q.questionCount} questions | passing: ${q.passingScore}%`));

  // 5. Check BLS module 1 sections
  const [blsMod1Secs] = await pool.query(
    "SELECT id, title, `order` FROM moduleSections WHERE moduleId = ? ORDER BY `order`", [blsMod1Id]
  ) as any[];
  console.log("\nBLS Module 1 sections:", blsMod1Secs.map((s: any) => `${s.id}: ${s.title}`).join(', '));

  // 6. Check if there's a Final Knowledge Check module for BLS (id=188)
  const [finalModule] = await pool.query(
    "SELECT id, title FROM modules WHERE courseId = 1 AND title LIKE '%Final%'"
  ) as any[];
  console.log("\nBLS Final module:", finalModule);

  const [finalQuizzes] = await pool.query(
    "SELECT id, passingScore FROM quizzes WHERE moduleId = ?", [finalModule[0]?.id]
  ) as any[];
  console.log("BLS Final quizzes:", finalQuizzes);

  if (finalQuizzes.length > 0) {
    const [qs] = await pool.query(
      "SELECT COUNT(*) as cnt FROM quizQuestions WHERE quizId = ?", [finalQuizzes[0].id]
    ) as any[];
    console.log("BLS Final quiz question count:", qs[0]?.cnt);
  }

  await pool.end();
}

main().catch(console.error);
