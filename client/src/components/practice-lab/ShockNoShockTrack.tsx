import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Play } from "lucide-react";
import { ECGVisuals } from "@/components/ECGVisuals";
import {
  SHOCK_NO_SHOCK_SCENARIOS,
  filterScenariosForProgram,
  scoreShockNoShockAttempt,
  shockRhythmToEcgKey,
  type ShockAction,
} from "@/lib/practiceLab/scenarios/shockNoShock";
import { PracticeLabDebrief } from "./PracticeLabDebrief";
import type { PracticeLabProgramType } from "@shared/practice-lab-types";
import { trpc } from "@/lib/trpc";

type Props = {
  programType: PracticeLabProgramType;
  enrollmentId: number;
  onBookSession: () => void;
  initialScenarioId?: string;
};

type Phase = "list" | "active" | "debrief";

export function ShockNoShockTrack({ programType, enrollmentId, onBookSession, initialScenarioId }: Props) {
  const scenarios = useMemo(
    () => filterScenariosForProgram(SHOCK_NO_SHOCK_SCENARIOS, programType),
    [programType]
  );
  const [phase, setPhase] = useState<Phase>(initialScenarioId ? "active" : "list");
  const [activeScenario, setActiveScenario] = useState(
    () => scenarios.find((s) => s.id === initialScenarioId) ?? null
  );
  const [startTime, setStartTime] = useState(Date.now());
  const [result, setResult] = useState<ReturnType<typeof scoreShockNoShockAttempt> | null>(null);

  const recordAttempt = trpc.practiceLab.recordAttempt.useMutation();

  const startScenario = (id: string) => {
    const s = scenarios.find((sc) => sc.id === id);
    if (!s) return;
    setActiveScenario(s);
    setStartTime(Date.now());
    setPhase("active");
    setResult(null);
  };

  const handleAction = (action: ShockAction) => {
    if (!activeScenario) return;
    const res = scoreShockNoShockAttempt(activeScenario, action, startTime);
    setResult(res);
    setPhase("debrief");
    void recordAttempt.mutateAsync({
      enrollmentId,
      programType,
      trackId: "shock_no_shock",
      scenarioId: activeScenario.id,
      score: res.score,
      passed: res.passed,
      eventLog: res.events,
      durationSeconds: Math.floor((Date.now() - startTime) / 1000),
    });
  };

  if (phase === "debrief" && activeScenario && result) {
    return (
      <PracticeLabDebrief
        trackName="Shock / No Shock"
        scenarioName={activeScenario.name}
        score={result.score}
        passed={result.passed}
        events={result.events}
        onRetry={() => startScenario(activeScenario.id)}
        onBack={() => setPhase("list")}
        onBookSession={onBookSession}
      />
    );
  }

  if (phase === "active" && activeScenario) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {activeScenario.name}
          </CardTitle>
          <CardDescription>{activeScenario.context}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>{activeScenario.rhythmLabel}</Badge>
            <Badge variant="outline">{activeScenario.patientAge}</Badge>
            <Badge variant="outline">{activeScenario.patientWeight} kg</Badge>
          </div>
          <ECGVisuals rhythm={shockRhythmToEcgKey(activeScenario.rhythm)} />
          {activeScenario.shockEnergyJoules && (
            <p className="text-sm text-muted-foreground">
              Suggested energy (if shocking): {activeScenario.shockEnergyJoules} J
            </p>
          )}
          <p className="text-sm font-medium">What is your immediate action?</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(
              [
                ["shock", "Defibrillate (unsynchronized)"],
                ["cardiovert", "Synchronized cardioversion"],
                ["cpr", "Start CPR"],
                ["treat", "Medical treatment"],
                ["observe", "Observe / monitor"],
              ] as const
            ).map(([action, label]) => (
              <Button key={action} variant="outline" onClick={() => handleAction(action)}>
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Rhythm strip + clinical context. Choose shock, cardiovert, treat, observe, or CPR per AHA 2025.
      </p>
      {scenarios.map((s) => (
        <Card key={s.id} className="cursor-pointer hover:border-primary/50" onClick={() => startScenario(s.id)}>
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.learningObjective}</p>
            </div>
            <Button size="sm" className="gap-1">
              <Play className="h-4 w-4" />
              Start
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
