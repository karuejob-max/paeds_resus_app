import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema';
import { inArray, eq } from 'drizzle-orm';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(conn, { schema, mode: 'default' });

  // Check AHA courses in DB
  const ahaCourses = await db.select({
    id: schema.courses.id,
    title: schema.courses.title,
    programType: schema.courses.programType,
    slug: schema.courses.slug,
  }).from(schema.courses).where(
    inArray(schema.courses.programType, ['bls', 'acls', 'pals', 'heartsaver'])
  );

  console.log('\n=== AHA COURSES IN DATABASE ===');
  ahaCourses.forEach(c => console.log(`  ID ${c.id}: [${c.programType}] ${c.title} (slug: ${c.slug})`));

  // Check module count per AHA course
  console.log('\n=== MODULE COUNT PER AHA COURSE ===');
  for (const course of ahaCourses) {
    const mods = await db.select({ id: schema.modules.id, title: schema.modules.title })
      .from(schema.modules)
      .where(eq(schema.modules.courseId, course.id));
    console.log(`  Course ${course.id} (${course.programType}): ${mods.length} modules`);
    mods.forEach(m => console.log(`    - Module ${m.id}: ${m.title}`));
  }

  await conn.end();
}

main().catch(console.error);
