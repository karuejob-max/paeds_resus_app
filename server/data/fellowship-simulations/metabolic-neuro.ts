import { buildSimulation, debriefStep, simChoice, simStep } from "./build";

export const DKA_I_SIM = buildSimulation({
  courseId: "dka-i",
  level: "foundational",
  title: "DKA I: Recognition and Safe Initial Management",
  description: "10-year-old with polyuria, vomiting, Kussmaul breathing — glucose 28 mmol/L.",
  steps: [
    simStep("scenario_brief", "Scenario", "Known diabetic, missed insulin 2 days. Lethargic but talking.", "First actions?", [
      simChoice("ABCDE, confirm DKA with glucose mmol/L + ketones + pH if available", true, "ISPAD: diagnose with glucose, ketones, acidosis."),
      simChoice("IV insulin push then infusion", false, "ISPAD: continuous infusion only in paediatric DKA — no loading dose."),
      simChoice("Subcutaneous insulin only in severe DKA", false, "Moderate-severe DKA needs IV fluids and planned insulin."),
    ], { vitals: { glucose: "28 mmol/L", pH: "7.15 (if available)" } }),
    simStep("fluids", "Fluids", "Weight 30 kg, shocked but perfusing.", "Fluid choice?", [
      simChoice("10–20 mL/kg isotonic bolus if shocked; then maintenance + deficit — discuss NS vs balanced crystalloid", true, "ISPAD fluids; note hyperchloraemic acidosis risk with NS."),
      simChoice("5% dextrose only", false, "Need isotonic resuscitation in shock."),
      simChoice("No fluids until insulin started", false, "Fluids are first priority in DKA resuscitation."),
    ]),
    simStep("insulin", "Insulin Timing", "K+ 4.0 mmol/L, fluids running.", "When to start insulin?", [
      simChoice("Start IV insulin infusion when K+ safe and fluids established — no bolus", true, "ISPAD: continuous infusion, no bolus."),
      simChoice("10 U IV push then drip", false, "Bolus increases cerebral oedema risk."),
      simChoice("Stop insulin when glucose <15 mmol/L", false, "Continue until ketosis resolving — not glucose alone."),
    ]),
    simStep("escalation", "Escalation", "GCS falling, headache, bradycardia after fluids.", "Concern?", [
      simChoice("Suspect cerebral oedema — call senior, reduce fluids, mannitol/hypertonic saline per protocol", true, "Cerebral oedema is life-threatening DKA complication."),
      simChoice("More rapid fluid bolus", false, "May worsen cerebral oedema."),
      simChoice("Discharge when glucose normalises", false, "DKA resolution requires ketone clearance."),
    ]),
    debriefStep("debrief", "Debrief", [
      "DKA: mmol/L, ketones, pH — continuous insulin infusion only (ISPAD).",
      "Fluids first; balanced crystalloid vs NS — know local choice.",
      "Insulin until ketosis resolving; watch for cerebral oedema.",
    ]),
  ],
});

export const DKA_II_SIM = buildSimulation({
  courseId: "dka-ii",
  level: "advanced",
  title: "DKA II: Insulin Infusion, Electrolytes, Cerebral Oedema",
  description: "Adolescent in DKA on insulin infusion — K+ falling, glucose 12 mmol/L but ketones persist.",
  steps: [
    simStep("scenario_brief", "Scenario", "14-year-old, 18 h into DKA protocol. Glucose falling but still acidotic.", "Interpretation?", [
      simChoice("DKA not yet resolved — ketosis ongoing despite euglycaemia", true, "ISPAD: do not stop insulin based on glucose alone."),
      simChoice("DKA resolved — stop insulin", false, "Ketones/pH still abnormal."),
      simChoice("Add insulin loading dose for speed", false, "ISPAD: infusion only — no loading dose in paediatric DKA."),
    ]),
    simStep("potassium", "Potassium", "K+ 3.0 mmol/L on labs.", "Action?", [
      simChoice("Add K+ to fluids per protocol before/with insulin — never KCl IV push", true, "Hypokalaemia risk with insulin; never push KCl."),
      simChoice("KCl IV push 10 mmol", false, "KCl IV push is lethal — never."),
      simChoice("Stop insulin to raise K+", false, "Continue insulin with K+ replacement."),
    ]),
    simStep("cerebral_oedema", "Cerebral Oedema", "Sudden headache, vomiting, fluctuating GCS.", "Management?", [
      simChoice("Reduce fluid rate, elevate head, mannitol or 3% saline, ICU/senior", true, "ISPAD cerebral oedema protocol."),
      simChoice("Increase fluids for dehydration", false, "Opposite of cerebral oedema management."),
      simChoice("Rapid bicarbonate infusion", false, "Not routine; cerebral oedema needs specific treatment."),
    ]),
    simStep("disposition", "Disposition", "Ketones clearing, pH improving.", "Completion criteria?", [
      simChoice("Transition to SC insulin when acidosis resolved and tolerating oral intake", true, "ISPAD resolution criteria before subcutaneous switch."),
      simChoice("Discharge when glucose <10 mmol/L", false, "Incomplete DKA resolution."),
      simChoice("Stop all monitoring at 12 h", false, "Electrolytes and neuro status need ongoing monitoring."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Continue insulin until ketosis resolves — euglycaemic DKA exists.",
      "Replace K+ in fluids; never KCl IV push.",
      "Cerebral oedema: recognise early, reduce fluids, specific therapy.",
    ]),
  ],
});

export const STATUS_EPILEPTICUS_I_SIM = buildSimulation({
  courseId: "status-epilepticus-i",
  level: "foundational",
  title: "Status Epilepticus I: First-Line Benzodiazepines",
  description: "4-year-old ongoing generalised tonic-clonic seizure >5 minutes in ED.",
  steps: [
    simStep("scenario_brief", "Scenario", "Seizure 7 minutes, no recovery between movements.", "Definition and first step?", [
      simChoice("Status epilepticus — ABCDE and first-line benzodiazepine", true, "ILAE: treat at 5 minutes."),
      simChoice("Wait 20 minutes before treatment", false, "Status epilepticus needs immediate treatment."),
      simChoice("Oral paracetamol", false, "Not anticonvulsant therapy."),
    ]),
    simStep("first_line", "First-Line Agent", "IV access difficult; buccal route possible.", "Age-appropriate first-line?", [
      simChoice("Buccal midazolam or IV lorazepam — diazepam if only option (respiratory depression risk)", true, "International first-line with Kenya diazepam caveat from module."),
      simChoice("IV phenytoin first-line", false, "Benzodiazepine is first-line."),
      simChoice("Rectal paracetamol", false, "Not antiepileptic."),
    ]),
    simStep("neonatal_note", "Age Check", "If this were a 10-day-old neonate:", "Neonatal rule?", [
      simChoice("Skip benzodiazepines first-line — phenobarbital per neonatal protocol", true, "Module teaching: neonates — no benzos first-line."),
      simChoice("Same buccal midazolam dose", false, "Neonatal pathway differs."),
      simChoice("Observation only", false, "Neonatal seizures are an emergency."),
    ]),
    simStep("escalation", "Escalation", "Seizure continues 10 min after first benzo.", "Next step?", [
      simChoice("Second benzodiazepine dose if protocol allows, call senior, prepare second-line", true, "Escalate per status epilepticus algorithm."),
      simChoice("Discharge if movements slow", false, "Ongoing seizure needs treatment."),
      simChoice("Oral levetiracetam only", false, "IV/second-line may be needed."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Status epilepticus at 5 minutes — treat immediately (ILAE).",
      "Buccal midazolam / lorazepam; diazepam with caution.",
      "Neonates: no benzos first-line — phenobarbital.",
    ]),
  ],
});

export const STATUS_EPILEPTICUS_II_SIM = buildSimulation({
  courseId: "status-epilepticus-ii",
  level: "advanced",
  title: "Status Epilepticus II: Refractory SE and Intubation",
  description: "5-year-old still seizing after 2 benzodiazepine doses and levetiracetam load.",
  steps: [
    simStep("scenario_brief", "Scenario", "Refractory convulsive status epilepticus, GCS 6, SpO₂ 90%.", "Classification?", [
      simChoice("Refractory status epilepticus", true, "Failure of first and second-line agents."),
      simChoice("Simple febrile seizure", false, "Duration and refractory course exclude this."),
      simChoice("Psychogenic — no treatment", false, "Treat as true SE until proven otherwise."),
    ]),
    simStep("second_line", "Second-Line", "IV access secured.", "Agent?", [
      simChoice("Levetiracetam, phenytoin, or valproate per protocol — one at a time", true, "ILAE second-line options."),
      simChoice("Repeat benzo every minute indefinitely", false, "Risk respiratory depression."),
      simChoice("Oral carbamazepine loading", false, "IV second-line needed."),
    ]),
    simStep("airway", "Airway Protection", "Persistent seizure, vomiting, hypoxia.", "Action?", [
      simChoice("Intubation for airway protection and anaesthetic agent for seizure control", true, "Refractory SE often needs ICU intubation."),
      simChoice("Nasal cannula only", false, "Inadequate for refractory SE."),
      simChoice("Discharge on oral phenobarbital", false, "Critically ill."),
    ]),
    simStep("icu", "ICU Pathway", "Intubated on propofol/midazolam infusion.", "Further care?", [
      simChoice("Continuous EEG if available, treat underlying cause, PICU protocols", true, "Advanced SE management."),
      simChoice("Extubate immediately when movements stop", false, "Risk recurrence and neuro injury."),
      simChoice("Stop all anticonvulsants", false, "Maintain therapy."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Refractory SE: second-line IV antiepileptic.",
      "Intubation for airway and anaesthetic control.",
      "ICU, continuous EEG, treat underlying cause.",
    ]),
  ],
});

export const ANAPHYLAXIS_I_SIM = buildSimulation({
  courseId: "anaphylaxis-i",
  level: "foundational",
  title: "Anaphylaxis I: Recognition and IM Epinephrine",
  description: "7-year-old develops urticaria, wheeze, and hypotension minutes after peanut exposure.",
  steps: [
    simStep("scenario_brief", "Scenario", "Food allergy history. Lip swelling, wheeze, BP 75/40.", "Diagnosis?", [
      simChoice("Anaphylaxis — IM epinephrine immediately", true, "Multi-system allergic reaction with hypotension."),
      simChoice("Mild urticaria — oral antihistamine only", false, "Hypotension and wheeze = anaphylaxis."),
      simChoice("Asthma — salbutamol only", false, "Hypotension and urticaria point to anaphylaxis."),
    ]),
    simStep("epinephrine", "Epinephrine Dose", "Weight 25 kg.", "Correct dose?", [
      simChoice("IM epinephrine 0.01 mg/kg (max 0.5 mg) lateral thigh — may repeat in 5–15 min", true, "WHO/WAO first-line anaphylaxis treatment."),
      simChoice("IV epinephrine push undiluted first-line", false, "IM is first-line; IV is advanced/refractory."),
      simChoice("SC epinephrine", false, "IM absorption preferred."),
    ]),
    simStep("adjuncts", "Adjunct Therapy", "After IM epinephrine, still wheezy.", "Additional care?", [
      simChoice("High-flow O₂, IV fluids if shocked, salbutamol for bronchospasm, observe ≥6–12 h", true, "Adjuncts after epinephrine; observe for biphasic reaction."),
      simChoice("Discharge immediately after one dose", false, "Biphasic reactions occur — observe."),
      simChoice("Antibiotics for allergy", false, "Not indicated."),
    ]),
    simStep("escalation", "Escalation", "Repeat hypotension after 2 IM doses.", "Escalate?", [
      simChoice("Call senior, IV epinephrine infusion, prepare ICU", true, "Refractory anaphylaxis needs advanced care."),
      simChoice("Send home with EpiPen advice only", false, "Unstable patient."),
      simChoice("Oral steroids only", false, "Haemodynamic instability persists."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Anaphylaxis: IM epinephrine 0.01 mg/kg immediately.",
      "Adjuncts: O₂, fluids, bronchodilator; observe for biphasic reaction.",
      "Escalate refractory cases — IV epinephrine and ICU.",
    ]),
  ],
});

export const ANAPHYLAXIS_II_SIM = buildSimulation({
  courseId: "anaphylaxis-ii",
  level: "advanced",
  title: "Anaphylaxis II: Refractory Anaphylaxis and Airway",
  description: "Adolescent with refractory hypotension after 2 IM epinephrine doses, stridor developing.",
  steps: [
    simStep("scenario_brief", "Scenario", "Refractory anaphylaxis post antibiotic. Angioedema, stridor.", "Priority?", [
      simChoice("Airway assessment + IV epinephrine infusion + senior/ICU", true, "Refractory with airway compromise."),
      simChoice("Oral antihistamine and discharge", false, "Life-threatening."),
      simChoice("IM epinephrine only — no further doses", false, "May need infusion."),
    ]),
    simStep("iv_epinephrine", "IV Epinephrine", "Two large-bore IVs.", "Administration?", [
      simChoice("Titratable IV epinephrine infusion with continuous monitoring", true, "Advanced refractory anaphylaxis management."),
      simChoice("IV epinephrine 1 mg push", false, "Cardiac arrest dose — not for infusion substitute."),
      simChoice("Subcutaneous adrenaline", false, "IV infusion for refractory shock."),
    ]),
    simStep("airway", "Airway", "Progressive stridor, SpO₂ 88%.", "Action?", [
      simChoice("Prepare for intubation — difficult airway team; surgical airway backup", true, "Angioedema may make intubation difficult."),
      simChoice("Nebulised salbutamol only", false, "Upper airway oedema needs advanced airway plan."),
      simChoice("Delay intervention", false, "Stridor with hypoxia is an emergency."),
    ]),
    simStep("vasopressors", "Vasopressors", "Still hypotensive on infusion.", "Additional support?", [
      simChoice("Noradrenaline/vasopressin adjunct per ICU protocol", true, "Multi-agent support in refractory shock."),
      simChoice("Stop epinephrine to reduce HR", false, "Titrate, don't stop abruptly."),
      simChoice("Fluid overload with 100 mL/kg", false, "Careful fluids in anaphylaxis."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Refractory anaphylaxis: IV epinephrine infusion.",
      "Airway oedema — early difficult-airway planning.",
      "ICU vasopressor support and monitoring.",
    ]),
  ],
});

export const AKI_I_SIM = buildSimulation({
  courseId: "aki-i",
  level: "foundational",
  title: "AKI I: Recognition and Initial Fluid Balance",
  description: "5-year-old post-gastroenteritis, oliguric, creatinine rising.",
  steps: [
    simStep("scenario_brief", "Scenario", "Decreased urine 24 h, vomiting settled, looks puffy.", "Assessment?", [
      simChoice("Evaluate AKI stage with urine output and creatinine (KDIGO)", true, "Foundational AKI recognition."),
      simChoice("Discharge — GE resolved", false, "Oliguria and rising creatinine need workup."),
      simChoice("Immediate dialysis", false, "Assess stage and cause first."),
    ]),
    simStep("recognition", "Recognition", "Urine 0.2 mL/kg/h, creatinine 2× baseline.", "Stage?", [
      simChoice("AKI Stage 2–3 — admit and monitor", true, "Oliguria meets KDIGO criteria."),
      simChoice("Normal hydration", false, "Oliguria contradicts."),
      simChoice("Chronic kidney disease only", false, "Acute rise suggests AKI."),
    ]),
    simStep("fluids", "Fluid Management", "Not in pulmonary oedema.", "Plan?", [
      simChoice("Careful isotonic fluids to restore perfusion — avoid overload", true, "Hypovolaemic AKI may respond to cautious fluids."),
      simChoice("Large free water bolus", false, "Risk hyponatraemia/overload."),
      simChoice("No fluids ever in AKI", false, "Hypovolaemia may contribute."),
    ]),
    simStep("escalation", "Escalation", "K+ 6.0 mmol/L, ECG peaked T waves.", "Urgent action?", [
      simChoice("Calcium gluconate, insulin-dextrose, salbutamol — call senior; never KCl", true, "Hyperkalaemia emergency — never KCl IV push."),
      simChoice("KCl IV push", false, "Never KCl IV push."),
      simChoice("Oral potassium supplement", false, "Dangerous with hyperkalaemia."),
    ]),
    debriefStep("debrief", "Debrief", [
      "AKI: KDIGO staging with urine output and creatinine.",
      "Cautious fluid resuscitation when hypovolaemic.",
      "Hyperkalaemia is an emergency — specific treatments, never KCl push.",
    ]),
  ],
});

export const AKI_II_SIM = buildSimulation({
  courseId: "aki-ii",
  level: "advanced",
  title: "AKI II: RRT Indications and LMIC Options",
  description: "12-year-old AKI post malaria — anuric, K+ 7, pulmonary oedema.",
  steps: [
    simStep("scenario_brief", "Scenario", "Anuric 48 h, volume overloaded, refractory hyperkalaemia.", "RRT indication?", [
      simChoice("AEIOU — Acidosis, Electrolytes, Intoxication, Overload, Uraemia", true, "Standard RRT indications."),
      simChoice("No RRT in children", false, "Children need RRT when indicated."),
      simChoice("Oral furosemide only", false, "Anuric — inadequate."),
    ]),
    simStep("rrt", "RRT Modality", "No haemodialysis machine available.", "LMIC option?", [
      simChoice("Discuss peritoneal dialysis as option when HD unavailable — not first-line everywhere", true, "Module LMIC callout: PD when HD unavailable."),
      simChoice("KCl IV push to shift K+", false, "Never KCl IV push."),
      simChoice("Ignore hyperkalaemia", false, "Fatal if untreated."),
    ]),
    simStep("phosphate", "Electrolytes", "Phosphate rising, tetany risk.", "Management?", [
      simChoice("Restrict phosphate intake, consider binders, RRT if severe", true, "Advanced AKI electrolyte management."),
      simChoice("Give large IV calcium chloride push routinely", false, "Indicated for hyperkalaemia/cardiac protection — individualise."),
      simChoice("Stop all monitoring", false, "Electrolytes need serial labs."),
    ]),
    simStep("team", "Disposition", "Transfer to regional unit 3 h away.", "Plan?", [
      simChoice("Stabilise K+, arrange escorted transfer for RRT", true, "Safe retrieval for RRT."),
      simChoice("Discharge with ORS", false, "Critically ill."),
      simChoice("Nephrotoxic NSAIDs for fever", false, "Avoid nephrotoxins in AKI."),
    ]),
    debriefStep("debrief", "Debrief", [
      "RRT when AEIOU criteria met.",
      "PD as LMIC option when HD unavailable.",
      "Aggressive electrolyte management; avoid nephrotoxins.",
    ]),
  ],
});

export const SEVERE_ANAEMIA_I_SIM = buildSimulation({
  courseId: "severe-anaemia-i",
  level: "foundational",
  title: "Anaemia I: Severe Anaemia Recognition and Transfusion",
  description: "2-year-old pale, tachycardic, Hb 4 g/dL after malaria treatment.",
  steps: [
    simStep("scenario_brief", "Scenario", "Pale, RR 45, HR 160, Hb 4 g/dL, alert but tired.", "Concern?", [
      simChoice("Severe anaemia — assess for transfusion need", true, "WHO thresholds guide transfusion."),
      simChoice("Normal toddler", false, "Hb 4 is life-threatening."),
      simChoice("Iron tablet and discharge", false, "Severe anaemia may need blood."),
    ]),
    simStep("transfusion", "Transfusion", "Weight 12 kg, no heart failure signs.", "Initial volume?", [
      simChoice("10 mL/kg packed red cells over 3–4 h with monitoring", true, "WHO paediatric transfusion teaching."),
      simChoice("Whole blood 30 mL/kg rapid push", false, "Risk fluid overload — especially if heart failure."),
      simChoice("No transfusion until Hb 2", false, "Delay increases mortality."),
    ]),
    simStep("reaction", "Transfusion Reaction", "30 min into transfusion: fever, urticaria, back pain.", "Action?", [
      simChoice("Stop transfusion, IV fluids, treat reaction, notify blood bank", true, "Standard transfusion reaction protocol."),
      simChoice("Continue — finish unit", false, "Stop at first reaction signs."),
      simChoice("Give second unit faster", false, "Dangerous."),
    ]),
    simStep("escalation", "Escalation", "Crackles after transfusion, RR 55.", "Concern?", [
      simChoice("Transfusion-associated circulatory overload — stop fluids, senior review", true, "TACO risk in severe anaemia transfusion."),
      simChoice("Another blood unit", false, "Overload present."),
      simChoice("Discharge", false, "Unstable."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Severe anaemia: WHO transfusion thresholds.",
      "10 mL/kg PRBC cautiously; watch TACO.",
      "Stop transfusion for any reaction — standard protocol.",
    ]),
  ],
});

export const SEVERE_ANAEMIA_II_SIM = buildSimulation({
  courseId: "severe-anaemia-ii",
  level: "advanced",
  title: "Anaemia II: Sickle Crisis and Kenya Blood Bank Reality",
  description: "8-year-old with SCD, chest pain, SpO₂ 90%, fever.",
  steps: [
    simStep("scenario_brief", "Scenario", "Known HbSS, acute chest syndrome suspected.", "Diagnosis?", [
      simChoice("Acute chest syndrome / sickle crisis — admit, O₂, antibiotics, transfusion discussion", true, "Fever + chest pain + hypoxia in SCD."),
      simChoice("Simple asthma — salbutamol only", false, "SCD context changes management."),
      simChoice("Iron overload — stop transfusion forever", false, "May need exchange transfusion."),
    ]),
    simStep("transfusion", "Transfusion Strategy", "Hb 6.5, hypoxic.", "Advanced choice?", [
      simChoice("Exchange transfusion if available for severe ACS; simple transfusion if not", true, "Module advanced sickle management."),
      simChoice("No blood — Kenya has no bank", false, "Document limitation but treat per available resources."),
      simChoice("Rapid 30 mL/kg whole blood", false, "Risk overload — titrate per protocol."),
    ]),
    simStep("malaria", "Co-morbidity", "Blood smear positive for malaria.", "Management?", [
      simChoice("Treat malaria (artesunate) AND sickle crisis concurrently", true, "Co-morbidity common in East Africa."),
      simChoice("Ignore malaria — sickle only", false, "Malaria worsens anaemia."),
      simChoice("Artemether IM only without artesunate discussion", false, "WHO: IV artesunate for severe malaria."),
    ]),
    simStep("disposition", "Disposition", "Improving on O₂ and transfusion.", "Planning?", [
      simChoice("Complete antibiotics, hydroxyurea adherence counselling, folate, follow-up haematology", true, "Long-term SCD care."),
      simChoice("Discharge without follow-up", false, "High readmission risk."),
      simChoice("Stop hydroxyurea", false, "Disease-modifying therapy."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Acute chest syndrome: O₂, antibiotics, transfusion/exchange.",
      "Malaria co-morbidity — treat both.",
      "Kenya context: blood availability — document and escalate early.",
    ]),
  ],
});

export const METABOLIC_NEURO_SIMULATIONS = [
  DKA_I_SIM,
  DKA_II_SIM,
  STATUS_EPILEPTICUS_I_SIM,
  STATUS_EPILEPTICUS_II_SIM,
  ANAPHYLAXIS_I_SIM,
  ANAPHYLAXIS_II_SIM,
  AKI_I_SIM,
  AKI_II_SIM,
  SEVERE_ANAEMIA_I_SIM,
  SEVERE_ANAEMIA_II_SIM,
];
