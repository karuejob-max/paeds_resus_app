/**
 * BLS Provider Course — Updated Curriculum (v2), aligned to the AHA 2025 Guidelines.
 *
 * IMPORTANT: this is a NEW course version. The original curriculum in
 * `bls-modules-data.ts` is frozen: learners already enrolled keep reading the
 * course row their enrollment points at. Never edit v1 content to deliver v2.
 *
 * Content needs sign-off by a clinical reviewer against the current AHA BLS
 * Provider Manual before release (see docs/BLS_V2_ROLLOUT.md).
 */
import type { BLSModule } from "./bls-modules-data";

export const BLS_V2_COURSE_TITLE = "BLS Provider Course — Updated Curriculum (AHA 2025)";

export const BLS_V2_COURSE_DESCRIPTION =
  "Basic Life Support for healthcare providers aligned to the AHA 2025 Guidelines: unified Chain of Survival, adult and pediatric CPR, AED use and special circumstances, respiratory arrest, opioid emergencies, choking, team dynamics, advanced airway, drowning and pregnancy. Hands-on skills are assessed separately by an approved instructor.";

export const BLS_MODULES_V2: BLSModule[] = [
  {
    title: "Module 1: Foundations, Chain of Survival & Recognition",
    description: "The unified Chain of Survival, recognising cardiac arrest, and activating help.",
    duration: 30,
    order: 1,
    sections: [
      {
        title: "The Unified 2025 Chain of Survival",
        order: 1,
        content: `<h2>One Chain for Everyone</h2>
<p>The 2025 Guidelines use a single Chain of Survival for adults and children, in and out of hospital. Each link depends on the one before it.</p>
<ol>
  <li><strong>Recognition and emergency activation:</strong> recognise arrest and call for help immediately.</li>
  <li><strong>High-quality CPR:</strong> compressions and breaths that keep blood moving to the brain and heart.</li>
  <li><strong>Defibrillation:</strong> an AED or manual defibrillator as early as possible for shockable rhythms.</li>
  <li><strong>Advanced resuscitation:</strong> team-based care with advanced airway and medications.</li>
  <li><strong>Post-cardiac arrest care:</strong> integrated hospital care after the heart restarts.</li>
  <li><strong>Recovery:</strong> rehabilitation and psychological support for survivors, families and rescuers.</li>
</ol>
<div class="clinical-note"><strong>Why it matters:</strong> every minute without CPR and defibrillation lowers the chance of survival. Bystander CPR at least doubles survival, so starting early, even imperfectly, saves lives. Basic life support is links 1 to 3, and this course teaches you to do them well.</div>`,
      },
      {
        title: "Recognising Cardiac Arrest",
        order: 2,
        content: `<h2>Recognising Cardiac Arrest</h2>
<p>Suspect cardiac arrest when a person is <strong>unresponsive</strong> and <strong>not breathing normally</strong>.</p>
<ol>
  <li><strong>Check the scene is safe</strong> for you, the patient and bystanders.</li>
  <li><strong>Check responsiveness:</strong> tap the shoulders firmly and shout.</li>
  <li><strong>Look for breathing and check a pulse at the same time</strong>, for no more than 10 seconds. Use the carotid or femoral pulse in adults and children, and the brachial pulse in infants.</li>
  <li><strong>No normal breathing and no definite pulse:</strong> treat as cardiac arrest and begin CPR.</li>
</ol>
<div class="warning-note"><strong>Agonal gasping is not normal breathing.</strong> Slow, noisy, irregular gasps can continue for minutes after the heart stops. If the person is unresponsive and only gasping, start CPR. If you are unsure, start CPR.</div>
<p>Do not spend more than 10 seconds on the pulse check. If you cannot feel a definite pulse in that time, start compressions.</p>`,
      },
      {
        title: "Activating Help, Alone or With Others",
        order: 3,
        content: `<h2>Activating Help</h2>
<p>Call your local emergency number (for example 911, 999 or 112) or your facility's emergency response system. Use the number that applies where you work.</p>
<ul>
  <li><strong>You have a phone:</strong> call, put the phone on speaker, and start CPR while the dispatcher guides you. Stay on the line.</li>
  <li><strong>Bystanders are present:</strong> point to one person and tell them to call and bring an AED, then begin CPR.</li>
  <li><strong>Adult, alone, no phone:</strong> leave the person only long enough to call for help and bring an AED, then return and start CPR.</li>
  <li><strong>In a facility:</strong> activate the code or rapid response system and call for the defibrillator.</li>
</ul>
<p>Dispatchers give different instructions for adults and for children, so listen to the questions they ask and follow their directions. Pediatric lone-rescuer timing is different and is covered in Module 4.</p>
<div class="clinical-note"><strong>Equity matters:</strong> people are sometimes less likely to receive bystander CPR because of embarrassment or fear of causing harm, including women. CPR on any person in cardiac arrest is the right action. You cannot make a person in cardiac arrest worse.</div>`,
      },
    ],
    quiz: {
      title: "Module 1 Knowledge Check",
      passingScore: 80,
      questions: [
        {
          question: "An unresponsive adult is making occasional slow, noisy gasps. What is the correct interpretation?",
          options: [
            "Normal breathing, so place the person in the recovery position",
            "Agonal gasping, which is a sign of cardiac arrest",
            "A sign the person is recovering",
            "A reason to wait 2 minutes and reassess",
          ],
          correctAnswer: "Agonal gasping, which is a sign of cardiac arrest",
          explanation: "Agonal gasping is not effective breathing. In an unresponsive person it means cardiac arrest, so start CPR.",
        },
        {
          question: "How long should the combined breathing and pulse check take?",
          options: ["No more than 10 seconds", "About 30 seconds", "A full minute", "Until a pulse is felt"],
          correctAnswer: "No more than 10 seconds",
          explanation: "Spending longer delays CPR. If no definite pulse is found within 10 seconds, begin compressions.",
        },
        {
          question: "You are alone with a collapsed adult and you have a mobile phone. What should you do?",
          options: [
            "Leave the person to look for an AED before calling",
            "Call the emergency number, put the phone on speaker, and start CPR",
            "Start CPR for 2 minutes before calling",
            "Wait for a bystander to arrive",
          ],
          correctAnswer: "Call the emergency number, put the phone on speaker, and start CPR",
          explanation: "A phone on speaker lets you call and begin CPR at the same time while the dispatcher guides you.",
        },
      ],
    },
  },
  {
    title: "Module 2: Adult High-Quality CPR & Rescue Breaths",
    description: "The components of high-quality CPR, giving breaths, and one- and two-rescuer CPR.",
    duration: 40,
    order: 2,
    sections: [
      {
        title: "Components of High-Quality CPR",
        order: 1,
        content: `<h2>Components of High-Quality CPR</h2>
<table>
  <tr><th>Component</th><th>Adult target</th></tr>
  <tr><td>Hand position</td><td>Heel of one hand on the lower half of the breastbone, other hand on top</td></tr>
  <tr><td>Rate</td><td>100 to 120 compressions per minute</td></tr>
  <tr><td>Depth</td><td>At least 5 cm (2 inches); avoid pressing deeper than 6 cm (2.4 inches)</td></tr>
  <tr><td>Recoil</td><td>Allow the chest to return fully after every compression; do not lean on the chest</td></tr>
  <tr><td>Interruptions</td><td>Keep pauses under 10 seconds</td></tr>
  <tr><td>Chest compression fraction</td><td>The share of resuscitation time spent giving compressions; aim as high as possible, and at least 60%</td></tr>
  <tr><td>Surface</td><td>Firm, flat surface; put the person on the floor or use a backboard</td></tr>
</table>
<div class="clinical-note"><strong>Why recoil matters:</strong> the heart fills while the chest recoils. Leaning keeps pressure in the chest and reduces blood flow back to the heart.</div>
<p>Compressions are tiring. Change the compressor about every 2 minutes, or sooner if fatigued, and keep the swap under 5 seconds.</p>`,
      },
      {
        title: "Giving Breaths and the 30:2 Cycle",
        order: 2,
        content: `<h2>Giving Breaths and the 30:2 Cycle</h2>
<p>Healthcare providers give breaths as well as compressions. Hands-only CPR is for untrained rescuers or those unwilling or unable to give breaths.</p>
<ol>
  <li>Open the airway with a head tilt and chin lift. If you suspect a neck injury, use a jaw thrust.</li>
  <li>Give each breath over about <strong>1 second</strong>, with enough volume to see the chest rise.</li>
  <li>Give <strong>2 breaths after every 30 compressions</strong>, taking no more than 10 seconds for the two breaths.</li>
  <li>Do not over-ventilate. Too many breaths or too much force raises chest pressure, reduces blood return to the heart, and can fill the stomach.</li>
</ol>
<h3>Barrier and bag-mask devices</h3>
<ul>
  <li><strong>Pocket mask:</strong> seal with both hands while lifting the jaw, and breathe through the one-way valve.</li>
  <li><strong>Bag-mask:</strong> two rescuers are better than one. One rescuer holds the mask sealed with both hands while the other squeezes the bag just enough to see the chest rise.</li>
</ul>`,
      },
      {
        title: "One and Two Rescuers in Practice",
        order: 3,
        content: `<h2>One and Two Rescuers</h2>
<ul>
  <li><strong>One rescuer:</strong> 30 compressions then 2 breaths.</li>
  <li><strong>Two rescuers (adult):</strong> the ratio is still 30:2. One compresses while the other manages the airway and breaths. Swap roles about every 2 minutes.</li>
  <li><strong>Defibrillator:</strong> keep doing CPR while the AED is being brought and the pads applied.</li>
</ul>
<h3>Practical points</h3>
<ul>
  <li>Start CPR where the person is found, if it is safe and you can do effective compressions. Move only if the location is dangerous.</li>
  <li>Mechanical CPR devices are not recommended for routine use. They may be considered when manual CPR is difficult or unsafe, such as in a moving ambulance.</li>
  <li>Do not stop CPR except to analyse the rhythm, deliver a shock, change compressors, or when the person shows clear signs of life or help takes over.</li>
</ul>`,
      },
    ],
    quiz: {
      title: "Module 2 Knowledge Check",
      passingScore: 80,
      questions: [
        {
          question: "Which adult compression depth is recommended?",
          options: [
            "At least 5 cm (2 inches), avoiding more than 6 cm (2.4 inches)",
            "About 2.5 cm (1 inch)",
            "As deep as possible",
            "At least 8 cm (3 inches)",
          ],
          correctAnswer: "At least 5 cm (2 inches), avoiding more than 6 cm (2.4 inches)",
          explanation: "Adequate depth is needed for blood flow, but pressing beyond about 6 cm can injure the chest.",
        },
        {
          question: "Why should you avoid leaning on the chest between compressions?",
          options: [
            "It tires the rescuer faster",
            "It stops the chest from recoiling, so the heart cannot refill properly",
            "It damages the AED pads",
            "It makes the rate too slow",
          ],
          correctAnswer: "It stops the chest from recoiling, so the heart cannot refill properly",
          explanation: "The heart refills during recoil. Leaning keeps pressure on the chest and lowers blood flow.",
        },
        {
          question: "With two rescuers and no advanced airway, what is the adult compression-to-breath ratio?",
          options: ["15:2", "30:2", "5:1", "Continuous compressions"],
          correctAnswer: "30:2",
          explanation: "Adults use 30:2 whether there are one or two rescuers. Switching to 15:2 applies to children with two rescuers.",
        },
      ],
    },
  },
  {
    title: "Module 3: Defibrillation & AED Use",
    description: "Using an AED, 2025 pad placement, and special circumstances.",
    duration: 35,
    order: 3,
    sections: [
      {
        title: "Using an AED: The Universal Steps",
        order: 1,
        content: `<h2>Using an AED</h2>
<p>Early defibrillation is critical for shockable rhythms. Use the AED as soon as it arrives. Keep doing CPR while it is brought and while you apply the pads.</p>
<ol>
  <li><strong>Turn on</strong> the AED and follow the voice prompts.</li>
  <li><strong>Attach the pads</strong> to bare, dry skin.</li>
  <li><strong>Let it analyse.</strong> Nobody touches the patient.</li>
  <li><strong>If a shock is advised:</strong> make sure everyone is clear, then press the shock button.</li>
  <li><strong>Resume CPR immediately</strong> for 2 minutes, starting with compressions. The AED will prompt you to reanalyse.</li>
</ol>
<div class="clinical-note"><strong>If no shock is advised:</strong> do not stop. Resume CPR straight away and continue until the AED prompts a new analysis or help takes over. "No shock advised" does not mean the person is alive.</div>`,
      },
      {
        title: "Pad Placement (2025) and the Bra Question",
        order: 2,
        content: `<h2>Adult Pad Placement</h2>
<ul>
  <li><strong>Pad 1:</strong> upper right chest, just below the collarbone, to the right of the breastbone.</li>
  <li><strong>Pad 2:</strong> left side of the chest, on the lower ribs, with the centre of the pad on the line down from the armpit (midaxillary line).</li>
  <li>Pads must be on bare skin and firmly attached, without wrinkles or air pockets.</li>
</ul>
<h3>Breast tissue and clothing</h3>
<p>Move breast tissue aside rather than placing the pad on top of it. The 2025 Guidelines say it may be reasonable to adjust (move or lift) a bra instead of removing it, as long as the pads sit on bare skin and make good contact. Do not delay the shock over clothing. Cut or remove clothing that gets in the way.</p>`,
      },
      {
        title: "AED Special Circumstances",
        order: 3,
        content: `<h2>AED Special Circumstances</h2>
<table>
  <tr><th>Situation</th><th>What to do</th></tr>
  <tr><td>Pacemaker or implanted defibrillator (a hard lump under the skin, usually upper chest)</td><td>Do not place a pad directly over the device. Place it at least 2.5 cm (1 inch) away.</td></tr>
  <tr><td>Medication patch on the chest (for example nitroglycerin)</td><td>Remove the patch and wipe the skin before applying the pad.</td></tr>
  <tr><td>Very hairy chest</td><td>Press the pad down firmly. If hair stops it sticking, quickly remove the hair in the pad area. Do not delay the shock.</td></tr>
  <tr><td>Wet chest</td><td>Dry the chest quickly before applying pads.</td></tr>
  <tr><td>Person in or beside water (for example a pool)</td><td>Remove the person from the water first, dry the chest, and move away from standing water before using the AED.</td></tr>
</table>
<div class="warning-note"><strong>Safety:</strong> make sure nobody is touching the patient when a shock is delivered. Do not use an AED in a puddle or while the patient is in water.</div>`,
      },
    ],
    quiz: {
      title: "Module 3 Knowledge Check",
      passingScore: 80,
      questions: [
        {
          question: "The AED advises no shock. What do you do next?",
          options: [
            "Stop CPR because the heart is beating",
            "Resume CPR immediately and continue until the next analysis",
            "Remove the pads and check for breathing for a minute",
            "Press the shock button anyway",
          ],
          correctAnswer: "Resume CPR immediately and continue until the next analysis",
          explanation: "No shock advised means the rhythm is not shockable, not that the person is alive. CPR continues.",
        },
        {
          question: "Where is the second adult pad placed in the 2025 standard position?",
          options: [
            "Directly over the centre of the breastbone",
            "On the left lateral chest, with the pad centre on the midaxillary line",
            "On the upper back",
            "Over the stomach",
          ],
          correctAnswer: "On the left lateral chest, with the pad centre on the midaxillary line",
          explanation: "One pad goes on the upper right chest and the other on the left side of the lower chest.",
        },
        {
          question: "A patient has a visible pacemaker lump under the skin on the upper right chest. How do you place the pad?",
          options: [
            "Directly over the device",
            "At least 2.5 cm (1 inch) away from the device",
            "Do not use the AED",
            "Remove the device first",
          ],
          correctAnswer: "At least 2.5 cm (1 inch) away from the device",
          explanation: "A pad over the device can reduce shock delivery and damage the device. Move the pad away.",
        },
      ],
    },
  },
  {
    title: "Module 4: Infant & Child BLS",
    description: "Pediatric definitions, technique, the lone-rescuer sequence and pediatric AED use.",
    duration: 40,
    order: 4,
    sections: [
      {
        title: "Who Is an Infant, a Child, an Adult?",
        order: 1,
        content: `<h2>Definitions</h2>
<ul>
  <li><strong>Infant:</strong> under 1 year of age.</li>
  <li><strong>Child:</strong> 1 year to puberty (signs of puberty include chest or underarm hair in boys and breast development in girls).</li>
  <li><strong>Adult:</strong> puberty and older. Use adult BLS.</li>
</ul>
<p>Cardiac arrest in infants and children is more often caused by a lack of oxygen (for example from choking, drowning or respiratory failure) than by a primary heart problem. Giving breaths is therefore especially important.</p>
<p>If an infant or child has a pulse of less than 60 per minute with poor circulation (poor colour, floppy, unresponsive) despite effective ventilation, start chest compressions.</p>`,
      },
      {
        title: "Infant and Child CPR Technique",
        order: 2,
        content: `<h2>Compressions and Breaths</h2>
<table>
  <tr><th></th><th>Child</th><th>Infant</th></tr>
  <tr><td>Rate</td><td>100 to 120 per minute</td><td>100 to 120 per minute</td></tr>
  <tr><td>Depth</td><td>At least one third of the chest depth, about 5 cm (2 inches)</td><td>At least one third of the chest depth, about 4 cm (1.5 inches)</td></tr>
  <tr><td>Technique</td><td>Heel of one or both hands on the lower half of the breastbone</td><td>Heel of one hand, or the two-thumb encircling-hands technique, on the lower half of the breastbone</td></tr>
  <tr><td>Pulse check</td><td>Carotid or femoral</td><td>Brachial</td></tr>
  <tr><td>Ratio, one rescuer</td><td>30:2</td><td>30:2</td></tr>
  <tr><td>Ratio, two or more rescuers</td><td>15:2</td><td>15:2</td></tr>
</table>
<div class="clinical-note"><strong>2025 update:</strong> the two-finger technique for infant compressions is no longer recommended. Use the heel of one hand, or two thumbs with your hands encircling the chest. Keep pauses in compressions under 10 seconds.</div>
<p>Give each breath over about 1 second with just enough volume to see the chest rise. Use a small, gentle breath for an infant.</p>`,
      },
      {
        title: "The Lone Rescuer Sequence",
        order: 3,
        content: `<h2>Lone Rescuer: Witnessed or Unwitnessed?</h2>
<ul>
  <li><strong>You have a phone:</strong> call the emergency number, put it on speaker, and start CPR. Stay on the line.</li>
  <li><strong>Collapse you witnessed (sudden collapse):</strong> activate the emergency response system and get an AED first, then start CPR.</li>
  <li><strong>Collapse you did not witness, alone and with no phone:</strong> start CPR with breaths for about 2 minutes first, then leave briefly to activate emergency help and get an AED, and return to continue CPR.</li>
  <li><strong>Second rescuer arrives:</strong> switch to 15:2 and use the two-rescuer technique.</li>
</ul>
<p>The reason for the difference: many children arrest because of lack of oxygen, so about 2 minutes of CPR with breaths helps before leaving. A sudden witnessed collapse is more likely a primary heart rhythm problem that needs a defibrillator quickly.</p>
<p>If you cannot or will not give breaths, do compressions only. That is better than doing nothing.</p>`,
      },
      {
        title: "Pediatric AED Use",
        order: 4,
        content: `<h2>Pediatric AED Use</h2>
<ul>
  <li><strong>Children under about 8 years:</strong> use pediatric pads or a pediatric dose-attenuator key if the AED has one. If none is available, use adult pads rather than not shocking.</li>
  <li><strong>Infants:</strong> a manual defibrillator is preferred. If unavailable, use an AED with a dose attenuator. If neither is available, an AED without an attenuator may be used.</li>
  <li><strong>Adolescents (puberty and older):</strong> use adult pads and the adult dose.</li>
  <li><strong>Pad position in a small chest:</strong> if the pads would touch or overlap, place one on the front of the chest and one on the back, between the shoulder blades.</li>
</ul>
<p>Do not delay a shock to find the perfect pad. A shock with adult pads is better than no shock.</p>`,
      },
    ],
    quiz: {
      title: "Module 4 Knowledge Check",
      passingScore: 80,
      questions: [
        {
          question: "Which infant chest compression technique is NO LONGER recommended in the 2025 Guidelines?",
          options: [
            "Two-thumb encircling-hands",
            "Heel of one hand",
            "Two-finger technique",
            "Using the lower half of the breastbone",
          ],
          correctAnswer: "Two-finger technique",
          explanation: "The two-finger technique is no longer recommended. Use the heel of one hand or two thumbs with encircling hands.",
        },
        {
          question: "You are alone with no phone and find an unresponsive child you did not see collapse. What is the correct sequence?",
          options: [
            "Leave to call and get an AED before any CPR",
            "Give about 2 minutes of CPR with breaths, then activate help and fetch an AED",
            "Give compressions only for 10 minutes",
            "Wait for another adult",
          ],
          correctAnswer: "Give about 2 minutes of CPR with breaths, then activate help and fetch an AED",
          explanation: "Unwitnessed pediatric arrest is often from lack of oxygen, so 2 minutes of CPR with breaths comes first when you have no phone.",
        },
        {
          question: "You have an AED but only adult pads for a 4-year-old child. What should you do?",
          options: [
            "Do not use the AED",
            "Use the adult pads rather than not shocking, placing them front and back if they would touch",
            "Wait for pediatric pads even if it takes 10 minutes",
            "Cut the pads in half",
          ],
          correctAnswer: "Use the adult pads rather than not shocking, placing them front and back if they would touch",
          explanation: "A shock with adult pads is better than no shock. If the pads touch, place one on the front and one on the back.",
        },
      ],
    },
  },
  {
    title: "Module 5: Respiratory Arrest & Opioid Emergencies",
    description: "Rescue breathing, recognising an opioid emergency, and giving naloxone safely.",
    duration: 35,
    order: 5,
    sections: [
      {
        title: "Respiratory Arrest and Rescue Breathing",
        order: 1,
        content: `<h2>Respiratory Arrest</h2>
<p>In respiratory arrest the person is not breathing, or only gasping, but <strong>still has a pulse</strong>. Without help it will progress to cardiac arrest, so breathe for them.</p>
<table>
  <tr><th>Age</th><th>Rescue breathing rate</th></tr>
  <tr><td>Adult</td><td>1 breath every 6 seconds (about 10 per minute)</td></tr>
  <tr><td>Child or infant</td><td>1 breath every 2 to 3 seconds (about 20 to 30 per minute)</td></tr>
</table>
<ul>
  <li>Give each breath over about 1 second with visible chest rise.</li>
  <li>Check the pulse about every 2 minutes (no more than 10 seconds).</li>
  <li>If the pulse is lost, start CPR and get the AED.</li>
</ul>`,
      },
      {
        title: "Recognising and Responding to an Opioid Emergency",
        order: 2,
        content: `<h2>Opioid Emergencies</h2>
<p>Suspect an opioid emergency when a person is unresponsive or very drowsy with slow, shallow or absent breathing, blue or grey lips, or gurgling, especially with signs of drug use or pill packaging nearby. Children can be affected by accidental ingestion.</p>
<ol>
  <li>Check the scene is safe.</li>
  <li>Check responsiveness and breathing; shout for help and activate emergency response.</li>
  <li>Get naloxone and an AED if available.</li>
  <li><strong>Pulse present, breathing absent or inadequate:</strong> give rescue breaths and give naloxone.</li>
  <li><strong>No pulse:</strong> start CPR and use the AED. Give naloxone if available as long as it does not delay or interrupt high-quality CPR.</li>
  <li><strong>Unresponsive but breathing normally:</strong> give naloxone, place in the recovery position, and keep watching the breathing.</li>
</ol>
<div class="clinical-note"><strong>Key point:</strong> naloxone does not replace breathing support or CPR. Oxygen is what restores the heart, so ventilation always comes first.</div>`,
      },
      {
        title: "Giving Naloxone and Caring for the Person Afterwards",
        order: 3,
        content: `<h2>Naloxone and Aftercare</h2>
<ul>
  <li>The dose and route (nasal spray, injection) depend on the product and your local protocol. Follow the device instructions or your protocol.</li>
  <li>Signs of response include more regular breathing and waking. If there is no response after a few minutes, give another dose if available and continue breathing support.</li>
  <li><strong>Naloxone can wear off before the opioid does.</strong> The person can become drowsy and stop breathing again, so do not leave them. Always call emergency services, even if the person improves.</li>
  <li>Place a breathing, unresponsive person in the recovery position and keep monitoring.</li>
</ul>
<div class="warning-note"><strong>Know your local rules:</strong> who may carry and give naloxone, and where it is available, vary by country, workplace and facility. Learn what applies to you.</div>`,
      },
    ],
    quiz: {
      title: "Module 5 Knowledge Check",
      passingScore: 80,
      questions: [
        {
          question: "An adult has a pulse but is not breathing. What is the rescue breathing rate?",
          options: [
            "1 breath every 6 seconds",
            "1 breath every 2 to 3 seconds",
            "2 breaths every 30 seconds",
            "1 breath every 15 seconds",
          ],
          correctAnswer: "1 breath every 6 seconds",
          explanation: "Adults need about 10 breaths per minute. Children and infants need 20 to 30 per minute.",
        },
        {
          question: "A person with suspected opioid overdose has a pulse but is not breathing. What is the priority?",
          options: [
            "Give naloxone and wait for it to work before doing anything else",
            "Give rescue breaths and give naloxone",
            "Start chest compressions immediately",
            "Place in the recovery position",
          ],
          correctAnswer: "Give rescue breaths and give naloxone",
          explanation: "Breathing support must not be delayed while waiting for naloxone to act.",
        },
        {
          question: "A person improves after naloxone. Why must you still call emergency services and stay?",
          options: [
            "Naloxone is never effective",
            "Naloxone can wear off before the opioid does, so breathing may stop again",
            "The person must be arrested",
            "Naloxone can only be given by paramedics",
          ],
          correctAnswer: "Naloxone can wear off before the opioid does, so breathing may stop again",
          explanation: "The person can relapse into respiratory depression and needs monitoring and medical assessment.",
        },
      ],
    },
  },
  {
    title: "Module 6: Choking (Foreign-Body Airway Obstruction)",
    description: "Mild versus severe choking, technique for adults, children and infants, and the unresponsive person.",
    duration: 35,
    order: 6,
    sections: [
      {
        title: "Mild or Severe? Recognising Choking",
        order: 1,
        content: `<h2>Mild or Severe Obstruction</h2>
<table>
  <tr><th>Mild (partial)</th><th>Severe (complete)</th></tr>
  <tr><td>Can cough forcefully, speak or cry, and is breathing</td><td>Cannot speak, cough effectively or breathe; silent or weak cough; may clutch the throat; may turn blue</td></tr>
  <tr><td>Encourage coughing, stay with the person, and watch closely</td><td>Act now: activate emergency response and give back blows and thrusts</td></tr>
</table>
<p>For mild choking do not slap the back or give thrusts. That can move the object into a worse position. Call for help if it does not clear or the person tires or worsens.</p>`,
      },
      {
        title: "Adults and Children (1 Year to Puberty)",
        order: 2,
        content: `<h2>Severe Choking in Adults and Children</h2>
<p>Activate emergency response, then alternate <strong>5 back blows</strong> and <strong>5 abdominal thrusts</strong> until the object comes out or the person becomes unresponsive.</p>
<ol>
  <li><strong>Back blows:</strong> lean the person forward and strike firmly between the shoulder blades with the heel of your hand.</li>
  <li><strong>Abdominal thrusts:</strong> stand behind, make a fist just above the navel, grasp it with the other hand, and pull sharply inward and upward. Make each thrust a separate, distinct movement.</li>
  <li>Repeat the cycle. Each thrust or blow should aim to clear the airway.</li>
</ol>
<div class="clinical-note"><strong>Pregnant or obese:</strong> use chest thrusts (hand position at the centre of the breastbone) instead of abdominal thrusts. <strong>Alone and choking:</strong> call for help if you can, and press your own abdomen against a firm edge such as the back of a chair.</div>`,
      },
      {
        title: "Infants and the Unresponsive Person",
        order: 3,
        content: `<h2>Infants Under 1 Year</h2>
<ol>
  <li>Hold the infant face down along your forearm, head lower than the chest, supporting the jaw.</li>
  <li>Give up to <strong>5 back slaps</strong> between the shoulder blades with the heel of your hand.</li>
  <li>Turn the infant face up, supporting the head, and give <strong>5 chest thrusts</strong> at the lower half of the breastbone, about one per second.</li>
  <li>Repeat. <strong>Do not give abdominal thrusts to infants.</strong></li>
</ol>
<h2>If the Person Becomes Unresponsive</h2>
<ol>
  <li>Lower the person to the ground and make sure emergency response is activated.</li>
  <li>Start CPR, beginning with compressions.</li>
  <li>Each time you open the airway to give breaths, look in the mouth. Remove an object only if you can see it. Do not sweep blindly with a finger.</li>
  <li>Use the AED when it arrives.</li>
</ol>`,
      },
    ],
    quiz: {
      title: "Module 6 Knowledge Check",
      passingScore: 80,
      questions: [
        {
          question: "An adult is coughing forcefully and can speak. What is the correct response?",
          options: [
            "Give abdominal thrusts immediately",
            "Encourage coughing and watch closely",
            "Give back blows and chest thrusts",
            "Lay the person flat",
          ],
          correctAnswer: "Encourage coughing and watch closely",
          explanation: "A forceful cough is the most effective way to clear a mild obstruction. Intervene only if it becomes severe.",
        },
        {
          question: "Which technique applies to a choking infant with a severe obstruction?",
          options: [
            "5 back slaps followed by 5 chest thrusts",
            "5 abdominal thrusts only",
            "A blind finger sweep",
            "Shaking the infant",
          ],
          correctAnswer: "5 back slaps followed by 5 chest thrusts",
          explanation: "Infants get back slaps and chest thrusts. Abdominal thrusts are not used under 1 year.",
        },
        {
          question: "A choking adult becomes unresponsive. What do you do?",
          options: [
            "Continue back blows only",
            "Lower to the ground, activate help, and start CPR, checking the mouth before breaths",
            "Give water",
            "Wait for the object to pass",
          ],
          correctAnswer: "Lower to the ground, activate help, and start CPR, checking the mouth before breaths",
          explanation: "Unresponsive choking is treated as cardiac arrest. Remove an object only if visible, with no blind sweeps.",
        },
      ],
    },
  },
  {
    title: "Module 7: Team Dynamics & Advanced Airway",
    description: "Roles, closed-loop communication, CPR quality coaching and ventilation with an advanced airway.",
    duration: 30,
    order: 7,
    sections: [
      {
        title: "Roles and Closed-Loop Communication",
        order: 1,
        content: `<h2>High-Performance Teams</h2>
<p>Resuscitation is a team activity. Everyone should know their role and speak up early.</p>
<ul>
  <li><strong>Team leader:</strong> directs the team, assigns roles, and keeps the overall picture.</li>
  <li><strong>Compressor:</strong> delivers high-quality compressions and rotates on request.</li>
  <li><strong>Airway and ventilation:</strong> opens the airway and gives breaths with a pocket mask or bag-mask.</li>
  <li><strong>AED or monitor:</strong> applies pads and operates the defibrillator.</li>
  <li><strong>Timer and recorder:</strong> tracks times, shocks and drugs.</li>
</ul>
<h3>Closed-loop communication</h3>
<ol>
  <li>The leader gives a clear, specific instruction to a named person.</li>
  <li>The person repeats it back to confirm they heard it.</li>
  <li>They report when it is done.</li>
</ol>
<p>Speak clearly and calmly, respect all team members, and make it safe for anyone to raise a concern.</p>`,
      },
      {
        title: "CPR Quality, Switching and Debriefing",
        order: 2,
        content: `<h2>Keeping CPR Quality High</h2>
<ul>
  <li>Coach the compressor on rate, depth and recoil. Use a feedback device when you have one.</li>
  <li>Aim for a high chest compression fraction and pauses under 10 seconds.</li>
  <li>Switch compressors about every 2 minutes. At 30:2 that is about 5 cycles; at 15:2 it is about 10 cycles. With an advanced airway, switch about every 2 minutes.</li>
  <li>Prepare the next step (pads, airway) during compressions so there is no extra pause.</li>
</ul>
<h3>Debrief after every event</h3>
<p>Ask what went well, what to improve, and how the team feels. Brief, supportive debriefing improves performance and looks after rescuers who may be distressed.</p>`,
      },
      {
        title: "Ventilation With an Advanced Airway",
        order: 3,
        content: `<h2>CPR With an Advanced Airway</h2>
<p>Once a supraglottic airway or tracheal tube is in place, <strong>stop cycling 30:2</strong>. Give continuous compressions at 100 to 120 per minute with no pauses for breaths.</p>
<table>
  <tr><th>Age</th><th>Ventilation rate with an advanced airway</th></tr>
  <tr><td>Adult</td><td>1 breath every 6 seconds (about 10 per minute)</td></tr>
  <tr><td>Child or infant</td><td>1 breath every 2 to 3 seconds (about 20 to 30 per minute)</td></tr>
</table>
<ul>
  <li>Give each breath over about 1 second with visible chest rise. Do not hyperventilate.</li>
  <li>Do not interrupt compressions for more than 10 seconds to place an airway. Defer it if it would cause a long pause.</li>
</ul>`,
      },
    ],
    quiz: {
      title: "Module 7 Knowledge Check",
      passingScore: 80,
      questions: [
        {
          question: "What does closed-loop communication require?",
          options: [
            "The leader repeats the instruction to themselves",
            "The receiver repeats the instruction back and reports when it is done",
            "Instructions are given to the whole team in general",
            "Only the leader may speak",
          ],
          correctAnswer: "The receiver repeats the instruction back and reports when it is done",
          explanation: "Repeating back and reporting completion confirms the message was received and the task finished.",
        },
        {
          question: "A team gives 15:2 CPR to a child. Roughly how many cycles fit in a 2-minute compressor rotation?",
          options: ["About 5", "About 10", "About 20", "About 2"],
          correctAnswer: "About 10",
          explanation: "At 15:2 each cycle is shorter, so about 10 cycles fit into 2 minutes, compared with about 5 at 30:2.",
        },
        {
          question: "An adult has an advanced airway in place during CPR. What is the correct approach?",
          options: [
            "Pause compressions after every 30 for 2 breaths",
            "Continuous compressions with 1 breath every 6 seconds",
            "Continuous compressions with 1 breath every 2 to 3 seconds",
            "Stop compressions while ventilating",
          ],
          correctAnswer: "Continuous compressions with 1 breath every 6 seconds",
          explanation: "With an advanced airway compressions are continuous and adults get about 10 breaths a minute.",
        },
      ],
    },
  },
  {
    title: "Module 8: Special Circumstances & After Arrest",
    description: "Drowning, pregnancy, the recovery position, and what happens after the heart restarts.",
    duration: 35,
    order: 8,
    sections: [
      {
        title: "Drowning",
        order: 1,
        content: `<h2>Drowning</h2>
<p>Drowning causes arrest through lack of oxygen, so <strong>breaths are essential</strong>.</p>
<ul>
  <li>Make sure the scene is safe. Do not enter the water unless trained and equipped.</li>
  <li>Activate emergency response and start CPR with breaths as soon as the person is out of the water. Trained rescuers may begin breaths early when it is safe.</li>
  <li>Give both breaths and compressions to every drowning arrest. If you cannot or will not give breaths, compressions only is acceptable.</li>
  <li>Do not delay CPR to fetch an AED. When it arrives, dry the chest, apply the pads, and follow the prompts.</li>
  <li>Do not try to drain water from the lungs, and do not give abdominal thrusts for drowning.</li>
</ul>`,
      },
      {
        title: "Cardiac Arrest in Pregnancy",
        order: 2,
        content: `<h2>Pregnancy</h2>
<p>Give standard high-quality CPR with the usual hand position, and use an AED in the usual way. Pregnancy changes what the team must also do.</p>
<ul>
  <li><strong>Call for help early</strong>, including the maternal and neonatal team where available.</li>
  <li><strong>Manual left uterine displacement:</strong> when the top of the uterus is at or above the navel (about 20 weeks or more), a rescuer pushes the uterus to the patient's left side by hand and keeps doing so. This relieves pressure on the large blood vessels.</li>
  <li>Do not tilt the patient onto her side, because compressions become less effective.</li>
  <li>Remove any fetal monitors that could get in the way of pads or compressions.</li>
</ul>
<p>The mother's survival is the best chance for the baby. Do not delay CPR or defibrillation.</p>`,
      },
      {
        title: "Recovery Position, Post-Arrest Care and Recovery",
        order: 3,
        content: `<h2>Recovery Position</h2>
<p>For a person who is <strong>unresponsive but breathing normally</strong>, with no suspected spinal injury: roll them onto their side, bend the upper leg to keep them stable, tilt the head back slightly to keep the airway open, and keep watching their breathing. If breathing stops, lay them on their back and start CPR.</p>
<h2>After the Heart Restarts</h2>
<ul>
  <li>Keep the airway open, watch breathing closely, and do not over-ventilate.</li>
  <li>Hand over to the team: time of collapse, bystander CPR, number of shocks, and any naloxone given.</li>
  <li>Post-cardiac arrest care (link 5) and recovery (link 6) continue for weeks. Survivors, families and rescuers may need physical, emotional and social support.</li>
</ul>`,
      },
    ],
    quiz: {
      title: "Module 8 Knowledge Check",
      passingScore: 80,
      questions: [
        {
          question: "Why are rescue breaths especially important in drowning?",
          options: [
            "Drowning is mainly a heart rhythm problem",
            "Drowning causes arrest through lack of oxygen",
            "Breaths remove water from the lungs",
            "Compressions are not effective in water",
          ],
          correctAnswer: "Drowning causes arrest through lack of oxygen",
          explanation: "The arrest follows hypoxia, so ventilation is needed alongside compressions.",
        },
        {
          question: "In a pregnant woman with the uterus at or above the navel, what additional action is recommended?",
          options: [
            "Tilt the patient onto her left side",
            "Manual left uterine displacement while giving CPR",
            "Delay CPR until the baby is delivered",
            "Place the AED pads on the abdomen",
          ],
          correctAnswer: "Manual left uterine displacement while giving CPR",
          explanation: "Manually shifting the uterus to the left relieves pressure on large vessels without making compressions less effective.",
        },
        {
          question: "Which person is placed in the recovery position?",
          options: [
            "Unresponsive and not breathing",
            "Unresponsive but breathing normally, with no suspected spinal injury",
            "Responsive and talking",
            "Choking and unable to cough",
          ],
          correctAnswer: "Unresponsive but breathing normally, with no suspected spinal injury",
          explanation: "The recovery position protects the airway of someone who is breathing normally but not responding.",
        },
      ],
    },
  },
];
