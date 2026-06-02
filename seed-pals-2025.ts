/**
 * PALS Course Content Seed - 2025 Edition (Beginner-Friendly)
 * Course ID: 40 — Paediatric Advanced Life Support (PALS)
 * Aligned with: AHA PALS 2025 Guidelines
 * Author: Manus AI for Paeds Resus Platform
 */
import * as dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

const PALS_COURSE_ID = 40;

const modules = [
  {
    order: 1,
    title: "Module 1: Introduction to PALS & Pediatric Assessment",
    description: "Understand the scope of PALS, master the Pediatric Assessment Triangle (PAT), and perform a systematic primary assessment (ABCDE approach).",
    content: "This module introduces the fundamental concepts of PALS and equips learners with essential pediatric assessment skills.",
    duration: 45,
    sections: [
      {
        order: 1,
        title: "Introduction to PALS: Mission and Importance",
        content: `<h2>Why PALS Matters</h2>
<p>Pediatric Advanced Life Support (PALS) is a critical course designed to improve outcomes for critically ill infants and children. It focuses on a systematic approach to assessment and management, emphasizing early recognition and intervention to prevent cardiac arrest.</p>
<div class="clinical-note">
  <strong>The Paeds Resus Mission:</strong> To reduce preventable deaths by delivering reliable, practical, rollout-ready improvements for low-resource hospitals. PALS is a cornerstone of this mission.
</div>
<h3>PALS Team Dynamics</h3>
<p>Effective resuscitation relies on a well-coordinated team. Understanding roles, responsibilities, and closed-loop communication is vital for success.</p>`
      },
      {
        order: 2,
        title: "The Pediatric Assessment Triangle (PAT)",
        content: `<h2>Rapid Visual Assessment: The PAT</h2>
<p>The Pediatric Assessment Triangle (PAT) is a quick, visual, and auditory assessment performed in the first 30 seconds, even before touching the child. It helps determine if a child is 'sick' or 'not sick' and guides the urgency of intervention.</p>
<ul>
  <li><strong>Appearance:</strong> Tone, Interactiveness, Consolability, Look/Gaze, Speech/Cry (TICLS). Reflects brain perfusion and oxygenation.</li>
  <li><strong>Work of Breathing:</strong> Abnormal sounds (grunting, stridor, wheezing), positioning (tripod, sniffing), retractions, flaring. Reflects adequacy of oxygenation and ventilation.</li>
  <li><strong>Circulation to Skin:</strong> Pallor, mottling, cyanosis. Reflects cardiac output and perfusion.</li>
</ul>
<div class="clinical-note">
  <strong>Key Principle:</strong> If any side of the PAT is abnormal, the child is sick and requires immediate attention.
</div>`
      },
      {
        order: 3,
        title: "Systematic Primary Assessment: ABCDE Approach",
        content: `<h2>Primary Assessment: ABCDE</h2>
<p>Once you approach the child, perform a hands-on primary assessment using the ABCDE approach. This structured method ensures no critical issues are missed.</p>
<ul>
  <li><strong>A - Airway:</strong> Is it patent? Maintainable? Is there an obstruction?</li>
  <li><strong>B - Breathing:</strong> Rate, effort, breath sounds, SpO2. Is breathing adequate?</li>
  <li><strong>C - Circulation:</strong> Heart rate, pulses (central and peripheral), capillary refill time (CRT), blood pressure, skin color/temperature. Is perfusion adequate?</li>
  <li><strong>D - Disability:</strong> Level of consciousness (AVPU or GCS), pupil response, glucose.</li>
  <li><strong>E - Exposure:</strong> Remove clothing to assess for rashes, trauma, bleeding. Prevent hypothermia.</li>
</ul>
<div class="warning-note">
  <strong>Unresponsive Child:</strong> If at any point the child is unresponsive, immediately activate the Basic Life Support (BLS) or Advanced Life Support (ALS) pathway.
</div>`
      },
      {
        order: 4,
        title: "Recognizing Respiratory Distress, Failure, and Shock",
        content: `<h2>Early Recognition of Critical Conditions</h2>
<p>The primary assessment helps categorize the child's condition, guiding immediate interventions.</p>
<table>
  <thead><tr><th>Condition</th><th>Key Signs</th><th>Immediate Goal</th></tr></thead>
  <tbody>
    <tr><td><strong>Respiratory Distress</strong></td><td>Increased work of breathing (tachypnea, retractions, flaring), but adequate mental status and SpO2.</td><td>Support ventilation, prevent exhaustion.</td></tr>
    <tr><td><strong>Respiratory Failure</strong></td><td>Altered mental status, bradypnea/apnea, cyanosis, poor air entry, severe increased work of breathing.</td><td>Secure airway, assist ventilation.</td></tr>
    <tr><td><strong>Compensated Shock</strong></td><td>Tachycardia, delayed CRT, weak pulses, but <strong>Normal BP</strong>.</td><td>Aggressive fluid resuscitation.</td></tr>
    <tr><td><strong>Decompensated Shock</strong></td><td>Hypotension, profound tachycardia/bradycardia, altered mental status.</td><td>Immediate resuscitation, consider vasoactives.</td></tr>
  </tbody>
</table>`
      }
    ],
    quiz: {
      title: "Check: Introduction to PALS & Pediatric Assessment",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "Which component of the Pediatric Assessment Triangle (PAT) reflects brain perfusion and oxygenation?",
          options: JSON.stringify(["Appearance", "Work of Breathing", "Circulation to Skin", "All of the above"]),
          correctAnswer: "Appearance",
          explanation: "Appearance (TICLS) is the most sensitive indicator of brain perfusion and oxygenation in children."
        },
        {
          order: 2,
          questionText: "According to the ABCDE approach, what is the immediate action if a child is found to be unresponsive?",
          options: JSON.stringify(["Check blood pressure", "Administer oxygen", "Activate BLS/ALS pathway", "Assess capillary refill"]),
          correctAnswer: "Activate BLS/ALS pathway",
          explanation: "An unresponsive child requires immediate activation of the BLS/ALS pathway to initiate resuscitation."
        },
        {
          order: 3,
          questionText: "A child with increased work of breathing, tachypnea, but normal mental status and SpO2 is likely in what state?",
          options: JSON.stringify(["Respiratory Failure", "Compensated Shock", "Respiratory Distress", "Decompensated Shock"]),
          correctAnswer: "Respiratory Distress",
          explanation: "Respiratory distress is characterized by increased work of breathing with adequate gas exchange. Respiratory failure involves altered mental status, bradypnea, or cyanosis."
        }
      ]
    }
  },
  {
    order: 2,
    title: "Module 2: Basic Life Support (BLS) for Infants & Children",
    description: "Learn high-quality CPR, AED use, and foreign-body airway obstruction management for pediatric patients.",
    content: "This module covers the essential skills of pediatric Basic Life Support, forming the foundation for all advanced interventions.",
    duration: 40,
    sections: [
      {
        order: 1,
        title: "High-Quality CPR: Infants and Children",
        content: `<h2>High-Quality CPR: The Foundation of Resuscitation</h2>
<p>Effective CPR is the single most important intervention in cardiac arrest. Focus on the key components:</p>
<ul>
  <li><strong>Compression Rate:</strong> 100-120 compressions per minute.</li>
  <li><strong>Compression Depth:</strong> At least one-third of the anterior-posterior diameter of the chest (approximately 1.5 inches for infants, 2 inches for children).</li>
  <li><strong>Chest Recoil:</strong> Allow full chest recoil after each compression.</li>
  <li><strong>Minimizing Interruptions:</strong> Limit pauses in compressions to less than 10 seconds.</li>
  <li><strong>Ventilations:</strong> Deliver 2 breaths after every 30 compressions for single rescuer, or 2 breaths after every 15 compressions for two rescuers.</li>
</ul>
<h3>Single Rescuer vs. Two Rescuers</h3>
<p><strong>Single Rescuer:</strong> Use the 30:2 compression-to-ventilation ratio for both infants and children.</p>
<p><strong>Two Rescuers:</strong> Use the 15:2 compression-to-ventilation ratio for both infants and children.</p>`
      },
      {
        order: 2,
        title: "Automated External Defibrillator (AED) Use",
        content: `<h2>AED Application in Pediatrics</h2>
<p>An AED can be used for infants and children after the first minute of CPR if a shockable rhythm is suspected. Follow AED prompts.</p>
<ul>
  <li><strong>Pad Placement:</strong> Anterolateral (right upper chest, left lower chest) or Anteroposterior (front and back) if pads risk touching.</li>
  <li><strong>Child Attenuator Pads:</strong> Use if available for children 1-8 years old.</li>
  <li><strong>Infants (<1 year):</strong> Manual defibrillator preferred. If unavailable, use an AED with child attenuator pads. If child pads are unavailable, use adult pads, ensuring they do not touch.</li>
</ul>
<div class="warning-note">
  <strong>Never Delay CPR:</strong> If an AED is not immediately available, continue high-quality CPR until it arrives.
</div>`
      },
      {
        order: 3,
        title: "Foreign-Body Airway Obstruction (FBAO)",
        content: `<h2>Choking Management: Conscious vs. Unconscious</h2>
<p>Prompt recognition and intervention for FBAO can be life-saving.</p>
<h3>Conscious Infant (FBAO)</h3>
<ul>
  <li>Deliver 5 back blows followed by 5 chest thrusts. Repeat until object is expelled or infant becomes unconscious.</li>
</ul>
<h3>Conscious Child (FBAO)</h3>
<ul>
  <li>Perform abdominal thrusts (Heimlich maneuver) until object is expelled or child becomes unconscious.</li>
</ul>
<h3>Unconscious Infant/Child (FBAO)</h3>
<ul>
  <li>Begin CPR. Before delivering ventilations, look for the object in the mouth and remove it if visible. Do NOT perform blind finger sweeps.</li>
</ul>`
      }
    ],
    quiz: {
      title: "Check: Basic Life Support",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "What is the recommended compression-to-ventilation ratio for a single rescuer performing CPR on an infant?",
          options: JSON.stringify(["15:2", "30:2", "5:1", "20:2"]),
          correctAnswer: "30:2",
          explanation: "For a single rescuer, the ratio is 30 compressions to 2 ventilations for both infants and children."
        },
        {
          order: 2,
          questionText: "When using an AED on an infant, what is the preferred method if a manual defibrillator is unavailable?",
          options: JSON.stringify(["Adult pads without attenuation", "Child attenuator pads", "Do not use an AED", "Wait for a manual defibrillator"]),
          correctAnswer: "Child attenuator pads",
          explanation: "If a manual defibrillator is unavailable, an AED with child attenuator pads is preferred for infants. If child pads are unavailable, adult pads can be used, ensuring they do not touch."
        },
        {
          order: 3,
          questionText: "What is the initial intervention for a conscious infant with a severe foreign-body airway obstruction?",
          options: JSON.stringify(["Abdominal thrusts", "Blind finger sweeps", "5 back blows and 5 chest thrusts", "Start CPR"]),
          correctAnswer: "5 back blows and 5 chest thrusts",
          explanation: "For a conscious infant with FBAO, deliver 5 back blows followed by 5 chest thrusts until the object is expelled or the infant becomes unconscious."
        }
      ]
    }
  },
  {
    order: 3,
    title: "Module 3: Airway Management & Oxygen Delivery",
    description: "Select appropriate oxygen delivery devices, perform basic airway maneuvers, and understand indications for advanced airway management.",
    content: "This module focuses on maintaining a patent airway and delivering adequate oxygen, crucial steps in preventing respiratory compromise.",
    duration: 35,
    sections: [
      {
        order: 1,
        title: "Oxygen Delivery Devices and Titration",
        content: `<h2>Oxygen Therapy: Devices and Targets</h2>
<p>Oxygen is a drug and should be administered judiciously. The goal is to achieve adequate oxygenation while avoiding hyperoxia.</p>
<ul>
  <li><strong>Nasal Cannula:</strong> Low flow (0.25-4 L/min), delivers 24-35% FiO2. For mild hypoxemia.</li>
  <li><strong>Simple Face Mask:</strong> Moderate flow (6-10 L/min), delivers 35-50% FiO2.</li>
  <li><strong>Non-Rebreather Mask:</strong> High flow (10-15 L/min), delivers 60-95% FiO2. For severe hypoxemia.</li>
  <li><strong>Bag-Mask Device (BVM):</strong> Used for assisted ventilation.</li>
</ul>
<div class="clinical-note">
  <strong>2025 Oxygen Titration Rule:</strong> Once stable, titrate oxygen to maintain SpO2 between 94-99%. Avoid prolonged 100% oxygen to prevent oxidative stress.
</div>`
      },
      {
        order: 2,
        title: "Basic Airway Maneuvers",
        content: `<h2>Opening the Airway</h2>
<p>Simple maneuvers can often open an obstructed airway.</p>
<ul>
  <li><strong>Head-Tilt Chin-Lift:</strong> Preferred method for most patients without suspected cervical spine injury.</li>
  <li><strong>Jaw-Thrust Maneuver:</strong> Used for patients with suspected cervical spine injury.</li>
</ul>
<h3>Bag-Mask Ventilation (BMV)</h3>
<p>Proper BMV technique is vital for effective ventilation. Ensure a tight seal, deliver appropriate tidal volume (just enough to see chest rise), and maintain correct rate.</p>`
      },
      {
        order: 3,
        title: "Introduction to Advanced Airway Management",
        content: `<h2>When to Consider Advanced Airways</h2>
<p>Advanced airways (e.g., Laryngeal Mask Airway (LMA), Endotracheal Tube (ETT)) are indicated when basic airway maneuvers and BMV are ineffective, or for prolonged ventilation.</p>
<ul>
  <li><strong>LMA:</strong> Supraglottic device, easier to insert than ETT, provides a good seal.</li>
  <li><strong>ETT:</strong> Definitive airway, provides secure and protected airway. 2025 guidelines prefer <strong>cuffed ETTs</strong> for all ages.</li>
</ul>
<div class="warning-note">
  <strong>Confirmation:</strong> Always confirm advanced airway placement with waveform capnography and clinical assessment.
</div>`
      }
    ],
    quiz: {
      title: "Check: Airway Management & Oxygen Delivery",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "What is the recommended SpO2 target range for a stable pediatric patient receiving oxygen therapy, according to 2025 guidelines?",
          options: JSON.stringify(["90-92%", "92-94%", "94-99%", "100%"]),
          correctAnswer: "94-99%",
          explanation: "The 2025 guidelines recommend titrating oxygen to maintain SpO2 between 94-99% once stable, avoiding hyperoxia."
        },
        {
          order: 2,
          questionText: "Which airway maneuver is preferred for a patient with suspected cervical spine injury?",
          options: JSON.stringify(["Head-tilt chin-lift", "Jaw-thrust maneuver", "Oropharyngeal airway insertion", "Nasopharyngeal airway insertion"]),
          correctAnswer: "Jaw-thrust maneuver",
          explanation: "The jaw-thrust maneuver minimizes neck movement and is preferred for patients with suspected cervical spine injury."
        },
        {
          order: 3,
          questionText: "According to 2025 guidelines, which type of endotracheal tube is preferred for infants and children?",
          options: JSON.stringify(["Uncuffed ETT", "Cuffed ETT", "Tracheostomy tube", "Laryngeal Mask Airway"]),
          correctAnswer: "Cuffed ETT",
          explanation: "The 2025 guidelines prefer cuffed endotracheal tubes for all ages to allow for better pressure control and tidal volume delivery."
        }
      ]
    }
  },
  {
    order: 4,
    title: "Module 4: Respiratory Distress & Failure (2025 Updates)",
    description: "Differentiate between respiratory distress and respiratory failure, and apply 2025 guidelines for managing specific respiratory emergencies.",
    content: "Respiratory emergencies are the most common cause of cardiac arrest in children. Early and effective management is crucial.",
    duration: 40,
    sections: [
      {
        order: 1,
        title: "Differentiating Respiratory Distress and Failure",
        content: `<h2>Spectrum of Respiratory Compromise</h2>
<p>Understanding the difference between distress and failure is key to timely intervention.</p>
<table>
  <thead><tr><th>Feature</th><th>Respiratory Distress</th><th>Respiratory Failure</th></tr></thead>
  <tbody>
    <tr><td><strong>Work of Breathing</strong></td><td>Increased (tachypnea, retractions, flaring)</td><td>Markedly increased or absent/ineffective</td></tr>
    <tr><td><strong>Mental Status</strong></td><td>Normal to anxious</td><td>Altered (lethargy, agitation, unresponsiveness)</td></tr>
    <tr><td><strong>SpO2</strong></td><td>May be normal or slightly decreased</td><td>Significantly decreased, often with cyanosis</td></tr>
    <tr><td><strong>Breath Sounds</strong></td><td>Wheezing, stridor, crackles</td><td>Diminished or absent, grunting</td></tr>
    <tr><td><strong>Heart Rate</strong></td><td>Tachycardia</td><td>Bradycardia (ominous sign)</td></tr>
  </tbody>
</table>
<div class="warning-note">
  <strong>Bradycardia in Respiratory Failure:</strong> A slowing heart rate in a child with respiratory symptoms is a pre-terminal event and requires immediate, aggressive intervention.
</div>`
      },
      {
        order: 2,
        title: "Management of Specific Respiratory Emergencies",
        content: `<h2>Common Pediatric Respiratory Conditions</h2>
<p>Tailored interventions based on the underlying cause are essential.</p>
<ul>
  <li><strong>Asthma Exacerbation:</strong> Bronchodilators (albuterol, ipratropium), systemic corticosteroids.</li>
  <li><strong>Bronchiolitis:</strong> Supportive care (oxygen, hydration), nasal suctioning. Bronchodilators generally not recommended.</li>
  <li><strong>Croup (Laryngotracheobronchitis):</strong> Dexamethasone, nebulized epinephrine.</li>
  <li><strong>Anaphylaxis:</strong> Epinephrine (IM), antihistamines, corticosteroids.</li>
</ul>
<h3>Ventilation Rates (2025 Update)</h3>
<p>For children with a pulse but inadequate breathing, the recommended ventilation rate is <strong>1 breath every 2-3 seconds (20-30 breaths per minute)</strong>. Avoid hyperventilation.</p>`
      },
      {
        order: 3,
        title: "Non-Invasive Ventilation (NIV)",
        content: `<h2>CPAP and BiPAP</h2>
<p>Non-invasive ventilation (NIV) can support children in respiratory distress or early respiratory failure, potentially avoiding intubation.</p>
<ul>
  <li><strong>CPAP (Continuous Positive Airway Pressure):</strong> Provides continuous positive pressure to keep airways open, improving oxygenation.</li>
  <li><strong>BiPAP (Bilevel Positive Airway Pressure):</strong> Provides two levels of pressure (inspiratory and expiratory), assisting both oxygenation and ventilation.</li>
</ul>
<div class="clinical-note">
  <strong>Indications:</strong> Moderate to severe respiratory distress, obstructive sleep apnea, pulmonary edema. Close monitoring is essential.
</div>`
      }
    ],
    quiz: {
      title: "Check: Respiratory Distress & Failure",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "Which of the following is an ominous sign in a child with respiratory symptoms, indicating impending cardiac arrest?",
          options: JSON.stringify(["Tachypnea", "Wheezing", "Bradycardia", "Retractions"]),
          correctAnswer: "Bradycardia",
          explanation: "Bradycardia in a child with respiratory symptoms is a late and ominous sign, often preceding cardiac arrest."
        },
        {
          order: 2,
          questionText: "According to 2025 guidelines, what is the recommended ventilation rate for a child with a pulse but inadequate breathing?",
          options: JSON.stringify(["8-10 breaths/min", "12-20 breaths/min", "20-30 breaths/min", "30-40 breaths/min"]),
          correctAnswer: "20-30 breaths/min",
          explanation: "The 2025 guidelines recommend 1 breath every 2-3 seconds (20-30 breaths per minute) to avoid hyperventilation."
        },
        {
          order: 3,
          questionText: "Which medication is the first-line treatment for anaphylaxis with respiratory compromise?",
          options: JSON.stringify(["Albuterol", "Dexamethasone", "Epinephrine (IM)", "Diphenhydramine"]),
          correctAnswer: "Epinephrine (IM)",
          explanation: "Intramuscular epinephrine is the first-line treatment for anaphylaxis, especially with respiratory or circulatory involvement."
        }
      ]
    }
  },
  {
    order: 5,
    title: "Module 5: Circulatory Emergencies & Shock (2025 Updates)",
    description: "Classify different types of shock, implement the 2025 fluid resuscitation strategy, and identify early indications for vasoactive medications.",
    content: "Early recognition and aggressive management of shock are critical to prevent progression to cardiac arrest.",
    duration: 40,
    sections: [
      {
        order: 1,
        title: "Types of Shock in Children",
        content: `<h2>Categorizing Shock</h2>
<p>Understanding the etiology of shock guides appropriate treatment.</p>
<table>
  <thead><tr><th>Type</th><th>Common Causes</th><th>Key Features</th><th>Initial Management</th></tr></thead>
  <tbody>
    <tr><td><strong>Hypovolemic</strong></td><td>Dehydration, hemorrhage, burns</td><td>Tachycardia, poor perfusion, dry mucous membranes, decreased urine output</td><td>Fluid boluses</td></tr>
    <tr><td><strong>Distributive</strong></td><td>Sepsis, anaphylaxis, neurogenic</td><td>Warm/flushed skin (early sepsis), rapid CRT, wide pulse pressure (sepsis); or cold/pale (late sepsis)</td><td>Fluids + Early Vasoactives</td></tr>
    <tr><td><strong>Cardiogenic</strong></td><td>Myocarditis, cardiomyopathy, arrhythmias</td><td>Tachycardia, poor perfusion, enlarged liver, crackles, pulmonary edema</td><td>Small fluid boluses, inotropes</td></tr>
    <tr><td><strong>Obstructive</strong></td><td>Tension pneumothorax, cardiac tamponade, pulmonary embolism, ductal-dependent lesions</td><td>Signs of shock with specific obstructive findings (e.g., tracheal deviation, muffled heart sounds)</td><td>Treat underlying cause (e.g., needle decompression)</td></tr>
  </tbody>
</table>`
      },
      {
        order: 2,
        title: "2025 Fluid Resuscitation Strategy",
        content: `<h2>Fluid Management: Reassess After Every Bolus</h2>
<p>The 20 mL/kg isotonic crystalloid bolus remains the standard for most types of shock (hypovolemic, distributive). However, the 2025 guidelines strongly emphasize <strong>reassessment after every bolus</strong>.</p>
<ul>
  <li><strong>Reassessment:</strong> Look for signs of improvement (improved mental status, stronger pulses, decreased heart rate, improved CRT) AND signs of fluid overload (new crackles, enlarging liver, increased work of breathing).</li>
  <li><strong>Septic Shock:</strong> If the child remains in shock after 40-60 mL/kg of fluid, initiate vasoactive infusions (e.g., Epinephrine, Norepinephrine) immediately. Do not delay vasoactives while continuing to give large volumes of fluid if there is no response.</li>
  <li><strong>Cardiogenic Shock:</strong> Use smaller fluid boluses (5-10 mL/kg) and proceed quickly to inotropic support.</li>
</ul>`
      },
      {
        order: 3,
        title: "Vasoactive Medications and IO Access",
        content: `<h2>Vasoactive Support</h2>
<p>Vasoactive medications are crucial for supporting blood pressure and perfusion in fluid-refractory shock.</p>
<ul>
  <li><strong>Epinephrine:</strong> Often first-line for cold shock (cardiogenic, some distributive).</li>
  <li><strong>Norepinephrine:</strong> Often first-line for warm shock (septic shock with vasodilation).</li>
  <li><strong>Dopamine:</strong> Less frequently used, but can be considered.</li>
</ul>
<h3>Intraosseous (IO) Access</h3>
<p>If intravenous (IV) access cannot be established within 60 seconds or after 2 attempts during a resuscitation, establish intraosseous (IO) access. It provides a rapid and reliable route for fluids and medications.</p>`
      }
    ],
    quiz: {
      title: "Check: Circulatory Emergencies & Shock",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "A child in septic shock has received 60 mL/kg of fluid and remains hypotensive. What is the next most appropriate step according to 2025 guidelines?",
          options: JSON.stringify(["Administer another 20 mL/kg fluid bolus", "Initiate vasoactive medication infusion", "Perform a pericardiocentesis", "Wait 30 minutes and reassess"]),
          correctAnswer: "Initiate vasoactive medication infusion",
          explanation: "The 2025 guidelines emphasize early initiation of vasoactive medications in fluid-refractory septic shock after 40-60 mL/kg of fluid."
        },
        {
          order: 2,
          questionText: "Which type of shock is characterized by tachycardia, poor perfusion, and an enlarged liver?",
          options: JSON.stringify(["Hypovolemic shock", "Distributive shock", "Cardiogenic shock", "Obstructive shock"]),
          correctAnswer: "Cardiogenic shock",
          explanation: "Cardiogenic shock often presents with signs of fluid overload (enlarged liver, crackles) due to pump failure, in addition to poor perfusion."
        },
        {
        order: 3,
          questionText: "When should intraosseous (IO) access be considered during a pediatric resuscitation?",
          options: JSON.stringify(["After 5 minutes of failed IV attempts", "Only in children under 1 year old", "If IV access cannot be established within 60 seconds or 2 attempts", "As a last resort after all other options fail"]),
          correctAnswer: "If IV access cannot be established within 60 seconds or 2 attempts",
          explanation: "IO access should be established rapidly if IV access is difficult, specifically if it cannot be obtained within 60 seconds or after 2 attempts."
        }
      ]
    }
  },
  {
    order: 6,
    title: "Module 6: Cardiac Arrest Algorithms (2025 Updates)",
    description: "Master high-performance CPR, execute the 2025 non-shockable and shockable cardiac arrest algorithms, and prioritize early Epinephrine.",
    content: "Cardiac arrest in children is a low-frequency, high-acuity event. Flawless execution of algorithms and high-quality CPR are paramount.",
    duration: 45,
    sections: [
      {
        order: 1,
        title: "High-Performance CPR in Cardiac Arrest",
        content: `<h2>CPR Quality: The Core of Resuscitation</h2>
<p>The principles of high-quality CPR (rate, depth, recoil, minimizing interruptions, avoiding excessive ventilation) are even more critical during cardiac arrest.</p>
<ul>
  <li><strong>Compression Rate:</strong> 100-120/min.</li>
  <li><strong>Compression Depth:</strong> At least one-third AP diameter (1.5 inches infants, 2 inches children).</li>
  <li><strong>Full Chest Recoil.</strong></li>
  <li><strong>Minimize Interruptions.</strong></li>
  <li><strong>Avoid Excessive Ventilation.</strong></li>
</ul>
<div class="clinical-note">
  <strong>Physiology-Directed CPR:</strong> Monitor ETCO2 (target >15-20 mmHg) and Diastolic BP (infants ≥25 mmHg, children ≥30 mmHg) to guide CPR quality.
</div>`
      },
      {
        order: 2,
        title: "The Non-Shockable Pathway: PEA and Asystole",
        content: `<h2>Asystole and Pulseless Electrical Activity (PEA)</h2>
<p>These rhythms are not amenable to defibrillation. The priority is high-quality CPR and early administration of Epinephrine.</p>
<div class="clinical-note">
  <strong>2025 Mandate:</strong> Administer Epinephrine 0.01 mg/kg IV/IO as soon as possible after starting CPR for non-shockable rhythms. Repeat every 3-5 minutes.
</div>
<p>Simultaneously, actively search for and treat reversible causes (H's and T's).</p>
<ul>
  <li><strong>H's:</strong> Hypovolemia, Hypoxia, Hydrogen ion (acidosis), Hypo-/Hyperkalemia, Hypothermia.</li>
  <li><strong>T's:</strong> Tension pneumothorax, Tamponade (cardiac), Toxins, Thrombosis (coronary or pulmonary).</li>
</ul>`
      },
      {
        order: 3,
        title: "The Shockable Pathway: VF and Pulseless VT",
        content: `<h2>Ventricular Fibrillation (VF) and Pulseless Ventricular Tachycardia (pVT)</h2>
<p>These are shockable rhythms. Defibrillation is the priority.</p>
<ul>
  <li><strong>First Shock:</strong> 2 J/kg. Immediately resume CPR.</li>
  <li><strong>Second Shock:</strong> 4 J/kg. Immediately resume CPR.</li>
  <li><strong>Subsequent Shocks:</strong> ≥4 J/kg (max 10 J/kg or adult dose).</li>
</ul>
<p><strong>Medications:</strong></p>
<ul>
  <li>If VF/pVT persists after the second shock, give Epinephrine (0.01 mg/kg IV/IO).</li>
  <li>If VF/pVT persists after the third shock, give <strong>Amiodarone</strong> (5 mg/kg IV/IO bolus; max 300 mg). According to 2025 guidelines, you may <strong>repeat up to 3 doses</strong> for refractory VF/pVT (subsequent doses max 150 mg). Alternatively, give <strong>Lidocaine</strong> (1 mg/kg IV/IO bolus).</li>
</ul>`
      }
    ],
    quiz: {
      title: "Check: Cardiac Arrest Algorithms",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "For a child in Asystole, when should the first dose of Epinephrine be administered according to 2025 guidelines?",
          options: JSON.stringify(["After 2 minutes of CPR", "As soon as IV/IO access is available", "After the first rhythm check", "Only after the second shock"]),
          correctAnswer: "As soon as IV/IO access is available",
          explanation: "For non-shockable rhythms (Asystole, PEA), Epinephrine should be given as soon as IV/IO access is available, without delay."
        },
        {
          order: 2,
          questionText: "What is the recommended energy dose for the first defibrillation attempt in a child?",
          options: JSON.stringify(["1 J/kg", "2 J/kg", "4 J/kg", "10 J/kg"]),
          correctAnswer: "2 J/kg",
          explanation: "The first defibrillation attempt for VF/pVT is 2 J/kg. Subsequent shocks are 4 J/kg or higher."
        },
        {
          order: 3,
          questionText: "Which of the following is NOT one of the 'H's or 'T's (reversible causes) in pediatric cardiac arrest?",
          options: JSON.stringify(["Hypoglycemia", "Hypoxia", "Tension pneumothorax", "Tachycardia"]),
          correctAnswer: "Tachycardia",
          explanation: "Tachycardia is a rhythm, not a reversible cause. The H's and T's are critical to identify and treat during resuscitation."
        }
      ]
    }
  },
  {
    order: 7,
    title: "Module 7: Bradycardia & Tachycardia (2025 Updates)",
    description: "Manage unstable rhythms, apply the 'Rule of 60' for bradycardia, and implement 2025 updates for SVT and other arrhythmias.",
    content: "Prompt recognition and management of arrhythmias are vital to prevent progression to cardiac arrest.",
    duration: 40,
    sections: [
      {
        order: 1,
        title: "Bradycardia: Assessment and Management",
        content: `<h2>Pediatric Bradycardia: When to Intervene</h2>
<p>Bradycardia in children is most often secondary to hypoxia and acidosis. It is an ominous sign.</p>
<div class="warning-note">
  <strong>The Rule of 60:</strong> Start CPR if the heart rate is <60 bpm with signs of poor perfusion (altered mental status, weak pulses, pallor) despite adequate oxygenation and ventilation.
</div>
<p><strong>Management:</strong></p>
<ul>
  <li><strong>Oxygenation and Ventilation:</strong> Ensure adequate.</li>
  <li><strong>Epinephrine:</strong> 0.01 mg/kg IV/IO is the first-line drug for symptomatic bradycardia.</li>
  <li><strong>Atropine:</strong> 0.02 mg/kg IV/IO (minimum 0.1 mg) for primary AV block or increased vagal tone.</li>
  <li><strong>Pacing:</strong> Transcutaneous pacing may be considered if bradycardia is unresponsive to medications and reversible causes are treated.</li>
</ul>`
      },
      {
        order: 2,
        title: "Tachycardia: Stable vs. Unstable",
        content: `<h2>Pediatric Tachycardia: Differentiating Rhythms</h2>
<p>Tachycardia can be sinus tachycardia (normal response to stress) or supraventricular tachycardia (SVT) or ventricular tachycardia (VT).</p>
<ul>
  <li><strong>Sinus Tachycardia:</strong> Usually <220 bpm in infants, <180 bpm in children. P waves present, variable HR. Treat underlying cause (e.g., fever, hypovolemia).</li>
  <li><strong>SVT:</strong> Usually >220 bpm in infants, >180 bpm in children. Absent or abnormal P waves, abrupt onset/offset, constant HR.</li>
  <li><strong>VT:</strong> Wide QRS, often unstable.</li>
</ul>
<h3>Unstable Tachycardia</h3>
<p>Signs of instability: Hypotension, altered mental status, signs of shock, pulmonary edema. Requires immediate synchronized cardioversion.</p>
<ul>
  <li><strong>Synchronized Cardioversion:</strong> 0.5-1 J/kg (first dose), then 1-2 J/kg (second dose).</li>
</ul>`
      },
      {
        order: 3,
        title: "SVT Management and 2025 Sotalol Update",
        content: `<h2>SVT Management</h2>
<p><strong>Stable SVT:</strong></p>
<ul>
  <li><strong>Vagal Maneuvers:</strong> Ice to face (infants), Valsalva (children).</li>
  <li><strong>Adenosine:</strong> 0.1 mg/kg IV rapid push (max 6 mg), may repeat with 0.2 mg/kg (max 12 mg).</li>
</ul>
<div class="clinical-note">
  <strong>2025 Sotalol Update:</strong> IV Sotalol may be considered for refractory SVT if expert consultation is unavailable, particularly in settings where other antiarrhythmics are not readily accessible. This is a new consideration for 2025.
</div>`
      }
    ],
    quiz: {
      title: "Check: Bradycardia & Tachycardia",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "According to the 'Rule of 60', when should CPR be initiated for a bradycardic child?",
          options: JSON.stringify(["HR <60 bpm regardless of perfusion", "HR <60 bpm with signs of poor perfusion despite oxygenation/ventilation", "HR <80 bpm with poor perfusion", "Only if asystole is present"]),
          correctAnswer: "HR <60 bpm with signs of poor perfusion despite oxygenation/ventilation",
          explanation: "The Rule of 60 states that CPR should be started if HR <60 bpm with poor perfusion despite adequate oxygenation and ventilation."
        },
        {
          order: 2,
          questionText: "What is the first-line medication for stable Supraventricular Tachycardia (SVT) in children after vagal maneuvers?",
          options: JSON.stringify(["Epinephrine", "Atropine", "Adenosine", "Amiodarone"]),
          correctAnswer: "Adenosine",
          explanation: "Adenosine is the first-line medication for stable SVT unresponsive to vagal maneuvers."
        },
        {
          order: 3,
          questionText: "What is the recommended initial energy dose for synchronized cardioversion in unstable pediatric tachycardia?",
          options: JSON.stringify(["0.1 J/kg", "0.5-1 J/kg", "2 J/kg", "4 J/kg"]),
          correctAnswer: "0.5-1 J/kg",
          explanation: "The initial energy dose for synchronized cardioversion in unstable pediatric tachycardia is 0.5-1 J/kg."
        }
      ]
    }
  },
  {
    order: 8,
    title: "Module 8: Post-Cardiac Arrest Care & Recovery (2025 Updates)",
    description: "Implement targeted temperature management, understand the 'Recovery' link, and identify key elements of post-resuscitation stabilization.",
    content: "Care after return of spontaneous circulation (ROSC) is critical for neurological outcomes and long-term survival.",
    duration: 35,
    sections: [
      {
        order: 1,
        title: "Optimizing Post-ROSC Care",
        content: `<h2>Post-Cardiac Arrest Syndrome</h2>
<p>After ROSC, children can experience a complex syndrome involving brain injury, myocardial dysfunction, systemic ischemia/reperfusion injury, and persistent precipitating illness.</p>
<h3>Key Goals:</h3>
<ul>
  <li><strong>Optimize Ventilation:</strong> Avoid hyperoxia and hyper/hypocapnia. Target normal SpO2 and ETCO2.</li>
  <li><strong>Optimize Circulation:</strong> Maintain adequate blood pressure and perfusion. Use fluids and vasoactives as needed.</li>
  <li><strong>Targeted Temperature Management (TTM):</strong> Prevent fever (>37.5°C). Consider therapeutic hypothermia (32-34°C) for comatose patients after out-of-hospital cardiac arrest (OHCA) or in-hospital cardiac arrest (IHCA) if feasible and protocols exist.</li>
  <li><strong>Glucose Control:</strong> Avoid hypo- and hyperglycemia.</li>
  <li><strong>Seizure Management:</strong> Treat clinical and electrographic seizures aggressively.</li>
</ul>`
      },
      {
        order: 2,
        title: "The 'Recovery' Link: Long-Term Outcomes",
        content: `<h2>The 6th Link: Recovery</h2>
<p>The 2025 guidelines introduce 'Recovery' as the sixth link in the Chain of Survival, emphasizing the importance of long-term physical, cognitive, and emotional well-being for survivors and their families.</p>
<ul>
  <li><strong>Early Rehabilitation:</strong> Initiate physical, occupational, and speech therapy as soon as medically stable.</li>
  <li><strong>Neuroprognostication:</strong> Use a multimodal approach (clinical exam, EEG, imaging, biomarkers) to assess neurological outcome. Avoid early, definitive prognostication.</li>
  <li><strong>Family Support:</strong> Address the psychological and social needs of families.</li>
</ul>
<div class="clinical-note">
  <strong>Mandate:</strong> Early referral to rehabilitation services is now a 2025 mandate for all cardiac arrest survivors.
</div>`
      }
    ],
    quiz: {
      title: "Check: Post-Cardiac Arrest Care & Recovery",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "According to 2025 guidelines, what is the primary temperature management goal in post-cardiac arrest care?",
          options: JSON.stringify(["Induce severe hypothermia (<30°C)", "Maintain normothermia and prevent fever (>37.5°C)", "Allow mild hyperthermia (38-39°C)", "Rapid rewarming to 37°C"]),
          correctAnswer: "Maintain normothermia and prevent fever (>37.5°C)",
          explanation: "Preventing fever (>37.5°C) is a critical goal in post-cardiac arrest care to improve neurological outcomes."
        },
        {
          order: 2,
          questionText: "Which new link was added to the 2025 Chain of Survival, emphasizing long-term well-being?",
          options: JSON.stringify(["Early Defibrillation", "Advanced Resuscitation", "Recovery", "Post-Cardiac Arrest Care"]),
          correctAnswer: "Recovery",
          explanation: "The 'Recovery' link was added to highlight the importance of long-term physical, cognitive, and emotional support for survivors."
        }
      ]
    }
  },
  {
    order: 9,
    title: "Module 9: PALS Team Dynamics & Communication",
    description: "Apply effective team leadership and communication strategies during resuscitation and conduct effective debriefings.",
    content: "Effective teamwork and clear communication are paramount for successful pediatric resuscitation outcomes.",
    duration: 30,
    sections: [
      {
        order: 1,
        title: "Team Leadership and Roles",
        content: `<h2>The PALS Team Leader</h2>
<p>The <strong>Team Leader</strong> is a separate and distinct role. They must maintain situational awareness and should NOT be involved in hands-on tasks unless absolutely necessary. Their responsibilities include:</p>
<ul>
  <li>Assigning roles and tasks.</li>
  <li>Making treatment decisions and maintaining the algorithm.</li>
  <li>Modeling closed-loop communication.</li>
  <li>Periodically summarizing progress and reassessing the plan.</li>
  <li>Maintaining situational awareness (the "helicopter view").</li>
</ul>
<h3>Key Team Roles:</h3>
<ul>
  <li><strong>Compressor:</strong> Performs high-quality chest compressions.</li>
  <li><strong>Airway/Ventilation:</strong> Manages airway and delivers ventilations.</li>
  <li><strong>Medication:</strong> Prepares and administers drugs.</li>
  <li><strong>Timer/Recorder:</strong> Tracks time, records events, and calls out next drug doses.</li>
  <li><strong>Monitor/Defibrillator/CPR Coach:</strong> A critical 2025 role. They manage the monitor, operate the defibrillator, and actively <strong>coach</strong> the compressor on rate, depth, and recoil to ensure high-quality CPR.</li>
</ul>
<div class="clinical-note">
  <strong>The CPR Coach:</strong> This role is essential for maintaining CPR quality and coordinating switching compressors every 2 minutes to prevent fatigue.
</div>`
      },
      {
        order: 2,
        title: "Effective Communication Strategies",
        content: `<h2>Closed-Loop Communication</h2>
<p>Ensures that messages are sent, received, and understood.</p>
<ul>
  <li><strong>Clear Message:</strong> Leader gives a clear instruction (e.g., "Give Epinephrine 0.01 mg/kg IV").</li>
  <li><strong>Recipient Confirms:</strong> Team member repeats the instruction ("Giving Epinephrine 0.01 mg/kg IV").</li>
  <li><strong>Leader Confirms:</strong> Leader acknowledges ("Correct, give Epinephrine").</li>
  <li><strong>Task Completion:</strong> Team member reports completion ("Epinephrine given").</li>
</ul>
<h3>Other Strategies:</h3>
<ul>
  <li><strong>Clear Roles:</strong> Everyone knows their job.</li>
  <li><strong>Constructive Intervention:</strong> Speak up if you see a safety concern.</li>
  <li><strong>Re-evaluation:</strong> Periodically step back and reassess the patient and the plan.</li>
</ul>`
      },
      {
        order: 3,
        title: "Debriefing for Continuous Improvement",
        content: `<h2>Post-Resuscitation Debriefing</h2>
<p>A critical step for learning and improving future performance.</p>
<h3>Key Elements:</h3>
<ul>
  <li><strong>What went well?</strong></li>
  <li><strong>What could have gone better?</strong></li>
  <li><strong>What will we do differently next time?</strong></li>
  <li><strong>Psychological Safety:</strong> Create an environment where team members feel safe to share observations without fear of blame.</li>
</ul>
<div class="clinical-note">
  <strong>Continuous Learning:</strong> Every resuscitation is an opportunity to learn and refine skills, both individually and as a team.
</div>`
      }
    ],
    quiz: {
      title: "Check: PALS Team Dynamics & Communication",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "Which communication technique ensures that messages are sent, received, and understood during a resuscitation?",
          options: JSON.stringify(["Open-ended questions", "Closed-loop communication", "Briefing", "Debriefing"]),
          correctAnswer: "Closed-loop communication",
          explanation: "Closed-loop communication is a critical technique to ensure clear and accurate information exchange within the resuscitation team."
        },
        {
          order: 2,
          questionText: "What is a primary responsibility of the PALS team leader?",
          options: JSON.stringify(["Performing all chest compressions", "Administering all medications", "Assigning roles and tasks", "Recording all events"]),
          correctAnswer: "Assigning roles and tasks",
          explanation: "The team leader is responsible for organizing the team, assigning roles, and making treatment decisions."
        },
        {
          order: 3,
          questionText: "What is the purpose of a post-resuscitation debriefing?",
          options: JSON.stringify(["To assign blame for errors", "To document legal aspects of the resuscitation", "To identify what went well and what could be improved", "To review patient billing information"]),
          correctAnswer: "To identify what went well and what could be improved",
          explanation: "Debriefing is a crucial learning tool to analyze team performance, identify areas for improvement, and enhance psychological safety."
        }
      ]
    }
  }
];

async function seedPalsCourse() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!); // Use DATABASE_URL

  try {
    await connection.beginTransaction();

    // Clear existing modules and sections for this course
    await connection.execute('DELETE FROM quizQuestions WHERE quizId IN (SELECT id FROM quizzes WHERE moduleId IN (SELECT id FROM modules WHERE courseId = ?))', [PALS_COURSE_ID]);
    await connection.execute('DELETE FROM quizzes WHERE moduleId IN (SELECT id FROM modules WHERE courseId = ?)', [PALS_COURSE_ID]);
    await connection.execute('DELETE FROM moduleSections WHERE moduleId IN (SELECT id FROM modules WHERE courseId = ?)', [PALS_COURSE_ID]);
    await connection.execute('DELETE FROM modules WHERE courseId = ?', [PALS_COURSE_ID]);

    // Insert new modules and their sections/quizzes
    for (const module of modules) {
      const [moduleResult]: any = await connection.execute(
        'INSERT INTO modules (courseId, title, description, content, duration, `order`) VALUES (?, ?, ?, ?, ?, ?)',
        [PALS_COURSE_ID, module.title, module.description, module.content, module.duration, module.order]
      );
      const moduleId = moduleResult.insertId;

      for (const section of module.sections) {
        await connection.execute(
          'INSERT INTO moduleSections (moduleId, title, content, `order`) VALUES (?, ?, ?, ?)',
          [moduleId, section.title, section.content, section.order]
        );
      }

      if (module.quiz) {
        const [quizResult]: any = await connection.execute(
          'INSERT INTO quizzes (moduleId, title, passingScore) VALUES (?, ?, ?)',
          [moduleId, module.quiz.title, module.quiz.passingScore]
        );
        const quizId = quizResult.insertId;

        for (const question of module.quiz.questions) {
          await connection.execute(
            'INSERT INTO quizQuestions (quizId, question, options, correctAnswer, explanation, `order`) VALUES (?, ?, ?, ?, ?, ?)',
            [quizId, question.questionText, question.options, question.correctAnswer, question.explanation, question.order]
          );
        }
      }
    }

    await connection.commit();
    console.log(`PALS 2025 (Beginner-Friendly) course seeded successfully for courseId: ${PALS_COURSE_ID}`);
  } catch (error) {
    await connection.rollback();
    console.error('Failed to seed PALS 2025 course:', error);
  } finally {
    await connection.end();
  }
}

seedPalsCourse();
