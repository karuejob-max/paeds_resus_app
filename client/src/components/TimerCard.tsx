/**
 * Timer Card Component
 * 
 * Displays a countdown timer with visual urgency indicators and controls.
 * Shows timer label, remaining time, and action buttons.
 */

import { Clock, Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CountdownTimer,
  formatRemainingTime,
  getTimerColorClass,
} from '@/lib/resus/countdown-timer';

interface TimerCardProps {
  timer: CountdownTimer;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  isExpired: boolean;
}

export function TimerCard({
  timer,
  onPause,
  onResume,
  onReset,
  isExpired,
}: TimerCardProps) {
  const colorClass = getTimerColorClass(timer);
  const timeDisplay = formatRemainingTime(timer);

  return (
    <Card className={`border ${colorClass}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          {/* Timer Info */}
          <div className="flex items-center gap-2 flex-1">
            <Clock className="h-4 w-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{timer.label}</p>
              {timer.reassessmentPrompt && (
                <p className="text-[10px] text-muted-foreground truncate">
                  {timer.reassessmentPrompt}
                </p>
              )}
            </div>
          </div>

          {/* Time Display */}
          <div className="text-right">
            <p className="text-lg font-mono font-bold">{timeDisplay}</p>
            {isExpired && (
              <p className="text-[10px] font-medium text-red-500">EXPIRED</p>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-1 shrink-0">
            {timer.isRunning ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={onPause}
                title="Pause timer"
              >
                <Pause className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={onResume}
                title="Resume timer"
              >
                <Play className="h-3.5 w-3.5" />
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={onReset}
              title="Reset timer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1 bg-background/50 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              isExpired ? 'bg-red-500' : 'bg-current'
            }`}
            style={{
              width: `${Math.max(0, (timer.remainingSeconds / timer.durationSeconds) * 100)}%`,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
