/**
 * Unified CPR-GPS Orchestrator — supports both Solo and Team modes.
 * Switches modes without losing session continuity or patient context.
 */

import { useEffect, useState } from 'react';
import { CPRClockStreamlined } from './CPRClockStreamlined';
import { CPRClockTeam } from './CPRClockTeam';
import { Button } from '@/components/ui/button';
import { Users, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CprClockSharedProvider } from '@/components/cpr/CprClockSharedContext';
import { useCprClockShared } from '@/components/cpr/CprClockSharedContext';
import type { LifeSupportPackResult } from '@/lib/resus/cpr-pack-resolver';

interface Props {
  patientWeight: number;
  patientAgeMonths?: number;
  onClose: () => void;
  onResume?: () => void;
  /** Parent ResusGPS case key for local CPR recovery; not a patient identifier. */
  caseKey?: string;
  /** Canonical IERS activation identifier; opaque operational linkage only. */
  activationEventId?: number;
  /** Parent ResusGPS timer — avoids duplicate arrest clocks */
  externalElapsed?: number;
  externalRunning?: boolean;
  /** Skip READY / START CPR when arrest already running in ResusGPS */
  autoStart?: boolean;
  lifeSupportPack?: LifeSupportPackResult;
  /** Return ROSC and the server CPR session ID to the parent flow for post-cardiac-arrest care and debrief. */
  onROSC?: (cprSessionId?: number) => void;
  /** Notify the parent when the server CPR session exists so an IERS link can be created. */
  onSessionReady?: (cprSessionId: number) => void;
  /** Open the parent completion/debrief path after a deliberate terminal outcome. */
  onCodeComplete?: (cprSessionId: number | undefined, outcome: 'mortality' | 'transferred' | 'unknown') => void;
  /** Team mode is opt-in only after separate clinical review; the safe default is one Solo surface. */
  allowModeSwitch?: boolean;
  /** The integrated flow owns demographics in ResusGPS. */
  allowPatientInfoEdit?: boolean;
  /** Keep CPR state mounted while showing a deliberate non-terminal pause surface. */
  paused?: boolean;
}

function CPRClockUnifiedInner({
  patientWeight,
  patientAgeMonths,
  caseKey,
  activationEventId,
  onClose,
  onResume,
  externalElapsed,
  externalRunning,
  autoStart,
  lifeSupportPack,
  onROSC,
  onSessionReady,
  onCodeComplete,
  allowModeSwitch = false,
  allowPatientInfoEdit = true,
  paused = false,
}: Props) {
  const shared = useCprClockShared();
  const [mode, setMode] = useState<'solo' | 'team'>('solo');

  useEffect(() => {
    if (paused) shared?.setIsRunning(false);
  }, [paused, shared]);

  const commonProps = {
    patientWeight,
    patientAgeMonths,
    caseKey,
    activationEventId,
    onClose,
    externalElapsed,
    externalRunning,
    autoStart,
    lifeSupportPack,
    onROSC,
    onSessionReady,
    onCodeComplete,
    allowPatientInfoEdit,
    paused,
    useSharedState: true as const,
  };

  return (
    <div className="relative h-full flex flex-col min-h-[80vh]">
      {paused && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 p-4" role="dialog" aria-modal="true" aria-labelledby="cpr-paused-title">
          <div className="w-full max-w-md rounded-xl border border-amber-400/70 bg-slate-950 p-6 text-white shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-300">CPR-GPS paused</p>
            <h2 id="cpr-paused-title" className="mt-2 text-xl font-bold">Active arrest state preserved</h2>
            <p className="mt-3 text-sm leading-6 text-slate-200">The arrest timer, cycle, medication history, and team state are preserved. This is not a safe or completed state.</p>
            <Button onClick={() => { onResume?.(); shared?.setIsRunning(true); }} className="mt-5 min-h-12 w-full bg-red-600 text-base font-bold hover:bg-red-700" aria-label="Resume CPR-GPS">
              Resume CPR-GPS
            </Button>
          </div>
        </div>
      )}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between gap-2 flex-wrap">
        {lifeSupportPack && !autoStart && (
          <Badge variant="outline" className="bg-background/80 backdrop-blur text-xs">
            {lifeSupportPack.pack}: {lifeSupportPack.label}
          </Badge>
        )}
        {allowModeSwitch && !paused && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMode((prev) => (prev === 'solo' ? 'team' : 'solo'))}
            className="bg-background/80 backdrop-blur ml-auto"
          >
            {mode === 'solo' ? (
              <>
                <Users className="h-4 w-4 mr-2" /> Switch to Team Mode
              </>
            ) : (
              <>
                <User className="h-4 w-4 mr-2" /> Switch to Solo Mode
              </>
            )}
          </Button>
        )}
      </div>

      {mode === 'solo' ? (
        <CPRClockStreamlined {...commonProps} />
      ) : (
        <CPRClockTeam {...commonProps} />
      )}
    </div>
  );
}

export function CPRClockUnified(props: Props) {
  return (
    <CprClockSharedProvider
      initialArrestDuration={props.externalElapsed ?? 0}
      initialRunning={props.autoStart ?? false}
    >
      <CPRClockUnifiedInner {...props} />
    </CprClockSharedProvider>
  );
}
