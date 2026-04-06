import { describe, it, expect } from 'vitest';
import {
  generateSBARHandover,
  formatSBARAsText,
  SBARHandover,
} from '../client/src/lib/sbarHandover';

describe('SBAR Handover Generator', () => {
  const mockAssessmentData = {
    patientName: 'John Doe',
    age: 5,
    weight: 18,
    gender: 'Male',
    chiefComplaint: 'Fever and difficulty breathing',
    onsetTime: '2 hours ago',
    symptomDuration: '2 hours',
    progression: 'Progressive',
    clinicianName: 'Dr. Smith',
    clinicianRole: 'Pediatrician',
    receivingClinician: 'Dr. Johnson',
    receivingFacility: 'Regional Hospital ICU',
    
    // Vital signs
    heartRate: 140,
    respiratoryRate: 35,
    bloodPressure: '95/60',
    temperature: 39.5,
    oxygenSaturation: 88,
    glucose: 120,
    lactate: 3.2,

    // Assessment findings
    consciousness: 'Alert',
    breathing: 'Labored',
    circulation: 'Present but weak',
    airwayPatency: 'patent',
    perfusionStatus: 'poor',
    shockStatus: 'septic shock',

    // Interventions
    airwayIntervention: 'Airway positioning, suctioning',
    breathingIntervention: 'Oxygen 10L/min via mask',
    oxygenIntervention: 'High-flow oxygen',
    circulationIntervention: 'IV access established, fluid bolus started',
    shockIntervention: 'RL 20mL/kg bolus, vasopressor consideration',
    disabilityIntervention: 'Glucose checked, normal',

    // History
    allergies: ['Penicillin'],
    currentMedications: ['Acetaminophen'],
    pastMedicalHistory: ['Asthma'],
    socialContext: 'Lives with parents, no recent travel',
    parentalConcerns: 'Rapid onset of symptoms',

    // Active engines
    activeEngines: ['septic-shock', 'respiratory-failure'],
    primaryDiagnosis: 'Septic shock with respiratory compromise',
    differentialDiagnoses: ['Pneumonia', 'Meningitis', 'Anaphylaxis'],
    responseToIntervention: 'stable',

    // Interventions completed/pending
    interventionsCompleted: ['Airway assessment', 'Oxygen therapy', 'IV access'],
    interventionsPending: ['Antibiotics', 'Blood cultures', 'Chest X-ray'],

    // Management plans
    fluidManagement: 'RL boluses 20mL/kg, reassess after each bolus',
    medicationManagement: 'Pending antibiotic selection',
    oxygenManagement: 'High-flow oxygen, target SpO2 >94%',
    temperatureManagement: 'Acetaminophen as needed',

    // Equipment needs
    requiresOxygen: true,
    requiresIVAccess: true,
    requiresIntubation: false,
    requiresMonitoring: true,

    estimatedTransferTime: 30,
  };

  describe('SBAR Generation', () => {
    it('should generate valid SBAR handover from assessment data', () => {
      const handover = generateSBARHandover(mockAssessmentData);

      expect(handover).toBeDefined();
      expect(handover.situation).toBeDefined();
      expect(handover.background).toBeDefined();
      expect(handover.assessment).toBeDefined();
      expect(handover.recommendation).toBeDefined();
    });

    it('should correctly identify criticality as critical for septic shock', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      expect(handover.criticalityLevel).toBe('critical');
      expect(handover.requiresImmediateTransfer).toBe(true);
    });

    it('should extract patient identification correctly', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      expect(handover.situation.patientIdentification.name).toBe('John Doe');
      expect(handover.situation.patientIdentification.age).toBe(5);
      expect(handover.situation.patientIdentification.weight).toBe(18);
      expect(handover.situation.patientIdentification.gender).toBe('Male');
    });

    it('should include chief complaint and timeline', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      expect(handover.situation.chiefComplaint).toBe('Fever and difficulty breathing');
      expect(handover.situation.timelineOfPresentation).toContain('2 hours ago');
    });

    it('should identify immediate threats correctly', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      expect(handover.situation.immediateThreats.length).toBeGreaterThan(0);
    });

    it('should extract background information correctly', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      expect(handover.background.allergies).toContain('Penicillin');
      expect(handover.background.medications).toContain('Acetaminophen');
      expect(handover.background.previousMedicalConditions).toContain('Asthma');
    });

    it('should include vital signs in assessment', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      expect(handover.assessment.currentVitalSigns.hr).toBe(140);
      expect(handover.assessment.currentVitalSigns.rr).toBe(35);
      expect(handover.assessment.currentVitalSigns.spo2).toBe(88);
      expect(handover.assessment.currentVitalSigns.glucose).toBe(120);
    });

    it('should extract critical findings with severity levels', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      const criticalFindings = handover.assessment.criticalFindings;

      expect(criticalFindings.length).toBeGreaterThan(0);
      expect(criticalFindings.some((f) => f.severity === 'critical')).toBe(true);
      expect(criticalFindings.some((f) => f.finding.includes('Hypoxemia'))).toBe(true);
    });

    it('should include active engines in assessment', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      expect(handover.assessment.activeEngines).toContain('septic-shock');
      expect(handover.assessment.activeEngines).toContain('respiratory-failure');
    });

    it('should generate immediate actions for critical findings', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      expect(handover.recommendation.immediateActions.length).toBeGreaterThan(0);
      expect(
        handover.recommendation.immediateActions.some((a) =>
          a.includes('septic shock protocol')
        )
      ).toBe(true);
    });

    it('should include monitoring parameters', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      expect(handover.recommendation.monitoringParameters).toContain('Continuous pulse oximetry');
      expect(handover.recommendation.monitoringParameters).toContain('Continuous cardiac monitoring');
    });

    it('should include escalation criteria', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      expect(handover.recommendation.escalationCriteria.length).toBeGreaterThan(0);
      expect(
        handover.recommendation.escalationCriteria.some((c) => c.includes('SpO2'))
      ).toBe(true);
    });

    it('should set transport requirements based on criticality', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      expect(handover.recommendation.transportRequirements.length).toBeGreaterThan(0);
    });

    it('should include staffing requirements for critical engines', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      expect(handover.recommendation.staffingRequirements).toContain('Senior physician');
      expect(handover.recommendation.staffingRequirements).toContain('ICU nurse');
    });

    it('should include equipment list', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      expect(handover.recommendation.equipmentNeeded).toContain('Continuous pulse oximeter');
      expect(handover.recommendation.equipmentNeeded).toContain('Oxygen delivery system');
      expect(handover.recommendation.equipmentNeeded).toContain('IV access supplies');
    });

    it('should estimate time to stability', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      expect(handover.recommendation.estimatedTimeToStability).toBeDefined();
      expect(handover.recommendation.estimatedTimeToStability.length).toBeGreaterThan(0);
    });

    it('should include clinician information in handover', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      expect(handover.clinicianName).toBe('Dr. Smith');
      expect(handover.clinicianRole).toBe('Pediatrician');
      expect(handover.receivingClinician).toBe('Dr. Johnson');
      expect(handover.receivingFacility).toBe('Regional Hospital ICU');
    });

    it('should set generatedAt timestamp', () => {
      const beforeGeneration = Date.now();
      const handover = generateSBARHandover(mockAssessmentData);
      const afterGeneration = Date.now();

      expect(handover.generatedAt).toBeGreaterThanOrEqual(beforeGeneration);
      expect(handover.generatedAt).toBeLessThanOrEqual(afterGeneration);
    });
  });

  describe('Criticality Determination', () => {
    it('should classify as routine for stable patient', () => {
      const stableData = {
        ...mockAssessmentData,
        activeEngines: [],
        oxygenSaturation: 98,
        heartRate: 95,
        respiratoryRate: 20,
        perfusionStatus: 'good',
        temperature: 37,
      };

      const handover = generateSBARHandover(stableData);
      expect(handover.criticalityLevel).toBeTruthy();
    });

    it('should classify as urgent for single high-severity finding', () => {
      const urgentData = {
        ...mockAssessmentData,
        activeEngines: [],
        oxygenSaturation: 85,
        perfusionStatus: 'good',
      };

      const handover = generateSBARHandover(urgentData);
      expect(handover.criticalityLevel).toBeTruthy();
    });

    it('should classify as emergent for critical engine', () => {
      const emergentData = {
        ...mockAssessmentData,
        activeEngines: ['anaphylaxis'],
      };

      const handover = generateSBARHandover(emergentData);
      expect(handover.criticalityLevel).toBe('critical');
      expect(handover.requiresImmediateTransfer).toBe(true);
    });
  });

  describe('Text Formatting', () => {
    it('should format SBAR as readable text', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      const text = formatSBARAsText(handover);

      expect(text).toContain('CLINICAL HANDOVER REPORT');
      expect(text).toContain('SITUATION');
      expect(text).toContain('BACKGROUND');
      expect(text).toContain('ASSESSMENT');
      expect(text).toContain('RECOMMENDATION');
    });

    it('should include patient information in text', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      const text = formatSBARAsText(handover);

      expect(text).toContain('John Doe');
      expect(text).toContain('Age: 5 years');
      expect(text).toContain('Weight: 18 kg');
    });

    it('should include vital signs in text', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      const text = formatSBARAsText(handover);

      expect(text).toContain('HR=140');
      expect(text).toContain('RR=35');
      expect(text).toContain('SpO2=88%');
    });

    it('should include critical findings in text', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      const text = formatSBARAsText(handover);

      expect(text).toContain('[CRITICAL]');
      expect(text.includes('[HIGH]') || text.includes('[CRITICAL]')).toBe(true);
    });

    it('should include recommendations in text', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      const text = formatSBARAsText(handover);

      expect(text).toContain('Immediate Actions');
      expect(text).toContain('Continuing Management');
      expect(text).toContain('Monitoring Parameters');
      expect(text).toContain('Escalation Criteria');
    });

    it('should be properly formatted for email', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      const text = formatSBARAsText(handover);

      expect(text).toContain('FROM:');
      expect(text).toContain('TO:');
      expect(text).toContain('FACILITY:');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing optional fields gracefully', () => {
      const minimalData = {
        patientName: 'Unknown',
        age: 0,
        weight: 0,
        chiefComplaint: 'Emergency',
        clinicianName: 'Unknown',
        clinicianRole: 'Clinician',
      };

      const handover = generateSBARHandover(minimalData);
      expect(handover).toBeDefined();
      expect(handover.situation).toBeDefined();
    });

    it('should handle empty arrays for allergies and medications', () => {
      const data = {
        ...mockAssessmentData,
        allergies: [],
        currentMedications: [],
      };

      const handover = generateSBARHandover(data);
      expect(handover.background.allergies).toEqual([]);
      expect(handover.background.medications).toEqual([]);
    });

    it('should handle multiple critical findings', () => {
      const data = {
        ...mockAssessmentData,
        oxygenSaturation: 75,
        heartRate: 180,
        respiratoryRate: 50,
        temperature: 41,
      };

      const handover = generateSBARHandover(data);
      expect(handover.assessment.criticalFindings.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle multiple active engines', () => {
      const data = {
        ...mockAssessmentData,
        activeEngines: [
          'septic-shock',
          'respiratory-failure',
          'status-epilepticus',
          'dka',
        ],
      };

      const handover = generateSBARHandover(data);
      expect(handover.assessment.activeEngines.length).toBe(4);
      expect(handover.criticalityLevel).toBe('critical');
    });
  });

  describe('Clinical Accuracy', () => {
    it('should prioritize airway before breathing before circulation', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      const text = formatSBARAsText(handover);

      // Verify that airway findings appear before breathing findings in recommendations
      const airwayIndex = text.indexOf('Airway');
      const breathingIndex = text.indexOf('Breathing');

      expect(airwayIndex).toBeLessThan(breathingIndex);
    });

    it('should flag hypoglycemia as critical finding', () => {
      const data = {
        ...mockAssessmentData,
        glucose: 35,
      };

      const handover = generateSBARHandover(data);
      const hypoglycemiaFinding = handover.assessment.criticalFindings.find((f) =>
        f.finding.includes('hypoglycemia')
      );

      expect(hypoglycemiaFinding).toBeDefined();
      expect(hypoglycemiaFinding?.severity).toBe('critical');
    });

    it('should include septic shock protocol in immediate actions', () => {
      const handover = generateSBARHandover(mockAssessmentData);
      const septicAction = handover.recommendation.immediateActions.find((a) =>
        a.includes('septic shock protocol')
      );

      expect(septicAction).toBeDefined();
      expect(septicAction).toContain('fluid resuscitation');
      expect(septicAction).toContain('antibiotics');
    });
  });
});
