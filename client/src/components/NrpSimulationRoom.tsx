import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { canEndNrpSimulation, NRP_SCENARIOS, type NrpCommand, type NrpScenarioId, type NrpState } from "@shared/nrp-simulation-world";
import type { SimulationWorldRole } from "@shared/simulation-world";

type Props = { enrollmentId: number; onComplete: () => void; onExit?: () => void };

type Summary = { durationSeconds: number; score: number; criticalFailures: number; evidenceStatus: string };

const COMMANDS: readonly { label: string; command: NrpCommand }[] = [
  { label: "Assess newborn", command: { type: "assess_newborn" } },
  { label: "Warm, dry, stimulate", command: { type: "warm_dry_stimulate" } },
  { label: "Position airway", command: { type: "position_airway" } },
  { label: "Start PPV", command: { type: "start_ppv" } },
  { label: "Corrective ventilation step", command: { type: "corrective_ventilation_step" } },
  { label: "Advanced airway", command: { type: "advanced_airway" } },
  { label: "Start compressions", command: { type: "start_compressions" } },
  { label: "Reassess heart rate", command: { type: "reassess_heart_rate" } },
  { label: "Continue support", command: { type: "continue_support" } },
];

const GROUPS = [
  { title: "Recognise", hint: "Identify the newborn who needs help before choosing an intervention.", labels: ["Assess newborn"] },
  { title: "Initial steps", hint: "Support temperature, tone, and airway position.", labels: ["Warm, dry, stimulate", "Position airway"] },
  { title: "Ventilate", hint: "Effective ventilation is the priority when breathing is absent or inadequate.", labels: ["Start PPV", "Corrective ventilation step", "Advanced airway"] },
  { title: "Reassess and escalate", hint: "Use heart-rate response to decide whether support should continue or escalate.", labels: ["Reassess heart rate", "Start compressions", "Continue support"] },
];

function directorFor(state: NrpState) {
  if (state.patient.phase === "post_resuscitation") return "The newborn has responded. Protect temperature, breathing, and heart-rate stability while you prepare to finish.";
  if (state.patient.phase === "compressions") return "The team is coordinating compressions and ventilation. Reassess heart rate before escalating again.";
  return "The newborn needs effective ventilation. Your team is watching for the heart-rate response.";
}

export function NrpSimulationRoom({ enrollmentId, onComplete, onExit }: Props) {
  const [scenarioId, setScenarioId] = useState<NrpScenarioId>("newborn-not-breathing");
  const [session, setSession] = useState<{ id: number; nonce: string } | null>(null);
  const [state, setState] = useState<NrpState | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sequence = useRef(0);
  const start = trpc.practiceLab.startNrpSession.useMutation();
  const active = trpc.practiceLab.getActiveNrpSession.useQuery({ enrollmentId }, { staleTime: 10_000 });
  const receive = trpc.practiceLab.receiveNrpCommand.useMutation();
  const complete = trpc.practiceLab.completeNrpSession.useMutation();
  const invalidate = trpc.practiceLab.invalidateNrpSession.useMutation();
  const commandByLabel = useMemo(() => new Map(COMMANDS.map((item) => [item.label, item])), []);
  const latest = state ? [...state.events].reverse().find((item) => item.type !== "time_advanced") : null;

  useEffect(() => {
    if (session || summary || !active.data) return;
    setSession({ id: active.data.sessionId, nonce: active.data.sessionNonce });
    setState(active.data.authoritativeState);
    sequence.current = active.data.nextSequence;
    setScenarioId(active.data.scenarioId as NrpScenarioId);
  }, [active.data, session, summary]);

  const begin = async () => {
    setError(null); setSummary(null);
    try {
      const result = await start.mutateAsync({ enrollmentId, scenarioId, role: "team_leader" as SimulationWorldRole });
      if (result.scenarioId !== scenarioId || result.authoritativeState.scenarioId !== scenarioId) throw new Error("The selected NRP scenario did not match the authoritative session. No evidence was created.");
      setSession({ id: result.sessionId, nonce: result.sessionNonce }); setState(result.authoritativeState); sequence.current = 0;
    } catch (err) { setError(err instanceof Error ? err.message : "The NRP simulation could not start. Please retry."); }
  };

  const act = async (command: NrpCommand) => {
    if (!session) return null;
    setError(null);
    try {
      const result = await receive.mutateAsync({ sessionId: session.id, sessionNonce: session.nonce, sequence: sequence.current, commandJson: command });
      sequence.current += 1; setState(result.authoritativeState); return result.authoritativeState as NrpState;
    } catch (err) { setError(err instanceof Error ? err.message : "The server could not record that action. Check your connection and retry."); return null; }
  };

  const finish = async () => {
    const next = await act({ type: "end_rehearsal" });
    if (!next || next.patient.phase !== "ended" || !session) return;
    try {
      const result = await complete.mutateAsync({ sessionId: session.id, sessionNonce: session.nonce });
      const evidence = result.evidence as { durationSeconds: number; score: number; criticalFailures: number };
      setSummary({ durationSeconds: Math.round(evidence.durationSeconds), score: evidence.score, criticalFailures: evidence.criticalFailures, evidenceStatus: result.evidenceStatus });
      setSession(null); onComplete(); void active.refetch();
    } catch (err) { setError(err instanceof Error ? err.message : "The valid endpoint could not be saved. Please retry while connected."); }
  };

  const abandon = async () => {
    if (session) await invalidate.mutateAsync({ sessionId: session.id, sessionNonce: session.nonce }).catch(() => undefined);
    setSession(null); setState(null); setSummary(null); void active.refetch(); onExit?.();
  };

  return <div className="space-y-4">
    <Card className="border-cyan-200 bg-cyan-50"><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle>NRP newborn simulation</CardTitle><Badge variant="outline">Synthetic training simulation</Badge></div></CardHeader><CardContent className="space-y-3 text-sm text-cyan-950"><p>This is a deterministic neonatal resuscitation rehearsal. It does not represent a real newborn, prove competence, or issue an NRP credential. Follow local policy and instructor guidance for real care.</p>{!session && <div className="flex flex-wrap gap-2"><select aria-label="NRP scenario" className="rounded-md border border-cyan-300 bg-white px-3 py-2" value={scenarioId} onChange={(event) => setScenarioId(event.target.value as NrpScenarioId)}>{NRP_SCENARIOS.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><Button onClick={() => void begin()} disabled={start.isPending}>{summary ? "Repeat scenario" : "Enter NRP room"}</Button></div>}<p className="text-xs text-cyan-800"><strong>Learning focus:</strong> initial newborn assessment, initial steps, effective ventilation, heart-rate reassessment, and indicated escalation.</p>{error && <div role="alert" className="rounded-md border border-rose-300 bg-rose-50 p-3 font-medium text-rose-900"><XCircle className="mr-2 inline h-4 w-4" />{error}</div>}</CardContent></Card>

    {summary && <Card className="border-emerald-300 bg-emerald-50"><CardHeader><CardTitle className="flex items-center gap-2 text-emerald-950"><CheckCircle2 className="h-5 w-5" />NRP rehearsal saved for review</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-emerald-950"><p>This is formative simulation evidence only. It does not complete NRP Phase 2, issue a credential, or replace instructor assessment.</p><div className="grid gap-2 sm:grid-cols-3"><div><span className="block text-xs uppercase">Score</span><strong>{summary.score}%</strong></div><div><span className="block text-xs uppercase">Duration</span><strong>{summary.durationSeconds}s</strong></div><div><span className="block text-xs uppercase">Critical failures</span><strong>{summary.criticalFailures}</strong></div></div><Button variant="outline" onClick={() => void begin()}><RotateCcw className="mr-2 h-4 w-4" />Repeat scenario</Button></CardContent></Card>}

    {state && session && <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]"><Card><CardHeader><CardTitle className="text-base">Observable newborn findings</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-3 text-sm"><div>Gestation<strong className="block">{state.patient.gestationWeeks} weeks</strong></div><div>Breathing<strong className="block">{state.patient.breathing}</strong></div><div>Heart rate<strong className="block">{state.patient.heartRate}/min</strong></div><div>Tone<strong className="block">{state.patient.tone}</strong></div><div>Colour<strong className="block">{state.patient.colour}</strong></div><div>Phase<strong className="block">{state.patient.phase.replaceAll("_", " ")}</strong></div><div>Time<strong className="block">{state.elapsedSeconds}s</strong></div></CardContent></Card><Card><CardHeader><CardTitle className="text-base">Choose an action, then reassess</CardTitle></CardHeader><CardContent className="space-y-3"><div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-950" aria-live="polite"><p className="font-semibold">Mission Director</p><p className="mt-1 text-xs">{directorFor(state)}</p></div><div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="status"><AlertTriangle className="mr-2 inline h-4 w-4" /><strong>{state.patient.phase === "post_resuscitation" ? "Protect the post-resuscitation period" : state.patient.phase === "compressions" ? "Coordinate support and reassess heart rate" : "Ventilation is the priority when breathing is inadequate"}</strong></div>{latest && <div aria-live="polite" className={`rounded-lg border p-3 text-sm ${latest.correct === false ? "border-rose-200 bg-rose-50 text-rose-950" : "border-cyan-200 bg-cyan-50 text-cyan-950"}`}><p className="font-semibold">{latest.correct === false ? "Review this action" : "Latest newborn response"}</p><p>{latest.description}</p></div>}{GROUPS.map((group) => <section key={group.title}><h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">{group.title}</h3><p className="mb-2 text-xs text-slate-500">{group.hint}</p><div className="flex flex-wrap gap-2">{group.labels.map((label) => { const item = commandByLabel.get(label)!; return <Button key={label} variant="outline" size="sm" disabled={receive.isPending || complete.isPending} onClick={() => void act(item.command)}>{label}</Button>; })}</div></section>)}<div className="flex flex-wrap items-center gap-3 border-t pt-3"><Button className="bg-cyan-700 text-white hover:bg-cyan-800" onClick={() => void finish()} disabled={!canEndNrpSimulation(state) || receive.isPending || complete.isPending}>End and save rehearsal</Button>{!canEndNrpSimulation(state) && <span className="text-xs text-slate-600">Reach a post-resuscitation endpoint, then save the rehearsal.</span>}{onExit && <Button variant="ghost" onClick={() => void abandon()} disabled={receive.isPending || complete.isPending}>Exit without saving</Button>}</div></CardContent></Card></div>}
  </div>;
}
