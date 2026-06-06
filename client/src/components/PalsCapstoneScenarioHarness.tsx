/**
 * PALS Capstone Scenario Harness
 * 
 * Progressive, instructor-led simulation that embeds the real ResusGPS tool.
 * The harness monitors page transitions and provides contextual scenario findings.
 * 
 * Fixes:
 * - Uses semantic theme tokens for perfect contrast in light/dark modes
 * - Embeds live ResusGPS instead of a separate simulation UI
 * - Progressively unlocks findings as learner navigates through assessment pages
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  CheckCircle2,
  Heart,
  Clock,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';
import {
  initializeScenarioState,
  handlePageTransition,
  validateClinicalAction,
  calculateFinalScore,
  getCurrentScenarioFindings,
  shouldTriggerCardiacArrest,
  type ScenarioState,
  type ResusGpsPage,
} from '@/lib/resus/pals-capstone-scenario-engine';
import IntegratedClinicalFlow from '@/components/IntegratedClinicalFlow';

interface PalsCapstoneScenarioHarnessProps {
  patientAge: number;
  patientWeight: number;
  onComplete: (score: number, simReady: boolean) => void;
  onClose: () => void;
}

export function PalsCapstoneScenarioHarness({
  patientAge,
  patientWeight,
  onComplete,
  onClose,
}: PalsCapstoneScenarioHarnessProps) {
  const [scenarioState, setScenarioState] = useState<ScenarioState>(() =>
    initializeScenarioState()
  );
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showResusGps, setShowResusGps] = useState(true);
  const [rosc, setRosc] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check for cardiac arrest trigger
  useEffect(() => {
    if (shouldTriggerCardiacArrest(scenarioState, elapsedTime)) {
      const newState = handlePageTransition(scenarioState, 'cardiac_arrest', elapsedTime);
      setScenarioState(newState);
    }
  }, [elapsedTime, scenarioState]);

  // Handle ResusGPS page transitions
  const handleResusGpsPageChange = useCallback((newPage: ResusGpsPage) => {
    const newState = handlePageTransition(scenarioState, newPage, elapsedTime);
    setScenarioState(newState);
  }, [scenarioState, elapsedTime]);

  // Handle clinical action validation
  const handleClinicalAction = useCallback((action: string, details?: Record<string, any>) => {
    const validation = validateClinicalAction(scenarioState, action, details);
    
    if (validation.isCorrect) {
      setScenarioState(prev => ({
        ...prev,
        completedActions: [...prev.completedActions, action],
        score: prev.score + validation.pointsAwarded,
        feedback: validation.feedback,
        feedbackType: 'success',
      }));
    } else {
      setScenarioState(prev => ({
        ...prev,
        feedback: validation.feedback,
        feedbackType: 'error',
      }));
    }
  }, [scenarioState]);

  // Handle ROSC
  const handleRosc = useCallback(() => {
    setRosc(true);
    const finalScore = calculateFinalScore(scenarioState, elapsedTime, true);
    setScenarioState(prev => ({
      ...prev,
      score: finalScore,
      feedback: '✓ ROSC achieved! Simulation complete.',
      feedbackType: 'success',
    }));
    setSimulationComplete(true);
  }, [scenarioState, elapsedTime]);

  // Handle simulation completion
  const handleCompleteSimulation = useCallback(() => {
    const finalScore = calculateFinalScore(scenarioState, elapsedTime, rosc);
    const simReady = finalScore >= 80;
    onComplete(finalScore, simReady);
  }, [scenarioState, elapsedTime, rosc, onComplete]);

  const currentFinding = getCurrentScenarioFindings(scenarioState);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (simulationComplete) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-foreground">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                Simulation Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Final Score</p>
                <p className="text-4xl font-bold text-foreground">
                  {scenarioState.score} / 100
                </p>
              </div>

              <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                  {scenarioState.score >= 80
                    ? '✓ Sim-Ready: You have demonstrated clinical readiness for the bedside.'
                    : 'Review the scenario and try again to improve your score.'}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Time Elapsed</p>
                  <p className="font-semibold text-foreground">{formatTime(elapsedTime)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Actions Completed</p>
                  <p className="font-semibold text-foreground">{scenarioState.completedActions.length}</p>
                </div>
              </div>

              <Button onClick={handleCompleteSimulation} className="w-full">
                {scenarioState.score >= 80 ? 'Unlock Certificate' : 'Try Again'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
              <Heart className="h-8 w-8 text-red-600" />
              PALS Capstone Simulation
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage this pediatric emergency using ResusGPS. Follow the instructor's guidance.
            </p>
          </div>
          <div className="text-right space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{formatTime(elapsedTime)}</span>
            </div>
            <Badge variant="outline" className="text-foreground">
              Score: {scenarioState.score} / 100
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main ResusGPS Tool */}
          <div className="lg:col-span-2">
            {showResusGps && (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">ResusGPS Clinical Tool</CardTitle>
                  <CardDescription>
                    Use ResusGPS to manage this patient. Follow the assessment sequence.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <IntegratedClinicalFlow
                    patientAge={patientAge}
                    patientWeight={patientWeight}
                    clinicalFindings={{
                      airwayCompromised: false,
                      respiratoryDistress: scenarioState.currentPage !== 'pat_assessment',
                      wheezingPresent: false,
                      oxygenSaturation: scenarioState.currentPage === 'airway' ? 88 : 98,
                      respiratoryRate: scenarioState.currentPage === 'airway' ? 50 : 30,
                      poorPerfusion: scenarioState.currentPage === 'circulation',
                      capillaryRefillTime: scenarioState.currentPage === 'circulation' ? 3 : 2,
                      heartRate: scenarioState.currentPage === 'circulation' ? 140 : 100,
                      bloodPressure: scenarioState.currentPage === 'circulation' ? { systolic: 85, diastolic: 50 } : { systolic: 110, diastolic: 70 },
                      pulseQuality: scenarioState.currentPage === 'circulation' ? 'weak' : 'strong',
                      consciousnessLevel: scenarioState.cardiacArrestTriggered ? 'unresponsive' : 'alert',
                      seizureActive: false,
                      temperature: scenarioState.currentPage === 'exposure' ? 39.2 : 37,
                      rash: scenarioState.currentPage === 'exposure',
                    }}
                    onInterventionCompleted={handleClinicalAction}
                    onReferralInitiated={handleRosc}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Scenario Sidebar */}
          <div className="space-y-4">
            {/* Current Scenario Finding */}
            {currentFinding && (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    Scenario Update
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold text-foreground">{currentFinding.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentFinding.description}
                    </p>
                  </div>

                  {currentFinding.instruction && (
                    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                      <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                        {currentFinding.instruction}
                      </AlertDescription>
                    </Alert>
                  )}

                  {currentFinding.vitals && (
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-foreground">Current Vitals:</p>
                      <div className="space-y-1">
                        {Object.entries(currentFinding.vitals).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-muted-foreground">
                            <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className="font-mono text-foreground">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentFinding.clinicalContext && (
                    <div className="p-2 bg-muted rounded text-xs text-muted-foreground">
                      <strong>Clinical Context:</strong> {currentFinding.clinicalContext}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Feedback */}
            {scenarioState.feedback && (
              <Alert
                className={
                  scenarioState.feedbackType === 'success'
                    ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800'
                    : scenarioState.feedbackType === 'error'
                      ? 'border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800'
                      : 'border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800'
                }
              >
                {scenarioState.feedbackType === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : scenarioState.feedbackType === 'error' ? (
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                ) : (
                  <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
                <AlertDescription
                  className={
                    scenarioState.feedbackType === 'success'
                      ? 'text-emerald-800 dark:text-emerald-200'
                      : scenarioState.feedbackType === 'error'
                        ? 'text-red-800 dark:text-red-200'
                        : 'text-blue-800 dark:text-blue-200'
                  }
                >
                  {scenarioState.feedback}
                </AlertDescription>
              </Alert>
            )}

            {/* Progress */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pages Unlocked:</span>
                  <span className="font-semibold text-foreground">{scenarioState.unlockedPages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actions Completed:</span>
                  <span className="font-semibold text-foreground">{scenarioState.completedActions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cardiac Arrest:</span>
                  <span className="font-semibold text-foreground">
                    {scenarioState.cardiacArrestTriggered ? '✓ Yes' : 'Pending'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Exit Button */}
            <Button variant="outline" onClick={onClose} className="w-full text-foreground">
              Exit Simulation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
