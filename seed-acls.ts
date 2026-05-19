/**
 * ACLS Course Content Seed
 * Course ID: 2 — Advanced Cardiovascular Life Support (ACLS)
 * Aligned with: AHA ACLS 2020 Guidelines, ILCOR 2020 Consensus
 * Structure: 6 modules × 4 sections + formative quiz per module
 */
import * as dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

const ACLS_COURSE_ID = 2;

const modules = [
  {
    order: 1,
    title: "Module 1: ACLS Systematic Approach and BLS Foundation",
    description: "Apply the systematic ACLS approach and ensure high-quality BLS as the foundation of advanced resuscitation.",
    content: "ACLS builds on BLS. This module reviews the systematic approach, BLS quality standards, and the transition from BLS to ACLS.",
    duration: 20,
    sections: [
      {
        order: 1,
        title: "Overview: The ACLS Systematic Approach",
        content: `<h2>The ACLS Systematic Approach</h2>
<p>ACLS is a systematic, algorithm-driven approach to managing cardiac arrest and other life-threatening cardiovascular emergencies. It is built on a foundation of high-quality BLS and adds pharmacological, electrical, and advanced airway interventions.</p>
<div class="clinical-note">
  <strong>The ACLS Primary Survey (BLS):</strong>
  <table>
    <thead><tr><th>Step</th><th>Action</th></tr></thead>
    <tbody>
      <tr><td>A — Airway</td><td>Is the airway open? Reposition, suction, jaw thrust</td></tr>
      <tr><td>B — Breathing</td><td>Is breathing adequate? BVM ventilation, oxygen</td></tr>
      <tr><td>C — Circulation</td><td>Is there a pulse? Begin CPR if no pulse</td></tr>
      <tr><td>D — Defibrillation</td><td>Is a shockable rhythm present? Attach AED/monitor</td></tr>
    </tbody>
  </table>
</div>
<div class="clinical-note">
  <strong>The ACLS Secondary Survey:</strong>
  <table>
    <thead><tr><th>Step</th><th>Action</th></tr></thead>
    <tbody>
      <tr><td>A — Advanced Airway</td><td>Endotracheal intubation or supraglottic airway</td></tr>
      <tr><td>B — Breathing</td><td>Confirm airway placement; waveform capnography</td></tr>
      <tr><td>C — Circulation</td><td>IV/IO access; cardiac monitoring; 12-lead ECG; medications</td></tr>
      <tr><td>D — Differential Diagnosis</td><td>Identify and treat reversible causes (H's and T's)</td></tr>
    </tbody>
  </table>
</div>`
      },
      {
        order: 2,
        title: "BLS Quality in ACLS — Non-Negotiables",
        content: `<h2>BLS Quality in ACLS — Non-Negotiables</h2>
<p>No medication or advanced intervention can compensate for poor CPR quality. Studies consistently show that CPR quality is the single most important determinant of survival from cardiac arrest.</p>
<h3>CPR Quality Metrics</h3>
<table>
  <thead><tr><th>Metric</th><th>Target</th><th>Common Error</th></tr></thead>
  <tbody>
    <tr><td>Compression rate</td><td>100–120/min</td><td>Too fast (&gt;120) reduces depth; too slow (&lt;100) reduces output</td></tr>
    <tr><td>Compression depth</td><td>5–6 cm (adult)</td><td>Insufficient depth — most common error</td></tr>
    <tr><td>Chest recoil</td><td>Full recoil</td><td>Leaning on chest — reduces venous return</td></tr>
    <tr><td>Interruptions</td><td>&lt;10 seconds</td><td>Long pauses for airway, rhythm checks, medication</td></tr>
    <tr><td>Compression fraction</td><td>≥60% (target ≥80%)</td><td>Too many pauses reduce overall CCF</td></tr>
    <tr><td>Ventilation</td><td>1 breath/6 sec with advanced airway</td><td>Hyperventilation — most common ventilation error</td></tr>
  </tbody>
</table>
<div class="warning-note">
  <strong>The CPR-medication interaction:</strong> Adrenaline (epinephrine) only reaches the coronary circulation if coronary perfusion pressure is adequate. Poor CPR means adrenaline has no target. Fix CPR quality before worrying about medications.
</div>`
      },
      {
        order: 3,
        title: "Vascular Access in ACLS — IV and IO",
        content: `<h2>Vascular Access in ACLS — IV and IO</h2>
<p>Vascular access is required for medication delivery in ACLS. The priority is speed and reliability — not the ideal route.</p>
<h3>Intravenous (IV) Access</h3>
<ul>
  <li><strong>Preferred site:</strong> Antecubital fossa (large, reliable, easy to access during CPR)</li>
  <li><strong>Avoid:</strong> Femoral vein (requires CPR interruption; poor drug delivery during compressions)</li>
  <li><strong>Central line:</strong> Faster drug delivery but requires CPR interruption to insert — not first choice during active arrest</li>
  <li>Follow each IV medication with a 20 mL flush and elevate the limb for 10–20 seconds to promote central delivery</li>
</ul>
<h3>Intraosseous (IO) Access</h3>
<ul>
  <li>IO access is equivalent to central venous access for drug delivery speed and peak concentration</li>
  <li>Can be established in &lt;60 seconds in experienced hands</li>
  <li>Preferred over central line during active arrest</li>
  <li>Sites: proximal tibia, distal femur, proximal humerus, sternum (adult)</li>
  <li>Contraindications: fracture at or proximal to site, previous IO in same bone within 24 hours, osteogenesis imperfecta</li>
</ul>
<div class="clinical-note">
  <strong>IO drug delivery:</strong> Follow each IO medication with a 5–10 mL flush of normal saline to ensure delivery from the medullary cavity into the central circulation.
</div>`
      },
      {
        order: 4,
        title: "Waveform Capnography in ACLS",
        content: `<h2>Waveform Capnography in ACLS</h2>
<p>Waveform capnography (end-tidal CO₂ monitoring) is a critical tool in ACLS. AHA 2020 guidelines recommend it for all intubated patients during resuscitation.</p>
<h3>Uses of Waveform Capnography in ACLS</h3>
<table>
  <thead><tr><th>Use</th><th>Interpretation</th></tr></thead>
  <tbody>
    <tr><td>Confirm ETT placement</td><td>Persistent waveform confirms tracheal intubation; flat line = oesophageal</td></tr>
    <tr><td>Monitor CPR quality</td><td>ETCO₂ &gt;10 mmHg during CPR indicates adequate compressions; &lt;10 mmHg = poor CPR quality</td></tr>
    <tr><td>Predict ROSC</td><td>Sudden rise in ETCO₂ to &gt;35–40 mmHg often indicates ROSC before pulse is palpable</td></tr>
    <tr><td>Prognostication</td><td>ETCO₂ &lt;10 mmHg after 20 minutes of CPR is associated with very poor outcomes</td></tr>
  </tbody>
</table>
<div class="clinical-note">
  <strong>ROSC detection:</strong> A sudden sustained rise in ETCO₂ during CPR is often the first sign of ROSC. Stop compressions briefly to check for a pulse when ETCO₂ rises sharply to &gt;35 mmHg.
</div>
<div class="warning-note">
  <strong>Adrenaline and ETCO₂:</strong> Adrenaline causes vasoconstriction, which transiently reduces ETCO₂. Do not interpret a drop in ETCO₂ after adrenaline as deterioration — it is a pharmacological effect.
</div>`
      }
    ],
    quiz: {
      title: "Check: ACLS Systematic Approach",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "During ACLS, what is the minimum compression fraction (CCF) target?",
          options: JSON.stringify(["40%", "60%", "80%", "100%"]),
          correctAnswer: "60%",
          explanation: "AHA 2020 guidelines set a minimum CCF target of ≥60%, with an ideal target of ≥80%. CCF is the proportion of resuscitation time spent performing chest compressions. Every pause reduces coronary perfusion pressure to zero, requiring 15–20 compressions to restore it."
        },
        {
          order: 2,
          questionText: "An ETCO₂ reading of 8 mmHg during CPR indicates what?",
          options: JSON.stringify(["Excellent CPR quality", "ROSC has occurred", "Poor CPR quality — compressions need to improve", "The ETT is in the oesophagus"]),
          correctAnswer: "Poor CPR quality — compressions need to improve",
          explanation: "ETCO₂ >10 mmHg during CPR indicates adequate compressions generating sufficient cardiac output to deliver CO₂ to the lungs. ETCO₂ <10 mmHg indicates poor CPR quality — the compressor should be changed and technique reassessed."
        },
        {
          order: 3,
          questionText: "Why is IO access preferred over central venous access during active cardiac arrest?",
          options: JSON.stringify(["IO delivers drugs faster than central lines", "IO access can be established quickly without interrupting CPR", "Central lines are contraindicated during cardiac arrest", "IO access provides better drug concentrations"]),
          correctAnswer: "IO access can be established quickly without interrupting CPR",
          explanation: "IO access can be established in <60 seconds without interrupting CPR. Central line insertion requires CPR interruption, positioning, and takes significantly longer. Drug delivery speed and peak concentration via IO are equivalent to central venous access."
        }
      ]
    }
  },
  {
    order: 2,
    title: "Module 2: Cardiac Arrest Algorithms — Shockable Rhythms (VF/pVT)",
    description: "Manage ventricular fibrillation and pulseless ventricular tachycardia using the ACLS algorithm.",
    content: "VF and pVT are the most survivable cardiac arrest rhythms. This module covers the VF/pVT algorithm, defibrillation strategy, and medication timing.",
    duration: 25,
    sections: [
      {
        order: 1,
        title: "Overview: VF and pVT — The Shockable Rhythms",
        content: `<h2>VF and pVT — The Shockable Rhythms</h2>
<p>Ventricular fibrillation (VF) and pulseless ventricular tachycardia (pVT) are the only cardiac arrest rhythms that respond to defibrillation. They are also the most survivable rhythms when treated rapidly.</p>
<h3>Rhythm Recognition</h3>
<table>
  <thead><tr><th>Rhythm</th><th>ECG Appearance</th><th>Clinical Features</th></tr></thead>
  <tbody>
    <tr><td>Ventricular Fibrillation (VF)</td><td>Chaotic, irregular, no identifiable P waves or QRS complexes; amplitude varies</td><td>No pulse, no cardiac output</td></tr>
    <tr><td>Pulseless VT (pVT)</td><td>Wide complex tachycardia (&gt;120 bpm, QRS &gt;120 ms), regular or irregular; no pulse</td><td>No pulse despite organised electrical activity</td></tr>
  </tbody>
</table>
<div class="clinical-note">
  <strong>Fine vs. coarse VF:</strong> Fine VF (low amplitude) is associated with prolonged arrest and reduced defibrillation success. High-quality CPR can convert fine VF to coarse VF, improving defibrillation success. Do not delay defibrillation to "improve" VF — shock immediately.
</div>`
      },
      {
        order: 2,
        title: "The VF/pVT Algorithm — Step by Step",
        content: `<h2>The VF/pVT Algorithm</h2>
<h3>Algorithm Overview</h3>
<ol>
  <li><strong>Identify VF/pVT</strong> on monitor → confirm no pulse</li>
  <li><strong>Shock immediately</strong> (biphasic: 200 J for initial shock; manufacturer-specific thereafter; monophasic: 360 J)</li>
  <li><strong>Resume CPR immediately</strong> after shock — 2 minutes, no pulse check</li>
  <li><strong>Establish IV/IO access</strong> during CPR</li>
  <li><strong>Rhythm check at 2 minutes:</strong>
    <ul>
      <li>Still VF/pVT → Shock again → Resume CPR → Give adrenaline 1 mg IV/IO</li>
      <li>Organised rhythm → Check pulse → If pulse: post-ROSC care; if no pulse: PEA algorithm</li>
    </ul>
  </li>
  <li><strong>After 3rd shock:</strong> Consider amiodarone 300 mg IV/IO (or lidocaine 1–1.5 mg/kg if amiodarone unavailable)</li>
  <li><strong>Adrenaline every 3–5 minutes</strong> (every other rhythm check)</li>
  <li><strong>Amiodarone second dose:</strong> 150 mg IV/IO after 5th shock if still in VF/pVT</li>
</ol>
<div class="warning-note">
  <strong>Shock first, drugs second:</strong> For VF/pVT, defibrillation is the definitive treatment. Medications are adjuncts. Never delay a shock to administer medications.
</div>`
      },
      {
        order: 3,
        title: "Defibrillation — Energy, Timing, and Technique",
        content: `<h2>Defibrillation — Energy, Timing, and Technique</h2>
<h3>Energy Selection</h3>
<table>
  <thead><tr><th>Defibrillator Type</th><th>Initial Shock</th><th>Subsequent Shocks</th></tr></thead>
  <tbody>
    <tr><td>Biphasic (manufacturer-specific)</td><td>120–200 J (follow device recommendation)</td><td>Same or higher energy</td></tr>
    <tr><td>Biphasic (unknown device)</td><td>200 J</td><td>200 J or escalate</td></tr>
    <tr><td>Monophasic</td><td>360 J</td><td>360 J</td></tr>
    <tr><td>Paediatric (&lt;8 years)</td><td>2 J/kg</td><td>4 J/kg, then ≥4 J/kg (max 10 J/kg or adult dose)</td></tr>
  </tbody>
</table>
<h3>Hands-Free Defibrillation</h3>
<ul>
  <li>Use self-adhesive pads (not paddles) for hands-free defibrillation</li>
  <li>Pads allow continuous monitoring and faster shock delivery</li>
  <li>Charge the defibrillator during the last 30 seconds of CPR to minimise the pre-shock pause</li>
  <li>Pre-shock pause (time from stopping compressions to shock delivery) should be &lt;5 seconds</li>
</ul>
<div class="clinical-note">
  <strong>Minimising pre-shock pause:</strong> Every 5-second increase in pre-shock pause reduces defibrillation success by approximately 5%. Charge the defibrillator during CPR, announce "charging" to the team, and deliver the shock within 5 seconds of stopping compressions.
</div>`
      },
      {
        order: 4,
        title: "Medications in VF/pVT — Adrenaline and Amiodarone",
        content: `<h2>Medications in VF/pVT</h2>
<h3>Adrenaline (Epinephrine)</h3>
<table>
  <thead><tr><th>Parameter</th><th>Details</th></tr></thead>
  <tbody>
    <tr><td>Dose</td><td>1 mg IV/IO every 3–5 minutes</td></tr>
    <tr><td>Timing</td><td>After 2nd shock (i.e., after the 3rd rhythm check if still in VF/pVT)</td></tr>
    <tr><td>Mechanism</td><td>Alpha-1 agonist → vasoconstriction → increases aortic diastolic pressure → increases coronary perfusion pressure</td></tr>
    <tr><td>Evidence</td><td>Increases ROSC rates; no proven improvement in neurologically intact survival</td></tr>
  </tbody>
</table>
<h3>Amiodarone</h3>
<table>
  <thead><tr><th>Parameter</th><th>Details</th></tr></thead>
  <tbody>
    <tr><td>First dose</td><td>300 mg IV/IO bolus after 3rd shock</td></tr>
    <tr><td>Second dose</td><td>150 mg IV/IO after 5th shock</td></tr>
    <tr><td>Mechanism</td><td>Class III antiarrhythmic — blocks potassium channels, prolongs action potential duration</td></tr>
    <tr><td>Alternative</td><td>Lidocaine 1–1.5 mg/kg IV/IO (if amiodarone unavailable); second dose 0.5–0.75 mg/kg</td></tr>
  </tbody>
</table>
<div class="warning-note">
  <strong>Magnesium sulphate:</strong> Not routinely recommended for VF/pVT. Consider for Torsades de Pointes (polymorphic VT with prolonged QT): 1–2 g IV/IO over 5–20 minutes.
</div>`
      }
    ],
    quiz: {
      title: "Check: VF/pVT Algorithm",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "A patient is in VF. The first shock has been delivered. What should happen immediately after the shock?",
          options: JSON.stringify(["Check pulse for 10 seconds", "Resume CPR immediately for 2 minutes", "Give adrenaline 1 mg IV", "Perform a 12-lead ECG"]),
          correctAnswer: "Resume CPR immediately for 2 minutes",
          explanation: "After delivering a shock, resume CPR immediately without checking for a pulse. The AED/defibrillator will prompt a rhythm check after 2 minutes. Adrenaline is given after the 2nd shock (3rd rhythm check) — not after the first shock."
        },
        {
          order: 2,
          questionText: "A patient remains in VF after the 3rd shock. What medication should be given?",
          options: JSON.stringify(["Adrenaline 1 mg IV/IO", "Amiodarone 300 mg IV/IO", "Lidocaine 1 mg/kg IV/IO", "Magnesium sulphate 2 g IV/IO"]),
          correctAnswer: "Amiodarone 300 mg IV/IO",
          explanation: "Amiodarone 300 mg IV/IO is given after the 3rd shock in refractory VF/pVT. Adrenaline should have been given after the 2nd shock. Lidocaine is an alternative if amiodarone is unavailable. Magnesium is only indicated for Torsades de Pointes."
        },
        {
          order: 3,
          questionText: "What is the recommended initial defibrillation energy for a biphasic defibrillator of unknown type?",
          options: JSON.stringify(["100 J", "150 J", "200 J", "360 J"]),
          correctAnswer: "200 J",
          explanation: "For a biphasic defibrillator of unknown type, AHA 2020 guidelines recommend 200 J for the initial shock. If the device type is known, follow the manufacturer's recommendation (typically 120–200 J). Monophasic defibrillators use 360 J."
        }
      ]
    }
  },
  {
    order: 3,
    title: "Module 3: Cardiac Arrest Algorithms — Non-Shockable Rhythms (PEA/Asystole)",
    description: "Manage pulseless electrical activity and asystole using the ACLS algorithm.",
    content: "PEA and asystole are non-shockable rhythms that require CPR, adrenaline, and treatment of reversible causes.",
    duration: 20,
    sections: [
      {
        order: 1,
        title: "Overview: PEA and Asystole",
        content: `<h2>PEA and Asystole — The Non-Shockable Rhythms</h2>
<p>Pulseless electrical activity (PEA) and asystole are non-shockable rhythms. They do not respond to defibrillation. The primary treatment is high-quality CPR, adrenaline, and identification and treatment of reversible causes.</p>
<h3>Rhythm Recognition</h3>
<table>
  <thead><tr><th>Rhythm</th><th>ECG Appearance</th><th>Clinical Features</th></tr></thead>
  <tbody>
    <tr><td>PEA</td><td>Any organised electrical activity (narrow or wide complex, any rate) — but no pulse</td><td>Electrical activity without mechanical contraction; always has a reversible cause</td></tr>
    <tr><td>Asystole</td><td>Flat line — no electrical activity; may have occasional P waves (P-wave asystole)</td><td>Complete absence of cardiac electrical and mechanical activity</td></tr>
  </tbody>
</table>
<div class="clinical-note">
  <strong>PEA vs. Pseudo-PEA:</strong> Pseudo-PEA (also called "occult cardiac activity") is PEA with very low cardiac output — the patient has a pulse that is too weak to palpate. Bedside ultrasound can identify cardiac motion in pseudo-PEA. Treatment is the same as PEA.
</div>`
      },
      {
        order: 2,
        title: "The PEA/Asystole Algorithm",
        content: `<h2>The PEA/Asystole Algorithm</h2>
<h3>Algorithm Overview</h3>
<ol>
  <li><strong>Identify PEA/asystole</strong> — confirm in two leads; confirm no pulse</li>
  <li><strong>Begin CPR immediately</strong> — 2 minutes, 30:2 (or continuous with advanced airway)</li>
  <li><strong>Establish IV/IO access</strong></li>
  <li><strong>Adrenaline 1 mg IV/IO</strong> — as soon as access is established; repeat every 3–5 minutes</li>
  <li><strong>Identify and treat reversible causes (H's and T's)</strong> — this is the most important step</li>
  <li><strong>Rhythm check at 2 minutes:</strong>
    <ul>
      <li>Still PEA/asystole → Continue CPR → Adrenaline every 3–5 min → Treat reversible causes</li>
      <li>Shockable rhythm (VF/pVT) → Switch to VF/pVT algorithm</li>
      <li>Organised rhythm → Check pulse → If pulse: post-ROSC care</li>
    </ul>
  </li>
</ol>
<div class="warning-note">
  <strong>Do not shock PEA or asystole:</strong> Defibrillation of a non-shockable rhythm is ineffective and wastes time. Always confirm the rhythm before delivering a shock.
</div>`
      },
      {
        order: 3,
        title: "Reversible Causes — H's and T's in Depth",
        content: `<h2>Reversible Causes — H's and T's in Depth</h2>
<p>PEA almost always has a reversible cause. Identifying and treating the cause is the key to ROSC in PEA.</p>
<table>
  <thead><tr><th>Cause</th><th>Clues</th><th>Treatment</th></tr></thead>
  <tbody>
    <tr><td>Hypovolaemia</td><td>History of haemorrhage, dehydration, burns; flat neck veins</td><td>Rapid IV/IO fluid bolus; blood products for haemorrhage</td></tr>
    <tr><td>Hypoxia</td><td>Cyanosis; low SpO₂ before arrest; respiratory cause</td><td>100% O₂; secure airway; treat underlying cause</td></tr>
    <tr><td>Hydrogen ion (acidosis)</td><td>Known DKA, renal failure, sepsis; ABG shows pH &lt;7.1</td><td>Sodium bicarbonate 1 mEq/kg IV (only if severe acidosis or TCA overdose)</td></tr>
    <tr><td>Hypo/Hyperkalaemia</td><td>Known renal failure, dialysis patient; ECG changes (peaked T waves, wide QRS)</td><td>Hyperkalaemia: calcium gluconate 10% 10 mL IV; sodium bicarbonate; insulin+dextrose; salbutamol</td></tr>
    <tr><td>Hypothermia</td><td>Cold environment; core temp &lt;30°C; J waves on ECG</td><td>Active rewarming; continue CPR until core temp &gt;32°C</td></tr>
    <tr><td>Tension pneumothorax</td><td>Trauma; ventilated patient; absent breath sounds; tracheal deviation; distended neck veins</td><td>Needle decompression (2nd ICS, MCL); then chest drain</td></tr>
    <tr><td>Tamponade</td><td>Penetrating chest trauma; pericarditis; post-cardiac surgery; muffled heart sounds; distended neck veins</td><td>Pericardiocentesis; emergency thoracotomy</td></tr>
    <tr><td>Toxins</td><td>Known overdose; medication history; empty bottles; specific ECG patterns</td><td>Specific antidotes (naloxone, flumazenil, lipid emulsion, sodium bicarbonate)</td></tr>
    <tr><td>Thrombosis (PE)</td><td>DVT risk factors; sudden arrest; right heart strain on ECG; S1Q3T3 pattern</td><td>Thrombolysis (alteplase 50 mg IV bolus); continue CPR for 60–90 min after thrombolysis</td></tr>
    <tr><td>Thrombosis (MI)</td><td>Chest pain before arrest; ST elevation on ECG; known CAD</td><td>Emergency PCI (if available); thrombolysis if PCI unavailable</td></tr>
  </tbody>
</table>`
      },
      {
        order: 4,
        title: "Bedside Ultrasound in Cardiac Arrest",
        content: `<h2>Bedside Ultrasound in Cardiac Arrest</h2>
<p>Point-of-care ultrasound (POCUS) is increasingly used during cardiac arrest to identify reversible causes and guide management. AHA 2020 guidelines recommend its use when available, provided it does not interrupt CPR.</p>
<h3>POCUS Applications in Cardiac Arrest</h3>
<table>
  <thead><tr><th>View</th><th>What to Look For</th><th>Clinical Implication</th></tr></thead>
  <tbody>
    <tr><td>Subxiphoid cardiac</td><td>Cardiac motion (pseudo-PEA), pericardial effusion (tamponade), right heart dilation (PE)</td><td>Identifies treatable causes; confirms true asystole</td></tr>
    <tr><td>Lung (bilateral)</td><td>Absent lung sliding (pneumothorax), B-lines (pulmonary oedema)</td><td>Confirms tension pneumothorax before needle decompression</td></tr>
    <tr><td>IVC</td><td>Flat IVC (hypovolaemia), dilated IVC (tamponade, right heart failure)</td><td>Guides fluid resuscitation</td></tr>
    <tr><td>Abdominal</td><td>Free fluid (haemoperitoneum)</td><td>Identifies haemorrhagic cause</td></tr>
  </tbody>
</table>
<div class="warning-note">
  <strong>POCUS must not interrupt CPR:</strong> Ultrasound should only be performed during the rhythm check pause (maximum 10 seconds). A dedicated sonographer should perform the scan while CPR continues or during the planned pause.
</div>`
      }
    ],
    quiz: {
      title: "Check: PEA/Asystole Algorithm",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "A patient in PEA has distended neck veins, absent breath sounds on the right, and tracheal deviation to the left. What is the most likely diagnosis and treatment?",
          options: JSON.stringify(["Cardiac tamponade — pericardiocentesis", "Tension pneumothorax — needle decompression at 2nd ICS MCL", "Massive PE — thrombolysis", "Hypovolaemia — IV fluid bolus"]),
          correctAnswer: "Tension pneumothorax — needle decompression at 2nd ICS MCL",
          explanation: "The triad of absent breath sounds, tracheal deviation away from the affected side, and distended neck veins in a PEA patient is classic for tension pneumothorax. Immediate needle decompression at the 2nd intercostal space, midclavicular line (or 4th/5th ICS, anterior axillary line) is the treatment. Do not wait for a chest X-ray."
        },
        {
          order: 2,
          questionText: "When should adrenaline be given in the PEA/asystole algorithm?",
          options: JSON.stringify(["After the 3rd rhythm check", "As soon as IV/IO access is established", "Only after 5 minutes of CPR", "After sodium bicarbonate"]),
          correctAnswer: "As soon as IV/IO access is established",
          explanation: "In PEA/asystole, adrenaline 1 mg IV/IO should be given as soon as vascular access is established, then repeated every 3–5 minutes. Unlike VF/pVT (where the first adrenaline is given after the 2nd shock), in PEA/asystole there is no delay — give it immediately."
        },
        {
          order: 3,
          questionText: "A dialysis patient arrests in PEA. The ECG shows peaked T waves and wide QRS complexes. What is the most likely reversible cause and first treatment?",
          options: JSON.stringify(["Hypokalaemia — potassium replacement", "Hyperkalaemia — calcium gluconate 10% 10 mL IV", "Hypothermia — active rewarming", "Acidosis — sodium bicarbonate"]),
          correctAnswer: "Hyperkalaemia — calcium gluconate 10% 10 mL IV",
          explanation: "Peaked T waves and wide QRS complexes in a dialysis patient are classic signs of hyperkalaemia. The first treatment is calcium gluconate 10% 10 mL IV (or calcium chloride 10% 6.7 mL IV) to stabilise the myocardial membrane. Follow with insulin+dextrose, sodium bicarbonate, and salbutamol to shift potassium intracellularly."
        }
      ]
    }
  },
  {
    order: 4,
    title: "Module 4: Bradycardia and Tachycardia Algorithms",
    description: "Manage symptomatic bradycardia and tachycardia using the ACLS algorithms.",
    content: "This module covers the evaluation and management of unstable and stable bradycardia and tachycardia.",
    duration: 25,
    sections: [
      {
        order: 1,
        title: "Overview: Assessing Haemodynamic Stability",
        content: `<h2>Assessing Haemodynamic Stability in Arrhythmias</h2>
<p>The key question in managing any arrhythmia is: <strong>Is the patient haemodynamically stable?</strong> The answer determines whether immediate intervention is required or whether there is time for a more measured approach.</p>
<div class="clinical-note">
  <strong>Signs of haemodynamic instability (ACLS criteria):</strong>
  <ul>
    <li>Hypotension (SBP &lt;90 mmHg)</li>
    <li>Altered mental status</li>
    <li>Signs of shock (cool, clammy skin; mottling; oliguria)</li>
    <li>Ischaemic chest pain</li>
    <li>Acute heart failure (pulmonary oedema)</li>
  </ul>
</div>
<p>If <strong>any</strong> of these signs are present and are caused by the arrhythmia, the patient is <strong>unstable</strong> and requires immediate intervention (cardioversion for tachycardia; pacing for bradycardia).</p>
<p>If the patient is <strong>stable</strong>, there is time to identify the rhythm, consider causes, and use pharmacological management.</p>`
      },
      {
        order: 2,
        title: "Bradycardia Algorithm",
        content: `<h2>Bradycardia Algorithm</h2>
<p>Bradycardia is defined as a heart rate &lt;60 bpm. It is only treated if it is causing symptoms.</p>
<h3>Algorithm</h3>
<ol>
  <li><strong>Identify and treat underlying cause</strong> (hypoxia, medications, hypothyroidism, heart block)</li>
  <li><strong>Stable bradycardia:</strong> Monitor; treat cause; consider atropine if symptomatic</li>
  <li><strong>Unstable bradycardia:</strong>
    <ul>
      <li>Atropine 0.5 mg IV — repeat every 3–5 minutes; maximum 3 mg total</li>
      <li>If atropine ineffective: transcutaneous pacing (TCP) or dopamine/adrenaline infusion</li>
      <li>Prepare for transvenous pacing if TCP fails</li>
    </ul>
  </li>
</ol>
<h3>Medications for Bradycardia</h3>
<table>
  <thead><tr><th>Drug</th><th>Dose</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>Atropine</td><td>0.5 mg IV every 3–5 min; max 3 mg</td><td>First-line; ineffective for high-degree AV block or infranodal block</td></tr>
    <tr><td>Dopamine</td><td>2–20 mcg/kg/min IV infusion</td><td>Use if atropine ineffective; bridge to pacing</td></tr>
    <tr><td>Adrenaline</td><td>2–10 mcg/min IV infusion</td><td>Alternative to dopamine; use if hypotension prominent</td></tr>
  </tbody>
</table>
<div class="warning-note">
  <strong>Atropine in high-degree AV block:</strong> Atropine is ineffective (and may worsen) Mobitz II and complete (3rd degree) AV block because the block is below the AV node. These patients require pacing.
</div>`
      },
      {
        order: 3,
        title: "Tachycardia Algorithm — Unstable",
        content: `<h2>Tachycardia Algorithm — Unstable Patient</h2>
<p>Any tachycardia causing haemodynamic instability requires immediate <strong>synchronised cardioversion</strong>.</p>
<h3>Synchronised Cardioversion — Energy</h3>
<table>
  <thead><tr><th>Rhythm</th><th>Initial Energy (Biphasic)</th></tr></thead>
  <tbody>
    <tr><td>Narrow regular (SVT, atrial flutter)</td><td>50–100 J</td></tr>
    <tr><td>Narrow irregular (atrial fibrillation)</td><td>120–200 J</td></tr>
    <tr><td>Wide regular (VT with pulse)</td><td>100 J</td></tr>
    <tr><td>Wide irregular (polymorphic VT)</td><td>Defibrillation energy (unsynchronised) — do not synchronise</td></tr>
  </tbody>
</table>
<div class="warning-note">
  <strong>Synchronised vs. unsynchronised:</strong> Synchronised cardioversion delivers the shock on the R wave to avoid the vulnerable period (T wave). For polymorphic VT (irregular wide complex), use unsynchronised (defibrillation) energy because the device cannot reliably identify the R wave.
</div>
<h3>Sedation Before Cardioversion</h3>
<p>If the patient is conscious and time permits, provide procedural sedation before cardioversion (e.g., midazolam 1–2 mg IV + fentanyl 25–50 mcg IV). If the patient is critically unstable, do not delay cardioversion for sedation.</p>`
      },
      {
        order: 4,
        title: "Tachycardia Algorithm — Stable",
        content: `<h2>Tachycardia Algorithm — Stable Patient</h2>
<p>For stable tachycardia, identify the rhythm and treat accordingly.</p>
<h3>Narrow Complex Tachycardia (QRS &lt;120 ms)</h3>
<table>
  <thead><tr><th>Rhythm</th><th>First-Line Treatment</th><th>Second-Line</th></tr></thead>
  <tbody>
    <tr><td>SVT (regular)</td><td>Vagal manoeuvres (Valsalva, carotid sinus massage); adenosine 6 mg IV rapid push</td><td>Adenosine 12 mg IV; diltiazem or metoprolol</td></tr>
    <tr><td>Atrial fibrillation (&lt;48 hr)</td><td>Rate control (metoprolol, diltiazem, digoxin); consider cardioversion</td><td>Rhythm control (amiodarone, flecainide)</td></tr>
    <tr><td>Atrial flutter</td><td>Rate control; cardioversion (often requires only 50 J)</td><td>Amiodarone</td></tr>
  </tbody>
</table>
<h3>Wide Complex Tachycardia (QRS ≥120 ms)</h3>
<table>
  <thead><tr><th>Rhythm</th><th>Treatment</th></tr></thead>
  <tbody>
    <tr><td>Regular VT (stable)</td><td>Amiodarone 150 mg IV over 10 min; procainamide 20–50 mg/min IV; cardioversion if drugs fail</td></tr>
    <tr><td>SVT with aberrancy</td><td>Adenosine (diagnostic and therapeutic) — safe if rhythm is actually SVT</td></tr>
  </tbody>
</table>
<div class="clinical-note">
  <strong>Adenosine for wide complex tachycardia:</strong> Adenosine can be used diagnostically for regular wide complex tachycardia if the rhythm is likely SVT with aberrancy. It is safe and will terminate SVT. It will not terminate VT but may briefly slow the rate to reveal the underlying rhythm. Do not use adenosine for irregular wide complex tachycardia (possible AF with WPW — can cause VF).
</div>`
      }
    ],
    quiz: {
      title: "Check: Bradycardia and Tachycardia Algorithms",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "A patient has a heart rate of 38 bpm with hypotension and altered consciousness. Atropine 0.5 mg IV has been given twice with no improvement. What is the next step?",
          options: JSON.stringify(["Give a third dose of atropine", "Transcutaneous pacing", "Adenosine 6 mg IV", "Amiodarone 300 mg IV"]),
          correctAnswer: "Transcutaneous pacing",
          explanation: "If atropine (maximum 3 mg total) is ineffective for unstable bradycardia, the next step is transcutaneous pacing (TCP). Dopamine or adrenaline infusion can be used as a bridge to pacing. Adenosine and amiodarone are for tachycardia, not bradycardia."
        },
        {
          order: 2,
          questionText: "A patient with atrial fibrillation and a heart rate of 160 bpm develops hypotension and chest pain. What is the immediate treatment?",
          options: JSON.stringify(["Metoprolol 5 mg IV", "Adenosine 6 mg IV rapid push", "Synchronised cardioversion at 120–200 J", "Amiodarone 150 mg IV over 10 minutes"]),
          correctAnswer: "Synchronised cardioversion at 120–200 J",
          explanation: "Unstable tachycardia (hypotension + chest pain caused by the arrhythmia) requires immediate synchronised cardioversion. For atrial fibrillation, the initial biphasic energy is 120–200 J. Do not delay cardioversion for medications in an unstable patient."
        },
        {
          order: 3,
          questionText: "Why should adenosine NOT be used for irregular wide complex tachycardia?",
          options: JSON.stringify(["It causes severe bradycardia", "It can cause VF in AF with WPW (Wolff-Parkinson-White)", "It is only effective for narrow complex rhythms", "It prolongs the QT interval"]),
          correctAnswer: "It can cause VF in AF with WPW (Wolff-Parkinson-White)",
          explanation: "In AF with WPW, the accessory pathway conducts at very high rates. Adenosine blocks the AV node, forcing all conduction through the accessory pathway, which can trigger VF. Irregular wide complex tachycardia should be treated with cardioversion, not adenosine."
        }
      ]
    }
  },
  {
    order: 5,
    title: "Module 5: Acute Coronary Syndromes (ACS)",
    description: "Recognise and initiate management of STEMI, NSTEMI, and unstable angina.",
    content: "ACS is a spectrum from unstable angina to STEMI. This module covers recognition, initial management, and reperfusion strategy.",
    duration: 25,
    sections: [
      {
        order: 1,
        title: "Overview: ACS Spectrum and Pathophysiology",
        content: `<h2>ACS Spectrum and Pathophysiology</h2>
<p>Acute coronary syndrome (ACS) encompasses a spectrum of conditions caused by acute myocardial ischaemia, typically due to rupture of an atherosclerotic plaque with superimposed thrombus formation.</p>
<h3>ACS Classification</h3>
<table>
  <thead><tr><th>Condition</th><th>ECG</th><th>Troponin</th><th>Pathology</th></tr></thead>
  <tbody>
    <tr><td>Unstable Angina (UA)</td><td>ST depression or T-wave changes, or normal</td><td>Negative</td><td>Partial occlusion; no myocardial necrosis</td></tr>
    <tr><td>NSTEMI</td><td>ST depression or T-wave changes, or normal</td><td>Positive (elevated)</td><td>Partial occlusion; myocardial necrosis</td></tr>
    <tr><td>STEMI</td><td>ST elevation in ≥2 contiguous leads (≥1 mm limb leads; ≥2 mm precordial leads)</td><td>Positive</td><td>Complete occlusion; transmural infarction</td></tr>
  </tbody>
</table>
<div class="clinical-note">
  <strong>Time is muscle:</strong> In STEMI, 1.9 million cardiomyocytes die every minute of occlusion. The goal is to restore coronary blood flow as rapidly as possible. "Door-to-balloon time" (time from hospital arrival to PCI) should be &lt;90 minutes.
</div>`
      },
      {
        order: 2,
        title: "STEMI Recognition and Initial Management",
        content: `<h2>STEMI Recognition and Initial Management</h2>
<h3>12-Lead ECG Interpretation — STEMI Criteria</h3>
<ul>
  <li>ST elevation ≥1 mm in ≥2 contiguous limb leads</li>
  <li>ST elevation ≥2 mm in ≥2 contiguous precordial leads</li>
  <li>New left bundle branch block (LBBB) — treat as STEMI equivalent</li>
  <li>Posterior MI: ST depression in V1–V4 (mirror image of posterior ST elevation)</li>
</ul>
<h3>STEMI Localisation</h3>
<table>
  <thead><tr><th>Location</th><th>Leads</th><th>Artery</th></tr></thead>
  <tbody>
    <tr><td>Anterior</td><td>V1–V4</td><td>LAD</td></tr>
    <tr><td>Lateral</td><td>I, aVL, V5–V6</td><td>LCx</td></tr>
    <tr><td>Inferior</td><td>II, III, aVF</td><td>RCA (80%) or LCx (20%)</td></tr>
    <tr><td>Right ventricular</td><td>V4R (right-sided leads)</td><td>RCA proximal</td></tr>
  </tbody>
</table>
<h3>Initial Management — MONA (Modified)</h3>
<ul>
  <li><strong>Morphine:</strong> 2–4 mg IV for pain (use cautiously — may mask symptoms and reduce antiplatelet absorption)</li>
  <li><strong>Oxygen:</strong> Only if SpO₂ &lt;90% — do not give routine oxygen (hyperoxia is harmful in MI)</li>
  <li><strong>Nitrates:</strong> Sublingual GTN 0.4 mg — do NOT give if RV infarction (causes severe hypotension) or if PDE5 inhibitor taken in last 24–48 hours</li>
  <li><strong>Aspirin:</strong> 300 mg chewed immediately (loading dose)</li>
  <li><strong>P2Y12 inhibitor:</strong> Ticagrelor 180 mg or clopidogrel 600 mg (loading dose)</li>
</ul>`
      },
      {
        order: 3,
        title: "Reperfusion Strategy — PCI vs. Thrombolysis",
        content: `<h2>Reperfusion Strategy in STEMI</h2>
<h3>Primary PCI (Preferred)</h3>
<ul>
  <li>Door-to-balloon time: &lt;90 minutes (if PCI-capable centre)</li>
  <li>Superior to thrombolysis in all patient groups when available within 120 minutes</li>
  <li>Indicated for all STEMI patients regardless of time of symptom onset</li>
</ul>
<h3>Thrombolysis (When PCI Not Available Within 120 Minutes)</h3>
<table>
  <thead><tr><th>Agent</th><th>Dose</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>Alteplase (tPA)</td><td>15 mg IV bolus, then 0.75 mg/kg over 30 min (max 50 mg), then 0.5 mg/kg over 60 min (max 35 mg)</td><td>Most commonly used</td></tr>
    <tr><td>Tenecteplase (TNK)</td><td>Weight-based single IV bolus (30–50 mg)</td><td>Easier to administer; preferred in resource-limited settings</td></tr>
    <tr><td>Streptokinase</td><td>1.5 million units IV over 60 min</td><td>Cheapest; cannot be given twice (antibodies form)</td></tr>
  </tbody>
</table>
<div class="warning-note">
  <strong>Absolute contraindications to thrombolysis:</strong> Prior intracranial haemorrhage; ischaemic stroke within 3 months; known intracranial neoplasm; active internal bleeding; suspected aortic dissection; significant closed-head trauma within 3 months.
</div>`
      },
      {
        order: 4,
        title: "NSTEMI and Unstable Angina Management",
        content: `<h2>NSTEMI and Unstable Angina Management</h2>
<p>NSTEMI and UA are managed with antiplatelet therapy, anticoagulation, and risk stratification — not immediate reperfusion (unless the patient becomes haemodynamically unstable).</p>
<h3>Risk Stratification — TIMI Score</h3>
<p>The TIMI score (0–7) stratifies patients into low, intermediate, and high risk. High-risk patients (score ≥5) benefit from early invasive strategy (angiography within 24 hours).</p>
<h3>Medical Management</h3>
<ul>
  <li><strong>Dual antiplatelet therapy:</strong> Aspirin 300 mg + ticagrelor 180 mg (or clopidogrel 600 mg)</li>
  <li><strong>Anticoagulation:</strong> Enoxaparin 1 mg/kg SC 12-hourly (or unfractionated heparin 60 units/kg IV bolus + infusion)</li>
  <li><strong>Beta-blocker:</strong> Metoprolol 25–50 mg orally (if no contraindications: HR &lt;60, SBP &lt;100, heart failure, heart block)</li>
  <li><strong>Statin:</strong> High-intensity statin (atorvastatin 80 mg) immediately</li>
  <li><strong>ACE inhibitor:</strong> Start within 24 hours if EF &lt;40% or anterior MI</li>
</ul>
<div class="clinical-note">
  <strong>Immediate angiography indications in NSTEMI:</strong> Haemodynamic instability; refractory chest pain; life-threatening arrhythmias; mechanical complications (VSD, papillary muscle rupture). These patients should go to the cath lab immediately, not wait for risk stratification.
</div>`
      }
    ],
    quiz: {
      title: "Check: Acute Coronary Syndromes",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "A patient presents with inferior STEMI (ST elevation in II, III, aVF). Before giving sublingual GTN, what must you check?",
          options: JSON.stringify(["Blood glucose level", "Right ventricular involvement (right-sided ECG leads)", "Troponin level", "Renal function"]),
          correctAnswer: "Right ventricular involvement (right-sided ECG leads)",
          explanation: "Inferior STEMI is caused by RCA occlusion in 80% of cases. The RCA also supplies the right ventricle. RV infarction causes RV failure with dependence on preload. GTN causes venodilation, reducing preload and precipitating severe hypotension in RV infarction. Always check right-sided leads (V4R) before giving GTN in inferior STEMI."
        },
        {
          order: 2,
          questionText: "What is the maximum acceptable door-to-balloon time for primary PCI in STEMI?",
          options: JSON.stringify(["30 minutes", "60 minutes", "90 minutes", "120 minutes"]),
          correctAnswer: "90 minutes",
          explanation: "AHA/ACC guidelines set a door-to-balloon time target of <90 minutes for primary PCI in STEMI. If PCI cannot be performed within 120 minutes of first medical contact, thrombolysis should be given within 30 minutes of hospital arrival (door-to-needle time <30 minutes)."
        },
        {
          order: 3,
          questionText: "A patient with NSTEMI has ongoing chest pain, hypotension, and a new VSD detected on bedside echo. What is the appropriate management?",
          options: JSON.stringify(["Medical management with dual antiplatelet therapy and anticoagulation", "Thrombolysis with alteplase", "Immediate angiography and revascularisation", "Conservative management — monitor in CCU"]),
          correctAnswer: "Immediate angiography and revascularisation",
          explanation: "Mechanical complications of MI (VSD, papillary muscle rupture, free wall rupture) are indications for immediate angiography regardless of NSTEMI classification. This patient is haemodynamically unstable with a mechanical complication — immediate invasive strategy is required."
        }
      ]
    }
  },
  {
    order: 6,
    title: "Module 6: Stroke, Post-Cardiac Arrest Care, and Special Resuscitation Situations",
    description: "Manage acute stroke, post-ROSC care, and special resuscitation situations including pregnancy and toxicology.",
    content: "This module covers the stroke algorithm, targeted temperature management, and special resuscitation scenarios.",
    duration: 20,
    sections: [
      {
        order: 1,
        title: "Acute Stroke — Recognition and Time-Critical Management",
        content: `<h2>Acute Stroke — Recognition and Time-Critical Management</h2>
<p>Stroke is a time-critical emergency. "Time is brain" — 1.9 million neurons die every minute of untreated stroke.</p>
<h3>Stroke Recognition — BE-FAST</h3>
<table>
  <thead><tr><th>Letter</th><th>Sign</th></tr></thead>
  <tbody>
    <tr><td>B — Balance</td><td>Sudden loss of balance or coordination</td></tr>
    <tr><td>E — Eyes</td><td>Sudden vision changes (blurred, double, loss of vision)</td></tr>
    <tr><td>F — Face</td><td>Facial drooping (ask patient to smile)</td></tr>
    <tr><td>A — Arms</td><td>Arm weakness (ask patient to raise both arms)</td></tr>
    <tr><td>S — Speech</td><td>Speech difficulty (slurred, confused, unable to speak)</td></tr>
    <tr><td>T — Time</td><td>Time of symptom onset — call emergency services immediately</td></tr>
  </tbody>
</table>
<h3>Ischaemic Stroke — IV tPA (Alteplase)</h3>
<ul>
  <li><strong>Dose:</strong> 0.9 mg/kg IV (max 90 mg); 10% as bolus over 1 min, remainder over 60 min</li>
  <li><strong>Window:</strong> Within 3 hours of symptom onset (extended to 4.5 hours in selected patients)</li>
  <li><strong>Absolute contraindications:</strong> Haemorrhagic stroke; BP &gt;185/110 mmHg (treat first); blood glucose &lt;50 or &gt;400 mg/dL; INR &gt;1.7; platelets &lt;100,000</li>
</ul>`
      },
      {
        order: 2,
        title: "Post-Cardiac Arrest Care — Targeted Temperature Management",
        content: `<h2>Post-Cardiac Arrest Care — Targeted Temperature Management (TTM)</h2>
<p>Post-cardiac arrest syndrome is a complex pathophysiological state characterised by brain injury, myocardial dysfunction, systemic ischaemia-reperfusion injury, and the precipitating cause of arrest.</p>
<h3>TTM Protocol</h3>
<table>
  <thead><tr><th>Phase</th><th>Target</th><th>Duration</th></tr></thead>
  <tbody>
    <tr><td>Induction</td><td>Cool to 32–36°C as rapidly as possible</td><td>Begin immediately after ROSC</td></tr>
    <tr><td>Maintenance</td><td>32–36°C (select one temperature and maintain)</td><td>24 hours</td></tr>
    <tr><td>Rewarming</td><td>Rewarm at 0.25°C/hour</td><td>Until 37°C reached</td></tr>
    <tr><td>Fever prevention</td><td>Prevent fever (&gt;37.5°C) for 72 hours after ROSC</td><td>72 hours</td></tr>
  </tbody>
</table>
<div class="clinical-note">
  <strong>TTM indications:</strong> Comatose survivors of cardiac arrest (GCS &lt;8 after ROSC) — both shockable and non-shockable rhythms. AHA 2020 guidelines recommend TTM for all comatose post-arrest patients.
</div>
<h3>Post-ROSC Haemodynamic Targets</h3>
<ul>
  <li>MAP ≥65 mmHg (some guidelines recommend ≥80 mmHg for neuroprotection)</li>
  <li>SpO₂ 94–98% (avoid hyperoxia)</li>
  <li>PaCO₂ 35–45 mmHg (avoid hypocapnia — causes cerebral vasoconstriction)</li>
  <li>Blood glucose 7.8–10 mmol/L (180 mg/dL) — avoid hypoglycaemia and severe hyperglycaemia</li>
</ul>`
      },
      {
        order: 3,
        title: "Special Resuscitation Situations",
        content: `<h2>Special Resuscitation Situations</h2>
<h3>Opioid Overdose</h3>
<ul>
  <li>Classic triad: miosis (pinpoint pupils), respiratory depression, altered consciousness</li>
  <li><strong>Naloxone:</strong> 0.4–2 mg IV/IM/IN; repeat every 2–3 minutes; may need infusion (2/3 of effective bolus dose per hour)</li>
  <li>If cardiac arrest: standard CPR; naloxone does not replace CPR</li>
  <li>Duration of naloxone (&lt;90 min) is shorter than most opioids — monitor for re-narcotisation</li>
</ul>
<h3>Local Anaesthetic Systemic Toxicity (LAST)</h3>
<ul>
  <li>Seizures, cardiovascular collapse after local anaesthetic injection</li>
  <li><strong>Lipid emulsion therapy:</strong> 20% intralipid 1.5 mL/kg IV bolus, then 0.25 mL/kg/min infusion</li>
  <li>Continue CPR for at least 60 minutes after lipid emulsion</li>
</ul>
<h3>Tricyclic Antidepressant (TCA) Overdose</h3>
<ul>
  <li>Wide QRS, QTc prolongation, hypotension, seizures</li>
  <li><strong>Sodium bicarbonate:</strong> 1–2 mEq/kg IV bolus; target arterial pH 7.45–7.55</li>
  <li>Avoid physostigmine (can cause cardiac arrest)</li>
</ul>
<h3>Hypothermia</h3>
<ul>
  <li>Continue CPR until core temperature &gt;32°C ("not dead until warm and dead")</li>
  <li>Withhold adrenaline if core temp &lt;30°C (ineffective and accumulates)</li>
  <li>Defibrillation may be ineffective below 30°C — attempt once; if unsuccessful, rewarm first</li>
</ul>`
      },
      {
        order: 4,
        title: "Termination of Resuscitation and Ethical Considerations",
        content: `<h2>Termination of Resuscitation and Ethical Considerations</h2>
<p>Deciding when to stop resuscitation is one of the most difficult decisions in medicine. It requires clinical judgement, team consensus, and sensitivity to the patient's values and family's needs.</p>
<h3>Factors Supporting Termination of Resuscitation</h3>
<ul>
  <li>Prolonged resuscitation (&gt;30 minutes) without ROSC</li>
  <li>ETCO₂ &lt;10 mmHg after 20 minutes of CPR</li>
  <li>No reversible cause identified or treated</li>
  <li>Non-shockable rhythm throughout</li>
  <li>Known terminal illness or advance directive refusing resuscitation</li>
</ul>
<h3>Factors Against Early Termination</h3>
<ul>
  <li>Hypothermia (core temp &lt;32°C)</li>
  <li>Drug overdose (especially opioids, barbiturates)</li>
  <li>Young age</li>
  <li>Witnessed arrest with immediate CPR</li>
  <li>Shockable rhythm at any point</li>
</ul>
<div class="clinical-note">
  <strong>Communicating with families:</strong> When resuscitation is terminated, a senior team member should speak with the family immediately. Use clear, direct language: "We have done everything we can. Your [relative] has died." Avoid euphemisms. Provide space for grief. Offer chaplaincy and bereavement support.
</div>`
      }
    ],
    quiz: {
      title: "Check: Stroke, Post-Arrest Care, and Special Situations",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "A patient achieves ROSC after cardiac arrest and remains comatose. What is the target temperature for TTM?",
          options: JSON.stringify(["28–32°C", "32–36°C", "36–37°C", "37–38°C"]),
          correctAnswer: "32–36°C",
          explanation: "AHA 2020 guidelines recommend TTM at 32–36°C for 24 hours for comatose survivors of cardiac arrest. The specific temperature within this range should be selected and maintained consistently. After 24 hours, rewarm at 0.25°C/hour and prevent fever (>37.5°C) for 72 hours."
        },
        {
          order: 2,
          questionText: "A patient collapses after a dental procedure with wide QRS, hypotension, and seizures. What is the most likely diagnosis and treatment?",
          options: JSON.stringify(["Opioid overdose — naloxone", "Local anaesthetic systemic toxicity — 20% intralipid", "TCA overdose — sodium bicarbonate", "Hypoglycaemia — 50% dextrose"]),
          correctAnswer: "Local anaesthetic systemic toxicity — 20% intralipid",
          explanation: "Collapse after a dental or regional anaesthetic procedure with cardiovascular and neurological signs is classic for LAST (Local Anaesthetic Systemic Toxicity). Treatment is 20% intralipid 1.5 mL/kg IV bolus followed by infusion. Continue CPR for at least 60 minutes after lipid emulsion."
        },
        {
          order: 3,
          questionText: "What is the maximum time window for IV alteplase (tPA) in acute ischaemic stroke?",
          options: JSON.stringify(["1 hour", "3 hours (extended to 4.5 hours in selected patients)", "6 hours", "24 hours"]),
          correctAnswer: "3 hours (extended to 4.5 hours in selected patients)",
          explanation: "IV alteplase is indicated within 3 hours of symptom onset for acute ischaemic stroke. The window can be extended to 4.5 hours in selected patients (age <80, no prior stroke + diabetes, no anticoagulation, NIHSS <25, no large infarct on imaging). Beyond 4.5 hours, mechanical thrombectomy may be considered for large vessel occlusion."
        }
      ]
    }
  }
];

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log(`Seeding ACLS course (ID: ${ACLS_COURSE_ID})...`);
  
  // Clear existing modules for ACLS
  const [existingMods] = await conn.execute(
    `SELECT id FROM modules WHERE courseId = ?`, [ACLS_COURSE_ID]
  );
  for (const mod of existingMods as any[]) {
    await conn.execute(`DELETE FROM quizQuestions WHERE quizId IN (SELECT id FROM quizzes WHERE moduleId = ?)`, [mod.id]);
    await conn.execute(`DELETE FROM quizzes WHERE moduleId = ?`, [mod.id]);
    await conn.execute(`DELETE FROM moduleSections WHERE moduleId = ?`, [mod.id]);
  }
  await conn.execute(`DELETE FROM modules WHERE courseId = ?`, [ACLS_COURSE_ID]);
  
  for (const mod of modules) {
    const [modResult] = await conn.execute(
      `INSERT INTO modules (courseId, title, description, content, duration, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [ACLS_COURSE_ID, mod.title, mod.description, mod.content, mod.duration, mod.order]
    );
    const moduleId = (modResult as any).insertId;
    
    for (const section of mod.sections) {
      await conn.execute(
        `INSERT INTO moduleSections (moduleId, title, content, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [moduleId, section.title, section.content, section.order]
      );
    }
    
    const [quizResult] = await conn.execute(
      `INSERT INTO quizzes (moduleId, title, description, passingScore, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
      [moduleId, mod.quiz.title, mod.quiz.title, mod.quiz.passingScore]
    );
    const quizId = (quizResult as any).insertId;
    
    for (const q of mod.quiz.questions) {
      await conn.execute(
        `INSERT INTO quizQuestions (quizId, question, options, correctAnswer, explanation, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [quizId, q.questionText, q.options, q.correctAnswer, q.explanation, q.order]
      );
    }
    
    console.log(`  ✓ Module ${mod.order}: ${mod.title} (${mod.sections.length} sections, ${mod.quiz.questions.length} quiz questions)`);
  }
  
  console.log(`\nACLS seeding complete: ${modules.length} modules, ${modules.reduce((a, m) => a + m.sections.length, 0)} sections, ${modules.reduce((a, m) => a + m.quiz.questions.length, 0)} quiz questions`);
  
  await conn.end();
}

main().catch(console.error);
