import { getLoginUrl } from "@/const";
import {
  clearAuthSessionCache,
  readCachedAuthMe,
  writeAuthMeCache,
} from "@/lib/auth-session-cache";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  const cachedMe = useMemo(() => readCachedAuthMe(), []);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
    /** Show last-known user while validating cookie with server (does not skip refetch). */
    ...(cachedMe !== undefined ? { placeholderData: () => cachedMe } : {}),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
      clearAuthSessionCache();
    },
  });

  const logout = useCallback(async () => {
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
      utils.auth.me.setData(undefined, null);
      clearAuthSessionCache();
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

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
