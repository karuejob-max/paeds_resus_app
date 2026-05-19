import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, "../.env"), "utf8");
const url = env.match(/^DATABASE_URL=(.+)$/m)[1].trim();
const email = process.argv[2] || "karuejob@gmail.com";

const conn = await mysql.createConnection(url);
const [rows] = await conn.query(
  "SELECT id, email, loginMethod, (passwordHash IS NOT NULL) AS hasPwd FROM users WHERE LOWER(email) = ?",
  [email.toLowerCase()]
);
console.log(JSON.stringify(rows, null, 2));
await conn.end();
