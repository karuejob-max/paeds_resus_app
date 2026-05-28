/**
 * Read-only: inspect quizQuestions.correctAnswer vs options and grading contract.
 *
 *   pnpm exec node scripts/verify-quiz-answer.mjs --questionText "Initial fluid bolus"
 *   pnpm exec node scripts/verify-quiz-answer.mjs --quizId 42
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

function parseArgs(argv) {
  const out = { quizId: null, questionText: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--quizId" && argv[i + 1]) {
      out.quizId = Number.parseInt(argv[++i], 10);
    } else if (argv[i] === "--questionText" && argv[i + 1]) {
      out.questionText = argv[++i];
    }
  }
  return out;
}

function parseOptions(raw) {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.map(String) : [];
  } catch {
    return [];
  }
}

function parseStoredCorrectAnswer(raw) {
  if (raw == null || raw === "") return "";
  const trimmed = String(raw).trim();
  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed === "string" ? parsed : String(parsed);
  } catch {
    return trimmed;
  }
}

function classifyEncoding(resolved, options) {
  if (!resolved) return "unknown";
  if (options.includes(resolved)) return "value";
  if (/^[A-D]$/i.test(resolved)) return "letter";
  const idx = Number.parseInt(resolved, 10);
  if (!Number.isNaN(idx) && String(idx) === resolved && idx >= 0 && idx < options.length) {
    return "index";
  }
  return "unknown";
}

async function main() {
  const { quizId, questionText } = parseArgs(process.argv);
  if (!quizId && !questionText) {
    console.error("Usage: --quizId <id> | --questionText <substring>");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    let sql = `SELECT qq.id, qq.quizId, qq.question, qq.options, qq.correctAnswer, qq.explanation, qq.\`order\`,
                      q.title AS quizTitle, m.title AS moduleTitle, c.title AS courseTitle
               FROM quizQuestions qq
               JOIN quizzes q ON q.id = qq.quizId
               JOIN modules m ON m.id = q.moduleId
               JOIN courses c ON c.id = m.courseId
               WHERE 1=1`;
    const params = [];
    if (quizId) {
      sql += ` AND qq.quizId = ?`;
      params.push(quizId);
    }
    if (questionText) {
      sql += ` AND qq.question LIKE ?`;
      params.push(`%${questionText}%`);
    }
    sql += ` ORDER BY qq.id LIMIT 20`;

    const [rows] = await conn.query(sql, params);
    if (!rows.length) {
      console.log("No matching quiz questions.");
      process.exit(0);
    }

    for (const row of rows) {
      const options = parseOptions(row.options);
      const storedRaw = row.correctAnswer;
      const storedResolved = parseStoredCorrectAnswer(storedRaw);
      const encoding = classifyEncoding(storedResolved, options);
      const evaluatorMatch = options.includes(storedResolved);
      const indexHint =
        encoding === "index" && options[Number.parseInt(storedResolved, 10)]
          ? options[Number.parseInt(storedResolved, 10)]
          : null;

      console.log("---");
      console.log(`id: ${row.id}  quizId: ${row.quizId}  order: ${row.order}`);
      console.log(`course: ${row.courseTitle}`);
      console.log(`module: ${row.moduleTitle}`);
      console.log(`quiz: ${row.quizTitle}`);
      console.log(`question: ${row.question}`);
      console.log(`options: ${JSON.stringify(options)}`);
      console.log(`storedRaw: ${storedRaw}`);
      console.log(`storedResolved: ${storedResolved}`);
      console.log(`encoding: ${encoding}`);
      if (indexHint) console.log(`ifIndexMeant: ${indexHint}`);
      console.log(`evaluatorMatch: ${evaluatorMatch}`);
      console.log(`explanation: ${(row.explanation || "").slice(0, 120)}...`);
    }
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
