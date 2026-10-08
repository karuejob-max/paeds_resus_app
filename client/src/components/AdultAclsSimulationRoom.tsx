import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ADULT_ACLS_SCENARIOS, type AdultAclsCommand, type AdultAclsScenarioId, type AdultAclsState } from "@shared/adult-acls-simulation-world";
import type { SimulationWorldRole } from "@shared/simulation-world";

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
  { label: "Pace", command: { type: "pace" } },
  { label: "Epinephrine", command: { type: "give_epinephrine" } },
  { label: "Antiarrhythmic", command: { type: "give_antiarrhythmic" } },
  { label: "Adenosine", command: { type: "give_adenosine" } },
  { label: "Atropine", command: { type: "give_atropine" } },
  { label: "Treat reversible cause", command: { type: "treat_reversible_cause" } },
];

export function AdultAclsSimulationRoom({ enrollmentId, onComplete }: { enrollmentId: number; onComplete: () => void }) {
  const [scenarioId, setScenarioId] = useState<AdultAclsScenarioId>("unstable-bradycardia");
  const [session, setSession] = useState<{ id: number; nonce: string } | null>(null);
  const [state, setState] = useState<AdultAclsState | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const sequence = useRef(0);
  const start = trpc.practiceLab.startAdultAclsSession.useMutation();
  const invalidate = trpc.practiceLab.invalidateAdultAclsSession.useMutation();
  const receive = trpc.practiceLab.receiveAdultAclsCommand.useMutation();
  const complete = trpc.practiceLab.completeAdultAclsSession.useMutation();
  const scenario = useMemo(() => ADULT_ACLS_SCENARIOS.find((item) => item.id === scenarioId)!, [scenarioId]);

  const begin = async () => {
    setLaunchError(null);
    const selectedScenarioId = scenarioId;
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
  };

  const act = async (command: AdultAclsCommand) => {
    if (!session) return;
    const result = await receive.mutateAsync({ sessionId: session.id, sessionNonce: session.nonce, sequence: sequence.current, commandJson: command });
    sequence.current += 1;
    setState(result.authoritativeState as AdultAclsState);
  };

  const finish = async () => {
    if (!session) return;
    await complete.mutateAsync({ sessionId: session.id, sessionNonce: session.nonce });
    setSession(null);
    onComplete();
  };

  return <div className="space-y-4">
    <Card className="border-indigo-200 bg-indigo-50"><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle>Adult ACLS Simulation World</CardTitle><Badge variant="outline">Synthetic training simulation</Badge></div></CardHeader><CardContent className="space-y-3 text-sm text-indigo-950"><p>This is a deterministic adult resuscitation rehearsal. It does not represent a real patient, prove competence, or issue an ACLS credential.</p>{!session && <div className="flex flex-wrap gap-2"><select className="rounded-md border border-indigo-300 bg-white px-3 py-2" value={scenarioId} onChange={(event) => { setLaunchError(null); setScenarioId(event.target.value as AdultAclsScenarioId); }}><option value="" disabled>Select scenario</option>{ADULT_ACLS_SCENARIOS.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><Button onClick={() => void begin()} disabled={start.isPending || invalidate.isPending}>Enter adult ACLS room</Button></div>}{!session && <p className="text-xs text-indigo-800">{scenario.subtitle}</p>}{launchError && <div role="alert" className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm font-medium text-rose-900">{launchError}</div>}</CardContent></Card>
    {state && session && <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <Card><CardHeader><CardTitle className="text-base">Observable patient findings</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-2 text-sm"><div>Rhythm<strong className="block">{state.patient.rhythm}</strong></div><div>Pulse<strong className="block">{state.patient.pulse}</strong></div><div>BP<strong className="block">{state.patient.systolicBp}/{state.patient.diastolicBp}</strong></div><div>SpO₂<strong className="block">{state.patient.spo2}%</strong></div><div>Breathing<strong className="block">{state.patient.breathing}</strong></div><div>Mental status<strong className="block">{state.patient.mentalStatus}</strong></div><div>Phase<strong className="block">{state.patient.phase}</strong></div><div>Time<strong className="block">{state.elapsedSeconds}s</strong></div></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Choose an action, then reassess</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{COMMANDS.map(({ label, command }) => <Button key={label} variant="outline" size="sm" disabled={receive.isPending} onClick={() => void act(command)}>{label}</Button>)}<Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => void finish()} disabled={complete.isPending}>Finish rehearsal</Button></CardContent></Card>
      <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">Server event timeline</CardTitle></CardHeader><CardContent className="max-h-64 space-y-2 overflow-y-auto text-sm">{state.events.slice(-12).map((event, index) => <div key={`${event.timestamp}-${index}`} className={event.correct === false ? "rounded border border-rose-200 bg-rose-50 p-2" : "rounded border bg-slate-50 p-2"}><span className="mr-2 text-xs text-slate-500">{event.timestamp}s</span>{event.description}{event.consequence ? <span className="block text-xs text-slate-600">{event.consequence}</span> : null}</div>)}</CardContent></Card>
    </div>}
  </div>;
}
