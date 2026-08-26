import { useCallback, useEffect, useRef, useState } from 'react';
import { isHapticSupported, triggerHaptic, type HapticPattern } from '@/lib/haptics';

export interface CprFeedbackState {
  audioSupported: boolean;
  audioUnlocked: boolean;
  hapticsSupported: boolean;
  unlockAudio: () => void;
  speak: (text: string, key?: string) => void;
  stopSpeech: () => void;
  pulse: (pattern?: HapticPattern) => void;
  clearSpokenKeys: () => void;
}

/**
 * Multimodal CPR feedback is deliberately redundant and progressive-enhancement only.
 * The text UI remains the safety-critical channel when speech or vibration is unavailable.
 */
export function useCprFeedback({
  audioEnabled,
  hapticsEnabled,
}: {
  audioEnabled: boolean;
  hapticsEnabled: boolean;
}): CprFeedbackState {
  const [audioSupported, setAudioSupported] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [hapticsSupported, setHapticsSupported] = useState(false);
  const spokenKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setAudioSupported(typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
    setHapticsSupported(typeof navigator !== 'undefined' && isHapticSupported());
  }, []);

  const unlockAudio = useCallback(() => {
    if (!audioSupported || typeof window === 'undefined') return;
    // Mobile browsers commonly require a user gesture before speech can play.
    // Cancel any stale queue, then mark the channel available for future alerts.
    window.speechSynthesis.cancel();
    setAudioUnlocked(true);
  }, [audioSupported]);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = useCallback(
    (text: string, key?: string) => {
      if (!audioEnabled || !audioUnlocked || !audioSupported || typeof window === 'undefined') return;
      const normalized = text.trim();
      if (!normalized) return;
      if (key && spokenKeysRef.current.has(key)) return;
      if (key) spokenKeysRef.current.add(key);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(normalized);
      utterance.rate = 1.05;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    },
    [audioEnabled, audioSupported, audioUnlocked],
  );

  const pulse = useCallback(
    (pattern: HapticPattern = 'medium') => {
      if (hapticsEnabled && hapticsSupported) triggerHaptic(pattern);
    },
    [hapticsEnabled, hapticsSupported],
  );

  const clearSpokenKeys = useCallback(() => {
    spokenKeysRef.current.clear();
  }, []);

  useEffect(() => stopSpeech, [stopSpeech]);

  return {
    audioSupported,
    audioUnlocked,
    hapticsSupported,
    unlockAudio,
    speak,
    stopSpeech,
    pulse,
    clearSpokenKeys,
  };
}
