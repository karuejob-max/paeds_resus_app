/**
 * Enriched BLS Provider Course Data (AHA 2025 Guidelines)
 * This course merges the accessibility of Heartsaver with the clinical rigor of BLS Provider.
 * Unified 2025 Chain of Survival integrated throughout.
 */

export interface BLSModule {
  title: string;
  description: string;
  duration: number;
  order: number;
  content?: string;
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
    title: "Module 1: Foundations & The Unified Chain of Survival",
    description: "Introduction to the 2025 Unified Chain of Survival, personal safety, and scene assessment.",
    duration: 30,
    order: 1,
    sections: [
      {
        title: "The Unified 2025 Chain of Survival",
        content: `<h2>The Unified Framework</h2>
<p>The AHA 2025 Guidelines introduce a <strong>single, unified Chain of Survival</strong> that applies across all ages and settings (Adult, Pediatric, In-Hospital, and Out-of-Hospital).</p>
<ol>
  <li><strong>Activation of Emergency Response:</strong> Immediate recognition and calling for help (911).</li>
  <li><strong>High-Quality CPR:</strong> Early chest compressions to maintain vital organ perfusion.</li>
  <li><strong>Rapid Defibrillation:</strong> Early use of AED or manual defibrillator to treat shockable rhythms.</li>
  <li><strong>Advanced Resuscitation:</strong> High-performance team interventions, medications, and advanced airway.</li>
  <li><strong>Post-Cardiac Arrest Care (PCAC):</strong> Integrated hospital care focusing on neuro-protection (fever prevention).</li>
  <li><strong>Recovery:</strong> Long-term rehabilitation, psychological support, and survivorship.</li>
</ol>`,
        order: 1,
      }
    ],
    quiz: {
      title: "Module 1 Quiz",
      passingScore: 100,
      questions: [
        {
          question: "Which statement best describes the 2025 AHA Chain of Survival?",
          options: ["Separate chains for IHCA and OHCA", "Adult and Pediatric chains remain distinct", "A single, unified chain applies to all ages and settings", "The chain no longer includes the Recovery link"],
          correctAnswer: "A single, unified chain applies to all ages and settings",
          explanation: "The 2025 guidelines unified the chain to simplify the framework and emphasize consistent high-quality care across all scenarios.",
        }
      ],
    },
  },
  {
    title: "Module 2: Adult CPR, AED & Healthcare Provider Depth",
    description: "Healthcare-provider level recognition and execution of adult CPR and AED use.",
    duration: 50,
    order: 2,
    sections: [
      {
        title: "Recognition & Pulse Check",
        content: `<h2>Healthcare Provider Assessment</h2>
<p>Healthcare providers must perform a simultaneous check for responsiveness, breathing, and pulse in <strong>no more than 10 seconds</strong>.</p>
<ul>
  <li><strong>Pulse Check (Adult):</strong> Locate the carotid pulse in the neck. Feel for at least 5 but no more than 10 seconds.</li>
</ul>`,
        order: 1,
      }
    ],
    quiz: {
      title: "Module 2 Quiz",
      passingScore: 80,
      questions: [
        {
          question: "How long should a healthcare provider check for a pulse in an unresponsive adult?",
          options: ["At least 5 but no more than 10 seconds", "Exactly 15 seconds", "No more than 5 seconds", "Lay rescuers and HCPs do not check pulses"],
          correctAnswer: "At least 5 but no more than 10 seconds",
          explanation: "Healthcare providers must check for a pulse for at least 5 but no more than 10 seconds to avoid delaying compressions.",
        }
      ],
    },
  },
  {
    title: "Module 3: Choking Relief (Adult, Child, Infant)",
    description: "2025 Guidelines for choking management using the 5 and 5 approach.",
    duration: 30,
    order: 3,
    sections: [
      {
        title: "The 5 and 5 Approach",
        content: `<h2>5 Back Blows, 5 Thrusts</h2>
<p>The 2025 Guidelines emphasize the 5 and 5 approach for choking victims who cannot breathe or cough:</p>
<ol>
  <li>Give 5 firm back blows between the shoulder blades.</li>
  <li>Give 5 abdominal thrusts (Heimlich maneuver).</li>
  <li>Repeat until the object comes out or the victim passes out.</li>
</ol>`,
        order: 1,
      }
    ],
    quiz: {
      title: "Module 3 Quiz",
      passingScore: 100,
      questions: [
        {
          question: "What is the correct sequence for a choking victim according to 2025 guidelines?",
          options: ["10 abdominal thrusts", "5 back blows and 5 abdominal thrusts", "Just start CPR", "Wait for the victim to pass out"],
          correctAnswer: "5 back blows and 5 abdominal thrusts",
          explanation: "The 2025 guidelines emphasize the combination of 5 back blows followed by 5 abdominal thrusts.",
        }
      ],
    },
  },
  {
    title: "Module 4: Pediatric BLS (Infant & Child)",
    description: "Resuscitation for infants and children with a focus on respiratory etiology.",
    duration: 50,
    order: 4,
    sections: [
      {
        title: "Pediatric Ratios",
        content: `<h2>15:2 for 2-Rescuers</h2>
<p>For healthcare providers, the 2-rescuer ratio for children and infants is 15:2 to provide more frequent ventilations.</p>`,
        order: 1,
      }
    ],
    quiz: {
      title: "Module 4 Quiz",
      passingScore: 80,
      questions: [
        {
          question: "What is the 2-rescuer compression-to-ventilation ratio for a child?",
          options: ["30:2", "15:2", "15:1", "5:1"],
          correctAnswer: "15:2",
          explanation: "15:2 is the healthcare provider standard for 2-rescuer pediatric BLS.",
        }
      ],
    },
  },
  {
    title: "Module 5: First Aid - Epi-pen & Bleeding Control",
    description: "Merging Heartsaver First Aid into the BLS Provider course.",
    duration: 40,
    order: 5,
    sections: [
      {
        title: "Epi-pen & Allergic Reactions",
        content: `<h2>Emergency Medication Administration</h2>
<p>Healthcare providers should be proficient in using auto-injectors as well as drawing up epinephrine for IM injection if protocols allow.</p>`,
        order: 1,
      }
    ],
    quiz: {
      title: "Module 5 Quiz",
      passingScore: 100,
      questions: [
        {
          question: "Where is the preferred site for an epinephrine injection for anaphylaxis?",
          options: ["The arm (Deltoid)", "The outer thigh (Vastus Lateralis)", "The stomach", "The buttocks"],
          correctAnswer: "The outer thigh (Vastus Lateralis)",
          explanation: "The outer thigh provides the most reliable absorption for epinephrine in anaphylaxis.",
        }
      ],
    },
  },
  {
    title: "Module 6: Team Dynamics & Multi-Rescuer Coordination",
    description: "Operating in a high-performance team to maximize survival.",
    duration: 40,
    order: 6,
    sections: [
      {
        title: "High-Performance Team Roles",
        content: `<h2>The 2-Minute Switch</h2>
<p>Compressors should switch roles every 2 minutes (or 5 cycles) to prevent fatigue and maintain compression quality.</p>`,
        order: 1,
      }
    ],
    quiz: {
      title: "Module 6 Quiz",
      passingScore: 100,
      questions: [
        {
          question: "How often should compressors switch roles in a multi-rescuer team?",
          options: ["Every 1 minute", "Every 2 minutes or 5 cycles", "Every 5 minutes", "Only when they feel tired"],
          correctAnswer: "Every 2 minutes or 5 cycles",
          explanation: "Regular rotation every 2 minutes prevents fatigue-related drops in quality.",
        }
      ],
    },
  },
  {
    title: "Module 7: Airway Management & Special Situations",
    description: "Advanced techniques and resuscitation in unique environments.",
    duration: 50,
    order: 7,
    sections: [
      {
        title: "Advanced Airway CPR",
        content: `<h2>Continuous Compressions</h2>
<p>Once an advanced airway is in place, compressions are performed continuously at 100-120/min without pauses for breaths.</p>`,
        order: 1,
      }
    ],
    quiz: {
      title: "Module 7 Quiz",
      passingScore: 100,
      questions: [
        {
          question: "What is the compression technique once an advanced airway is in place?",
          options: ["Continue 30:2 cycles", "Switch to 15:2 cycles", "Continuous compressions without pauses for breaths", "Stop compressions for 10 seconds for each breath"],
          correctAnswer: "Continuous compressions without pauses for breaths",
          explanation: "Continuous compressions maximize coronary perfusion once the airway is secured.",
        }
      ],
    },
  },
];
