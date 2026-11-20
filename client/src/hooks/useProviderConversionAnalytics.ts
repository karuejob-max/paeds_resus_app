import { useCallback, useRef, useState } from "react";
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
  // Mutation results are new objects on pending/success/error renders. Depending
  // on that object makes effects using `track` send another event on every render.
  const mutateRef = useRef(trackEventMutation?.mutate);
  mutateRef.current = trackEventMutation?.mutate;

  const track = useCallback(
    (eventType: string, eventName: string, eventData?: Record<string, unknown>) => {
      mutateRef.current?.({
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
    [pageUrl, sessionId]
  );

  return { track };
}
