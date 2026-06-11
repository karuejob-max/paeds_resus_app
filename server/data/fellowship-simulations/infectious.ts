import { buildSimulation, debriefStep, simChoice, simStep } from "./build";

export const MENINGITIS_I_SIM = buildSimulation({
  courseId: "meningitis-i",
  level: "foundational",
  title: "Meningitis I: Recognition and First-Hour Antibiotics",
  description: "18-month-old febrile, irritable, bulging fontanelle, neck stiffness.",
  steps: [
    simStep("scenario_brief", "Scenario", "District hospital: high fever 24 h, vomiting, high-pitched cry.", "Red flags?", [
      simChoice("Bulging fontanelle + irritability + fever = suspected meningitis", true, "WHO/IDSA-aligned red flags in infants."),
      simChoice("Simple viral fever — paracetamol only", false, "Neck stiffness and fontanelle bulging are red flags."),
      simChoice("Delay antibiotics for LP first", false, "Give antibiotics immediately if meningitis suspected — do not delay."),
    ]),
    simStep("pat_assessment", "Assessment", "Irritable, HR 150, temp 39.8°C, positive Brudzinski sign.", "Priority?", [
      simChoice("ABCDE, check glucose, look for petechiae/purpura", true, "Structured assessment + meningococcaemia screen."),
      simChoice("Lumbar puncture before any treatment", false, "Antibiotics must not wait when bacterial meningitis likely."),
      simChoice("Oral antibiotics and discharge", false, "Suspected bacterial meningitis needs IV therapy."),
    ], { vitals: { temp: "39.8°C", fontanelle: "Bulging" } }),
    simStep("antibiotics", "First-Hour Antibiotics", "IV access obtained. No LP yet.", "Correct action?", [
      simChoice("Give IV ceftriaxone (or local empiric regimen) immediately", true, "Early antibiotics reduce mortality and sequelae."),
      simChoice("Wait for CT and LP results", false, "Delay increases harm — treat empirically."),
      simChoice("Oral amoxicillin", false, "Bacterial meningitis needs parenteral therapy."),
    ]),
    simStep("steroid", "Adjunct Therapy", "Bacterial meningitis suspected.", "Dexamethasone?", [
      simChoice("Give dexamethasone before or with first antibiotic dose if protocol allows", true, "May reduce hearing loss in bacterial meningitis (module teaching)."),
      simChoice("High-dose oral steroids for 2 weeks only — no antibiotics", false, "Antibiotics are essential."),
      simChoice("No steroids ever", false, "Module teaches dexamethasone consideration."),
    ]),
    simStep("escalation", "Escalation", "Non-blanching petechiae appear, CRT 4 s.", "Action?", [
      simChoice("Treat as meningococcal sepsis — fluids, antibiotics, call senior, prepare transfer", true, "Purpura + shock = meningococcaemia emergency."),
      simChoice("Discharge with oral meds", false, "Life-threatening."),
      simChoice("LP mandatory before treatment", false, "Do not delay treatment."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Meningitis red flags: fontanelle, neck stiffness, petechiae.",
      "IV antibiotics immediately — do not wait for LP.",
      "Consider dexamethasone; escalate if purpura or shock.",
    ]),
  ],
});

export const MENINGITIS_II_SIM = buildSimulation({
  courseId: "meningitis-ii",
  level: "advanced",
  title: "Meningitis II: ICP and Complications",
  description: "4-year-old with bacterial meningitis — GCS falling, unequal pupils.",
  steps: [
    simStep("scenario_brief", "Scenario", "Day 2 of meningitis treatment. GCS 9, vomiting, hypertension.", "Concern?", [
      simChoice("Raised intracranial pressure / impending herniation", true, "Cushing triad and pupil changes are red flags."),
      simChoice("Improvement — reduce antibiotics", false, "Neurological deterioration."),
      simChoice("Simple headache — oral paracetamol", false, "Falling GCS is an emergency."),
    ]),
    simStep("icp", "ICP Management", "Pupils unequal, bradycardia.", "Immediate actions?", [
      simChoice("Elevate head 30°, maintain CPP, hypertonic saline/mannitol per protocol, neurosurgery consult", true, "Neuro-critical care for raised ICP."),
      simChoice("Flat head position and fluid bolus", false, "May worsen ICP."),
      simChoice("Lumbar puncture now", false, "Contraindicated with raised ICP signs."),
    ]),
    simStep("complications", "Complications", "New focal seizure, subdural collection on ultrasound.", "Management?", [
      simChoice("Treat seizures, surgical drainage discussion, continue targeted antibiotics", true, "Subdural empyema is a known complication."),
      simChoice("Stop all anticonvulsants", false, "Seizures need treatment."),
      simChoice("Discharge", false, "Critically ill."),
    ]),
    simStep("team", "Team Coordination", "PICU bed available 2 h away.", "Plan?", [
      simChoice("Stabilise ICP, escorted transfer with neuro monitoring", true, "Advanced meningitis needs PICU."),
      simChoice("Send without monitoring", false, "High risk transfer."),
      simChoice("Oral antibiotics only during transfer", false, "Continue IV therapy."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Raised ICP: head elevation, osmotherapy, avoid LP.",
      "Complications: subdural empyema, seizures — surgical input.",
      "PICU coordination and safe transfer.",
    ]),
  ],
});

export const SEVERE_MALARIA_I_SIM = buildSimulation({
  courseId: "severe-malaria-i",
  level: "foundational",
  title: "Severe Malaria I: Recognition and Artesunate",
  description: "3-year-old in malaria-endemic area — fever, drowsy, Hb 6, parasites on smear.",
  steps: [
    simStep("scenario_brief", "Scenario", "Rural health centre: 2-day fever, not drinking, some convulsions.", "Classification?", [
      simChoice("Severe malaria — treat as emergency", true, "WHO severe malaria criteria met."),
      simChoice("Uncomplicated malaria — oral chloroquine only", false, "Altered consciousness and Hb 6 = severe."),
      simChoice("Viral illness — no antimalarials", false, "Positive smear with severe features needs artesunate."),
    ]),
    simStep("recognition", "Recognition", "GCS 12, Hb 6 g/dL, glucose 2.8 mmol/L, parasites ++.", "Critical findings?", [
      simChoice("Cerebral malaria + severe anaemia + hypoglycaemia", true, "Multiple WHO severe criteria."),
      simChoice("Mild anaemia only", false, "Altered consciousness changes urgency."),
      simChoice("Hyperglycaemia", false, "Glucose 2.8 mmol/L is hypoglycaemia."),
    ], { vitals: { glucose: "2.8 mmol/L", Hb: "6 g/dL" } }),
    simStep("treatment", "First-Line Therapy", "IV access available.", "Antimalarial?", [
      simChoice("IV artesunate 3 mg/kg — WHO first-line for severe malaria", true, "Artesunate reduces mortality vs artemether/quinine."),
      simChoice("Artemether IM as first-line over artesunate", false, "WHO: IV artesunate for severe malaria."),
      simChoice("Oral artemether-lumefantrine only", false, "Severe malaria needs parenteral therapy."),
    ]),
    simStep("hypoglycaemia", "Hypoglycaemia", "Glucose 2.8 mmol/L.", "Action?", [
      simChoice("IV dextrose 2 mL/kg 10% — recheck mmol/L", true, "Hypoglycaemia is common and dangerous in severe malaria."),
      simChoice("Oral sugar if not swallowing safely", false, "Altered GCS — IV dextrose safer."),
      simChoice("Ignore — treat malaria only", false, "Hypoglycaemia kills."),
    ]),
    simStep("escalation", "Escalation", "Seizure recurs despite dextrose and artesunate.", "Escalate?", [
      simChoice("Call senior, benzodiazepine per SE protocol, transfer to higher level", true, "Cerebral malaria may need ICU."),
      simChoice("Discharge with AL", false, "Unstable severe malaria."),
      simChoice("Stop artesunate", false, "Continue full course."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Severe malaria: WHO criteria — treat urgently.",
      "IV artesunate 3 mg/kg first-line.",
      "Check and treat hypoglycaemia in mmol/L.",
    ]),
  ],
});

export const SEVERE_MALARIA_II_SIM = buildSimulation({
  courseId: "severe-malaria-ii",
  level: "advanced",
  title: "Severe Malaria II: Complications and Exchange Transfusion",
  description: "6-year-old severe malaria with ARDS, oliguria, parasite load 15%.",
  steps: [
    simStep("scenario_brief", "Scenario", "Day 2 artesunate. SpO₂ 85%, anuric, Hb 4, parasites still 10%.", "Complications?", [
      simChoice("ARDS + AKI + persistent high parasitaemia", true, "Multi-organ severe malaria."),
      simChoice("Uncomplicated recovery", false, "Hypoxia and anuria persist."),
      simChoice("Iron deficiency only", false, "Acute severe illness."),
    ]),
    simStep("ards", "ARDS", "Bilateral infiltrates, ventilator needed.", "Management?", [
      simChoice("Lung-protective ventilation, continue artesunate, treat AKI", true, "ARDS is recognised severe malaria complication."),
      simChoice("High tidal volumes", false, "VILI risk."),
      simChoice("Stop antimalarials when afebrile", false, "Complete artesunate course."),
    ]),
    simStep("exchange", "Exchange Transfusion", "Parasitaemia >10% with complications.", "Indication?", [
      simChoice("Discuss exchange transfusion with haematology/senior when very high parasitaemia and failing", true, "Module advanced option in selected cases."),
      simChoice("Routine for all malaria", false, "Reserved for selected severe cases."),
      simChoice("Never transfuse in malaria", false, "Severe anaemia may still need blood."),
    ]),
    simStep("rrt", "Renal Support", "K+ rising, anuric.", "Action?", [
      simChoice("RRT discussion — PD if HD unavailable (LMIC)", true, "AKI complication management."),
      simChoice("KCl IV push", false, "Never KCl IV push."),
      simChoice("Large fluid bolus", false, "Risk pulmonary oedema."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Severe malaria complications: ARDS, AKI, MODS.",
      "Continue artesunate; exchange transfusion in selected cases.",
      "RRT/PD when indicated — AEIOU framework.",
    ]),
  ],
});

export const INFECTIOUS_SIMULATIONS = [
  MENINGITIS_I_SIM,
  MENINGITIS_II_SIM,
  SEVERE_MALARIA_I_SIM,
  SEVERE_MALARIA_II_SIM,
];
