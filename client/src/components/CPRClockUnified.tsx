/**
 * Unified CPR Orchestrator — supports both Solo and Team modes.
 * Switches modes without losing session continuity or patient context.
 */

import { useState } from 'react';
import { CPRClockStreamlined } from './CPRClockStreamlined';
import { CPRClockTeam } from './CPRClockTeam';
import { Button } from '@/components/ui/button';
import { Users, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CprClockSharedProvider } from '@/components/cpr/CprClockSharedContext';
import type { LifeSupportPackResult } from '@/lib/resus/cpr-pack-resolver';

interface Props {
  patientWeight: number;
  patientAgeMonths?: number;
  onClose: () => void;
  /** Parent ResusGPS timer — avoids duplicate arrest clocks */
  externalElapsed?: number;
  externalRunning?: boolean;
  /** Skip READY / START CPR when arrest already running in ResusGPS */
  autoStart?: boolean;
  lifeSupportPack?: LifeSupportPackResult;
}

function CPRClockUnifiedInner({
  patientWeight,
  patientAgeMonths,
  onClose,
  externalElapsed,
  externalRunning,
  autoStart,
  lifeSupportPack,
}: Props) {
  const [mode, setMode] = useState<'solo' | 'team'>('solo');

  const commonProps = {
    patientWeight,
    patientAgeMonths,
    onClose,
    externalElapsed,
    externalRunning,
    autoStart,
    lifeSupportPack,
    useSharedState: true as const,
  };

  return (
    <div className="relative h-full flex flex-col min-h-[80vh]">
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between gap-2 flex-wrap">
        {lifeSupportPack && (
          <Badge variant="outline" className="bg-background/80 backdrop-blur text-xs">
            {lifeSupportPack.pack}: {lifeSupportPack.label}
          </Badge>
        )}
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
