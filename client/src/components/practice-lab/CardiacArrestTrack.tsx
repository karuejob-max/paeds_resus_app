import { useState } from "react";
import { CPRSimulation } from "@/components/CPRSimulation";
import { PracticeLabDebrief } from "./PracticeLabDebrief";
import { buildCardiacArrestDebrief } from "@/lib/practiceLab/debrief";
import type { PracticeLabProgramType, PracticeLabEvent } from "@shared/practice-lab-types";
import type { PerformanceMetrics, SimulationScenario, SimulationState } from "@/lib/simulationEngine";
import { trpc } from "@/lib/trpc";

type Props = {
  programType: PracticeLabProgramType;
  enrollmentId: number;
  onBookSession: () => void;
  initialScenarioId?: string;
};

type Phase = "sim" | "debrief";

export function CardiacArrestTrack({ programType, enrollmentId, onBookSession, initialScenarioId }: Props) {
  const [phase, setPhase] = useState<Phase>("sim");
  const [debrief, setDebrief] = useState<{
    scenarioName: string;
    score: number;
    passed: boolean;
    events: PracticeLabEvent[];
    lines: string[];
  } | null>(null);
  const [simKey, setSimKey] = useState(0);

  const recordAttempt = trpc.practiceLab.recordAttempt.useMutation();

  const scenariosFilter = (scenarios: SimulationScenario[]) =>
    programType === "acls" ? scenarios.filter((s) => s.weight >= 20) : scenarios;

  const handleComplete = (
    metrics: PerformanceMetrics,
    scenario: SimulationScenario,
    state: SimulationState
  ) => {
    const practiceEvents: PracticeLabEvent[] = state.events.map((e) => ({
      timestamp: e.timestamp,
      type: e.type,
      description: e.description,
      correct: e.correct,
    }));
    setDebrief({
      scenarioName: scenario.name,
      score: metrics.overallScore,
      passed: metrics.overallScore >= 70,
      events: practiceEvents,
      lines: buildCardiacArrestDebrief(metrics, scenario.name, practiceEvents),
    });
    setPhase("debrief");
    void recordAttempt.mutateAsync({
      enrollmentId,
      programType,
      trackId: "cardiac_arrest",
      scenarioId: scenario.id,
      score: metrics.overallScore,
      passed: metrics.overallScore >= 70,
      eventLog: practiceEvents,
    });
  };

  if (phase === "debrief" && debrief) {
    return (
      <PracticeLabDebrief
        trackName="Cardiac Arrest"
        scenarioName={debrief.scenarioName}
        score={debrief.score}
        passed={debrief.passed}
        events={debrief.events}
        onRetry={() => {
          setDebrief(null);
          setSimKey((k) => k + 1);
          setPhase("sim");
        }}
        onBack={() => {
          setDebrief(null);
          setSimKey((k) => k + 1);
          setPhase("sim");
        }}
        onBookSession={onBookSession}
      />
    );
  }

  return (
    <CPRSimulation
      key={simKey}
      embedded
      initialScenarioId={initialScenarioId}
      scenariosFilter={scenariosFilter}
      onClose={() => {}}
      onAttemptComplete={handleComplete}
    />
  );
}
