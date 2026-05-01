/**
 * AHA Summative Assessment Seed
 * Seeds final knowledge check quizzes for BLS (1), ACLS (2), PALS (3), Heartsaver (30)
 * These are course-level quizzes (not module-level) used for certification
 * Aligned with AHA 2020 Guidelines
 */
import * as dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

// Check if there is a courseQuizzes table or if summative quizzes use a different mechanism
// First let's check what tables exist for course-level assessments

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  // Check table structure
  const [tables] = await conn.execute(`SHOW TABLES`);
  console.log('Tables:', (tables as any[]).map(t => Object.values(t)[0]));

  // Check if there is a courseQuizzes or assessments table
  const [quizCols] = await conn.execute(`SHOW COLUMNS FROM quizzes`);
  console.log('Quiz columns:', (quizCols as any[]).map(c => c.Field));

  // Check if quizzes can be linked to courses directly (not just modules)
  const [modulesCols] = await conn.execute(`SHOW COLUMNS FROM modules`);
  console.log('Module columns:', (modulesCols as any[]).map(c => c.Field));

  await conn.end();
}

main().catch(console.error);
