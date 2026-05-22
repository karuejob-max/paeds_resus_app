import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, "../.env"), "utf8");
const url = env.match(/^DATABASE_URL=(.+)$/m)[1].trim();
const conn = await mysql.createConnection(url);

const [manus] = await conn.query(
  `SELECT id, openId, email, name, createdAt FROM users WHERE openId NOT LIKE 'email:%' LIMIT 30`
);
console.log("Non-email openId users (OAuth/Manus):", manus.length);
for (const u of manus.slice(0, 15)) console.log(u);

const tables = ["fellowshipProgress", "resusGPSSessions", "learnerProgress"];
for (const t of tables) {
  try {
    const [rows] = await conn.query(
      `SELECT userId, COUNT(*) AS c FROM ${t} GROUP BY userId ORDER BY c DESC LIMIT 8`
    );
    console.log(`\nTop ${t}:`, rows);
  } catch (e) {
    console.log(`\n${t}:`, e.message);
  }
}

// Admin role users
const [admins] = await conn.query(
  `SELECT id, email, openId, role, createdAt FROM users WHERE role = 'admin' ORDER BY id`
);
console.log("\nAdmin users:", admins);

await conn.end();
