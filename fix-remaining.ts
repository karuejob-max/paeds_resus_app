/**
 * Second-Pass Fix Script
 * Fixes remaining 22 issues: empty modules (courses 3,4,5,6,7) and short sections (courses 8,16,17,18,19)
 */
import { eq } from "drizzle-orm";
import { getDb } from "./server/db";
import { moduleSections, quizzes, quizQuestions } from "./drizzle/schema";

// =====================================================================
// SHORT SECTION UPDATES (section IDs from verification output)
// =====================================================================
const SHORT_SECTION_UPDATES: Array<{ id: number; content: string }> = [
  // Course 8 (Anaphylaxis I) - Section 224 Module 118 Overview
  {
    id: 224,
    content: `<h3>Module Overview: Anaphylaxis Recognition and Grading</h3><p>Anaphylaxis is a severe, life-threatening systemic hypersensitivity reaction requiring immediate recognition and treatment. In this module, you will learn to identify the clinical features of anaphylaxis across all severity grades, distinguish it from other causes of acute deterioration, and initiate the first critical intervention — intramuscular epinephrine. Early administration of epinephrine is the single most important determinant of outcome.</p><p><strong>Learning Objectives:</strong></p><ul><li>Define anaphylaxis using WAO 2020 diagnostic criteria</li><li>Identify the clinical triad: skin/mucosal changes, respiratory compromise, cardiovascular collapse</li><li>Grade anaphylaxis severity and identify life-threatening features</li><li>Administer IM epinephrine 0.01 mg/kg (max 0.5 mg) in the anterolateral thigh</li><li>Position the patient correctly: supine with legs elevated (or sitting up if respiratory distress)</li></ul>`,
  },
  // Course 16 (Burns I) - Sections 441, 446, 451
  {
    id: 441,
    content: `<h3>Module Overview: Burn Classification and TBSA Assessment</h3><p>Accurate assessment of burn depth and total body surface area (TBSA) is the foundation of all subsequent management decisions in paediatric burns — it determines fluid resuscitation volume, wound care strategy, escharotomy need, and referral criteria. Children have different body proportions from adults, requiring age-specific TBSA calculation tools. This module covers burn depth classification, TBSA estimation using the Lund-Browder chart, and the initial clinical assessment of the burned child.</p><p><strong>Learning Objectives:</strong></p><ul><li>Classify burn depth: superficial epidermal, superficial partial thickness, deep partial thickness, full thickness</li><li>Calculate TBSA using the Lund-Browder chart (not the Rule of Nines for children under 15 years)</li><li>Identify major burn criteria: TBSA ≥10%, full thickness, face/hands/genitalia/circumferential burns</li><li>Perform primary survey: assess for airway burns, inhalation injury, carbon monoxide poisoning</li><li>Initiate first aid: cool running water for 20 minutes, cover with cling film</li></ul>`,
  },
  {
    id: 446,
    content: `<h3>Module Overview: First-Hour Fluid Resuscitation in Burns</h3><p>Fluid resuscitation is the most critical intervention in the first 24 hours of major burn management. Inadequate resuscitation leads to burn shock and organ failure; over-resuscitation causes oedema, abdominal compartment syndrome, and respiratory failure. This module covers the modified Parkland formula for paediatric burns, the addition of maintenance fluids for children, and the monitoring parameters used to guide resuscitation.</p><p><strong>Learning Objectives:</strong></p><ul><li>Calculate resuscitation fluid using the modified Parkland formula: 3–4 mL/kg/% TBSA Ringer's lactate over 24 hours</li><li>Add maintenance fluids for children using the Holliday-Segar formula</li><li>Administer half the calculated volume in the first 8 hours from time of burn (not from time of admission)</li><li>Target urine output: 0.5–1 mL/kg/hr in children, 1 mL/kg/hr in infants</li><li>Avoid colloid in the first 8–12 hours</li></ul>`,
  },
  {
    id: 451,
    content: `<h3>Module Overview: Airway Management and Burns Centre Transfer</h3><p>Inhalation injury and airway burns are the leading cause of early mortality in paediatric burns. The paediatric airway is particularly vulnerable due to its small diameter and the rapid development of mucosal oedema. Early intubation before oedema develops is critical — a window that may close within hours. This module covers the recognition of inhalation injury, indications for early intubation, carbon monoxide poisoning management, and the criteria and preparation for transfer to a specialist burns centre.</p><p><strong>Learning Objectives:</strong></p><ul><li>Identify signs of inhalation injury: singed nasal hairs, hoarse voice, stridor, carbonaceous sputum, facial burns</li><li>Perform rapid sequence intubation early before airway oedema develops</li><li>Administer 100% oxygen for carbon monoxide poisoning; consider hyperbaric oxygen if COHb >25%</li><li>Apply transfer criteria: burns >10% TBSA, face/airway burns, circumferential burns, suspected non-accidental injury</li><li>Prepare transfer documentation: fluid balance, analgesia, wound dressings, referral letter</li></ul>`,
  },
  // Course 17 (Burns II) - Sections 457, 463, 469
  {
    id: 457,
    content: `<h3>Module Overview: Fluid Resuscitation Optimisation After 24 Hours</h3><p>After the first 24 hours, fluid management in burns shifts from initial resuscitation to maintenance and replacement of ongoing losses. Colloid supplementation becomes appropriate, and the risk of fluid creep (over-resuscitation beyond the calculated Parkland volume) must be actively managed. Fluid creep is associated with abdominal compartment syndrome, pulmonary oedema, and increased mortality. This module covers the transition from crystalloid to colloid, albumin use in burns resuscitation, and the management of oedema and abdominal compartment syndrome.</p><p><strong>Learning Objectives:</strong></p><ul><li>Transition to colloid after 8–12 hours: 5% albumin 0.3–1 mL/kg/% TBSA over 24 hours</li><li>Reduce crystalloid rate to avoid fluid creep</li><li>Monitor for abdominal compartment syndrome: bladder pressure, abdominal distension, rising peak airway pressures</li><li>Manage pulmonary oedema: diuretics, ventilator optimisation</li><li>Target: urine output 0.5–1 mL/kg/hr, no progressive oedema</li></ul>`,
  },
  {
    id: 463,
    content: `<h3>Module Overview: Burns Complications and Infection Management</h3><p>Major burns are associated with a profound systemic inflammatory response that affects every organ system. The loss of the skin barrier creates a portal for infection, and burn wound sepsis is the leading cause of late mortality in burns patients. This module covers the most clinically significant complications: burn wound infection and sepsis, inhalation injury-related ARDS, acute kidney injury, and the hypermetabolic response. Early enteral nutrition and structured infection surveillance are key management priorities.</p><p><strong>Learning Objectives:</strong></p><ul><li>Identify signs of burn wound infection: cellulitis, purulent exudate, fever, leucocytosis, wound conversion</li><li>Initiate empiric antibiotics for burn sepsis: piperacillin-tazobactam + amikacin, guided by wound swab cultures</li><li>Manage ARDS: lung-protective ventilation, prone positioning for severe ARDS</li><li>Prevent AKI: maintain urine output, avoid nephrotoxic agents, monitor creatinine daily</li><li>Start enteral nutrition within 6 hours of admission to reduce hypermetabolism</li></ul>`,
  },
  {
    id: 469,
    content: `<h3>Module Overview: Nutritional Support and Rehabilitation in Burns</h3><p>The hypermetabolic response to major burns can increase energy expenditure by 100–200% above baseline, persisting for up to 2 years after injury. Aggressive nutritional support is essential to prevent muscle wasting, impaired wound healing, and immune dysfunction. This module covers caloric and protein requirements in paediatric burns, enteral versus parenteral nutrition, wound care principles, and the long-term rehabilitation plan for paediatric burn survivors.</p><p><strong>Learning Objectives:</strong></p><ul><li>Calculate caloric requirements using the Galveston formula: 1800 kcal/m² TBSA burned + 1500 kcal/m² total BSA</li><li>Target protein intake: 2.5–4 g/kg/day</li><li>Prefer enteral over parenteral nutrition; use nasogastric or nasojejunal feeding if oral intake inadequate</li><li>Use anabolic agents to reduce hypermetabolism: oxandrolone 0.1 mg/kg/day, propranolol 0.5–4 mg/kg/day</li><li>Plan surgical wound coverage: skin grafting, dermal substitutes (Integra), donor site care</li></ul>`,
  },
  // Course 18 (Cardiogenic Shock I) - Sections 286, 291, 296
  {
    id: 286,
    content: `<h3>Module Overview: Cardiogenic Shock Recognition</h3><p>Cardiogenic shock is a state of low cardiac output resulting in inadequate tissue perfusion, despite adequate or elevated intravascular volume. It is the most haemodynamically complex form of shock and carries the highest mortality of all shock types. In children, the most common causes are myocarditis, congenital heart disease, and arrhythmias. Early recognition and differentiation from distributive and hypovolemic shock is essential — aggressive fluid loading in cardiogenic shock worsens outcomes by increasing cardiac afterload and causing pulmonary oedema.</p><p><strong>Learning Objectives:</strong></p><ul><li>Define cardiogenic shock and distinguish from distributive and hypovolemic shock</li><li>Identify clinical features: tachycardia, poor perfusion, hepatomegaly, gallop rhythm, raised JVP, pulmonary oedema</li><li>Interpret bedside echocardiography: reduced EF, dilated ventricle, pericardial effusion</li><li>Identify common paediatric causes: myocarditis, dilated cardiomyopathy, ALCAPA, arrhythmia</li><li>Initiate first-line stabilisation: oxygen, cautious fluid (5–10 mL/kg), inotrope preparation</li></ul>`,
  },
  {
    id: 291,
    content: `<h3>Module Overview: First-Line Inotrope Therapy</h3><p>Inotropic support is the cornerstone of cardiogenic shock management. The goal is to increase cardiac contractility and improve cardiac output without excessively increasing myocardial oxygen demand. This module covers the pharmacology, dosing, and monitoring of first-line inotropes in paediatric cardiogenic shock: dobutamine and milrinone. The selection between these agents depends on the haemodynamic profile — specifically whether systemic vascular resistance is elevated or reduced.</p><p><strong>Learning Objectives:</strong></p><ul><li>Select inotrope based on haemodynamic profile: dobutamine for high SVR, milrinone for elevated filling pressures</li><li>Initiate dobutamine: 5–20 mcg/kg/min IV infusion, titrate to effect</li><li>Initiate milrinone: 0.25–0.75 mcg/kg/min IV infusion (no loading dose in haemodynamically unstable patients)</li><li>Monitor response: HR, BP, CRT, urine output, lactate</li><li>Recognise inotrope failure: no improvement after 30–60 minutes at target dose</li></ul>`,
  },
  {
    id: 296,
    content: `<h3>Module Overview: Arrhythmia Management in Cardiogenic Shock</h3><p>Arrhythmias are both a cause and a consequence of cardiogenic shock. Tachyarrhythmias (SVT, VT) reduce diastolic filling time and cardiac output; bradyarrhythmias (complete heart block) reduce cardiac output directly. Prompt identification and treatment of the underlying arrhythmia is essential — in many cases, restoring normal rhythm will resolve the haemodynamic compromise without the need for inotropes. This module covers the recognition and emergency management of arrhythmias causing cardiogenic shock in children.</p><p><strong>Learning Objectives:</strong></p><ul><li>Identify SVT on ECG: narrow complex, rate >220 bpm in infants, >180 bpm in older children, no P waves</li><li>Treat SVT: vagal manoeuvres → adenosine 0.1 mg/kg IV (max 6 mg, repeat 0.2 mg/kg) → synchronised cardioversion 0.5–1 J/kg</li><li>Identify VT: wide complex tachycardia, rate >120 bpm</li><li>Treat pulseless VT: defibrillation 2 J/kg → CPR → adrenaline → amiodarone 5 mg/kg</li><li>Manage complete heart block: transcutaneous pacing → transvenous pacing</li></ul>`,
  },
  // Course 19 (Cardiogenic Shock II) - Sections 301, 306, 312
  {
    id: 301,
    content: `<h3>Module Overview: Advanced Inotrope Combinations in Refractory Cardiogenic Shock</h3><p>When first-line inotrope therapy fails to restore adequate cardiac output, combination inotrope strategies and mechanical circulatory support must be considered. This module covers the pharmacology and dosing of second-line inotropes, the rationale for combination therapy, and the indications for escalation to mechanical circulatory support devices including ECMO. The decision to escalate must be made early — delayed escalation is associated with worse outcomes and may preclude ECMO candidacy.</p><p><strong>Learning Objectives:</strong></p><ul><li>Identify failure criteria for first-line inotrope therapy: persistent shock, rising lactate, worsening organ function</li><li>Add vasopressin 0.0003–0.002 units/kg/min for vasoplegic component of cardiogenic shock</li><li>Combine milrinone + noradrenaline for low-output, low-resistance states</li><li>Recognise indications for IABP, VAD, or ECMO: refractory shock despite two inotropes</li><li>Prepare for urgent cardiac catheterisation or surgical intervention</li></ul>`,
  },
  {
    id: 306,
    content: `<h3>Module Overview: ECMO Support for Refractory Cardiogenic Shock</h3><p>Extracorporeal membrane oxygenation (ECMO) is the ultimate rescue therapy for refractory cardiogenic shock unresponsive to maximal medical therapy. Venoarterial ECMO (VA-ECMO) provides both cardiac and respiratory support, allowing the heart to rest and recover. In paediatric centres with ECMO capability, early activation of the ECMO team when first-line therapy fails is associated with improved survival. This module covers ECMO indications, contraindications, cannulation strategies, and the management of common ECMO complications.</p><p><strong>Learning Objectives:</strong></p><ul><li>Define ECMO indications: refractory cardiogenic shock, cardiac arrest (ECPR), bridge to transplant/recovery</li><li>Identify absolute contraindications: irreversible multi-organ failure, severe neurological injury, uncontrolled haemorrhage</li><li>Understand VA-ECMO circuit: cannula placement, flow rates, anticoagulation with heparin (target ACT 180–220 sec)</li><li>Recognise ECMO complications: bleeding, thrombosis, limb ischaemia, infection, haemolysis</li><li>Plan ECMO weaning: trial off when EF improves, reduce flow gradually</li></ul>`,
  },
  {
    id: 312,
    content: `<h3>Module Overview: Specific Cardiogenic Shock Scenarios</h3><p>Different underlying causes of cardiogenic shock require tailored management approaches. A one-size-fits-all protocol is inadequate — the management of acute myocarditis differs from arrhythmia-induced shock, which differs from post-cardiac surgery low cardiac output syndrome. This module covers three high-priority scenarios in paediatric cardiogenic shock, each with distinct management priorities and common pitfalls to avoid.</p><p><strong>Learning Objectives:</strong></p><ul><li>Manage acute myocarditis: avoid digoxin (proarrhythmic), use milrinone, consider IVIG 2 g/kg for inflammatory myocarditis</li><li>Treat SVT causing cardiogenic shock: adenosine first, synchronised cardioversion if haemodynamically compromised</li><li>Manage post-cardiac surgery low output syndrome: optimise preload, reduce afterload with milrinone, consider pacing for bradycardia</li><li>Identify when to activate cardiac transplant listing: refractory shock, no recovery on ECMO after 2 weeks</li><li>Coordinate multi-disciplinary team: cardiology, cardiac surgery, PICU, transplant team</li></ul>`,
  },
];

// =====================================================================
// MODULES NEEDING SECTIONS FROM SCRATCH (remaining empty modules)
// =====================================================================
const EMPTY_MODULES: Array<{
  moduleId: number;
  label: string;
  sections: Array<{ title: string; content: string; order: number }>;
}> = [
  {
    moduleId: 1, // Course 3: Systematic approach - Module 1
    label: "Systematic Approach to a Seriously Ill Child - Module 1",
    sections: [
      {
        title: "Overview",
        order: 0,
        content: `<h3>Module Overview: Primary Assessment and Stabilisation</h3><p>The systematic approach to a seriously ill child uses the ABCDE framework to rapidly identify and simultaneously treat life-threatening conditions. This structured approach ensures that no critical problem is missed and that interventions are prioritised by urgency. In paediatric emergencies, assessment and treatment occur in parallel — you do not complete the full assessment before starting treatment.</p><p><strong>Learning Objectives:</strong></p><ul><li>Apply the ABCDE framework: Airway, Breathing, Circulation, Disability, Exposure</li><li>Identify and treat life-threatening conditions at each step before proceeding</li><li>Perform a structured primary survey in under 60 seconds</li><li>Recognise when to activate the cardiac arrest pathway</li><li>Communicate findings using SBAR: Situation, Background, Assessment, Recommendation</li></ul>`,
      },
      {
        title: "Airway Assessment",
        order: 1,
        content: `<h3>A — Airway Assessment and Management</h3><p><strong>Look, Listen, Feel:</strong></p><ul><li><strong>Look:</strong> Is the child moving air? Chest rise? Use of accessory muscles? Tracheal tug? Head bobbing?</li><li><strong>Listen:</strong> Stridor (upper airway obstruction), wheeze (lower airway), gurgling (secretions), silence (complete obstruction)</li><li><strong>Feel:</strong> Air movement at mouth/nose</li></ul><p><strong>Airway Opening Manoeuvres:</strong></p><ul><li>Head tilt-chin lift (no trauma) OR jaw thrust (trauma)</li><li>Suction: clear secretions, blood, vomit</li><li>Airway adjuncts: oropharyngeal airway (OPA) — size = corner of mouth to earlobe</li><li>Nasopharyngeal airway (NPA) — better tolerated in conscious patients</li></ul><p><strong>When to Intubate:</strong></p><ul><li>GCS ≤8 (cannot protect airway)</li><li>Airway burns or expanding neck haematoma</li><li>Respiratory failure despite airway opening manoeuvres</li><li>Anticipated deterioration</li></ul><p><strong>Immediate Action:</strong> If airway is obstructed and cannot be opened → call for help immediately, prepare for RSI.</p>`,
      },
      {
        title: "Breathing and Circulation Assessment",
        order: 2,
        content: `<h3>B — Breathing and C — Circulation Assessment</h3><p><strong>Breathing (B):</strong></p><ul><li>Respiratory rate (age-appropriate norms): Infant 30–60, Toddler 24–40, School-age 18–30, Adolescent 12–20</li><li>Work of breathing: nasal flaring, subcostal/intercostal/suprasternal recession, grunting, head bobbing</li><li>Auscultation: equal air entry, wheeze, crackles, absent breath sounds</li><li>SpO2: target ≥94% (≥90% in neonates)</li><li>Administer oxygen: non-rebreather mask 10–15 L/min for SpO2 &lt;94%</li></ul><p><strong>Circulation (C):</strong></p><ul><li>Heart rate (age-appropriate norms): Infant 100–160, Toddler 90–150, School-age 70–120, Adolescent 60–100</li><li>Capillary refill time (CRT): &gt;2 seconds = abnormal (central CRT most reliable)</li><li>Skin colour and temperature: mottling, pallor, cyanosis, cold peripheries</li><li>Blood pressure: hypotension is a LATE sign in children</li><li>Pulse quality: weak/thready = poor cardiac output</li><li>Obtain IV/IO access: give 10–20 mL/kg 0.9% NaCl bolus if shocked</li></ul>`,
      },
      {
        title: "Disability and Exposure",
        order: 3,
        content: `<h3>D — Disability and E — Exposure</h3><p><strong>Disability (D) — Neurological Assessment:</strong></p><ul><li><strong>AVPU scale:</strong> Alert, Voice (responds to voice), Pain (responds to pain), Unresponsive</li><li><strong>GCS:</strong> Eye (4), Verbal (5), Motor (6) — total 15. GCS ≤8 = intubate</li><li><strong>Pupils:</strong> Size, equality, reactivity — unequal fixed dilated pupils = herniation</li><li><strong>Blood glucose:</strong> Check immediately — hypoglycaemia mimics neurological deterioration</li><li><strong>Posturing:</strong> Decorticate (flexion) or decerebrate (extension) = severe brain injury</li></ul><p><strong>Exposure (E):</strong></p><ul><li>Fully expose the child: remove all clothing</li><li>Examine: rashes (petechiae/purpura = meningococcal), wounds, bruising, distension</li><li>Temperature: fever or hypothermia</li><li>Prevent hypothermia: warm blankets, warm IV fluids</li></ul><p><strong>After Primary Survey:</strong></p><ul><li>Reassess from A after every intervention</li><li>Secondary survey: head-to-toe examination once stabilised</li><li>Document findings and communicate using SBAR</li><li>Escalate early: do not wait for full deterioration</li></ul>`,
      },
    ],
  },
  {
    moduleId: 2, // Course 4: Septic Shock I - Module 2 (Recognition)
    label: "Septic Shock I - Module 2: Recognition",
    sections: [
      {
        title: "Overview",
        order: 0,
        content: `<h3>Module Overview: Recognising Septic Shock</h3><p>Septic shock is the most common cause of shock in paediatric patients worldwide and a leading cause of preventable childhood mortality. Early recognition is the single most important factor in improving outcomes — every hour of delay in antibiotic administration increases mortality by 7%. This module covers the clinical recognition of sepsis and septic shock using the Surviving Sepsis Campaign 2020 paediatric criteria, the clinical signs of warm versus cold shock, and the initial bedside assessment.</p><p><strong>Learning Objectives:</strong></p><ul><li>Apply the Surviving Sepsis Campaign 2020 paediatric sepsis definition</li><li>Distinguish warm shock (distributive) from cold shock (low cardiac output)</li><li>Identify organ dysfunction: respiratory, cardiovascular, neurological, renal, haematological</li><li>Perform a rapid bedside assessment: ABCDE + point-of-care lactate</li><li>Recognise meningococcal disease: non-blanching petechial/purpuric rash</li></ul>`,
      },
      {
        title: "Sepsis Definition and Recognition",
        order: 1,
        content: `<h3>Paediatric Sepsis: Definition and Clinical Recognition</h3><p><strong>Surviving Sepsis Campaign 2020 Paediatric Definition:</strong> Sepsis is a life-threatening organ dysfunction caused by a dysregulated host response to infection. In children, it is defined as infection with ≥2 age-adjusted SIRS criteria OR organ dysfunction criteria.</p><p><strong>Septic Shock:</strong> Sepsis with cardiovascular dysfunction requiring vasopressors to maintain MAP ≥5th percentile for age, OR lactate &gt;2 mmol/L despite adequate fluid resuscitation.</p><p><strong>Clinical Signs of Septic Shock:</strong></p><table><tr><th>Feature</th><th>Warm Shock (Distributive)</th><th>Cold Shock (Low Output)</th></tr><tr><td>Skin</td><td>Warm, flushed, vasodilated</td><td>Cold, mottled, cyanotic</td></tr><tr><td>CRT</td><td>&lt;2 sec (flash)</td><td>&gt;2 sec (prolonged)</td></tr><tr><td>Pulse</td><td>Bounding</td><td>Weak, thready</td></tr><tr><td>BP</td><td>Wide pulse pressure</td><td>Narrow pulse pressure</td></tr></table><p><strong>Organ Dysfunction Indicators:</strong></p><ul><li><strong>Respiratory:</strong> SpO2 &lt;94%, increased work of breathing, PaO2/FiO2 &lt;300</li><li><strong>Cardiovascular:</strong> Tachycardia, hypotension, poor perfusion, lactate &gt;2 mmol/L</li><li><strong>Neurological:</strong> Altered consciousness, GCS &lt;14, AVPU &lt;A</li><li><strong>Renal:</strong> Urine output &lt;0.5 mL/kg/hr, rising creatinine</li><li><strong>Haematological:</strong> Thrombocytopenia, coagulopathy, petechiae/purpura</li></ul>`,
      },
      {
        title: "Sepsis Mimics and Differential Diagnosis",
        order: 2,
        content: `<h3>Sepsis Mimics and Differential Diagnosis</h3><p>Not all critically ill children with fever and shock have sepsis. Recognising sepsis mimics prevents inappropriate antibiotic use and ensures the correct diagnosis is treated promptly.</p><p><strong>Key Differential Diagnoses:</strong></p><ul><li><strong>Toxic Shock Syndrome (TSS):</strong> Staphylococcal or streptococcal toxin-mediated — diffuse erythroderma, mucous membrane changes, multi-organ failure. Treat with clindamycin + beta-lactam.</li><li><strong>Kawasaki Disease:</strong> Fever &gt;5 days + ≥4 of: rash, conjunctivitis, oral changes, lymphadenopathy, hand/foot changes. Risk of coronary artery aneurysm. Treat with IVIG + aspirin.</li><li><strong>Anaphylaxis:</strong> Acute onset, allergen exposure, urticaria/angioedema, bronchospasm. Treat with IM epinephrine.</li><li><strong>DKA:</strong> Hyperglycaemia, ketonaemia, acidosis. Kussmaul breathing may mimic septic respiratory distress.</li><li><strong>Meningococcal Disease:</strong> Non-blanching petechial/purpuric rash — treat as septic shock AND meningitis until proven otherwise. Give ceftriaxone immediately.</li><li><strong>Haemophagocytic Lymphohistiocytosis (HLH):</strong> Prolonged fever, hepatosplenomegaly, cytopenias, hyperferritinaemia (&gt;500 mcg/L).</li></ul>`,
      },
    ],
  },
  {
    moduleId: 3, // Course 4: Septic Shock I - Module 3 (First-Hour Safe Actions)
    label: "Septic Shock I - Module 3: First-Hour Safe Actions",
    sections: [
      {
        title: "Overview",
        order: 0,
        content: `<h3>Module Overview: First-Hour Safe Actions in Septic Shock</h3><p>The first hour of septic shock management is the most critical determinant of outcome. The Surviving Sepsis Campaign Hour-1 Bundle provides a structured set of interventions that must be initiated immediately upon recognition of septic shock. This module covers the five components of the Hour-1 Bundle, the evidence base for each intervention, and the practical implementation in resource-limited settings.</p><p><strong>Learning Objectives:</strong></p><ul><li>Obtain IV/IO access and draw blood cultures before antibiotics</li><li>Administer broad-spectrum antibiotics within 1 hour of recognition</li><li>Initiate fluid resuscitation: 10–20 mL/kg 0.9% NaCl bolus, reassess after each</li><li>Measure lactate: target &lt;2 mmol/L after resuscitation</li><li>Apply vasopressors if fluid-refractory shock: noradrenaline 0.1–1 mcg/kg/min</li></ul>`,
      },
      {
        title: "Hour-1 Bundle Implementation",
        order: 1,
        content: `<h3>Surviving Sepsis Campaign Hour-1 Bundle</h3><p><strong>1. Measure Lactate:</strong> Point-of-care lactate immediately. Lactate &gt;2 mmol/L = tissue hypoperfusion. Lactate &gt;4 mmol/L = high mortality risk. Remeasure after 2 hours of resuscitation — lactate clearance ≥10% is a positive prognostic sign.</p><p><strong>2. Blood Cultures Before Antibiotics:</strong> Draw ≥2 sets of blood cultures (aerobic + anaerobic) before antibiotic administration. Do NOT delay antibiotics &gt;45 minutes to obtain cultures. Also consider: urine culture, CSF (if safe), wound swabs.</p><p><strong>3. Broad-Spectrum Antibiotics Within 1 Hour:</strong></p><ul><li><strong>Community-acquired sepsis:</strong> Ceftriaxone 100 mg/kg/day IV (max 4g) ± metronidazole if abdominal source</li><li><strong>Hospital-acquired/ICU:</strong> Piperacillin-tazobactam 300 mg/kg/day IV + amikacin 15–20 mg/kg/day IV</li><li><strong>Meningococcal disease:</strong> Ceftriaxone 100 mg/kg/day IV immediately</li><li><strong>Immunocompromised:</strong> Meropenem 60 mg/kg/day IV + antifungal coverage</li></ul><p><strong>4. Fluid Resuscitation:</strong> 10–20 mL/kg 0.9% NaCl or Ringer's lactate bolus over 5–10 minutes. Reassess after each bolus. Stop if: improvement in HR/CRT/BP, or signs of fluid overload (hepatomegaly, crackles, worsening SpO2). Maximum 40–60 mL/kg in first hour.</p><p><strong>5. Vasopressors if Fluid-Refractory:</strong> Noradrenaline 0.1–1 mcg/kg/min as first-line vasopressor. Add vasopressin 0.0003–0.002 units/kg/min for refractory hypotension. Target MAP ≥5th percentile for age.</p>`,
      },
      {
        title: "Antibiotic Selection by Source",
        order: 2,
        content: `<h3>Antibiotic Selection by Suspected Source</h3><p>Empiric antibiotic selection should cover the most likely pathogens based on the suspected source of infection, patient age, immune status, and local resistance patterns. De-escalation should occur within 48–72 hours based on culture results.</p><table><tr><th>Suspected Source</th><th>Likely Pathogens</th><th>Empiric Regimen</th></tr><tr><td>Unknown/Community</td><td>Streptococcus, Staphylococcus, Gram-negatives</td><td>Ceftriaxone 100 mg/kg/day IV</td></tr><tr><td>Meningitis/Meningococcal</td><td>N. meningitidis, S. pneumoniae, H. influenzae</td><td>Ceftriaxone 100 mg/kg/day + dexamethasone 0.15 mg/kg</td></tr><tr><td>Abdominal</td><td>Enterobacteriaceae, Bacteroides, Enterococcus</td><td>Piperacillin-tazobactam + metronidazole</td></tr><tr><td>Respiratory</td><td>S. pneumoniae, S. aureus, atypicals</td><td>Ceftriaxone + azithromycin</td></tr><tr><td>Urinary</td><td>E. coli, Klebsiella, Pseudomonas</td><td>Ceftriaxone (community) or pip-tazo (hospital)</td></tr><tr><td>Skin/Soft Tissue</td><td>S. aureus (MRSA risk), Streptococcus</td><td>Cloxacillin + clindamycin (or vancomycin if MRSA)</td></tr><tr><td>Neonatal (&lt;28 days)</td><td>GBS, E. coli, Listeria, S. aureus</td><td>Ampicillin + gentamicin</td></tr></table>`,
      },
    ],
  },
  {
    moduleId: 4, // Course 4: Septic Shock I - Module 4 (When to Refer)
    label: "Septic Shock I - Module 4: When to Refer",
    sections: [
      {
        title: "Overview",
        order: 0,
        content: `<h3>Module Overview: Escalation and Referral Criteria in Septic Shock</h3><p>Knowing when to escalate care and refer to a higher level of care is as important as knowing how to initiate treatment. Delayed escalation is a common cause of preventable mortality in paediatric sepsis. This module covers the criteria for PICU admission, the preparation for safe transfer, and the documentation required for effective handover. Special attention is given to the resource-limited setting where PICU may not be immediately available.</p><p><strong>Learning Objectives:</strong></p><ul><li>Apply PICU admission criteria: fluid-refractory shock, respiratory failure, altered consciousness, multi-organ dysfunction</li><li>Prepare for safe transfer: stabilise airway, establish IV access, document fluid balance and interventions</li><li>Communicate effectively using SBAR handover</li><li>Manage the patient during transfer: monitoring, vasopressor infusions, airway management</li><li>Identify when to initiate vasopressors before transfer in resource-limited settings</li></ul>`,
      },
      {
        title: "PICU Admission Criteria",
        order: 1,
        content: `<h3>PICU Admission Criteria and Escalation Thresholds</h3><p><strong>Immediate PICU Admission Criteria (any one):</strong></p><ul><li>Fluid-refractory shock: persistent haemodynamic instability after 40–60 mL/kg IV fluid</li><li>Vasopressor requirement: noradrenaline or dopamine infusion</li><li>Respiratory failure: SpO2 &lt;90% on high-flow oxygen, increasing work of breathing, PaCO2 &gt;50 mmHg</li><li>Altered consciousness: GCS ≤12, AVPU &lt;V, seizures</li><li>Multi-organ dysfunction: ≥2 organ systems affected</li><li>Lactate &gt;4 mmol/L despite 2 hours of resuscitation</li><li>Meningococcal disease with purpuric rash</li></ul><p><strong>Urgent PICU Review (within 1 hour):</strong></p><ul><li>Fluid-responsive shock requiring &gt;40 mL/kg fluid</li><li>Lactate 2–4 mmol/L</li><li>Single organ dysfunction</li><li>Immunocompromised patient with sepsis</li><li>Neonatal sepsis</li></ul><p><strong>Ward-Level Management (with close monitoring):</strong></p><ul><li>Sepsis without shock (responsive to first 20 mL/kg fluid bolus)</li><li>Lactate &lt;2 mmol/L</li><li>No organ dysfunction</li><li>Clinically improving after initial treatment</li></ul>`,
      },
      {
        title: "Safe Transfer Preparation",
        order: 2,
        content: `<h3>Preparing for Safe Transfer to PICU</h3><p>The transfer of a critically ill child is a high-risk period. Deterioration during transfer is common and often preventable with adequate preparation. The goal is to ensure the patient is as stable as possible before leaving the referring unit.</p><p><strong>Pre-Transfer Checklist:</strong></p><ul><li>✅ Airway secured: intubate if GCS ≤8, respiratory failure, or anticipated deterioration during transfer</li><li>✅ IV/IO access: minimum 2 secure access points, flushed and functional</li><li>✅ Vasopressor infusions running and labelled</li><li>✅ Monitoring attached: SpO2, ECG, NIBP, capnography (if intubated)</li><li>✅ Blood glucose checked and treated if abnormal</li><li>✅ Antibiotics administered</li><li>✅ Fluid balance documented: input/output from time of presentation</li><li>✅ Investigations sent: FBC, U&E, LFTs, coagulation, blood cultures, lactate</li><li>✅ SBAR handover prepared and communicated to receiving team</li><li>✅ Family informed and consent obtained</li></ul><p><strong>SBAR Handover Template:</strong></p><ul><li><strong>S (Situation):</strong> "[Patient name], [age], presenting with septic shock. Currently on [vasopressor] at [dose], SpO2 [X]% on [oxygen delivery]."</li><li><strong>B (Background):</strong> "Presented [X] hours ago with [symptoms]. Known history of [conditions]. Allergies: [list]."</li><li><strong>A (Assessment):</strong> "Fluid-refractory septic shock, likely source [X]. Lactate [X] mmol/L. Received [total fluid], [antibiotics]."</li><li><strong>R (Recommendation):</strong> "Requires urgent PICU admission for vasopressor management and close monitoring. Please prepare bed and PICU team."</li></ul>`,
      },
    ],
  },
  {
    moduleId: 5, // Course 5: Intubation Essentials - Module 5
    label: "Intubation Essentials - Module 5",
    sections: [
      {
        title: "Overview",
        order: 0,
        content: `<h3>Module Overview: Intubation Preparation, Procedure, and Post-Intubation Safety</h3><p>Paediatric intubation is a high-stakes procedure that requires meticulous preparation, a structured approach, and immediate post-intubation safety checks. Errors in paediatric intubation — wrong tube size, unrecognised oesophageal intubation, right main bronchus intubation — can be rapidly fatal. This module covers the SOAP-ME preparation framework, the RSI procedure step-by-step, and the post-intubation safety bundle.</p><p><strong>Learning Objectives:</strong></p><ul><li>Apply the SOAP-ME preparation checklist: Suction, Oxygen, Airway equipment, Pharmacy, Monitoring/Equipment</li><li>Calculate correct ETT size: (age/4) + 4 for uncuffed, (age/4) + 3.5 for cuffed</li><li>Perform RSI: pre-oxygenation → drugs → laryngoscopy → intubation → confirmation</li><li>Confirm tube position: capnography (gold standard), bilateral chest auscultation, CXR</li><li>Secure tube and initiate lung-protective ventilation settings</li></ul>`,
      },
      {
        title: "SOAP-ME Preparation",
        order: 1,
        content: `<h3>SOAP-ME: Pre-Intubation Preparation Checklist</h3><p>Preparation is the most important phase of paediatric intubation. The SOAP-ME mnemonic ensures all essential equipment and drugs are ready before the procedure begins.</p><p><strong>S — Suction:</strong> Yankauer suction catheter, turned on and within reach. Suction pressure 80–120 mmHg.</p><p><strong>O — Oxygen:</strong> 100% oxygen via non-rebreather mask for 3–5 minutes pre-oxygenation. Target SpO2 &gt;95% before induction. BVM with PEEP valve attached and tested.</p><p><strong>A — Airway Equipment:</strong></p><ul><li>ETT: correct size + one size above + one size below</li><li>ETT size formula: Uncuffed = (age/4) + 4; Cuffed = (age/4) + 3.5</li><li>Laryngoscope: Miller (straight) blade for infants, Macintosh (curved) for older children</li><li>Stylet (optional), 10 mL syringe for cuff inflation</li><li>Rescue airway: LMA (size by weight), surgical airway kit</li></ul><p><strong>P — Pharmacy (RSI Drugs):</strong></p><ul><li>Sedation: Ketamine 1–2 mg/kg IV (preferred — maintains airway reflexes, bronchodilator)</li><li>Paralysis: Succinylcholine 1–2 mg/kg IV (rapid onset, short duration) OR Rocuronium 1.2 mg/kg IV</li><li>Atropine: 0.02 mg/kg IV (min 0.1 mg) for children &lt;1 year or if bradycardia anticipated</li><li>Post-intubation sedation: Midazolam 0.1 mg/kg + morphine 0.1 mg/kg</li></ul><p><strong>M — Monitoring:</strong> SpO2, ECG, NIBP, capnography ready before induction.</p><p><strong>E — Equipment Check:</strong> Ventilator set up with initial settings, ETT holder/tape ready, CXR ordered.</p>`,
      },
      {
        title: "RSI Procedure and Post-Intubation Care",
        order: 2,
        content: `<h3>RSI Procedure and Post-Intubation Safety Bundle</h3><p><strong>RSI Step-by-Step:</strong></p><ol><li><strong>Position:</strong> Sniffing position (neutral in infants, slight extension in older children). Shoulder roll for infants.</li><li><strong>Pre-oxygenate:</strong> 100% O2 via NRM or BVM for 3–5 minutes. Apply CPAP 5–10 cmH2O if available.</li><li><strong>Cricoid pressure:</strong> Apply Sellick's manoeuvre (controversial — use only if trained).</li><li><strong>Administer drugs:</strong> Atropine (if indicated) → ketamine → succinylcholine/rocuronium. Wait for fasciculations to cease (succinylcholine) or 60 seconds (rocuronium).</li><li><strong>Laryngoscopy:</strong> Hold laryngoscope in left hand. Insert blade, lift tongue, visualise cords. Do not rock on teeth.</li><li><strong>Intubate:</strong> Pass ETT through cords under direct vision. Advance until cuff just below cords.</li><li><strong>Confirm:</strong> Attach capnography — 6 waveforms = tracheal placement. Auscultate bilaterally. Check SpO2.</li><li><strong>Secure:</strong> Tape ETT at lip. Note depth at lip (approx: age/2 + 12 cm for oral ETT).</li></ol><p><strong>Post-Intubation Safety Bundle:</strong></p><ul><li>CXR: confirm ETT tip at T2–T3 (2–3 cm above carina)</li><li>Ventilator settings: TV 6–8 mL/kg IBW, RR age-appropriate, PEEP 5 cmH2O, FiO2 titrate to SpO2 94–98%</li><li>Sedation: adequate analgesia and sedation to prevent self-extubation</li><li>NG tube: decompress stomach</li><li>Document: ETT size, depth, drugs used, any complications</li></ul><p><strong>Failed Intubation Plan:</strong> If unable to intubate after 2 attempts → insert LMA → call for senior help → prepare for surgical airway (needle cricothyrotomy in children &lt;8 years).</p>`,
      },
    ],
  },
  {
    moduleId: 8, // Course 6: Asthma I - Module 8 (Escalation and ICU Readiness)
    label: "Asthma I - Module 3: Escalation and ICU Readiness",
    sections: [
      {
        title: "Overview",
        order: 0,
        content: `<h3>Module Overview: Escalation and ICU Readiness in Severe Asthma</h3><p>When first and second-line bronchodilator therapy fails to control severe asthma, escalation to ICU-level care is required. The decision to escalate must be made proactively — waiting until the child is in extremis significantly increases the risk of a difficult intubation and poor outcome. This module covers the criteria for ICU admission, the preparation for intubation in severe asthma, and the management of the intubated asthmatic child.</p><p><strong>Learning Objectives:</strong></p><ul><li>Identify criteria for ICU admission: failure to respond to IV magnesium, rising PaCO2, exhaustion</li><li>Prepare for RSI in severe asthma: ketamine as induction agent, avoid propofol</li><li>Initiate lung-protective ventilation: low RR, long expiratory time, permissive hypercapnia</li><li>Recognise and manage dynamic hyperinflation and auto-PEEP</li><li>Manage intubation complications: tension pneumothorax, haemodynamic collapse</li></ul>`,
      },
      {
        title: "ICU Admission Criteria",
        order: 1,
        content: `<h3>ICU Admission Criteria and Escalation Thresholds</h3><p><strong>Immediate ICU Admission (any one feature):</strong></p><ul><li>Silent chest (no wheeze despite respiratory distress — complete obstruction)</li><li>SpO2 &lt;92% despite high-flow oxygen</li><li>Cyanosis</li><li>Exhaustion, poor respiratory effort, reduced consciousness</li><li>Rising PaCO2 ≥40 mmHg in a distressed child (normal PaCO2 in severe asthma = impending failure)</li><li>Failure to respond to IV magnesium sulphate</li><li>Pulsus paradoxus &gt;25 mmHg</li></ul><p><strong>Urgent ICU Review (within 30 minutes):</strong></p><ul><li>SpO2 92–94% on high-flow oxygen</li><li>Moderate-severe respiratory distress despite continuous nebulised salbutamol</li><li>IV salbutamol infusion required</li><li>PaCO2 35–40 mmHg (normal range = concerning in severe asthma)</li></ul><p><strong>Pre-ICU Stabilisation:</strong></p><ul><li>Continue continuous nebulised salbutamol</li><li>Ensure IV access × 2</li><li>Administer IV magnesium if not already given</li><li>Prepare RSI drugs: ketamine 1–2 mg/kg + rocuronium 1.2 mg/kg</li><li>Notify anaesthesia and PICU team early</li></ul>`,
      },
      {
        title: "Intubation and Ventilation in Severe Asthma",
        order: 2,
        content: `<h3>Intubation and Ventilation Strategy in Severe Asthma</h3><p><strong>RSI in Severe Asthma — Key Considerations:</strong></p><ul><li><strong>Induction agent:</strong> Ketamine 1–2 mg/kg IV — bronchodilator, maintains haemodynamics, preserves airway reflexes. AVOID propofol (histamine release, hypotension).</li><li><strong>Paralytic:</strong> Rocuronium 1.2 mg/kg IV (preferred) or succinylcholine 1–2 mg/kg</li><li><strong>Pre-oxygenate aggressively:</strong> 100% O2 for 5 minutes. Apply CPAP 5–10 cmH2O if tolerated.</li><li><strong>ETT size:</strong> Use largest appropriate size to reduce airway resistance</li><li><strong>Anticipate haemodynamic collapse:</strong> Have adrenaline 10 mcg/kg IV ready</li></ul><p><strong>Ventilation Strategy for Intubated Asthmatic:</strong></p><ul><li><strong>Goal:</strong> Prevent dynamic hyperinflation (auto-PEEP) by allowing adequate exhalation time</li><li>Tidal volume: 6–8 mL/kg IBW</li><li>Respiratory rate: LOW (8–12 breaths/min) — prioritise exhalation time</li><li>I:E ratio: 1:3 to 1:4 (long expiratory phase)</li><li>PEEP: LOW (0–5 cmH2O) — avoid adding to intrinsic PEEP</li><li>FiO2: titrate to SpO2 94–98%</li><li>Permissive hypercapnia: accept PaCO2 up to 60–70 mmHg if pH &gt;7.2</li></ul><p><strong>Recognising Auto-PEEP:</strong> Rising peak airway pressures, haemodynamic instability, failure to exhale fully. Management: disconnect from ventilator and allow passive exhalation, reduce RR, increase expiratory time.</p>`,
      },
    ],
  },
  {
    moduleId: 9, // Course 7: Status Epilepticus I - Module 9 (Definition and ABCs)
    label: "Status Epilepticus I - Module 1: Definition and Initial ABCs",
    sections: [
      {
        title: "Overview",
        order: 0,
        content: `<h3>Module Overview: Status Epilepticus — Definition and Initial ABCs</h3><p>Status epilepticus (SE) is a neurological emergency defined as a seizure lasting ≥5 minutes or two or more seizures without full recovery of consciousness between them. It is the most common paediatric neurological emergency and carries significant morbidity and mortality if not treated promptly. This module covers the definition and classification of SE, the initial ABCDE assessment of the seizing child, and the immediate interventions required before antiepileptic drug administration.</p><p><strong>Learning Objectives:</strong></p><ul><li>Define status epilepticus: seizure ≥5 minutes or ≥2 seizures without recovery</li><li>Classify SE: convulsive (generalised tonic-clonic) vs. non-convulsive (absence, complex partial)</li><li>Perform initial ABCDE assessment: airway positioning, oxygen, IV/IO access, glucose</li><li>Identify common causes: febrile SE, structural, metabolic, toxic, autoimmune</li><li>Initiate first-line treatment: benzodiazepine within 5 minutes of seizure onset</li></ul>`,
      },
      {
        title: "SE Definition and Classification",
        order: 1,
        content: `<h3>Status Epilepticus: Definition, Classification, and Causes</h3><p><strong>ILAE 2015 Definition:</strong></p><ul><li><strong>Operational definition (when to treat):</strong> Seizure lasting ≥5 minutes</li><li><strong>Conceptual definition:</strong> Failure of seizure termination mechanisms, OR initiation of mechanisms leading to abnormally prolonged seizures</li><li><strong>Time point 1 (T1 = 5 min):</strong> Treat immediately — seizure unlikely to self-terminate</li><li><strong>Time point 2 (T2 = 30 min):</strong> Risk of long-term neurological consequences begins</li></ul><p><strong>Classification:</strong></p><ul><li><strong>Convulsive SE (CSE):</strong> Generalised tonic-clonic — most common and most visible</li><li><strong>Non-convulsive SE (NCSE):</strong> Absence SE, complex partial SE — may present as altered consciousness, staring, automatisms. Requires EEG for diagnosis.</li><li><strong>Focal SE:</strong> Jerking of one limb, may secondarily generalise</li></ul><p><strong>Common Causes in Children:</strong></p><ul><li>Febrile SE (most common): fever + SE, no CNS infection, age 6 months–5 years</li><li>Structural: cortical dysplasia, tumour, stroke, traumatic brain injury</li><li>Metabolic: hypoglycaemia, hyponatraemia, hypocalcaemia</li><li>Infectious: bacterial meningitis, viral encephalitis</li><li>Toxic: drug ingestion (tricyclics, antihistamines, local anaesthetics)</li><li>Autoimmune: anti-NMDA receptor encephalitis, LGI1, CASPR2</li><li>Breakthrough seizures in known epilepsy</li></ul>`,
      },
      {
        title: "Initial ABCs and First-Line Treatment",
        order: 2,
        content: `<h3>Initial ABCs and First-Line Treatment in Status Epilepticus</h3><p><strong>Immediate Actions (0–5 minutes):</strong></p><ol><li><strong>Position:</strong> Recovery position (lateral decubitus) to protect airway</li><li><strong>Airway:</strong> Suction if secretions. Insert OPA/NPA if airway compromised. Do NOT force objects into mouth.</li><li><strong>Oxygen:</strong> 100% O2 via NRM. Target SpO2 &gt;94%.</li><li><strong>Timing:</strong> Note exact time of seizure onset</li><li><strong>IV/IO access:</strong> Establish as quickly as possible</li><li><strong>Glucose:</strong> Check immediately. If &lt;3 mmol/L: 2–5 mL/kg 10% dextrose IV bolus</li><li><strong>Temperature:</strong> Treat fever: paracetamol 15 mg/kg PR/IV</li></ol><p><strong>First-Line Treatment (5 minutes — give immediately):</strong></p><ul><li><strong>IV access available:</strong> Lorazepam 0.1 mg/kg IV (max 4 mg) — preferred</li><li><strong>No IV access:</strong> Midazolam 0.2 mg/kg buccal (max 10 mg) — equally effective, no IV needed</li><li><strong>Alternative routes:</strong> Diazepam 0.5 mg/kg PR (max 10 mg) OR midazolam 0.2 mg/kg IM</li><li><strong>Repeat dose:</strong> If seizure continues after 5 minutes, give second dose of same benzodiazepine</li></ul><p><strong>If seizure stops:</strong> Assess GCS. If GCS &lt;14 after 30 minutes, consider non-convulsive SE — arrange EEG.</p><p><strong>If seizure continues after 2 benzodiazepine doses:</strong> Proceed to second-line treatment (see Module 2).</p>`,
      },
    ],
  },
  {
    moduleId: 10, // Course 7: Status Epilepticus I - Module 10 (Pharmacological Control)
    label: "Status Epilepticus I - Module 2: Pharmacological Control",
    sections: [
      {
        title: "Overview",
        order: 0,
        content: `<h3>Module Overview: Pharmacological Control of Status Epilepticus</h3><p>When two doses of benzodiazepines fail to terminate status epilepticus, second-line antiepileptic drugs (AEDs) must be administered promptly. This module covers the evidence base for second-line AED selection, dosing, and administration, with particular focus on the three agents with the strongest evidence: phenytoin/fosphenytoin, levetiracetam, and phenobarbitone. The choice between agents depends on local availability, IV access, and the clinical context.</p><p><strong>Learning Objectives:</strong></p><ul><li>Identify the threshold for second-line AED administration: seizure continuing after 2 benzodiazepine doses</li><li>Administer levetiracetam 40–60 mg/kg IV (max 4500 mg) over 15 minutes</li><li>Administer phenytoin 20 mg/kg IV (max 1500 mg) over 20 minutes with cardiac monitoring</li><li>Administer phenobarbitone 20 mg/kg IV (max 1000 mg) over 20 minutes</li><li>Recognise failure of second-line therapy and prepare for third-line (anaesthetic) agents</li></ul>`,
      },
      {
        title: "Second-Line AED Selection and Dosing",
        order: 1,
        content: `<h3>Second-Line AED Selection, Dosing, and Administration</h3><p><strong>When to Give Second-Line AEDs:</strong> Seizure continuing after 2 doses of benzodiazepine (approximately 10–20 minutes from seizure onset).</p><p><strong>Three Evidence-Based Options (ESETT Trial 2019, ConSEPT Trial 2019):</strong></p><table><tr><th>Drug</th><th>Dose</th><th>Rate</th><th>Max Dose</th><th>Key Caution</th></tr><tr><td>Levetiracetam</td><td>40–60 mg/kg IV</td><td>Over 15 min</td><td>4500 mg</td><td>Behavioural side effects; no cardiac monitoring needed</td></tr><tr><td>Phenytoin</td><td>20 mg/kg IV</td><td>1 mg/kg/min (max 50 mg/min)</td><td>1500 mg</td><td>Cardiac monitoring mandatory; arrhythmia, hypotension</td></tr><tr><td>Phenobarbitone</td><td>20 mg/kg IV</td><td>Over 20 min</td><td>1000 mg</td><td>Respiratory depression; have BVM ready</td></tr></table><p><strong>Clinical Guidance:</strong></p><ul><li>Levetiracetam is preferred in most settings: no cardiac monitoring required, no respiratory depression, can be given rapidly</li><li>Phenobarbitone is preferred if levetiracetam unavailable — widely available in resource-limited settings</li><li>Phenytoin: avoid in absence SE and myoclonic SE (may worsen). Requires ECG monitoring during infusion.</li><li>All three have similar efficacy (approximately 50% seizure cessation rate)</li></ul><p><strong>Failure of Second-Line AED:</strong> Seizure continuing 10–20 minutes after second-line AED → proceed to third-line (anaesthetic) agents. This constitutes refractory SE and requires ICU admission.</p>`,
      },
      {
        title: "Monitoring and Complications",
        order: 2,
        content: `<h3>Monitoring and Managing Complications During SE Treatment</h3><p><strong>Monitoring Requirements During SE Treatment:</strong></p><ul><li>Continuous SpO2 monitoring</li><li>ECG monitoring during phenytoin infusion</li><li>Blood glucose every 15–30 minutes</li><li>Blood pressure every 5 minutes</li><li>GCS assessment after each intervention</li><li>Temperature monitoring and treatment</li></ul><p><strong>Common Complications and Management:</strong></p><ul><li><strong>Respiratory depression (benzodiazepines + phenobarbitone):</strong> Have BVM ready. Administer oxygen. Intubate if SpO2 &lt;90% or apnoea.</li><li><strong>Hypotension (phenytoin, phenobarbitone):</strong> Slow infusion rate. Give 10 mL/kg 0.9% NaCl bolus. Elevate legs.</li><li><strong>Cardiac arrhythmia (phenytoin):</strong> Stop infusion. Cardiac monitoring. Treat arrhythmia per ACLS protocol.</li><li><strong>Hypoglycaemia:</strong> Treat with 2–5 mL/kg 10% dextrose IV. Commence dextrose infusion.</li><li><strong>Hyperthermia:</strong> Paracetamol 15 mg/kg IV/PR. Active cooling if &gt;39°C.</li></ul><p><strong>Investigations to Order During SE:</strong></p><ul><li>Blood glucose (immediate)</li><li>FBC, U&E, calcium, magnesium, phosphate</li><li>Blood culture (if febrile)</li><li>Toxicology screen (if ingestion suspected)</li><li>LP (after seizure controlled, if meningitis suspected)</li><li>EEG (if non-convulsive SE suspected)</li><li>MRI brain (after stabilisation)</li></ul>`,
      },
    ],
  },
  {
    moduleId: 11, // Course 7: Status Epilepticus I - Module 11 (SRSE Escalation)
    label: "Status Epilepticus I - Module 3: SRSE Escalation",
    sections: [
      {
        title: "Overview",
        order: 0,
        content: `<h3>Module Overview: Refractory SE Escalation and ICU Management</h3><p>Refractory status epilepticus (RSE) is defined as SE continuing despite adequate doses of two AEDs (a benzodiazepine plus one second-line agent). It occurs in 23–43% of SE cases and requires ICU admission and anaesthetic therapy. This module covers the transition to third-line anaesthetic agents, the management of the intubated child with RSE, continuous EEG monitoring, and the investigation and treatment of the underlying cause.</p><p><strong>Learning Objectives:</strong></p><ul><li>Define RSE: SE continuing after adequate benzodiazepine + second-line AED</li><li>Initiate midazolam infusion 0.1–0.4 mg/kg/hr as first anaesthetic agent</li><li>Escalate to propofol or thiopentone for super-refractory SE</li><li>Initiate continuous EEG monitoring: target burst-suppression pattern</li><li>Investigate underlying cause: MRI brain, LP, autoimmune panel</li></ul>`,
      },
      {
        title: "Third-Line Anaesthetic Agents",
        order: 1,
        content: `<h3>Third-Line Anaesthetic Agents for Refractory SE</h3><p><strong>When to Use:</strong> SE continuing after benzodiazepine + second-line AED. Requires intubation, ICU admission, and continuous EEG monitoring.</p><p><strong>Midazolam Infusion (first choice):</strong></p><ul><li>Loading dose: 0.15–0.2 mg/kg IV over 2–5 minutes</li><li>Maintenance infusion: 0.1–0.4 mg/kg/hr IV</li><li>Titrate to burst-suppression on EEG or seizure cessation</li><li>Tachyphylaxis occurs — may need dose escalation over 24–48 hours</li></ul><p><strong>Propofol (second choice, avoid in children &lt;16 years for prolonged use):</strong></p><ul><li>Loading dose: 1–2 mg/kg IV</li><li>Maintenance: 2–5 mg/kg/hr IV</li><li>Risk of Propofol Infusion Syndrome (PRIS): metabolic acidosis, rhabdomyolysis, cardiac failure — monitor CK, lactate, triglycerides</li><li>Maximum duration: 48 hours at doses &lt;4 mg/kg/hr in children</li></ul><p><strong>Thiopentone (barbiturate coma):</strong></p><ul><li>Loading dose: 2–4 mg/kg IV</li><li>Maintenance: 2–4 mg/kg/hr IV</li><li>Deepest level of sedation — use for SRSE unresponsive to midazolam/propofol</li><li>Complications: hypotension (requires vasopressors), immunosuppression, prolonged awakening</li></ul>`,
      },
      {
        title: "Continuous EEG and Underlying Cause Investigation",
        order: 2,
        content: `<h3>Continuous EEG Monitoring and Underlying Cause Investigation</h3><p><strong>Continuous EEG (cEEG) in RSE:</strong></p><ul><li>Essential for monitoring treatment response in the intubated patient</li><li>Target: burst-suppression pattern (bursts of activity separated by periods of electrical silence)</li><li>Duration: maintain burst-suppression for 24–48 hours, then taper anaesthetic agents</li><li>Monitor for non-convulsive SE: may persist after motor activity stops</li><li>Weaning: reduce infusion by 10–20% every 4–6 hours, monitoring for seizure recurrence</li></ul><p><strong>Investigating the Underlying Cause:</strong></p><ul><li><strong>MRI brain:</strong> Structural cause (cortical dysplasia, encephalitis, stroke) — perform after stabilisation</li><li><strong>Lumbar puncture:</strong> CSF for cell count, glucose, protein, culture, PCR (HSV, enterovirus, EBV) — perform if meningitis/encephalitis suspected and safe</li><li><strong>Autoimmune panel:</strong> Anti-NMDA receptor, LGI1, CASPR2, GABA-B antibodies — send serum and CSF</li><li><strong>Metabolic screen:</strong> Amino acids, organic acids, ammonia — if metabolic cause suspected</li><li><strong>Toxicology:</strong> Urine and serum toxicology if ingestion suspected</li></ul><p><strong>Specific Treatments Based on Cause:</strong></p><ul><li><strong>HSV encephalitis:</strong> Aciclovir 15–20 mg/kg IV every 8 hours for 14–21 days</li><li><strong>Autoimmune SE:</strong> IVIG 2 g/kg IV over 2 days + methylprednisolone 30 mg/kg/day for 3 days</li><li><strong>FIRES (Febrile Infection-Related Epilepsy Syndrome):</strong> Anakinra (IL-1 receptor antagonist) as emerging therapy</li><li><strong>Pyridoxine-dependent epilepsy:</strong> Pyridoxine 100 mg IV trial</li></ul>`,
      },
    ],
  },
];

async function main() {
  const db = await getDb();
  if (!db) { console.error("No DB"); process.exit(1); }

  let updated = 0;
  let sectionsAdded = 0;

  // 1. Update short sections
  console.log(`\nUpdating ${SHORT_SECTION_UPDATES.length} short sections...`);
  for (const update of SHORT_SECTION_UPDATES) {
    await db
      .update(moduleSections)
      .set({ content: update.content })
      .where(eq(moduleSections.id, update.id));
    updated++;
  }
  console.log(`✅ Updated ${updated} short sections.`);

  // 2. Seed empty modules
  console.log(`\nSeeding ${EMPTY_MODULES.length} empty modules...`);
  for (const mod of EMPTY_MODULES) {
    const existing = await db
      .select()
      .from(moduleSections)
      .where(eq(moduleSections.moduleId, mod.moduleId));

    if (existing.length > 0) {
      console.log(`  [SKIP] Module ${mod.moduleId} (${mod.label}) already has ${existing.length} sections.`);
      continue;
    }

    for (const sec of mod.sections) {
      await db.insert(moduleSections).values({
        moduleId: mod.moduleId,
        title: sec.title,
        content: sec.content,
        order: sec.order,
      });
      sectionsAdded++;
    }
    console.log(`  ✅ Added ${mod.sections.length} sections to module ${mod.moduleId} (${mod.label})`);
  }
  console.log(`✅ Added ${sectionsAdded} new sections.`);

  // 3. Fix remaining empty quizzes for newly seeded modules
  console.log(`\nFixing empty quizzes for newly seeded modules...`);
  const quizList = await db.select().from(quizzes);
  let quizzesFixed = 0;
  
  for (const quiz of quizList) {
    const existingQs = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quiz.id));
    
    if (existingQs.length > 0) continue;
    
    // Only fix quizzes for the modules we just seeded
    const targetModuleIds = EMPTY_MODULES.map(m => m.moduleId);
    if (!targetModuleIds.includes(quiz.moduleId)) continue;
    
    const mod = EMPTY_MODULES.find(m => m.moduleId === quiz.moduleId);
    const label = mod?.label || `Module ${quiz.moduleId}`;
    
    console.log(`  Seeding questions for quiz ${quiz.id}: "${quiz.title}" (${label})`);
    
    const questions = generateQuestionsForLabel(label, quiz.id);
    for (const q of questions) {
      await db.insert(quizQuestions).values({
        quizId: quiz.id,
        question: q.question,
        options: JSON.stringify(q.options),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        order: q.order,
      });
    }
    quizzesFixed++;
  }
  
  console.log(`✅ Fixed ${quizzesFixed} empty quizzes.`);
  console.log(`\n=== TOTAL: ${updated} sections updated, ${sectionsAdded} sections added, ${quizzesFixed} quizzes fixed ===\n`);
  
  process.exit(0);
}

function generateQuestionsForLabel(label: string, quizId: number) {
  const l = label.toLowerCase();
  
  if (l.includes("systematic approach") || l.includes("primary assessment")) {
    return [
      { question: "In the ABCDE framework, what is the correct action when a life-threatening problem is found?", options: ["Treat it immediately before moving to the next step", "Complete the full ABCDE assessment first", "Document it and continue the survey", "Wait for senior review before treating"], correctAnswer: "Treat it immediately before moving to the next step", explanation: "The ABCDE approach requires immediate treatment of life-threatening problems at each step before proceeding. Assessment and treatment occur simultaneously.", order: 0 },
      { question: "What is the correct airway manoeuvre when cervical spine injury is suspected?", options: ["Jaw thrust with in-line cervical stabilisation", "Head tilt-chin lift", "Nasopharyngeal airway insertion only", "Chin lift without head tilt"], correctAnswer: "Jaw thrust with in-line cervical stabilisation", explanation: "Head tilt-chin lift is contraindicated when C-spine injury is suspected. Jaw thrust maintains the airway while minimising cervical spine movement.", order: 1 },
      { question: "Which finding indicates the need for immediate escalation to the cardiac arrest pathway?", options: ["Unresponsive child with no normal breathing", "Tachycardia with fever", "Capillary refill time of 3 seconds", "SpO2 of 93% on room air"], correctAnswer: "Unresponsive child with no normal breathing", explanation: "An unresponsive child with absent or abnormal breathing requires immediate activation of the cardiac arrest (CPR) pathway regardless of the cause.", order: 2 },
    ];
  }
  
  if (l.includes("septic shock") && l.includes("recognition")) {
    return [
      { question: "What is the most important early indicator of septic shock in children?", options: ["Tachycardia with poor perfusion", "Hypotension", "Fever above 39°C", "Elevated WBC"], correctAnswer: "Tachycardia with poor perfusion", explanation: "Tachycardia combined with signs of poor perfusion (prolonged CRT, altered consciousness, weak pulse) is the earliest indicator of septic shock. Hypotension is a late, pre-terminal sign.", order: 0 },
      { question: "Which clinical finding distinguishes warm shock from cold shock in sepsis?", options: ["Warm skin with flash capillary refill vs. cold mottled skin with prolonged CRT", "High fever vs. hypothermia", "Tachycardia vs. bradycardia", "High BP vs. low BP"], correctAnswer: "Warm skin with flash capillary refill vs. cold mottled skin with prolonged CRT", explanation: "Warm shock (distributive) presents with vasodilation: warm skin, bounding pulse, flash CRT. Cold shock (low cardiac output) presents with vasoconstriction: cold mottled skin, weak pulse, prolonged CRT.", order: 1 },
      { question: "What rash finding in a febrile child requires immediate ceftriaxone administration regardless of other findings?", options: ["Non-blanching petechial or purpuric rash", "Maculopapular rash", "Urticarial rash", "Erythematous rash"], correctAnswer: "Non-blanching petechial or purpuric rash", explanation: "A non-blanching petechial or purpuric rash in a febrile child is meningococcal disease until proven otherwise. Administer ceftriaxone 100 mg/kg IV immediately — do not delay for investigations.", order: 2 },
    ];
  }
  
  if (l.includes("first-hour") || l.includes("hour-1") || l.includes("safe actions")) {
    return [
      { question: "What is the maximum time from recognition of septic shock to antibiotic administration?", options: ["1 hour", "3 hours", "30 minutes", "6 hours"], correctAnswer: "1 hour", explanation: "The Surviving Sepsis Campaign Hour-1 Bundle mandates antibiotic administration within 1 hour of septic shock recognition. Every hour of delay increases mortality by approximately 7%.", order: 0 },
      { question: "What is the correct initial fluid bolus for a child in septic shock?", options: ["10–20 mL/kg 0.9% NaCl over 5–10 minutes", "40 mL/kg 0.9% NaCl as fast as possible", "5 mL/kg albumin over 30 minutes", "20 mL/kg 5% dextrose over 20 minutes"], correctAnswer: "10–20 mL/kg 0.9% NaCl over 5–10 minutes", explanation: "Give 10–20 mL/kg 0.9% NaCl or Ringer's lactate over 5–10 minutes. Reassess after each bolus. Stop if signs of fluid overload develop. Maximum 40–60 mL/kg in first hour.", order: 1 },
      { question: "What lactate level indicates high-risk septic shock requiring immediate vasopressor consideration?", options: [">4 mmol/L", ">2 mmol/L", ">1 mmol/L", ">6 mmol/L"], correctAnswer: ">4 mmol/L", explanation: "Lactate >4 mmol/L indicates severe tissue hypoperfusion and is associated with high mortality. Vasopressors should be initiated alongside fluid resuscitation in this group.", order: 2 },
    ];
  }
  
  if (l.includes("refer") || l.includes("escalation") || l.includes("transfer")) {
    return [
      { question: "What is the definition of fluid-refractory septic shock?", options: ["Persistent shock after 40–60 mL/kg IV fluid", "Shock not responding to first 20 mL/kg bolus", "Any shock requiring more than one fluid bolus", "Shock with lactate >2 mmol/L"], correctAnswer: "Persistent shock after 40–60 mL/kg IV fluid", explanation: "Fluid-refractory shock is defined as persistent haemodynamic instability despite 40–60 mL/kg of isotonic crystalloid. This requires vasopressor initiation and PICU admission.", order: 0 },
      { question: "What is the first-line vasopressor for fluid-refractory septic shock?", options: ["Noradrenaline 0.1–1 mcg/kg/min", "Dopamine 5–20 mcg/kg/min", "Adrenaline 0.1–1 mcg/kg/min", "Vasopressin 0.0003 units/kg/min"], correctAnswer: "Noradrenaline 0.1–1 mcg/kg/min", explanation: "Noradrenaline is the first-line vasopressor for septic shock in children and adults per Surviving Sepsis Campaign 2020 guidelines, due to its alpha-adrenergic vasoconstriction with less tachycardia than dopamine.", order: 1 },
      { question: "Which component of the SBAR handover describes the current clinical status and working diagnosis?", options: ["Assessment (A)", "Situation (S)", "Background (B)", "Recommendation (R)"], correctAnswer: "Assessment (A)", explanation: "In SBAR: S=current situation (what is happening now), B=background (history, context), A=assessment (clinical status, working diagnosis, severity), R=recommendation (what you need from the receiving team).", order: 2 },
    ];
  }
  
  if (l.includes("intubation")) {
    return [
      { question: "What is the correct formula for calculating uncuffed ETT size in children?", options: ["(Age/4) + 4", "(Age/4) + 3.5", "(Age/2) + 4", "(Age/3) + 3"], correctAnswer: "(Age/4) + 4", explanation: "Uncuffed ETT size = (age in years/4) + 4. Cuffed ETT size = (age/4) + 3.5. Always prepare one size above and below the calculated size.", order: 0 },
      { question: "What is the preferred induction agent for RSI in a child with severe asthma?", options: ["Ketamine 1–2 mg/kg IV", "Propofol 2 mg/kg IV", "Thiopentone 4 mg/kg IV", "Midazolam 0.2 mg/kg IV"], correctAnswer: "Ketamine 1–2 mg/kg IV", explanation: "Ketamine is the preferred induction agent in severe asthma because it is a bronchodilator, maintains haemodynamics, and preserves airway reflexes. Propofol causes histamine release and hypotension and should be avoided.", order: 1 },
      { question: "What is the gold standard method for confirming correct ETT placement?", options: ["Continuous waveform capnography (6 waveforms)", "Bilateral chest auscultation", "Chest X-ray", "Improvement in SpO2"], correctAnswer: "Continuous waveform capnography (6 waveforms)", explanation: "Continuous waveform capnography is the gold standard for confirming tracheal intubation. Six consecutive CO2 waveforms confirm tracheal placement. Oesophageal intubation produces no or rapidly diminishing waveforms.", order: 2 },
    ];
  }
  
  if (l.includes("asthma") && l.includes("escalation")) {
    return [
      { question: "What PaCO2 level in a severely distressed asthmatic child indicates impending respiratory failure?", options: ["Normal PaCO2 (35–40 mmHg)", "Elevated PaCO2 (>50 mmHg)", "Low PaCO2 (<30 mmHg)", "Any PaCO2 above 45 mmHg"], correctAnswer: "Normal PaCO2 (35–40 mmHg)", explanation: "In severe asthma, children hyperventilate and have low PaCO2. A normal PaCO2 (35–40 mmHg) in a severely distressed child indicates respiratory muscle fatigue and impending failure — escalate immediately.", order: 0 },
      { question: "What ventilation strategy is used for the intubated asthmatic child to prevent dynamic hyperinflation?", options: ["Low respiratory rate with long expiratory time (I:E 1:3 to 1:4)", "High respiratory rate to clear CO2", "High PEEP to prevent atelectasis", "Normal I:E ratio of 1:2"], correctAnswer: "Low respiratory rate with long expiratory time (I:E 1:3 to 1:4)", explanation: "Dynamic hyperinflation (auto-PEEP) occurs when air trapping prevents full exhalation. A low respiratory rate (8–12 breaths/min) with a long expiratory time (I:E 1:3 to 1:4) allows adequate exhalation.", order: 1 },
      { question: "What is the induction agent of choice for RSI in a child with severe asthma?", options: ["Ketamine 1–2 mg/kg IV", "Propofol 2–3 mg/kg IV", "Thiopentone 3–5 mg/kg IV", "Etomidate 0.3 mg/kg IV"], correctAnswer: "Ketamine 1–2 mg/kg IV", explanation: "Ketamine is the preferred induction agent in severe asthma. It is a bronchodilator, maintains haemodynamics, and preserves airway reflexes. Propofol causes histamine release and should be avoided.", order: 2 },
    ];
  }
  
  if (l.includes("status epilepticus") && (l.includes("definition") || l.includes("abc"))) {
    return [
      { question: "At what duration of seizure should treatment be initiated according to ILAE 2015 guidelines?", options: ["5 minutes", "10 minutes", "30 minutes", "2 minutes"], correctAnswer: "5 minutes", explanation: "The ILAE 2015 operational definition states that treatment should begin at 5 minutes (T1) as seizures lasting this long are unlikely to self-terminate and risk progressing to status epilepticus.", order: 0 },
      { question: "What is the preferred first-line treatment for status epilepticus when IV access is available?", options: ["Lorazepam 0.1 mg/kg IV (max 4 mg)", "Diazepam 0.5 mg/kg IV", "Phenytoin 20 mg/kg IV", "Midazolam 0.1 mg/kg IV"], correctAnswer: "Lorazepam 0.1 mg/kg IV (max 4 mg)", explanation: "Lorazepam 0.1 mg/kg IV (max 4 mg) is the preferred first-line treatment when IV access is available. Buccal midazolam 0.2 mg/kg is equally effective and preferred when IV access is unavailable.", order: 1 },
      { question: "What immediate bedside test must be performed in every seizing child?", options: ["Blood glucose", "Serum sodium", "CT head", "EEG"], correctAnswer: "Blood glucose", explanation: "Hypoglycaemia is a common, immediately reversible cause of seizures in children. Blood glucose must be checked immediately in every seizing child and treated if <3 mmol/L with 2–5 mL/kg 10% dextrose IV.", order: 2 },
    ];
  }
  
  if (l.includes("pharmacological") || l.includes("second-line")) {
    return [
      { question: "What defines refractory status epilepticus requiring second-line AED therapy?", options: ["Seizure continuing after 2 adequate benzodiazepine doses", "Seizure lasting more than 5 minutes", "Seizure not responding to first benzodiazepine dose", "Any seizure requiring IV access"], correctAnswer: "Seizure continuing after 2 adequate benzodiazepine doses", explanation: "Refractory SE is defined as SE continuing despite adequate doses of two AEDs — typically a benzodiazepine (two doses) followed by a second-line agent. This occurs in 23–43% of SE cases.", order: 0 },
      { question: "Which second-line AED does NOT require cardiac monitoring during administration?", options: ["Levetiracetam 40–60 mg/kg IV", "Phenytoin 20 mg/kg IV", "Fosphenytoin 20 mg PE/kg IV", "All require cardiac monitoring"], correctAnswer: "Levetiracetam 40–60 mg/kg IV", explanation: "Levetiracetam does not cause cardiac arrhythmias and does not require cardiac monitoring. Phenytoin and fosphenytoin require continuous ECG monitoring due to risk of arrhythmia and hypotension.", order: 1 },
      { question: "What is the maximum dose of phenobarbitone for second-line treatment of status epilepticus?", options: ["20 mg/kg IV (max 1000 mg)", "10 mg/kg IV (max 600 mg)", "30 mg/kg IV (max 1500 mg)", "15 mg/kg IV (max 800 mg)"], correctAnswer: "20 mg/kg IV (max 1000 mg)", explanation: "Phenobarbitone 20 mg/kg IV (max 1000 mg) administered over 20 minutes is the standard second-line dose. Have BVM ready due to risk of respiratory depression.", order: 2 },
    ];
  }
  
  if (l.includes("srse") || l.includes("refractory") || l.includes("third-line")) {
    return [
      { question: "What is the first-line anaesthetic agent for refractory status epilepticus?", options: ["Midazolam infusion 0.1–0.4 mg/kg/hr IV", "Propofol infusion 2–5 mg/kg/hr IV", "Thiopentone infusion 2–4 mg/kg/hr IV", "Ketamine infusion 1–5 mg/kg/hr IV"], correctAnswer: "Midazolam infusion 0.1–0.4 mg/kg/hr IV", explanation: "Midazolam infusion is the first-line anaesthetic agent for RSE. Loading dose 0.15–0.2 mg/kg IV, then 0.1–0.4 mg/kg/hr. Titrate to burst-suppression on continuous EEG.", order: 0 },
      { question: "What is the target EEG pattern when using anaesthetic agents for refractory SE?", options: ["Burst-suppression pattern", "Complete electrical silence (isoelectric EEG)", "Normal background activity", "Continuous slow-wave activity"], correctAnswer: "Burst-suppression pattern", explanation: "The target EEG pattern during anaesthetic therapy for RSE is burst-suppression — periods of electrical activity (bursts) separated by periods of electrical silence. This indicates adequate depth of anaesthesia to suppress seizure activity.", order: 1 },
      { question: "Which autoimmune encephalitis antibody is most commonly associated with refractory SE in children?", options: ["Anti-NMDA receptor antibody", "Anti-LGI1 antibody", "Anti-CASPR2 antibody", "Anti-GABA-B antibody"], correctAnswer: "Anti-NMDA receptor antibody", explanation: "Anti-NMDA receptor encephalitis is the most common autoimmune encephalitis in children and frequently presents with refractory SE. Treatment includes IVIG, methylprednisolone, and plasmapheresis.", order: 2 },
    ];
  }
  
  // Default
  return [
    { question: "What is the primary goal of the initial assessment in a critically ill child?", options: ["Identify and treat life-threatening conditions immediately", "Complete full documentation before treatment", "Obtain all investigations before acting", "Wait for senior review"], correctAnswer: "Identify and treat life-threatening conditions immediately", explanation: "The ABCDE approach requires immediate identification and treatment of life-threatening conditions at each step. Treatment should not be delayed for documentation or investigation results.", order: 0 },
    { question: "Which vital sign change is the earliest indicator of haemodynamic compromise in children?", options: ["Tachycardia", "Hypotension", "Bradycardia", "Hypertension"], correctAnswer: "Tachycardia", explanation: "Tachycardia is the earliest compensatory response to haemodynamic compromise in children. Hypotension is a late, pre-terminal sign.", order: 1 },
    { question: "What is the recommended oxygen delivery method for a critically ill child with SpO2 <90%?", options: ["Non-rebreather mask at 10–15 L/min", "Nasal cannula at 2 L/min", "Venturi mask at 28% FiO2", "Room air with monitoring"], correctAnswer: "Non-rebreather mask at 10–15 L/min", explanation: "A non-rebreather mask at 10–15 L/min delivers FiO2 of approximately 0.85–0.95, appropriate for initial management of severe hypoxaemia.", order: 2 },
  ];
}

main().catch((e) => { console.error(e); process.exit(1); });
