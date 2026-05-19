import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, "../.env"), "utf8");
const url = env.match(/^DATABASE_URL=(.+)$/m)[1].trim();
const q = process.argv[2] || "karuejob";

const conn = await mysql.createConnection(url);
const [rows] = await conn.query(
  "SELECT id, openId, email, name, loginMethod, (passwordHash IS NOT NULL) AS hasPwd FROM users WHERE openId LIKE ? OR email LIKE ? LIMIT 20",
  [`%${q}%`, `%${q}%`]
);
console.log(JSON.stringify(rows, null, 2));
await conn.end();
