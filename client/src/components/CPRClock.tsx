/**
 * CPR Clock - Optimal Cardiac Arrest Management
 * 
 * Full-screen, voice-guided, auto-progressing CPR timer following AHA 2025 guidelines.
 * Designed for zero cognitive load during resuscitation.
 * 
 * Key Features:
 * - Automatic 2-minute rhythm check prompts
 * - Voice announcements for critical actions
 * - Drug timing (epinephrine every 3-5 min, amiodarone after 3rd shock)
 * - Event log with timestamps
 * - ROSC detection and post-arrest summary
 * - Compression metronome (100-120 bpm)
 * - Reversible causes checklist
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Zap, 
  Syringe, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX
} from 'lucide-react';

interface Props {
  patientWeight: number;
  onClose: () => void;
}

type ArrestPhase = 'compressions' | 'rhythm_check' | 'shock' | 'drug';
type RhythmType = 'shockable' | 'non_shockable' | null;

interface ArrestEvent {
  id: string;
  timestamp: number; // seconds since arrest start
  action: string;
  details?: string;
}

export function CPRClock({ patientWeight, onClose }: Props) {
  // Core timing state
  const [isRunning, setIsRunning] = useState(false);
  const [arrestDuration, setArrestDuration] = useState(0); // seconds
  const [cycleTime, setCycleTime] = useState(0); // seconds in current 2-min cycle
  const [phase, setPhase] = useState<ArrestPhase>('compressions');
  
  // Clinical state
  const [rhythmType, setRhythmType] = useState<RhythmType>(null);
  const [shockCount, setShockCount] = useState(0);
  const [epiDoses, setEpiDoses] = useState(0);
  const [lastEpiTime, setLastEpiTime] = useState<number | null>(null);
  const [amiodaroneGiven, setAmiodaroneGiven] = useState(false);
  const [roscAchieved, setRoscAchieved] = useState(false);
  
  // Event log
  const [events, setEvents] = useState<ArrestEvent[]>([]);
  
  // UI state
  const [showRhythmCheck, setShowRhythmCheck] = useState(false);
  const [showReversibleCauses, setShowReversibleCauses] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [compressionMetronome, setCompressionMetronome] = useState(false);
  
  // Refs for intervals
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const metronomeRef = useRef<NodeJS.Timeout | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Calculate doses
  const epiDose = Math.round(patientWeight * 0.01 * 100) / 100; // 0.01 mg/kg
  const amiodaroneDose = Math.round(patientWeight * 5); // 5 mg/kg, max 300mg first dose

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Voice synthesis
  const speak = useCallback((text: string, priority: 'high' | 'normal' = 'normal') => {
    if (!audioEnabled) return;
    
    // Cancel previous speech if high priority
    if (priority === 'high' && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1; // Slightly faster for urgency
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [audioEnabled]);

  // Play tone
  const playTone = useCallback((frequency: number, duration: number) => {
    if (!audioEnabled) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }, [audioEnabled]);

  // Add event to log
  const addEvent = useCallback((action: string, details?: string) => {
    const event: ArrestEvent = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: arrestDuration,
      action,
      details
    };
    setEvents(prev => [event, ...prev].slice(0, 10)); // Keep last 10 events
  }, [arrestDuration]);

  // Start CPR
  const startCPR = () => {
    setIsRunning(true);
    setPhase('compressions');
    addEvent('CPR Started', 'High-quality compressions at 100-120/min');
    speak('CPR started. Begin compressions.', 'high');
  };

  // Pause/Resume
  const togglePause = () => {
    setIsRunning(!isRunning);
    if (isRunning) {
      speak('CPR paused');
    } else {
      speak('CPR resumed');
    }
  };

  // Rhythm check
  const initiateRhythmCheck = () => {
    setShowRhythmCheck(true);
    setPhase('rhythm_check');
    playTone(800, 0.3);
    playTone(800, 0.3);
    speak('STOP. Rhythm check now.', 'high');
  };

  // Handle rhythm assessment
  const handleRhythmAssessment = (type: RhythmType) => {
    setRhythmType(type);
    setShowRhythmCheck(false);
    
    if (type === 'shockable') {
      setPhase('shock');
      addEvent('Shockable Rhythm', 'VF or pulseless VT detected');
      speak('Shockable rhythm. Prepare to shock.', 'high');
    } else {
      setPhase('compressions');
      setCycleTime(0); // Reset cycle
      addEvent('Non-Shockable Rhythm', 'Asystole or PEA - continue CPR');
      speak('Non-shockable rhythm. Resume compressions immediately.', 'high');
      
      // Check if epinephrine is due
      if (lastEpiTime === null || (arrestDuration - lastEpiTime) >= 180) {
        setTimeout(() => {
          setPhase('drug');
          speak('Give epinephrine now', 'high');
        }, 2000);
      }
    }
  };

  // Deliver shock
  const deliverShock = () => {
    const newShockCount = shockCount + 1;
    setShockCount(newShockCount);
    setPhase('compressions');
    setCycleTime(0); // Reset cycle
    addEvent(`Shock ${newShockCount} Delivered`, `${2 + (newShockCount - 1) * 2}J/kg`);
    playTone(1000, 0.5);
    speak('Shock delivered. Resume compressions immediately.', 'high');
    
    // Epinephrine after 2nd shock (if shockable)
    if (newShockCount === 2 && epiDoses === 0) {
      setTimeout(() => {
        setPhase('drug');
        speak('Give epinephrine now', 'high');
      }, 2000);
    }
    
    // Amiodarone after 3rd shock
    if (newShockCount === 3 && !amiodaroneGiven) {
      setTimeout(() => {
        setPhase('drug');
        speak('Give amiodarone now', 'high');
      }, 4000);
    }
  };

  // Give epinephrine
  const giveEpinephrine = () => {
    setEpiDoses(prev => prev + 1);
    setLastEpiTime(arrestDuration);
    setPhase('compressions');
    addEvent('Epinephrine Given', `${epiDose} mg IV/IO (1:10,000)`);
    speak('Epinephrine given. Continue CPR.', 'normal');
  };

  // Give amiodarone
  const giveAmiodarone = () => {
    setAmiodaroneGiven(true);
    setPhase('compressions');
    addEvent('Amiodarone Given', `${Math.min(amiodaroneDose, 300)} mg IV/IO`);
    speak('Amiodarone given. Continue CPR.', 'normal');
  };

  // ROSC achieved
  const achieveROSC = () => {
    setRoscAchieved(true);
    setIsRunning(false);
    addEvent('ROSC Achieved', 'Pulse detected - post-arrest care');
    playTone(1200, 0.3);
    playTone(1400, 0.3);
    playTone(1600, 0.5);
    speak('Return of spontaneous circulation. Pulse detected. Stop compressions.', 'high');
  };

  // Main timer effect
  useEffect(() => {
    if (isRunning && !roscAchieved) {
      timerRef.current = setInterval(() => {
        setArrestDuration(prev => prev + 1);
        setCycleTime(prev => {
          const newCycleTime = prev + 1;
          
          // 30-second warning before rhythm check
          if (newCycleTime === 90) {
            playTone(600, 0.2);
            speak('Rhythm check in 30 seconds');
          }
          
          // 2-minute rhythm check
          if (newCycleTime >= 120) {
            initiateRhythmCheck();
            return 0; // Reset cycle
          }
          
          return newCycleTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, roscAchieved]);

  // Epinephrine timing check
  useEffect(() => {
    if (isRunning && !roscAchieved && phase === 'compressions') {
      // Check if epinephrine is due (every 3-5 minutes)
      if (lastEpiTime !== null) {
        const timeSinceLastEpi = arrestDuration - lastEpiTime;
        
        // Warning at 2:45 (15 seconds before due)
        if (timeSinceLastEpi === 165) {
          speak('Prepare epinephrine');
        }
        
        // Due at 3:00
        if (timeSinceLastEpi >= 180 && phase === 'compressions') {
          setPhase('drug');
          speak('Epinephrine due now', 'high');
        }
      }
    }
  }, [arrestDuration, lastEpiTime, isRunning, roscAchieved, phase]);

  // Reversible causes reminder (every 4 minutes)
  useEffect(() => {
    if (isRunning && !roscAchieved && arrestDuration > 0 && arrestDuration % 240 === 0) {
      speak('Check reversible causes');
      playTone(500, 0.2);
    }
  }, [arrestDuration, isRunning, roscAchieved]);

  // Compression metronome
  useEffect(() => {
    if (compressionMetronome && phase === 'compressions' && isRunning) {
      metronomeRef.current = setInterval(() => {
        playTone(800, 0.05);
      }, 545); // ~110 bpm
    } else {
      if (metronomeRef.current) {
        clearInterval(metronomeRef.current);
        metronomeRef.current = null;
      }
    }
    
    return () => {
      if (metronomeRef.current) {
        clearInterval(metronomeRef.current);
      }
    };
  }, [compressionMetronome, phase, isRunning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (metronomeRef.current) clearInterval(metronomeRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Get current action display
  const getCurrentAction = () => {
    switch (phase) {
      case 'compressions':
        return { text: 'COMPRESSIONS', subtitle: 'Continue high-quality CPR', color: 'bg-blue-600', icon: Activity };
      case 'rhythm_check':
        return { text: 'RHYTHM CHECK', subtitle: 'Stop compressions - analyze rhythm', color: 'bg-yellow-600', icon: Heart };
      case 'shock':
        return { text: 'SHOCK', subtitle: 'Clear patient - deliver shock', color: 'bg-red-600', icon: Zap };
      case 'drug':
        return { text: epiDoses === shockCount && shockCount >= 3 && !amiodaroneGiven ? 'AMIODARONE' : 'EPINEPHRINE', subtitle: 'Administer medication', color: 'bg-green-600', icon: Syringe };
    }
  };

  const currentAction = getCurrentAction();
  const timeToNextRhythmCheck = 120 - cycleTime;
  const timeToNextEpi = lastEpiTime !== null ? Math.max(0, 180 - (arrestDuration - lastEpiTime)) : 0;

  // If not started
  if (!isRunning && arrestDuration === 0) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8 text-center space-y-6">
            <Heart className="h-24 w-24 mx-auto text-red-500" />
            <div>
              <h2 className="text-3xl font-bold mb-2">Cardiac Arrest Management</h2>
              <p className="text-muted-foreground">Patient Weight: {patientWeight} kg</p>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4 text-left">
              <h3 className="font-bold mb-2">Before Starting:</h3>
              <ul className="text-sm space-y-1">
                <li>✓ Confirm cardiac arrest (no pulse, not breathing)</li>
                <li>✓ Call for help / activate code</li>
                <li>✓ Position patient on firm surface</li>
                <li>✓ Attach defibrillator pads</li>
                <li>✓ Prepare emergency medications</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                className="h-16 text-xl bg-red-600 hover:bg-red-700"
                onClick={startCPR}
              >
                <Play className="h-6 w-6 mr-2" />
                START CPR
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-16"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Post-ROSC summary
  if (roscAchieved) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
        <Card className="max-w-3xl w-full">
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <div className="bg-green-500/20 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-green-500 mb-2">ROSC ACHIEVED</h2>
              <p className="text-xl text-muted-foreground">Return of Spontaneous Circulation</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{formatTime(arrestDuration)}</div>
                <div className="text-sm text-muted-foreground">Total Duration</div>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{shockCount}</div>
                <div className="text-sm text-muted-foreground">Shocks Delivered</div>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{epiDoses}</div>
                <div className="text-sm text-muted-foreground">Epi Doses</div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
              <h3 className="font-bold mb-3">Post-Arrest Care Priorities:</h3>
              <ul className="text-sm space-y-2">
                <li>✓ Optimize oxygenation (SpO2 94-98%)</li>
                <li>✓ Optimize ventilation (ETCO2 35-40 mmHg)</li>
                <li>✓ Maintain blood pressure (MAP age-appropriate)</li>
                <li>✓ Targeted temperature management if indicated</li>
                <li>✓ Treat underlying cause</li>
                <li>✓ Prepare for PICU transfer</li>
              </ul>
            </div>

            <div className="bg-muted rounded-lg p-4 max-h-48 overflow-y-auto">
              <h3 className="font-bold mb-2">Event Log:</h3>
              <div className="space-y-1 text-sm">
                {events.map(event => (
                  <div key={event.id} className="flex items-start gap-2">
                    <span className="text-muted-foreground font-mono">{formatTime(event.timestamp)}</span>
                    <span className="font-medium">{event.action}</span>
                    {event.details && <span className="text-muted-foreground">- {event.details}</span>}
                  </div>
                ))}
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={onClose}
            >
              Close CPR Clock
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main CPR Clock interface
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 z-50 flex flex-col text-white">
      {/* Header - Arrest Duration */}
      <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Heart className="h-8 w-8 animate-pulse" />
          <div>
            <div className="text-sm font-medium opacity-90">CARDIAC ARREST</div>
            <div className="text-4xl font-bold font-mono">{formatTime(arrestDuration)}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => setAudioEnabled(!audioEnabled)}
          >
            {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={togglePause}
          >
            {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content - Current Action */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
        <div className={`${currentAction.color} rounded-3xl px-16 py-12 text-center ${phase === 'compressions' ? 'animate-pulse' : ''}`}>
          <currentAction.icon className="h-24 w-24 mx-auto mb-4" />
          <div className="text-7xl font-bold mb-2">{currentAction.text}</div>
          <div className="text-2xl opacity-90">{currentAction.subtitle}</div>
        </div>

        {/* Next Action Countdown */}
        {phase === 'compressions' && (
          <div className="text-center space-y-2">
            <div className="text-xl text-gray-400">Next: Rhythm Check in</div>
            <div className={`text-5xl font-bold font-mono ${timeToNextRhythmCheck <= 30 ? 'text-orange-500' : 'text-white'}`}>
              {formatTime(timeToNextRhythmCheck)}
            </div>
            {timeToNextEpi > 0 && timeToNextEpi < 180 && (
              <div className="text-lg text-gray-400 mt-4">
                Epinephrine in {formatTime(timeToNextEpi)}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          {phase === 'shock' && (
            <Button
              size="lg"
              className="h-20 px-12 text-2xl bg-red-600 hover:bg-red-700"
              onClick={deliverShock}
            >
              <Zap className="h-8 w-8 mr-3" />
              DELIVER SHOCK
            </Button>
          )}
          
          {phase === 'drug' && (
            <>
              {(!amiodaroneGiven && shockCount >= 3 && epiDoses >= shockCount) ? (
                <Button
                  size="lg"
                  className="h-20 px-12 text-2xl bg-green-600 hover:bg-green-700"
                  onClick={giveAmiodarone}
                >
                  <Syringe className="h-8 w-8 mr-3" />
                  GIVE AMIODARONE {Math.min(amiodaroneDose, 300)} mg
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="h-20 px-12 text-2xl bg-green-600 hover:bg-green-700"
                  onClick={giveEpinephrine}
                >
                  <Syringe className="h-8 w-8 mr-3" />
                  GIVE EPINEPHRINE {epiDose} mg
                </Button>
              )}
            </>
          )}
          
          <Button
            size="lg"
            variant="outline"
            className="h-20 px-8 text-xl border-green-500 text-green-500 hover:bg-green-500/20"
            onClick={achieveROSC}
          >
            <CheckCircle2 className="h-6 w-6 mr-2" />
            ROSC Achieved
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            className="h-20 px-8 text-xl border-yellow-500 text-yellow-500 hover:bg-yellow-500/20"
            onClick={() => setShowReversibleCauses(true)}
          >
            <AlertTriangle className="h-6 w-6 mr-2" />
            Hs & Ts
          </Button>
        </div>
      </div>

      {/* Progress Bar - 2-Minute Cycle */}
      <div className="px-6 py-4 bg-black/50">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span>Rhythm Check Cycle</span>
          <span className="font-mono">{formatTime(cycleTime)} / 02:00</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-1000"
            style={{ width: `${(cycleTime / 120) * 100}%` }}
          />
        </div>
      </div>

      {/* Event Log */}
      <div className="bg-black/70 px-6 py-4 max-h-48 overflow-y-auto border-t border-gray-800">
        <div className="space-y-2">
          {events.slice(0, 5).map(event => (
            <div key={event.id} className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-400 font-mono">{formatTime(event.timestamp)}</span>
              <span className="font-medium">{event.action}</span>
              {event.details && <span className="text-gray-400">- {event.details}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Rhythm Check Modal */}
      {showRhythmCheck && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-8 z-10">
          <Card className="max-w-2xl w-full">
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <Heart className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
                <h3 className="text-3xl font-bold mb-2">RHYTHM CHECK</h3>
                <p className="text-muted-foreground">Analyze rhythm - select type</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  size="lg"
                  className="h-32 flex-col bg-red-600 hover:bg-red-700"
                  onClick={() => handleRhythmAssessment('shockable')}
                >
                  <Zap className="h-12 w-12 mb-2" />
                  <div className="text-xl font-bold">SHOCKABLE</div>
                  <div className="text-sm opacity-80">VF / Pulseless VT</div>
                </Button>

                <Button
                  size="lg"
                  className="h-32 flex-col bg-gray-600 hover:bg-gray-700"
                  onClick={() => handleRhythmAssessment('non_shockable')}
                >
                  <Activity className="h-12 w-12 mb-2" />
                  <div className="text-xl font-bold">NON-SHOCKABLE</div>
                  <div className="text-sm opacity-80">Asystole / PEA</div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reversible Causes Checklist */}
      {showReversibleCauses && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-8 z-10">
          <Card className="max-w-3xl w-full">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Reversible Causes (Hs & Ts)</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowReversibleCauses(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-bold text-lg">Hs</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="font-bold">Hypoxia:</div>
                      <div>Check oxygen, ventilation</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="font-bold">Hypovolemia:</div>
                      <div>Fluid bolus, blood products</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="font-bold">Hydrogen ion (Acidosis):</div>
                      <div>Ventilation, sodium bicarb if severe</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="font-bold">Hypo/Hyperkalemia:</div>
                      <div>Check K+, calcium, glucose</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="font-bold">Hypothermia:</div>
                      <div>Warm patient if cold</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-lg">Ts</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="font-bold">Tension Pneumothorax:</div>
                      <div>Needle decompression</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="font-bold">Tamponade (Cardiac):</div>
                      <div>Pericardiocentesis</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="font-bold">Toxins:</div>
                      <div>Antidotes if known ingestion</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="font-bold">Thrombosis (PE):</div>
                      <div>Consider thrombolytics</div>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={() => setShowReversibleCauses(false)}
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
