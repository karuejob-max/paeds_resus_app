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
<p>This unification simplifies the framework and emphasizes that while the setting may change, the sequence of life-saving actions remains consistent.</p>
<h3>The 6 Links of the Unified Chain</h3>
<ol>
  <li><strong>Activation of Emergency Response:</strong> Immediate recognition and calling for help (999/112/911).</li>
  <li><strong>High-Quality CPR:</strong> Early chest compressions to maintain vital organ perfusion.</li>
  <li><strong>Rapid Defibrillation:</strong> Early use of AED or manual defibrillator to treat shockable rhythms.</li>
  <li><strong>Advanced Resuscitation:</strong> High-performance team interventions, medications, and advanced airway.</li>
  <li><strong>Post-Cardiac Arrest Care (PCAC):</strong> Integrated hospital care focusing on neuro-protection (fever prevention).</li>
  <li><strong>Recovery:</strong> Long-term rehabilitation, psychological support, and survivorship.</li>
</ol>
<div class="clinical-note">
  <strong>Key Update:</strong> Recovery is now an essential link, acknowledging that the journey doesn't end at hospital discharge. Survival is not just about a pulse; it's about quality of life.
</div>`,
        order: 1,
      },
      {
        title: "Personal Safety & Scene Assessment",
        content: `<h2>Safety First</h2>
<p>Before any intervention, ensure the scene is safe for both the rescuer and the victim. Do not become a victim yourself.</p>
<ul>
  <li><strong>Scene Survey:</strong> Check for traffic, fire, electricity, or environmental hazards.</li>
  <li><strong>PPE (Personal Protective Equipment):</strong> Healthcare providers MUST use standard precautions. At a minimum, use gloves and a pocket mask with a one-way valve. In high-risk respiratory environments, use N95 masks and eye protection.</li>
</ul>`,
        order: 2,
      }
    ],
    quiz: {
      title: "Module 1 Quiz",
      passingScore: 100,
      questions: [
        {
          question: "Which statement best describes the 2025 AHA Chain of Survival?",
          options: [
            "There are separate chains for IHCA and OHCA",
            "Adult and Pediatric chains remain distinct",
            "A single, unified chain applies to all ages and settings",
            "The chain no longer includes the Recovery link"
          ],
          correctAnswer: "A single, unified chain applies to all ages and settings",
          explanation: "The 2025 guidelines unified the chain to simplify the framework and emphasize consistent high-quality care across all scenarios.",
        }
      ],
    },
  },
  {
    title: "Module 2: Recognition & High-Quality Adult CPR",
    description: "Healthcare-provider level recognition and execution of adult CPR.",
    duration: 50,
    order: 2,
    sections: [
      {
        title: "Recognising Cardiac Arrest (The 10-Second Rule)",
        content: `<h2>Rapid Recognition</h2>
<p>Cardiac arrest must be recognised quickly. Every second without CPR reduces the chance of survival.</p>
<h3>Signs of Cardiac Arrest</h3>
<ul>
  <li><strong>Unresponsive:</strong> No response to tapping shoulders and shouting "Are you OK?"</li>
  <li><strong>Not breathing normally:</strong> No breathing, or only gasping (agonal breathing)</li>
</ul>
<div class="warning-note">
  <strong>Agonal breathing:</strong> Agonal breathing (gasping, snoring, or irregular breathing) is a sign of cardiac arrest — NOT normal breathing. Do not mistake it for normal breathing and delay CPR. If in doubt, begin CPR.
</div>
<h3>Healthcare Provider Assessment</h3>
<p>Unlike lay rescuers, healthcare providers must perform a simultaneous check for responsiveness, breathing, and pulse in <strong>no more than 10 seconds</strong>.</p>
<ul>
  <li><strong>Pulse Check (Adult):</strong> Locate the carotid pulse in the neck. Feel for at least 5 but no more than 10 seconds.</li>
  <li><strong>Pulse Check (Pediatric):</strong> Carotid or femoral pulse for children; Brachial pulse for infants.</li>
</ul>
<div class="clinical-note">
  <strong>Critical Action:</strong> If you do not definitely feel a pulse within 10 seconds, or if the heart rate is <60 bpm with signs of poor perfusion in a pediatric patient, begin high-quality CPR immediately.
</div>`,说明:
        order: 1,
      },
      {
        title: "High-Quality Chest Compressions",
        content: `<h2>The Foundation of Resuscitation</h2>
<p>High-quality CPR is defined by five key elements. Each element is critical to maximising blood flow to the heart and brain.</p>
<table>
  <thead><tr><th>Element</th><th>Target</th></tr></thead>
  <tbody>
    <tr><td>Compression rate</td><td>100–120 compressions per minute</td></tr>
    <tr><td>Compression depth (adult)</td><td>At least 2 inches (5 cm); no more than 2.4 inches (6 cm)</td></tr>
    <tr><td>Full chest recoil</td><td>Allow complete chest recoil between compressions; do not lean on chest</td></tr>
    <tr><td>Minimise interruptions</td><td>Keep pauses to <10 seconds (Target CCF >80%)</td></tr>
    <tr><td>Avoid excessive ventilation</td><td>1 breath over 1 second; visible chest rise</td></tr>
  </tbody>
</table>
<div class="clinical-note">
  <strong>Push hard and fast:</strong> Most rescuers do not compress deeply enough. You need to compress at least 5 cm (2 inches) — this requires significant force. Rib fractures are acceptable in the context of saving a life.
</div>`,
        order: 2,
      },
      {
        title: "Standard CPR (30:2) & Rescue Breaths",
        content: `<h2>Ventilation Technique</h2>
<p>For adult BLS, the ratio is <strong>30 compressions to 2 breaths</strong> for both 1 and 2 rescuers.</p>
<ul>
  <li><strong>Airway:</strong> Use the Head-Tilt Chin-Lift maneuver. If a spinal injury is suspected, use the Jaw-Thrust.</li>
  <li><strong>Breaths:</strong> Deliver 2 breaths, each over 1 second, enough to cause visible chest rise.</li>
  <li><strong>Avoid Excessive Ventilation:</strong> Too much air or too much pressure increases intrathoracic pressure, reducing venous return and coronary perfusion.</li>
</ul>`,
        order: 3,
      }
    ],
    quiz: {
      title: "Module 2 Quiz",
      passingScore: 80,
      questions: [
        {
          question: "A victim is making irregular, snorting/gasping sounds and you cannot feel a pulse. What is your next action?",
          options: [
            "Monitor them until EMS arrives",
            "Start rescue breathing only",
            "Begin high-quality CPR immediately",
            "Wait another 10 seconds to confirm the pulse"
          ],
          correctAnswer: "Begin high-quality CPR immediately",
          explanation: "Agonal gasps are a sign of cardiac arrest. If the patient is not breathing normally and has no pulse, CPR must start immediately.",
        }
      ],
    },
  },
  {
    title: "Module 3: Automated External Defibrillation (AED)",
    description: "Operating an AED safely and effectively in various environments.",
    duration: 35,
    order: 3,
    sections: [
      {
        title: "AED Operation Steps",
        content: `<h2>The Life-Saver</h2>
<p>An AED should be used as soon as it is available. It is the most effective way to treat a shockable rhythm (VF/pVT).</p>
<ol>
  <li><strong>Power On:</strong> This is the first and most important step.</li>
  <li><strong>Attach Pads:</strong> Follow the diagrams on the pads. Place one on the upper right chest and one on the side of the left nipple (mid-axillary line).</li>
  <li><strong>Clear for Analysis:</strong> Ensure no one is touching the victim while the AED analyzes the rhythm.</li>
  <li><strong>Shock if Advised:</strong> Shout "Clear!" and ensure no one is touching the victim before pressing the shock button.</li>
  <li><strong>Resume CPR:</strong> Immediately resume compressions after the shock or if no shock is advised.</li>
</ol>`,
        order: 1,
      },
      {
        title: "Special AED Situations",
        content: `<h2>Troubleshooting & Safety</h2>
<ul>
  <li><strong>Hairy Chest:</strong> Use the razor in the AED kit to shave the area or use a spare set of pads to "wax" the hair off.</li>
  <li><strong>Water:</strong> Move the victim to a dry area and wipe the chest dry. Do not use an AED in standing water.</li>
  <li><strong>Implanted Devices:</strong> Avoid placing pads directly over pacemakers or ICDs.</li>
  <li><strong>Medication Patches:</strong> Remove patches and wipe the area clean before applying pads.</li>
</ul>`,
        order: 2,
      }
    ],
    quiz: {
      title: "Module 3 Quiz",
      passingScore: 100,
      questions: [
        {
          question: "What is the very first step when an AED arrives?",
          options: ["Attach the pads", "Press the shock button", "Power on the AED", "Clear the victim"],
          correctAnswer: "Power on the AED",
          explanation: "Powering on the AED allows the device to guide you through the remaining steps.",
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
        title: "Pediatric Pulse & Breathing Recognition",
        content: `<h2>Age-Specific Assessments</h2>
<ul>
  <li><strong>Infant (<1 year):</strong> Brachial pulse check.</li>
  <li><strong>Child (1 year to Puberty):</strong> Carotid or femoral pulse check.</li>
</ul>
<p><strong>Bradycardia with Poor Perfusion:</strong> If the heart rate is ≤60 bpm with signs of poor perfusion (cyanosis, lethargy) despite oxygenation/ventilation, start CPR.</p>`,
        order: 1,
      },
      {
        title: "Pediatric Compression Techniques",
        content: `<h2>Compressions & Ratios</h2>
<ul>
  <li><strong>Infant Depth:</strong> 1.5 inches (4 cm). Use 2-finger technique (1 rescuer) or 2-thumb-encircling hands (2 rescuers).</li>
  <li><strong>Child Depth:</strong> 2 inches (5 cm). Use 1 or 2 hands depending on child size.</li>
  <li><strong>Ratios:</strong>
    <ul>
      <li>1 Rescuer: 30:2</li>
      <li>2 Rescuers: 15:2 (Healthcare Provider standard)</li>
    </ul>
  </li>
</ul>`,
        order: 2,
      }
    ],
    quiz: {
      title: "Module 4 Quiz",
      passingScore: 80,
      questions: [
        {
          question: "What is the compression-to-ventilation ratio for 2-rescuer pediatric BLS?",
          options: ["30:2", "15:2", "15:1", "5:1"],
          correctAnswer: "15:2",
          explanation: "Healthcare providers use 15:2 for 2-rescuer pediatric CPR to provide more frequent ventilations for respiratory-driven arrests.",
        }
      ],
    },
  },
  {
    title: "Module 5: Team Dynamics & Multi-Rescuer Coordination",
    description: "Operating in a high-performance team to maximize survival.",
    duration: 40,
    order: 5,
    sections: [
      {
        title: "High-Performance Team Roles",
        content: `<h2>Structure Leads to Success</h2>
<p>In a healthcare setting, resuscitation is a team effort. Clear roles prevent confusion:</p>
<ul>
  <li><strong>Team Leader:</strong> Assigns roles, makes decisions, and monitors quality.</li>
  <li><strong>Compressor:</strong> Performs high-quality chest compressions.</li>
  <li><strong>Airway:</strong> Manages ventilation and airway adjuncts.</li>
  <li><strong>AED/Monitor/Defibrillator:</strong> Operates the device and monitors the rhythm.</li>
</ul>
<div class="clinical-note">
  <strong>The 2-Minute Switch:</strong> Compressors should switch roles every 2 minutes (or 5 cycles) to prevent fatigue and maintain compression quality.
</div>`,
        order: 1,
      },
      {
        title: "Communication Protocols",
        content: `<h2>Closed-Loop Communication</h2>
<p>To ensure orders are understood and executed correctly:</p>
<ol>
  <li>The Team Leader gives a clear, specific order ("John, please give 1mg of Epinephrine").</li>
  <li>The team member repeats the order ("Giving 1mg of Epinephrine").</li>
  <li>The team member announces when the task is done ("1mg of Epinephrine given").</li>
</ol>`,
        order: 2,
      }
    ],
    quiz: {
      title: "Module 5 Quiz",
      passingScore: 100,
      questions: [
        {
          question: "What is the most effective way to maintain high-quality compressions during a long resuscitation?",
          options: [
            "Use a mechanical CPR device only",
            "Have one person do compressions until they are exhausted",
            "Switch compressors every 2 minutes or 5 cycles",
            "Stop compressions for 30 seconds to rest"
          ],
          correctAnswer: "Switch compressors every 2 minutes or 5 cycles",
          explanation: "Regular rotation prevents fatigue-related drops in compression depth and rate.",
        }
      ],
    },
  },
  {
    title: "Module 6: Airway Management & Special Situations",
    description: "Advanced techniques and resuscitation in unique environments.",
    duration: 50,
    order: 6,
    sections: [
      {
        title: "Rescue Breathing & Advanced Airway CPR",
        content: `<h2>Ventilation Without Arrest</h2>
<p>If the patient has a pulse but is not breathing normally (Respiratory Arrest):</p>
<ul>
  <li><strong>Adult:</strong> 1 breath every 6 seconds (10 breaths/min).</li>
  <li><strong>Pediatric:</strong> 1 breath every 2–3 seconds (20–30 breaths/min).</li>
</ul>
<h2>CPR with an Advanced Airway</h2>
<p>Once an advanced airway (Endotracheal Tube, Supraglottic Airway) is in place, compressions are performed <strong>continuously</strong> at a rate of 100–120/min without pauses for breaths.</p>
<ul>
  <li><strong>Adult Ventilation:</strong> 1 breath every 6 seconds (10 breaths/min).</li>
  <li><strong>Pediatric Ventilation:</strong> 1 breath every 2–3 seconds (20–30 breaths/min).</li>
</ul>
<div class="clinical-note">
  <strong>Capnography:</strong> Continuous waveform capnography is the gold standard for confirming ETT placement and monitoring CPR quality. An ETCO₂ <10 mmHg indicates the need to improve compression depth or rate. A sudden increase to 35–40 mmHg suggests ROSC.
</div>`,
        order: 1,
      },
      {
        title: "Opioids, Drowning, & Pregnancy",
        content: `<h2>Environmental & Patient Factors</h2>
<ul>
  <li><strong>Opioids:</strong> If respiratory arrest is suspected, give Naloxone. If in cardiac arrest, start CPR first.</li>
  <li><strong>Drowning:</strong> Arrest is hypoxic. Start with 5 initial ventilations before beginning compressions.</li>
  <li><strong>Pregnancy:</strong> Perform manual <strong>Left Uterine Displacement (LUD)</strong> to relieve pressure on the vena cava. Do not tilt the patient.</li>
</ul>`,
        order: 2,
      },
      {
        title: "Foreign Body Airway Obstruction (Choking)",
        content: `<h2>Relieving Obstruction</h2>
<ul>
  <li><strong>Adult/Child:</strong> Abdominal thrusts (Heimlich maneuver).</li>
  <li><strong>Infant:</strong> 5 back slaps and 5 chest thrusts.</li>
  <li><strong>Unresponsive:</strong> If the victim becomes unresponsive, start CPR immediately. Look for the object in the mouth before giving breaths.</li>
</ul>`,
        order: 3,
      }
    ],
    quiz: {
      title: "Module 6 Quiz",
      passingScore: 80,
      questions: [
        {
          question: "How should you manage a pregnant patient in cardiac arrest?",
          options: [
            "Place her in a 30-degree left lateral tilt",
            "Perform manual left uterine displacement (LUD) while she is supine",
            "Elevate her legs to increase blood return",
            "Do not perform compressions to avoid hurting the fetus"
          ],
          correctAnswer: "Perform manual left uterine displacement (LUD) while she is supine",
          explanation: "LUD is preferred over lateral tilt as it allows for higher quality chest compressions on a flat surface.",
        }
      ],
    },
  },
  {
    title: "Module 7: First Aid Essentials for Healthcare Providers",
    description: "Managing life-threatening non-cardiac emergencies.",
    duration: 40,
    order: 7,
    sections: [
      {
        title: "Life-Threatening Bleeding",
        content: `<h2>Stop the Bleed</h2>
<p>Uncontrolled bleeding is a leading cause of preventable death after injury.</p>
<ul>
  <li><strong>Direct Pressure:</strong> Apply firm, steady pressure directly over the wound with a clean cloth or gauze.</li>
  <li><strong>Tourniquets:</strong> If direct pressure fails to control life-threatening bleeding on an arm or leg, apply a tourniquet 2-3 inches above the wound. Tighten until bleeding stops.</li>
  <li><strong>Wound Packing:</strong> For deep wounds in the neck, shoulder, or groin, pack the wound tightly with gauze and apply pressure.</li>
</ul>`,
        order: 1,
      },
      {
        title: "Anaphylaxis & Epi-Pen Use",
        content: `<h2>Severe Allergic Reactions</h2>
<p>Anaphylaxis is a life-threatening allergic reaction that can cause airway swelling and shock.</p>
<ul>
  <li><strong>Signs:</strong> Hives, swelling of face/tongue, difficulty breathing, wheezing, rapid pulse.</li>
  <li><strong>Treatment:</strong> Administer Epinephrine via an auto-injector (Epi-Pen) into the outer thigh. Hold for 3-10 seconds.</li>
</ul>`,
        order: 2,
      }
    ],
    quiz: {
      title: "Module 7 Quiz",
      passingScore: 80,
      questions: [
        {
          question: "What is the first-line treatment for life-threatening bleeding on an extremity that is not controlled by direct pressure?",
          options: ["Elevation", "Apply a tourniquet", "Ice pack", "Wound packing only"],
          correctAnswer: "Apply a tourniquet",
          explanation: "A tourniquet is the standard of care for uncontrolled extremity bleeding.",
        }
      ],
    },
  }
];
