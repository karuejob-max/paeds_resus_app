/**
 * ResusGPS v2 — Complete Rebuild
 * 
 * KEY CHANGES:
 * 1. OBJECTIVE VITAL SIGNS — number inputs with quick-pick buttons, not ranges
 * 2. INTERVENTION TRACKING PANEL — swipeable side panel with live status, reassessment flow
 * 3. MID-CASE PATIENT INFO — editable weight/age from top bar at any point
 * 4. UNIVERSAL QUICK ASSESSMENT — no "Pediatric Assessment Triangle" language
 * 5. CONSISTENT DOSING — single source of truth, drug name on every dose
 * 6. CLINICAL DOCUMENTATION — objective values that feed ML and generate real notes
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { BottomNav } from '@/components/BottomNav';
import { RecommendationBanner } from '@/components/RecommendationBanner';
import { CPRClockUnified } from '@/components/CPRClockUnified';
import { resolveLifeSupportPack } from '@/lib/resus/cpr-pack-resolver';
import { useResusAnalytics } from '@/hooks/useResusAnalytics';
import { useAnalytics } from '@/hooks/useAnalytics';
import { trpc } from '@/lib/trpc';
import { checkMedicationDuplicate, type DuplicateCheckResult } from '@/lib/resus/medication-deduplication';
import { DuplicateWarningDialog } from '@/components/DuplicateWarningDialog';
import { CareSignalPostEventPrompt } from '@/components/CareSignalPostEventPrompt';
import { ResusGpsFellowshipPillarBanner } from '@/components/ResusGpsFellowshipPillarBanner';
import { ClinicalContentSafetyFooter } from '@/components/ClinicalContentSafetyFooter';
import { ClinicalUseDisclaimer } from '@/components/ClinicalUseDisclaimer';
import { AgeInput } from '@/components/AgeInput';
import { estimateWeightFromAge, parseAgeString, ageToMonths, type StructuredAge } from '@/lib/resus/age-calculator';
import { DiagnosisCard } from '@/components/DiagnosisCard';
import { getDoseRationale } from '@/lib/resus/dose-rationale';
import { DoseRationaleCard } from '@/components/DoseRationaleCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { usePatientDemographics } from '@/contexts/PatientDemographicsContext';
import { useUndo } from '@/hooks/useUndo';
import {
  type ResusSession,
  type AssessmentQuestion,
  type Threat,
  type Intervention,
  type ReassessmentCheck,
  type Phase,
  type ABCDELetter,
  type DiagnosisSuggestion,
  createSession,
  startQuickAssessment,
  answerQuickAssessment,
  getCurrentQuestions,
  getAnsweredQuestionIds,
  answerPrimarySurvey,
  completeIntervention,
  startIntervention,
  markInterventionUnavailable,
  returnToPrimarySurvey,
  getActiveThreats,
  getPendingInterventions,
  getAllPendingCritical,
  getSuggestedDiagnoses,
  triggerCardiacArrest,
  achieveROSC,
  exportClinicalRecord,
  exportSessionSummaryOnePager,
  updatePatientInfo,
  acknowledgeSafetyAlert,
  calcDose,
  setDefinitiveDiagnosis,
  addConcurrentDiagnosis,
  removeConcurrentDiagnosis,
  updateSAMPLE,
  primarySurveyQuestions,
  getAgeCategory,
} from '@/lib/resus/abcdeEngine';
import { pushToUndoStack, undo, redo } from '@/lib/resus/undo-manager';
import {
  persistResusSession,
  loadPersistedResusSession,
  clearPersistedResusSession,
  saveSampleHistory,
  loadLastSampleHistory,
  clearSampleHistory,
  type PersistedSampleHistory,
} from '@/lib/resus/resusSessionStore';
import {
  AlertTriangle,
  Activity,
  Heart,
  Clock,
  ChevronRight,
  ChevronLeft,
  Download,
  RotateCcw,
  Undo2,
  Redo2,
  Zap,
  Shield,
  User,
  Pencil,
  X,
  CheckCircle2,
  Circle,
  Play,
  ArrowRight,
  Stethoscope,
  Droplets,
  Brain,
  Eye,
  Siren,
  FileText,
  Copy,
  ListChecks,
  Timer,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  XCircle,
  BookOpen,
  Layers,
  Users,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import {
  FELLOWSHIP_MICROCOURSE_RESUS_CONDITIONS,
  getFellowshipMicrocourseResusConditionCount,
  getFellowshipMicrocourseResusConditionLabel,
  isFellowshipMicrocourseResusCondition,
  normalizeToFellowshipResusConditionId,
  resolveFellowshipDiagnosisFromSession,
} from '@shared/fellowship-microcourse-resus-conditions';
import ExportDocumentsPanel from '@/components/ExportDocumentsPanel';
import { ConditionProtocolSheet } from '@/components/ConditionProtocolSheet';
import { MultiPatientBoard } from '@/components/MultiPatientBoard';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import { MedicationTimerStrip } from '@/components/MedicationTimerStrip';

// ─── Constants ──────────────────────────────────────────────

const LETTER_CONFIG: Record<ABCDELetter, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  X: { label: 'X — Exsanguination', icon: <Droplets className="h-5 w-5" />, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  A: { label: 'A — Airway (+ AVPU)', icon: <Activity className="h-5 w-5" />, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  B: { label: 'B — Breathing', icon: <Stethoscope className="h-5 w-5" />, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  C: { label: 'C — Circulation', icon: <Heart className="h-5 w-5" />, color: 'text-rose-400', bgColor: 'bg-rose-500/20' },
  D: { label: 'D — Disability', icon: <Brain className="h-5 w-5" />, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  E: { label: 'E — Exposure', icon: <Eye className="h-5 w-5" />, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
};

// ─── Timer Hook ─────────────────────────────────────────────
//
// Uses Date.now()-anchored requestAnimationFrame instead of setInterval.
// Browsers throttle setInterval to ~1 Hz (or slower) when a tab is
// backgrounded, which causes CPR cycle timers to drift during long codes.
// rAF + wall-clock anchoring guarantees accuracy regardless of tab state.

function useTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startWallRef = useRef<number>(0); // wall-clock ms when timer was (re)started
  const baseElapsedRef = useRef<number>(0); // elapsed seconds accumulated before last pause

  useEffect(() => {
    if (!running) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    // Anchor to wall clock so background throttling cannot cause drift
    startWallRef.current = Date.now();

    const tick = () => {
      const wallSeconds = Math.floor((Date.now() - startWallRef.current) / 1000);
      setElapsed(baseElapsedRef.current + wallSeconds);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [running]);

  const start = useCallback(() => setRunning(true), []);

  const stop = useCallback(() => {
    setRunning(false);
    // Snapshot current elapsed so resume continues from the right place
    baseElapsedRef.current = elapsed;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);

  const reset = useCallback(() => {
    setElapsed(0);
    baseElapsedRef.current = 0;
    setRunning(false);
  }, []);

  return { elapsed, running, start, stop, reset };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function approximateAgeMonths(age: string | null): number {
  if (!age) return 0;
  const structured = parseAgeString(age);
  if (structured) return Math.max(0, Math.round(ageToMonths(structured)));
  const lower = age.toLowerCase();
  const n = parseInt(lower.match(/\d+/)?.[0] ?? '0', 10);
  if (lower.includes('month')) return n;
  if (lower.includes('week')) return Math.max(0, Math.round(n / 4.33));
  if (lower.includes('day') || lower.includes('neonat')) return 0;
  if (lower.includes('year') || lower.includes('y ')) return n * 12;
  return n * 12;
}

// ─── Main Component ─────────────────────────────────────────

export default function ResusGPS() {
  const { demographics, setDemographics, getWeightInKg } = usePatientDemographics();
  const analytics = useResusAnalytics();
  const analyticsRef = useRef(analytics);
  analyticsRef.current = analytics;
  const { trackButtonClick } = useAnalytics('ResusGPS');
  const utils = trpc.useUtils();
  const [session, setSession] = useState<ResusSession>(() => createSession(getWeightInKg(), demographics.age || null));
  const [resumeCandidate, setResumeCandidate] = useState<ResusSession | null>(null);

  // ── On mount: check for an unfinished persisted session + last SAMPLE ───────
  useEffect(() => {
    loadPersistedResusSession().then((saved) => {
      if (saved && saved.phase !== 'IDLE') setResumeCandidate(saved);
    });
    loadLastSampleHistory().then((sample) => {
      if (sample) setPreFillSample(sample);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-persist on every session change ──────────────────────────────────
  useEffect(() => {
    if (session.phase !== 'IDLE') {
      persistResusSession(session);
    }
  }, [session]);
  const [recommendedPathway, setRecommendedPathway] = useState<{ pathway: string; condition: string; message: string } | null>(null);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [interventionPanelOpen, setInterventionPanelOpen] = useState(false);
  const [patientInfoOpen, setPatientInfoOpen] = useState(false);
  const [tempWeight, setTempWeight] = useState('');
  const [tempAge, setTempAge] = useState('');
  const [numberInput, setNumberInput] = useState('');
  const [numberInput2, setNumberInput2] = useState('');
  const [expandedThreat, setExpandedThreat] = useState<string | null>(null);
  const [reassessmentMode, setReassessmentMode] = useState<{ interventionId: string; checkIndex: number } | null>(null);
  const [showEventLog, setShowEventLog] = useState(false);
  const [showCPRClock, setShowCPRClock] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showProtocols, setShowProtocols] = useState(false);
  const [showMCIBoard, setShowMCIBoard] = useState(false);
  // Phase 6.3 — track which condition protocols were used + step counts for Fellowship Pillar B
  const [protocolsUsed, setProtocolsUsed] = useState<Record<string, { completed: number; total: number }>>({});
  const [preFillSample, setPreFillSample] = useState<PersistedSampleHistory | null>(null);
  const [samplePreFillDismissed, setSamplePreFillDismissed] = useState(false);
  const [fellowshipSavedSessionId, setFellowshipSavedSessionId] = useState<string | null>(null);
  const [savedCasesByCondition, setSavedCasesByCondition] = useState<Record<string, number>>({});
  const timer = useTimer();
  const { canUndo, canRedo, undo: handleUndo, redo: handleRedo } = useUndo(session, (nextSession) => setSession(nextSession));

  // Sync demographics
  useEffect(() => {
    const weight = getWeightInKg();
    const age = demographics.age || null;
    if (weight !== session.patientWeight || age !== session.patientAge) {
      setSession(prev => updatePatientInfo(prev, weight, age));
    }
  }, [demographics]);

  // Start timer when assessment begins
  useEffect(() => {
    if (session.phase !== 'IDLE' && !timer.running) {
      timer.start();
    }
  }, [session.phase]);

  // Auto-open intervention panel when threats detected
  useEffect(() => {
    if (session.phase === 'INTERVENTION') {
      setInterventionPanelOpen(true);
    }
  }, [session.phase]);

  // Load recommendation on mount
  const { data: autoLaunchData } = trpc.resusAutoLaunch.getRecommendedPathway.useQuery({}, { enabled: true });
  useEffect(() => {
    if (autoLaunchData) {
      setRecommendedPathway(autoLaunchData);
      setShowRecommendation(true);
    }
  }, [autoLaunchData]);

  const weight = session.patientWeight;
  const activeThreats = useMemo(() => getActiveThreats(session), [session]);
  const criticalPending = useMemo(() => getAllPendingCritical(session), [session]);
  const diagnoses = useMemo(() => getSuggestedDiagnoses(session), [session]);
  const unackedAlerts = session.safetyAlerts.filter(a => !a.acknowledged);

  const prevLetterRef = useRef<ABCDELetter | null>(null);
  const prevThreatCountRef = useRef(0);

  useEffect(() => {
    if (session.phase !== 'PRIMARY_SURVEY') {
      prevLetterRef.current = null;
      return;
    }
    const letter = session.currentLetter;
    if (prevLetterRef.current && prevLetterRef.current !== letter) {
      const threatsOnLetter = session.threats.filter(
        (t) => t.letter === prevLetterRef.current && !t.resolved
      ).length;
      void analyticsRef.current.trackLetterCompleted(prevLetterRef.current, threatsOnLetter);
      void analyticsRef.current.trackLetterStart(letter);
    } else if (!prevLetterRef.current) {
      void analyticsRef.current.trackLetterStart(letter);
    }
    prevLetterRef.current = letter;
  }, [session.currentLetter, session.phase, session.threats]);

  useEffect(() => {
    if (session.threats.length <= prevThreatCountRef.current) {
      prevThreatCountRef.current = session.threats.length;
      return;
    }
    const added = session.threats.slice(prevThreatCountRef.current);
    prevThreatCountRef.current = session.threats.length;
    for (const threat of added) {
      if (!threat.resolved) {
        void analyticsRef.current.trackThreatDetected(threat.name, threat.severity);
      }
    }
  }, [session.threats]);

  // ─── Handlers ───────────────────────────────────────────

  const handleStart = (isTrauma: boolean) => {
    trackButtonClick(isTrauma ? 'Start Trauma Assessment' : 'Start Assessment', { isTrauma });
    const s = createSession(getWeightInKg(), demographics.age || null, isTrauma);
    const started = startQuickAssessment(s);
    setSession(started);
    setFellowshipSavedSessionId(null);
    setSavedCasesByCondition({});
    timer.reset();
    timer.start();
    // Track assessment start
    analytics.trackAssessmentStart(demographics.age || undefined, getWeightInKg() ?? undefined);
  };

  const handleQuickAssessment = (answer: 'sick' | 'not_sick') => {
    setSession(prev => answerQuickAssessment(prev, answer));
    setNumberInput('');
    setNumberInput2('');
  };

  const handleAnswer = (question: AssessmentQuestion, answer: string, numVal?: number, numVal2?: number) => {
    setSession(prev => {
      const withUndo = pushToUndoStack(prev, `Answer: ${question.id} = ${answer}`);
      return answerPrimarySurvey(withUndo, question.id, answer, question, numVal, numVal2);
    });
    setNumberInput('');
    setNumberInput2('');
    // Track question answered
    analytics.trackQuestionAnswered(question.letter || 'X', question.id, answer);
  };

  const handleCompleteIntervention = (id: string) => {
    const intervention = session.threats.flatMap((t) => t.interventions).find((i) => i.id === id);
    setSession(prev => {
      const withUndo = pushToUndoStack(prev, `Complete: ${intervention?.action ?? id}`);
      return completeIntervention(withUndo, id);
    });
    // Track intervention completed
    if (intervention) {
      trackButtonClick('Log Intervention', { interventionName: intervention.action });
      analytics.trackInterventionCompleted(intervention.action);
    }
  };

  const [duplicateCheck, setDuplicateCheck] = useState<{
    interventionId: string;
    result: DuplicateCheckResult;
  } | null>(null);
  const [showCareSignalPrompt, setShowCareSignalPrompt] = useState(false);
  const [careSignalPromptDiagnosis, setCareSignalPromptDiagnosis] = useState('');
  const [showFellowshipPillarBanner, setShowFellowshipPillarBanner] = useState(false);

  /** Single entry point for starting an intervention — keeps duplicate-medication checks consistent (Intervention screen, side panel, etc.). */
  const handleStartIntervention = (id: string) => {
    const intervention = session.threats.flatMap((t) => t.interventions).find((i) => i.id === id);
    if (!intervention) return;

    // Check for medication duplicates
    const duplicate = checkMedicationDuplicate(intervention, session);
    if (duplicate.isDuplicate && duplicate.existingIntervention) {
      setDuplicateCheck({ interventionId: id, result: duplicate });
      return;
    }

    // No duplicate, proceed with intervention
    setSession(prev => {
      const withUndo = pushToUndoStack(prev, `Start: ${intervention.action}`);
      return startIntervention(withUndo, id);
    });
    analytics.trackInterventionStarted(intervention.action);
    
  };

  const handleMarkInterventionUnavailable = (id: string) => {
    const intervention = session.threats.flatMap((t) => t.interventions).find((i) => i.id === id);
    if (!intervention) return;
    setSession(prev => {
      const withUndo = pushToUndoStack(prev, `Unavailable: ${intervention.action}`);
      return markInterventionUnavailable(withUndo, id);
    });
    void analytics.trackResourceUnavailable(intervention.action);
    toast.warning(
      `⚠ Resource gap logged: "${intervention.action}" not available at this facility. Captured for Care Signal.`,
      { duration: 5000 }
    );
  };

  const handleConfirmDuplicateOverride = () => {
    if (!duplicateCheck) return;
    const intervention = session.threats
      .flatMap((t) => t.interventions)
      .find((i) => i.id === duplicateCheck.interventionId);
    if (!intervention) {
      setDuplicateCheck(null);
      return;
    }
    setSession(prev => {
      const withUndo = pushToUndoStack(prev, `Override duplicate: ${intervention.action}`);
      return startIntervention(withUndo, duplicateCheck.interventionId);
    });
    analytics.trackInterventionStarted(intervention.action);
    toast.warning('Duplicate intervention started - verify clinical decision');
    setDuplicateCheck(null);
  };

  const handleReturnToPrimarySurvey = () => {
    setSession(prev => returnToPrimarySurvey(prev));
    setReassessmentMode(null);
    // Track reassessment performed
    analytics.trackReassessmentPerformed();
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'numberInput' | 'numberInput2') => {
    const value = e.target.value;
    if (field === 'numberInput') {
      setNumberInput(value);
    } else {
      setNumberInput2(value);
    }
  };

  const handleCardiacArrest = () => {
    setSession(prev => {
      const withUndo = pushToUndoStack(prev, 'Cardiac arrest triggered');
      return triggerCardiacArrest(withUndo);
    });
    if (!timer.running) {
      timer.start();
    }
    setShowCPRClock(true);
    analytics.trackCardiacArrestTriggered();
  };

  const patientAgeMonthsForCpr = session.patientAge
    ? approximateAgeMonths(session.patientAge)
    : demographics.age
      ? approximateAgeMonths(demographics.age)
      : null;
  const cprDemographicsReady =
    weight != null && weight > 0 && patientAgeMonthsForCpr != null && patientAgeMonthsForCpr >= 0;
  const lifeSupportPack = cprDemographicsReady
    ? resolveLifeSupportPack(patientAgeMonthsForCpr)
    : null;

  const handleROSC = () => {
    setSession(prev => {
      const withUndo = pushToUndoStack(prev, 'ROSC achieved');
      return achieveROSC(withUndo);
    });
    // Track ROSC achieved
    analytics.trackROSCachieved();
  };

  const handleUpdatePatientInfo = () => {
    const newWeight = tempWeight ? parseFloat(tempWeight) : null;
    const newAge = tempAge || null;
    if (newWeight !== null || newAge !== null) {
      setSession(prev => updatePatientInfo(prev, newWeight, newAge));
      if (newWeight) setDemographics({ ...demographics, weight: tempWeight, age: tempAge || demographics.age });
      if (newAge) setDemographics({ ...demographics, age: tempAge, weight: tempWeight || demographics.weight });
    }
    setPatientInfoOpen(false);
  };

  const handleAckAlert = (alertId: string) => {
    setSession(prev => acknowledgeSafetyAlert(prev, alertId));
  };

  const recordSessionMutation = trpc.fellowship.recordResusGPSSession.useMutation({
    onSuccess: () => {
      void utils.fellowship.getProgress.invalidate();
    },
  });
  const recordCaseMutation = trpc.fellowship.recordResusGPSCase.useMutation({
    onSuccess: (data) => {
      if (data.casesByCondition) {
        setSavedCasesByCondition(data.casesByCondition);
      }
      void utils.fellowship.getProgress.invalidate();
      void utils.fellowship.getResusGPSCaseLog.invalidate();
    },
  });

  // Phase 5.2 — Server-side SAMPLE history sync
  const saveSampleHistoryMutation = trpc.sampleHistory.saveSampleHistory.useMutation();
  const { data: serverSampleHistory } = trpc.sampleHistory.getLastSampleHistory.useQuery(undefined, {
    enabled: session.phase === 'IDLE',
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!serverSampleHistory || preFillSample) return;
    setPreFillSample({
      signs: serverSampleHistory.signs ?? '',
      allergies: serverSampleHistory.allergies ?? '',
      medications: serverSampleHistory.medications ?? '',
      pastHistory: serverSampleHistory.pastHistory ?? '',
      lastMeal: serverSampleHistory.lastMeal ?? '',
      events: serverSampleHistory.events ?? '',
    });
  }, [serverSampleHistory, preFillSample]);

  const handleSaveSession = async () => {
    trackButtonClick('Save Session for Fellowship Credit');
    const fellowshipDiagnosis = resolveFellowshipDiagnosisFromSession(session);
    const primaryDiagnosis =
      fellowshipDiagnosis !== 'unknown'
        ? fellowshipDiagnosis
        : session.phase === 'CARDIAC_ARREST'
          ? 'cardiac_arrest_protocol'
          : session.activeThreat?.id || 'general_resus';
    
    const interactionCount = session.events.filter(e => 
      e.type === 'intervention_started' || e.type === 'intervention_completed' || e.type === 'reassessment'
    ).length;

    const reassessmentCount = session.events.filter(e => e.type === 'reassessment').length;
    
    try {
      // Step 1: Record the session (idempotent via session.id)
      const sessionResult = await recordSessionMutation.mutateAsync({
        sessionId: session.id,
        primaryDiagnosis,
        patientAgeMonths: approximateAgeMonths(session.patientAge),
        patientWeightKg: session.patientWeight || 0,
        isTrauma: session.isTrauma,
        isCardiacArrest: session.phase === 'CARDIAC_ARREST',
        interventionCount: interactionCount,
        reassessmentCount,
        durationSeconds: timer.elapsed,
        depthScore: session.depthScore ?? 0,
      });

      // Step 2: Record the case (idempotent via sessionId + caseNumber)
      // Include condition protocols used for Fellowship Pillar B credit
      const protocolInterventions = Object.entries(protocolsUsed).map(
        ([condId, { completed, total }]) => `protocol:${condId}:${completed}/${total}`
      );
      await recordCaseMutation.mutateAsync({
        sessionId: session.id,
        caseNumber: 1, // Currently ResusGPS v2 is single-case per session
        diagnosis: primaryDiagnosis,
        abcdeCompleted: session.phase !== 'QUICK_ASSESSMENT' && session.phase !== 'IDLE',
        interventions: [
          ...session.events
            .filter(e => e.type === 'intervention_started' || e.type === 'intervention_completed')
            .map(e => e.detail),
          ...protocolInterventions,
        ],
        reassessments: session.events
          .filter(e => e.type === 'reassessment')
          .map(e => e.detail),
        outcome: session.outcome ?? 'completed',
        depthScore: session.depthScore ?? 0,
      });

      await utils.fellowship.getProgress.refetch();
      setFellowshipSavedSessionId(session.id);
      
      if (sessionResult.success) {
        setShowFellowshipPillarBanner(true);
        const creditedLabel = getFellowshipMicrocourseResusConditionLabel(
          fellowshipDiagnosis !== 'unknown' ? fellowshipDiagnosis : primaryDiagnosis
        );
        const freshProgress = await utils.fellowship.getProgress.fetch();
        const conditionId =
          fellowshipDiagnosis !== 'unknown'
            ? fellowshipDiagnosis
            : normalizeToFellowshipResusConditionId(primaryDiagnosis);
        const countAfterSave = freshProgress?.resusGPSPillar?.casesByCondition?.[conditionId] ?? 0;
        toast.success(
          sessionResult.alreadyExists 
            ? `✅ Case already saved — ${creditedLabel}: ${countAfterSave}/3` 
            : `✅ Saved for fellowship — ${creditedLabel}: ${countAfterSave}/3`, 
          { duration: 4000 }
        );
        // Closed-loop accountability: invite Care Signal report after session save
        if (!sessionResult.alreadyExists) {
          setCareSignalPromptDiagnosis(primaryDiagnosis);
          setTimeout(() => setShowCareSignalPrompt(true), 1500);
        }
      }
    } catch (error) {
      console.error('Failed to save session:', error);
      toast.error('Could not save session for fellowship credit. Please retry.', { 
        duration: 5000,
        action: {
          label: 'Retry',
          onClick: () => handleSaveSession()
        }
      });
    }
  };

  const handleExport = () => {
    trackButtonClick('Complete Assessment');
    analytics.trackAssessmentCompleted(session.phase, timer.elapsed);
    void analytics.trackClinicalRecordExported(session.phase, timer.elapsed);

    // ── STEP 1: Generate and download the clinical record IMMEDIATELY.
    // This must NEVER be blocked by a network call. Bedside handoff is
    // time-critical; the provider cannot wait for a backend response.
    const text = exportClinicalRecord(session);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resus-record-${new Date().toISOString().slice(0, 16)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Clinical record downloaded', { duration: 2000 });

    // ── STEP 2: Fire-and-forget background sync for fellowship analytics.
    // Failures here are logged silently and never surface to the provider
    // during an active resuscitation.
    const interactionCount = session.events.filter(e =>
      e.type === 'intervention_started' || e.type === 'intervention_completed' || e.type === 'reassessment'
    ).length;

    void (async () => {
      try {
        const fellowshipDiagnosis = resolveFellowshipDiagnosisFromSession(session);
        const exportPathway =
          fellowshipDiagnosis !== 'unknown'
            ? fellowshipDiagnosis
            : session.phase === 'CARDIAC_ARREST'
              ? 'cardiac_arrest_protocol'
              : session.activeThreat?.id || 'general_resus';
        await recordSessionMutation.mutateAsync({
          sessionId: session.id,
          primaryDiagnosis: exportPathway,
          patientAgeMonths: approximateAgeMonths(session.patientAge),
          patientWeightKg: session.patientWeight || 0,
          isTrauma: session.isTrauma,
          isCardiacArrest: session.phase === 'CARDIAC_ARREST',
          interventionCount: interactionCount,
          reassessmentCount: session.events.filter(e => e.type === 'reassessment').length,
          durationSeconds: timer.elapsed,
          depthScore: session.depthScore ?? 0,
        });
        await recordCaseMutation.mutateAsync({
          sessionId: session.id,
          caseNumber: 1,
          diagnosis: exportPathway,
          abcdeCompleted: session.phase !== 'QUICK_ASSESSMENT' && session.phase !== 'IDLE',
          interventions: session.events
            .filter(e => e.type === 'intervention_started' || e.type === 'intervention_completed')
            .map(e => e.detail),
          reassessments: session.events
            .filter(e => e.type === 'reassessment')
            .map(e => e.detail),
          outcome: session.outcome ?? 'completed',
          depthScore: session.depthScore ?? 0,
        });
        void utils.fellowship.getProgress.invalidate();
        setShowFellowshipPillarBanner(true);
        console.info('[ResusGPS] Session synced for fellowship credit:', session.id);
      } catch (error) {
        // Silent failure — never interrupt the clinical workflow
        console.warn('[ResusGPS] Background sync failed (non-critical):', error);
      }
    })();
  };

  /** HI-CLIN-1: Same text as export — copy for handoff / EHR paste */
  const handleCopySummary = useCallback(async () => {
    trackButtonClick('Copy session summary');
    const text = exportClinicalRecord(session);
    void navigator.clipboard.writeText(text).then(
      () => toast.success('Session summary copied to clipboard'),
      () => toast.error('Could not copy — use Export or check permissions')
    );
  }, [session, trackButtonClick]);

  const handleCopyOnePager = useCallback(async () => {
    trackButtonClick('Copy one-pager summary');
    const text = exportSessionSummaryOnePager(session);
    void analytics.trackClinicalRecordExported(session.phase, timer.elapsed);
    void navigator.clipboard.writeText(text).then(
      () => toast.success('One-pager copied — paste into handoff or notes'),
      () => toast.error('Could not copy — check clipboard permissions')
    );
  }, [session, timer.elapsed, trackButtonClick, analytics]);

  const handleNewCase = () => {
    clearPersistedResusSession();
    // Optionally record the previous session before starting new one
    // (only if it had significant activity)
    if (session.events.length > 5) {
      const interactionCount = session.events.filter(e => 
        e.type === 'intervention_started' || e.type === 'intervention_completed' || e.type === 'reassessment'
      ).length;
      
      if (timer.elapsed > 60 && interactionCount >= 3) {
        const fellowshipDiagnosis = resolveFellowshipDiagnosisFromSession(session);
        const pathway =
          fellowshipDiagnosis !== 'unknown'
            ? fellowshipDiagnosis
            : session.phase === 'CARDIAC_ARREST'
              ? 'cardiac_arrest_protocol'
              : session.activeThreat?.id || 'general_resus';

        void recordSessionMutation
          .mutateAsync({
            sessionId: session.id,
            primaryDiagnosis: pathway,
            patientAgeMonths: approximateAgeMonths(session.patientAge),
            patientWeightKg: session.patientWeight || 0,
            isTrauma: session.isTrauma,
            isCardiacArrest: session.phase === 'CARDIAC_ARREST',
            interventionCount: interactionCount,
            reassessmentCount: session.events.filter((e) => e.type === 'reassessment').length,
            durationSeconds: timer.elapsed,
            depthScore: session.depthScore ?? 0,
          })
          .then(() => {
            toast.success('Previous session recorded for fellowship', { duration: 2000 });
          })
          .catch(() => {
            console.error('Auto-record failed');
          });
      }
    }
    
    // Phase 5.2 — Save SAMPLE history to server before resetting
    const sample = session.sampleHistory;
    const hasSampleData = Object.values(sample).some(v => v && String(v).trim().length > 0);
    if (hasSampleData) {
      saveSampleHistoryMutation.mutate({
        signs: sample.signs ?? '',
        allergies: sample.allergies ?? '',
        medications: sample.medications ?? '',
        pastHistory: sample.pastHistory ?? '',
        lastMeal: sample.lastMeal ?? '',
        events: sample.events ?? '',
        caseWeight: session.patientWeight ?? undefined,
        caseAge: session.patientAge ?? undefined,
      });
    }

    setSession(createSession(getWeightInKg(), demographics.age || null));
    setFellowshipSavedSessionId(null);
    setSavedCasesByCondition({});
    timer.reset();
    setNumberInput('');
    setNumberInput2('');
    setInterventionPanelOpen(false);
    setReassessmentMode(null);
  };

  // ── Resume dialog ──────────────────────────────────────────────────────────
  if (resumeCandidate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="rounded-xl border border-amber-400/60 bg-amber-50 dark:bg-amber-950/30 p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-base">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Unfinished case found
            </div>
            <p className="text-sm text-amber-950 dark:text-amber-100">
              A ResusGPS case was interrupted — likely a browser refresh during an active resuscitation.
              Do you want to resume it?
            </p>
            <div className="flex gap-3 pt-1">
              <Button
                className="flex-1"
                onClick={() => {
                  setSession(resumeCandidate);
                  setResumeCandidate(null);
                  if (resumeCandidate.phase !== 'IDLE') timer.start();
                }}
              >
                Resume case
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  clearPersistedResusSession();
                  setResumeCandidate(null);
                }}
              >
                Start fresh
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ClinicalUseDisclaimer />
      {/* Recording indicator */}
      {recordSessionMutation.isPending && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500/20 border-b border-blue-500/50 px-4 py-2 animate-pulse">
          <p className="text-xs text-blue-900 font-medium flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
            Recording session for fellowship tracking...
          </p>
        </div>
      )}

      <ResusGpsFellowshipPillarBanner
        open={showFellowshipPillarBanner}
        onDismiss={() => setShowFellowshipPillarBanner(false)}
      />
      
      {/* Top Bar */}
      <TopBar
        session={session}
        timer={timer}
        weight={weight}
        activeThreats={activeThreats}
        unackedAlerts={unackedAlerts}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenPatientInfo={() => {
          setTempWeight(session.patientWeight?.toString() || '');
          setTempAge(session.patientAge || '');
          setPatientInfoOpen(true);
        }}
        onOpenInterventions={() => setInterventionPanelOpen(true)}
        onCardiacArrest={handleCardiacArrest}
        onSaveSession={handleSaveSession}
        onExport={handleExport}
        onCopySummary={handleCopySummary}
        onNewCase={handleNewCase}
        onShowLog={() => setShowEventLog(true)}
        onOpenDocuments={() => setShowDocuments(true)}
        onOpenProtocols={() => setShowProtocols(true)}
        onOpenMCIBoard={() => setShowMCIBoard(true)}
      />

      {/* Safety Alerts Banner */}
      {unackedAlerts.length > 0 && (
        <div className="px-4 py-2 space-y-2">
          {unackedAlerts.map(alert => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                alert.severity === 'danger'
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm flex-1 font-medium">{alert.message}</p>
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0 text-xs"
                onClick={() => handleAckAlert(alert.id)}
              >
                Acknowledge
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <main className="container max-w-2xl pb-32 max-md:pb-40">
        {session.phase === 'IDLE' && (
          <IdleScreen
            weight={weight}
            age={demographics.age}
            onStart={handleStart}
            onOpenPatientInfo={() => {
              setTempWeight(demographics.weight || '');
              setTempAge(demographics.age || '');
              setPatientInfoOpen(true);
            }}
          />
        )}

        {session.phase === 'QUICK_ASSESSMENT' && (
          <QuickAssessmentScreen onAnswer={handleQuickAssessment} />
        )}

        {session.phase === 'PRIMARY_SURVEY' && (
          <PrimarySurveyScreen
            session={session}
            numberInput={numberInput}
            setNumberInput={setNumberInput}
            numberInput2={numberInput2}
            setNumberInput2={setNumberInput2}
            onAnswer={handleAnswer}
          />
        )}

        {session.phase === 'INTERVENTION' && (
          <InterventionScreen
            session={session}
            weight={weight}
            patientAge={session.patientAge}
            onComplete={handleCompleteIntervention}
            onStart={handleStartIntervention}
            onReturnToPrimary={handleReturnToPrimarySurvey}
            onOpenPanel={() => setInterventionPanelOpen(true)}
          />
        )}

        {session.phase === 'CARDIAC_ARREST' && showCPRClock && !cprDemographicsReady ? (
          <Card className="border-amber-500/40 bg-amber-500/10">
            <CardContent className="pt-6 pb-6 space-y-4">
              <p className="font-semibold text-foreground">Patient weight and age required</p>
              <p className="text-sm text-muted-foreground">
                CPR dosing and defibrillation energy need an actual weight and age band. Enter patient
                details before using the CPR clock (no default weight is applied).
              </p>
              <Button
                onClick={() => {
                  setTempWeight(demographics.weight || '');
                  setTempAge(demographics.age || session.patientAge || '');
                  setPatientInfoOpen(true);
                }}
              >
                Enter weight &amp; age
              </Button>
            </CardContent>
          </Card>
        ) : session.phase === 'CARDIAC_ARREST' && showCPRClock && cprDemographicsReady ? (
          <CPRClockUnified
            patientWeight={weight!}
            patientAgeMonths={patientAgeMonthsForCpr ?? undefined}
            lifeSupportPack={lifeSupportPack ?? undefined}
            externalElapsed={timer.elapsed}
            externalRunning={timer.running}
            autoStart
            onClose={() => setShowCPRClock(false)}
          />
        ) : session.phase === 'CARDIAC_ARREST' ? (
          <CardiacArrestScreen
            session={session}
            weight={weight}
            timer={timer}
            onComplete={handleCompleteIntervention}
            onROSC={handleROSC}
          />
        ) : null}

        {(session.phase === 'SECONDARY_SURVEY' || session.phase === 'DEFINITIVE_CARE' || session.phase === 'ONGOING') && (
          <PostPrimaryScreen
            session={session}
            setSession={setSession}
            diagnoses={diagnoses}
            onSaveSession={handleSaveSession}
            isSaving={recordSessionMutation.isPending || recordCaseMutation.isPending}
            fellowshipSavedSessionId={fellowshipSavedSessionId}
            savedCasesByCondition={savedCasesByCondition}
            onExport={handleExport}
            onCopySummary={handleCopySummary}
            onCopyOnePager={handleCopyOnePager}
            preFillSample={preFillSample}
            samplePreFillDismissed={samplePreFillDismissed}
            setSamplePreFillDismissed={setSamplePreFillDismissed}
          />
        )}
      </main>

      {/* Intervention Tracking Side Panel */}
      <Sheet open={interventionPanelOpen} onOpenChange={setInterventionPanelOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-background border-border overflow-y-auto">
          <SheetHeader className="pb-2">
            <SheetTitle className="flex items-center gap-2 text-foreground">
              <ListChecks className="h-5 w-5 text-primary" />
              Intervention Tracker
            </SheetTitle>
            <SheetDescription className="text-muted-foreground">
              {activeThreats.length} active threat{activeThreats.length !== 1 ? 's' : ''}
              {session.fluidTracker.bolusCount > 0 && (
                <> &bull; {session.fluidTracker.bolusCount} bolus{session.fluidTracker.bolusCount !== 1 ? 'es' : ''}
                  {session.patientWeight ? ` (${Math.round(session.fluidTracker.totalVolumePerKg)} mL/kg)` : ` (${Math.round(session.fluidTracker.totalVolumeMl)} mL)`}
                </>
              )}
              {session.fluidTracker.isFluidRefractory && (
                <span className="text-red-400 font-semibold"> &bull; FLUID-REFRACTORY</span>
              )}
            </SheetDescription>
          </SheetHeader>

          {/* Medication countdown timers for in-progress interventions */}
          <MedicationTimerStrip threats={session.threats} />

          <div className="space-y-4 mt-4">
            {activeThreats.map(threat => (
              <ThreatCard
                key={threat.id}
                threat={threat}
                weight={weight}
                expanded={expandedThreat === threat.id}
                onToggle={() => setExpandedThreat(expandedThreat === threat.id ? null : threat.id)}
                onComplete={handleCompleteIntervention}
                onStart={handleStartIntervention}
                onMarkUnavailable={handleMarkInterventionUnavailable}
                reassessmentMode={reassessmentMode}
                setReassessmentMode={setReassessmentMode}
                session={session}
                setSession={setSession}
              />
            ))}

            {activeThreats.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No active threats</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Patient Info Dialog */}
      <Dialog open={patientInfoOpen} onOpenChange={setPatientInfoOpen}>
        <DialogContent className="bg-background border-border flex flex-col max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Patient Information</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update weight and age at any point. Drug doses recalculate automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Weight (kg)</label>
              <Input
                type="number"
                placeholder="e.g., 18"
                value={tempWeight}
                onChange={e => setTempWeight(e.target.value)}
                className="bg-background text-foreground"
              />
              {tempWeight && (
                <p className="text-xs text-green-400 mt-1">
                  ✓ Weight set to {tempWeight} kg
                </p>
              )}
              {!tempWeight && (
                <p className="text-xs text-amber-400 mt-1">
                  Without weight, drug doses show per-kg calculations only
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Age</label>
              <AgeInput
                age={parseAgeString(tempAge) ?? { years: 0, months: 0, weeks: 0 }}
                onAgeChange={(age: StructuredAge) => {
                  const formattedAge = `${age.years}y ${age.months}m ${age.weeks}w`;
                  setTempAge(formattedAge);
                  // Auto-calculate weight from age if not manually set
                  if (!tempWeight) {
                    const calculatedWeight = estimateWeightFromAge(age);
                    if (calculatedWeight) {
                      setTempWeight(calculatedWeight.toString());
                      toast.success(`Weight auto-calculated: ${calculatedWeight} kg`);
                    }
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Weight auto-calculated from age (can be overridden)
              </p>
            </div>
          </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setPatientInfoOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleUpdatePatientInfo}
              className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
              disabled={!tempWeight && !tempAge}
            >
              <CheckCircle2 className="h-4 w-4" />
              Save Weight & Age
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Log Dialog */}
      <Dialog open={showEventLog} onOpenChange={setShowEventLog}>
        <DialogContent className="bg-background border-border max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Clinical Event Log</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Complete timeline of all clinical events
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh]">
            <div className="space-y-1 font-mono text-xs">
              {session.events.map((evt, i) => {
                const elapsed = Math.floor((evt.timestamp - session.startTime) / 1000);
                const time = formatTime(elapsed);
                return (
                  <div key={i} className="flex gap-2 py-1 border-b border-border/30">
                    <span className="text-muted-foreground shrink-0">{time}</span>
                    {evt.letter && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">
                        {evt.letter}
                      </Badge>
                    )}
                    <span className="text-foreground">{evt.detail}</span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCopySummary}>
              <Copy className="h-4 w-4 mr-2" /> Copy summary
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Intervention Panel Toggle */}
      {session.phase !== 'IDLE' && activeThreats.length > 0 && !interventionPanelOpen && (
        <button
          onClick={() => setInterventionPanelOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-primary text-primary-foreground px-2 py-6 rounded-l-lg shadow-lg flex flex-col items-center gap-1 hover:bg-primary/90 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-xs font-bold" style={{ writingMode: 'vertical-rl' }}>
            {activeThreats.length} Threat{activeThreats.length !== 1 ? 's' : ''}
          </span>
        </button>
      )}

      {/* Clinical Documents Panel */}
      <ExportDocumentsPanel
        open={showDocuments}
        onClose={() => setShowDocuments(false)}
        session={session}
      />

      {/* Condition Protocols Sheet */}
      <ConditionProtocolSheet
        open={showProtocols}
        onOpenChange={setShowProtocols}
        session={session}
        onProtocolProgress={(conditionId, completed, total) => {
          setProtocolsUsed(prev => ({ ...prev, [conditionId]: { completed, total } }));
        }}
      />

      {/* Multi-Patient Board (MCI mode) */}
      <MultiPatientBoard
        open={showMCIBoard}
        onOpenChange={setShowMCIBoard}
      />

      {/* PWA install prompt — only shown on idle screen, never during active case */}
      {session.phase === 'IDLE' && <PWAInstallBanner variant="banner" />}

      {/* Duplicate medication override dialog */}
      {duplicateCheck?.result.isDuplicate && (
        <DuplicateWarningDialog
          open
          result={duplicateCheck.result}
          onContinue={handleConfirmDuplicateOverride}
          onCancel={() => setDuplicateCheck(null)}
        />
      )}

      {/* Care Signal closed-loop prompt — shown after session save */}
      <CareSignalPostEventPrompt
        open={showCareSignalPrompt}
        onClose={() => setShowCareSignalPrompt(false)}
        diagnosis={careSignalPromptDiagnosis}
        outcome={session.outcome || 'survived'}
      />

      {session.phase !== 'IDLE' && (
        <div className="fixed bottom-16 left-0 right-0 z-40 px-2 pointer-events-none">
          <div className="max-w-lg mx-auto pointer-events-auto shadow-lg rounded-lg overflow-hidden border border-border">
            <MedicationTimerStrip threats={session.threats} />
          </div>
        </div>
      )}

      {session.phase === 'IDLE' && (
        <ClinicalContentSafetyFooter
          surfaceId="resus-gps"
          surface="resus_gps"
          compact
          className="max-w-2xl mx-auto border-t-0 bg-muted/30"
        />
      )}

      <BottomNav />
    </div>
  );
}

// ─── Top Bar Component ──────────────────────────────────────

function TopBar({
  session,
  timer,
  weight,
  activeThreats,
  unackedAlerts,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenPatientInfo,
  onOpenInterventions,
  onCardiacArrest,
  onSaveSession,
  onExport,
  onCopySummary,
  onNewCase,
  onShowLog,
  onOpenDocuments,
  onOpenProtocols,
  onOpenMCIBoard,
}: {
  session: ResusSession;
  timer: ReturnType<typeof useTimer>;
  weight: number | null;
  activeThreats: Threat[];
  unackedAlerts: typeof session.safetyAlerts;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenPatientInfo: () => void;
  onOpenInterventions: () => void;
  onCardiacArrest: () => void;
  onSaveSession: () => void;
  onExport: () => void;
  onCopySummary: () => void;
  onNewCase: () => void;
  onShowLog: () => void;
  onOpenDocuments: () => void;
  onOpenProtocols: () => void;
  onOpenMCIBoard: () => void;
}) {
  if (session.phase === 'IDLE') return null;

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
      <div className="container max-w-2xl flex items-center gap-2 py-2">
        {/* Timer */}
        <div className="flex items-center gap-1.5 text-sm font-mono">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <span className={timer.elapsed > 300 ? 'text-amber-400' : 'text-foreground'}>
            {formatTime(timer.elapsed)}
          </span>
        </div>

        <Separator orientation="vertical" className="h-5" />

        {/* Patient Info (clickable to edit) */}
        <button
          onClick={onOpenPatientInfo}
          className="flex items-center gap-1 text-sm hover:bg-accent/50 rounded px-1.5 py-0.5 transition-colors"
        >
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          {weight ? (
            <span className="text-foreground font-medium">{weight}kg</span>
          ) : (
            <span className="text-amber-400 font-medium">No weight</span>
          )}
          {session.patientAge && (
            <span className="text-muted-foreground text-xs ml-1">{session.patientAge}</span>
          )}
          <Pencil className="h-3 w-3 text-muted-foreground" />
        </button>

        {/* Fluid Tracker Badge */}
        {session.fluidTracker.bolusCount > 0 && (
          <Badge
            variant="outline"
            className={`text-[10px] shrink-0 ${
              session.fluidTracker.isFluidRefractory
                ? 'border-red-500/50 text-red-400 bg-red-500/10 animate-pulse'
                : session.fluidTracker.totalVolumePerKg >= 40
                ? 'border-amber-500/50 text-amber-400 bg-amber-500/10'
                : 'border-blue-500/50 text-blue-400 bg-blue-500/10'
            }`}
          >
            <Droplets className="h-3 w-3 mr-0.5" />
            {session.patientWeight ? `${Math.round(session.fluidTracker.totalVolumePerKg)}mL/kg` : `${Math.round(session.fluidTracker.totalVolumeMl)}mL`}
            {session.fluidTracker.isFluidRefractory && ' ⚠️'}
          </Badge>
        )}

        <div className="flex-1" />

        {/* Threat count badge */}
        {activeThreats.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="relative text-xs h-8 w-8 p-0"
            onClick={onOpenInterventions}
          >
            <Shield className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-0">
              {activeThreats.length}
            </Badge>
          </Button>
        )}

        {/* Cardiac Arrest button */}
        {session.phase !== 'CARDIAC_ARREST' && (session.phase as string) !== 'IDLE' && (
          <Button
            size="sm"
            variant="destructive"
            className="text-xs gap-1 h-8"
            onClick={onCardiacArrest}
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Arrest</span>
          </Button>
        )}

        {/* Undo button */}
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-8 w-8 p-0"
          onClick={() => {
            if (canUndo) {
              onUndo();
              toast.success('Undo: Last action reverted');
            } else {
              toast.info('Nothing to undo');
            }
          }}
          disabled={!canUndo}
          title="Undo last action (Cmd+Z)"
          aria-label="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-8 w-8 p-0"
          onClick={() => {
            if (canRedo) {
              onRedo();
              toast.success('Redo: Action restored');
            } else {
              toast.info('Nothing to redo');
            }
          }}
          disabled={!canRedo}
          title="Redo last undone action (Cmd+Shift+Z)"
          aria-label="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </Button>

        {/* Multi-Patient Board */}
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-8 w-8 p-0"
          onClick={onOpenMCIBoard}
          title="Multi-patient board (mass casualty)"
          aria-label="Multi-patient board"
        >
          <Users className="h-4 w-4" />
        </Button>
        {/* Condition Protocols */}
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-8 w-8 p-0"
          onClick={onOpenProtocols}
          title="Condition protocols (Septic Shock, Status Epilepticus, DKA, NRP, Anaphylaxis, Severe Asthma)"
          aria-label="Condition protocols"
        >
          <Layers className="h-4 w-4" />
        </Button>
        {/* Clinical Documents */}
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-8 w-8 p-0"
          onClick={onOpenDocuments}
          title="Generate clinical documents (Referral / Progress Note)"
          aria-label="Clinical documents"
        >
          <BookOpen className="h-4 w-4" />
        </Button>
        {/* Log */}
        <Button size="sm" variant="ghost" className="text-xs h-8 w-8 p-0" onClick={onShowLog}>
          <FileText className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-8 w-8 p-0"
          onClick={onCopySummary}
          title="Copy session summary"
          aria-label="Copy session summary"
        >
          <Copy className="h-4 w-4" />
        </Button>
        {/* Save Session for Fellowship Credit */}
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-8 px-2 border-green-500/50 text-green-400 hover:bg-green-500/10"
          onClick={onSaveSession}
          title="Save session for fellowship credit"
          aria-label="Save session"
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Save
        </Button>
        {/* New Case */}
        <Button size="sm" variant="ghost" className="text-xs h-8 w-8 p-0" onClick={onNewCase}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Idle Screen ────────────────────────────────────────────

function IdleScreen({
  weight,
  age,
  onStart,
  onOpenPatientInfo,
}: {
  weight: number | null;
  age: string;
  onStart: (isTrauma: boolean) => void;
  onOpenPatientInfo: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
          <Siren className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Paeds Resus</h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Systematic XABCDE assessment with real-time threat detection, weight-based dosing, and intervention tracking
        </p>
      </div>

      {/* Patient Info Card */}
      <Card className="w-full max-w-sm mb-6 bg-card border-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Patient Information</span>
            <Button size="sm" variant="ghost" onClick={onOpenPatientInfo} className="text-xs gap-1 h-7">
              <Pencil className="h-3 w-3" /> Edit
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-accent/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Weight</p>
              {weight ? (
                <p className="text-lg font-bold text-foreground">{weight} kg</p>
              ) : (
                <p className="text-sm text-amber-400">Not set</p>
              )}
            </div>
            <div className="bg-accent/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Age</p>
              {age ? (
                <p className="text-lg font-bold text-foreground">{age}</p>
              ) : (
                <p className="text-sm text-amber-400">Not set</p>
              )}
            </div>
          </div>
          {!weight && (
            <p className="text-xs text-amber-400/80 mt-2 text-center">
              You can start without weight — add it anytime during the case
            </p>
          )}
        </CardContent>
      </Card>

      {/* Start Buttons */}
      <div className="w-full max-w-sm space-y-3">
        <Button
          size="lg"
          className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2"
          onClick={() => onStart(false)}
        >
          <Activity className="h-5 w-5" />
          START ASSESSMENT
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full py-5 gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
          onClick={() => onStart(true)}
        >
          <AlertTriangle className="h-5 w-5" />
          TRAUMA ASSESSMENT (XABCDE)
        </Button>
      </div>
    </div>
  );
}

// ─── Quick Assessment Screen ────────────────────────────────

function QuickAssessmentScreen({ onAnswer }: { onAnswer: (a: 'sick' | 'not_sick') => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Quick Assessment</h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          3-second across-the-room assessment. Does this patient look sick?
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Appearance &bull; Work of Breathing &bull; Circulation to Skin
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <Button
          size="lg"
          variant="destructive"
          className="w-full py-8 text-xl font-bold"
          onClick={() => onAnswer('sick')}
        >
          <Siren className="h-6 w-6 mr-2" />
          SICK — Activate Emergency
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full py-6 text-lg"
          onClick={() => onAnswer('not_sick')}
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          NOT SICK — Routine Assessment
        </Button>
      </div>
    </div>
  );
}

// ─── Primary Survey Screen ──────────────────────────────────

function PrimarySurveyScreen({
  session,
  numberInput,
  setNumberInput,
  numberInput2,
  setNumberInput2,
  onAnswer,
}: {
  session: ResusSession;
  numberInput: string;
  setNumberInput: (v: string) => void;
  numberInput2: string;
  setNumberInput2: (v: string) => void;
  onAnswer: (q: AssessmentQuestion, answer: string, numVal?: number, numVal2?: number) => void;
}) {
  const questions = getCurrentQuestions(session);
  const answeredIds = getAnsweredQuestionIds(session);
  const unanswered = questions.filter(q => !answeredIds.includes(q.id));
  const question = unanswered[0];

  if (!question) return null;

  const letterConfig = LETTER_CONFIG[session.currentLetter];
  const letterOrder: ABCDELetter[] = session.isTrauma ? ['X', 'A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D', 'E'];
  const currentIdx = letterOrder.indexOf(session.currentLetter);
  const progress = ((currentIdx + (questions.length - unanswered.length) / questions.length) / letterOrder.length) * 100;

  return (
    <div className="py-6">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          {letterOrder.map((letter, i) => {
            const config = LETTER_CONFIG[letter];
            const isActive = letter === session.currentLetter;
            const isDone = i < currentIdx;
            return (
              <div
                key={letter}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all ${
                  isActive
                    ? `${config.bgColor} ${config.color} ring-1 ring-current`
                    : isDone
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-3 w-3" /> : null}
                {letter}
              </div>
            );
          })}
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Current Letter Header */}
      <div className={`flex items-center gap-3 mb-6 p-4 rounded-xl ${letterConfig.bgColor}`}>
        <div className={letterConfig.color}>{letterConfig.icon}</div>
        <div>
          <h2 className={`text-xl font-bold ${letterConfig.color}`}>{letterConfig.label}</h2>
          <p className="text-xs text-muted-foreground">
            Question {questions.length - unanswered.length + 1} of {questions.length}
          </p>
        </div>
      </div>

      {/* Question */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6 pb-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">{question.text}</h3>

          {question.inputType === 'select' && question.options && (
            <div className="space-y-3">
              {question.options.map(option => (
                <Button
                  key={option.value}
                  variant="outline"
                  className={`w-full justify-start text-left py-4 h-auto whitespace-normal ${
                    option.severity === 'critical'
                      ? 'border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50'
                      : option.severity === 'urgent'
                      ? 'border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => onAnswer(question, option.value)}
                >
                  <span className="mr-2 text-lg">{option.icon}</span>
                  <span className="text-sm">{option.label}</span>
                </Button>
              ))}
            </div>
          )}

          {question.inputType === 'number' && question.numberConfig && (
            <NumberInput
              config={question.numberConfig}
              value={numberInput}
              onChange={setNumberInput}
              session={session}
              onSubmit={(val) => {
                const interp = question.numberConfig!.interpret(val, session);
                onAnswer(question, interp.label, val);
              }}
            />
          )}

          {question.inputType === 'number_pair' && question.numberPairConfig && (
            <NumberPairInput
              config={question.numberPairConfig}
              value1={numberInput}
              value2={numberInput2}
              onChange1={setNumberInput}
              onChange2={setNumberInput2}
              session={session}
              onSubmit={(v1, v2) => {
                const interp = question.numberPairConfig!.interpret(v1, v2, session);
                onAnswer(question, interp.label, v1, v2);
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Number Input Component ─────────────────────────────────

function NumberInput({
  config,
  value,
  onChange,
  session,
  onSubmit,
}: {
  config: NonNullable<AssessmentQuestion['numberConfig']>;
  value: string;
  onChange: (v: string) => void;
  session: ResusSession;
  onSubmit: (val: number) => void;
}) {
  const numVal = parseFloat(value);
  const isValid = !isNaN(numVal) && numVal >= config.min && numVal <= config.max;

  return (
    <div className="space-y-4">
      {/* Quick picks */}
      {config.quickPicks && (
        <div className="flex flex-wrap gap-2">
          {config.quickPicks.map(qp => (
            <Button
              key={qp.value}
              size="sm"
              variant={value === qp.value.toString() ? 'default' : 'outline'}
              className="text-sm"
              onClick={() => onChange(qp.value.toString())}
            >
              {qp.label}
            </Button>
          ))}
        </div>
      )}

      {/* Number input */}
      <div className="flex items-center gap-3">
        <Input
          type="number"
          inputMode="decimal"
          placeholder={config.placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="text-lg bg-background text-foreground"
          min={config.min}
          max={config.max}
          step={config.step}
          autoFocus
        />
        <span className="text-sm text-muted-foreground font-medium shrink-0">
          {config.unit}
        </span>
      </div>

      {/* Live interpretation */}
      {isValid && (
        <div className="mt-2">
          {(() => {
            const interp = config.interpret(numVal, session);
            return (
              <Badge
                variant="outline"
                className={`text-sm ${
                  interp.severity === 'critical'
                    ? 'border-red-500/50 text-red-400 bg-red-500/10'
                    : interp.severity === 'urgent'
                    ? 'border-amber-500/50 text-amber-400 bg-amber-500/10'
                    : 'border-green-500/50 text-green-400 bg-green-500/10'
                }`}
              >
                {interp.label}
              </Badge>
            );
          })()}
        </div>
      )}

      <Button
        className="w-full py-4"
        disabled={!isValid}
        onClick={() => onSubmit(numVal)}
      >
        Confirm {isValid ? `${value} ${config.unit}` : ''}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

// ─── Number Pair Input Component ────────────────────────────

function NumberPairInput({
  config,
  value1,
  value2,
  onChange1,
  onChange2,
  session,
  onSubmit,
}: {
  config: NonNullable<AssessmentQuestion['numberPairConfig']>;
  value1: string;
  value2: string;
  onChange1: (v: string) => void;
  onChange2: (v: string) => void;
  session: ResusSession;
  onSubmit: (v1: number, v2: number) => void;
}) {
  const v1 = parseFloat(value1);
  const v2 = parseFloat(value2);
  const isValid = !isNaN(v1) && !isNaN(v2);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{config.label1}</label>
          <Input
            type="number"
            inputMode="numeric"
            placeholder={config.placeholder1}
            value={value1}
            onChange={e => onChange1(e.target.value)}
            className="text-lg bg-background text-foreground"
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{config.label2}</label>
          <Input
            type="number"
            inputMode="numeric"
            placeholder={config.placeholder2}
            value={value2}
            onChange={e => onChange2(e.target.value)}
            className="text-lg bg-background text-foreground"
          />
        </div>
      </div>

      {/* Live interpretation */}
      {isValid && (
        <div>
          {(() => {
            const interp = config.interpret(v1, v2, session);
            return (
              <Badge
                variant="outline"
                className={`text-sm ${
                  interp.severity === 'critical'
                    ? 'border-red-500/50 text-red-400 bg-red-500/10'
                    : interp.severity === 'urgent'
                    ? 'border-amber-500/50 text-amber-400 bg-amber-500/10'
                    : 'border-green-500/50 text-green-400 bg-green-500/10'
                }`}
              >
                {interp.label}
              </Badge>
            );
          })()}
        </div>
      )}

      <Button
        className="w-full py-4"
        disabled={!isValid}
        onClick={() => onSubmit(v1, v2)}
      >
        Confirm {isValid ? `${value1}/${value2} ${config.unit}` : ''}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

/** Shared dose rationale for intervention rows (age-aware, weight required). */
function InterventionDoseRationale({
  action,
  dose,
  weight,
  patientAge,
  className = 'mt-2 pt-2 border-t border-border/50',
}: {
  action: string;
  dose: NonNullable<Intervention['dose']>;
  weight: number | null;
  patientAge: string | null;
  className?: string;
}) {
  if (weight == null) return null;
  const rationale = getDoseRationale(action, weight, getAgeCategory(patientAge), dose.route);
  if (!rationale) return null;
  return (
    <div className={className}>
      <DoseRationaleCard rationale={rationale} />
    </div>
  );
}

// ─── Intervention Screen ────────────────────────────────────

function InterventionScreen({
  session,
  weight,
  patientAge,
  onComplete,
  onStart,
  onReturnToPrimary,
  onOpenPanel,
}: {
  session: ResusSession;
  weight: number | null;
  patientAge: string | null;
  onComplete: (id: string) => void;
  onStart: (id: string) => void;
  onReturnToPrimary: () => void;
  onOpenPanel: () => void;
}) {
  const criticalPending = getAllPendingCritical(session);
  const activeThreats = getActiveThreats(session);

  return (
    <div className="py-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-red-500/20 p-2 rounded-lg">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Interventions Required</h2>
          <p className="text-sm text-muted-foreground">
            {criticalPending.length} critical action{criticalPending.length !== 1 ? 's' : ''} pending
          </p>
        </div>
      </div>

      {/* Critical interventions first */}
      <div className="space-y-3 mb-6">
        {criticalPending.map(({ threat, intervention }) => (
          <Card key={intervention.id} className="bg-card border-red-500/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="shrink-0 text-xs border-red-500/30 text-red-400 bg-red-500/10">
                  {threat.letter}
                </Badge>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{intervention.action}</p>
                  {intervention.detail && (
                    <p className="text-xs text-muted-foreground mt-1">{intervention.detail}</p>
                  )}
                  {intervention.dose && (
                    <div className="mt-2 bg-primary/10 rounded p-2">
                      <p className="text-sm font-medium text-primary">
                        {calcDose(intervention.dose, weight)}
                      </p>
                      {intervention.dose.preparation && (
                        <p className="text-xs text-muted-foreground mt-1">{intervention.dose.preparation}</p>
                      )}
                      <InterventionDoseRationale
                        action={intervention.action}
                        dose={intervention.dose}
                        weight={weight}
                        patientAge={patientAge}
                        className="mt-2 pt-2 border-t border-primary/20"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {intervention.status === 'pending' && (
                  <>
                    <Button size="sm" className="flex-1" onClick={() => onStart(intervention.id)}>
                      <Play className="h-3 w-3 mr-1" /> Start
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onComplete(intervention.id)}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                    </Button>
                  </>
                )}
                {intervention.status === 'in_progress' && (
                  <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => onComplete(intervention.id)}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Complete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full py-4"
          onClick={onOpenPanel}
        >
          <ListChecks className="h-4 w-4 mr-2" />
          View All Interventions ({activeThreats.reduce((sum, t) => sum + t.interventions.length, 0)})
        </Button>
        <Button
          className="w-full py-4"
          onClick={onReturnToPrimary}
        >
          Continue Primary Survey
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ─── Cardiac Arrest Screen ──────────────────────────────────

function CardiacArrestScreen({
  session,
  weight,
  timer,
  onComplete,
  onROSC,
}: {
  session: ResusSession;
  weight: number | null;
  timer: ReturnType<typeof useTimer>;
  onComplete: (id: string) => void;
  onROSC: () => void;
}) {
  const cycleProgress = ((timer.elapsed % 120) / 120) * 100;
  const arrestThreat = session.threats.find(t => t.id === 'cardiac_arrest');

  return (
    <div className="py-6">
      {/* CPR Timer */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center mb-6">
        <h2 className="text-2xl font-bold text-red-400 mb-1">CARDIAC ARREST</h2>
        <p className="text-sm text-red-300/80 mb-4">Push Hard &bull; Push Fast &bull; Minimize Interruptions</p>
        
        <div className="text-6xl font-mono font-bold text-foreground mb-2">
          {formatTime(timer.elapsed)}
        </div>
        
        <div className="flex items-center justify-center gap-4 mb-4">
          <Badge variant="outline" className="text-sm border-red-500/30 text-red-400">
            CPR Cycle: {Math.floor(timer.elapsed / 120) + 1}
          </Badge>
          <Badge variant="outline" className="text-sm border-amber-500/30 text-amber-400">
            {120 - (timer.elapsed % 120)}s to rhythm check
          </Badge>
        </div>

        <Progress value={cycleProgress} className="h-2 mb-4" />

        {cycleProgress > 85 && (
          <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3 mb-4 animate-pulse">
            <p className="text-amber-300 font-bold">PREPARE FOR RHYTHM CHECK</p>
          </div>
        )}
      </div>

      {/* Interventions */}
      {arrestThreat && (
        <div className="space-y-3 mb-6">
          {arrestThreat.interventions.map(intervention => (
            <Card key={intervention.id} className={`bg-card ${intervention.status === 'completed' ? 'opacity-50' : 'border-red-500/20'}`}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {intervention.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{intervention.action}</p>
                    {intervention.dose && (
                      <>
                        <p className="text-sm text-primary mt-1">{calcDose(intervention.dose, weight)}</p>
                        <InterventionDoseRationale
                          action={intervention.action}
                          dose={intervention.dose}
                          weight={weight}
                          patientAge={session.patientAge}
                          className="mt-2 pt-2 border-t border-border/50"
                        />
                      </>
                    )}
                    {intervention.detail && (
                      <p className="text-xs text-muted-foreground mt-1">{intervention.detail}</p>
                    )}
                  </div>
                  {intervention.status !== 'completed' && (
                    <Button size="sm" variant="outline" onClick={() => onComplete(intervention.id)}>
                      Done
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ROSC Button */}
      <Button
        size="lg"
        className="w-full py-6 bg-green-600 hover:bg-green-700 text-white text-lg font-bold"
        onClick={onROSC}
      >
        <Heart className="h-5 w-5 mr-2" />
        ROSC ACHIEVED
      </Button>
    </div>
  );
}

// ─── Post-Primary Screen ────────────────────────────────────

function PostPrimaryScreen({
  session,
  setSession,
  diagnoses,
  onSaveSession,
  isSaving,
  fellowshipSavedSessionId,
  savedCasesByCondition,
  onExport,
  onCopySummary,
  onCopyOnePager,
  preFillSample,
  samplePreFillDismissed,
  setSamplePreFillDismissed,
}: {
  session: ResusSession;
  setSession: (s: ResusSession) => void;
  diagnoses: DiagnosisSuggestion[];
  onSaveSession: () => void;
  isSaving: boolean;
  fellowshipSavedSessionId: string | null;
  savedCasesByCondition: Record<string, number>;
  onExport: () => void;
  onCopySummary: () => void;
  onCopyOnePager: () => void;
  preFillSample: PersistedSampleHistory | null;
  samplePreFillDismissed: boolean;
  setSamplePreFillDismissed: (v: boolean) => void;
}) {
  const { trackButtonClick } = useAnalytics('ResusGPS');
  const resusAnalytics = useResusAnalytics();
  const { data: fellowshipProgress, refetch: refetchFellowshipProgress } = trpc.fellowship.getProgress.useQuery(undefined, {
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const liveCasesByCondition = fellowshipProgress?.resusGPSPillar?.casesByCondition ?? {};
  const casesByCondition =
    Object.keys(savedCasesByCondition).length > 0 ? savedCasesByCondition : liveCasesByCondition;
  const isSavedThisSession = fellowshipSavedSessionId === session.id;
  const fellowshipConditionTotal = getFellowshipMicrocourseResusConditionCount();
  const resolvedThisCase = resolveFellowshipDiagnosisFromSession(session);

  const workingDiagnosisLabels = useMemo(() => {
    const raw = [
      session.definitiveDiagnosis,
      ...(session.concurrentDiagnoses ?? []),
    ].filter(Boolean) as string[];
    return raw.map((d) => ({
      raw: d,
      fellowshipId: normalizeToFellowshipResusConditionId(d),
      label: getFellowshipMicrocourseResusConditionLabel(normalizeToFellowshipResusConditionId(d)),
    }));
  }, [session.definitiveDiagnosis, session.concurrentDiagnoses]);

  const suggestedForFellowship = useMemo(
    () =>
      diagnoses.map((dx) => ({
        ...dx,
        fellowshipId: normalizeToFellowshipResusConditionId(dx.diagnosis),
        fellowshipLabel: getFellowshipMicrocourseResusConditionLabel(
          normalizeToFellowshipResusConditionId(dx.diagnosis)
        ),
      })),
    [diagnoses]
  );

  const primaryFellowshipId = normalizeToFellowshipResusConditionId(session.definitiveDiagnosis);

  const threatFellowshipSuggestions = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; label: string; source: string }[] = [];
    for (const threat of session.threats) {
      const id = normalizeToFellowshipResusConditionId(threat.id || threat.name);
      if (!isFellowshipMicrocourseResusCondition(id) || seen.has(id)) continue;
      seen.add(id);
      out.push({
        id,
        label: getFellowshipMicrocourseResusConditionLabel(id),
        source: threat.name,
      });
    }
    return out;
  }, [session.threats]);

  return (
    <div className="py-6 space-y-6">
      {/* Vital Signs Summary */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-foreground">Documented Vital Signs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {session.vitalSigns.hr !== undefined && (
              <VitalBadge label="HR" value={`${session.vitalSigns.hr}`} unit="bpm" />
            )}
            {session.vitalSigns.rr !== undefined && (
              <VitalBadge label="RR" value={`${session.vitalSigns.rr}`} unit="/min" />
            )}
            {session.vitalSigns.spo2 !== undefined && (
              <VitalBadge label="SpO2" value={`${session.vitalSigns.spo2}`} unit="%" />
            )}
            {session.vitalSigns.sbp !== undefined && session.vitalSigns.dbp !== undefined && (
              <VitalBadge label="BP" value={`${session.vitalSigns.sbp}/${session.vitalSigns.dbp}`} unit="mmHg" />
            )}
            {session.vitalSigns.temp !== undefined && (
              <VitalBadge label="Temp" value={`${session.vitalSigns.temp}`} unit="C" />
            )}
            {session.vitalSigns.glucose !== undefined && (
              <VitalBadge label="Glucose" value={`${session.vitalSigns.glucose}`} unit="mmol/L" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documented diagnoses (primary + co-diagnoses) */}
      {(session.definitiveDiagnosis || (session.concurrentDiagnoses?.length ?? 0) > 0) && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-foreground flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Working diagnoses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {session.definitiveDiagnosis && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground text-xs uppercase tracking-wide">Primary</span>
                <Badge variant="default" className="text-xs">
                  {session.definitiveDiagnosis}
                </Badge>
              </div>
            )}
            {(session.concurrentDiagnoses?.length ?? 0) > 0 && (
              <div className="flex flex-wrap items-start gap-2">
                <span className="text-muted-foreground text-xs uppercase tracking-wide shrink-0 mt-1">
                  Co-diagnoses
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {session.concurrentDiagnoses!.map((dx) => (
                    <Badge key={dx} variant="secondary" className="text-xs gap-1 pr-1">
                      {dx}
                      <button
                        type="button"
                        className="rounded-full p-0.5 hover:bg-background/80"
                        aria-label={`Remove ${dx}`}
                        onClick={() => setSession(removeConcurrentDiagnosis(session, dx))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Differential diagnoses — always shown so fellows can pick primary for Pillar B */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Differential diagnoses
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Set a <strong className="font-medium text-foreground">primary diagnosis</strong> so this case counts toward
            the matching fellowship micro-course condition (≥3 cases each across {fellowshipConditionTotal}{' '}
            conditions).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {diagnoses.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Suggested from case findings
              </p>
              {diagnoses.map((dx, i) => (
                <div key={i} className="space-y-1">
                  {suggestedForFellowship[i]?.fellowshipId &&
                    isFellowshipMicrocourseResusCondition(suggestedForFellowship[i].fellowshipId) && (
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                        Fellowship: {suggestedForFellowship[i].fellowshipLabel} ·{' '}
                        {(casesByCondition[suggestedForFellowship[i].fellowshipId] ?? 0)}/3 cases logged
                      </p>
                    )}
                  <DiagnosisCard
                    key={i}
                    diagnosis={{
                      id: `suggested-${i}`,
                      condition: dx.diagnosis,
                      confidence:
                        dx.confidence === 'high'
                          ? 'likely'
                          : dx.confidence === 'moderate'
                            ? 'consider'
                            : 'consider',
                      findings: dx.supportingFindings,
                      interventions: [dx.protocol],
                      timestamp: Date.now(),
                      resolved: false,
                    }}
                    pickMode
                    onSetPrimary={() => {
                      trackButtonClick('Set primary diagnosis', { diagnosis: dx.diagnosis, protocol: dx.protocol });
                      void resusAnalytics.trackDiagnosisSelected(dx.diagnosis);
                      setSession(setDefinitiveDiagnosis(session, dx.diagnosis as never));
                    }}
                    onAddCoDiagnosis={() => {
                      trackButtonClick('Add co-diagnosis', { diagnosis: dx.diagnosis, protocol: dx.protocol });
                      void resusAnalytics.trackDiagnosisSelected(dx.diagnosis);
                      setSession(addConcurrentDiagnosis(session, dx.diagnosis));
                    }}
                    onResolve={() => {
                      trackButtonClick('View Protocol', { diagnosis: dx.diagnosis, protocol: dx.protocol });
                      void resusAnalytics.trackDiagnosisSelected(dx.diagnosis);
                      setSession(setDefinitiveDiagnosis(session, dx.diagnosis as never));
                    }}
                    onRemove={() => {}}
                  />
                </div>
              ))}
            </div>
          )}

          {threatFellowshipSuggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                From threats identified in this case
              </p>
              {threatFellowshipSuggestions.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Threat: {item.source} · {(casesByCondition[item.id] ?? 0)}/3 cases logged
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={primaryFellowshipId === item.id ? 'default' : 'outline'}
                    onClick={() => {
                      trackButtonClick('Set primary diagnosis from threat', { diagnosis: item.id });
                      setSession(setDefinitiveDiagnosis(session, item.id));
                    }}
                  >
                    {primaryFellowshipId === item.id ? 'Primary' : 'Set primary'}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Fellowship micro-course conditions
            </p>
            <p className="text-[11px] text-muted-foreground">
              Choose the condition that best matches this case. Each requires at least 3 saved ResusGPS cases for
              fellowship credit.
            </p>
            <div className="space-y-2 max-h-[min(24rem,50vh)] overflow-y-auto pr-1">
              {FELLOWSHIP_MICROCOURSE_RESUS_CONDITIONS.map((cond) => {
                const isPrimary = primaryFellowshipId === cond.id;
                const isCoDiagnosis = (session.concurrentDiagnoses ?? []).some(
                  (d) => normalizeToFellowshipResusConditionId(d) === cond.id
                );
                return (
                  <div
                    key={cond.id}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
                      isPrimary
                        ? 'border-emerald-500/60 bg-emerald-50/80 dark:bg-emerald-950/30'
                        : 'border-border'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{cond.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {(casesByCondition[cond.id] ?? 0)}/3 cases logged
                        {isCoDiagnosis && !isPrimary ? ' · co-diagnosis' : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      {!isPrimary && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs"
                          onClick={() => {
                            trackButtonClick('Add co-diagnosis from catalog', { diagnosis: cond.id });
                            setSession(addConcurrentDiagnosis(session, cond.id));
                          }}
                        >
                          + Co
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant={isPrimary ? 'default' : 'outline'}
                        className={isPrimary ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                        onClick={() => {
                          trackButtonClick('Set primary diagnosis from catalog', { diagnosis: cond.id });
                          setSession(setDefinitiveDiagnosis(session, cond.id));
                        }}
                      >
                        {isPrimary ? 'Primary' : 'Set primary'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SAMPLE History */}
      {session.phase === 'SECONDARY_SURVEY' && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-foreground">SAMPLE History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Pre-fill banner — shown when a previous session had SAMPLE data */}
            {preFillSample && !samplePreFillDismissed && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-blue-300">Pre-fill from previous case?</p>
                  <p className="text-[11px] text-blue-400/80 mt-0.5">
                    Allergies, medications, and history from your last case are available.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-blue-500/40 text-blue-300 hover:bg-blue-500/10"
                      onClick={() => {
                        // Apply pre-fill to all non-empty fields
                        let updated = session;
                        const fields = ['signs', 'allergies', 'medications', 'pastHistory', 'lastMeal', 'events'] as const;
                        fields.forEach(f => {
                          const val = preFillSample[f];
                          if (val && !session.sampleHistory[f]) {
                            updated = updateSAMPLE(updated, f, val);
                          }
                        });
                        setSession(updated);
                        setSamplePreFillDismissed(true);
                      }}
                    >
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => {
                        setSamplePreFillDismissed(true);
                        clearSampleHistory();
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {(['signs', 'allergies', 'medications', 'pastHistory', 'lastMeal', 'events'] as const).map(field => {
              const labels: Record<string, string> = {
                signs: 'S — Signs & Symptoms',
                allergies: 'A — Allergies',
                medications: 'M — Medications',
                pastHistory: 'P — Past Medical History',
                lastMeal: 'L — Last Meal / Intake',
                events: 'E — Events Leading to This',
              };
              return (
                <div key={field}>
                  <label className="text-xs font-medium text-muted-foreground">{labels[field]}</label>
                  <Input
                    placeholder={preFillSample?.[field] ? `Previous: ${preFillSample[field]}` : `Enter ${field}...`}
                    value={session.sampleHistory[field] || ''}
                    onChange={e => {
                      const updated = updateSAMPLE(session, field, e.target.value);
                      setSession(updated);
                      // Persist SAMPLE to IndexedDB on every change
                      saveSampleHistory(updated.sampleHistory as PersistedSampleHistory);
                    }}
                    className="mt-1 bg-background text-foreground"
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Threats Summary */}
      {session.threats.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-foreground">Threats Identified ({session.threats.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {session.threats.map(t => (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="text-[10px] shrink-0">{t.letter}</Badge>
                <span className="text-foreground">{t.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {t.interventions.filter(i => i.status === 'completed').length}/{t.interventions.length} done
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Fellowship save — primary action on the last screen */}
      <Card className="border-2 border-emerald-500/50 bg-emerald-50/80 dark:bg-emerald-950/30 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 shrink-0" />
            Save for Fellowship credit (Pillar B)
          </CardTitle>
          <p className="text-sm text-emerald-900/90 dark:text-emerald-100/90 leading-relaxed">
            Paeds Resus Fellowship requires <strong>≥3 ResusGPS cases per condition</strong> covered in the
            fellowship micro-course catalog ({fellowshipConditionTotal} conditions). Export alone does not
            record fellowship progress — use Save below.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {resolvedThisCase !== 'unknown' ? (
            <div className="rounded-lg border border-emerald-500/30 bg-white/70 dark:bg-emerald-950/40 px-3 py-2 text-sm">
              {isSavedThisSession ? (
                <>
                  <CheckCircle2 className="inline h-4 w-4 text-emerald-600 mr-1 -mt-0.5" />
                  <span className="font-semibold text-emerald-800 dark:text-emerald-200">Saved for fellowship</span>
                  <span className="text-muted-foreground"> — </span>
                  <span className="font-semibold text-foreground">
                    {getFellowshipMicrocourseResusConditionLabel(resolvedThisCase)}
                  </span>
                  <span className="text-muted-foreground">
                    {' '}
                    ({(casesByCondition[resolvedThisCase] ?? 0)}/3 cases logged)
                  </span>
                </>
              ) : (
                <>
                  <span className="text-muted-foreground">This case will credit: </span>
                  <span className="font-semibold text-foreground">
                    {getFellowshipMicrocourseResusConditionLabel(resolvedThisCase)}
                  </span>
                  <span className="text-muted-foreground">
                    {' '}
                    (currently {(casesByCondition[resolvedThisCase] ?? 0)}/3 — will be{' '}
                    {(casesByCondition[resolvedThisCase] ?? 0) + 1}/3 after save)
                  </span>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
              Select a <strong>primary diagnosis</strong> in the differential diagnoses section above so this case
              maps to a fellowship micro-course condition.
            </div>
          )}

          {workingDiagnosisLabels.length > 0 && (
            <ul className="text-xs text-muted-foreground space-y-1">
              {workingDiagnosisLabels.map((d) => (
                <li key={d.raw}>
                  {d.label}: {(casesByCondition[d.fellowshipId] ?? 0)}/3 cases logged
                </li>
              ))}
            </ul>
          )}

          <Button
            type="button"
            size="lg"
            className="w-full py-6 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
            onClick={async () => {
              await onSaveSession();
              void refetchFellowshipProgress();
            }}
            disabled={isSaving || isSavedThisSession}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Saving for fellowship…
              </>
            ) : isSavedThisSession ? (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Saved for Fellowship credit
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Save for Fellowship credit
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Export / copy (HI-CLIN-1) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button className="w-full py-4" variant="secondary" onClick={onCopyOnePager}>
          <Copy className="h-4 w-4 mr-2" />
          Copy one-pager
        </Button>
        <Button className="w-full py-4" variant="outline" onClick={onCopySummary}>
          <Copy className="h-4 w-4 mr-2" />
          Full record
        </Button>
        <Button className="w-full py-4" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Download .txt
        </Button>
      </div>
    </div>
  );
}

// ─── Threat Card (for side panel) ───────────────────────────

function ThreatCard({
  threat,
  weight,
  expanded,
  onToggle,
  onComplete,
  onStart,
  onMarkUnavailable,
  reassessmentMode,
  setReassessmentMode,
  session,
  setSession,
}: {
  threat: Threat;
  weight: number | null;
  expanded: boolean;
  onToggle: () => void;
  onComplete: (id: string) => void;
  onStart: (id: string) => void;
  onMarkUnavailable: (id: string) => void;
  reassessmentMode: { interventionId: string; checkIndex: number } | null;
  setReassessmentMode: (v: { interventionId: string; checkIndex: number } | null) => void;
  session: ResusSession;
  setSession: (s: ResusSession) => void;
}) {
  const completed = threat.interventions.filter(i => i.status === 'completed').length;
  const total = threat.interventions.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <Card className={`bg-card border-border ${threat.severity === 'critical' ? 'border-red-500/20' : ''}`}>
      <CardContent className="pt-3 pb-3">
        {/* Header */}
        <button onClick={onToggle} className="w-full flex items-center gap-3 text-left">
          <Badge
            variant="outline"
            className={`shrink-0 ${
              threat.severity === 'critical'
                ? 'border-red-500/50 text-red-400 bg-red-500/10'
                : 'border-amber-500/50 text-amber-400 bg-amber-500/10'
            }`}
          >
            {threat.letter}
          </Badge>
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">{threat.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={progress} className="h-1 flex-1" />
              <span className="text-xs text-muted-foreground">{completed}/{total}</span>
            </div>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {/* Expanded interventions */}
        {expanded && (
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            {threat.interventions.map(intervention => (
              <div key={intervention.id}>
                <div className={`flex items-start gap-2 p-2 rounded-lg ${
                  intervention.status === 'completed'
                    ? 'bg-green-500/5 opacity-60'
                    : intervention.status === 'in_progress'
                    ? 'bg-amber-500/10'
                    : 'bg-accent/20'
                }`}>
                  <div className="mt-0.5 shrink-0">
                    {intervention.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : intervention.status === 'in_progress' ? (
                      <Play className="h-4 w-4 text-amber-400" />
                    ) : intervention.status === 'skipped' ? (
                      <AlertCircle className="h-4 w-4 text-orange-400" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">{intervention.action}</p>
                    {intervention.dose && (
                      <p className="text-xs text-primary mt-0.5">{calcDose(intervention.dose, weight)}</p>
                    )}
                    {intervention.dose?.preparation && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{intervention.dose.preparation}</p>
                    )}
                    {intervention.detail && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{intervention.detail}</p>
                    )}
                    {/* Dose Rationale */}
                    {intervention.dose && (
                      <InterventionDoseRationale
                        action={intervention.action}
                        dose={intervention.dose}
                        weight={weight}
                        patientAge={session.patientAge}
                      />
                    )}

                    {/* Status actions */}
                    {intervention.status === 'pending' && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        <Button size="sm" className="h-7 text-xs" onClick={() => onStart(intervention.id)}>
                          <Play className="h-3 w-3 mr-1" /> Start
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onComplete(intervention.id)}>
                          Done
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                          onClick={() => onMarkUnavailable(intervention.id)}
                          title="Mark this resource as unavailable at your facility"
                        >
                          <XCircle className="h-3 w-3 mr-1" /> Not Available
                        </Button>
                      </div>
                    )}
                    {intervention.status === 'in_progress' && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => onComplete(intervention.id)}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                        </Button>
                        {intervention.reassessmentChecks && intervention.reassessmentChecks.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setReassessmentMode({ interventionId: intervention.id, checkIndex: 0 })}
                          >
                            Reassess
                          </Button>
                        )}
                      </div>
                    )}
                    {intervention.status === 'completed' && intervention.reassessmentChecks && intervention.reassessmentChecks.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs mt-1"
                        onClick={() => setReassessmentMode({ interventionId: intervention.id, checkIndex: 0 })}
                      >
                        <Stethoscope className="h-3 w-3 mr-1" /> Reassess
                      </Button>
                    )}
                  </div>
                </div>

                {/* Reassessment Flow */}
                {reassessmentMode?.interventionId === intervention.id && intervention.reassessmentChecks && (
                  <ReassessmentFlow
                    checks={intervention.reassessmentChecks}
                    currentIndex={reassessmentMode.checkIndex}
                    weight={weight}
                    patientAge={session.patientAge}
                    doseRationaleDrug={intervention.action}
                    session={session}
                    setSession={setSession}
                    onAdvance={(idx) => setReassessmentMode({ interventionId: intervention.id, checkIndex: idx })}
                    onClose={() => setReassessmentMode(null)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Reassessment Flow ──────────────────────────────────────

function ReassessmentFlow({
  checks,
  currentIndex,
  weight,
  patientAge,
  doseRationaleDrug,
  session,
  setSession,
  onAdvance,
  onClose,
}: {
  checks: ReassessmentCheck[];
  currentIndex: number;
  weight: number | null;
  patientAge: string | null;
  /** Parent intervention action — used to match dose rationale when reassessment options include a dose */
  doseRationaleDrug: string;
  session: ResusSession;
  setSession: (s: ResusSession) => void;
  onAdvance: (idx: number) => void;
  onClose: () => void;
}) {
  const check = checks[currentIndex];
  if (!check) return null;

  const handleOption = (option: (typeof check.options)[0]) => {
    const next = JSON.parse(JSON.stringify(session)) as ResusSession;
    next.events.push({
      timestamp: Date.now(),
      type: 'reassessment',
      detail: `Reassessment: ${check.question} -> ${option.label}`,
    });

    if (option.recommendation) {
      next.events.push({
        timestamp: Date.now(),
        type: 'note',
        detail: `Recommendation: ${option.recommendation}`,
      });
    }

    setSession(next);

    if (option.action === 'resolved' || option.action === 'stop') {
      onClose();
    } else if (currentIndex < checks.length - 1) {
      onAdvance(currentIndex + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="mt-2 bg-accent/30 rounded-lg p-3 border border-border">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-foreground">{check.question}</p>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>
      <div className="space-y-2">
        {check.options.map(option => (
          <button
            key={option.value}
            className={`w-full text-left p-2 rounded-lg border text-xs transition-colors ${
              option.action === 'stop'
                ? 'border-red-500/30 hover:bg-red-500/10'
                : option.action === 'resolved'
                ? 'border-green-500/30 hover:bg-green-500/10'
                : option.action === 'escalate'
                ? 'border-amber-500/30 hover:bg-amber-500/10'
                : 'border-border hover:bg-accent/50'
            }`}
            onClick={() => handleOption(option)}
          >
            <p className="font-medium text-foreground">{option.label}</p>
            {option.recommendation && (
              <p className="text-muted-foreground mt-1">{option.recommendation}</p>
            )}
            {option.rationale && (
              <p className="text-muted-foreground/70 mt-0.5 italic">{option.rationale}</p>
            )}
            {option.dose && (
              <>
                <p className="text-primary mt-1 font-medium">{calcDose(option.dose, weight)}</p>
                <InterventionDoseRationale
                  action={doseRationaleDrug}
                  dose={option.dose}
                  weight={weight}
                  patientAge={patientAge}
                  className="mt-2 pt-2 border-t border-border/40"
                />
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Vital Badge ────────────────────────────────────────────

function VitalBadge({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-accent/30 rounded-lg p-2 text-center">
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{unit}</p>
    </div>
  );
}
