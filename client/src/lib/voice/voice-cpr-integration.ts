/**
 * Voice-Enabled CPR Clock Integration
 * 
 * Integrates voice commands with CPR management workflows
 */

import type { VoiceCommand } from './voice-recognition-service';

export interface CPRVoiceAction {
  type: 'medication' | 'shock' | 'compressions' | 'rhythm' | 'assessment';
  action: string;
  timestamp: number;
  voiceCommand: string;
  confidence: number;
}

export interface CPRVoiceState {
  isCompressionActive: boolean;
  lastMedicationTime: number | null;
  lastShockTime: number | null;
  lastRhythmCheck: number | null;
  medicationSequence: string[];
  shockSequence: number[];
  actions: CPRVoiceAction[];
}

export class VoiceCPRIntegration {
  private state: CPRVoiceState = {
    isCompressionActive: false,
    lastMedicationTime: null,
    lastShockTime: null,
    lastRhythmCheck: null,
    medicationSequence: [],
    shockSequence: [],
    actions: [],
  };

  private cycleStartTime: number = Date.now();
  private compressionFraction: number = 0;

  constructor() {
    this.resetState();
  }

  /**
   * Process voice command for CPR
   */
  public processVoiceCommand(command: VoiceCommand): CPRVoiceAction | null {
    const now = Date.now();

    switch (command.action) {
      case 'startCompressions':
        return this.handleCompressionStart(command, now);

      case 'stopCompressions':
        return this.handleCompressionStop(command, now);

      case 'recordMedication':
        return this.handleMedication(command, now);

      case 'recordShock':
        return this.handleShock(command, now);

      case 'recordRhythmCheck':
        return this.handleRhythmCheck(command, now);

      case 'recordRhythm':
        return this.handleRhythmIdentification(command, now);

      default:
        return null;
    }
  }

  private handleCompressionStart(command: VoiceCommand, timestamp: number): CPRVoiceAction {
    this.state.isCompressionActive = true;
    this.cycleStartTime = timestamp;

    const action: CPRVoiceAction = {
      type: 'compressions',
      action: 'start_compressions',
      timestamp,
      voiceCommand: command.command,
      confidence: command.confidence,
    };

    this.state.actions.push(action);
    return action;
  }

  private handleCompressionStop(command: VoiceCommand, timestamp: number): CPRVoiceAction {
    this.state.isCompressionActive = false;

    // Calculate compression fraction
    const compressionDuration = timestamp - this.cycleStartTime;
    const cycleTime = 120000; // 2 minutes
    this.compressionFraction = (compressionDuration / cycleTime) * 100;

    const action: CPRVoiceAction = {
      type: 'compressions',
      action: 'stop_compressions',
      timestamp,
      voiceCommand: command.command,
      confidence: command.confidence,
    };

    this.state.actions.push(action);
    return action;
  }

  private handleMedication(command: VoiceCommand, timestamp: number): CPRVoiceAction {
    // Determine medication type from voice command
    let medicationType = 'unknown';

    if (command.command.toLowerCase().includes('epi')) {
      medicationType = 'epinephrine';
    } else if (command.command.toLowerCase().includes('amio')) {
      medicationType = 'amiodarone';
    }

    this.state.lastMedicationTime = timestamp;
    this.state.medicationSequence.push(medicationType);

    const action: CPRVoiceAction = {
      type: 'medication',
      action: `give_${medicationType}`,
      timestamp,
      voiceCommand: command.command,
      confidence: command.confidence,
    };

    this.state.actions.push(action);
    return action;
  }

  private handleShock(command: VoiceCommand, timestamp: number): CPRVoiceAction {
    this.state.lastShockTime = timestamp;
    this.state.shockSequence.push(this.state.shockSequence.length + 1);

    const action: CPRVoiceAction = {
      type: 'shock',
      action: 'deliver_shock',
      timestamp,
      voiceCommand: command.command,
      confidence: command.confidence,
    };

    this.state.actions.push(action);
    return action;
  }

  private handleRhythmCheck(command: VoiceCommand, timestamp: number): CPRVoiceAction {
    this.state.lastRhythmCheck = timestamp;

    const action: CPRVoiceAction = {
      type: 'assessment',
      action: 'check_rhythm',
      timestamp,
      voiceCommand: command.command,
      confidence: command.confidence,
    };

    this.state.actions.push(action);
    return action;
  }

  private handleRhythmIdentification(command: VoiceCommand, timestamp: number): CPRVoiceAction {
    let rhythmType = 'unknown';

    if (command.command.toLowerCase().includes('vfib') || command.command.toLowerCase().includes('vf')) {
      rhythmType = 'vfib';
    } else if (command.command.toLowerCase().includes('pulseless vt') || command.command.toLowerCase().includes('pvt')) {
      rhythmType = 'pulseless_vt';
    } else if (command.command.toLowerCase().includes('asystole')) {
      rhythmType = 'asystole';
    } else if (command.command.toLowerCase().includes('pea')) {
      rhythmType = 'pea';
    }

    const action: CPRVoiceAction = {
      type: 'rhythm',
      action: `identify_${rhythmType}`,
      timestamp,
      voiceCommand: command.command,
      confidence: command.confidence,
    };

    this.state.actions.push(action);
    return action;
  }

  /**
   * Get current CPR state
   */
  public getState(): CPRVoiceState {
    return { ...this.state };
  }

  /**
   * Get compression fraction (percentage of cycle spent doing compressions)
   */
  public getCompressionFraction(): number {
    return this.compressionFraction;
  }

  /**
   * Get time since last medication
   */
  public getTimeSinceLastMedication(): number | null {
    if (!this.state.lastMedicationTime) return null;
    return Date.now() - this.state.lastMedicationTime;
  }

  /**
   * Get time since last shock
   */
  public getTimeSinceLastShock(): number | null {
    if (!this.state.lastShockTime) return null;
    return Date.now() - this.state.lastShockTime;
  }

  /**
   * Check if medication is due (every 3-5 minutes)
   */
  public isMedicationDue(): boolean {
    const timeSinceMed = this.getTimeSinceLastMedication();
    if (!timeSinceMed) return true; // First medication
    return timeSinceMed > 180000; // 3 minutes
  }

  /**
   * Check if shock is due (every 2 minutes)
   */
  public isShockDue(): boolean {
    const timeSinceShock = this.getTimeSinceLastShock();
    if (!timeSinceShock) return true; // First shock
    return timeSinceShock > 120000; // 2 minutes
  }

  /**
   * Get medication sequence for debrief
   */
  public getMedicationSequence(): string[] {
    return [...this.state.medicationSequence];
  }

  /**
   * Get shock sequence for debrief
   */
  public getShockSequence(): number[] {
    return [...this.state.shockSequence];
  }

  /**
   * Get all actions for session recording
   */
  public getActions(): CPRVoiceAction[] {
    return [...this.state.actions];
  }

  /**
   * Reset state for new session
   */
  public resetState(): void {
    this.state = {
      isCompressionActive: false,
      lastMedicationTime: null,
      lastShockTime: null,
      lastRhythmCheck: null,
      medicationSequence: [],
      shockSequence: [],
      actions: [],
    };
    this.cycleStartTime = Date.now();
    this.compressionFraction = 0;
  }

  /**
   * Generate CPR summary for SBAR handover
   */
  public generateCPRSummary(): {
    totalDuration: number;
    compressionFraction: number;
    medicationsGiven: string[];
    shocksDelivered: number;
    totalActions: number;
  } {
    const startTime = this.state.actions.length > 0 ? this.state.actions[0].timestamp : Date.now();
    const endTime = this.state.actions.length > 0 ? this.state.actions[this.state.actions.length - 1].timestamp : Date.now();

    return {
      totalDuration: endTime - startTime,
      compressionFraction: this.compressionFraction,
      medicationsGiven: this.state.medicationSequence,
      shocksDelivered: this.state.shockSequence.length,
      totalActions: this.state.actions.length,
    };
  }
}

/**
 * Voice-Enabled Respiratory Emergency Integration
 */
export class VoiceRespiratoryIntegration {
  private interventions: Array<{
    type: string;
    timestamp: number;
    voiceCommand: string;
    confidence: number;
  }> = [];

  public processVoiceCommand(command: VoiceCommand): void {
    const now = Date.now();

    switch (command.action) {
      case 'recordOxygenTherapy':
        this.interventions.push({
          type: 'oxygen_therapy',
          timestamp: now,
          voiceCommand: command.command,
          confidence: command.confidence,
        });
        break;

      case 'recordIntubation':
        this.interventions.push({
          type: 'intubation',
          timestamp: now,
          voiceCommand: command.command,
          confidence: command.confidence,
        });
        break;

      case 'recordBagMask':
        this.interventions.push({
          type: 'bag_mask_ventilation',
          timestamp: now,
          voiceCommand: command.command,
          confidence: command.confidence,
        });
        break;

      case 'recordMedication':
        let medicationType = 'unknown';
        if (command.command.toLowerCase().includes('steroid')) {
          medicationType = 'steroids';
        } else if (command.command.toLowerCase().includes('neb')) {
          medicationType = 'nebulized_medication';
        }

        this.interventions.push({
          type: `medication_${medicationType}`,
          timestamp: now,
          voiceCommand: command.command,
          confidence: command.confidence,
        });
        break;
    }
  }

  public getInterventions() {
    return [...this.interventions];
  }

  public resetState(): void {
    this.interventions = [];
  }
}

/**
 * Voice-Enabled Anaphylaxis Integration
 */
export class VoiceAnaphylaxisIntegration {
  private interventions: Array<{
    type: string;
    timestamp: number;
    voiceCommand: string;
    confidence: number;
  }> = [];

  private epinephrineGivenTime: number | null = null;

  public processVoiceCommand(command: VoiceCommand): void {
    const now = Date.now();

    switch (command.action) {
      case 'recordMedication':
        if (command.command.toLowerCase().includes('epi im')) {
          this.epinephrineGivenTime = now;
          this.interventions.push({
            type: 'epinephrine_im',
            timestamp: now,
            voiceCommand: command.command,
            confidence: command.confidence,
          });
        } else if (command.command.toLowerCase().includes('antihistamine')) {
          this.interventions.push({
            type: 'antihistamine',
            timestamp: now,
            voiceCommand: command.command,
            confidence: command.confidence,
          });
        }
        break;

      case 'recordIVAccess':
        this.interventions.push({
          type: 'iv_access',
          timestamp: now,
          voiceCommand: command.command,
          confidence: command.confidence,
        });
        break;
    }
  }

  public isEpinephrineRepeatDue(): boolean {
    if (!this.epinephrineGivenTime) return true;
    const timeSinceEpi = Date.now() - this.epinephrineGivenTime;
    return timeSinceEpi > 900000; // 15 minutes
  }

  public getInterventions() {
    return [...this.interventions];
  }

  public resetState(): void {
    this.interventions = [];
    this.epinephrineGivenTime = null;
  }
}
