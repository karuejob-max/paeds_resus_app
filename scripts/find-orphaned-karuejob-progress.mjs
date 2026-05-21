import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, "../.env"), "utf8");
const url = env.match(/^DATABASE_URL=(.+)$/m)[1].trim();
const conn = await mysql.createConnection(url);

// Users named Job / Karue
const [byName] = await conn.query(
  `SELECT id, openId, email, name, loginMethod, role, createdAt
   FROM users WHERE name LIKE '%Job%' OR name LIKE '%Karue%' OR email LIKE '%karue%'
   ORDER BY id`
);
console.log("Users by name/email pattern:", byName);

// Progress-rich accounts (possible old owner account)
const [heavy] = await conn.query(`
  SELECT u.id, u.email, u.openId, u.name, u.createdAt,
         (SELECT COUNT(*) FROM learnerProgress lp WHERE lp.userId = u.id) AS progressRows,
         (SELECT COUNT(*) FROM certificates c WHERE c.userId = u.id) AS certCount,
         (SELECT COUNT(*) FROM enrollments e WHERE e.userId = u.id) AS enrollCount
  FROM users u
  HAVING progressRows > 5 OR certCount > 0 OR enrollCount > 0
  ORDER BY progressRows DESC, certCount DESC
  LIMIT 25
`);
console.log("\nAccounts with most progress/certs:");
for (const r of heavy) console.log(r);

// Manus/OAuth accounts with karuejob email if any
const [oauth] = await conn.query(
  `SELECT id, openId, email, name, loginMethod, createdAt FROM users
   WHERE openId NOT LIKE 'email:%' AND (email LIKE '%karue%' OR name LIKE '%Karue%')`
);
console.log("\nOAuth-ish accounts matching karue:", oauth);

await conn.end();
