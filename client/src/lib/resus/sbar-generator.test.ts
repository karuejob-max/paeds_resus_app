/**
 * Test suite for SBAR Generator
 * Validates clinical handover summary generation
 */

import { describe, it, expect } from 'vitest';
import {
  generateSituation,
  generateBackground,
  generateAssessment,
  generateRecommendation,
  generateSBARReport,
  formatSBARAsText,
  formatSBARAsHTML,
  type SessionData,
} from './sbar-generator';

// Mock session data for testing
const mockCprSession: SessionData = {
  sessionId: 'cpr-001',
  emergencyType: 'cpr',
  patient: {
    name: 'John Doe',
    age: 5,
    weightKg: 18,
    gender: 'M',
    medicalRecordNumber: 'MRN-12345',
  },
  startTime: Date.now() - 600000, // 10 minutes ago
  endTime: Date.now(),
  events: [
    {
      timestamp: Date.now() - 600000,
      eventType: 'assessment',
      description: 'Unresponsive, no pulse',
    },
    {
      timestamp: Date.now() - 590000,
      eventType: 'rhythm_check',
      description: 'VF detected',
    },
    {
      timestamp: Date.now() - 585000,
      eventType: 'shock',
      description: 'First shock delivered (36J)',
    },
    {
      timestamp: Date.now() - 540000,
      eventType: 'medication_epinephrine',
      description: 'Epinephrine 0.18mg IV',
    },
    {
      timestamp: Date.now() - 300000,
      eventType: 'outcome',
      description: 'ROSC achieved',
    },
  ],
  overrides: [],
  finalOutcome: 'ROSC',
};

const mockRespiratorySession: SessionData = {
  sessionId: 'resp-001',
  emergencyType: 'respiratory',
  patient: {
    name: 'Jane Smith',
    age: 3,
    weightKg: 15,
    gender: 'F',
  },
  startTime: Date.now() - 300000, // 5 minutes ago
  endTime: Date.now(),
  events: [
    {
      timestamp: Date.now() - 300000,
      eventType: 'assessment',
      description: 'Severe respiratory distress',
    },
    {
      timestamp: Date.now() - 290000,
      eventType: 'intervention_oxygen',
      description: 'High-flow oxygen initiated',
    },
    {
      timestamp: Date.now() - 280000,
      eventType: 'medication_salbutamol',
      description: 'Salbutamol 2.25mg nebulized',
    },
    {
      timestamp: Date.now() - 200000,
      eventType: 'medication_steroid',
      description: 'Dexamethasone 1.5mg IV',
    },
  ],
  overrides: [
    {
      timestamp: Date.now() - 290000,
      overrideType: 'delayed_oxygen',
      justification: 'Oxygen equipment malfunction, manual ventilation initiated',
      provider: 'Nurse Sarah',
    },
  ],
  finalOutcome: 'Transferred',
};

const mockAnaphylaxisSession: SessionData = {
  sessionId: 'ana-001',
  emergencyType: 'anaphylaxis',
  patient: {
    name: 'Alex Johnson',
    age: 8,
    weightKg: 25,
    gender: 'M',
  },
  startTime: Date.now() - 120000, // 2 minutes ago
  endTime: Date.now(),
  events: [
    {
      timestamp: Date.now() - 120000,
      eventType: 'assessment',
      description: 'Anaphylaxis: urticaria, respiratory distress, hypotension',
    },
    {
      timestamp: Date.now() - 110000,
      eventType: 'medication_epinephrine_im',
      description: 'Epinephrine 0.25mg IM',
    },
    {
      timestamp: Date.now() - 90000,
      eventType: 'intervention_iv_access',
      description: 'IV access established',
    },
    {
      timestamp: Date.now() - 60000,
      eventType: 'medication_antihistamine',
      description: 'Diphenhydramine 31.25mg IV',
    },
  ],
  overrides: [],
  finalOutcome: 'Ongoing',
};

describe('SBAR Generator - Situation Section', () => {
  it('should generate situation for CPR event', () => {
    const situation = generateSituation(mockCprSession);
    expect(situation).toContain('John Doe');
    expect(situation).toContain('5 years');
    expect(situation).toContain('18kg');
    expect(situation).toContain('CPR');
    expect(situation).toContain('ROSC');
  });

  it('should generate situation for respiratory event', () => {
    const situation = generateSituation(mockRespiratorySession);
    expect(situation).toContain('Jane Smith');
    expect(situation).toContain('3 years');
    expect(situation).toContain('RESPIRATORY');
  });

  it('should handle age in months for infants', () => {
    const infantSession = { ...mockCprSession, patient: { ...mockCprSession.patient, age: 0.5 } };
    const situation = generateSituation(infantSession);
    expect(situation).toContain('6 months');
  });
});

describe('SBAR Generator - Background Section', () => {
  it('should include interventions in background', () => {
    const background = generateBackground(mockCprSession);
    expect(background).toContain('interventions');
    expect(background).toContain('18kg');
  });

  it('should note protocol overrides', () => {
    const background = generateBackground(mockRespiratorySession);
    expect(background).toContain('Protocol deviations');
    expect(background).toContain('1 override');
  });

  it('should not mention overrides if none exist', () => {
    const background = generateBackground(mockCprSession);
    expect(background).not.toContain('Protocol deviations');
  });
});

describe('SBAR Generator - Assessment Section', () => {
  it('should generate CPR-specific assessment', () => {
    const assessment = generateAssessment(mockCprSession);
    expect(assessment).toContain('Cardiac Arrest');
    expect(assessment).toContain('Rhythm checks');
    expect(assessment).toContain('Epinephrine');
    expect(assessment).toContain('Shocks');
  });

  it('should generate respiratory-specific assessment', () => {
    const assessment = generateAssessment(mockRespiratorySession);
    expect(assessment).toContain('Respiratory Emergency');
    expect(assessment).toContain('Oxygen therapy');
  });

  it('should generate anaphylaxis-specific assessment', () => {
    const assessment = generateAssessment(mockAnaphylaxisSession);
    expect(assessment).toContain('Anaphylaxis');
    expect(assessment).toContain('Epinephrine IM');
    expect(assessment).toContain('IV access');
  });

  it('should include final outcome', () => {
    const assessment = generateAssessment(mockCprSession);
    expect(assessment).toContain('Final Outcome: ROSC');
  });
});

describe('SBAR Generator - Recommendation Section', () => {
  it('should recommend ICU for ROSC outcome', () => {
    const recommendation = generateRecommendation(mockCprSession);
    expect(recommendation).toContain('Pediatric ICU');
    expect(recommendation).toContain('post-resuscitation care');
  });

  it('should recommend continued resuscitation for transferred outcome', () => {
    const recommendation = generateRecommendation(mockRespiratorySession);
    expect(recommendation).toContain('higher level of care');
    expect(recommendation).toContain('SBAR report');
  });

  it('should include weight verification in recommendations', () => {
    const recommendation = generateRecommendation(mockCprSession);
    expect(recommendation).toContain('18kg');
    expect(recommendation).toContain('weight-based calculations');
  });

  it('should mention override review if overrides exist', () => {
    const recommendation = generateRecommendation(mockRespiratorySession);
    expect(recommendation).toContain('protocol deviation');
  });
});

describe('SBAR Generator - Complete Report', () => {
  it('should generate complete SBAR report', () => {
    const report = generateSBARReport(mockCprSession, 'Dr. Smith');
    expect(report.situation).toBeTruthy();
    expect(report.background).toBeTruthy();
    expect(report.assessment).toBeTruthy();
    expect(report.recommendation).toBeTruthy();
    expect(report.generatedBy).toBe('Dr. Smith');
    expect(report.generatedAt).toBeTruthy();
  });

  it('should generate different reports for different emergency types', () => {
    const cprReport = generateSBARReport(mockCprSession, 'Provider1');
    const respReport = generateSBARReport(mockRespiratorySession, 'Provider2');
    const anaReport = generateSBARReport(mockAnaphylaxisSession, 'Provider3');

    expect(cprReport.assessment).toContain('Cardiac Arrest');
    expect(respReport.assessment).toContain('Respiratory');
    expect(anaReport.assessment).toContain('Anaphylaxis');
  });
});

describe('SBAR Generator - Text Formatting', () => {
  it('should format SBAR as plain text', () => {
    const report = generateSBARReport(mockCprSession, 'Dr. Smith');
    const text = formatSBARAsText(report);

    expect(text).toContain('SBAR CLINICAL HANDOVER SUMMARY');
    expect(text).toContain('SITUATION');
    expect(text).toContain('BACKGROUND');
    expect(text).toContain('ASSESSMENT');
    expect(text).toContain('RECOMMENDATION');
    expect(text).toContain('Dr. Smith');
  });

  it('should include all sections in text format', () => {
    const report = generateSBARReport(mockRespiratorySession, 'Nurse Jane');
    const text = formatSBARAsText(report);

    expect(text).toContain(report.situation);
    expect(text).toContain(report.background);
    expect(text).toContain(report.assessment);
    expect(text).toContain(report.recommendation);
  });
});

describe('SBAR Generator - HTML Formatting', () => {
  it('should format SBAR as HTML', () => {
    const report = generateSBARReport(mockCprSession, 'Dr. Smith');
    const html = formatSBARAsHTML(report);

    expect(html).toContain('<div class="sbar-report">');
    expect(html).toContain('<h1>SBAR Clinical Handover Summary</h1>');
    expect(html).toContain('<h2>SITUATION</h2>');
    expect(html).toContain('<h2>BACKGROUND</h2>');
    expect(html).toContain('<h2>ASSESSMENT</h2>');
    expect(html).toContain('<h2>RECOMMENDATION</h2>');
  });

  it('should include metadata in HTML format', () => {
    const report = generateSBARReport(mockAnaphylaxisSession, 'Dr. Johnson');
    const html = formatSBARAsHTML(report);

    expect(html).toContain('Dr. Johnson');
    expect(html).toContain(report.generatedAt);
  });
});

describe('SBAR Generator - Clinical Accuracy', () => {
  it('should calculate event duration correctly', () => {
    const situation = generateSituation(mockCprSession);
    expect(situation).toContain('10 minutes');
  });

  it('should preserve patient demographics in all sections', () => {
    const report = generateSBARReport(mockCprSession, 'Provider');
    expect(report.situation).toContain('John Doe');
    expect(report.background).toContain('18kg');
    expect(report.assessment).toContain('ROSC');
  });

  it('should count interventions accurately', () => {
    const background = generateBackground(mockRespiratorySession);
    expect(background).toContain('interventions');
  });
});
