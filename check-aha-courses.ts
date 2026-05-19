import * as dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const [rows] = await conn.execute('SELECT id, title, programType FROM courses ORDER BY id');
  console.log(JSON.stringify(rows, null, 2));
  await conn.end();
}
main().catch(console.error);
