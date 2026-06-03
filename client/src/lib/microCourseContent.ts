/**
 * Static content library for micro-courses.
 *
 * Each course entry provides modules, quizzes, key points, and references.
 * The MicroCoursePlayer calls getMicroCourseContent(courseId) to get this data.
 *
 * Guidelines: AHA PALS 2025, WHO IMCI, GINA 2024, BTS/SIGN Asthma Guidelines.
 */

export interface MicroCourseQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface MicroCourseModule {
  id: string;
  title: string;
  duration: number; // minutes
  learningObjectives: string[];
  content: string; // HTML
  keyPoints: string[];
  references: string[];
  quiz: MicroCourseQuizQuestion[];
}

export interface MicroCourseStaticContent {
  courseId: string;
  modules: MicroCourseModule[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Asthma I: Recognition and Initial Management
// ─────────────────────────────────────────────────────────────────────────────
const ASTHMA_I: MicroCourseStaticContent = {
  courseId: "asthma-i",
  modules: [
    {
      id: "asthma-i-mod-1",
      title: "Recognising Asthma Severity in Children",
      duration: 15,
      learningObjectives: [
        "Classify asthma exacerbation severity (mild, moderate, severe, life-threatening)",
        "Identify clinical signs that indicate impending respiratory failure",
        "Apply the PEFR / SpO₂ thresholds used in severity scoring",
      ],
      content: `
<h2>Why Severity Classification Matters</h2>
<p>Paediatric asthma is the most common chronic respiratory disease in children globally. Failure to recognise severity rapidly is a leading cause of preventable death. The first 30 minutes of assessment determine whether a child lives or dies.</p>

<h3>Severity Classification (GINA 2024 / BTS-SIGN)</h3>
<table style="width:100%;border-collapse:collapse;font-size:0.85rem">
  <thead>
    <tr style="background:#f1f5f9">
      <th style="border:1px solid #cbd5e1;padding:6px">Feature</th>
      <th style="border:1px solid #cbd5e1;padding:6px">Mild</th>
      <th style="border:1px solid #cbd5e1;padding:6px">Moderate</th>
      <th style="border:1px solid #cbd5e1;padding:6px">Severe</th>
      <th style="border:1px solid #cbd5e1;padding:6px">Life-threatening</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:6px">SpO₂ (air)</td>
      <td style="border:1px solid #cbd5e1;padding:6px">≥ 95%</td>
      <td style="border:1px solid #cbd5e1;padding:6px">92–94%</td>
      <td style="border:1px solid #cbd5e1;padding:6px">&lt; 92%</td>
      <td style="border:1px solid #cbd5e1;padding:6px">&lt; 92% + features below</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:6px">Speech</td>
      <td style="border:1px solid #cbd5e1;padding:6px">Normal sentences</td>
      <td style="border:1px solid #cbd5e1;padding:6px">Short phrases</td>
      <td style="border:1px solid #cbd5e1;padding:6px">Single words</td>
      <td style="border:1px solid #cbd5e1;padding:6px">Unable to speak</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:6px">Accessory muscles</td>
      <td style="border:1px solid #cbd5e1;padding:6px">None</td>
      <td style="border:1px solid #cbd5e1;padding:6px">Mild use</td>
      <td style="border:1px solid #cbd5e1;padding:6px">Marked use</td>
      <td style="border:1px solid #cbd5e1;padding:6px">Exhaustion / paradox</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:6px">PEFR (% predicted)</td>
      <td style="border:1px solid #cbd5e1;padding:6px">&gt; 75%</td>
      <td style="border:1px solid #cbd5e1;padding:6px">50–75%</td>
      <td style="border:1px solid #cbd5e1;padding:6px">33–50%</td>
      <td style="border:1px solid #cbd5e1;padding:6px">&lt; 33%</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:6px">Consciousness</td>
      <td style="border:1px solid #cbd5e1;padding:6px">Alert</td>
      <td style="border:1px solid #cbd5e1;padding:6px">Alert</td>
      <td style="border:1px solid #cbd5e1;padding:6px">Agitated</td>
      <td style="border:1px solid #cbd5e1;padding:6px">Drowsy / confused</td>
    </tr>
  </tbody>
</table>

<h3>Life-threatening Features — Act Immediately</h3>
<ul>
  <li>Silent chest (no wheeze despite effort)</li>
  <li>Cyanosis</li>
  <li>Poor respiratory effort / bradypnoea</li>
  <li>Altered consciousness / exhaustion</li>
  <li>SpO₂ &lt; 92% despite high-flow O₂</li>
  <li>Hypotension</li>
</ul>

<h3>Risk Factors for Near-Fatal Asthma</h3>
<ul>
  <li>Previous ICU admission or intubation for asthma</li>
  <li>≥ 2 hospitalisations in the past year</li>
  <li>≥ 3 ED visits in the past year</li>
  <li>Oral corticosteroid use or recent discontinuation</li>
  <li>Non-adherence to inhaled corticosteroids</li>
  <li>Food allergy in asthmatic child</li>
  <li>Psychosocial problems / poor access to healthcare</li>
</ul>
      `,
      keyPoints: [
        "SpO₂ < 92% on air = severe exacerbation — escalate immediately",
        "Silent chest is a pre-arrest sign, not a sign of improvement",
        "PEFR < 33% predicted = life-threatening — do not delay treatment",
        "Always ask about previous ICU admissions — it predicts near-fatal risk",
        "Agitation and drowsiness are signs of hypoxia and CO₂ retention",
      ],
      references: [
        "GINA 2024 — Global Initiative for Asthma. Pocket Guide for Asthma Management and Prevention.",
        "BTS/SIGN British Guideline on the Management of Asthma 2023.",
        "AHA PALS Provider Manual 2025 — Respiratory Emergencies.",
        "WHO IMCI Integrated Management of Childhood Illness 2022.",
      ],
      quiz: [
        {
          question: "A 6-year-old with asthma has SpO₂ 90% on room air, can only speak single words, and has marked intercostal recession. What severity is this?",
          options: ["Mild", "Moderate", "Severe", "Life-threatening"],
          correctAnswer: "Severe",
          explanation: "SpO₂ < 92%, single-word speech, and marked accessory muscle use all indicate severe exacerbation. Life-threatening would require additional features such as silent chest, cyanosis, or altered consciousness.",
        },
        {
          question: "Which of the following is a life-threatening sign in a child with asthma?",
          options: [
            "Mild intercostal recession with SpO₂ 96%",
            "Silent chest with SpO₂ 88% despite O₂",
            "PEFR 60% predicted with wheeze",
            "Short-phrase speech with SpO₂ 93%",
          ],
          correctAnswer: "Silent chest with SpO₂ 88% despite O₂",
          explanation: "Silent chest indicates no air movement despite respiratory effort — a pre-arrest sign. Combined with SpO₂ < 92% despite oxygen, this is life-threatening.",
        },
        {
          question: "Which historical feature most strongly predicts near-fatal asthma in a child?",
          options: [
            "Seasonal wheeze since age 2",
            "Previous ICU admission for asthma",
            "Mild intermittent asthma on salbutamol PRN",
            "Family history of atopy",
          ],
          correctAnswer: "Previous ICU admission for asthma",
          explanation: "Previous ICU admission or intubation for asthma is the strongest predictor of near-fatal risk. These children require aggressive early treatment and low threshold for escalation.",
        },
        {
          question: "A child with asthma is drowsy and has a PEFR of 28% predicted. What is the correct classification?",
          options: ["Moderate", "Severe", "Life-threatening", "Mild"],
          correctAnswer: "Life-threatening",
          explanation: "PEFR < 33% predicted AND altered consciousness (drowsiness) both independently indicate life-threatening exacerbation. Immediate treatment and senior review are required.",
        },
        {
          question: "What SpO₂ threshold on room air defines a severe asthma exacerbation in children?",
          options: ["< 98%", "< 95%", "< 92%", "< 88%"],
          correctAnswer: "< 92%",
          explanation: "SpO₂ < 92% on room air defines severe exacerbation per GINA 2024 and BTS/SIGN guidelines. Values < 92% despite supplemental oxygen suggest life-threatening disease.",
        },
      ],
    },
    {
      id: "asthma-i-mod-2",
      title: "Initial Management: Bronchodilators and Oxygen",
      duration: 20,
      learningObjectives: [
        "Prescribe weight-based salbutamol (MDI + spacer and nebulised) for acute asthma",
        "Identify when to add ipratropium bromide",
        "Apply oxygen therapy targets in acute asthma",
        "Recognise when systemic corticosteroids are indicated",
      ],
      content: `
<h2>The First 30 Minutes: Rapid Bronchodilation</h2>
<p>Speed of bronchodilator delivery is the single most important determinant of outcome in acute paediatric asthma. Do not delay treatment while waiting for investigations.</p>

<h3>Step 1 — Oxygen</h3>
<ul>
  <li>Target SpO₂ <strong>94–98%</strong> (avoid hyperoxia)</li>
  <li>Deliver via face mask or nasal cannula</li>
  <li>High-flow O₂ (15 L/min non-rebreather) for SpO₂ &lt; 92%</li>
  <li>Do NOT withhold O₂ while waiting for salbutamol</li>
</ul>

<h3>Step 2 — Salbutamol (First-line Bronchodilator)</h3>
<p><strong>MDI + spacer (preferred in mild–moderate):</strong></p>
<ul>
  <li>&lt; 6 years: 2–6 puffs (100 mcg/puff) every 20 min × 3 doses</li>
  <li>≥ 6 years: 4–8 puffs every 20 min × 3 doses</li>
</ul>
<p><strong>Nebulised salbutamol (severe / unable to use MDI):</strong></p>
<ul>
  <li>&lt; 5 years: 2.5 mg (0.5 mL of 0.5% solution + 2.5 mL normal saline)</li>
  <li>≥ 5 years: 5 mg (1 mL of 0.5% solution + 2 mL normal saline)</li>
  <li>Frequency: every 20 min × 3, then reassess</li>
  <li>Continuous nebulisation: 0.15–0.3 mg/kg/hour (max 10 mg/hour) for severe/life-threatening</li>
</ul>
<p><strong>IV salbutamol</strong> (when inhaled route inadequate):</p>
<ul>
  <li>Loading dose: 15 mcg/kg over 10 min (max 250 mcg)</li>
  <li>Infusion: 1–5 mcg/kg/min, titrate to response</li>
</ul>

<h3>Step 3 — Ipratropium Bromide (Add in Moderate–Severe)</h3>
<ul>
  <li>&lt; 5 years: 0.25 mg (250 mcg) nebulised every 20 min × 3 doses</li>
  <li>≥ 5 years: 0.5 mg (500 mcg) nebulised every 20 min × 3 doses</li>
  <li>Evidence: reduces hospitalisation rate when added to salbutamol in moderate–severe exacerbations</li>
  <li>Do NOT use as monotherapy</li>
</ul>

<h3>Step 4 — Systemic Corticosteroids</h3>
<ul>
  <li>Indicated: moderate, severe, or life-threatening exacerbation; or inadequate response to 3 doses of salbutamol</li>
  <li>Prednisolone oral: 1–2 mg/kg/day (max 40 mg) for 3–5 days</li>
  <li>Dexamethasone oral: 0.15–0.6 mg/kg (max 10 mg) single dose or 2 doses — equivalent efficacy, better adherence</li>
  <li>IV hydrocortisone: 4 mg/kg (max 100 mg) if unable to take oral</li>
  <li>Start within 1 hour of presentation — reduces admission rate and length of stay</li>
</ul>

<h3>Reassessment After Initial Treatment</h3>
<p>Reassess at 20 minutes and again at 60 minutes:</p>
<ul>
  <li>SpO₂, respiratory rate, work of breathing, auscultation</li>
  <li>PEFR if ≥ 5 years and cooperative</li>
  <li>Response to treatment guides escalation or discharge planning</li>
</ul>
      `,
      keyPoints: [
        "Salbutamol MDI + spacer is as effective as nebulisation in mild–moderate asthma",
        "Add ipratropium to salbutamol in moderate–severe — it reduces hospitalisation",
        "Systemic corticosteroids should be given within 1 hour of presentation",
        "Target SpO₂ 94–98% — avoid hyperoxia",
        "Continuous salbutamol nebulisation is appropriate for severe/life-threatening disease",
        "Reassess at 20 minutes — if no improvement, escalate immediately",
      ],
      references: [
        "GINA 2024 — Global Initiative for Asthma. Pocket Guide for Asthma Management and Prevention.",
        "BTS/SIGN British Guideline on the Management of Asthma 2023.",
        "AHA PALS Provider Manual 2025 — Respiratory Emergencies.",
        "Rodrigo GJ, Castro-Rodriguez JA. Anticholinergics in the treatment of children and adults with acute asthma: a systematic review with meta-analysis. Thorax 2005.",
      ],
      quiz: [
        {
          question: "A 4-year-old (15 kg) with moderate asthma needs nebulised salbutamol. What is the correct dose?",
          options: ["1.25 mg", "2.5 mg", "5 mg", "10 mg"],
          correctAnswer: "2.5 mg",
          explanation: "For children < 5 years, the standard nebulised salbutamol dose is 2.5 mg (0.5 mL of 0.5% solution + 2.5 mL normal saline), regardless of weight, per BTS/SIGN and GINA guidelines.",
        },
        {
          question: "When should ipratropium bromide be added to salbutamol in acute paediatric asthma?",
          options: [
            "All exacerbations regardless of severity",
            "Only in life-threatening exacerbations",
            "Moderate to severe exacerbations",
            "Only when salbutamol is unavailable",
          ],
          correctAnswer: "Moderate to severe exacerbations",
          explanation: "Ipratropium should be added to salbutamol in moderate to severe exacerbations. Evidence shows it reduces hospitalisation rates. It should not be used as monotherapy.",
        },
        {
          question: "What is the target SpO₂ range when administering oxygen in acute paediatric asthma?",
          options: ["88–92%", "92–94%", "94–98%", "98–100%"],
          correctAnswer: "94–98%",
          explanation: "The target SpO₂ is 94–98%. Hyperoxia (> 98%) should be avoided as it can worsen V/Q mismatch. Hypoxia (< 92%) requires immediate high-flow oxygen.",
        },
        {
          question: "A 7-year-old with severe asthma cannot take oral medication. Which corticosteroid route is appropriate?",
          options: [
            "Inhaled fluticasone via spacer",
            "IV hydrocortisone 4 mg/kg",
            "Intramuscular dexamethasone 0.6 mg/kg",
            "Rectal prednisolone suppository",
          ],
          correctAnswer: "IV hydrocortisone 4 mg/kg",
          explanation: "IV hydrocortisone 4 mg/kg (max 100 mg) is the appropriate choice when a child cannot take oral medication. Inhaled corticosteroids have no role in acute exacerbation management.",
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// PALS 2025: Beginner-Friendly Curriculum
// ─────────────────────────────────────────────────────────────────────────────
const PALS_2025: MicroCourseStaticContent = {
  courseId: "pals-2025",
  modules: [
    {
      id: "pals-2025-mod-1",
      title: "Module 1: Introduction to PALS & Pediatric Assessment",
      duration: 45,
      learningObjectives: [
        "Understand the scope and importance of PALS.",
        "Master the Pediatric Assessment Triangle (PAT).",
        "Perform a systematic primary assessment (ABCDE approach).",
        "Recognize signs of respiratory distress, respiratory failure, and shock.",
      ],
      content: `<h2>Why PALS Matters</h2>
<p>Pediatric Advanced Life Support (PALS) is a critical course designed to improve outcomes for critically ill infants and children. It focuses on a systematic approach to assessment and management, emphasizing early recognition and intervention to prevent cardiac arrest.</p>
<div class="clinical-note">
  <strong>The Paeds Resus Mission:</strong> To reduce preventable deaths by delivering reliable, practical, rollout-ready improvements for low-resource hospitals. PALS is a cornerstone of this mission.
</div>
<h3>PALS Team Dynamics</h3>
<p>Effective resuscitation relies on a well-coordinated team. Understanding roles, responsibilities, and closed-loop communication is vital for success.</p>`,
      keyPoints: [
        "PALS improves outcomes for critically ill children.",
        "Systematic approach to assessment is key.",
        "Early recognition prevents cardiac arrest.",
        "Effective team dynamics are crucial.",
      ],
      references: [
        "AHA PALS Provider Manual 2025 - Introduction.",
        "Paeds Resus Platform - Mission Statement.",
      ],
      quiz: [
        {
          question: "Which component of the Pediatric Assessment Triangle (PAT) evaluates the child's neurological status (Appearance)?",
          options: ["Appearance", "Work of Breathing", "Circulation to the Skin", "Respiratory Rate"],
          correctAnswer: "Appearance",
          explanation: "The Appearance component of the PAT (mental status, muscle tone, interactiveness) specifically evaluates the child's neurological status.",
        },
        {
          question: "According to the ABCDE approach, what is the immediate action if a child is found to be unresponsive?",
          options: ["Check blood pressure", "Administer oxygen", "Activate BLS/ALS pathway", "Assess capillary refill"],
          correctAnswer: "Activate BLS/ALS pathway",
          explanation: "An unresponsive child requires immediate activation of the BLS/ALS pathway to initiate resuscitation.",
        },
        {
          question: "A child with increased work of breathing, tachypnea, but normal mental status and SpO2 is likely in what state?",
          options: ["Respiratory Failure", "Compensated Shock", "Respiratory Distress", "Decompensated Shock"],
          correctAnswer: "Respiratory Distress",
          explanation: "Respiratory distress is characterized by increased work of breathing with adequate gas exchange. Respiratory failure involves altered mental status, bradypnea, or cyanosis.",
        },
      ],
    },
    {
      id: "pals-2025-mod-2",
      title: "Module 2: Basic Life Support (BLS) for Infants & Children",
      duration: 40,
      learningObjectives: [
        "Perform high-quality CPR for infants and children (single and two-rescuer).",
        "Utilize an Automated External Defibrillator (AED) for pediatric patients.",
        "Manage foreign-body airway obstruction (FBAO) in infants and children.",
      ],
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
<p><strong>Two Rescuers:</strong> Use the 15:2 compression-to-ventilation ratio for both infants and children.</p>`,
      keyPoints: [
        "CPR rate: 100-120/min.",
        "CPR depth: 1/3 AP diameter (1.5in infants, 2in children).",
        "Allow full chest recoil.",
        "Minimize interruptions.",
        "Single rescuer: 30:2. Two rescuers: 15:2.",
      ],
      references: [
        "AHA PALS Provider Manual 2025 - BLS.",
      ],
      quiz: [
        {
          question: "What is the recommended compression-to-ventilation ratio for a single rescuer performing CPR on an infant?",
          options: ["15:2", "30:2", "5:1", "20:2"],
          correctAnswer: "30:2",
          explanation: "For a single rescuer, the ratio is 30 compressions to 2 ventilations for both infants and children.",
        },
        {
          question: "When using an AED on an infant, what is the preferred method if a manual defibrillator is unavailable?",
          options: ["Adult pads without attenuation", "Child attenuator pads", "Do not use an AED", "Wait for a manual defibrillator"],
          correctAnswer: "Child attenuator pads",
          explanation: "If a manual defibrillator is unavailable, an AED with child attenuator pads is preferred for infants. If child pads are unavailable, adult pads can be used, ensuring they do not touch.",
        },
        {
          question: "What is the initial intervention for a conscious infant with a severe foreign-body airway obstruction?",
          options: ["Abdominal thrusts", "Blind finger sweeps", "5 back blows and 5 chest thrusts", "Start CPR"],
          correctAnswer: "5 back blows and 5 chest thrusts",
          explanation: "For a conscious infant with FBAO, deliver 5 back blows followed by 5 chest thrusts until the object is expelled or the infant becomes unconscious.",
        },
      ],
    },
    {
      id: "pals-2025-mod-3",
      title: "Module 3: Airway Management & Oxygen Delivery",
      duration: 35,
      learningObjectives: [
        "Select appropriate oxygen delivery devices and flow rates.",
        "Perform basic airway maneuvers (head-tilt chin-lift, jaw-thrust).",
        "Understand indications for advanced airway management.",
      ],
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
</div>`,
      keyPoints: [
        "Oxygen is a drug, use judiciously.",
        "Target SpO2: 94-99% once stable.",
        "Avoid hyperoxia.",
        "Head-tilt chin-lift for most, jaw-thrust for C-spine injury.",
        "Cuffed ETTs preferred for advanced airways.",
      ],
      references: [
        "AHA PALS Provider Manual 2025 - Airway Management.",
      ],
      quiz: [
        {
          question: "What is the recommended SpO2 target range for a stable pediatric patient receiving oxygen therapy, according to 2025 guidelines?",
          options: ["90-92%", "92-94%", "94-99%", "100%"],
          correctAnswer: "94-99%",
          explanation: "The 2025 guidelines recommend titrating oxygen to maintain SpO2 between 94-99% once stable, avoiding hyperoxia.",
        },
        {
          question: "Which airway maneuver is preferred for a patient with suspected cervical spine injury?",
          options: ["Head-tilt chin-lift", "Jaw-thrust maneuver", "Oropharyngeal airway insertion", "Nasopharyngeal airway insertion"],
          correctAnswer: "Jaw-thrust maneuver",
          explanation: "The jaw-thrust maneuver minimizes neck movement and is preferred for patients with suspected cervical spine injury.",
        },
        {
          question: "According to 2025 guidelines, which type of endotracheal tube is preferred for infants and children?",
          options: ["Uncuffed ETT", "Cuffed ETT", "Tracheostomy tube", "Laryngeal Mask Airway"],
          correctAnswer: "Cuffed ETT",
          explanation: "The 2025 guidelines prefer cuffed endotracheal tubes for all ages to allow for better pressure control and tidal volume delivery.",
        },
      ],
    },
    {
      id: "pals-2025-mod-4",
      title: "Module 4: Respiratory Distress & Failure (2025 Updates)",
      duration: 40,
      learningObjectives: [
        "Differentiate between respiratory distress and respiratory failure.",
        "Apply the 2025 guidelines for managing specific respiratory emergencies (e.g., asthma, bronchiolitis).",
        "Understand the role of non-invasive ventilation.",
      ],
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
</div>`,
      keyPoints: [
        "Differentiate distress from failure.",
        "Bradycardia in respiratory illness is ominous.",
        "Tailor treatment to specific conditions (asthma, bronchiolitis, croup, anaphylaxis).",
        "Ventilation rate: 20-30 breaths/min for children with pulse.",
        "NIV (CPAP/BiPAP) can avoid intubation.",
      ],
      references: [
        "AHA PALS Provider Manual 2025 - Respiratory Emergencies.",
        "GINA 2024 - Global Initiative for Asthma.",
      ],
      quiz: [
        {
          question: "Which of the following is an ominous sign in a child with respiratory symptoms, indicating impending cardiac arrest?",
          options: ["Tachypnea", "Wheezing", "Bradycardia", "Retractions"],
          correctAnswer: "Bradycardia",
          explanation: "Bradycardia in a child with respiratory symptoms is a late and ominous sign, often preceding cardiac arrest.",
        },
        {
          question: "According to 2025 guidelines, what is the recommended ventilation rate for a child with a pulse but inadequate breathing?",
          options: ["8-10 breaths/min", "12-20 breaths/min", "20-30 breaths/min", "30-40 breaths/min"],
          correctAnswer: "20-30 breaths/min",
          explanation: "The 2025 guidelines recommend 1 breath every 2-3 seconds (20-30 breaths per minute) to avoid hyperventilation.",
        },
        {
          question: "Which medication is the first-line treatment for anaphylaxis with respiratory compromise?",
          options: ["Albuterol", "Dexamethasone", "Epinephrine (IM)", "Diphenhydramine"],
          correctAnswer: "Epinephrine (IM)",
          explanation: "Intramuscular epinephrine is the first-line treatment for anaphylaxis, especially with respiratory or circulatory involvement.",
        },
      ],
    },
    {
      id: "pals-2025-mod-5",
      title: "Module 5: Circulatory Emergencies & Shock (2025 Updates)",
      duration: 40,
      learningObjectives: [
        "Classify different types of shock in children.",
        "Implement the 2025 fluid resuscitation strategy with reassessment.",
        "Identify early indications for vasoactive medications in septic shock.",
      ],
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
</table>`,
      keyPoints: [
        "Four types of shock: Hypovolemic, Distributive, Cardiogenic, Obstructive.",
        "Reassess after every fluid bolus (20 mL/kg).",
        "Early vasoactives for fluid-refractory septic shock.",
        "Smaller fluid boluses for cardiogenic shock.",
        "IO access if IV not established within 60s or 2 attempts.",
      ],
      references: [
        "AHA PALS Provider Manual 2025 - Shock.",
      ],
      quiz: [
        {
          question: "A child in septic shock has received 60 mL/kg of fluid and remains hypotensive. What is the next most appropriate step according to 2025 guidelines?",
          options: ["Administer another 20 mL/kg fluid bolus", "Initiate vasoactive medication infusion", "Perform a pericardiocentesis", "Wait 30 minutes and reassess"],
          correctAnswer: "Initiate vasoactive medication infusion",
          explanation: "The 2025 guidelines emphasize early initiation of vasoactive medications in fluid-refractory septic shock after 40-60 mL/kg of fluid.",
        },
        {
          question: "Which type of shock is characterized by tachycardia, poor perfusion, and an enlarged liver?",
          options: ["Hypovolemic shock", "Distributive shock", "Cardiogenic shock", "Obstructive shock"],
          correctAnswer: "Cardiogenic shock",
          explanation: "Cardiogenic shock often presents with signs of fluid overload (enlarged liver, crackles) due to pump failure, in addition to poor perfusion.",
        },
        {
          question: "When should intraosseous (IO) access be considered during a pediatric resuscitation?",
          options: ["After 5 minutes of failed IV attempts", "Only in children under 1 year old", "If IV access cannot be established within 60 seconds or 2 attempts", "As a last resort after all other options fail"],
          correctAnswer: "If IV access cannot be established within 60 seconds or 2 attempts",
          explanation: "IO access should be established rapidly if IV access is difficult, specifically if it cannot be obtained within 60 seconds or after 2 attempts.",
        },
      ],
    },
    {
      id: "pals-2025-mod-6",
      title: "Module 6: Cardiac Arrest Algorithms (2025 Updates)",
      duration: 45,
      learningObjectives: [
        "Master high-performance CPR, execute the 2025 non-shockable and shockable cardiac arrest algorithms, and prioritize early Epinephrine.",
      ],
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
</div>
<h3>The Non-Shockable Pathway: PEA and Asystole</h3>
<p>These rhythms are not amenable to defibrillation. The priority is high-quality CPR and early administration of Epinephrine.</p>
<div class="clinical-note">
  <strong>2025 Mandate:</strong> Administer Epinephrine 0.01 mg/kg IV/IO as soon as possible after starting CPR for non-shockable rhythms. Repeat every 3-5 minutes.
</div>
<h3>The Shockable Pathway: VF and Pulseless VT</h3>
<p>Defibrillation is the priority for VF and pulseless VT.</p>
<ul>
  <li><strong>First Shock:</strong> 2 J/kg. Immediately resume CPR.</li>
  <li><strong>Second Shock:</strong> 4 J/kg. Immediately resume CPR.</li>
  <li><strong>Subsequent Shocks:</strong> ≥4 J/kg (max 10 J/kg or adult dose).</li>
</ul>
<p><strong>Medications:</strong></p>
<ul>
  <li>If VF/pVT persists after the second shock, give Epinephrine (0.01 mg/kg IV/IO).</li>
  <li>If VF/pVT persists after the third shock, give <strong>Amiodarone</strong> (5 mg/kg IV/IO bolus; max 300 mg). According to 2025 guidelines, you may <strong>repeat up to 3 doses</strong> for refractory VF/pVT (subsequent doses max 150 mg). Alternatively, give <strong>Lidocaine</strong> (1 mg/kg IV/IO bolus).</li>
</ul>`,
      keyPoints: [
        "High-quality CPR is paramount.",
        "Epinephrine ASAP for non-shockable rhythms (Asystole, PEA).",
        "Shock is priority for shockable rhythms (VF, pVT).",
        "Defibrillation: 2 J/kg first, then 4 J/kg, then ≥4 J/kg.",
        "Treat H's and T's.",
      ],
      references: [
        "AHA PALS Provider Manual 2025 - Cardiac Arrest.",
      ],
      quiz: [
        {
          question: "For a child in Asystole, when should the first dose of Epinephrine be administered according to 2025 guidelines?",
          options: ["After 2 minutes of CPR", "As soon as IV/IO access is available", "After the first rhythm check", "Only after the second shock"],
          correctAnswer: "As soon as IV/IO access is available",
          explanation: "For non-shockable rhythms (Asystole, PEA), Epinephrine should be given as soon as IV/IO access is available, without delay.",
        },
        {
          question: "What is the recommended energy dose for the first defibrillation attempt in a child?",
          options: ["1 J/kg", "2 J/kg", "4 J/kg", "10 J/kg"],
          correctAnswer: "2 J/kg",
          explanation: "The first defibrillation attempt for VF/pVT is 2 J/kg. Subsequent shocks are 4 J/kg or higher.",
        },
        {
          question: "Which of the following is NOT one of the 'H's or 'T's (reversible causes) in pediatric cardiac arrest?",
          options: ["Hypoglycemia", "Hypoxia", "Tension pneumothorax", "Tachycardia"],
          correctAnswer: "Tachycardia",
          explanation: "Tachycardia is a rhythm, not a reversible cause. The H's and T's are critical to identify and treat during resuscitation.",
        },
      ],
    },
    {
      id: "pals-2025-mod-7",
      title: "Module 7: Bradycardia & Tachycardia (2025 Updates)",
      duration: 40,
      learningObjectives: [
        "Manage unstable rhythms, apply the 'Rule of 60' for bradycardia, and implement 2025 updates for SVT and other arrhythmias.",
      ],
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
</ul>`,
      keyPoints: [
        "Bradycardia is often due to hypoxia/acidosis.",
        "Rule of 60: Start CPR if HR <60 with poor perfusion.",
        "Epinephrine is first-line for symptomatic bradycardia.",
        "Unstable tachycardia requires synchronized cardioversion.",
        "IV Sotalol for refractory SVT (2025 update).",
      ],
      references: [
        "AHA PALS Provider Manual 2025 - Arrhythmias.",
      ],
      quiz: [
        {
          question: "According to the 'Rule of 60', when should CPR be initiated for a bradycardic child?",
          options: ["HR <60 bpm regardless of perfusion", "HR <60 bpm with signs of poor perfusion despite oxygenation/ventilation", "HR <80 bpm with poor perfusion", "Only if asystole is present"],
          correctAnswer: "HR <60 bpm with signs of poor perfusion despite oxygenation/ventilation",
          explanation: "The Rule of 60 states that CPR should be started if HR <60 bpm with poor perfusion despite adequate oxygenation and ventilation.",
        },
        {
          question: "What is the first-line medication for stable Supraventricular Tachycardia (SVT) in children after vagal maneuvers?",
          options: ["Epinephrine", "Atropine", "Adenosine", "Amiodarone"],
          correctAnswer: "Adenosine",
          explanation: "Adenosine is the first-line medication for stable SVT unresponsive to vagal maneuvers.",
        },
        {
          question: "What is the recommended initial energy dose for synchronized cardioversion in unstable pediatric tachycardia?",
          options: ["0.1 J/kg", "0.5-1 J/kg", "2 J/kg", "4 J/kg"],
          correctAnswer: "0.5-1 J/kg",
          explanation: "The initial energy dose for synchronized cardioversion in unstable pediatric tachycardia is 0.5-1 J/kg.",
        },
      ],
    },
    {
      id: "pals-2025-mod-8",
      title: "Module 8: Post-Cardiac Arrest Care & Recovery (2025 Updates)",
      duration: 35,
      learningObjectives: [
        "Implement targeted temperature management to prevent hyperthermia.",
        "Understand the importance of the 'Recovery' link in the Chain of Survival.",
        "Identify key elements of post-resuscitation stabilization.",
      ],
      content: `<h2>Post-Cardiac Arrest Syndrome</h2>
<p>After ROSC, children can experience a complex syndrome involving brain injury, myocardial dysfunction, systemic ischemia/reperfusion injury, and persistent precipitating illness.</p>
<h3>Key Goals:</h3>
<ul>
  <li><strong>Optimize Ventilation:</strong> Avoid hyperoxia and hyper/hypocapnia. Target normal SpO2 and ETCO2.</li>
  <li><strong>Optimize Circulation:</strong> Maintain adequate blood pressure and perfusion. Use fluids and vasoactives as needed.</li>
  <li><strong>Targeted Temperature Management (TTM):</strong> Prevent fever (>37.5°C). Consider therapeutic hypothermia (32-34°C) for comatose patients after out-of-hospital cardiac arrest (OHCA) or in-hospital cardiac arrest (IHCA) if feasible and protocols exist.</li>
  <li><strong>Glucose Control:</strong> Avoid hypo- and hyperglycemia.</li>
  <li><strong>Seizure Management:</strong> Treat clinical and electrographic seizures aggressively.</li>
</ul>`,
      keyPoints: [
        "Post-ROSC care is critical for neurological outcomes.",
        "Prevent fever (>37.5°C).",
        "'Recovery' is the 6th link in the Chain of Survival.",
        "Early rehabilitation is a 2025 mandate.",
        "Multimodal neuroprognostication.",
      ],
      references: [
        "AHA PALS Provider Manual 2025 - Post-Cardiac Arrest Care.",
      ],
      quiz: [
        {
          question: "According to 2025 guidelines, what is the primary temperature management goal in post-cardiac arrest care?",
          options: ["Induce severe hypothermia (<30°C)", "Maintain normothermia and prevent fever (>37.5°C)", "Allow mild hyperthermia (38-39°C)", "Rapid rewarming to 37°C"],
          correctAnswer: "Maintain normothermia and prevent fever (>37.5°C)",
          explanation: "Preventing fever (>37.5°C) is a critical goal in post-cardiac arrest care to improve neurological outcomes.",
        },
        {
          question: "Which new link was added to the 2025 Chain of Survival, emphasizing long-term well-being?",
          options: ["Early Defibrillation", "Advanced Resuscitation", "Recovery", "Post-Cardiac Arrest Care"],
          correctAnswer: "Recovery",
          explanation: "The 'Recovery' link was added to highlight the importance of long-term physical, cognitive, and emotional support for survivors.",
        },
      ],
    },
    {
      id: "pals-2025-mod-9",
      title: "Module 9: PALS Team Dynamics & Communication",
      duration: 30,
      learningObjectives: [
        "Apply effective team leadership and communication strategies during resuscitation.",
        "Understand the roles and responsibilities of PALS team members.",
        "Conduct effective debriefings.",
      ],
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
</div>`,
      keyPoints: [
        "Team leader assigns roles and makes decisions.",
        "Closed-loop communication ensures clarity.",
        "Debriefing is crucial for continuous improvement.",
        "Psychological safety in debriefing.",
      ],
      references: [
        "AHA PALS Provider Manual 2025 - Team Dynamics.",
      ],
      quiz: [
        {
          question: "Which communication technique ensures that messages are sent, received, and understood during a resuscitation?",
          options: ["Open-ended questions", "Closed-loop communication", "Briefing", "Debriefing"],
          correctAnswer: "Closed-loop communication",
          explanation: "Closed-loop communication is a critical technique to ensure clear and accurate information exchange within the resuscitation team.",
        },
        {
          question: "What is a primary responsibility of the PALS team leader?",
          options: ["Performing all chest compressions", "Administering all medications", "Assigning roles and tasks", "Recording all events"],
          correctAnswer: "Assigning roles and tasks",
          explanation: "The team leader is responsible for organizing the team, assigning roles, and making treatment decisions.",
        },
        {
          question: "What is the purpose of a post-resuscitation debriefing?",
          options: ["To assign blame for errors", "To document legal aspects of the resuscitation", "To identify what went well and what could be improved", "To review patient billing information"],
          correctAnswer: "To identify what went well and what could be improved",
          explanation: "Debriefing is a crucial learning tool to analyze team performance, identify areas for improvement, and enhance psychological safety.",
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────
const MICRO_COURSE_CONTENT_REGISTRY: MicroCourseStaticContent[] = [
  ASTHMA_I,
  PALS_2025,
];

export function getMicroCourseContent(
  courseId: string
): MicroCourseStaticContent | undefined {
  return MICRO_COURSE_CONTENT_REGISTRY.find((c) => c.courseId === courseId);
}
