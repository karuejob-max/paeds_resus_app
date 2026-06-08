/**
 * Heartsaver module catalog — AHA Heartsaver CPR AED with 2025 guideline updates.
 * Shared by seed-heartsaver.ts and runtime ensure-heartsaver-catalog.
 */
export interface HeartsaverModuleDef {
  order: number;
  title: string;
  description: string;
  duration: number;
  content: string;
  sections: {
    order: number;
    title: string;
    content: string;
  }[];
  quiz: {
    title: string;
    passingScore: number;
    questions: {
      order: number;
      questionText: string;
      options: string;
      correctAnswer: string;
      explanation: string;
    }[];
  };
}

export const HEARTSAVER_MODULES: HeartsaverModuleDef[] = [
  {
    order: 1,
    title: "Module 1: Foundations & The Unified Chain of Survival",
    description: "Introduction to the 2025 Unified Chain of Survival and safety.",
    duration: 15,
    content: "The first step in saving a life is recognising that someone needs help and calling for emergency services immediately.",
    sections: [
      {
        order: 1,
        title: "The Unified 2025 Chain of Survival",
        content: `<h2>One Chain for Everyone</h2>
<p>The 2025 Guidelines unify the Chain of Survival. Whether at home, in a mall, or in a hospital, the steps to save a life are the same.</p>
<ol>
  <li><strong>Activation:</strong> Call for help (911).</li>
  <li><strong>CPR:</strong> Start chest compressions.</li>
  <li><strong>AED:</strong> Use a defibrillator.</li>
  <li><strong>Advanced Care:</strong> Professional medical help.</li>
  <li><strong>Post-Arrest Care:</strong> Hospital recovery.</li>
  <li><strong>Recovery:</strong> Long-term support.</li>
</ol>`,
      }
    ],
    quiz: {
      title: "Module 1 Quiz",
      passingScore: 100,
      questions: [
        {
          order: 1,
          questionText: "What is the first link in the Unified Chain of Survival?",
          options: JSON.stringify(["Start CPR", "Call for help (911)", "Use an AED", "Go to the hospital"]),
          correctAnswer: "Call for help (911)",
          explanation: "Early activation of the emergency response system is the critical first step.",
        }
      ],
    },
  },
  {
    order: 2,
    title: "Module 2: Adult CPR & AED Use",
    description: "Hands-only and 30:2 CPR for adults.",
    duration: 30,
    content: "How to perform CPR and use an AED on an adult.",
    sections: [
      {
        order: 1,
        title: "Hands-Only CPR",
        content: `<h2>Push Hard and Fast</h2>
<p>If you see an adult collapse, call 911 and push hard and fast in the center of the chest.</p>
<ul>
  <li>Rate: 100-120 beats per minute.</li>
  <li>Depth: At least 2 inches.</li>
</ul>`,
      }
    ],
    quiz: {
      title: "Module 2 Quiz",
      passingScore: 100,
      questions: [
        {
          order: 1,
          questionText: "What is the correct rate for chest compressions?",
          options: JSON.stringify(["60-80 per minute", "80-100 per minute", "100-120 per minute", "140-160 per minute"]),
          correctAnswer: "100-120 per minute",
          explanation: "Pushing at a rate of 100-120/min maximizes blood flow to the brain.",
        }
      ],
    },
  },
  {
    order: 3,
    title: "Module 3: Choking Relief (Adult, Child, Infant)",
    description: "2025 Guidelines for choking management.",
    duration: 20,
    content: "Steps to help a choking victim.",
    sections: [
      {
        order: 1,
        title: "The 5 and 5 Approach",
        content: `<h2>5 Back Blows, 5 Thrusts</h2>
<p>For a choking victim who cannot breathe or cough:</p>
<ol>
  <li>Give 5 firm back blows between the shoulder blades.</li>
  <li>Give 5 abdominal thrusts (Heimlich maneuver).</li>
  <li>Repeat until the object comes out or the victim passes out.</li>
</ol>
<div class="warning-note">
  If the victim passes out, start CPR immediately.
</div>`,
      }
    ],
    quiz: {
      title: "Module 3 Quiz",
      passingScore: 100,
      questions: [
        {
          order: 1,
          questionText: "What is the correct sequence for a choking victim?",
          options: JSON.stringify(["10 back blows", "10 abdominal thrusts", "5 back blows and 5 abdominal thrusts", "Just wait for help"]),
          correctAnswer: "5 back blows and 5 abdominal thrusts",
          explanation: "The 2025 guidelines emphasize the combination of 5 back blows followed by 5 abdominal thrusts.",
        }
      ],
    },
  },
  {
    order: 4,
    title: "Module 4: First Aid - Epi-pen & Allergic Reactions",
    description: "Recognizing and treating severe allergies.",
    duration: 20,
    content: "How to use an epinephrine auto-injector.",
    sections: [
      {
        order: 1,
        title: "Using an Epi-pen",
        content: `<h2>Blue to the Sky, Orange to the Thigh</h2>
<ol>
  <li>Remove the safety cap.</li>
  <li>Press the tip firmly against the outer thigh.</li>
  <li>Hold for 10 seconds.</li>
  <li>Call 911 immediately.</li>
</ol>`,
      }
    ],
    quiz: {
      title: "Module 4 Quiz",
      passingScore: 100,
      questions: [
        {
          order: 1,
          questionText: "Where should you inject an Epi-pen?",
          options: JSON.stringify(["The arm", "The stomach", "The outer thigh", "The buttocks"]),
          correctAnswer: "The outer thigh",
          explanation: "The outer thigh is the safest and most effective place for an epinephrine injection.",
        }
      ],
    },
  },
  {
    order: 5,
    title: "Module 5: First Aid - Bleeding Control",
    description: "Stopping life-threatening bleeding.",
    duration: 20,
    content: "Pressure and bandaging techniques.",
    sections: [
      {
        order: 1,
        title: "Direct Pressure",
        content: `<h2>Stop the Bleed</h2>
<p>Apply firm, direct pressure on the wound with a clean cloth or gauze. If the bleeding doesn't stop, apply more pressure. Do not remove the first cloth.</p>`,
      }
    ],
    quiz: {
      title: "Module 5 Quiz",
      passingScore: 100,
      questions: [
        {
          order: 1,
          questionText: "What is the first step to stop heavy bleeding?",
          options: JSON.stringify(["Apply a tourniquet", "Apply direct pressure", "Wash the wound", "Elevate the limb"]),
          correctAnswer: "Apply direct pressure",
          explanation: "Direct pressure is the most effective first step for stopping most bleeding.",
        }
      ],
    },
  },
];
