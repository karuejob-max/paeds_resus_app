/**
 * Canonical BLS summative question bank (25 unique stems).
 * AHA 2020/2025 BLS Provider — disjoint from diagnostic baseline and module formatives.
 */
import type { AhaSummativeQuestionSeed } from "./aha-summative-types";

export const BLS_SUMMATIVE_QUESTIONS: AhaSummativeQuestionSeed[] = [
  {
    question: "Which statement best describes the 2025 AHA Chain of Survival?",
    options: [
      "There are separate chains for IHCA and OHCA",
      "Adult and Pediatric chains remain distinct",
      "A single, unified chain applies to all ages and settings",
      "The chain no longer includes the Recovery link"
    ],
    correctAnswer: 2,
    explanation: "The 2025 guidelines unified the chain to simplify the framework and emphasize consistent high-quality care across all scenarios.",
  },
  {
    question: "When you find an unresponsive adult, what is the first action?",
    options: [
      "Begin chest compressions immediately",
      "Check carotid pulse for 30 seconds",
      "Tap shoulders, shout, and check for response and breathing",
      "Attach AED pads before any assessment",
    ],
    correctAnswer: 2,
    explanation:
      "Check responsiveness and breathing first; activate EMS and start CPR if unresponsive with absent or abnormal breathing.",
  },
  {
    question: "AED use during adult cardiac arrest should occur:",
    options: [
      "Only after 5 minutes of CPR",
      "As soon as the device is available",
      "Only if a physician is present",
      "After three cycles of 30:2 CPR only",
    ],
    correctAnswer: 1,
    explanation:
      "Apply the AED as soon as it arrives; do not delay for additional CPR cycles when shockable rhythm may be present.",
  },
  {
    question: "After an AED delivers a shock, rescuers should:",
    options: [
      "Check pulse for 30 seconds",
      "Resume CPR immediately",
      "Wait for spontaneous breathing",
      "Remove pads and reassess rhythm manually",
    ],
    correctAnswer: 1,
    explanation:
      "Resume CPR immediately after shock delivery; the AED will re-analyse after about 2 minutes.",
  },
  {
    question: "Leaning on the chest between compressions causes:",
    options: [
      "Improved venous return",
      "Incomplete recoil and reduced cardiac output",
      "Faster ROSC",
      "No effect on perfusion",
    ],
    correctAnswer: 1,
    explanation:
      "Incomplete recoil increases intrathoracic pressure and reduces venous return and cardiac output.",
  },
  {
    question: "Agonal gasping in an unresponsive person indicates:",
    options: [
      "Normal sleep breathing",
      "Respiratory distress that does not require CPR",
      "Cardiac arrest — begin CPR if not breathing normally",
      "Need for recovery position only",
    ],
    correctAnswer: 2,
    explanation:
      "Gasping is not normal breathing and is a sign of cardiac arrest requiring CPR.",
  },
  {
    question: "For a choking infant under 1 year with severe obstruction, use:",
    options: [
      "Five back blows and five chest thrusts",
      "Five back blows and five abdominal thrusts",
      "Blind finger sweeps first",
      "Heimlich maneuver only",
    ],
    correctAnswer: 0,
    explanation:
      "Infants receive back blows and chest thrusts; abdominal thrusts are not used under 1 year.",
  },
  {
    question: "For a choking child over 1 year with severe obstruction, use:",
    options: [
      "Chest thrusts only",
      "Five back blows and five abdominal thrusts",
      "Immediate cricothyrotomy",
      "Recovery position",
    ],
    correctAnswer: 1,
    explanation:
      "Children over 1 year with severe choking receive alternating back blows and abdominal thrusts.",
  },
  {
    question: "Single-rescuer infant CPR without an advanced airway uses:",
    options: ["15:2", "30:2", "3:1", "Continuous compressions only"],
    correctAnswer: 1,
    explanation:
      "Single-rescuer CPR for infants and children uses a 30:2 compression-to-ventilation ratio.",
  },
  {
    question: "The preferred two-rescuer infant compression technique is:",
    options: [
      "Two fingers on the sternum",
      "Two-thumb encircling hands technique",
      "Heel of one hand on the abdomen",
      "One rescuer compresses while the other holds legs",
    ],
    correctAnswer: 1,
    explanation:
      "Two-thumb encircling technique is preferred with two rescuers for infants.",
  },
  {
    question: "Pediatric compression depth for a child 1 year to puberty is at least:",
    options: ["1 inch (2.5 cm)", "1.5 inches (4 cm)", "2 inches (5 cm)", "3 inches (7.5 cm)"],
    correctAnswer: 2,
    explanation:
      "Child compression depth is at least 2 inches (5 cm), about one-third AP chest diameter.",
  },
  {
    question: "When alone and finding an unwitnessed pediatric arrest, you should:",
    options: [
      "Call EMS before starting CPR",
      "Perform CPR for about 2 minutes, then activate EMS",
      "Wait for a second rescuer",
      "Use AED only without CPR",
    ],
    correctAnswer: 1,
    explanation:
      "Unwitnessed pediatric arrest when alone: CPR first for about 2 minutes because etiology is often respiratory.",
  },
  {
    question: "The recovery position is appropriate for someone who is:",
    options: [
      "Unresponsive and not breathing normally",
      "Unresponsive with normal breathing",
      "In cardiac arrest",
      "Having chest pain only",
    ],
    correctAnswer: 1,
    explanation:
      "Recovery position maintains airway in unresponsive patients who are breathing normally.",
  },
  {
    question: "Chest compression fraction (CCF) during CPR should ideally exceed:",
    options: ["40%", "60%", "80%", "95%"],
    correctAnswer: 1,
    explanation:
      "Minimize pauses; target CCF at least 60% to maintain coronary perfusion pressure.",
  },
  {
    question: "During team CPR, compressor switches should occur approximately every:",
    options: ["30 seconds", "2 minutes", "5 minutes", "10 minutes"],
    correctAnswer: 1,
    explanation:
      "Switch compressors every 2 minutes or sooner if fatigued to maintain quality.",
  },
  {
    question: "Opioid-associated life-threatening respiratory depression may be treated with:",
    options: [
      "Naloxone per local protocol when indicated",
      "High-dose epinephrine IM first-line",
      "Defibrillation before ventilation",
      "No ventilation until naloxone effect ends",
    ],
    correctAnswer: 0,
    explanation:
      "Suspected opioid toxicity with respiratory arrest: ventilate and give naloxone per protocol while continuing BLS.",
  },
  {
    question: "High-performance team CPR assigns a leader to:",
    options: [
      "Perform all tasks alone",
      "Coordinate roles, closed-loop communication, and timing",
      "Document only after ROSC",
      "Operate AED exclusively",
    ],
    correctAnswer: 1,
    explanation:
      "The team leader coordinates tasks, communication, and rhythm checks during resuscitation.",
  },
  {
    question: "AED pad placement for an adult typically includes one pad:",
    options: [
      "On the abdomen and one on the back",
      "Upper right chest and lower left lateral chest",
      "Both on the left side only",
      "Over the pacemaker site always",
    ],
    correctAnswer: 1,
    explanation:
      "Standard placement is upper right chest and lower left side to direct current through the heart.",
  },
  {
    question: "If an AED advises no shock, rescuers should:",
    options: [
      "Stop all CPR",
      "Continue high-quality CPR and follow AED prompts",
      "Remove pads immediately",
      "Wait 10 minutes before further action",
    ],
    correctAnswer: 1,
    explanation:
      "Non-shockable rhythms require continuous CPR; follow AED and BLS algorithms.",
  },
  {
    question: "Ventilation with an advanced airway during adult CPR is given:",
    options: [
      "Two breaths every 30 compressions",
      "One breath every 6 seconds asynchronously",
      "One breath every 2 seconds continuously",
      "Only after ROSC",
    ],
    correctAnswer: 1,
    explanation:
      "With advanced airway: 1 breath every 6 seconds (10/min) without pausing compressions.",
  },
  {
    question: "Ventilation with an advanced airway during pediatric CPR is given:",
    options: [
      "One breath every 6 seconds",
      "One breath every 2–3 seconds (20–30/min)",
      "Two breaths every 15 compressions only",
      "No ventilations once airway is placed",
    ],
    correctAnswer: 1,
    explanation:
      "Pediatric advanced airway ventilation: 1 breath every 2–3 seconds asynchronously with compressions.",
  },
  {
    question: "Maximum recommended adult compression depth is approximately:",
    options: ["2 inches (5 cm) only", "2.4 inches (6 cm)", "3 inches (7.5 cm)", "No upper limit"],
    correctAnswer: 1,
    explanation:
      "Adult depth is at least 2 inches but not more than 2.4 inches (6 cm).",
  },
  {
    question: "Pulse check duration during BLS should not exceed:",
    options: ["5 seconds", "10 seconds", "30 seconds", "2 minutes"],
    correctAnswer: 1,
    explanation:
      "Limit pulse checks to no more than 10 seconds to minimize interruption in compressions.",
  },
  {
    question: "Foreign-body airway obstruction in a responsive adult with mild cough should:",
    options: [
      "Receive abdominal thrusts immediately",
      "Be encouraged to cough and monitored",
      "Receive back blows only while standing",
      "Begin CPR before assessment",
    ],
    correctAnswer: 1,
    explanation:
      "Mild obstruction with effective cough: encourage coughing and monitor; intervene if obstruction becomes severe.",
  },
  {
    question: "Two-rescuer adult BLS without an advanced airway uses ratio:",
    options: ["15:2", "30:2", "5:1", "3:1"],
    correctAnswer: 1,
    explanation:
      "Adult BLS uses 30:2 regardless of number of rescuers when no advanced airway is in place.",
  },
];
