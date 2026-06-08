/**
 * Enriched BLS Provider Course Data (AHA 2025 Guidelines)
 * Focused on healthcare-provider level depth with detailed sections.
 */

export interface BLSModule {
  title: string;
  description: string;
  duration: number;
  order: number;
  content?: string; // Fallback content
  sections: {
    title: string;
    content: string;
    order: number;
  }[];
  quiz: {
    title: string;
    passingScore: number;
    questions: {
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
    }[];
  };
}

export const BLS_MODULES: BLSModule[] = [
  {
    title: "Module 1: Course Introduction & The Chain of Survival",
    description: "Overview of the BLS course and the 2025 updates to the Chain of Survival.",
    duration: 20,
    order: 1,
    sections: [
      {
        title: "The 2025 Chain of Survival",
        content: `
          <p>The AHA 2025 Guidelines emphasize the importance of the <strong>Recovery</strong> link in the Chain of Survival, highlighting that care does not end at hospital discharge.</p>
          <ul>
            <li><strong>In-Hospital (IHCA):</strong> Early Recognition → Activation → High-Quality CPR → Defibrillation → Post-Cardiac Arrest Care → Recovery.</li>
            <li><strong>Out-of-Hospital (OHCA):</strong> Activation → High-Quality CPR → Defibrillation → Advanced Resuscitation → Post-Cardiac Arrest Care → Recovery.</li>
          </ul>
        `,
        order: 1,
      },
      {
        title: "Personal Safety & PPE",
        content: `
          <p>Rescuer safety is paramount. Always assess the scene for hazards before approaching. Use appropriate Personal Protective Equipment (PPE), including gloves and pocket masks/BVMs with filters, especially in the context of respiratory pathogens.</p>
        `,
        order: 2,
      },
    ],
    quiz: {
      title: "Module 1 Quiz",
      passingScore: 100,
      questions: [
        {
          question: "What is the newest link in the AHA Chain of Survival?",
          options: ["Defibrillation", "High-Quality CPR", "Recovery", "Early Recognition"],
          correctAnswer: "Recovery",
          explanation: "The Recovery link was added to emphasize long-term support for survivors.",
        },
      ],
    },
  },
  {
    title: "Module 2: Adult BLS — High-Quality CPR & AED",
    description: "Mastering the fundamentals of adult resuscitation and automated external defibrillation.",
    duration: 45,
    order: 2,
    sections: [
      {
        title: "Recognition of Cardiac Arrest",
        content: `
          <p>Check for responsiveness and simultaneous breathing and pulse for at least 5 but no more than 10 seconds.</p>
          <ul>
            <li><strong>Breathing:</strong> Look for no breathing or only gasping (agonal gasps).</li>
            <li><strong>Pulse:</strong> Check the carotid pulse.</li>
          </ul>
        `,
        order: 1,
      },
      {
        title: "High-Quality Chest Compressions",
        content: `
          <p>For adults, compressions must be:</p>
          <ul>
            <li><strong>Rate:</strong> 100–120 per minute.</li>
            <li><strong>Depth:</strong> 2 to 2.4 inches (5 to 6 cm).</li>
            <li><strong>Recoil:</strong> Allow full chest recoil; do not lean on the chest.</li>
            <li><strong>Minimize Interruptions:</strong> Keep pauses to <10 seconds.</li>
          </ul>
        `,
        order: 2,
      },
      {
        title: "AED Operation & Troubleshooting",
        content: `
          <p>Power on the AED and follow the voice prompts immediately. Attach pads to a bare chest. Clear the patient for analysis and shock delivery.</p>
          <p><strong>Special Situations:</strong> Shave excessive chest hair, dry a wet chest, and avoid placing pads directly over implanted devices.</p>
        `,
        order: 3,
      },
    ],
    quiz: {
      title: "Module 2 Quiz",
      passingScore: 80,
      questions: [
        {
          question: "What is the recommended compression depth for an adult?",
          options: ["1 to 1.5 inches", "At least 2 inches (5 cm) but not more than 2.4 inches (6 cm)", "At least 3 inches", "1.5 to 2 inches"],
          correctAnswer: "At least 2 inches (5 cm) but not more than 2.4 inches (6 cm)",
          explanation: "AHA guidelines specify 2–2.4 inches for adults to optimize blood flow without causing excessive injury.",
        },
      ],
    },
  },
  {
    title: "Module 3: Pediatric BLS (Infant & Child)",
    description: "Specific techniques for resuscitating infants and children, emphasizing the respiratory etiology.",
    duration: 45,
    order: 3,
    sections: [
      {
        title: "Pediatric Pulse Checks",
        content: `
          <ul>
            <li><strong>Infant (<1 year):</strong> Brachial pulse.</li>
            <li><strong>Child (1 year to puberty):</strong> Carotid or femoral pulse.</li>
          </ul>
          <p>If the pulse is ≤60 bpm with signs of poor perfusion despite oxygenation/ventilation, start CPR.</p>
        `,
        order: 1,
      },
      {
        title: "Pediatric Compression Techniques",
        content: `
          <ul>
            <li><strong>Infant:</strong> 2 fingers (1 rescuer) or 2-thumb-encircling hands (2 rescuers). Depth: 1.5 inches (4 cm).</li>
            <li><strong>Child:</strong> 1 or 2 hands. Depth: 2 inches (5 cm).</li>
          </ul>
        `,
        order: 2,
      },
      {
        title: "Ventilation Ratios",
        content: `
          <ul>
            <li><strong>1 Rescuer:</strong> 30:2 ratio for all ages.</li>
            <li><strong>2 Rescuers (Pediatric):</strong> 15:2 ratio.</li>
          </ul>
        `,
        order: 3,
      },
    ],
    quiz: {
      title: "Module 3 Quiz",
      passingScore: 80,
      questions: [
        {
          question: "What is the compression-to-ventilation ratio for 2-rescuer infant CPR?",
          options: ["30:2", "15:2", "15:1", "5:1"],
          correctAnswer: "15:2",
          explanation: "In pediatric 2-rescuer BLS, the ratio is 15:2 to provide more frequent ventilations.",
        },
      ],
    },
  },
  {
    title: "Module 4: Multi-Rescuer Coordination & Team Dynamics",
    description: "Operating effectively in a high-performance team environment.",
    duration: 30,
    order: 4,
    sections: [
      {
        title: "High-Performance Team Roles",
        content: `
          <p>Effective teams have clear roles: Team Leader, Compressor, Airway, AED/Monitor, Recorder, and IV/IO/Meds.</p>
        `,
        order: 1,
      },
      {
        title: "Closed-Loop Communication",
        content: `
          <p>The Team Leader gives a clear order. The team member confirms the order verbally and announces when the task is complete.</p>
        `,
        order: 2,
      },
    ],
    quiz: {
      title: "Module 4 Quiz",
      passingScore: 100,
      questions: [
        {
          question: "How often should compressors switch roles?",
          options: ["Every 5 minutes", "Every 2 minutes or 5 cycles", "When they feel tired", "Every 10 minutes"],
          correctAnswer: "Every 2 minutes or 5 cycles",
          explanation: "Compressors should switch every 2 minutes to maintain high-quality compressions.",
        },
      ],
    },
  },
  {
    title: "Module 5: Airway Management & Special Ventilation Techniques",
    description: "Advanced airway CPR and rescue breathing techniques.",
    duration: 40,
    order: 5,
    sections: [
      {
        title: "Rescue Breathing",
        content: `
          <p>If the patient has a pulse but is not breathing normally:</p>
          <ul>
            <li><strong>Adult:</strong> 1 breath every 6 seconds (10 breaths/min).</li>
            <li><strong>Pediatric:</strong> 1 breath every 2–3 seconds (20–30 breaths/min).</li>
          </ul>
        `,
        order: 1,
      },
      {
        title: "CPR with an Advanced Airway",
        content: `
          <p>Once an advanced airway (ETT, Supraglottic) is in place:</p>
          <ul>
            <li><strong>Compressions:</strong> Continuous at 100–120/min.</li>
            <li><strong>Ventilations:</strong> 1 breath every 6 seconds (Adult) or 2–3 seconds (Pediatric).</li>
          </ul>
        `,
        order: 2,
      },
    ],
    quiz: {
      title: "Module 5 Quiz",
      passingScore: 80,
      questions: [
        {
          question: "With an advanced airway in place during adult CPR, what is the ventilation rate?",
          options: ["1 breath every 6 seconds", "1 breath every 10 seconds", "2 breaths every 30 compressions", "1 breath every 3 seconds"],
          correctAnswer: "1 breath every 6 seconds",
          explanation: "For adults with an advanced airway, ventilations are delivered asynchronously at 10 breaths per minute.",
        },
      ],
    },
  },
  {
    title: "Module 6: Special Circumstances",
    description: "Managing resuscitation in unique environments and conditions.",
    duration: 40,
    order: 6,
    sections: [
      {
        title: "Opioid-Associated Emergencies",
        content: `
          <p>For a suspected opioid overdose: Assess for breathing and pulse. If in respiratory arrest, provide rescue breathing and administer naloxone. If in cardiac arrest, start CPR and AED use immediately.</p>
        `,
        order: 1,
      },
      {
        title: "Drowning & Pregnancy",
        content: `
          <ul>
            <li><strong>Drowning:</strong> Start with ventilations before compressions.</li>
            <li><strong>Pregnancy:</strong> Perform manual left uterine displacement (LUD) to relieve aortocaval compression during CPR.</li>
          </ul>
        `,
        order: 2,
      },
    ],
    quiz: {
      title: "Module 6 Quiz",
      passingScore: 80,
      questions: [
        {
          question: "What maneuver should be performed for a pregnant patient in cardiac arrest?",
          options: ["Place her in a left lateral tilt", "Manual left uterine displacement (LUD)", "Elevate her legs", "Apply pressure to the abdomen"],
          correctAnswer: "Manual left uterine displacement (LUD)",
          explanation: "LUD is preferred over lateral tilt to keep the patient supine for high-quality compressions.",
        },
      ],
    },
  },
];
