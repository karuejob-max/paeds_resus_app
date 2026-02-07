/**
 * GPS-Style Primary Survey - COMPLETE
 * 
 * One question at a time with immediate intervention triggers.
 * Maximum provider ease, zero cognitive load, life-saving precision.
 * 
 * Features:
 * - 18 sequential steps with smart branching
 * - Immediate intervention triggers for life-threats
 * - Age-appropriate normal ranges with visual flagging
 * - Auto-calculated dosing displayed inline
 * - Equipment sizing recommendations
 * - Voice command integration (hands-free)
 * - Automatic timer with intervention logging
 * - Persistent intervention sidebar
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Baby,
  User,
  Heart,
  Wind,
  Thermometer,
  Activity,
  Eye,
  Droplet,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Home,
  Stethoscope,
  Brain,
  Pill,
  Clock,
  Mic,
  MicOff,
} from 'lucide-react';
import { timerService } from '@/lib/timerService';
import { voiceCommandService } from '@/lib/voiceCommandService';
import { InterventionSidebar, type ActiveIntervention } from '@/components/InterventionSidebar';
import type {
  PatientType,
  PrimarySurveyData,
  AirwayAssessment,
  BreathingAssessment,
  CirculationAssessment,
  DisabilityAssessment,
  ExposureAssessment,
} from '../../../shared/clinical-types';
import { VITAL_SIGN_RANGES } from '../../../shared/clinical-types';

type GPSStep =
  | 'patient-type'
  | 'age-weight'
  | 'airway-status'
  | 'airway-observations'
  | 'breathing-rate'
  | 'breathing-pattern'
  | 'breathing-effort'
  | 'spo2'
  | 'lung-sounds'
  | 'heart-rate'
  | 'perfusion'
  | 'jvp'
  | 'avpu'
  | 'pupils'
  | 'glucose'
  | 'seizure'
  | 'temperature'
  | 'skin-findings'
  | 'abdominal-exam'
  | 'trauma-history'
  | 'toxin-history'
  | 'medical-history'
  | 'complete';

export default function PrimarySurveyGPS() {
  const [, setLocation] = useLocation();
  const [sessionId] = useState(`survey-${Date.now()}`);
  const [step, setStep] = useState<GPSStep>('patient-type');
  const [interventions, setInterventions] = useState<ActiveIntervention[]>([]);

  // Patient data
  const [patientType, setPatientType] = useState<PatientType | null>(null);
  const [ageYears, setAgeYears] = useState<number>(0);
  const [weight, setWeight] = useState<number>(0);

  // ABCDE data
  const [airway, setAirway] = useState<Partial<AirwayAssessment>>({ status: 'patent' });
  const [breathing, setBreathing] = useState<Partial<BreathingAssessment>>({});
  const [circulation, setCirculation] = useState<Partial<CirculationAssessment>>({});
  const [disability, setDisability] = useState<Partial<DisabilityAssessment>>({});
  const [exposure, setExposure] = useState<Partial<ExposureAssessment>>({});

  // History flags
  const [hasTrauma, setHasTrauma] = useState(false);
  const [hasToxinExposure, setHasToxinExposure] = useState(false);

  // Voice command state
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceSupported] = useState(voiceCommandService.isSupported());

  // Handle voice commands
  useEffect(() => {
    if (isVoiceActive) {
      voiceCommandService.startListening(step, (command, data) => {
        console.log('Voice command received:', command, data);
        
        // Apply voice command data to current step
        switch (step) {
          case 'breathing-rate':
            if (data.value) {
              setBreathing((prev) => ({ ...prev, respiratory_rate: data.value }));
            }
            break;
          case 'spo2':
            if (data.value) {
              setBreathing((prev) => ({ ...prev, spo2: data.value }));
            }
            break;
          case 'heart-rate':
            if (data.value) {
              setCirculation((prev) => ({ ...prev, heart_rate: data.value }));
            }
            break;
          case 'perfusion':
            if (data.type === 'capillary_refill') {
              setCirculation((prev) => ({ ...prev, capillary_refill: data.value }));
            } else if (data.type === 'pulses') {
              setCirculation((prev) => ({ ...prev, pulses: data.value as any }));
            } else if (data.type === 'skin_temp_color') {
              setCirculation((prev) => ({ ...prev, skin_temp_color: data.value as any }));
            }
            break;
          case 'glucose':
            if (data.value) {
              setDisability((prev) => ({ ...prev, glucose: data.value }));
            }
            break;
          case 'temperature':
            if (data.value) {
              setExposure((prev) => ({ ...prev, temperature: data.value }));
            }
            break;
          case 'airway-status':
            if (data.value) {
              setAirway((prev) => ({ ...prev, status: data.value as any }));
              goToNextStep();
            }
            break;
          case 'breathing-pattern':
            if (data.value) {
              setBreathing((prev) => ({ ...prev, pattern: data.value as any }));
              goToNextStep();
            }
            break;
          case 'avpu':
            if (data.value) {
              setDisability((prev) => ({ ...prev, avpu: data.value as any }));
              goToNextStep();
            }
            break;
          case 'pupils':
            if (data.pupils_size) {
              setDisability((prev) => ({ ...prev, pupils_size: data.pupils_size as any }));
            }
            if (data.pupils_reactive) {
              setDisability((prev) => ({ ...prev, pupils_reactive: data.pupils_reactive as any }));
            }
            if (data.pupils_equal) {
              setDisability((prev) => ({ ...prev, pupils_equal: data.pupils_equal as any }));
            }
            break;
        }
      });
    } else {
      voiceCommandService.stopListening();
    }

    return () => {
      voiceCommandService.stopListening();
    };
  }, [isVoiceActive, step]);

  // Auto-start timer on first answer
  useEffect(() => {
    if (step !== 'patient-type' && !timerService.getTimer(sessionId).isRunning) {
      timerService.startTimer(sessionId);
      timerService.setPatientInfo(sessionId, weight, ageYears);
    }
  }, [step, sessionId, weight, ageYears]);

  const stepOrder: GPSStep[] = [
    'patient-type',
    'age-weight',
    'airway-status',
    ...(airway.status === 'obstructed' || airway.status === 'patent' ? ['airway-observations' as GPSStep] : []),
    'breathing-rate',
    'breathing-pattern',
    'breathing-effort',
    'spo2',
    'lung-sounds',
    'heart-rate',
    'perfusion',
    ...(patientType === 'adult' || patientType === 'pregnant_postpartum' ? ['jvp' as GPSStep] : []),
    'avpu',
    'pupils',
    'glucose',
    'seizure',
    'temperature',
    'skin-findings',
    'abdominal-exam',
    'trauma-history',
    ...(hasTrauma ? ['toxin-history' as GPSStep] : []),
    'medical-history',
    'complete',
  ];

  const goToNextStep = () => {
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  const addIntervention = (intervention: Omit<ActiveIntervention, 'id' | 'status'>) => {
    const newIntervention: ActiveIntervention = {
      ...intervention,
      id: `intervention-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'started',
    };
    setInterventions((prev) => [...prev, newIntervention]);

    timerService.logIntervention(sessionId, {
      action: `Added intervention: ${intervention.title}`,
      category: intervention.category,
    });
  };

  const handleInterventionStatusChange = (id: string, status: ActiveIntervention['status']) => {
    setInterventions((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );
  };

  const handleRemoveIntervention = (id: string) => {
    setInterventions((prev) => prev.filter((i) => i.id !== id));
  };

  const getAgeGroup = () => {
    if (!weight) return null;
    if (patientType === 'neonate') return 'neonate_0_28_days';
    if (patientType === 'adult' || patientType === 'pregnant_postpartum') return 'adult_18_plus';

    if (ageYears < 1) return 'infant_1_12_months';
    if (ageYears < 3) return 'toddler_1_3_years';
    if (ageYears < 6) return 'preschool_3_6_years';
    if (ageYears < 12) return 'school_age_6_12_years';
    return 'adolescent_12_18_years';
  };

  const getNormalRanges = () => {
    const ageGroup = getAgeGroup();
    return VITAL_SIGN_RANGES.find((r) => r.age_group === ageGroup);
  };

  const isAbnormal = (value: number, range: { min: number; max: number } | undefined) => {
    if (!range || !value) return false;
    return value < range.min || value > range.max;
  };

  const renderNormalRangeBadge = (value: number, range: { min: number; max: number } | undefined, unit: string) => {
    if (!range) return null;

    const abnormal = isAbnormal(value, range);
    return (
      <div className="mt-2 flex items-center gap-2">
        {abnormal ? (
          <Badge className="bg-red-600">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Abnormal
          </Badge>
        ) : (
          <Badge className="bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Normal
          </Badge>
        )}
        <span className="text-sm text-gray-500">
          Normal range: {range.min}-{range.max} {unit}
        </span>
      </div>
    );
  };

  const renderStep = () => {
    const normalRanges = getNormalRanges();
    const currentStepIndex = stepOrder.indexOf(step);
    const progress = ((currentStepIndex + 1) / stepOrder.length) * 100;

    switch (step) {
      case 'patient-type':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-2xl font-bold">Who is your patient?</h2>
                <p className="text-gray-500">Select the patient type to begin assessment</p>
              </div>
            </div>

            <RadioGroup
              value={patientType || ''}
              onValueChange={(value) => setPatientType(value as PatientType)}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all">
                  <RadioGroupItem value="neonate" id="neonate" />
                  <Label htmlFor="neonate" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <Baby className="w-6 h-6 text-pink-500" />
                      <div>
                        <div className="font-semibold text-lg">Neonate</div>
                        <div className="text-sm text-gray-500">0-28 days old</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all">
                  <RadioGroupItem value="child" id="child" />
                  <Label htmlFor="child" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <User className="w-6 h-6 text-blue-500" />
                      <div>
                        <div className="font-semibold text-lg">Child</div>
                        <div className="text-sm text-gray-500">29 days - 18 years</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all">
                  <RadioGroupItem value="pregnant_postpartum" id="pregnant" />
                  <Label htmlFor="pregnant" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <Heart className="w-6 h-6 text-red-500" />
                      <div>
                        <div className="font-semibold text-lg">Pregnant/Postpartum Mother</div>
                        <div className="text-sm text-gray-500">Currently pregnant or within 6 weeks postpartum</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all">
                  <RadioGroupItem value="adult" id="adult" />
                  <Label htmlFor="adult" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <User className="w-6 h-6 text-gray-600" />
                      <div>
                        <div className="font-semibold text-lg">Adult (Non-pregnant)</div>
                        <div className="text-sm text-gray-500">18+ years, not pregnant</div>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <Button
              onClick={goToNextStep}
              disabled={!patientType}
              className="w-full"
              size="lg"
            >
              Continue <ChevronRight className="ml-2" />
            </Button>
          </Card>
        );

      case 'age-weight':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-2xl font-bold">Patient Demographics</h2>
                <p className="text-gray-500">Enter age and weight for accurate dosing</p>
              </div>
            </div>

            <div className="space-y-4">
              {patientType !== 'neonate' && (
                <div>
                  <Label className="text-lg">Age (years)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={120}
                    value={ageYears || ''}
                    onChange={(e) => setAgeYears(parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 5"
                    className="text-lg p-6"
                  />
                </div>
              )}

              <div>
                <Label className="text-lg">Weight (kg)</Label>
                <Input
                  type="number"
                  step={0.1}
                  min={0.3}
                  max={200}
                  value={weight || ''}
                  onChange={(e) => {
                    const w = parseFloat(e.target.value) || 0;
                    setWeight(w);
                    setExposure((prev) => ({ ...prev, weight: w, age_years: ageYears }));
                  }}
                  placeholder="e.g., 20"
                  className="text-lg p-6"
                />
                {weight > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Equipment will be sized for {weight} kg patient
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={goToPreviousStep}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <ChevronLeft className="mr-2" /> Back
              </Button>
              <Button
                onClick={goToNextStep}
                disabled={!weight}
                className="flex-1"
                size="lg"
              >
                Begin Assessment <ChevronRight className="ml-2" />
              </Button>
            </div>
          </Card>
        );

      case 'airway-status':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Wind className="w-8 h-8 text-red-500" />
              <div>
                <h2 className="text-2xl font-bold">A - Airway</h2>
                <p className="text-gray-500">Is the airway patent (open)?</p>
              </div>
            </div>

            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>CRITICAL:</strong> If airway is obstructed, immediate intervention required
              </AlertDescription>
            </Alert>

            <RadioGroup
              value={airway.status || ''}
              onValueChange={(value) => {
                setAirway((prev) => ({ ...prev, status: value as any }));

                if (value === 'obstructed') {
                  addIntervention({
                    title: '🚨 AIRWAY OBSTRUCTION - IMMEDIATE ACTION',
                    category: 'airway',
                    details: '1. Head tilt-chin lift\n2. Suction if secretions\n3. Consider oropharyngeal airway\n4. Prepare for intubation if no improvement',
                  });
                }

                goToNextStep();
              }}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-green-50 cursor-pointer transition-all">
                  <RadioGroupItem value="patent" id="patent" />
                  <Label htmlFor="patent" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                      <div>
                        <div className="font-semibold text-lg">Patent (Open)</div>
                        <div className="text-sm text-gray-500">Patient speaking/crying, no obstruction sounds</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 border-red-500 rounded-lg hover:bg-red-50 cursor-pointer transition-all">
                  <RadioGroupItem value="obstructed" id="obstructed" />
                  <Label htmlFor="obstructed" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                      <div>
                        <div className="font-semibold text-lg text-red-600">Obstructed</div>
                        <div className="text-sm text-red-600">Stridor, unable to speak, choking</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-all">
                  <RadioGroupItem value="secured" id="secured" />
                  <Label htmlFor="secured" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-blue-500" />
                      <div>
                        <div className="font-semibold text-lg">Secured (ETT/LMA)</div>
                        <div className="text-sm text-gray-500">Endotracheal tube or supraglottic airway in place</div>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <Button
              onClick={goToPreviousStep}
              variant="outline"
              size="lg"
              className="w-full"
            >
              <ChevronLeft className="mr-2" /> Back
            </Button>
          </Card>
        );

      case 'airway-observations':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Wind className="w-8 h-8 text-orange-500" />
              <div>
                <h2 className="text-2xl font-bold">Airway Observations</h2>
                <p className="text-gray-500">Select all that apply</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { value: 'vomiting', label: 'Vomiting/Regurgitation' },
                { value: 'secretions', label: 'Excessive Secretions' },
                { value: 'foreign_body', label: 'Suspected Foreign Body' },
                { value: 'stridor', label: 'Stridor (high-pitched sound)' },
                { value: 'drooling', label: 'Drooling/Unable to Swallow' },
              ].map((item) => (
                <div
                  key={item.value}
                  className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all"
                  onClick={() => {
                    const current = airway.observations || [];
                    const updated = current.includes(item.value)
                      ? current.filter((v) => v !== item.value)
                      : [...current, item.value];
                    setAirway((prev) => ({ ...prev, observations: updated }));

                    if (item.value === 'foreign_body' && !current.includes('foreign_body')) {
                      addIntervention({
                        title: '🚨 FOREIGN BODY ASPIRATION',
                        category: 'airway',
                        details: 'If conscious: Back blows + chest thrusts (infant) or abdominal thrusts (child/adult)\nIf unconscious: CPR + direct laryngoscopy + Magill forceps',
                      });
                    }
                  }}
                >
                  <Checkbox
                    checked={(airway.observations || []).includes(item.value)}
                    onCheckedChange={() => {}}
                  />
                  <Label className="cursor-pointer flex-1 text-base">{item.label}</Label>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={goToPreviousStep} variant="outline" size="lg" className="flex-1">
                <ChevronLeft className="mr-2" /> Back
              </Button>
              <Button onClick={goToNextStep} size="lg" className="flex-1">
                Continue <ChevronRight className="ml-2" />
              </Button>
            </div>
          </Card>
        );

      case 'breathing-rate':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Wind className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-2xl font-bold">B - Breathing Rate</h2>
                <p className="text-gray-500">Count respirations for 30 seconds, multiply by 2</p>
              </div>
            </div>

            <div>
              <Label className="text-lg">Respiratory Rate (breaths/min)</Label>
              <Input
                type="number"
                min={0}
                max={120}
                value={breathing.respiratory_rate || ''}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value) || 0;
                  setBreathing((prev) => ({ ...prev, respiratory_rate: rate }));
                }}
                placeholder="e.g., 30"
                className="text-3xl p-6 text-center font-bold"
              />
              {breathing.respiratory_rate && renderNormalRangeBadge(
                breathing.respiratory_rate,
                normalRanges?.respiratory_rate,
                'breaths/min'
              )}
            </div>

            {breathing.respiratory_rate && normalRanges && (
              <Alert className={isAbnormal(breathing.respiratory_rate, normalRanges.respiratory_rate) ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}>
                <AlertDescription>
                  {breathing.respiratory_rate < (normalRanges.respiratory_rate?.min || 0) && (
                    <span className="text-red-800">
                      <strong>BRADYPNEA:</strong> Consider respiratory failure, CNS depression, fatigue
                    </span>
                  )}
                  {breathing.respiratory_rate > (normalRanges.respiratory_rate?.max || 100) && (
                    <span className="text-red-800">
                      <strong>TACHYPNEA:</strong> Consider respiratory distress, fever, pain, metabolic acidosis
                    </span>
                  )}
                  {!isAbnormal(breathing.respiratory_rate, normalRanges.respiratory_rate) && (
                    <span className="text-green-800">
                      <strong>Normal respiratory rate</strong> for age
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button onClick={goToPreviousStep} variant="outline" size="lg" className="flex-1">
                <ChevronLeft className="mr-2" /> Back
              </Button>
              <Button onClick={goToNextStep} disabled={!breathing.respiratory_rate} size="lg" className="flex-1">
                Continue <ChevronRight className="ml-2" />
              </Button>
            </div>
          </Card>
        );

      case 'breathing-pattern':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-2xl font-bold">Breathing Pattern</h2>
                <p className="text-gray-500">Observe the pattern of breathing</p>
              </div>
            </div>

            <RadioGroup
              value={breathing.pattern || ''}
              onValueChange={(value) => {
                setBreathing((prev) => ({ ...prev, pattern: value as any }));
                goToNextStep();
              }}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-green-50 cursor-pointer transition-all">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                      <div>
                        <div className="font-semibold text-lg">Normal</div>
                        <div className="text-sm text-gray-500">Regular, even breaths</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-orange-50 cursor-pointer transition-all">
                  <RadioGroupItem value="kussmaul" id="kussmaul" />
                  <Label htmlFor="kussmaul" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-6 h-6 text-orange-500" />
                      <div>
                        <div className="font-semibold text-lg">Kussmaul (Deep, Rapid)</div>
                        <div className="text-sm text-gray-500">Suggests metabolic acidosis (DKA, sepsis)</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-purple-50 cursor-pointer transition-all">
                  <RadioGroupItem value="cheyne_stokes" id="cheyne_stokes" />
                  <Label htmlFor="cheyne_stokes" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <Activity className="w-6 h-6 text-purple-500" />
                      <div>
                        <div className="font-semibold text-lg">Cheyne-Stokes (Crescendo-Decrescendo)</div>
                        <div className="text-sm text-gray-500">Suggests brainstem injury, heart failure</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-red-50 cursor-pointer transition-all">
                  <RadioGroupItem value="apneic" id="apneic" />
                  <Label htmlFor="apneic" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                      <div>
                        <div className="font-semibold text-lg text-red-600">Apneic/Gasping</div>
                        <div className="text-sm text-red-600">CRITICAL: Respiratory arrest imminent</div>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <Button onClick={goToPreviousStep} variant="outline" size="lg" className="w-full">
              <ChevronLeft className="mr-2" /> Back
            </Button>
          </Card>
        );

      case 'breathing-effort':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Wind className="w-8 h-8 text-orange-500" />
              <div>
                <h2 className="text-2xl font-bold">Work of Breathing</h2>
                <p className="text-gray-500">Select all signs of respiratory distress</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { value: 'retractions', label: 'Retractions (chest indrawing)', severity: 'moderate' },
                { value: 'nasal_flaring', label: 'Nasal Flaring', severity: 'moderate' },
                { value: 'grunting', label: 'Grunting', severity: 'severe' },
                { value: 'head_bobbing', label: 'Head Bobbing', severity: 'severe' },
                { value: 'see_saw', label: 'See-Saw Breathing', severity: 'severe' },
                { value: 'tripod', label: 'Tripod Positioning', severity: 'severe' },
              ].map((item) => (
                <div
                  key={item.value}
                  className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all"
                  onClick={() => {
                    const current = breathing.work_of_breathing || [];
                    const updated = current.includes(item.value)
                      ? current.filter((v) => v !== item.value)
                      : [...current, item.value];
                    setBreathing((prev) => ({ ...prev, work_of_breathing: updated }));
                  }}
                >
                  <Checkbox
                    checked={(breathing.work_of_breathing || []).includes(item.value)}
                    onCheckedChange={() => {}}
                  />
                  <Label className="cursor-pointer flex-1 text-base">{item.label}</Label>
                  <Badge className={item.severity === 'severe' ? 'bg-red-600' : 'bg-orange-500'}>
                    {item.severity}
                  </Badge>
                </div>
              ))}
            </div>

            {(breathing.work_of_breathing?.length || 0) > 0 && (
              <Alert className="bg-orange-50 border-orange-200">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Respiratory distress detected.</strong> Prepare for oxygen therapy and possible ventilatory support.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button onClick={goToPreviousStep} variant="outline" size="lg" className="flex-1">
                <ChevronLeft className="mr-2" /> Back
              </Button>
              <Button onClick={goToNextStep} size="lg" className="flex-1">
                Continue <ChevronRight className="ml-2" />
              </Button>
            </div>
          </Card>
        );

      case 'spo2':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-red-500" />
              <div>
                <h2 className="text-2xl font-bold">Oxygen Saturation (SpO2)</h2>
                <p className="text-gray-500">Pulse oximetry reading</p>
              </div>
            </div>

            <div>
              <Label className="text-lg">SpO2 (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={breathing.spo2 || ''}
                onChange={(e) => {
                  const spo2 = parseFloat(e.target.value) || 0;
                  setBreathing((prev) => ({ ...prev, spo2 }));

                  if (spo2 < 90 && spo2 > 0) {
                    addIntervention({
                      title: '🚨 HYPOXEMIA - OXYGEN THERAPY',
                      category: 'breathing',
                      details: `Target SpO2: ${patientType === 'neonate' ? '90-95%' : '≥94%'}\n\nStart with:\n- Nasal cannula 1-2 L/min, OR\n- Simple face mask 5-10 L/min\n\nEscalate if needed:\n- Non-rebreather mask 10-15 L/min\n- High-flow nasal cannula\n- CPAP/BiPAP\n- Intubation + mechanical ventilation`,
                    });
                  }
                }}
                placeholder="e.g., 98"
                className="text-3xl p-6 text-center font-bold"
              />
              {breathing.spo2 && (
                <div className="mt-2 flex items-center gap-2">
                  {breathing.spo2 < 90 ? (
                    <Badge className="bg-red-600">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      CRITICAL
                    </Badge>
                  ) : breathing.spo2 < 94 ? (
                    <Badge className="bg-orange-500">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Low
                    </Badge>
                  ) : (
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Normal
                    </Badge>
                  )}
                  <span className="text-sm text-gray-500">
                    Target: {patientType === 'neonate' ? '90-95%' : '≥94%'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={goToPreviousStep} variant="outline" size="lg" className="flex-1">
                <ChevronLeft className="mr-2" /> Back
              </Button>
              <Button onClick={goToNextStep} disabled={!breathing.spo2} size="lg" className="flex-1">
                Continue <ChevronRight className="ml-2" />
              </Button>
            </div>
          </Card>
        );

      case 'lung-sounds':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Stethoscope className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-2xl font-bold">Lung Sounds</h2>
                <p className="text-gray-500">Auscultate all lung fields</p>
              </div>
            </div>

            <RadioGroup
              value={breathing.lung_sounds || ''}
              onValueChange={(value) => {
                setBreathing((prev) => ({ ...prev, lung_sounds: value as any }));
                goToNextStep();
              }}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-green-50 cursor-pointer transition-all">
                  <RadioGroupItem value="clear" id="clear" />
                  <Label htmlFor="clear" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                      <div>
                        <div className="font-semibold text-lg">Clear/Normal</div>
                        <div className="text-sm text-gray-500">Bilateral air entry, no added sounds</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-all">
                  <RadioGroupItem value="crackles" id="crackles" />
                  <Label htmlFor="crackles" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <Droplet className="w-6 h-6 text-blue-500" />
                      <div>
                        <div className="font-semibold text-lg">Crackles/Rales</div>
                        <div className="text-sm text-gray-500">Suggests fluid (pneumonia, pulmonary edema)</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-orange-50 cursor-pointer transition-all">
                  <RadioGroupItem value="wheezes" id="wheezes" />
                  <Label htmlFor="wheezes" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <Wind className="w-6 h-6 text-orange-500" />
                      <div>
                        <div className="font-semibold text-lg">Wheezes</div>
                        <div className="text-sm text-gray-500">Bronchospasm (asthma, bronchiolitis)</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-red-50 cursor-pointer transition-all">
                  <RadioGroupItem value="stridor" id="stridor-lung" />
                  <Label htmlFor="stridor-lung" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                      <div>
                        <div className="font-semibold text-lg">Stridor</div>
                        <div className="text-sm text-gray-500">Upper airway obstruction (croup, foreign body)</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-purple-50 cursor-pointer transition-all">
                  <RadioGroupItem value="decreased" id="decreased" />
                  <Label htmlFor="decreased" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <TrendingDown className="w-6 h-6 text-purple-500" />
                      <div>
                        <div className="font-semibold text-lg">Decreased/Absent</div>
                        <div className="text-sm text-gray-500">Pneumothorax, pleural effusion, severe consolidation</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 border-red-500 rounded-lg hover:bg-red-50 cursor-pointer transition-all">
                  <RadioGroupItem value="silent_chest" id="silent_chest" />
                  <Label htmlFor="silent_chest" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                      <div>
                        <div className="font-semibold text-lg text-red-600">Silent Chest</div>
                        <div className="text-sm text-red-600">CRITICAL: Severe asthma/bronchospasm</div>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <Button onClick={goToPreviousStep} variant="outline" size="lg" className="w-full">
              <ChevronLeft className="mr-2" /> Back
            </Button>
          </Card>
        );

      case 'heart-rate':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500" />
              <div>
                <h2 className="text-2xl font-bold">C - Heart Rate</h2>
                <p className="text-gray-500">Palpate pulse or auscultate heart</p>
              </div>
            </div>

            <div>
              <Label className="text-lg">Heart Rate (beats/min)</Label>
              <Input
                type="number"
                min={0}
                max={300}
                value={circulation.heart_rate || ''}
                onChange={(e) => {
                  const hr = parseFloat(e.target.value) || 0;
                  setCirculation((prev) => ({ ...prev, heart_rate: hr }));
                }}
                placeholder="e.g., 120"
                className="text-3xl p-6 text-center font-bold"
              />
              {circulation.heart_rate && renderNormalRangeBadge(
                circulation.heart_rate,
                normalRanges?.heart_rate,
                'bpm'
              )}
            </div>

            {circulation.heart_rate && normalRanges && (
              <Alert className={isAbnormal(circulation.heart_rate, normalRanges.heart_rate) ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}>
                <AlertDescription>
                  {circulation.heart_rate < (normalRanges.heart_rate?.min || 0) && (
                    <span className="text-red-800">
                      <strong>BRADYCARDIA:</strong> Consider hypoxia, hypothermia, heart block, increased ICP
                    </span>
                  )}
                  {circulation.heart_rate > (normalRanges.heart_rate?.max || 300) && (
                    <span className="text-red-800">
                      <strong>TACHYCARDIA:</strong> Consider shock, fever, pain, arrhythmia, anemia
                    </span>
                  )}
                  {!isAbnormal(circulation.heart_rate, normalRanges.heart_rate) && (
                    <span className="text-green-800">
                      <strong>Normal heart rate</strong> for age
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button onClick={goToPreviousStep} variant="outline" size="lg" className="flex-1">
                <ChevronLeft className="mr-2" /> Back
              </Button>
              <Button onClick={goToNextStep} disabled={!circulation.heart_rate} size="lg" className="flex-1">
                Continue <ChevronRight className="ml-2" />
              </Button>
            </div>
          </Card>
        );

      case 'perfusion':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-purple-500" />
              <div>
                <h2 className="text-2xl font-bold">Perfusion Assessment</h2>
                <p className="text-gray-500">Evaluate circulation quality</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-lg">Capillary Refill Time (seconds)</Label>
                <Input
                  type="number"
                  step={0.1}
                  min={0}
                  max={10}
                  value={circulation.capillary_refill || ''}
                  onChange={(e) => {
                    const crt = parseFloat(e.target.value) || 0;
                    setCirculation((prev) => ({ ...prev, capillary_refill: crt }));

                    if (crt > 3) {
                      addIntervention({
                        title: '⚠️ POOR PERFUSION - SHOCK PROTOCOL',
                        category: 'circulation',
                        details: `Prolonged CRT (${crt}s) suggests shock\n\n1. Establish IV/IO access\n2. Fluid bolus: ${(weight * 20).toFixed(0)} mL (20 mL/kg) over 10-20 min\n3. Reassess after each bolus\n4. Consider inotropes if no response after 40-60 mL/kg`,
                      });
                    }
                  }}
                  placeholder="e.g., 2"
                  className="text-2xl p-6 text-center font-bold"
                />
                {circulation.capillary_refill && (
                  <div className="mt-2 flex items-center gap-2">
                    {circulation.capillary_refill <= 2 ? (
                      <Badge className="bg-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Normal
                      </Badge>
                    ) : circulation.capillary_refill <= 3 ? (
                      <Badge className="bg-orange-500">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Borderline
                      </Badge>
                    ) : (
                      <Badge className="bg-red-600">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Prolonged
                      </Badge>
                    )}
                    <span className="text-sm text-gray-500">Normal: ≤2 seconds</span>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-lg">Peripheral Pulses</Label>
                <RadioGroup
                  value={circulation.pulses || ''}
                  onValueChange={(value) => setCirculation((prev) => ({ ...prev, pulses: value as any }))}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="strong" id="strong" />
                      <Label htmlFor="strong" className="cursor-pointer flex-1">Strong/Bounding</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="normal" id="normal-pulse" />
                      <Label htmlFor="normal-pulse" className="cursor-pointer flex-1">Normal</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="weak" id="weak" />
                      <Label htmlFor="weak" className="cursor-pointer flex-1">Weak/Thready</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="absent" id="absent" />
                      <Label htmlFor="absent" className="cursor-pointer flex-1">Absent</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-lg">Skin Temperature & Color</Label>
                <div className="space-y-2 mt-2">
                  {[
                    { value: 'warm_pink', label: 'Warm & Pink (normal)' },
                    { value: 'cool_pale', label: 'Cool & Pale' },
                    { value: 'cold_mottled', label: 'Cold & Mottled' },
                    { value: 'warm_flushed', label: 'Warm & Flushed (vasodilated)' },
                  ].map((item) => (
                    <div
                      key={item.value}
                      className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => setCirculation((prev) => ({ ...prev, skin_temp_color: item.value as any }))}
                    >
                      <RadioGroupItem value={item.value} id={item.value} />
                      <Label htmlFor={item.value} className="cursor-pointer flex-1">{item.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={goToPreviousStep} variant="outline" size="lg" className="flex-1">
                <ChevronLeft className="mr-2" /> Back
              </Button>
              <Button onClick={goToNextStep} disabled={!circulation.capillary_refill || !circulation.pulses || !circulation.skin_temp_color} size="lg" className="flex-1">
                Continue <ChevronRight className="ml-2" />
              </Button>
            </div>
          </Card>
        );

      case 'jvp':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-2xl font-bold">Jugular Venous Pressure (JVP)</h2>
                <p className="text-gray-500">Assess neck veins at 45° angle</p>
              </div>
            </div>

            <RadioGroup
              value={circulation.jvp || ''}
              onValueChange={(value) => {
                setCirculation((prev) => ({ ...prev, jvp: value as any }));
                goToNextStep();
              }}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-green-50 cursor-pointer">
                  <RadioGroupItem value="normal" id="jvp-normal" />
                  <Label htmlFor="jvp-normal" className="cursor-pointer flex-1">
                    <div>
                      <div className="font-semibold text-lg">Normal (not visible)</div>
                      <div className="text-sm text-gray-500">JVP not elevated</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-red-50 cursor-pointer">
                  <RadioGroupItem value="elevated" id="jvp-elevated" />
                  <Label htmlFor="jvp-elevated" className="cursor-pointer flex-1">
                    <div>
                      <div className="font-semibold text-lg">Elevated</div>
                      <div className="text-sm text-gray-500">Suggests heart failure, tamponade, tension pneumothorax</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-orange-50 cursor-pointer">
                  <RadioGroupItem value="flat" id="jvp-flat" />
                  <Label htmlFor="jvp-flat" className="cursor-pointer flex-1">
                    <div>
                      <div className="font-semibold text-lg">Flat/Not Visible</div>
                      <div className="text-sm text-gray-500">Suggests hypovolemia/dehydration</div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <Button onClick={goToPreviousStep} variant="outline" size="lg" className="w-full">
              <ChevronLeft className="mr-2" /> Back
            </Button>
          </Card>
        );

      case 'avpu':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-500" />
              <div>
                <h2 className="text-2xl font-bold">D - AVPU Level of Consciousness</h2>
                <p className="text-gray-500">Assess responsiveness</p>
              </div>
            </div>

            <RadioGroup
              value={disability.avpu || ''}
              onValueChange={(value) => {
                setDisability((prev) => ({ ...prev, avpu: value as any }));

                if (value === 'pain' || value === 'unresponsive') {
                  addIntervention({
                    title: '🚨 ALTERED MENTAL STATUS',
                    category: 'disability',
                    details: 'Check glucose immediately\nProtect airway\nConsider:\n- Hypoglycemia\n- Hypoxia\n- Shock\n- Seizure (postictal)\n- Intoxication\n- Infection (meningitis)\n- Increased ICP',
                  });
                }

                goToNextStep();
              }}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-green-50 cursor-pointer">
                  <RadioGroupItem value="alert" id="alert" />
                  <Label htmlFor="alert" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                      <div>
                        <div className="font-semibold text-lg">A - Alert</div>
                        <div className="text-sm text-gray-500">Awake, oriented, interactive</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-yellow-50 cursor-pointer">
                  <RadioGroupItem value="voice" id="voice" />
                  <Label htmlFor="voice" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-yellow-500" />
                      <div>
                        <div className="font-semibold text-lg">V - Voice</div>
                        <div className="text-sm text-gray-500">Responds to verbal stimuli only</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-orange-50 cursor-pointer">
                  <RadioGroupItem value="pain" id="pain" />
                  <Label htmlFor="pain" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-orange-500" />
                      <div>
                        <div className="font-semibold text-lg">P - Pain</div>
                        <div className="text-sm text-gray-500">Responds to painful stimuli only</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 border-red-500 rounded-lg hover:bg-red-50 cursor-pointer">
                  <RadioGroupItem value="unresponsive" id="unresponsive" />
                  <Label htmlFor="unresponsive" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                      <div>
                        <div className="font-semibold text-lg text-red-600">U - Unresponsive</div>
                        <div className="text-sm text-red-600">No response to any stimuli</div>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <Button onClick={goToPreviousStep} variant="outline" size="lg" className="w-full">
              <ChevronLeft className="mr-2" /> Back
            </Button>
          </Card>
        );

      case 'pupils':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-2xl font-bold">Pupil Examination</h2>
                <p className="text-gray-500">Assess size, reactivity, and equality</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-lg">Pupil Size</Label>
                <RadioGroup
                  value={disability.pupils_size || ''}
                  onValueChange={(value) => setDisability((prev) => ({ ...prev, pupils_size: value as any }))}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="pinpoint" id="pinpoint" />
                      <Label htmlFor="pinpoint" className="cursor-pointer flex-1">Pinpoint (opioid toxicity)</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="normal" id="pupils-normal" />
                      <Label htmlFor="pupils-normal" className="cursor-pointer flex-1">Normal (2-4mm)</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="dilated" id="dilated" />
                      <Label htmlFor="dilated" className="cursor-pointer flex-1">Dilated (>6mm)</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-lg">Pupil Reactivity</Label>
                <RadioGroup
                  value={disability.pupils_reactive || ''}
                  onValueChange={(value) => setDisability((prev) => ({ ...prev, pupils_reactive: value as any }))}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="brisk" id="brisk" />
                      <Label htmlFor="brisk" className="cursor-pointer flex-1">Brisk (normal)</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="sluggish" id="sluggish" />
                      <Label htmlFor="sluggish" className="cursor-pointer flex-1">Sluggish</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="fixed" id="fixed" />
                      <Label htmlFor="fixed" className="cursor-pointer flex-1">Fixed/Non-reactive (CRITICAL)</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-lg">Pupil Equality</Label>
                <RadioGroup
                  value={disability.pupils_equal || ''}
                  onValueChange={(value) => setDisability((prev) => ({ ...prev, pupils_equal: value as any }))}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="equal" id="equal" />
                      <Label htmlFor="equal" className="cursor-pointer flex-1">Equal</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="unequal" id="unequal" />
                      <Label htmlFor="unequal" className="cursor-pointer flex-1">Unequal (anisocoria)</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {(disability.pupils_reactive === 'fixed' || disability.pupils_equal === 'unequal') && (
              <Alert className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>CRITICAL FINDING:</strong> Fixed or unequal pupils suggest increased ICP, brainstem injury, or herniation. Urgent neurosurgical evaluation needed.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button onClick={goToPreviousStep} variant="outline" size="lg" className="flex-1">
                <ChevronLeft className="mr-2" /> Back
              </Button>
              <Button onClick={goToNextStep} disabled={!disability.pupils_size || !disability.pupils_reactive || !disability.pupils_equal} size="lg" className="flex-1">
                Continue <ChevronRight className="ml-2" />
              </Button>
            </div>
          </Card>
        );

      case 'glucose':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Droplet className="w-8 h-8 text-orange-500" />
              <div>
                <h2 className="text-2xl font-bold">Blood Glucose</h2>
                <p className="text-gray-500">Point-of-care glucose testing</p>
              </div>
            </div>

            <div>
              <Label className="text-lg">Blood Glucose (mmol/L)</Label>
              <Input
                type="number"
                step={0.1}
                min={0}
                max={50}
                value={disability.glucose || ''}
                onChange={(e) => {
                  const glucose = parseFloat(e.target.value) || 0;
                  setDisability((prev) => ({ ...prev, glucose }));

                  if (glucose < 3.3 && glucose > 0) {
                    const dextroseVolume = weight * 2; // 0.2 g/kg = 2 mL/kg of D10
                    addIntervention({
                      title: '🚨 HYPOGLYCEMIA - IMMEDIATE TREATMENT',
                      category: 'disability',
                      details: `Glucose: ${glucose} mmol/L (LOW)\n\nTreatment:\n- Conscious: Oral glucose/juice\n- Unconscious: IV dextrose\n  * D10W: ${dextroseVolume.toFixed(1)} mL (2 mL/kg) IV push\n  * OR D25W: ${(dextroseVolume / 2.5).toFixed(1)} mL (0.8 mL/kg)\n  * OR D50W: ${(dextroseVolume / 5).toFixed(1)} mL (0.4 mL/kg) - adults only\n\nRecheck glucose in 15 minutes`,
                    });
                  } else if (glucose > 16.7) {
                    addIntervention({
                      title: '⚠️ HYPERGLYCEMIA DETECTED',
                      category: 'disability',
                      details: `Glucose: ${glucose} mmol/L (HIGH)\n\nConsider:\n- Diabetic ketoacidosis (DKA)\n- Hyperosmolar hyperglycemic state (HHS)\n- New-onset diabetes\n\nCheck:\n- Ketones (urine/blood)\n- Venous blood gas (pH, HCO3)\n- Electrolytes\n\nIf DKA suspected, start DKA protocol`,
                    });
                  }
                }}
                placeholder="e.g., 5.5"
                className="text-3xl p-6 text-center font-bold"
              />
              {disability.glucose && (
                <div className="mt-2 flex items-center gap-2">
                  {disability.glucose < 3.3 ? (
                    <Badge className="bg-red-600">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      LOW
                    </Badge>
                  ) : disability.glucose > 16.7 ? (
                    <Badge className="bg-orange-500">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      HIGH
                    </Badge>
                  ) : (
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Normal
                    </Badge>
                  )}
                  <span className="text-sm text-gray-500">Normal: 3.3-16.7 mmol/L</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={goToPreviousStep} variant="outline" size="lg" className="flex-1">
                <ChevronLeft className="mr-2" /> Back
              </Button>
              <Button onClick={goToNextStep} disabled={!disability.glucose} size="lg" className="flex-1">
                Continue <ChevronRight className="ml-2" />
              </Button>
            </div>
          </Card>
        );

      case 'seizure':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-yellow-500" />
              <div>
                <h2 className="text-2xl font-bold">Seizure Activity</h2>
                <p className="text-gray-500">Current or recent seizures?</p>
              </div>
            </div>

            <RadioGroup
              value={disability.seizure_activity || ''}
              onValueChange={(value) => {
                setDisability((prev) => ({ ...prev, seizure_activity: value as any }));
                goToNextStep();
              }}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-green-50 cursor-pointer">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                      <div>
                        <div className="font-semibold text-lg">No Seizure Activity</div>
                        <div className="text-sm text-gray-500">No current or recent seizures</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 border-red-500 rounded-lg hover:bg-red-50 cursor-pointer">
                  <RadioGroupItem value="active" id="active" />
                  <Label htmlFor="active" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                      <div>
                        <div className="font-semibold text-lg text-red-600">Active Seizure NOW</div>
                        <div className="text-sm text-red-600">Seizing at this moment</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-yellow-50 cursor-pointer">
                  <RadioGroupItem value="recent" id="recent" />
                  <Label htmlFor="recent" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <Clock className="w-6 h-6 text-yellow-500" />
                      <div>
                        <div className="font-semibold text-lg">Recent Seizure (stopped)</div>
                        <div className="text-sm text-gray-500">Postictal period</div>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <Button onClick={goToPreviousStep} variant="outline" size="lg" className="w-full">
              <ChevronLeft className="mr-2" /> Back
            </Button>
          </Card>
        );

      case 'temperature':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Thermometer className="w-8 h-8 text-red-500" />
              <div>
                <h2 className="text-2xl font-bold">E - Temperature</h2>
                <p className="text-gray-500">Core body temperature</p>
              </div>
            </div>

            <div>
              <Label className="text-lg">Temperature (°C)</Label>
              <Input
                type="number"
                step={0.1}
                min={30}
                max={45}
                value={exposure.temperature || ''}
                onChange={(e) => {
                  const temp = parseFloat(e.target.value) || 0;
                  setExposure((prev) => ({ ...prev, temperature: temp }));

                  if (temp < 36 && temp > 0) {
                    addIntervention({
                      title: '⚠️ HYPOTHERMIA',
                      category: 'exposure',
                      details: `Temperature: ${temp}°C\n\nManagement:\n- Remove wet clothing\n- Warm blankets\n- Warm IV fluids (37-40°C)\n- Forced air warming device\n- Monitor for arrhythmias\n\nSevere (<32°C): Consider ECMO/cardiopulmonary bypass`,
                    });
                  } else if (temp >= 38) {
                    addIntervention({
                      title: '⚠️ FEVER DETECTED',
                      category: 'exposure',
                      details: `Temperature: ${temp}°C\n\nConsider:\n- Infection (sepsis, meningitis, pneumonia)\n- Heat stroke\n- Drug reaction\n\nTreatment:\n- Antipyretics (paracetamol, ibuprofen)\n- Cooling measures if >39.5°C\n- Blood cultures before antibiotics\n- Source control`,
                    });
                  }
                }}
                placeholder="e.g., 37.0"
                className="text-3xl p-6 text-center font-bold"
              />
              {exposure.temperature && (
                <div className="mt-2 flex items-center gap-2">
                  {exposure.temperature < 36 ? (
                    <Badge className="bg-blue-600">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      HYPOTHERMIA
                    </Badge>
                  ) : exposure.temperature >= 38 && exposure.temperature < 39.5 ? (
                    <Badge className="bg-orange-500">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      FEVER
                    </Badge>
                  ) : exposure.temperature >= 39.5 ? (
                    <Badge className="bg-red-600">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      HIGH FEVER
                    </Badge>
                  ) : (
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Normal
                    </Badge>
                  )}
                  <span className="text-sm text-gray-500">Normal: 36.0-37.5°C</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={goToPreviousStep} variant="outline" size="lg" className="flex-1">
                <ChevronLeft className="mr-2" /> Back
              </Button>
              <Button onClick={goToNextStep} disabled={!exposure.temperature} size="lg" className="flex-1">
                Continue <ChevronRight className="ml-2" />
              </Button>
            </div>
          </Card>
        );

      case 'skin-findings':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8 text-purple-500" />
              <div>
                <h2 className="text-2xl font-bold">Skin Findings</h2>
                <p className="text-gray-500">Select all that apply</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { value: 'normal', label: 'Normal (no abnormalities)' },
                { value: 'rash', label: 'Rash (non-blanching or blanching)' },
                { value: 'petechiae', label: 'Petechiae/Purpura' },
                { value: 'jaundice', label: 'Jaundice (yellow)' },
                { value: 'cyanosis', label: 'Cyanosis (blue)' },
                { value: 'mottling', label: 'Mottling (marbled appearance)' },
                { value: 'urticaria', label: 'Urticaria (hives)' },
                { value: 'burns', label: 'Burns' },
                { value: 'trauma', label: 'Trauma/Bruising' },
              ].map((item) => (
                <div
                  key={item.value}
                  className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all"
                  onClick={() => {
                    const current = exposure.skin_findings || [];
                    const updated = current.includes(item.value)
                      ? current.filter((v) => v !== item.value)
                      : [...current, item.value];
                    setExposure((prev) => ({ ...prev, skin_findings: updated }));
                  }}
                >
                  <Checkbox
                    checked={(exposure.skin_findings || []).includes(item.value)}
                    onCheckedChange={() => {}}
                  />
                  <Label className="cursor-pointer flex-1 text-base">{item.label}</Label>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={goToPreviousStep} variant="outline" size="lg" className="flex-1">
                <ChevronLeft className="mr-2" /> Back
              </Button>
              <Button onClick={goToNextStep} size="lg" className="flex-1">
                Continue <ChevronRight className="ml-2" />
              </Button>
            </div>
          </Card>
        );

      case 'abdominal-exam':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-orange-500" />
              <div>
                <h2 className="text-2xl font-bold">Abdominal Examination</h2>
                <p className="text-gray-500">Inspect and palpate abdomen</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { value: 'soft', label: 'Soft, non-tender (normal)' },
                { value: 'distended', label: 'Distended' },
                { value: 'tender', label: 'Tender (localized or diffuse)' },
                { value: 'guarding', label: 'Guarding/Rigidity' },
                { value: 'rebound', label: 'Rebound tenderness' },
                { value: 'mass', label: 'Palpable mass' },
              ].map((item) => (
                <div
                  key={item.value}
                  className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all"
                  onClick={() => {
                    const current = exposure.abdominal_findings || [];
                    const updated = current.includes(item.value)
                      ? current.filter((v) => v !== item.value)
                      : [...current, item.value];
                    setExposure((prev) => ({ ...prev, abdominal_findings: updated }));
                  }}
                >
                  <Checkbox
                    checked={(exposure.abdominal_findings || []).includes(item.value)}
                    onCheckedChange={() => {}}
                  />
                  <Label className="cursor-pointer flex-1 text-base">{item.label}</Label>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={goToPreviousStep} variant="outline" size="lg" className="flex-1">
                <ChevronLeft className="mr-2" /> Back
              </Button>
              <Button onClick={goToNextStep} size="lg" className="flex-1">
                Continue <ChevronRight className="ml-2" />
              </Button>
            </div>
          </Card>
        );

      case 'trauma-history':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <h2 className="text-2xl font-bold">Trauma History</h2>
                <p className="text-gray-500">Any recent injury or trauma?</p>
              </div>
            </div>

            <RadioGroup
              value={hasTrauma ? 'yes' : 'no'}
              onValueChange={(value) => {
                setHasTrauma(value === 'yes');
                setExposure((prev) => ({ ...prev, trauma_history: value === 'yes' }));
                goToNextStep();
              }}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-green-50 cursor-pointer">
                  <RadioGroupItem value="no" id="no-trauma" />
                  <Label htmlFor="no-trauma" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                      <div>
                        <div className="font-semibold text-lg">No Trauma</div>
                        <div className="text-sm text-gray-500">No recent injury</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-red-50 cursor-pointer">
                  <RadioGroupItem value="yes" id="yes-trauma" />
                  <Label htmlFor="yes-trauma" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                      <div>
                        <div className="font-semibold text-lg">Trauma Present</div>
                        <div className="text-sm text-gray-500">Recent injury or accident</div>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <Button onClick={goToPreviousStep} variant="outline" size="lg" className="w-full">
              <ChevronLeft className="mr-2" /> Back
            </Button>
          </Card>
        );

      case 'toxin-history':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Pill className="w-8 h-8 text-purple-500" />
              <div>
                <h2 className="text-2xl font-bold">Toxin/Ingestion History</h2>
                <p className="text-gray-500">Possible poisoning or overdose?</p>
              </div>
            </div>

            <RadioGroup
              value={hasToxinExposure ? 'yes' : 'no'}
              onValueChange={(value) => {
                setHasToxinExposure(value === 'yes');
                setExposure((prev) => ({ ...prev, toxin_exposure: value === 'yes' }));
                goToNextStep();
              }}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-green-50 cursor-pointer">
                  <RadioGroupItem value="no" id="no-toxin" />
                  <Label htmlFor="no-toxin" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                      <div>
                        <div className="font-semibold text-lg">No Toxin Exposure</div>
                        <div className="text-sm text-gray-500">No ingestion or poisoning</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:bg-purple-50 cursor-pointer">
                  <RadioGroupItem value="yes" id="yes-toxin" />
                  <Label htmlFor="yes-toxin" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <Pill className="w-6 h-6 text-purple-500" />
                      <div>
                        <div className="font-semibold text-lg">Possible Toxin Exposure</div>
                        <div className="text-sm text-gray-500">Ingestion, overdose, or poisoning</div>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <Button onClick={goToPreviousStep} variant="outline" size="lg" className="w-full">
              <ChevronLeft className="mr-2" /> Back
            </Button>
          </Card>
        );

      case 'medical-history':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-2xl font-bold">Medical History (Optional)</h2>
                <p className="text-gray-500">Any relevant medical conditions or medications?</p>
              </div>
            </div>

            <div>
              <Label className="text-lg">Medical History</Label>
              <Textarea
                value={exposure.medical_history || ''}
                onChange={(e) => setExposure((prev) => ({ ...prev, medical_history: e.target.value }))}
                placeholder="e.g., Asthma, diabetes, seizures, medications..."
                className="min-h-32 text-base"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={goToPreviousStep} variant="outline" size="lg" className="flex-1">
                <ChevronLeft className="mr-2" /> Back
              </Button>
              <Button onClick={goToNextStep} size="lg" className="flex-1">
                Complete Assessment <ChevronRight className="ml-2" />
              </Button>
            </div>
          </Card>
        );

      case 'complete':
        // Save complete survey data
        const surveyData: PrimarySurveyData = {
          patientType: patientType!,
          physiologicState: 'critical', // Will be determined by Clinical Reasoning Engine
          airway: airway as AirwayAssessment,
          breathing: breathing as BreathingAssessment,
          circulation: circulation as CirculationAssessment,
          disability: disability as DisabilityAssessment,
          exposure: { ...exposure, weight, age_years: ageYears } as ExposureAssessment,
        };

        // Navigate to Clinical Reasoning Results with survey data
        setLocation(`/clinical-reasoning-results?sessionId=${sessionId}&data=${encodeURIComponent(JSON.stringify(surveyData))}`);
        return null;

      default:
        return (
          <Card className="p-6 space-y-6">
            <div className="text-center">
              <p className="text-gray-500 mb-4">Step: {step}</p>
              <p className="text-sm text-gray-400">This step is under construction. Continuing to next step...</p>
              <div className="flex gap-3 mt-6">
                <Button onClick={goToPreviousStep} variant="outline" size="lg" className="flex-1">
                  <ChevronLeft className="mr-2" /> Back
                </Button>
                <Button onClick={goToNextStep} size="lg" className="flex-1">
                  Continue <ChevronRight className="ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        );
    }
  };

  const currentStepIndex = stepOrder.indexOf(step);
  const progress = ((currentStepIndex + 1) / stepOrder.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* Progress Bar */}
      <div className="max-w-6xl mx-auto mb-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600">
              Step {currentStepIndex + 1} of {stepOrder.length}
            </span>
            <div className="flex items-center gap-2">
              {voiceSupported && step !== 'patient-type' && (
                <Button
                  variant={isVoiceActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsVoiceActive(!isVoiceActive)}
                  className={isVoiceActive ? 'bg-red-600 hover:bg-red-700 animate-pulse' : ''}
                >
                  {isVoiceActive ? (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Listening...
                    </>
                  ) : (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Voice
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/clinical-assessment')}
              >
                <Home className="w-4 h-4 mr-2" />
                Exit
              </Button>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2">{renderStep()}</div>

        {/* Intervention Sidebar */}
        {step !== 'patient-type' && (
          <div className="lg:col-span-1">
            <InterventionSidebar
              sessionId={sessionId}
              patientWeight={weight}
              interventions={interventions}
              onInterventionStatusChange={handleInterventionStatusChange}
              onRemoveIntervention={handleRemoveIntervention}
              className="sticky top-4"
            />
          </div>
        )}
      </div>
    </div>
  );
}
