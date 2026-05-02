import mysql from "mysql2/promise";

async function main() {
  const pool = mysql.createPool(process.env.DATABASE_URL!);
  
  const [courses] = await pool.query(
    `SELECT id, title, programType FROM courses WHERE programType IN ('bls','acls','pals','heartsaver') ORDER BY id`
  ) as any[];
  
  for (const course of courses) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`COURSE ${course.id}: ${course.title} [${course.programType}]`);
    console.log('='.repeat(70));
    
    const [modules] = await pool.query(
      `SELECT id, title, \`order\` FROM modules WHERE courseId = ? ORDER BY \`order\``,
      [course.id]
    ) as any[];
    
    for (const mod of modules) {
      console.log(`\n  MODULE ${mod.order}: ${mod.title} (id=${mod.id})`);
      
      const [sections] = await pool.query(
        `SELECT id, title, \`order\`, LEFT(content, 600) as contentPreview FROM moduleSections WHERE moduleId = ? ORDER BY \`order\``,
        [mod.id]
      ) as any[];
      
      for (const sec of sections) {
        const text = (sec.contentPreview || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 400);
        console.log(`    SEC ${sec.order}: ${sec.title} (id=${sec.id})`);
        console.log(`      >> ${text}`);
      }
      
      const [quizzes] = await pool.query(
        `SELECT id, title FROM quizzes WHERE moduleId = ?`,
        [mod.id]
      ) as any[];
      
      for (const quiz of quizzes) {
        const [questions] = await pool.query(
          `SELECT id, question, correctAnswer FROM quizQuestions WHERE quizId = ? ORDER BY \`order\``,
          [quiz.id]
        ) as any[];
        console.log(`    QUIZ: "${quiz.title}" (${questions.length} Qs)`);
        for (const q of questions) {
          console.log(`      Q${q.id}: ${q.question} | ANS: ${q.correctAnswer}`);
        }
      }
    }
  }
  
  await pool.end();
}

main().catch(console.error);
