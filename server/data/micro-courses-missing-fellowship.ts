/**
 * Micro-Courses Data: Missing Fellowship Courses (Asthma I, Status Epilepticus I, DKA I Advanced, Meningitis I & II, Trauma I & II)
 * Clinical content generated to match the PaedsResusGPS standards for bedside reliability.
 */

export const microCoursesMissingFellowship = [
  {
    id: 'asthma-i',
    title: 'Paediatric Asthma I: Recognition and First-Hour Stabilization',
    level: 'beginner',
    duration: 45,
    price: 800,
    description: 'Recognize acute asthma severity and implement first-line bronchodilator therapy.',
    modules: [
      {
        title: 'Module 1: Asthma Severity Assessment',
        duration: 15,
        content: `
          <h2>Acute Asthma Recognition</h2>
          <h3>Clinical Features:</h3>
          <ul>
            <li>Wheezing (expiratory), cough, chest tightness</li>
            <li>Increased work of breathing (recessions, nasal flaring)</li>
            <li>Prolonged expiratory phase</li>
          </ul>
          <h3>Severity Classification:</h3>
          <ul>
            <li><strong>Mild:</strong> Able to speak in sentences, SpO2 >94%, mild wheeze.</li>
            <li><strong>Moderate:</strong> Speaking in phrases, SpO2 90-94%, accessory muscle use.</li>
            <li><strong>Severe:</strong> Speaking in single words, SpO2 <90%, marked recessions, agitated.</li>
            <li><strong>Life-threatening:</strong> Silent chest, cyanosis, exhaustion, altered consciousness.</li>
          </ul>
        `
      },
      {
        title: 'Module 2: First-Hour Management',
        duration: 20,
        content: `
          <h2>First-Hour Protocol</h2>
          <h3>Oxygen:</h3>
          <ul>
            <li>Target SpO2 94-98%. Use high-flow if life-threatening.</li>
          </ul>
          <h3>Bronchodilators:</h3>
          <ul>
            <li><strong>Salbutamol:</strong> 2.5-5mg via nebulizer OR 6-10 puffs via spacer every 20 mins.</li>
            <li><strong>Ipratropium Bromide:</strong> 250-500mcg nebulized every 20 mins for the first hour in severe cases.</li>
          </ul>
          <h3>Corticosteroids:</h3>
          <ul>
            <li><strong>Prednisolone:</strong> 1-2mg/kg (max 40mg) PO OR Hydrocortisone 4mg/kg IV.</li>
          </ul>
        `
      }
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
        }
      ]
    }
  },
  {
    id: 'status-epilepticus-i',
    title: 'Paediatric Status Epilepticus I: Emergency Seizure Control',
    level: 'beginner',
    duration: 45,
    price: 800,
    description: 'Immediate management of the convulsing child and stabilization techniques.',
    modules: [
      {
        title: 'Module 1: Definition and Initial ABCs',
        duration: 15,
        content: `
          <h2>Status Epilepticus Definition</h2>
          <p>Continuous seizure activity for >5 minutes OR recurrent seizures without recovery of consciousness.</p>
          <h3>Initial Steps (0-5 mins):</h3>
          <ul>
            <li>Airway: Position (recovery), suction, oral airway if needed.</li>
            <li>Breathing: High-flow oxygen.</li>
            <li>Circulation: Check bedside glucose (exclude hypoglycemia).</li>
          </ul>
        `
      },
      {
        title: 'Module 2: Pharmacological Control',
        duration: 20,
        content: `
          <h2>First-Line Benzodiazepines</h2>
          <ul>
            <li><strong>Diazepam:</strong> 0.2-0.5mg/kg IV OR 0.5mg/kg PR.</li>
            <li><strong>Midazolam:</strong> 0.1-0.2mg/kg IV/IM OR 0.3mg/kg Buccal.</li>
            <li><strong>Lorazepam:</strong> 0.1mg/kg IV (preferred if available).</li>
          </ul>
          <p>Repeat once after 5 mins if seizure continues.</p>
        `
      }
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
        }
      ]
    }
  },
  {
    id: 'dka-i-advanced',
    title: 'Paediatric DKA I (Advanced): Complicated Metabolic Management',
    level: 'advanced',
    duration: 60,
    price: 1200,
    description: 'Advanced management of DKA with focus on cerebral edema and potassium shifts.',
    modules: [
      {
        title: 'Module 1: Cerebral Edema Monitoring',
        duration: 20,
        content: `
          <h2>Cerebral Edema in DKA</h2>
          <p>The leading cause of mortality in paediatric DKA.</p>
          <h3>Warning Signs:</h3>
          <ul>
            <li>Slowing heart rate (Bradycardia).</li>
            <li>Rising blood pressure.</li>
            <li>Headache or irritability.</li>
            <li>Decreasing GCS.</li>
          </ul>
        `
      }
    ],
    quiz: {
      title: 'DKA Advanced Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'What is the most feared complication of DKA treatment?',
          options: ['Hypoglycemia', 'Cerebral Edema', 'Infection', 'Vomiting'],
          correct: 1,
          explanation: 'Cerebral edema is the primary cause of DKA-related death in children.'
        }
      ]
    }
  },
  {
    id: 'meningitis-i',
    title: 'Paediatric Meningitis I: Recognition and Early Antibiotics',
    level: 'beginner',
    duration: 45,
    price: 800,
    description: 'Identify clinical signs of meningitis and implement life-saving empiric therapy.',
    modules: [
      {
        title: 'Module 1: Clinical Presentation',
        duration: 20,
        content: `
          <h2>Meningitis Signs</h2>
          <ul>
            <li>Infants: Bulging fontanelle, irritability, poor feeding, fever.</li>
            <li>Older children: Neck stiffness, photophobia, headache, Kernig/Brudzinski signs.</li>
            <li><strong>Non-blanching rash:</strong> Suggests meningococcal septicaemia.</li>
          </ul>
        `
      }
    ],
    quiz: {
      title: 'Meningitis I Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'A bulging fontanelle in a febrile infant suggests:',
          options: ['Dehydration', 'Meningitis', 'Normal growth', 'Teething'],
          correct: 1,
          explanation: 'Increased intracranial pressure from meningitis often causes a bulging fontanelle.'
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
    description: 'Managing increased intracranial pressure and long-term sequelae.',
    modules: [
      {
        title: 'Module 1: ICP Management',
        duration: 25,
        content: `
          <h2>Managing Intracranial Pressure</h2>
          <ul>
            <li>Head elevation (30 degrees).</li>
            <li>Maintain neutral head position.</li>
            <li>Consider Mannitol or Hypertonic Saline if herniation suspected.</li>
          </ul>
        `
      }
    ],
    quiz: {
      title: 'Meningitis II Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Positioning for a child with suspected high ICP:',
          options: ['Flat on back', 'Head elevated 30 degrees', 'Prone', 'Left lateral'],
          correct: 1,
          explanation: '30-degree elevation helps venous drainage and reduces ICP.'
        }
      ]
    }
  },
  {
    id: 'trauma-i',
    title: 'Paediatric Trauma I: Primary Survey and Stabilization',
    level: 'beginner',
    duration: 45,
    price: 800,
    description: 'The <ABCDE> approach to the injured child.',
    modules: [
      {
        title: 'Module 1: Primary Survey',
        duration: 20,
        content: `
          <h2>The ABCDE Approach</h2>
          <ul>
            <li><strong>A:</strong> Airway with C-spine protection.</li>
            <li><strong>B:</strong> Breathing and Ventilation.</li>
            <li><strong>C:</strong> Circulation with hemorrhage control.</li>
            <li><strong>D:</strong> Disability (Neurological status).</li>
            <li><strong>E:</strong> Exposure and Environment.</li>
          </ul>
        `
      }
    ],
    quiz: {
      title: 'Trauma I Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'What is the priority in airway management for trauma?',
          options: ['Intubation', 'C-spine stabilization', 'Suctioning', 'Oxygen'],
          correct: 1,
          explanation: 'Airway must always be managed with simultaneous C-spine protection in trauma.'
        }
      ]
    }
  },
  {
    id: 'trauma-ii',
    title: 'Paediatric Trauma II: Specific Injuries and Definitive Care',
    level: 'advanced',
    duration: 60,
    price: 1200,
    description: 'Managing head, thoracic, and abdominal trauma in children.',
    modules: [
      {
        title: 'Module 1: Abdominal Trauma',
        duration: 25,
        content: `
          <h2>Blunt Abdominal Trauma</h2>
          <p>Children have less abdominal wall fat and larger solid organs, increasing injury risk.</p>
          <ul>
            <li>Liver and Spleen: Most commonly injured organs.</li>
            <li>Management: Conservative (non-operative) if stable; surgery if refractory shock.</li>
          </ul>
        `
      }
    ],
    quiz: {
      title: 'Trauma II Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Which organ is most commonly injured in blunt paediatric trauma?',
          options: ['Stomach', 'Spleen/Liver', 'Bladder', 'Intestines'],
          correct: 1,
          explanation: 'Solid organs like the spleen and liver are most vulnerable in children.'
        }
      ]
    }
  }
];
