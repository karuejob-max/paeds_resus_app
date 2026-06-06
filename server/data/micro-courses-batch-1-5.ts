/**
 * Micro-Courses Data: Batch 1-5 (20 courses)
 * PSOT §16: Complete 24-course learning ecosystem
 * Clinical spine: docs/CLINICAL_SOURCE_OF_TRUTH.md
 * 
 * Batch 1: Asthma II, Status Epilepticus II, Anaphylaxis I & II (4)
 * Batch 2: DKA I & II, Severe Pneumonia/ARDS I & II (4)
 * Batch 3: Hypovolemic Shock I & II, Cardiogenic Shock I & II (4)
 * Batch 4: Meningitis I & II, Severe Malaria I & II (4)
 * Batch 5: Acute Kidney Injury I & II, Severe Anaemia I & II (4)
 */

import {
  ANAPHYLAXIS_ADRENALINE,
  DKA_FLUIDS_CONFLICT,
  DKA_INSULIN_KETONES,
  DKA_POTASSIUM_SAFETY,
  GLUCOSE_MMOL_NOTE,
  PNEUMONIA_WHO_KENYA,
} from './clinical-content-helpers';

export const microCoursesBatch1To5 = [
  // ============================================
  // BATCH 1: Asthma II, Status Epilepticus II, Anaphylaxis I & II
  // ============================================

  {
    id: 'asthma-ii',
    title: 'Paediatric Asthma II: Severe Exacerbation and Status Asthmaticus',
    level: 'advanced',
    duration: 60,
    price: 1200, // KES (1.5× foundational)
    prerequisite: 'asthma-i',
    description: 'Advanced management of severe asthma exacerbation, status asthmaticus, and life-threatening asthma in low-resource settings.',
    modules: [
      {
        title: 'Module 1: Recognizing Life-Threatening Asthma',
        duration: 20,
        content: `
          <h2>Life-Threatening Asthma Recognition</h2>
<div className="clinical-note"><h4>Red Flags (Immediate Escalation)</h4>
	          <ul>
	            <li>Silent chest (no air movement despite respiratory effort)</li>
	            <li>Altered mental status, drowsiness, confusion</li>
	            <li>Inability to speak full sentences (exhaustion)</li>
	            <li>Severe accessory muscle use with paradoxical breathing</li>
	            <li>Cyanosis despite oxygen</li>
	            <li>Hypotension or shock</li>
	            <li>Peak flow <25% predicted or unmeasurable</li>
	          </ul></div>
          <h3>Status Asthmaticus Definition:</h3>
          <p>Severe asthma exacerbation unresponsive to standard therapy for ≥1 hour, requiring ICU-level care.</p>
          <h3>Differential Diagnosis in Severe Asthma:</h3>
          <ul>
            <li>Foreign body aspiration (unilateral findings)</li>
            <li>Anaphylaxis (urticaria, angioedema, hypotension)</li>
            <li>Pneumothorax (acute onset, unilateral breath sounds)</li>
            <li>Acute coronary syndrome (rare in children, chest pain)</li>
          </ul>
        `,
        questions: [
          {
            question: "Status asthmaticus is defined as severe asthma unresponsive to therapy for:",
            options: ["≥1 hour", "5 minutes", "24 hours only", "Never requires ICU"],
            correct: 0,
            explanation: "Status asthmaticus = no adequate response to standard therapy for ≥1 hour.",
          },
          {
            question: "Silent chest in asthma indicates:",
            options: [
              "Imminent respiratory failure — escalate immediately",
              "Mild disease",
              "Resolved asthma",
              "Normal finding",
            ],
            correct: 0,
            explanation: "Silent chest with effort = severe air trapping and exhaustion.",
          },
          {
            question: "Anaphylaxis must be distinguished from severe asthma by looking for:",
            options: [
              "Urticaria, angioedema, or hypotension",
              "Only wheeze",
              "Fever alone",
              "Normal blood pressure always",
            ],
            correct: 0,
            explanation: "Anaphylaxis has multi-system allergic features beyond bronchospasm alone.",
          },
        ],
      },
      {
        title: 'Module 2: Aggressive First-Hour Management',
        duration: 25,
        content: `
          <h2>Severe Asthma First-Hour Protocol</h2>
          <h3>Oxygen & Ventilation:</h3>
          <ul>
            <li>Target SpO2 >90% (accept mild hyperoxia initially)</li>
            <li>High-flow oxygen via non-rebreather mask</li>
            <li>Prepare for intubation (difficult airway: hyperinflation, mucus plugging)</li>
            <li>Avoid sedation if possible; use ketamine if intubation needed</li>
          </ul>
          <h3>Medications (First Hour):</h3>
          <ul>
            <li><strong>Salbutamol:</strong> 15 mg nebulized continuously (not intermittent)</li>
            <li><strong>Ipratropium:</strong> 0.5 mg nebulized (synergistic with salbutamol)</li>
            <li><strong>Steroids:</strong> Dexamethasone 0.6 mg/kg (max 16 mg) PO/IM, prednisolone 1–2 mg/kg PO, or hydrocortisone 4–5 mg/kg IV if severe / NPO</li>
            <li><strong>IV salbutamol:</strong> Where continuous nebulisation fails and monitoring available — per local ICU protocol (taught in Asthma 2)</li>
            <li><strong>Magnesium sulfate:</strong> 40 mg/kg IV over 20 min (max 2g) if severe</li>
            <li><strong>Avoid:</strong> Anticholinergics (atropine) unless intubated</li>
          </ul>
          <h3>Monitoring:</h3>
          <ul>
            <li>Continuous pulse oximetry</li>
            <li>Peak flow every 15 min (if measurable)</li>
            <li>Reassess breath sounds every 15 min</li>
            <li>Watch for pneumothorax (sudden deterioration)</li>
          </ul>
        `,
        questions: [
          {
            question: "Continuous salbutamol nebulisation in severe asthma is typically:",
            options: ["15 mg continuously", "2.5 mg once only", "Oral salbutamol only", "Withheld until ICU"],
            correct: 0,
            explanation: "Continuous 15 mg nebulised salbutamol in status asthmaticus first hour.",
          },
          {
            question: "Magnesium sulfate dose in severe asthma is:",
            options: ["40 mg/kg IV over 20 min (max 2 g)", "400 mg/kg bolus", "Oral only", "Never in children"],
            correct: 0,
            explanation: "40 mg/kg IV over 20 minutes when severe — max 2 g total.",
          },
          {
            question: "Sudden deterioration with unilateral absent breath sounds suggests:",
            options: ["Pneumothorax", "Improved asthma", "Normal variant", "Discharge readiness"],
            correct: 0,
            explanation: "Tension pneumothorax can complicate severe asthma — urgent assessment.",
          },
        ],
      },
      {
        title: 'Module 3: Escalation and ICU Readiness',
        duration: 15,
        content: `
          <h2>When to Escalate: ICU Criteria</h2>
<div className="clinical-note"><h4>Indications for ICU Transfer</h4>
	          <ul>
	            <li>Inadequate response after 1-2 hours of aggressive therapy</li>
	            <li>Altered mental status (CO2 retention, exhaustion)</li>
	            <li>Hypoxemia despite high-flow oxygen</li>
	            <li>Hypercapnia (PaCO2 >45 mmHg)</li>
	            <li>Respiratory failure requiring intubation</li>
	          </ul></div>
          <h3>Intubation Considerations:</h3>
          <ul>
            <li>Use ketamine 1-2 mg/kg IV (preserves airway tone)</li>
            <li>Avoid histamine-releasing agents (atracurium, mivacurium)</li>
            <li>Use rocuronium 1.2 mg/kg for paralysis</li>
            <li>Expect difficult intubation (hyperinflation, secretions)</li>
            <li>Post-intubation: permissive hypercapnia (PaCO2 45-55 acceptable)</li>
          </ul>
          <h3>Ongoing ICU Management:</h3>
          <ul>
            <li>Continue aggressive bronchodilators (salbutamol + ipratropium)</li>
            <li>High-dose corticosteroids (hydrocortisone 4-5 mg/kg Q6H)</li>
            <li>Sedation: propofol (bronchodilation) preferred over benzodiazepines</li>
            <li>Avoid barotrauma: low tidal volumes (6-8 ml/kg), permissive hypercapnia</li>
          </ul>
        `,
        questions: [
          {
            question: "Ketamine is preferred for asthma intubation because it:",
            options: [
              "Preserves airway tone and provides bronchodilation",
              "Causes histamine release",
              "Is contraindicated in asthma",
              "Eliminates need for ventilation",
            ],
            correct: 0,
            explanation: "Ketamine 1–2 mg/kg IV preserves airway tone — useful in difficult asthma airways.",
          },
          {
            question: "ICU transfer for asthma is indicated when:",
            options: [
              "Altered mental status or inadequate response after 1–2 hours aggressive therapy",
              "Mild wheeze only",
              "SpO₂ >98% on room air",
              "First salbutamol dose given",
            ],
            correct: 0,
            explanation: "Escalate for CO₂ retention, hypoxaemia, or failed first-hour therapy.",
          },
          {
            question: "Post-intubation asthma ventilation should use:",
            options: [
              "Low tidal volumes with permissive hypercapnia",
              "Very high tidal volumes",
              "No PEEP ever",
              "Immediate extubation",
            ],
            correct: 0,
            explanation: "6–8 mL/kg tidal volume and permissive hypercapnia reduce barotrauma.",
          },
        ],
      },
    ],
    quiz: {
      title: 'Asthma II Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'A 5-year-old with severe asthma has silent chest, drowsiness, and peak flow unmeasurable. What is the FIRST intervention?',
          options: ['Intermittent salbutamol', 'Continuous salbutamol + oxygen', 'Oral prednisolone', 'Discharge home'],
          correct: 1,
          explanation: 'Silent chest + altered mental status = status asthmaticus. Continuous salbutamol + high-flow oxygen immediately. Prepare for intubation.'
        },
        {
          question: 'What is the correct magnesium sulfate dose for severe asthma in a 20 kg child?',
          options: ['10 mg', '200 mg', '800 mg', '2000 mg'],
          correct: 2,
          explanation: '40 mg/kg = 40 × 20 = 800 mg IV over 20 minutes. Max 2g total.'
        },
        {
          question: 'Which medication is AVOIDED in severe asthma intubation?',
          options: ['Ketamine', 'Rocuronium', 'Atracurium', 'Propofol'],
          correct: 2,
          explanation: 'Atracurium releases histamine → bronchospasm. Use ketamine (preserves airway) + rocuronium (no histamine).'
        },
        {
          question: 'Status asthmaticus is defined as:',
          options: ['Any asthma exacerbation', 'Severe exacerbation unresponsive to therapy for ≥1 hour', 'Mild persistent asthma', 'Asthma with fever'],
          correct: 1,
          explanation: 'Status asthmaticus = severe exacerbation unresponsive to standard therapy for ≥1 hour, requiring ICU-level care.'
        },
        {
          question: 'In intubated asthma patients, permissive hypercapnia target is:',
          options: ['PaCO2 <35 mmHg', 'PaCO2 45-55 mmHg', 'PaCO2 >60 mmHg', 'PaCO2 30-40 mmHg'],
          correct: 1,
          explanation: 'Permissive hypercapnia (PaCO2 45-55) reduces barotrauma risk. Avoid aggressive hyperventilation.'
        },
        {
          question: 'First-hour corticosteroid dose for severe asthma:',
          options: ['10 mg/kg', '25 mg/kg', '4-5 mg/kg', '100 mg/kg'],
          correct: 2,
          explanation: 'Hydrocortisone 4-5 mg/kg IV (max 1g) or methylprednisolone 1-2 mg/kg. High-dose for rapid anti-inflammatory effect.'
        },
        {
          question: 'What is a red flag for pneumothorax during asthma exacerbation?',
          options: ['Improved breath sounds', 'Sudden deterioration with unilateral findings', 'Increased peak flow', 'Fever'],
          correct: 1,
          explanation: 'Sudden deterioration + unilateral absent breath sounds = pneumothorax. Requires immediate chest imaging and possible drainage.'
        },
        {
          question: 'Ipratropium in asthma is given because:',
          options: ['It dilates airways faster than salbutamol', 'It is synergistic with salbutamol', 'It prevents infection', 'It reduces fever'],
          correct: 1,
          explanation: 'Ipratropium (anticholinergic) + salbutamol (beta-2 agonist) = synergistic bronchodilation. Combined effect >either alone.'
        },
        {
          question: 'Altered mental status in severe asthma indicates:',
          options: ['Anxiety', 'CO2 retention and respiratory failure', 'Hypoglycemia', 'Infection'],
          correct: 1,
          explanation: 'Drowsiness/confusion = CO2 retention (PaCO2 >45) and respiratory exhaustion. Requires immediate escalation and possible intubation.'
        },
        {
          question: 'Target SpO2 in severe asthma is:',
          options: ['>95%', '>90%', '>85%', '>80%'],
          correct: 1,
          explanation: '>90% target. Accept mild hyperoxia initially; avoid aggressive hyperoxia but prioritize oxygenation in severe exacerbation.'
        },
        { question: 'Continuous salbutamol nebulisation dose in status asthmaticus is typically:', options: ['15 mg continuously', '2.5 mg once', 'Oral only', 'Withheld until ICU'], correct: 0, explanation: 'Continuous nebulised salbutamol in severe first-hour protocol.' },
        { question: 'Hydrocortisone IV dose for severe asthma is approximately:', options: ['4–5 mg/kg', '40 mg/kg bolus', '0.1 mg/kg only', 'Never in children'], correct: 0, explanation: 'High-dose steroid early in severe exacerbation per protocol.' },
        { question: 'Permissive hypercapnia after intubation for asthma targets PaCO₂:', options: ['45–55 mmHg', '<30 mmHg', '>80 mmHg', 'Not measured'], correct: 0, explanation: 'Allow mild hypercapnia to reduce barotrauma.' },
        { question: 'Propofol is preferred post-intubation in some asthma protocols because:', options: ['It provides bronchodilation', 'It causes bronchospasm', 'It replaces PEEP', 'It is contraindicated always'], correct: 0, explanation: 'Propofol has bronchodilatory properties useful in ventilated asthma.' },
        { question: 'Foreign body aspiration is suggested by:', options: ['Sudden onset unilateral wheeze', 'Bilateral chronic wheeze only', 'Fever always', 'Normal exam'], correct: 0, explanation: 'Sudden unilateral findings warrant aspiration assessment.' }
      ]
    }
  },

  {
    id: 'status-epilepticus-ii',
    title: 'Paediatric Status Epilepticus II: Refractory Seizures and ICU Management',
    level: 'advanced',
    duration: 60,
    price: 1200,
    prerequisite: 'status-epilepticus-i',
    description: 'Advanced management of refractory status epilepticus, super-refractory seizures, and ICU-level seizure control.',
    modules: [
      {
        title: 'Module 1: Refractory Status Epilepticus Definition & Recognition',
        duration: 20,
        content: `
          <h2>Refractory Status Epilepticus (RSE)</h2>
          <h3>Definitions:</h3>
          <ul>
            <li><strong>Status Epilepticus (SE):</strong> ≥5 min of continuous seizures OR ≥2 seizures without full recovery</li>
            <li><strong>Refractory SE (RSE):</strong> SE unresponsive to ≥2 first-line agents (benzodiazepines + phenytoin/levetiracetam)</li>
            <li><strong>Super-Refractory SE (SRSE):</strong> RSE persisting ≥24 hours despite ICU-level therapy (anesthetics)</li>
          </ul>
<div className="clinical-note"><h4>Clinical Recognition of RSE</h4>
	          <ul>
	            <li>Seizures continue despite benzodiazepine + second-line agent</li>
	            <li>Altered mental status between seizures (post-ictal confusion)</li>
	            <li>Autonomic instability (hypertension, tachycardia, hyperthermia)</li>
	            <li>Metabolic derangement (acidosis, hypoglycemia, rhabdomyolysis)</li>
	            <li>Risk of sudden unexpected nocturnal death in epilepsy (SUDEP)</li>
	          </ul></div>
          <h3>Mortality & Morbidity:</h3>
          <ul>
            <li>RSE mortality: 15-40% (higher in SRSE)</li>
            <li>Neurological sequelae: cognitive decline, new-onset epilepsy, movement disorders</li>
            <li>Time-dependent: each hour of uncontrolled seizure increases mortality</li>
          </ul>
        `,
        questions: [
          {
            question: "Refractory status epilepticus (RSE) is SE unresponsive to:",
            options: [
              "≥2 first-line agents (benzodiazepines + second-line anticonvulsant)",
              "Paracetamol only",
              "One dose of oral glucose",
              "No treatment ever",
            ],
            correct: 0,
            explanation: "RSE = failure of benzos plus phenytoin/levetiracetam or equivalent second-line.",
          },
          {
            question: "Super-refractory status epilepticus (SRSE) persists:",
            options: [
              "≥24 hours despite ICU-level anesthetic therapy",
              "5 minutes only",
              "Never in children",
              "Only with fever",
            ],
            correct: 0,
            explanation: "SRSE = RSE continuing ≥24 h despite propofol/midazolam/pentobarbital.",
          },
          {
            question: "Autonomic instability during RSE may include:",
            options: [
              "Hypertension, tachycardia, and hyperthermia",
              "Bradycardia only always",
              "Normal temperature always",
              "No metabolic effects",
            ],
            correct: 0,
            explanation: "Prolonged seizures cause autonomic and metabolic derangement — monitor closely.",
          },
        ],
      },
      {
        title: 'Module 2: Third-Line & ICU-Level Seizure Control',
        duration: 25,
        content: `
          <h2>RSE Management Protocol</h2>
          <h3>Third-Line Agents (RSE Tier):</h3>
          <ul>
            <li><strong>Valproic Acid:</strong> 15-20 mg/kg IV over 5-10 min (rapid onset, hepatotoxicity risk)</li>
            <li><strong>Lacosamide:</strong> 10 mg/kg IV over 15 min (newer, fewer drug interactions)</li>
            <li><strong>Levetiracetam:</strong> 30-60 mg/kg IV (if not already used as second-line)</li>
            <li><strong>Topiramate:</strong> 5-10 mg/kg IV (slower onset, but effective)</li>
          </ul>
          <h3>ICU-Level Anesthetic Agents (SRSE):</h3>
          <ul>
            <li><strong>Propofol:</strong> 1-2 mg/kg IV bolus, then 2-10 mg/kg/hr infusion (rapid onset, hypotension risk)</li>
            <li><strong>Midazolam:</strong> 0.15 mg/kg IV bolus, then 1-10 mg/kg/hr infusion (longer half-life)</li>
            <li><strong>Pentobarbital:</strong> 5-15 mg/kg IV bolus, then 0.5-5 mg/kg/hr (high risk of complications)</li>
            <li><strong>Ketamine:</strong> 1-2 mg/kg IV bolus, then 1-7 mg/kg/hr (preserves airway, analgesia)</li>
          </ul>
          <h3>Monitoring During ICU Therapy:</h3>
          <ul>
            <li>Continuous EEG monitoring (detect electrographic seizures under anesthesia)</li>
            <li>Burst suppression target: 1-2 bursts per minute on EEG</li>
            <li>Vital signs: BP, HR, SpO2, temperature (manage autonomic instability)</li>
            <li>Metabolic: glucose, electrolytes, liver function, CK (rhabdomyolysis)</li>
          </ul>
        `,
        questions: [
          {
            question: "Valproic acid loading dose for RSE is typically:",
            options: ["15–20 mg/kg IV over 5–10 min", "200 mg/kg bolus", "Oral only", "Never in children"],
            correct: 0,
            explanation: "Valproate 15–20 mg/kg IV — monitor for hepatotoxicity.",
          },
          {
            question: "Continuous EEG during anesthetic therapy for SRSE is used to:",
            options: [
              "Detect electrographic seizures under anaesthesia",
              "Replace clinical examination entirely",
              "Diagnose asthma",
              "Measure blood glucose only",
            ],
            correct: 0,
            explanation: "EEG detects non-convulsive seizures when patient is anaesthetised.",
          },
          {
            question: "Propofol infusion for SRSE carries risk of:",
            options: ["Hypotension", "Hyperkalaemia from propofol push", "Insulin resistance only", "No side effects"],
            correct: 0,
            explanation: "Propofol causes hypotension — prepare vasopressor support and monitoring.",
          },
        ],
      },
      {
        title: 'Module 3: SRSE Escalation & Long-Term Management',
        duration: 15,
        content: `
          <h2>Super-Refractory Status Epilepticus (SRSE)</h2>
          <h3>When to Consider SRSE Protocols:</h3>
          <ul>
            <li>RSE persisting ≥24 hours despite anesthetic agents</li>
            <li>Seizures recur on weaning of anesthetics</li>
            <li>Underlying etiology not identified</li>
          </ul>
          <h3>Advanced SRSE Management:</h3>
          <ul>
            <li><strong>Continuous EEG:</strong> Mandatory for detecting electrographic seizures</li>
            <li><strong>Neuroimaging:</strong> MRI to identify structural lesions (tumor, malformation, stroke)</li>
            <li><strong>Lumbar puncture:</strong> If infectious encephalitis suspected (meningitis, HSV)</li>
            <li><strong>Immunotherapy:</strong> Consider IVIG or plasma exchange if autoimmune encephalitis</li>
            <li><strong>Extracorporeal membrane oxygenation (ECMO):</strong> In select cases with severe cardiorespiratory compromise</li>
          </ul>
          <h3>Long-Term Management:</h3>
          <ul>
            <li>Slow weaning of anesthetics (reduce by 10-20% every 12-24 hours)</li>
            <li>Transition to oral/IV maintenance antiepileptics (levetiracetam, valproate, lacosamide)</li>
            <li>Neuropsychological rehabilitation post-SRSE</li>
            <li>Seizure precautions and safety measures</li>
            <li>Family counseling on prognosis and long-term care needs</li>
          </ul>
        `,
        questions: [
          {
            question: "Autoimmune encephalitis in SRSE may be treated with:",
            options: ["IVIG or plasma exchange per specialist protocol", "Oral paracetamol only", "No immunotherapy ever", "Immediate discharge"],
            correct: 0,
            explanation: "Consider IVIG or plasmapheresis when autoimmune encephalitis suspected.",
          },
          {
            question: "Weaning anaesthetics after SRSE should be:",
            options: [
              "Slow — reduce 10–20% every 12–24 hours with EEG monitoring",
              "Stopped abruptly at 24 hours",
              "Never attempted",
              "Replaced with benzodiazepine bolus only",
            ],
            correct: 0,
            explanation: "Gradual wean with EEG to detect recurrence of electrographic seizures.",
          },
          {
            question: "MRI in SRSE helps identify:",
            options: [
              "Structural lesions such as tumour, malformation, or stroke",
              "Only electrolyte levels",
              "Asthma severity",
              "Burn TBSA",
            ],
            correct: 0,
            explanation: "Neuroimaging identifies treatable structural causes of refractory seizures.",
          },
        ],
      },
    ],
    quiz: {
      title: 'Status Epilepticus II Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Refractory Status Epilepticus (RSE) is defined as:',
          options: ['Any seizure lasting >5 min', 'SE unresponsive to ≥2 first-line agents', 'SE with fever', 'Seizure with loss of consciousness'],
          correct: 1,
          explanation: 'RSE = SE unresponsive to ≥2 first-line agents (benzodiazepines + phenytoin/levetiracetam). Requires third-line therapy.'
        },
        {
          question: 'What is the correct valproic acid dose for RSE in a 30 kg child?',
          options: ['150 mg', '300 mg', '450-600 mg', '900 mg'],
          correct: 2,
          explanation: '15-20 mg/kg = 15-20 × 30 = 450-600 mg IV over 5-10 min.'
        },
        {
          question: 'Super-Refractory Status Epilepticus (SRSE) is defined as:',
          options: ['RSE lasting >12 hours', 'RSE persisting ≥24 hours despite anesthetic agents', 'Any RSE', 'RSE with fever'],
          correct: 1,
          explanation: 'SRSE = RSE persisting ≥24 hours despite ICU-level anesthetic therapy. Requires advanced interventions.'
        },
        {
          question: 'Which agent is FIRST-LINE for SRSE?',
          options: ['Phenytoin', 'Propofol', 'Lacosamide', 'Topiramate'],
          correct: 1,
          explanation: 'Propofol (or midazolam/pentobarbital) is first-line anesthetic for SRSE. Rapid onset, ICU-level seizure control.'
        },
        {
          question: 'Target EEG pattern during anesthetic therapy for SRSE:',
          options: ['Continuous activity', '1-2 bursts per minute (burst suppression)', 'Isoelectric (flat)', 'Sleep spindles'],
          correct: 1,
          explanation: 'Burst suppression (1-2 bursts/min) is target. Balances seizure control with avoiding excessive anesthesia.'
        },
        {
          question: 'Mortality of RSE is approximately:',
          options: ['<5%', '5-10%', '15-40%', '>50%'],
          correct: 2,
          explanation: 'RSE mortality 15-40% (higher in SRSE). Time-dependent: each hour increases mortality risk.'
        },
        {
          question: 'What is a key advantage of ketamine for SRSE?',
          options: ['Cheaper than other agents', 'Preserves airway tone and provides analgesia', 'No hypotension risk', 'Faster onset than propofol'],
          correct: 1,
          explanation: 'Ketamine preserves airway tone, provides analgesia, and maintains hemodynamics better than propofol.'
        },
        {
          question: 'Continuous EEG monitoring is MANDATORY in:',
          options: ['All seizures', 'Only febrile seizures', 'SRSE and anesthetized patients', 'Simple febrile seizures only'],
          correct: 2,
          explanation: 'Continuous EEG essential in SRSE to detect electrographic seizures under anesthesia (clinical seizures may be masked).'
        },
        {
          question: 'When should neuroimaging (MRI) be considered in SRSE?',
          options: ['Never', 'Only if fever present', 'When etiology unknown or SRSE persists', 'Only in adults'],
          correct: 2,
          explanation: 'MRI indicated to identify structural lesions (tumor, malformation, stroke) contributing to SRSE.'
        },
        {
          question: 'Immunotherapy (IVIG, plasma exchange) is considered in SRSE when:',
          options: ['Always', 'Autoimmune encephalitis suspected', 'Never', 'Only with fever'],
          correct: 1,
          explanation: 'Immunotherapy considered if autoimmune encephalitis suspected (paraneoplastic, anti-NMDA receptor, etc.).'
        },
        { question: 'Lacosamide loading dose for RSE in a 20 kg child is approximately:', options: ['200 mg IV over 15 min (10 mg/kg)', '20 mg total', '2 g bolus', 'Oral only'], correct: 0, explanation: 'Lacosamide 10 mg/kg IV — check local max dose.' },
        { question: 'Burst suppression on EEG during anaesthesia targets:', options: ['1–2 bursts per minute', 'Continuous seizure activity', 'Flat line only always', 'No EEG needed'], correct: 0, explanation: 'Burst suppression indicates adequate anaesthetic seizure control.' },
        { question: 'Midazolam infusion is sometimes chosen over propofol because:', options: ['Longer half-life and easier maintenance', 'It never causes hypotension', 'It replaces EEG', 'It is oral first-line'], correct: 0, explanation: 'Midazolam has longer duration — titrate in ICU with monitoring.' },
        { question: 'Rhabdomyolysis monitoring in prolonged SE includes:', options: ['Creatine kinase (CK) levels', 'Only temperature', 'No labs', 'Peak flow'], correct: 0, explanation: 'Prolonged convulsion causes muscle breakdown — monitor CK and renal function.' },
        { question: 'LP in SRSE may be indicated when:', options: ['Infectious or autoimmune encephalitis suspected', 'All seizures regardless of cause', 'Never in children', 'Before any benzodiazepine'], correct: 0, explanation: 'CSF analysis when meningitis/encephalitis is in differential.' }
      ]
    }
  },

  {
    id: 'anaphylaxis-i',
    title: 'Paediatric Anaphylaxis I: Recognition and First-Dose Epinephrine',
    level: 'foundational',
    duration: 45,
    price: 800,
    description: 'Recognize anaphylaxis and administer first-dose epinephrine correctly in low-resource settings.',
    modules: [
      {
        title: 'Module 1: Anaphylaxis Recognition',
        duration: 15,
        content: `
          <h2>Anaphylaxis Definition & Recognition</h2>
          <h3>Anaphylaxis Definition:</h3>
          <p>Rapid-onset (minutes to 2 hours) systemic allergic reaction with involvement of ≥2 organ systems.</p>
          <h3>Clinical Presentation (≥2 systems):</h3>
          <ul>
            <li><strong>Skin:</strong> Urticaria, flushing, pruritus, angioedema</li>
            <li><strong>Respiratory:</strong> Stridor, wheeze, dyspnea, hypoxemia</li>
            <li><strong>Cardiovascular:</strong> Hypotension, shock, syncope, arrhythmia</li>
            <li><strong>GI:</strong> Nausea, vomiting, diarrhea, abdominal pain</li>
            <li><strong>Neurological:</strong> Altered mental status, seizures</li>
          </ul>
          <h3>Common Triggers in Children:</h3>
          <ul>
            <li>Foods: peanuts, tree nuts, shellfish, eggs, milk</li>
            <li>Medications: antibiotics (penicillin), NSAIDs, anesthetics</li>
            <li>Insect stings: bees, wasps</li>
            <li>Latex: gloves, catheters</li>
            <li>Contrast media: iodinated contrast</li>
          </ul>
          <h3>Biphasic Anaphylaxis:</h3>
          <ul>
            <li>Initial reaction (minutes to 2 hours)</li>
            <li>Symptom-free interval (30 min to 72 hours)</li>
            <li>Recurrence of symptoms (10-20% of cases)</li>
          </ul>
        `,
        questions: [
          {
            question: "Anaphylaxis is a rapid-onset reaction involving:",
            options: [
              "≥2 organ systems",
              "Skin only always",
              "GI symptoms only",
              "Chronic daily symptoms",
            ],
            correct: 0,
            explanation: "Anaphylaxis = rapid systemic allergic reaction with ≥2 organ systems.",
          },
          {
            question: "Common food triggers of anaphylaxis in children include:",
            options: ["Peanuts and tree nuts", "Rice only", "Water", "Vitamin C"],
            correct: 0,
            explanation: "Peanuts, tree nuts, shellfish, eggs, and milk are common paediatric triggers.",
          },
          {
            question: "Biphasic anaphylaxis refers to:",
            options: [
              "Symptom recurrence after a symptom-free interval",
              "Only one organ involved",
              "Chronic urticaria",
              "Immediate discharge after epinephrine",
            ],
            correct: 0,
            explanation: "10–20% may recur after 30 min–72 h — observe minimum 4–6 hours.",
          },
        ],
      },
      {
        title: 'Module 2: First-Dose Epinephrine Administration',
        duration: 20,
        content: `
          ${ANAPHYLAXIS_ADRENALINE}
          <h2>Epinephrine: The Definitive Treatment</h2>
          <h3>Epinephrine Dose (IM preferred):</h3>
          <ul>
            <li><strong>0.01 mg/kg IM (1:1000 solution)</strong></li>
            <li>Max single dose: 0.5 mg</li>
            <li>Route: Anterolateral thigh (fastest absorption)</li>
            <li>Needle: 23-25 gauge, perpendicular injection</li>
          </ul>
          <h3>Example Doses:</h3>
          <ul>
            <li>10 kg child: 0.1 mg (0.1 mL of 1:1000)</li>
            <li>20 kg child: 0.2 mg (0.2 mL of 1:1000)</li>
            <li>30 kg child: 0.3 mg (0.3 mL of 1:1000)</li>
            <li>40 kg child: 0.4 mg (0.4 mL of 1:1000)</li>
            <li>50+ kg: 0.5 mg (0.5 mL of 1:1000)</li>
          </ul>
          <h3>Why IM (Not IV)?</h3>
          <ul>
            <li>IM: Safer, slower absorption, sustained effect</li>
            <li>IV: Risk of hypertensive crisis, arrhythmia if bolused rapidly</li>
            <li>IV reserved for cardiovascular collapse (after IM fails)</li>
          </ul>
          <h3>Repeat Dosing:</h3>
          <ul>
            <li>If inadequate response after 5-15 min: repeat IM dose</li>
            <li>Can repeat every 5-15 min as needed</li>
            <li>Most cases respond to 1-2 doses</li>
          </ul>
        `,
        questions: [
          {
            question: "IM epinephrine concentration for anaphylaxis is:",
            options: ["1:1000 (1 mg/mL)", "1:10,000 only", "Oral solution", "Topical cream"],
            correct: 0,
            explanation: "0.01 mg/kg IM using 1:1000 solution — anterolateral thigh.",
          },
          {
            question: "Maximum single IM epinephrine dose in anaphylaxis is:",
            options: ["0.5 mg", "5 mg", "0.05 mg", "10 mg"],
            correct: 0,
            explanation: "0.01 mg/kg IM capped at 0.5 mg per dose.",
          },
          {
            question: "IV epinephrine in anaphylaxis is reserved for:",
            options: [
              "Cardiovascular collapse when IM has failed — not first-line",
              "All mild urticaria",
              "Prophylaxis before meals",
              "Oral administration failure only",
            ],
            correct: 0,
            explanation: "IM first-line; IV only for refractory cardiovascular collapse with caution.",
          },
        ],
      },
      {
        title: 'Module 3: Adjunctive Therapy & Observation',
        duration: 10,
        content: `
          <h2>After Epinephrine: Supportive Care</h2>
          <h3>Immediate Actions:</h3>
          <ul>
            <li>Lay patient flat (unless vomiting/respiratory distress)</li>
            <li>Elevate legs 30° (improves venous return)</li>
            <li>Establish IV access (large bore, 18G if possible)</li>
            <li>Oxygen: target SpO2 >94%</li>
            <li>Continuous monitoring: HR, BP, SpO2</li>
          </ul>
          <h3>Adjunctive Medications:</h3>
          <ul>
            <li><strong>Antihistamines:</strong> Diphenhydramine 1 mg/kg IV/IM (max 50 mg) - NOT first-line, use after epinephrine</li>
            <li><strong>Corticosteroids:</strong> Hydrocortisone 4-5 mg/kg IV (max 1g) - prevents biphasic reaction</li>
            <li><strong>Bronchodilators:</strong> Salbutamol if wheeze persists</li>
            <li><strong>Fluids:</strong> 20 mL/kg bolus for hypotension (repeat if needed)</li>
          </ul>
          <h3>Observation Period:</h3>
          <ul>
            <li>Minimum 4-6 hours post-resolution</li>
            <li>Longer if biphasic reaction risk or severe initial presentation</li>
            <li>Monitor for recurrence of symptoms</li>
          </ul>
          <h3>Discharge Instructions:</h3>
          <ul>
            <li>Prescribe auto-injector (epinephrine pen) for future episodes</li>
            <li>Teach proper IM injection technique</li>
            <li>Identify and avoid trigger</li>
            <li>Wear medical alert bracelet</li>
            <li>Follow-up with allergy specialist</li>
          </ul>
        `,
        questions: [
          {
            question: "After epinephrine, positioning should be:",
            options: [
              "Flat with legs elevated 30° unless vomiting or respiratory distress",
              "Upright always",
              "Prone position",
              "Ambulatory immediately",
            ],
            correct: 0,
            explanation: "Flat with leg elevation improves venous return — unless airway compromise.",
          },
          {
            question: "Antihistamines in anaphylaxis are:",
            options: [
              "Adjunctive after epinephrine — not first-line",
              "Definitive first-line treatment",
              "Contraindicated always",
              "Replace epinephrine entirely",
            ],
            correct: 0,
            explanation: "Epinephrine is definitive; antihistamines are adjunctive only.",
          },
          {
            question: "Hypotension in anaphylaxis may require:",
            options: [
              "20 mL/kg isotonic fluid bolus with repeat epinephrine as needed",
              "Oral fluids only",
              "Withhold all fluids",
              "Immediate discharge",
            ],
            correct: 0,
            explanation: "Fluids plus repeat IM epinephrine treat anaphylactic shock.",
          },
        ],
      },
    ],
    quiz: {
      title: 'Anaphylaxis I Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Anaphylaxis requires involvement of:',
          options: ['≥1 organ system', '≥2 organ systems', '≥3 organ systems', 'Only respiratory system'],
          correct: 1,
          explanation: 'Anaphylaxis = rapid-onset systemic reaction with ≥2 organ systems involved.'
        },
        {
          question: 'Epinephrine dose for a 25 kg child with anaphylaxis:',
          options: ['0.15 mg IM', '0.25 mg IM', '0.5 mg IM', '1 mg IM'],
          correct: 1,
          explanation: '0.01 mg/kg = 0.01 × 25 = 0.25 mg IM (0.25 mL of 1:1000 solution).'
        },
        {
          question: 'BEST site for IM epinephrine in anaphylaxis:',
          options: ['Deltoid', 'Gluteal', 'Anterolateral thigh', 'Forearm'],
          correct: 2,
          explanation: 'Anterolateral thigh: fastest absorption, best perfusion, easiest access in emergency.'
        },
        {
          question: 'Why is IM epinephrine preferred over IV?',
          options: ['Faster onset', 'Safer, slower absorption, sustained effect', 'Cheaper', 'Easier to calculate'],
          correct: 1,
          explanation: 'IM safer: slower absorption, sustained effect. IV reserved for cardiovascular collapse (risk of hypertensive crisis).'
        },
        {
          question: 'If inadequate response to first epinephrine dose after 5-15 min:',
          options: ['Wait 30 min', 'Repeat IM epinephrine dose', 'Give IV epinephrine only', 'Give antihistamines only'],
          correct: 1,
          explanation: 'Repeat IM epinephrine every 5-15 min as needed. Most cases respond to 1-2 doses.'
        },
        {
          question: 'Biphasic anaphylaxis occurs in approximately:',
          options: ['1-5% of cases', '10-20% of cases', '50% of cases', '80% of cases'],
          correct: 1,
          explanation: 'Biphasic anaphylaxis (recurrence after symptom-free interval) occurs in 10-20% of cases.'
        },
        {
          question: 'After epinephrine, patient should be positioned:',
          options: ['Sitting upright', 'Flat with legs elevated 30°', 'Trendelenburg (head down)', 'Prone'],
          correct: 1,
          explanation: 'Flat position with legs elevated 30° improves venous return and prevents syncope.'
        },
        {
          question: 'Minimum observation period post-anaphylaxis:',
          options: ['30 min', '1 hour', '4-6 hours', '24 hours'],
          correct: 2,
          explanation: 'Minimum 4-6 hours observation to detect biphasic reaction or recurrence.'
        },
        {
          question: 'Antihistamines in anaphylaxis are:',
          options: ['First-line treatment', 'Adjunctive (after epinephrine)', 'Contraindicated', 'Sufficient monotherapy'],
          correct: 1,
          explanation: 'Antihistamines adjunctive only. Epinephrine is definitive first-line; antihistamines given after.'
        },
        {
          question: 'Corticosteroids in anaphylaxis prevent:',
          options: ['Initial reaction', 'Biphasic reaction', 'Urticaria', 'Fever'],
          correct: 1,
          explanation: 'Hydrocortisone 4-5 mg/kg IV prevents biphasic anaphylaxis (recurrence after symptom-free interval).'
        }
      ]
    }
  },

  {
    id: 'anaphylaxis-ii',
    title: 'Paediatric Anaphylaxis II: Refractory Anaphylaxis and Differential Diagnosis',
    level: 'advanced',
    duration: 60,
    price: 1200,
    prerequisite: 'anaphylaxis-i',
    description: 'Manage refractory anaphylaxis, distinguish from anaphylactoid reactions, and handle complications.',
    modules: [
      {
        title: 'Module 1: Refractory Anaphylaxis Recognition',
        duration: 20,
        content: `
          <h2>Refractory Anaphylaxis</h2>
          <h3>Definition:</h3>
          <p>Anaphylaxis unresponsive to standard epinephrine therapy (inadequate response after 2 doses IM or progression despite treatment).</p>
          <h3>Red Flags for Refractory Anaphylaxis:</h3>
          <ul>
            <li>Persistent hypotension despite 2 IM epinephrine doses</li>
            <li>Worsening respiratory distress (stridor, wheeze)</li>
            <li>Angioedema involving airway (tongue, epiglottis)</li>
            <li>Altered mental status or shock</li>
            <li>Recurrent symptoms despite treatment</li>
          </ul>
          <h3>Risk Factors for Severe/Refractory Anaphylaxis:</h3>
          <ul>
            <li>Delayed epinephrine administration (>30 min)</li>
            <li>Biphasic or protracted anaphylaxis</li>
            <li>Underlying asthma or cardiovascular disease</li>
            <li>Beta-blocker use (blunts epinephrine response)</li>
            <li>ACE inhibitor use (increases bradykinin, worsens angioedema)</li>
          </ul>
          <h3>Differential Diagnosis (Mimic Anaphylaxis):</h3>
          <ul>
            <li><strong>Anaphylactoid reaction:</strong> Similar presentation, but non-IgE mediated (contrast media, NSAIDs)</li>
            <li><strong>Acute asthma:</strong> Wheeze only, no urticaria or angioedema</li>
            <li><strong>Angioedema (hereditary):</strong> Swelling without urticaria, normal C1-esterase inhibitor</li>
            <li><strong>Septic shock:</strong> Fever, infection source, gradual onset</li>
            <li><strong>Anaphylactoid reaction to contrast:</strong> Occurs during/after contrast injection</li>
          </ul>
        `,
        questions: [
          {
            question: "Refractory anaphylaxis is defined as failure to respond after:",
            options: [
              "Standard epinephrine therapy (e.g. 2 IM doses)",
              "Antihistamine alone",
              "Oral steroids only",
              "Observation without treatment",
            ],
            correct: 0,
            explanation: "Refractory = inadequate response after 2 IM epinephrine doses or progression.",
          },
          {
            question: "Beta-blocker use during anaphylaxis may:",
            options: [
              "Blunt epinephrine response — consider glucagon",
              "Improve epinephrine effect",
              "Replace epinephrine entirely",
              "Have no clinical effect",
            ],
            correct: 0,
            explanation: "Beta-blockers blunt beta-adrenergic response — glucagon may help.",
          },
          {
            question: "Anaphylactoid reactions differ from IgE-mediated anaphylaxis by:",
            options: [
              "Non-IgE direct mast cell degranulation",
              "Never requiring epinephrine",
              "Only affecting skin",
              "Always being mild",
            ],
            correct: 0,
            explanation: "Anaphylactoid = direct mast cell activation (contrast, NSAIDs) — treat same as anaphylaxis.",
          },
        ],
      },
      {
        title: 'Module 2: Advanced Management of Refractory Anaphylaxis',
        duration: 25,
        content: `
          <h2>Refractory Anaphylaxis Protocol</h2>
          <h3>Escalation Pathway:</h3>
          <ul>
            <li><strong>1st epinephrine dose:</strong> 0.01 mg/kg IM (as in Anaphylaxis I)</li>
            <li><strong>If inadequate response (5-15 min):</strong> Repeat 2nd IM dose</li>
            <li><strong>If still inadequate:</strong> Consider IV epinephrine (high-risk, requires ICU)</li>
          </ul>
          <h3>IV Epinephrine Protocol (Refractory Cases):</h3>
          <ul>
            <li><strong>Dilution:</strong> 1:10,000 solution (0.1 mg/mL)</li>
            <li><strong>Bolus:</strong> 0.01 mg/kg IV (1 mL/kg of 1:10,000) over 5-10 min</li>
            <li><strong>Infusion:</strong> 0.1-1.5 mcg/kg/min, titrate to response</li>
            <li><strong>Monitoring:</strong> Continuous cardiac monitor (risk of arrhythmia)</li>
            <li><strong>Caution:</strong> Risk of hypertensive crisis, coronary ischemia</li>
          </ul>
          <h3>Adjunctive Agents for Refractory Cases:</h3>
          <ul>
            <li><strong>Glucagon:</strong> 1-5 mg IV bolus (bypasses beta-blockers, if present)</li>
            <li><strong>Vasopressin:</strong> 0.4-1 unit/kg IV (alternative vasopressor)</li>
            <li><strong>Phenylephrine:</strong> 0.5-1.4 mcg/kg/min IV infusion (pure alpha-agonist)</li>
            <li><strong>High-dose corticosteroids:</strong> Methylprednisolone 30 mg/kg IV (max 1g)</li>
            <li><strong>Aggressive fluid resuscitation:</strong> 20-30 mL/kg bolus (repeat as needed)</li>
          </ul>
          <h3>Airway Management:</h3>
          <ul>
            <li>Prepare for intubation if angioedema involves airway</li>
            <li>Use ketamine 1-2 mg/kg IV (preserves airway tone)</li>
            <li>Avoid histamine-releasing agents (atracurium, mivacurium)</li>
            <li>Consider emergency cricothyrotomy if airway obstruction imminent</li>
          </ul>
        `,
        questions: [
          {
            question: "IV epinephrine for refractory anaphylaxis uses concentration:",
            options: ["1:10,000 (0.1 mg/mL)", "1:1000 undiluted bolus", "Oral solution", "Topical only"],
            correct: 0,
            explanation: "IV epinephrine is diluted 1:10,000 — not 1:1000 IM strength.",
          },
          {
            question: "Glucagon in refractory anaphylaxis is useful when:",
            options: [
              "Patient is on beta-blockers",
              "No hypotension is present",
              "Only urticaria occurs",
              "Epinephrine is contraindicated in all anaphylaxis",
            ],
            correct: 0,
            explanation: "Glucagon bypasses beta-receptor blockade from beta-blocker use.",
          },
          {
            question: "Airway angioedema in anaphylaxis may require:",
            options: [
              "Early intubation with ketamine — prepare for difficult airway",
              "Discharge without observation",
              "Antihistamine as sole therapy",
              "Delay until complete obstruction",
            ],
            correct: 0,
            explanation: "Angioedema involving tongue/epiglottis needs urgent airway planning.",
          },
        ],
      },
      {
        title: 'Module 3: Anaphylactoid Reactions & Long-Term Management',
        duration: 15,
        content: `
          <h2>Anaphylactoid Reactions & Prevention</h2>
          <h3>Anaphylactoid Reaction (Non-IgE Mediated):</h3>
          <ul>
            <li>Similar clinical presentation to anaphylaxis</li>
            <li>Triggered by: contrast media, NSAIDs, ACE inhibitors, opioids</li>
            <li>Mechanism: Direct mast cell degranulation (not IgE)</li>
            <li>Management: Same as anaphylaxis (epinephrine, fluids, monitoring)</li>
            <li>Prevention: Pre-medication with corticosteroids + antihistamines if contrast needed</li>
          </ul>
          <h3>Contrast-Induced Anaphylactoid Reaction Prevention:</h3>
          <ul>
            <li><strong>High-risk patients:</strong> History of contrast reaction, asthma, renal disease</li>
            <li><strong>Pre-medication (12 hours before contrast):</strong></li>
            <li>Methylprednisolone 32 mg PO OR hydrocortisone 50 mg IV</li>
            <li>Diphenhydramine 1 mg/kg PO/IV (max 50 mg)</li>
            <li><strong>Use low-osmolar or iso-osmolar contrast media</strong></li>
          </ul>
          <h3>Long-Term Management Post-Anaphylaxis:</h3>
          <ul>
            <li><strong>Allergy testing:</strong> Skin prick test or serum-specific IgE to identify trigger</li>
            <li><strong>Trigger avoidance:</strong> Strict avoidance of identified allergen</li>
            <li><strong>Epinephrine auto-injector prescription:</strong> Teach proper IM technique</li>
            <li><strong>Medical alert bracelet:</strong> Identify allergen</li>
            <li><strong>Immunotherapy:</strong> Consider venom immunotherapy if insect sting anaphylaxis</li>
            <li><strong>Family education:</strong> Recognize symptoms, when to use auto-injector</li>
          </ul>
        `,
        questions: [
          {
            question: "Contrast-induced anaphylactoid reaction prevention may include:",
            options: [
              "Pre-medication with corticosteroid and antihistamine in high-risk patients",
              "No preparation ever",
              "Oral epinephrine prophylaxis",
              "Withholding all contrast always without assessment",
            ],
            correct: 0,
            explanation: "High-risk patients may receive steroid + antihistamine pre-medication and low-osmolar contrast.",
          },
          {
            question: "Long-term management after anaphylaxis includes:",
            options: [
              "Allergy testing, trigger avoidance, and epinephrine auto-injector",
              "No follow-up needed",
              "Avoid all future medical care",
              "Daily oral epinephrine",
            ],
            correct: 0,
            explanation: "Identify trigger, prescribe auto-injector, and educate family on use.",
          },
          {
            question: "Venom immunotherapy may be considered after:",
            options: [
              "Insect sting anaphylaxis",
              "Mild food intolerance only",
              "All viral illnesses",
              "Normal urticaria without systemic features",
            ],
            correct: 0,
            explanation: "Venom immunotherapy reduces recurrence risk after sting anaphylaxis.",
          },
        ],
      },
    ],
    quiz: {
      title: 'Anaphylaxis II Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Refractory anaphylaxis is defined as:',
          options: ['Any anaphylaxis', 'Anaphylaxis unresponsive to standard epinephrine therapy', 'Anaphylaxis with fever', 'Anaphylaxis without urticaria'],
          correct: 1,
          explanation: 'Refractory anaphylaxis = inadequate response after 2 IM epinephrine doses or progression despite treatment.'
        },
        {
          question: 'IV epinephrine concentration for refractory anaphylaxis:',
          options: ['1:1000', '1:10,000', '1:100,000', '1:1,000,000'],
          correct: 1,
          explanation: 'IV epinephrine uses 1:10,000 solution (0.1 mg/mL), NOT 1:1000 (which is for IM).'
        },
        {
          question: 'Medication that can blunt epinephrine response in anaphylaxis:',
          options: ['Antihistamines', 'Beta-blockers', 'Corticosteroids', 'Oxygen'],
          correct: 1,
          explanation: 'Beta-blockers blunt epinephrine response. Consider glucagon if beta-blocker use suspected.'
        },
        {
          question: 'Anaphylactoid reactions differ from anaphylaxis in:',
          options: ['Clinical presentation', 'Mechanism (non-IgE mediated)', 'Treatment', 'Prognosis'],
          correct: 1,
          explanation: 'Anaphylactoid = non-IgE mediated (direct mast cell degranulation). Clinical presentation similar; management same.'
        },
        {
          question: 'Glucagon in refractory anaphylaxis is useful because:',
          options: ['It treats urticaria', 'It bypasses beta-blockers', 'It prevents infection', 'It reduces fever'],
          correct: 1,
          explanation: 'Glucagon bypasses beta-adrenergic blockade, useful if patient on beta-blockers.'
        },
        {
          question: 'IV epinephrine dose for refractory anaphylaxis in a 20 kg child:',
          options: ['0.02 mg', '0.2 mg', '0.5 mg', '2 mg'],
          correct: 1,
          explanation: '0.01 mg/kg of 1:10,000 = 0.01 × 20 = 0.2 mg IV over 5-10 min.'
        },
        {
          question: 'Pre-medication for contrast-induced anaphylactoid reaction includes:',
          options: ['Epinephrine only', 'Corticosteroids + antihistamines', 'Antibiotics', 'Anticonvulsants'],
          correct: 1,
          explanation: 'Pre-medication: methylprednisolone 32 mg PO + diphenhydramine 1 mg/kg 12 hours before contrast.'
        },
        {
          question: 'Airway management in severe anaphylaxis with angioedema:',
          options: ['Avoid intubation', 'Use ketamine (preserves airway tone)', 'Use propofol', 'Delay airway management'],
          correct: 1,
          explanation: 'Ketamine preferred: preserves airway tone, avoids histamine-releasing agents.'
        },
        {
          question: 'Long-term management post-anaphylaxis includes:',
          options: ['No follow-up needed', 'Allergy testing + epinephrine auto-injector + trigger avoidance', 'Prophylactic antibiotics', 'Lifelong antihistamines'],
          correct: 1,
          explanation: 'Identify trigger (allergy testing), prescribe auto-injector, teach avoidance, provide medical alert bracelet.'
        },
        {
          question: 'Venom immunotherapy is considered for:',
          options: ['Food anaphylaxis', 'Drug anaphylaxis', 'Insect sting anaphylaxis', 'Contrast anaphylaxis'],
          correct: 2,
          explanation: 'Venom immunotherapy indicated for insect sting anaphylaxis (bees, wasps) to reduce future reaction risk.'
        }
      ]
    }
  },

  // ============================================
  // BATCH 2: DKA I & II, Severe Pneumonia/ARDS I & II
  // ============================================

  {
    id: 'dka-i',
    title: 'DKA 1: Recognition & Fluids (mmol/L)',
    level: 'foundational',
    duration: 45,
    price: 800,
    description: 'Recognize diabetic ketoacidosis and implement first-hour resuscitation in low-resource settings.',
    modules: [
      {
        title: 'Module 1: DKA Recognition & Severity Assessment',
        duration: 15,
        content: `
          <h2>Diabetic Ketoacidosis (DKA) Recognition</h2>
          <h3>DKA Definition:</h3>
          ${GLUCOSE_MMOL_NOTE}
          <p>Metabolic emergency: glucose typically &gt;11 mmol/L (&gt;200 mg/dL), acidosis (pH &lt;7.3, bicarbonate &lt;15 mmol/L), and ketonaemia/ketonuria.</p>
          <h3>Clinical Presentation:</h3>
          <ul>
            <li><strong>Respiratory:</strong> Kussmaul breathing (deep, rapid), fruity breath odor (acetone)</li>
            <li><strong>Neurological:</strong> Altered mental status, lethargy, coma (cerebral edema risk)</li>
            <li><strong>GI:</strong> Nausea, vomiting, abdominal pain</li>
            <li><strong>Cardiovascular:</strong> Tachycardia, hypotension (dehydration)</li>
            <li><strong>Skin:</strong> Dry mucous membranes, poor skin turgor</li>
          </ul>
          <h3>DKA Severity Classification:</h3>
          <ul>
            <li><strong>Mild:</strong> pH 7.25-7.30, HCO3 15-18 mEq/L, alert mental status</li>
            <li><strong>Moderate:</strong> pH 7.15-7.24, HCO3 10-14 mEq/L, mild lethargy</li>
            <li><strong>Severe:</strong> pH <7.15, HCO3 <10 mEq/L, altered mental status/coma</li>
          </ul>
          <h3>Diagnostic Criteria:</h3>
          <ul>
            <li>Glucose &gt;11 mmol/L (often &gt;14 mmol/L) or euglycaemic DKA with ketones + acidosis</li>
            <li>Venous pH <7.3 OR HCO3 <15 mEq/L</li>
            <li>Positive serum/urine ketones</li>
            <li>Anion gap metabolic acidosis (AG >12)</li>
          </ul>
        `,
        questions: [
          {
            question: "Mild DKA is classified by pH in the range:",
            options: ["7.25–7.30", "<7.15", ">7.45", "7.40–7.50"],
            correct: 0,
            explanation: "Mild DKA: pH 7.25–7.30 with alert mental status per severity classification.",
          },
          {
            question: "Common gastrointestinal features of DKA include:",
            options: ["Nausea, vomiting, and abdominal pain", "Only diarrhoea", "No GI symptoms", "Hematemesis always"],
            correct: 0,
            explanation: "Nausea, vomiting, and abdominal pain are frequent presenting features of DKA.",
          },
          {
            question: "Moderate DKA typically presents with pH:",
            options: ["7.15–7.24", ">7.40", "<7.00", "7.35–7.45"],
            correct: 0,
            explanation: "Moderate DKA: pH 7.15–7.24 with mild lethargy.",
          },
        ],
      },
      {
        title: 'Module 2: First-Hour Resuscitation',
        duration: 20,
        content: `
          <h2>DKA First-Hour Protocol</h2>
          <h3>Immediate Actions (First 15 min):</h3>
          <ul>
            <li>Establish IV access (large bore, 18G if possible)</li>
            <li>Draw labs: glucose, electrolytes, pH, HCO3, ketones, BUN, creatinine</li>
            <li>Continuous monitoring: HR, BP, SpO2, respiratory rate</li>
            <li>Oxygen: target SpO2 >94%</li>
            <li>Assess mental status and neurological signs</li>
          </ul>
          <h3>Fluid Resuscitation (First Hour):</h3>
          ${DKA_FLUIDS_CONFLICT}
          <div className="clinical-note"><h4>Slow and steady</h4>
          <ul>
            <li><strong>Bolus:</strong> 10 mL/kg over 15–30 min only if perfusion compromised — avoid large rapid boluses (cerebral oedema risk).</li>
            <li><strong>Deficit replacement:</strong> Spread over 24–48 h per ISPAD — do not correct entire deficit in the first hours.</li>
            <li>Monitor GCS hourly; headache, vomiting, bradycardia → treat cerebral oedema urgently.</li>
          </ul></div>
          <h3>Insulin (when indicated):</h3>
          ${DKA_INSULIN_KETONES}
          <ul>
            <li>Do not start until K⁺ &gt;3.5 mmol/L and initial fluids underway (~1 h).</li>
            <li>0.05–0.1 units/kg/h IV infusion — no bolus in children.</li>
          </ul>
          <h3>Electrolyte Monitoring:</h3>
          <ul>
            <li><strong>Potassium:</strong> Total body deficit 3-5 mEq/kg; recheck every 2-4 hours</li>
            <li><strong>Phosphate:</strong> May be low; supplement if <2 mg/dL</li>
            <li><strong>Sodium:</strong> Correct hypernatremia cautiously (max 10 mEq/L/24h)</li>
            <li><strong>Magnesium:</strong> Often depleted; supplement if <1.7 mg/dL</li>
          </ul>
        `,
        questions: [
          {
            question: "Initial paediatric DKA insulin strategy is:",
            options: [
              "Contraindicated — use continuous infusion only",
              "Standard first-line",
              "Given before fluids",
              "10 units/kg IV push",
            ],
            correct: 0,
            explanation: "No IV loading dose in children — 0.05–0.1 units/kg/h infusion after K⁺ >3.5 mmol/L.",
          },
          {
            question: "Fluid deficit replacement in DKA should be spread over:",
            options: ["24–48 hours per ISPAD", "First 30 minutes entirely", "One week", "Never replace"],
            correct: 0,
            explanation: "Slow deficit replacement over 24–48 h reduces cerebral oedema risk.",
          },
          {
            question: "Initial DKA bolus (10 mL/kg) is given only when:",
            options: [
              "Perfusion is compromised — not routinely to all",
              "Every child regardless of perfusion",
              "Glucose is normal",
              "After insulin IV loading dose",
            ],
            correct: 0,
            explanation: "Bolus 10 mL/kg over 15–30 min only if haemodynamic compromise — avoid large rapid boluses.",
          },
        ],
      },
      {
        title: 'Module 3: Complications & Ongoing Management',
        duration: 10,
        content: `
          <h2>DKA Complications & Monitoring</h2>
          <h3>Cerebral Edema (Most Feared Complication):</h3>
          <ul>
            <li><strong>Risk factors:</strong> Young age, new-onset diabetes, severe acidosis, rapid fluid shifts</li>
            <li><strong>Signs:</strong> Headache, altered mental status, seizures, coma</li>
            <li><strong>Prevention:</strong> Slow fluid replacement, avoid rapid glucose drop</li>
            <li><strong>Treatment:</strong> Hypertonic saline (3%) 0.25-1 g/kg IV, elevate head 30°, intubate if coma</li>
          </ul>
          <h3>Hypokalemia (Insulin-Induced):</h3>
          ${DKA_POTASSIUM_SAFETY}
          <ul>
            <li>Insulin shifts K+ intracellularly → severe hypokalemia risk</li>
            <li>Monitor K+ every 2-4 hours initially</li>
            <li>If K+ &lt;3.5 mmol/L, hold insulin and replace K+ via fluids — not IV push</li>
            <li>Target K+ 4-5 mmol/L during insulin therapy</li>
          </ul>
          <h3>Ongoing Monitoring (First 24 hours):</h3>
          <ul>
            <li>Glucose: every 1 hour initially, then every 2-4 hours</li>
            <li>Electrolytes: every 2-4 hours until stable</li>
            <li>Arterial pH: every 2-4 hours (target pH >7.3)</li>
            <li>Urine ketones: until negative</li>
            <li>Neurological status: hourly assessment</li>
          </ul>
          <h3>Transition to Maintenance:</h3>
          <ul>
            <li>When glucose &lt;14 mmol/L with dextrose in fluids: continue insulin until ketosis resolving and pH &gt;7.3</li>
            <li>Continue IV fluids until tolerating PO</li>
            <li>Start PO intake: clear fluids → regular diet</li>
            <li>Diabetes education and follow-up with endocrinology</li>
          </ul>
        `,
        questions: [
          {
            question: "Early warning signs of cerebral oedema in DKA include:",
            options: ["Headache and altered mental status", "Only hyperglycaemia", "Normal GCS always", "Bradycardia as first sign only"],
            correct: 0,
            explanation: "Headache, vomiting, and declining GCS warn of cerebral oedema — act urgently.",
          },
          {
            question: "Potassium replacement in DKA must:",
            options: [
              "Never be given as IV push — add to fluids or slow infusion",
              "Always be IV push for speed",
              "Be withheld until discharge",
              "Use oral KCl only in coma",
            ],
            correct: 0,
            explanation: "Never KCl IV push — replace via fluids with monitoring.",
          },
          {
            question: "Cerebral oedema treatment may include:",
            options: [
              "Hypertonic saline (3%) and head elevation 30°",
              "Rapid large hypotonic bolus",
              "Large insulin IV push first-line",
              "Withhold all fluids",
            ],
            correct: 0,
            explanation: "Hypertonic saline, head elevation, and airway protection treat cerebral oedema.",
          },
        ],
      },
    ],
    quiz: {
      title: 'DKA I Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'DKA diagnostic criteria include:',
          options: ['Glucose >11 mmol/L only', 'Hyperglycaemia + acidosis (pH <7.3) + ketones', 'Fever + vomiting', 'Seizures only'],
          correct: 1,
          explanation: 'DKA = hyperglycaemia + metabolic acidosis + ketonaemia — confirm with glucose (mmol/L), pH/bicarbonate, and ketones.'
        },
        {
          question: 'Kussmaul breathing in DKA is:',
          options: ['Shallow breathing', 'Deep, rapid breathing (respiratory compensation for acidosis)', 'Irregular breathing', 'Apneic episodes'],
          correct: 1,
          explanation: 'Kussmaul breathing = deep, rapid breathing to blow off CO2 and compensate for metabolic acidosis.'
        },
        {
          question: 'CRITICAL: Before starting insulin in DKA, check:',
          options: ['Glucose only', 'Potassium level (must be >3.5)', 'pH only', 'Sodium only'],
          correct: 1,
          explanation: 'Insulin shifts K+ intracellularly → severe hypokalemia. Must have K+ >3.5 before insulin.'
        },
        {
          question: 'Initial fluid bolus for DKA in a 20 kg child:',
          options: ['200 mL', '400 mL', '800 mL', '1200 mL'],
          correct: 0,
          explanation: 'Initial DKA bolus is 10 mL/kg when haemodynamic compromise is present: 10 × 20 = 200 mL (not 800 mL).'
        },
        {
          question: 'Insulin infusion rate for DKA:',
          options: ['0.01 unit/kg/hr', '0.05-0.1 unit/kg/hr', '0.5 unit/kg/hr', '1 unit/kg/hr'],
          correct: 1,
          explanation: '0.05-0.1 unit/kg/hr IV infusion. Titrate to decrease glucose ~3–6 mmol/L/hr (~50–100 mg/dL/hr).'
        },
        {
          question: 'Most feared complication of DKA:',
          options: ['Hyperkalemia', 'Cerebral edema', 'Hypoglycemia', 'Infection'],
          correct: 1,
          explanation: 'Cerebral edema: risk factors include young age, new-onset diabetes, severe acidosis, rapid fluid shifts.'
        },
        {
          question: 'Fruity breath odor in DKA is due to:',
          options: ['Infection', 'Acetone (ketone body)', 'Gastric contents', 'Medication'],
          correct: 1,
          explanation: 'Fruity breath = acetone exhalation (ketone body). Pathognomonic for DKA.'
        },
        {
          question: 'Severe DKA is defined as:',
          options: ['pH 7.25-7.30', 'pH 7.15-7.24', 'pH <7.15 + HCO3 <10 + altered mental status', 'Any DKA with vomiting'],
          correct: 2,
          explanation: 'Severe DKA: pH <7.15, HCO3 <10 mEq/L, altered mental status/coma.'
        },
        {
          question: 'Total body potassium deficit in DKA is approximately:',
          options: ['0.5-1 mEq/kg', '1-2 mEq/kg', '3-5 mEq/kg', '10+ mEq/kg'],
          correct: 2,
          explanation: 'Total body K+ deficit 3-5 mEq/kg. Recheck every 2-4 hours during treatment.'
        },
        {
          question: 'When can you stop insulin in DKA?',
          options: ['As soon as glucose is normal', 'When ketosis is resolving and acidosis improving', 'After one hour', 'Never'],
          correct: 1,
          explanation: 'Continue insulin until ketosis resolves and acidosis improves — not glucose alone.'
        },
        { question: 'Dry mucous membranes in DKA reflect:', options: ['Dehydration from osmotic diuresis', 'Normal hydration', 'Hypervolaemia', 'Only infection'], correct: 0, explanation: 'Hyperglycaemia causes osmotic diuresis and dehydration.' },
        { question: 'Tachycardia in DKA is often due to:', options: ['Dehydration and acidosis', 'Bradycardia from insulin', 'Normal sleep', 'Hyperkalaemia only'], correct: 0, explanation: 'Compensatory tachycardia from volume loss and acidosis.' },
        { question: 'Venous pH is preferred over arterial for DKA monitoring because:', options: ['Less painful with acceptable correlation for trend', 'It is always normal in DKA', 'Arterial is contraindicated always', 'pH is not useful'], correct: 0, explanation: 'Venous pH trends adequately for DKA management in many settings.' },
        { question: 'Urine ketones in DKA should be monitored until:', options: ['Negative or clearing with resolving acidosis', 'Never checked', 'Only at discharge', 'Positive always is acceptable at discharge'], correct: 0, explanation: 'Continue insulin until ketosis clears — not glucose alone.' },
        { question: 'Anion gap in DKA is typically:', options: ['Elevated (>12)', 'Zero', 'Negative always', 'Unrelated to acidosis'], correct: 0, explanation: 'DKA causes high anion gap metabolic acidosis from ketones.' }
      ]
    }
  },

  {
    id: 'dka-ii',
    title: 'DKA 2: Insulin, Ketones & Complications',
    level: 'advanced',
    duration: 60,
    price: 1200,
    prerequisite: 'dka-i',
    description: 'Manage euglycemic DKA, cerebral edema, and complex electrolyte derangements.',
    modules: [
      {
        title: 'Module 1: Euglycemic DKA Recognition',
        duration: 20,
        content: `
          <h2>Euglycemic DKA (eGDKA)</h2>
          <h3>Definition:</h3>
          <p>DKA with glucose &lt;14 mmol/L (&lt;250 mg/dL; often &lt;11 mmol/L / &lt;200 mg/dL), presenting diagnostic challenge — confirm ketones and acidosis.</p>
          <h3>Epidemiology:</h3>
          <ul>
            <li>5-10% of all DKA cases</li>
            <li>More common in: new-onset diabetes, SGLT2 inhibitor use, pregnancy, starvation</li>
            <li>Often misdiagnosed as gastroenteritis or other conditions</li>
          </ul>
          <h3>Clinical Presentation (Similar to DKA):</h3>
          <ul>
            <li>Kussmaul breathing (deep, rapid)</li>
            <li>Fruity breath odor</li>
            <li>Nausea, vomiting, abdominal pain</li>
            <li>Altered mental status</li>
            <li>Dehydration signs</li>
          </ul>
          <h3>Diagnostic Clues (Glucose &lt;14 mmol/L):</h3>
          <ul>
            <li>Metabolic acidosis (pH <7.3, HCO3 <15)</li>
            <li>Positive serum/urine ketones DESPITE normal glucose</li>
            <li>Anion gap >12</li>
            <li>Normal or near-normal glucose misleads diagnosis</li>
          </ul>
          <h3>Risk Factors for eGDKA:</h3>
          <ul>
            <li>SGLT2 inhibitors (empagliflozin, dapagliflozin) - increases glycosuria</li>
            <li>Starvation or fasting</li>
            <li>Pregnancy</li>
            <li>Intense exercise</li>
            <li>Recent illness or infection</li>
          </ul>
        `,
        questions: [
          {
            question: "Euglycaemic DKA is suspected when glucose is low but:",
            options: [
              "Ketones and acidosis (pH <7.3) are present",
              "No ketones are ever found",
              "pH is always normal",
              "Only fever is present",
            ],
            correct: 0,
            explanation: "Confirm ketonaemia and acidosis despite glucose <14 mmol/L.",
          },
          {
            question: "A common medication associated with euglycaemic DKA is:",
            options: ["SGLT2 inhibitors", "Paracetamol only", "Salbutamol only", "Iron supplements"],
            correct: 0,
            explanation: "SGLT2 inhibitors increase glycosuria and can precipitate eGDKA.",
          },
          {
            question: "eGDKA accounts for approximately what proportion of DKA cases:",
            options: ["5–10%", "50%", "90%", "Never occurs in children"],
            correct: 0,
            explanation: "eGDKA is 5–10% of cases — often misdiagnosed as gastroenteritis.",
          },
        ],
      },
      {
        title: 'Module 2: Cerebral Edema Management',
        duration: 25,
        content: `
          <h2>Cerebral Edema in DKA</h2>
          <h3>Pathophysiology:</h3>
          <ul>
            <li>Osmotic gradient: hyperglycemia draws fluid intracellularly</li>
            <li>Rapid fluid shifts: aggressive hydration + insulin → intracellular fluid accumulation</li>
            <li>Inflammatory response: cytokines, free radicals</li>
          </ul>
          <h3>Clinical Signs (Early to Late):</h3>
          <ul>
            <li><strong>Early:</strong> Headache, restlessness, irritability</li>
            <li><strong>Progressive:</strong> Altered mental status, confusion, lethargy</li>
            <li><strong>Late:</strong> Seizures, coma, brainstem herniation, death</li>
            <li><strong>Vital sign changes:</strong> Bradycardia, hypertension, irregular respirations</li>
          </ul>
          <h3>Risk Factors for Cerebral Edema:</h3>
          <ul>
            <li>Age <5 years</li>
            <li>New-onset diabetes</li>
            <li>Severe acidosis (pH <7.1)</li>
            <li>Rapid fluid replacement</li>
            <li>Rapid glucose drop (&gt;3–6 mmol/L/hr; &gt;50–100 mg/dL/hr)</li>
          </ul>
          <h3>Prevention Strategy:</h3>
          <ul>
            <li>Slow fluid replacement (avoid rapid shifts)</li>
            <li>Gradual glucose reduction (3–6 mmol/L/hr; ~50–100 mg/dL/hr)</li>
            <li>Avoid hypotonic fluids (use 0.9% NaCl)</li>
            <li>Monitor mental status hourly</li>
          </ul>
          <h3>Treatment of Cerebral Edema:</h3>
          <ul>
            <li><strong>Hypertonic saline (3%):</strong> 0.25-1 g/kg IV bolus over 15-20 min</li>
            <li><strong>Can repeat:</strong> Every 15-30 min if symptoms persist</li>
            <li><strong>Osmotic diuretics:</strong> Mannitol 0.25-1 g/kg IV (if hypertonic saline unavailable)</li>
            <li><strong>Head elevation:</strong> 30° to improve cerebral perfusion</li>
            <li><strong>Intubation:</strong> If coma or unable to protect airway</li>
            <li><strong>Seizure precautions:</strong> Diazepam 0.1 mg/kg IV if seizures occur</li>
          </ul>
        `,
        questions: [
          {
            question: "Hypertonic saline (3%) for cerebral oedema is given as:",
            options: [
              "0.25–1 g/kg IV over 15–20 minutes",
              "Oral bolus",
              "Unlimited repeat without reassessment",
              "Only after discharge",
            ],
            correct: 0,
            explanation: "3% saline 0.25–1 g/kg IV over 15–20 min; may repeat per protocol.",
          },
          {
            question: "A risk factor for cerebral oedema in DKA is age:",
            options: ["Under 5 years", "Over 18 years only", "Any age equally without risk", "Neonates never"],
            correct: 0,
            explanation: "Young age, new-onset diabetes, and rapid fluid/glucose shifts increase risk.",
          },
          {
            question: "Prevention of cerebral oedema includes:",
            options: [
              "Slow fluid replacement and gradual glucose reduction",
              "Rapid correction of entire fluid deficit in 1 hour",
              "Hypotonic fluids first-line",
              "Large insulin IV push on arrival",
            ],
            correct: 0,
            explanation: "Slow fluids and gradual glucose drop (3–6 mmol/L/hr) reduce oedema risk.",
          },
        ],
      },
      {
        title: 'Module 3: Complex Electrolyte Management & ICU Transition',
        duration: 15,
        content: `
          <h2>Advanced Electrolyte Management</h2>
          ${DKA_POTASSIUM_SAFETY}
          <h3>Hypokalemia Management:</h3>
          <ul>
            <li><strong>Severe hypokalemia (K+ &lt;2.5 mmol/L):</strong> Hold insulin; add KCl to IV fluids or infuse replacement slowly (max ~0.5 mEq/kg/hr) — <strong>never IV push</strong></li>
            <li><strong>Moderate (K+ 2.5-3.5):</strong> Hold insulin; add K+ to fluids with cardiac monitoring</li>
            <li><strong>Mild (K+ 3.5-4):</strong> Continue insulin, add K+ to fluids (20 mEq/L)</li>
            <li><strong>Recheck K+:</strong> Every 2-4 hours until stable (target 4-5 mmol/L)</li>
          </ul>
          <h3>Hypernatremia Correction:</h3>
          <ul>
            <li>Correct slowly: max 10 mEq/L/24 hours (risk of cerebral edema if too fast)</li>
            <li>Use hypotonic fluids (0.45% NaCl) once initial resuscitation complete</li>
            <li>Monitor serum sodium every 4-6 hours</li>
          </ul>
          <h3>Phosphate & Magnesium:</h3>
          <ul>
            <li><strong>Phosphate:</strong> Often low; supplement if <2 mg/dL (risk of rhabdomyolysis)</li>
            <li><strong>Magnesium:</strong> Often depleted; supplement if <1.7 mg/dL</li>
            <li>Recheck every 6-12 hours</li>
          </ul>
          <h3>ICU Transition Criteria:</h3>
          <ul>
            <li>Altered mental status or seizures</li>
            <li>Severe acidosis (pH <7.1) despite treatment</li>
            <li>Hemodynamic instability</li>
            <li>Respiratory failure (Kussmaul breathing with fatigue)</li>
            <li>Complications: cerebral edema, rhabdomyolysis, acute kidney injury</li>
          </ul>
          <h3>Long-Term Management (After Acute Phase):</h3>
          <ul>
            <li>Diabetes education and insulin regimen optimization</li>
            <li>Avoid SGLT2 inhibitors during acute illness (if previously used)</li>
            <li>Follow-up with endocrinology</li>
            <li>Psychological support for new-onset diabetes</li>
          </ul>
        `,
        questions: [
          {
            question: "Severe hypokalaemia (K⁺ <2.5 mmol/L) in DKA requires:",
            options: [
              "Hold insulin and replace K⁺ slowly — never IV push",
              "Continue insulin without K⁺ replacement",
              "KCl IV push for speed",
              "Discharge without monitoring",
            ],
            correct: 0,
            explanation: "Hold insulin when K⁺ <2.5; replace via fluids slowly with cardiac monitoring.",
          },
          {
            question: "Hypernatraemia correction in DKA should not exceed:",
            options: ["10 mEq/L per 24 hours", "30 mEq/L per hour", "No limit", "Never correct"],
            correct: 0,
            explanation: "Correct sodium slowly — max 10 mEq/L/24 h to avoid cerebral oedema.",
          },
          {
            question: "ICU transfer is indicated in DKA when:",
            options: [
              "Altered mental status, seizures, or pH <7.1 despite treatment",
              "Mild hyperglycaemia only",
              "Normal GCS always",
              "First presentation of diabetes only",
            ],
            correct: 0,
            explanation: "Escalate for neurological compromise, refractory acidosis, or haemodynamic instability.",
          },
        ],
      },
    ],
    quiz: {
      title: 'DKA II Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Euglycemic DKA (eGDKA) is characterized by:',
          options: ['Glucose >250 only', 'Glucose <250 + acidosis + positive ketones', 'Fever only', 'Seizures only'],
          correct: 1,
          explanation: 'eGDKA = glucose <250 (often <200) + metabolic acidosis + ketonemia. Diagnostic challenge due to normal glucose.'
        },
        {
          question: 'Risk factor for euglycemic DKA:',
          options: ['Hyperglycemia', 'SGLT2 inhibitor use', 'High carbohydrate intake', 'Obesity'],
          correct: 1,
          explanation: 'SGLT2 inhibitors increase glycosuria → euglycemic DKA risk. Starvation, pregnancy, intense exercise also risk factors.'
        },
        {
          question: 'Cerebral edema in DKA is MOST common in:',
          options: ['Adults', 'Children <5 years with new-onset diabetes', 'Mild DKA', 'Chronic diabetes'],
          correct: 1,
          explanation: 'Cerebral edema risk: age <5, new-onset diabetes, severe acidosis, rapid fluid shifts.'
        },
        {
          question: 'Hypertonic saline dose for cerebral edema in a 30 kg child:',
          options: ['3 mL', '30 mL', '300 mL', '900 mL'],
          correct: 2,
          explanation: '0.25-1 g/kg of 3% saline = 0.25-1 × 30 = 7.5-30 g = 250-1000 mL of 3% solution. Use 0.25 g/kg initially (250 mL).'
        },
        {
          question: 'When severe hypokalemia (K+ <2.5 mmol/L) occurs in DKA:',
          options: ['Continue insulin', 'Hold insulin; replace K+ in IV fluids — never KCl IV push', 'Give glucose only', 'Discharge home'],
          correct: 1,
          explanation: 'Hold insulin. Replace K+ by adding to IV fluids or slow infusion (max ~0.5 mEq/kg/hr) — never IV bolus/push (fatal arrhythmia risk).'
        },
        {
          question: 'Maximum rate of sodium correction in hypernatremic DKA:',
          options: ['5 mEq/L/hr', '10 mEq/L/24 hours', '20 mEq/L/24 hours', '50 mEq/L/24 hours'],
          correct: 1,
          explanation: 'Correct hypernatremia slowly: max 10 mEq/L/24 hours. Rapid correction risks cerebral edema.'
        },
        {
          question: 'Early sign of cerebral edema in DKA:',
          options: ['Hypotension', 'Headache and restlessness', 'Hypoglycemia', 'Fever'],
          correct: 1,
          explanation: 'Early signs: headache, restlessness, irritability. Late signs: altered mental status, seizures, coma.'
        },
        {
          question: 'Osmotic diuretic used if hypertonic saline unavailable:',
          options: ['Furosemide', 'Mannitol', 'Spironolactone', 'Acetazolamide'],
          correct: 1,
          explanation: 'Mannitol 0.25-1 g/kg IV alternative if hypertonic saline unavailable for cerebral edema.'
        },
        {
          question: 'Phosphate supplementation in DKA is indicated when:',
          options: ['Always', 'Phosphate <2 mg/dL (risk of rhabdomyolysis)', 'Never', 'Only with fever'],
          correct: 1,
          explanation: 'Supplement phosphate if <2 mg/dL to prevent rhabdomyolysis and respiratory muscle weakness.'
        },
        {
          question: 'SGLT2 inhibitors should be AVOIDED in DKA because:',
          options: ['They cause hyperglycemia', 'They increase glycosuria → euglycemic DKA risk', 'They cause hypoglycemia', 'They are ineffective'],
          correct: 1,
          explanation: 'SGLT2 inhibitors increase glycosuria and euglycemic DKA risk. Avoid during acute illness.'
        },
        { question: 'Mannitol for cerebral oedema in DKA is given at:', options: ['0.25–1 g/kg IV if 3% saline unavailable', 'Oral dose only', 'Unlimited repeat without monitoring', 'Same as high-dose insulin IV push'], correct: 0, explanation: 'Mannitol is alternative osmotic therapy when hypertonic saline not available.' },
        { question: 'Phosphate supplementation is considered when level is:', options: ['<2 mg/dL', '>10 mg/dL always', 'Never in DKA', 'Only in adults'], correct: 0, explanation: 'Low phosphate risks weakness and rhabdomyolysis — supplement per protocol.' },
        { question: 'Magnesium repletion in DKA is indicated when Mg is:', options: ['<1.7 mg/dL', '>5 mg/dL', 'Not measured', 'Always normal'], correct: 0, explanation: 'Magnesium often depleted in DKA — replete when low.' },
        { question: 'Bradycardia and hypertension in DKA may warn of:', options: ['Cerebral oedema (late sign)', 'Mild dehydration only', 'Ready for discharge', 'Hypoglycaemia always'], correct: 0, explanation: 'Cushing triad components suggest raised ICP — act urgently.' },
        { question: 'Starvation is a risk factor for eGDKA because:', options: ['It reduces hepatic gluconeogenesis while ketosis persists', 'It increases insulin secretion only', 'It prevents ketones', 'It raises glucose always'], correct: 0, explanation: 'Starvation + ketosis can produce euglycaemic DKA picture.' }
      ]
    }
  },

  {
    id: 'severe-pneumonia-ards-i',
    title: 'Paediatric Severe Pneumonia & ARDS I: Recognition and Initial Management',
    level: 'foundational',
    duration: 45,
    price: 800,
    description: 'Recognize severe pneumonia and ARDS, initiate oxygen therapy and antibiotics in low-resource settings.',
    modules: [
      {
        title: 'Module 1: Severe Pneumonia & ARDS Recognition',
        duration: 15,
        content: `
          <h2>Severe Pneumonia & ARDS Recognition</h2>
          <h3>Pneumonia Severity Classification (WHO):</h3>
          <ul>
            <li><strong>Mild:</strong> Cough + fast breathing (age-specific RR), no chest indrawing</li>
            <li><strong>Severe:</strong> Cough + chest indrawing OR stridor at rest</li>
            <li><strong>Very Severe:</strong> Severe pneumonia + danger signs (lethargy, inability to drink, severe malnutrition)</li>
          </ul>
          <h3>Danger Signs (Immediate Escalation):</h3>
          <ul>
            <li>Lethargy or altered mental status</li>
            <li>Stridor at rest</li>
            <li>Severe respiratory distress (nasal flaring, grunting)</li>
            <li>Inability to drink or maintain airway</li>
            <li>Cyanosis</li>
            <li>Severe malnutrition</li>
          </ul>
          <h3>ARDS Definition (Berlin Criteria):</h3>
          <ul>
            <li>Acute onset (within 1 week)</li>
            <li>Bilateral infiltrates on imaging (CXR, ultrasound)</li>
            <li>Respiratory failure not fully explained by cardiac failure or fluid overload</li>
            <li>PaO2/FiO2 ratio:</li>
            <li>Mild: 200-300</li>
            <li>Moderate: 100-200</li>
            <li>Severe: <100</li>
          </ul>
          <h3>Common Pathogens:</h3>
          <ul>
            <li><strong>Bacterial:</strong> Streptococcus pneumoniae, Haemophilus influenzae, Staphylococcus aureus</li>
            <li><strong>Viral:</strong> RSV, influenza, parainfluenza, rhinovirus</li>
            <li><strong>Atypical:</strong> Mycoplasma, Chlamydia</li>
          </ul>
        `,
        questions: [
          {
            question: "WHO severe pneumonia includes cough with:",
            options: [
              "Chest indrawing OR stridor at rest",
              "Only mild fever",
              "Normal breathing rate only",
              "No respiratory signs",
            ],
            correct: 0,
            explanation: "Severe pneumonia = cough + chest indrawing or stridor at rest (WHO).",
          },
          {
            question: "Very severe pneumonia adds danger signs such as:",
            options: [
              "Lethargy or inability to drink",
              "Mild cough only",
              "Normal mental status always",
              "Isolated rash",
            ],
            correct: 0,
            explanation: "Very severe = severe pneumonia plus danger signs (lethargy, cannot drink, malnutrition).",
          },
          {
            question: "ARDS Berlin criteria require bilateral infiltrates and:",
            options: [
              "Respiratory failure not fully explained by cardiac failure alone",
              "Only unilateral CXR changes",
              "Chronic lung disease only",
              "Normal oxygenation",
            ],
            correct: 0,
            explanation: "ARDS = acute bilateral infiltrates + hypoxaemia not explained by heart failure/fluid overload.",
          },
        ],
      },
      {
        title: 'Module 2: First-Hour Stabilization',
        duration: 20,
        content: `
          ${PNEUMONIA_WHO_KENYA}
          <h2>Severe Pneumonia First-Hour Protocol</h2>
          <h3>Oxygen Therapy:</h3>
          <ul>
            <li><strong>Target SpO2:</strong> >90% (>94% if ARDS)</li>
            <li><strong>Oxygen delivery:</strong></li>
            <li>Nasal cannula: 1-2 L/min (SpO2 up to 90%)</li>
            <li>Face mask: 5-8 L/min (SpO2 up to 95%)</li>
            <li>Non-rebreather: 10-15 L/min (SpO2 up to 98%)</li>
            <li><strong>Continuous pulse oximetry monitoring</strong></li>
          </ul>
          <h3>Airway Management:</h3>
          <ul>
            <li>Position: Upright or semi-upright (improves oxygenation)</li>
            <li>Assess airway patency (stridor, grunting)</li>
            <li>Prepare for intubation if respiratory failure (SpO2 <90% on high-flow O2, altered mental status)</li>
          </ul>
          <h3>Antibiotic Therapy (Empiric):</h3>
          <ul>
            <li><strong>Severe pneumonia (first-line):</strong></li>
            <li>Ceftriaxone 50-80 mg/kg/day IV (max 2g/day) + Azithromycin 10 mg/kg/day</li>
            <li>OR Amoxicillin-clavulanate 45 mg/kg/day IV (if cephalosporin unavailable)</li>
            <li><strong>If MRSA suspected:</strong> Add vancomycin 15-20 mg/kg/dose Q6-8H IV</li>
            <li><strong>Start within 1 hour of diagnosis</strong></li>
          </ul>
          <h3>Supportive Care:</h3>
          <ul>
            <li>IV fluids: 10 mL/kg bolus if hypotensive, then maintenance</li>
            <li>Fever management: Paracetamol 15 mg/kg Q4-6H (max 60 mg/kg/day)</li>
            <li>Nutritional support: Continue feeding if tolerating PO</li>
          </ul>
        `,
        questions: [
          {
            question: "Patient positioning for severe pneumonia should favour:",
            options: [
              "Upright or semi-upright to improve oxygenation",
              "Flat supine always",
              "Prone without monitoring",
              "Trendelenburg",
            ],
            correct: 0,
            explanation: "Upright positioning improves ventilation and oxygenation in respiratory failure.",
          },
          {
            question: "Empiric antibiotics for severe pneumonia should start within:",
            options: ["1 hour of diagnosis", "48 hours", "After all cultures return", "Only if MRSA confirmed"],
            correct: 0,
            explanation: "Start ceftriaxone ± azithromycin within 1 hour when severe pneumonia diagnosed.",
          },
          {
            question: "Continuous pulse oximetry in severe pneumonia is important to:",
            options: [
              "Titrate oxygen to maintain target SpO₂",
              "Replace clinical assessment entirely",
              "Diagnose meningitis",
              "Measure glucose only",
            ],
            correct: 0,
            explanation: "Monitor SpO₂ continuously — target >90% (>94% if ARDS).",
          },
        ],
      },
      {
        title: 'Module 3: Monitoring & Escalation Criteria',
        duration: 10,
        content: `
          <h2>Ongoing Monitoring & ICU Criteria</h2>
          <h3>Monitoring Parameters (First 24 hours):</h3>
          <ul>
            <li>Vital signs: HR, BP, RR, SpO2 every 1-2 hours</li>
            <li>Respiratory effort: assess for increased work of breathing</li>
            <li>Oxygen requirements: track FiO2 needed to maintain SpO2</li>
            <li>Fluid balance: input/output, urine output >1 mL/kg/hr</li>
            <li>Mental status: alert, lethargy, coma</li>
          </ul>
          <h3>ICU Escalation Criteria:</h3>
          <ul>
            <li>SpO2 <90% despite high-flow oxygen (FiO2 >0.6)</li>
            <li>Respiratory failure: RR >60 (age <2 months), >50 (2-12 months), >40 (1-5 years)</li>
            <li>Altered mental status or inability to protect airway</li>
            <li>Hemodynamic instability (hypotension, shock)</li>
            <li>Signs of ARDS: bilateral infiltrates + PaO2/FiO2 <300</li>
          </ul>
          <h3>Intubation Indications:</h3>
          <ul>
            <li>Respiratory failure (SpO2 <90% on FiO2 >0.6)</li>
            <li>Altered mental status (GCS <8)</li>
            <li>Inability to protect airway</li>
            <li>Severe respiratory distress with fatigue</li>
          </ul>
          <h3>Ventilation Strategy (If Intubated):</h3>
          <ul>
            <li>Lung-protective ventilation: Tidal volume 6-8 mL/kg, PEEP 5-10 cm H2O</li>
            <li>Target SpO2 88-95%, PaCO2 35-45 mmHg</li>
            <li>Avoid barotrauma: limit plateau pressure <30 cm H2O</li>
          </ul>
        `,
        questions: [
          {
            question: "ICU escalation for pneumonia is indicated when SpO₂ remains:",
            options: [
              "<90% despite high-flow oxygen (FiO₂ >0.6)",
              ">98% on room air",
              "Stable on nasal cannula only always",
              "Unmeasured",
            ],
            correct: 0,
            explanation: "Refractory hypoxaemia despite high FiO₂ warrants ICU-level care.",
          },
          {
            question: "Target urine output monitoring in severe pneumonia is:",
            options: [">1 mL/kg/hr", "<0.1 mL/kg/hr", "No urine output needed", "Only at discharge"],
            correct: 0,
            explanation: "Track fluid balance — oliguria suggests shock or dehydration.",
          },
          {
            question: "Lung-protective ventilation limits plateau pressure to:",
            options: ["<30 cm H₂O", ">50 cm H₂O", "No limit", "Only PEEP without tidal volume control"],
            correct: 0,
            explanation: "6–8 mL/kg tidal volume with plateau pressure <30 cm H₂O reduces barotrauma.",
          },
        ],
      },
    ],
    quiz: {
      title: 'Severe Pneumonia & ARDS I Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Severe pneumonia (WHO) is characterized by:',
          options: ['Cough only', 'Cough + chest indrawing OR stridor at rest', 'Fever only', 'Vomiting only'],
          correct: 1,
          explanation: 'Severe pneumonia = cough + chest indrawing OR stridor at rest (WHO classification).'
        },
        {
          question: 'Target SpO2 in severe pneumonia:',
          options: ['>85%', '>90%', '>95%', '>98%'],
          correct: 1,
          explanation: '>90% target for severe pneumonia; >94% if ARDS.'
        },
        {
          question: 'First-line antibiotic for severe pneumonia:',
          options: ['Amoxicillin only', 'Ceftriaxone + Azithromycin', 'Metronidazole', 'Fluconazole'],
          correct: 1,
          explanation: 'Ceftriaxone 50-80 mg/kg/day IV + Azithromycin 10 mg/kg/day (covers bacterial + atypical pathogens).'
        },
        {
          question: 'ARDS is defined by:',
          options: ['Fever only', 'Acute onset + bilateral infiltrates + respiratory failure + PaO2/FiO2 ratio', 'Cough only', 'Elevated WBC'],
          correct: 1,
          explanation: 'ARDS = acute onset + bilateral infiltrates + respiratory failure not from cardiac cause + PaO2/FiO2 <300.'
        },
        {
          question: 'Danger sign in severe pneumonia requiring immediate escalation:',
          options: ['Mild cough', 'Lethargy or altered mental status', 'Mild fever', 'Mild cough'],
          correct: 1,
          explanation: 'Danger signs: lethargy, stridor at rest, severe respiratory distress, inability to drink, cyanosis.'
        },
        {
          question: 'Oxygen delivery for SpO2 >95% in severe pneumonia:',
          options: ['Nasal cannula 1 L/min', 'Face mask 5-8 L/min', 'Non-rebreather 10-15 L/min', 'Room air'],
          correct: 2,
          explanation: 'Non-rebreather 10-15 L/min achieves SpO2 up to 98%.'
        },
        {
          question: 'Intubation indication in severe pneumonia:',
          options: ['SpO2 >90%', 'SpO2 <90% on FiO2 >0.6 OR altered mental status', 'Mild cough', 'Normal vital signs'],
          correct: 1,
          explanation: 'Intubate if SpO2 <90% on high-flow O2, altered mental status, or inability to protect airway.'
        },
        {
          question: 'Tidal volume for lung-protective ventilation in ARDS:',
          options: ['10-12 mL/kg', '6-8 mL/kg', '15-20 mL/kg', '2-4 mL/kg'],
          correct: 1,
          explanation: 'Lung-protective ventilation: 6-8 mL/kg tidal volume, PEEP 5-10 cm H2O.'
        },
        {
          question: 'MRSA coverage added if:',
          options: ['Always', 'MRSA suspected (risk factors)', 'Never', 'Only with fever'],
          correct: 1,
          explanation: 'Add vancomycin 15-20 mg/kg/dose Q6-8H IV if MRSA suspected.'
        },
        {
          question: 'Mild ARDS PaO2/FiO2 ratio:',
          options: ['<100', '100-200', '200-300', '>300'],
          correct: 2,
          explanation: 'Mild ARDS: PaO2/FiO2 200-300. Moderate: 100-200. Severe: <100.'
        }
      ]
    }
  },

  {
    id: 'severe-pneumonia-ards-ii',
    title: 'Paediatric Severe Pneumonia & ARDS II: Ventilator Management and Complications',
    level: 'advanced',
    duration: 60,
    price: 1200,
    prerequisite: 'severe-pneumonia-ards-i',
    description: 'Advanced ventilator strategies for ARDS, manage complications, and optimize oxygenation.',
    modules: [
      {
        title: 'Module 1: Advanced Ventilator Strategies for ARDS',
        duration: 20,
        content: `
          <h2>ARDS Ventilation Management</h2>
          <h3>Initial Ventilator Settings:</h3>
          <ul>
            <li><strong>Mode:</strong> Volume-controlled or pressure-controlled ventilation</li>
            <li><strong>Tidal volume:</strong> 6-8 mL/kg (based on predicted body weight)</li>
            <li><strong>Rate:</strong> Age-appropriate (12-20 breaths/min for school-age)</li>
            <li><strong>PEEP:</strong> 5-10 cm H2O (higher in moderate-severe ARDS)</li>
            <li><strong>FiO2:</strong> Start 0.6-0.8, titrate to SpO2 88-95%</li>
            <li><strong>I:E ratio:</strong> 1:2 to 1:3 (allow adequate exhalation)</li>
          </ul>
          <h3>Titration Strategy:</h3>
          <ul>
            <li><strong>SpO2 <88%:</strong> Increase PEEP first (2-3 cm H2O), then FiO2</li>
            <li><strong>SpO2 >95%:</strong> Decrease FiO2 first, then PEEP</li>
            <li><strong>Plateau pressure:</strong> Keep <30 cm H2O (avoid barotrauma)</li>
            <li><strong>Monitor:</strong> ABG every 4-6 hours initially, then daily</li>
          </ul>
          <h3>Advanced Oxygenation Strategies:</h3>
          <ul>
            <li><strong>Recruitment maneuvers:</strong> Sustained inflation (30 cm H2O × 30 sec) to open collapsed alveoli</li>
            <li><strong>Prone positioning:</strong> 16 hours/day if moderate-severe ARDS (improves V/Q matching)</li>
            <li><strong>Inhaled nitric oxide (iNO):</strong> 10-20 ppm if severe ARDS + pulmonary hypertension</li>
            <li><strong>ECMO:</strong> Consider if refractory hypoxemia (PaO2/FiO2 <100 despite maximal support)</li>
          </ul>
          <h3>Weaning Criteria:</h3>
          <ul>
            <li>Improving oxygenation (FiO2 <0.4, PEEP <5)</li>
            <li>Improving lung mechanics (compliance increasing)</li>
            <li>Resolving underlying infection</li>
            <li>Hemodynamically stable</li>
            <li>Adequate respiratory drive</li>
          </ul>
        `,
        questions: [
          {
            question: "When SpO₂ is below 88% in ventilated ARDS, first titration step is:",
            options: ["Increase PEEP by 2–3 cm H₂O before raising FiO₂", "Decrease PEEP to zero", "Stop ventilation", "Only increase tidal volume to 15 mL/kg"],
            correct: 0,
            explanation: "Increase PEEP first, then FiO₂ — lung-protective strategy.",
          },
          {
            question: "Prone positioning in moderate-severe ARDS is recommended for:",
            options: ["Up to 16 hours per day when feasible", "Never in children", "5 minutes only", "Only after extubation"],
            correct: 0,
            explanation: "Prone positioning improves V/Q matching in moderate-severe ARDS.",
          },
          {
            question: "Weaning from ventilator may begin when FiO₂ is below:",
            options: ["0.4 with PEEP <5", "1.0 always", "0.9 with zero PEEP required", "Never wean in ARDS"],
            correct: 0,
            explanation: "Improving oxygenation and lung mechanics allow gradual weaning.",
          },
        ],
      },
      {
        title: 'Module 2: ARDS Complications & Management',
        duration: 25,
        content: `
          <h2>ARDS Complications</h2>
          <h3>Barotrauma (Ventilator-Induced Lung Injury):</h3>
          <ul>
            <li><strong>Mechanism:</strong> Excessive tidal volumes or pressures cause alveolar rupture</li>
            <li><strong>Manifestation:</strong> Pneumothorax, pneumomediastinum, subcutaneous emphysema</li>
            <li><strong>Prevention:</strong> Lung-protective ventilation (6-8 mL/kg, plateau <30 cm H2O)</li>
            <li><strong>Treatment:</strong> Reduce tidal volume, increase PEEP, consider chest tube if pneumothorax</li>
          </ul>
          <h3>Ventilator-Associated Pneumonia (VAP):</h3>
          <ul>
            <li><strong>Risk factors:</strong> Prolonged intubation, supine position, gastric reflux</li>
            <li><strong>Prevention:</strong> Oral hygiene, head elevation 30°, subglottic suctioning</li>
            <li><strong>Diagnosis:</strong> New infiltrate + fever + purulent secretions</li>
            <li><strong>Treatment:</strong> Broad-spectrum antibiotics (ceftriaxone + fluoroquinolone or aminoglycoside)</li>
          </ul>
          <h3>Acute Kidney Injury (AKI):</h3>
          <ul>
            <li><strong>Mechanism:</strong> Hypoxemia, hypotension, sepsis</li>
            <li><strong>Monitoring:</strong> Creatinine, BUN, urine output</li>
            <li><strong>Management:</strong> Optimize perfusion, avoid nephrotoxic drugs (aminoglycosides if possible)</li>
            <li><strong>Dialysis:</strong> Consider if K+ >6.5, severe acidosis, or fluid overload</li>
          </ul>
          <h3>Sepsis & Multi-Organ Failure:</h3>
          <ul>
            <li><strong>Recognition:</strong> Fever, tachycardia, elevated lactate, hypotension</li>
            <li><strong>Management:</strong> Broad-spectrum antibiotics, fluid resuscitation, vasopressors if needed</li>
            <li><strong>Lactate monitoring:</strong> Target <2 mmol/L</li>
          </ul>
          <h3>Pulmonary Fibrosis (Late Complication):</h3>
          <ul>
            <li>Occurs in 10-20% of ARDS survivors</li>
            <li>Risk factors: Prolonged ARDS, high FiO2 exposure, barotrauma</li>
            <li>Management: Minimize ventilator-induced injury, consider corticosteroids in late phase</li>
          </ul>
        `,
        questions: [
          {
            question: "Ventilator-associated pneumonia prevention includes:",
            options: ["Head elevation 30° and oral hygiene", "Supine flat positioning always", "No suctioning", "Early extubation without assessment"],
            correct: 0,
            explanation: "VAP bundle: head up, oral care, subglottic suction when available.",
          },
          {
            question: "Barotrauma in ARDS manifests as:",
            options: ["Pneumothorax or subcutaneous emphysema", "Only fever", "Normal CXR always", "Improved compliance only"],
            correct: 0,
            explanation: "Excessive pressures cause alveolar rupture — reduce tidal volume and optimise PEEP.",
          },
          {
            question: "AKI complicating ARDS requires:",
            options: ["Avoidance of nephrotoxins and perfusion optimisation", "Large aminoglycoside doses always", "No urine monitoring", "Immediate discharge"],
            correct: 0,
            explanation: "Optimise MAP, avoid nephrotoxins, consider RRT if indicated.",
          },
        ],
      },
      {
        title: 'Module 3: Extracorporeal Support & Long-Term Outcomes',
        duration: 15,
        content: `
          <h2>Refractory ARDS & ECMO</h2>
          <h3>When to Consider ECMO:</h3>
          <ul>
            <li>Refractory hypoxemia: PaO2/FiO2 <100 despite maximal ventilator support</li>
            <li>Severe hypercapnia: PaCO2 >80 mmHg with pH <7.15</li>
            <li>Hemodynamic instability despite vasopressors</li>
            <li>Barotrauma (pneumothorax) despite lung-protective ventilation</li>
          </ul>
          <h3>ECMO Basics:</h3>
          <ul>
            <li><strong>VV-ECMO:</strong> Veno-venous (for respiratory failure only)</li>
            <li><strong>VA-ECMO:</strong> Veno-arterial (for respiratory + cardiac failure)</li>
            <li><strong>Cannulation:</strong> Usually femoral vessels (percutaneous or surgical)</li>
            <li><strong>Anticoagulation:</strong> Heparin to prevent thrombosis</li>
            <li><strong>Complications:</strong> Bleeding, infection, thrombosis, limb ischemia</li>
          </ul>
          <h3>Long-Term Outcomes of ARDS:</h3>
          <ul>
            <li><strong>Mortality:</strong> 20-40% in pediatric ARDS (higher in severe)</li>
            <li><strong>Survivors:</strong> 30-50% have long-term pulmonary sequelae</li>
            <li><strong>Cognitive impairment:</strong> From prolonged hypoxemia or ICU delirium</li>
            <li><strong>Follow-up:</strong> Pulmonary function testing at 3-6 months, psychological evaluation</li>
          </ul>
          <h3>Discharge Planning:</h3>
          <ul>
            <li>Gradual weaning from oxygen (home oxygen if SpO2 <92% on room air)</li>
            <li>Pulmonary rehabilitation (breathing exercises, activity progression)</li>
            <li>Family support and counseling</li>
            <li>Follow-up with pulmonology at 2-4 weeks post-discharge</li>
          </ul>
        `,
        questions: [
          {
            question: "ECMO for refractory ARDS may be considered when PaO₂/FiO₂ is:",
            options: ["<100 despite maximal ventilator support", ">400", "Not measured", "Only in mild disease"],
            correct: 0,
            explanation: "Refractory hypoxaemia despite lung-protective ventilation — ECMO when available.",
          },
          {
            question: "VV-ECMO is used for:",
            options: ["Respiratory failure without primary cardiac failure", "Isolated arrhythmia only", "Mild cough", "Always VA configuration"],
            correct: 0,
            explanation: "Veno-venous ECMO supports gas exchange in isolated respiratory failure.",
          },
          {
            question: "Paediatric ARDS survivors may need follow-up for:",
            options: ["Pulmonary function testing at 3–6 months", "No follow-up ever", "Only dental care", "Immediate return to contact sport without assessment"],
            correct: 0,
            explanation: "30–50% may have long-term pulmonary sequelae — schedule pulmonary follow-up.",
          },
        ],
      },
    ],
    quiz: {
      title: 'Severe Pneumonia & ARDS II Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Lung-protective tidal volume in ARDS:',
          options: ['10-12 mL/kg', '6-8 mL/kg', '15-20 mL/kg', '2-4 mL/kg'],
          correct: 1,
          explanation: '6-8 mL/kg based on predicted body weight. Prevents barotrauma.'
        },
        {
          question: 'Plateau pressure limit in ARDS ventilation:',
          options: ['<20 cm H2O', '<30 cm H2O', '<40 cm H2O', '<50 cm H2O'],
          correct: 1,
          explanation: 'Keep plateau pressure <30 cm H2O to avoid barotrauma.'
        },
        {
          question: 'Recruitment maneuver in ARDS:',
          options: ['Increase sedation', 'Sustained inflation (30 cm H2O × 30 sec)', 'Decrease PEEP', 'Increase tidal volume'],
          correct: 1,
          explanation: 'Sustained inflation opens collapsed alveoli, improves oxygenation.'
        },
        {
          question: 'Prone positioning in ARDS improves:',
          options: ['Sedation', 'V/Q matching (ventilation-perfusion)', 'Infection', 'Bleeding'],
          correct: 1,
          explanation: 'Prone positioning 16 hours/day improves V/Q matching in moderate-severe ARDS.'
        },
        {
          question: 'Barotrauma in ARDS manifests as:',
          options: ['Fever', 'Pneumothorax or pneumomediastinum', 'Hypoglycemia', 'Infection'],
          correct: 1,
          explanation: 'Barotrauma = alveolar rupture → pneumothorax, pneumomediastinum, subcutaneous emphysema.'
        },
        {
          question: 'VAP (Ventilator-Associated Pneumonia) prevention:',
          options: ['No prevention possible', 'Oral hygiene + head elevation 30° + subglottic suctioning', 'Antibiotics only', 'Sedation only'],
          correct: 1,
          explanation: 'VAP prevention: oral hygiene, head elevation 30°, subglottic suctioning, minimize sedation.'
        },
        {
          question: 'ECMO indication in ARDS:',
          options: ['All ARDS cases', 'Refractory hypoxemia (PaO2/FiO2 <100) despite maximal support', 'Mild ARDS', 'Never'],
          correct: 1,
          explanation: 'ECMO for refractory hypoxemia (PaO2/FiO2 <100), severe hypercapnia, or hemodynamic instability.'
        },
        {
          question: 'VV-ECMO is used for:',
          options: ['Cardiac failure only', 'Respiratory failure only', 'Both respiratory and cardiac failure', 'Sepsis only'],
          correct: 1,
          explanation: 'VV-ECMO (veno-venous) for respiratory failure. VA-ECMO for respiratory + cardiac failure.'
        },
        {
          question: 'Mortality in pediatric ARDS:',
          options: ['<5%', '5-10%', '20-40%', '>50%'],
          correct: 2,
          explanation: 'Pediatric ARDS mortality 20-40% (higher in severe ARDS).'
        },
        {
          question: 'Long-term pulmonary sequelae in ARDS survivors:',
          options: ['Rare', '10-20%', '30-50%', '>70%'],
          correct: 2,
          explanation: '30-50% of ARDS survivors have long-term pulmonary dysfunction (restrictive or obstructive patterns).'
        }
      ]
    }
  }
];

export default microCoursesBatch1To5;
