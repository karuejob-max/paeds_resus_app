import { buildSimulation, debriefStep, simChoice, simStep } from "./build";

export const BURNS_I_SIM = buildSimulation({
  courseId: "burns-i",
  level: "foundational",
  title: "Burns I: Assessment and Parkland Fluids",
  description: "4-year-old scald to chest and arms from hot water — crying but alert.",
  steps: [
    simStep("scenario_brief", "Scenario", "Scald 30 minutes ago. Partial thickness burns to anterior trunk and both arms.", "First priorities?", [
      simChoice("ABCDE — airway first if facial/inhalation burn; stop burning process", true, "Airway risk in enclosed space or facial burns."),
      simChoice("Apply ice directly to large area", false, "Ice causes vasoconstriction — cool running water initially."),
      simChoice("Butter/oil on wounds", false, "Harmful — cool and cover."),
    ]),
    simStep("tbsa", "TBSA Calculation", "Child 4 years, burns as described.", "Estimate TBSA?", [
      simChoice("Rule of Nines / Lund-Browder — document % for fluid plan", true, "Accurate TBSA drives resuscitation."),
      simChoice("Guess 50% without examination", false, "Overestimation causes fluid overload."),
      simChoice("TBSA not needed for fluids", false, "Parkland/modified Brooke uses TBSA."),
    ]),
    simStep("fluids", "Fluid Resuscitation", "TBSA ~20%, weight 16 kg, time since burn 1 h.", "Initial plan?", [
      simChoice("Calculate 24 h fluid requirement (Parkland or local protocol), give half in first 8 h", true, "Module Parkland teaching with reassessment."),
      simChoice("Oral fluids only for 20% TBSA", false, "Significant burns need IV resuscitation."),
      simChoice("Normal saline 100 mL/kg rapid bolus", false, "Titrate to calculated plan — avoid overload."),
    ]),
    simStep("airway", "Inhalation Concern", "Soot in nostrils, hoarse voice.", "Action?", [
      simChoice("High suspicion inhalation injury — early senior/anaesthesia, monitor airway", true, "Hoarseness + soot = airway risk."),
      simChoice("Discharge with cream", false, "Airway compromise may develop."),
      simChoice("Nebulised salbutamol only", false, "Does not secure threatened airway."),
    ]),
    simStep("escalation", "Escalation", "Stridor developing.", "Escalate?", [
      simChoice("Call senior, prepare intubation and transfer to burn centre", true, "Airway escalation in burns."),
      simChoice("Wait until apnoeic", false, "Early intubation safer."),
      simChoice("Oral antibiotics only", false, "Airway is immediate priority."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Burns: ABCDE with airway vigilance.",
      "TBSA (Rule of Nines) drives fluid resuscitation.",
      "Inhalation injury: early senior and airway planning.",
    ]),
  ],
});

export const BURNS_II_SIM = buildSimulation({
  courseId: "burns-ii",
  level: "advanced",
  title: "Burns II: Wound Care and Compartment Syndrome",
  description: "10-year-old 35% TBSA flame burn, day 3, circumferential limb burns.",
  steps: [
    simStep("scenario_brief", "Scenario", "Circumferential full-thickness arm burn, weak distal pulses, pain on passive stretch.", "Concern?", [
      simChoice("Compartment syndrome — surgical emergency", true, "Circumferential burns + neurovascular compromise."),
      simChoice("Normal healing — dressings only", false, "Weak pulses and pain on stretch are red flags."),
      simChoice("Discharge", false, "Major burn inpatient care."),
    ]),
    simStep("escharotomy", "Escarotomy", "Doppler diminished.", "Action?", [
      simChoice("Urgent escharotomy/fasciotomy with surgical team", true, "Restore perfusion to limb."),
      simChoice("Elevate limb and observe 48 h", false, "Delay risks limb loss."),
      simChoice("Tight circumferential dressing", false, "Worsens compression."),
    ]),
    simStep("infection", "Infection Control", "Fever, wound odour, rising WCC.", "Management?", [
      simChoice("Wound cultures, targeted antibiotics, debridement planning", true, "Burn wound sepsis is common complication."),
      simChoice("Prophylactic IV antibiotics for all burns indefinitely", false, "Target infection when present."),
      simChoice("Topical honey only — no assessment", false, "Needs surgical assessment."),
    ]),
    simStep("grafting", "Definitive Care", "Stable after escharotomy.", "Plan?", [
      simChoice("Discuss skin grafting, nutrition, physiotherapy, psychosocial support", true, "Advanced burns multidisciplinary care."),
      simChoice("Early discharge without rehab plan", false, "Major burns need follow-up."),
      simChoice("No analgesia — toughen up", false, "Adequate analgesia is essential."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Compartment syndrome: escharotomy urgently.",
      "Monitor wound infection; targeted antibiotics.",
      "Multidisciplinary burn care and grafting planning.",
    ]),
  ],
});

export const TRAUMA_I_SIM = buildSimulation({
  courseId: "trauma-i",
  level: "foundational",
  title: "Trauma I: Primary Survey and Haemorrhage Control",
  description: "7-year-old fell from tree — head injury, open leg fracture, crying then drowsy.",
  steps: [
    simStep("scenario_brief", "Scenario", "Prehospital arrival: fall 3 m, helmet none, obvious leg deformity.", "Approach?", [
      simChoice("Primary survey ABCDE with cervical spine protection", true, "ATLS-aligned paediatric trauma approach."),
      simChoice("Set fracture first", false, "ABCDE before definitive fracture care."),
      simChoice("CT whole body before exam", false, "Primary survey clinical first."),
    ]),
    simStep("airway", "Airway with C-spine", "GCS 13, vomit in mouth.", "Action?", [
      simChoice("Jaw thrust, suction, C-spine immobilisation, prepare RSI if failing", true, "Trauma airway with spine precautions."),
      simChoice("Hyperextend neck to open airway", false, "Risk spinal injury."),
      simChoice("Oral fluids", false, "NPO in trauma."),
    ]),
    simStep("circulation", "Circulation", "HR 150, BP 85/50, cool peripheries, thigh deformity.", "Priority?", [
      simChoice("Direct pressure on bleeding, 10–20 mL/kg crystalloid, splint fracture", true, "Control external haemorrhage and resuscitate shock."),
      simChoice("Tourniquet on chest", false, "Target bleeding source."),
      simChoice("No fluids — wait for Hb", false, "Shock needs resuscitation."),
    ]),
    simStep("escalation", "Escalation", "GCS falls to 9, unequal pupils.", "Escalate?", [
      simChoice("Call senior, neuroprotective measures, urgent CT, trauma team activation", true, "Falling GCS = expanding intracranial pathology until proven otherwise."),
      simChoice("Discharge with crutches", false, "Unstable trauma."),
      simChoice("LP for meningitis", false, "Trauma context — neuroimaging first."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Trauma: ABCDE with C-spine protection.",
      "Control haemorrhage and splint fractures early.",
      "Escalate falling GCS — trauma team and imaging.",
    ]),
  ],
});

export const TRAUMA_II_SIM = buildSimulation({
  courseId: "trauma-ii",
  level: "advanced",
  title: "Trauma II: Massive Haemorrhage and Damage Control",
  description: "12-year-old MVC — abdominal distension, BP 60/30, FAST positive.",
  steps: [
    simStep("scenario_brief", "Scenario", "Blunt abdominal trauma, unresponsive intermittently.", "Activation?", [
      simChoice("Massive haemorrhage protocol + damage-control resuscitation", true, "Haemodynamically unstable with positive FAST."),
      simChoice("Oral analgesia and observe", false, "Shock with internal bleeding."),
      simChoice("Discharge if GCS improves briefly", false, "Unstable."),
    ]),
    simStep("mtp", "Massive Transfusion", "Ongoing hypotension.", "Blood products?", [
      simChoice("Activate MTP: packed cells + plasma + platelets in balanced ratio", true, "Damage-control resuscitation."),
      simChoice("Crystalloid 200 mL/kg only", false, "Haemorrhagic shock needs blood."),
      simChoice("Single unit PRBC — wait 24 h for next", false, "MTP provides balanced products."),
    ]),
    simStep("hypothermia", "Lethal Triad", "Temp 34°C, acidotic, coagulopathic.", "Prevention?", [
      simChoice("Warm fluids, forced air warming, limit exposure — damage control surgery", true, "Prevent hypothermia-acidosis-coagulopathy triad."),
      simChoice("Cold IV fluids rapidly", false, "Worsens hypothermia."),
      simChoice("Delay surgery until normothermic in OR only", false, "Damage control in unstable patients."),
    ]),
    simStep("surgery", "Damage Control", "OR in 15 min.", "Plan?", [
      simChoice("Abbreviated surgery to control bleeding, ICU resuscitation, planned relook", true, "Damage-control surgery principles."),
      simChoice("Definitive multi-hour repair now", false, "Unstable — abbreviated first."),
      simChoice("No surgical consult", false, "Positive FAST + shock needs surgery."),
    ]),
    debriefStep("debrief", "Debrief", [
      "Unstable trauma: MTP and damage-control resuscitation.",
      "Prevent lethal triad — warmth, balanced transfusion.",
      "Abbreviated surgery then ICU optimisation.",
    ]),
  ],
});

export const TRAUMA_BURNS_SIMULATIONS = [
  BURNS_I_SIM,
  BURNS_II_SIM,
  TRAUMA_I_SIM,
  TRAUMA_II_SIM,
];
