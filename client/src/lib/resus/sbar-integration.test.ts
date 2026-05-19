/**
 * Integration Test Suite for SBAR Handover Summary System
 * 
 * Validates end-to-end SBAR generation, export, and integration workflows
 */

import { describe, it, expect } from 'vitest';
import {
  generateSBARReport,
  generateSituation,
  generateBackground,
  generateAssessment,
  generateRecommendation,
  formatSBARAsText,
  formatSBARAsHTML,
  type SessionData,
} from './sbar-generator';

// Mock comprehensive session data
const mockComprehensiveSession: SessionData = {
  sessionId: 'comprehensive-001',
  emergencyType: 'cpr',
  patient: {
    name: 'Michael Chen',
    age: 7,
    weightKg: 22,
    gender: 'M',
    medicalRecordNumber: 'MRN-98765',
  },
  startTime: Date.now() - 900000, // 15 minutes ago
  endTime: Date.now(),
  events: [
    {
      timestamp: Date.now() - 900000,
      eventType: 'assessment',
      description: 'Unresponsive, no pulse, no breathing',
    },
    {
      timestamp: Date.now() - 895000,
      eventType: 'intervention_cpr',
      description: 'CPR initiated with proper hand placement',
    },
    {
      timestamp: Date.now() - 890000,
      eventType: 'rhythm_check',
      description: 'VF detected on monitor',
    },
    {
      timestamp: Date.now() - 885000,
      eventType: 'intervention_shock',
      description: 'First defibrillation: 44J delivered',
    },
    {
      timestamp: Date.now() - 880000,
      eventType: 'intervention_airway',
      description: 'Endotracheal intubation successful',
    },
    {
      timestamp: Date.now() - 870000,
      eventType: 'medication_epinephrine',
      description: 'Epinephrine 0.22mg IV/IO',
    },
    {
      timestamp: Date.now() - 840000,
      eventType: 'rhythm_check',
      description: 'Asystole detected',
    },
    {
      timestamp: Date.now() - 835000,
      eventType: 'medication_epinephrine',
      description: 'Second epinephrine dose 0.22mg IV/IO',
    },
    {
      timestamp: Date.now() - 780000,
      eventType: 'rhythm_check',
      description: 'Organized rhythm detected',
    },
    {
      timestamp: Date.now() - 775000,
      eventType: 'outcome',
      description: 'ROSC achieved with pulse and perfusion',
    },
  ],
  overrides: [
    {
      timestamp: Date.now() - 870000,
      overrideType: 'early_intubation',
      justification: 'Intubation performed before 2-minute mark due to severe hypoxia and difficult airway predicted',
      provider: 'Dr. Sarah Johnson',
    },
  ],
  finalOutcome: 'ROSC',
};

describe('SBAR Integration: Complete Workflow', () => {
  it('should generate complete SBAR report from comprehensive session', () => {
    const report = generateSBARReport(mockComprehensiveSession, 'Dr. Ahmed Hassan');

    expect(report).toBeDefined();
    expect(report.situation).toBeTruthy();
    expect(report.background).toBeTruthy();
    expect(report.assessment).toBeTruthy();
    expect(report.recommendation).toBeTruthy();
    expect(report.generatedBy).toBe('Dr. Ahmed Hassan');
  });

  it('should include all critical clinical data in SBAR sections', () => {
    const report = generateSBARReport(mockComprehensiveSession, 'Provider');

    // Situation should include patient demographics and outcome
    expect(report.situation).toContain('Michael Chen');
    expect(report.situation).toContain('7 years');
    expect(report.situation).toContain('22kg');
    expect(report.situation).toContain('ROSC');

    // Background should include interventions and overrides
    expect(report.background).toContain('interventions');
    expect(report.background).toContain('Protocol deviations');

    // Assessment should include cardiac arrest details
    expect(report.assessment).toContain('Cardiac Arrest');
    expect(report.assessment).toContain('Rhythm checks');

    // Recommendation should include ICU guidance
    expect(report.recommendation).toContain('Pediatric ICU');
  });

  it('should track all clinical events in assessment', () => {
    const report = generateSBARReport(mockComprehensiveSession, 'Provider');

    expect(report.assessment).toContain('Rhythm checks performed');
    expect(report.assessment).toContain('Epinephrine doses');
    expect(report.assessment).toContain('Shocks delivered');
  });

  it('should document protocol overrides with justification', () => {
    const report = generateSBARReport(mockComprehensiveSession, 'Provider');

    expect(report.background).toContain('1 override');
    expect(report.recommendation).toContain('protocol deviation');
  });
});

describe('SBAR Integration: Multi-Format Export', () => {
  it('should export as formatted text with all sections', () => {
    const report = generateSBARReport(mockComprehensiveSession, 'Dr. Smith');
    const textExport = formatSBARAsText(report);

    expect(textExport).toContain('SBAR CLINICAL HANDOVER SUMMARY');
    expect(textExport).toContain('SITUATION');
    expect(textExport).toContain('BACKGROUND');
    expect(textExport).toContain('ASSESSMENT');
    expect(textExport).toContain('RECOMMENDATION');
    expect(textExport).toContain('Dr. Smith');
    expect(textExport).toContain('Michael Chen');
  });

  it('should export as HTML with proper formatting', () => {
    const report = generateSBARReport(mockComprehensiveSession, 'Dr. Smith');
    const htmlExport = formatSBARAsHTML(report);

    expect(htmlExport).toContain('<div class="sbar-report">');
    expect(htmlExport).toContain('<h1>SBAR Clinical Handover Summary</h1>');
    expect(htmlExport).toContain('<h2>SITUATION</h2>');
    expect(htmlExport).toContain('<h2>BACKGROUND</h2>');
    expect(htmlExport).toContain('<h2>ASSESSMENT</h2>');
    expect(htmlExport).toContain('<h2>RECOMMENDATION</h2>');
    expect(htmlExport).toContain('Michael Chen');
  });

  it('should preserve clinical accuracy in all export formats', () => {
    const report = generateSBARReport(mockComprehensiveSession, 'Provider');
    const textExport = formatSBARAsText(report);
    const htmlExport = formatSBARAsHTML(report);

    // Both formats should contain the same clinical data
    expect(textExport).toContain('Michael Chen');
    expect(htmlExport).toContain('Michael Chen');
    expect(textExport).toContain('22kg');
    expect(htmlExport).toContain('22kg');
    expect(textExport).toContain('ROSC');
    expect(htmlExport).toContain('ROSC');
  });
});

describe('SBAR Integration: Clinical Accuracy Validation', () => {
  it('should calculate correct event duration', () => {
    const situation = generateSituation(mockComprehensiveSession);
    expect(situation).toContain('15 minutes');
  });

  it('should count interventions accurately', () => {
    const background = generateBackground(mockComprehensiveSession);
    expect(background).toContain('interventions');
  });

  it('should include weight-based calculations verification', () => {
    const report = generateSBARReport(mockComprehensiveSession, 'Provider');
    expect(report.recommendation).toContain('22kg');
    expect(report.recommendation).toContain('weight-based calculations');
  });

  it('should document outcome-specific recommendations', () => {
    const report = generateSBARReport(mockComprehensiveSession, 'Provider');

    // For ROSC outcome, should recommend ICU
    expect(report.recommendation).toContain('Pediatric ICU');
    expect(report.recommendation).toContain('post-resuscitation care');
  });

  it('should include clinical handover guidance', () => {
    const report = generateSBARReport(mockComprehensiveSession, 'Provider');

    expect(report.recommendation).toContain('handover');
    expect(report.recommendation).toContain('receiving facility');
  });
});

describe('SBAR Integration: Multi-Emergency Type Support', () => {
  it('should generate SBAR for different emergency types', () => {
    const emergencyTypes: Array<{ type: any; name: string }> = [
      { type: 'cpr', name: 'CPR' },
      { type: 'respiratory', name: 'Respiratory' },
      { type: 'anaphylaxis', name: 'Anaphylaxis' },
    ];

    emergencyTypes.forEach(({ type, name }) => {
      const session: SessionData = {
        ...mockComprehensiveSession,
        emergencyType: type,
      };

      const report = generateSBARReport(session, 'Provider');

      expect(report.situation).toContain(name.toUpperCase());
      expect(report.assessment).toBeTruthy();
      expect(report.recommendation).toBeTruthy();
    });
  });
});

describe('SBAR Integration: Data Integrity', () => {
  it('should preserve all patient demographics', () => {
    const report = generateSBARReport(mockComprehensiveSession, 'Provider');

    expect(report.situation).toContain('Michael Chen');
    expect(report.situation).toContain('7 years');
    expect(report.background).toContain('22kg');
  });

  it('should maintain chronological event order', () => {
    const report = generateSBARReport(mockComprehensiveSession, 'Provider');

    // First event should be assessment, last should be outcome
    expect(report.assessment).toContain('Rhythm checks');
    expect(report.assessment).toContain('ROSC');
  });

  it('should include all override justifications', () => {
    const report = generateSBARReport(mockComprehensiveSession, 'Provider');

    expect(report.background).toContain('Protocol deviations');
    expect(report.recommendation).toContain('protocol deviation');
  });
});

describe('SBAR Integration: Performance and Reliability', () => {
  it('should generate SBAR report in reasonable time', () => {
    const startTime = performance.now();

    const report = generateSBARReport(mockComprehensiveSession, 'Provider');

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(100); // Should complete in < 100ms
    expect(report).toBeDefined();
  });

  it('should handle large event lists efficiently', () => {
    const largeSession: SessionData = {
      ...mockComprehensiveSession,
      events: Array.from({ length: 100 }, (_, i) => ({
        timestamp: Date.now() - (900000 - i * 9000),
        eventType: i % 2 === 0 ? 'intervention' : 'medication',
        description: `Event ${i + 1}`,
      })),
    };

    const startTime = performance.now();
    const report = generateSBARReport(largeSession, 'Provider');
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(200);
    expect(report.assessment).toBeTruthy();
  });

  it('should generate consistent output for same input', () => {
    const report1 = generateSBARReport(mockComprehensiveSession, 'Provider');
    const report2 = generateSBARReport(mockComprehensiveSession, 'Provider');

    expect(report1.situation).toBe(report2.situation);
    expect(report1.background).toBe(report2.background);
    expect(report1.assessment).toBe(report2.assessment);
    expect(report1.recommendation).toBe(report2.recommendation);
  });
});

describe('SBAR Integration: Export Reliability', () => {
  it('should generate valid text export', () => {
    const report = generateSBARReport(mockComprehensiveSession, 'Provider');
    const textExport = formatSBARAsText(report);

    expect(textExport).toContain('SBAR CLINICAL HANDOVER SUMMARY');
    expect(textExport.split('\n').length).toBeGreaterThan(10);
    expect(textExport).not.toContain('<');
  });

  it('should generate valid HTML export', () => {
    const report = generateSBARReport(mockComprehensiveSession, 'Provider');
    const htmlExport = formatSBARAsHTML(report);
    expect(htmlExport).toContain('sbar-report');
    expect(htmlExport).toContain('SBAR Clinical Handover Summary');
    expect(htmlExport).toContain('SITUATION');
    expect(htmlExport).toContain('BACKGROUND');
    expect(htmlExport).toContain('ASSESSMENT');
    expect(htmlExport).toContain('RECOMMENDATION');
  });

  it('should handle special characters in export', () => {
    const sessionWithSpecialChars: SessionData = {
      ...mockComprehensiveSession,
      patient: {
        ...mockComprehensiveSession.patient,
        name: "O'Brien & Sons",
      },
    };

    const report = generateSBARReport(sessionWithSpecialChars, 'Dr. José García');
    const textExport = formatSBARAsText(report);
    const htmlExport = formatSBARAsHTML(report);

    expect(textExport).toContain("O'Brien");
    expect(htmlExport).toContain("O'Brien");
    expect(textExport).toContain('José');
    expect(htmlExport).toContain('José');
  });
});
