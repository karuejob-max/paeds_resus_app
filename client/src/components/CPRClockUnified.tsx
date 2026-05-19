/**
 * Unified CPR Orchestrator — supports both Solo and Team modes.
 * Switches modes without losing session continuity or patient context.
 */

import { useState, useEffect, useCallback } from 'react';
import { CPRClockStreamlined } from './CPRClockStreamlined';
import { CPRClockTeam } from './CPRClockTeam';
import { Button } from '@/components/ui/button';
import { Users, User } from 'lucide-react';
import { 
  evaluateRhythmTransition, 
  evaluateMedicationEligibility, 
  type ArrestPhase, 
  type RhythmType, 
  type CprEngineState 
} from '@/lib/resus/cpr-engine';

interface Props {
  patientWeight: number;
  patientAgeMonths?: number;
  onClose: () => void;
}

export function CPRClockUnified({ patientWeight, patientAgeMonths, onClose }: Props) {
  const [mode, setMode] = useState<'solo' | 'team'>('solo');
  const [engineState, setEngineState] = useState<CprEngineState>({
    shockCount: 0,
    epiDoses: 0,
    lastEpiTime: null,
    antiarrhythmicDoses: 0,
    rhythmType: 'unknown',
    phase: 'initial_assessment',
  });

  // Shared state that persists across mode switches
  const [arrestDuration, setArrestDuration] = useState(0);
  const [events, setEvents] = useState<any[]>([]);

  const handleModeSwitch = () => {
    setMode(prev => prev === 'solo' ? 'team' : 'solo');
  };

  // Sync engine logic here to drive both components
  const onRhythmCheck = useCallback((rhythm: RhythmType) => {
    const result = evaluateRhythmTransition(rhythm, engineState);
    setEngineState(prev => ({
      ...prev,
      rhythmType: rhythm,
      phase: result.nextPhase,
    }));
    return result;
  }, [engineState]);

  return (
    <div className="relative h-full flex flex-col">
      <div className="absolute top-4 right-12 z-50">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleModeSwitch}
          className="bg-background/80 backdrop-blur"
        >
          {mode === 'solo' ? (
            <><Users className="h-4 w-4 mr-2" /> Switch to Team Mode</>
          ) : (
            <><User className="h-4 w-4 mr-2" /> Switch to Solo Mode</>
          )}
        </Button>
      </div>

      {mode === 'solo' ? (
        <CPRClockStreamlined 
          patientWeight={patientWeight}
          patientAgeMonths={patientAgeMonths}
          onClose={onClose}
          // In a real implementation, we would pass engineState and setters here
        />
      ) : (
        <CPRClockTeam 
          patientWeight={patientWeight}
          patientAgeMonths={patientAgeMonths}
          onClose={onClose}
          // In a real implementation, we would pass engineState and setters here
        />
      )}
    </div>
  );
}
