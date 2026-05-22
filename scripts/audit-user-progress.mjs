import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const email = (process.argv[2] || "karuejob@gmail.com").toLowerCase();
const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, "../.env"), "utf8");
const url = env.match(/^DATABASE_URL=(.+)$/m)[1].trim();

const conn = await mysql.createConnection(url);

const [users] = await conn.query(
  `SELECT id, openId, email, name, loginMethod, role, createdAt, lastSignedIn
   FROM users
   WHERE LOWER(email) = ? OR openId = ? OR name LIKE '%Karue%' OR name LIKE '%Job%'
   ORDER BY id`,
  [email, `email:${email}`]
);
console.log("Matching users:\n", JSON.stringify(users, null, 2));

for (const u of users) {
  const uid = u.id;
  const [enrollments] = await conn.query(
    "SELECT id, courseId, status, enrolledAt FROM enrollments WHERE userId = ? LIMIT 20",
    [uid]
  );
  const [certs] = await conn.query(
    "SELECT id, courseId, issuedAt, certificateNumber FROM certificates WHERE userId = ? LIMIT 20",
    [uid]
  );
  const [progress] = await conn.query(
    "SELECT COUNT(*) AS c FROM learnerProgress WHERE userId = ?",
    [uid]
  );
  console.log(`\n--- userId=${uid} (${u.email}) created=${u.createdAt} ---`);
  console.log("enrollments:", enrollments.length, enrollments.slice(0, 5));
  console.log("certificates:", certs.length, certs.slice(0, 5));
  console.log("learnerProgress rows:", progress[0].c);
}

// Any other users with same email pattern historically (deleted email?)
const [dupes] = await conn.query(
  `SELECT id, email, openId, createdAt FROM users WHERE email LIKE '%karuejob%' ORDER BY id`
);
console.log("\nAll karuejob* emails:", dupes);

await conn.end();
