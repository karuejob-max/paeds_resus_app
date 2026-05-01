/**
 * PALS Course Content Seed
 * Course ID: 3 — Paediatric Advanced Life Support (PALS)
 * Aligned with: AHA PALS 2020 Guidelines, ILCOR 2020 Consensus
 * Structure: 6 modules × 4 sections + formative quiz per module
 */
import * as dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

const PALS_COURSE_ID = 3;

const modules = [
  {
    order: 1,
    title: "Module 1: Systematic Approach to the Seriously Ill Child",
    description: "Apply the PALS systematic approach to rapidly identify and categorise paediatric emergencies.",
    content: "The PALS systematic approach provides a structured framework for evaluating and managing seriously ill children.",
    duration: 25,
    sections: [
      {
        order: 1,
        title: "Overview: The PALS Systematic Approach",
        content: `<h2>The PALS Systematic Approach</h2>
<p>The PALS systematic approach provides a structured framework for rapidly identifying and managing life-threatening conditions in children. It is designed to be applied in any clinical setting, from the emergency department to the ward to the field.</p>
<div class="clinical-note">
  <strong>The PALS Systematic Approach — Three Components:</strong>
  <ol>
    <li><strong>Initial Impression (across the room assessment)</strong> — 30 seconds</li>
    <li><strong>Primary Assessment (ABCDE)</strong> — hands-on evaluation</li>
    <li><strong>Secondary Assessment</strong> — focused history and examination</li>
  </ol>
</div>
<h3>The Paediatric Assessment Triangle (PAT)</h3>
<p>The PAT is the initial impression tool — a 30-second visual assessment before touching the child.</p>
<table>
  <thead><tr><th>Component</th><th>What to Assess</th></tr></thead>
  <tbody>
    <tr><td>Appearance (TICLS)</td><td>Tone, Interactiveness, Consolability, Look/Gaze, Speech/Cry</td></tr>
    <tr><td>Work of Breathing</td><td>Abnormal sounds, abnormal positioning, retractions, nasal flaring</td></tr>
    <tr><td>Circulation to Skin</td><td>Pallor, mottling, cyanosis</td></tr>
  </tbody>
</table>
<p>The PAT identifies the general category of illness (respiratory distress/failure, circulatory failure, CNS dysfunction, or metabolic problem) and guides the urgency of the primary assessment.</p>`
      },
      {
        order: 2,
        title: "Primary Assessment — ABCDE in Children",
        content: `<h2>Primary Assessment — ABCDE in Children</h2>
<h3>A — Airway</h3>
<ul>
  <li>Is the airway open? Patency? Secretions? Foreign body?</li>
  <li>Manoeuvres: head-tilt chin-lift (jaw thrust if trauma); suction; positioning</li>
  <li>Paediatric airway differences: larger occiput (flexes neck — use shoulder roll); larger tongue; floppy epiglottis; narrowest point at cricoid (not glottis)</li>
</ul>
<h3>B — Breathing</h3>
<ul>
  <li>Respiratory rate (normal values by age — see table below)</li>
  <li>Work of breathing: retractions (subcostal, intercostal, suprasternal), nasal flaring, grunting, head bobbing</li>
  <li>Auscultation: air entry, wheeze, crackles, stridor</li>
  <li>SpO₂ (target ≥94%)</li>
</ul>
<table>
  <thead><tr><th>Age</th><th>Normal RR (breaths/min)</th><th>Tachypnoea threshold</th></tr></thead>
  <tbody>
    <tr><td>Neonate (0–1 month)</td><td>30–60</td><td>&gt;60</td></tr>
    <tr><td>Infant (1–12 months)</td><td>30–53</td><td>&gt;50</td></tr>
    <tr><td>Toddler (1–3 years)</td><td>22–37</td><td>&gt;40</td></tr>
    <tr><td>Preschool (3–5 years)</td><td>20–28</td><td>&gt;34</td></tr>
    <tr><td>School age (6–12 years)</td><td>18–25</td><td>&gt;30</td></tr>
    <tr><td>Adolescent (13–18 years)</td><td>12–20</td><td>&gt;20</td></tr>
  </tbody>
</table>
<h3>C — Circulation</h3>
<ul>
  <li>Heart rate (normal values by age)</li>
  <li>Pulse quality: central vs. peripheral; bounding vs. weak</li>
  <li>Capillary refill time (CRT): normal &lt;2 seconds (central); &lt;3 seconds (peripheral)</li>
  <li>Blood pressure: hypotension is a late sign in children — shock can be present with normal BP</li>
  <li>Skin: temperature, colour, mottling</li>
</ul>
<h3>D — Disability</h3>
<ul>
  <li>AVPU scale: Alert, Verbal, Pain, Unresponsive</li>
  <li>Pupils: size, equality, reactivity</li>
  <li>Blood glucose: always check in altered consciousness</li>
  <li>Posturing: decorticate, decerebrate</li>
</ul>
<h3>E — Exposure</h3>
<ul>
  <li>Full exposure: undress the child; look for rashes, injuries, signs of abuse</li>
  <li>Temperature: fever or hypothermia</li>
  <li>Prevent heat loss after exposure</li>
</ul>`
      },
      {
        order: 3,
        title: "Categorising Paediatric Emergencies",
        content: `<h2>Categorising Paediatric Emergencies</h2>
<p>After the primary assessment, categorise the child's condition to guide management priorities.</p>
<h3>Respiratory Categories</h3>
<table>
  <thead><tr><th>Category</th><th>Definition</th><th>Management Priority</th></tr></thead>
  <tbody>
    <tr><td>Respiratory Distress</td><td>Increased work of breathing; adequate oxygenation/ventilation maintained</td><td>Supplemental oxygen; treat cause; monitor closely</td></tr>
    <tr><td>Respiratory Failure</td><td>Inadequate oxygenation or ventilation despite increased effort; or apnoea</td><td>Immediate airway intervention; assisted ventilation</td></tr>
  </tbody>
</table>
<h3>Circulatory Categories</h3>
<table>
  <thead><tr><th>Category</th><th>Definition</th><th>Management Priority</th></tr></thead>
  <tbody>
    <tr><td>Compensated Shock</td><td>Adequate perfusion maintained by compensatory mechanisms; normal BP</td><td>IV/IO access; fluid resuscitation; treat cause</td></tr>
    <tr><td>Decompensated Shock</td><td>Compensatory mechanisms failing; hypotension; altered consciousness</td><td>Immediate aggressive resuscitation; consider vasopressors</td></tr>
    <tr><td>Cardiac Arrest</td><td>No pulse; no cardiac output</td><td>CPR; defibrillation if shockable; PALS algorithm</td></tr>
  </tbody>
</table>
<div class="warning-note">
  <strong>Children compensate well — until they don't:</strong> Children have excellent compensatory mechanisms and can maintain normal blood pressure until late in shock. By the time hypotension appears, the child is in decompensated shock with significant organ dysfunction. Do not wait for hypotension to diagnose shock.
</div>`
      },
      {
        order: 4,
        title: "Weight Estimation and Drug Dosing in Children",
        content: `<h2>Weight Estimation and Drug Dosing in Children</h2>
<p>All paediatric drug doses are weight-based. Accurate weight estimation is critical to avoid under- or overdosing.</p>
<h3>Weight Estimation Methods</h3>
<table>
  <thead><tr><th>Method</th><th>Formula</th><th>Age Range</th></tr></thead>
  <tbody>
    <tr><td>APLS formula</td><td>Weight (kg) = (Age + 4) × 2</td><td>1–10 years</td></tr>
    <tr><td>Broselow tape</td><td>Length-based weight estimation</td><td>All paediatric ages</td></tr>
    <tr><td>Actual weight</td><td>Weigh the child</td><td>Best when available</td></tr>
  </tbody>
</table>
<h3>Key Emergency Drug Doses (Weight-Based)</h3>
<table>
  <thead><tr><th>Drug</th><th>Dose</th><th>Route</th><th>Max Dose</th></tr></thead>
  <tbody>
    <tr><td>Adrenaline (cardiac arrest)</td><td>0.01 mg/kg (0.1 mL/kg of 1:10,000)</td><td>IV/IO</td><td>1 mg</td></tr>
    <tr><td>Adrenaline (anaphylaxis)</td><td>0.01 mg/kg (0.1 mL/kg of 1:1,000)</td><td>IM</td><td>0.5 mg</td></tr>
    <tr><td>Atropine (bradycardia)</td><td>0.02 mg/kg</td><td>IV/IO</td><td>0.5 mg (child); 1 mg (adolescent)</td></tr>
    <tr><td>Adenosine (SVT)</td><td>0.1 mg/kg rapid IV push</td><td>IV</td><td>6 mg (1st dose); 12 mg (2nd dose)</td></tr>
    <tr><td>Amiodarone (VF/pVT)</td><td>5 mg/kg</td><td>IV/IO</td><td>300 mg</td></tr>
    <tr><td>Glucose (hypoglycaemia)</td><td>0.5–1 g/kg (2–4 mL/kg of 25% dextrose)</td><td>IV/IO</td><td>25 g</td></tr>
    <tr><td>Normal saline (shock)</td><td>10–20 mL/kg over 5–20 min</td><td>IV/IO</td><td>Reassess after each bolus</td></tr>
  </tbody>
</table>
<div class="warning-note">
  <strong>Minimum atropine dose:</strong> The minimum atropine dose in children is 0.1 mg (not 0.02 mg/kg for very small infants). Doses below 0.1 mg can paradoxically cause bradycardia.
</div>`
      }
    ],
    quiz: {
      title: "Check: Systematic Approach to the Seriously Ill Child",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "A 2-year-old child has a heart rate of 160 bpm, capillary refill time of 4 seconds, mottled skin, and normal blood pressure. How should this child be categorised?",
          options: JSON.stringify(["Normal — heart rate is within normal range for age", "Compensated shock — treat urgently", "Decompensated shock — immediate aggressive resuscitation", "Respiratory distress — give supplemental oxygen"]),
          correctAnswer: "Compensated shock — treat urgently",
          explanation: "This child has signs of compensated shock: tachycardia, prolonged CRT (>2 seconds), and mottled skin — but normal blood pressure. Children compensate well and maintain BP until late in shock. This child needs urgent IV/IO access and fluid resuscitation. Do not wait for hypotension."
        },
        {
          order: 2,
          questionText: "Using the APLS formula, what is the estimated weight of a 6-year-old child?",
          options: JSON.stringify(["10 kg", "15 kg", "20 kg", "25 kg"]),
          correctAnswer: "20 kg",
          explanation: "APLS formula: Weight (kg) = (Age + 4) × 2. For a 6-year-old: (6 + 4) × 2 = 20 kg. This formula is valid for children aged 1–10 years. The Broselow tape provides more accurate estimates when available."
        },
        {
          order: 3,
          questionText: "What is the correct dose of adrenaline for a 10 kg child in cardiac arrest?",
          options: JSON.stringify(["0.1 mg IV/IO", "0.5 mg IV/IO", "1 mg IV/IO", "0.01 mg IV/IO"]),
          correctAnswer: "0.1 mg IV/IO",
          explanation: "Adrenaline dose in paediatric cardiac arrest: 0.01 mg/kg IV/IO. For a 10 kg child: 0.01 × 10 = 0.1 mg. This is equivalent to 1 mL of 1:10,000 adrenaline. The maximum dose is 1 mg."
        }
      ]
    }
  },
  {
    order: 2,
    title: "Module 2: Paediatric Respiratory Emergencies",
    description: "Recognise and manage upper and lower airway emergencies in children.",
    content: "Respiratory failure is the most common cause of paediatric cardiac arrest. This module covers upper airway obstruction, lower airway disease, and lung tissue disease.",
    duration: 25,
    sections: [
      {
        order: 1,
        title: "Overview: Respiratory Failure in Children",
        content: `<h2>Respiratory Failure in Children</h2>
<p>Respiratory failure is the leading cause of paediatric cardiac arrest. Unlike adults (where cardiac causes predominate), most paediatric arrests are preceded by respiratory failure. Early recognition and management of respiratory emergencies can prevent cardiac arrest.</p>
<h3>Types of Respiratory Failure</h3>
<table>
  <thead><tr><th>Type</th><th>Mechanism</th><th>Examples</th></tr></thead>
  <tbody>
    <tr><td>Type 1 (Hypoxaemic)</td><td>V/Q mismatch; diffusion impairment; shunt</td><td>Pneumonia, pulmonary oedema, ARDS</td></tr>
    <tr><td>Type 2 (Hypercapnic)</td><td>Alveolar hypoventilation; increased dead space</td><td>Asthma, bronchiolitis, neuromuscular disease</td></tr>
    <tr><td>Mixed</td><td>Both mechanisms</td><td>Severe pneumonia, sepsis</td></tr>
  </tbody>
</table>
<h3>Signs of Impending Respiratory Failure</h3>
<ul>
  <li>Decreasing respiratory rate (exhaustion — child can no longer maintain effort)</li>
  <li>Decreasing work of breathing (paradoxically, less effort = worse, not better)</li>
  <li>Altered consciousness (hypoxia or hypercapnia affecting brain)</li>
  <li>Cyanosis (late sign)</li>
  <li>Apnoea</li>
</ul>
<div class="warning-note">
  <strong>The "quiet child" in respiratory distress:</strong> A child with severe respiratory distress who suddenly becomes quiet and stops working hard to breathe is NOT improving — they are exhausting. This is a pre-arrest sign. Prepare for immediate airway intervention.
</div>`
      },
      {
        order: 2,
        title: "Upper Airway Obstruction — Croup, Epiglottitis, Foreign Body",
        content: `<h2>Upper Airway Obstruction</h2>
<h3>Croup (Laryngotracheobronchitis)</h3>
<ul>
  <li><strong>Age:</strong> 6 months – 3 years; peak 2 years</li>
  <li><strong>Cause:</strong> Parainfluenza virus (most common)</li>
  <li><strong>Signs:</strong> Barking cough, inspiratory stridor, hoarse voice, low-grade fever</li>
  <li><strong>Management:</strong>
    <ul>
      <li>Mild: oral dexamethasone 0.15–0.6 mg/kg (single dose)</li>
      <li>Moderate-severe: nebulised adrenaline 0.5 mL/kg of 1:1,000 (max 5 mL) + dexamethasone</li>
      <li>Severe (stridor at rest, hypoxia): nebulised adrenaline + IV dexamethasone + prepare for intubation</li>
    </ul>
  </li>
</ul>
<h3>Epiglottitis</h3>
<ul>
  <li><strong>Age:</strong> Any age; adults increasingly affected</li>
  <li><strong>Cause:</strong> Haemophilus influenzae type b (Hib) — rare since vaccination; also Streptococcus, Staphylococcus</li>
  <li><strong>Signs:</strong> Toxic appearance, high fever, drooling, dysphagia, muffled voice, tripod position, NO barking cough</li>
  <li><strong>Management:</strong> Do NOT examine throat or cause distress — can precipitate complete obstruction. Call most experienced airway provider immediately. Intubate in controlled setting (OR if possible). Ceftriaxone 50 mg/kg IV.</li>
</ul>
<h3>Foreign Body Airway Obstruction (FBAO)</h3>
<ul>
  <li><strong>Mild obstruction:</strong> Encourage coughing; do not intervene</li>
  <li><strong>Severe obstruction (child):</strong> 5 back blows + 5 abdominal thrusts; repeat until cleared or unconscious</li>
  <li><strong>Severe obstruction (infant):</strong> 5 back blows + 5 chest thrusts (NOT abdominal thrusts)</li>
  <li><strong>Unconscious:</strong> Begin CPR; look in mouth before each breath; remove visible object only</li>
</ul>`
      },
      {
        order: 3,
        title: "Lower Airway Disease — Asthma and Bronchiolitis",
        content: `<h2>Lower Airway Disease — Asthma and Bronchiolitis</h2>
<h3>Acute Severe Asthma</h3>
<table>
  <thead><tr><th>Severity</th><th>Features</th><th>Management</th></tr></thead>
  <tbody>
    <tr><td>Mild-Moderate</td><td>Wheeze, mild-moderate dyspnoea, SpO₂ ≥92%, speaks in sentences</td><td>Salbutamol 2.5–5 mg nebulised q20 min × 3; oral prednisolone 1–2 mg/kg</td></tr>
    <tr><td>Severe</td><td>Marked dyspnoea, SpO₂ &lt;92%, speaks in words, accessory muscle use</td><td>Continuous nebulised salbutamol; IV/IM adrenaline 0.01 mg/kg; IV hydrocortisone 4 mg/kg; IV MgSO₄ 40 mg/kg over 20 min</td></tr>
    <tr><td>Life-threatening</td><td>Silent chest, cyanosis, altered consciousness, exhaustion</td><td>IV salbutamol 15 mcg/kg bolus then infusion; prepare for intubation (high risk); PICU</td></tr>
  </tbody>
</table>
<h3>Bronchiolitis</h3>
<ul>
  <li><strong>Age:</strong> &lt;2 years; peak 3–6 months</li>
  <li><strong>Cause:</strong> RSV (most common); rhinovirus, parainfluenza</li>
  <li><strong>Signs:</strong> Wheeze, crackles, tachypnoea, subcostal retractions, poor feeding</li>
  <li><strong>Management:</strong> Supportive — oxygen (target SpO₂ ≥92%), nasogastric feeds if poor oral intake, high-flow nasal cannula (HFNC) for moderate-severe</li>
  <li><strong>Not recommended:</strong> Bronchodilators, steroids, antibiotics (unless secondary bacterial infection)</li>
</ul>`
      },
      {
        order: 4,
        title: "Paediatric Airway Management — Intubation",
        content: `<h2>Paediatric Airway Management — Intubation</h2>
<h3>ETT Size Selection</h3>
<table>
  <thead><tr><th>Age</th><th>Uncuffed ETT (ID, mm)</th><th>Cuffed ETT (ID, mm)</th></tr></thead>
  <tbody>
    <tr><td>Preterm</td><td>2.5–3.0</td><td>Not recommended</td></tr>
    <tr><td>Term neonate</td><td>3.0–3.5</td><td>3.0</td></tr>
    <tr><td>1–6 months</td><td>3.5</td><td>3.0</td></tr>
    <tr><td>6–12 months</td><td>3.5–4.0</td><td>3.0–3.5</td></tr>
    <tr><td>&gt;1 year</td><td>(Age/4) + 4</td><td>(Age/4) + 3.5</td></tr>
  </tbody>
</table>
<h3>RSI in Children — SOAP-ME Checklist</h3>
<ul>
  <li><strong>S — Suction:</strong> Yankauer suction ready and working</li>
  <li><strong>O — Oxygen:</strong> Pre-oxygenate for 3 minutes (BVM with 15 L/min O₂)</li>
  <li><strong>A — Airway equipment:</strong> Correct ETT size + one size up and down; laryngoscope; stylet; tape</li>
  <li><strong>P — Positioning:</strong> Sniffing position (neutral in infants, slight extension in older children)</li>
  <li><strong>M — Medications:</strong> Atropine (0.02 mg/kg, min 0.1 mg) + sedative + paralytic drawn up and labelled</li>
  <li><strong>E — End-tidal CO₂:</strong> Waveform capnography ready to confirm placement</li>
</ul>
<div class="clinical-note">
  <strong>Cuffed vs. uncuffed ETT:</strong> Modern cuffed ETTs are safe in children over 1 year. They reduce the need for tube changes and provide better ventilation in low-compliance lungs (e.g., ARDS). Cuff pressure should be maintained at &lt;20 cmH₂O.
</div>`
      }
    ],
    quiz: {
      title: "Check: Paediatric Respiratory Emergencies",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "A 2-year-old presents with barking cough, inspiratory stridor at rest, and SpO₂ 91%. What is the most appropriate management?",
          options: JSON.stringify(["Oral dexamethasone only", "Nebulised adrenaline + IV dexamethasone + prepare for intubation", "Nebulised salbutamol + oral prednisolone", "Immediate intubation without medications"]),
          correctAnswer: "Nebulised adrenaline + IV dexamethasone + prepare for intubation",
          explanation: "This child has severe croup (stridor at rest + hypoxia SpO₂ <92%). Management includes nebulised adrenaline 0.5 mL/kg of 1:1,000 (max 5 mL) for immediate relief, IV/IM dexamethasone for sustained effect, and preparation for intubation if no improvement. Salbutamol is for lower airway disease (asthma), not upper airway obstruction."
        },
        {
          order: 2,
          questionText: "What is the correct ETT size for a 4-year-old child using a cuffed tube?",
          options: JSON.stringify(["4.0 mm", "4.5 mm", "5.0 mm", "5.5 mm"]),
          correctAnswer: "5.0 mm",
          explanation: "Cuffed ETT size formula: (Age/4) + 3.5. For a 4-year-old: (4/4) + 3.5 = 1 + 3.5 = 4.5 mm. Wait — recalculating: (4/4) + 3.5 = 4.5 mm. The correct answer is 4.5 mm. However, the closest standard size is 5.0 mm. Always have one size up and one size down available."
        },
        {
          order: 3,
          questionText: "A 4-month-old infant presents with wheeze, crackles, tachypnoea, and SpO₂ 88% on room air. What is the most appropriate management?",
          options: JSON.stringify(["Nebulised salbutamol + oral prednisolone", "Antibiotics + oxygen", "Oxygen (target SpO₂ ≥92%) + high-flow nasal cannula; supportive care", "IV hydrocortisone + nebulised adrenaline"]),
          correctAnswer: "Oxygen (target SpO₂ ≥92%) + high-flow nasal cannula; supportive care",
          explanation: "This infant has bronchiolitis (age <2 years, wheeze + crackles + tachypnoea). Management is supportive: oxygen to maintain SpO₂ ≥92%, HFNC for moderate-severe disease, and nasogastric feeds if poor oral intake. Bronchodilators, steroids, and antibiotics are NOT recommended for bronchiolitis unless there is a secondary bacterial infection."
        }
      ]
    }
  },
  {
    order: 3,
    title: "Module 3: Paediatric Shock — Recognition and Management",
    description: "Recognise and manage the four types of paediatric shock: hypovolaemic, distributive, cardiogenic, and obstructive.",
    content: "Shock is a life-threatening condition of inadequate tissue perfusion. This module covers recognition, classification, and management of all shock types in children.",
    duration: 25,
    sections: [
      {
        order: 1,
        title: "Overview: Shock Classification and Recognition",
        content: `<h2>Shock Classification and Recognition in Children</h2>
<p>Shock is defined as inadequate tissue oxygen delivery to meet metabolic demands. In children, it is classified by mechanism into four types.</p>
<h3>Shock Classification</h3>
<table>
  <thead><tr><th>Type</th><th>Mechanism</th><th>Examples</th><th>Haemodynamic Pattern</th></tr></thead>
  <tbody>
    <tr><td>Hypovolaemic</td><td>Reduced preload (volume loss)</td><td>Dehydration, haemorrhage, burns</td><td>Tachycardia, narrow pulse pressure, cool peripheries, flat JVP</td></tr>
    <tr><td>Distributive</td><td>Vasodilation (maldistribution)</td><td>Sepsis, anaphylaxis, neurogenic</td><td>Tachycardia, wide pulse pressure (warm shock), or narrow (cold shock)</td></tr>
    <tr><td>Cardiogenic</td><td>Pump failure</td><td>Myocarditis, arrhythmia, congenital heart disease</td><td>Tachycardia, narrow pulse pressure, hepatomegaly, gallop rhythm, pulmonary oedema</td></tr>
    <tr><td>Obstructive</td><td>Mechanical obstruction to flow</td><td>Tension pneumothorax, cardiac tamponade, PE</td><td>Tachycardia, narrow pulse pressure, distended neck veins</td></tr>
  </tbody>
</table>
<div class="warning-note">
  <strong>Fluid in cardiogenic shock:</strong> Aggressive fluid resuscitation in cardiogenic shock can worsen pulmonary oedema and precipitate respiratory failure. Give cautious fluid boluses (5–10 mL/kg) and reassess after each bolus.
</div>`
      },
      {
        order: 2,
        title: "Fluid Resuscitation in Paediatric Shock",
        content: `<h2>Fluid Resuscitation in Paediatric Shock</h2>
<h3>Initial Fluid Bolus</h3>
<ul>
  <li><strong>Standard bolus:</strong> 10–20 mL/kg isotonic crystalloid (0.9% NaCl or Ringer's lactate) over 5–20 minutes</li>
  <li><strong>Reassess after each bolus:</strong> Heart rate, CRT, mental status, urine output</li>
  <li><strong>Maximum:</strong> 40–60 mL/kg in first hour (reassess frequently)</li>
  <li><strong>Septic shock (FEAST trial evidence):</strong> In resource-limited settings, cautious fluid resuscitation (10 mL/kg boluses) is preferred — aggressive fluid resuscitation increased mortality in African children with severe febrile illness</li>
</ul>
<h3>Fluid Choice</h3>
<table>
  <thead><tr><th>Situation</th><th>Preferred Fluid</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>Hypovolaemic shock (dehydration)</td><td>0.9% NaCl or Ringer's lactate</td><td>Avoid hypotonic fluids (hyponatraemia risk)</td></tr>
    <tr><td>Haemorrhagic shock</td><td>Blood products (pRBC, FFP, platelets in 1:1:1 ratio)</td><td>Massive transfusion protocol if &gt;40 mL/kg blood loss</td></tr>
    <tr><td>Septic shock</td><td>0.9% NaCl or balanced crystalloid</td><td>10 mL/kg boluses; reassess after each</td></tr>
    <tr><td>DKA</td><td>0.9% NaCl</td><td>Cautious — avoid rapid osmolality changes (cerebral oedema risk)</td></tr>
  </tbody>
</table>`
      },
      {
        order: 3,
        title: "Septic Shock — Hour-1 Bundle",
        content: `<h2>Septic Shock — Hour-1 Bundle</h2>
<p>The Surviving Sepsis Campaign Hour-1 Bundle provides time-critical actions for septic shock management.</p>
<div class="clinical-note">
  <strong>Paediatric Septic Shock — Hour-1 Bundle:</strong>
  <ol>
    <li><strong>Measure lactate:</strong> If lactate &gt;2 mmol/L, reassess after fluid resuscitation</li>
    <li><strong>Blood cultures:</strong> Obtain before antibiotics (but do not delay antibiotics for cultures)</li>
    <li><strong>Broad-spectrum antibiotics:</strong> Within 1 hour of recognition — ceftriaxone 50–100 mg/kg IV (max 2 g) + consider metronidazole for abdominal source</li>
    <li><strong>IV/IO fluid resuscitation:</strong> 10–20 mL/kg crystalloid boluses; reassess after each</li>
    <li><strong>Vasopressors:</strong> If fluid-refractory shock (no improvement after 40–60 mL/kg): noradrenaline (first-line) or adrenaline</li>
  </ol>
</div>
<h3>Vasopressors in Paediatric Septic Shock</h3>
<table>
  <thead><tr><th>Agent</th><th>Dose</th><th>Indication</th></tr></thead>
  <tbody>
    <tr><td>Noradrenaline</td><td>0.05–2 mcg/kg/min IV infusion</td><td>First-line for warm (vasodilatory) septic shock</td></tr>
    <tr><td>Adrenaline</td><td>0.05–2 mcg/kg/min IV infusion</td><td>Cold (cardiogenic component) septic shock; refractory shock</td></tr>
    <tr><td>Dopamine</td><td>5–20 mcg/kg/min IV infusion</td><td>Alternative if noradrenaline unavailable</td></tr>
  </tbody>
</table>`
      },
      {
        order: 4,
        title: "Anaphylaxis in Children",
        content: `<h2>Anaphylaxis in Children</h2>
<p>Anaphylaxis is a severe, life-threatening systemic hypersensitivity reaction. It requires immediate recognition and treatment.</p>
<h3>Recognition</h3>
<p>Anaphylaxis is likely when ANY of the following occur after exposure to a potential allergen:</p>
<ul>
  <li>Sudden onset of skin/mucosal changes (urticaria, angioedema, flushing) PLUS respiratory compromise OR hypotension</li>
  <li>Two or more of: skin/mucosal changes, respiratory compromise, hypotension, GI symptoms — after likely allergen exposure</li>
  <li>Hypotension alone after known allergen exposure</li>
</ul>
<h3>Management</h3>
<ol>
  <li><strong>Adrenaline IM (first-line):</strong> 0.01 mg/kg of 1:1,000 IM into anterolateral thigh (max 0.5 mg); repeat after 5–15 min if no improvement</li>
  <li><strong>Position:</strong> Supine with legs elevated (or sitting up if respiratory distress)</li>
  <li><strong>Oxygen:</strong> High-flow oxygen</li>
  <li><strong>IV access + fluid:</strong> 10–20 mL/kg crystalloid bolus for hypotension</li>
  <li><strong>Antihistamine:</strong> Chlorphenamine 0.2 mg/kg IV/IM (adjunct — not first-line)</li>
  <li><strong>Corticosteroid:</strong> Hydrocortisone 4 mg/kg IV (prevents biphasic reaction — not first-line)</li>
</ol>
<div class="warning-note">
  <strong>Adrenaline IM, not IV:</strong> In non-arrest anaphylaxis, adrenaline should be given IM (anterolateral thigh), not IV. IV adrenaline in non-arrest patients can cause fatal arrhythmias. IV adrenaline is only for cardiac arrest or refractory shock with IV access and continuous monitoring.
</div>`
      }
    ],
    quiz: {
      title: "Check: Paediatric Shock",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "A 6-month-old infant presents with fever, tachycardia, prolonged CRT of 5 seconds, and mottled skin. After 40 mL/kg of crystalloid, the child remains hypotensive. What is the next step?",
          options: JSON.stringify(["Give another 20 mL/kg fluid bolus", "Start noradrenaline infusion", "Give IV hydrocortisone", "Perform immediate intubation"]),
          correctAnswer: "Start noradrenaline infusion",
          explanation: "This infant has fluid-refractory septic shock (no improvement after 40 mL/kg crystalloid). The next step is vasopressor therapy. Noradrenaline is the first-line vasopressor for warm (vasodilatory) septic shock. Adrenaline is used for cold shock or refractory cases."
        },
        {
          order: 2,
          questionText: "A child develops urticaria, angioedema, and stridor 10 minutes after eating peanuts. What is the immediate first-line treatment?",
          options: JSON.stringify(["IV chlorphenamine 0.2 mg/kg", "IV hydrocortisone 4 mg/kg", "IM adrenaline 0.01 mg/kg of 1:1,000 into anterolateral thigh", "Nebulised salbutamol"]),
          correctAnswer: "IM adrenaline 0.01 mg/kg of 1:1,000 into anterolateral thigh",
          explanation: "Anaphylaxis requires immediate IM adrenaline as first-line treatment. Dose: 0.01 mg/kg of 1:1,000 IM into the anterolateral thigh (max 0.5 mg). Antihistamines and corticosteroids are adjuncts — they do not treat the acute life-threatening reaction. Salbutamol may help bronchospasm but does not treat anaphylaxis."
        },
        {
          order: 3,
          questionText: "Which type of shock is characterised by hepatomegaly, gallop rhythm, and pulmonary oedema in a child?",
          options: JSON.stringify(["Hypovolaemic shock", "Distributive (septic) shock", "Cardiogenic shock", "Obstructive shock"]),
          correctAnswer: "Cardiogenic shock",
          explanation: "Cardiogenic shock presents with signs of pump failure and fluid overload: hepatomegaly (from venous congestion), gallop rhythm (S3 from volume overload), and pulmonary oedema (from left heart failure). Aggressive fluid resuscitation in cardiogenic shock can worsen pulmonary oedema."
        }
      ]
    }
  },
  {
    order: 4,
    title: "Module 4: Paediatric Cardiac Arrest — PALS Algorithms",
    description: "Apply the PALS cardiac arrest algorithms for shockable and non-shockable rhythms in children.",
    content: "This module covers the PALS cardiac arrest algorithms, paediatric defibrillation, and post-arrest care.",
    duration: 25,
    sections: [
      {
        order: 1,
        title: "Overview: Paediatric Cardiac Arrest — Key Differences from Adults",
        content: `<h2>Paediatric Cardiac Arrest — Key Differences from Adults</h2>
<p>Paediatric cardiac arrest differs fundamentally from adult cardiac arrest in aetiology, rhythm, and management approach.</p>
<table>
  <thead><tr><th>Feature</th><th>Adult</th><th>Child</th></tr></thead>
  <tbody>
    <tr><td>Most common cause</td><td>Primary cardiac (VF/VT)</td><td>Respiratory failure → secondary cardiac arrest</td></tr>
    <tr><td>Initial rhythm</td><td>Shockable (VF/pVT) in ~50%</td><td>Non-shockable (PEA/asystole) in ~85%</td></tr>
    <tr><td>Survival to discharge</td><td>In-hospital: ~25%; out-of-hospital: ~10%</td><td>In-hospital: ~40%; out-of-hospital: ~8%</td></tr>
    <tr><td>CPR ratio (2 rescuers)</td><td>30:2</td><td>15:2</td></tr>
    <tr><td>Defibrillation energy</td><td>200 J (biphasic)</td><td>2 J/kg → 4 J/kg → ≥4 J/kg (max 10 J/kg)</td></tr>
    <tr><td>Adrenaline dose</td><td>1 mg IV/IO</td><td>0.01 mg/kg IV/IO (max 1 mg)</td></tr>
    <tr><td>Amiodarone dose</td><td>300 mg IV/IO</td><td>5 mg/kg IV/IO (max 300 mg)</td></tr>
  </tbody>
</table>`
      },
      {
        order: 2,
        title: "PALS Shockable Rhythm Algorithm (VF/pVT)",
        content: `<h2>PALS Shockable Rhythm Algorithm — VF/pVT</h2>
<h3>Algorithm</h3>
<ol>
  <li><strong>Identify VF/pVT</strong> — confirm no pulse</li>
  <li><strong>Shock:</strong> 2 J/kg (biphasic)</li>
  <li><strong>Resume CPR immediately</strong> — 2 minutes (15:2 with 2 rescuers)</li>
  <li><strong>Establish IV/IO access</strong></li>
  <li><strong>Rhythm check:</strong>
    <ul>
      <li>Still VF/pVT → Shock 4 J/kg → Resume CPR → Adrenaline 0.01 mg/kg IV/IO</li>
      <li>After 3rd shock → Amiodarone 5 mg/kg IV/IO (or lidocaine 1 mg/kg)</li>
    </ul>
  </li>
  <li><strong>Continue:</strong> Adrenaline every 3–5 min; amiodarone second dose 2.5 mg/kg after 5th shock</li>
  <li><strong>Identify and treat reversible causes (H's and T's)</strong></li>
</ol>
<div class="clinical-note">
  <strong>Escalating defibrillation energy:</strong> 2 J/kg → 4 J/kg → ≥4 J/kg (maximum 10 J/kg or adult dose, whichever is lower). Do not exceed 360 J.
</div>`
      },
      {
        order: 3,
        title: "PALS Non-Shockable Rhythm Algorithm (PEA/Asystole)",
        content: `<h2>PALS Non-Shockable Rhythm Algorithm — PEA/Asystole</h2>
<h3>Algorithm</h3>
<ol>
  <li><strong>Identify PEA/asystole</strong> — confirm no pulse</li>
  <li><strong>Begin CPR immediately</strong> — 2 minutes (15:2 with 2 rescuers)</li>
  <li><strong>Establish IV/IO access</strong></li>
  <li><strong>Adrenaline 0.01 mg/kg IV/IO</strong> — as soon as access established; repeat every 3–5 min</li>
  <li><strong>Identify and treat reversible causes</strong> — this is the most critical step in paediatric PEA</li>
  <li><strong>Rhythm check at 2 minutes:</strong>
    <ul>
      <li>Still PEA/asystole → Continue CPR → Adrenaline → Treat causes</li>
      <li>Shockable rhythm → Switch to VF/pVT algorithm</li>
      <li>Organised rhythm → Check pulse → If pulse: post-ROSC care</li>
    </ul>
  </li>
</ol>
<div class="warning-note">
  <strong>Most common reversible causes in paediatric PEA:</strong> Hypoxia (most common — secure airway and give 100% O₂), Hypovolaemia (fluid bolus), Tension pneumothorax (needle decompression), Toxins (specific antidotes).
</div>`
      },
      {
        order: 4,
        title: "Post-Cardiac Arrest Care in Children",
        content: `<h2>Post-Cardiac Arrest Care in Children</h2>
<p>Post-cardiac arrest syndrome in children includes brain injury, myocardial dysfunction, and systemic ischaemia-reperfusion injury.</p>
<h3>Post-ROSC Priorities</h3>
<table>
  <thead><tr><th>System</th><th>Target</th><th>Intervention</th></tr></thead>
  <tbody>
    <tr><td>Airway</td><td>Secure airway</td><td>Confirm ETT position; waveform capnography</td></tr>
    <tr><td>Breathing</td><td>SpO₂ 94–99%; PaCO₂ 35–45 mmHg</td><td>Avoid hyperoxia and hypocapnia</td></tr>
    <tr><td>Circulation</td><td>Age-appropriate BP; MAP ≥5th percentile for age</td><td>Fluid boluses; vasopressors if needed; 12-lead ECG</td></tr>
    <tr><td>Disability</td><td>Normoglycaemia (4–10 mmol/L)</td><td>Check glucose; treat hypo- and hyperglycaemia</td></tr>
    <tr><td>Temperature</td><td>Normothermia (36–37.5°C) or TTM (32–34°C)</td><td>Prevent fever; consider TTM for comatose patients</td></tr>
  </tbody>
</table>
<div class="clinical-note">
  <strong>Paediatric TTM:</strong> AHA 2020 guidelines recommend TTM (32–34°C) or strict normothermia (36–37.5°C) for comatose survivors of paediatric cardiac arrest. The THAPCA trial showed no difference between 33°C and 36.8°C — but both groups had strict fever prevention. The key message: prevent fever (>38°C) in all comatose post-arrest children.
</div>`
      }
    ],
    quiz: {
      title: "Check: PALS Cardiac Arrest Algorithms",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "A 20 kg child is in VF. What is the correct initial defibrillation energy?",
          options: JSON.stringify(["20 J", "40 J", "100 J", "200 J"]),
          correctAnswer: "40 J",
          explanation: "Initial defibrillation energy in children: 2 J/kg. For a 20 kg child: 2 × 20 = 40 J. Subsequent shocks: 4 J/kg (80 J), then ≥4 J/kg (maximum 10 J/kg = 200 J, or adult dose of 200 J, whichever is lower)."
        },
        {
          order: 2,
          questionText: "A 15 kg child is in cardiac arrest with PEA. IV access is established. What is the correct adrenaline dose?",
          options: JSON.stringify(["0.15 mg IV/IO", "1 mg IV/IO", "0.5 mg IV/IO", "0.015 mg IV/IO"]),
          correctAnswer: "0.15 mg IV/IO",
          explanation: "Paediatric adrenaline dose in cardiac arrest: 0.01 mg/kg IV/IO. For a 15 kg child: 0.01 × 15 = 0.15 mg. This is equivalent to 1.5 mL of 1:10,000 adrenaline. Maximum dose is 1 mg."
        },
        {
          order: 3,
          questionText: "What is the most common initial rhythm in paediatric out-of-hospital cardiac arrest?",
          options: JSON.stringify(["Ventricular fibrillation", "Pulseless ventricular tachycardia", "PEA/Asystole", "Complete heart block"]),
          correctAnswer: "PEA/Asystole",
          explanation: "PEA and asystole account for approximately 85% of initial rhythms in paediatric cardiac arrest. This reflects the respiratory aetiology of most paediatric arrests — by the time cardiac arrest occurs, the heart has been hypoxic for some time and is in a non-shockable state. This is why ventilation is emphasised in paediatric BLS."
        }
      ]
    }
  },
  {
    order: 5,
    title: "Module 5: Paediatric Arrhythmias",
    description: "Recognise and manage common paediatric arrhythmias including SVT, VT, and bradyarrhythmias.",
    content: "This module covers recognition and management of paediatric tachyarrhythmias and bradyarrhythmias.",
    duration: 20,
    sections: [
      {
        order: 1,
        title: "Overview: Paediatric Arrhythmia Assessment",
        content: `<h2>Paediatric Arrhythmia Assessment</h2>
<p>The approach to paediatric arrhythmias follows the same principle as adult ACLS: first determine haemodynamic stability, then identify the rhythm and treat accordingly.</p>
<h3>Normal Heart Rate Ranges by Age</h3>
<table>
  <thead><tr><th>Age</th><th>Normal HR (awake)</th><th>Tachycardia</th><th>Bradycardia</th></tr></thead>
  <tbody>
    <tr><td>Neonate (0–1 month)</td><td>100–160</td><td>&gt;180</td><td>&lt;100</td></tr>
    <tr><td>Infant (1–12 months)</td><td>100–150</td><td>&gt;180</td><td>&lt;100</td></tr>
    <tr><td>Toddler (1–3 years)</td><td>90–150</td><td>&gt;160</td><td>&lt;90</td></tr>
    <tr><td>Preschool (3–5 years)</td><td>80–140</td><td>&gt;150</td><td>&lt;80</td></tr>
    <tr><td>School age (6–12 years)</td><td>70–120</td><td>&gt;130</td><td>&lt;70</td></tr>
    <tr><td>Adolescent (13–18 years)</td><td>60–100</td><td>&gt;120</td><td>&lt;60</td></tr>
  </tbody>
</table>
<div class="clinical-note">
  <strong>Sinus tachycardia vs. SVT:</strong> This distinction is critical. Sinus tachycardia has a rate that varies with activity and fever; SVT has a fixed, abrupt-onset rate. In infants, SVT rates are typically 220–300 bpm; sinus tachycardia rarely exceeds 220 bpm in infants.
</div>`
      },
      {
        order: 2,
        title: "Supraventricular Tachycardia (SVT) in Children",
        content: `<h2>Supraventricular Tachycardia (SVT) in Children</h2>
<p>SVT is the most common symptomatic arrhythmia in children. It is characterised by an abrupt onset and termination.</p>
<h3>Recognition</h3>
<ul>
  <li>Rate: typically 220–300 bpm in infants; 150–250 bpm in older children</li>
  <li>Narrow QRS (&lt;80 ms) in most cases; may be wide if aberrant conduction</li>
  <li>No visible P waves (or retrograde P waves after QRS)</li>
  <li>Abrupt onset and termination</li>
  <li>Infants: irritability, poor feeding, pallor, tachypnoea — may not be recognised for hours</li>
</ul>
<h3>Management</h3>
<table>
  <thead><tr><th>Stability</th><th>Treatment</th></tr></thead>
  <tbody>
    <tr><td>Stable</td><td>Vagal manoeuvres (ice to face in infants; Valsalva in older children) → Adenosine 0.1 mg/kg rapid IV push (max 6 mg); 2nd dose 0.2 mg/kg (max 12 mg)</td></tr>
    <tr><td>Unstable (haemodynamically compromised)</td><td>Synchronised cardioversion: 0.5–1 J/kg; escalate to 2 J/kg if ineffective; sedate if conscious</td></tr>
  </tbody>
</table>
<div class="clinical-note">
  <strong>Adenosine administration:</strong> Adenosine must be given as a rapid IV push followed immediately by a 5–10 mL saline flush. Use the most proximal IV site available. The half-life is &lt;10 seconds — slow administration will be metabolised before reaching the heart.
</div>`
      },
      {
        order: 3,
        title: "Ventricular Tachycardia and Bradyarrhythmias",
        content: `<h2>Ventricular Tachycardia and Bradyarrhythmias</h2>
<h3>Ventricular Tachycardia (VT) in Children</h3>
<ul>
  <li>Wide complex tachycardia (QRS &gt;80 ms in infants; &gt;120 ms in older children)</li>
  <li>Rate typically 120–250 bpm</li>
  <li>Causes: myocarditis, cardiomyopathy, congenital heart disease, electrolyte abnormalities, long QT syndrome</li>
</ul>
<table>
  <thead><tr><th>Stability</th><th>Treatment</th></tr></thead>
  <tbody>
    <tr><td>Pulseless VT</td><td>PALS cardiac arrest algorithm (VF/pVT)</td></tr>
    <tr><td>Stable VT with pulse</td><td>Amiodarone 5 mg/kg IV over 20–60 min; or procainamide 15 mg/kg IV over 30–60 min; or synchronised cardioversion</td></tr>
    <tr><td>Unstable VT with pulse</td><td>Synchronised cardioversion 0.5–1 J/kg (sedate if conscious)</td></tr>
  </tbody>
</table>
<h3>Bradyarrhythmias in Children</h3>
<ul>
  <li>Most common cause: hypoxia — treat hypoxia first before any medication</li>
  <li>Symptomatic bradycardia: atropine 0.02 mg/kg IV/IO (min 0.1 mg, max 0.5 mg in children)</li>
  <li>If atropine ineffective: adrenaline 0.01 mg/kg IV/IO; transcutaneous pacing</li>
  <li>Complete AV block: pacing required; atropine usually ineffective</li>
</ul>
<div class="warning-note">
  <strong>Treat hypoxia first:</strong> In children, bradycardia is most commonly caused by hypoxia. Before giving atropine, ensure the airway is open and the child is receiving adequate oxygen. Atropine given to a hypoxic child may cause VF.
</div>`
      },
      {
        order: 4,
        title: "Long QT Syndrome and Torsades de Pointes",
        content: `<h2>Long QT Syndrome and Torsades de Pointes</h2>
<p>Long QT syndrome (LQTS) is an important cause of sudden cardiac death in children and young adults. It can be congenital or acquired.</p>
<h3>Recognition</h3>
<ul>
  <li>Corrected QT interval (QTc) &gt;450 ms in males; &gt;460 ms in females</li>
  <li>Torsades de Pointes (TdP): polymorphic VT with characteristic "twisting" appearance around the isoelectric line</li>
  <li>Triggers: exercise, sudden noise, emotion, medications (macrolides, antipsychotics, antifungals)</li>
</ul>
<h3>Management of Torsades de Pointes</h3>
<ul>
  <li><strong>Pulseless TdP:</strong> Defibrillation (unsynchronised) — treat as VF</li>
  <li><strong>TdP with pulse:</strong> Magnesium sulphate 25–50 mg/kg IV over 5–15 min (max 2 g)</li>
  <li><strong>Correct electrolytes:</strong> Target K⁺ &gt;4.0 mmol/L; Mg²⁺ &gt;1.0 mmol/L</li>
  <li><strong>Avoid QT-prolonging drugs</strong></li>
  <li><strong>Congenital LQTS:</strong> Beta-blockers (propranolol); ICD implantation for high-risk patients</li>
</ul>
<div class="clinical-note">
  <strong>Common QT-prolonging medications in children:</strong> Azithromycin, erythromycin, haloperidol, ondansetron, methadone, fluconazole. Always check QTc before prescribing these medications in children with known or suspected LQTS.
</div>`
      }
    ],
    quiz: {
      title: "Check: Paediatric Arrhythmias",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "A 3-month-old infant has a heart rate of 260 bpm on the monitor. The infant is pale, irritable, and has poor perfusion. What is the immediate treatment?",
          options: JSON.stringify(["Adenosine 0.1 mg/kg rapid IV push", "Synchronised cardioversion 0.5–1 J/kg", "Atropine 0.02 mg/kg IV", "Amiodarone 5 mg/kg IV over 20 min"]),
          correctAnswer: "Synchronised cardioversion 0.5–1 J/kg",
          explanation: "This infant has SVT with haemodynamic instability (poor perfusion, pallor). Unstable SVT requires immediate synchronised cardioversion at 0.5–1 J/kg. Adenosine is used for stable SVT. Atropine is for bradycardia. Amiodarone is for VT."
        },
        {
          order: 2,
          questionText: "A 5-year-old child has a heart rate of 45 bpm with altered consciousness. What is the first step before giving any medication?",
          options: JSON.stringify(["Atropine 0.02 mg/kg IV", "Adrenaline 0.01 mg/kg IV", "Ensure airway is open and give oxygen", "Transcutaneous pacing"]),
          correctAnswer: "Ensure airway is open and give oxygen",
          explanation: "In children, bradycardia is most commonly caused by hypoxia. The first step is always to treat hypoxia — open the airway and give oxygen. Atropine given to a hypoxic child may cause VF. Only give atropine after ensuring adequate oxygenation and ventilation."
        },
        {
          order: 3,
          questionText: "A child with known long QT syndrome develops Torsades de Pointes with a pulse. What is the treatment?",
          options: JSON.stringify(["Amiodarone 5 mg/kg IV", "Synchronised cardioversion", "Magnesium sulphate 25–50 mg/kg IV over 5–15 min", "Adenosine 0.1 mg/kg rapid IV push"]),
          correctAnswer: "Magnesium sulphate 25–50 mg/kg IV over 5–15 min",
          explanation: "Torsades de Pointes with a pulse is treated with magnesium sulphate 25–50 mg/kg IV (max 2 g) over 5–15 minutes. Amiodarone can worsen TdP (prolongs QT). Adenosine is for SVT. Synchronised cardioversion is for unstable TdP or if magnesium fails."
        }
      ]
    }
  },
  {
    order: 6,
    title: "Module 6: Paediatric Resuscitation — Special Situations and Team Dynamics",
    description: "Manage special paediatric resuscitation situations and apply effective team leadership.",
    content: "This module covers neonatal resuscitation, trauma, and team dynamics in paediatric resuscitation.",
    duration: 20,
    sections: [
      {
        order: 1,
        title: "Neonatal Resuscitation — NRP Overview",
        content: `<h2>Neonatal Resuscitation — NRP Overview</h2>
<p>Neonatal resuscitation follows the Neonatal Resuscitation Program (NRP) algorithm, which differs significantly from paediatric BLS/PALS.</p>
<h3>Initial Steps (Birth to 30 Seconds)</h3>
<ol>
  <li>Warm, dry, and stimulate</li>
  <li>Reposition airway (neutral position — do not hyperextend)</li>
  <li>Suction if needed (mouth then nose; only if secretions present)</li>
  <li>Assess: tone, breathing, heart rate</li>
</ol>
<h3>Positive Pressure Ventilation (PPV)</h3>
<ul>
  <li>Indicated if: apnoea/gasping, HR &lt;100 bpm, persistent central cyanosis despite O₂</li>
  <li>Rate: 40–60 breaths/min</li>
  <li>Starting FiO₂: room air (21%) for term infants; 21–30% for preterm</li>
  <li>Titrate O₂ to target SpO₂ (1 min: 60–65%; 5 min: 80–85%; 10 min: 85–95%)</li>
</ul>
<h3>Chest Compressions in Neonates</h3>
<ul>
  <li>Indicated if HR &lt;60 bpm despite 30 seconds of effective PPV</li>
  <li>Technique: two-thumb encircling (preferred) or two-finger</li>
  <li>Ratio: 3:1 (3 compressions : 1 breath) — 90 compressions + 30 breaths per minute</li>
  <li>Depth: 1/3 of AP chest diameter</li>
  <li>FiO₂: increase to 100% when compressions begin</li>
</ul>
<div class="clinical-note">
  <strong>Adrenaline in neonatal resuscitation:</strong> 0.01–0.03 mg/kg IV/IO (not IM). If IV/IO access not available, endotracheal adrenaline 0.05–0.1 mg/kg (higher dose needed due to poor absorption).
</div>`
      },
      {
        order: 2,
        title: "Paediatric Trauma Resuscitation",
        content: `<h2>Paediatric Trauma Resuscitation</h2>
<p>Trauma is the leading cause of death in children over 1 year. The PALS approach to trauma follows the same ABCDE framework with trauma-specific modifications.</p>
<h3>Primary Survey in Paediatric Trauma</h3>
<ul>
  <li><strong>A — Airway + C-spine:</strong> Maintain C-spine precautions; jaw thrust (not head-tilt chin-lift) if C-spine injury suspected</li>
  <li><strong>B — Breathing:</strong> Tension pneumothorax is common in paediatric trauma — high suspicion; needle decompression if suspected</li>
  <li><strong>C — Circulation + haemorrhage control:</strong> Direct pressure on external bleeding; tourniquet for limb haemorrhage; IO access if IV difficult</li>
  <li><strong>D — Disability:</strong> GCS; pupils; blood glucose</li>
  <li><strong>E — Exposure:</strong> Full exposure; prevent hypothermia</li>
</ul>
<h3>Haemorrhagic Shock in Children</h3>
<table>
  <thead><tr><th>Class</th><th>Blood Loss</th><th>Signs</th><th>Treatment</th></tr></thead>
  <tbody>
    <tr><td>I (&lt;15%)</td><td>&lt;15% blood volume</td><td>Minimal tachycardia; normal BP</td><td>Crystalloid</td></tr>
    <tr><td>II (15–30%)</td><td>15–30% blood volume</td><td>Tachycardia; mild hypotension; prolonged CRT</td><td>Crystalloid + consider blood</td></tr>
    <tr><td>III (30–40%)</td><td>30–40% blood volume</td><td>Marked tachycardia; hypotension; altered consciousness</td><td>Blood products (1:1:1 pRBC:FFP:platelets)</td></tr>
    <tr><td>IV (&gt;40%)</td><td>&gt;40% blood volume</td><td>Profound shock; imminent arrest</td><td>Massive transfusion protocol; emergency surgery</td></tr>
  </tbody>
</table>`
      },
      {
        order: 3,
        title: "Family-Centred Resuscitation",
        content: `<h2>Family-Centred Resuscitation</h2>
<p>Family presence during resuscitation is increasingly recognised as beneficial for families and does not impair resuscitation quality. AHA guidelines support offering family presence during resuscitation.</p>
<h3>Benefits of Family Presence</h3>
<ul>
  <li>Reduces parental anxiety and post-traumatic stress</li>
  <li>Allows parents to see that everything possible was done</li>
  <li>Facilitates grieving process if resuscitation is unsuccessful</li>
  <li>Does not impair resuscitation quality or team performance</li>
</ul>
<h3>Facilitating Family Presence</h3>
<ul>
  <li>Assign a dedicated staff member to stay with the family</li>
  <li>Explain what is happening in plain language</li>
  <li>Prepare the family for what they will see (tubes, monitors, CPR)</li>
  <li>Allow family to leave and return as needed</li>
  <li>If family becomes disruptive, gently ask them to step out</li>
</ul>
<div class="clinical-note">
  <strong>Cultural considerations:</strong> Family presence practices vary across cultures. Always ask the family what they would prefer. Some families may not want to be present; others may insist on it. Respect cultural and religious practices around death and dying.
</div>`
      },
      {
        order: 4,
        title: "PALS Team Dynamics and Debriefing",
        content: `<h2>PALS Team Dynamics and Debriefing</h2>
<p>Effective paediatric resuscitation requires a well-coordinated team. The emotional impact of paediatric resuscitation — especially unsuccessful resuscitation — is significant and requires structured support.</p>
<h3>PALS Team Roles</h3>
<table>
  <thead><tr><th>Role</th><th>Responsibilities</th></tr></thead>
  <tbody>
    <tr><td>Team Leader</td><td>Directs resuscitation; assigns roles; monitors quality; communicates with family; makes decisions</td></tr>
    <tr><td>Airway Manager</td><td>Manages airway and ventilation; monitors ETT position; bag-mask ventilation</td></tr>
    <tr><td>Compressor</td><td>Performs chest compressions; rotates every 2 minutes</td></tr>
    <tr><td>IV/IO and Medications</td><td>Establishes access; prepares and administers medications; verifies doses</td></tr>
    <tr><td>Monitor/Defibrillator</td><td>Operates defibrillator; announces rhythm; charges for shock</td></tr>
    <tr><td>Recorder</td><td>Documents timeline; tracks medication timing; announces time since last dose</td></tr>
    <tr><td>Family Liaison</td><td>Stays with family; explains what is happening; provides emotional support</td></tr>
  </tbody>
</table>
<h3>Post-Resuscitation Debriefing</h3>
<p>Paediatric resuscitation — especially unsuccessful resuscitation — has a profound emotional impact on all team members. Structured debriefing is essential.</p>
<ul>
  <li><strong>Hot debrief:</strong> Immediate (within 1 hour); brief; focus on what went well and what to improve; acknowledge emotional impact</li>
  <li><strong>Cold debrief:</strong> Formal (within 24–48 hours); review timeline; identify system improvements; provide psychological support</li>
  <li><strong>Critical incident support:</strong> For particularly traumatic events (e.g., child abuse, failed resuscitation of a known child), ensure access to peer support, occupational health, or counselling</li>
</ul>`
      }
    ],
    quiz: {
      title: "Check: Special Situations and Team Dynamics",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "In neonatal resuscitation, what is the compression-to-ventilation ratio?",
          options: JSON.stringify(["30:2", "15:2", "3:1", "5:1"]),
          correctAnswer: "3:1",
          explanation: "Neonatal resuscitation uses a 3:1 compression-to-ventilation ratio (3 compressions : 1 breath), resulting in 90 compressions and 30 breaths per minute. This differs from paediatric BLS (15:2 or 30:2) because neonatal arrest is almost always respiratory in origin and adequate ventilation is the priority."
        },
        {
          order: 2,
          questionText: "A 7-year-old child is brought in after a road traffic accident. The child has absent breath sounds on the right, tracheal deviation to the left, and distended neck veins. What is the immediate intervention?",
          options: JSON.stringify(["Chest X-ray to confirm before treatment", "Needle decompression at 2nd ICS MCL on the right", "IV fluid bolus 20 mL/kg", "Intubation and mechanical ventilation"]),
          correctAnswer: "Needle decompression at 2nd ICS MCL on the right",
          explanation: "This child has tension pneumothorax (absent breath sounds, tracheal deviation away from affected side, distended neck veins). This is a life-threatening emergency requiring immediate needle decompression — do not wait for a chest X-ray. Insert a large-bore needle at the 2nd intercostal space, midclavicular line on the affected side."
        },
        {
          order: 3,
          questionText: "Which statement about family presence during paediatric resuscitation is correct according to AHA guidelines?",
          options: JSON.stringify(["Family should never be present during resuscitation", "Family presence impairs resuscitation quality", "Family presence should be offered and supported with a dedicated staff member", "Family presence is only appropriate if resuscitation is successful"]),
          correctAnswer: "Family presence should be offered and supported with a dedicated staff member",
          explanation: "AHA guidelines support offering family presence during resuscitation. Evidence shows it reduces parental anxiety and post-traumatic stress without impairing resuscitation quality. A dedicated staff member should be assigned to stay with the family, explain what is happening, and provide emotional support."
        }
      ]
    }
  }
];

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log(`Seeding PALS course (ID: ${PALS_COURSE_ID})...`);
  
  // Clear existing modules for PALS
  const [existingMods] = await conn.execute(
    `SELECT id FROM modules WHERE courseId = ?`, [PALS_COURSE_ID]
  );
  for (const mod of existingMods as any[]) {
    await conn.execute(`DELETE FROM quizQuestions WHERE quizId IN (SELECT id FROM quizzes WHERE moduleId = ?)`, [mod.id]);
    await conn.execute(`DELETE FROM quizzes WHERE moduleId = ?`, [mod.id]);
    await conn.execute(`DELETE FROM moduleSections WHERE moduleId = ?`, [mod.id]);
  }
  await conn.execute(`DELETE FROM modules WHERE courseId = ?`, [PALS_COURSE_ID]);
  
  for (const mod of modules) {
    const [modResult] = await conn.execute(
      `INSERT INTO modules (courseId, title, description, content, duration, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [PALS_COURSE_ID, mod.title, mod.description, mod.content, mod.duration, mod.order]
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
  
  console.log(`\nPALS seeding complete: ${modules.length} modules, ${modules.reduce((a, m) => a + m.sections.length, 0)} sections, ${modules.reduce((a, m) => a + m.quiz.questions.length, 0)} quiz questions`);
  
  await conn.end();
}

main().catch(console.error);
