/**
 * One-off diagnostic script (NOT a migration — no schema changes, read-only).
 * Looks up a learner by email and lists their enrollments, to debug the
 * "Enrollment not found for quiz attempt" error.
 *
 * Run: node scripts/diag-check-enrollments.mjs someone@example.com
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function main() {
  const email = process.argv[2];

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);

  try {
    console.log("=== Courses by programType (catalog health check) ===");
    const [courseCounts] = await conn.query(
      `SELECT programType, COUNT(*) as count FROM courses GROUP BY programType ORDER BY programType`
    );
    for (const row of courseCounts) {
      console.log(`  ${row.programType}: ${row.count} course(s)`);
    }
    const [fellowshipCourses] = await conn.query(
      `SELECT id, title, \`order\` FROM courses WHERE programType = 'fellowship' ORDER BY \`order\``
    );
    console.log(`\n  Fellowship courses in detail (${fellowshipCourses.length}):`);
    for (const c of fellowshipCourses) {
      console.log(`    id=${c.id}  order=${c.order}  title="${c.title}"`);
    }

    const [allMicroCourses] = await conn.query(
      `SELECT id, courseId, title, \`order\` FROM microCourses ORDER BY \`order\``
    );
    console.log(`\n  microCourses catalog (${allMicroCourses.length}) — compare titles against fellowship courses above:`);
    for (const m of allMicroCourses) {
      console.log(`    id=${m.id}  courseId="${m.courseId}"  order=${m.order}  title="${m.title}"`);
    }

    console.log("\n=== ID collision check: enrollments.id vs microCourseEnrollments.id ===");
    const [collisions] = await conn.query(`
      SELECT e.id AS sharedId, e.userId AS ahaUserId, e.programType,
             mce.userId AS microUserId, mce.microCourseId
      FROM enrollments e
      INNER JOIN microCourseEnrollments mce ON mce.id = e.id
      ORDER BY e.id
      LIMIT 50
    `);
    const [collisionCount] = await conn.query(`
      SELECT COUNT(*) as total
      FROM enrollments e
      INNER JOIN microCourseEnrollments mce ON mce.id = e.id
    `);
    console.log(`  Total colliding IDs: ${collisionCount[0].total}`);
    if (collisions.length > 0) {
      console.log(`  First ${collisions.length} collisions (id, AHA userId/programType vs micro userId/courseId):`);
      for (const c of collisions) {
        const sameUser = c.ahaUserId === c.microUserId ? "SAME USER (harmless)" : "DIFFERENT USERS — WILL BREAK";
        console.log(`    id=${c.sharedId}  AHA: user=${c.ahaUserId} (${c.programType})  vs  Micro: user=${c.microUserId} (courseId=${c.microCourseId})  → ${sameUser}`);
      }
    }

    if (!email) {
      console.log("\n(No email argument given — skipping per-user enrollment lookup.)");
      return;
    }
    const [users] = await conn.query(
      `SELECT id, name, email, openId FROM users WHERE email = ? LIMIT 5`,
      [email]
    );

    if (users.length === 0) {
      console.log(`No user found with email: ${email}`);
      return;
    }

    for (const user of users) {
      console.log(`\n=== User: ${user.name ?? "(no name)"} <${user.email}> — id=${user.id} ===`);

      const [enrollments] = await conn.query(
        `SELECT id, programType, courseId, paymentStatus, cognitiveModulesComplete, createdAt
         FROM enrollments WHERE userId = ? ORDER BY createdAt DESC`,
        [user.id]
      );

      if (enrollments.length === 0) {
        console.log("  No AHA-course enrollments found for this user.");
      } else {
        console.log(`  ${enrollments.length} AHA-course enrollment(s):`);
        for (const e of enrollments) {
          console.log(`    id=${e.id}  programType=${e.programType}  courseId=${e.courseId}  paymentStatus=${e.paymentStatus}  cognitiveModulesComplete=${e.cognitiveModulesComplete}  createdAt=${e.createdAt}`);
        }
      }

      const [microEnrollments] = await conn.query(
        `SELECT id, microCourseId, enrollmentStatus, quizScore, createdAt FROM microCourseEnrollments WHERE userId = ? ORDER BY createdAt DESC`,
        [user.id]
      );

      if (microEnrollments.length === 0) {
        console.log("  No micro-course enrollments found for this user.");
      } else {
        console.log(`  ${microEnrollments.length} micro-course enrollment(s):`);
        for (const e of microEnrollments) {
          console.log(`    id=${e.id}  microCourseId=${e.microCourseId}  status=${e.enrollmentStatus}  quizScore=${e.quizScore}  createdAt=${e.createdAt}`);
        }
      }
    }
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
