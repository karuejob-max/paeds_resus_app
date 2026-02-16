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
import { triggerHaptic } from '@/lib/haptics';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Wind,
  Pencil
} from 'lucide-react';
import QRCode from 'qrcode';
import { trpc } from '@/lib/trpc';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';

interface Props {
  patientWeight: number;
  patientAgeMonths?: number;
  onClose: () => void;
}

type ArrestPhase = 'initial_assessment' | 'compressions' | 'reassessment' | 'rhythm_check' | 'charging' | 'shock_ready' | 'post_shock';
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
  
  // Reversible causes tracking (H's & T's)
  const [reversibleCausesChecked, setReversibleCausesChecked] = useState<Record<string, boolean>>({
    hypoxia: false,
    hypovolemia: false,
    hydrogen_ion: false,
    hypokalemia: false,
    hypothermia: false,
    hypoglycemia: false,
    tension_pneumo: false,
    tamponade: false,
    toxins: false,
    thrombosis_pulmonary: false,
    thrombosis_coronary: false,
    trauma: false,
  });
  
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
  const [showChargePrompt, setShowChargePrompt] = useState(false);
  const [showSummaryCard, setShowSummaryCard] = useState(false);
  const [showPostRoscProtocol, setShowPostRoscProtocol] = useState(false);
  const [postRoscChecklist, setPostRoscChecklist] = useState({
    ttm_initiated: false,
    glucose_checked: false,
    ventilation_optimized: false,
    blood_pressure_stable: false,
    ecg_12lead: false,
    labs_sent: false,
    imaging_ordered: false,
    picu_contacted: false,
  });
  const [reassessmentTime, setReassessmentTime] = useState(10);
  const [antiarrhythmicDoses, setAntiarrhythmicDoses] = useState(0);
  const [showPatientInfoDialog, setShowPatientInfoDialog] = useState(false);
  const [editableWeight, setEditableWeight] = useState(patientWeight);
  const [editableAge, setEditableAge] = useState(patientAgeMonths || 0);
  
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
            setSessionId(data.sessionId ?? null);
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
          
          // Prompt to charge defib at 1:45 (15s before 2-min cycle ends)
          if (newCycleTime === 105 && rhythmType === 'vf_pvt' && !defibCharging) {
            setShowChargePrompt(true);
            speak('Charge the defibrillator now.');
          }
          
          // Transition to reassessment phase at 2 minutes
          if (newCycleTime === 120) {
            setPhase('reassessment');
            setReassessmentTime(10);
            setDefibCharging(false);
            speak('Stop compressions. Assess rhythm.');
            return 0;
          }
          
          // Epinephrine reminder (every 3-5 min after first dose)
          if (lastEpiTime !== null && (arrestDuration - lastEpiTime) >= 180 && (arrestDuration - lastEpiTime) % 60 === 0) {
            speak('Consider epinephrine.');
          }
          
          // Reversible causes reminder at 2-minute mark during compressions (audio only, no auto-popup)
          if (newCycleTime === 120 && arrestDuration > 0 && arrestDuration % 240 === 0) {
            speak('Review reversible causes.');
          }
          
          // Advanced airway prompt at 4-minute mark during compressions if not placed
          if (newCycleTime === 240 && !advancedAirwayPlaced) {
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

  // Reassessment countdown timer
  useEffect(() => {
    if (phase === 'reassessment' && reassessmentTime > 0) {
      const timer = setTimeout(() => {
        setReassessmentTime(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'reassessment' && reassessmentTime === 0) {
      // Reassessment complete, show rhythm check dialog
      setShowRhythmCheck(true);
    }
  }, [phase, reassessmentTime]);

  // Scroll to top when reversible causes overlay opens
  useEffect(() => {
    if (showReversibleCauses) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showReversibleCauses]);

  // Scroll to top when post-ROSC protocol opens
  useEffect(() => {
    if (showPostRoscProtocol) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showPostRoscProtocol]);

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
      
      // Immediate epi for PEA/asystole (per AHA guidelines)
      if (epiDoses === 0) {
        speak(`Give epinephrine ${epiDose} milligrams immediately.`);
      }
    }
  };

  // Deliver shock
  const deliverShock = () => {
    triggerHaptic('critical'); // Haptic feedback for shock
    const newShockCount = shockCount + 1;
    setShockCount(newShockCount);
    setPhase('post_shock');
    addEvent(`Shock ${newShockCount} delivered`, `${shockEnergy} J`);
    speak(`Shock delivered. Resume CPR immediately.`);
    
    // Resume compressions
    setTimeout(() => {
      setPhase('compressions');
    }, 1000);
    
    // Epinephrine after 2nd shock for VF/pVT (per AHA guidelines)
    if (newShockCount === 2 && epiDoses === 0 && rhythmType === 'vf_pvt') {
      speak(`Give epinephrine ${epiDose} milligrams now.`);
    }
    
    // Antiarrhythmic after 3rd and 5th shock (per AHA guidelines)
    // Allow dose after 3rd shock AND another after 5th shock
    if ((newShockCount === 3 && antiarrhythmicDoses === 0) || (newShockCount === 5 && antiarrhythmicDoses === 1)) {
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
    triggerHaptic('critical'); // Haptic feedback for epinephrine
    const newEpiDoses = epiDoses + 1;
    setEpiDoses(newEpiDoses);
    setLastEpiTime(arrestDuration);
    addEvent(`Epinephrine dose ${newEpiDoses}`, `${epiDose} mg (0.01 mg/kg)`);
    speak(`Epinephrine given.`);
  };

  // Give antiarrhythmic
  const giveAntiarrhythmic = (choice: 'amiodarone' | 'lidocaine') => {
    triggerHaptic('critical'); // Haptic feedback for antiarrhythmic
    setAntiarrhythmic(choice);
    setAntiarrhythmicDoses(prev => prev + 1);
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
    
    // Auto-open post-ROSC protocol after 2 seconds
    setTimeout(() => {
      setShowPostRoscProtocol(true);
      speak('Initiating post-resuscitation care protocol.');
    }, 2000);
  };

  // Voice commands
  const { transcript, isListening, startListening, stopListening } = useVoiceCommands({
    commands: {
      'switch to compressions': () => {
        if (memberId) updateRole.mutate({ memberId, role: 'compressions' });
      },
      'do compressions': () => {
        if (memberId) updateRole.mutate({ memberId, role: 'compressions' });
      },
      'switch to airway': () => {
        if (memberId) updateRole.mutate({ memberId, role: 'airway' });
      },
      'manage airway': () => {
        if (memberId) updateRole.mutate({ memberId, role: 'airway' });
      },
      'give epi': () => giveEpinephrine(),
      epinephrine: () => giveEpinephrine(),
      shock: () => {
        if (phase === 'shock_ready') deliverShock();
      },
      defibrillate: () => {
        if (phase === 'shock_ready') deliverShock();
      },
      rosc: () => achieveROSC(),
      'pulse back': () => achieveROSC(),
    },
  });

  // Join session by code
  const handleJoinSession = () => {
    if (joinCode.length === 6) {
      joinSession.mutate(
        { sessionCode: joinCode.toUpperCase(), providerName: 'Guest Provider', role: 'observer' },
        {
          onSuccess: (data) => {
            setSessionId(data.sessionId ?? null);
            setMemberId(data.memberId ?? null);
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
      {/* Header - Mobile Optimized */}
      <div className="bg-gray-900 border-b border-gray-700 px-3 py-2 md:px-6 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Heart className="h-5 w-5 md:h-8 md:w-8 text-red-500" />
          <div>
            <h1 className="text-base md:text-2xl font-bold text-white">CPR</h1>
            <p className="text-gray-400 text-xs md:text-sm">{patientWeight}kg • {formatTime(arrestDuration)}</p>
          </div>
          
          {/* Edit Patient Info button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPatientInfoDialog(true)}
            className="text-white h-8 w-8 md:h-10 md:w-10"
          >
            <Pencil className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1 md:gap-2">
          {/* Voice activation */}
          <Button
            variant="ghost"
            size="icon"
            onClick={isListening ? stopListening : startListening}
            className={`${isListening ? 'text-red-500' : 'text-white'} h-8 w-8 md:h-10 md:w-10`}
          >
            {isListening ? <Mic className="h-4 w-4 md:h-5 md:w-5" /> : <MicOff className="h-4 w-4 md:h-5 md:w-5" />}
          </Button>
          
          {/* Metronome toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMetronomeEnabled(!metronomeEnabled)}
            className="text-white h-8 w-8 md:h-10 md:w-10"
          >
            <Wind className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          
          {/* Audio toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="text-white h-8 w-8 md:h-10 md:w-10"
          >
            {audioEnabled ? <Volume2 className="h-4 w-4 md:h-5 md:w-5" /> : <VolumeX className="h-4 w-4 md:h-5 md:w-5" />}
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
          
          {/* Summary card */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSummaryCard(!showSummaryCard)}
            className="text-white h-8 w-8 md:h-10 md:w-10"
            title="Arrest Summary"
          >
            <Activity className="h-4 w-4 md:h-5 md:w-5" />
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
                      <div className="text-3xl md:text-6xl font-bold text-red-500 mb-4 animate-pulse">
                        COMPRESSIONS
                      </div>
                      <div className="text-lg md:text-2xl text-gray-300">
                        Next rhythm check in {formatTime(120 - cycleTime)}
                      </div>
                    </>
                  )}
                  {phase === 'reassessment' && (
                    <>
                      <div className="text-3xl md:text-6xl font-bold text-blue-500 mb-4 animate-pulse">
                        REASSESSMENT
                      </div>
                      <div className="text-xl md:text-3xl text-gray-300 mb-4">
                        {reassessmentTime}s
                      </div>
                      <div className="text-base md:text-xl text-gray-400">
                        Assess rhythm
                      </div>
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
                      <div className="text-3xl md:text-6xl font-bold text-yellow-500 mb-2 md:mb-4 animate-pulse">
                        SHOCK READY
                      </div>
                      <div className="text-base md:text-2xl text-gray-300 mb-3 md:mb-6">
                        {shockEnergy} J • Clear and shock
                      </div>
                      <div className="flex flex-col md:flex-row gap-2 md:gap-4 justify-center">
                        <Button
                          onClick={deliverShock}
                          size="lg"
                          className="bg-yellow-600 hover:bg-yellow-700 text-black text-lg md:text-2xl px-4 md:px-8 py-4 md:py-6 h-auto w-full md:w-auto"
                        >
                          <Zap className="h-5 w-5 md:h-8 md:w-8 mr-2 md:mr-3" />
                          SHOCK
                        </Button>
                        <Button
                          onClick={disarmDefib}
                          size="lg"
                          variant="outline"
                          className="text-white border-gray-600 text-sm md:text-xl px-3 md:px-6 py-4 md:py-6 h-auto w-full md:w-auto"
                        >
                          Disarm
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action buttons - Mobile Optimized */}
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <Button
                onClick={giveEpinephrine}
                size="lg"
                className={`text-white text-sm md:text-xl py-3 md:py-6 h-auto ${
                  lastEpiTime === null 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : (() => {
                        const timeSinceEpi = arrestDuration - lastEpiTime;
                        if (timeSinceEpi >= 180) return 'bg-red-600 hover:bg-red-700 animate-pulse';
                        if (timeSinceEpi >= 120) return 'bg-orange-600 hover:bg-orange-700';
                        if (timeSinceEpi >= 60) return 'bg-yellow-600 hover:bg-yellow-700';
                        return 'bg-green-600 hover:bg-green-700';
                      })()
                }`}
                disabled={lastEpiTime !== null && (arrestDuration - lastEpiTime) < 180}
              >
                <Syringe className="h-4 w-4 md:h-6 md:w-6 mr-1 md:mr-2" />
                <span className="truncate">Epi {epiDose}mg</span>
                {lastEpiTime !== null && (arrestDuration - lastEpiTime) < 180 && (
                  <span className="ml-1 text-xs hidden md:inline">
                    ({180 - (arrestDuration - lastEpiTime)}s)
                  </span>
                )}
              </Button>

              <Button
                onClick={achieveROSC}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white text-sm md:text-xl py-3 md:py-6 h-auto"
              >
                <CheckCircle2 className="h-4 w-4 md:h-6 md:w-6 mr-1 md:mr-2" />
                <span className="truncate">ROSC</span>
              </Button>

              <Button
                onClick={() => setShowReversibleCauses(true)}
                size="lg"
                variant="outline"
                className="text-white border-gray-600 text-xs md:text-lg py-3 md:py-6 h-auto"
              >
                <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                <span className="truncate">H's & T's</span>
              </Button>

              <Button
                onClick={() => setShowAdvancedAirwayPrompt(true)}
                size="lg"
                variant="outline"
                className="text-white border-gray-600 text-xs md:text-lg py-3 md:py-6 h-auto"
              >
                <Wind className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                <span className="truncate">Adv Airway</span>
              </Button>
            </div>

            {/* Stats - Mobile Optimized */}
            <div className="grid grid-cols-4 gap-1 md:gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-2 md:p-4 text-center">
                  <div className="text-xl md:text-3xl font-bold text-white">{shockCount}</div>
                  <div className="text-xs md:text-sm text-gray-400">Shocks</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-2 md:p-4 text-center">
                  <div className="text-xl md:text-3xl font-bold text-white">{epiDoses}</div>
                  <div className="text-xs md:text-sm text-gray-400">Epi</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-2 md:p-4 text-center">
                  <div className="text-sm md:text-3xl font-bold text-white">
                    {rhythmType === 'vf_pvt' ? 'VF/pVT' : rhythmType === 'pea' ? 'PEA' : rhythmType === 'asystole' ? 'Asystole' : 'Unknown'}
                  </div>
                  <div className="text-xs md:text-sm text-gray-400">Rhythm</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-2 md:p-4 text-center">
                  <div className="text-sm md:text-3xl font-bold text-white">
                    {antiarrhythmic ? (antiarrhythmic === 'amiodarone' ? 'Amio' : 'Lido') : 'None'}
                  </div>
                  <div className="text-xs md:text-sm text-gray-400">Anti</div>
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

      {/* Charge complete confirmation prompt */}
      {showChargePrompt && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <Zap className="h-16 w-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
                <h2 className="text-3xl font-bold text-white mb-2">CHARGE DEFIBRILLATOR</h2>
                <p className="text-gray-300">Charge to {shockEnergy} Joules</p>
              </div>
              
              <div className="space-y-4">
                <Button
                  onClick={() => {
                    setDefibCharging(true);
                    setShowChargePrompt(false);
                    triggerHaptic('medium');
                    addEvent('Defibrillator charged', `${shockEnergy}J`);
                    speak('Defibrillator charged and ready.');
                  }}
                  size="lg"
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-black py-6 h-auto"
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <Zap className="h-6 w-6" />
                      <span className="text-xl font-bold">Charge Complete</span>
                    </div>
                    <span className="text-base">Ready to Shock</span>
                  </div>
                </Button>
                
                <Button
                  onClick={() => setShowChargePrompt(false)}
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
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10 p-4 md:p-8 overflow-y-auto">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-3xl">
            <CardContent className="p-4 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-yellow-500" />
                  <h2 className="text-xl md:text-2xl font-bold text-white">Reversible Causes (Hs & Ts)</h2>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-yellow-500 mb-3">Hs</h3>
                  <ul className="space-y-2 text-white text-sm md:text-base">
                    <li className="flex flex-col gap-2 p-2 rounded border border-gray-700">
                      <div className="flex items-start gap-2 cursor-pointer hover:bg-gray-700 p-1 rounded" onClick={() => {
                        setReversibleCausesChecked(prev => ({ ...prev, hypoxia: !prev.hypoxia }));
                      }}>
                        <input type="checkbox" checked={reversibleCausesChecked.hypoxia} onChange={() => {}} className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                        <span><strong>Hypoxia</strong> - Check O₂, ventilation</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReversibleCausesChecked(prev => ({ ...prev, hypoxia: true }));
                          addEvent('Checked O₂/ventilation for hypoxia');
                          speak('Hypoxia addressed');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 h-auto w-full"
                      >
                        Check O₂ & Ventilation
                      </Button>
                    </li>
                    <li className="flex flex-col gap-2 p-2 rounded border border-gray-700">
                      <div className="flex items-start gap-2 cursor-pointer hover:bg-gray-700 p-1 rounded" onClick={() => {
                        setReversibleCausesChecked(prev => ({ ...prev, hypovolemia: !prev.hypovolemia }));
                      }}>
                        <input type="checkbox" checked={reversibleCausesChecked.hypovolemia} onChange={() => {}} className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                        <span><strong>Hypovolemia</strong> - Fluid bolus, blood</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReversibleCausesChecked(prev => ({ ...prev, hypovolemia: true }));
                          addEvent('Fluid bolus given for hypovolemia');
                          speak('Fluid bolus ordered');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 h-auto w-full"
                      >
                        Give Fluid Bolus
                      </Button>
                    </li>
                    <li className="flex flex-col gap-2 p-2 rounded border border-gray-700">
                      <div className="flex items-start gap-2 cursor-pointer hover:bg-gray-700 p-1 rounded" onClick={() => {
                        setReversibleCausesChecked(prev => ({ ...prev, hydrogen_ion: !prev.hydrogen_ion }));
                      }}>
                        <input type="checkbox" checked={reversibleCausesChecked.hydrogen_ion} onChange={() => {}} className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                        <span><strong>Hydrogen ion (acidosis)</strong> - Ventilation</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReversibleCausesChecked(prev => ({ ...prev, hydrogen_ion: true }));
                          addEvent('Optimized ventilation for acidosis');
                          speak('Ventilation optimized');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 h-auto w-full"
                      >
                        Optimize Ventilation
                      </Button>
                    </li>
                    <li className="flex flex-col gap-2 p-2 rounded border border-gray-700">
                      <div className="flex items-start gap-2 cursor-pointer hover:bg-gray-700 p-1 rounded" onClick={() => {
                        setReversibleCausesChecked(prev => ({ ...prev, hypokalemia: !prev.hypokalemia }));
                      }}>
                        <input type="checkbox" checked={reversibleCausesChecked.hypokalemia} onChange={() => {}} className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                        <span><strong>Hypo/Hyperkalemia</strong> - Check labs</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReversibleCausesChecked(prev => ({ ...prev, hypokalemia: true }));
                          addEvent('Labs checked for electrolytes');
                          speak('Labs ordered');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 h-auto w-full"
                      >
                        Check Labs
                      </Button>
                    </li>
                    <li className="flex flex-col gap-2 p-2 rounded border border-gray-700">
                      <div className="flex items-start gap-2 cursor-pointer hover:bg-gray-700 p-1 rounded" onClick={() => {
                        setReversibleCausesChecked(prev => ({ ...prev, hypothermia: !prev.hypothermia }));
                      }}>
                        <input type="checkbox" checked={reversibleCausesChecked.hypothermia} onChange={() => {}} className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                        <span><strong>Hypothermia</strong> - Rewarm</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReversibleCausesChecked(prev => ({ ...prev, hypothermia: true }));
                          addEvent('Rewarming initiated');
                          speak('Rewarming started');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 h-auto w-full"
                      >
                        Start Rewarming
                      </Button>
                    </li>
                    <li className="flex flex-col gap-2 p-2 rounded border border-gray-700">
                      <div className="flex items-start gap-2 cursor-pointer hover:bg-gray-700 p-1 rounded" onClick={() => {
                        setReversibleCausesChecked(prev => ({ ...prev, hypoglycemia: !prev.hypoglycemia }));
                      }}>
                        <input type="checkbox" checked={reversibleCausesChecked.hypoglycemia} onChange={() => {}} className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                        <span><strong>Hypoglycemia</strong> - Check glucose</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReversibleCausesChecked(prev => ({ ...prev, hypoglycemia: true }));
                          addEvent('Glucose checked/corrected');
                          speak('Glucose checked');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 h-auto w-full"
                      >
                        Check Glucose
                      </Button>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-base md:text-lg font-bold text-yellow-500 mb-3">Ts</h3>
                  <ul className="space-y-2 text-white text-sm md:text-base">
                    <li className="flex flex-col gap-2 p-2 rounded border border-gray-700">
                      <div className="flex items-start gap-2 cursor-pointer hover:bg-gray-700 p-1 rounded" onClick={() => {
                        setReversibleCausesChecked(prev => ({ ...prev, tension_pneumo: !prev.tension_pneumo }));
                      }}>
                        <input type="checkbox" checked={reversibleCausesChecked.tension_pneumo} onChange={() => {}} className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                        <span><strong>Tension pneumothorax</strong> - Needle decompression</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReversibleCausesChecked(prev => ({ ...prev, tension_pneumo: true }));
                          addEvent('Needle decompression performed');
                          speak('Needle decompression done');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 h-auto w-full"
                      >
                        Needle Decompression
                      </Button>
                    </li>
                    <li className="flex flex-col gap-2 p-2 rounded border border-gray-700">
                      <div className="flex items-start gap-2 cursor-pointer hover:bg-gray-700 p-1 rounded" onClick={() => {
                        setReversibleCausesChecked(prev => ({ ...prev, tamponade: !prev.tamponade }));
                      }}>
                        <input type="checkbox" checked={reversibleCausesChecked.tamponade} onChange={() => {}} className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                        <span><strong>Tamponade (cardiac)</strong> - Pericardiocentesis</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReversibleCausesChecked(prev => ({ ...prev, tamponade: true }));
                          addEvent('Pericardiocentesis performed');
                          speak('Pericardiocentesis done');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 h-auto w-full"
                      >
                        Pericardiocentesis
                      </Button>
                    </li>
                    <li className="flex flex-col gap-2 p-2 rounded border border-gray-700">
                      <div className="flex items-start gap-2 cursor-pointer hover:bg-gray-700 p-1 rounded" onClick={() => {
                        setReversibleCausesChecked(prev => ({ ...prev, toxins: !prev.toxins }));
                      }}>
                        <input type="checkbox" checked={reversibleCausesChecked.toxins} onChange={() => {}} className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                        <span><strong>Toxins</strong> - Antidotes, decontamination</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReversibleCausesChecked(prev => ({ ...prev, toxins: true }));
                          addEvent('Antidote/decontamination given');
                          speak('Toxin treatment initiated');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 h-auto w-full"
                      >
                        Treat Toxin
                      </Button>
                    </li>
                    <li className="flex flex-col gap-2 p-2 rounded border border-gray-700">
                      <div className="flex items-start gap-2 cursor-pointer hover:bg-gray-700 p-1 rounded" onClick={() => {
                        setReversibleCausesChecked(prev => ({ ...prev, thrombosis_pulmonary: !prev.thrombosis_pulmonary }));
                      }}>
                        <input type="checkbox" checked={reversibleCausesChecked.thrombosis_pulmonary} onChange={() => {}} className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                        <span><strong>Thrombosis (pulmonary)</strong> - Consider tPA</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReversibleCausesChecked(prev => ({ ...prev, thrombosis_pulmonary: true }));
                          addEvent('tPA considered for PE');
                          speak('tPA considered');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 h-auto w-full"
                      >
                        Consider tPA
                      </Button>
                    </li>
                    <li className="flex flex-col gap-2 p-2 rounded border border-gray-700">
                      <div className="flex items-start gap-2 cursor-pointer hover:bg-gray-700 p-1 rounded" onClick={() => {
                        setReversibleCausesChecked(prev => ({ ...prev, thrombosis_coronary: !prev.thrombosis_coronary }));
                      }}>
                        <input type="checkbox" checked={reversibleCausesChecked.thrombosis_coronary} onChange={() => {}} className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                        <span><strong>Thrombosis (coronary)</strong> - Rare in peds</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReversibleCausesChecked(prev => ({ ...prev, thrombosis_coronary: true }));
                          addEvent('Coronary thrombosis evaluated');
                          speak('Coronary thrombosis evaluated');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 h-auto w-full"
                      >
                        Evaluate MI
                      </Button>
                    </li>
                    <li className="flex flex-col gap-2 p-2 rounded border border-gray-700">
                      <div className="flex items-start gap-2 cursor-pointer hover:bg-gray-700 p-1 rounded" onClick={() => {
                        setReversibleCausesChecked(prev => ({ ...prev, trauma: !prev.trauma }));
                      }}>
                        <input type="checkbox" checked={reversibleCausesChecked.trauma} onChange={() => {}} className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                        <span><strong>Trauma</strong> - Surgical intervention</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReversibleCausesChecked(prev => ({ ...prev, trauma: true }));
                          addEvent('Surgical consult for trauma');
                          speak('Surgical consult called');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 h-auto w-full"
                      >
                        Call Surgery
                      </Button>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Back button */}
              <Button
                onClick={() => setShowReversibleCauses(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-bold"
              >
                ← Back to CPR Clock
              </Button>
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

      {/* Arrest Summary Card */}
      {showSummaryCard && (
        <div className="absolute top-16 right-4 w-80 md:w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-10 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Arrest Summary
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSummaryCard(false)}
              className="text-white h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-3 text-white text-sm">
            {/* Total arrest time */}
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded">
              <span className="text-gray-400">Total Arrest Time</span>
              <span className="font-bold text-lg">{formatTime(arrestDuration)}</span>
            </div>
            
            {/* Shocks delivered */}
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded">
              <span className="text-gray-400 flex items-center gap-1">
                <Zap className="h-4 w-4" />
                Shocks Delivered
              </span>
              <span className="font-bold text-yellow-500">{shockCount}</span>
            </div>
            
            {/* Epi doses */}
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded">
              <span className="text-gray-400 flex items-center gap-1">
                <Syringe className="h-4 w-4" />
                Epinephrine Doses
              </span>
              <span className="font-bold text-blue-500">{epiDoses}</span>
            </div>
            
            {/* Current rhythm */}
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded">
              <span className="text-gray-400">Current Rhythm</span>
              <span className="font-bold">
                {rhythmType === 'vf_pvt' && 'VF/pVT'}
                {rhythmType === 'pea' && 'PEA'}
                {rhythmType === 'asystole' && 'Asystole'}
                {!rhythmType && 'Not assessed'}
              </span>
            </div>
            
            {/* Antiarrhythmic */}
            {antiarrhythmic && (
              <div className="flex justify-between items-center p-2 bg-gray-800 rounded">
                <span className="text-gray-400">Antiarrhythmic</span>
                <span className="font-bold text-purple-500">
                  {antiarrhythmic === 'amiodarone' ? 'Amiodarone' : 'Lidocaine'}
                </span>
              </div>
            )}
            
            {/* Advanced airway */}
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded">
              <span className="text-gray-400">Advanced Airway</span>
              <span className={`font-bold ${advancedAirwayPlaced ? 'text-green-500' : 'text-gray-500'}`}>
                {advancedAirwayPlaced ? 'Placed' : 'Not placed'}
              </span>
            </div>
            
            {/* H's & T's checked */}
            <div className="p-2 bg-gray-800 rounded">
              <div className="text-gray-400 mb-2">H's & T's Addressed</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(reversibleCausesChecked).filter(([_, checked]) => checked).map(([key]) => (
                  <Badge key={key} className="bg-green-600 text-xs">
                    {key.replace('_', ' ')}
                  </Badge>
                ))}
                {Object.values(reversibleCausesChecked).every(v => !v) && (
                  <span className="text-gray-500 text-xs">None checked</span>
                )}
              </div>
            </div>
            
            {/* ROSC status */}
            {roscAchieved && (
              <div className="flex items-center gap-2 p-2 bg-green-900/30 border border-green-500 rounded">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-bold text-green-500">ROSC Achieved</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post-ROSC Protocol Checklist */}
      {showPostRoscProtocol && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10 p-4 md:p-8 overflow-y-auto">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl">
            <CardContent className="p-4 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">Post-ROSC Protocol</h2>
                    <p className="text-gray-400 text-sm">Post-Resuscitation Care Checklist</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPostRoscProtocol(false)}
                  className="text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-3 text-white">
                {/* TTM */}
                <div
                  className="flex items-start gap-3 p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                  onClick={() => {
                    setPostRoscChecklist(prev => ({ ...prev, ttm_initiated: !prev.ttm_initiated }));
                    if (!postRoscChecklist.ttm_initiated) {
                      addEvent('TTM initiated');
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={postRoscChecklist.ttm_initiated}
                    onChange={() => {}}
                    className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="font-bold">Targeted Temperature Management (TTM)</div>
                    <div className="text-sm text-gray-400">Target 32-36°C for neuroprotection</div>
                  </div>
                </div>

                {/* Glucose */}
                <div
                  className="flex items-start gap-3 p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                  onClick={() => {
                    setPostRoscChecklist(prev => ({ ...prev, glucose_checked: !prev.glucose_checked }));
                    if (!postRoscChecklist.glucose_checked) {
                      addEvent('Glucose checked post-ROSC');
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={postRoscChecklist.glucose_checked}
                    onChange={() => {}}
                    className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="font-bold">Glucose Control</div>
                    <div className="text-sm text-gray-400">Target 80-180 mg/dL, avoid hypoglycemia</div>
                  </div>
                </div>

                {/* Ventilation */}
                <div
                  className="flex items-start gap-3 p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                  onClick={() => {
                    setPostRoscChecklist(prev => ({ ...prev, ventilation_optimized: !prev.ventilation_optimized }));
                    if (!postRoscChecklist.ventilation_optimized) {
                      addEvent('Ventilation optimized post-ROSC');
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={postRoscChecklist.ventilation_optimized}
                    onChange={() => {}}
                    className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="font-bold">Ventilation Targets</div>
                    <div className="text-sm text-gray-400">SpO₂ 94-98%, EtCO₂ 35-40 mmHg, avoid hyperventilation</div>
                  </div>
                </div>

                {/* Blood Pressure */}
                <div
                  className="flex items-start gap-3 p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                  onClick={() => {
                    setPostRoscChecklist(prev => ({ ...prev, blood_pressure_stable: !prev.blood_pressure_stable }));
                    if (!postRoscChecklist.blood_pressure_stable) {
                      addEvent('Blood pressure stabilized');
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={postRoscChecklist.blood_pressure_stable}
                    onChange={() => {}}
                    className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="font-bold">Hemodynamic Stability</div>
                    <div className="text-sm text-gray-400">Maintain age-appropriate MAP, consider vasopressors</div>
                  </div>
                </div>

                {/* 12-lead ECG */}
                <div
                  className="flex items-start gap-3 p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                  onClick={() => {
                    setPostRoscChecklist(prev => ({ ...prev, ecg_12lead: !prev.ecg_12lead }));
                    if (!postRoscChecklist.ecg_12lead) {
                      addEvent('12-lead ECG obtained');
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={postRoscChecklist.ecg_12lead}
                    onChange={() => {}}
                    className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="font-bold">12-Lead ECG</div>
                    <div className="text-sm text-gray-400">Assess for arrhythmias, ischemia</div>
                  </div>
                </div>

                {/* Labs */}
                <div
                  className="flex items-start gap-3 p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                  onClick={() => {
                    setPostRoscChecklist(prev => ({ ...prev, labs_sent: !prev.labs_sent }));
                    if (!postRoscChecklist.labs_sent) {
                      addEvent('Post-ROSC labs sent');
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={postRoscChecklist.labs_sent}
                    onChange={() => {}}
                    className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="font-bold">Laboratory Tests</div>
                    <div className="text-sm text-gray-400">CBC, CMP, lactate, ABG, troponin, coags</div>
                  </div>
                </div>

                {/* Imaging */}
                <div
                  className="flex items-start gap-3 p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                  onClick={() => {
                    setPostRoscChecklist(prev => ({ ...prev, imaging_ordered: !prev.imaging_ordered }));
                    if (!postRoscChecklist.imaging_ordered) {
                      addEvent('Post-ROSC imaging ordered');
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={postRoscChecklist.imaging_ordered}
                    onChange={() => {}}
                    className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="font-bold">Imaging Studies</div>
                    <div className="text-sm text-gray-400">CXR, head CT if indicated</div>
                  </div>
                </div>

                {/* PICU Transfer */}
                <div
                  className="flex items-start gap-3 p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                  onClick={() => {
                    setPostRoscChecklist(prev => ({ ...prev, picu_contacted: !prev.picu_contacted }));
                    if (!postRoscChecklist.picu_contacted) {
                      addEvent('PICU contacted for transfer');
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={postRoscChecklist.picu_contacted}
                    onChange={() => {}}
                    className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="font-bold">PICU Transfer Preparation</div>
                    <div className="text-sm text-gray-400">Contact PICU team, prepare handoff, arrange transport</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setShowPostRoscProtocol(false)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Close Protocol
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Patient Info Edit Dialog */}
      {showPatientInfoDialog && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-20">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-md mx-4">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <Pencil className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-white mb-2">Edit Patient Info</h2>
                <p className="text-gray-300 text-sm">Update age and weight for accurate dosing</p>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="edit-age" className="text-white mb-2 block">Age (months)</Label>
                  <Input
                    id="edit-age"
                    type="number"
                    value={editableAge}
                    onChange={(e) => setEditableAge(parseInt(e.target.value) || 0)}
                    className="bg-gray-700 text-white border-gray-600"
                    min="0"
                    max="216"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-weight" className="text-white mb-2 block">Weight (kg)</Label>
                  <Input
                    id="edit-weight"
                    type="number"
                    step="0.1"
                    value={editableWeight}
                    onChange={(e) => setEditableWeight(parseFloat(e.target.value) || 0)}
                    className="bg-gray-700 text-white border-gray-600"
                    min="0.5"
                    max="150"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowPatientInfoDialog(false)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Note: In real implementation, this would update parent component state
                    // For now, just close the dialog
                    setShowPatientInfoDialog(false);
                    addEvent('Patient info updated', `Age: ${editableAge}mo, Weight: ${editableWeight}kg`);
                    speak('Patient information updated.');
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
