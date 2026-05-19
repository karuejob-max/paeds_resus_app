import * as dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  
  // Check courses table structure
  const [cols] = await conn.execute("DESCRIBE courses");
  console.log('Courses table columns:', (cols as any[]).map((c: any) => c.Field).join(', '));

  // Check all courses
  const [courses] = await conn.execute("SELECT id, title FROM courses LIMIT 30");
  console.log('\nAll courses:', JSON.stringify(courses, null, 2));

  // Check modules table structure
  const [modCols] = await conn.execute("DESCRIBE modules");
  console.log('\nModules table columns:', (modCols as any[]).map((c: any) => c.Field).join(', '));

  // Check module sections table structure
  const [secCols] = await conn.execute("DESCRIBE moduleSections");
  console.log('\nModuleSections table columns:', (secCols as any[]).map((c: any) => c.Field).join(', '));

  // Check quizzes table structure
  const [quizCols] = await conn.execute("DESCRIBE quizzes");
  console.log('\nQuizzes table columns:', (quizCols as any[]).map((c: any) => c.Field).join(', '));

  await conn.end();
}

main().catch(console.error);
