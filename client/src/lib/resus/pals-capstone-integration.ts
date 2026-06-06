/**
 * PALS Capstone Integration with Course System
 * 
 * This module handles the integration between the PALS Capstone Simulation
 * and the main course enrollment system, including:
 * 1. Marking cognitive modules as complete
 * 2. Issuing "Sim-Ready" badge
 * 3. Updating enrollment status
 * 4. Triggering certificate generation
 */

export interface PalsCapstoneCompletionData {
  enrollmentId: number;
  providerId: number;
  score: number;
  simReady: boolean;
  certificateId: string;
  completedAt: Date;
  metadata: {
    abcdeAssessmentCorrect: boolean;
    oxygenInterventionCorrect: boolean;
    shockAssessmentCorrect: boolean;
    fluidResuscitationCorrect: boolean;
    cprExecutionCorrect: boolean;
    roscAchievedCorrect: boolean;
    postResuscitationCareCorrect: boolean;
  };
}

/**
 * Hook to be called when learner completes the PALS Capstone simulation
 * This should be called from the PalsCapstoneSimulation component
 * 
 * Expected flow:
 * 1. Learner completes simulation
 * 2. Score calculated (must be ≥80% to pass)
 * 3. This hook is called with completion data
 * 4. Backend updates enrollment: cognitiveModulesComplete = true
 * 5. Certificate is generated with "Sim-Ready" badge (if applicable)
 * 6. Learner is redirected to certificate download page
 */
export async function recordPalsCapstoneCompletion(
  data: PalsCapstoneCompletionData,
  trpcMutation: any // This would be the actual tRPC mutation
): Promise<{
  success: boolean;
  message: string;
  certificateUrl?: string;
  error?: string;
}> {
  try {
    // Call backend to update enrollment
    const result = await trpcMutation.mutateAsync({
      enrollmentId: data.enrollmentId,
      score: data.score,
      simReady: data.simReady,
      certificateId: data.certificateId,
      completedAt: data.completedAt,
      metadata: data.metadata,
    });

    return {
      success: true,
      message: data.simReady
        ? 'Congratulations! You passed the PALS Capstone Simulation and earned the "Sim-Ready" badge.'
        : 'You completed the PALS Capstone Simulation. Your score is below 80%. Please retake the simulation to earn the "Sim-Ready" badge.',
      certificateUrl: result.certificateUrl,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to record simulation completion.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate the tRPC mutation payload for recording completion
 * This is the shape of data that should be sent to the backend
 */
export function generateCompletionPayload(
  enrollmentId: number,
  providerId: number,
  score: number,
  simReady: boolean,
  certificateId: string,
  metadata: PalsCapstoneCompletionData['metadata']
): PalsCapstoneCompletionData {
  return {
    enrollmentId,
    providerId,
    score,
    simReady,
    certificateId,
    completedAt: new Date(),
    metadata,
  };
}

/**
 * Validate completion data before sending to backend
 */
export function validateCompletionData(
  data: PalsCapstoneCompletionData
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.enrollmentId || data.enrollmentId <= 0) {
    errors.push('Invalid enrollmentId');
  }

  if (!data.providerId || data.providerId <= 0) {
    errors.push('Invalid providerId');
  }

  if (data.score < 0 || data.score > 100) {
    errors.push('Score must be between 0 and 100');
  }

  if (!data.certificateId) {
    errors.push('Missing certificateId');
  }

  if (!data.completedAt) {
    errors.push('Missing completedAt timestamp');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Map simulation actions to metadata for analytics
 */
export function mapActionsToMetadata(
  actions: Record<string, boolean>
): PalsCapstoneCompletionData['metadata'] {
  return {
    abcdeAssessmentCorrect: actions.abcde_assessment || false,
    oxygenInterventionCorrect: actions.oxygen_intervention || false,
    shockAssessmentCorrect: actions.shock_assessment || false,
    fluidResuscitationCorrect: actions.fluid_resuscitation || false,
    cprExecutionCorrect: actions.cpr_execution || false,
    roscAchievedCorrect: actions.rosc_achievement || false,
    postResuscitationCareCorrect: actions.post_resuscitation_care || false,
  };
}

/**
 * Calculate pass/fail based on score
 */
export function calculatePassStatus(score: number): {
  passed: boolean;
  simReady: boolean;
  message: string;
} {
  const passed = score >= 80;
  const simReady = passed;

  return {
    passed,
    simReady,
    message: passed
      ? `Excellent! You scored ${score}%. You are now "Sim-Ready" and can use ResusGPS at the bedside.`
      : `You scored ${score}%. You need to score at least 80% to pass. Please retake the simulation.`,
  };
}

/**
 * Generate analytics event for simulation completion
 */
export function generateAnalyticsEvent(
  data: PalsCapstoneCompletionData,
  eventType: 'simulation_started' | 'simulation_completed' | 'simulation_passed' | 'simulation_failed'
): Record<string, any> {
  const baseEvent = {
    eventType,
    enrollmentId: data.enrollmentId,
    providerId: data.providerId,
    timestamp: new Date().toISOString(),
  };

  switch (eventType) {
    case 'simulation_started':
      return baseEvent;

    case 'simulation_completed':
      return {
        ...baseEvent,
        score: data.score,
        simReady: data.simReady,
        certificateId: data.certificateId,
      };

    case 'simulation_passed':
      return {
        ...baseEvent,
        score: data.score,
        certificateId: data.certificateId,
        metadata: data.metadata,
      };

    case 'simulation_failed':
      return {
        ...baseEvent,
        score: data.score,
        failedAreas: Object.entries(data.metadata)
          .filter(([, correct]) => !correct)
          .map(([key]) => key),
      };

    default:
      return baseEvent;
  }
}
