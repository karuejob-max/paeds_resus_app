import mysql from 'mysql2/promise';

async function main() {
  const url = process.env.DATABASE_URL!;
  // Parse connection string
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (!match) throw new Error('Invalid DATABASE_URL');
  const [, user, password, host, port, database] = match;

  const conn = await mysql.createConnection({
    host, port: parseInt(port), user, password, database,
    ssl: { rejectUnauthorized: false }
  });

  console.log('\n=== AHA COURSES IN DATABASE ===');
  const [courses] = await conn.execute(
    "SELECT id, title, programType, slug FROM courses WHERE programType IN ('bls','acls','pals','heartsaver') ORDER BY id"
  ) as any;
  courses.forEach((c: any) => console.log(`  ID ${c.id}: [${c.programType}] ${c.title} (slug: ${c.slug})`));

  console.log('\n=== MODULE COUNT PER AHA COURSE ===');
  for (const course of courses) {
    const [mods] = await conn.execute(
      'SELECT id, title FROM modules WHERE courseId = ? ORDER BY orderIndex', [course.id]
    ) as any;
    console.log(`  Course ${course.id} (${course.programType}): ${mods.length} modules`);
    mods.forEach((m: any) => console.log(`    - Module ${m.id}: ${m.title}`));
  }

  console.log('\n=== LISTAHAHUBPROGRAMS QUERY (what the frontend sees) ===');
  const [hubRows] = await conn.execute(
    "SELECT id, title, programType, slug FROM courses WHERE programType IN ('bls','acls','pals','heartsaver') ORDER BY FIELD(programType,'bls','acls','pals','heartsaver')"
  ) as any;
  console.log(`  Returns ${hubRows.length} courses to the frontend`);
  hubRows.forEach((c: any) => console.log(`  - ${c.programType}: "${c.title}"`));

  await conn.end();
}

main().catch(console.error);
