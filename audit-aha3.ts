import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection({
    host: 'public-karuejob-dbmysql-karuejob-paeds-resus.a.aivencloud.com',
    port: 10359,
    user: 'avnadmin',
    password: 'AVNS_zT5Qgys_XpDSOXdSbGr',
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
  });

  // Get actual columns in courses table
  const [cols] = await conn.execute("SHOW COLUMNS FROM courses") as any;
  const colNames = cols.map((c: any) => c.Field);
  console.log('\n=== COURSES TABLE COLUMNS ===');
  console.log(colNames.join(', '));

  console.log('\n=== AHA COURSES IN DATABASE ===');
  const [courses] = await conn.execute(
    "SELECT id, title, programType FROM courses WHERE programType IN ('bls','acls','pals','heartsaver') ORDER BY id"
  ) as any;
  courses.forEach((c: any) => console.log(`  ID ${c.id}: [${c.programType}] ${c.title}`));

  console.log('\n=== MODULE COUNT PER AHA COURSE ===');
  for (const course of courses) {
    const [mods] = await conn.execute(
      'SELECT id, title FROM modules WHERE courseId = ? ORDER BY orderIndex', [course.id]
    ) as any;
    console.log(`  Course ${course.id} (${course.programType}): ${mods.length} modules`);
    mods.forEach((m: any) => console.log(`    - Module ${m.id}: ${m.title}`));
  }

  console.log('\n=== TOTAL AHA COURSES VISIBLE TO FRONTEND ===');
  console.log(`  ${courses.length} courses (${courses.map((c: any) => c.programType).join(', ')})`);

  await conn.end();
}

main().catch(console.error);
