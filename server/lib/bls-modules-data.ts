/**
 * Exhaustive BLS Provider Course Data (AHA 2025 Guidelines)
 * This course literally merges all Heartsaver content and adds healthcare-provider (HCP) rigor.
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
<div class="hcp-note">
  <strong>HCP Depth:</strong> Healthcare providers must also coordinate with a high-performance team and consider advanced resuscitation links early.
</div>`,
        order: 1,
      },
      {
        title: "Personal Safety & Scene Assessment",
        content: `<h2>Safety First</h2>
<p>The first step in saving a life is recognising that someone needs help and calling for emergency services immediately. However, you must ensure the scene is safe for you and the victim.</p>
<ul>
  <li>Check for traffic, fire, or environmental hazards.</li>
  <li>Use personal protective equipment (PPE) if available.</li>
</ul>`,
        order: 2,
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
        title: "Using an AED",
        content: `<h2>AED Operation</h2>
<ol>
  <li>Turn on the AED and follow the voice prompts.</li>
  <li>Attach pads to the victim's bare chest.</li>
  <li>Stay clear while the AED analyzes the rhythm.</li>
  <li>If a shock is advised, ensure everyone is clear and press the shock button.</li>
  <li>Immediately resume CPR starting with chest compressions.</li>
</ol>`,
        order: 3,
      }
    ],
    quiz: {
      title: "Module 2 Quiz",
      passingScore: 100,
      questions: [
        {
          question: "How long should a healthcare provider check for a pulse in an unresponsive adult?",
          options: ["At least 5 but no more than 10 seconds", "Exactly 15 seconds", "No more than 5 seconds", "30 seconds"],
          correctAnswer: "At least 5 but no more than 10 seconds",
          explanation: "Healthcare providers must check for a pulse for at least 5 but no more than 10 seconds to avoid delaying compressions.",
        }
      ],
    },
  },
  {
    title: "Module 3: Pediatric BLS (Infant & Child)",
    description: "Resuscitation for infants and children with HCP 15:2 ratios and 2025 technique updates.",
    duration: 50,
    order: 3,
    sections: [
      {
        title: "Infant & Child CPR",
        content: `<h2>High-Quality Pediatric CPR</h2>
<p>Pediatric cardiac arrest is often respiratory in nature. Ventilation is critical.</p>
<ul>
  <li><strong>Child:</strong> 1 or 2 hands, at least 1/3 depth of chest (approx 2 inches).</li>
  <li><strong>Infant:</strong> Heel of 1 hand (1-rescuer) or 2 thumb-encircling hands (2-rescuer), at least 1/3 depth (approx 1.5 inches).</li>
</ul>
<div class="warning-note">
  <strong>2025 Update:</strong> The 2-finger technique for infant CPR has been eliminated because it produces insufficient depth.
</div>`,
        order: 1,
      },
      {
        title: "HCP Depth: 15:2 Ratios",
        content: `<h2>Multi-Rescuer Pediatric Ratios</h2>
<p>For healthcare providers, the 2-rescuer ratio for children and infants is <strong>15:2</strong> to provide more frequent ventilations.</p>
<p>1-rescuer ratio remains 30:2 for all ages.</p>`,
        order: 2,
      }
    ],
    quiz: {
      title: "Module 3 Quiz",
      passingScore: 100,
      questions: [
        {
          question: "What is the 2-rescuer compression-to-ventilation ratio for a child?",
          options: ["30:2", "15:2", "15:1", "5:1"],
          correctAnswer: "15:2",
          explanation: "15:2 is the healthcare provider standard for 2-rescuer pediatric BLS to prioritize ventilation.",
        }
      ],
    },
  },
  {
    title: "Module 4: Choking Relief (Adult, Child, Infant)",
    description: "2025 Guidelines for choking management using the 5 and 5 approach.",
    duration: 30,
    order: 4,
    sections: [
      {
        title: "The 5 and 5 Approach",
        content: `<h2>5 Back Blows, 5 Thrusts</h2>
<p>The 2025 Guidelines emphasize the 5 and 5 approach for choking victims who cannot breathe or cough:</p>
<ol>
  <li>Give 5 firm back blows between the shoulder blades.</li>
  <li>Give 5 abdominal thrusts (Heimlich maneuver).</li>
  <li>Repeat until the object comes out or the victim passes out.</li>
</ol>
<div class="warning-note">
  <strong>Infants:</strong> Use 5 back blows and 5 <strong>chest thrusts</strong> (not abdominal thrusts).
</div>`,
        order: 1,
      }
    ],
    quiz: {
      title: "Module 4 Quiz",
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
    title: "Module 5: First Aid - Epi-pen & Allergic Reactions",
    description: "Recognizing and treating severe allergies with HCP depth.",
    duration: 40,
    order: 5,
    sections: [
      {
        title: "Using an Epi-pen",
        content: `<h2>Blue to the Sky, Orange to the Thigh</h2>
<ol>
  <li>Remove the safety cap.</li>
  <li>Press the tip firmly against the outer thigh.</li>
  <li>Hold for 10 seconds.</li>
  <li>Call 911 immediately.</li>
</ol>`,
        order: 1,
      },
      {
        title: "HCP Depth: IM Epinephrine",
        content: `<h2>Emergency Medication Administration</h2>
<p>Healthcare providers should be proficient in using auto-injectors as well as drawing up epinephrine for IM injection (1:1000) if protocols allow.</p>`,
        order: 2,
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
    title: "Module 6: First Aid - Bleeding Control",
    description: "Stopping life-threatening bleeding with HCP depth.",
    duration: 40,
    order: 6,
    sections: [
      {
        title: "Direct Pressure",
        content: `<h2>Stop the Bleed</h2>
<p>Apply firm, direct pressure on the wound with a clean cloth or gauze. If the bleeding doesn't stop, apply more pressure. Do not remove the first cloth.</p>`,
        order: 1,
      },
      {
        title: "HCP Depth: Tourniquets & Wound Packing",
        content: `<h2>Advanced Bleeding Control</h2>
<p>Healthcare providers should use tourniquets for life-threatening limb bleeding that cannot be controlled by direct pressure. Pack deep wounds with hemostatic gauze if available.</p>`,
        order: 2,
      }
    ],
    quiz: {
      title: "Module 6 Quiz",
      passingScore: 100,
      questions: [
        {
          question: "What is the first step to stop heavy bleeding?",
          options: ["Apply a tourniquet", "Apply direct pressure", "Wash the wound", "Elevate the limb"],
          correctAnswer: "Apply direct pressure",
          explanation: "Direct pressure is the most effective first step for stopping most bleeding.",
        }
      ],
    },
  },
  {
    title: "Module 7: Team Dynamics & Multi-Rescuer Coordination",
    description: "Operating in a high-performance team to maximize survival.",
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
