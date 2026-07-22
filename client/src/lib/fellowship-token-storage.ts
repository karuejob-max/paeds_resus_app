/**
 * Client-side storage for the Fellowship pseudonymous token
 * (Observation Architecture v1.1 §5.5, gap-analysis queue item #10).
 *
 * Deliberately plain localStorage, not tied to the logged-in account in any
 * way — that's the whole point. If the provider clears browser data or
 * switches devices without their recovery code, the token (and its streak)
 * is genuinely gone; see server/lib/fellowship-token.ts's doc comment for
 * why that's an accepted trade-off rather than a bug.
 */
const STORAGE_KEY = "paeds_resus_fellowship_pseudonymous_token";

export function getStoredFellowshipTokenId(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing / storage disabled — pseudonymous mode just won't persist across sessions.
    return null;
  }
}

export function setStoredFellowshipTokenId(tokenId: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, tokenId);
  } catch {
    // Ignore — see getStoredFellowshipTokenId.
  }
}

export function clearStoredFellowshipTokenId(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
