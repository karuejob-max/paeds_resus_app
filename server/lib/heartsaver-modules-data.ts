/**
 * Heartsaver module catalog — AHA Heartsaver CPR AED with 2025 guideline updates.
 * Exhaustive restoration of all original content plus expansions.
 */
export const HEARTSAVER_MODULES = [
  {
    order: 1,
    title: "Module 1: Foundations & The Unified Chain of Survival",
    description: "Recognise the signs of cardiac arrest and activate the emergency response system using the unified 2025 framework.",
    content: "The first step in saving a life is recognising that someone needs help and calling for emergency services immediately.",
    duration: 15,
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
  <li><strong>Advanced Resuscitation:</strong> High-performance team interventions, medications, and advanced airway.</li>
  <li><strong>Post-Cardiac Arrest Care (PCAC):</strong> Integrated hospital care focusing on neuro-protection (fever prevention).</li>
  <li><strong>Recovery:</strong> Long-term rehabilitation and psychological support.</li>
</ol>
<div class="clinical-note">
  <strong>Why bystander CPR matters:</strong> Survival from out-of-hospital cardiac arrest drops by 7–10% for every minute without CPR. Bystander CPR doubles or triples survival rates. High-quality CPR started within 2 minutes of collapse is the single most important intervention a bystander can provide.
</div>`
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
</ol>
<h3>Checking for a Pulse</h3>
<p>Lay rescuers are NOT required to check for a pulse before starting CPR. Pulse checks are unreliable even for trained healthcare providers. If the person is unresponsive and not breathing normally, begin CPR.</p>`
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
  <li>Your phone number</li>
  <li>Stay on the line — the dispatcher will guide you through CPR</li>
</ul>
<div class="clinical-note">
  <strong>Dispatcher-assisted CPR:</strong> Emergency dispatchers are trained to guide bystanders through CPR over the phone. Studies show dispatcher-assisted CPR significantly improves survival. Always stay on the line with the dispatcher.
</div>
<h3>If You Are Alone</h3>
<ul>
  <li>Call emergency services first (or use speakerphone while doing CPR)</li>
  <li>Exception: If you witness a child collapse (likely respiratory cause), do 2 minutes of CPR first, then call</li>
  <li>If an AED is immediately available, use it first, then call</li>
</ul>`
      },
      {
        order: 4,
        title: "Recovery Position",
        content: `<h2>Recovery Position</h2>
<p>The recovery position is used for unresponsive people who are breathing normally. It keeps the airway open and prevents aspiration.</p>
<h3>When to Use the Recovery Position</h3>
<ul>
  <li>Person is unresponsive but breathing normally</li>
  <li>No suspected spinal injury</li>
  <li>After successful resuscitation (if breathing normally)</li>
</ul>
<h3>How to Place Someone in the Recovery Position</h3>
<ol>
  <li>Kneel beside the person</li>
  <li>Place the arm nearest to you at a right angle to the body, elbow bent, palm facing up</li>
  <li>Bring the far arm across the chest; hold the back of the hand against the near cheek</li>
  <li>Pull the far knee up, keeping the foot flat on the ground</li>
  <li>Roll the person towards you onto their side</li>
  <li>Tilt the head back slightly to keep the airway open</li>
  <li>Monitor breathing continuously; call emergency services if breathing stops</li>
</ol>
<div class="warning-note">
  <strong>Do not leave the person alone:</strong> Stay with the person in the recovery position and monitor their breathing continuously. If breathing stops, begin CPR immediately.
</div>`
      }
    ],
    quiz: {
      title: "Check: Foundations",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "What is the first link in the Unified 2025 Chain of Survival?",
          options: JSON.stringify(["Start CPR", "Call for help / Activation", "Use an AED", "Advanced Care"]),
          correctAnswer: "Call for help / Activation",
          explanation: "Early activation of the emergency response system is the critical first step in the unified chain."
        },
        {
          order: 2,
          questionText: "You find an adult collapsed. They are gasping irregularly but do not respond. What should you do?",
          options: JSON.stringify(["Place them in the recovery position", "Begin CPR immediately — gasping is a sign of cardiac arrest", "Wait for 2 minutes", "Check their pulse for 30 seconds"]),
          correctAnswer: "Begin CPR immediately — gasping is a sign of cardiac arrest",
          explanation: "Agonal breathing (gasping) is a sign of cardiac arrest. Begin CPR immediately."
        }
      ]
    }
  },
  {
    order: 2,
    title: "Module 2: Adult CPR — Hands-Only and Standard",
    description: "Perform high-quality adult CPR using hands-only and standard (with breaths) techniques.",
    content: "High-quality CPR is the most important intervention a bystander can provide.",
    duration: 20,
    sections: [
      {
        order: 1,
        title: "The Five Elements of High-Quality CPR",
        content: `<h2>High-Quality CPR — What It Means</h2>
<table>
  <thead><tr><th>Element</th><th>Target</th></tr></thead>
  <tbody>
    <tr><td>Compression rate</td><td>100–120 compressions per minute</td></tr>
    <tr><td>Compression depth (adult)</td><td>At least 5 cm (2 inches); no more than 6 cm (2.4 inches)</td></tr>
    <tr><td>Full chest recoil</td><td>Allow complete chest recoil between compressions; do not lean on chest</td></tr>
    <tr><td>Minimise interruptions</td><td>Pause compressions for no more than 10 seconds</td></tr>
    <tr><td>Avoid excessive ventilation</td><td>1 breath over 1 second; visible chest rise</td></tr>
  </tbody>
</table>`
      },
      {
        order: 2,
        title: "Hands-Only CPR",
        content: `<h2>Hands-Only CPR</h2>
<p>Recommended for untrained bystanders. Push hard and fast — at least 5 cm deep; 100–120 per minute.</p>`
      },
      {
        order: 3,
        title: "Standard CPR (30:2)",
        content: `<h2>Standard CPR</h2>
<p>Adult ratio: 30 compressions to 2 breaths. Open airway with head-tilt chin-lift. Pinch nose and give 1-second breaths watching for chest rise.</p>`
      }
    ],
    quiz: {
      title: "Check: Adult CPR",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "What is the correct compression depth for adult CPR?",
          options: JSON.stringify(["2–3 cm", "At least 5 cm (2 inches)", "7–8 cm", "1/3 of the chest"]),
          correctAnswer: "At least 5 cm (2 inches)",
          explanation: "Adult CPR requires a depth of at least 5 cm (2 inches)."
        }
      ]
    }
  },
  {
    order: 3,
    title: "Module 3: Using an AED",
    description: "Operate an Automated External Defibrillator (AED) safely and effectively.",
    content: "AEDs are simple, life-saving devices that can be used by anyone.",
    duration: 15,
    sections: [
      {
        order: 1,
        title: "AED Operation",
        content: `<h2>How to Use an AED</h2>
<ol>
  <li>Turn on the AED and follow voice prompts.</li>
  <li>Attach pads to bare chest.</li>
  <li>Stay clear for analysis.</li>
  <li>If shock advised, ensure everyone is clear and press button.</li>
  <li>Immediately resume CPR.</li>
</ol>`
      }
    ],
    quiz: {
      title: "Check: AED",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "What should you do immediately after the AED delivers a shock?",
          options: JSON.stringify(["Wait for the AED to analyze again", "Check for a pulse", "Resume CPR starting with compressions", "Give 2 rescue breaths"]),
          correctAnswer: "Resume CPR starting with compressions",
          explanation: "Minimize interruptions by resuming CPR immediately after a shock."
        }
      ]
    }
  },
  {
    order: 4,
    title: "Module 4: Infant & Child CPR and Choking",
    description: "Resuscitation and choking relief for infants and children (2025 updates).",
    content: "Paediatric cardiac arrest is usually respiratory. Ventilation is priority.",
    duration: 30,
    sections: [
      {
        order: 1,
        title: "Key Differences in Paediatric CPR",
        content: `<h2>Pediatric CPR</h2>
<table>
  <thead><tr><th>Feature</th><th>Adult</th><th>Child (1yr-Puberty)</th><th>Infant (<1yr)</th></tr></thead>
  <tbody>
    <tr><td>Compression depth</td><td>≥5 cm</td><td>≥5 cm (or 1/3 AP)</td><td>≥4 cm (or 1/3 AP)</td></tr>
    <tr><td>Ratio (1 rescuer)</td><td>30:2</td><td>30:2</td><td>30:2</td></tr>
  </tbody>
</table>
<div class="warning-note">
  <strong>2025 Update:</strong> The 2-finger technique for infant CPR is eliminated. Use the heel of 1 hand or two-thumb encircling.
</div>`
      },
      {
        order: 2,
        title: "Choking Relief (5 and 5)",
        content: `<h2>Choking Management</h2>
<p>2025 standard: 5 back blows followed by 5 abdominal thrusts (Adult/Child) or 5 chest thrusts (Infant).</p>`
      }
    ],
    quiz: {
      title: "Check: Pediatric CPR",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "What is the correct choking relief sequence for a 6-month-old?",
          options: JSON.stringify(["5 back blows and 5 abdominal thrusts", "5 back blows and 5 chest thrusts", "Finger sweep", "CPR only"]),
          correctAnswer: "5 back blows and 5 chest thrusts",
          explanation: "Infants get chest thrusts instead of abdominal thrusts to protect the liver."
        }
      ]
    }
  },
  {
    order: 5,
    title: "Module 5: First Aid — Epi-pen & Bleeding Control",
    description: "Essential first aid skills including anaphylaxis and stopping life-threatening bleeding.",
    content: "Heartsaver includes life-saving first aid skills beyond CPR.",
    duration: 30,
    sections: [
      {
        order: 1,
        title: "Anaphylaxis and Epi-pen",
        content: `<h2>Using an Epi-pen</h2>
<p>Inject into outer thigh, hold for 10 seconds, and call 911.</p>`
      },
      {
        order: 2,
        title: "Bleeding Control",
        content: `<h2>Stop the Bleed</h2>
<p>Apply firm direct pressure. Use a tourniquet for life-threatening limb bleeding.</p>`
      }
    ],
    quiz: {
      title: "Check: First Aid",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "How long should you hold an Epi-pen in place?",
          options: JSON.stringify(["1 second", "3 seconds", "10 seconds", "30 seconds"]),
          correctAnswer: "10 seconds",
          explanation: "Holding for 10 seconds ensures full medication delivery."
        }
      ]
    }
  }
];

export type HeartsaverModuleDef = (typeof HEARTSAVER_MODULES)[number];
