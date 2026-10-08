import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PracticeLabGate } from "@/components/practice-lab/PracticeLabGate";
import { ShockNoShockTrack } from "@/components/practice-lab/ShockNoShockTrack";
import { AbcdeTrack } from "@/components/practice-lab/AbcdeTrack";
import { CardiacArrestTrack } from "@/components/practice-lab/CardiacArrestTrack";
import { RhythmRecognitionTrack } from "@/components/practice-lab/RhythmRecognitionTrack";
import { AiRoleplayTrack } from "@/components/practice-lab/AiRoleplayTrack";
import { PalsCapstoneSimulation } from "@/components/PalsCapstoneSimulation";
import { SimulationWorldRoom } from "@/components/SimulationWorldRoom";
import { AdultAclsSimulationRoom } from "@/components/AdultAclsSimulationRoom";
import { getSimulationMasteryLabel, getSimulationMission, isFormativeSimulationMission, isSimulationMissionUnlocked, SIMULATION_MISSIONS, type SimulationMissionId } from "@shared/simulation-hub";
import type { PracticeLabProgramType } from "@shared/practice-lab-types";
import { getSimulationWorldRoleLabel, getRoleEvidenceFromAttempt, SIMULATION_WORLD_ROLES } from "@shared/simulation-world";
import { Activity, ArrowLeft, Brain, CheckCircle2, Clock3, Gamepad2, HeartPulse, Lock, RotateCcw, ShieldAlert, Sparkles, Target, Trophy, Users } from "lucide-react";

type MissionProgress = Record<string, { attempts: number; bestScore: number; lastPlayedAt: string }>;

const TRACK_LABELS: Record<string, string> = {
  simulation_world: "Simulation World",
  cardiac_arrest: "Cardiac arrest",
  abcde: "ABCDE",
  rhythm_recognition: "Rhythm decisions",
  ai_interactive_roleplay: "Resus room",
	  shock_no_shock: "Shock / no shock",
	  pals_capstone: "PALS capstone",
	  adult_acls_world: "Adult ACLS Simulation World",
	};

export default function SimulationHub() {
  const [, setLocation] = useLocation();
  const { data: access, isLoading } = trpc.practiceLab.getAccess.useQuery();
  const [selectedMissionId, setSelectedMissionId] = useState<SimulationMissionId>("simulation-world");
  const [stage, setStage] = useState<"map" | "briefing" | "playing">("map");
  const [programType, setProgramType] = useState<PracticeLabProgramType>("pals");
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [capstoneKey, setCapstoneKey] = useState(0);
  const [capstoneResult, setCapstoneResult] = useState<{ score: number; simReady: boolean } | null>(null);
  const recordAttempt = trpc.practiceLab.recordAttempt.useMutation();

  const enrollments = access?.enrollments ?? [];
  const selectedMission = getSimulationMission(selectedMissionId) ?? SIMULATION_MISSIONS[0];
  const eligibleEnrollments = useMemo(
    () => enrollments.filter((enrollment) => selectedMission.supportedPrograms.includes(enrollment.programType as PracticeLabProgramType)),
    [enrollments, selectedMission],
  );
  // Keep the active enrollment aligned with the selected mission. Without this,
  // switching from the default PALS/paediatric mission to Adult ACLS could leave
  // a PALS enrollment selected, disabling the ACLS room entry button even when
  // the learner has a valid ACLS enrollment.
  const selectedEnrollment = eligibleEnrollments.find((enrollment) => enrollment.id === enrollmentId) ?? eligibleEnrollments[0] ?? enrollments[0];
  const effectiveProgram = (selectedEnrollment?.programType ?? programType) as PracticeLabProgramType;
  const effectiveEnrollmentId = selectedEnrollment?.id ?? enrollmentId;
  const { data: attempts = [], refetch: refetchAttempts } = trpc.practiceLab.getMyAttempts.useQuery(
    { limit: 100 },
    { enabled: Boolean(access?.hasAccess), staleTime: 15_000 },
  );
  const progress = useMemo<MissionProgress>(() => {
    const next: MissionProgress = {};
    for (const mission of SIMULATION_MISSIONS) {
      const missionAttempts = attempts.filter((attempt) => attempt.trackId === mission.trackId);
      if (!missionAttempts.length) continue;
      next[mission.id] = {
        attempts: missionAttempts.length,
        bestScore: Math.max(...missionAttempts.map((attempt) => Number(attempt.score) || 0)),
        lastPlayedAt: String(missionAttempts[0]?.createdAt ?? new Date().toISOString()),
      };
    }
    return next;
  }, [attempts]);
  const completedMissionIds = SIMULATION_MISSIONS.filter((mission) => {
    const item = progress[mission.id];
    return Boolean(item && (isFormativeSimulationMission(mission) ? item.attempts > 0 : item.bestScore >= mission.masteryThreshold));
  }).map((mission) => mission.id);
  const missionProgress = progress[selectedMission.id];
  const allCompleted = completedMissionIds.length;
  const roleEvidence = useMemo(() => {
    const map = new Map<string, { attempts: number; eligible: number }>();
    for (const role of SIMULATION_WORLD_ROLES) map.set(role, { attempts: 0, eligible: 0 });
    for (const attempt of attempts) {
      if (attempt.trackId !== "simulation_world") continue;
      const evidence = getRoleEvidenceFromAttempt(attempt.eventLog);
      if (!evidence.role) continue;
      const current = map.get(evidence.role) ?? { attempts: 0, eligible: 0 };
      current.attempts += 1;
      if (evidence.evidenceEligible) current.eligible += 1;
      map.set(evidence.role, current);
    }
    return map;
  }, [attempts]);
  const recommendedRole = useMemo(() => {
    const eligibleByRole = new Map<string, Set<string>>();
    for (const attempt of attempts) {
      if (attempt.trackId !== "simulation_world") continue;
      const evidence = getRoleEvidenceFromAttempt(attempt.eventLog);
      if (!evidence.role || !evidence.evidenceEligible) continue;
      const scenarios = eligibleByRole.get(evidence.role) ?? new Set<string>();
      scenarios.add(evidence.scenarioId ?? "unknown");
      eligibleByRole.set(evidence.role, scenarios);
    }
    const teamRoles = SIMULATION_WORLD_ROLES.filter((role) => role !== "team_leader");
    const missingTeamRole = teamRoles.find((role) => (eligibleByRole.get(role)?.size ?? 0) < 1);
    if (missingTeamRole) return { role: missingTeamRole, reason: "You have not yet demonstrated this role." };
    const leadershipScenarios = eligibleByRole.get("team_leader")?.size ?? 0;
    if (leadershipScenarios < 3) return { role: "team_leader" as const, reason: `${leadershipScenarios}/3 distinct leadership scenarios are evidence-ready.` };
    return null;
  }, [attempts]);

  useEffect(() => {
    if (selectedEnrollment) {
      setEnrollmentId(selectedEnrollment.id);
      setProgramType(selectedEnrollment.programType as PracticeLabProgramType);
    }
  }, [selectedEnrollment]);

  useEffect(() => {
    if (stage === "map") void refetchAttempts();
  }, [refetchAttempts, stage]);

  const startMission = () => {
    if (!effectiveEnrollmentId || !eligibleEnrollments.some((enrollment) => enrollment.id === effectiveEnrollmentId)) return;
    setStage("playing");
  };

  const trackProps = {
    programType: effectiveProgram,
    enrollmentId: effectiveEnrollmentId!,
    onBookSession: () => setLocation("/aha-book-session"),
  };

  const handleCapstoneComplete = async (score: number, simReady: boolean) => {
    if (!effectiveEnrollmentId) return;
    setCapstoneResult({ score, simReady });
    await recordAttempt.mutateAsync({
      enrollmentId: effectiveEnrollmentId,
      programType: effectiveProgram,
      trackId: "pals_capstone",
      scenarioId: "pals_capstone_standard",
      score,
      passed: simReady,
      eventLog: [{ timestamp: 0, type: "capstone_complete", description: `PALS capstone completed at ${score}%`, correct: simReady }],
      durationSeconds: selectedMission.estimatedMinutes * 60,
    });
    await refetchAttempts();
  };

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Preparing your simulation room…</div>;

  if (!access?.hasAccess) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
        <Card className="mx-auto max-w-lg border-slate-700 bg-slate-900 text-white">
          <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Simulation Hub access</CardTitle><CardDescription className="text-slate-300">Start or complete an AHA Life Support enrollment before saving simulation attempts.</CardDescription></CardHeader>
          <CardContent><Button onClick={() => setLocation("/aha-courses")}>Go to Life Support Hub</Button></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PracticeLabGate>
      <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <Button variant="ghost" size="sm" className="mt-1 shrink-0 gap-2 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => setLocation("/aha-courses")}><ArrowLeft className="h-4 w-4" />Life Support Hub</Button>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300"><Gamepad2 className="h-4 w-4" />Simulation Hub</div>
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Train for the moment before it happens.</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">A consequence-based rehearsal room for emergency decisions. You will see incomplete information, changing physiology, team pressure, and a debrief that tells you what to rehearse next.</p>
              </div>
            </div>
            <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100"><p className="font-semibold">Mastery, not ranking</p><p className="mt-1 text-xs text-cyan-100/70">No public leaderboard. Your opponent is hesitation, not another learner.</p></div>
          </header>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><Target className="h-4 w-4 text-cyan-300" /><p className="mt-3 text-2xl font-bold">{allCompleted}/{SIMULATION_MISSIONS.length}</p><p className="text-xs text-slate-400">missions safe on repeat</p></div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><Trophy className="h-4 w-4 text-amber-300" /><p className="mt-3 text-2xl font-bold">{Math.max(0, ...Object.values(progress).map((item) => item.bestScore))}%</p><p className="text-xs text-slate-400">best observed score</p></div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><Brain className="h-4 w-4 text-violet-300" /><p className="mt-3 text-2xl font-bold">{Object.values(progress).reduce((total, item) => total + item.attempts, 0)}</p><p className="text-xs text-slate-400">rehearsals completed</p></div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><ShieldAlert className="h-4 w-4 text-rose-300" /><p className="mt-3 text-2xl font-bold">Safe to fail</p><p className="text-xs text-slate-400">errors become coaching</p></div>
          </div>

          {stage === "map" && (
            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <Card className="border-slate-800 bg-slate-900 text-white">
                <CardHeader><CardTitle className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-rose-300" />Choose your next mission</CardTitle><CardDescription className="text-slate-400">Start with the first safe action. Increase uncertainty only after your basics are reliable.</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {SIMULATION_MISSIONS.map((mission) => {
                    const item = progress[mission.id];
                    const unlocked = isSimulationMissionUnlocked(mission, completedMissionIds);
                    const eligible = mission.supportedPrograms.some((program) => enrollments.some((enrollment) => enrollment.programType === program));
                    const selected = mission.id === selectedMissionId;
                    return <button key={mission.id} type="button" disabled={!unlocked || !eligible} onClick={() => setSelectedMissionId(mission.id)} className={`w-full rounded-xl border p-4 text-left transition ${selected ? "border-cyan-400 bg-cyan-400/10" : "border-slate-800 bg-slate-950/40 hover:border-slate-600"} disabled:cursor-not-allowed disabled:opacity-50`}><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{mission.title}</p><Badge variant="outline" className="border-slate-600 text-slate-300">{mission.difficulty}</Badge></div><p className="mt-1 text-sm text-slate-400">{mission.subtitle}</p></div>{unlocked ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" /> : <Lock className="h-5 w-5 shrink-0 text-slate-500" />}</div><div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{mission.estimatedMinutes} min</span><span>{TRACK_LABELS[mission.trackId]}</span>{mission.isFormative ? <span>Formative · not assessed</span> : <span>Pass {mission.masteryThreshold}%</span>}{item ? <span className="text-cyan-300">{mission.isFormative ? `${item.attempts} rehearsal${item.attempts === 1 ? "" : "s"}` : `Best ${item.bestScore}% · ${getSimulationMasteryLabel(item.attempts, item.bestScore)}`}</span> : null}</div></button>;
                  })}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="border-cyan-400/30 bg-cyan-400/10 text-white"><CardHeader><CardTitle className="text-base">Why this feels real</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-slate-200"><p className="flex gap-2"><Users className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />Team members create pressure, but do not replace your clinical reasoning.</p><p className="flex gap-2"><Activity className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />Vitals and patient state change after decisions, so you must reassess.</p><p className="flex gap-2"><Brain className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />Debrief separates knowledge, recognition, action, and communication.</p><p className="flex gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />You can retry immediately, then return later for spaced rehearsal.</p></CardContent></Card>
                <Card className="border-amber-400/30 bg-amber-400/10 text-white"><CardContent className="p-4 text-xs leading-5 text-amber-100"><strong>Training boundary:</strong> This is a scripted learning simulation. It does not replace local protocols, an instructor-led skills session, or ResusGPS during live patient care.</CardContent></Card>
                <Card className="border-violet-400/30 bg-violet-400/10 text-white"><CardHeader><CardTitle className="text-base">Role evidence</CardTitle><CardDescription className="text-violet-100/70">Your Simulation World attempts are tracked by role, not attendance alone.</CardDescription></CardHeader><CardContent className="space-y-2">{SIMULATION_WORLD_ROLES.map((role) => { const item = roleEvidence.get(role)!; return <div key={role} className="flex items-center justify-between rounded-lg bg-slate-950/50 px-3 py-2 text-xs"><span>{getSimulationWorldRoleLabel(role)}</span><span className={item.eligible > 0 ? "text-emerald-300" : "text-slate-400"}>{item.eligible > 0 ? `${item.eligible} evidence-ready` : `${item.attempts} rehearsal${item.attempts === 1 ? "" : "s"}`}</span></div>; })}</CardContent></Card>
                {recommendedRole && <Card className="border-emerald-400/30 bg-emerald-400/10 text-white"><CardHeader><CardTitle className="text-base">Next required experience</CardTitle><CardDescription className="text-emerald-100/80">The Mission Director selects the next gap instead of making you manage the curriculum.</CardDescription></CardHeader><CardContent><p className="font-semibold">{getSimulationWorldRoleLabel(recommendedRole.role)}</p><p className="mt-1 text-xs text-emerald-100/80">{recommendedRole.reason}</p></CardContent></Card>}
                <Button className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400" size="lg" disabled={!eligibleEnrollments.length} onClick={() => setStage("briefing")}>Brief me for “{selectedMission.title}” <span className="ml-2">→</span></Button>
              </div>
            </div>
          )}

          {stage === "briefing" && (
            <Card className="border-cyan-400/40 bg-slate-900 text-white"><CardHeader><Badge className="w-fit bg-cyan-400/15 text-cyan-200">Mission briefing · {selectedMission.difficulty}</Badge><CardTitle className="mt-2 text-2xl">{selectedMission.title}</CardTitle><CardDescription className="text-slate-300">{selectedMission.subtitle}</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-3 md:grid-cols-3"><div className="rounded-lg bg-slate-950 p-3"><p className="text-xs uppercase tracking-wide text-slate-500">Objective</p><p className="mt-1 text-sm">{selectedMission.objective}</p></div><div className="rounded-lg bg-slate-950 p-3"><p className="text-xs uppercase tracking-wide text-slate-500">Reality rule</p><p className="mt-1 text-sm">{selectedMission.realism}</p></div><div className="rounded-lg bg-slate-950 p-3"><p className="text-xs uppercase tracking-wide text-slate-500">Expected time</p><p className="mt-1 text-sm">{selectedMission.estimatedMinutes} minutes · {TRACK_LABELS[selectedMission.trackId]}</p></div></div><div className="flex flex-wrap gap-3"><Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" disabled={!effectiveEnrollmentId || !eligibleEnrollments.some((enrollment) => enrollment.id === effectiveEnrollmentId)} onClick={startMission}>Enter simulation room</Button><Button variant="outline" className="border-slate-600 text-slate-200" onClick={() => setStage("map")}>Back to mission map</Button></div></CardContent></Card>
          )}

          {stage === "playing" && effectiveEnrollmentId && (
            <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"><div><p className="text-xs uppercase tracking-[0.16em] text-cyan-300">Live mission</p><p className="font-semibold">{selectedMission.title}</p></div><Button size="sm" variant="outline" className="gap-2 border-slate-600 text-slate-200" onClick={() => setStage("map")}><RotateCcw className="h-4 w-4" />Exit to map</Button></div><div className="rounded-xl bg-white p-3 text-slate-950">{selectedMission.trackId === "adult_acls_world" && effectiveProgram === "acls" && <AdultAclsSimulationRoom enrollmentId={effectiveEnrollmentId} onComplete={() => void refetchAttempts()} />}{selectedMission.trackId === "simulation_world" && <SimulationWorldRoom {...trackProps} onComplete={() => void refetchAttempts()} />}{selectedMission.trackId === "cardiac_arrest" && <CardiacArrestTrack {...trackProps} />}{selectedMission.trackId === "abcde" && <AbcdeTrack {...trackProps} />}{selectedMission.trackId === "rhythm_recognition" && <RhythmRecognitionTrack {...trackProps} />}{selectedMission.trackId === "ai_interactive_roleplay" && <AiRoleplayTrack {...trackProps} />}{selectedMission.trackId === "shock_no_shock" && <ShockNoShockTrack {...trackProps} />}{selectedMission.trackId === "pals_capstone" && <div className="space-y-4"><PalsCapstoneSimulation key={capstoneKey} patientAge={2} patientWeight={12} onComplete={handleCapstoneComplete} onClose={() => setStage("map")} />{capstoneResult && <Card className="border-emerald-200 bg-emerald-50"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold text-emerald-900">{capstoneResult.simReady ? "Capstone passed — Sim-Ready" : "Capstone complete — another rehearsal recommended"}</p><p className="text-sm text-emerald-800">Score {capstoneResult.score}%. Use the debrief and repeat the weak phase before progressing.</p></div><Button size="sm" variant="outline" onClick={() => { setCapstoneResult(null); setCapstoneKey((key) => key + 1); }}>Repeat capstone</Button></CardContent></Card>}</div>}</div></div>
          )}
        </div>
      </div>
    </PracticeLabGate>
  );
}
