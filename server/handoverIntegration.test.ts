import { describe, it, expect } from 'vitest';
import { extractHandoverData, formatAssessmentSummary, type AssessmentState } from '../client/src/lib/assessmentToHandover';

describe('Handover Integration', () => {
  const mockAssessment: AssessmentState = {
    patientName: 'Test Patient',
    age: 5,
    ageMonths: 6,
    weight: 18,
    gender: 'Male',
    chiefComplaint: 'Fever and difficulty breathing',
    heartRate: 140,
    respiratoryRate: 35,
    bloodPressure: '95/60',
    temperature: 39.5,
    oxygenSaturation: 88,
    glucose: 95,
    lactate: 2.5,
    consciousness: 'alert',
    breathing: 'labored',
    circulation: 'present but weak',
    airwayPatency: 'patent',
    perfusionStatus: 'poor',
    shockStatus: 'septic shock',
    seizureActivity: 'none',
    allergies: ['Penicillin'],
    currentMedications: ['Acetaminophen'],
    pastMedicalHistory: ['Asthma'],
    socialContext: 'Lives with parents',
    activeEngines: ['septic-shock', 'respiratory-failure'],
    primaryDiagnosis: 'Septic shock with respiratory compromise',
    responseToIntervention: 'stable',
  };

  describe('extractHandoverData', () => {
    it('should extract patient data correctly', () => {
      const data = extractHandoverData(mockAssessment);
      expect(data.patientName).toBe('Test Patient');
      expect(data.age).toBe(5);
      expect(data.weight).toBe(18);
      expect(data.gender).toBe('Male');
    });

    it('should extract vital signs correctly', () => {
      const data = extractHandoverData(mockAssessment);
      expect(data.heartRate).toBe(140);
      expect(data.respiratoryRate).toBe(35);
      expect(data.temperature).toBe(39.5);
      expect(data.oxygenSaturation).toBe(88);
    });

    it('should identify critical findings', () => {
      const data = extractHandoverData(mockAssessment);
      expect(data.criticalFindings.length).toBeGreaterThan(0);
      expect(
        data.criticalFindings.some((f) => f.includes('Hypoxemia') || f.includes('SpO2'))
      ).toBe(true);
    });

    it('should extract history correctly', () => {
      const data = extractHandoverData(mockAssessment);
      expect(data.allergies).toContain('Penicillin');
      expect(data.currentMedications).toContain('Acetaminophen');
      expect(data.pastMedicalHistory).toContain('Asthma');
    });

    it('should determine active engines', () => {
      const data = extractHandoverData(mockAssessment);
      expect(data.activeEngines.length).toBeGreaterThan(0);
      expect(
        data.activeEngines.includes('septic-shock') || data.activeEngines.includes('respiratory-failure')
      ).toBe(true);
    });

    it('should handle missing data gracefully', () => {
      const minimalAssessment: AssessmentState = {
        patientName: 'Patient',
        age: 3,
      };
      const data = extractHandoverData(minimalAssessment);
      expect(data.patientName).toBe('Patient');
      expect(data.age).toBe(3);
      expect(data.weight).toBeGreaterThan(0); // Should estimate weight
    });

    it('should estimate weight from age when not provided', () => {
      const assessment: AssessmentState = {
        age: 5,
        ageMonths: 0,
      };
      const data = extractHandoverData(assessment);
      expect(data.weight).toBeGreaterThan(0);
      expect(data.weight).toBeLessThan(100);
    });

    it('should extract interventions from audit trail', () => {
      const auditTrail = [
        { timestamp: Date.now(), action: 'Oxygen applied', phase: 'breathing', status: 'completed' as const },
        { timestamp: Date.now(), action: 'IV access established', phase: 'circulation', status: 'completed' as const },
        { timestamp: Date.now(), action: 'Fluid bolus pending', phase: 'circulation', status: 'pending' as const },
      ];
      const data = extractHandoverData(mockAssessment, auditTrail);
      expect(data.interventionsCompleted.length).toBe(2);
      expect(data.interventionsPending.length).toBe(1);
    });

    it('should handle shock status', () => {
      const assessment: AssessmentState = {
        ...mockAssessment,
        shockStatus: 'septic shock',
      };
      const data = extractHandoverData(assessment);
      expect(data.shockStatus).toBe('septic shock');
    });

    it('should handle seizure activity', () => {
      const assessment: AssessmentState = {
        ...mockAssessment,
        seizureActivity: 'active',
      };
      const data = extractHandoverData(assessment);
      expect(data.seizureActivity).toBe('active');
    });
  });

  describe('formatAssessmentSummary', () => {
    it('should format assessment summary as text', () => {
      const summary = formatAssessmentSummary(mockAssessment);
      expect(summary).toContain('Test Patient');
      expect(summary).toContain('5 years');
      expect(summary).toContain('18 kg');
      expect(summary).toContain('140 bpm');
    });

    it('should include vital signs in summary', () => {
      const summary = formatAssessmentSummary(mockAssessment);
      expect(summary).toContain('HR: 140');
      expect(summary).toContain('RR: 35');
      expect(summary).toContain('Temp: 39.5');
      expect(summary).toContain('SpO2: 88');
    });

    it('should include assessment findings', () => {
      const summary = formatAssessmentSummary(mockAssessment);
      expect(summary).toContain('alert');
      expect(summary).toContain('labored');
      expect(summary).toContain('present but weak');
    });

    it('should include active engines', () => {
      const summary = formatAssessmentSummary(mockAssessment);
      expect(summary).toContain('septic-shock');
    });
  });

  describe('Weight estimation', () => {
    it('should estimate weight for newborn', () => {
      const assessment: AssessmentState = { age: 0, ageMonths: 1 };
      const data = extractHandoverData(assessment);
      expect(data.weight).toBeCloseTo(3.5, 1);
    });

    it('should estimate weight for 1 year old', () => {
      const assessment: AssessmentState = { age: 1, ageMonths: 0 };
      const data = extractHandoverData(assessment);
      expect(data.weight).toBeGreaterThan(5);
      expect(data.weight).toBeLessThanOrEqual(10);
    });

    it('should estimate weight for 5 year old', () => {
      const assessment: AssessmentState = { age: 5, ageMonths: 0 };
      const data = extractHandoverData(assessment);
      expect(data.weight).toBeGreaterThan(15);
      expect(data.weight).toBeLessThan(25);
    });

    it('should estimate weight for 10 year old', () => {
      const assessment: AssessmentState = { age: 10, ageMonths: 0 };
      const data = extractHandoverData(assessment);
      expect(data.weight).toBeGreaterThan(25);
      expect(data.weight).toBeLessThan(40);
    });
  });

  describe('Critical findings identification', () => {
    it('should identify hypoxemia', () => {
      const assessment: AssessmentState = {
        ...mockAssessment,
        oxygenSaturation: 85,
      };
      const data = extractHandoverData(assessment);
      expect(
        data.criticalFindings.some((f) => f.includes('Hypoxemia') || f.includes('SpO2'))
      ).toBe(true);
    });

    it('should identify abnormal respiratory rate', () => {
      const assessment: AssessmentState = {
        ...mockAssessment,
        respiratoryRate: 50,
      };
      const data = extractHandoverData(assessment);
      expect(
        data.criticalFindings.some((f) => f.includes('respiratory rate'))
      ).toBe(true);
    });

    it('should identify poor perfusion', () => {
      const assessment: AssessmentState = {
        ...mockAssessment,
        perfusionStatus: 'poor',
      };
      const data = extractHandoverData(assessment);
      expect(
        data.criticalFindings.some((f) => f.includes('perfusion'))
      ).toBe(true);
    });

    it('should identify altered consciousness', () => {
      const assessment: AssessmentState = {
        ...mockAssessment,
        consciousness: 'altered',
      };
      const data = extractHandoverData(assessment);
      expect(
        data.criticalFindings.some((f) => f.includes('consciousness') || f.includes('Altered') || f.includes('altered'))
      ).toBe(true);
    });

    it('should identify severe hypoglycemia', () => {
      const assessment: AssessmentState = {
        ...mockAssessment,
        glucose: 35,
      };
      const data = extractHandoverData(assessment);
      expect(
        data.criticalFindings.some((f) => f.includes('hypoglycemia'))
      ).toBe(true);
    });

    it('should identify abnormal temperature', () => {
      const assessment: AssessmentState = {
        ...mockAssessment,
        temperature: 41,
      };
      const data = extractHandoverData(assessment);
      expect(
        data.criticalFindings.some((f) => f.includes('temperature'))
      ).toBe(true);
    });
  });
});
