import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, GripVertical } from "lucide-react";
import {
  PALS_CAPSTONE_SCENARIOS,
  calculatePriorityScore,
  type ClinicalPhase,
  type PriorityIntervention,
} from "@/lib/resus/pals-capstone-clean";

interface PalsCapstoneCleanProps {
  onComplete: (score: number, passed: boolean) => void;
  onClose?: () => void;
}

export function PalsCapstoneClean({ onComplete, onClose }: PalsCapstoneCleanProps) {
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
  const [userOrder, setUserOrder] = useState<string[]>([]);
  const [phaseScores, setPhaseScores] = useState<Record<ClinicalPhase, number>>({} as any);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const currentPhase = phases[currentPhaseIndex];
  const scenario = PALS_CAPSTONE_SCENARIOS[currentPhase];
  const availableInterventions = scenario.shuffledOrder.map((id) => ({
    id,
    ...scenario.interventions[id],
  }));

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    setIsDragging(false);

    if (!userOrder.includes(draggedId)) {
      const newOrder = [...userOrder];
      newOrder.splice(targetIndex, 0, draggedId);
      setUserOrder(newOrder);
    }
  };

  const handleRemoveFromOrder = (id: string) => {
    setUserOrder(userOrder.filter((item) => item !== id));
  };

  const handleSubmitPhase = () => {
    const result = calculatePriorityScore(currentPhase, userOrder);
    setPhaseScores({ ...phaseScores, [currentPhase]: result.score });
    setFeedback(result.feedback);

    if (result.passed) {
      // Move to next phase after a short delay
      setTimeout(() => {
        if (currentPhaseIndex < phases.length - 1) {
          setCurrentPhaseIndex(currentPhaseIndex + 1);
          setUserOrder([]);
          setFeedback([]);
        } else {
          // All phases completed
          const totalScore = Math.round(
            Object.values(phaseScores).reduce((a, b) => a + b, 0) / phases.length
          );
          onComplete(totalScore, totalScore >= 80);
        }
      }, 2000);
    }
  };

  const progress = ((currentPhaseIndex + 1) / phases.length) * 100;
  const allScoresAvailable = Object.keys(phaseScores).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">PALS Capstone Simulation</h1>
          <p className="text-muted-foreground">
            Phase {currentPhaseIndex + 1} of {phases.length}: Drag interventions in the correct clinical order
          </p>
          <div className="mt-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Scenario Description */}
        <Card className="mb-6 p-6 bg-card border-border">
          <h2 className="text-lg font-semibold text-foreground mb-3">Clinical Scenario</h2>
          <p className="text-base text-foreground leading-relaxed">{scenario.description}</p>
        </Card>

        {/* Intervention Selection Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Available Interventions */}
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Available Interventions</h3>
            <div className="space-y-2">
              {availableInterventions
                .filter((intervention) => !userOrder.includes(intervention.id))
                .map((intervention) => (
                  <div
                    key={intervention.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, intervention.id)}
                    className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-move hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-start gap-2"
                  >
                    <GripVertical className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{intervention.description}</p>
                      {intervention.critical && (
                        <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-1">
                          ⚠️ Critical
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          {/* User's Ordered List */}
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Your Order</h3>
            <div
              className="space-y-2 min-h-[200px] p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, userOrder.length)}
            >
              {userOrder.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Drag interventions here to order them
                </p>
              ) : (
                userOrder.map((id, index) => {
                  const intervention = scenario.interventions[id];
                  return (
                    <div
                      key={id}
                      className="p-3 bg-blue-600 dark:bg-blue-700 rounded-lg text-white flex items-start justify-between gap-2"
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-lg min-w-[24px]">{index + 1}.</span>
                        <div>
                          <p className="font-medium">{intervention.description}</p>
                          {intervention.critical && (
                            <p className="text-xs text-blue-100 mt-1">Critical intervention</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFromOrder(id)}
                        className="text-white hover:text-blue-200 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Feedback */}
        {feedback.length > 0 && (
          <Card
            className={`mb-6 p-4 border-l-4 ${
              Object.values(phaseScores)[currentPhaseIndex] >= 80
                ? "bg-green-50 dark:bg-green-900/20 border-l-green-600"
                : "bg-red-50 dark:bg-red-900/20 border-l-red-600"
            }`}
          >
            <div className="flex gap-3">
              {Object.values(phaseScores)[currentPhaseIndex] >= 80 ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold text-foreground mb-2">
                  Score: {Object.values(phaseScores)[currentPhaseIndex]}%
                </p>
                {feedback.map((msg, idx) => (
                  <p key={idx} className="text-sm text-foreground">
                    {msg}
                  </p>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
          <Button
            onClick={handleSubmitPhase}
            disabled={userOrder.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Submit Phase
          </Button>
        </div>

        {/* Phase Progress */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-semibold text-foreground mb-3">Phase Progress</h4>
          <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
            {phases.map((phase, idx) => (
              <div
                key={phase}
                className={`p-2 rounded text-center text-xs font-medium ${
                  idx < currentPhaseIndex
                    ? "bg-green-600 text-white"
                    : idx === currentPhaseIndex
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-foreground"
                }`}
              >
                {idx + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
