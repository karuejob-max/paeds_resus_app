/**
 * Canonical NRP 2025 summative question bank (25 unique stems).
 * AHA/AAP neonatal resuscitation — disjoint from diagnostic baseline and module formatives.
 */
import type { AhaSummativeQuestionSeed } from "./aha-summative-types";

export const NRP_SUMMATIVE_QUESTIONS: AhaSummativeQuestionSeed[] = [
  {
    question:
      "How many links comprise the 2025 Newborn Chain of Care continuum?",
    options: ["Three", "Five", "Seven", "Ten"],
    correctAnswer: 2,
    explanation:
      "The 2025 Newborn Chain of Care has seven links from prevention through follow-up.",
  },
  {
    question:
      "Which antenatal factor most strongly warrants a delivery-room resuscitation team briefing?",
    options: [
      "Uncomplicated term pregnancy",
      "Expected preterm birth below 32 weeks",
      "Maternal mild anemia only",
      "Previous uncomplicated vaginal delivery",
    ],
    correctAnswer: 1,
    explanation:
      "Preterm birth and other high-risk conditions require anticipation, equipment checks, and role assignment before delivery.",
  },
  {
    question:
      "A term newborn is crying, has good tone, and breathes normally. The appropriate action is:",
    options: [
      "Immediate endotracheal intubation",
      "Routine care with warmth and ongoing observation",
      "Chest compressions at 120 events per minute",
      "Epinephrine via umbilical vein",
    ],
    correctAnswer: 1,
    explanation:
      "Vigorous term infants receive routine care; most newborns transition without intervention.",
  },
  {
    question:
      "For a newborn requiring resuscitation, axillary temperature should be maintained at approximately:",
    options: ["32–34°C", "36.5–37.5°C", "38.5–39.5°C", "No target — hyperthermia is preferred"],
    correctAnswer: 1,
    explanation:
      "Normothermia (36.5–37.5°C axillary) is the target; both hypothermia and hyperthermia harm outcomes.",
  },
  {
    question:
      "Plastic wrap or a thermal bag is recommended primarily for:",
    options: [
      "All term newborns regardless of status",
      "Preterm infants especially below 32 weeks gestation",
      "Only infants after ROSC",
      "Infants with meconium-stained fluid only",
    ],
    correctAnswer: 1,
    explanation:
      "Preterm infants lose heat rapidly; plastic wrap and warm surfaces reduce hypothermia risk.",
  },
  {
    question:
      "When immediate resuscitation is required at birth, umbilical cord management should:",
    options: [
      "Always delay clamping for 5 minutes first",
      "Not delay ventilation and circulation support",
      "Prevent all cord milking in every case",
      "Require placental delivery before any PPV",
    ],
    correctAnswer: 1,
    explanation:
      "Effective ventilation takes priority over delayed clamping when resuscitation is needed.",
  },
  {
    question:
      "The recommended initial positive-pressure ventilation rate once chest movement is confirmed is approximately:",
    options: ["20 breaths/min", "40–60 breaths/min", "90 breaths/min", "120 breaths/min without pauses"],
    correctAnswer: 1,
    explanation:
      "After initial inflation breaths, ventilate at about 40–60 breaths per minute with visible chest rise.",
  },
  {
    question:
      "For a term newborn receiving PPV, the recommended starting inspired oxygen is:",
    options: ["21% (room air)", "100% always", "50% until intubated", "No oxygen ever for term infants"],
    correctAnswer: 0,
    explanation:
      "Room air is appropriate to start for term infants; titrate using pulse oximetry targets.",
  },
  {
    question:
      "For a preterm infant below 35 weeks receiving PPV, initial FiO₂ is typically:",
    options: ["100% until HR exceeds 100", "21–30% with titration to SpO₂ targets", "0% (no oxygen)", "60% fixed for 10 minutes"],
    correctAnswer: 1,
    explanation:
      "Preterm infants start with lower FiO₂ and titrate to intermittent preductal SpO₂ targets to avoid hyperoxemia.",
  },
  {
    question:
      "Approximately 3 minutes after birth, the target preductal SpO₂ is:",
    options: ["40–50%", "70–75%", "95–100% immediately", "No target until 30 minutes"],
    correctAnswer: 1,
    explanation:
      "SpO₂ rises gradually after birth; at 3 minutes the approximate target is 70–75%.",
  },
  {
    question:
      "In MR SOPA, suction is performed after which prior corrective steps?",
    options: [
      "Before any mask adjustment",
      "After mask adjustment and head repositioning",
      "Only after epinephrine administration",
      "After chest compressions are started",
    ],
    correctAnswer: 1,
    explanation:
      "MR SOPA order: Mask adjustment, Reposition, Suction, Open mouth, Pressure increase, Alternative airway.",
  },
  {
    question:
      "If chest rise is absent during bag-mask ventilation, the first troubleshooting step is:",
    options: [
      "Increase epinephrine dose",
      "Reposition the head and ensure a proper mask seal",
      "Stop ventilation for 2 minutes",
      "Begin compressions regardless of heart rate",
    ],
    correctAnswer: 1,
    explanation:
      "Reposition airway and optimize mask seal before escalating pressure or advanced airway.",
  },
  {
    question:
      "The preferred chest compression technique when the chest can be encircled is:",
    options: [
      "Two-finger technique on the sternum",
      "Two-thumb encircling hands technique",
      "One hand on the abdomen",
      "Heel of one hand only for all neonates",
    ],
    correctAnswer: 1,
    explanation:
      "Two-thumb encircling technique generates adequate depth and allows access for umbilical lines.",
  },
  {
    question:
      "Neonatal chest compressions should depress the sternum by approximately:",
    options: [
      "One-sixth of AP diameter",
      "One-third of the anterior-posterior chest diameter",
      "Two-thirds of AP diameter",
      "No measurable depth — pressure only",
    ],
    correctAnswer: 1,
    explanation:
      "Compression depth is about one-third the AP diameter of the chest.",
  },
  {
    question:
      "Endotracheal intubation during neonatal resuscitation is indicated when:",
    options: [
      "Every newborn regardless of status",
      "Bag-mask ventilation is ineffective after corrective steps",
      "Heart rate exceeds 160/min",
      "The infant is vigorous and crying",
    ],
    correctAnswer: 1,
    explanation:
      "Advanced airway is considered when bag-mask ventilation remains ineffective after MR SOPA or prolonged resuscitation is anticipated.",
  },
  {
    question:
      "A quick estimate for uncuffed endotracheal tube size (mm) uses the formula:",
    options: ["(gestational age / 10)", "(weight in kg + 6) / 2", "Age in years + 4", "Fixed 4.0 mm for all neonates"],
    correctAnswer: 1,
    explanation:
      "(Weight in kg + 6) / 2 or gestational age/10 provides a starting ETT size; confirm placement clinically.",
  },
  {
    question:
      "Emergency umbilical venous catheter insertion for medication administration typically advances:",
    options: ["10–15 cm until resistance", "2–4 cm until blood return", "Through the umbilical artery only", "Never during active resuscitation"],
    correctAnswer: 1,
    explanation:
      "UVC is inserted 2–4 cm for emergency access; confirm blood return and position before infusing.",
  },
  {
    question:
      "If epinephrine is given via endotracheal tube before IV access, the dose is:",
    options: [
      "Same as the IV dose",
      "Higher than IV because of poor absorption (0.05–0.1 mg/kg)",
      "Half the IV dose only",
      "Not permitted via ETT in neonates",
    ],
    correctAnswer: 1,
    explanation:
      "ETT epinephrine requires a higher dose (0.05–0.1 mg/kg) due to limited absorption until IV/UVC is available.",
  },
  {
    question:
      "Volume expansion with normal saline is most appropriate when there is suspicion of:",
    options: [
      "Isolated mild tachypnea with normal perfusion",
      "Blood loss with pallor and poor perfusion",
      "Vigorous crying with HR 150/min",
      "Routine term delivery without risk factors",
    ],
    correctAnswer: 1,
    explanation:
      "Suspected hypovolemia from blood loss warrants 10 mL/kg normal saline or O-negative blood over 5–10 minutes.",
  },
  {
    question:
      "For a non-vigorous infant born through meconium-stained amniotic fluid, priority is:",
    options: [
      "Routine intrapartum suction of the trachea for all",
      "Warmth, positioning, and effective ventilation as needed",
      "Withhold all stimulation",
      "Immediate chest compressions before any ventilation",
    ],
    correctAnswer: 1,
    explanation:
      "Focus on initial steps and ventilation; tracheal suction only if airway obstruction and skills/equipment are available.",
  },
  {
    question:
      "In suspected congenital diaphragmatic hernia, bag-mask ventilation should be:",
    options: [
      "Aggressive and prolonged before any airway",
      "Avoided or minimized — early intubation is preferred",
      "Withheld until after 10 minutes of compressions",
      "Given at maximum pressure always",
    ],
    correctAnswer: 1,
    explanation:
      "Distended bowel in the chest worsens with bag-mask ventilation; early intubation is preferred when CDH is suspected.",
  },
  {
    question:
      "After return of spontaneous circulation in a newborn, glucose should be:",
    options: [
      "Ignored unless symptomatic in adults",
      "Checked and treated per protocol",
      "Raised above 20 mmol/L prophylactically",
      "Only measured after NICU discharge",
    ],
    correctAnswer: 1,
    explanation:
      "Post-resuscitation care includes monitoring and treating hypoglycemia per local neonatal protocol.",
  },
  {
    question:
      "Therapeutic hypothermia for hypoxic-ischemic encephalopathy in eligible term infants is:",
    options: [
      "Started in every newborn regardless of status",
      "Considered per local criteria after stabilization",
      "Contraindicated in all neonatal resuscitation",
      "Replaced by routine hyperthermia",
    ],
    correctAnswer: 1,
    explanation:
      "Therapeutic hypothermia is considered for eligible term infants with HIE per institutional criteria after stabilization.",
  },
  {
    question:
      "Shared decision-making about withholding or discontinuing resuscitation should consider:",
    options: [
      "Only gestational age in isolation",
      "Gestational age, comorbidities, parental values, and regional outcomes data",
      "Legal requirements only with no parental input",
      "Always continue until 60 minutes regardless of response",
    ],
    correctAnswer: 1,
    explanation:
      "2025 ethics guidance emphasizes shared decisions accounting for prognosis, values, and institutional policy.",
  },
  {
    question:
      "A self-inflating bag used for neonatal PPV must have which safety feature?",
    options: [
      "No pressure limit — maximum pressure always",
      "A pressure-relief valve or manometer to avoid excessive pressure",
      "Fixed 100% oxygen without blender",
      "Automatic epinephrine delivery",
    ],
    correctAnswer: 1,
    explanation:
      "Pressure relief or monitoring prevents lung injury from excessive ventilation pressures.",
  },
];
