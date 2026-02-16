// @ts-nocheck
/**
 * Voice Command Service for Hands-Free Clinical Assessment
 * 
 * Enables providers to input clinical data without touching the device during resuscitation.
 * Adapted for question-driven architecture in ClinicalAssessmentGPS.
 * 
 * Features:
 * - Continuous listening mode
 * - Context-aware command parsing based on current question
 * - Automatic data extraction and validation
 * - Audio feedback for confirmation
 * - Fallback to manual input if recognition fails
 */

type VoiceCommandCallback = (command: string, data: any) => void;

export class VoiceCommandService {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private currentQuestionId: string = '';
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
              try {
                this.recognition?.start();
              } catch (e) {
                // Ignore if already started
              }
            }
          }, 1000);
        }
      };

      this.recognition.onend = () => {
        // Auto-restart if still in listening mode
        if (this.isListening) {
          try {
            this.recognition?.start();
          } catch (e) {
            // Ignore if already started
          }
        }
      };
    }

    // Initialize audio context for feedback sounds
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  startListening(questionId: string, callback: VoiceCommandCallback) {
    if (!this.recognition) {
      console.warn('Speech recognition not supported in this browser');
      return false;
    }

    this.currentQuestionId = questionId;
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
    console.log('Voice command:', transcript, 'for question:', this.currentQuestionId);

    const data = this.parseCommand(transcript, this.currentQuestionId);
    
    if (data) {
      this.playFeedbackSound('success');
      this.callback?.(transcript, data);
    } else {
      this.playFeedbackSound('error');
    }
  }

  private parseCommand(transcript: string, questionId: string): any {
    // Remove common filler words
    const cleaned = transcript
      .replace(/\b(is|are|the|a|an|um|uh)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Boolean questions (yes/no)
    if (questionId === 'breathing' || questionId === 'seizure_active' || questionId === 'trauma_history') {
      if (cleaned.includes('yes') || cleaned.includes('present') || cleaned.includes('positive')) {
        return { value: true };
      }
      if (cleaned.includes('no') || cleaned.includes('absent') || cleaned.includes('negative')) {
        return { value: false };
      }
    }

    // Pulse question
    if (questionId === 'pulse') {
      if (cleaned.includes('strong') || cleaned.includes('present strong')) {
        return { value: 'present_strong' };
      }
      if (cleaned.includes('weak') || cleaned.includes('present weak')) {
        return { value: 'present_weak' };
      }
      if (cleaned.includes('absent') || cleaned.includes('no pulse')) {
        return { value: 'absent' };
      }
    }

    // AVPU question
    if (questionId === 'responsiveness') {
      if (cleaned.includes('alert') || cleaned.includes('awake')) {
        return { value: 'alert' };
      }
      if (cleaned.includes('voice') || cleaned.includes('verbal')) {
        return { value: 'voice' };
      }
      if (cleaned.includes('pain') || cleaned.includes('painful')) {
        return { value: 'pain' };
      }
      if (cleaned.includes('unresponsive') || cleaned.includes('unconscious')) {
        return { value: 'unresponsive' };
      }
    }

    // Airway status
    if (questionId === 'airway_status') {
      if (cleaned.includes('patent') || cleaned.includes('open') || cleaned.includes('clear')) {
        return { value: 'patent' };
      }
      if (cleaned.includes('obstructed') || cleaned.includes('blocked')) {
        return { value: 'obstructed' };
      }
      if (cleaned.includes('secured') || cleaned.includes('intubated')) {
        return { value: 'secured' };
      }
    }

    return null;
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

  setCurrentQuestion(questionId: string) {
    this.currentQuestionId = questionId;
  }
}

// Singleton instance
export const voiceCommandService = new VoiceCommandService();
