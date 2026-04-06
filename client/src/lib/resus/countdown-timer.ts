/**
 * Countdown Timer Utility for ResusGPS
 * 
 * Manages time-critical intervention timers:
 * - CPR timer: Counts up, prompts reassessment every 2 minutes
 * - Medication timer: Counts down from 3-5 min, prompts "reassess for response"
 * - Intervention timer: Custom duration (e.g., "reassess after 10 min")
 * 
 * Clinical rationale: Resuscitation is time-critical. Timers ensure providers
 * reassess at appropriate intervals and don't lose track of time.
 */

export type TimerType = 'cpr' | 'medication' | 'intervention';

export interface CountdownTimer {
  id: string;
  type: TimerType;
  label: string;
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  startedAt: number;
  endsAt: number;
  reassessmentPrompt?: string;
  onExpiry?: () => void;
}

/**
 * Create a new countdown timer
 */
export function createTimer(
  id: string,
  type: TimerType,
  label: string,
  durationSeconds: number,
  reassessmentPrompt?: string,
  onExpiry?: () => void
): CountdownTimer {
  const now = Date.now();
  
  return {
    id,
    type,
    label,
    durationSeconds,
    remainingSeconds: durationSeconds,
    isRunning: true,
    startedAt: now,
    endsAt: now + durationSeconds * 1000,
    reassessmentPrompt,
    onExpiry,
  };
}

/**
 * Update timer state (call this on each tick)
 */
export function updateTimer(timer: CountdownTimer): CountdownTimer {
  if (!timer.isRunning) {
    return timer;
  }
  
  const now = Date.now();
  const remainingMs = Math.max(0, timer.endsAt - now);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  
  return {
    ...timer,
    remainingSeconds,
    isRunning: remainingSeconds > 0,
  };
}

/**
 * Check if timer has expired
 */
export function hasTimerExpired(timer: CountdownTimer): boolean {
  return timer.remainingSeconds <= 0;
}

/**
 * Format remaining time for display (e.g., "2:45", "45s")
 */
export function formatRemainingTime(timer: CountdownTimer): string {
  const seconds = timer.remainingSeconds;
  
  if (seconds <= 0) {
    return '0:00';
  }
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get urgency level based on remaining time
 */
export function getTimerUrgency(timer: CountdownTimer): 'normal' | 'warning' | 'critical' {
  const percentRemaining = (timer.remainingSeconds / timer.durationSeconds) * 100;
  
  if (percentRemaining <= 10) {
    return 'critical'; // Red
  } else if (percentRemaining <= 30) {
    return 'warning'; // Yellow
  } else {
    return 'normal'; // Green
  }
}

/**
 * Pause a running timer
 */
export function pauseTimer(timer: CountdownTimer): CountdownTimer {
  return {
    ...timer,
    isRunning: false,
  };
}

/**
 * Resume a paused timer
 */
export function resumeTimer(timer: CountdownTimer): CountdownTimer {
  if (timer.isRunning) return timer;
  
  const now = Date.now();
  const newEndsAt = now + timer.remainingSeconds * 1000;
  
  return {
    ...timer,
    isRunning: true,
    startedAt: now,
    endsAt: newEndsAt,
  };
}

/**
 * Reset timer to full duration
 */
export function resetTimer(timer: CountdownTimer): CountdownTimer {
  const now = Date.now();
  
  return {
    ...timer,
    remainingSeconds: timer.durationSeconds,
    isRunning: true,
    startedAt: now,
    endsAt: now + timer.durationSeconds * 1000,
  };
}

/**
 * Create CPR timer (counts up, prompts reassessment every 2 min)
 */
export function createCPRTimer(onReassessmentPrompt?: () => void): CountdownTimer {
  return createTimer(
    'cpr-timer',
    'cpr',
    'CPR in progress',
    120, // 2 minutes
    'Time to reassess CPR quality and check for ROSC',
    onReassessmentPrompt
  );
}

/**
 * Create medication timer (3-5 min, prompts reassess for response)
 */
export function createMedicationTimer(
  drug: string,
  durationSeconds: number = 180, // 3 minutes default
  onReassessmentPrompt?: () => void
): CountdownTimer {
  return createTimer(
    `med-timer-${Date.now()}`,
    'medication',
    `${drug} - Reassess in ${Math.round(durationSeconds / 60)} min`,
    durationSeconds,
    `Time to reassess response to ${drug}`,
    onReassessmentPrompt
  );
}

/**
 * Create intervention timer (custom duration)
 */
export function createInterventionTimer(
  label: string,
  durationSeconds: number,
  reassessmentPrompt: string,
  onReassessmentPrompt?: () => void
): CountdownTimer {
  return createTimer(
    `intervention-timer-${Date.now()}`,
    'intervention',
    label,
    durationSeconds,
    reassessmentPrompt,
    onReassessmentPrompt
  );
}

/**
 * Get color class for timer urgency (Tailwind)
 */
export function getTimerColorClass(timer: CountdownTimer): string {
  const urgency = getTimerUrgency(timer);
  
  switch (urgency) {
    case 'critical':
      return 'text-red-500 bg-red-500/10 border-red-500/30';
    case 'warning':
      return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    default:
      return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
  }
}

/**
 * Get audio alert sound based on urgency
 */
export function getAlertSound(timer: CountdownTimer): 'beep' | 'warning' | 'critical' {
  const urgency = getTimerUrgency(timer);
  
  switch (urgency) {
    case 'critical':
      return 'critical';
    case 'warning':
      return 'warning';
    default:
      return 'beep';
  }
}
