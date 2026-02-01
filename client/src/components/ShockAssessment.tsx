/**
 * Shock Assessment Component - GPS-like step-by-step shock differentiation
 * Guides provider through systematic assessment to identify shock type
 * before recommending fluid therapy
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock, Heart, Activity, Droplets, Phone, ArrowRight, ArrowLeft, Syringe } from 'lucide-react';
import { triggerAlert, triggerHaptic } from '@/lib/alertSystem';

// Types
type ShockType = 'hypovolemic' | 'cardiogenic' | 'septic' | 'anaphylactic' | 'obstructive' | 'undifferentiated';

interface AssessmentStep {
  id: string;
  order: number;
  parameter: string;
  question: string;
  method: string;
  options: { value: string; label: string; interpretation: string; shockTypes: ShockType[]; isNormal: boolean }[];
  clinicalTip: string;
  completed: boolean;
  selectedValue?: string;
}

interface ShockScore {
  type: ShockType;
  score: number;
  evidence: string[];
}

interface Props {
  weightKg: number;
  onShockTypeIdentified: (type: ShockType, scores: ShockScore[]) => void;
  onAccessTimerStart: () => void;
  onReferralRequested: (reason: string) => void;
}

// Assessment steps data
const assessmentSteps: Omit<AssessmentStep, 'completed' | 'selectedValue'>[] = [
  {
    id: 'pulses',
    order: 1,
    parameter: 'Central vs Peripheral Pulses',
    question: 'Compare central (carotid/femoral) and peripheral (radial/dorsalis pedis) pulses:',
    method: 'Palpate both simultaneously',
    options: [
      { value: 'both_strong', label: 'Both strong and equal', interpretation: 'Normal perfusion', shockTypes: [], isNormal: true },
      { value: 'weak_peripheral', label: 'Weak peripheral, strong central', interpretation: 'Compensated shock - peripheral vasoconstriction', shockTypes: ['hypovolemic', 'septic', 'cardiogenic'], isNormal: false },
      { value: 'both_weak', label: 'Both weak', interpretation: 'Decompensated shock - CRITICAL', shockTypes: ['hypovolemic', 'septic', 'cardiogenic', 'obstructive'], isNormal: false },
      { value: 'bounding', label: 'Bounding peripheral pulses', interpretation: 'Warm/distributive shock (early sepsis, anaphylaxis)', shockTypes: ['septic', 'anaphylactic'], isNormal: false },
      { value: 'unequal', label: 'Unequal (arm vs arm or arm vs leg)', interpretation: 'Consider aortic pathology', shockTypes: ['obstructive'], isNormal: false }
    ],
    clinicalTip: 'In infants, use brachial pulse instead of radial'
  },
  {
    id: 'pallor',
    order: 2,
    parameter: 'Palmar Pallor',
    question: 'Open the child\'s palm and compare to your palm or inner conjunctiva:',
    method: 'Visual inspection',
    options: [
      { value: 'pink', label: 'Pink palm creases', interpretation: 'Normal', shockTypes: [], isNormal: true },
      { value: 'pale', label: 'Pale palm creases', interpretation: 'Moderate anemia or poor perfusion', shockTypes: ['hypovolemic'], isNormal: false },
      { value: 'severe_pallor', label: 'Severe pallor (white)', interpretation: 'Severe anemia or hemorrhagic shock', shockTypes: ['hypovolemic'], isNormal: false }
    ],
    clinicalTip: 'Pallor + tachycardia + history of bleeding = hemorrhagic shock until proven otherwise'
  },
  {
    id: 'cyanosis',
    order: 3,
    parameter: 'Peripheral Cyanosis',
    question: 'Inspect nail beds, lips, and earlobes:',
    method: 'Visual inspection in good lighting',
    options: [
      { value: 'pink', label: 'Pink throughout', interpretation: 'Normal oxygenation and perfusion', shockTypes: [], isNormal: true },
      { value: 'peripheral', label: 'Blue nail beds only', interpretation: 'Poor peripheral perfusion', shockTypes: ['hypovolemic', 'cardiogenic'], isNormal: false },
      { value: 'central', label: 'Blue lips and tongue', interpretation: 'Hypoxemia - check SpO2, consider cardiac cause', shockTypes: ['cardiogenic', 'obstructive'], isNormal: false },
      { value: 'mottled', label: 'Mottled skin', interpretation: 'Severe shock with microcirculatory failure', shockTypes: ['septic', 'cardiogenic'], isNormal: false }
    ],
    clinicalTip: 'Central cyanosis not improving with oxygen = cardiac shunt or severe lung disease'
  },
  {
    id: 'crt',
    order: 4,
    parameter: 'Capillary Refill Time',
    question: 'Press sternum for 5 seconds, release, count seconds to pink:',
    method: 'Press and count',
    options: [
      { value: 'normal', label: '< 2 seconds', interpretation: 'Normal', shockTypes: [], isNormal: true },
      { value: 'mild', label: '2-3 seconds', interpretation: 'Mild-moderate perfusion deficit', shockTypes: ['hypovolemic', 'septic', 'cardiogenic'], isNormal: false },
      { value: 'moderate', label: '3-5 seconds', interpretation: 'Moderate-severe shock', shockTypes: ['hypovolemic', 'septic', 'cardiogenic'], isNormal: false },
      { value: 'severe', label: '> 5 seconds', interpretation: 'Severe shock - IMMEDIATE intervention needed', shockTypes: ['hypovolemic', 'septic', 'cardiogenic', 'obstructive'], isNormal: false },
      { value: 'flash', label: 'Flash refill (< 1 second)', interpretation: 'Vasodilation - warm shock', shockTypes: ['septic', 'anaphylactic'], isNormal: false }
    ],
    clinicalTip: 'Test on sternum in cold environments as extremities may be falsely prolonged'
  },
  {
    id: 'temperature',
    order: 5,
    parameter: 'Temperature Gradient',
    question: 'Run back of hand from foot up leg. Note where temperature changes from cool to warm:',
    method: 'Tactile assessment',
    options: [
      { value: 'warm', label: 'Warm throughout', interpretation: 'Normal or warm shock', shockTypes: ['septic', 'anaphylactic'], isNormal: false },
      { value: 'ankle', label: 'Cool to ankle', interpretation: 'Mild peripheral shutdown', shockTypes: ['hypovolemic', 'cardiogenic'], isNormal: false },
      { value: 'calf', label: 'Cool to mid-calf', interpretation: 'Moderate shock', shockTypes: ['hypovolemic', 'septic', 'cardiogenic'], isNormal: false },
      { value: 'knee', label: 'Cool to knee', interpretation: 'Severe shock', shockTypes: ['hypovolemic', 'septic', 'cardiogenic'], isNormal: false },
      { value: 'thigh', label: 'Cool to mid-thigh or higher', interpretation: 'Profound shock - CRITICAL', shockTypes: ['hypovolemic', 'septic', 'cardiogenic', 'obstructive'], isNormal: false }
    ],
    clinicalTip: 'Document the level (e.g., "cool to knee") for trending response to treatment'
  },
  {
    id: 'bp',
    order: 6,
    parameter: 'Blood Pressure',
    question: 'Measure BP with appropriate cuff size (width 40% of arm circumference):',
    method: 'Sphygmomanometer',
    options: [
      { value: 'normal', label: 'Normal for age', interpretation: 'May still be in compensated shock', shockTypes: [], isNormal: true },
      { value: 'low', label: 'Systolic < 70 + (2 × age)', interpretation: 'Hypotensive shock - decompensated', shockTypes: ['hypovolemic', 'septic', 'cardiogenic', 'obstructive'], isNormal: false },
      { value: 'wide_pp', label: 'Wide pulse pressure', interpretation: 'Early septic shock or aortic regurgitation', shockTypes: ['septic'], isNormal: false },
      { value: 'narrow_pp', label: 'Narrow pulse pressure', interpretation: 'Cardiogenic or late septic shock', shockTypes: ['cardiogenic', 'septic'], isNormal: false }
    ],
    clinicalTip: 'Hypotension is a LATE sign in children - treat shock before BP drops'
  },
  {
    id: 'heart_sounds',
    order: 7,
    parameter: 'Heart Sounds',
    question: 'Auscultate at apex, left sternal border, and base:',
    method: 'Stethoscope',
    options: [
      { value: 'normal', label: 'S1 S2 clear, no murmurs', interpretation: 'Normal', shockTypes: [], isNormal: true },
      { value: 'gallop', label: 'Gallop rhythm (S3)', interpretation: 'Volume overload or heart failure', shockTypes: ['cardiogenic'], isNormal: false },
      { value: 'murmur', label: 'New murmur', interpretation: 'Valve dysfunction, VSD, endocarditis', shockTypes: ['cardiogenic', 'septic'], isNormal: false },
      { value: 'muffled', label: 'Muffled heart sounds', interpretation: 'Pericardial effusion/tamponade', shockTypes: ['obstructive'], isNormal: false },
      { value: 'rub', label: 'Pericardial rub', interpretation: 'Pericarditis', shockTypes: ['obstructive'], isNormal: false }
    ],
    clinicalTip: 'Known heart disease + shock = cardiogenic until proven otherwise'
  },
  {
    id: 'ecg',
    order: 8,
    parameter: 'ECG Rhythm',
    question: 'Attach 3 or 5 lead ECG and assess:',
    method: 'Cardiac monitor',
    options: [
      { value: 'sinus_tachy', label: 'Sinus tachycardia', interpretation: 'Compensatory - treat underlying cause', shockTypes: ['hypovolemic', 'septic', 'anaphylactic'], isNormal: false },
      { value: 'svt', label: 'SVT (rate >220 infant, >180 child)', interpretation: 'May be cause of cardiogenic shock', shockTypes: ['cardiogenic'], isNormal: false },
      { value: 'wide_complex', label: 'Wide complex tachycardia', interpretation: 'VT until proven otherwise', shockTypes: ['cardiogenic'], isNormal: false },
      { value: 'bradycardia', label: 'Bradycardia with hypotension', interpretation: 'Pre-arrest - prepare for CPR', shockTypes: ['cardiogenic', 'obstructive'], isNormal: false },
      { value: 'peaked_t', label: 'Peaked T waves, wide QRS', interpretation: 'Hyperkalemia - give calcium NOW', shockTypes: ['undifferentiated'], isNormal: false },
      { value: 'normal', label: 'Normal sinus rhythm', interpretation: 'Normal', shockTypes: [], isNormal: true }
    ],
    clinicalTip: 'Arrhythmia in shock may be due to electrolyte disturbance - check K+, Ca2+, Mg2+'
  },
  {
    id: 'jvd',
    order: 9,
    parameter: 'Jugular Venous Distension',
    question: 'Position at 45°, look for pulsation above clavicle:',
    method: 'Visual inspection',
    options: [
      { value: 'flat', label: 'Flat JVP even when supine', interpretation: 'Hypovolemia', shockTypes: ['hypovolemic'], isNormal: false },
      { value: 'normal', label: 'Not visible above clavicle at 45°', interpretation: 'Normal', shockTypes: [], isNormal: true },
      { value: 'elevated', label: 'JVD present', interpretation: 'Elevated right heart pressure', shockTypes: ['cardiogenic', 'obstructive'], isNormal: false }
    ],
    clinicalTip: 'JVD + hypotension + muffled heart sounds = Beck\'s triad (tamponade)'
  },
  {
    id: 'hepatomegaly',
    order: 10,
    parameter: 'Hepatomegaly',
    question: 'Palpate from right iliac fossa upward:',
    method: 'Palpation',
    options: [
      { value: 'normal', label: 'Liver at or just below costal margin', interpretation: 'Normal', shockTypes: [], isNormal: true },
      { value: 'enlarged', label: 'Liver > 2 cm below costal margin', interpretation: 'Right heart failure or fluid overload', shockTypes: ['cardiogenic'], isNormal: false },
      { value: 'tender', label: 'Tender hepatomegaly', interpretation: 'Acute congestion', shockTypes: ['cardiogenic'], isNormal: false }
    ],
    clinicalTip: 'Mark liver edge with pen before fluids - recheck after each bolus'
  },
  {
    id: 'edema',
    order: 11,
    parameter: 'Peripheral Edema',
    question: 'Check for periorbital edema and press over tibia for 5 seconds:',
    method: 'Inspection and palpation',
    options: [
      { value: 'none', label: 'No edema', interpretation: 'Normal', shockTypes: [], isNormal: true },
      { value: 'periorbital', label: 'Periorbital edema', interpretation: 'Fluid overload or nephrotic', shockTypes: ['cardiogenic'], isNormal: false },
      { value: 'pedal', label: 'Pedal pitting edema', interpretation: 'Fluid overload', shockTypes: ['cardiogenic'], isNormal: false },
      { value: 'both', label: 'Both periorbital and pedal', interpretation: 'Significant fluid overload - cautious with boluses', shockTypes: ['cardiogenic'], isNormal: false }
    ],
    clinicalTip: 'If edema present before fluids, be very cautious with boluses'
  },
  {
    id: 'urine',
    order: 12,
    parameter: 'Urine Output',
    question: 'Ask mother: How many wet diapers/urinations in last 6-12 hours?',
    method: 'History',
    options: [
      { value: 'normal', label: '6+ wet diapers or normal frequency', interpretation: 'Adequate renal perfusion', shockTypes: [], isNormal: true },
      { value: 'decreased', label: '< 4 wet diapers or decreased frequency', interpretation: 'Oliguria - poor renal perfusion', shockTypes: ['hypovolemic', 'septic', 'cardiogenic'], isNormal: false },
      { value: 'polyuria', label: 'Increased urination with dehydration', interpretation: 'Consider DKA', shockTypes: ['hypovolemic'], isNormal: false },
      { value: 'none', label: 'No urine for > 6 hours', interpretation: 'Severe shock or AKI', shockTypes: ['hypovolemic', 'septic', 'cardiogenic'], isNormal: false }
    ],
    clinicalTip: 'Insert urinary catheter early in severe shock to monitor output hourly'
  }
];

// History questions for shock differentiation
const historyQuestions = [
  { id: 'diarrhea', question: 'Has the child had diarrhea and/or vomiting?', shockType: 'hypovolemic' as ShockType, evidence: 'GI losses suggest hypovolemic shock' },
  { id: 'polyuria', question: 'Has the child been urinating more than usual (polyuria)?', shockType: 'hypovolemic' as ShockType, evidence: 'Polyuria with dehydration suggests DKA' },
  { id: 'bleeding', question: 'Has there been any bleeding?', shockType: 'hypovolemic' as ShockType, evidence: 'Hemorrhage - prepare blood products' },
  { id: 'heart_disease', question: 'Does the child have known heart disease?', shockType: 'cardiogenic' as ShockType, evidence: 'Known cardiac condition - cautious fluids' },
  { id: 'fever', question: 'Has the child had fever at home?', shockType: 'septic' as ShockType, evidence: 'Fever suggests infection - give antibiotics within 1 hour' },
  { id: 'allergy', question: 'Any new food, insect sting, or hives?', shockType: 'anaphylactic' as ShockType, evidence: 'Allergic trigger - give epinephrine IM immediately' },
  { id: 'sudden', question: 'Was the onset sudden?', shockType: 'obstructive' as ShockType, evidence: 'Sudden onset suggests PE, arrhythmia, or tamponade' },
  { id: 'trauma', question: 'Any recent trauma or surgery?', shockType: 'obstructive' as ShockType, evidence: 'Consider hemorrhage, pneumothorax, or tamponade' }
];

export function ShockAssessment({ weightKg, onShockTypeIdentified, onAccessTimerStart, onReferralRequested }: Props) {
  const [steps, setSteps] = useState<AssessmentStep[]>(
    assessmentSteps.map(s => ({ ...s, completed: false }))
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [historyAnswers, setHistoryAnswers] = useState<Record<string, boolean>>({});
  const [showHistory, setShowHistory] = useState(true);
  const [shockScores, setShockScores] = useState<ShockScore[]>([]);
  const [identifiedShockType, setIdentifiedShockType] = useState<ShockType | null>(null);
  const [assessmentComplete, setAssessmentComplete] = useState(false);

  // Calculate shock scores based on findings
  const calculateShockScores = useCallback(() => {
    const scores: Record<ShockType, { score: number; evidence: string[] }> = {
      hypovolemic: { score: 0, evidence: [] },
      cardiogenic: { score: 0, evidence: [] },
      septic: { score: 0, evidence: [] },
      anaphylactic: { score: 0, evidence: [] },
      obstructive: { score: 0, evidence: [] },
      undifferentiated: { score: 0, evidence: [] }
    };

    // Score from physical assessment
    steps.forEach(step => {
      if (step.completed && step.selectedValue) {
        const selectedOption = step.options.find(o => o.value === step.selectedValue);
        if (selectedOption && !selectedOption.isNormal) {
          selectedOption.shockTypes.forEach(type => {
            scores[type].score += 2;
            scores[type].evidence.push(`${step.parameter}: ${selectedOption.label}`);
          });
        }
      }
    });

    // Score from history
    Object.entries(historyAnswers).forEach(([id, answer]) => {
      if (answer) {
        const question = historyQuestions.find(q => q.id === id);
        if (question) {
          scores[question.shockType].score += 3;
          scores[question.shockType].evidence.push(question.evidence);
        }
      }
    });

    return Object.entries(scores)
      .map(([type, data]) => ({ type: type as ShockType, ...data }))
      .sort((a, b) => b.score - a.score);
  }, [steps, historyAnswers]);

  // Update scores when findings change
  useEffect(() => {
    const newScores = calculateShockScores();
    setShockScores(newScores);
  }, [calculateShockScores]);

  const handleOptionSelect = (stepId: string, value: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, selectedValue: value, completed: true }
        : step
    ));

    // Check for critical findings that need immediate action
    const step = steps.find(s => s.id === stepId);
    const option = step?.options.find(o => o.value === value);
    
    if (option && !option.isNormal) {
      // Play alert for critical findings
      if (option.interpretation.includes('CRITICAL') || option.interpretation.includes('IMMEDIATE')) {
        triggerAlert('critical_action');
        triggerHaptic('urgent');
      }
    }

    // Auto-advance to next step
    if (currentStepIndex < steps.length - 1) {
      setTimeout(() => setCurrentStepIndex(prev => prev + 1), 500);
    }
  };

  const handleHistoryAnswer = (id: string, answer: boolean) => {
    setHistoryAnswers(prev => ({ ...prev, [id]: answer }));
    
    // Check for anaphylaxis - needs immediate action
    if (id === 'allergy' && answer) {
      triggerAlert('critical_action');
      triggerHaptic('urgent');
    }
  };

  const completeAssessment = () => {
    const topScore = shockScores[0];
    if (topScore && topScore.score > 0) {
      setIdentifiedShockType(topScore.type);
      onShockTypeIdentified(topScore.type, shockScores);
    } else {
      setIdentifiedShockType('undifferentiated');
      onShockTypeIdentified('undifferentiated', shockScores);
    }
    setAssessmentComplete(true);
    onAccessTimerStart();
  };

  const currentStep = steps[currentStepIndex];
  const completedSteps = steps.filter(s => s.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  // Get color for shock type
  const getShockTypeColor = (type: ShockType) => {
    const colors: Record<ShockType, string> = {
      hypovolemic: 'bg-blue-500',
      cardiogenic: 'bg-purple-500',
      septic: 'bg-red-500',
      anaphylactic: 'bg-orange-500',
      obstructive: 'bg-yellow-500',
      undifferentiated: 'bg-gray-500'
    };
    return colors[type];
  };

  if (assessmentComplete && identifiedShockType) {
    return (
      <Card className="border-2 border-green-500">
        <CardHeader className="bg-green-500/10">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Shock Type Identified
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="text-center">
            <Badge className={`${getShockTypeColor(identifiedShockType)} text-white text-xl px-4 py-2`}>
              {identifiedShockType.charAt(0).toUpperCase() + identifiedShockType.slice(1)} Shock
            </Badge>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">Evidence:</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              {shockScores[0]?.evidence.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {shockScores.slice(0, 4).map(score => (
              <div key={score.type} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm capitalize">{score.type}</span>
                <Badge variant="outline">{score.score}</Badge>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => onAccessTimerStart()}
            >
              <Syringe className="h-4 w-4 mr-2" />
              Proceed to IV/IO Access
            </Button>
            <Button 
              variant="outline"
              onClick={() => onReferralRequested(`${identifiedShockType} shock identified`)}
            >
              <Phone className="h-4 w-4 mr-2" />
              Initiate Referral
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Shock Assessment Progress</span>
          <span>{completedSteps}/{steps.length} steps</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Live shock type scores */}
      {shockScores.some(s => s.score > 0) && (
        <Card className="bg-muted/50">
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-2">
              {shockScores.filter(s => s.score > 0).slice(0, 3).map(score => (
                <Badge 
                  key={score.type} 
                  className={`${getShockTypeColor(score.type)} text-white`}
                >
                  {score.type}: {score.score}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History questions (shown first) */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Quick History (helps differentiate shock type)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {historyQuestions.map(q => (
              <div key={q.id} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm flex-1">{q.question}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={historyAnswers[q.id] === true ? 'default' : 'outline'}
                    onClick={() => handleHistoryAnswer(q.id, true)}
                  >
                    Yes
                  </Button>
                  <Button
                    size="sm"
                    variant={historyAnswers[q.id] === false ? 'default' : 'outline'}
                    onClick={() => handleHistoryAnswer(q.id, false)}
                  >
                    No
                  </Button>
                </div>
              </div>
            ))}
            <Button 
              className="w-full mt-4"
              onClick={() => setShowHistory(false)}
            >
              Continue to Physical Assessment
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Physical assessment steps */}
      {!showHistory && currentStep && (
        <Card className="border-2 border-primary">
          <CardHeader className="bg-primary/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Step {currentStep.order}: {currentStep.parameter}
              </CardTitle>
              <Badge variant="outline">
                {currentStepIndex + 1} of {steps.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <p className="font-medium">{currentStep.question}</p>
            <p className="text-sm text-muted-foreground">
              <strong>Method:</strong> {currentStep.method}
            </p>

            <div className="space-y-2">
              {currentStep.options.map(option => (
                <Button
                  key={option.value}
                  variant={currentStep.selectedValue === option.value ? 'default' : 'outline'}
                  className={`w-full justify-start text-left h-auto py-3 ${
                    currentStep.selectedValue === option.value 
                      ? option.isNormal ? 'bg-green-600' : 'bg-red-600'
                      : ''
                  }`}
                  onClick={() => handleOptionSelect(currentStep.id, option.value)}
                >
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs opacity-80">{option.interpretation}</div>
                  </div>
                </Button>
              ))}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
              <p className="text-sm">
                <strong>💡 Clinical Tip:</strong> {currentStep.clinicalTip}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                disabled={currentStepIndex === 0}
                onClick={() => setCurrentStepIndex(prev => prev - 1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              {currentStepIndex < steps.length - 1 ? (
                <Button
                  className="flex-1"
                  disabled={!currentStep.completed}
                  onClick={() => setCurrentStepIndex(prev => prev + 1)}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={completeAssessment}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Assessment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral button always visible */}
      <Button
        variant="outline"
        className="w-full border-orange-500 text-orange-500 hover:bg-orange-500/10"
        onClick={() => onReferralRequested('Provider requested referral during shock assessment')}
      >
        <Phone className="h-4 w-4 mr-2" />
        Initiate Referral (I'm stuck)
      </Button>
    </div>
  );
}

export default ShockAssessment;
