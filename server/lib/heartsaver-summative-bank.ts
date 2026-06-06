/**
 * Canonical Heartsaver summative question bank (25 unique stems).
 * AHA Heartsaver CPR AED 2025 — disjoint from diagnostic baseline and module formatives.
 */
import type { AhaSummativeQuestionSeed } from "./aha-summative-types";

export const HEARTSAVER_SUMMATIVE_QUESTIONS: AhaSummativeQuestionSeed[] = [
  {
    question: "The Chain of Survival describes:",
    options: [
      "Hospital billing steps only",
      "Actions that maximize survival from cardiac arrest",
      "AED maintenance schedule",
      "Pediatric fever management",
    ],
    correctAnswer: 1,
    explanation:
      "Early recognition, CPR, defibrillation, advanced care, and recovery form the Chain of Survival.",
  },
  {
    question: "Hands-only CPR is most appropriate for:",
    options: [
      "All pediatric arrests",
      "Untrained bystanders or those unwilling to give breaths in witnessed adult arrest",
      "Drowning victims always",
      "Unresponsive infants only",
    ],
    correctAnswer: 1,
    explanation:
      "Compression-only CPR is recommended for untrained rescuers in witnessed adult collapse.",
  },
  {
    question: "After attaching AED pads, you should:",
    options: [
      "Touch the person during analysis",
      "Clear the person so no one touches during analysis and shock",
      "Remove pads if no shock advised",
      "Stop CPR permanently",
    ],
    correctAnswer: 1,
    explanation:
      "Ensure no contact during rhythm analysis and shock delivery.",
  },
  {
    question: "Standard AED pad placement for adults places one pad:",
    options: [
      "Lower left side below the nipple line",
      "On the forehead",
      "On the right leg",
      "Over a medication patch without removal",
    ],
    correctAnswer: 0,
    explanation:
      "Pads go upper right chest and lower left lateral chest; remove medication patches under pads.",
  },
  {
    question: "If pediatric AED pads are unavailable for a child, you should:",
    options: [
      "Withhold defibrillation",
      "Use adult pads without delaying shock",
      "Wait for paramedics only",
      "Use one pad only",
    ],
    correctAnswer: 1,
    explanation:
      "Use adult pads if pediatric pads unavailable; anterior-posterior placement if pads overlap.",
  },
  {
    question: "Single-rescuer child CPR compression-to-ventilation ratio is:",
    options: ["15:2", "30:2", "3:1", "5:1"],
    correctAnswer: 1,
    explanation:
      "Single-rescuer child CPR uses 30:2; two rescuers use 15:2.",
  },
  {
    question: "2025 AHA guidelines for single-rescuer infant CPR recommend:",
    options: [
      "Two-finger technique only",
      "Heel of one hand on the sternum",
      "No compressions for infants",
      "Abdominal thrusts instead of compressions",
    ],
    correctAnswer: 1,
    explanation:
      "2025 guidelines eliminate two-finger technique; single rescuer uses heel of one hand.",
  },
  {
    question: "Two-rescuer infant CPR prefers:",
    options: [
      "Two-thumb encircling hands technique",
      "One finger on the sternum",
      "Compressions on the abdomen",
      "No ventilations",
    ],
    correctAnswer: 0,
    explanation:
      "Two-thumb encircling technique is preferred when two rescuers are available.",
  },
  {
    question: "Infant rescue breaths are delivered by:",
    options: [
      "Covering mouth only",
      "Covering mouth and nose with your mouth; small puffs",
      "Large breaths until stomach distends",
      "Bag-mask only — mouth-to-mouth is prohibited",
    ],
    correctAnswer: 1,
    explanation:
      "Give small puffs covering mouth and nose; stop when chest rises.",
  },
  {
    question: "Infant airway opening uses:",
    options: [
      "Head-tilt chin-lift with full extension",
      "Neutral head position — avoid hyperextension",
      "No positioning",
      "Jaw thrust only in all infants",
    ],
    correctAnswer: 1,
    explanation:
      "Large occiput requires neutral position; avoid hyperextension in infants.",
  },
  {
    question: "AED use in cardiac arrest should begin:",
    options: [
      "As soon as the device is available",
      "After 10 minutes of CPR only",
      "Only for children",
      "Only if pulse is confirmed",
    ],
    correctAnswer: 0,
    explanation:
      "Apply AED as soon as possible; early defibrillation improves survival in shockable rhythms.",
  },
  {
    question: "When the AED says 'stand clear,' you should:",
    options: [
      "Continue compressions",
      "Ensure no one touches the victim",
      "Check pulse",
      "Remove oxygen source only",
    ],
    correctAnswer: 1,
    explanation:
      "Stand clear during analysis and shock delivery to protect rescuers and ensure accurate rhythm analysis.",
  },
  {
    question: "Mild choking in a responsive adult with effective cough should:",
    options: [
      "Receive immediate abdominal thrusts",
      "Be monitored and encouraged to cough",
      "Begin CPR",
      "Receive back blows while lying flat",
    ],
    correctAnswer: 1,
    explanation:
      "Encourage coughing if airway is partially open and cough is effective.",
  },
  {
    question: "Severe choking in a responsive child over 1 year requires:",
    options: [
      "Five back blows and five abdominal thrusts",
      "Chest thrusts only",
      "Blind finger sweep first",
      "Recovery position",
    ],
    correctAnswer: 0,
    explanation:
      "Alternate back blows and abdominal thrusts until object is expelled or victim becomes unresponsive.",
  },
  {
    question: "If a choking victim becomes unresponsive, you should:",
    options: [
      "Begin CPR and check mouth for visible object",
      "Leave in recovery position",
      "Only call EMS without CPR",
      "Perform abdominal thrusts while standing",
    ],
    correctAnswer: 0,
    explanation:
      "Start CPR; look for visible foreign body before breaths but do not blind finger sweep.",
  },
  {
    question: "Signs of cardiac arrest in an adult include:",
    options: [
      "Normal talking and walking",
      "Unresponsiveness and absent or abnormal breathing",
      "Mild dizziness only",
      "Strong carotid pulse",
    ],
    correctAnswer: 1,
    explanation:
      "Cardiac arrest: unresponsive with no normal breathing (gasping counts as abnormal).",
  },
  {
    question: "When activating emergency response, a lay rescuer should:",
    options: [
      "Delay calling until ROSC",
      "Call or send someone to call EMS and get AED early",
      "Only text a friend",
      "Wait for physician arrival before any call",
    ],
    correctAnswer: 1,
    explanation:
      "Early EMS activation and AED retrieval are critical links in the Chain of Survival.",
  },
  {
    question: "Compression depth for adult CPR should be at least:",
    options: ["2 cm", "5 cm (2 inches)", "8 cm", "1 cm"],
    correctAnswer: 1,
    explanation:
      "Compress at least 5 cm (2 inches) but not more than 6 cm in adults.",
  },
  {
    question: "Pediatric CPR compression rate is:",
    options: ["60–80/min", "100–120/min", "140–160/min", "40/min"],
    correctAnswer: 1,
    explanation:
      "Same rate as adult CPR: 100–120 compressions per minute.",
  },
  {
    question: "Minimizing pauses during CPR helps maintain:",
    options: [
      "Coronary perfusion pressure",
      "Skin temperature only",
      "Blood glucose",
      "Respiratory rate without perfusion",
    ],
    correctAnswer: 0,
    explanation:
      "Limit interruptions to sustain perfusion during arrest.",
  },
  {
    question: "If you are alone and witness an adult collapse, you should:",
    options: [
      "Perform CPR for 2 minutes before calling EMS",
      "Call EMS, get AED, then begin CPR",
      "Wait for second rescuer",
      "Use recovery position",
    ],
    correctAnswer: 1,
    explanation:
      "Witnessed adult collapse: call EMS, get AED, start CPR — phone CPR if available.",
  },
  {
    question: "Drowning victims should receive:",
    options: [
      "Compression-only CPR always without breaths",
      "CPR with ventilations — respiratory cause is common",
      "No CPR until dry",
      "AED only",
    ],
    correctAnswer: 1,
    explanation:
      "Drowning arrests are often hypoxic; provide ventilations with compressions.",
  },
  {
    question: "Safe AED use includes:",
    options: [
      "Using on wet surfaces without drying chest",
      "Drying chest and avoiding contact during shock",
      "Removing all clothing including in rain without drying",
      "Placing pads over wet skin intentionally",
    ],
    correctAnswer: 1,
    explanation:
      "Dry the chest; avoid water between pads and skin; stand clear during shock.",
  },
  {
    question: "Child compression depth is at least:",
    options: ["1 inch", "2 inches (5 cm) or one-third AP diameter", "3 inches minimum always", "No depth standard"],
    correctAnswer: 1,
    explanation:
      "Compress at least one-third AP diameter, about 2 inches (5 cm) for children.",
  },
  {
    question: "After successful CPR until EMS arrives, you should:",
    options: [
      "Stop monitoring breathing",
      "Continue monitoring and be prepared to resume CPR if needed",
      "Discharge the person home",
      "Remove AED pads immediately and leave",
    ],
    correctAnswer: 1,
    explanation:
      "Monitor closely; arrest may recur until advanced care arrives.",
  },
];
