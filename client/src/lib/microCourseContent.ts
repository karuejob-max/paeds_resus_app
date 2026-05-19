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
        {
          question: "How frequently should salbutamol be given in the first hour of a severe asthma exacerbation?",
          options: ["Every 60 minutes", "Every 30 minutes", "Every 20 minutes", "Every 10 minutes"],
          correctAnswer: "Every 20 minutes",
          explanation: "In moderate to severe exacerbations, salbutamol (MDI or nebulised) should be given every 20 minutes for 3 doses in the first hour, then reassessed. Continuous nebulisation is an alternative for severe/life-threatening disease.",
        },
      ],
    },
    {
      id: "asthma-i-mod-3",
      title: "Escalation, Monitoring, and Disposition",
      duration: 10,
      learningObjectives: [
        "Define criteria for escalation to high-dependency or ICU care",
        "Identify safe discharge criteria after acute asthma treatment",
        "Outline the monitoring parameters during treatment",
      ],
      content: `
<h2>When to Escalate</h2>
<p>Escalation criteria should be assessed at 20 minutes and 60 minutes after initial treatment:</p>

<h3>Escalate to HDU/ICU if ANY of the following persist after 1 hour of treatment:</h3>
<ul>
  <li>SpO₂ &lt; 92% despite high-flow O₂</li>
  <li>PEFR &lt; 33% predicted</li>
  <li>Silent chest, cyanosis, or poor respiratory effort</li>
  <li>Altered consciousness (drowsy, confused, agitated)</li>
  <li>Fatigue / exhaustion</li>
  <li>Failure to improve after 3 doses of salbutamol + ipratropium + systemic corticosteroids</li>
</ul>

<h3>Additional Escalation Therapies (PICU/Senior Clinician)</h3>
<ul>
  <li><strong>IV magnesium sulphate:</strong> 25–75 mg/kg (max 2 g) over 20 min — for severe/life-threatening not responding to initial treatment</li>
  <li><strong>IV salbutamol infusion:</strong> 1–5 mcg/kg/min</li>
  <li><strong>IV aminophylline:</strong> loading 5 mg/kg over 20 min (if not on theophylline) — use with caution, monitor ECG</li>
  <li><strong>Heliox:</strong> 70:30 helium:oxygen mixture — reduces airway resistance</li>
  <li><strong>Non-invasive ventilation (NIV):</strong> CPAP or BiPAP — use only in experienced centres</li>
  <li><strong>Intubation:</strong> last resort — high risk in asthma; use RSI, avoid high PEEP</li>
</ul>

<h3>Monitoring During Treatment</h3>
<ul>
  <li>Continuous SpO₂ monitoring</li>
  <li>Respiratory rate every 15–20 minutes</li>
  <li>Heart rate (salbutamol causes tachycardia — expected; &gt; 200 bpm is concerning)</li>
  <li>PEFR at 20 min, 60 min, and before discharge (if ≥ 5 years)</li>
  <li>Blood gas (VBG or ABG) if severe or not improving — look for rising CO₂</li>
  <li>Electrolytes: salbutamol causes hypokalaemia — check K⁺ in severe cases</li>
</ul>

<h3>Safe Discharge Criteria</h3>
<ul>
  <li>SpO₂ ≥ 94% on room air for ≥ 60 minutes</li>
  <li>PEFR ≥ 75% predicted (if measurable)</li>
  <li>Minimal or no accessory muscle use</li>
  <li>Able to speak in full sentences</li>
  <li>Salbutamol interval ≥ 4 hours</li>
  <li>Caregiver understands action plan and can administer inhaler correctly</li>
  <li>Follow-up arranged within 24–48 hours</li>
</ul>

<h3>Discharge Medications</h3>
<ul>
  <li>Salbutamol MDI + spacer: 2–4 puffs every 4–6 hours PRN for 5–7 days</li>
  <li>Prednisolone: complete the course (3–5 days)</li>
  <li>Review/start inhaled corticosteroid (ICS) — do not stop existing ICS</li>
  <li>Written asthma action plan</li>
</ul>
      `,
      keyPoints: [
        "IV magnesium sulphate 25–75 mg/kg is first-line escalation for severe asthma not responding to bronchodilators",
        "Rising CO₂ on blood gas is an ominous sign — indicates impending respiratory failure",
        "Salbutamol causes hypokalaemia — check electrolytes in severe cases",
        "Do not discharge until SpO₂ ≥ 94% on room air for ≥ 60 minutes",
        "Every discharge must include a written asthma action plan and follow-up within 48 hours",
        "Intubation in asthma carries high risk — exhaust all other options first",
      ],
      references: [
        "GINA 2024 — Global Initiative for Asthma. Pocket Guide for Asthma Management and Prevention.",
        "BTS/SIGN British Guideline on the Management of Asthma 2023.",
        "AHA PALS Provider Manual 2025 — Respiratory Emergencies.",
        "Rowe BH et al. Magnesium sulfate for treating exacerbations of acute asthma in the emergency department. Cochrane Database Syst Rev 2000.",
      ],
      quiz: [
        {
          question: "What is the first-line escalation agent for severe paediatric asthma not responding to salbutamol, ipratropium, and corticosteroids?",
          options: [
            "IV aminophylline",
            "IV magnesium sulphate",
            "IV adrenaline",
            "IV ketamine",
          ],
          correctAnswer: "IV magnesium sulphate",
          explanation: "IV magnesium sulphate (25–75 mg/kg, max 2 g over 20 min) is the recommended first-line escalation agent for severe/life-threatening asthma not responding to initial bronchodilators and corticosteroids, per GINA 2024 and BTS/SIGN.",
        },
        {
          question: "A child with severe asthma has a VBG showing rising pCO₂ (55 mmHg) after 60 minutes of treatment. What does this indicate?",
          options: [
            "Normal response to treatment",
            "Improving bronchospasm",
            "Impending respiratory failure — escalate immediately",
            "Adequate ventilation — continue current treatment",
          ],
          correctAnswer: "Impending respiratory failure — escalate immediately",
          explanation: "A rising CO₂ in a child with asthma indicates fatigue and impending respiratory failure. Normal or low CO₂ is expected in acute asthma (hyperventilation). Rising CO₂ requires immediate escalation to PICU.",
        },
        {
          question: "Which electrolyte abnormality should be monitored in a child receiving continuous nebulised salbutamol?",
          options: ["Hypernatraemia", "Hyperkalaemia", "Hypokalaemia", "Hypercalcaemia"],
          correctAnswer: "Hypokalaemia",
          explanation: "Salbutamol (β₂-agonist) drives potassium into cells, causing hypokalaemia. This is particularly relevant with high-dose or continuous nebulisation and can precipitate arrhythmias.",
        },
        {
          question: "What is the minimum SpO₂ on room air required before safe discharge after acute asthma?",
          options: ["≥ 90%", "≥ 92%", "≥ 94%", "≥ 96%"],
          correctAnswer: "≥ 94%",
          explanation: "Safe discharge requires SpO₂ ≥ 94% on room air for at least 60 minutes, along with PEFR ≥ 75%, minimal work of breathing, and ability to speak in full sentences.",
        },
        {
          question: "A child is being discharged after an acute asthma exacerbation. Which of the following is essential before discharge?",
          options: [
            "Chest X-ray showing clear lung fields",
            "Written asthma action plan and follow-up within 24–48 hours",
            "Spirometry showing FEV1 > 80% predicted",
            "Serum IgE level within normal range",
          ],
          correctAnswer: "Written asthma action plan and follow-up within 24–48 hours",
          explanation: "A written asthma action plan and follow-up within 24–48 hours are mandatory at discharge. These reduce re-attendance and improve adherence. Chest X-ray and spirometry are not routinely required for uncomplicated exacerbations.",
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────
const MICRO_COURSE_CONTENT_REGISTRY: MicroCourseStaticContent[] = [ASTHMA_I];

export function getMicroCourseContent(courseId: string): MicroCourseStaticContent | undefined {
  return MICRO_COURSE_CONTENT_REGISTRY.find((c) => c.courseId === courseId);
}
