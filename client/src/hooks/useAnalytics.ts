import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

export type EventType =
  | "page_view"
  | "button_click"
  | "form_submission"
  | "course_view"
  | "pricing_calculator_used"
  | "institutional_inquiry"
  | "enrollment_started"
  | "payment_initiated"
  | "video_watched"
  | "testimonial_viewed";

// Generate or retrieve session ID
function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  const stored = sessionStorage.getItem("analytics_session_id");
  if (stored) return stored;
  const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem("analytics_session_id", newId);
  return newId;
}

/**
 * Hook to track user interactions and page views
 * Automatically tracks page views on mount
 */
export function useAnalytics(pageName: string) {
  const trackEventMutation = trpc.events.trackEvent.useMutation();
  const [sessionId] = useState(getSessionId());

  // Track page view on component mount
  useEffect(() => {
    trackPageView(pageName);
  }, [pageName]);

  const trackPageView = (page: string) => {
    trackEventMutation.mutate({
      eventType: "page_view",
      eventName: `Viewed ${page}`,
      pageUrl: page,
      sessionId: sessionId,
      eventData: {
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      },
    });
  };

  const trackButtonClick = (buttonName: string, metadata?: Record<string, any>) => {
    trackEventMutation.mutate({
      eventType: "button_click",
      eventName: `Clicked ${buttonName}`,
      pageUrl: pageName,
      sessionId: sessionId,
      eventData: {
        buttonName,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    });
  };

  const trackFormSubmission = (formName: string, metadata?: Record<string, any>) => {
    trackEventMutation.mutate({
      eventType: "form_submission",
      eventName: `Submitted ${formName}`,
      pageUrl: pageName,
      sessionId: sessionId,
      eventData: {
        formName,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    });
  };

  const trackCourseView = (courseId: string, courseName: string) => {
    trackEventMutation.mutate({
      eventType: "course_view",
      eventName: `Viewed course: ${courseName}`,
      pageUrl: pageName,
      sessionId: sessionId,
      eventData: {
        courseId,
        courseName,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const trackPricingCalculatorUsed = (staffCount: number, totalCost: number) => {
    trackEventMutation.mutate({
      eventType: "pricing_calculator_used",
      eventName: "Used pricing calculator",
      pageUrl: pageName,
      sessionId: sessionId,
      eventData: {
        staffCount,
        totalCost,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const trackInstitutionalInquiry = (inquiryType: string, metadata?: Record<string, any>) => {
    trackEventMutation.mutate({
      eventType: "institutional_inquiry",
      eventName: `Institutional inquiry: ${inquiryType}`,
      pageUrl: pageName,
      sessionId: sessionId,
      eventData: {
        inquiryType,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    });
  };

  const trackEnrollmentStarted = (courseId: string, courseName: string) => {
    trackEventMutation.mutate({
      eventType: "enrollment_started",
      eventName: `Started enrollment: ${courseName}`,
      pageUrl: pageName,
      sessionId: sessionId,
      eventData: {
        courseId,
        courseName,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const trackPaymentInitiated = (amount: number, courseId: string) => {
    trackEventMutation.mutate({
      eventType: "payment_initiated",
      eventName: "Initiated payment",
      pageUrl: pageName,
      sessionId: sessionId,
      eventData: {
        amount,
        courseId,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const trackVideoWatched = (videoId: string, videoTitle: string, duration: number) => {
    trackEventMutation.mutate({
      eventType: "video_watched",
      eventName: `Watched video: ${videoTitle}`,
      pageUrl: pageName,
      sessionId: sessionId,
      eventData: {
        videoId,
        videoTitle,
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const trackTestimonialViewed = (hospitalName: string, testimonialId: string) => {
    trackEventMutation.mutate({
      eventType: "testimonial_viewed",
      eventName: `Viewed testimonial: ${hospitalName}`,
      pageUrl: pageName,
      sessionId: sessionId,
      eventData: {
        hospitalName,
        testimonialId,
        timestamp: new Date().toISOString(),
      },
    });
  };

  return {
    trackPageView,
    trackButtonClick,
    trackFormSubmission,
    trackCourseView,
    trackPricingCalculatorUsed,
    trackInstitutionalInquiry,
    trackEnrollmentStarted,
    trackPaymentInitiated,
    trackVideoWatched,
    trackTestimonialViewed,
  };
}
