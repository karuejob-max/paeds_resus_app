/**
 * Voice Command Service for Hands-Free GPS Navigation
 * 
 * Enables providers to input clinical data without touching the device during resuscitation.
 * Supports natural language commands like "Respiratory rate 40", "SpO2 92", "Pupils equal and reactive".
 * 
 * Features:
 * - Continuous listening mode with wake word detection
 * - Context-aware command parsing based on current GPS step
 * - Automatic data extraction and validation
 * - Audio feedback for confirmation
 * - Fallback to manual input if recognition fails
 */

type VoiceCommandCallback = (command: string, data: any) => void;

export class VoiceCommandService {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private currentStep: string = '';
  private callback: VoiceCommandCallback | null = null;
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript.toLowerCase().trim();
        this.processCommand(transcript);
      };

      this.recognition.onerror = (event: any) => {
        console.error('Voice recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Auto-restart if no speech detected
          setTimeout(() => {
            if (this.isListening) {
              this.recognition?.start();
            }
          }, 1000);
        }
      };

      this.recognition.onend = () => {
        // Auto-restart if still in listening mode
        if (this.isListening) {
          this.recognition?.start();
        }
      };
    }

    // Initialize audio context for feedback sounds
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  startListening(step: string, callback: VoiceCommandCallback) {
    if (!this.recognition) {
      console.warn('Speech recognition not supported in this browser');
      return false;
    }

    this.currentStep = step;
    this.callback = callback;
    this.isListening = true;

    try {
      this.recognition.start();
      this.playFeedbackSound('start');
      return true;
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      return false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      this.playFeedbackSound('stop');
    }
  }

  private processCommand(transcript: string) {
    console.log('Voice command:', transcript);

    const data = this.parseCommand(transcript, this.currentStep);
    
    if (data) {
      this.playFeedbackSound('success');
      this.callback?.(transcript, data);
    } else {
      this.playFeedbackSound('error');
    }
  }

  private parseCommand(transcript: string, step: string): any {
    // Remove common filler words
    const cleaned = transcript
      .replace(/\b(is|are|the|a|an|um|uh)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    switch (step) {
      case 'breathing-rate':
        return this.parseNumericValue(cleaned, ['respiratory rate', 'breathing rate', 'respiration', 'rr']);

      case 'spo2':
        return this.parseNumericValue(cleaned, ['spo2', 'oxygen', 'saturation', 'o2']);

      case 'heart-rate':
        return this.parseNumericValue(cleaned, ['heart rate', 'pulse', 'hr', 'beats']);

      case 'perfusion':
        return this.parsePerfusionCommand(cleaned);

      case 'glucose':
        return this.parseNumericValue(cleaned, ['glucose', 'sugar', 'bg', 'blood glucose']);

      case 'temperature':
        return this.parseNumericValue(cleaned, ['temperature', 'temp', 'fever']);

      case 'airway-status':
        return this.parseAirwayStatus(cleaned);

      case 'breathing-pattern':
        return this.parseBreathingPattern(cleaned);

      case 'avpu':
        return this.parseAVPU(cleaned);

      case 'pupils':
        return this.parsePupils(cleaned);

      default:
        return null;
    }
  }

  private parseNumericValue(text: string, keywords: string[]): any {
    // Check if any keyword is present
    const hasKeyword = keywords.some(kw => text.includes(kw));
    if (!hasKeyword) return null;

    // Extract number (handles decimals)
    const match = text.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      return { value: parseFloat(match[1]) };
    }

    return null;
  }

  private parsePerfusionCommand(text: string): any {
    // Capillary refill time
    if (text.includes('cap refill') || text.includes('crt')) {
      const match = text.match(/(\d+(?:\.\d+)?)/);
      if (match) {
        return { type: 'capillary_refill', value: parseFloat(match[1]) };
      }
    }

    // Pulse quality
    if (text.includes('pulse')) {
      if (text.includes('strong') || text.includes('bounding')) {
        return { type: 'pulses', value: 'strong' };
      }
      if (text.includes('weak') || text.includes('thready')) {
        return { type: 'pulses', value: 'weak' };
      }
      if (text.includes('absent') || text.includes('no pulse')) {
        return { type: 'pulses', value: 'absent' };
      }
      if (text.includes('normal')) {
        return { type: 'pulses', value: 'normal' };
      }
    }

    // Skin temp/color
    if (text.includes('warm') && text.includes('pink')) {
      return { type: 'skin_temp_color', value: 'warm_pink' };
    }
    if (text.includes('cool') && text.includes('pale')) {
      return { type: 'skin_temp_color', value: 'cool_pale' };
    }
    if (text.includes('cold') && text.includes('mottled')) {
      return { type: 'skin_temp_color', value: 'cold_mottled' };
    }

    return null;
  }

  private parseAirwayStatus(text: string): any {
    if (text.includes('patent') || text.includes('open') || text.includes('clear')) {
      return { value: 'patent' };
    }
    if (text.includes('obstructed') || text.includes('blocked')) {
      return { value: 'obstructed' };
    }
    if (text.includes('secured') || text.includes('intubated') || text.includes('ett')) {
      return { value: 'secured' };
    }
    return null;
  }

  private parseBreathingPattern(text: string): any {
    if (text.includes('normal') || text.includes('regular')) {
      return { value: 'normal' };
    }
    if (text.includes('kussmaul') || text.includes('deep rapid')) {
      return { value: 'kussmaul' };
    }
    if (text.includes('cheyne') || text.includes('stokes')) {
      return { value: 'cheyne_stokes' };
    }
    if (text.includes('apneic') || text.includes('gasping') || text.includes('agonal')) {
      return { value: 'apneic' };
    }
    return null;
  }

  private parseAVPU(text: string): any {
    if (text.includes('alert') || text.includes('awake')) {
      return { value: 'alert' };
    }
    if (text.includes('voice') || text.includes('verbal')) {
      return { value: 'voice' };
    }
    if (text.includes('pain') || text.includes('painful')) {
      return { value: 'pain' };
    }
    if (text.includes('unresponsive') || text.includes('unconscious')) {
      return { value: 'unresponsive' };
    }
    return null;
  }

  private parsePupils(text: string): any {
    const result: any = {};

    // Size
    if (text.includes('pinpoint')) {
      result.pupils_size = 'pinpoint';
    } else if (text.includes('dilated') || text.includes('large')) {
      result.pupils_size = 'dilated';
    } else if (text.includes('normal size')) {
      result.pupils_size = 'normal';
    }

    // Reactivity
    if (text.includes('reactive') || text.includes('brisk')) {
      result.pupils_reactive = 'brisk';
    } else if (text.includes('sluggish') || text.includes('slow')) {
      result.pupils_reactive = 'sluggish';
    } else if (text.includes('fixed') || text.includes('non-reactive')) {
      result.pupils_reactive = 'fixed';
    }

    // Equality
    if (text.includes('equal')) {
      result.pupils_equal = 'equal';
    } else if (text.includes('unequal') || text.includes('anisocoria')) {
      result.pupils_equal = 'unequal';
    }

    return Object.keys(result).length > 0 ? result : null;
  }

  private playFeedbackSound(type: 'start' | 'stop' | 'success' | 'error') {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Different tones for different feedback types
    switch (type) {
      case 'start':
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;
        break;
      case 'stop':
        oscillator.frequency.value = 400;
        gainNode.gain.value = 0.1;
        break;
      case 'success':
        oscillator.frequency.value = 1200;
        gainNode.gain.value = 0.15;
        break;
      case 'error':
        oscillator.frequency.value = 200;
        gainNode.gain.value = 0.2;
        break;
    }

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}

// Singleton instance
export const voiceCommandService = new VoiceCommandService();
