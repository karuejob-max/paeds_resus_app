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

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
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
  Vibrate,
  QrCode,
  Users,
  UserPlus,
  Mic,
  MicOff,
  Wind,
  MoreHorizontal,
  Pencil
} from 'lucide-react';
import QRCode from 'qrcode';
import { trpc } from '@/lib/trpc';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { useCprFeedback } from '@/hooks/useCprFeedback';
import { 
  evaluateRhythmTransition, 
  evaluateMedicationEligibility, 
  calculateShockEnergy,
  getCprShockEnergyLabel,
  calculateCprMedicationDose,
  calculateAmiodaroneDose,
  getCompressionCycleStatus,
  getEpinephrineTimingState,
  shouldTriggerIntubatedVentilationCue,
  getHyperkalemiaGuidance,
  getHypoxiaGuidance,
  getFluidBolusGuidance,
  applyRhythmWindowDecision,
  evaluateCprGpsAlerts,
  getRhythmClassificationFeedback,
  CPR_CYCLE_SECONDS,
  RHYTHM_WINDOW_SECONDS,
  type CprEngineState,
  type RhythmType,
  type EpiTimingState,
  type RhythmClassification,
} from '@/lib/resus/cpr-engine';
import { useCprClockShared } from '@/components/cpr/CprClockSharedContext';
import { CprDocumentationLog } from '@/components/cpr/CprDocumentationLog';
import { CPRDebriefing } from '@/components/CPRDebriefing';
import type { LifeSupportPackResult } from '@/lib/resus/cpr-pack-resolver';
import { CprArrestCommandConsole } from '@/components/CprArrestCommandConsole';
import {
  acknowledgeCprGpsEvent,
  enqueueCprGpsEvent,
  loadCprGpsEventOutbox,
  loadCprGpsSnapshot,
  persistCprGpsSnapshot,
  clearCprGpsSnapshot,
  type CprGpsEventOutboxItem,
} from '@/lib/resus/cprGpsSessionStore';

interface Props {
  patientWeight: number;
  patientAgeMonths?: number;
  /** Parent case key used only for local recovery; never a patient identifier. */
  caseKey?: string;
  onClose: () => void;
  externalElapsed?: number;
  externalRunning?: boolean;
  autoStart?: boolean;
  lifeSupportPack?: LifeSupportPackResult;
  /** Return ROSC and the server CPR session ID to the parent flow for post-cardiac-arrest care and debrief. */
  onROSC?: (cprSessionId?: number) => void;
  /** Open the parent completion/debrief path after a deliberate terminal outcome. */
  onCodeComplete?: (cprSessionId: number | undefined, outcome: 'mortality' | 'transferred' | 'unknown') => void;
  /** Notify the parent when the server CPR session exists so an IERS link can be created. */
  onSessionReady?: (cprSessionId: number) => void;
  /** The integrated flow owns demographics in ResusGPS; standalone mode may edit them locally. */
  allowPatientInfoEdit?: boolean;
  useSharedState?: boolean;
}

type ArrestPhase = 'initial_assessment' | 'compressions' | 'reassessment' | 'rhythm_check' | 'charging' | 'shock_ready' | 'post_shock';
type TeamRole = 'team_leader' | 'compressions' | 'airway' | 'iv_access' | 'medications' | 'recorder' | 'observer';
type AntiarrhythmicChoice = 'amiodarone' | 'lidocaine' | null;

type CprEventType = CprGpsEventOutboxItem['eventType'];

function cprEventTypeForAction(action: string): CprEventType {
  if (action.includes('Shock')) return 'defibrillation';
  if (action.includes('Epi') || action.includes('Amiodarone') || action.includes('Lidocaine')) return 'medication';
  if (action.includes('Airway') || action.includes('Ventilation')) return 'airway';
  if (action.includes('ROSC')) return 'outcome';
  return 'note';
}

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

export function CPRClockStreamlined({
  patientWeight,
  patientAgeMonths,
  caseKey,
  onClose,
  externalElapsed,
  externalRunning,
  autoStart,
  lifeSupportPack,
  onROSC,
  onCodeComplete,
  onSessionReady,
  allowPatientInfoEdit = true,
  useSharedState,
}: Props) {
  const shared = useCprClockShared();
  const syncShared = Boolean(useSharedState && shared);
  const autoStartApplied = useRef(false);

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
  const [compressionElapsed, setCompressionElapsed] = useState(0);
  const [cycleNumber, setCycleNumber] = useState(1);
  const [rhythmWindowElapsed, setRhythmWindowElapsed] = useState<number | null>(null);
  const [cycleTime, setCycleTime] = useState(0);
  const [phase, setPhase] = useState<ArrestPhase>('initial_assessment');
  const [rhythmFeedback, setRhythmFeedback] = useState<{
    title: string;
    message: string;
    severity: 'warning' | 'destructive';
  } | null>(null);
  
  // Clinical state
  const [rhythmType, setRhythmType] = useState<RhythmType | null>(null);
  const [shockCount, setShockCount] = useState(0);
  const [epiDoses, setEpiDoses] = useState(0);
  const [lastEpiTime, setLastEpiTime] = useState<number | null>(null);
  const [antiarrhythmic, setAntiarrhythmic] = useState<AntiarrhythmicChoice>(null);
  const [advancedAirwayPlaced, setAdvancedAirwayPlaced] = useState(false);
  const [airwayFallbackRecorded, setAirwayFallbackRecorded] = useState(false);
  const [ivIoSecured, setIvIoSecured] = useState(false);
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
  const [showEpinephrinePrompt, setShowEpinephrinePrompt] = useState(false);
  const [showAdvancedAirwayPrompt, setShowAdvancedAirwayPrompt] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [metronomeEnabled, setMetronomeEnabled] = useState(true);
  const [defibCharging, setDefibCharging] = useState(false);
  const [defibrillatorDelayed, setDefibrillatorDelayed] = useState(false);
  const [chargeForShock, setChargeForShock] = useState(false);
  const [showChargePrompt, setShowChargePrompt] = useState(false);
  const [showSummaryCard, setShowSummaryCard] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showRoscConfirm, setShowRoscConfirm] = useState(false);
  const [showTerminalOutcome, setShowTerminalOutcome] = useState(false);
  const [showPostRoscProtocol, setShowPostRoscProtocol] = useState(false);
  const [showDebrief, setShowDebrief] = useState(false);
  const [padsAttached, setPadsAttached] = useState(false);
  const [recoveredFromLocal, setRecoveredFromLocal] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine);
  const [postRoscChecklist, setPostRoscChecklist] = useState({
    ttm_initiated: false,
    fever_prevention_72h: false,
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
  const [intubationStartTime, setIntubationStartTime] = useState<number | null>(null);
  const [hyperKalemiaInput, setHyperKalemiaInput] = useState('');
  const [spo2Input, setSpo2Input] = useState('');
  const [fluidOverloadFindings, setFluidOverloadFindings] = useState({
    hepatomegaly: false,
    crepitations: false,
    jvd: false,
  });
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const metronomeRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const firedAlertsRef = useRef<Set<string>>(new Set());
  const epiPromptKeyRef = useRef<string | null>(null);
  const antiarrhythmicPromptKeyRef = useRef<string | null>(null);
  const rhythmWindowLoggedRef = useRef(false);
  const outboxFlushRef = useRef<Set<string>>(new Set());
  const recoveryCheckedRef = useRef(!caseKey);
  const sessionCreateAttemptedRef = useRef(false);
  
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

  useEffect(() => {
    const updateOnlineState = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineState);
    window.addEventListener('offline', updateOnlineState);
    return () => {
      window.removeEventListener('online', updateOnlineState);
      window.removeEventListener('offline', updateOnlineState);
    };
  }, []);

  useEffect(() => {
    if (!caseKey) return;
    let cancelled = false;
    loadCprGpsSnapshot(caseKey).then((snapshot) => {
      if (cancelled) return;
      recoveryCheckedRef.current = true;
      if (!snapshot || snapshot.roscAchieved) return;
      const restoredArrestDuration = externalElapsed ?? snapshot.arrestDuration;
      const restoredIsRunning = externalRunning ?? snapshot.isRunning;
      setPhase(snapshot.phase);
      setAdvancedAirwayPlaced(snapshot.advancedAirwayPlaced);
      setAirwayFallbackRecorded(snapshot.airwayFallbackRecorded);
      setIvIoSecured(snapshot.ivIoSecured);
      setDefibrillatorDelayed(snapshot.defibrillatorDelayed);
      setDefibCharging(snapshot.defibCharging);
      setChargeForShock(snapshot.chargeForShock);
      setRhythmWindowElapsed(snapshot.rhythmWindowElapsed);
      setReassessmentTime(snapshot.reassessmentTime);
      if (syncShared && shared) {
        shared.hydrate({
          engineState: snapshot.engineState,
          arrestDuration: restoredArrestDuration,
          compressionElapsed: snapshot.compressionElapsed,
          cycleNumber: snapshot.cycleNumber,
          cycleTime: snapshot.cycleTime,
          isRunning: restoredIsRunning,
          events: snapshot.events,
          roscAchieved: snapshot.roscAchieved,
          rhythmType: snapshot.rhythmType,
        });
      } else {
        setArrestDuration(restoredArrestDuration);
        setCompressionElapsed(snapshot.compressionElapsed);
        setCycleNumber(snapshot.cycleNumber);
        setCycleTime(snapshot.cycleTime);
        setShockCount(snapshot.engineState.shockCount);
        setEpiDoses(snapshot.engineState.epiDoses);
        setLastEpiTime(snapshot.engineState.lastEpiTime);
        setAntiarrhythmicDoses(snapshot.engineState.antiarrhythmicDoses);
        setRhythmType(snapshot.rhythmType);
        setRoscAchieved(snapshot.roscAchieved);

        setEvents(snapshot.events);
        setIsRunning(restoredIsRunning);
      }
      setRecoveredFromLocal(true);
    });
    return () => {
      cancelled = true;
    };
  }, [caseKey, externalElapsed, externalRunning, shared, syncShared]);

  const effectiveArrestDuration =
    externalElapsed !== undefined
      ? externalElapsed
      : syncShared
        ? shared!.arrestDuration
        : arrestDuration;

  const effectiveIsRunning = syncShared
    ? shared!.isRunning
    : externalRunning !== undefined
      ? externalRunning
      : isRunning;

  const effectiveShockCount = syncShared ? shared!.engineState.shockCount : shockCount;
  const effectiveEpiDoses = syncShared ? shared!.engineState.epiDoses : epiDoses;
  const effectiveLastEpiTime = syncShared ? shared!.engineState.lastEpiTime : lastEpiTime;
  const effectiveAntiarrhythmicDoses = syncShared
    ? shared!.engineState.antiarrhythmicDoses
    : antiarrhythmicDoses;
  const effectiveRhythmType = syncShared ? shared!.rhythmType ?? rhythmType : rhythmType;
  const effectiveRoscAchieved = syncShared ? shared!.roscAchieved : roscAchieved;
  const effectiveCompressionElapsed = syncShared ? shared!.compressionElapsed : compressionElapsed;
  const effectiveCycleNumber = syncShared ? shared!.cycleNumber : cycleNumber;
  const effectiveEvents = syncShared ? shared!.events : events;
  const {
    audioSupported,
    audioUnlocked,
    hapticsSupported,
    unlockAudio,
    speak,
    stopSpeech,
    pulse,
    clearSpokenKeys,
  } = useCprFeedback({ audioEnabled, hapticsEnabled });

  const engineSnapshot = useMemo<CprEngineState>(() => ({
    shockCount: effectiveShockCount,
    epiDoses: effectiveEpiDoses,
    lastEpiTime: effectiveLastEpiTime,
    antiarrhythmicDoses: effectiveAntiarrhythmicDoses,
    rhythmType: effectiveRhythmType || 'unknown',
    phase: phase as CprEngineState['phase'],
  }), [effectiveShockCount, effectiveEpiDoses, effectiveLastEpiTime, effectiveAntiarrhythmicDoses, effectiveRhythmType, phase]);

  useEffect(() => {
    if (!caseKey || !recoveryCheckedRef.current || effectiveEvents.length === 0) return;
    if (effectiveRoscAchieved) {
      clearCprGpsSnapshot(caseKey);
      return;
    }
    persistCprGpsSnapshot({
      caseKey,
      savedAt: Date.now(),
      arrestDuration: effectiveArrestDuration,
      compressionElapsed: effectiveCompressionElapsed,
      cycleNumber: effectiveCycleNumber,
      cycleTime: effectiveCompressionElapsed,
      isRunning: effectiveIsRunning,
      phase,
      engineState: engineSnapshot,
      rhythmType: effectiveRhythmType,
      roscAchieved: effectiveRoscAchieved,
      advancedAirwayPlaced,
      airwayFallbackRecorded,
      ivIoSecured,
      defibrillatorDelayed,
      defibCharging,
      chargeForShock,
      rhythmWindowElapsed,
      reassessmentTime,
      events: effectiveEvents,
    });
  }, [
    caseKey,
    effectiveArrestDuration,
    effectiveCompressionElapsed,
    effectiveCycleNumber,
    phase,
    engineSnapshot,
    effectiveRhythmType,
    effectiveRoscAchieved,
    advancedAirwayPlaced,
    airwayFallbackRecorded,
    ivIoSecured,
    defibCharging,
    chargeForShock,
    rhythmWindowElapsed,
    reassessmentTime,
    effectiveEvents,
  ]);

  useEffect(() => {
    if (!caseKey) return;
    void loadCprGpsEventOutbox(caseKey).then((items) => setPendingSyncCount(items.length));
  }, [caseKey]);

  const flushPendingEvents = useCallback(async () => {
    if (!caseKey || !sessionId || !isOnline) return;
    const items = await loadCprGpsEventOutbox(caseKey);
    for (const item of items) {
      if (outboxFlushRef.current.has(item.localEventId)) continue;
      outboxFlushRef.current.add(item.localEventId);
      logEvent.mutate(
        {
          sessionId,
          memberId: item.memberId ?? undefined,
          eventType: item.eventType,
          eventTime: item.eventTime,
          description: item.description,
          value: item.value,
          metadata: item.metadata,
        },
        {
          onSuccess: () => {
            acknowledgeCprGpsEvent(item.localEventId);
            setPendingSyncCount((count) => Math.max(0, count - 1));
          },
          onError: () => {
            outboxFlushRef.current.delete(item.localEventId);
          },
        },
      );
    }
  }, [caseKey, isOnline, logEvent, sessionId]);

  useEffect(() => {
    void flushPendingEvents();
  }, [flushPendingEvents]);

  const isShockableRhythm = effectiveRhythmType === 'vf_pvt';
  const cprEnginePack = lifeSupportPack?.pack === 'ACLS' ? 'ACLS' : 'PALS';

  // Calculate doses using the selected adult or paediatric arrest pack.
  const epiDose = cprEnginePack === 'ACLS' ? 1 : Math.round(patientWeight * 0.01 * 100) / 100;
  const amiodaroneDoseInfo = calculateAmiodaroneDose(effectiveShockCount, patientWeight, cprEnginePack);
  const amiodaroneDose = amiodaroneDoseInfo.eligible
    ? amiodaroneDoseInfo.doseMg
    : Math.min(Math.round(patientWeight * 5), 300);
  const lidocaineDose = cprEnginePack === 'ACLS' ? 100 : Math.min(Math.round(patientWeight * 1), 100);
  const shockEnergy = calculateShockEnergy(patientWeight, effectiveShockCount);
  const shockEnergyLabel = getCprShockEnergyLabel(patientWeight, effectiveShockCount, lifeSupportPack?.pack ?? 'PALS');
  const compressionCycle = getCompressionCycleStatus(effectiveCompressionElapsed);
  const activeAlerts = evaluateCprGpsAlerts({
    compressionElapsed: effectiveCompressionElapsed,
    rhythmWindowElapsed,
    inReassessment: phase === 'reassessment',
    arrestDuration: effectiveArrestDuration,
    state: engineSnapshot,
    isShockable: isShockableRhythm,
    advancedAirwayPlaced,
    cycleNumber: effectiveCycleNumber,
    weightKg: patientWeight,
    defibDelayed: defibrillatorDelayed,
    defibCharging,
    lifeSupportPack: lifeSupportPack?.pack,
  });
  const epiState = getEpinephrineTimingState(
    effectiveArrestDuration,
    engineSnapshot,
    isShockableRhythm,
    { defibDelayed: defibrillatorDelayed, lifeSupportPack: cprEnginePack },
  );
  const epiDue = activeAlerts.some((alert) => alert.type === 'epinephrine_due');
  const antiarrhythmicDue = activeAlerts.some((alert) => alert.type === 'amiodarone_due');
  const antiarrhythmicAlert = activeAlerts.find((alert) => alert.type === 'amiodarone_due');

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const getEpiButtonClass = (state: EpiTimingState) => {
    if (state === 'overdue') return 'bg-red-600 hover:bg-red-700 animate-pulse';
    if (state === 'almost_due') return 'bg-orange-600 hover:bg-orange-700';
    return 'bg-green-600 hover:bg-green-700';
  };

  // Metronome (100-120 bpm = 600ms interval for 100 bpm). This is a
  // timing aid only; it is never compression-quality feedback.
  const playMetronomeBeep = useCallback(() => {
    if (!metronomeEnabled || !audioEnabled || !audioUnlocked || typeof window === 'undefined') return;

    if (!audioContextRef.current) {
      const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextConstructor) return;
      audioContextRef.current = new AudioContextConstructor();
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
  }, [metronomeEnabled, audioEnabled, audioUnlocked]);

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

  // Sync parent ResusGPS timer into shared/local arrest clock
  useEffect(() => {
    if (externalElapsed === undefined) return;
    if (syncShared && shared) {
      shared.setArrestDuration(externalElapsed);
    } else {
      setArrestDuration(externalElapsed);
    }
  }, [externalElapsed, syncShared, shared]);

  const resetCompressionCycle = useCallback(() => {
    if (syncShared && shared) {
      shared.setCompressionElapsed(0);
      shared.setCycleNumber((n) => n + 1);
    } else {
      setCompressionElapsed(0);
      setCycleNumber((n) => n + 1);
    }
    firedAlertsRef.current.clear();
    clearSpokenKeys();
  }, [syncShared, shared, clearSpokenKeys]);

  const addEvent = useCallback((action: string, details?: string) => {
    const ts =
      externalElapsed !== undefined
        ? externalElapsed
        : syncShared && shared
          ? shared.arrestDuration
          : arrestDuration;
    const event: ArrestEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: ts,
      action,
      details,
    };
    setEvents((prev) => [event, ...prev]);
    if (syncShared && shared) {
      shared.addEvent(action, details);
    }

    const eventType = cprEventTypeForAction(action);
    const queueForRetry = () => {
      if (!caseKey) return;
      enqueueCprGpsEvent({
        localEventId: event.id,
        caseKey,
        sessionId,
        memberId,
        eventType,
        eventTime: ts,
        description: action,
        value: details,
        queuedAt: Date.now(),
      });
      setPendingSyncCount((count) => count + 1);
    };

    if (!sessionId || !isOnline) {
      queueForRetry();
    } else {
      logEvent.mutate(
        {
          sessionId,
          memberId: memberId || undefined,
          eventType,
          eventTime: ts,
          description: action,
          value: details,
        },
        { onError: queueForRetry },
      );
    }
  }, [arrestDuration, sessionId, memberId, syncShared, shared, externalElapsed, logEvent, caseKey, isOnline]);

  // Create a server session only when the device reports connectivity. The
  // local CPR snapshot/outbox remains usable while offline.
  useEffect(() => {
    if (!autoStart && !isRunning) return;
    if (sessionId || !isOnline || sessionCreateAttemptedRef.current) return;
    sessionCreateAttemptedRef.current = true;
    createSession.mutate(
      { patientWeight, patientAgeMonths },
      {
        onSuccess: async (data) => {
          setSessionId(data.sessionId ?? null);
          setMemberId(data.memberId ?? null);
          setSessionCode(data.sessionCode);
          if (data.sessionId != null) onSessionReady?.(data.sessionId);

          const joinUrl = `${window.location.origin}/join-cpr/${data.sessionCode}`;
          const qrUrl = await QRCode.toDataURL(joinUrl, {
            width: 300,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' },
          });
          setQrCodeUrl(qrUrl);
        },
        onError: () => {
          // Allow a later online event to retry once without blocking local CPR.
          sessionCreateAttemptedRef.current = false;
        },
      },
    );
  }, [autoStart, createSession, isOnline, isRunning, onSessionReady, patientAgeMonths, patientWeight, sessionId]);

  // Speak one-shot CPR-GPS alerts (audio/visual per platform)
  useEffect(() => {
    for (const alert of activeAlerts) {
      const key = `${alert.type}-${effectiveCompressionElapsed}-${rhythmWindowElapsed ?? 'na'}`;
      if (firedAlertsRef.current.has(key)) continue;
      if (!alert.speakText) continue;
      firedAlertsRef.current.add(key);
      speak(alert.speakText, key);
      if (alert.severity === 'critical') pulse('critical');
      else if (alert.severity === 'warning') pulse('medium');
    }
  }, [activeAlerts, effectiveCompressionElapsed, rhythmWindowElapsed, speak, pulse]);

  useEffect(() => {
    const precharge = activeAlerts.some((a) => a.type === 'precharge_defibrillator');
    if (precharge && isShockableRhythm && !defibCharging) {
      setChargeForShock(false);
      setShowChargePrompt(true);
    }
    const airway = activeAlerts.some((a) => a.type === 'advanced_airway');
    if (airway) setShowAdvancedAirwayPrompt(true);
    if (antiarrhythmicDue) {
      const promptKey = `${effectiveShockCount}-${cprEnginePack}`;
      if (antiarrhythmicPromptKeyRef.current !== promptKey) {
        antiarrhythmicPromptKeyRef.current = promptKey;
        setShowAntiarrhythmicChoice(true);
      }
    } else {
      antiarrhythmicPromptKeyRef.current = null;
      setShowAntiarrhythmicChoice(false);
    }

    if (epiDue) {
      const promptKey = `${effectiveEpiDoses}-${cprEnginePack}`;
      if (epiPromptKeyRef.current !== promptKey) {
        epiPromptKeyRef.current = promptKey;
        setShowEpinephrinePrompt(true);
      }
    } else {
      epiPromptKeyRef.current = null;
      setShowEpinephrinePrompt(false);
    }
  }, [activeAlerts, antiarrhythmicDue, cprEnginePack, defibCharging, effectiveEpiDoses, effectiveShockCount, epiDue, isShockableRhythm]);

  // If mobile audio was unlocked after an alert fired, replay the current cue once.
  // Visible text and haptics remain the fallback when the browser blocks speech.
  useEffect(() => {
    if (!audioEnabled || !audioUnlocked) return;
    const alert = activeAlerts.find((item) => item.speakText);
    if (!alert?.speakText) return;
    speak(alert.speakText, `audio-unlocked-${alert.type}-${effectiveCompressionElapsed}-${rhythmWindowElapsed ?? 'na'}`);
  }, [activeAlerts, audioEnabled, audioUnlocked, effectiveCompressionElapsed, rhythmWindowElapsed, speak]);

  // Timer logic (skip arrest duration tick when parent timer is authoritative)
  useEffect(() => {
    if (effectiveIsRunning && !effectiveRoscAchieved) {
      timerRef.current = setInterval(() => {
        if (externalElapsed === undefined) {
          if (syncShared && shared) {
            shared.setArrestDuration((prev) => prev + 1);
          } else {
            setArrestDuration((prev) => prev + 1);
          }
        }

        if (phase === 'compressions') {
          const advance = (prev: number) => {
            if (prev >= CPR_CYCLE_SECONDS) return prev;
            const next = prev + 1;
            if (next >= CPR_CYCLE_SECONDS) {
              setPhase('reassessment');
              setReassessmentTime(RHYTHM_WINDOW_SECONDS);
              setRhythmWindowElapsed(0);
              setShowRhythmCheck(true);
              rhythmWindowLoggedRef.current = false;
              setDefibCharging(false);
              addEvent('2-minute cycle complete', `Cycle ${effectiveCycleNumber} — reassessment due`);
            }
            return Math.min(next, CPR_CYCLE_SECONDS);
          };
          if (syncShared && shared) shared.setCompressionElapsed(advance);
          else setCompressionElapsed(advance);
        } else if (phase === 'reassessment') {
          setRhythmWindowElapsed((prev) => (prev === null ? 1 : prev + 1));
        }

        if (
          intubationStartTime !== null &&
          shouldTriggerIntubatedVentilationCue(effectiveArrestDuration - intubationStartTime, advancedAirwayPlaced)
        ) {
          pulse('medium');
          speak('Ventilate now.');
          addEvent('Ventilation cue', 'Intubated ventilation at 6-second cadence');
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    effectiveIsRunning,
    effectiveRoscAchieved,
    effectiveArrestDuration,
    effectiveCompressionElapsed,
    effectiveCycleNumber,
    phase,
    rhythmWindowElapsed,
    advancedAirwayPlaced,
    intubationStartTime,
    externalElapsed,
    syncShared,
    shared,
    addEvent,
    speak,
  ]);

  // Reassessment countdown timer (10-second CPR interruption window)
  useEffect(() => {
    if (phase === 'reassessment' && reassessmentTime > 0) {
      const timer = setTimeout(() => {
        setReassessmentTime((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    if (phase === 'reassessment' && reassessmentTime === 0 && !rhythmWindowLoggedRef.current) {
      rhythmWindowLoggedRef.current = true;
      setShowRhythmCheck(true);
      addEvent('Rhythm check window', '10-second interruption for rhythm assessment');
    }
  }, [phase, reassessmentTime, addEvent]);

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

  // Auto-start when ResusGPS already began the arrest timer
  useEffect(() => {
    if (!autoStart || autoStartApplied.current) return;
    autoStartApplied.current = true;
    unlockAudio();
    if (syncShared && shared) {
      shared.setIsRunning(true);
    }
    setIsRunning(true);
    setPhase('compressions');
    setShowRhythmCheck(false);
    setPadsAttached(false);
    addEvent('Cardiac arrest recognized — CPR started; attach pads while compressions continue');
    speak('Cardiac arrest recognized. Start CPR with chest compressions. Attach pads now.');
  }, [autoStart, addEvent, speak, syncShared, shared]);

  // Start arrest - IMMEDIATE rhythm assessment workflow
  const startArrest = () => {
    unlockAudio();
    if (syncShared && shared) shared.setIsRunning(true);
    setIsRunning(true);
    setPhase('compressions');
    setShowRhythmCheck(false);
    setPadsAttached(false);
    addEvent('Cardiac arrest recognized — CPR started; attach pads while compressions continue');
    speak('Cardiac arrest recognized. Start CPR with chest compressions. Attach pads now.');
  };

  // Pads attached - assess rhythm immediately
  const handlePadsAttached = () => {
    unlockAudio();
    setPadsAttached(true);
    addEvent('Pads attached — continue compressions until the next reassessment window');
    speak('Pads attached. Continue compressions until the next rhythm check.');
  };

  // Handle rhythm check using cpr-engine
  const handleRhythmCheck = (type: RhythmType) => {
    setRhythmType(type);
    setShowRhythmCheck(false);
    
    // Use pure engine logic to determine next phase
    const engineState: CprEngineState = {
      shockCount: effectiveShockCount,
      epiDoses: effectiveEpiDoses,
      lastEpiTime: effectiveLastEpiTime,
      antiarrhythmicDoses: effectiveAntiarrhythmicDoses,
      rhythmType: type,
      phase: 'rhythm_check',
    };
    
    const rhythmResult = evaluateRhythmTransition(type, engineState);
    if (type === 'rosc') {
      setShowRoscConfirm(true);
      setRhythmWindowElapsed(null);
      addEvent('Pulse present — ROSC confirmation requested');
      speak('Pulse present. Confirm sustained ROSC.');
      return;
    }
    const classification: RhythmClassification = type === 'vf_pvt' ? 'shockable' : 'non_shockable';
    setRhythmFeedback(getRhythmClassificationFeedback(classification, type));
    const isShockable = type === 'vf_pvt';
    const medResult = evaluateMedicationEligibility(
      effectiveArrestDuration,
      engineState,
      isShockable,
      { defibDelayed: defibrillatorDelayed, lifeSupportPack: cprEnginePack }
    );
    if (syncShared && shared) {
      shared.setRhythmType(type);
      shared.setEngineState((s) => ({ ...s, rhythmType: type, phase: rhythmResult.nextPhase }));
    }
    
    // Hold progression until the physical rhythm action is deliberately completed.
    // Shockable rhythms use the charge -> clear/shock path; non-shockable rhythms
    // require a documented no-shock reason before compressions resume.
    if (isShockable) {
      setPhase('charging');
      setChargeForShock(true);
      setShowChargePrompt(true);
    } else {
      const wasScheduledReassessment = phase === 'reassessment';
      const noShockReason = `${type === 'pea' ? 'PEA' : type === 'bradycardia' ? 'Bradycardia' : 'Asystole'} documented — non-shockable rhythm`;
      applyRhythmWindowDecision(effectiveShockCount, {
        rhythmClassification: 'non_shockable',
        rhythmType: type,
        shockAction: 'no_shock',
        noShockReason,
      });
      if (wasScheduledReassessment) {
        setRhythmWindowElapsed(null);
        resetCompressionCycle();
      }
      setPhase('compressions');
    }
    addEvent(`${type.toUpperCase()} detected`, isShockable ? rhythmResult.message : `${rhythmResult.message} No shock documented; compressions resumed.`);
    speak(rhythmResult.message);
    if (medResult.epiEligible && medResult.recommendation) {
      speak(medResult.recommendation);
    }
  };

  // Deliver shock using cpr-engine. The UI must be in the explicit shock-ready
  // state and the provider must have documented that the defibrillator is charged.
  const deliverShock = () => {
    if (phase !== 'shock_ready' || !defibCharging) return;
    pulse('critical'); // Haptic feedback for shock
    const newShockCount = effectiveShockCount + 1;
    setShockCount(newShockCount);
    setDefibCharging(false);
    setChargeForShock(false);
    if (syncShared && shared) {
      shared.setEngineState((s) => ({ ...s, shockCount: newShockCount, phase: 'post_shock' }));
    }
    setPhase('post_shock');
    
    // Use engine to calculate energy
    const energy = lifeSupportPack?.pack === 'ACLS'
      ? getCprShockEnergyLabel(patientWeight, newShockCount - 1, 'ACLS')
      : `${calculateShockEnergy(patientWeight, newShockCount - 1)} J`;
    addEvent(`Shock ${newShockCount} delivered`, energy);
    speak(`Shock delivered. Resume CPR immediately.`);
    
    // Resume compressions
    setTimeout(() => {
      setPhase('compressions');
    }, 1000);
    
    // Check medication eligibility using engine
    const engineState: CprEngineState = {
      shockCount: newShockCount,
      epiDoses: effectiveEpiDoses,
      lastEpiTime: effectiveLastEpiTime,
      antiarrhythmicDoses: effectiveAntiarrhythmicDoses,
      rhythmType: effectiveRhythmType || 'unknown',
      phase: 'post_shock',
    };
    
    const medResult = evaluateMedicationEligibility(
      effectiveArrestDuration,
      engineState,
      true,
      { lifeSupportPack: cprEnginePack }
    );
    
    if (medResult.epiEligible && medResult.recommendation) {
      speak(medResult.recommendation);
    }
    
    if (newShockCount === 1 && !advancedAirwayPlaced) {
      setShowAdvancedAirwayPrompt(true);
      speak('Consider advanced airway placement.');
    }
    if (medResult.antiarrhythmicEligible && medResult.recommendation) {
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

  // Give epinephrine using cpr-engine
  const giveEpinephrine = () => {
    setShowEpinephrinePrompt(false);
    pulse('critical'); // Haptic feedback for epinephrine
    const newEpiDoses = effectiveEpiDoses + 1;
    setEpiDoses(newEpiDoses);
    setLastEpiTime(effectiveArrestDuration);
    if (syncShared && shared) {
      shared.setEngineState((s) => ({
        ...s,
        epiDoses: newEpiDoses,
        lastEpiTime: effectiveArrestDuration,
      }));
    }
    
    // Use engine to calculate dose
    const doseMeta = calculateCprMedicationDose('epinephrine', patientWeight, cprEnginePack);
    addEvent(
      `Epinephrine dose ${newEpiDoses}`, 
      `${doseMeta.dose} ${doseMeta.unit}${doseMeta.preparation ? ` (${doseMeta.preparation})` : ''}`
    );
    speak(`Give epinephrine ${doseMeta.dose} milligrams.`);
  };

  // Give antiarrhythmic
  const giveAntiarrhythmic = (choice: 'amiodarone' | 'lidocaine') => {
    pulse('critical'); // Haptic feedback for antiarrhythmic
    setAntiarrhythmic(choice);
    setAntiarrhythmicDoses(prev => prev + 1);
    setShowAntiarrhythmicChoice(false);
    
    const amioInfo = calculateAmiodaroneDose(effectiveShockCount, patientWeight, cprEnginePack);
    if (choice === 'amiodarone') {
      const doseMg = amioInfo.eligible ? amioInfo.doseMg : amiodaroneDose;
      addEvent('Amiodarone given', amioInfo.label || `${doseMg} mg IV`);
      speak(`Amiodarone ${doseMg} milligrams given.`);
    } else {
      addEvent('Lidocaine given', `${lidocaineDose} mg (1 mg/kg, max 100 mg)`);
      speak('Lidocaine given.');
    }
  };

  const hypoxiaGuidance = getHypoxiaGuidance(spo2Input.trim() ? Number(spo2Input) : null);
  const fluidBolusGuidance = getFluidBolusGuidance(
    patientWeight,
    lifeSupportPack?.pack === 'ACLS',
    fluidOverloadFindings,
  );

  const recordHypoxiaAssessment = () => {
    if (!spo2Input.trim() || !Number.isFinite(Number(spo2Input))) return;
    setReversibleCausesChecked((prev) => ({ ...prev, hypoxia: true }));
    addEvent('Hypoxia assessed', `SpO₂ ${Number(spo2Input)}% — ${hypoxiaGuidance.severity}`);
    speak(hypoxiaGuidance.recommendation);
  };

  const recordFluidAssessment = () => {
    setReversibleCausesChecked((prev) => ({ ...prev, hypovolemia: true }));
    addEvent('Hypovolemia/overload screen documented', fluidBolusGuidance.recommendation);
    speak(fluidBolusGuidance.overloadPresent ? 'Possible fluid overload sign. Stop boluses and reassess.' : `If hypovolemia is suspected, use ${fluidBolusGuidance.doseRange} and reassess.`);
  };

  const markIvIoSecured = () => {
    if (ivIoSecured) return;
    setIvIoSecured(true);
    addEvent('IV/IO access secured');
    speak('IV or IO access secured.');
  };

  const recordAirwayAdjunct = () => {
    setAirwayFallbackRecorded(true);
    setShowAdvancedAirwayPrompt(false);
    addEvent('Advanced airway unavailable — OPA/NPA adjunct or BVM pathway recorded');
    speak('Advanced airway unavailable. Use an appropriate airway adjunct and continue ventilation.');
  };

  // Advanced airway
  const placeAdvancedAirway = () => {
    setAdvancedAirwayPlaced(true);
    setAirwayFallbackRecorded(false);
    setIntubationStartTime(effectiveArrestDuration);
    setShowAdvancedAirwayPrompt(false);
    addEvent('Advanced airway placed');
    speak('Advanced airway placed. Continue compressions without pauses.');
  };

  const completeCode = (outcome: 'mortality' | 'transferred' | 'unknown') => {
    if (effectiveRoscAchieved) return;
    setShowTerminalOutcome(false);
    setIsRunning(false);
    addEvent(`CODE COMPLETE — ${outcome === 'mortality' ? 'death declared per local policy' : outcome}`);
    speak(outcome === 'mortality' ? 'Code complete. Death declared per local policy.' : `Code complete. Outcome recorded as ${outcome}.`);
    if (sessionId) {
      endSession.mutate({ sessionId, outcome, totalDuration: effectiveArrestDuration }, {
        onSuccess: () => onCodeComplete?.(sessionId, outcome),
        onError: () => onCodeComplete?.(sessionId, outcome),
      });
    } else {
      onCodeComplete?.(undefined, outcome);
    }
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

    if (onROSC) {
      onROSC(sessionId ?? undefined);
      return;
    }

    // Standalone CPR-GPS keeps its own post-ROSC checklist when no parent flow is present.
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
  const invalidWeight = !Number.isFinite(patientWeight) || patientWeight <= 0;
  const adultPathwayMissing = patientAgeMonths !== undefined && patientAgeMonths >= 144 && lifeSupportPack?.pack !== 'ACLS';
  const airwayStatus = advancedAirwayPlaced ? 'advanced' : airwayFallbackRecorded ? 'adjunct' : 'not_started';
  const ventilationRatioLabel = lifeSupportPack?.pack === 'ACLS'
    ? '30:2 BVM · advanced airway 1 breath/6 sec'
    : patientAgeMonths !== undefined && patientAgeMonths < 12
      ? '15:2 BVM · advanced airway 1 breath/2 sec'
      : '15:2 BVM · advanced airway 1 breath/3 sec';

  if (invalidWeight || adultPathwayMissing || lifeSupportPack?.pack === 'NRP') {
    const message = invalidWeight
      ? 'A verified patient weight is required before CPR-GPS can display dose or energy guidance.'
      : lifeSupportPack?.pack === 'NRP'
        ? 'Delivery-room newborn resuscitation uses the dedicated NRP pathway. Do not use this generic CPR console.'
        : 'Adult age context detected, but an explicit ACLS pathway was not supplied. Follow the approved adult emergency protocol.';
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-slate-950 p-4 sm:p-6">
        <Card className="w-full max-w-lg border-amber-400/70 bg-amber-950/40 text-white">
          <CardContent className="space-y-4 p-5 sm:p-7">
            <AlertTriangle className="h-10 w-10 text-amber-300" aria-hidden />
            <h2 className="text-xl font-bold">CPR-GPS pathway confirmation required</h2>
            <p className="text-sm leading-6 text-amber-50">{message}</p>
            <Button onClick={onClose} variant="outline" className="min-h-12 border-amber-200/60 text-white hover:bg-amber-50/10">
              Return to ResusGPS
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {showTerminalOutcome && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-labelledby="terminal-outcome-title">
          <Card className="w-full max-w-md border-slate-500 bg-gray-900 text-white">
            <CardContent className="space-y-4 p-5 md:p-6">
              <div>
                <h2 id="terminal-outcome-title" className="text-lg font-bold">Complete code</h2>
                <p className="mt-1 text-sm text-gray-300">Stop CPR-GPS only after the team has made and documented the clinical decision under local policy. This cannot be undone from the console.</p>
              </div>
              <div className="grid gap-2">
                <Button onClick={() => completeCode('mortality')} className="min-h-12 bg-red-700 hover:bg-red-800">No ROSC — death declared per local policy</Button>
                <Button onClick={() => completeCode('transferred')} className="min-h-12 bg-blue-700 hover:bg-blue-800">Transferred with ongoing care</Button>
                <Button onClick={() => completeCode('unknown')} className="min-h-12 bg-slate-700 hover:bg-slate-600">Outcome unknown / handoff incomplete</Button>
              </div>
              <Button variant="outline" onClick={() => setShowTerminalOutcome(false)} className="min-h-11 border-gray-600 text-white">Continue CPR / go back</Button>
            </CardContent>
          </Card>
        </div>
      )}
      {showRoscConfirm && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-labelledby="rosc-confirm-title">
          <Card className="w-full max-w-md border-emerald-500/60 bg-gray-900 text-white">
            <CardContent className="space-y-4 p-5 md:p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" aria-hidden />
                <div>
                  <h2 id="rosc-confirm-title" className="text-lg font-bold">Confirm ROSC</h2>
                  <p className="mt-1 text-sm text-gray-300">Confirm a sustained pulse and signs of circulation before leaving CPR-GPS.</p>
                </div>
              </div>
              <p className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-100">After confirmation, CPR-GPS will stop its arrest timer and ResusGPS will open post-cardiac-arrest care.</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button variant="outline" onClick={() => setShowRoscConfirm(false)} className="min-h-12 border-gray-600 text-white">Back to CPR</Button>
                <Button onClick={() => { setShowRoscConfirm(false); achieveROSC(); }} className="min-h-12 bg-emerald-600 hover:bg-emerald-700">Confirm ROSC</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Header - Mobile Optimized */}
      <div className="bg-gray-900 border-b border-gray-700 px-3 py-2 md:px-6 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Heart className="h-5 w-5 md:h-8 md:w-8 text-red-500" />
          <div>
            <h1 className="text-base md:text-2xl font-bold text-white">CPR-GPS</h1>
            <p className="text-gray-400 text-xs md:text-sm">{patientWeight}kg • {formatTime(arrestDuration)}</p>
          </div>
          
          {/* Demographics are edited in the parent ResusGPS flow when embedded. */}
          {allowPatientInfoEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPatientInfoDialog(true)}
              className="text-white h-8 w-8 md:h-10 md:w-10"
              aria-label="Edit patient information"
            >
              <Pencil className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          )}
        </div>
        
        <div className="relative flex items-center gap-1 md:gap-2">
          {/* Audio cues stay visible because they are part of the primary arrest safety loop. */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!audioEnabled) {
                setAudioEnabled(true);
                unlockAudio();
              } else if (!audioUnlocked) {
                unlockAudio();
              } else {
                setAudioEnabled(false);
                stopSpeech();
              }
            }}
            className="text-white h-8 w-8 md:h-10 md:w-10"
            aria-label={!audioEnabled ? 'Turn audio cues on' : !audioUnlocked ? 'Enable audio cues' : 'Turn audio cues off'}
            title={!audioEnabled ? 'Audio cues off' : !audioUnlocked ? 'Tap to enable audio cues' : 'Audio cues on'}
          >
            {audioEnabled ? <Volume2 className="h-4 w-4 md:h-5 md:w-5" /> : <VolumeX className="h-4 w-4 md:h-5 md:w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTools((current) => !current)}
            className="text-white h-8 px-2 gap-1"
            aria-expanded={showTools}
            aria-label="Open CPR-GPS tools"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Tools</span>
          </Button>

          {showTools && (
            <div className="absolute right-0 top-10 z-40 w-64 rounded-xl border border-gray-700 bg-gray-900 p-2 shadow-xl">
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">CPR-GPS tools</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isListening ? stopListening : startListening}
                  className={`${isListening ? 'text-red-400' : 'text-white'} justify-start gap-2`}
                >
                  {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  Voice
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMetronomeEnabled((current) => !current)}
                  className="text-white justify-start gap-2"
                >
                  <Wind className="h-4 w-4" />
                  {metronomeEnabled ? 'Metronome on' : 'Metronome off'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHapticsEnabled((current) => !current)}
                  className="text-white justify-start gap-2"
                  aria-label={hapticsEnabled ? 'Turn haptic cues off' : 'Turn haptic cues on'}
                >
                  <Vibrate className="h-4 w-4" />
                  {hapticsEnabled ? 'Haptics on' : 'Haptics off'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const delayed = !defibrillatorDelayed;
                    setDefibrillatorDelayed(delayed);
                    if (delayed) setDefibCharging(false);
                    addEvent('Defibrillator availability updated', delayed ? 'Delayed or unavailable' : 'Available');
                  }}
                  className="text-white justify-start gap-2"
                  aria-pressed={defibrillatorDelayed}
                >
                  <Zap className="h-4 w-4" />
                  Defib: {defibrillatorDelayed ? 'delayed' : 'available'}
                </Button>
                <p className="col-span-2 rounded-md bg-slate-800 px-2 py-1 text-[11px] text-slate-300">
                  Audio: {audioSupported ? (audioUnlocked ? 'ready' : 'tap the speaker to enable') : 'unavailable — text cues remain active'} · Haptics: {hapticsSupported ? 'available' : 'unavailable'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTeamPanel((current) => !current)}
                  className="text-white justify-start gap-2"
                >
                  <Users className="h-4 w-4" />
                  Team {teamMembers.length > 0 ? `(${teamMembers.length})` : ''}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQrCode((current) => !current)}
                  className="text-white justify-start gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  QR
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSummaryCard((current) => !current)}
                  className="text-white justify-start gap-2 col-span-2"
                >
                  <Activity className="h-4 w-4" />
                  Arrest summary
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReversibleCauses(true)}
                  className="text-white justify-start gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  H&apos;s &amp; T&apos;s
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedAirwayPrompt(true)}
                  className="text-white justify-start gap-2"
                >
                  <Wind className="h-4 w-4" />
                  Advanced airway
                </Button>
              </div>
            </div>
          )}
          
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

      {(recoveredFromLocal || pendingSyncCount > 0 || !isOnline) && (
        <div className="border-b border-slate-700 bg-slate-900 px-3 py-2 text-center text-xs text-slate-300" role="status">
          {recoveredFromLocal && <span className="mr-3 font-semibold text-emerald-300">Recovered local CPR state</span>}
          <span>{isOnline ? 'Device online' : 'Offline — local guidance and event log remain available'}</span>
          {pendingSyncCount > 0 && <span className="ml-2 text-amber-300">· {pendingSyncCount} event{pendingSyncCount === 1 ? '' : 's'} awaiting server confirmation</span>}
        </div>
      )}

      <CprArrestCommandConsole
        phase={phase}
        effectiveIsRunning={effectiveIsRunning}
        effectiveRoscAchieved={effectiveRoscAchieved}
        autoStart={autoStart}
        effectiveArrestDuration={effectiveArrestDuration}
        patientWeight={patientWeight}
        lifeSupportPack={lifeSupportPack}
        compressionCycle={compressionCycle}
        reassessmentTime={reassessmentTime}
        rhythmWindowElapsed={rhythmWindowElapsed}
        activeAlerts={activeAlerts}
        effectiveCycleNumber={effectiveCycleNumber}
        effectiveShockCount={effectiveShockCount}
        effectiveEpiDoses={effectiveEpiDoses}
        effectiveRhythmType={effectiveRhythmType}
        padsAttached={padsAttached}
        audioEnabled={audioEnabled}
        audioUnlocked={audioUnlocked}
        onUnlockAudio={unlockAudio}
        epiState={epiState}
        epiDose={epiDose}
        antiarrhythmicDue={antiarrhythmicDue}
        antiarrhythmicMessage={antiarrhythmicAlert?.message}
        onShowAntiarrhythmic={() => setShowAntiarrhythmicChoice(true)}
        shockEnergyLabel={shockEnergyLabel}
        formatTime={formatTime}
        onStartArrest={startArrest}
        onPadsAttached={handlePadsAttached}
        onDeliverShock={deliverShock}
        onDisarmDefib={disarmDefib}
        defibReady={defibCharging && !defibrillatorDelayed}
        onGiveEpinephrine={giveEpinephrine}
        ivIoSecured={ivIoSecured}
        airwayStatus={airwayStatus}
        ventilationRatioLabel={ventilationRatioLabel}
        onMarkIvIoSecured={markIvIoSecured}
        onOpenAirway={() => setShowAdvancedAirwayPrompt(true)}
        roscActionLabel={patientAgeMonths !== undefined && patientAgeMonths < 144 ? 'Pulse present / HR >60 · confirm ROSC' : 'Pulse present · confirm ROSC'}
        onShowRoscConfirm={() => setShowRoscConfirm(true)}
        onRecordTerminalOutcome={() => setShowTerminalOutcome(true)}
        documentationLog={
          <CprDocumentationLog
            entries={syncShared && shared ? shared.events : events}
            formatTime={formatTime}
            onLogQuickAction={addEvent}
          />
        }
      />

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
                  onClick={() => handleRhythmCheck('rosc')}
                  size="lg"
                  className="w-full bg-green-700 hover:bg-green-600 text-white text-xl py-6 h-auto"
                >
                  <CheckCircle2 className="h-6 w-6 mr-3" />
                  {patientAgeMonths !== undefined && patientAgeMonths < 144 ? 'Pulse present / HR >60 — confirm ROSC' : 'Pulse present — confirm ROSC'}
                </Button>

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

                {lifeSupportPack?.pack === 'PALS' && (
                  <Button
                    onClick={() => handleRhythmCheck('bradycardia')}
                    size="lg"
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xl py-6 h-auto"
                  >
                    Bradycardia (&lt;60/min · PALS child)
                  </Button>
                )}
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
                <p className="text-gray-300">{shockEnergyLabel}</p>
              </div>
              
              <div className="space-y-4">
                <Button
                  onClick={() => {
                    setDefibCharging(true);
                    setShowChargePrompt(false);
                    if (chargeForShock) setPhase('shock_ready');
                    pulse('medium');
                    addEvent('Defibrillator charged', shockEnergyLabel);
                    speak('Defibrillator charged and ready.');
                  }}
                  size="lg"
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-black py-6 h-auto"
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <Zap className="h-6 w-6" />
                      <span className="text-xl font-bold">I charged the defibrillator</span>
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

      {/* Epinephrine due overlay — closing it does not clear the persistent reminder. */}
      {showEpinephrinePrompt && epiDue && (
        <div className="absolute inset-0 bg-black/85 flex items-center justify-center z-30 p-4" role="dialog" aria-modal="true" aria-labelledby="epi-due-title">
          <Card className="bg-gray-900 border-red-500/80 w-full max-w-lg text-white">
            <CardContent className="p-5 md:p-7 space-y-4">
              <div className="flex items-start gap-3">
                <Syringe className="mt-1 h-8 w-8 shrink-0 text-red-300" aria-hidden />
                <div>
                  <h2 id="epi-due-title" className="text-2xl font-black">EPINEPHRINE DUE NOW</h2>
                  <p className="mt-1 text-sm text-red-100">Confirm administration to clear this reminder. Keep compressions and the arrest sequence moving.</p>
                </div>
              </div>
              <div className="rounded-lg border border-red-400/50 bg-red-950/50 p-4">
                <p className="text-lg font-bold">Epinephrine {epiDose} mg IV/IO</p>
                <p className="mt-1 text-sm text-red-100">{lifeSupportPack?.pack ?? 'Governed'} pathway · dose calculated from {patientWeight} kg</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button onClick={giveEpinephrine} className="min-h-12 bg-red-600 text-base font-bold hover:bg-red-700">Given now</Button>
                <Button onClick={() => setShowEpinephrinePrompt(false)} variant="outline" className="min-h-12 border-gray-600 text-white hover:bg-white/10">Keep reminder visible</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Antiarrhythmic choice overlay */}
      {showAntiarrhythmicChoice && antiarrhythmicDue && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <Syringe className="h-16 w-16 text-purple-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">ANTIARRHYTHMIC</h2>
                <p className="text-gray-300">
                  {effectiveShockCount === 3
                    ? 'After 3rd shock — amiodarone 300 mg IV (or 5 mg/kg)'
                    : effectiveShockCount === 5
                      ? 'After 5th shock — amiodarone 150 mg IV (or 2.5 mg/kg)'
                      : 'Refractory shockable rhythm — choose one'}
                </p>
              </div>
              
              <div className="space-y-4">
                <Button
                  onClick={() => giveAntiarrhythmic('amiodarone')}
                  size="lg"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xl py-6 h-auto"
                >
                  Amiodarone {amiodaroneDoseInfo.eligible ? amiodaroneDoseInfo.doseMg : amiodaroneDose} mg
                  <span className="block text-sm mt-1">
                    {amiodaroneDoseInfo.label || '(5 mg/kg, max 300 mg)'}
                  </span>
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
              
              <div className="mb-4 space-y-3 rounded-xl border border-blue-500/40 bg-blue-950/30 p-3 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Structured checks</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
                    <Label htmlFor="cpr-spo2" className="text-sm font-bold text-white">Hypoxia · SpO₂ (%)</Label>
                    <div className="mt-2 flex gap-2">
                      <Input id="cpr-spo2" inputMode="numeric" type="number" min="0" max="100" value={spo2Input} onChange={(event) => setSpo2Input(event.target.value)} placeholder="e.g. 88" className="border-gray-600 bg-gray-800 text-white" />
                      <Button onClick={recordHypoxiaAssessment} disabled={!spo2Input.trim()} className="shrink-0 bg-blue-600 text-xs hover:bg-blue-500">Record</Button>
                    </div>
                    {spo2Input.trim() && <p className={`mt-2 text-xs ${hypoxiaGuidance.severity === 'critical' ? 'text-red-300' : 'text-blue-200'}`}>{hypoxiaGuidance.recommendation}</p>}
                  </div>
                  <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
                    <p className="text-sm font-bold text-white">Hypovolemia · check overload first</p>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-200">
                      {(['hepatomegaly', 'crepitations', 'jvd'] as const).map((finding) => (
                        <label key={finding} className="flex items-start gap-1.5">
                          <input type="checkbox" checked={fluidOverloadFindings[finding]} onChange={(event) => setFluidOverloadFindings((prev) => ({ ...prev, [finding]: event.target.checked }))} className="mt-0.5 h-4 w-4" />
                          <span>{finding === 'jvd' ? 'JVD' : finding === 'hepatomegaly' ? 'Hepatomegaly' : 'Crepitations'}</span>
                        </label>
                      ))}
                    </div>
                    <p className={`mt-2 text-xs ${fluidBolusGuidance.overloadPresent ? 'text-red-300' : 'text-blue-200'}`}>{fluidBolusGuidance.overloadPresent ? 'Possible overload sign: stop boluses and reassess.' : fluidBolusGuidance.doseRange}</p>
                    <Button onClick={recordFluidAssessment} className="mt-2 w-full bg-blue-600 text-xs hover:bg-blue-500">Record screen and plan</Button>
                  </div>
                </div>
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
                      <Input
                        placeholder="Enter K+ mmol/L"
                        value={hyperKalemiaInput}
                        onChange={(e) => setHyperKalemiaInput(e.target.value)}
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                      {hyperKalemiaInput && !Number.isNaN(Number(hyperKalemiaInput)) && (
                        <div className="text-xs text-blue-200 space-y-1">
                          {(() => {
                            const guidance = getHyperkalemiaGuidance({
                              weightKg: patientWeight,
                              potassiumMmolL: Number(hyperKalemiaInput),
                              hasEcgChanges: true,
                              prolongedArrest: effectiveArrestDuration >= 600,
                            });
                            return (
                              <>
                                <p>{guidance.calciumGluconate}</p>
                                <p>{guidance.insulinDextrose}</p>
                                <p>{guidance.bicarbonate}</p>
                              </>
                            );
                          })()}
                        </div>
                      )}
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReversibleCausesChecked(prev => ({ ...prev, hypokalemia: true }));
                          addEvent('Hyperkalemia pathway documented', `K+ ${hyperKalemiaInput || 'unknown'} mmol/L`);
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
                  onClick={recordAirwayAdjunct}
                  size="lg"
                  variant="outline"
                  className="w-full border-amber-400/70 text-white hover:bg-amber-950/50"
                >
                  No advanced airway available — use OPA/NPA
                </Button>
                <Button
                  onClick={() => setShowAdvancedAirwayPrompt(false)}
                  size="lg"
                  variant="ghost"
                  className="w-full text-white hover:bg-white/10"
                >
                  Continue with BVM for now
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
                {rhythmType === 'bradycardia' && 'Bradycardia'}
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

              <div className="mb-5 rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-3 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">PCAC targets · work through A → E</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3"><p className="font-bold">A · Airway</p><p className="mt-1 text-xs text-gray-300">Confirm airway position and patency. If advanced airway is present, ventilate without pausing compressions; otherwise use the documented BVM/OPA/NPA plan.</p></div>
                  <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3"><p className="font-bold">B · Breathing</p><p className="mt-1 text-xs text-gray-300">{lifeSupportPack?.pack === 'ACLS' ? 'Titrate oxygen to SpO₂ 90–98% once reliable; target PaCO₂ 35–45 mmHg.' : 'Avoid hypoxemia and hyperoxemia; use the approved paediatric SpO₂ target and target normal PaCO₂ per local PALS protocol.'}</p></div>
                  <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3"><p className="font-bold">C · Circulation</p><p className="mt-1 text-xs text-gray-300">{lifeSupportPack?.pack === 'ACLS' ? 'Avoid hypotension: target MAP ≥65 mmHg.' : 'Target systolic and mean arterial pressure above the 10th percentile for age and sex; use age-specific local targets.'}</p></div>
                  <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3"><p className="font-bold">D · Disability</p><p className="mt-1 text-xs text-gray-300">Check glucose, pupils, mental status, seizures, and temperature trend. Avoid hypoglycaemia; use serial multimodal neurologic assessment.</p></div>
                  <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3 sm:col-span-2"><p className="font-bold">E · Exposure / ongoing care</p><p className="mt-1 text-xs text-gray-300">Prevent fever; in children avoid central temperature &gt;37.5°C. In adults who remain unresponsive, maintain temperature control for at least 36 hours. Complete ECG, labs, imaging, transfer, and handoff according to local capability.</p></div>
                </div>
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
                    <div className="text-sm text-gray-400">
                      Target 32–37.5°C; avoid fever for 72 hours post-ROSC
                    </div>
                  </div>
                </div>

                {/* Fever prevention 72h */}
                <div
                  className="flex items-start gap-3 p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                  onClick={() => {
                    setPostRoscChecklist((prev) => ({
                      ...prev,
                      fever_prevention_72h: !prev.fever_prevention_72h,
                    }));
                    if (!postRoscChecklist.fever_prevention_72h) {
                      addEvent('Fever prevention plan (72h post-ROSC)');
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={postRoscChecklist.fever_prevention_72h}
                    onChange={() => {}}
                    className="h-5 w-5 mt-0.5 flex-shrink-0 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="font-bold">Fever prevention (72 hours)</div>
                    <div className="text-sm text-gray-400">
                      Treat temperature &gt;37.5°C; maintain normothermia after ROSC
                    </div>
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
                    <div className="font-bold">Blood pressure targets</div>
                    <div className="text-sm text-gray-400">
                      Maintain age-appropriate MAP/SBP; treat hypotension — consider vasopressors and fluid
                    </div>
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

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {sessionId && <Button
                  onClick={() => {
                    setShowPostRoscProtocol(false);
                    setShowDebrief(true);
                  }}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Open team debrief
                </Button>}
                <Button
                  onClick={() => setShowPostRoscProtocol(false)}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  Close protocol
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showDebrief && sessionId && (
        <CPRDebriefing
          sessionId={sessionId}
          totalDuration={effectiveArrestDuration}
          shockCount={effectiveShockCount}
          epiDoses={effectiveEpiDoses}
          outcome={effectiveRoscAchieved ? 'ROSC' : 'ongoing'}
          events={effectiveEvents}
          teamMembers={teamMembers}
          onClose={() => setShowDebrief(false)}
        />
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
