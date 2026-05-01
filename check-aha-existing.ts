import * as dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  
  const [mods] = await conn.execute(
    `SELECT m.id, m.courseId, m.title, COUNT(ms.id) as sections 
     FROM modules m 
     LEFT JOIN moduleSections ms ON ms.moduleId = m.id 
     WHERE m.courseId IN (1,2,3) 
     GROUP BY m.id 
     ORDER BY m.courseId, m.\`order\``
  );
  console.log('BLS/ACLS/Systematic modules:', JSON.stringify(mods, null, 2));

  const [quizzes] = await conn.execute(
    `SELECT q.id, q.moduleId, q.title, COUNT(qq.id) as questions 
     FROM quizzes q 
     LEFT JOIN quizQuestions qq ON qq.quizId = q.id 
     WHERE q.moduleId IN (SELECT id FROM modules WHERE courseId IN (1,2,3)) 
     GROUP BY q.id`
  );
  console.log('\nBLS/ACLS quizzes:', JSON.stringify(quizzes, null, 2));

  // Check programType column
  const [progType] = await conn.execute(
    `SELECT id, title, programType FROM courses WHERE id IN (1,2,3)`
  );
  console.log('\nCourse programTypes:', JSON.stringify(progType, null, 2));

  await conn.end();
}

main().catch(console.error);
