import { getLoginUrl } from "@/const";
import { clearOfflineSnapshotsForActor } from "@/lib/offline/platformOfflineStore";
import {
  clearAuthSessionCache,
  readCachedAuthMe,
  writeAuthMeCache,
} from "@/lib/auth-session-cache";
import { trpc } from "@/lib/trpc";
import { getQueryKey } from "@trpc/react-query";
import { TRPCClientError } from "@trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();

  const cachedMe = useMemo(() => readCachedAuthMe(), []);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
    /** Show last-known user while validating cookie with server (does not skip refetch). */
    ...(cachedMe !== undefined ? { placeholderData: () => cachedMe } : {}),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const logoutMutation = trpc.auth.logout.useMutation();

  const logout = useCallback(async () => {
    const actorId = meQuery.data?.id ?? cachedMe?.id;
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      const authMePath = JSON.stringify(getQueryKey(trpc.auth.me)[0]);
      queryClient.removeQueries({
        predicate: (query) => JSON.stringify(query.queryKey[0]) !== authMePath,
      });
      utils.auth.me.setData(undefined, null);
      clearAuthSessionCache();
      if (actorId != null) {
        await clearOfflineSnapshotsForActor(actorId).catch((error: unknown) => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("platform-offline-storage-error", {
              detail: { message: error instanceof Error ? error.message : "Cached account data could not be cleared." },
            }));
          }
        });
      }
      await utils.auth.me.invalidate();
    }
  }, [cachedMe?.id, logoutMutation, meQuery.data?.id, queryClient, utils]);

  const hasCachedSession = cachedMe !== undefined;
  const sessionSettled = meQuery.isFetchedAfterMount;

  const state = useMemo(() => {
    const effectiveUser = sessionSettled
      ? (meQuery.data ?? null)
      : hasCachedSession
        ? cachedMe
        : null;

    return {
      user: effectiveUser,
      /** Block only when there is no cached snapshot and auth.me has not returned yet. */
      loading: (!hasCachedSession && !sessionSettled) || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(effectiveUser),
      /** Server-confirmed session — use for redirects and legal gates, not fast paint. */
      sessionSettled,
    };
  }, [
    cachedMe,
    hasCachedSession,
    meQuery.data,
    meQuery.error,
    logoutMutation.error,
    logoutMutation.isPending,
    sessionSettled,
  ]);

  useEffect(() => {
    if (!sessionSettled) return;
    writeAuthMeCache(meQuery.data ?? null);
  }, [meQuery.data, sessionSettled]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (!sessionSettled || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    sessionSettled,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
