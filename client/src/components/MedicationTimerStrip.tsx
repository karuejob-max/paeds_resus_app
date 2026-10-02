/**
 * MedicationTimerStrip — displays persisted engine deadlines only.
 * The timer is a reassessment reminder, never an instruction to repeat a dose.
 */

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Timer, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Intervention } from '@/lib/resus/abcdeEngine';

export type TimerDisplay = {
  state: 'waiting' | 'due' | 'overdue' | 'clock_check';
  seconds: number;
};

export function deriveTimerDisplay(
  endsAt: number,
  now: number,
  startedAt?: number,
  clockChanged = false,
): TimerDisplay {
  if (clockChanged || (startedAt != null && now < startedAt)) return { state: 'clock_check', seconds: 0 };
  const deltaSeconds = Math.ceil((endsAt - now) / 1000);
  if (deltaSeconds > 0) return { state: 'waiting', seconds: deltaSeconds };
  const overdueSeconds = Math.max(0, Math.floor((now - endsAt) / 1000));
  return { state: overdueSeconds > 0 ? 'overdue' : 'due', seconds: overdueSeconds };
}

function formatRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function TimerChip({
  intervention,
  deadline,
  now,
  clockChanged,
  reassessmentRequired,
  onReassessNow,
}: {
  intervention: Intervention;
  deadline?: { endsAt: number; startedAt?: number };
  now: number;
  clockChanged: boolean;
  reassessmentRequired: boolean;
  onReassessNow?: (id: string) => void;
}) {
  const status = deadline
    ? deriveTimerDisplay(deadline.endsAt, now, deadline.startedAt, clockChanged)
    : { state: reassessmentRequired ? 'due' as const : 'waiting' as const, seconds: 0 };
  const ready = status.state !== 'waiting';
  const prompt = intervention.reassessAfter?.trim() || 'Reassessment is due; review the patient and document observed findings.';
  const colorClass = status.state === 'clock_check'
    ? 'border-red-500/70 text-red-300 bg-red-500/15'
    : status.state === 'overdue'
      ? 'border-red-500/60 text-red-300 bg-red-500/10'
      : ready
        ? 'border-amber-500/60 text-amber-300 bg-amber-500/10'
        : 'border-blue-500/40 text-blue-300 bg-blue-500/10';

  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs ${colorClass}`}>
      {ready ? <AlertTriangle className="h-3 w-3 shrink-0" /> : <Timer className="h-3 w-3 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="font-semibold truncate max-w-[180px]">{intervention.action.split(' ').slice(0, 5).join(' ')}</p>
        {status.state === 'waiting' ? (
          <p className="text-[10px] opacity-80">Reassessment reminder in {formatRemaining(status.seconds)}</p>
        ) : status.state === 'clock_check' ? (
          <p className="text-[10px] font-bold">Device time changed — verify the patient now</p>
        ) : status.state === 'overdue' ? (
          <p className="text-[10px] font-bold">Reassessment overdue by {formatRemaining(status.seconds)}</p>
        ) : (
          <p className="text-[10px] font-bold">Reassessment due — {prompt}</p>
        )}
        {ready && <p className="text-[10px] opacity-80">Reminder only; do not repeat a medication solely because this timer elapsed.</p>}
      </div>
      {ready && onReassessNow && (
        <Button size="sm" variant="outline" className="h-6 text-[10px] shrink-0" onClick={() => onReassessNow(intervention.id)}>
          Open reassessment
        </Button>
      )}
    </div>
  );
}

interface MedicationTimerStripProps {
  threats: Array<{ interventions: Intervention[] }>;
  activeTimers: Array<{ interventionId: string; endsAt: number; startedAt?: number; durationSeconds?: number }>;
  reassessmentRequiredIds?: string[];
  onReassessNow?: (interventionId: string) => void;
}

export function MedicationTimerStrip({
  threats,
  activeTimers,
  reassessmentRequiredIds = [],
  onReassessNow,
}: MedicationTimerStripProps) {
  const [now, setNow] = useState(() => Date.now());
  const [clockChanged, setClockChanged] = useState(false);

  useEffect(() => {
    let previousWall = Date.now();
    let previousMonotonic = typeof performance !== 'undefined' ? performance.now() : previousWall;
    const interval = window.setInterval(() => {
      const wall = Date.now();
      const monotonic = typeof performance !== 'undefined' ? performance.now() : wall;
      if (Math.abs((wall - previousWall) - (monotonic - previousMonotonic)) > 5_000) setClockChanged(true);
      previousWall = wall;
      previousMonotonic = monotonic;
      setNow(wall);
    }, 1_000);
    return () => window.clearInterval(interval);
  }, []);

  const interventionsById = useMemo(() => {
    const entries = threats.flatMap((threat) => threat.interventions).map((intervention) => [intervention.id, intervention] as const);
    return new Map(entries);
  }, [threats]);
  const deadlinesById = useMemo(
    () => new Map(activeTimers.map((deadline) => [deadline.interventionId, deadline])),
    [activeTimers],
  );
  const requiredIds = useMemo(() => new Set(reassessmentRequiredIds), [reassessmentRequiredIds]);
  const timed = useMemo(() => {
    const ids = new Set([...deadlinesById.keys(), ...requiredIds]);
    return [...ids]
      .map((id) => ({ intervention: interventionsById.get(id), deadline: deadlinesById.get(id), required: requiredIds.has(id) }))
      .filter((item): item is { intervention: Intervention; deadline: { interventionId: string; endsAt: number; startedAt?: number; durationSeconds?: number } | undefined; required: boolean } => Boolean(item.intervention))
      .filter(({ intervention, deadline, required }) => required || (deadline != null && intervention.status === 'completed'));
  }, [deadlinesById, interventionsById, requiredIds]);

  if (timed.length === 0) return null;

  return (
    <div className="px-4 py-2 border-b border-border bg-background/80 backdrop-blur">
      <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1.5 flex items-center gap-1">
        <Timer className="h-3 w-3" /> Reassessment reminders
      </p>
      <div className="flex flex-wrap gap-2">
        {timed.map(({ intervention, deadline, required }) => (
          <TimerChip
            key={intervention.id}
            intervention={intervention}
            deadline={deadline}
            now={now}
            clockChanged={clockChanged}
            reassessmentRequired={required}
            onReassessNow={onReassessNow}
          />
        ))}
      </div>
    </div>
  );
}
