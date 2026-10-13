import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  ADULT_ACLS_SCENARIOS,
  canEndAdultAclsSimulation,
  type AdultAclsCommand,
  type AdultAclsScenarioId,
  type AdultAclsState,
} from "@shared/adult-acls-simulation-world";
import { decideAdultAclsResume } from "@shared/adult-acls-session-policy";
import type { SimulationWorldRole } from "@shared/simulation-world";

type CompletionSummary = {
  phase: string;
  roscObserved: boolean;
  durationSeconds: number;
  criticalFailures: number;
  evidenceStatus: string;
};

type Props = {
  enrollmentId: number;
  onComplete: () => void;
  onExit?: () => void;
  initialScenarioId?: AdultAclsScenarioId;
};

const COMMANDS: readonly { label: string; command: AdultAclsCommand }[] = [
  { label: "Assess rhythm", command: { type: "assess", target: "rhythm" } },
  { label: "Assess pulse", command: { type: "assess", target: "pulse" } },
  { label: "Assess BP", command: { type: "assess", target: "blood_pressure" } },
  { label: "Assess breathing", command: { type: "assess", target: "breathing" } },
  { label: "Reassess", command: { type: "reassess" } },
  { label: "Start CPR", command: { type: "start_cpr" } },
  { label: "Give oxygen", command: { type: "give_oxygen" } },
  { label: "Assist ventilation", command: { type: "assist_ventilation" } },
  { label: "Defibrillate", command: { type: "defibrillate" } },
  { label: "Synchronized cardioversion", command: { type: "synchronized_cardioversion" } },
  { label: "Prepare synchronized cardioversion", command: { type: "prepare_synchronized_cardioversion" } },
  { label: "Pace", command: { type: "pace" } },
  { label: "Epinephrine", command: { type: "give_epinephrine" } },
  { label: "Antiarrhythmic", command: { type: "give_antiarrhythmic" } },
  { label: "Adenosine", command: { type: "give_adenosine" } },
  { label: "Atropine", command: { type: "give_atropine" } },
  { label: "Treat reversible cause", command: { type: "treat_reversible_cause" } },
];

const COMMAND_GROUPS: readonly { title: string; hint: string; commands: readonly string[] }[] = [
  { title: "Recognise", hint: "Gather only the findings needed for the next safe decision.", commands: ["Assess rhythm", "Assess pulse", "Assess BP", "Assess breathing"] },
  { title: "Immediate support", hint: "Support oxygenation, ventilation, or circulation when indicated.", commands: ["Start CPR", "Give oxygen", "Assist ventilation"] },
  { title: "Rhythm intervention", hint: "Use the rhythm and perfusion state to choose the correct electrical pathway.", commands: ["Defibrillate", "Synchronized cardioversion", "Prepare synchronized cardioversion", "Pace"] },
  { title: "Medication and cause", hint: "Medication and reversible-cause treatment must match the current state.", commands: ["Epinephrine", "Antiarrhythmic", "Adenosine", "Atropine", "Treat reversible cause"] },
];

function urgencyFor(state: AdultAclsState) {
  if (state.patient.phase === "cardiac_arrest") return { tone: "border-rose-300 bg-rose-50 text-rose-950", title: "Cardiac arrest: start CPR now", detail: "Use the rhythm to decide shockable versus non-shockable treatment, then reassess." };
  if (state.patient.phase === "post_rosc") return { tone: "border-amber-300 bg-amber-50 text-amber-950", title: "Post-ROSC: protect the patient", detail: "Support oxygenation and ventilation, reassess perfusion, and watch for re-arrest." };
  if (state.patient.phase === "unstable" || state.patient.phase === "peri_arrest") return { tone: "border-amber-300 bg-amber-50 text-amber-950", title: "Unstable patient: act now", detail: "Assessment helps, but do not let additional checking delay the indicated intervention." };
  return { tone: "border-emerald-300 bg-emerald-50 text-emerald-950", title: "Patient currently stable", detail: "Choose the next appropriate action, then reassess before saving the rehearsal." };
}

function directorFor(state: AdultAclsState) {
  if (state.patient.phase === "cardiac_arrest") return "Compressions are ongoing. The team is waiting for a rhythm-directed next action and reassessment.";
  if (state.patient.phase === "post_rosc") return "ROSC has been observed. The team is watching closely for re-arrest while you protect oxygenation and perfusion.";
  if (state.patient.phase === "unstable" || state.patient.phase === "peri_arrest") return "The patient is unstable. Your team needs a timely treatment decision, not an endless checklist.";
  return "The patient is currently stable. Choose the next appropriate action, then reassess the response.";
}

export function AdultAclsSimulationRoom({ enrollmentId, onComplete, onExit, initialScenarioId }: Props) {
  const [scenarioId, setScenarioId] = useState<AdultAclsScenarioId>(initialScenarioId ?? "unstable-bradycardia");
  const [session, setSession] = useState<{ id: number; nonce: string } | null>(null);
  const [state, setState] = useState<AdultAclsState | null>(null);
  const [completion, setCompletion] = useState<CompletionSummary | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [exitRequested, setExitRequested] = useState(false);
  const sequence = useRef(0);
  const start = trpc.practiceLab.startAdultAclsSession.useMutation();
  const activeSession = trpc.practiceLab.getActiveAdultAclsSession.useQuery({ enrollmentId }, { staleTime: 10_000, refetchOnMount: "always" });
  const invalidate = trpc.practiceLab.invalidateAdultAclsSession.useMutation();
  const receive = trpc.practiceLab.receiveAdultAclsCommand.useMutation();
  const complete = trpc.practiceLab.completeAdultAclsSession.useMutation();
  const scenario = useMemo(() => ADULT_ACLS_SCENARIOS.find((item) => item.id === scenarioId)!, [scenarioId]);
  const urgency = state ? urgencyFor(state) : null;
  const latestClinicalEvent = state ? [...state.events].reverse().find((event) => event.type !== "time_advanced") : null;
  const commandByLabel = useMemo(() => new Map(COMMANDS.map((item) => [item.label, item])), []);

  useEffect(() => {
    if (session || completion) return;
    const resumed = activeSession.data;
    const decision = decideAdultAclsResume({
      isFetching: activeSession.isFetching,
      activeScenarioId: resumed?.scenarioId ?? null,
      selectedScenarioId: scenarioId,
    });
    if (decision === "wait" || !resumed) return;
    if (decision === "start_selected") {
      setLaunchError(`An unfinished ${ADULT_ACLS_SCENARIOS.find((item) => item.id === resumed.scenarioId)?.title ?? "Adult ACLS"} rehearsal was found. Choose Enter adult ACLS room to start the selected ${scenario.title} scenario; the stale session will be closed safely.`);
      return;
    }
    setScenarioId(resumed.scenarioId as AdultAclsScenarioId);
    setSession({ id: resumed.sessionId, nonce: resumed.sessionNonce });
    setState(resumed.authoritativeState);
    sequence.current = resumed.nextSequence;
  }, [activeSession.data, completion, session]);

  const begin = async () => {
    setLaunchError(null);
    setActionError(null);
    setCompletion(null);
    setExitRequested(false);
    const selectedScenarioId = scenarioId;
    try {
      const result = await start.mutateAsync({ enrollmentId, scenarioId: selectedScenarioId, role: "team_leader" as SimulationWorldRole });
      const authoritativeState = result.authoritativeState as AdultAclsState;
      if (result.scenarioId !== selectedScenarioId || authoritativeState.scenarioId !== selectedScenarioId || result.scenarioId !== authoritativeState.scenarioId) {
        await invalidate.mutateAsync({ sessionId: result.sessionId, sessionNonce: result.sessionNonce }).catch(() => undefined);
        setLaunchError("The simulation could not start safely because the selected scenario did not match the authoritative session. No rehearsal evidence was created. Please retry.");
        return;
      }
      setSession({ id: result.sessionId, nonce: result.sessionNonce });
      setState(authoritativeState);
      sequence.current = 0;
    } catch (error) {
      setLaunchError(error instanceof Error ? error.message : "The simulation could not start. Please retry.");
    }
  };

  const act = async (command: AdultAclsCommand) => {
    if (!session) return undefined;
    setActionError(null);
    try {
      const result = await receive.mutateAsync({ sessionId: session.id, sessionNonce: session.nonce, sequence: sequence.current, commandJson: command });
      sequence.current += 1;
      const nextState = result.authoritativeState as AdultAclsState;
      setState(nextState);
      return nextState;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The server could not record that action. Check your connection and retry.");
      return undefined;
    }
  };

  const finish = async () => {
    if (!session) return;
    const nextState = await act({ type: "end_rehearsal" });
    if (!nextState || nextState.patient.phase !== "ended") return;
    try {
      const result = await complete.mutateAsync({ sessionId: session.id, sessionNonce: session.nonce });
      const evidence = result.evidence as CompletionSummary;
      setCompletion({
        phase: evidence.phase,
        roscObserved: evidence.roscObserved,
        durationSeconds: Math.round(evidence.durationSeconds),
        criticalFailures: evidence.criticalFailures,
        evidenceStatus: result.evidenceStatus,
      });
      setSession(null);
      onComplete();
      void activeSession.refetch();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The rehearsal reached a valid endpoint but could not be saved. Please retry while connected.");
    }
  };

  const abandon = async () => {
    if (session) await invalidate.mutateAsync({ sessionId: session.id, sessionNonce: session.nonce }).catch(() => undefined);
    setSession(null);
    setState(null);
    setExitRequested(false);
    setCompletion(null);
    void activeSession.refetch();
    onExit?.();
  };

  const actionButton = (label: string) => {
    const item = commandByLabel.get(label);
    if (!item) return null;
    return <Button key={label} variant="outline" size="sm" disabled={receive.isPending || complete.isPending} onClick={() => void act(item.command)}>{label}</Button>;
  };

  return <div className="space-y-4">
    <Card className="border-indigo-200 bg-indigo-50"><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle>Adult ACLS Simulation World</CardTitle><Badge variant="outline">Synthetic training simulation</Badge></div></CardHeader><CardContent className="space-y-3 text-sm text-indigo-950"><p>This is a deterministic adult resuscitation rehearsal. It does not represent a real patient, prove competence, or issue an ACLS credential.</p>{!session && <div className="flex flex-wrap gap-2"><select aria-label="Adult ACLS scenario" className="rounded-md border border-indigo-300 bg-white px-3 py-2" value={scenarioId} onChange={(event) => { setLaunchError(null); setScenarioId(event.target.value as AdultAclsScenarioId); }}><option value="" disabled>Select scenario</option>{ADULT_ACLS_SCENARIOS.map((item) => <option key={item.id} value={item.id}>{item.title} — {item.subtitle}</option>)}</select><Button onClick={() => void begin()} disabled={start.isPending || invalidate.isPending}>{completion ? "Repeat this scenario" : "Enter adult ACLS room"}</Button></div>}{!session && <p className="text-xs text-indigo-800"><strong>Learning focus:</strong> {scenario.subtitle} This practice is formative and does not unlock Phase 2, issue a credential, or replace instructor assessment.</p>}{launchError && <div role="alert" className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm font-medium text-rose-900">{launchError}</div>}</CardContent></Card>

    {completion && !session && <Card className="border-emerald-300 bg-emerald-50"><CardHeader><CardTitle className="flex items-center gap-2 text-emerald-950"><CheckCircle2 className="h-5 w-5" />Rehearsal saved for review</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-emerald-950"><p>This records simulation performance only. It does not issue an ACLS credential or automatically complete a course phase.</p><div className="grid gap-2 sm:grid-cols-4"><div><span className="block text-xs uppercase text-emerald-800">Endpoint</span><strong>{completion.roscObserved ? "Post-ROSC" : "Stable"}</strong></div><div><span className="block text-xs uppercase text-emerald-800">Duration</span><strong>{completion.durationSeconds}s</strong></div><div><span className="block text-xs uppercase text-emerald-800">Critical failures</span><strong>{completion.criticalFailures}</strong></div><div><span className="block text-xs uppercase text-emerald-800">Evidence</span><strong>{completion.evidenceStatus === "review_required" ? "Review required" : completion.evidenceStatus}</strong></div></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void begin()}><RotateCcw className="mr-2 h-4 w-4" />Repeat scenario</Button><Button variant="secondary" onClick={() => onExit?.()}>Return to mission map</Button></div></CardContent></Card>}

    {!session && !completion && activeSession.data && <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><strong>Rehearsal in progress:</strong> We found an active Adult ACLS session and will restore it automatically. Your recorded actions are still server-authoritative.</div>}

    {state && session && <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <Card><CardHeader><CardTitle className="text-base">Observable patient findings</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-2 text-sm"><div>Rhythm<strong className="block">{state.patient.rhythm}</strong></div><div>Pulse<strong className="block">{state.patient.pulse}</strong></div><div>BP<strong className="block">{state.patient.systolicBp}/{state.patient.diastolicBp}</strong></div><div>SpO₂<strong className="block">{state.patient.spo2}%</strong></div><div>Breathing<strong className="block">{state.patient.breathing}</strong></div><div>Mental status<strong className="block">{state.patient.mentalStatus}</strong></div><div>Phase<strong className="block">{state.patient.phase}</strong></div><div>Time<strong className="block">{state.elapsedSeconds}s</strong></div></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Choose an action, then reassess</CardTitle></CardHeader><CardContent className="space-y-3"><div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-950" aria-live="polite"><p className="font-semibold">Mission Director</p><p className="mt-1 text-xs">{directorFor(state)}</p></div>{urgency && <div className={`rounded-lg border p-3 ${urgency.tone}`} role="status"><div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-semibold">{urgency.title}</p><p className="text-xs">{urgency.detail}</p></div></div></div>}{actionError && <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-950"><XCircle className="mr-2 inline h-4 w-4" />{actionError}</div>}{latestClinicalEvent && <div aria-live="polite" className={`rounded-lg border p-3 text-sm ${latestClinicalEvent.correct === false ? "border-rose-200 bg-rose-50 text-rose-950" : "border-cyan-200 bg-cyan-50 text-cyan-950"}`}><p className="font-semibold">{latestClinicalEvent.correct === false ? "Review this action" : "Latest patient response"}</p><p>{latestClinicalEvent.description}</p>{latestClinicalEvent.consequence && <p className="mt-1 text-xs">{latestClinicalEvent.consequence}</p>}</div>}{COMMAND_GROUPS.map((group) => <section key={group.title} aria-labelledby={`adult-acls-${group.title}`}><h3 id={`adult-acls-${group.title}`} className="text-xs font-bold uppercase tracking-wide text-slate-600">{group.title}</h3><p className="mb-2 text-xs text-slate-500">{group.hint}</p><div className="flex flex-wrap gap-2">{group.commands.map(actionButton)}</div></section>)}<div className="flex flex-wrap items-center gap-3 border-t pt-3"><Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => void finish()} disabled={complete.isPending || receive.isPending || !canEndAdultAclsSimulation(state)}>End and save rehearsal</Button>{!canEndAdultAclsSimulation(state) && <span className="text-xs text-slate-600">Reach a stable or post-ROSC endpoint, then reassess before saving.</span>}{onExit && <Button variant="ghost" onClick={() => setExitRequested(true)} disabled={receive.isPending || complete.isPending}>Exit without saving</Button>}</div>{exitRequested && <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert"><p className="font-semibold">Leave this rehearsal?</p><p className="mt-1">The active session will be marked abandoned. No simulation evidence will be created.</p><div className="mt-2 flex flex-wrap gap-2"><Button size="sm" variant="destructive" onClick={() => void abandon()}>Exit and abandon</Button><Button size="sm" variant="outline" onClick={() => setExitRequested(false)}>Continue rehearsal</Button></div></div>}</CardContent></Card>
      <Card className="lg:col-span-2"><CardHeader><CardTitle>Server event timeline</CardTitle><p className="text-xs text-muted-foreground">This is the authoritative replay record. It is not a credential or competence decision.</p></CardHeader><CardContent className="max-h-64 space-y-2 overflow-y-auto text-sm" aria-label="Server event timeline">{state.events.slice(-12).map((event, index) => <div key={`${event.timestamp}-${index}`} className={event.correct === false ? "rounded border border-rose-200 bg-rose-50 p-2" : "rounded border bg-slate-50 p-2"}><span className="mr-2 text-xs text-slate-500">{event.timestamp}s</span>{event.description}{event.consequence ? <span className="block text-xs text-slate-600">{event.consequence}</span> : null}</div>)}</CardContent></Card>
    </div>}
  </div>;
}
