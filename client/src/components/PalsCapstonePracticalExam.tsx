import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import {
  initializePracticalScenario,
  validateAssessment,
  validateIntervention,
  advancePhase,
  type PracticalScenarioState,
} from '@/lib/resus/pals-capstone-practical-engine';

interface PalsCapstonePracticalExamProps {
  onComplete?: (score: number, simReadyBadge: boolean) => void;
}

export default function PalsCapstonePracticalExam({
  onComplete,
}: PalsCapstonePracticalExamProps) {
  const [scenarioState, setScenarioState] = useState<PracticalScenarioState>(() =>
    initializePracticalScenario()
  );
  const [selectedAssessments, setSelectedAssessments] = useState<string[]>([]);
  const [selectedInterventions, setSelectedInterventions] = useState<string[]>([]);

  // Handle assessment finding selection
  const handleAssessmentToggle = (finding: string) => {
    setSelectedAssessments((prev) =>
      prev.includes(finding) ? prev.filter((f) => f !== finding) : [...prev, finding]
    );
  };

  // Submit assessment and move to intervention stage
  const handleSubmitAssessment = () => {
    const newState = validateAssessment(scenarioState, selectedAssessments);
    setScenarioState(newState);
  };

  // Handle intervention selection
  const handleInterventionToggle = (intervention: string) => {
    setSelectedInterventions((prev) =>
      prev.includes(intervention)
        ? prev.filter((i) => i !== intervention)
        : [...prev, intervention]
    );
  };

  // Submit interventions and validate
  const handleSubmitIntervention = () => {
    const newState = validateIntervention(scenarioState, selectedInterventions);
    setScenarioState(newState);
  };

  // Move to next phase
  const handleContinueToNextPhase = () => {
    const newState = advancePhase(scenarioState);
    setScenarioState(newState);
    setSelectedAssessments([]);
    setSelectedInterventions([]);
  };

  // Scenario complete
  if (scenarioState.isScenarioComplete) {
    const finalScore = scenarioState.score;
    const simReady = finalScore >= 80;

    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600">
          <CardTitle className="text-white">Practical Exam Complete!</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="text-center">
            <div className="text-6xl font-bold text-emerald-600 mb-2">{finalScore}%</div>
            <p className="text-lg text-gray-700 mb-4">
              {simReady
                ? '✓ You earned the "Sim-Ready" badge!'
                : 'Keep practicing to earn the "Sim-Ready" badge (80%+)'}
            </p>
          </div>

          <Alert className={`${simReady ? 'border-emerald-500 bg-emerald-50' : 'border-amber-500 bg-amber-50'}`}>
            <AlertDescription className={simReady ? 'text-emerald-800' : 'text-amber-800'}>
              {simReady
                ? 'Excellent work! You demonstrated clinical readiness for pediatric resuscitation. You are now certified as "Sim-Ready."'
                : 'You showed good effort. Review the scenario and try again to improve your score.'}
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Performance Summary</h3>
            <p className="text-gray-700">
              Correct Phases: {scenarioState.correctPhases} / {scenarioState.totalPhases}
            </p>
            <p className="text-gray-700">
              Total Score: {finalScore}%
            </p>
          </div>

          <Button onClick={() => window.location.reload()} className="w-full">
            Retake Practical Exam
          </Button>
        </CardContent>
      </Card>
    );
  }

  const phase = scenarioState.currentPhase;
  if (!phase) return null;

  const isAssessmentStage = scenarioState.currentStage === 'assessment';
  const isInterventionStage = scenarioState.currentStage === 'intervention';
  const isPhaseComplete = scenarioState.currentStage === 'complete';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
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
      </Card>

      {/* Clinical Objective & Instructor Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{phase.clinicalObjective}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-blue-900 text-lg leading-relaxed italic">
              "{phase.instructorDescription}"
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ASSESSMENT STAGE */}
      {isAssessmentStage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                1
              </span>
              Assessment: Identify the Findings
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Based on the instructor's description, select the clinical findings you observe:
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {phase.assessmentFindings.map((finding) => (
                <button
                  key={finding.name}
                  onClick={() => handleAssessmentToggle(finding.name)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedAssessments.includes(finding.name)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  } ${finding.critical ? 'ring-2 ring-red-300' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      selectedAssessments.includes(finding.name)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-400'
                    }`}>
                      {selectedAssessments.includes(finding.name) && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{finding.name}</div>
                      <div className="text-sm text-gray-600">{finding.description}</div>
                      {finding.critical && (
                        <div className="text-xs text-red-600 font-semibold mt-1">Critical Finding</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {scenarioState.assessmentFeedback && (
              <Alert className={`${
                scenarioState.assessmentCorrect
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
              }`}>
                <AlertDescription className={scenarioState.assessmentCorrect ? 'text-green-800' : 'text-red-800'}>
                  {scenarioState.assessmentFeedback}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleSubmitAssessment}
              disabled={selectedAssessments.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Submit Assessment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* INTERVENTION STAGE */}
      {(isInterventionStage || isPhaseComplete) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="bg-emerald-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                2
              </span>
              Intervention: Choose Your Actions
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Select the interventions you will perform:
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {phase.interventions.map((intervention) => (
                <button
                  key={intervention.name}
                  onClick={() => handleInterventionToggle(intervention.name)}
                  disabled={isPhaseComplete}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedInterventions.includes(intervention.name)
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  } ${intervention.required ? 'ring-2 ring-orange-300' : ''} ${
                    isPhaseComplete ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      selectedInterventions.includes(intervention.name)
                        ? 'bg-emerald-600 border-emerald-600'
                        : 'border-gray-400'
                    }`}>
                      {selectedInterventions.includes(intervention.name) && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{intervention.name}</div>
                      <div className="text-sm text-gray-600">{intervention.description}</div>
                      {intervention.dose && (
                        <div className="text-xs text-blue-600 font-semibold mt-1">Dose: {intervention.dose}</div>
                      )}
                      {intervention.required && (
                        <div className="text-xs text-orange-600 font-semibold mt-1">Required</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {scenarioState.interventionFeedback && (
              <Alert className={`${
                scenarioState.interventionCorrect
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
              }`}>
                <AlertDescription className={scenarioState.interventionCorrect ? 'text-green-800' : 'text-red-800'}>
                  {scenarioState.interventionFeedback}
                </AlertDescription>
              </Alert>
            )}

            {!isPhaseComplete && (
              <Button
                onClick={handleSubmitIntervention}
                disabled={selectedInterventions.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Submit Interventions
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* CONTINUE BUTTON */}
      {isPhaseComplete && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <div className="text-lg font-semibold text-green-700">
                Phase Complete!
              </div>
              <Button
                onClick={handleContinueToNextPhase}
                className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
              >
                {scenarioState.currentPhaseIndex + 1 >= scenarioState.totalPhases
                  ? 'Complete Practical Exam'
                  : 'Continue to Next Phase'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{scenarioState.currentPhaseIndex + 1} of {scenarioState.totalPhases}</span>
        </div>
        <div className="bg-gray-200 rounded-full h-2 w-full">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{
              width: `${((scenarioState.currentPhaseIndex + 1) / scenarioState.totalPhases) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
