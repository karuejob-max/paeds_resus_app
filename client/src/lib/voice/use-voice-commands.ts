/**
 * useVoiceCommands Hook
 * 
 * React hook for integrating voice commands into clinical components
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  VoiceRecognitionService,
  ClinicalVoiceCommandParser,
  VoiceFeedbackService,
  type VoiceCommand,
} from './voice-recognition-service';
import { VOICE_COMMAND_SCHEMA, getCommandsByEmergencyType } from './voice-command-schema';

export interface UseVoiceCommandsOptions {
  emergencyType: string;
  enabled?: boolean;
  onCommand?: (command: VoiceCommand) => void;
  onError?: (error: string) => void;
  confidenceThreshold?: number;
  language?: string;
}

export interface UseVoiceCommandsReturn {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  lastCommand: VoiceCommand | null;
  commandHistory: VoiceCommand[];
  isSupported: boolean;
  getAvailableCommands: () => string[];
}

export function useVoiceCommands({
  emergencyType,
  enabled = true,
  onCommand,
  onError,
  confidenceThreshold = 0.7,
  language = 'en-US',
}: UseVoiceCommandsOptions): UseVoiceCommandsReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([]);
  const [isSupported, setIsSupported] = useState(false);

  const voiceServiceRef = useRef<VoiceRecognitionService | null>(null);
  const parserRef = useRef<ClinicalVoiceCommandParser | null>(null);
  const feedbackServiceRef = useRef<VoiceFeedbackService | null>(null);

  // Initialize services
  useEffect(() => {
    if (!enabled) return;

    try {
      voiceServiceRef.current = new VoiceRecognitionService({
        language,
        continuous: true,
        interimResults: true,
        noiseThreshold: 0.3,
      });

      voiceServiceRef.current.setConfidenceThreshold(confidenceThreshold);
      setIsSupported(voiceServiceRef.current.isSupported());

      parserRef.current = new ClinicalVoiceCommandParser();
      feedbackServiceRef.current = new VoiceFeedbackService();

      // Listen for voice input events
      const handleVoiceInput = (event: Event) => {
        const customEvent = event as CustomEvent;
        const { transcript: input } = customEvent.detail;

        setTranscript(input);

        // Parse the voice input
        const parsedCommand = parserRef.current?.parseCommand(input);

        if (parsedCommand && parsedCommand.confidence > confidenceThreshold) {
          // Valid command recognized
          const voiceCommand: VoiceCommand = {
            command: input,
            category: parsedCommand.category,
            action: parsedCommand.action,
            confidence: parsedCommand.confidence,
            timestamp: Date.now(),
          };

          setLastCommand(voiceCommand);
          setCommandHistory(prev => [...prev.slice(-9), voiceCommand]);

          // Play success feedback
          feedbackServiceRef.current?.playCommandRecognized();

          // Call callback
          if (onCommand) {
            onCommand(voiceCommand);
          }
        } else if (input.length > 3) {
          // Invalid command
          feedbackServiceRef.current?.playCommandError();
          if (onError) {
            onError(`Command not recognized: "${input}"`);
          }
        }
      };

      window.addEventListener('voiceInput', handleVoiceInput);

      return () => {
        window.removeEventListener('voiceInput', handleVoiceInput);
        voiceServiceRef.current?.abort();
      };
    } catch (error) {
      console.error('Failed to initialize voice commands:', error);
      setIsSupported(false);
    }
  }, [enabled, confidenceThreshold, language, onCommand, onError]);

  const startListening = useCallback(() => {
    if (!voiceServiceRef.current?.isSupported()) {
      if (onError) {
        onError('Voice recognition not supported');
      }
      return;
    }

    voiceServiceRef.current?.start();
    setIsListening(true);
    feedbackServiceRef.current?.playListeningStarted();
  }, [onError]);

  const stopListening = useCallback(() => {
    voiceServiceRef.current?.stop();
    setIsListening(false);
  }, []);

  const getAvailableCommands = useCallback(() => {
    const commands = getCommandsByEmergencyType(emergencyType);
    return commands.flatMap(cmd => cmd.phrases);
  }, [emergencyType]);

  return {
    isListening,
    startListening,
    stopListening,
    transcript,
    lastCommand,
    commandHistory,
    isSupported,
    getAvailableCommands,
  };
}

/**
 * useVoiceCommandAction Hook
 * 
 * Simplified hook for triggering actions on specific voice commands
 */
export interface UseVoiceCommandActionOptions {
  emergencyType: string;
  commandPhrase: string;
  onMatch: (command: VoiceCommand) => void;
  enabled?: boolean;
}

export function useVoiceCommandAction({
  emergencyType,
  commandPhrase,
  onMatch,
  enabled = true,
}: UseVoiceCommandActionOptions): void {
  const { isListening, startListening } = useVoiceCommands({
    emergencyType,
    enabled,
    onCommand: (command) => {
      if (command.command.toLowerCase().includes(commandPhrase.toLowerCase())) {
        onMatch(command);
      }
    },
  });

  // Auto-start listening if enabled
  useEffect(() => {
    if (enabled && !isListening) {
      startListening();
    }
  }, [enabled, isListening, startListening]);
}

/**
 * useVoiceCommandShortcut Hook
 * 
 * Hook for keyboard/voice shortcuts
 */
export interface UseVoiceCommandShortcutOptions {
  emergencyType: string;
  shortcuts: Record<string, () => void>;
  enabled?: boolean;
}

export function useVoiceCommandShortcut({
  emergencyType,
  shortcuts,
  enabled = true,
}: UseVoiceCommandShortcutOptions): void {
  const { onCommand } = useVoiceCommands({
    emergencyType,
    enabled,
    onCommand: (command) => {
      // Match command action to shortcut
      const shortcutFn = shortcuts[command.action];
      if (shortcutFn) {
        shortcutFn();
      }
    },
  });
}
