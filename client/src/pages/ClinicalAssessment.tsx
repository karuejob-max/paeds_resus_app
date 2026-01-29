'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';
import { CPRClock } from '@/components/CPRClock';

interface PatientData {
  ageYears: number;
  ageMonths: number;
  weight: number;
  glucoseUnit: 'mmol/L' | 'mg/dL';
}

interface ABCDEAssessment {
  // Airway
  responsiveness: 'alert' | 'verbal' | 'pain' | 'unresponsive' | null;
  airwayPatency: 'patent' | 'at-risk' | 'obstructed' | null;
  auscultationFindings: string[];
  
  // Breathing
  breathingAdequate: boolean | null;
  respiratoryRate: number | null;
  spO2: number | null;
  breathingAuscultation: string[];
  
  // Circulation
  pulsePresent: boolean | null;
  heartRate: number | null;
  systolicBP: number | null;
  pulseCharacter: 'strong-central-strong-peripheral' | 'strong-central-weak-peripheral' | 'weak-both' | null;
  skinPerfusion: 'warm' | 'cool' | 'cold' | null;
  capillaryRefill: number | null;
  circulationAuscultation: string[];
  
  // Disability
  consciousness: 'alert' | 'verbal' | 'pain' | 'unresponsive' | null;
  pupils: 'normal' | 'dilated' | 'constricted' | 'unequal' | null;
  glucose: number | null;
  seizureActivity: boolean | null;
  
  // Exposure
  temperature: number | null;
  rash: boolean | null;
  rashType: string | null;
}

interface Intervention {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  evidence: string[];
  actions: {
    drug?: string;
    dose?: string;
    route?: string;
    frequency?: string;
    titration?: string;
    reassessmentCriteria?: string[];
  }[];
  escalationPath?: string;
}

const ClinicalAssessment: React.FC = () => {
  const [step, setStep] = useState<'patient_data' | 'signs_of_life' | 'abcde' | 'interventions' | 'reassessment' | 'case_complete'>('patient_data');
  const [patientData, setPatientData] = useState<PatientData>({
    ageYears: 0,
    ageMonths: 0,
    weight: 0,
    glucoseUnit: 'mmol/L',
  });
  const [assessment, setAssessment] = useState<ABCDEAssessment>({
    responsiveness: null,
    airwayPatency: null,
    auscultationFindings: [],
    breathingAdequate: null,
    respiratoryRate: null,
    spO2: null,
    breathingAuscultation: [],
    pulsePresent: null,
    heartRate: null,
    systolicBP: null,
    pulseCharacter: null,
    skinPerfusion: null,
    capillaryRefill: null,
    circulationAuscultation: [],
    consciousness: null,
    pupils: null,
    glucose: null,
    seizureActivity: null,
    temperature: null,
    rash: null,
    rashType: null,
  });
  const [currentPhase, setCurrentPhase] = useState<'airway' | 'breathing' | 'circulation' | 'disability' | 'exposure' | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [startTime] = useState(new Date());
  const [emergencyActivated, setEmergencyActivated] = useState(false);
  const [emergencyActivationTime, setEmergencyActivationTime] = useState<Date | null>(null);
  const [cprActive, setCprActive] = useState(false);
  const [cprStartTime, setCprStartTime] = useState<Date | null>(null);

  // Calculate weight from age
  const calculateWeight = (years: number, months: number): number => {
    const totalMonths = years * 12 + months;
    
    if (totalMonths < 12) {
      // Infant: (age in months + 9) / 2
      return (totalMonths + 9) / 2;
    } else if (totalMonths < 60) {
      // Children 1-5 years: (age in years + 4) × 2
      return (years + 4) * 2;
    } else {
      // Children > 5 years: age in years × 4
      return years * 4;
    }
  };

  // Calculate vital sign ranges by age
  const getNormalRanges = (years: number) => {
    if (years < 1) {
      return { hr: '100-160', rr: '30-60', sbp: '50-70' };
    } else if (years < 3) {
      return { hr: '90-150', rr: '25-40', sbp: '80-100' };
    } else if (years < 6) {
      return { hr: '80-140', rr: '20-30', sbp: '90-110' };
    } else if (years < 12) {
      return { hr: '70-110', rr: '18-25', sbp: '100-120' };
    } else {
      return { hr: '60-100', rr: '12-20', sbp: '110-135' };
    }
  };

  // Identify clinical problems and generate interventions
  const identifyProblems = (): Intervention[] => {
    const problems: Intervention[] = [];
    const weight = patientData.weight || calculateWeight(patientData.ageYears, patientData.ageMonths);

    // AIRWAY PROBLEMS
    if (assessment.airwayPatency === 'obstructed') {
      problems.push({
        id: 'airway-obstruction',
        severity: 'critical',
        title: 'AIRWAY OBSTRUCTION - INTERVENE NOW',
        evidence: ['Airway patency: Obstructed'],
        actions: [
          {
            drug: 'Immediate airway management',
            dose: `ETT size: ${(patientData.ageYears / 4 + 4).toFixed(1)} mm`,
            route: 'Endotracheal',
            frequency: 'Immediate',
            reassessmentCriteria: ['Airway secured', 'Breath sounds bilateral', 'SpO2 improving'],
          },
          {
            drug: 'Suction catheter',
            dose: `${(patientData.ageYears / 2 + 8).toFixed(0)} Fr`,
            route: 'Endotracheal',
            frequency: 'As needed',
          },
        ],
        escalationPath: 'If unable to intubate: surgical airway (cricothyrotomy)',
      });
    }

    // BREATHING PROBLEMS
    if (assessment.breathingAdequate === false) {
      problems.push({
        id: 'apnea',
        severity: 'critical',
        title: 'APNEA - NO BREATHING - INTERVENE NOW',
        evidence: ['Breathing: Absent'],
        actions: [
          {
            drug: 'Bag-valve-mask ventilation',
            dose: `Rate: ${patientData.ageYears < 1 ? 30 : patientData.ageYears < 8 ? 20 : 15} breaths/min`,
            route: 'Positive pressure ventilation',
            frequency: 'Immediate',
            reassessmentCriteria: ['Chest rise visible', 'SpO2 improving', 'Heart rate improving'],
          },
          {
            drug: 'Prepare for intubation',
            dose: `ETT size: ${(patientData.ageYears / 4 + 4).toFixed(1)} mm`,
            route: 'Endotracheal',
            frequency: 'If BVM ineffective',
          },
        ],
        escalationPath: 'If unable to ventilate: surgical airway',
      });
    }

    if (assessment.respiratoryRate && assessment.respiratoryRate > 50) {
      problems.push({
        id: 'tachypnea',
        severity: 'warning',
        title: 'TACHYPNEA (RR >50) - Respiratory Distress',
        evidence: [`Respiratory rate: ${assessment.respiratoryRate}/min`],
        actions: [
          {
            drug: 'High-flow oxygen',
            dose: 'FiO2 0.6-1.0',
            route: 'Nasal cannula or non-rebreather',
            frequency: 'Continuous',
            reassessmentCriteria: ['SpO2 improving', 'RR decreasing', 'Work of breathing decreasing'],
          },
          {
            drug: 'Assess for cause',
            dose: 'Pneumonia, asthma, metabolic acidosis, etc.',
            route: 'Clinical assessment',
            frequency: 'Immediate',
          },
        ],
      });
    }

    // CIRCULATION PROBLEMS - SHOCK DETECTION
    if (assessment.pulsePresent === false) {
      problems.push({
        id: 'cardiac-arrest',
        severity: 'critical',
        title: 'CARDIAC ARREST - START CPR NOW',
        evidence: ['No pulse detected'],
        actions: [
          {
            drug: 'Chest compressions',
            dose: `${patientData.ageYears < 1 ? 'Two fingers' : patientData.ageYears < 8 ? 'One hand' : 'Two hands'} at ${patientData.ageYears < 1 ? 100 : 100}-120 compressions/min`,
            route: 'Chest',
            frequency: 'Continuous',
            reassessmentCriteria: ['Pulse returns', 'ROSC achieved'],
          },
          {
            drug: 'Epinephrine IV/IO',
            dose: `${(weight * 0.01).toFixed(2)} mg (0.01 mg/kg) of 1:10,000`,
            route: 'IV/IO',
            frequency: 'Every 3-5 minutes',
          },
          {
            drug: 'Amiodarone (if VF/pulseless VT)',
            dose: `${(weight * 5).toFixed(0)} mg (5 mg/kg)`,
            route: 'IV/IO',
            frequency: 'First dose, then 2.5 mg/kg every 3-5 min',
          },
        ],
        escalationPath: 'Continue CPR, consider ECMO if prolonged arrest',
      });
    }

    // Shock detection based on perfusion signs
    const hasShock = assessment.skinPerfusion === 'cool' || assessment.skinPerfusion === 'cold' || 
                     (assessment.systolicBP && assessment.systolicBP < 90) ||
                     (assessment.capillaryRefill && assessment.capillaryRefill > 2);

    if (hasShock && assessment.pulsePresent !== false) {
      const isWarmShock = assessment.skinPerfusion === 'warm' && assessment.heartRate && assessment.heartRate > 120;
      const isColdShock = assessment.skinPerfusion === 'cool' || assessment.skinPerfusion === 'cold';

      if (isWarmShock) {
        problems.push({
          id: 'warm-shock',
          severity: 'critical',
          title: 'WARM SHOCK (Septic) - FLUID + EPINEPHRINE',
          evidence: [
            'Warm extremities',
            `Heart rate: ${assessment.heartRate}/min`,
            `BP: ${assessment.systolicBP} mmHg`,
          ],
          actions: [
            {
              drug: 'IV Fluid bolus',
              dose: `${(weight * 20).toFixed(0)} mL (20 mL/kg) crystalloid`,
              route: 'IV/IO',
              frequency: 'Over 15 minutes, repeat x3 max (60 mL/kg total)',
              reassessmentCriteria: [
                `Urine output: ${patientData.ageYears < 1 ? '2-4' : patientData.ageYears < 5 ? '1-2' : '0.5-1'} mL/kg/hr`,
                'Temperature gradient <3°C',
                'HR decreasing',
                'BP improving',
              ],
            },
            {
              drug: 'Epinephrine IV/IO',
              dose: `0.1 mcg/kg/min (${(weight * 0.1).toFixed(2)} mcg/min)`,
              route: 'IV/IO infusion',
              frequency: 'Start immediately if hypotensive after first bolus',
              titration: 'Increase by 0.1 mcg/kg/min every 5-10 min to max 1 mcg/kg/min',
              reassessmentCriteria: ['BP >90 mmHg', 'Lactate trending down', 'Perfusion improving'],
            },
          ],
          escalationPath: 'If not responding to Epi: add Norepinephrine 0.05-0.1 mcg/kg/min',
        });
      } else if (isColdShock) {
        problems.push({
          id: 'cold-shock',
          severity: 'critical',
          title: 'COLD SHOCK (Compensated) - FLUID + DOBUTAMINE',
          evidence: [
            'Cool/cold extremities',
            'Weak peripheral pulses',
            `BP: ${assessment.systolicBP} mmHg`,
          ],
          actions: [
            {
              drug: 'IV Fluid bolus',
              dose: `${(weight * 20).toFixed(0)} mL (20 mL/kg) crystalloid`,
              route: 'IV/IO',
              frequency: 'Over 15 minutes, repeat x3 max (60 mL/kg total)',
              reassessmentCriteria: [
                'Temperature gradient improving',
                'Peripheral pulses strengthening',
                'BP improving',
              ],
            },
            {
              drug: 'Dobutamine IV/IO',
              dose: `5-10 mcg/kg/min (${(weight * 5).toFixed(0)}-${(weight * 10).toFixed(0)} mcg/min)`,
              route: 'IV/IO infusion',
              frequency: 'Start if hypotensive after fluids',
              titration: 'Increase by 2.5 mcg/kg/min every 5-10 min to max 20 mcg/kg/min',
              reassessmentCriteria: ['BP >90 mmHg', 'Perfusion improving', 'Lactate down'],
            },
          ],
          escalationPath: 'If not responding: add Milrinone 0.25-0.75 mcg/kg/min',
        });
      }
    }

    // DISABILITY PROBLEMS
    if (assessment.seizureActivity === true) {
      problems.push({
        id: 'seizure',
        severity: 'critical',
        title: 'SEIZURE ACTIVITY - STOP AND TREAT',
        evidence: ['Active seizure detected'],
        actions: [
          {
            drug: 'Lorazepam IV/IO',
            dose: `${(weight * 0.1).toFixed(2)} mg (0.1 mg/kg, max 4 mg)`,
            route: 'IV/IO',
            frequency: 'Immediate, repeat once after 5 min if still seizing',
            reassessmentCriteria: ['Seizure stopped', 'Child alert'],
          },
          {
            drug: 'Phenobarbital IV/IO (if still seizing)',
            dose: `${(weight * 15).toFixed(0)}-${(weight * 20).toFixed(0)} mg (15-20 mg/kg, max 1000 mg)`,
            route: 'IV/IO',
            frequency: 'Over 10-15 minutes',
            reassessmentCriteria: ['Seizure stopped', 'EEG normalized'],
          },
        ],
        escalationPath: 'If refractory: Levetiracetam or coma induction (Thiopental/Ketamine)',
      });
    }

    if (assessment.glucose) {
      const glucoseInMmol = patientData.glucoseUnit === 'mg/dL' ? assessment.glucose / 18 : assessment.glucose;
      if (glucoseInMmol < 3.9) {
        problems.push({
          id: 'hypoglycemia',
          severity: 'critical',
          title: 'HYPOGLYCEMIA - TREAT IMMEDIATELY',
          evidence: [`Glucose: ${assessment.glucose} ${patientData.glucoseUnit}`],
          actions: [
            {
              drug: 'Dextrose IV/IO',
              dose: `${(weight * 2.5).toFixed(1)}-${(weight * 5).toFixed(1)} mL of 10% dextrose (2-5 mL/kg)`,
              route: 'IV/IO',
              frequency: 'Immediate',
              reassessmentCriteria: ['Glucose >70 mg/dL (>3.9 mmol/L)', 'Consciousness improving'],
            },
          ],
        });
      }
    }

    // EXPOSURE PROBLEMS
    if (assessment.rash === true && assessment.rashType === 'petechial') {
      problems.push({
        id: 'meningococcemia',
        severity: 'critical',
        title: 'PETECHIAL RASH - MENINGOCOCCEMIA - START ANTIBIOTICS NOW',
        evidence: ['Petechial rash present'],
        actions: [
          {
            drug: 'Ceftriaxone IV/IO',
            dose: `${(weight * 100).toFixed(0)} mg (100 mg/kg/day)`,
            route: 'IV/IO',
            frequency: 'Divided BD',
            reassessmentCriteria: ['Rash not spreading', 'Shock resolving', 'Fever improving'],
          },
          {
            drug: 'Dexamethasone IV/IO',
            dose: `${(weight * 0.15).toFixed(1)} mg (0.15 mg/kg, max 10 mg)`,
            route: 'IV/IO',
            frequency: 'Before or with first antibiotic',
          },
        ],
        escalationPath: 'Lumbar puncture after stabilization for CSF analysis',
      });
    }

    return problems;
  };

  // Handle phase progression
  const handleContinue = () => {
    if (step === 'patient_data') {
      setStep('signs_of_life');
    } else if (step === 'signs_of_life') {
      if (assessment.responsiveness === 'unresponsive' && assessment.pulsePresent === false) {
        // No signs of life - activate BLS/ALS
        const newInterventions = identifyProblems();
        setInterventions(newInterventions);
        setStep('interventions');
      } else {
        // Proceed to ABCDE
        setCurrentPhase('airway');
        setStep('abcde');
      }
    } else if (step === 'abcde') {
      // Move to next phase or interventions
      if (currentPhase === 'airway') {
        setCurrentPhase('breathing');
      } else if (currentPhase === 'breathing') {
        setCurrentPhase('circulation');
      } else if (currentPhase === 'circulation') {
        setCurrentPhase('disability');
      } else if (currentPhase === 'disability') {
        setCurrentPhase('exposure');
      } else if (currentPhase === 'exposure') {
        // All ABCDE complete - identify problems
        const newInterventions = identifyProblems();
        setInterventions(newInterventions);
        setStep('interventions');
      }
    } else if (step === 'interventions') {
      setStep('reassessment');
    } else if (step === 'reassessment') {
      setStep('case_complete');
    }
  };

  const handleInterventionComplete = () => {
    // After intervention, return to reassessment
    setStep('reassessment');
  };

  const handleNewCase = () => {
    setStep('patient_data');
    setPatientData({ ageYears: 0, ageMonths: 0, weight: 0, glucoseUnit: 'mmol/L' });
    setAssessment({
      responsiveness: null,
      airwayPatency: null,
      auscultationFindings: [],
      breathingAdequate: null,
      respiratoryRate: null,
      spO2: null,
      breathingAuscultation: [],
      pulsePresent: null,
      heartRate: null,
      systolicBP: null,
      pulseCharacter: null,
      skinPerfusion: null,
      capillaryRefill: null,
      circulationAuscultation: [],
      consciousness: null,
      pupils: null,
      glucose: null,
      seizureActivity: null,
      temperature: null,
      rash: null,
      rashType: null,
    });
    setCurrentPhase(null);
    setInterventions([]);
  };

  const weight = patientData.weight || calculateWeight(patientData.ageYears, patientData.ageMonths);
  const normalRanges = getNormalRanges(patientData.ageYears);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Clinical Assessment</h1>
          <p className="text-slate-300">Pediatric Resuscitation - Real-time Decision Support</p>
        </div>

        {/* PATIENT DATA STEP */}
        {step === 'patient_data' && (
          <Card className="bg-slate-800 border-slate-700 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Step 1: Patient Data</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Age (Years)</Label>
                  <Input
                    type="number"
                    value={patientData.ageYears}
                    onChange={(e) => setPatientData({ ...patientData, ageYears: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Age (Months)</Label>
                  <Input
                    type="number"
                    value={patientData.ageMonths}
                    onChange={(e) => setPatientData({ ...patientData, ageMonths: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Weight (kg) - Optional (auto-calculates from age)</Label>
                <Input
                  type="number"
                  value={patientData.weight || ''}
                  onChange={(e) => setPatientData({ ...patientData, weight: parseFloat(e.target.value) || 0 })}
                  placeholder="Leave blank to auto-calculate"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                <p className="text-gray-300"><strong>Calculated Weight:</strong> {weight.toFixed(1)} kg</p>
                <p className="text-gray-300 text-sm mt-2">
                  <strong>Derived Parameters:</strong><br/>
                  ETT Size: {(patientData.ageYears / 4 + 4).toFixed(1)} mm<br/>
                  Fluid Bolus: {(weight * 20).toFixed(0)} mL<br/>
                  Epinephrine IV: {(weight * 0.01).toFixed(2)} mg
                </p>
              </div>

              <Button onClick={handleContinue} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg">
                Continue to Signs of Life <ChevronRight className="ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* SIGNS OF LIFE STEP */}
        {step === 'signs_of_life' && (
          <Card className="bg-slate-800 border-slate-700 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Step 2: Signs of Life Check</h2>
            
            <div className="space-y-6">
              <div>
                <Label className="text-gray-300 block mb-4">Is the child BREATHING?</Label>
                <div className="flex gap-4">
                  <Button
                    onClick={() => setAssessment({ ...assessment, breathingAdequate: true })}
                    variant={assessment.breathingAdequate === true ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    YES - Breathing
                  </Button>
                  <Button
                    onClick={() => setAssessment({ ...assessment, breathingAdequate: false })}
                    variant={assessment.breathingAdequate === false ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    NO - Apnea
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-gray-300 block mb-4">Does the child have a PULSE?</Label>
                <div className="flex gap-4">
                  <Button
                    onClick={() => setAssessment({ ...assessment, pulsePresent: true })}
                    variant={assessment.pulsePresent === true ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    YES - Pulse Present
                  </Button>
                  <Button
                    onClick={() => setAssessment({ ...assessment, pulsePresent: false })}
                    variant={assessment.pulsePresent === false ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    NO - Pulseless
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-gray-300 block mb-4">Responsiveness (AVPU)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['alert', 'verbal', 'pain', 'unresponsive'].map((resp) => (
                    <Button
                      key={resp}
                      onClick={() => setAssessment({ ...assessment, responsiveness: resp as any })}
                      variant={assessment.responsiveness === resp ? 'default' : 'outline'}
                      className="capitalize"
                    >
                      {resp}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Emergency Activation Button */}
              {(assessment.breathingAdequate === false || assessment.pulsePresent === false || assessment.responsiveness === 'unresponsive') && (
                <div className="bg-red-900 border-2 border-red-500 p-4 rounded">
                  <Button
                    onClick={() => {
                      setEmergencyActivated(true);
                      setEmergencyActivationTime(new Date());
                      if (assessment.breathingAdequate === false && assessment.pulsePresent === false) {
                        setCprActive(true);
                        setCprStartTime(new Date());
                      }
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg font-bold"
                  >
                    ACTIVATE CRASH CART - EMERGENCY RESPONSE TEAM
                  </Button>
                  {emergencyActivated && (
                    <p className="text-red-200 text-sm mt-2">
                      Emergency activated at {emergencyActivationTime?.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              )}

              <Button onClick={handleContinue} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg">
                Continue <ChevronRight className="ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* CPR CLOCK - Show when cardiac arrest detected */}
        {cprActive && cprStartTime && (
          <CPRClock
            patientId={1}
            patientName={`${patientData.ageYears}y ${patientData.ageMonths}m old child`}
            patientAge={patientData.ageMonths}
            patientWeight={patientData.weight || calculateWeight(patientData.ageYears, patientData.ageMonths)}
            onSessionEnd={() => setCprActive(false)}
          />
        )}

        {/* ABCDE ASSESSMENT STEPS */}
        {step === 'abcde' && currentPhase === 'airway' && (
          <Card className="bg-slate-800 border-slate-700 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Step 3: Airway (A) Assessment</h2>
            
            <div className="space-y-6">
              <div>
                <Label className="text-gray-300 block mb-4">Airway Patency</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['patent', 'at-risk', 'obstructed'].map((status) => (
                    <Button
                      key={status}
                      onClick={() => setAssessment({ ...assessment, airwayPatency: status as any })}
                      variant={assessment.airwayPatency === status ? 'default' : 'outline'}
                      className="capitalize"
                    >
                      {status === 'at-risk' ? 'At Risk' : status}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-gray-300 block mb-4">Auscultation Findings (Select all that apply)</Label>
                <div className="space-y-2">
                  {['Stridor', 'Wheeze', 'Crackles', 'Silent chest'].map((finding) => (
                    <button
                      key={finding}
                      onClick={() => {
                        const updated = assessment.auscultationFindings.includes(finding)
                          ? assessment.auscultationFindings.filter((f) => f !== finding)
                          : [...assessment.auscultationFindings, finding];
                        setAssessment({ ...assessment, auscultationFindings: updated });
                      }}
                      className={`w-full p-3 rounded border text-left ${
                        assessment.auscultationFindings.includes(finding)
                          ? 'bg-orange-500 border-orange-400 text-white'
                          : 'bg-slate-700 border-slate-600 text-gray-300'
                      }`}
                    >
                      {finding}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleContinue} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg">
                Continue to Breathing <ChevronRight className="ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {step === 'abcde' && currentPhase === 'breathing' && (
          <Card className="bg-slate-800 border-slate-700 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Step 4: Breathing (B) Assessment</h2>
            
            <div className="space-y-6">
              <div>
                <Label className="text-gray-300 block mb-4">Breathing Adequate?</Label>
                <div className="flex gap-4">
                  <Button
                    onClick={() => setAssessment({ ...assessment, breathingAdequate: true })}
                    variant={assessment.breathingAdequate === true ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    YES
                  </Button>
                  <Button
                    onClick={() => setAssessment({ ...assessment, breathingAdequate: false })}
                    variant={assessment.breathingAdequate === false ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    NO
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Respiratory Rate (/min)</Label>
                <Input
                  type="number"
                  value={assessment.respiratoryRate || ''}
                  onChange={(e) => setAssessment({ ...assessment, respiratoryRate: parseInt(e.target.value) || null })}
                  placeholder={`Normal: ${normalRanges.rr}`}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">Normal: {normalRanges.rr}</p>
              </div>

              <div>
                <Label className="text-gray-300">SpO2 (%)</Label>
                <Input
                  type="number"
                  value={assessment.spO2 || ''}
                  onChange={(e) => setAssessment({ ...assessment, spO2: parseInt(e.target.value) || null })}
                  placeholder="Normal: >95%"
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">Target: &gt; 90%</p>
              </div>

              <Button onClick={handleContinue} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg">
                Continue to Circulation <ChevronRight className="ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {step === 'abcde' && currentPhase === 'circulation' && (
          <Card className="bg-slate-800 border-slate-700 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Step 5: Circulation (C) Assessment</h2>
            
            <div className="space-y-6">
              <div>
                <Label className="text-gray-300 block mb-4">Pulse Present?</Label>
                <div className="flex gap-4">
                  <Button
                    onClick={() => setAssessment({ ...assessment, pulsePresent: true })}
                    variant={assessment.pulsePresent === true ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    YES
                  </Button>
                  <Button
                    onClick={() => setAssessment({ ...assessment, pulsePresent: false })}
                    variant={assessment.pulsePresent === false ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    NO
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Heart Rate (/min)</Label>
                <Input
                  type="number"
                  value={assessment.heartRate || ''}
                  onChange={(e) => setAssessment({ ...assessment, heartRate: parseInt(e.target.value) || null })}
                  placeholder={`Normal: ${normalRanges.hr}`}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">Normal: {normalRanges.hr}</p>
              </div>

              <div>
                <Label className="text-gray-300">Systolic BP (mmHg)</Label>
                <Input
                  type="number"
                  value={assessment.systolicBP || ''}
                  onChange={(e) => setAssessment({ ...assessment, systolicBP: parseInt(e.target.value) || null })}
                  placeholder={`Normal: ${normalRanges.sbp}`}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">Normal: {normalRanges.sbp}</p>
              </div>

              <div>
                <Label className="text-gray-300 block mb-4">Pulse Character</Label>
                <div className="space-y-2">
                  {[
                    { value: 'strong-central-strong-peripheral', label: 'Strong central, strong peripheral' },
                    { value: 'strong-central-weak-peripheral', label: 'Strong central, weak peripheral' },
                    { value: 'weak-both', label: 'Weak both' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setAssessment({ ...assessment, pulseCharacter: option.value as any })}
                      className={`w-full p-3 rounded border text-left ${
                        assessment.pulseCharacter === option.value
                          ? 'bg-orange-500 border-orange-400 text-white'
                          : 'bg-slate-700 border-slate-600 text-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-gray-300 block mb-4">Skin Perfusion</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['warm', 'cool', 'cold'].map((perf) => (
                    <Button
                      key={perf}
                      onClick={() => setAssessment({ ...assessment, skinPerfusion: perf as any })}
                      variant={assessment.skinPerfusion === perf ? 'default' : 'outline'}
                      className="capitalize"
                    >
                      {perf}
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={handleContinue} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg">
                Continue to Disability <ChevronRight className="ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {step === 'abcde' && currentPhase === 'disability' && (
          <Card className="bg-slate-800 border-slate-700 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Step 6: Disability (D) Assessment</h2>
            
            <div className="space-y-6">
              <div>
                <Label className="text-gray-300 block mb-4">Consciousness (AVPU)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['alert', 'verbal', 'pain', 'unresponsive'].map((cons) => (
                    <Button
                      key={cons}
                      onClick={() => setAssessment({ ...assessment, consciousness: cons as any })}
                      variant={assessment.consciousness === cons ? 'default' : 'outline'}
                      className="capitalize"
                    >
                      {cons}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-gray-300 block mb-4">Pupils</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['normal', 'dilated', 'constricted', 'unequal'].map((pupil) => (
                    <Button
                      key={pupil}
                      onClick={() => setAssessment({ ...assessment, pupils: pupil as any })}
                      variant={assessment.pupils === pupil ? 'default' : 'outline'}
                      className="capitalize"
                    >
                      {pupil}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-gray-300 block mb-3">Blood Glucose</Label>
                <div className="flex gap-2 mb-3">
                  <Button
                    onClick={() => setPatientData({ ...patientData, glucoseUnit: 'mmol/L' })}
                    variant={patientData.glucoseUnit === 'mmol/L' ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    mmol/L
                  </Button>
                  <Button
                    onClick={() => setPatientData({ ...patientData, glucoseUnit: 'mg/dL' })}
                    variant={patientData.glucoseUnit === 'mg/dL' ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    mg/dL
                  </Button>
                </div>
                <Input
                  type="number"
                  value={assessment.glucose || ''}
                  onChange={(e) => setAssessment({ ...assessment, glucose: parseFloat(e.target.value) || null })}
                  placeholder={patientData.glucoseUnit === 'mmol/L' ? 'e.g., 5.0' : 'e.g., 90'}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {patientData.glucoseUnit === 'mmol/L'
                    ? 'Normal: 3.9-5.6 mmol/L'
                    : 'Normal: 70-100 mg/dL'}
                </p>
              </div>

              <div>
                <Label className="text-gray-300 block mb-4">Seizure Activity?</Label>
                <div className="flex gap-4">
                  <Button
                    onClick={() => setAssessment({ ...assessment, seizureActivity: true })}
                    variant={assessment.seizureActivity === true ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    YES - Seizing
                  </Button>
                  <Button
                    onClick={() => setAssessment({ ...assessment, seizureActivity: false })}
                    variant={assessment.seizureActivity === false ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    NO
                  </Button>
                </div>
              </div>

              <Button onClick={handleContinue} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg">
                Continue to Exposure <ChevronRight className="ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {step === 'abcde' && currentPhase === 'exposure' && (
          <Card className="bg-slate-800 border-slate-700 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Step 7: Exposure (E) Assessment</h2>
            
            <div className="space-y-6">
              <div>
                <Label className="text-gray-300">Temperature (°C)</Label>
                <Input
                  type="number"
                  value={assessment.temperature || ''}
                  onChange={(e) => setAssessment({ ...assessment, temperature: parseFloat(e.target.value) || null })}
                  placeholder="e.g., 37.5"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300 block mb-4">Rash Present?</Label>
                <div className="flex gap-4">
                  <Button
                    onClick={() => setAssessment({ ...assessment, rash: true })}
                    variant={assessment.rash === true ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    YES
                  </Button>
                  <Button
                    onClick={() => setAssessment({ ...assessment, rash: false })}
                    variant={assessment.rash === false ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    NO
                  </Button>
                </div>
              </div>

              {assessment.rash && (
                <div>
                  <Label className="text-gray-300 block mb-4">Rash Type</Label>
                  <div className="space-y-2">
                    {['Macular', 'Papular', 'Petechial', 'Purpuric'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setAssessment({ ...assessment, rashType: type })}
                        className={`w-full p-3 rounded border text-left ${
                          assessment.rashType === type
                            ? 'bg-orange-500 border-orange-400 text-white'
                            : 'bg-slate-700 border-slate-600 text-gray-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={handleContinue} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg">
                Identify Problems & Interventions <ChevronRight className="ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* INTERVENTIONS STEP */}
        {step === 'interventions' && (
          <div className="space-y-4">
            {interventions.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700 p-8">
                <p className="text-gray-300">No critical problems identified. Continue monitoring.</p>
                <Button onClick={handleContinue} className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg">
                  Continue to Reassessment <ChevronRight className="ml-2" />
                </Button>
              </Card>
            ) : (
              interventions.map((intervention) => (
                <Card
                  key={intervention.id}
                  className={`border-2 p-6 ${
                    intervention.severity === 'critical'
                      ? 'bg-red-900 border-red-500'
                      : intervention.severity === 'warning'
                      ? 'bg-yellow-900 border-yellow-500'
                      : 'bg-blue-900 border-blue-500'
                  }`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    {intervention.severity === 'critical' && <AlertCircle className="text-red-400 flex-shrink-0 mt-1" />}
                    {intervention.severity === 'warning' && <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-1" />}
                    {intervention.severity === 'info' && <CheckCircle2 className="text-blue-400 flex-shrink-0 mt-1" />}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{intervention.title}</h3>
                      <p className="text-gray-200 text-sm mt-2">
                        <strong>Evidence:</strong> {intervention.evidence.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-4">
                    {intervention.actions.map((action, idx) => (
                      <div key={idx} className="bg-slate-800 p-4 rounded border border-slate-600">
                        {action.drug && <p className="text-white font-semibold">{action.drug}</p>}
                        {action.dose && <p className="text-gray-300 text-sm"><strong>Dose:</strong> {action.dose}</p>}
                        {action.route && <p className="text-gray-300 text-sm"><strong>Route:</strong> {action.route}</p>}
                        {action.frequency && <p className="text-gray-300 text-sm"><strong>Frequency:</strong> {action.frequency}</p>}
                        {action.titration && <p className="text-gray-300 text-sm"><strong>Titration:</strong> {action.titration}</p>}
                        {action.reassessmentCriteria && (
                          <div className="text-gray-300 text-sm mt-2">
                            <strong>Reassess for:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {action.reassessmentCriteria.map((criterion, i) => (
                                <li key={i}>{criterion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {intervention.escalationPath && (
                    <p className="text-orange-300 text-sm mb-4">
                      <strong>Escalation:</strong> {intervention.escalationPath}
                    </p>
                  )}

                  <Button
                    onClick={handleInterventionComplete}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                  >
                    Intervention Complete - Reassess
                  </Button>
                </Card>
              ))
            )}
          </div>
        )}

        {/* REASSESSMENT STEP */}
        {step === 'reassessment' && (
          <Card className="bg-slate-800 border-slate-700 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Reassessment</h2>
            
            <div className="space-y-6">
              <div className="bg-slate-700 p-4 rounded border border-slate-600">
                <p className="text-gray-300">
                  <strong>Reassess for improvement:</strong>
                </p>
                <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
                  <li>Urine output improving</li>
                  <li>Temperature gradient improving</li>
                  <li>Heart rate normalizing</li>
                  <li>Blood pressure improving</li>
                  <li>Level of consciousness improving</li>
                  <li>Lactate trending down</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300 block mb-2">Problem Resolved?</Label>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => setStep('case_complete')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6"
                    >
                      YES - Problem Resolved
                    </Button>
                    <Button
                      onClick={() => setStep('interventions')}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-6"
                    >
                      NO - Escalate
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* CASE COMPLETE STEP */}
        {step === 'case_complete' && (
          <Card className="bg-slate-800 border-slate-700 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Case Completed</h2>
            
            <div className="space-y-6">
              <div className="bg-green-900 border border-green-500 p-6 rounded">
                <p className="text-green-300 text-lg">
                  <CheckCircle2 className="inline mr-2" />
                  Case completed successfully
                </p>
              </div>

              <div className="bg-slate-700 p-4 rounded border border-slate-600 space-y-3">
                <p className="text-gray-300"><strong>Patient Summary:</strong></p>
                <p className="text-gray-300">Age: {patientData.ageYears} years {patientData.ageMonths} months</p>
                <p className="text-gray-300">Weight: {weight.toFixed(1)} kg</p>
                <p className="text-gray-300">Time elapsed: {Math.round((new Date().getTime() - startTime.getTime()) / 1000)} seconds</p>
              </div>

              <Button
                onClick={handleNewCase}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg"
              >
                Start New Case
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClinicalAssessment;
