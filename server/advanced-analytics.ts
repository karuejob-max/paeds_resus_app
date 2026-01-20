/**
 * Advanced Analytics & Dashboards Service
 * Real-time dashboards, predictive analytics, custom metrics, and insights
 */

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  type: "executive" | "instructor" | "learner" | "admin" | "custom";
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
  createdBy: number;
  createdAt: number;
  updatedAt: number;
  isPublic: boolean;
}

export interface DashboardWidget {
  id: string;
  type: "chart" | "metric" | "table" | "gauge" | "map" | "timeline";
  title: string;
  dataSource: string;
  configuration: Record<string, unknown>;
  position: { x: number; y: number; width: number; height: number };
  refreshInterval?: number;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: "date-range" | "select" | "text" | "number-range";
  values: unknown[];
}

export interface Metric {
  id: string;
  name: string;
  description: string;
  formula: string;
  unit: string;
  category: string;
  currentValue: number;
  previousValue?: number;
  trend: "up" | "down" | "stable";
  trendPercentage: number;
  lastUpdated: number;
}

export interface PredictiveAnalytics {
  id: string;
  metric: string;
  prediction: number;
  confidence: number;
  forecastDate: number;
  factors: PredictiveFactor[];
  accuracy: number;
}

export interface PredictiveFactor {
  name: string;
  impact: number;
  direction: "positive" | "negative";
}

export interface CustomMetric {
  id: string;
  name: string;
  description: string;
  formula: string;
  dataType: "number" | "percentage" | "currency" | "duration";
  createdBy: number;
  createdAt: number;
  isActive: boolean;
}

export interface AnalyticsEvent {
  id: string;
  userId: number;
  eventType: string;
  eventData: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
  deviceId?: string;
}

export interface Cohort {
  id: string;
  name: string;
  description: string;
  criteria: CohortCriteria[];
  memberCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface CohortCriteria {
  field: string;
  operator: "equals" | "contains" | "gt" | "lt" | "between" | "in";
  value: unknown;
}

class AdvancedAnalyticsService {
  private dashboards: Map<string, Dashboard> = new Map();
  private metrics: Map<string, Metric> = new Map();
  private predictiveAnalytics: Map<string, PredictiveAnalytics> = new Map();
  private customMetrics: Map<string, CustomMetric> = new Map();
  private analyticsEvents: Map<string, AnalyticsEvent> = new Map();
  private cohorts: Map<string, Cohort> = new Map();

  /**
   * Create dashboard
   */
  createDashboard(dashboard: Omit<Dashboard, "id" | "createdAt" | "updatedAt">): Dashboard {
    const id = `dashboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const newDashboard: Dashboard = {
      ...dashboard,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.dashboards.set(id, newDashboard);
    return newDashboard;
  }

  /**
   * Get dashboard
   */
  getDashboard(dashboardId: string): Dashboard | null {
    return this.dashboards.get(dashboardId) || null;
  }

  /**
   * Add widget to dashboard
   */
  addWidget(dashboardId: string, widget: DashboardWidget): boolean {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return false;

    dashboard.widgets.push(widget);
    dashboard.updatedAt = Date.now();
    return true;
  }

  /**
   * Create metric
   */
  createMetric(metric: Omit<Metric, "id" | "lastUpdated">): Metric {
    const id = `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newMetric: Metric = {
      ...metric,
      id,
      lastUpdated: Date.now(),
    };

    this.metrics.set(id, newMetric);
    return newMetric;
  }

  /**
   * Get metric
   */
  getMetric(metricId: string): Metric | null {
    return this.metrics.get(metricId) || null;
  }

  /**
   * Update metric value
   */
  updateMetricValue(metricId: string, newValue: number): boolean {
    const metric = this.metrics.get(metricId);
    if (!metric) return false;

    metric.previousValue = metric.currentValue;
    metric.currentValue = newValue;
    metric.trendPercentage = metric.previousValue ? ((newValue - metric.previousValue) / metric.previousValue) * 100 : 0;
    metric.trend = newValue > (metric.previousValue || 0) ? "up" : newValue < (metric.previousValue || 0) ? "down" : "stable";
    metric.lastUpdated = Date.now();

    return true;
  }

  /**
   * Create predictive analytics
   */
  createPredictiveAnalytics(analytics: Omit<PredictiveAnalytics, "id">): PredictiveAnalytics {
    const id = `predict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newAnalytics: PredictiveAnalytics = {
      ...analytics,
      id,
    };

    this.predictiveAnalytics.set(id, newAnalytics);
    return newAnalytics;
  }

  /**
   * Create custom metric
   */
  createCustomMetric(metric: Omit<CustomMetric, "id" | "createdAt">): CustomMetric {
    const id = `custom-metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newMetric: CustomMetric = {
      ...metric,
      id,
      createdAt: Date.now(),
    };

    this.customMetrics.set(id, newMetric);
    return newMetric;
  }

  /**
   * Track analytics event
   */
  trackEvent(event: Omit<AnalyticsEvent, "id" | "timestamp">): AnalyticsEvent {
    const id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const analyticsEvent: AnalyticsEvent = {
      ...event,
      id,
      timestamp: Date.now(),
    };

    this.analyticsEvents.set(id, analyticsEvent);
    return analyticsEvent;
  }

  /**
   * Get events for user
   */
  getUserEvents(userId: number, startDate?: number, endDate?: number): AnalyticsEvent[] {
    let events = Array.from(this.analyticsEvents.values()).filter((e) => e.userId === userId);

    if (startDate) {
      events = events.filter((e) => e.timestamp >= startDate);
    }
    if (endDate) {
      events = events.filter((e) => e.timestamp <= endDate);
    }

    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Create cohort
   */
  createCohort(cohort: Omit<Cohort, "id" | "createdAt" | "updatedAt">): Cohort {
    const id = `cohort-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const newCohort: Cohort = {
      ...cohort,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.cohorts.set(id, newCohort);
    return newCohort;
  }

  /**
   * Get cohort
   */
  getCohort(cohortId: string): Cohort | null {
    return this.cohorts.get(cohortId) || null;
  }

  /**
   * Get all dashboards
   */
  getDashboards(): Dashboard[] {
    return Array.from(this.dashboards.values());
  }

  /**
   * Get all metrics
   */
  getMetrics(): Metric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get all custom metrics
   */
  getCustomMetrics(): CustomMetric[] {
    return Array.from(this.customMetrics.values());
  }

  /**
   * Get analytics statistics
   */
  getStatistics(): {
    totalDashboards: number;
    totalMetrics: number;
    totalCustomMetrics: number;
    totalEvents: number;
    totalCohorts: number;
    totalPredictions: number;
  } {
    const dashboards = Array.from(this.dashboards.values());
    const metrics = Array.from(this.metrics.values());
    const customMetrics = Array.from(this.customMetrics.values());
    const events = Array.from(this.analyticsEvents.values());
    const cohorts = Array.from(this.cohorts.values());
    const predictions = Array.from(this.predictiveAnalytics.values());

    return {
      totalDashboards: dashboards.length,
      totalMetrics: metrics.length,
      totalCustomMetrics: customMetrics.length,
      totalEvents: events.length,
      totalCohorts: cohorts.length,
      totalPredictions: predictions.length,
    };
  }
}

export const advancedAnalyticsService = new AdvancedAnalyticsService();
