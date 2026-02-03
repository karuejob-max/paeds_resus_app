/**
 * Haptic Feedback Utility
 * 
 * Provides tactile confirmation for critical actions during resuscitation.
 * Uses Vibration API for mobile devices.
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'critical' | 'success' | 'warning';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,                    // Quick tap
  medium: 20,                   // Standard button press
  heavy: 50,                    // Important action
  critical: [50, 100, 50],      // Critical action (shock, epinephrine)
  success: [20, 50, 20],        // Success confirmation
  warning: [30, 30, 30],        // Warning/alert
};

/**
 * Trigger haptic feedback if supported
 */
export function triggerHaptic(pattern: HapticPattern = 'medium'): void {
  if (!('vibrate' in navigator)) {
    return; // Vibration API not supported
  }

  try {
    const vibrationPattern = patterns[pattern];
    navigator.vibrate(vibrationPattern);
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
  }
}

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  return 'vibrate' in navigator;
}

/**
 * Stop any ongoing vibration
 */
export function stopHaptic(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(0);
  }
}
