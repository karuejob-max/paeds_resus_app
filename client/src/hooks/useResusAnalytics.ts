/**
 * useResusAnalytics Hook
 * 
 * Tracks ResusGPS clinical events for analytics and admin reports:
 * - Assessment start/completion
 * - Threat detection
 * - Intervention events
 * - Reassessment events
 * - Diagnosis selection
 */

import { useCallback, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';

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
  [key: string]: any;
}

export function useResusAnalytics() {
  const sessionIdRef = useRef<string>(
    (() => {
      // Generate or retrieve session ID
      let sessionId = sessionStorage.getItem('resus_session_id');
      if (!sessionId) {
        sessionId = `resus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('resus_session_id', sessionId);
      }
      return sessionId;
    })()
  );

  const trackEventMutation = trpc.events.trackEvent.useMutation();

  const trackEvent = useCallback(
    async (eventType: string, eventName: string, eventData?: ResusEventData) => {
      try {
        await trackEventMutation.mutateAsync({
          eventType,
          eventName,
          pageUrl: window.location.pathname,
          eventData: eventData || {},
          sessionId: sessionIdRef.current || '',
        });
      } catch (error) {
        // Silently fail - analytics should not break the app
        console.warn('[ResusAnalytics] Failed to track event:', error);
      }
    },
    [trackEventMutation]
  );

  return {
    // Assessment lifecycle events
    trackAssessmentStart: (patientAge?: string, patientWeight?: number) =>
      trackEvent('resus_assessment', 'Assessment Started', {
        patientAge,
        patientWeight,
      }),

    trackAssessmentCompleted: (totalThreats: number, interventionsCount: number) =>
      trackEvent('resus_assessment', 'Assessment Completed', {
        totalThreats,
        interventionsCount,
      }),

    // Letter progression events
    trackLetterStart: (letter: string) =>
      trackEvent('resus_letter', `Started ${letter} Assessment`, { letter }),

    trackLetterCompleted: (letter: string, threatsDetected: number) =>
      trackEvent('resus_letter', `Completed ${letter} Assessment`, {
        letter,
        threatsDetected,
      }),

    // Threat events
    trackThreatDetected: (threatType: string, severity: string) =>
      trackEvent('resus_threat', 'Threat Detected', {
        threatType,
        threatSeverity: severity,
      }),

    trackThreatResolved: (threatType: string) =>
      trackEvent('resus_threat', 'Threat Resolved', { threatType }),

    // Intervention events
    trackInterventionStarted: (interventionName: string, dose?: string) =>
      trackEvent('resus_intervention', 'Intervention Started', {
        interventionName,
        dose,
      }),

    trackInterventionCompleted: (interventionName: string, duration?: number) =>
      trackEvent('resus_intervention', 'Intervention Completed', {
        interventionName,
        duration,
      }),

    trackInterventionSkipped: (interventionName: string) =>
      trackEvent('resus_intervention', 'Intervention Skipped', { interventionName }),

    // Reassessment events
    trackReassessmentPerformed: (reassessmentType: string, outcome: string) =>
      trackEvent('resus_reassessment', 'Reassessment Performed', {
        reassessmentType,
        outcome,
      }),

    // Diagnosis events
    trackDiagnosisSelected: (diagnosis: string) =>
      trackEvent('resus_diagnosis', 'Diagnosis Selected', { diagnosis }),

    // Cardiac arrest events
    trackCardiacArrestTriggered: () =>
      trackEvent('resus_emergency', 'Cardiac Arrest Triggered'),

    trackROSCachieved: () =>
      trackEvent('resus_emergency', 'ROSC Achieved'),

    // Question answered events
    trackQuestionAnswered: (letter: string, questionId: string, answer: string) =>
      trackEvent('resus_question', 'Question Answered', {
        letter,
        questionId,
        answer,
      }),

    // Session info
    getSessionId: () => sessionIdRef.current,
  };
}
