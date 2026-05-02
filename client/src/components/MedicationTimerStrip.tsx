/**
 * MedicationTimerStrip
 *
 * Displays a compact row of live countdown timers for interventions that are
 * currently in_progress. Each timer counts down to the next reassessment or
 * repeat-dose window based on the drug type.
 *
 * Clinical rationale: In a resuscitation, providers lose track of time.
 * Epinephrine must be repeated every 3–5 minutes in cardiac arrest. Adenosine
 * must be reassessed within 1–2 minutes. This strip prevents missed doses and
 * premature repeats.
 *
 * Drug-specific timer durations (AHA 2020 PALS):
 *   Epinephrine   → 3 min (minimum repeat interval in arrest)
 *   Adenosine     → 2 min (reassess for SVT termination)
 *   Amiodarone    → 5 min (reassess rhythm)
 *   Atropine      → 3 min (repeat if bradycardia persists)
 *   Fluid bolus   → 15 min (reassess perfusion after bolus)
 *   Default drug  → 5 min
 */

import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Timer, AlertTriangle } from 'lucide-react';
import type { Intervention } from '@/lib/resus/abcdeEngine';

// ─── Timer duration lookup ────────────────────────────────────

function getTimerDuration(action: string): number {
  const a = action.toLowerCase();
  if (a.includes('epinephrine') || a.includes('adrenaline')) return 180; // 3 min
  if (a.includes('adenosine')) return 120; // 2 min
  if (a.includes('amiodarone')) return 300; // 5 min
  if (a.includes('atropine')) return 180; // 3 min
  if (a.includes('fluid') || a.includes('bolus') || a.includes('saline') || a.includes('ringer')) return 900; // 15 min
  if (a.includes('salbutamol') || a.includes('albuterol')) return 1200; // 20 min
  if (a.includes('magnesium')) return 1200; // 20 min
  return 300; // 5 min default
}

function getReassessPrompt(action: string): string {
  const a = action.toLowerCase();
  if (a.includes('epinephrine') || a.includes('adrenaline')) return 'Reassess for ROSC — repeat epi if no pulse';
  if (a.includes('adenosine')) return 'Reassess rhythm — SVT terminated?';
  if (a.includes('amiodarone')) return 'Reassess rhythm — defibrillate if VF/VT persists';
  if (a.includes('atropine')) return 'Reassess HR — repeat atropine if bradycardia persists';
  if (a.includes('fluid') || a.includes('bolus')) return 'Reassess perfusion — HR, CRT, mental status';
  if (a.includes('salbutamol') || a.includes('albuterol')) return 'Reassess work of breathing — repeat neb if needed';
  if (a.includes('magnesium')) return 'Reassess bronchospasm / rhythm';
  return 'Reassess response to intervention';
}

// ─── Single timer hook ────────────────────────────────────────

function useInterventionTimer(startedAt: number, durationSeconds: number) {
  const [remaining, setRemaining] = useState<number>(() => {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(0, durationSeconds - elapsed);
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertedRef = useRef(false);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const rem = Math.max(0, durationSeconds - elapsed);
      setRemaining(rem);
      if (rem === 0 && !alertedRef.current) {
        alertedRef.current = true;
        playAlert();
      }
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startedAt, durationSeconds]);

  return remaining;
}

function playAlert() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Audio not available — silent fail
  }
}

function formatRemaining(seconds: number): string {
  if (seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Single timer chip ────────────────────────────────────────

function TimerChip({
  intervention,
}: {
  intervention: Intervention;
}) {
  const startedAt = intervention.startedAt ?? Date.now();
  const duration = getTimerDuration(intervention.action);
  const remaining = useInterventionTimer(startedAt, duration);
  const prompt = getReassessPrompt(intervention.action);

  const pct = remaining / duration;
  const urgency = pct <= 0.1 ? 'critical' : pct <= 0.3 ? 'warning' : 'normal';

  const colorClass =
    urgency === 'critical'
      ? 'border-red-500/60 text-red-400 bg-red-500/10 animate-pulse'
      : urgency === 'warning'
      ? 'border-amber-500/60 text-amber-400 bg-amber-500/10'
      : 'border-blue-500/40 text-blue-400 bg-blue-500/10';

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs ${colorClass}`}
      title={prompt}
    >
      {urgency === 'critical' ? (
        <AlertTriangle className="h-3 w-3 shrink-0" />
      ) : (
        <Timer className="h-3 w-3 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="font-semibold truncate max-w-[120px]">{intervention.action.split(' ').slice(0, 3).join(' ')}</p>
        {remaining > 0 ? (
          <p className="text-[10px] opacity-80">Reassess in {formatRemaining(remaining)}</p>
        ) : (
          <p className="text-[10px] font-bold">{prompt}</p>
        )}
      </div>
    </div>
  );
}

// ─── Main strip ───────────────────────────────────────────────

interface MedicationTimerStripProps {
  /** All threats from the current session */
  threats: Array<{
    interventions: Intervention[];
  }>;
}

export function MedicationTimerStrip({ threats }: MedicationTimerStripProps) {
  const inProgress = threats
    .flatMap((t) => t.interventions)
    .filter((i) => i.status === 'in_progress' && i.dose); // only drug interventions

  if (inProgress.length === 0) return null;

  return (
    <div className="px-4 py-2 border-b border-border bg-background/80 backdrop-blur">
      <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1.5 flex items-center gap-1">
        <Timer className="h-3 w-3" /> Active Medication Timers
      </p>
      <div className="flex flex-wrap gap-2">
        {inProgress.map((i) => (
          <TimerChip key={i.id} intervention={i} />
        ))}
      </div>
    </div>
  );
}
