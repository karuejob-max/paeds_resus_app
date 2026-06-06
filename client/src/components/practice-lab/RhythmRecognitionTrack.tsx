import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Play } from "lucide-react";
import { ECGVisuals } from "@/components/ECGVisuals";
import {
  RHYTHM_STRIPS,
  RHYTHM_NAME_OPTIONS,
  FIRST_ACTION_OPTIONS,
  scoreRhythmIdentify,
  scoreRhythmIdentifyAndAction,
} from "@/lib/practiceLab/scenarios/rhythmStrips";
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
type Mode = "identify" | "identify_action";

const ECG_RHYTHM_KEY: Record<string, string> = {
  vf: "vfib",
  pulseless_vt: "vtach",
  vt_with_pulse: "vtach",
  svt: "svt",
  sinus_tachycardia: "sinus_tach",
  sinus_bradycardia: "sinus_brady",
  pea: "pea",
  asystole: "asystole",
  atrial_flutter: "svt",
  junctional_brady: "sinus_brady",
  torsades: "vtach",
};

function ecgKey(stripId: string): string {
  return ECG_RHYTHM_KEY[stripId] ?? "normal_sinus";
}

export function RhythmRecognitionTrack({ programType, enrollmentId, onBookSession, initialScenarioId }: Props) {
  const [mode, setMode] = useState<Mode>("identify");
  const [phase, setPhase] = useState<Phase>(initialScenarioId ? "active" : "list");
  const [activeId, setActiveId] = useState(initialScenarioId ?? "");
  const [startTime, setStartTime] = useState(Date.now());
  const [selectedRhythm, setSelectedRhythm] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [result, setResult] = useState<ReturnType<typeof scoreRhythmIdentify> | null>(null);

  const recordAttempt = trpc.practiceLab.recordAttempt.useMutation();
  const activeStrip = RHYTHM_STRIPS.find((s) => s.id === activeId);

  const startStrip = (id: string) => {
    setActiveId(id);
    setStartTime(Date.now());
    setSelectedRhythm("");
    setSelectedAction("");
    setResult(null);
    setPhase("active");
  };

  const submitIdentify = () => {
    if (!activeStrip || !selectedRhythm) return;
    const res = scoreRhythmIdentify(activeStrip, selectedRhythm, startTime);
    setResult(res);
    setPhase("debrief");
    void recordAttempt.mutateAsync({
      enrollmentId,
      programType,
      trackId: "rhythm_recognition",
      scenarioId: `${activeStrip.id}_${mode}`,
      score: res.score,
      passed: res.passed,
      eventLog: res.events,
      durationSeconds: Math.floor((Date.now() - startTime) / 1000),
    });
  };

  const submitIdentifyAction = () => {
    if (!activeStrip || !selectedRhythm || !selectedAction) return;
    const res = scoreRhythmIdentifyAndAction(activeStrip, selectedRhythm, selectedAction, startTime);
    setResult(res);
    setPhase("debrief");
    void recordAttempt.mutateAsync({
      enrollmentId,
      programType,
      trackId: "rhythm_recognition",
      scenarioId: `${activeStrip.id}_${mode}`,
      score: res.score,
      passed: res.passed,
      eventLog: res.events,
      durationSeconds: Math.floor((Date.now() - startTime) / 1000),
    });
  };

  if (phase === "debrief" && activeStrip && result) {
    return (
      <PracticeLabDebrief
        trackName={`Rhythm Recognition (${mode === "identify" ? "Mode A" : "Mode B"})`}
        scenarioName={activeStrip.name}
        score={result.score}
        passed={result.passed}
        events={result.events}
        onRetry={() => startStrip(activeStrip.id)}
        onBack={() => setPhase("list")}
        onBookSession={onBookSession}
      />
    );
  }

  if (phase === "active" && activeStrip) {
    const actionOptions = FIRST_ACTION_OPTIONS.filter((a) =>
      activeStrip.correctFirstAction ? a === activeStrip.correctFirstAction || mode === "identify_action" : true
    );

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Identify the rhythm
          </CardTitle>
          <CardDescription>{activeStrip.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ECGVisuals rhythm={ecgKey(activeStrip.id)} size="large" />
          <ul className="text-xs text-muted-foreground list-disc list-inside">
            {activeStrip.ecgFeatures.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <div>
            <p className="text-sm font-medium mb-2">Rhythm diagnosis</p>
            <div className="grid gap-1 max-h-48 overflow-y-auto">
              {RHYTHM_NAME_OPTIONS.map((name) => (
                <Button
                  key={name}
                  variant={selectedRhythm === name ? "default" : "outline"}
                  size="sm"
                  className="justify-start"
                  onClick={() => setSelectedRhythm(name)}
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>
          {mode === "identify_action" && (
            <div>
              <p className="text-sm font-medium mb-2">First action</p>
              <div className="grid gap-1 max-h-48 overflow-y-auto">
                {actionOptions.map((action) => (
                  <Button
                    key={action}
                    variant={selectedAction === action ? "default" : "outline"}
                    size="sm"
                    className="justify-start text-left h-auto py-2"
                    onClick={() => setSelectedAction(action)}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <Button
            className="w-full"
            disabled={!selectedRhythm || (mode === "identify_action" && !selectedAction)}
            onClick={mode === "identify" ? submitIdentify : submitIdentifyAction}
          >
            Submit
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <TabsList>
          <TabsTrigger value="identify">Mode A — Identify only</TabsTrigger>
          <TabsTrigger value="identify_action">Mode B — Identify + first action</TabsTrigger>
        </TabsList>
        <TabsContent value={mode} className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            {mode === "identify"
              ? "Name the rhythm from the strip and ECG features."
              : "Name the rhythm and select the appropriate first action per AHA 2025."}
          </p>
          {RHYTHM_STRIPS.map((s) => (
            <Card key={s.id} className="cursor-pointer hover:border-primary/50" onClick={() => startStrip(s.id)}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {s.category}
                  </Badge>
                </div>
                <Button size="sm" className="gap-1">
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
