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
// PALS 2025: Pediatric Advanced Life Support
// ─────────────────────────────────────────────────────────────────────────────
const PALS_2025: MicroCourseStaticContent = {
  courseId: "40",
  modules: [
    {
      id: "pals-2025-mod-1",
      title: "The 2025 Systematic Approach & Science Updates",
      duration: 30,
      learningObjectives: [
        "Master the new physiology-directed resuscitation mindset",
        "Apply the consolidated 6-link Chain of Survival",
        "Identify 2025 physiological targets during CPR",
      ],
      content: `
<h2>The 2025 Universal Chain of Survival</h2>
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
<p>Survival is no longer just about a pulse; it is about returning to a functional life. The 2025 guidelines mandate early evaluation for physical, cognitive, and behavioral challenges post-discharge.</p>
<h2>Physiology-Directed Resuscitation</h2>
<p>One of the most significant changes in 2025 is the shift toward using real-time physiology to guide CPR quality rather than just following a clock.</p>
<table style="width:100%;border-collapse:collapse;font-size:0.85rem">
  <thead>
    <tr style="background:#f1f5f9">
      <th style="border:1px solid #cbd5e1;padding:6px">Metric</th>
      <th style="border:1px solid #cbd5e1;padding:6px">2025 Target</th>
      <th style="border:1px solid #cbd5e1;padding:6px">Clinical Significance</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:6px"><strong>Diastolic BP (Infants)</strong></td>
      <td style="border:1px solid #cbd5e1;padding:6px">≥25 mmHg</td>
      <td style="border:1px solid #cbd5e1;padding:6px">Ensures coronary perfusion pressure.</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:6px"><strong>Diastolic BP (Children ≥1y)</strong></td>
      <td style="border:1px solid #cbd5e1;padding:6px">≥30 mmHg</td>
      <td style="border:1px solid #cbd5e1;padding:6px">Linked to improved survival with neuro recovery.</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:6px"><strong>ETCO2</strong></td>
      <td style="border:1px solid #cbd5e1;padding:6px">Monitor trend</td>
      <td style="border:1px solid #cbd5e1;padding:6px">Indicator of CPR quality and ROSC; do not use as a sole termination rule.</td>
    </tr>
  </tbody>
</table>
      `,
      keyPoints: [
        "DBP targets: Infants ≥25, Children ≥30 mmHg",
        "Recovery is the 6th link in the Chain of Survival",
        "ETCO2 is a quality indicator, not a termination rule",
      ],
      references: ["AHA PALS 2025 Guidelines Executive Summary"],
      quiz: [
        {
          question: "According to the 2025 Guidelines, what is the minimum Diastolic Blood Pressure (DBP) target during CPR for a 5-year-old child?",
          options: ["20 mmHg", "25 mmHg", "30 mmHg", "40 mmHg"],
          correctAnswer: "30 mmHg",
          explanation: "The 2025 Update sets specific DBP targets: ≥25 mmHg in infants and ≥30 mmHg in children aged 1 year or older.",
        },
      ],
    },
    {
      id: "pals-2025-mod-2",
      title: "Advanced Airway & Respiratory Management",
      duration: 25,
      learningObjectives: [
        "Apply the 94-99% oxygen titration rule",
        "Identify correct ventilation rates for 2025",
        "Explain why cuffed tubes are preferred",
      ],
      content: `
<h2>Oxygen Titration: The 94-99% Rule</h2>
<p>The 2025 guidelines emphasize rapid titration once stable to avoid hyperoxia.</p>
<div class="clinical-note">
  <strong>Target SpO2: 94% – 99%</strong>.
  Avoid 100% saturation once stable, as it can worsen oxidative stress and neurological injury.
</div>
<h2>Updated Ventilation Rates</h2>
<p>If the child has a pulse but requires assisted ventilation:</p>
<ul>
  <li><strong>Infants and Children:</strong> 1 breath every 2-3 seconds (20-30 breaths per minute).</li>
</ul>
<div class="warning-note">
  <strong>Stop Hyperventilating:</strong> Excessive ventilation increases intrathoracic pressure and decreases cardiac output.
</div>
      `,
      keyPoints: [
        "Target SpO2 94-99% once stable",
        "Ventilation rate: 20-30 breaths per minute",
        "Cuffed ETTs preferred for all ages",
      ],
      references: ["AHA PALS 2025 Guidelines"],
      quiz: [
        {
          question: "What is the recommended ventilation rate for a child with a pulse but inadequate breathing in 2025?",
          options: ["8-10 breaths/min", "10-12 breaths/min", "12-20 breaths/min", "20-30 breaths/min"],
          correctAnswer: "20-30 breaths/min",
          explanation: "The 2025 rate for pediatric rescue breathing is 1 breath every 2-3 seconds (20-30 bpm).",
        },
      ],
    },
    {
      id: "pals-2025-mod-3",
      title: "Circulatory Emergencies & Shock",
      duration: 25,
      learningObjectives: [
        "Categorize shock types correctly",
        "Execute 2025 fluid resuscitation strategy",
        "Identify when to start vasoactives in septic shock",
      ],
      content: `
<h2>2025 Fluid Resuscitation Strategy</h2>
<p>The 20 mL/kg bolus remains standard, but with a critical caveat: <strong>Reassess after every bolus.</strong></p>
<ul>
  <li>Look for signs of fluid overload: New crackles or enlarging liver.</li>
  <li>In <strong>Septic Shock</strong>, if the child remains shocked after 40-60 mL/kg, start vasoactive infusions immediately.</li>
</ul>
      `,
      keyPoints: [
        "Reassess after every 20 mL/kg bolus",
        "Early vasoactives in septic shock",
        "IO access if IV fails in 60 seconds",
      ],
      references: ["AHA PALS 2025 Guidelines"],
      quiz: [
        {
          question: "A child in septic shock remains hypotensive after 40 mL/kg fluid. What is the next 2025-aligned step?",
          options: ["Give more fluid", "Start vasoactive medication", "Administer Atropine", "Wait and see"],
          correctAnswer: "Start vasoactive medication",
          explanation: "2025 guidelines emphasize early transition to vasoactive support in fluid-refractory septic shock.",
        },
      ],
    },
    {
      id: "pals-2025-mod-4",
      title: "Cardiac Arrest Algorithms 2025",
      duration: 30,
      learningObjectives: [
        "Execute the 2025 non-shockable algorithm",
        "Identify correct defibrillation energy levels",
        "Prioritize early Epinephrine in PEA/Asystole",
      ],
      content: `
<h2>The Non-Shockable Pathway: Epinephrine ASAP</h2>
<div class="clinical-note">
  <strong>2025 Mandate:</strong> Administer Epinephrine 0.01 mg/kg IV/IO as soon as possible after starting CPR for non-shockable rhythms.
</div>
<h2>The Shockable Pathway</h2>
<ul>
  <li>First Shock: 2 J/kg</li>
  <li>Second Shock: 4 J/kg</li>
  <li>Subsequent: ≥4 J/kg</li>
</ul>
      `,
      keyPoints: [
        "Epinephrine ASAP for PEA/Asystole",
        "High-quality CPR is the foundation",
        "Search for H's and T's",
      ],
      references: ["AHA PALS 2025 Guidelines"],
      quiz: [
        {
          question: "When should the first dose of Epinephrine be given for Asystole in 2025?",
          options: ["After 2 mins CPR", "ASAP after access", "After first shock", "After 3 cycles"],
          correctAnswer: "ASAP after access",
          explanation: "2025 guidelines emphasize giving Epinephrine ASAP for non-shockable rhythms.",
        },
      ],
    },
    {
      id: "pals-2025-mod-5",
      title: "Tachycardia & Bradycardia",
      duration: 25,
      learningObjectives: [
        "Identify the 'Rule of 60' for bradycardia",
        "Apply 2025 updates for SVT",
      ],
      content: `
<h2>The Rule of 60</h2>
<p>Start CPR if HR < 60 bpm with poor perfusion despite oxygen/ventilation.</p>
<h2>SVT Updates</h2>
<p>2025 Update: IV Sotalol may be considered for refractory SVT if expert consultation is unavailable.</p>
      `,
      keyPoints: [
        "CPR for HR < 60 with poor perfusion",
        "Adenosine for stable SVT",
        "Cardioversion for unstable SVT",
      ],
      references: ["AHA PALS 2025 Guidelines"],
      quiz: [],
    },
    {
      id: "pals-2025-mod-6",
      title: "Post-Cardiac Arrest Care & Recovery",
      duration: 25,
      learningObjectives: [
        "Identify fever prevention targets",
        "Explain the importance of the Recovery link",
      ],
      content: `
<h2>Targeted Temperature Management</h2>
<p>Preventing hyperthermia (>37.5°C) is critical for neuroprotection.</p>
<h2>The Recovery Link</h2>
<p>Early referral to rehabilitation is now a 2025 mandate.</p>
      `,
      keyPoints: [
        "Prevent fever >37.5°C",
        "Recovery is a long-term journey",
        "Neuroprognostication must be multi-modal",
      ],
      references: ["AHA PALS 2025 Guidelines"],
      quiz: [],
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
