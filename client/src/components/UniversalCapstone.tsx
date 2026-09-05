import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { AlertCircle, CheckCircle2, GripVertical, Lightbulb } from "lucide-react";
import { ACLS_CAPSTONE_SCENARIOS, calculateACLSScore } from "../lib/resus/acls-capstone";
import { BLS_CAPSTONE_SCENARIOS, calculateBLSScore } from "../lib/resus/bls-capstone";
import { NRP_CAPSTONE_SCENARIOS, calculateNRPScore } from "../lib/resus/nrp-capstone";
import { HEARTSAVER_CAPSTONE_SCENARIOS, calculateHeartsaverScore } from "../lib/resus/heartsaver-capstone";
import { PALS_CAPSTONE_SCENARIOS, calculatePriorityScore as calculatePALSScore } from "../lib/resus/pals-capstone-clean";

type ProgramType = "bls" | "acls" | "pals" | "nrp" | "heartsaver";

interface UniversalCapstoneProps {
  programType: ProgramType;
  onComplete: (score: number, passed: boolean) => void;
  onClose?: () => void;
}

const SIMULATION_PASSING_SCORE = 70;

type PhaseResult = {
  score: number;
  passed: boolean;
  feedback: string[];
};

export function UniversalCapstone({ programType, onComplete, onClose }: UniversalCapstoneProps) {
  const config = {
    pals: { scenarios: PALS_CAPSTONE_SCENARIOS, scorer: calculatePALSScore, theme: "bg-emerald-600", title: "PALS Capstone Simulation" },
    acls: { scenarios: ACLS_CAPSTONE_SCENARIOS, scorer: calculateACLSScore, theme: "bg-red-600", title: "ACLS Megacode Simulation" },
    bls: { scenarios: BLS_CAPSTONE_SCENARIOS, scorer: calculateBLSScore, theme: "bg-blue-600", title: "BLS Capstone Simulation" },
    nrp: { scenarios: NRP_CAPSTONE_SCENARIOS, scorer: calculateNRPScore, theme: "bg-cyan-600", title: "NRP Capstone Simulation" },
    heartsaver: { scenarios: HEARTSAVER_CAPSTONE_SCENARIOS, scorer: calculateHeartsaverScore, theme: "bg-orange-600", title: "Heartsaver Capstone Simulation" },
  }[programType];

  const phases = Object.keys(config.scenarios);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [userOrder, setUserOrder] = useState<string[]>([]);
  const [phaseScores, setPhaseScores] = useState<Record<string, number>>({});
  const [phasePasses, setPhasePasses] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<PhaseResult | null>(null);
  const [showCorrectOrder, setShowCorrectOrder] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const currentPhase = phases[currentPhaseIndex];
  const scenario = (config.scenarios as any)[currentPhase];
  const availableInterventions = scenario.shuffledOrder.map((id: string) => ({
    ...scenario.interventions[id],
    id,
  }));
  const currentScore = phaseScores[currentPhase];
  const currentPassed = phasePasses[currentPhase] === true;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    if (!draggedId || !scenario.interventions[draggedId]) return;

    setUserOrder((previous) => {
      if (previous.includes(draggedId)) return previous;
      const next = [...previous];
      next.splice(Math.min(targetIndex, next.length), 0, draggedId);
      return next;
    });
    setLastResult(null);
    setFeedback([]);
    setShowCorrectOrder(false);
  };

  const resetPhaseFeedback = () => {
    setLastResult(null);
    setFeedback([]);
    setShowCorrectOrder(false);
    setPhaseScores((previous) => {
      const next = { ...previous };
      delete next[currentPhase];
      return next;
    });
    setPhasePasses((previous) => {
      const next = { ...previous };
      delete next[currentPhase];
      return next;
    });
  };

  const handleRetryPhase = () => {
    setUserOrder([]);
    resetPhaseFeedback();
  };

  const handleSubmitPhase = () => {
    if (isAdvancing || userOrder.length === 0) return;

    const result = (config.scorer as any)(currentPhase, userOrder) as PhaseResult;
    const normalizedScore = Number.isFinite(result.score)
      ? Math.max(0, Math.min(100, Math.round(result.score)))
      : 0;
    const passed = result.passed === true && normalizedScore >= SIMULATION_PASSING_SCORE;
    const normalizedResult: PhaseResult = {
      score: normalizedScore,
      passed,
      feedback: Array.isArray(result.feedback) ? result.feedback : [],
    };

    setPhaseScores((previous) => ({ ...previous, [currentPhase]: normalizedScore }));
    setPhasePasses((previous) => ({ ...previous, [currentPhase]: passed }));
    setLastResult(normalizedResult);
    setFeedback(normalizedResult.feedback);
    setShowCorrectOrder(!passed);

    if (!passed) return;

    setIsAdvancing(true);
    window.setTimeout(() => {
      if (currentPhaseIndex < phases.length - 1) {
        setCurrentPhaseIndex((previous) => previous + 1);
        setUserOrder([]);
        setFeedback([]);
        setLastResult(null);
        setShowCorrectOrder(false);
        setIsAdvancing(false);
      } else {
        const completedScores = { ...phaseScores, [currentPhase]: normalizedScore };
        const totalScore = Math.round(
          phases.reduce((sum, phase) => sum + (completedScores[phase] ?? 0), 0) / phases.length
        );
        setIsAdvancing(false);
        onComplete(totalScore, true);
      }
    }, 1200);
  };

  const progress = ((currentPhaseIndex + 1) / phases.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">{config.title}</h1>
          <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
            <p>Simulation {currentPhaseIndex + 1} of {phases.length}</p>
            <p className="font-medium">Passmark: {SIMULATION_PASSING_SCORE}% per simulation</p>
          </div>
          <div className="mt-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2" aria-label={`Simulation ${currentPhaseIndex + 1} of ${phases.length}`}>
            <div className={`${config.theme} h-2 rounded-full transition-all duration-300`} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <Card className="mb-6 p-6">
          <h2 className="text-lg font-semibold mb-3">Clinical Scenario</h2>
          <p className="text-base leading-relaxed">{scenario.description}</p>
          <p className="text-sm text-muted-foreground mt-3">
            Arrange every intervention in the safest clinical order. You can retry this simulation if your score is below {SIMULATION_PASSING_SCORE}%.
          </p>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Available Interventions</h3>
            <div className="space-y-2">
              {availableInterventions
                .filter((i: any) => !userOrder.includes(i.id))
                .map((i: any) => (
                  <div
                    key={i.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, i.id)}
                    className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-move hover:bg-slate-200 dark:hover:bg-slate-600 flex items-start gap-2"
                  >
                    <GripVertical className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{i.description}</p>
                      {i.critical && <p className="text-xs text-red-600 font-semibold mt-1">Critical step</p>}
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Your Order</h3>
            <div
              className="space-y-2 min-h-[200px] p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, userOrder.length)}
            >
              {userOrder.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Drag interventions here</p>
              ) : (
                userOrder.map((id, index) => {
                  const intervention = scenario.interventions[id];
                  return (
                    <div key={id} className={`p-3 ${config.theme} rounded-lg text-white flex items-start justify-between gap-2`}>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-lg min-w-[24px]">{index + 1}.</span>
                        <div>
                          <p className="font-medium">{intervention.description}</p>
                          {intervention.critical && <p className="text-xs text-white/80 mt-1">Critical intervention</p>}
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${intervention.description}`}
                        onClick={() => {
                          setUserOrder((previous) => previous.filter((item) => item !== id));
                          resetPhaseFeedback();
                        }}
                        className="text-white hover:text-white/80"
                      >
                        ×
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {lastResult && (
          <Card className={`mb-6 p-4 border-l-4 ${
            lastResult.passed
              ? "bg-green-50 dark:bg-green-900/20 border-l-green-600 text-green-900 dark:text-green-100"
              : "bg-red-50 dark:bg-red-900/20 border-l-red-600 text-red-900 dark:text-red-100"
          }`}>
            <div className="flex gap-3">
              {lastResult.passed
                ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                : <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />}
              <div className="w-full">
                <p className="font-semibold mb-1">Simulation score: {lastResult.score}%</p>
                <p className="text-sm font-medium mb-2">
                  {lastResult.passed
                    ? `Passed. Moving to the next simulation${currentPhaseIndex === phases.length - 1 ? " before the summative exam" : ""}.`
                    : `Not passed yet. You need at least ${SIMULATION_PASSING_SCORE}% to continue.`}
                </p>
                {feedback.map((msg, idx) => <p key={idx} className="text-sm">{msg}</p>)}
              </div>
            </div>
          </Card>
        )}

        {!currentPassed && showCorrectOrder && (
          <Card className="mb-6 border-amber-300 bg-amber-50 text-amber-950">
            <div className="p-5">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 mt-0.5 text-amber-700 shrink-0" />
                <div>
                  <h3 className="font-semibold">Correct clinical order</h3>
                  <p className="text-sm mt-1">Review the sequence, then select “Retry this simulation” and reorganize the interventions.</p>
                </div>
              </div>
              <ol className="mt-4 space-y-2 list-decimal list-inside">
                {scenario.correctOrder.map((id: string) => (
                  <li key={id} className="text-sm font-medium">{scenario.interventions[id].description}</li>
                ))}
              </ol>
            </div>
          </Card>
        )}

        <div className="flex flex-wrap gap-4 justify-end">
          {onClose && <Button variant="outline" onClick={onClose}>Close</Button>}
          {lastResult && !lastResult.passed && (
            <Button variant="outline" onClick={handleRetryPhase} className="border-amber-400 text-amber-900 hover:bg-amber-100">
              Retry this simulation
            </Button>
          )}
          <Button onClick={handleSubmitPhase} disabled={userOrder.length === 0 || isAdvancing} className={config.theme + " text-white"}>
            {isAdvancing ? "Moving to next simulation…" : "Submit simulation"}
          </Button>
        </div>
      </div>
    </div>
  );
}
