import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  fellowshipSimulationSteps,
  resolveFellowshipSimulationLevel,
} from "../../../shared/fellowship-simulation-scenario";
import type { FellowshipSimChoice, FellowshipSimStep } from "../../../shared/fellowship-simulation-types";

interface FellowshipSimulationProps {
  courseId: string;
  level: "foundational" | "advanced";
  /** When true, learner already completed — allow replay without blocking summative unlock. */
  reviewMode?: boolean;
  isSaving?: boolean;
  onComplete: (opts?: { advanceToSummative?: boolean }) => void;
}

type DisplayChoice = FellowshipSimChoice & { key: string };

function resolveStepChoices(step: FellowshipSimStep): DisplayChoice[] {
  if (step.choices?.length) {
    return step.choices.map((c, i) => ({ ...c, key: c.id || `choice_${i}` }));
  }
  return (step.expectedActions ?? []).map((action, i) => ({
    id: action,
    key: `legacy_${i}`,
    label: action.replace(/_/g, " "),
    correct: true,
    feedback: "Correct action.",
  }));
}

export function FellowshipSimulation({
  courseId,
  level,
  reviewMode = false,
  isSaving = false,
  onComplete,
}: FellowshipSimulationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackCorrect, setFeedbackCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);

  const simLevel = resolveFellowshipSimulationLevel(level);

  const { data: simulationData, isLoading, isError } = trpc.learning.getFellowshipSimulation.useQuery({
    courseId,
    level: simLevel,
  });

  const steps = useMemo(
    () => fellowshipSimulationSteps(simulationData?.scenarioData) as FellowshipSimStep[],
    [simulationData]
  );
  const currentScenarioStep = steps[currentStep];
  const choices = useMemo(
    () => (currentScenarioStep ? resolveStepChoices(currentScenarioStep) : []),
    [currentScenarioStep]
  );
  const isDebrief = Boolean(currentScenarioStep?.debriefPoints?.length);

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load simulation. Please try again.");
    }
  }, [isError]);

  const advanceStep = () => {
    setFeedback(null);
    setFeedbackCorrect(null);
    setShowHint(false);
    setAnsweredCorrectly(false);
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setSimulationComplete(true);
    }
  };

  const handleChoice = (choice: DisplayChoice) => {
    if (answeredCorrectly) return;

    if (choice.correct) {
      setFeedback(choice.feedback);
      setFeedbackCorrect(true);
      setAnsweredCorrectly(true);
      setTimeout(advanceStep, isDebrief ? 800 : 1500);
    } else {
      setFeedback(choice.feedback);
      setFeedbackCorrect(false);
      if (choice.hint) {
        setShowHint(true);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading simulation...</span>
      </div>
    );
  }

  if (isError || !simulationData || steps.length === 0) {
    return (
      <Card className="border-red-200 bg-red-50 text-red-700">
        <CardHeader>
          <CardTitle className="text-red-800">Simulation Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Unable to load simulation for {courseId} ({level}). Please ensure the simulation data is correctly configured.</p>
        </CardContent>
      </Card>
    );
  }

  const restartSimulation = () => {
    setCurrentStep(0);
    setFeedback(null);
    setFeedbackCorrect(null);
    setShowHint(false);
    setAnsweredCorrectly(false);
    setSimulationComplete(false);
  };

  if (simulationComplete) {
    return (
      <Card className="border-emerald-200 bg-emerald-50 text-emerald-700">
        <CardHeader>
          <CardTitle className="text-emerald-800">
            {reviewMode ? "Simulation review complete" : "Simulation Complete!"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <p className="text-lg">
            {reviewMode
              ? `You reviewed the simulation for ${simulationData.title}.`
              : `You have successfully completed the simulation for ${simulationData.title}.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={restartSimulation}
              className="border-emerald-300 text-emerald-800 hover:bg-emerald-100"
            >
              {reviewMode ? "Replay simulation" : "Practice again"}
            </Button>
            {reviewMode ? (
              <Button
                variant="outline"
                onClick={() => onComplete({ advanceToSummative: false })}
                className="border-emerald-300 text-emerald-800 hover:bg-emerald-100"
              >
                Back to course
              </Button>
            ) : null}
            <Button
              onClick={() => onComplete({ advanceToSummative: !reviewMode })}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : reviewMode ? (
                "Go to final exam"
              ) : (
                "Continue to Final Exam"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-primary text-white rounded-t-lg p-6">
        <CardTitle className="text-2xl font-bold">Fellowship Simulation: {simulationData.title}</CardTitle>
        <p className="text-primary-foreground/80">Level: {level.charAt(0).toUpperCase() + level.slice(1)}</p>
        {simulationData.description && (
          <p className="text-primary-foreground/90 text-sm mt-2">{simulationData.description}</p>
        )}
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">
            {currentScenarioStep?.title ?? `Step ${currentStep + 1}`} — Step {currentStep + 1} of {steps.length}
          </h3>
          <p className="text-lg text-gray-700">{currentScenarioStep?.description}</p>
          {currentScenarioStep?.vitals && (
            <div className="bg-blue-50 border-l-4 border-blue-200 p-4 text-blue-800">
              <h4 className="font-semibold">Clinical findings:</h4>
              <ul className="list-disc list-inside">
                {Object.entries(currentScenarioStep.vitals).map(([key, value]) => (
                  <li key={key}><strong>{key.replace(/_/g, " ")}:</strong> {String(value)}</li>
                ))}
              </ul>
            </div>
          )}
          {currentScenarioStep?.clinicalContext && (
            <div className="bg-gray-50 border-l-4 border-gray-200 p-4 text-gray-700 italic">
              <h4 className="font-semibold not-italic">Clinical context:</h4>
              <p>{currentScenarioStep.clinicalContext}</p>
            </div>
          )}
          {currentScenarioStep?.debriefPoints && (
            <div className="bg-amber-50 border-l-4 border-amber-300 p-4 text-amber-900">
              <h4 className="font-semibold flex items-center gap-2">
                <Lightbulb className="w-4 h-4" /> Key learning points
              </h4>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {currentScenarioStep.debriefPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}
          {currentScenarioStep?.instruction && (
            <p className="text-md font-medium"><strong>Your decision:</strong> {currentScenarioStep.instruction}</p>
          )}
        </div>

        <div className="space-y-3">
          {choices.map((choice) => (
            <Button
              key={choice.key}
              variant="outline"
              className={cn(
                "w-full justify-start text-left h-auto py-3 whitespace-normal",
                answeredCorrectly && choice.correct && "border-emerald-500 bg-emerald-50"
              )}
              onClick={() => handleChoice(choice)}
              disabled={answeredCorrectly}
            >
              {choice.label}
            </Button>
          ))}
        </div>

        {showHint && (
          <div className="p-3 rounded-md bg-amber-50 text-amber-900 border border-amber-200 flex items-start gap-2">
            <Lightbulb className="w-5 h-5 shrink-0 mt-0.5" />
            <span>
              {choices.find((c) => !c.correct && c.hint)?.hint ??
                "Review the clinical context and module teaching, then try another option."}
            </span>
          </div>
        )}

        {feedback && (
          <div className={cn(
            "p-3 rounded-md flex items-center gap-2",
            feedbackCorrect ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
          )}>
            {feedbackCorrect ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{feedback}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
