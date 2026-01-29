'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, AlertTriangle, ArrowRight, RotateCcw } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PatientData {
  age: { years: number; months: number };
  weight: number;
  calculatedParameters: {
    minUrineOutput: number;
    normalSystolicBP: { min: number; max: number };
    normalHeartRateMin: number;
    normalHeartRateMax: number;
    normalRRMin: number;
    normalRRMax: number;
    ettSize: number;
    suctionCatheterSize: number;
    fluidBolus: number;
    epinephrineIV: number;
    epinephrineIO: number;
    amiodarone: number;
  };
}

interface SignsOfLife {
  breathing: boolean | null;
  pulse: boolean | null;
  responsiveness: 'A' | 'V' | 'P' | 'U' | null;
}

interface AirwayAssessment {
  patency: 'patent' | 'at_risk' | 'obstructed' | null;
  secretions: string[];
  obstructionType: string | null;
  interventionsPerformed: string[];
  reassessmentResult: 'patent' | 'at_risk' | 'obstructed' | null;
}

interface BreathingAssessment {
  isBreathing: boolean | null;
  respiratoryRate: number | null;
  workOfBreathing: string | null; // 'normal', 'increased', 'severe'
  spO2: number | null;
  breathSounds: string | null; // 'clear', 'wheeze', 'stridor', 'silent'
  interventionsPerformed: string[];
}

interface CirculationAssessment {
  hasPulse: boolean | null;
  heartRate: number | null;
  systolicBP: number | null;
  capillaryRefill: number | null; // seconds
  skinPerfusion: string | null; // 'warm', 'cool', 'cold'
  urineMeasured: number | null;
  shockType: string | null; // 'hypovolemic', 'septic', 'cardiogenic', 'none'
  interventionsPerformed: string[];
}

interface DisabilityAssessment {
  avpu: 'A' | 'V' | 'P' | 'U' | null;
  pupilResponse: string | null; // 'normal', 'sluggish', 'fixed'
  bloodGlucose: number | null;
  interventionsPerformed: string[];
}

interface ExposureAssessment {
  temperature: number | null;
  rash: boolean;
  injuries: string[];
  interventionsPerformed: string[];
}

interface ClinicalProblem {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  evidence: string[];
  solutions: string[];
}

type WorkflowStep =
  | 'patient_data'
  | 'signs_of_life'
  | 'airway'
  | 'breathing'
  | 'circulation'
  | 'disability'
  | 'exposure'
  | 'problem_identification'
  | 'solutions'
  | 'reassessment'
  | 'case_completion';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ClinicalAssessment() {
  // Workflow state
  const [step, setStep] = useState<WorkflowStep>('patient_data');
  const [blsAlsActivated, setBlsAlsActivated] = useState(false);
  const [caseStartTime] = useState(new Date());

  // Patient data
  const [patientData, setPatientData] = useState<PatientData>({
    age: { years: 0, months: 0 },
    weight: 0,
    calculatedParameters: {
      minUrineOutput: 0,
      normalSystolicBP: { min: 0, max: 0 },
      normalHeartRateMin: 0,
      normalHeartRateMax: 0,
      normalRRMin: 0,
      normalRRMax: 0,
      ettSize: 0,
      suctionCatheterSize: 0,
      fluidBolus: 0,
      epinephrineIV: 0,
      epinephrineIO: 0,
      amiodarone: 0,
    },
  });

  // Assessment data
  const [signsOfLife, setSignsOfLife] = useState<SignsOfLife>({
    breathing: null,
    pulse: null,
    responsiveness: null,
  });

  const [airwayAssessment, setAirwayAssessment] = useState<AirwayAssessment>({
    patency: null,
    secretions: [],
    obstructionType: null,
    interventionsPerformed: [],
    reassessmentResult: null,
  });

  const [breathingAssessment, setBreathingAssessment] = useState<BreathingAssessment>({
    isBreathing: null,
    respiratoryRate: null,
    workOfBreathing: null,
    spO2: null,
    breathSounds: null,
    interventionsPerformed: [],
  });

  const [circulationAssessment, setCirculationAssessment] = useState<CirculationAssessment>({
    hasPulse: null,
    heartRate: null,
    systolicBP: null,
    capillaryRefill: null,
    skinPerfusion: null,
    urineMeasured: null,
    shockType: null,
    interventionsPerformed: [],
  });

  const [disabilityAssessment, setDisabilityAssessment] = useState<DisabilityAssessment>({
    avpu: null,
    pupilResponse: null,
    bloodGlucose: null,
    interventionsPerformed: [],
  });

  const [exposureAssessment, setExposureAssessment] = useState<ExposureAssessment>({
    temperature: null,
    rash: false,
    injuries: [],
    interventionsPerformed: [],
  });

  const [clinicalProblems, setClinicalProblems] = useState<ClinicalProblem[]>([]);

  // ============================================================================
  // CALCULATION FUNCTIONS
  // ============================================================================

  const calculateWeightFromAge = (years: number, months: number): number => {
    const totalMonths = years * 12 + months;
    if (totalMonths < 12) return totalMonths / 2; // 0-1 year
    if (totalMonths < 60) return 2 + (totalMonths - 12) / 6; // 1-5 years
    return 20 + (totalMonths - 60) / 12; // >5 years
  };

  const calculateParameters = (weight: number, years: number): PatientData['calculatedParameters'] => {
    const age = years;
    return {
      minUrineOutput: weight * 1, // mL/hr
      normalSystolicBP: {
        min: Math.max(70, 90 + 2 * age - 10),
        max: 90 + 2 * age + 10,
      },
      normalHeartRateMin: age < 1 ? 100 : age < 3 ? 95 : age < 6 ? 80 : 70,
      normalHeartRateMax: age < 1 ? 160 : age < 3 ? 150 : age < 6 ? 140 : 100,
      normalRRMin: age < 1 ? 30 : age < 3 ? 25 : age < 6 ? 20 : 16,
      normalRRMax: age < 1 ? 60 : age < 3 ? 40 : age < 6 ? 30 : 20,
      ettSize: Math.round((age / 4 + 4) * 10) / 10,
      suctionCatheterSize: Math.round((age / 4 + 4) * 2 * 10) / 10,
      fluidBolus: weight * 20, // mL
      epinephrineIV: weight * 0.01, // mg (0.01 mg/kg)
      epinephrineIO: weight * 0.1, // mg (0.1 mg/kg for IO)
      amiodarone: weight * 5, // mg (5 mg/kg)
    };
  };

  const handlePatientDataSubmit = () => {
    const years = patientData.age.years;
    let weight = patientData.weight;

    if (weight === 0) {
      weight = calculateWeightFromAge(patientData.age.years, patientData.age.months);
    }

    const params = calculateParameters(weight, years);
    setPatientData({
      ...patientData,
      weight,
      calculatedParameters: params,
    });

    setStep('signs_of_life');
  };

  // ============================================================================
  // SIGNS OF LIFE LOGIC
  // ============================================================================

  const handleSignsOfLifeSubmit = () => {
    // If no breathing AND no pulse → BLS/ALS immediately
    if (!signsOfLife.breathing && !signsOfLife.pulse) {
      setBlsAlsActivated(true);
      setStep('problem_identification');
      return;
    }

    // If unresponsive but has breathing/pulse → continue to airway
    setStep('airway');
  };

  // ============================================================================
  // PROBLEM IDENTIFICATION ENGINE
  // ============================================================================

  const identifyProblems = (): ClinicalProblem[] => {
    const problems: ClinicalProblem[] = [];

    // BLS/ALS activation
    if (blsAlsActivated) {
      problems.push({
        id: 'cardiac_arrest',
        name: '🚨 CARDIAC ARREST - NO SIGNS OF LIFE',
        severity: 'critical',
        evidence: ['No breathing', 'No pulse', 'Unresponsive'],
        solutions: [
          'START CHEST COMPRESSIONS 100-120/min',
          `Compression depth: ${patientData.age.years < 1 ? '1.5 inches' : '2 inches (or 1/3 chest depth)'}`,
          'Provide rescue breathing (30:2 ratio)',
          'Attach monitor/defibrillator',
          'Obtain IV/IO access',
          `Epinephrine IV: ${patientData.calculatedParameters.epinephrineIV.toFixed(2)} mg every 3-5 min`,
          `Epinephrine IO: ${patientData.calculatedParameters.epinephrineIO.toFixed(2)} mg every 3-5 min`,
          'Continue CPR throughout A-E assessment',
        ],
      });
      return problems;
    }

    // Airway problems
    if (airwayAssessment.patency === 'obstructed') {
      problems.push({
        id: 'airway_obstruction',
        name: '🚨 AIRWAY OBSTRUCTION',
        severity: 'critical',
        evidence: ['Silent, unable to vocalize'],
        solutions: [
          'Position child upright',
          'Prepare for emergency airway management',
          'Notify anesthesia/ENT immediately',
          'Have emergency tracheostomy kit available',
        ],
      });
    } else if (airwayAssessment.patency === 'at_risk') {
      if (airwayAssessment.obstructionType === 'upper_airway') {
        problems.push({
          id: 'upper_airway_obstruction',
          name: '⚠️ UPPER AIRWAY OBSTRUCTION (Stridor)',
          severity: 'high',
          evidence: ['Stridor present', 'Grunting or snoring'],
          solutions: [
            'Position child upright (sitting forward)',
            `Nebulize epinephrine 1:1000: ${(patientData.weight * 0.05).toFixed(2)} mL`,
            `Dexamethasone: ${(patientData.weight * 0.6).toFixed(1)} mg OR Hydrocortisone: ${(patientData.weight * 1).toFixed(1)}-${(patientData.weight * 2).toFixed(1)} mg`,
            'Keep child calm, avoid agitation',
            'Reassess in 15 minutes',
          ],
        });
      } else if (airwayAssessment.obstructionType === 'lower_airway') {
        problems.push({
          id: 'lower_airway_obstruction',
          name: '⚠️ LOWER AIRWAY OBSTRUCTION (Wheeze)',
          severity: 'high',
          evidence: ['Wheeze present', 'Respiratory distress'],
          solutions: [
            'Provide oxygen 100% FiO2',
            `Nebulize salbutamol: ${(patientData.weight * 0.15).toFixed(2)} mg`,
            'Consider ipratropium + oxygen',
            'Reassess in 15 minutes',
          ],
        });
      }
    }

    // Breathing problems
    if (breathingAssessment.isBreathing === false) {
      problems.push({
        id: 'no_breathing',
        name: '🚨 APNEA - NO SPONTANEOUS BREATHING',
        severity: 'critical',
        evidence: ['No respiratory effort'],
        solutions: [
          'Provide bag-valve-mask ventilation',
          `Rate: ${patientData.calculatedParameters.normalRRMin}-${patientData.calculatedParameters.normalRRMax} breaths/min`,
          'Ensure adequate chest rise',
          'Prepare for intubation',
        ],
      });
    } else if (breathingAssessment.respiratoryRate !== null) {
      const rr = breathingAssessment.respiratoryRate;
      const minRR = patientData.calculatedParameters.normalRRMin;
      const maxRR = patientData.calculatedParameters.normalRRMax;

      if (rr < minRR) {
        problems.push({
          id: 'bradypnea',
          name: '⚠️ BRADYPNEA (Slow Breathing)',
          severity: 'high',
          evidence: [`RR ${rr} (normal: ${minRR}-${maxRR})`],
          solutions: [
            'Provide supplemental oxygen',
            'Prepare for assisted ventilation',
            'Assess for CNS depression or fatigue',
          ],
        });
      } else if (rr > maxRR) {
        problems.push({
          id: 'tachypnea',
          name: '⚠️ TACHYPNEA (Fast Breathing)',
          severity: 'moderate',
          evidence: [`RR ${rr} (normal: ${minRR}-${maxRR})`],
          solutions: [
            'Provide supplemental oxygen',
            'Assess for metabolic acidosis or compensation',
            'Monitor for fatigue',
          ],
        });
      }
    }

    // Circulation problems
    if (circulationAssessment.hasPulse === false) {
      problems.push({
        id: 'no_pulse',
        name: '🚨 PULSELESS - ACTIVATE BLS/ALS',
        severity: 'critical',
        evidence: ['No central pulse detected'],
        solutions: [
          'START CHEST COMPRESSIONS immediately',
          'Obtain IV/IO access',
          `Epinephrine: ${patientData.calculatedParameters.epinephrineIV.toFixed(2)} mg IV every 3-5 min`,
        ],
      });
    } else if (circulationAssessment.heartRate !== null) {
      const hr = circulationAssessment.heartRate;
      const minHR = patientData.calculatedParameters.normalHeartRateMin;
      const maxHR = patientData.calculatedParameters.normalHeartRateMax;

      if (hr < minHR) {
        problems.push({
          id: 'bradycardia',
          name: '⚠️ BRADYCARDIA (Slow Heart Rate)',
          severity: 'high',
          evidence: [`HR ${hr} (normal: ${minHR}-${maxHR})`],
          solutions: [
            'Assess for hypoxia, hypothermia, or increased ICP',
            'Provide oxygen',
            'Prepare for pacing if symptomatic',
          ],
        });
      } else if (hr > maxHR) {
        problems.push({
          id: 'tachycardia',
          name: '⚠️ TACHYCARDIA (Fast Heart Rate)',
          severity: 'moderate',
          evidence: [`HR ${hr} (normal: ${minHR}-${maxHR})`],
          solutions: [
            'Assess for fever, pain, anxiety, or hypovolemia',
            'Provide comfort measures',
            'Monitor for decompensation',
          ],
        });
      }
    }

    // Shock detection
    if (circulationAssessment.shockType === 'hypovolemic') {
      problems.push({
        id: 'hypovolemic_shock',
        name: '🚨 HYPOVOLEMIC SHOCK',
        severity: 'critical',
        evidence: ['Cool extremities', 'Delayed cap refill', 'Tachycardia'],
        solutions: [
          `Fluid bolus: ${patientData.calculatedParameters.fluidBolus.toFixed(0)} mL normal saline IV over 15 min`,
          'Reassess perfusion after bolus',
          'Prepare for second bolus if needed',
          'Consider vasopressor if unresponsive',
        ],
      });
    } else if (circulationAssessment.shockType === 'septic') {
      problems.push({
        id: 'septic_shock',
        name: '🚨 SEPTIC SHOCK',
        severity: 'critical',
        evidence: ['Fever/hypothermia', 'Tachycardia', 'Poor perfusion'],
        solutions: [
          `Fluid bolus: ${patientData.calculatedParameters.fluidBolus.toFixed(0)} mL normal saline IV`,
          'Blood cultures before antibiotics',
          'Broad-spectrum antibiotics (Ceftriaxone 80 mg/kg)',
          'Vasopressor if unresponsive to fluids',
        ],
      });
    }

    // Disability problems
    if (disabilityAssessment.avpu === 'U') {
      problems.push({
        id: 'unconscious',
        name: '⚠️ UNCONSCIOUS (AVPU: U)',
        severity: 'high',
        evidence: ['No response to pain'],
        solutions: [
          'Protect airway',
          'Assess for hypoglycemia',
          'Check pupils and motor response',
          'Consider intubation for airway protection',
        ],
      });
    }

    // Exposure problems
    if (exposureAssessment.temperature !== null) {
      if (exposureAssessment.temperature < 36) {
        problems.push({
          id: 'hypothermia',
          name: '⚠️ HYPOTHERMIA',
          severity: 'moderate',
          evidence: [`Temperature: ${exposureAssessment.temperature}°C`],
          solutions: [
            'Remove wet clothing',
            'Provide passive rewarming',
            'Avoid aggressive rewarming (risk of afterdrop)',
            'Monitor for arrhythmias',
          ],
        });
      } else if (exposureAssessment.temperature > 38.5) {
        problems.push({
          id: 'fever',
          name: '⚠️ FEVER',
          severity: 'moderate',
          evidence: [`Temperature: ${exposureAssessment.temperature}°C`],
          solutions: [
            'Paracetamol: 15 mg/kg per dose',
            'Ibuprofen: 10 mg/kg per dose',
            'Tepid sponging',
            'Investigate source of fever',
          ],
        });
      }
    }

    return problems;
  };

  const handleProblemIdentification = () => {
    const problems = identifyProblems();
    setClinicalProblems(problems);
    setStep('solutions');
  };

  // ============================================================================
  // RESET FUNCTION
  // ============================================================================

  const handleReset = () => {
    setStep('patient_data');
    setBlsAlsActivated(false);
    setPatientData({
      age: { years: 0, months: 0 },
      weight: 0,
      calculatedParameters: {
        minUrineOutput: 0,
        normalSystolicBP: { min: 0, max: 0 },
        normalHeartRateMin: 0,
        normalHeartRateMax: 0,
        normalRRMin: 0,
        normalRRMax: 0,
        ettSize: 0,
        suctionCatheterSize: 0,
        fluidBolus: 0,
        epinephrineIV: 0,
        epinephrineIO: 0,
        amiodarone: 0,
      },
    });
    setSignsOfLife({ breathing: null, pulse: null, responsiveness: null });
    setAirwayAssessment({ patency: null, secretions: [], obstructionType: null, interventionsPerformed: [], reassessmentResult: null });
    setBreathingAssessment({ isBreathing: null, respiratoryRate: null, workOfBreathing: null, spO2: null, breathSounds: null, interventionsPerformed: [] });
    setCirculationAssessment({ hasPulse: null, heartRate: null, systolicBP: null, capillaryRefill: null, skinPerfusion: null, urineMeasured: null, shockType: null, interventionsPerformed: [] });
    setDisabilityAssessment({ avpu: null, pupilResponse: null, bloodGlucose: null, interventionsPerformed: [] });
    setExposureAssessment({ temperature: null, rash: false, injuries: [], interventionsPerformed: [] });
    setClinicalProblems([]);
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Clinical Assessment</h1>
          <p className="text-slate-300">Pediatric Resuscitation - Real-time Decision Support</p>
        </div>

        {/* STEP 1: Patient Data */}
        {step === 'patient_data' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Step 1: Patient Data</CardTitle>
              <CardDescription>Enter patient age and weight (system will calculate if blank)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age-years" className="text-slate-200">Age (Years)</Label>
                  <Input
                    id="age-years"
                    type="number"
                    min="0"
                    max="18"
                    value={patientData.age.years}
                    onChange={(e) => setPatientData({ ...patientData, age: { ...patientData.age, years: parseInt(e.target.value) || 0 } })}
                    className="mt-2 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="age-months" className="text-slate-200">Age (Months)</Label>
                  <Input
                    id="age-months"
                    type="number"
                    min="0"
                    max="11"
                    value={patientData.age.months}
                    onChange={(e) => setPatientData({ ...patientData, age: { ...patientData.age, months: parseInt(e.target.value) || 0 } })}
                    className="mt-2 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="weight" className="text-slate-200">Weight (kg) - Optional</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  step="0.1"
                  value={patientData.weight || ''}
                  onChange={(e) => setPatientData({ ...patientData, weight: parseFloat(e.target.value) || 0 })}
                  placeholder="Leave blank to auto-calculate"
                  className="mt-2 bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <Button onClick={handlePatientDataSubmit} className="w-full bg-blue-600 hover:bg-blue-700">
                Continue to Signs of Life <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Signs of Life */}
        {step === 'signs_of_life' && (
          <div className="space-y-6">
            {/* Patient Summary */}
            <Card className="bg-blue-900 border-blue-700">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-blue-200">Age</p>
                    <p className="font-bold text-white">{patientData.age.years}y {patientData.age.months}m</p>
                  </div>
                  <div>
                    <p className="text-blue-200">Weight</p>
                    <p className="font-bold text-white">{patientData.weight.toFixed(1)} kg</p>
                  </div>
                  <div>
                    <p className="text-blue-200">ETT Size</p>
                    <p className="font-bold text-white">{patientData.calculatedParameters.ettSize.toFixed(1)} mm</p>
                  </div>
                  <div>
                    <p className="text-blue-200">Fluid Bolus</p>
                    <p className="font-bold text-white">{patientData.calculatedParameters.fluidBolus.toFixed(0)} mL</p>
                  </div>
                  <div>
                    <p className="text-blue-200">Epi IV</p>
                    <p className="font-bold text-white">{patientData.calculatedParameters.epinephrineIV.toFixed(2)} mg</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Signs of Life Assessment */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Signs of Life Check</CardTitle>
                <CardDescription>Is the child breathing and/or has a pulse?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-slate-200 font-semibold mb-3">Is the child BREATHING?</p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setSignsOfLife({ ...signsOfLife, breathing: true })}
                      variant={signsOfLife.breathing === true ? 'default' : 'outline'}
                      className={signsOfLife.breathing === true ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      ✓ YES - Breathing
                    </Button>
                    <Button
                      onClick={() => setSignsOfLife({ ...signsOfLife, breathing: false })}
                      variant={signsOfLife.breathing === false ? 'default' : 'outline'}
                      className={signsOfLife.breathing === false ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      ✗ NO - Apnea
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-slate-200 font-semibold mb-3">Does the child have a PULSE?</p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setSignsOfLife({ ...signsOfLife, pulse: true })}
                      variant={signsOfLife.pulse === true ? 'default' : 'outline'}
                      className={signsOfLife.pulse === true ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      ✓ YES - Pulse present
                    </Button>
                    <Button
                      onClick={() => setSignsOfLife({ ...signsOfLife, pulse: false })}
                      variant={signsOfLife.pulse === false ? 'default' : 'outline'}
                      className={signsOfLife.pulse === false ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      ✗ NO - Pulseless
                    </Button>
                  </div>
                </div>

                <Button onClick={handleSignsOfLifeSubmit} className="w-full bg-blue-600 hover:bg-blue-700">
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 3: Airway Assessment */}
        {step === 'airway' && !blsAlsActivated && (
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Airway Assessment (A)</CardTitle>
                <CardDescription>Assess airway patency and management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-slate-200 font-semibold mb-3">Airway Patency</p>
                  <div className="space-y-2">
                    {[
                      { value: 'patent', label: '✓ Patent - Normal sounds, can speak/cry' },
                      { value: 'at_risk', label: '⚠️ At Risk - Stridor, grunting, snoring' },
                      { value: 'obstructed', label: '🚨 Obstructed - Silent, unable to vocalize' },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        onClick={() => setAirwayAssessment({ ...airwayAssessment, patency: option.value as any })}
                        variant={airwayAssessment.patency === option.value ? 'default' : 'outline'}
                        className="w-full justify-start text-left"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {airwayAssessment.patency && (
                  <Button onClick={() => setStep('breathing')} className="w-full bg-blue-600 hover:bg-blue-700">
                    Continue to Breathing <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 4: Breathing Assessment */}
        {step === 'breathing' && !blsAlsActivated && (
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Breathing Assessment (B)</CardTitle>
                <CardDescription>Assess respiratory status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-slate-200 font-semibold mb-3">Is the child breathing adequately?</p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setBreathingAssessment({ ...breathingAssessment, isBreathing: true })}
                      variant={breathingAssessment.isBreathing === true ? 'default' : 'outline'}
                      className={breathingAssessment.isBreathing === true ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      ✓ YES
                    </Button>
                    <Button
                      onClick={() => setBreathingAssessment({ ...breathingAssessment, isBreathing: false })}
                      variant={breathingAssessment.isBreathing === false ? 'default' : 'outline'}
                      className={breathingAssessment.isBreathing === false ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      ✗ NO
                    </Button>
                  </div>
                </div>

                {breathingAssessment.isBreathing && (
                  <div>
                    <Label htmlFor="rr" className="text-slate-200">Respiratory Rate (breaths/min)</Label>
                    <Input
                      id="rr"
                      type="number"
                      value={breathingAssessment.respiratoryRate || ''}
                      onChange={(e) => setBreathingAssessment({ ...breathingAssessment, respiratoryRate: parseInt(e.target.value) || null })}
                      className="mt-2 bg-slate-700 border-slate-600 text-white"
                      placeholder="e.g., 24"
                    />
                    <p className="text-slate-400 text-sm mt-1">
                      Normal: {patientData.calculatedParameters.normalRRMin}-{patientData.calculatedParameters.normalRRMax}
                    </p>
                  </div>
                )}

                {breathingAssessment.isBreathing && (
                  <div>
                    <Label htmlFor="spo2" className="text-slate-200">SpO2 (%)</Label>
                    <Input
                      id="spo2"
                      type="number"
                      value={breathingAssessment.spO2 || ''}
                      onChange={(e) => setBreathingAssessment({ ...breathingAssessment, spO2: parseInt(e.target.value) || null })}
                      className="mt-2 bg-slate-700 border-slate-600 text-white"
                      placeholder="e.g., 95"
                    />
                  </div>
                )}

                <Button onClick={() => setStep('circulation')} className="w-full bg-blue-600 hover:bg-blue-700">
                  Continue to Circulation <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 5: Circulation Assessment */}
        {step === 'circulation' && !blsAlsActivated && (
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Circulation Assessment (C)</CardTitle>
                <CardDescription>Assess cardiovascular status and perfusion</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-slate-200 font-semibold mb-3">Does the child have a PULSE?</p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setCirculationAssessment({ ...circulationAssessment, hasPulse: true })}
                      variant={circulationAssessment.hasPulse === true ? 'default' : 'outline'}
                      className={circulationAssessment.hasPulse === true ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      ✓ YES
                    </Button>
                    <Button
                      onClick={() => setCirculationAssessment({ ...circulationAssessment, hasPulse: false })}
                      variant={circulationAssessment.hasPulse === false ? 'default' : 'outline'}
                      className={circulationAssessment.hasPulse === false ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      ✗ NO
                    </Button>
                  </div>
                </div>

                {circulationAssessment.hasPulse && (
                  <>
                    <div>
                      <Label htmlFor="hr" className="text-slate-200">Heart Rate (bpm)</Label>
                      <Input
                        id="hr"
                        type="number"
                        value={circulationAssessment.heartRate || ''}
                        onChange={(e) => setCirculationAssessment({ ...circulationAssessment, heartRate: parseInt(e.target.value) || null })}
                        className="mt-2 bg-slate-700 border-slate-600 text-white"
                        placeholder="e.g., 110"
                      />
                      <p className="text-slate-400 text-sm mt-1">
                        Normal: {patientData.calculatedParameters.normalHeartRateMin}-{patientData.calculatedParameters.normalHeartRateMax}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="sbp" className="text-slate-200">Systolic BP (mmHg)</Label>
                      <Input
                        id="sbp"
                        type="number"
                        value={circulationAssessment.systolicBP || ''}
                        onChange={(e) => setCirculationAssessment({ ...circulationAssessment, systolicBP: parseInt(e.target.value) || null })}
                        className="mt-2 bg-slate-700 border-slate-600 text-white"
                        placeholder="e.g., 95"
                      />
                      <p className="text-slate-400 text-sm mt-1">
                        Normal: {patientData.calculatedParameters.normalSystolicBP.min}-{patientData.calculatedParameters.normalSystolicBP.max}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-200 font-semibold mb-3">Skin Perfusion</p>
                      <div className="space-y-2">
                        {[
                          { value: 'warm', label: '✓ Warm - Normal perfusion' },
                          { value: 'cool', label: '⚠️ Cool - Delayed perfusion' },
                          { value: 'cold', label: '🚨 Cold - Severe hypoperfusion' },
                        ].map((option) => (
                          <Button
                            key={option.value}
                            onClick={() => setCirculationAssessment({ ...circulationAssessment, skinPerfusion: option.value })}
                            variant={circulationAssessment.skinPerfusion === option.value ? 'default' : 'outline'}
                            className="w-full justify-start text-left"
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-slate-200 font-semibold mb-3">Shock Type (if present)</p>
                      <div className="space-y-2">
                        {[
                          { value: 'none', label: '✓ No shock' },
                          { value: 'hypovolemic', label: '🚨 Hypovolemic - Cool, tachycardic' },
                          { value: 'septic', label: '🚨 Septic - Fever, tachycardic' },
                        ].map((option) => (
                          <Button
                            key={option.value}
                            onClick={() => setCirculationAssessment({ ...circulationAssessment, shockType: option.value })}
                            variant={circulationAssessment.shockType === option.value ? 'default' : 'outline'}
                            className="w-full justify-start text-left"
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Button onClick={() => setStep('disability')} className="w-full bg-blue-600 hover:bg-blue-700">
                  Continue to Disability <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 6: Disability Assessment */}
        {step === 'disability' && !blsAlsActivated && (
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Disability Assessment (D)</CardTitle>
                <CardDescription>Assess neurological status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-slate-200 font-semibold mb-3">AVPU - Responsiveness</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'A', label: 'A - Alert' },
                      { value: 'V', label: 'V - Verbal' },
                      { value: 'P', label: 'P - Pain' },
                      { value: 'U', label: 'U - Unresponsive' },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        onClick={() => setDisabilityAssessment({ ...disabilityAssessment, avpu: option.value as any })}
                        variant={disabilityAssessment.avpu === option.value ? 'default' : 'outline'}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="glucose" className="text-slate-200">Blood Glucose (mg/dL)</Label>
                  <Input
                    id="glucose"
                    type="number"
                    value={disabilityAssessment.bloodGlucose || ''}
                    onChange={(e) => setDisabilityAssessment({ ...disabilityAssessment, bloodGlucose: parseInt(e.target.value) || null })}
                    className="mt-2 bg-slate-700 border-slate-600 text-white"
                    placeholder="e.g., 110"
                  />
                </div>

                <Button onClick={() => setStep('exposure')} className="w-full bg-blue-600 hover:bg-blue-700">
                  Continue to Exposure <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 7: Exposure Assessment */}
        {step === 'exposure' && !blsAlsActivated && (
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Exposure Assessment (E)</CardTitle>
                <CardDescription>Assess environment and injuries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="temp" className="text-slate-200">Temperature (°C)</Label>
                  <Input
                    id="temp"
                    type="number"
                    step="0.1"
                    value={exposureAssessment.temperature || ''}
                    onChange={(e) => setExposureAssessment({ ...exposureAssessment, temperature: parseFloat(e.target.value) || null })}
                    className="mt-2 bg-slate-700 border-slate-600 text-white"
                    placeholder="e.g., 37.5"
                  />
                </div>

                <div>
                  <p className="text-slate-200 font-semibold mb-3">Rash Present?</p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setExposureAssessment({ ...exposureAssessment, rash: true })}
                      variant={exposureAssessment.rash === true ? 'default' : 'outline'}
                      className={exposureAssessment.rash === true ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      ✓ YES
                    </Button>
                    <Button
                      onClick={() => setExposureAssessment({ ...exposureAssessment, rash: false })}
                      variant={exposureAssessment.rash === false ? 'default' : 'outline'}
                    >
                      ✗ NO
                    </Button>
                  </div>
                </div>

                <Button onClick={handleProblemIdentification} className="w-full bg-blue-600 hover:bg-blue-700">
                  Identify Problems <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 8: Problem Identification & Solutions */}
        {(step === 'problem_identification' || step === 'solutions') && (
          <div className="space-y-6">
            {clinicalProblems.map((problem) => (
              <Card key={problem.id} className={`bg-slate-800 border-2 ${
                problem.severity === 'critical' ? 'border-red-600' :
                problem.severity === 'high' ? 'border-orange-600' :
                problem.severity === 'moderate' ? 'border-yellow-600' : 'border-blue-600'
              }`}>
                <CardHeader>
                  <CardTitle className="text-white">{problem.name}</CardTitle>
                  <Badge className={
                    problem.severity === 'critical' ? 'bg-red-600' :
                    problem.severity === 'high' ? 'bg-orange-600' :
                    problem.severity === 'moderate' ? 'bg-yellow-600' : 'bg-blue-600'
                  }>
                    {problem.severity.toUpperCase()}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-slate-200 font-semibold mb-2">Evidence:</h4>
                    <ul className="list-disc list-inside text-slate-300 space-y-1">
                      {problem.evidence.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-slate-200 font-semibold mb-2">Solutions:</h4>
                    <ul className="list-disc list-inside text-slate-300 space-y-1">
                      {problem.solutions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex gap-3">
              <Button onClick={() => setStep('case_completion')} className="flex-1 bg-green-600 hover:bg-green-700">
                Case Complete <CheckCircle2 className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={handleReset} variant="outline" className="flex-1 border-slate-600 text-slate-200 hover:bg-slate-700">
                New Case <RotateCcw className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 9: Case Completion */}
        {step === 'case_completion' && (
          <Card className="bg-green-900 border-green-700">
            <CardHeader>
              <CardTitle className="text-white">✓ Case Completed</CardTitle>
              <CardDescription>Summary of assessment and management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-800 p-4 rounded">
                  <p className="text-green-200 text-sm">Patient Age</p>
                  <p className="font-bold text-white">{patientData.age.years}y {patientData.age.months}m</p>
                </div>
                <div className="bg-green-800 p-4 rounded">
                  <p className="text-green-200 text-sm">Weight</p>
                  <p className="font-bold text-white">{patientData.weight.toFixed(1)} kg</p>
                </div>
                <div className="bg-green-800 p-4 rounded">
                  <p className="text-green-200 text-sm">Problems Identified</p>
                  <p className="font-bold text-white">{clinicalProblems.length}</p>
                </div>
                <div className="bg-green-800 p-4 rounded">
                  <p className="text-green-200 text-sm">Critical Issues</p>
                  <p className="font-bold text-white">{clinicalProblems.filter(p => p.severity === 'critical').length}</p>
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-3">Problems Identified:</h4>
                <ul className="space-y-2">
                  {clinicalProblems.map((p) => (
                    <li key={p.id} className="text-slate-300 flex items-start gap-2">
                      <span className={`font-bold ${
                        p.severity === 'critical' ? 'text-red-400' :
                        p.severity === 'high' ? 'text-orange-400' :
                        p.severity === 'moderate' ? 'text-yellow-400' : 'text-blue-400'
                      }`}>•</span>
                      {p.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleReset} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Start New Case <RotateCcw className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
