/**
 * Shared CPR session state for Solo ↔ Team mode switches (CPRClockUnified).
 */

import { createContext, useContext, type ReactNode, useMemo, useState, useCallback } from 'react';
import type { CprEngineState, RhythmType } from '@/lib/resus/cpr-engine';

export interface CprArrestEvent {
  id: string;
  timestamp: number;
  action: string;
  details?: string;
  performedBy?: string;
}

export interface CprClockSharedValue {
  engineState: CprEngineState;
  setEngineState: React.Dispatch<React.SetStateAction<CprEngineState>>;
  arrestDuration: number;
  setArrestDuration: React.Dispatch<React.SetStateAction<number>>;
  cycleTime: number;
  setCycleTime: React.Dispatch<React.SetStateAction<number>>;
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  events: CprArrestEvent[];
  addEvent: (action: string, details?: string) => void;
  roscAchieved: boolean;
  setRoscAchieved: React.Dispatch<React.SetStateAction<boolean>>;
  rhythmType: RhythmType | null;
  setRhythmType: React.Dispatch<React.SetStateAction<RhythmType | null>>;
}

const CprClockSharedContext = createContext<CprClockSharedValue | null>(null);

export function useCprClockShared(): CprClockSharedValue | null {
  return useContext(CprClockSharedContext);
}

const defaultEngineState: CprEngineState = {
  shockCount: 0,
  epiDoses: 0,
  lastEpiTime: null,
  antiarrhythmicDoses: 0,
  rhythmType: 'unknown',
  phase: 'initial_assessment',
};

export function CprClockSharedProvider({
  children,
  initialArrestDuration = 0,
  initialRunning = false,
}: {
  children: ReactNode;
  initialArrestDuration?: number;
  initialRunning?: boolean;
}) {
  const [engineState, setEngineState] = useState<CprEngineState>(defaultEngineState);
  const [arrestDuration, setArrestDuration] = useState(initialArrestDuration);
  const [cycleTime, setCycleTime] = useState(0);
  const [isRunning, setIsRunning] = useState(initialRunning);
  const [events, setEvents] = useState<CprArrestEvent[]>([]);
  const [roscAchieved, setRoscAchieved] = useState(false);
  const [rhythmType, setRhythmType] = useState<RhythmType | null>(null);

  const addEvent = useCallback((action: string, details?: string) => {
    setEvents((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: arrestDuration,
        action,
        details,
      },
      ...prev,
    ]);
  }, [arrestDuration]);

  const value = useMemo<CprClockSharedValue>(
    () => ({
      engineState,
      setEngineState,
      arrestDuration,
      setArrestDuration,
      cycleTime,
      setCycleTime,
      isRunning,
      setIsRunning,
      events,
      addEvent,
      roscAchieved,
      setRoscAchieved,
      rhythmType,
      setRhythmType,
    }),
    [engineState, arrestDuration, cycleTime, isRunning, events, addEvent, roscAchieved, rhythmType]
  );

  return (
    <CprClockSharedContext.Provider value={value}>{children}</CprClockSharedContext.Provider>
  );
}
