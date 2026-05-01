/**
 * Comprehensive Fix Script
 * Fixes all short/blank sections and empty quiz questions across all 26 fellowship courses.
 * Run: npx tsx fix-all-content.ts
 */
import { eq, inArray } from "drizzle-orm";
import { getDb } from "./server/db";
import { moduleSections, quizQuestions, quizzes, modules, courses } from "./drizzle/schema";

// =====================================================================
// SECTION CONTENT UPDATES
// Each entry: { sectionId, content (full HTML) }
// =====================================================================
const SECTION_UPDATES: Array<{ id: number; content: string }> = [
  // ---- ANAPHYLAXIS I (course 8) ----
  {
    id: 228, // Module 1 Overview
    content: `<h3>Module Overview</h3><p>Anaphylaxis is a severe, life-threatening systemic hypersensitivity reaction that requires immediate recognition and treatment. In this module, you will learn to identify the clinical features of anaphylaxis across all severity grades, distinguish it from other causes of acute deterioration, and initiate the first critical intervention — intramuscular epinephrine.</p><p><strong>Learning Objectives:</strong></p><ul><li>Define anaphylaxis and identify common triggers in paediatric patients</li><li>Recognise the clinical triad: skin/mucosal changes, respiratory compromise, cardiovascular collapse</li><li>Grade anaphylaxis severity using a standardised framework</li><li>Initiate first-line management with IM epinephrine</li></ul>`,
  },
  {
    id: 229, // Anaphylaxis Definition
    content: `<h3>Anaphylaxis: Definition and Pathophysiology</h3><p>Anaphylaxis is a severe, potentially fatal systemic allergic reaction that occurs rapidly after exposure to a triggering allergen. It is mediated primarily by IgE-dependent mast cell and basophil degranulation, releasing histamine, tryptase, leukotrienes, and prostaglandins that cause vasodilation, increased vascular permeability, bronchospasm, and mucosal oedema.</p><p><strong>Clinical Diagnostic Criteria (WAO 2020):</strong> Anaphylaxis is likely when ANY ONE of the following is fulfilled:</p><ol><li>Acute onset of illness with involvement of skin/mucosal tissue AND respiratory compromise OR reduced blood pressure</li><li>Two or more of the following after exposure to a likely allergen: skin/mucosal involvement, respiratory compromise, reduced BP, persistent GI symptoms</li><li>Reduced BP after exposure to a known allergen</li></ol><p><strong>Common Triggers in Paediatric Patients:</strong></p><ul><li><strong>Foods:</strong> Peanuts, tree nuts, milk, egg, fish, shellfish, wheat</li><li><strong>Medications:</strong> Penicillin/beta-lactams, NSAIDs, neuromuscular blocking agents</li><li><strong>Insect stings:</strong> Bee, wasp, hornet venom</li><li><strong>Latex:</strong> Especially in children with spina bifida or frequent surgeries</li><li><strong>Exercise-induced:</strong> Often food-dependent</li><li><strong>Idiopathic:</strong> No identifiable trigger in 20% of cases</li></ul>`,
  },
  {
    id: 234, // Module 3 Overview
    content: `<h3>Module Overview: Adjunctive Therapy and Observation</h3><p>After epinephrine administration and initial stabilisation, the management of anaphylaxis continues with adjunctive pharmacotherapy and a mandatory observation period. This module covers the evidence base for antihistamines, corticosteroids, and bronchodilators, and establishes the minimum safe observation period before discharge. You will also learn to counsel families on allergen avoidance and self-injectable epinephrine prescription.</p><p><strong>Learning Objectives:</strong></p><ul><li>Administer adjunctive agents: antihistamines, corticosteroids, salbutamol</li><li>Determine appropriate observation duration based on reaction severity</li><li>Recognise biphasic anaphylaxis and its risk factors</li><li>Prescribe and counsel on self-injectable epinephrine (EpiPen)</li><li>Document and refer to allergy/immunology services</li></ul>`,
  },
  // ---- ANAPHYLAXIS II (course 9) ----
  {
    id: 239, // Module 1 Overview
    content: `<h3>Module Overview: Refractory Anaphylaxis Recognition</h3><p>Refractory anaphylaxis occurs when the initial response to standard epinephrine doses is inadequate, or when anaphylaxis recurs after apparent resolution (biphasic reaction). This module focuses on identifying patients at risk for refractory anaphylaxis, recognising failure to respond to first-line treatment, and escalating to advanced management strategies including IV epinephrine infusion and vasopressor support.</p><p><strong>Learning Objectives:</strong></p><ul><li>Define refractory anaphylaxis and identify risk factors</li><li>Recognise inadequate response to initial epinephrine doses</li><li>Identify biphasic anaphylaxis and its timing</li><li>Initiate IV epinephrine infusion safely</li></ul>`,
  },
  {
    id: 240, // Definition
    content: `<h3>Refractory Anaphylaxis: Definition and Risk Stratification</h3><p><strong>Definition:</strong> Refractory anaphylaxis is defined as persistent or recurrent anaphylaxis despite administration of two or more doses of IM epinephrine (0.01 mg/kg, max 0.5 mg) and appropriate supportive care including IV fluid resuscitation.</p><p><strong>Biphasic Anaphylaxis:</strong> A second wave of anaphylactic symptoms occurring 1–72 hours after apparent resolution of the initial reaction, without further allergen exposure. Occurs in 1–20% of cases. Risk factors include: severe initial reaction, delayed epinephrine administration, large allergen dose, unknown trigger.</p><p><strong>Risk Factors for Refractory Course:</strong></p><ul><li>Pre-existing asthma or severe respiratory disease</li><li>Cardiovascular disease or beta-blocker use</li><li>Delayed epinephrine administration (&gt;30 minutes)</li><li>Large allergen dose (e.g., IV drug, sting in mouth)</li><li>Mastocytosis or elevated baseline tryptase</li><li>Idiopathic anaphylaxis</li></ul><p><strong>Failure Criteria (escalate to IV epinephrine):</strong> No improvement in BP, oxygenation, or airway patency after 2 doses of IM epinephrine + 20 mL/kg IV fluid bolus.</p>`,
  },
  {
    id: 244, // Module 2 Overview
    content: `<h3>Module Overview: Advanced Management of Refractory Anaphylaxis</h3><p>When standard anaphylaxis management fails, advanced interventions are required. This module covers IV epinephrine infusion titration, vasopressor selection for refractory hypotension, glucagon for beta-blocker-induced refractory anaphylaxis, methylene blue for vasoplegic shock, and airway management in the setting of severe laryngeal oedema. ICU admission criteria and monitoring requirements are also addressed.</p><p><strong>Learning Objectives:</strong></p><ul><li>Initiate and titrate IV epinephrine infusion (0.1–1 mcg/kg/min)</li><li>Add vasopressors: noradrenaline for refractory hypotension</li><li>Use glucagon in beta-blocker-induced refractory anaphylaxis</li><li>Manage the difficult airway in anaphylaxis</li><li>Determine ICU admission criteria</li></ul>`,
  },
  {
    id: 249, // Module 3 Overview
    content: `<h3>Module Overview: Anaphylactoid Reactions and Long-Term Management</h3><p>Anaphylactoid reactions are clinically identical to anaphylaxis but are not IgE-mediated. They occur on first exposure to the trigger and do not require prior sensitisation. Understanding the distinction is important for counselling and prevention. This module also covers long-term management: allergy referral, allergen immunotherapy, and the prescription of self-injectable epinephrine with family education.</p><p><strong>Learning Objectives:</strong></p><ul><li>Distinguish anaphylactoid from IgE-mediated anaphylaxis</li><li>Identify common anaphylactoid triggers (contrast media, opioids, aspirin)</li><li>Prescribe self-injectable epinephrine and counsel families</li><li>Refer appropriately to allergy/immunology</li><li>Document reactions accurately for future care</li></ul>`,
  },
  // ---- DKA I (course 10) ----
  {
    id: 253, // Module 1 Overview
    content: `<h3>Module Overview: DKA Recognition and Severity Assessment</h3><p>Diabetic ketoacidosis (DKA) is the most common life-threatening complication of type 1 diabetes mellitus in children and a significant cause of preventable paediatric mortality. Early recognition and accurate severity grading are essential to guide fluid resuscitation, insulin therapy, and monitoring intensity. This module covers the diagnostic criteria, severity classification, and initial clinical assessment of paediatric DKA.</p><p><strong>Learning Objectives:</strong></p><ul><li>Define DKA using ISPAD 2022 diagnostic criteria</li><li>Grade DKA severity: mild, moderate, severe</li><li>Identify clinical features of DKA including signs of dehydration and acidosis</li><li>Interpret blood gas, glucose, and ketone results</li><li>Recognise risk factors for cerebral oedema</li></ul>`,
  },
  {
    id: 254, // DKA Definition
    content: `<h3>DKA: Diagnostic Criteria and Severity Classification</h3><p><strong>ISPAD 2022 Diagnostic Criteria:</strong></p><ul><li>Blood glucose &gt;11 mmol/L (200 mg/dL) or known diabetes mellitus</li><li>Venous pH &lt;7.3 OR serum bicarbonate &lt;15 mmol/L</li><li>Ketonaemia (blood ketones ≥3 mmol/L) OR ketonuria (≥2+ on dipstick)</li></ul><p><strong>Severity Classification:</strong></p><table><tr><th>Grade</th><th>pH</th><th>Bicarbonate</th></tr><tr><td>Mild</td><td>7.2–7.29</td><td>10–15 mmol/L</td></tr><tr><td>Moderate</td><td>7.1–7.19</td><td>5–9.9 mmol/L</td></tr><tr><td>Severe</td><td>&lt;7.1</td><td>&lt;5 mmol/L</td></tr></table><p><strong>Key Clinical Features:</strong></p><ul><li>Polyuria, polydipsia, weight loss (days to weeks)</li><li>Nausea, vomiting, abdominal pain</li><li>Kussmaul breathing (deep, sighing respirations)</li><li>Fruity/acetone breath</li><li>Dehydration: estimated 5–10% in moderate-severe DKA</li><li>Altered consciousness: GCS &lt;14 suggests cerebral oedema risk</li></ul><p><strong>Cerebral Oedema Risk Factors (highest-risk group):</strong> Age &lt;5 years, new-onset diabetes, severe acidosis (pH &lt;7.1), high BUN, low pCO2, bicarbonate therapy use.</p>`,
  },
  {
    id: 258, // Module 2 Overview
    content: `<h3>Module Overview: First-Hour Resuscitation in DKA</h3><p>The first hour of DKA management is critical. The primary goals are: restore circulating volume to treat shock (if present), begin careful fluid replacement to correct dehydration over 24–48 hours, and prepare for insulin infusion. This module follows ISPAD 2022 and BSPED 2021 guidelines for fluid resuscitation in paediatric DKA, with particular emphasis on avoiding rapid fluid shifts that increase cerebral oedema risk.</p><p><strong>Learning Objectives:</strong></p><ul><li>Assess and treat haemodynamic compromise with 10 mL/kg 0.9% NaCl bolus (repeat if needed, max 30 mL/kg)</li><li>Calculate 24–48 hour fluid replacement rate using deficit + maintenance formula</li><li>Select appropriate IV fluid: 0.9% NaCl with KCl</li><li>Avoid hypotonic fluids and rapid glucose correction</li><li>Time insulin infusion start: 1–2 hours after fluids begin</li></ul>`,
  },
  {
    id: 263, // Module 3 Overview
    content: `<h3>Module Overview: DKA Complications and Ongoing Management</h3><p>The most feared complication of DKA is cerebral oedema, which accounts for 57–87% of DKA-related deaths in children. This module covers the recognition and emergency management of cerebral oedema, as well as other complications including hypokalaemia, hypoglycaemia, and the transition from IV to subcutaneous insulin. Monitoring protocols and discharge criteria are also addressed.</p><p><strong>Learning Objectives:</strong></p><ul><li>Recognise early warning signs of cerebral oedema</li><li>Administer mannitol 0.5–1 g/kg IV or hypertonic saline 2.5–5 mL/kg 3% NaCl</li><li>Manage hypokalaemia: add KCl to IV fluids once urine output confirmed</li><li>Prevent hypoglycaemia: add 10% dextrose when glucose &lt;14 mmol/L</li><li>Transition to subcutaneous insulin safely</li></ul>`,
  },
  // ---- DKA II (course 11) ----
  {
    id: 268, // Module 1 Overview
    content: `<h3>Module Overview: Euglycaemic DKA Recognition</h3><p>Euglycaemic DKA (euDKA) is a variant of DKA where blood glucose is normal or only mildly elevated (&lt;11 mmol/L or 200 mg/dL) despite significant ketoacidosis. It is increasingly recognised in patients using SGLT2 inhibitors, in pregnant women with type 1 diabetes, and in patients with reduced carbohydrate intake. EuDKA is frequently missed because providers do not check ketones when glucose is normal, leading to delayed treatment and worse outcomes.</p><p><strong>Learning Objectives:</strong></p><ul><li>Define euglycaemic DKA and identify at-risk populations</li><li>Recognise the clinical presentation: acidosis without hyperglycaemia</li><li>Initiate appropriate management: fluids, dextrose, insulin</li><li>Understand why standard DKA protocols must be modified for euDKA</li></ul>`,
  },
  {
    id: 269, // Definition
    content: `<h3>Euglycaemic DKA: Diagnostic Criteria and Pathophysiology</h3><p><strong>Definition:</strong> DKA with blood glucose &lt;11 mmol/L (200 mg/dL), venous pH &lt;7.3, bicarbonate &lt;15 mmol/L, and significant ketonaemia (blood ketones ≥3 mmol/L).</p><p><strong>Pathophysiology:</strong> In euDKA, insulin deficiency or resistance drives ketogenesis despite relatively preserved glucose levels. SGLT2 inhibitors increase urinary glucose excretion, masking hyperglycaemia while ketone production continues unchecked. Starvation, vomiting, and reduced carbohydrate intake similarly lower glucose while maintaining ketosis.</p><p><strong>At-Risk Populations:</strong></p><ul><li>SGLT2 inhibitor use (dapagliflozin, empagliflozin, canagliflozin)</li><li>Type 1 diabetes with reduced carbohydrate intake or prolonged fasting</li><li>Pregnancy with type 1 diabetes</li><li>Alcohol-related ketoacidosis (overlap syndrome)</li><li>Post-bariatric surgery patients</li></ul><p><strong>Management Modification:</strong> Unlike standard DKA, euDKA requires early dextrose supplementation to allow insulin infusion to clear ketones without causing hypoglycaemia. Start 5–10% dextrose alongside 0.9% NaCl from the outset.</p>`,
  },
  {
    id: 274, // Module 2 Overview
    content: `<h3>Module Overview: Cerebral Oedema Management in DKA</h3><p>Cerebral oedema is the most devastating complication of paediatric DKA, occurring in 0.5–1% of episodes but accounting for 57–87% of DKA-related deaths. Subclinical cerebral oedema is present in up to 54% of children with DKA on MRI. This module covers the pathophysiology, early warning signs, emergency treatment, and prevention strategies for DKA-associated cerebral oedema.</p><p><strong>Learning Objectives:</strong></p><ul><li>Identify early warning signs: headache, bradycardia, rising BP, deteriorating GCS</li><li>Apply the Muizelaar criteria for clinical diagnosis</li><li>Administer mannitol 0.5–1 g/kg IV over 15–20 minutes OR hypertonic saline 3% 2.5–5 mL/kg</li><li>Restrict IV fluids to two-thirds maintenance after cerebral oedema diagnosis</li><li>Arrange urgent CT head and ICU transfer</li></ul>`,
  },
  {
    id: 280, // Module 3 Overview
    content: `<h3>Module Overview: Complex Electrolyte Management and ICU Transition</h3><p>Children with severe DKA frequently develop life-threatening electrolyte disturbances during treatment. Hypokalaemia is the most common and dangerous, occurring as insulin drives potassium into cells. Hyponatraemia, hypophosphataemia, and hypomagnesaemia also occur. This module covers the monitoring and correction of each electrolyte abnormality, and the criteria for safe ICU-to-ward transition and insulin pump restart.</p><p><strong>Learning Objectives:</strong></p><ul><li>Monitor potassium every 1–2 hours during insulin infusion</li><li>Add KCl 40 mmol/L to IV fluids once K+ &lt;5.5 mmol/L and urine output confirmed</li><li>Recognise and manage hyponatraemia: calculate corrected sodium</li><li>Identify indications for phosphate replacement</li><li>Define resolution criteria: pH &gt;7.3, bicarbonate &gt;15, blood ketones &lt;1 mmol/L</li></ul>`,
  },
  // ---- HYPOVOLEMIC SHOCK I (course 12) ----
  {
    id: 317, // Module 1 Overview
    content: `<h3>Module Overview: Shock Recognition and Classification</h3><p>Hypovolemic shock is the most common form of shock in paediatric patients worldwide, caused by loss of intravascular volume from haemorrhage, dehydration, or third-space losses. Early recognition is critical because compensated shock can rapidly progress to decompensated and irreversible shock. This module covers the pathophysiology of hypovolemic shock, clinical recognition across all stages, and the initial assessment framework.</p><p><strong>Learning Objectives:</strong></p><ul><li>Define hypovolemic shock and classify by severity: compensated, decompensated, irreversible</li><li>Identify clinical signs at each stage: heart rate, capillary refill, blood pressure, mental status</li><li>Distinguish haemorrhagic from non-haemorrhagic hypovolemic shock</li><li>Apply the ABCDE framework to the shocked child</li><li>Estimate fluid deficit based on clinical signs</li></ul>`,
  },
  {
    id: 318, // Shock Definition
    content: `<h3>Hypovolemic Shock: Definition, Pathophysiology, and Classification</h3><p><strong>Definition:</strong> Shock is a state of acute circulatory failure resulting in inadequate oxygen delivery to meet tissue metabolic demands. Hypovolemic shock specifically results from a reduction in intravascular volume.</p><p><strong>Pathophysiology:</strong> Volume loss → reduced preload → reduced stroke volume → reduced cardiac output → compensatory tachycardia and vasoconstriction → if uncorrected, decompensation → hypotension → organ failure → death.</p><p><strong>Classification by Severity:</strong></p><table><tr><th>Stage</th><th>Volume Loss</th><th>HR</th><th>BP</th><th>CRT</th><th>Mental Status</th></tr><tr><td>Compensated</td><td>&lt;25%</td><td>↑↑</td><td>Normal</td><td>&gt;2 sec</td><td>Anxious</td></tr><tr><td>Decompensated</td><td>25–40%</td><td>↑↑↑</td><td>↓</td><td>&gt;3 sec</td><td>Confused</td></tr><tr><td>Irreversible</td><td>&gt;40%</td><td>↑ or ↓</td><td>↓↓</td><td>&gt;5 sec</td><td>Unconscious</td></tr></table><p><strong>Causes in Paediatric Patients:</strong></p><ul><li><strong>Haemorrhagic:</strong> Trauma, GI bleeding, surgical haemorrhage</li><li><strong>Non-haemorrhagic:</strong> Severe dehydration (gastroenteritis), burns, diabetic ketoacidosis, nephrotic syndrome</li></ul>`,
  },
  {
    id: 323, // Module 2 Overview
    content: `<h3>Module Overview: Rapid Fluid Resuscitation</h3><p>Fluid resuscitation is the cornerstone of hypovolemic shock management. The goal is to rapidly restore intravascular volume to improve cardiac output and tissue perfusion. This module covers the selection of IV access, fluid type, bolus volume and rate, reassessment after each bolus, and the recognition of fluid overload. Special considerations for dehydration-related hypovolemia (gastroenteritis) versus haemorrhagic shock are addressed.</p><p><strong>Learning Objectives:</strong></p><ul><li>Obtain IV or IO access rapidly in the shocked child</li><li>Administer 20 mL/kg 0.9% NaCl or Ringer's lactate bolus over 5–10 minutes</li><li>Reassess after each bolus: HR, CRT, BP, mental status</li><li>Recognise fluid overload: hepatomegaly, crackles, oedema</li><li>Adjust fluid strategy for haemorrhagic vs. dehydration shock</li></ul>`,
  },
  {
    id: 328, // Module 3 Overview
    content: `<h3>Module Overview: Ongoing Management and Complications</h3><p>After initial fluid resuscitation, ongoing management of hypovolemic shock focuses on identifying and treating the underlying cause, replacing ongoing losses, and monitoring for complications. This module covers the management of persistent shock, electrolyte correction, blood product transfusion for haemorrhagic shock, and the prevention of abdominal compartment syndrome and acute kidney injury.</p><p><strong>Learning Objectives:</strong></p><ul><li>Identify and treat the underlying cause of hypovolemia</li><li>Replace ongoing losses with appropriate fluid type and rate</li><li>Initiate blood product transfusion for haemorrhagic shock (pRBC 10–15 mL/kg)</li><li>Monitor for AKI: urine output &gt;1 mL/kg/hr target</li><li>Recognise abdominal compartment syndrome</li></ul>`,
  },
  // ---- HYPOVOLEMIC SHOCK II (course 13) ----
  {
    id: 333, // Module 1 Overview
    content: `<h3>Module Overview: Refractory Shock Recognition and Escalation</h3><p>Refractory hypovolemic shock occurs when standard fluid resuscitation fails to restore adequate perfusion. This module covers the definition of fluid-refractory shock, the differential diagnosis of persistent haemodynamic instability, and the decision to escalate to vasopressor support, blood product transfusion, or surgical haemorrhage control. The massive transfusion protocol (MTP) is introduced.</p><p><strong>Learning Objectives:</strong></p><ul><li>Define fluid-refractory shock: persistent shock after 40–60 mL/kg IV fluid</li><li>Identify causes of refractory shock: ongoing haemorrhage, tension pneumothorax, tamponade</li><li>Activate the massive transfusion protocol (MTP)</li><li>Initiate vasopressor support: noradrenaline 0.1–1 mcg/kg/min</li><li>Prepare for emergency surgical or interventional haemorrhage control</li></ul>`,
  },
  {
    id: 334, // Definition
    content: `<h3>Refractory Hypovolemic Shock: Definition and Differential Diagnosis</h3><p><strong>Definition:</strong> Fluid-refractory shock is defined as persistent haemodynamic instability (hypotension, tachycardia, poor perfusion) despite administration of 40–60 mL/kg of isotonic crystalloid over 30–60 minutes.</p><p><strong>Differential Diagnosis of Refractory Shock:</strong></p><ul><li><strong>Ongoing haemorrhage:</strong> Inadequate source control (surgical emergency)</li><li><strong>Tension pneumothorax:</strong> Tracheal deviation, absent breath sounds, JVD — needle decompression immediately</li><li><strong>Cardiac tamponade:</strong> Beck's triad (hypotension, muffled heart sounds, JVD) — pericardiocentesis</li><li><strong>Distributive component:</strong> Sepsis, anaphylaxis superimposed on hypovolemia</li><li><strong>Cardiogenic component:</strong> Myocardial contusion in trauma</li></ul><p><strong>Massive Transfusion Protocol (MTP) Activation Criteria:</strong></p><ul><li>Estimated blood loss &gt;40% circulating blood volume</li><li>Ongoing haemorrhage with haemodynamic instability</li><li>Shock index (HR/SBP) &gt;1.0 in paediatric patients</li></ul>`,
  },
  {
    id: 338, // Module 2 Overview
    content: `<h3>Module Overview: Vasopressor Management and Haemorrhage Control</h3><p>When fluid resuscitation alone is insufficient, vasopressors are required to maintain adequate perfusion pressure. This module covers the selection and titration of vasopressors in haemorrhagic shock, the principles of damage control resuscitation (permissive hypotension, haemostatic resuscitation), and the role of tranexamic acid in reducing haemorrhage-related mortality.</p><p><strong>Learning Objectives:</strong></p><ul><li>Initiate noradrenaline for vasoplegic component of refractory shock</li><li>Apply permissive hypotension: target SBP 80–90 mmHg until surgical control</li><li>Administer tranexamic acid (TXA) 15 mg/kg IV (max 1g) within 3 hours of injury</li><li>Use balanced blood product resuscitation: pRBC:FFP:platelets = 1:1:1</li><li>Coordinate with surgical team for definitive haemorrhage control</li></ul>`,
  },
  {
    id: 343, // Module 3 Overview
    content: `<h3>Module Overview: Complications and ICU Management</h3><p>Massive haemorrhage and aggressive resuscitation carry significant complication risks. The lethal triad of hypothermia, acidosis, and coagulopathy must be actively prevented and treated. This module covers the management of coagulopathy, hypothermia, abdominal compartment syndrome, and the transition to ICU care after haemorrhage control.</p><p><strong>Learning Objectives:</strong></p><ul><li>Prevent and treat the lethal triad: hypothermia (&lt;35°C), acidosis (pH &lt;7.2), coagulopathy (INR &gt;1.5)</li><li>Warm all IV fluids and blood products</li><li>Administer calcium chloride 10–20 mg/kg IV for hypocalcaemia from massive transfusion</li><li>Monitor for abdominal compartment syndrome: bladder pressure &gt;20 mmHg</li><li>Arrange ICU admission with damage control surgery plan</li></ul>`,
  },
  {
    id: 346, // ARDS section
    content: `<h3>ARDS in the Context of Massive Haemorrhage</h3><p>Acute Respiratory Distress Syndrome (ARDS) is a common complication following massive haemorrhage and large-volume transfusion. Transfusion-Related Acute Lung Injury (TRALI) is a specific form that occurs within 6 hours of transfusion and is the leading cause of transfusion-related mortality.</p><p><strong>ARDS Diagnostic Criteria (Berlin Definition):</strong></p><ul><li>Acute onset within 7 days of clinical insult</li><li>Bilateral opacities on chest imaging not explained by effusions or collapse</li><li>Respiratory failure not fully explained by cardiac failure or fluid overload</li><li>PaO2/FiO2 ratio: Mild 200–300, Moderate 100–200, Severe &lt;100 (with PEEP ≥5 cmH2O)</li></ul><p><strong>Management Principles:</strong></p><ul><li>Lung-protective ventilation: tidal volume 6 mL/kg IBW, plateau pressure &lt;30 cmH2O</li><li>PEEP optimisation to maintain oxygenation</li><li>Prone positioning for severe ARDS (PaO2/FiO2 &lt;150)</li><li>Conservative fluid strategy after haemorrhage control</li><li>Avoid further blood product transfusion unless clinically indicated</li></ul>`,
  },
  // ---- CARDIOGENIC SHOCK I (course 14) ----
  {
    id: 349, // Module 1 Overview
    content: `<h3>Module Overview: Cardiogenic Shock Recognition</h3><p>Cardiogenic shock is a state of low cardiac output resulting in inadequate tissue perfusion, despite adequate intravascular volume. It is the most haemodynamically complex form of shock and carries the highest mortality. In children, the most common causes are myocarditis, congenital heart disease, and arrhythmias. Early recognition and differentiation from other shock types is essential to avoid harmful interventions such as aggressive fluid loading.</p><p><strong>Learning Objectives:</strong></p><ul><li>Define cardiogenic shock and distinguish from distributive and hypovolemic shock</li><li>Identify clinical features: tachycardia, poor perfusion, hepatomegaly, gallop rhythm, raised JVP</li><li>Interpret bedside echocardiography findings: reduced EF, dilated ventricle, pericardial effusion</li><li>Identify common paediatric causes: myocarditis, dilated cardiomyopathy, ALCAPA, arrhythmia</li><li>Initiate first-line stabilisation: oxygen, cautious fluid (5–10 mL/kg), inotrope preparation</li></ul>`,
  },
  {
    id: 350, // Definition
    content: `<h3>Cardiogenic Shock: Definition, Causes, and Haemodynamic Profile</h3><p><strong>Definition:</strong> Cardiogenic shock is characterised by primary cardiac dysfunction leading to reduced cardiac output and tissue hypoperfusion, with evidence of elevated filling pressures (pulmonary oedema, hepatomegaly, raised JVP).</p><p><strong>Haemodynamic Profile:</strong></p><ul><li>Low cardiac output (CI &lt;2.2 L/min/m²)</li><li>Elevated filling pressures (PCWP &gt;18 mmHg)</li><li>Elevated SVR (cold, clammy extremities)</li><li>Hypotension (SBP &lt;5th percentile for age)</li></ul><p><strong>Common Paediatric Causes:</strong></p><ul><li><strong>Myocarditis:</strong> Viral (enterovirus, adenovirus, COVID-19) — most common cause in previously healthy children</li><li><strong>Dilated Cardiomyopathy:</strong> Idiopathic, familial, metabolic</li><li><strong>ALCAPA:</strong> Anomalous left coronary artery from pulmonary artery — presents in infancy</li><li><strong>Arrhythmia:</strong> SVT, complete heart block, VT</li><li><strong>Post-cardiac surgery:</strong> Low cardiac output syndrome</li><li><strong>Septic cardiomyopathy:</strong> Myocardial depression in severe sepsis</li></ul>`,
  },
  // ---- CARDIOGENIC SHOCK II (course 15) ----
  {
    id: 355, // Module 1 Overview
    content: `<h3>Module Overview: Advanced Inotrope Combinations</h3><p>When first-line inotrope therapy (dobutamine or milrinone) fails to restore adequate cardiac output, combination inotrope strategies and mechanical circulatory support must be considered. This module covers the pharmacology and dosing of second-line inotropes, the rationale for combination therapy, and the indications for escalation to mechanical circulatory support devices including ECMO.</p><p><strong>Learning Objectives:</strong></p><ul><li>Identify failure criteria for first-line inotrope therapy</li><li>Add vasopressin for vasoplegic component of cardiogenic shock</li><li>Combine milrinone + noradrenaline for low-output, low-resistance states</li><li>Recognise indications for IABP, VAD, or ECMO</li><li>Prepare for urgent cardiac catheterisation or surgical intervention</li></ul>`,
  },
  {
    id: 360, // Module 2 Overview
    content: `<h3>Module Overview: ECMO Support for Refractory Cardiogenic Shock</h3><p>Extracorporeal membrane oxygenation (ECMO) is the ultimate rescue therapy for refractory cardiogenic shock unresponsive to maximal medical therapy. Venoarterial ECMO (VA-ECMO) provides both cardiac and respiratory support, allowing the heart to rest and recover. This module covers ECMO indications, contraindications, cannulation strategies, and the management of common ECMO complications in paediatric patients.</p><p><strong>Learning Objectives:</strong></p><ul><li>Define ECMO indications: refractory cardiogenic shock, cardiac arrest, bridge to transplant</li><li>Identify absolute contraindications: irreversible multi-organ failure, severe neurological injury</li><li>Understand VA-ECMO circuit: cannula placement, flow rates, anticoagulation</li><li>Recognise ECMO complications: bleeding, thrombosis, limb ischaemia, infection</li><li>Plan ECMO weaning and decannulation criteria</li></ul>`,
  },
  {
    id: 365, // Module 3 Overview
    content: `<h3>Module Overview: Specific Cardiogenic Shock Scenarios</h3><p>Different underlying causes of cardiogenic shock require tailored management approaches. This module covers three high-priority scenarios: acute myocarditis with cardiogenic shock, arrhythmia-induced cardiogenic shock, and post-cardiac surgery low cardiac output syndrome. Each scenario has distinct management priorities and pitfalls.</p><p><strong>Learning Objectives:</strong></p><ul><li>Manage acute myocarditis: avoid digoxin, use milrinone, consider IVIG</li><li>Treat SVT causing cardiogenic shock: adenosine, synchronised cardioversion</li><li>Manage post-cardiac surgery low output: optimise preload, reduce afterload, pacing</li><li>Identify when to activate cardiac transplant listing</li><li>Coordinate multi-disciplinary team: cardiology, cardiac surgery, PICU</li></ul>`,
  },
  // ---- BURNS I (course 16) ----
  {
    id: 370, // Module 1 Overview
    content: `<h3>Module Overview: Burn Classification and TBSA Calculation</h3><p>Accurate assessment of burn depth and total body surface area (TBSA) is the foundation of paediatric burn management. It determines fluid resuscitation volume, the need for escharotomy, wound care strategy, and referral criteria. Children have different body proportions from adults, requiring age-specific TBSA calculation tools. This module covers burn depth classification, TBSA estimation using the Lund-Browder chart, and the initial clinical assessment of the burned child.</p><p><strong>Learning Objectives:</strong></p><ul><li>Classify burn depth: superficial, partial thickness (superficial/deep), full thickness</li><li>Calculate TBSA using the Lund-Browder chart (not the Rule of Nines for children &lt;15 years)</li><li>Identify criteria for major burn: TBSA ≥10% in children, full thickness, face/hands/genitalia/circumferential</li><li>Perform primary survey: airway burns, inhalation injury, carbon monoxide poisoning</li><li>Initiate first-aid: cool running water 20 minutes, cover with cling film</li></ul>`,
  },
  {
    id: 375, // Module 2 Overview
    content: `<h3>Module Overview: First-Hour Fluid Resuscitation in Burns</h3><p>Fluid resuscitation is the most critical intervention in the first 24 hours of major burn management. Inadequate resuscitation leads to burn shock and organ failure; over-resuscitation causes oedema, abdominal compartment syndrome, and respiratory failure. This module covers the Parkland formula for paediatric burns, the addition of maintenance fluids for children, and the monitoring parameters used to guide resuscitation.</p><p><strong>Learning Objectives:</strong></p><ul><li>Calculate resuscitation fluid using the modified Parkland formula: 3–4 mL/kg/% TBSA Ringer's lactate over 24 hours</li><li>Add maintenance fluids for children: use Holliday-Segar formula</li><li>Give half the calculated volume in the first 8 hours from time of burn</li><li>Target urine output: 0.5–1 mL/kg/hr in children, 1 mL/kg/hr in infants</li><li>Avoid colloid in the first 8–12 hours</li></ul>`,
  },
  {
    id: 380, // Module 3 Overview
    content: `<h3>Module Overview: Airway Management and Transfer in Burns</h3><p>Inhalation injury and airway burns are the leading cause of early mortality in paediatric burns. The paediatric airway is particularly vulnerable due to its small diameter and the rapid development of oedema. Early intubation before oedema develops is critical. This module covers the recognition of inhalation injury, indications for early intubation, carbon monoxide poisoning management, and the criteria and preparation for transfer to a specialist burns centre.</p><p><strong>Learning Objectives:</strong></p><ul><li>Identify signs of inhalation injury: singed nasal hairs, hoarse voice, stridor, carbonaceous sputum</li><li>Perform rapid sequence intubation early before airway oedema develops</li><li>Administer 100% oxygen for carbon monoxide poisoning (COHb &gt;25% consider HBO)</li><li>Apply transfer criteria: burns &gt;10% TBSA, face/airway burns, circumferential burns, suspected non-accidental injury</li><li>Prepare transfer documentation: fluid balance, analgesia, wound dressings</li></ul>`,
  },
  // ---- BURNS II (course 17) ----
  {
    id: 385, // Module 1 Overview
    content: `<h3>Module Overview: Fluid Resuscitation Optimisation in Burns</h3><p>After the first 24 hours, fluid management in burns shifts from resuscitation to maintenance and replacement of ongoing losses. Colloid supplementation becomes appropriate, and the risk of fluid creep (over-resuscitation) must be actively managed. This module covers the transition from crystalloid to colloid, the use of albumin in burns resuscitation, and the management of oedema and abdominal compartment syndrome.</p><p><strong>Learning Objectives:</strong></p><ul><li>Transition to colloid after 8–12 hours: 5% albumin 0.3–1 mL/kg/% TBSA over 24 hours</li><li>Reduce crystalloid rate to avoid fluid creep</li><li>Monitor for abdominal compartment syndrome: bladder pressure, abdominal distension</li><li>Manage pulmonary oedema: diuretics, ventilator optimisation</li><li>Target: urine output 0.5–1 mL/kg/hr, no oedema progression</li></ul>`,
  },
  {
    id: 390, // Module 2 Overview
    content: `<h3>Module Overview: Burn Complications and Management</h3><p>Major burns are associated with a systemic inflammatory response that affects every organ system. This module covers the most clinically significant complications: burn wound infection and sepsis, inhalation injury and ARDS, acute kidney injury, and the hypermetabolic response. Early enteral nutrition and infection surveillance are key management priorities.</p><p><strong>Learning Objectives:</strong></p><ul><li>Identify signs of burn wound infection: cellulitis, purulent exudate, fever, leucocytosis</li><li>Initiate empiric antibiotics for burn sepsis: piperacillin-tazobactam + amikacin</li><li>Manage ARDS: lung-protective ventilation, prone positioning</li><li>Prevent AKI: maintain urine output, avoid nephrotoxins</li><li>Start enteral nutrition within 6 hours of admission</li></ul>`,
  },
  {
    id: 395, // Module 3 Overview
    content: `<h3>Module Overview: Nutritional Support and Long-Term Management</h3><p>The hypermetabolic response to major burns can increase energy expenditure by 100–200% above baseline, persisting for up to 2 years after injury. Aggressive nutritional support is essential to prevent muscle wasting, impaired wound healing, and immune dysfunction. This module covers caloric and protein requirements, enteral vs. parenteral nutrition, wound care principles, and the long-term rehabilitation plan for paediatric burn survivors.</p><p><strong>Learning Objectives:</strong></p><ul><li>Calculate caloric requirements: Galveston formula for children (1800 kcal/m² TBSA burned + 1500 kcal/m² total BSA)</li><li>Target protein intake: 2.5–4 g/kg/day</li><li>Prefer enteral over parenteral nutrition</li><li>Use anabolic agents: oxandrolone, propranolol to reduce hypermetabolism</li><li>Plan surgical wound coverage: skin grafting, dermal substitutes</li></ul>`,
  },
  // ---- PNEUMONIA II (course 19) ----
  {
    id: 399, // Module 1 Overview
    content: `<h3>Module Overview: Advanced Ventilator Strategies for ARDS</h3><p>Severe pneumonia complicated by ARDS requires lung-protective ventilation strategies to prevent ventilator-induced lung injury (VILI). The ARDSNet protocol and subsequent evidence have established tidal volume limitation, PEEP optimisation, and prone positioning as the cornerstones of ARDS ventilation. This module covers the application of these strategies in paediatric patients with pneumonia-associated ARDS.</p><p><strong>Learning Objectives:</strong></p><ul><li>Apply lung-protective ventilation: tidal volume 5–7 mL/kg IBW, plateau pressure &lt;28 cmH2O</li><li>Optimise PEEP using the PEEP-FiO2 table or driving pressure minimisation</li><li>Initiate prone positioning for severe ARDS (PaO2/FiO2 &lt;150) for ≥16 hours/day</li><li>Use neuromuscular blockade for severe ARDS in the first 48 hours</li><li>Recognise indications for HFOV or ECMO</li></ul>`,
  },
  {
    id: 403, // Module 2 Overview
    content: `<h3>Module Overview: ARDS Complications and Management</h3><p>ARDS is associated with multiple life-threatening complications that require active surveillance and management. Ventilator-associated pneumonia (VAP), pneumothorax from barotrauma, right heart failure from pulmonary hypertension, and multi-organ dysfunction are the most clinically significant. This module covers the prevention and management of each complication in the context of paediatric ARDS.</p><p><strong>Learning Objectives:</strong></p><ul><li>Implement VAP prevention bundle: head-of-bed elevation 30°, oral chlorhexidine, subglottic suctioning</li><li>Recognise and manage barotrauma: pneumothorax, pneumomediastinum</li><li>Manage pulmonary hypertension: inhaled nitric oxide 5–20 ppm, sildenafil</li><li>Monitor for right ventricular failure: echocardiography, CVP trends</li><li>Apply conservative fluid strategy after resuscitation phase</li></ul>`,
  },
  {
    id: 407, // Module 3 Overview
    content: `<h3>Module Overview: Extracorporeal Support and Long-Term Outcomes</h3><p>When conventional ventilation fails to maintain adequate gas exchange in severe ARDS, extracorporeal support with ECMO provides a rescue option. Venovenous ECMO (VV-ECMO) supports respiratory function while allowing the lungs to rest and recover. This module covers ECMO indications in ARDS, the management of ECMO-related complications, and the long-term pulmonary outcomes in paediatric ARDS survivors.</p><p><strong>Learning Objectives:</strong></p><ul><li>Apply ECMO indications: PaO2/FiO2 &lt;80 despite optimal ventilation, uncompensated respiratory acidosis</li><li>Understand VV-ECMO circuit and management principles</li><li>Manage ECMO complications: bleeding, clotting, circuit failure</li><li>Plan ECMO weaning: trial off ECMO when lung compliance improves</li><li>Counsel families on long-term pulmonary outcomes: restrictive lung disease, exercise limitation</li></ul>`,
  },
  // ---- SEVERE MALARIA I (course 20) ----
  {
    id: 381, // Module 1 Overview (using actual IDs from audit)
    content: `<h3>Module Overview: Severe Malaria Recognition</h3><p>Severe malaria is a medical emergency with high mortality if not treated promptly. In sub-Saharan Africa, Plasmodium falciparum is responsible for virtually all severe malaria in children. The WHO 2015 criteria define severe malaria by the presence of one or more life-threatening features. This module covers the clinical recognition of severe malaria, the WHO severity criteria, and the initial assessment of the severely ill child with suspected malaria.</p><p><strong>Learning Objectives:</strong></p><ul><li>Apply WHO 2015 criteria for severe malaria: impaired consciousness, respiratory distress, severe anaemia, hyperparasitaemia, hypoglycaemia, renal failure, circulatory collapse</li><li>Perform rapid diagnostic test (RDT) and thick blood film</li><li>Assess for hypoglycaemia: check glucose immediately on presentation</li><li>Identify cerebral malaria: Blantyre Coma Scale ≤2</li><li>Initiate IV artesunate as first-line treatment</li></ul>`,
  },
  {
    id: 382, // Uncomplicated Malaria section
    content: `<h3>Distinguishing Severe from Uncomplicated Malaria</h3><p><strong>Uncomplicated Malaria:</strong> Symptomatic malaria (fever, chills, headache, vomiting) without any features of severity. Treated with oral artemisinin-based combination therapy (ACT): artemether-lumefantrine (AL) for 3 days.</p><p><strong>WHO 2015 Criteria for Severe Malaria (any one feature):</strong></p><ul><li><strong>Impaired consciousness:</strong> Blantyre Coma Scale ≤2 (cerebral malaria)</li><li><strong>Respiratory distress:</strong> Deep breathing (acidotic breathing), SpO2 &lt;90%</li><li><strong>Multiple convulsions:</strong> ≥2 in 24 hours</li><li><strong>Circulatory collapse:</strong> Shock, SBP &lt;70 mmHg</li><li><strong>Abnormal bleeding:</strong> DIC features</li><li><strong>Jaundice:</strong> Clinical jaundice + evidence of vital organ dysfunction</li><li><strong>Severe anaemia:</strong> Hb &lt;5 g/dL (or &lt;7 g/dL with respiratory distress)</li><li><strong>Hypoglycaemia:</strong> Blood glucose &lt;2.2 mmol/L (&lt;40 mg/dL)</li><li><strong>Hyperparasitaemia:</strong> Parasitaemia &gt;10% (high-transmission areas) or &gt;5% (low-transmission)</li><li><strong>Renal impairment:</strong> Creatinine &gt;265 mcmol/L</li><li><strong>Pulmonary oedema:</strong> Radiological or SpO2 &lt;92% on room air</li></ul>`,
  },
  {
    id: 386, // Module 2 Overview
    content: `<h3>Module Overview: Artemether Therapy and Supportive Care</h3><p>IV artesunate is the WHO-recommended first-line treatment for severe malaria in all age groups, having replaced quinine due to superior efficacy and safety. This module covers the dosing and administration of IV artesunate, the management of hypoglycaemia (the most immediately life-threatening complication), fluid management in severe malaria, and the transition to oral ACT after clinical improvement.</p><p><strong>Learning Objectives:</strong></p><ul><li>Administer IV artesunate: 2.4 mg/kg IV at 0, 12, 24 hours, then every 24 hours</li><li>Treat hypoglycaemia: 2–5 mL/kg 10% dextrose IV bolus, then dextrose infusion</li><li>Manage fluid balance: avoid over-hydration (risk of pulmonary oedema and cerebral oedema)</li><li>Treat severe anaemia: transfuse pRBC 10 mL/kg if Hb &lt;5 g/dL or &lt;7 g/dL with respiratory distress</li><li>Transition to oral ACT after 24 hours of IV artesunate and clinical improvement</li></ul>`,
  },
  {
    id: 387, // Artemether Dosing section
    content: `<h3>IV Artesunate: Dosing, Administration, and Monitoring</h3><p><strong>IV Artesunate Dosing:</strong></p><ul><li>Children &lt;20 kg: 3 mg/kg IV per dose</li><li>Children ≥20 kg: 2.4 mg/kg IV per dose</li><li>Schedule: 0 hours, 12 hours, 24 hours, then every 24 hours until oral therapy possible</li><li>Minimum IV course: 24 hours (3 doses)</li></ul><p><strong>Reconstitution:</strong> Dissolve in 1 mL 5% sodium bicarbonate, then dilute in 5 mL 5% dextrose. Administer IV over 1–2 minutes or IM if IV access unavailable.</p><p><strong>Post-Artesunate Haemolytic Anaemia (PAHA):</strong> A delayed haemolytic anaemia occurring 2–3 weeks after IV artesunate in patients with high initial parasitaemia. Monitor FBC weekly for 4 weeks after treatment. Transfuse if symptomatic anaemia develops.</p><p><strong>Transition to Oral ACT:</strong> Switch to artemether-lumefantrine (AL) or artesunate-amodiaquine (ASAQ) once patient can tolerate oral medications and parasitaemia is falling. Complete a full 3-day oral course.</p>`,
  },
  {
    id: 391, // Module 3 Overview
    content: `<h3>Module Overview: Severe Malaria Complications and Escalation</h3><p>Severe malaria can affect every organ system. The most common life-threatening complications are cerebral malaria, severe anaemia, respiratory distress from metabolic acidosis, and hypoglycaemia. This module covers the management of each complication, the indications for ICU admission, and the criteria for escalation to mechanical ventilation or renal replacement therapy.</p><p><strong>Learning Objectives:</strong></p><ul><li>Manage cerebral malaria: airway protection, anticonvulsants, avoid steroids</li><li>Treat severe anaemia: transfuse pRBC, monitor for transfusion reactions</li><li>Manage respiratory distress: oxygen, CPAP, mechanical ventilation if needed</li><li>Prevent and treat hypoglycaemia: continuous glucose monitoring, dextrose infusion</li><li>Identify indications for renal replacement therapy: AKI with fluid overload or severe acidosis</li></ul>`,
  },
  // ---- SEVERE MALARIA II (course 21) ----
  {
    id: 397, // Module 1 Overview
    content: `<h3>Module Overview: Cerebral Malaria Pathophysiology and Management</h3><p>Cerebral malaria (CM) is defined as Plasmodium falciparum malaria with impaired consciousness (Blantyre Coma Scale ≤2) in the absence of other causes. It is the most severe neurological complication of malaria and carries a case fatality rate of 15–25% even with treatment. Neurological sequelae occur in 25% of survivors. This module covers the pathophysiology, clinical assessment, and evidence-based management of cerebral malaria.</p><p><strong>Learning Objectives:</strong></p><ul><li>Assess Blantyre Coma Scale (BCS): eye, verbal, motor responses (max 5, CM ≤2)</li><li>Perform lumbar puncture to exclude bacterial meningitis (if safe)</li><li>Protect airway: intubate if BCS ≤2 or seizures uncontrolled</li><li>Treat seizures: IV diazepam 0.3 mg/kg, then phenobarbitone 15–20 mg/kg if refractory</li><li>Avoid steroids (harmful in cerebral malaria), mannitol (no proven benefit)</li></ul>`,
  },
  {
    id: 402, // Module 2 Overview
    content: `<h3>Module Overview: Severe Anaemia and Transfusion Management in Malaria</h3><p>Severe malarial anaemia (Hb &lt;5 g/dL or &lt;7 g/dL with respiratory distress) is a leading cause of malaria-related mortality in African children under 5. Rapid haemolysis of parasitised and non-parasitised red cells, dyserythropoiesis, and splenic sequestration all contribute. Timely blood transfusion is life-saving but carries risks of transfusion reactions and volume overload. This module covers transfusion decision-making, product selection, and monitoring.</p><p><strong>Learning Objectives:</strong></p><ul><li>Apply transfusion thresholds: Hb &lt;5 g/dL (any patient) or Hb &lt;7 g/dL with respiratory distress</li><li>Administer pRBC 10 mL/kg over 3–4 hours</li><li>Monitor for transfusion reactions: fever, haemolysis, TACO, TRALI</li><li>Avoid over-transfusion: risk of pulmonary oedema in cerebral malaria</li><li>Recheck Hb 4 hours post-transfusion</li></ul>`,
  },
  {
    id: 407, // Module 3 Overview (reused ID from earlier — check actual ID)
    content: `<h3>Module Overview: Malaria Complications and Long-Term Outcomes</h3><p>Severe malaria survivors face significant risks of long-term neurological, cognitive, and haematological sequelae. Cerebral malaria survivors have a 25% risk of neurological deficits including epilepsy, cognitive impairment, and behavioural disorders. This module covers the management of late complications, discharge planning, malaria prevention, and the long-term follow-up of severe malaria survivors.</p><p><strong>Learning Objectives:</strong></p><ul><li>Manage post-malaria neurological syndrome (PMNS): seizures, psychosis, ataxia</li><li>Treat disseminated intravascular coagulation (DIC): FFP, cryoprecipitate, platelets</li><li>Plan discharge: oral ACT completion, malaria prevention counselling</li><li>Arrange neurodevelopmental follow-up for cerebral malaria survivors</li><li>Prescribe malaria prophylaxis for high-risk children</li></ul>`,
  },
  {
    id: 410, // DIC section
    content: `<h3>Disseminated Intravascular Coagulation (DIC) in Severe Malaria</h3><p>DIC occurs in severe malaria due to endothelial activation, cytokine release, and consumption of clotting factors. It manifests as simultaneous thrombosis and haemorrhage, and is associated with high mortality.</p><p><strong>Diagnostic Criteria (ISTH DIC Score ≥5):</strong></p><ul><li>Platelet count: &lt;50 × 10⁹/L (2 points), 50–100 (1 point)</li><li>Fibrin markers (D-dimer): strong increase (3 points), moderate (2 points)</li><li>PT prolongation: &gt;6 seconds (2 points), 3–6 seconds (1 point)</li><li>Fibrinogen: &lt;1 g/L (1 point)</li></ul><p><strong>Management:</strong></p><ul><li>Treat the underlying cause (malaria) with IV artesunate</li><li>FFP 10–15 mL/kg for active bleeding with elevated PT/APTT</li><li>Cryoprecipitate 5–10 mL/kg for fibrinogen &lt;1.5 g/L</li><li>Platelets 10–15 mL/kg if &lt;20 × 10⁹/L or active bleeding</li><li>Avoid heparin in malaria-associated DIC</li></ul>`,
  },
  // ---- AKI (course 22) ----
  {
    id: 413, // Module 1 Overview
    content: `<h3>Module Overview: AKI Classification and Recognition</h3><p>Acute kidney injury (AKI) is a common and serious complication in critically ill children, associated with increased mortality, prolonged ICU stay, and risk of chronic kidney disease. Early recognition using the KDIGO criteria and identification of the underlying cause are essential for timely intervention. This module covers the KDIGO AKI staging system, common paediatric causes, and the clinical assessment of the child with suspected AKI.</p><p><strong>Learning Objectives:</strong></p><ul><li>Apply KDIGO AKI staging: Stage 1 (creatinine ×1.5 or UO &lt;0.5 mL/kg/hr ×6h), Stage 2 (×2 or UO &lt;0.5 ×12h), Stage 3 (×3 or UO &lt;0.3 ×24h or anuria ×12h)</li><li>Classify AKI as pre-renal, intrinsic renal, or post-renal</li><li>Identify common paediatric causes: sepsis, hypovolemia, nephrotoxins, HUS, glomerulonephritis</li><li>Perform urinalysis, urine microscopy, and fractional excretion of sodium (FeNa)</li><li>Recognise life-threatening complications: hyperkalaemia, severe acidosis, fluid overload</li></ul>`,
  },
  {
    id: 417, // Module 2 Overview
    content: `<h3>Module Overview: Fluid Management and Monitoring in AKI</h3><p>Fluid management in AKI requires a careful balance: adequate resuscitation to restore renal perfusion in pre-renal AKI, while avoiding fluid overload which worsens outcomes in established AKI. Fluid overload (&gt;10% body weight) is independently associated with increased mortality in paediatric AKI. This module covers fluid resuscitation strategies, diuretic use, and the monitoring parameters used to guide fluid management.</p><p><strong>Learning Objectives:</strong></p><ul><li>Distinguish pre-renal from intrinsic AKI: fluid challenge 10 mL/kg, reassess urine output</li><li>Avoid fluid overload: target &lt;10% fluid accumulation</li><li>Use furosemide for fluid overload (not to treat AKI): 1–2 mg/kg IV</li><li>Monitor: urine output hourly, daily weight, serum electrolytes every 6–12 hours</li><li>Restrict fluids to insensible losses + urine output in oliguric AKI</li></ul>`,
  },
  {
    id: 422, // Module 3 Overview
    content: `<h3>Module Overview: Dialysis Indications and Complications</h3><p>Renal replacement therapy (RRT) is required when AKI causes life-threatening complications that cannot be managed conservatively. In children, peritoneal dialysis (PD) is often the first-line modality in resource-limited settings due to its simplicity and low cost. Continuous renal replacement therapy (CRRT) is preferred in haemodynamically unstable patients. This module covers the indications for RRT, modality selection, and the management of dialysis-related complications.</p><p><strong>Learning Objectives:</strong></p><ul><li>Apply RRT indications: severe hyperkalaemia (K+ &gt;6.5 mmol/L), severe acidosis (pH &lt;7.1), fluid overload &gt;20%, uraemia (urea &gt;30 mmol/L with symptoms)</li><li>Select RRT modality: PD (resource-limited, haemodynamically stable), CRRT (unstable), IHD (stable, older children)</li><li>Manage PD complications: peritonitis, catheter blockage, protein loss</li><li>Manage CRRT complications: circuit clotting, anticoagulation bleeding</li><li>Plan RRT weaning: monitor urine output recovery, electrolyte normalisation</li></ul>`,
  },
  // ---- SEVERE ANAEMIA (course 23) ----
  {
    id: 427, // Module 1 Overview
    content: `<h3>Module Overview: Severe Anaemia Recognition</h3><p>Severe anaemia (Hb &lt;6 g/dL in children) is a major cause of paediatric morbidity and mortality in sub-Saharan Africa, where malaria, nutritional deficiencies, and haemoglobinopathies are the leading causes. Acute severe anaemia with haemodynamic compromise requires emergency blood transfusion. This module covers the clinical recognition of severe anaemia, the assessment of haemodynamic stability, and the identification of the underlying cause.</p><p><strong>Learning Objectives:</strong></p><ul><li>Define severe anaemia: Hb &lt;6 g/dL (WHO) or Hb &lt;7 g/dL with respiratory distress</li><li>Assess haemodynamic stability: heart rate, respiratory rate, capillary refill, mental status</li><li>Identify clinical features of severe anaemia: pallor, tachycardia, flow murmur, cardiac failure</li><li>Classify by cause: haemolytic (malaria, sickle cell, G6PD), nutritional (iron, folate, B12), haemorrhagic, aplastic</li><li>Order appropriate investigations: FBC, reticulocyte count, blood film, Coombs test</li></ul>`,
  },
  {
    id: 431, // Module 2 Overview
    content: `<h3>Module Overview: Transfusion Management</h3><p>Blood transfusion is the definitive treatment for severe symptomatic anaemia. The decision to transfuse must balance the risk of undertransfusion (haemodynamic compromise, cardiac failure) against the risks of transfusion (reactions, infection, volume overload). This module covers transfusion thresholds, product selection, rate of administration, and the prevention and management of transfusion reactions.</p><p><strong>Learning Objectives:</strong></p><ul><li>Apply transfusion thresholds: Hb &lt;6 g/dL (any patient), Hb &lt;7 g/dL with respiratory distress or cardiac failure</li><li>Administer pRBC 10 mL/kg over 3–4 hours (slower if cardiac failure: 5 mL/kg over 4 hours)</li><li>Co-administer furosemide 1 mg/kg IV if signs of cardiac failure</li><li>Monitor during transfusion: temperature, HR, BP, SpO2 every 15 minutes</li><li>Recognise and manage transfusion reactions: febrile, allergic, haemolytic, TACO, TRALI</li></ul>`,
  },
  {
    id: 435, // Transfusion Reactions section
    content: `<h3>Transfusion Reactions: Recognition and Management</h3><p><strong>Types of Transfusion Reactions:</strong></p><table><tr><th>Type</th><th>Onset</th><th>Features</th><th>Management</th></tr><tr><td>Febrile non-haemolytic</td><td>During/after</td><td>Fever ≥1°C rise, chills</td><td>Slow/stop, paracetamol, restart if mild</td></tr><tr><td>Allergic/urticarial</td><td>During</td><td>Urticaria, pruritus</td><td>Stop, antihistamine, restart if mild</td></tr><tr><td>Acute haemolytic</td><td>Within 1h</td><td>Fever, back pain, haemoglobinuria, shock</td><td>STOP immediately, IV fluids, check compatibility</td></tr><tr><td>TACO</td><td>During/6h after</td><td>Pulmonary oedema, hypertension</td><td>Stop, furosemide, oxygen, upright position</td></tr><tr><td>TRALI</td><td>Within 6h</td><td>Non-cardiogenic pulmonary oedema, fever</td><td>Stop, supportive, O2, ventilation if needed</td></tr></table><p><strong>If acute haemolytic reaction suspected:</strong> Stop transfusion immediately. Send remaining blood + patient sample to blood bank. Check urine for haemoglobin. Maintain urine output &gt;1 mL/kg/hr with IV fluids. Do NOT restart transfusion until compatibility confirmed.</p>`,
  },
  {
    id: 436, // Module 3 Overview
    content: `<h3>Module Overview: Anaemia Complications and Prevention</h3><p>Severe anaemia causes tissue hypoxia that affects every organ system. The most immediately life-threatening complications are high-output cardiac failure and respiratory failure. Long-term complications include neurodevelopmental delay, growth retardation, and increased susceptibility to infection. This module covers the management of anaemia-related cardiac failure, the prevention of recurrence, and the treatment of the underlying cause.</p><p><strong>Learning Objectives:</strong></p><ul><li>Manage high-output cardiac failure: slow transfusion rate, furosemide, oxygen</li><li>Treat iron deficiency anaemia: oral iron 3–6 mg/kg/day elemental iron for 3 months</li><li>Treat malaria-related anaemia: antimalarial therapy + transfusion</li><li>Manage sickle cell crisis: hydration, analgesia, oxygen, exchange transfusion for acute chest syndrome</li><li>Prevent recurrence: malaria prophylaxis, iron supplementation, nutritional counselling</li></ul>`,
  },
  // ---- MENINGITIS II (course 25) ----
  // Module 61 (ICP Management) - needs sections seeded
  // ---- TRAUMA I (course 26) ----
  // Module 62 (Primary Survey) - needs sections seeded
  // ---- TRAUMA II (course 27) ----
  // Module 63 (Abdominal Trauma) - needs sections seeded
  // ---- ASTHMA II (course 28) ----
  {
    id: 204, // Status Asthmaticus Definition
    content: `<h3>Status Asthmaticus: Definition and Pathophysiology</h3><p><strong>Definition:</strong> Status asthmaticus is a severe, prolonged asthma exacerbation that fails to respond to initial bronchodilator therapy (≥3 doses of salbutamol and systemic corticosteroids within 1 hour) and carries a significant risk of respiratory failure and death.</p><p><strong>Pathophysiology:</strong> Severe bronchospasm + mucosal oedema + mucus plugging → progressive airflow obstruction → air trapping → dynamic hyperinflation → increased work of breathing → respiratory muscle fatigue → hypercapnia → respiratory failure.</p><p><strong>Life-Threatening Features (any one = immediate escalation):</strong></p><ul><li>Silent chest (no wheeze despite respiratory distress — severe obstruction)</li><li>SpO2 &lt;92% on high-flow oxygen</li><li>Cyanosis</li><li>Exhaustion, poor respiratory effort</li><li>Altered consciousness, agitation, confusion</li><li>Pulsus paradoxus &gt;25 mmHg</li><li>PaCO2 rising or normal (≥40 mmHg) in a distressed child — indicates impending failure</li></ul><p><strong>PICU Admission Criteria:</strong> Any life-threatening feature, failure to respond to IV magnesium, rising PaCO2, or clinical deterioration despite maximal therapy.</p>`,
  },
  {
    id: 206, // Module 2 Overview
    content: `<h3>Module Overview: Aggressive First-Hour Management of Status Asthmaticus</h3><p>The first hour of status asthmaticus management is critical. The goal is to rapidly reverse bronchospasm, reduce airway inflammation, and prevent respiratory failure. This module covers the sequential escalation of bronchodilator therapy, the evidence base for IV magnesium sulphate, the role of heliox, and the preparation for intubation if medical therapy fails.</p><p><strong>Learning Objectives:</strong></p><ul><li>Administer continuous nebulised salbutamol (0.15 mg/kg/hr, min 2.5 mg/hr) or MDI with spacer</li><li>Add ipratropium bromide (250–500 mcg) to first three nebulisations</li><li>Give IV hydrocortisone 4 mg/kg (max 200 mg) or prednisolone 1–2 mg/kg oral</li><li>Administer IV magnesium sulphate 25–40 mg/kg (max 2g) over 20 minutes</li><li>Consider IV salbutamol infusion (1–5 mcg/kg/min) for severe cases</li><li>Prepare for intubation: RSI with ketamine 1–2 mg/kg, avoid propofol in severe asthma</li></ul>`,
  },
  // ---- STATUS EPILEPTICUS II (course 29) ----
  {
    id: 213, // Module 1 Overview
    content: `<h3>Module Overview: Refractory Status Epilepticus Definition and Recognition</h3><p>Refractory status epilepticus (RSE) is defined as status epilepticus that continues despite adequate doses of two antiepileptic drugs (AEDs). Super-refractory status epilepticus (SRSE) continues or recurs ≥24 hours after the onset of anaesthetic therapy. Both RSE and SRSE carry high mortality and morbidity and require ICU-level management. This module covers the diagnostic criteria, EEG monitoring, and the clinical assessment of children with RSE.</p><p><strong>Learning Objectives:</strong></p><ul><li>Define RSE: seizures persisting after two adequate AED doses (benzodiazepine + second-line agent)</li><li>Define SRSE: seizures persisting ≥24 hours after anaesthetic therapy onset</li><li>Identify causes of RSE: structural (encephalitis, stroke), metabolic, autoimmune, febrile infection-related epilepsy syndrome (FIRES)</li><li>Initiate continuous EEG monitoring</li><li>Perform urgent MRI brain and LP (if safe) to identify underlying cause</li></ul>`,
  },
  {
    id: 216, // Module 2 Overview
    content: `<h3>Module Overview: Third-Line and ICU-Level Seizure Control</h3><p>When two AEDs fail to terminate status epilepticus, third-line therapy with anaesthetic agents is required. This represents a major escalation of care requiring ICU admission, intubation, and continuous EEG monitoring. This module covers the selection and titration of anaesthetic agents for RSE, the management of the intubated child with RSE, and the monitoring requirements for continuous EEG-guided therapy.</p><p><strong>Learning Objectives:</strong></p><ul><li>Initiate midazolam infusion (0.1–0.4 mg/kg/hr) as first anaesthetic agent</li><li>Escalate to propofol (2–5 mg/kg/hr) or thiopentone (2–4 mg/kg/hr) for SRSE</li><li>Target burst-suppression pattern on continuous EEG</li><li>Manage ventilator settings for the intubated child with RSE</li><li>Prevent complications: aspiration, hypotension, propofol infusion syndrome (PRIS)</li></ul>`,
  },
  {
    id: 220, // Module 3 Overview
    content: `<h3>Module Overview: SRSE Escalation and Long-Term Management</h3><p>Super-refractory status epilepticus (SRSE) is one of the most challenging conditions in paediatric critical care. When standard anaesthetic agents fail, experimental therapies including ketogenic diet, immunotherapy, and surgical interventions may be considered. This module covers the evidence base for SRSE escalation therapies, the management of FIRES (febrile infection-related epilepsy syndrome), and the long-term neurological outcomes and rehabilitation planning for SRSE survivors.</p><p><strong>Learning Objectives:</strong></p><ul><li>Initiate ketogenic diet for SRSE: 4:1 ratio, monitor for acidosis and hypoglycaemia</li><li>Consider immunotherapy for autoimmune/inflammatory SRSE: IVIG 2 g/kg, methylprednisolone 30 mg/kg, plasmapheresis</li><li>Manage FIRES: anakinra (IL-1 receptor antagonist) as emerging therapy</li><li>Plan surgical evaluation: resection, corpus callosotomy, VNS for structural causes</li><li>Arrange long-term epilepsy follow-up and neurodevelopmental assessment</li></ul>`,
  },
];

// =====================================================================
// MODULES THAT NEED SECTIONS SEEDED FROM SCRATCH
// (Meningitis II module 61, Trauma I module 62, Trauma II module 63,
//  Septic Shock I modules 2/3/4, Asthma I module 4, Status Epilepticus I modules)
// =====================================================================
const MODULES_NEEDING_SECTIONS: Array<{
  moduleId: number;
  courseTitle: string;
  sections: Array<{ title: string; content: string; order: number }>;
}> = [
  {
    moduleId: 61, // Meningitis II: ICP Management
    courseTitle: "Meningitis II",
    sections: [
      {
        title: "Overview",
        order: 0,
        content: `<h3>Module Overview: ICP Management in Bacterial Meningitis</h3><p>Raised intracranial pressure (ICP) is the most dangerous complication of bacterial meningitis, occurring in up to 30% of cases and responsible for most meningitis-related deaths. Early recognition and aggressive management of raised ICP can prevent cerebral herniation and improve neurological outcomes. This module covers the pathophysiology of raised ICP in meningitis, clinical recognition, and evidence-based management strategies.</p><p><strong>Learning Objectives:</strong></p><ul><li>Identify clinical signs of raised ICP: bulging fontanelle, papilloedema, Cushing's triad, posturing</li><li>Contraindications to lumbar puncture: papilloedema, focal neurology, GCS &lt;13, haemodynamic instability</li><li>Administer mannitol 0.25–0.5 g/kg IV or hypertonic saline 3% 2–5 mL/kg for acute ICP crisis</li><li>Maintain head position 30° elevation, avoid neck flexion</li><li>Target normocarbia: PaCO2 35–40 mmHg (avoid hyperventilation except for acute herniation)</li></ul>`,
      },
      {
        title: "Pathophysiology of Raised ICP in Meningitis",
        order: 1,
        content: `<h3>Pathophysiology of Raised ICP in Bacterial Meningitis</h3><p>Raised ICP in bacterial meningitis results from multiple mechanisms occurring simultaneously:</p><ul><li><strong>Cerebral oedema:</strong> Cytotoxic (cell swelling from direct bacterial toxin injury) and vasogenic (blood-brain barrier breakdown from inflammation)</li><li><strong>Increased CSF production:</strong> Inflammatory mediators stimulate choroid plexus</li><li><strong>Impaired CSF drainage:</strong> Exudate blocks arachnoid granulations</li><li><strong>Cerebral hyperaemia:</strong> Loss of cerebrovascular autoregulation → increased cerebral blood volume</li><li><strong>Hydrocephalus:</strong> Communicating (impaired reabsorption) or obstructive (exudate blocking CSF pathways)</li></ul><p><strong>Monro-Kellie Doctrine:</strong> The cranial vault is a fixed volume. Any increase in one component (brain, blood, CSF) must be compensated by a decrease in another. When compensatory mechanisms are exhausted, ICP rises exponentially.</p><p><strong>Cerebral Perfusion Pressure (CPP) = MAP − ICP.</strong> Target CPP: 50–60 mmHg in children. Raised ICP reduces CPP → cerebral ischaemia → secondary brain injury.</p>`,
      },
      {
        title: "Clinical Recognition of Raised ICP",
        order: 2,
        content: `<h3>Clinical Recognition of Raised ICP</h3><p><strong>Early Signs:</strong></p><ul><li>Headache (severe, worsening)</li><li>Vomiting (often projectile, not preceded by nausea)</li><li>Altered consciousness: irritability, confusion, drowsiness</li><li>Bulging fontanelle (infants)</li><li>Papilloedema (late sign, may be absent acutely)</li></ul><p><strong>Late Signs (impending herniation):</strong></p><ul><li><strong>Cushing's Triad:</strong> Hypertension + bradycardia + irregular respirations — a pre-terminal sign</li><li>Unilateral or bilateral fixed dilated pupils</li><li>Decerebrate or decorticate posturing</li><li>Apnoea</li></ul><p><strong>Herniation Syndromes:</strong></p><ul><li><strong>Uncal herniation:</strong> Ipsilateral CN III palsy (blown pupil) → contralateral hemiplegia</li><li><strong>Central herniation:</strong> Progressive rostral-caudal deterioration, bilateral signs</li><li><strong>Tonsillar herniation:</strong> Sudden apnoea, cardiovascular collapse</li></ul><p><strong>Action:</strong> Any sign of raised ICP or impending herniation → immediate mannitol/hypertonic saline + urgent CT head + neurosurgical consultation.</p>`,
      },
      {
        title: "ICP Management Protocol",
        order: 3,
        content: `<h3>ICP Management Protocol in Bacterial Meningitis</h3><p><strong>General Measures (all patients with suspected raised ICP):</strong></p><ul><li>Head of bed 30° elevation, midline head position</li><li>Avoid neck flexion, tight ETT ties, or anything increasing intrathoracic pressure</li><li>Maintain normoglycaemia: glucose 4–8 mmol/L</li><li>Maintain normothermia: treat fever aggressively</li><li>Avoid hypotonic fluids: use 0.9% NaCl</li><li>Maintain normonatraemia or mild hypernatraemia (Na 140–150 mmol/L)</li></ul><p><strong>Acute ICP Crisis Management:</strong></p><ol><li><strong>Mannitol 20%:</strong> 0.25–0.5 g/kg IV over 15–20 minutes. Repeat every 4–6 hours if needed. Monitor serum osmolality (target &lt;320 mOsm/kg). Contraindicated if serum osmolality &gt;320.</li><li><strong>Hypertonic Saline 3%:</strong> 2–5 mL/kg IV over 10–20 minutes. Preferred if hypotension present. Target serum Na 145–155 mmol/L.</li><li><strong>Controlled hyperventilation:</strong> Target PaCO2 30–35 mmHg ONLY for acute herniation as a bridge to definitive treatment. Avoid prolonged hyperventilation.</li><li><strong>Neurosurgical intervention:</strong> EVD for hydrocephalus, decompressive craniectomy for refractory ICP.</li></ol>`,
      },
    ],
  },
  {
    moduleId: 62, // Trauma I: Primary Survey
    courseTitle: "Trauma I",
    sections: [
      {
        title: "Overview",
        order: 0,
        content: `<h3>Module Overview: Primary Survey and Resuscitation in Paediatric Trauma</h3><p>The primary survey is a systematic, rapid assessment of life-threatening injuries using the ABCDE framework. In paediatric trauma, the primary survey must be performed simultaneously with resuscitation — assessment and treatment occur in parallel, not sequentially. This module covers the paediatric-specific modifications to the primary survey, the recognition of life-threatening injuries at each step, and the immediate interventions required.</p><p><strong>Learning Objectives:</strong></p><ul><li>Perform a structured ABCDE primary survey in the injured child</li><li>Identify and treat life-threatening injuries at each step: tension pneumothorax, massive haemorrhage, cardiac tamponade</li><li>Apply paediatric-specific considerations: airway anatomy, shock thresholds, fluid volumes</li><li>Obtain IV/IO access and initiate fluid resuscitation</li><li>Assign a Paediatric Trauma Score (PTS) or Revised Trauma Score (RTS)</li></ul>`,
      },
      {
        title: "Airway and Breathing Assessment",
        order: 1,
        content: `<h3>Airway and Breathing in Paediatric Trauma</h3><p><strong>Airway (A):</strong></p><ul><li>Assume cervical spine injury in all significant trauma until cleared</li><li>Use jaw thrust (not head tilt-chin lift) with in-line cervical stabilisation</li><li>Apply cervical collar if mechanism suggests C-spine injury</li><li>Clear airway: suction blood/secretions, remove foreign body</li><li>Intubate if: GCS ≤8, airway burns, expanding neck haematoma, respiratory failure</li><li>RSI: ketamine 1–2 mg/kg + succinylcholine 1–2 mg/kg (or rocuronium 1.2 mg/kg)</li></ul><p><strong>Breathing (B):</strong></p><ul><li>Expose chest: look for asymmetry, paradoxical movement, open wounds</li><li>Auscultate bilaterally</li><li><strong>Tension pneumothorax:</strong> Absent breath sounds + tracheal deviation + haemodynamic instability → immediate needle decompression (2nd ICS, MCL) → chest drain</li><li><strong>Open pneumothorax:</strong> Three-sided occlusive dressing → chest drain</li><li><strong>Haemothorax:</strong> Dullness to percussion → chest drain (28–32 Fr)</li><li><strong>Flail chest:</strong> Paradoxical movement → positive pressure ventilation</li></ul>`,
      },
      {
        title: "Circulation and Haemorrhage Control",
        order: 2,
        content: `<h3>Circulation and Haemorrhage Control in Paediatric Trauma</h3><p><strong>Haemorrhage Control (C):</strong></p><ul><li>Apply direct pressure to all external bleeding wounds</li><li>Tourniquet for life-threatening limb haemorrhage (junctional haemorrhage → pelvic binder or wound packing)</li><li>Recognise internal haemorrhage: haemothorax, haemoperitoneum, pelvic fracture, long bone fractures</li></ul><p><strong>Paediatric Shock Recognition:</strong></p><ul><li>Children compensate well — hypotension is a LATE sign (30–40% blood volume lost)</li><li>Early signs: tachycardia, prolonged CRT (&gt;2 sec), cool peripheries, decreased urine output</li><li>Blood volume: 70–80 mL/kg in children</li></ul><p><strong>Fluid Resuscitation:</strong></p><ul><li>Obtain 2 large-bore IV or IO access immediately</li><li>Warm Ringer's lactate 10–20 mL/kg bolus, reassess after each</li><li>Activate MTP if haemorrhagic shock: pRBC:FFP:platelets 1:1:1</li><li>Administer TXA 15 mg/kg IV (max 1g) within 3 hours of injury</li><li>Target: HR normalisation, CRT &lt;2 sec, MAP &gt;60 mmHg</li></ul>`,
      },
      {
        title: "Disability and Exposure",
        order: 3,
        content: `<h3>Disability and Exposure in Paediatric Trauma</h3><p><strong>Disability (D) — Neurological Assessment:</strong></p><ul><li>Assess GCS (modified for age in children &lt;5 years)</li><li>Pupil size and reactivity: unilateral fixed dilated pupil → herniation until proven otherwise</li><li>Check blood glucose: hypoglycaemia worsens neurological outcomes</li><li>Identify spinal cord injury: motor and sensory level, priapism in males</li><li>Paediatric GCS: Eye (4), Verbal (5, modified for age), Motor (6) — total 15</li><li>GCS ≤8: intubate and protect airway</li></ul><p><strong>Exposure (E):</strong></p><ul><li>Fully expose the child: remove all clothing</li><li>Log roll with C-spine control: examine back, buttocks, perineum</li><li>Prevent hypothermia: warm blankets, warm IV fluids, warm environment</li><li>Children have high surface area:body weight ratio → cool rapidly</li><li>Target temperature: 36–37.5°C</li></ul><p><strong>Adjuncts to Primary Survey:</strong></p><ul><li>Cardiac monitoring, SpO2, capnography (if intubated)</li><li>Chest X-ray, pelvis X-ray (portable)</li><li>FAST ultrasound: free fluid in abdomen/pericardium</li><li>Urinary catheter (if no urethral injury): target UO 1 mL/kg/hr</li></ul>`,
      },
    ],
  },
  {
    moduleId: 63, // Trauma II: Abdominal Trauma
    courseTitle: "Trauma II",
    sections: [
      {
        title: "Overview",
        order: 0,
        content: `<h3>Module Overview: Abdominal Trauma and Haemorrhage Control</h3><p>Abdominal trauma is the third most common cause of traumatic death in children, after head injury and thoracic trauma. Blunt abdominal trauma (from motor vehicle accidents, falls, non-accidental injury) is far more common than penetrating trauma in paediatric patients. The solid organs — liver, spleen, and kidney — are most commonly injured. This module covers the assessment, grading, and management of paediatric abdominal trauma, including the decision between non-operative and operative management.</p><p><strong>Learning Objectives:</strong></p><ul><li>Perform focused abdominal assessment: inspection, auscultation, palpation, FAST ultrasound</li><li>Grade solid organ injuries using CT findings (AAST grading scale)</li><li>Apply non-operative management (NOM) criteria for liver and spleen injuries</li><li>Identify indications for emergency laparotomy</li><li>Manage hollow viscus injury: bowel perforation, mesenteric tear</li></ul>`,
      },
      {
        title: "Abdominal Assessment and Imaging",
        order: 1,
        content: `<h3>Abdominal Assessment and Imaging in Paediatric Trauma</h3><p><strong>Clinical Assessment:</strong></p><ul><li>Inspect: bruising (seatbelt sign, handlebar bruise — high suspicion for hollow viscus injury), distension, guarding</li><li>Auscultate: absent bowel sounds suggest ileus or peritonitis</li><li>Palpate: tenderness, rigidity, rebound — peritonitis = surgical emergency</li><li>Seatbelt sign + lumbar spine fracture (Chance fracture) = high risk of bowel injury</li></ul><p><strong>FAST Ultrasound:</strong></p><ul><li>Rapid bedside assessment for free intraperitoneal fluid (haemoperitoneum)</li><li>Views: hepatorenal (Morrison's pouch), splenorenal, pelvic, pericardial</li><li>Positive FAST + haemodynamic instability = emergency laparotomy</li><li>Negative FAST does not exclude injury — solid organ injuries may not bleed immediately</li></ul><p><strong>CT Abdomen/Pelvis with IV Contrast:</strong></p><ul><li>Gold standard for haemodynamically stable patients</li><li>Identifies organ injuries, active bleeding (contrast blush), free fluid</li><li>AAST grading: Grade I–V for liver, spleen, kidney injuries</li><li>Grade IV–V injuries with active bleeding: consider angioembolisation or surgery</li></ul>`,
      },
      {
        title: "Non-Operative Management of Solid Organ Injuries",
        order: 2,
        content: `<h3>Non-Operative Management of Solid Organ Injuries</h3><p>Non-operative management (NOM) is the standard of care for haemodynamically stable children with liver, spleen, and kidney injuries, regardless of CT grade. Paediatric patients have excellent outcomes with NOM — splenectomy rates have fallen from 90% to &lt;5% over the past 30 years.</p><p><strong>NOM Criteria:</strong></p><ul><li>Haemodynamically stable (or responsive to initial fluid resuscitation)</li><li>No peritonitis or signs of hollow viscus injury</li><li>No other indication for laparotomy</li><li>CT-confirmed solid organ injury</li><li>Availability of ICU monitoring and surgical backup</li></ul><p><strong>NOM Protocol:</strong></p><ul><li>PICU admission for Grade III–V injuries</li><li>Bed rest: Grade I–II (1–2 days), Grade III (3–4 days), Grade IV–V (5–7 days)</li><li>Serial abdominal examinations every 4–6 hours</li><li>Serial FBC every 6–12 hours</li><li>NPO initially, advance diet as tolerated</li><li>Angioembolisation for active arterial bleeding on CT (Grade IV–V)</li></ul><p><strong>Failure of NOM (convert to surgery):</strong> Haemodynamic instability despite resuscitation, increasing transfusion requirements (&gt;40 mL/kg in 24 hours), peritonitis, or CT evidence of worsening injury.</p>`,
      },
      {
        title: "Emergency Laparotomy Indications and Damage Control Surgery",
        order: 3,
        content: `<h3>Emergency Laparotomy and Damage Control Surgery</h3><p><strong>Indications for Emergency Laparotomy:</strong></p><ul><li>Haemodynamic instability not responding to resuscitation</li><li>Positive FAST with haemodynamic instability</li><li>Peritonitis (bowel perforation, mesenteric tear)</li><li>Evisceration or penetrating abdominal trauma</li><li>Failure of NOM</li><li>Diaphragmatic rupture</li></ul><p><strong>Damage Control Surgery (DCS) Principles:</strong></p><p>DCS is a staged surgical approach for the most critically injured patients, prioritising haemorrhage control and contamination control over definitive repair.</p><ol><li><strong>Phase 1 (OR):</strong> Control haemorrhage (packing, vascular control), control contamination (bowel stapling), temporary abdominal closure</li><li><strong>Phase 2 (ICU):</strong> Resuscitation — correct lethal triad (hypothermia, acidosis, coagulopathy), 24–48 hours</li><li><strong>Phase 3 (OR):</strong> Definitive repair — bowel anastomosis, abdominal closure</li></ol><p><strong>Hollow Viscus Injury:</strong> Bowel perforation from blunt trauma (seatbelt injury) may have delayed presentation (6–24 hours). Signs: peritonitis, pneumoperitoneum on imaging, free fluid without solid organ injury. Requires laparotomy and bowel repair/resection.</p>`,
      },
    ],
  },
];

// =====================================================================
// QUIZ QUESTIONS FOR EMPTY QUIZZES
// =====================================================================
const QUIZ_QUESTIONS_TO_ADD: Array<{
  quizId: number;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;
}> = [
  // Meningitis II - Module 3 Quiz (quiz with 0 questions)
  // Pneumonia II - Module 1, 2, 3 Quizzes
  // Severe Malaria I - Module 1, 2 Quizzes
  // Trauma I, II, Meningitis II quizzes
];

async function main() {
  const db = await getDb();
  if (!db) { console.error("No DB"); process.exit(1); }

  let updated = 0;
  let sectionsAdded = 0;

  // 1. Update short/blank sections
  console.log(`\nUpdating ${SECTION_UPDATES.length} short/blank sections...`);
  for (const update of SECTION_UPDATES) {
    await db
      .update(moduleSections)
      .set({ content: update.content })
      .where(eq(moduleSections.id, update.id));
    updated++;
    if (updated % 10 === 0) console.log(`  Updated ${updated}/${SECTION_UPDATES.length} sections...`);
  }
  console.log(`✅ Updated ${updated} sections.`);

  // 2. Seed sections for modules that have none
  console.log(`\nSeeding sections for ${MODULES_NEEDING_SECTIONS.length} empty modules...`);
  for (const mod of MODULES_NEEDING_SECTIONS) {
    // Check if sections already exist
    const existing = await db
      .select()
      .from(moduleSections)
      .where(eq(moduleSections.moduleId, mod.moduleId));

    if (existing.length > 0) {
      console.log(`  [SKIP] Module ${mod.moduleId} (${mod.courseTitle}) already has ${existing.length} sections.`);
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
    console.log(`  ✅ Added ${mod.sections.length} sections to module ${mod.moduleId} (${mod.courseTitle})`);
  }
  console.log(`✅ Added ${sectionsAdded} new sections.`);

  // 3. Fix empty quiz questions
  console.log(`\nFixing empty quiz questions...`);
  
  // Get all quizzes with 0 questions
  const allQuizzes = await db.select().from(quizzes);
  let quizzesFixed = 0;
  
  for (const quiz of allQuizzes) {
    const existingQs = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quiz.id));
    
    if (existingQs.length > 0) continue;
    
    // Get the module to understand what course this is for
    const mod = await db
      .select()
      .from(modules)
      .where(eq(modules.id, quiz.moduleId))
      .limit(1);
    
    if (!mod.length) continue;
    
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, mod[0].courseId))
      .limit(1);
    
    if (!course.length) continue;
    
    console.log(`  Seeding questions for quiz ${quiz.id}: "${quiz.title}" (${course[0].title})`);
    
    // Generate 3 relevant questions based on module title
    const moduleTitle = mod[0].title;
    const courseTitle = course[0].title;
    
    const defaultQuestions = generateQuestionsForModule(moduleTitle, courseTitle, quiz.id);
    
    for (const q of defaultQuestions) {
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

function generateQuestionsForModule(moduleTitle: string, courseTitle: string, quizId: number) {
  // Generate clinically relevant questions based on module title
  const title = moduleTitle.toLowerCase();
  const course = courseTitle.toLowerCase();
  
  if (title.includes("icp") || title.includes("intracranial")) {
    return [
      { question: "What is the first-line agent for acute ICP crisis in bacterial meningitis?", options: ["Mannitol 0.25–0.5 g/kg IV", "Dexamethasone 0.15 mg/kg IV", "Furosemide 1 mg/kg IV", "Phenobarbitone 15 mg/kg IV"], correctAnswer: "Mannitol 0.25–0.5 g/kg IV", explanation: "Mannitol 20% at 0.25–0.5 g/kg IV over 15–20 minutes is first-line for acute ICP crisis. Hypertonic saline 3% is an alternative, especially if hypotension is present.", order: 0 },
      { question: "Which of the following is a contraindication to lumbar puncture in suspected meningitis?", options: ["Papilloedema on fundoscopy", "Fever above 39°C", "Neck stiffness", "Photophobia"], correctAnswer: "Papilloedema on fundoscopy", explanation: "Papilloedema indicates raised ICP, making LP dangerous due to risk of tonsillar herniation. Other contraindications include focal neurological signs, GCS <13, and haemodynamic instability.", order: 1 },
      { question: "What is the target cerebral perfusion pressure (CPP) in children with raised ICP?", options: ["50–60 mmHg", "30–40 mmHg", "70–80 mmHg", "20–30 mmHg"], correctAnswer: "50–60 mmHg", explanation: "CPP = MAP − ICP. Target CPP of 50–60 mmHg in children ensures adequate cerebral blood flow without excessive ICP elevation.", order: 2 },
    ];
  }
  
  if (title.includes("primary survey") || title.includes("trauma") && title.includes("survey")) {
    return [
      { question: "In paediatric trauma, what is the correct airway manoeuvre when cervical spine injury is suspected?", options: ["Jaw thrust with in-line cervical stabilisation", "Head tilt-chin lift", "Nasopharyngeal airway insertion", "Oropharyngeal airway only"], correctAnswer: "Jaw thrust with in-line cervical stabilisation", explanation: "Head tilt-chin lift is contraindicated when C-spine injury is suspected. Jaw thrust maintains the airway while minimising cervical spine movement.", order: 0 },
      { question: "What is the estimated blood volume in a paediatric patient?", options: ["70–80 mL/kg", "50–60 mL/kg", "90–100 mL/kg", "40–50 mL/kg"], correctAnswer: "70–80 mL/kg", explanation: "Paediatric blood volume is approximately 70–80 mL/kg. This is important for calculating transfusion volumes and estimating blood loss severity.", order: 1 },
      { question: "What is the first step in managing tension pneumothorax identified during the primary survey?", options: ["Immediate needle decompression (2nd ICS, MCL)", "Chest X-ray to confirm", "Insert chest drain immediately", "Administer oxygen and observe"], correctAnswer: "Immediate needle decompression (2nd ICS, MCL)", explanation: "Tension pneumothorax is a clinical diagnosis requiring immediate needle decompression at the 2nd intercostal space, midclavicular line. Do not wait for imaging.", order: 2 },
    ];
  }
  
  if (title.includes("abdominal") || title.includes("haemorrhage control")) {
    return [
      { question: "What is the standard of care for haemodynamically stable children with Grade III splenic injury?", options: ["Non-operative management (NOM)", "Emergency splenectomy", "Angioembolisation", "Exploratory laparotomy"], correctAnswer: "Non-operative management (NOM)", explanation: "NOM is the standard of care for haemodynamically stable children with solid organ injuries regardless of CT grade. Splenectomy rates have fallen from 90% to <5% with NOM.", order: 0 },
      { question: "What combination of findings should raise high suspicion for hollow viscus injury in blunt abdominal trauma?", options: ["Seatbelt sign + lumbar Chance fracture", "Haematuria + flank bruising", "Positive FAST + tachycardia", "Abdominal distension + fever"], correctAnswer: "Seatbelt sign + lumbar Chance fracture", explanation: "The combination of a seatbelt sign (abdominal wall bruising from seatbelt) and a Chance fracture (flexion-distraction lumbar fracture) is strongly associated with bowel injury.", order: 1 },
      { question: "What is the first phase of Damage Control Surgery (DCS)?", options: ["Control haemorrhage and contamination with temporary closure", "Definitive bowel repair and anastomosis", "ICU resuscitation to correct the lethal triad", "CT angiography and embolisation"], correctAnswer: "Control haemorrhage and contamination with temporary closure", explanation: "Phase 1 of DCS focuses on haemorrhage control (packing, vascular control) and contamination control (bowel stapling) with temporary abdominal closure. Definitive repair is deferred to Phase 3.", order: 2 },
    ];
  }
  
  if (title.includes("monitoring") || title.includes("escalation") || title.includes("criteria")) {
    return [
      { question: "What urine output target indicates adequate resuscitation in a critically ill child?", options: [">1 mL/kg/hr", ">0.5 mL/kg/hr", ">2 mL/kg/hr", ">0.3 mL/kg/hr"], correctAnswer: ">1 mL/kg/hr", explanation: "A urine output of >1 mL/kg/hr indicates adequate renal perfusion and resuscitation in critically ill children. Values below this suggest ongoing hypovolaemia or renal dysfunction.", order: 0 },
      { question: "Which of the following is an indication for ICU escalation in a child with severe infection?", options: ["Persistent haemodynamic instability despite 40 mL/kg fluid", "Temperature >38.5°C", "WBC >15 × 10⁹/L", "CRP >50 mg/L"], correctAnswer: "Persistent haemodynamic instability despite 40 mL/kg fluid", explanation: "Fluid-refractory shock (persistent instability despite 40–60 mL/kg fluid) is a clear indication for ICU admission and vasopressor initiation.", order: 1 },
      { question: "What is the most important early indicator of clinical deterioration in a child receiving IV therapy?", options: ["Increasing heart rate with worsening perfusion", "Rising temperature", "Increasing respiratory rate alone", "Decreasing appetite"], correctAnswer: "Increasing heart rate with worsening perfusion", explanation: "Tachycardia combined with worsening perfusion markers (prolonged CRT, cool extremities, altered consciousness) is the most reliable early indicator of deterioration in children.", order: 2 },
    ];
  }
  
  if (title.includes("ards") || title.includes("ventilat") || title.includes("respiratory")) {
    return [
      { question: "What tidal volume should be used for lung-protective ventilation in paediatric ARDS?", options: ["5–7 mL/kg ideal body weight", "10–12 mL/kg ideal body weight", "8–10 mL/kg ideal body weight", "3–4 mL/kg ideal body weight"], correctAnswer: "5–7 mL/kg ideal body weight", explanation: "Lung-protective ventilation uses tidal volumes of 5–7 mL/kg IBW with plateau pressure <28 cmH2O to prevent ventilator-induced lung injury (VILI).", order: 0 },
      { question: "When should prone positioning be initiated in paediatric ARDS?", options: ["PaO2/FiO2 ratio <150 despite optimal ventilation", "PaO2/FiO2 ratio <300", "SpO2 <95% on room air", "Any ARDS diagnosis"], correctAnswer: "PaO2/FiO2 ratio <150 despite optimal ventilation", explanation: "Prone positioning is indicated for severe ARDS (PaO2/FiO2 <150) and should be maintained for ≥16 hours per day. It improves oxygenation by recruiting dependent lung zones.", order: 1 },
      { question: "What is the most common complication of mechanical ventilation in ARDS?", options: ["Ventilator-associated pneumonia (VAP)", "Pneumothorax", "Pulmonary embolism", "Tracheal stenosis"], correctAnswer: "Ventilator-associated pneumonia (VAP)", explanation: "VAP is the most common complication of mechanical ventilation, occurring in 10–20% of ventilated patients. Prevention bundles (head elevation, oral care, subglottic suctioning) reduce incidence.", order: 2 },
    ];
  }
  
  if (title.includes("malaria") || title.includes("artemis") || title.includes("artesun")) {
    return [
      { question: "What is the WHO-recommended first-line treatment for severe malaria in children?", options: ["IV artesunate 2.4 mg/kg (3 mg/kg if <20 kg)", "IV quinine 10 mg/kg", "Oral artemether-lumefantrine", "IV chloroquine 10 mg/kg"], correctAnswer: "IV artesunate 2.4 mg/kg (3 mg/kg if <20 kg)", explanation: "IV artesunate replaced quinine as first-line treatment for severe malaria following the AQUAMAT trial, which showed 22.5% reduction in mortality in African children.", order: 0 },
      { question: "What is the most immediately life-threatening complication of severe malaria requiring emergency treatment?", options: ["Hypoglycaemia (blood glucose <2.2 mmol/L)", "Fever >40°C", "Parasitaemia >5%", "Jaundice"], correctAnswer: "Hypoglycaemia (blood glucose <2.2 mmol/L)", explanation: "Hypoglycaemia is the most immediately life-threatening complication of severe malaria. Check glucose on presentation and treat with 2–5 mL/kg 10% dextrose IV bolus followed by dextrose infusion.", order: 1 },
      { question: "What is the transfusion threshold for severe malarial anaemia in a child with respiratory distress?", options: ["Hb <7 g/dL", "Hb <10 g/dL", "Hb <5 g/dL only", "Hb <8 g/dL"], correctAnswer: "Hb <7 g/dL", explanation: "Transfuse pRBC 10 mL/kg when Hb <5 g/dL in any patient, or Hb <7 g/dL in the presence of respiratory distress. Avoid over-transfusion due to risk of pulmonary oedema.", order: 2 },
    ];
  }
  
  // Default generic clinical questions if no specific match
  return [
    { question: `In the management of ${courseTitle.split(':')[0]}, what is the primary goal of the initial assessment?`, options: ["Identify and treat life-threatening conditions immediately", "Complete documentation before treatment", "Obtain full history before any intervention", "Wait for laboratory results before acting"], correctAnswer: "Identify and treat life-threatening conditions immediately", explanation: "The primary survey follows the ABCDE approach to identify and simultaneously treat life-threatening conditions. Treatment should not be delayed for documentation or investigation results.", order: 0 },
    { question: "Which vital sign change is the earliest indicator of haemodynamic compromise in children?", options: ["Tachycardia", "Hypotension", "Bradycardia", "Hypertension"], correctAnswer: "Tachycardia", explanation: "Tachycardia is the earliest compensatory response to haemodynamic compromise in children. Hypotension is a late, pre-terminal sign indicating loss of >30–40% circulating blood volume.", order: 1 },
    { question: "What is the recommended initial oxygen delivery method for a critically ill child with SpO2 <90%?", options: ["High-flow oxygen via non-rebreather mask (10–15 L/min)", "Nasal cannula at 2 L/min", "Venturi mask at 28% FiO2", "Room air with close monitoring"], correctAnswer: "High-flow oxygen via non-rebreather mask (10–15 L/min)", explanation: "A non-rebreather mask at 10–15 L/min delivers FiO2 of approximately 0.85–0.95, which is appropriate for initial management of severe hypoxaemia. Titrate down once SpO2 >94%.", order: 2 },
  ];
}

main().catch((e) => { console.error(e); process.exit(1); });
