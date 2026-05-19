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

export const microCoursesFinalBatch = [
  // ============================================
  // SEVERE MALARIA I & II
  // ============================================

  {
    id: 'severe-malaria-i',
    title: 'Paediatric Severe Malaria I: Recognition and Artemether Therapy',
    level: 'foundational',
    duration: 45,
    price: 800,
    description: 'Recognize severe malaria and administer artemether in low-resource settings.',
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
            <li>Severe hypoglycemia: <40 mg/dL</li>
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
        `
      },
      {
        title: 'Module 2: Artemether Therapy & Supportive Care',
        duration: 20,
        content: `
          <h2>Severe Malaria Treatment</h2>
          <h3>Artemether (First-Line for Severe Malaria):</h3>
          <ul>
            <li><strong>Dose:</strong> 3.2 mg/kg IM or IV at 0, 24, 48 hours</li>
            <li><strong>Route:</strong> IM preferred (faster absorption than IV)</li>
            <li><strong>Efficacy:</strong> 35% reduction in mortality vs quinine</li>
            <li><strong>Mechanism:</strong> Rapid parasite clearance, reduces sequestration</li>
          </ul>
          <h3>Artemether Dosing Example:</h3>
          <ul>
            <li>20 kg child: 3.2 × 20 = 64 mg IM at 0, 24, 48 hours</li>
            <li>Then switch to oral artemisinin-based combination therapy (ACT) when tolerable</li>
          </ul>
          <h3>Supportive Care:</h3>
          <ul>
            <li><strong>Oxygen:</strong> Target SpO2 >94%</li>
            <li><strong>Fluids:</strong> Careful fluid management (avoid pulmonary edema)</li>
            <li><strong>Glucose:</strong> Monitor closely; treat hypoglycemia <40 mg/dL with 0.5 g/kg dextrose</li>
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
        `
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
            <li>Management: Artemether + supportive care, intubation if GCS <8</li>
            <li>Prognosis: 15-20% mortality; 10-30% neurological sequelae in survivors</li>
          </ul>
          <h3>Severe Malarial Anemia:</h3>
          <ul>
            <li>Hgb <5 g/dL + parasitemia >10%</li>
            <li>Mechanism: Hemolysis + bone marrow suppression</li>
            <li>Management: Transfusion (target Hgb >7 g/dL), artemether</li>
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
            <li>Management: Artemether, fluid resuscitation, supportive care</li>
          </ul>
          <h3>ICU Escalation Criteria:</h3>
          <ul>
            <li>Cerebral malaria (GCS ≤11)</li>
            <li>Respiratory failure (pulmonary edema, ARDS)</li>
            <li>Severe anemia (Hgb <3 g/dL)</li>
            <li>Acute kidney injury with oliguria</li>
            <li>Lactic acidosis</li>
          </ul>
        `
      }
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
          question: 'Artemether dose for severe malaria:',
          options: ['1 mg/kg', '3.2 mg/kg', '5 mg/kg', '10 mg/kg'],
          correct: 1,
          explanation: '3.2 mg/kg IM at 0, 24, 48 hours (then switch to oral ACT).'
        },
        {
          question: 'Artemether route of administration:',
          options: ['Oral only', 'IV only', 'IM preferred (faster absorption)', 'Subcutaneous'],
          correct: 2,
          explanation: 'IM preferred for artemether (faster absorption than IV).'
        },
        {
          question: 'Cerebral malaria mortality:',
          options: ['<5%', '10-15%', '15-20%', '>30%'],
          correct: 2,
          explanation: 'Cerebral malaria mortality 15-20%; 10-30% neurological sequelae in survivors.'
        },
        {
          question: 'Parasitemia should decrease by what percentage every 48 hours on artemether:',
          options: ['10%', '25%', '50%', '75%'],
          correct: 2,
          explanation: 'Parasitemia should decrease by 50% every 48 hours on artemether (indicates treatment response).'
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
          <h3>Artemether Dosing in Cerebral Malaria:</h3>
          <ul>
            <li>Same as severe malaria: 3.2 mg/kg IM at 0, 24, 48 hours</li>
            <li>Efficacy: 35% mortality reduction vs quinine</li>
            <li>Mechanism: Rapid parasite clearance reduces sequestration</li>
          </ul>
          <h3>Supportive Care for Cerebral Malaria:</h3>
          <ul>
            <li>Intubation: If GCS <8 (unable to protect airway)</li>
            <li>Seizure management: Diazepam 0.1 mg/kg IV, then phenytoin or phenobarbital</li>
            <li>Cerebral edema: Hypertonic saline (3%) 0.25-1 g/kg IV</li>
            <li>Glucose: Monitor closely, treat hypoglycemia <40 mg/dL</li>
            <li>Fever: Paracetamol 15 mg/kg Q4-6H</li>
          </ul>
        `
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
        `
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
            <li>Severe malaria mortality: 15-20% with artemether</li>
            <li>Cerebral malaria mortality: 15-20%</li>
            <li>Severe anemia mortality: 5-10% (if transfused)</li>
            <li>Survivors: Most recover fully; 10-30% have neurological sequelae</li>
          </ul>
        `
      }
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
          question: 'Cerebral malaria pathophysiology involves:',
          options: ['Infection only', 'Sequestration of infected RBCs + blood-brain barrier disruption', 'Fever only', 'Dehydration'],
          correct: 1,
          explanation: 'Infected RBCs sequester in cerebral vessels → cytoadherence → BBB disruption → cerebral edema.'
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
        `
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
        `
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
        `
      }
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
        `
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
        `
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
            <li>Malaria: Artemether + transfusion</li>
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
        `
      }
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
