/**
 * PALS Course Content Seed - 2025 Edition
 * Course ID: 3 — Paediatric Advanced Life Support (PALS)
 * Aligned with: AHA PALS 2025 Guidelines
 * Author: Manus AI for Paeds Resus Platform
 */
import * as dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

const PALS_COURSE_ID = 3;

const modules = [
  {
    order: 1,
    title: "Module 1: The 2025 Systematic Approach & Science Updates",
    description: "Master the new physiology-directed resuscitation mindset and the consolidated 6-link Chain of Survival.",
    content: "The 2025 PALS update shifts from simple algorithms to physiology-directed care, emphasizing real-time hemodynamic targets.",
    duration: 30,
    sections: [
      {
        order: 1,
        title: "The 2025 Universal Chain of Survival",
        content: `<h2>The 2025 Universal Chain of Survival</h2>
<p>The AHA has consolidated the pediatric and adult chains into a single, universal 6-link chain. This reflects the reality that high-quality care is a continuum from the field to long-term recovery.</p>
<div class="clinical-note">
  <strong>The 6 Links of Survival:</strong>
  <ol>
    <li><strong>Activation of Emergency Response</strong> — Early recognition and calling for help.</li>
    <li><strong>High-Quality CPR</strong> — The foundation of all resuscitation.</li>
    <li><strong>Defibrillation</strong> — Rapid delivery of shocks for shockable rhythms.</li>
    <li><strong>Advanced Resuscitation</strong> — PALS algorithms, drugs, and advanced airways.</li>
    <li><strong>Post-Cardiac Arrest Care</strong> — Hemodynamic and temperature optimization.</li>
    <li><strong>Recovery</strong> — The new link focusing on long-term rehabilitation and survivorship.</li>
  </ol>
</div>
<h3>Why "Recovery" Matters</h3>
<p>Survival is no longer just about a pulse; it is about returning to a functional life. The 2025 guidelines mandate early evaluation for physical, cognitive, and behavioral challenges post-discharge.</p>`
      },
      {
        order: 2,
        title: "2025 Physiological Targets During CPR",
        content: `<h2>Physiology-Directed Resuscitation</h2>
<p>One of the most significant changes in 2025 is the shift toward using real-time physiology to guide CPR quality rather than just following a clock.</p>
<table>
  <thead><tr><th>Metric</th><th>2025 Target</th><th>Clinical Significance</th></tr></thead>
  <tbody>
    <tr><td><strong>Diastolic BP (Infants)</strong></td><td>≥25 mmHg</td><td>Ensures coronary perfusion pressure.</td></tr>
    <tr><td><strong>Diastolic BP (Children ≥1y)</strong></td><td>≥30 mmHg</td><td>Linked to improved survival with neuro recovery.</td></tr>
    <tr><td><strong>ETCO2</strong></td><td>Monitor trend</td><td>Indicator of CPR quality and ROSC; do not use as a sole termination rule.</td></tr>
  </tbody>
</table>
<div class="warning-note">
  <strong>The Diastolic Rule:</strong> If diastolic blood pressure is below these targets, the team must improve chest compression quality (depth, rate, or recoil) or consider vasopressors immediately.
</div>`
      },
      {
        order: 3,
        title: "Systematic Assessment: PAT & ABCDE",
        content: `<h2>The 30-Second Impression: PAT</h2>
<p>The Pediatric Assessment Triangle (PAT) remains the gold standard for initial assessment. It is an "across-the-room" visual and auditory assessment performed before touching the child.</p>
<ul>
  <li><strong>Appearance:</strong> Tone, Interactiveness, Consolability, Look/Gaze, Speech/Cry (TICLS).</li>
  <li><strong>Work of Breathing:</strong> Abnormal sounds, positioning, retractions, flaring.</li>
  <li><strong>Circulation to Skin:</strong> Pallor, mottling, cyanosis.</li>
</ul>
<h3>Primary Assessment (ABCDE)</h3>
<p>Once you touch the child, follow the ABCDE sequence. In 2025, the focus is on identifying <strong>Compensated vs. Decompensated Shock</strong> early. Hypotension is a late and ominous sign in children; do not wait for it to start aggressive treatment.</p>`
      },
      {
        order: 4,
        title: "Categorizing the Seriously Ill Child",
        content: `<h2>Emergency Categorization</h2>
<p>Management is determined by categorization. Your goal is to identify these states before they progress to cardiac arrest.</p>
<table>
  <thead><tr><th>Category</th><th>Key Signs</th><th>Immediate Goal</th></tr></thead>
  <tbody>
    <tr><td><strong>Respiratory Distress</strong></td><td>Increased effort, tachypnea, but adequate gas exchange.</td><td>Support ventilation, avoid exhaustion.</td></tr>
    <tr><td><strong>Respiratory Failure</strong></td><td>Altered mental status, bradypnea, cyanosis, poor air entry.</td><td>Secure airway, assist ventilation.</td></tr>
    <tr><td><strong>Compensated Shock</strong></td><td>Tachycardia, delayed CRT, weak pulses, but <strong>Normal BP</strong>.</td><td>Aggressive fluid resuscitation.</td></tr>
    <tr><td><strong>Decompensated Shock</strong></td><td>Hypotension, profound tachycardia/bradycardia, altered mental status.</td><td>Immediate resuscitation, consider vasoactives.</td></tr>
  </tbody>
</table>`
      }
    ],
    quiz: {
      title: "Check: 2025 Systematic Approach",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "According to the 2025 Guidelines, what is the minimum Diastolic Blood Pressure (DBP) target during CPR for a 5-year-old child?",
          options: JSON.stringify(["20 mmHg", "25 mmHg", "30 mmHg", "40 mmHg"]),
          correctAnswer: "30 mmHg",
          explanation: "The 2025 Update sets specific DBP targets to ensure adequate coronary perfusion: ≥25 mmHg in infants and ≥30 mmHg in children aged 1 year or older."
        },
        {
          order: 2,
          questionText: "Which link was newly emphasized in the 2025 Universal Chain of Survival?",
          options: JSON.stringify(["Early Defibrillation", "High-Quality CPR", "Recovery", "Advanced Life Support"]),
          correctAnswer: "Recovery",
          explanation: "Recovery is the 6th link, emphasizing the need for long-term support, rehabilitation, and addressing the physical and cognitive challenges survivors face."
        }
      ]
    }
  },
  {
    order: 2,
    title: "Module 2: Advanced Airway & Respiratory Management",
    description: "Precision in ventilation and oxygenation to prevent respiratory-led arrest.",
    content: "Respiratory failure remains the #1 cause of pediatric arrest. 2025 focuses on titrating oxygen and avoiding the dangers of hyperventilation.",
    duration: 25,
    sections: [
      {
        order: 1,
        title: "Oxygen Titration: The 94-99% Rule",
        content: `<h2>Oxygen Titration</h2>
<p>While 100% oxygen is used during initial resuscitation, the 2025 guidelines emphasize rapid titration once stable.</p>
<div class="clinical-note">
  <strong>Target SpO2: 94% – 99%</strong>.
  Avoid 100% saturation (hyperoxia) once stable, as it can worsen oxidative stress and neurological injury.
</div>`
      },
      {
        order: 2,
        title: "Ventilation Rates and the Danger of Hyperventilation",
        content: `<h2>Updated Ventilation Rates</h2>
<p>If the child has a pulse but requires assisted ventilation (e.g., via BVM or advanced airway):</p>
<ul>
  <li><strong>Infants and Children:</strong> 1 breath every 2-3 seconds (20-30 breaths per minute).</li>
</ul>
<div class="warning-note">
  <strong>Stop Hyperventilating:</strong> Excessive ventilation increases intrathoracic pressure, decreases venous return to the heart, and reduces cardiac output. It also causes cerebral vasoconstriction, worsening brain injury.
</div>`
      },
      {
        order: 3,
        title: "Advanced Airway: Cuffed Tubes are Preferred",
        content: `<h2>Endotracheal Intubation</h2>
<p>The 2025 guidelines continue to support the use of <strong>cuffed endotracheal tubes</strong> over uncuffed tubes for infants and children. Cuffed tubes allow for higher inflation pressures and more accurate tidal volume delivery.</p>
<h3>Confirmation of Placement</h3>
<p><strong>Waveform Capnography</strong> is the only reliable way to confirm and continuously monitor ETT position. If the waveform disappears, assume the tube is displaced (DOPE mnemonic: Displacement, Obstruction, Pneumothorax, Equipment failure).</p>`
      }
    ],
    quiz: {
      title: "Check: Respiratory Management",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "What is the recommended ventilation rate for a child with a pulse but inadequate breathing?",
          options: JSON.stringify(["8-10 breaths/min", "10-12 breaths/min", "12-20 breaths/min", "20-30 breaths/min"]),
          correctAnswer: "20-30 breaths/min",
          explanation: "The 2025 rate for pediatric rescue breathing is 1 breath every 2-3 seconds, which equates to 20-30 breaths per minute."
        }
      ]
    }
  },
  {
    order: 3,
    title: "Module 3: Circulatory Emergencies & Shock",
    description: "Differentiating shock types and executing 2025 fluid and vasoactive protocols.",
    content: "Shock in children is dynamic. 2025 guidelines emphasize early vasoactive support in septic shock and cautious fluid in cardiogenic states.",
    duration: 25,
    sections: [
      {
        order: 1,
        title: "Shock Categorization: Beyond Hypovolemia",
        content: `<h2>The Four Types of Shock</h2>
<p>Effective treatment requires identifying the underlying cause:</p>
<table>
  <thead><tr><th>Type</th><th>Key Features</th><th>Primary Treatment</th></tr></thead>
  <tbody>
    <tr><td><strong>Hypovolemic</strong></td><td>Dehydration, hemorrhage, flat veins.</td><td>Fluid boluses (20 mL/kg).</td></tr>
    <tr><td><strong>Distributive</strong></td><td>Sepsis, anaphylaxis. Warm/flushed skin initially.</td><td>Fluids + Early Vasoactives.</td></tr>
    <tr><td><strong>Cardiogenic</strong></td><td>Heart failure, myocarditis. Enlarged liver, crackles.</td><td>Small boluses (5-10 mL/kg), Inotropes.</td></tr>
    <tr><td><strong>Obstructive</strong></td><td>Tension pneumo, tamponade, ductal-dependent lesions.</td><td>Specific intervention (e.g., needle decompression).</td></tr>
  </tbody>
</table>`
      },
      {
        order: 2,
        title: "2025 Fluid Resuscitation Strategy",
        content: `<h2>Fluid Management</h2>
<p>The "20 mL/kg bolus" is still the standard, but with a major caveat: <strong>Reassess after every bolus.</strong></p>
<ul>
  <li>Look for signs of fluid overload: New crackles, enlarging liver, or increased work of breathing.</li>
  <li>In <strong>Septic Shock</strong>, if the child remains shocked after 40-60 mL/kg, start vasoactive infusions (Epinephrine or Norepinephrine) immediately. Do not wait for massive fluid totals if the child is not responding.</li>
</ul>`
      }
    ],
    quiz: {
      title: "Check: Shock Management",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "A child in septic shock remains hypotensive after two 20 mL/kg fluid boluses. What is the next 2025-aligned step?",
          options: JSON.stringify(["Give a third 20 mL/kg bolus", "Wait 15 minutes to reassess", "Start vasoactive medication (e.g., Epinephrine infusion)", "Administer Atropine"]),
          correctAnswer: "Start vasoactive medication (e.g., Epinephrine infusion)",
          explanation: "2025 guidelines emphasize early transition to vasoactive support in fluid-refractory septic shock."
        }
      ]
    }
  },
  {
    order: 4,
    title: "Module 4: Cardiac Arrest Algorithms 2025",
    description: "High-performance CPR and sharp execution of the shockable and non-shockable pathways.",
    content: "Seconds count. 2025 updates prioritize early Epinephrine for non-shockable rhythms and high-energy defibrillation for VF/pVT.",
    duration: 30,
    sections: [
      {
        order: 1,
        title: "The Non-Shockable Pathway: Epinephrine ASAP",
        content: `<h2>Asystole and PEA</h2>
<p>For non-shockable rhythms, <strong>Epinephrine is the priority.</strong></p>
<div class="clinical-note">
  <strong>2025 Mandate:</strong> Administer Epinephrine 0.01 mg/kg IV/IO as soon as possible after starting CPR. Every minute of delay is associated with a decrease in the probability of ROSC and survival.
</div>
<p>Repeat every 3-5 minutes. Simultaneously search for and treat the <strong>H's and T's</strong>.</p>`
      },
      {
        order: 2,
        title: "The Shockable Pathway: VF and Pulseless VT",
        content: `<h2>Defibrillation Strategy</h2>
<p>For shockable rhythms, <strong>Shock is the priority.</strong></p>
<ul>
  <li><strong>First Shock:</strong> 2 J/kg.</li>
  <li><strong>Second Shock:</strong> 4 J/kg.</li>
  <li><strong>Subsequent Shocks:</strong> ≥4 J/kg (max 10 J/kg or adult dose).</li>
</ul>
<p>If VF/pVT persists after the second shock, give Epinephrine. If it persists after the third shock, give <strong>Amiodarone (5 mg/kg)</strong> or <strong>Lidocaine (1 mg/kg)</strong>.</p>`
      }
    ],
    quiz: {
      title: "Check: Cardiac Arrest",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "For a child in Asystole, when should the first dose of Epinephrine be given?",
          options: JSON.stringify(["After 2 minutes of CPR", "As soon as IV/IO access is available", "Only after the first rhythm check", "After trying a fluid bolus"]),
          correctAnswer: "As soon as IV/IO access is available",
          explanation: "2025 guidelines emphasize giving Epinephrine ASAP for non-shockable rhythms to improve outcomes."
        }
      ]
    }
  },
  {
    order: 5,
    title: "Module 5: Tachycardia & Bradycardia",
    description: "Managing unstable rhythms and the 2025 anti-arrhythmic updates.",
    content: "Rhythm management requires distinguishing between stability and instability. 2025 adds new options for refractory SVT.",
    duration: 25,
    sections: [
      {
        order: 1,
        title: "Bradycardia: When to start CPR",
        content: `<h2>Pediatric Bradycardia</h2>
<p>In children, bradycardia is usually a sign of impending cardiac arrest due to hypoxia.</p>
<div class="warning-note">
  <strong>The Rule of 60:</strong> Start CPR if the heart rate is <60 bpm with signs of poor perfusion (altered mental status, weak pulses, pallor) despite adequate oxygenation and ventilation.
</div>
<p><strong>Drugs:</strong> Epinephrine 0.01 mg/kg is the first-line drug. Atropine 0.02 mg/kg is reserved for primary AV block or increased vagal tone.</p>`
      },
      {
        order: 2,
        title: "SVT and the 2025 Sotalol Update",
        content: `<h2>Supraventricular Tachycardia</h2>
<p>Differentiate SVT from Sinus Tachycardia (SVT is usually >220 in infants, >180 in children, with no P waves).</p>
<ul>
  <li><strong>Stable:</strong> Vagal maneuvers (ice to face for infants) -> Adenosine 0.1 mg/kg.</li>
  <li><strong>Unstable:</strong> Synchronized Cardioversion (0.5-1 J/kg).</li>
  <li><strong>2025 Update:</strong> IV Sotalol may be considered for refractory SVT if expert consultation is unavailable.</li>
</ul>`
      }
    ],
    quiz: {
      title: "Check: Arrhythmias",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "You are treating an infant with a heart rate of 50 bpm and poor perfusion. You have provided 100% oxygen and assisted ventilation, but the HR remains 50. What is the next step?",
          options: JSON.stringify(["Continue monitoring", "Start chest compressions", "Give Adenosine", "Give Atropine"]),
          correctAnswer: "Start chest compressions",
          explanation: "If the HR is <60 with poor perfusion despite oxygenation/ventilation, you must start CPR."
        }
      ]
    }
  },
  {
    order: 6,
    title: "Module 6: Post-Cardiac Arrest Care & Recovery",
    description: "The science of neuroprotection and the journey back to health.",
    content: "The resuscitation doesn't end at ROSC. 2025 focuses on strict fever prevention and multi-modal neuroprognostication.",
    duration: 25,
    sections: [
      {
        order: 1,
        title: "Neuroprotection: Fever is the Enemy",
        content: `<h2>Targeted Temperature Management (TTM)</h2>
<p>The 2025 guidelines are clear: <strong>Prevent Hyperthermia.</strong></p>
<div class="clinical-note">
  Maintain a core temperature of 32°C to 37.5°C. Any temperature >37.5°C must be aggressively treated with antipyretics and cooling devices, as fever significantly worsens neurological outcomes.
</div>`
      },
      {
        order: 2,
        title: "Hemodynamic Optimization",
        content: `<h2>Blood Pressure Targets</h2>
<p>Post-ROSC, avoid hypotension. Target a systolic and mean arterial pressure <strong>greater than the 10th percentile for age and sex.</strong> This ensures adequate cerebral perfusion pressure during the critical recovery phase.</p>`
      },
      {
        order: 3,
        title: "The Recovery Link",
        content: `<h2>The Long Road Ahead</h2>
<p>The 6th link, Recovery, acknowledges that the hospital stay is only the beginning. Survivors need:</p>
<ul>
  <li>Formal neurological and cognitive testing before discharge.</li>
  <li>Physical and occupational therapy referrals.</li>
  <li>Support for the family, who often experience significant trauma.</li>
</ul>`
      }
    ],
    quiz: {
      title: "Check: Post-Arrest Care",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "What is the maximum allowable core temperature for a child in the first 72 hours after cardiac arrest?",
          options: JSON.stringify(["36.5°C", "37.5°C", "38.5°C", "39.0°C"]),
          correctAnswer: "37.5°C",
          explanation: "Fever (>37.5°C) must be avoided and aggressively treated to protect the brain."
        }
      ]
    }
  }
];

async function seed() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  console.log('Connected to database.');

  try {
    // 1. Clear existing PALS modules and sections to avoid duplicates
    // We get the module IDs first
    const [existingModules]: any = await connection.execute(
      'SELECT id FROM modules WHERE courseId = ?',
      [PALS_COURSE_ID]
    );
    const moduleIds = existingModules.map((m: any) => m.id);

    if (moduleIds.length > 0) {
      const placeholders = moduleIds.map(() => '?').join(',');
      await connection.execute(`DELETE FROM quizQuestions WHERE quizId IN (SELECT id FROM quizzes WHERE moduleId IN (${placeholders}))`, moduleIds);
      await connection.execute(`DELETE FROM quizzes WHERE moduleId IN (${placeholders})`, moduleIds);
      await connection.execute(`DELETE FROM moduleSections WHERE moduleId IN (${placeholders})`, moduleIds);
      await connection.execute(`DELETE FROM modules WHERE courseId = ?`, [PALS_COURSE_ID]);
      console.log('Cleared existing PALS modules.');
    }

    // 2. Insert new modules
    for (const mod of modules) {
      const [modResult]: any = await connection.execute(
        'INSERT INTO modules (courseId, `order`, title, description, content, duration) VALUES (?, ?, ?, ?, ?, ?)',
        [PALS_COURSE_ID, mod.order, mod.title, mod.description, mod.content, mod.duration]
      );
      const moduleId = modResult.insertId;
      console.log(`Inserted Module ${mod.order}: ${mod.title}`);

      // Insert sections
      for (const sec of mod.sections) {
        await connection.execute(
          'INSERT INTO moduleSections (moduleId, `order`, title, content) VALUES (?, ?, ?, ?)',
          [moduleId, sec.order, sec.title, sec.content]
        );
      }
      console.log(`  Inserted ${mod.sections.length} sections.`);

      // Insert quiz
      const [quizResult]: any = await connection.execute(
        'INSERT INTO quizzes (moduleId, title, passingScore) VALUES (?, ?, ?)',
        [moduleId, mod.quiz.title, mod.quiz.passingScore]
      );
      const quizId = quizResult.insertId;

      // Insert quiz questions
      for (const q of mod.quiz.questions) {
        await connection.execute(
          'INSERT INTO quizQuestions (quizId, `order`, question, options, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?)',
          [quizId, q.order, q.questionText, q.options, q.correctAnswer, q.explanation]
        );
      }
      console.log(`  Inserted quiz with ${mod.quiz.questions.length} questions.`);
    }

    console.log('PALS 2025 Course seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding PALS 2025 course:', error);
  } finally {
    await connection.end();
  }
}

seed();
