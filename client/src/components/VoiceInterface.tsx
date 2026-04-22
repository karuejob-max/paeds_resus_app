/**
 * Voice Interface Component for ResusGPS
 * 
 * Provides UI for voice command recognition with visual feedback
 * Includes microphone toggle, listening indicator, and command feedback
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  VoiceRecognitionService,
  ClinicalVoiceCommandParser,
  VoiceFeedbackService,
} from '@/lib/voice/voice-recognition-service';
import { VOICE_COMMAND_SCHEMA, type VoiceCommandDefinition } from '@/lib/voice/voice-command-schema';

interface VoiceInterfaceProps {
  emergencyType: string;
  onCommandReceived: (command: string, action: string) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  emergencyType,
  onCommandReceived,
  onError,
  enabled = true,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [showCommandList, setShowCommandList] = useState(false);
  const [confidence, setConfidence] = useState(0);

  const voiceServiceRef = useRef<VoiceRecognitionService | null>(null);
  const parserRef = useRef<ClinicalVoiceCommandParser | null>(null);
  const feedbackServiceRef = useRef<VoiceFeedbackService | null>(null);

  useEffect(() => {
    // Initialize services
    voiceServiceRef.current = new VoiceRecognitionService({
      language: 'en-US',
      continuous: true,
      interimResults: true,
    });

    parserRef.current = new ClinicalVoiceCommandParser();
    feedbackServiceRef.current = new VoiceFeedbackService();

    // Listen for voice input events
    const handleVoiceInput = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { transcript: input, timestamp } = customEvent.detail;

      setTranscript(input);

      // Parse the voice input
      const command = parserRef.current?.parseCommand(input);

      if (command && command.confidence > 0.7) {
        // Valid command recognized
        setLastCommand(input);
        setConfidence(command.confidence);
        setCommandHistory(prev => [...prev, input]);

        // Play success feedback
        feedbackServiceRef.current?.playCommandRecognized();

        // Emit command
        onCommandReceived(input, command.action);
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
  }, [onCommandReceived, onError]);

  const toggleListening = () => {
    if (!voiceServiceRef.current?.isSupported()) {
      if (onError) {
        onError('Voice recognition not supported in this browser');
      }
      return;
    }

    if (isListening) {
      voiceServiceRef.current?.stop();
      setIsListening(false);
    } else {
      voiceServiceRef.current?.start();
      setIsListening(true);
      feedbackServiceRef.current?.playListeningStarted();
    }
  };

  const getAvailableCommands = (): VoiceCommandDefinition[] => {
    return Object.values(VOICE_COMMAND_SCHEMA).filter(cmd =>
      cmd.emergencyTypes.length === 0 || cmd.emergencyTypes.includes(emergencyType)
    );
  };

  if (!enabled || !voiceServiceRef.current?.isSupported()) {
    return null;
  }

  const availableCommands = getAvailableCommands();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-slate-800 border-t border-slate-700 p-4 z-50">
      {/* Microphone Toggle Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Listening Indicator */}
          <button
            onClick={toggleListening}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500 shadow-lg shadow-red-500/50 animate-pulse'
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
            title={isListening ? 'Stop listening' : 'Start voice recognition'}
          >
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2a4 4 0 00-4 4v4a4 4 0 008 0V6a4 4 0 00-4-4zm0 14c2.21 0 4-1.79 4-4h2c0 3.31-2.69 6-6 6s-6-2.69-6-6h2c0 2.21 1.79 4 4 4z" />
            </svg>
          </button>

          {/* Status Text */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              {isListening ? 'Listening...' : 'Voice Recognition Ready'}
            </p>
            {transcript && (
              <p className="text-xs text-slate-300 mt-1">
                Heard: "{transcript}"
              </p>
            )}
            {lastCommand && confidence > 0 && (
              <p className="text-xs text-green-400 mt-1">
                ✓ {lastCommand} ({Math.round(confidence * 100)}%)
              </p>
            )}
          </div>
        </div>

        {/* Help Button */}
        <button
          onClick={() => setShowCommandList(!showCommandList)}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
          title="Show available commands"
        >
          ?
        </button>
      </div>

      {/* Command List */}
      {showCommandList && (
        <div className="bg-slate-800 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto border border-slate-700">
          <h3 className="text-sm font-bold text-white mb-3">Available Voice Commands</h3>
          
          {/* Critical Commands */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-red-400 mb-2">CRITICAL</p>
            <div className="grid grid-cols-2 gap-2">
              {availableCommands
                .filter(cmd => cmd.priority === 'critical')
                .map(cmd => (
                  <div key={cmd.action} className="text-xs text-slate-300 bg-slate-700 px-2 py-1 rounded">
                    <p className="font-mono text-red-300">{cmd.phrases[0]}</p>
                    <p className="text-slate-400">{cmd.description}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* High Priority Commands */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-yellow-400 mb-2">HIGH PRIORITY</p>
            <div className="grid grid-cols-2 gap-2">
              {availableCommands
                .filter(cmd => cmd.priority === 'high')
                .slice(0, 6)
                .map(cmd => (
                  <div key={cmd.action} className="text-xs text-slate-300 bg-slate-700 px-2 py-1 rounded">
                    <p className="font-mono text-yellow-300">{cmd.phrases[0]}</p>
                    <p className="text-slate-400">{cmd.description}</p>
                  </div>
                ))}
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-3">
            {availableCommands.length} total commands available for {emergencyType}
          </p>
        </div>
      )}

      {/* Command History */}
      {commandHistory.length > 0 && (
        <div className="text-xs text-slate-400">
          <p className="font-semibold mb-2">Recent Commands:</p>
          <div className="flex flex-wrap gap-2">
            {commandHistory.slice(-5).map((cmd, idx) => (
              <span key={idx} className="bg-slate-700 px-2 py-1 rounded">
                {cmd}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Voice Command Indicator Component
 * 
 * Minimal indicator for voice command status
 */
interface VoiceCommandIndicatorProps {
  isListening: boolean;
  lastCommand?: string;
  confidence?: number;
}

export const VoiceCommandIndicator: React.FC<VoiceCommandIndicatorProps> = ({
  isListening,
  lastCommand,
  confidence = 0,
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Listening Dot */}
      <div
        className={`w-3 h-3 rounded-full transition-all ${
          isListening
            ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50'
            : 'bg-slate-400'
        }`}
      />

      {/* Status Text */}
      <span className="text-xs font-medium text-slate-600">
        {isListening ? 'Listening' : 'Ready'}
      </span>

      {/* Last Command */}
      {lastCommand && confidence > 0.7 && (
        <span className="text-xs text-green-600 font-mono">
          ✓ {lastCommand}
        </span>
      )}
    </div>
  );
};

/**
 * Voice Command Feedback Toast Component
 * 
 * Displays feedback for voice commands
 */
interface VoiceCommandFeedbackProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

export const VoiceCommandFeedback: React.FC<VoiceCommandFeedbackProps> = ({
  message,
  type,
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose?.(), duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }[type];

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }[type];

  return (
    <div
      className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in`}
    >
      <span className="font-bold">{icon}</span>
      <span className="text-sm">{message}</span>
    </div>
  );
};
