'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, Zap, Clock } from 'lucide-react';

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

interface ClinicalIntervention {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  evidence: string[];
  interventions: string[];
  actionTaken?: boolean;
}

type WorkflowStep =
  | 'patient_data'
  | 'signs_of_life'
  | 'airway'
  | 'breathing'
  | 'circulation'
  | 'disability'
  | 'exposure'
  | 'case_completion';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ClinicalAssessment() {
  const [step, setStep] = useState<WorkflowStep>('patient_data');
  const [caseStartTime] = useState(new Date());
  const [blsAlsActivated, setBlsAlsActivated] = useState(false);
  const [activeIntervention, setActiveIntervention] = useState<ClinicalIntervention | null>(null);
  const [completedInterventions, setCompletedInterventions] = useState<string[]>([]);

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
  const [signsOfLife, setSignsOfLife] = useState({
    breathing: null as boolean | null,
    pulse: null as boolean | null,
  });

  const [airwayData, setAirwayData] = useState({
    patency: null as string | null,
    secretions: false,
    obstructionType: null as string | null,
  });

  const [breathingData, setBreathingData] = useState({
    isBreathing: null as boolean | null,
    respiratoryRate: null as number | null,
    spO2: null as number | null,
  });

  const [circulationData, setCirculationData] = useState({
    hasPulse: null as boolean | null,
    heartRate: null as number | null,
    systolicBP: null as number | null,
    skinPerfusion: null as string | null,
  });

  const [disabilityData, setDisabilityData] = useState({
    avpu: null as string | null,
    bloodGlucose: null as number | null,
    glucoseUnit: 'mg/dL' as 'mg/dL' | 'mmol/L',
  });

  const [exposureData, setExposureData] = useState({
    temperature: null as number | null,
    rash: false,
  });

  // ============================================================================
  // GLUCOSE UNIT CONVERSION
  // ============================================================================

  const convertGlucose = (value: number, fromUnit: 'mg/dL' | 'mmol/L', toUnit: 'mg/dL' | 'mmol/L'): number => {
    if (fromUnit === toUnit) return value;
    if (fromUnit === 'mg/dL' && toUnit === 'mmol/L') {
      return Math.round((value / 18) * 10) / 10;
    }
    if (fromUnit === 'mmol/L' && toUnit === 'mg/dL') {
      return Math.round(value * 18);
    }
    return value;
  };

  const getGlucoseNormalRange = (unit: 'mg/dL' | 'mmol/L'): { min: number; max: number } => {
    if (unit === 'mg/dL') {
      return { min: 70, max: 100 };
    }
    return { min: 3.9, max: 5.6 };
  };

  // ============================================================================
  // WEIGHT CALCULATION (AHA ECC 2020)
  // ============================================================================

  const calculateWeightFromAge = (years: number, months: number): number => {
    const totalMonths = years * 12 + months;
    if (totalMonths < 12) return (totalMonths + 9) / 2;
    if (totalMonths < 60) return (years + 4) * 2;
    return years * 4;
  };

  const calculateParameters = (weight: number, years: number): PatientData['calculatedParameters'] => {
    return {
      minUrineOutput: weight * 1,
      normalSystolicBP: {
        min: Math.max(70, 90 + 2 * years - 10),
        max: 90 + 2 * years + 10,
      },
      normalHeartRateMin: years < 1 ? 100 : years < 3 ? 95 : years < 6 ? 80 : 70,
      normalHeartRateMax: years < 1 ? 160 : years < 3 ? 150 : years < 6 ? 140 : 100,
      normalRRMin: years < 1 ? 30 : years < 3 ? 25 : years < 6 ? 20 : 16,
      normalRRMax: years < 1 ? 60 : years < 3 ? 40 : years < 6 ? 30 : 20,
      ettSize: Math.round((years / 4 + 4) * 10) / 10,
      suctionCatheterSize: Math.round((years / 4 + 4) * 2 * 10) / 10,
      fluidBolus: weight * 20,
      epinephrineIV: weight * 0.01,
      epinephrineIO: weight * 0.1,
      amiodarone: weight * 5,
    };
  };

  // ============================================================================
  // REAL-TIME INTERVENTION DETECTION
  // ============================================================================

  const detectAirwayIntervention = (): ClinicalIntervention | null => {
    if (airwayData.patency === 'obstructed') {
      return {
        id: 'airway_obstruction',
        name: '🚨 AIRWAY OBSTRUCTION - STOP AND INTERVENE',
        severity: 'critical',
        evidence: ['Complete airway obstruction detected'],
        interventions: [
          'Position child upright immediately',
          'Prepare for emergency airway management',
          'Notify anesthesia/ENT immediately',
          'Have emergency tracheostomy kit available',
          'Consider emergency needle cricothyrotomy if complete obstruction',
        ],
      };
    }

    if (airwayData.patency === 'at_risk' && airwayData.obstructionType === 'upper_airway') {
      return {
        id: 'upper_airway_obstruction',
        name: '⚠️ UPPER AIRWAY OBSTRUCTION (Stridor) - INTERVENE',
        severity: 'high',
        evidence: ['Stridor present - upper airway obstruction'],
        interventions: [
          'Provide supplemental oxygen immediately',
          'Nebulized epinephrine: 0.5 mL of 1:1000 in 3-5 mL NS',
          'Prepare for emergency airway management',
          'Monitor closely for complete obstruction',
          `ETT Size: ${patientData.calculatedParameters.ettSize.toFixed(1)} mm`,
        ],
      };
    }

    if (airwayData.patency === 'at_risk' && airwayData.obstructionType === 'lower_airway') {
      return {
        id: 'lower_airway_obstruction',
        name: '⚠️ LOWER AIRWAY OBSTRUCTION (Wheeze) - INTERVENE',
        severity: 'high',
        evidence: ['Wheezing present - lower airway obstruction'],
        interventions: [
          'Provide supplemental oxygen immediately',
          'Albuterol nebulizer: 2.5-5 mg in 3 mL NS',
          'Consider systemic steroids (dexamethasone 0.6 mg/kg)',
          'Prepare for potential intubation',
          `ETT Size: ${patientData.calculatedParameters.ettSize.toFixed(1)} mm`,
        ],
      };
    }

    return null;
  };

  const detectBreathingIntervention = (): ClinicalIntervention | null => {
    if (!breathingData.isBreathing) {
      return {
        id: 'apnea',
        name: '🚨 APNEA - NO BREATHING - STOP AND INTERVENE',
        severity: 'critical',
        evidence: ['No spontaneous breathing detected'],
        interventions: [
          'Begin bag-valve-mask ventilation NOW',
          'Rate: ' + (patientData.age.years < 1 ? '40-60' : patientData.age.years < 8 ? '20' : '12-16') + ' breaths/min',
          `ETT Size: ${patientData.calculatedParameters.ettSize.toFixed(1)} mm`,
          'Prepare for intubation',
          'Obtain IV/IO access',
          'Consider causes: airway obstruction, CNS depression, neuromuscular',
        ],
      };
    }

    if (breathingData.respiratoryRate !== null && breathingData.respiratoryRate < patientData.calculatedParameters.normalRRMin) {
      return {
        id: 'bradypnea',
        name: '🚨 BRADYPNEA (Slow Breathing) - INTERVENE',
        severity: 'critical',
        evidence: [`RR ${breathingData.respiratoryRate} (normal: ${patientData.calculatedParameters.normalRRMin}-${patientData.calculatedParameters.normalRRMax})`],
        interventions: [
          'Provide supplemental oxygen immediately',
          'Begin assisted ventilation',
          'Assess for CNS depression or neuromuscular weakness',
          'Prepare for intubation if deteriorating',
        ],
      };
    }

    if (breathingData.spO2 !== null && breathingData.spO2 < 90) {
      return {
        id: 'hypoxemia',
        name: '🚨 HYPOXEMIA (SpO2 <90%) - STOP AND INTERVENE',
        severity: 'critical',
        evidence: [`SpO2 ${breathingData.spO2}% (target: >94%)`],
        interventions: [
          'Provide high-flow oxygen (15 L/min) immediately',
          'Assess airway patency',
          'Consider assisted ventilation',
          'Prepare for intubation if SpO2 <85%',
          'Check pulse oximeter placement',
        ],
      };
    }

    if (breathingData.respiratoryRate !== null && breathingData.respiratoryRate > patientData.calculatedParameters.normalRRMax) {
      return {
        id: 'tachypnea',
        name: '⚠️ TACHYPNEA (Fast Breathing) - MONITOR',
        severity: 'moderate',
        evidence: [`RR ${breathingData.respiratoryRate} (normal: ${patientData.calculatedParameters.normalRRMin}-${patientData.calculatedParameters.normalRRMax})`],
        interventions: [
          'Provide supplemental oxygen',
          'Assess for metabolic acidosis',
          'Monitor for respiratory fatigue',
          'Consider underlying causes: fever, pain, anxiety, metabolic',
        ],
      };
    }

    return null;
  };

  const detectCirculationIntervention = (): ClinicalIntervention | null => {
    if (circulationData.systolicBP !== null && circulationData.systolicBP < patientData.calculatedParameters.normalSystolicBP.min) {
      return {
        id: 'hypotension_shock',
        name: '🚨 HYPOTENSION/SHOCK - STOP AND INTERVENE',
        severity: 'critical',
        evidence: [
          `SBP ${circulationData.systolicBP} (normal: ${patientData.calculatedParameters.normalSystolicBP.min}-${patientData.calculatedParameters.normalSystolicBP.max})`,
          circulationData.skinPerfusion === 'cool' ? 'Cool extremities' : '',
        ].filter(Boolean),
        interventions: [
          'Obtain IV/IO access immediately',
          `Fluid bolus: ${patientData.calculatedParameters.fluidBolus.toFixed(0)} mL (20 mL/kg) over 15 min`,
          'Elevate legs (Trendelenburg position)',
          'Assess perfusion after bolus',
          `If no improvement: Epinephrine IV ${patientData.calculatedParameters.epinephrineIV.toFixed(2)} mg`,
          'Identify and treat underlying cause',
        ],
      };
    }

    if (circulationData.heartRate !== null && circulationData.heartRate > patientData.calculatedParameters.normalHeartRateMax) {
      return {
        id: 'tachycardia',
        name: '⚠️ TACHYCARDIA - ASSESS CAUSE',
        severity: 'moderate',
        evidence: [`HR ${circulationData.heartRate} (normal: ${patientData.calculatedParameters.normalHeartRateMin}-${patientData.calculatedParameters.normalHeartRateMax})`],
        interventions: [
          'Assess for underlying cause: pain, fever, hypovolemia, anxiety',
          'Provide oxygen if SpO2 low',
          'Establish IV access',
          'Monitor cardiac rhythm',
          'Treat underlying cause',
        ],
      };
    }

    return null;
  };

  const detectDisabilityIntervention = (): ClinicalIntervention | null => {
    if (disabilityData.bloodGlucose !== null && disabilityData.bloodGlucose < 60) {
      return {
        id: 'hypoglycemia',
        name: '🚨 HYPOGLYCEMIA - INTERVENE',
        severity: 'high',
        evidence: [`Blood glucose ${disabilityData.bloodGlucose} mg/dL (normal: 70-100)`],
        interventions: [
          'If IV access: 0.5 g/kg dextrose IV (D25W or D50W)',
          'If no IV: Glucose gel or juice PO',
          'Recheck glucose in 15 minutes',
          'Identify cause (sepsis, malnutrition, medication)',
        ],
      };
    }

    return null;
  };

  const detectExposureIntervention = (): ClinicalIntervention | null => {
    if (exposureData.rash && exposureData.temperature !== null && exposureData.temperature > 38) {
      return {
        id: 'sepsis_rash',
        name: '🚨 FEVER + RASH - SEPSIS PROTOCOL',
        severity: 'critical',
        evidence: ['Fever with rash - possible meningococcal sepsis'],
        interventions: [
          'Activate sepsis protocol immediately',
          `Ceftriaxone: ${(patientData.weight * 80).toFixed(0)} mg IV/IO (80 mg/kg, max 4g)`,
          'Obtain blood cultures before antibiotics',
          'Start IV fluid resuscitation',
          'Notify infectious diseases',
          'Consider ICU admission',
        ],
      };
    }

    return null;
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handlePatientDataSubmit = () => {
    let weight = patientData.weight;
    if (weight === 0) {
      weight = calculateWeightFromAge(patientData.age.years, patientData.age.months);
    }

    const params = calculateParameters(weight, patientData.age.years);
    setPatientData({
      ...patientData,
      weight,
      calculatedParameters: params,
    });

    setStep('signs_of_life');
  };

  const handleSignsOfLife = (breathing: boolean, pulse: boolean) => {
    setSignsOfLife({ breathing, pulse });

    if (!breathing && !pulse) {
      setBlsAlsActivated(true);
      setActiveIntervention({
        id: 'cardiac_arrest',
        name: '🚨 CARDIAC ARREST - BLS/ALS PROTOCOL',
        severity: 'critical',
        evidence: ['No breathing', 'No pulse'],
        interventions: [
          'Start chest compressions immediately',
          `Compression rate: ${patientData.age.years < 1 ? '100-120' : '100-120'} compressions/min`,
          `Compression depth: ${patientData.age.years < 1 ? '1.5 inches (4 cm)' : '2 inches (5 cm) or 1/3 chest depth'}`,
          'Provide 2 rescue breaths after every 30 compressions',
          'Obtain IV/IO access',
          `Epinephrine IV: ${patientData.calculatedParameters.epinephrineIV.toFixed(2)} mg every 3-5 min`,
          `ETT Size: ${patientData.calculatedParameters.ettSize.toFixed(1)} mm`,
          'Activate emergency response team',
        ],
      });
    } else {
      setStep('airway');
    }
  };

  const handleAirwayComplete = () => {
    const intervention = detectAirwayIntervention();
    if (intervention) {
      setActiveIntervention(intervention);
    } else {
      setStep('breathing');
    }
  };

  const handleBreathingComplete = () => {
    const intervention = detectBreathingIntervention();
    if (intervention) {
      setActiveIntervention(intervention);
    } else {
      setStep('circulation');
    }
  };

  const handleCirculationComplete = () => {
    const intervention = detectCirculationIntervention();
    if (intervention) {
      setActiveIntervention(intervention);
    } else {
      setStep('disability');
    }
  };

  const handleDisabilityComplete = () => {
    const intervention = detectDisabilityIntervention();
    if (intervention) {
      setActiveIntervention(intervention);
    } else {
      setStep('exposure');
    }
  };

  const handleExposureComplete = () => {
    const intervention = detectExposureIntervention();
    if (intervention) {
      setActiveIntervention(intervention);
    } else {
      setStep('case_completion');
    }
  };

  const handleInterventionComplete = () => {
    if (activeIntervention) {
      setCompletedInterventions([...completedInterventions, activeIntervention.id]);
    }
    setActiveIntervention(null);

    // Continue to next step sequentially (A->B->C->D->E)
    if (step === 'signs_of_life' && blsAlsActivated) {
      setStep('case_completion');
    } else if (step === 'airway') {
      setStep('breathing');
    } else if (step === 'breathing') {
      setStep('circulation');
    } else if (step === 'circulation') {
      setStep('disability');
    } else if (step === 'disability') {
      setStep('exposure');
    } else if (step === 'exposure') {
      setStep('case_completion');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-900';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-900';
      case 'moderate':
        return 'bg-yellow-100 border-yellow-300 text-yellow-900';
      default:
        return 'bg-blue-100 border-blue-300 text-blue-900';
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (activeIntervention) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className={`border-2 ${getSeverityColor(activeIntervention.severity)}`}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Zap className="w-8 h-8" />
                {activeIntervention.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Evidence:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {activeIntervention.evidence.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Immediate Actions:</h3>
                <ul className="list-decimal list-inside space-y-2">
                  {activeIntervention.interventions.map((action, i) => (
                    <li key={i} className="font-medium">
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 space-y-2">
                <Button
                  onClick={handleInterventionComplete}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Intervention Complete - Continue Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Clinical Assessment</h1>
          <p className="text-gray-300">Pediatric Resuscitation - Real-time Decision Support</p>
        </div>

        {/* PATIENT DATA */}
        {step === 'patient_data' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Step 1: Patient Data</CardTitle>
              <CardDescription>Enter patient age and weight (system will calculate if blank)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Age (Years)</Label>
                  <Input
                    type="number"
                    value={patientData.age.years}
                    onChange={(e) =>
                      setPatientData({
                        ...patientData,
                        age: { ...patientData.age, years: parseInt(e.target.value) || 0 },
                      })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Age (Months)</Label>
                  <Input
                    type="number"
                    value={patientData.age.months}
                    onChange={(e) =>
                      setPatientData({
                        ...patientData,
                        age: { ...patientData.age, months: parseInt(e.target.value) || 0 },
                      })
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
                    setPatientData({
                      ...patientData,
                      weight: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <Button onClick={handlePatientDataSubmit} className="w-full bg-orange-600 hover:bg-orange-700">
                Continue to Signs of Life <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* SIGNS OF LIFE */}
        {step === 'signs_of_life' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Step 2: Signs of Life</CardTitle>
              <CardDescription>
                Patient: {patientData.age.years}y {patientData.age.months}m | Weight: {patientData.weight.toFixed(1)} kg
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-300 block mb-3">Is the child BREATHING?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleSignsOfLife(true, signsOfLife.pulse !== null ? signsOfLife.pulse : true)}
                    variant={signsOfLife.breathing === true ? 'default' : 'outline'}
                    className={signsOfLife.breathing === true ? 'bg-green-600' : ''}
                  >
                    ✓ YES
                  </Button>
                  <Button
                    onClick={() => handleSignsOfLife(false, signsOfLife.pulse !== null ? signsOfLife.pulse : true)}
                    variant={signsOfLife.breathing === false ? 'default' : 'outline'}
                    className={signsOfLife.breathing === false ? 'bg-red-600' : ''}
                  >
                    ✗ NO
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-gray-300 block mb-3">Does the child have a PULSE?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleSignsOfLife(signsOfLife.breathing !== null ? signsOfLife.breathing : true, true)}
                    variant={signsOfLife.pulse === true ? 'default' : 'outline'}
                    className={signsOfLife.pulse === true ? 'bg-green-600' : ''}
                  >
                    ✓ YES
                  </Button>
                  <Button
                    onClick={() => handleSignsOfLife(signsOfLife.breathing !== null ? signsOfLife.breathing : true, false)}
                    variant={signsOfLife.pulse === false ? 'default' : 'outline'}
                    className={signsOfLife.pulse === false ? 'bg-red-600' : ''}
                  >
                    ✗ NO
                  </Button>
                </div>
              </div>
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
                <Label className="text-gray-300 block mb-3">Airway Patency</Label>
                <div className="grid grid-cols-1 gap-2">
                  {['patent', 'at_risk', 'obstructed'].map((option) => (
                    <Button
                      key={option}
                      onClick={() => setAirwayData({ ...airwayData, patency: option })}
                      variant={airwayData.patency === option ? 'default' : 'outline'}
                      className={airwayData.patency === option ? 'bg-orange-600' : ''}
                    >
                      {option === 'patent' && '✓ Patent'}
                      {option === 'at_risk' && '⚠️ At Risk'}
                      {option === 'obstructed' && '✗ Obstructed'}
                    </Button>
                  ))}
                </div>
              </div>

              {airwayData.patency === 'at_risk' && (
                <div>
                  <Label className="text-gray-300 block mb-3">Type of Obstruction</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {['upper_airway', 'lower_airway'].map((option) => (
                      <Button
                        key={option}
                        onClick={() => setAirwayData({ ...airwayData, obstructionType: option })}
                        variant={airwayData.obstructionType === option ? 'default' : 'outline'}
                        className={airwayData.obstructionType === option ? 'bg-orange-600' : ''}
                      >
                        {option === 'upper_airway' && 'Upper Airway (Stridor)'}
                        {option === 'lower_airway' && 'Lower Airway (Wheeze)'}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={handleAirwayComplete} className="w-full bg-orange-600 hover:bg-orange-700">
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
                      onChange={(e) => setBreathingData({ ...breathingData, respiratoryRate: parseInt(e.target.value) || null })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">SpO2 (%)</Label>
                    <Input
                      type="number"
                      value={breathingData.spO2 || ''}
                      onChange={(e) => setBreathingData({ ...breathingData, spO2: parseInt(e.target.value) || null })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </>
              )}

              <Button onClick={handleBreathingComplete} className="w-full bg-orange-600 hover:bg-orange-700">
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
                    <Label className="text-gray-300">Heart Rate (bpm)</Label>
                    <Input
                      type="number"
                      value={circulationData.heartRate || ''}
                      onChange={(e) => setCirculationData({ ...circulationData, heartRate: parseInt(e.target.value) || null })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Systolic BP (mmHg)</Label>
                    <Input
                      type="number"
                      value={circulationData.systolicBP || ''}
                      onChange={(e) => setCirculationData({ ...circulationData, systolicBP: parseInt(e.target.value) || null })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300 block mb-3">Skin Perfusion</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {['warm', 'cool', 'cold'].map((option) => (
                        <Button
                          key={option}
                          onClick={() => setCirculationData({ ...circulationData, skinPerfusion: option })}
                          variant={circulationData.skinPerfusion === option ? 'default' : 'outline'}
                          className={circulationData.skinPerfusion === option ? 'bg-orange-600' : ''}
                        >
                          {option === 'warm' && '✓ Warm'}
                          {option === 'cool' && '⚠️ Cool'}
                          {option === 'cold' && '✗ Cold'}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Button onClick={handleCirculationComplete} className="w-full bg-orange-600 hover:bg-orange-700">
                Continue to Disability <ArrowRight className="w-4 h-4 ml-2" />
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
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-gray-300">Blood Glucose ({disabilityData.glucoseUnit})</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setDisabilityData({ ...disabilityData, glucoseUnit: 'mg/dL' })}
                      variant={disabilityData.glucoseUnit === 'mg/dL' ? 'default' : 'outline'}
                      className={disabilityData.glucoseUnit === 'mg/dL' ? 'bg-blue-600 h-8' : 'h-8'}
                    >
                      mg/dL
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setDisabilityData({ ...disabilityData, glucoseUnit: 'mmol/L' })}
                      variant={disabilityData.glucoseUnit === 'mmol/L' ? 'default' : 'outline'}
                      className={disabilityData.glucoseUnit === 'mmol/L' ? 'bg-blue-600 h-8' : 'h-8'}
                    >
                      mmol/L
                    </Button>
                  </div>
                </div>
                <Input
                  type="number"
                  step="0.1"
                  value={disabilityData.bloodGlucose || ''}
                  onChange={(e) => setDisabilityData({ ...disabilityData, bloodGlucose: parseFloat(e.target.value) || null })}
                  placeholder={disabilityData.glucoseUnit === 'mg/dL' ? 'e.g., 95' : 'e.g., 5.3'}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {disabilityData.glucoseUnit === 'mg/dL' ? 'Normal: 70-100 mg/dL' : 'Normal: 3.9-5.6 mmol/L'}
                </p>
              </div>

              <Button onClick={handleDisabilityComplete} className="w-full bg-orange-600 hover:bg-orange-700">
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
                  onChange={(e) => setExposureData({ ...exposureData, temperature: parseFloat(e.target.value) || null })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300 block mb-3">Rash Present?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setExposureData({ ...exposureData, rash: true })}
                    variant={exposureData.rash ? 'default' : 'outline'}
                    className={exposureData.rash ? 'bg-red-600' : ''}
                  >
                    ✓ YES
                  </Button>
                  <Button
                    onClick={() => setExposureData({ ...exposureData, rash: false })}
                    variant={!exposureData.rash ? 'default' : 'outline'}
                    className={!exposureData.rash ? 'bg-green-600' : ''}
                  >
                    ✗ NO
                  </Button>
                </div>
              </div>

              <Button onClick={handleExposureComplete} className="w-full bg-orange-600 hover:bg-orange-700">
                Complete Assessment <CheckCircle2 className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* CASE COMPLETION */}
        {step === 'case_completion' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Case Completed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-900 border border-green-700 rounded p-4">
                <p className="text-green-100">
                  ✓ Assessment complete. Total time: {Math.round((new Date().getTime() - caseStartTime.getTime()) / 1000)} seconds
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-gray-300">
                  <strong>Patient:</strong> {patientData.age.years}y {patientData.age.months}m, {patientData.weight.toFixed(1)} kg
                </p>
                <p className="text-gray-300">
                  <strong>Interventions Completed:</strong> {completedInterventions.length}
                </p>
                {blsAlsActivated && <p className="text-red-300"><strong>BLS/ALS Protocol Activated</strong></p>}
              </div>

              <Button
                onClick={() => {
                  setStep('patient_data');
                  setSignsOfLife({ breathing: null, pulse: null });
                  setAirwayData({ patency: null, secretions: false, obstructionType: null });
                  setBreathingData({ isBreathing: null, respiratoryRate: null, spO2: null });
                  setCirculationData({ hasPulse: null, heartRate: null, systolicBP: null, skinPerfusion: null });
                  setDisabilityData({ avpu: null, bloodGlucose: null, glucoseUnit: 'mg/dL' });
                  setExposureData({ temperature: null, rash: false });
                  setBlsAlsActivated(false);
                  setCompletedInterventions([]);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Start New Case
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
