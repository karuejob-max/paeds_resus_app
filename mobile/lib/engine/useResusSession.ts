/**
 * mobile/lib/engine/useResusSession.ts
 *
 * React Native hook that wires the full ABCDE engine to the mobile UI.
 *
 * Provides:
 *   - session state (ResusSession)
 *   - all engine action dispatchers
 *   - auto-persistence (every 5s via AsyncStorage)
 *   - resume detection on mount
 *   - SAMPLE history pre-fill
 *   - protocol tracking
 *
 * Usage:
 *   const { session, dispatch, isLoading, hasResumableCase } = useResusSession();
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createSession,
  updatePatientInfo,
  startQuickAssessment,
  answerQuickAssessment,
  answerPrimarySurvey,
  completeIntervention,
  startIntervention,
  markInterventionUnavailable,
  returnToPrimarySurvey,
  updateSAMPLE,
  triggerCardiacArrest,
  achieveROSC,
  acknowledgeSafetyAlert,
  type ResusSession,
  type SAMPLEHistory,
} from './index';
import {
  saveActiveSession,
  loadActiveSession,
  clearAllCaseData,
  saveSampleHistory,
  loadLastSampleHistory,
  saveProtocolsUsed,
  loadProtocolsUsed,
} from './persistence';

const PERSIST_INTERVAL_MS = 5000;

interface UseResusSessionReturn {
  session: ResusSession;
  isLoading: boolean;
  hasResumableCase: boolean;
  lastSample: SAMPLEHistory | null;
  protocolsUsed: string[];

  // Actions
  resumeCase: () => void;
  startFreshCase: (weight?: number, age?: string) => void;
  setPatientInfo: (weight: number | null, age: string | null) => void;
  beginQuickAssessment: () => void;
  answerQuick: (answer: 'sick' | 'not_sick') => void;
  answerSurvey: (questionId: string, value: string | number | boolean) => void;
  doCompleteIntervention: (id: string) => void;
  doStartIntervention: (id: string) => void;
  doMarkUnavailable: (id: string, alternative?: string) => void;
  doReturnToPrimarySurvey: () => void;
  doUpdateSAMPLE: (field: keyof SAMPLEHistory, value: string) => void;
  doTriggerCardiacArrest: () => void;
  doAchieveROSC: () => void;
  doAcknowledgeAlert: (alertId: string) => void;
  doTrackProtocol: (conditionId: string, stepsDone: number, totalSteps: number) => void;
  endCase: () => Promise<void>;
}

export function useResusSession(): UseResusSessionReturn {
  const [session, setSession] = useState<ResusSession>(() => createSession());
  const [isLoading, setIsLoading] = useState(true);
  const [hasResumableCase, setHasResumableCase] = useState(false);
  const [lastSample, setLastSample] = useState<SAMPLEHistory | null>(null);
  const [protocolsUsed, setProtocolsUsed] = useState<string[]>([]);
  const resumableSessionRef = useRef<ResusSession | null>(null);
  const persistTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [persisted, sample, protocols] = await Promise.all([
        loadActiveSession(),
        loadLastSampleHistory(),
        loadProtocolsUsed(),
      ]);

      if (persisted && persisted.phase !== 'IDLE') {
        resumableSessionRef.current = persisted;
        setHasResumableCase(true);
      }
      if (sample) setLastSample(sample);
      if (protocols.length) setProtocolsUsed(protocols);
      setIsLoading(false);
    })();
  }, []);

  // ── Auto-persist every 5s ──────────────────────────────────────────────────
  useEffect(() => {
    persistTimerRef.current = setInterval(() => {
      if (session.phase !== 'IDLE') {
        saveActiveSession(session);
      }
    }, PERSIST_INTERVAL_MS);
    return () => {
      if (persistTimerRef.current) clearInterval(persistTimerRef.current);
    };
  }, [session]);

  // ── Generic state updater ──────────────────────────────────────────────────
  const apply = useCallback((updater: (s: ResusSession) => ResusSession) => {
    setSession(prev => {
      const next = updater(prev);
      return next;
    });
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const resumeCase = useCallback(() => {
    if (resumableSessionRef.current) {
      setSession(resumableSessionRef.current);
      setHasResumableCase(false);
    }
  }, []);

  const startFreshCase = useCallback((weight?: number, age?: string) => {
    const fresh = createSession(weight ?? null, age ?? null);
    setSession(fresh);
    setHasResumableCase(false);
    saveActiveSession(fresh);
  }, []);

  const setPatientInfo = useCallback((weight: number | null, age: string | null) => {
    apply(s => updatePatientInfo(s, weight, age));
  }, [apply]);

  const beginQuickAssessment = useCallback(() => {
    apply(s => startQuickAssessment(s));
  }, [apply]);

  const answerQuick = useCallback((answer: 'sick' | 'not_sick') => {
    apply(s => answerQuickAssessment(s, answer));
  }, [apply]);

  const answerSurvey = useCallback((questionId: string, value: string | number | boolean) => {
    apply(s => answerPrimarySurvey(s, questionId, value as string));
  }, [apply]);

  const doCompleteIntervention = useCallback((id: string) => {
    apply(s => completeIntervention(s, id));
  }, [apply]);

  const doStartIntervention = useCallback((id: string) => {
    apply(s => startIntervention(s, id));
  }, [apply]);

  const doMarkUnavailable = useCallback((id: string, alternative?: string) => {
    apply(s => markInterventionUnavailable(s, id, alternative));
  }, [apply]);

  const doReturnToPrimarySurvey = useCallback(() => {
    apply(s => returnToPrimarySurvey(s));
  }, [apply]);

  const doUpdateSAMPLE = useCallback((field: keyof SAMPLEHistory, value: string) => {
    apply(s => updateSAMPLE(s, field, value));
  }, [apply]);

  const doTriggerCardiacArrest = useCallback(() => {
    apply(s => triggerCardiacArrest(s));
  }, [apply]);

  const doAchieveROSC = useCallback(() => {
    apply(s => achieveROSC(s));
  }, [apply]);

  const doAcknowledgeAlert = useCallback((alertId: string) => {
    apply(s => acknowledgeSafetyAlert(s, alertId));
  }, [apply]);

  const doTrackProtocol = useCallback((conditionId: string, stepsDone: number, totalSteps: number) => {
    const entry = `protocol:${conditionId}:${stepsDone}/${totalSteps}`;
    setProtocolsUsed(prev => {
      const updated = [...prev.filter(p => !p.startsWith(`protocol:${conditionId}:`)), entry];
      saveProtocolsUsed(updated);
      return updated;
    });
  }, []);

  const endCase = useCallback(async () => {
    // Save SAMPLE history before clearing
    if (session.sampleHistory) {
      await saveSampleHistory(session.sampleHistory);
      setLastSample(session.sampleHistory);
    }
    await clearAllCaseData();
    setSession(createSession());
    setProtocolsUsed([]);
  }, [session]);

  return {
    session,
    isLoading,
    hasResumableCase,
    lastSample,
    protocolsUsed,
    resumeCase,
    startFreshCase,
    setPatientInfo,
    beginQuickAssessment,
    answerQuick,
    answerSurvey,
    doCompleteIntervention,
    doStartIntervention,
    doMarkUnavailable,
    doReturnToPrimarySurvey,
    doUpdateSAMPLE,
    doTriggerCardiacArrest,
    doAchieveROSC,
    doAcknowledgeAlert,
    doTrackProtocol,
    endCase,
  };
}
