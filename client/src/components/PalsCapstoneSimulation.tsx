/**
 * PALS Capstone Simulation Component
 * 
 * High-fidelity simulation UI that guides learners through a complete
 * pediatric cardiac arrest scenario using ResusGPS tools.
 * 
 * Phases:
 * 1. Initial Assessment (ABCDE)
 * 2. Airway/Breathing Intervention
 * 3. Circulation Assessment & Shock Recognition
 * 4. Fluid Resuscitation
 * 5. Patient Deterioration → Cardiac Arrest
 * 6. CPR Execution (integrated with CPR Clock)
 * 7. ROSC Achievement
 * 8. Post-Resuscitation Care
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertTriangle,
  CheckCircle2,
  Heart,
  Wind,
  Droplets,
  Brain,
  Zap,
  Clock,
  TrendingDown,
  Activity,
  Award,
} from 'lucide-react';
import {
  initializePalsCapstoneSimulation,
  evaluateAbcdeAssessment,
  evaluateAirwayBreathingIntervention,
  evaluateShockAssessment,
  evaluateFluidResuscitation,
  simulateDeterioration,
  evaluateCprExecution,
  simulateRosc,
  evaluatePostResuscitationCare,
  calculateSimulationScore,
  type SimulationState,
  type SimulationPhase,
} from '@/lib/resus/pals-capstone-engine';
import { CPRClockUnified } from '@/components/CPRClockUnified';

interface PalsCapstoneSimulationProps {
  patientAge: number;
  patientWeight: number;
  onComplete: (score: number, simReady: boolean) => void;
  onClose: () => void;
}

export function PalsCapstoneSimulation({
  patientAge,
  patientWeight,
  onComplete,
  onClose,
}: PalsCapstoneSimulationProps) {
  const [state, setState] = useState<SimulationState>(() =>
    initializePalsCapstoneSimulation({
      patientAge,
      patientWeight,
      difficulty: 'standard',
    })
  );

  const [showCprClock, setShowCprClock] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'info'>('info');

  // Phase-specific UI state
  const [abcdeInput, setAbcdeInput] = useState({
    respiratoryRate: '',
    oxygenSaturation: '',
    capillaryRefillTime: '',
    pulseQuality: 'weak' as 'weak' | 'strong' | 'absent',
    consciousness: 'alert' as const,
  });

  const [fluidInput, setFluidInput] = useState({
    volume: '',
    type: 'normal_saline' as 'normal_saline' | 'lactated_ringer',
  });

  // ============================================================================
  // PHASE 1: Initial Assessment (ABCDE)
  // ============================================================================
  const handleAbcdeSubmit = useCallback(() => {
    const result = evaluateAbcdeAssessment(state, {
      respiratoryRate: parseInt(abcdeInput.respiratoryRate),
      oxygenSaturation: parseInt(abcdeInput.oxygenSaturation),
      capillaryRefillTime: parseInt(abcdeInput.capillaryRefillTime),
      pulseQuality: abcdeInput.pulseQuality,
      consciousness: abcdeInput.consciousness,
    });

    setState(result.newState);
    setFeedback(result.feedback);
    setFeedbackType(result.isCorrect ? 'success' : 'error');
  }, [state, abcdeInput]);

  // ============================================================================
  // PHASE 2: Airway/Breathing Intervention
  // ============================================================================
  const handleAirwayIntervention = useCallback(
    (intervention: 'high_flow_oxygen' | 'hfnc' | 'cpap' | 'intubation') => {
      const result = evaluateAirwayBreathingIntervention(state, intervention);
      setState(result.newState);
      setFeedback(result.feedback);
      setFeedbackType(result.isCorrect ? 'success' : 'error');
    },
    [state]
  );

  // ============================================================================
  // PHASE 3: Shock Assessment
  // ============================================================================
  const handleShockAssessment = useCallback(
    (shockType: 'hypovolemic' | 'distributive' | 'cardiogenic' | 'obstructive') => {
      const result = evaluateShockAssessment(state, shockType);
      setState(result.newState);
      setFeedback(result.feedback);
      setFeedbackType(result.isCorrect ? 'success' : 'error');
    },
    [state]
  );

  // ============================================================================
  // PHASE 4: Fluid Resuscitation
  // ============================================================================
  const handleFluidResuscitation = useCallback(() => {
    const result = evaluateFluidResuscitation(
      state,
      parseInt(fluidInput.volume),
      fluidInput.type
    );
    setState(result.newState);
    setFeedback(result.feedback);
    setFeedbackType(result.isCorrect ? 'success' : 'error');
  }, [state, fluidInput]);

  // ============================================================================
  // PHASE 5: Deterioration → Cardiac Arrest
  // ============================================================================
  const handleProgressToArrest = useCallback(() => {
    const newState = simulateDeterioration(state);
    setState(newState);
    setFeedback(newState.learnerActions[newState.learnerActions.length - 1].feedback);
    setFeedbackType('error');
  }, [state]);

  // ============================================================================
  // PHASE 6: CPR Execution (via CPR Clock)
  // ============================================================================
  const handleCprComplete = useCallback(
    (metrics: {
      compressionRate: number;
      compressionDepth: number;
      shockDelivered: boolean;
      medicationGiven: 'epinephrine' | 'amiodarone' | null;
      cyclesDuration: number;
    }) => {
      const result = evaluateCprExecution(state, metrics);
      setState(result.newState);
      setFeedback(result.feedback);
      setFeedbackType(result.isCorrect ? 'success' : 'error');
      setShowCprClock(false);

      // After successful CPR, simulate ROSC
      if (result.isCorrect && result.newState.cpuCycles >= 2) {
        setTimeout(() => {
          const roscState = simulateRosc(result.newState);
          setState(roscState);
          setFeedback(roscState.learnerActions[roscState.learnerActions.length - 1].feedback);
          setFeedbackType('success');
        }, 2000);
      }
    },
    [state]
  );

  // ============================================================================
  // PHASE 7: Post-Resuscitation Care
  // ============================================================================
  const handlePostResuscitationCare = useCallback(() => {
    const result = evaluatePostResuscitationCare(state, {
      targetTemperature: 33,
      sedationInitiated: true,
      continuousMonitoring: true,
      referralInitiated: true,
    });

    setState(result.newState);
    setFeedback(result.feedback);
    setFeedbackType(result.isCorrect ? 'success' : 'error');

    if (result.isCorrect) {
      const scoreData = calculateSimulationScore(result.newState);
      setTimeout(() => {
        onComplete(scoreData.percentage, scoreData.simReady);
      }, 2000);
    }
  }, [state, onComplete]);

  // ============================================================================
  // RENDER: Patient Vitals Card
  // ============================================================================
  const renderVitalsCard = () => (
    <Card className="border-slate-300 bg-slate-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Patient Vitals
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">Age</p>
          <p className="font-semibold">{state.patientState.age} years</p>
        </div>
        <div>
          <p className="text-muted-foreground">Weight</p>
          <p className="font-semibold">{state.patientState.weight} kg</p>
        </div>
        <div>
          <p className="text-muted-foreground">HR</p>
          <p className={`font-semibold ${state.patientState.heartRate > 150 ? 'text-red-600' : ''}`}>
            {state.patientState.heartRate} bpm
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">BP</p>
          <p className="font-semibold">
            {state.patientState.bloodPressure.systolic}/{state.patientState.bloodPressure.diastolic}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">SpO₂</p>
          <p className={`font-semibold ${state.patientState.oxygenSaturation < 90 ? 'text-red-600' : ''}`}>
            {state.patientState.oxygenSaturation}%
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">RR</p>
          <p className="font-semibold">{state.patientState.respiratoryRate} /min</p>
        </div>
      </CardContent>
    </Card>
  );

  // ============================================================================
  // RENDER: Phase-Specific UI
  // ============================================================================
  const renderPhaseContent = () => {
    switch (state.phase) {
      case 'initial_assessment':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Phase 1: Initial Assessment (ABCDE)
              </CardTitle>
              <CardDescription>
                Perform a systematic ABCDE assessment. The patient is a 2-year-old with respiratory distress and poor perfusion.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rr">Respiratory Rate (breaths/min)</Label>
                  <Input
                    id="rr"
                    type="number"
                    value={abcdeInput.respiratoryRate}
                    onChange={(e) =>
                      setAbcdeInput({ ...abcdeInput, respiratoryRate: e.target.value })
                    }
                    placeholder="e.g., 45"
                  />
                </div>
                <div>
                  <Label htmlFor="spo2">Oxygen Saturation (%)</Label>
                  <Input
                    id="spo2"
                    type="number"
                    value={abcdeInput.oxygenSaturation}
                    onChange={(e) =>
                      setAbcdeInput({ ...abcdeInput, oxygenSaturation: e.target.value })
                    }
                    placeholder="e.g., 88"
                  />
                </div>
                <div>
                  <Label htmlFor="crt">Capillary Refill Time (seconds)</Label>
                  <Input
                    id="crt"
                    type="number"
                    value={abcdeInput.capillaryRefillTime}
                    onChange={(e) =>
                      setAbcdeInput({ ...abcdeInput, capillaryRefillTime: e.target.value })
                    }
                    placeholder="e.g., 4"
                  />
                </div>
                <div>
                  <Label htmlFor="pulse">Pulse Quality</Label>
                  <select
                    id="pulse"
                    value={abcdeInput.pulseQuality}
                    onChange={(e) =>
                      setAbcdeInput({
                        ...abcdeInput,
                        pulseQuality: e.target.value as 'weak' | 'strong' | 'absent',
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="strong">Strong</option>
                    <option value="weak">Weak</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
              </div>
              <Button onClick={handleAbcdeSubmit} className="w-full">
                Submit Assessment
              </Button>
            </CardContent>
          </Card>
        );

      case 'airway_breathing':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wind className="h-5 w-5" />
                Phase 2: Airway & Breathing Intervention
              </CardTitle>
              <CardDescription>
                The patient has respiratory distress (RR 45, SpO₂ 88%). Choose the appropriate oxygen delivery method.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                onClick={() => handleAirwayIntervention('high_flow_oxygen')}
                className="w-full justify-start"
              >
                <Wind className="h-4 w-4 mr-2" />
                High-Flow Oxygen (15 L/min)
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAirwayIntervention('hfnc')}
                className="w-full justify-start"
              >
                <Wind className="h-4 w-4 mr-2" />
                High-Flow Nasal Cannula (HFNC)
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAirwayIntervention('cpap')}
                className="w-full justify-start"
              >
                <Wind className="h-4 w-4 mr-2" />
                CPAP
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAirwayIntervention('intubation')}
                className="w-full justify-start"
              >
                <Wind className="h-4 w-4 mr-2" />
                Intubation
              </Button>
            </CardContent>
          </Card>
        );

      case 'circulation_assessment':
      case 'shock_recognition':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Phase 3: Shock Assessment
              </CardTitle>
              <CardDescription>
                The patient has poor perfusion (CRT 4s, weak pulse, low BP). Differentiate the shock type.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                onClick={() => handleShockAssessment('hypovolemic')}
                className="w-full justify-start"
              >
                <Droplets className="h-4 w-4 mr-2" />
                Hypovolemic Shock
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShockAssessment('distributive')}
                className="w-full justify-start"
              >
                <Droplets className="h-4 w-4 mr-2" />
                Distributive Shock (Sepsis)
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShockAssessment('cardiogenic')}
                className="w-full justify-start"
              >
                <Heart className="h-4 w-4 mr-2" />
                Cardiogenic Shock
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShockAssessment('obstructive')}
                className="w-full justify-start"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Obstructive Shock
              </Button>
            </CardContent>
          </Card>
        );

      case 'fluid_resuscitation':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-4" />
                Phase 4: Fluid Resuscitation
              </CardTitle>
              <CardDescription>
                Initiate IV/IO access and give a 20 mL/kg crystalloid bolus over 15 minutes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fluid-volume">Fluid Volume (mL)</Label>
                <Input
                  id="fluid-volume"
                  type="number"
                  value={fluidInput.volume}
                  onChange={(e) => setFluidInput({ ...fluidInput, volume: e.target.value })}
                  placeholder={`Expected: ${state.patientState.weight * 20} mL`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Expected: {state.patientState.weight} kg × 20 mL/kg = {state.patientState.weight * 20} mL
                </p>
              </div>
              <div>
                <Label htmlFor="fluid-type">Fluid Type</Label>
                <select
                  id="fluid-type"
                  value={fluidInput.type}
                  onChange={(e) =>
                    setFluidInput({
                      ...fluidInput,
                      type: e.target.value as 'normal_saline' | 'lactated_ringer',
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="normal_saline">Normal Saline (0.9%)</option>
                  <option value="lactated_ringer">Lactated Ringer</option>
                </select>
              </div>
              <Button onClick={handleFluidResuscitation} className="w-full">
                Administer Bolus
              </Button>
            </CardContent>
          </Card>
        );

      case 'cardiac_arrest':
        return (
          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                CARDIAC ARREST
              </CardTitle>
              <CardDescription className="text-red-600">
                Patient is pulseless, apneic, and unresponsive. Rhythm: Ventricular Fibrillation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-red-300 bg-red-100">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  ⚠ INITIATE CPR IMMEDIATELY. Attach pads, charge defibrillator, and begin chest compressions at 100-120 bpm.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => setShowCprClock(true)}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Open CPR Clock
              </Button>
            </CardContent>
          </Card>
        );

      case 'rosc_achieved':
        return (
          <Card className="border-emerald-300 bg-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                ROSC ACHIEVED
              </CardTitle>
              <CardDescription className="text-emerald-600">
                Return of Spontaneous Circulation. Pulse restored, breathing spontaneous.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-emerald-300 bg-emerald-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-700">
                  ✓ Excellent CPR execution. Now transition to post-resuscitation care.
                </AlertDescription>
              </Alert>
              <Button onClick={handlePostResuscitationCare} className="w-full bg-emerald-600 hover:bg-emerald-700">
                Continue to Post-Resuscitation Care
              </Button>
            </CardContent>
          </Card>
        );

      case 'post_resuscitation':
        return (
          <Card className="border-blue-300 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Activity className="h-5 w-5" />
                Post-Resuscitation Care
              </CardTitle>
              <CardDescription className="text-blue-600">
                Initiate therapeutic hypothermia, sedation, and arrange PICU transfer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-blue-300 bg-blue-100">
                <Activity className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  ✓ Post-resuscitation care initiated. Simulation complete!
                </AlertDescription>
              </Alert>
              <Button onClick={onClose} className="w-full">
                Close Simulation
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  if (showCprClock) {
    return (
      <CPRClockUnified
        patientWeight={state.patientState.weight}
        patientAgeMonths={state.patientState.age * 12}
        onClose={() => setShowCprClock(false)}
        autoStart={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-600" />
            PALS Capstone Simulation
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete this high-fidelity simulation to demonstrate clinical readiness for the bedside.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Elapsed: {Math.floor(state.elapsedTime / 60)}:{String(state.elapsedTime % 60).padStart(2, '0')}
            </span>
          </div>
          <Badge variant="outline">
            Score: {state.score} / 100
          </Badge>
        </div>

        {/* Vitals */}
        {renderVitalsCard()}

        {/* Feedback */}
        {feedback && (
          <Alert
            className={
              feedbackType === 'success'
                ? 'border-emerald-300 bg-emerald-50'
                : feedbackType === 'error'
                  ? 'border-red-300 bg-red-50'
                  : 'border-blue-300 bg-blue-50'
            }
          >
            {feedbackType === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : feedbackType === 'error' ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : (
              <Activity className="h-4 w-4 text-blue-600" />
            )}
            <AlertDescription
              className={
                feedbackType === 'success'
                  ? 'text-emerald-700'
                  : feedbackType === 'error'
                    ? 'text-red-700'
                    : 'text-blue-700'
              }
            >
              {feedback}
            </AlertDescription>
          </Alert>
        )}

        {/* Phase Content */}
        {renderPhaseContent()}

        {/* Action Buttons */}
        {state.phase === 'fluid_resuscitation' && (
          <Button
            variant="outline"
            onClick={handleProgressToArrest}
            className="w-full border-orange-300 text-orange-700"
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Patient Deteriorating (Skip to Arrest)
          </Button>
        )}

        {/* Close Button */}
        <Button variant="ghost" onClick={onClose} className="w-full">
          Exit Simulation
        </Button>
      </div>
    </div>
  );
}
