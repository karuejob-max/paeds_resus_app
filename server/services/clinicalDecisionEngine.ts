/**
 * Clinical Decision Engine for Pediatric Resuscitation
 * Based on AHA ECC Guidelines 2020-2025
 * Generates clinical recommendations based on assessment findings
 */

export interface AirwayFindings {
  responsiveness: "A" | "V" | "P" | "U";
  airwayPatency: "patent" | "at_risk" | "obstructed";
  secretions: string[];
  obstructionType?: string;
  interventionsPerformed: string[];
  reassessmentResult?: "patent" | "at_risk" | "obstructed";
}

export interface PatientParameters {
  weight: number;
  age: { years: number; months: number };
  calculatedParameters: {
    minUrineOutput: number;
    normalSystolicBP: number;
    normalHeartRateMin: number;
    normalHeartRateMax: number;
    ettSize: number;
    suctionCatheterSize: number;
  };
}

export interface ClinicalRecommendation {
  action: string;
  dosage?: string;
  rationale: string;
  priority: "critical" | "high" | "medium" | "low";
  guidelineReference: string;
}

export interface CaseAnalysis {
  guidelineCompliance: number; // 0-100%
  gaps: string[];
  recommendations: string[];
  trainingNeeded: string[];
  summary: string;
}

/**
 * Generate recommendations based on airway findings
 */
export function generateAirwayRecommendations(
  findings: AirwayFindings,
  patientParams: PatientParameters
): ClinicalRecommendation[] {
  const recommendations: ClinicalRecommendation[] = [];

  // BLS/ALS Activation
  if (findings.responsiveness === "U") {
    recommendations.push({
      action: "ACTIVATE BLS/ALS PROTOCOL",
      rationale: "Child is unresponsive (AVPU = U)",
      priority: "critical",
      guidelineReference: "AHA ECC 2020 - BLS for Children",
    });
    recommendations.push({
      action: "Start chest compressions",
      dosage: "100-120 compressions per minute",
      rationale: "Unresponsive child requires immediate CPR",
      priority: "critical",
      guidelineReference: "AHA ECC 2020 - Compression rate",
    });
    recommendations.push({
      action: "Provide rescue breathing",
      dosage: "1 breath every 6 seconds (10 breaths/min)",
      rationale: "Maintain oxygenation during CPR",
      priority: "critical",
      guidelineReference: "AHA ECC 2020 - Rescue breathing",
    });
    recommendations.push({
      action: "Attach monitor/defibrillator",
      rationale: "Identify shockable rhythms",
      priority: "critical",
      guidelineReference: "AHA ECC 2020 - Early defibrillation",
    });
    recommendations.push({
      action: "Obtain IV access",
      rationale: "Prepare for medication administration",
      priority: "high",
      guidelineReference: "AHA ECC 2020 - Vascular access",
    });
    return recommendations;
  }

  // Airway Patent and Not at Risk
  if (findings.airwayPatency === "patent") {
    recommendations.push({
      action: "Airway patent and not at risk",
      rationale: "Child can maintain airway independently",
      priority: "low",
      guidelineReference: "AHA ECC 2020 - Airway assessment",
    });
    recommendations.push({
      action: "PROCEED TO B (BREATHING ASSESSMENT)",
      rationale: "Continue systematic assessment",
      priority: "high",
      guidelineReference: "AHA ECC 2020 - Primary survey",
    });
    return recommendations;
  }

  // Airway At Risk or Obstructed
  if (findings.airwayPatency === "at_risk" || findings.airwayPatency === "obstructed") {
    // Upper Airway Obstruction (Stridor)
    if (findings.obstructionType === "upper_airway") {
      recommendations.push({
        action: "Position child upright (sitting forward)",
        rationale: "Optimize airway positioning for upper airway obstruction",
        priority: "high",
        guidelineReference: "AHA ECC 2020 - Airway positioning",
      });

      recommendations.push({
        action: "Nebulize epinephrine 1:1000",
        dosage: `${(patientParams.weight * 0.05).toFixed(2)} mL (0.05 mL/kg)`,
        rationale: "Reduces airway edema in croup/epiglottitis",
        priority: "high",
        guidelineReference: "AHA ECC 2020 - Upper airway obstruction management",
      });

      recommendations.push({
        action: "Administer corticosteroid",
        dosage: `Dexamethasone 0.6 mg/kg = ${(patientParams.weight * 0.6).toFixed(1)} mg OR Hydrocortisone 1-2 mg/kg = ${(patientParams.weight * 1).toFixed(1)}-${(patientParams.weight * 2).toFixed(1)} mg`,
        rationale: "Reduces airway inflammation",
        priority: "high",
        guidelineReference: "AHA ECC 2020 - Corticosteroid therapy",
      });

      recommendations.push({
        action: "Keep child calm, avoid agitation",
        rationale: "Agitation increases airway resistance",
        priority: "high",
        guidelineReference: "AHA ECC 2020 - Behavioral management",
      });

      recommendations.push({
        action: "Reassess in 15 minutes",
        rationale: "Monitor response to treatment",
        priority: "medium",
        guidelineReference: "AHA ECC 2020 - Reassessment protocol",
      });

      recommendations.push({
        action: "If worsening → Prepare for advanced airway",
        rationale: "May require intubation if no improvement",
        priority: "high",
        guidelineReference: "AHA ECC 2020 - Difficult airway management",
      });
    }

    // Lower Airway Obstruction (Wheeze)
    if (findings.obstructionType === "lower_airway") {
      recommendations.push({
        action: "Provide oxygen 100% FiO2",
        rationale: "Maximize oxygenation in respiratory distress",
        priority: "high",
        guidelineReference: "AHA ECC 2020 - Oxygen therapy",
      });

      // Only salbutamol if age > 2 years
      if (patientParams.age.years >= 2) {
        recommendations.push({
          action: "Nebulize salbutamol (albuterol)",
          dosage: `${(patientParams.weight * 0.15).toFixed(2)} mg (0.15 mg/kg)`,
          rationale: "Bronchodilator for lower airway obstruction/asthma",
          priority: "high",
          guidelineReference: "AHA ECC 2020 - Bronchodilator therapy",
        });
      }

      recommendations.push({
        action: "Consider ipratropium + oxygen",
        rationale: "Additional bronchodilation in severe obstruction",
        priority: "medium",
        guidelineReference: "AHA ECC 2020 - Combination therapy",
      });

      recommendations.push({
        action: "Reassess in 15 minutes",
        rationale: "Monitor response to bronchodilators",
        priority: "medium",
        guidelineReference: "AHA ECC 2020 - Reassessment protocol",
      });

      recommendations.push({
        action: "If not improving → Prepare for advanced airway",
        rationale: "May require intubation with mechanical ventilation",
        priority: "high",
        guidelineReference: "AHA ECC 2020 - Mechanical ventilation",
      });
    }

    // Foreign Body
    if (findings.obstructionType === "foreign_body") {
      recommendations.push({
        action: "Do NOT attempt blind finger sweep",
        rationale: "May lodge foreign body deeper",
        priority: "critical",
        guidelineReference: "AHA ECC 2020 - Foreign body removal",
      });

      recommendations.push({
        action: "Position child upright",
        rationale: "Optimize airway positioning",
        priority: "high",
        guidelineReference: "AHA ECC 2020 - Airway positioning",
      });

      recommendations.push({
        action: "Prepare for bronchoscopy",
        rationale: "Definitive foreign body removal",
        priority: "critical",
        guidelineReference: "AHA ECC 2020 - Airway foreign body management",
      });

      recommendations.push({
        action: "Keep NPO (nothing by mouth)",
        rationale: "Prepare for possible anesthesia",
        priority: "high",
        guidelineReference: "AHA ECC 2020 - Pre-procedure preparation",
      });

      recommendations.push({
        action: "Notify ENT/anesthesia immediately",
        rationale: "Specialist intervention required",
        priority: "critical",
        guidelineReference: "AHA ECC 2020 - Specialist consultation",
      });
    }

    // Swelling/Edema (Epiglottitis, Angioedema)
    if (findings.obstructionType === "swelling") {
      recommendations.push({
        action: "Do NOT agitate child",
        rationale: "Agitation can cause complete airway obstruction",
        priority: "critical",
        guidelineReference: "AHA ECC 2020 - Epiglottitis management",
      });

      recommendations.push({
        action: "Keep child upright",
        rationale: "Gravity assists airway patency",
        priority: "high",
        guidelineReference: "AHA ECC 2020 - Airway positioning",
      });

      recommendations.push({
        action: "Prepare for intubation (consider difficult airway)",
        rationale: "Severe swelling may make intubation difficult",
        priority: "critical",
        guidelineReference: "AHA ECC 2020 - Difficult airway",
      });

      recommendations.push({
        action: "Notify anesthesia immediately",
        rationale: "Specialist airway management required",
        priority: "critical",
        guidelineReference: "AHA ECC 2020 - Anesthesia consultation",
      });

      recommendations.push({
        action: "Have emergency tracheostomy kit available",
        rationale: "Backup airway if intubation fails",
        priority: "critical",
        guidelineReference: "AHA ECC 2020 - Emergency tracheostomy",
      });
    }

    // Secretions/Blood
    if (findings.secretions.length > 0 && findings.obstructionType === "secretions") {
      recommendations.push({
        action: "Suction airway",
        dosage: `Suction catheter size: ${patientParams.calculatedParameters.suctionCatheterSize} Fr`,
        rationale: "Remove secretions/blood obstructing airway",
        priority: "high",
        guidelineReference: "AHA ECC 2020 - Airway suctioning",
      });

      recommendations.push({
        action: "Position child on side if possible",
        rationale: "Facilitate drainage of secretions",
        priority: "medium",
        guidelineReference: "AHA ECC 2020 - Recovery position",
      });

      recommendations.push({
        action: "Reassess airway patency",
        rationale: "Verify secretions cleared",
        priority: "high",
        guidelineReference: "AHA ECC 2020 - Reassessment protocol",
      });

      recommendations.push({
        action: "If blood present → Investigate source",
        rationale: "Determine cause (trauma, epistaxis, etc.)",
        priority: "high",
        guidelineReference: "AHA ECC 2020 - Hemorrhage management",
      });
    }
  }

  return recommendations;
}

/**
 * Calculate guideline compliance score
 */
export function calculateGuidelineCompliance(
  findings: AirwayFindings,
  recommendations: ClinicalRecommendation[],
  actionsPerformed: string[]
): number {
  let score = 0;
  let totalPossible = 0;

  // Check if critical actions were performed
  const criticalRecommendations = recommendations.filter((r) => r.priority === "critical");
  const criticalActionsPerformed = criticalRecommendations.filter((r) =>
    actionsPerformed.some((a) => a.toLowerCase().includes(r.action.toLowerCase()))
  ).length;

  score += criticalActionsPerformed * 25;
  totalPossible += criticalRecommendations.length * 25;

  // Check if high priority actions were performed
  const highRecommendations = recommendations.filter((r) => r.priority === "high");
  const highActionsPerformed = highRecommendations.filter((r) =>
    actionsPerformed.some((a) => a.toLowerCase().includes(r.action.toLowerCase()))
  ).length;

  score += highActionsPerformed * 15;
  totalPossible += highRecommendations.length * 15;

  // Normalize to 0-100
  return totalPossible > 0 ? Math.min(100, (score / totalPossible) * 100) : 0;
}

/**
 * Generate case analysis
 */
export function generateCaseAnalysis(
  findings: AirwayFindings,
  patientParams: PatientParameters,
  recommendations: ClinicalRecommendation[],
  actionsPerformed: string[]
): CaseAnalysis {
  const compliance = calculateGuidelineCompliance(findings, recommendations, actionsPerformed);

  const gaps: string[] = [];
  const trainingNeeded: string[] = [];

  // Identify gaps
  recommendations.forEach((rec) => {
    if (rec.priority === "critical" || rec.priority === "high") {
      const wasPerformed = actionsPerformed.some((a) => a.toLowerCase().includes(rec.action.toLowerCase()));
      if (!wasPerformed) {
        gaps.push(`${rec.action} - ${rec.rationale}`);
        trainingNeeded.push(rec.guidelineReference);
      }
    }
  });

  // Generate summary
  let summary = "";
  if (compliance >= 90) {
    summary = "Excellent adherence to clinical guidelines. Continue current practice.";
  } else if (compliance >= 75) {
    summary = "Good adherence to guidelines. Minor improvements possible.";
  } else if (compliance >= 60) {
    summary = "Moderate adherence. Review identified gaps and complete recommended training.";
  } else {
    summary = "Significant gaps identified. Urgent training needed in critical areas.";
  }

  return {
    guidelineCompliance: Math.round(compliance),
    gaps,
    recommendations: recommendations.map((r) => `${r.action}: ${r.rationale}`),
    trainingNeeded: Array.from(new Set(trainingNeeded)), // Remove duplicates
    summary,
  };
}

/**
 * Get normal parameters for age/weight
 */
export function getNormalParameters(age: { years: number; months: number }, weight: number) {
  const totalMonths = age.years * 12 + age.months;

  return {
    minUrineOutput: weight * 1, // mL/hr
    normalSystolicBP: 90 + 2 * age.years,
    normalHeartRateMin: totalMonths < 12 ? 100 : totalMonths < 36 ? 95 : totalMonths < 72 ? 80 : 70,
    normalHeartRateMax: totalMonths < 12 ? 160 : totalMonths < 36 ? 150 : totalMonths < 72 ? 140 : 100,
    ettSize: Math.round((age.years / 4 + 4) * 10) / 10,
    suctionCatheterSize: Math.round((age.years / 4 + 4) * 2 * 10) / 10,
  };
}
