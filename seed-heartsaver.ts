/**
 * Heartsaver Course Content Seed
 * Aligned with: AHA Heartsaver CPR AED 2020 Guidelines
 * Target audience: Lay rescuers, non-clinical healthcare workers, school staff, parents
 * Structure: 4 modules × 4 sections + formative quiz per module
 */
import * as dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

const modules = [
  {
    order: 1,
    title: "Module 1: Recognising Cardiac Arrest and Calling for Help",
    description: "Recognise the signs of cardiac arrest and activate the emergency response system.",
    content: "The first step in saving a life is recognising that someone needs help and calling for emergency services immediately.",
    duration: 15,
    sections: [
      {
        order: 1,
        title: "Overview: The Chain of Survival",
        content: `<h2>The Chain of Survival</h2>
<p>The Chain of Survival describes the sequence of actions that maximise survival from cardiac arrest. Each link in the chain is critical — a weak link reduces survival.</p>
<h3>Out-of-Hospital Chain of Survival (Adult)</h3>
<ol>
  <li><strong>Recognition and activation:</strong> Recognise cardiac arrest; call emergency services (999/112/911)</li>
  <li><strong>Early CPR:</strong> High-quality CPR by bystander</li>
  <li><strong>Rapid defibrillation:</strong> Use AED as soon as available</li>
  <li><strong>Advanced resuscitation:</strong> Emergency medical services (EMS) take over</li>
  <li><strong>Post-cardiac arrest care:</strong> Hospital-based care</li>
  <li><strong>Recovery:</strong> Rehabilitation and psychological support</li>
</ol>
<div class="clinical-note">
  <strong>Why bystander CPR matters:</strong> Survival from out-of-hospital cardiac arrest drops by 7–10% for every minute without CPR. Bystander CPR doubles or triples survival rates. High-quality CPR started within 2 minutes of collapse is the single most important intervention a bystander can provide.
</div>
<h3>Cardiac Arrest Statistics</h3>
<table>
  <thead><tr><th>Statistic</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td>Out-of-hospital cardiac arrests per year (global)</td><td>~3.7 million</td></tr>
    <tr><td>Survival rate without bystander CPR</td><td>~5–8%</td></tr>
    <tr><td>Survival rate with bystander CPR</td><td>~15–20%</td></tr>
    <tr><td>Proportion witnessed by a bystander</td><td>~37%</td></tr>
    <tr><td>Proportion receiving bystander CPR</td><td>~40% (varies widely by country)</td></tr>
  </tbody>
</table>`
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
      title: "Check: Recognising Cardiac Arrest and Calling for Help",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "You find an adult collapsed on the floor. They do not respond when you tap their shoulders and shout. They are making occasional gasping sounds. What should you do?",
          options: JSON.stringify(["Place them in the recovery position and monitor", "Begin CPR immediately — gasping is a sign of cardiac arrest", "Wait to see if the gasping improves", "Check their pulse for 30 seconds before deciding"]),
          correctAnswer: "Begin CPR immediately — gasping is a sign of cardiac arrest",
          explanation: "Agonal breathing (gasping) is a sign of cardiac arrest, not normal breathing. Do not mistake it for normal breathing and delay CPR. If a person is unresponsive and not breathing normally (including gasping), begin CPR immediately."
        },
        {
          order: 2,
          questionText: "You are alone and find an adult in cardiac arrest. There is no AED nearby. What should you do first?",
          options: JSON.stringify(["Begin 2 minutes of CPR, then call emergency services", "Call emergency services first, then begin CPR", "Begin CPR and do not call — focus on compressions", "Wait for someone else to call"]),
          correctAnswer: "Call emergency services first, then begin CPR",
          explanation: "For a witnessed adult cardiac arrest, call emergency services first (or use speakerphone while doing CPR). The exception is for children — if you witness a child collapse, do 2 minutes of CPR first, then call, because paediatric arrests are usually respiratory in origin."
        },
        {
          order: 3,
          questionText: "When should you use the recovery position?",
          options: JSON.stringify(["For anyone who is unresponsive", "For an unresponsive person who is breathing normally", "For anyone who has had a cardiac arrest", "For anyone who is confused or drowsy"]),
          correctAnswer: "For an unresponsive person who is breathing normally",
          explanation: "The recovery position is for unresponsive people who are breathing normally. It keeps the airway open and prevents aspiration. Do NOT use the recovery position if the person is not breathing normally — begin CPR instead."
        }
      ]
    }
  },
  {
    order: 2,
    title: "Module 2: Adult CPR — Hands-Only and Standard",
    description: "Perform high-quality adult CPR using hands-only and standard (with breaths) techniques.",
    content: "High-quality CPR is the most important intervention a bystander can provide. This module covers adult CPR technique for lay rescuers.",
    duration: 20,
    sections: [
      {
        order: 1,
        title: "Overview: High-Quality CPR — What It Means",
        content: `<h2>High-Quality CPR — What It Means</h2>
<p>High-quality CPR is defined by five key elements. Each element is critical to maximising blood flow to the heart and brain during cardiac arrest.</p>
<h3>The Five Elements of High-Quality CPR</h3>
<table>
  <thead><tr><th>Element</th><th>Target</th></tr></thead>
  <tbody>
    <tr><td>Compression rate</td><td>100–120 compressions per minute</td></tr>
    <tr><td>Compression depth (adult)</td><td>At least 5 cm (2 inches); no more than 6 cm (2.4 inches)</td></tr>
    <tr><td>Full chest recoil</td><td>Allow complete chest recoil between compressions; do not lean on chest</td></tr>
    <tr><td>Minimise interruptions</td><td>Pause compressions for no more than 10 seconds (for breaths, rhythm check, or shock)</td></tr>
    <tr><td>Avoid excessive ventilation</td><td>1 breath over 1 second; visible chest rise; do not over-ventilate</td></tr>
  </tbody>
</table>
<div class="clinical-note">
  <strong>Compression fraction:</strong> The proportion of time spent doing compressions during CPR (chest compression fraction, CCF) should be at least 60%. Every interruption reduces coronary perfusion pressure and decreases survival.
</div>`
      },
      {
        order: 2,
        title: "Hands-Only CPR (Compression-Only CPR)",
        content: `<h2>Hands-Only CPR</h2>
<p>Hands-only CPR (compression-only CPR) is recommended for untrained bystanders and is as effective as standard CPR in the first few minutes of adult cardiac arrest.</p>
<h3>When to Use Hands-Only CPR</h3>
<ul>
  <li>You are not trained in CPR</li>
  <li>You are not comfortable giving rescue breaths</li>
  <li>The cardiac arrest was witnessed (adult)</li>
</ul>
<h3>How to Perform Hands-Only CPR</h3>
<ol>
  <li><strong>Position:</strong> Kneel beside the person; place them on their back on a firm, flat surface</li>
  <li><strong>Hand placement:</strong> Place the heel of one hand on the centre of the chest (lower half of sternum); place the other hand on top; interlace fingers</li>
  <li><strong>Body position:</strong> Arms straight; shoulders directly over hands; compress straight down</li>
  <li><strong>Compressions:</strong> Push hard and fast — at least 5 cm deep; 100–120 per minute</li>
  <li><strong>Recoil:</strong> Allow full chest recoil between compressions; do not lean on the chest</li>
  <li><strong>Continue:</strong> Do not stop until AED arrives, EMS takes over, or you are physically unable to continue</li>
</ol>
<div class="warning-note">
  <strong>Push hard and fast:</strong> Most bystanders do not compress deeply enough. You need to compress at least 5 cm (2 inches) — this requires significant force. Do not be afraid of hurting the person — rib fractures can occur but are acceptable in the context of cardiac arrest.
</div>`
      },
      {
        order: 3,
        title: "Standard CPR — Compressions with Rescue Breaths",
        content: `<h2>Standard CPR — Compressions with Rescue Breaths</h2>
<p>Standard CPR (30:2 ratio) is recommended for trained rescuers and is preferred for paediatric cardiac arrest, drowning, and prolonged arrest.</p>
<h3>CPR Ratio</h3>
<ul>
  <li><strong>Adult (1 or 2 rescuers):</strong> 30 compressions : 2 breaths</li>
  <li><strong>Child/Infant (2 rescuers):</strong> 15 compressions : 2 breaths</li>
  <li><strong>Child/Infant (1 rescuer):</strong> 30 compressions : 2 breaths</li>
</ul>
<h3>How to Give Rescue Breaths</h3>
<ol>
  <li>Open the airway: head-tilt chin-lift (tilt head back; lift chin)</li>
  <li>Pinch the nose closed</li>
  <li>Create a seal over the mouth</li>
  <li>Give 1 breath over 1 second — watch for chest rise</li>
  <li>Allow chest to fall; give second breath</li>
  <li>Resume compressions immediately</li>
</ol>
<div class="clinical-note">
  <strong>Visible chest rise is the target:</strong> Give just enough air to produce visible chest rise. Over-ventilation (too much air, too fast) causes gastric inflation, regurgitation, and reduced venous return — all of which worsen outcomes.
</div>
<h3>When Standard CPR is Preferred Over Hands-Only</h3>
<ul>
  <li>Paediatric cardiac arrest (respiratory cause predominates)</li>
  <li>Drowning (hypoxic arrest)</li>
  <li>Drug overdose (respiratory depression)</li>
  <li>Prolonged arrest (&gt;4–5 minutes without CPR)</li>
</ul>`
      },
      {
        order: 4,
        title: "CPR Fatigue and Team CPR",
        content: `<h2>CPR Fatigue and Team CPR</h2>
<p>CPR is physically demanding. Compression quality deteriorates significantly after 1–2 minutes. When multiple rescuers are present, rotate compressions every 2 minutes.</p>
<h3>Two-Rescuer CPR</h3>
<ul>
  <li>Rescuer 1: compressions (rotate every 2 minutes)</li>
  <li>Rescuer 2: airway and ventilation; operates AED</li>
  <li>Switch roles with minimal interruption (&lt;5 seconds)</li>
  <li>Announce switch: "Switch on next cycle"</li>
</ul>
<h3>Signs of Effective CPR</h3>
<ul>
  <li>Visible chest rise with each breath</li>
  <li>Palpable pulse with compressions (carotid or femoral)</li>
  <li>End-tidal CO₂ &gt;10 mmHg (if capnography available)</li>
  <li>Pupil changes (less reliable)</li>
</ul>
<div class="clinical-note">
  <strong>CPR feedback devices:</strong> Real-time CPR feedback devices (e.g., CPR meters, defibrillator feedback) can significantly improve compression rate, depth, and recoil. Use them when available.
</div>`
      }
    ],
    quiz: {
      title: "Check: Adult CPR",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "What is the correct compression depth for adult CPR?",
          options: JSON.stringify(["2–3 cm", "At least 5 cm (2 inches), no more than 6 cm (2.4 inches)", "7–8 cm", "1/3 of the chest AP diameter"]),
          correctAnswer: "At least 5 cm (2 inches), no more than 6 cm (2.4 inches)",
          explanation: "Adult CPR compression depth: at least 5 cm (2 inches), no more than 6 cm (2.4 inches). Compressions less than 5 cm are insufficient to generate adequate blood flow. Compressions greater than 6 cm increase the risk of injury without additional benefit."
        },
        {
          order: 2,
          questionText: "What is the correct compression-to-ventilation ratio for adult CPR with a single rescuer?",
          options: JSON.stringify(["15:2", "30:2", "5:1", "Compressions only — no breaths"]),
          correctAnswer: "30:2",
          explanation: "Adult CPR (1 or 2 rescuers): 30 compressions : 2 breaths. The 30:2 ratio maximises chest compression fraction while providing adequate ventilation. Hands-only CPR (compressions only) is acceptable for untrained bystanders or when the rescuer is not comfortable giving breaths."
        },
        {
          order: 3,
          questionText: "How often should rescuers rotate compressions during team CPR?",
          options: JSON.stringify(["Every 5 minutes", "Every 2 minutes", "Every 10 compressions", "Only when the compressor is exhausted"]),
          correctAnswer: "Every 2 minutes",
          explanation: "Compression quality deteriorates significantly after 1–2 minutes due to fatigue. Rescuers should rotate compressions every 2 minutes (or every 5 cycles of 30:2). The switch should take less than 5 seconds to minimise interruption to compressions."
        }
      ]
    }
  },
  {
    order: 3,
    title: "Module 3: AED Use and Defibrillation",
    description: "Operate an AED safely and effectively to deliver defibrillation for shockable cardiac arrest rhythms.",
    content: "Defibrillation within 3–5 minutes of collapse can achieve survival rates of 50–70%. This module covers AED use for lay rescuers.",
    duration: 15,
    sections: [
      {
        order: 1,
        title: "Overview: What is an AED?",
        content: `<h2>What is an AED?</h2>
<p>An Automated External Defibrillator (AED) is a portable electronic device that analyses the heart rhythm and delivers an electric shock (defibrillation) to restore a normal rhythm in ventricular fibrillation (VF) or pulseless ventricular tachycardia (pVT).</p>
<h3>Why AEDs Work</h3>
<ul>
  <li>VF is the most common initial rhythm in witnessed adult cardiac arrest (~50%)</li>
  <li>VF is a shockable rhythm — defibrillation is the only effective treatment</li>
  <li>Survival decreases by 7–10% for every minute without defibrillation</li>
  <li>AEDs are designed for use by untrained bystanders — they analyse the rhythm automatically and only shock if appropriate</li>
</ul>
<h3>AED Safety</h3>
<ul>
  <li>AEDs will NOT shock a normal rhythm — they only shock VF and pVT</li>
  <li>AEDs are safe to use on children (use paediatric pads/mode for children under 8 years or &lt;25 kg)</li>
  <li>AEDs can be used safely in rain, but avoid standing in water</li>
  <li>Remove medication patches from the chest before applying pads</li>
  <li>Do not place pads over an implanted pacemaker or ICD — place at least 2.5 cm away</li>
</ul>`
      },
      {
        order: 2,
        title: "How to Use an AED — Step by Step",
        content: `<h2>How to Use an AED — Step by Step</h2>
<h3>Universal AED Steps</h3>
<ol>
  <li><strong>Turn on the AED:</strong> Open the lid or press the power button. The AED will give voice prompts.</li>
  <li><strong>Attach the pads:</strong>
    <ul>
      <li>Expose the chest; dry if wet</li>
      <li>Peel backing from pads</li>
      <li>Place one pad on the upper right chest (below the right collarbone)</li>
      <li>Place the other pad on the lower left side (below and to the left of the left nipple)</li>
      <li>Connect the pads to the AED (if not pre-connected)</li>
    </ul>
  </li>
  <li><strong>Analyse the rhythm:</strong> The AED will say "Analysing rhythm — do not touch the patient." Stand clear; do not touch the patient.</li>
  <li><strong>Deliver shock (if advised):</strong>
    <ul>
      <li>The AED will say "Shock advised — stand clear"</li>
      <li>Ensure no one is touching the patient</li>
      <li>Press the shock button</li>
    </ul>
  </li>
  <li><strong>Resume CPR immediately:</strong> After the shock, resume CPR immediately. Do not wait to check for a pulse. Continue CPR for 2 minutes, then allow the AED to re-analyse.</li>
</ol>
<div class="warning-note">
  <strong>Minimise interruptions:</strong> The time between stopping compressions and delivering the shock should be less than 5 seconds. Resume CPR immediately after the shock — do not wait to check for a pulse.
</div>`
      },
      {
        order: 3,
        title: "Special AED Situations",
        content: `<h2>Special AED Situations</h2>
<h3>Children Under 8 Years or &lt;25 kg</h3>
<ul>
  <li>Use paediatric pads (attenuate energy to 50–75 J) if available</li>
  <li>If only adult pads available: use adult pads — do NOT delay defibrillation</li>
  <li>Pad placement: anterior-posterior (front and back) if pads are too large to fit on the chest without overlapping</li>
</ul>
<h3>Implanted Pacemaker or ICD</h3>
<ul>
  <li>You can still use an AED — do not delay defibrillation</li>
  <li>Place pads at least 2.5 cm (1 inch) away from the device</li>
  <li>The ICD may fire first — if it does, wait 30–60 seconds before using the AED</li>
</ul>
<h3>Transdermal Medication Patches</h3>
<ul>
  <li>Remove patches (nitroglycerin, nicotine, hormone patches) before applying AED pads</li>
  <li>Wipe the skin clean before applying pads</li>
</ul>
<h3>Wet or Hairy Chest</h3>
<ul>
  <li>Dry the chest quickly before applying pads (use a towel or clothing)</li>
  <li>If the chest is very hairy, quickly shave the pad areas if a razor is available; if not, press firmly and proceed</li>
</ul>`
      },
      {
        order: 4,
        title: "Integrating AED with CPR",
        content: `<h2>Integrating AED with CPR</h2>
<p>The AED and CPR must be integrated seamlessly to maximise survival. The goal is to minimise the time between stopping compressions and delivering the shock.</p>
<h3>Two-Rescuer AED Integration</h3>
<ul>
  <li>Rescuer 1: continuous CPR while Rescuer 2 sets up the AED</li>
  <li>Stop CPR only when the AED says "Analysing rhythm"</li>
  <li>Resume CPR immediately after the shock (or if no shock advised)</li>
  <li>Allow AED to re-analyse every 2 minutes</li>
</ul>
<h3>CPR + AED Sequence</h3>
<table>
  <thead><tr><th>Time</th><th>Action</th></tr></thead>
  <tbody>
    <tr><td>0:00</td><td>Recognise cardiac arrest; call for help; call emergency services</td></tr>
    <tr><td>0:00–2:00</td><td>Begin CPR; send someone for AED</td></tr>
    <tr><td>AED arrives</td><td>Turn on AED; attach pads (without stopping CPR)</td></tr>
    <tr><td>AED ready</td><td>Stop CPR; AED analyses; deliver shock if advised</td></tr>
    <tr><td>Immediately after shock</td><td>Resume CPR for 2 minutes</td></tr>
    <tr><td>Every 2 min</td><td>AED re-analyses; shock if advised; resume CPR</td></tr>
  </tbody>
</table>`
      }
    ],
    quiz: {
      title: "Check: AED Use",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "After delivering a shock with an AED, what should you do immediately?",
          options: JSON.stringify(["Check for a pulse", "Resume CPR immediately", "Wait for the AED to re-analyse", "Check if the person is breathing"]),
          correctAnswer: "Resume CPR immediately",
          explanation: "After delivering a shock, resume CPR immediately — do not wait to check for a pulse. The AED will re-analyse the rhythm after 2 minutes of CPR. Waiting to check for a pulse interrupts compressions and reduces survival."
        },
        {
          order: 2,
          questionText: "You need to use an AED on a 5-year-old child. You only have adult AED pads. What should you do?",
          options: JSON.stringify(["Do not use the AED — it is not safe for children", "Use adult pads — do not delay defibrillation", "Use only one pad on the chest", "Wait for paediatric pads to arrive"]),
          correctAnswer: "Use adult pads — do not delay defibrillation",
          explanation: "If paediatric pads are not available, use adult pads — do NOT delay defibrillation. Place pads in the anterior-posterior position (front and back) if they are too large to fit on the chest without overlapping. Defibrillation with adult pads is safer than no defibrillation."
        },
        {
          order: 3,
          questionText: "Where should AED pads be placed on an adult?",
          options: JSON.stringify(["Upper right chest and upper left chest", "Upper right chest (below right collarbone) and lower left side (below and left of left nipple)", "Centre of the chest and back", "Left side of the chest only"]),
          correctAnswer: "Upper right chest (below right collarbone) and lower left side (below and left of left nipple)",
          explanation: "Standard AED pad placement: one pad on the upper right chest (below the right collarbone) and one pad on the lower left side (below and to the left of the left nipple). This positions the pads to deliver current across the heart. Alternative: anterior-posterior placement (front and back) is acceptable."
        }
      ]
    }
  },
  {
    order: 4,
    title: "Module 4: Infant and Child CPR",
    description: "Perform CPR on infants and children using age-appropriate techniques.",
    content: "Paediatric CPR differs from adult CPR in technique, ratio, and emphasis on ventilation. This module covers CPR for infants and children.",
    duration: 20,
    sections: [
      {
        order: 1,
        title: "Overview: Key Differences in Paediatric CPR",
        content: `<h2>Key Differences in Paediatric CPR</h2>
<p>Paediatric cardiac arrest is usually caused by respiratory failure, not primary cardiac disease. This means ventilation is more important in children than in adults.</p>
<table>
  <thead><tr><th>Feature</th><th>Adult</th><th>Child (1–8 years)</th><th>Infant (&lt;1 year)</th></tr></thead>
  <tbody>
    <tr><td>Most common cause</td><td>Primary cardiac (VF)</td><td>Respiratory failure</td><td>Respiratory failure (SIDS, sepsis)</td></tr>
    <tr><td>Compression depth</td><td>≥5 cm</td><td>≥5 cm (or 1/3 AP diameter)</td><td>≥4 cm (or 1/3 AP diameter)</td></tr>
    <tr><td>Compression technique</td><td>Two hands</td><td>One or two hands</td><td>Two fingers (1 rescuer) or two-thumb encircling (2 rescuers)</td></tr>
    <tr><td>CPR ratio (1 rescuer)</td><td>30:2</td><td>30:2</td><td>30:2</td></tr>
    <tr><td>CPR ratio (2 rescuers)</td><td>30:2</td><td>15:2</td><td>15:2</td></tr>
    <tr><td>Airway opening</td><td>Head-tilt chin-lift</td><td>Head-tilt chin-lift (neutral-slight extension)</td><td>Neutral position (do not hyperextend)</td></tr>
  </tbody>
</table>
<div class="warning-note">
  <strong>Infant airway:</strong> In infants, the head is proportionally large and the occiput is prominent. Placing an infant flat will flex the neck and obstruct the airway. Place a small shoulder roll (folded towel) under the shoulders to achieve a neutral airway position.
</div>`
      },
      {
        order: 2,
        title: "Child CPR (1–8 Years)",
        content: `<h2>Child CPR (1–8 Years)</h2>
<h3>Steps for Child CPR</h3>
<ol>
  <li><strong>Check for response:</strong> Tap shoulders; shout "Are you OK?"</li>
  <li><strong>Call for help:</strong> Shout for help; send someone to call emergency services and get an AED</li>
  <li><strong>If alone:</strong> Do 2 minutes of CPR first, then call emergency services (respiratory cause — ventilation is priority)</li>
  <li><strong>Position:</strong> Place child on back on firm, flat surface</li>
  <li><strong>Open airway:</strong> Head-tilt chin-lift (neutral-slight extension)</li>
  <li><strong>Give 2 rescue breaths:</strong> Small breaths — just enough to see the chest rise</li>
  <li><strong>Compressions:</strong>
    <ul>
      <li>Place heel of one hand (or two hands for larger children) on the lower half of the sternum</li>
      <li>Compress at least 5 cm (or 1/3 AP diameter)</li>
      <li>Rate: 100–120 per minute</li>
      <li>Allow full recoil</li>
    </ul>
  </li>
  <li><strong>Ratio:</strong> 30:2 (1 rescuer); 15:2 (2 rescuers)</li>
</ol>
<div class="clinical-note">
  <strong>Calling first vs. CPR first:</strong> For a witnessed child collapse, do 2 minutes of CPR first, then call emergency services. For an unwitnessed child collapse (found collapsed), call first. The rationale: witnessed collapse in a child is more likely to be respiratory — 2 minutes of CPR may reverse the arrest before EMS arrives.
</div>`
      },
      {
        order: 3,
        title: "Infant CPR (Under 1 Year)",
        content: `<h2>Infant CPR (Under 1 Year)</h2>
<h3>Steps for Infant CPR</h3>
<ol>
  <li><strong>Check for response:</strong> Tap the foot; shout the infant's name</li>
  <li><strong>Call for help:</strong> Shout for help; do 2 minutes of CPR first if alone, then call</li>
  <li><strong>Position:</strong> Place infant on back on a firm surface (or hold on your forearm)</li>
  <li><strong>Open airway:</strong> Neutral position — do not hyperextend (use shoulder roll if needed)</li>
  <li><strong>Give 2 rescue breaths:</strong> Cover both mouth and nose with your mouth; give small puffs — just enough to see the chest rise</li>
  <li><strong>Compressions:</strong>
    <ul>
      <li><strong>1 rescuer:</strong> Two-finger technique — place 2 fingers on the lower half of the sternum (just below the nipple line)</li>
      <li><strong>2 rescuers:</strong> Two-thumb encircling technique — encircle the chest with both hands; place thumbs on the lower half of the sternum</li>
      <li>Compress at least 4 cm (or 1/3 AP diameter)</li>
      <li>Rate: 100–120 per minute</li>
    </ul>
  </li>
  <li><strong>Ratio:</strong> 30:2 (1 rescuer); 15:2 (2 rescuers)</li>
</ol>
<div class="clinical-note">
  <strong>Two-thumb encircling technique:</strong> The two-thumb encircling technique generates higher peak aortic pressure and coronary perfusion pressure than the two-finger technique. Use it whenever 2 rescuers are available.
</div>`
      },
      {
        order: 4,
        title: "Choking in Infants and Children",
        content: `<h2>Choking in Infants and Children</h2>
<p>Foreign body airway obstruction (FBAO) is a common paediatric emergency. Rapid recognition and correct technique can be lifesaving.</p>
<h3>Recognising Choking</h3>
<ul>
  <li><strong>Mild obstruction:</strong> Child can cough, cry, or speak; may wheeze</li>
  <li><strong>Severe obstruction:</strong> Cannot cough effectively; cannot cry or speak; high-pitched stridor or no sound; cyanosis; universal choking sign (hands to throat)</li>
</ul>
<h3>Management</h3>
<table>
  <thead><tr><th>Age</th><th>Mild Obstruction</th><th>Severe Obstruction (Conscious)</th><th>Unconscious</th></tr></thead>
  <tbody>
    <tr><td>Child (&gt;1 year)</td><td>Encourage coughing; do not intervene</td><td>5 back blows + 5 abdominal thrusts; repeat until cleared or unconscious</td><td>Begin CPR; look in mouth before each breath; remove visible object only</td></tr>
    <tr><td>Infant (&lt;1 year)</td><td>Encourage coughing; do not intervene</td><td>5 back blows + 5 chest thrusts (NOT abdominal thrusts); repeat until cleared or unconscious</td><td>Begin CPR; look in mouth before each breath; remove visible object only</td></tr>
  </tbody>
</table>
<div class="warning-note">
  <strong>Do NOT perform blind finger sweeps:</strong> Never perform a blind finger sweep to remove a foreign body — this can push the object deeper. Only remove an object if you can clearly see it.
</div>`
      }
    ],
    quiz: {
      title: "Check: Infant and Child CPR",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "You are alone and find a 3-year-old child unresponsive and not breathing. What should you do first?",
          options: JSON.stringify(["Call emergency services immediately before starting CPR", "Do 2 minutes of CPR, then call emergency services", "Begin CPR and do not call — focus on ventilation", "Place the child in the recovery position"]),
          correctAnswer: "Do 2 minutes of CPR, then call emergency services",
          explanation: "For a child collapse when you are alone, do 2 minutes of CPR first, then call emergency services. Paediatric cardiac arrest is usually respiratory in origin — 2 minutes of CPR (with ventilation) may reverse the arrest before EMS arrives. This differs from adult cardiac arrest where you call first."
        },
        {
          order: 2,
          questionText: "What is the correct compression technique for a single rescuer performing infant CPR?",
          options: JSON.stringify(["Two-thumb encircling technique", "Heel of one hand on the sternum", "Two fingers on the lower half of the sternum", "Three fingers on the centre of the chest"]),
          correctAnswer: "Two fingers on the lower half of the sternum",
          explanation: "For a single rescuer performing infant CPR, use the two-finger technique: place 2 fingers on the lower half of the sternum (just below the nipple line). The two-thumb encircling technique is preferred when 2 rescuers are available as it generates higher coronary perfusion pressure."
        },
        {
          order: 3,
          questionText: "A 6-month-old infant is choking and cannot cry or make sounds. What is the correct intervention?",
          options: JSON.stringify(["5 back blows + 5 abdominal thrusts", "5 back blows + 5 chest thrusts", "Perform a blind finger sweep to remove the object", "Begin CPR immediately"]),
          correctAnswer: "5 back blows + 5 chest thrusts",
          explanation: "For a choking infant with severe obstruction: 5 back blows + 5 chest thrusts (NOT abdominal thrusts). Abdominal thrusts are not used in infants under 1 year because the liver is large and unprotected. Alternate back blows and chest thrusts until the object is cleared or the infant becomes unconscious."
        }
      ]
    }
  }
];

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  
  // Extend programType enum to include heartsaver
  await conn.execute(`ALTER TABLE courses MODIFY COLUMN programType ENUM('bls','acls','pals','fellowship','instructor','fellowship_diploma','heartsaver') NOT NULL`);
  
  // Create Heartsaver course
  const [existing] = await conn.execute(`SELECT id FROM courses WHERE programType = 'heartsaver' LIMIT 1`);
  let heartsaverId: number;
  
  if ((existing as any[]).length > 0) {
    heartsaverId = (existing as any[])[0].id;
    console.log(`Heartsaver course already exists (ID: ${heartsaverId}), updating content...`);
  } else {
    const [result] = await conn.execute(
      `INSERT INTO courses (title, description, programType, duration, level, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        'Heartsaver CPR AED',
        'AHA Heartsaver CPR AED course for lay rescuers and non-clinical healthcare workers. Covers adult, child, and infant CPR, AED use, and choking relief.',
        'heartsaver',
        90,
        'beginner'
      ]
    );
    heartsaverId = (result as any).insertId;
    console.log(`Created Heartsaver course (ID: ${heartsaverId})`);
  }
  
  // Clear existing modules
  const [existingMods] = await conn.execute(`SELECT id FROM modules WHERE courseId = ?`, [heartsaverId]);
  for (const mod of existingMods as any[]) {
    await conn.execute(`DELETE FROM quizQuestions WHERE quizId IN (SELECT id FROM quizzes WHERE moduleId = ?)`, [mod.id]);
    await conn.execute(`DELETE FROM quizzes WHERE moduleId = ?`, [mod.id]);
    await conn.execute(`DELETE FROM moduleSections WHERE moduleId = ?`, [mod.id]);
  }
  await conn.execute(`DELETE FROM modules WHERE courseId = ?`, [heartsaverId]);
  
  for (const mod of modules) {
    const [modResult] = await conn.execute(
      `INSERT INTO modules (courseId, title, description, content, duration, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [heartsaverId, mod.title, mod.description, mod.content, mod.duration, mod.order]
    );
    const moduleId = (modResult as any).insertId;
    
    for (const section of mod.sections) {
      await conn.execute(
        `INSERT INTO moduleSections (moduleId, title, content, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [moduleId, section.title, section.content, section.order]
      );
    }
    
    const [quizResult] = await conn.execute(
      `INSERT INTO quizzes (moduleId, title, description, passingScore, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
      [moduleId, mod.quiz.title, mod.quiz.title, mod.quiz.passingScore]
    );
    const quizId = (quizResult as any).insertId;
    
    for (const q of mod.quiz.questions) {
      await conn.execute(
        `INSERT INTO quizQuestions (quizId, question, options, correctAnswer, explanation, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [quizId, q.questionText, q.options, q.correctAnswer, q.explanation, q.order]
      );
    }
    
    console.log(`  ✓ Module ${mod.order}: ${mod.title} (${mod.sections.length} sections, ${mod.quiz.questions.length} quiz questions)`);
  }
  
  console.log(`\nHeartsaver seeding complete: ${modules.length} modules, ${modules.reduce((a, m) => a + m.sections.length, 0)} sections, ${modules.reduce((a, m) => a + m.quiz.questions.length, 0)} quiz questions`);
  console.log(`Heartsaver course ID: ${heartsaverId}`);
  
  await conn.end();
}

main().catch(console.error);
