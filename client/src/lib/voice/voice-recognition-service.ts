/**
 * Voice Recognition Service for ResusGPS
 * 
 * Provides hands-free voice command recognition for clinical data entry
 * Supports Web Speech API with fallback to external service
 * Optimized for high-noise emergency environments
 */

export interface VoiceCommand {
  command: string;
  category: 'intervention' | 'assessment' | 'navigation' | 'system';
  action: string;
  confidence: number;
  timestamp: number;
}

export interface VoiceRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  noiseThreshold: number;
}

export class VoiceRecognitionService {
  private recognition: any;
  private isListening: boolean = false;
  private commandBuffer: string[] = [];
  private confidenceThreshold: number = 0.7;
  private config: VoiceRecognitionConfig;

  constructor(config: Partial<VoiceRecognitionConfig> = {}) {
    this.config = {
      language: 'en-US',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      noiseThreshold: 0.3,
      ...config,
    };

    this.initializeRecognition();
  }

  private initializeRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;
    this.recognition.lang = this.config.language;

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('Voice recognition started');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('Voice recognition ended');
    };

    this.recognition.onerror = (event: any) => {
      console.error('Voice recognition error:', event.error);
    };

    this.recognition.onresult = (event: any) => {
      this.handleRecognitionResult(event);
    };
  }

  private handleRecognitionResult(event: any): void {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      const confidence = event.results[i][0].confidence;

      if (event.results[i].isFinal) {
        if (confidence > this.confidenceThreshold) {
          finalTranscript += transcript + ' ';
        }
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      this.processVoiceInput(finalTranscript.trim());
    }
  }

  private processVoiceInput(transcript: string): void {
    const normalized = transcript.toLowerCase().trim();
    this.commandBuffer.push(normalized);

    // Emit event for UI to handle
    const event = new CustomEvent('voiceInput', {
      detail: { transcript: normalized, timestamp: Date.now() },
    });
    window.dispatchEvent(event);
  }

  public start(): void {
    if (!this.recognition) {
      console.error('Voice recognition not available');
      return;
    }

    if (!this.isListening) {
      this.recognition.start();
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  public abort(): void {
    if (this.recognition) {
      this.recognition.abort();
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public setLanguage(language: string): void {
    this.config.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  public setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
  }

  public getCommandBuffer(): string[] {
    return [...this.commandBuffer];
  }

  public clearCommandBuffer(): void {
    this.commandBuffer = [];
  }
}

/**
 * Clinical Voice Command Parser
 * 
 * Parses voice input and maps to clinical actions
 */
export class ClinicalVoiceCommandParser {
  private commandMap: Map<string, VoiceCommand> = new Map();

  constructor() {
    this.initializeCommandMap();
  }

  private initializeCommandMap(): void {
    // CPR Interventions
    this.addCommand('epi given', 'intervention', 'recordMedication', 'epinephrine');
    this.addCommand('epinephrine', 'intervention', 'recordMedication', 'epinephrine');
    this.addCommand('shock delivered', 'intervention', 'recordShock', 'shock_delivered');
    this.addCommand('shock', 'intervention', 'recordShock', 'shock_delivered');
    this.addCommand('compressions started', 'intervention', 'startCompressions', 'compressions_started');
    this.addCommand('compressions', 'intervention', 'startCompressions', 'compressions_started');
    this.addCommand('stop compressions', 'intervention', 'stopCompressions', 'compressions_stopped');
    this.addCommand('check rhythm', 'assessment', 'recordRhythmCheck', 'rhythm_check');
    this.addCommand('rhythm check', 'assessment', 'recordRhythmCheck', 'rhythm_check');
    this.addCommand('shockable', 'assessment', 'recordRhythm', 'shockable_rhythm');
    this.addCommand('vfib', 'assessment', 'recordRhythm', 'vfib');
    this.addCommand('pulseless vt', 'assessment', 'recordRhythm', 'pulseless_vt');
    this.addCommand('asystole', 'assessment', 'recordRhythm', 'asystole');
    this.addCommand('pea', 'assessment', 'recordRhythm', 'pea');

    // Respiratory Interventions
    this.addCommand('oxygen on', 'intervention', 'recordOxygenTherapy', 'oxygen_started');
    this.addCommand('oxygen', 'intervention', 'recordOxygenTherapy', 'oxygen_started');
    this.addCommand('intubated', 'intervention', 'recordIntubation', 'intubation_done');
    this.addCommand('intubation', 'intervention', 'recordIntubation', 'intubation_done');
    this.addCommand('bag mask', 'intervention', 'recordBagMask', 'bag_mask_ventilation');
    this.addCommand('steroids given', 'intervention', 'recordMedication', 'steroids');
    this.addCommand('nebulizer', 'intervention', 'recordNebulizer', 'nebulizer_given');

    // Anaphylaxis Interventions
    this.addCommand('epi im', 'intervention', 'recordMedication', 'epinephrine_im');
    this.addCommand('antihistamine', 'intervention', 'recordMedication', 'antihistamine');
    this.addCommand('iv access', 'intervention', 'recordIVAccess', 'iv_access_obtained');

    // Assessment Commands
    this.addCommand('check pulse', 'assessment', 'checkPulse', 'pulse_check');
    this.addCommand('pulse check', 'assessment', 'checkPulse', 'pulse_check');
    this.addCommand('check breathing', 'assessment', 'checkBreathing', 'breathing_check');
    this.addCommand('check airway', 'assessment', 'checkAirway', 'airway_check');
    this.addCommand('check circulation', 'assessment', 'checkCirculation', 'circulation_check');
    this.addCommand('check disability', 'assessment', 'checkDisability', 'disability_check');

    // Navigation Commands
    this.addCommand('next', 'navigation', 'navigateNext', 'next_step');
    this.addCommand('back', 'navigation', 'navigatePrevious', 'previous_step');
    this.addCommand('home', 'navigation', 'navigateHome', 'home');
    this.addCommand('summary', 'navigation', 'viewSummary', 'view_summary');

    // System Commands
    this.addCommand('stop listening', 'system', 'stopListening', 'stop_voice');
    this.addCommand('pause', 'system', 'pauseListening', 'pause_voice');
    this.addCommand('help', 'system', 'showHelp', 'show_help');
  }

  private addCommand(phrase: string, category: 'intervention' | 'assessment' | 'navigation' | 'system', action: string, commandType: string): void {
    this.commandMap.set(phrase, {
      command: phrase,
      category,
      action,
      confidence: 0,
      timestamp: Date.now(),
    });
  }

  public parseCommand(transcript: string): VoiceCommand | null {
    const normalized = transcript.toLowerCase().trim();
    
    // Exact match
    if (this.commandMap.has(normalized)) {
      const cmd = this.commandMap.get(normalized)!;
      return {
        ...cmd,
        confidence: 1.0,
        timestamp: Date.now(),
      };
    }

    // Fuzzy match (simple substring matching)
    for (const [phrase, cmd] of this.commandMap.entries()) {
      if (normalized.includes(phrase) || phrase.includes(normalized)) {
        const similarity = this.calculateSimilarity(normalized, phrase);
        if (similarity > 0.7) {
          return {
            ...cmd,
            confidence: similarity,
            timestamp: Date.now(),
          };
        }
      }
    }

    return null;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  public getAvailableCommands(): string[] {
    return Array.from(this.commandMap.keys());
  }

  public addCustomCommand(phrase: string, category: 'intervention' | 'assessment' | 'navigation' | 'system', action: string, commandType: string): void {
    this.addCommand(phrase, category, action, commandType);
  }
}

/**
 * Voice Feedback Service
 * 
 * Provides audio feedback for voice commands
 */
export class VoiceFeedbackService {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext(): void {
    if (typeof window !== 'undefined' && (window as any).AudioContext) {
      this.audioContext = new (window as any).AudioContext();
    }
  }

  public playCommandRecognized(): void {
    if (!this.isEnabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.frequency.value = 800;
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playCommandError(): void {
    if (!this.isEnabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.frequency.value = 300;
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playListeningStarted(): void {
    if (!this.isEnabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.frequency.value = 600;
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public isAudioSupported(): boolean {
    return !!this.audioContext;
  }
}
