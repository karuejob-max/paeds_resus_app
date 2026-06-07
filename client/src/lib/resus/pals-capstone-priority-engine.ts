/**
 * PALS Capstone Priority Ordering Engine
 * 
 * Implements a clinical scenario where learners must sequence interventions
 * in the correct order of priority, not just select them.
 * 
 * Example: Cardiac Arrest scenario
 * - Correct order: Shout for Help → Check Pulse/Breathing → Start CPR → Attach Defib → Charge → Shock
 * - Learners must drag/arrange these in the correct sequence
 */

export type ClinicalPhase = 
  | "pat"
  | "airway"
  | "breathing"
  | "circulation"
  | "disability"
  | "exposure"
  | "sample"
  | "cardiac_arrest"
  | "post_rosc";

export interface PriorityIntervention {
  id: string;
  label: string;
  description: string;
  priority: number; // 1 = highest priority (do first)
  category: "critical" | "required" | "supportive";
}

export interface PriorityOrderingChallenge {
  phaseId: ClinicalPhase;
  title: string;
  scenario: string; // Instructor description of what's happening
  interventions: PriorityIntervention[];
  correctOrder: string[]; // Array of intervention IDs in correct sequence
  passingScore: number; // Percentage correct to pass
  feedback: {
    [interventionId: string]: string; // Why this intervention is at this priority
  };
}

export interface PriorityOrderingState {
  phaseId: ClinicalPhase;
  selectedOrder: string[]; // User's current ordering
  submitted: boolean;
  score: number | null;
  feedback: string[];
  passed: boolean;
}

/**
 * Calculate the score based on how many interventions are in the correct sequence.
 * Partial credit: if 3/5 are correct, score = 60%
 */
export function calculatePriorityScore(
  userOrder: string[],
  correctOrder: string[]
): number {
  if (correctOrder.length === 0) return 100;
  
  let correctCount = 0;
  for (let i = 0; i < Math.min(userOrder.length, correctOrder.length); i++) {
    if (userOrder[i] === correctOrder[i]) {
      correctCount++;
    }
  }
  
  return Math.round((correctCount / correctOrder.length) * 100);
}

/**
 * Generate feedback for incorrect ordering
 */
export function generatePriorityFeedback(
  userOrder: string[],
  correctOrder: string[],
  challenge: PriorityOrderingChallenge
): string[] {
  const feedback: string[] = [];
  
  for (let i = 0; i < correctOrder.length; i++) {
    const correctId = correctOrder[i];
    const userPosition = userOrder.indexOf(correctId);
    
    if (userPosition === -1) {
      feedback.push(`❌ Missing: "${challenge.interventions.find(x => x.id === correctId)?.label}" should be step ${i + 1}`);
    } else if (userPosition !== i) {
      feedback.push(`⚠️ Wrong position: "${challenge.interventions.find(x => x.id === correctId)?.label}" should be step ${i + 1}, not step ${userPosition + 1}`);
    } else {
      feedback.push(`✅ Correct: "${challenge.interventions.find(x => x.id === correctId)?.label}" at step ${i + 1}`);
    }
  }
  
  return feedback;
}

/**
 * PALS Capstone Scenarios with Priority Ordering
 */
export const PALS_PRIORITY_SCENARIOS: Record<ClinicalPhase, PriorityOrderingChallenge> = {
  pat: {
    phaseId: "pat",
    title: "PAT Assessment — Recognizing Respiratory Distress",
    scenario: "A 3-year-old arrives with increased work of breathing, retractions, and nasal flaring. Parents report 2 days of cough and fever.",
    interventions: [
      {
        id: "pat-appearance",
        label: "Assess Appearance (TICLS)",
        description: "Check tone, interactiveness, consolability, look, and speech/cry",
        priority: 1,
        category: "critical"
      },
      {
        id: "pat-wob",
        label: "Assess Work of Breathing",
        description: "Look for retractions, nasal flaring, abnormal sounds",
        priority: 2,
        category: "critical"
      },
      {
        id: "pat-circulation",
        label: "Assess Circulation to Skin",
        description: "Check for pallor, mottling, cyanosis",
        priority: 3,
        category: "critical"
      },
      {
        id: "pat-call-help",
        label: "Call for Help / Activate ERT",
        description: "Alert your team based on PAT findings",
        priority: 4,
        category: "required"
      }
    ],
    correctOrder: ["pat-appearance", "pat-wob", "pat-circulation", "pat-call-help"],
    // Shuffled for display (learners must reorder)
    shuffledOrder: ["pat-call-help", "pat-appearance", "pat-circulation", "pat-wob"],
    passingScore: 80,
    feedback: {
      "pat-appearance": "TICLS is the first visual clue to overall status",
      "pat-wob": "Work of breathing tells you if respiratory support is needed",
      "pat-circulation": "Skin signs indicate perfusion status",
      "pat-call-help": "Activate help based on your assessment findings"
    }
  },

  airway: {
    phaseId: "airway",
    title: "Airway Management — Securing the Airway",
    scenario: "The child is now in respiratory distress with stridor. You need to manage the airway.",
    interventions: [
      {
        id: "airway-position",
        label: "Position for Airway Access",
        description: "Sniffing position; shoulder roll for infants",
        priority: 1,
        category: "critical"
      },
      {
        id: "airway-clear",
        label: "Clear Airway (Suction if needed)",
        description: "Remove secretions, foreign body",
        priority: 2,
        category: "critical"
      },
      {
        id: "airway-maneuver",
        label: "Apply Airway Maneuver",
        description: "Head-tilt chin-lift or jaw thrust",
        priority: 3,
        category: "critical"
      },
      {
        id: "airway-oxygen",
        label: "Provide High-Flow Oxygen",
        description: "Non-rebreather mask or bag-mask ventilation",
        priority: 4,
        category: "required"
      }
    ],
    correctOrder: ["airway-position", "airway-clear", "airway-maneuver", "airway-oxygen"],
    // Shuffled for display
    shuffledOrder: ["airway-oxygen", "airway-maneuver", "airway-position", "airway-clear"],
    passingScore: 80,
    feedback: {
      "airway-position": "Proper positioning is the foundation of airway management",
      "airway-clear": "Clear the airway before applying maneuvers",
      "airway-maneuver": "Apply the maneuver to open the airway",
      "airway-oxygen": "Provide oxygen to improve saturation"
    }
  },

  breathing: {
    phaseId: "breathing",
    title: "Breathing Assessment — Managing Respiratory Failure",
    scenario: "Despite oxygen, the child's respiratory rate is 55 (tachypnea threshold for 3-year-old is 40). SpO₂ is 88%.",
    interventions: [
      {
        id: "breath-auscultate",
        label: "Auscultate Lung Fields",
        description: "Listen for air entry, wheeze, crackles, stridor",
        priority: 1,
        category: "critical"
      },
      {
        id: "breath-rate",
        label: "Count Respiratory Rate",
        description: "Determine if tachypnea or normal for age",
        priority: 2,
        category: "critical"
      },
      {
        id: "breath-wob",
        label: "Assess Work of Breathing",
        description: "Retractions, nasal flaring, grunting, head bobbing",
        priority: 3,
        category: "critical"
      },
      {
        id: "breath-ventilate",
        label: "Provide Bag-Mask Ventilation",
        description: "Rate: 20-30 breaths/min; ensure adequate chest rise",
        priority: 4,
        category: "required"
      },
      {
        id: "breath-capno",
        label: "Apply Capnography",
        description: "Monitor end-tidal CO₂ to guide ventilation",
        priority: 5,
        category: "supportive"
      }
    ],
    correctOrder: ["breath-auscultate", "breath-rate", "breath-wob", "breath-ventilate", "breath-capno"],
    // Shuffled for display
    shuffledOrder: ["breath-capno", "breath-ventilate", "breath-auscultate", "breath-wob", "breath-rate"],
    passingScore: 80,
    feedback: {
      "breath-auscultate": "Auscultation reveals the underlying pathology",
      "breath-rate": "Compare to age-appropriate norms",
      "breath-wob": "Increased work of breathing indicates respiratory failure",
      "breath-ventilate": "Provide ventilatory support if needed",
      "breath-capno": "Capnography confirms adequate ventilation"
    }
  },

  circulation: {
    phaseId: "circulation",
    title: "Circulation Assessment — Managing Shock",
    scenario: "HR is 140, CRT is 3 seconds, skin is mottled. The child is in compensated shock.",
    interventions: [
      {
        id: "circ-pulse",
        label: "Check Central Pulse",
        description: "Carotid or femoral; assess quality (weak vs. bounding)",
        priority: 1,
        category: "critical"
      },
      {
        id: "circ-crt",
        label: "Assess Capillary Refill Time",
        description: "Normal <2 sec (central); <3 sec (peripheral)",
        priority: 2,
        category: "critical"
      },
      {
        id: "circ-skin",
        label: "Assess Skin Perfusion",
        description: "Temperature, color, mottling",
        priority: 3,
        category: "critical"
      },
      {
        id: "circ-bp",
        label: "Measure Blood Pressure",
        description: "Note: hypotension is a LATE sign in children",
        priority: 4,
        category: "required"
      },
      {
        id: "circ-iv",
        label: "Establish IV Access",
        description: "Two large-bore IVs for fluid resuscitation",
        priority: 5,
        category: "required"
      },
      {
        id: "circ-fluid",
        label: "Administer Fluid Bolus",
        description: "20 mL/kg normal saline or Ringer's lactate over 15 min",
        priority: 6,
        category: "required"
      }
    ],
    correctOrder: ["circ-pulse", "circ-crt", "circ-skin", "circ-bp", "circ-iv", "circ-fluid"],
    // Shuffled for display
    shuffledOrder: ["circ-fluid", "circ-bp", "circ-iv", "circ-skin", "circ-pulse", "circ-crt"],
    passingScore: 80,
    feedback: {
      "circ-pulse": "Pulse quality is the first sign of shock",
      "circ-crt": "CRT >2 sec indicates poor perfusion",
      "circ-skin": "Skin signs (mottling, pallor) indicate shock",
      "circ-bp": "Remember: normal BP does NOT rule out shock in children",
      "circ-iv": "Secure access for medications and fluids",
      "circ-fluid": "First-line treatment for shock is fluid resuscitation"
    }
  },

  disability: {
    phaseId: "disability",
    title: "Disability Assessment — Neurological Status",
    scenario: "The child is now alert but confused. You need to assess neurological status.",
    interventions: [
      {
        id: "dis-avpu",
        label: "Assess AVPU",
        description: "Alert, Verbal, Pain, Unresponsive",
        priority: 1,
        category: "critical"
      },
      {
        id: "dis-pupils",
        label: "Check Pupils",
        description: "Size, equality, reactivity to light",
        priority: 2,
        category: "critical"
      },
      {
        id: "dis-glucose",
        label: "Check Blood Glucose",
        description: "ALWAYS check in altered consciousness",
        priority: 3,
        category: "critical"
      },
      {
        id: "dis-posture",
        label: "Assess Posturing",
        description: "Decorticate, decerebrate, or normal",
        priority: 4,
        category: "required"
      }
    ],
    correctOrder: ["dis-avpu", "dis-pupils", "dis-glucose", "dis-posture"],
    // Shuffled for display
    shuffledOrder: ["dis-posture", "dis-glucose", "dis-avpu", "dis-pupils"],
    passingScore: 80,
    feedback: {
      "dis-avpu": "AVPU quickly categorizes neurological status",
      "dis-pupils": "Pupil changes indicate intracranial pathology",
      "dis-glucose": "Hypoglycemia is a reversible cause of altered consciousness",
      "dis-posture": "Abnormal posturing indicates severe CNS dysfunction"
    }
  },

  exposure: {
    phaseId: "exposure",
    title: "Exposure — Full Assessment",
    scenario: "You now undress the child for full examination. You notice a petechial rash.",
    interventions: [
      {
        id: "exp-undress",
        label: "Fully Undress the Child",
        description: "Remove all clothing for complete assessment",
        priority: 1,
        category: "critical"
      },
      {
        id: "exp-rash",
        label: "Assess for Rash",
        description: "Petechiae, purpura, blanching vs. non-blanching",
        priority: 2,
        category: "critical"
      },
      {
        id: "exp-temp",
        label: "Check Temperature",
        description: "Fever or hypothermia",
        priority: 3,
        category: "required"
      },
      {
        id: "exp-injuries",
        label: "Look for Injuries/Abuse",
        description: "Bruising, fractures, signs of trauma",
        priority: 4,
        category: "required"
      },
      {
        id: "exp-prevent-loss",
        label: "Prevent Heat Loss",
        description: "Cover the child after exposure",
        priority: 5,
        category: "supportive"
      }
    ],
    correctOrder: ["exp-undress", "exp-rash", "exp-temp", "exp-injuries", "exp-prevent-loss"],
    // Shuffled for display
    shuffledOrder: ["exp-prevent-loss", "exp-injuries", "exp-undress", "exp-temp", "exp-rash"],
    passingScore: 80,
    feedback: {
      "exp-undress": "Full exposure is essential for complete assessment",
      "exp-rash": "Petechiae + fever = meningococcal sepsis until proven otherwise",
      "exp-temp": "Fever supports infectious etiology",
      "exp-injuries": "Screen for abuse or trauma",
      "exp-prevent-loss": "Prevent iatrogenic hypothermia"
    }
  },

  sample: {
    phaseId: "sample",
    title: "SAMPLE History — Focused History",
    scenario: "Parents report the child was well 3 days ago. Now: fever, cough, rash. On amoxicillin for ear infection.",
    interventions: [
      {
        id: "sample-signs",
        label: "Signs & Symptoms",
        description: "Chief complaint, onset, progression",
        priority: 1,
        category: "critical"
      },
      {
        id: "sample-allergies",
        label: "Allergies",
        description: "Drug, food, environmental",
        priority: 2,
        category: "required"
      },
      {
        id: "sample-meds",
        label: "Medications",
        description: "Current medications, doses, timing",
        priority: 3,
        category: "required"
      },
      {
        id: "sample-pmd",
        label: "Pertinent Medical History",
        description: "Chronic illness, previous surgeries, immunizations",
        priority: 4,
        category: "required"
      },
      {
        id: "sample-last-meal",
        label: "Last Meal/Drink",
        description: "Timing and contents",
        priority: 5,
        category: "supportive"
      },
      {
        id: "sample-events",
        label: "Events Leading to Illness",
        description: "Trauma, exposure, sick contacts",
        priority: 6,
        category: "required"
      }
    ],
    correctOrder: ["sample-signs", "sample-allergies", "sample-meds", "sample-pmd", "sample-last-meal", "sample-events"],
    // Shuffled for display
    shuffledOrder: ["sample-events", "sample-last-meal", "sample-signs", "sample-meds", "sample-pmd", "sample-allergies"],
    passingScore: 80,
    feedback: {
      "sample-signs": "Chief complaint guides your differential diagnosis",
      "sample-allergies": "Critical for medication selection",
      "sample-meds": "Medications may explain symptoms or guide treatment",
      "sample-pmd": "Chronic illness affects management",
      "sample-last-meal": "Important for anesthesia/airway decisions",
      "sample-events": "Identifies triggers and risk factors"
    }
  },

  cardiac_arrest: {
    phaseId: "cardiac_arrest",
    title: "Cardiac Arrest — CPR & Defibrillation",
    scenario: "The child suddenly becomes unresponsive. No pulse detected. You must initiate CPR immediately.",
    interventions: [
      {
        id: "arrest-shout",
        label: "Shout for Help & Activate ERT",
        description: "Alert your team immediately",
        priority: 1,
        category: "critical"
      },
      {
        id: "arrest-pulse",
        label: "Check Pulse & Breathing (<10 sec)",
        description: "Carotid or femoral pulse; no more than 10 seconds",
        priority: 2,
        category: "critical"
      },
      {
        id: "arrest-cpr-start",
        label: "Start Chest Compressions",
        description: "100-120 compressions/min; depth 2-2.4 inches (5-6 cm)",
        priority: 3,
        category: "critical"
      },
      {
        id: "arrest-airway",
        label: "Open Airway & Provide Ventilation",
        description: "2 ventilations after every 15 compressions (or 100:30 ratio)",
        priority: 4,
        category: "critical"
      },
      {
        id: "arrest-defib",
        label: "Attach Defibrillator Pads",
        description: "Apply pads; analyze rhythm",
        priority: 5,
        category: "critical"
      },
      {
        id: "arrest-charge",
        label: "Charge Defibrillator",
        description: "2 J/kg for first shock; 4 J/kg for subsequent shocks",
        priority: 6,
        category: "critical"
      },
      {
        id: "arrest-shock",
        label: "Deliver Shock (if Shockable Rhythm)",
        description: "Stop CPR, ensure no one touching patient, deliver shock",
        priority: 7,
        category: "critical"
      },
      {
        id: "arrest-resume",
        label: "Resume CPR Immediately",
        description: "Continue 2 min cycles; reassess rhythm every 2 min",
        priority: 8,
        category: "critical"
      },
      {
        id: "arrest-epi",
        label: "Administer Epinephrine",
        description: "0.01 mg/kg IV/IO (1:10,000); repeat every 3-5 min",
        priority: 9,
        category: "required"
      },
      {
        id: "arrest-reversible",
        label: "Identify & Treat Reversible Causes",
        description: "4 H's (Hypoxia, Hypovolemia, Hypothermia, Hyperkalemia) + 4 T's (Tension pneumo, Tamponade, Thrombosis, Toxins)",
        priority: 10,
        category: "required"
      }
    ],
    correctOrder: [
      "arrest-shout",
      "arrest-pulse",
      "arrest-cpr-start",
      "arrest-airway",
      "arrest-defib",
      "arrest-charge",
      "arrest-shock",
      "arrest-resume",
      "arrest-epi",
      "arrest-reversible"
    ],
    // Shuffled for display
    shuffledOrder: [
      "arrest-reversible",
      "arrest-shock",
      "arrest-epi",
      "arrest-shout",
      "arrest-charge",
      "arrest-cpr-start",
      "arrest-resume",
      "arrest-defib",
      "arrest-airway",
      "arrest-pulse"
    ],
    passingScore: 80,
    feedback: {
      "arrest-shout": "Early activation of help is critical",
      "arrest-pulse": "Confirm cardiac arrest before starting CPR",
      "arrest-cpr-start": "High-quality CPR is the foundation of resuscitation",
      "arrest-airway": "Maintain airway and provide ventilation",
      "arrest-defib": "Defibrillation is time-critical for shockable rhythms",
      "arrest-charge": "Correct energy dosing is essential",
      "arrest-shock": "Deliver shock for VF/pulseless VT",
      "arrest-resume": "Continuous CPR improves outcomes",
      "arrest-epi": "Epinephrine improves perfusion during CPR",
      "arrest-reversible": "Identifying and treating reversible causes is key to ROSC"
    }
  },

  post_rosc: {
    phaseId: "post_rosc",
    title: "Post-Resuscitation Care — After ROSC",
    scenario: "The child has achieved return of spontaneous circulation (ROSC). HR 120, BP 95/60, SpO₂ 98% on oxygen.",
    interventions: [
      {
        id: "rosc-airway",
        label: "Secure Airway",
        description: "Intubation if indicated; maintain SpO₂ 94-99%",
        priority: 1,
        category: "critical"
      },
      {
        id: "rosc-breathing",
        label: "Optimize Ventilation",
        description: "Target EtCO₂ 40-50 mmHg; avoid hyperventilation",
        priority: 2,
        category: "critical"
      },
      {
        id: "rosc-circulation",
        label: "Optimize Circulation",
        description: "Fluid, vasopressors if needed; target MAP >60 mmHg",
        priority: 3,
        category: "critical"
      },
      {
        id: "rosc-cooling",
        label: "Initiate Therapeutic Hypothermia",
        description: "Target 32-34°C for 12-24 hours if indicated",
        priority: 4,
        category: "required"
      },
      {
        id: "rosc-glucose",
        label: "Manage Blood Glucose",
        description: "Target 100-180 mg/dL; avoid hyperglycemia",
        priority: 5,
        category: "required"
      },
      {
        id: "rosc-seizures",
        label: "Prevent Seizures",
        description: "Prophylactic antiepileptics if indicated",
        priority: 6,
        category: "supportive"
      },
      {
        id: "rosc-icu",
        label: "Transfer to ICU",
        description: "Intensive monitoring and supportive care",
        priority: 7,
        category: "required"
      }
    ],
    correctOrder: [
      "rosc-airway",
      "rosc-breathing",
      "rosc-circulation",
      "rosc-cooling",
      "rosc-glucose",
      "rosc-seizures",
      "rosc-icu"
    ],
    // Shuffled for display
    shuffledOrder: [
      "rosc-icu",
      "rosc-glucose",
      "rosc-airway",
      "rosc-seizures",
      "rosc-breathing",
      "rosc-cooling",
      "rosc-circulation"
    ],
    passingScore: 80,
    feedback: {
      "rosc-airway": "Secure airway to protect lungs",
      "rosc-breathing": "Optimize oxygenation and ventilation",
      "rosc-circulation": "Maintain adequate perfusion",
      "rosc-cooling": "Therapeutic hypothermia improves neurological outcomes",
      "rosc-glucose": "Hyperglycemia worsens outcomes",
      "rosc-seizures": "Prophylaxis prevents secondary brain injury",
      "rosc-icu": "Intensive care is essential for recovery"
    }
  }
};
