import mysql from "mysql2/promise";

async function main() {
  const pool = mysql.createPool(process.env.DATABASE_URL!);
  console.log("Updating BLS and Heartsaver content to 2025 AHA ECC Guidelines...\n");

  // ============================================================
  // BLS UPDATES
  // ============================================================

  // 1. Fix Q1494: Infant single-rescuer technique — 2-finger ELIMINATED in 2025
  await pool.query(`
    UPDATE quizQuestions SET
      question = 'What is the correct chest compression technique for a single rescuer performing infant CPR?',
      correctAnswer = '2 thumb-encircling hands technique (preferred); if chest cannot be encircled, use heel of 1 hand',
      options = JSON_ARRAY(
        '2 fingers placed on the lower half of the sternum',
        '2 thumb-encircling hands technique (preferred); if chest cannot be encircled, use heel of 1 hand',
        'Heel of both hands placed on the sternum',
        'One full hand placed flat on the chest'
      ),
      explanation = 'The 2025 AHA guidelines ELIMINATE the 2-finger technique for infant CPR as it provides insufficient compression depth. The recommended technique is 2 thumb-encircling hands (preferred for 2 rescuers and single rescuers who can encircle the chest) or heel of 1 hand if the chest cannot be encircled.'
    WHERE id = 1494
  `);
  console.log("✅ Q1494: Fixed infant CPR technique (2-finger eliminated)");

  // 2. Fix Q1495: Infant compression depth — clarify with AP diameter
  await pool.query(`
    UPDATE quizQuestions SET
      question = 'What is the correct compression depth for infant CPR?',
      correctAnswer = 'At least 4 cm (approximately 1/3 of the anterior-posterior chest diameter)',
      options = JSON_ARRAY(
        'At least 2 cm',
        'At least 3 cm',
        'At least 4 cm (approximately 1/3 of the anterior-posterior chest diameter)',
        'At least 5 cm'
      ),
      explanation = 'The 2025 AHA guidelines specify infant compression depth as at least 4 cm, which corresponds to approximately 1/3 of the anterior-posterior (AP) chest diameter. This is the same as the 2020 guideline but the AP diameter reference is the primary metric.'
    WHERE id = 1495
  `);
  console.log("✅ Q1495: Clarified infant compression depth");

  // 3. Fix Q1500: Choking infant — ensure correct answer is clear
  await pool.query(`
    UPDATE quizQuestions SET
      question = 'A 6-month-old infant is choking with complete airway obstruction. What is the correct intervention sequence?',
      correctAnswer = '5 back blows followed by 5 chest thrusts — repeat until object is expelled or infant becomes unconscious',
      options = JSON_ARRAY(
        '5 abdominal thrusts followed by 5 back blows',
        '5 back blows followed by 5 abdominal thrusts',
        '5 back blows followed by 5 chest thrusts — repeat until object is expelled or infant becomes unconscious',
        'Blind finger sweeps to remove the object'
      ),
      explanation = 'The 2025 AHA guidelines confirm: for infants with severe FBAO, use 5 back blows alternating with 5 CHEST THRUSTS (not abdominal thrusts). Abdominal thrusts are NOT recommended for infants due to risk of abdominal organ injury. Blind finger sweeps are never recommended.'
    WHERE id = 1500
  `);
  console.log("✅ Q1500: Clarified infant FBAO — chest thrusts, not abdominal thrusts");

  // 4. Update BLS Module 4 Section content on infant CPR technique
  // Find the section about infant CPR technique in BLS Module 4
  const [infantSections] = await pool.query(`
    SELECT ms.id, ms.title FROM moduleSections ms
    JOIN modules m ON ms.moduleId = m.id
    WHERE m.courseId = 1 AND m.title LIKE '%Infant%' OR (m.courseId = 1 AND ms.title LIKE '%Infant%')
    ORDER BY ms.id
  `) as any[];
  
  console.log(`Found ${infantSections.length} infant-related sections in BLS`);

  // Update BLS Module 4 (Infant and Child CPR) sections
  // Get the module ID for infant/child CPR
  const [blsModules] = await pool.query(`
    SELECT id, title FROM modules WHERE courseId = 1 ORDER BY \`order\`
  `) as any[];
  
  console.log("BLS modules:", blsModules.map((m: any) => `${m.id}: ${m.title}`).join(', '));

  // Find Module 4 (Infant and Child CPR)
  const infantModule = blsModules.find((m: any) => m.title.toLowerCase().includes('infant') || m.title.toLowerCase().includes('child'));
  if (infantModule) {
    const [infantSecs] = await pool.query(`
      SELECT id, title, \`order\` FROM moduleSections WHERE moduleId = ? ORDER BY \`order\`
    `, [infantModule.id]) as any[];
    
    console.log(`\nBLS Infant/Child module sections:`, infantSecs.map((s: any) => `${s.id}: ${s.title}`).join(', '));
    
    // Update the section about infant compression technique
    for (const sec of infantSecs) {
      if (sec.title.toLowerCase().includes('infant') || sec.title.toLowerCase().includes('compression')) {
        await pool.query(`
          UPDATE moduleSections SET content = ? WHERE id = ?
        `, [getInfantCPRContent2025(), sec.id]);
        console.log(`✅ Updated BLS section ${sec.id}: ${sec.title}`);
        break;
      }
    }
  }

  // 5. Update BLS Final Knowledge Check Q1494 context — add new question about 2025 change
  // Replace one of the less critical questions with a 2025-specific question
  await pool.query(`
    UPDATE quizQuestions SET
      question = 'According to the 2025 AHA guidelines, which infant CPR compression technique has been ELIMINATED?',
      correctAnswer = 'The 2-finger technique along the lower sternum',
      options = JSON_ARRAY(
        'The 2 thumb-encircling hands technique',
        'The heel-of-1-hand technique',
        'The 2-finger technique along the lower sternum',
        'The 1-finger technique on the xiphoid process'
      ),
      explanation = 'The 2025 AHA guidelines eliminate the 2-finger technique for infant CPR because it consistently produces insufficient compression depth. The recommended techniques are: (1) 2 thumb-encircling hands — preferred when the chest can be encircled, and (2) heel of 1 hand — when the chest cannot be encircled.'
    WHERE id = 1494
  `);
  console.log("✅ Q1494: Updated to 2025 elimination question");

  // ============================================================
  // HEARTSAVER UPDATES
  // ============================================================

  // 6. Fix Q1483: AED on child — 2025 says use paediatric attenuator if available
  await pool.query(`
    UPDATE quizQuestions SET
      question = 'You need to use an AED on a 5-year-old child. You only have adult AED pads available. What should you do?',
      correctAnswer = 'Use adult pads if paediatric pads/attenuator are not available — do not delay defibrillation',
      options = JSON_ARRAY(
        'Do not use the AED — it is not safe for children',
        'Use adult pads if paediatric pads/attenuator are not available — do not delay defibrillation',
        'Wait until paediatric pads arrive before using the AED',
        'Use only 1 adult pad placed on the chest'
      ),
      explanation = 'The 2025 AHA guidelines state: for children under 8 years, use paediatric attenuator pads if available. If only adult pads are available, use them — do not delay defibrillation. Defibrillation with adult pads is safer than no defibrillation.'
    WHERE id = 1483
  `);
  console.log("✅ Q1483: Fixed AED paediatric pads guidance");

  // 7. Fix Q1485: Child unresponsive alone — 2025 clarification
  await pool.query(`
    UPDATE quizQuestions SET
      question = 'You are alone and find a 3-year-old child unresponsive and not breathing. What should you do first?',
      correctAnswer = 'Start CPR immediately — do 2 minutes of CPR, then call emergency services',
      options = JSON_ARRAY(
        'Call emergency services first, then start CPR',
        'Start CPR immediately — do 2 minutes of CPR, then call emergency services',
        'Give 5 rescue breaths, then call emergency services',
        'Check for a pulse for 10 seconds before starting CPR'
      ),
      explanation = 'For an unwitnessed paediatric arrest when alone: start CPR immediately for 2 minutes (5 cycles of 30:2), then call emergency services. For a witnessed paediatric arrest when alone: call EMS first, then start CPR. Respiratory failure is the primary cause of paediatric arrest — early CPR with breaths is critical.'
    WHERE id = 1485
  `);
  console.log("✅ Q1485: Clarified lone rescuer paediatric arrest sequence");

  // 8. Update Heartsaver Module 4 infant CPR section
  const [hsModules] = await pool.query(`
    SELECT id, title FROM modules WHERE courseId = 30 ORDER BY \`order\`
  `) as any[];
  
  const hsInfantModule = hsModules.find((m: any) => m.title.toLowerCase().includes('infant') || m.title.toLowerCase().includes('child'));
  if (hsInfantModule) {
    const [hsSecs] = await pool.query(`
      SELECT id, title, \`order\` FROM moduleSections WHERE moduleId = ? ORDER BY \`order\`
    `, [hsInfantModule.id]) as any[];
    
    for (const sec of hsSecs) {
      if (sec.title.toLowerCase().includes('infant') || sec.order === 1) {
        await pool.query(`
          UPDATE moduleSections SET content = ? WHERE id = ?
        `, [getHeartsaverInfantContent2025(), sec.id]);
        console.log(`✅ Updated Heartsaver section ${sec.id}: ${sec.title}`);
        break;
      }
    }
  }

  // 9. Add a 2025-specific question to Heartsaver final assessment
  await pool.query(`
    UPDATE quizQuestions SET
      question = 'According to the 2025 AHA guidelines, what is the recommended infant CPR compression technique for a lay rescuer?',
      correctAnswer = '2 thumb-encircling hands technique, or heel of 1 hand if chest cannot be encircled',
      options = JSON_ARRAY(
        '2 fingers placed on the lower half of the sternum',
        '2 thumb-encircling hands technique, or heel of 1 hand if chest cannot be encircled',
        'Heel of both hands placed on the sternum',
        'One full hand placed flat on the chest'
      ),
      explanation = 'The 2025 AHA guidelines eliminate the 2-finger technique for infant CPR. The recommended technique is 2 thumb-encircling hands (preferred) or heel of 1 hand if the chest cannot be encircled. This applies to both healthcare providers and lay rescuers.'
    WHERE id = 1486
  `);
  console.log("✅ Q1486: Updated Heartsaver infant CPR question to 2025");

  await pool.end();
  console.log("\n✅ BLS and Heartsaver 2025 updates complete.");
}

function getInfantCPRContent2025(): string {
  return `<div class="module-content">
<h2>Infant CPR — 2025 AHA Updated Technique</h2>

<div class="callout callout-warning">
  <strong>2025 Change:</strong> The 2-finger technique for infant chest compressions has been <strong>ELIMINATED</strong> from AHA guidelines. It consistently produces insufficient compression depth.
</div>

<h3>Recommended Infant Compression Techniques (2025)</h3>

<table>
  <thead><tr><th>Technique</th><th>When to Use</th><th>How to Perform</th></tr></thead>
  <tbody>
    <tr>
      <td><strong>2 Thumb-Encircling Hands</strong> ⭐ Preferred</td>
      <td>When you can encircle the infant's chest with both hands</td>
      <td>Place both thumbs side by side on the lower half of the sternum; encircle the chest with both hands; compress with thumbs while fingers support the back</td>
    </tr>
    <tr>
      <td><strong>Heel of 1 Hand</strong></td>
      <td>When chest cannot be encircled (e.g., large infant, single rescuer with limited hand size)</td>
      <td>Place heel of one hand on the lower half of the sternum; compress with heel of hand</td>
    </tr>
  </tbody>
</table>

<h3>Infant CPR Parameters (2025 — Unchanged)</h3>
<ul>
  <li><strong>Rate:</strong> 100–120 compressions per minute</li>
  <li><strong>Depth:</strong> At least 4 cm (approximately 1/3 of the AP chest diameter)</li>
  <li><strong>Recoil:</strong> Allow full chest recoil between compressions — do not lean on the chest</li>
  <li><strong>Ratio:</strong> 30:2 (single rescuer); 15:2 (2 healthcare providers)</li>
  <li><strong>Compression fraction:</strong> ≥60% — minimise interruptions</li>
</ul>

<h3>Infant FBAO (Foreign Body Airway Obstruction) — 2025</h3>

<div class="callout callout-clinical">
  <strong>Infants (under 1 year):</strong> 5 back blows + 5 <strong>chest thrusts</strong> — alternating until object is expelled or infant becomes unconscious.<br>
  <strong>Abdominal thrusts are NOT recommended for infants</strong> — risk of abdominal organ injury.
</div>

<h4>Back Blow Technique</h4>
<ol>
  <li>Hold infant face-down along your forearm, supporting the head</li>
  <li>Deliver 5 firm back blows between the shoulder blades with the heel of your hand</li>
  <li>Turn infant face-up, supporting the head</li>
  <li>Deliver 5 chest thrusts (same position as CPR compressions)</li>
  <li>Repeat until object expelled or infant becomes unconscious</li>
</ol>

<h3>Ventilation (2025 Update)</h3>
<ul>
  <li>Rescue breaths: 1 breath over 1 second, enough to see chest rise</li>
  <li>For infants: cover both mouth and nose with your mouth (mouth-to-mouth-and-nose)</li>
  <li><strong>With advanced airway in place:</strong> 20–30 breaths/min (continuous compressions)</li>
  <li><strong>With pulse, no CPR needed:</strong> 20–30 breaths/min</li>
</ul>

<div class="callout callout-danger">
  <strong>Critical Reminder:</strong> Respiratory arrest is the primary cause of cardiac arrest in infants and children. Early, effective ventilation is essential — do not skip breaths in paediatric CPR.
</div>
</div>`;
}

function getHeartsaverInfantContent2025(): string {
  return `<div class="module-content">
<h2>Infant and Child CPR — Heartsaver 2025</h2>

<div class="callout callout-warning">
  <strong>2025 Update:</strong> The 2-finger technique for infant CPR has been eliminated. Use 2 thumb-encircling hands or heel of 1 hand.
</div>

<h3>When to Start CPR on an Infant or Child</h3>
<ul>
  <li>Unresponsive AND not breathing normally (no breathing or only gasping)</li>
  <li>Gasping is a sign of cardiac arrest — treat it as cardiac arrest</li>
  <li>If alone with a child: do 2 minutes of CPR first, then call emergency services</li>
  <li>If alone with an infant: do 2 minutes of CPR first, then call emergency services</li>
</ul>

<h3>Infant CPR (Under 1 Year)</h3>

<h4>Step 1: Check responsiveness</h4>
<p>Tap the foot and shout. If no response and not breathing normally — start CPR.</p>

<h4>Step 2: Call for help</h4>
<p>If someone is with you, send them to call emergency services and get an AED. If alone, do 2 minutes of CPR first.</p>

<h4>Step 3: Compressions (2025 Updated Technique)</h4>
<table>
  <thead><tr><th>Technique</th><th>When</th></tr></thead>
  <tbody>
    <tr><td><strong>2 thumb-encircling hands</strong> ⭐</td><td>When you can encircle the chest</td></tr>
    <tr><td><strong>Heel of 1 hand</strong></td><td>When chest cannot be encircled</td></tr>
  </tbody>
</table>
<ul>
  <li>Compress the lower half of the sternum</li>
  <li>Depth: at least 4 cm (1/3 of chest depth)</li>
  <li>Rate: 100–120/min</li>
  <li>Allow full recoil between compressions</li>
</ul>

<h4>Step 4: Rescue Breaths</h4>
<ul>
  <li>Cover both the mouth AND nose of the infant with your mouth</li>
  <li>Give 1 breath over 1 second — watch for chest rise</li>
  <li>Ratio: 30 compressions : 2 breaths (single rescuer)</li>
</ul>

<h3>Child CPR (1 Year to Puberty)</h3>
<ul>
  <li><strong>Compressions:</strong> Heel of 1 or 2 hands on lower half of sternum</li>
  <li><strong>Depth:</strong> At least 5 cm (1/3 of chest depth)</li>
  <li><strong>Rate:</strong> 100–120/min</li>
  <li><strong>Ratio:</strong> 30:2 (single rescuer)</li>
  <li><strong>Breaths:</strong> Mouth-to-mouth; 1 breath over 1 second</li>
</ul>

<h3>AED Use in Children</h3>
<ul>
  <li>Use paediatric attenuator pads/paediatric mode if available (for children under 8 years)</li>
  <li>If only adult pads available — <strong>use them</strong>; do not delay defibrillation</li>
  <li>Ensure pads do not touch each other; use anterior-posterior placement if pads are too large</li>
</ul>

<h3>Infant Choking (FBAO)</h3>
<div class="callout callout-clinical">
  <strong>5 back blows + 5 chest thrusts</strong> — alternating. Abdominal thrusts are NOT used in infants.
</div>

<h3>Child Choking (FBAO)</h3>
<div class="callout callout-clinical">
  <strong>5 back blows + 5 abdominal thrusts</strong> — alternating until object expelled or child becomes unconscious.
</div>
</div>`;
}

main().catch(console.error);
