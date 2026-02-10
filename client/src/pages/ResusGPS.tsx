/**
 * ResusGPS — The Clinical GPS for Emergency Resuscitation
 * 
 * This is the ONE page. It renders the ABCDE engine state.
 * 
 * Flow: IDLE → QUICK ASSESSMENT → PRIMARY SURVEY (XABCDE) → INTERVENTIONS → SECONDARY SURVEY → DEFINITIVE CARE
 * 
 * Design: Dark theme, massive touch targets, zero cognitive load.
 * Every screen answers ONE question. Every button does ONE thing.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePatientDemographics } from '@/contexts/PatientDemographicsContext';
import {
  type ResusSession,
  type Phase,
  type ABCDELetter,
  type Threat,
  type Intervention,
  type AssessmentQuestion,
  type DoseInfo,
  type DiagnosisSuggestion,
  createSession,
  startQuickAssessment,
  answerQuickAssessment,
  getCurrentQuestions,
  getAnsweredQuestionIds,
  answerPrimarySurvey,
  completeIntervention,
  returnToPrimarySurvey,
  getActiveThreats,
  getPendingInterventions,
  getAllPendingCritical,
  getSuggestedDiagnoses,
  setDefinitiveDiagnosis,
  triggerCardiacArrest,
  achieveROSC,
  acknowledgeSafetyAlert,
  exportEventLog,
  calcDose,
  updateSAMPLE,
  primarySurveyQuestions,
} from '../lib/resus/abcdeEngine';
import {
  Activity, AlertTriangle, ArrowRight, Check, ChevronRight, Clock,
  Download, Heart, RotateCcw, Shield, Stethoscope, Timer, User, Weight,
  Volume2, VolumeX, Zap, FileText, Play, Square, SkipForward,
} from 'lucide-react';

// ─── Format Helpers ─────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatElapsed(startTime: number): string {
  return formatTime(Math.floor((Date.now() - startTime) / 1000));
}

// ─── Audio Alert Hook ───────────────────────────────────────

function useAudioAlert() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [muted, setMuted] = useState(false);

  const playAlert = useCallback((type: 'timer' | 'critical' | 'safety') => {
    if (muted) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'critical') {
        osc.frequency.value = 880;
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'timer') {
        osc.frequency.value = 660;
        gain.gain.value = 0.2;
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.frequency.value = 440;
        gain.gain.value = 0.15;
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // Audio not available
    }
  }, [muted]);

  return { playAlert, muted, setMuted };
}

// ─── Timer Hook ─────────────────────────────────────────────

function useCountdownTimer(onComplete?: () => void) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [label, setLabel] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback((seconds: number, timerLabel: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRemaining(seconds);
    setLabel(timerLabel);
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev === null || prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onComplete]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRemaining(null);
    setLabel('');
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return { remaining, label, start, stop, isRunning: remaining !== null && remaining > 0 };
}

// ─── Elapsed Timer ──────────────────────────────────────────

function ElapsedTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex items-center gap-1.5 text-zinc-400 text-sm font-mono">
      <Clock className="h-3.5 w-3.5" />
      {formatTime(elapsed)}
    </div>
  );
}

// ─── ABCDE Progress Indicator ───────────────────────────────

const LETTERS: ABCDELetter[] = ['X', 'A', 'B', 'C', 'D', 'E'];
const LETTER_LABELS: Record<ABCDELetter, string> = {
  X: 'eXsanguination',
  A: 'Airway',
  B: 'Breathing',
  C: 'Circulation',
  D: 'Disability',
  E: 'Exposure',
};
const LETTER_COLORS: Record<ABCDELetter, string> = {
  X: 'bg-red-600',
  A: 'bg-orange-500',
  B: 'bg-blue-500',
  C: 'bg-red-500',
  D: 'bg-purple-500',
  E: 'bg-emerald-500',
};

function ABCDEProgressBar({ session }: { session: ResusSession }) {
  const letters = session.isTrauma ? LETTERS : LETTERS.filter(l => l !== 'X');
  const answeredIds = getAnsweredQuestionIds(session);
  const threatLetters = new Set(session.threats.filter(t => !t.resolved).map(t => t.letter));

  return (
    <div className="flex gap-1 w-full">
      {letters.map(letter => {
        const questions = primarySurveyQuestions[letter];
        const answered = questions.filter(q => answeredIds.includes(q.id)).length;
        const total = questions.length;
        const isCurrent = session.currentLetter === letter && session.phase === 'PRIMARY_SURVEY';
        const isComplete = answered === total;
        const hasThreat = threatLetters.has(letter);

        return (
          <div key={letter} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className={`
                w-full h-8 rounded-md flex items-center justify-center text-xs font-black transition-all
                ${isCurrent ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-900 scale-105' : ''}
                ${isComplete ? LETTER_COLORS[letter] + ' text-white' : 'bg-zinc-800 text-zinc-500'}
                ${hasThreat && !isComplete ? 'animate-pulse border-2 border-red-500' : ''}
              `}
            >
              {letter}
              {hasThreat && <span className="ml-0.5 text-[10px]">!</span>}
            </div>
            {total > 0 && (
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${LETTER_COLORS[letter]} transition-all duration-300`}
                  style={{ width: `${(answered / total) * 100}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Dose Display Component ─────────────────────────────────

function DoseCard({ dose, weight }: { dose: DoseInfo; weight: number | null }) {
  const calculated = calcDose(dose, weight);
  const hasWeight = weight !== null && weight > 0;

  return (
    <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 mt-2">
      <div className="flex items-start gap-2">
        <div className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded shrink-0">
          DOSE
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">{calculated}</p>
          {dose.preparation && (
            <p className="text-zinc-400 text-xs mt-1">{dose.preparation}</p>
          )}
          {dose.frequency && (
            <p className="text-blue-400 text-xs mt-0.5">Repeat: {dose.frequency}</p>
          )}
          {dose.notes && (
            <p className="text-amber-400 text-xs mt-0.5">⚠ {dose.notes}</p>
          )}
          {!hasWeight && (
            <p className="text-red-400 text-xs mt-1 font-semibold">
              ⚠ No weight entered — showing per-kg dose. Enter weight for exact calculation.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Safety Alert Banner ────────────────────────────────────

function SafetyAlertBanner({ session, onAcknowledge }: { session: ResusSession; onAcknowledge: (id: string) => void }) {
  const unacknowledged = session.safetyAlerts.filter(a => !a.acknowledged);
  if (unacknowledged.length === 0) return null;

  return (
    <div className="space-y-2">
      {unacknowledged.map(alert => (
        <div
          key={alert.id}
          className={`p-3 rounded-lg border flex items-start gap-3 ${
            alert.severity === 'danger'
              ? 'bg-red-900/50 border-red-500 animate-pulse'
              : 'bg-amber-900/50 border-amber-500'
          }`}
        >
          <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${
            alert.severity === 'danger' ? 'text-red-400' : 'text-amber-400'
          }`} />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold">{alert.message}</p>
          </div>
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="shrink-0 bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-2 py-1 rounded"
          >
            Acknowledged
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Active Threats Sidebar ─────────────────────────────────

function ThreatsSidebar({ session, weight }: { session: ResusSession; weight: number | null }) {
  const threats = getActiveThreats(session);
  if (threats.length === 0) return null;

  return (
    <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg p-3">
      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Zap className="h-3.5 w-3.5 text-red-400" />
        Active Threats ({threats.length})
      </h3>
      <div className="space-y-1.5">
        {threats.map(threat => {
          const pending = getPendingInterventions(threat);
          const total = threat.interventions.length;
          const completed = total - pending.length;
          return (
            <div key={threat.id} className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded text-[10px] font-black flex items-center justify-center ${LETTER_COLORS[threat.letter]} text-white`}>
                {threat.letter}
              </span>
              <span className="text-xs text-zinc-300 flex-1 truncate">{threat.name}</span>
              <span className="text-[10px] text-zinc-500">{completed}/{total}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function ResusGPS() {
  const { demographics, setDemographics, getWeightInKg } = usePatientDemographics();
  const [session, setSession] = useState<ResusSession>(() =>
    createSession(null, null, false)
  );
  const { playAlert, muted, setMuted } = useAudioAlert();
  const timer = useCountdownTimer(() => playAlert('timer'));

  // Patient info state for IDLE screen
  const [patientAge, setPatientAge] = useState(demographics.age || '');
  const [patientWeight, setPatientWeight] = useState(demographics.weight || '');
  const [isTrauma, setIsTrauma] = useState(false);

  // Derived state
  const weight = getWeightInKg();

  // ─── Actions ────────────────────────────────────────────

  const handleStart = useCallback(() => {
    // Save demographics
    if (patientAge || patientWeight) {
      setDemographics({ age: patientAge, weight: patientWeight });
    }
    const w = patientWeight ? parseFloat(patientWeight) : null;
    const newSession = createSession(w, patientAge || null, isTrauma);
    setSession(startQuickAssessment(newSession));
  }, [patientAge, patientWeight, isTrauma, setDemographics]);

  const handleQuickAssessment = useCallback((answer: 'sick' | 'not_sick') => {
    setSession(prev => answerQuickAssessment(prev, answer));
    if (answer === 'sick') playAlert('critical');
  }, [playAlert]);

  const handleSurveyAnswer = useCallback((question: AssessmentQuestion, answer: string) => {
    setSession(prev => {
      const next = answerPrimarySurvey(prev, question.id, answer, question);
      // If a critical threat was detected, play alert
      if (next.phase === 'INTERVENTION' && prev.phase === 'PRIMARY_SURVEY') {
        playAlert('critical');
      }
      return next;
    });
  }, [playAlert]);

  const handleCompleteIntervention = useCallback((interventionId: string, intervention: Intervention) => {
    setSession(prev => {
      const next = completeIntervention(prev, interventionId);
      // Start timer if intervention has one
      if (intervention.timerSeconds && intervention.reassessAfter) {
        timer.start(intervention.timerSeconds, intervention.reassessAfter);
      }
      return next;
    });
  }, [timer]);

  const handleContinueSurvey = useCallback(() => {
    setSession(prev => returnToPrimarySurvey(prev));
  }, []);

  const handleCardiacArrest = useCallback(() => {
    setSession(prev => triggerCardiacArrest(prev));
    playAlert('critical');
  }, [playAlert]);

  const handleROSC = useCallback(() => {
    setSession(prev => achieveROSC(prev));
  }, []);

  const handleAcknowledgeAlert = useCallback((alertId: string) => {
    setSession(prev => acknowledgeSafetyAlert(prev, alertId));
  }, []);

  const handleDiagnosis = useCallback((diagnosis: string) => {
    setSession(prev => setDefinitiveDiagnosis(prev, diagnosis));
  }, []);

  const handleReset = useCallback(() => {
    timer.stop();
    setSession(createSession(null, null, false));
    setPatientAge('');
    setPatientWeight('');
    setIsTrauma(false);
  }, [timer]);

  const handleExportLog = useCallback(() => {
    const log = exportEventLog(session);
    const blob = new Blob([log], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resus-log-${new Date().toISOString().slice(0, 19)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [session]);

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Top Bar */}
      {session.phase !== 'IDLE' && (
        <header className="bg-zinc-900 border-b border-zinc-800 px-3 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-red-500" />
            <span className="font-bold text-sm">ResusGPS</span>
            <Badge variant="outline" className="text-[10px] border-zinc-600 text-zinc-400">
              {session.phase.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <ElapsedTimer startTime={session.startTime} />
            {session.patientWeight && (
              <Badge className="bg-blue-600/20 text-blue-300 border-blue-600/40 text-[10px]">
                {session.patientWeight}kg
              </Badge>
            )}
            <button onClick={() => setMuted(!muted)} className="text-zinc-500 hover:text-white">
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
        </header>
      )}

      {/* Timer Banner */}
      {timer.isRunning && timer.remaining !== null && (
        <div className="bg-amber-600 text-white px-4 py-2 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            <span className="text-sm font-bold">{timer.label}</span>
          </div>
          <span className="font-mono font-bold">{formatTime(timer.remaining)}</span>
        </div>
      )}

      {/* Safety Alerts */}
      <div className="px-3 pt-2">
        <SafetyAlertBanner session={session} onAcknowledge={handleAcknowledgeAlert} />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {session.phase === 'IDLE' && (
          <IdleScreen
            patientAge={patientAge}
            setPatientAge={setPatientAge}
            patientWeight={patientWeight}
            setPatientWeight={setPatientWeight}
            isTrauma={isTrauma}
            setIsTrauma={setIsTrauma}
            onStart={handleStart}
            onCardiacArrest={handleCardiacArrest}
          />
        )}

        {session.phase === 'QUICK_ASSESSMENT' && (
          <QuickAssessmentScreen onAnswer={handleQuickAssessment} />
        )}

        {session.phase === 'PRIMARY_SURVEY' && (
          <PrimarySurveyScreen
            session={session}
            weight={weight}
            onAnswer={handleSurveyAnswer}
            onCardiacArrest={handleCardiacArrest}
          />
        )}

        {session.phase === 'INTERVENTION' && (
          <InterventionScreen
            session={session}
            weight={weight}
            onComplete={handleCompleteIntervention}
            onContinueSurvey={handleContinueSurvey}
            onCardiacArrest={handleCardiacArrest}
          />
        )}

        {session.phase === 'SECONDARY_SURVEY' && (
          <SecondarySurveyScreen
            session={session}
            weight={weight}
            onDiagnosis={handleDiagnosis}
            onCardiacArrest={handleCardiacArrest}
          />
        )}

        {session.phase === 'CARDIAC_ARREST' && (
          <CardiacArrestScreen
            session={session}
            weight={weight}
            onComplete={handleCompleteIntervention}
            onROSC={handleROSC}
          />
        )}

        {(session.phase === 'DEFINITIVE_CARE' || session.phase === 'ONGOING') && (
          <DefinitiveCareScreen
            session={session}
            weight={weight}
            onReset={handleReset}
            onExportLog={handleExportLog}
            onCardiacArrest={handleCardiacArrest}
          />
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SCREEN COMPONENTS
// ═══════════════════════════════════════════════════════════

// ─── IDLE SCREEN ────────────────────────────────────────────

function IdleScreen({
  patientAge, setPatientAge, patientWeight, setPatientWeight,
  isTrauma, setIsTrauma, onStart, onCardiacArrest,
}: {
  patientAge: string; setPatientAge: (v: string) => void;
  patientWeight: string; setPatientWeight: (v: string) => void;
  isTrauma: boolean; setIsTrauma: (v: boolean) => void;
  onStart: () => void;
  onCardiacArrest: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
      {/* Logo */}
      <div className="text-center">
        <Activity className="h-16 w-16 text-red-500 mx-auto mb-3" />
        <h1 className="text-4xl font-black text-white">ResusGPS</h1>
        <p className="text-zinc-400 text-sm mt-1">Clinical Emergency GPS</p>
      </div>

      {/* Patient Info */}
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-700">
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-bold text-zinc-400 flex items-center gap-2">
            <User className="h-4 w-4" />
            Patient Info (for accurate dosing)
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-zinc-400 text-xs">Age</Label>
              <Input
                placeholder="e.g., 5 years"
                value={patientAge}
                onChange={e => setPatientAge(e.target.value)}
                className="bg-zinc-800 border-zinc-600 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Weight (kg)</Label>
              <Input
                type="number"
                placeholder="e.g., 18"
                value={patientWeight}
                onChange={e => setPatientWeight(e.target.value)}
                className="bg-zinc-800 border-zinc-600 text-white mt-1"
              />
            </div>
          </div>
          {/* Trauma Toggle */}
          <button
            onClick={() => setIsTrauma(!isTrauma)}
            className={`w-full py-2 px-3 rounded-lg text-sm font-bold transition-all ${
              isTrauma
                ? 'bg-red-600 text-white border-2 border-red-400'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-600 hover:border-zinc-500'
            }`}
          >
            {isTrauma ? '🚨 TRAUMA MODE (XABCDE)' : 'Tap for Trauma Mode (XABCDE)'}
          </button>
        </CardContent>
      </Card>

      {/* START Button */}
      <button
        onClick={onStart}
        className="w-full max-w-md h-40 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-2xl shadow-2xl shadow-cyan-500/20 transform hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center gap-3"
      >
        <Stethoscope className="h-14 w-14" />
        <span className="text-3xl font-black">START ASSESSMENT</span>
      </button>

      {/* Cardiac Arrest Quick Launch */}
      <button
        onClick={onCardiacArrest}
        className="w-full max-w-md py-5 bg-red-700 hover:bg-red-600 text-white rounded-xl font-black text-xl flex items-center justify-center gap-3 active:scale-95 transition-all animate-pulse"
      >
        <Heart className="h-7 w-7" />
        CARDIAC ARREST — START CPR
      </button>

      <p className="text-zinc-600 text-xs text-center max-w-sm">
        No login required. Works offline. Every second counts.
      </p>
    </div>
  );
}

// ─── QUICK ASSESSMENT SCREEN ────────────────────────────────

function QuickAssessmentScreen({ onAnswer }: { onAnswer: (answer: 'sick' | 'not_sick') => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
      <div className="text-center">
        <div className="text-5xl mb-4">👀</div>
        <h2 className="text-3xl font-black text-white">Quick Assessment</h2>
        <p className="text-zinc-400 mt-2 text-lg">Pediatric Assessment Triangle — 5 seconds</p>
        <p className="text-zinc-500 text-sm mt-1">Look at the patient. Appearance, work of breathing, circulation to skin.</p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <button
          onClick={() => onAnswer('sick')}
          className="w-full py-8 bg-red-700 hover:bg-red-600 text-white rounded-2xl text-2xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <AlertTriangle className="h-8 w-8" />
          SICK — Activate Emergency
        </button>

        <button
          onClick={() => onAnswer('not_sick')}
          className="w-full py-8 bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl text-2xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <Shield className="h-8 w-8" />
          NOT SICK — Assess Further
        </button>
      </div>

      <p className="text-zinc-600 text-xs text-center max-w-sm">
        This is your first impression. Does this patient look sick or not sick?
        Trust your gut — you can always escalate later.
      </p>
    </div>
  );
}

// ─── PRIMARY SURVEY SCREEN ──────────────────────────────────

function PrimarySurveyScreen({
  session, weight, onAnswer, onCardiacArrest,
}: {
  session: ResusSession;
  weight: number | null;
  onAnswer: (question: AssessmentQuestion, answer: string) => void;
  onCardiacArrest: () => void;
}) {
  const questions = getCurrentQuestions(session);
  const answeredIds = getAnsweredQuestionIds(session);
  const currentQuestion = questions.find(q => !answeredIds.includes(q.id));

  if (!currentQuestion) {
    // All questions for this letter answered, but no critical threat → auto-advance
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto" />
          <p className="text-zinc-400 mt-4">Advancing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-3 gap-3">
      {/* ABCDE Progress */}
      <ABCDEProgressBar session={session} />

      {/* Active Threats Sidebar */}
      <ThreatsSidebar session={session} weight={weight} />

      {/* Current Letter Header */}
      <div className="flex items-center gap-3 px-1">
        <div className={`w-12 h-12 rounded-xl ${LETTER_COLORS[session.currentLetter]} text-white flex items-center justify-center text-2xl font-black`}>
          {session.currentLetter}
        </div>
        <div>
          <h2 className="text-xl font-black text-white">{LETTER_LABELS[session.currentLetter]}</h2>
          <p className="text-zinc-500 text-xs">Primary Survey</p>
        </div>
      </div>

      {/* Question */}
      <Card className="bg-zinc-900 border-zinc-700">
        <CardContent className="p-4">
          <h3 className="text-lg font-bold text-white mb-4">{currentQuestion.text}</h3>
          <div className="space-y-2">
            {currentQuestion.options.map(option => (
              <button
                key={option.value}
                onClick={() => onAnswer(currentQuestion, option.value)}
                className={`w-full py-4 px-4 rounded-xl text-left font-bold transition-all active:scale-[0.98] flex items-center gap-3 ${
                  option.severity === 'critical'
                    ? 'bg-red-900/50 hover:bg-red-800/60 border-2 border-red-600 text-red-100'
                    : option.severity === 'urgent'
                    ? 'bg-amber-900/30 hover:bg-amber-800/40 border border-amber-600/50 text-amber-100'
                    : 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200'
                }`}
              >
                <span className="text-xl shrink-0">{option.icon}</span>
                <span className="text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cardiac Arrest Override */}
      <button
        onClick={onCardiacArrest}
        className="w-full py-3 bg-red-900/50 hover:bg-red-800/60 border border-red-700 text-red-300 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
      >
        <Heart className="h-4 w-4" />
        CARDIAC ARREST — Start CPR Now
      </button>
    </div>
  );
}

// ─── INTERVENTION SCREEN ────────────────────────────────────

function InterventionScreen({
  session, weight, onComplete, onContinueSurvey, onCardiacArrest,
}: {
  session: ResusSession;
  weight: number | null;
  onComplete: (id: string, intervention: Intervention) => void;
  onContinueSurvey: () => void;
  onCardiacArrest: () => void;
}) {
  const threats = getActiveThreats(session);
  const criticalPending = getAllPendingCritical(session);

  // Show critical interventions first, then all threats
  const primaryThreat = threats[0];

  return (
    <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto">
      {/* ABCDE Progress */}
      <ABCDEProgressBar session={session} />

      {/* Header */}
      <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 flex items-center gap-3">
        <Zap className="h-6 w-6 text-red-400 shrink-0" />
        <div>
          <h2 className="text-lg font-black text-white">INTERVENE NOW</h2>
          <p className="text-red-300 text-xs">{threats.length} active threat{threats.length !== 1 ? 's' : ''} — treat in priority order</p>
        </div>
      </div>

      {/* Threats & Interventions */}
      {threats.map(threat => {
        const pending = getPendingInterventions(threat);
        const completedCount = threat.interventions.length - pending.length;
        const progress = (completedCount / threat.interventions.length) * 100;

        return (
          <Card key={threat.id} className={`border ${
            threat.severity === 'critical' ? 'bg-red-950/50 border-red-700' : 'bg-zinc-900 border-zinc-700'
          }`}>
            <CardContent className="p-3">
              {/* Threat Header */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-6 h-6 rounded text-xs font-black flex items-center justify-center ${LETTER_COLORS[threat.letter]} text-white`}>
                  {threat.letter}
                </span>
                <h3 className="font-bold text-white text-sm flex-1">{threat.name}</h3>
                <Badge className={`text-[10px] ${
                  threat.severity === 'critical' ? 'bg-red-600' : 'bg-amber-600'
                } text-white`}>
                  {threat.severity.toUpperCase()}
                </Badge>
              </div>
              <Progress value={progress} className="h-1.5 mb-3" />

              {/* Interventions */}
              <div className="space-y-2">
                {threat.interventions.map((intervention, idx) => (
                  <div
                    key={intervention.id}
                    className={`rounded-lg p-3 transition-all ${
                      intervention.completed
                        ? 'bg-emerald-900/20 border border-emerald-700/30 opacity-60'
                        : intervention.critical
                        ? 'bg-red-900/20 border border-red-600/50'
                        : 'bg-zinc-800 border border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {intervention.completed ? (
                        <Check className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <span className="w-5 h-5 rounded-full border-2 border-zinc-500 shrink-0 mt-0.5 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                          {idx + 1}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm ${
                          intervention.completed ? 'text-emerald-400 line-through' : 'text-white'
                        }`}>
                          {intervention.action}
                        </p>
                        {intervention.detail && (
                          <p className="text-zinc-400 text-xs mt-1">{intervention.detail}</p>
                        )}
                        {intervention.dose && !intervention.completed && (
                          <DoseCard dose={intervention.dose} weight={weight} />
                        )}
                        {intervention.timerSeconds && !intervention.completed && (
                          <div className="flex items-center gap-1 mt-1 text-amber-400 text-xs">
                            <Timer className="h-3 w-3" />
                            Timer: {formatTime(intervention.timerSeconds)}
                            {intervention.reassessAfter && ` — ${intervention.reassessAfter}`}
                          </div>
                        )}
                      </div>
                      {!intervention.completed && (
                        <button
                          onClick={() => onComplete(intervention.id, intervention)}
                          className={`shrink-0 px-3 py-2 rounded-lg font-bold text-xs active:scale-95 transition-all ${
                            intervention.critical
                              ? 'bg-red-600 hover:bg-red-500 text-white'
                              : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                          }`}
                        >
                          DONE ✓
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Continue Survey Button */}
      <button
        onClick={onContinueSurvey}
        className="w-full py-4 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
      >
        <ArrowRight className="h-5 w-5" />
        Continue Primary Survey →
      </button>

      {/* Cardiac Arrest Override */}
      <button
        onClick={onCardiacArrest}
        className="w-full py-3 bg-red-900/50 hover:bg-red-800/60 border border-red-700 text-red-300 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
      >
        <Heart className="h-4 w-4" />
        CARDIAC ARREST — Start CPR Now
      </button>
    </div>
  );
}

// ─── SECONDARY SURVEY SCREEN ────────────────────────────────

function SecondarySurveyScreen({
  session, weight, onDiagnosis, onCardiacArrest,
}: {
  session: ResusSession;
  weight: number | null;
  onDiagnosis: (diagnosis: string) => void;
  onCardiacArrest: () => void;
}) {
  const suggestions = useMemo(() => getSuggestedDiagnoses(session), [session]);
  const [customDiagnosis, setCustomDiagnosis] = useState('');

  return (
    <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto">
      {/* ABCDE Progress */}
      <ABCDEProgressBar session={session} />

      {/* Active Threats */}
      <ThreatsSidebar session={session} weight={weight} />

      {/* Header */}
      <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-3">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-400" />
          Secondary Survey
        </h2>
        <p className="text-purple-300 text-xs mt-1">Primary survey complete. Now identify the definitive diagnosis.</p>
      </div>

      {/* Findings Summary */}
      <Card className="bg-zinc-900 border-zinc-700">
        <CardContent className="p-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase mb-2">Findings Summary</h3>
          <div className="space-y-1">
            {session.findings
              .filter(f => f.severity !== 'monitor' || f.description !== 'normal')
              .map(f => (
                <div key={f.id} className="flex items-center gap-2 text-xs">
                  <span className={`w-5 h-5 rounded text-[10px] font-black flex items-center justify-center ${LETTER_COLORS[f.letter]} text-white`}>
                    {f.letter}
                  </span>
                  <span className="text-zinc-300">{f.id.replace(/_/g, ' ')}: </span>
                  <span className={`font-bold ${
                    f.severity === 'critical' ? 'text-red-400' : f.severity === 'urgent' ? 'text-amber-400' : 'text-zinc-400'
                  }`}>
                    {f.description.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Suggested Diagnoses */}
      {suggestions.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-700">
          <CardContent className="p-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase mb-2">System Suggests</h3>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onDiagnosis(s.diagnosis)}
                  className="w-full text-left p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-sm">{s.diagnosis}</span>
                    <Badge className={`text-[10px] ${
                      s.confidence === 'high' ? 'bg-emerald-600' : s.confidence === 'moderate' ? 'bg-amber-600' : 'bg-zinc-600'
                    } text-white`}>
                      {s.confidence}
                    </Badge>
                  </div>
                  <p className="text-zinc-400 text-xs">{s.supportingFindings.join(' + ')}</p>
                  <p className="text-cyan-400 text-xs mt-1">{s.protocol}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Diagnosis */}
      <Card className="bg-zinc-900 border-zinc-700">
        <CardContent className="p-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase mb-2">Or Enter Diagnosis</h3>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Severe Pneumonia, Meningitis..."
              value={customDiagnosis}
              onChange={e => setCustomDiagnosis(e.target.value)}
              className="bg-zinc-800 border-zinc-600 text-white"
            />
            <Button
              onClick={() => customDiagnosis && onDiagnosis(customDiagnosis)}
              disabled={!customDiagnosis}
              className="bg-purple-600 hover:bg-purple-500 shrink-0"
            >
              Confirm
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cardiac Arrest Override */}
      <button
        onClick={onCardiacArrest}
        className="w-full py-3 bg-red-900/50 hover:bg-red-800/60 border border-red-700 text-red-300 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
      >
        <Heart className="h-4 w-4" />
        CARDIAC ARREST — Start CPR Now
      </button>
    </div>
  );
}

// ─── CARDIAC ARREST SCREEN ──────────────────────────────────

function CardiacArrestScreen({
  session, weight, onComplete, onROSC,
}: {
  session: ResusSession;
  weight: number | null;
  onComplete: (id: string, intervention: Intervention) => void;
  onROSC: () => void;
}) {
  const caThreat = session.threats.find(t => t.id === 'cardiac_arrest');
  const [cprCycles, setCprCycles] = useState(0);
  const [cprTimer, setCprTimer] = useState<number | null>(null);
  const cprIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCPRTimer = useCallback(() => {
    setCprTimer(120);
    setCprCycles(prev => prev + 1);
    if (cprIntervalRef.current) clearInterval(cprIntervalRef.current);
    cprIntervalRef.current = setInterval(() => {
      setCprTimer(prev => {
        if (prev === null || prev <= 1) {
          if (cprIntervalRef.current) clearInterval(cprIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => {
    if (cprIntervalRef.current) clearInterval(cprIntervalRef.current);
  }, []);

  return (
    <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto">
      {/* CARDIAC ARREST BANNER */}
      <div className="bg-red-800 rounded-xl p-4 text-center animate-pulse">
        <Heart className="h-12 w-12 text-white mx-auto mb-2" />
        <h2 className="text-3xl font-black text-white">CARDIAC ARREST</h2>
        <p className="text-red-200 text-sm mt-1">Push hard, push fast. 100-120/min. Minimize interruptions.</p>
      </div>

      {/* CPR Timer */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-center">
        <div className="text-sm text-zinc-400 mb-1">CPR Cycle {cprCycles || '—'}</div>
        {cprTimer !== null && cprTimer > 0 ? (
          <div className="text-5xl font-mono font-black text-amber-400">
            {formatTime(cprTimer)}
          </div>
        ) : cprTimer === 0 ? (
          <div className="text-2xl font-black text-red-400 animate-pulse">
            ⏰ CHECK RHYTHM NOW
          </div>
        ) : (
          <div className="text-2xl font-bold text-zinc-500">Ready</div>
        )}
        <button
          onClick={startCPRTimer}
          className="mt-3 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-lg active:scale-95 transition-all"
        >
          {cprCycles === 0 ? 'Start CPR Timer (2 min)' : 'Restart CPR Timer'}
        </button>
      </div>

      {/* Interventions */}
      {caThreat && (
        <Card className="bg-red-950/50 border-red-700">
          <CardContent className="p-3">
            <h3 className="font-bold text-white text-sm mb-2">Interventions</h3>
            <div className="space-y-2">
              {caThreat.interventions.map((intervention, idx) => (
                <div
                  key={intervention.id}
                  className={`rounded-lg p-3 ${
                    intervention.completed
                      ? 'bg-emerald-900/20 border border-emerald-700/30 opacity-60'
                      : 'bg-red-900/20 border border-red-600/50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {intervention.completed ? (
                      <Check className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-red-500 shrink-0 mt-0.5 flex items-center justify-center text-[10px] font-bold text-red-400">
                        {idx + 1}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${
                        intervention.completed ? 'text-emerald-400 line-through' : 'text-white'
                      }`}>
                        {intervention.action}
                      </p>
                      {intervention.detail && (
                        <p className="text-zinc-400 text-xs mt-1">{intervention.detail}</p>
                      )}
                      {intervention.dose && !intervention.completed && (
                        <DoseCard dose={intervention.dose} weight={weight} />
                      )}
                    </div>
                    {!intervention.completed && (
                      <button
                        onClick={() => onComplete(intervention.id, intervention)}
                        className="shrink-0 px-3 py-2 rounded-lg font-bold text-xs bg-red-600 hover:bg-red-500 text-white active:scale-95 transition-all"
                      >
                        DONE ✓
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ROSC Button */}
      <button
        onClick={onROSC}
        className="w-full py-5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-black text-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        <Heart className="h-7 w-7" />
        ROSC ACHIEVED — Post-Resuscitation Care
      </button>
    </div>
  );
}

// ─── DEFINITIVE CARE / ONGOING SCREEN ───────────────────────

function DefinitiveCareScreen({
  session, weight, onReset, onExportLog, onCardiacArrest,
}: {
  session: ResusSession;
  weight: number | null;
  onReset: () => void;
  onExportLog: () => void;
  onCardiacArrest: () => void;
}) {
  const elapsed = Math.floor((Date.now() - session.startTime) / 1000);

  return (
    <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto">
      {/* Header */}
      <div className={`rounded-xl p-4 text-center ${
        session.phase === 'ONGOING'
          ? 'bg-emerald-900/30 border border-emerald-700'
          : 'bg-purple-900/30 border border-purple-700'
      }`}>
        <h2 className="text-2xl font-black text-white">
          {session.phase === 'ONGOING' ? '✅ Post-Resuscitation Care' : '📋 Definitive Care'}
        </h2>
        {session.definitiveDiagnosis && (
          <p className="text-lg text-cyan-300 mt-1 font-bold">{session.definitiveDiagnosis}</p>
        )}
        <p className="text-zinc-400 text-sm mt-1">
          Total time: {formatTime(elapsed)} • {session.threats.length} threats identified • {session.events.length} events logged
        </p>
      </div>

      {/* Active Threats */}
      <ThreatsSidebar session={session} weight={weight} />

      {/* Event Log */}
      <Card className="bg-zinc-900 border-zinc-700">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase">Event Log</h3>
            <button
              onClick={onExportLog}
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
            >
              <Download className="h-3 w-3" />
              Export
            </button>
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {session.events.map((evt, i) => {
              const elapsed = Math.floor((evt.timestamp - session.startTime) / 1000);
              return (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="text-zinc-600 font-mono shrink-0">{formatTime(elapsed)}</span>
                  {evt.letter && (
                    <span className={`w-4 h-4 rounded text-[8px] font-black flex items-center justify-center ${LETTER_COLORS[evt.letter]} text-white shrink-0`}>
                      {evt.letter}
                    </span>
                  )}
                  <span className="text-zinc-400">{evt.detail}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-zinc-900 border-zinc-700">
        <CardContent className="p-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase mb-2">Next Steps</h3>
          <ul className="space-y-1.5 text-sm text-zinc-300">
            <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Continue monitoring vital signs</li>
            <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Document interventions and times</li>
            <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Arrange definitive care / transfer</li>
            <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Debrief with team</li>
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={onCardiacArrest}
          className="w-full py-3 bg-red-900/50 hover:bg-red-800/60 border border-red-700 text-red-300 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Heart className="h-4 w-4" />
          CARDIAC ARREST — Start CPR Now
        </button>
        <Button onClick={onReset} className="w-full py-3 text-lg font-bold" variant="outline">
          <RotateCcw className="h-5 w-5 mr-2" />
          Start New Case
        </Button>
      </div>
    </div>
  );
}
