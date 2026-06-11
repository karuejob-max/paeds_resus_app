import { buildSimulation, debriefStep, simChoice, simStep } from "./build";

export const ASTHMA_I_SIM = buildSimulation({
  courseId: "asthma-i",
  level: "foundational",
  title: "Asthma I: Recognition and First-Hour Management",
  description:
    "A 5-year-old at a district hospital ward presents with wheeze and increased work of breathing after a viral illness.",
  steps: [
    simStep(
      "scenario_brief",
      "Scenario",
      "Setting: paediatric ward, Western Kenya. A 5-year-old boy has 2 days of cough and wheeze, worsening over 12 hours. Mother reports he speaks in short phrases.",
      "What is your first structured approach?",
      [
        simChoice(
          "Rapid PAT (Appearance, Work of Breathing, Circulation) then focused ABCDE",
          true,
          "Correct — PAT classifies severity fast; ABCDE follows for structured care (GINA/WHO-aligned)."
        ),
        simChoice("Order chest X-ray before any treatment", false, "Imaging delays first-line bronchodilator therapy in moderate asthma.", "Start with PAT and salbutamol — imaging is not first priority."),
        simChoice("Discharge with oral antihistamine", false, "Antihistamines are not first-line for acute asthma exacerbation."),
      ],
      { vitals: { setting: "District hospital ward", age: "5 years" } }
    ),
    simStep(
      "pat_assessment",
      "Severity Recognition",
      "PAT: alert but anxious; intercostal retractions; audible wheeze; pink, warm peripheries. RR 32, SpO₂ 92% on room air.",
      "How do you classify this exacerbation?",
      [
        simChoice("Moderate acute asthma — treat now, reassess in 20 minutes", true, "Speaking in phrases, SpO₂ 90–94%, and increased work of breathing = moderate (GINA)."),
        simChoice("Mild — observe only", false, "SpO₂ 92% with retractions and phrase speech is not mild.", "Moderate asthma needs bronchodilator and steroid now."),
        simChoice("Life-threatening — intubate immediately", false, "No silent chest, agonal breathing, or SpO₂ <90% yet — this is moderate, not immediate intubation."),
      ],
      { vitals: { RR: "32/min", SpO2: "92% RA", speech: "Phrases" } }
    ),
    simStep(
      "first_line",
      "First-Hour Treatment",
      "Nebuliser available. No IV access yet required.",
      "What first-hour bundle matches this course?",
      [
        simChoice(
          "Salbutamol nebuliser + ipratropium + oral dexamethasone or prednisolone",
          true,
          "Correct — bronchodilator + anticholinergic + systemic steroid per GINA and module teaching."
        ),
        simChoice("Hydrocortisone IV only — no bronchodilator", false, "Steroid alone does not relieve bronchospasm.", "Give salbutamol first; add steroid early."),
        simChoice("Antibiotics for all wheeze", false, "Viral-triggered asthma does not need routine antibiotics."),
      ]
    ),
    simStep(
      "reassess",
      "Reassessment",
      "After 2 salbutamol doses: RR 28, SpO₂ 95% on 2 L/min O₂, still mild wheeze, less distressed.",
      "What is the appropriate next step?",
      [
        simChoice("Continue inhaled therapy, observe, plan discharge when stable ≥1 hour", true, "Improving moderate asthma — continue treatment and safe observation before discharge."),
        simChoice("Discharge immediately without observation", false, "Early discharge risks rebound — observe after improvement.", "WHO/GINA: observe after initial response."),
        simChoice("Start continuous salbutamol infusion", false, "IV/continuous salbutamol is advanced (Asthma II) — not first-line for improving moderate asthma."),
      ]
    ),
    simStep(
      "escalation",
      "When to Escalate",
      "One hour later the child tires, speaks single words, SpO₂ falls to 88% despite oxygen.",
      "What escalation is correct at foundational level?",
      [
        simChoice("Call senior help, back-to-back nebulisers, prepare for transfer/HDU", true, "Red flags: tiring, SpO₂ <90%, worsening work of breathing — escalate early."),
        simChoice("Send home with salbutamol inhaler", false, "Dangerous — child is deteriorating.", "Escalate when SpO₂ <90% or tiring."),
        simChoice("Oral steroids only and wait", false, "Already failing — needs senior review and intensified bronchodilator therapy."),
      ],
      { clinicalContext: "Foundational rule: recognise red flags and escalate — do not manage life-threatening features alone." }
    ),
    debriefStep("debrief", "Debrief", [
      "PAT classifies asthma severity before treatment.",
      "First hour: salbutamol + ipratropium + dexamethasone/prednisolone (GINA).",
      "Escalate when SpO₂ <90%, tiring, silent chest, or drowsiness — call senior early.",
    ]),
  ],
});

export const ASTHMA_II_SIM = buildSimulation({
  courseId: "asthma-ii",
  level: "advanced",
  title: "Asthma II: Status Asthmaticus and ICU Pathway",
  description:
    "A 7-year-old with known severe asthma arrives drowsy with a silent chest despite repeated home nebulisers.",
  steps: [
    simStep(
      "scenario_brief",
      "Scenario",
      "Setting: emergency department. 7-year-old, previous ICU admission for asthma. Drowsy, minimal respiratory effort, silent chest.",
      "What is your immediate classification?",
      [
        simChoice("Life-threatening asthma / impending respiratory arrest", true, "Silent chest + altered consciousness = life-threatening (GINA)."),
        simChoice("Mild relapse — oral steroids only", false, "Silent chest is a red flag for respiratory arrest."),
        simChoice("Anaphylaxis — epinephrine IM first", false, "No urticaria, angioedema, or hypotension pattern — this is status asthmaticus."),
      ],
      { vitals: { RR: "6/min (shallow)", SpO2: "70% RA", AVPU: "V/P" } }
    ),
    simStep(
      "airway_breathing",
      "Airway and Ventilation",
      "High-flow O₂ started. Minimal air entry. Agonal breathing.",
      "Priority intervention?",
      [
        simChoice("Bag-mask ventilation + call anaesthesia/ICU + prepare intubation", true, "Apnoea/agonal breathing requires immediate BVM and advanced airway team."),
        simChoice("Wait for next scheduled nebuliser", false, "Apnoea requires immediate ventilatory support."),
        simChoice("Discharge if SpO₂ improves on mask", false, "Altered mental status and silent chest need ICU-level care."),
      ]
    ),
    simStep(
      "bronchodilator_escalation",
      "Second-Line Bronchodilation",
      "IV access obtained. Still bronchospastic after BVM.",
      "Next escalation per Asthma II module?",
      [
        simChoice("Continuous nebulised salbutamol + consider IV salbutamol + magnesium sulfate", true, "Status asthmaticus: continuous/IV salbutamol and magnesium per teaching."),
        simChoice("Single salbutamol puff via spacer", false, "Inadequate for status asthmaticus."),
        simChoice("Subcutaneous epinephrine as asthma first-line", false, "IM epinephrine is for anaphylaxis — not routine asthma first-line."),
      ]
    ),
    simStep(
      "icu_pathway",
      "ICU and Team Coordination",
      "Child intubated. Persistent bronchospasm, BP 80/40, HR 150.",
      "Advanced management?",
      [
        simChoice("ICU admission, titrated sedation, consider epinephrine/ketamine infusion, treat pneumothorax if suspected", true, "Refractory shock/bronchospasm needs ICU vasoactive and ventilator strategies."),
        simChoice("Extubate when SpO₂ normalises", false, "High risk of post-intubation deterioration — ICU stabilisation required."),
        simChoice("Stop all bronchodilators to prevent tachycardia", false, "Bronchospasm remains the primary problem — titrate therapy, don't stop abruptly."),
      ]
    ),
    simStep(
      "complications",
      "Complications",
      "Sudden drop in BP and unilateral absent breath sounds after intubation.",
      "Likely complication and action?",
      [
        simChoice("Suspect tension pneumothorax — needle decompression and chest drain", true, "Barotrauma is a known complication of severe asthma ventilation."),
        simChoice("Increase PEEP only", false, "Absent unilateral sounds suggest pneumothorax — decompress first."),
        simChoice("Fluid restrict and discharge", false, "Haemodynamic collapse needs immediate intervention."),
      ]
    ),
    debriefStep("debrief", "Debrief", [
      "Silent chest + drowsiness = life-threatening asthma — BVM and ICU early.",
      "Continuous/IV salbutamol and magnesium are second-line in status asthmaticus.",
      "Coordinate anaesthesia/ICU; watch for pneumothorax and refractory shock.",
    ]),
  ],
});

export const PNEUMONIA_I_SIM = buildSimulation({
  courseId: "pneumonia-i",
  level: "foundational",
  title: "Pneumonia I: Recognition and Empiric Antibiotics",
  description: "A 3-year-old with fever, cough, and fast breathing in a busy district ward.",
  steps: [
    simStep("scenario_brief", "Scenario", "3-year-old, 2-day fever and cough, RR 48, nasal flare, no chest indrawing yet.", "First step?", [
      simChoice("WHO IMCI-style assessment: classify pneumonia severity", true, "Correct — fast breathing with fever warrants pneumonia assessment."),
      simChoice("CT chest before antibiotics", false, "Clinical classification guides empiric therapy in LMIC settings."),
      simChoice("Antitussive syrup only", false, "Does not treat bacterial pneumonia."),
    ]),
    simStep("pat_assessment", "Severity", "Subcostal indrawing present. SpO₂ 91%. Alert but tired.", "Classification?", [
      simChoice("Severe pneumonia — oxygen + antibiotics + admission", true, "Indrawing and hypoxia = severe pneumonia (WHO)."),
      simChoice("No pneumonia — viral URI", false, "Fast breathing + indrawing meets severe pneumonia criteria."),
      simChoice("Asthma — salbutamol only", false, "Fever + focal crackles pattern fits pneumonia."),
    ], { vitals: { RR: "48", SpO2: "91%", temp: "39.2°C" } }),
    simStep("antibiotics", "Empiric Antibiotics", "No cultures yet. HIV status unknown.", "Age-appropriate empiric choice?", [
      simChoice("IV/IM ampicillin + gentamicin (or local WHO-aligned regimen)", true, "Standard empiric therapy for severe paediatric pneumonia in LMIC."),
      simChoice("Oral fluconazole", false, "Not pneumonia first-line."),
      simChoice("Withhold antibiotics pending CXR", false, "Severe pneumonia needs immediate antibiotics."),
    ]),
    simStep("escalation", "Escalation", "After 2 hours: still RR 50, SpO₂ 88%, lethargic.", "Action?", [
      simChoice("Call senior, consider sepsis bundle, transfer to higher level", true, "Failure to improve — consider sepsis and escalate."),
      simChoice("Discharge with oral amoxicillin", false, "Worsening hypoxia and lethargy need admission/transfer."),
      simChoice("Repeat chest exam only", false, "Child is deteriorating — act on sepsis/severe pneumonia pathway."),
    ]),
    debriefStep("debrief", "Debrief", [
      "WHO classification drives oxygen and antibiotic decisions.",
      "Severe pneumonia: oxygen + empiric antibiotics + monitor for sepsis.",
      "Escalate when hypoxia persists or mental status worsens.",
    ]),
  ],
});

export const PNEUMONIA_II_SIM = buildSimulation({
  courseId: "pneumonia-ii",
  level: "advanced",
  title: "Pneumonia II: Severe Pneumonia, Sepsis, and ARDS",
  description: "A 4-year-old with severe pneumonia progresses to septic shock and hypoxia despite antibiotics.",
  steps: [
    simStep("scenario_brief", "Scenario", "4-year-old admitted 24 h ago for severe pneumonia. Now intubated, hypotensive despite 40 mL/kg fluids.", "Assessment?", [
      simChoice("Fluid-refractory septic shock with respiratory failure", true, "Persistent hypotension after adequate fluids = refractory shock."),
      simChoice("Simple viral bronchiolitis", false, "Intubated septic picture is beyond bronchiolitis."),
      simChoice("Discharge when afebrile", false, "Haemodynamically unstable — ICU care required."),
    ]),
    simStep("vasopressors", "Vasoactive Support", "MAP low, lactate rising, urine output minimal.", "Next step?", [
      simChoice("Start noradrenaline (or adrenaline if unavailable) via central/IO line", true, "Fluid-refractory shock needs vasoactive support."),
      simChoice("Another 60 mL/kg crystalloid without reassessment", false, "FEAST-aware — avoid fluid overload in refractory shock."),
      simChoice("Oral hydration only", false, "Incompatible with shock state."),
    ]),
    simStep("ards", "ARDS Management", "Bilateral infiltrates, P/F ratio low, high ventilator pressures.", "Lung-protective strategy?", [
      simChoice("Low tidal volume ventilation, PEEP optimisation, prone if available", true, "ARDSnet principles adapted to paediatric ICU."),
      simChoice("High tidal volumes to normalise CO₂ quickly", false, "Risk of ventilator-induced lung injury."),
      simChoice("Extubate to avoid ventilator", false, "Profound hypoxia requires controlled ventilation."),
    ]),
    simStep("team", "Team Coordination", "PICU bed 4 hours away.", "Best disposition plan?", [
      simChoice("Stabilise vasopressors, secure airway, structured transfer with senior escort", true, "Advanced pneumonia/sepsis needs coordinated retrieval."),
      simChoice("Send alone in ambulance without fluids running", false, "Unstable transfer without escort is high risk."),
      simChoice("Stop antibiotics to reduce lines", false, "Continue empiric therapy during transfer."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Severe pneumonia may progress to sepsis and ARDS.",
      "Fluid-refractory shock: vasoactive agents (noradrenaline/adrenaline).",
      "Lung-protective ventilation and safe retrieval when ICU needed.",
    ]),
  ],
});

export const RESPIRATORY_SIMULATIONS = [
  ASTHMA_I_SIM,
  ASTHMA_II_SIM,
  PNEUMONIA_I_SIM,
  PNEUMONIA_II_SIM,
];
