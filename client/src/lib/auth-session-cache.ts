import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";

export type AuthMe = inferRouterOutputs<AppRouter>["auth"]["me"];

const STORAGE_KEY = "paeds-resus-user-info";

/**
 * Synchronous read of last known session snapshot (written by useAuth after each auth.me result).
 * - `undefined` — no prior snapshot (first visit or cleared storage); wait for network.
 * - `null` — last known state was signed out; can render unauthenticated immediately.
 * - User object — optimistic signed-in UI while auth.me refetches to validate the cookie.
 */
export function readCachedAuthMe(): AuthMe | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return undefined;
    if (raw === "null") return null;
    return JSON.parse(raw) as AuthMe;
  } catch {
    return undefined;
  }
}
