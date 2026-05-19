import { getDb } from './server/db';
import { moduleSections, quizQuestions } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const db = await getDb();

  // ── Fix Section 370: Module 2 Overview (Burns → ECMO overview) ────────────
  await db.update(moduleSections).set({
    content: `<h3>Module Overview: ECMO Support for Refractory Cardiogenic Shock</h3>
<p>Extracorporeal Membrane Oxygenation (ECMO) represents the highest level of mechanical circulatory support available for children with refractory cardiogenic shock. It is used when maximal medical therapy — including inotropes, vasopressors, and afterload reduction — has failed to restore adequate cardiac output and end-organ perfusion.</p>
<p>In this module you will learn the specific indications for VA-ECMO in paediatric cardiogenic shock, the cannulation strategy, anticoagulation management, and the criteria for safe weaning. Understanding ECMO is essential for any provider managing critically ill children with refractory cardiac failure, as early referral and timely initiation of ECMO can be life-saving.</p>
<p><strong>Key learning objectives:</strong></p>
<ul>
  <li>State the indications for VA-ECMO in paediatric cardiogenic shock</li>
  <li>Describe the cannulation approach and circuit management</li>
  <li>Outline anticoagulation targets and monitoring during ECMO</li>
  <li>Identify criteria for weaning and decannulation</li>
  <li>Recognise complications of ECMO and their management</li>
</ul>`
  }).where(eq(moduleSections.id, 370));
  console.log('✅ Fixed Section 370 (CS II Module 2 Overview)');

  // ── Fix Section 375: Module 3 Overview (Burns → Specific CS Scenarios) ───
  await db.update(moduleSections).set({
    content: `<h3>Module Overview: Specific Cardiogenic Shock Scenarios</h3>
<p>Paediatric cardiogenic shock encompasses a range of underlying aetiologies, each requiring a nuanced approach to diagnosis and management. While the initial resuscitation principles are shared, specific conditions — such as fulminant myocarditis, acute decompensation of congenital heart disease, post-operative low cardiac output syndrome, and septic cardiomyopathy — demand targeted interventions.</p>
<p>This module explores these specific scenarios in depth, providing the clinical decision-making framework needed to recognise and manage each condition effectively. Understanding the unique pathophysiology of each aetiology allows the provider to tailor inotrope selection, fluid strategy, and escalation decisions appropriately.</p>
<p><strong>Key learning objectives:</strong></p>
<ul>
  <li>Differentiate the clinical presentation and management of fulminant myocarditis from other causes of cardiogenic shock</li>
  <li>Describe the approach to acute decompensation of congenital heart disease</li>
  <li>Outline the management of post-operative low cardiac output syndrome</li>
  <li>Recognise septic cardiomyopathy and its distinction from primary septic shock</li>
  <li>Apply appropriate escalation criteria for each scenario</li>
</ul>`
  }).where(eq(moduleSections.id, 375));
  console.log('✅ Fixed Section 375 (CS II Module 3 Overview)');

  // ── Fix Section 380: Module 3 Section 6 (Burns → Long-Term Outcomes) ─────
  await db.update(moduleSections).set({
    title: 'Long-Term Outcomes and Follow-Up',
    content: `<h3>Long-Term Outcomes in Paediatric Cardiogenic Shock</h3>
<p>Survival from paediatric cardiogenic shock has improved significantly with advances in critical care, ECMO technology, and targeted pharmacotherapy. However, survivors often face long-term cardiac and neurodevelopmental sequelae that require structured follow-up.</p>
<ul>
  <li><strong>Cardiac recovery:</strong> Most children with myocarditis who survive the acute phase recover ventricular function within 6–12 months. Serial echocardiography is essential to monitor recovery.</li>
  <li><strong>Neurodevelopmental outcomes:</strong> Prolonged low cardiac output states and ECMO can result in hypoxic-ischaemic injury. Neurodevelopmental assessment at 6 months and 2 years post-discharge is recommended.</li>
  <li><strong>Medication weaning:</strong> Inotropes and afterload-reducing agents should be weaned gradually under cardiology supervision as cardiac function recovers. Abrupt cessation risks haemodynamic deterioration.</li>
  <li><strong>Congenital heart disease:</strong> Children with underlying CHD require ongoing cardiology follow-up and may need surgical or catheter-based intervention after stabilisation.</li>
  <li><strong>Rehabilitation:</strong> Graded physical rehabilitation is important for children recovering from prolonged PICU admission. Physiotherapy and occupational therapy should be initiated early.</li>
  <li><strong>Family support:</strong> Families of children who survive cardiogenic shock often experience significant psychological distress. Structured psychosocial support and clear communication about prognosis are essential components of follow-up care.</li>
</ul>
<div class="clinical-note">
  <strong>Clinical Note:</strong> All children who survive cardiogenic shock requiring ECMO should be referred to a specialist paediatric cardiology centre for long-term follow-up, regardless of apparent recovery at discharge.
</div>`
  }).where(eq(moduleSections.id, 380));
  console.log('✅ Fixed Section 380 (CS II Module 3 Section 6 - Long-Term Outcomes)');

  // ── Fix Quiz 108 (CS II Module 2) — duplicate questions → ECMO-specific ──
  // Q1385, Q1386, Q1387 are duplicates of CS I questions — replace them
  await db.update(quizQuestions).set({
    question: 'Which of the following is the PRIMARY indication for VA-ECMO in paediatric cardiogenic shock?',
    options: JSON.stringify([
      'Cardiogenic shock responding to a single inotrope',
      'Refractory cardiogenic shock despite maximal inotrope therapy (≥3 agents)',
      'Mild pulmonary oedema with preserved cardiac output',
      'Sinus tachycardia with normal blood pressure'
    ]),
    correctAnswer: JSON.stringify('Refractory cardiogenic shock despite maximal inotrope therapy (≥3 agents)'),
    explanation: 'VA-ECMO is indicated when cardiogenic shock is refractory to maximal medical therapy including at least 3 inotropic/vasopressor agents. It provides both cardiac and respiratory support by bypassing the heart and lungs.'
  }).where(eq(quizQuestions.id, 1385));

  await db.update(quizQuestions).set({
    question: 'During VA-ECMO for cardiogenic shock, which anticoagulant is used to prevent circuit thrombosis?',
    options: JSON.stringify([
      'Warfarin',
      'Aspirin',
      'Heparin infusion',
      'Clopidogrel'
    ]),
    correctAnswer: JSON.stringify('Heparin infusion'),
    explanation: 'Heparin infusion is the standard anticoagulant used during ECMO to prevent circuit thrombosis. Anti-Xa levels or activated clotting time (ACT) are monitored to maintain therapeutic anticoagulation while minimising bleeding risk.'
  }).where(eq(quizQuestions.id, 1386));

  await db.update(quizQuestions).set({
    question: 'When is it safe to begin weaning a child from VA-ECMO?',
    options: JSON.stringify([
      'After 24 hours on ECMO regardless of cardiac function',
      'When echocardiography shows improving ejection fraction and the child tolerates reduced ECMO flow',
      'When the child is afebrile for 6 hours',
      'When inotrope doses are at maximum'
    ]),
    correctAnswer: JSON.stringify('When echocardiography shows improving ejection fraction and the child tolerates reduced ECMO flow'),
    explanation: 'ECMO weaning is guided by echocardiographic evidence of recovering cardiac function and haemodynamic stability at progressively reduced ECMO flow rates. Premature weaning risks haemodynamic collapse.'
  }).where(eq(quizQuestions.id, 1387));
  console.log('✅ Fixed Quiz 108 questions (CS II Module 2 - ECMO specific)');

  // ── Fix Quiz 107 (CS II Module 1) — Q1383-Q1384 are wrong/incomplete ─────
  // Q1383: "most common cause of cardiogenic shock in children" — this is a CS I question
  await db.update(quizQuestions).set({
    question: 'When combining dopamine and dobutamine in refractory cardiogenic shock, what is the primary rationale?',
    options: JSON.stringify([
      'Dopamine provides inotropy while dobutamine provides vasopressor support',
      'Dopamine maintains blood pressure via vasopressor effect while dobutamine provides inotropy and reduces afterload',
      'Both drugs act identically and are used together to double the dose effect',
      'Dobutamine increases heart rate while dopamine reduces it'
    ]),
    correctAnswer: JSON.stringify('Dopamine maintains blood pressure via vasopressor effect while dobutamine provides inotropy and reduces afterload'),
    explanation: 'In refractory cardiogenic shock, dopamine (at higher doses 10–20 mcg/kg/min) provides vasopressor support to maintain blood pressure, while dobutamine (5–15 mcg/kg/min) provides inotropy and reduces afterload via beta-1 and mild beta-2 stimulation. This combination addresses both low cardiac output and hypotension.'
  }).where(eq(quizQuestions.id, 1383));

  await db.update(quizQuestions).set({
    question: 'Nitroprusside is used as an afterload-reducing agent in cardiogenic shock. What is the most important monitoring requirement during its use?',
    options: JSON.stringify([
      'Blood glucose every 2 hours',
      'Continuous blood pressure monitoring and cyanide toxicity screening with prolonged use',
      'Urine output only',
      'Temperature monitoring every 4 hours'
    ]),
    correctAnswer: JSON.stringify('Continuous blood pressure monitoring and cyanide toxicity screening with prolonged use'),
    explanation: 'Nitroprusside is a potent vasodilator requiring continuous arterial blood pressure monitoring. With prolonged use (>48–72 hours) or high doses, cyanide toxicity can occur, particularly in children with renal or hepatic impairment. Signs include metabolic acidosis, tachyphylaxis, and altered mental status.'
  }).where(eq(quizQuestions.id, 1384));

  // Add missing 3rd question for Quiz 107 (CS II Module 1)
  const [inserted] = await db.insert(quizQuestions).values({
    quizId: 107,
    question: 'What is the recommended strategy for weaning inotropes in a child recovering from cardiogenic shock?',
    options: JSON.stringify([
      'Stop all inotropes simultaneously once blood pressure normalises',
      'Wean the highest-dose inotrope first, then reduce others gradually while monitoring cardiac function',
      'Continue inotropes at full dose until discharge',
      'Wean inotropes only after 7 days regardless of clinical status'
    ]),
    correctAnswer: JSON.stringify('Wean the highest-dose inotrope first, then reduce others gradually while monitoring cardiac function'),
    explanation: 'Inotrope weaning should be gradual and guided by clinical and echocardiographic assessment. The highest-dose agent is typically weaned first. Abrupt cessation risks haemodynamic deterioration. Serial echocardiography and clinical monitoring are essential during the weaning process.',
    explanation2: null,
    orderIndex: 3,
    points: 1,
  } as any);
  console.log('✅ Added missing 3rd question to Quiz 107 (CS II Module 1)');

  // ── Fix Quiz 109 (CS II Module 3) — Q1388-Q1390 are duplicates of CS I ───
  await db.update(quizQuestions).set({
    question: 'A child with fulminant myocarditis presents in cardiogenic shock with a markedly dilated left ventricle and ejection fraction of 10%. Which management step is most critical?',
    options: JSON.stringify([
      'Aggressive fluid resuscitation with 20 mL/kg boluses',
      'Early referral for ECMO consideration alongside cautious inotrope support',
      'Immediate high-dose corticosteroids',
      'Digoxin loading dose'
    ]),
    correctAnswer: JSON.stringify('Early referral for ECMO consideration alongside cautious inotrope support'),
    explanation: 'Fulminant myocarditis with severely depressed ventricular function (EF <20%) and cardiogenic shock has a high mortality without mechanical support. Early referral to an ECMO-capable centre is critical. Aggressive fluid boluses are harmful in this context as they worsen pulmonary oedema and ventricular distension.'
  }).where(eq(quizQuestions.id, 1388));

  await db.update(quizQuestions).set({
    question: 'A neonate with an undiagnosed duct-dependent congenital heart lesion presents in cardiogenic shock after the ductus arteriosus closes. What is the immediate priority?',
    options: JSON.stringify([
      'Immediate surgical repair',
      'Prostaglandin E1 infusion to reopen the ductus arteriosus',
      'High-dose dopamine',
      'Fluid bolus 20 mL/kg'
    ]),
    correctAnswer: JSON.stringify('Prostaglandin E1 infusion to reopen the ductus arteriosus'),
    explanation: 'Duct-dependent lesions (e.g., critical aortic stenosis, hypoplastic left heart, coarctation of the aorta, pulmonary atresia) rely on a patent ductus arteriosus for systemic or pulmonary blood flow. Prostaglandin E1 (0.05–0.1 mcg/kg/min) reopens the ductus and is life-saving while awaiting definitive surgical or catheter intervention.'
  }).where(eq(quizQuestions.id, 1389));

  await db.update(quizQuestions).set({
    question: 'Post-operative low cardiac output syndrome (LCOS) after cardiac surgery is best managed by:',
    options: JSON.stringify([
      'Immediate return to theatre for revision surgery',
      'Optimising preload, reducing afterload, and providing inotropic support while monitoring for surgical complications',
      'Stopping all inotropes and allowing spontaneous recovery',
      'Aggressive fluid loading with 30 mL/kg boluses'
    ]),
    correctAnswer: JSON.stringify('Optimising preload, reducing afterload, and providing inotropic support while monitoring for surgical complications'),
    explanation: 'Post-operative LCOS is managed by optimising preload (avoiding hypovolaemia and fluid overload), reducing afterload (milrinone, nitroprusside), and providing inotropic support (dobutamine, adrenaline). Surgical complications (residual lesions, tamponade, arrhythmias) must be excluded by echocardiography and clinical assessment.'
  }).where(eq(quizQuestions.id, 1390));
  console.log('✅ Fixed Quiz 109 questions (CS II Module 3 - specific scenarios)');

  console.log('\n✅ All Cardiogenic Shock II content fixes applied successfully.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
