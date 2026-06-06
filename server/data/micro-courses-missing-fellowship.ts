/**
 * Micro-Courses Data: Missing Fellowship Courses (Asthma I, Status Epilepticus I, Meningitis I & II, Trauma I & II)
 * Clinical content aligned with CLINICAL_CONTENT_GOVERNANCE + CLINICAL_SOURCE_OF_TRUTH.
 */

import {
  ASTHMA_LMIC_SPACER,
  ASTHMA_SEVERITY_TABLE,
  ASTHMA_STEROIDS,
  BURNS_FLUID_ESCHAR,
  BURNS_INFECTION,
  CARDIOGENIC_INOTROPES,
  MENINGITIS_ABX_EARLY,
  MENINGITIS_ICU,
  MENINGITIS_SEIZURES,
  MENINGITIS_SIADH,
  NEONATE_CALLOUT,
  SE_BENZO_CONFLICT,
  SPO2_TARGET_NOTE,
  TRAUMA_ABCDE,
  TRAUMA_HEAD_INJURY,
  TRAUMA_HEMORRHAGE,
} from './clinical-content-helpers';
import { buildInternationalModuleHtml } from './micro-course-module-template';

export const microCoursesMissingFellowship = [
  {
    id: 'asthma-i',
    title: 'Paediatric Asthma 1: Recognition, 1st & 2nd Line',
    level: 'beginner',
    duration: 50,
    price: 800,
    description: 'Recognize acute asthma severity, deliver first-hour bronchodilator therapy, and escalate safely when failing.',
    modules: [
      {
        title: 'Module 1: Asthma Severity Assessment',
        duration: 15,
        content: `
          <h2>Acute Asthma Recognition</h2>
          ${buildInternationalModuleHtml({
            overview:
              "Acute asthma is lower-airway obstruction from bronchospasm and inflammation. Your first task is to classify severity at the bedside — this drives every treatment decision in the next hour.",
            objectives: [
              "Recognise core features of acute asthma (wheeze, cough, increased work of breathing)",
              "Classify severity as mild, moderate, severe, or life-threatening",
              "Identify red flags that require immediate escalation to Asthma II",
            ],
            sections: [
              {
                heading: "Clinical features",
                bodyHtml: `<ul>
            <li><strong>Wheeze</strong> — expiratory, localises obstruction to bronchi</li>
            <li><strong>Cough</strong> and chest tightness from bronchospasm</li>
            <li><strong>Increased work of breathing</strong> — recessions, nasal flaring, prolonged expiration</li>
            <li><strong>Speech pattern</strong> — sentences (mild) → phrases (moderate) → words (severe)</li>
          </ul>`,
              },
              {
                heading: "Severity classification",
                bodyHtml: ASTHMA_SEVERITY_TABLE,
              },
              {
                heading: "Life-threatening red flags",
                bodyHtml: `<div class="clinical-note border-l-4 border-rose-500 pl-3 my-3"><ul>
            <li><strong>Silent chest</strong> — no air entry despite effort (impending respiratory failure)</li>
            <li><strong>Exhaustion</strong>, drowsiness, or agitation with hypoxia</li>
            <li><strong>Cyanosis</strong> despite oxygen</li>
            <li><strong>Hypotension</strong> — think anaphylaxis mimic or impending arrest</li>
          </ul></div>`,
              },
            ],
            keyTakeaway:
              "<p>Severity is a <strong>bundle</strong> of speech, work of breathing, and SpO₂ — not wheeze alone. A quiet chest with exhaustion is more dangerous than loud wheeze.</p>",
            bedsideActions: [
              "Listen for wheeze quality and air entry bilaterally",
              "Note speech pattern and accessory muscle use",
              "Attach SpO₂ probe; record baseline",
              "If life-threatening features → call senior and prepare Asthma II pathway",
            ],
          })}
        `,
        questions: [
          {
            question: "Moderate acute asthma is characterised by:",
            options: [
              "Speaking in phrases with SpO₂ 90–94%",
              "Speaking in full sentences with SpO₂ >98%",
              "Silent chest",
              "No accessory muscle use",
            ],
            correct: 0,
            explanation: "Moderate asthma: phrases, SpO₂ 90–94%, accessory muscle use.",
          },
          {
            question: "Clinical features of acute asthma include:",
            options: [
              "Wheezing, cough, and increased work of breathing",
              "Only fever",
              "Bradycardia as first sign",
              "No respiratory symptoms",
            ],
            correct: 0,
            explanation: "Wheeze, cough, chest tightness, and increased work of breathing are core features.",
          },
          {
            question: "Mild acute asthma allows the child to:",
            options: [
              "Speak in full sentences with SpO₂ >94%",
              "Speak only single words",
              "Have silent chest",
              "Be unresponsive",
            ],
            correct: 0,
            explanation: "Mild: sentences, SpO₂ >94%, mild wheeze.",
          },
        ],
      },
      {
        title: 'Module 2: First-Hour Management',
        duration: 20,
        content: `
          <h2>First-Hour Protocol</h2>
          ${buildInternationalModuleHtml({
            overview:
              "First-line treatment for acute asthma is inhaled bronchodilator plus early systemic steroid. Oxygen treats hypoxia — it does not replace salbutamol.",
            objectives: [
              "Administer salbutamol and ipratropium per severity in the first hour",
              "Titrate oxygen toward SpO₂ 94–98% without routine hyperoxia",
              "Give early systemic steroid (dexamethasone, prednisolone, or hydrocortisone)",
              "Reassess after each treatment cycle and escalate when failing",
            ],
            sections: [
              {
                heading: "Oxygen",
                bodyHtml: `${SPO2_TARGET_NOTE}<p>In life-threatening asthma, accept briefly higher targets while continuing bronchodilators — reassess every 15 minutes.</p>`,
              },
              {
                heading: "Bronchodilators (first hour)",
                bodyHtml: `<ul>
            <li><strong>Salbutamol:</strong> 2.5–5 mg nebulised OR <strong>6–10 puffs via spacer</strong> every 20 minutes</li>
            <li><strong>Ipratropium bromide:</strong> 250–500 mcg nebulised every 20 minutes in <strong>moderate/severe</strong> first hour</li>
          </ul>
          ${ASTHMA_LMIC_SPACER}`,
              },
              {
                heading: "Systemic steroids — give early",
                bodyHtml: ASTHMA_STEROIDS,
              },
              {
                heading: "When to escalate",
                bodyHtml: `<p>Escalate to <strong>Asthma II / status asthmaticus</strong> when SpO₂ &lt;90%, silent chest, altered consciousness, or no improvement after two salbutamol cycles.</p>`,
              },
            ],
            keyTakeaway:
              "<p><strong>Salbutamol + steroid early</strong> reduces admission and relapse. Reassess work of breathing and SpO₂ after <em>every</em> treatment — do not discharge on first improvement alone.</p>",
            bedsideActions: [
              "Salbutamol neb or spacer 6–10 puffs; repeat every 20 min if moderate/severe",
              "Add ipratropium 250–500 mcg if moderate/severe",
              "Give dexamethasone 0.6 mg/kg PO/IM or prednisolone 1–2 mg/kg PO early",
              "Reassess SpO₂, speech, and chest auscultation after each cycle",
            ],
          })}
        `,
        questions: [
          {
            question: "Salbutamol first-hour dosing via spacer is typically:",
            options: ["6–10 puffs every 20 minutes", "One puff only", "Oral salbutamol only", "Never repeat"],
            correct: 0,
            explanation: "Salbutamol 2.5–5 mg nebulised or 6–10 puffs spacer every 20 min in acute asthma.",
          },
          {
            question: "Oxygen target in acute asthma when monitoring allows:",
            options: ["94–98%", "100% hyperoxia for all", "<80%", "No oxygen ever"],
            correct: 0,
            explanation: "Target SpO₂ 94–98%; use high-flow if life-threatening.",
          },
          {
            question: "Ipratropium dose in severe asthma first hour (typical) is:",
            options: ["250–500 mcg nebulised every 20 min", "5 mg oral only", "Never combined with salbutamol", "Once daily only"],
            correct: 0,
            explanation: "Add ipratropium 250–500 mcg nebulised every 20 min in moderate/severe first hour.",
          },
        ],
      },
      {
        title: 'Module 3: Escalation, Second-Line & Discharge',
        duration: 15,
        content: `
          <h2>When First-Line Is Not Enough</h2>
          ${buildInternationalModuleHtml({
            overview:
              "Most children improve with salbutamol, ipratropium, and early steroid. When SpO₂ stays low, work of breathing worsens, or the chest goes quiet — escalate immediately and prepare the Asthma II pathway.",
            objectives: [
              "Identify failure of first-hour therapy and life-threatening red flags",
              "Apply second-line options available at ward level (magnesium, continuous nebs, senior help)",
              "Decide safe discharge vs admission using reassessment criteria",
              "Teach spacer technique and return precautions before discharge",
            ],
            sections: [
              {
                heading: "Escalation triggers",
                bodyHtml: `<ul>
            <li>SpO₂ &lt;90% despite oxygen and repeated salbutamol</li>
            <li>Silent chest, exhaustion, or altered consciousness</li>
            <li>No improvement after two salbutamol cycles in moderate/severe asthma</li>
            <li>Hypotension — consider anaphylaxis mimic</li>
          </ul>
          <p>Call senior help early; prepare continuous nebulisation and IV access if Asthma II criteria met.</p>`,
              },
              {
                heading: "Second-line options (when available)",
                bodyHtml: `<ul>
            <li><strong>Magnesium sulfate</strong> 40 mg/kg IV over 20 min (max 2 g) if severe and IV access available</li>
            <li><strong>Continuous salbutamol</strong> 15 mg nebulised — bridge to Asthma II / ICU</li>
            <li><strong>High-flow oxygen</strong> while continuing bronchodilators — oxygen treats hypoxia, not obstruction</li>
          </ul>
          ${ASTHMA_LMIC_SPACER}`,
              },
              {
                heading: "Discharge vs admission",
                bodyHtml: `<ul>
            <li><strong>Consider discharge</strong> when speaking in sentences, SpO₂ stable on room air, minimal wheeze, steroid given, and caregiver can use spacer</li>
            <li><strong>Admit</strong> if any severe feature, poor response, social concerns, or first severe attack in young child</li>
            <li>Document spacer teach-back and written action plan when discharging</li>
          </ul>`,
              },
            ],
            keyTakeaway:
              "<p>Reassess after <em>every</em> treatment cycle. Escalate on red flags — do not discharge a child with silent chest or exhaustion.</p>",
            bedsideActions: [
              "If failing first hour → call senior and start Asthma II pathway",
              "Give magnesium 40 mg/kg IV if severe and access available",
              "Reassess speech, SpO₂, and air entry before discharge decision",
              "Teach spacer 6–10 puffs technique; document return precautions",
            ],
          })}
        `,
        questions: [
          {
            question: "Escalation to Asthma II is appropriate when:",
            options: [
              "SpO₂ <90%, silent chest, or no improvement after two salbutamol cycles",
              "Mild cough only",
              "First wheeze ever without distress",
              "Normal peak flow after one puff",
            ],
            correct: 0,
            explanation: "Persistent severe features or treatment failure require advanced pathway.",
          },
          {
            question: "Magnesium sulfate in severe acute asthma (when IV available) is:",
            options: ["40 mg/kg IV over 20 min (max 2 g)", "400 mg/kg bolus", "Oral only always", "Contraindicated in all children"],
            correct: 0,
            explanation: "Magnesium 40 mg/kg IV over 20 minutes is second-line for severe asthma.",
          },
          {
            question: "Safe discharge after acute asthma requires:",
            options: [
              "Stable SpO₂, speaking in sentences, steroid given, and caregiver spacer teach-back",
              "Single salbutamol puff only",
              "Silent chest improving to exhaustion",
              "No follow-up ever",
            ],
            correct: 0,
            explanation: "Discharge when clinically stable with education and action plan.",
          },
        ],
      },
    ],
    quiz: {
      title: 'Asthma I Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'What is the first-line treatment for acute asthma?',
          options: ['Antibiotics', 'Salbutamol', 'Oxygen only', 'Fluids'],
          correct: 1,
          explanation: 'Salbutamol is the definitive first-line bronchodilator for acute asthma.'
        },
        {
          question: 'A child speaking in single words with SpO2 88% has:',
          options: ['Mild asthma', 'Moderate asthma', 'Severe asthma', 'Normal breathing'],
          correct: 2,
          explanation: 'Inability to speak sentences and SpO2 <90% indicates severe asthma.'
        },
        {
          question: 'Ipratropium bromide in the first hour is indicated for:',
          options: ['Mild intermittent wheeze only', 'Moderate or severe acute asthma', 'All children regardless of severity', 'Post-discharge only'],
          correct: 1,
          explanation: 'Add ipratropium with salbutamol in moderate/severe asthma during the first hour.'
        },
        {
          question: 'Systemic steroid in acute asthma should be given:',
          options: ['Only if admitted to ICU', 'Early (dexamethasone, prednisolone, or hydrocortisone per protocol)', 'Never in children', 'After 24 hours only'],
          correct: 1,
          explanation: 'Early systemic steroid reduces relapse and admission risk.'
        },
        {
          question: 'Life-threatening asthma may present with:',
          options: ['Silent chest and exhaustion', 'Only mild wheeze', 'Normal SpO2 always', 'Bradycardia as the first sign only'],
          correct: 0,
          explanation: 'Silent chest, cyanosis, and exhaustion signal impending respiratory failure.'
        },
        {
          question: 'SpO2 target in acute asthma when monitoring allows:',
          options: ['≥90% with titration toward 90–94%', '100% hyperoxia for all', 'No oxygen ever', '<80%'],
          correct: 0,
          explanation: 'Treat hypoxia; titrate toward 90–94% and avoid routine hyperoxia.'
        },
        { question: 'Accessory muscle use in asthma indicates:', options: ['Increased work of breathing', 'Normal breathing', 'Resolved asthma', 'Bradycardia'], correct: 0, explanation: 'Intercostal recession and nasal flaring signal moderate/severe disease.' },
        { question: 'Prolonged expiratory phase in asthma reflects:', options: ['Airflow obstruction', 'Normal physiology', 'Cardiac failure only', 'Sepsis'], correct: 0, explanation: 'Wheeze and prolonged expiration are hallmark obstructive features.' },
        { question: 'Chest tightness in acute asthma is caused by:', options: ['Bronchospasm and airway inflammation', 'Only fever', 'Pneumothorax always', 'Normal variant'], correct: 0, explanation: 'Inflammation and bronchoconstriction produce tightness and wheeze.' },
        { question: 'Nasal flaring in a wheezy child suggests:', options: ['Significant respiratory distress', 'Mild cold only', 'No oxygen need', 'Discharge readiness'], correct: 0, explanation: 'Accessory signs indicate increased work of breathing.' },
        { question: 'After first-hour bronchodilator therapy, reassessment should include:', options: ['SpO₂, work of breathing, and ability to speak', 'Only temperature', 'Discharge planning only', 'No repeat assessment'], correct: 0, explanation: 'Reassess severity after each treatment cycle in acute asthma.' },
        { question: 'High-flow oxygen in life-threatening asthma is used to:', options: ['Treat hypoxaemia while continuing bronchodilators', 'Replace salbutamol', 'Cause hypercapnia intentionally', 'Avoid steroids'], correct: 0, explanation: 'Oxygen treats hypoxia; bronchodilators and steroids treat obstruction.' },
        { question: 'Wheeze that is expiratory in asthma indicates:', options: ['Lower airway obstruction', 'Upper airway stridor only', 'Normal finding', 'Cardiac arrhythmia'], correct: 0, explanation: 'Expiratory wheeze localises obstruction to bronchi.' },
        { question: 'Escalation to Asthma II course is appropriate when:', options: ['SpO₂ <90%, silent chest, or altered consciousness', 'Mild cough only', 'Normal peak flow', 'First wheeze ever without distress'], correct: 0, explanation: 'Severe features require advanced management pathway.' },
        { question: 'Paracetamol in asthma is used for:', options: ['Fever or discomfort — not as bronchodilator', 'Primary bronchodilation', 'Replacing salbutamol', 'Sedation for intubation only'], correct: 0, explanation: 'Treat fever/discomfort; core asthma drugs remain bronchodilator and steroid.' }
      ]
    }
  },
  {
    id: 'status-epilepticus-i',
    title: 'Status Epilepticus 1: Recognition & First-Line',
    level: 'beginner',
    duration: 50,
    price: 800,
    description: 'Recognize status epilepticus, stabilize ABCs, and deliver first-line anticonvulsant therapy.',
    modules: [
      {
        title: 'Module 1: Definition and Initial ABCs',
        duration: 15,
        content: `
          <h2>Status Epilepticus Definition</h2>
          ${buildInternationalModuleHtml({
            overview:
              "Status epilepticus (SE) is continuous seizure activity ≥5 minutes or recurrent seizures without recovery of consciousness. Treat as a time-critical emergency — brain injury risk rises with duration.",
            objectives: [
              "Define status epilepticus at 5 minutes of continuous or recurrent seizure",
              "Protect airway and deliver oxygen during active convulsion",
              "Check bedside glucose in every seizing child",
            ],
            sections: [
              {
                heading: "Definition and urgency",
                bodyHtml: `<p>Continuous seizure ≥5 minutes <strong>or</strong> recurrent seizures without regaining consciousness between events.</p>
          <p>Start the treatment clock at 5 minutes — do not wait for 30 minutes.</p>`,
              },
              {
                heading: "Initial ABCs (0–5 minutes)",
                bodyHtml: `<ul>
            <li><strong>Airway:</strong> Recovery position, suction secretions, airway adjunct if needed</li>
            <li><strong>Breathing:</strong> High-flow oxygen — treat hypoxia during resuscitation</li>
            <li><strong>Circulation:</strong> IV/IO access when safe; check glucose in <strong>mmol/L</strong></li>
          </ul>`,
              },
            ],
            keyTakeaway:
              "<p>Position + oxygen + glucose check happen <strong>while</strong> preparing benzodiazepine — never delay treatment for perfect access.</p>",
            bedsideActions: [
              "Start timer at 5 minutes of continuous seizure",
              "Recovery position with suction; high-flow oxygen",
              "Bedside glucose — treat hypoglycaemia if <3.3 mmol/L",
              "Prepare first-line benzodiazepine weight-based dose",
            ],
          })}
        `,
        questions: [
          {
            question: "Status epilepticus includes recurrent seizures without:",
            options: [
              "Recovery of consciousness between events",
              "Any fever",
              "Any movement",
              "Need for oxygen",
            ],
            correct: 0,
            explanation: "SE = >5 min continuous seizure OR recurrent seizures without regaining consciousness.",
          },
          {
            question: "Initial airway management during convulsion prioritises:",
            options: [
              "Recovery position, suction, and high-flow oxygen",
              "Immediate intubation before positioning",
              "Oral medications only",
              "Delay until CT scan",
            ],
            correct: 0,
            explanation: "Position, suction, oxygen — protect airway while preparing treatment.",
          },
          {
            question: "Circulation assessment in active seizure must include:",
            options: [
              "Bedside blood glucose check",
              "Only blood pressure",
              "Weight measurement only",
              "No vascular access ever",
            ],
            correct: 0,
            explanation: "Hypoglycaemia is a reversible cause — check glucose in every seizing child.",
          },
        ],
      },
      {
        title: 'Module 2: First-Line Anticonvulsants',
        duration: 20,
        content: `
          <h2>Pharmacological Control</h2>
          ${buildInternationalModuleHtml({
            overview:
              "First-line treatment is a weight-based benzodiazepine at 5 minutes. Kenya/low-resource settings often use diazepam; international teaching favours midazolam or lorazepam when available.",
            objectives: [
              "Select first-line benzodiazepine per local availability and age",
              "Repeat one benzodiazepine dose if seizure continues after 5 minutes",
              "Recognise neonatal pathway — avoid routine benzos first-line",
            ],
            sections: [
              {
                heading: "First-line benzodiazepine options",
                bodyHtml: SE_BENZO_CONFLICT,
              },
              {
                heading: "Dosing and repeat limits",
                bodyHtml: `<ul>
            <li>Give first-line benzo at <strong>5 minutes</strong> of continuous seizure</li>
            <li>Repeat <strong>one</strong> dose after 5 minutes if seizure continues (non-neonate)</li>
            <li>Maximum <strong>two</strong> adequate benzodiazepine doses before second-line agents</li>
          </ul>`,
              },
              {
                heading: "Neonatal exception",
                bodyHtml: NEONATE_CALLOUT,
              },
            ],
            keyTakeaway:
              "<p>After two benzo doses without control → second-line anticonvulsants and senior help (Status Epilepticus II pathway).</p>",
            bedsideActions: [
              "Midazolam buccal/IV or lorazepam IV if stocked; otherwise diazepam IV/PR",
              "Time each dose — repeat once at +5 min if still seizing",
              "Screen for meningitis, trauma, and metabolic cause while treating",
              "Prepare second-line agents if second benzo fails",
            ],
          })}
        `,
        questions: [
          {
            question: "After two adequate benzodiazepine doses without seizure control, next step is:",
            options: [
              "Second-line anticonvulsants and senior help",
              "Unlimited benzodiazepine repeats",
              "Discharge home",
              "Wait 24 hours",
            ],
            correct: 0,
            explanation: "Max two benzo doses then escalate to second-line agents per protocol.",
          },
          {
            question: "Neonatal status epilepticus requires:",
            options: [
              "Specialist pathway — benzodiazepines not routine first-line",
              "Same unlimited benzo protocol as adolescents",
              "No pharmacological treatment",
              "Oral paracetamol only",
            ],
            correct: 0,
            explanation: "Neonates need specialist assessment; avoid routine benzos first-line.",
          },
          {
            question: "If first benzodiazepine dose fails in non-neonate SE, you may:",
            options: [
              "Repeat one dose after 5 minutes before second-line",
              "Never repeat benzodiazepine",
              "Give insulin",
              "Stop all treatment",
            ],
            correct: 0,
            explanation: "Repeat one benzo after 5 min if seizure continues — then second-line.",
          },
        ],
      },
      {
        title: 'Module 3: Escalation and Handover',
        duration: 15,
        content: `
          <h2>When First-Line Fails</h2>
          ${buildInternationalModuleHtml({
            overview:
              "If seizures continue after two benzodiazepine doses, escalate to second-line agents, secure airway planning, and investigate cause. Structured handover saves time in PICU transfer.",
            objectives: [
              "Escalate to second-line anticonvulsants after failed benzodiazepines",
              "Identify reversible causes: hypoglycaemia, hyponatraemia, meningitis, trauma",
              "Deliver SBAR handover for PICU or Status Epilepticus II",
            ],
            sections: [
              {
                heading: "Second-line escalation",
                bodyHtml: `<ul>
            <li>Levetiracetam or phenytoin/fosphenytoin per local protocol after two benzo doses</li>
            <li>Prepare intubation if airway not protected or seizure persists</li>
            <li>Continuous monitoring — treat hyperthermia and rhabdomyolysis risk</li>
          </ul>`,
              },
              {
                heading: "Reversible causes to treat concurrently",
                bodyHtml: `<ul>
            <li><strong>Hypoglycaemia</strong> — dextrose 0.5 g/kg; recheck in 15 min</li>
            <li><strong>Meningitis</strong> — antibiotics after ABCs if suspected</li>
            <li><strong>Electrolytes</strong> — sodium, calcium, magnesium when access available</li>
          </ul>`,
              },
            ],
            keyTakeaway:
              "<p>Time-stamped drug chart + SBAR handover (weight, doses given, glucose, suspected cause) speeds safe escalation.</p>",
            bedsideActions: [
              "Start second-line anticonvulsant per protocol after two benzo doses",
              "Document seizure start time and all drug times",
              "SBAR: age, weight, seizure duration, drugs given, glucose, suspected cause",
              "Activate Status Epilepticus II / PICU if refractory",
            ],
          })}
        `,
        questions: [
          {
            question: "After two failed benzodiazepine doses in SE, next step is:",
            options: [
              "Second-line anticonvulsant and senior help",
              "Unlimited benzodiazepine repeats",
              "Discharge home",
              "Wait 24 hours",
            ],
            correct: 0,
            explanation: "Escalate to second-line agents and senior support after two adequate benzo doses.",
          },
          {
            question: "SBAR handover in status epilepticus should include:",
            options: [
              "Seizure duration, drugs given with times, glucose, and suspected cause",
              "Only patient name",
              "Family history only",
              "Discharge plan only",
            ],
            correct: 0,
            explanation: "Structured handover includes timing, treatment, and working diagnosis.",
          },
          {
            question: "Reversible cause that must be treated during active seizure:",
            options: [
              "Hypoglycaemia — give dextrose while continuing anticonvulsants",
              "Hypertension only",
              "Normal glucose rules out all metabolic causes",
              "Defer all labs until seizure stops for 24 h",
            ],
            correct: 0,
            explanation: "Treat hypoglycaemia immediately — it is a common reversible seizure cause.",
          },
        ],
      },
    ],
    quiz: {
      title: 'Status Epilepticus I Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Status Epilepticus is defined as a seizure lasting more than:',
          options: ['1 minute', '5 minutes', '30 minutes', '1 hour'],
          correct: 1,
          explanation: 'Emergency management (Stage 1) starts at 5 minutes of continuous seizure.'
        },
        {
          question: 'What must be checked in every seizing child?',
          options: ['Temperature', 'Blood Glucose', 'Weight', 'Blood Pressure'],
          correct: 1,
          explanation: 'Hypoglycemia is a common, reversible cause of seizures.'
        },
        {
          question: 'First-line benzodiazepine timing in non-neonate status epilepticus:',
          options: ['Wait 30 minutes', 'Give at 5 minutes of continuous seizure', 'Only after CT', 'Never in hospital'],
          correct: 1,
          explanation: 'Treat at 5 minutes; repeat once if seizure continues before second-line agents.'
        },
        {
          question: 'Recovery position during active convulsion helps to:',
          options: ['Protect airway and aid drainage of secretions', 'Stop seizure immediately', 'Replace benzodiazepines', 'Avoid oxygen delivery'],
          correct: 0,
          explanation: 'Recovery position with suction and oxygen protects airway while preparing treatment.'
        },
        {
          question: 'Neonates with prolonged seizures:',
          options: ['Same benzo protocol as older children always', 'Require specialist pathway — avoid routine benzos per local protocol', 'No treatment needed', 'Only phenytoin first line always'],
          correct: 1,
          explanation: 'Neonatal seizures need specialist assessment; benzo use differs from older children.'
        },
        {
          question: 'Maximum benzodiazepine doses before second-line agents (typical teaching):',
          options: ['Unlimited repeats', 'Two doses then escalate', 'One dose only ever', 'None until ICU arrival'],
          correct: 1,
          explanation: 'After two adequate benzo doses, move to second-line anticonvulsants and senior help.'
        },
        { question: 'High-flow oxygen during active seizure is given to:', options: ['Correct hypoxia during resuscitation', 'Terminate seizure directly', 'Replace benzodiazepines', 'Avoid glucose check'], correct: 0, explanation: 'Oxygen supports ABCs; drugs treat the seizure.' },
        { question: 'Suction during seizure is used to:', options: ['Clear secretions and protect airway', 'Induce vomiting', 'Measure glucose', 'Replace IV access'], correct: 0, explanation: 'Suction helps maintain airway patency in the recovery position.' },
        { question: 'Fever in a seizing child should prompt:', options: ['Search for infection but not delay seizure treatment', 'Withhold all anticonvulsants', 'Immediate LP before any treatment', 'Discharge without workup'], correct: 0, explanation: 'Treat seizure first; evaluate cause including meningitis when stable.' },
        { question: 'Second-line agents after failed benzodiazepines may include:', options: ['Levetiracetam or phenytoin per protocol', 'Oral paracetamol only', 'No further drugs', 'Insulin infusion'], correct: 0, explanation: 'Escalate to second-line anticonvulsants per Status Epilepticus II pathway.' },
        { question: 'Prolonged seizure increases risk of:', options: ['Hypoxia, hyperthermia, and rhabdomyolysis', 'Only mild fatigue', 'No metabolic effects', 'Immediate full recovery always'], correct: 0, explanation: 'Prolonged convulsion causes systemic complications — treat urgently.' },
        { question: 'IV access during status epilepticus should be obtained:', options: ['Early for glucose check and anticonvulsants', 'Only after 24 hours', 'Never in children', 'After CT only'], correct: 0, explanation: 'Obtain access for labs and second-line drugs without delaying benzos.' },
        { question: 'Post-ictal confusion after brief seizure:', options: ['May be normal but requires monitoring', 'Proves meningitis', 'Means no further treatment', 'Requires immediate discharge'], correct: 0, explanation: 'Monitor post-ictal recovery; investigate cause if atypical or prolonged.' },
        { question: 'Temperature management in prolonged seizure includes:', options: ['Treat hyperthermia if present', 'Cool with ice packs only', 'Ignore fever always', 'Antipyretics as sole therapy'], correct: 0, explanation: 'Hyperthermia worsens brain injury — treat fever when safe to do so.' },
        { question: 'Family history of epilepsy in a seizing child:', options: ['Is relevant to workup but does not delay acute treatment', 'Contraindicates benzodiazepines', 'Rules out hypoglycaemia', 'Means outpatient care only'], correct: 0, explanation: 'Treat acute seizure first; history guides later investigation.' }
      ]
    }
  },
  {
    id: 'meningitis-i',
    title: 'Paediatric Meningitis 1: Recognition and Early Antibiotics',
    level: 'beginner',
    duration: 50,
    price: 800,
    description: 'Identify clinical signs of meningitis and implement life-saving empiric therapy.',
    modules: [
      {
        title: 'Module 1: Clinical Recognition',
        duration: 15,
        content: `
          <h2>Meningitis Signs</h2>
          ${buildInternationalModuleHtml({
            overview:
              "Bacterial meningitis is a time-critical CNS infection. Recognition differs by age — infants may lack neck stiffness; non-blanching rash demands immediate treatment.",
            objectives: [
              "Recognise meningitis signs in infants vs older children",
              "Identify meningococcal septicaemia by non-blanching rash",
              "Titrate oxygen toward SpO₂ ≥90% in severe illness",
            ],
            sections: [
              {
                heading: "Age-specific presentation",
                bodyHtml: `<ul>
            <li><strong>Infants:</strong> Bulging fontanelle, irritability, poor feeding, fever, seizures</li>
            <li><strong>Older children:</strong> Neck stiffness, photophobia, headache, Kernig/Brudzinski signs</li>
          </ul>`,
              },
              {
                heading: "Meningococcal emergency",
                bodyHtml: `<p><strong>Non-blanching petechial/purpuric rash</strong> with fever suggests meningococcal septicaemia — give antibiotics immediately.</p>
          ${SPO2_TARGET_NOTE}`,
              },
            ],
            keyTakeaway:
              "<p>Do not withhold treatment while waiting for LP — antibiotics first when meningitis is suspected.</p>",
            bedsideActions: [
              "Assess fontanelle, neck stiffness, rash, and mental status",
              "Give oxygen if hypoxic — target SpO₂ ≥90%",
              "Obtain IV access and blood culture when possible",
              "Start empiric antibiotics without delaying for LP",
            ],
          })}
        `,
        questions: [
          {
            question: 'A bulging fontanelle in a febrile infant suggests:',
            options: ['Dehydration', 'Meningitis', 'Normal growth', 'Teething'],
            correct: 1,
            explanation: 'Increased intracranial pressure from meningitis often causes a bulging fontanelle.'
          },
          {
            question: 'Non-blanching petechial rash with fever suggests:',
            options: ['Viral exanthem only', 'Meningococcal disease', 'Allergic rash', 'Normal finding'],
            correct: 1,
            explanation: 'Non-blanching rash with fever is meningococcal septicaemia until proven otherwise.'
          },
          {
            question: 'Neck stiffness in an older child with fever indicates:',
            options: ['Normal posture', 'Possible meningitis — assess urgently', 'Dehydration only', 'Asthma'],
            correct: 1,
            explanation: 'Meningeal irritation (neck stiffness) with fever requires urgent meningitis assessment.'
          }
        ]
      },
      {
        title: 'Module 2: Empiric Antibiotics Before LP',
        duration: 15,
        content: `
          <h2>Antibiotics Before LP</h2>
          ${buildInternationalModuleHtml({
            overview:
              "Empiric antibiotics must not wait for lumbar puncture when meningitis is suspected. LP may be deferred if the child is unstable or has raised ICP signs.",
            objectives: [
              "Give empiric antibiotics immediately when meningitis suspected",
              "Select age-appropriate regimen including neonatal Listeria cover",
              "Know when to defer LP safely",
            ],
            sections: [
              {
                heading: "Do not delay antibiotics",
                bodyHtml: MENINGITIS_ABX_EARLY,
              },
              {
                heading: "Empiric regimens (hospital)",
                bodyHtml: `<ul>
            <li><strong>Ceftriaxone</strong> 100 mg/kg/day (max 4 g) IV — common first-line in older infants/children</li>
            <li><strong>Neonates:</strong> Cefotaxime + ampicillin (Listeria cover) per local protocol</li>
            <li>Blood culture before antibiotics when possible — do not delay if critically ill</li>
          </ul>`,
              },
            ],
            keyTakeaway:
              "<p>LP informs diagnosis but must not block life-saving antibiotics in suspected bacterial meningitis.</p>",
            bedsideActions: [
              "Draw blood culture if possible without delaying antibiotics",
              "Give ceftriaxone IV (or neonatal regimen) immediately",
              "Defer LP if unstable, coagulopathic, or herniation signs",
              "Add dexamethasone with or before first antibiotic dose when indicated",
            ],
          })}
        `,
        questions: [
          {
            question: 'When should empiric antibiotics be given in suspected meningitis?',
            options: ['After LP results', 'Immediately when meningitis suspected', 'After 24 hours', 'Only if rash present'],
            correct: 1,
            explanation: 'Do not delay antibiotics for LP if meningitis is suspected — give immediately.'
          },
          {
            question: 'LP may be deferred when:',
            options: ['Child is stable', 'Unstable, coagulopathy, or signs of herniation', 'Fever is mild', 'Always required first'],
            correct: 1,
            explanation: 'LP is deferred if unstable, coagulopathic, or raised ICP/herniation signs.'
          },
          {
            question: 'First-line IV antibiotic for meningitis in older children (Kenya common):',
            options: ['Oral amoxicillin only', 'Ceftriaxone IV', 'Metronidazole only', 'No antibiotics until culture'],
            correct: 1,
            explanation: 'Ceftriaxone IV is standard empiric therapy for bacterial meningitis in children.'
          }
        ]
      },
      {
        title: 'Module 3: Airway, Oxygen and Dexamethasone',
        duration: 15,
        content: `
          <h2>Supportive Care Bundle</h2>
          ${buildInternationalModuleHtml({
            overview:
              "Airway protection, oxygen, and early dexamethasone reduce harm in bacterial meningitis. Intubate when consciousness is impaired.",
            objectives: [
              "Protect airway and intubate when GCS falling",
              "Give dexamethasone with or before first antibiotic dose",
              "Maintain SpO₂ ≥90% during resuscitation",
            ],
            sections: [
              {
                heading: "Airway and oxygen",
                bodyHtml: `<ul>
            <li>Position and suction; intubate if GCS falling or failing to protect airway</li>
            <li>${SPO2_TARGET_NOTE.replace(/<\/?p>/g, "")}</li>
          </ul>`,
              },
              {
                heading: "Dexamethasone timing",
                bodyHtml: `<p><strong>Dexamethasone</strong> 0.15 mg/kg (max 10 mg) IV with or before first antibiotic dose — reduces neurological sequelae in non-neonatal bacterial meningitis per protocol.</p>`,
              },
            ],
            keyTakeaway:
              "<p>Dexamethasone timing matters — give with or before first antibiotic, not days later.</p>",
            bedsideActions: [
              "Intubate if unable to protect airway",
              "Dexamethasone 0.15 mg/kg IV with first antibiotic dose",
              "Hourly neuro checks if conscious; escalate if GCS falls",
              "Plan audiology follow-up after bacterial meningitis",
            ],
          })}
        `,
        questions: [
          {
            question: 'Dexamethasone in bacterial meningitis should be given:',
            options: ['After 48 hours of antibiotics', 'With or before the first antibiotic dose', 'Only if rash present', 'Never in children'],
            correct: 1,
            explanation: 'Dexamethasone with or before first antibiotic reduces neurological sequelae.'
          },
          {
            question: 'Minimum SpO₂ target in severe illness (WHO):',
            options: ['≥80%', '≥90%', '≥98%', 'No oxygen needed'],
            correct: 1,
            explanation: 'WHO severe illness teaching: treat hypoxia — aim SpO₂ ≥90%.'
          },
          {
            question: 'Intubation is indicated in meningitis when:',
            options: ['Mild fever only', 'GCS falling or inability to protect airway', 'Normal GCS always', 'After LP only'],
            correct: 1,
            explanation: 'Protect airway when consciousness is impaired or child cannot maintain airway.'
          }
        ]
      }
    ],
    quiz: {
      title: 'Meningitis I Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'CSF analysis in bacterial meningitis typically shows:',
          options: ['Elevated protein, low glucose, neutrophilic pleocytosis', 'Normal glucose and protein', 'Lymphocytes only always', 'No cells'],
          correct: 0,
          explanation: 'Bacterial meningitis CSF: high WBC (neutrophils), low glucose, elevated protein.'
        },
        {
          question: 'Antibiotics in suspected meningitis should be given:',
          options: ['After LP', 'Immediately when suspected', 'After culture', 'Only if rash'],
          correct: 1,
          explanation: 'Do not delay antibiotics for LP.'
        },
        {
          question: 'Dexamethasone timing in bacterial meningitis:',
          options: ['Day 3', 'With or before first antibiotic', 'After discharge', 'Never'],
          correct: 1,
          explanation: 'Give with or before first antibiotic dose.'
        },
        {
          question: 'Non-blanching rash with fever suggests:',
          options: ['Viral rash', 'Meningococcal disease', 'Allergy', 'Normal'],
          correct: 1,
          explanation: 'Petechiae/purpura with fever = meningococcal disease until proven otherwise.'
        },
        {
          question: 'WHO SpO₂ target in severe illness:',
          options: ['≥85%', '≥90%', '≥98%', 'Any'],
          correct: 1,
          explanation: 'Treat hypoxia — aim SpO₂ ≥90%.'
        },
        {
          question: 'LP should be deferred if:',
          options: ['Child is well', 'Unstable or herniation signs', 'Fever present', 'Always do LP first'],
          correct: 1,
          explanation: 'Defer LP if unstable, coagulopathic, or signs of raised ICP.'
        },
        {
          question: 'Empiric antibiotic for meningitis in older children:',
          options: ['Oral paracetamol', 'Ceftriaxone IV', 'Topical cream', 'Wait for culture'],
          correct: 1,
          explanation: 'Ceftriaxone IV is standard empiric therapy.'
        },
        {
          question: 'Neck stiffness with fever indicates:',
          options: ['Normal', 'Possible meningitis', 'Asthma', 'Dehydration only'],
          correct: 1,
          explanation: 'Meningeal signs require urgent assessment.'
        },
        {
          question: 'Blood cultures should be drawn:',
          options: ['Never', 'Before antibiotics when possible without delay', 'After 1 week', 'Only outpatient'],
          correct: 1,
          explanation: 'Culture before antibiotics when possible — do not delay antibiotics if critically ill.'
        },
        {
          question: 'Airway management priority in obtunded child:',
          options: ['LP first', 'Protect airway — intubate if needed', 'Oral fluids', 'Discharge'],
          correct: 1,
          explanation: 'Airway protection takes priority over diagnostic procedures.'
        },
        {
          question: 'Photophobia in suspected meningitis indicates:',
          options: ['Meningeal irritation requiring urgent treatment', 'Normal behaviour in all febrile children', 'Contraindication to antibiotics', 'Mild viral illness only'],
          correct: 0,
          explanation: 'Photophobia with fever is a classic meningeal sign — treat as meningitis until proven otherwise.'
        }
      ]
    }
  },
  {
    id: 'meningitis-ii',
    title: 'Paediatric Meningitis II: Complications and ICP Management',
    level: 'advanced',
    duration: 60,
    price: 1200,
    description: 'Managing increased intracranial pressure, seizures, hyponatraemia, and ICU complications.',
    modules: [
      {
        title: 'Module 1: ICP and ICU Monitoring',
        duration: 20,
        content: `
          ${MENINGITIS_ICU}
          <h3>ICP management</h3>
          <ul>
            <li>Head elevation 30 degrees; neutral head position</li>
            <li>Mannitol 0.25–1 g/kg IV or hypertonic saline if herniation suspected — senior/ICU protocol</li>
            <li>Avoid hypotension and hypoxia — both worsen cerebral perfusion</li>
          </ul>
        `,
        questions: [
          {
            question: 'Positioning for suspected raised ICP:',
            options: ['Flat supine', 'Head elevated 30 degrees', 'Prone', 'Trendelenburg'],
            correct: 1,
            explanation: '30-degree head elevation aids venous drainage and lowers ICP.'
          },
          {
            question: 'Mannitol or hypertonic saline in meningitis is used when:',
            options: ['Mild fever', 'Suspected herniation / severe raised ICP', 'Normal GCS', 'Before LP always'],
            correct: 1,
            explanation: 'Osmotic therapy is for suspected herniation or severe raised ICP per ICU protocol.'
          },
          {
            question: 'Hourly neuro checks in ICU should include:',
            options: ['Weight only', 'GCS and pupils', 'Diet history', 'Family history'],
            correct: 1,
            explanation: 'Serial GCS and pupil assessment detects neurological deterioration.'
          }
        ]
      },
      {
        title: 'Module 2: Seizures and Neurological Complications',
        duration: 20,
        content: `
          ${MENINGITIS_SEIZURES}
          ${NEONATE_CALLOUT}
          <h3>Structural complications</h3>
          <ul>
            <li>Subdural empyema, ventriculitis, stroke — suspect if not improving or focal signs</li>
            <li>CT/MRI per protocol; neurosurgery if collection needs drainage</li>
          </ul>
        `,
        questions: [
          {
            question: 'First step in a seizing child with meningitis:',
            options: ['LP immediately', 'ABCs + glucose check + benzodiazepine per SE protocol', 'Oral antibiotics', 'Discharge'],
            correct: 1,
            explanation: 'Stabilise ABCs, check glucose, treat seizure per Status Epilepticus teaching.'
          },
          {
            question: 'Neonates with meningitis and seizures:',
            options: ['Benzodiazepines first-line', 'Avoid benzos first-line — phenobarbital per protocol', 'No treatment', 'Oral paracetamol only'],
            correct: 1,
            explanation: 'Neonates: do not use benzodiazepines as first-line for seizures.'
          },
          {
            question: 'Subdural empyema should be suspected when:',
            options: ['Rapid improvement', 'Not improving or focal neurology despite antibiotics', 'Mild cough', 'Normal GCS throughout'],
            correct: 1,
            explanation: 'Failure to improve or focal signs suggests complications needing imaging/surgery.'
          }
        ]
      },
      {
        title: 'Module 3: Hyponatraemia, SIADH and Fluids',
        duration: 20,
        content: `
          ${MENINGITIS_SIADH}
          <h3>Fluid management</h3>
          <ul>
            <li>Use isotonic maintenance fluids; monitor sodium every 4–6 h if hyponatraemia</li>
            <li><strong>Do not</strong> treat SIADH with hypotonic dextrose fluids</li>
            <li>Fluid restriction may be needed — specialist guidance</li>
          </ul>
        `,
        questions: [
          {
            question: 'Hyponatraemia in meningitis — harmful fluid choice:',
            options: ['Isotonic saline', 'Hypotonic 5% dextrose without sodium', 'Balanced crystalloid', 'Oral rehydration'],
            correct: 1,
            explanation: 'Hypotonic fluids worsen cerebral oedema risk in SIADH — use isotonic fluids.'
          },
          {
            question: 'SIADH in meningitis requires:',
            options: ['Free water load', 'Senior review; isotonic fluids; avoid hypotonic fluids', 'No monitoring', 'Immediate discharge'],
            correct: 1,
            explanation: 'SIADH needs careful sodium monitoring and isotonic fluids — not hypotonic loads.'
          },
          {
            question: 'Sodium monitoring frequency if hyponatraemia:',
            options: ['Never', 'Every 4–6 hours initially', 'Once per month', 'Only at discharge'],
            correct: 1,
            explanation: 'Serial sodium monitoring detects dangerous shifts in SIADH.'
          }
        ]
      }
    ],
    quiz: {
      title: 'Meningitis II Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Head elevation for raised ICP:',
          options: ['0 degrees', '30 degrees', '90 degrees', 'Prone'],
          correct: 1,
          explanation: '30-degree elevation reduces ICP.'
        },
        {
          question: 'Harmful fluid in meningitis-related SIADH:',
          options: ['Isotonic saline', 'Hypotonic dextrose without Na⁺', 'Ringer\'s lactate', 'Oral ORS'],
          correct: 1,
          explanation: 'Hypotonic fluids increase cerebral oedema risk.'
        },
        {
          question: 'Seizures in meningitis — first management:',
          options: ['LP', 'ABCs + glucose + SE protocol', 'Wait 24 h', 'Oral fluids only'],
          correct: 1,
          explanation: 'Stabilise and treat seizure per Status Epilepticus teaching.'
        },
        {
          question: 'Neonatal meningitis seizures — first-line:',
          options: ['Midazolam', 'Phenobarbital per protocol', 'No treatment', 'Paracetamol only'],
          correct: 1,
          explanation: 'Neonates: avoid benzos first-line.'
        },
        {
          question: 'Subdural empyema suspected when:',
          options: ['Rapid cure', 'Not improving despite antibiotics', 'Mild fever', 'Normal exam'],
          correct: 1,
          explanation: 'Failure to improve suggests complications.'
        },
        {
          question: 'ICU neuro monitoring includes:',
          options: ['GCS and pupils hourly', 'Weight only', 'No checks', 'BP once daily only'],
          correct: 0,
          explanation: 'Hourly GCS and pupil checks detect deterioration.'
        },
        {
          question: 'Mannitol is indicated for:',
          options: ['Mild headache only', 'Suspected herniation / severe ICP', 'Normal GCS', 'Before all LPs'],
          correct: 1,
          explanation: 'Osmotic therapy for severe raised ICP/herniation per protocol.'
        },
        {
          question: 'Avoid in meningitis SIADH:',
          options: ['Isotonic fluids', 'Hypotonic free water load', 'Sodium monitoring', 'Senior review'],
          correct: 1,
          explanation: 'Do not give hypotonic fluids in SIADH.'
        },
        {
          question: 'Hypoxia and hypotension in meningitis:',
          options: ['Improve cerebral perfusion', 'Worsen cerebral perfusion — avoid', 'No effect', 'Desired'],
          correct: 1,
          explanation: 'Maintain oxygenation and BP to preserve cerebral perfusion.'
        },
        {
          question: 'Ventriculitis complication requires:',
          options: ['Outpatient care', 'Imaging and specialist/surgical review', 'No antibiotics', 'Only oral meds'],
          correct: 1,
          explanation: 'Structural complications need imaging and specialist management.'
        }
      ]
    }
  },
  {
    id: 'trauma-i',
    title: 'Paediatric Trauma I: Primary Survey and Stabilization',
    level: 'beginner',
    duration: 50,
    price: 800,
    description: 'The ABCDE approach to the injured child.',
    modules: [
      {
        title: 'Module 1: ABCDE Primary Survey',
        duration: 15,
        content: `
          <h2>The ABCDE Approach</h2>
          ${buildInternationalModuleHtml({
            overview:
              "Paediatric trauma resuscitation follows ABCDE — treat life threats as you find them. C-spine protection accompanies every airway intervention.",
            objectives: [
              "Perform primary survey in A-B-C-D-E order",
              "Protect cervical spine during airway management",
              "Treat hypoxia with SpO₂ target ≥90%",
            ],
            sections: [
              {
                heading: "Primary survey sequence",
                bodyHtml: `${TRAUMA_ABCDE}<ul>
            <li><strong>A:</strong> Airway with C-spine protection</li>
            <li><strong>B:</strong> Breathing — ${SPO2_TARGET_NOTE.replace(/<\/?p>/g, "")}</li>
            <li><strong>C:</strong> Circulation with haemorrhage control</li>
            <li><strong>D:</strong> Disability (GCS, pupils, glucose)</li>
            <li><strong>E:</strong> Exposure — prevent hypothermia</li>
          </ul>`,
              },
              {
                heading: "Treat as you go",
                bodyHtml: `<p>Do not complete the full survey before fixing ABC problems — reassess after each intervention.</p>`,
              },
            ],
            keyTakeaway:
              "<p>Airway + C-spine together; warm the child during exposure to prevent coagulopathy.</p>",
            bedsideActions: [
              "Manual inline stabilisation during airway manoeuvres",
              "High-flow oxygen if hypoxic",
              "Two large-bore IV/IO access when circulation compromised",
              "Check GCS, pupils, and glucose at disability step",
            ],
          })}
        `,
        questions: [
          {
            question: 'Priority in trauma airway management:',
            options: ['Intubation first always', 'C-spine stabilization with airway', 'Chest X-ray first', 'Discharge'],
            correct: 1,
            explanation: 'Airway must be managed with simultaneous C-spine protection in trauma.'
          },
          {
            question: 'Primary survey order:',
            options: ['E-A-B-C-D', 'A-B-C-D-E', 'C-A-B-D-E', 'D-A-B-C-E'],
            correct: 1,
            explanation: 'ABCDE — treat life threats as found.'
          },
          {
            question: 'WHO SpO₂ target in severe illness/trauma hypoxia:',
            options: ['≥80%', '≥90%', '≥99%', 'No oxygen'],
            correct: 1,
            explanation: 'Treat hypoxia — aim SpO₂ ≥90%.'
          }
        ]
      },
      {
        title: 'Module 2: Haemorrhage Control and Circulation',
        duration: 15,
        content: `
          <h2>Haemorrhage Control</h2>
          ${buildInternationalModuleHtml({
            overview:
              "Exsanguination kills in minutes. Direct pressure first; children compensate with tachycardia before hypotension appears.",
            objectives: [
              "Apply direct pressure as first-line haemorrhage control",
              "Give 10–20 mL/kg crystalloid boluses with reassessment",
              "Recognise early compensated shock by tachycardia",
            ],
            sections: [
              {
                heading: "Haemorrhage control steps",
                bodyHtml: TRAUMA_HEMORRHAGE,
              },
              {
                heading: "Paediatric circulation pearls",
                bodyHtml: `<ul>
            <li>Children compensate until late — tachycardia before hypotension</li>
            <li>10–20 mL/kg crystalloid boluses with reassessment; blood early if massive haemorrhage</li>
            <li>Two large-bore IV/IO access; warm all fluids</li>
          </ul>`,
              },
            ],
            keyTakeaway:
              "<p>Direct pressure → tourniquet if limb haemorrhage uncontrolled → blood products early in massive bleeding.</p>",
            bedsideActions: [
              "Direct pressure on external bleeding",
              "Tourniquet for life-threatening limb haemorrhage not controlled by pressure",
              "10–20 mL/kg warmed crystalloid; reassess after each bolus",
              "Activate massive haemorrhage protocol if ongoing blood loss",
            ],
          })}
        `,
        questions: [
          {
            question: 'First-line haemorrhage control on a limb:',
            options: ['Observation only', 'Direct pressure', 'Oral fluids', 'Antibiotics'],
            correct: 1,
            explanation: 'Direct pressure is first-line; tourniquet if direct pressure fails.'
          },
          {
            question: 'Initial fluid bolus in traumatic shock:',
            options: ['100 mL/kg fast', '10–20 mL/kg with reassessment', 'No fluids ever', 'Hypotonic dextrose'],
            correct: 1,
            explanation: '10–20 mL/kg isotonic boluses with reassessment after each bolus.'
          },
          {
            question: 'Early sign of shock in children is often:',
            options: ['Hypertension', 'Tachycardia before hypotension', 'Bradycardia first', 'Normal HR always'],
            correct: 1,
            explanation: 'Children compensate with tachycardia before blood pressure falls.'
          }
        ]
      },
      {
        title: 'Module 3: Head Injury Red Flags',
        duration: 15,
        content: `
          <h2>Traumatic Brain Injury</h2>
          ${buildInternationalModuleHtml({
            overview:
              "Head injury red flags predict intracranial catastrophe. Prevent secondary brain injury by avoiding hypoxia and hypotension.",
            objectives: [
              "Identify head injury red flags in children",
              "Prevent secondary brain injury with oxygenation and BP support",
              "Activate trauma team for high-energy mechanism",
            ],
            sections: [
              {
                heading: "Red flags",
                bodyHtml: TRAUMA_HEAD_INJURY,
              },
              {
                heading: "Disability assessment (D)",
                bodyHtml: `<ul>
            <li>GCS, pupils, glucose at bedside — repeat serially</li>
            <li>Prevent secondary brain injury: avoid hypoxia and hypotension</li>
            <li>Activate trauma team for high-energy mechanism or red flags</li>
          </ul>`,
              },
            ],
            keyTakeaway:
              "<p>Falling GCS or post-traumatic seizure → urgent imaging and neurosurgical review per protocol.</p>",
            bedsideActions: [
              "Serial GCS and pupil checks",
              "Maintain SpO₂ ≥90% and age-appropriate BP",
              "CT head per local protocol when red flags present",
              "Consider non-accidental injury safeguarding when mechanism inconsistent",
            ],
          })}
        `,
        questions: [
          {
            question: 'Head injury red flag in a child:',
            options: ['Single brief cry', 'GCS falling or post-traumatic seizure', 'Normal play immediately', 'Mild bruise only'],
            correct: 1,
            explanation: 'Falling GCS and post-traumatic seizures are red flags needing urgent imaging/review.'
          },
          {
            question: 'Secondary brain injury is worsened by:',
            options: ['Normoxia', 'Hypoxia and hypotension', 'Normal BP', 'Warmth'],
            correct: 1,
            explanation: 'Hypoxia and hypotension worsen outcomes in traumatic brain injury.'
          },
          {
            question: 'Bedside check in trauma disability assessment:',
            options: ['GCS, pupils, glucose', 'Diet history only', 'School grades', 'Family tree'],
            correct: 0,
            explanation: 'GCS, pupils, and glucose are core bedside disability checks.'
          }
        ]
      }
    ],
    quiz: {
      title: 'Trauma I Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Airway priority in paediatric trauma:',
          options: ['C-spine protection with airway', 'LP first', 'Oral fluids', 'Wait for CT'],
          correct: 0,
          explanation: 'Airway + C-spine protection together.'
        },
        {
          question: 'Primary survey sequence:',
          options: ['A-B-C-D-E', 'C-B-A-E-D', 'E-D-C-B-A', 'B-A-C-E-D'],
          correct: 0,
          explanation: 'ABCDE primary survey.'
        },
        {
          question: 'First haemorrhage control step:',
          options: ['Direct pressure', 'Antibiotics', 'Paracetamol', 'Observation 24 h'],
          correct: 0,
          explanation: 'Direct pressure first; tourniquet if needed.'
        },
        {
          question: 'Fluid bolus in traumatic shock:',
          options: ['10–20 mL/kg reassessed', '100 mL/kg always', 'None', 'Hypotonic only'],
          correct: 0,
          explanation: '10–20 mL/kg isotonic with reassessment.'
        },
        {
          question: 'Head injury red flag:',
          options: ['Post-traumatic seizure', 'Minor scratch', 'Normal GCS throughout', 'Happy child'],
          correct: 0,
          explanation: 'Seizure after head injury is a red flag.'
        },
        {
          question: 'Early shock sign in children:',
          options: ['Tachycardia', 'Hypertension first', 'Bradycardia first', 'No vital change'],
          correct: 0,
          explanation: 'Tachycardia often precedes hypotension in children.'
        },
        {
          question: 'Prevent hypothermia in trauma because:',
          options: ['Coagulopathy worsens', 'No effect', 'Improves bleeding', 'Optional only'],
          correct: 0,
          explanation: 'Hypothermia worsens coagulopathy in trauma — warm patient and fluids.'
        },
        {
          question: 'Disability assessment includes:',
          options: ['GCS and pupils', 'Hair colour', 'Shoe size', 'School name'],
          correct: 0,
          explanation: 'GCS and pupils are core neurological checks.'
        },
        {
          question: 'SpO₂ target in trauma hypoxia (WHO):',
          options: ['≥90%', '≥70%', '≥99%', 'No target'],
          correct: 0,
          explanation: 'Treat hypoxia — aim SpO₂ ≥90%.'
        },
        {
          question: 'High-energy mechanism requires:',
          options: ['Trauma team activation / full survey', 'Discharge home', 'No assessment', 'Oral antibiotics only'],
          correct: 0,
          explanation: 'High-energy mechanisms need full trauma evaluation.'
        }
      ]
    }
  },
  {
    id: 'trauma-ii',
    title: 'Paediatric Trauma II: Hemorrhage Control and Damage Control',
    level: 'advanced',
    duration: 60,
    price: 1200,
    description: 'Massive haemorrhage, damage control surgery, and specific injury patterns.',
    modules: [
      {
        title: 'Module 1: Massive Haemorrhage and MTP',
        duration: 20,
        content: `
          <h2>Massive Haemorrhage</h2>
          ${buildInternationalModuleHtml({
            overview:
              "Massive haemorrhage requires early massive transfusion protocol activation and correction of the lethal triad: hypothermia, acidosis, and coagulopathy.",
            objectives: [
              "Activate MTP early in ongoing massive haemorrhage",
              "Deliver balanced blood products per local protocol",
              "Prevent and correct hypothermia during resuscitation",
            ],
            sections: [
              {
                heading: "Haemorrhage control recap",
                bodyHtml: TRAUMA_HEMORRHAGE,
              },
              {
                heading: "Massive transfusion protocol (MTP)",
                bodyHtml: `<ul>
            <li>Activate early when ongoing haemorrhage — do not wait for haemodynamic collapse</li>
            <li>Balanced blood products (packed cells : plasma : platelets) per local protocol</li>
            <li>Correct hypothermia, acidosis, coagulopathy — damage control resuscitation</li>
          </ul>`,
              },
            ],
            keyTakeaway:
              "<p>MTP early + warm blood/products — hypothermia worsens coagulopathy in trauma.</p>",
            bedsideActions: [
              "Activate MTP when ongoing massive haemorrhage suspected",
              "Pelvic binder if pelvic fracture with shock",
              "Warm patient and all IV fluids/blood products",
              "Reassess perfusion after each product administration",
            ],
          })}
        `,
        questions: [
          {
            question: 'MTP should be activated when:',
            options: ['Minor bruise', 'Ongoing massive haemorrhage', 'Normal vitals always', 'After discharge'],
            correct: 1,
            explanation: 'Activate MTP early in ongoing massive haemorrhage.'
          },
          {
            question: 'Damage control resuscitation targets:',
            options: ['Hypothermia', 'Correct hypothermia, acidosis, coagulopathy', 'Ignore temperature', 'Hyperglycaemia only'],
            correct: 1,
            explanation: 'Prevent/le correct the lethal triad: hypothermia, acidosis, coagulopathy.'
          },
          {
            question: 'Pelvic fracture with shock — consider:',
            options: ['Pelvic binder', 'Oral fluids only', 'No intervention', 'LP'],
            correct: 0,
            explanation: 'Pelvic binder for suspected pelvic fracture with haemorrhage.'
          }
        ]
      },
      {
        title: 'Module 2: Abdominal and Thoracic Trauma',
        duration: 20,
        content: `
          <h2>Blunt Abdominal and Thoracic Trauma</h2>
          ${buildInternationalModuleHtml({
            overview:
              "Children's compliant abdominal walls leave solid organs vulnerable. Thoracic injuries can kill rapidly — tension pneumothorax needs immediate decompression.",
            objectives: [
              "Recognise spleen and liver as commonly injured organs",
              "Decompress tension pneumothorax immediately",
              "Select operative vs non-operative management based on stability",
            ],
            sections: [
              {
                heading: "Blunt abdominal trauma",
                bodyHtml: `<p>Children have less abdominal wall protection — <strong>spleen and liver</strong> commonly injured.</p>
          <ul>
            <li>Conservative management if stable with serial monitoring</li>
            <li>Surgery if refractory shock, peritonitis, or free air per protocol</li>
          </ul>`,
              },
              {
                heading: "Thoracic emergencies",
                bodyHtml: `<ul>
            <li><strong>Tension pneumothorax</strong> → immediate needle decompression then chest drain</li>
            <li><strong>Haemothorax</strong> → chest drain when indicated</li>
            <li><strong>Open pneumothorax</strong> → three-sided occlusive dressing then definitive drain</li>
          </ul>`,
              },
            ],
            keyTakeaway:
              "<p>Tension pneumothorax before CT — decompress first when clinically diagnosed.</p>",
            bedsideActions: [
              "FAST or clinical assessment for free fluid when available",
              "Needle decompression for tension pneumothorax before imaging delay",
              "Serial abdominal exam if managed non-operatively",
              "Activate surgery when refractory shock or peritonitis",
            ],
          })}
        `,
        questions: [
          {
            question: 'Most commonly injured organs in blunt paediatric abdominal trauma:',
            options: ['Stomach only', 'Spleen and liver', 'Bladder only', 'Appendix only'],
            correct: 1,
            explanation: 'Solid organs (spleen, liver) are most vulnerable in children.'
          },
          {
            question: 'Tension pneumothorax requires:',
            options: ['Observation', 'Immediate decompression', 'Oral antibiotics', 'LP'],
            correct: 1,
            explanation: 'Tension pneumothorax is immediately life-threatening — decompress urgently.'
          },
          {
            question: 'Stable blunt splenic injury may be managed:',
            options: ['Non-operatively with monitoring', 'Always surgery', 'No monitoring', 'Discharge immediately'],
            correct: 0,
            explanation: 'Many paediatric solid organ injuries are managed non-operatively if stable.'
          }
        ]
      },
      {
        title: 'Module 3: Damage Control Surgery and Head Injury',
        duration: 20,
        content: `
          <h2>Damage Control and TBI</h2>
          ${buildInternationalModuleHtml({
            overview:
              "Damage control surgery prioritises survival over definitive repair. Concurrent traumatic brain injury demands strict avoidance of hypoxia and hypotension.",
            objectives: [
              "Explain damage control surgery principles",
              "Prevent secondary brain injury with SpO₂ and BP targets",
              "Know when to transfer to trauma centre",
            ],
            sections: [
              {
                heading: "Head injury priorities",
                bodyHtml: TRAUMA_HEAD_INJURY,
              },
              {
                heading: "Damage control surgery",
                bodyHtml: `<ul>
            <li>Abbreviated operation to control haemorrhage and contamination — definitive repair later</li>
            <li>Transfer to trauma centre when local resources exceeded</li>
            <li>Maintain SpO₂ ≥90% and age-appropriate BP during operative resuscitation</li>
          </ul>`,
              },
            ],
            keyTakeaway:
              "<p>Survival first — abbreviated surgery, then ICU stabilisation, then definitive repair.</p>",
            bedsideActions: [
              "Avoid hypotension and hypoxia during OR and transfer",
              "Document mechanism and safeguarding concerns if NAI suspected",
              "SBAR for trauma centre transfer with imaging and transfusion summary",
              "Serial neuro checks if concurrent head injury",
            ],
          })}
        `,
        questions: [
          {
            question: 'Damage control surgery aims to:',
            options: ['Complete all repairs in one long operation', 'Control haemorrhage/contamination quickly — definitive repair later', 'Avoid surgery always', 'LP first'],
            correct: 1,
            explanation: 'Damage control = stop bleeding/contamination; definitive surgery when stable.'
          },
          {
            question: 'Secondary brain injury prevention requires:',
            options: ['Hypoxia acceptable', 'SpO₂ ≥90% and adequate BP', 'Hypotension', 'No monitoring'],
            correct: 1,
            explanation: 'Avoid hypoxia and hypotension in traumatic brain injury.'
          },
          {
            question: 'Transfer to trauma centre when:',
            options: ['Resources exceeded or needs specialist care', 'Minor laceration', 'Normal exam always', 'Never transfer'],
            correct: 0,
            explanation: 'Transfer when local resources cannot provide definitive care.'
          }
        ]
      }
    ],
    quiz: {
      title: 'Trauma II Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Most injured organs in blunt paediatric abdomen:',
          options: ['Spleen/liver', 'Stomach only', 'Bladder', 'Skin only'],
          correct: 0,
          explanation: 'Spleen and liver are most commonly injured.'
        },
        {
          question: 'MTP activation timing:',
          options: ['Early in ongoing haemorrhage', 'After 1 week', 'Never', 'Outpatient only'],
          correct: 0,
          explanation: 'Activate MTP early — do not wait for collapse.'
        },
        {
          question: 'Tension pneumothorax management:',
          options: ['Immediate decompression', 'Wait 24 h', 'Oral meds', 'LP'],
          correct: 0,
          explanation: 'Decompress tension pneumothorax immediately.'
        },
        {
          question: 'Damage control surgery:',
          options: ['Quick control then definitive repair later', 'Never operate', 'Full repair only in first op always', 'LP first'],
          correct: 0,
          explanation: 'Abbreviated surgery first; definitive when stable.'
        },
        {
          question: 'Pelvic fracture with shock — adjunct:',
          options: ['Pelvic binder', 'Cold exposure', 'No fluids', 'Hypotonic dextrose'],
          correct: 0,
          explanation: 'Pelvic binder reduces pelvic bleeding.'
        },
        {
          question: 'Lethal triad in trauma includes:',
          options: ['Hypothermia, acidosis, coagulopathy', 'Fever, rash, cough', 'Normal vitals', 'Hyperoxia only'],
          correct: 0,
          explanation: 'Hypothermia, acidosis, and coagulopathy form the lethal triad.'
        },
        {
          question: 'Stable splenic injury may be:',
          options: ['Managed non-operatively', 'Always resected immediately', 'Ignored', 'Outpatient only always'],
          correct: 0,
          explanation: 'Many paediatric splenic injuries managed conservatively if stable.'
        },
        {
          question: 'Head injury — avoid:',
          options: ['Hypoxia and hypotension', 'Oxygen', 'BP monitoring', 'GCS checks'],
          correct: 0,
          explanation: 'Hypoxia and hypotension worsen brain injury.'
        },
        {
          question: 'Warm fluids in trauma to prevent:',
          options: ['Coagulopathy from hypothermia', 'Healing', 'Clotting', 'Nothing'],
          correct: 0,
          explanation: 'Hypothermia worsens coagulopathy — warm patient and fluids.'
        },
        {
          question: 'Transfer indication:',
          options: ['Needs specialist/trauma centre care', 'Minor scratch', 'Normal vitals always', 'Never'],
          correct: 0,
          explanation: 'Transfer when definitive care exceeds local capability.'
        }
      ]
    }
  }
];
