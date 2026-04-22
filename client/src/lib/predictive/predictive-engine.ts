/**
 * Predictive Scoring Engine for Early Warning Alerts
 * 
 * Implements Pediatric Early Warning Score (PEWS) and trend analysis
 * to predict clinical deterioration and guide proactive escalation
 */

export interface VitalSigns {
  heartRate?: number;
  respiratoryRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  oxygenSaturation?: number;
  temperature?: number;
  capillaryRefill?: number;
  consciousness?: 'alert' | 'verbal' | 'pain' | 'unresponsive';
  urinOutput?: number;
}

export interface ClinicalTrend {
  timestamp: number;
  vitals: VitalSigns;
  interventions: string[];
  assessmentNotes: string;
}

export interface PEWSScore {
  score: number;
  severity: 'green' | 'yellow' | 'orange' | 'red';
  components: {
    behavior: number;
    cardiorespiratory: number;
    perfusion: number;
  };
  riskFactors: string[];
  recommendations: string[];
}

export interface TrendAnalysis {
  direction: 'improving' | 'stable' | 'deteriorating';
  rate: number; // Change per minute
  confidence: number; // 0-1
  predictedNextScore: number;
  timeToEscalation?: number; // Minutes until red alert
}

export class PredictiveEngine {
  private trends: ClinicalTrend[] = [];
  private maxTrendLength: number = 60; // Keep last 60 minutes

  /**
   * Calculate PEWS score based on vital signs
   */
  public calculatePEWS(vitals: VitalSigns, patientAge: number): PEWSScore {
    const components = {
      behavior: this.scoreBehavior(vitals.consciousness),
      cardiorespiratory: this.scoreCardiorespiratory(vitals, patientAge),
      perfusion: this.scorePerfusion(vitals, patientAge),
    };

    const score = components.behavior + components.cardiorespiratory + components.perfusion;
    const severity = this.determineSeverity(score);
    const riskFactors = this.identifyRiskFactors(vitals, patientAge);
    const recommendations = this.generateRecommendations(severity, riskFactors);

    return {
      score,
      severity,
      components,
      riskFactors,
      recommendations,
    };
  }

  /**
   * Score behavior component
   */
  private scoreBehavior(consciousness?: string): number {
    switch (consciousness) {
      case 'alert':
        return 0;
      case 'verbal':
        return 1;
      case 'pain':
        return 2;
      case 'unresponsive':
        return 3;
      default:
        return 0;
    }
  }

  /**
   * Score cardiorespiratory component
   */
  private scoreCardiorespiratory(vitals: VitalSigns, patientAge: number): number {
    let score = 0;

    // Heart rate assessment
    if (vitals.heartRate !== undefined) {
      const ageRange = this.getAgeRange(patientAge);
      const normalHR = this.getNormalHeartRate(ageRange);

      if (vitals.heartRate > normalHR.max * 1.3) {
        score += 2; // Significant tachycardia
      } else if (vitals.heartRate > normalHR.max) {
        score += 1; // Mild tachycardia
      } else if (vitals.heartRate < normalHR.min * 0.8) {
        score += 2; // Bradycardia
      }
    }

    // Respiratory rate assessment
    if (vitals.respiratoryRate !== undefined) {
      const ageRange = this.getAgeRange(patientAge);
      const normalRR = this.getNormalRespiratoryRate(ageRange);

      if (vitals.respiratoryRate > normalRR.max * 1.3) {
        score += 2; // Significant tachypnea
      } else if (vitals.respiratoryRate > normalRR.max) {
        score += 1; // Mild tachypnea
      } else if (vitals.respiratoryRate < normalRR.min) {
        score += 2; // Bradypnea
      }
    }

    // Oxygen saturation
    if (vitals.oxygenSaturation !== undefined) {
      if (vitals.oxygenSaturation < 90) {
        score += 3; // Severe hypoxia
      } else if (vitals.oxygenSaturation < 94) {
        score += 2; // Moderate hypoxia
      } else if (vitals.oxygenSaturation < 97) {
        score += 1; // Mild hypoxia
      }
    }

    return Math.min(score, 6); // Cap at 6
  }

  /**
   * Score perfusion component
   */
  private scorePerfusion(vitals: VitalSigns, patientAge: number): number {
    let score = 0;

    // Capillary refill
    if (vitals.capillaryRefill !== undefined) {
      if (vitals.capillaryRefill > 3) {
        score += 3; // Severe delay
      } else if (vitals.capillaryRefill > 2) {
        score += 2; // Moderate delay
      } else if (vitals.capillaryRefill > 1.5) {
        score += 1; // Mild delay
      }
    }

    // Blood pressure assessment
    if (vitals.systolicBP !== undefined) {
      const ageRange = this.getAgeRange(patientAge);
      const normalBP = this.getNormalBloodPressure(ageRange);

      if (vitals.systolicBP < normalBP.systolic * 0.7) {
        score += 3; // Severe hypotension
      } else if (vitals.systolicBP < normalBP.systolic * 0.85) {
        score += 2; // Moderate hypotension
      } else if (vitals.systolicBP < normalBP.systolic) {
        score += 1; // Mild hypotension
      }
    }

    // Urine output
    if (vitals.urinOutput !== undefined) {
      if (vitals.urinOutput < 0.5) {
        score += 2; // Oliguria
      } else if (vitals.urinOutput < 1) {
        score += 1; // Reduced urine output
      }
    }

    return Math.min(score, 6); // Cap at 6
  }

  /**
   * Determine severity based on PEWS score
   */
  private determineSeverity(score: number): 'green' | 'yellow' | 'orange' | 'red' {
    if (score <= 2) return 'green';
    if (score <= 4) return 'yellow';
    if (score <= 7) return 'orange';
    return 'red';
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(vitals: VitalSigns, patientAge: number): string[] {
    const factors: string[] = [];

    if (vitals.heartRate && vitals.heartRate > 180) {
      factors.push('Severe tachycardia');
    }

    if (vitals.respiratoryRate && vitals.respiratoryRate > 60) {
      factors.push('Severe tachypnea');
    }

    if (vitals.oxygenSaturation && vitals.oxygenSaturation < 90) {
      factors.push('Hypoxia');
    }

    if (vitals.capillaryRefill && vitals.capillaryRefill > 3) {
      factors.push('Poor perfusion');
    }

    if (vitals.consciousness === 'unresponsive') {
      factors.push('Altered consciousness');
    }

    if (vitals.temperature && (vitals.temperature < 35 || vitals.temperature > 39)) {
      factors.push('Abnormal temperature');
    }

    return factors;
  }

  /**
   * Generate recommendations based on severity
   */
  private generateRecommendations(severity: string, riskFactors: string[]): string[] {
    const recommendations: string[] = [];

    if (severity === 'red') {
      recommendations.push('IMMEDIATE escalation to ICU');
      recommendations.push('Activate rapid response team');
      recommendations.push('Prepare for advanced interventions');
    } else if (severity === 'orange') {
      recommendations.push('Notify senior clinician');
      recommendations.push('Increase monitoring frequency');
      recommendations.push('Prepare for potential escalation');
    } else if (severity === 'yellow') {
      recommendations.push('Increase monitoring');
      recommendations.push('Reassess in 15 minutes');
      recommendations.push('Document clinical findings');
    }

    // Add specific recommendations based on risk factors
    if (riskFactors.includes('Hypoxia')) {
      recommendations.push('Optimize oxygen delivery');
      recommendations.push('Consider respiratory support');
    }

    if (riskFactors.includes('Poor perfusion')) {
      recommendations.push('Assess fluid status');
      recommendations.push('Consider vasopressor support');
    }

    return recommendations;
  }

  /**
   * Add vital signs to trend
   */
  public addTrend(vitals: VitalSigns, interventions: string[] = [], notes: string = ''): void {
    this.trends.push({
      timestamp: Date.now(),
      vitals,
      interventions,
      assessmentNotes: notes,
    });

    // Maintain max trend length
    if (this.trends.length > this.maxTrendLength) {
      this.trends = this.trends.slice(-this.maxTrendLength);
    }
  }

  /**
   * Analyze trend for deterioration
   */
  public analyzeTrend(patientAge: number): TrendAnalysis {
    if (this.trends.length < 2) {
      return {
        direction: 'stable',
        rate: 0,
        confidence: 0,
        predictedNextScore: 0,
      };
    }

    const recentTrends = this.trends.slice(-10); // Last 10 readings
    const scores = recentTrends.map(t => this.calculatePEWS(t.vitals, patientAge).score);

    const direction = this.determineDirection(scores);
    const rate = this.calculateChangeRate(scores);
    const confidence = this.calculateConfidence(scores);
    const predictedNextScore = this.predictNextScore(scores);
    const timeToEscalation = this.calculateTimeToEscalation(scores, rate);

    return {
      direction,
      rate,
      confidence,
      predictedNextScore,
      timeToEscalation,
    };
  }

  /**
   * Determine trend direction
   */
  private determineDirection(scores: number[]): 'improving' | 'stable' | 'deteriorating' {
    if (scores.length < 2) return 'stable';

    const recent = scores.slice(-5);
    const older = scores.slice(-10, -5);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const change = recentAvg - olderAvg;

    if (change > 1) return 'deteriorating';
    if (change < -1) return 'improving';
    return 'stable';
  }

  /**
   * Calculate rate of change
   */
  private calculateChangeRate(scores: number[]): number {
    if (scores.length < 2) return 0;

    const recent = scores[scores.length - 1];
    const previous = scores[scores.length - 2];
    const timeGap = 1; // Assuming 1-minute intervals

    return (recent - previous) / timeGap;
  }

  /**
   * Calculate confidence in trend
   */
  private calculateConfidence(scores: number[]): number {
    if (scores.length < 3) return 0;

    // Calculate variance
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Lower variance = higher confidence
    return Math.max(0, 1 - stdDev / 5);
  }

  /**
   * Predict next PEWS score
   */
  private predictNextScore(scores: number[]): number {
    if (scores.length < 2) return scores[scores.length - 1] || 0;

    const recent = scores.slice(-5);
    const trend = recent[recent.length - 1] - recent[0];
    const avgChange = trend / (recent.length - 1);

    return Math.max(0, scores[scores.length - 1] + avgChange);
  }

  /**
   * Calculate time to escalation
   */
  private calculateTimeToEscalation(scores: number[], rate: number): number | undefined {
    const currentScore = scores[scores.length - 1];
    const escalationThreshold = 8; // Red alert threshold

    if (currentScore >= escalationThreshold) {
      return 0; // Already at escalation
    }

    if (rate <= 0) {
      return undefined; // Not deteriorating
    }

    const minutesToEscalation = (escalationThreshold - currentScore) / rate;
    return Math.max(0, Math.round(minutesToEscalation));
  }

  /**
   * Helper: Get age range category
   */
  private getAgeRange(ageMonths: number): string {
    if (ageMonths < 1) return 'neonate';
    if (ageMonths < 12) return 'infant';
    if (ageMonths < 60) return 'toddler';
    if (ageMonths < 144) return 'child';
    return 'adolescent';
  }

  /**
   * Helper: Get normal heart rate range
   */
  private getNormalHeartRate(ageRange: string): { min: number; max: number } {
    const ranges: Record<string, { min: number; max: number }> = {
      neonate: { min: 120, max: 160 },
      infant: { min: 100, max: 160 },
      toddler: { min: 90, max: 150 },
      child: { min: 70, max: 110 },
      adolescent: { min: 60, max: 100 },
    };
    return ranges[ageRange] || { min: 60, max: 100 };
  }

  /**
   * Helper: Get normal respiratory rate range
   */
  private getNormalRespiratoryRate(ageRange: string): { min: number; max: number } {
    const ranges: Record<string, { min: number; max: number }> = {
      neonate: { min: 40, max: 60 },
      infant: { min: 30, max: 60 },
      toddler: { min: 24, max: 40 },
      child: { min: 20, max: 30 },
      adolescent: { min: 12, max: 20 },
    };
    return ranges[ageRange] || { min: 12, max: 20 };
  }

  /**
   * Helper: Get normal blood pressure range
   */
  private getNormalBloodPressure(ageRange: string): { systolic: number; diastolic: number } {
    const ranges: Record<string, { systolic: number; diastolic: number }> = {
      neonate: { systolic: 60, diastolic: 30 },
      infant: { systolic: 95, diastolic: 65 },
      toddler: { systolic: 100, diastolic: 65 },
      child: { systolic: 105, diastolic: 70 },
      adolescent: { systolic: 120, diastolic: 80 },
    };
    return ranges[ageRange] || { systolic: 120, diastolic: 80 };
  }

  /**
   * Get trend history
   */
  public getTrendHistory(): ClinicalTrend[] {
    return [...this.trends];
  }

  /**
   * Clear trends
   */
  public clearTrends(): void {
    this.trends = [];
  }
}

/**
 * React hook for predictive engine
 */
export function usePredictiveEngine(patientAge: number) {
  const engine = new PredictiveEngine();

  return {
    calculatePEWS: (vitals: VitalSigns) => engine.calculatePEWS(vitals, patientAge),
    addTrend: (vitals: VitalSigns, interventions?: string[], notes?: string) =>
      engine.addTrend(vitals, interventions, notes),
    analyzeTrend: () => engine.analyzeTrend(patientAge),
    getTrendHistory: () => engine.getTrendHistory(),
    clearTrends: () => engine.clearTrends(),
  };
}
