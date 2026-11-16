/**
 * BLS v2 summative exam (25 items). Every item records the module and section
 * where the tested fact is taught (`source`), enforced by a unit test, so the
 * exam cannot drift away from the lessons again.
 */
import type { AhaSummativeQuestionSeed } from "./aha-summative-types";

export type BlsV2SummativeQuestion = AhaSummativeQuestionSeed & {
  source: { module: number; section: string };
};

export const BLS_SUMMATIVE_QUESTIONS_V2: BlsV2SummativeQuestion[] = [
  // Module 1 (2)
  {
    question: "A colleague collapses and is unresponsive with only occasional slow gasps. You should:",
    options: [
      "Treat the gasps as normal breathing and monitor",
      "Treat as cardiac arrest, activate help and begin CPR",
      "Wait one minute to see if breathing improves",
      "Give two rescue breaths and then reassess",
    ],
    correctAnswer: 1,
    explanation: "Agonal gasping is not normal breathing. An unresponsive person who is only gasping is in cardiac arrest.",
    source: { module: 1, section: "Recognising Cardiac Arrest" },
  },
  {
    question: "Which statement about the 2025 Chain of Survival is correct?",
    options: [
      "Separate chains apply to adults and children",
      "One unified chain applies to adults and children, in and out of hospital",
      "The chain ends at defibrillation",
      "Recovery is not part of the chain",
    ],
    correctAnswer: 1,
    explanation: "The 2025 Guidelines use one unified six-link chain that ends with recovery.",
    source: { module: 1, section: "The Unified 2025 Chain of Survival" },
  },
  // Module 2 (4)
  {
    question: "Which chest compression rate is recommended for adults?",
    options: ["60 to 80 per minute", "80 to 100 per minute", "100 to 120 per minute", "120 to 140 per minute"],
    correctAnswer: 2,
    explanation: "Adult compressions are delivered at 100 to 120 per minute.",
    source: { module: 2, section: "Components of High-Quality CPR" },
  },
  {
    question: "What is the maximum adult compression depth to aim for?",
    options: [
      "No upper limit; deeper is always better",
      "About 6 cm (2.4 inches)",
      "About 3 cm (1.2 inches)",
      "About 10 cm (4 inches)",
    ],
    correctAnswer: 1,
    explanation: "Aim for at least 5 cm and avoid pressing deeper than about 6 cm (2.4 inches).",
    source: { module: 2, section: "Components of High-Quality CPR" },
  },
  {
    question: "What is the target for chest compression fraction during CPR?",
    options: [
      "As high as possible, and at least 60%",
      "Exactly 30%",
      "About 40%",
      "It is not measured during resuscitation",
    ],
    correctAnswer: 0,
    explanation: "Chest compression fraction is the share of resuscitation time spent giving compressions; keep it high and at least 60%.",
    source: { module: 2, section: "Components of High-Quality CPR" },
  },
  {
    question: "When giving a rescue breath to an adult, you should:",
    options: [
      "Blow forcefully for 3 seconds",
      "Give each breath over about 1 second with visible chest rise",
      "Give as many breaths as possible in 10 seconds",
      "Give breaths only if the person is not gasping",
    ],
    correctAnswer: 1,
    explanation: "Each breath takes about 1 second and should make the chest visibly rise. Avoid over-ventilation.",
    source: { module: 2, section: "Giving Breaths and the 30:2 Cycle" },
  },
  // Module 3 (4)
  {
    question: "An AED analyses and advises no shock. What is the correct next action?",
    options: [
      "Stop CPR and check for a pulse for one minute",
      "Resume CPR immediately",
      "Remove the pads",
      "Press the shock button once",
    ],
    correctAnswer: 1,
    explanation: "No shock advised does not mean the person is alive. Resume CPR straight away.",
    source: { module: 3, section: "Using an AED: The Universal Steps" },
  },
  {
    question: "Where does the first adult AED pad go?",
    options: [
      "Upper right chest, just below the collarbone",
      "Over the centre of the stomach",
      "On the upper back",
      "Over the left hip",
    ],
    correctAnswer: 0,
    explanation: "One pad goes on the upper right chest below the collarbone; the other on the left lateral lower chest.",
    source: { module: 3, section: "Pad Placement (2025) and the Bra Question" },
  },
  {
    question: "A woman in cardiac arrest is wearing a bra. According to the 2025 Guidelines:",
    options: [
      "Never place pads if a bra is present",
      "It may be reasonable to adjust the bra and apply pads to bare skin with good contact",
      "Place pads over the bra",
      "Stop CPR until it is removed",
    ],
    correctAnswer: 1,
    explanation: "Adjusting or moving a bra can be reasonable as long as pads sit on bare skin. Do not delay the shock.",
    source: { module: 3, section: "Pad Placement (2025) and the Bra Question" },
  },
  {
    question: "A patient is lying in a wet area beside a pool. Before using an AED you should:",
    options: [
      "Use it immediately where they are",
      "Move them from standing water and dry the chest",
      "Give a shock through wet clothes",
      "Avoid AED use entirely",
    ],
    correctAnswer: 1,
    explanation: "Remove the patient from water and dry the chest, then apply the pads.",
    source: { module: 3, section: "AED Special Circumstances" },
  },
  // Module 4 (4)
  {
    question: "Which statement defines the child age range for BLS?",
    options: [
      "1 year to puberty",
      "Birth to 5 years",
      "1 year to 18 years",
      "5 years to 12 years",
    ],
    correctAnswer: 0,
    explanation: "A child is 1 year to puberty. Puberty and older use adult BLS; under 1 year is an infant.",
    source: { module: 4, section: "Who Is an Infant, a Child, an Adult?" },
  },
  {
    question: "Two rescuers give CPR to an infant with no advanced airway. The ratio is:",
    options: ["30:2", "15:2", "5:1", "Continuous compressions"],
    correctAnswer: 1,
    explanation: "Two or more rescuers use 15:2 for infants and children; a lone rescuer uses 30:2.",
    source: { module: 4, section: "Infant and Child CPR Technique" },
  },
  {
    question: "You are alone with no phone. You find an infant you did not see collapse. You should first:",
    options: [
      "Leave to call for help and fetch an AED",
      "Give about 2 minutes of CPR, then activate help and fetch an AED",
      "Give compressions only for 10 minutes",
      "Shake the infant",
    ],
    correctAnswer: 1,
    explanation: "Unwitnessed arrest is often from lack of oxygen, so 2 minutes of CPR with breaths comes first when alone with no phone.",
    source: { module: 4, section: "The Lone Rescuer Sequence" },
  },
  {
    question: "Which is the preferred defibrillation option for an infant?",
    options: [
      "Adult AED pads on the front only",
      "A manual defibrillator",
      "Do not shock infants",
      "An adult dose with no pads",
    ],
    correctAnswer: 1,
    explanation: "A manual defibrillator is preferred for infants; an AED with an attenuator is next, then an AED without one.",
    source: { module: 4, section: "Pediatric AED Use" },
  },
  // Module 5 (3)
  {
    question: "A child has a pulse but is not breathing. What is the rescue breathing rate?",
    options: [
      "1 breath every 6 seconds",
      "1 breath every 2 to 3 seconds",
      "1 breath every 10 seconds",
      "2 breaths every minute",
    ],
    correctAnswer: 1,
    explanation: "Children and infants need 20 to 30 breaths per minute; adults need about 10.",
    source: { module: 5, section: "Respiratory Arrest and Rescue Breathing" },
  },
  {
    question: "Which finding most strongly suggests an opioid emergency?",
    options: [
      "Unresponsive with slow, shallow breathing and blue lips",
      "Alert and anxious with fast breathing",
      "A person coughing forcefully",
      "Chest pain with normal breathing",
    ],
    correctAnswer: 0,
    explanation: "Reduced responsiveness with slow, shallow or absent breathing and blue lips points to opioid respiratory depression.",
    source: { module: 5, section: "Recognising and Responding to an Opioid Emergency" },
  },
  {
    question: "A person in suspected opioid arrest has no pulse. What do you do?",
    options: [
      "Give naloxone and wait",
      "Start CPR, use the AED, and give naloxone if it does not interrupt CPR",
      "Place in the recovery position",
      "Give rescue breaths only",
    ],
    correctAnswer: 1,
    explanation: "Cardiac arrest needs CPR and defibrillation first. Naloxone is added only if it does not delay or interrupt CPR.",
    source: { module: 5, section: "Recognising and Responding to an Opioid Emergency" },
  },
  // Module 6 (3)
  {
    question: "An adult has severe choking. Which sequence is recommended?",
    options: [
      "Abdominal thrusts only",
      "Alternate 5 back blows and 5 abdominal thrusts",
      "Blind finger sweeps",
      "Wait and observe",
    ],
    correctAnswer: 1,
    explanation: "Adults and children alternate 5 back blows with 5 abdominal thrusts until the object clears or they become unresponsive.",
    source: { module: 6, section: "Adults and Children (1 Year to Puberty)" },
  },
  {
    question: "A late-pregnant woman is choking severely. Which thrusts do you use?",
    options: [
      "Abdominal thrusts",
      "Chest thrusts",
      "No thrusts",
      "Back blows only",
    ],
    correctAnswer: 1,
    explanation: "For pregnant or obese people, use chest thrusts instead of abdominal thrusts.",
    source: { module: 6, section: "Adults and Children (1 Year to Puberty)" },
  },
  {
    question: "A choking child can cough forcefully and cry. What is the best action?",
    options: [
      "Give abdominal thrusts",
      "Encourage coughing and stay with them",
      "Give back blows immediately",
      "Turn them upside down",
    ],
    correctAnswer: 1,
    explanation: "A forceful cough signals a mild obstruction. Do not interfere; watch closely and call for help if it worsens.",
    source: { module: 6, section: "Mild or Severe? Recognising Choking" },
  },
  // Module 7 (3)
  {
    question: "Which action improves CPR quality in a team?",
    options: [
      "Switching compressors every 10 minutes",
      "Coaching the compressor on rate, depth and recoil",
      "Pausing compressions for long preparations",
      "Giving instructions to the group without naming anyone",
    ],
    correctAnswer: 1,
    explanation: "Real-time coaching and short swaps keep compressions effective.",
    source: { module: 7, section: "CPR Quality, Switching and Debriefing" },
  },
  {
    question: "Which statement describes closed-loop communication?",
    options: [
      "The leader gives an order and walks away",
      "An instruction is repeated back and completion is reported",
      "Everyone talks at once",
      "Orders are only written down",
    ],
    correctAnswer: 1,
    explanation: "Repeat-back and reporting back confirm the message was understood and carried out.",
    source: { module: 7, section: "Roles and Closed-Loop Communication" },
  },
  {
    question: "A child is receiving CPR with an advanced airway in place. The ventilation rate is:",
    options: [
      "1 breath every 6 seconds",
      "1 breath every 2 to 3 seconds with continuous compressions",
      "2 breaths after every 30 compressions",
      "1 breath every 10 seconds",
    ],
    correctAnswer: 1,
    explanation: "With an advanced airway, compressions are continuous and children get about 20 to 30 breaths per minute.",
    source: { module: 7, section: "Ventilation With an Advanced Airway" },
  },
  // Module 8 (2)
  {
    question: "After rescuing a drowning person from the water, you should:",
    options: [
      "Give abdominal thrusts to remove water",
      "Start CPR with breaths and compressions",
      "Wait for the AED before starting",
      "Give compressions only and never breaths",
    ],
    correctAnswer: 1,
    explanation: "Drowning is a hypoxic arrest, so give both breaths and compressions and do not delay CPR for an AED.",
    source: { module: 8, section: "Drowning" },
  },
  {
    question: "In a pregnant patient with the uterus above the navel, which measure supports CPR?",
    options: [
      "Tilt the patient on her side",
      "Manual left uterine displacement",
      "Delay compressions",
      "Compress over the upper abdomen",
    ],
    correctAnswer: 1,
    explanation: "Manual left uterine displacement keeps pressure off major vessels while compressions stay effective.",
    source: { module: 8, section: "Cardiac Arrest in Pregnancy" },
  },
];
