/**
 * CPR Clock with Team Coordination
 * 
 * Full-screen, voice-guided, team-synchronized CPR timer.
 * Supports QR code session sharing and role assignments.
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
  UserPlus
} from 'lucide-react';
import QRCode from 'qrcode';
import { trpc } from '@/lib/trpc';

interface Props {
  patientWeight: number;
  patientAgeMonths?: number;
  onClose: () => void;
}

type ArrestPhase = 'compressions' | 'rhythm_check' | 'shock' | 'drug';
type RhythmType = 'shockable' | 'non_shockable' | null;
type TeamRole = 'team_leader' | 'compressions' | 'airway' | 'iv_access' | 'medications' | 'recorder' | 'observer';

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

export function CPRClockTeam({ patientWeight, patientAgeMonths, onClose }: Props) {
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
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // tRPC mutations and queries
  const createSession = trpc.cprSession.createSession.useMutation();
  const joinSession = trpc.cprSession.joinSession.useMutation();
  const updateRole = trpc.cprSession.updateRole.useMutation();
  const logEvent = trpc.cprSession.logEvent.useMutation();
  const endSession = trpc.cprSession.endSession.useMutation();
  
  const { data: sessionData, refetch: refetchSession } = trpc.cprSession.getSession.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId, refetchInterval: 2000 } // Poll every 2 seconds
  );

  // Calculate doses
  const epiDose = Math.round(patientWeight * 0.01 * 100) / 100;
  const amiodaroneDose = Math.min(Math.round(patientWeight * 5), 300);

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
          
          // Rhythm check at 2 minutes
          if (newCycleTime === 120) {
            setShowRhythmCheck(true);
            speak('STOP. Rhythm check now.');
            return 0;
          }
          
          // Epinephrine reminder (every 3-5 min after first dose)
          if (lastEpiTime !== null && (arrestDuration - lastEpiTime) >= 180) {
            speak('Consider epinephrine.');
          }
          
          return newCycleTime;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, roscAchieved, lastEpiTime, arrestDuration]);

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
                   action.includes('Epi') || action.includes('Amiodarone') ? 'medication' :
                   action.includes('ROSC') ? 'outcome' : 'note',
        eventTime: arrestDuration,
        description: action,
        value: details,
      });
    }
  }, [arrestDuration, sessionId, memberId]);

  // Start arrest
  const startArrest = () => {
    setIsRunning(true);
    addEvent('CPR Started', 'Begin compressions');
    speak('CPR started. Begin compressions.');
  };

  // Handle rhythm check
  const handleRhythmCheck = (type: RhythmType) => {
    setRhythmType(type);
    setShowRhythmCheck(false);
    
    if (type === 'shockable') {
      addEvent('Shockable rhythm detected');
      speak('Shockable rhythm. Prepare to shock.');
    } else {
      addEvent('Non-shockable rhythm');
      speak('Non-shockable rhythm. Resume CPR.');
    }
  };

  // Deliver shock
  const deliverShock = () => {
    const newShockCount = shockCount + 1;
    setShockCount(newShockCount);
    addEvent(`Shock ${newShockCount} delivered`, `${2 + newShockCount} J/kg`);
    speak(`Shock delivered. Resume CPR immediately.`);
    
    // Amiodarone after 3rd shock
    if (newShockCount === 3 && !amiodaroneGiven) {
      speak(`Consider amiodarone ${amiodaroneDose} milligrams.`);
    }
  };

  // Give epinephrine
  const giveEpinephrine = () => {
    const newEpiDoses = epiDoses + 1;
    setEpiDoses(newEpiDoses);
    setLastEpiTime(arrestDuration);
    addEvent(`Epinephrine dose ${newEpiDoses}`, `${epiDose} mg (0.01 mg/kg)`);
    speak(`Epinephrine given.`);
  };

  // Give amiodarone
  const giveAmiodarone = () => {
    setAmiodaroneGiven(true);
    addEvent('Amiodarone given', `${amiodaroneDose} mg (5 mg/kg)`);
    speak('Amiodarone given.');
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

  // Join session by code
  const handleJoinSession = () => {
    if (joinCode.length === 6) {
      joinSession.mutate(
        { sessionCode: joinCode.toUpperCase() },
        {
          onSuccess: (data) => {
            setSessionId(data.sessionId);
            setMemberId(data.memberId);
            speak('Session joined.');
          },
          onError: () => {
            speak('Session not found.');
          },
        }
      );
    }
  };

  // Update member role
  const handleRoleChange = (role: TeamRole) => {
    if (memberId) {
      updateRole.mutate(
        { memberId, role },
        {
          onSuccess: () => {
            refetchSession();
            speak(`Role changed to ${ROLE_LABELS[role]}`);
          },
        }
      );
    }
  };

  // Team members
  const teamMembers: TeamMember[] = sessionData?.teamMembers || [];
  const myMember = teamMembers.find(m => m.id === memberId);

  // QR Code modal
  if (showQrCode && qrCodeUrl && sessionCode) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Share Session</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowQrCode(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Scan QR code or enter session code:</p>
              
              <div className="bg-white p-4 rounded-lg inline-block">
                <img src={qrCodeUrl} alt="Session QR Code" className="w-64 h-64" />
              </div>
              
              <div className="text-4xl font-bold font-mono tracking-widest">
                {sessionCode}
              </div>
              
              <p className="text-sm text-muted-foreground">
                Team members can join by scanning this QR code or entering the session code
              </p>
            </div>
            
            <Button className="w-full" onClick={() => setShowQrCode(false)}>
              Close
            </Button>
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

            <Button size="lg" className="w-full" onClick={onClose}>
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
      {/* Header */}
      <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Heart className="h-8 w-8 animate-pulse" />
          <div>
            <div className="text-sm font-medium opacity-90">CARDIAC ARREST</div>
            <div className="text-4xl font-bold font-mono">{formatTime(arrestDuration)}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {sessionCode && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => setShowQrCode(true)}
              >
                <QrCode className="h-5 w-5 mr-2" />
                {sessionCode}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => setShowTeamPanel(!showTeamPanel)}
              >
                <Users className="h-5 w-5 mr-2" />
                {teamMembers.length}
              </Button>
            </>
          )}
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
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Team Panel */}
      {showTeamPanel && (
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Team Members</h3>
            {myMember && myMember.role && (
              <div className="text-sm">
                Your role: <Badge className={ROLE_COLORS[myMember.role]}>{ROLE_LABELS[myMember.role]}</Badge>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {teamMembers.map(member => (
              <div key={member.id} className="bg-gray-700 rounded px-3 py-2">
                <div className="font-medium text-sm">{member.providerName}</div>
                {member.role && (
                  <Badge className={`${ROLE_COLORS[member.role]} text-xs mt-1`}>
                    {ROLE_LABELS[member.role]}
                  </Badge>
                )}
              </div>
            ))}
          </div>
          {myMember && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Change role:</span>
              {(Object.keys(ROLE_LABELS) as TeamRole[]).map(role => (
                <Button
                  key={role}
                  size="sm"
                  variant={myMember.role === role ? 'default' : 'outline'}
                  onClick={() => handleRoleChange(role)}
                >
                  {ROLE_LABELS[role]}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-8">
        {!isRunning ? (
          <div className="text-center space-y-8">
            <div>
              <div className="text-6xl font-bold mb-4">Ready to Start</div>
              <div className="text-2xl text-gray-400">Patient Weight: {patientWeight} kg</div>
            </div>
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white text-2xl px-12 py-8 h-auto"
              onClick={startArrest}
            >
              <Play className="h-8 w-8 mr-4" />
              START CPR
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-4xl space-y-8">
            {/* Current action */}
            <div className="text-center">
              <div className="text-7xl font-bold mb-4">
                {phase === 'compressions' && 'COMPRESSIONS'}
                {phase === 'rhythm_check' && 'RHYTHM CHECK'}
                {phase === 'shock' && 'SHOCK'}
                {phase === 'drug' && 'MEDICATIONS'}
              </div>
              <div className="text-3xl text-gray-400">
                {phase === 'compressions' && 'Continue CPR - 100-120/min'}
                {phase === 'rhythm_check' && 'Analyze rhythm'}
                {phase === 'shock' && 'Clear patient and shock'}
                {phase === 'drug' && 'Administer medications'}
              </div>
            </div>

            {/* Cycle timer */}
            <div className="text-center">
              <div className="text-5xl font-mono font-bold text-yellow-400">
                {formatTime(120 - cycleTime)}
              </div>
              <div className="text-xl text-gray-400">Until rhythm check</div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                size="lg"
                className="bg-yellow-600 hover:bg-yellow-700 h-24 flex-col"
                onClick={giveEpinephrine}
              >
                <Syringe className="h-8 w-8 mb-2" />
                <div className="text-sm">Epinephrine</div>
                <div className="text-xs opacity-80">{epiDose} mg</div>
              </Button>
              
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 h-24 flex-col"
                onClick={deliverShock}
                disabled={rhythmType !== 'shockable'}
              >
                <Zap className="h-8 w-8 mb-2" />
                <div className="text-sm">Shock</div>
                <div className="text-xs opacity-80">Count: {shockCount}</div>
              </Button>
              
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 h-24 flex-col"
                onClick={giveAmiodarone}
                disabled={amiodaroneGiven || shockCount < 3}
              >
                <Syringe className="h-8 w-8 mb-2" />
                <div className="text-sm">Amiodarone</div>
                <div className="text-xs opacity-80">{amiodaroneDose} mg</div>
              </Button>
              
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 h-24 flex-col"
                onClick={achieveROSC}
              >
                <CheckCircle2 className="h-8 w-8 mb-2" />
                <div className="text-sm">ROSC</div>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Rhythm check modal */}
      {showRhythmCheck && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
          <Card className="max-w-2xl w-full mx-4">
            <CardContent className="p-8 space-y-6">
              <h2 className="text-3xl font-bold text-center">Rhythm Check</h2>
              <p className="text-center text-xl text-muted-foreground">
                Analyze the rhythm and select:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  size="lg"
                  className="h-32 text-xl bg-red-600 hover:bg-red-700"
                  onClick={() => handleRhythmCheck('shockable')}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Zap className="h-12 w-12" />
                    <div>Shockable</div>
                    <div className="text-sm opacity-80">(VF/pVT)</div>
                  </div>
                </Button>
                <Button
                  size="lg"
                  className="h-32 text-xl bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleRhythmCheck('non_shockable')}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Activity className="h-12 w-12" />
                    <div>Non-Shockable</div>
                    <div className="text-sm opacity-80">(Asystole/PEA)</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
