/**
 * PALS Capstone Scoring & Certification Logic
 * 
 * This module handles:
 * 1. Score calculation and weighting
 * 2. "Sim-Ready" badge issuance
 * 3. Certificate generation with badge
 * 4. Course completion hooks
 */

export interface SimulationScore {
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  simReady: boolean;
  badge: SimReadyBadge;
  feedback: string;
}

export interface SimReadyBadge {
  title: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: Date;
}

export interface CertificateData {
  learnerName: string;
  learnerEmail: string;
  courseTitle: string;
  completionDate: Date;
  score: number;
  simReady: boolean;
  certificateId: string;
  qrCode: string;
}

/**
 * Scoring Rubric for PALS Capstone
 * 
 * Total: 100 points
 * - ABCDE Assessment: 10 points
 * - Oxygen/Airway Intervention: 10 points
 * - Shock Assessment: 15 points
 * - Fluid Resuscitation: 15 points
 * - CPR Execution: 20 points
 * - ROSC Achievement: 15 points
 * - Post-Resuscitation Care: 15 points
 */
export const SCORING_RUBRIC = {
  abcde_assessment: 10,
  oxygen_intervention: 10,
  shock_assessment: 15,
  fluid_resuscitation: 15,
  cpr_execution: 20,
  rosc_achievement: 15,
  post_resuscitation_care: 15,
  total: 100,
};

/**
 * Calculate final simulation score
 */
export function calculateSimulationScore(
  actions: Record<string, boolean>
): SimulationScore {
  let totalScore = 0;

  // Add points for each correct action
  if (actions.abcde_assessment) totalScore += SCORING_RUBRIC.abcde_assessment;
  if (actions.oxygen_intervention) totalScore += SCORING_RUBRIC.oxygen_intervention;
  if (actions.shock_assessment) totalScore += SCORING_RUBRIC.shock_assessment;
  if (actions.fluid_resuscitation) totalScore += SCORING_RUBRIC.fluid_resuscitation;
  if (actions.cpr_execution) totalScore += SCORING_RUBRIC.cpr_execution;
  if (actions.rosc_achievement) totalScore += SCORING_RUBRIC.rosc_achievement;
  if (actions.post_resuscitation_care) totalScore += SCORING_RUBRIC.post_resuscitation_care;

  const percentage = (totalScore / SCORING_RUBRIC.total) * 100;
  const passed = percentage >= 80; // 80% pass threshold
  const simReady = passed;

  const badge: SimReadyBadge = {
    title: simReady ? '🟢 SIM-READY' : '🟡 NEEDS REVIEW',
    description: simReady
      ? 'You are operationally ready for the bedside. You have demonstrated the ability to manage a pediatric cardiac arrest scenario using ResusGPS tools.'
      : 'You need to review weak areas and retake the simulation. Focus on the areas where you scored below 80%.',
    icon: simReady ? '✓' : '⚠',
    color: simReady ? 'emerald' : 'amber',
    earnedAt: new Date(),
  };

  const feedback = simReady
    ? `Excellent! You scored ${Math.round(percentage)}%. You are ready to use ResusGPS at the bedside. Your gatepass certificate now includes the "Sim-Ready" badge.`
    : `You scored ${Math.round(percentage)}%. You need to score at least 80% to earn the "Sim-Ready" badge. Review the feedback and retake the simulation.`;

  return {
    totalScore,
    maxScore: SCORING_RUBRIC.total,
    percentage: Math.round(percentage),
    passed,
    simReady,
    badge,
    feedback,
  };
}

/**
 * Generate certificate data with Sim-Ready badge
 */
export function generateCertificateData(
  learnerName: string,
  learnerEmail: string,
  score: SimulationScore,
  completionDate: Date = new Date()
): CertificateData {
  const certificateId = `PALS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const qrCode = `https://paedsresus.com/verify/${certificateId}`; // Placeholder

  return {
    learnerName,
    learnerEmail,
    courseTitle: 'PALS (Pediatric Advanced Life Support)',
    completionDate,
    score: score.percentage,
    simReady: score.simReady,
    certificateId,
    qrCode,
  };
}

/**
 * Format certificate for PDF generation
 */
export function formatCertificateForPdf(
  data: CertificateData
): string {
  const badgeText = data.simReady
    ? '✓ SIM-READY BADGE EARNED\nYou are operationally ready for the bedside.'
    : 'NEEDS REVIEW\nRetake the simulation to earn the Sim-Ready badge.';

  return `
PAEDS RESUS PLATFORM
CERTIFICATE OF COMPLETION

Learner: ${data.learnerName}
Email: ${data.learnerEmail}
Course: ${data.courseTitle}
Completion Date: ${data.completionDate.toLocaleDateString()}
Score: ${data.score}%
Certificate ID: ${data.certificateId}

${badgeText}

QR Code: ${data.qrCode}

This certificate is valid for 2 years from the date of issuance.
`;
}

/**
 * Hook to update course enrollment status
 * Called when learner completes the simulation with Sim-Ready badge
 */
export interface CourseCompletionHook {
  enrollmentId: number;
  courseId: number;
  providerId: number;
  score: number;
  simReady: boolean;
  completedAt: Date;
  certificateId: string;
}

/**
 * Generate course completion hook data
 */
export function generateCourseCompletionHook(
  enrollmentId: number,
  courseId: number,
  providerId: number,
  score: SimulationScore,
  certificateId: string
): CourseCompletionHook {
  return {
    enrollmentId,
    courseId,
    providerId,
    score: score.percentage,
    simReady: score.simReady,
    completedAt: new Date(),
    certificateId,
  };
}

/**
 * Validate if learner qualifies for "Sim-Ready" badge
 * Can be used for analytics and reporting
 */
export function isSimReady(score: SimulationScore): boolean {
  return score.simReady && score.percentage >= 80;
}

/**
 * Get detailed feedback for each scoring category
 */
export function getDetailedFeedback(
  actions: Record<string, boolean>
): Record<string, string> {
  return {
    abcde_assessment: actions.abcde_assessment
      ? '✓ Excellent ABCDE assessment. You correctly identified respiratory distress and poor perfusion.'
      : '✗ ABCDE assessment incomplete. Review the clinical findings and try again.',
    oxygen_intervention: actions.oxygen_intervention
      ? '✓ Appropriate oxygen/ventilatory support initiated. Confirm response and titrate to the selected age- and condition-specific target.'
      : '✗ Oxygen intervention incomplete. Treat hypoxaemia with age-, size-, and severity-appropriate support and reassess ventilation.',
    shock_assessment: actions.shock_assessment
      ? '✓ Correct shock type identified. You recognized hypovolemic/distributive shock.'
      : '✗ Shock assessment incorrect. Review the clinical clues and differentiate shock types.',
    fluid_resuscitation: actions.fluid_resuscitation
      ? '✓ Appropriate initial crystalloid aliquot given. Reassess perfusion, lungs, liver size, and work of breathing before further fluid.'
      : '✗ Fluid resuscitation incomplete. Use an age-, perfusion-, and setting-appropriate 10–20 mL/kg range only when indicated, then reassess.',
    cpr_execution: actions.cpr_execution
      ? '✓ Excellent CPR execution. Compressions at correct rate and depth, shock delivered, medication given.'
      : '✗ CPR execution issues. Review compression rate, depth, shock delivery, and medication timing.',
    rosc_achievement: actions.rosc_achievement
      ? '✓ ROSC achieved. Pulse restored, breathing spontaneous.'
      : '✗ ROSC not achieved. Continue CPR cycles and reassess.',
    post_resuscitation_care: actions.post_resuscitation_care
      ? '✓ Appropriate post-resuscitation care initiated: airway/ventilation, haemodynamic and temperature management, glucose, seizure surveillance, monitoring, and referral.'
      : '✗ Post-resuscitation care incomplete. Use the age-, condition-, neurological-status-, temperature-, and local-protocol-specific post-arrest pathway and arrange appropriate higher-level care.',
  };
}
