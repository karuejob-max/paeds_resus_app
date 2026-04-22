/**
 * Fellowship Course Content Structure
 * 
 * All courses aligned to:
 * - AHA PALS 2025 Guidelines
 * - WHO IMCI (Integrated Management of Neonatal and Childhood Illness)
 * - ResusGPS ABCDE assessment framework
 * - Evidence-based pediatric resuscitation science
 */

export interface LearningObjective {
  id: string;
  text: string;
  bloomLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
}

export interface Module {
  id: string;
  courseId: string;
  moduleNumber: number;
  title: string;
  duration: number; // in minutes
  description: string;
  learningObjectives: LearningObjective[];
  content: string; // Markdown content
  keyPoints: string[];
  references: Reference[];
}

export interface Reference {
  title: string;
  source: string;
  year: number;
  url?: string;
}

export interface QuizQuestion {
  id: string;
  questionNumber: number;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  text: string;
  options?: string[]; // For multiple choice
  correctAnswer: string;
  explanation: string;
  points: number;
}

export interface ModuleQuiz {
  id: string;
  moduleId: string;
  title: string;
  passingScore: number;
  timeLimit?: number; // in minutes
  questions: QuizQuestion[];
}

export interface CourseContent {
  id: string;
  courseId: string;
  title: string;
  level: 'foundational' | 'advanced';
  duration: number; // total in minutes
  description: string;
  modules: Module[];
  finalExam: ModuleQuiz;
  capstoneProject: CapstoneProject;
}

export interface CapstoneProject {
  id: string;
  courseId: string;
  title: string;
  description: string;
  cases: ClinicalCase[];
  rubric: ScoringRubric;
}

export interface ClinicalCase {
  id: string;
  title: string;
  scenario: string;
  patientAge: number;
  patientWeight: number;
  presentingComplaint: string;
  clinicalFindings: string;
  investigations: string;
  initialManagement: string;
  questionPrompt: string;
}

export interface ScoringRubric {
  criteria: RubricCriterion[];
  totalPoints: number;
  passingScore: number;
}

export interface RubricCriterion {
  name: string;
  description: string;
  points: number;
  levels: {
    excellent: string;
    good: string;
    satisfactory: string;
    needsImprovement: string;
  };
}

/**
 * SEPTIC SHOCK I: Recognition and Fluid Resuscitation
 * Foundational course for recognizing sepsis and implementing first-hour safe actions
 */
export const SEPTIC_SHOCK_I_CONTENT: CourseContent = {
  id: 'septic-shock-i-content',
  courseId: 'septic-shock-i',
  title: 'Paediatric Septic Shock I: Recognition and Fluid Resuscitation',
  level: 'foundational',
  duration: 45,
  description: 'Recognize sepsis criteria, implement 20 mL/kg bolus, assess perfusion, and plan vasopressor escalation.',
  modules: [
    {
      id: 'septic-shock-i-m1',
      courseId: 'septic-shock-i',
      moduleNumber: 1,
      title: 'Recognition of Septic Shock',
      duration: 15,
      description: 'Learn to identify sepsis and septic shock using clinical signs and SIRS criteria',
      learningObjectives: [
        {
          id: 'obj-1',
          text: 'Define sepsis, severe sepsis, and septic shock in observable, bedside terms',
          bloomLevel: 'understand',
        },
        {
          id: 'obj-2',
          text: 'Identify clinical signs of shock: perfusion, pulse quality, capillary refill time, breathing, responsiveness',
          bloomLevel: 'apply',
        },
        {
          id: 'obj-3',
          text: 'Distinguish septic shock from other shock types (hypovolemic, cardiogenic, distributive)',
          bloomLevel: 'analyze',
        },
        {
          id: 'obj-4',
          text: 'Recognize when a child is "sick enough to worry" - red flags for escalation',
          bloomLevel: 'apply',
        },
      ],
      content: `
# Recognition of Septic Shock

## Definition (WHO/IMCI)
**Sepsis:** Systemic inflammatory response to suspected or confirmed infection  
**Severe Sepsis:** Sepsis + organ dysfunction or shock  
**Septic Shock:** Sepsis + hypotension unresponsive to fluid resuscitation

## Clinical Signs of Shock (Bedside Assessment)
### Cold Shock (Most Common in Children)
- Cold extremities (hands, feet colder than core)
- Weak or thready pulse
- Prolonged capillary refill time (>2 seconds)
- Pale or mottled skin
- Altered mental status (lethargy, irritability)
- Oliguria (urine output <0.5 mL/kg/hr)

### Warm Shock (Early or Distributive)
- Warm extremities
- Bounding pulse
- Rapid capillary refill
- Flushed skin
- May still have hypotension

## SIRS Criteria (Systemic Inflammatory Response)
At least 2 of 4:
1. Temperature >38.5°C or <36°C
2. Heart rate >2 SD above age-normal
3. Respiratory rate >2 SD above age-normal
4. WBC >12,000 or <4,000 or >10% bands

## Red Flags for Immediate Escalation
- Altered mental status
- Severe respiratory distress
- Hypotension (SBP <5th percentile for age)
- Oliguria despite fluids
- Severe metabolic acidosis (pH <7.2)
- Coagulopathy (petechial rash, bleeding)

## Differential Diagnosis
- Malaria (fever + shock in endemic areas)
- Meningitis (fever + altered mental status + rash)
- Dengue (fever + thrombocytopenia + bleeding)
- Severe dehydration (history of diarrhea/vomiting)
      `,
      keyPoints: [
        'Septic shock = sepsis + hypotension unresponsive to fluids',
        'Cold shock is most common in children',
        'Capillary refill time is key bedside sign',
        'Altered mental status = severe shock',
        'Escalate immediately if not responding to first bolus',
      ],
      references: [
        {
          title: 'Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021',
          source: 'Critical Care Medicine',
          year: 2021,
          url: 'https://doi.org/10.1097/CCM.0000000000004940',
        },
        {
          title: 'WHO Integrated Management of Neonatal and Childhood Illness (IMCI)',
          source: 'World Health Organization',
          year: 2014,
        },
      ],
    },
    {
      id: 'septic-shock-i-m2',
      courseId: 'septic-shock-i',
      moduleNumber: 2,
      title: 'First-Hour Safe Actions',
      duration: 20,
      description: 'Implement the first-hour sepsis bundle: IV/IO access, fluids, antibiotics, escalation',
      learningObjectives: [
        {
          id: 'obj-5',
          text: 'Establish IV or IO access safely and quickly',
          bloomLevel: 'apply',
        },
        {
          id: 'obj-6',
          text: 'Calculate and administer 20 mL/kg fluid bolus with reassessment',
          bloomLevel: 'apply',
        },
        {
          id: 'obj-7',
          text: 'Select and administer appropriate antibiotics based on age and risk factors',
          bloomLevel: 'apply',
        },
        {
          id: 'obj-8',
          text: 'Recognize when to escalate care and arrange safe referral',
          bloomLevel: 'analyze',
        },
      ],
      content: `
# First-Hour Safe Actions

## Step 1: Establish Access (First 5 minutes)
### IV Access
- Peripheral IV: 18-20G in antecubital fossa or hand
- Attempt 2 times maximum, then proceed to IO

### IO Access (If IV Fails)
- Intraosseous needle: 15-18G
- Sites: Proximal tibia (preferred), distal femur, proximal humerus
- Technique: 90° angle, twist until "pop" felt, aspirate to confirm placement
- All fluids and drugs can be given via IO

## Step 2: Fluid Resuscitation (First 15 minutes)
### Initial Bolus
- **Volume:** 20 mL/kg over 15-30 minutes
- **Fluid:** Normal saline (0.9%) or Ringer's lactate
- **Route:** IV or IO

### Example Calculations
- 5 kg child: 100 mL bolus
- 10 kg child: 200 mL bolus
- 20 kg child: 400 mL bolus

### Reassessment After First Bolus
- Check perfusion: pulse quality, CRT, mental status, urine output
- If improved: continue maintenance fluids + antibiotics
- If not improved: give SECOND bolus (20 mL/kg) + prepare for escalation

### After 2 Boluses (40 mL/kg)
- If still in shock: **ESCALATE IMMEDIATELY**
- Start noradrenaline (if available) or arrange referral
- Do NOT give third bolus without vasopressor support

## Step 3: Antibiotics (First 30 minutes)
### Timing
- **Start antibiotics within 30 minutes of recognition**
- Do NOT wait for culture results

### Empiric Regimen (Age-Based)
**Neonates (0-28 days):**
- Ampicillin 50 mg/kg IV/IO + Gentamicin 7.5 mg/kg IV/IO

**Infants & Children (1 month - 5 years):**
- Ceftriaxone 80 mg/kg/day (max 2g) IV/IO OR
- Cefotaxime 50 mg/kg IV/IO

**Children >5 years:**
- Ceftriaxone 80 mg/kg/day (max 2g) IV/IO

### Adjust if Risk Factors
- **Meningitis suspected:** Add vancomycin 15-20 mg/kg IV/IO
- **Malaria endemic area:** Add artemether or quinine
- **Immunocompromised:** Add TMP-SMX or fluconazole

## Step 4: Supportive Care
- Oxygen: Target SpO2 >90%
- Monitor: Continuous pulse oximetry, frequent vital signs
- Urinary catheter: Monitor urine output (target >0.5 mL/kg/hr)
- Reassess every 15 minutes

## When to Escalate
- Shock persisting after 2 boluses (40 mL/kg)
- Altered mental status
- Severe respiratory distress
- Oliguria despite fluids
- Signs of organ failure
      `,
      keyPoints: [
        'IO access is as effective as IV - do not delay',
        '20 mL/kg bolus over 15-30 minutes',
        'Reassess after each bolus',
        'Antibiotics within 30 minutes - do not wait for cultures',
        'Escalate after 2 boluses if no improvement',
      ],
      references: [
        {
          title: 'Surviving Sepsis Campaign Bundle',
          source: 'Critical Care Medicine',
          year: 2021,
        },
      ],
    },
    {
      id: 'septic-shock-i-m3',
      courseId: 'septic-shock-i',
      moduleNumber: 3,
      title: 'When to Refer and Safe Transport',
      duration: 10,
      description: 'Identify when a child needs hospital-level care and arrange safe referral',
      learningObjectives: [
        {
          id: 'obj-9',
          text: 'Identify indications for hospital referral',
          bloomLevel: 'understand',
        },
        {
          id: 'obj-10',
          text: 'Communicate clearly with referral center',
          bloomLevel: 'apply',
        },
        {
          id: 'obj-11',
          text: 'Arrange safe transport with appropriate monitoring',
          bloomLevel: 'apply',
        },
      ],
      content: `
# When to Refer and Safe Transport

## Indications for Hospital Referral
- Shock persisting after 2 boluses (40 mL/kg)
- Altered mental status
- Severe respiratory distress
- Severe metabolic acidosis
- Signs of organ failure
- Suspected meningitis
- Suspected malaria with complications
- Any child you are unsure about

## Communication with Referral Center
### SBAR Handover
- **S (Situation):** "5-year-old with fever and shock"
- **B (Background):** "Fever x 3 days, now with cold extremities and weak pulse"
- **A (Assessment):** "Septic shock, received 2 boluses, still in shock"
- **R (Recommendation):** "Needs hospital care, can you receive?"

### Information to Provide
- Age and weight
- Vital signs (temperature, HR, RR, BP)
- Perfusion status (CRT, pulse quality)
- Fluids given (volume, type, response)
- Antibiotics given (drug, dose, time)
- Urine output
- Any complications

## Safe Transport
- Accompany child if possible
- Bring IV/IO line if established
- Bring medication list
- Bring referral letter
- Monitor during transport
- Reassess if deterioration occurs
      `,
      keyPoints: [
        'Refer after 2 boluses if no improvement',
        'Use SBAR for clear communication',
        'Accompany child if possible',
        'Monitor during transport',
      ],
      references: [],
    },
  ],
  finalExam: {
    id: 'septic-shock-i-exam',
    moduleId: '',
    title: 'Septic Shock I Final Exam',
    passingScore: 80,
    timeLimit: 30,
    questions: [
      {
        id: 'q1',
        questionNumber: 1,
        type: 'multiple-choice',
        text: 'A 5-year-old with fever has cold extremities, weak pulse, and is very sleepy. What is the first thing you do?',
        options: [
          'A) Give antibiotics only',
          'B) Establish IV access and give 20 mL/kg fluid bolus',
          'C) Refer to hospital immediately',
          'D) Give antipyretics (paracetamol)',
        ],
        correctAnswer: 'B',
        explanation: 'Establishing IV access and giving fluids is the first critical step in septic shock management. Fluids restore perfusion and buy time for antibiotics to work.',
        points: 1,
      },
      {
        id: 'q2',
        questionNumber: 2,
        type: 'multiple-choice',
        text: 'After giving one 20 mL/kg bolus, the child still has cold extremities and weak pulse. What do you do?',
        options: [
          'A) Give another 20 mL/kg bolus',
          'B) Stop fluids and escalate',
          'C) Give antibiotics only',
          'D) Wait 1 hour and reassess',
        ],
        correctAnswer: 'A',
        explanation: 'If shock persists after the first bolus, give a second bolus. Only after 2 boluses (40 mL/kg) with no improvement should you escalate or refer.',
        points: 1,
      },
      {
        id: 'q3',
        questionNumber: 3,
        type: 'true-false',
        text: 'Intraosseous (IO) access is only used when IV access fails and should not be used for fluid resuscitation.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'IO access is as effective as IV access for both fluids and medications. It should be used immediately if IV fails, and can be used for complete fluid resuscitation.',
        points: 1,
      },
    ],
  },
  capstoneProject: {
    id: 'septic-shock-i-capstone',
    courseId: 'septic-shock-i',
    title: 'Septic Shock I Capstone: Clinical Case Analysis',
    description: 'Analyze a clinical case of pediatric septic shock and demonstrate your understanding of recognition and first-hour management.',
    cases: [
      {
        id: 'case-1',
        title: 'Case 1: Fever and Shock in Rural Clinic',
        scenario: 'You are working in a rural clinic. A mother brings her 4-year-old daughter with fever for 3 days.',
        patientAge: 4,
        patientWeight: 15,
        presentingComplaint: 'Fever x 3 days, now with weakness and difficulty breathing',
        clinicalFindings: 'Temperature 39.5°C, HR 140, RR 45, BP 85/50, cold extremities, weak pulse, CRT 4 seconds, alert but irritable',
        investigations: 'No lab available',
        initialManagement: 'You suspect septic shock',
        questionPrompt: 'Describe your management plan for the first hour, including: (1) How you would establish access, (2) Fluid and antibiotic regimen, (3) When you would refer, (4) How you would communicate with the referral center.',
      },
    ],
    rubric: {
      criteria: [
        {
          name: 'Clinical Recognition',
          description: 'Correctly identifies septic shock and key clinical findings',
          points: 5,
          levels: {
            excellent: 'Identifies all signs of shock and explains why this is septic shock',
            good: 'Identifies most signs and recognizes shock',
            satisfactory: 'Identifies shock but may miss some findings',
            needsImprovement: 'Does not recognize shock',
          },
        },
        {
          name: 'Access and Fluids',
          description: 'Correctly calculates and administers fluid resuscitation',
          points: 5,
          levels: {
            excellent: 'Correct IV/IO access method, correct bolus volume (300 mL), reassessment plan',
            good: 'Correct bolus volume and access method',
            satisfactory: 'Correct bolus volume but access method unclear',
            needsImprovement: 'Incorrect bolus volume or no access plan',
          },
        },
        {
          name: 'Antibiotics',
          description: 'Selects appropriate empiric antibiotics',
          points: 5,
          levels: {
            excellent: 'Correct drug, dose, and timing (within 30 min)',
            good: 'Correct drug and dose',
            satisfactory: 'Appropriate antibiotic but dose incorrect',
            needsImprovement: 'Inappropriate antibiotic or no antibiotic plan',
          },
        },
        {
          name: 'Escalation and Referral',
          description: 'Recognizes when to escalate and communicates appropriately',
          points: 5,
          levels: {
            excellent: 'Clear escalation criteria, SBAR handover, safe transport plan',
            good: 'Recognizes need to escalate and provides handover',
            satisfactory: 'Recognizes need to escalate but communication unclear',
            needsImprovement: 'Does not recognize need to escalate',
          },
        },
      ],
      totalPoints: 20,
      passingScore: 16,
    },
  },
};

/**
 * Export all course content
 */
export const ALL_COURSE_CONTENT = [SEPTIC_SHOCK_I_CONTENT];

/**
 * Get course content by ID
 */
export function getCourseContent(courseId: string) {
  return ALL_COURSE_CONTENT.find((c) => c.courseId === courseId);
}

/**
 * Get module content
 */
export function getModuleContent(courseId: string, moduleNumber: number) {
  const course = getCourseContent(courseId);
  return course?.modules.find((m) => m.moduleNumber === moduleNumber);
}


// ============================================
// PNEUMONIA (SEVERE PNEUMONIA / ARDS)
// ============================================

export const pneumoniaCourse: Course = {
  id: 'severe-pneumonia-ards-i',
  title: 'Severe Pneumonia & ARDS in Children',
  description: 'Recognition, assessment, and management of severe pneumonia and acute respiratory distress syndrome in pediatric patients',
  level: 'Intermediate',
  duration: 120,
  emergencyType: 'Respiratory',
  modules: [
    {
      id: 'pn-m1',
      courseId: 'severe-pneumonia-ards-i',
      moduleNumber: 1,
      title: 'Recognition and Classification of Severe Pneumonia',
      duration: 40,
      description: 'Identify signs of severe pneumonia and classify severity using WHO IMCI criteria',
      learningObjectives: [
        {
          id: 'pn-lo1',
          text: 'Recognize clinical signs of severe pneumonia in children',
          bloomLevel: 'understand',
        },
        {
          id: 'pn-lo2',
          text: 'Apply WHO IMCI classification to stratify pneumonia severity',
          bloomLevel: 'apply',
        },
        {
          id: 'pn-lo3',
          text: 'Differentiate severe pneumonia from other respiratory emergencies',
          bloomLevel: 'analyze',
        },
      ],
      content: `
## Clinical Recognition of Severe Pneumonia

### WHO IMCI Danger Signs (Fast Breathing Pneumonia)
- Fast breathing (respiratory rate >50 in 2-11 months, >40 in 12-59 months)
- Lower chest wall indrawing
- Stridor in calm child
- Nasal flaring
- Severe malnutrition

### Severe Pneumonia Indicators
- General danger signs (unable to drink, persistent vomiting, lethargy, unconsciousness, severe malnutrition)
- Severe respiratory distress (stridor, nasal flaring, intercostal/subcostal indrawing)
- Signs of hypoxemia (cyanosis, SpO2 <90%)
- Signs of shock (weak pulse, delayed capillary refill, cold extremities)
- Altered mental status

### ARDS Criteria (Modified Berlin Definition for Pediatrics)
1. **Timing**: Onset within 1 week of known clinical insult
2. **Oxygenation**: PaO2/FiO2 ratio <300 (or SpO2 <90% on room air)
3. **Imaging**: Bilateral opacities on CXR/ultrasound
4. **Etiology**: Respiratory failure not fully explained by cardiac failure or fluid overload

### Differential Diagnosis
- Asthma/bronchiolitis (wheezing, hyperinflation)
- Pneumothorax (unilateral breath sounds, acute onset)
- Pulmonary edema (cardiac cause, elevated JVP)
- Aspiration (history, focal findings)
      `,
      keyPoints: [
        'Fast breathing alone = pneumonia; add danger signs = severe pneumonia',
        'Lower chest wall indrawing is key indicator of severe pneumonia',
        'ARDS requires bilateral infiltrates + hypoxemia + known trigger',
        'Early recognition prevents progression to respiratory failure',
        'Hypoxemia (SpO2 <90%) requires immediate oxygen therapy',
      ],
      references: [
        {
          title: 'WHO Pocket Book of Hospital Care for Children',
          source: 'World Health Organization',
          year: 2022,
        },
        {
          title: 'Pediatric Acute Respiratory Distress Syndrome',
          source: 'Pediatric Critical Care Medicine',
          year: 2021,
        },
      ],
    },
    {
      id: 'pn-m2',
      courseId: 'severe-pneumonia-ards-i',
      moduleNumber: 2,
      title: 'Oxygen Therapy and Respiratory Support',
      duration: 40,
      description: 'Oxygen delivery methods, titration strategies, and escalation to advanced support',
      learningObjectives: [
        {
          id: 'pn-lo4',
          text: 'Select appropriate oxygen delivery device based on severity',
          bloomLevel: 'apply',
        },
        {
          id: 'pn-lo5',
          text: 'Titrate oxygen to maintain SpO2 90-95% safely',
          bloomLevel: 'apply',
        },
        {
          id: 'pn-lo6',
          text: 'Recognize need for advanced respiratory support (CPAP, intubation)',
          bloomLevel: 'analyze',
        },
      ],
      content: `
## Oxygen Therapy Escalation

### Initial Oxygen Therapy (SpO2 <90%)
1. **Nasal Cannula**: 1-2 L/min (FiO2 24-28%)
2. **Simple Face Mask**: 5-6 L/min (FiO2 40-45%)
3. **Non-rebreather Mask**: 10-15 L/min (FiO2 60-95%)

### CPAP/BiPAP (Continuous Positive Airway Pressure)
**Indications**:
- SpO2 <90% despite high-flow oxygen
- Respiratory distress with accessory muscle use
- Impending respiratory failure

**Settings**:
- PEEP: 5-8 cm H2O (start 5, increase by 2 if needed)
- FiO2: Titrate to SpO2 90-95%
- Pressure support: 8-12 cm H2O

### Intubation Criteria
- SpO2 <90% despite CPAP + FiO2 100%
- Severe respiratory distress with fatigue
- Altered mental status (GCS <8)
- Apnea or severe hypoventilation
- Inability to protect airway

### Ventilation Strategy (if intubated)
- Lung-protective ventilation (Vt 6-8 mL/kg)
- PEEP 5-15 cm H2O based on compliance
- Target PaO2 60-100 mmHg, PaCO2 35-45 mmHg
      `,
      keyPoints: [
        'Start with nasal cannula; escalate based on response',
        'CPAP is bridge to prevent intubation in many cases',
        'Monitor work of breathing, not just SpO2',
        'Avoid excessive oxygen (hyperoxia worsens outcomes)',
        'Early intubation if signs of fatigue or altered mental status',
      ],
      references: [
        {
          title: 'Oxygen Therapy in Pediatric Respiratory Emergencies',
          source: 'Pediatric Emergency Medicine',
          year: 2023,
        },
      ],
    },
    {
      id: 'pn-m3',
      courseId: 'severe-pneumonia-ards-i',
      moduleNumber: 3,
      title: 'Antimicrobial Therapy and Supportive Care',
      duration: 40,
      description: 'Evidence-based antibiotic selection and adjunctive management',
      learningObjectives: [
        {
          id: 'pn-lo7',
          text: 'Select appropriate antibiotics based on severity and local epidemiology',
          bloomLevel: 'apply',
        },
        {
          id: 'pn-lo8',
          text: 'Manage fluid balance and nutrition in severe pneumonia',
          bloomLevel: 'apply',
        },
      ],
      content: `
## Antibiotic Therapy

### WHO IMCI Fast Breathing Pneumonia
- **First-line**: Amoxicillin 45 mg/kg/dose BD (or Ampicillin 50 mg/kg/dose QID IV)
- **Duration**: 5-7 days

### Severe Pneumonia (Hospital-Acquired)
- **First-line**: Ceftriaxone 50-80 mg/kg/day (max 4g/day) + Gentamicin 7.5 mg/kg/day
- **Consider**: Add Cloxacillin if MRSA suspected
- **Duration**: 7-10 days

### ARDS with Sepsis
- **Empiric**: Ceftriaxone + Gentamicin ± Cloxacillin
- **Adjust**: Based on culture results
- **Consider**: Antifungal if immunocompromised

## Supportive Care
- Fluid management: Avoid overload (increases edema)
- Nutrition: Early enteral feeding if tolerating
- Monitoring: Daily CXR, blood cultures, procalcitonin
- Complications: Watch for pneumothorax, empyema
      `,
      keyPoints: [
        'Antibiotics within 1 hour of diagnosis',
        'Avoid fluid overload in ARDS',
        'Monitor for complications (pneumothorax, empyema)',
        'De-escalate antibiotics when culture results available',
      ],
      references: [
        {
          title: 'Pediatric Pneumonia Management Guidelines',
          source: 'Infectious Diseases Society of America',
          year: 2022,
        },
      ],
    },
  ],
  quiz: [
    {
      id: 'pn-q1',
      questionNumber: 1,
      type: 'multiple-choice',
      text: 'A 3-year-old with fast breathing (45/min) and lower chest wall indrawing is classified as having:',
      options: [
        'Fast breathing pneumonia',
        'Severe pneumonia',
        'ARDS',
        'Asthma',
      ],
      correctAnswer: 'Severe pneumonia',
      explanation: 'Lower chest wall indrawing is a key indicator of severe pneumonia per WHO IMCI criteria',
      points: 10,
    },
    {
      id: 'pn-q2',
      questionNumber: 2,
      type: 'multiple-choice',
      text: 'What is the first-line oxygen delivery for SpO2 <90% in a child with severe pneumonia?',
      options: [
        'Nasal cannula 1-2 L/min',
        'Non-rebreather mask 10-15 L/min',
        'CPAP 5 cm H2O',
        'Mechanical ventilation',
      ],
      correctAnswer: 'Non-rebreather mask 10-15 L/min',
      explanation: 'Non-rebreather provides FiO2 60-95%, appropriate for SpO2 <90%',
      points: 10,
    },
    {
      id: 'pn-q3',
      questionNumber: 3,
      type: 'true-false',
      text: 'ARDS requires bilateral infiltrates on imaging plus hypoxemia plus a known trigger.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: 'All three criteria (timing, oxygenation, imaging, etiology) are required for ARDS diagnosis',
      points: 10,
    },
  ],
  capstone: {
    id: 'pn-capstone',
    title: 'Severe Pneumonia Case Management',
    description: 'Manage a complex case of severe pneumonia with progression to ARDS',
    caseScenario: `
You receive a 4-year-old boy with 5-day history of cough and fever. On examination:
- RR 52/min (normal 30-40)
- Lower chest wall indrawing
- SpO2 88% on room air
- Temp 39.5°C
- Alert but tachycardic (HR 130)
- CXR shows bilateral infiltrates

Questions:
1. Classify the severity of pneumonia
2. Outline your immediate management plan
3. When would you consider CPAP vs intubation?
4. What antibiotics would you give and why?
5. How would you manage fluid balance?
    `,
    scoringRubric: [
      {
        criterion: 'Correct severity classification',
        points: 20,
      },
      {
        criterion: 'Appropriate oxygen therapy escalation',
        points: 20,
      },
      {
        criterion: 'Correct antibiotic selection with dosing',
        points: 20,
      },
      {
        criterion: 'Appropriate respiratory support decisions',
        points: 20,
      },
      {
        criterion: 'Fluid management strategy',
        points: 20,
      },
    ],
  },
};

// ============================================
// ASTHMA (STATUS ASTHMATICUS)
// ============================================

export const asthmaCourse: Course = {
  id: 'asthma-ii',
  title: 'Status Asthmaticus: Recognition and Management',
  description: 'Emergency management of severe asthma exacerbation (status asthmaticus) in children',
  level: 'Intermediate',
  duration: 90,
  emergencyType: 'Respiratory',
  modules: [
    {
      id: 'as-m1',
      courseId: 'asthma-ii',
      moduleNumber: 1,
      title: 'Recognition of Status Asthmaticus',
      duration: 30,
      description: 'Identify severe asthma exacerbation and risk factors for life-threatening asthma',
      learningObjectives: [
        {
          id: 'as-lo1',
          text: 'Recognize clinical signs of status asthmaticus',
          bloomLevel: 'understand',
        },
        {
          id: 'as-lo2',
          text: 'Identify risk factors for near-fatal asthma',
          bloomLevel: 'analyze',
        },
      ],
      content: `
## Clinical Features of Status Asthmaticus

### Mild-Moderate Exacerbation
- Wheezing, cough
- Increased work of breathing
- Peak flow 50-80% predicted
- SpO2 >92%

### Severe Exacerbation
- Severe dyspnea, speaks in phrases
- Accessory muscle use (intercostal, subcostal, suprasternal indrawing)
- Tachycardia (>120 in school-age)
- Peak flow <50% predicted
- SpO2 90-92%

### Life-Threatening Asthma (Status Asthmaticus)
- **"Silent chest"** (minimal/absent wheezing due to poor air movement)
- Severe accessory muscle use, paradoxical breathing
- Inability to speak (even single words)
- Altered mental status (confusion, drowsiness)
- Peak flow unmeasurable
- SpO2 <90%
- Cyanosis
- Exhaustion

### Risk Factors for Near-Fatal Asthma
- Previous intubation for asthma
- ICU admission for asthma
- Multiple ED visits in past month
- Oral corticosteroid use
- Psychosocial stress
- Non-adherence to therapy
      `,
      keyPoints: [
        '"Silent chest" is ominous sign of severe airway obstruction',
        'Absence of wheezing does NOT mean improvement',
        'Mental status changes indicate severe hypoxemia/hypercarbia',
        'Paradoxical breathing = impending respiratory failure',
      ],
      references: [
        {
          title: 'Global Strategy for Asthma Management and Prevention',
          source: 'Global Initiative for Asthma (GINA)',
          year: 2023,
        },
      ],
    },
    {
      id: 'as-m2',
      courseId: 'asthma-ii',
      moduleNumber: 2,
      title: 'Emergency Management of Status Asthmaticus',
      duration: 30,
      description: 'Step-by-step management of life-threatening asthma',
      learningObjectives: [
        {
          id: 'as-lo3',
          text: 'Administer appropriate medications for status asthmaticus',
          bloomLevel: 'apply',
        },
        {
          id: 'as-lo4',
          text: 'Manage airway and respiratory support',
          bloomLevel: 'apply',
        },
      ],
      content: `
## Immediate Management

### Oxygen Therapy
- Target SpO2 >94%
- Start with high-flow oxygen (non-rebreather if SpO2 <90%)
- Avoid hypoxemia at all costs

### Bronchodilators
**Salbutamol (Albuterol)**
- Nebulized: 0.15 mg/kg/dose (max 5 mg) every 15-20 min for first hour, then every 1-4 hours
- IV: 10-15 mcg/kg bolus, then infusion 0.5-1.5 mcg/kg/min

**Ipratropium**
- Nebulized: 0.25 mg mixed with salbutamol every 20 min for 3 doses, then every 4-6 hours
- Synergistic with salbutamol

### Corticosteroids (Systemic)
- **Methylprednisolone**: 1-2 mg/kg IV/IM (max 125 mg)
- **Prednisone**: 1-2 mg/kg PO (max 60 mg)
- Repeat every 6 hours if needed

### Magnesium Sulfate
- IV: 25-50 mg/kg over 20 min (max 2g)
- Smooth muscle relaxant, bronchodilator
- Use if inadequate response to initial therapy

### Theophylline (if available)
- Loading: 5-6 mg/kg IV over 20 min
- Infusion: 0.5-1 mg/kg/hour
- Monitor levels (therapeutic 10-20 mcg/mL)

## Respiratory Support
- CPAP/BiPAP if tiring despite maximal therapy
- Intubation if: altered mental status, apnea, severe fatigue, SpO2 <90% despite FiO2 100%
- Ventilation strategy: Low respiratory rate, high tidal volume to allow exhalation
      `,
      keyPoints: [
        'Continuous salbutamol + ipratropium for first hour',
        'IV corticosteroids within 1 hour of presentation',
        'Magnesium sulfate for inadequate response',
        'Avoid intubation if possible; if needed, use permissive hypercapnia',
      ],
      references: [
        {
          title: 'Pediatric Asthma Management in the Emergency Department',
          source: 'American Academy of Pediatrics',
          year: 2022,
        },
      ],
    },
    {
      id: 'as-m3',
      courseId: 'asthma-ii',
      moduleNumber: 3,
      title: 'Complications and Long-Term Management',
      duration: 30,
      description: 'Recognize complications and plan discharge/follow-up',
      learningObjectives: [
        {
          id: 'as-lo5',
          text: 'Identify complications of status asthmaticus',
          bloomLevel: 'understand',
        },
        {
          id: 'as-lo6',
          text: 'Plan safe discharge and prevent recurrence',
          bloomLevel: 'apply',
        },
      ],
      content: `
## Complications
- Pneumothorax (spontaneous)
- Pneumomediastinum
- Atelectasis
- Respiratory failure requiring intubation
- Barotrauma (if ventilated)

## Discharge Criteria
- Able to speak full sentences
- Peak flow >50% predicted
- SpO2 >92% on room air
- Minimal accessory muscle use
- Able to tolerate oral medications

## Discharge Plan
1. **Inhaler technique**: Verify proper use
2. **Action plan**: Written plan for early recognition of exacerbation
3. **Controller therapy**: Daily inhaled corticosteroid
4. **Follow-up**: Pediatrician within 1 week
5. **Trigger avoidance**: Identify and minimize triggers
6. **Allergy evaluation**: Consider if not done
      `,
      keyPoints: [
        'Complications can occur even after apparent improvement',
        'Discharge only when stable on oral medications',
        'Controller therapy prevents recurrence',
        'Written action plan improves outcomes',
      ],
      references: [],
    },
  ],
  quiz: [
    {
      id: 'as-q1',
      questionNumber: 1,
      type: 'multiple-choice',
      text: 'A 6-year-old with asthma presents with inability to speak, silent chest, and SpO2 88%. This is:',
      options: [
        'Mild exacerbation',
        'Moderate exacerbation',
        'Severe exacerbation',
        'Status asthmaticus',
      ],
      correctAnswer: 'Status asthmaticus',
      explanation: 'Silent chest, inability to speak, and SpO2 <90% are hallmarks of life-threatening asthma',
      points: 10,
    },
    {
      id: 'as-q2',
      questionNumber: 2,
      type: 'true-false',
      text: 'Absence of wheezing in a child with asthma exacerbation indicates improvement.',
      options: ['True', 'False'],
      correctAnswer: 'False',
      explanation: 'Silent chest indicates severe obstruction, not improvement',
      points: 10,
    },
    {
      id: 'as-q3',
      questionNumber: 3,
      type: 'multiple-choice',
      text: 'First-line bronchodilator for status asthmaticus is:',
      options: [
        'Theophylline',
        'Salbutamol + Ipratropium',
        'Magnesium sulfate',
        'Leukotriene inhibitor',
      ],
      correctAnswer: 'Salbutamol + Ipratropium',
      explanation: 'Combination therapy is most effective for severe exacerbation',
      points: 10,
    },
  ],
  capstone: {
    id: 'as-capstone',
    title: 'Status Asthmaticus Case Management',
    description: 'Manage a life-threatening asthma exacerbation',
    caseScenario: `
A 5-year-old girl with history of asthma presents with severe dyspnea. Examination:
- RR 50/min with severe accessory muscle use
- Unable to speak more than single words
- Wheezing heard only at end of expiration
- SpO2 85% on room air
- HR 140, BP 95/60
- Alert but anxious

Outline your management plan:
1. Immediate interventions
2. Medication regimen and doses
3. When would you consider intubation?
4. Discharge criteria
    `,
    scoringRubric: [
      {
        criterion: 'Correct severity assessment',
        points: 25,
      },
      {
        criterion: 'Appropriate oxygen therapy',
        points: 25,
      },
      {
        criterion: 'Correct medication selection and dosing',
        points: 25,
      },
      {
        criterion: 'Appropriate respiratory support decisions',
        points: 25,
      },
    ],
  },
};

// ============================================
// SEIZURE (STATUS EPILEPTICUS)
// ============================================

export const seizureCourse: Course = {
  id: 'status-epilepticus-ii',
  title: 'Status Epilepticus: Recognition and Management',
  description: 'Emergency management of prolonged seizures and status epilepticus in children',
  level: 'Intermediate',
  duration: 90,
  emergencyType: 'Neurological',
  modules: [
    {
      id: 'se-m1',
      courseId: 'status-epilepticus-ii',
      moduleNumber: 1,
      title: 'Seizure Recognition and Classification',
      duration: 30,
      description: 'Identify seizures and status epilepticus',
      learningObjectives: [
        {
          id: 'se-lo1',
          text: 'Recognize generalized and focal seizures',
          bloomLevel: 'understand',
        },
        {
          id: 'se-lo2',
          text: 'Define status epilepticus and convulsive status epilepticus',
          bloomLevel: 'understand',
        },
      ],
      content: `
## Seizure Types

### Generalized Seizures
- **Tonic-Clonic**: Loss of consciousness, stiffening, jerking
- **Absence**: Brief loss of awareness, staring
- **Myoclonic**: Brief jerking movements
- **Atonic**: Loss of muscle tone ("drop attacks")

### Focal Seizures
- Jerking or stiffening in one limb/side
- May progress to generalized seizure
- Consciousness may be preserved

## Status Epilepticus Definition
- **Convulsive**: ≥5 minutes of continuous seizure activity OR ≥2 seizures without full recovery between them
- **Non-convulsive**: Altered consciousness without obvious motor activity (subtle twitching, eye deviation)
- **Refractory**: Continues despite 2 appropriate anticonvulsants

## Complications of Prolonged Seizures
- Hypoxemia, hypercarbia
- Aspiration
- Rhabdomyolysis
- Acute kidney injury
- Cerebral edema
- Sudden Unexpected Nocturnal Death in Epilepsy (SUDEP)
      `,
      keyPoints: [
        'Status epilepticus is a medical emergency requiring immediate treatment',
        'Non-convulsive status can be missed; maintain high suspicion',
        'Seizure duration >5 minutes indicates need for IV medication',
      ],
      references: [
        {
          title: 'Status Epilepticus in Children',
          source: 'Pediatric Neurology',
          year: 2023,
        },
      ],
    },
    {
      id: 'se-m2',
      courseId: 'status-epilepticus-ii',
      moduleNumber: 2,
      title: 'Emergency Management of Status Epilepticus',
      duration: 30,
      description: 'Step-by-step management protocol',
      learningObjectives: [
        {
          id: 'se-lo3',
          text: 'Administer first-line anticonvulsants appropriately',
          bloomLevel: 'apply',
        },
        {
          id: 'se-lo4',
          text: 'Manage airway and respiratory support',
          bloomLevel: 'apply',
        },
      ],
      content: `
## Immediate Management (0-5 minutes)

### Position & Safety
- Place on side to prevent aspiration
- Protect from injury
- Remove tight clothing

### Oxygen & Airway
- High-flow oxygen
- Position for airway patency
- Prepare for intubation if needed

### Glucose
- Check blood glucose immediately
- If <40 mg/dL: Give 0.5 g/kg dextrose IV

## First-Line Anticonvulsants (5-10 minutes)

### Option 1: Benzodiazepines (Preferred)
**Lorazepam**
- IV: 0.05-0.1 mg/kg (max 4 mg) over 2-5 min
- IM: 0.05-0.1 mg/kg (max 4 mg)
- Onset: 1-3 minutes

**Midazolam**
- IV: 0.1-0.2 mg/kg (max 10 mg)
- IM: 0.1-0.2 mg/kg (max 10 mg)
- Intranasal: 0.2 mg/kg (max 10 mg)
- Buccal: 0.25-0.5 mg/kg (max 10 mg)

### Option 2: Diazepam (if IV access unavailable)
- Rectal: 0.5 mg/kg (max 20 mg)
- Onset: 5-10 minutes

## Second-Line Anticonvulsants (10-20 minutes if seizure continues)

### Phenytoin
- IV: 15-20 mg/kg (max 1500 mg) over 20 min
- Infusion rate: ≤1 mg/kg/min
- Monitor for hypotension, arrhythmias

### Levetiracetam
- IV: 20-30 mg/kg (max 1500 mg)
- Infusion rate: ≤5 mg/kg/min
- Preferred in many centers (fewer drug interactions)

### Valproic Acid
- IV: 15-20 mg/kg (max 1000 mg)
- Infusion rate: ≤6 mg/kg/min

## Refractory Status Epilepticus (>30 minutes)
- Intubation and sedation
- Continuous EEG monitoring
- ICU management
- Consider propofol, pentobarbital, or midazolam infusion
      `,
      keyPoints: [
        'Benzodiazepines are first-line; give IV if possible, IM/IN if not',
        'Second-line drugs if seizure continues after 10 minutes',
        'Intubation for refractory status or airway protection',
        'Continuous monitoring essential',
      ],
      references: [
        {
          title: 'Status Epilepticus Management Guidelines',
          source: 'American Epilepsy Society',
          year: 2023,
        },
      ],
    },
    {
      id: 'se-m3',
      courseId: 'status-epilepticus-ii',
      moduleNumber: 3,
      title: 'Investigations and Cause Identification',
      duration: 30,
      description: 'Identify underlying cause and prevent recurrence',
      learningObjectives: [
        {
          id: 'se-lo5',
          text: 'Order appropriate investigations for status epilepticus',
          bloomLevel: 'apply',
        },
        {
          id: 'se-lo6',
          text: 'Identify common causes and manage accordingly',
          bloomLevel: 'analyze',
        },
      ],
      content: `
## Urgent Investigations

### Bedside
- Blood glucose
- Electrolytes (Na, K, Ca, Mg)
- Blood gas (pH, pCO2, pO2)
- Blood culture (if fever)

### Laboratory
- CBC, liver function tests
- Anticonvulsant levels (if on chronic therapy)
- Toxicology screen
- Lumbar puncture (if fever, meningitis suspected)

### Imaging
- CT head (if focal seizure, trauma, abnormal neuro exam)
- MRI (when stable, to identify structural cause)

### Monitoring
- Continuous EEG (if available)
- Cardiac monitoring
- Pulse oximetry, capnography

## Common Causes in Children
- **Fever/Infection**: Meningitis, encephalitis, UTI
- **Metabolic**: Hypoglycemia, hyponatremia, hypocalcemia
- **Intracranial**: Trauma, hemorrhage, tumor, stroke
- **Medication**: Overdose, withdrawal, non-compliance
- **Idiopathic**: No identifiable cause

## Management by Cause
- **Infection**: Antibiotics, antivirals
- **Metabolic**: Correct electrolyte abnormalities
- **Structural**: Neurosurgery consultation if needed
- **Medication**: Adjust doses or restart chronic therapy
      `,
      keyPoints: [
        'Always check glucose first',
        'Lumbar puncture if meningitis suspected',
        'Identify and treat underlying cause',
        'Restart chronic anticonvulsants if patient on them',
      ],
      references: [],
    },
  ],
  quiz: [
    {
      id: 'se-q1',
      questionNumber: 1,
      type: 'multiple-choice',
      text: 'Status epilepticus is defined as seizure activity lasting:',
      options: [
        '>1 minute',
        '>3 minutes',
        '>5 minutes or ≥2 seizures without full recovery',
        '>10 minutes',
      ],
      correctAnswer: '>5 minutes or ≥2 seizures without full recovery',
      explanation: 'Current definition emphasizes need for early treatment',
      points: 10,
    },
    {
      id: 'se-q2',
      questionNumber: 2,
      type: 'multiple-choice',
      text: 'First-line treatment for status epilepticus is:',
      options: [
        'Phenytoin IV',
        'Benzodiazepine (lorazepam or midazolam)',
        'Levetiracetam IV',
        'Valproic acid IV',
      ],
      correctAnswer: 'Benzodiazepine (lorazepam or midazolam)',
      explanation: 'Benzodiazepines are first-line due to rapid onset and efficacy',
      points: 10,
    },
    {
      id: 'se-q3',
      questionNumber: 3,
      type: 'true-false',
      text: 'Blood glucose should always be checked first in a seizing child.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: 'Hypoglycemia is a treatable cause of seizures',
      points: 10,
    },
  ],
  capstone: {
    id: 'se-capstone',
    title: 'Status Epilepticus Case Management',
    description: 'Manage a child with status epilepticus',
    caseScenario: `
A 3-year-old boy with no prior seizure history presents with continuous generalized tonic-clonic seizures for 8 minutes. He is febrile (39.5°C), with neck stiffness. Parents report he was well this morning.

Your management plan should include:
1. Immediate safety and airway measures
2. First-line anticonvulsant selection and dosing
3. Investigations to identify cause
4. When to consider second-line drugs
5. Specific management if meningitis confirmed
    `,
    scoringRubric: [
      {
        criterion: 'Correct first-line anticonvulsant and dosing',
        points: 25,
      },
      {
        criterion: 'Appropriate investigations ordered',
        points: 25,
      },
      {
        criterion: 'Recognition of meningitis risk and appropriate action',
        points: 25,
      },
      {
        criterion: 'Plan for escalation if seizure continues',
        points: 25,
      },
    ],
  },
};
