import * as mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  // BLS and ACLS course structure
  const structureSQL = 'SELECT c.id as courseId, c.title as courseTitle, c.programType,' +
    ' m.id as moduleId, m.title as moduleTitle, m.`order` as mOrder,' +
    ' ms.id as sectionId, ms.title as sectionTitle, ms.`order` as sOrder' +
    ' FROM courses c' +
    ' JOIN modules m ON m.courseId = c.id' +
    ' JOIN moduleSections ms ON ms.moduleId = m.id' +
    " WHERE c.programType IN ('bls','acls')" +
    ' ORDER BY c.programType, m.`order`, ms.`order`';

  const [rows] = await conn.execute<any[]>(structureSQL);
  let lastModule = '';
  for (const r of rows) {
    const mod = `[${r.programType.toUpperCase()}] Module ${r.mOrder}: ${r.moduleTitle} (id=${r.moduleId})`;
    if (mod !== lastModule) { console.log('\n' + mod); lastModule = mod; }
    console.log(`  Section id=${r.sectionId} ord=${r.sOrder}: ${r.sectionTitle}`);
  }

  // Quizzes
  const quizSQL = 'SELECT c.programType, m.`order` as mOrder, m.title as mTitle,' +
    ' q.id as quizId, q.title as quizTitle, COUNT(qq.id) as qCount' +
    ' FROM courses c JOIN modules m ON m.courseId=c.id' +
    ' JOIN quizzes q ON q.moduleId=m.id' +
    ' LEFT JOIN quizQuestions qq ON qq.quizId=q.id' +
    " WHERE c.programType IN ('bls','acls')" +
    ' GROUP BY q.id ORDER BY c.programType, m.`order`';

  const [qrows] = await conn.execute<any[]>(quizSQL);
  console.log('\n=== QUIZZES ===');
  for (const q of qrows) {
    console.log(`[${q.programType.toUpperCase()}] M${q.mOrder} "${q.mTitle}" — quiz id=${q.quizId} (${q.qCount} questions): ${q.quizTitle}`);
  }

  // BLS M5 quiz questions
  const m5SQL = 'SELECT qq.id, qq.question FROM quizQuestions qq' +
    ' JOIN quizzes q ON qq.quizId = q.id' +
    ' JOIN modules m ON q.moduleId = m.id' +
    ' JOIN courses c ON m.courseId = c.id' +
    " WHERE c.programType = 'bls' AND m.`order` = 5";
  const [m5quiz] = await conn.execute<any[]>(m5SQL);
  console.log('\n=== BLS M5 QUIZ QUESTIONS ===');
  for (const q of m5quiz) console.log(`  id=${q.id}: ${q.question}`);

  // BLS overview section - check Chain of Survival text
  const [s531] = await conn.execute<any[]>('SELECT id, SUBSTRING(content,1,600) as snippet FROM moduleSections WHERE id=531');
  console.log('\n=== BLS Section 531 (overview) first 600 chars ===');
  console.log((s531 as any[])[0]?.snippet);

  // BLS M3 CPR technique table section
  const [s535] = await conn.execute<any[]>('SELECT id, SUBSTRING(content,1,1500) as snippet FROM moduleSections WHERE id=535');
  console.log('\n=== BLS Section 535 (CPR technique) first 1500 chars ===');
  console.log((s535 as any[])[0]?.snippet);

  // Learning tip - check MicroCoursePlayerDB hardcoded text (not in DB, in code)
  console.log('\n=== NOTE: Learning Tip is hardcoded in MicroCoursePlayerDB.tsx, not in DB ===');

  await conn.end();
}

main().catch(e => { console.error(e); process.exit(1); });
