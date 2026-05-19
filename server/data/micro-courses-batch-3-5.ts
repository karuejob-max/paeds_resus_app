/**
 * Micro-Courses Data: Batch 3-5 (12 courses)
 * PSOT §16: Complete 24-course learning ecosystem
 * 
 * Batch 3: Hypovolemic Shock I & II, Cardiogenic Shock I & II (4)
 * Batch 4: Meningitis I & II, Severe Malaria I & II (4)
 * Batch 5: Acute Kidney Injury I & II, Severe Anaemia I & II (4)
 */

export const microCoursesBatch3To5 = [
  // ============================================
  // BATCH 3: Hypovolemic Shock I & II, Cardiogenic Shock I & II
  // ============================================

  {
    id: 'hypovolemic-shock-i',
    title: 'Paediatric Hypovolemic Shock I: Recognition and Fluid Resuscitation',
    level: 'foundational',
    duration: 45,
    price: 800,
    description: 'Recognize hypovolemic shock and implement rapid fluid resuscitation in low-resource settings.',
    modules: [
      {
        title: 'Module 1: Shock Recognition & Classification',
        duration: 15,
        content: `
          <h2>Hypovolemic Shock Recognition</h2>
          <h3>Shock Definition:</h3>
          <p>Inadequate tissue perfusion → cellular hypoxia → organ dysfunction and death if untreated.</p>
          <h3>Hypovolemic Shock Causes:</h3>
          <ul>
            <li><strong>Hemorrhage:</strong> Trauma, GI bleeding, ruptured viscus</li>
            <li><strong>Dehydration:</strong> Diarrhea, vomiting, inadequate intake</li>
            <li><strong>Third-spacing:</strong> Burns, peritonitis, sepsis</li>
          </ul>
          <h3>Shock Stages (Compensated → Decompensated):</h3>
          <ul>
            <li><strong>Compensated:</strong> Tachycardia, normal BP, cool extremities, normal mental status</li>
            <li><strong>Decompensated:</strong> Hypotension, altered mental status, weak pulses, mottled skin</li>
            <li><strong>Irreversible:</strong> Profound hypotension, coma, multi-organ failure</li>
          </ul>
          <h3>Clinical Signs of Hypovolemic Shock:</h3>
          <ul>
            <li><strong>Cardiovascular:</strong> Tachycardia, weak pulses, delayed capillary refill (>2 sec), hypotension</li>
            <li><strong>Skin:</strong> Cool, clammy, mottled, pale</li>
            <li><strong>Neurological:</strong> Lethargy, confusion, altered mental status</li>
            <li><strong>Renal:</strong> Oliguria (<1 mL/kg/hr)</li>
          </ul>
          <h3>Severity Classification:</h3>
          <ul>
            <li><strong>Class 1:</strong> <15% blood volume loss (compensated)</li>
            <li><strong>Class 2:</strong> 15-30% loss (early decompensation)</li>
            <li><strong>Class 3:</strong> 30-40% loss (decompensated)</li>
            <li><strong>Class 4:</strong> >40% loss (irreversible)</li>
          </ul>
        `
      },
      {
        title: 'Module 2: Rapid Fluid Resuscitation',
        duration: 20,
        content: `
          <h2>Hypovolemic Shock Resuscitation</h2>
          <h3>Immediate Actions:</h3>
          <ul>
            <li>Establish 2 large-bore IVs (18G if possible)</li>
            <li>Draw labs: CBC, type & cross, coagulation, lactate</li>
            <li>Continuous monitoring: HR, BP, SpO2, RR</li>
            <li>Oxygen: target SpO2 >94%</li>
            <li>Assess for ongoing bleeding (control with direct pressure)</li>
          </ul>
          <h3>Fluid Bolus Protocol:</h3>
          <ul>
            <li><strong>Initial bolus:</strong> 20 mL/kg 0.9% NaCl IV over 15-20 min</li>
            <li><strong>Reassess:</strong> After 15 min</li>
            <li><strong>If improved:</strong> Continue maintenance + deficit replacement</li>
            <li><strong>If not improved:</strong> Repeat 20 mL/kg bolus (up to 60 mL/kg total)</li>
            <li><strong>If still not improved:</strong> Consider blood transfusion or vasopressors</li>
          </ul>
          <h3>Fluid Choice:</h3>
          <ul>
            <li><strong>First-line:</strong> 0.9% NaCl (isotonic, safe)</li>
            <li><strong>Avoid:</strong> Hypotonic fluids (0.45% NaCl, D5W) - worsen cerebral edema</li>
            <li><strong>Blood products:</strong> If hemorrhagic shock (target Hgb >7 g/dL)</li>
          </ul>
          <h3>Reassessment Parameters:</h3>
          <ul>
            <li>Heart rate: should decrease toward normal</li>
            <li>Capillary refill: should improve to <2 sec</li>
            <li>Mental status: should improve</li>
            <li>Urine output: target >1 mL/kg/hr</li>
            <li>Blood pressure: should normalize</li>
          </ul>
        `
      },
      {
        title: 'Module 3: Ongoing Management & Complications',
        duration: 10,
        content: `
          <h2>Hypovolemic Shock Management</h2>
          <h3>After Initial Resuscitation:</h3>
          <ul>
            <li><strong>Maintenance fluids:</strong> 1-1.5× maintenance rate</li>
            <li><strong>Deficit replacement:</strong> Over 24-48 hours (not first hour)</li>
            <li><strong>Ongoing losses:</strong> Replace mL-for-mL (diarrhea, vomiting)</li>
            <li><strong>Monitor:</strong> Urine output, electrolytes, lactate</li>
          </ul>
          <h3>Vasopressor Indications:</h3>
          <ul>
            <li>Persistent hypotension after 60 mL/kg fluid resuscitation</li>
            <li>Signs of organ dysfunction despite fluids</li>
            <li><strong>Agents:</strong> Dopamine 5-20 mcg/kg/min, epinephrine 0.1-1 mcg/kg/min</li>
          </ul>
          <h3>Hemorrhagic Shock Specifics:</h3>
          <ul>
            <li><strong>Permissive hypotension:</strong> Target SBP 50-60 mmHg (age <5) until bleeding controlled</li>
            <li><strong>Avoid over-resuscitation:</strong> Increases bleeding, dilutes clotting factors</li>
            <li><strong>Massive transfusion protocol:</strong> 1:1:1 (RBC:FFP:platelets) if >50% blood volume loss</li>
            <li><strong>Surgical consultation:</strong> Urgent if ongoing hemorrhage</li>
          </ul>
          <h3>Complications:</h3>
          <ul>
            <li>Acute kidney injury (from prolonged hypoperfusion)</li>
            <li>Disseminated intravascular coagulation (DIC)</li>
            <li>Multi-organ failure</li>
            <li>Death if not rapidly corrected</li>
          </ul>
        `
      }
    ],
    quiz: {
      title: 'Hypovolemic Shock I Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Hypovolemic shock is caused by:',
          options: ['Infection', 'Blood/fluid loss', 'Cardiac dysfunction', 'Neurological injury'],
          correct: 1,
          explanation: 'Hypovolemic shock = inadequate circulating volume from hemorrhage, dehydration, or third-spacing.'
        },
        {
          question: 'Initial fluid bolus for hypovolemic shock:',
          options: ['5 mL/kg', '10 mL/kg', '20 mL/kg', '50 mL/kg'],
          correct: 2,
          explanation: '20 mL/kg 0.9% NaCl IV over 15-20 min. Repeat if needed (up to 60 mL/kg total).'
        },
        {
          question: 'Capillary refill >2 sec indicates:',
          options: ['Normal perfusion', 'Mild dehydration', 'Shock (inadequate perfusion)', 'Fever'],
          correct: 2,
          explanation: 'Capillary refill >2 sec = delayed perfusion = shock. Target <2 sec.'
        },
        {
          question: 'Fluid choice for hypovolemic shock:',
          options: ['0.45% NaCl', '0.9% NaCl (isotonic)', 'D5W', 'Hypotonic fluids'],
          correct: 1,
          explanation: '0.9% NaCl is isotonic, safe, and first-line for hypovolemic shock.'
        },
        {
          question: 'If hypotension persists after 60 mL/kg fluids:',
          options: ['Give more fluids', 'Consider vasopressors', 'Discharge home', 'Wait 1 hour'],
          correct: 1,
          explanation: 'Persistent hypotension after 60 mL/kg = vasopressor indication (dopamine, epinephrine).'
        },
        {
          question: 'Target urine output in shock:',
          options: ['<0.5 mL/kg/hr', '>1 mL/kg/hr', '>2 mL/kg/hr', 'No urine output'],
          correct: 1,
          explanation: 'Target urine output >1 mL/kg/hr. Oliguria (<1 mL/kg/hr) indicates inadequate perfusion.'
        },
        {
          question: 'Permissive hypotension in hemorrhagic shock target SBP:',
          options: ['90-100 mmHg', '70-80 mmHg', '50-60 mmHg (age <5)', '30-40 mmHg'],
          correct: 2,
          explanation: 'Permissive hypotension 50-60 mmHg (age <5) until bleeding controlled. Avoids over-resuscitation.'
        },
        {
          question: 'Compensated shock is characterized by:',
          options: ['Hypotension', 'Tachycardia + normal BP + cool extremities', 'Coma', 'Bradycardia'],
          correct: 1,
          explanation: 'Compensated shock: tachycardia, normal BP, cool extremities, normal mental status.'
        },
        {
          question: 'Class 3 hypovolemic shock represents:',
          options: ['<15% blood volume loss', '15-30% loss', '30-40% loss', '>40% loss'],
          correct: 2,
          explanation: 'Class 3: 30-40% blood volume loss (decompensated shock).'
        },
        {
          question: 'Massive transfusion protocol ratio (RBC:FFP:platelets):',
          options: ['1:2:2', '1:1:1', '2:1:1', '1:1:2'],
          correct: 1,
          explanation: 'Massive transfusion protocol: 1:1:1 ratio for >50% blood volume loss.'
        }
      ]
    }
  },

  {
    id: 'hypovolemic-shock-ii',
    title: 'Paediatric Hypovolemic Shock II: Refractory Shock and Hemorrhage Control',
    level: 'advanced',
    duration: 60,
    price: 1200,
    prerequisite: 'hypovolemic-shock-i',
    description: 'Manage refractory shock, control massive hemorrhage, and prevent complications.',
    modules: [
      {
        title: 'Module 1: Refractory Shock Recognition & Escalation',
        duration: 20,
        content: `
          <h2>Refractory Hypovolemic Shock</h2>
          <h3>Definition:</h3>
          <p>Shock unresponsive to 60 mL/kg fluid resuscitation and requiring vasopressors or surgical intervention.</p>
          <h3>Red Flags for Refractory Shock:</h3>
          <ul>
            <li>Persistent hypotension after 60 mL/kg fluids</li>
            <li>Altered mental status despite resuscitation</li>
            <li>Oliguria (<0.5 mL/kg/hr) despite fluids</li>
            <li>Elevated lactate (>4 mmol/L) indicating anaerobic metabolism</li>
            <li>Signs of organ dysfunction (AKI, DIC, ARDS)</li>
          </ul>
          <h3>Causes of Refractory Shock:</h3>
          <ul>
            <li>Ongoing hemorrhage (not controlled)</li>
            <li>Massive transfusion (dilutional coagulopathy)</li>
            <li>Sepsis complicating hemorrhagic shock</li>
            <li>Cardiac tamponade or tension pneumothorax (if trauma)</li>
            <li>Severe acidosis or electrolyte derangement</li>
          </ul>
          <h3>Escalation Pathway:</h3>
          <ul>
            <li><strong>1st:</strong> 20 mL/kg fluid bolus</li>
            <li><strong>2nd:</strong> Repeat 20 mL/kg bolus if inadequate response</li>
            <li><strong>3rd:</strong> Repeat 20 mL/kg bolus (total 60 mL/kg)</li>
            <li><strong>If still inadequate:</strong> Vasopressors + surgical consultation</li>
          </ul>
        `
      },
      {
        title: 'Module 2: Vasopressor Management & Hemorrhage Control',
        duration: 25,
        content: `
          <h2>Refractory Shock Management</h2>
          <h3>Vasopressor Agents:</h3>
          <ul>
            <li><strong>Dopamine:</strong> 5-20 mcg/kg/min IV (dose-dependent: low=renal, mid=cardiac, high=vasoconstriction)</li>
            <li><strong>Epinephrine:</strong> 0.1-1 mcg/kg/min IV (potent alpha + beta effects)</li>
            <li><strong>Norepinephrine:</strong> 0.05-2 mcg/kg/min IV (primarily alpha, maintains BP)</li>
            <li><strong>Phenylephrine:</strong> 0.5-1.4 mcg/kg/min IV (pure alpha, if tachycardia problematic)</li>
          </ul>
          <h3>Vasopressor Titration:</h3>
          <ul>
            <li>Start low dose, increase every 5-10 min until BP normalized</li>
            <li>Target MAP >50 mmHg (age <5), >60 mmHg (age >5)</li>
            <li>Monitor: HR, BP, urine output, lactate</li>
            <li>Wean when BP stable and underlying cause corrected</li>
          </ul>
          <h3>Hemorrhage Control (Trauma):</h3>
          <ul>
            <li><strong>Direct pressure:</strong> Apply immediately to bleeding wound</li>
            <li><strong>Tourniquet:</strong> If limb bleeding uncontrolled by pressure (apply proximal to wound)</li>
            <li><strong>Packing:</strong> Gauze packing for deep wounds (abdomen, pelvis)</li>
            <li><strong>Surgical consultation:</strong> Urgent if ongoing hemorrhage</li>
            <li><strong>Permissive hypotension:</strong> Maintain SBP 50-60 mmHg until bleeding controlled (avoid over-resuscitation)</li>
          </ul>
          <h3>Coagulopathy Management:</h3>
          <ul>
            <li><strong>Monitor:</strong> PT, PTT, fibrinogen, platelet count</li>
            <li><strong>FFP:</strong> 10-15 mL/kg if PT/PTT prolonged</li>
            <li><strong>Platelets:</strong> 10 mL/kg if <50,000/μL</li>
            <li><strong>Cryoprecipitate:</strong> 1 unit/5 kg if fibrinogen <100 mg/dL</li>
            <li><strong>Tranexamic acid (TXA):</strong> 15 mg/kg IV (if available, within 3 hours of injury)</li>
          </ul>
        `
      },
      {
        title: 'Module 3: Complications & ICU Management',
        duration: 15,
        content: `
          <h2>Refractory Shock Complications</h2>
          <h3>Acute Kidney Injury (AKI):</h3>
          <ul>
            <li>Mechanism: Prolonged hypoperfusion → acute tubular necrosis</li>
            <li>Monitoring: Creatinine, BUN, urine output</li>
            <li>Management: Optimize perfusion, avoid nephrotoxic drugs</li>
            <li>Dialysis: If K+ >6.5, severe acidosis, or fluid overload</li>
          </ul>
          <h3>Disseminated Intravascular Coagulation (DIC):</h3>
          <ul>
            <li>Mechanism: Tissue factor release → widespread thrombosis + bleeding</li>
            <li>Diagnosis: Prolonged PT/PTT, low platelets, low fibrinogen, elevated D-dimer</li>
            <li>Management: Treat underlying cause, replace clotting factors, supportive care</li>
          </ul>
          <h3>ARDS (Acute Respiratory Distress Syndrome):</h3>
          <ul>
            <li>Risk: Prolonged shock → capillary leak → pulmonary edema</li>
            <li>Management: Lung-protective ventilation (6-8 mL/kg), PEEP 5-10 cm H2O</li>
          </ul>
          <h3>Multi-Organ Failure:</h3>
          <ul>
            <li>Cardiac: Cardiogenic shock, arrhythmias</li>
            <li>Hepatic: Elevated transaminases, coagulopathy</li>
            <li>Neurological: Altered mental status, seizures</li>
            <li>Management: ICU-level supportive care, address each organ system</li>
          </ul>
          <h3>Discharge Planning:</h3>
          <ul>
            <li>Gradual vasopressor weaning once bleeding controlled</li>
            <li>Monitor for infection (wound, line-related)</li>
            <li>Rehabilitation: Physical therapy for trauma survivors</li>
            <li>Psychological support for trauma-related PTSD</li>
          </ul>
        `
      }
    ],
    quiz: {
      title: 'Hypovolemic Shock II Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Refractory shock is defined as:',
          options: ['Any shock', 'Shock unresponsive to 60 mL/kg fluids', 'Shock with fever', 'Shock with tachycardia'],
          correct: 1,
          explanation: 'Refractory shock = shock unresponsive to 60 mL/kg fluid resuscitation.'
        },
        {
          question: 'First-line vasopressor for refractory shock:',
          options: ['Phenylephrine', 'Dopamine 5-20 mcg/kg/min', 'Atropine', 'Isoproterenol'],
          correct: 1,
          explanation: 'Dopamine 5-20 mcg/kg/min is first-line vasopressor for refractory shock.'
        },
        {
          question: 'Permissive hypotension target in hemorrhagic shock (age <5):',
          options: ['90-100 mmHg', '70-80 mmHg', '50-60 mmHg', '30-40 mmHg'],
          correct: 2,
          explanation: 'Permissive hypotension 50-60 mmHg until bleeding controlled. Avoids over-resuscitation.'
        },
        {
          question: 'Tranexamic acid (TXA) in hemorrhagic shock must be given within:',
          options: ['1 hour', '3 hours', '6 hours', '12 hours'],
          correct: 1,
          explanation: 'TXA 15 mg/kg IV within 3 hours of injury for maximum benefit.'
        },
        {
          question: 'Massive transfusion protocol is indicated when:',
          options: ['Any hemorrhage', '>50% blood volume loss', '<25% blood volume loss', 'Mild bleeding'],
          correct: 1,
          explanation: 'Massive transfusion protocol (1:1:1 RBC:FFP:platelets) for >50% blood volume loss.'
        },
        {
          question: 'Elevated lactate (>4 mmol/L) in shock indicates:',
          options: ['Infection only', 'Anaerobic metabolism (tissue hypoxia)', 'Hyperglycemia', 'Dehydration'],
          correct: 1,
          explanation: 'Elevated lactate = anaerobic metabolism from inadequate tissue perfusion.'
        },
        {
          question: 'Tourniquet application in hemorrhage should be:',
          options: ['Distal to wound', 'Proximal to wound', 'Over the wound', 'Never used'],
          correct: 1,
          explanation: 'Tourniquet applied proximal to bleeding wound to occlude blood flow.'
        },
        {
          question: 'FFP transfusion indication in refractory shock:',
          options: ['Never', 'If PT/PTT prolonged', 'Always', 'Only with fever'],
          correct: 1,
          explanation: 'FFP 10-15 mL/kg if PT/PTT prolonged (coagulopathy from massive transfusion).'
        },
        {
          question: 'DIC diagnosis includes:',
          options: ['Fever only', 'Prolonged PT/PTT + low platelets + low fibrinogen', 'Tachycardia only', 'Hypoglycemia'],
          correct: 1,
          explanation: 'DIC = prolonged PT/PTT, low platelets, low fibrinogen, elevated D-dimer.'
        },
        {
          question: 'Target MAP in refractory shock (age >5):',
          options: ['>40 mmHg', '>50 mmHg', '>60 mmHg', '>80 mmHg'],
          correct: 2,
          explanation: 'Target MAP >60 mmHg (age >5) during vasopressor therapy.'
        }
      ]
    }
  },

  {
    id: 'cardiogenic-shock-i',
    title: 'Paediatric Cardiogenic Shock I: Recognition and Initial Management',
    level: 'foundational',
    duration: 45,
    price: 800,
    description: 'Recognize cardiogenic shock and implement initial stabilization in low-resource settings.',
    modules: [
      {
        title: 'Module 1: Cardiogenic Shock Recognition',
        duration: 15,
        content: `
          <h2>Cardiogenic Shock Recognition</h2>
          <h3>Definition:</h3>
          <p>Shock from cardiac pump failure (inadequate cardiac output despite adequate preload).</p>
          <h3>Causes in Children:</h3>
          <ul>
            <li><strong>Myocarditis:</strong> Viral (enterovirus, adenovirus), bacterial, autoimmune</li>
            <li><strong>Congenital heart disease:</strong> Unrepaired or post-operative</li>
            <li><strong>Arrhythmias:</strong> SVT, ventricular tachycardia, bradycardia</li>
            <li><strong>Acute coronary syndrome:</strong> Rare in children (trauma, anomalous origin)</li>
            <li><strong>Septic cardiomyopathy:</strong> Sepsis with myocardial dysfunction</li>
            <li><strong>Medication-induced:</strong> Chemotherapy (anthracyclines), cocaine</li>
          </ul>
          <h3>Clinical Presentation:</h3>
          <ul>
            <li><strong>Cardiovascular:</strong> Hypotension, weak pulses, elevated JVP, hepatomegaly</li>
            <li><strong>Respiratory:</strong> Tachypnea, crackles (pulmonary edema), orthopnea</li>
            <li><strong>Neurological:</strong> Altered mental status, cool extremities</li>
            <li><strong>Renal:</strong> Oliguria</li>
          </ul>
          <h3>Differentiation from Hypovolemic Shock:</h3>
          <ul>
            <li><strong>Hypovolemic:</strong> Flat JVP, dry lungs, rapid capillary refill improvement with fluids</li>
            <li><strong>Cardiogenic:</strong> Elevated JVP, crackles, hepatomegaly, worsens with fluids</li>
          </ul>
          <h3>Diagnostic Clues:</h3>
          <ul>
            <li>Chest X-ray: Cardiomegaly, pulmonary edema (Kerley B lines)</li>
            <li>ECG: Arrhythmia, ischemic changes, low voltage</li>
            <li>Echocardiography: Reduced ejection fraction, wall motion abnormalities</li>
            <li>Troponin: Elevated (myocardial injury)</li>
          </ul>
        `
      },
      {
        title: 'Module 2: Initial Stabilization',
        duration: 20,
        content: `
          <h2>Cardiogenic Shock Management</h2>
          <h3>Immediate Actions:</h3>
          <ul>
            <li>Establish IV access (2 large-bore IVs)</li>
            <li>Continuous monitoring: HR, BP, SpO2, RR</li>
            <li>Oxygen: target SpO2 >94%</li>
            <li>Draw labs: ECG, troponin, BNP, lactate, electrolytes</li>
            <li>Echocardiography: assess cardiac function and structure</li>
          </ul>
          <h3>Fluid Management (CRITICAL - Different from Hypovolemic Shock):</h3>
          <ul>
            <li><strong>AVOID aggressive fluid boluses</strong> (worsen pulmonary edema)</li>
            <li><strong>Cautious fluids:</strong> 5-10 mL/kg only if hypotensive AND no pulmonary edema</li>
            <li><strong>Diuretics:</strong> Furosemide 1 mg/kg IV if pulmonary edema present</li>
            <li><strong>Fluid restriction:</strong> Maintenance fluids only (not 1.5×)</li>
          </ul>
          <h3>Vasopressor/Inotrope Therapy:</h3>
          <ul>
            <li><strong>Dopamine:</strong> 5-10 mcg/kg/min (inotropic effect, improves contractility)</li>
            <li><strong>Dobutamine:</strong> 5-20 mcg/kg/min (positive inotrope, vasodilator)</li>
            <li><strong>Milrinone:</strong> 0.5-0.75 mcg/kg/min (inodilator, reduces afterload)</li>
            <li><strong>Epinephrine:</strong> 0.05-0.5 mcg/kg/min (if severe hypotension)</li>
          </ul>
          <h3>Afterload Reduction:</h3>
          <ul>
            <li><strong>Nitroprusside:</strong> 0.5-10 mcg/kg/min (potent vasodilator, requires ICU monitoring)</li>
            <li><strong>Nitroglycerin:</strong> 0.5-10 mcg/kg/min (venous + arterial vasodilation)</li>
            <li><strong>ACE inhibitors:</strong> Enalapril 0.1 mg/kg/dose (chronic management)</li>
          </ul>
        `
      },
      {
        title: 'Module 3: Specific Conditions & Escalation',
        duration: 10,
        content: `
          <h2>Cardiogenic Shock Specific Management</h2>
          <h3>Myocarditis:</h3>
          <ul>
            <li>Viral prodrome (fever, cough, myalgias)</li>
            <li>Elevated troponin, ECG changes</li>
            <li>Management: Inotropes + afterload reduction, avoid NSAIDs</li>
            <li>Prognosis: Most recover with supportive care; some require ECMO</li>
          </ul>
          <h3>Arrhythmia-Induced Cardiogenic Shock:</h3>
          <ul>
            <li><strong>SVT:</strong> Adenosine 0.1 mg/kg IV (max 6 mg), then 0.2 mg/kg (max 12 mg)</li>
            <li><strong>Ventricular tachycardia:</strong> Amiodarone 5 mg/kg IV over 20-30 min</li>
            <li><strong>Bradycardia:</strong> Atropine 0.02 mg/kg IV (max 0.5 mg), then pacing if needed</li>
          </ul>
          <h3>Septic Cardiomyopathy:</h3>
          <ul>
            <li>Sepsis with reduced ejection fraction</li>
            <li>Management: Antibiotics + fluids + inotropes (as in septic shock)</li>
            <li>Prognosis: Depends on sepsis severity and underlying cardiac reserve</li>
          </ul>
          <h3>ICU Escalation Criteria:</h3>
          <ul>
            <li>Persistent hypotension despite inotropes</li>
            <li>Altered mental status</li>
            <li>Severe pulmonary edema (respiratory failure)</li>
            <li>Arrhythmias unresponsive to treatment</li>
            <li>Consider ECMO if refractory cardiogenic shock</li>
          </ul>
        `
      }
    ],
    quiz: {
      title: 'Cardiogenic Shock I Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Cardiogenic shock is caused by:',
          options: ['Blood loss', 'Cardiac pump failure', 'Infection only', 'Dehydration'],
          correct: 1,
          explanation: 'Cardiogenic shock = inadequate cardiac output from pump failure (myocarditis, CHD, arrhythmia, etc.).'
        },
        {
          question: 'Key difference from hypovolemic shock:',
          options: ['Elevated JVP and pulmonary edema', 'Flat JVP and dry lungs', 'Fever', 'Seizures'],
          correct: 0,
          explanation: 'Cardiogenic shock: elevated JVP, hepatomegaly, pulmonary edema. Hypovolemic: flat JVP, dry lungs.'
        },
        {
          question: 'Fluid management in cardiogenic shock:',
          options: ['Aggressive 20 mL/kg bolus', 'Cautious 5-10 mL/kg only if hypotensive', 'Fluid restriction', 'No fluids'],
          correct: 1,
          explanation: 'Avoid aggressive fluids (worsen pulmonary edema). Use cautious 5-10 mL/kg only if hypotensive AND no pulmonary edema.'
        },
        {
          question: 'First-line inotrope for cardiogenic shock:',
          options: ['Atropine', 'Dopamine 5-10 mcg/kg/min', 'Morphine', 'Nitroglycerin only'],
          correct: 1,
          explanation: 'Dopamine 5-10 mcg/kg/min improves contractility and perfusion.'
        },
        {
          question: 'Milrinone in cardiogenic shock works by:',
          options: ['Increasing heart rate', 'Inodilation (positive inotrope + vasodilation)', 'Vasoconstriction', 'Diuresis'],
          correct: 1,
          explanation: 'Milrinone = inodilator: improves contractility AND reduces afterload.'
        },
        {
          question: 'Adenosine dose for SVT in a 20 kg child:',
          options: ['0.2 mg', '2 mg', '20 mg', '200 mg'],
          correct: 1,
          explanation: '0.1 mg/kg = 0.1 × 20 = 2 mg IV rapid push, then 0.2 mg/kg = 4 mg if no response.'
        },
        {
          question: 'Diuretic indication in cardiogenic shock:',
          options: ['Never', 'If pulmonary edema present', 'Always', 'Only with fever'],
          correct: 1,
          explanation: 'Furosemide 1 mg/kg IV if pulmonary edema (crackles, orthopnea).'
        },
        {
          question: 'Chest X-ray findings in cardiogenic shock:',
          options: ['Normal', 'Cardiomegaly + pulmonary edema (Kerley B lines)', 'Pneumothorax', 'Atelectasis'],
          correct: 1,
          explanation: 'Cardiomegaly + pulmonary edema (Kerley B lines, interstitial infiltrates) on CXR.'
        },
        {
          question: 'Myocarditis is most commonly caused by:',
          options: ['Bacteria only', 'Viral (enterovirus, adenovirus)', 'Fungal', 'Parasitic'],
          correct: 1,
          explanation: 'Viral myocarditis (enterovirus, adenovirus) most common in children.'
        },
        {
          question: 'ECMO indication in cardiogenic shock:',
          options: ['All cases', 'Refractory shock despite maximal inotropes', 'Mild shock', 'Never'],
          correct: 1,
          explanation: 'ECMO for refractory cardiogenic shock unresponsive to inotropes and vasodilators.'
        }
      ]
    }
  },

  {
    id: 'cardiogenic-shock-ii',
    title: 'Paediatric Cardiogenic Shock II: Advanced Inotrope Management and ECMO',
    level: 'advanced',
    duration: 60,
    price: 1200,
    prerequisite: 'cardiogenic-shock-i',
    description: 'Manage refractory cardiogenic shock with advanced inotropes, vasodilators, and ECMO support.',
    modules: [
      {
        title: 'Module 1: Advanced Inotrope Combinations',
        duration: 20,
        content: `
          <h2>Refractory Cardiogenic Shock Management</h2>
          <h3>Inotrope Combinations for Refractory Shock:</h3>
          <ul>
            <li><strong>Dopamine + Dobutamine:</strong> Dopamine for BP, dobutamine for contractility</li>
            <li><strong>Dopamine + Milrinone:</strong> Dopamine for BP, milrinone for afterload reduction</li>
            <li><strong>Epinephrine + Milrinone:</strong> Epinephrine for severe hypotension, milrinone for afterload reduction</li>
            <li><strong>Triple therapy:</strong> Dopamine + dobutamine + milrinone (for severe refractory shock)</li>
          </ul>
          <h3>Afterload Reduction Agents:</h3>
          <ul>
            <li><strong>Nitroprusside:</strong> 0.5-10 mcg/kg/min (potent vasodilator, requires ICU, risk of cyanide toxicity)</li>
            <li><strong>Nitroglycerin:</strong> 0.5-10 mcg/kg/min (venous + arterial vasodilation, safer than nitroprusside)</li>
            <li><strong>Hydralazine:</strong> 0.1-0.2 mg/kg IV (arteriolar vasodilation, less titratable)</li>
          </ul>
          <h3>Monitoring During Inotrope Therapy:</h3>
          <ul>
            <li>Continuous cardiac monitoring (arrhythmia risk)</li>
            <li>Invasive BP monitoring (arterial line preferred)</li>
            <li>Echocardiography: serial assessment of cardiac function</li>
            <li>Lactate: trend toward normalization indicates improving perfusion</li>
            <li>Urine output: target >1 mL/kg/hr</li>
          </ul>
          <h3>Weaning Strategy:</h3>
          <ul>
            <li>Wean inotropes only when cardiac function improving</li>
            <li>Reduce highest dose agent first</li>
            <li>Decrease by 10-20% every 4-6 hours if tolerated</li>
            <li>Watch for rebound hypotension or decreased cardiac output</li>
          </ul>
        `
      },
      {
        title: 'Module 2: ECMO Support for Refractory Cardiogenic Shock',
        duration: 25,
        content: `
          <h2>ECMO in Cardiogenic Shock</h2>
          <h3>ECMO Indications:</h3>
          <ul>
            <li>Refractory cardiogenic shock despite maximal inotropes (≥3 agents) + vasodilators</li>
            <li>Cardiac output inadequate for organ perfusion (lactate rising, oliguria)</li>
            <li>Severe myocarditis with fulminant presentation</li>
            <li>Post-operative cardiogenic shock (after cardiac surgery)</li>
            <li>Acute coronary syndrome with cardiogenic shock</li>
          </ul>
          <h3>VA-ECMO (Veno-Arterial) for Cardiogenic Shock:</h3>
          <ul>
            <li><strong>Cannulation:</strong> Usually femoral (percutaneous or surgical)</li>
            <li><strong>Function:</strong> Provides systemic perfusion + oxygenation (replaces heart + lungs)</li>
            <li><strong>Flow:</strong> Target 100-150 mL/kg/min</li>
            <li><strong>Monitoring:</strong> Continuous hemodynamics, ABG, lactate, organ function</li>
          </ul>
          <h3>ECMO Management:</h3>
          <ul>
            <li><strong>Anticoagulation:</strong> Heparin to prevent thrombosis (target ACT 180-220 sec)</li>
            <li><strong>Sedation:</strong> Propofol or midazolam + fentanyl</li>
            <li><strong>Hemodynamic support:</strong> Minimal inotropes while on ECMO (allow heart to rest)</li>
            <li><strong>Ventilator settings:</strong> Lung-protective (low tidal volumes, PEEP 5-10)</li>
            <li><strong>Monitoring:</strong> Daily echocardiography to assess cardiac recovery</li>
          </ul>
          <h3>Weaning from ECMO:</h3>
          <ul>
            <li>Assess cardiac recovery: echocardiography shows improving ejection fraction</li>
            <li>Trial of reduced ECMO flow (gradual reduction)</li>
            <li>If cardiac output adequate off ECMO: decannulate</li>
            <li>If no recovery after 5-7 days: consider heart transplant or destination therapy</li>
          </ul>
        `
      },
      {
        title: 'Module 3: Specific Cardiogenic Shock Scenarios',
        duration: 15,
        content: `
          <h2>Specific Cardiogenic Shock Conditions</h2>
          <h3>Fulminant Myocarditis:</h3>
          <ul>
            <li>Rapid onset (hours to days) of severe cardiogenic shock</li>
            <li>Often viral prodrome</li>
            <li>Management: Aggressive inotropes + ECMO if refractory</li>
            <li>Prognosis: 50-80% recover with ECMO support; mortality high without ECMO</li>
          </ul>
          <h3>Acute Decompensation of Congenital Heart Disease:</h3>
          <ul>
            <li>Often triggered by infection, arrhythmia, or medication non-compliance</li>
            <li>Management: Inotropes + afterload reduction + arrhythmia management</li>
            <li>Cardiology consultation: assess need for surgical intervention</li>
          </ul>
          <h3>Post-Operative Cardiogenic Shock (After Cardiac Surgery):</h3>
          <ul>
            <li>Can occur immediately post-op or hours later</li>
            <li>Causes: Poor myocardial protection, residual lesion, arrhythmia</li>
            <li>Management: Inotropes + vasodilators; surgical re-exploration if mechanical issue</li>
            <li>ECMO: If refractory despite optimal medical management</li>
          </ul>
          <h3>Septic Cardiomyopathy:</h3>
          <ul>
            <li>Sepsis with myocardial dysfunction (reduced ejection fraction)</li>
            <li>Management: Antibiotics + fluids + inotropes (as in septic shock)</li>
            <li>Prognosis: Depends on sepsis severity; most recover with treatment</li>
          </ul>
          <h3>Long-Term Outcomes:</h3>
          <ul>
            <li>Myocarditis survivors: 80-90% recover normal cardiac function</li>
            <li>Fulminant myocarditis with ECMO: 60-70% survive without transplant</li>
            <li>Chronic heart failure: Some require long-term inotropes or transplant</li>
            <li>Rehabilitation: Gradual activity increase, medication compliance</li>
          </ul>
        `
      }
    ],
    quiz: {
      title: 'Cardiogenic Shock II Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Refractory cardiogenic shock requires:',
          options: ['Single inotrope', 'Maximal inotropes (≥3 agents) + vasodilators', 'Fluids only', 'No treatment'],
          correct: 1,
          explanation: 'Refractory = unresponsive to maximal inotropes (≥3 agents) + vasodilators.'
        },
        {
          question: 'Nitroprusside risk with prolonged use:',
          options: ['Hyperglycemia', 'Cyanide toxicity', 'Infection', 'Fever'],
          correct: 1,
          explanation: 'Nitroprusside risk of cyanide toxicity with prolonged use (>4 hours). Monitor thiocyanate levels.'
        },
        {
          question: 'VA-ECMO target flow in cardiogenic shock:',
          options: ['50 mL/kg/min', '100-150 mL/kg/min', '200 mL/kg/min', '>300 mL/kg/min'],
          correct: 1,
          explanation: 'VA-ECMO target flow 100-150 mL/kg/min for adequate systemic perfusion.'
        },
        {
          question: 'Anticoagulation target during ECMO:',
          options: ['ACT 100-120 sec', 'ACT 180-220 sec', 'ACT 300+ sec', 'No anticoagulation'],
          correct: 1,
          explanation: 'ECMO anticoagulation target ACT 180-220 sec (heparin) to prevent thrombosis.'
        },
        {
          question: 'Fulminant myocarditis mortality without ECMO:',
          options: ['<5%', '10-20%', '50-80%', '>90%'],
          correct: 2,
          explanation: 'Fulminant myocarditis mortality high without ECMO (50-80%); 60-70% survive with ECMO.'
        },
        {
          question: 'Weaning from ECMO is indicated when:',
          options: ['Immediately', 'Echocardiography shows improving ejection fraction', 'After 24 hours', 'Never'],
          correct: 1,
          explanation: 'Wean ECMO when cardiac function recovering (echocardiography shows improving EF).'
        },
        {
          question: 'Triple inotrope therapy includes:',
          options: ['Dopamine + dobutamine + milrinone', 'Dopamine + atropine + epinephrine', 'Dopamine + nitroglycerin + adenosine', 'Dopamine + morphine + oxygen'],
          correct: 0,
          explanation: 'Triple therapy: dopamine (BP) + dobutamine (contractility) + milrinone (afterload reduction).'
        },
        {
          question: 'Post-operative cardiogenic shock causes:',
          options: ['Infection only', 'Poor myocardial protection, residual lesion, arrhythmia', 'Fever only', 'Bleeding only'],
          correct: 1,
          explanation: 'Post-op cardiogenic shock: poor myocardial protection, residual lesion, arrhythmia.'
        },
        {
          question: 'Septic cardiomyopathy management includes:',
          options: ['Inotropes only', 'Antibiotics + fluids + inotropes', 'Antibiotics only', 'No treatment'],
          correct: 1,
          explanation: 'Septic cardiomyopathy: antibiotics (treat infection) + fluids + inotropes (as in septic shock).'
        },
        {
          question: 'Long-term cardiac function recovery in myocarditis survivors:',
          options: ['<10%', '30-50%', '80-90%', '>95%'],
          correct: 2,
          explanation: '80-90% of myocarditis survivors recover normal cardiac function with treatment.'
        }
      ]
    }
  }
];

export default microCoursesBatch3To5;
