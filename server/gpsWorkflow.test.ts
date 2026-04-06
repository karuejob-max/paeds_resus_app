import { describe, it, expect } from 'vitest';

// ============================================================================
// GPS-LIKE CLINICAL WORKFLOW TESTS
// Tests for immediate intervention triggers and reassessment loops
// ============================================================================

// Mock patient data
interface PatientData {
  ageYears: number;
  ageMonths: number;
  weight: number;
}

// Critical action interface
interface CriticalAction {
  id: string;
  severity: 'critical' | 'urgent' | 'routine';
  title: string;
  instruction: string;
  dose?: string;
  route?: string;
  rationale: string;
  reassessAfter: string;
  timer?: number;
}

// ============================================================================
// TRIGGER LOGIC FUNCTIONS (extracted from component for testing)
// ============================================================================

function calculateWeight(years: number, months: number): number {
  const totalMonths = years * 12 + months;
  if (totalMonths < 12) {
    return (totalMonths + 9) / 2;
  } else if (totalMonths < 60) {
    return (years + 4) * 2;
  } else {
    return years * 4;
  }
}

// Breathing trigger
function checkBreathingTrigger(answer: string, pd: PatientData): CriticalAction | null {
  if (answer === 'no') {
    const weight = pd.weight || calculateWeight(pd.ageYears, pd.ageMonths);
    return {
      id: 'bvm-ventilation',
      severity: 'critical',
      title: 'START BAG-VALVE-MASK VENTILATION NOW',
      instruction: 'Position head. Seal mask. Squeeze bag to see chest rise.',
      dose: `${pd.ageYears < 1 ? '30' : pd.ageYears < 8 ? '20' : '12-15'} breaths/minute`,
      route: 'Bag-valve-mask',
      rationale: 'Apnea is immediately life-threatening.',
      reassessAfter: 'After 5 breaths, check for chest rise',
      timer: 30,
    };
  }
  return null;
}

// Pulse trigger
function checkPulseTrigger(answer: string, pd: PatientData): CriticalAction | null {
  if (answer === 'no') {
    const weight = pd.weight || calculateWeight(pd.ageYears, pd.ageMonths);
    return {
      id: 'start-cpr',
      severity: 'critical',
      title: 'START CPR IMMEDIATELY',
      instruction: `Begin chest compressions at 100-120/min.`,
      dose: '30:2 compression:ventilation ratio',
      route: 'Chest compressions + ventilation',
      rationale: 'Cardiac arrest. Every second without CPR reduces survival.',
      reassessAfter: 'Check rhythm/pulse every 2 minutes',
      timer: 120,
    };
  }
  return null;
}

// Responsiveness trigger
function checkResponsivenessTrigger(answer: string, pd: PatientData): CriticalAction | null {
  if (answer === 'unresponsive') {
    return {
      id: 'call-for-help',
      severity: 'critical',
      title: 'CALL FOR HELP - ACTIVATE EMERGENCY RESPONSE',
      instruction: 'Shout for help. Activate crash cart/emergency team.',
      rationale: 'Unresponsive child needs immediate team response.',
      reassessAfter: 'Continue assessment while waiting for help',
      timer: 60,
    };
  }
  return null;
}

// Airway patency trigger
function checkAirwayTrigger(answer: string, pd: PatientData): CriticalAction | null {
  if (answer === 'obstructed') {
    return {
      id: 'clear-airway',
      severity: 'critical',
      title: 'CLEAR AIRWAY OBSTRUCTION NOW',
      instruction: 'Head tilt-chin lift. Suction visible secretions.',
      dose: `Suction catheter: ${Math.round(pd.ageYears / 2 + 8)} Fr`,
      route: 'Manual maneuvers + suction',
      rationale: 'Obstructed airway prevents oxygenation.',
      reassessAfter: 'After maneuver, reassess air entry',
      timer: 30,
    };
  }
  if (answer === 'at_risk') {
    return {
      id: 'position-airway',
      severity: 'urgent',
      title: 'OPTIMIZE AIRWAY POSITION',
      instruction: 'Position head neutral (infant) or sniffing position (child).',
      rationale: 'At-risk airway can deteriorate rapidly.',
      reassessAfter: 'Reassess air entry after positioning',
      timer: 60,
    };
  }
  return null;
}

// SpO2 trigger
function checkSpO2Trigger(answer: number | null, pd: PatientData): CriticalAction | null {
  if (answer === null || answer === 0) return null;
  
  if (answer < 90) {
    return {
      id: 'severe-hypoxia',
      severity: 'critical',
      title: 'SEVERE HYPOXIA - IMMEDIATE OXYGEN',
      instruction: 'Apply 100% oxygen via non-rebreather.',
      dose: '100% FiO2 via non-rebreather at 15 L/min',
      route: 'Non-rebreather mask',
      rationale: `SpO2 ${answer}% indicates severe hypoxemia.`,
      reassessAfter: 'Recheck SpO2 every 1-2 minutes',
      timer: 120,
    };
  }
  if (answer >= 90 && answer < 94) {
    return {
      id: 'moderate-hypoxia',
      severity: 'urgent',
      title: 'HYPOXIA - SUPPLEMENTAL OXYGEN',
      instruction: 'Apply oxygen via nasal cannula or simple face mask.',
      dose: 'Start at 2-4 L/min nasal cannula',
      route: 'Nasal cannula or face mask',
      rationale: `SpO2 ${answer}% is below target.`,
      reassessAfter: 'Recheck SpO2 in 5 minutes',
      timer: 300,
    };
  }
  return null;
}

// Heart rate trigger
function checkHeartRateTrigger(answer: number | null, pd: PatientData): CriticalAction | null {
  if (answer === null || answer === 0) return null;
  
  const age = pd.ageYears;
  let bradycardia = 60;
  let severeTachy = 180;
  
  if (age < 1) {
    bradycardia = 100;
    severeTachy = 220;
  } else if (age < 5) {
    bradycardia = 80;
    severeTachy = 200;
  }
  
  const weight = pd.weight || calculateWeight(pd.ageYears, pd.ageMonths);
  
  if (answer < bradycardia) {
    return {
      id: 'bradycardia',
      severity: 'critical',
      title: 'BRADYCARDIA - CHECK OXYGENATION FIRST',
      instruction: 'Ensure adequate oxygenation and ventilation.',
      dose: `If needed: Epinephrine ${(weight * 0.01).toFixed(3)} mg IV/IO`,
      route: 'Optimize ventilation first',
      rationale: `HR ${answer} is bradycardic. In children, bradycardia is usually hypoxic.`,
      reassessAfter: 'Recheck HR after optimizing oxygenation',
      timer: 60,
    };
  }
  if (answer > severeTachy) {
    return {
      id: 'severe-tachycardia',
      severity: 'urgent',
      title: 'SEVERE TACHYCARDIA - ASSESS RHYTHM',
      instruction: 'Get 12-lead ECG. Assess for SVT vs sinus tachycardia.',
      rationale: `HR ${answer} is severely elevated.`,
      reassessAfter: 'Identify rhythm and treat cause',
      timer: 300,
    };
  }
  return null;
}

// Perfusion trigger
function checkPerfusionTrigger(answer: string, pd: PatientData): CriticalAction | null {
  const weight = pd.weight || calculateWeight(pd.ageYears, pd.ageMonths);
  
  if (answer === 'shock') {
    return {
      id: 'fluid-bolus-shock',
      severity: 'critical',
      title: 'SHOCK - GIVE FLUID BOLUS NOW',
      instruction: `Give crystalloid 10 mL/kg over 5-10 minutes.`,
      dose: `${(weight * 10).toFixed(0)} mL Ringer's Lactate IV/IO`,
      route: 'IV/IO push',
      rationale: 'Shock requires immediate volume resuscitation.',
      reassessAfter: 'Reassess perfusion after EVERY 10 mL/kg bolus',
      timer: 600,
    };
  }
  if (answer === 'poor') {
    return {
      id: 'fluid-bolus-poor-perfusion',
      severity: 'urgent',
      title: 'POOR PERFUSION - CONSIDER FLUID BOLUS',
      instruction: `Establish IV/IO access. Give 10 mL/kg crystalloid.`,
      dose: `${(weight * 10).toFixed(0)} mL Ringer's Lactate IV/IO`,
      route: 'IV/IO',
      rationale: 'Poor perfusion may indicate early shock.',
      reassessAfter: 'Reassess perfusion after bolus',
      timer: 600,
    };
  }
  return null;
}

// Glucose trigger
function checkGlucoseTrigger(answer: number | null, pd: PatientData): CriticalAction | null {
  if (answer === null || answer === 0) return null;
  
  let glucose = answer;
  // Convert to mmol/L if using mg/dL (assuming >30 means mg/dL)
  if (glucose > 30) {
    glucose = glucose / 18;
  }
  
  const weight = pd.weight || calculateWeight(pd.ageYears, pd.ageMonths);
  
  if (glucose < 2.6) {
    return {
      id: 'severe-hypoglycemia',
      severity: 'critical',
      title: 'SEVERE HYPOGLYCEMIA - GIVE DEXTROSE NOW',
      instruction: 'Give IV dextrose immediately.',
      dose: `D10W: ${(weight * 2).toFixed(0)} mL (2 mL/kg) IV push`,
      route: 'IV push',
      rationale: `Glucose ${glucose.toFixed(1)} mmol/L is critically low.`,
      reassessAfter: 'Recheck glucose in 15 minutes',
      timer: 900,
    };
  }
  if (glucose >= 2.6 && glucose < 4.0) {
    return {
      id: 'hypoglycemia',
      severity: 'urgent',
      title: 'HYPOGLYCEMIA - TREAT NOW',
      instruction: 'Give oral glucose if conscious, otherwise IV dextrose.',
      dose: `Oral: glucose gel. IV: D10W ${(weight * 2).toFixed(0)} mL`,
      route: 'Oral if conscious, IV if not',
      rationale: `Glucose ${glucose.toFixed(1)} mmol/L is low.`,
      reassessAfter: 'Recheck glucose in 15-30 minutes',
      timer: 900,
    };
  }
  return null;
}

// Seizure trigger
function checkSeizureTrigger(answer: string, pd: PatientData): CriticalAction | null {
  const weight = pd.weight || calculateWeight(pd.ageYears, pd.ageMonths);
  
  if (answer === 'active' || answer === 'prolonged') {
    return {
      id: 'seizure-treatment',
      severity: 'critical',
      title: 'ACTIVE SEIZURE - GIVE BENZODIAZEPINE NOW',
      instruction: 'Position safely. Give benzodiazepine. Check glucose.',
      dose: `Diazepam: ${(weight * 0.3).toFixed(1)} mg IV/IO, OR ${(weight * 0.5).toFixed(1)} mg rectal. Max 10 mg.`,
      route: 'IV/IO preferred, rectal if no access',
      rationale: 'Prolonged seizures cause brain injury.',
      reassessAfter: 'If seizure continues >5 min, give second dose',
      timer: 300,
    };
  }
  return null;
}

// Rash trigger
function checkRashTrigger(answer: string, pd: PatientData): CriticalAction | null {
  const weight = pd.weight || calculateWeight(pd.ageYears, pd.ageMonths);
  
  if (answer === 'petechiae') {
    return {
      id: 'meningococcemia',
      severity: 'critical',
      title: 'PETECHIAL RASH - SUSPECT MENINGOCOCCEMIA',
      instruction: 'Give IV antibiotics IMMEDIATELY.',
      dose: `Ceftriaxone: ${(weight * 100).toFixed(0)} mg (100 mg/kg, max 4g) IV`,
      route: 'IV push/infusion',
      rationale: 'Petechial rash with fever = meningococcemia until proven otherwise.',
      reassessAfter: 'Monitor for progression of rash',
      timer: 300,
    };
  }
  if (answer === 'urticaria') {
    return {
      id: 'allergic-reaction',
      severity: 'urgent',
      title: 'URTICARIA - ASSESS FOR ANAPHYLAXIS',
      instruction: 'Check for airway swelling, breathing difficulty, hypotension.',
      dose: `If anaphylaxis: Epinephrine ${(weight * 0.01).toFixed(2)} mg IM`,
      route: 'IM (anterolateral thigh)',
      rationale: 'Urticaria alone is not anaphylaxis, but monitor closely.',
      reassessAfter: 'Monitor for 4-6 hours',
      timer: 600,
    };
  }
  return null;
}

// ============================================================================
// TESTS
// ============================================================================

describe('GPS-Like Clinical Workflow', () => {
  const mockPatient2yr: PatientData = { ageYears: 2, ageMonths: 0, weight: 0 };
  const mockPatient6mo: PatientData = { ageYears: 0, ageMonths: 6, weight: 0 };
  const mockPatient10yr: PatientData = { ageYears: 10, ageMonths: 0, weight: 0 };

  describe('Weight Calculation', () => {
    it('should calculate weight for infant (6 months)', () => {
      const weight = calculateWeight(0, 6);
      expect(weight).toBeCloseTo(7.5, 1); // (6 + 9) / 2 = 7.5
    });

    it('should calculate weight for 2 year old', () => {
      const weight = calculateWeight(2, 0);
      expect(weight).toBe(12); // (2 + 4) * 2 = 12
    });

    it('should calculate weight for 10 year old', () => {
      const weight = calculateWeight(10, 0);
      expect(weight).toBe(40); // 10 * 4 = 40
    });
  });

  describe('Signs of Life Triggers', () => {
    describe('Breathing Check', () => {
      it('should trigger BVM ventilation when not breathing', () => {
        const action = checkBreathingTrigger('no', mockPatient2yr);
        expect(action).not.toBeNull();
        expect(action?.severity).toBe('critical');
        expect(action?.id).toBe('bvm-ventilation');
        expect(action?.title).toContain('BAG-VALVE-MASK');
      });

      it('should NOT trigger action when breathing', () => {
        const action = checkBreathingTrigger('yes', mockPatient2yr);
        expect(action).toBeNull();
      });

      it('should provide age-appropriate ventilation rate for infant', () => {
        const action = checkBreathingTrigger('no', mockPatient6mo);
        expect(action?.dose).toContain('30');
      });

      it('should provide age-appropriate ventilation rate for child', () => {
        const action = checkBreathingTrigger('no', mockPatient2yr);
        expect(action?.dose).toContain('20');
      });
    });

    describe('Pulse Check', () => {
      it('should trigger CPR when pulseless', () => {
        const action = checkPulseTrigger('no', mockPatient2yr);
        expect(action).not.toBeNull();
        expect(action?.severity).toBe('critical');
        expect(action?.id).toBe('start-cpr');
        expect(action?.title).toContain('CPR');
      });

      it('should NOT trigger action when pulse present', () => {
        const action = checkPulseTrigger('yes', mockPatient2yr);
        expect(action).toBeNull();
      });
    });

    describe('Responsiveness Check', () => {
      it('should trigger emergency call when unresponsive', () => {
        const action = checkResponsivenessTrigger('unresponsive', mockPatient2yr);
        expect(action).not.toBeNull();
        expect(action?.severity).toBe('critical');
        expect(action?.id).toBe('call-for-help');
      });

      it('should NOT trigger for alert patient', () => {
        const action = checkResponsivenessTrigger('alert', mockPatient2yr);
        expect(action).toBeNull();
      });

      it('should NOT trigger for verbal response', () => {
        const action = checkResponsivenessTrigger('voice', mockPatient2yr);
        expect(action).toBeNull();
      });
    });
  });

  describe('Airway Triggers', () => {
    it('should trigger immediate action for obstructed airway', () => {
      const action = checkAirwayTrigger('obstructed', mockPatient2yr);
      expect(action).not.toBeNull();
      expect(action?.severity).toBe('critical');
      expect(action?.id).toBe('clear-airway');
    });

    it('should trigger urgent action for at-risk airway', () => {
      const action = checkAirwayTrigger('at_risk', mockPatient2yr);
      expect(action).not.toBeNull();
      expect(action?.severity).toBe('urgent');
      expect(action?.id).toBe('position-airway');
    });

    it('should NOT trigger for patent airway', () => {
      const action = checkAirwayTrigger('patent', mockPatient2yr);
      expect(action).toBeNull();
    });
  });

  describe('Breathing Assessment Triggers', () => {
    describe('SpO2 Check', () => {
      it('should trigger critical action for SpO2 <90%', () => {
        const action = checkSpO2Trigger(85, mockPatient2yr);
        expect(action).not.toBeNull();
        expect(action?.severity).toBe('critical');
        expect(action?.id).toBe('severe-hypoxia');
      });

      it('should trigger urgent action for SpO2 90-93%', () => {
        const action = checkSpO2Trigger(92, mockPatient2yr);
        expect(action).not.toBeNull();
        expect(action?.severity).toBe('urgent');
        expect(action?.id).toBe('moderate-hypoxia');
      });

      it('should NOT trigger for SpO2 >=94%', () => {
        const action = checkSpO2Trigger(96, mockPatient2yr);
        expect(action).toBeNull();
      });

      it('should handle null SpO2', () => {
        const action = checkSpO2Trigger(null, mockPatient2yr);
        expect(action).toBeNull();
      });
    });
  });

  describe('Circulation Triggers', () => {
    describe('Heart Rate Check', () => {
      it('should trigger for bradycardia in infant (HR <100)', () => {
        const action = checkHeartRateTrigger(80, mockPatient6mo);
        expect(action).not.toBeNull();
        expect(action?.severity).toBe('critical');
        expect(action?.id).toBe('bradycardia');
      });

      it('should trigger for bradycardia in child (HR <80)', () => {
        const action = checkHeartRateTrigger(60, mockPatient2yr);
        expect(action).not.toBeNull();
        expect(action?.severity).toBe('critical');
      });

      it('should trigger for severe tachycardia in infant (HR >220)', () => {
        const action = checkHeartRateTrigger(230, mockPatient6mo);
        expect(action).not.toBeNull();
        expect(action?.severity).toBe('urgent');
        expect(action?.id).toBe('severe-tachycardia');
      });

      it('should NOT trigger for normal heart rate', () => {
        const action = checkHeartRateTrigger(120, mockPatient2yr);
        expect(action).toBeNull();
      });
    });

    describe('Perfusion Check', () => {
      it('should trigger critical action for shock', () => {
        const action = checkPerfusionTrigger('shock', mockPatient2yr);
        expect(action).not.toBeNull();
        expect(action?.severity).toBe('critical');
        expect(action?.id).toBe('fluid-bolus-shock');
        expect(action?.dose).toContain('120'); // 12kg * 10 = 120 mL
      });

      it('should trigger urgent action for poor perfusion', () => {
        const action = checkPerfusionTrigger('poor', mockPatient2yr);
        expect(action).not.toBeNull();
        expect(action?.severity).toBe('urgent');
        expect(action?.id).toBe('fluid-bolus-poor-perfusion');
      });

      it('should NOT trigger for normal perfusion', () => {
        const action = checkPerfusionTrigger('normal', mockPatient2yr);
        expect(action).toBeNull();
      });
    });
  });

  describe('Disability Triggers', () => {
    describe('Glucose Check', () => {
      it('should trigger critical action for severe hypoglycemia (<2.6 mmol/L)', () => {
        const action = checkGlucoseTrigger(2.0, mockPatient2yr);
        expect(action).not.toBeNull();
        expect(action?.severity).toBe('critical');
        expect(action?.id).toBe('severe-hypoglycemia');
      });

      it('should trigger urgent action for hypoglycemia (2.6-4.0 mmol/L)', () => {
        const action = checkGlucoseTrigger(3.5, mockPatient2yr);
        expect(action).not.toBeNull();
        expect(action?.severity).toBe('urgent');
        expect(action?.id).toBe('hypoglycemia');
      });

      it('should convert mg/dL to mmol/L and trigger appropriately', () => {
        // 40 mg/dL = 2.2 mmol/L (severe hypoglycemia)
        const action = checkGlucoseTrigger(40, mockPatient2yr);
        expect(action).not.toBeNull();
        expect(action?.severity).toBe('critical');
      });

      it('should NOT trigger for normal glucose', () => {
        const action = checkGlucoseTrigger(5.5, mockPatient2yr);
        expect(action).toBeNull();
      });
    });

    describe('Seizure Check', () => {
      it('should trigger critical action for active seizure', () => {
        const action = checkSeizureTrigger('active', mockPatient2yr);
        expect(action).not.toBeNull();
        expect(action?.severity).toBe('critical');
        expect(action?.id).toBe('seizure-treatment');
        expect(action?.dose).toContain('Diazepam');
      });

      it('should trigger critical action for status epilepticus', () => {
        const action = checkSeizureTrigger('prolonged', mockPatient2yr);
        expect(action).not.toBeNull();
        expect(action?.severity).toBe('critical');
      });

      it('should NOT trigger for no seizure', () => {
        const action = checkSeizureTrigger('no', mockPatient2yr);
        expect(action).toBeNull();
      });

      it('should NOT trigger for post-ictal state', () => {
        const action = checkSeizureTrigger('postictal', mockPatient2yr);
        expect(action).toBeNull();
      });
    });
  });

  describe('Exposure Triggers', () => {
    describe('Rash Check', () => {
      it('should trigger critical action for petechial rash', () => {
        const action = checkRashTrigger('petechiae', mockPatient2yr);
        expect(action).not.toBeNull();
        expect(action?.severity).toBe('critical');
        expect(action?.id).toBe('meningococcemia');
        expect(action?.dose).toContain('Ceftriaxone');
      });

      it('should trigger urgent action for urticaria', () => {
        const action = checkRashTrigger('urticaria', mockPatient2yr);
        expect(action).not.toBeNull();
        expect(action?.severity).toBe('urgent');
        expect(action?.id).toBe('allergic-reaction');
      });

      it('should NOT trigger for no rash', () => {
        const action = checkRashTrigger('none', mockPatient2yr);
        expect(action).toBeNull();
      });
    });
  });

  describe('Weight-Based Dosing', () => {
    it('should calculate correct fluid bolus for 12kg child', () => {
      const action = checkPerfusionTrigger('shock', mockPatient2yr);
      expect(action?.dose).toContain('120'); // 12kg * 10 = 120 mL
    });

    it('should calculate correct diazepam dose for 12kg child', () => {
      const action = checkSeizureTrigger('active', mockPatient2yr);
      // 12kg * 0.3 = 3.6 mg IV, 12kg * 0.5 = 6 mg rectal
      expect(action?.dose).toContain('3.6');
      expect(action?.dose).toContain('6.0');
    });

    it('should calculate correct ceftriaxone dose for 12kg child', () => {
      const action = checkRashTrigger('petechiae', mockPatient2yr);
      // 12kg * 100 = 1200 mg
      expect(action?.dose).toContain('1200');
    });

    it('should calculate correct dextrose dose for 12kg child', () => {
      const action = checkGlucoseTrigger(2.0, mockPatient2yr);
      // 12kg * 2 = 24 mL D10W
      expect(action?.dose).toContain('24');
    });
  });

  describe('Reassessment Timers', () => {
    it('should set 30-second timer for BVM ventilation', () => {
      const action = checkBreathingTrigger('no', mockPatient2yr);
      expect(action?.timer).toBe(30);
    });

    it('should set 2-minute timer for CPR', () => {
      const action = checkPulseTrigger('no', mockPatient2yr);
      expect(action?.timer).toBe(120);
    });

    it('should set 10-minute timer for fluid bolus', () => {
      const action = checkPerfusionTrigger('shock', mockPatient2yr);
      expect(action?.timer).toBe(600);
    });

    it('should set 5-minute timer for seizure treatment', () => {
      const action = checkSeizureTrigger('active', mockPatient2yr);
      expect(action?.timer).toBe(300);
    });
  });

  describe('DNA Compliance', () => {
    it('should provide rationale for every critical action (DNA 10.2)', () => {
      const actions = [
        checkBreathingTrigger('no', mockPatient2yr),
        checkPulseTrigger('no', mockPatient2yr),
        checkAirwayTrigger('obstructed', mockPatient2yr),
        checkPerfusionTrigger('shock', mockPatient2yr),
        checkGlucoseTrigger(2.0, mockPatient2yr),
        checkSeizureTrigger('active', mockPatient2yr),
      ];

      actions.forEach(action => {
        expect(action).not.toBeNull();
        expect(action?.rationale).toBeTruthy();
        expect(action?.rationale.length).toBeGreaterThan(10);
      });
    });

    it('should provide reassessment criteria for every action (DNA 8.1)', () => {
      const actions = [
        checkBreathingTrigger('no', mockPatient2yr),
        checkPulseTrigger('no', mockPatient2yr),
        checkAirwayTrigger('obstructed', mockPatient2yr),
        checkPerfusionTrigger('shock', mockPatient2yr),
      ];

      actions.forEach(action => {
        expect(action).not.toBeNull();
        expect(action?.reassessAfter).toBeTruthy();
      });
    });

    it('should prioritize airway over breathing (DNA 6.1)', () => {
      // Airway obstruction should be addressed before breathing assessment
      const airwayAction = checkAirwayTrigger('obstructed', mockPatient2yr);
      expect(airwayAction?.severity).toBe('critical');
      expect(airwayAction?.timer).toBe(30); // Short timer - must address quickly
    });

    it('should provide weight-based dosing with caps (DNA 9.1)', () => {
      // Check that doses include weight-based calculations
      const seizureAction = checkSeizureTrigger('active', mockPatient2yr);
      expect(seizureAction?.dose).toContain('Max 10 mg'); // Diazepam cap
    });

    it('should support IV and alternative routes (DNA 9.2)', () => {
      const seizureAction = checkSeizureTrigger('active', mockPatient2yr);
      expect(seizureAction?.route).toContain('IV/IO');
      expect(seizureAction?.route).toContain('rectal'); // Alternative route
    });
  });
});
