import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const email = process.argv[2];
const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, "../.env"), "utf8");
const url = env.match(/^DATABASE_URL=(.+)$/m)[1].trim();

const conn = await mysql.createConnection(url);
let sql = "SELECT t.token, t.expiresAt, u.email FROM passwordResetTokens t JOIN users u ON u.id = t.userId ORDER BY t.id DESC LIMIT 1";
const params = [];
if (email) {
  sql =
    "SELECT t.token, t.expiresAt, u.email FROM passwordResetTokens t JOIN users u ON u.id = t.userId WHERE LOWER(u.email) = ? ORDER BY t.id DESC LIMIT 1";
  params.push(email.toLowerCase());
}
const [rows] = await conn.query(sql, params);
console.log(rows[0] || "none");
await conn.end();
