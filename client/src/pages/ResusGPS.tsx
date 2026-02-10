import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  type ResusSession,
  type Step,
  type PathwayId,
  createSession,
  transition,
  getCurrentStep,
  getCurrentSteps,
  getTriageQuestion,
  calculateDose,
} from '../lib/resus/stateMachine';
import { pathwayRegistry, identifyOptions } from '../lib/resus/pathways';
import { estimateWeightFromAge } from '../lib/resus/weightEstimation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ─── Timer Hook ──────────────────────────────────────────────
function useTimer(seconds: number | undefined, onComplete?: () => void) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (!seconds) return;
    setRemaining(seconds);
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
  }, [seconds, onComplete]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRemaining(null);
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return { remaining, start, stop, isRunning: remaining !== null && remaining > 0 };
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ─── Elapsed Timer ───────────────────────────────────────────
function ElapsedTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [startTime]);
  return (
    <div className="text-xs text-zinc-400 font-mono">
      ⏱ {formatTime(elapsed)}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function ResusGPS() {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<ResusSession | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [ageInput, setAgeInput] = useState('');

  // Handle input from state machine
  const dispatch = useCallback((type: string, value: string) => {
    setSession(prev => {
      if (!prev) return prev;
      return transition(prev, { type, value }, pathwayRegistry);
    });
    setShowDetail(false);
  }, []);

  // Start session
  const handleStart = useCallback(() => {
    const weight = weightInput ? parseFloat(weightInput) : null;
    const age = ageInput || null;
    const estimatedWeight = !weight && age ? estimateWeightFromAge(age) : null;
    const s = createSession(weight || estimatedWeight, age);
    setSession(s);
  }, [weightInput, ageInput]);

  // Quick launch directly to a pathway
  const handleQuickLaunch = useCallback((pathwayId: PathwayId) => {
    const weight = weightInput ? parseFloat(weightInput) : null;
    const age = ageInput || null;
    const estimatedWeight = !weight && age ? estimateWeightFromAge(age) : null;
    const s = createSession(weight || estimatedWeight, age);
    // Skip triage, go straight to pathway
    s.state = 'IDENTIFY';
    const next = transition(s, { type: 'pathway', value: pathwayId }, pathwayRegistry);
    setSession(next);
  }, [weightInput, ageInput]);

  // Reset
  const handleReset = useCallback(() => {
    setSession(null);
    setShowDetail(false);
  }, []);

  // ─── IDLE STATE: Start Screen ────────────────────────────
  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
        {/* Header */}
        <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setLocation('/')} className="text-zinc-400 hover:text-white text-sm">
            ← Home
          </button>
          <h1 className="text-lg font-bold text-red-500">ResusGPS</h1>
          <div className="w-16" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
          {/* Patient Info */}
          <Card className="w-full max-w-md bg-zinc-900 border-zinc-700">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm text-zinc-400 text-center">Patient Information (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Age</label>
                  <Input
                    placeholder="e.g. 3 years"
                    value={ageInput}
                    onChange={e => setAgeInput(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Weight (kg)</label>
                  <Input
                    placeholder="e.g. 15"
                    type="number"
                    value={weightInput}
                    onChange={e => setWeightInput(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>
              {ageInput && !weightInput && (
                <p className="text-xs text-amber-400 text-center">
                  Weight will be estimated from age: ~{estimateWeightFromAge(ageInput)?.toFixed(1) || '?'} kg
                </p>
              )}
            </CardContent>
          </Card>

          {/* START Button */}
          <button
            onClick={handleStart}
            className="w-64 h-64 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 transition-all shadow-[0_0_60px_rgba(239,68,68,0.4)] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-4xl font-black">START</span>
            <span className="text-sm opacity-80">Clinical Assessment</span>
          </button>

          {/* Quick Launch */}
          <div className="w-full max-w-md">
            <p className="text-xs text-zinc-500 text-center mb-3">Or jump directly to:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickLaunch('cardiac_arrest')}
                className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-left hover:bg-red-900 transition-colors"
              >
                <span className="text-lg">💔</span>
                <p className="text-sm font-bold text-red-400">Cardiac Arrest</p>
              </button>
              {identifyOptions.slice(0, 3).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleQuickLaunch(opt.id)}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 text-left hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-lg">{opt.icon}</span>
                  <p className="text-sm font-bold text-zinc-300">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── ACTIVE SESSION ──────────────────────────────────────
  const weight = session.patientWeight;
  const pathway = session.pathwayId ? pathwayRegistry.get(session.pathwayId) : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Session Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
        <button onClick={handleReset} className="text-red-400 hover:text-red-300 text-sm font-bold">
          ✕ NEW CASE
        </button>
        <div className="text-center">
          {pathway && <span className="text-xs text-zinc-400">{pathway.icon} {pathway.name}</span>}
        </div>
        <div className="flex items-center gap-3">
          {weight && <span className="text-xs text-zinc-500">{weight.toFixed(1)} kg</span>}
          <ElapsedTimer startTime={session.startTime} />
        </div>
      </header>

      {/* State-based content */}
      <div className="flex-1 flex flex-col">
        {session.state === 'TRIAGE' && <TriageScreen session={session} dispatch={dispatch} />}
        {session.state === 'IDENTIFY' && <IdentifyScreen dispatch={dispatch} />}
        {session.state === 'CLARIFY' && <ClarifyScreen session={session} dispatch={dispatch} />}
        {session.state === 'INTERVENE' && (
          <InterventionScreen
            session={session}
            dispatch={dispatch}
            showDetail={showDetail}
            setShowDetail={setShowDetail}
          />
        )}
        {session.state === 'REASSESS' && <ReassessScreen session={session} dispatch={dispatch} />}
        {session.state === 'STABILIZED' && <StabilizedScreen onReset={handleReset} session={session} />}
      </div>
    </div>
  );
}

// ─── TRIAGE SCREEN ───────────────────────────────────────────
function TriageScreen({ session, dispatch }: { session: ResusSession; dispatch: (t: string, v: string) => void }) {
  const question = getTriageQuestion(session);
  if (!question) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
      <div className="text-center">
        <p className="text-zinc-400 text-sm mb-2">TRIAGE</p>
        <h2 className="text-3xl font-black">{question.text}</h2>
      </div>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        {question.options.map(opt => (
          <button
            key={opt.value}
            onClick={() => dispatch(question.id, opt.value)}
            className={cn(
              'py-6 px-8 rounded-2xl text-2xl font-black transition-all active:scale-95',
              opt.color === 'green' && 'bg-emerald-600 hover:bg-emerald-500 text-white',
              opt.color === 'red' && 'bg-red-600 hover:bg-red-500 text-white',
              opt.color === 'yellow' && 'bg-amber-600 hover:bg-amber-500 text-white',
              opt.color === 'orange' && 'bg-orange-600 hover:bg-orange-500 text-white',
              !opt.color && 'bg-zinc-700 hover:bg-zinc-600 text-white',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── IDENTIFY SCREEN ─────────────────────────────────────────
function IdentifyScreen({ dispatch }: { dispatch: (t: string, v: string) => void }) {
  return (
    <div className="flex-1 flex flex-col p-4 gap-4">
      <div className="text-center py-4">
        <p className="text-zinc-400 text-sm mb-1">IDENTIFY</p>
        <h2 className="text-2xl font-black">What do you see?</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 max-w-md mx-auto w-full">
        {identifyOptions.map(opt => (
          <button
            key={opt.id}
            onClick={() => dispatch('pathway', opt.id)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-left hover:bg-zinc-700 hover:border-zinc-500 transition-all active:scale-[0.98] flex items-center gap-4"
          >
            <span className="text-3xl">{opt.icon}</span>
            <div>
              <p className="font-bold text-white">{opt.label}</p>
              <p className="text-xs text-zinc-400">{opt.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── CLARIFY SCREEN ──────────────────────────────────────────
function ClarifyScreen({ session, dispatch }: { session: ResusSession; dispatch: (t: string, v: string) => void }) {
  const pathway = session.pathwayId ? pathwayRegistry.get(session.pathwayId) : null;
  if (!pathway?.clarifyingQuestions) return null;

  // Find first unanswered question
  const question = pathway.clarifyingQuestions.find(q => session.clarifyAnswers[q.id] === undefined);
  if (!question) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
      <div className="text-center">
        <p className="text-zinc-400 text-sm mb-2">{pathway.icon} {pathway.name}</p>
        <h2 className="text-2xl font-black">{question.text}</h2>
      </div>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        {question.options.map(opt => (
          <button
            key={opt.value}
            onClick={() => dispatch(question.id, opt.value)}
            className="py-5 px-6 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-500 text-lg font-bold transition-all active:scale-[0.98]"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── INTERVENTION SCREEN ─────────────────────────────────────
function InterventionScreen({
  session,
  dispatch,
  showDetail,
  setShowDetail,
}: {
  session: ResusSession;
  dispatch: (t: string, v: string) => void;
  showDetail: boolean;
  setShowDetail: (v: boolean) => void;
}) {
  const steps = getCurrentSteps(session, pathwayRegistry);
  const step = getCurrentStep(session, pathwayRegistry);
  const timer = useTimer(step?.timer);

  if (!step) {
    // All steps done, move to stabilized
    dispatch('step_done', '__final__');
    return null;
  }

  const weight = session.patientWeight;
  const doseInfo = step.dose ? calculateDose(step.dose, weight) : null;

  return (
    <div className="flex-1 flex flex-col p-4 gap-4">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 transition-all duration-500"
            style={{ width: `${((session.currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-zinc-500">
          {session.currentStepIndex + 1}/{steps.length}
        </span>
      </div>

      {/* Action Card */}
      <Card className={cn(
        'border-2 flex-1',
        step.critical ? 'bg-red-950/50 border-red-600' : 'bg-zinc-900 border-zinc-700'
      )}>
        <CardContent className="p-6 flex flex-col gap-4 h-full">
          {step.critical && (
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
              🔴 Critical Action
            </span>
          )}

          <h2 className="text-2xl font-black leading-tight">{step.action}</h2>

          {/* Dose calculation */}
          {doseInfo && (
            <div className="bg-zinc-800/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">{step.dose!.drug}</span>
                <span className="text-xs text-zinc-500">{step.dose!.route}</span>
              </div>
              <p className="text-xl font-black text-amber-400">{doseInfo.calculatedDose}</p>
              {weight ? (
                <p className="text-xs text-zinc-500">Based on {weight.toFixed(1)} kg</p>
              ) : (
                <p className="text-xs text-amber-500">⚠ No weight — showing per-kg dose</p>
              )}
              {doseInfo.preparation && (
                <p className="text-xs text-zinc-400 mt-1">{doseInfo.preparation}</p>
              )}
              {step.dose!.frequency && (
                <p className="text-xs text-zinc-400">{step.dose!.frequency}</p>
              )}
              {step.dose!.maxDose && (
                <p className="text-xs text-zinc-500">Max: {step.dose!.maxDose} {step.dose!.unit}</p>
              )}
            </div>
          )}

          {/* Detail (expandable) */}
          {step.detail && (
            <div>
              {!showDetail ? (
                <button
                  onClick={() => setShowDetail(true)}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  ℹ Show details
                </button>
              ) : (
                <div className="bg-zinc-800/50 rounded-lg p-3 text-sm text-zinc-300 leading-relaxed">
                  {step.detail}
                  <button
                    onClick={() => setShowDetail(false)}
                    className="block text-xs text-zinc-500 mt-2"
                  >
                    Hide
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Timer */}
          {step.timer && (
            <div className="mt-auto">
              {timer.isRunning ? (
                <div className="text-center">
                  <p className="text-4xl font-mono font-bold text-amber-400">
                    {formatTime(timer.remaining!)}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {step.reassess || 'Reassess when timer completes'}
                  </p>
                </div>
              ) : timer.remaining === 0 ? (
                <div className="text-center">
                  <p className="text-lg font-bold text-amber-400">⏰ Time to reassess</p>
                  <p className="text-sm text-zinc-400">{step.reassess}</p>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={timer.start}
                  className="w-full border-amber-600 text-amber-400 hover:bg-amber-600/20"
                >
                  ⏱ Start Timer ({formatTime(step.timer)})
                </Button>
              )}
            </div>
          )}

          {/* Escalation warning */}
          {step.escalateIf && (
            <p className="text-xs text-orange-400 mt-2">
              ⚡ Escalate if: {step.escalateIf}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => dispatch('step_done', step.id)}
          className="flex-1 py-6 text-lg font-black bg-emerald-600 hover:bg-emerald-500"
        >
          ✓ DONE — NEXT
        </Button>
      </div>
    </div>
  );
}

// ─── REASSESS SCREEN ─────────────────────────────────────────
function ReassessScreen({ session, dispatch }: { session: ResusSession; dispatch: (t: string, v: string) => void }) {
  const step = getCurrentStep(session, pathwayRegistry);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
      <div className="text-center">
        <p className="text-amber-400 text-sm font-bold mb-2">REASSESS</p>
        <h2 className="text-2xl font-black">{step?.reassess || 'Is the patient improving?'}</h2>
      </div>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={() => dispatch('improving', 'yes')}
          className="py-6 px-8 rounded-2xl text-xl font-black bg-emerald-600 hover:bg-emerald-500 transition-all active:scale-95"
        >
          ✓ YES — Improving
        </button>
        <button
          onClick={() => dispatch('improving', 'no')}
          className="py-6 px-8 rounded-2xl text-xl font-black bg-red-600 hover:bg-red-500 transition-all active:scale-95"
        >
          ✕ NO — Not improving
        </button>
      </div>
      {step?.escalateIf && (
        <p className="text-sm text-orange-400 text-center max-w-sm">
          ⚡ If not improving: {step.escalateIf}
        </p>
      )}
    </div>
  );
}

// ─── STABILIZED SCREEN ───────────────────────────────────────
function StabilizedScreen({ onReset, session }: { onReset: () => void; session: ResusSession }) {
  const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
  const pathway = session.pathwayId ? pathwayRegistry.get(session.pathwayId) : null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
      <div className="text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-3xl font-black text-emerald-400">Protocol Complete</h2>
        <p className="text-zinc-400 mt-2">
          {pathway?.name} — {session.completedSteps.length} steps completed
        </p>
        <p className="text-zinc-500 text-sm mt-1">
          Total time: {formatTime(elapsed)}
        </p>
      </div>

      <Card className="w-full max-w-md bg-zinc-900 border-zinc-700">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm text-zinc-400 mb-2">Next Steps</h3>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li>• Continue monitoring vital signs</li>
            <li>• Document interventions and times</li>
            <li>• Arrange definitive care / transfer</li>
            <li>• Debrief with team</li>
          </ul>
        </CardContent>
      </Card>

      {/* Event log */}
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-700">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm text-zinc-400 mb-2">Event Log</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {session.events.map((evt, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <span className="text-zinc-600 font-mono shrink-0">
                  {formatTime(Math.floor((evt.timestamp - session.startTime) / 1000))}
                </span>
                <span className="text-zinc-400">{evt.detail}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={onReset} className="w-full max-w-md py-4 text-lg font-bold">
        Start New Case
      </Button>
    </div>
  );
}
