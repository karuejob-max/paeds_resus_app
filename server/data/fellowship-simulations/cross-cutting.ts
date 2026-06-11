import { buildSimulation, debriefStep, simChoice, simStep } from "./build";

export const SERIOUSLY_ILL_CHILD_I_SIM = buildSimulation({
  courseId: "seriously-ill-child-i",
  level: "foundational",
  title: "Seriously Ill Child: ABCDE and Escalation",
  description:
    "Cross-cutting foundation: 3-year-old with fever, rash, and poor perfusion — you are first responder at district hospital.",
  steps: [
    simStep(
      "scenario_brief",
      "Scenario",
      "Setting: busy paediatric ward, Western Kenya. Parents report 12 h fever, child now quiet and floppy.",
      "What structured approach matches ResusGPS and this course?",
      [
        simChoice("PAT then ABCDE — treat life threats as found", true, "Cross-cutting fellowship foundation aligned with ResusGPS."),
        simChoice("Complete history before touching the child", false, "Life threats come first.", "PAT takes seconds — then ABCDE."),
        simChoice("Discharge if temperature <38°C", false, "Appearance and perfusion matter more than fever alone."),
      ],
      { vitals: { setting: "District hospital ward", age: "3 years" } }
    ),
    simStep(
      "pat_assessment",
      "PAT — Triage",
      "Appearance: lethargic, minimal response. Work of breathing: tachypnoea, mild recessions. Circulation: mottled, CRT 4 s.",
      "What does PAT tell you?",
      [
        simChoice("Seriously ill child — needs immediate ABCDE and senior help", true, "Abnormal PAT in all domains = high risk."),
        simChoice("Well child — routine outpatient care", false, "Lethargy and poor perfusion are red flags."),
        simChoice("Mild viral illness only", false, "Perfusion failure requires emergency approach."),
      ],
      { vitals: { appearance: "Lethargic", WOB: "Tachypnoea", circulation: "Mottled, CRT 4 s" } }
    ),
    simStep(
      "abcde_priority",
      "ABCDE Priority",
      "SpO₂ 88% on room air, HR 165, weak pulses, non-blanching purpuric rash on legs.",
      "Most urgent intervention?",
      [
        simChoice("High-flow oxygen + IV access + immediate antibiotics for suspected meningococcaemia", true, "Sepsis with purpura — time-critical antibiotics and oxygen."),
        simChoice("Wait for lumbar puncture before antibiotics", false, "Never delay antibiotics in suspected meningococcal sepsis."),
        simChoice("Oral paracetamol and observe", false, "Inadequate for septic shock pattern."),
      ]
    ),
    simStep(
      "fluids_escalation",
      "Fluids and Escalation",
      "After O₂ and antibiotics started. Still CRT 4 s, BP 72/38.",
      "Foundational fluid and escalation plan?",
      [
        simChoice("10–20 mL/kg isotonic bolus, reassess, call senior, prepare transfer", true, "FEAST-aware boluses with escalation."),
        simChoice("No fluids — antibiotics enough", false, "Shock needs fluid resuscitation."),
        simChoice("Discharge when afebrile", false, "Still in shock."),
      ]
    ),
    simStep(
      "escalation_trigger",
      "When to Call Senior",
      "After 2 boluses, child more drowsy, BP still low.",
      "Correct escalation?",
      [
        simChoice("Activate senior/transfer — fluid-refractory shock needs advanced care", true, "Foundational rule: know your limits and escalate early."),
        simChoice("Manage alone — third bolus without telling anyone", false, "Escalation is a core fellowship competency."),
        simChoice("Stop treatment and send home", false, "Dangerous."),
      ],
      { clinicalContext: "Seriously ill child foundation: recognition → first-hour actions → escalate." }
    ),
    debriefStep("debrief", "Debrief", [
      "PAT triages the seriously ill child in seconds.",
      "ABCDE treats life threats in order — oxygen, access, antibiotics in sepsis.",
      "Escalate early when shock persists — maps to ResusGPS definitive care.",
    ]),
  ],
});

export const CROSS_CUTTING_SIMULATIONS = [SERIOUSLY_ILL_CHILD_I_SIM];
