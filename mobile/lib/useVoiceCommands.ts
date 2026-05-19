/**
 * mobile/lib/useVoiceCommands.ts
 *
 * Phase 8.4: Voice command support for hands-free ResusGPS data entry
 *
 * Designed for glove-wearing providers during resuscitation.
 *
 * Supported commands:
 *   "start CPR"             → triggers cardiac arrest mode
 *   "shock delivered"       → logs shock, resets CPR cycle
 *   "adrenaline given"      → logs adrenaline dose
 *   "pulse check"           → prompts rhythm check
 *   "ROSC"                  → triggers ROSC flow
 *   "weight [number]"       → sets patient weight
 *   "next step"             → advances to next intervention
 *   "complete [drug name]"  → marks intervention complete
 *   "unavailable [item]"    → marks resource unavailable
 *   "end case"              → prompts end case confirmation
 *
 * Uses expo-speech for TTS feedback (confirms command understood).
 * Uses @react-native-voice/voice for STT (speech-to-text).
 *
 * Fallback: if STT unavailable, shows a command picker modal.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

// Voice is a native module — import with try/catch for environments without it
let Voice: any = null;
try {
  Voice = require('@react-native-voice/voice').default;
} catch {
  // Voice not available in this environment — fallback mode active
}

export type VoiceCommand =
  | { type: 'START_CPR' }
  | { type: 'SHOCK_DELIVERED' }
  | { type: 'ADRENALINE_GIVEN' }
  | { type: 'PULSE_CHECK' }
  | { type: 'ROSC' }
  | { type: 'SET_WEIGHT'; kg: number }
  | { type: 'NEXT_STEP' }
  | { type: 'COMPLETE_INTERVENTION'; name: string }
  | { type: 'MARK_UNAVAILABLE'; name: string }
  | { type: 'END_CASE' }
  | { type: 'UNKNOWN'; transcript: string };

interface UseVoiceCommandsOptions {
  onCommand: (cmd: VoiceCommand) => void;
  enabled?: boolean;
}

interface UseVoiceCommandsReturn {
  isListening: boolean;
  isAvailable: boolean;
  lastTranscript: string;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  speak: (text: string) => void;
}

// ─── Command parser ───────────────────────────────────────────────────────────
function parseCommand(transcript: string): VoiceCommand {
  const t = transcript.toLowerCase().trim();

  if (t.includes('start cpr') || t.includes('cardiac arrest') || t.includes('start compressions')) {
    return { type: 'START_CPR' };
  }
  if (t.includes('shock delivered') || t.includes('shock given') || t.includes('defibrillation done')) {
    return { type: 'SHOCK_DELIVERED' };
  }
  if (t.includes('adrenaline given') || t.includes('epinephrine given') || t.includes('adrenaline done')) {
    return { type: 'ADRENALINE_GIVEN' };
  }
  if (t.includes('pulse check') || t.includes('check pulse') || t.includes('rhythm check')) {
    return { type: 'PULSE_CHECK' };
  }
  if (t.includes('rosc') || t.includes('return of spontaneous') || t.includes('pulse present')) {
    return { type: 'ROSC' };
  }
  if (t.includes('end case') || t.includes('end resus') || t.includes('stop resus')) {
    return { type: 'END_CASE' };
  }
  if (t.includes('next step') || t.includes('next intervention') || t.includes('proceed')) {
    return { type: 'NEXT_STEP' };
  }

  // Weight: "weight 12" or "patient weighs 12 kilograms"
  const weightMatch = t.match(/weight\s+(\d+(?:\.\d+)?)|weighs?\s+(\d+(?:\.\d+)?)/);
  if (weightMatch) {
    const kg = parseFloat(weightMatch[1] || weightMatch[2]);
    if (!isNaN(kg) && kg > 0 && kg <= 200) return { type: 'SET_WEIGHT', kg };
  }

  // Complete intervention: "complete IV access" or "done IV access"
  const completeMatch = t.match(/(?:complete|done|finished|given)\s+(.+)/);
  if (completeMatch) {
    return { type: 'COMPLETE_INTERVENTION', name: completeMatch[1].trim() };
  }

  // Unavailable: "unavailable IO needle" or "no IO needle"
  const unavailMatch = t.match(/(?:unavailable|no|don't have|not available)\s+(.+)/);
  if (unavailMatch) {
    return { type: 'MARK_UNAVAILABLE', name: unavailMatch[1].trim() };
  }

  return { type: 'UNKNOWN', transcript };
}

// ─── TTS feedback messages ────────────────────────────────────────────────────
const COMMAND_FEEDBACK: Partial<Record<VoiceCommand['type'], string>> = {
  START_CPR: 'CPR started. Clock running.',
  SHOCK_DELIVERED: 'Shock logged. Resume compressions.',
  ADRENALINE_GIVEN: 'Adrenaline logged.',
  PULSE_CHECK: 'Pulse check. Assess rhythm.',
  ROSC: 'ROSC noted. Starting post-resuscitation care.',
  NEXT_STEP: 'Next step.',
  END_CASE: 'Confirm end case on screen.',
};

export function useVoiceCommands({
  onCommand,
  enabled = true,
}: UseVoiceCommandsOptions): UseVoiceCommandsReturn {
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  // Check availability on mount
  useEffect(() => {
    if (!Voice) { setIsAvailable(false); return; }
    Voice.isAvailable().then((available: boolean) => {
      setIsAvailable(available);
    }).catch(() => setIsAvailable(false));

    return () => {
      Voice?.destroy().catch(() => {});
    };
  }, []);

  // Wire up Voice event handlers
  useEffect(() => {
    if (!Voice || !enabled) return;

    Voice.onSpeechResults = (e: any) => {
      const results: string[] = e.value || [];
      if (!results.length) return;
      const transcript = results[0];
      setLastTranscript(transcript);

      const cmd = parseCommand(transcript);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // TTS feedback
      const feedback = cmd.type !== 'UNKNOWN'
        ? (COMMAND_FEEDBACK[cmd.type] ?? `Command: ${cmd.type.toLowerCase().replace(/_/g, ' ')}`)
        : `Not recognised: ${transcript}`;
      Speech.speak(feedback, { rate: 1.1, pitch: 1.0 });

      onCommandRef.current(cmd);
    };

    Voice.onSpeechError = (e: any) => {
      console.warn('[voice] STT error:', e);
      setIsListening(false);
    };

    Voice.onSpeechEnd = () => {
      setIsListening(false);
    };

    return () => {
      Voice.onSpeechResults = null;
      Voice.onSpeechError = null;
      Voice.onSpeechEnd = null;
    };
  }, [enabled]);

  const startListening = useCallback(async () => {
    if (!Voice || !isAvailable || !enabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Voice.start('en-US');
      setIsListening(true);
    } catch (e) {
      console.warn('[voice] Failed to start STT:', e);
      setIsListening(false);
    }
  }, [isAvailable, enabled]);

  const stopListening = useCallback(async () => {
    if (!Voice) return;
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e) {
      console.warn('[voice] Failed to stop STT:', e);
    }
  }, []);

  const speak = useCallback((text: string) => {
    Speech.speak(text, { rate: 1.1, pitch: 1.0 });
  }, []);

  return { isListening, isAvailable, lastTranscript, startListening, stopListening, speak };
}

// ─── VoiceCommandButton — drop-in UI component ───────────────────────────────
// Import and place anywhere in the ResusGPS active screen

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated } from 'react-native';
import { Mic, MicOff } from 'lucide-react-native';

interface VoiceCommandButtonProps {
  isListening: boolean;
  isAvailable: boolean;
  onPress: () => void;
  lastTranscript?: string;
}

export function VoiceCommandButton({
  isListening,
  isAvailable,
  onPress,
  lastTranscript,
}: VoiceCommandButtonProps) {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!isListening) { pulseAnim.setValue(1); return; }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isListening, pulseAnim]);

  if (!isAvailable) return null;

  return (
    <View style={vcStyles.container}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Animated.View
          style={[
            vcStyles.btn,
            isListening && vcStyles.btnActive,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          {isListening
            ? <Mic color="#fff" size={22} />
            : <MicOff color="#64748b" size={22} />}
        </Animated.View>
      </TouchableOpacity>
      {lastTranscript ? (
        <Text style={vcStyles.transcript} numberOfLines={1}>"{lastTranscript}"</Text>
      ) : (
        <Text style={vcStyles.hint}>{isListening ? 'Listening...' : 'Tap to speak'}</Text>
      )}
    </View>
  );
}

const vcStyles = StyleSheet.create({
  container: { alignItems: 'center', gap: 4 },
  btn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#334155',
  },
  btnActive: { backgroundColor: '#dc2626', borderColor: '#ef4444' },
  transcript: { fontSize: 11, color: '#94a3b8', maxWidth: 120, textAlign: 'center' },
  hint: { fontSize: 11, color: '#475569' },
});
