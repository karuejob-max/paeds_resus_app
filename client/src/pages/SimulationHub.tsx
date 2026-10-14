import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PracticeLabGate } from "@/components/practice-lab/PracticeLabGate";
import { ShockNoShockTrack } from "@/components/practice-lab/ShockNoShockTrack";
import { AbcdeTrack } from "@/components/practice-lab/AbcdeTrack";
import { RhythmRecognitionTrack } from "@/components/practice-lab/RhythmRecognitionTrack";
import { AiRoleplayTrack } from "@/components/practice-lab/AiRoleplayTrack";
import { PalsCapstoneSimulation } from "@/components/PalsCapstoneSimulation";
import { SimulationWorldRoom } from "@/components/SimulationWorldRoom";
import { AdultAclsSimulationRoom } from "@/components/AdultAclsSimulationRoom";
import { NrpSimulationRoom } from "@/components/NrpSimulationRoom";
import { InteractiveResuscitationTrack } from "@/components/InteractiveResuscitationTrack";
import { getEligibleSimulationMissions, getSimulationMasteryLabel, getSimulationMission, isFormativeSimulationMission, isSimulationMissionUnlocked, SIMULATION_MISSIONS, type SimulationMissionId } from "@shared/simulation-hub";
import { getSimulationScenarioCatalog } from "@shared/simulation-scenario-catalog";
import type { PracticeLabProgramType } from "@shared/practice-lab-types";
import { getSimulationWorldRoleLabel, getRoleEvidenceFromAttempt, SIMULATION_WORLD_ROLES } from "@shared/simulation-world";
import { Activity, ArrowLeft, Brain, CheckCircle2, Clock3, Gamepad2, HeartPulse, Lock, RotateCcw, ShieldAlert, Sparkles, Target, Trophy, Users } from "lucide-react";
import { CardiacArrestTrack } from "@/components/practice-lab/CardiacArrestTrack";
import { SimulationMissionHud } from "@/components/SimulationMissionHud";
import { getRecommendedSimulationMission, getSimulationPracticePoints } from "@shared/simulation-hub-mastery";

type MissionProgress = Record<string, { attempts: number; bestScore: number; lastPlayedAt: string }>;

const PATHWAY_OPTIONS: readonly { programType: PracticeLabProgramType; label: string; description: string; accent: string }[] = [
  { programType: "bls", label: "BLS", description: "First response, CPR, and defibrillation fundamentals.", accent: "border-blue-400/40 bg-blue-400/10" },
  { programType: "acls", label: "ACLS", description: "Adult rhythms, arrest, interventions, and post-ROSC care.", accent: "border-rose-400/40 bg-rose-400/10" },
  { programType: "pals", label: "PALS", description: "Paediatric arrest, deterioration, and team decisions.", accent: "border-violet-400/40 bg-violet-400/10" },
  { programType: "nrp", label: "NRP", description: "Newborn transition, ventilation, and reassessment.", accent: "border-cyan-400/40 bg-cyan-400/10" },
  { programType: "heartsaver", label: "Heartsaver", description: "Community first aid, CPR, AED, choking, and emergency response.", accent: "border-amber-400/40 bg-amber-400/10" },
];

const TRACK_LABELS: Record<string, string> = {
  simulation_world: "Simulation World",
  cardiac_arrest: "Cardiac arrest",
  abcde: "ABCDE",
  rhythm_recognition: "Rhythm decisions",
  ai_interactive_roleplay: "Resus room",
	  shock_no_shock: "Shock / no shock",
	  pals_capstone: "PALS capstone",
	  adult_acls_world: "Adult ACLS Simulation World",
	  nrp_world: "NRP Newborn Simulation",
	};

export default function SimulationHub() {
  const [, setLocation] = useLocation();
  const { data: access, isLoading } = trpc.practiceLab.getAccess.useQuery();
  const [selectedMissionId, setSelectedMissionId] = useState<SimulationMissionId>("simulation-world");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("scenario");
  });
  const [stage, setStage] = useState<"map" | "briefing" | "playing">("map");
  const [playingScenarioId, setPlayingScenarioId] = useState<string | null>(null);
  const [programType, setProgramType] = useState<PracticeLabProgramType>("pals");
  const [selectedProgram, setSelectedProgram] = useState<PracticeLabProgramType>(() => {
    if (typeof window === "undefined") return "pals";
    const requested = new URLSearchParams(window.location.search).get("pathway");
    return PATHWAY_OPTIONS.some((option) => option.programType === requested) ? requested as PracticeLabProgramType : "pals";
  });
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [capstoneKey, setCapstoneKey] = useState(0);
  const [capstoneResult, setCapstoneResult] = useState<{ score: number; simReady: boolean } | null>(null);
  const recordAttempt = trpc.practiceLab.recordAttempt.useMutation();

  const enrollments = access?.enrollments ?? [];
  const selectedMission = getSimulationMission(selectedMissionId) ?? SIMULATION_MISSIONS[0];
  // The Hub is an explicit course lane, not a catalogue of every course the learner has ever touched.
  // Progress and mission visibility must follow the pathway the learner selected.
  // An explicit pathway selection must never silently fall back to another course.
  // That would display another course's progress and could make an unenrolled learner
  // believe that the selected pathway is ready for Phase 2.
  const selectedEnrollment = enrollments.find((enrollment) => enrollment.programType === selectedProgram);
  const eligibleMissions = useMemo(
    () => getEligibleSimulationMissions(selectedEnrollment ? [selectedEnrollment.programType as PracticeLabProgramType] : []),
    [selectedEnrollment],
  );
  const eligibleEnrollments = useMemo(
    () => selectedEnrollment ? [selectedEnrollment] : [],
    [selectedEnrollment],
  );
  // Keep the active enrollment aligned with the selected mission. Without this,
  // switching from the default PALS/paediatric mission to Adult ACLS could leave
  // a PALS enrollment selected, disabling the ACLS room entry button even when
  // the learner has a valid ACLS enrollment.
  const effectiveProgram = (selectedEnrollment?.programType ?? selectedProgram ?? programType) as PracticeLabProgramType;
  const effectiveEnrollmentId = selectedEnrollment?.id ?? enrollmentId;
  const { data: phase2Status, refetch: refetchPhase2Status } = trpc.practiceLab.getPhase2AutomationStatus.useQuery(
    { enrollmentId: effectiveEnrollmentId ?? 0 },
    { enabled: Boolean(effectiveEnrollmentId && access?.hasAccess), staleTime: 10_000 },
  );
  const { data: attempts = [], refetch: refetchAttempts } = trpc.practiceLab.getMyAttempts.useQuery(
    { limit: 100 },
    { enabled: Boolean(access?.hasAccess), staleTime: 15_000 },
  );
  const refreshLearningState = async () => {
    await Promise.all([refetchAttempts(), refetchPhase2Status()]);
  };
  const activeAttempts = useMemo(
    () => effectiveEnrollmentId ? attempts.filter((attempt) => attempt.enrollmentId === effectiveEnrollmentId) : [],
    [attempts, effectiveEnrollmentId],
  );
  const progress = useMemo<MissionProgress>(() => {
    const next: MissionProgress = {};
    for (const mission of SIMULATION_MISSIONS) {
      const missionAttempts = activeAttempts.filter((attempt) => attempt.trackId === mission.trackId);
      if (!missionAttempts.length) continue;
      next[mission.id] = {
        attempts: missionAttempts.length,
        bestScore: Math.max(...missionAttempts.map((attempt) => Number(attempt.score) || 0)),
        lastPlayedAt: String(missionAttempts[0]?.createdAt ?? new Date().toISOString()),
      };
    }
    return next;
  }, [activeAttempts]);
  const completedMissionIds = SIMULATION_MISSIONS.filter((mission) => mission.supportedPrograms.includes(effectiveProgram)).filter((mission) => {
    const item = progress[mission.id];
    return Boolean(item && (isFormativeSimulationMission(mission) ? item.attempts > 0 : item.bestScore >= mission.masteryThreshold));
  }).map((mission) => mission.id);
  const missionProgress = progress[selectedMission.id];
  const allCompleted = completedMissionIds.length;
  const activeMissionCount = eligibleMissions.length;
  const attemptsByMission = useMemo(() => Object.fromEntries(Object.entries(progress).map(([missionId, item]) => [missionId, item.attempts])), [progress]);
  const practicePoints = useMemo(
    () => Object.entries(progress).reduce((total, [missionId, item]) => {
      const mission = getSimulationMission(missionId);
      return total + (mission ? getSimulationPracticePoints(item.attempts, item.bestScore, isFormativeSimulationMission(mission)) : 0);
    }, 0),
    [progress],
  );
  const recommendedMission = useMemo(
    () => getRecommendedSimulationMission(eligibleMissions, completedMissionIds, attemptsByMission),
    [eligibleMissions, completedMissionIds, attemptsByMission],
  );
  const scenarioCatalog = useMemo(
    () => getSimulationScenarioCatalog(effectiveProgram).filter((scenario) => scenario.missionId === selectedMission.id),
    [effectiveProgram, selectedMission.id],
  );
  const requestedScenarioId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("scenario") : null;
  const effectiveScenarioId = requestedScenarioId && scenarioCatalog.some((scenario) => scenario.id === requestedScenarioId)
    ? requestedScenarioId
    : selectedScenarioId && scenarioCatalog.some((scenario) => scenario.id === selectedScenarioId)
      ? selectedScenarioId
    : scenarioCatalog[0]?.id ?? null;
  const selectedScenario = scenarioCatalog.find((scenario) => scenario.id === effectiveScenarioId);
  const roleEvidence = useMemo(() => {
    const map = new Map<string, { attempts: number; eligible: number }>();
    for (const role of SIMULATION_WORLD_ROLES) map.set(role, { attempts: 0, eligible: 0 });
    for (const attempt of activeAttempts) {
      if (attempt.trackId !== "simulation_world") continue;
      const evidence = getRoleEvidenceFromAttempt(attempt.eventLog);
      if (!evidence.role) continue;
      const current = map.get(evidence.role) ?? { attempts: 0, eligible: 0 };
      current.attempts += 1;
      if (evidence.evidenceEligible) current.eligible += 1;
      map.set(evidence.role, current);
    }
    return map;
  }, [activeAttempts]);
  const recommendedRole = useMemo(() => {
    const eligibleByRole = new Map<string, Set<string>>();
    for (const attempt of activeAttempts) {
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
  }, [activeAttempts]);

  useEffect(() => {
    if (enrollments.length && !enrollments.some((enrollment) => enrollment.programType === selectedProgram)) {
      setSelectedProgram(enrollments[0].programType as PracticeLabProgramType);
      return;
    }
    if (selectedEnrollment) {
      setEnrollmentId(selectedEnrollment.id);
      setProgramType(selectedEnrollment.programType as PracticeLabProgramType);
      if (selectedEnrollment.programType !== selectedProgram) setSelectedProgram(selectedEnrollment.programType as PracticeLabProgramType);
    }
  }, [enrollments, selectedEnrollment, selectedProgram]);

  const changePathway = (nextProgram: PracticeLabProgramType) => {
    if (stage === "playing") return;
    setSelectedProgram(nextProgram);
    setStage("map");
    const nextMission = getEligibleSimulationMissions(enrollments.filter((enrollment) => enrollment.programType === nextProgram).map((enrollment) => enrollment.programType as PracticeLabProgramType))[0];
    if (nextMission) setSelectedMissionId(nextMission.id);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("pathway", nextProgram);
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
    }
  };

  useEffect(() => {
    if (eligibleMissions.some((mission) => mission.id === selectedMissionId)) return;
    const firstEligible = eligibleMissions[0];
    if (firstEligible) setSelectedMissionId(firstEligible.id);
  }, [eligibleMissions, selectedMissionId]);

  useEffect(() => {
    // Access/enrollment data arrives asynchronously. Do not erase a URL-backed
    // handoff while the initial (default-lane) catalog is still empty.
    if (!scenarioCatalog.length) return;
    const preferredScenarioId = requestedScenarioId ?? selectedScenarioId;
    if (preferredScenarioId && scenarioCatalog.some((scenario) => scenario.id === preferredScenarioId)) {
      if (selectedScenarioId !== preferredScenarioId) setSelectedScenarioId(preferredScenarioId);
      return;
    }
    setSelectedScenarioId(scenarioCatalog[0]?.id ?? null);
  }, [requestedScenarioId, scenarioCatalog, selectedScenarioId]);

  useEffect(() => {
    if (stage === "map") void refreshLearningState();
  }, [stage, effectiveEnrollmentId]);

  const startMission = () => {
    const missionEnrollment = eligibleEnrollments.find((enrollment) => enrollment.id === effectiveEnrollmentId) ?? eligibleEnrollments[0];
    if (!missionEnrollment) return;
    if (missionEnrollment.id !== enrollmentId) setEnrollmentId(missionEnrollment.id);
    // Capture the learner's explicit choice at the handoff boundary. Do not rely
    // on a derived fallback that may still reflect the previous mission render.
    const requestedScenarioId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("scenario") : null;
    // A URL-backed handoff is an explicit learner choice. It must win over a
    // stale React value left by the previous mission/session during hydration.
    // This protects NRP/PALS/Heartsaver as well as the Adult ACLS path.
    const handoffScenarioId = [requestedScenarioId, selectedScenarioId].find((scenarioId) => scenarioId && scenarioCatalog.some((scenario) => scenario.id === scenarioId)) ?? effectiveScenarioId;
    setPlayingScenarioId(handoffScenarioId);
    if (typeof window !== "undefined" && handoffScenarioId) {
      const params = new URLSearchParams(window.location.search);
      params.set("scenario", handoffScenarioId);
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
    }
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
    await refreshLearningState();
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
      <div className="min-h-screen bg-slate-950 px-3 py-4 text-slate-100 sm:px-4 sm:py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <Button variant="ghost" size="sm" className="mt-0 min-h-11 shrink-0 gap-1 px-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white sm:mt-1 sm:gap-2 sm:px-3 sm:text-sm" onClick={() => setLocation("/aha-courses")}><ArrowLeft className="h-4 w-4" />Life Support Hub</Button>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300"><Gamepad2 className="h-4 w-4" />Simulation Hub</div>
                <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight sm:text-4xl">Train for the moment before it happens.</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">A consequence-based rehearsal room for emergency decisions. Your access follows the Life Support course enrollment you already hold — IERP, NERP, ILSP, self-pay, or administrator-granted access — not the way you paid or joined.</p>
              </div>
            </div>
            <div className="space-y-2"><div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100"><p className="font-semibold">Mastery, not ranking</p><p className="mt-1 text-xs text-cyan-100/70">No public leaderboard. Your opponent is hesitation, not another learner.</p></div>{selectedEnrollment && <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-100"><strong>Current pathway:</strong> {selectedEnrollment.programType.toUpperCase()} · progress below is for this enrollment</div>}</div>
          </header>

          <Card className="border-slate-800 bg-slate-900 text-white">
            <CardHeader className="pb-3"><CardTitle className="text-base">Choose your simulation pathway</CardTitle><CardDescription className="text-slate-400">Choose BLS, ACLS, PALS, NRP, or Heartsaver first. Your progress stays attached to the selected course enrollment.</CardDescription></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {PATHWAY_OPTIONS.map((option) => {
                const enrollment = enrollments.find((item) => item.programType === option.programType);
                const selected = selectedProgram === option.programType;
                return <button key={option.programType} type="button" onClick={() => enrollment ? changePathway(option.programType) : setLocation("/aha-courses")} disabled={stage === "playing"} className={`min-w-0 rounded-xl border p-4 text-left transition ${selected ? "border-cyan-300 ring-2 ring-cyan-300/30" : "border-slate-700 hover:border-slate-500"} ${option.accent} disabled:cursor-not-allowed disabled:opacity-60`}><div className="flex items-center justify-between gap-2"><span className="font-bold tracking-wide">{option.label}</span><Badge variant="outline" className={selected ? "border-cyan-200 text-cyan-100" : "border-slate-500 text-slate-300"}>{enrollment ? "Available" : "Not enrolled"}</Badge></div><p className="mt-2 text-xs leading-5 text-slate-200/80">{option.description}</p><p className="mt-3 text-xs font-semibold text-slate-200">{selected ? "Selected pathway" : enrollment ? "Open pathway →" : "View course options →"}</p></button>;
              })}
            </CardContent>
          </Card>

          {!selectedEnrollment && <Card className="border-amber-400/40 bg-amber-400/10 text-white">
            <CardHeader className="pb-2"><CardTitle className="text-base">Choose a course before starting simulations</CardTitle><CardDescription className="text-slate-300">This pathway is not enrolled on your account yet. Your attempts and Phase 2 mastery can only be saved against an active Life Support course enrollment.</CardDescription></CardHeader>
            <CardContent><Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" onClick={() => setLocation("/aha-courses")}>View Life Support course options</Button></CardContent>
          </Card>}

          <SimulationMissionHud
            pathway={effectiveProgram}
            missionTitle={selectedMission.title}
            objective={stage === "map" && recommendedMission ? `Recommended next: ${recommendedMission.title}. ${recommendedMission.objective}` : selectedMission.objective}
            stage={stage}
            practicePoints={practicePoints}
            onExit={stage === "playing" ? () => { setStage("map"); void refreshLearningState(); } : undefined}
          />

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 sm:p-4"><Target className="h-4 w-4 text-cyan-300" /><p className="mt-2 text-xl font-bold sm:mt-3 sm:text-2xl">{allCompleted}/{activeMissionCount}</p><p className="text-[11px] leading-4 text-slate-400 sm:text-xs">missions completed in this course</p></div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 sm:p-4"><Trophy className="h-4 w-4 text-amber-300" /><p className="mt-2 text-xl font-bold sm:mt-3 sm:text-2xl">{Math.max(0, ...Object.values(progress).map((item) => item.bestScore))}%</p><p className="text-[11px] leading-4 text-slate-400 sm:text-xs">best observed score in this course</p></div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 sm:p-4"><Brain className="h-4 w-4 text-violet-300" /><p className="mt-2 text-xl font-bold sm:mt-3 sm:text-2xl">{Object.values(progress).reduce((total, item) => total + item.attempts, 0)}</p><p className="text-[11px] leading-4 text-slate-400 sm:text-xs">course rehearsals completed</p></div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 sm:p-4"><ShieldAlert className="h-4 w-4 text-rose-300" /><p className="mt-2 text-xl font-bold sm:mt-3 sm:text-2xl">Safe to fail</p><p className="text-[11px] leading-4 text-slate-400 sm:text-xs">errors become coaching</p></div>
          </div>

          {phase2Status && <Card className={`border ${phase2Status.phase2Ready ? "border-emerald-400/50 bg-emerald-400/10" : "border-cyan-400/30 bg-cyan-400/10"} text-white`} aria-live="polite">
            <CardHeader className="pb-2"><CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base"><span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${phase2Status.phase2Ready ? "bg-emerald-300" : "bg-cyan-300 animate-pulse"}`} aria-hidden="true" />Phase 2 automated mastery</span><Badge className={phase2Status.phase2Ready ? "bg-emerald-400/20 text-emerald-100" : "bg-cyan-400/20 text-cyan-100"}>{phase2Status.completedRequirements}/{phase2Status.totalRequirements} requirements</Badge></CardTitle><CardDescription className="text-slate-300">The server evaluates your saved simulation rehearsals for this course. No instructor is needed to facilitate Phase 2.</CardDescription></CardHeader>
            <CardContent className="space-y-3"><div className="h-2 overflow-hidden rounded-full bg-slate-950/70" role="progressbar" aria-label="Phase 2 automated mastery progress" aria-valuemin={0} aria-valuemax={phase2Status.totalRequirements} aria-valuenow={phase2Status.completedRequirements}><div className={`h-full rounded-full transition-all ${phase2Status.phase2Ready ? "bg-emerald-300" : "bg-cyan-300"}`} style={{ width: `${phase2Status.totalRequirements ? Math.round((phase2Status.completedRequirements / phase2Status.totalRequirements) * 100) : 0}%` }} /></div><p className="text-sm font-semibold text-slate-100">{phase2Status.phase2Ready ? "Ready for the governed next step." : phase2Status.nextAction}</p><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{phase2Status.requirements.map((requirement) => <div key={requirement.id} className={`rounded-lg border p-3 text-xs ${requirement.complete ? "border-emerald-400/30 bg-emerald-400/10" : "border-slate-800 bg-slate-950/60"}`}><div className="flex items-start justify-between gap-2"><span className="font-semibold text-slate-100">{requirement.label}</span><span className={requirement.complete ? "text-emerald-300" : "text-amber-200"}>{requirement.complete ? "Complete" : `${requirement.attempts}/${requirement.requiredAttempts}`}</span></div><p className="mt-1 text-slate-400">Best qualifying score: {requirement.bestScore}% · target {requirement.minimumScore}%</p></div>)}</div><p className="text-[11px] leading-5 text-slate-400">Automated mastery makes you eligible for the governed next step; it does not issue an AHA credential or approve Phase 3 practical skills.</p></CardContent>
          </Card>}

          {stage === "map" && selectedEnrollment && (
            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <Card className="border-slate-800 bg-slate-900 text-white">
                  <CardHeader><CardTitle className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-rose-300" />Choose your next mission</CardTitle><CardDescription className="text-slate-400">Start with the first safe action. Increase uncertainty only after your basics are reliable. The Hub recommends a next mission so you do not have to manage the curriculum alone.</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  <div className="sticky top-2 z-10 rounded-lg border border-cyan-400/30 bg-slate-900/95 p-3 shadow-lg shadow-slate-950/30 backdrop-blur sm:static sm:bg-cyan-400/10 sm:shadow-none"><p className="text-xs uppercase tracking-wide text-cyan-200">Selected mission</p><p className="mt-1 font-semibold text-white">{selectedMission.title}</p><Button className="mt-3 min-h-12 w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400" size="lg" disabled={!eligibleEnrollments.length} onClick={() => setStage("briefing")}>Brief me for “{selectedMission.title}” <span className="ml-2">→</span></Button></div>
                  {eligibleMissions.map((mission) => {
                    const item = progress[mission.id];
                    const scenarioCount = getSimulationScenarioCatalog(effectiveProgram).filter((scenario) => scenario.missionId === mission.id).length;
                    const unlocked = isSimulationMissionUnlocked(mission, completedMissionIds);
                    const eligible = eligibleMissions.some((item) => item.id === mission.id);
                    const selected = mission.id === selectedMissionId;
                    return <button key={mission.id} type="button" disabled={!unlocked || !eligible} onClick={() => { setSelectedMissionId(mission.id); setSelectedScenarioId(null); }} className={`w-full rounded-xl border p-4 text-left transition ${selected ? "border-cyan-400 bg-cyan-400/10" : "border-slate-800 bg-slate-950/40 hover:border-slate-600"} disabled:cursor-not-allowed disabled:opacity-50`}><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{mission.title}</p><Badge variant="outline" className="border-slate-600 text-slate-300">{mission.difficulty}</Badge></div><p className="mt-1 text-sm text-slate-400">{mission.subtitle}</p></div>{unlocked ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" /> : <Lock className="h-5 w-5 shrink-0 text-slate-500" />}</div><div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{mission.estimatedMinutes} min</span><span>{TRACK_LABELS[mission.trackId]}</span>{scenarioCount > 0 ? <span className="text-cyan-300">{scenarioCount} scenarios</span> : null}{mission.isFormative ? <span>{mission.trackId === "cardiac_arrest" ? "Formative coaching · qualifying evidence when passed" : "Formative · not assessed"}</span> : <span>Pass {mission.masteryThreshold}%</span>}{item ? <span className="text-cyan-300">{mission.isFormative ? `${item.attempts} rehearsal${item.attempts === 1 ? "" : "s"}` : `Best ${item.bestScore}% · ${getSimulationMasteryLabel(item.attempts, item.bestScore)}`}</span> : null}</div></button>;
                  })}
                  {!eligibleMissions.length ? <p className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-100">No simulation mission is attached to this course yet. Open Life Support Hub to confirm your enrollment or contact your programme administrator.</p> : null}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="border-cyan-400/30 bg-cyan-400/10 text-white"><CardHeader><CardTitle className="text-base">Why this feels real</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-slate-200"><p className="flex gap-2"><Users className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />Team members create pressure, but do not replace your clinical reasoning.</p><p className="flex gap-2"><Activity className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />Vitals and patient state change after decisions, so you must reassess.</p><p className="flex gap-2"><Brain className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />Debrief separates knowledge, recognition, action, and communication.</p><p className="flex gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />You can retry immediately, then return later for spaced rehearsal.</p></CardContent></Card>
                <Card className="border-amber-400/30 bg-amber-400/10 text-white"><CardContent className="p-4 text-xs leading-5 text-amber-100"><strong>Training boundary:</strong> This is a scripted learning simulation. It does not replace local protocols, an instructor-led skills session, or ResusGPS during live patient care.</CardContent></Card>
                {effectiveProgram === "pals" && <Card className="border-violet-400/30 bg-violet-400/10 text-white"><CardHeader><CardTitle className="text-base">Role evidence</CardTitle><CardDescription className="text-violet-100/70">Your Simulation World attempts are tracked by role, not attendance alone.</CardDescription></CardHeader><CardContent className="space-y-2">{SIMULATION_WORLD_ROLES.map((role) => { const item = roleEvidence.get(role)!; return <div key={role} className="flex items-center justify-between rounded-lg bg-slate-950/50 px-3 py-2 text-xs"><span>{getSimulationWorldRoleLabel(role)}</span><span className={item.eligible > 0 ? "text-emerald-300" : "text-slate-400"}>{item.eligible > 0 ? `${item.eligible} evidence-ready` : `${item.attempts} rehearsal${item.attempts === 1 ? "" : "s"}`}</span></div>; })}</CardContent></Card>}
                {effectiveProgram === "pals" && recommendedRole && <Card className="border-emerald-400/30 bg-emerald-400/10 text-white"><CardHeader><CardTitle className="text-base">Next required experience</CardTitle><CardDescription className="text-emerald-100/80">The Mission Director selects the next gap instead of making you manage the curriculum.</CardDescription></CardHeader><CardContent><p className="font-semibold">{getSimulationWorldRoleLabel(recommendedRole.role)}</p><p className="mt-1 text-xs text-emerald-100/80">{recommendedRole.reason}</p></CardContent></Card>}
                  {scenarioCatalog.length > 0 && <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-3"><label htmlFor="scenario-choice" className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Choose a scenario</label><select id="scenario-choice" aria-label="Simulation scenario" className="mt-2 min-h-11 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white" value={effectiveScenarioId ?? ""} onChange={(event) => { const nextScenarioId = event.target.value; setSelectedScenarioId(nextScenarioId); if (typeof window !== "undefined") { const params = new URLSearchParams(window.location.search); params.set("scenario", nextScenarioId); window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`); } }}>{scenarioCatalog.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.title}</option>)}</select><p className="mt-2 text-xs text-cyan-100/80">{scenarioCatalog.find((scenario) => scenario.id === effectiveScenarioId)?.clinicalFocus}</p></div>}
                  <Button className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400" size="lg" disabled={!eligibleEnrollments.length} onClick={() => setStage("briefing")}>Brief me for “{selectedMission.title}” <span className="ml-2">→</span></Button>
              </div>
            </div>
          )}

          {stage === "briefing" && (
            <Card className="border-cyan-400/40 bg-slate-900 text-white"><CardHeader><Badge className="w-fit bg-cyan-400/15 text-cyan-200">Mission briefing · {selectedMission.difficulty}</Badge><CardTitle className="mt-2 text-2xl">{selectedScenario?.title ?? selectedMission.title}</CardTitle><CardDescription className="text-slate-300">{selectedScenario?.clinicalFocus ?? selectedMission.subtitle}</CardDescription>{selectedScenario && <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-cyan-200">Selected scenario · {selectedScenario.title}</p>}</CardHeader><CardContent className="space-y-5"><div className="grid gap-3 md:grid-cols-4"><div className="rounded-lg bg-slate-950 p-3"><p className="text-xs uppercase tracking-wide text-slate-500">Objective</p><p className="mt-1 text-sm">{selectedMission.objective}</p></div><div className="rounded-lg bg-slate-950 p-3"><p className="text-xs uppercase tracking-wide text-slate-500">Reality rule</p><p className="mt-1 text-sm">{selectedMission.realism}</p></div><div className="rounded-lg bg-slate-950 p-3"><p className="text-xs uppercase tracking-wide text-slate-500">Simulation room</p><p className="mt-1 text-sm">{selectedMission.id === "first-minutes" ? "Instructor-led assessment loop" : selectedMission.id === "cardiac-arrest-scenarios" ? "CPR-GPS console" : TRACK_LABELS[selectedMission.trackId]}</p></div><div className="rounded-lg bg-slate-950 p-3"><p className="text-xs uppercase tracking-wide text-slate-500">What counts</p><p className="mt-1 text-sm">{selectedMission.isFormative ? "Practice only — does not unlock Phase 2 or issue a credential." : `Formative mastery marker — target ${selectedMission.masteryThreshold}%.`}</p></div></div><div className="flex flex-wrap gap-3"><Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" disabled={!eligibleEnrollments.length} onClick={startMission}>Enter {selectedMission.id === "first-minutes" ? "the iterative assessment room" : selectedMission.id === "cardiac-arrest-scenarios" ? "the CPR-GPS console" : "the simulation room"}</Button><Button variant="outline" className="border-slate-600 text-slate-200" onClick={() => setStage("map")}>Back to mission map</Button></div></CardContent></Card>
          )}

          {stage === "playing" && effectiveEnrollmentId && (
            <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"><div><p className="text-xs uppercase tracking-[0.16em] text-cyan-300">Live {effectiveProgram.toUpperCase()} mission</p><p className="font-semibold">{selectedMission.title}</p><p className="mt-1 text-xs text-slate-400" aria-live="polite">{scenarioCatalog.find((scenario) => scenario.id === (playingScenarioId ?? effectiveScenarioId))?.title ?? "Scenario selected"} · Action feedback and patient response appear inside the room. This rehearsal is formative and does not issue a credential.</p></div>{selectedMission.trackId === "adult_acls_world" || selectedMission.trackId === "nrp_world" ? <span className="text-[11px] leading-4 text-slate-400 sm:text-xs">Use “Exit without saving” below to close this session safely.</span> : <Button size="sm" variant="outline" className="gap-2 border-slate-600 text-slate-200" onClick={() => { setStage("map"); void refreshLearningState(); }}><RotateCcw className="h-4 w-4" />Exit to map</Button>}</div><div className="rounded-xl bg-white p-3 text-slate-950">{selectedMission.trackId === "adult_acls_world" && effectiveProgram === "acls" && <AdultAclsSimulationRoom key={`acls-${effectiveEnrollmentId}-${playingScenarioId ?? effectiveScenarioId ?? "default"}`} enrollmentId={effectiveEnrollmentId} initialScenarioId={(playingScenarioId ?? effectiveScenarioId) as never} onComplete={() => void refreshLearningState()} onExit={() => { setStage("map"); void refreshLearningState(); }} />}{selectedMission.trackId === "nrp_world" && effectiveProgram === "nrp" && <NrpSimulationRoom enrollmentId={effectiveEnrollmentId} initialScenarioId={effectiveScenarioId as never} onComplete={() => void refreshLearningState()} onExit={() => { setStage("map"); void refreshLearningState(); }} />}{selectedMission.trackId === "simulation_world" && <SimulationWorldRoom {...trackProps} onComplete={() => void refreshLearningState()} />}{selectedMission.trackId === "cardiac_arrest" && selectedMission.id === "first-minutes" && <InteractiveResuscitationTrack programType={effectiveProgram} enrollmentId={effectiveEnrollmentId} onExit={() => { setStage("map"); void refreshLearningState(); }} />}{selectedMission.trackId === "cardiac_arrest" && selectedMission.id === "cardiac-arrest-scenarios" && <CardiacArrestTrack {...trackProps} initialScenarioId={effectiveScenarioId ?? undefined} onExit={() => { setStage("map"); void refreshLearningState(); }} />}{selectedMission.trackId === "abcde" && <AbcdeTrack {...trackProps} initialScenarioId={effectiveScenarioId ?? undefined} />}{selectedMission.trackId === "rhythm_recognition" && <RhythmRecognitionTrack {...trackProps} initialScenarioId={effectiveScenarioId ?? undefined} />}{selectedMission.trackId === "ai_interactive_roleplay" && <AiRoleplayTrack {...trackProps} />}{selectedMission.trackId === "shock_no_shock" && <ShockNoShockTrack {...trackProps} initialScenarioId={effectiveScenarioId ?? undefined} />}{selectedMission.trackId === "pals_capstone" && <div className="space-y-4"><PalsCapstoneSimulation key={capstoneKey} patientAge={2} patientWeight={12} onComplete={handleCapstoneComplete} onClose={() => setStage("map")} />{capstoneResult && <Card className="border-emerald-200 bg-emerald-50"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold text-emerald-900">{capstoneResult.simReady ? "Capstone passed — Sim-Ready" : "Capstone complete — another rehearsal recommended"}</p><p className="text-sm text-emerald-800">Score {capstoneResult.score}%. Use the debrief and repeat the weak phase before progressing.</p></div><Button size="sm" variant="outline" onClick={() => { setCapstoneResult(null); setCapstoneKey((key) => key + 1); }}>Repeat capstone</Button></CardContent></Card>}</div>}</div></div>
          )}
        </div>
      </div>
    </PracticeLabGate>
  );
}
