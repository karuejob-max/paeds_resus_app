'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface PatientData {
  ageYears: number | null;
  ageMonths: number | null;
  weight: number | null;
}

interface AirwayData {
  avpu: string | null;
  auscultation: string | null; // 'normal', 'stridor', 'wheeze', 'crackles'
  patency: string | null; // 'patent', 'at-risk', 'obstructed'
  secretions: string | null; // 'none', 'mild', 'moderate', 'severe'
  obstructionType: string | null; // 'upper', 'lower', 'bilateral-crackles'
}

interface BreathingData {
  isBreathing: boolean | null;
  respiratoryRate: number | null;
  spO2: number | null;
  workOfBreathing: string | null; // 'normal', 'mild', 'moderate', 'severe'
}

interface CirculationData {
  hasPulse: boolean | null;
  centralPulseCharacter: string | null; // 'strong', 'normal', 'weak', 'absent'
  peripheralPulseCharacter: string | null; // 'present-strong', 'present-weak', 'absent'
  heartRate: number | null;
  systolicBP: number | null;
  skinPerfusion: string | null; // 'warm', 'cool', 'cold'
  capillaryRefill: number | null; // seconds
  urineOutput: string | null; // 'normal', 'oliguria', 'anuria'
  heartSounds: string | null; // 'normal', 'murmur', 'gallop', 'muffled'
  shockType: string | null; // 'none', 'hypovolemic', 'septic-warm', 'septic-cold', 'cardiogenic', 'anaphylactic'
  fluidBolusCount: number; // Track number of boluses given (max 3 per FEAST)
  fluidOverloadSigns: string[]; // ['hepatomegaly', 'crackles', 'jvd', 'edema']
}

interface DisabilityData {
  avpu: string | null; // 'alert', 'verbal', 'pain', 'unresponsive'
  pupilSize: string | null; // 'normal', 'dilated', 'pinpoint'
  pupilReactivity: string | null; // 'brisk', 'sluggish', 'fixed'
  pupilSymmetry: string | null; // 'equal', 'unequal'
  seizurePresent: boolean | null;
  bloodGlucose: number | null;
  glucoseUnit: 'mmol/L' | 'mg/dL'; // Default mmol/L
}

interface ExposureData {
  temperature: number | null;
  rash: boolean | null;
  rashType: string | null; // 'petechial', 'maculopapular', 'urticaria'
  skinIntegrity: string | null; // 'normal', 'bruising', 'burns', 'lacerations', 'abrasions'
  abdominal: string | null; // 'soft', 'distended', 'tender', 'hepatomegaly', 'splenomegaly'
  extremities: string | null; // 'normal', 'swelling', 'deformity', 'neurovascular-compromise'
}

interface RealTimeProblem {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  evidence: string[];
  interventions: string[];
  reassessmentCriteria: string;
  status: 'identified' | 'intervened' | 'resolved' | 'worsened';
}

export default function ClinicalAssessment() {
  const [step, setStep] = useState<
    | 'patient_data'
    | 'signs_of_life'
    | 'airway'
    | 'breathing'
    | 'circulation'
    | 'circulation_reassess'
    | 'disability'
    | 'exposure'
    | 'problem_synthesis'
    | 'case_completion'
  >('patient_data');

  const [patientData, setPatientData] = useState<PatientData>({
    ageYears: null,
    ageMonths: null,
    weight: null,
  });

  const [airwayData, setAirwayData] = useState<AirwayData>({
    avpu: null,
    auscultation: null,
    patency: null,
    secretions: null,
    obstructionType: null,
  });

  const [breathingData, setBreathingData] = useState<BreathingData>({
    isBreathing: null,
    respiratoryRate: null,
    spO2: null,
    workOfBreathing: null,
  });

  const [circulationData, setCirculationData] = useState<CirculationData>({
    hasPulse: null,
    centralPulseCharacter: null,
    peripheralPulseCharacter: null,
    heartRate: null,
    systolicBP: null,
    skinPerfusion: null,
    capillaryRefill: null,
    urineOutput: null,
    heartSounds: null,
    shockType: null,
    fluidBolusCount: 0,
    fluidOverloadSigns: [],
  });

  const [disabilityData, setDisabilityData] = useState<DisabilityData>({
    avpu: null,
    pupilSize: null,
    pupilReactivity: null,
    pupilSymmetry: null,
    seizurePresent: null,
    bloodGlucose: null,
    glucoseUnit: 'mmol/L', // Default mmol/L
  });

  const [exposureData, setExposureData] = useState<ExposureData>({
    temperature: null,
    rash: null,
    rashType: null,
    skinIntegrity: null,
    abdominal: null,
    extremities: null,
  });

  const [realTimeProblems, setRealTimeProblems] = useState<RealTimeProblem[]>([]);
  const [interventionAlert, setInterventionAlert] = useState<RealTimeProblem | null>(null);
  const [startTime] = useState(new Date());

  // Calculate weight from age
  const calculatedWeight = useMemo(() => {
    if (patientData.weight) return patientData.weight;

    const totalMonths = (patientData.ageYears || 0) * 12 + (patientData.ageMonths || 0);

    if (totalMonths === 0) return null;
    if (totalMonths < 12) {
      // Infants: (age in months + 9) / 2
      return (totalMonths + 9) / 2;
    } else if (totalMonths < 60) {
      // Children 1-5 years: (age in years + 4) × 2
      const years = totalMonths / 12;
      return (years + 4) * 2;
    } else {
      // Children >5 years: age in years × 4
      const years = totalMonths / 12;
      return years * 4;
    }
  }, [patientData]);

  // Calculate parameters
  const parameters = useMemo(() => {
    if (!calculatedWeight) return null;

    return {
      weight: calculatedWeight,
      ettSize: (patientData.ageYears || 0) / 4 + 4,
      suctionCatheter: (patientData.ageYears || 0) / 2 + 8,
      fluidBolus: calculatedWeight * 10, // 10 mL/kg per FEAST
      epinephrineIV: (calculatedWeight * 0.01).toFixed(2),
      epinephrineIO: (calculatedWeight * 0.1).toFixed(2),
      amiodarone: (calculatedWeight * 5).toFixed(0),
      dextrose10: `${(calculatedWeight * 2).toFixed(1)}-${(calculatedWeight * 5).toFixed(1)}`, // 2-5 mL/kg of 10%
    };
  }, [calculatedWeight, patientData.ageYears]);

  // Age-based normal ranges
  const normalRanges = useMemo(() => {
    const years = patientData.ageYears || 0;
    const months = patientData.ageMonths || 0;
    const totalMonths = years * 12 + months;

    if (totalMonths < 3) {
      return { hr: '100-160', rr: '30-60', sbp: '50-70' };
    } else if (totalMonths < 6) {
      return { hr: '100-160', rr: '25-55', sbp: '50-70' };
    } else if (totalMonths < 12) {
      return { hr: '80-140', rr: '25-45', sbp: '50-70' };
    } else if (totalMonths < 36) {
      return { hr: '80-130', rr: '20-40', sbp: '80-100' };
    } else if (totalMonths < 72) {
      return { hr: '70-110', rr: '20-30', sbp: '95-105' };
    } else if (totalMonths < 144) {
      return { hr: '60-100', rr: '18-25', sbp: '100-120' };
    } else {
      return { hr: '60-100', rr: '12-20', sbp: '110-135' };
    }
  }, [patientData.ageYears, patientData.ageMonths]);

  // Check for real-time problems and interventions
  const checkAirwayProblems = () => {
    const problems: RealTimeProblem[] = [];

    if (airwayData.auscultation === 'stridor') {
      problems.push({
        id: 'stridor',
        name: 'Upper Airway Obstruction (Stridor)',
        severity: 'high',
        evidence: ['Stridor on auscultation', 'Possible croup, epiglottitis, foreign body, anaphylaxis'],
        interventions: [
          'Keep child calm - position of comfort',
          'Supplemental oxygen - non-rebreather mask',
          `Dexamethasone: 0.6 mg/kg IV/IM (max 10 mg)`,
          'Nebulized epinephrine (if severe): 0.5 mL of 1:1000 in 3 mL NS',
          `Prepare for intubation - ETT size: ${parameters?.ettSize.toFixed(1)} mm`,
        ],
        reassessmentCriteria: 'Reassess stridor severity, work of breathing, response to dexamethasone',
        status: 'identified',
      });
    }

    if (airwayData.auscultation === 'wheeze') {
      problems.push({
        id: 'wheeze',
        name: 'Lower Airway Obstruction (Wheeze)',
        severity: 'high',
        evidence: ['Wheeze on auscultation', 'Possible asthma, bronchiolitis, anaphylaxis, aspiration'],
        interventions: [
          'Supplemental oxygen - target SpO2 >90%',
          'Albuterol nebulizer: 2.5-5 mg in 3 mL NS (repeat every 20 min if needed)',
          'Systemic steroids: Dexamethasone 0.6 mg/kg or Prednisone 1-2 mg/kg',
          'Consider IV access for medications if severe',
          `Prepare for intubation - ETT size: ${parameters?.ettSize.toFixed(1)} mm`,
        ],
        reassessmentCriteria: 'Reassess wheeze, SpO2, work of breathing, response to albuterol',
        status: 'identified',
      });
    }

    if (airwayData.auscultation === 'crackles') {
      problems.push({
        id: 'crackles',
        name: 'Pulmonary Edema or Pneumonia',
        severity: 'high',
        evidence: ['Crackles on auscultation', 'Possible pulmonary edema, pneumonia'],
        interventions: [
          'Supplemental oxygen - target SpO2 >90%',
          'Position upright - reduces work of breathing',
          'Diuretics (if pulmonary edema): Furosemide 1 mg/kg IV',
          'Antibiotics (if pneumonia): Ceftriaxone 50-80 mg/kg/day',
          'Monitor for deterioration - prepare for intubation',
        ],
        reassessmentCriteria: 'Reassess crackles, SpO2, work of breathing, response to treatment',
        status: 'identified',
      });
    }

    return problems;
  };

  const checkBreathingProblems = () => {
    const problems: RealTimeProblem[] = [];

    if (breathingData.isBreathing === false) {
      problems.push({
        id: 'apnea',
        name: '🚨 APNEA - NO BREATHING',
        severity: 'critical',
        evidence: ['No spontaneous breathing detected'],
        interventions: [
          'START BAG-VALVE-MASK VENTILATION NOW',
          'Rate: 20 breaths/min (1 breath every 3 seconds)',
          'Obtain IV/IO access immediately',
          `Prepare for intubation - ETT size: ${parameters?.ettSize.toFixed(1)} mm`,
          'Identify cause: CNS depression, airway obstruction, neuromuscular, cardiac',
          'Consider medications: Naloxone 0.1 mg/kg IV (if opioid), Flumazenil 0.01 mg/kg IV (if benzodiazepine)',
        ],
        reassessmentCriteria: 'Immediate reassessment after starting ventilation - check chest rise, SpO2',
        status: 'identified',
      });
    }

    if (
      breathingData.respiratoryRate &&
      breathingData.respiratoryRate > parseInt(normalRanges.rr.split('-')[1])
    ) {
      problems.push({
        id: 'tachypnea',
        name: 'Tachypnea (Elevated Respiratory Rate)',
        severity: 'moderate',
        evidence: [
          `RR ${breathingData.respiratoryRate} (normal: ${normalRanges.rr})`,
          'Possible hypoxia, acidosis, pain, fever, shock',
        ],
        interventions: [
          'Identify cause: Hypoxia, acidosis, pain, fever, shock',
          'Supplemental oxygen - target SpO2 >90%',
          'Treat underlying cause based on assessment',
        ],
        reassessmentCriteria: 'Reassess RR and SpO2 after oxygen and treatment',
        status: 'identified',
      });
    }

    if (breathingData.spO2 && breathingData.spO2 < 90) {
      problems.push({
        id: 'hypoxia',
        name: 'Hypoxia (SpO2 <90%)',
        severity: 'high',
        evidence: [`SpO2 ${breathingData.spO2}%`],
        interventions: [
          'Supplemental oxygen - non-rebreather mask (10-15 L/min)',
          'Assess airway: Stridor? Wheeze? Crackles?',
          'Treat based on findings',
          'Prepare for intubation if SpO2 remains <90%',
        ],
        reassessmentCriteria: 'Reassess SpO2 after oxygen - target >90%',
        status: 'identified',
      });
    }

    return problems;
  };

  const checkCirculationProblems = () => {
    const problems: RealTimeProblem[] = [];

    if (circulationData.hasPulse === false) {
      problems.push({
        id: 'cardiac-arrest',
        name: '🚨 CARDIAC ARREST - NO PULSE',
        severity: 'critical',
        evidence: ['No pulse detected'],
        interventions: [
          'START CPR NOW - Begin chest compressions',
          'Activate Emergency Response - Call for help',
          'Get Defibrillator - AED/Manual defibrillator',
          'Obtain IV/IO access',
          'Start CPR Clock - Begin resuscitation protocol',
        ],
        reassessmentCriteria: 'Reassess pulse every 2 minutes during CPR',
        status: 'identified',
      });
    }

    // Shock detection
    const isSystolicBPLow =
      circulationData.systolicBP &&
      circulationData.systolicBP < parseInt(normalRanges.sbp.split('-')[0]);

    const isPerfusionPoor =
      circulationData.centralPulseCharacter === 'weak' ||
      circulationData.peripheralPulseCharacter === 'absent' ||
      circulationData.skinPerfusion === 'cool' ||
      circulationData.skinPerfusion === 'cold';

    if (isSystolicBPLow || isPerfusionPoor) {
      // Determine shock type
      let shockType = 'Unknown';
      let interventions: string[] = [];

      if (
        circulationData.centralPulseCharacter === 'strong' &&
        circulationData.skinPerfusion === 'warm'
      ) {
        shockType = 'Septic Shock (Warm)';
        interventions = [
          'Fluid bolus: 10 mL/kg IV over 15 minutes',
          `Volume: ${parameters?.fluidBolus.toFixed(0)} mL`,
          'Antibiotics within 1 hour: Ceftriaxone 50-80 mg/kg/day + Gentamicin 7.5 mg/kg/day',
          'Identify source: UTI, pneumonia, meningitis, etc.',
          'REASSESS after bolus: Check BP, perfusion, signs of fluid overload',
        ];
      } else if (
        circulationData.centralPulseCharacter === 'weak' ||
        circulationData.skinPerfusion === 'cool'
      ) {
        shockType = 'Hypovolemic or Cold Septic Shock';
        interventions = [
          'Fluid bolus: 10 mL/kg IV over 15 minutes',
          `Volume: ${parameters?.fluidBolus.toFixed(0)} mL`,
          'Identify and stop bleeding if hemorrhage',
          'Obtain IV/IO access - large bore if possible',
          'Monitor urine output - target 1 mL/kg/hr',
          'REASSESS after bolus: Check BP, perfusion, signs of fluid overload',
        ];
      }

      if (circulationData.heartSounds === 'gallop' || circulationData.heartSounds === 'murmur') {
        shockType = 'Cardiogenic Shock - DO NOT BOLUS';
        interventions = [
          '⚠️ DO NOT GIVE FLUID BOLUS - Risk of pulmonary edema',
          'Identify cause: Arrhythmia, myocarditis, heart failure',
          'Treat arrhythmia: Adenosine for SVT, defibrillation for VF/VT',
          'Diuretics: Furosemide 1 mg/kg IV (if pulmonary edema)',
          'Inotropes: Dobutamine 5-20 mcg/kg/min IV',
          'Cardiology consultation if available',
        ];
      }

      problems.push({
        id: 'shock',
        name: `Shock - ${shockType}`,
        severity: 'critical',
        evidence: [
          `SBP ${circulationData.systolicBP} (normal: ${normalRanges.sbp})`,
          `Central pulse: ${circulationData.centralPulseCharacter}`,
          `Peripheral pulse: ${circulationData.peripheralPulseCharacter}`,
          `Skin perfusion: ${circulationData.skinPerfusion}`,
        ],
        interventions,
        reassessmentCriteria: 'MANDATORY: Reassess BP, perfusion, urine output after each bolus',
        status: 'identified',
      });
    }

    return problems;
  };

  const checkDisabilityProblems = () => {
    const problems: RealTimeProblem[] = [];

    if (disabilityData.seizurePresent === true) {
      problems.push({
        id: 'seizure',
        name: '🚨 SEIZURE - ACTIVE',
        severity: 'critical',
        evidence: ['Seizure activity detected'],
        interventions: [
          'Protect from injury - move away from hazards, do NOT restrain',
          'Position on side - prevent aspiration',
          'Supplemental oxygen - target SpO2 >90%',
          'TIME THE SEIZURE - note start time',
          'First-line medication (if seizure >5 min):',
          'Lorazepam 0.1 mg/kg IV (max 4 mg) OR Diazepam 0.1-0.3 mg/kg IV (max 10 mg)',
          'Second-line medication (if continues):',
          'Phenytoin 15-20 mg/kg IV (slow infusion over 20 min)',
          'Prepare for intubation if status epilepticus',
          'Identify cause: Fever, hypoglycemia, infection, trauma, toxin',
        ],
        reassessmentCriteria: 'Reassess seizure activity, consciousness, vital signs',
        status: 'identified',
      });
    }

    const glucoseValue = disabilityData.bloodGlucose;
    const isHypoglycemic =
      disabilityData.glucoseUnit === 'mmol/L'
        ? glucoseValue && glucoseValue < 3.9
        : glucoseValue && glucoseValue < 70;

    if (isHypoglycemic) {
      problems.push({
        id: 'hypoglycemia',
        name: 'Hypoglycemia',
        severity: 'high',
        evidence: [
          `Blood glucose: ${glucoseValue} ${disabilityData.glucoseUnit}`,
          `Normal: ${disabilityData.glucoseUnit === 'mmol/L' ? '3.9-5.6' : '70-100'}`,
        ],
        interventions: [
          'Dextrose IV immediately:',
          `2-5 mL/kg of 10% dextrose (${parameters?.dextrose10} mL for this child)`,
          'Recheck glucose in 5 minutes - repeat if still low',
          'Identify cause: Malnutrition, sepsis, liver disease, medication',
          'Continuous monitoring - glucose can drop again',
        ],
        reassessmentCriteria: 'Recheck glucose 5 minutes after dextrose - target >3.9 mmol/L',
        status: 'identified',
      });
    }

    if (disabilityData.pupilSymmetry === 'unequal') {
      problems.push({
        id: 'increased-icp',
        name: 'Possible Increased Intracranial Pressure',
        severity: 'high',
        evidence: ['Unequal pupils', 'Possible brain injury, stroke, or increased ICP'],
        interventions: [
          'Head elevation: 30 degrees',
          'Avoid hypoxia & hypercarbia: SpO2 >90%, PaCO2 35-40 mmHg',
          'Osmotic therapy: Mannitol 0.25-1 g/kg IV or 3% hypertonic saline',
          'Sedation & analgesia if intubated',
          'Avoid hyperthermia - treat fever',
          'Neurosurgery consultation if available',
        ],
        reassessmentCriteria: 'Reassess pupils, consciousness, vital signs',
        status: 'identified',
      });
    }

    return problems;
  };

  const checkExposureProblems = () => {
    const problems: RealTimeProblem[] = [];

    if (exposureData.rashType === 'petechial') {
      problems.push({
        id: 'meningococcemia',
        name: '🚨 PETECHIAL RASH - MENINGOCOCCEMIA EMERGENCY',
        severity: 'critical',
        evidence: ['Petechial rash present', 'High risk for meningococcal sepsis'],
        interventions: [
          'Antibiotics IMMEDIATELY (do NOT wait for LP):',
          'Ceftriaxone 50-80 mg/kg/day IV (max 4 g/day)',
          'PLUS Vancomycin 15-20 mg/kg IV',
          'Fluid bolus: 20 mL/kg IV (likely in septic shock)',
          'Vasopressors: Epinephrine if hypotensive after fluids',
          'Supportive care: Oxygen, monitoring, ICU admission',
          'Contact tracing: Prophylaxis for close contacts (Rifampin)',
        ],
        reassessmentCriteria: 'Reassess BP, perfusion, signs of shock resolution',
        status: 'identified',
      });
    }

    if (
      exposureData.rash === true &&
      exposureData.temperature &&
      exposureData.temperature > 38
    ) {
      problems.push({
        id: 'fever-with-rash',
        name: 'Fever with Rash - Possible Serious Infection',
        severity: 'high',
        evidence: [
          `Temperature: ${exposureData.temperature}°C`,
          `Rash type: ${exposureData.rashType}`,
        ],
        interventions: [
          'Identify rash type: Petechial (meningococcemia), Maculopapular (viral), Urticaria (anaphylaxis)',
          'If petechial: See Meningococcemia protocol above',
          'Antipyretics: Paracetamol 15 mg/kg or Ibuprofen 10 mg/kg',
          'Investigate: Blood culture, urinalysis, CXR, LP if meningitis suspected',
          'Antibiotics if sepsis suspected',
        ],
        reassessmentCriteria: 'Reassess temperature, rash progression, vital signs',
        status: 'identified',
      });
    }

    return problems;
  };

  // Synthesize all problems
  const synthesizeProblems = () => {
    const allProblems = [
      ...checkAirwayProblems(),
      ...checkBreathingProblems(),
      ...checkCirculationProblems(),
      ...checkDisabilityProblems(),
      ...checkExposureProblems(),
    ];

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
    allProblems.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    setRealTimeProblems(allProblems);

    // Show first critical/high problem as alert
    const criticalProblem = allProblems.find((p) => p.severity === 'critical' || p.severity === 'high');
    if (criticalProblem) {
      setInterventionAlert(criticalProblem);
    }
  };

  // Handlers
  const handlePatientDataContinue = () => {
    if (patientData.ageYears === null && patientData.ageMonths === null) {
      alert('Please enter patient age');
      return;
    }
    setStep('signs_of_life');
  };

  const handleSignsOfLifeContinue = () => {
    // Determine if child has signs of life
    const hasBreathing = breathingData.isBreathing === true;
    const hasPulse = circulationData.hasPulse === true;

    if (!hasBreathing && !hasPulse) {
      // BLS/ALS pathway - show intervention alert
      const blsAlert: RealTimeProblem = {
        id: 'bls-als',
        name: '🚨 NO SIGNS OF LIFE - ACTIVATE BLS/ALS',
        severity: 'critical',
        evidence: ['No breathing', 'No pulse'],
        interventions: [
          'START CPR NOW - Begin chest compressions',
          'Activate Emergency Response - Call for help',
          'Get Defibrillator - AED/Manual defibrillator',
          'Obtain IV/IO access',
          'Start CPR Clock - Begin resuscitation protocol',
        ],
        reassessmentCriteria: 'Reassess pulse every 2 minutes during CPR',
        status: 'identified',
      };
      setInterventionAlert(blsAlert);
      setRealTimeProblems([blsAlert]);
      setStep('case_completion');
    } else {
      // Continue to ABCDE assessment
      setStep('airway');
    }
  };

  const handleAirwayContinue = () => {
    const problems = checkAirwayProblems();
    if (problems.length > 0) {
      setInterventionAlert(problems[0]);
      setRealTimeProblems(problems);
      // Wait for intervention completion before continuing
    } else {
      setStep('breathing');
    }
  };

  const handleBreathingContinue = () => {
    const problems = checkBreathingProblems();
    if (problems.length > 0) {
      setInterventionAlert(problems[0]);
      setRealTimeProblems(problems);
    } else {
      setStep('circulation');
    }
  };

  const handleCirculationContinue = () => {
    const problems = checkCirculationProblems();
    if (problems.length > 0) {
      setInterventionAlert(problems[0]);
      setRealTimeProblems(problems);
      // Check if shock detected - if yes, show reassessment step
      if (problems.some((p) => p.id === 'shock')) {
        setStep('circulation_reassess');
      }
    } else {
      setStep('disability');
    }
  };

  const handleFluidBolus = () => {
    // Give 10 mL/kg bolus
    const newBolusCount = circulationData.fluidBolusCount + 1;
    setCirculationData({ ...circulationData, fluidBolusCount: newBolusCount });

    if (newBolusCount >= 3) {
      // Max 3 boluses per FEAST trial
      setInterventionAlert({
        id: 'max-bolus',
        name: 'Maximum Fluid Boluses Reached (FEAST Trial)',
        severity: 'high',
        evidence: ['3 boluses of 10 mL/kg given'],
        interventions: [
          'Reassess for fluid overload signs: Hepatomegaly, crackles, JVD, edema',
          'If fluid overload present: Start inotropes/pressors (Milrinone, Dobutamine, Epinephrine)',
          'If still in shock without overload: Consider other causes (sepsis, cardiogenic)',
          'Prepare for ICU transfer if available',
        ],
        reassessmentCriteria: 'Reassess clinical status, vital signs, fluid overload signs',
        status: 'identified',
      });
    }
  };

  const handleCirculationReassessmentContinue = () => {
    // Check for fluid overload or shock resolution
    const hasFluidOverload =
      circulationData.fluidOverloadSigns.length > 0 ||
      circulationData.heartSounds === 'gallop';

    if (hasFluidOverload) {
      setInterventionAlert({
        id: 'fluid-overload',
        name: 'Fluid Overload Detected - Switch to Inotropes/Pressors',
        severity: 'high',
        evidence: [
          `Signs: ${circulationData.fluidOverloadSigns.join(', ')}`,
          'Heart sounds: ' + circulationData.heartSounds,
        ],
        interventions: [
          'STOP fluid boluses',
          'Start inotropes/pressors:',
          'Milrinone 0.25-0.75 mcg/kg/min IV (inodilator)',
          'OR Dobutamine 5-20 mcg/kg/min IV (inotrope)',
          'OR Epinephrine 0.1-1 mcg/kg/min IV (if severe)',
          'Monitor BP, HR, perfusion closely',
          'Consider ICU transfer',
        ],
        reassessmentCriteria: 'Reassess BP, perfusion, urine output, fluid overload signs',
        status: 'identified',
      });
    } else if (circulationData.systolicBP && circulationData.systolicBP < parseInt(normalRanges.sbp.split('-')[0])) {
      // Still in shock - can give another bolus if <3 given
      if (circulationData.fluidBolusCount < 3) {
        setInterventionAlert({
          id: 'persistent-shock',
          name: 'Persistent Shock - Give Another Fluid Bolus',
          severity: 'critical',
          evidence: [`SBP still ${circulationData.systolicBP} (normal: ${normalRanges.sbp})`],
          interventions: [
            `Give another 10 mL/kg bolus (${parameters?.fluidBolus.toFixed(0)} mL)`,
            'Reassess after bolus: BP, perfusion, fluid overload signs',
            `Bolus count: ${circulationData.fluidBolusCount + 1}/3`,
          ],
          reassessmentCriteria: 'Reassess BP, perfusion after bolus',
          status: 'identified',
        });
      } else {
        // Max boluses reached, still in shock
        setInterventionAlert({
          id: 'refractory-shock',
          name: 'Refractory Shock - Inotropes/Pressors Required',
          severity: 'critical',
          evidence: ['Shock persists after 3 fluid boluses'],
          interventions: [
            'Start inotropes/pressors:',
            'Epinephrine 0.1-1 mcg/kg/min IV',
            'Milrinone 0.25-0.75 mcg/kg/min IV',
            'Dobutamine 5-20 mcg/kg/min IV',
            'Consider ICU transfer',
            'Investigate for other causes: Sepsis, cardiogenic, anaphylaxis',
          ],
          reassessmentCriteria: 'Reassess BP, perfusion, vital signs',
          status: 'identified',
        });
      }
    } else {
      // Shock resolved
      setStep('disability');
    }
  };

  const handleInterventionComplete = () => {
    setInterventionAlert(null);

    // Determine next step based on current step
    if (step === 'airway') {
      setStep('breathing');
    } else if (step === 'breathing') {
      setStep('circulation');
    } else if (step === 'circulation') {
      setStep('disability');
    } else if (step === 'disability') {
      setStep('exposure');
    } else if (step === 'exposure') {
      synthesizeProblems();
      setStep('problem_synthesis');
    }
  };

  const handleCaseCompletion = () => {
    const elapsedMinutes = Math.floor((new Date().getTime() - startTime.getTime()) / 60000);
    alert(
      `Case completed in ${elapsedMinutes} minutes. Patient: ${patientData.ageYears}y ${patientData.ageMonths}m, Weight: ${calculatedWeight?.toFixed(1)} kg`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Clinical Assessment</h1>
          <p className="text-gray-300">Pediatric Resuscitation - Real-time Decision Support</p>
        </div>

        {/* INTERVENTION ALERT */}
        {interventionAlert && (
          <Card className="mb-6 border-2 border-red-500 bg-red-900/20">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                {interventionAlert.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-300 mb-2">Evidence:</p>
                <ul className="text-sm text-gray-300 space-y-1">
                  {interventionAlert.evidence.map((e, i) => (
                    <li key={i}>• {e}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-300 mb-2">Immediate Actions:</p>
                <ul className="text-sm text-gray-200 space-y-1">
                  {interventionAlert.interventions.map((i, idx) => (
                    <li key={idx} className="font-semibold">
                      {idx + 1}. {i}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-300">Reassessment Criteria:</p>
                <p className="text-sm text-gray-200">{interventionAlert.reassessmentCriteria}</p>
              </div>

              <Button
                onClick={handleInterventionComplete}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Intervention Complete - Continue Assessment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* PATIENT DATA */}
        {step === 'patient_data' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Step 1: Patient Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Age (Years)</Label>
                  <Input
                    type="number"
                    value={patientData.ageYears || ''}
                    onChange={(e) =>
                      setPatientData({ ...patientData, ageYears: parseInt(e.target.value) || null })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Age (Months)</Label>
                  <Input
                    type="number"
                    value={patientData.ageMonths || ''}
                    onChange={(e) =>
                      setPatientData({ ...patientData, ageMonths: parseInt(e.target.value) || null })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Weight (kg) - Optional</Label>
                <Input
                  type="number"
                  placeholder="Leave blank to auto-calculate"
                  value={patientData.weight || ''}
                  onChange={(e) =>
                    setPatientData({ ...patientData, weight: parseFloat(e.target.value) || null })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              {calculatedWeight && (
                <div className="bg-green-900/30 border border-green-600 p-3 rounded">
                  <p className="text-green-300 font-semibold">Auto-Calculated Parameters:</p>
                  <div className="text-sm text-green-200 grid grid-cols-2 gap-2 mt-2">
                    <div>Weight: {calculatedWeight.toFixed(1)} kg</div>
                    <div>ETT: {parameters?.ettSize.toFixed(1)} mm</div>
                    <div>Suction: {parameters?.suctionCatheter.toFixed(1)} Fr</div>
                    <div>Fluid Bolus: {parameters?.fluidBolus.toFixed(0)} mL</div>
                    <div>Epi IV: {parameters?.epinephrineIV} mg</div>
                    <div>Epi IO: {parameters?.epinephrineIO} mg</div>
                    <div>Amiodarone: {parameters?.amiodarone} mg</div>
                    <div>Dextrose 10%: {parameters?.dextrose10} mL</div>
                  </div>
                </div>
              )}

              <Button
                onClick={handlePatientDataContinue}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Continue to Signs of Life <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* SIGNS OF LIFE */}
        {step === 'signs_of_life' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Step 2: Signs of Life Check</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-300 block mb-3">Is the child BREATHING?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setBreathingData({ ...breathingData, isBreathing: true })}
                    variant={breathingData.isBreathing === true ? 'default' : 'outline'}
                    className={breathingData.isBreathing === true ? 'bg-green-600' : ''}
                  >
                    ✓ YES
                  </Button>
                  <Button
                    onClick={() => setBreathingData({ ...breathingData, isBreathing: false })}
                    variant={breathingData.isBreathing === false ? 'default' : 'outline'}
                    className={breathingData.isBreathing === false ? 'bg-red-600' : ''}
                  >
                    ✗ NO
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-gray-300 block mb-3">Does the child have a PULSE?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setCirculationData({ ...circulationData, hasPulse: true })}
                    variant={circulationData.hasPulse === true ? 'default' : 'outline'}
                    className={circulationData.hasPulse === true ? 'bg-green-600' : ''}
                  >
                    ✓ YES
                  </Button>
                  <Button
                    onClick={() => setCirculationData({ ...circulationData, hasPulse: false })}
                    variant={circulationData.hasPulse === false ? 'default' : 'outline'}
                    className={circulationData.hasPulse === false ? 'bg-red-600' : ''}
                  >
                    ✗ NO
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleSignsOfLifeContinue}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* AIRWAY */}
        {step === 'airway' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Step 3: Airway Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-300 block mb-3">Auscultation (Listen with Stethoscope)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['normal', 'stridor', 'wheeze', 'crackles'].map((option) => (
                    <Button
                      key={option}
                      onClick={() => setAirwayData({ ...airwayData, auscultation: option })}
                      variant={airwayData.auscultation === option ? 'default' : 'outline'}
                      className={airwayData.auscultation === option ? 'bg-blue-600' : ''}
                    >
                      {option === 'normal' && 'Normal'}
                      {option === 'stridor' && 'Stridor'}
                      {option === 'wheeze' && 'Wheeze'}
                      {option === 'crackles' && 'Crackles'}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-gray-300 block mb-3">Airway Patency</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['patent', 'at-risk', 'obstructed'].map((option) => (
                    <Button
                      key={option}
                      onClick={() => setAirwayData({ ...airwayData, patency: option })}
                      variant={airwayData.patency === option ? 'default' : 'outline'}
                      className={airwayData.patency === option ? 'bg-orange-600' : ''}
                    >
                      {option === 'patent' && '✓ Patent'}
                      {option === 'at-risk' && '⚠️ At Risk'}
                      {option === 'obstructed' && '✗ Obstructed'}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleAirwayContinue}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Continue to Breathing <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* BREATHING */}
        {step === 'breathing' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Step 4: Breathing Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-300 block mb-3">Is the child breathing adequately?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setBreathingData({ ...breathingData, isBreathing: true })}
                    variant={breathingData.isBreathing === true ? 'default' : 'outline'}
                    className={breathingData.isBreathing === true ? 'bg-green-600' : ''}
                  >
                    ✓ YES
                  </Button>
                  <Button
                    onClick={() => setBreathingData({ ...breathingData, isBreathing: false })}
                    variant={breathingData.isBreathing === false ? 'default' : 'outline'}
                    className={breathingData.isBreathing === false ? 'bg-red-600' : ''}
                  >
                    ✗ NO
                  </Button>
                </div>
              </div>

              {breathingData.isBreathing && (
                <>
                  <div>
                    <Label className="text-gray-300">Respiratory Rate (breaths/min)</Label>
                    <Input
                      type="number"
                      value={breathingData.respiratoryRate || ''}
                      onChange={(e) =>
                        setBreathingData({
                          ...breathingData,
                          respiratoryRate: parseInt(e.target.value) || null,
                        })
                      }
                      placeholder={`Normal: ${normalRanges.rr}`}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">Normal: {normalRanges.rr}</p>
                  </div>

                  <div>
                    <Label className="text-gray-300">SpO2 (%)</Label>
                    <Input
                      type="number"
                      value={breathingData.spO2 || ''}
                      onChange={(e) =>
                        setBreathingData({
                          ...breathingData,
                          spO2: parseInt(e.target.value) || null,
                        })
                      }
                      placeholder="Normal: >95%"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">Target: {'>'} 90%</p>
                  </div>
                </>
              )}

              <Button
                onClick={handleBreathingContinue}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Continue to Circulation <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* CIRCULATION */}
        {step === 'circulation' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Step 5: Circulation Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-300 block mb-3">Does the child have a pulse?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setCirculationData({ ...circulationData, hasPulse: true })}
                    variant={circulationData.hasPulse === true ? 'default' : 'outline'}
                    className={circulationData.hasPulse === true ? 'bg-green-600' : ''}
                  >
                    ✓ YES
                  </Button>
                  <Button
                    onClick={() => setCirculationData({ ...circulationData, hasPulse: false })}
                    variant={circulationData.hasPulse === false ? 'default' : 'outline'}
                    className={circulationData.hasPulse === false ? 'bg-red-600' : ''}
                  >
                    ✗ NO
                  </Button>
                </div>
              </div>

              {circulationData.hasPulse && (
                <>
                  <div>
                    <Label className="text-gray-300 block mb-3">Central Pulse Character</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {['strong', 'normal', 'weak', 'absent'].map((option) => (
                        <Button
                          key={option}
                          onClick={() =>
                            setCirculationData({
                              ...circulationData,
                              centralPulseCharacter: option,
                            })
                          }
                          variant={
                            circulationData.centralPulseCharacter === option ? 'default' : 'outline'
                          }
                          className={
                            circulationData.centralPulseCharacter === option ? 'bg-blue-600' : ''
                          }
                          size="sm"
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300 block mb-3">Peripheral Pulse Character</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {['present-strong', 'present-weak', 'absent'].map((option) => (
                        <Button
                          key={option}
                          onClick={() =>
                            setCirculationData({
                              ...circulationData,
                              peripheralPulseCharacter: option,
                            })
                          }
                          variant={
                            circulationData.peripheralPulseCharacter === option
                              ? 'default'
                              : 'outline'
                          }
                          className={
                            circulationData.peripheralPulseCharacter === option
                              ? 'bg-blue-600'
                              : ''
                          }
                          size="sm"
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300">Heart Rate (bpm)</Label>
                    <Input
                      type="number"
                      value={circulationData.heartRate || ''}
                      onChange={(e) =>
                        setCirculationData({
                          ...circulationData,
                          heartRate: parseInt(e.target.value) || null,
                        })
                      }
                      placeholder={`Normal: ${normalRanges.hr}`}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">Normal: {normalRanges.hr}</p>
                  </div>

                  <div>
                    <Label className="text-gray-300">Systolic BP (mmHg)</Label>
                    <Input
                      type="number"
                      value={circulationData.systolicBP || ''}
                      onChange={(e) =>
                        setCirculationData({
                          ...circulationData,
                          systolicBP: parseInt(e.target.value) || null,
                        })
                      }
                      placeholder={`Normal: ${normalRanges.sbp}`}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">Normal: {normalRanges.sbp}</p>
                  </div>

                  <div>
                    <Label className="text-gray-300 block mb-3">Skin Perfusion</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {['warm', 'cool', 'cold'].map((option) => (
                        <Button
                          key={option}
                          onClick={() =>
                            setCirculationData({
                              ...circulationData,
                              skinPerfusion: option,
                            })
                          }
                          variant={circulationData.skinPerfusion === option ? 'default' : 'outline'}
                          className={circulationData.skinPerfusion === option ? 'bg-orange-600' : ''}
                          size="sm"
                        >
                          {option === 'warm' && '✓ Warm'}
                          {option === 'cool' && '⚠️ Cool'}
                          {option === 'cold' && '✗ Cold'}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300 block mb-3">Heart Sounds</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {['normal', 'murmur', 'gallop', 'muffled'].map((option) => (
                        <Button
                          key={option}
                          onClick={() =>
                            setCirculationData({
                              ...circulationData,
                              heartSounds: option,
                            })
                          }
                          variant={circulationData.heartSounds === option ? 'default' : 'outline'}
                          className={circulationData.heartSounds === option ? 'bg-purple-600' : ''}
                          size="sm"
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300 block mb-3">Fluid Overload Signs</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {['hepatomegaly', 'crackles', 'jvd', 'edema'].map((option) => (
                        <Button
                          key={option}
                          onClick={() => {
                            const newSigns = circulationData.fluidOverloadSigns.includes(option)
                              ? circulationData.fluidOverloadSigns.filter((s) => s !== option)
                              : [...circulationData.fluidOverloadSigns, option];
                            setCirculationData({
                              ...circulationData,
                              fluidOverloadSigns: newSigns,
                            });
                          }}
                          variant={
                            circulationData.fluidOverloadSigns.includes(option)
                              ? 'default'
                              : 'outline'
                          }
                          className={
                            circulationData.fluidOverloadSigns.includes(option)
                              ? 'bg-red-600'
                              : ''
                          }
                          size="sm"
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Button
                onClick={handleCirculationContinue}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Continue to Disability <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* CIRCULATION REASSESSMENT */}
        {step === 'circulation_reassess' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Circulation Reassessment - Shock Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-900/30 border border-yellow-600 p-3 rounded">
                <p className="text-yellow-300 font-semibold">FEAST Trial Protocol</p>
                <p className="text-sm text-yellow-200 mt-2">
                  Give fluid boluses in 10 mL/kg aliquots with reassessment after each bolus.
                </p>
                <p className="text-sm text-yellow-200">
                  Bolus count: {circulationData.fluidBolusCount}/3
                </p>
              </div>

              <Button
                onClick={handleFluidBolus}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={circulationData.fluidBolusCount >= 3}
              >
                <Clock className="w-4 h-4 mr-2" />
                Give 10 mL/kg Fluid Bolus ({parameters?.fluidBolus.toFixed(0)} mL)
              </Button>

              <div>
                <Label className="text-gray-300 block mb-3">After Bolus - Reassess:</Label>
                <div className="space-y-2">
                  <div>
                    <Label className="text-gray-300 text-sm">Systolic BP (mmHg)</Label>
                    <Input
                      type="number"
                      value={circulationData.systolicBP || ''}
                      onChange={(e) =>
                        setCirculationData({
                          ...circulationData,
                          systolicBP: parseInt(e.target.value) || null,
                        })
                      }
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 text-sm">Skin Perfusion</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {['warm', 'cool', 'cold'].map((option) => (
                        <Button
                          key={option}
                          onClick={() =>
                            setCirculationData({
                              ...circulationData,
                              skinPerfusion: option,
                            })
                          }
                          variant={circulationData.skinPerfusion === option ? 'default' : 'outline'}
                          className={circulationData.skinPerfusion === option ? 'bg-orange-600' : ''}
                          size="sm"
                        >
                          {option === 'warm' && '✓ Warm'}
                          {option === 'cool' && '⚠️ Cool'}
                          {option === 'cold' && '✗ Cold'}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCirculationReassessmentContinue}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Reassess & Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* DISABILITY */}
        {step === 'disability' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Step 6: Disability Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-300 block mb-3">Consciousness (AVPU)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['alert', 'verbal', 'pain', 'unresponsive'].map((option) => (
                    <Button
                      key={option}
                      onClick={() => setDisabilityData({ ...disabilityData, avpu: option })}
                      variant={disabilityData.avpu === option ? 'default' : 'outline'}
                      className={disabilityData.avpu === option ? 'bg-orange-600' : ''}
                    >
                      {option === 'alert' && 'A - Alert'}
                      {option === 'verbal' && 'V - Verbal'}
                      {option === 'pain' && 'P - Pain'}
                      {option === 'unresponsive' && 'U - Unresponsive'}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-gray-300 block mb-3">Seizure Present?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setDisabilityData({ ...disabilityData, seizurePresent: true })}
                    variant={disabilityData.seizurePresent === true ? 'default' : 'outline'}
                    className={disabilityData.seizurePresent === true ? 'bg-red-600' : ''}
                  >
                    ✗ YES
                  </Button>
                  <Button
                    onClick={() => setDisabilityData({ ...disabilityData, seizurePresent: false })}
                    variant={disabilityData.seizurePresent === false ? 'default' : 'outline'}
                    className={disabilityData.seizurePresent === false ? 'bg-green-600' : ''}
                  >
                    ✓ NO
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-gray-300">Blood Glucose ({disabilityData.glucoseUnit})</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setDisabilityData({ ...disabilityData, glucoseUnit: 'mmol/L' })}
                      variant={disabilityData.glucoseUnit === 'mmol/L' ? 'default' : 'outline'}
                      className={disabilityData.glucoseUnit === 'mmol/L' ? 'bg-blue-600 h-8' : 'h-8'}
                    >
                      mmol/L
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setDisabilityData({ ...disabilityData, glucoseUnit: 'mg/dL' })}
                      variant={disabilityData.glucoseUnit === 'mg/dL' ? 'default' : 'outline'}
                      className={disabilityData.glucoseUnit === 'mg/dL' ? 'bg-blue-600 h-8' : 'h-8'}
                    >
                      mg/dL
                    </Button>
                  </div>
                </div>
                <Input
                  type="number"
                  step="0.1"
                  value={disabilityData.bloodGlucose || ''}
                  onChange={(e) =>
                    setDisabilityData({
                      ...disabilityData,
                      bloodGlucose: parseFloat(e.target.value) || null,
                    })
                  }
                  placeholder={disabilityData.glucoseUnit === 'mmol/L' ? 'e.g., 5.0' : 'e.g., 90'}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {disabilityData.glucoseUnit === 'mmol/L'
                    ? 'Normal: 3.9-5.6 mmol/L'
                    : 'Normal: 70-100 mg/dL'}
                </p>
              </div>

              <Button
                onClick={() => {
                  const problems = checkDisabilityProblems();
                  if (problems.length > 0) {
                    setInterventionAlert(problems[0]);
                    setRealTimeProblems(problems);
                  } else {
                    setStep('exposure');
                  }
                }}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Continue to Exposure <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* EXPOSURE */}
        {step === 'exposure' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Step 7: Exposure Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-300">Temperature (°C)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={exposureData.temperature || ''}
                  onChange={(e) =>
                    setExposureData({
                      ...exposureData,
                      temperature: parseFloat(e.target.value) || null,
                    })
                  }
                  placeholder="Normal: 36.5-37.5"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300 block mb-3">Rash Present?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setExposureData({ ...exposureData, rash: true })}
                    variant={exposureData.rash === true ? 'default' : 'outline'}
                    className={exposureData.rash === true ? 'bg-red-600' : ''}
                  >
                    ✗ YES
                  </Button>
                  <Button
                    onClick={() => setExposureData({ ...exposureData, rash: false })}
                    variant={exposureData.rash === false ? 'default' : 'outline'}
                    className={exposureData.rash === false ? 'bg-green-600' : ''}
                  >
                    ✓ NO
                  </Button>
                </div>
              </div>

              {exposureData.rash && (
                <div>
                  <Label className="text-gray-300 block mb-3">Rash Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['petechial', 'maculopapular', 'urticaria'].map((option) => (
                      <Button
                        key={option}
                        onClick={() => setExposureData({ ...exposureData, rashType: option })}
                        variant={exposureData.rashType === option ? 'default' : 'outline'}
                        className={exposureData.rashType === option ? 'bg-purple-600' : ''}
                        size="sm"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={() => {
                  const problems = checkExposureProblems();
                  if (problems.length > 0) {
                    setInterventionAlert(problems[0]);
                    setRealTimeProblems(problems);
                  }
                  synthesizeProblems();
                  setStep('problem_synthesis');
                }}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Complete Assessment <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* PROBLEM SYNTHESIS */}
        {step === 'problem_synthesis' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Step 8: Clinical Problem Synthesis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {realTimeProblems.length === 0 ? (
                <p className="text-green-300">No critical problems identified. Continue monitoring.</p>
              ) : (
                <div className="space-y-4">
                  {realTimeProblems.map((problem) => (
                    <div
                      key={problem.id}
                      className={`p-3 rounded border-2 ${
                        problem.severity === 'critical'
                          ? 'border-red-500 bg-red-900/20'
                          : problem.severity === 'high'
                            ? 'border-orange-500 bg-orange-900/20'
                            : 'border-yellow-500 bg-yellow-900/20'
                      }`}
                    >
                      <p className="font-semibold text-white">{problem.name}</p>
                      <p className="text-sm text-gray-300 mt-1">Severity: {problem.severity}</p>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={() => setStep('case_completion')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Complete Case <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* CASE COMPLETION */}
        {step === 'case_completion' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Case Completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-900/30 border border-green-600 p-4 rounded">
                <p className="text-green-300 font-semibold mb-2">Case Summary</p>
                <div className="text-sm text-green-200 space-y-1">
                  <p>Patient: {patientData.ageYears}y {patientData.ageMonths}m</p>
                  <p>Weight: {calculatedWeight?.toFixed(1)} kg</p>
                  <p>Problems Identified: {realTimeProblems.length}</p>
                  <p>Time Elapsed: {Math.floor((new Date().getTime() - startTime.getTime()) / 60000)} minutes</p>
                </div>
              </div>

              <Button
                onClick={handleCaseCompletion}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Save Case & Complete
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
