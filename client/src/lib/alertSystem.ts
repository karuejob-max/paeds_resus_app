/**
 * Audio/Haptic Alert System
 * 
 * Provides audio cues and haptic feedback for critical actions during
 * pediatric emergencies. Ensures providers don't miss urgent prompts.
 */

export type AlertType = 
  | 'timer_warning'      // 30 seconds before timer expires
  | 'timer_expired'      // Timer has expired - action needed
  | 'critical_action'    // Critical intervention required
  | 'medication_due'     // Medication timing reminder
  | 'reassessment_due'   // Time to reassess patient
  | 'pulse_check'        // CPR pulse check reminder
  | 'shock_advised'      // Defibrillator advises shock
  | 'success'            // Action completed successfully
  | 'error';             // Error or warning

export interface AlertConfig {
  audioEnabled: boolean;
  hapticEnabled: boolean;
  volume: number; // 0-1
  vibrationPattern: 'short' | 'medium' | 'long' | 'urgent';
}

// Default configuration
let alertConfig: AlertConfig = {
  audioEnabled: true,
  hapticEnabled: true,
  volume: 0.7,
  vibrationPattern: 'medium',
};

// Audio context for web audio API
let audioContext: AudioContext | null = null;

/**
 * Initialize audio context (must be called after user interaction)
 */
export function initAudioContext(): void {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

/**
 * Update alert configuration
 */
export function setAlertConfig(config: Partial<AlertConfig>): void {
  alertConfig = { ...alertConfig, ...config };
}

/**
 * Get current alert configuration
 */
export function getAlertConfig(): AlertConfig {
  return { ...alertConfig };
}

/**
 * Vibration patterns in milliseconds
 */
const VIBRATION_PATTERNS: Record<string, number[]> = {
  short: [100],
  medium: [200, 100, 200],
  long: [500, 200, 500],
  urgent: [100, 50, 100, 50, 100, 50, 300, 100, 300, 100, 300],
};

/**
 * Trigger haptic feedback
 */
export function triggerHaptic(pattern: 'short' | 'medium' | 'long' | 'urgent' = 'medium'): void {
  if (!alertConfig.hapticEnabled) return;
  
  if ('vibrate' in navigator) {
    navigator.vibrate(VIBRATION_PATTERNS[pattern]);
  }
}

/**
 * Stop haptic feedback
 */
export function stopHaptic(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(0);
  }
}

/**
 * Audio frequencies for different alert types (Hz)
 */
const ALERT_FREQUENCIES: Record<AlertType, { freq: number; duration: number; pattern: number[] }> = {
  timer_warning: { freq: 880, duration: 200, pattern: [1, 0.5, 1] }, // A5 - warning beeps
  timer_expired: { freq: 1047, duration: 300, pattern: [1, 0.3, 1, 0.3, 1, 0.3, 1] }, // C6 - urgent
  critical_action: { freq: 1319, duration: 400, pattern: [1, 0.2, 1, 0.2, 1] }, // E6 - critical
  medication_due: { freq: 659, duration: 250, pattern: [1, 0.5, 1, 0.5] }, // E5 - reminder
  reassessment_due: { freq: 784, duration: 200, pattern: [1, 0.3, 1] }, // G5 - check
  pulse_check: { freq: 523, duration: 500, pattern: [1, 0.5, 1, 0.5, 1] }, // C5 - pulse check
  shock_advised: { freq: 1568, duration: 300, pattern: [1, 0.1, 1, 0.1, 1, 0.1, 1, 0.1, 1] }, // G6 - shock
  success: { freq: 523, duration: 150, pattern: [1, 0.2, 1.5] }, // C5 ascending
  error: { freq: 220, duration: 300, pattern: [1, 0.3, 1] }, // A3 - error
};

/**
 * Play a tone using Web Audio API
 */
function playTone(frequency: number, duration: number, volume: number): void {
  if (!audioContext) {
    initAudioContext();
  }
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';

  // Envelope for smoother sound
  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
  gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + duration / 1000 * 0.7);
  gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000);

  oscillator.start(now);
  oscillator.stop(now + duration / 1000);
}

/**
 * Play alert sound pattern
 */
async function playAlertPattern(alertType: AlertType): Promise<void> {
  if (!alertConfig.audioEnabled) return;

  const config = ALERT_FREQUENCIES[alertType];
  const volume = alertConfig.volume;

  for (let i = 0; i < config.pattern.length; i++) {
    const multiplier = config.pattern[i];
    if (multiplier > 0) {
      playTone(config.freq * multiplier, config.duration, volume);
      await new Promise((resolve) => setTimeout(resolve, config.duration + 100));
    } else {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

/**
 * Trigger an alert with both audio and haptic feedback
 */
export async function triggerAlert(alertType: AlertType): Promise<void> {
  // Determine haptic pattern based on alert urgency
  let hapticPattern: 'short' | 'medium' | 'long' | 'urgent' = 'medium';
  
  switch (alertType) {
    case 'timer_expired':
    case 'critical_action':
    case 'shock_advised':
      hapticPattern = 'urgent';
      break;
    case 'timer_warning':
    case 'medication_due':
    case 'pulse_check':
      hapticPattern = 'long';
      break;
    case 'success':
      hapticPattern = 'short';
      break;
    default:
      hapticPattern = 'medium';
  }

  // Trigger both audio and haptic simultaneously
  triggerHaptic(hapticPattern);
  await playAlertPattern(alertType);
}

/**
 * Play CPR metronome (100-120 BPM)
 */
let cprMetronomeInterval: NodeJS.Timeout | null = null;

export function startCPRMetronome(bpm: number = 110): void {
  stopCPRMetronome();
  
  if (!alertConfig.audioEnabled) return;

  const intervalMs = (60 / bpm) * 1000;
  
  cprMetronomeInterval = setInterval(() => {
    playTone(440, 50, alertConfig.volume * 0.5); // A4, short click
    triggerHaptic('short');
  }, intervalMs);
}

export function stopCPRMetronome(): void {
  if (cprMetronomeInterval) {
    clearInterval(cprMetronomeInterval);
    cprMetronomeInterval = null;
  }
}

/**
 * Play countdown beeps (last 10 seconds)
 */
export function playCountdownBeep(secondsRemaining: number): void {
  if (!alertConfig.audioEnabled) return;
  
  if (secondsRemaining <= 10 && secondsRemaining > 0) {
    const freq = secondsRemaining <= 3 ? 880 : 660; // Higher pitch for last 3 seconds
    playTone(freq, 100, alertConfig.volume * 0.6);
    triggerHaptic('short');
  }
}

/**
 * Play success chime
 */
export function playSuccessChime(): void {
  if (!alertConfig.audioEnabled) return;
  
  // Ascending arpeggio
  setTimeout(() => playTone(523, 100, alertConfig.volume * 0.5), 0);    // C5
  setTimeout(() => playTone(659, 100, alertConfig.volume * 0.5), 100);  // E5
  setTimeout(() => playTone(784, 150, alertConfig.volume * 0.5), 200);  // G5
  triggerHaptic('short');
}

/**
 * Play error sound
 */
export function playErrorSound(): void {
  if (!alertConfig.audioEnabled) return;
  
  // Descending tones
  setTimeout(() => playTone(440, 150, alertConfig.volume * 0.5), 0);   // A4
  setTimeout(() => playTone(349, 200, alertConfig.volume * 0.5), 150); // F4
  triggerHaptic('medium');
}

/**
 * Speak text using Web Speech API
 */
export function speakAlert(text: string, urgent: boolean = false): void {
  if (!('speechSynthesis' in window)) return;
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = urgent ? 1.2 : 1.0;
  utterance.pitch = urgent ? 1.1 : 1.0;
  utterance.volume = alertConfig.volume;
  
  window.speechSynthesis.speak(utterance);
}

/**
 * Stop all alerts
 */
export function stopAllAlerts(): void {
  stopHaptic();
  stopCPRMetronome();
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Check if audio is supported
 */
export function isAudioSupported(): boolean {
  return !!(window.AudioContext || (window as any).webkitAudioContext);
}

/**
 * Check if haptic is supported
 */
export function isHapticSupported(): boolean {
  return 'vibrate' in navigator;
}

/**
 * Check if speech is supported
 */
export function isSpeechSupported(): boolean {
  return 'speechSynthesis' in window;
}
