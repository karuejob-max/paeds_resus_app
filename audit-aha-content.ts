import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const pool = mysql.createPool(process.env.DATABASE_URL!);
const db = drizzle(pool);

async function auditAhaContent() {
  // Get all AHA course IDs (1=BLS, 2=ACLS, 3=PALS, 30=Heartsaver)
  const courses = await pool.query(
    `SELECT id, title, programType FROM courses WHERE programType IN ('bls','acls','pals','heartsaver') ORDER BY id`
  );
  
  for (const course of (courses[0] as any[])) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`COURSE ${course.id}: ${course.title} (${course.programType})`);
    console.log('='.repeat(60));
    
    // Get modules
    const modules = await pool.query(
      `SELECT id, title, orderIndex FROM modules WHERE courseId = ? ORDER BY orderIndex`,
      [course.id]
    );
    
    for (const mod of (modules[0] as any[])) {
      console.log(`\n  MODULE ${mod.orderIndex}: ${mod.title} (id=${mod.id})`);
      
      // Get sections
      const sections = await pool.query(
        `SELECT id, title, orderIndex, LEFT(content, 500) as contentPreview FROM moduleSections WHERE moduleId = ? ORDER BY orderIndex`,
        [mod.id]
      );
      
      for (const sec of (sections[0] as any[])) {
        console.log(`    SECTION ${sec.orderIndex}: ${sec.title} (id=${sec.id})`);
        if (sec.contentPreview) {
          // Strip HTML tags for readability
          const text = sec.contentPreview.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 300);
          console.log(`      CONTENT: ${text}...`);
        }
      }
      
      // Get quiz questions
      const quizzes = await pool.query(
        `SELECT q.id as quizId, q.title as quizTitle FROM quizzes q WHERE q.moduleId = ?`,
        [mod.id]
      );
      
      for (const quiz of (quizzes[0] as any[])) {
        const questions = await pool.query(
          `SELECT id, question, correctAnswer, LEFT(options, 200) as optionsPreview FROM quizQuestions WHERE quizId = ? ORDER BY id`,
          [quiz.quizId]
        );
        console.log(`    QUIZ: ${quiz.quizTitle} (${(questions[0] as any[]).length} questions)`);
        for (const q of (questions[0] as any[])) {
          console.log(`      Q${q.id}: ${q.question}`);
          console.log(`        ANSWER: ${q.correctAnswer}`);
        }
      }
    }
  }
  
  await pool.end();
}

auditAhaContent().catch(console.error);
