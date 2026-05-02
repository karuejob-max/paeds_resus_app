import mysql from "mysql2/promise";

async function main() {
  const pool = mysql.createPool(process.env.DATABASE_URL!);
  
  // First, list all sections in ACLS Module 6 (id=177)
  const [secs] = await pool.query(
    "SELECT id, title, `order`, LEFT(content, 150) as preview FROM moduleSections WHERE moduleId = 177 ORDER BY `order`"
  ) as any[];
  
  console.log("ACLS Module 6 sections:");
  secs.forEach((s: any) => console.log(`  ${s.id} [${s.order}]: ${s.title}`));
  console.log("");

  // Find the post-arrest section (should be one of the later sections)
  const postArrestSec = secs.find((s: any) => 
    s.title.toLowerCase().includes('post') || 
    s.title.toLowerCase().includes('rosc') || 
    s.title.toLowerCase().includes('arrest care') ||
    s.title.toLowerCase().includes('temperature') ||
    s.title.toLowerCase().includes('ttm')
  );
  
  const strokeSec = secs.find((s: any) => 
    s.title.toLowerCase().includes('stroke')
  );

  console.log("Post-arrest section found:", postArrestSec ? `${postArrestSec.id}: ${postArrestSec.title}` : "NOT FOUND");
  console.log("Stroke section found:", strokeSec ? `${strokeSec.id}: ${strokeSec.title}` : "NOT FOUND");
  console.log("");

  // The script accidentally wrote post-arrest content to section 571 (stroke)
  // We need to:
  // 1. Restore the stroke section with correct content
  // 2. Find the actual post-arrest section and update it
  
  if (strokeSec) {
    // Check if the stroke section currently has post-arrest content (wrongly updated)
    const strokePreview = strokeSec.preview || "";
    if (strokePreview.includes("Post-Cardiac Arrest") || strokePreview.includes("TTM") || strokePreview.includes("ROSC")) {
      console.log("⚠️  Stroke section has wrong content — restoring stroke content...");
      await pool.query(`UPDATE moduleSections SET content = ?, title = 'Acute Stroke — Recognition and Time-Critical Management' WHERE id = ?`, 
        [getStrokeContent(), strokeSec.id]);
      console.log(`✅ Restored stroke section ${strokeSec.id}`);
    } else {
      console.log("✅ Stroke section content appears correct — no restoration needed");
    }
  }

  // Now find or update the correct post-arrest section
  if (postArrestSec && postArrestSec.id !== strokeSec?.id) {
    await pool.query(`UPDATE moduleSections SET content = ? WHERE id = ?`, 
      [getPostArrestContent2025(), postArrestSec.id]);
    console.log(`✅ Updated correct post-arrest section ${postArrestSec.id}: ${postArrestSec.title}`);
  } else {
    // Find section by order — post-arrest is typically the 2nd or 3rd section in module 6
    const section2 = secs.find((s: any) => s.order === 2);
    const section3 = secs.find((s: any) => s.order === 3);
    
    console.log("Looking for post-arrest section by order...");
    console.log("Section 2:", section2 ? `${section2.id}: ${section2.title}` : "none");
    console.log("Section 3:", section3 ? `${section3.id}: ${section3.title}` : "none");
    
    // Update the section that is NOT the stroke section
    const targetSec = secs.find((s: any) => 
      s.id !== strokeSec?.id && 
      (s.title.toLowerCase().includes('post') || s.title.toLowerCase().includes('care') || s.order >= 2)
    );
    
    if (targetSec) {
      await pool.query(`UPDATE moduleSections SET content = ? WHERE id = ?`, 
        [getPostArrestContent2025(), targetSec.id]);
      console.log(`✅ Updated post-arrest section ${targetSec.id}: ${targetSec.title}`);
    }
  }

  // Also check PALS Module 2 (Respiratory) for the airway section
  const [palsSecs] = await pool.query(
    "SELECT id, title, `order` FROM moduleSections WHERE moduleId = 179 ORDER BY `order`"
  ) as any[];
  
  console.log("\nPALS Module 2 (Respiratory) sections:");
  palsSecs.forEach((s: any) => console.log(`  ${s.id} [${s.order}]: ${s.title}`));
  
  // Update the first section with ventilation content
  if (palsSecs.length > 0) {
    const ventSec = (palsSecs as any[]).find((s: any) => 
      s.title.toLowerCase().includes('ventil') || 
      s.title.toLowerCase().includes('airway') || 
      s.title.toLowerCase().includes('breath') ||
      s.order === 1
    );
    
    if (ventSec) {
      await pool.query(`UPDATE moduleSections SET content = ? WHERE id = ?`, 
        [getPalsVentilationContent2025(), ventSec.id]);
      console.log(`✅ Updated PALS airway section ${ventSec.id}: ${ventSec.title}`);
    }
  }

  await pool.end();
  console.log("\n✅ Section fix complete.");
}

function getStrokeContent(): string {
  return `<div class="module-content">
<h2>Acute Stroke — Recognition and Time-Critical Management</h2>

<div class="callout callout-danger">
  <strong>Time is Brain:</strong> Every minute of stroke without treatment, approximately 1.9 million neurons die. The goal is recognition-to-treatment in under 60 minutes (door-to-needle ≤45 minutes for thrombolysis).
</div>

<h3>Stroke Recognition — FAST + BE-FAST</h3>
<table>
  <thead><tr><th>Letter</th><th>Sign</th><th>How to Test</th></tr></thead>
  <tbody>
    <tr><td><strong>B</strong></td><td>Balance — sudden loss</td><td>Ask patient to walk; observe for unsteadiness</td></tr>
    <tr><td><strong>E</strong></td><td>Eyes — sudden vision change</td><td>Ask about double vision, vision loss, or field defect</td></tr>
    <tr><td><strong>F</strong></td><td>Face drooping</td><td>Ask patient to smile — is one side drooping?</td></tr>
    <tr><td><strong>A</strong></td><td>Arm weakness</td><td>Ask patient to raise both arms — does one drift down?</td></tr>
    <tr><td><strong>S</strong></td><td>Speech difficulty</td><td>Ask patient to repeat a simple phrase — is it slurred or strange?</td></tr>
    <tr><td><strong>T</strong></td><td>Time to call emergency services</td><td>Note exact time of symptom onset — critical for treatment decisions</td></tr>
  </tbody>
</table>

<h3>Cincinnati Prehospital Stroke Scale</h3>
<p>Any ONE of the following = 72% probability of ischaemic stroke:</p>
<ul>
  <li>Facial droop (asymmetrical smile)</li>
  <li>Arm drift (one arm drifts down when both raised)</li>
  <li>Abnormal speech (slurred, wrong words, or unable to speak)</li>
</ul>

<h3>Stroke Mimics to Consider</h3>
<ul>
  <li>Hypoglycaemia — check glucose immediately (most common mimic)</li>
  <li>Todd's paralysis (post-seizure)</li>
  <li>Hypertensive encephalopathy</li>
  <li>Complicated migraine</li>
  <li>Brain tumour or abscess</li>
  <li>Conversion disorder</li>
</ul>

<h3>Acute Ischaemic Stroke — Time-Critical Interventions</h3>
<table>
  <thead><tr><th>Intervention</th><th>Time Window</th><th>Criteria</th></tr></thead>
  <tbody>
    <tr>
      <td><strong>IV Alteplase (tPA)</strong></td>
      <td>Within 4.5 hours of onset</td>
      <td>No contraindications; NIHSS ≥4; BP <185/110 mmHg before treatment</td>
    </tr>
    <tr>
      <td><strong>IV Tenecteplase</strong></td>
      <td>Within 4.5 hours of onset</td>
      <td>Alternative to alteplase; 0.25 mg/kg IV bolus (max 25 mg)</td>
    </tr>
    <tr>
      <td><strong>Mechanical Thrombectomy</strong></td>
      <td>Within 24 hours (selected patients)</td>
      <td>Large vessel occlusion (LVO) on CTA; NIHSS ≥6; favourable imaging</td>
    </tr>
  </tbody>
</table>

<h3>Haemorrhagic Stroke — Key Differences</h3>
<div class="callout callout-danger">
  <strong>Do NOT give thrombolytics for haemorrhagic stroke.</strong> CT head is mandatory before any thrombolytic therapy.
</div>
<ul>
  <li>Intracerebral haemorrhage (ICH): BP control (target SBP <140 mmHg); reverse anticoagulation</li>
  <li>Subarachnoid haemorrhage (SAH): Sudden "thunderclap" headache; CT then LP if CT negative; neurosurgery referral</li>
  <li>Both: Urgent neurosurgical consultation; avoid antiplatelet/anticoagulant agents</li>
</ul>

<h3>Stroke Chain of Survival</h3>
<ol>
  <li>Detection — recognise stroke signs (FAST/BE-FAST)</li>
  <li>Dispatch — call emergency services immediately</li>
  <li>Delivery — rapid transport to stroke-capable hospital; pre-notify ED</li>
  <li>Door — immediate triage; CT head within 25 minutes of arrival</li>
  <li>Data — CT read within 45 minutes; labs; NIHSS assessment</li>
  <li>Decision — thrombolytics vs thrombectomy vs supportive care</li>
  <li>Drug/Device — administer tPA or proceed to cath lab</li>
  <li>Disposition — stroke unit admission; rehabilitation planning</li>
</ol>
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
