/**
 * Predictive Integration Module
 * 
 * Integrates PEWS alerts into existing clinical emergency flows
 */

import { PredictiveEngine, type VitalSigns, type PEWSScore, type TrendAnalysis } from './predictive-engine';
import { ClinicalDataStore } from '@/lib/offline/indexed-db';

export interface PredictiveContext {
  sessionId: string;
  patientAge: number;
  patientWeight: number;
  emergencyType: string;
  lastPEWSScore?: PEWSScore;
  lastTrendAnalysis?: TrendAnalysis;
  escalationTriggered: boolean;
  escalationTime?: number;
}

export class PredictiveIntegration {
  private engines: Map<string, PredictiveEngine> = new Map();
  private contexts: Map<string, PredictiveContext> = new Map();
  private store: ClinicalDataStore;
  private alertCallbacks: Array<(alert: PredictiveAlert) => void> = [];

  constructor() {
    this.store = new ClinicalDataStore();
  }

  /**
   * Initialize predictive context for a session
   */
  public initializeSession(
    sessionId: string,
    patientAge: number,
    patientWeight: number,
    emergencyType: string
  ): void {
    const engine = new PredictiveEngine();
    this.engines.set(sessionId, engine);

    this.contexts.set(sessionId, {
      sessionId,
      patientAge,
      patientWeight,
      emergencyType,
      escalationTriggered: false,
    });
  }

  /**
   * Update vital signs and trigger PEWS calculation
   */
  public async updateVitals(
    sessionId: string,
    vitals: VitalSigns,
    interventions: string[] = [],
    notes: string = ''
  ): Promise<PredictiveAlert | null> {
    const engine = this.engines.get(sessionId);
    const context = this.contexts.get(sessionId);

    if (!engine || !context) {
      console.error(`Session ${sessionId} not found`);
      return null;
    }

    // Calculate PEWS
    const pewsScore = engine.calculatePEWS(vitals, context.patientAge);
    context.lastPEWSScore = pewsScore;

    // Add to trend
    engine.addTrend(vitals, interventions, notes);

    // Analyze trend
    const trendAnalysis = engine.analyzeTrend(context.patientAge);
    context.lastTrendAnalysis = trendAnalysis;

    // Store in local database
    await this.store.saveClinicalData({
      sessionId,
      type: 'assessment',
      data: {
        vitals,
        pewsScore: pewsScore.score,
        severity: pewsScore.severity,
        trendDirection: trendAnalysis.direction,
      },
      timestamp: Date.now(),
      synced: false,
      syncAttempts: 0,
    });

    // Generate alert if needed
    const alert = this.generateAlert(sessionId, pewsScore, trendAnalysis, context);

    if (alert) {
      this.notifyAlertCallbacks(alert);
    }

    return alert;
  }

  /**
   * Generate predictive alert
   */
  private generateAlert(
    sessionId: string,
    pewsScore: PEWSScore,
    trendAnalysis: TrendAnalysis,
    context: PredictiveContext
  ): PredictiveAlert | null {
    const alert: PredictiveAlert = {
      sessionId,
      timestamp: Date.now(),
      severity: pewsScore.severity,
      pewsScore: pewsScore.score,
      trendDirection: trendAnalysis.direction,
      riskFactors: pewsScore.riskFactors,
      recommendations: pewsScore.recommendations,
      timeToEscalation: trendAnalysis.timeToEscalation,
      shouldEscalate: false,
    };

    // Determine if escalation is needed
    if (pewsScore.severity === 'red') {
      alert.shouldEscalate = true;
      alert.escalationReason = 'Critical PEWS score (8+)';

      if (!context.escalationTriggered) {
        context.escalationTriggered = true;
        context.escalationTime = Date.now();
      }
    } else if (
      pewsScore.severity === 'orange' &&
      trendAnalysis.direction === 'deteriorating' &&
      trendAnalysis.timeToEscalation !== undefined &&
      trendAnalysis.timeToEscalation < 15
    ) {
      alert.shouldEscalate = true;
      alert.escalationReason = `Rapid deterioration - escalate in ${trendAnalysis.timeToEscalation} min`;
    } else if (
      pewsScore.severity === 'yellow' &&
      trendAnalysis.direction === 'deteriorating' &&
      pewsScore.riskFactors.length > 2
    ) {
      alert.shouldEscalate = true;
      alert.escalationReason = 'Multiple risk factors with deteriorating trend';
    }

    // Only return alert if escalation is needed or severity changed
    if (alert.shouldEscalate || pewsScore.severity !== 'green') {
      return alert;
    }

    return null;
  }

  /**
   * Get current PEWS for session
   */
  public getCurrentPEWS(sessionId: string): PEWSScore | undefined {
    const context = this.contexts.get(sessionId);
    return context?.lastPEWSScore;
  }

  /**
   * Get current trend analysis
   */
  public getCurrentTrend(sessionId: string): TrendAnalysis | undefined {
    const context = this.contexts.get(sessionId);
    return context?.lastTrendAnalysis;
  }

  /**
   * Get trend history for visualization
   */
  public getTrendHistory(sessionId: string): { scores: number[]; timestamps: number[] } {
    const engine = this.engines.get(sessionId);
    if (!engine) {
      return { scores: [], timestamps: [] };
    }

    const history = engine.getTrendHistory();
    const context = this.contexts.get(sessionId);

    if (!context) {
      return { scores: [], timestamps: [] };
    }

    const scores = history.map(t => engine.calculatePEWS(t.vitals, context.patientAge).score);
    const timestamps = history.map(t => t.timestamp);

    return { scores, timestamps };
  }

  /**
   * Register alert callback
   */
  public onAlert(callback: (alert: PredictiveAlert) => void): () => void {
    this.alertCallbacks.push(callback);

    return () => {
      this.alertCallbacks = this.alertCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify alert callbacks
   */
  private notifyAlertCallbacks(alert: PredictiveAlert): void {
    this.alertCallbacks.forEach(callback => callback(alert));
  }

  /**
   * Close session
   */
  public async closeSession(sessionId: string): Promise<void> {
    this.engines.delete(sessionId);
    this.contexts.delete(sessionId);
  }

  /**
   * Get all active sessions
   */
  public getActiveSessions(): string[] {
    return Array.from(this.contexts.keys());
  }
}

/**
 * Predictive Alert Interface
 */
export interface PredictiveAlert {
  sessionId: string;
  timestamp: number;
  severity: 'green' | 'yellow' | 'orange' | 'red';
  pewsScore: number;
  trendDirection: 'improving' | 'stable' | 'deteriorating';
  riskFactors: string[];
  recommendations: string[];
  timeToEscalation?: number;
  shouldEscalate: boolean;
  escalationReason?: string;
}

/**
 * React hook for predictive integration
 */
export function usePredictiveIntegration() {
  const integration = new PredictiveIntegration();

  return {
    initializeSession: (sessionId: string, age: number, weight: number, type: string) =>
      integration.initializeSession(sessionId, age, weight, type),
    updateVitals: (sessionId: string, vitals: VitalSigns, interventions?: string[], notes?: string) =>
      integration.updateVitals(sessionId, vitals, interventions, notes),
    getCurrentPEWS: (sessionId: string) => integration.getCurrentPEWS(sessionId),
    getCurrentTrend: (sessionId: string) => integration.getCurrentTrend(sessionId),
    getTrendHistory: (sessionId: string) => integration.getTrendHistory(sessionId),
    onAlert: (callback: (alert: PredictiveAlert) => void) => integration.onAlert(callback),
    closeSession: (sessionId: string) => integration.closeSession(sessionId),
    getActiveSessions: () => integration.getActiveSessions(),
  };
}

/**
 * Integration with CPR Clock
 */
export function integratePredictiveWithCPR(
  integration: PredictiveIntegration,
  sessionId: string,
  compressionRate: number,
  ventilationRate: number,
  lastShockTime?: number
): void {
  // Track CPR quality metrics
  const interventions: string[] = [];

  if (compressionRate > 0) {
    interventions.push(`Compressions: ${compressionRate}/min`);
  }

  if (ventilationRate > 0) {
    interventions.push(`Ventilations: ${ventilationRate}/min`);
  }

  if (lastShockTime) {
    const timeSinceShock = Date.now() - lastShockTime;
    if (timeSinceShock < 60000) {
      interventions.push('Recent shock delivered');
    }
  }

  // Store CPR metrics
  // This would be called periodically during CPR
}

/**
 * Integration with Respiratory Flows
 */
export function integratePredictiveWithRespiratory(
  integration: PredictiveIntegration,
  sessionId: string,
  oxygenSaturation: number,
  respiratoryRate: number,
  workOfBreathing: 'normal' | 'mild' | 'moderate' | 'severe'
): void {
  const interventions: string[] = [];

  if (oxygenSaturation < 90) {
    interventions.push('Hypoxia detected - oxygen therapy initiated');
  }

  if (workOfBreathing === 'severe') {
    interventions.push('Severe respiratory distress - consider intubation');
  }

  // Store respiratory metrics
}

/**
 * Integration with Anaphylaxis Flows
 */
export function integratePredictiveWithAnaphylaxis(
  integration: PredictiveIntegration,
  sessionId: string,
  skinManifestations: boolean,
  respiratorySymptoms: boolean,
  cardiovascularSymptoms: boolean
): void {
  const interventions: string[] = [];

  if (cardiovascularSymptoms) {
    interventions.push('Cardiovascular compromise - IM epinephrine given');
  }

  if (respiratorySymptoms) {
    interventions.push('Respiratory involvement - monitor airway');
  }

  // Store anaphylaxis metrics
}
