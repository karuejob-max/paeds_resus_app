import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Flag, HeartPulse, RotateCcw, ShieldCheck, Target } from "lucide-react";
import { getMissionJourneyStep, getSimulationPracticeRank } from "@shared/simulation-hub-mastery";

type Props = {
  pathway: string;
  missionTitle: string;
  objective: string;
  stage: "map" | "briefing" | "playing";
  practicePoints: number;
  onExit?: () => void;
};

const STEPS = ["Choose", "Brief", "Act + reassess", "Reflect"] as const;

export function SimulationMissionHud({ pathway, missionTitle, objective, stage, practicePoints, onExit }: Props) {
  const journey = getMissionJourneyStep(stage);
  const rank = getSimulationPracticeRank(practicePoints);
  return (
    <Card className="border-cyan-400/30 bg-slate-900 text-slate-100">
      <CardContent className="space-y-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-lg bg-cyan-400/15 p-2 text-cyan-200"><HeartPulse className="h-5 w-5" /></div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><Badge className="bg-cyan-400/15 text-cyan-200">{pathway.toUpperCase()} mission</Badge><span className="text-xs text-slate-400">Step {journey.index}/4 · {journey.label}</span></div>
              <p className="mt-1 truncate font-semibold">{missionTitle}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{objective}</p>
            </div>
          </div>
          {stage === "playing" && onExit ? <Button size="sm" variant="outline" className="min-h-10 shrink-0 border-slate-600 text-slate-200" onClick={onExit}><RotateCcw className="mr-2 h-4 w-4" />Exit safely</Button> : null}
        </div>
        <div className="grid grid-cols-4 gap-1.5" aria-label="Simulation journey progress">
          {STEPS.map((step, index) => <div key={step} className={`rounded-md px-2 py-1.5 text-center text-[10px] font-semibold leading-4 sm:text-xs ${index < journey.index ? "bg-cyan-400 text-slate-950" : index === journey.index - 1 ? "bg-cyan-400/25 text-cyan-100 ring-1 ring-cyan-300/50" : "bg-slate-800 text-slate-500"}`}>{index < journey.index - 1 ? <CheckCircle2 className="mx-auto h-3.5 w-3.5" /> : step}</div>)}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-emerald-200"><ShieldCheck className="h-3.5 w-3.5" />Safe to fail: mistakes become coaching</span>
          <span className="inline-flex items-center gap-1.5 text-amber-200"><Target className="h-3.5 w-3.5" />{rank.title} · {practicePoints} practice points</span>
        </div>
        <p className="text-[11px] leading-4 text-slate-500">Practice points show persistence in this course only. They are not a public ranking, credential, pass decision, or Phase 2/3 completion.</p>
      </CardContent>
    </Card>
  );
}
