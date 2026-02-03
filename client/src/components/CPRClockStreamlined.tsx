/**
 * Streamlined CPR Clock with Team Coordination
 * 
 * Clinical workflow aligned with AHA PALS guidelines:
 * 1. Immediate rhythm assessment (not waiting 2 min)
 * 2. Pre-charge defib 15s before cycle ends
 * 3. Antiarrhythmic after 5th shock (amiodarone OR lidocaine)
 * 4. Compression metronome (100-120 bpm)
 * 5. Reversible causes prompts
 * 6. Advanced airway prompts
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  VolumeX,
  QrCode,
  Users,
  UserPlus,
  Mic,
  MicOff,
  Wind
} from 'lucide-react';
import QRCode from 'qrcode';
import { trpc } from '@/lib/trpc';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';

interface Props {
  patientWeight: number;
  patientAgeMonths?: number;
  onClose: () => void;
}

type ArrestPhase = 'initial_assessment' | 'compressions' | 'rhythm_check' | 'charging' | 'shock_ready' | 'post_shock';
type RhythmType = 'vf_pvt' | 'pea' | 'asystole' | null;
type TeamRole = 'team_leader' | 'compressions' | 'airway' | 'iv_access' | 'medications' | 'recorder' | 'observer';
type AntiarrhythmicChoice = 'amiodarone' | 'lidocaine' | null;

interface ArrestEvent {
  id: string;
  timestamp: number;
  action: string;
  details?: string;
  performedBy?: string;
}

interface TeamMember {
  id: number;
  providerName: string;
  role: TeamRole | null;
  userId: number | null;
}

const ROLE_LABELS: Record<TeamRole, string> = {
  team_leader: 'Team Leader',
  compressions: 'Compressions',
  airway: 'Airway',
  iv_access: 'IV/IO Access',
  medications: 'Medications',
  recorder: 'Recorder',
  observer: 'Observer',
};

const ROLE_COLORS: Record<TeamRole, string> = {
  team_leader: 'bg-purple-500',
  compressions: 'bg-red-500',
  airway: 'bg-blue-500',
  iv_access: 'bg-green-500',
  medications: 'bg-yellow-500',
  recorder: 'bg-gray-500',
  observer: 'bg-gray-400',
};

export function CPRClockStreamlined({ patientWeight, patientAgeMonths, onClose }: Props) {
  // Session state
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  
  // Core timing state
  const [isRunning, setIsRunning] = useState(false);
  const [arrestDuration, setArrestDuration] = useState(0);
  const [cycleTime, setCycleTime] = useState(0);
  const [phase, setPhase] = useState<ArrestPhase>('initial_assessment');
  
  // Clinical state
  const [rhythmType, setRhythmType] = useState<RhythmType>(null);
  const [shockCount, setShockCount] = useState(0);
  const [epiDoses, setEpiDoses] = useState(0);
  const [lastEpiTime, setLastEpiTime] = useState<number | null>(null);
  const [antiarrhythmic, setAntiarrhythmic] = useState<AntiarrhythmicChoice>(null);
  const [advancedAirwayPlaced, setAdvancedAirwayPlaced] = useState(false);
  const [roscAchieved, setRoscAchieved] = useState(false);
  
  // Event log
  const [events, setEvents] = useState<ArrestEvent[]>([]);
  
  // UI state
  const [showRhythmCheck, setShowRhythmCheck] = useState(false);
  const [showReversibleCauses, setShowReversibleCauses] = useState(false);
  const [showAntiarrhythmicChoice, setShowAntiarrhythmicChoice] = useState(false);
  const [showAdvancedAirwayPrompt, setShowAdvancedAirwayPrompt] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [metronomeEnabled, setMetronomeEnabled] = useState(true);
  const [defibCharging, setDefibCharging] = useState(false);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const metronomeRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // tRPC mutations and queries
  const createSession = trpc.cprSession.createSession.useMutation();
  const joinSession = trpc.cprSession.joinSession.useMutation();
  const updateRole = trpc.cprSession.updateRole.useMutation();
  const logEvent = trpc.cprSession.logEvent.useMutation();
  const endSession = trpc.cprSession.endSession.useMutation();
  
  const { data: sessionData, refetch: refetchSession } = trpc.cprSession.getSession.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId, refetchInterval: 2000 }
  );

  // Calculate doses
  const epiDose = Math.round(patientWeight * 0.01 * 100) / 100;
  const amiodaroneDose = Math.min(Math.round(patientWeight * 5), 300);
  const lidocaineDose = Math.min(Math.round(patientWeight * 1), 100);
  const shockEnergy = Math.min(Math.round(patientWeight * (2 + Math.min(shockCount, 8))), 200);

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Voice synthesis
  const speak = useCallback((text: string) => {
    if (!audioEnabled) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [audioEnabled]);

  // Metronome (100-120 bpm = 600ms interval for 100 bpm)
  const playMetronomeBeep = useCallback(() => {
    if (!metronomeEnabled || !audioEnabled) return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 800; // 800 Hz beep
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }, [metronomeEnabled, audioEnabled]);

  // Start metronome
  useEffect(() => {
    if (isRunning && metronomeEnabled && phase === 'compressions') {
      metronomeRef.current = setInterval(() => {
        playMetronomeBeep();
      }, 600); // 100 bpm
    }
    
    return () => {
      if (metronomeRef.current) clearInterval(metronomeRef.current);
    };
  }, [isRunning, metronomeEnabled, phase, playMetronomeBeep]);

  // Create session on mount
  useEffect(() => {
    if (!sessionId) {
      createSession.mutate(
        { patientWeight, patientAgeMonths },
        {
          onSuccess: async (data) => {
            setSessionId(data.sessionId);
            setSessionCode(data.sessionCode);
            
            // Generate QR code
            const joinUrl = `${window.location.origin}/join-cpr/${data.sessionCode}`;
            const qrUrl = await QRCode.toDataURL(joinUrl, {
              width: 300,
              margin: 2,
              color: { dark: '#000000', light: '#FFFFFF' },
            });
            setQrCodeUrl(qrUrl);
          },
        }
      );
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && !roscAchieved) {
      timerRef.current = setInterval(() => {
        setArrestDuration(prev => prev + 1);
        setCycleTime(prev => {
          const newCycleTime = prev + 1;
          
          // Pre-charge defib at 1:45 (15s before 2-min cycle ends)
          if (newCycleTime === 105 && rhythmType === 'vf_pvt') {
            setDefibCharging(true);
            speak('Charging defibrillator.');
          }
          
          // Rhythm check at 2 minutes
          if (newCycleTime === 120) {
            setShowRhythmCheck(true);
            setDefibCharging(false);
            speak('STOP. Rhythm check now. Check pulse and breathing in less than 10 seconds.');
            return 0;
          }
          
          // Epinephrine reminder (every 3-5 min after first dose)
          if (lastEpiTime !== null && (arrestDuration - lastEpiTime) >= 180 && (arrestDuration - lastEpiTime) % 60 === 0) {
            speak('Consider epinephrine.');
          }
          
          // Reversible causes prompt every 4 minutes
          if (arrestDuration > 0 && arrestDuration % 240 === 0) {
            speak('Review reversible causes.');
            setShowReversibleCauses(true);
          }
          
          // Advanced airway prompt at 4 minutes if not placed
          if (arrestDuration === 240 && !advancedAirwayPlaced) {
            speak('Consider advanced airway.');
            setShowAdvancedAirwayPrompt(true);
          }
          
          return newCycleTime;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, roscAchieved, lastEpiTime, arrestDuration, rhythmType, advancedAirwayPlaced]);

  // Log event helper
  const addEvent = useCallback((action: string, details?: string) => {
    const event: ArrestEvent = {
      id: Date.now().toString(),
      timestamp: arrestDuration,
      action,
      details,
    };
    setEvents(prev => [event, ...prev]);
    
    // Log to backend if session exists
    if (sessionId) {
      logEvent.mutate({
        sessionId,
        memberId: memberId || undefined,
        eventType: action.includes('Shock') ? 'defibrillation' : 
                   action.includes('Epi') || action.includes('Amiodarone') || action.includes('Lidocaine') ? 'medication' :
                   action.includes('ROSC') ? 'outcome' : 'note',
        eventTime: arrestDuration,
        description: action,
        value: details,
      });
    }
  }, [arrestDuration, sessionId, memberId]);

  // Start arrest - IMMEDIATE rhythm assessment workflow
  const startArrest = () => {
    setIsRunning(true);
    setPhase('initial_assessment');
    addEvent('Cardiac arrest recognized');
    speak('Cardiac arrest recognized. Start CPR with chest compressions. Attach pads now.');
  };

  // Pads attached - assess rhythm immediately
  const handlePadsAttached = () => {
    setShowRhythmCheck(true);
    addEvent('Pads attached');
    speak('Pads attached. Assess rhythm now.');
  };

  // Handle rhythm check
  const handleRhythmCheck = (type: RhythmType) => {
    setRhythmType(type);
    setShowRhythmCheck(false);
    
    if (type === 'vf_pvt') {
      setPhase('charging');
      setDefibCharging(true);
      addEvent('VF/pVT detected');
      speak(`Shockable rhythm. Charging to ${shockEnergy} joules. Clear the patient.`);
      
      // Simulate charging time (3 seconds)
      setTimeout(() => {
        setPhase('shock_ready');
        setDefibCharging(false);
        speak('Defibrillator ready. Clear and shock.');
      }, 3000);
    } else {
      setPhase('compressions');
      addEvent(type === 'pea' ? 'PEA detected' : 'Asystole detected');
      speak('Non-shockable rhythm. Resume CPR immediately.');
      
      // First epi for non-shockable (ASAP)
      if (epiDoses === 0) {
        speak(`Give epinephrine ${epiDose} milligrams now.`);
      }
    }
  };

  // Deliver shock
  const deliverShock = () => {
    const newShockCount = shockCount + 1;
    setShockCount(newShockCount);
    setPhase('post_shock');
    addEvent(`Shock ${newShockCount} delivered`, `${shockEnergy} J`);
    speak(`Shock delivered. Resume CPR immediately.`);
    
    // Resume compressions
    setTimeout(() => {
      setPhase('compressions');
    }, 1000);
    
    // Epinephrine after 2nd shock (if not given)
    if (newShockCount === 2 && epiDoses === 0) {
      speak(`Give epinephrine ${epiDose} milligrams.`);
    }
    
    // Antiarrhythmic after 5th shock
    if (newShockCount === 5 && !antiarrhythmic) {
      setShowAntiarrhythmicChoice(true);
      speak('Consider antiarrhythmic. Choose amiodarone or lidocaine.');
    }
  };

  // Disarm defib (non-shockable rhythm)
  const disarmDefib = () => {
    setDefibCharging(false);
    setPhase('compressions');
    addEvent('Defibrillator disarmed');
    speak('Defibrillator disarmed. Resume CPR.');
  };

  // Give epinephrine
  const giveEpinephrine = () => {
    const newEpiDoses = epiDoses + 1;
    setEpiDoses(newEpiDoses);
    setLastEpiTime(arrestDuration);
    addEvent(`Epinephrine dose ${newEpiDoses}`, `${epiDose} mg (0.01 mg/kg)`);
    speak(`Epinephrine given.`);
  };

  // Give antiarrhythmic
  const giveAntiarrhythmic = (choice: 'amiodarone' | 'lidocaine') => {
    setAntiarrhythmic(choice);
    setShowAntiarrhythmicChoice(false);
    
    if (choice === 'amiodarone') {
      addEvent('Amiodarone given', `${amiodaroneDose} mg (5 mg/kg, max 300 mg)`);
      speak('Amiodarone given.');
    } else {
      addEvent('Lidocaine given', `${lidocaineDose} mg (1 mg/kg, max 100 mg)`);
      speak('Lidocaine given.');
    }
  };

  // Advanced airway
  const placeAdvancedAirway = () => {
    setAdvancedAirwayPlaced(true);
    setShowAdvancedAirwayPrompt(false);
    addEvent('Advanced airway placed');
    speak('Advanced airway placed. Continue compressions without pauses.');
  };

  // Achieve ROSC
  const achieveROSC = () => {
    setRoscAchieved(true);
    setIsRunning(false);
    addEvent('ROSC ACHIEVED');
    speak('Return of spontaneous circulation achieved.');
    
    if (sessionId) {
      endSession.mutate({
        sessionId,
        outcome: 'ROSC',
        totalDuration: arrestDuration,
      });
    }
  };

  // Voice commands
  const { transcript, isListening, startListening, stopListening } = useVoiceCommands({
    onCommand: (command) => {
      const lower = command.toLowerCase();
      
      // Role switching
      if (lower.includes('switch to compressions') || lower.includes('do compressions')) {
        if (memberId) {
          updateRole.mutate({ memberId, role: 'compressions' });
        }
      } else if (lower.includes('switch to airway') || lower.includes('manage airway')) {
        if (memberId) {
          updateRole.mutate({ memberId, role: 'airway' });
        }
      } else if (lower.includes('give epi') || lower.includes('epinephrine')) {
        giveEpinephrine();
      } else if (lower.includes('shock') || lower.includes('defibrillate')) {
        if (phase === 'shock_ready') {
          deliverShock();
        }
      } else if (lower.includes('rosc') || lower.includes('pulse back')) {
        achieveROSC();
      }
    },
  });

  // Join session by code
  const handleJoinSession = () => {
    if (joinCode.length === 6) {
      joinSession.mutate(
        { sessionCode: joinCode.toUpperCase() },
        {
          onSuccess: (data) => {
            setSessionId(data.sessionId);
            setMemberId(data.memberId);
            setJoinCode('');
          },
        }
      );
    }
  };

  // Handle role change
  const handleRoleChange = (memberId: number, role: TeamRole) => {
    updateRole.mutate({ memberId, role });
  };

  // Team members from session data
  const teamMembers: TeamMember[] = sessionData?.teamMembers || [];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Heart className="h-8 w-8 text-red-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">CPR CLOCK</h1>
            <p className="text-gray-400 text-sm">{patientWeight} kg • {formatTime(arrestDuration)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Voice activation */}
          <Button
            variant="ghost"
            size="icon"
            onClick={isListening ? stopListening : startListening}
            className={isListening ? 'text-red-500' : 'text-white'}
          >
            {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          
          {/* Metronome toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMetronomeEnabled(!metronomeEnabled)}
            className="text-white"
          >
            <Wind className="h-5 w-5" />
          </Button>
          
          {/* Audio toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="text-white"
          >
            {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          
          {/* Team panel */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowTeamPanel(!showTeamPanel)}
            className="text-white"
          >
            <Users className="h-5 w-5" />
            {teamMembers.length > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-purple-500 text-xs">
                {teamMembers.length}
              </Badge>
            )}
          </Button>
          
          {/* QR code */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowQrCode(!showQrCode)}
            className="text-white"
          >
            <QrCode className="h-5 w-5" />
          </Button>
          
          {/* Close */}
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Voice transcript feedback */}
      {isListening && transcript && (
        <div className="bg-purple-900/50 px-6 py-2 text-white text-sm border-b border-purple-700">
          <span className="text-purple-400">Listening:</span> {transcript}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-8">
        {!isRunning && !roscAchieved ? (
          // Start screen
          <div className="text-center space-y-6">
            <div className="text-6xl font-bold text-white mb-4">READY</div>
            <Button
              onClick={startArrest}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white text-2xl px-12 py-8 h-auto"
            >
              <Play className="h-8 w-8 mr-4" />
              START CPR
            </Button>
          </div>
        ) : phase === 'initial_assessment' ? (
          // Initial assessment - attach pads
          <div className="text-center space-y-6">
            <div className="text-5xl font-bold text-white mb-4">ATTACH PADS</div>
            <div className="text-xl text-gray-300">Continue compressions while attaching</div>
            <Button
              onClick={handlePadsAttached}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xl px-8 py-6 h-auto"
            >
              <CheckCircle2 className="h-6 w-6 mr-3" />
              Pads Attached - Assess Rhythm
            </Button>
          </div>
        ) : roscAchieved ? (
          // ROSC achieved
          <div className="text-center space-y-6">
            <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto" />
            <div className="text-5xl font-bold text-green-500">ROSC ACHIEVED</div>
            <div className="text-xl text-gray-300">Total duration: {formatTime(arrestDuration)}</div>
            <div className="text-lg text-gray-400">
              {shockCount} shocks • {epiDoses} epi doses
            </div>
          </div>
        ) : (
          // Active resuscitation
          <div className="w-full max-w-4xl space-y-6">
            {/* Current action */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8">
                <div className="text-center">
                  {phase === 'compressions' && (
                    <>
                      <div className="text-6xl font-bold text-red-500 mb-4 animate-pulse">
                        COMPRESSIONS
                      </div>
                      <div className="text-2xl text-gray-300">
                        Next rhythm check in {formatTime(120 - cycleTime)}
                      </div>
                      {defibCharging && (
                        <Badge className="mt-4 bg-yellow-500 text-black text-lg px-4 py-2">
                          Charging defibrillator...
                        </Badge>
                      )}
                    </>
                  )}
                  {phase === 'charging' && (
                    <>
                      <div className="text-5xl font-bold text-yellow-500 mb-4">
                        CHARGING
                      </div>
                      <div className="text-xl text-gray-300">Clear the patient</div>
                    </>
                  )}
                  {phase === 'shock_ready' && (
                    <>
                      <div className="text-6xl font-bold text-yellow-500 mb-4 animate-pulse">
                        SHOCK READY
                      </div>
                      <div className="text-2xl text-gray-300 mb-6">
                        {shockEnergy} J • Clear and shock
                      </div>
                      <div className="flex gap-4 justify-center">
                        <Button
                          onClick={deliverShock}
                          size="lg"
                          className="bg-yellow-600 hover:bg-yellow-700 text-black text-2xl px-8 py-6 h-auto"
                        >
                          <Zap className="h-8 w-8 mr-3" />
                          SHOCK
                        </Button>
                        <Button
                          onClick={disarmDefib}
                          size="lg"
                          variant="outline"
                          className="text-white border-gray-600 text-xl px-6 py-6 h-auto"
                        >
                          Disarm (Non-Shockable)
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={giveEpinephrine}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xl py-6 h-auto"
                disabled={lastEpiTime !== null && (arrestDuration - lastEpiTime) < 180}
              >
                <Syringe className="h-6 w-6 mr-2" />
                Epinephrine {epiDose} mg
                {lastEpiTime !== null && (arrestDuration - lastEpiTime) < 180 && (
                  <span className="ml-2 text-sm">
                    (wait {180 - (arrestDuration - lastEpiTime)}s)
                  </span>
                )}
              </Button>

              <Button
                onClick={achieveROSC}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white text-xl py-6 h-auto"
              >
                <CheckCircle2 className="h-6 w-6 mr-2" />
                ROSC Achieved
              </Button>

              <Button
                onClick={() => setShowReversibleCauses(true)}
                size="lg"
                variant="outline"
                className="text-white border-gray-600 text-lg py-6 h-auto"
              >
                <AlertTriangle className="h-5 w-5 mr-2" />
                Reversible Causes
              </Button>

              <Button
                onClick={() => setShowAdvancedAirwayPrompt(true)}
                size="lg"
                variant="outline"
                className="text-white border-gray-600 text-lg py-6 h-auto"
              >
                <Wind className="h-5 w-5 mr-2" />
                Advanced Airway
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-white">{shockCount}</div>
                  <div className="text-sm text-gray-400">Shocks</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-white">{epiDoses}</div>
                  <div className="text-sm text-gray-400">Epi Doses</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-white">
                    {rhythmType === 'vf_pvt' ? 'VF/pVT' : rhythmType === 'pea' ? 'PEA' : rhythmType === 'asystole' ? 'Asystole' : 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-400">Rhythm</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-white">
                    {antiarrhythmic ? (antiarrhythmic === 'amiodarone' ? 'Amio' : 'Lido') : 'None'}
                  </div>
                  <div className="text-sm text-gray-400">Antiarrhythmic</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Rhythm check overlay */}
      {showRhythmCheck && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <Activity className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">RHYTHM CHECK</h2>
                <p className="text-gray-300">Check pulse and breathing in &lt;10 seconds</p>
              </div>
              
              <div className="space-y-4">
                <Button
                  onClick={() => handleRhythmCheck('vf_pvt')}
                  size="lg"
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-black text-xl py-6 h-auto"
                >
                  <Zap className="h-6 w-6 mr-3" />
                  VF / pVT (Shockable)
                </Button>
                
                <Button
                  onClick={() => handleRhythmCheck('pea')}
                  size="lg"
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xl py-6 h-auto"
                >
                  PEA (Non-Shockable)
                </Button>
                
                <Button
                  onClick={() => handleRhythmCheck('asystole')}
                  size="lg"
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xl py-6 h-auto"
                >
                  Asystole (Non-Shockable)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Antiarrhythmic choice overlay */}
      {showAntiarrhythmicChoice && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <Syringe className="h-16 w-16 text-purple-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">ANTIARRHYTHMIC</h2>
                <p className="text-gray-300">After 5th shock - Choose one</p>
              </div>
              
              <div className="space-y-4">
                <Button
                  onClick={() => giveAntiarrhythmic('amiodarone')}
                  size="lg"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xl py-6 h-auto"
                >
                  Amiodarone {amiodaroneDose} mg
                  <span className="block text-sm mt-1">(5 mg/kg, max 300 mg)</span>
                </Button>
                
                <Button
                  onClick={() => giveAntiarrhythmic('lidocaine')}
                  size="lg"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xl py-6 h-auto"
                >
                  Lidocaine {lidocaineDose} mg
                  <span className="block text-sm mt-1">(1 mg/kg, max 100 mg)</span>
                </Button>
                
                <Button
                  onClick={() => setShowAntiarrhythmicChoice(false)}
                  size="lg"
                  variant="outline"
                  className="w-full text-white border-gray-600"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reversible causes overlay */}
      {showReversibleCauses && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10 p-8 overflow-y-auto">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-3xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  <h2 className="text-2xl font-bold text-white">Reversible Causes (Hs & Ts)</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowReversibleCauses(false)}
                  className="text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-yellow-500 mb-3">Hs</h3>
                  <ul className="space-y-2 text-white">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Hypoxia</strong> - Check O₂, ventilation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Hypovolemia</strong> - Fluid bolus, blood</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Hydrogen ion (acidosis)</strong> - Ventilation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Hypo/Hyperkalemia</strong> - Check labs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Hypothermia</strong> - Rewarm</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Hypoglycemia</strong> - Check glucose</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-yellow-500 mb-3">Ts</h3>
                  <ul className="space-y-2 text-white">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Tension pneumothorax</strong> - Needle decompression</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Tamponade (cardiac)</strong> - Pericardiocentesis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Toxins</strong> - Antidotes, decontamination</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Thrombosis (pulmonary)</strong> - Consider tPA</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Thrombosis (coronary)</strong> - Rare in peds</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Trauma</strong> - Surgical intervention</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Advanced airway prompt */}
      {showAdvancedAirwayPrompt && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <Wind className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">ADVANCED AIRWAY</h2>
                <p className="text-gray-300">Consider endotracheal intubation or supraglottic airway</p>
              </div>
              
              <div className="space-y-4">
                <Button
                  onClick={placeAdvancedAirway}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl py-6 h-auto"
                >
                  <CheckCircle2 className="h-6 w-6 mr-3" />
                  Advanced Airway Placed
                </Button>
                
                <Button
                  onClick={() => setShowAdvancedAirwayPrompt(false)}
                  size="lg"
                  variant="outline"
                  className="w-full text-white border-gray-600"
                >
                  Continue with BVM
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QR code overlay */}
      {showQrCode && qrCodeUrl && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Join CPR Session</h3>
              <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-4" />
              <div className="text-3xl font-mono font-bold text-white mb-6">{sessionCode}</div>
              <Button
                onClick={() => setShowQrCode(false)}
                variant="outline"
                className="text-white border-gray-600"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Team panel */}
      {showTeamPanel && (
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gray-900 border-l border-gray-700 p-6 overflow-y-auto z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Team</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTeamPanel(false)}
              className="text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Join session */}
          {!sessionId && (
            <div className="mb-6">
              <Input
                placeholder="Enter 6-digit code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="bg-gray-800 border-gray-700 text-white mb-2"
              />
              <Button
                onClick={handleJoinSession}
                disabled={joinCode.length !== 6}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Join Session
              </Button>
            </div>
          )}
          
          {/* Team members */}
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <Card key={member.id} className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{member.providerName}</span>
                    {member.role && (
                      <Badge className={ROLE_COLORS[member.role]}>
                        {ROLE_LABELS[member.role]}
                      </Badge>
                    )}
                  </div>
                  
                  {member.id === memberId && (
                    <select
                      value={member.role || ''}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as TeamRole)}
                      className="w-full bg-gray-700 border-gray-600 text-white rounded px-2 py-1 text-sm"
                    >
                      <option value="">Select role...</option>
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
