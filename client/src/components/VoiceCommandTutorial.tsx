/**
 * Voice Command Tutorial Overlay
 * 
 * First-time user tutorial explaining voice command functionality.
 * Shows example commands and how to activate voice mode.
 */

import { useState, useEffect } from 'react';
import { X, Mic, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceCommandTutorialProps {
  onClose: () => void;
  onStartTutorial?: () => void;
}

export function VoiceCommandTutorial({ onClose, onStartTutorial }: VoiceCommandTutorialProps) {
  const [step, setStep] = useState(1);

  const examples = [
    { category: 'Vital Signs', commands: ['"Respiratory rate 40"', '"Heart rate 120"', '"SpO2 92"', '"Temperature 38"'] },
    { category: 'Assessment', commands: ['"Patent airway"', '"Alert"', '"Pupils equal and reactive"', '"Cap refill 2 seconds"'] },
    { category: 'Findings', commands: ['"Wheezing"', '"Weak pulse"', '"Warm and pink"', '"Normal breathing"'] },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border-2 border-cyan-500 rounded-lg max-w-2xl w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
              <Mic className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Hands-Free Voice Commands</h2>
              <p className="text-gray-400 text-sm">Work faster during resuscitation</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${
                s === step ? 'bg-cyan-500' : s < step ? 'bg-cyan-500/50' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Why Voice Commands?</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span><strong>Gloves stay on</strong> - No need to remove PPE to touch the screen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span><strong>Hands stay free</strong> - Continue chest compressions or procedures</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span><strong>Faster data entry</strong> - Speak naturally instead of typing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span><strong>Eyes on patient</strong> - Look at the child, not the screen</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">How to Activate</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
                  <div className="h-10 w-10 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-cyan-400 font-bold">1</span>
                  </div>
                  <p className="text-gray-300">Click the <Mic className="inline h-4 w-4 text-cyan-400 mx-1" /> microphone button in the header</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
                  <div className="h-10 w-10 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-cyan-400 font-bold">2</span>
                  </div>
                  <p className="text-gray-300">Button turns <span className="text-red-400 font-semibold">red and pulses</span> when listening</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
                  <div className="h-10 w-10 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-cyan-400 font-bold">3</span>
                  </div>
                  <p className="text-gray-300">Speak your command clearly - you'll hear a <Volume2 className="inline h-4 w-4 text-green-400 mx-1" /> beep when recognized</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Example Commands</h3>
              <div className="space-y-4">
                {examples.map((category, idx) => (
                  <div key={idx}>
                    <h4 className="text-sm font-semibold text-cyan-400 mb-2">{category.category}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {category.commands.map((cmd, cmdIdx) => (
                        <div
                          key={cmdIdx}
                          className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 font-mono"
                        >
                          {cmd}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <p className="text-sm text-cyan-300">
                  <strong>Tip:</strong> Speak naturally. The system understands variations like "Resp rate 40" or "RR forty".
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-700">
          <Button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:text-white disabled:opacity-30"
          >
            Previous
          </Button>
          
          <span className="text-sm text-gray-400">
            Step {step} of 3
          </span>

          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (onStartTutorial) onStartTutorial();
                onClose();
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Got It! Start Using Voice
            </Button>
          )}
        </div>

        {/* Skip Option */}
        <div className="text-center mt-4">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-400 underline"
          >
            Skip tutorial
          </button>
        </div>
      </div>
    </div>
  );
}
