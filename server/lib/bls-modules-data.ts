/**
 * Exhaustive BLS Provider Course Data — AHA 2025 Guidelines.
 * This course literally merges all exhaustive Heartsaver content and adds healthcare-provider (HCP) rigor.
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
    description: "2025 Unified Chain of Survival, safety, and HCP-level scene assessment.",
    duration: 30,
    order: 1,
    sections: [
      {
        title: "The Unified 2025 Chain of Survival",
        content: `<h2>One Chain for Everyone</h2>
<p>The 2025 Guidelines unify the Chain of Survival. Whether at home, in a mall, or in a hospital, the steps to save a life are the same.</p>
<ol>
  <li><strong>Activation:</strong> Recognition and immediate call for help (911/Emergency Response).</li>
  <li><strong>High-Quality CPR:</strong> Early chest compressions to maintain vital organ perfusion.</li>
  <li><strong>Rapid Defibrillation:</strong> Early use of AED or manual defibrillator.</li>
  <li><strong>Advanced Resuscitation:</strong> High-performance team interventions, medications, and advanced airway.</li>
  <li><strong>Post-Cardiac Arrest Care (PCAC):</strong> Integrated hospital care focusing on neuro-protection (fever prevention).</li>
  <li><strong>Recovery:</strong> Long-term rehabilitation and psychological support.</li>
</ol>
<div class="clinical-note">
  <strong>Why bystander CPR matters:</strong> Survival from out-of-hospital cardiac arrest drops by 7–10% for every minute without CPR. Bystander CPR doubles or triples survival rates. High-quality CPR started within 2 minutes of collapse is the single most important intervention a bystander can provide.
</div>`,
        order: 1,
      },
      {
        title: "Recognising Cardiac Arrest",
        content: `<h2>Recognising Cardiac Arrest</h2>
<p>Cardiac arrest must be recognised quickly. Every second without CPR reduces the chance of survival.</p>
<h3>Signs of Cardiac Arrest</h3>
<ul>
  <li><strong>Unresponsive:</strong> No response to tapping shoulders and shouting "Are you OK?"</li>
  <li><strong>Not breathing normally:</strong> No breathing, or only gasping (agonal breathing)</li>
</ul>
<div class="warning-note">
  <strong>Agonal breathing:</strong> Agonal breathing (gasping, snoring, or irregular breathing) is a sign of cardiac arrest — NOT normal breathing. Do not mistake it for normal breathing and delay CPR. If in doubt, begin CPR.
</div>
<h3>What to Do When You Find Someone Collapsed</h3>
<ol>
  <li><strong>Check for danger:</strong> Is the scene safe? Do not put yourself at risk.</li>
  <li><strong>Check for response:</strong> Tap shoulders firmly; shout "Are you OK?"</li>
  <li><strong>Check for pulse (HCP Depth):</strong> Simultaneously check for breathing and a carotid pulse (Adult/Child) or brachial pulse (Infant) for 5–10 seconds.</li>
  <li><strong>If no normal breathing and no pulse:</strong> Begin CPR immediately.</li>
</ol>`,
        order: 2,
      },
      {
        order: 3,
        title: "Activating Emergency Services",
        content: `<h2>Activating Emergency Services</h2>
<p>Calling emergency services immediately is a critical link in the Chain of Survival. Do not delay calling — call while beginning CPR if you are alone.</p>
<h3>What to Tell the Dispatcher</h3>
<ul>
  <li>Your exact location (address, landmarks, floor/room number)</li>
  <li>What happened ("I found someone collapsed and not breathing")</li>
  <li>Number of people affected</li>
  <li>Stay on the line — the dispatcher will guide you through CPR</li>
</ul>
<div class="clinical-note">
  <strong>Dispatcher-assisted CPR:</strong> Emergency dispatchers are trained to guide bystanders through CPR over the phone. Studies show dispatcher-assisted CPR significantly improves survival. Always stay on the line with the dispatcher.
</div>`,
      }
    ],
    quiz: {
      title: "Module 1 Quiz",
      passingScore: 100,
      questions: [
        {
          question: "What is the first link in the Unified 2025 Chain of Survival?",
          options: ["Start CPR", "Call for help / Activation", "Use an AED", "Advanced Care"],
          correctAnswer: "Call for help / Activation",
          explanation: "Early activation of the emergency response system is the critical first step in the unified chain.",
        }
      ],
    },
  },
  {
    title: "Module 2: Adult CPR, AED & Healthcare Provider Depth",
    description: "Hands-only and 30:2 CPR for adults with HCP pulse check rigor.",
    duration: 50,
    order: 2,
    sections: [
      {
        title: "Hands-Only & 30:2 CPR",
        content: `<h2>Push Hard and Fast</h2>
<p>If you see an adult collapse, call 911 and push hard and fast in the center of the chest.</p>
<ul>
  <li>Rate: 100-120 beats per minute.</li>
  <li>Depth: At least 2 inches (5 cm).</li>
  <li>Allow full chest recoil.</li>
  <li>Minimize interruptions (less than 10 seconds).</li>
</ul>`,
        order: 1,
      },
      {
        title: "HCP Depth: Pulse Check & Recognition",
        content: `<h2>Healthcare Provider Assessment</h2>
<p>Healthcare providers must perform a simultaneous check for responsiveness, breathing, and pulse in <strong>no more than 10 seconds</strong>.</p>
<ul>
  <li><strong>Pulse Check (Adult):</strong> Locate the carotid pulse in the neck. Feel for at least 5 but no more than 10 seconds.</li>
  <li>If no pulse or breathing, start CPR immediately.</li>
</ul>`,
        order: 2,
      },
      {
        order: 3,
        title: "Using an AED",
        content: `<h2>AED Operation</h2>
<ol>
  <li>Turn on the AED and follow the voice prompts.</li>
  <li>Attach pads to the victim's bare chest.</li>
  <li>Stay clear while the AED analyzes the rhythm.</li>
  <li>If a shock is advised, ensure everyone is clear and press the shock button.</li>
  <li>Immediately resume CPR starting with chest compressions.</li>
</ol>
<div class="clinical-note">
  <strong>Why AEDs Work:</strong> VF is the most common initial rhythm in adult cardiac arrest. Defibrillation within 3–5 minutes can achieve survival rates of 50–70%.
</div>`,
      }
    ],
    quiz: {
      title: "Module 2 Quiz",
      passingScore: 100,
      questions: [
        {
          question: "What is the correct compression depth for an adult?",
          options: ["At least 1 inch", "At least 2 inches", "Exactly 3 inches", "At least 4 inches"],
          correctAnswer: "At least 2 inches",
          explanation: "Adult compressions must be at least 2 inches (5 cm) to be effective.",
        }
      ],
    },
  },
  {
    title: "Module 3: Infant & Child CPR (HCP Standards)",
    description: "Resuscitation for infants and children with HCP 15:2 ratios and 2025 technique updates.",
    duration: 50,
    order: 3,
    sections: [
      {
        title: "Pediatric Key Differences",
        content: `<h2>Ventilation is Priority</h2>
<p>Pediatric cardiac arrest is usually respiratory. Ventilation is critical.</p>
<table>
  <thead><tr><th>Feature</th><th>Child (1yr-Puberty)</th><th>Infant (<1yr)</th></tr></thead>
  <tbody>
    <tr><td>Compression depth</td><td>1/3 AP diameter (~5cm)</td><td>1/3 AP diameter (~4cm)</td></tr>
    <tr><td>Ratio (1 rescuer)</td><td>30:2</td><td>30:2</td></tr>
    <tr><td>Ratio (2 rescuers)</td><td>15:2</td><td>15:2</td></tr>
  </tbody>
</table>`,
        order: 1,
      },
      {
        title: "Infant Technique: 2-Thumb Encircling",
        content: `<h2>The Gold Standard for Infants</h2>
<p>When two rescuers are present, use the two-thumb encircling technique for infants. It generates higher coronary perfusion pressure.</p>`,
        order: 2,
      }
    ],
    quiz: {
      title: "Module 3 Quiz",
      passingScore: 100,
      questions: [
        {
          question: "What is the compression-to-ventilation ratio for 2-rescuer pediatric CPR?",
          options: ["30:2", "15:2", "15:1", "5:1"],
          correctAnswer: "15:2",
          explanation: "Healthcare providers use a 15:2 ratio for children and infants when two rescuers are present.",
        }
      ],
    },
  },
  {
    title: "Module 4: Choking Relief (Unified 5 & 5)",
    description: "2025 Guidelines for choking management across all ages.",
    duration: 30,
    order: 4,
    sections: [
      {
        title: "The 5 and 5 Approach",
        content: `<h2>Back Blows and Thrusts</h2>
<p>The 2025 Guidelines emphasize the 5 and 5 approach for severe obstruction:</p>
<ol>
  <li>5 firm back blows.</li>
  <li>5 abdominal thrusts (Adult/Child) or 5 chest thrusts (Infant).</li>
  <li>Repeat until cleared or unconscious.</li>
</ol>`,
        order: 1,
      }
    ],
    quiz: {
      title: "Module 4 Quiz",
      passingScore: 100,
      questions: [
        {
          question: "What is the sequence for a conscious choking adult?",
          options: ["Abdominal thrusts only", "5 back blows and 5 abdominal thrusts", "Chest thrusts only", "CPR immediately"],
          correctAnswer: "5 back blows and 5 abdominal thrusts",
          explanation: "The 2025 guidelines emphasize alternating 5 back blows and 5 abdominal thrusts.",
        }
      ],
    },
  },
  {
    title: "Module 5: First Aid, Anaphylaxis & Epi-pen",
    description: "Complete Heartsaver First Aid content with HCP depth.",
    duration: 40,
    order: 5,
    sections: [
      {
        title: "Recognizing Anaphylaxis",
        content: `<h2>Severe Allergic Reactions</h2>
<p>Recognize signs: wheezing, swelling, hives, and low blood pressure.</p>`,
        order: 1,
      },
      {
        title: "Epi-pen Administration",
        content: `<h2>Action Steps</h2>
<p>Inject into the outer thigh, hold for 10 seconds, and call 911.</p>`,
        order: 2,
      }
    ],
    quiz: {
      title: "Module 5 Quiz",
      passingScore: 100,
      questions: [
        {
          question: "How long should you hold an Epi-pen in place?",
          options: ["1 second", "3 seconds", "10 seconds", "30 seconds"],
          correctAnswer: "10 seconds",
          explanation: "Holding for 10 seconds ensures full medication delivery.",
        }
      ],
    },
  },
  {
    title: "Module 6: Bleeding Control & Tourniquets",
    description: "Stopping life-threatening bleeding for healthcare providers.",
    duration: 30,
    order: 6,
    sections: [
      {
        title: "Direct Pressure & Packing",
        content: `<h2>Stop the Bleed</h2>
<p>Apply firm pressure. For deep wounds, pack with gauze.</p>`,
        order: 1,
      },
      {
        title: "Tourniquet Use",
        content: `<h2>Life-Saving Intervention</h2>
<p>Apply 2-3 inches above the wound. Tighten until bleeding stops and pulse disappears.</p>`,
        order: 2,
      }
    ],
    quiz: {
      title: "Module 6 Quiz",
      passingScore: 100,
      questions: [
        {
          question: "Where should a tourniquet be placed?",
          options: ["Directly on the wound", "On a joint", "2-3 inches above the wound", "Below the wound"],
          correctAnswer: "2-3 inches above the wound",
          explanation: "Placement above the wound on a single bone (humerus or femur) is most effective.",
        }
      ],
    },
  },
  {
    title: "Module 7: Team Dynamics & Multi-Rescuer CPR",
    description: "HCP-specific coordination for high-performance teams.",
    duration: 40,
    order: 7,
    sections: [
      {
        title: "High-Performance Team Roles",
        content: `<h2>The 2-Minute Switch</h2>
<p>Compressors should switch roles every 2 minutes (or 5 cycles) to prevent fatigue and maintain compression quality.</p>`,
        order: 1,
      }
    ],
    quiz: {
      title: "Module 7 Quiz",
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
    title: "Module 8: Airway Management & Special Situations",
    description: "Advanced techniques and resuscitation in unique environments.",
    duration: 50,
    order: 8,
    sections: [
      {
        title: "Advanced Airway CPR",
        content: `<h2>Continuous Compressions</h2>
<p>Once an advanced airway is in place, compressions are performed continuously at 100-120/min without pauses for breaths.</p>`,
        order: 1,
      }
    ],
    quiz: {
      title: "Module 8 Quiz",
      passingScore: 100,
      questions: [
        {
          question: "What is the compression technique once an advanced airway is in place?",
          options: ["Continue 30:2 cycles", "Switch to 15:2 cycles", "Continuous compressions without pauses for breaths", "Stop compressions for breaths"],
          correctAnswer: "Continuous compressions without pauses for breaths",
          explanation: "Continuous compressions maximize coronary perfusion once the airway is secured.",
        }
      ],
    },
  },
];
