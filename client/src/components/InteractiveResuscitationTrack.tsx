import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleHelp, RotateCcw, Send, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  getInteractiveScenarioNode,
  startInteractiveScenario,
  submitInteractiveScenarioChoice,
  type InteractiveScenarioEvent,
  type InteractiveScenarioState,
} from "@shared/interactive-resuscitation-scenario";
import type { PracticeLabEvent, PracticeLabProgramType } from "@shared/practice-lab-types";

type Props = {
  programType: PracticeLabProgramType;
  enrollmentId: number;
  onExit?: () => void;
};

function toPracticeEvents(events: readonly InteractiveScenarioEvent[]): PracticeLabEvent[] {
  return events.map((event) => ({
    timestamp: event.timestamp,
    type: event.type,
    description: event.description,
    correct: event.correct,
  }));
}

export function InteractiveResuscitationTrack({ programType, enrollmentId, onExit }: Props) {
  const [state, setState] = useState<InteractiveScenarioState>(() => startInteractiveScenario());
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [lastFinding, setLastFinding] = useState<string | null>(null);
  const [wrongChoiceId, setWrongChoiceId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const recordAttempt = trpc.practiceLab.recordAttempt.useMutation();
  const node = useMemo(() => getInteractiveScenarioNode(state), [state]);

  const submit = async (choiceId: string) => {
    setLastFeedback(null);
    setLastFinding(null);
    setWrongChoiceId(null);
    try {
      const result = submitInteractiveScenarioChoice(state, choiceId);
      setState(result.state);
      setLastFeedback(result.feedback);
      setLastFinding(result.finding ?? null);
      if (!result.accepted) setWrongChoiceId(choiceId);
      if (result.completed && !saved) {
        setSaved(true);
        await recordAttempt.mutateAsync({
          enrollmentId,
          programType,
          trackId: "cardiac_arrest",
          scenarioId: "first-minutes-instructor-loop",
          score: 0,
          passed: false,
          eventLog: toPracticeEvents(result.state.events),
          durationSeconds: result.state.elapsedSeconds,
        });
      }
    } catch (error) {
      setLastFeedback(error instanceof Error ? error.message : "The scenario could not accept that response. Please retry.");
    }
  };

  const restart = () => {
    setState(startInteractiveScenario());
    setLastFeedback(null);
    setLastFinding(null);
    setWrongChoiceId(null);
    setSaved(false);
  };

  const recentEvents = state.events.filter((event) => event.type !== "scene").slice(-4);

  return (
    <div className="space-y-4">
      <Card className="border-cyan-200 bg-cyan-50">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-cyan-950">Instructor-led resuscitation loop</CardTitle>
            <Badge variant="outline">Iterative formative practice</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-cyan-950">
          <p>This is a one-to-one rehearsal. You choose what to assess or ask; the instructor provides only the finding you requested, then waits for your interpretation and action.</p>
          <div className="grid gap-2 sm:grid-cols-5 text-xs">
            {["Observe", "Ask / assess", "Receive finding", "Act", "Reassess"].map((label, index) => <div key={label} className={`rounded-md border p-2 ${index === 0 ? "border-cyan-400 bg-white" : "border-cyan-200 bg-cyan-100/60"}`}><strong>{index + 1}.</strong> {label}</div>)}
          </div>
          <p className="text-xs text-cyan-800"><strong>Governance:</strong> This rehearsal is training evidence only. It does not issue a credential, complete a course phase, or replace instructor assessment.</p>
        </CardContent>
      </Card>

      {!state.completed ? (
        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CircleHelp className="h-4 w-4 text-cyan-700" />Scene</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current phase</p><p className="mt-1 font-semibold text-slate-900">{node.phase}</p><p className="mt-3 text-slate-700">{node.prompt}</p></div>
              {lastFinding && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-950" role="status"><p className="font-semibold">Instructor finding</p><p className="mt-1">{lastFinding}</p></div>}
              <div className="flex items-center justify-between text-xs text-slate-500"><span>Scenario time: {state.elapsedSeconds}s</span><span>Step {state.events.filter((event) => event.type === "finding").length + 1}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">What do you do or ask next?</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-950"><p className="font-semibold">Instructor prompt</p><p className="mt-1">{node.instructorPrompt}</p></div>
              {lastFeedback && <div className={`rounded-lg border p-3 text-sm ${wrongChoiceId ? "border-amber-300 bg-amber-50 text-amber-950" : "border-cyan-200 bg-cyan-50 text-cyan-950"}`} role="status"><p className="font-semibold">{wrongChoiceId ? "Pause and reconsider" : "The instructor responds"}</p><p className="mt-1">{lastFeedback}</p></div>}
              <div className="grid gap-2">
                {node.choices.map((choice) => <Button key={choice.id} variant={choice.id === wrongChoiceId ? "destructive" : "outline"} className="h-auto justify-start whitespace-normal p-3 text-left" onClick={() => void submit(choice.id)} disabled={recordAttempt.isPending}><span className="mr-2 mt-0.5 shrink-0"><Send className="h-4 w-4" /></span><span><strong className="block text-xs uppercase tracking-wide text-slate-500">{choice.kind}</strong>{choice.label}</span></Button>)}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-emerald-300 bg-emerald-50">
          <CardHeader><CardTitle className="flex items-center gap-2 text-emerald-950"><CheckCircle2 className="h-5 w-5" />Assessment loop completed</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-emerald-950">
            <p>{lastFeedback ?? "The first assessment loop is complete."}</p>
            <p><strong>Next clinical focus:</strong> Continue with pulse and circulation assessment, CPR decision-making, and rhythm/AED management with the response team.</p>
            <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={restart}><RotateCcw className="mr-2 h-4 w-4" />Repeat loop</Button><Button variant="secondary" onClick={() => onExit?.()}>Return to mission map</Button></div>
          </CardContent>
        </Card>
      )}

      {recentEvents.length > 0 && <Card><CardHeader><CardTitle className="text-base">Live rehearsal record</CardTitle></CardHeader><CardContent className="space-y-2">{recentEvents.map((event, index) => <div key={`${event.timestamp}-${index}`} className="flex gap-3 rounded-md border border-slate-200 p-2 text-xs"><span className="min-w-10 text-slate-500">{event.timestamp}s</span><span className={event.correct === false ? "text-amber-800" : "text-slate-700"}>{event.description}</span></div>)}</CardContent></Card>}

      {lastFeedback && wrongChoiceId && <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />A wrong choice does not end the scenario. The instructor pauses the scene, gives coaching, and lets you choose again.</div>}
      {saved && <div className="flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-950"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />The formative rehearsal record has been saved. No credential or course-phase completion was created.</div>}
      {recordAttempt.error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-950"><XCircle className="mt-0.5 h-4 w-4 shrink-0" />The rehearsal ended locally, but its formative record could not be saved. No credential was issued.</div>}
    </div>
  );
}
