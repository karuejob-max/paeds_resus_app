/**
 * Seed NRP course catalog (full modules, sections, quizzes).
 * Usage: npx tsx --import dotenv/config seed-nrp.ts
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { NRP_COURSE_TITLE, NRP_MODULES } from "./server/lib/nrp-modules-data";

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const conn = await mysql.createConnection(url);

  await conn.execute(`
    ALTER TABLE courses MODIFY COLUMN programType ENUM(
      'bls','acls','pals','fellowship','instructor','fellowship_diploma','heartsaver','nrp'
    ) NOT NULL
  `).catch(() => {/* idempotent */});

  await conn.execute(`
    ALTER TABLE enrollments MODIFY COLUMN programType ENUM(
      'bls','acls','pals','fellowship','instructor','fellowship_diploma','heartsaver','nrp'
    ) NOT NULL
  `).catch(() => {/* idempotent */});

  const [existing] = await conn.execute(
    `SELECT id FROM courses WHERE programType = 'nrp' LIMIT 1`
  );
  let courseId: number;
  if ((existing as any[]).length > 0) {
    courseId = (existing as any[])[0].id;
    console.log(`NRP course exists (id=${courseId}), refreshing modules...`);
    await conn.execute(`DELETE FROM modules WHERE courseId = ?`, [courseId]);
  } else {
    const [result] = await conn.execute(
      `INSERT INTO courses (title, description, programType, duration, level, \`order\`)
       VALUES (?, ?, 'nrp', 360, 'advanced', 5)`,
      [
        NRP_COURSE_TITLE,
        "AHA/AAP 2025 Neonatal Resuscitation Program — cognitive and practical certification path.",
      ]
    );
    courseId = (result as any).insertId;
    console.log(`Created NRP course (id=${courseId})`);
  }

  for (const mod of NRP_MODULES) {
    const [modResult] = await conn.execute(
      `INSERT INTO modules (courseId, title, description, content, duration, \`order\`)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [courseId, mod.title, mod.description, mod.content, mod.duration, mod.order]
    );
    const moduleId = (modResult as any).insertId;

    for (const section of mod.sections) {
      await conn.execute(
        `INSERT INTO moduleSections (moduleId, title, content, \`order\`) VALUES (?, ?, ?, ?)`,
        [moduleId, section.title, section.content, section.order]
      );
    }

    const [quizResult] = await conn.execute(
      `INSERT INTO quizzes (moduleId, title, description, passingScore, \`order\`)
       VALUES (?, ?, ?, ?, 1)`,
      [moduleId, mod.quiz.title, mod.quiz.title, mod.quiz.passingScore]
    );
    const quizId = (quizResult as any).insertId;

    for (const q of mod.quiz.questions) {
      await conn.execute(
        `INSERT INTO quizQuestions (quizId, question, questionType, options, correctAnswer, explanation, \`order\`)
         VALUES (?, ?, 'multiple_choice', ?, ?, ?, ?)`,
        [
          quizId,
          q.questionText,
          q.options,
          JSON.stringify(q.correctAnswer),
          q.explanation,
          q.order,
        ]
      );
    }
  }

  console.log(`NRP seed complete — ${NRP_MODULES.length} modules for course ${courseId}`);
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
