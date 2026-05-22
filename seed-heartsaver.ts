/**
 * Heartsaver Course Content Seed
 * Aligned with: AHA Heartsaver CPR AED 2020 Guidelines
 * Target audience: Lay rescuers, non-clinical healthcare workers, school staff, parents
 * Structure: 4 modules Ã— 4 sections + formative quiz per module
 */
import * as dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';
import { HEARTSAVER_MODULES } from './server/lib/heartsaver-modules-data';

const modules = HEARTSAVER_MODULES;

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  
  // Extend programType enum to include heartsaver
  await conn.execute(`ALTER TABLE courses MODIFY COLUMN programType ENUM('bls','acls','pals','fellowship','instructor','fellowship_diploma','heartsaver') NOT NULL`);
  
  // Create Heartsaver course
  const [existing] = await conn.execute(`SELECT id FROM courses WHERE programType = 'heartsaver' LIMIT 1`);
  let heartsaverId: number;
  
  if ((existing as any[]).length > 0) {
    heartsaverId = (existing as any[])[0].id;
    console.log(`Heartsaver course already exists (ID: ${heartsaverId}), updating content...`);
  } else {
    const [result] = await conn.execute(
      `INSERT INTO courses (title, description, programType, duration, level, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        'Heartsaver CPR AED',
        'AHA Heartsaver CPR AED course for lay rescuers and non-clinical healthcare workers. Covers adult, child, and infant CPR, AED use, and choking relief.',
        'heartsaver',
        90,
        'beginner'
      ]
    );
    heartsaverId = (result as any).insertId;
    console.log(`Created Heartsaver course (ID: ${heartsaverId})`);
  }
  
  // Clear existing modules
  const [existingMods] = await conn.execute(`SELECT id FROM modules WHERE courseId = ?`, [heartsaverId]);
  for (const mod of existingMods as any[]) {
    await conn.execute(`DELETE FROM quizQuestions WHERE quizId IN (SELECT id FROM quizzes WHERE moduleId = ?)`, [mod.id]);
    await conn.execute(`DELETE FROM quizzes WHERE moduleId = ?`, [mod.id]);
    await conn.execute(`DELETE FROM moduleSections WHERE moduleId = ?`, [mod.id]);
  }
  await conn.execute(`DELETE FROM modules WHERE courseId = ?`, [heartsaverId]);
  
  for (const mod of modules) {
    const [modResult] = await conn.execute(
      `INSERT INTO modules (courseId, title, description, content, duration, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [heartsaverId, mod.title, mod.description, mod.content, mod.duration, mod.order]
    );
    const moduleId = (modResult as any).insertId;
    
    for (const section of mod.sections) {
      await conn.execute(
        `INSERT INTO moduleSections (moduleId, title, content, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [moduleId, section.title, section.content, section.order]
      );
    }
    
    const [quizResult] = await conn.execute(
      `INSERT INTO quizzes (moduleId, title, description, passingScore, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
      [moduleId, mod.quiz.title, mod.quiz.title, mod.quiz.passingScore]
    );
    const quizId = (quizResult as any).insertId;
    
    for (const q of mod.quiz.questions) {
      await conn.execute(
        `INSERT INTO quizQuestions (quizId, question, options, correctAnswer, explanation, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [quizId, q.questionText, q.options, q.correctAnswer, q.explanation, q.order]
      );
    }
    
    console.log(`  âœ“ Module ${mod.order}: ${mod.title} (${mod.sections.length} sections, ${mod.quiz.questions.length} quiz questions)`);
  }
  
  console.log(`\nHeartsaver seeding complete: ${modules.length} modules, ${modules.reduce((a, m) => a + m.sections.length, 0)} sections, ${modules.reduce((a, m) => a + m.quiz.questions.length, 0)} quiz questions`);
  console.log(`Heartsaver course ID: ${heartsaverId}`);
  
  await conn.end();
}

main().catch(console.error);
