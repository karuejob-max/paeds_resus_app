/**
 * Fix Heartsaver Final Knowledge Check Q9 — infant single-rescuer CPR technique.
 * 2025 AHA ECC: 2-finger technique eliminated; correct answer is heel of 1 hand (option B).
 *
 * Usage: npx tsx fix-heartsaver-final-q9-2025.ts
 */
import mysql from "mysql2/promise";
import type { PoolOptions } from "mysql2/promise";
import "dotenv/config";

const EXPLANATION =
  "The 2025 AHA ECC Guidelines eliminate the 2-finger technique for infant CPR. For a single rescuer, use the heel of 1 hand on the sternum. The 2 thumb-encircling hands technique is preferred when 2 rescuers are available or when a single rescuer can encircle the chest.";

function getConnectionConfig(databaseUrl: string): PoolOptions {
  const url = new URL(databaseUrl);
  const needsSsl =
    /ssl-mode=REQUIRED|ssl=true/i.test(databaseUrl) || url.hostname.endsWith(".aivencloud.com");
  const config: PoolOptions = {
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, "") || undefined,
  };
  if (needsSsl) {
    config.ssl = { rejectUnauthorized: false };
  }
  return config;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL not set");
  const pool = mysql.createPool(getConnectionConfig(databaseUrl));

  const [finalRows] = await pool.query(`
    SELECT qq.id, qq.question, qq.correctAnswer, qq.options, qq.\`order\`
    FROM quizQuestions qq
    JOIN quizzes q ON qq.quizId = q.id
    JOIN modules m ON q.moduleId = m.id
    JOIN courses c ON m.courseId = c.id
    WHERE c.programType = 'heartsaver'
      AND m.title LIKE '%Final%'
      AND qq.question LIKE '%infant CPR technique for a single rescuer%'
  `) as any[];

  if (finalRows.length === 0) {
    console.warn("No matching Heartsaver Final Knowledge Check question found.");
  }

  for (const row of finalRows) {
    await pool.query(
      `UPDATE quizQuestions SET correctAnswer = ?, explanation = ? WHERE id = ?`,
      ["Heel of one hand", EXPLANATION, row.id]
    );
    console.log(`✅ Updated Heartsaver Final Q${row.order} (id=${row.id}): correctAnswer → "Heel of one hand"`);
  }

  const [moduleRows] = await pool.query(`
    SELECT qq.id, qq.question, qq.correctAnswer, qq.\`order\`, m.title
    FROM quizQuestions qq
    JOIN quizzes q ON qq.quizId = q.id
    JOIN modules m ON q.moduleId = m.id
    JOIN courses c ON m.courseId = c.id
    WHERE c.programType = 'heartsaver'
      AND qq.question LIKE '%compression technique for a single rescuer performing infant CPR%'
  `) as any[];

  for (const row of moduleRows) {
    await pool.query(
      `UPDATE quizQuestions SET correctAnswer = ?, explanation = ? WHERE id = ?`,
      ["Heel of one hand on the sternum", EXPLANATION, row.id]
    );
    console.log(`✅ Updated ${row.title} module quiz (id=${row.id}): correctAnswer → "Heel of one hand on the sternum"`);
  }

  await pool.end();
  console.log("\n✅ Heartsaver infant CPR technique fix complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
