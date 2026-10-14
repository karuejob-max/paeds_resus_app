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
  onExit?: () => void;
  initialScenarioId?: string;
};

type Phase = "sim" | "debrief";

export function CardiacArrestTrack({ programType, enrollmentId, onBookSession, onExit, initialScenarioId }: Props) {
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
    state: SimulationState,
    cprEvents?: readonly { timestamp: number; action: string; details?: string }[],
  ) => {
    const practiceEvents: PracticeLabEvent[] = cprEvents?.length
      ? cprEvents.map((event) => ({
          timestamp: event.timestamp,
          type: "cpr_gps_action",
          description: event.details ? `${event.action}: ${event.details}` : event.action,
        }))
      : state.events.map((e) => ({
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
    return recordAttempt.mutateAsync({
      enrollmentId,
      programType,
      trackId: "cardiac_arrest",
      scenarioId: scenario.id,
      score: metrics.overallScore,
      passed: metrics.overallScore >= 70,
      eventLog: practiceEvents,
    }).then(() => {
      setPhase("debrief");
    });
  };

  if (phase === "debrief" && debrief) {
    return (
      <PracticeLabDebrief
        trackName="Cardiac Arrest"
        scenarioName={debrief.scenarioName}
        score={debrief.score}
        passed={debrief.passed}
        isFormative
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
          onExit?.();
        }}
        onBookSession={onBookSession}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-950">
        <p className="font-semibold">{programType.toUpperCase()} CPR-GPS simulation</p>
        <p className="mt-1 text-xs">This is formative coaching. When the selected course requires an arrest sequence, the saved event log is also scored as Phase 2 evidence; it never issues a credential.</p>
      </div>
      <CPRSimulation
        key={simKey}
        embedded
        initialScenarioId={initialScenarioId}
        scenariosFilter={scenariosFilter}
        pathwayLabel={programType === "heartsaver" ? "Heartsaver" : programType.toUpperCase()}
        onClose={() => onExit?.()}
        onAttemptComplete={handleComplete}
      />
    </div>
  );
}
