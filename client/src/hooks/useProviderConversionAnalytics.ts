import { useCallback, useState } from "react";
import { trpc } from "@/lib/trpc";

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  const key = "provider_conversion_session_id";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const created = `provider_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(key, created);
  return created;
}

export function useProviderConversionAnalytics(pageUrl: string) {
  const [sessionId] = useState(getSessionId);
  const trackEventMutation =
    ((trpc as unknown as {
      events?: { trackEvent?: { useMutation?: () => { mutate?: (input: unknown) => void } } };
    }).events?.trackEvent?.useMutation?.() as { mutate?: (input: unknown) => void } | undefined) ?? null;

  const track = useCallback(
    (eventType: string, eventName: string, eventData?: Record<string, unknown>) => {
      trackEventMutation?.mutate?.({
        eventType,
        eventName,
        pageUrl,
        sessionId,
        eventData: {
          ...(eventData ?? {}),
          timestamp: new Date().toISOString(),
        },
      });
    },
    [pageUrl, sessionId, trackEventMutation]
  );

  return { track };
}
