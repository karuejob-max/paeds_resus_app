/**
 * NRP Assessment Flow
 * 
 * GPS-like guidance through neonatal resuscitation following AHA 2025 NRP Algorithm.
 * Single question at a time with immediate intervention triggers.
 * 
 * Flow:
 * 1. Pre-birth preparation
 * 2. Initial assessment (term? tone? breathing?)
 * 3. Initial steps (warm, dry, stimulate, position)
 * 4. Reassessment (apnea? HR <100?)
 * 5. PPV if needed
 * 6. Chest compressions if HR <60
 * 7. Epinephrine if HR remains <60
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Baby,
  Heart,
  Wind,
  Thermometer,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  RotateCcw,
  Syringe,
  Activity,
  Home,
} from 'lucide-react';
import {
  calculateNRPDrugDose,
  estimateNeonatalWeight,
  getETTSize,
  getTargetSpO2,
} from '../../../shared/nrpDrugCompendium';

// NRP Assessment Steps
type NRPStep =
  | 'patient-setup'
  | 'initial-assessment'
  | 'routine-care'
  | 'initial-steps'
  | 'breathing-check'
  | 'labored-breathing'
  | 'ppv'
  | 'ppv-reassess'
  | 'mr-sopa'
  | 'chest-compressions'
  | 'epinephrine'
  | 'post-resus'
  | 'complete';

interface NRPState {
  step: NRPStep;
  gestationalWeeks: number;
  estimatedWeight: number;
  actualWeight?: number;
  birthTime?: Date;
  elapsedSeconds: number;
  isTimerRunning: boolean;
  heartRate?: number;
  isTerm: boolean;
  hasTone: boolean;
  isBreathing: boolean;
  apgarScores: { time: number; score: number }[];
  interventions: { time: number; action: string }[];
  epinephrineDoses: number;
  ppvStarted: boolean;
  compressionsStarted: boolean;
}

export function NRPAssessment() {
  const [, setLocation] = useLocation();

  // Swipe gestures: right = home, left = browser back
  useSwipeGesture({
    onSwipeRight: () => {
      setLocation('/clinical-assessment');
    },
    onSwipeLeft: () => {
      window.history.back();
    },
    minSwipeDistance: 80,
  });
  const [state, setState] = useState<NRPState>({
    step: 'patient-setup',
    gestationalWeeks: 40,
    estimatedWeight: 3.5,
    elapsedSeconds: 0,
    isTimerRunning: false,
    isTerm: true,
    hasTone: true,
    isBreathing: true,
    apgarScores: [],
    interventions: [],
    epinephrineDoses: 0,
    ppvStarted: false,
    compressionsStarted: false,
  });

  // Timer effect
  useEffect(() => {
    if (!state.isTimerRunning) return;

    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isTimerRunning]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const logIntervention = useCallback((action: string) => {
    setState((prev) => ({
      ...prev,
      interventions: [...prev.interventions, { time: prev.elapsedSeconds, action }],
    }));
  }, []);

  const startTimer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isTimerRunning: true,
      birthTime: new Date(),
    }));
    logIntervention('Birth - Timer started');
  }, [logIntervention]);

  const goToStep = useCallback((step: NRPStep) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  // Get current SpO2 target
  const currentSpO2Target = getTargetSpO2(Math.floor(state.elapsedSeconds / 60));

  // Get ETT size for current weight
  const weight = state.actualWeight || state.estimatedWeight;
  const ettInfo = getETTSize(weight);

  // Calculate epinephrine dose
  const epiDose = calculateNRPDrugDose('NRP-EPI-IV-v1.0', weight);

  // Render current step
  const renderStep = () => {
    switch (state.step) {
      case 'patient-setup':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Baby className="w-8 h-8 text-pink-500" />
              <div>
                <h2 className="text-2xl font-bold">Neonatal Resuscitation</h2>
                <p className="text-gray-500">Enter patient information to begin</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gestational Age (weeks)</Label>
                <Input
                  type="number"
                  min={22}
                  max={44}
                  placeholder="e.g., 40"
                  value={state.gestationalWeeks === 40 ? '' : state.gestationalWeeks}
                  onChange={(e) => {
                    const ga = parseInt(e.target.value) || 40;
                    setState((prev) => ({
                      ...prev,
                      gestationalWeeks: ga,
                      estimatedWeight: estimateNeonatalWeight(ga),
                      isTerm: ga >= 37,
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Estimated Weight (kg)</Label>
                <Input
                  type="number"
                  step={0.1}
                  min={0.3}
                  max={6}
                  value={state.estimatedWeight}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      estimatedWeight: parseFloat(e.target.value) || 3.0,
                    }))
                  }
                />
                <p className="text-xs text-gray-500">
                  Auto-calculated from GA. Adjust if known.
                </p>
              </div>
            </div>

            {/* Quick Reference */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-blue-800">Quick Reference</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>ETT Size: {ettInfo.size} mm</div>
                <div>ETT Depth: {ettInfo.depth} cm</div>
                <div>Epi IV: {epiDose?.displayVolume}</div>
                <div>NS Bolus: {(weight * 10).toFixed(0)} mL</div>
              </div>
            </div>

            <Button
              onClick={() => {
                startTimer();
                goToStep('initial-assessment');
              }}
              className="w-full bg-pink-600 hover:bg-pink-700"
              size="lg"
            >
              <Clock className="w-5 h-5 mr-2" />
              Start Resuscitation (Birth)
            </Button>
          </Card>
        );

      case 'initial-assessment':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-yellow-500" />
              <div>
                <h2 className="text-2xl font-bold">Initial Assessment</h2>
                <p className="text-gray-500">Assess within first 30 seconds</p>
              </div>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-300 p-4 rounded-lg">
              <h3 className="font-bold text-yellow-800 mb-3">
                Answer ALL THREE questions:
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">1. Term gestation? (≥37 weeks)</span>
                  <div className="flex gap-2">
                    <Button
                      variant={state.isTerm ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setState((prev) => ({ ...prev, isTerm: true }))}
                    >
                      Yes
                    </Button>
                    <Button
                      variant={!state.isTerm ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => setState((prev) => ({ ...prev, isTerm: false }))}
                    >
                      No
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">2. Good muscle tone?</span>
                  <div className="flex gap-2">
                    <Button
                      variant={state.hasTone ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setState((prev) => ({ ...prev, hasTone: true }))}
                    >
                      Yes
                    </Button>
                    <Button
                      variant={!state.hasTone ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => setState((prev) => ({ ...prev, hasTone: false }))}
                    >
                      No
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">3. Breathing or crying?</span>
                  <div className="flex gap-2">
                    <Button
                      variant={state.isBreathing ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setState((prev) => ({ ...prev, isBreathing: true }))}
                    >
                      Yes
                    </Button>
                    <Button
                      variant={!state.isBreathing ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => setState((prev) => ({ ...prev, isBreathing: false }))}
                    >
                      No
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                logIntervention(
                  `Initial assessment: Term=${state.isTerm}, Tone=${state.hasTone}, Breathing=${state.isBreathing}`
                );
                if (state.isTerm && state.hasTone && state.isBreathing) {
                  goToStep('routine-care');
                } else {
                  goToStep('initial-steps');
                }
              }}
              className="w-full"
              size="lg"
            >
              Continue <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Card>
        );

      case 'routine-care':
        return (
          <Card className="p-6 space-y-6 border-2 border-green-500">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <h2 className="text-2xl font-bold text-green-700">Routine Care</h2>
                <p className="text-gray-500">Vigorous term infant - no resuscitation needed</p>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-green-800">Continue with:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Skin-to-skin with parent
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Maintain normal temperature
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Clear secretions if needed
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Ongoing evaluation
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  logIntervention('Condition changed - restarting assessment');
                  goToStep('initial-assessment');
                }}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Condition Changed
              </Button>
              <Button
                onClick={() => {
                  logIntervention('Routine care completed');
                  goToStep('complete');
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Complete
              </Button>
            </div>
          </Card>
        );

      case 'initial-steps':
        return (
          <Card className="p-6 space-y-6 border-2 border-orange-500">
            <div className="flex items-center gap-3">
              <Thermometer className="w-8 h-8 text-orange-500" />
              <div>
                <h2 className="text-2xl font-bold">Initial Steps</h2>
                <p className="text-gray-500">Complete within 30 seconds</p>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-orange-800">DO NOW:</h3>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                    1
                  </span>
                  <div>
                    <span className="font-medium">WARM</span> - Place under radiant warmer
                    {!state.isTerm && (
                      <span className="text-red-600 block text-sm">
                        ⚠️ Preterm: Use plastic wrap/bag
                      </span>
                    )}
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                    2
                  </span>
                  <span className="font-medium">DRY</span> - Dry thoroughly (except preterm in wrap)
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                    3
                  </span>
                  <span className="font-medium">POSITION</span> - Sniffing position, head neutral
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                    4
                  </span>
                  <span className="font-medium">STIMULATE</span> - Rub back, flick soles
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                    5
                  </span>
                  <span className="font-medium">SUCTION</span> - Only if secretions blocking airway
                </li>
              </ol>
            </div>

            <Button
              onClick={() => {
                logIntervention('Initial steps completed (warm, dry, position, stimulate)');
                goToStep('breathing-check');
              }}
              className="w-full bg-orange-600 hover:bg-orange-700"
              size="lg"
            >
              Steps Complete - Reassess <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Card>
        );

      case 'breathing-check':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Wind className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-2xl font-bold">Breathing Assessment</h2>
                <p className="text-gray-500">Assess breathing and heart rate</p>
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-3">Is the baby:</h3>
              <p className="text-lg font-medium">Apnea or gasping? OR Heart rate &lt;100/min?</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => {
                  logIntervention('Breathing adequate, HR ≥100');
                  goToStep('labored-breathing');
                }}
                className="h-20 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <div className="text-center">
                  <CheckCircle className="w-6 h-6 mx-auto mb-1" />
                  <span>NO</span>
                  <span className="block text-xs">Breathing OK, HR ≥100</span>
                </div>
              </Button>
              <Button
                onClick={() => {
                  logIntervention('Apnea/gasping or HR <100 - Starting PPV');
                  goToStep('ppv');
                }}
                className="h-20 bg-red-600 hover:bg-red-700"
                size="lg"
              >
                <div className="text-center">
                  <AlertTriangle className="w-6 h-6 mx-auto mb-1" />
                  <span>YES</span>
                  <span className="block text-xs">Apnea/gasping or HR &lt;100</span>
                </div>
              </Button>
            </div>
          </Card>
        );

      case 'labored-breathing':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Wind className="w-8 h-8 text-yellow-500" />
              <div>
                <h2 className="text-2xl font-bold">Respiratory Status</h2>
                <p className="text-gray-500">Check for labored breathing or cyanosis</p>
              </div>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-300 p-4 rounded-lg">
              <h3 className="font-bold text-yellow-800 mb-3">
                Labored breathing or persistent cyanosis?
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => {
                  logIntervention('No respiratory distress - routine monitoring');
                  goToStep('routine-care');
                }}
                className="h-20 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <div className="text-center">
                  <CheckCircle className="w-6 h-6 mx-auto mb-1" />
                  <span>NO</span>
                  <span className="block text-xs">Breathing comfortably</span>
                </div>
              </Button>
              <Button
                onClick={() => {
                  logIntervention('Labored breathing/cyanosis - Starting CPAP/O2');
                  goToStep('post-resus');
                }}
                className="h-20 bg-yellow-600 hover:bg-yellow-700"
                size="lg"
              >
                <div className="text-center">
                  <AlertTriangle className="w-6 h-6 mx-auto mb-1" />
                  <span>YES</span>
                  <span className="block text-xs">Needs O2/CPAP</span>
                </div>
              </Button>
            </div>
          </Card>
        );

      case 'ppv':
        return (
          <Card className="p-6 space-y-6 border-2 border-red-500">
            <div className="flex items-center gap-3">
              <Wind className="w-8 h-8 text-red-500" />
              <div>
                <h2 className="text-2xl font-bold text-red-700">START PPV NOW</h2>
                <p className="text-gray-500">Positive Pressure Ventilation</p>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-red-800">PPV Settings:</h3>
              <ul className="space-y-2">
                <li>
                  <strong>Rate:</strong> 40-60 breaths/min
                </li>
                <li>
                  <strong>Initial FiO2:</strong> {state.isTerm ? '21%' : '21-30%'} (room air for term)
                </li>
                <li>
                  <strong>PIP:</strong> 20-25 cmH2O (start low)
                </li>
                <li>
                  <strong>PEEP:</strong> 5 cmH2O
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Target SpO2 at {Math.floor(state.elapsedSeconds / 60)} min:</h3>
              <p className="text-2xl font-bold text-blue-600">
                {currentSpO2Target.min}-{currentSpO2Target.max}%
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="font-semibold text-yellow-800">
                ⚠️ Apply pulse oximeter to RIGHT hand (preductal)
              </p>
              <p className="text-sm text-yellow-700">Consider cardiac monitor</p>
            </div>

            <Button
              onClick={() => {
                setState((prev) => ({ ...prev, ppvStarted: true }));
                logIntervention('PPV started - reassessing after 30 seconds');
                goToStep('ppv-reassess');
              }}
              className="w-full bg-red-600 hover:bg-red-700"
              size="lg"
            >
              PPV Started - Reassess in 30 seconds
            </Button>
          </Card>
        );

      case 'ppv-reassess':
        return (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500" />
              <div>
                <h2 className="text-2xl font-bold">PPV Reassessment</h2>
                <p className="text-gray-500">After 30 seconds of effective PPV</p>
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-3">Check heart rate:</h3>
              <p className="text-lg">What is the heart rate now?</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={() => {
                  logIntervention('HR ≥100 after PPV - improving');
                  goToStep('post-resus');
                }}
                className="h-16 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6" />
                  <span>HR ≥100/min - Improving</span>
                </div>
              </Button>
              <Button
                onClick={() => {
                  logIntervention('HR 60-99 - Continue PPV, check technique');
                  goToStep('mr-sopa');
                }}
                className="h-16 bg-yellow-600 hover:bg-yellow-700"
                size="lg"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6" />
                  <span>HR 60-99/min - Check ventilation</span>
                </div>
              </Button>
              <Button
                onClick={() => {
                  logIntervention('HR <60 despite PPV - Starting chest compressions');
                  goToStep('chest-compressions');
                }}
                className="h-16 bg-red-600 hover:bg-red-700"
                size="lg"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6" />
                  <span>HR &lt;60/min - Start Compressions</span>
                </div>
              </Button>
            </div>
          </Card>
        );

      case 'mr-sopa':
        return (
          <Card className="p-6 space-y-6 border-2 border-yellow-500">
            <div className="flex items-center gap-3">
              <Wind className="w-8 h-8 text-yellow-500" />
              <div>
                <h2 className="text-2xl font-bold">MR SOPA</h2>
                <p className="text-gray-500">Ventilation Corrective Steps</p>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-yellow-800">Check each step:</h3>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    M
                  </span>
                  <div>
                    <span className="font-bold">Mask adjustment</span>
                    <p className="text-sm text-gray-600">Ensure good seal, no leaks</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    R
                  </span>
                  <div>
                    <span className="font-bold">Reposition airway</span>
                    <p className="text-sm text-gray-600">Sniffing position, slight extension</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    S
                  </span>
                  <div>
                    <span className="font-bold">Suction mouth then nose</span>
                    <p className="text-sm text-gray-600">Clear secretions</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    O
                  </span>
                  <div>
                    <span className="font-bold">Open mouth</span>
                    <p className="text-sm text-gray-600">Open mouth slightly during ventilation</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    P
                  </span>
                  <div>
                    <span className="font-bold">Pressure increase</span>
                    <p className="text-sm text-gray-600">Increase PIP if chest not rising</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    A
                  </span>
                  <div>
                    <span className="font-bold">Alternative airway</span>
                    <p className="text-sm text-gray-600">
                      Consider LMA or ETT (Size {ettInfo.size} mm, depth {ettInfo.depth} cm)
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            <Button
              onClick={() => {
                logIntervention('MR SOPA completed - reassessing');
                goToStep('ppv-reassess');
              }}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
              size="lg"
            >
              MR SOPA Complete - Reassess HR
            </Button>
          </Card>
        );

      case 'chest-compressions':
        return (
          <Card className="p-6 space-y-6 border-2 border-red-600">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-600 animate-pulse" />
              <div>
                <h2 className="text-2xl font-bold text-red-700">CHEST COMPRESSIONS</h2>
                <p className="text-gray-500">HR &lt;60 despite effective PPV</p>
              </div>
            </div>

            <div className="bg-red-100 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-red-800">Compression Technique:</h3>
              <ul className="space-y-2">
                <li>
                  <strong>Method:</strong> Two-thumb encircling technique preferred
                </li>
                <li>
                  <strong>Location:</strong> Lower third of sternum
                </li>
                <li>
                  <strong>Depth:</strong> 1/3 AP diameter of chest
                </li>
                <li>
                  <strong>Ratio:</strong> 3 compressions : 1 breath
                </li>
                <li>
                  <strong>Rate:</strong> 120 events/min (90 compressions + 30 breaths)
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="font-semibold text-yellow-800">
                ⚠️ Increase FiO2 to 100% during compressions
              </p>
              <p className="text-sm text-yellow-700">Consider intubation if not already done</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => {
                  logIntervention('HR improved to ≥60 - stopping compressions');
                  goToStep('ppv-reassess');
                }}
                className="h-16 bg-green-600 hover:bg-green-700"
              >
                <div className="text-center">
                  <span className="block">HR ≥60</span>
                  <span className="text-xs">Stop compressions</span>
                </div>
              </Button>
              <Button
                onClick={() => {
                  setState((prev) => ({ ...prev, compressionsStarted: true }));
                  logIntervention('HR remains <60 after 60s compressions - giving epinephrine');
                  goToStep('epinephrine');
                }}
                className="h-16 bg-red-600 hover:bg-red-700"
              >
                <div className="text-center">
                  <span className="block">HR still &lt;60</span>
                  <span className="text-xs">After 60s → Epinephrine</span>
                </div>
              </Button>
            </div>
          </Card>
        );

      case 'epinephrine':
        return (
          <Card className="p-6 space-y-6 border-2 border-purple-600">
            <div className="flex items-center gap-3">
              <Syringe className="w-8 h-8 text-purple-600" />
              <div>
                <h2 className="text-2xl font-bold text-purple-700">EPINEPHRINE</h2>
                <p className="text-gray-500">
                  Dose #{state.epinephrineDoses + 1} - HR &lt;60 despite PPV + compressions
                </p>
              </div>
            </div>

            {epiDose && (
              <div className="bg-purple-100 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-purple-800">Epinephrine Dose:</h3>
                <div className="text-2xl font-bold text-purple-700">
                  {epiDose.displayVolume} IV/UVC
                </div>
                <p className="text-sm">({epiDose.displayDose} of 1:10,000)</p>
                <ul className="text-sm space-y-1 mt-3">
                  <li>• Give via UVC or IO (preferred)</li>
                  <li>• Flush with 0.5-1 mL NS</li>
                  <li>• May repeat every 3-5 minutes</li>
                </ul>
              </div>
            )}

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800">If HR remains &lt;60:</h3>
              <ul className="text-sm space-y-1">
                <li>• Consider hypovolemia → NS bolus {(weight * 10).toFixed(0)} mL</li>
                <li>• Consider pneumothorax → transilluminate/needle decompress</li>
                <li>• Ensure effective ventilation and compressions</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => {
                  setState((prev) => ({
                    ...prev,
                    epinephrineDoses: prev.epinephrineDoses + 1,
                  }));
                  logIntervention(`Epinephrine dose #${state.epinephrineDoses + 1} given - HR improved`);
                  goToStep('post-resus');
                }}
                className="h-16 bg-green-600 hover:bg-green-700"
              >
                <div className="text-center">
                  <span className="block">HR ≥60</span>
                  <span className="text-xs">Responding</span>
                </div>
              </Button>
              <Button
                onClick={() => {
                  setState((prev) => ({
                    ...prev,
                    epinephrineDoses: prev.epinephrineDoses + 1,
                  }));
                  logIntervention(`Epinephrine dose #${state.epinephrineDoses + 1} given - HR still <60`);
                }}
                className="h-16 bg-red-600 hover:bg-red-700"
              >
                <div className="text-center">
                  <span className="block">HR still &lt;60</span>
                  <span className="text-xs">Repeat in 3-5 min</span>
                </div>
              </Button>
            </div>
          </Card>
        );

      case 'post-resus':
        return (
          <Card className="p-6 space-y-6 border-2 border-blue-500">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-2xl font-bold">Post-Resuscitation Care</h2>
                <p className="text-gray-500">Stabilization and monitoring</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-blue-800">Continue monitoring:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  Continuous pulse oximetry
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  Cardiac monitoring
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  Temperature management (36.5-37.5°C)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  Blood glucose monitoring
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800">Consider:</h3>
              <ul className="text-sm space-y-1">
                <li>• Therapeutic hypothermia if HIE suspected (term infants)</li>
                <li>• Blood gas analysis</li>
                <li>• Chest X-ray if intubated</li>
                <li>• NICU admission</li>
              </ul>
            </div>

            <Button
              onClick={() => {
                logIntervention('Post-resuscitation care initiated');
                goToStep('complete');
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Complete Assessment
            </Button>
          </Card>
        );

      case 'complete':
        return (
          <Card className="p-6 space-y-6 border-2 border-green-500">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <h2 className="text-2xl font-bold text-green-700">Assessment Complete</h2>
                <p className="text-gray-500">Total time: {formatTime(state.elapsedSeconds)}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold">Summary:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>GA: {state.gestationalWeeks} weeks</div>
                <div>Weight: {weight} kg</div>
                <div>PPV: {state.ppvStarted ? 'Yes' : 'No'}</div>
                <div>Compressions: {state.compressionsStarted ? 'Yes' : 'No'}</div>
                <div>Epinephrine doses: {state.epinephrineDoses}</div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold">Intervention Log:</h3>
              <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
                {state.interventions.map((int, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-gray-500">{formatTime(int.time)}</span>
                    <span>{int.action}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setLocation('/clinical-assessment')}
                className="flex-1"
              >
                Back to Main Assessment
              </Button>
              <Button
                onClick={() => {
                  setState({
                    step: 'patient-setup',
                    gestationalWeeks: 40,
                    estimatedWeight: 3.5,
                    elapsedSeconds: 0,
                    isTimerRunning: false,
                    isTerm: true,
                    hasTone: true,
                    isBreathing: true,
                    apgarScores: [],
                    interventions: [],
                    epinephrineDoses: 0,
                    ppvStarted: false,
                    compressionsStarted: false,
                  });
                }}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Assessment
              </Button>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header with Timer */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Baby className="w-6 h-6" />
            <span className="font-bold">NRP Assessment</span>
          </div>
          <div className="flex items-center gap-2">
            {state.isTimerRunning && (
              <div className="bg-red-600 px-4 py-2 rounded-full font-mono text-xl font-bold animate-pulse">
                {formatTime(state.elapsedSeconds)}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/clinical-assessment')}
              className="text-white hover:bg-white/10"
            >
              <Home className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* SpO2 Target Banner */}
        {state.isTimerRunning && state.step !== 'patient-setup' && state.step !== 'complete' && (
          <div className="bg-blue-600 text-white p-3 rounded-lg flex items-center justify-between">
            <span>Target SpO2:</span>
            <span className="font-bold text-xl">
              {currentSpO2Target.min}-{currentSpO2Target.max}%
            </span>
            <span className="text-sm">at {Math.floor(state.elapsedSeconds / 60)} min</span>
          </div>
        )}

        {/* Main Content */}
        {renderStep()}
      </div>
    </div>
  );
}
