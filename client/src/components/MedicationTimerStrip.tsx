/**
 * MedicationTimerStrip — bolus/medication reassessment timers.
 * Shows remaining time OR "Ready to reassess" when complete or timer elapsed.
 */

import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Timer, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Intervention } from '@/lib/resus/abcdeEngine';

function getTimerDuration(action: string): number {
  const a = action.toLowerCase();
  if (a.includes('epinephrine') || a.includes('adrenaline')) return 180;
  if (a.includes('adenosine')) return 120;
  if (a.includes('amiodarone')) return 300;
  if (a.includes('atropine')) return 180;
  if (a.includes('fluid') || a.includes('bolus') || a.includes('saline') || a.includes('ringer')) return 900;
  if (a.includes('salbutamol') || a.includes('albuterol')) return 1200;
  if (a.includes('magnesium')) return 1200;
  return 300;
}

function getReassessPrompt(action: string): string {
  const a = action.toLowerCase();
  if (a.includes('epinephrine') || a.includes('adrenaline')) return 'Reassess for ROSC — repeat epi if no pulse';
  if (a.includes('adenosine')) return 'Reassess rhythm — SVT terminated?';
  if (a.includes('amiodarone')) return 'Reassess rhythm — defibrillate if VF/VT persists';
  if (a.includes('atropine')) return 'Reassess HR — repeat atropine if bradycardia persists';
  if (a.includes('fluid') || a.includes('bolus')) return 'Ready to reassess — HR, BP, CRT, perfusion';
  if (a.includes('salbutamol') || a.includes('albuterol')) return 'Reassess work of breathing';
  if (a.includes('magnesium')) return 'Reassess bronchospasm / rhythm';
  return 'Ready to reassess response';
}

function useInterventionTimer(startedAt: number, durationSeconds: number, readyEarly: boolean) {
  const [remaining, setRemaining] = useState<number>(() => {
    if (readyEarly) return 0;
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(0, durationSeconds - elapsed);
  });

  useEffect(() => {
    if (readyEarly) {
      setRemaining(0);
      return;
    }
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setRemaining(Math.max(0, durationSeconds - elapsed));
    }, 500);
    return () => clearInterval(id);
  }, [startedAt, durationSeconds, readyEarly]);

  return remaining;
}

function formatRemaining(seconds: number): string {
  if (seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function TimerChip({
  intervention,
  onReassessNow,
}: {
  intervention: Intervention;
  onReassessNow?: (id: string) => void;
}) {
  const isBolus =
    intervention.action.toLowerCase().includes('bolus') ||
    intervention.action.toLowerCase().includes('fluid');
  const readyEarly = intervention.status === 'completed';
  const startedAt = intervention.startedAt ?? intervention.completedAt ?? Date.now();
  const duration = getTimerDuration(intervention.action);
  const remaining = useInterventionTimer(startedAt, duration, readyEarly);
  const prompt = getReassessPrompt(intervention.action);
  const isReady = remaining <= 0 || readyEarly;

  const pct = duration > 0 ? remaining / duration : 0;
  const urgency = isReady ? 'ready' : pct <= 0.3 ? 'warning' : 'normal';

  const colorClass =
    urgency === 'ready'
      ? 'border-green-500/50 text-green-400 bg-green-500/10'
      : urgency === 'warning'
        ? 'border-amber-500/60 text-amber-400 bg-amber-500/10'
        : 'border-blue-500/40 text-blue-400 bg-blue-500/10';

  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs ${colorClass}`}>
      {isReady ? (
        <CheckCircle2 className="h-3 w-3 shrink-0" />
      ) : urgency === 'warning' ? (
        <AlertTriangle className="h-3 w-3 shrink-0" />
      ) : (
        <Timer className="h-3 w-3 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold truncate max-w-[140px]">
          {intervention.action.split(' ').slice(0, 4).join(' ')}
        </p>
        {isReady ? (
          <p className="text-[10px] font-bold">{isBolus ? 'Bolus complete — re-check now' : prompt}</p>
        ) : (
          <p className="text-[10px] opacity-80">Reassess in {formatRemaining(remaining)}</p>
        )}
      </div>
      {isReady && onReassessNow && (
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[10px] shrink-0"
          onClick={() => onReassessNow(intervention.id)}
        >
          Re-check
        </Button>
      )}
    </div>
  );
}

interface MedicationTimerStripProps {
  threats: Array<{ interventions: Intervention[] }>;
  onReassessNow?: (interventionId: string) => void;
}

export function MedicationTimerStrip({ threats, onReassessNow }: MedicationTimerStripProps) {
  const timed = threats
    .flatMap((t) => t.interventions)
    .filter(
      (i) =>
        i.dose &&
        (i.status === 'in_progress' ||
          (i.status === 'completed' &&
            (i.action.toLowerCase().includes('bolus') ||
              i.action.toLowerCase().includes('fluid') ||
              i.reassessmentChecks?.length)))
    );

  if (timed.length === 0) return null;

  return (
    <div className="px-4 py-2 border-b border-border bg-background/80 backdrop-blur">
      <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1.5 flex items-center gap-1">
        <Timer className="h-3 w-3" /> Bolus &amp; medication timers
      </p>
      <div className="flex flex-wrap gap-2">
        {timed.map((i) => (
          <TimerChip key={i.id} intervention={i} onReassessNow={onReassessNow} />
        ))}
      </div>
    </div>
  );
}
