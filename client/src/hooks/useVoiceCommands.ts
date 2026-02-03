/**
 * useVoiceCommands Hook
 * 
 * Web Speech API integration for hands-free voice control during resuscitation.
 * Enables providers to switch roles and trigger actions without touching the device.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface VoiceCommand {
  [phrase: string]: () => void;
}

interface UseVoiceCommandsOptions {
  commands: VoiceCommand;
  continuous?: boolean;
  language?: string;
}

interface UseVoiceCommandsReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
}

export function useVoiceCommands({
  commands,
  continuous = true,
  language = 'en-US',
}: UseVoiceCommandsOptions): UseVoiceCommandsReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript.toLowerCase().trim();
        
        setTranscript(transcriptText);

        // Check if transcript matches any command
        if (event.results[current].isFinal) {
          Object.entries(commands).forEach(([phrase, action]) => {
            if (transcriptText.includes(phrase.toLowerCase())) {
              console.log(`[Voice] Matched command: "${phrase}"`);
              action();
              setTranscript(''); // Clear after executing
            }
          });
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('[Voice] Recognition error:', event.error);
        if (event.error === 'no-speech' || event.error === 'audio-capture') {
          // Silently restart for these common errors
          if (isListening) {
            setTimeout(() => {
              try {
                recognition.start();
              } catch (e) {
                // Already started
              }
            }, 100);
          }
        } else {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Auto-restart if continuous mode and still supposed to be listening
        if (continuous && isListening) {
          try {
            recognition.start();
          } catch (e) {
            console.log('[Voice] Recognition already started');
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [commands, continuous, language, isListening]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        console.log('[Voice] Started listening');
      } catch (error) {
        console.error('[Voice] Failed to start:', error);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setTranscript('');
      console.log('[Voice] Stopped listening');
    }
  }, [isListening]);

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
  };
}
