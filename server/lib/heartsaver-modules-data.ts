/**
 * Exhaustive Heartsaver module catalog — AHA Heartsaver CPR AED with 2025 guideline updates.
 * This file restores the original detailed coursework from June 7, 2026, 
 * and adds First Aid/Epi-pen/Bleeding Control as genuine expansions.
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
    description: "Introduction to the 2025 Unified Chain of Survival, safety, and recognition.",
    duration: 20,
    content: "The first step in saving a life is recognising that someone needs help and calling for emergency services immediately.",
    sections: [
      {
        order: 1,
        title: "The Unified 2025 Chain of Survival",
        content: `<h2>One Chain for Everyone</h2>
<p>The 2025 Guidelines unify the Chain of Survival. Whether at home, in a mall, or in a hospital, the steps to save a life are the same.</p>
<ol>
  <li><strong>Activation:</strong> Recognition and immediate call for help (911/Emergency Response).</li>
  <li><strong>High-Quality CPR:</strong> Early chest compressions to maintain vital organ perfusion.</li>
  <li><strong>Rapid Defibrillation:</strong> Early use of AED or manual defibrillator.</li>
  <li><strong>Advanced Resuscitation:</strong> High-performance team interventions and medications.</li>
  <li><strong>Post-Cardiac Arrest Care (PCAC):</strong> Integrated hospital care focusing on neuro-protection (fever prevention).</li>
  <li><strong>Recovery:</strong> Long-term rehabilitation and support.</li>
</ol>
<div class="clinical-note">
  <strong>Why bystander CPR matters:</strong> Survival from out-of-hospital cardiac arrest drops by 7–10% for every minute without CPR. Bystander CPR doubles or triples survival rates. High-quality CPR started within 2 minutes of collapse is the single most important intervention a bystander can provide.
</div>`,
      },
      {
        order: 2,
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
  <li><strong>Call for help:</strong> Shout for help; send someone to call emergency services</li>
  <li><strong>Check breathing:</strong> Look for chest rise; listen for breath sounds (no more than 10 seconds)</li>
  <li><strong>If no normal breathing:</strong> Begin CPR immediately</li>
</ol>`,
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
          order: 1,
          questionText: "What is the first link in the Unified 2025 Chain of Survival?",
          options: JSON.stringify(["Start CPR", "Call for help / Activation", "Use an AED", "Go to the hospital"]),
          correctAnswer: "Call for help / Activation",
          explanation: "Early activation of the emergency response system is the critical first step in the unified chain.",
        }
      ],
    },
  },
  {
    order: 2,
    title: "Module 2: Adult CPR & AED Use",
    description: "Hands-only and 30:2 CPR for adults with AED integration.",
    duration: 40,
    content: "Comprehensive guide to adult resuscitation and AED operation.",
    sections: [
      {
        order: 1,
        title: "Hands-Only CPR",
        content: `<h2>Push Hard and Fast</h2>
<p>If you see an adult collapse, call 911 and push hard and fast in the center of the chest.</p>
<ul>
  <li>Rate: 100-120 beats per minute.</li>
  <li>Depth: At least 2 inches (5 cm).</li>
  <li>Allow full chest recoil between compressions.</li>
</ul>`,
      },
      {
        order: 2,
        title: "30:2 CPR and Ventilation",
        content: `<h2>Compressions and Breaths</h2>
<p>When you have a barrier device, use the 30:2 ratio: 30 compressions followed by 2 breaths.</p>
<ul>
  <li>Open the airway using the head-tilt, chin-lift maneuver.</li>
  <li>Give 2 breaths (1 second each) and look for chest rise.</li>
  <li>Resume compressions immediately.</li>
</ul>
<div class="warning-note">
  <strong>Avoid hyperventilation:</strong> Giving breaths that are too large or too fast causes gastric inflation and reduced venous return, worsening outcomes.
</div>`,
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
    title: "Module 3: Infant & Child CPR",
    description: "Detailed pediatric resuscitation including the 2025 1-hand/2-thumb updates.",
    duration: 50,
    content: "Exhaustive guide to pediatric life support.",
    sections: [
      {
        order: 1,
        title: "Child CPR (1 Year to Puberty)",
        content: `<h2>High-Quality Child CPR</h2>
<ul>
  <li>Compression depth: About 2 inches (1/3 depth of chest).</li>
  <li>Ratio: 30 compressions to 2 breaths (1 rescuer).</li>
  <li>Use 1 or 2 hands depending on the size of the child.</li>
</ul>`,
      },
      {
        order: 2,
        title: "Infant CPR (Under 1 Year)",
        content: `<h2>High-Quality Infant CPR</h2>
<ul>
  <li><strong>1 Rescuer:</strong> Heel of 1 hand on the lower half of the sternum (2025 Guideline).</li>
  <li><strong>2 Rescuers:</strong> Two-thumb encircling technique.</li>
  <li>Compression depth: About 1.5 inches (1/3 depth of chest).</li>
  <li>Ratio: 30:2 (1 rescuer); 15:2 (2 rescuers).</li>
</ul>
<div class="warning-note">
  <strong>2025 Update:</strong> The 2-finger technique for infant CPR has been eliminated because it produces insufficient depth.
</div>`,
      }
    ],
    quiz: {
      title: "Module 3 Quiz",
      passingScore: 100,
      questions: [
        {
          order: 1,
          questionText: "What is the correct compression technique for a single rescuer performing infant CPR according to 2025 guidelines?",
          options: JSON.stringify(["Two fingers", "Heel of one hand", "Knuckle of one hand", "Flat of both hands"]),
          correctAnswer: "Heel of one hand",
          explanation: "The 2025 guidelines eliminate the 2-finger technique for infants; use the heel of 1 hand for single-rescuer infant CPR.",
        }
      ],
    },
  },
  {
    order: 4,
    title: "Module 4: Choking Relief (Adult, Child, Infant)",
    description: "2025 Guidelines for choking management using the 5 and 5 approach.",
    duration: 30,
    content: "Steps to help a choking victim of any age.",
    sections: [
      {
        order: 1,
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
      }
    ],
    quiz: {
      title: "Module 4 Quiz",
      passingScore: 100,
      questions: [
        {
          order: 1,
          questionText: "What is the correct sequence for a choking victim according to 2025 guidelines?",
          options: JSON.stringify(["10 abdominal thrusts", "5 back blows and 5 abdominal thrusts", "Just start CPR", "Wait for the victim to pass out"]),
          correctAnswer: "5 back blows and 5 abdominal thrusts",
          explanation: "The 2025 guidelines emphasize the combination of 5 back blows followed by 5 abdominal thrusts.",
        }
      ],
    },
  },
  {
    order: 5,
    title: "Module 5: First Aid Foundations & Allergic Reactions",
    description: "Recognizing and treating medical emergencies and severe allergies.",
    duration: 40,
    content: "How to use an epinephrine auto-injector safely and handle common first aid situations.",
    sections: [
      {
        order: 1,
        title: "Recognizing Anaphylaxis",
        content: `<h2>Signs of Severe Allergy</h2>
<ul>
  <li>Swelling of the lips, tongue, or throat.</li>
  <li>Difficulty breathing or wheezing.</li>
  <li>Hives, itching, or flushed skin.</li>
  <li>Rapid pulse or dizziness.</li>
</ul>`,
      },
      {
        order: 2,
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
      title: "Module 5 Quiz",
      passingScore: 100,
      questions: [
        {
          order: 1,
          questionText: "Where is the preferred site for an epinephrine injection?",
          options: JSON.stringify(["The arm", "The outer thigh", "The stomach", "The buttocks"]),
          correctAnswer: "The outer thigh",
          explanation: "The outer thigh is the safest and most effective place for an epinephrine injection.",
        }
      ],
    },
  },
  {
    order: 6,
    title: "Module 6: First Aid - Bleeding Control",
    description: "Stopping life-threatening bleeding with pressure and tourniquets.",
    duration: 30,
    content: "Pressure and bandaging techniques to stop the bleed.",
    sections: [
      {
        order: 1,
        title: "Direct Pressure",
        content: `<h2>Stop the Bleed</h2>
<p>Apply firm, direct pressure on the wound with a clean cloth or gauze. If the bleeding doesn't stop, apply more pressure. Do not remove the first cloth.</p>`,
      },
      {
        order: 2,
        title: "Using a Tourniquet",
        content: `<h2>Life-Threatening Bleeding</h2>
<p>If direct pressure does not stop life-threatening bleeding from an arm or leg, use a tourniquet. Place it 2-3 inches above the wound (not on a joint) and tighten until the bleeding stops.</p>`,
      }
    ],
    quiz: {
      title: "Module 6 Quiz",
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

// Module type derived from the HEARTSAVER_MODULES constant
export type HeartsaverModuleInstance = (typeof HEARTSAVER_MODULES)[number];
