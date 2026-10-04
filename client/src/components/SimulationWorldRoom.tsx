import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Activity, AlertTriangle, CheckCircle2, Clock3, Mic, Radio, Users } from "lucide-react";
import {
  advanceSimulationWorld, calculateSimulationWorldAssessment, createSimulationWorld, getSimulationWorldRoleLabel,
  isSimulationWorldCommandAllowed, parseSimulationWorldCommand, reduceSimulationWorld, SIMULATION_ASSESSMENT_VERSION,
  SIMULATION_ENGINE_VERSION, SIMULATION_SCENARIO_VERSION, SIMULATION_WORLD_ROLES, SIMULATION_WORLD_SCENARIOS,
  type SimulationWorldCommand, type SimulationWorldRole, type SimulationWorldScenarioId,
} from "@shared/simulation-world";
import type { PracticeLabEvent, PracticeLabProgramType } from "@shared/practice-lab-types";

type Props = { enrollmentId: number; programType: PracticeLabProgramType; onComplete?: () => void };
const actionButtons: readonly [string, SimulationWorldCommand][] = [
  ["Assess airway", { type: "assess", target: "airway" }], ["Assess breathing", { type: "assess", target: "breathing" }],
  ["Assess circulation", { type: "assess", target: "circulation" }], ["Check rhythm", { type: "assess", target: "rhythm" }],
  ["Call for help", { type: "call_for_help" }], ["Attach monitor", { type: "attach_monitor" }], ["Start CPR", { type: "start_cpr" }],
  ["Give oxygen", { type: "give_oxygen" }], ["Give fluid bolus", { type: "give_fluid" }], ["Reassess", { type: "reassess" }],
];
const visibleValue = (world: ReturnType<typeof createSimulationWorld>, key: keyof typeof world.observations, suffix = "") => world.observations[key] === undefined ? "Not assessed" : `${String(world.observations[key]).replaceAll("_", " ")}${suffix}`;

export function SimulationWorldRoom({ enrollmentId, programType, onComplete }: Props) {
  const [scenarioId, setScenarioId] = useState<SimulationWorldScenarioId>(SIMULATION_WORLD_SCENARIOS[0].id);
  const [role, setRole] = useState<SimulationWorldRole>("team_leader");
  const [world, setWorld] = useState(() => createSimulationWorld(SIMULATION_WORLD_SCENARIOS[0].id, "team_leader"));
  const [command, setCommand] = useState("");
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [session, setSession] = useState<{ id: number; nonce: string } | null>(null);
  const commandSequenceRef = useRef(0);
  const recordAttempt = trpc.practiceLab.recordAttempt.useMutation();
  const startSession = trpc.practiceLab.startSimulationWorldSession.useMutation();
  const receiveCommand = trpc.practiceLab.receiveSimulationWorldCommand.useMutation();
  const assessment = useMemo(() => calculateSimulationWorldAssessment(world), [world]);
  const scenario = SIMULATION_WORLD_SCENARIOS.find((item) => item.id === world.scenarioId) ?? SIMULATION_WORLD_SCENARIOS[0];

  useEffect(() => {
    if (!started || completed) return;
    const timer = window.setInterval(() => {
      setWorld((current) => {
        const next = advanceSimulationWorld(current, 0.25);
        if (next.elapsedSeconds >= 180 || next.patient.trajectory === "death") setCompleted(true);
        return next;
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [started, completed]);

  const restart = (nextScenario = scenarioId, nextRole = role) => {
    setWorld(createSimulationWorld(nextScenario, nextRole)); setScenarioId(nextScenario); setRole(nextRole); setStarted(false); setCompleted(false); setCommand(""); setSession(null); commandSequenceRef.current = 0;
  };
  const apply = (rawCommand: SimulationWorldCommand) => {
    if (!started || completed) return;
    if (!isSimulationWorldCommandAllowed(role, rawCommand)) return;
    setWorld((current) => {
      const next = reduceSimulationWorld(current, rawCommand);
      if (session) {
        const sequence = commandSequenceRef.current;
        commandSequenceRef.current += 1;
        void receiveCommand.mutateAsync({ sessionId: session.id, sessionNonce: session.nonce, sequence, commandType: rawCommand.type, commandJson: rawCommand as unknown as Record<string, unknown> }).catch(() => undefined);
      }
      if (next.criticalFailures.length > 0 || next.patient.trajectory === "death") setCompleted(true);
      return next;
    });
  };
  const submitCommand = () => { const parsed = parseSimulationWorldCommand(command); if (parsed) apply(parsed); setCommand(""); };
  const begin = async () => {
    const created = await startSession.mutateAsync({ enrollmentId, programType, scenarioId, role, engineVersion: SIMULATION_ENGINE_VERSION, scenarioVersion: SIMULATION_SCENARIO_VERSION, assessmentVersion: SIMULATION_ASSESSMENT_VERSION });
    setSession({ id: created.sessionId, nonce: created.sessionNonce });
    setStarted(true);
  };
  const finish = async () => {
    if (!session) return;
    setCompleted(true);
    const meta: PracticeLabEvent = { timestamp: world.elapsedSeconds, type: "simulation_world_meta", description: JSON.stringify({ role, scenarioId: world.scenarioId, evidenceEligible: assessment.evidenceEligible, engineVersion: SIMULATION_ENGINE_VERSION, scenarioVersion: SIMULATION_SCENARIO_VERSION, assessmentVersion: SIMULATION_ASSESSMENT_VERSION }), correct: assessment.evidenceEligible };
    await recordAttempt.mutateAsync({ enrollmentId, programType, trackId: "simulation_world", scenarioId: world.scenarioId, score: assessment.overall, passed: assessment.evidenceEligible, eventLog: [...world.events, meta], durationSeconds: world.elapsedSeconds, sessionId: session.id, sessionNonce: session.nonce });
    onComplete?.();
  };

  if (!started) return <Card className="border-slate-700 bg-slate-950 text-white"><CardHeader><Badge className="w-fit bg-cyan-400/15 text-cyan-200">Autonomous Phase 2 rehearsal</Badge><CardTitle className="text-2xl">Enter the resuscitation room</CardTitle></CardHeader><CardContent className="space-y-5"><div><label className="text-xs uppercase tracking-wide text-slate-400">Scenario</label><div className="mt-2 grid gap-2 md:grid-cols-3">{SIMULATION_WORLD_SCENARIOS.map((item) => <button key={item.id} type="button" onClick={() => restart(item.id, role)} className={`rounded-lg border p-3 text-left ${item.id === scenarioId ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700 bg-slate-900"}`}><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs text-slate-400">{item.subtitle}</p><p className="mt-2 text-[11px] uppercase text-amber-300">{item.difficulty}</p></button>)}</div></div><div><label className="text-xs uppercase tracking-wide text-slate-400">Your role</label><div className="mt-2 grid gap-2 md:grid-cols-4">{SIMULATION_WORLD_ROLES.map((item) => <button key={item} type="button" onClick={() => restart(scenarioId, item)} className={`rounded-lg border p-2 text-left text-xs ${item === role ? "border-violet-400 bg-violet-400/10" : "border-slate-700 bg-slate-900"}`}>{getSimulationWorldRoleLabel(item)}</button>)}</div></div><div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">You will need to obtain observations, perform only your role’s actions, and respond while the patient changes continuously. This is training, not an AHA accreditation decision or live-care tool.</div><Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" size="lg" onClick={() => void begin()} disabled={startSession.isPending}>Start {getSimulationWorldRoleLabel(role)} mission</Button></CardContent></Card>;

  const allowedButtons = actionButtons.filter(([, action]) => isSimulationWorldCommandAllowed(role, action));
  return <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"><div className="space-y-4"><Card className="border-slate-700 bg-slate-950 text-white"><CardHeader className="flex flex-row items-start justify-between"><div><Badge className="bg-rose-400/15 text-rose-200">LIVE — {getSimulationWorldRoleLabel(role)}</Badge><CardTitle className="mt-2">{scenario.title}</CardTitle><p className="mt-1 text-sm text-slate-400">{scenario.subtitle}</p></div><div className="flex items-center gap-2 text-sm text-cyan-200"><Clock3 className="h-4 w-4" />{world.elapsedSeconds.toFixed(1)}s</div></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-4">{[["Rhythm", "rhythm", ""], ["SpO₂", "spo2", "%"], ["HR", "heart_rate", " bpm"], ["BP", "blood_pressure", " mmHg"]].map(([label, key, suffix]) => <div key={key} className="rounded-lg bg-slate-900 p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 font-semibold">{visibleValue(world, key as keyof typeof world.observations, suffix)}</p></div>)}</div><div className="mt-4 flex flex-wrap gap-2 text-xs"><Badge variant="outline" className="border-slate-600">Airway: {visibleValue(world, "airway")}</Badge><Badge variant="outline" className="border-slate-600">Breathing: {visibleValue(world, "breathing")}</Badge><Badge variant="outline" className="border-slate-600">Circulation: {visibleValue(world, "circulation")}</Badge><Badge variant="outline" className="border-slate-600">Trajectory: {world.observations.circulation === undefined ? "Not assessed" : world.patient.trajectory}</Badge></div>{world.criticalFailures.length > 0 && <div className="mt-4 rounded-lg border border-rose-400/40 bg-rose-400/10 p-3 text-sm text-rose-100"><AlertTriangle className="mr-2 inline h-4 w-4" />Critical safety event: {world.criticalFailures.at(-1)}</div>}</CardContent></Card><Card className="border-slate-700 bg-white text-slate-950"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Radio className="h-4 w-4" />Role console</CardTitle><p className="text-xs text-slate-500">Available actions are constrained to {getSimulationWorldRoleLabel(role)}.</p></CardHeader><CardContent><div className="grid gap-2 sm:grid-cols-3">{allowedButtons.map(([label, action]) => <Button key={label} variant="outline" className="justify-start" disabled={completed} onClick={() => apply(action)}>{label}</Button>)}</div><div className="mt-3 flex gap-2"><Input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitCommand(); }} placeholder="Say or type a role-appropriate order/report" disabled={completed} /><Button variant="outline" onClick={submitCommand} disabled={completed || !command.trim()}><Mic className="h-4 w-4" /></Button></div><p className="mt-2 text-xs text-slate-500">The engine advances every 250 ms; language is only translated into structured actions.</p></CardContent></Card></div><div className="space-y-4"><Card className="border-slate-700 bg-slate-950 text-white"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" />Team room</CardTitle></CardHeader><CardContent className="space-y-2">{world.npcs.map((npc) => <div key={npc.role} className="flex items-center justify-between rounded-lg bg-slate-900 p-3"><div><p className="text-sm font-semibold">{npc.name} · {getSimulationWorldRoleLabel(npc.role)}</p><p className="text-xs text-slate-400">{npc.currentTask}</p></div><Badge variant="outline" className="border-slate-600">{npc.status}</Badge></div>)}</CardContent></Card><Card className="border-slate-700 bg-slate-950 text-white"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4" />Forensic replay</CardTitle></CardHeader><CardContent className="max-h-72 space-y-2 overflow-auto">{world.events.length === 0 ? <p className="text-sm text-slate-400">The room is waiting for your first command.</p> : world.events.map((item, index) => <div key={`${item.timestamp}-${index}`} className="border-l-2 border-cyan-400/50 pl-3 text-xs"><span className="font-mono text-cyan-300">{item.timestamp.toFixed(1)}s</span> <span className="text-slate-200">{item.description}</span></div>)}</CardContent></Card><Card className="border-violet-400/30 bg-violet-400/10 text-white"><CardContent className="p-4"><p className="text-xs uppercase tracking-wide text-violet-200">Behavioural evidence</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs">{Object.entries(assessment.vector).map(([key, value]) => <div key={key} className="flex justify-between"><span className="text-slate-300">{key.replace(/([A-Z])/g, " $1")}</span><span className="font-semibold">{value}</span></div>)}</div>{!completed ? <Button className="mt-4 w-full bg-violet-400 text-slate-950 hover:bg-violet-300" onClick={finish}>End rehearsal & generate evidence</Button> : <div className="mt-4 rounded-lg bg-slate-950/50 p-3 text-sm">{assessment.evidenceEligible ? <><CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-300" />Evidence eligible for review — {assessment.overall}% overall.</> : <><AlertTriangle className="mr-2 inline h-4 w-4 text-amber-300" />Remediation required before evidence is eligible — {assessment.overall}% overall.</>}</div>}</CardContent></Card></div></div>;
}
