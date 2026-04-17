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
