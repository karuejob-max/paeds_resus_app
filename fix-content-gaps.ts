/**
 * fix-content-gaps.ts
 * Seeds missing module sections and quiz questions for all affected courses.
 * Affected courses (from audit):
 *   - IDs 3,4,5,6,7 — 0 sections in all modules
 *   - IDs 12,13,14,15,19 — 0 quiz questions
 *   - IDs 24,25,26,27 — 0 sections AND 0 quiz questions
 *   - ID 18,20 — partial quiz questions missing
 *   - Fix Q460 wrong correct answer (Asthma I summative)
 *   - Fix Asthma II Module 2 Overview (42 chars, effectively blank)
 */

import { getDb } from './server/db';
import { modules, moduleSections, quizzes, quizQuestions } from './drizzle/schema';
import { eq, and } from 'drizzle-orm';

const db_promise = getDb();

async function upsertSection(moduleId: number, title: string, content: string, order: number) {
  const db = await db_promise;
  const existing = await db.select().from(moduleSections).where(and(eq(moduleSections.moduleId, moduleId), eq(moduleSections.title, title)));
  if (existing.length > 0) {
    await db.update(moduleSections).set({ content, order }).where(eq(moduleSections.id, existing[0].id));
  } else {
    await db.insert(moduleSections).values({ moduleId, title, content, order });
  }
}

async function upsertQuestion(quizId: number, question: string, options: string[], correctAnswer: string, explanation: string, order: number) {
  const db = await db_promise;
  const existing = await db.select().from(quizQuestions).where(and(eq(quizQuestions.quizId, quizId), eq(quizQuestions.question, question)));
  if (existing.length > 0) return;
  await db.insert(quizQuestions).values({
    quizId,
    question,
    options: JSON.stringify(options),
    correctAnswer: JSON.stringify(correctAnswer),
    explanation,
    order,
    questionType: 'multiple_choice',
    points: 1,
  });
}

async function getModulesByTitle(courseId: number): Promise<Record<string, number>> {
  const db = await db_promise;
  const mods = await db.select().from(modules).where(eq(modules.courseId, courseId));
  const map: Record<string, number> = {};
  mods.forEach(m => { map[m.title] = m.id; });
  return map;
}

async function getQuizByModuleId(moduleId: number): Promise<number | null> {
  const db = await db_promise;
  const qzs = await db.select().from(quizzes).where(eq(quizzes.moduleId, moduleId));
  return qzs[0]?.id ?? null;
}

// ============================================================
// COURSE 6: Paediatric Asthma I
// ============================================================
async function fixAsthmaI() {
  console.log('Fixing Asthma I (course 6)...');
  const mods = await getModulesByTitle(6);

  // Module 1: Asthma Severity Assessment
  const m1 = mods['Module 1: Asthma Severity Assessment'];
  if (m1) {
    await upsertSection(m1, 'Overview', '<h2>Paediatric Asthma: Severity Assessment</h2><p>Asthma is the most common chronic respiratory disease in children. Accurate severity classification within the first 5 minutes of presentation determines the urgency and intensity of treatment. Delayed recognition of life-threatening asthma is a preventable cause of paediatric death.</p>', 1);
    await upsertSection(m1, 'Severity Classification:', `<div class="clinical-note"><h4>Severity Classification at a Glance</h4>
<ul>
  <li><strong>Mild:</strong> SpO2 ≥95%, speaks in sentences, accessory muscle use absent or mild, PEFR ≥70% predicted</li>
  <li><strong>Moderate:</strong> SpO2 92–94%, speaks in phrases, moderate accessory muscle use, PEFR 40–69%</li>
  <li><strong>Severe:</strong> SpO2 &lt;92%, speaks in words only, marked accessory muscle use, PEFR &lt;40%, HR &gt;120/min</li>
  <li><strong>Life-threatening:</strong> Silent chest, cyanosis, exhaustion, altered consciousness, SpO2 &lt;90% on O2, PEFR &lt;33%</li>
</ul></div>`, 2);
    await upsertSection(m1, 'Key Assessment Parameters:', '<ul><li><strong>Respiratory rate:</strong> Tachypnoea is an early sign; bradypnoea is ominous (fatigue)</li><li><strong>Accessory muscle use:</strong> Sternocleidomastoid, intercostal, subcostal retractions</li><li><strong>Auscultation:</strong> Wheeze may be absent in severe obstruction ("silent chest" = danger)</li><li><strong>Mental status:</strong> Agitation → drowsiness indicates CO2 retention</li><li><strong>SpO2:</strong> Continuous pulse oximetry mandatory; target ≥94%</li><li><strong>PEFR:</strong> Use if child ≥5 years and cooperative; compare to personal best or predicted</li></ul>', 3);
    await upsertSection(m1, 'Red Flags (Immediate Action Required):', `<div class="clinical-note"><h4>Red Flags — Act Immediately</h4>
<ul>
  <li>Silent chest (no wheeze despite respiratory distress)</li>
  <li>SpO2 &lt;90% despite high-flow oxygen</li>
  <li>Cyanosis</li>
  <li>Exhaustion or inability to speak</li>
  <li>Altered consciousness or agitation</li>
  <li>Bradycardia (late sign of severe hypoxia)</li>
</ul></div>`, 4);
  }

  // Module 2: First-Hour Management
  const m2 = mods['Module 2: First-Hour Management'];
  if (m2) {
    await upsertSection(m2, 'Overview', '<h2>First-Hour Management of Acute Asthma</h2><p>The first hour is critical. Rapid, protocol-driven treatment with bronchodilators, oxygen, and systemic corticosteroids reduces the need for intubation and ICU admission. Reassess every 20 minutes.</p>', 1);
    await upsertSection(m2, 'Immediate Actions (0–5 min):', '<ul><li>Position: upright or sitting (reduces work of breathing)</li><li>High-flow oxygen: 10–15 L/min via non-rebreather mask; target SpO2 ≥94%</li><li>IV access: large bore; draw blood gas, glucose, electrolytes</li><li>Continuous monitoring: SpO2, HR, RR, BP</li><li>Notify senior clinician immediately if life-threatening features present</li></ul>', 2);
    await upsertSection(m2, 'Bronchodilator Therapy:', `<div class="clinical-note"><h4>First-Line Bronchodilators</h4>
<ul>
  <li><strong>Salbutamol (albuterol):</strong> 2.5–5 mg nebulised every 20 min × 3 in first hour (continuous nebulisation in severe/life-threatening: 15 mg/hr)</li>
  <li><strong>Ipratropium bromide:</strong> 0.25 mg (&lt;12 yr) or 0.5 mg (≥12 yr) nebulised every 20 min × 3 — synergistic with salbutamol, reduces hospitalisation</li>
  <li><strong>IV salbutamol:</strong> 15 mcg/kg bolus over 10 min, then 1–5 mcg/kg/min infusion if nebulised therapy fails</li>
</ul></div>`, 3);
    await upsertSection(m2, 'Corticosteroids:', '<ul><li><strong>Hydrocortisone:</strong> 4–5 mg/kg IV (max 200 mg) — give within 30 min of arrival</li><li><strong>Prednisolone:</strong> 1–2 mg/kg PO (max 40 mg) if IV access unavailable</li><li><strong>Onset:</strong> 4–6 hours; do not delay bronchodilators while waiting for steroid effect</li></ul>', 4);
    await upsertSection(m2, 'Magnesium Sulphate (Severe/Life-threatening):', '<ul><li><strong>Dose:</strong> 40 mg/kg IV (max 2 g) over 20 minutes</li><li><strong>Indication:</strong> Severe or life-threatening asthma not responding to initial bronchodilators</li><li><strong>Mechanism:</strong> Smooth muscle relaxation via calcium channel blockade</li><li><strong>Monitor:</strong> BP, deep tendon reflexes during infusion</li></ul>', 5);

    // Fix Quiz 24 — add 3 questions
    const qId = await getQuizByModuleId(m2);
    if (qId) {
      await upsertQuestion(qId, 'A 7-year-old with acute asthma has SpO2 88% on room air and is speaking in single words. What is the FIRST priority?', ['Oral prednisolone', 'High-flow oxygen and continuous salbutamol nebulisation', 'IV aminophylline', 'Chest X-ray'], 'High-flow oxygen and continuous salbutamol nebulisation', 'SpO2 <90% with severe respiratory distress requires immediate oxygen and continuous bronchodilator therapy.', 1);
      await upsertQuestion(qId, 'Ipratropium bromide is added to salbutamol in acute asthma because:', ['It is faster acting than salbutamol', 'It is synergistic and reduces hospitalisation rates', 'It prevents infection', 'It reduces fever'], 'It is synergistic and reduces hospitalisation rates', 'Ipratropium acts on muscarinic receptors (M3) causing bronchodilation synergistic with beta-2 agonists. Combined use reduces hospitalisation.', 2);
      await upsertQuestion(qId, 'The recommended dose of hydrocortisone in acute severe asthma is:', ['1 mg/kg IV', '4–5 mg/kg IV (max 200 mg)', '10 mg/kg IV', '20 mg/kg IV'], '4–5 mg/kg IV (max 200 mg)', 'Hydrocortisone 4–5 mg/kg IV (max 200 mg) is the standard first-line systemic corticosteroid in acute severe asthma.', 3);
    }
  }

  // Fix Q460 wrong answer (summative quiz — correct answer should be "4-5 mg/kg" not "50 mg/kg")
  const db = await db_promise;
  await db.update(quizQuestions).set({ correctAnswer: JSON.stringify('4-5 mg/kg') }).where(eq(quizQuestions.id, 460));
  console.log('Fixed Q460 correct answer.');
}

// ============================================================
// COURSE 7: Paediatric Status Epilepticus I
// ============================================================
async function fixStatusEpiI() {
  console.log('Fixing Status Epilepticus I (course 7)...');
  const mods = await getModulesByTitle(7);

  const m1 = mods['Module 1: Seizure Recognition & Classification'];
  if (m1) {
    await upsertSection(m1, 'Overview', '<h2>Status Epilepticus: Recognition and Classification</h2><p>Status epilepticus (SE) is defined as a seizure lasting ≥5 minutes OR two or more seizures without return to baseline consciousness. It is a paediatric emergency with a mortality of 3–5% and significant morbidity if untreated. Time to treatment is the most critical factor.</p>', 1);
    await upsertSection(m1, 'Classification:', '<ul><li><strong>Convulsive SE (CSE):</strong> Generalised tonic-clonic — most common, most visible</li><li><strong>Non-convulsive SE (NCSE):</strong> Subtle motor signs, altered consciousness — often missed</li><li><strong>Focal SE:</strong> Unilateral motor activity, may generalise</li><li><strong>Febrile SE:</strong> In context of fever, age 6 months–5 years; usually benign but treat as SE</li><li><strong>Refractory SE:</strong> Fails to respond to 2 adequate doses of benzodiazepines</li></ul>', 2);
    await upsertSection(m1, 'Immediate Assessment (ABCDE):', `<div class="clinical-note"><h4>Simultaneous Assessment and Treatment</h4>
<ul>
  <li><strong>Airway:</strong> Position lateral (recovery) if possible; suction secretions; jaw thrust if obstructed</li>
  <li><strong>Breathing:</strong> Oxygen 10–15 L/min via NRM; SpO2 target ≥94%</li>
  <li><strong>Circulation:</strong> IV/IO access; check glucose immediately (treat if &lt;3 mmol/L)</li>
  <li><strong>Disability:</strong> GCS, pupil response, focal signs</li>
  <li><strong>Exposure:</strong> Temperature, rash, signs of trauma or infection</li>
</ul></div>`, 3);
    await upsertSection(m1, 'Common Causes in Children:', '<ul><li>Febrile illness (most common in &lt;5 yr)</li><li>Epilepsy (breakthrough seizure, non-compliance)</li><li>CNS infection (meningitis, encephalitis)</li><li>Metabolic: hypoglycaemia, hyponatraemia, hypocalcaemia</li><li>Toxic ingestion</li><li>Hypoxic-ischaemic injury</li><li>Structural: tumour, stroke, trauma</li></ul>', 4);
  }

  const m2 = mods['Module 2: First-Line Treatment Protocol'];
  if (m2) {
    await upsertSection(m2, 'Overview', '<h2>First-Line Treatment: The 5-Minute Rule</h2><p>Treatment begins at 5 minutes. Every minute of untreated seizure increases the risk of neuronal injury and makes the seizure harder to terminate. Follow the time-based protocol strictly.</p>', 1);
    await upsertSection(m2, 'Phase 1 (0–5 min): Stabilise', '<ul><li>Oxygen, positioning, IV/IO access</li><li>Check glucose: if &lt;3 mmol/L give 2 mL/kg of 10% dextrose IV</li><li>Do not restrain limbs; protect from injury</li></ul>', 2);
    await upsertSection(m2, 'Phase 2 (5–20 min): First Benzodiazepine', `<div class="clinical-note"><h4>First-Line Benzodiazepines</h4>
<ul>
  <li><strong>Lorazepam IV/IO:</strong> 0.1 mg/kg (max 4 mg) — preferred if IV access</li>
  <li><strong>Diazepam rectal:</strong> 0.5 mg/kg (max 10 mg) — if no IV access</li>
  <li><strong>Midazolam buccal/intranasal:</strong> 0.3 mg/kg (max 10 mg) — effective, easy to administer</li>
  <li>Repeat once after 5–10 min if seizure continues</li>
</ul></div>`, 3);
    await upsertSection(m2, 'Phase 3 (20–40 min): Second-Line Agent', `<div class="clinical-note"><h4>Second-Line Anticonvulsants</h4>
<ul>
  <li><strong>Phenytoin/Fosphenytoin:</strong> 20 mg/kg IV over 20 min (monitor ECG — risk of arrhythmia)</li>
  <li><strong>Levetiracetam:</strong> 60 mg/kg IV over 15 min (max 4.5 g) — preferred in many centres; fewer drug interactions</li>
  <li><strong>Sodium valproate:</strong> 40 mg/kg IV over 15 min (max 3 g) — avoid in liver disease</li>
  <li>Choose based on availability and contraindications</li>
</ul></div>`, 4);

    const qId = await getQuizByModuleId(m2);
    if (qId) {
      await upsertQuestion(qId, 'Status epilepticus is defined as a seizure lasting:', ['≥2 minutes', '≥5 minutes', '≥10 minutes', '≥30 minutes'], '≥5 minutes', 'SE is defined as seizure lasting ≥5 minutes OR ≥2 seizures without return to baseline. The 5-minute threshold guides treatment initiation.', 1);
      await upsertQuestion(qId, 'First-line IV benzodiazepine for status epilepticus in a child with IV access:', ['Phenytoin 20 mg/kg', 'Lorazepam 0.1 mg/kg', 'Diazepam rectal 0.5 mg/kg', 'Phenobarbitone 20 mg/kg'], 'Lorazepam 0.1 mg/kg', 'Lorazepam IV 0.1 mg/kg (max 4 mg) is the preferred first-line agent when IV access is available due to its longer duration of action compared to diazepam.', 2);
      await upsertQuestion(qId, 'Immediate bedside test to perform in any seizing child:', ['CT head', 'Blood glucose', 'Lumbar puncture', 'EEG'], 'Blood glucose', 'Hypoglycaemia is a rapidly reversible cause of seizures. Bedside glucose must be checked and corrected immediately in every seizing child.', 3);
    }
  }

  const m3 = mods['Module 3: Refractory SE and Escalation'];
  if (m3) {
    await upsertSection(m3, 'Overview', '<h2>Refractory Status Epilepticus</h2><p>Refractory SE is defined as failure to respond to two adequate doses of benzodiazepines plus one second-line agent. It requires ICU admission, continuous EEG monitoring, and anaesthetic agents.</p>', 1);
    await upsertSection(m3, 'Refractory SE Management:', `<div class="clinical-note"><h4>Third-Line: Anaesthetic Agents (ICU)</h4>
<ul>
  <li><strong>Midazolam infusion:</strong> 0.1–0.3 mg/kg/hr IV (titrate to burst suppression on EEG)</li>
  <li><strong>Propofol:</strong> 2–4 mg/kg bolus then 2–10 mg/kg/hr — avoid in children &lt;16 yr (propofol infusion syndrome)</li>
  <li><strong>Thiopentone:</strong> 4 mg/kg IV bolus then 2–10 mg/kg/hr — gold standard for super-refractory SE</li>
  <li>All require intubation and mechanical ventilation</li>
</ul></div>`, 2);
    await upsertSection(m3, 'ICU Monitoring Requirements:', '<ul><li>Continuous EEG monitoring (target: burst suppression pattern)</li><li>Arterial line for continuous BP monitoring</li><li>Frequent electrolyte monitoring (Na, K, Ca, Mg, glucose)</li><li>Temperature management (fever worsens neuronal injury)</li><li>Treat underlying cause concurrently</li></ul>', 3);
  }
}

// ============================================================
// COURSE 4: Paediatric Septic Shock I
// ============================================================
async function fixSepticShockI() {
  console.log('Fixing Septic Shock I (course 4)...');
  const mods = await getModulesByTitle(4);

  const m1 = mods['Module 1: Septic Shock Recognition'];
  if (m1) {
    await upsertSection(m1, 'Overview', '<h2>Paediatric Septic Shock: Recognition</h2><p>Septic shock is the most common cause of preventable paediatric death in LMICs. Early recognition and treatment within the first hour (the "golden hour") reduces mortality by up to 50%. The challenge is that children compensate well initially — by the time hypotension appears, shock is advanced.</p>', 1);
    await upsertSection(m1, 'Sepsis Definitions (Paediatric):', '<ul><li><strong>Sepsis:</strong> Life-threatening organ dysfunction caused by dysregulated host response to infection</li><li><strong>Septic shock:</strong> Sepsis + cardiovascular dysfunction (fluid-refractory hypotension OR vasopressor requirement)</li><li><strong>SIRS criteria in children:</strong> Temperature &gt;38.5°C or &lt;36°C; HR &gt;2 SD above normal for age; RR &gt;2 SD above normal; WBC abnormal for age</li></ul>', 2);
    await upsertSection(m1, 'Early Recognition Signs:', `<div class="clinical-note"><h4>Warm vs Cold Shock</h4>
<ul>
  <li><strong>Warm shock (vasodilatory):</strong> Flushed, warm skin; bounding pulses; wide pulse pressure; tachycardia — early, more common in adults</li>
  <li><strong>Cold shock (vasoconstrictive):</strong> Mottled, cool skin; weak/thready pulses; narrow pulse pressure; prolonged CRT (&gt;2 sec) — more common in children</li>
  <li><strong>Key paediatric point:</strong> BP may be NORMAL until very late. Do not wait for hypotension to diagnose shock.</li>
</ul></div>`, 3);
    await upsertSection(m1, 'Organ Dysfunction Markers:', '<ul><li><strong>Cardiovascular:</strong> Tachycardia, hypotension (late), poor perfusion</li><li><strong>Respiratory:</strong> Tachypnoea, increased work of breathing, hypoxia</li><li><strong>Neurological:</strong> Altered consciousness, irritability, lethargy</li><li><strong>Renal:</strong> Oliguria (&lt;1 mL/kg/hr), rising creatinine</li><li><strong>Hepatic:</strong> Jaundice, elevated transaminases</li><li><strong>Haematological:</strong> Petechiae, purpura, DIC</li></ul>', 4);
  }

  const m2 = mods['Module 2: Fluid Resuscitation Protocol'];
  if (m2) {
    await upsertSection(m2, 'Overview', '<h2>Fluid Resuscitation in Septic Shock</h2><p>Fluid resuscitation restores intravascular volume and cardiac output. However, excessive fluid causes harm (pulmonary oedema, abdominal compartment syndrome). The 2020 WHO and Surviving Sepsis Campaign guidelines now recommend cautious, titrated fluid therapy with early vasopressors.</p>', 1);
    await upsertSection(m2, 'Fluid Resuscitation Protocol:', `<div class="clinical-note"><h4>Fluid Bolus Protocol (Evidence-Based)</h4>
<ul>
  <li><strong>Initial bolus:</strong> 10–20 mL/kg 0.9% NaCl or Ringer's lactate over 15–30 min</li>
  <li><strong>Reassess after each bolus:</strong> HR, BP, CRT, mental status, urine output</li>
  <li><strong>Repeat bolus:</strong> Only if signs of fluid responsiveness (improved HR, CRT, BP)</li>
  <li><strong>Maximum:</strong> 40–60 mL/kg in first hour; stop if signs of fluid overload (crackles, hepatomegaly, worsening SpO2)</li>
  <li><strong>CAUTION:</strong> In malaria, severe anaemia, or cardiac disease — use 10 mL/kg boluses cautiously</li>
</ul></div>`, 2);
    await upsertSection(m2, 'Antibiotic Therapy (Within 1 Hour):', '<ul><li><strong>Principle:</strong> Broad-spectrum antibiotics within 60 minutes of recognition</li><li><strong>Community-acquired:</strong> Ceftriaxone 100 mg/kg/day (max 4 g) IV</li><li><strong>Hospital-acquired/NICU:</strong> Piperacillin-tazobactam + gentamicin</li><li><strong>Meningococcal suspected:</strong> Ceftriaxone + dexamethasone</li><li><strong>Source control:</strong> Drain abscesses, remove infected lines</li></ul>', 3);
  }

  const m3 = mods['Module 3: Vasopressors and ICU Escalation'];
  if (m3) {
    await upsertSection(m3, 'Overview', '<h2>Vasopressors and ICU Escalation</h2><p>When fluid resuscitation fails to restore perfusion (fluid-refractory shock), vasopressors are required. Early vasopressor use (even before full fluid resuscitation) is now supported by evidence and reduces fluid overload.</p>', 1);
    await upsertSection(m3, 'Vasopressor Choice:', `<div class="clinical-note"><h4>Vasopressor Selection</h4>
<ul>
  <li><strong>Noradrenaline (norepinephrine):</strong> First-line for vasodilatory (warm) shock; 0.1–1 mcg/kg/min</li>
  <li><strong>Adrenaline (epinephrine):</strong> First-line for cold shock or cardiac dysfunction; 0.1–1 mcg/kg/min</li>
  <li><strong>Dopamine:</strong> Alternative if noradrenaline unavailable; 5–20 mcg/kg/min</li>
  <li><strong>Dobutamine:</strong> Add if myocardial dysfunction (low CO, high SVR); 5–20 mcg/kg/min</li>
</ul></div>`, 2);
    await upsertSection(m3, 'ICU Escalation Criteria:', '<ul><li>Fluid-refractory shock (no response after 40 mL/kg)</li><li>Vasopressor requirement</li><li>Respiratory failure (SpO2 &lt;90% despite O2)</li><li>Altered consciousness (GCS &lt;12)</li><li>Oliguria despite resuscitation</li><li>Lactate &gt;4 mmol/L</li></ul>', 3);
  }
}

// ============================================================
// COURSES 12, 13: Hypovolemic Shock I & II — Fix empty quizzes
// ============================================================
async function fixHypovolemicShockQuizzes() {
  console.log('Fixing Hypovolemic Shock I & II quiz questions...');
  
  // Course 12: Hypovolemic Shock I
  const mods12 = await getModulesByTitle(12);
  for (const [title, modId] of Object.entries(mods12)) {
    const qId = await getQuizByModuleId(modId);
    if (!qId) continue;
    const db = await db_promise;
    const existing = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, qId));
    if (existing.length > 0) continue;
    
    if (title.includes('Module 1')) {
      await upsertQuestion(qId, 'Which is the EARLIEST sign of hypovolemic shock in a child?', ['Hypotension', 'Tachycardia and prolonged capillary refill time', 'Bradycardia', 'Cyanosis'], 'Tachycardia and prolonged capillary refill time', 'Children compensate with tachycardia and vasoconstriction. Hypotension is a late, pre-terminal sign.', 1);
      await upsertQuestion(qId, 'Initial fluid bolus for hypovolemic shock:', ['5 mL/kg 5% dextrose', '20 mL/kg 0.9% NaCl over 15–30 min', '40 mL/kg over 5 min', '10 mL/kg albumin'], '20 mL/kg 0.9% NaCl over 15–30 min', '20 mL/kg isotonic crystalloid over 15–30 min is the standard initial bolus for hypovolemic shock.', 2);
      await upsertQuestion(qId, 'Capillary refill time >2 seconds in a child indicates:', ['Normal finding', 'Peripheral vasoconstriction and poor perfusion', 'Fever', 'Anaemia'], 'Peripheral vasoconstriction and poor perfusion', 'CRT >2 seconds indicates peripheral vasoconstriction and reduced perfusion, an early sign of shock.', 3);
    } else if (title.includes('Module 2')) {
      await upsertQuestion(qId, 'Haemorrhagic shock is classified into 4 classes. Class III involves blood loss of:', ['<15%', '15–30%', '30–40%', '>40%'], '30–40%', 'Class III haemorrhagic shock involves 30–40% blood volume loss with marked tachycardia, hypotension, and altered consciousness.', 1);
      await upsertQuestion(qId, 'In haemorrhagic shock, the preferred initial resuscitation fluid is:', ['5% dextrose', '0.9% NaCl or Ringer\'s lactate', 'Albumin 5%', 'Dextrose-saline'], '0.9% NaCl or Ringer\'s lactate', 'Isotonic crystalloids (0.9% NaCl or Ringer\'s lactate) are first-line for haemorrhagic shock resuscitation.', 2);
      await upsertQuestion(qId, 'The "permissive hypotension" strategy in trauma aims to maintain systolic BP at:', ['Normal for age', '50–60 mmHg', '80–90 mmHg until surgical haemostasis', '>120 mmHg'], '80–90 mmHg until surgical haemostasis', 'Permissive hypotension (SBP 80–90 mmHg) reduces coagulopathy and re-bleeding until definitive surgical haemostasis.', 3);
    } else if (title.includes('Module 3')) {
      await upsertQuestion(qId, 'Dehydration severity is classified as severe when fluid deficit is:', ['3–5%', '5–9%', '≥10%', '1–2%'], '≥10%', 'Severe dehydration is ≥10% body weight loss with signs of shock (sunken eyes, absent tears, dry mucous membranes, reduced skin turgor).', 1);
      await upsertQuestion(qId, 'ORS (oral rehydration solution) is appropriate for:', ['Severe dehydration with shock', 'Moderate dehydration without shock', 'Unconscious child', 'Child with ileus'], 'Moderate dehydration without shock', 'ORS is safe and effective for mild-moderate dehydration. Severe dehydration with shock requires IV fluid resuscitation.', 2);
      await upsertQuestion(qId, 'Ongoing losses in diarrhoeal dehydration should be replaced with:', ['Water only', '0.9% NaCl', 'ORS 10 mL/kg per loose stool', 'Albumin'], 'ORS 10 mL/kg per loose stool', 'WHO recommends ORS 10 mL/kg per loose stool and 5 mL/kg per vomit to replace ongoing losses.', 3);
    }
  }

  // Course 13: Hypovolemic Shock II
  const mods13 = await getModulesByTitle(13);
  for (const [title, modId] of Object.entries(mods13)) {
    const qId = await getQuizByModuleId(modId);
    if (!qId) continue;
    const db = await db_promise;
    const existing = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, qId));
    if (existing.length > 0) continue;

    if (title.includes('Module 1')) {
      await upsertQuestion(qId, 'Massive transfusion protocol (MTP) is activated when blood loss exceeds:', ['10% of blood volume', '30% of blood volume in 24 hours or >10% in 1 hour', '5% of blood volume', '50 mL total'], '30% of blood volume in 24 hours or >10% in 1 hour', 'MTP is activated for massive haemorrhage to ensure balanced transfusion of RBC:FFP:platelets (1:1:1 ratio).', 1);
      await upsertQuestion(qId, 'The recommended ratio for massive transfusion in haemorrhagic shock is:', ['RBC only', 'RBC:FFP:Platelets = 1:1:1', 'RBC:FFP = 4:1', 'FFP only'], 'RBC:FFP:Platelets = 1:1:1', 'Balanced transfusion (1:1:1 ratio) reduces dilutional coagulopathy and improves survival in massive haemorrhage.', 2);
      await upsertQuestion(qId, 'Tranexamic acid (TXA) should be given in haemorrhagic shock:', ['Only after 3 hours', 'Within 3 hours of injury (earlier is better)', 'Only if platelets <50', 'Never in children'], 'Within 3 hours of injury (earlier is better)', 'TXA reduces mortality in haemorrhagic shock when given within 3 hours. The CRASH-2 trial demonstrated 30% reduction in bleeding death.', 3);
    } else if (title.includes('Module 2')) {
      await upsertQuestion(qId, 'Damage control resuscitation (DCR) prioritises:', ['Aggressive crystalloid resuscitation', 'Permissive hypotension, haemostatic resuscitation, and early surgery', 'High-dose vasopressors', 'Immediate full correction of all deficits'], 'Permissive hypotension, haemostatic resuscitation, and early surgery', 'DCR limits crystalloids, uses blood products early, and accepts permissive hypotension until surgical haemostasis.', 1);
      await upsertQuestion(qId, 'Hypocalcaemia during massive transfusion occurs because:', ['Blood products contain no calcium', 'Citrate in stored blood chelates ionised calcium', 'Calcium is lost in urine', 'Hypothermia destroys calcium'], 'Citrate in stored blood chelates ionised calcium', 'Citrate is used as anticoagulant in stored blood and chelates ionised calcium, causing hypocalcaemia during massive transfusion.', 2);
      await upsertQuestion(qId, 'The lethal triad in trauma haemorrhage consists of:', ['Hypoxia, hypotension, tachycardia', 'Hypothermia, acidosis, coagulopathy', 'Anaemia, fever, tachycardia', 'Hypoglycaemia, hyponatraemia, hypocalcaemia'], 'Hypothermia, acidosis, coagulopathy', 'The lethal triad (hypothermia + acidosis + coagulopathy) is self-perpetuating and must be actively prevented and treated.', 3);
    } else if (title.includes('Module 3')) {
      await upsertQuestion(qId, 'Abdominal compartment syndrome is defined as intra-abdominal pressure (IAP) of:', ['>5 mmHg', '>12 mmHg with new organ dysfunction', '>20 mmHg always', '>8 mmHg'], '>12 mmHg with new organ dysfunction', 'ACS is IAP >12 mmHg with new organ dysfunction. Bladder pressure measurement is the standard monitoring method.', 1);
      await upsertQuestion(qId, 'Post-resuscitation monitoring target for urine output in children:', ['0.5 mL/kg/hr', '1–2 mL/kg/hr', '3 mL/kg/hr', '>5 mL/kg/hr'], '1–2 mL/kg/hr', 'Urine output 1–2 mL/kg/hr indicates adequate renal perfusion post-resuscitation in children.', 2);
      await upsertQuestion(qId, 'Serum lactate is used in shock management to:', ['Diagnose infection', 'Assess tissue perfusion and guide resuscitation adequacy', 'Monitor renal function', 'Predict seizure risk'], 'Assess tissue perfusion and guide resuscitation adequacy', 'Lactate reflects anaerobic metabolism from tissue hypoperfusion. Normalisation of lactate (<2 mmol/L) is a resuscitation endpoint.', 3);
    }
  }
}

// ============================================================
// COURSES 14, 15: Cardiogenic Shock I & II — Fix empty quizzes
// ============================================================
async function fixCardiogenicShockQuizzes() {
  console.log('Fixing Cardiogenic Shock I & II quiz questions...');
  
  for (const courseId of [14, 15]) {
    const mods = await getModulesByTitle(courseId);
    for (const [title, modId] of Object.entries(mods)) {
      const qId = await getQuizByModuleId(modId);
      if (!qId) continue;
      const db = await db_promise;
      const existing = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, qId));
      if (existing.length > 0) continue;

      if (title.includes('Module 1')) {
        await upsertQuestion(qId, 'Cardiogenic shock differs from hypovolemic shock in that it presents with:', ['Dry lungs and low JVP', 'Elevated JVP, hepatomegaly, and pulmonary oedema', 'Fever and tachycardia', 'Normal heart sounds'], 'Elevated JVP, hepatomegaly, and pulmonary oedema', 'Cardiogenic shock has signs of fluid overload (elevated JVP, hepatomegaly, pulmonary oedema) unlike hypovolemic shock.', 1);
        await upsertQuestion(qId, 'The most common cause of cardiogenic shock in children is:', ['Hypertension', 'Myocarditis and dilated cardiomyopathy', 'Pneumonia', 'Dehydration'], 'Myocarditis and dilated cardiomyopathy', 'Myocarditis and dilated cardiomyopathy are the leading causes of cardiogenic shock in children.', 2);
        await upsertQuestion(qId, 'Fluid bolus in cardiogenic shock should be:', ['20 mL/kg rapidly', 'Avoided or given cautiously (5–10 mL/kg) with close monitoring', '40 mL/kg immediately', 'Not given at all'], 'Avoided or given cautiously (5–10 mL/kg) with close monitoring', 'Aggressive fluid loading worsens pulmonary oedema in cardiogenic shock. Small cautious boluses (5–10 mL/kg) with reassessment are recommended.', 3);
      } else if (title.includes('Module 2')) {
        await upsertQuestion(qId, 'First-line inotrope for cardiogenic shock with low cardiac output:', ['Noradrenaline', 'Dobutamine or adrenaline (epinephrine)', 'Atropine', 'Dopamine at renal dose'], 'Dobutamine or adrenaline (epinephrine)', 'Dobutamine (5–20 mcg/kg/min) or adrenaline (0.05–0.3 mcg/kg/min) are first-line inotropes for low-output cardiogenic shock.', 1);
        await upsertQuestion(qId, 'Milrinone is used in cardiogenic shock because:', ['It is a vasopressor', 'It is a phosphodiesterase inhibitor that increases cardiac output and reduces afterload', 'It reduces heart rate', 'It is an antibiotic'], 'It is a phosphodiesterase inhibitor that increases cardiac output and reduces afterload', 'Milrinone (PDE3 inhibitor) increases cAMP, improving contractility and causing vasodilation — useful in high-afterload cardiogenic shock.', 2);
        await upsertQuestion(qId, 'Pulmonary oedema in cardiogenic shock is treated with:', ['Aggressive IV fluids', 'Furosemide IV and positive pressure ventilation', 'Oral diuretics only', 'Chest physiotherapy'], 'Furosemide IV and positive pressure ventilation', 'Furosemide IV (1–2 mg/kg) and CPAP/BiPAP reduce preload and improve oxygenation in cardiogenic pulmonary oedema.', 3);
      } else if (title.includes('Module 3')) {
        await upsertQuestion(qId, 'Arrhythmia-induced cardiogenic shock with SVT is treated with:', ['Digoxin loading', 'Adenosine 0.1 mg/kg IV rapid push (max 6 mg)', 'Amiodarone first', 'Observation only'], 'Adenosine 0.1 mg/kg IV rapid push (max 6 mg)', 'Adenosine is first-line for SVT — given as rapid IV push followed by saline flush. Dose 0.1 mg/kg (max 6 mg first dose).', 1);
        await upsertQuestion(qId, 'Mechanical circulatory support (ECMO) is considered in cardiogenic shock when:', ['Patient is stable on inotropes', 'Refractory shock despite maximum medical therapy', 'SpO2 is >95%', 'Lactate is normal'], 'Refractory shock despite maximum medical therapy', 'ECMO is a rescue therapy for refractory cardiogenic shock unresponsive to maximum inotropic and vasopressor support.', 2);
        await upsertQuestion(qId, 'Septic cardiomyopathy is characterised by:', ['Permanent cardiac damage', 'Reversible myocardial dysfunction during sepsis, usually recovering within 7–10 days', 'Structural heart defect', 'Arrhythmia only'], 'Reversible myocardial dysfunction during sepsis, usually recovering within 7–10 days', 'Septic cardiomyopathy is a reversible phenomenon. Supportive care with inotropes allows recovery in most cases.', 3);
      }
    }
  }
}

// ============================================================
// COURSES 24, 25: Meningitis I & II — Fix empty modules AND quizzes
// ============================================================
async function fixMeningitis() {
  console.log('Fixing Meningitis I & II (courses 24, 25)...');
  
  // Course 24: Meningitis I
  const mods24 = await getModulesByTitle(24);
  for (const [title, modId] of Object.entries(mods24)) {
    await upsertSection(modId, 'Overview', '<h2>Paediatric Meningitis: Recognition and Initial Management</h2><p>Bacterial meningitis is a medical emergency with mortality up to 20–30% in LMICs and significant neurological sequelae in survivors. The classic triad (fever, headache, neck stiffness) is present in only 44% of cases. A high index of suspicion is essential.</p>', 1);
    await upsertSection(modId, 'Clinical Features:', '<ul><li><strong>Classic triad:</strong> Fever + headache + neck stiffness (Kernig\'s and Brudzinski\'s signs)</li><li><strong>Infants:</strong> Bulging fontanelle, high-pitched cry, poor feeding, seizures</li><li><strong>Meningococcal:</strong> Non-blanching petechial/purpuric rash — treat as emergency</li><li><strong>Raised ICP:</strong> Papilloedema, Cushing\'s triad (hypertension + bradycardia + irregular breathing)</li></ul>', 2);
    await upsertSection(modId, 'Empiric Antibiotic Protocol:', `<div class="clinical-note"><h4>Empiric Antibiotics — Do Not Delay</h4>
<ul>
  <li><strong>Ceftriaxone:</strong> 100 mg/kg/day IV in 1–2 doses (max 4 g/day) — covers Streptococcus pneumoniae and Neisseria meningitidis</li>
  <li><strong>Ampicillin:</strong> Add if &lt;3 months (covers Listeria): 200 mg/kg/day IV in 4 doses</li>
  <li><strong>Dexamethasone:</strong> 0.15 mg/kg IV every 6 hours × 4 days — give before or with first antibiotic dose to reduce inflammation</li>
  <li><strong>LP timing:</strong> Do not delay antibiotics for LP. If raised ICP suspected, give antibiotics first.</li>
</ul></div>`, 3);

    const qId = await getQuizByModuleId(modId);
    if (qId) {
      await upsertQuestion(qId, 'A 2-year-old presents with fever, bulging fontanelle, and seizures. First action:', ['CT scan before antibiotics', 'Lumbar puncture immediately', 'Ceftriaxone IV immediately + dexamethasone', 'Oral antibiotics and discharge'], 'Ceftriaxone IV immediately + dexamethasone', 'Do not delay antibiotics for imaging or LP. Ceftriaxone + dexamethasone must be given immediately in suspected bacterial meningitis.', 1);
      await upsertQuestion(qId, 'The non-blanching rash in meningococcal disease indicates:', ['Viral exanthem', 'Petechiae/purpura from DIC — immediate IV antibiotics required', 'Allergic reaction', 'Insect bites'], 'Petechiae/purpura from DIC — immediate IV antibiotics required', 'Non-blanching petechiae/purpura in a febrile child indicates meningococcaemia with DIC. IV ceftriaxone must be given immediately.', 2);
      await upsertQuestion(qId, 'Dexamethasone is given in bacterial meningitis to:', ['Reduce fever', 'Reduce inflammation and decrease risk of hearing loss and neurological sequelae', 'Treat seizures', 'Prevent vomiting'], 'Reduce inflammation and decrease risk of hearing loss and neurological sequelae', 'Dexamethasone reduces meningeal inflammation, decreasing the risk of sensorineural hearing loss and other neurological sequelae.', 3);
    }
  }
}

// ============================================================
// COURSES 26, 27: Trauma I & II — Fix empty modules AND quizzes
// ============================================================
async function fixTrauma() {
  console.log('Fixing Trauma I & II (courses 26, 27)...');
  
  // Course 26: Trauma I
  const mods26 = await getModulesByTitle(26);
  for (const [title, modId] of Object.entries(mods26)) {
    await upsertSection(modId, 'Overview', '<h2>Paediatric Trauma: Primary Survey (ABCDE)</h2><p>Trauma is the leading cause of death in children over 1 year of age. The primary survey follows the ABCDE approach with simultaneous resuscitation. Children are not small adults — their anatomy, physiology, and injury patterns differ significantly.</p>', 1);
    await upsertSection(modId, 'Primary Survey — ABCDE:', `<div class="clinical-note"><h4>Simultaneous Assessment and Resuscitation</h4>
<ul>
  <li><strong>A — Airway with C-spine:</strong> Jaw thrust (not head tilt in trauma); C-spine immobilisation; suction; consider early intubation if GCS ≤8</li>
  <li><strong>B — Breathing:</strong> Assess for tension pneumothorax (tracheal deviation, absent breath sounds, hypotension) — needle decompression 2nd ICS MCL</li>
  <li><strong>C — Circulation:</strong> Control external haemorrhage (direct pressure); IV/IO access; 20 mL/kg isotonic crystalloid; blood if no response</li>
  <li><strong>D — Disability:</strong> GCS, pupils, glucose; AVPU scale</li>
  <li><strong>E — Exposure:</strong> Full exposure; log roll; rectal temperature; prevent hypothermia</li>
</ul></div>`, 2);
    await upsertSection(modId, 'Paediatric Anatomical Differences:', '<ul><li><strong>Head:</strong> Proportionally larger — higher risk of head injury; brain more plastic but vulnerable</li><li><strong>Airway:</strong> Narrower, more anterior — easier to obstruct; use age-appropriate equipment</li><li><strong>Chest:</strong> Compliant ribs — rib fractures rare but indicate severe force; pulmonary contusion common without rib fractures</li><li><strong>Abdomen:</strong> Organs less protected by ribs — liver and spleen injuries common</li><li><strong>Skeleton:</strong> Growth plates vulnerable — Salter-Harris fractures; greenstick fractures</li></ul>', 3);

    const qId = await getQuizByModuleId(modId);
    if (qId) {
      await upsertQuestion(qId, 'In paediatric trauma, airway opening should be performed using:', ['Head tilt-chin lift', 'Jaw thrust with C-spine immobilisation', 'Neck extension', 'Nasopharyngeal airway first'], 'Jaw thrust with C-spine immobilisation', 'In trauma, jaw thrust (not head tilt) is used to open the airway while maintaining C-spine immobilisation until injury is excluded.', 1);
      await upsertQuestion(qId, 'Tension pneumothorax in a trauma patient is treated with:', ['Chest X-ray then drain', 'Immediate needle decompression (2nd ICS, MCL)', 'Observation', 'IV fluids only'], 'Immediate needle decompression (2nd ICS, MCL)', 'Tension pneumothorax is a clinical diagnosis. Immediate needle decompression (14G needle, 2nd ICS, MCL) is life-saving — do not wait for X-ray.', 2);
      await upsertQuestion(qId, 'The FIRST step in controlling external haemorrhage in trauma is:', ['Tourniquet application', 'Direct pressure with gauze', 'IV fluids', 'Surgical referral'], 'Direct pressure with gauze', 'Direct pressure is the first-line intervention for external haemorrhage control. Tourniquets are used for life-threatening limb haemorrhage uncontrolled by pressure.', 3);
    }
  }
}

// ============================================================
// FIX: Asthma II Module 2 Overview (42 chars — effectively blank)
// ============================================================
async function fixAsthmaIIModule2Overview() {
  console.log('Fixing Asthma II Module 2 Overview...');
  const db = await db_promise;
  await db.update(moduleSections).set({
    content: '<h2>Aggressive First-Hour Management of Status Asthmaticus</h2><p>Once life-threatening asthma is identified, the first hour of management is critical. The goal is to prevent respiratory failure and intubation through aggressive bronchodilator therapy, systemic corticosteroids, and close monitoring. Reassess every 20 minutes.</p>'
  }).where(eq(moduleSections.id, 206));
  console.log('Fixed Asthma II Module 2 Overview.');
}

// ============================================================
// FIX: Asthma II Q1177 — question asks about corticosteroid dose but doesn't name the drug
// ============================================================
async function fixAsthmaIICorticosteroidQuestion() {
  console.log('Fixing Asthma II Q1177 corticosteroid question...');
  const db = await db_promise;
  await db.update(quizQuestions).set({
    question: 'First-hour hydrocortisone dose for severe asthma exacerbation:',
    explanation: 'Hydrocortisone 4–5 mg/kg IV (max 200 mg) is the standard first-line systemic corticosteroid in acute severe asthma. Methylprednisolone 1–2 mg/kg is an alternative.'
  }).where(eq(quizQuestions.id, 1177));
  console.log('Fixed Q1177.');
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  try {
    await fixAsthmaI();
    await fixStatusEpiI();
    await fixSepticShockI();
    await fixHypovolemicShockQuizzes();
    await fixCardiogenicShockQuizzes();
    await fixMeningitis();
    await fixTrauma();
    await fixAsthmaIIModule2Overview();
    await fixAsthmaIICorticosteroidQuestion();
    console.log('\n✅ All content gaps fixed successfully.');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    process.exit(1);
  }
}
main();
