import { getDb } from './server/db';
import { quizQuestions, moduleSections } from './drizzle/schema';
import { eq } from 'drizzle-orm';

interface QuestionUpdate {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

async function updateQuestion(db: any, q: QuestionUpdate) {
  await db.update(quizQuestions).set({
    question: q.question,
    options: JSON.stringify(q.options),
    correctAnswer: JSON.stringify(q.correctAnswer),
    explanation: q.explanation,
  }).where(eq(quizQuestions.id, q.id));
}

async function main() {
  const db = await getDb();

  // ══════════════════════════════════════════════════════════════════════════
  // ASTHMA II (Quizzes 74, 75, 76) — replace duplicates of Asthma I (Quiz 6)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('Fixing Asthma II duplicate questions...');

  // Quiz 74 (Module 1: Recognizing Life-Threatening Asthma) — IDs 1172, 1173, 1174
  await updateQuestion(db, {
    id: 1172,
    question: 'A child with severe asthma has a silent chest, SpO2 of 82% on high-flow oxygen, and is becoming drowsy. What is the most appropriate immediate action?',
    options: ['Increase salbutamol nebulisation frequency', 'Prepare for urgent intubation and call for senior support immediately', 'Give IV magnesium sulfate and reassess in 30 minutes', 'Start heliox therapy'],
    correctAnswer: 'Prepare for urgent intubation and call for senior support immediately',
    explanation: 'A silent chest with drowsiness and severe hypoxia despite high-flow oxygen indicates impending respiratory arrest. Immediate preparation for intubation and senior support is mandatory. Delaying for further medical therapy risks cardiac arrest.',
  });
  await updateQuestion(db, {
    id: 1173,
    question: 'Which of the following is the most reliable clinical sign of severe asthma in a 4-year-old child?',
    options: ['Mild wheeze audible on auscultation', 'Inability to complete sentences, accessory muscle use, and SpO2 <92%', 'Mild tachycardia with normal work of breathing', 'Cough without wheeze'],
    correctAnswer: 'Inability to complete sentences, accessory muscle use, and SpO2 <92%',
    explanation: 'Inability to complete sentences, accessory muscle use, and SpO2 <92% are reliable markers of severe asthma in young children. These signs indicate significant airflow obstruction and impending respiratory failure.',
  });
  await updateQuestion(db, {
    id: 1174,
    question: 'Pulsus paradoxus >20 mmHg in a child with asthma indicates:',
    options: ['Mild asthma, safe for discharge', 'Severe asthma with significant air trapping and dynamic hyperinflation', 'Cardiac tamponade only', 'Normal physiological variation'],
    correctAnswer: 'Severe asthma with significant air trapping and dynamic hyperinflation',
    explanation: 'Pulsus paradoxus >20 mmHg reflects severe air trapping and dynamic hyperinflation causing significant intrathoracic pressure swings. It is a marker of severe asthma and correlates with the degree of airflow obstruction.',
  });

  // Quiz 75 (Module 2: Aggressive First-Hour Management) — IDs 1175, 1176, 1177
  await updateQuestion(db, {
    id: 1175,
    question: 'IV magnesium sulfate is used in status asthmaticus because it:',
    options: ['Acts as a bronchodilator by inhibiting calcium-mediated smooth muscle contraction', 'Reduces airway inflammation directly', 'Replaces inhaled salbutamol', 'Treats concurrent hypomagnesaemia only'],
    correctAnswer: 'Acts as a bronchodilator by inhibiting calcium-mediated smooth muscle contraction',
    explanation: 'Magnesium sulfate causes bronchodilation by inhibiting calcium-mediated smooth muscle contraction in the bronchial wall. It is indicated in severe asthma not responding to first-line bronchodilators. Dose: 25–75 mg/kg IV over 20 minutes (max 2.5 g).',
  });
  await updateQuestion(db, {
    id: 1176,
    question: 'Continuous salbutamol nebulisation (rather than intermittent dosing) is preferred in status asthmaticus because:',
    options: ['It is safer and has fewer side effects', 'It maintains sustained bronchodilation and reduces the interval between doses in a critically ill child', 'It is cheaper', 'It avoids the need for IV access'],
    correctAnswer: 'It maintains sustained bronchodilation and reduces the interval between doses in a critically ill child',
    explanation: 'Continuous nebulisation maintains sustained bronchodilation without the gaps between intermittent doses, which is critical in status asthmaticus where rapid deterioration can occur. Monitor heart rate and potassium closely due to beta-2 agonist effects.',
  });
  await updateQuestion(db, {
    id: 1177,
    question: 'A child with status asthmaticus fails to improve after salbutamol, ipratropium, IV magnesium, and IV hydrocortisone. What is the next step?',
    options: ['Discharge with oral prednisolone', 'Consider IV aminophylline or IV ketamine and prepare for PICU admission', 'Repeat salbutamol nebulisation only', 'Start antibiotics'],
    correctAnswer: 'Consider IV aminophylline or IV ketamine and prepare for PICU admission',
    explanation: 'Failure of first and second-line therapy (salbutamol, ipratropium, magnesium, corticosteroids) defines refractory status asthmaticus. IV aminophylline (loading dose 5 mg/kg over 20 min) or IV ketamine (1–2 mg/kg) may provide additional bronchodilation. PICU admission and intubation preparation are mandatory.',
  });

  // Quiz 76 (Module 3: Escalation and ICU Readiness) — IDs 1178, 1179, 1180, 1181
  await updateQuestion(db, {
    id: 1178,
    question: 'During mechanical ventilation for status asthmaticus, the ventilation strategy should prioritise:',
    options: ['High respiratory rate to normalise PaCO2', 'Permissive hypercapnia with low tidal volumes and prolonged expiratory time to prevent dynamic hyperinflation', 'High PEEP to prevent atelectasis', 'Pressure-controlled ventilation with high peak pressures'],
    correctAnswer: 'Permissive hypercapnia with low tidal volumes and prolonged expiratory time to prevent dynamic hyperinflation',
    explanation: 'In intubated asthma, the priority is preventing dynamic hyperinflation (breath stacking). This requires low respiratory rates (8–12/min), low tidal volumes (6 mL/kg), prolonged I:E ratio (1:3 or 1:4), and accepting permissive hypercapnia (PaCO2 50–70 mmHg). High peak pressures and air trapping risk pneumothorax.',
  });
  await updateQuestion(db, {
    id: 1179,
    question: 'Tension pneumothorax during mechanical ventilation for asthma presents with:',
    options: ['Gradual improvement in oxygenation', 'Sudden haemodynamic collapse, absent breath sounds on one side, and rising peak airway pressures', 'Bilateral wheeze and stable vital signs', 'Gradual rise in PaCO2 only'],
    correctAnswer: 'Sudden haemodynamic collapse, absent breath sounds on one side, and rising peak airway pressures',
    explanation: 'Tension pneumothorax in ventilated asthma presents acutely with haemodynamic collapse (hypotension, tachycardia), absent breath sounds on the affected side, tracheal deviation, and a sudden rise in peak airway pressures. Immediate needle decompression is life-saving — do not wait for imaging.',
  });
  await updateQuestion(db, {
    id: 1180,
    question: 'Ketamine is useful as an induction agent for intubation in status asthmaticus because:',
    options: ['It causes bronchospasm which improves airway tone', 'It has bronchodilatory properties via catecholamine release and direct smooth muscle relaxation', 'It is the only safe induction agent in asthma', 'It reduces airway secretions'],
    correctAnswer: 'It has bronchodilatory properties via catecholamine release and direct smooth muscle relaxation',
    explanation: 'Ketamine is the preferred induction agent for intubation in status asthmaticus. It causes bronchodilation via catecholamine release and direct relaxation of bronchial smooth muscle. Dose: 1–2 mg/kg IV. It also provides analgesia and maintains haemodynamic stability.',
  });
  await updateQuestion(db, {
    id: 1181,
    question: 'Criteria for safe discharge from the emergency department after an acute asthma exacerbation include:',
    options: ['SpO2 >94% on room air, able to complete sentences, wheeze resolved or mild, and caregiver education completed', 'SpO2 >90% on supplemental oxygen only', 'Absence of wheeze on auscultation regardless of SpO2', 'Normal peak flow regardless of symptoms'],
    correctAnswer: 'SpO2 >94% on room air, able to complete sentences, wheeze resolved or mild, and caregiver education completed',
    explanation: 'Safe discharge criteria include SpO2 >94% on room air (not supplemental oxygen), ability to complete sentences, mild or absent wheeze, and completion of caregiver education including inhaler technique, action plan, and follow-up arrangements. Discharge on supplemental oxygen is not safe.',
  });

  console.log('✅ Asthma II questions fixed');

  // ══════════════════════════════════════════════════════════════════════════
  // STATUS EPILEPTICUS II (Quizzes 77, 78, 79) — replace duplicates of SE I
  // ══════════════════════════════════════════════════════════════════════════
  console.log('Fixing Status Epilepticus II duplicate questions...');

  // Quiz 77 (Module 1: Refractory SE Recognition) — IDs 1182, 1183, 1184
  await updateQuestion(db, {
    id: 1182,
    question: 'Refractory status epilepticus (RSE) is defined as seizures that persist after:',
    options: ['One dose of benzodiazepine', 'Two adequate doses of benzodiazepine AND one second-line anticonvulsant', 'Any seizure lasting more than 5 minutes', 'Failure of phenobarbitone alone'],
    correctAnswer: 'Two adequate doses of benzodiazepine AND one second-line anticonvulsant',
    explanation: 'RSE is defined as seizures persisting despite two adequate doses of a benzodiazepine AND at least one second-line anticonvulsant (levetiracetam, phenytoin, or valproate). This definition distinguishes RSE from early SE and guides escalation to third-line therapy.',
  });
  await updateQuestion(db, {
    id: 1183,
    question: 'The correct IV levetiracetam dose for refractory status epilepticus in a 30 kg child is:',
    options: ['500 mg IV over 5 minutes', '1500 mg IV over 15 minutes (50 mg/kg, max 3000 mg)', '100 mg IV bolus', '250 mg IV over 30 minutes'],
    correctAnswer: '1500 mg IV over 15 minutes (50 mg/kg, max 3000 mg)',
    explanation: 'Levetiracetam dose for RSE: 40–60 mg/kg IV (commonly 50 mg/kg) over 15 minutes, maximum 3000 mg. For a 30 kg child: 50 × 30 = 1500 mg. It is well tolerated with minimal haemodynamic effects and is now a first-choice second-line agent.',
  });
  await updateQuestion(db, {
    id: 1184,
    question: 'Super-refractory status epilepticus (SRSE) is defined as SE that continues or recurs despite:',
    options: ['Two benzodiazepine doses', '24 hours or more of anaesthetic therapy', 'Failure of levetiracetam alone', 'Any seizure lasting more than 60 minutes'],
    correctAnswer: '24 hours or more of anaesthetic therapy',
    explanation: 'SRSE is defined as SE that continues or recurs 24 hours or more after the onset of anaesthetic therapy (e.g., midazolam, propofol, or thiopentone infusion), including cases where SE recurs on weaning of anaesthesia. It carries high morbidity and mortality.',
  });

  // Quiz 78 (Module 2: Third-Line & ICU-Level Seizure Control) — IDs 1185, 1186, 1187
  await updateQuestion(db, {
    id: 1185,
    question: 'Midazolam infusion for RSE should be titrated to:',
    options: ['Complete seizure suppression on clinical examination only', 'Burst suppression pattern on continuous EEG monitoring', 'A fixed dose of 0.1 mg/kg/hr regardless of EEG', 'Clinical sedation score only'],
    correctAnswer: 'Burst suppression pattern on continuous EEG monitoring',
    explanation: 'Anaesthetic agents for RSE should be titrated to a burst suppression pattern on continuous EEG (cEEG) monitoring. Clinical examination alone is unreliable as subclinical seizures are common. cEEG is mandatory during anaesthetic therapy for RSE.',
  });
  await updateQuestion(db, {
    id: 1186,
    question: 'Which anaesthetic agent is preferred for SRSE in children due to its neuroprotective properties and ability to reduce cerebral metabolic demand?',
    options: ['Propofol (high-dose)', 'Thiopentone (pentobarbital)', 'Ketamine', 'Halothane'],
    correctAnswer: 'Thiopentone (pentobarbital)',
    explanation: 'Thiopentone (pentobarbital) is often preferred for SRSE due to its potent neuroprotective properties, ability to achieve deep burst suppression, and extensive evidence base. However, it causes significant cardiovascular depression and requires vasopressor support. Propofol infusion syndrome (PRIS) limits high-dose propofol use in children.',
  });
  await updateQuestion(db, {
    id: 1187,
    question: 'Continuous EEG (cEEG) monitoring is mandatory during anaesthetic therapy for RSE because:',
    options: ['It replaces the need for clinical assessment', 'Subclinical seizures are common and cannot be detected clinically in a sedated/paralysed patient', 'It is required for insurance purposes only', 'It monitors drug levels directly'],
    correctAnswer: 'Subclinical seizures are common and cannot be detected clinically in a sedated/paralysed patient',
    explanation: 'In sedated or paralysed patients, clinical signs of seizure activity are absent. Subclinical electrographic seizures are common (up to 50% of cases) and associated with worse outcomes. cEEG is the only reliable method to detect seizure activity and guide anaesthetic titration.',
  });

  // Quiz 79 (Module 3: SRSE Escalation & Long-Term Management) — IDs 1188, 1189, 1190, 1191
  await updateQuestion(db, {
    id: 1188,
    question: 'Immunotherapy (IVIG or plasma exchange) is considered in SRSE when:',
    options: ['All cases of SRSE regardless of aetiology', 'Autoimmune encephalitis is suspected (e.g., positive NMDAR antibodies, CSF pleocytosis)', 'Bacterial meningitis is confirmed', 'The child is under 2 years of age'],
    correctAnswer: 'Autoimmune encephalitis is suspected (e.g., positive NMDAR antibodies, CSF pleocytosis)',
    explanation: 'Autoimmune encephalitis (e.g., anti-NMDAR encephalitis) is an important and treatable cause of SRSE. Immunotherapy (IVIG 2 g/kg or plasma exchange) should be initiated when autoimmune aetiology is suspected, even before antibody results are available. Early treatment improves outcomes.',
  });
  await updateQuestion(db, {
    id: 1189,
    question: 'The ketogenic diet has been used as an adjunct therapy in SRSE because:',
    options: ['It replaces anticonvulsant medications entirely', 'It provides an alternative metabolic substrate (ketones) that reduces neuronal excitability', 'It is the first-line treatment for all seizures', 'It has no evidence base in children'],
    correctAnswer: 'It provides an alternative metabolic substrate (ketones) that reduces neuronal excitability',
    explanation: 'The ketogenic diet (high fat, low carbohydrate) induces ketosis, providing ketones as an alternative metabolic substrate. Ketones reduce neuronal excitability through multiple mechanisms. It has been used successfully as an adjunct in SRSE refractory to anaesthetic agents, particularly in children.',
  });
  await updateQuestion(db, {
    id: 1190,
    question: 'Long-term anticonvulsant therapy after RSE should be guided by:',
    options: ['A fixed protocol regardless of aetiology', 'The underlying aetiology, seizure type, EEG findings, and neuroimaging results', 'The number of benzodiazepine doses required', 'Age alone'],
    correctAnswer: 'The underlying aetiology, seizure type, EEG findings, and neuroimaging results',
    explanation: 'Long-term anticonvulsant selection should be individualised based on the underlying aetiology (structural, metabolic, autoimmune, genetic), seizure type, interictal EEG pattern, and neuroimaging findings. A neurologist should guide long-term management after RSE.',
  });
  await updateQuestion(db, {
    id: 1191,
    question: 'Neurodevelopmental follow-up after RSE in children is important because:',
    options: ['It is only required if the child had a structural brain lesion', 'Prolonged seizures and hypoxia can cause cognitive, behavioural, and motor sequelae that require early intervention', 'It is not necessary if the child appears normal at discharge', 'It is only for research purposes'],
    correctAnswer: 'Prolonged seizures and hypoxia can cause cognitive, behavioural, and motor sequelae that require early intervention',
    explanation: 'RSE is associated with significant neurodevelopmental sequelae including cognitive impairment, behavioural problems, and motor deficits. Early identification through structured neurodevelopmental follow-up allows timely intervention (physiotherapy, occupational therapy, educational support) to optimise outcomes.',
  });

  console.log('✅ Status Epilepticus II questions fixed');

  // ══════════════════════════════════════════════════════════════════════════
  // ANAPHYLAXIS II (Quizzes 83, 84, 85) — replace duplicates of Anaphylaxis I
  // ══════════════════════════════════════════════════════════════════════════
  console.log('Fixing Anaphylaxis II duplicate questions...');

  // Quiz 83 (Module 1: Refractory Anaphylaxis Recognition) — IDs 1202, 1203, 1204
  await updateQuestion(db, {
    id: 1202,
    question: 'Refractory anaphylaxis is defined as anaphylaxis that:',
    options: ['Responds to the first dose of epinephrine', 'Fails to respond to two or more doses of IM epinephrine and requires IV epinephrine infusion', 'Occurs without skin manifestations', 'Resolves within 15 minutes'],
    correctAnswer: 'Fails to respond to two or more doses of IM epinephrine and requires IV epinephrine infusion',
    explanation: 'Refractory anaphylaxis is defined as persistent or worsening anaphylaxis despite two or more doses of IM epinephrine. It requires escalation to IV epinephrine infusion (0.1–1 mcg/kg/min), IV fluid resuscitation, and PICU admission.',
  });
  await updateQuestion(db, {
    id: 1203,
    question: 'Biphasic anaphylaxis occurs in approximately what percentage of cases and when does it typically occur?',
    options: ['1–2%, within 30 minutes of initial reaction', '5–20%, typically 1–72 hours after the initial reaction', '50%, always within 2 hours', '0.1%, only in adults'],
    correctAnswer: '5–20%, typically 1–72 hours after the initial reaction',
    explanation: 'Biphasic anaphylaxis occurs in 5–20% of cases, typically 1–72 hours after the initial reaction (most commonly 6–12 hours). This is the rationale for the mandatory observation period of at least 4–6 hours after apparent resolution of anaphylaxis.',
  });
  await updateQuestion(db, {
    id: 1204,
    question: 'A child on beta-blockers develops refractory anaphylaxis not responding to epinephrine. The most appropriate additional treatment is:',
    options: ['Increase epinephrine dose only', 'Glucagon IV (20–30 mcg/kg bolus, max 1 mg) to overcome beta-blockade', 'Atropine IV', 'Calcium gluconate IV'],
    correctAnswer: 'Glucagon IV (20–30 mcg/kg bolus, max 1 mg) to overcome beta-blockade',
    explanation: 'Beta-blockers blunt the cardiac response to epinephrine by blocking beta-1 and beta-2 receptors. Glucagon acts via a non-adrenergic pathway (glucagon receptors) to increase heart rate and contractility, overcoming beta-blockade. Dose: 20–30 mcg/kg IV bolus (max 1 mg), followed by infusion if needed.',
  });

  // Quiz 84 (Module 2: Advanced Management of Refractory Anaphylaxis) — IDs 1205, 1206, 1207
  await updateQuestion(db, {
    id: 1205,
    question: 'The correct concentration of IV epinephrine for a refractory anaphylaxis infusion in children is:',
    options: ['1:1000 (1 mg/mL) undiluted IV bolus', '1:10,000 (0.1 mg/mL) diluted, given as a titrated infusion starting at 0.1 mcg/kg/min', '1:100 (10 mg/mL) IV bolus', 'Any concentration is safe if given slowly'],
    correctAnswer: '1:10,000 (0.1 mg/mL) diluted, given as a titrated infusion starting at 0.1 mcg/kg/min',
    explanation: 'IV epinephrine for refractory anaphylaxis must be given as a diluted infusion (not undiluted bolus) to avoid fatal arrhythmias. Standard concentration: 1:10,000 (0.1 mg/mL) or further diluted. Start at 0.1 mcg/kg/min and titrate to response. Continuous cardiac monitoring is mandatory.',
  });
  await updateQuestion(db, {
    id: 1206,
    question: 'Vasopressin is used as a second vasopressor in refractory anaphylaxis because:',
    options: ['It acts via adrenergic receptors like epinephrine', 'It acts via V1 receptors independently of the adrenergic pathway, providing vasoconstriction when catecholamines are depleted', 'It is safer than epinephrine in children', 'It has bronchodilatory properties'],
    correctAnswer: 'It acts via V1 receptors independently of the adrenergic pathway, providing vasoconstriction when catecholamines are depleted',
    explanation: 'In prolonged refractory anaphylaxis, endogenous catecholamines become depleted and adrenergic receptors may be downregulated. Vasopressin acts via V1 receptors (non-adrenergic) to cause vasoconstriction, providing an alternative vasopressor mechanism. Dose: 0.01–0.04 units/kg/min.',
  });
  await updateQuestion(db, {
    id: 1207,
    question: 'Methylene blue is used in refractory anaphylaxis because it:',
    options: ['Blocks histamine receptors', 'Inhibits nitric oxide synthase, reducing the vasodilatory component of anaphylactic shock', 'Acts as a direct vasopressor via adrenergic receptors', 'Reverses bronchospasm'],
    correctAnswer: 'Inhibits nitric oxide synthase, reducing the vasodilatory component of anaphylactic shock',
    explanation: 'Methylene blue inhibits nitric oxide synthase (NOS) and guanylate cyclase, reducing nitric oxide-mediated vasodilation. It has been used successfully in refractory distributive shock including anaphylaxis. Dose: 1–2 mg/kg IV over 20 minutes. It is a rescue therapy when standard vasopressors fail.',
  });

  // Quiz 85 (Module 3: Anaphylactoid Reactions & Long-Term Management) — IDs 1208, 1209, 1210, 1211
  await updateQuestion(db, {
    id: 1208,
    question: 'Anaphylactoid reactions differ from true anaphylaxis in that they:',
    options: ['Are always more severe', 'Are not IgE-mediated but produce identical clinical features and require the same emergency management', 'Do not require epinephrine treatment', 'Only occur with radiocontrast media'],
    correctAnswer: 'Are not IgE-mediated but produce identical clinical features and require the same emergency management',
    explanation: 'Anaphylactoid reactions are non-IgE-mediated (direct mast cell degranulation or complement activation) but are clinically indistinguishable from true anaphylaxis. They require identical emergency management including epinephrine. Common triggers include radiocontrast media, NSAIDs, and opioids.',
  });
  await updateQuestion(db, {
    id: 1209,
    question: 'Venom immunotherapy (VIT) is indicated after anaphylaxis to insect stings in children when:',
    options: ['Any child who has had a mild local reaction to a sting', 'Children with systemic anaphylaxis to insect venom, confirmed by skin testing or specific IgE', 'All children regardless of reaction severity', 'Only adults with cardiovascular disease'],
    correctAnswer: 'Children with systemic anaphylaxis to insect venom, confirmed by skin testing or specific IgE',
    explanation: 'VIT is indicated for children who have had a systemic anaphylactic reaction (not just large local reactions) to insect venom, with confirmed sensitisation by skin prick test or specific IgE. VIT reduces the risk of future systemic reactions from ~60% to <5% and is highly effective.',
  });
  await updateQuestion(db, {
    id: 1210,
    question: 'The minimum observation period after apparent resolution of anaphylaxis in a child is:',
    options: ['30 minutes', '1 hour', '4–6 hours (or 12–24 hours for severe reactions)', '24 hours for all cases'],
    correctAnswer: '4–6 hours (or 12–24 hours for severe reactions)',
    explanation: 'The minimum observation period after apparent resolution of anaphylaxis is 4–6 hours to detect biphasic reactions. For severe anaphylaxis (cardiovascular compromise, severe bronchospasm, or requiring >2 epinephrine doses), 12–24 hours of observation is recommended.',
  });
  await updateQuestion(db, {
    id: 1211,
    question: 'Long-term management after anaphylaxis must include:',
    options: ['Prescription of antihistamines only', 'Allergy referral, allergen identification, two epinephrine auto-injectors, written action plan, and education on avoidance and device use', 'Oral corticosteroids for 6 months', 'Avoidance advice only without further investigation'],
    correctAnswer: 'Allergy referral, allergen identification, two epinephrine auto-injectors, written action plan, and education on avoidance and device use',
    explanation: 'Comprehensive long-term management includes: allergy referral for allergen identification, prescription of two epinephrine auto-injectors (one for school/nursery), a written emergency action plan, education on trigger avoidance and auto-injector technique, and medical alert identification. Antihistamines alone are insufficient.',
  });

  console.log('✅ Anaphylaxis II questions fixed');

  // ══════════════════════════════════════════════════════════════════════════
  // DKA II (Quizzes 89, 90, 91) — replace duplicates of DKA I (Quiz 11)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('Fixing DKA II duplicate questions...');

  // Quiz 89 (Module 1: Euglycemic DKA Recognition) — IDs 1222, 1223, 1224
  await updateQuestion(db, {
    id: 1222,
    question: 'Euglycemic DKA (blood glucose <11 mmol/L with ketoacidosis) is most commonly associated with:',
    options: ['Type 1 diabetes in a newly diagnosed child', 'SGLT2 inhibitor use, prolonged fasting, or pregnancy', 'Severe hyperglycaemia only', 'Viral gastroenteritis without diabetes'],
    correctAnswer: 'SGLT2 inhibitor use, prolonged fasting, or pregnancy',
    explanation: 'Euglycemic DKA occurs when ketoacidosis is present without significant hyperglycaemia. It is most commonly associated with SGLT2 inhibitor use (which promotes glucosuria, lowering blood glucose), prolonged fasting, pregnancy, or alcohol use. It is easily missed because glucose appears near normal.',
  });
  await updateQuestion(db, {
    id: 1223,
    question: 'The insulin infusion rate for DKA management in a 25 kg child should be:',
    options: ['2 units/kg/hr', '0.1 units/kg/hr (2.5 units/hr)', '0.5 units/kg/hr', '1 unit/kg/hr'],
    correctAnswer: '0.1 units/kg/hr (2.5 units/hr)',
    explanation: 'Standard insulin infusion for DKA: 0.05–0.1 units/kg/hr. For a 25 kg child at 0.1 units/kg/hr = 2.5 units/hr. Do not give IV insulin bolus (increases cerebral oedema risk). Start insulin 1–2 hours after beginning fluid resuscitation.',
  });
  await updateQuestion(db, {
    id: 1224,
    question: 'When should the insulin infusion rate be reduced in DKA management?',
    options: ['When blood glucose falls below 14 mmol/L — add dextrose to IV fluids and reduce insulin to 0.05 units/kg/hr', 'When the child becomes drowsy', 'When potassium rises above 5 mmol/L', 'When bicarbonate normalises'],
    correctAnswer: 'When blood glucose falls below 14 mmol/L — add dextrose to IV fluids and reduce insulin to 0.05 units/kg/hr',
    explanation: 'When blood glucose falls below 14 mmol/L, add 5–10% dextrose to IV fluids to prevent hypoglycaemia while continuing insulin to clear ketones. Reduce insulin to 0.05 units/kg/hr. The goal is to maintain glucose 8–12 mmol/L while continuing insulin until ketoacidosis resolves (pH >7.3, bicarbonate >15).',
  });

  // Quiz 90 (Module 2: Cerebral Oedema Management) — IDs 1225, 1226, 1227
  await updateQuestion(db, {
    id: 1225,
    question: 'Cerebral oedema in DKA is most likely caused by:',
    options: ['Hyperglycaemia alone', 'Rapid osmotic shifts from aggressive fluid resuscitation and rapid glucose reduction', 'Hyperkalaemia', 'Insulin overdose'],
    correctAnswer: 'Rapid osmotic shifts from aggressive fluid resuscitation and rapid glucose reduction',
    explanation: 'Cerebral oedema in DKA is multifactorial but is strongly associated with rapid osmotic shifts from aggressive fluid resuscitation (especially hypotonic fluids) and rapid glucose reduction. The brain adapts to hyperosmolality by accumulating idiogenic osmoles; rapid correction causes water influx into brain cells.',
  });
  await updateQuestion(db, {
    id: 1226,
    question: 'The treatment of choice for cerebral oedema in DKA is:',
    options: ['Dexamethasone IV', 'Hypertonic saline (3%, 2.5–5 mL/kg) or mannitol (0.5–1 g/kg IV)', 'Furosemide IV', 'Increase insulin infusion rate'],
    correctAnswer: 'Hypertonic saline (3%, 2.5–5 mL/kg) or mannitol (0.5–1 g/kg IV)',
    explanation: 'Cerebral oedema in DKA is treated with hypertonic saline (3% NaCl, 2.5–5 mL/kg IV over 15 minutes) or mannitol (0.5–1 g/kg IV over 20 minutes). Hypertonic saline is preferred by many centres as it also corrects hyponatraemia. Fluid restriction and head elevation (30°) are also important.',
  });
  await updateQuestion(db, {
    id: 1227,
    question: 'The maximum safe rate of sodium correction in hypernatraemic DKA is:',
    options: ['10 mmol/L/hr', '0.5 mmol/L/hr (maximum 10–12 mmol/L/24 hours)', '2 mmol/L/hr', 'No limit if the child is symptomatic'],
    correctAnswer: '0.5 mmol/L/hr (maximum 10–12 mmol/L/24 hours)',
    explanation: 'Sodium should not be corrected faster than 0.5 mmol/L/hr (maximum 10–12 mmol/L per 24 hours) to prevent osmotic demyelination syndrome (central pontine myelinolysis). In DKA with hypernatraemia, fluid selection and rate must be carefully calculated to achieve gradual correction.',
  });

  // Quiz 91 (Module 3: Complex Electrolyte Management) — IDs 1228, 1229, 1230, 1231
  await updateQuestion(db, {
    id: 1228,
    question: 'Early signs of cerebral oedema in DKA that should prompt immediate treatment include:',
    options: ['Mild headache only', 'Headache, bradycardia, rising blood pressure, deteriorating consciousness, or abnormal posturing', 'Hyperglycaemia worsening', 'Metabolic acidosis persisting'],
    correctAnswer: 'Headache, bradycardia, rising blood pressure, deteriorating consciousness, or abnormal posturing',
    explanation: 'Early signs of cerebral oedema in DKA include: new or worsening headache, bradycardia, rising blood pressure (Cushing triad), deteriorating level of consciousness (GCS falling), and abnormal posturing. Do not wait for imaging — treat immediately with hypertonic saline or mannitol.',
  });
  await updateQuestion(db, {
    id: 1229,
    question: 'Osmotic diuretic used if hypertonic saline is unavailable for cerebral oedema in DKA:',
    options: ['Furosemide 1 mg/kg IV', 'Mannitol 0.5–1 g/kg IV over 20 minutes', 'Spironolactone', 'Acetazolamide'],
    correctAnswer: 'Mannitol 0.5–1 g/kg IV over 20 minutes',
    explanation: 'Mannitol (0.5–1 g/kg IV over 20 minutes) is the alternative osmotic agent for cerebral oedema when hypertonic saline is unavailable. It reduces intracranial pressure by creating an osmotic gradient that draws water from brain tissue into the vasculature.',
  });
  await updateQuestion(db, {
    id: 1230,
    question: 'Phosphate supplementation in DKA is indicated when:',
    options: ['All DKA patients routinely', 'Serum phosphate <0.5 mmol/L with symptomatic hypophosphataemia (muscle weakness, haemolytic anaemia, respiratory failure)', 'Phosphate >2 mmol/L', 'The child is eating normally'],
    correctAnswer: 'Serum phosphate <0.5 mmol/L with symptomatic hypophosphataemia (muscle weakness, haemolytic anaemia, respiratory failure)',
    explanation: 'Phosphate supplementation is not routinely recommended in DKA but is indicated for severe symptomatic hypophosphataemia (serum phosphate <0.5 mmol/L) with clinical features such as muscle weakness, haemolytic anaemia, or respiratory failure. Routine phosphate replacement has not been shown to improve outcomes.',
  });
  await updateQuestion(db, {
    id: 1231,
    question: 'SGLT2 inhibitors should be withheld during DKA management because:',
    options: ['They cause hyperkalaemia', 'They promote glucosuria, masking glucose recovery and potentially worsening euglycemic DKA', 'They increase insulin resistance', 'They cause cerebral oedema'],
    correctAnswer: 'They promote glucosuria, masking glucose recovery and potentially worsening euglycemic DKA',
    explanation: 'SGLT2 inhibitors promote renal glucose excretion, which can mask hyperglycaemia and contribute to euglycemic DKA. They should be withheld during acute DKA management to allow accurate glucose monitoring and appropriate insulin titration. They can be restarted after full recovery under specialist guidance.',
  });

  console.log('✅ DKA II questions fixed');

  // ══════════════════════════════════════════════════════════════════════════
  // BURNS II (Quizzes 125, 126, 127) — replace duplicates of Burns I (122-124)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('Fixing Burns II duplicate questions...');

  // Quiz 125 (Module 1: Fluid Resuscitation Optimisation) — IDs 1335, 1336, 1337
  await updateQuestion(db, {
    id: 1335,
    question: 'After the first 24 hours of burn resuscitation, the fluid strategy should shift to:',
    options: ['Continue Parkland formula at the same rate', 'Transition to maintenance fluids with colloid supplementation (albumin) to replace ongoing losses and maintain oncotic pressure', 'Stop all IV fluids immediately', 'Switch to oral rehydration only'],
    correctAnswer: 'Transition to maintenance fluids with colloid supplementation (albumin) to replace ongoing losses and maintain oncotic pressure',
    explanation: 'After 24 hours, capillary permeability begins to normalise. Fluid management shifts from crystalloid resuscitation to maintenance fluids plus colloid supplementation (albumin 5%, 0.5–1 mL/kg/hr) to replace ongoing evaporative losses and maintain oncotic pressure. Urine output target remains 0.5–1 mL/kg/hr.',
  });
  await updateQuestion(db, {
    id: 1336,
    question: 'Colloid supplementation (albumin) in burns after 24 hours is used to:',
    options: ['Replace the Parkland formula entirely', 'Restore oncotic pressure, reduce oedema, and decrease total fluid requirements in the second 24 hours', 'Treat infection', 'Prevent cerebral oedema'],
    correctAnswer: 'Restore oncotic pressure, reduce oedema, and decrease total fluid requirements in the second 24 hours',
    explanation: 'After 24 hours, albumin supplementation restores oncotic pressure (reduced by capillary leak and dilution), reduces tissue oedema, and decreases overall fluid requirements. It is particularly important in burns >40% TBSA where hypoalbuminaemia is severe.',
  });
  await updateQuestion(db, {
    id: 1337,
    question: 'Fluid overresuscitation in major burns (>40% TBSA) can cause:',
    options: ['Only peripheral oedema', 'Abdominal compartment syndrome, pulmonary oedema, extremity compartment syndrome, and increased mortality', 'Improved wound healing', 'Reduced infection risk'],
    correctAnswer: 'Abdominal compartment syndrome, pulmonary oedema, extremity compartment syndrome, and increased mortality',
    explanation: '"Fluid creep" (overresuscitation) in major burns causes abdominal compartment syndrome (intra-abdominal pressure >20 mmHg), pulmonary oedema, extremity compartment syndrome, and is associated with increased mortality. Urine output-guided resuscitation and colloid supplementation help prevent overresuscitation.',
  });

  // Quiz 126 (Module 2: Burn Complications and Management) — IDs 1345, 1346, 1347
  await updateQuestion(db, {
    id: 1345,
    question: 'Abdominal compartment syndrome in major burns is diagnosed when:',
    options: ['Abdominal distension is visible', 'Intra-abdominal pressure >20 mmHg with new organ dysfunction (oliguria, raised airway pressures, cardiovascular compromise)', 'Serum lactate >2 mmol/L', 'The child complains of abdominal pain'],
    correctAnswer: 'Intra-abdominal pressure >20 mmHg with new organ dysfunction (oliguria, raised airway pressures, cardiovascular compromise)',
    explanation: 'Abdominal compartment syndrome is defined as sustained intra-abdominal pressure (IAP) >20 mmHg with new organ dysfunction. Measured via bladder pressure. Features include oliguria (reduced renal perfusion), rising ventilator pressures (diaphragm elevation), and cardiovascular compromise. Decompressive laparotomy may be required.',
  });
  await updateQuestion(db, {
    id: 1346,
    question: 'Target urine output in a child with myoglobinuria from major burns or electrical injury is:',
    options: ['0.5 mL/kg/hr', '1–2 mL/kg/hr to flush myoglobin and prevent acute tubular necrosis', '3 mL/kg/hr', 'No specific target'],
    correctAnswer: '1–2 mL/kg/hr to flush myoglobin and prevent acute tubular necrosis',
    explanation: 'Myoglobinuria (dark/tea-coloured urine) from muscle breakdown in major burns or electrical injury requires increased urine output (1–2 mL/kg/hr) to flush myoglobin through the renal tubules and prevent acute tubular necrosis. Sodium bicarbonate may be added to alkalinise urine and reduce myoglobin precipitation.',
  });
  await updateQuestion(db, {
    id: 1347,
    question: 'Escharotomy is performed in circumferential full-thickness burns to:',
    options: ['Improve wound healing', 'Relieve compartment syndrome by releasing the constricting eschar and restoring distal perfusion', 'Prevent infection', 'Reduce fluid requirements'],
    correctAnswer: 'Relieve compartment syndrome by releasing the constricting eschar and restoring distal perfusion',
    explanation: 'Circumferential full-thickness burns create a rigid, non-compliant eschar that constricts underlying tissue as oedema develops, causing compartment syndrome. Escharotomy (incision through the eschar to the subcutaneous fat) releases the constriction, restores distal perfusion, and prevents limb or thoracic compromise.',
  });

  // Quiz 127 (Module 3: Nutritional Support and Long-Term Management) — IDs 1348, 1349, 1350, 1351
  await updateQuestion(db, {
    id: 1348,
    question: 'Protein requirements in major burns (>20% TBSA) are significantly elevated because:',
    options: ['Protein is used as the primary energy source', 'The hypermetabolic response causes massive protein catabolism for gluconeogenesis and wound healing', 'Protein prevents infection', 'Elevated protein reduces fluid requirements'],
    correctAnswer: 'The hypermetabolic response causes massive protein catabolism for gluconeogenesis and wound healing',
    explanation: 'Major burns trigger a profound hypermetabolic response with protein catabolism rates 3–5 times normal. Protein is broken down for gluconeogenesis (energy) and wound healing. Protein requirements: 2.5–4 g/kg/day (children). Adequate protein intake is essential to prevent muscle wasting, impaired immunity, and delayed wound healing.',
  });
  await updateQuestion(db, {
    id: 1349,
    question: 'Enteral nutrition should be started in major burns:',
    options: ['After 72 hours when the child is haemodynamically stable', 'Within 6–12 hours of injury via nasogastric tube, even in intubated patients', 'Only when the child can eat orally', 'After surgical debridement'],
    correctAnswer: 'Within 6–12 hours of injury via nasogastric tube, even in intubated patients',
    explanation: 'Early enteral nutrition (within 6–12 hours) in major burns reduces hypermetabolism, preserves gut mucosal integrity, reduces bacterial translocation, and improves outcomes. It should be started via nasogastric tube in intubated patients. Parenteral nutrition is reserved for cases where enteral feeding is not tolerated.',
  });
  await updateQuestion(db, {
    id: 1350,
    question: 'The leading cause of death in major burns (>40% TBSA) after the first 48 hours is:',
    options: ['Hypovolaemic shock', 'Sepsis and multi-organ failure', 'Inhalation injury alone', 'Electrolyte imbalance'],
    correctAnswer: 'Sepsis and multi-organ failure',
    explanation: 'After the initial resuscitation phase, sepsis and multi-organ failure become the leading causes of death in major burns. The burn wound provides a portal of entry for bacteria, and the immunosuppressive effects of major burns increase susceptibility to infection. Wound care, early excision and grafting, and infection surveillance are critical.',
  });
  await updateQuestion(db, {
    id: 1351,
    question: 'Inhalation injury in burns increases mortality by approximately:',
    options: ['5%', '20–40% (doubles mortality in major burns)', '1–2%', 'No significant effect on mortality'],
    correctAnswer: '20–40% (doubles mortality in major burns)',
    explanation: 'Inhalation injury significantly worsens prognosis in major burns, increasing mortality by 20–40% and approximately doubling the expected mortality for a given burn size. It causes direct airway injury, chemical pneumonitis, and systemic toxicity (carbon monoxide, cyanide). Early intubation is often required.',
  });

  console.log('✅ Burns II questions fixed');

  // ══════════════════════════════════════════════════════════════════════════
  // PNEUMONIA II (Quizzes 95, 96) — fix 3 shared questions
  // ══════════════════════════════════════════════════════════════════════════
  console.log('Fixing Pneumonia II duplicate questions...');

  // Quiz 96 (Module 2: ARDS Complications & Management) — IDs 1412, 1413, 1414
  await updateQuestion(db, {
    id: 1412,
    question: 'Ventilator-induced lung injury (VILI) in ARDS is prevented by:',
    options: ['High tidal volumes to ensure adequate ventilation', 'Lung-protective ventilation: tidal volume 4–6 mL/kg IBW, plateau pressure <30 cmH2O, and appropriate PEEP', 'High FiO2 regardless of SpO2', 'Prone positioning alone without ventilator adjustments'],
    correctAnswer: 'Lung-protective ventilation: tidal volume 4–6 mL/kg IBW, plateau pressure <30 cmH2O, and appropriate PEEP',
    explanation: 'VILI (volutrauma, barotrauma, atelectrauma) is prevented by lung-protective ventilation: tidal volume 4–6 mL/kg ideal body weight, plateau pressure <30 cmH2O, and appropriate PEEP to prevent atelectasis. This is the cornerstone of ARDS management and has been shown to reduce mortality.',
  });
  await updateQuestion(db, {
    id: 1413,
    question: 'Prone positioning in paediatric ARDS should be initiated when:',
    options: ['Any child with ARDS regardless of severity', 'Moderate-to-severe ARDS (P/F ratio <150) not responding to optimised conventional ventilation', 'Only in adults', 'After 7 days of conventional ventilation'],
    correctAnswer: 'Moderate-to-severe ARDS (P/F ratio <150) not responding to optimised conventional ventilation',
    explanation: 'Prone positioning improves V/Q matching, reduces dorsal atelectasis, and improves oxygenation in moderate-to-severe ARDS (P/F ratio <150). In adults, 16+ hours/day of prone positioning reduces mortality. Evidence in children is growing. It should be considered when conventional ventilation fails to achieve adequate oxygenation.',
  });
  await updateQuestion(db, {
    id: 1414,
    question: 'The most common complication of mechanical ventilation in ARDS is:',
    options: ['Hyperkalaemia', 'Ventilator-associated pneumonia (VAP) and ventilator-induced lung injury (VILI)', 'Hypertension', 'Peripheral neuropathy'],
    correctAnswer: 'Ventilator-associated pneumonia (VAP) and ventilator-induced lung injury (VILI)',
    explanation: 'VAP and VILI are the most common and clinically significant complications of mechanical ventilation in ARDS. VAP prevention bundles (head-of-bed elevation, oral care, circuit management) and lung-protective ventilation strategies are essential components of ARDS management.',
  });

  // Fix Malaria I sections 385, 390, 395 (wrong Burns content in Overview fields)
  console.log('Fixing Malaria I wrong content sections...');

  await db.update(moduleSections).set({
    content: `<h3>Module Overview: Severe Malaria Recognition and Plasmodium Species</h3>
<p>Severe malaria is a life-threatening emergency caused primarily by <em>Plasmodium falciparum</em>, though <em>P. vivax</em> and <em>P. knowlesi</em> can also cause severe disease. Understanding the biology of different Plasmodium species is essential for selecting appropriate artemisinin-based therapy and anticipating complications.</p>
<p>In sub-Saharan Africa, <em>P. falciparum</em> accounts for the vast majority of severe malaria cases in children. Its unique ability to cause cytoadherence of parasitised red blood cells to cerebral microvasculature underlies the pathophysiology of cerebral malaria, the most feared complication.</p>
<p><strong>Key learning objectives:</strong></p>
<ul>
  <li>Identify the clinical features that define severe malaria in children</li>
  <li>Differentiate Plasmodium species and their clinical significance</li>
  <li>Recognise the WHO criteria for severe malaria</li>
  <li>Understand the pathophysiology of cerebral malaria and severe anaemia</li>
  <li>Apply artemisinin-based therapy appropriately based on species and severity</li>
</ul>`
  }).where(eq(moduleSections.id, 385));

  await db.update(moduleSections).set({
    content: `<h3>Module Overview: Artemether Therapy and Monitoring Parameters</h3>
<p>Intravenous artesunate is the treatment of choice for severe malaria in children, replacing quinine as the first-line agent based on the AQUAMAT and SEAQUAMAT trials. Artemether-lumefantrine is used for uncomplicated malaria. Understanding the pharmacology, dosing, and monitoring requirements for artemisinin-based therapies is essential for safe and effective management.</p>
<p>Monitoring during treatment must include parasitaemia clearance, haematological recovery, and detection of post-artesunate delayed haemolysis (PADH), a recognised complication of IV artesunate therapy.</p>
<p><strong>Key learning objectives:</strong></p>
<ul>
  <li>State the correct IV artesunate dose and administration schedule for severe malaria</li>
  <li>Describe the monitoring parameters required during artemisinin therapy</li>
  <li>Recognise post-artesunate delayed haemolysis (PADH) and its management</li>
  <li>Outline the transition from IV to oral therapy</li>
  <li>Apply supportive care measures alongside antimalarial therapy</li>
</ul>`
  }).where(eq(moduleSections.id, 390));

  await db.update(moduleSections).set({
    content: `<h3>Module Overview: Complications of Severe Malaria and Lactic Acidosis</h3>
<p>Severe malaria is associated with multiple life-threatening complications that require concurrent management alongside antimalarial therapy. Lactic acidosis is one of the most important prognostic markers in severe malaria, reflecting tissue hypoperfusion from severe anaemia, microvascular obstruction, and impaired hepatic lactate clearance.</p>
<p>Other major complications include cerebral malaria, severe anaemia, hypoglycaemia, acute kidney injury, pulmonary oedema, and hyperparasitaemia. Each requires specific intervention and careful monitoring.</p>
<p><strong>Key learning objectives:</strong></p>
<ul>
  <li>Recognise and manage lactic acidosis in severe malaria</li>
  <li>Describe the management of cerebral malaria including seizure control and raised ICP</li>
  <li>Outline the approach to severe malarial anaemia and transfusion thresholds</li>
  <li>Manage hypoglycaemia in severe malaria</li>
  <li>Apply escalation criteria for PICU admission in severe malaria</li>
</ul>`
  }).where(eq(moduleSections.id, 395));

  console.log('✅ Malaria I wrong content sections fixed');

  // Fix Pneumonia II quiz 97 duplicate questions (IDs 1416, 1417 are duplicates of quiz 25)
  await updateQuestion(db, {
    id: 1416,
    question: 'Extracorporeal membrane oxygenation (ECMO) for severe ARDS is considered when:',
    options: ['P/F ratio <300 on any ventilator settings', 'Refractory hypoxaemia (P/F ratio <80) or hypercapnia despite optimal lung-protective ventilation and prone positioning', 'Any child with ARDS on mechanical ventilation', 'After 24 hours of mechanical ventilation'],
    correctAnswer: 'Refractory hypoxaemia (P/F ratio <80) or hypercapnia despite optimal lung-protective ventilation and prone positioning',
    explanation: 'VV-ECMO is considered for severe ARDS with refractory hypoxaemia (P/F ratio <80) or life-threatening hypercapnia despite optimal conventional management including lung-protective ventilation and prone positioning. Early referral to an ECMO centre is essential as transport on ECMO is high risk.',
  });
  await updateQuestion(db, {
    id: 1417,
    question: 'Long-term outcomes after severe paediatric ARDS include:',
    options: ['Complete recovery in all survivors within 1 month', 'Pulmonary function impairment, neurocognitive deficits, and post-intensive care syndrome (PICS) in a significant proportion of survivors', 'No long-term sequelae if the child survives the acute phase', 'Only physical sequelae, no neurocognitive effects'],
    correctAnswer: 'Pulmonary function impairment, neurocognitive deficits, and post-intensive care syndrome (PICS) in a significant proportion of survivors',
    explanation: 'Survivors of severe paediatric ARDS frequently experience long-term sequelae including pulmonary function impairment (reduced diffusion capacity, restrictive pattern), neurocognitive deficits (memory, attention, executive function), and post-intensive care syndrome (PICS) affecting physical, cognitive, and psychological domains. Structured follow-up is essential.',
  });
  await updateQuestion(db, {
    id: 1422,
    question: 'Sepsis-associated ARDS in children differs from adult ARDS in that:',
    options: ['It is less severe and resolves faster', 'Children have greater lung reserve and resilience but are more susceptible to fluid overload causing pulmonary oedema', 'Corticosteroids are always contraindicated in children', 'Prone positioning is not effective in children'],
    correctAnswer: 'Children have greater lung reserve and resilience but are more susceptible to fluid overload causing pulmonary oedema',
    explanation: 'Paediatric ARDS has some distinct features from adult ARDS. Children generally have greater physiological reserve but are more susceptible to fluid overload-related pulmonary oedema due to their smaller functional residual capacity. Conservative fluid management after initial resuscitation is particularly important in paediatric ARDS.',
  });
  await updateQuestion(db, {
    id: 1423,
    question: 'Neuromuscular blockade (NMB) in severe ARDS is used to:',
    options: ['Routinely in all intubated ARDS patients', 'Selectively in patients with severe dyssynchrony, refractory hypoxaemia, or those requiring prone positioning, to improve ventilator synchrony and reduce VILI', 'Prevent all complications of mechanical ventilation', 'Replace sedation entirely'],
    correctAnswer: 'Selectively in patients with severe dyssynchrony, refractory hypoxaemia, or those requiring prone positioning, to improve ventilator synchrony and reduce VILI',
    explanation: 'NMB is not routinely recommended in all ARDS patients (ACURASYS trial results were not replicated in ROSE trial). It is used selectively for severe ventilator dyssynchrony, refractory hypoxaemia, or to facilitate prone positioning. Prolonged NMB is associated with ICU-acquired weakness and should be minimised.',
  });

  console.log('✅ Pneumonia II duplicate questions fixed');

  // Fix remaining Septic Shock II duplicates (quizzes 4 vs 80 etc)
  // Quiz 4 is Septic Shock I, quizzes 80-82 are Anaphylaxis I — already handled above
  // The remaining duplicates in quizzes 4-11 are the OLD quiz system — these are legacy
  // and the new module quizzes (74+) are the ones shown to learners. No action needed on 4-11.

  console.log('\n✅ All duplicate question fixes applied successfully.');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
