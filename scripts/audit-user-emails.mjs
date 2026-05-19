import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, "../.env"), "utf8");
const url = env.match(/^DATABASE_URL=(.+)$/m)[1].trim();

const conn = await mysql.createConnection(url);

const [nullEmail] = await conn.query(
  "SELECT COUNT(*) AS c FROM users WHERE email IS NULL OR TRIM(email) = ''"
);
const [openIdEmail] = await conn.query(
  "SELECT COUNT(*) AS c FROM users WHERE openId LIKE 'email:%' AND (email IS NULL OR TRIM(email) = '')"
);
const [mismatch] = await conn.query(`
  SELECT id, openId, email FROM users
  WHERE openId LIKE 'email:%'
    AND email IS NOT NULL
    AND LOWER(email) <> LOWER(SUBSTRING(openId, 7))
  LIMIT 15
`);

console.log("users with empty email:", nullEmail[0].c);
console.log("openId email: but empty email column:", openIdEmail[0].c);
console.log("\nopenId vs email mismatch (sample):");
for (const r of mismatch) console.log(r);

await conn.end();
