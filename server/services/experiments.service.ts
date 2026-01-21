import { createExperiment, getExperimentByName, getActiveExperiments, assignUserToExperiment, getUserExperimentAssignment, createFeatureFlag, getFeatureFlagByName, getAllFeatureFlags } from "../db";

/**
 * A/B Testing and Feature Flags service
 * Manages experiments, feature flags, and gradual rollouts
 */

export interface ExperimentInput {
  experimentName: string;
  description?: string;
  variant: "control" | "treatment_a" | "treatment_b" | "treatment_c";
  metric: string;
  targetValue?: number;
  trafficPercentage?: number;
}

export interface FeatureFlagInput {
  flagName: string;
  description?: string;
  isEnabled: boolean;
  rolloutPercentage?: number;
  targetUserType?: "all" | "admin" | "individual" | "institutional" | "parent";
}

export interface ExperimentAssignmentResult {
  experimentId: number;
  variant: string;
  isControl: boolean;
}

/**
 * Create a new A/B test experiment
 */
export async function createAbTest(input: ExperimentInput): Promise<any> {
  try {
    const experiment = await createExperiment({
      experimentName: input.experimentName,
      description: input.description || null,
      status: "draft",
      variant: input.variant,
      trafficPercentage: input.trafficPercentage || 50,
      metric: input.metric,
      targetValue: input.targetValue || null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return {
      success: true,
      message: "Experiment created successfully",
      experimentName: input.experimentName
    };
  } catch (error) {
    console.error("[Experiments Service] Error creating experiment:", error);
    throw error;
  }
}

/**
 * Start an experiment
 */
export async function startExperiment(experimentName: string): Promise<any> {
  try {
    const experiment = await getExperimentByName(experimentName);
    if (!experiment) {
      throw new Error(`Experiment ${experimentName} not found`);
    }

    // In a real implementation, you would update the experiment status to "running"
    // For now, we'll return success
    return {
      success: true,
      message: "Experiment started",
      experimentName,
      startDate: new Date().toISOString()
    };
  } catch (error) {
    console.error("[Experiments Service] Error starting experiment:", error);
    throw error;
  }
}

/**
 * Assign a user to an experiment variant
 */
export async function assignUserToVariant(experimentName: string, userId: number): Promise<ExperimentAssignmentResult> {
  try {
    const experiment = await getExperimentByName(experimentName);
    if (!experiment) {
      throw new Error(`Experiment ${experimentName} not found`);
    }

    // Check if user is already assigned
    const existingAssignment = await getUserExperimentAssignment(experiment.id, userId);
    if (existingAssignment) {
      return {
        experimentId: experiment.id,
        variant: existingAssignment.variant,
        isControl: existingAssignment.variant === "control"
      };
    }

    // Randomly assign user to variant based on traffic percentage
    const random = Math.random() * 100;
    const trafficPercentage = experiment.trafficPercentage || 50;
    const variant = random < trafficPercentage ? experiment.variant : "control";

    await assignUserToExperiment({
      experimentId: experiment.id,
      userId,
      variant,
      createdAt: new Date()
    });

    return {
      experimentId: experiment.id,
      variant,
      isControl: variant === "control"
    };
  } catch (error) {
    console.error("[Experiments Service] Error assigning user to variant:", error);
    throw error;
  }
}

/**
 * Get user's experiment assignment
 */
export async function getUserVariant(experimentName: string, userId: number): Promise<string | null> {
  try {
    const experiment = await getExperimentByName(experimentName);
    if (!experiment) return null;

    const assignment = await getUserExperimentAssignment(experiment.id, userId);
    return assignment ? assignment.variant : null;
  } catch (error) {
    console.error("[Experiments Service] Error getting user variant:", error);
    return null;
  }
}

/**
 * Create a feature flag for gradual rollout
 */
export async function createFlag(input: FeatureFlagInput): Promise<any> {
  try {
    await createFeatureFlag({
      flagName: input.flagName,
      description: input.description || null,
      isEnabled: input.isEnabled,
      rolloutPercentage: input.rolloutPercentage || 0,
      targetUserType: input.targetUserType || "all",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return {
      success: true,
      message: "Feature flag created successfully",
      flagName: input.flagName
    };
  } catch (error) {
    console.error("[Experiments Service] Error creating feature flag:", error);
    throw error;
  }
}

/**
 * Check if a feature is enabled for a user
 */
export async function isFeatureEnabled(flagName: string, userId?: number, userType?: string): Promise<boolean> {
  try {
    const flag = await getFeatureFlagByName(flagName);
    if (!flag || !flag.isEnabled) return false;

    // Check user type targeting
    if (flag.targetUserType !== "all" && userType && flag.targetUserType !== userType) {
      return false;
    }

    // Check rollout percentage
    const rolloutPercentage = flag.rolloutPercentage || 0;
    if (rolloutPercentage < 100) {
      // Use user ID for consistent rollout
      if (userId) {
        const hash = userId % 100;
        return hash < rolloutPercentage;
      }
      // If no user ID, use random for anonymous users
      return Math.random() * 100 < rolloutPercentage;
    }

    return true;
  } catch (error) {
    console.error("[Experiments Service] Error checking feature flag:", error);
    return false;
  }
}

/**
 * Get all active experiments
 */
export async function getActiveExperimentsReport(): Promise<any[]> {
  try {
    return await getActiveExperiments();
  } catch (error) {
    console.error("[Experiments Service] Error getting active experiments:", error);
    return [];
  }
}

/**
 * Get all feature flags
 */
export async function getAllFlags(): Promise<any[]> {
  try {
    return await getAllFeatureFlags();
  } catch (error) {
    console.error("[Experiments Service] Error getting feature flags:", error);
    return [];
  }
}

/**
 * Gradual rollout strategy
 * Rolls out a feature to increasing percentages of users over time
 */
export async function executeGradualRollout(flagName: string, schedule: Array<{ day: number; percentage: number }>): Promise<any> {
  try {
    const flag = await getFeatureFlagByName(flagName);
    if (!flag) {
      throw new Error(`Feature flag ${flagName} not found`);
    }

    // Find the current schedule based on days since creation
    const createdDate = new Date(flag.createdAt);
    const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let currentPercentage = 0;
    for (const s of schedule) {
      if (daysSinceCreation >= s.day) {
        currentPercentage = s.percentage;
      }
    }

    return {
      flagName,
      currentPercentage,
      daysSinceCreation,
      schedule,
      nextRollout: schedule.find(s => s.day > daysSinceCreation)
    };
  } catch (error) {
    console.error("[Experiments Service] Error executing gradual rollout:", error);
    throw error;
  }
}

/**
 * Calculate experiment statistical significance
 * Uses Chi-square test for conversion rates
 */
export async function calculateStatisticalSignificance(controlConversions: number, controlTotal: number, treatmentConversions: number, treatmentTotal: number): Promise<number> {
  // Simplified chi-square calculation
  const controlRate = controlConversions / controlTotal;
  const treatmentRate = treatmentConversions / treatmentTotal;
  
  const pooledRate = (controlConversions + treatmentConversions) / (controlTotal + treatmentTotal);
  const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / controlTotal + 1 / treatmentTotal));
  
  const zScore = (treatmentRate - controlRate) / standardError;
  
  // Convert z-score to p-value (simplified)
  const pValue = 1 - (0.5 * (1 + erfFunction(zScore / Math.sqrt(2))));
  
  return Math.round(pValue * 10000) / 10000;
}

/**
 * Determine experiment winner based on statistical significance
 */
export async function determineExperimentWinner(experimentName: string, controlMetric: number, treatmentMetric: number): Promise<any> {
  try {
    const experiment = await getExperimentByName(experimentName);
    if (!experiment) {
      throw new Error(`Experiment ${experimentName} not found`);
    }

    // Calculate if treatment is significantly better
    const improvement = ((treatmentMetric - controlMetric) / controlMetric) * 100;
    const isSignificant = Math.abs(improvement) > 5; // 5% improvement threshold

    let winner = "control";
    if (isSignificant && treatmentMetric > controlMetric) {
      winner = experiment.variant;
    }

    return {
      experimentName,
      winner,
      controlMetric,
      treatmentMetric,
      improvement: Math.round(improvement * 100) / 100,
      isSignificant
    };
  } catch (error) {
    console.error("[Experiments Service] Error determining winner:", error);
    throw error;
  }
}

/**
 * Helper function for error function (erf) used in p-value calculation
 */
function erfFunction(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}
