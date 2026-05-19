import * as mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  let fixCount = 0;

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 1: BLS Section 531 — "AHA 2020" → "AHA 2025" in Chain of Survival heading
  // ─────────────────────────────────────────────────────────────────────────
  const [f1] = await conn.execute<any>(
    'UPDATE moduleSections SET content = REPLACE(content, \'The 6-Link Chain of Survival (AHA 2020)\', \'The 6-Link Chain of Survival (AHA 2025)\') WHERE id = 531'
  );
  console.log(`Fix 1 — BLS 531 Chain of Survival year: ${f1.affectedRows} row(s) updated`);
  fixCount += f1.affectedRows;

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 2: BLS M5 Quiz — replace 3 wrong ACLS questions with correct BLS
  //         post-resuscitation care and team dynamics questions
  //
  //  Current wrong questions:
  //   id=1437: AF cardioversion energy (ACLS content)
  //   id=1438: Polymorphic VT management (ACLS content)
  //   id=1439: Closed-loop communication (correct for BLS M5 team dynamics)
  //
  //  Fix: Replace 1437 and 1438 with correct BLS post-resus questions.
  //  Keep 1439 (closed-loop communication is valid BLS team dynamics content).
  // ─────────────────────────────────────────────────────────────────────────

  // Replace Q1437 — post-ROSC care question
  const [f2a] = await conn.execute<any>(
    `UPDATE quizQuestions SET
      question = 'After return of spontaneous circulation (ROSC), which of the following is the MOST important immediate priority?',
      options = '["Begin targeted temperature management immediately","Ensure adequate oxygenation and ventilation, and obtain a 12-lead ECG","Administer amiodarone prophylactically","Perform immediate coronary angiography in all patients"]',
      correctAnswer = 'Ensure adequate oxygenation and ventilation, and obtain a 12-lead ECG',
      explanation = 'After ROSC, the immediate priorities per 2025 AHA guidelines are: ensure adequate oxygenation (SpO2 92–98%), avoid hyperoxia, obtain a 12-lead ECG to identify STEMI or LBBB requiring urgent cath lab activation, and support haemodynamics. TTM is initiated after stabilisation, not as the first step.'
    WHERE id = 1437`
  );
  console.log(`Fix 2a — BLS M5 Q1437 replaced: ${f2a.affectedRows} row(s)`);
  fixCount += f2a.affectedRows;

  // Replace Q1438 — team dynamics / roles question
  const [f2b] = await conn.execute<any>(
    `UPDATE quizQuestions SET
      question = 'During a resuscitation, the team leader assigns roles before starting CPR. What is the PRIMARY benefit of this approach?',
      options = '["It satisfies hospital documentation requirements","It ensures each team member knows their specific task, reducing confusion and delays","It allows the team leader to take a supervisory role without performing compressions","It is only required for in-hospital cardiac arrests"]',
      correctAnswer = 'It ensures each team member knows their specific task, reducing confusion and delays',
      explanation = 'Pre-assigning roles is a core principle of high-performance team dynamics in the 2025 AHA guidelines. Clear role assignment prevents duplication of effort, ensures all critical tasks are covered (compressions, airway, IV access, timing, documentation), and allows the team leader to focus on decision-making rather than task execution.'
    WHERE id = 1438`
  );
  console.log(`Fix 2b — BLS M5 Q1438 replaced: ${f2b.affectedRows} row(s)`);
  fixCount += f2b.affectedRows;

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 3: BLS Section 535 — infant CPR technique
  //         Ensure 2-finger technique is marked as ELIMINATED and
  //         2 thumb-encircling is listed as the ONLY preferred method
  // ─────────────────────────────────────────────────────────────────────────
  const [s535] = await conn.execute<any[]>('SELECT content FROM moduleSections WHERE id = 535');
  const content535: string = (s535 as any[])[0]?.content || '';

  // Check if the old 2-finger technique language is present
  if (content535.includes('2-finger') || content535.includes('two-finger') || content535.includes('Two-finger')) {
    // Replace old infant technique text with 2025-correct content
    const updated535 = content535
      .replace(/2-finger[^<]*/gi, '2 thumb-encircling hands technique (preferred for all infant CPR)')
      .replace(/two-finger[^<]*/gi, '2 thumb-encircling hands technique (preferred for all infant CPR)')
      .replace(/Two-finger[^<]*/gi, '2 thumb-encircling hands technique (preferred for all infant CPR)');
    const [f3] = await conn.execute<any>(
      'UPDATE moduleSections SET content = ? WHERE id = 535',
      [updated535]
    );
    console.log(`Fix 3 — BLS 535 infant CPR technique: ${f3.affectedRows} row(s) updated`);
    fixCount += f3.affectedRows;
  } else {
    console.log('Fix 3 — BLS 535: no 2-finger language found, checking for other infant technique text...');
    // Check for "two fingers" variant
    if (content535.toLowerCase().includes('infant')) {
      console.log('  Infant content present. Snippet:', content535.substring(0, 300));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 4: Scan ALL BLS and ACLS sections for any remaining "AHA 2020" refs
  // ─────────────────────────────────────────────────────────────────────────
  const [remaining2020] = await conn.execute<any[]>(
    'SELECT id, SUBSTRING(content, LOCATE(\'2020\', content)-30, 80) as context FROM moduleSections WHERE content LIKE \'%2020%\' AND moduleId IN (SELECT id FROM modules WHERE courseId IN (SELECT id FROM courses WHERE programType IN (\'bls\',\'acls\')))'
  );
  if ((remaining2020 as any[]).length > 0) {
    console.log('\nRemaining 2020 references in sections:');
    for (const r of remaining2020 as any[]) console.log(`  Section ${r.id}: ...${r.context}...`);

    // Blanket replace any remaining "2020 AHA" or "AHA 2020" in BLS/ACLS sections
    const [f4] = await conn.execute<any>(
      'UPDATE moduleSections SET content = REPLACE(REPLACE(content, \'AHA 2020\', \'AHA 2025\'), \'2020 AHA\', \'2025 AHA\') WHERE moduleId IN (SELECT id FROM modules WHERE courseId IN (SELECT id FROM courses WHERE programType IN (\'bls\',\'acls\')))'
    );
    console.log(`Fix 4 — Remaining 2020 refs in sections: ${f4.affectedRows} row(s) updated`);
    fixCount += f4.affectedRows;
  } else {
    console.log('Fix 4 — No remaining 2020 refs in sections. Good.');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 5: Scan ALL BLS and ACLS quiz questions for remaining "2020" refs
  // ─────────────────────────────────────────────────────────────────────────
  const [remaining2020q] = await conn.execute<any[]>(
    'SELECT id, SUBSTRING(question, 1, 100) as q FROM quizQuestions WHERE (question LIKE \'%2020%\' OR explanation LIKE \'%2020%\') AND quizId IN (SELECT id FROM quizzes WHERE moduleId IN (SELECT id FROM modules WHERE courseId IN (SELECT id FROM courses WHERE programType IN (\'bls\',\'acls\'))))'
  );
  if ((remaining2020q as any[]).length > 0) {
    console.log('\nRemaining 2020 references in quiz questions:');
    for (const r of remaining2020q as any[]) console.log(`  Q${r.id}: ${r.q}`);
    const [f5] = await conn.execute<any>(
      'UPDATE quizQuestions SET question = REPLACE(REPLACE(question, \'AHA 2020\', \'AHA 2025\'), \'2020 AHA\', \'2025 AHA\'), explanation = REPLACE(REPLACE(explanation, \'AHA 2020\', \'AHA 2025\'), \'2020 AHA\', \'2025 AHA\') WHERE quizId IN (SELECT id FROM quizzes WHERE moduleId IN (SELECT id FROM modules WHERE courseId IN (SELECT id FROM courses WHERE programType IN (\'bls\',\'acls\'))))'
    );
    console.log(`Fix 5 — Remaining 2020 refs in quiz questions: ${f5.affectedRows} row(s) updated`);
    fixCount += f5.affectedRows;
  } else {
    console.log('Fix 5 — No remaining 2020 refs in quiz questions. Good.');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 6: ACLS Section 571 — verify it has correct Stroke content
  //         (was previously overwritten with post-arrest content by mistake)
  // ─────────────────────────────────────────────────────────────────────────
  const [s571] = await conn.execute<any[]>('SELECT SUBSTRING(content,1,300) as snippet FROM moduleSections WHERE id=571');
  const snippet571 = (s571 as any[])[0]?.snippet || '';
  console.log('\nACLS Section 571 current content (first 300 chars):');
  console.log(snippet571);
  if (!snippet571.toLowerCase().includes('stroke')) {
    console.log('  WARNING: Section 571 does not appear to contain stroke content — needs manual review');
  } else {
    console.log('  OK: Section 571 contains stroke content');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  console.log(`\n=== TOTAL FIXES APPLIED: ${fixCount} DB rows updated ===`);

  await conn.end();
}

main().catch(e => { console.error(e); process.exit(1); });
