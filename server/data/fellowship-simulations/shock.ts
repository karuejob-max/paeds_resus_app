import { buildSimulation, debriefStep, simChoice, simStep } from "./build";

export const SEPTIC_SHOCK_I_SIM = buildSimulation({
  courseId: "septic-shock-i",
  level: "foundational",
  title: "Septic Shock I: Recognition and Fluid Resuscitation",
  description: "A 2-year-old with fever, lethargy, and cold peripheries in a district hospital.",
  steps: [
    simStep("scenario_brief", "Scenario", "2-year-old, 24 h fever, now quiet and floppy. Mottled skin, cold hands.", "First priority?", [
      simChoice("Recognise shock — start sepsis time-critical bundle", true, "Lethargy + poor perfusion + fever = septic shock until proven otherwise."),
      simChoice("Paracetamol and discharge", false, "Shock is a time-critical emergency."),
      simChoice("Wait for blood culture before any treatment", false, "Antibiotics and fluids must not wait for cultures."),
    ]),
    simStep("pat_assessment", "Shock Recognition", "HR 170, CRT 4 s, weak pulses, BP 75/40. RR 40, clear chest.", "Diagnosis?", [
      simChoice("Compensated septic shock", true, "Tachycardia, prolonged CRT, hypotension — treat as shock."),
      simChoice("Normal variant tachycardia", false, "Hypotension and poor perfusion confirm shock."),
      simChoice("Respiratory failure primary", false, "Clear chest with perfusion failure points to shock."),
    ], { vitals: { HR: "170", BP: "75/40", CRT: "4 s", temp: "39.5°C" } }),
    simStep("fluids", "Fluid Bolus", "IV cannula placed.", "FEAST-aware fluid strategy?", [
      simChoice("10–20 mL/kg crystalloid bolus, reassess perfusion after each bolus", true, "Small boluses with reassessment — avoid blind large volumes."),
      simChoice("60 mL/kg rapid infusion without reassessment", false, "FEAST: cautious boluses with reassessment in shock."),
      simChoice("No fluids — start noradrenaline first", false, "Foundational level: fluid resuscitation first unless contraindicated."),
    ]),
    simStep("antibiotics", "Antibiotics", "Still febrile after first bolus. CRT 3 s.", "Critical action?", [
      simChoice("Give IV/IM broad-spectrum antibiotics within 1 hour of recognition", true, "Early antibiotics reduce mortality in paediatric sepsis."),
      simChoice("Oral antibiotics when tolerating feeds", false, "Shock needs parenteral antibiotics immediately."),
      simChoice("Antibiotics only if culture positive", false, "Empiric therapy is standard."),
    ]),
    simStep("escalation", "Escalation", "After 40 mL/kg, still hypotensive, increasing lethargy.", "Foundational escalation?", [
      simChoice("Call senior, prepare vasopressors and transfer to higher care", true, "Fluid-refractory shock needs senior/ICU support."),
      simChoice("Repeat 40 mL/kg without senior review", false, "Escalate when fluids fail — do not manage alone."),
      simChoice("Discharge if afebrile", false, "Persistent hypotension is an emergency."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Septic shock: recognise early (perfusion + infection).",
      "10–20 mL/kg boluses with reassessment (FEAST-aware).",
      "Antibiotics within 1 hour; escalate when fluid-refractory.",
    ]),
  ],
});

export const SEPTIC_SHOCK_II_SIM = buildSimulation({
  courseId: "septic-shock-ii",
  level: "advanced",
  title: "Septic Shock II: Refractory Shock and Organ Support",
  description: "5-year-old in ICU, intubated, 60 mL/kg fluids given, still hypotensive.",
  steps: [
    simStep("scenario_brief", "Scenario", "ICU: intubated septic shock, lactate 6 mmol/L, MAP below target despite fluids.", "Classification?", [
      simChoice("Fluid-refractory septic shock", true, "Persistent hypotension after adequate fluids."),
      simChoice("Resolved sepsis — extubate", false, "Haemodynamic instability persists."),
      simChoice("Primary respiratory failure only", false, "Shock drives the current instability."),
    ]),
    simStep("vasopressors", "Vasoactive Agents", "Central line in place.", "First-line vasopressor?", [
      simChoice("Noradrenaline infusion titrated to perfusion targets", true, "First-line for warm/cold shock when fluids insufficient."),
      simChoice("High-dose oral midazolam", false, "Not a vasopressor."),
      simChoice("KCl IV push for tachycardia", false, "Never KCl IV push — lethal."),
    ]),
    simStep("coagulopathy", "DIC / Coagulopathy", "Petechiae, prolonged PT, falling platelets.", "Management?", [
      simChoice("Treat underlying sepsis; transfuse platelets/FFP per bleeding and counts", true, "DIC management targets source control and guided transfusion."),
      simChoice("Heparin infusion for all septic children", false, "Not routine — individualise with senior guidance."),
      simChoice("Ignore coagulation — fluids only", false, "Coagulopathy worsens outcomes in severe sepsis."),
    ]),
    simStep("ards", "ARDS / Organ Failure", "Worsening hypoxia, oliguria, rising creatinine.", "Multi-organ approach?", [
      simChoice("Lung-protective ventilation, renal perfusion optimisation, discuss RRT if indicated", true, "Advanced sepsis requires organ-support bundles."),
      simChoice("Stop all infusions to simplify", false, "Withdrawal of support would be fatal."),
      simChoice("Large fluid boluses for oliguria", false, "Risk fluid overload in established shock/ARDS."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Fluid-refractory shock: noradrenaline/adrenaline early.",
      "Monitor and treat DIC, ARDS, and AKI as complications.",
      "Senior ICU coordination and organ-support protocols.",
    ]),
  ],
});

export const HYPOVOLEMIC_SHOCK_I_SIM = buildSimulation({
  courseId: "hypovolemic-shock-i",
  level: "foundational",
  title: "Hypovolemic Shock I: Dehydration and Haemorrhage Recognition",
  description: "18-month-old with 3 days vomiting and diarrhoea — lethargic and sunken eyes.",
  steps: [
    simStep("scenario_brief", "Scenario", "Toddler with gastroenteritis, minimal urine for 12 h.", "Initial assessment?", [
      simChoice("ABCDE with focus on perfusion and dehydration severity", true, "Structured assessment identifies hypovolaemic shock."),
      simChoice("Antibiotics for all diarrhoea", false, "Viral GE is common — assess shock first."),
      simChoice("Immediate blood transfusion", false, "No haemorrhage described yet."),
    ]),
    simStep("recognition", "Recognition", "Sunken eyes, dry mucosa, HR 165, CRT 3 s, weak pulses.", "Diagnosis?", [
      simChoice("Hypovolaemic shock from dehydration", true, "Clinical dehydration with perfusion failure."),
      simChoice("Septic shock — no fluids", false, "GE dehydration needs cautious fluid resuscitation."),
      simChoice("Well hydrated", false, "Signs contradict this."),
    ], { vitals: { weight: "10 kg", urine: "None 12 h" } }),
    simStep("fluids", "Resuscitation", "IV access obtained.", "Initial fluid plan?", [
      simChoice("10–20 mL/kg isotonic bolus, reassess; plan deficit replacement", true, "Shock resuscitation then maintenance + deficit per module."),
      simChoice("Hypotonic 5% dextrose bolus", false, "Isotonic crystalloid for shock resuscitation."),
      simChoice("Oral rehydration only in shock", false, "Shock needs IV/IO fluids."),
    ]),
    simStep("escalation", "Escalation", "After bolus: still lethargic, CRT 4 s.", "Next step?", [
      simChoice("Repeat bolus with senior review; consider transfer", true, "Ongoing shock needs escalation."),
      simChoice("Discharge with ORS", false, "Unsafe in unresolved shock."),
      simChoice("Stop fluids — risk overload", false, "Child remains in shock."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Hypovolaemia: recognise sunken fontanelle/eyes, poor perfusion.",
      "Isotonic boluses 10–20 mL/kg with reassessment.",
      "Escalate persistent shock — consider haemorrhage or sepsis.",
    ]),
  ],
});

export const HYPOVOLEMIC_SHOCK_II_SIM = buildSimulation({
  courseId: "hypovolemic-shock-ii",
  level: "advanced",
  title: "Hypovolemic Shock II: Massive Haemorrhage and MTP",
  description: "8-year-old pedestrian hit by car — distended abdomen, pale, HR 180.",
  steps: [
    simStep("scenario_brief", "Scenario", "Trauma bay: blunt abdominal trauma, suspected internal bleeding.", "Primary survey priority?", [
      simChoice("ABCDE — control haemorrhage, two large-bore IVs, activate trauma/MTP", true, "Massive haemorrhage protocol early."),
      simChoice("CT abdomen before any fluids", false, "Resuscitate parallel to imaging in unstable patients."),
      simChoice("Oral fluids", false, "Incompatible with shock."),
    ]),
    simStep("haemorrhage", "Haemorrhage Control", "BP 70/35, abdomen rigid.", "Immediate actions?", [
      simChoice("Massive transfusion protocol: O-negative/patient blood + plasma + platelets per protocol", true, "Balanced transfusion reduces coagulopathy."),
      simChoice("Crystalloid 100 mL/kg only", false, "Haemorrhagic shock needs blood products."),
      simChoice("Wait for Hb result before transfusion", false, "Transfuse in life-threatening haemorrhage without waiting."),
    ]),
    simStep("coagulopathy", "Coagulopathy", "Continued oozing from IV sites.", "Management?", [
      simChoice("Calcium, tranexamic acid if indicated, maintain MTP with senior surgical control", true, "Damage-control resuscitation principles."),
      simChoice("KCl IV push to stabilise heart", false, "Never KCl IV push."),
      simChoice("Discharge when conscious", false, "Unstable — needs surgery."),
    ]),
    simStep("disposition", "Disposition", "OR available in 30 min.", "Plan?", [
      simChoice("Damage-control surgery pathway with ongoing MTP, warming, and trauma team coordination", true, "Prevent hypothermia, acidosis, coagulopathy triad."),
      simChoice("Delay surgery for full imaging", false, "Unstable abdomen needs operative control."),
      simChoice("Oral iron replacement", false, "Acute haemorrhage needs blood."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Massive haemorrhage: MTP and surgical source control.",
      "Balanced transfusion; TXA when indicated.",
      "Damage-control resuscitation — warmth, calcium, surgical team coordination.",
    ]),
  ],
});

export const CARDIOGENIC_SHOCK_I_SIM = buildSimulation({
  courseId: "cardiogenic-shock-i",
  level: "foundational",
  title: "Cardiogenic Shock I: Acute Heart Failure Recognition",
  description: "6-month-old with feeding difficulty, tachypnoea, and hepatomegaly.",
  steps: [
    simStep("scenario_brief", "Scenario", "Infant with 2 days poor feeding, sweating when feeding.", "Concern?", [
      simChoice("Suspect acute heart failure / cardiogenic shock", true, "Feeding difficulty + tachypnoea + hepatomegaly pattern."),
      simChoice("Simple colic", false, "Perfusion and respiratory signs need cardiac assessment."),
      simChoice("DKA — give insulin push first", false, "No hyperglycaemia pattern; wrong diagnosis and treatment."),
    ]),
    simStep("recognition", "Recognition", "RR 55, crackles, hepatomegaly 4 cm, CRT 3 s, cool peripheries.", "Classification?", [
      simChoice("Cardiogenic shock / acute heart failure", true, "Pulmonary congestion + poor perfusion."),
      simChoice("Isolated pneumonia only", false, "Hepatomegaly and feeding failure suggest cardiac cause."),
      simChoice("Anaphylaxis", false, "No allergic trigger or urticaria."),
    ]),
    simStep("first_line", "First-Hour Care", "SpO₂ 88%.", "Initial management?", [
      simChoice("Oxygen, cautious fluids, diuretic if available, early senior/cardiology consult", true, "Avoid fluid overload; treat congestion."),
      simChoice("20 mL/kg rapid fluid bolus repeated", false, "Fluid boluses may worsen cardiogenic shock."),
      simChoice("High-dose salbutamol nebuliser", false, "Not heart failure treatment."),
    ]),
    simStep("escalation", "Escalation", "Worsening respiratory distress despite O₂.", "Escalate?", [
      simChoice("Call senior, prepare inotropes and PICU transfer", true, "Refractory heart failure needs advanced support."),
      simChoice("Discharge on oral furosemide alone", false, "Unstable infant needs admission."),
      simChoice("Ignore — viral illness", false, "Clinical signs are severe."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Cardiogenic shock: hepatomegaly, crackles, poor feeding.",
      "Cautious fluids — avoid overload.",
      "Early senior/cardiology and PICU for inotropes.",
    ]),
  ],
});

export const CARDIOGENIC_SHOCK_II_SIM = buildSimulation({
  courseId: "cardiogenic-shock-ii",
  level: "advanced",
  title: "Cardiogenic Shock II: Inotropes and Mechanical Support",
  description: "3-year-old with myocarditis, hypotensive despite minimal fluids, on high-flow O₂.",
  steps: [
    simStep("scenario_brief", "Scenario", "PICU candidate: myocarditis, BP 62/30, lactate rising.", "Advanced classification?", [
      simChoice("Refractory cardiogenic shock", true, "Hypotension despite appropriate cautious resuscitation."),
      simChoice("Resolved — oral meds only", false, "Haemodynamic collapse continues."),
      simChoice("Septic shock — 60 mL/kg fluids", false, "Cardiogenic — avoid fluid overload."),
    ]),
    simStep("inotropes", "Inotropic Support", "Central access available.", "First inotrope?", [
      simChoice("Adrenaline or dopamine infusion per protocol — titrate to perfusion", true, "Inotropes for cardiogenic shock when fluids insufficient."),
      simChoice("Oral propranolol loading", false, "Not acute shock therapy."),
      simChoice("Fluid bolus 20 mL/kg × 3", false, "May worsen pulmonary oedema."),
    ]),
    simStep("arrhythmia", "Arrhythmia", "New wide-complex tachycardia, BP falling.", "Action?", [
      simChoice("Synchronised cardioversion if unstable; senior/cardiology immediately", true, "Unstable arrhythmia needs urgent treatment."),
      simChoice("Observation only", false, "Unstable tachycardia is an emergency."),
      simChoice("Adenosine without assessment", false, "Wide complex may be VT — assess first."),
    ]),
    simStep("ecmo", "Mechanical Support", "Maximal medical therapy, still failing.", "Disposition?", [
      simChoice("Discuss ECMO/mechanical support at referral centre", true, "Advanced cardiogenic shock may need mechanical support."),
      simChoice("Extubate to reduce afterload", false, "Would worsen hypoxia and shock."),
      simChoice("Discharge on diuretics", false, "Critically ill."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Refractory cardiogenic shock: inotrope infusion.",
      "Treat arrhythmias urgently when perfusion compromised.",
      "ECMO/mechanical support at specialist centres when indicated.",
    ]),
  ],
});

export const SHOCK_SIMULATIONS = [
  SEPTIC_SHOCK_I_SIM,
  SEPTIC_SHOCK_II_SIM,
  HYPOVOLEMIC_SHOCK_I_SIM,
  HYPOVOLEMIC_SHOCK_II_SIM,
  CARDIOGENIC_SHOCK_I_SIM,
  CARDIOGENIC_SHOCK_II_SIM,
];
