/**
 * fix-acls-audit-2025.ts
 * Applies all corrections identified in the ACLS Audit Report (vs AHA 2025 Manual)
 *
 * Corrections:
 * 1. Module 1, Section 1 — Rewrite "Systematic Approach" to match AHA 2025 (Primary ABCDE + Secondary SAMPLE/H&T)
 * 2. Module 4, Section 2 — Fix Atropine dose from 0.5 mg to 1 mg
 * 3. Q1449 — Fix Atropine dose in quiz question stem/explanation
 * 4. Q1507 — Fix Atropine dose in final quiz
 * 5. Q1519 — Fix "6 doses of 0.5 mg" to "3 doses of 1 mg" in explanation
 * 6. Q1455 — Fix TTM range from "32–36°C" to "32–37.5°C for ≥36 hours"
 * 7. Q1514 — Fix TTM answer to reflect unified 32–37.5°C range
 * 8. Q1516 — Replace off-topic sepsis vasopressor question with ACLS-relevant post-ROSC vasopressor question
 */

import * as dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

const DB_URL = process.env.DATABASE_URL!;

function parseDbUrl(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: parseInt(u.port || '3306'),
    user: u.username,
    password: u.password,
    database: u.pathname.replace('/', ''),
    ssl: { rejectUnauthorized: false },
  };
}

// ─── AHA 2025 Systematic Approach — corrected HTML ───────────────────────────
const SYSTEMATIC_APPROACH_2025 = `<h2>The ACLS Systematic Approach (AHA 2025)</h2>
<p>ACLS uses a structured, four-step systematic approach to assess and treat every patient — whether in cardiac arrest or acutely ill. The approach ensures no critical finding is missed and guides the team from initial recognition through to definitive treatment.</p>

<div class="callout callout-warning">
  <strong>AHA 2025 Systematic Approach — Four Steps:</strong>
  <ol>
    <li>Initial Assessment (scene safety and first impression)</li>
    <li>BLS Assessment (for unresponsive patients)</li>
    <li>Primary Assessment — A, B, C, D, E</li>
    <li>Secondary Assessment — SAMPLE history + H's and T's</li>
  </ol>
</div>

<h3>Step 1: Initial Assessment</h3>
<p>Before approaching any patient, verify scene safety. Once safe, determine the patient's level of consciousness. If the patient is <strong>unresponsive</strong>, proceed immediately to the BLS Assessment. If the patient is <strong>conscious</strong>, proceed directly to the Primary Assessment.</p>

<h3>Step 2: BLS Assessment (Unresponsive Patient)</h3>
<table>
  <thead><tr><th>Step</th><th>Action</th></tr></thead>
  <tbody>
    <tr><td>C — Compressions</td><td>No pulse → begin CPR immediately; 100–120/min, 5–6 cm depth, full recoil, CCF ≥60%</td></tr>
    <tr><td>A — Airway</td><td>Open airway (head-tilt chin-lift or jaw thrust); clear obstruction</td></tr>
    <tr><td>B — Breathing</td><td>Give rescue breaths (30:2 without advanced airway); 1 breath every 6 sec with advanced airway</td></tr>
    <tr><td>D — Defibrillation</td><td>Attach AED/monitor as soon as available; shock shockable rhythms without delay</td></tr>
  </tbody>
</table>

<h3>Step 3: Primary Assessment — A, B, C, D, E</h3>
<p>The Primary Assessment is a rapid, systematic evaluation of the patient's physiology. Each letter represents both an assessment and an intervention — you treat as you assess.</p>
<table>
  <thead><tr><th>Step</th><th>Assess</th><th>Intervene</th></tr></thead>
  <tbody>
    <tr><td><strong>A — Airway</strong></td><td>Is the airway open and maintainable?</td><td>Reposition, suction, jaw thrust; consider supraglottic airway or ETT</td></tr>
    <tr><td><strong>B — Breathing</strong></td><td>Rate, depth, symmetry, SpO₂, work of breathing</td><td>Supplemental O₂; BVM ventilation; target SpO₂ 94–98%</td></tr>
    <tr><td><strong>C — Circulation</strong></td><td>Pulse (rate, rhythm, quality), BP, skin perfusion, bleeding</td><td>IV/IO access; cardiac monitoring; 12-lead ECG; fluids or vasopressors as needed</td></tr>
    <tr><td><strong>D — Disability</strong></td><td>Level of consciousness (AVPU or GCS), pupils, blood glucose</td><td>Treat hypoglycaemia; consider seizure management; protect airway if GCS ≤8</td></tr>
    <tr><td><strong>E — Exposure</strong></td><td>Full body exam — rashes, bleeding, trauma, temperature</td><td>Treat identified injuries; prevent hypothermia; maintain dignity</td></tr>
  </tbody>
</table>

<h3>Step 4: Secondary Assessment — SAMPLE + H's and T's</h3>
<p>After stabilising the patient with the Primary Assessment, gather a focused history and search for reversible causes.</p>
<table>
  <thead><tr><th>SAMPLE</th><th>Question</th></tr></thead>
  <tbody>
    <tr><td><strong>S</strong> — Signs and Symptoms</td><td>What is the chief complaint? When did it start?</td></tr>
    <tr><td><strong>A</strong> — Allergies</td><td>Any known drug or environmental allergies?</td></tr>
    <tr><td><strong>M</strong> — Medications</td><td>Current medications (especially antiarrhythmics, anticoagulants, insulin)?</td></tr>
    <tr><td><strong>P</strong> — Past Medical History</td><td>Relevant cardiac, respiratory, or metabolic conditions?</td></tr>
    <tr><td><strong>L</strong> — Last Oral Intake</td><td>When did the patient last eat or drink?</td></tr>
    <tr><td><strong>E</strong> — Events Leading Up</td><td>What was the patient doing when this started?</td></tr>
  </tbody>
</table>

<div class="clinical-note">
  <strong>H's and T's — Reversible Causes (searched during Secondary Assessment):</strong>
  <p>Hypoxia · Hypovolaemia · Hydrogen ion (acidosis) · Hypo/Hyperkalaemia · Hypothermia · Tension pneumothorax · Tamponade (cardiac) · Toxins · Thrombosis (pulmonary) · Thrombosis (coronary)</p>
</div>

<div class="callout callout-info">
  <strong>Key Rule:</strong> If a patient who was conscious becomes unresponsive at any point during the Primary or Secondary Assessment, immediately switch to the BLS Assessment and activate the cardiac arrest algorithm.
</div>`;

// ─── Bradycardia Algorithm — corrected HTML (Atropine 1 mg) ──────────────────
const BRADYCARDIA_ALGORITHM_2025 = `<h2>Bradycardia Algorithm (AHA 2025)</h2>
<p>Bradycardia is defined as a heart rate &lt;60 bpm. It is only treated if it is causing symptoms or haemodynamic compromise.</p>

<h3>Algorithm Overview</h3>
<ol>
  <li><strong>Identify and treat underlying cause</strong> (hypoxia, medications, hypothyroidism, heart block, MI)</li>
  <li><strong>Stable bradycardia:</strong> Monitor; treat underlying cause; observe</li>
  <li><strong>Unstable bradycardia</strong> (hypotension, altered mental status, ischaemic chest pain, acute heart failure):
    <ul>
      <li><strong>Atropine 1 mg IV</strong> — repeat every 3–5 minutes; maximum 3 mg total (3 doses)</li>
      <li>If atropine ineffective: transcutaneous pacing (TCP) or dopamine 5–20 mcg/kg/min infusion or adrenaline 2–10 mcg/min infusion</li>
      <li>Prepare for transvenous pacing if TCP fails or is unavailable</li>
    </ul>
  </li>
</ol>

<div class="callout callout-warning">
  <strong>AHA 2025 Caution — Atropine Dosing:</strong>
  <ul>
    <li>The initial dose is <strong>1 mg IV</strong> (not 0.5 mg). Doses below 0.5 mg may paradoxically worsen bradycardia.</li>
    <li>Maximum total dose: 3 mg (3 × 1 mg doses)</li>
    <li>Do NOT rely on atropine for Mobitz Type II or third-degree AV block — these require pacing</li>
    <li>Avoid atropine in heart transplant patients (denervated heart will not respond)</li>
  </ul>
</div>

<h3>Medications for Bradycardia</h3>
<table>
  <thead><tr><th>Drug</th><th>Dose</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>Atropine</td><td>1 mg IV every 3–5 min (max 3 mg)</td><td>First-line; not effective for denervated hearts or infranodal block</td></tr>
    <tr><td>Dopamine</td><td>5–20 mcg/kg/min IV infusion</td><td>Second-line if atropine fails; titrate to HR and BP</td></tr>
    <tr><td>Adrenaline (Epinephrine)</td><td>2–10 mcg/min IV infusion</td><td>Alternative to dopamine; useful when hypotension is also present</td></tr>
    <tr><td>Transcutaneous Pacing (TCP)</td><td>Rate 60–80/min; increase mA until capture</td><td>Immediate bridge to transvenous pacing; sedate if conscious</td></tr>
  </tbody>
</table>

<div class="clinical-note">
  <strong>When to go straight to pacing (bypass atropine):</strong>
  <ul>
    <li>Mobitz Type II second-degree AV block</li>
    <li>Third-degree (complete) AV block</li>
    <li>New wide-complex bradycardia (infranodal block)</li>
    <li>Haemodynamic instability with impending cardiac arrest</li>
  </ul>
</div>`;

async function run() {
  const conn = await mysql.createConnection(parseDbUrl(DB_URL));
  console.log('Connected to DB');

  let updated = 0;

  // ── 1. Module 1, Section 1 — Systematic Approach ──────────────────────────
  const [m1s1] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT id FROM moduleSections WHERE title = ? LIMIT 1`,
    ['Overview: The ACLS Systematic Approach']
  );
  if (m1s1.length) {
    await conn.execute(
      `UPDATE moduleSections SET content = ? WHERE id = ?`,
      [SYSTEMATIC_APPROACH_2025, m1s1[0].id]
    );
    console.log(`✅ Module 1 Section 1 (id=${m1s1[0].id}) — Systematic Approach rewritten`);
    updated++;
  } else {
    console.log('⚠️  Module 1 Section 1 not found by title — skipping');
  }

  // ── 2. Module 4, Section 2 — Bradycardia Algorithm (Atropine 1 mg) ────────
  const [m4s2] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT id FROM moduleSections WHERE title = ? LIMIT 1`,
    ['Bradycardia Algorithm']
  );
  if (m4s2.length) {
    await conn.execute(
      `UPDATE moduleSections SET content = ? WHERE id = ?`,
      [BRADYCARDIA_ALGORITHM_2025, m4s2[0].id]
    );
    console.log(`✅ Module 4 Section 2 (id=${m4s2[0].id}) — Bradycardia Algorithm updated (Atropine 1 mg)`);
    updated++;
  } else {
    console.log('⚠️  Bradycardia Algorithm section not found — skipping');
  }

  // ── 3. Q1449 — Fix Atropine dose in formative quiz ─────────────────────────
  await conn.execute(
    `UPDATE quizQuestions SET
      question = ?,
      explanation = ?
    WHERE id = 1449`,
    [
      'A patient has a heart rate of 38 bpm with hypotension and altered consciousness. Atropine 1 mg IV has been given twice (total 2 mg) with no improvement. What is the next step?',
      'If atropine (maximum 3 mg total, given as 1 mg doses) is ineffective for unstable bradycardia, the next step is transcutaneous pacing (TCP). Dopamine (5–20 mcg/kg/min) or adrenaline (2–10 mcg/min) infusion can be used as a bridge to pacing. The AHA 2025 initial atropine dose is 1 mg IV (not 0.5 mg) — doses below 0.5 mg may paradoxically worsen bradycardia.'
    ]
  );
  console.log('✅ Q1449 — Atropine dose updated to 1 mg');
  updated++;

  // ── 4. Q1507 — Fix Atropine dose in final quiz ─────────────────────────────
  await conn.execute(
    `UPDATE quizQuestions SET
      explanation = ?
    WHERE id = 1507`,
    [
      'Symptomatic bradycardia: atropine 1 mg IV is first-line (AHA 2025). Repeat every 3–5 minutes to a maximum of 3 mg (3 doses). If atropine is ineffective: transcutaneous pacing, dopamine infusion (5–20 mcg/kg/min), or adrenaline infusion (2–10 mcg/min). Do not rely on atropine for Mobitz Type II or third-degree AV block — these require pacing.'
    ]
  );
  console.log('✅ Q1507 — Atropine explanation updated to 1 mg');
  updated++;

  // ── 5. Q1519 — Fix "6 doses of 0.5 mg" to "3 doses of 1 mg" ──────────────
  await conn.execute(
    `UPDATE quizQuestions SET
      explanation = ?
    WHERE id = 1519`,
    [
      'Maximum atropine dose for symptomatic bradycardia: 3 mg (given as 3 doses of 1 mg each, every 3–5 minutes). Doses above 3 mg provide no additional benefit. The AHA 2025 initial dose is 1 mg IV — doses below 0.5 mg may paradoxically slow the heart rate.'
    ]
  );
  console.log('✅ Q1519 — Atropine max dose explanation corrected (3 × 1 mg)');
  updated++;

  // ── 6. Q1455 — Fix TTM range in formative quiz ─────────────────────────────
  await conn.execute(
    `UPDATE quizQuestions SET
      correctAnswer = ?,
      explanation = ?
    WHERE id = 1455`,
    [
      '32–37.5°C for at least 36 hours',
      'AHA 2025 redefines TTM as "temperature control": select any temperature between 32°C and 37.5°C and maintain it for at least 36 hours. This applies to all comatose survivors of cardiac arrest regardless of arrest location or rhythm. After the temperature control period, prevent fever (>37.5°C) for at least 72 hours. The old 2020 range of 32–36°C for 24 hours is superseded.'
    ]
  );
  console.log('✅ Q1455 — TTM range corrected to 32–37.5°C for ≥36 hours');
  updated++;

  // ── 7. Q1514 — Fix TTM answer in final quiz ────────────────────────────────
  await conn.execute(
    `UPDATE quizQuestions SET
      correctAnswer = ?,
      explanation = ?
    WHERE id = 1514`,
    [
      '32–37.5°C for at least 36 hours (temperature control)',
      'AHA 2025 replaces the term "TTM" with "temperature control". The recommendation is to select and maintain any temperature between 32°C and 37.5°C for at least 36 hours for all comatose survivors of cardiac arrest. After this period, prevent fever (>37.5°C) for at least 72 hours. The previous 2020 sub-tiers (32–34°C vs 36°C) are no longer the recommended framing — the full range is acceptable and the choice depends on individual patient factors.'
    ]
  );
  console.log('✅ Q1514 — TTM final quiz answer corrected to 32–37.5°C');
  updated++;

  // ── 8. Q1516 — Replace off-topic sepsis question with post-ROSC vasopressors
  await conn.execute(
    `UPDATE quizQuestions SET
      question = ?,
      options = ?,
      correctAnswer = ?,
      explanation = ?
    WHERE id = 1516`,
    [
      'After ROSC from cardiac arrest, the patient remains hypotensive (MAP 50 mmHg) despite adequate fluid resuscitation. What is the first-line vasopressor?',
      JSON.stringify([
        'Noradrenaline (norepinephrine) infusion',
        'Adrenaline (epinephrine) bolus 1 mg IV',
        'Dopamine 5 mcg/kg/min infusion',
        'Vasopressin 40 units IV bolus'
      ]),
      'Noradrenaline (norepinephrine) infusion',
      'Post-ROSC haemodynamic targets: MAP ≥65 mmHg (adults). Noradrenaline is the first-line vasopressor for post-cardiac arrest hypotension — it provides vasoconstriction with less tachycardia than dopamine, reducing myocardial oxygen demand. Dopamine is an acceptable alternative. Adrenaline bolus is not appropriate post-ROSC (reserved for cardiac arrest). Target MAP ≥65 mmHg to ensure adequate cerebral and coronary perfusion during the post-arrest period.'
    ]
  );
  console.log('✅ Q1516 — Replaced off-topic sepsis question with post-ROSC vasopressor question');
  updated++;

  await conn.end();
  console.log(`\n✅ ACLS Audit Corrections Complete — ${updated} updates applied`);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
