/**
 * Production ship readiness — read-only DB checks (aligned with drizzle/schema.ts).
 * Run: pnpm run db:ship-readiness
 *
 * Note: `courses` has no `price` column — AHA/micro list prices live in client `const/pricing.ts`
 * and server enrollment logic; this script checks `microCourses.price` (KES cents).
 */
import "dotenv/config";
import mysql from "mysql2/promise";

function getConnectionConfig(databaseUrl) {
  const url = new URL(databaseUrl);
  const needsSsl =
    /ssl-mode=REQUIRED|ssl=true/i.test(databaseUrl) || url.hostname.endsWith(".aivencloud.com");
  const database = url.pathname.replace(/^\//, "") || undefined;
  const config = {
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: database || undefined,
    multipleStatements: false,
  };
  if (needsSsl) {
    config.ssl = { rejectUnauthorized: false };
  }
  return config;
}

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const conn = await mysql.createConnection(getConnectionConfig(url));

  console.log("=== Ship readiness DB check (read-only) ===\n");

  // 1–2: microCourses prices (200 KES = 20000 cents)
  const [mc] = await conn.query(
    `SELECT COUNT(*) AS n, MIN(price) AS minCents, MAX(price) AS maxCents FROM microCourses WHERE price > 0`
  );
  const row = mc[0];
  console.log("1. microCourses (priced rows):");
  console.log(`   rows: ${row.n}, minCents: ${row.minCents}, maxCents: ${row.maxCents}`);
  if (!row.n || row.n === 0) {
    console.log(
      "   ⚠ No rows with price > 0 — run micro-course seed / catalog ensure before expecting enroll UI prices from DB.\n"
    );
  } else {
    console.log(`   expect micro-course list price 200 KES → 20000 cents (verify outliers manually)\n`);
  }

  const [not200] = await conn.query(
    `SELECT courseId, title, price FROM microCourses WHERE price > 0 AND price != 20000 LIMIT 20`
  );
  if (not200.length) {
    console.log("   ⚠ Rows not at 20000 cents (200 KES):");
    console.table(not200);
  } else {
    console.log("   ✓ All non-zero microCourses.price = 20000 cents (200 KES)\n");
  }

  // courses: no price column in schema — list sample titles
  const [ct] = await conn.query(
    `SELECT id, title, programType FROM courses WHERE title LIKE '%BLS%' OR title LIKE '%ACLS%' OR title LIKE '%PALS%' LIMIT 15`
  );
  console.log("2. courses table (no price column in DB — see client/src/const/pricing.ts):");
  if (ct.length) console.table(ct);
  else console.log("   (no matching rows — catalog may be seeded differently)\n");

  // 3: microCourseEnrollments columns
  const [desc] = await conn.query(`DESCRIBE microCourseEnrollments`);
  console.log("3. DESCRIBE microCourseEnrollments:");
  console.table(desc.map((c) => ({ Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key })));

  // 4: stale pending (enrollmentStatus + createdAt per schema)
  const [stale] = await conn.query(
    `SELECT COUNT(*) AS c FROM microCourseEnrollments 
     WHERE enrollmentStatus = 'pending' AND createdAt < DATE_SUB(NOW(), INTERVAL 1 HOUR)`
  );
  console.log("\n4. Old pending enrollments (>1h):", stale[0].c, "(investigate if large)\n");

  // 5: promo codes (usesCount not usedCount; discountPercent not discountPercentage)
  try {
    const [promo] = await conn.query(
      `SELECT id, code, discountPercent, maxUses, usesCount, expiresAt FROM promoCodes ORDER BY id DESC LIMIT 8`
    );
    console.log("5. promoCodes (latest):");
    console.table(promo);
  } catch (e) {
    console.log("5. promoCodes:", e.message);
  }

  // 6: certificates
  const [certD] = await conn.query(`DESCRIBE certificates`);
  console.log("\n6. DESCRIBE certificates (expect issueDate not issuedAt; no courseId):");
  console.table(certD.map((c) => ({ Field: c.Field, Type: c.Type })));

  // 7: migrations
  try {
    const [mig] = await conn.query(`SELECT id, hash, created_at FROM __drizzle_migrations ORDER BY id DESC LIMIT 8`);
    console.log("\n7. __drizzle_migrations (latest):");
    console.table(mig);
  } catch (e) {
    console.log("\n7. __drizzle_migrations:", e.message);
  }

  await conn.end();
  console.log("\nDone. Compare micro-course cents to 200 KES = 20000; validate AHA prices in code + enroll flow.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
