import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { CheckCircle2, HeartPulse, RotateCcw, ShieldCheck, Target, Volume2, VolumeX } from "lucide-react";
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
  const [audioCues, setAudioCues] = useState(false);

  useEffect(() => {
    setAudioCues(window.localStorage.getItem("paeds-resus-simulation-audio") === "on");
  }, []);

  useEffect(() => {
    if (!audioCues || typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = stage === "playing" ? 660 : stage === "briefing" ? 520 : 390;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
    void oscillator.addEventListener("ended", () => void context.close());
  }, [audioCues, stage]);

  const toggleAudio = () => {
    setAudioCues((enabled) => {
      const next = !enabled;
      window.localStorage.setItem("paeds-resus-simulation-audio", next ? "on" : "off");
      return next;
    });
  };

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
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" className="min-h-10 border-slate-600 text-slate-200" onClick={toggleAudio} aria-pressed={audioCues} title={audioCues ? "Turn off optional simulation audio cues" : "Turn on optional simulation audio cues"}>
              {audioCues ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
              {audioCues ? "Audio on" : "Audio off"}
            </Button>
            {stage === "playing" && onExit ? <Button size="sm" variant="outline" className="min-h-10 border-slate-600 text-slate-200" onClick={onExit}><RotateCcw className="mr-2 h-4 w-4" />Exit safely</Button> : null}
          </div>
        </div>
        <div className="rounded-lg border border-cyan-400/20 bg-slate-950/60 p-2" aria-label="Simulation journey progress">
          <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200"><span>Now happening</span><span>{journey.label}</span></div>
          <div className="grid grid-cols-4 gap-1.5">
            {STEPS.map((step, index) => <div key={step} className={`rounded-md px-2 py-2 text-center text-[10px] font-semibold leading-4 transition sm:text-xs ${index < journey.index - 1 ? "bg-emerald-400 text-slate-950" : index === journey.index - 1 ? "bg-cyan-400 text-slate-950 ring-2 ring-cyan-200/70" : "bg-slate-800 text-slate-500"}`}>{index < journey.index - 1 ? <CheckCircle2 className="mx-auto h-3.5 w-3.5" /> : step}</div>)}
          </div>
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
