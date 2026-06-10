import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface FellowshipSimulationProps {
  courseId: string;
  level: "foundational" | "advanced";
  onComplete: () => void;
}

export function FellowshipSimulation({
  courseId,
  level,
  onComplete,
}: FellowshipSimulationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userActions, setUserActions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [simulationComplete, setSimulationComplete] = useState(false);

  const { data: simulationData, isLoading, isError } = trpc.learning.getFellowshipSimulation.useQuery({
    courseId,
    level,
  });

  const steps = useMemo(() => simulationData?.scenarioData?.pages ? Object.values(simulationData.scenarioData.pages) : [], [simulationData]);
  const currentScenarioStep = steps[currentStep];

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load simulation. Please try again.");
    }
  }, [isError]);

  const handleAction = (action: string) => {
    setUserActions((prev) => [...prev, action]);
    // Basic feedback logic for now, will be expanded with actual scenario engine
    if (currentScenarioStep?.expectedActions?.includes(action)) {
      setFeedback("Correct action!");
    } else {
      setFeedback("Incorrect action. Review the clinical context.");
    }
    // Advance step after action for now, will be more complex later
    setTimeout(() => {
      setFeedback(null);
      if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        setSimulationComplete(true);
      }
    }, 1500);
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

  if (simulationComplete) {
    return (
      <Card className="border-emerald-200 bg-emerald-50 text-emerald-700">
        <CardHeader>
          <CardTitle className="text-emerald-800">Simulation Complete!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <p className="text-lg mb-4">You have successfully completed the simulation for {simulationData.title}.</p>
          <Button onClick={onComplete} className="bg-emerald-600 hover:bg-emerald-700">
            Continue to Final Exam
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-primary text-white rounded-t-lg p-6">
        <CardTitle className="text-2xl font-bold">Fellowship Simulation: {simulationData.title}</CardTitle>
        <p className="text-primary-foreground/80">Level: {level.charAt(0).toUpperCase() + level.slice(1)}</p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Scenario Step {currentStep + 1} of {steps.length}</h3>
          <p className="text-lg text-gray-700">{currentScenarioStep?.description}</p>
          {currentScenarioStep?.vitals && (
            <div className="bg-blue-50 border-l-4 border-blue-200 p-4 text-blue-800">
              <h4 className="font-semibold">Vitals:</h4>
              <ul className="list-disc list-inside">
                {Object.entries(currentScenarioStep.vitals).map(([key, value]) => (
                  <li key={key}><strong>{key}:</strong> {value}</li>
                ))}
              </ul>
            </div>
          )}
          {currentScenarioStep?.clinicalContext && (
            <div className="bg-gray-50 border-l-4 border-gray-200 p-4 text-gray-700 italic">
              <h4 className="font-semibold">Clinical Context:</h4>
              <p>{currentScenarioStep.clinicalContext}</p>
            </div>
          )}
          {currentScenarioStep?.instruction && (
            <p className="text-md font-medium"><strong>Instruction:</strong> {currentScenarioStep.instruction}</p>
          )}
        </div>

        <div className="space-y-3">
          <h4 className="text-lg font-semibold">Expected Actions:</h4>
          {currentScenarioStep?.expectedActions?.map((action: string, index: number) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleAction(action)}
              disabled={!!feedback}
            >
              {action}
            </Button>
          ))}
        </div>

        {feedback && (
          <div className={cn(
            "p-3 rounded-md flex items-center gap-2",
            feedback.includes("Correct") ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
          )}>
            {feedback.includes("Correct") ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{feedback}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
