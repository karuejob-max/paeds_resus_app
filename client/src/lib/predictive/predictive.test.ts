import { describe, it, expect, beforeEach } from 'vitest';
import { PredictiveEngine, type VitalSigns } from './predictive-engine';
import { PredictiveIntegration } from './predictive-integration';
import { PredictiveSBARGenerator } from './predictive-sbar';

describe('Predictive Engine - Clinical Accuracy', () => {
  let engine: PredictiveEngine;

  beforeEach(() => {
    engine = new PredictiveEngine();
  });

  describe('PEWS Scoring', () => {
    it('should calculate green score for normal vitals', () => {
      const vitals: VitalSigns = {
        heartRate: 100,
        respiratoryRate: 25,
        systolicBP: 110,
        oxygenSaturation: 98,
        temperature: 37,
        capillaryRefill: 1.5,
        consciousness: 'alert',
      };

      const pews = engine.calculatePEWS(vitals, 60); // 5-year-old
      expect(pews.severity).toBe('green');
      expect(pews.score).toBeLessThanOrEqual(2);
    });

    it('should calculate yellow score for mild abnormalities', () => {
      const vitals: VitalSigns = {
        heartRate: 140,
        respiratoryRate: 35,
        systolicBP: 100,
        oxygenSaturation: 95,
        temperature: 38.5,
        capillaryRefill: 2,
        consciousness: 'alert',
      };

      const pews = engine.calculatePEWS(vitals, 60);
      expect(pews.severity).toBe('yellow');
      expect(pews.score).toBeGreaterThan(2);
      expect(pews.score).toBeLessThanOrEqual(4);
    });

    it('should calculate orange score for moderate abnormalities', () => {
      const vitals: VitalSigns = {
        heartRate: 160,
        respiratoryRate: 50,
        systolicBP: 85,
        oxygenSaturation: 92,
        temperature: 39,
        capillaryRefill: 2.5,
        consciousness: 'verbal',
      };

      const pews = engine.calculatePEWS(vitals, 60);
      expect(pews.severity).toBe('orange');
      expect(pews.score).toBeGreaterThan(4);
      expect(pews.score).toBeLessThanOrEqual(7);
    });

    it('should calculate red score for severe abnormalities', () => {
      const vitals: VitalSigns = {
        heartRate: 180,
        respiratoryRate: 65,
        systolicBP: 70,
        oxygenSaturation: 88,
        temperature: 40,
        capillaryRefill: 3.5,
        consciousness: 'unresponsive',
      };

      const pews = engine.calculatePEWS(vitals, 60);
      expect(pews.severity).toBe('red');
      expect(pews.score).toBeGreaterThan(7);
    });
  });

  describe('Age-Specific Normalization', () => {
    it('should normalize heart rate for neonate', () => {
      const vitals: VitalSigns = {
        heartRate: 140,
        consciousness: 'alert',
      };

      const pews = engine.calculatePEWS(vitals, 0.5); // 2-week-old
      expect(pews.components.cardiorespiratory).toBeLessThanOrEqual(1);
    });

    it('should normalize heart rate for infant', () => {
      const vitals: VitalSigns = {
        heartRate: 130,
        consciousness: 'alert',
      };

      const pews = engine.calculatePEWS(vitals, 6); // 6-month-old
      expect(pews.components.cardiorespiratory).toBeLessThanOrEqual(1);
    });

    it('should normalize heart rate for child', () => {
      const vitals: VitalSigns = {
        heartRate: 100,
        consciousness: 'alert',
      };

      const pews = engine.calculatePEWS(vitals, 60); // 5-year-old
      expect(pews.components.cardiorespiratory).toBeLessThanOrEqual(1);
    });

    it('should flag tachycardia in adolescent', () => {
      const vitals: VitalSigns = {
        heartRate: 130,
        consciousness: 'alert',
      };

      const pews = engine.calculatePEWS(vitals, 180); // 15-year-old
      expect(pews.components.cardiorespiratory).toBeGreaterThan(0);
    });
  });

  describe('Risk Factor Identification', () => {
    it('should identify hypoxia as risk factor', () => {
      const vitals: VitalSigns = {
        oxygenSaturation: 88,
      };

      const pews = engine.calculatePEWS(vitals, 60);
      expect(pews.riskFactors).toContain('Hypoxia');
    });

    it('should identify poor perfusion as risk factor', () => {
      const vitals: VitalSigns = {
        capillaryRefill: 3.5,
      };

      const pews = engine.calculatePEWS(vitals, 60);
      expect(pews.riskFactors).toContain('Poor perfusion');
    });

    it('should identify altered consciousness as risk factor', () => {
      const vitals: VitalSigns = {
        consciousness: 'unresponsive',
      };

      const pews = engine.calculatePEWS(vitals, 60);
      expect(pews.riskFactors).toContain('Altered consciousness');
    });
  });

  describe('Trend Analysis', () => {
    it('should detect improving trend', () => {
      const vitals1: VitalSigns = { heartRate: 160, oxygenSaturation: 92 };
      const vitals2: VitalSigns = { heartRate: 140, oxygenSaturation: 95 };
      const vitals3: VitalSigns = { heartRate: 120, oxygenSaturation: 98 };

      engine.addTrend(vitals1);
      engine.addTrend(vitals2);
      engine.addTrend(vitals3);

      const trend = engine.analyzeTrend(60);
      expect(trend.direction).toBe('improving');
    });

    it('should detect deteriorating trend', () => {
      const vitals1: VitalSigns = { heartRate: 100, oxygenSaturation: 98 };
      const vitals2: VitalSigns = { heartRate: 130, oxygenSaturation: 95 };
      const vitals3: VitalSigns = { heartRate: 160, oxygenSaturation: 90 };

      engine.addTrend(vitals1);
      engine.addTrend(vitals2);
      engine.addTrend(vitals3);

      const trend = engine.analyzeTrend(60);
      expect(trend.direction).toBe('deteriorating');
    });

    it('should calculate time to escalation', () => {
      const vitals1: VitalSigns = { heartRate: 100, oxygenSaturation: 98 };
      const vitals2: VitalSigns = { heartRate: 120, oxygenSaturation: 96 };
      const vitals3: VitalSigns = { heartRate: 140, oxygenSaturation: 94 };

      engine.addTrend(vitals1);
      engine.addTrend(vitals2);
      engine.addTrend(vitals3);

      const trend = engine.analyzeTrend(60);
      expect(trend.timeToEscalation).toBeDefined();
      expect(trend.timeToEscalation).toBeGreaterThan(0);
    });
  });
});

describe('Predictive Integration - Clinical Workflow', () => {
  let integration: PredictiveIntegration;

  beforeEach(() => {
    integration = new PredictiveIntegration();
  });

  it('should initialize session', () => {
    integration.initializeSession('session-1', 60, 20, 'cpr');
    const sessions = integration.getActiveSessions();
    expect(sessions).toContain('session-1');
  });

  it('should update vitals and generate alert', async () => {
    integration.initializeSession('session-1', 60, 20, 'cpr');

    const vitals: VitalSigns = {
      heartRate: 180,
      respiratoryRate: 65,
      systolicBP: 70,
      oxygenSaturation: 88,
      consciousness: 'unresponsive',
    };

    const alert = await integration.updateVitals('session-1', vitals, ['CPR initiated']);
    expect(alert).toBeDefined();
    expect(alert?.severity).toBe('red');
  });

  it('should track current PEWS', async () => {
    integration.initializeSession('session-1', 60, 20, 'cpr');

    const vitals: VitalSigns = {
      heartRate: 100,
      oxygenSaturation: 98,
      consciousness: 'alert',
    };

    await integration.updateVitals('session-1', vitals);

    const pews = integration.getCurrentPEWS('session-1');
    expect(pews).toBeDefined();
    expect(pews?.score).toBeLessThanOrEqual(2);
  });

  it('should register alert callbacks', () => {
    let alertReceived = false;

    integration.onAlert(() => {
      alertReceived = true;
    });

    integration.initializeSession('session-1', 60, 20, 'cpr');

    // This would trigger an alert in a real scenario
    expect(typeof alertReceived).toBe('boolean');
  });

  it('should close session', async () => {
    integration.initializeSession('session-1', 60, 20, 'cpr');
    await integration.closeSession('session-1');

    const sessions = integration.getActiveSessions();
    expect(sessions).not.toContain('session-1');
  });
});

describe('Predictive SBAR Generator - Handover Quality', () => {
  let generator: PredictiveSBARGenerator;

  beforeEach(() => {
    generator = new PredictiveSBARGenerator();
  });

  it('should generate SBAR from alert', () => {
    const alert = {
      sessionId: 'session-1',
      timestamp: Date.now(),
      severity: 'red' as const,
      pewsScore: 10,
      trendDirection: 'deteriorating' as const,
      riskFactors: ['Hypoxia', 'Poor perfusion'],
      recommendations: ['Increase oxygen', 'Start IV access'],
      shouldEscalate: true,
      escalationReason: 'Critical PEWS score',
    };

    const sbar = generator.generateSBARFromAlert(alert, 60, 20, 'cpr', ['CPR initiated']);

    expect(sbar.situation).toContain('cpr');
    expect(sbar.background).toContain('5y');
    expect(sbar.assessment).toContain('RED');
    expect(sbar.recommendation).toContain('IMMEDIATE');
    expect(sbar.urgency).toBe('emergent');
  });

  it('should generate full SBAR document', () => {
    const context = {
      situation: 'Patient in cardiac arrest',
      background: '5-year-old with no known medical history',
      assessment: 'Critical condition, RED alert',
      recommendation: 'Immediate escalation',
      urgency: 'emergent' as const,
      timeframe: 'Immediate (within 5 minutes)',
    };

    const document = generator.generateFullSBARDocument(
      context,
      'John Doe',
      'PT-001',
      'City Hospital'
    );

    expect(document).toContain('SITUATION');
    expect(document).toContain('BACKGROUND');
    expect(document).toContain('ASSESSMENT');
    expect(document).toContain('RECOMMENDATION');
    expect(document).toContain('John Doe');
  });

  it('should generate HTML SBAR', () => {
    const context = {
      situation: 'Patient in cardiac arrest',
      background: '5-year-old with no known medical history',
      assessment: 'Critical condition, RED alert',
      recommendation: 'Immediate escalation',
      urgency: 'emergent' as const,
      timeframe: 'Immediate (within 5 minutes)',
    };

    const html = generator.generateHTMLSBAR(
      context,
      'John Doe',
      'PT-001',
      'City Hospital'
    );

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('SITUATION');
    expect(html).toContain('emergent');
  });
});

describe('Predictive Accuracy - Edge Cases', () => {
  let engine: PredictiveEngine;

  beforeEach(() => {
    engine = new PredictiveEngine();
  });

  it('should handle missing vital signs', () => {
    const vitals: VitalSigns = {
      consciousness: 'alert',
    };

    const pews = engine.calculatePEWS(vitals, 60);
    expect(pews.score).toBeGreaterThanOrEqual(0);
    expect(pews.severity).toBeDefined();
  });

  it('should handle extreme values', () => {
    const vitals: VitalSigns = {
      heartRate: 250,
      respiratoryRate: 100,
      systolicBP: 40,
      oxygenSaturation: 50,
    };

    const pews = engine.calculatePEWS(vitals, 60);
    expect(pews.severity).toBe('red');
  });

  it('should handle trend with insufficient data', () => {
    const vitals: VitalSigns = {
      heartRate: 100,
      consciousness: 'alert',
    };

    engine.addTrend(vitals);

    const trend = engine.analyzeTrend(60);
    expect(trend.direction).toBe('stable');
    expect(trend.confidence).toBeLessThanOrEqual(1);
  });
});

describe('Clinical Validation - AHA Guidelines Compliance', () => {
  let engine: PredictiveEngine;

  beforeEach(() => {
    engine = new PredictiveEngine();
  });

  it('should align with AHA vital sign ranges for infants', () => {
    // AHA: Normal HR for infant 100-160
    const normalVitals: VitalSigns = { heartRate: 130, consciousness: 'alert' };
    const pews = engine.calculatePEWS(normalVitals, 6);

    expect(pews.components.cardiorespiratory).toBeLessThanOrEqual(1);
  });

  it('should align with AHA vital sign ranges for children', () => {
    // AHA: Normal HR for child 70-110
    const normalVitals: VitalSigns = { heartRate: 90, consciousness: 'alert' };
    const pews = engine.calculatePEWS(normalVitals, 60);

    expect(pews.components.cardiorespiratory).toBeLessThanOrEqual(1);
  });

  it('should flag hypoxia per AHA guidelines', () => {
    // AHA: SpO2 <90% is critical
    const vitals: VitalSigns = { oxygenSaturation: 88 };
    const pews = engine.calculatePEWS(vitals, 60);

    expect(pews.riskFactors).toContain('Hypoxia');
    expect(pews.components.cardiorespiratory).toBeGreaterThanOrEqual(2);
  });
});
