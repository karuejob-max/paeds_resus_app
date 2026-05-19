/**
 * Browser session id shared across analytics calls (matches useAnalytics / PSOT §8 standard path).
 */
export function getAnalyticsSessionId(): string {
  if (typeof window === "undefined") return "server";
  const stored = sessionStorage.getItem("analytics_session_id");
  if (stored) return stored;
  const newId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  sessionStorage.setItem("analytics_session_id", newId);
  return newId;
}
