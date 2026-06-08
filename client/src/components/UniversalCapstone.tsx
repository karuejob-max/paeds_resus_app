import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { AlertCircle, CheckCircle2, GripVertical } from "lucide-react";
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
  const [feedback, setFeedback] = useState<string[]>([]);

  const currentPhase = phases[currentPhaseIndex];
  const scenario = (config.scenarios as any)[currentPhase];
  const availableInterventions = scenario.shuffledOrder.map((id: string) => ({
    ...scenario.interventions[id],
    id,
  }));

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
    if (!userOrder.includes(draggedId)) {
      const newOrder = [...userOrder];
      newOrder.splice(targetIndex, 0, draggedId);
      setUserOrder(newOrder);
    }
  };

  const handleSubmitPhase = () => {
    const result = (config.scorer as any)(currentPhase, userOrder);
    const updatedScores = { ...phaseScores, [currentPhase]: result.score };
    setPhaseScores(updatedScores);
    setFeedback(result.feedback);

    if (result.passed) {
      setTimeout(() => {
        if (currentPhaseIndex < phases.length - 1) {
          setCurrentPhaseIndex(currentPhaseIndex + 1);
          setUserOrder([]);
          setFeedback([]);
        } else {
          const totalScore = Math.round(
            Object.values(updatedScores).reduce((a, b) => a + b, 0) / phases.length
          );
          onComplete(totalScore, totalScore >= 50);
        }
      }, 2000);
    }
  };

  const progress = ((currentPhaseIndex + 1) / phases.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">{config.title}</h1>
          <p className="text-muted-foreground">Phase {currentPhaseIndex + 1} of {phases.length}</p>
          <div className="mt-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div className={`${config.theme} h-2 rounded-full transition-all duration-300`} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <Card className="mb-6 p-6">
          <h2 className="text-lg font-semibold mb-3">Clinical Scenario</h2>
          <p className="text-base leading-relaxed">{scenario.description}</p>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Available Interventions</h3>
            <div className="space-y-2">
              {availableInterventions
                .filter((i: any) => !userOrder.includes(i.id))
                .map((i: any) => (
                  <div key={i.id} draggable onDragStart={(e) => handleDragStart(e, i.id)}
                    className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-move hover:bg-slate-200 dark:hover:bg-slate-600 flex items-start gap-2">
                    <GripVertical className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{i.description}</p>
                      {i.critical && <p className="text-xs text-red-600 font-semibold mt-1">⚠️ Critical</p>}
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Your Order</h3>
            <div className="space-y-2 min-h-[200px] p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300"
              onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, userOrder.length)}>
              {userOrder.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Drag interventions here</p>
              ) : (
                userOrder.map((id, index) => {
                  const i = scenario.interventions[id];
                  return (
                    <div key={id} className={`p-3 ${config.theme} rounded-lg text-white flex items-start justify-between gap-2`}>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-lg min-w-[24px]">{index + 1}.</span>
                        <div>
                          <p className="font-medium">{i.description}</p>
                          {i.critical && <p className="text-xs text-white/80 mt-1">Critical intervention</p>}
                        </div>
                      </div>
                      <button onClick={() => setUserOrder(userOrder.filter(item => item !== id))} className="text-white hover:text-white/80">✕</button>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {feedback.length > 0 && (
          <Card className={`mb-6 p-4 border-l-4 ${phaseScores[currentPhase] >= 50 ? "bg-green-50 border-l-green-600" : "bg-red-50 border-l-red-600"}`}>
            <div className="flex gap-3">
              {phaseScores[currentPhase] >= 50 ? <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />}
              <div>
                <p className="font-semibold mb-2">Score: {phaseScores[currentPhase]}%</p>
                {feedback.map((msg, idx) => <p key={idx} className="text-sm">{msg}</p>)}
              </div>
            </div>
          </Card>
        )}

        <div className="flex gap-4 justify-end">
          {onClose && <Button variant="outline" onClick={onClose}>Close</Button>}
          <Button onClick={handleSubmitPhase} disabled={userOrder.length === 0} className={config.theme + " text-white"}>Submit Phase</Button>
        </div>
      </div>
    </div>
  );
}
