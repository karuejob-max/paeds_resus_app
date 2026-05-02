import mysql from "mysql2/promise";

async function main() {
  const pool = mysql.createPool(process.env.DATABASE_URL!);
  console.log("Updating ACLS and PALS content to 2025 AHA ECC Guidelines...\n");

  // ============================================================
  // ACLS UPDATES
  // ============================================================

  // 1. Fix Q1534: Post-cardiac arrest temperature — 2025 updated range
  await pool.query(`
    UPDATE quizQuestions SET
      question = 'What is the recommended post-cardiac arrest temperature management target for comatose survivors according to the 2025 AHA guidelines?',
      correctAnswer = 'Maintain temperature 32–37.5°C for ≥24 hours; actively prevent fever >37.5°C for at least 72 hours',
      options = JSON_ARRAY(
        'Maintain temperature at exactly 33°C for 24 hours',
        'Maintain temperature 32–37.5°C for ≥24 hours; actively prevent fever >37.5°C for at least 72 hours',
        'Maintain temperature 36–37°C; no specific duration required',
        'Targeted temperature management is no longer recommended'
      ),
      explanation = 'The 2025 AHA guidelines update TTM: maintain temperature 32–37.5°C for at least 24 hours in comatose survivors of IHCA or OHCA. Critically, fever (>37.5°C) must be actively prevented for at least 72 hours post-arrest. Strict normothermia is acceptable if TTM is not feasible.'
    WHERE id = 1534
  `);
  console.log("✅ Q1534: Updated post-cardiac arrest TTM target to 2025");

  // 2. Fix Q1542: Post-ROSC BP target — correct to ≥50th percentile
  await pool.query(`
    UPDATE quizQuestions SET
      question = 'What is the recommended post-ROSC blood pressure target in children according to the 2025 AHA guidelines?',
      correctAnswer = 'Age-appropriate blood pressure; MAP ≥50th percentile for age',
      options = JSON_ARRAY(
        'Systolic BP >60 mmHg regardless of age',
        'Age-appropriate blood pressure; MAP ≥50th percentile for age',
        'MAP ≥5th percentile for age',
        'Systolic BP >90 mmHg for all children'
      ),
      explanation = 'The 2025 AHA guidelines recommend targeting age-appropriate blood pressure post-ROSC, with MAP ≥50th percentile for age. Hypotension must be avoided as it worsens neurological outcomes. Vasopressors should be titrated to achieve this target.'
    WHERE id = 1542
  `);
  console.log("✅ Q1542: Corrected post-ROSC BP target to ≥50th percentile");

  // 3. Add/update ACLS question about polymorphic VT — 2025 key change
  await pool.query(`
    UPDATE quizQuestions SET
      question = 'A patient develops polymorphic ventricular tachycardia (polymorphic VT) with a pulse. What is the correct immediate management according to 2025 AHA ACLS guidelines?',
      correctAnswer = 'Immediate unsynchronised defibrillation — polymorphic VT is always unstable',
      options = JSON_ARRAY(
        'Synchronised cardioversion at 100 J',
        'IV amiodarone 300 mg bolus',
        'Immediate unsynchronised defibrillation — polymorphic VT is always unstable',
        'Adenosine 6 mg rapid IV push'
      ),
      explanation = 'The 2025 AHA guidelines state: polymorphic VT is ALWAYS unstable and should be treated immediately with defibrillation (unsynchronised). Delays in shock delivery worsen outcomes. Synchronised cardioversion is not appropriate for polymorphic VT because the irregular rhythm makes synchronisation unreliable and dangerous.'
    WHERE id = 1438
  `);
  console.log("✅ Q1438: Updated to polymorphic VT = always defibrillation");

  // 4. Update ACLS question about AF cardioversion energy
  await pool.query(`
    UPDATE quizQuestions SET
      question = 'What is the preferred initial energy setting for synchronised cardioversion of atrial fibrillation or atrial flutter according to the 2025 AHA guidelines?',
      correctAnswer = '≥200 J biphasic',
      options = JSON_ARRAY(
        '50 J biphasic',
        '100 J biphasic',
        '≥200 J biphasic',
        '360 J monophasic'
      ),
      explanation = 'The 2025 AHA guidelines recommend higher first-shock energy settings (≥200 J biphasic) for cardioversion of atrial fibrillation and atrial flutter. This is a change from previous practice of starting at lower energies. Higher energy improves first-shock success rates.'
    WHERE id = 1437
  `);
  console.log("✅ Q1437: Updated AF cardioversion energy to ≥200 J");

  // 5. Update ACLS question about ETCO2 and TOR
  await pool.query(`
    UPDATE quizQuestions SET
      question = 'According to the 2025 AHA guidelines, when can end-tidal CO₂ (ETCO₂) be used to guide termination of resuscitation (TOR)?',
      correctAnswer = 'ETCO₂ must NOT be used in isolation to terminate resuscitative efforts',
      options = JSON_ARRAY(
        'When ETCO₂ is below 10 mmHg after 20 minutes of CPR',
        'When ETCO₂ is below 20 mmHg at any point during resuscitation',
        'ETCO₂ must NOT be used in isolation to terminate resuscitative efforts',
        'When ETCO₂ fails to rise above 10 mmHg after the first 10 minutes'
      ),
      explanation = 'The 2025 AHA guidelines explicitly state that ETCO₂ must NOT be used in isolation to end resuscitative efforts. While low ETCO₂ (<10 mmHg) after prolonged CPR is a poor prognostic sign, TOR decisions must incorporate multiple factors including EMS scope of practice, witnessed arrest, shockable rhythm, ROSC at any point, and special circumstances (hypothermia, toxicology, pregnancy).'
    WHERE id = 1436
  `);
  console.log("✅ Q1436: Updated ETCO₂ and TOR guidance");

  // 6. Update ACLS section on defibrillation to include 2025 changes
  const [aclsModules] = await pool.query(`
    SELECT id, title FROM modules WHERE courseId = 2 ORDER BY \`order\`
  `) as any[];
  console.log("ACLS modules:", aclsModules.map((m: any) => `${m.id}: ${m.title}`).join('\n  '));

  // Find defibrillation module
  const defibModule = (aclsModules as any[]).find((m: any) => 
    m.title.toLowerCase().includes('defib') || m.title.toLowerCase().includes('shock') || m.title.toLowerCase().includes('arrest')
  );
  
  if (defibModule) {
    const [defibSecs] = await pool.query(`
      SELECT id, title, \`order\` FROM moduleSections WHERE moduleId = ? ORDER BY \`order\`
    `, [defibModule.id]) as any[];
    
    console.log(`\nACLS defibrillation module sections:`, (defibSecs as any[]).map((s: any) => `${s.id}: ${s.title}`).join(', '));
    
    // Update the defibrillation section with 2025 content
    for (const sec of (defibSecs as any[])) {
      if (sec.title.toLowerCase().includes('defib') || sec.title.toLowerCase().includes('shock') || sec.order === 2) {
        await pool.query(`UPDATE moduleSections SET content = ? WHERE id = ?`, [getAclsDefibContent2025(), sec.id]);
        console.log(`✅ Updated ACLS section ${sec.id}: ${sec.title}`);
        break;
      }
    }
  }

  // 7. Update post-cardiac arrest care section with 2025 TTM update
  const postArrestModule = (aclsModules as any[]).find((m: any) => 
    m.title.toLowerCase().includes('post') || m.title.toLowerCase().includes('rosc') || m.title.toLowerCase().includes('care')
  );
  
  if (postArrestModule) {
    const [postSecs] = await pool.query(`
      SELECT id, title, \`order\` FROM moduleSections WHERE moduleId = ? ORDER BY \`order\`
    `, [postArrestModule.id]) as any[];
    
    for (const sec of (postSecs as any[])) {
      if (sec.title.toLowerCase().includes('temperature') || sec.title.toLowerCase().includes('ttm') || sec.title.toLowerCase().includes('rosc') || sec.order === 1) {
        await pool.query(`UPDATE moduleSections SET content = ? WHERE id = ?`, [getPostArrestContent2025(), sec.id]);
        console.log(`✅ Updated ACLS post-arrest section ${sec.id}: ${sec.title}`);
        break;
      }
    }
  }

  // ============================================================
  // PALS UPDATES
  // ============================================================

  // 8. Fix PALS fluid resuscitation — 2025 says 10 mL/kg for septic shock
  const [palsModules] = await pool.query(`
    SELECT id, title FROM modules WHERE courseId = 3 ORDER BY \`order\`
  `) as any[];
  console.log("\nPALS modules:", (palsModules as any[]).map((m: any) => `${m.id}: ${m.title}`).join('\n  '));

  // Find shock/fluid module
  const shockModule = (palsModules as any[]).find((m: any) => 
    m.title.toLowerCase().includes('shock') || m.title.toLowerCase().includes('fluid') || m.title.toLowerCase().includes('circulation')
  );
  
  if (shockModule) {
    const [shockSecs] = await pool.query(`
      SELECT id, title, \`order\` FROM moduleSections WHERE moduleId = ? ORDER BY \`order\`
    `, [shockModule.id]) as any[];
    
    for (const sec of (shockSecs as any[])) {
      if (sec.title.toLowerCase().includes('fluid') || sec.title.toLowerCase().includes('shock') || sec.order <= 2) {
        await pool.query(`UPDATE moduleSections SET content = ? WHERE id = ?`, [getPalsFluidContent2025(), sec.id]);
        console.log(`✅ Updated PALS section ${sec.id}: ${sec.title}`);
        break;
      }
    }
  }

  // 9. Fix PALS ventilation rate section
  const airwayModule = (palsModules as any[]).find((m: any) => 
    m.title.toLowerCase().includes('airway') || m.title.toLowerCase().includes('breath') || m.title.toLowerCase().includes('ventil')
  );
  
  if (airwayModule) {
    const [airwaySecs] = await pool.query(`
      SELECT id, title, \`order\` FROM moduleSections WHERE moduleId = ? ORDER BY \`order\`
    `, [airwayModule.id]) as any[];
    
    for (const sec of (airwaySecs as any[])) {
      if (sec.title.toLowerCase().includes('ventil') || sec.title.toLowerCase().includes('breath') || sec.order === 1) {
        await pool.query(`UPDATE moduleSections SET content = ? WHERE id = ?`, [getPalsVentilationContent2025(), sec.id]);
        console.log(`✅ Updated PALS airway section ${sec.id}: ${sec.title}`);
        break;
      }
    }
  }

  // 10. Fix PALS post-arrest TTM question
  await pool.query(`
    UPDATE quizQuestions SET
      question = 'What is the recommended targeted temperature management (TTM) for a comatose child after cardiac arrest according to the 2025 AHA PALS guidelines?',
      correctAnswer = 'Maintain temperature 32–37.5°C for ≥24 hours; prevent fever >37.5°C for at least 72 hours post-arrest',
      options = JSON_ARRAY(
        'Cool to 33°C for exactly 24 hours, then rewarm',
        'Maintain temperature 32–37.5°C for ≥24 hours; prevent fever >37.5°C for at least 72 hours post-arrest',
        'Maintain normothermia 36–37°C only; no cooling required',
        'TTM is not recommended for children — only for adults'
      ),
      explanation = 'The 2025 AHA PALS guidelines update TTM recommendations: maintain temperature 32–37.5°C for at least 24 hours in comatose survivors of IHCA or OHCA. Fever prevention (>37.5°C) for at least 72 hours is critical. The previous strict 33°C target has been replaced with this broader range. Strict normothermia is acceptable if TTM is not feasible.'
    WHERE id = 1534
  `);
  console.log("✅ Q1534: Updated PALS TTM question (already updated for ACLS — same question)");

  // 11. Update PALS infant compression technique question
  await pool.query(`
    UPDATE quizQuestions SET
      question = 'According to the 2025 AHA PALS guidelines, what is the recommended compression technique for infant CPR?',
      correctAnswer = '2 thumb-encircling hands technique (preferred); heel of 1 hand if chest cannot be encircled',
      options = JSON_ARRAY(
        '2 fingers on the lower half of the sternum',
        '2 thumb-encircling hands technique (preferred); heel of 1 hand if chest cannot be encircled',
        'Heel of both hands on the sternum',
        'One full hand placed on the chest'
      ),
      explanation = 'The 2025 AHA guidelines eliminate the 2-finger technique for infant CPR. The 2 thumb-encircling hands technique is preferred as it produces greater compression depth and better haemodynamics. The heel of 1 hand is used when the chest cannot be encircled.'
    WHERE id = 1537
  `);
  console.log("✅ Q1537: Updated PALS infant compression technique");

  // 12. Update PALS ventilation rate question
  await pool.query(`
    UPDATE quizQuestions SET
      question = 'What is the correct ventilation rate for an infant with an advanced airway in place during CPR, according to the 2025 AHA PALS guidelines?',
      correctAnswer = '20–30 breaths per minute (continuous compressions, no pause for breaths)',
      options = JSON_ARRAY(
        '8–10 breaths per minute',
        '12–15 breaths per minute',
        '20–30 breaths per minute (continuous compressions, no pause for breaths)',
        '30–40 breaths per minute'
      ),
      explanation = 'The 2025 AHA PALS guidelines specify: with an advanced airway in place, ventilate infants and children at 20–30 breaths/min (continuous compressions without pausing for breaths). This is a key 2025 update — the rate is higher than for adults (10/min) because respiratory failure is the primary cause of paediatric arrest.'
    WHERE id = 1523
  `);
  console.log("✅ Q1523: Updated PALS ventilation rate with advanced airway");

  // 13. Update PALS septic shock fluid question
  await pool.query(`
    UPDATE quizQuestions SET
      question = 'According to the 2025 AHA PALS guidelines, what is the initial fluid bolus for a child in septic shock?',
      correctAnswer = '10 mL/kg isotonic crystalloid IV/IO over 15–30 minutes; reassess after each bolus',
      options = JSON_ARRAY(
        '20 mL/kg isotonic crystalloid as fast as possible',
        '10 mL/kg isotonic crystalloid IV/IO over 15–30 minutes; reassess after each bolus',
        '40 mL/kg isotonic crystalloid in the first hour',
        '5 mL/kg colloid solution'
      ),
      explanation = 'The 2025 AHA PALS guidelines recommend cautious fluid resuscitation for septic shock: initial bolus of 10 mL/kg (not 20 mL/kg) isotonic crystalloid, reassessing after each bolus. This reflects the FEAST trial evidence showing that aggressive fluid resuscitation (20 mL/kg boluses) increased mortality in African children with severe febrile illness. Titrate to clinical response — avoid fluid overload.'
    WHERE id = 1530
  `);
  console.log("✅ Q1530: Updated PALS septic shock fluid bolus to 10 mL/kg");

  await pool.end();
  console.log("\n✅ ACLS and PALS 2025 updates complete.");
}

function getAclsDefibContent2025(): string {
  return `<div class="module-content">
<h2>Defibrillation — 2025 AHA ACLS Updates</h2>

<div class="callout callout-warning">
  <strong>2025 Key Changes:</strong> Higher energy for AF/flutter cardioversion; polymorphic VT always requires defibrillation (never synchronised cardioversion); DSD not recommended as routine.
</div>

<h3>Defibrillation for VF/pVT (2025 — Largely Unchanged)</h3>
<table>
  <thead><tr><th>Parameter</th><th>2025 Recommendation</th></tr></thead>
  <tbody>
    <tr><td>First shock energy (biphasic)</td><td>Device-specific (typically 120–200 J); use maximum if unknown</td></tr>
    <tr><td>Subsequent shocks</td><td>Same or higher energy</td></tr>
    <tr><td>Peri-shock pause</td><td>Minimise — resume CPR immediately after shock</td></tr>
    <tr><td>Rhythm check</td><td>Every 2 minutes (during pulse check)</td></tr>
  </tbody>
</table>

<h3>Cardioversion for Tachyarrhythmias (2025 Updated)</h3>
<table>
  <thead><tr><th>Rhythm</th><th>Type</th><th>Energy (2025)</th></tr></thead>
  <tbody>
    <tr><td>Atrial fibrillation</td><td>Synchronised cardioversion</td><td><strong>≥200 J biphasic</strong> ⭐ NEW</td></tr>
    <tr><td>Atrial flutter</td><td>Synchronised cardioversion</td><td><strong>≥200 J biphasic</strong> ⭐ NEW</td></tr>
    <tr><td>Monomorphic VT (stable)</td><td>Synchronised cardioversion</td><td>100 J biphasic (escalate if needed)</td></tr>
    <tr><td>SVT</td><td>Synchronised cardioversion</td><td>50–100 J biphasic</td></tr>
    <tr><td><strong>Polymorphic VT</strong></td><td><strong>Unsynchronised defibrillation</strong></td><td><strong>Maximum energy — ALWAYS</strong> ⭐ KEY</td></tr>
  </tbody>
</table>

<div class="callout callout-danger">
  <strong>Critical 2025 Rule:</strong> Polymorphic VT is ALWAYS unstable. Treat immediately with unsynchronised defibrillation at maximum energy. Do NOT attempt synchronised cardioversion — the irregular rhythm makes synchronisation unreliable and dangerous.
</div>

<h3>Vector Change (VC) and Double Sequential Defibrillation (DSD) — 2025</h3>
<div class="callout callout-clinical">
  <strong>2025 Position:</strong> The usefulness of VC and DSD for shock-refractory VF has NOT been established. These techniques are NOT recommended as routine practice. Further investigation is needed. Do not delay standard defibrillation to attempt DSD.
</div>

<h3>Head-Up CPR — 2025</h3>
<div class="callout callout-clinical">
  <strong>2025 Position:</strong> Head-up CPR is discouraged outside the setting of rigorous clinical trials with appropriate subject protections. Do not routinely elevate the head during CPR.
</div>

<h3>POCUS During Cardiac Arrest — 2025</h3>
<ul>
  <li>May be used by experienced providers to identify reversible causes (H's and T's)</li>
  <li>Must NOT interrupt CPR — use only during pulse check pauses</li>
  <li>Useful for: pericardial tamponade, tension pneumothorax, hypovolaemia, massive PE</li>
</ul>
</div>`;
}

function getPostArrestContent2025(): string {
  return `<div class="module-content">
<h2>Post-Cardiac Arrest Care — 2025 AHA Updated</h2>

<div class="callout callout-warning">
  <strong>2025 Key Change:</strong> TTM range updated to 32–37.5°C; fever prevention (>37.5°C) mandatory for at least 72 hours.
</div>

<h3>Immediate Post-ROSC Priorities</h3>
<ol>
  <li><strong>Airway:</strong> Confirm ETT position with waveform capnography; secure airway if not done</li>
  <li><strong>Breathing:</strong> Target SpO₂ 94–98%; avoid hyperoxia (PaO₂ >300 mmHg) and hypoxia</li>
  <li><strong>Circulation:</strong> Target MAP ≥65 mmHg (adults); titrate vasopressors; 12-lead ECG for STEMI</li>
  <li><strong>Disability:</strong> Assess neurological status; initiate TTM if comatose</li>
  <li><strong>Reversible causes:</strong> Continue H's and T's search; POCUS if experienced provider available</li>
</ol>

<h3>Targeted Temperature Management (TTM) — 2025 Updated</h3>
<table>
  <thead><tr><th>Parameter</th><th>2025 Recommendation</th></tr></thead>
  <tbody>
    <tr><td>Target temperature</td><td><strong>32–37.5°C</strong> (broader range than previous 32–34°C)</td></tr>
    <tr><td>Duration</td><td>At least 24 hours</td></tr>
    <tr><td>Fever prevention</td><td><strong>Actively prevent fever >37.5°C for at least 72 hours</strong> ⭐ KEY</td></tr>
    <tr><td>Who qualifies</td><td>Comatose survivors of IHCA or OHCA (adults and children)</td></tr>
    <tr><td>If TTM not feasible</td><td>Strict normothermia is acceptable</td></tr>
  </tbody>
</table>

<div class="callout callout-danger">
  <strong>Critical:</strong> Fever (>37.5°C) after cardiac arrest is independently associated with worse neurological outcomes. Active fever prevention for 72 hours is now a core post-arrest care requirement.
</div>

<h3>Haemodynamic Targets Post-ROSC</h3>
<ul>
  <li><strong>Adults:</strong> MAP ≥65 mmHg; systolic BP ≥90 mmHg; avoid hypotension</li>
  <li><strong>Children:</strong> MAP ≥50th percentile for age; avoid hypotension</li>
  <li>Vasopressors: noradrenaline first-line; adrenaline if cardiogenic shock component</li>
  <li>Consider early coronary angiography if STEMI or suspected coronary cause</li>
</ul>

<h3>Oxygenation and Ventilation</h3>
<ul>
  <li>SpO₂ target: 94–98% (avoid hyperoxia)</li>
  <li>PaCO₂ target: 35–45 mmHg (normocapnia); avoid hypocapnia</li>
  <li>PEEP: 5–8 cmH₂O; titrate to oxygenation and haemodynamics</li>
</ul>

<h3>Glucose Management</h3>
<ul>
  <li>Target normoglycaemia: 6–10 mmol/L (108–180 mg/dL)</li>
  <li>Avoid hypoglycaemia AND hyperglycaemia — both worsen neurological outcomes</li>
  <li>Monitor glucose every 1–2 hours initially</li>
</ul>

<h3>Termination of Resuscitation (TOR) — 2025 Updated</h3>
<div class="callout callout-clinical">
  <strong>Key 2025 Rule:</strong> ETCO₂ must NOT be used in isolation to terminate resuscitative efforts. Apply the TOR rule appropriate to your EMS scope (BLS TOR, ALS TOR, or Universal TOR Rule).
</div>
<p><strong>Consider transport if any of the following:</strong></p>
<ul>
  <li>Shockable rhythm at any point</li>
  <li>ROSC at any point during resuscitation</li>
  <li>Special circumstances: hypothermia, pregnancy, suspected toxicological cause, paediatric patient</li>
</ul>
</div>`;
}

function getPalsFluidContent2025(): string {
  return `<div class="module-content">
<h2>Paediatric Shock — Fluid Resuscitation (2025 AHA Updated)</h2>

<div class="callout callout-warning">
  <strong>2025 Key Change:</strong> Initial fluid bolus for septic shock is <strong>10 mL/kg</strong> (not 20 mL/kg). Reassess after each bolus. Avoid fluid overload.
</div>

<h3>Fluid Resuscitation by Shock Type (2025)</h3>
<table>
  <thead><tr><th>Shock Type</th><th>Initial Bolus</th><th>Fluid</th><th>Rate</th></tr></thead>
  <tbody>
    <tr>
      <td><strong>Septic Shock</strong> ⭐</td>
      <td><strong>10 mL/kg</strong> (reassess after each)</td>
      <td>Isotonic crystalloid (0.9% NaCl or Lactated Ringer's)</td>
      <td>Over 15–30 minutes; slower if signs of fluid overload</td>
    </tr>
    <tr>
      <td>Hypovolaemic Shock</td>
      <td>20 mL/kg</td>
      <td>Isotonic crystalloid</td>
      <td>Over 5–20 minutes; titrate to response</td>
    </tr>
    <tr>
      <td>Distributive Shock (non-septic)</td>
      <td>10–20 mL/kg</td>
      <td>Isotonic crystalloid</td>
      <td>Titrate to response</td>
    </tr>
    <tr>
      <td>Cardiogenic Shock</td>
      <td>5–10 mL/kg (cautious)</td>
      <td>Isotonic crystalloid</td>
      <td>Over 30–60 minutes; reassess frequently</td>
    </tr>
    <tr>
      <td>Obstructive Shock</td>
      <td>Treat the cause first (tension PTX, tamponade)</td>
      <td>—</td>
      <td>Fluid is a bridge only</td>
    </tr>
  </tbody>
</table>

<div class="callout callout-danger">
  <strong>FEAST Trial Evidence:</strong> Aggressive fluid resuscitation (20 mL/kg boluses) increased mortality in African children with severe febrile illness. The 2025 AHA guidelines reflect this evidence — start with 10 mL/kg for septic shock and reassess after each bolus. Fluid overload worsens outcomes.
</div>

<h3>Reassessment After Each Fluid Bolus</h3>
<p>After each bolus, reassess:</p>
<ul>
  <li>Heart rate (improving?)</li>
  <li>Capillary refill time (improving?)</li>
  <li>Mental status (improving?)</li>
  <li>Urine output (>1 mL/kg/hr?)</li>
  <li>Signs of fluid overload: crackles, hepatomegaly, worsening respiratory distress</li>
</ul>

<h3>When to Start Vasopressors</h3>
<ul>
  <li>Fluid-refractory shock: persistent shock after 40–60 mL/kg total fluid</li>
  <li>First-line: <strong>noradrenaline</strong> (warm shock) or <strong>adrenaline</strong> (cold shock)</li>
  <li>Dopamine: acceptable alternative if noradrenaline/adrenaline not available</li>
  <li>Start vasopressors early if signs of fluid overload develop before shock resolves</li>
</ul>

<h3>Hour-1 Bundle for Paediatric Septic Shock (2025)</h3>
<ol>
  <li>Measure lactate</li>
  <li>Obtain blood cultures before antibiotics</li>
  <li>Administer broad-spectrum antibiotics within 1 hour of recognition</li>
  <li>Begin fluid resuscitation: 10 mL/kg isotonic crystalloid bolus; reassess</li>
  <li>Start vasopressors if fluid-refractory (noradrenaline preferred)</li>
</ol>
</div>`;
}

function getPalsVentilationContent2025(): string {
  return `<div class="module-content">
<h2>Paediatric Airway and Ventilation — 2025 AHA Updated</h2>

<div class="callout callout-warning">
  <strong>2025 Key Update:</strong> Ventilation rate for infants and children with an advanced airway or with a pulse is <strong>20–30 breaths/min</strong> (higher than adults at 10/min).
</div>

<h3>Why Ventilation Matters More in Paediatric Arrest</h3>
<p>Respiratory failure is the primary cause of cardiac arrest in infants and children. Unlike adults (where VF is common), most paediatric arrests are <strong>asphyxial</strong> — caused by hypoxia and respiratory failure. Early, effective ventilation is critical and must not be omitted.</p>

<h3>Ventilation Rates (2025)</h3>
<table>
  <thead><tr><th>Scenario</th><th>Rate</th></tr></thead>
  <tbody>
    <tr><td>Infant/child with advanced airway (ETT or SGA) during CPR</td><td><strong>20–30 breaths/min</strong> ⭐ 2025 Update</td></tr>
    <tr><td>Infant/child with pulse (no CPR) — rescue breathing</td><td><strong>20–30 breaths/min</strong> ⭐ 2025 Update</td></tr>
    <tr><td>Adult with advanced airway during CPR</td><td>10 breaths/min</td></tr>
    <tr><td>Without advanced airway (BVM) — 2 rescuers</td><td>15:2 ratio (pause compressions for breaths)</td></tr>
    <tr><td>Without advanced airway — 1 rescuer</td><td>30:2 ratio</td></tr>
  </tbody>
</table>

<h3>Airway Device Selection (2025)</h3>
<table>
  <thead><tr><th>Device</th><th>Recommendation</th></tr></thead>
  <tbody>
    <tr><td>Bag-Mask Ventilation (BVM)</td><td>First-line for most paediatric arrests; effective and avoids intubation risks</td></tr>
    <tr><td>Supraglottic Airway (SGA)</td><td>Acceptable if BVM is ineffective; LMA preferred SGA</td></tr>
    <tr><td>Endotracheal Tube (ETT)</td><td>Use <strong>cuffed tubes in all ages</strong> including neonates and infants (2025 update)</td></tr>
  </tbody>
</table>

<div class="callout callout-clinical">
  <strong>Cuffed ETT in All Ages (2025):</strong> The 2025 guidelines recommend cuffed ETTs for all paediatric patients including neonates and infants. Cuffed tubes reduce the need for tube changes and provide better ventilation control. Inflate cuff to minimum pressure needed to prevent leak (typically 20–25 cmH₂O).
</div>

<h3>ETT Sizing (Cuffed)</h3>
<table>
  <thead><tr><th>Age</th><th>Cuffed ETT Size (mm ID)</th></tr></thead>
  <tbody>
    <tr><td>Neonate (term)</td><td>3.0–3.5</td></tr>
    <tr><td>Infant (1–12 months)</td><td>3.5</td></tr>
    <tr><td>1–2 years</td><td>4.0</td></tr>
    <tr><td>2 years and older</td><td>(Age/4) + 3.5 (cuffed formula)</td></tr>
  </tbody>
</table>

<h3>Confirming ETT Placement</h3>
<ol>
  <li><strong>Waveform capnography</strong> — gold standard; confirms tracheal placement and monitors CPR quality</li>
  <li>Bilateral chest rise and breath sounds</li>
  <li>Absence of gastric sounds over epigastrium</li>
  <li>Chest X-ray (post-stabilisation)</li>
</ol>

<h3>Avoiding Hyperventilation</h3>
<div class="callout callout-danger">
  <strong>Critical:</strong> Hyperventilation during CPR reduces cardiac output by increasing intrathoracic pressure and impairing venous return. Target 20–30 breaths/min — do not exceed this rate. Each breath should be delivered over 1 second with visible chest rise only.
</div>
</div>`;
}

main().catch(console.error);
