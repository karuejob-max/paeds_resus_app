import { recordPerformanceMetric, getRecentPerformanceMetrics, getPerformanceMetricsByEndpoint, trackError, getRecentErrors, getCriticalErrors } from "../db";

/**
 * Performance monitoring and error tracking service
 * Tracks API performance, page load times, and errors
 */

export interface PerformanceMetricInput {
  metricType: string;
  metricName: string;
  value: number;
  unit?: string;
  endpoint?: string;
  statusCode?: number;
  severity?: "info" | "warning" | "critical";
}

export interface ErrorInput {
  userId?: number;
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  endpoint?: string;
  statusCode?: number;
  severity?: "low" | "medium" | "high" | "critical";
}

export interface PerformanceReport {
  period: string;
  metrics: {
    avgApiResponseTime: number;
    avgPageLoadTime: number;
    errorRate: number;
    criticalErrorCount: number;
    slowEndpoints: Array<{ endpoint: string; avgTime: number; requestCount: number }>;
    topErrors: Array<{ type: string; count: number; severity: string }>;
  };
  recommendations: string[];
}

/**
 * Record a performance metric
 */
export async function recordMetric(input: PerformanceMetricInput): Promise<void> {
  try {
    await recordPerformanceMetric({
      metricType: input.metricType,
      metricName: input.metricName,
      value: input.value,
      unit: input.unit || "ms",
      endpoint: input.endpoint || null,
      statusCode: input.statusCode || null,
      severity: input.severity || "info",
      createdAt: new Date()
    });
  } catch (error) {
    console.error("[Performance Service] Error recording metric:", error);
  }
}

/**
 * Record API response time
 */
export async function recordApiResponseTime(endpoint: string, responseTime: number, statusCode: number): Promise<void> {
  const severity = responseTime > 5000 ? "critical" : responseTime > 2000 ? "warning" : "info";
  
  await recordMetric({
    metricType: "api_response_time",
    metricName: `${endpoint} response time`,
    value: responseTime,
    unit: "ms",
    endpoint,
    statusCode,
    severity
  });
}

/**
 * Record page load time
 */
export async function recordPageLoadTime(pageUrl: string, loadTime: number): Promise<void> {
  const severity = loadTime > 5000 ? "critical" : loadTime > 3000 ? "warning" : "info";
  
  await recordMetric({
    metricType: "page_load_time",
    metricName: `${pageUrl} load time`,
    value: loadTime,
    unit: "ms",
    endpoint: pageUrl,
    severity
  });
}

/**
 * Track an error
 */
export async function recordError(input: ErrorInput): Promise<void> {
  try {
    await trackError({
      userId: input.userId || null,
      errorType: input.errorType,
      errorMessage: input.errorMessage,
      stackTrace: input.stackTrace || null,
      endpoint: input.endpoint || null,
      statusCode: input.statusCode || null,
      severity: input.severity || "medium",
      status: "new",
      occurrenceCount: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error("[Performance Service] Error tracking error:", error);
  }
}

/**
 * Record an API error
 */
export async function recordApiError(endpoint: string, statusCode: number, errorMessage: string, userId?: number): Promise<void> {
  const severity = statusCode >= 500 ? "critical" : statusCode >= 400 ? "high" : "medium";
  
  await recordError({
    userId,
    errorType: `HTTP ${statusCode}`,
    errorMessage,
    endpoint,
    statusCode,
    severity
  });
}

/**
 * Record a client error
 */
export async function recordClientError(errorType: string, errorMessage: string, stackTrace?: string, userId?: number): Promise<void> {
  await recordError({
    userId,
    errorType,
    errorMessage,
    stackTrace,
    severity: "high"
  });
}

/**
 * Get recent performance metrics
 */
export async function getRecentMetrics(limit = 100): Promise<any[]> {
  try {
    return await getRecentPerformanceMetrics(limit);
  } catch (error) {
    console.error("[Performance Service] Error getting recent metrics:", error);
    return [];
  }
}

/**
 * Get metrics for a specific endpoint
 */
export async function getEndpointMetrics(endpoint: string, limit = 50): Promise<any[]> {
  try {
    return await getPerformanceMetricsByEndpoint(endpoint, limit);
  } catch (error) {
    console.error("[Performance Service] Error getting endpoint metrics:", error);
    return [];
  }
}

/**
 * Get recent errors
 */
export async function getRecentErrorsReport(limit = 50): Promise<any[]> {
  try {
    return await getRecentErrors(limit);
  } catch (error) {
    console.error("[Performance Service] Error getting recent errors:", error);
    return [];
  }
}

/**
 * Get critical errors requiring immediate attention
 */
export async function getCriticalErrorsReport(): Promise<any[]> {
  try {
    return await getCriticalErrors();
  } catch (error) {
    console.error("[Performance Service] Error getting critical errors:", error);
    return [];
  }
}

/**
 * Calculate performance report
 */
export async function generatePerformanceReport(metrics: any[], errors: any[]): Promise<PerformanceReport> {
  // Calculate API response time statistics
  const apiMetrics = metrics.filter((m: any) => m.metricType === "api_response_time");
  const avgApiResponseTime = apiMetrics.length > 0
    ? Math.round(apiMetrics.reduce((sum: number, m: any) => sum + m.value, 0) / apiMetrics.length)
    : 0;

  // Calculate page load time statistics
  const pageMetrics = metrics.filter((m: any) => m.metricType === "page_load_time");
  const avgPageLoadTime = pageMetrics.length > 0
    ? Math.round(pageMetrics.reduce((sum: number, m: any) => sum + m.value, 0) / pageMetrics.length)
    : 0;

  // Calculate error rate
  const totalRequests = apiMetrics.length;
  const failedRequests = apiMetrics.filter((m: any) => m.statusCode >= 400).length;
  const errorRate = totalRequests > 0 ? Math.round((failedRequests / totalRequests) * 100) : 0;

  // Find slow endpoints
  const endpointMetrics: Record<string, { times: number[]; count: number }> = {};
  apiMetrics.forEach((m: any) => {
    if (m.endpoint) {
      if (!endpointMetrics[m.endpoint]) {
        endpointMetrics[m.endpoint] = { times: [], count: 0 };
      }
      endpointMetrics[m.endpoint].times.push(m.value);
      endpointMetrics[m.endpoint].count++;
    }
  });

  const slowEndpoints = Object.entries(endpointMetrics)
    .map(([endpoint, data]) => ({
      endpoint,
      avgTime: Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length),
      requestCount: data.count
    }))
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 5);

  // Find top errors
  const errorCounts: Record<string, { count: number; severity: string }> = {};
  errors.forEach((e: any) => {
    if (!errorCounts[e.errorType]) {
      errorCounts[e.errorType] = { count: 0, severity: e.severity };
    }
    errorCounts[e.errorType].count++;
  });

  const topErrors = Object.entries(errorCounts)
    .map(([type, data]) => ({
      type,
      count: data.count,
      severity: data.severity
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Count critical errors
  const criticalErrorCount = errors.filter((e: any) => e.severity === "critical").length;

  // Generate recommendations
  const recommendations: string[] = [];

  if (avgApiResponseTime > 2000) {
    recommendations.push(`API response time is ${avgApiResponseTime}ms. Optimize slow endpoints: ${slowEndpoints.map(e => e.endpoint).join(", ")}`);
  }

  if (avgPageLoadTime > 3000) {
    recommendations.push(`Page load time is ${avgPageLoadTime}ms. Implement code splitting, lazy loading, and caching.`);
  }

  if (errorRate > 5) {
    recommendations.push(`Error rate is ${errorRate}%. Investigate and fix top errors: ${topErrors.map(e => e.type).join(", ")}`);
  }

  if (criticalErrorCount > 0) {
    recommendations.push(`URGENT: ${criticalErrorCount} critical errors detected. Immediate investigation required.`);
  }

  return {
    period: new Date().toISOString(),
    metrics: {
      avgApiResponseTime,
      avgPageLoadTime,
      errorRate,
      criticalErrorCount,
      slowEndpoints,
      topErrors
    },
    recommendations
  };
}

/**
 * Check if performance is degraded
 */
export async function isPerformanceDegraded(metrics: any[]): Promise<boolean> {
  const apiMetrics = metrics.filter((m: any) => m.metricType === "api_response_time");
  if (apiMetrics.length === 0) return false;

  const avgResponseTime = apiMetrics.reduce((sum: number, m: any) => sum + m.value, 0) / apiMetrics.length;
  const slowRequests = apiMetrics.filter((m: any) => m.value > 5000).length;
  const slowPercentage = (slowRequests / apiMetrics.length) * 100;

  return avgResponseTime > 3000 || slowPercentage > 10;
}

/**
 * Alert on critical issues
 */
export async function checkAndAlertOnCriticalIssues(): Promise<string[]> {
  const alerts: string[] = [];

  try {
    const criticalErrors = await getCriticalErrorsReport();
    if (criticalErrors.length > 0) {
      alerts.push(`CRITICAL: ${criticalErrors.length} critical errors detected`);
    }

    const recentMetrics = await getRecentMetrics(100);
    if (await isPerformanceDegraded(recentMetrics)) {
      alerts.push("ALERT: Performance degradation detected");
    }
  } catch (error) {
    console.error("[Performance Service] Error checking critical issues:", error);
  }

  return alerts;
}
