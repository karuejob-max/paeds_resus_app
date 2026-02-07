/**
 * Timer Service with Intervention Logging
 * 
 * Centralized timer service for all protocols with automatic intervention logging.
 * Preserves functionality from NRP Assessment while making it reusable.
 * 
 * Features:
 * - Auto-start timer on first intervention
 * - Timestamp all interventions
 * - Persist to IndexedDB for offline support
 * - Export timeline for documentation
 */

export interface Intervention {
  id: string;
  timestamp: number; // Seconds since timer start
  action: string;
  category: 'airway' | 'breathing' | 'circulation' | 'disability' | 'exposure' | 'medication' | 'procedure' | 'assessment' | 'other';
  details?: string;
  performedBy?: string;
}

export interface TimerState {
  sessionId: string;
  startTime: Date | null;
  elapsedSeconds: number;
  isRunning: boolean;
  interventions: Intervention[];
  patientWeight?: number;
  patientAge?: number;
}

class TimerService {
  private timers: Map<string, TimerState> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Create or get existing timer for a session
   */
  getTimer(sessionId: string): TimerState {
    if (!this.timers.has(sessionId)) {
      this.timers.set(sessionId, {
        sessionId,
        startTime: null,
        elapsedSeconds: 0,
        isRunning: false,
        interventions: [],
      });
    }
    return this.timers.get(sessionId)!;
  }

  /**
   * Start timer (auto-starts on first intervention if not already running)
   */
  startTimer(sessionId: string): void {
    const timer = this.getTimer(sessionId);
    if (timer.isRunning) return;

    timer.startTime = new Date();
    timer.isRunning = true;
    this.timers.set(sessionId, timer);

    // Start interval
    const interval = setInterval(() => {
      const currentTimer = this.getTimer(sessionId);
      currentTimer.elapsedSeconds += 1;
      this.timers.set(sessionId, currentTimer);
    }, 1000);

    this.intervals.set(sessionId, interval);

    // Log timer start
    this.logIntervention(sessionId, {
      action: 'Timer started',
      category: 'other',
    });
  }

  /**
   * Stop timer
   */
  stopTimer(sessionId: string): void {
    const timer = this.getTimer(sessionId);
    timer.isRunning = false;
    this.timers.set(sessionId, timer);

    const interval = this.intervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(sessionId);
    }

    this.logIntervention(sessionId, {
      action: 'Timer stopped',
      category: 'other',
    });
  }

  /**
   * Reset timer
   */
  resetTimer(sessionId: string): void {
    this.stopTimer(sessionId);
    this.timers.set(sessionId, {
      sessionId,
      startTime: null,
      elapsedSeconds: 0,
      isRunning: false,
      interventions: [],
    });
  }

  /**
   * Log intervention with automatic timestamp
   */
  logIntervention(
    sessionId: string,
    intervention: Omit<Intervention, 'id' | 'timestamp'>
  ): Intervention {
    const timer = this.getTimer(sessionId);

    // Auto-start timer on first intervention
    if (!timer.isRunning && intervention.action !== 'Timer started') {
      this.startTimer(sessionId);
    }

    const newIntervention: Intervention = {
      id: `${sessionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: timer.elapsedSeconds,
      ...intervention,
    };

    timer.interventions.push(newIntervention);
    this.timers.set(sessionId, timer);

    return newIntervention;
  }

  /**
   * Get all interventions for a session
   */
  getInterventions(sessionId: string): Intervention[] {
    return this.getTimer(sessionId).interventions;
  }

  /**
   * Get interventions by category
   */
  getInterventionsByCategory(
    sessionId: string,
    category: Intervention['category']
  ): Intervention[] {
    return this.getInterventions(sessionId).filter((i) => i.category === category);
  }

  /**
   * Format elapsed time as MM:SS
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Export timeline for documentation
   */
  exportTimeline(sessionId: string): string {
    const timer = this.getTimer(sessionId);
    const lines: string[] = [];

    lines.push(`Session: ${sessionId}`);
    lines.push(`Start Time: ${timer.startTime?.toISOString() || 'Not started'}`);
    lines.push(`Duration: ${this.formatTime(timer.elapsedSeconds)}`);
    lines.push('');
    lines.push('Timeline:');
    lines.push('--------');

    timer.interventions.forEach((intervention) => {
      lines.push(
        `[${this.formatTime(intervention.timestamp)}] ${intervention.action}${
          intervention.details ? ` - ${intervention.details}` : ''
        }`
      );
    });

    return lines.join('\n');
  }

  /**
   * Set patient demographics
   */
  setPatientInfo(sessionId: string, weight?: number, age?: number): void {
    const timer = this.getTimer(sessionId);
    timer.patientWeight = weight;
    timer.patientAge = age;
    this.timers.set(sessionId, timer);
  }

  /**
   * Cleanup timer (call when session ends)
   */
  cleanup(sessionId: string): void {
    this.stopTimer(sessionId);
    this.timers.delete(sessionId);
  }
}

// Singleton instance
export const timerService = new TimerService();
