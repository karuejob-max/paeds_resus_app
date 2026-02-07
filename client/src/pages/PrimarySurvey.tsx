import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import type {
  PatientType,
  PhysiologicState,
  AirwayAssessment,
  BreathingAssessment,
  CirculationAssessment,
  DisabilityAssessment,
  ExposureAssessment,
  PrimarySurveyData,
} from '../../../shared/clinical-types';
import { VITAL_SIGN_RANGES } from '../../../shared/clinical-types';

interface PrimarySurveyProps {
  onComplete: (data: PrimarySurveyData) => void;
}

export default function PrimarySurvey({ onComplete }: PrimarySurveyProps) {
  const [step, setStep] = useState<'patient' | 'state' | 'abcde'>('patient');
  const [patientType, setPatientType] = useState<PatientType | null>(null);
  const [physiologicState, setPhysiologicState] = useState<PhysiologicState | null>(null);

  // ABCDE Assessment States
  const [airway, setAirway] = useState<AirwayAssessment>({
    status: 'patent',
    observations: {},
    interventions: {},
  });

  const [breathing, setBreathing] = useState<BreathingAssessment>({
    rate: 0,
    pattern: 'normal',
    effort: 'normal',
    effortSigns: {},
    spO2: 100,
  });

  const [circulation, setCirculation] = useState<CirculationAssessment>({
    heartRate: 0,
    perfusion: {
      capillary_refill: 'normal',
      peripheral_pulses: 'strong',
      central_pulses: 'strong',
      skin_temperature: 'warm',
      skin_color: 'pink',
    },
    history: {},
  });

  const [disability, setDisability] = useState<DisabilityAssessment>({
    avpu: 'alert',
    pupils: {
      size_left: 3,
      size_right: 3,
      reactive_left: true,
      reactive_right: true,
    },
  });

  const [exposure, setExposure] = useState<ExposureAssessment>({
    temperature: 37.0,
    weight: 0,
    visible_injuries: {},
  });

  const [currentABCDE, setCurrentABCDE] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');

  // Get age-appropriate normal ranges
  const getAgeGroup = () => {
    if (!exposure.weight) return null;
    if (patientType === 'neonate') return 'neonate_0_28_days';
    if (patientType === 'adult' || patientType === 'pregnant_postpartum') return 'adult_18_plus';
    
    const ageYears = exposure.age_years || 0;
    if (ageYears < 1) return 'infant_1_12_months';
    if (ageYears < 3) return 'toddler_1_3_years';
    if (ageYears < 6) return 'preschool_3_6_years';
    if (ageYears < 12) return 'school_age_6_12_years';
    return 'adolescent_12_18_years';
  };

  const getNormalRanges = () => {
    const ageGroup = getAgeGroup();
    return VITAL_SIGN_RANGES.find(r => r.age_group === ageGroup);
  };

  const isAbnormal = (value: number, range: { min: number; max: number } | undefined) => {
    if (!range || !value) return false;
    return value < range.min || value > range.max;
  };

  const handleComplete = () => {
    if (!patientType || !physiologicState) return;

    const surveyData: PrimarySurveyData = {
      patientType,
      physiologicState,
      airway,
      breathing,
      circulation,
      disability,
      exposure,
      timestamp: new Date(),
    };

    onComplete(surveyData);
  };

  // Step 1: Patient Type Selection
  if (step === 'patient') {
    return (
      <div className="container max-w-2xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Clinical Reasoning Engine</h1>
          <p className="text-muted-foreground">
            Structured assessment with real-time differential generation
          </p>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Who is your patient?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant={patientType === 'neonate' ? 'default' : 'outline'}
              className="h-24 text-lg"
              onClick={() => setPatientType('neonate')}
            >
              <div>
                <div className="text-3xl mb-2">👶</div>
                <div>Neonate</div>
                <div className="text-sm font-normal">(0-28 days)</div>
              </div>
            </Button>

            <Button
              variant={patientType === 'child' ? 'default' : 'outline'}
              className="h-24 text-lg"
              onClick={() => setPatientType('child')}
            >
              <div>
                <div className="text-3xl mb-2">🧒</div>
                <div>Child</div>
                <div className="text-sm font-normal">(29 days - 18 years)</div>
              </div>
            </Button>

            <Button
              variant={patientType === 'pregnant_postpartum' ? 'default' : 'outline'}
              className="h-24 text-lg"
              onClick={() => setPatientType('pregnant_postpartum')}
            >
              <div>
                <div className="text-3xl mb-2">🤰</div>
                <div>Pregnant/Postpartum</div>
                <div className="text-sm font-normal">Mother</div>
              </div>
            </Button>

            <Button
              variant={patientType === 'adult' ? 'default' : 'outline'}
              className="h-24 text-lg"
              onClick={() => setPatientType('adult')}
            >
              <div>
                <div className="text-3xl mb-2">👤</div>
                <div>Adult</div>
                <div className="text-sm font-normal">(Non-pregnant, &gt;18 years)</div>
              </div>
            </Button>
          </div>

          {patientType && (
            <Button
              className="w-full mt-6"
              size="lg"
              onClick={() => setStep('state')}
            >
              Continue <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </Card>
      </div>
    );
  }

  // Step 2: Physiologic State Selection
  if (step === 'state') {
    return (
      <div className="container max-w-2xl py-8">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => setStep('patient')}>
            ← Back
          </Button>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Step 2: What's happening?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select the primary problem (we'll assess details next)
          </p>

          <div className="space-y-3">
            <div className="font-semibold text-red-600 mb-2">🚨 IMMEDIATE THREATS (ABC)</div>
            {[
              { value: 'cardiac_arrest', label: '💔 No pulse / Cardiac arrest', icon: '💔' },
              { value: 'respiratory_arrest', label: '🫁 Not breathing / Respiratory arrest', icon: '🫁' },
              { value: 'severe_bleeding', label: '🩸 Severe bleeding / Hemorrhage', icon: '🩸' },
              { value: 'unresponsive', label: '😵 Unresponsive / Coma (GCS <8)', icon: '😵' },
            ].map((state) => (
              <Button
                key={state.value}
                variant={physiologicState === state.value ? 'default' : 'outline'}
                className="w-full justify-start h-auto py-3"
                onClick={() => setPhysiologicState(state.value as PhysiologicState)}
              >
                <span className="text-xl mr-3">{state.icon}</span>
                <span>{state.label}</span>
              </Button>
            ))}

            <div className="font-semibold text-orange-600 mb-2 mt-4">⚠️ CRITICAL (Minutes matter)</div>
            {[
              { value: 'seizure', label: '⚡ Seizure (active or just stopped)', icon: '⚡' },
              { value: 'shock', label: '🫀 Shock (cold, weak pulse, altered mental status)', icon: '🫀' },
              { value: 'severe_respiratory_distress', label: '🫁 Severe respiratory distress', icon: '🫁' },
              { value: 'stroke_symptoms', label: '🧠 Stroke symptoms', icon: '🧠' },
            ].map((state) => (
              <Button
                key={state.value}
                variant={physiologicState === state.value ? 'default' : 'outline'}
                className="w-full justify-start h-auto py-3"
                onClick={() => setPhysiologicState(state.value as PhysiologicState)}
              >
                <span className="text-xl mr-3">{state.icon}</span>
                <span>{state.label}</span>
              </Button>
            ))}

            <div className="font-semibold text-yellow-600 mb-2 mt-4">🟡 URGENT (Hours matter)</div>
            {[
              { value: 'sepsis_suspected', label: '🤒 Sepsis suspected (fever + looks unwell)', icon: '🤒' },
              { value: 'poisoning', label: '💊 Poisoning / Overdose', icon: '💊' },
              { value: 'severe_pain', label: '🔥 Severe pain (chest, abdomen, head)', icon: '🔥' },
              { value: 'other_emergency', label: '📊 Other medical emergency', icon: '📊' },
            ].map((state) => (
              <Button
                key={state.value}
                variant={physiologicState === state.value ? 'default' : 'outline'}
                className="w-full justify-start h-auto py-3"
                onClick={() => setPhysiologicState(state.value as PhysiologicState)}
              >
                <span className="text-xl mr-3">{state.icon}</span>
                <span>{state.label}</span>
              </Button>
            ))}
          </div>

          {physiologicState && (
            <Button
              className="w-full mt-6"
              size="lg"
              onClick={() => setStep('abcde')}
            >
              Start Primary Survey <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </Card>
      </div>
    );
  }

  // Step 3: ABCDE Assessment
  const ranges = getNormalRanges();

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep('state')}>
          ← Back
        </Button>
        <div className="flex gap-2">
          {(['A', 'B', 'C', 'D', 'E'] as const).map((letter) => (
            <Button
              key={letter}
              variant={currentABCDE === letter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentABCDE(letter)}
            >
              {letter}
            </Button>
          ))}
        </div>
      </div>

      {/* Airway Assessment */}
      {currentABCDE === 'A' && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">A - Airway Assessment</h2>

          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold">Airway Status</Label>
              <RadioGroup
                value={airway.status}
                onValueChange={(value) => setAirway({ ...airway, status: value as any })}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="patent" id="patent" />
                  <Label htmlFor="patent">Patent (open and clear)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="obstructed" id="obstructed" />
                  <Label htmlFor="obstructed">Obstructed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="secured" id="secured" />
                  <Label htmlFor="secured">Secured (ETT/LMA)</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base font-semibold mb-2 block">Observations (check all that apply)</Label>
              <div className="space-y-2">
                {[
                  { key: 'vomiting', label: 'Vomiting' },
                  { key: 'blood_secretions', label: 'Blood/secretions' },
                  { key: 'foreign_body', label: 'Foreign body visible' },
                  { key: 'stridor', label: 'Stridor (high-pitched sound)' },
                  { key: 'snoring', label: 'Snoring' },
                  { key: 'gurgling', label: 'Gurgling' },
                ].map((obs) => (
                  <div key={obs.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={obs.key}
                      checked={!!airway.observations[obs.key as keyof typeof airway.observations]}
                      onCheckedChange={(checked) =>
                        setAirway({
                          ...airway,
                          observations: { ...airway.observations, [obs.key]: checked },
                        })
                      }
                    />
                    <Label htmlFor={obs.key}>{obs.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {airway.observations.vomiting && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Vomiting noted - aspiration risk. Consider suction and positioning.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="airway-notes">Additional Notes</Label>
              <Textarea
                id="airway-notes"
                value={airway.notes || ''}
                onChange={(e) => setAirway({ ...airway, notes: e.target.value })}
                placeholder="Any additional observations..."
              />
            </div>

            <Button className="w-full" size="lg" onClick={() => setCurrentABCDE('B')}>
              Continue to Breathing <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Breathing Assessment */}
      {currentABCDE === 'B' && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">B - Breathing Assessment</h2>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="resp-rate">Respiratory Rate (breaths/min)</Label>
                <Input
                  id="resp-rate"
                  type="number"
                  value={breathing.rate || ''}
                  onChange={(e) => setBreathing({ ...breathing, rate: Number(e.target.value) })}
                />
                {ranges && isAbnormal(breathing.rate, ranges.respiratory_rate) && (
                  <p className="text-sm text-red-600 mt-1">
                    Abnormal (normal: {ranges.respiratory_rate.min}-{ranges.respiratory_rate.max})
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="spo2">SpO2 (%)</Label>
                <Input
                  id="spo2"
                  type="number"
                  value={breathing.spO2 || ''}
                  onChange={(e) => setBreathing({ ...breathing, spO2: Number(e.target.value) })}
                />
                {breathing.spO2 < 94 && (
                  <p className="text-sm text-red-600 mt-1">Low oxygen saturation</p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold">Breathing Pattern</Label>
              <RadioGroup
                value={breathing.pattern}
                onValueChange={(value) => setBreathing({ ...breathing, pattern: value as any })}
                className="mt-2"
              >
                {[
                  { value: 'normal', label: 'Normal' },
                  { value: 'deep_kussmaul', label: 'Deep (Kussmaul) - suggests metabolic acidosis' },
                  { value: 'shallow', label: 'Shallow' },
                  { value: 'irregular', label: 'Irregular' },
                  { value: 'apneic', label: 'Apneic (not breathing)' },
                ].map((pattern) => (
                  <div key={pattern.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={pattern.value} id={pattern.value} />
                    <Label htmlFor={pattern.value}>{pattern.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {breathing.pattern === 'deep_kussmaul' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Kussmaul breathing suggests metabolic acidosis (DKA, sepsis, renal failure)
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label className="text-base font-semibold">Effort</Label>
              <RadioGroup
                value={breathing.effort}
                onValueChange={(value) => setBreathing({ ...breathing, effort: value as any })}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="effort-normal" />
                  <Label htmlFor="effort-normal">Normal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="increased" id="effort-increased" />
                  <Label htmlFor="effort-increased">Increased (retractions, grunting)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="minimal" id="effort-minimal" />
                  <Label htmlFor="effort-minimal">Minimal (fatigue, impending arrest)</Label>
                </div>
              </RadioGroup>
            </div>

            <Button className="w-full" size="lg" onClick={() => setCurrentABCDE('C')}>
              Continue to Circulation <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Circulation Assessment */}
      {currentABCDE === 'C' && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">C - Circulation Assessment</h2>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="heart-rate">Heart Rate (bpm)</Label>
                <Input
                  id="heart-rate"
                  type="number"
                  value={circulation.heartRate || ''}
                  onChange={(e) => setCirculation({ ...circulation, heartRate: Number(e.target.value) })}
                />
                {ranges && isAbnormal(circulation.heartRate, ranges.heart_rate) && (
                  <p className="text-sm text-red-600 mt-1">
                    Abnormal (normal: {ranges.heart_rate.min}-{ranges.heart_rate.max})
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="bp-systolic">Blood Pressure (systolic/diastolic)</Label>
                <div className="flex gap-2">
                  <Input
                    id="bp-systolic"
                    type="number"
                    placeholder="Systolic"
                    value={circulation.bloodPressure?.systolic || ''}
                    onChange={(e) =>
                      setCirculation({
                        ...circulation,
                        bloodPressure: {
                          systolic: Number(e.target.value),
                          diastolic: circulation.bloodPressure?.diastolic || 0,
                        },
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Diastolic"
                    value={circulation.bloodPressure?.diastolic || ''}
                    onChange={(e) =>
                      setCirculation({
                        ...circulation,
                        bloodPressure: {
                          systolic: circulation.bloodPressure?.systolic || 0,
                          diastolic: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                {ranges &&
                  circulation.bloodPressure &&
                  isAbnormal(circulation.bloodPressure.systolic, ranges.systolic_bp) && (
                    <p className="text-sm text-red-600 mt-1">
                      Abnormal (normal: {ranges.systolic_bp.min}-{ranges.systolic_bp.max})
                    </p>
                  )}
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold mb-2 block">Perfusion Assessment</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Capillary Refill</Label>
                  <RadioGroup
                    value={circulation.perfusion.capillary_refill}
                    onValueChange={(value) =>
                      setCirculation({
                        ...circulation,
                        perfusion: { ...circulation.perfusion, capillary_refill: value as any },
                      })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="normal" id="cr-normal" />
                      <Label htmlFor="cr-normal">Normal (&lt;2s)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="delayed" id="cr-delayed" />
                      <Label htmlFor="cr-delayed">Delayed (2-4s)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="very_delayed" id="cr-very-delayed" />
                      <Label htmlFor="cr-very-delayed">Very delayed (&gt;4s)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-sm">Skin Temperature</Label>
                  <RadioGroup
                    value={circulation.perfusion.skin_temperature}
                    onValueChange={(value) =>
                      setCirculation({
                        ...circulation,
                        perfusion: { ...circulation.perfusion, skin_temperature: value as any },
                      })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="warm" id="temp-warm" />
                      <Label htmlFor="temp-warm">Warm</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cool" id="temp-cool" />
                      <Label htmlFor="temp-cool">Cool</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cold" id="temp-cold" />
                      <Label htmlFor="temp-cold">Cold</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold mb-2 block">History (check all that apply)</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'polyuria', label: 'Polyuria (excessive urination)' },
                  { key: 'oliguria', label: 'Oliguria (reduced urine output)' },
                  { key: 'diarrhea', label: 'Diarrhea' },
                  { key: 'vomiting', label: 'Vomiting' },
                  { key: 'bleeding', label: 'Bleeding' },
                  { key: 'poor_feeding', label: 'Poor feeding' },
                ].map((hist) => (
                  <div key={hist.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={hist.key}
                      checked={!!circulation.history?.[hist.key as keyof typeof circulation.history]}
                      onCheckedChange={(checked) =>
                        setCirculation({
                          ...circulation,
                          history: { ...circulation.history, [hist.key]: checked },
                        })
                      }
                    />
                    <Label htmlFor={hist.key}>{hist.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {circulation.history?.polyuria && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Polyuria noted - consider DKA, diabetes insipidus, or renal causes
                </AlertDescription>
              </Alert>
            )}

            <Button className="w-full" size="lg" onClick={() => setCurrentABCDE('D')}>
              Continue to Disability <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Disability Assessment */}
      {currentABCDE === 'D' && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">D - Disability Assessment</h2>

          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold">AVPU Score</Label>
              <RadioGroup
                value={disability.avpu}
                onValueChange={(value) => setDisability({ ...disability, avpu: value as any })}
                className="mt-2"
              >
                {[
                  { value: 'alert', label: 'Alert (awake and responsive)' },
                  { value: 'voice', label: 'Voice (responds to voice)' },
                  { value: 'pain', label: 'Pain (responds only to pain)' },
                  { value: 'unresponsive', label: 'Unresponsive' },
                ].map((avpu) => (
                  <div key={avpu.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={avpu.value} id={avpu.value} />
                    <Label htmlFor={avpu.value}>{avpu.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="blood-glucose">Blood Glucose (mmol/L)</Label>
              <Input
                id="blood-glucose"
                type="number"
                step="0.1"
                value={disability.blood_glucose || ''}
                onChange={(e) => setDisability({ ...disability, blood_glucose: Number(e.target.value) })}
                placeholder="Check if available"
              />
              {disability.blood_glucose && disability.blood_glucose < 3 && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    HYPOGLYCEMIA - Give glucose immediately
                  </AlertDescription>
                </Alert>
              )}
              {disability.blood_glucose && disability.blood_glucose > 11 && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    HYPERGLYCEMIA ({disability.blood_glucose} mmol/L) - Consider DKA, HHS
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div>
              <Label className="text-base font-semibold mb-2 block">Seizure Activity</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="seizure-active"
                    checked={disability.seizure?.active || false}
                    onCheckedChange={(checked) =>
                      setDisability({
                        ...disability,
                        seizure: { ...disability.seizure, active: !!checked },
                      })
                    }
                  />
                  <Label htmlFor="seizure-active">Seizure active now</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="seizure-stopped"
                    checked={disability.seizure?.just_stopped || false}
                    onCheckedChange={(checked) =>
                      setDisability({
                        ...disability,
                        seizure: { ...disability.seizure, just_stopped: !!checked },
                      })
                    }
                  />
                  <Label htmlFor="seizure-stopped">Seizure just stopped</Label>
                </div>
                {(disability.seizure?.active || disability.seizure?.just_stopped) && (
                  <div>
                    <Label htmlFor="seizure-duration">Duration (minutes)</Label>
                    <Input
                      id="seizure-duration"
                      type="number"
                      value={disability.seizure?.duration_minutes || ''}
                      onChange={(e) =>
                        setDisability({
                          ...disability,
                          seizure: {
                            ...disability.seizure,
                            duration_minutes: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={() => setCurrentABCDE('E')}>
              Continue to Exposure <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Exposure Assessment */}
      {currentABCDE === 'E' && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">E - Exposure Assessment</h2>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={exposure.temperature || ''}
                  onChange={(e) => setExposure({ ...exposure, temperature: Number(e.target.value) })}
                />
                {ranges && isAbnormal(exposure.temperature, ranges.temperature) && (
                  <p className="text-sm text-red-600 mt-1">
                    Abnormal (normal: {ranges.temperature.min}-{ranges.temperature.max})
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="weight">Weight (kg) *Required</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={exposure.weight || ''}
                  onChange={(e) => setExposure({ ...exposure, weight: Number(e.target.value) })}
                />
              </div>
            </div>

            {patientType === 'child' && (
              <div>
                <Label htmlFor="age-years">Age (years)</Label>
                <Input
                  id="age-years"
                  type="number"
                  value={exposure.age_years || ''}
                  onChange={(e) => setExposure({ ...exposure, age_years: Number(e.target.value) })}
                />
              </div>
            )}

            {patientType === 'pregnant_postpartum' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="currently-pregnant"
                    checked={exposure.pregnancy_related?.currently_pregnant || false}
                    onCheckedChange={(checked) =>
                      setExposure({
                        ...exposure,
                        pregnancy_related: {
                          ...exposure.pregnancy_related,
                          currently_pregnant: !!checked,
                        },
                      })
                    }
                  />
                  <Label htmlFor="currently-pregnant">Currently pregnant</Label>
                </div>

                {exposure.pregnancy_related?.currently_pregnant && (
                  <div>
                    <Label htmlFor="gestational-age">Gestational Age (weeks)</Label>
                    <Input
                      id="gestational-age"
                      type="number"
                      value={exposure.pregnancy_related?.gestational_age_weeks || ''}
                      onChange={(e) =>
                        setExposure({
                          ...exposure,
                          pregnancy_related: {
                            ...exposure.pregnancy_related,
                            gestational_age_weeks: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="postpartum"
                    checked={exposure.pregnancy_related?.postpartum || false}
                    onCheckedChange={(checked) =>
                      setExposure({
                        ...exposure,
                        pregnancy_related: {
                          ...exposure.pregnancy_related,
                          postpartum: !!checked,
                        },
                      })
                    }
                  />
                  <Label htmlFor="postpartum">Postpartum</Label>
                </div>

                {exposure.pregnancy_related?.postpartum && (
                  <div>
                    <Label htmlFor="days-postpartum">Days Postpartum</Label>
                    <Input
                      id="days-postpartum"
                      type="number"
                      value={exposure.pregnancy_related?.days_postpartum || ''}
                      onChange={(e) =>
                        setExposure({
                          ...exposure,
                          pregnancy_related: {
                            ...exposure.pregnancy_related,
                            days_postpartum: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                )}
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleComplete}
              disabled={!exposure.weight}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Complete Primary Survey & Analyze
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
