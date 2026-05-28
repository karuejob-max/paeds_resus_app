import { useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AHA_HUB_STALE_MS } from "@/const/aha-hub-query";

/** Warm AHA hub dashboard cache (single round-trip: programs + enrollments). */
export function usePrefetchAhaHub() {
  const utils = trpc.useUtils();
  const { user } = useAuth();

  return useCallback(() => {
    if (!user) return;
    void utils.courses.getAhaHubDashboard.prefetch(undefined, { staleTime: AHA_HUB_STALE_MS });
  }, [utils, user]);
}
