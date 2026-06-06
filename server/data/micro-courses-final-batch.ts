/**
 * Micro-Courses Data: Final Batch (8 remaining courses)
 * PSOT §16: Complete 24-course learning ecosystem
 * 
 * Severe Malaria I & II (2)
 * Acute Kidney Injury I & II (2)
 * Severe Anaemia I & II (2)
 * 
 * Note: Meningitis II already in batch-4-5.ts
 */

import { GLUCOSE_MMOL_NOTE, HYPOGLYCEMIA_MMOL_NOTE, MALARIA_ARTESUNATE } from "./clinical-content-helpers";

export const microCoursesFinalBatch = [
  // ============================================
  // SEVERE MALARIA I & II
  // ============================================

  {
    id: 'severe-malaria-i',
    title: 'Paediatric Severe Malaria 1: Recognition and Artesunate Therapy',
    level: 'foundational',
    duration: 45,
    price: 800,
    description: 'Recognize severe malaria and administer IV/IM artesunate in low-resource settings.',
    modules: [
      {
        title: 'Module 1: Severe Malaria Recognition',
        duration: 15,
        content: `
          <h2>Severe Malaria Recognition</h2>
          <h3>Uncomplicated Malaria Symptoms:</h3>
          <ul>
            <li>Fever (often high, >39°C)</li>
            <li>Chills, rigors</li>
            <li>Headache, myalgias</li>
            <li>Nausea, vomiting</li>
          </ul>
          <h3>Severe Malaria Criteria (Any ONE):</h3>
          <ul>
            <li>Cerebral malaria: GCS ≤11 (coma)</li>
            <li>Severe anemia: Hgb <5 g/dL</li>
            <li>Acute kidney injury: Creatinine >3 mg/dL or oliguria</li>
            <li>Pulmonary edema/ARDS</li>
            <li>Severe hypoglycemia: &lt;3.3 mmol/L (&lt;60 mg/dL)</li>
            <li>Lactic acidosis: pH <7.35 + lactate >5 mmol/L</li>
            <li>Severe malaria anemia (Hgb <5 + parasitemia >10%)</li>
            <li>Disseminated intravascular coagulation (DIC)</li>
          </ul>
          <h3>Diagnostic Confirmation:</h3>
          <ul>
            <li>Rapid diagnostic test (RDT): Detects malaria antigen (P. falciparum, P. vivax)</li>
            <li>Blood smear: Gold standard; quantifies parasitemia (>10% = severe)</li>
            <li>PCR: Most sensitive but not always available</li>
          </ul>
          <h3>Plasmodium Species:</h3>
          <ul>
            <li><strong>P. falciparum:</strong> Most severe, highest mortality</li>
            <li><strong>P. vivax:</strong> Milder but can cause severe disease</li>
            <li><strong>P. ovale, P. malariae:</strong> Rare, milder</li>
          </ul>
        `,
        questions: [
          {
            question: "Cerebral malaria is defined by GCS:",
            options: ["≤11 with P. falciparum infection", ">15 always", "Any fever", "Only in adults"],
            correct: 0,
            explanation: "GCS ≤11 with malaria defines cerebral malaria — severe disease.",
          },
          {
            question: "Severe malaria hypoglycaemia threshold (mmol/L) is typically:",
            options: ["<3.3 mmol/L", ">15 mmol/L", "Not measured", "Only in adults"],
            correct: 0,
            explanation: "Severe hypoglycaemia <3.3 mmol/L — monitor glucose every 4–6 h.",
          },
          {
            question: "P. falciparum is significant because it:",
            options: ["Causes the most severe malaria and highest mortality", "Never causes severe disease", "Only causes mild illness", "Is absent in Africa"],
            correct: 0,
            explanation: "P. falciparum is the most dangerous species in paediatric malaria.",
          },
        ],
      },
      {
        title: 'Module 2: Artesunate Therapy & Supportive Care',
        duration: 20,
        content: `
          ${MALARIA_ARTESUNATE}
          ${GLUCOSE_MMOL_NOTE}
          ${HYPOGLYCEMIA_MMOL_NOTE}
          <h2>Severe Malaria Treatment</h2>
          <h3>Artesunate (First-Line for Severe Malaria — WHO):</h3>
          <ul>
            <li><strong>Dose:</strong> 3 mg/kg IV or IM at 0, 12, 24 hours (then daily per protocol)</li>
            <li><strong>Route:</strong> IV or IM — preferred over quinine for severe malaria</li>
            <li><strong>Efficacy:</strong> Lower mortality vs quinine in severe disease</li>
            <li><strong>Note:</strong> Oral <strong>artesunate-lumefantrine</strong> (ACT) is for uncomplicated malaria — not first-line for severe/cerebral malaria.</li>
          </ul>
          <h3>Artesunate Dosing Example:</h3>
          <ul>
            <li>20 kg child: 3 × 20 = 60 mg IV/IM at 0, 12, 24 hours</li>
            <li>Then switch to oral ACT when tolerating and stable</li>
          </ul>
          <h3>Supportive Care:</h3>
          <ul>
            <li><strong>Oxygen:</strong> Target SpO2 >94%</li>
            <li><strong>Fluids:</strong> Careful fluid management (avoid pulmonary edema)</li>
            <li><strong>Glucose:</strong> Monitor in mmol/L; treat hypoglycaemia &lt;3.3 mmol/L with 0.5 g/kg dextrose</li>
            <li><strong>Transfusion:</strong> If Hgb <5 g/dL or symptomatic anemia</li>
            <li><strong>Seizure precautions:</strong> Diazepam 0.1 mg/kg IV if seizures</li>
          </ul>
          <h3>Monitoring Parameters:</h3>
          <ul>
            <li>Parasitemia: Should decrease by 50% every 48 hours</li>
            <li>Glucose: Every 4-6 hours (hypoglycemia risk)</li>
            <li>Hemoglobin: Monitor for severe anemia</li>
            <li>Renal function: Creatinine, urine output</li>
            <li>Mental status: Assess for cerebral malaria improvement</li>
          </ul>
        `,
        questions: [
          {
            question: "Oral artesunate-lumefantrine (ACT) is for:",
            options: ["Uncomplicated malaria — not first-line for severe/cerebral malaria", "All cerebral malaria first-line", "Prophylaxis only in neonates", "Never used in Africa"],
            correct: 0,
            explanation: "IV/IM artesunate for severe disease; oral ACT when stable and tolerating.",
          },
          {
            question: "A 20 kg child receives artesunate dose of:",
            options: ["60 mg at 0, 12, 24 hours (3 mg/kg)", "200 mg once only", "Oral paracetamol", "5 mg total"],
            correct: 0,
            explanation: "3 mg/kg × 20 kg = 60 mg IV/IM per WHO severe malaria schedule.",
          },
          {
            question: "Fluid management in severe malaria should:",
            options: ["Be cautious — avoid pulmonary oedema", "Give unlimited bolus always", "Withhold all fluids", "Use hypotonic dextrose only"],
            correct: 0,
            explanation: "Careful fluids; monitor for pulmonary oedema in severe malaria.",
          },
        ],
      },
      {
        title: 'Module 3: Complications & Escalation',
        duration: 10,
        content: `
          <h2>Severe Malaria Complications</h2>
          <h3>Cerebral Malaria:</h3>
          <ul>
            <li>GCS ≤11 (coma) + P. falciparum parasitemia</li>
            <li>Mechanism: Sequestration of infected RBCs in cerebral vessels</li>
            <li>Management: Artesunate + supportive care, intubation if GCS <8</li>
            <li>Prognosis: 15-20% mortality; 10-30% neurological sequelae in survivors</li>
          </ul>
          <h3>Severe Malarial Anemia:</h3>
          <ul>
            <li>Hgb <5 g/dL + parasitemia >10%</li>
            <li>Mechanism: Hemolysis + bone marrow suppression</li>
            <li>Management: Transfusion (target Hgb >7 g/dL), artesunate</li>
          </ul>
          <h3>Acute Kidney Injury:</h3>
          <ul>
            <li>Creatinine >3 mg/dL or oliguria</li>
            <li>Mechanism: Acute tubular necrosis from parasitemia</li>
            <li>Management: Fluid management, dialysis if needed</li>
          </ul>
          <h3>Lactic Acidosis:</h3>
          <ul>
            <li>pH <7.35 + lactate >5 mmol/L</li>
            <li>Ominous sign: High mortality</li>
            <li>Management: Artesunate, fluid resuscitation, supportive care</li>
          </ul>
          <h3>ICU Escalation Criteria:</h3>
          <ul>
            <li>Cerebral malaria (GCS ≤11)</li>
            <li>Respiratory failure (pulmonary edema, ARDS)</li>
            <li>Severe anemia (Hgb <3 g/dL)</li>
            <li>Acute kidney injury with oliguria</li>
            <li>Lactic acidosis</li>
          </ul>
        `,
        questions: [
          {
            question: "Cerebral malaria may require intubation when:",
            options: ["GCS <8 or failing to protect airway", "Mild fever only", "Normal mental status", "After oral ACT only"],
            correct: 0,
            explanation: "Protect airway when GCS low or deteriorating — ICU escalation.",
          },
          {
            question: "Severe malarial anaemia transfusion threshold includes Hgb:",
            options: ["<5 g/dL or symptomatic anaemia", ">12 g/dL always", "Never transfuse", "Only in adults"],
            correct: 0,
            explanation: "Transfuse when Hgb <5 g/dL or symptomatic with high parasitaemia.",
          },
          {
            question: "Lactic acidosis in severe malaria signals:",
            options: ["High mortality risk — escalate supportive care", "Mild illness", "Ready for discharge", "Normal metabolism"],
            correct: 0,
            explanation: "pH <7.35 + lactate >5 mmol/L is an ominous sign.",
          },
        ],
      },
    ],
    quiz: {
      title: 'Severe Malaria I Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Severe malaria is defined by ANY ONE of:',
          options: ['Fever only', 'Cerebral malaria (GCS ≤11), severe anemia (Hgb <5), AKI, or lactic acidosis', 'Cough only', 'Diarrhea only'],
          correct: 1,
          explanation: 'Severe malaria = any one criterion: cerebral malaria, severe anemia, AKI, pulmonary edema, hypoglycemia, lactic acidosis, or DIC.'
        },
        {
          question: 'Artesunate dose for severe malaria:',
          options: ['1 mg/kg', '3 mg/kg', '5 mg/kg', '10 mg/kg'],
          correct: 1,
          explanation: '3 mg/kg IV/IM at 0, 12, 24 hours (WHO) — then switch to oral ACT when stable.'
        },
        {
          question: 'Artesunate route of administration:',
          options: ['Oral only', 'IV only', 'IM preferred (faster absorption)', 'Subcutaneous'],
          correct: 2,
          explanation: 'IM preferred for artesunate (faster absorption than IV).'
        },
        {
          question: 'Cerebral malaria mortality:',
          options: ['<5%', '10-15%', '15-20%', '>30%'],
          correct: 2,
          explanation: 'Cerebral malaria mortality 15-20%; 10-30% neurological sequelae in survivors.'
        },
        {
          question: 'Parasitemia should decrease by what percentage every 48 hours on artesunate:',
          options: ['10%', '25%', '50%', '75%'],
          correct: 2,
          explanation: 'Parasitemia should decrease by 50% every 48 hours on artesunate (indicates treatment response).'
        },
        {
          question: 'Hypoglycemia in severe malaria occurs due to:',
          options: ['Hyperinsulinism', 'Parasite consumption + reduced hepatic gluconeogenesis', 'Fever only', 'Infection'],
          correct: 1,
          explanation: 'Malaria parasites consume glucose + reduce hepatic gluconeogenesis → severe hypoglycemia risk.'
        },
        {
          question: 'Severe malarial anemia is defined as:',
          options: ['Hgb <7 g/dL', 'Hgb <5 g/dL + parasitemia >10%', 'Hgb <10 g/dL', 'Hgb <3 g/dL only'],
          correct: 1,
          explanation: 'Severe malarial anemia = Hgb <5 g/dL + parasitemia >10%.'
        },
        {
          question: 'Transfusion threshold in severe malaria:',
          options: ['Hgb <7 g/dL', 'Hgb <5 g/dL or symptomatic', 'Hgb <3 g/dL', 'Never'],
          correct: 1,
          explanation: 'Transfuse if Hgb <5 g/dL or symptomatic anemia (tachycardia, altered mental status).'
        },
        {
          question: 'Lactic acidosis in severe malaria indicates:',
          options: ['Mild disease', 'Severe disease with high mortality', 'Viral infection', 'Bacterial infection'],
          correct: 1,
          explanation: 'Lactic acidosis (pH <7.35 + lactate >5) = ominous sign with high mortality in malaria.'
        },
        {
          question: 'Most severe Plasmodium species:',
          options: ['P. vivax', 'P. falciparum', 'P. ovale', 'P. malariae'],
          correct: 1,
          explanation: 'P. falciparum causes most severe disease and highest mortality.'
        }
      ]
    }
  },

  {
    id: 'severe-malaria-ii',
    title: 'Paediatric Severe Malaria II: Cerebral Malaria and Transfusion Management',
    level: 'advanced',
    duration: 60,
    price: 1200,
    prerequisite: 'severe-malaria-i',
    description: 'Manage cerebral malaria, severe anemia, and complications in low-resource settings.',
    modules: [
      {
        title: 'Module 1: Cerebral Malaria Pathophysiology & Management',
        duration: 20,
        content: `
          <h2>Cerebral Malaria</h2>
          <h3>Pathophysiology:</h3>
          <ul>
            <li>Sequestration: Infected RBCs adhere to cerebral endothelium</li>
            <li>Cytoadherence: Parasite antigens trigger inflammatory response</li>
            <li>Blood-brain barrier disruption: Leads to cerebral edema</li>
            <li>Result: Impaired consciousness, seizures, coma</li>
          </ul>
          <h3>Clinical Presentation:</h3>
          <ul>
            <li>GCS ≤11 (coma) + P. falciparum parasitemia</li>
            <li>Seizures (30-50% of cases)</li>
            <li>Posturing, abnormal reflexes</li>
            <li>Brainstem signs (if severe)</li>
          </ul>
          <h3>Artesunate Dosing in Cerebral Malaria:</h3>
          <ul>
            <li>Same as severe malaria: 3 mg/kg IV/IM at 0, 12, 24 hours</li>
            <li>Efficacy: 35% mortality reduction vs quinine</li>
            <li>Mechanism: Rapid parasite clearance reduces sequestration</li>
          </ul>
          <h3>Supportive Care for Cerebral Malaria:</h3>
          <ul>
            <li>Intubation: If GCS <8 (unable to protect airway)</li>
            <li>Seizure management: Diazepam 0.1 mg/kg IV, then phenytoin or phenobarbital</li>
            <li>Cerebral edema: Hypertonic saline (3%) 0.25-1 g/kg IV</li>
            <li>Glucose: Monitor in mmol/L; treat hypoglycaemia &lt;3.3 mmol/L</li>
            <li>Fever: Paracetamol 15 mg/kg Q4-6H</li>
          </ul>
        `,
        questions: [
          {
            question: "Cerebral malaria pathophysiology involves:",
            options: ["Sequestration of infected RBCs in cerebral vessels", "Only bacterial co-infection", "Isolated dehydration", "Normal perfusion always"],
            correct: 0,
            explanation: "Cytoadherence and sequestration cause impaired consciousness and oedema.",
          },
          {
            question: "Hypertonic saline for cerebral malaria oedema is:",
            options: ["3% saline 0.25–1 g/kg IV", "Oral fluids only", "Hypotonic dextrose bolus", "Never used"],
            correct: 0,
            explanation: "3% saline reduces cerebral oedema alongside artesunate and supportive care.",
          },
          {
            question: "Seizures occur in cerebral malaria in approximately:",
            options: ["30–50% of cases", "Never", "100% always", "Only adults"],
            correct: 0,
            explanation: "Treat seizures promptly — diazepam then second-line per SE protocol.",
          },
        ],
      },
      {
        title: 'Module 2: Severe Anemia & Transfusion Management',
        duration: 25,
        content: `
          <h2>Severe Malarial Anemia Management</h2>
          <h3>Transfusion Indications in Severe Malaria:</h3>
          <ul>
            <li><strong>Absolute:</strong> Hgb <5 g/dL (risk of cardiovascular collapse)</li>
            <li><strong>Relative:</strong> Hgb 5-7 g/dL + symptoms (tachycardia, altered mental status, respiratory distress)</li>
            <li><strong>Urgent:</strong> Hgb <3 g/dL (immediate transfusion)</li>
          </ul>
          <h3>Transfusion Strategy:</h3>
          <ul>
            <li><strong>Blood type:</strong> O-negative if type unknown (universal donor)</li>
            <li><strong>Volume:</strong> 10-15 mL/kg per unit (target Hgb 7-8 g/dL)</li>
            <li><strong>Rate:</strong> Slow infusion (1-2 hours) to avoid volume overload</li>
            <li><strong>Monitoring:</strong> Watch for pulmonary edema, cardiac overload</li>
          </ul>
          <h3>Exchange Transfusion Consideration:</h3>
          <ul>
            <li>Indicated if parasitemia >15% + severe anemia (Hgb <5)</li>
            <li>Goal: Remove infected RBCs + correct anemia</li>
            <li>Process: Remove 10-15 mL/kg blood, replace with fresh blood</li>
            <li>Requires ICU-level care and blood bank support</li>
          </ul>
          <h3>Complications of Transfusion in Malaria:</h3>
          <ul>
            <li>Pulmonary edema: From volume overload (common in severe malaria)</li>
            <li>Transfusion reaction: Fever, hemoglobinuria</li>
            <li>Hemolysis: From incompatible blood</li>
          </ul>
        `,
        questions: [
          {
            question: "Exchange transfusion may be considered when parasitaemia is:",
            options: [">15% with severe anaemia (Hgb <5)", "<1% always", "Any level without symptoms", "Never in children"],
            correct: 0,
            explanation: "Exchange transfusion removes infected RBCs — ICU and blood bank support needed.",
          },
          {
            question: "Transfusion volume per unit in severe malaria is typically:",
            options: ["10–15 mL/kg slowly over 1–2 hours", "50 mL/kg rapid push", "Oral iron only", "No monitoring"],
            correct: 0,
            explanation: "Slow transfusion reduces pulmonary oedema risk in severe malaria.",
          },
          {
            question: "Urgent transfusion in malaria is indicated when Hgb is:",
            options: ["<3 g/dL", ">12 g/dL", "Exactly 10 g/dL always", "Never indicated"],
            correct: 0,
            explanation: "Hgb <3 g/dL needs immediate transfusion — high cardiovascular collapse risk.",
          },
        ],
      },
      {
        title: 'Module 3: Complications & Long-Term Outcomes',
        duration: 15,
        content: `
          <h2>Severe Malaria Complications & Outcomes</h2>
          <h3>Acute Kidney Injury (AKI):</h3>
          <ul>
            <li>Creatinine >3 mg/dL or oliguria (<1 mL/kg/hr)</li>
            <li>Mechanism: Acute tubular necrosis from parasitemia + hemolysis</li>
            <li>Management: Fluid management (avoid overload), dialysis if needed</li>
            <li>Prognosis: 50% mortality if dialysis required</li>
          </ul>
          <h3>Pulmonary Edema & ARDS:</h3>
          <ul>
            <li>Occurs in 5-10% of severe malaria</li>
            <li>Risk factors: Transfusion, fluid overload, sepsis</li>
            <li>Management: Diuretics (furosemide 1 mg/kg IV), oxygen, intubation if needed</li>
          </ul>
          <h3>DIC (Disseminated Intravascular Coagulation):</h3>
          <ul>
            <li>Prolonged PT/PTT, low platelets, low fibrinogen</li>
            <li>Management: Fresh frozen plasma, platelets, supportive care</li>
          </ul>
          <h3>Neurological Sequelae (Post-Cerebral Malaria):</h3>
          <ul>
            <li>Cognitive impairment: 10-30% of survivors</li>
            <li>Seizure disorder: 5-10% develop post-malaria epilepsy</li>
            <li>Motor deficits: Rare but can occur</li>
            <li>Rehabilitation: Neuropsychological assessment, seizure management</li>
          </ul>
          <h3>Overall Mortality & Outcomes:</h3>
          <ul>
            <li>Severe malaria mortality: 15-20% with artesunate</li>
            <li>Cerebral malaria mortality: 15-20%</li>
            <li>Severe anemia mortality: 5-10% (if transfused)</li>
            <li>Survivors: Most recover fully; 10-30% have neurological sequelae</li>
          </ul>
        `,
        questions: [
          {
            question: "Pulmonary oedema in severe malaria may be worsened by:",
            options: ["Over-transfusion and fluid overload", "Slow cautious fluids only", "Oxygen therapy", "Artesunate"],
            correct: 0,
            explanation: "Transfusion and aggressive fluids increase pulmonary oedema risk — monitor closely.",
          },
          {
            question: "Post-cerebral malaria cognitive impairment affects:",
            options: ["10–30% of survivors", "No survivors ever", "100% of all malaria", "Only adults"],
            correct: 0,
            explanation: "Neuropsychological follow-up needed for survivors of cerebral malaria.",
          },
          {
            question: "AKI in severe malaria with dialysis requirement has mortality around:",
            options: ["50%", "0%", "100% always", "Not related to outcome"],
            correct: 0,
            explanation: "AKI needing dialysis carries high mortality — optimise fluids and perfusion early.",
          },
        ],
      },
    ],
    quiz: {
      title: 'Severe Malaria II Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Cerebral malaria is characterized by:',
          options: ['Fever only', 'GCS ≤11 + P. falciparum parasitemia', 'Cough only', 'Diarrhea only'],
          correct: 1,
          explanation: 'Cerebral malaria = GCS ≤11 (coma) + P. falciparum parasitemia.'
        },
        {
          question: 'Transfusion indication in severe malaria:',
          options: ['Hgb <10 g/dL', 'Hgb <5 g/dL OR Hgb 5-7 + symptoms', 'Hgb <7 g/dL always', 'Never'],
          correct: 1,
          explanation: 'Transfuse if Hgb <5 g/dL (absolute) OR Hgb 5-7 with symptoms (tachycardia, altered mental status).'
        },
        {
          question: 'Exchange transfusion in malaria is indicated when:',
          options: ['Always', 'Parasitemia >15% + severe anemia (Hgb <5)', 'Never', 'Only with fever'],
          correct: 1,
          explanation: 'Exchange transfusion for parasitemia >15% + severe anemia (removes infected RBCs + corrects anemia).'
        },
        {
          question: 'Transfusion volume in severe malaria:',
          options: ['5 mL/kg', '10-15 mL/kg', '20-30 mL/kg', '>50 mL/kg'],
          correct: 1,
          explanation: '10-15 mL/kg per unit (target Hgb 7-8 g/dL). Slow infusion to avoid volume overload.'
        },
        {
          question: 'Seizure management in cerebral malaria:',
          options: ['Observation only', 'Diazepam 0.1 mg/kg IV, then phenytoin/phenobarbital', 'Aspirin only', 'No treatment'],
          correct: 1,
          explanation: 'Diazepam 0.1 mg/kg IV for seizures, then phenytoin or phenobarbital for prophylaxis.'
        },
        {
          question: 'AKI in severe malaria is caused by:',
          options: ['Infection only', 'Acute tubular necrosis from parasitemia + hemolysis', 'Fever only', 'Dehydration only'],
          correct: 1,
          explanation: 'AKI mechanism: acute tubular necrosis from parasitemia + hemolysis.'
        },
        {
          question: 'Pulmonary edema in severe malaria risk factor:',
          options: ['Fever only', 'Transfusion + fluid overload', 'Cough only', 'Diarrhea'],
          correct: 1,
          explanation: 'Pulmonary edema risk: transfusion, fluid overload, sepsis.'
        },
        {
          question: 'Neurological sequelae in cerebral malaria survivors:',
          options: ['<5%', '10-30%', '50%', '>70%'],
          correct: 1,
          explanation: '10-30% of cerebral malaria survivors have cognitive impairment or seizure disorder.'
        },
        {
          question: 'Artesunate reduces mortality in severe malaria by approximately:',
          options: ['35% compared with quinine', 'No benefit', '100% cure rate', 'Only in adults'],
          correct: 0,
          explanation: 'WHO: IV/IM artesunate preferred — ~35% mortality reduction vs quinine in severe malaria.'
        },
        {
          question: 'Post-malaria epilepsy occurs in:',
          options: ['<1%', '5-10%', '20-30%', '>50%'],
          correct: 1,
          explanation: '5-10% of cerebral malaria survivors develop post-malaria epilepsy.'
        }
      ]
    }
  },

  // ============================================
  // ACUTE KIDNEY INJURY I & II (Truncated)
  // ============================================

  {
    id: 'acute-kidney-injury-i',
    title: 'Paediatric Acute Kidney Injury I: Recognition and Management',
    level: 'foundational',
    duration: 45,
    price: 800,
    description: 'Recognize AKI and implement fluid management and monitoring in low-resource settings.',
    modules: [
      {
        title: 'Module 1: AKI Classification & Recognition',
        duration: 15,
        content: `
          <h2>Acute Kidney Injury Classification</h2>
          <h3>KDIGO Criteria (Stages 1-3):</h3>
          <ul>
            <li><strong>Stage 1:</strong> Creatinine 1.5-1.9× baseline OR urine output <0.5 mL/kg/hr × 6-8 hours</li>
            <li><strong>Stage 2:</strong> Creatinine 2-2.9× baseline OR urine output <0.5 mL/kg/hr × 16 hours</li>
            <li><strong>Stage 3:</strong> Creatinine ≥3× baseline OR urine output <0.3 mL/kg/hr × 24 hours OR anuria × 12 hours</li>
          </ul>
          <h3>AKI Causes (Prerenal, Intrinsic, Postrenal):</h3>
          <ul>
            <li><strong>Prerenal (60%):</strong> Dehydration, shock, sepsis</li>
            <li><strong>Intrinsic (35%):</strong> Acute tubular necrosis, glomerulonephritis, hemolytic uremic syndrome</li>
            <li><strong>Postrenal (5%):</strong> Obstruction (stones, tumor, stricture)</li>
          </ul>
          <h3>Clinical Presentation:</h3>
          <ul>
            <li>Oliguria: <1 mL/kg/hr (or <0.5 mL/kg/hr in severe)</li>
            <li>Elevated creatinine, BUN</li>
            <li>Hyperkalemia (K+ >5.5 mEq/L)</li>
            <li>Metabolic acidosis</li>
            <li>Hypertension (from fluid overload)</li>
          </ul>
        `,
        questions: [
          {
            question: "KDIGO AKI Stage 1 includes creatinine rise to:",
            options: ["1.5–1.9× baseline OR urine output <0.5 mL/kg/hr for 6–8 h", "Normal creatinine only", "10× baseline always", "No urine output criteria"],
            correct: 0,
            explanation: "Stage 1: creatinine 1.5–1.9× baseline or oliguria 6–8 h.",
          },
          {
            question: "The most common AKI category in children is:",
            options: ["Prerenal (~60%)", "Postrenal (~60%)", "Always congenital", "Never from dehydration"],
            correct: 0,
            explanation: "Prerenal AKI from dehydration/shock often reverses with perfusion restoration.",
          },
          {
            question: "Oliguria in AKI is typically defined as:",
            options: ["<1 mL/kg/hr (or <0.5 mL/kg/hr in severe stages)", ">5 mL/kg/hr", "Exactly 2 mL/kg/hr always", "Not measured"],
            correct: 0,
            explanation: "Track urine output hourly — key KDIGO criterion.",
          },
        ],
      },
      {
        title: 'Module 2: Fluid Management & Monitoring',
        duration: 20,
        content: `
          <h2>AKI Management</h2>
          <h3>Fluid Assessment:</h3>
          <ul>
            <li>Determine volume status: euvolemic, hypovolemic, or hypervolemic</li>
            <li>Hypovolemic: Give fluid bolus 10-20 mL/kg</li>
            <li>Euvolemic/Hypervolemic: Restrict fluids (maintenance only)</li>
          </ul>
          <h3>Fluid Restriction in AKI:</h3>
          <ul>
            <li>Insensible losses only (400-600 mL/m²/day)</li>
            <li>Plus measured urine output (mL-for-mL replacement)</li>
            <li>Avoid overload (risk of pulmonary edema, hypertension)</li>
          </ul>
          <h3>Electrolyte Management:</h3>
          <ul>
            <li><strong>Hyperkalemia:</strong> K+ >5.5 mEq/L → restrict K+ intake, give calcium gluconate, insulin + glucose</li>
            <li><strong>Hyponatremia:</strong> Fluid restriction</li>
            <li><strong>Acidosis:</strong> Sodium bicarbonate if severe (pH <7.2)</li>
          </ul>
          <h3>Monitoring Parameters:</h3>
          <ul>
            <li>Urine output: Every 4-6 hours</li>
            <li>Creatinine: Daily</li>
            <li>Electrolytes: Daily (K+, Na+, Cl-, HCO3)</li>
            <li>Blood pressure: Monitor for hypertension</li>
          </ul>
        `,
        questions: [
          {
            question: "Hypovolaemic AKI may receive a cautious bolus of:",
            options: ["10–20 mL/kg with reassessment", "100 mL/kg without monitoring", "No fluids ever", "Hypotonic dextrose only"],
            correct: 0,
            explanation: "Prerenal AKI may respond to small bolus if truly hypovolaemic.",
          },
          {
            question: "Hypervolaemic AKI fluid prescription should:",
            options: ["Restrict to insensible losses plus urine output", "Double maintenance always", "Ad lib oral intake", "Ignore weight gain"],
            correct: 0,
            explanation: "Restrict fluids when overloaded — insensible + mL-for-mL urine replacement.",
          },
          {
            question: "Hyperkalaemia in AKI with ECG changes needs first:",
            options: ["Calcium gluconate IV for cardiac membrane stabilisation", "KCl IV push", "Oral potassium load", "Discharge"],
            correct: 0,
            explanation: "Calcium gluconate stabilises myocardium — then insulin/glucose and RRT if needed.",
          },
        ],
      },
      {
        title: 'Module 3: Dialysis Indications & Complications',
        duration: 10,
        content: `
          <h2>AKI Complications & Dialysis</h2>
          <h3>Dialysis Indications:</h3>
          <ul>
            <li>K+ >6.5 mEq/L unresponsive to medical management</li>
            <li>Severe acidosis (pH <7.1)</li>
            <li>Fluid overload (pulmonary edema, hypertension)</li>
            <li>Uremia (BUN >100 mg/dL, altered mental status)</li>
          </ul>
          <h3>Dialysis Options:</h3>
          <ul>
            <li><strong>Hemodialysis:</strong> Rapid solute removal; requires vascular access</li>
            <li><strong>Peritoneal dialysis:</strong> Slower but feasible in low-resource settings</li>
            <li><strong>CRRT:</strong> Continuous renal replacement therapy (requires ICU)</li>
          </ul>
          <h3>AKI Complications:</h3>
          <ul>
            <li>Hyperkalemia: Cardiac arrhythmias, cardiac arrest</li>
            <li>Pulmonary edema: From fluid overload</li>
            <li>Uremia: Altered mental status, seizures</li>
            <li>Infection: From uremia + immunosuppression</li>
          </ul>
          <h3>Prognosis:</h3>
          <ul>
            <li>Prerenal AKI: 90% recover with fluid resuscitation</li>
            <li>Intrinsic AKI: 50-70% recover; some progress to chronic kidney disease</li>
            <li>Mortality: 10-30% (depends on underlying cause)</li>
          </ul>
        `,
        questions: [
          {
            question: "Dialysis is indicated in AKI when potassium is:",
            options: [">6.5 mEq/L unresponsive to medical management", "<3.0 always", "Exactly 4.0 only", "Never measured"],
            correct: 0,
            explanation: "Refractory hyperkalaemia is a classic RRT indication.",
          },
          {
            question: "Peritoneal dialysis in LMIC settings is valuable because:",
            options: ["It can be performed where haemodialysis is unavailable", "It is never safe in children", "It replaces all medical management", "It avoids any monitoring"],
            correct: 0,
            explanation: "PD is an LMIC option when HD/CRRT unavailable — per local capability.",
          },
          {
            question: "Prerenal AKI recovery rate with timely fluid resuscitation is approximately:",
            options: ["~90%", "10%", "0%", "Only with transplant"],
            correct: 0,
            explanation: "Most prerenal AKI reverses when perfusion is restored promptly.",
          },
        ],
      },
    ],
    quiz: {
      title: 'Acute Kidney Injury I Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'KDIGO Stage 3 AKI is defined as:',
          options: ['Creatinine 1.5-1.9× baseline', 'Creatinine ≥3× baseline OR oliguria <0.3 mL/kg/hr × 24 hours', 'Creatinine 2-2.9× baseline', 'Any elevated creatinine'],
          correct: 1,
          explanation: 'Stage 3 AKI: creatinine ≥3× baseline OR urine output <0.3 mL/kg/hr × 24 hours OR anuria × 12 hours.'
        },
        {
          question: 'Most common cause of AKI in children:',
          options: ['Obstruction', 'Prerenal (dehydration, shock)', 'Glomerulonephritis', 'Infection'],
          correct: 1,
          explanation: 'Prerenal AKI (60%): dehydration, shock, sepsis.'
        },
        {
          question: 'Fluid management in euvolemic AKI:',
          options: ['Aggressive fluid bolus', 'Fluid restriction (maintenance only)', 'No fluids', 'High-volume fluids'],
          correct: 1,
          explanation: 'Euvolemic AKI: restrict fluids to insensible losses + measured urine output.'
        },
        {
          question: 'Hyperkalemia (K+ >6.5) management in AKI:',
          options: ['Increase K+ intake', 'Restrict K+ + calcium gluconate + insulin + glucose', 'Observation only', 'Diuretics only'],
          correct: 1,
          explanation: 'Hyperkalemia: restrict K+ intake, give calcium gluconate (cardiac protection), insulin + glucose (shift K+ intracellularly).'
        },
        {
          question: 'Dialysis indication in AKI:',
          options: ['Never', 'K+ >6.5 unresponsive OR severe acidosis OR fluid overload', 'Always', 'Only with fever'],
          correct: 1,
          explanation: 'Dialysis indicated for K+ >6.5, pH <7.1, fluid overload, or uremia.'
        },
        {
          question: 'Prerenal AKI recovery rate:',
          options: ['<30%', '50-70%', '90%', '>95%'],
          correct: 2,
          explanation: 'Prerenal AKI: 90% recover with fluid resuscitation.'
        },
        {
          question: 'Oliguria definition in AKI:',
          options: ['>2 mL/kg/hr', '1-2 mL/kg/hr', '<1 mL/kg/hr', '>5 mL/kg/hr'],
          correct: 2,
          explanation: 'Oliguria <1 mL/kg/hr; severe oliguria <0.5 mL/kg/hr.'
        },
        {
          question: 'Fluid restriction in AKI target:',
          options: ['Maintenance × 2', 'Maintenance only', 'Maintenance × 1.5', 'No restriction'],
          correct: 1,
          explanation: 'Restrict to insensible losses (400-600 mL/m²/day) + measured urine output.'
        },
        {
          question: 'Intrinsic AKI recovery rate:',
          options: ['<30%', '50-70%', '90%', '>95%'],
          correct: 1,
          explanation: 'Intrinsic AKI: 50-70% recover; some progress to chronic kidney disease.'
        },
        {
          question: 'AKI mortality:',
          options: ['<5%', '10-30%', '50%', '>70%'],
          correct: 1,
          explanation: 'AKI mortality 10-30% (depends on underlying cause and severity).'
        }
      ]
    }
  },

  // ============================================
  // SEVERE ANAEMIA I & II (Truncated)
  // ============================================

  {
    id: 'severe-anaemia-i',
    title: 'Paediatric Severe Anaemia I: Recognition and Transfusion',
    level: 'foundational',
    duration: 45,
    price: 800,
    description: 'Recognize severe anemia and implement safe transfusion in low-resource settings.',
    modules: [
      {
        title: 'Module 1: Severe Anemia Recognition',
        duration: 15,
        content: `
          <h2>Severe Anemia Recognition</h2>
          <h3>Hemoglobin Thresholds by Age:</h3>
          <ul>
            <li><strong>Severe anemia:</strong> Hgb <5 g/dL (any age)</li>
            <li><strong>Moderate anemia:</strong> Hgb 5-7 g/dL</li>
            <li><strong>Mild anemia:</strong> Hgb 7-10 g/dL</li>
          </ul>
          <h3>Clinical Presentation:</h3>
          <ul>
            <li>Pallor (conjunctiva, palms, soles)</li>
            <li>Tachycardia, tachypnea</li>
            <li>Lethargy, altered mental status</li>
            <li>Syncope or presyncope</li>
            <li>Heart murmur (high-output)</li>
          </ul>
          <h3>Common Causes in Children:</h3>
          <ul>
            <li>Malaria (hemolysis)</li>
            <li>Severe malnutrition</li>
            <li>Bleeding (GI, trauma)</li>
            <li>Hemolytic disease (sickle cell, G6PD)</li>
            <li>Bone marrow suppression (infection, leukemia)</li>
          </ul>
        `,
        questions: [
          {
            question: "Severe anaemia in children is defined as Hgb:",
            options: ["<5 g/dL", "<10 g/dL always", ">12 g/dL", "Not measurable"],
            correct: 0,
            explanation: "Severe anaemia = Hgb <5 g/dL at any age.",
          },
          {
            question: "Clinical signs of severe anaemia include:",
            options: ["Pallor, tachycardia, and lethargy", "Only fever", "Normal heart rate always", "Hyperpigmentation"],
            correct: 0,
            explanation: "Pallor, tachycardia, tachypnoea, and altered mental status are key signs.",
          },
          {
            question: "Malaria is a common cause of severe anaemia through:",
            options: ["Haemolysis and bone marrow suppression", "Isolated dehydration only", "Normal RBC production", "Vitamin D deficiency only"],
            correct: 0,
            explanation: "Malaria causes haemolysis — treat malaria alongside transfusion when indicated.",
          },
        ],
      },
      {
        title: 'Module 2: Transfusion Management',
        duration: 20,
        content: `
          <h2>Transfusion in Severe Anemia</h2>
          <h3>Transfusion Indications:</h3>
          <ul>
            <li><strong>Absolute:</strong> Hgb <5 g/dL (risk of cardiovascular collapse)</li>
            <li><strong>Relative:</strong> Hgb 5-7 g/dL + symptoms (tachycardia, altered mental status, respiratory distress)</li>
            <li><strong>Urgent:</strong> Hgb <3 g/dL (immediate transfusion)</li>
          </ul>
          <h3>Transfusion Volume & Rate:</h3>
          <ul>
            <li><strong>Volume:</strong> 10-15 mL/kg per unit (target Hgb 7-8 g/dL)</li>
            <li><strong>Rate:</strong> Slow infusion (1-2 hours) to avoid volume overload</li>
            <li><strong>Monitoring:</strong> Watch for pulmonary edema, cardiac overload</li>
          </ul>
          <h3>Blood Type Selection:</h3>
          <ul>
            <li><strong>Type & cross:</strong> Preferred if available</li>
            <li><strong>O-negative:</strong> Universal donor if type unknown</li>
            <li><strong>Avoid:</strong> Incompatible blood (risk of hemolytic reaction)</li>
          </ul>
          <h3>Transfusion Reactions:</h3>
          <ul>
            <li>Fever, chills, hemoglobinuria</li>
            <li>Allergic: urticaria, angioedema</li>
            <li>Anaphylaxis: rare but life-threatening</li>
          </ul>
        `,
        questions: [
          {
            question: "Urgent transfusion in severe anaemia is indicated when Hgb is:",
            options: ["<3 g/dL", ">12 g/dL", "Exactly 7 g/dL always", "Never in children"],
            correct: 0,
            explanation: "Hgb <3 g/dL requires immediate transfusion — high collapse risk.",
          },
          {
            question: "If blood type is unknown in emergency transfusion, use:",
            options: ["O-negative (universal donor)", "AB-positive only", "Any available without crossmatch ever", "No transfusion"],
            correct: 0,
            explanation: "O-negative for emergency when type unknown — prefer type and cross when time allows.",
          },
          {
            question: "Transfusion should be infused slowly over:",
            options: ["1–2 hours with monitoring for overload", "5 minutes push", "24 hours without observation", "Oral route only"],
            correct: 0,
            explanation: "10–15 mL/kg over 1–2 h — watch for pulmonary oedema.",
          },
        ],
      },
      {
        title: 'Module 3: Complications & Prevention',
        duration: 10,
        content: `
          <h2>Anemia Complications & Prevention</h2>
          <h3>Transfusion Complications:</h3>
          <ul>
            <li>Pulmonary edema: From volume overload</li>
            <li>Transfusion reaction: Fever, hemoglobinuria</li>
            <li>Iron overload: With repeated transfusions</li>
            <li>Infection: From contaminated blood</li>
          </ul>
          <h3>Underlying Cause Management:</h3>
          <ul>
            <li>Malaria: Artesunate + transfusion</li>
            <li>Bleeding: Control source + transfusion</li>
            <li>Hemolysis: Treat underlying cause (sickle cell crisis, G6PD)</li>
            <li>Bone marrow suppression: Treat infection, consider chemotherapy</li>
          </ul>
          <h3>Iron Supplementation:</h3>
          <ul>
            <li>After acute phase: Iron supplementation (ferrous sulfate 3-6 mg/kg/day)</li>
            <li>Vitamin C: Enhances iron absorption</li>
            <li>Dietary counseling: Iron-rich foods (meat, beans, fortified cereals)</li>
          </ul>
          <h3>Prevention:</h3>
          <ul>
            <li>Malaria prevention: Bed nets, prophylaxis</li>
            <li>Nutritional support: Adequate protein, micronutrients</li>
            <li>Infection prevention: Vaccination, hygiene</li>
          </ul>
        `,
        questions: [
          {
            question: "After acute severe anaemia stabilisation, iron supplementation may use:",
            options: ["Ferrous sulfate 3–6 mg/kg/day elemental iron", "IV iron push", "No iron ever", "Only transfusion long-term"],
            correct: 0,
            explanation: "Oral iron after acute phase — vitamin C enhances absorption.",
          },
          {
            question: "Underlying malaria with severe anaemia requires:",
            options: ["Artesunate plus transfusion per thresholds", "Transfusion alone always", "No antimalarial", "Discharge without treatment"],
            correct: 0,
            explanation: "Treat malaria and anaemia together — transfuse per Hgb/symptom thresholds.",
          },
          {
            question: "Transfusion-related pulmonary oedema is prevented by:",
            options: ["Slow transfusion volume and careful monitoring", "Rapid large-volume push", "No Foley or weight chart", "Hypertonic fluids"],
            correct: 0,
            explanation: "Slow 10–15 mL/kg with monitoring reduces volume overload in severe anaemia.",
          },
        ],
      },
    ],
    quiz: {
      title: 'Severe Anaemia I Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Severe anemia is defined as:',
          options: ['Hgb <7 g/dL', 'Hgb <5 g/dL', 'Hgb <10 g/dL', 'Hgb <3 g/dL'],
          correct: 1,
          explanation: 'Severe anemia = Hgb <5 g/dL (any age).'
        },
        {
          question: 'Transfusion indication in severe anemia:',
          options: ['Hgb <10 g/dL', 'Hgb <5 g/dL OR Hgb 5-7 + symptoms', 'Hgb <7 g/dL always', 'Never'],
          correct: 1,
          explanation: 'Transfuse if Hgb <5 g/dL (absolute) OR Hgb 5-7 with symptoms.'
        },
        {
          question: 'Transfusion volume in severe anemia:',
          options: ['5 mL/kg', '10-15 mL/kg', '20-30 mL/kg', '>50 mL/kg'],
          correct: 1,
          explanation: '10-15 mL/kg per unit (target Hgb 7-8 g/dL).'
        },
        {
          question: 'Transfusion rate in severe anemia:',
          options: ['Rapid infusion', 'Slow infusion (1-2 hours)', 'Very slow (>4 hours)', 'No time limit'],
          correct: 1,
          explanation: 'Slow infusion (1-2 hours) to avoid volume overload and pulmonary edema.'
        },
        {
          question: 'Universal donor blood type:',
          options: ['A+', 'B+', 'O-', 'AB+'],
          correct: 2,
          explanation: 'O-negative is universal donor (no A/B antigens, no Rh antigen).'
        },
        {
          question: 'Most common cause of severe anemia in children (low-resource):',
          options: ['Leukemia', 'Malaria (hemolysis)', 'Sickle cell', 'Infection'],
          correct: 1,
          explanation: 'Malaria is leading cause of severe anemia in endemic areas (hemolysis).'
        },
        {
          question: 'Clinical sign of severe anemia:',
          options: ['Hypertension', 'Bradycardia', 'Tachycardia + altered mental status', 'Fever'],
          correct: 2,
          explanation: 'Severe anemia: tachycardia, tachypnea, lethargy, altered mental status (high-output state).'
        },
        {
          question: 'Transfusion reaction signs:',
          options: ['Hypothermia', 'Fever + chills + hemoglobinuria', 'Hypoglycemia', 'Bradycardia'],
          correct: 1,
          explanation: 'Transfusion reaction: fever, chills, hemoglobinuria (hemolytic reaction).'
        },
        {
          question: 'Iron supplementation after acute anemia:',
          options: ['Never', 'Ferrous sulfate 3-6 mg/kg/day + vitamin C', 'Always IV iron', 'High-dose transfusion'],
          correct: 1,
          explanation: 'Ferrous sulfate 3-6 mg/kg/day + vitamin C (enhances absorption).'
        },
        {
          question: 'Pulmonary edema risk in transfusion:',
          options: ['Rare', 'From rapid/high-volume infusion in severe anemia', 'Never occurs', 'Only with fever'],
          correct: 1,
          explanation: 'Pulmonary edema risk from rapid infusion or volume overload in severe anemia.'
        }
      ]
    }
  }
];

export default microCoursesFinalBatch;
