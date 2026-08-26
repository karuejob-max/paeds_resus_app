import { Activity, CheckCircle2, Play, Syringe, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type {
  CompressionCycleStatus,
  EpiTimingState,
  RhythmType,
} from '@/lib/resus/cpr-engine';
import type { LifeSupportPackResult } from '@/lib/resus/cpr-pack-resolver';

type ArrestPhase =
  | 'initial_assessment'
  | 'compressions'
  | 'reassessment'
  | 'rhythm_check'
  | 'charging'
  | 'shock_ready'
  | 'post_shock';

interface Props {
  phase: ArrestPhase;
  effectiveIsRunning: boolean;
  effectiveRoscAchieved: boolean;
  autoStart?: boolean;
  effectiveArrestDuration: number;
  patientWeight: number;
  lifeSupportPack?: LifeSupportPackResult;
  compressionCycle: CompressionCycleStatus;
  reassessmentTime: number;
  rhythmWindowElapsed: number | null;
  activeAlerts: Array<{
    type: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
  }>;
  effectiveCycleNumber: number;
  effectiveShockCount: number;
  effectiveEpiDoses: number;
  effectiveRhythmType: RhythmType | null;
  epiState: EpiTimingState;
  epiDose: number;
  shockEnergyLabel: string;
  formatTime: (seconds: number) => string;
  onStartArrest: () => void;
  onPadsAttached: () => void;
  onDeliverShock: () => void;
  onDisarmDefib: () => void;
  onGiveEpinephrine: () => void;
  onShowRoscConfirm: () => void;
  documentationLog: React.ReactNode;
}

function rhythmLabel(rhythm: RhythmType | null): string {
  if (rhythm === 'vf_pvt') return 'VF/pVT · shockable';
  if (rhythm === 'pea') return 'PEA · non-shockable';
  if (rhythm === 'asystole') return 'Asystole · non-shockable';
  return 'Rhythm not yet documented';
}

function currentActionCopy(
  phase: ArrestPhase,
  compressionCycle: CompressionCycleStatus,
  reassessmentTime: number,
  shockEnergyLabel: string,
): { title: string; instruction: string; tone: 'red' | 'amber' | 'blue' | 'green' } {
  if (phase === 'initial_assessment') {
    return {
      title: 'ATTACH PADS',
      instruction: 'Continue chest compressions while pads are attached, then assess rhythm.',
      tone: 'blue',
    };
  }
  if (phase === 'reassessment') {
    return {
      title: 'STOP — CHECK RHYTHM',
      instruction: `Keep the interruption under 10 seconds. ${Math.max(0, reassessmentTime)} seconds remaining in the check window.`,
      tone: 'amber',
    };
  }
  if (phase === 'shock_ready') {
    return {
      title: 'CLEAR THE PATIENT — SHOCK',
      instruction: `${shockEnergyLabel}. Confirm everyone is clear, deliver the shock, and resume compressions immediately.`,
      tone: 'amber',
    };
  }
  if (phase === 'charging') {
    return {
      title: 'CHARGING',
      instruction: `Clear the patient. ${shockEnergyLabel}.`,
      tone: 'amber',
    };
  }
  if (phase === 'post_shock') {
    return {
      title: 'RESUME COMPRESSIONS',
      instruction: 'Restart chest compressions immediately after the shock.',
      tone: 'red',
    };
  }
  return {
    title: compressionCycle.phase === 'precharge_alert' ? 'PRE-CHARGE DEFIBRILLATOR' : 'CONTINUE COMPRESSIONS',
    instruction:
      compressionCycle.phase === 'precharge_alert'
        ? 'Charge before the rhythm check while maintaining compressions.'
        : 'Keep high-quality compressions going. The next rhythm check is shown below.',
    tone: compressionCycle.phase === 'precharge_alert' ? 'amber' : 'red',
  };
}

const toneClasses = {
  red: 'border-red-500/70 bg-red-950/50 text-red-50',
  amber: 'border-amber-400/80 bg-amber-950/50 text-amber-50',
  blue: 'border-sky-400/80 bg-sky-950/50 text-sky-50',
  green: 'border-emerald-400/80 bg-emerald-950/50 text-emerald-50',
} as const;

export function CprArrestCommandConsole({
  phase,
  effectiveIsRunning,
  effectiveRoscAchieved,
  autoStart,
  effectiveArrestDuration,
  patientWeight,
  lifeSupportPack,
  compressionCycle,
  reassessmentTime,
  rhythmWindowElapsed,
  activeAlerts,
  effectiveCycleNumber,
  effectiveShockCount,
  effectiveEpiDoses,
  effectiveRhythmType,
  epiState,
  epiDose,
  shockEnergyLabel,
  formatTime,
  onStartArrest,
  onPadsAttached,
  onDeliverShock,
  onDisarmDefib,
  onGiveEpinephrine,
  onShowRoscConfirm,
  documentationLog,
}: Props) {
  const action = currentActionCopy(phase, compressionCycle, reassessmentTime, shockEnergyLabel);
  const visibleAlert = activeAlerts.find((alert) => alert.severity === 'critical') ?? activeAlerts[0];
  const rhythmWindowRemaining =
    rhythmWindowElapsed === null ? null : Math.max(0, 10 - rhythmWindowElapsed);

  if (!effectiveIsRunning && !effectiveRoscAchieved && !autoStart) {
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-slate-950 p-4 sm:p-6">
        <Card className="w-full max-w-md border-red-500/60 bg-slate-900 text-white">
          <CardContent className="space-y-5 p-5 text-center sm:p-7">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-red-400">
              <Activity className="h-8 w-8" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">Arrest console ready</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Start CPR-GPS</h2>
              <p className="mt-2 text-sm text-slate-300">Start hands-on CPR first. Use the console to coordinate timing and rhythm actions.</p>
            </div>
            <Button onClick={onStartArrest} className="min-h-14 w-full bg-red-600 text-lg font-bold hover:bg-red-700">
              <Play className="mr-2 h-6 w-6" aria-hidden />
              START CPR-GPS
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!effectiveIsRunning && !effectiveRoscAchieved && autoStart) {
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center bg-slate-950 p-4 text-center text-white">
        <div>
          <Activity className="mx-auto h-10 w-10 animate-pulse text-sky-400" aria-hidden />
          <p className="mt-3 text-lg font-semibold">Syncing CPR-GPS clock…</p>
        </div>
      </main>
    );
  }

  if (effectiveRoscAchieved) {
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-slate-950 p-4 sm:p-6">
        <Card className="w-full max-w-md border-emerald-500/70 bg-emerald-950/50 text-white">
          <CardContent className="space-y-4 p-5 text-center sm:p-7">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-300" aria-hidden />
            <h2 className="text-3xl font-bold">ROSC ACHIEVED</h2>
            <p className="text-slate-200">Total arrest duration: {formatTime(effectiveArrestDuration)}</p>
            <p className="text-sm text-slate-300">Continue in the parent ResusGPS post-cardiac-arrest care pathway.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-slate-950 p-3 sm:p-5">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 pb-6">
        <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 sm:px-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Current action</p>
            <p className="truncate text-sm font-semibold text-white sm:text-base">{rhythmLabel(effectiveRhythmType)}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-2xl font-bold leading-none text-white sm:text-3xl">{formatTime(effectiveArrestDuration)}</p>
            <p className="mt-1 text-[11px] text-slate-400">{patientWeight} kg · {lifeSupportPack?.pack ?? 'PALS'} pathway</p>
          </div>
        </div>

        <Card className={`border-2 shadow-lg ${toneClasses[action.tone]}`} role="status" aria-live="assertive">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">Do this now</p>
                <h2 className="mt-1 text-3xl font-black leading-tight sm:text-5xl">{action.title}</h2>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 sm:text-base">{action.instruction}</p>
              </div>
              <div className="shrink-0 rounded-lg border border-current/30 px-2 py-1 text-right">
                <p className="text-[10px] uppercase tracking-wide opacity-75">Cycle</p>
                <p className="font-mono text-2xl font-bold">{effectiveCycleNumber}</p>
              </div>
            </div>

            {phase === 'compressions' && (
              <div className="flex items-end justify-between gap-3 rounded-lg bg-black/25 px-3 py-2.5">
                <div>
                  <p className="text-xs uppercase tracking-wide opacity-75">Rhythm check in</p>
                  <p className="font-mono text-3xl font-bold">{formatTime(compressionCycle.countdownToRhythmCheck)}</p>
                </div>
                <p className="max-w-[12rem] text-right text-xs font-semibold opacity-90">
                  {compressionCycle.phase === 'precharge_alert' ? 'Charge now; keep compressions going.' : 'Keep hands on the chest.'}
                </p>
              </div>
            )}

            {phase === 'reassessment' && rhythmWindowRemaining !== null && (
              <div className="rounded-lg bg-black/25 px-3 py-2.5 text-center">
                <p className="text-xs uppercase tracking-wide opacity-75">Rhythm / shock window</p>
                <p className="font-mono text-3xl font-bold">{rhythmWindowRemaining}s</p>
              </div>
            )}

            {phase === 'shock_ready' && (
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Button onClick={onDeliverShock} className="min-h-14 bg-amber-400 text-lg font-black text-black hover:bg-amber-300 sm:text-xl">
                  <Zap className="mr-2 h-6 w-6" aria-hidden />
                  CLEAR &amp; SHOCK
                </Button>
                <Button onClick={onDisarmDefib} variant="outline" className="min-h-14 border-white/40 bg-transparent text-white hover:bg-white/10">
                  Disarm
                </Button>
              </div>
            )}

            {phase === 'initial_assessment' && (
              <Button onClick={onPadsAttached} className="min-h-14 w-full bg-sky-600 text-base font-bold hover:bg-sky-500 sm:text-lg">
                <CheckCircle2 className="mr-2 h-5 w-5" aria-hidden />
                Pads attached — assess rhythm
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-2" aria-label="Arrest summary">
          <Card className="border-slate-700 bg-slate-900 text-white"><CardContent className="p-3 text-center"><p className="font-mono text-2xl font-bold">{effectiveShockCount}</p><p className="text-[11px] uppercase tracking-wide text-slate-400">Shocks</p></CardContent></Card>
          <Card className="border-slate-700 bg-slate-900 text-white"><CardContent className="p-3 text-center"><p className="font-mono text-2xl font-bold">{effectiveEpiDoses}</p><p className="text-[11px] uppercase tracking-wide text-slate-400">Epi doses</p></CardContent></Card>
          <Card className="border-slate-700 bg-slate-900 text-white"><CardContent className="p-3 text-center"><p className="font-mono text-2xl font-bold">{formatTime(compressionCycle.countdownToRhythmCheck)}</p><p className="text-[11px] uppercase tracking-wide text-slate-400">Next check</p></CardContent></Card>
        </div>

        {visibleAlert && (
          <div className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${visibleAlert.severity === 'critical' ? 'border-red-500/70 bg-red-950/50 text-red-100' : visibleAlert.severity === 'warning' ? 'border-amber-400/70 bg-amber-950/40 text-amber-100' : 'border-sky-400/70 bg-sky-950/40 text-sky-100'}`} role="alert">
            {visibleAlert.message}
          </div>
        )}

        {epiState !== 'not_due' && (
          <Button onClick={onGiveEpinephrine} className={`min-h-14 w-full justify-center text-base font-bold sm:text-lg ${epiState === 'overdue' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
            <Syringe className="mr-2 h-5 w-5" aria-hidden />
            {epiState === 'overdue' ? 'GIVE EPINEPHRINE NOW' : `Prepare epinephrine ${epiDose} mg`}
          </Button>
        )}

        <Button onClick={onShowRoscConfirm} variant="outline" className="min-h-12 border-emerald-400/70 bg-emerald-950/20 text-emerald-100 hover:bg-emerald-900/40">
          <CheckCircle2 className="mr-2 h-5 w-5" aria-hidden />
          Confirm sustained pulse / ROSC
        </Button>

        {documentationLog}
      </div>
    </main>
  );
}
