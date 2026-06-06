import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import IntegratedClinicalFlow from '@/components/IntegratedClinicalFlow';
import {
  initializeInteractiveScenario,
  validateLearnerInput,
  advanceToNextPhase,
  showHintForPhase,
  calculateFinalScore,
  type InteractiveScenarioState,
} from '@/lib/resus/pals-capstone-interactive-engine';

interface PalsCapstoneInteractivePracticalProps {
  patientAge: number;
  patientWeight: number;
  onComplete?: (score: number, simReadyBadge: boolean) => void;
}

export default function PalsCapstoneInteractivePractical({
  patientAge,
  patientWeight,
  onComplete,
}: PalsCapstoneInteractivePracticalProps) {
  const [scenarioState, setScenarioState] = useState<InteractiveScenarioState>(() =>
    initializeInteractiveScenario()
  );
  const [selectedFindings, setSelectedFindings] = useState<string[]>([]);
  const [showResusGps, setShowResusGps] = useState(true);
  const [scenarioComplete, setScenarioComplete] = useState(false);

  // Handle learner's selection of findings
  const handleFindingSelection = (finding: string) => {
    setSelectedFindings((prev) =>
      prev.includes(finding) ? prev.filter((f) => f !== finding) : [...prev, finding]
    );
  };

  // Validate learner's inputs
  const handleSubmitFindings = () => {
    const newState = validateLearnerInput(scenarioState, selectedFindings);
    setScenarioState(newState);

    if (newState.isPhaseComplete) {
      // Clear selections for next phase
      setSelectedFindings([]);
    }
  };

  // Move to next phase
  const handleNextPhase = () => {
    const newState = advanceToNextPhase(scenarioState);
    setScenarioState(newState);
    setSelectedFindings([]);

    // Check if scenario is complete
    if (newState.currentPhaseIndex >= newState.totalPhases) {
      const finalScore = calculateFinalScore(newState);
      setScenarioComplete(true);
      if (onComplete) {
        onComplete(finalScore, finalScore >= 80);
      }
    }
  };

  // Show hint
  const handleShowHint = () => {
    const newState = showHintForPhase(scenarioState);
    setScenarioState(newState);
  };

  // Get feedback color based on type
  const getFeedbackColor = () => {
    switch (scenarioState.feedbackType) {
      case 'success':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'hint':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getFeedbackTextColor = () => {
    switch (scenarioState.feedbackType) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'hint':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  if (scenarioComplete) {
    const finalScore = calculateFinalScore(scenarioState);
    const simReady = finalScore >= 80;

    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600">
          <CardTitle className="text-white">Scenario Complete!</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="text-center">
            <div className="text-5xl font-bold text-emerald-600 mb-2">{finalScore}%</div>
            <p className="text-lg text-gray-700 mb-4">
              {simReady
                ? '✓ You earned the "Sim-Ready" badge!'
                : 'Keep practicing to earn the "Sim-Ready" badge (80%+)'}
            </p>
          </div>

          <Alert className={`${simReady ? 'border-emerald-500 bg-emerald-50' : 'border-amber-500 bg-amber-50'}`}>
            <AlertDescription className={simReady ? 'text-emerald-800' : 'text-amber-800'}>
              {simReady
                ? 'Excellent work! You demonstrated clinical readiness for pediatric resuscitation. You are now certified as "Sim-Ready" and ready for real-world application.'
                : 'You showed good effort. Review the scenario and try again to improve your score and earn the "Sim-Ready" badge.'}
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Performance Summary</h3>
            <p className="text-gray-700">
              Correct Phases: {scenarioState.correctAnswers} / {scenarioState.totalPhases}
            </p>
            <p className="text-gray-700">
              Total Attempts: {scenarioState.learnerInputs.length}
            </p>
          </div>

          <Button onClick={() => window.location.reload()} className="w-full">
            Retake Scenario
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Scenario Progress */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex justify-between items-center">
            <CardTitle className="text-white">
              Phase {scenarioState.currentPhaseIndex + 1} of {scenarioState.totalPhases}
            </CardTitle>
            <Badge variant="secondary" className="bg-white text-blue-600">
              Score: {scenarioState.score}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Clinical Objective */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h3 className="font-semibold text-blue-900 mb-2">Clinical Objective</h3>
            <p className="text-blue-800">{scenarioState.instructorFinding?.clinicalObjective}</p>
          </div>

          {/* Instructor's Description */}
          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded">
            <h3 className="font-semibold text-indigo-900 mb-2">Instructor's Description</h3>
            <p className="text-indigo-800 text-lg leading-relaxed">
              "{scenarioState.instructorFinding?.instructorDescription}"
            </p>
          </div>

          {/* Feedback */}
          {scenarioState.feedback && (
            <Alert className={`border-l-4 ${getFeedbackColor()}`}>
              <AlertDescription className={getFeedbackTextColor()}>
                {scenarioState.feedback}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ResusGPS Integration */}
      {showResusGps && !scenarioState.isPhaseComplete && (
        <Card>
          <CardHeader>
            <CardTitle>ResusGPS Clinical Tool</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Based on the instructor's description above, select the findings in ResusGPS that match the clinical scenario.
            </p>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-600 text-center mb-4">
                ResusGPS component would be embedded here with interactive finding selection.
              </p>
              <p className="text-sm text-gray-500 text-center">
                You would select findings like: {scenarioState.instructorFinding?.targetFindings.join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learner Input Section */}
      {!scenarioState.isPhaseComplete && (
        <Card>
          <CardHeader>
            <CardTitle>Your Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Findings Selection */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Select the findings you observed:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {scenarioState.instructorFinding?.targetFindings.map((finding) => (
                  <Button
                    key={finding}
                    variant={selectedFindings.includes(finding) ? 'default' : 'outline'}
                    onClick={() => handleFindingSelection(finding)}
                    className="text-left justify-start"
                  >
                    {finding.replace(/_/g, ' ')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSubmitFindings}
                disabled={selectedFindings.length === 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                Submit Selection
              </Button>
              <Button
                onClick={handleShowHint}
                variant="outline"
                className="flex-1"
              >
                Show Hint
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Phase Button */}
      {scenarioState.isPhaseComplete && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-lg font-semibold text-emerald-600">
                ✓ Phase Complete!
              </div>
              <Button
                onClick={handleNextPhase}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {scenarioState.currentPhaseIndex + 1 >= scenarioState.totalPhases
                  ? 'Complete Scenario'
                  : 'Next Phase'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Bar */}
      <div className="bg-gray-200 rounded-full h-2 w-full">
        <div
          className="bg-emerald-600 h-2 rounded-full transition-all"
          style={{
            width: `${((scenarioState.currentPhaseIndex + 1) / scenarioState.totalPhases) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
