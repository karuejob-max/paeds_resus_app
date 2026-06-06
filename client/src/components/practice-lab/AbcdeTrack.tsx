import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Play, AlertTriangle } from "lucide-react";
import {
  ABCDE_SCENARIOS,
  filterAbcdeForProgram,
  scoreAbcdeAttempt,
  type AbcdeAction,
} from "@/lib/practiceLab/scenarios/abcdeScenarios";
import { PracticeLabDebrief } from "./PracticeLabDebrief";
import type { PracticeLabProgramType } from "@shared/practice-lab-types";
import { trpc } from "@/lib/trpc";

type Props = {
  programType: PracticeLabProgramType;
  enrollmentId: number;
  onBookSession: () => void;
  initialScenarioId?: string;
};

type Phase = "list" | "active" | "debrief" | "arrest" | "post_rosc";

export function AbcdeTrack({ programType, enrollmentId, onBookSession, initialScenarioId }: Props) {
  const scenarios = useMemo(() => filterAbcdeForProgram(ABCDE_SCENARIOS, programType), [programType]);
  const [phase, setPhase] = useState<Phase>(initialScenarioId ? "active" : "list");
  const [activeScenario, setActiveScenario] = useState(
    () => scenarios.find((s) => s.id === initialScenarioId) ?? null
  );
  const [startTime, setStartTime] = useState(Date.now());
  const [result, setResult] = useState<ReturnType<typeof scoreAbcdeAttempt> | null>(null);

  const recordAttempt = trpc.practiceLab.recordAttempt.useMutation();

  const startScenario = (id: string) => {
    const s = scenarios.find((sc) => sc.id === id);
    if (!s) return;
    setActiveScenario(s);
    setStartTime(Date.now());
    setPhase("active");
    setResult(null);
  };

  const handleAction = (action: AbcdeAction) => {
    if (!activeScenario) return;
    const res = scoreAbcdeAttempt(activeScenario, action, startTime);
    setResult(res);
    if (res.progressedToArrest) {
      setPhase("arrest");
    } else if (res.achievedRosc) {
      setPhase("post_rosc");
    } else {
      setPhase("debrief");
      void saveAttempt(res);
    }
  };

  const saveAttempt = (res: ReturnType<typeof scoreAbcdeAttempt>) => {
    if (!activeScenario) return;
    void recordAttempt.mutateAsync({
      enrollmentId,
      programType,
      trackId: "abcde",
      scenarioId: activeScenario.id,
      score: res.score,
      passed: res.passed,
      eventLog: res.events,
      durationSeconds: Math.floor((Date.now() - startTime) / 1000),
    });
  };

  const finishDebrief = () => {
    if (result) saveAttempt(result);
    setPhase("debrief");
  };

  if (phase === "debrief" && activeScenario && result) {
    return (
      <PracticeLabDebrief
        trackName="ABCDE Unstable Patient"
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

  if (phase === "arrest" && activeScenario) {
    return (
      <Card className="border-red-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Cardiac Arrest — Deterioration
          </CardTitle>
          <CardDescription>
            Patient arrested due to delayed intervention. Transition to cardiac arrest algorithm.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Start high-quality CPR. Attach defibrillator. Follow PALS/ACLS circular algorithm. Consider switching
            to the <strong>Cardiac Arrest</strong> track for full CPR simulation.
          </p>
          <Button
            onClick={() => {
              const arrestResult = {
                ...result!,
                score: 20,
                passed: false,
                events: [
                  ...(result?.events ?? []),
                  {
                    timestamp: Math.floor((Date.now() - startTime) / 1000),
                    type: "arrest",
                    description: "Proceeded to cardiac arrest management checklist.",
                    correct: false,
                  },
                ],
              };
              setResult(arrestResult);
              finishDebrief();
            }}
          >
            Complete debrief
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === "post_rosc" && activeScenario) {
    return (
      <Card className="border-emerald-300">
        <CardHeader>
          <CardTitle className="text-emerald-700">ROSC — Post-Arrest Care</CardTitle>
          <CardDescription>Return to ABCDE and post-arrest checklist (AHA 2025)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Airway: secure, confirm ETCO2 if available</li>
            <li>Breathing: avoid hyperoxia — titrate SpO2 94-99%</li>
            <li>Circulation: BP targets, 12-lead ECG, treat cause</li>
            <li>Disability: neuro check, glucose, temperature</li>
            <li>Exposure: identify and treat underlying cause</li>
          </ul>
          <Button onClick={finishDebrief}>Complete debrief</Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === "active" && activeScenario) {
    const step = activeScenario.steps[0];
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {activeScenario.name}
          </CardTitle>
          <CardDescription>{activeScenario.presentation}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>HR {activeScenario.vitals.hr}</Badge>
            <Badge variant="outline">BP {activeScenario.vitals.bp}</Badge>
            <Badge variant="outline">SpO2 {activeScenario.vitals.spo2}%</Badge>
            <Badge variant="secondary">{activeScenario.vitals.rhythm}</Badge>
          </div>
          <p className="font-medium text-sm">{step.prompt}</p>
          <div className="grid gap-2">
            {step.options.map((opt) => (
              <Button key={opt.action} variant="outline" className="justify-start" onClick={() => handleAction(opt.action)}>
                {opt.label}
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
        Unstable bradycardia and tachycardia → arrest if missed → ROSC post-arrest checklist.
      </p>
      {scenarios.map((s) => (
        <Card key={s.id} className="cursor-pointer hover:border-primary/50" onClick={() => startScenario(s.id)}>
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{s.name}</p>
              <Badge variant="outline" className="mt-1 text-xs">
                {s.category.replace(/_/g, " ")}
              </Badge>
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
