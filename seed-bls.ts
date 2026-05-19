/**
 * BLS Course Content Seed
 * Course ID: 1 — Basic Life Support (BLS)
 * Aligned with: AHA BLS 2020 Guidelines, ILCOR 2020 Consensus
 * Structure: 5 modules × 4 sections + formative quiz per module
 */
import * as dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

const BLS_COURSE_ID = 1;

const modules = [
  {
    order: 1,
    title: "Module 1: Recognising Cardiac Arrest and Activating the Emergency Response",
    description: "Identify the signs of cardiac arrest and activate the emergency response system effectively.",
    content: "This module covers the critical first steps in BLS: recognising unresponsiveness, absent or abnormal breathing, and activating emergency services.",
    duration: 20,
    sections: [
      {
        order: 1,
        title: "Overview: The BLS Chain of Survival",
        content: `<h2>The BLS Chain of Survival</h2>
<p>Basic Life Support (BLS) is the foundation of emergency cardiac care. The AHA 2020 guidelines define the <strong>Chain of Survival</strong> as a series of critical actions that, when performed rapidly and correctly, maximise the chance of survival from cardiac arrest.</p>
<div class="clinical-note">
  <strong>The 6-Link Chain of Survival (AHA 2020):</strong>
  <ol>
    <li>Recognition of cardiac arrest and activation of the emergency response system</li>
    <li>Immediate high-quality CPR</li>
    <li>Rapid defibrillation</li>
    <li>Advanced resuscitation by Emergency Medical Services and other healthcare providers</li>
    <li>Post-cardiac arrest care</li>
    <li>Recovery (including additional treatment, observation, rehabilitation, and support)</li>
  </ol>
</div>
<p>Each link in the chain is equally important. A weak link at any point reduces the probability of survival. Studies show that survival rates drop by <strong>7–10% for every minute</strong> without CPR or defibrillation.</p>
<h3>Why BLS Matters</h3>
<p>Cardiac arrest affects over 350,000 people outside hospital settings in the US alone each year. Bystander CPR can double or triple survival rates. In low-resource settings, BLS-trained providers are often the first and only line of defence before advanced care is available.</p>`
      },
      {
        order: 2,
        title: "Recognising Unresponsiveness and Abnormal Breathing",
        content: `<h2>Recognising Unresponsiveness and Abnormal Breathing</h2>
<p>Rapid recognition is the first critical step. Every second of delay reduces survival probability.</p>
<h3>Step-by-Step Recognition</h3>
<table>
  <thead><tr><th>Step</th><th>Action</th><th>Duration</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Tap shoulders firmly and shout: "Are you okay?"</td><td>2–3 seconds</td></tr>
    <tr><td>2</td><td>Look for normal breathing (chest rise, regular rhythm)</td><td>No more than 10 seconds</td></tr>
    <tr><td>3</td><td>Check for a pulse (carotid in adults, brachial in infants)</td><td>No more than 10 seconds</td></tr>
    <tr><td>4</td><td>If unresponsive and no normal breathing → activate emergency response</td><td>Immediately</td></tr>
  </tbody>
</table>
<div class="warning-note">
  <strong>Agonal breathing:</strong> Gasping or irregular breathing is NOT normal breathing. It is a sign of cardiac arrest. Do not wait — begin CPR immediately.
</div>
<h3>Pulse Check</h3>
<p>Healthcare providers should check for a pulse simultaneously with breathing assessment. If no definite pulse is felt within 10 seconds, begin CPR. It is better to start CPR on a patient who has a pulse than to delay CPR on a patient who does not.</p>
<div class="clinical-note">
  <strong>Paediatric note:</strong> In infants, check the brachial artery (inner upper arm). In children over 1 year, check the carotid artery. In neonates, check the umbilical cord pulse.
</div>`
      },
      {
        order: 3,
        title: "Activating the Emergency Response System",
        content: `<h2>Activating the Emergency Response System</h2>
<p>Once cardiac arrest is recognised, activating the emergency response system must happen simultaneously with beginning CPR — not before, not after.</p>
<h3>Single Rescuer vs. Team Response</h3>
<table>
  <thead><tr><th>Scenario</th><th>Action</th></tr></thead>
  <tbody>
    <tr><td>Single rescuer (adult victim)</td><td>Call emergency services FIRST (or send bystander), then begin CPR</td></tr>
    <tr><td>Single rescuer (child/infant victim)</td><td>Begin CPR for 2 minutes FIRST, then call emergency services</td></tr>
    <tr><td>Two or more rescuers</td><td>One begins CPR, one calls emergency services simultaneously</td></tr>
    <tr><td>In-hospital</td><td>Call the resuscitation team (crash call) while beginning CPR</td></tr>
  </tbody>
</table>
<h3>What to Tell Emergency Services</h3>
<ul>
  <li>Your exact location (address, ward, bed number)</li>
  <li>What happened (e.g., "patient is unresponsive and not breathing")</li>
  <li>Number of victims</li>
  <li>Whether CPR is in progress</li>
  <li>Stay on the line — the dispatcher can guide you</li>
</ul>
<div class="clinical-note">
  <strong>AED location:</strong> Know where the nearest AED is in your facility. Every second counts. If an AED is available, retrieve it immediately while CPR continues.
</div>`
      },
      {
        order: 4,
        title: "Scene Safety and Personal Protective Equipment",
        content: `<h2>Scene Safety and Personal Protective Equipment</h2>
<p>Before approaching any victim, assess the scene for hazards. A rescuer who becomes a victim cannot help anyone.</p>
<h3>Scene Safety Assessment</h3>
<ul>
  <li><strong>Traffic hazards:</strong> Move the victim only if in immediate danger (e.g., burning vehicle, active traffic)</li>
  <li><strong>Electrical hazards:</strong> Do not touch victim if in contact with live electrical source</li>
  <li><strong>Toxic environments:</strong> Do not enter confined spaces with toxic gases without appropriate PPE</li>
  <li><strong>Violence:</strong> Do not approach if scene is unsafe — call law enforcement first</li>
</ul>
<h3>PPE During CPR</h3>
<table>
  <thead><tr><th>Setting</th><th>Minimum PPE</th></tr></thead>
  <tbody>
    <tr><td>Out-of-hospital (community)</td><td>Gloves if available; barrier device for rescue breaths</td></tr>
    <tr><td>In-hospital (standard)</td><td>Gloves + surgical mask</td></tr>
    <tr><td>Suspected infectious disease (e.g., COVID-19)</td><td>Gloves + N95/FFP2 mask + eye protection + gown</td></tr>
    <tr><td>Aerosol-generating procedures (e.g., intubation)</td><td>Full PPE: gloves + N95 + face shield + gown</td></tr>
  </tbody>
</table>
<div class="warning-note">
  <strong>COVID-19 and CPR:</strong> Chest compressions are aerosol-generating. In suspected or confirmed COVID-19, use full PPE before beginning CPR. Do not delay compressions for PPE if the patient is clearly in cardiac arrest and PPE is not immediately available — the risk to the rescuer must be balanced against the certain death of the victim.
</div>`
      }
    ],
    quiz: {
      title: "Check: Cardiac Arrest Recognition",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "A patient is found unresponsive. You tap their shoulders and shout — no response. You look at their chest and see occasional gasping breaths every 8–10 seconds. What is the correct interpretation?",
          options: JSON.stringify(["Normal breathing — monitor and reassess", "Agonal breathing — this is cardiac arrest, begin CPR immediately", "Sleep apnoea — place in recovery position", "Seizure activity — do not restrain"]),
          correctAnswer: "Agonal breathing — this is cardiac arrest, begin CPR immediately",
          explanation: "Agonal breathing (gasping, irregular, infrequent) is a sign of cardiac arrest, not normal breathing. AHA 2020 guidelines state: if the victim is unresponsive and not breathing normally, treat as cardiac arrest and begin CPR immediately."
        },
        {
          order: 2,
          questionText: "You are alone and find an 8-year-old child unresponsive and not breathing. There is no one else present. What is the correct sequence?",
          options: JSON.stringify(["Call emergency services first, then begin CPR", "Begin CPR for 2 minutes, then call emergency services", "Begin CPR and do not call — continue until help arrives", "Check pulse for 30 seconds before doing anything"]),
          correctAnswer: "Begin CPR for 2 minutes, then call emergency services",
          explanation: "For a single rescuer with a paediatric victim (child or infant), AHA guidelines recommend beginning CPR for 2 minutes before calling emergency services. This is because paediatric cardiac arrest is usually respiratory in origin, and 2 minutes of CPR may restore circulation. For adults, call first (or simultaneously) because the cause is more likely to be a shockable rhythm."
        },
        {
          order: 3,
          questionText: "In a hospital setting with two rescuers, what is the correct approach when cardiac arrest is identified?",
          options: JSON.stringify(["Both rescuers call the crash team before touching the patient", "One rescuer begins CPR while the other calls the resuscitation team simultaneously", "One rescuer checks for pulse for 30 seconds while the other calls the team", "Begin CPR only after the resuscitation team arrives"]),
          correctAnswer: "One rescuer begins CPR while the other calls the resuscitation team simultaneously",
          explanation: "With two or more rescuers, roles should be divided immediately: one begins high-quality CPR while the other activates the emergency response. This minimises time-to-first-compression and time-to-defibrillation — both are critical determinants of survival."
        }
      ]
    }
  },
  {
    order: 2,
    title: "Module 2: High-Quality CPR — Adult",
    description: "Master the technique of high-quality chest compressions and rescue breathing for adults.",
    content: "This module covers the components of high-quality CPR for adults: compression rate, depth, recoil, minimising interruptions, and rescue breathing ratios.",
    duration: 25,
    sections: [
      {
        order: 1,
        title: "Overview: What Makes CPR High-Quality",
        content: `<h2>What Makes CPR High-Quality</h2>
<p>The AHA 2020 guidelines define high-quality CPR by five measurable components. All five must be achieved simultaneously for CPR to be effective.</p>
<div class="clinical-note">
  <strong>The 5 Components of High-Quality CPR:</strong>
  <ol>
    <li><strong>Rate:</strong> 100–120 compressions per minute</li>
    <li><strong>Depth:</strong> At least 2 inches (5 cm) in adults; do not exceed 2.4 inches (6 cm)</li>
    <li><strong>Recoil:</strong> Allow full chest recoil after each compression — do not lean on the chest</li>
    <li><strong>Minimise interruptions:</strong> Limit pauses to less than 10 seconds</li>
    <li><strong>Avoid excessive ventilation:</strong> 1 breath every 6 seconds (10 breaths/min) with advanced airway; 30:2 ratio without</li>
  </ol>
</div>
<p>Research shows that CPR quality degrades significantly after 2 minutes due to rescuer fatigue. Rotate compressors every 2 minutes when multiple rescuers are available.</p>`
      },
      {
        order: 2,
        title: "Chest Compression Technique",
        content: `<h2>Chest Compression Technique — Adult</h2>
<h3>Hand Position</h3>
<ul>
  <li>Place the heel of one hand on the <strong>centre of the chest</strong> (lower half of the sternum)</li>
  <li>Place the other hand on top, interlacing fingers</li>
  <li>Keep fingers off the ribs — compress only the sternum</li>
  <li>Arms straight, elbows locked, shoulders directly over hands</li>
</ul>
<h3>Compression Parameters</h3>
<table>
  <thead><tr><th>Parameter</th><th>Target</th><th>Why It Matters</th></tr></thead>
  <tbody>
    <tr><td>Rate</td><td>100–120/min</td><td>Rates below 100 reduce cardiac output; rates above 120 reduce compression depth</td></tr>
    <tr><td>Depth</td><td>5–6 cm (2–2.4 inches)</td><td>Insufficient depth fails to generate adequate coronary perfusion pressure</td></tr>
    <tr><td>Recoil</td><td>Full — do not lean</td><td>Incomplete recoil prevents venous return and reduces cardiac output</td></tr>
    <tr><td>Interruptions</td><td>&lt;10 seconds</td><td>Each pause drops coronary perfusion pressure to zero; takes 15–20 compressions to restore</td></tr>
  </tbody>
</table>
<div class="warning-note">
  <strong>Compression fraction:</strong> The proportion of time spent doing compressions (CCF) should be ≥60%, ideally ≥80%. Every pause — for rhythm checks, ventilation, pulse checks — reduces CCF.
</div>
<h3>Rescuer Fatigue</h3>
<p>Compression depth decreases significantly after 1–2 minutes of CPR. Switch compressors every 2 minutes (during rhythm check pauses) to maintain quality.</p>`
      },
      {
        order: 3,
        title: "Rescue Breathing — Adult",
        content: `<h2>Rescue Breathing — Adult</h2>
<h3>Without Advanced Airway (30:2 ratio)</h3>
<ul>
  <li>Deliver 30 compressions, then 2 rescue breaths</li>
  <li>Each breath: 1 second duration, enough to produce visible chest rise</li>
  <li>Head-tilt chin-lift to open airway (jaw thrust if cervical spine injury suspected)</li>
  <li>Pinch nose closed for mouth-to-mouth; use bag-mask if available</li>
</ul>
<h3>With Advanced Airway (ETT or supraglottic)</h3>
<ul>
  <li>Continuous compressions at 100–120/min (no pauses for breaths)</li>
  <li>One breath every 6 seconds (10 breaths/min)</li>
  <li>Tidal volume: 500–600 mL (6–7 mL/kg) — just enough for visible chest rise</li>
</ul>
<div class="warning-note">
  <strong>Avoid hyperventilation:</strong> Excessive ventilation increases intrathoracic pressure, reduces venous return, and decreases coronary perfusion pressure. It also causes gastric distension and regurgitation risk.
</div>
<h3>Compression-Only CPR</h3>
<p>For untrained bystanders or those unwilling to give rescue breaths, compression-only CPR is recommended for adult victims. It is nearly as effective as standard CPR for the first few minutes of cardiac arrest (when blood oxygen levels are still adequate).</p>`
      },
      {
        order: 4,
        title: "CPR with Bag-Mask Ventilation",
        content: `<h2>CPR with Bag-Mask Ventilation</h2>
<p>The bag-mask device (BVM) is the standard ventilation tool in BLS. Effective BVM use requires training and practice.</p>
<h3>One-Person BVM Technique</h3>
<ol>
  <li>Select correct mask size (covers nose and mouth, not eyes)</li>
  <li>Position: EC clamp — three fingers under mandible (E), two fingers on mask (C)</li>
  <li>Tilt head back, lift chin to open airway</li>
  <li>Squeeze bag with other hand — 1 second, watch for chest rise</li>
  <li>Tidal volume: 500–600 mL (avoid overinflation)</li>
</ol>
<h3>Two-Person BVM Technique (Preferred)</h3>
<ul>
  <li>One person holds the mask with both hands (two-thumb technique or bilateral EC clamp)</li>
  <li>Second person squeezes the bag</li>
  <li>Two-person technique produces better mask seal and higher tidal volumes</li>
</ul>
<div class="clinical-note">
  <strong>Oxygen delivery:</strong> Without supplemental oxygen, BVM delivers ~21% O₂. With oxygen at 15 L/min, delivers ~40–60% O₂. With oxygen reservoir bag, delivers ~90–100% O₂. Always connect oxygen when available.
</div>
<table>
  <thead><tr><th>Scenario</th><th>O₂ Flow</th><th>FiO₂ Delivered</th></tr></thead>
  <tbody>
    <tr><td>No oxygen</td><td>Room air</td><td>~21%</td></tr>
    <tr><td>O₂ without reservoir</td><td>10–15 L/min</td><td>~40–60%</td></tr>
    <tr><td>O₂ with reservoir bag</td><td>15 L/min</td><td>~90–100%</td></tr>
  </tbody>
</table>`
      }
    ],
    quiz: {
      title: "Check: Adult CPR Technique",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "What is the correct compression rate for adult CPR according to AHA 2020 guidelines?",
          options: JSON.stringify(["60–80 compressions per minute", "80–100 compressions per minute", "100–120 compressions per minute", "120–140 compressions per minute"]),
          correctAnswer: "100–120 compressions per minute",
          explanation: "AHA 2020 guidelines specify 100–120 compressions per minute. Rates below 100 generate insufficient cardiac output. Rates above 120 reduce compression depth due to inadequate time for chest recoil and rescuer mechanics."
        },
        {
          order: 2,
          questionText: "During adult CPR without an advanced airway, what is the correct compression-to-ventilation ratio?",
          options: JSON.stringify(["15:2", "30:2", "15:1", "Continuous compressions only"]),
          correctAnswer: "30:2",
          explanation: "Without an advanced airway, AHA guidelines recommend 30 compressions to 2 rescue breaths for adult CPR. This ratio maximises compression fraction while providing adequate ventilation. Once an advanced airway (ETT or supraglottic device) is placed, switch to continuous compressions with 1 breath every 6 seconds."
        },
        {
          order: 3,
          questionText: "A rescuer has been performing chest compressions for 2 minutes. What should happen next?",
          options: JSON.stringify(["Continue for another 5 minutes before switching", "Switch compressors during the rhythm check pause", "Stop CPR and reassess the patient", "Increase compression rate to compensate for fatigue"]),
          correctAnswer: "Switch compressors during the rhythm check pause",
          explanation: "Compression quality degrades significantly after 2 minutes due to rescuer fatigue. AHA guidelines recommend switching compressors every 2 minutes, ideally during the rhythm check pause to minimise interruptions. The switch should take less than 5 seconds."
        }
      ]
    }
  },
  {
    order: 3,
    title: "Module 3: High-Quality CPR — Paediatric (Child and Infant)",
    description: "Apply BLS techniques correctly for children (1–8 years) and infants (under 1 year).",
    content: "Paediatric CPR differs from adult CPR in compression depth, hand position, and ventilation approach. This module covers all key differences.",
    duration: 25,
    sections: [
      {
        order: 1,
        title: "Overview: Key Differences in Paediatric BLS",
        content: `<h2>Key Differences in Paediatric BLS</h2>
<p>Paediatric cardiac arrest is fundamentally different from adult cardiac arrest. In children, the most common cause is <strong>respiratory failure</strong> — not a primary cardiac event. This has important implications for BLS technique.</p>
<div class="clinical-note">
  <strong>Paediatric vs. Adult Cardiac Arrest — Key Differences:</strong>
  <table>
    <thead><tr><th>Feature</th><th>Adult</th><th>Child (1–8 yr)</th><th>Infant (&lt;1 yr)</th></tr></thead>
    <tbody>
      <tr><td>Most common cause</td><td>Cardiac (VF/VT)</td><td>Respiratory</td><td>Respiratory/SIDS</td></tr>
      <tr><td>Initial rhythm</td><td>Usually shockable</td><td>Usually non-shockable (PEA/asystole)</td><td>Usually non-shockable</td></tr>
      <tr><td>Compression depth</td><td>5–6 cm</td><td>5 cm (1/3 AP diameter)</td><td>4 cm (1/3 AP diameter)</td></tr>
      <tr><td>Compression technique</td><td>Two hands</td><td>One or two hands</td><td>Two fingers or two-thumb encircling</td></tr>
      <tr><td>Pulse check site</td><td>Carotid</td><td>Carotid</td><td>Brachial</td></tr>
      <tr><td>Single rescuer: call first?</td><td>Yes</td><td>No — CPR 2 min first</td><td>No — CPR 2 min first</td></tr>
    </tbody>
  </table>
</div>`
      },
      {
        order: 2,
        title: "Child CPR (1–8 Years)",
        content: `<h2>Child CPR — Ages 1 to 8 Years</h2>
<h3>Compression Technique</h3>
<ul>
  <li><strong>Position:</strong> Heel of one hand on the lower half of the sternum (two fingers above xiphoid)</li>
  <li><strong>Depth:</strong> At least 5 cm (approximately 1/3 of the anterior-posterior chest diameter)</li>
  <li><strong>Rate:</strong> 100–120 compressions per minute</li>
  <li><strong>Recoil:</strong> Full chest recoil between compressions</li>
  <li><strong>Two hands:</strong> May use two hands for larger children</li>
</ul>
<h3>Ventilation</h3>
<ul>
  <li><strong>Without advanced airway:</strong> 30:2 (single rescuer) or 15:2 (two healthcare providers)</li>
  <li><strong>With advanced airway:</strong> 1 breath every 3–5 seconds (12–20 breaths/min)</li>
  <li><strong>Tidal volume:</strong> Enough for visible chest rise — avoid overinflation</li>
</ul>
<div class="warning-note">
  <strong>15:2 ratio:</strong> When two healthcare providers are present for a paediatric victim, use a 15:2 ratio instead of 30:2. This provides more frequent ventilation, reflecting the respiratory cause of most paediatric arrests.
</div>
<h3>AED Use in Children</h3>
<p>Use a paediatric dose attenuator (paediatric pads) for children under 8 years if available. If only adult pads are available, use them — do not delay defibrillation. Place pads in anterior-posterior position to avoid overlap.</p>`
      },
      {
        order: 3,
        title: "Infant CPR (Under 1 Year)",
        content: `<h2>Infant CPR — Under 1 Year</h2>
<h3>Compression Technique</h3>
<ul>
  <li><strong>Single rescuer:</strong> Two-finger technique — place 2 fingers on the lower sternum, just below the nipple line</li>
  <li><strong>Two rescuers (healthcare providers):</strong> Two-thumb encircling technique — place both thumbs on the sternum, fingers encircling the chest. This technique generates higher coronary perfusion pressures and is preferred when possible</li>
  <li><strong>Depth:</strong> At least 4 cm (1/3 of AP chest diameter)</li>
  <li><strong>Rate:</strong> 100–120 compressions per minute</li>
</ul>
<h3>Ventilation</h3>
<ul>
  <li><strong>Without advanced airway:</strong> 30:2 (single rescuer) or 15:2 (two healthcare providers)</li>
  <li><strong>Mouth-to-mouth-and-nose:</strong> Cover both mouth and nose with your mouth for infants</li>
  <li><strong>Tidal volume:</strong> Small puffs — just enough for visible chest rise</li>
</ul>
<div class="clinical-note">
  <strong>Neonatal resuscitation:</strong> Neonates (first 28 days of life) follow the NRP (Neonatal Resuscitation Program) algorithm, which differs from infant BLS. Key differences include: initial steps (dry, stimulate, reposition), 3:1 compression-to-ventilation ratio, and use of room air (not 100% O₂) as the initial gas.
</div>`
      },
      {
        order: 4,
        title: "Special Situations: Drowning, Choking, and Pregnancy",
        content: `<h2>Special Situations in BLS</h2>
<h3>Drowning</h3>
<ul>
  <li>Remove from water as quickly as safely possible</li>
  <li>Begin rescue breaths FIRST (5 initial breaths) — hypoxia is the primary cause</li>
  <li>Do not perform abdominal thrusts to remove water — this delays CPR and risks aspiration</li>
  <li>Hypothermia is common — continue CPR even if victim appears dead</li>
  <li>"Not dead until warm and dead" — resuscitate until core temperature &gt;32°C</li>
</ul>
<h3>Choking (Foreign Body Airway Obstruction)</h3>
<table>
  <thead><tr><th>Victim</th><th>Mild obstruction</th><th>Severe obstruction (can't speak/breathe)</th></tr></thead>
  <tbody>
    <tr><td>Adult/Child</td><td>Encourage coughing</td><td>5 back blows + 5 abdominal thrusts (Heimlich)</td></tr>
    <tr><td>Infant</td><td>Encourage coughing</td><td>5 back blows + 5 chest thrusts (NOT abdominal)</td></tr>
    <tr><td>Unconscious victim</td><td>Begin CPR; look in mouth before each breath</td><td>Begin CPR; look in mouth before each breath</td></tr>
  </tbody>
</table>
<h3>Pregnancy</h3>
<ul>
  <li>Perform standard CPR — do not modify compression position</li>
  <li>Manually displace the uterus to the left (or tilt patient 15–30° left lateral) to relieve aortocaval compression</li>
  <li>Perimortem caesarean section should be considered if no ROSC after 4 minutes — delivery within 5 minutes of arrest improves maternal and foetal outcomes</li>
</ul>`
      }
    ],
    quiz: {
      title: "Check: Paediatric CPR Technique",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "Two healthcare providers are performing CPR on a 3-year-old child. What is the correct compression-to-ventilation ratio?",
          options: JSON.stringify(["30:2", "15:2", "30:1", "Continuous compressions only"]),
          correctAnswer: "15:2",
          explanation: "When two healthcare providers are present for a paediatric victim (child or infant), AHA guidelines recommend a 15:2 compression-to-ventilation ratio. This provides more frequent ventilation, reflecting the respiratory cause of most paediatric arrests. A single rescuer uses 30:2."
        },
        {
          order: 2,
          questionText: "What is the preferred chest compression technique for infant CPR when two healthcare providers are present?",
          options: JSON.stringify(["One-hand technique", "Two-finger technique", "Two-thumb encircling technique", "Heel-of-hand technique"]),
          correctAnswer: "Two-thumb encircling technique",
          explanation: "The two-thumb encircling technique (both thumbs on the sternum, fingers encircling the chest) is preferred for infant CPR when two rescuers are present. Studies show it generates higher coronary perfusion pressures and is less fatiguing than the two-finger technique."
        },
        {
          order: 3,
          questionText: "An infant is found unresponsive in a swimming pool. You pull them out of the water. What is the first action in BLS?",
          options: JSON.stringify(["Begin chest compressions immediately", "Give 5 initial rescue breaths before compressions", "Check pulse for 10 seconds", "Apply AED pads"]),
          correctAnswer: "Give 5 initial rescue breaths before compressions",
          explanation: "In drowning, hypoxia is the primary cause of cardiac arrest. AHA guidelines recommend giving 5 initial rescue breaths before beginning chest compressions in drowning victims. This differs from standard BLS where compressions are started first."
        }
      ]
    }
  },
  {
    order: 4,
    title: "Module 4: Automated External Defibrillator (AED)",
    description: "Use an AED safely and effectively to deliver defibrillation for shockable rhythms.",
    content: "This module covers AED operation, pad placement, safety, and integration with CPR.",
    duration: 20,
    sections: [
      {
        order: 1,
        title: "Overview: Why Defibrillation Matters",
        content: `<h2>Why Defibrillation Matters</h2>
<p>Ventricular fibrillation (VF) and pulseless ventricular tachycardia (pVT) are the most common initial rhythms in adult cardiac arrest. They are the only rhythms that respond to defibrillation.</p>
<div class="clinical-note">
  <strong>Time to defibrillation and survival:</strong>
  <ul>
    <li>Defibrillation within 1 minute of collapse: survival rate up to 90%</li>
    <li>Every 1-minute delay without CPR: survival drops 7–10%</li>
    <li>CPR alone cannot convert VF — only defibrillation can</li>
    <li>CPR buys time by maintaining coronary perfusion until defibrillation is available</li>
  </ul>
</div>
<p>AEDs are designed for use by untrained bystanders. They analyse the heart rhythm automatically and only deliver a shock if a shockable rhythm is detected. They cannot cause harm to a patient in a non-shockable rhythm.</p>`
      },
      {
        order: 2,
        title: "AED Operation — Step by Step",
        content: `<h2>AED Operation — Step by Step</h2>
<h3>Universal AED Algorithm</h3>
<ol>
  <li><strong>Power on:</strong> Open the lid or press the power button. Most AEDs will begin voice prompts immediately.</li>
  <li><strong>Attach pads:</strong> Apply pads to bare, dry skin. Follow the diagram on the pads for placement.</li>
  <li><strong>Analyse rhythm:</strong> Ensure no one is touching the patient. The AED will analyse automatically or prompt you to press "Analyse."</li>
  <li><strong>Deliver shock (if advised):</strong> Ensure no one is touching the patient. Press the shock button when prompted.</li>
  <li><strong>Resume CPR immediately:</strong> Begin compressions immediately after the shock — do not wait to check pulse.</li>
  <li><strong>Repeat:</strong> Follow AED prompts every 2 minutes.</li>
</ol>
<div class="warning-note">
  <strong>Safety — "Clear the patient":</strong> Before delivering a shock, loudly announce "CLEAR!" and visually confirm no one is touching the patient, the bed, or any equipment connected to the patient. Even indirect contact can transmit the shock.
</div>`
      },
      {
        order: 3,
        title: "Pad Placement and Special Situations",
        content: `<h2>AED Pad Placement and Special Situations</h2>
<h3>Standard Pad Placement — Adult</h3>
<ul>
  <li><strong>Right pad:</strong> Upper right chest, below the clavicle, to the right of the sternum</li>
  <li><strong>Left pad:</strong> Left lateral chest, below the axilla (armpit), over the left lower ribs</li>
  <li>Pads must not touch each other — maintain at least 1 inch (2.5 cm) separation</li>
</ul>
<h3>Paediatric Pad Placement</h3>
<ul>
  <li>Use paediatric pads (with dose attenuator) for children under 8 years if available</li>
  <li>If paediatric pads unavailable, use adult pads in anterior-posterior position: one pad on the chest, one on the back</li>
</ul>
<h3>Special Situations</h3>
<table>
  <thead><tr><th>Situation</th><th>Action</th></tr></thead>
  <tbody>
    <tr><td>Hairy chest</td><td>Shave or firmly press pad; if no adhesion, use second set of pads to remove hair</td></tr>
    <tr><td>Wet skin</td><td>Dry the chest before applying pads</td></tr>
    <tr><td>Implanted pacemaker/ICD</td><td>Place pad at least 1 inch away from device; do not place pad directly over device</td></tr>
    <tr><td>Medication patch (e.g., nitroglycerin)</td><td>Remove patch and wipe skin before applying pad</td></tr>
    <tr><td>Pregnancy</td><td>Standard pad placement — do not modify</td></tr>
  </tbody>
</table>`
      },
      {
        order: 4,
        title: "Integrating AED with CPR — The 2-Minute Cycle",
        content: `<h2>Integrating AED with CPR — The 2-Minute Cycle</h2>
<p>The AED and CPR work together in a structured 2-minute cycle. Understanding this cycle is essential for coordinated team resuscitation.</p>
<h3>The 2-Minute CPR-AED Cycle</h3>
<ol>
  <li><strong>Shock delivered</strong> → Immediately resume CPR (30:2 or continuous with advanced airway)</li>
  <li><strong>2 minutes of CPR</strong> → AED analyses rhythm (or manual rhythm check)</li>
  <li><strong>Shockable rhythm?</strong> → Deliver shock → Resume CPR immediately</li>
  <li><strong>Non-shockable rhythm?</strong> → Continue CPR → Check pulse if organised rhythm</li>
</ol>
<div class="clinical-note">
  <strong>Do not check pulse after shock:</strong> After delivering a shock, resume CPR immediately without checking for a pulse. Pulse checks interrupt compressions and reduce coronary perfusion pressure. The AED will prompt a rhythm check after 2 minutes.
</div>
<h3>Rhythm Check Pause</h3>
<p>During the rhythm check pause (every 2 minutes), use the time to:</p>
<ul>
  <li>Switch compressors</li>
  <li>Check airway and ventilation</li>
  <li>Reassess IV/IO access</li>
  <li>Administer medications if indicated</li>
</ul>
<p>The entire pause should be less than 10 seconds.</p>`
      }
    ],
    quiz: {
      title: "Check: AED Use",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "An AED has analysed the rhythm and advises a shock. What is the correct sequence of actions?",
          options: JSON.stringify(["Deliver shock, then check pulse for 10 seconds, then resume CPR", "Announce 'CLEAR!', visually confirm no contact, deliver shock, immediately resume CPR", "Stop CPR, deliver shock, wait for AED to reanalyse, then resume CPR", "Deliver shock, check breathing, then resume CPR if no breathing"]),
          correctAnswer: "Announce 'CLEAR!', visually confirm no contact, deliver shock, immediately resume CPR",
          explanation: "Before delivering a shock, announce 'CLEAR!' and visually confirm no one is touching the patient. After the shock, immediately resume CPR — do not check for a pulse. The AED will prompt the next rhythm check after 2 minutes."
        },
        {
          order: 2,
          questionText: "You are applying AED pads to a child aged 5 years. Paediatric pads are not available. What should you do?",
          options: JSON.stringify(["Do not use the AED — it is not safe for children under 8", "Use adult pads in anterior-posterior position (one on chest, one on back)", "Use adult pads in standard position and proceed", "Wait for paediatric pads before using the AED"]),
          correctAnswer: "Use adult pads in anterior-posterior position (one on chest, one on back)",
          explanation: "If paediatric pads are unavailable, use adult pads in anterior-posterior position for children under 8 years. This prevents pad overlap. Do not delay defibrillation — the benefit of early defibrillation outweighs the theoretical risk of using adult pads."
        },
        {
          order: 3,
          questionText: "A patient has an implanted pacemaker visible under the skin of the right upper chest. Where should you place the right AED pad?",
          options: JSON.stringify(["Directly over the pacemaker for best contact", "At least 1 inch away from the pacemaker", "On the left side only — do not use right pad", "On the abdomen instead"]),
          correctAnswer: "At least 1 inch away from the pacemaker",
          explanation: "AED pads should be placed at least 1 inch (2.5 cm) away from implanted devices (pacemakers, ICDs). Placing a pad directly over a device can damage the device and reduce shock effectiveness. If the standard right pad position is over the device, move the pad slightly lower or to the left."
        }
      ]
    }
  },
  {
    order: 5,
    title: "Module 5: Post-Resuscitation Care and Team Dynamics",
    description: "Manage the post-cardiac arrest period and apply effective team communication during resuscitation.",
    content: "This module covers post-ROSC care priorities, team roles, closed-loop communication, and debriefing.",
    duration: 20,
    sections: [
      {
        order: 1,
        title: "Return of Spontaneous Circulation (ROSC) — Immediate Priorities",
        content: `<h2>Return of Spontaneous Circulation (ROSC) — Immediate Priorities</h2>
<p>ROSC is defined as the restoration of a palpable pulse and measurable blood pressure. It is not the end of resuscitation — it is the beginning of post-cardiac arrest care.</p>
<div class="clinical-note">
  <strong>Immediate post-ROSC priorities (H's and T's addressed):</strong>
  <ol>
    <li><strong>Airway:</strong> Secure airway if not already done; confirm ETT position</li>
    <li><strong>Breathing:</strong> Target SpO₂ 94–98%; avoid hyperoxia (FiO₂ 100% initially, then titrate down)</li>
    <li><strong>Circulation:</strong> Target MAP ≥65 mmHg; 12-lead ECG immediately; treat hypotension</li>
    <li><strong>Disability:</strong> Assess neurological status; consider targeted temperature management (TTM)</li>
    <li><strong>Exposure:</strong> Identify and treat reversible causes</li>
  </ol>
</div>
<h3>Targeted Temperature Management (TTM)</h3>
<p>For comatose survivors of cardiac arrest, TTM at 32–36°C for 24 hours is recommended to reduce neurological injury. Active cooling should begin as soon as possible after ROSC.</p>`
      },
      {
        order: 2,
        title: "Reversible Causes — The H's and T's",
        content: `<h2>Reversible Causes of Cardiac Arrest — The H's and T's</h2>
<p>Every cardiac arrest should prompt a systematic search for reversible causes. The H's and T's is a mnemonic used in both BLS and ACLS.</p>
<table>
  <thead><tr><th>H's</th><th>T's</th></tr></thead>
  <tbody>
    <tr><td>Hypovolaemia</td><td>Tension pneumothorax</td></tr>
    <tr><td>Hypoxia</td><td>Tamponade (cardiac)</td></tr>
    <tr><td>Hydrogen ion (acidosis)</td><td>Toxins (overdose)</td></tr>
    <tr><td>Hypo/Hyperkalaemia</td><td>Thrombosis (pulmonary — PE)</td></tr>
    <tr><td>Hypothermia</td><td>Thrombosis (coronary — MI)</td></tr>
  </tbody>
</table>
<div class="clinical-note">
  <strong>In paediatric arrest, the most common reversible causes are:</strong>
  <ul>
    <li>Hypoxia (respiratory failure)</li>
    <li>Hypovolaemia (sepsis, haemorrhage, dehydration)</li>
    <li>Tension pneumothorax (trauma, ventilated patients)</li>
    <li>Toxins (accidental ingestion)</li>
  </ul>
</div>`
      },
      {
        order: 3,
        title: "Team Roles and Closed-Loop Communication",
        content: `<h2>Team Roles and Closed-Loop Communication</h2>
<p>Effective resuscitation requires a well-coordinated team. Poor communication is a leading cause of preventable errors during cardiac arrest.</p>
<h3>Team Roles</h3>
<table>
  <thead><tr><th>Role</th><th>Responsibilities</th></tr></thead>
  <tbody>
    <tr><td>Team Leader</td><td>Directs the resuscitation; assigns tasks; monitors quality; makes decisions; communicates with family</td></tr>
    <tr><td>Compressor</td><td>Performs chest compressions; rotates every 2 minutes</td></tr>
    <tr><td>Airway Manager</td><td>Manages airway and ventilation; monitors ETT position and SpO₂</td></tr>
    <tr><td>IV/IO Access</td><td>Establishes vascular access; prepares and administers medications</td></tr>
    <tr><td>Recorder</td><td>Documents timeline, medications, interventions; tracks time since last shock/medication</td></tr>
    <tr><td>Monitor/Defibrillator</td><td>Operates AED or manual defibrillator; announces rhythm; charges for shock</td></tr>
  </tbody>
</table>
<h3>Closed-Loop Communication</h3>
<ol>
  <li><strong>Sender:</strong> "John, give 1 mg of adrenaline IV now."</li>
  <li><strong>Receiver:</strong> "1 mg adrenaline IV — giving now."</li>
  <li><strong>Sender confirms:</strong> "Thank you."</li>
</ol>
<div class="warning-note">
  <strong>Why closed-loop communication matters:</strong> In a noisy, high-stress resuscitation environment, orders can be misheard, misunderstood, or forgotten. Closed-loop communication ensures every order is acknowledged and confirmed, reducing medication errors and missed interventions.
</div>`
      },
      {
        order: 4,
        title: "Debriefing and Emotional Support After Resuscitation",
        content: `<h2>Debriefing and Emotional Support After Resuscitation</h2>
<p>Resuscitation events are emotionally and physically demanding. Structured debriefing improves team performance and supports provider wellbeing.</p>
<h3>Hot Debriefing (Immediate — within 1 hour)</h3>
<ul>
  <li>Brief (5–10 minutes), immediately after the event</li>
  <li>Focus on what went well and what to improve</li>
  <li>Not a blame session — focus on systems and processes</li>
  <li>Acknowledge emotional impact</li>
</ul>
<h3>Cold Debriefing (Formal — within 24–48 hours)</h3>
<ul>
  <li>Structured review of the resuscitation timeline</li>
  <li>Review CPR quality data if available (e.g., from defibrillator)</li>
  <li>Identify system-level improvements</li>
  <li>Provide psychological first aid to team members</li>
</ul>
<div class="clinical-note">
  <strong>When resuscitation is unsuccessful:</strong> Providers may experience grief, guilt, and burnout. Normalise these responses. Ensure access to peer support, chaplaincy, or occupational health services. A provider who is not supported cannot provide safe care to the next patient.
</div>
<h3>Communicating with Families</h3>
<p>After a resuscitation attempt, a senior team member should speak with the family as soon as possible. Use clear, direct language. Avoid euphemisms. Provide space for questions and emotional response. Offer chaplaincy and bereavement support.</p>`
      }
    ],
    quiz: {
      title: "Check: Post-Resuscitation Care and Team Dynamics",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "After ROSC, what is the target SpO₂ range for post-cardiac arrest care?",
          options: JSON.stringify(["88–92%", "94–98%", "99–100%", "SpO₂ is not monitored post-ROSC"]),
          correctAnswer: "94–98%",
          explanation: "Post-ROSC, target SpO₂ 94–98%. Avoid hyperoxia (SpO₂ 100%) — excessive oxygen causes free radical injury to the reperfused myocardium and brain. Also avoid hypoxia (SpO₂ <94%). Begin with 100% FiO₂ and titrate down once SpO₂ is stable."
        },
        {
          order: 2,
          questionText: "Which of the following is a reversible cause of cardiac arrest represented by the 'T's'?",
          options: JSON.stringify(["Hypothermia", "Hypoxia", "Tension pneumothorax", "Hypovolaemia"]),
          correctAnswer: "Tension pneumothorax",
          explanation: "The T's include: Tension pneumothorax, Tamponade (cardiac), Toxins, Thrombosis (PE), and Thrombosis (coronary). Hypothermia, Hypoxia, and Hypovolaemia are all H's."
        },
        {
          order: 3,
          questionText: "The team leader says: 'Give 1 mg adrenaline IV now.' What is the correct response from the nurse receiving the order?",
          options: JSON.stringify(["Immediately administer the drug without verbal acknowledgement", "'1 mg adrenaline IV — giving now' then confirm when given", "Ask the team leader to repeat the order twice", "Write it down first, then administer"]),
          correctAnswer: "'1 mg adrenaline IV — giving now' then confirm when given",
          explanation: "Closed-loop communication requires the receiver to repeat back the order, confirm they are acting on it, and confirm when it is completed. This prevents medication errors and ensures the team leader knows the order has been received and executed."
        }
      ]
    }
  }
];

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log(`Seeding BLS course (ID: ${BLS_COURSE_ID})...`);
  
  // Clear existing modules for BLS
  const [existingMods] = await conn.execute(
    `SELECT id FROM modules WHERE courseId = ?`, [BLS_COURSE_ID]
  );
  for (const mod of existingMods as any[]) {
    await conn.execute(`DELETE FROM quizQuestions WHERE quizId IN (SELECT id FROM quizzes WHERE moduleId = ?)`, [mod.id]);
    await conn.execute(`DELETE FROM quizzes WHERE moduleId = ?`, [mod.id]);
    await conn.execute(`DELETE FROM moduleSections WHERE moduleId = ?`, [mod.id]);
  }
  await conn.execute(`DELETE FROM modules WHERE courseId = ?`, [BLS_COURSE_ID]);
  
  for (const mod of modules) {
    // Insert module
    const [modResult] = await conn.execute(
      `INSERT INTO modules (courseId, title, description, content, duration, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [BLS_COURSE_ID, mod.title, mod.description, mod.content, mod.duration, mod.order]
    );
    const moduleId = (modResult as any).insertId;
    
    // Insert sections
    for (const section of mod.sections) {
      await conn.execute(
        `INSERT INTO moduleSections (moduleId, title, content, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [moduleId, section.title, section.content, section.order]
      );
    }
    
    // Insert quiz
    const [quizResult] = await conn.execute(
      `INSERT INTO quizzes (moduleId, title, description, passingScore, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
      [moduleId, mod.quiz.title, mod.quiz.title, mod.quiz.passingScore]
    );
    const quizId = (quizResult as any).insertId;
    
    // Insert questions
    for (const q of mod.quiz.questions) {
      await conn.execute(
        `INSERT INTO quizQuestions (quizId, question, options, correctAnswer, explanation, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [quizId, q.questionText, q.options, q.correctAnswer, q.explanation, q.order]
      );
    }
    
    console.log(`  ✓ Module ${mod.order}: ${mod.title} (${mod.sections.length} sections, ${mod.quiz.questions.length} quiz questions)`);
  }
  
  console.log(`\nBLS seeding complete: ${modules.length} modules, ${modules.reduce((a, m) => a + m.sections.length, 0)} sections, ${modules.reduce((a, m) => a + m.quiz.questions.length, 0)} quiz questions`);
  
  await conn.end();
}

main().catch(console.error);
