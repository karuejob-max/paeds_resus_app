'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, Zap } from 'lucide-react';

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
  | 'case_completion';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ClinicalAssessment() {
  const [step, setStep] = useState<WorkflowStep>('patient_data');
  const [caseStartTime] = useState(new Date());
  const [blsAlsActivated, setBlsAlsActivated] = useState(false);
  const [realTimeProblems, setRealTimeProblems] = useState<ClinicalProblem[]>([]);

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
    capillaryRefill: null as string | null,
  });

  const [disabilityData, setDisabilityData] = useState({
    avpu: null as string | null,
    bloodGlucose: null as number | null,
  });

  const [exposureData, setExposureData] = useState({
    temperature: null as number | null,
    rash: false,
  });

  // ============================================================================
  // CORRECT WEIGHT CALCULATION FORMULAS (AHA ECC 2020)
  // ============================================================================

  const calculateWeightFromAge = (years: number, months: number): number => {
    const totalMonths = years * 12 + months;

    if (totalMonths < 12) {
      // Infants < 12 months: (age in months + 9) / 2
      return (totalMonths + 9) / 2;
    } else if (totalMonths < 60) {
      // Children 1-5 years: (age in years + 4) × 2
      return (years + 4) * 2;
    } else {
      // Children > 5 years: age in years × 4
      return years * 4;
    }
  };

  const calculateParameters = (weight: number, years: number): PatientData['calculatedParameters'] => {
    return {
      minUrineOutput: weight * 1, // mL/hr
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
      fluidBolus: weight * 20, // mL
      epinephrineIV: weight * 0.01, // mg (0.01 mg/kg)
      epinephrineIO: weight * 0.1, // mg (0.1 mg/kg for IO)
      amiodarone: weight * 5, // mg (5 mg/kg)
    };
  };

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

  // ============================================================================
  // REAL-TIME PROBLEM IDENTIFICATION
  // ============================================================================

  const checkAirwayProblems = () => {
    const problems: ClinicalProblem[] = [];

    if (airwayData.patency === 'obstructed') {
      problems.push({
        id: 'airway_obstruction',
        name: '🚨 AIRWAY OBSTRUCTION - IMMEDIATE ACTION',
        severity: 'critical',
        evidence: ['Complete airway obstruction'],
        solutions: [
          'Position child upright',
          'Prepare for emergency airway management',
          'Notify anesthesia/ENT immediately',
          'Have emergency tracheostomy kit available',
        ],
      });
    } else if (airwayData.patency === 'at_risk') {
      if (airwayData.obstructionType === 'upper_airway') {
        problems.push({
          id: 'upper_airway_obstruction',
          name: '⚠️ UPPER AIRWAY OBSTRUCTION (Stridor)',
          severity: 'high',
          evidence: ['Stridor present'],
          solutions: [
            'Provide supplemental oxygen',
            'Consider nebulized epinephrine (0.5 mL of 1:1000)',
            'Prepare for emergency airway management',
            'Monitor closely for complete obstruction',
          ],
        });
      } else if (airwayData.obstructionType === 'lower_airway') {
        problems.push({
          id: 'lower_airway_obstruction',
          name: '⚠️ LOWER AIRWAY OBSTRUCTION (Wheeze)',
          severity: 'high',
          evidence: ['Wheezing present'],
          solutions: [
            'Provide supplemental oxygen',
            'Administer bronchodilators (albuterol)',
            'Consider systemic steroids',
            'Prepare for potential intubation',
          ],
        });
      }
    }

    return problems;
  };

  const checkBreathingProblems = () => {
    const problems: ClinicalProblem[] = [];

    if (!breathingData.isBreathing) {
      problems.push({
        id: 'apnea',
        name: '🚨 APNEA - NO SPONTANEOUS BREATHING',
        severity: 'critical',
        evidence: ['No spontaneous breathing detected'],
        solutions: [
          'Begin bag-valve-mask ventilation immediately',
          `ETT Size: ${patientData.calculatedParameters.ettSize.toFixed(1)} mm`,
          'Prepare for intubation',
          'Obtain IV/IO access',
          'Consider causes: airway obstruction, CNS depression, neuromuscular',
        ],
      });
    } else if (breathingData.respiratoryRate !== null) {
      if (breathingData.respiratoryRate < patientData.calculatedParameters.normalRRMin) {
        problems.push({
          id: 'bradypnea',
          name: '🚨 BRADYPNEA (Slow Breathing)',
          severity: 'critical',
          evidence: [`RR ${breathingData.respiratoryRate} (normal: ${patientData.calculatedParameters.normalRRMin}-${patientData.calculatedParameters.normalRRMax})`],
          solutions: [
            'Provide supplemental oxygen',
            'Begin assisted ventilation',
            'Assess for CNS depression or neuromuscular weakness',
            'Prepare for intubation if deteriorating',
          ],
        });
      } else if (breathingData.respiratoryRate > patientData.calculatedParameters.normalRRMax) {
        problems.push({
          id: 'tachypnea',
          name: '⚠️ TACHYPNEA (Fast Breathing)',
          severity: 'moderate',
          evidence: [`RR ${breathingData.respiratoryRate} (normal: ${patientData.calculatedParameters.normalRRMin}-${patientData.calculatedParameters.normalRRMax})`],
          solutions: [
            'Provide supplemental oxygen',
            'Assess for metabolic acidosis',
            'Monitor for respiratory fatigue',
            'Consider underlying causes: fever, pain, anxiety, metabolic',
          ],
        });
      }
    }

    if (breathingData.spO2 !== null && breathingData.spO2 < 90) {
      problems.push({
        id: 'hypoxemia',
        name: '🚨 HYPOXEMIA (Low Oxygen)',
        severity: 'critical',
        evidence: [`SpO2 ${breathingData.spO2}% (target: >94%)`],
        solutions: [
          'Provide high-flow oxygen immediately',
          'Assess airway patency',
          'Consider assisted ventilation',
          'Prepare for intubation if SpO2 <85%',
        ],
      });
    }

    return problems;
  };

  const checkCirculationProblems = () => {
    const problems: ClinicalProblem[] = [];

    if (circulationData.heartRate !== null) {
      if (circulationData.heartRate > patientData.calculatedParameters.normalHeartRateMax) {
        problems.push({
          id: 'tachycardia',
          name: '⚠️ TACHYCARDIA',
          severity: 'moderate',
          evidence: [`HR ${circulationData.heartRate} (normal: ${patientData.calculatedParameters.normalHeartRateMin}-${patientData.calculatedParameters.normalHeartRateMax})`],
          solutions: [
            'Assess for shock, pain, fever, anxiety',
            'Provide oxygen and reassurance',
            'Monitor continuously',
          ],
        });
      } else if (circulationData.heartRate < patientData.calculatedParameters.normalHeartRateMin) {
        problems.push({
          id: 'bradycardia',
          name: '🚨 BRADYCARDIA',
          severity: 'critical',
          evidence: [`HR ${circulationData.heartRate} (normal: ${patientData.calculatedParameters.normalHeartRateMin}-${patientData.calculatedParameters.normalHeartRateMax})`],
          solutions: [
            'Assess airway and breathing immediately',
            'Provide high-flow oxygen',
            'Begin chest compressions if HR <60 with poor perfusion',
            `Atropine: ${(patientData.weight * 0.02).toFixed(2)} mg IV (0.02 mg/kg, min 0.1 mg)`,
            'Prepare for pacing if symptomatic',
          ],
        });
      }
    }

    if (circulationData.systolicBP !== null) {
      if (circulationData.systolicBP < patientData.calculatedParameters.normalSystolicBP.min) {
        problems.push({
          id: 'hypotension',
          name: '🚨 HYPOTENSION (Low Blood Pressure)',
          severity: 'critical',
          evidence: [
            `SBP ${circulationData.systolicBP} mmHg (normal: ${patientData.calculatedParameters.normalSystolicBP.min}-${patientData.calculatedParameters.normalSystolicBP.max})`,
          ],
          solutions: [
            `Fluid bolus: ${patientData.calculatedParameters.fluidBolus} mL normal saline IV over 15 min`,
            'Reassess perfusion after bolus',
            'Prepare for second bolus if needed',
            `Epinephrine if unresponsive: ${patientData.calculatedParameters.epinephrineIV.toFixed(2)} mg IV`,
            'Consider vasopressors: norepinephrine, dopamine',
          ],
        });
      }
    }

    if (circulationData.skinPerfusion === 'cool' || circulationData.skinPerfusion === 'cold') {
      const shockType = circulationData.skinPerfusion === 'cold' ? 'SEVERE SHOCK' : 'SHOCK';
      problems.push({
        id: 'poor_perfusion',
        name: `🚨 ${shockType} - Poor Perfusion`,
        severity: 'critical',
        evidence: [`${circulationData.skinPerfusion} extremities`, 'Delayed capillary refill'],
        solutions: [
          `Fluid bolus: ${patientData.calculatedParameters.fluidBolus} mL normal saline IV over 15 min`,
          'Elevate legs if not contraindicated',
          'Provide oxygen',
          `Epinephrine: ${patientData.calculatedParameters.epinephrineIV.toFixed(2)} mg IV every 3-5 min`,
          'Obtain central line for vasopressor infusion',
          'Consider underlying cause: sepsis, hemorrhage, cardiogenic',
        ],
      });
    }

    return problems;
  };

  const checkDisabilityProblems = () => {
    const problems: ClinicalProblem[] = [];

    if (disabilityData.avpu === 'V' || disabilityData.avpu === 'P' || disabilityData.avpu === 'U') {
      const severity = disabilityData.avpu === 'U' ? 'critical' : 'high';
      problems.push({
        id: 'altered_consciousness',
        name: `⚠️ ALTERED CONSCIOUSNESS (${disabilityData.avpu === 'U' ? 'Unresponsive' : 'Responsive to Pain/Voice'})`,
        severity,
        evidence: [`AVPU: ${disabilityData.avpu}`],
        solutions: [
          'Protect airway, consider intubation',
          'Check blood glucose immediately',
          'Assess for hypoglycemia, head injury, infection, toxins',
          'Obtain head CT if trauma suspected',
          'Monitor neurologically every 15 minutes',
        ],
      });
    }

    if (disabilityData.bloodGlucose !== null && disabilityData.bloodGlucose < 70) {
      problems.push({
        id: 'hypoglycemia',
        name: '🚨 HYPOGLYCEMIA',
        severity: 'critical',
        evidence: [`Blood glucose ${disabilityData.bloodGlucose} mg/dL (normal: 70-100)`],
        solutions: [
          `Dextrose: ${(patientData.weight * 0.5).toFixed(1)} mL of 10% dextrose IV (0.5 g/kg)`,
          'Recheck glucose in 15 minutes',
          'Assess for underlying cause',
        ],
      });
    }

    return problems;
  };

  const checkExposureProblems = () => {
    const problems: ClinicalProblem[] = [];

    if (exposureData.temperature !== null) {
      if (exposureData.temperature < 36) {
        problems.push({
          id: 'hypothermia',
          name: '⚠️ HYPOTHERMIA',
          severity: 'high',
          evidence: [`Temperature ${exposureData.temperature}°C (normal: 36.5-37.5°C)`],
          solutions: [
            'Remove wet clothing',
            'Provide passive external rewarming',
            'Avoid aggressive rewarming (risk of afterdrop)',
            'Monitor cardiac rhythm',
          ],
        });
      } else if (exposureData.temperature > 38.5) {
        problems.push({
          id: 'fever',
          name: '⚠️ FEVER',
          severity: 'moderate',
          evidence: [`Temperature ${exposureData.temperature}°C (normal: 36.5-37.5°C)`],
          solutions: [
            'Assess for infection',
            'Consider sepsis protocol if tachycardia/tachypnea present',
            `Antipyretics: Paracetamol ${(patientData.weight * 15).toFixed(0)} mg IV/PO`,
            'Blood cultures if sepsis suspected',
          ],
        });
      }
    }

    if (exposureData.rash) {
      problems.push({
        id: 'rash',
        name: '⚠️ RASH PRESENT',
        severity: 'moderate',
        evidence: ['Rash noted on examination'],
        solutions: [
          'Assess rash characteristics: petechial, maculopapular, blanching',
          'Consider meningococcemia if petechial + fever',
          'Start empiric antibiotics if meningococcemia suspected',
          'Obtain blood cultures',
        ],
      });
    }

    return problems;
  };

  const updateRealTimeProblems = () => {
    const allProblems: ClinicalProblem[] = [
      ...checkAirwayProblems(),
      ...checkBreathingProblems(),
      ...checkCirculationProblems(),
      ...checkDisabilityProblems(),
      ...checkExposureProblems(),
    ];

    // Remove duplicates by ID
    const uniqueProblems = Array.from(new Map(allProblems.map(p => [p.id, p])).values());
    setRealTimeProblems(uniqueProblems);
  };

  // ============================================================================
  // SIGNS OF LIFE LOGIC - BLS/ALS PATHWAY
  // ============================================================================

  const handleSignsOfLifeSubmit = () => {
    if (!signsOfLife.breathing && !signsOfLife.pulse) {
      setBlsAlsActivated(true);
      setRealTimeProblems([
        {
          id: 'cardiac_arrest',
          name: '🚨 CARDIAC ARREST - NO SIGNS OF LIFE',
          severity: 'critical',
          evidence: ['No breathing', 'No pulse', 'Unresponsive'],
          solutions: [
            'START CHEST COMPRESSIONS 100-120/min',
            `Compression depth: ${patientData.age.years < 1 ? '1.5 inches (4 cm)' : '2 inches (5 cm) or 1/3 chest depth'}`,
            'Provide rescue breathing (30:2 ratio for single rescuer, 15:2 for two rescuers)',
            'Attach monitor/defibrillator',
            'Obtain IV/IO access',
            `Epinephrine IV: ${patientData.calculatedParameters.epinephrineIV.toFixed(2)} mg every 3-5 min`,
            `Epinephrine IO: ${patientData.calculatedParameters.epinephrineIO.toFixed(2)} mg every 3-5 min`,
            `Amiodarone (if VF/pulseless VT): ${patientData.calculatedParameters.amiodarone.toFixed(0)} mg IV/IO`,
            'Continue CPR throughout resuscitation',
            'Reassess rhythm every 2 minutes',
          ],
        },
      ]);
      setStep('case_completion');
      return;
    }

    setStep('airway');
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderPatientData = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Step 1: Patient Data</CardTitle>
        <CardDescription>Enter patient age and weight (system will calculate if blank)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="years">Age (Years)</Label>
            <Input
              id="years"
              type="number"
              min="0"
              max="18"
              value={patientData.age.years}
              onChange={(e) =>
                setPatientData({
                  ...patientData,
                  age: { ...patientData.age, years: parseInt(e.target.value) || 0 },
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="months">Age (Months)</Label>
            <Input
              id="months"
              type="number"
              min="0"
              max="11"
              value={patientData.age.months}
              onChange={(e) =>
                setPatientData({
                  ...patientData,
                  age: { ...patientData.age, months: parseInt(e.target.value) || 0 },
                })
              }
            />
          </div>
        </div>

        <div>
          <Label htmlFor="weight">Weight (kg) - Optional</Label>
          <Input
            id="weight"
            type="number"
            min="0"
            placeholder="Leave blank to auto-calculate"
            value={patientData.weight || ''}
            onChange={(e) =>
              setPatientData({
                ...patientData,
                weight: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>

        <Button onClick={handlePatientDataSubmit} className="w-full">
          Continue to Signs of Life <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderSignsOfLife = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Step 2: Signs of Life</CardTitle>
        <CardDescription>
          Patient: {patientData.age.years}y {patientData.age.months}m | Weight: {patientData.weight.toFixed(1)} kg
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-semibold mb-3 block">Is the child BREATHING?</Label>
          <div className="flex gap-4">
            <Button
              variant={signsOfLife.breathing === true ? 'default' : 'outline'}
              onClick={() => setSignsOfLife({ ...signsOfLife, breathing: true })}
              className="flex-1"
            >
              ✓ YES
            </Button>
            <Button
              variant={signsOfLife.breathing === false ? 'default' : 'outline'}
              onClick={() => setSignsOfLife({ ...signsOfLife, breathing: false })}
              className="flex-1"
            >
              ✗ NO
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-base font-semibold mb-3 block">Does the child have a PULSE?</Label>
          <div className="flex gap-4">
            <Button
              variant={signsOfLife.pulse === true ? 'default' : 'outline'}
              onClick={() => setSignsOfLife({ ...signsOfLife, pulse: true })}
              className="flex-1"
            >
              ✓ YES
            </Button>
            <Button
              variant={signsOfLife.pulse === false ? 'default' : 'outline'}
              onClick={() => setSignsOfLife({ ...signsOfLife, pulse: false })}
              className="flex-1"
            >
              ✗ NO
            </Button>
          </div>
        </div>

        <Button onClick={handleSignsOfLifeSubmit} className="w-full" disabled={signsOfLife.breathing === null || signsOfLife.pulse === null}>
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderAirway = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Airway Assessment (A)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-base font-semibold mb-3 block">Airway Patency</Label>
          <div className="space-y-2">
            {['patent', 'at_risk', 'obstructed'].map((option) => (
              <Button
                key={option}
                variant={airwayData.patency === option ? 'default' : 'outline'}
                onClick={() => {
                  setAirwayData({ ...airwayData, patency: option });
                  updateRealTimeProblems();
                }}
                className="w-full justify-start"
              >
                {option === 'patent' && '✓ Patent - Normal breathing'}
                {option === 'at_risk' && '⚠️ At Risk - Stridor, grunting, snoring'}
                {option === 'obstructed' && '🚨 Obstructed - Silent, unable to vocalize'}
              </Button>
            ))}
          </div>
        </div>

        {airwayData.patency === 'at_risk' && (
          <div>
            <Label className="text-base font-semibold mb-3 block">Obstruction Type</Label>
            <div className="space-y-2">
              {['upper_airway', 'lower_airway'].map((option) => (
                <Button
                  key={option}
                  variant={airwayData.obstructionType === option ? 'default' : 'outline'}
                  onClick={() => {
                    setAirwayData({ ...airwayData, obstructionType: option });
                    updateRealTimeProblems();
                  }}
                  className="w-full justify-start"
                >
                  {option === 'upper_airway' && 'Upper Airway (Stridor)'}
                  {option === 'lower_airway' && 'Lower Airway (Wheeze)'}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Button onClick={() => setStep('breathing')} className="w-full">
          Continue to Breathing <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderBreathing = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Breathing Assessment (B)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-base font-semibold mb-3 block">Is the child breathing adequately?</Label>
          <div className="flex gap-4">
            <Button
              variant={breathingData.isBreathing === true ? 'default' : 'outline'}
              onClick={() => {
                setBreathingData({ ...breathingData, isBreathing: true });
                updateRealTimeProblems();
              }}
              className="flex-1"
            >
              ✓ YES
            </Button>
            <Button
              variant={breathingData.isBreathing === false ? 'default' : 'outline'}
              onClick={() => {
                setBreathingData({ ...breathingData, isBreathing: false });
                updateRealTimeProblems();
              }}
              className="flex-1"
            >
              ✗ NO
            </Button>
          </div>
        </div>

        {breathingData.isBreathing && (
          <>
            <div>
              <Label htmlFor="rr">Respiratory Rate (breaths/min)</Label>
              <Input
                id="rr"
                type="number"
                min="0"
                value={breathingData.respiratoryRate || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || null;
                  setBreathingData({ ...breathingData, respiratoryRate: value });
                  updateRealTimeProblems();
                }}
                placeholder={`Normal: ${patientData.calculatedParameters.normalRRMin}-${patientData.calculatedParameters.normalRRMax}`}
              />
            </div>

            <div>
              <Label htmlFor="spo2">SpO2 (%)</Label>
              <Input
                id="spo2"
                type="number"
                min="0"
                max="100"
                value={breathingData.spO2 || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || null;
                  setBreathingData({ ...breathingData, spO2: value });
                  updateRealTimeProblems();
                }}
                placeholder="Target: >94%"
              />
            </div>
          </>
        )}

        <Button onClick={() => setStep('circulation')} className="w-full">
          Continue to Circulation <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderCirculation = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Circulation Assessment (C)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="hr">Heart Rate (bpm)</Label>
          <Input
            id="hr"
            type="number"
            min="0"
            value={circulationData.heartRate || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value) || null;
              setCirculationData({ ...circulationData, heartRate: value });
              updateRealTimeProblems();
            }}
            placeholder={`Normal: ${patientData.calculatedParameters.normalHeartRateMin}-${patientData.calculatedParameters.normalHeartRateMax}`}
          />
        </div>

        <div>
          <Label htmlFor="sbp">Systolic BP (mmHg)</Label>
          <Input
            id="sbp"
            type="number"
            min="0"
            value={circulationData.systolicBP || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value) || null;
              setCirculationData({ ...circulationData, systolicBP: value });
              updateRealTimeProblems();
            }}
            placeholder={`Normal: ${patientData.calculatedParameters.normalSystolicBP.min}-${patientData.calculatedParameters.normalSystolicBP.max}`}
          />
        </div>

        <div>
          <Label className="text-base font-semibold mb-3 block">Skin Perfusion</Label>
          <div className="space-y-2">
            {['warm', 'cool', 'cold'].map((option) => (
              <Button
                key={option}
                variant={circulationData.skinPerfusion === option ? 'default' : 'outline'}
                onClick={() => {
                  setCirculationData({ ...circulationData, skinPerfusion: option });
                  updateRealTimeProblems();
                }}
                className="w-full justify-start"
              >
                {option === 'warm' && '✓ Warm - Normal perfusion'}
                {option === 'cool' && '⚠️ Cool - Delayed cap refill'}
                {option === 'cold' && '🚨 Cold - Severe shock'}
              </Button>
            ))}
          </div>
        </div>

        <Button onClick={() => setStep('disability')} className="w-full">
          Continue to Disability <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderDisability = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Disability Assessment (D)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-base font-semibold mb-3 block">Consciousness (AVPU)</Label>
          <div className="space-y-2">
            {['A', 'V', 'P', 'U'].map((option) => (
              <Button
                key={option}
                variant={disabilityData.avpu === option ? 'default' : 'outline'}
                onClick={() => {
                  setDisabilityData({ ...disabilityData, avpu: option });
                  updateRealTimeProblems();
                }}
                className="w-full justify-start"
              >
                {option === 'A' && '✓ Alert'}
                {option === 'V' && '⚠️ Responds to Voice'}
                {option === 'P' && '⚠️ Responds to Pain'}
                {option === 'U' && '🚨 Unresponsive'}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="glucose">Blood Glucose (mg/dL)</Label>
          <Input
            id="glucose"
            type="number"
            min="0"
            value={disabilityData.bloodGlucose || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value) || null;
              setDisabilityData({ ...disabilityData, bloodGlucose: value });
              updateRealTimeProblems();
            }}
            placeholder="Normal: 70-100"
          />
        </div>

        <Button onClick={() => setStep('exposure')} className="w-full">
          Continue to Exposure <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderExposure = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Exposure Assessment (E)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="temp">Temperature (°C)</Label>
          <Input
            id="temp"
            type="number"
            step="0.1"
            min="30"
            max="42"
            value={exposureData.temperature || ''}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || null;
              setExposureData({ ...exposureData, temperature: value });
              updateRealTimeProblems();
            }}
            placeholder="e.g., 37.5"
          />
        </div>

        <div>
          <Label className="text-base font-semibold mb-3 block">Rash Present?</Label>
          <div className="flex gap-4">
            <Button
              variant={exposureData.rash === true ? 'default' : 'outline'}
              onClick={() => {
                setExposureData({ ...exposureData, rash: true });
                updateRealTimeProblems();
              }}
              className="flex-1"
            >
              ✓ YES
            </Button>
            <Button
              variant={exposureData.rash === false ? 'default' : 'outline'}
              onClick={() => {
                setExposureData({ ...exposureData, rash: false });
                updateRealTimeProblems();
              }}
              className="flex-1"
            >
              ✗ NO
            </Button>
          </div>
        </div>

        <Button onClick={() => setStep('problem_identification')} className="w-full">
          Identify Problems <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderProblems = () => (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Clinical Assessment Summary</h2>
        <p className="text-gray-600">
          Patient: {patientData.age.years}y {patientData.age.months}m | Weight: {patientData.weight.toFixed(1)} kg | Time elapsed:{' '}
          {Math.round((new Date().getTime() - caseStartTime.getTime()) / 1000)}s
        </p>
      </div>

      {realTimeProblems.length === 0 ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>No critical problems identified. Continue monitoring.</AlertDescription>
        </Alert>
      ) : (
        realTimeProblems.map((problem) => (
          <Card key={problem.id} className={`border-l-4 ${problem.severity === 'critical' ? 'border-l-red-500 bg-red-50' : problem.severity === 'high' ? 'border-l-orange-500 bg-orange-50' : 'border-l-yellow-500 bg-yellow-50'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{problem.name}</CardTitle>
                <Badge variant={problem.severity === 'critical' ? 'destructive' : problem.severity === 'high' ? 'secondary' : 'outline'}>
                  {problem.severity.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Evidence:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {problem.evidence.map((e, i) => (
                    <li key={i} className="text-sm">
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Immediate Actions:
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {problem.solutions.map((s, i) => (
                    <li key={i} className="text-sm font-medium">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <div className="flex gap-4 mt-6">
        <Button onClick={() => setStep('case_completion')} className="flex-1">
          Case Complete
        </Button>
        <Button variant="outline" onClick={() => setStep('patient_data')} className="flex-1">
          <RotateCcw className="mr-2 h-4 w-4" /> New Case
        </Button>
      </div>
    </div>
  );

  const renderCaseCompletion = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Case Completion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Case completed. Time elapsed: {Math.round((new Date().getTime() - caseStartTime.getTime()) / 1000)} seconds
          </AlertDescription>
        </Alert>

        {blsAlsActivated && (
          <Alert className="border-red-300 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              BLS/ALS protocol activated. Continue CPR and reassess rhythm every 2 minutes.
            </AlertDescription>
          </Alert>
        )}

        <Button onClick={() => setStep('patient_data')} className="w-full">
          <RotateCcw className="mr-2 h-4 w-4" /> Start New Case
        </Button>
      </CardContent>
    </Card>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Clinical Assessment</h1>
        <p className="text-slate-300">Pediatric Resuscitation - Real-time Decision Support</p>
      </div>

      {step === 'patient_data' && renderPatientData()}
      {step === 'signs_of_life' && renderSignsOfLife()}
      {step === 'airway' && renderAirway()}
      {step === 'breathing' && renderBreathing()}
      {step === 'circulation' && renderCirculation()}
      {step === 'disability' && renderDisability()}
      {step === 'exposure' && renderExposure()}
      {step === 'problem_identification' && renderProblems()}
      {step === 'case_completion' && renderCaseCompletion()}

      {/* Real-time problems sidebar */}
      {realTimeProblems.length > 0 && step !== 'problem_identification' && step !== 'case_completion' && (
        <div className="fixed bottom-4 right-4 max-w-sm">
          <Card className="border-red-300 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                Active Problems
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              {realTimeProblems.slice(0, 3).map((p) => (
                <div key={p.id} className="text-red-800 font-semibold">
                  {p.name.split(' - ')[0]}
                </div>
              ))}
              {realTimeProblems.length > 3 && <div className="text-red-700">+{realTimeProblems.length - 3} more</div>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
