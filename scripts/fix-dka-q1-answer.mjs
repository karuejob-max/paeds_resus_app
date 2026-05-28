/**
 * Idempotent: fix DKA I fluid bolus quiz correctAnswer (value "200 mL", not index/wrong option).
 *
 * Targets question text: "Initial fluid bolus for DKA in a 20 kg child"
 *
 *   pnpm exec node scripts/fix-dka-q1-answer.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const QUESTION_LIKE = "%Initial fluid bolus for DKA in a 20 kg child%";
const CORRECT_OPTION = "200 mL";

function parseOptions(raw) {
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.map(String) : [];
  } catch {
    return [];
  }
}

function parseStored(raw) {
  if (raw == null) return "";
  try {
    const p = JSON.parse(String(raw).trim());
    return typeof p === "string" ? p : String(p);
  } catch {
    return String(raw).trim();
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const targetStored = JSON.stringify(CORRECT_OPTION);
  const conn = await createMysqlConnection(databaseUrl, mysql);

  try {
    const [rows] = await conn.query(
      `SELECT id, question, options, correctAnswer FROM quizQuestions WHERE question LIKE ?`,
      [QUESTION_LIKE]
    );

    if (!rows.length) {
      console.log("No matching DKA fluid bolus question found.");
      process.exit(0);
    }

    let updated = 0;
    let alreadyOk = 0;

    for (const row of rows) {
      const options = parseOptions(row.options);
      if (!options.includes(CORRECT_OPTION)) {
        console.warn(
          `id=${row.id}: options missing "${CORRECT_OPTION}" — got ${JSON.stringify(options)}; skip`
        );
        continue;
      }

      const resolved = parseStored(row.correctAnswer);
      if (resolved === CORRECT_OPTION) {
        alreadyOk++;
        console.log(`id=${row.id}: already correct (${CORRECT_OPTION})`);
        continue;
      }

      await conn.query(
        `UPDATE quizQuestions SET correctAnswer = ?, updatedAt = NOW() WHERE id = ?`,
        [targetStored, row.id]
      );
      updated++;
      console.log(
        `id=${row.id}: updated correctAnswer ${JSON.stringify(row.correctAnswer)} → ${targetStored}`
      );
    }

    console.log(`Done. updated=${updated} alreadyOk=${alreadyOk} total=${rows.length}`);
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
