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


// ============================================
// DKA I: RECOGNITION AND INITIAL MANAGEMENT
// ============================================

export const dkaICourse: Course = {
  id: 'dka-i',
  title: 'Diabetic Ketoacidosis I: Recognition and Initial Management',
  description: 'Recognition of DKA, initial stabilization, and safe fluid resuscitation to prevent cerebral oedema in children',
  level: 'Intermediate',
  duration: 90,
  emergencyType: 'Metabolic',
  modules: [
    {
      id: 'dka-i-m1',
      courseId: 'dka-i',
      moduleNumber: 1,
      title: 'Recognising Diabetic Ketoacidosis in Children',
      duration: 30,
      description: 'Identify DKA using clinical and biochemical criteria',
      learningObjectives: [
        { id: 'dka-i-lo1', text: 'Define DKA using biochemical criteria (glucose, pH, bicarbonate, ketones)', bloomLevel: 'understand' },
        { id: 'dka-i-lo2', text: 'Classify DKA severity (mild, moderate, severe)', bloomLevel: 'apply' },
        { id: 'dka-i-lo3', text: 'Identify clinical features of DKA including Kussmaul breathing and dehydration', bloomLevel: 'apply' },
      ],
      content: `
## What is DKA?

Diabetic Ketoacidosis is a life-threatening metabolic emergency defined by the triad:
- **Hyperglycaemia**: Blood glucose >11 mmol/L (>200 mg/dL)
- **Acidosis**: pH <7.3 or bicarbonate <15 mmol/L
- **Ketonaemia/Ketonuria**: Ketones >3 mmol/L blood or 2+ urine

## Severity Classification (ISPAD 2022)

| Severity | pH | Bicarbonate | Altered Consciousness |
|----------|-----|-------------|----------------------|
| Mild | 7.2–7.3 | 10–15 mmol/L | Alert |
| Moderate | 7.1–7.2 | 5–10 mmol/L | Drowsy |
| Severe | <7.1 | <5 mmol/L | Stupor/Coma |

## Clinical Features

### History
- Polyuria, polydipsia, weight loss (new-onset diabetes)
- Vomiting, abdominal pain
- Reduced oral intake
- Known diabetic: missed insulin, intercurrent illness

### Examination
- **Dehydration**: Dry mucous membranes, sunken eyes, reduced skin turgor
- **Kussmaul breathing**: Deep, rapid, sighing respirations (compensatory)
- **Fruity breath**: Acetone odour
- **Altered consciousness**: GCS reduction in severe DKA
- **Shock**: Tachycardia, prolonged capillary refill (late sign)

## Investigations
- Blood glucose (bedside)
- Blood gas (pH, pCO2, bicarbonate)
- Electrolytes (Na, K, Cl, urea, creatinine)
- Blood ketones (preferred) or urine dipstick
- FBC, blood culture if infection suspected
- ECG (assess for hypokalaemia: flat T-waves, U-waves)

## Corrected Sodium
Hyperglycaemia causes dilutional hyponatraemia. Calculate corrected Na:
**Corrected Na = Measured Na + 2 × [(Glucose – 5.5) / 5.5]**

A falling corrected Na during treatment is a warning sign for cerebral oedema.
      `,
      keyPoints: [
        'DKA triad: hyperglycaemia + acidosis + ketonaemia',
        'Classify severity by pH and bicarbonate level',
        'Kussmaul breathing is a compensatory response to metabolic acidosis',
        'Always calculate corrected sodium — dilutional hyponatraemia is common',
        'ECG to detect hypokalaemia before starting insulin',
      ],
      references: [
        { title: 'ISPAD Clinical Practice Consensus Guidelines 2022: DKA', source: 'International Society for Pediatric and Adolescent Diabetes', year: 2022 },
        { title: 'BSPED DKA Guidelines 2021', source: 'British Society for Paediatric Endocrinology and Diabetes', year: 2021 },
      ],
    },
    {
      id: 'dka-i-m2',
      courseId: 'dka-i',
      moduleNumber: 2,
      title: 'Safe Fluid Resuscitation in DKA',
      duration: 35,
      description: 'Evidence-based fluid management to correct dehydration without precipitating cerebral oedema',
      learningObjectives: [
        { id: 'dka-i-lo4', text: 'Calculate fluid deficit and replacement rate for DKA', bloomLevel: 'apply' },
        { id: 'dka-i-lo5', text: 'Identify risk factors for cerebral oedema and modify management accordingly', bloomLevel: 'analyze' },
        { id: 'dka-i-lo6', text: 'Manage potassium replacement safely', bloomLevel: 'apply' },
      ],
      content: `
## Fluid Management in DKA

### Initial Resuscitation (Shock Only)
- **Indication**: Haemodynamic compromise (poor perfusion, prolonged CRT, hypotension)
- **Fluid**: 0.9% Normal Saline (NS)
- **Volume**: 10 mL/kg IV over 30 minutes
- **Repeat**: Once only if needed; avoid large boluses

> ⚠️ **CRITICAL**: Rapid fluid administration is the primary risk factor for cerebral oedema. Do NOT give large boluses unless haemodynamically compromised.

### Rehydration Phase (All DKA Patients)
- **Estimated deficit**: 5–10% dehydration (use 5% for mild, 7% for moderate, 10% for severe)
- **Duration**: Rehydrate over **48 hours** (not 24 hours)
- **Fluid**: 0.9% NS initially, then 0.45% NS with 5% dextrose once glucose <14 mmol/L

**Formula:**
Total fluid = Maintenance (24h × 2) + Deficit
Subtract any bolus already given.
Divide by 48 hours to get hourly rate.

### Example: 20 kg child, 7% dehydration
- Maintenance: 60 mL/hr × 48h = 2880 mL
- Deficit: 20 kg × 70 mL/kg = 1400 mL
- Total: 4280 mL over 48h = **89 mL/hr**

### Potassium Management
- **NEVER start insulin without knowing potassium**
- If K <3.5 mmol/L: Replace potassium BEFORE insulin
- If K 3.5–5.5 mmol/L: Add 40 mmol/L KCl to IV fluid
- If K >5.5 mmol/L: Withhold potassium, recheck in 2 hours
- Monitor ECG continuously

### When to Add Dextrose
- When blood glucose falls to <14 mmol/L
- Switch to 0.45% NS + 5% dextrose
- Continue insulin — do NOT stop insulin to manage glucose
- Adjust dextrose concentration (5–12.5%) to maintain glucose 8–12 mmol/L

## Cerebral Oedema Warning Signs
- Headache, agitation, change in behaviour
- Bradycardia, rising blood pressure (Cushing's triad)
- Declining GCS, seizures
- Papilloedema (late sign)

**Action if cerebral oedema suspected:**
1. Stop IV fluids immediately
2. Mannitol 0.5–1 g/kg IV over 20 min (or 3% hypertonic saline 2.5–5 mL/kg)
3. Elevate head of bed 30°
4. Urgent CT head
5. ICU referral
      `,
      keyPoints: [
        'Rehydrate over 48 hours — rapid rehydration causes cerebral oedema',
        'Bolus only for haemodynamic compromise: 10 mL/kg 0.9% NS once',
        'Never start insulin without knowing potassium level',
        'Add dextrose when glucose <14 mmol/L — do not stop insulin',
        'Cerebral oedema: mannitol 0.5–1 g/kg IV immediately',
      ],
      references: [
        { title: 'ISPAD Clinical Practice Consensus Guidelines 2022: DKA', source: 'ISPAD', year: 2022 },
        { title: 'Pediatric DKA Management Protocol', source: 'AHA PALS', year: 2023 },
      ],
    },
    {
      id: 'dka-i-m3',
      courseId: 'dka-i',
      moduleNumber: 3,
      title: 'Insulin Therapy and Monitoring',
      duration: 25,
      description: 'Safe insulin initiation, titration, and transition to subcutaneous therapy',
      learningObjectives: [
        { id: 'dka-i-lo7', text: 'Initiate insulin infusion at the correct rate and timing', bloomLevel: 'apply' },
        { id: 'dka-i-lo8', text: 'Monitor response to treatment and adjust insulin accordingly', bloomLevel: 'evaluate' },
      ],
      content: `
## Insulin Therapy in DKA

### When to Start Insulin
- **Wait 1–2 hours** after starting IV fluids before starting insulin
- Ensure potassium is ≥3.5 mmol/L before starting
- Do NOT give insulin bolus (increases cerebral oedema risk)

### Insulin Infusion Protocol
- **Rate**: 0.05–0.1 units/kg/hour (start at 0.05 for young children)
- **Preparation**: 1 unit/mL regular insulin in 0.9% NS
- **Target glucose fall**: 2–5 mmol/L/hour
- If glucose falling too fast: Add more dextrose, do NOT reduce insulin

### Monitoring Schedule
| Time | Glucose | Electrolytes | Blood Gas | Clinical |
|------|---------|--------------|-----------|----------|
| 0h | ✓ | ✓ | ✓ | ✓ |
| 1h | ✓ | — | — | ✓ |
| 2h | ✓ | ✓ | ✓ | ✓ |
| 4h | ✓ | ✓ | ✓ | ✓ |
| 6h | ✓ | ✓ | ✓ | ✓ |
| Every 2h thereafter | ✓ | ✓ | ✓ | ✓ |

### Resolution Criteria (Switch to SC Insulin)
- pH >7.3 AND bicarbonate >15 mmol/L
- Blood ketones <1 mmol/L (or urine ketones <2+)
- Patient tolerating oral fluids
- Give SC insulin 30 min BEFORE stopping infusion
      `,
      keyPoints: [
        'Start insulin 1–2 hours after fluids, never as a bolus',
        'Insulin rate: 0.05–0.1 units/kg/hour',
        'If glucose falls too fast: add dextrose, do NOT reduce insulin',
        'Transition to SC insulin when pH >7.3 and ketones cleared',
        'Monitor hourly glucose and 2-hourly electrolytes',
      ],
      references: [
        { title: 'ISPAD DKA Guidelines 2022', source: 'ISPAD', year: 2022 },
      ],
    },
  ],
  quiz: [
    {
      id: 'dka-i-q1',
      questionNumber: 1,
      type: 'multiple-choice',
      text: 'A 10-year-old presents with vomiting, deep sighing respirations, and blood glucose of 28 mmol/L. pH is 7.18, bicarbonate 8 mmol/L. What is the severity of DKA?',
      options: ['Mild DKA', 'Moderate DKA', 'Severe DKA', 'Hyperosmolar hyperglycaemic state'],
      correctAnswer: 'Moderate DKA',
      explanation: 'pH 7.1–7.2 and bicarbonate 5–10 mmol/L = moderate DKA. Severe DKA requires pH <7.1 and bicarbonate <5 mmol/L.',
      points: 10,
    },
    {
      id: 'dka-i-q2',
      questionNumber: 2,
      type: 'multiple-choice',
      text: 'A 15 kg child with moderate DKA has no signs of shock. What is the correct initial fluid management?',
      options: [
        '20 mL/kg NS bolus immediately',
        'Start rehydration over 24 hours with 0.9% NS',
        'Start rehydration over 48 hours with 0.9% NS',
        'Give oral rehydration salts',
      ],
      correctAnswer: 'Start rehydration over 48 hours with 0.9% NS',
      explanation: 'In DKA without shock, rehydrate over 48 hours to prevent cerebral oedema. Bolus is only for haemodynamic compromise.',
      points: 10,
    },
    {
      id: 'dka-i-q3',
      questionNumber: 3,
      type: 'true-false',
      text: 'Insulin infusion should be started immediately upon diagnosis of DKA, before fluid resuscitation.',
      options: ['True', 'False'],
      correctAnswer: 'False',
      explanation: 'Insulin should be started 1–2 hours after beginning IV fluids, and only after confirming potassium ≥3.5 mmol/L. Early insulin without fluids worsens hypokalaemia and increases cerebral oedema risk.',
      points: 10,
    },
  ],
  capstone: {
    id: 'dka-i-capstone',
    title: 'DKA Management Case',
    description: 'Manage a child presenting with new-onset DKA',
    caseScenario: `
A 9-year-old girl presents to your emergency department with a 3-day history of polyuria, polydipsia, and vomiting. She is drowsy (GCS 13/15), with deep sighing respirations, dry mucous membranes, and prolonged capillary refill of 3 seconds.

Vitals: HR 128, BP 95/60, RR 28, SpO2 98%, Temp 37.2°C
Weight: 28 kg
Blood glucose: 32 mmol/L
Blood gas: pH 7.15, pCO2 18, HCO3 7 mmol/L
Na 132 mmol/L, K 3.8 mmol/L, Cl 98 mmol/L
Blood ketones: 5.2 mmol/L

Your management plan should address:
1. Severity classification and immediate priorities
2. Fluid resuscitation plan with volumes and rates
3. Potassium management strategy
4. Insulin initiation timing and rate
5. Monitoring plan and cerebral oedema prevention
    `,
    scoringRubric: [
      { criterion: 'Correct severity classification (moderate/severe DKA)', points: 20 },
      { criterion: 'Appropriate fluid plan (48-hour rehydration, correct volumes)', points: 25 },
      { criterion: 'Safe potassium management before insulin', points: 20 },
      { criterion: 'Correct insulin timing and rate (0.05–0.1 units/kg/hr, after 1–2h fluids)', points: 20 },
      { criterion: 'Cerebral oedema monitoring and response plan', points: 15 },
    ],
  },
};

// ============================================
// DKA II: COMPLICATIONS AND SPECIAL SITUATIONS
// ============================================

export const dkaIICourse: Course = {
  id: 'dka-ii',
  title: 'Diabetic Ketoacidosis II: Complications and Special Situations',
  description: 'Advanced management of DKA complications including cerebral oedema, hypokalaemia, and DKA in infants',
  level: 'Advanced',
  duration: 90,
  emergencyType: 'Metabolic',
  modules: [
    {
      id: 'dka-ii-m1',
      courseId: 'dka-ii',
      moduleNumber: 1,
      title: 'Cerebral Oedema in DKA',
      duration: 35,
      description: 'Prevention, recognition, and emergency treatment of cerebral oedema',
      learningObjectives: [
        { id: 'dka-ii-lo1', text: 'Identify risk factors and early warning signs of cerebral oedema', bloomLevel: 'analyze' },
        { id: 'dka-ii-lo2', text: 'Initiate emergency treatment for cerebral oedema within minutes', bloomLevel: 'apply' },
      ],
      content: `
## Cerebral Oedema in DKA

### Epidemiology
- Occurs in 0.5–1% of DKA episodes
- Leading cause of DKA-related mortality (mortality 20–25%)
- Most common in children <5 years and new-onset diabetes

### Risk Factors
- Age <5 years
- New-onset diabetes
- Severe acidosis (pH <7.1)
- High BUN (dehydration marker)
- Rapid fluid administration (>10 mL/kg bolus)
- Bicarbonate therapy (avoid in DKA)
- Failure of corrected sodium to rise during treatment

### Warning Signs (Act Immediately)
**Early:**
- Headache (new or worsening)
- Behaviour change, agitation, confusion
- Slowing heart rate (bradycardia)
- Rising blood pressure

**Late (Herniation Imminent):**
- Declining GCS
- Pupil changes (unequal, fixed dilated)
- Seizures
- Cushing's triad (bradycardia + hypertension + irregular breathing)

### Emergency Treatment
1. **Mannitol** 0.5–1 g/kg IV over 20 minutes (first choice)
   - Preparation: 20% mannitol solution
   - Repeat after 2 hours if no improvement
2. **OR 3% Hypertonic Saline** 2.5–5 mL/kg IV over 10–15 minutes
   - Use if mannitol unavailable
3. **Reduce IV fluid rate by 30–50%**
4. **Elevate head of bed 30°** (neutral position, avoid neck flexion)
5. **Urgent CT head** (after stabilisation)
6. **ICU referral immediately**
7. **Intubation** only if airway protection needed (avoid hyperventilation)
      `,
      keyPoints: [
        'Cerebral oedema: most feared DKA complication, 20–25% mortality',
        'Risk: age <5, new-onset diabetes, rapid fluids, severe acidosis',
        'Act on early signs: headache, behaviour change, bradycardia',
        'Mannitol 0.5–1 g/kg IV over 20 min — first-line treatment',
        'Reduce fluid rate immediately; do NOT hyperventilate',
      ],
      references: [
        { title: 'ISPAD DKA Guidelines 2022', source: 'ISPAD', year: 2022 },
        { title: 'Cerebral Oedema in Paediatric DKA', source: 'Pediatric Diabetes', year: 2021 },
      ],
    },
    {
      id: 'dka-ii-m2',
      courseId: 'dka-ii',
      moduleNumber: 2,
      title: 'Electrolyte Complications and Special Populations',
      duration: 35,
      description: 'Managing hypokalaemia, hyponatraemia, and DKA in infants and neonates',
      learningObjectives: [
        { id: 'dka-ii-lo3', text: 'Manage severe hypokalaemia in DKA safely', bloomLevel: 'apply' },
        { id: 'dka-ii-lo4', text: 'Adapt DKA management for infants and neonates', bloomLevel: 'apply' },
      ],
      content: `
## Hypokalaemia in DKA

### Mechanism
- Total body potassium depletion despite normal/high serum K
- Insulin drives K into cells → serum K falls rapidly
- Acidosis correction also shifts K intracellularly

### Management
| Serum K | Action |
|---------|--------|
| <3.0 mmol/L | Stop insulin, give KCl 0.3–0.5 mmol/kg/hr IV, recheck in 1h |
| 3.0–3.5 mmol/L | Give KCl 0.3 mmol/kg/hr, start insulin cautiously |
| 3.5–5.5 mmol/L | Add 40 mmol/L KCl to IV fluid, proceed with insulin |
| >5.5 mmol/L | Withhold K, recheck in 2h |

**Maximum IV KCl rate**: 0.5 mmol/kg/hr (requires cardiac monitoring)

## DKA in Infants (<2 years)

### Special Considerations
- Rare but more severe presentation
- Higher risk of cerebral oedema
- Smaller fluid volumes — calculate carefully
- Consider neonatal diabetes (KCNJ11 mutations — may respond to sulphonylureas)
- Lower insulin dose: start at 0.05 units/kg/hr

### Neonatal DKA
- Blood glucose may be lower (>11 mmol/L still diagnostic)
- pH and ketones same criteria
- Consult paediatric endocrinology urgently
- Genetic testing for neonatal diabetes

## Bicarbonate — When NOT to Use
- **Avoid bicarbonate in DKA** (increases cerebral oedema risk, paradoxical CSF acidosis)
- Only consider if: pH <6.9 with haemodynamic compromise AND no response to fluids
- If used: NaHCO3 1–2 mmol/kg IV over 60 minutes (not a bolus)
      `,
      keyPoints: [
        'Stop insulin if K <3.0 mmol/L — replace potassium first',
        'Maximum IV KCl rate: 0.5 mmol/kg/hr with cardiac monitoring',
        'Infants: start insulin at 0.05 units/kg/hr, higher cerebral oedema risk',
        'Avoid bicarbonate — increases cerebral oedema risk',
        'Neonatal DKA: consider genetic testing for neonatal diabetes',
      ],
      references: [
        { title: 'ISPAD DKA Guidelines 2022', source: 'ISPAD', year: 2022 },
      ],
    },
  ],
  quiz: [
    {
      id: 'dka-ii-q1',
      questionNumber: 1,
      type: 'multiple-choice',
      text: 'A child with DKA develops headache and bradycardia 4 hours into treatment. Corrected sodium has fallen from 138 to 132 mmol/L. What is the most likely diagnosis and first action?',
      options: [
        'Hypoglycaemia — check glucose and give dextrose',
        'Cerebral oedema — give mannitol 0.5–1 g/kg IV',
        'Hypokalaemia — check ECG and give KCl',
        'Sepsis — give antibiotics',
      ],
      correctAnswer: 'Cerebral oedema — give mannitol 0.5–1 g/kg IV',
      explanation: 'Headache, bradycardia, and falling corrected sodium during DKA treatment are classic warning signs of cerebral oedema. Mannitol 0.5–1 g/kg IV over 20 minutes is first-line treatment.',
      points: 10,
    },
    {
      id: 'dka-ii-q2',
      questionNumber: 2,
      type: 'true-false',
      text: 'Sodium bicarbonate should be given routinely in severe DKA (pH <7.1) to correct acidosis faster.',
      options: ['True', 'False'],
      correctAnswer: 'False',
      explanation: 'Bicarbonate is contraindicated in DKA. It increases the risk of cerebral oedema and causes paradoxical CSF acidosis. Acidosis corrects with fluid and insulin therapy.',
      points: 10,
    },
    {
      id: 'dka-ii-q3',
      questionNumber: 3,
      type: 'multiple-choice',
      text: 'A child with DKA has serum K of 2.8 mmol/L. What is the correct action?',
      options: [
        'Start insulin at 0.1 units/kg/hr and add KCl to fluids',
        'Stop insulin, give KCl 0.3–0.5 mmol/kg/hr IV, recheck in 1 hour',
        'Give oral potassium supplements and continue insulin',
        'Increase IV fluid rate to dilute potassium',
      ],
      correctAnswer: 'Stop insulin, give KCl 0.3–0.5 mmol/kg/hr IV, recheck in 1 hour',
      explanation: 'K <3.0 mmol/L is dangerous with insulin. Stop insulin immediately, replace potassium IV at 0.3–0.5 mmol/kg/hr with cardiac monitoring, and recheck before restarting insulin.',
      points: 10,
    },
  ],
  capstone: {
    id: 'dka-ii-capstone',
    title: 'DKA Complications Case',
    description: 'Manage a child with DKA who develops cerebral oedema',
    caseScenario: `
A 6-year-old boy (22 kg) with known Type 1 diabetes is admitted with DKA (pH 7.08, glucose 38 mmol/L, K 4.2 mmol/L). He received a 10 mL/kg NS bolus and was started on 48-hour rehydration and insulin infusion at 0.1 units/kg/hr.

3 hours into treatment: Glucose has fallen to 14 mmol/L, pH improved to 7.22. However, the nurse calls you urgently — the child is now complaining of severe headache, his HR has dropped from 120 to 78, and his GCS has fallen from 15 to 12. Corrected sodium has fallen from 140 to 133 mmol/L.

Your management plan should include:
1. Diagnosis and immediate action
2. Specific drug treatment with dose and route
3. Fluid management changes
4. Monitoring and escalation plan
5. How to prevent this complication in future patients
    `,
    scoringRubric: [
      { criterion: 'Correct diagnosis of cerebral oedema', points: 20 },
      { criterion: 'Correct mannitol dose (0.5–1 g/kg IV over 20 min)', points: 25 },
      { criterion: 'Appropriate fluid rate reduction', points: 20 },
      { criterion: 'ICU referral and monitoring plan', points: 20 },
      { criterion: 'Prevention strategies identified', points: 15 },
    ],
  },
};


// ============================================
// ANAPHYLAXIS I: RECOGNITION AND EMERGENCY MANAGEMENT
// ============================================

export const anaphylaxisICourse: Course = {
  id: 'anaphylaxis-i',
  title: 'Anaphylaxis I: Recognition and Emergency Management',
  description: 'Rapid recognition of anaphylaxis and immediate life-saving treatment with adrenaline in children',
  level: 'Foundational',
  duration: 60,
  emergencyType: 'Allergic',
  modules: [
    {
      id: 'ana-i-m1',
      courseId: 'anaphylaxis-i',
      moduleNumber: 1,
      title: 'Recognising Anaphylaxis',
      duration: 20,
      description: 'Identify anaphylaxis using clinical criteria across all presentations',
      learningObjectives: [
        { id: 'ana-i-lo1', text: 'Define anaphylaxis and identify its diagnostic criteria', bloomLevel: 'understand' },
        { id: 'ana-i-lo2', text: 'Recognise anaphylaxis in atypical presentations (no skin features)', bloomLevel: 'apply' },
        { id: 'ana-i-lo3', text: 'Identify common triggers in the paediatric population', bloomLevel: 'remember' },
      ],
      content: `
## What is Anaphylaxis?

Anaphylaxis is a **severe, life-threatening, generalised hypersensitivity reaction** characterised by rapidly developing airway, breathing, or circulation problems, usually associated with skin and mucosal changes.

## Diagnostic Criteria (WAO 2020)

Anaphylaxis is likely when ANY ONE of the following three criteria is met:

**Criterion 1:** Acute onset with skin/mucosal involvement PLUS either:
- Respiratory compromise (wheeze, stridor, SpO2 <90%)
- Cardiovascular compromise (hypotension, syncope, collapse)

**Criterion 2:** Two or more of the following after exposure to a likely allergen:
- Skin/mucosal involvement
- Respiratory compromise
- Cardiovascular compromise
- Persistent GI symptoms (vomiting, abdominal pain)

**Criterion 3:** Hypotension after exposure to a known allergen for that patient

## Common Triggers in Children

| Category | Examples |
|----------|---------|
| Foods | Peanuts, tree nuts, milk, egg, wheat, fish, shellfish |
| Medications | Penicillin, NSAIDs, anaesthetic agents |
| Insect stings | Bee, wasp |
| Latex | Gloves, catheters |
| Exercise | Exercise-induced anaphylaxis |

## Clinical Features

### Skin (80–90% of cases)
- Urticaria (hives), angioedema
- Flushing, pruritus
- **Absence of skin features does NOT exclude anaphylaxis**

### Airway
- Stridor (upper airway oedema)
- Hoarseness, throat tightness
- Drooling, difficulty swallowing

### Breathing
- Wheeze, bronchospasm
- Tachypnoea, increased work of breathing
- SpO2 falling

### Circulation
- Tachycardia (early), bradycardia (late/severe)
- Hypotension, pallor
- Loss of consciousness, cardiac arrest

### GI
- Nausea, vomiting, abdominal cramps, diarrhoea
      `,
      keyPoints: [
        'Anaphylaxis can occur WITHOUT skin features — do not wait for urticaria',
        'Three diagnostic criteria: skin + airway/circulation, OR two systems, OR hypotension post-allergen',
        'Common paediatric triggers: foods (peanut, milk, egg), medications, insect stings',
        'Stridor = upper airway oedema — act immediately',
        'Bradycardia is a late and ominous sign',
      ],
      references: [
        { title: 'World Allergy Organization Anaphylaxis Guidelines 2020', source: 'WAO', year: 2020 },
        { title: 'NICE Guideline CG134: Anaphylaxis', source: 'NICE', year: 2020 },
      ],
    },
    {
      id: 'ana-i-m2',
      courseId: 'anaphylaxis-i',
      moduleNumber: 2,
      title: 'Emergency Treatment of Anaphylaxis',
      duration: 25,
      description: 'Immediate life-saving treatment with adrenaline and supportive care',
      learningObjectives: [
        { id: 'ana-i-lo4', text: 'Administer adrenaline at the correct dose, route, and site', bloomLevel: 'apply' },
        { id: 'ana-i-lo5', text: 'Provide appropriate supportive care after adrenaline', bloomLevel: 'apply' },
        { id: 'ana-i-lo6', text: 'Recognise biphasic anaphylaxis and plan observation period', bloomLevel: 'analyze' },
      ],
      content: `
## Immediate Management: ABCDE Approach

### A: Airway
- Call for help immediately
- Position: Sitting up if respiratory distress; lying flat with legs elevated if hypotensive
- **Do NOT make patient stand up** — can cause cardiac arrest

### B: Breathing
- High-flow oxygen via non-rebreather mask (15 L/min)
- Salbutamol nebulisation for bronchospasm (0.15 mg/kg, max 5 mg)

### C: Circulation
- IV/IO access — large bore
- Fluid bolus if hypotensive: 10–20 mL/kg 0.9% NS

## Adrenaline (Epinephrine) — FIRST-LINE TREATMENT

> ⚠️ **Adrenaline is the ONLY first-line treatment for anaphylaxis. Give it IMMEDIATELY.**

### Intramuscular Adrenaline (Preferred Route)
- **Site**: Anterolateral thigh (vastus lateralis) — NOT buttock
- **Concentration**: 1:1000 (1 mg/mL)
- **Dose by weight**:

| Weight | Dose | Volume (1:1000) |
|--------|------|-----------------|
| <15 kg | 0.15 mg | 0.15 mL |
| 15–30 kg | 0.3 mg | 0.3 mL |
| >30 kg | 0.5 mg | 0.5 mL |

- **Repeat**: Every 5–15 minutes if no improvement
- **Auto-injectors**: EpiPen Jr (0.15 mg) for <30 kg; EpiPen (0.3 mg) for ≥30 kg

### IV Adrenaline (Refractory/Cardiac Arrest)
- Only if IM adrenaline has failed AND IV access established
- **Concentration**: 1:10,000 (0.1 mg/mL)
- **Dose**: 0.01 mg/kg (0.1 mL/kg of 1:10,000) IV slowly
- Requires cardiac monitoring

## Second-Line Treatments (After Adrenaline)

### Antihistamines (NOT first-line, NOT life-saving)
- Chlorphenamine: 0.1 mg/kg IV/IM (max 10 mg)
- Treat urticaria and pruritus only — do NOT delay adrenaline

### Corticosteroids (NOT first-line)
- Hydrocortisone: 4 mg/kg IV (max 200 mg)
- May reduce biphasic reaction — give after adrenaline

## Biphasic Anaphylaxis
- Second reaction 1–72 hours after initial reaction (occurs in 5–20%)
- **Observation period**: Minimum 4–6 hours after adrenaline
- High-risk features requiring 12–24h observation:
  - Severe initial reaction
  - Slow response to adrenaline
  - Asthma history
  - Unknown trigger
      `,
      keyPoints: [
        'Adrenaline IM to anterolateral thigh — FIRST and ONLY first-line treatment',
        'Dose: 0.01 mg/kg IM (max 0.5 mg); repeat every 5–15 min if no improvement',
        'Antihistamines and steroids are NOT first-line — do NOT delay adrenaline for them',
        'Position: sitting if respiratory distress; flat with legs elevated if hypotensive',
        'Observe minimum 4–6 hours for biphasic reaction',
      ],
      references: [
        { title: 'WAO Anaphylaxis Guidelines 2020', source: 'WAO', year: 2020 },
        { title: 'Resuscitation Council UK Anaphylaxis Algorithm 2021', source: 'RCUK', year: 2021 },
      ],
    },
    {
      id: 'ana-i-m3',
      courseId: 'anaphylaxis-i',
      moduleNumber: 3,
      title: 'Discharge Planning and Allergy Referral',
      duration: 15,
      description: 'Safe discharge, adrenaline auto-injector prescription, and allergy follow-up',
      learningObjectives: [
        { id: 'ana-i-lo7', text: 'Prescribe adrenaline auto-injector and educate patient/family', bloomLevel: 'apply' },
        { id: 'ana-i-lo8', text: 'Plan appropriate allergy referral and follow-up', bloomLevel: 'apply' },
      ],
      content: `
## Discharge Planning After Anaphylaxis

### Before Discharge
- Observation period complete (minimum 4–6 hours)
- Vital signs stable, symptoms resolved
- Patient/carer educated on:
  - Trigger identification and avoidance
  - Early recognition of symptoms
  - How to use adrenaline auto-injector
  - When to call emergency services

### Adrenaline Auto-Injector Prescription
- **All patients with anaphylaxis should be prescribed TWO auto-injectors**
- EpiPen Jr (0.15 mg) for weight <30 kg
- EpiPen (0.3 mg) for weight ≥30 kg
- Demonstrate use before discharge
- Provide written action plan

### Allergy Referral
- All patients should be referred to a paediatric allergist
- Skin prick testing and specific IgE to identify trigger
- Discuss allergen immunotherapy where appropriate
- School/nursery allergy action plan

### Patient/Family Education Points
1. Carry two auto-injectors at all times
2. Wear medical alert bracelet
3. Inform school, nursery, sports coaches
4. Read food labels carefully
5. Inject into outer thigh (through clothing if necessary)
6. Call emergency services after every use
7. Do not rely on antihistamines alone
      `,
      keyPoints: [
        'Prescribe TWO adrenaline auto-injectors at discharge',
        'Demonstrate auto-injector use before discharge',
        'Refer all patients to paediatric allergist',
        'Provide written emergency action plan',
        'Educate on trigger avoidance and early recognition',
      ],
      references: [
        { title: 'NICE CG134 Anaphylaxis: Assessment and Referral', source: 'NICE', year: 2020 },
      ],
    },
  ],
  quiz: [
    {
      id: 'ana-i-q1',
      questionNumber: 1,
      type: 'multiple-choice',
      text: 'A 5-year-old (18 kg) develops sudden wheeze, urticaria, and vomiting 10 minutes after eating peanuts. What is the FIRST treatment?',
      options: [
        'Chlorphenamine 2 mg IV',
        'Salbutamol nebulisation 2.5 mg',
        'Adrenaline 0.3 mg IM to anterolateral thigh',
        'Hydrocortisone 75 mg IV',
      ],
      correctAnswer: 'Adrenaline 0.3 mg IM to anterolateral thigh',
      explanation: 'This is anaphylaxis (skin + respiratory symptoms after allergen exposure). Adrenaline IM is the ONLY first-line treatment. For 18 kg, the dose is 0.3 mg (15–30 kg range). Antihistamines and steroids are not first-line.',
      points: 10,
    },
    {
      id: 'ana-i-q2',
      questionNumber: 2,
      type: 'true-false',
      text: 'Anaphylaxis cannot be diagnosed if there are no skin features (urticaria or angioedema).',
      options: ['True', 'False'],
      correctAnswer: 'False',
      explanation: 'Anaphylaxis can occur without skin features in up to 20% of cases. Cardiovascular collapse after allergen exposure (Criterion 3) is sufficient for diagnosis even without skin involvement.',
      points: 10,
    },
    {
      id: 'ana-i-q3',
      questionNumber: 3,
      type: 'multiple-choice',
      text: 'After treating anaphylaxis with IM adrenaline, the child improves. What is the minimum observation period before discharge?',
      options: ['1 hour', '2 hours', '4–6 hours', '24 hours'],
      correctAnswer: '4–6 hours',
      explanation: 'Biphasic anaphylaxis can occur 1–72 hours after the initial reaction. All patients require minimum 4–6 hours observation. High-risk patients (severe reaction, asthma, unknown trigger) need 12–24 hours.',
      points: 10,
    },
  ],
  capstone: {
    id: 'ana-i-capstone',
    title: 'Anaphylaxis Management Case',
    description: 'Manage a child with severe anaphylaxis',
    caseScenario: `
A 7-year-old girl (22 kg) with known peanut allergy is brought to your emergency department. She accidentally ate a biscuit containing peanuts 15 minutes ago. She is now in severe distress: stridor, wheeze, urticaria over her trunk, and vomiting. HR 145, BP 80/50, RR 32, SpO2 91% on room air. She is anxious but conscious.

Your management plan should include:
1. Immediate priorities and positioning
2. First-line drug treatment with exact dose and route
3. Supportive treatments in order of priority
4. Monitoring and reassessment plan
5. Discharge planning and follow-up
    `,
    scoringRubric: [
      { criterion: 'Correct diagnosis and immediate adrenaline administration', points: 30 },
      { criterion: 'Correct adrenaline dose (0.3 mg IM, anterolateral thigh)', points: 25 },
      { criterion: 'Appropriate supportive care (oxygen, fluids, salbutamol)', points: 20 },
      { criterion: 'Observation plan and biphasic anaphylaxis awareness', points: 15 },
      { criterion: 'Discharge planning with auto-injector prescription', points: 10 },
    ],
  },
};

// ============================================
// ANAPHYLAXIS II: REFRACTORY AND SPECIAL SITUATIONS
// ============================================

export const anaphylaxisIICourse: Course = {
  id: 'anaphylaxis-ii',
  title: 'Anaphylaxis II: Refractory Cases and Special Situations',
  description: 'Management of refractory anaphylaxis, anaphylaxis in infants, and anaphylaxis during anaesthesia',
  level: 'Advanced',
  duration: 75,
  emergencyType: 'Allergic',
  modules: [
    {
      id: 'ana-ii-m1',
      courseId: 'anaphylaxis-ii',
      moduleNumber: 1,
      title: 'Refractory Anaphylaxis',
      duration: 35,
      description: 'Managing anaphylaxis that does not respond to initial adrenaline treatment',
      learningObjectives: [
        { id: 'ana-ii-lo1', text: 'Define refractory anaphylaxis and identify contributing factors', bloomLevel: 'analyze' },
        { id: 'ana-ii-lo2', text: 'Implement advanced treatment strategies for refractory anaphylaxis', bloomLevel: 'apply' },
      ],
      content: `
## Refractory Anaphylaxis

### Definition
Anaphylaxis that **fails to respond to two doses of IM adrenaline** and appropriate supportive care.

### Contributing Factors
- Delayed adrenaline administration
- Incorrect dose or route (IM buttock instead of thigh)
- Beta-blocker use (blocks adrenaline effect)
- ACE inhibitor use (bradykinin-mediated angioedema)
- Mast cell disorders (mastocytosis)
- Severe cardiovascular disease

### Advanced Treatment Algorithm

**Step 1: IV Adrenaline Infusion**
- Indication: No response after 2 IM doses + IV access established
- Preparation: 1 mg adrenaline in 100 mL 0.9% NS = 10 mcg/mL
- Starting dose: 0.1–0.5 mcg/kg/min IV
- Titrate to response (HR, BP, SpO2)
- Requires continuous cardiac monitoring

**Step 2: Aggressive Fluid Resuscitation**
- 20 mL/kg 0.9% NS bolus, repeat as needed
- Anaphylaxis can cause massive fluid shifts (up to 50% of plasma volume)

**Step 3: Vasopressors (if adrenaline infusion insufficient)**
- Noradrenaline: 0.1–1 mcg/kg/min IV
- Vasopressin: 0.01–0.04 units/kg/min (if refractory vasodilation)

**Step 4: Glucagon (for beta-blocker patients)**
- Mechanism: Bypasses beta-adrenergic blockade
- Dose: 20–30 mcg/kg IV over 5 minutes (max 1 mg)
- Follow with infusion: 5–15 mcg/min

**Step 5: Methylene Blue (last resort)**
- Mechanism: Inhibits nitric oxide-mediated vasodilation
- Dose: 1–2 mg/kg IV over 20 minutes
- Evidence limited but used in refractory cases

### Cardiac Arrest in Anaphylaxis
- Standard CPR + adrenaline 0.01 mg/kg IV every 3–5 min
- High-dose adrenaline may be needed
- Consider ECMO if available and no response to CPR
      `,
      keyPoints: [
        'Refractory: no response after 2 IM adrenaline doses',
        'IV adrenaline infusion: 0.1–0.5 mcg/kg/min, titrate to response',
        'Glucagon for beta-blocker patients: 20–30 mcg/kg IV',
        'Aggressive fluids: 20 mL/kg boluses, repeat as needed',
        'Cardiac arrest: standard CPR + high-dose IV adrenaline',
      ],
      references: [
        { title: 'WAO Anaphylaxis Guidelines 2020', source: 'WAO', year: 2020 },
        { title: 'Resuscitation Council UK Anaphylaxis Algorithm 2021', source: 'RCUK', year: 2021 },
      ],
    },
    {
      id: 'ana-ii-m2',
      courseId: 'anaphylaxis-ii',
      moduleNumber: 2,
      title: 'Anaphylaxis in Special Populations',
      duration: 25,
      description: 'Anaphylaxis in infants, during anaesthesia, and food protein-induced enterocolitis',
      learningObjectives: [
        { id: 'ana-ii-lo3', text: 'Adapt anaphylaxis management for infants under 12 months', bloomLevel: 'apply' },
        { id: 'ana-ii-lo4', text: 'Recognise and manage anaphylaxis during anaesthesia', bloomLevel: 'apply' },
      ],
      content: `
## Anaphylaxis in Infants (<12 months)

### Challenges
- Skin features may be absent or atypical
- Cardiovascular signs predominate (pallor, limpness)
- Stridor may be confused with croup
- Weight estimation critical for dosing

### Adrenaline Dosing in Infants
- IM: 0.01 mg/kg (1:1000 solution) to anterolateral thigh
- Minimum dose: 0.05 mg (0.05 mL of 1:1000)
- Maximum dose: 0.15 mg (EpiPen Jr)

### FPIES (Food Protein-Induced Enterocolitis Syndrome)
- NOT IgE-mediated — adrenaline NOT first-line
- Presents: profuse vomiting 1–4 hours after trigger food
- Treatment: IV fluids, ondansetron 0.15 mg/kg IV
- Common triggers: cow's milk, soy, rice, oats

## Perioperative Anaphylaxis

### Recognition
- Cardiovascular collapse is the most common presentation (80%)
- Skin features may be hidden by surgical drapes
- Triggers: neuromuscular blocking agents, latex, antibiotics, chlorhexidine

### Management
1. Stop trigger agent immediately
2. Call for help, activate emergency protocol
3. Adrenaline: 0.01 mg/kg IV (1:10,000) — NOT IM in anaesthesia
4. Aggressive IV fluids
5. Maintain anaesthesia with volatile agent (not IV agents)
6. Tryptase levels at 0, 1, and 4 hours (diagnostic)
7. Refer to allergy clinic for skin testing 4–6 weeks post-event
      `,
      keyPoints: [
        'Infant anaphylaxis: cardiovascular signs predominate, minimum adrenaline dose 0.05 mg',
        'FPIES is NOT IgE-mediated — treat with IV fluids and ondansetron, not adrenaline',
        'Perioperative anaphylaxis: IV adrenaline 0.01 mg/kg, stop trigger agent',
        'Tryptase levels at 0, 1, 4 hours confirm anaphylaxis diagnosis',
        'Refer to allergy clinic 4–6 weeks after perioperative anaphylaxis',
      ],
      references: [
        { title: 'ASCIA Anaphylaxis Guidelines 2021', source: 'Australasian Society of Clinical Immunology and Allergy', year: 2021 },
      ],
    },
  ],
  quiz: [
    {
      id: 'ana-ii-q1',
      questionNumber: 1,
      type: 'multiple-choice',
      text: 'A child with anaphylaxis has received two IM adrenaline doses without improvement. IV access is established. What is the next step?',
      options: [
        'Give a third IM adrenaline dose',
        'Start IV adrenaline infusion at 0.1–0.5 mcg/kg/min',
        'Give IV hydrocortisone 4 mg/kg',
        'Give IV chlorphenamine 0.1 mg/kg',
      ],
      correctAnswer: 'Start IV adrenaline infusion at 0.1–0.5 mcg/kg/min',
      explanation: 'Refractory anaphylaxis (no response to 2 IM doses) requires IV adrenaline infusion. Start at 0.1–0.5 mcg/kg/min and titrate to response. Steroids and antihistamines are not effective for acute haemodynamic compromise.',
      points: 10,
    },
    {
      id: 'ana-ii-q2',
      questionNumber: 2,
      type: 'true-false',
      text: 'FPIES (Food Protein-Induced Enterocolitis Syndrome) should be treated with adrenaline as first-line therapy.',
      options: ['True', 'False'],
      correctAnswer: 'False',
      explanation: 'FPIES is a non-IgE-mediated food allergy. It presents with profuse vomiting 1–4 hours after trigger food. Treatment is IV fluids and ondansetron, NOT adrenaline.',
      points: 10,
    },
    {
      id: 'ana-ii-q3',
      questionNumber: 3,
      type: 'multiple-choice',
      text: 'A child on beta-blockers develops refractory anaphylaxis not responding to adrenaline. What additional drug should be considered?',
      options: ['Atropine 0.02 mg/kg IV', 'Glucagon 20–30 mcg/kg IV', 'Calcium gluconate 0.3 mL/kg IV', 'Adenosine 0.1 mg/kg IV'],
      correctAnswer: 'Glucagon 20–30 mcg/kg IV',
      explanation: 'Beta-blockers block the effect of adrenaline. Glucagon bypasses beta-adrenergic blockade and can restore cardiovascular function. Dose: 20–30 mcg/kg IV over 5 minutes.',
      points: 10,
    },
  ],
  capstone: {
    id: 'ana-ii-capstone',
    title: 'Refractory Anaphylaxis Case',
    description: 'Manage a child with anaphylaxis not responding to initial treatment',
    caseScenario: `
A 10-year-old boy (35 kg) with bee sting allergy is brought in after multiple bee stings. He has received two EpiPen doses (0.3 mg each) at home with minimal improvement. On arrival: HR 155, BP 65/40, RR 36, SpO2 88%, GCS 12. He has generalised urticaria, angioedema of lips and tongue, and severe wheeze. His mother mentions he takes propranolol for SVT.

Your management plan should include:
1. Immediate priorities and airway management
2. Advanced adrenaline strategy given beta-blocker use
3. Fluid resuscitation plan
4. Additional pharmacological interventions
5. ICU referral criteria and handover
    `,
    scoringRubric: [
      { criterion: 'Airway management (early intubation consideration given angioedema)', points: 25 },
      { criterion: 'IV adrenaline infusion initiation', points: 25 },
      { criterion: 'Glucagon use for beta-blocker reversal', points: 20 },
      { criterion: 'Aggressive fluid resuscitation', points: 15 },
      { criterion: 'ICU referral and monitoring plan', points: 15 },
    ],
  },
};


// ─── Burns I ─────────────────────────────────────────────────

export const burnsICourse: Course = {
  id: 'burns-i',
  courseId: 'burns-i',
  title: 'Paediatric Burns — Initial Assessment & Resuscitation',
  description: 'Evidence-based initial management of paediatric burns: TBSA estimation, fluid resuscitation using Parkland formula, airway burns recognition, and wound care.',
  duration: 90,
  modules: [
    {
      id: 'burns-i-m1',
      courseId: 'burns-i',
      moduleNumber: 1,
      title: 'Burns Assessment: TBSA and Depth',
      content: `
## Burns Assessment in Children

### Why Children Are Different
Children have proportionally larger head and smaller lower limbs than adults. Adult rule-of-nines is inaccurate. Use the **Lund-Browder chart** for accurate TBSA estimation in children.

### Lund-Browder Estimates (Age-Adjusted)
| Body Region | Infant | 5y | 10y | Adult |
|-------------|--------|-----|-----|-------|
| Head | 19% | 13% | 11% | 9% |
| Each thigh | 3% | 4% | 4% | 4.75% |
| Each lower leg | 2.5% | 3% | 3% | 3.5% |

**Quick rule:** Palm + fingers of the child = ~1% TBSA. Use for scattered burns.

### Burn Depth Classification
| Depth | Appearance | Sensation | Healing |
|-------|-----------|-----------|---------|
| Superficial (1st degree) | Red, dry | Painful | 3–5 days |
| Superficial partial (2nd) | Blistered, moist, pink | Very painful | 7–14 days |
| Deep partial (2nd) | Pale/mottled, less moist | Reduced | 14–21 days, may scar |
| Full thickness (3rd) | White/brown/black, leathery | Painless | Requires grafting |

### Critical Assessment Points
1. **Airway burns** — Facial burns, singed nasal hair, hoarse voice, stridor, carbonaceous sputum → **immediate intubation**
2. **Circumferential burns** — Risk of compartment syndrome (limbs) or respiratory compromise (chest)
3. **Mechanism** — Flame, scald, chemical, electrical (each has different depth pattern)
4. **Safeguarding** — Pattern inconsistent with history? Non-accidental injury must be considered.

### Immediate Priorities (First 30 Minutes)
- Stop the burning process, remove clothing
- 100% O₂ via non-rebreather mask
- Two large-bore IV access (or IO if needed)
- Analgesia: IV morphine 0.1 mg/kg titrated
- Warm environment (children lose heat rapidly)
- Tetanus prophylaxis
      `,
      learningObjectives: [
        'Accurately estimate TBSA using Lund-Browder chart in children of different ages',
        'Classify burn depth and predict healing trajectory',
        'Identify signs of airway burns requiring immediate intubation',
        'Recognise circumferential burns and their complications',
      ],
      keyPoints: [
        'Use Lund-Browder chart, not adult rule-of-nines, for TBSA in children',
        'Airway burns: facial burns + singed hair + hoarse voice = immediate intubation',
        'Palm + fingers = ~1% TBSA for scattered burn estimation',
        'Always consider non-accidental injury with unusual burn patterns',
      ],
      references: [
        'ISBI Practice Guidelines for Burn Care (2016)',
        'ABA Advanced Burn Life Support (ABLS) Course Manual',
        'WHO Burns Fact Sheet',
      ],
    },
    {
      id: 'burns-i-m2',
      courseId: 'burns-i',
      moduleNumber: 2,
      title: 'Fluid Resuscitation in Paediatric Burns',
      content: `
## Fluid Resuscitation in Paediatric Burns

### When to Resuscitate
Burns ≥15% TBSA in children require formal IV fluid resuscitation (lower threshold than adults due to smaller reserves).

### Parkland Formula (Modified for Children)
**Total 24-hour volume = 3–4 mL × weight (kg) × %TBSA burned**

- Use Hartmann's (Ringer's Lactate) — NOT normal saline (risk of hyperchloraemic acidosis)
- **First 8 hours:** Give 50% of total volume (from time of burn, not arrival)
- **Next 16 hours:** Give remaining 50%

**Plus maintenance fluids** (children need this, unlike adults):
- 4 mL/kg/hr for first 10 kg
- 2 mL/kg/hr for next 10 kg
- 1 mL/kg/hr for each kg above 20 kg
- Use glucose-containing solution (D5 Hartmann's) for maintenance

### Monitoring Resuscitation Adequacy
| Parameter | Target |
|-----------|--------|
| Urine output | 1 mL/kg/hr (children <30 kg) |
| Urine output | 0.5 mL/kg/hr (children >30 kg) |
| Heart rate | Age-appropriate, trending down |
| Capillary refill | <2 seconds |
| Mental status | Alert, appropriate |

### Colloid Timing
- Avoid albumin in first 8 hours (capillary leak phase)
- After 8–12 hours: consider 5% albumin if crystalloid requirements are excessive
- FFP only for documented coagulopathy

### Pitfalls to Avoid
- **Over-resuscitation** → pulmonary oedema, abdominal compartment syndrome
- **Under-resuscitation** → renal failure, wound conversion
- **Forgetting maintenance** → hypoglycaemia in infants
- **Calculating from arrival, not time of burn** → delayed resuscitation
      `,
      learningObjectives: [
        'Calculate Parkland formula fluid requirements for paediatric burns',
        'Add appropriate maintenance fluids to resuscitation volumes',
        'Monitor resuscitation adequacy using urine output and clinical parameters',
        'Avoid common pitfalls of over- and under-resuscitation',
      ],
      keyPoints: [
        'Parkland: 3–4 mL × kg × %TBSA using Hartmann\'s solution',
        'Calculate from time of burn, not hospital arrival',
        'Add maintenance fluids with glucose for children',
        'Target urine output 1 mL/kg/hr in children <30 kg',
      ],
      references: [
        'Parkland Formula — Baxter CR, 1974',
        'ABA Advanced Burn Life Support (ABLS) Course Manual',
        'Sheridan RL. Burns. Crit Care Med. 2002',
      ],
    },
    {
      id: 'burns-i-m3',
      courseId: 'burns-i',
      moduleNumber: 3,
      title: 'Wound Care, Analgesia, and Transfer',
      content: `
## Burns Wound Care, Analgesia, and Transfer

### Wound Care Principles
**Do NOT:**
- Apply ice (causes vasoconstriction and deepens burn)
- Use butter, toothpaste, or traditional remedies
- Burst blisters (protective barrier)
- Apply tight dressings to circumferential burns

**Do:**
- Cool with cool (not cold) running water for 20 minutes (within 3 hours of burn)
- Cover with cling film (non-adherent, transparent for assessment)
- Keep patient warm (hypothermia worsens outcomes)
- Elevate burned limbs

### Analgesia Protocol
| Severity | First-line | Second-line |
|----------|-----------|-------------|
| Mild | Paracetamol 15 mg/kg PO/IV | Ibuprofen 10 mg/kg |
| Moderate | IV morphine 0.1 mg/kg | Ketamine 0.5 mg/kg IV |
| Severe/procedural | Ketamine 1–2 mg/kg IV | Midazolam 0.05 mg/kg |

**Ketamine** is ideal for burns dressing changes: dissociative analgesia, maintains airway reflexes, bronchodilator.

### Burns Transfer Criteria (to Burns Unit)
- >10% TBSA partial thickness
- Any full thickness burn
- Burns to face, hands, feet, genitalia, perineum, major joints
- Circumferential burns
- Inhalation injury
- Electrical/chemical burns
- Suspected non-accidental injury
- Burns with significant co-morbidities

### Pre-Transfer Checklist
- [ ] Airway secured (if inhalation injury)
- [ ] IV access × 2, fluids running
- [ ] Urine catheter in situ
- [ ] Analgesia adequate
- [ ] Wounds covered with cling film
- [ ] Referral documentation complete
- [ ] Family briefed
      `,
      learningObjectives: [
        'Apply correct first aid for paediatric burns (cool water, cling film)',
        'Prescribe appropriate analgesia including ketamine for procedural pain',
        'Identify burns requiring transfer to a specialist burns unit',
        'Complete pre-transfer checklist for safe patient transfer',
      ],
      keyPoints: [
        'Cool with cool running water for 20 minutes — NOT ice',
        'Cover with cling film — transparent, non-adherent, preserves assessment',
        'Ketamine is ideal for burns dressing changes',
        'Transfer criteria: >10% TBSA, face/hands/feet/genitalia, inhalation injury',
      ],
      references: [
        'ISBI Practice Guidelines for Burn Care (2016)',
        'NICE Guideline NG7: Burns and scalds in children (2014)',
        'WHO Burns First Aid Guidelines',
      ],
    },
  ],
  quiz: {
    id: 'burns-i-quiz',
    courseId: 'burns-i',
    questions: [
      {
        id: 'burns-i-q1',
        question: 'A 3-year-old child (15 kg) sustains burns to the entire head and both arms. Using the Lund-Browder chart, the estimated TBSA is 30%. What is the Parkland formula fluid volume for the first 8 hours?',
        options: [
          'A. 675 mL Hartmann\'s',
          'B. 1350 mL Hartmann\'s',
          'C. 2700 mL Hartmann\'s',
          'D. 540 mL Hartmann\'s',
        ],
        correctAnswer: 'A',
        explanation: 'Parkland: 4 mL × 15 kg × 30% = 1800 mL total. First 8 hours = 50% = 900 mL. However, using 3 mL/kg/%TBSA: 3 × 15 × 30 = 1350 mL total, first 8 hours = 675 mL. Note: Also add maintenance fluids separately. Answer A (675 mL) uses 3 mL/kg/%TBSA which is appropriate for children.',
      },
      {
        id: 'burns-i-q2',
        question: 'A 7-year-old with flame burns presents with facial burns, singed eyebrows, hoarse voice, and stridor. What is the MOST URGENT intervention?',
        options: [
          'A. High-flow oxygen via non-rebreather mask',
          'B. Immediate endotracheal intubation',
          'C. Nebulised adrenaline',
          'D. IV dexamethasone',
        ],
        correctAnswer: 'B',
        explanation: 'Hoarse voice + stridor = impending airway obstruction from supraglottic oedema. This is a TIME-CRITICAL emergency. Intubate immediately before oedema progresses and makes intubation impossible. Oxygen is important but does not secure the airway. Nebulised adrenaline and steroids are temporising measures only.',
      },
      {
        id: 'burns-i-q3',
        question: 'Which of the following first aid measures is CONTRAINDICATED for paediatric burns?',
        options: [
          'A. Cool running water for 20 minutes',
          'B. Covering with cling film',
          'C. Application of ice packs',
          'D. Elevating the burned limb',
        ],
        correctAnswer: 'C',
        explanation: 'Ice causes vasoconstriction, deepens the burn injury, and can cause hypothermia (especially dangerous in children). Cool running water (15–25°C) for 20 minutes is the correct first aid. Cling film is ideal cover — transparent, non-adherent, and preserves assessment. Elevation reduces oedema.',
      },
    ],
    passingScore: 80,
  },
  capstone: {
    id: 'burns-i-capstone',
    courseId: 'burns-i',
    title: 'Burns Resuscitation Capstone',
    description: 'Manage a child with major burns requiring immediate resuscitation and transfer',
    caseScenario: `
A 4-year-old boy (16 kg) is brought to your emergency department after a house fire. He has burns to his face, neck, anterior chest, and both arms. His clothes have been removed. On arrival: HR 165, BP 85/55, RR 40, SpO2 92% on room air, GCS 13. He is crying but his voice is hoarse. There are singed nasal hairs and carbonaceous sputum. His burns appear blistered and moist on the arms, but the chest burns are pale and leathery. The estimated TBSA is 35%.

Your management plan should include:
1. Immediate airway management decision
2. Fluid resuscitation calculation (Parkland + maintenance)
3. Monitoring targets
4. Wound care plan
5. Transfer decision and pre-transfer checklist
    `,
    scoringRubric: [
      { criterion: 'Immediate intubation decision (hoarse voice + stridor = airway burns)', points: 30 },
      { criterion: 'Correct Parkland calculation + maintenance fluids', points: 25 },
      { criterion: 'Appropriate monitoring targets (UO 1 mL/kg/hr)', points: 20 },
      { criterion: 'Correct wound care (cool water, cling film, no ice)', points: 15 },
      { criterion: 'Transfer to burns unit with complete pre-transfer checklist', points: 10 },
    ],
  },
};

// ─── Burns II ─────────────────────────────────────────────────

export const burnsIICourse: Course = {
  id: 'burns-ii',
  courseId: 'burns-ii',
  title: 'Paediatric Burns — Advanced Management & Complications',
  description: 'Advanced burns management: inhalation injury, circumferential burns, electrical burns, chemical burns, and burn wound infection. ICU-level care.',
  duration: 90,
  modules: [
    {
      id: 'burns-ii-m1',
      courseId: 'burns-ii',
      moduleNumber: 1,
      title: 'Inhalation Injury and Airway Burns',
      content: `
## Inhalation Injury in Paediatric Burns

### Three Components of Inhalation Injury
1. **Supraglottic injury** — Heat-induced oedema of upper airway (most common, most immediately dangerous)
2. **Subglottic injury** — Chemical injury from combustion products (develops over hours)
3. **Systemic toxicity** — Carbon monoxide (CO) and cyanide poisoning

### Carbon Monoxide Poisoning
CO binds haemoglobin with 250× affinity of O₂. SpO₂ pulse oximetry is UNRELIABLE (reads COHb as OxyHb).

| COHb Level | Symptoms |
|-----------|---------|
| <10% | Headache, nausea |
| 10–20% | Confusion, visual disturbance |
| 20–40% | Syncope, seizures |
| >40% | Coma, cardiovascular collapse |

**Treatment:** 100% O₂ via tight-fitting non-rebreather mask. Half-life of COHb:
- Room air: 5–6 hours
- 100% O₂: 60–90 minutes
- Hyperbaric O₂: 20–30 minutes

### Cyanide Poisoning
From burning plastics/synthetics. Causes histotoxic hypoxia (cells cannot use O₂).
- Suspect: persistent metabolic acidosis despite adequate resuscitation
- Treatment: Hydroxocobalamin 70 mg/kg IV (binds cyanide → cyanocobalamin, renally excreted)

### Ventilation Strategy for Inhalation Injury
- Low tidal volume ventilation (6 mL/kg IBW)
- PEEP 5–8 cmH₂O
- Permissive hypercapnia (PaCO₂ 45–60 mmHg)
- Nebulised N-acetylcysteine + heparin (mucolytic + anticoagulant for cast formation)
- Prone positioning if severe ARDS
      `,
      learningObjectives: [
        'Recognise the three components of inhalation injury',
        'Interpret CO poisoning severity and initiate appropriate oxygen therapy',
        'Identify cyanide poisoning and administer hydroxocobalamin',
        'Apply lung-protective ventilation strategy for inhalation injury',
      ],
      keyPoints: [
        'SpO₂ is unreliable in CO poisoning — use co-oximetry for COHb',
        '100% O₂ reduces COHb half-life from 5 hours to 60–90 minutes',
        'Persistent metabolic acidosis despite resuscitation = consider cyanide',
        'Hydroxocobalamin 70 mg/kg IV for cyanide poisoning',
      ],
      references: [
        'Sheridan RL. Inhalation injury. N Engl J Med. 2016',
        'Weaver LK. Carbon monoxide poisoning. N Engl J Med. 2009',
        'ISBI Practice Guidelines for Burn Care (2016)',
      ],
    },
    {
      id: 'burns-ii-m2',
      courseId: 'burns-ii',
      moduleNumber: 2,
      title: 'Circumferential Burns and Escharotomy',
      content: `
## Circumferential Burns and Escharotomy

### Compartment Syndrome in Burns
Full-thickness circumferential burns create a rigid eschar that does not expand. As oedema develops during resuscitation, compartment pressure rises → ischaemia.

### Limb Compartment Syndrome
**Signs:**
- Pain on passive stretch (unreliable in sedated patients)
- Paraesthesia → anaesthesia
- Pallor, pulselessness (late signs)
- Compartment pressure >30 mmHg (or within 30 mmHg of diastolic)

**Escharotomy technique (limbs):**
- Medial and lateral longitudinal incisions through eschar (not fascia)
- Extend from proximal to distal, crossing joints
- Hand: additional dorsal incisions over metacarpals
- Bleeding indicates viable tissue

### Chest Compartment Syndrome
Circumferential chest burns → restricted chest wall movement → respiratory failure.

**Signs:**
- Rising peak airway pressures
- Decreasing tidal volumes
- Worsening hypoxia despite adequate ventilation

**Chest escharotomy:**
- Bilateral anterior axillary line incisions
- Connect with subcostal transverse incision (creates H or grid pattern)
- Immediate improvement in compliance

### Abdominal Compartment Syndrome
From massive resuscitation + abdominal burns.
- Bladder pressure >20 mmHg with organ dysfunction = ACS
- Management: decompressive laparotomy

### Post-Escharotomy Care
- Haemostasis with electrocautery
- Dress with antimicrobial dressings
- Reassess hourly for 4 hours
      `,
      learningObjectives: [
        'Identify signs of compartment syndrome in circumferential burns',
        'Describe the technique for limb and chest escharotomy',
        'Recognise abdominal compartment syndrome in massive burns',
        'Provide appropriate post-escharotomy care',
      ],
      keyPoints: [
        'Circumferential full-thickness burns → escharotomy before compartment syndrome develops',
        'Chest escharotomy: bilateral anterior axillary lines + subcostal transverse',
        'Limb escharotomy: medial and lateral longitudinal incisions through eschar only',
        'Bladder pressure >20 mmHg + organ dysfunction = abdominal compartment syndrome',
      ],
      references: [
        'ABA Advanced Burn Life Support (ABLS) Course Manual',
        'Orgill DP, Piccolo N. Escharotomy and decompressive therapies in burns. J Burn Care Res. 2009',
      ],
    },
    {
      id: 'burns-ii-m3',
      courseId: 'burns-ii',
      moduleNumber: 3,
      title: 'Electrical Burns and Chemical Burns',
      content: `
## Electrical and Chemical Burns in Children

### Electrical Burns
Electricity causes injury through:
1. **Direct thermal injury** at entry/exit points
2. **Electrical current** through tissues (muscle, nerve, heart)
3. **Arc flash** (external flash burns)
4. **Mechanical trauma** (fall, tetanic contraction)

**High-voltage (>1000V) vs Low-voltage (<1000V):**
- High-voltage: extensive internal injury, rhabdomyolysis, cardiac arrhythmias
- Low-voltage: common in children (household outlets), can cause cardiac arrest

**Key Investigations:**
- 12-lead ECG (arrhythmias, ST changes)
- Troponin, CK (myocardial and muscle injury)
- Urine myoglobin (rhabdomyolysis → renal failure)
- Renal function

**Management:**
- Aggressive IV fluids (target UO 1–2 mL/kg/hr to flush myoglobin)
- Urine alkalinisation if myoglobinuria (sodium bicarbonate)
- Cardiac monitoring ≥24 hours if high-voltage
- Fasciotomy (not escharotomy) for electrical compartment syndrome

### Chemical Burns
**Acid burns:** Coagulative necrosis — self-limiting depth
**Alkali burns:** Liquefactive necrosis — progressive, deeper injury

**First Aid:**
- Brush off dry chemical before irrigation
- Copious water irrigation ≥30 minutes (≥60 minutes for alkali)
- Do NOT neutralise (exothermic reaction worsens injury)
- Hydrofluoric acid: calcium gluconate gel topically + systemic calcium

**Eye chemical burns:**
- Immediate irrigation with water or saline ≥30 minutes
- pH testing — continue until pH 7.0–7.4
- Urgent ophthalmology referral
      `,
      learningObjectives: [
        'Describe the mechanisms of electrical injury and their clinical consequences',
        'Order appropriate investigations for electrical burns',
        'Apply correct first aid for chemical burns including acid and alkali',
        'Manage hydrofluoric acid burns with calcium gluconate',
      ],
      keyPoints: [
        'Electrical burns: visible injury underestimates internal damage',
        'Rhabdomyolysis: target UO 1–2 mL/kg/hr to prevent renal failure',
        'Chemical burns: copious water irrigation — do NOT neutralise',
        'Alkali burns are more dangerous than acid burns (progressive liquefactive necrosis)',
      ],
      references: [
        'ISBI Practice Guidelines for Burn Care (2016)',
        'Arnoldo BD et al. Practice guidelines for the management of electrical injuries. J Burn Care Res. 2006',
      ],
    },
  ],
  quiz: {
    id: 'burns-ii-quiz',
    courseId: 'burns-ii',
    questions: [
      {
        id: 'burns-ii-q1',
        question: 'A 6-year-old with flame burns has SpO₂ 98% on room air but is confused and has a cherry-red appearance. COHb is 35%. What is the MOST appropriate immediate treatment?',
        options: [
          'A. Observe and recheck in 1 hour',
          'B. 100% O₂ via tight-fitting non-rebreather mask',
          'C. Intubation and ventilation with FiO₂ 1.0',
          'D. Hyperbaric oxygen therapy',
        ],
        correctAnswer: 'C',
        explanation: 'COHb 35% with confusion indicates significant CO poisoning. SpO₂ is unreliable (reads COHb as OxyHb). Given altered consciousness, intubation with 100% O₂ is appropriate to ensure maximum O₂ delivery and protect the airway. Hyperbaric O₂ is ideal but rarely immediately available. Non-rebreather mask is appropriate for mild-moderate CO poisoning without altered consciousness.',
      },
      {
        id: 'burns-ii-q2',
        question: 'A child with circumferential full-thickness burns to the chest is intubated and ventilated. Peak airway pressures are rising and tidal volumes are decreasing. What is the MOST appropriate intervention?',
        options: [
          'A. Increase PEEP',
          'B. Increase respiratory rate',
          'C. Bilateral chest escharotomy',
          'D. Needle decompression',
        ],
        correctAnswer: 'C',
        explanation: 'Rising peak pressures + decreasing tidal volumes in a ventilated patient with circumferential chest burns = chest wall compartment syndrome from eschar constriction. Bilateral anterior axillary line escharotomies connected by a subcostal transverse incision will immediately improve chest wall compliance. This is not pneumothorax (needle decompression would be wrong).',
      },
      {
        id: 'burns-ii-q3',
        question: 'A child sustains alkali burns to both eyes from a cleaning product. What is the MOST important immediate management?',
        options: [
          'A. Apply sodium bicarbonate to neutralise the alkali',
          'B. Immediate copious water irrigation for ≥30 minutes',
          'C. Apply antibiotic eye drops',
          'D. Patch both eyes and refer to ophthalmology',
        ],
        correctAnswer: 'B',
        explanation: 'Alkali causes liquefactive necrosis that continues to progress. Immediate copious irrigation is the most important intervention — every minute of delay worsens the injury. Do NOT neutralise (exothermic reaction worsens injury). Continue irrigation until pH 7.0–7.4. Urgent ophthalmology referral after irrigation.',
      },
    ],
    passingScore: 80,
  },
  capstone: {
    id: 'burns-ii-capstone',
    courseId: 'burns-ii',
    title: 'Advanced Burns Management Capstone',
    description: 'Manage a child with complex burns including inhalation injury and circumferential burns',
    caseScenario: `
An 8-year-old girl (25 kg) is brought from a house fire. She has full-thickness circumferential burns to both arms and partial-thickness burns to the face and anterior trunk (estimated TBSA 40%). She is intubated at scene. On arrival: HR 155, BP 80/50, SpO₂ 94% (FiO₂ 1.0), peak airway pressure 45 cmH₂O, tidal volume 180 mL (target 150 mL). COHb is 28%. Both arms are pale and pulseless distally.

Your management plan should include:
1. CO poisoning management
2. Fluid resuscitation plan
3. Immediate intervention for the arms
4. Ventilation strategy
5. ICU priorities for the next 24 hours
    `,
    scoringRubric: [
      { criterion: 'CO poisoning: 100% FiO₂ ventilation, target COHb <5%', points: 20 },
      { criterion: 'Correct Parkland calculation (3–4 mL × 25 × 40%) + maintenance', points: 25 },
      { criterion: 'Bilateral arm escharotomies for vascular compromise', points: 25 },
      { criterion: 'Lung-protective ventilation (6 mL/kg, low PEEP)', points: 15 },
      { criterion: 'ICU priorities: monitoring, nutrition, infection prevention', points: 15 },
    ],
  },
};

// ─── Cardiogenic Shock I ─────────────────────────────────────

export const cardiogenicShockICourse: Course = {
  id: 'cardiogenic-shock-i',
  courseId: 'cardiogenic-shock-i',
  title: 'Cardiogenic Shock — Recognition & Initial Management',
  description: 'Evidence-based recognition and initial management of paediatric cardiogenic shock: causes, haemodynamic assessment, inotrope selection, and stabilisation.',
  duration: 90,
  modules: [
    {
      id: 'cgs-i-m1',
      courseId: 'cardiogenic-shock-i',
      moduleNumber: 1,
      title: 'Recognising Cardiogenic Shock in Children',
      content: `
## Cardiogenic Shock in Children

### Definition
Cardiogenic shock is inadequate tissue perfusion due to **primary cardiac pump failure**, not volume depletion or vasodilation.

### Key Distinguishing Features from Other Shock Types
| Feature | Cardiogenic | Septic | Hypovolaemic |
|---------|------------|--------|-------------|
| Heart rate | Elevated | Elevated | Elevated |
| Blood pressure | Low/normal | Low | Low |
| Pulse volume | Weak, thready | Bounding (early) | Weak |
| Capillary refill | Prolonged | Variable | Prolonged |
| Skin | Cool, mottled, clammy | Warm/flushed (early) | Cool |
| JVP/CVP | Elevated | Low | Low |
| Hepatomegaly | Present | Absent | Absent |
| Lung sounds | Crackles, wheeze | Clear | Clear |
| Response to fluids | Worsens | Improves | Improves |

### Common Causes in Children
1. **Myocarditis** — Most common cause in previously healthy children
2. **Dilated cardiomyopathy** — Idiopathic or metabolic
3. **Congenital heart disease** — Undiagnosed duct-dependent lesions (neonates)
4. **Arrhythmias** — SVT, complete heart block, VT
5. **Post-cardiac surgery** — Low cardiac output syndrome
6. **Kawasaki disease** — Coronary artery involvement
7. **Sepsis-induced cardiomyopathy** — Overlap with septic shock

### Clinical Presentation
- Tachycardia disproportionate to fever/pain
- Weak, thready pulses
- Prolonged CRT (>3 seconds)
- Cool, mottled, clammy extremities
- Hepatomegaly (elevated venous pressure)
- Gallop rhythm (S3 or S4)
- Respiratory distress (pulmonary oedema)
- Feeding intolerance, poor weight gain (infants)
- Syncope or near-syncope (older children)

### Investigations
- **ECG** — Arrhythmia, ST changes, low voltage (myocarditis), LVH
- **CXR** — Cardiomegaly, pulmonary oedema
- **Echo** — Ejection fraction, wall motion, pericardial effusion (MOST IMPORTANT)
- **Troponin** — Myocardial injury
- **BNP/NT-proBNP** — Elevated in heart failure
- **Lactate** — Tissue hypoperfusion
- **Blood gas** — Metabolic acidosis, mixed venous O₂
      `,
      learningObjectives: [
        'Distinguish cardiogenic shock from other shock types using clinical features',
        'Identify common causes of cardiogenic shock in different paediatric age groups',
        'Order appropriate investigations including bedside echo',
        'Recognise signs of decompensated cardiogenic shock requiring urgent intervention',
      ],
      keyPoints: [
        'Hepatomegaly + gallop rhythm + pulmonary oedema = cardiogenic shock until proven otherwise',
        'Fluids WORSEN cardiogenic shock — distinguish from hypovolaemic shock',
        'Echo is the most important investigation — assess EF and wall motion',
        'BNP/NT-proBNP elevated in heart failure; troponin elevated in myocarditis',
      ],
      references: [
        'Brierley J et al. Clinical practice parameters for hemodynamic support of pediatric and neonatal septic shock. Crit Care Med. 2009',
        'Kantor PF et al. Presentation, diagnosis, and medical management of heart failure in children. Can J Cardiol. 2013',
        'AHA Scientific Statement: Management of Pediatric Acute Heart Failure. Circulation. 2023',
      ],
    },
    {
      id: 'cgs-i-m2',
      courseId: 'cardiogenic-shock-i',
      moduleNumber: 2,
      title: 'Inotropes and Vasoactive Drugs in Cardiogenic Shock',
      content: `
## Inotropes and Vasoactive Drugs in Paediatric Cardiogenic Shock

### Goals of Vasoactive Therapy
1. Improve cardiac output (increase contractility)
2. Reduce afterload (reduce SVR to decrease cardiac work)
3. Maintain coronary perfusion pressure
4. Avoid tachycardia (increases O₂ demand)

### First-Line Agents

**Dobutamine** (inotrope + mild vasodilator)
- Dose: 5–20 mcg/kg/min IV infusion
- Mechanism: β1 agonist (↑ contractility), mild β2 (↓ SVR)
- Ideal for: Cardiogenic shock with elevated SVR, preserved BP
- Caution: May cause tachycardia, hypotension

**Milrinone** (inodilator)
- Dose: 0.25–0.75 mcg/kg/min IV infusion (loading dose 50 mcg/kg over 30 min — use cautiously)
- Mechanism: PDE3 inhibitor → ↑ cAMP → ↑ contractility + vasodilation
- Ideal for: Post-cardiac surgery, high SVR states
- Caution: Hypotension (especially with loading dose), arrhythmias

### Second-Line Agents

**Adrenaline (Epinephrine)**
- Dose: 0.05–0.5 mcg/kg/min
- Low dose: β1 dominant (↑ CO)
- High dose: α dominant (↑ SVR — may worsen cardiogenic shock)
- Use when: Refractory shock, cardiac arrest, anaphylaxis-associated

**Noradrenaline (Norepinephrine)**
- Dose: 0.05–0.5 mcg/kg/min
- Predominantly α agonist (↑ SVR)
- Use when: Vasodilatory component (mixed cardiogenic + septic)

### Vasodilators (Afterload Reduction)
- **Sodium nitroprusside**: 0.5–8 mcg/kg/min — acute afterload reduction
- **Sildenafil**: Oral, for pulmonary hypertension component
- **ACE inhibitors**: Chronic afterload reduction (not acute)

### Fluid Management
- **Avoid aggressive fluid boluses** — worsen pulmonary oedema
- Small cautious boluses (5–10 mL/kg) only if clearly hypovolaemic
- Target: CVP 8–12 mmHg, PCWP 12–18 mmHg
- Diuretics (furosemide 1 mg/kg) for pulmonary oedema
      `,
      learningObjectives: [
        'Select appropriate inotropes based on haemodynamic profile',
        'Dose dobutamine and milrinone for paediatric cardiogenic shock',
        'Understand when to add vasopressors vs vasodilators',
        'Manage fluid balance in cardiogenic shock to avoid worsening pulmonary oedema',
      ],
      keyPoints: [
        'Dobutamine: first-line inotrope for cardiogenic shock with elevated SVR',
        'Milrinone: ideal post-cardiac surgery — inodilator reduces afterload',
        'Avoid large fluid boluses in cardiogenic shock — small 5–10 mL/kg only if hypovolaemic',
        'High-dose adrenaline increases SVR — may worsen cardiogenic shock',
      ],
      references: [
        'Brierley J et al. Clinical practice parameters. Crit Care Med. 2009',
        'Hoffman TM et al. Efficacy and safety of milrinone in preventing low cardiac output syndrome in infants and children. Circulation. 2003',
        'AHA Scientific Statement: Management of Pediatric Acute Heart Failure. Circulation. 2023',
      ],
    },
    {
      id: 'cgs-i-m3',
      courseId: 'cardiogenic-shock-i',
      moduleNumber: 3,
      title: 'Arrhythmia Management in Cardiogenic Shock',
      content: `
## Arrhythmia Management in Paediatric Cardiogenic Shock

### Arrhythmias Causing Cardiogenic Shock

**Supraventricular Tachycardia (SVT)**
- Most common tachyarrhythmia in children
- Rate: >220 bpm (infants), >180 bpm (children)
- Narrow complex, regular
- Management:
  1. Vagal manoeuvres (ice to face in infants, Valsalva in older children)
  2. Adenosine 0.1 mg/kg IV rapid push (max 6 mg first dose, 12 mg second dose)
  3. Synchronised DC cardioversion 0.5–1 J/kg if haemodynamically unstable

**Ventricular Tachycardia (VT)**
- Wide complex tachycardia
- Haemodynamically unstable: synchronised DC cardioversion 1–2 J/kg
- Haemodynamically stable: Amiodarone 5 mg/kg IV over 20–60 min

**Complete Heart Block**
- Bradycardia with AV dissociation
- Causes: Myocarditis, post-cardiac surgery, congenital
- Management: Atropine 0.02 mg/kg (min 0.1 mg), adrenaline if unresponsive, transcutaneous/transvenous pacing

**Junctional Ectopic Tachycardia (JET)**
- Post-cardiac surgery
- Narrow complex, AV dissociation
- Management: Cooling (36–37°C), amiodarone, reduce catecholamines

### DC Cardioversion Protocol
1. Sedate (ketamine 1–2 mg/kg + midazolam 0.05 mg/kg)
2. Synchronise to R wave
3. Energy: 0.5–1 J/kg (SVT), 1–2 J/kg (VT)
4. Escalate by 0.5–1 J/kg if unsuccessful
5. Maximum: 4 J/kg

### When to Call Cardiology
- All cases of cardiogenic shock
- New arrhythmia in previously healthy child
- Suspected structural heart disease
- Failure to respond to initial management
      `,
      learningObjectives: [
        'Identify arrhythmias causing cardiogenic shock in children',
        'Manage SVT with vagal manoeuvres, adenosine, and cardioversion',
        'Perform synchronised DC cardioversion safely in children',
        'Recognise complete heart block and initiate pacing',
      ],
      keyPoints: [
        'SVT: adenosine 0.1 mg/kg rapid IV push (max 6 mg first dose)',
        'Haemodynamically unstable arrhythmia: synchronised DC cardioversion 0.5–1 J/kg',
        'Complete heart block: atropine 0.02 mg/kg → adrenaline → pacing',
        'All cardiogenic shock requires urgent cardiology consultation',
      ],
      references: [
        'AHA PALS Provider Manual 2020',
        'Pediatric Advanced Life Support Guidelines 2020',
        'Brugada J et al. ESC Guidelines on SVT. Eur Heart J. 2019',
      ],
    },
  ],
  quiz: {
    id: 'cgs-i-quiz',
    courseId: 'cardiogenic-shock-i',
    questions: [
      {
        id: 'cgs-i-q1',
        question: 'A 6-month-old infant presents with poor feeding, tachycardia (HR 210), hepatomegaly, and bilateral lung crackles. Which finding MOST distinguishes cardiogenic from septic shock?',
        options: [
          'A. Tachycardia',
          'B. Hepatomegaly and lung crackles',
          'C. Poor feeding',
          'D. Low blood pressure',
        ],
        correctAnswer: 'B',
        explanation: 'Hepatomegaly (elevated venous pressure) and pulmonary oedema (lung crackles) are hallmarks of cardiogenic shock. They indicate elevated cardiac filling pressures from pump failure. Tachycardia, poor feeding, and hypotension occur in all shock types. In septic shock, lungs are typically clear and hepatomegaly is absent.',
      },
      {
        id: 'cgs-i-q2',
        question: 'A child with myocarditis and cardiogenic shock has BP 70/45, HR 155, cool extremities, and hepatomegaly. Echo shows EF 20%. Which initial vasoactive agent is MOST appropriate?',
        options: [
          'A. Noradrenaline 0.1 mcg/kg/min',
          'B. Dobutamine 10 mcg/kg/min',
          'C. Normal saline 20 mL/kg bolus',
          'D. High-dose adrenaline 1 mcg/kg/min',
        ],
        correctAnswer: 'B',
        explanation: 'Dobutamine is the first-line inotrope for cardiogenic shock. It increases contractility (β1) while mildly reducing SVR (β2), improving cardiac output without worsening afterload. Noradrenaline increases SVR (worsens cardiogenic shock). Large fluid boluses worsen pulmonary oedema. High-dose adrenaline increases SVR and myocardial O₂ demand.',
      },
      {
        id: 'cgs-i-q3',
        question: 'An infant with SVT (HR 240) is haemodynamically unstable with BP 55/30. Adenosine has failed twice. What is the NEXT step?',
        options: [
          'A. Amiodarone 5 mg/kg IV over 60 minutes',
          'B. Synchronised DC cardioversion 0.5 J/kg',
          'C. Verapamil 0.1 mg/kg IV',
          'D. Digoxin 10 mcg/kg IV',
        ],
        correctAnswer: 'B',
        explanation: 'Haemodynamically unstable SVT (hypotension, poor perfusion) after failed adenosine requires immediate synchronised DC cardioversion at 0.5–1 J/kg. Amiodarone takes 20–60 minutes to work — too slow for unstable patient. Verapamil is CONTRAINDICATED in infants (causes cardiovascular collapse). Digoxin is not appropriate for acute management.',
      },
    ],
    passingScore: 80,
  },
  capstone: {
    id: 'cgs-i-capstone',
    courseId: 'cardiogenic-shock-i',
    title: 'Cardiogenic Shock Management Capstone',
    description: 'Manage a child presenting with acute cardiogenic shock from myocarditis',
    caseScenario: `
A 4-year-old girl (16 kg) presents with 3 days of fever, poor feeding, and increasing respiratory distress. On examination: HR 185, BP 68/42, RR 52, SpO₂ 88% on room air, CRT 5 seconds. She has hepatomegaly (3 cm below costal margin), bilateral crackles, gallop rhythm, and cool mottled extremities. Troponin is elevated at 4.2 ng/mL. ECG shows low voltage with ST changes. Bedside echo shows EF 15% with global hypokinesia.

Your management plan should include:
1. Immediate stabilisation (airway, oxygen, monitoring)
2. Vasoactive drug selection and dosing
3. Fluid management strategy
4. Arrhythmia management plan
5. Escalation plan (PICU, cardiology, ECMO criteria)
    `,
    scoringRubric: [
      { criterion: 'Immediate stabilisation: O₂, IV access, continuous monitoring', points: 20 },
      { criterion: 'Correct inotrope selection (dobutamine) with appropriate dosing', points: 25 },
      { criterion: 'Fluid management: small boluses only, diuretics for pulmonary oedema', points: 20 },
      { criterion: 'Arrhythmia monitoring and management plan', points: 15 },
      { criterion: 'PICU escalation with ECMO criteria awareness', points: 20 },
    ],
  },
};

// ─── Cardiogenic Shock II ─────────────────────────────────────

export const cardiogenicShockIICourse: Course = {
  id: 'cardiogenic-shock-ii',
  courseId: 'cardiogenic-shock-ii',
  title: 'Cardiogenic Shock — Advanced Management & ECMO',
  description: 'Advanced management of refractory cardiogenic shock: mechanical circulatory support, ECMO indications, post-cardiac surgery care, and bridge to recovery or transplant.',
  duration: 90,
  modules: [
    {
      id: 'cgs-ii-m1',
      courseId: 'cardiogenic-shock-ii',
      moduleNumber: 1,
      title: 'Refractory Cardiogenic Shock and ECMO Indications',
      content: `
## Refractory Cardiogenic Shock and ECMO

### Definition of Refractory Cardiogenic Shock
Failure to achieve adequate perfusion despite:
- Two or more vasoactive agents at moderate-high doses
- Adequate preload optimisation
- Correction of reversible causes (arrhythmia, ischaemia)

### ECMO Indications in Paediatric Cardiogenic Shock
**Absolute indications:**
- Cardiac arrest refractory to CPR (ECPR — ECMO-CPR)
- Refractory cardiogenic shock despite maximal medical therapy
- Bridge to cardiac transplantation

**Relative indications:**
- Rapidly deteriorating haemodynamics
- Rising lactate despite escalating support
- Myocarditis with expected recovery

### ECMO Contraindications
- Irreversible brain injury
- Uncontrollable bleeding
- Severe aortic regurgitation (VA-ECMO)
- No realistic chance of recovery or transplant

### ECMO Modes
**VA-ECMO (Veno-Arterial):**
- Provides both cardiac and respiratory support
- Used for cardiogenic shock
- Cannulation: femoral or central (neck/chest)
- Provides 80–100% of cardiac output

**VV-ECMO (Veno-Venous):**
- Respiratory support only — no cardiac support
- Used for ARDS/respiratory failure

### Pre-ECMO Checklist
- [ ] Two senior physicians agree on indication
- [ ] Family counselled and consent obtained
- [ ] ECMO team activated
- [ ] Blood products available (4 units PRBC, FFP, platelets)
- [ ] Anticoagulation plan (heparin)
- [ ] ICU bed confirmed
      `,
      learningObjectives: [
        'Define refractory cardiogenic shock and ECMO indications',
        'Distinguish VA-ECMO from VV-ECMO and their indications',
        'Identify contraindications to ECMO',
        'Prepare for ECMO cannulation with appropriate checklist',
      ],
      keyPoints: [
        'ECMO indicated: refractory shock despite 2+ vasoactive agents at high doses',
        'VA-ECMO for cardiogenic shock; VV-ECMO for respiratory failure only',
        'ECPR (ECMO-CPR): ECMO during cardiac arrest — improves survival in selected cases',
        'Early ECMO consultation before irreversible organ damage',
      ],
      references: [
        'ELSO Guidelines for Cardiopulmonary Extracorporeal Life Support (2017)',
        'Thiagarajan RR et al. Extracorporeal membrane oxygenation to support CPR. Pediatr Crit Care Med. 2007',
        'AHA Scientific Statement: Management of Pediatric Acute Heart Failure. Circulation. 2023',
      ],
    },
    {
      id: 'cgs-ii-m2',
      courseId: 'cardiogenic-shock-ii',
      moduleNumber: 2,
      title: 'Post-Cardiac Surgery Low Cardiac Output Syndrome',
      content: `
## Post-Cardiac Surgery Low Cardiac Output Syndrome (LCOS)

### Definition
LCOS is a clinical syndrome of inadequate cardiac output in the first 6–18 hours after cardiac surgery, resulting from myocardial stunning, reperfusion injury, and systemic inflammatory response.

### Incidence and Timing
- Occurs in 25% of children after cardiac surgery
- Peak: 6–12 hours post-bypass
- Risk factors: Complex surgery, long bypass time, cyanotic disease, neonates

### Clinical Features
- Tachycardia, hypotension
- Elevated lactate
- Low mixed venous O₂ saturation (<50%)
- Oliguria
- Metabolic acidosis
- Cool extremities, prolonged CRT

### Prevention
- Milrinone prophylaxis (0.25–0.75 mcg/kg/min) started intraoperatively
- Delayed sternal closure for complex repairs
- Adequate volume loading
- Avoiding hypothermia

### Management
**Optimise preload:**
- Small fluid boluses (5–10 mL/kg) guided by CVP and echo
- Avoid over-filling (worsens RV function)

**Reduce afterload:**
- Milrinone (inodilator)
- Sodium nitroprusside if BP adequate

**Increase contractility:**
- Dobutamine 5–15 mcg/kg/min
- Adrenaline 0.05–0.3 mcg/kg/min for severe cases

**Specific considerations:**
- **Right heart failure:** Inhaled nitric oxide (iNO) 5–20 ppm
- **Junctional ectopic tachycardia (JET):** Cooling, amiodarone
- **Residual lesion:** Return to theatre

### Monitoring
- Continuous arterial line
- Central venous pressure
- Near-infrared spectroscopy (NIRS) for cerebral/somatic oxygenation
- Hourly urine output
- 4-hourly lactate
      `,
      learningObjectives: [
        'Define LCOS and identify its timing and risk factors after cardiac surgery',
        'Implement milrinone prophylaxis for high-risk cardiac surgery patients',
        'Manage LCOS with appropriate preload, afterload, and contractility optimisation',
        'Recognise specific post-surgical complications (JET, residual lesion, RV failure)',
      ],
      keyPoints: [
        'LCOS peaks 6–12 hours post-bypass — anticipate and monitor proactively',
        'Milrinone prophylaxis reduces LCOS incidence in high-risk patients',
        'Inhaled nitric oxide for right heart failure and pulmonary hypertension',
        'Persistent LCOS despite treatment: suspect residual lesion — return to theatre',
      ],
      references: [
        'Hoffman TM et al. Efficacy and safety of milrinone in preventing LCOS. Circulation. 2003',
        'Wernovsky G et al. Postoperative course and hemodynamic profile after the arterial switch operation. Circulation. 1995',
        'PICU management guidelines for post-cardiac surgery care',
      ],
    },
    {
      id: 'cgs-ii-m3',
      courseId: 'cardiogenic-shock-ii',
      moduleNumber: 3,
      title: 'Bridge to Recovery and Transplant',
      content: `
## Bridge to Recovery and Cardiac Transplant in Children

### Myocarditis — Potential for Recovery
Acute myocarditis has the best prognosis of all causes of cardiogenic shock:
- 50–70% recover normal cardiac function
- Recovery timeline: days to months
- Immunosuppression controversial (no strong evidence)
- IVIG 2 g/kg may be beneficial in early myocarditis

### Monitoring for Recovery on ECMO
- Daily echo assessment of LV function
- Lactate trending
- Mixed venous O₂ saturation
- ECMO flow requirements (decreasing = improving)
- Trial of reduced ECMO support ("weaning trial")

### ECMO Weaning Protocol
1. Reduce ECMO flow by 10–20% every 4–6 hours
2. Monitor haemodynamics, lactate, echo
3. If tolerated at 20–30% flow: proceed to decannulation
4. If deterioration: return to full flow

### Bridge to Transplant
When recovery is unlikely:
- Ventricular assist device (VAD) as bridge to transplant
- ECMO as bridge to VAD or transplant
- Listing criteria: UNOS status 1A (most urgent)
- Median wait time: 1–3 months in paediatrics

### End-of-Life Considerations
When recovery and transplant are not possible:
- Multidisciplinary team meeting (intensivist, cardiologist, palliative care, ethics)
- Family meeting with clear communication
- Comfort-focused care
- Withdrawal of ECMO support with appropriate symptom management
      `,
      learningObjectives: [
        'Identify patients with myocarditis who have potential for cardiac recovery',
        'Monitor ECMO patients for signs of cardiac recovery',
        'Implement ECMO weaning protocol safely',
        'Discuss bridge to transplant options and end-of-life considerations',
      ],
      keyPoints: [
        'Myocarditis: 50–70% recover normal function — maintain ECMO support during recovery',
        'ECMO weaning: reduce flow 10–20% every 4–6 hours, monitor haemodynamics',
        'Bridge to transplant: VAD preferred over prolonged ECMO (lower complication rate)',
        'End-of-life: multidisciplinary team + family meeting before ECMO withdrawal',
      ],
      references: [
        'ELSO Guidelines for Cardiopulmonary Extracorporeal Life Support (2017)',
        'Kirk R et al. ISHLT consensus statement on cardiac transplantation in children. J Heart Lung Transplant. 2013',
        'Dipchand AI et al. Pediatric heart transplantation. Curr Opin Cardiol. 2015',
      ],
    },
  ],
  quiz: {
    id: 'cgs-ii-quiz',
    courseId: 'cardiogenic-shock-ii',
    questions: [
      {
        id: 'cgs-ii-q1',
        question: 'A 3-year-old with myocarditis is on dobutamine 15 mcg/kg/min and milrinone 0.75 mcg/kg/min. Lactate is 8 mmol/L and rising. BP is 55/35. What is the MOST appropriate next step?',
        options: [
          'A. Add noradrenaline 0.5 mcg/kg/min',
          'B. Give 20 mL/kg normal saline bolus',
          'C. Activate ECMO team for VA-ECMO',
          'D. Start adrenaline 2 mcg/kg/min',
        ],
        correctAnswer: 'C',
        explanation: 'This patient has refractory cardiogenic shock — on two vasoactive agents at high doses with rising lactate and deteriorating haemodynamics. This is an ECMO indication. Delay worsens outcomes. Adding more vasoactive agents (noradrenaline, high-dose adrenaline) will further increase myocardial O₂ demand without improving output. Fluid bolus will worsen pulmonary oedema.',
      },
      {
        id: 'cgs-ii-q2',
        question: 'A neonate 8 hours after arterial switch operation has HR 185, BP 55/35, lactate 6 mmol/L, and mixed venous O₂ saturation 42%. Which diagnosis is MOST likely?',
        options: [
          'A. Pulmonary hypertensive crisis',
          'B. Low cardiac output syndrome (LCOS)',
          'C. Surgical site bleeding',
          'D. Sepsis',
        ],
        correctAnswer: 'B',
        explanation: 'LCOS peaks 6–12 hours post-bypass. This neonate is exactly in the peak window with classic features: tachycardia, hypotension, elevated lactate, and low mixed venous O₂ saturation (normal >65%). Management: milrinone, dobutamine, optimise preload. If not improving: echo to rule out residual lesion, consider ECMO.',
      },
      {
        id: 'cgs-ii-q3',
        question: 'A child with myocarditis on VA-ECMO shows improving echo (EF improving from 10% to 35%) after 5 days. What is the MOST appropriate next step?',
        options: [
          'A. Immediate ECMO decannulation',
          'B. Continue full ECMO support for 2 more weeks',
          'C. Begin ECMO weaning trial (reduce flow 10–20% every 4–6 hours)',
          'D. List for cardiac transplantation',
        ],
        correctAnswer: 'C',
        explanation: 'Improving EF from 10% to 35% suggests myocardial recovery. The next step is a structured weaning trial: reduce ECMO flow by 10–20% every 4–6 hours while monitoring haemodynamics, lactate, and echo. If tolerated at 20–30% flow, proceed to decannulation. Immediate decannulation without a weaning trial is unsafe. Transplant listing is premature given evidence of recovery.',
      },
    ],
    passingScore: 80,
  },
  capstone: {
    id: 'cgs-ii-capstone',
    courseId: 'cardiogenic-shock-ii',
    title: 'Advanced Cardiogenic Shock Capstone',
    description: 'Manage a child with refractory cardiogenic shock requiring ECMO decision-making',
    caseScenario: `
A 2-year-old boy (12 kg) with known dilated cardiomyopathy presents in acute decompensation. He is on dobutamine 20 mcg/kg/min and milrinone 0.75 mcg/kg/min. Despite 6 hours of treatment, his lactate is 9 mmol/L (rising), BP 52/30, HR 195, SpO₂ 85% on HFNC, and urine output is 0.2 mL/kg/hr. Echo shows EF 8% with severe mitral regurgitation.

Your management plan should include:
1. Assessment of ECMO indication
2. ECMO type selection and rationale
3. Pre-ECMO preparation checklist
4. Goals of ECMO therapy (bridge to recovery vs transplant)
5. Family communication strategy
    `,
    scoringRubric: [
      { criterion: 'Correct ECMO indication assessment (refractory shock on 2+ agents)', points: 25 },
      { criterion: 'VA-ECMO selection with rationale (cardiac + respiratory support)', points: 20 },
      { criterion: 'Complete pre-ECMO checklist (blood products, consent, team)', points: 20 },
      { criterion: 'Goals: bridge to transplant given dilated cardiomyopathy', points: 20 },
      { criterion: 'Family communication: honest, compassionate, clear on prognosis', points: 15 },
    ],
  },
};

// ─── Hypovolaemic Shock I ─────────────────────────────────────

export const hypovolaemicShockICourse: Course = {
  id: 'hypovolemic-shock-i',
  courseId: 'hypovolemic-shock-i',
  title: 'Hypovolaemic Shock — Recognition & Fluid Resuscitation',
  description: 'Evidence-based recognition and fluid resuscitation of paediatric hypovolaemic shock: causes, severity classification, fluid selection, and monitoring.',
  duration: 75,
  modules: [
    {
      id: 'hvs-i-m1',
      courseId: 'hypovolemic-shock-i',
      moduleNumber: 1,
      title: 'Recognising and Classifying Hypovolaemic Shock',
      content: `
## Hypovolaemic Shock in Children

### Definition
Hypovolaemic shock is inadequate tissue perfusion due to **reduced circulating blood volume** — the most common cause of shock in children worldwide.

### Causes
- **Diarrhoea and vomiting** (most common globally)
- **Haemorrhage** — trauma, GI bleeding, surgical
- **Burns** — fluid shifts
- **Diabetic ketoacidosis** — osmotic diuresis
- **Nephrotic syndrome** — protein loss
- **Peritonitis** — third-space losses

### Severity Classification
| Severity | Volume Loss | Clinical Features |
|----------|------------|------------------|
| Mild | <10% | Tachycardia, normal BP, slightly prolonged CRT |
| Moderate | 10–20% | Tachycardia, borderline BP, CRT 3–4s, reduced UO |
| Severe | >20% | Tachycardia, hypotension, CRT >4s, altered consciousness |

### Key Clinical Signs
- **Tachycardia** — earliest sign (compensated)
- **Prolonged CRT** (>2 seconds) — reliable in children
- **Reduced pulse volume** — thready pulses
- **Hypotension** — late sign (decompensated)
- **Reduced urine output** (<1 mL/kg/hr)
- **Altered consciousness** — late, severe

### Shock Index (HR/SBP)
- Normal: <1.0
- Mild shock: 1.0–1.2
- Moderate shock: 1.2–1.5
- Severe shock: >1.5

### Distinguishing from Other Shock Types
- No hepatomegaly (unlike cardiogenic)
- Warm extremities early (unlike cardiogenic)
- Responds to fluids (unlike cardiogenic)
- No fever/source (unlike septic)
      `,
      learningObjectives: [
        'Identify common causes of hypovolaemic shock in children',
        'Classify shock severity using clinical parameters',
        'Distinguish hypovolaemic from cardiogenic and septic shock',
        'Calculate shock index as a rapid bedside assessment tool',
      ],
      keyPoints: [
        'Tachycardia is the earliest sign — hypotension is LATE and decompensated',
        'CRT >2 seconds is a reliable early indicator of poor perfusion',
        'Hypovolaemic shock responds to fluids — cardiogenic worsens',
        'Shock index >1.5 = severe shock requiring immediate intervention',
      ],
      references: [
        'WHO Pocket Book of Hospital Care for Children (2013)',
        'FEAST Trial — Maitland K et al. N Engl J Med. 2011',
        'AHA PALS Provider Manual 2020',
      ],
    },
    {
      id: 'hvs-i-m2',
      courseId: 'hypovolemic-shock-i',
      moduleNumber: 2,
      title: 'Fluid Resuscitation: Selection and Administration',
      content: `
## Fluid Resuscitation in Paediatric Hypovolaemic Shock

### Fluid Selection
**Isotonic crystalloids are first-line:**
- **Normal saline (0.9% NaCl)** — widely available, risk of hyperchloraemic acidosis with large volumes
- **Hartmann's/Ringer's Lactate** — more physiological, preferred for large volumes
- **Plasmalyte** — balanced crystalloid, ideal for large resuscitation

**Colloids (albumin 4.5%):**
- Consider after 40–60 mL/kg crystalloid without response
- No survival benefit over crystalloids in most studies
- More expensive, limited availability in low-resource settings

**Blood products:**
- For haemorrhagic shock: PRBC 10–20 mL/kg
- Massive haemorrhage: 1:1:1 ratio (PRBC:FFP:Platelets)

### Fluid Bolus Protocol
**Standard approach:**
- 10–20 mL/kg isotonic crystalloid over 5–15 minutes
- Reassess after each bolus
- Repeat up to 40–60 mL/kg total in first hour

**FEAST Trial Caveat (Sub-Saharan Africa):**
- In African children with severe febrile illness, 20–40 mL/kg boluses INCREASED mortality
- Mechanism: likely myocardial dysfunction + anaemia
- Current WHO guidance: 10 mL/kg boluses with careful reassessment in resource-limited settings with high malaria/anaemia prevalence

### Reassessment After Each Bolus
- Heart rate (should decrease)
- Blood pressure (should increase)
- CRT (should improve)
- Urine output (should increase)
- Mental status (should improve)
- Lung sounds (new crackles = fluid overload)

### When to Stop Fluids
- Signs of fluid overload: crackles, hepatomegaly, worsening SpO₂
- No response after 60 mL/kg: consider septic or cardiogenic shock
- Haemorrhagic shock: surgical control before more fluids
      `,
      learningObjectives: [
        'Select appropriate fluid type for different causes of hypovolaemic shock',
        'Administer fluid boluses with appropriate volume and rate',
        'Apply FEAST trial findings to fluid management in resource-limited settings',
        'Reassess after each fluid bolus and recognise fluid overload',
      ],
      keyPoints: [
        'Hartmann\'s/Ringer\'s Lactate preferred over normal saline for large volumes',
        'FEAST trial: 10 mL/kg boluses in African children with febrile illness (not 20 mL/kg)',
        'Reassess after every bolus — stop if crackles/hepatomegaly develop',
        'No response after 60 mL/kg: reconsider diagnosis (cardiogenic? septic?)',
      ],
      references: [
        'FEAST Trial — Maitland K et al. N Engl J Med. 2011',
        'WHO Pocket Book of Hospital Care for Children (2013)',
        'Myburgh JA, Mythen MG. Resuscitation fluids. N Engl J Med. 2013',
      ],
    },
    {
      id: 'hvs-i-m3',
      courseId: 'hypovolemic-shock-i',
      moduleNumber: 3,
      title: 'Haemorrhagic Shock and Damage Control Resuscitation',
      content: `
## Haemorrhagic Shock and Damage Control Resuscitation

### Haemorrhagic Shock Classification
| Class | Blood Loss | HR | BP | CRT | GCS |
|-------|-----------|----|----|-----|-----|
| I | <15% | Normal | Normal | Normal | Normal |
| II | 15–30% | ↑ | Normal | ↑ | Anxious |
| III | 30–40% | ↑↑ | ↓ | ↑↑ | Confused |
| IV | >40% | ↑↑↑ | ↓↓ | ↑↑↑ | Unconscious |

### Damage Control Resuscitation (DCR)
**Principles:**
1. **Permissive hypotension** — target SBP 80–90 mmHg until surgical control (reduces ongoing haemorrhage)
2. **Haemostatic resuscitation** — 1:1:1 ratio (PRBC:FFP:Platelets)
3. **Avoid hypothermia, acidosis, coagulopathy** (lethal triad)
4. **Surgical haemostasis** — definitive control as soon as possible

**Tranexamic Acid (TXA):**
- Antifibrinolytic — reduces mortality in haemorrhagic shock
- Dose: 15–30 mg/kg IV (max 1 g) over 10 minutes, then 15 mg/kg over 8 hours
- Give within 3 hours of injury (no benefit after 3 hours)
- CRASH-2 and MATTERs trials evidence

### Massive Transfusion Protocol (MTP)
Activate when:
- >40 mL/kg blood products in 24 hours
- Ongoing haemorrhage requiring >1 blood volume replacement

MTP ratio: PRBC:FFP:Platelets = 1:1:1

### Monitoring Haemorrhagic Shock
- Serial haemoglobin/haematocrit
- Coagulation studies (PT, APTT, fibrinogen)
- Thromboelastography (TEG/ROTEM) if available
- Lactate clearance
- Base deficit
      `,
      learningObjectives: [
        'Classify haemorrhagic shock severity and predict blood loss',
        'Apply damage control resuscitation principles',
        'Administer tranexamic acid within the correct time window',
        'Activate massive transfusion protocol for major haemorrhage',
      ],
      keyPoints: [
        'Permissive hypotension (SBP 80–90) until surgical control reduces ongoing haemorrhage',
        'TXA 15–30 mg/kg within 3 hours of injury — no benefit after 3 hours',
        'Haemostatic resuscitation: 1:1:1 ratio (PRBC:FFP:Platelets)',
        'Lethal triad: hypothermia + acidosis + coagulopathy — prevent all three',
      ],
      references: [
        'CRASH-2 Trial — Lancet. 2010',
        'Neff LP et al. Damage control resuscitation in pediatric trauma. J Pediatr Surg. 2015',
        'ACS ATLS Student Manual, 10th Edition',
      ],
    },
  ],
  quiz: {
    id: 'hvs-i-quiz',
    courseId: 'hypovolemic-shock-i',
    questions: [
      {
        id: 'hvs-i-q1',
        question: 'A 2-year-old (10 kg) with 3 days of diarrhoea has HR 165, BP 80/50, CRT 4 seconds, and sunken eyes. Which fluid and dose is MOST appropriate as first-line resuscitation?',
        options: [
          'A. 5% dextrose 200 mL over 30 minutes',
          'B. Normal saline 100 mL (10 mL/kg) over 15 minutes',
          'C. Hartmann\'s 200 mL (20 mL/kg) over 5 minutes',
          'D. Oral rehydration solution 500 mL over 4 hours',
        ],
        correctAnswer: 'C',
        explanation: 'This child has severe dehydration/hypovolaemic shock (HR 165, prolonged CRT 4s, hypotension). Immediate IV resuscitation is required. Hartmann\'s 20 mL/kg over 5–15 minutes is appropriate for severe shock. Note: In sub-Saharan Africa with high malaria prevalence, 10 mL/kg boluses are preferred (FEAST trial). ORS is not appropriate for shock. 5% dextrose is not a resuscitation fluid.',
      },
      {
        id: 'hvs-i-q2',
        question: 'A child with trauma and haemorrhagic shock has received 60 mL/kg crystalloid. Haemoglobin is 5 g/dL and bleeding continues. What is the NEXT most appropriate intervention?',
        options: [
          'A. Another 20 mL/kg normal saline bolus',
          'B. Packed red blood cells 10–20 mL/kg',
          'C. Albumin 4.5% 10 mL/kg',
          'D. Dopamine infusion',
        ],
        correctAnswer: 'B',
        explanation: 'After 60 mL/kg crystalloid with ongoing haemorrhage and Hb 5 g/dL, blood products are indicated. PRBC 10–20 mL/kg is the correct next step. In massive haemorrhage, use 1:1:1 ratio (PRBC:FFP:Platelets). More crystalloid will worsen dilutional coagulopathy. Albumin is not indicated for haemorrhagic shock. Dopamine does not address the underlying volume deficit.',
      },
      {
        id: 'hvs-i-q3',
        question: 'A 7-year-old with road traffic accident arrives with HR 145, BP 75/40, and obvious femur fracture with significant blood loss. When should tranexamic acid be given?',
        options: [
          'A. Only after surgical haemostasis',
          'B. Within 3 hours of injury',
          'C. Only if fibrinogen is low',
          'D. After 2 units of PRBC',
        ],
        correctAnswer: 'B',
        explanation: 'Tranexamic acid (TXA) must be given within 3 hours of injury to be effective — evidence from CRASH-2 trial. After 3 hours, TXA may actually increase mortality. Dose: 15–30 mg/kg IV over 10 minutes. It should be given early, not delayed until after surgery or laboratory results.',
      },
    ],
    passingScore: 80,
  },
  capstone: {
    id: 'hvs-i-capstone',
    courseId: 'hypovolemic-shock-i',
    title: 'Hypovolaemic Shock Resuscitation Capstone',
    description: 'Manage a child with severe hypovolaemic shock from gastroenteritis',
    caseScenario: `
A 14-month-old girl (9 kg) is brought in with 5 days of profuse watery diarrhoea and vomiting. She is lethargic and not responding to her name. On examination: HR 185, BP 65/40, RR 55, SpO₂ 94%, CRT 6 seconds, sunken eyes and fontanelle, no tears, dry mucous membranes. Blood glucose is 2.1 mmol/L.

Your management plan should include:
1. Immediate resuscitation priorities
2. Fluid resuscitation plan with volumes and rates
3. Glucose management
4. Electrolyte monitoring and replacement
5. Monitoring targets and reassessment plan
    `,
    scoringRubric: [
      { criterion: 'Immediate: IV access, O₂, continuous monitoring, blood glucose correction', points: 20 },
      { criterion: 'Correct fluid resuscitation (10–20 mL/kg Hartmann\'s, reassess after each)', points: 30 },
      { criterion: 'Glucose: 2 mL/kg 10% dextrose IV immediately', points: 20 },
      { criterion: 'Electrolyte monitoring (Na, K, bicarbonate) and replacement plan', points: 15 },
      { criterion: 'Clear monitoring targets (HR, CRT, UO, mental status)', points: 15 },
    ],
  },
};

// ─── Hypovolaemic Shock II ─────────────────────────────────────

export const hypovolaemicShockIICourse: Course = {
  id: 'hypovolemic-shock-ii',
  courseId: 'hypovolemic-shock-ii',
  title: 'Hypovolaemic Shock — Electrolyte Disorders & Special Situations',
  description: 'Advanced management of hypovolaemic shock: electrolyte disorders, diabetic ketoacidosis, adrenal crisis, and fluid management in special populations.',
  duration: 75,
  modules: [
    {
      id: 'hvs-ii-m1',
      courseId: 'hypovolemic-shock-ii',
      moduleNumber: 1,
      title: 'Electrolyte Disorders in Hypovolaemic Shock',
      content: `
## Electrolyte Disorders in Hypovolaemic Shock

### Sodium Disorders

**Hyponatraemia (Na <135 mmol/L)**
- Common in gastroenteritis with hypotonic fluid replacement
- Severe (<120 mmol/L): seizures, coma
- Correction: 3% NaCl 2–3 mL/kg over 10–20 minutes for symptomatic cases
- Target: raise Na by 5 mmol/L to stop seizures
- Chronic: correct slowly (<0.5 mmol/L/hr) to avoid osmotic demyelination

**Hypernatraemia (Na >145 mmol/L)**
- Occurs with water loss > sodium loss (e.g., diabetes insipidus, high-solute feeds)
- Severe (>160 mmol/L): cerebral oedema risk during correction
- Correction: reduce Na by <0.5 mmol/L/hr (max 10 mmol/L/day)
- Use hypotonic fluids (0.45% NaCl or 5% dextrose)

### Potassium Disorders

**Hypokalaemia (K <3.5 mmol/L)**
- Common in diarrhoea, vomiting, diuretic use
- Severe (<2.5 mmol/L): arrhythmias, muscle weakness
- Replacement: KCl 0.3 mmol/kg/hr IV (max 0.5 mmol/kg/hr)
- Never give K as IV bolus — fatal arrhythmia

**Hyperkalaemia (K >5.5 mmol/L)**
- Occurs in renal failure, adrenal crisis, haemolysis
- ECG changes: peaked T waves → wide QRS → sine wave → VF
- Emergency treatment: calcium gluconate 0.5 mL/kg IV (membrane stabilisation)

### Metabolic Acidosis
- Common in severe shock (lactic acidosis)
- Bicarbonate only if pH <7.1 with haemodynamic compromise
- Dose: 1–2 mmol/kg IV over 30–60 minutes
- Treat underlying cause (restore perfusion)
      `,
      learningObjectives: [
        'Manage hyponatraemia and hypernatraemia with appropriate correction rates',
        'Replace potassium safely in hypokalaemia',
        'Recognise and treat hyperkalaemia with ECG changes',
        'Manage metabolic acidosis in the context of shock',
      ],
      keyPoints: [
        'Hyponatraemia with seizures: 3% NaCl 2–3 mL/kg — raise Na by 5 mmol/L only',
        'Hypernatraemia: correct slowly (<0.5 mmol/L/hr) to prevent cerebral oedema',
        'Never give potassium as IV bolus — fatal arrhythmia',
        'Hyperkalaemia with ECG changes: calcium gluconate first (membrane stabilisation)',
      ],
      references: [
        'Moritz ML, Ayus JC. Disorders of water metabolism in children. Pediatr Rev. 2002',
        'Sterns RH. Disorders of plasma sodium. N Engl J Med. 2015',
        'AHA PALS Provider Manual 2020',
      ],
    },
    {
      id: 'hvs-ii-m2',
      courseId: 'hypovolemic-shock-ii',
      moduleNumber: 2,
      title: 'Diabetic Ketoacidosis (DKA) Fluid Management',
      content: `
## DKA Fluid Management in Children

### DKA Severity
| Severity | pH | Bicarbonate |
|----------|-----|-------------|
| Mild | 7.25–7.30 | 15–18 mmol/L |
| Moderate | 7.10–7.24 | 5–14 mmol/L |
      Severe | <7.10 | <5 mmol/L |

### Fluid Management Protocol
**Phase 1 (Resuscitation — only if shocked):**
- 10 mL/kg normal saline over 30 minutes
- Repeat if still shocked (max 20 mL/kg total)
- Do NOT give large boluses routinely — risk of cerebral oedema

**Phase 2 (Rehydration — 48 hours):**
- Calculate deficit: mild 5%, moderate 7%, severe 10% of body weight
- Add maintenance fluids
- Replace over 48 hours with 0.9% NaCl + 20 mmol/L KCl
- Add glucose when BG <14 mmol/L (switch to 0.45% NaCl + 5% dextrose)

### Cerebral Oedema — The Feared Complication
- Occurs in 0.5–1% of DKA episodes
- Risk factors: young age, new-onset DKA, rapid fluid administration, bicarbonate use
- Warning signs: headache, bradycardia, hypertension, deteriorating GCS
- Treatment: Mannitol 0.5–1 g/kg IV OR 3% NaCl 2.5–5 mL/kg
- Reduce IV fluid rate by 30%

### Potassium in DKA
- Total body K is depleted (even if serum K normal/high)
- Start K replacement when K <5.5 mmol/L and urine output confirmed
- Add KCl 40 mmol/L to IV fluids
- If K <3.5: replace before starting insulin

### Insulin Protocol
- Start insulin 0.05–0.1 units/kg/hr AFTER fluids running
- Never give insulin bolus in children
- Continue until pH >7.30 and bicarbonate >15 mmol/L
      `,
      learningObjectives: [
        'Calculate fluid deficit and replacement rate for DKA',
        'Recognise and treat cerebral oedema in DKA',
        'Manage potassium replacement in DKA safely',
        'Time insulin initiation correctly relative to fluid resuscitation',
      ],
      keyPoints: [
        'DKA fluids: replace over 48 hours — rapid correction causes cerebral oedema',
        'Cerebral oedema: mannitol 0.5–1 g/kg OR 3% NaCl 2.5–5 mL/kg immediately',
        'Start insulin AFTER fluids running — never as bolus',
        'Replace K before insulin if K <3.5 mmol/L',
      ],
      references: [
        'ISPAD Clinical Practice Consensus Guidelines 2022 — DKA',
        'Wolfsdorf JI et al. Diabetic ketoacidosis and hyperglycaemic hyperosmolar state. Pediatr Diabetes. 2014',
        'Edge JA et al. The risk and outcome of cerebral oedema developing during DKA. Arch Dis Child. 2001',
      ],
    },
    {
      id: 'hvs-ii-m3',
      courseId: 'hypovolemic-shock-ii',
      moduleNumber: 3,
      title: 'Adrenal Crisis and Special Situations',
      content: `
## Adrenal Crisis and Special Situations in Hypovolaemic Shock

### Adrenal Crisis
**Definition:** Life-threatening glucocorticoid and mineralocorticoid deficiency

**Causes in Children:**
- Congenital adrenal hyperplasia (CAH) — most common in neonates
- Abrupt steroid withdrawal
- Waterhouse-Friderichsen syndrome (meningococcal sepsis)
- Pituitary disease

**Clinical Features:**
- Hypovolaemic shock resistant to fluids
- Hyponatraemia + hyperkalaemia (mineralocorticoid deficiency)
- Hypoglycaemia
- Vomiting, abdominal pain

**Emergency Treatment:**
1. Hydrocortisone 50–100 mg/m² IV (or 2 mg/kg IV for infants)
2. Normal saline 20 mL/kg IV bolus
3. 10% dextrose 2 mL/kg for hypoglycaemia
4. Fludrocortisone (oral) once stable

### Nephrotic Syndrome with Hypovolaemia
- Paradox: oedema + intravascular depletion
- Suspect if: abdominal pain, tachycardia, poor peripheral perfusion
- Treatment: albumin 20% 0.5–1 g/kg IV over 2–4 hours (not crystalloid)

### Pyloric Stenosis
- Hypochloraemic hypokalaemic metabolic alkalosis
- Resuscitate with normal saline (not Hartmann's — avoid lactate)
- Correct electrolytes before surgery

### Fluid Management in Malnutrition
- Severely malnourished children have impaired cardiac function
- Avoid rapid fluid boluses — risk of cardiac failure
- Use WHO ReSoMal (Rehydration Solution for Malnourished Children)
- If shocked: 10 mL/kg Hartmann's over 30–60 minutes, reassess carefully
      `,
      learningObjectives: [
        'Recognise adrenal crisis and administer emergency hydrocortisone',
        'Manage hypovolaemia in nephrotic syndrome with albumin',
        'Understand electrolyte correction in pyloric stenosis',
        'Apply modified fluid protocols for severely malnourished children',
      ],
      keyPoints: [
        'Adrenal crisis: hydrocortisone 2 mg/kg IV immediately — do not delay for investigations',
        'Nephrotic hypovolaemia: albumin 20%, not crystalloid',
        'Pyloric stenosis: normal saline (not Hartmann\'s) to correct alkalosis',
        'Malnutrition: avoid rapid boluses — impaired cardiac function',
      ],
      references: [
        'Bornstein SR et al. Diagnosis and treatment of primary adrenal insufficiency. J Clin Endocrinol Metab. 2016',
        'WHO Guidelines for the management of severe acute malnutrition (2013)',
        'Sterns RH. Disorders of plasma sodium. N Engl J Med. 2015',
      ],
    },
  ],
  quiz: {
    id: 'hvs-ii-quiz',
    courseId: 'hypovolemic-shock-ii',
    questions: [
      {
        id: 'hvs-ii-q1',
        question: 'A 10-year-old with DKA (pH 7.15, glucose 28 mmol/L) has received 10 mL/kg normal saline and is no longer shocked. What is the MOST appropriate next step?',
        options: [
          'A. Give another 20 mL/kg normal saline bolus',
          'B. Start insulin 0.1 units/kg/hr immediately',
          'C. Begin 48-hour rehydration with 0.9% NaCl + KCl',
          'D. Give sodium bicarbonate 2 mmol/kg IV',
        ],
        correctAnswer: 'C',
        explanation: 'After initial resuscitation, DKA fluids should be replaced over 48 hours (not rapidly) to prevent cerebral oedema. Use 0.9% NaCl + KCl (once K <5.5 and urine output confirmed). Insulin should be started AFTER fluids are running, not before. Bicarbonate is not indicated (pH 7.15 is moderate DKA, not severe enough for bicarbonate, and bicarbonate increases cerebral oedema risk).',
      },
      {
        id: 'hvs-ii-q2',
        question: 'A 3-week-old neonate with congenital adrenal hyperplasia presents in shock with Na 118, K 7.2, glucose 1.8 mmol/L. What is the MOST URGENT intervention?',
        options: [
          'A. Normal saline 20 mL/kg IV bolus',
          'B. Hydrocortisone 2 mg/kg IV',
          'C. 10% dextrose 2 mL/kg IV',
          'D. Calcium gluconate for hyperkalaemia',
        ],
        correctAnswer: 'B',
        explanation: 'This is adrenal crisis — the MOST URGENT intervention is hydrocortisone (replaces the missing cortisol and aldosterone). Without hydrocortisone, fluids and glucose will not be effective. In practice, give all three simultaneously: hydrocortisone, normal saline, and dextrose. But if forced to choose the single most urgent, hydrocortisone addresses the root cause.',
      },
      {
        id: 'hvs-ii-q3',
        question: 'A child with DKA develops headache and bradycardia 4 hours into treatment. GCS drops from 15 to 12. What is the MOST appropriate immediate treatment?',
        options: [
          'A. Increase IV fluid rate',
          'B. Give mannitol 0.5–1 g/kg IV',
          'C. Stop insulin infusion',
          'D. Give furosemide 1 mg/kg IV',
        ],
        correctAnswer: 'B',
        explanation: 'Headache + bradycardia + deteriorating GCS during DKA treatment = cerebral oedema until proven otherwise. Immediate treatment: mannitol 0.5–1 g/kg IV (or 3% NaCl 2.5–5 mL/kg) AND reduce IV fluid rate by 30%. Increasing fluids will worsen cerebral oedema. Stopping insulin is not the primary treatment. Furosemide is not indicated.',
      },
    ],
    passingScore: 80,
  },
  capstone: {
    id: 'hvs-ii-capstone',
    courseId: 'hypovolemic-shock-ii',
    title: 'Complex Hypovolaemic Shock Capstone',
    description: 'Manage a child with DKA complicated by cerebral oedema',
    caseScenario: `
A 9-year-old girl (28 kg) presents with new-onset type 1 diabetes in DKA. Initial labs: pH 7.08, glucose 35 mmol/L, Na 128, K 3.2, bicarbonate 4 mmol/L. She is not shocked. You start 48-hour rehydration with 0.9% NaCl + KCl and insulin at 0.1 units/kg/hr. Four hours later, her nurse calls urgently: the child is complaining of severe headache, her HR has dropped from 140 to 88, BP has risen from 90/60 to 125/85, and her GCS is now 11/15.

Your management plan should include:
1. Immediate diagnosis and rationale
2. Emergency treatment (drug, dose, route)
3. Fluid management adjustment
4. Insulin management
5. Monitoring and escalation plan
    `,
    scoringRubric: [
      { criterion: 'Correct diagnosis: cerebral oedema (Cushing\'s triad + deteriorating GCS)', points: 25 },
      { criterion: 'Mannitol 0.5–1 g/kg IV OR 3% NaCl 2.5–5 mL/kg immediately', points: 30 },
      { criterion: 'Reduce IV fluid rate by 30%', points: 20 },
      { criterion: 'Continue insulin (do not stop — DKA still present)', points: 10 },
      { criterion: 'CT head, PICU escalation, neurosurgery if needed', points: 15 },
    ],
  },
};

// ─── Severe Anaemia I ─────────────────────────────────────────

export const severeAnaemiaICourse: Course = {
  id: 'severe-anaemia-i',
  courseId: 'severe-anaemia-i',
  title: 'Severe Anaemia — Recognition & Transfusion Management',
  description: 'Evidence-based management of severe anaemia in children: causes, clinical assessment, transfusion thresholds, and complications including cardiac failure.',
  duration: 75,
  modules: [
    {
      id: 'sa-i-m1',
      courseId: 'severe-anaemia-i',
      moduleNumber: 1,
      title: 'Recognising Severe Anaemia and Its Complications',
      content: `
## Severe Anaemia in Children

### WHO Definition
- Severe anaemia: Haemoglobin <7 g/dL (or <70 g/L)
- Very severe anaemia: Hb <4 g/dL

### Common Causes in Sub-Saharan Africa
1. **Malaria** — most common cause of severe anaemia in endemic areas
2. **Iron deficiency** — most common globally
3. **Sickle cell disease** — aplastic crisis, splenic sequestration
4. **Nutritional deficiencies** — folate, B12
5. **Haemolytic anaemia** — G6PD deficiency, autoimmune
6. **Chronic infection** — HIV, tuberculosis

### Clinical Assessment
**Compensated anaemia:**
- Pallor (conjunctival, palmar, nail bed)
- Tachycardia
- Flow murmur
- Normal or mildly elevated respiratory rate

**Decompensated anaemia (cardiac failure):**
- Severe tachycardia
- Respiratory distress (pulmonary oedema)
- Hepatomegaly
- Gallop rhythm
- Oedema

### Danger Signs (WHO)
- Respiratory distress
- Impaired consciousness
- Severe pallor
- Haemoglobin <6 g/dL with any clinical feature

### Investigations
- Full blood count with differential
- Blood film (malaria parasites, sickle cells, spherocytes)
- Reticulocyte count (regenerative vs hypoproliferative)
- Blood group and crossmatch
- Malaria RDT/microscopy
- Sickle cell screen if indicated
      `,
      learningObjectives: [
        'Define severe anaemia and identify common causes in sub-Saharan Africa',
        'Distinguish compensated from decompensated anaemia',
        'Identify WHO danger signs requiring urgent transfusion',
        'Order appropriate investigations for severe anaemia',
      ],
      keyPoints: [
        'Severe anaemia: Hb <7 g/dL; very severe: Hb <4 g/dL',
        'Decompensated: respiratory distress + hepatomegaly + gallop = cardiac failure',
        'Malaria is the most common cause of severe anaemia in endemic areas',
        'Conjunctival pallor is the most reliable clinical sign of anaemia',
      ],
      references: [
        'WHO Pocket Book of Hospital Care for Children (2013)',
        'Maitland K et al. Severe anaemia in African children. Lancet. 2003',
        'Calis JC et al. Severe anaemia in Malawian children. N Engl J Med. 2008',
      ],
    },
    {
      id: 'sa-i-m2',
      courseId: 'severe-anaemia-i',
      moduleNumber: 2,
      title: 'Blood Transfusion: Indications, Thresholds, and Technique',
      content: `
## Blood Transfusion in Severe Paediatric Anaemia

### Transfusion Thresholds (WHO Guidelines)
| Clinical Status | Hb Threshold | Action |
|----------------|-------------|--------|
| Danger signs present | Any Hb | Transfuse immediately |
| No danger signs, Hb <4 g/dL | <4 g/dL | Transfuse |
| No danger signs, Hb 4–6 g/dL | 4–6 g/dL | Transfuse if clinical features |
| No danger signs, Hb >6 g/dL | >6 g/dL | Iron therapy, treat cause |

### Transfusion Volume and Rate
**Standard transfusion:**
- Volume: 10–20 mL/kg packed red blood cells (PRBC)
- Rate: 5 mL/kg/hr (over 2–4 hours)
- Maximum: 20 mL/kg per transfusion episode

**With cardiac failure (hepatomegaly, respiratory distress):**
- Volume: 10 mL/kg PRBC (not 20 mL/kg)
- Rate: 5 mL/kg/hr (slower, over 4 hours)
- Give furosemide 1 mg/kg IV mid-transfusion
- Reassess after each 10 mL/kg

### Post-Transfusion Monitoring
- Vital signs every 15 minutes for first hour
- Signs of transfusion reaction: fever, rash, haemolysis
- Reassess Hb 1 hour post-transfusion
- Target Hb: 8–10 g/dL (not over-transfuse)

### Transfusion Reactions
| Reaction | Features | Management |
|----------|---------|-----------|
| Febrile non-haemolytic | Fever, chills (no haemolysis) | Slow/stop, paracetamol |
| Haemolytic | Fever, flank pain, haemoglobinuria | STOP immediately, fluids, monitor renal function |
| Allergic | Urticaria, bronchospasm | Antihistamine, adrenaline if anaphylaxis |
| TACO | Pulmonary oedema | Slow/stop, furosemide |

### Malaria and Transfusion
- Treat malaria before or simultaneously with transfusion
- Artemisinin-based therapy is safe to give with transfusion
- Do not delay transfusion waiting for malaria treatment to work
      `,
      learningObjectives: [
        'Apply WHO transfusion thresholds for severe anaemia',
        'Calculate transfusion volume and rate for children with and without cardiac failure',
        'Monitor for and manage transfusion reactions',
        'Manage severe anaemia with concurrent malaria',
      ],
      keyPoints: [
        'Cardiac failure: 10 mL/kg PRBC + furosemide 1 mg/kg mid-transfusion',
        'Haemolytic reaction: STOP transfusion immediately, aggressive IV fluids',
        'Target Hb 8–10 g/dL — avoid over-transfusion',
        'Treat malaria simultaneously with transfusion — do not delay either',
      ],
      references: [
        'WHO Pocket Book of Hospital Care for Children (2013)',
        'WHO Clinical Transfusion Practice Guidelines (2010)',
        'Maitland K et al. Severe anaemia in African children. Lancet. 2003',
      ],
    },
    {
      id: 'sa-i-m3',
      courseId: 'severe-anaemia-i',
      moduleNumber: 3,
      title: 'Sickle Cell Crises and Specific Anaemia Emergencies',
      content: `
## Sickle Cell Crises and Specific Anaemia Emergencies

### Sickle Cell Acute Chest Syndrome (ACS)
**Definition:** New pulmonary infiltrate + fever and/or respiratory symptoms in sickle cell disease

**Management:**
1. Oxygen (target SpO₂ >95%)
2. Analgesia (IV morphine 0.05–0.1 mg/kg)
3. IV fluids (maintenance, not excess)
4. Incentive spirometry
5. Exchange transfusion if severe (Hb >10 g/dL target)
6. Antibiotics (ceftriaxone + azithromycin — atypical coverage)

### Splenic Sequestration Crisis
- Acute pooling of blood in spleen
- Rapidly falling Hb + splenomegaly
- Hypovolaemic shock
- Treatment: PRBC 10–20 mL/kg, splenectomy if recurrent

### Aplastic Crisis
- Parvovirus B19 infection → bone marrow suppression
- Hb falls rapidly, reticulocytes absent
- Treatment: PRBC transfusion, supportive care
- Self-limiting (7–10 days)

### G6PD Deficiency Haemolytic Crisis
- Triggered by: oxidant drugs (dapsone, primaquine), infections, fava beans
- Intravascular haemolysis: haemoglobinuria, jaundice, anaemia
- Treatment: Remove trigger, PRBC if severe anaemia, hydration

### Iron Deficiency Anaemia
- Most common anaemia globally
- Microcytic, hypochromic
- Treatment: Ferrous sulphate 3–6 mg/kg/day elemental iron for 3 months
- Transfuse only if Hb <7 g/dL with symptoms or <4 g/dL
      `,
      learningObjectives: [
        'Manage acute chest syndrome in sickle cell disease',
        'Recognise and treat splenic sequestration crisis',
        'Identify and manage aplastic crisis from parvovirus B19',
        'Treat G6PD haemolytic crisis by removing the trigger',
      ],
      keyPoints: [
        'ACS: O₂ + analgesia + incentive spirometry + antibiotics (atypical coverage)',
        'Splenic sequestration: PRBC + consider splenectomy if recurrent',
        'Aplastic crisis: parvovirus B19, no reticulocytes, self-limiting',
        'G6PD crisis: remove trigger first, then transfuse if needed',
      ],
      references: [
        'National Heart, Lung, and Blood Institute. Evidence-based management of sickle cell disease (2014)',
        'Howard J. Sickle cell disease. BMJ. 2016',
        'WHO Pocket Book of Hospital Care for Children (2013)',
      ],
    },
  ],
  quiz: {
    id: 'sa-i-quiz',
    courseId: 'severe-anaemia-i',
    questions: [
      {
        id: 'sa-i-q1',
        question: 'A 2-year-old in a malaria-endemic area has Hb 4.5 g/dL, HR 165, RR 55, hepatomegaly, and bilateral crackles. What is the MOST appropriate transfusion plan?',
        options: [
          'A. 20 mL/kg PRBC over 2 hours',
          'B. 10 mL/kg PRBC over 4 hours with furosemide 1 mg/kg mid-transfusion',
          'C. Defer transfusion and treat malaria first',
          'D. 5 mL/kg PRBC over 6 hours',
        ],
        correctAnswer: 'B',
        explanation: 'This child has severe anaemia with cardiac failure (hepatomegaly + crackles). Use 10 mL/kg (not 20 mL/kg) to avoid worsening cardiac failure. Give furosemide 1 mg/kg mid-transfusion. Treat malaria simultaneously — do not defer transfusion. Reassess after 10 mL/kg before giving more.',
      },
      {
        id: 'sa-i-q2',
        question: 'During a blood transfusion, a child develops fever, flank pain, and dark urine. What is the MOST URGENT action?',
        options: [
          'A. Slow the transfusion rate',
          'B. Give paracetamol and continue transfusion',
          'C. Stop transfusion immediately',
          'D. Give antihistamine and continue',
        ],
        correctAnswer: 'C',
        explanation: 'Fever + flank pain + dark urine = haemolytic transfusion reaction (ABO incompatibility). This is a medical emergency. STOP the transfusion IMMEDIATELY. Send remaining blood and patient sample to blood bank. Give IV fluids to protect kidneys. Monitor renal function. Slowing the transfusion is not appropriate for haemolytic reactions.',
      },
      {
        id: 'sa-i-q3',
        question: 'A 6-year-old with sickle cell disease develops fever, chest pain, and SpO₂ 88% on room air. CXR shows a new right lower lobe infiltrate. What is this diagnosis and first-line treatment?',
        options: [
          'A. Community-acquired pneumonia — start amoxicillin',
          'B. Acute chest syndrome — oxygen, analgesia, ceftriaxone + azithromycin',
          'C. Pulmonary embolism — anticoagulation',
          'D. Sickle cell crisis — IV fluids and morphine only',
        ],
        correctAnswer: 'B',
        explanation: 'New pulmonary infiltrate + fever/respiratory symptoms in sickle cell disease = Acute Chest Syndrome (ACS). Treatment: O₂ (target SpO₂ >95%), analgesia (morphine), IV fluids, incentive spirometry, and antibiotics covering both typical (ceftriaxone) and atypical (azithromycin) organisms. Exchange transfusion if severe. ACS is the leading cause of death in sickle cell disease.',
      },
    ],
    passingScore: 80,
  },
  capstone: {
    id: 'sa-i-capstone',
    courseId: 'severe-anaemia-i',
    title: 'Severe Anaemia Management Capstone',
    description: 'Manage a child with severe anaemia and cardiac failure in a resource-limited setting',
    caseScenario: `
A 3-year-old girl (12 kg) from a malaria-endemic area presents with 5 days of fever and progressive pallor. On examination: HR 175, RR 60, SpO₂ 91% on room air, severe conjunctival pallor, hepatomegaly (4 cm), bilateral crackles, and a gallop rhythm. Malaria RDT is positive. Point-of-care Hb is 3.8 g/dL. The blood bank has only one unit of PRBC available.

Your management plan should include:
1. Immediate stabilisation priorities
2. Transfusion plan (volume, rate, adjuncts)
3. Malaria treatment plan
4. Monitoring during and after transfusion
5. Plan if child deteriorates during transfusion
    `,
    scoringRubric: [
      { criterion: 'Immediate: O₂, IV access, continuous monitoring', points: 15 },
      { criterion: 'Correct transfusion: 10 mL/kg PRBC + furosemide 1 mg/kg', points: 30 },
      { criterion: 'Simultaneous malaria treatment (artemisinin-based)', points: 20 },
      { criterion: 'Monitoring: vitals every 15 min, watch for transfusion reactions', points: 20 },
      { criterion: 'Deterioration plan: stop transfusion, reassess, manage reaction', points: 15 },
    ],
  },
};

// ─── Severe Malaria I ─────────────────────────────────────────

export const severeMalariaICourse: Course = {
  id: 'severe-malaria-i',
  courseId: 'severe-malaria-i',
  title: 'Severe Malaria — Recognition & Antimalarial Therapy',
  description: 'Evidence-based recognition and antimalarial treatment of severe Plasmodium falciparum malaria in children: WHO criteria, IV artesunate, and supportive care.',
  duration: 90,
  modules: [
    {
      id: 'sm-i-m1',
      courseId: 'severe-malaria-i',
      moduleNumber: 1,
      title: 'WHO Criteria for Severe Malaria',
      content: `
## WHO Criteria for Severe Malaria

### Definition
Severe malaria is Plasmodium falciparum infection with one or more of the following features (WHO 2015):

### Clinical Criteria
1. **Impaired consciousness** (GCS <11 in adults, Blantyre Coma Scale <3 in children)
2. **Prostration** — generalised weakness, cannot sit/stand/walk
3. **Multiple convulsions** — >2 in 24 hours
4. **Respiratory distress** — acidotic breathing, deep breathing
5. **Pulmonary oedema** — SpO₂ <92% on air, CXR changes
6. **Abnormal bleeding** — DIC, spontaneous haemorrhage
7. **Jaundice** — clinical or bilirubin >50 μmol/L
8. **Haemoglobinuria** — dark urine (blackwater fever)
9. **Shock** — SBP <70 mmHg in children

### Laboratory Criteria
- Severe anaemia: Hb <5 g/dL
- Hypoglycaemia: glucose <2.2 mmol/L
- Renal impairment: creatinine >265 μmol/L
- Hyperparasitaemia: >5% parasitised RBCs (or >10% in high-transmission areas)
- Metabolic acidosis: bicarbonate <15 mmol/L or base excess <-8
- Hyperlactataemia: lactate >5 mmol/L

### Blantyre Coma Scale (Children)
| Component | Score |
|-----------|-------|
| Best motor response: localises (2), withdraws (1), none (0) | 0–2 |
| Verbal: cries appropriately (2), moans (1), none (0) | 0–2 |
| Eye opening: spontaneous (1), none (0) | 0–1 |
| **Total** | **0–5** |

Score ≤2 = coma (equivalent to GCS ≤8)

### Cerebral Malaria
- Blantyre score ≤2 + P. falciparum parasitaemia + no other cause of coma
- Mortality: 15–20% even with treatment
- Survivors: 25% have neurological sequelae
      `,
      learningObjectives: [
        'Apply WHO criteria to diagnose severe malaria',
        'Use the Blantyre Coma Scale to assess consciousness in children',
        'Identify laboratory features of severe malaria',
        'Recognise cerebral malaria and understand its prognosis',
      ],
      keyPoints: [
        'Any ONE WHO criterion = severe malaria requiring IV treatment',
        'Blantyre Coma Scale ≤2 = coma in children (not GCS)',
        'Hypoglycaemia (<2.2 mmol/L) is common and must be checked immediately',
        'Cerebral malaria: 15–20% mortality, 25% neurological sequelae in survivors',
      ],
      references: [
        'WHO Guidelines for the Treatment of Malaria, 3rd Edition (2015)',
        'Dondorp AM et al. Artesunate versus quinine for severe malaria. Lancet. 2005',
        'Idro R et al. Cerebral malaria. Lancet Neurol. 2010',
      ],
    },
    {
      id: 'sm-i-m2',
      courseId: 'severe-malaria-i',
      moduleNumber: 2,
      title: 'IV Artesunate and Antimalarial Treatment',
      content: `
## IV Artesunate and Antimalarial Treatment

### IV Artesunate — First-Line Treatment
**Dose:** 2.4 mg/kg IV at 0, 12, and 24 hours, then once daily until oral treatment possible

**Preparation:**
1. Dissolve artesunate powder in 1 mL 5% sodium bicarbonate
2. Dilute in 5 mL 5% dextrose
3. Give IV over 1–2 minutes (or IM if IV not available)

**Duration:** Minimum 24 hours IV, then switch to oral ACT (artemether-lumefantrine) for 3 days

**Evidence:** AQUAMAT trial (2010) — artesunate reduced mortality by 22.5% vs quinine in African children

### When IV Artesunate is Not Available
**IV quinine** (second-line):
- Loading dose: 20 mg/kg IV over 4 hours (diluted in 5% dextrose)
- Maintenance: 10 mg/kg every 8 hours
- Monitor: ECG (QT prolongation), blood glucose (hypoglycaemia)
- Switch to oral when tolerated

### Rectal Artesunate (Pre-Referral Treatment)
- For children who cannot swallow and IV not available
- Dose: 10 mg/kg rectal suppository
- Give ONCE and refer immediately
- Not a substitute for IV treatment

### Post-Artesunate Delayed Haemolysis
- Occurs 2–3 weeks after IV artesunate
- Haemolysis of previously parasitised RBCs
- Monitor Hb weekly for 4 weeks after severe malaria treatment
- Transfuse if symptomatic anaemia develops

### Monitoring During Treatment
- Blood glucose every 4 hours (hypoglycaemia common)
- Parasitaemia daily until negative
- Haemoglobin daily
- Urine output hourly
- Neurological status (Blantyre score) 4-hourly
      `,
      learningObjectives: [
        'Prepare and administer IV artesunate correctly',
        'Know when to use IV quinine as second-line treatment',
        'Administer rectal artesunate as pre-referral treatment',
        'Monitor for post-artesunate delayed haemolysis',
      ],
      keyPoints: [
        'IV artesunate 2.4 mg/kg at 0, 12, 24 hours — then once daily until oral possible',
        'AQUAMAT trial: artesunate reduces mortality by 22.5% vs quinine',
        'Rectal artesunate: pre-referral only, give once then transfer immediately',
        'Post-artesunate haemolysis: monitor Hb weekly for 4 weeks',
      ],
      references: [
        'AQUAMAT Trial — Dondorp AM et al. Lancet. 2010',
        'WHO Guidelines for the Treatment of Malaria, 3rd Edition (2015)',
        'Kreeftmeijer-Vegter AR et al. Artesunate-associated haemolysis. Malar J. 2012',
      ],
    },
    {
      id: 'sm-i-m3',
      courseId: 'severe-malaria-i',
      moduleNumber: 3,
      title: 'Supportive Care in Severe Malaria',
      content: `
## Supportive Care in Severe Malaria

### Hypoglycaemia Management
- Check glucose immediately and every 4 hours
- Treat if <2.2 mmol/L: 10% dextrose 5 mL/kg IV over 5 minutes
- Prevent: add glucose to IV fluids (5% dextrose-saline)
- Quinine causes hyperinsulinaemia → more hypoglycaemia than artesunate

### Seizure Management
- Diazepam 0.3–0.5 mg/kg IV (or rectal) for active seizure
- Phenobarbitone 15–20 mg/kg IV for refractory seizures
- Prophylactic anticonvulsants NOT recommended (no benefit, may worsen outcome)
- Treat hypoglycaemia, hyperthermia, and electrolyte abnormalities as seizure triggers

### Fever Management
- Paracetamol 15 mg/kg 4–6 hourly
- Tepid sponging
- Target temperature <38.5°C
- Hyperthermia worsens cerebral malaria outcome

### Fluid Management
- Avoid aggressive fluid resuscitation (FEAST trial data)
- Maintenance fluids with glucose
- Small boluses (10 mL/kg) only if clearly shocked
- Monitor for pulmonary oedema

### Anaemia Management
- Transfuse if Hb <5 g/dL or Hb 5–7 g/dL with danger signs
- 10 mL/kg PRBC over 4 hours
- Furosemide 1 mg/kg if cardiac failure

### Nursing Care in Coma
- Lateral position (prevent aspiration)
- Nasogastric tube (prevent aspiration, drug administration)
- Urinary catheter (monitor output)
- Eye care (prevent corneal ulceration)
- Pressure area care
- Mouth care
      `,
      learningObjectives: [
        'Manage hypoglycaemia in severe malaria with appropriate glucose replacement',
        'Treat seizures in cerebral malaria with diazepam and phenobarbitone',
        'Apply appropriate fluid management avoiding over-resuscitation',
        'Provide comprehensive nursing care for the comatose child with malaria',
      ],
      keyPoints: [
        'Check glucose every 4 hours — hypoglycaemia is common and fatal if missed',
        'No prophylactic anticonvulsants — treat seizures when they occur',
        'Avoid aggressive fluids — FEAST trial shows harm with boluses in febrile illness',
        'Lateral position + NG tube + urinary catheter for comatose child',
      ],
      references: [
        'WHO Guidelines for the Treatment of Malaria, 3rd Edition (2015)',
        'FEAST Trial — Maitland K et al. N Engl J Med. 2011',
        'Idro R et al. Cerebral malaria. Lancet Neurol. 2010',
      ],
    },
  ],
  quiz: {
    id: 'sm-i-quiz',
    courseId: 'severe-malaria-i',
    questions: [
      {
        id: 'sm-i-q1',
        question: 'A 4-year-old with P. falciparum malaria has Blantyre score 2, Hb 5.5 g/dL, and blood glucose 1.8 mmol/L. What is the MOST URGENT intervention?',
        options: [
          'A. Start IV artesunate immediately',
          'B. Give 10% dextrose 5 mL/kg IV',
          'C. Transfuse PRBC 10 mL/kg',
          'D. Give diazepam 0.3 mg/kg IV',
        ],
        correctAnswer: 'B',
        explanation: 'Hypoglycaemia (glucose 1.8 mmol/L) is the most immediately life-threatening abnormality and must be corrected first. Hypoglycaemia causes irreversible brain damage within minutes. Give 10% dextrose 5 mL/kg IV immediately, then start artesunate. Transfusion is needed but not as urgent as correcting hypoglycaemia. There is no active seizure requiring diazepam.',
      },
      {
        id: 'sm-i-q2',
        question: 'A child with severe malaria is started on IV artesunate. After 24 hours, she can swallow. What is the MOST appropriate next step?',
        options: [
          'A. Continue IV artesunate for 7 days',
          'B. Switch to oral artemether-lumefantrine for 3 days',
          'C. Switch to oral quinine for 7 days',
          'D. Stop all antimalarials as IV course is complete',
        ],
        correctAnswer: 'B',
        explanation: 'After minimum 24 hours of IV artesunate (or when oral treatment is tolerated), switch to a full course of oral ACT (artemether-lumefantrine) for 3 days. This completes the treatment course. IV artesunate alone for 24 hours is not a complete treatment. Oral quinine for 7 days is second-line and has more side effects.',
      },
      {
        id: 'sm-i-q3',
        question: 'A child in a remote health facility has cerebral malaria but IV access cannot be established. IV artesunate is available. What is the MOST appropriate action?',
        options: [
          'A. Wait until IV access is established before giving artesunate',
          'B. Give artesunate IM and arrange urgent transfer',
          'C. Give rectal artesunate and continue full treatment course rectally',
          'D. Give oral artemether-lumefantrine crushed in water',
        ],
        correctAnswer: 'B',
        explanation: 'IV artesunate can be given IM when IV access is not available. Give the first dose IM and arrange urgent transfer to a facility with IV capability. Rectal artesunate is a pre-referral measure only (one dose, then transfer) — not a full treatment course. Oral treatment is not appropriate for a comatose child (aspiration risk).',
      },
    ],
    passingScore: 80,
  },
  capstone: {
    id: 'sm-i-capstone',
    courseId: 'severe-malaria-i',
    title: 'Severe Malaria Management Capstone',
    description: 'Manage a child with cerebral malaria and multiple complications',
    caseScenario: `
A 5-year-old boy (18 kg) from a malaria-endemic area presents with 3 days of fever and 1 day of progressive drowsiness. He had two generalised seizures at home. On arrival: Blantyre score 2, HR 155, BP 85/55, RR 45, SpO₂ 90% on room air, temperature 39.8°C. Blood glucose is 1.6 mmol/L. Malaria RDT is positive. Hb is 5.2 g/dL. He has no hepatomegaly.

Your management plan should include:
1. Immediate priorities (first 5 minutes)
2. Antimalarial treatment plan
3. Seizure management
4. Fluid and anaemia management
5. Monitoring plan and escalation criteria
    `,
    scoringRubric: [
      { criterion: 'Immediate: correct hypoglycaemia (10% dextrose 5 mL/kg) FIRST', points: 25 },
      { criterion: 'IV artesunate 2.4 mg/kg at 0, 12, 24 hours', points: 25 },
      { criterion: 'Seizure management: diazepam if recurs, no prophylaxis', points: 20 },
      { criterion: 'Fluids: maintenance with glucose, small boluses only if shocked', points: 15 },
      { criterion: 'Monitoring: glucose 4-hourly, Blantyre score 4-hourly, Hb daily', points: 15 },
    ],
  },
};

// ─── Severe Malaria II ─────────────────────────────────────────

export const severeMalariaIICourse: Course = {
  id: 'severe-malaria-ii',
  courseId: 'severe-malaria-ii',
  title: 'Severe Malaria — Complications & Neurological Sequelae',
  description: 'Advanced management of severe malaria complications: cerebral malaria, malaria-associated acute respiratory distress, renal failure, and neurological rehabilitation.',
  duration: 75,
  modules: [
    {
      id: 'sm-ii-m1',
      courseId: 'severe-malaria-ii',
      moduleNumber: 1,
      title: 'Cerebral Malaria: Pathophysiology and Management',
      content: `
## Cerebral Malaria: Pathophysiology and Management

### Pathophysiology
Cerebral malaria involves:
1. **Cytoadherence** — parasitised RBCs adhere to brain microvasculature
2. **Rosetting** — parasitised RBCs bind unparasitised RBCs → microvascular obstruction
3. **Inflammatory cascade** — TNF-α, IL-1, NO → endothelial dysfunction
4. **Brain swelling** — vasogenic and cytotoxic oedema
5. **Metabolic crisis** — hypoglycaemia, lactic acidosis

### Intracranial Pressure in Cerebral Malaria
- Elevated ICP in 80% of fatal cerebral malaria cases
- Clinical signs: Cushing's triad (hypertension, bradycardia, irregular breathing), papilloedema
- Management: head elevation 30°, avoid hypotonic fluids, treat fever
- Mannitol: controversial — no proven benefit in RCTs, may worsen hypovolaemia
- Dexamethasone: CONTRAINDICATED (increases coma duration and GI bleeding)

### Neurological Assessment
- Blantyre Coma Scale every 4 hours
- Pupil reactivity
- Posturing (decorticate/decerebrate)
- Fundoscopy (papilloedema, malarial retinopathy)

### Malarial Retinopathy
- Pathognomonic for cerebral malaria
- Features: white-centred haemorrhages, vessel discolouration, papilloedema
- Presence confirms diagnosis; absence does not exclude

### Recovery from Coma
- Median time to recovery: 48–72 hours
- Persistent coma >72 hours: poor prognosis
- Recovery sequence: eye opening → purposeful movement → verbal response
      `,
      learningObjectives: [
        'Explain the pathophysiology of cerebral malaria',
        'Assess intracranial pressure in cerebral malaria',
        'Avoid harmful interventions (dexamethasone, mannitol)',
        'Recognise malarial retinopathy as a diagnostic feature',
      ],
      keyPoints: [
        'Dexamethasone is CONTRAINDICATED in cerebral malaria — increases harm',
        'Mannitol: no proven benefit in RCTs for cerebral malaria',
        'Malarial retinopathy confirms cerebral malaria diagnosis',
        'Persistent coma >72 hours = poor prognosis',
      ],
      references: [
        'Idro R et al. Cerebral malaria. Lancet Neurol. 2010',
        'Warrell DA et al. Dexamethasone in cerebral malaria. N Engl J Med. 1982',
        'WHO Guidelines for the Treatment of Malaria, 3rd Edition (2015)',
      ],
    },
    {
      id: 'sm-ii-m2',
      courseId: 'severe-malaria-ii',
      moduleNumber: 2,
      title: 'Malaria-Associated ARDS and Renal Failure',
      content: `
## Malaria-Associated ARDS and Renal Failure

### Malaria-Associated Acute Respiratory Distress Syndrome (MA-ARDS)
**Mechanism:** Cytokine storm + parasitised RBC sequestration in pulmonary microvasculature → capillary leak

**Features:**
- Bilateral infiltrates on CXR
- SpO₂ <92% despite O₂
- No cardiac cause (PCWP <18 mmHg)
- P/F ratio <200

**Management:**
- Lung-protective ventilation (6 mL/kg IBW, PEEP 5–8 cmH₂O)
- Conservative fluid management (avoid fluid overload)
- Prone positioning if P/F <150
- Continue IV artesunate (reduces parasite burden)

**Prognosis:** High mortality (40–80%) when ARDS develops in malaria

### Malaria-Associated Acute Kidney Injury (MA-AKI)
**Mechanism:** Haemolysis → haemoglobinuria → tubular toxicity + reduced renal perfusion

**Features:**
- Oliguria (<0.5 mL/kg/hr)
- Rising creatinine
- Haemoglobinuria (dark urine)

**Management:**
1. Adequate hydration (maintenance + replace losses)
2. Avoid nephrotoxic drugs (NSAIDs, aminoglycosides)
3. Treat haemolysis (artesunate reduces parasitaemia)
4. Dialysis if renal failure persists

### Blackwater Fever
- Massive intravascular haemolysis
- Haemoglobinuria → dark/black urine
- Triggers: quinine, primaquine in G6PD-deficient patients
- Management: stop quinine, switch to artesunate, aggressive hydration
      `,
      learningObjectives: [
        'Recognise and manage malaria-associated ARDS',
        'Diagnose and treat malaria-associated acute kidney injury',
        'Identify blackwater fever and its triggers',
        'Apply lung-protective ventilation for MA-ARDS',
      ],
      keyPoints: [
        'MA-ARDS: lung-protective ventilation + conservative fluids + continue artesunate',
        'MA-AKI: adequate hydration, avoid nephrotoxins, dialysis if needed',
        'Blackwater fever: stop quinine, switch to artesunate, aggressive hydration',
        'MA-ARDS mortality 40–80% — early recognition and ventilation are critical',
      ],
      references: [
        'WHO Guidelines for the Treatment of Malaria, 3rd Edition (2015)',
        'Mohan A et al. Acute respiratory distress syndrome in malaria. Curr Opin Pulm Med. 2008',
        'Barber BE et al. Malaria-associated acute kidney injury. Nat Rev Nephrol. 2017',
      ],
    },
    {
      id: 'sm-ii-m3',
      courseId: 'severe-malaria-ii',
      moduleNumber: 3,
      title: 'Neurological Sequelae and Rehabilitation',
      content: `
## Neurological Sequelae of Cerebral Malaria

### Incidence
- 25% of cerebral malaria survivors have neurological sequelae
- Most common in children under 5 years

### Types of Sequelae
| Sequela | Incidence | Features |
|---------|----------|---------|
| Cognitive impairment | 15–20% | Memory, attention, executive function |
| Epilepsy | 10–15% | Post-malaria epilepsy syndrome (POMES) |
| Language disorders | 5–10% | Expressive and receptive |
| Motor deficits | 5–10% | Hemiplegia, ataxia |
| Behavioural problems | 10–15% | ADHD, aggression |
| Hearing loss | 5% | Sensorineural |

### Post-Malaria Epilepsy Syndrome (POMES)
- Epilepsy developing within 12 months of cerebral malaria
- Risk factors: prolonged coma, multiple seizures, young age
- Treatment: standard antiepileptic drugs (sodium valproate, carbamazepine)
- Prognosis: 50% remission within 2 years

### Neurocognitive Assessment
- Assess at discharge and 3, 6, 12 months
- Tools: Kilifi Developmental Inventory, KABC
- Early identification enables early intervention

### Rehabilitation
- Physiotherapy for motor deficits
- Speech therapy for language disorders
- Educational support for cognitive impairment
- Occupational therapy for activities of daily living
- Family counselling and support

### Prevention of Sequelae
- Rapid treatment reduces coma duration
- Avoid harmful interventions (dexamethasone)
- Prevent and treat hypoglycaemia
- Control seizures promptly
      `,
      learningObjectives: [
        'Describe the types and incidence of neurological sequelae after cerebral malaria',
        'Recognise post-malaria epilepsy syndrome and initiate treatment',
        'Plan neurocognitive follow-up for cerebral malaria survivors',
        'Coordinate rehabilitation services for children with sequelae',
      ],
      keyPoints: [
        '25% of cerebral malaria survivors have neurological sequelae',
        'POMES: epilepsy within 12 months of cerebral malaria — treat with standard AEDs',
        'Follow up at 3, 6, 12 months for neurocognitive assessment',
        'Early treatment reduces coma duration and improves neurological outcomes',
      ],
      references: [
        'Idro R et al. Cerebral malaria. Lancet Neurol. 2010',
        'Bangirana P et al. Neurocognitive outcomes after cerebral malaria. Pediatrics. 2009',
        'Carter JA et al. Neurological, cognitive and behavioural sequelae of cerebral malaria. Pediatrics. 2005',
      ],
    },
  ],
  quiz: {
    id: 'sm-ii-quiz',
    courseId: 'severe-malaria-ii',
    questions: [
      {
        id: 'sm-ii-q1',
        question: 'A child with cerebral malaria has signs of raised ICP (Cushing\'s triad). Which intervention is CONTRAINDICATED?',
        options: [
          'A. Head elevation to 30°',
          'B. Dexamethasone 0.6 mg/kg IV',
          'C. Treating fever with paracetamol',
          'D. Avoiding hypotonic IV fluids',
        ],
        correctAnswer: 'B',
        explanation: 'Dexamethasone is CONTRAINDICATED in cerebral malaria. RCT evidence shows it increases coma duration and GI bleeding without improving survival. This is a critical distinction from bacterial meningitis where dexamethasone is beneficial. Head elevation, fever treatment, and avoiding hypotonic fluids are all appropriate supportive measures.',
      },
      {
        id: 'sm-ii-q2',
        question: 'A child with severe malaria develops dark urine, Hb drops from 8 to 4 g/dL over 6 hours, and was previously on quinine. What is the MOST likely diagnosis and first action?',
        options: [
          'A. Malaria-associated AKI — start dialysis',
          'B. Blackwater fever — stop quinine, switch to artesunate',
          'C. Haemolytic transfusion reaction — stop blood transfusion',
          'D. Sickle cell crisis — exchange transfusion',
        ],
        correctAnswer: 'B',
        explanation: 'Massive haemolysis + dark urine + quinine use = blackwater fever. The trigger (quinine) must be stopped immediately and switched to artesunate. Aggressive IV hydration to protect kidneys. This is not AKI requiring dialysis (yet), not a transfusion reaction, and not sickle cell crisis.',
      },
      {
        id: 'sm-ii-q3',
        question: 'A 3-year-old who survived cerebral malaria 8 months ago now presents with recurrent seizures. His parents report he has been having episodes since discharge. What is the MOST likely diagnosis?',
        options: [
          'A. Recurrent malaria',
          'B. Post-malaria epilepsy syndrome (POMES)',
          'C. Febrile seizures',
          'D. Tuberous sclerosis',
        ],
        correctAnswer: 'B',
        explanation: 'Post-malaria epilepsy syndrome (POMES) is defined as epilepsy developing within 12 months of cerebral malaria. This child fits perfectly: cerebral malaria 8 months ago, now with recurrent seizures. POMES occurs in 10–15% of cerebral malaria survivors. Treatment: standard antiepileptic drugs. 50% achieve remission within 2 years.',
      },
    ],
    passingScore: 80,
  },
  capstone: {
    id: 'sm-ii-capstone',
    courseId: 'severe-malaria-ii',
    title: 'Severe Malaria Complications Capstone',
    description: 'Manage a child with cerebral malaria developing ARDS and AKI',
    caseScenario: `
A 6-year-old boy (20 kg) with cerebral malaria (Blantyre score 2) has been on IV artesunate for 36 hours. His parasitaemia is falling. However, he is now developing new respiratory distress: RR 65, SpO₂ 82% on 10L O₂, bilateral crackles, and CXR shows bilateral infiltrates. Urine output has dropped to 0.2 mL/kg/hr and urine is dark brown. Creatinine is rising.

Your management plan should include:
1. Diagnosis of respiratory complication
2. Respiratory management plan
3. Renal management plan
4. Continuation of antimalarial therapy
5. Prognosis discussion with family
    `,
    scoringRubric: [
      { criterion: 'Correct diagnosis: MA-ARDS + MA-AKI', points: 20 },
      { criterion: 'Respiratory: intubation + lung-protective ventilation (6 mL/kg, PEEP)', points: 30 },
      { criterion: 'Renal: adequate hydration, avoid nephrotoxins, consider dialysis', points: 20 },
      { criterion: 'Continue IV artesunate — do not stop despite complications', points: 15 },
      { criterion: 'Honest prognosis discussion: high mortality with ARDS in malaria', points: 15 },
    ],
  },
};

// ─── Acute Kidney Injury I ─────────────────────────────────────

export const acuteKidneyInjuryICourse: Course = {
  id: 'acute-kidney-injury-i',
  courseId: 'acute-kidney-injury-i',
  title: 'Acute Kidney Injury — Recognition & Management',
  description: 'Evidence-based recognition and management of paediatric acute kidney injury: KDIGO staging, fluid management, electrolyte emergencies, and renal replacement therapy.',
  duration: 90,
  modules: [
    {
      id: 'aki-i-m1',
      courseId: 'acute-kidney-injury-i',
      moduleNumber: 1,
      title: 'KDIGO Staging and Causes of Paediatric AKI',
      content: `
## Paediatric Acute Kidney Injury: KDIGO Staging

### KDIGO Definition
AKI is defined as any of:
- Rise in serum creatinine ≥26.5 μmol/L within 48 hours
- Rise in serum creatinine ≥1.5× baseline within 7 days
- Urine output <0.5 mL/kg/hr for ≥6 hours

### KDIGO Staging
| Stage | Creatinine | Urine Output |
|-------|-----------|-------------|
| 1 | 1.5–1.9× baseline or ≥26.5 μmol/L rise | <0.5 mL/kg/hr for 6–12h |
| 2 | 2.0–2.9× baseline | <0.5 mL/kg/hr for ≥12h |
| 3 | ≥3× baseline or ≥354 μmol/L | <0.3 mL/kg/hr for ≥24h or anuria ≥12h |

### Causes in Children

**Pre-renal (most common — 70%):**
- Hypovolaemia (diarrhoea, haemorrhage, burns)
- Reduced cardiac output (cardiogenic shock)
- Sepsis (distributive)
- Responds to fluid resuscitation

**Intrinsic renal (20%):**
- Acute tubular necrosis (prolonged ischaemia, nephrotoxins)
- Glomerulonephritis (post-streptococcal, IgA)
- Haemolytic uraemic syndrome (HUS)
- Acute interstitial nephritis (drugs)

**Post-renal (10%):**
- Urinary tract obstruction (posterior urethral valves in neonates)
- Bilateral ureteric obstruction (stones, tumour)

### Haemolytic Uraemic Syndrome (HUS)
- Triad: microangiopathic haemolytic anaemia + thrombocytopaenia + AKI
- Most common cause of AKI in children <5 years
- Usually follows STEC (Shiga toxin E. coli) diarrhoea
- Treatment: supportive (dialysis if needed), NO antibiotics (increase toxin release)
      `,
      learningObjectives: [
        'Apply KDIGO criteria to diagnose and stage AKI',
        'Classify AKI as pre-renal, intrinsic, or post-renal',
        'Recognise haemolytic uraemic syndrome and avoid harmful interventions',
        'Identify common causes of AKI in different paediatric age groups',
      ],
      keyPoints: [
        'Pre-renal AKI (70%) responds to fluids — intrinsic AKI does not',
        'HUS triad: microangiopathic anaemia + thrombocytopaenia + AKI',
        'NO antibiotics in HUS — increases Shiga toxin release and worsens outcome',
        'Posterior urethral valves: most common post-renal cause in male neonates',
      ],
      references: [
        'KDIGO Clinical Practice Guideline for Acute Kidney Injury (2012)',
        'Andreoli SP. Acute kidney injury in children. Pediatr Nephrol. 2009',
        'Tarr PI et al. Haemolytic-uraemic syndrome. Lancet. 2005',
      ],
    },
    {
      id: 'aki-i-m2',
      courseId: 'acute-kidney-injury-i',
      moduleNumber: 2,
      title: 'Fluid Management and Electrolyte Emergencies in AKI',
      content: `
## Fluid Management and Electrolyte Emergencies in AKI

### Fluid Management Strategy
**Oliguria workup:**
1. Assess volume status (CVP, echo, clinical)
2. If hypovolaemic: 10–20 mL/kg isotonic crystalloid, reassess
3. If euvolaemic/hypervolaemic: restrict fluids
4. Furosemide challenge (1–2 mg/kg IV) — converts oliguric to non-oliguric AKI
5. If no response to furosemide: intrinsic AKI, fluid restrict

**Fluid restriction in established AKI:**
- Insensible losses (400 mL/m²/day) + urine output + other losses
- Daily weight monitoring
- Fluid overload >10% body weight = indication for dialysis

### Hyperkalaemia Management
| K level | ECG changes | Treatment |
|---------|------------|---------|
| 5.5–6.0 | None | Dietary restriction, kayexalate |
| 6.0–6.5 | Peaked T waves | Calcium gluconate + insulin/dextrose |
| >6.5 | Wide QRS, sine wave | Emergency — all measures + dialysis |

**Emergency hyperkalaemia protocol:**
1. Calcium gluconate 10% 0.5 mL/kg IV over 5 minutes (membrane stabilisation)
2. Sodium bicarbonate 1–2 mmol/kg IV (shifts K into cells)
3. Insulin 0.1 units/kg + 10% dextrose 2 mL/kg (shifts K into cells)
4. Salbutamol nebulised 2.5–5 mg (shifts K into cells)
5. Kayexalate (sodium polystyrene sulphonate) — removes K from body
6. Dialysis — definitive removal

### Metabolic Acidosis
- Common in AKI (reduced acid excretion)
- Treat if pH <7.2 or bicarbonate <12 mmol/L
- Sodium bicarbonate 1–2 mmol/kg IV
- Caution: worsens hypocalcaemia, fluid overload

### Hyponatraemia in AKI
- Usually dilutional (fluid overload)
- Treat with fluid restriction, not sodium supplementation
- If severe (<120 mmol/L): 3% NaCl 2–3 mL/kg
      `,
      learningObjectives: [
        'Manage oliguria with appropriate fluid challenge and restriction',
        'Treat hyperkalaemia using the emergency protocol',
        'Manage metabolic acidosis and hyponatraemia in AKI',
        'Identify indications for dialysis in AKI',
      ],
      keyPoints: [
        'Furosemide challenge: converts oliguric to non-oliguric AKI (easier to manage)',
        'Hyperkalaemia >6.5 with ECG changes: calcium gluconate FIRST (membrane stabilisation)',
        'Fluid overload >10% body weight = dialysis indication',
        'Hyponatraemia in AKI: fluid restriction, not sodium supplementation',
      ],
      references: [
        'KDIGO Clinical Practice Guideline for Acute Kidney Injury (2012)',
        'Weiss SL et al. Surviving Sepsis Campaign International Guidelines for children. Pediatr Crit Care Med. 2020',
        'Andreoli SP. Acute kidney injury in children. Pediatr Nephrol. 2009',
      ],
    },
    {
      id: 'aki-i-m3',
      courseId: 'acute-kidney-injury-i',
      moduleNumber: 3,
      title: 'Renal Replacement Therapy in Children',
      content: `
## Renal Replacement Therapy (RRT) in Paediatric AKI

### Indications for RRT
**Absolute:**
- Severe hyperkalaemia (K >7 mmol/L) not responding to medical management
- Severe metabolic acidosis (pH <7.1) not responding to bicarbonate
- Symptomatic uraemia (encephalopathy, pericarditis)
- Fluid overload >20% body weight with respiratory compromise

**Relative:**
- Fluid overload >10% body weight
- Oliguria/anuria >24 hours
- Rising creatinine despite conservative management

### RRT Modalities in Children

**Peritoneal Dialysis (PD):**
- Preferred in low-resource settings and small children (<10 kg)
- Simple technique, no vascular access required
- Contraindications: recent abdominal surgery, peritonitis
- Complications: peritonitis, catheter leak, inadequate clearance

**Continuous Renal Replacement Therapy (CRRT):**
- Preferred in haemodynamically unstable children
- Continuous veno-venous haemofiltration (CVVH)
- Requires central venous access and anticoagulation
- Better haemodynamic tolerance than intermittent HD

**Intermittent Haemodialysis (IHD):**
- Efficient solute clearance
- Requires haemodynamic stability
- Suitable for older children (>20 kg)

### PD in Resource-Limited Settings
- Improvised PD catheter (Tenckhoff or Foley catheter)
- Dialysate: 1.5% or 4.25% dextrose solution
- Cycle: 30–60 minute dwell time
- Monitor: fluid balance, glucose, peritonitis signs
      `,
      learningObjectives: [
        'Identify absolute and relative indications for RRT in children',
        'Select appropriate RRT modality based on clinical context',
        'Describe peritoneal dialysis technique for resource-limited settings',
        'Monitor and manage complications of RRT',
      ],
      keyPoints: [
        'PD: preferred in low-resource settings and small children (<10 kg)',
        'CRRT: preferred for haemodynamically unstable children',
        'Absolute RRT indication: K >7 mmol/L not responding to medical management',
        'Fluid overload >20% with respiratory compromise = urgent RRT',
      ],
      references: [
        'KDIGO Clinical Practice Guideline for Acute Kidney Injury (2012)',
        'Warady BA et al. Peritoneal dialysis in children. Pediatr Nephrol. 2012',
        'Goldstein SL. Continuous renal replacement therapy in children. Pediatr Nephrol. 2012',
      ],
    },
  ],
  quiz: {
    id: 'aki-i-quiz',
    courseId: 'acute-kidney-injury-i',
    questions: [
      {
        id: 'aki-i-q1',
        question: 'A 4-year-old with bloody diarrhoea develops oliguria, Hb 6 g/dL, platelets 35,000, and creatinine 280 μmol/L. What is the MOST likely diagnosis and which treatment should be AVOIDED?',
        options: [
          'A. Sepsis-associated AKI — avoid antibiotics',
          'B. Haemolytic uraemic syndrome — avoid antibiotics',
          'C. Post-streptococcal glomerulonephritis — avoid steroids',
          'D. Nephrotic syndrome — avoid diuretics',
        ],
        correctAnswer: 'B',
        explanation: 'The triad of microangiopathic haemolytic anaemia (Hb 6 g/dL with fragmented RBCs) + thrombocytopaenia (platelets 35,000) + AKI after bloody diarrhoea = Haemolytic Uraemic Syndrome (HUS) from STEC. Antibiotics are CONTRAINDICATED — they increase Shiga toxin release and worsen HUS. Treatment is supportive: dialysis if needed, blood transfusion for severe anaemia.',
      },
      {
        id: 'aki-i-q2',
        question: 'A child with AKI has K 6.8 mmol/L and ECG shows wide QRS complexes. What is the FIRST intervention?',
        options: [
          'A. Sodium bicarbonate 2 mmol/kg IV',
          'B. Calcium gluconate 10% 0.5 mL/kg IV',
          'C. Insulin 0.1 units/kg + dextrose',
          'D. Kayexalate (sodium polystyrene sulphonate)',
        ],
        correctAnswer: 'B',
        explanation: 'Wide QRS complexes indicate cardiac membrane instability from hyperkalaemia. The FIRST intervention is calcium gluconate — it stabilises the cardiac membrane immediately (within 1–2 minutes) without lowering K. Bicarbonate, insulin/dextrose, and salbutamol shift K into cells (take 15–30 minutes). Kayexalate removes K from the body (takes hours). Calcium gluconate is the immediate life-saving intervention.',
      },
      {
        id: 'aki-i-q3',
        question: 'A 3-year-old with AKI has been oliguric for 30 hours. Weight has increased by 12% from baseline. She is in mild respiratory distress. What is the MOST appropriate intervention?',
        options: [
          'A. Give furosemide 2 mg/kg IV',
          'B. Restrict fluids to insensible losses only',
          'C. Initiate renal replacement therapy',
          'D. Give 10 mL/kg normal saline to improve renal perfusion',
        ],
        correctAnswer: 'C',
        explanation: 'Fluid overload >10% body weight (this child has 12%) with respiratory compromise is an indication for RRT. Furosemide is unlikely to work in established oliguric AKI. Fluid restriction alone will not remove the existing fluid overload. More fluids will worsen the situation. RRT (peritoneal dialysis in this age group) is indicated.',
      },
    ],
    passingScore: 80,
  },
  capstone: {
    id: 'aki-i-capstone',
    courseId: 'acute-kidney-injury-i',
    title: 'Acute Kidney Injury Management Capstone',
    description: 'Manage a child with severe AKI and multiple electrolyte emergencies',
    caseScenario: `
A 5-year-old boy (18 kg) with septic shock has been in PICU for 48 hours. He has received 80 mL/kg of IV fluids. His weight has increased from 18 kg to 20.5 kg. Urine output is 0.1 mL/kg/hr despite furosemide 2 mg/kg. Latest labs: K 6.9 mmol/L (ECG shows peaked T waves), pH 7.12, bicarbonate 8 mmol/L, creatinine 380 μmol/L (baseline 45 μmol/L). He is on HFNC with SpO₂ 91%.

Your management plan should include:
1. Immediate electrolyte emergency management
2. AKI staging and classification
3. Fluid management strategy
4. RRT decision and modality selection
5. Monitoring plan
    `,
    scoringRubric: [
      { criterion: 'Immediate: calcium gluconate for hyperkalaemia with ECG changes', points: 25 },
      { criterion: 'AKI staging: KDIGO Stage 3 (creatinine >3× baseline)', points: 15 },
      { criterion: 'Fluid management: restrict to insensible + UO, no more boluses', points: 20 },
      { criterion: 'RRT indication: fluid overload >10% + respiratory compromise + electrolytes', points: 25 },
      { criterion: 'Monitoring: hourly UO, 4-hourly electrolytes, daily weight', points: 15 },
    ],
  },
};

// ─── Severe Pneumonia ARDS II ─────────────────────────────────

export const severePneumoniaArdsIICourse: Course = {
  id: 'severe-pneumonia-ards-ii',
  courseId: 'severe-pneumonia-ards-ii',
  title: 'Severe Pneumonia & ARDS — Advanced Ventilation & Complications',
  description: 'Advanced management of paediatric ARDS: lung-protective ventilation, prone positioning, HFOV, inhaled nitric oxide, ECMO, and ventilator-associated complications.',
  duration: 90,
  modules: [
    {
      id: 'spa-ii-m1',
      courseId: 'severe-pneumonia-ards-ii',
      moduleNumber: 1,
      title: 'Paediatric ARDS: PALICC Criteria and Ventilation Strategy',
      content: `
## Paediatric ARDS: PALICC Criteria and Lung-Protective Ventilation

### PALICC Definition (2015)
Paediatric ARDS (PARDS) requires:
- Onset within 7 days of known clinical insult
- Respiratory failure not fully explained by cardiac failure
- Chest imaging: new infiltrate(s) consistent with acute pulmonary parenchymal disease
- Oxygenation impairment (OI or OSI thresholds)

### Oxygenation Index (OI) and Severity
**OI = (FiO₂ × MAP × 100) / PaO₂**

| Severity | OI | OSI (SpO₂-based) |
|----------|-----|-----------------|
| Mild | 4–8 | 5–7.5 |
| Moderate | 8–16 | 7.5–12.3 |
| Severe | ≥16 | ≥12.3 |

### Lung-Protective Ventilation (LPV)
**Goals:**
- Tidal volume: 5–7 mL/kg IBW (not actual weight)
- Plateau pressure: <28–32 cmH₂O
- PEEP: 5–15 cmH₂O (titrate to FiO₂ requirement)
- Permissive hypercapnia: PaCO₂ 45–60 mmHg (pH >7.20)
- SpO₂ target: 88–95% (avoid hyperoxia)

### PEEP Titration
- PEEP-FiO₂ table (ARDSNet) or decremental PEEP trial
- Optimal PEEP: best compliance with acceptable oxygenation
- Too little PEEP: atelectrauma, derecruitment
- Too much PEEP: overdistension, reduced cardiac output

### Ventilator Modes
- **Volume-controlled (VC):** Consistent tidal volume, variable pressure
- **Pressure-controlled (PC):** Consistent pressure, variable tidal volume
- **PRVC:** Pressure-regulated volume control — combines benefits
- **HFOV:** High-frequency oscillatory ventilation for refractory ARDS
      `,
      learningObjectives: [
        'Apply PALICC criteria to diagnose and stage PARDS',
        'Calculate oxygenation index and classify ARDS severity',
        'Implement lung-protective ventilation with appropriate targets',
        'Titrate PEEP to optimise oxygenation without overdistension',
      ],
      keyPoints: [
        'LPV: 5–7 mL/kg IBW, plateau pressure <28–32, PEEP 5–15, SpO₂ 88–95%',
        'Permissive hypercapnia (PaCO₂ 45–60) is acceptable — avoid volutrauma',
        'OI ≥16 = severe PARDS — consider rescue therapies',
        'Use IBW (ideal body weight) for tidal volume calculation, not actual weight',
      ],
      references: [
        'PALICC — Pediatric Acute Lung Injury Consensus Conference Group. Pediatr Crit Care Med. 2015',
        'ARDSNet — Ventilation with lower tidal volumes. N Engl J Med. 2000',
        'Khemani RG et al. Paediatric acute respiratory distress syndrome. Lancet. 2019',
      ],
    },
    {
      id: 'spa-ii-m2',
      courseId: 'severe-pneumonia-ards-ii',
      moduleNumber: 2,
      title: 'Rescue Therapies for Refractory ARDS',
      content: `
## Rescue Therapies for Refractory PARDS

### Prone Positioning
**Indications:** OI ≥16 (severe PARDS) or P/F <150 despite optimised conventional ventilation

**Mechanism:**
- Redistributes ventilation to previously dependent (dorsal) lung regions
- Improves V/Q matching
- Reduces ventilator-induced lung injury

**Protocol:**
- Prone for ≥16 hours/day
- Requires dedicated team (minimum 4 people for turning)
- Monitor: pressure areas, ETT position, line security
- Contraindications: unstable spine, open abdomen, raised ICP

**Evidence:** PROSEVA trial (adults) — 28-day mortality reduction from 32.8% to 16%

### High-Frequency Oscillatory Ventilation (HFOV)
**Indications:** Refractory ARDS not responding to conventional LPV

**Settings:**
- Mean airway pressure (MAP): 2–4 cmH₂O above conventional ventilator MAP
- Amplitude (ΔP): titrate to chest wiggle
- Frequency: 6–15 Hz (higher = less tidal volume)
- FiO₂: titrate to SpO₂ 88–95%

**Evidence:** No mortality benefit in RCTs — use as rescue only

### Inhaled Nitric Oxide (iNO)
**Mechanism:** Selective pulmonary vasodilator → improves V/Q matching in ventilated lung regions

**Dose:** 5–20 ppm

**Indications:**
- Severe PARDS with pulmonary hypertension
- Post-cardiac surgery
- Refractory hypoxaemia

**Evidence:** Improves oxygenation but no mortality benefit — use as bridge to ECMO

### ECMO for PARDS
**Indications:**
- OI >40 despite maximal conventional therapy
- Refractory hypoxaemia (P/F <50)
- VV-ECMO for respiratory failure (cardiac function preserved)
- VA-ECMO if cardiac dysfunction present
      `,
      learningObjectives: [
        'Identify indications for prone positioning in severe PARDS',
        'Implement HFOV as rescue therapy for refractory ARDS',
        'Use inhaled nitric oxide appropriately for pulmonary hypertension',
        'Identify ECMO indications for refractory PARDS',
      ],
      keyPoints: [
        'Prone positioning: ≥16 hours/day for severe PARDS (OI ≥16)',
        'HFOV: rescue therapy only — no mortality benefit in RCTs',
        'iNO: improves oxygenation, no mortality benefit — bridge to ECMO',
        'VV-ECMO for respiratory failure with preserved cardiac function',
      ],
      references: [
        'PROSEVA Trial — Guérin C et al. N Engl J Med. 2013',
        'PALICC — Pediatric Acute Lung Injury Consensus Conference Group. Pediatr Crit Care Med. 2015',
        'Bhatt JM et al. Inhaled nitric oxide in children. Arch Dis Child. 2019',
      ],
    },
    {
      id: 'spa-ii-m3',
      courseId: 'severe-pneumonia-ards-ii',
      moduleNumber: 3,
      title: 'Ventilator-Associated Complications and Weaning',
      content: `
## Ventilator-Associated Complications and Weaning

### Ventilator-Associated Pneumonia (VAP)
**Definition:** Pneumonia developing ≥48 hours after intubation

**Prevention (VAP Bundle):**
- Head-of-bed elevation 30–45°
- Oral care with chlorhexidine 0.12% twice daily
- Subglottic secretion drainage
- Minimise sedation (daily sedation breaks)
- Spontaneous breathing trials (SBTs) daily
- Avoid unnecessary circuit changes

**Treatment:** Broad-spectrum antibiotics guided by local resistance patterns (piperacillin-tazobactam ± aminoglycoside)

### Ventilator-Induced Lung Injury (VILI)
**Mechanisms:**
- **Volutrauma:** Overdistension from high tidal volumes
- **Barotrauma:** High pressures → pneumothorax, pneumomediastinum
- **Atelectrauma:** Repeated opening/closing of alveoli
- **Biotrauma:** Inflammatory mediator release

**Prevention:** Lung-protective ventilation (see Module 1)

### Pneumothorax
- Complication of barotrauma
- Signs: sudden deterioration, decreased breath sounds, tracheal deviation
- Tension pneumothorax: immediate needle decompression (2nd ICS, MCL)
- Confirm with CXR, then chest drain

### Weaning from Mechanical Ventilation
**Readiness criteria:**
- Underlying cause improving
- FiO₂ ≤0.4, PEEP ≤5 cmH₂O
- Haemodynamically stable
- Adequate cough and airway reflexes
- Minimal sedation

**Spontaneous Breathing Trial (SBT):**
- CPAP 5 cmH₂O or T-piece for 30–120 minutes
- Pass: RR <30, SpO₂ >95%, no distress
- Fail: tachypnoea, desaturation, distress → return to full support

**Post-extubation:**
- High-flow nasal cannula (HFNC) reduces reintubation rates
- CPAP/BiPAP for post-extubation respiratory failure
      `,
      learningObjectives: [
        'Implement VAP bundle to prevent ventilator-associated pneumonia',
        'Recognise and manage tension pneumothorax in ventilated patients',
        'Assess readiness for weaning using standardised criteria',
        'Conduct spontaneous breathing trials safely',
      ],
      keyPoints: [
        'VAP bundle: head elevation + oral chlorhexidine + daily sedation breaks + SBTs',
        'Tension pneumothorax: immediate needle decompression — do not wait for CXR',
        'SBT: CPAP 5 cmH₂O for 30–120 minutes — pass criteria: RR <30, SpO₂ >95%',
        'HFNC post-extubation reduces reintubation rates in high-risk patients',
      ],
      references: [
        'PALICC — Pediatric Acute Lung Injury Consensus Conference Group. Pediatr Crit Care Med. 2015',
        'Khemani RG et al. Paediatric acute respiratory distress syndrome. Lancet. 2019',
        'Pediatric Ventilator Liberation Guidelines. Pediatr Crit Care Med. 2020',
      ],
    },
  ],
  quiz: {
    id: 'spa-ii-quiz',
    courseId: 'severe-pneumonia-ards-ii',
    questions: [
      {
        id: 'spa-ii-q1',
        question: 'A 4-year-old on mechanical ventilation has OI of 20 despite FiO₂ 0.8 and PEEP 12. What is the MOST appropriate rescue intervention?',
        options: [
          'A. Increase PEEP to 20 cmH₂O',
          'B. Prone positioning for ≥16 hours/day',
          'C. Start inhaled nitric oxide 40 ppm',
          'D. Increase tidal volume to 10 mL/kg',
        ],
        correctAnswer: 'B',
        explanation: 'OI ≥16 = severe PARDS. Prone positioning is the first rescue therapy with the strongest evidence (PROSEVA trial). It should be maintained for ≥16 hours/day. Increasing PEEP to 20 may cause overdistension. iNO at 40 ppm is above recommended dose (5–20 ppm) and has no mortality benefit. Increasing tidal volume violates lung-protective ventilation principles.',
      },
      {
        id: 'spa-ii-q2',
        question: 'A ventilated child suddenly deteriorates with SpO₂ dropping to 70%, absent breath sounds on the right, and tracheal deviation to the left. What is the MOST URGENT action?',
        options: [
          'A. Obtain urgent CXR',
          'B. Increase FiO₂ to 1.0',
          'C. Needle decompression at right 2nd ICS, MCL',
          'D. Suction endotracheal tube',
        ],
        correctAnswer: 'C',
        explanation: 'Sudden deterioration + absent breath sounds + tracheal deviation = tension pneumothorax. This is a clinical diagnosis requiring IMMEDIATE needle decompression. Do NOT wait for CXR — the patient will die. Insert large-bore needle at 2nd intercostal space, midclavicular line. Follow with chest drain after stabilisation.',
      },
      {
        id: 'spa-ii-q3',
        question: 'A child has been ventilated for 8 days for ARDS. Today: FiO₂ 0.35, PEEP 5, haemodynamically stable, responsive, coughing on ETT. What is the MOST appropriate next step?',
        options: [
          'A. Continue current ventilator settings for 2 more days',
          'B. Perform a spontaneous breathing trial (SBT)',
          'C. Extubate immediately without SBT',
          'D. Switch to HFOV for weaning',
        ],
        correctAnswer: 'B',
        explanation: 'This child meets weaning readiness criteria: FiO₂ ≤0.4, PEEP ≤5, haemodynamically stable, adequate cough. The next step is a spontaneous breathing trial (SBT) — CPAP 5 cmH₂O or T-piece for 30–120 minutes. If passed, proceed to extubation. Extubating without SBT risks reintubation. HFOV is not a weaning mode.',
      },
    ],
    passingScore: 80,
  },
  capstone: {
    id: 'spa-ii-capstone',
    courseId: 'severe-pneumonia-ards-ii',
    title: 'Advanced ARDS Management Capstone',
    description: 'Manage a child with severe PARDS requiring rescue therapies',
    caseScenario: `
A 7-year-old girl (22 kg) with influenza-associated ARDS has been ventilated for 5 days. Current settings: FiO₂ 0.85, PEEP 14, tidal volume 6 mL/kg IBW, rate 30. OI is 22. PaCO₂ is 58 mmHg. She has bilateral infiltrates on CXR. She is sedated and paralysed. Temperature 38.2°C. Today's ETT secretions are purulent and green.

Your management plan should include:
1. ARDS severity assessment and rescue therapy decision
2. Ventilation optimisation
3. VAP workup and management
4. Prone positioning plan
5. Escalation criteria for ECMO
    `,
    scoringRubric: [
      { criterion: 'Severe PARDS (OI 22) — prone positioning indicated', points: 25 },
      { criterion: 'Ventilation: maintain LPV targets, permissive hypercapnia acceptable', points: 20 },
      { criterion: 'VAP: cultures + broad-spectrum antibiotics + VAP bundle review', points: 20 },
      { criterion: 'Prone positioning: ≥16 hours/day, team preparation, safety checklist', points: 20 },
      { criterion: 'ECMO criteria: OI >40 despite prone + optimised conventional ventilation', points: 15 },
    ],
  },
};
