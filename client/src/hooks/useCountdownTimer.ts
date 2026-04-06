/**
 * useCountdownTimer Hook
 * 
 * Manages countdown timer state and updates.
 * Handles tick updates, expiry callbacks, audio alerts.
 * 
 * Usage:
 *   const timer = useCountdownTimer(createMedicationTimer('Epinephrine'));
 *   
 *   return (
 *     <div>
 *       {formatRemainingTime(timer.state)}
 *       <button onClick={timer.pause}>Pause</button>
 *       <button onClick={timer.resume}>Resume</button>
 *     </div>
 *   );
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  CountdownTimer,
  updateTimer,
  hasTimerExpired,
  pauseTimer,
  resumeTimer,
  resetTimer,
} from '@/lib/resus/countdown-timer';

interface UseCountdownTimerReturn {
  state: CountdownTimer;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  isExpired: boolean;
}

export function useCountdownTimer(initialTimer: CountdownTimer): UseCountdownTimerReturn {
  const [timer, setTimer] = useState(initialTimer);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasAlertedRef = useRef(false);

  // Update timer on each tick
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimer((prevTimer) => {
        const updated = updateTimer(prevTimer);
        
        // Check for expiry and trigger callback
        if (hasTimerExpired(updated) && !hasAlertedRef.current) {
          hasAlertedRef.current = true;
          
          // Play audio alert
          playTimerAlert(updated);
          
          // Call expiry callback if provided
          if (updated.onExpiry) {
            updated.onExpiry();
          }
        }
        
        return updated;
      });
    }, 100); // Update every 100ms for smooth countdown

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const pause = useCallback(() => {
    setTimer((prev) => pauseTimer(prev));
  }, []);

  const resume = useCallback(() => {
    setTimer((prev) => resumeTimer(prev));
  }, []);

  const reset = useCallback(() => {
    setTimer((prev) => {
      hasAlertedRef.current = false;
      return resetTimer(prev);
    });
  }, []);

  return {
    state: timer,
    pause,
    resume,
    reset,
    isExpired: hasTimerExpired(timer),
  };
}

/**
 * Play audio alert when timer expires
 */
function playTimerAlert(timer: CountdownTimer) {
  // Create audio context
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Determine alert pattern based on timer type
  if (timer.type === 'cpr') {
    // CPR timer: urgent beeping pattern
    playBeepPattern(audioContext, [200, 100, 200, 100, 200]);
  } else if (timer.type === 'medication') {
    // Medication timer: moderate beeping
    playBeepPattern(audioContext, [300, 100, 300]);
  } else {
    // Intervention timer: single beep
    playBeep(audioContext, 500);
  }
}

/**
 * Play single beep
 */
function playBeep(audioContext: AudioContext, duration: number) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800; // Hz
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration / 1000);
}

/**
 * Play beep pattern (sequence of beeps with pauses)
 */
function playBeepPattern(audioContext: AudioContext, pattern: number[]) {
  let currentTime = audioContext.currentTime;
  
  for (let i = 0; i < pattern.length; i++) {
    const duration = pattern[i];
    const isBeep = i % 2 === 0;
    
    if (isBeep) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration / 1000);
      
      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration / 1000);
    }
    
    currentTime += duration / 1000;
  }
}
