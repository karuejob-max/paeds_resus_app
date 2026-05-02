import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { courses } from './drizzle/schema';
import { inArray } from 'drizzle-orm';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(conn);
  const rows = await db.select({ id: courses.id, title: courses.title, programType: courses.programType })
    .from(courses)
    .where(inArray(courses.programType, ['bls','acls','pals','heartsaver']));
  console.log(JSON.stringify(rows, null, 2));
  await conn.end();
}
main().catch(console.error);
