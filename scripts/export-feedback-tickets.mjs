/**
 * Export open platform feedback tickets to docs/FEEDBACK_TICKETS_EXPORT.md
 * for Cursor/agent gap analysis.
 *
 *   pnpm run export:feedback-tickets
 *
 * Requires DATABASE_URL (same as other db scripts).
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createMysqlConnection } from "./db-connection-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const mysql = await import("mysql2/promise");
  const conn = await createMysqlConnection(databaseUrl, mysql.default);

  const [rows] = await conn.query(
    `SELECT id, category, status, priority, subject, message, contextJson, createdAt
     FROM platformFeedbackTickets
     WHERE status IN ('open', 'in_progress')
     ORDER BY priority DESC, createdAt DESC`
  );

  const tickets = rows as Array<{
    id: number;
    category: string;
    status: string;
    priority: string;
    subject: string | null;
    message: string;
    contextJson: string | null;
    createdAt: Date;
  }>;

  const categoryCounts: Record<string, number> = {};
  for (const t of tickets) {
    categoryCounts[t.category] = (categoryCounts[t.category] ?? 0) + 1;
  }

  const lines = [
    "# Feedback tickets export (open / in progress)",
    "",
    `**Generated:** ${new Date().toISOString().slice(0, 10)} · **Tickets:** ${tickets.length}`,
    "",
    "## Category counts",
    "",
    "| Category | Count |",
    "|----------|------:|",
  ];

  for (const [cat, count] of Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${cat} | ${count} |`);
  }

  lines.push("", "## Verbatim messages", "");

  for (const t of tickets) {
    lines.push(
      `### #${t.id} — ${t.category} (${t.priority})`,
      "",
      `- **Status:** ${t.status}`,
      `- **Subject:** ${t.subject ?? "—"}`,
      `- **Created:** ${new Date(t.createdAt).toISOString()}`,
      `- **Context:** \`${t.contextJson ?? "{}"}\``,
      "",
      t.message,
      "",
      "---",
      ""
    );
  }

  const outPath = path.join(__dirname, "../docs/FEEDBACK_TICKETS_EXPORT.md");
  fs.writeFileSync(outPath, lines.join("\n"), "utf8");
  console.log(`Wrote ${tickets.length} tickets to ${outPath}`);
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
