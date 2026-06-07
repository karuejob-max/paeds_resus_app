import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, XCircle, GripVertical } from "lucide-react";
import {
  PALS_PRIORITY_SCENARIOS,
  calculatePriorityScore,
  generatePriorityFeedback,
  type ClinicalPhase,
  type PriorityIntervention,
} from "@/lib/resus/pals-capstone-priority-engine";
import { cn } from "@/lib/utils";

interface PalsCapstonePriorityExamProps {
  onComplete: (score: number, passed: boolean) => void;
}

export function PalsCapstonePriorityExam({ onComplete }: PalsCapstonePriorityExamProps) {
  const phases: ClinicalPhase[] = [
    "pat",
    "airway",
    "breathing",
    "circulation",
    "disability",
    "exposure",
    "sample",
    "cardiac_arrest",
    "post_rosc",
  ];

  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [userOrderings, setUserOrderings] = useState<Record<ClinicalPhase, string[]>>({} as any);
  const [submittedPhases, setSubmittedPhases] = useState<Set<ClinicalPhase>>(new Set());
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const currentPhase = phases[currentPhaseIndex];
  const challenge = PALS_PRIORITY_SCENARIOS[currentPhase];
  const currentOrdering = userOrderings[currentPhase] || [];
  const isSubmitted = submittedPhases.has(currentPhase);

  // Initialize ordering with shuffled intervention IDs
  const availableInterventions = useMemo(() => {
    if (currentOrdering.length === 0) {
      return challenge.shuffledOrder;
    }
    return currentOrdering;
  }, [challenge, currentOrdering]);

  const handleDragStart = (id: string) => {
    setDraggedItem(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedItem || draggedItem === targetId) return;

    const newOrdering = [...availableInterventions];
    const draggedIndex = newOrdering.indexOf(draggedItem);
    const targetIndex = newOrdering.indexOf(targetId);

    [newOrdering[draggedIndex], newOrdering[targetIndex]] = [
      newOrdering[targetIndex],
      newOrdering[draggedIndex],
    ];

    setUserOrderings({
      ...userOrderings,
      [currentPhase]: newOrdering,
    });
    setDraggedItem(null);
  };

  const handleSubmit = () => {
    setSubmittedPhases(new Set([...submittedPhases, currentPhase]));
  };

  const handleNext = () => {
    if (currentPhaseIndex < phases.length - 1) {
      setCurrentPhaseIndex(currentPhaseIndex + 1);
    } else {
      // Calculate overall score
      let totalScore = 0;
      let phasesCount = 0;

      phases.forEach((phase) => {
        const phaseChallenge = PALS_PRIORITY_SCENARIOS[phase];
        const phaseOrdering = userOrderings[phase] || [];
        const score = calculatePriorityScore(phaseOrdering, phaseChallenge.correctOrder);
        totalScore += score;
        phasesCount++;
      });

      const overallScore = Math.round(totalScore / phasesCount);
      const passed = overallScore >= 80;

      onComplete(overallScore, passed);
    }
  };

  const score = isSubmitted
    ? calculatePriorityScore(availableInterventions, challenge.correctOrder)
    : null;
  const feedback = isSubmitted
    ? generatePriorityFeedback(availableInterventions, challenge.correctOrder, challenge)
    : [];
  const passed = score !== null && score >= challenge.passingScore;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">PALS Capstone: Priority Ordering</h1>
          <p className="text-sm text-muted-foreground">
            Phase {currentPhaseIndex + 1} of {phases.length}
          </p>
        </div>
        <div className="flex gap-1">
          {phases.map((phase, idx) => (
            <div
              key={phase}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                idx < currentPhaseIndex
                  ? "bg-emerald-500 text-white"
                  : idx === currentPhaseIndex
                    ? "bg-blue-500 text-white ring-2 ring-blue-300"
                    : "bg-slate-200 text-slate-600"
              )}
            >
              {idx + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Scenario Card */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">{challenge.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground italic">{challenge.scenario}</p>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-amber-50 dark:bg-amber-950 border-l-4 border-l-amber-500">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-semibold mb-2">Drag to Reorder</p>
              <p>
                Arrange the interventions in the correct order of clinical priority. The most urgent action should be
                first.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Intervention Ordering */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clinical Interventions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableInterventions.map((interventionId, index) => {
            const intervention = challenge.interventions.find((i) => i.id === interventionId);
            if (!intervention) return null;

            const isCorrectPosition =
              isSubmitted && challenge.correctOrder[index] === interventionId;
            const isWrongPosition =
              isSubmitted && challenge.correctOrder.indexOf(interventionId) !== index;

            return (
              <div
                key={interventionId}
                draggable={!isSubmitted}
                onDragStart={() => handleDragStart(interventionId)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(interventionId)}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all cursor-move",
                  !isSubmitted
                    ? "border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-900"
                    : isCorrectPosition
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950"
                      : isWrongPosition
                        ? "border-red-500 bg-red-50 dark:bg-red-950"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900",
                  draggedItem === interventionId && "opacity-50"
                )}
              >
                <div className="flex gap-3 items-start">
                  <div className="flex items-center gap-2 mt-1">
                    <GripVertical className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-lg text-foreground">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{intervention.label}</p>
                    <p className="text-sm text-muted-foreground">{intervention.description}</p>
                    {intervention.category === "critical" && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-bold rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200">
                        CRITICAL
                      </span>
                    )}
                  </div>
                  {isSubmitted && (
                    <div className="flex-shrink-0">
                      {isCorrectPosition ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : isWrongPosition ? (
                        <XCircle className="w-6 h-6 text-red-500" />
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Feedback */}
      {isSubmitted && (
        <Card className={passed ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950" : "border-red-500 bg-red-50 dark:bg-red-950"}>
          <CardHeader>
            <div className="flex items-center gap-2">
              {passed ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              )}
              <div>
                <CardTitle className="text-foreground">
                  {passed ? "Excellent!" : "Review Your Ordering"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">Score: {score}%</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {feedback.map((msg, idx) => (
              <p key={idx} className="text-sm text-foreground">
                {msg}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-between">
        <Button
          variant="outline"
          onClick={() => {
            if (currentPhaseIndex > 0) {
              setCurrentPhaseIndex(currentPhaseIndex - 1);
            }
          }}
          disabled={currentPhaseIndex === 0}
          className="text-foreground"
        >
          Previous Phase
        </Button>

        <div className="flex gap-3">
          {!isSubmitted ? (
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">
              Submit Ordering
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className={passed ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-slate-600 hover:bg-slate-700 text-white"}
            >
              {currentPhaseIndex === phases.length - 1 ? "Complete Exam" : "Next Phase"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
