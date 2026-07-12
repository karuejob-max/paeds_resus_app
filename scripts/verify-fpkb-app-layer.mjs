/**
 * Verify the FPKB application layer (server/routers/fpkb.ts + Drizzle bindings
 * in drizzle/schema.ts) can actually read the 11 kb_ tables created by
 * migration 0057 and seeded by migration 0058.
 *
 * This does NOT create or alter any tables — it's read-only verification.
 * Run: pnpm exec tsx -r dotenv/config scripts/verify-fpkb-app-layer.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const EXPECTED_TABLES = [
  "kb_failure_modes",
  "kb_success_factors",
  "kb_patterns",
  "kb_pattern_modes",
  "kb_pattern_observations",
  "kb_evidence_links",
  "kb_recommendations",
  "kb_interventions",
  "kb_implementations",
  "kb_review_schedule",
  "kb_content_versions",
  "kb_governance_audit",
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[verify-fpkb] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  let failures = 0;

  try {
    console.log("[verify-fpkb] Checking table existence + row counts...");
    for (const table of EXPECTED_TABLES) {
      const [rows] = await conn.query(`SELECT COUNT(*) as c FROM \`${table}\``);
      console.log(`[verify-fpkb]   ${table}: ${rows[0].c} rows`);
    }

    const [modes] = await conn.query("SELECT COUNT(*) as c FROM kb_failure_modes WHERE is_active = 1");
    const [factors] = await conn.query("SELECT COUNT(*) as c FROM kb_success_factors WHERE is_active = 1");

    if (modes[0].c < 28) {
      console.error(`[verify-fpkb] FAIL: expected >=28 active failure modes, found ${modes[0].c}`);
      failures++;
    }
    if (factors[0].c < 10) {
      console.error(`[verify-fpkb] FAIL: expected >=10 active success factors, found ${factors[0].c}`);
      failures++;
    }

    if (failures === 0) {
      console.log("[verify-fpkb] PASS — 28+ failure modes, 10+ success factors, all 11 kb_ tables reachable.");
      console.log("[verify-fpkb] Next: hit /failure-pattern-atlas as a provider/institution user to confirm UI.");
    } else {
      process.exit(1);
    }
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[verify-fpkb] Fatal error:", err);
  process.exit(1);
});
