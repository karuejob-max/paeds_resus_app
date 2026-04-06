import { trackAnalyticsEvent, getAnalyticsEventsByUserId, getAnalyticsEventsBySessionId, trackConversionFunnelEvent, getFunnelEventsBySessionId } from "../db";

/**
 * Comprehensive analytics and event tracking service
 * Tracks user behavior, funnels, and engagement metrics
 */

export interface EventData {
  userId?: number;
  eventType: string;
  eventName: string;
  pageUrl?: string;
  eventData?: Record<string, any>;
  sessionId?: string;
  duration?: number;
}

export interface FunnelEventData {
  userId: number;
  sessionId: string;
  funnelName: string;
  step: number;
  stepName: string;
  completedAt?: Date;
  droppedAt?: Date;
}

export interface AnalyticsMetrics {
  totalEvents: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  pageViews: number;
  buttonClicks: number;
  formSubmissions: number;
  conversionRate: number;
  topPages: Array<{ page: string; views: number }>;
  topEvents: Array<{ event: string; count: number }>;
}

export interface FunnelAnalysis {
  funnelName: string;
  totalEntries: number;
  completions: number;
  dropoffs: Array<{
    step: number;
    stepName: string;
    dropoffCount: number;
    dropoffRate: number;
  }>;
  conversionRate: number;
}

/**
 * Track a user event
 */
export async function trackEvent(eventData: EventData): Promise<void> {
  try {
    await trackAnalyticsEvent({
      userId: eventData.userId || null,
      eventType: eventData.eventType,
      eventName: eventData.eventName,
      pageUrl: eventData.pageUrl || null,
      eventData: eventData.eventData ? JSON.stringify(eventData.eventData) : null,
      sessionId: eventData.sessionId || null,
      duration: eventData.duration || null,
      createdAt: new Date()
    });
  } catch (error) {
    console.error("[Analytics Service] Error tracking event:", error);
    // Don't throw - analytics failures shouldn't break the app
  }
}

/**
 * Track page view
 */
export async function trackPageView(userId: number | undefined, pageUrl: string, sessionId: string): Promise<void> {
  await trackEvent({
    userId,
    eventType: "page_view",
    eventName: `View ${pageUrl}`,
    pageUrl,
    sessionId
  });
}

/**
 * Track button click
 */
export async function trackButtonClick(userId: number | undefined, buttonName: string, pageUrl: string, sessionId: string): Promise<void> {
  await trackEvent({
    userId,
    eventType: "button_click",
    eventName: `Click ${buttonName}`,
    pageUrl,
    eventData: { buttonName },
    sessionId
  });
}

/**
 * Track form submission
 */
export async function trackFormSubmission(userId: number | undefined, formName: string, pageUrl: string, sessionId: string, formData?: Record<string, any>): Promise<void> {
  await trackEvent({
    userId,
    eventType: "form_submit",
    eventName: `Submit ${formName}`,
    pageUrl,
    eventData: { formName, fieldCount: formData ? Object.keys(formData).length : 0 },
    sessionId
  });
}

/**
 * Track video play
 */
export async function trackVideoPlay(userId: number | undefined, videoName: string, pageUrl: string, sessionId: string): Promise<void> {
  await trackEvent({
    userId,
    eventType: "video_play",
    eventName: `Play ${videoName}`,
    pageUrl,
    eventData: { videoName },
    sessionId
  });
}

/**
 * Track course enrollment
 */
export async function trackCourseEnrollment(userId: number, courseType: string, coursePrice: number, sessionId: string): Promise<void> {
  await trackEvent({
    userId,
    eventType: "course_enrollment",
    eventName: `Enroll ${courseType}`,
    eventData: { courseType, coursePrice },
    sessionId
  });
}

/**
 * Track payment initiation
 */
export async function trackPaymentInitiation(userId: number, amount: number, paymentMethod: string, sessionId: string): Promise<void> {
  await trackEvent({
    userId,
    eventType: "payment_initiation",
    eventName: `Initiate payment ${paymentMethod}`,
    eventData: { amount, paymentMethod },
    sessionId
  });
}

/**
 * Track payment completion
 */
export async function trackPaymentCompletion(userId: number, amount: number, paymentMethod: string, transactionId: string, sessionId: string): Promise<void> {
  await trackEvent({
    userId,
    eventType: "payment_completion",
    eventName: `Complete payment ${paymentMethod}`,
    eventData: { amount, paymentMethod, transactionId },
    sessionId
  });
}

/**
 * Track funnel event (enrollment, payment, completion flow)
 */
export async function trackFunnelEvent(funnelData: FunnelEventData): Promise<void> {
  try {
    await trackConversionFunnelEvent({
      userId: funnelData.userId,
      sessionId: funnelData.sessionId,
      funnelName: funnelData.funnelName,
      step: funnelData.step,
      stepName: funnelData.stepName,
      completedAt: funnelData.completedAt || null,
      droppedAt: funnelData.droppedAt || null,
      createdAt: new Date()
    });
  } catch (error) {
    console.error("[Analytics Service] Error tracking funnel event:", error);
  }
}

/**
 * Get user's event history
 */
export async function getUserEventHistory(userId: number, limit = 100): Promise<any[]> {
  try {
    return await getAnalyticsEventsByUserId(userId, limit);
  } catch (error) {
    console.error("[Analytics Service] Error getting user event history:", error);
    return [];
  }
}

/**
 * Get session events
 */
export async function getSessionEvents(sessionId: string): Promise<any[]> {
  try {
    return await getAnalyticsEventsBySessionId(sessionId);
  } catch (error) {
    console.error("[Analytics Service] Error getting session events:", error);
    return [];
  }
}

/**
 * Analyze funnel performance
 */
export async function analyzeFunnel(funnelName: string, sessionEvents: any[]): Promise<FunnelAnalysis> {
  const funnelEvents = sessionEvents.filter((e: any) => e.funnelName === funnelName);
  
  if (funnelEvents.length === 0) {
    return {
      funnelName,
      totalEntries: 0,
      completions: 0,
      dropoffs: [],
      conversionRate: 0
    };
  }

  // Group events by step
  const stepCounts: Record<number, number> = {};
  const dropoffCounts: Record<number, number> = {};

  funnelEvents.forEach((event: any) => {
    stepCounts[event.step] = (stepCounts[event.step] || 0) + 1;
    if (event.droppedAt) {
      dropoffCounts[event.step] = (dropoffCounts[event.step] || 0) + 1;
    }
  });

  const totalEntries = Math.max(...Object.keys(stepCounts).map(Number).map(k => stepCounts[k]));
  const completions = stepCounts[Math.max(...Object.keys(stepCounts).map(Number))] || 0;

  // Calculate dropoffs
  const dropoffs = Object.entries(stepCounts).map(([step, count]) => ({
    step: Number(step),
    stepName: funnelEvents.find((e: any) => e.step === Number(step))?.stepName || `Step ${step}`,
    dropoffCount: dropoffCounts[Number(step)] || 0,
    dropoffRate: count > 0 ? Math.round((dropoffCounts[Number(step)] || 0) / count * 100) : 0
  }));

  return {
    funnelName,
    totalEntries,
    completions,
    dropoffs,
    conversionRate: totalEntries > 0 ? Math.round((completions / totalEntries) * 100) : 0
  };
}

/**
 * Calculate key analytics metrics
 */
export async function calculateAnalyticsMetrics(events: any[]): Promise<AnalyticsMetrics> {
  const uniqueUsers = new Set(events.filter((e: any) => e.userId).map((e: any) => e.userId)).size;
  const pageViews = events.filter((e: any) => e.eventType === "page_view").length;
  const buttonClicks = events.filter((e: any) => e.eventType === "button_click").length;
  const formSubmissions = events.filter((e: any) => e.eventType === "form_submit").length;
  const completedPayments = events.filter((e: any) => e.eventType === "payment_completion").length;
  const enrollments = events.filter((e: any) => e.eventType === "course_enrollment").length;

  // Calculate average session duration
  const sessionDurations = events
    .filter((e: any) => e.duration)
    .map((e: any) => e.duration);
  const averageSessionDuration = sessionDurations.length > 0
    ? Math.round(sessionDurations.reduce((a: number, b: number) => a + b, 0) / sessionDurations.length)
    : 0;

  // Top pages
  const pageViews_: Record<string, number> = {};
  events.filter((e: any) => e.pageUrl).forEach((e: any) => {
    pageViews_[e.pageUrl] = (pageViews_[e.pageUrl] || 0) + 1;
  });
  const topPages = Object.entries(pageViews_)
    .map(([page, views]) => ({ page, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Top events
  const eventCounts: Record<string, number> = {};
  events.forEach((e: any) => {
    eventCounts[e.eventName] = (eventCounts[e.eventName] || 0) + 1;
  });
  const topEvents = Object.entries(eventCounts)
    .map(([event, count]) => ({ event, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Conversion rate
  const conversionRate = enrollments > 0 ? Math.round((completedPayments / enrollments) * 100) : 0;

  return {
    totalEvents: events.length,
    uniqueUsers,
    averageSessionDuration,
    pageViews,
    buttonClicks,
    formSubmissions,
    conversionRate,
    topPages,
    topEvents
  };
}
