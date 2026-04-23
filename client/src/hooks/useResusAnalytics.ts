/**
 * useResusAnalytics Hook
 *
 * Tracks ResusGPS clinical events for analytics and admin reports:
 * - Assessment start/completion
 * - Threat detection
 * - Intervention events (including resource-unavailable gaps)
 * - Reassessment events
 * - Diagnosis selection
 *
 * Offline resilience (Phase 3.2):
 * Events are attempted immediately. If the network is unavailable or the
 * mutation fails, the event is written to IndexedDB via the syncQueue and
 * retried automatically when connectivity returns. Analytics failures NEVER
 * surface to the provider UI.
 */

import { useCallback, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';

// ── Lightweight offline queue (IndexedDB-backed) ──────────────────────────────
// We write directly to a simple key-value store rather than importing the full
// syncQueue module (which has a @ts-nocheck pragma and different API surface).

const QUEUE_STORE = 'analyticsQueue';
const DB_NAME = 'PaedsResusDB';
const DB_VERSION = 3; // bump to add analyticsQueue store

function openAnalyticsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      // Preserve all existing stores
      for (const name of ['pendingAssessments', 'clinicalData', 'drugData', 'resusSession']) {
        if (!db.objectStoreNames.contains(name)) {
          if (name === 'pendingAssessments') {
            const s = db.createObjectStore(name, { keyPath: 'id', autoIncrement: true });
            s.createIndex('timestamp', 'timestamp', { unique: false });
            s.createIndex('synced', 'synced', { unique: false });
          } else if (name === 'clinicalData') {
            const s = db.createObjectStore(name, { keyPath: 'key' });
            s.createIndex('timestamp', 'timestamp', { unique: false });
          } else if (name === 'drugData') {
            const s = db.createObjectStore(name, { keyPath: 'drugId' });
            s.createIndex('name', 'name', { unique: false });
          } else {
            db.createObjectStore(name, { keyPath: 'key' });
          }
        }
      }
      // New in v3: analytics offline queue
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const s = db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
        s.createIndex('ts', 'ts', { unique: false });
      }
    };
  });
}

interface QueuedEvent {
  id?: number;
  ts: number;
  eventType: string;
  eventName: string;
  pageUrl: string;
  eventData: Record<string, unknown>;
  sessionId: string;
}

async function enqueueAnalyticsEvent(event: Omit<QueuedEvent, 'id'>): Promise<void> {
  try {
    const db = await openAnalyticsDB();
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    tx.objectStore(QUEUE_STORE).add(event);
  } catch {
    // IndexedDB unavailable (private browsing) — drop silently
  }
}

async function drainAnalyticsQueue(
  send: (e: Omit<QueuedEvent, 'id' | 'ts'>) => Promise<void>
): Promise<void> {
  try {
    const db = await openAnalyticsDB();
    const all = await new Promise<QueuedEvent[]>((res) => {
      const tx = db.transaction(QUEUE_STORE, 'readonly');
      const req = tx.objectStore(QUEUE_STORE).getAll();
      req.onsuccess = () => res(req.result as QueuedEvent[]);
      req.onerror = () => res([]);
    });

    for (const item of all) {
      try {
        await send(item);
        // Delete on success
        const tx = db.transaction(QUEUE_STORE, 'readwrite');
        tx.objectStore(QUEUE_STORE).delete(item.id!);
      } catch {
        // Leave in queue for next retry
      }
    }
  } catch {
    // DB unavailable — skip drain
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface ResusEventData {
  letter?: string;
  threatType?: string;
  threatSeverity?: string;
  interventionName?: string;
  interventionStatus?: string;
  reassessmentType?: string;
  diagnosis?: string;
  patientAge?: string;
  patientWeight?: number;
  [key: string]: unknown;
}

export function useResusAnalytics() {
  const sessionIdRef = useRef<string>(
    (() => {
      let sessionId = sessionStorage.getItem('resus_session_id');
      if (!sessionId) {
        sessionId = `resus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('resus_session_id', sessionId);
      }
      return sessionId;
    })()
  );

  const trackEventMutation = trpc.events.trackEvent.useMutation();

  // ── Drain queued events when we come back online ───────────────────────────
  useEffect(() => {
    const drain = () => {
      void drainAnalyticsQueue(async (e) => {
        await trackEventMutation.mutateAsync({
          eventType: e.eventType,
          eventName: e.eventName,
          pageUrl: e.pageUrl,
          eventData: e.eventData,
          sessionId: e.sessionId,
        });
      });
    };

    window.addEventListener('online', drain);
    // Also drain on mount in case we were offline and just reloaded
    if (navigator.onLine) drain();

    return () => window.removeEventListener('online', drain);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Core track function ────────────────────────────────────────────────────
  const trackEvent = useCallback(
    async (eventType: string, eventName: string, eventData?: ResusEventData) => {
      const payload = {
        eventType,
        eventName,
        pageUrl: window.location.pathname,
        eventData: (eventData || {}) as Record<string, unknown>,
        sessionId: sessionIdRef.current || '',
      };

      try {
        await trackEventMutation.mutateAsync(payload);
      } catch {
        // Network failure — queue for retry instead of dropping the event
        void enqueueAnalyticsEvent({ ...payload, ts: Date.now() });
        console.warn('[ResusAnalytics] Event queued for offline retry:', eventName);
      }
    },
    [trackEventMutation]
  );

  return {
    // Assessment lifecycle
    trackAssessmentStart: (patientAge?: string, patientWeight?: number) =>
      trackEvent('resus_assessment', 'Assessment Started', { patientAge, patientWeight }),

    trackAssessmentCompleted: (
      phaseOrMetric?: string | number,
      elapsedOrSecondary?: number | string
    ) =>
      trackEvent('resus_assessment', 'Assessment Completed', {
        phase: phaseOrMetric,
        elapsedOrSecondary,
      }),

    // Letter progression
    trackLetterStart: (letter: string) =>
      trackEvent('resus_letter', `Started ${letter} Assessment`, { letter }),

    trackLetterCompleted: (letter: string, threatsDetected: number) =>
      trackEvent('resus_letter', `Completed ${letter} Assessment`, { letter, threatsDetected }),

    // Threat events
    trackThreatDetected: (threatType: string, severity: string) =>
      trackEvent('resus_threat', 'Threat Detected', { threatType, threatSeverity: severity }),

    trackThreatResolved: (threatType: string) =>
      trackEvent('resus_threat', 'Threat Resolved', { threatType }),

    // Intervention events
    trackInterventionStarted: (interventionName: string, dose?: string) =>
      trackEvent('resus_intervention', 'Intervention Started', { interventionName, dose }),

    trackInterventionCompleted: (interventionName: string, duration?: number) =>
      trackEvent('resus_intervention', 'Intervention Completed', { interventionName, duration }),

    trackInterventionSkipped: (interventionName: string) =>
      trackEvent('resus_intervention', 'Intervention Skipped', { interventionName }),

    // Resource gap capture (Care Signal feed)
    trackResourceUnavailable: (interventionName: string, facilityContext?: string) =>
      trackEvent('resus_resource_gap', 'Resource Unavailable', {
        interventionName,
        facilityContext: facilityContext ?? 'unknown',
      }),

    // Reassessment
    trackReassessmentPerformed: (reassessmentType?: string, outcome?: string) =>
      trackEvent('resus_reassessment', 'Reassessment Performed', {
        reassessmentType: reassessmentType ?? 'return_to_primary',
        outcome: outcome ?? 'n/a',
      }),

    // Diagnosis
    trackDiagnosisSelected: (diagnosis: string) =>
      trackEvent('resus_diagnosis', 'Diagnosis Selected', { diagnosis }),

    // Cardiac arrest
    trackCardiacArrestTriggered: () =>
      trackEvent('resus_emergency', 'Cardiac Arrest Triggered'),

    trackROSCachieved: () =>
      trackEvent('resus_emergency', 'ROSC Achieved'),

    // Question answered
    trackQuestionAnswered: (letter: string, questionId: string, answer: string) =>
      trackEvent('resus_question', 'Question Answered', { letter, questionId, answer }),

    // Session info
    getSessionId: () => sessionIdRef.current,
  };
}
